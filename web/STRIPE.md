# Pagamentos com Stripe

O site usa **Stripe Checkout** (página de pagamento alojada pela Stripe). O dinheiro entra na **conta Stripe da plataforma**; o código credita o **saldo interno** de cada vendedor em `profiles.balance` e regista `balance_transactions` (tipo `sale`).

> **Nota:** Isto não é [Stripe Connect](https://stripe.com/connect) (pagamentos diretos à conta do vendedor). Levantamentos reais para o banco do vendedor continuam a ser o teu processo (transferência, etc.). Para repartição automática por vendedor na Stripe, seria preciso evoluir para Connect.

## 1. Conta Stripe

1. Cria conta em [stripe.com](https://stripe.com).
2. No Dashboard, ativa o modo **Test** para desenvolvimento.

## 2. Chaves API

Em **Developers → API keys**:

- **Secret key** → `STRIPE_SECRET_KEY` (servidor apenas; nunca no browser).
- (Opcional) **Publishable key** → podes guardar como `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` para futuros componentes Stripe no cliente.

## 3. Webhook

1. **Developers → Webhooks → Add endpoint**
2. **URL:** `https://<teu-dominio>/api/stripe/webhook`  
   Localmente: usa [Stripe CLI](https://stripe.com/docs/stripe-cli):  
   `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Evento: **`checkout.session.completed`**
4. Copia o **Signing secret** → `STRIPE_WEBHOOK_SECRET`

## 4. Supabase (service role)

O webhook atualiza pedidos, saldos e carrinho com privilégios elevados. No projeto Supabase:

- **Settings → API → service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ Nunca expor esta chave no cliente ou no repositório público.

## 5. Variáveis de ambiente (Vercel / `.env.local`)

Ver `web/.env.example`.

- `NEXT_PUBLIC_APP_URL` — URL pública da app (ex. `https://web-xxx.vercel.app`), usada nos redirects do Checkout. Na Vercel podes omitir se usares `VERCEL_URL` (o código trata disso).

## 6. Base de dados

Aplica a migração:

`supabase/migrations/20260321260000_stripe_orders.sql`

```bash
npx supabase db push
```

## 7. Fluxo

1. Utilizador com sessão clica **Pagar com cartão (Stripe)** no carrinho.
2. `POST /api/stripe/create-checkout-session` cria `orders` + `order_items` e abre a sessão Stripe.
3. Após pagamento, a Stripe chama `POST /api/stripe/webhook`.
4. O webhook marca o pedido como pago, credita vendedores, reduz stock (produtos não digitais) e limpa o carrinho do comprador.

## 8. Testes

- Cartão de teste: `4242 4242 4242 4242`, qualquer data futura, CVC qualquer.
- Confirma no Dashboard Stripe (pagamentos) e no Supabase (`orders`, `profiles.balance`).
