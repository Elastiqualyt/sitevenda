-- Storage: fotos de perfil (bucket "avatars")
-- O bucket deve existir no Dashboard; estas políticas permitem upload e leitura pública.

drop policy if exists "Autenticados podem enviar para avatars" on storage.objects;
drop policy if exists "Leitura pública avatars" on storage.objects;

create policy "Autenticados podem enviar para avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

create policy "Leitura pública avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');
