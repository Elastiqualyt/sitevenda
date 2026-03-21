-- Políticas de Storage para uploads a partir da app (utilizador autenticado).
-- Cria os buckets "product-images" e "digital-files" no Dashboard (Storage) antes ou depois.

drop policy if exists "Autenticados podem enviar para product-images" on storage.objects;
drop policy if exists "Autenticados podem enviar para digital-files" on storage.objects;
drop policy if exists "Leitura pública product-images" on storage.objects;
drop policy if exists "Leitura pública digital-files" on storage.objects;

create policy "Autenticados podem enviar para product-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Autenticados podem enviar para digital-files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'digital-files');

create policy "Leitura pública product-images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

create policy "Leitura pública digital-files"
  on storage.objects for select
  to public
  using (bucket_id = 'digital-files');
