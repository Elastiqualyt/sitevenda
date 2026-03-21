-- Renomear tipo de produto "used" → "reutilizados"
alter table public.products drop constraint if exists products_type_check;

update public.products set type = 'reutilizados' where type = 'used';

alter table public.products
  add constraint products_type_check
  check (type in ('digital', 'physical', 'reutilizados'));
