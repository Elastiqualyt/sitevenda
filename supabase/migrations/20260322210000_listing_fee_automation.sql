-- Taxa de listagem: cobrança na criação do anúncio, renovação após 4 meses (valor alinhado com web/lib/seller-fees.ts: 0,30 €).
-- Requer migração anterior que remove CHECK balance >= 0 em profiles.

alter table public.products
  add column if not exists listing_fee_valid_until timestamptz,
  add column if not exists listing_fee_paused boolean not null default false;

comment on column public.products.listing_fee_valid_until is 'Fim do período pago de listagem; após esta data renova-se a taxa se o anúncio continuar ativo.';
comment on column public.products.listing_fee_paused is 'Se true, não há cobranças de renovação (ex.: esgotado).';

-- Tipo de transação para taxas de listagem
alter table public.balance_transactions drop constraint if exists balance_transactions_type_check;
alter table public.balance_transactions
  add constraint balance_transactions_type_check
  check (type in ('deposit', 'withdrawal', 'sale', 'purchase', 'listing_fee'));

-- Anúncios existentes: período de graça até 4 meses após esta migração (sem débito retroativo)
update public.products
set listing_fee_valid_until = now() + interval '4 months',
    listing_fee_paused = false
where listing_fee_valid_until is null;

create index if not exists idx_products_listing_fee_due
  on public.products (listing_fee_valid_until)
  where listing_fee_valid_until is not null
    and listing_fee_paused = false;

-- Valor fixo (espelha SELLER_LISTING_FEE_EUR na app; ver também 20260323210000_listing_fee_amount_030_eur.sql)
create or replace function public.listing_fee_amount()
returns numeric
language sql
immutable
as $$
  select 0.30::numeric;
$$;

-- Após inserir produto: debitar taxa inicial e definir período de 4 meses
create or replace function public.trg_products_listing_fee_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fee numeric := public.listing_fee_amount();
begin
  update public.profiles
  set balance = balance - fee,
      updated_at = now()
  where id = new.seller_id;

  insert into public.balance_transactions (user_id, type, amount, status, reference)
  values (
    new.seller_id,
    'listing_fee',
    fee,
    'completed',
    'Taxa de listagem — novo anúncio ' || new.id::text
  );

  update public.products
  set listing_fee_valid_until = now() + interval '4 months',
      listing_fee_paused = false,
      updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists products_listing_fee_after_insert on public.products;
create trigger products_listing_fee_after_insert
  after insert on public.products
  for each row
  execute function public.trg_products_listing_fee_after_insert();

-- Reposição de stock após esgotado: novo período pago
create or replace function public.trg_products_listing_fee_after_restock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fee numeric := public.listing_fee_amount();
begin
  if old.stock is distinct from new.stock
     and coalesce(old.stock, 0) = 0
     and coalesce(new.stock, 0) > 0
     and new.listing_fee_paused = true
     and new.type in ('physical', 'reutilizados')
  then
    update public.profiles
    set balance = balance - fee,
        updated_at = now()
    where id = new.seller_id;

    insert into public.balance_transactions (user_id, type, amount, status, reference)
    values (
      new.seller_id,
      'listing_fee',
      fee,
      'completed',
      'Taxa de listagem — novo período após repor stock — produto ' || new.id::text
    );

    update public.products
    set listing_fee_valid_until = now() + interval '4 months',
        listing_fee_paused = false,
        updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists products_listing_fee_after_restock on public.products;
create trigger products_listing_fee_after_restock
  after update of stock, listing_fee_paused on public.products
  for each row
  execute function public.trg_products_listing_fee_after_restock();

-- Renovações em atraso: vários períodos seguidos se o cron falhou (máx. 48 por produto por execução)
create or replace function public.process_listing_fee_renewals()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  fee numeric := public.listing_fee_amount();
  r record;
  v_until timestamptz;
  v_paused boolean;
  v_type text;
  v_stock int;
  v_seller uuid;
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
        p.stock,
        p.seller_id
      into v_until, v_paused, v_type, v_stock, v_seller
      from public.products p
      where p.id = r.id
      for update;

      exit when v_paused;
      exit when v_until is null;
      exit when v_until > now();
      exit when v_type not in ('digital', 'physical', 'reutilizados');
      exit when v_type <> 'digital' and coalesce(v_stock, 0) <= 0;
      exit when inner_n >= max_inner;

      update public.profiles
      set balance = balance - fee,
          updated_at = now()
      where id = v_seller;

      insert into public.balance_transactions (user_id, type, amount, status, reference)
      values (
        v_seller,
        'listing_fee',
        fee,
        'completed',
        'Taxa de listagem — renovação (4 meses) — produto ' || r.id::text
      );

      update public.products
      set listing_fee_valid_until = listing_fee_valid_until + interval '4 months',
          updated_at = now()
      where id = r.id;

      n := n + 1;
      inner_n := inner_n + 1;
    end loop;
  end loop;

  return json_build_object('renewal_charges', n);
end;
$$;

comment on function public.process_listing_fee_renewals() is
  'Chamada periódica (cron) para debitar renovações da taxa de listagem após cada período de 4 meses.';

revoke all on function public.process_listing_fee_renewals() from public;
grant execute on function public.process_listing_fee_renewals() to service_role;
