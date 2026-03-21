-- avatars: INSERT + UPDATE com pasta = auth.uid() (perfil usa "{user_id}/avatar-...")

drop policy if exists "Autenticados podem enviar para avatars" on storage.objects;
drop policy if exists "Autenticados podem atualizar avatars" on storage.objects;
drop policy if exists "Leitura pública avatars" on storage.objects;

create policy "Autenticados podem enviar para avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Autenticados podem atualizar avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Leitura pública avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');
