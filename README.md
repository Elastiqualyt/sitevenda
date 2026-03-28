# TerraPlace

Marketplace para comprar e vender **artigos digitais**, **artesanato** e **produtos reutilizados**, com pagamento por **Stripe Checkout**, **Supabase** (PostgreSQL, Auth, Storage, Realtime) e site em **Next.js**. Existe também uma app **React Native** em `app/` que consome a mesma API.

Operação comercial: serviço do grupo **Elastiquality** (ver `web/lib/site-brand.ts` e páginas legais no site).

---

## Onde está cada coisa

| Parte | Pasta | Tecnologia |
|--------|--------|------------|
| Site + API | `web/` | Next.js 14 (App Router, TypeScript) |
| App móvel | `app/` | React Native |
| Esquema e migrações | `supabase/` | PostgreSQL (Supabase) |

Documentação adicional:

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — visão geral da arquitetura e dados.
- **[DEPLOY.md](DEPLOY.md)** — deploy (Supabase CLI, Vercel, Stripe).
- **`web/STRIPE.md`** — webhook Stripe e fluxo de pagamento.
- **`web/.env.example`** — variáveis de ambiente da app web.

---

## Funcionalidades (resumo)

- Contas com **Supabase Auth** (registo, sessão, perfis em `profiles`).
- **Produtos** com categorias, subcategorias (ex.: Produto Digital, Entretenimento), tipos físico/digital/reutilizados, carrinho e favoritos.
- **Pagamentos** com Stripe Checkout; pedidos em `orders` / `order_items`; confirmação via webhook e fallback `/api/stripe/confirm-session`.
- **Área Conta**: compras, pedidos (filtros em curso / concluídos / cancelados), cancelamento de pedidos **pendentes** (pagamento ainda não concluído) pela API `/api/orders/[id]/cancel`.
- **Mensagens** entre comprador e vendedor (`conversations` / `messages`, Realtime).
- **Vendedor**: produtos, importação CSV, área financeira/saldo (conforme migrações aplicadas).

---

## Como correr o projeto (desenvolvimento)

### 1. Supabase

1. Cria um projeto em [supabase.com](https://supabase.com).
2. Aplica as migrações em `supabase/migrations/` (recomendado: **Supabase CLI** `db push` com projeto ligado) ou, em alternativa, mantém `supabase/schema.sql` alinhado com as migrações.
3. Em **Storage**, garante buckets **`product-images`** (público) e **`digital-files`** (privado), conforme políticas do projeto.
4. Em **Settings → API**, copia **Project URL** e chave **anon**.

### 2. Site Next.js (`web/`)

```bash
cd web
cp .env.example .env.local
```

Edita **`.env.local`** (mínimo para desenvolvimento local):

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (JWT) |
| `NEXT_PUBLIC_APP_URL` | URL da app (ex. `http://localhost:3000`) — redirects Stripe |
| `STRIPE_SECRET_KEY` | Necessária para criar sessões de checkout e cancelar/expirar sessões Stripe |
| `STRIPE_WEBHOOK_SECRET` | Necessária em produção para validar o webhook `/api/stripe/webhook` |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor apenas: webhook Stripe, algumas rotas API; **não** expor no cliente |

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Rotas de API relevantes incluem `/api/products`, `/api/stripe/*`, etc.

Para desenvolvimento após alterações que afetem cache do Next.js, o projeto define atalhos em `web/package.json` (ex. `npm run dev:reset` — limpa `.next` e reinicia). Ver regras do repositório em `.cursor/rules/`.

### 3. Deploy (Vercel)

1. Root do projeto na Vercel: pasta **`web`** (ou equivalente).
2. Define as mesmas variáveis de ambiente (produção) na Vercel, incluindo `STRIPE_*`, `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_APP_URL` com o domínio público.

### 4. App React Native (`app/`)

```bash
cd app
npm install
```

Configura a URL do backend (Next.js) em `app/src/config/` conforme o ambiente (emulador vs produção). Em Android, o emulador costuma usar um host especial para alcançar `localhost` no PC (ex. `10.0.2.2`).

```bash
npm run android
# ou
npm run ios
```

---

## Estrutura do repositório (simplificada)

```
.
├── ARCHITECTURE.md
├── DEPLOY.md
├── README.md
├── web/                      # Site Next.js + API Routes
│   ├── app/                  # Páginas, layouts, route handlers (/api/...)
│   ├── components/
│   ├── lib/                  # Cliente Supabase, taxas, helpers
│   └── public/
├── app/                      # React Native
│   └── src/
├── supabase/
│   ├── migrations/           # Migrações SQL versionadas
│   └── schema.sql            # Referência / snapshot (usar migrações como fonte de verdade)
```

---

## Documentação e apoio

- Fluxo de pagamentos e variáveis Stripe: **`web/STRIPE.md`**.
- Questões de deploy: **`DEPLOY.md`**.
