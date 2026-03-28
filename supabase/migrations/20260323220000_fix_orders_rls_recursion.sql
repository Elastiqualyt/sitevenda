-- Corrige "infinite recursion detected in policy for relation orders":
-- a policy do vendedor em `orders` consultava `order_items`, e a de `order_items` consultava `orders`,
-- criando um ciclo. Funções SECURITY DEFINER leem as tabelas sem reavaliar RLS nas subconsultas.

create or replace function public.order_row_buyer_is_current(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id and o.buyer_id = auth.uid()
  );
$$;

create or replace function public.order_row_has_seller_line(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.order_items oi
    where oi.order_id = p_order_id and oi.seller_id = auth.uid()
  );
$$;

comment on function public.order_row_buyer_is_current(uuid) is
  'Usado em RLS de order_items: evita subconsulta a orders com políticas que referenciam order_items.';
comment on function public.order_row_has_seller_line(uuid) is
  'Usado em RLS de orders (vendedor): evita subconsulta a order_items com políticas que referenciam orders.';

grant execute on function public.order_row_buyer_is_current(uuid) to authenticated;
grant execute on function public.order_row_has_seller_line(uuid) to authenticated;

drop policy if exists "Pedidos: vendedor vê pedidos com os seus" on public.orders;
create policy "Pedidos: vendedor vê pedidos com os seus"
  on public.orders for select
  to authenticated
  using (public.order_row_has_seller_line(orders.id));

drop policy if exists "Linhas: comprador ou vendedor vê" on public.order_items;
create policy "Linhas: comprador ou vendedor vê"
  on public.order_items for select
  to authenticated
  using (
    public.order_row_buyer_is_current(order_id)
    or seller_id = auth.uid()
  );

drop policy if exists "Linhas: comprador insere no seu pedido" on public.order_items;
create policy "Linhas: comprador insere no seu pedido"
  on public.order_items for insert
  to authenticated
  with check (public.order_row_buyer_is_current(order_id));
