-- Pedidos pagos via Stripe Checkout (webhook confirma o pagamento)

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users (id) on delete cascade,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  total_amount decimal(10, 2) not null check (total_amount >= 0),
  currency text not null default 'eur',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  paid_at timestamptz
);

create unique index if not exists idx_orders_stripe_session
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists idx_orders_buyer on public.orders (buyer_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  seller_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  quantity int not null check (quantity >= 1 and quantity <= 99),
  unit_price decimal(10, 2) not null check (unit_price >= 0),
  line_total decimal(10, 2) not null check (line_total >= 0)
);

create index if not exists idx_order_items_order on public.order_items (order_id);
create index if not exists idx_order_items_seller on public.order_items (seller_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Pedidos: comprador vê os seus"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid());

create policy "Pedidos: vendedor vê pedidos com os seus artigos"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1
      from public.order_items oi
      where oi.order_id = orders.id and oi.seller_id = auth.uid()
    )
  );

create policy "Pedidos: comprador cria"
  on public.orders for insert
  to authenticated
  with check (buyer_id = auth.uid());

create policy "Pedidos: comprador atualiza pendente"
  on public.orders for update
  to authenticated
  using (buyer_id = auth.uid() and status = 'pending')
  with check (buyer_id = auth.uid());

create policy "Linhas: comprador ou vendedor vê"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
    or seller_id = auth.uid()
  );

create policy "Linhas: comprador insere no seu pedido"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );
