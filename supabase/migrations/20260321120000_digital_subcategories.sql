-- Subcategorias de Produto Digital (checkboxes no formulário; array de slugs)
alter table public.products
  add column if not exists digital_subcategories text[] not null default '{}';

create index if not exists idx_products_digital_subcategories_gin
  on public.products using gin (digital_subcategories);
