alter table public.profiles
  add column if not exists gender text,
  add column if not exists birth_date date;

comment on column public.profiles.gender is 'Género (valor livre ou slug escolhido na UI).';
comment on column public.profiles.birth_date is 'Data de nascimento (opcional).';
