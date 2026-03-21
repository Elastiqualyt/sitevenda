# Deploy: Supabase + Vercel

Guia para colocar o **Next.js** (`web/`) online na **Vercel** com base de dados **Supabase** em produção.

---

## Pré-requisitos

- Conta em [supabase.com](https://supabase.com) e [vercel.com](https://vercel.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado (`supabase --version`)
- Repositório Git (GitHub/GitLab/Bitbucket) — a Vercel faz deploy a partir do Git
- Se ainda não tens Git no projeto: `git init`, commit, e push para o remoto

---

## 1. Supabase (projeto em produção)

### 1.1 Criar o projeto

1. [Dashboard Supabase](https://supabase.com/dashboard) → **New project**
2. Escolhe região, password da BD, e **repara na versão do Postgres** (deve alinhar com `supabase/config.toml` → `major_version` se usares CLI local)

### 1.2 Ligar o CLI ao projeto remoto

Na pasta do projeto (`c:\etsy`):

```bash
cd c:\etsy
supabase login
supabase link --project-ref <PROJECT_REF>
```

O **Project ref** está em: Dashboard → **Project Settings** → **General** → *Reference ID*.

### 1.3 Aplicar migrations (schema)

```bash
supabase db push
```

Isto aplica todas as migrações em `supabase/migrations/` na base remota.

### 1.4 Storage (buckets)

Segue [`supabase/STORAGE.md`](./supabase/STORAGE.md): cria os buckets (`product-images`, `digital-files`, `avatars`, etc.) e confirma que as migrações de Storage já foram aplicadas com o `db push`.

### 1.5 API Keys (para a Vercel)

Dashboard → **Project Settings** → **API**:

| Variável | Onde usar |
|----------|-----------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** (secret) | `SUPABASE_SERVICE_ROLE_KEY` — só servidor, nunca no cliente |

### 1.6 Auth (URLs de redirect)

Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://teu-dominio.vercel.app` (ou domínio customizado)
- **Redirect URLs**: adiciona `https://teu-dominio.vercel.app/**` e, em dev, `http://localhost:3000/**`

Sem isto, login/registo e OAuth podem falhar em produção.

---

## 2. Vercel (app Next.js)

### 2.1 Novo projeto

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**
2. Importa o repositório Git
3. **Importante — Root Directory**: define **`web`** (a app Next.js está dentro de `web/`, não na raiz do monorepo)
4. Framework: **Next.js** (detetado automaticamente)
5. **Build Command**: `npm run build` (default)
6. **Output**: default do Next

### 2.2 Variáveis de ambiente (Production)

Em **Project** → **Settings** → **Environment Variables**, adiciona (mínimo):

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (secret) |
| `NEXT_PUBLIC_APP_URL` | `https://teu-projeto.vercel.app` (ou domínio final) |
| `STRIPE_SECRET_KEY` | chave Stripe **live** em produção |
| `STRIPE_WEBHOOK_SECRET` | signing secret do webhook de produção |

Opcional:

- `NEXT_PUBLIC_APP_URL` — se não definires, o código usa `VERCEL_URL` (a Vercel define automaticamente) para `getAppOrigin()`; definir explicitamente evita surpresas com domínios customizados.

Marca todas como **Production** (e **Preview** se quiseres PRs com as mesmas keys de teste).

### 2.3 Stripe em produção

1. Dashboard Stripe → **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://teu-dominio.vercel.app/api/stripe/webhook`
3. Eventos: pelo menos **`checkout.session.completed`** (é o que o código processa em `web/app/api/stripe/webhook/route.ts`)
4. Copia o **Signing secret** para `STRIPE_WEBHOOK_SECRET` na Vercel

### 2.4 Deploy

- **Push** para a branch principal → deploy automático
- Ou **Redeploy** no dashboard após alterares env vars

---

## 3. Checklist rápido

- [ ] `supabase link` + `supabase db push`
- [ ] Buckets Storage criados (ver `STORAGE.md`)
- [ ] Env vars na Vercel (Supabase + Stripe + `NEXT_PUBLIC_APP_URL` se necessário)
- [ ] Auth URLs no Supabase com o domínio Vercel
- [ ] Webhook Stripe aponta para `https://.../api/stripe/webhook`

---

## Problemas comuns

| Problema | O que verificar |
|----------|------------------|
| Build falha na Vercel | Root Directory = **`web`** |
| `Invalid API key` / Supabase | Keys de **Production** no projeto certo |
| Login não redireciona | **Redirect URLs** no Supabase Auth |
| Upload de imagens falha | Buckets + políticas RLS (`STORAGE.md`) |
| Pagamentos não atualizam | Webhook Stripe + `STRIPE_WEBHOOK_SECRET` |

---

## Deploy via CLI (fluxo habitual)

Na raiz do repo (migrações Supabase):

```bash
cd c:\etsy
supabase db push
```

Na app Next.js (Vercel — produção):

```bash
cd c:\etsy\web
npm run deploy
# equivalente: npx vercel --prod
```

Primeira vez: `npx vercel login` e, no primeiro `vercel`, associar ao projeto / conta. Variáveis: `vercel env pull` ou dashboard.

Preview (não produção):

```bash
npm run deploy:preview
```
