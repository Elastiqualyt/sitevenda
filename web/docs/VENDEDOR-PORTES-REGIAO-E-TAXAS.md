# Guia do vendedor — portes, região e taxas

Este documento resume o que podes configurar nos anúncios e que taxas se aplicam às vendas na loja (EUR, Portugal).

## 1. Portes de envio (artigos físicos e reutilizados)

- Nos formulários **Novo produto** e **Editar produto**, quando o anúncio **não é digital**, tens o campo **Portes (€)**.
- **Campo vazio:** não é somado nenhum valor ao pagamento pelo site — combina portes com o comprador (ex.: mensagens). Útil se quiseres negociar caso a caso.
- **0 €:** indicas **envio grátis**; no checkout é mostrado como tal e não há linha extra de portes no pagamento.
- **Valor maior que 0:** esse montante em euros é **somado uma vez por linha de carrinho** (por produto/anúncio), juntamente com o preço × quantidade. Aparece no Stripe como linha separada «Portes: [nome do produto]».

**Nota:** Produtos **digitais** não têm portes na plataforma.

## 2. Envio só na tua região

- Podes ativar **«Só envio na minha região»**.
- Isto é **informativo**: a plataforma não valida moradas. O comprador deve **confirmar contigo** (Mensagens) se o envio é possível antes de contar com o prazo.
- Recomenda-se indicar na **descrição** do anúncio a zona onde envias (ex.: concelho, ilha, «só Portugal continental», etc.).

## 3. Taxas cobradas pela plataforma

Valores indicativos (ver também `/vender` e o formulário de anúncio):

| Tipo | O que é | Valor indicado |
|------|---------|----------------|
| **Taxa de checkout (comprador)** | Cobrada ao comprador no pagamento | **6 % + 0,50 €** sobre o valor do artigo (e portes quando aplicável). |

- O vendedor recebe no saldo o valor declarado no anúncio (e portes definidos), sem desconto desta taxa de checkout.

## 4. Onde editar

- **Novo / Editar produto:** `/vendedor/produtos/novo` e editar cada anúncio.
- **Política de taxas** no ecrã de criação/edição (aceitação obrigatória ao guardar).
- **Página «Vender»:** `/vender` — resumo e ligação à política.

## 5. Resumo para o comprador

- No **detalhe do produto** e no **carrinho** vê-se se há portes a pagar no checkout.
- Se marcares **só na tua região**, o comprador vê um aviso para confirmar contigo.

---

*Última atualização: documento alinhado com `web/lib/seller-fees.ts`, `web/lib/product-shipping.ts` e o webhook Stripe.*
