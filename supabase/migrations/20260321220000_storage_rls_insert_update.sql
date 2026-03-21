-- Storage: políticas completas para INSERT + UPDATE (upsert) e pasta = auth.uid()
-- O caminho na app é sempre "{user_id}/..." — alinhado com as recomendações Supabase.

drop policy if exists "Autenticados podem enviar para product-images" on storage.objects;
drop policy if exists "Autenticados podem enviar para digital-files" on storage.objects;
drop policy if exists "Autenticados podem atualizar product-images" on storage.objects;
drop policy if exists "Autenticados podem atualizar digital-files" on storage.objects;
drop policy if exists "Leitura pública product-images" on storage.objects;
drop policy if exists "Leitura pública digital-files" on storage.objects;

create policy "Autenticados podem enviar para product-images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Autenticados podem enviar para digital-files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'digital-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Autenticados podem atualizar product-images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Autenticados podem atualizar digital-files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'digital-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'digital-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Leitura pública product-images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

create policy "Leitura pública digital-files"
  on storage.objects for select
  to public
  using (bucket_id = 'digital-files');
