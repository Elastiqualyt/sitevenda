-- Pesquisa de membros por nome (público: id, nome, avatar). Usado pelo header e /api/profiles/search.

create or replace function public.search_public_profiles(p_query text, p_limit int default 10)
returns table (id uuid, full_name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  with q as (
    select lower(trim(coalesce(p_query, ''))) as t
  )
  select p.id, p.full_name, p.avatar_url
  from public.profiles p
  cross join q
  where length(q.t) >= 2
    and p.full_name is not null
    and trim(p.full_name) <> ''
    and position(q.t in lower(coalesce(p.full_name, ''))) > 0
  order by p.full_name asc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

comment on function public.search_public_profiles(text, int) is
  'Lista perfis cujo nome contém o texto (case-insensitive), para pesquisa pública.';

revoke all on function public.search_public_profiles(text, int) from public;
grant execute on function public.search_public_profiles(text, int) to anon, authenticated;
