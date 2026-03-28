-- Sistema de seguidores entre perfis (seguir / deixar de seguir)
create table if not exists public.profile_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint profile_follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists idx_profile_follows_following_id on public.profile_follows (following_id);
create index if not exists idx_profile_follows_follower_id on public.profile_follows (follower_id);

alter table public.profile_follows enable row level security;

create policy "Todos podem ver relações de follow"
  on public.profile_follows
  for select
  to anon, authenticated
  using (true);

create policy "Utilizador autenticado pode seguir"
  on public.profile_follows
  for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "Utilizador autenticado pode deixar de seguir"
  on public.profile_follows
  for delete
  to authenticated
  using (auth.uid() = follower_id);

-- Contadores públicos + estado relativo ao utilizador autenticado.
create or replace function public.get_profile_follow_stats(p_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'followers_count', (
      select count(*)::bigint
      from public.profile_follows pf
      where pf.following_id = p_id
    ),
    'following_count', (
      select count(*)::bigint
      from public.profile_follows pf
      where pf.follower_id = p_id
    ),
    'is_following', (
      case
        when auth.uid() is null then false
        else exists (
          select 1
          from public.profile_follows pf
          where pf.follower_id = auth.uid()
            and pf.following_id = p_id
        )
      end
    )
  );
$$;

grant execute on function public.get_profile_follow_stats(uuid) to anon, authenticated;

-- Seguir/deixar de seguir um perfil (toggle).
create or replace function public.toggle_profile_follow(p_target_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_now_following boolean := false;
  v_followers_count bigint := 0;
  v_following_count bigint := 0;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_target_id is null then
    return json_build_object('ok', false, 'error', 'invalid_target');
  end if;

  if v_uid = p_target_id then
    return json_build_object('ok', false, 'error', 'cannot_follow_self');
  end if;

  if exists (
    select 1
    from public.profile_follows pf
    where pf.follower_id = v_uid
      and pf.following_id = p_target_id
  ) then
    delete from public.profile_follows
    where follower_id = v_uid
      and following_id = p_target_id;
    v_now_following := false;
  else
    insert into public.profile_follows (follower_id, following_id)
    values (v_uid, p_target_id)
    on conflict do nothing;
    v_now_following := true;
  end if;

  select count(*)::bigint into v_followers_count
  from public.profile_follows
  where following_id = p_target_id;

  select count(*)::bigint into v_following_count
  from public.profile_follows
  where follower_id = p_target_id;

  return json_build_object(
    'ok', true,
    'is_following', v_now_following,
    'followers_count', v_followers_count,
    'following_count', v_following_count
  );
end;
$$;

grant execute on function public.toggle_profile_follow(uuid) to authenticated;
