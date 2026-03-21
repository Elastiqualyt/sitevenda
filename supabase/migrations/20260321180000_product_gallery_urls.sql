-- Galeria de imagens do anúncio (ex.: produto digital — várias fotos)
alter table public.products
  add column if not exists gallery_urls jsonb not null default '[]'::jsonb;

comment on column public.products.gallery_urls is 'URLs das imagens do anúncio (array JSON de strings).';
