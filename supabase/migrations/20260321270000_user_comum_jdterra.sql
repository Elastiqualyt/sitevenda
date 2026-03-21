-- Garantir utilizador comum (não vendedor) para a conta indicada.
-- A app passa a usar profiles.user_type como fonte de verdade (metadados Auth já não forçam "vendedor").

update public.profiles
set user_type = 'comum', updated_at = now()
where id = (select id from auth.users where email = 'jdterra@outlook.com' limit 1);

-- Alinhar metadados da sessão Supabase Auth (opcional mas recomendado)
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_type', 'comum')
where email = 'jdterra@outlook.com';
