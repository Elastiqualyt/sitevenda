# Testar em ambiente de desenvolvimento

## 1. Dependências

Na pasta do site (a partir da raiz do repositório):

```powershell
cd web
npm install
```

## 2. Variáveis de ambiente

O ficheiro **`.env.local`** já deve ter (não fazer commit):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Assim o ambiente local usa o **mesmo** projeto Supabase que a produção (ou cria outro projeto no Supabase para dev).

## 3. Arrancar o servidor

```powershell
cd web
npm run dev
```

Ou, sem instalar globalmente:

```powershell
npx next dev
```

O site fica em: **http://localhost:3000**

## 4. O que testar

- **http://localhost:3000** — página inicial  
- **http://localhost:3000/produtos** — listagem (API `/api/products`)  
- **http://localhost:3000/produtos/[id]** — detalhe de um produto  
- **http://localhost:3000/api/products** — resposta JSON da API  

Em desenvolvimento as alterações ao código recarregam automaticamente (hot reload).

## 5. Parar o servidor

No terminal onde correu `npm run dev`: **Ctrl+C**.

---

## Depuração: anúncio “fica a carregar” ou erro ao enviar fotos/PDF

### 1. Consola do browser (o mais útil)

O upload é feito **no teu PC** (cliente → Supabase), não passa pelo servidor Vercel.

1. Abre o site → **F12** (ou Ctrl+Shift+I) → separador **Consola**.
2. Cola e Enter:
   ```js
   localStorage.setItem('marketplace_debug_upload', '1')
   ```
3. Recarrega a página (**F5**), volta a preencher o formulário e submete.
4. Na consola, filtra por `Marketplace` — vês passos: galeria, ficheiro digital, `insert` na base de dados, tempos em ms.
5. Erros do Supabase aparecem como `[Marketplace upload ERROR]` (também sem modo debug em muitos casos).

Separador **Rede** (Network): filtra por `supabase` — vê pedidos `storage/v1/object/...` (upload) e `rest/v1/products` (inserir linha). Clica num pedido falhado → **Resposta** / **Cabeçalhos** para o código de erro.

### 2. Supabase (projeto na cloud)

- **Dashboard** → **Logs** → **Postgres** / **API** / **Auth** (consoante o problema).
- **Storage** → buckets `product-images` e `digital-files` → confirmar que existem e estão públicos ou com políticas corretas.

### 3. Vercel

Os uploads **não** aparecem nos logs de funções serverless, porque o ficheiro não passa pela Vercel. Só verias algo na Vercel se o teu código chamasse uma API route Next.js para fazer o upload (não é o caso atual).

### 4. Variável de ambiente (opcional)

Em `.env.local` podes definir `NEXT_PUBLIC_DEBUG_UPLOAD=true` para o mesmo efeito que o `localStorage` acima (sem precisar de colar na consola).
