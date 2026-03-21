# Supabase Storage

A aplicação usa dois buckets. Cria-os no [Dashboard Supabase](https://supabase.com/dashboard) → teu projeto → **Storage** → **New bucket**.

## 1. `product-images` – fotos dos anúncios

Para **qualquer** anúncio poder ter foto carregada do computador (JPEG, PNG, WebP):

- Nome do bucket: `product-images`
- **Public bucket**: ativa (para a foto aparecer nos listados e na página do produto).

## 2. `avatars` – fotos de perfil

Para a foto de perfil do utilizador:

- Nome do bucket: `avatars`
- **Public bucket**: ativa (para a imagem aparecer no site).

## 3. `digital-files` – ficheiros de Produto Digital

Para anexar o ficheiro do produto (PDF ou imagem) na categoria **Produto Digital**:

- Nome do bucket: `digital-files`
- **Public bucket**: ativa (para os compradores acederem ao link do ficheiro).

Se usares buckets privados, configura políticas (Policies) para upload por utilizadores autenticados e leitura conforme a tua lógica.
