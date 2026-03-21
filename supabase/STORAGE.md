# Supabase Storage

A aplicação usa buckets de ficheiros. Cria-os no [Dashboard Supabase](https://supabase.com/dashboard) → teu projeto → **Storage** → **New bucket**.

## Políticas (RLS) e uploads

Se o formulário de **novo produto** ficar muito tempo em “A guardar…” ou mostrar erro de permissão ao enviar fotos/PDF:

1. Garante que os buckets existem (`product-images`, `digital-files`, e `avatars` para perfil).
2. Aplica as migrações de Storage (`supabase db push`). A cadeia inclui:
   - `20260321200000_storage_upload_policies.sql` (primeira versão das políticas),
   - `20260321220000_storage_rls_insert_update.sql` — **substitui** as anteriores para `product-images` e `digital-files`: permite **INSERT** e **UPDATE** (necessário com `upsert: true`) e exige que o caminho comece pela pasta do utilizador (`{auth.uid()}/...`), como a app envia.
   - `20260321210000_storage_avatars_policies.sql` e `20260321221000_storage_avatars_update_rls.sql` — políticas do bucket `avatars` (INSERT + UPDATE alinhados com o mesmo padrão de pastas).

Se o erro for **"new row violates row-level security policy"** no upload (fotos do anúncio ou PDF digital), confirma que estas migrações foram aplicadas e que os buckets existem. Com **upsert**, falta de política de **UPDATE** também pode causar este erro.

Sem políticas corretas para utilizadores **authenticated**, o upload falha.

---

A aplicação usa estes buckets (entre outros):

## 1. `product-images` – fotos dos anúncios

Para **qualquer** anúncio poder ter foto carregada do computador (JPEG, PNG, WebP):

- Nome do bucket: `product-images`
- **Public bucket**: ativa (para a foto aparecer nos listados e na página do produto).

Em **todos os tipos de produto** podes carregar **até 5** imagens do anúncio; os URLs ficam em `products.gallery_urls` (array JSON). A **primeira** é a capa (`image_url`) nas listagens; as restantes aparecem na página do produto.

Em **Produto Digital**, além disso, o ficheiro para download do cliente vai para o bucket `digital-files` (`file_url`).

## 2. `avatars` – fotos de perfil

Para a foto de perfil do utilizador:

- Nome do bucket: `avatars`
- **Public bucket**: ativa (para a imagem aparecer no site).

## 3. `digital-files` – ficheiros de Produto Digital

Para anexar o ficheiro do produto (PDF ou imagem) na categoria **Produto Digital**:

- Nome do bucket: `digital-files`
- **Public bucket**: ativa (para os compradores acederem ao link do ficheiro).

Se usares buckets privados, configura políticas (Policies) para upload por utilizadores autenticados e leitura conforme a tua lógica.
