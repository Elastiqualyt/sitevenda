-- Subcategorias da categoria Entretenimento (checkboxes)
alter table public.products
  add column if not exists entertainment_subcategories text[] not null default '{}';

create index if not exists idx_products_entertainment_subcategories_gin
  on public.products using gin (entertainment_subcategories);
