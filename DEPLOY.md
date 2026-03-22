# Deploy: Supabase + Vercel

Guia para aplicar a base de dados no **Supabase** e publicar o site Next.js na **Vercel**.

> **Segurança:** nunca commits ` .env.local`, chaves `service_role` ou segredos Stripe no Git.

---

## Pré-requisitos

- Conta [Supabase](https://supabase.com) com um projeto já criado.
- Conta [Vercel](https://vercel.com) (login com GitHub/GitLab/Bitbucket ajuda a ligar o repositório).
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalada.
- [Stripe](https://stripe.com) (se quiseres pagamentos em produção).

### Instalar Supabase CLI

```powershell
npm install -g supabase
```

Confirma: `supabase --version`

---

## 1. Supabase — migrações (base de dados)

Na raiz do repositório (pasta que contém `supabase/`):

### 1.1 Login

```powershell
supabase login
```

Abre o browser para autenticar.

### 1.2 Ligar o projeto local ao projeto na nuvem

No dashboard Supabase: **Settings → General → Reference ID** (é o `project-ref`).

```powershell
cd supabase
supabase link --project-ref <O_TEU_PROJECT_REF>
```

Segue as instruções (pode pedir a password da base de dados).

### 1.3 Aplicar todas as migrações

```powershell
supabase db push
```

Isto aplica os ficheiros em `supabase/migrations/` à base **remota**.  
Se aparecerem conflitos ou erros de ordem, resolve primeiro em ambiente de teste ou com backup.

### 1.4 Storage (buckets)

As políticas RLS dos buckets estão nas migrações; confirma no dashboard **Storage** que existem os buckets necessários (ex.: avatares, imagens de produtos, ficheiros digitais).  
Mais detalhes: `supabase/STORAGE.md`.

### 1.5 Chaves para a Vercel (copiar do Supabase)

Em **Settings → API**:

| Nome na Vercel | Onde copiar |
|----------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` **(só servidor — webhook Stripe)** |

---

## 2. Vercel — site (`web/`)

### 2.1 Ligar o repositório

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New… → Project**.
2. Importa o repositório Git onde está este código.
3. **Importante:** em **Root Directory**, define **`web`** (o Next.js está dentro de `web/`, não na raiz do monorepo).

### 2.2 Variáveis de ambiente (Production)

Em **Settings → Environment Variables**, adiciona (mínimo):

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (API routes / webhook) |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe (modo Live em produção) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret do webhook de produção (ver §3) |

Opcional mas recomendado:

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_APP_URL` | URL canónica do site, ex. `https://terraplace.pt`. Se omitires, o código usa `VERCEL_URL` (domínio de pré-visualização `.vercel.app`). |

**Não** marques `SUPABASE_SERVICE_ROLE_KEY` nem `STRIPE_*` como expostas ao browser (só servidor).

### 2.3 Build

- **Framework Preset:** Next.js  
- **Build Command:** `npm run build` (por defeito dentro de `web/`)  
- **Output:** automático  

Faz **Deploy**. Após o primeiro deploy, copia o URL (ex. `https://xxx.vercel.app`).

### 2.4 Deploy a partir do terminal (alternativa)

Na pasta `web/` (com [Vercel CLI](https://vercel.com/docs/cli)):

```powershell
cd web
npx vercel login
npx vercel --prod
```

As variáveis podem ser definidas no dashboard ou com `vercel env pull` / `vercel env add`.

---

## 3. Stripe (produção)

1. Dashboard Stripe → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://<TEU_DOMINIO>/api/stripe/webhook`  
   (substitui pelo domínio Vercel ou domínio personalizado.)
3. Evento: **`checkout.session.completed`**.
4. Copia o **Signing secret** → variável `STRIPE_WEBHOOK_SECRET` na Vercel (ambiente **Production**).
5. Usa chaves **Live** em produção (`STRIPE_SECRET_KEY`).

Detalhes: `web/STRIPE.md`.

---

## 4. Verificação pós-deploy

- [ ] Site abre sem erro 500.
- [ ] Login/registo funciona (Supabase Auth).
- [ ] Listagem de produtos (`/produtos`) e API `GET /api/products`.
- [ ] Pagamento de teste em modo Live (valor pequeno) ou validação do webhook nos logs Vercel / Stripe.

---

## Resolução rápida de problemas

| Problema | O que verificar |
|----------|-----------------|
| Erro ao `db push` | Versão Postgres remota vs `major_version` em `supabase/config.toml`; credenciais do `link`. |
| Site sem dados | Migrações aplicadas? RLS permite leitura onde for preciso? |
| Webhook Stripe falha | URL exata com HTTPS; `STRIPE_WEBHOOK_SECRET` correto; logs na Vercel (Functions) e Stripe. |
| Redirect Stripe errado | `NEXT_PUBLIC_APP_URL` ou domínio Vercel; ver `web/lib/app-url.ts`. |

---

## Ficheiros de referência no repo

- `web/.env.example` — lista de variáveis.
- `web/STRIPE.md` — fluxo Stripe e webhook.
- `web/DEV.md` — desenvolvimento local.
- `supabase/migrations/` — histórico da base de dados.
