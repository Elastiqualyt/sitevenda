-- Avaliações de produtos (apenas quem comprou com pedido pago pode avaliar)

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  reviewer_display_name text,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text default '',
  created_at timestamptz default now(),
  unique (product_id, reviewer_id)
);

create index if not exists idx_product_reviews_product on public.product_reviews (product_id);
create index if not exists idx_product_reviews_reviewer on public.product_reviews (reviewer_id);

alter table public.products
  add column if not exists review_avg numeric(10, 2),
  add column if not exists review_count int not null default 0;

comment on column public.products.review_avg is 'Média das avaliações (atualizada por trigger).';
comment on column public.products.review_count is 'Número de avaliações.';

alter table public.product_reviews enable row level security;

create policy "Avaliações visíveis para todos"
  on public.product_reviews for select
  to anon, authenticated
  using (true);

create policy "Comprador pode avaliar se comprou (pedido pago)"
  on public.product_reviews for insert
  to authenticated
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1
      from public.order_items oi
      inner join public.orders o on o.id = oi.order_id
      where oi.product_id = product_reviews.product_id
        and o.buyer_id = auth.uid()
        and o.status = 'paid'
    )
    and not exists (
      select 1
      from public.product_reviews pr
      where pr.product_id = product_reviews.product_id
        and pr.reviewer_id = auth.uid()
    )
  );

create policy "Autor pode apagar a própria avaliação"
  on public.product_reviews for delete
  to authenticated
  using (auth.uid() = reviewer_id);

-- Atualiza média no anúncio
create or replace function public.refresh_product_review_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  pid := coalesce(new.product_id, old.product_id);
  update public.products
  set
    review_avg = (select avg(rating)::numeric(10, 2) from public.product_reviews where product_id = pid),
    review_count = coalesce((select count(*)::int from public.product_reviews where product_id = pid), 0),
    updated_at = now()
  where id = pid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_product_reviews_stats on public.product_reviews;
create trigger trg_product_reviews_stats
  after insert or update or delete on public.product_reviews
  for each row execute function public.refresh_product_review_stats();

-- Dados públicos do vendedor (sem expor telefone/IBAN)
create or replace function public.get_seller_public(p_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'user_type', p.user_type
  )
  from public.profiles p
  where p.id = p_id;
$$;

grant execute on function public.get_seller_public(uuid) to anon, authenticated;

-- Média global do vendedor (todas as avaliações dos seus anúncios)
create or replace function public.get_seller_rating_stats(p_seller_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'avg_rating', coalesce(round(avg(pr.rating::numeric), 2), 0),
    'review_count', count(pr.id)::bigint
  )
  from public.product_reviews pr
  inner join public.products p on p.id = pr.product_id
  where p.seller_id = p_seller_id;
$$;

grant execute on function public.get_seller_rating_stats(uuid) to anon, authenticated;

-- Pode o utilizador atual deixar avaliação neste produto?
create or replace function public.buyer_can_review_product(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.order_items oi
      inner join public.orders o on o.id = oi.order_id
      where oi.product_id = p_product_id
        and o.buyer_id = auth.uid()
        and o.status = 'paid'
    )
    and not exists (
      select 1
      from public.product_reviews pr
      where pr.product_id = p_product_id
        and pr.reviewer_id = auth.uid()
    );
$$;

grant execute on function public.buyer_can_review_product(uuid) to authenticated;
