-- Política: sem débito de «taxa de listagem» no saldo do vendedor.
-- Os custos da plataforma na compra refletem-se na taxa de checkout paga pelo comprador (app/web).
-- Mantém-se listing_fee_valid_until / listing_fee_paused e o cron apenas para janelas administrativas, sem cobrança.

create or replace function public.listing_fee_amount()
returns numeric
language sql
immutable
as $$
  select 0::numeric;
$$;

comment on function public.listing_fee_amount() is
  'Valor de taxa de listagem ao vendedor (0 € — desativado; histórico pode ter movimentos antigos).';

-- Nova publicação: só atualiza datas, sem movimento em profiles/balance_transactions
create or replace function public.trg_products_listing_fee_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set listing_fee_valid_until = now() + interval '4 months',
      listing_fee_paused = false,
      updated_at = now()
  where id = new.id;

  return new;
end;
$$;

-- Reposição de stock: sem débito
create or replace function public.trg_products_listing_fee_after_restock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.stock is distinct from new.stock
     and coalesce(old.stock, 0) = 0
     and coalesce(new.stock, 0) > 0
     and new.listing_fee_paused = true
     and new.type in ('physical', 'reutilizados')
  then
    update public.products
    set listing_fee_valid_until = now() + interval '4 months',
        listing_fee_paused = false,
        updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Renovações: avança a janela sem debitar saldo
create or replace function public.process_listing_fee_renewals()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_until timestamptz;
  v_paused boolean;
  v_type text;
  v_stock int;
  n int := 0;
  inner_n int;
  max_inner constant int := 48;
begin
  for r in
    select p.id
    from public.products p
    where not p.listing_fee_paused
      and p.listing_fee_valid_until is not null
      and p.listing_fee_valid_until <= now()
      and (p.type = 'digital' or p.stock > 0)
    order by p.listing_fee_valid_until asc
    limit 500
    for update skip locked
  loop
    inner_n := 0;
    loop
      select
        p.listing_fee_valid_until,
        p.listing_fee_paused,
        p.type::text,
        p.stock
      into v_until, v_paused, v_type, v_stock
      from public.products p
      where p.id = r.id
      for update;

      exit when v_paused;
      exit when v_until is null;
      exit when v_until > now();
      exit when v_type not in ('digital', 'physical', 'reutilizados');
      exit when v_type <> 'digital' and coalesce(v_stock, 0) <= 0;
      exit when inner_n >= max_inner;

      update public.products
      set listing_fee_valid_until = listing_fee_valid_until + interval '4 months',
          updated_at = now()
      where id = r.id;

      n := n + 1;
      inner_n := inner_n + 1;
    end loop;
  end loop;

  return json_build_object('renewal_window_updates', n);
end;
$$;

comment on function public.process_listing_fee_renewals() is
  'Cron: avança listing_fee_valid_until em períodos de 4 meses sem débito ao vendedor.';
