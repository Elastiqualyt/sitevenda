-- Regulariza taxa de listagem (valor à data: listing_fee_amount()) em produtos já vendidos sem movimento listing_fee
-- (anúncios cobertos pela migração inicial sem débito retroativo). Idempotente.

do $$
declare
  fee numeric := public.listing_fee_amount();
  r record;
begin
  for r in
    select distinct p.id as pid, p.seller_id as sid
    from public.products p
    inner join public.order_items oi on oi.product_id = p.id
    inner join public.orders o on o.id = oi.order_id and o.status = 'paid'
    where not exists (
      select 1
      from public.balance_transactions bt
      where bt.user_id = p.seller_id
        and bt.type = 'listing_fee'
        and bt.reference like '%' || p.id::text || '%'
    )
  loop
    update public.profiles
      set balance = balance - fee,
          updated_at = now()
      where id = r.sid;

    insert into public.balance_transactions (user_id, type, amount, status, reference)
    values (
      r.sid,
      'listing_fee',
      fee,
      'completed',
      'Taxa de listagem — regularização (anúncio sem cobrança à publicação) — produto ' || r.pid::text
    );
  end loop;
end $$;
