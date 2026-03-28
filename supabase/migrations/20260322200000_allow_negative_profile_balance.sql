-- Permite saldo negativo quando a taxa de listagem é debitada sem saldo suficiente (política em web/lib/seller-fees.ts).
-- Remove o CHECK balance >= 0 adicionado em 20240319000000_seller_dashboard.sql
alter table public.profiles drop constraint if exists profiles_balance_check;

-- Nome alternativo (se a BD tiver sido criada com outro nome para o mesmo check)
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'profiles'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* 'balance\s*>=\s*0'
  loop
    execute format('alter table public.profiles drop constraint %I', r.conname);
  end loop;
end $$;
