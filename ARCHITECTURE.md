# Arquitetura e Infraestrutura — Marketplace

## Visão geral

- **Web**: Next.js (TypeScript) — mesma linguagem que o app, API partilhada.
- **App**: React Native — iOS e Android.
- **API**: Next.js API Routes (ou futuro backend separado) consumida por web e app.

---

## Onde alocar cada parte

### 1. **Site (frontend + API)**

| Opção | Prós | Contras | Custo inicial |
|-------|------|---------|----------------|
| **Vercel** (recomendado) | Deploy automático do Next.js, CDN global, SSL, escalável | Limites no plano gratuito | Grátis → ~20€/mês |
| **Railway** | Simples, DB e app no mesmo lugar | Menos focado em frontend | ~5€/mês |
| **Render** | Grátis para começar, fácil | Cold starts no free tier | Grátis → ~7€/mês |

**Recomendação: Vercel** — melhor experiência com Next.js e ideal para web + API.

---

### 2. **Base de dados**

| Opção | Prós | Contras | Custo inicial |
|-------|------|---------|----------------|
| **Supabase** (recomendado) | PostgreSQL, auth, storage e realtime num só serviço | — | Grátis até 500MB |
| **Neon** | PostgreSQL serverless, branch por ambiente | Só DB | Grátis generoso |
| **PlanetScale** | MySQL serverless, branching | MySQL (não Postgres) | Grátis |

**Recomendação: Supabase** — base de dados + ficheiros + autenticação num único painel.

---

### 3. **Storage (ficheiros digitais e imagens)**

| Opção | Prós | Contras | Custo inicial |
|-------|------|---------|----------------|
| **Supabase Storage** (recomendado) | Integrado com Supabase, CDN, políticas por bucket | — | Incluído no free tier |
| **Cloudflare R2** | Sem egress fees, S3-compatible | Configuração extra | Grátis até 10GB |
| **AWS S3** | Padrão de mercado, muito escalável | Mais complexo e custos de saída | Pay-as-you-go |

**Recomendação: Supabase Storage** — buckets para imagens de produtos e para ficheiros digitais (downloads).

---

## Resumo da stack recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTES                              │
├─────────────────────────────┬───────────────────────────────┤
│   Web (Next.js)             │   App (React Native)          │
│   https://teu-site.vercel.app│   iOS + Android               │
└──────────────┬──────────────┴──────────────┬────────────────┘
               │                             │
               │      API (Next.js API       │
               │      Routes ou Vercel       │
               │      Serverless)            │
               │                             │
               └──────────────┬──────────────┘
                              │
               ┌──────────────▼──────────────┐
               │       VERCEL (hosting)      │
               │   Next.js + API Routes      │
               └──────────────┬──────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   SUPABASE      │ │   SUPABASE      │ │   SUPABASE      │
│   PostgreSQL    │ │   Storage       │ │   Auth          │
│   (produtos,    │ │   (imagens,     │ │   (login,       │
│   users,        │ │   ficheiros     │ │   registo)      │
│   encomendas)   │ │   digitais)     │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

- **Um domínio**: Vercel para site e API.
- **Um fornecedor de backend**: Supabase para DB + Storage + Auth.
- **Um código de API**: serve o site e o app React Native.

---

## Tipos de produtos suportados

1. **Digitais** — ficheiros (PDF, PNG, etc.) em Supabase Storage; link de download após pagamento.
2. **Artesanato / físicos** — imagens no Storage; endereço de envio na encomenda.
3. **Usados** — igual a físicos; categoria/tag "usado" para filtros.

---

## Próximos passos técnicos

1. Conta em [Vercel](https://vercel.com) e [Supabase](https://supabase.com).
2. Configurar variáveis de ambiente (Supabase URL + key) na Vercel.
3. Deploy do projeto Next.js na Vercel (conectar repositório Git).
4. No Supabase: criar tabelas (users, products, orders, etc.) e buckets de storage.
5. Desenvolver app React Native a apontar para a mesma API (URL da Vercel).

Com esta base, o site fica pronto para web e para evoluir para app com React Native consumindo a mesma API.
