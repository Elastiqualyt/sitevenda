-- Anúncio oculto: fora da vitrine pública; vendedor e compradores com compra paga continuam a ver.

alter table public.products
  add column if not exists hidden boolean not null default false;

comment on column public.products.hidden is
  'Se true, o anúncio não aparece nas listagens públicas; o vendedor gere na área privada. Compradores com pedido pago deste produto mantêm acesso ao registo (ex.: PDF).';

-- Permite à política de produtos verificar compras sem ciclo RLS em order_items/orders.
create or replace function public.product_row_buyer_paid(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.order_items oi
    inner join public.orders o on o.id = oi.order_id
    where oi.product_id = p_product_id
      and o.buyer_id = auth.uid()
      and o.status = 'paid'
  );
$$;

comment on function public.product_row_buyer_paid(uuid) is
  'RLS em products: comprador com linha paga deste produto pode ler o registo (ex.: file_url para digitais).';

grant execute on function public.product_row_buyer_paid(uuid) to authenticated;

drop policy if exists "Produtos são visíveis por todos" on public.products;
drop policy if exists "Produtos visíveis ou do vendedor" on public.products;

create policy "Produtos: vitrine ou vendedor ou comprador do artigo"
  on public.products for select
  using (
    coalesce(hidden, false) = false
    or auth.uid() = seller_id
    or public.product_row_buyer_paid(id)
  );
