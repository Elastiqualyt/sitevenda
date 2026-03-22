-- Portes opcionais por anúncio e opção "só na minha região"
-- Linhas de pedido: subtotal do produto + portes = line_total

alter table public.products
  add column if not exists shipping_fee_eur decimal(10, 2);

alter table public.products
  add column if not exists ships_only_same_region boolean not null default false;

comment on column public.products.shipping_fee_eur is
  'Portes fixos somados ao pagamento por linha de pedido. NULL = não usar portes na plataforma; 0 = envio grátis; >0 = valor em EUR.';
comment on column public.products.ships_only_same_region is
  'Se true, o vendedor indica envio apenas na própria região (combinação com o comprador fora da app).';

alter table public.order_items
  add column if not exists product_subtotal_eur decimal(10, 2);

alter table public.order_items
  add column if not exists shipping_fee_eur decimal(10, 2) not null default 0;

comment on column public.order_items.product_subtotal_eur is 'Preço × quantidade (sem portes).';
comment on column public.order_items.shipping_fee_eur is 'Portes desta linha incluídos em line_total.';

update public.order_items
set
  product_subtotal_eur = line_total,
  shipping_fee_eur = 0
where product_subtotal_eur is null;
