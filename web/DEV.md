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

O site fica em: **http://localhost:3000** (ou **3001** se a 3000 estiver ocupada — vê a linha `Local:` no terminal).

### Página sem estilos (HTML cru) ou erros **500** em `/_next/static/...` (CSS/JS)

Isto pode aparecer em **qualquer** página (ex.: `/entrar` com ecrã branco e `Cannot find module './XXXX.js'` nos logs do terminal) — costuma ser **cache `.next` corrompido**, não um erro no código da página.

No **Windows** isto é frequente: **vários processos `node`**, **cache `.next` inconsistente** ou **antivírus** a bloquear ficheiros na pasta `.next` (problema conhecido no Next.js — ver [discussion #60185](https://github.com/vercel/next.js/discussions/60185)).

**Recomendado (repor tudo e usar Turbopack):**

```powershell
cd web
npm run dev:reset
```

Isto: liberta as portas **3000** e **3001**, apaga `.next` e arranca `next dev --turbo` (menos sensível a estes bloqueios que o Webpack clássico).

Se `dev:reset` não for suficiente:

1. No terminal do `next dev`, abre **exatamente** o URL indicado em `Local:` (`3000` ou `3001`).
2. Tenta **`npm run dev:turbo`** em vez de `npm run dev` (Turbopack).
3. Adiciona **exclusão** no antivírus para a pasta do projeto (ou pelo menos `web\.next`).
4. Faz **Ctrl+Shift+R** no browser.

**Comandos úteis:**

| Comando | O que faz |
|--------|-----------|
| `npm run dev` | Desenvolvimento normal (Webpack) |
| `npm run dev:turbo` | Desenvolvimento com **Turbopack** |
| `npm run dev:clean` | Apaga `.next` e `next dev` |
| `npm run dev:reset` | Mata portas 3000/3001, apaga `.next`, `next dev --turbo` |

**Produção local** (para confirmar que o código compila; costuma servir estáticos sem estes erros):

```powershell
cd web
npm run build
npm run start
```

Depois abre `http://localhost:3000` (para a 3000 estar livre).

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
