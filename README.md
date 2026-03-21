# Marketplace

Plataforma para comprar e vender **artigos digitais**, **artesanato** e **itens usados**.  
Site em Next.js (web) e app em React Native (iOS/Android), com a mesma API.

---

## Onde está cada coisa

| Parte        | Pasta      | Tecnologia        |
|-------------|------------|-------------------|
| Site + API  | `web/`     | Next.js (TypeScript) |
| App móvel   | `app/`     | React Native      |
| Base de dados + ficheiros | Supabase | Ver `ARCHITECTURE.md` |
| Hosting site | Vercel    | Ver abaixo        |

Recomendações detalhadas de **hosting, storage e base de dados** estão em **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Resumo da infraestrutura recomendada

- **Site e API**: **Vercel** (deploy do projeto `web/`)
- **Base de dados**: **Supabase** (PostgreSQL)
- **Storage** (imagens e ficheiros digitais): **Supabase Storage**
- **Autenticação**: **Supabase Auth** (quando implementares login)

O app React Native usa a mesma API (URL do site na Vercel).

---

## Como correr o projeto

### 1. Base de dados (Supabase)

1. Cria um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, corre o ficheiro `supabase/schema.sql` para criar a tabela `products` e políticas RLS.
3. Em **Storage**, cria dois buckets: `product-images` (público) e `digital-files` (privado).
4. Em **Settings > API** copia a **Project URL** e a **anon public** key.

### 2. Site (Next.js)

```bash
cd web
cp .env.example .env.local
```

Edita `.env.local` e coloca:

- `NEXT_PUBLIC_SUPABASE_URL` = URL do projeto Supabase  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave anon do Supabase  

Depois:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). A API está em `http://localhost:3000/api/products`.

### 3. Deploy do site (Vercel)

1. Faz push do código para um repositório Git (GitHub/GitLab).
2. Em [vercel.com](https://vercel.com), importa o repositório e escolhe a pasta **web** como root (ou configura o root no projeto).
3. Nas variáveis de ambiente do projeto Vercel, adiciona `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Faz deploy. O site e a API ficam em `https://teu-projeto.vercel.app`.

### 4. App React Native

```bash
cd app
npm install
```

Para testar a API a partir do app, indica a URL do backend:

- **Android emulador**: em `app/src/config/api.ts` usa por exemplo `http://10.0.2.2:3000` para o teu Next.js em `localhost:3000`.
- **Produção**: usa a URL da Vercel, ex. `https://teu-projeto.vercel.app`.

Podes usar variável de ambiente (ex. `EXPO_PUBLIC_API_URL` se usares Expo, ou um ficheiro de config) para alternar entre dev e prod.

Depois:

```bash
npm run android   # ou
npm run ios
```

(Requer Android Studio / Xcode e ambiente React Native configurado.)

---

## Estrutura do projeto

```
.
├── ARCHITECTURE.md    # Onde alocar site, DB, storage
├── README.md          # Este ficheiro
├── web/               # Site + API (Next.js)
│   ├── app/
│   │   ├── api/products/   # API usada pelo site e pelo app
│   │   ├── produtos/      # Páginas de listagem e detalhe
│   │   ├── vender/
│   │   ├── entrar/
│   │   └── page.tsx       # Página inicial
│   └── lib/               # Supabase client, tipos
├── app/               # App React Native
│   ├── App.tsx
│   └── src/
│       ├── config/    # URL da API
│       ├── screens/   # Home, Produtos, Detalhe
│       ├── services/  # fetchProducts, fetchProduct
│       └── types/
└── supabase/
    └── schema.sql     # Tabela products e RLS
```

---

## Próximos passos

1. **Autenticação**: Supabase Auth para login/registo (web e app).
2. **Formulário de venda**: página “Vender” para criar produtos e fazer upload de imagem/ficheiro para Supabase Storage.
3. **Pagamentos**: integrar Stripe ou outro processador para compras.
4. **Encomendas**: tabela `orders` e fluxo de compra (digital = link de download; físico = morada de envio).

A API em `/api/products` já está preparada para ser usada pelo site e pelo app em React Native.
