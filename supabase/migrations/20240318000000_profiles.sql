-- Perfil do utilizador: nome e tipo (vendedor ou comum)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  user_type text not null default 'comum' check (user_type in ('vendedor', 'comum')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Utilizador vê o próprio perfil"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Utilizador atualiza o próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Inserir perfil ao criar conta (metadata do signUp)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, user_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'user_type', 'comum')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
