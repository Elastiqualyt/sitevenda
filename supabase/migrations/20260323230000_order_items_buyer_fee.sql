-- Taxa de transação cobrada ao comprador (6% + 0,50 €) por linha de pedido.
-- O vendedor mantém o valor declarado no anúncio (line_total).

alter table public.order_items
  add column if not exists buyer_fee_eur decimal(10, 2) not null default 0;

comment on column public.order_items.buyer_fee_eur is
  'Taxa cobrada ao comprador nesta linha (6% + 0,50 €), não creditada ao vendedor.';

