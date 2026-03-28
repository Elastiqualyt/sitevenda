-- Expor campos públicos adicionais para o cabeçalho do perfil público.
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
    'user_type', p.user_type,
    'address', p.address,
    'updated_at', p.updated_at
  )
  from public.profiles p
  where p.id = p_id;
$$;

grant execute on function public.get_seller_public(uuid) to anon, authenticated;
