-- Tabela de produtos (marketplace tipo Etsy)
-- Executar no SQL Editor do Supabase

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  price decimal(10,2) not null check (price >= 0),
  type text not null check (type in ('digital', 'physical', 'used')),
  category text default 'outros',
  image_url text,
  file_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices para listagens e filtros
create index if not exists idx_products_type on public.products(type);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_created_at on public.products(created_at desc);

-- RLS: leitura pública, escrita só para o dono
alter table public.products enable row level security;

create policy "Produtos são visíveis por todos"
  on public.products for select
  using (true);

create policy "Utilizadores autenticados podem inserir"
  on public.products for insert
  to authenticated
  with check (auth.uid() = seller_id);

create policy "Utilizador pode atualizar os seus produtos"
  on public.products for update
  to authenticated
  using (auth.uid() = seller_id);

create policy "Utilizador pode apagar os seus produtos"
  on public.products for delete
  to authenticated
  using (auth.uid() = seller_id);

-- Storage: buckets para imagens e ficheiros digitais
-- Criar no painel Supabase: Storage > New bucket
-- - "product-images" (público para leitura)
-- - "digital-files" (privado; acesso via signed URL após compra)
