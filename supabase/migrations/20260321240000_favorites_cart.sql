-- Favoritos (por utilizador autenticado)
create table if not exists public.product_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

create index if not exists idx_product_favorites_user on public.product_favorites (user_id);

alter table public.product_favorites enable row level security;

create policy "Favoritos: leitura do próprio"
  on public.product_favorites for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Favoritos: inserir próprio"
  on public.product_favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Favoritos: apagar próprio"
  on public.product_favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- Carrinho de compras
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity int not null default 1 check (quantity >= 1 and quantity <= 99),
  updated_at timestamptz default now(),
  unique (user_id, product_id)
);

create index if not exists idx_cart_items_user on public.cart_items (user_id);

alter table public.cart_items enable row level security;

create policy "Carrinho: leitura do próprio"
  on public.cart_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Carrinho: inserir próprio"
  on public.cart_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Carrinho: atualizar próprio"
  on public.cart_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Carrinho: apagar próprio"
  on public.cart_items for delete
  to authenticated
  using (auth.uid() = user_id);
