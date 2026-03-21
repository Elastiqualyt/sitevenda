-- Stock nos produtos
alter table public.products
  add column if not exists stock integer not null default 0 check (stock >= 0);

-- Saldo no perfil (vendedores e compradores)
alter table public.profiles
  add column if not exists balance decimal(10,2) not null default 0 check (balance >= 0);

-- Transações de saldo (depósito, saque, venda, compra)
create table if not exists public.balance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal', 'sale', 'purchase')),
  amount decimal(10,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'cancelled')),
  reference text,
  created_at timestamptz default now()
);

create index if not exists idx_balance_transactions_user on public.balance_transactions(user_id);
create index if not exists idx_balance_transactions_created on public.balance_transactions(created_at desc);

alter table public.balance_transactions enable row level security;

create policy "Utilizador vê as próprias transações"
  on public.balance_transactions for select to authenticated
  using (auth.uid() = user_id);

create policy "Sistema pode inserir transações"
  on public.balance_transactions for insert to authenticated
  with check (auth.uid() = user_id);

-- Conversas (comprador + vendedor + produto)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(product_id, buyer_id)
);

create index if not exists idx_conversations_seller on public.conversations(seller_id);
create index if not exists idx_conversations_buyer on public.conversations(buyer_id);

alter table public.conversations enable row level security;

create policy "Participantes veem a conversa"
  on public.conversations for select to authenticated
  using (auth.uid() = seller_id or auth.uid() = buyer_id);

create policy "Comprador pode iniciar conversa"
  on public.conversations for insert to authenticated
  with check (auth.uid() = buyer_id);

-- Mensagens
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id);

alter table public.messages enable row level security;

create policy "Participantes veem mensagens"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.seller_id = auth.uid() or c.buyer_id = auth.uid())
    )
  );

create policy "Participantes podem enviar mensagens"
  on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.seller_id = auth.uid() or c.buyer_id = auth.uid())
    )
  );

-- Atualizar updated_at da conversa quando há nova mensagem
create or replace function public.update_conversation_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages for each row execute function public.update_conversation_updated_at();

-- Funções para adicionar e sacar saldo (security definer para atualizar profiles)
create or replace function public.add_balance(amount_arg decimal)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  new_balance decimal;
begin
  if uid is null or amount_arg <= 0 then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;
  update public.profiles set balance = balance + amount_arg where id = uid;
  insert into public.balance_transactions (user_id, type, amount, status, reference)
  values (uid, 'deposit', amount_arg, 'completed', 'Depósito manual');
  select balance into new_balance from public.profiles where id = uid;
  return json_build_object('ok', true, 'balance', new_balance);
end;
$$;

create or replace function public.withdraw_balance(amount_arg decimal)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  current_balance decimal;
  new_balance decimal;
begin
  if uid is null or amount_arg <= 0 then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;
  select balance into current_balance from public.profiles where id = uid;
  if current_balance < amount_arg then
    return json_build_object('ok', false, 'error', 'insufficient');
  end if;
  update public.profiles set balance = balance - amount_arg where id = uid;
  insert into public.balance_transactions (user_id, type, amount, status, reference)
  values (uid, 'withdrawal', amount_arg, 'completed', 'Saque');
  select balance into new_balance from public.profiles where id = uid;
  return json_build_object('ok', true, 'balance', new_balance);
end;
$$;
