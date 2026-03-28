-- Taxa de listagem: 0,30 € por período (alinhado com web/lib/seller-fees.ts: SELLER_LISTING_FEE_EUR).

create or replace function public.listing_fee_amount()
returns numeric
language sql
immutable
as $$
  select 0.30::numeric;
$$;

comment on function public.listing_fee_amount() is
  'Valor fixo da taxa de listagem por período (0,30 €); espelha SELLER_LISTING_FEE_EUR na aplicação web.';
