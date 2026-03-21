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
