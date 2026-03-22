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
| **Taxa de listagem** | Publicar ou renovar um anúncio | Cerca de **0,17 €** por listagem; válida **4 meses** ou até vender (o que ocorrer primeiro). |
| **Comissão sobre a venda** | Sobre o valor pago pelo comprador | **6,5 %** sobre o **preço do artigo + portes** que definiste no anúncio (quando os portes entram no pagamento). |

- A **comissão de 6,5 %** é descontada **automaticamente** ao **creditar o teu saldo interno** após o pagamento Stripe confirmado (webhook). O movimento em **Finanças** mostra o valor **líquido** e, na referência, o bruto e a comissão.
- A **taxa de listagem** (0,17 €) está descrita na política; a cobrança automática desta taxa pode ser um desenvolvimento futuro na plataforma.

## 4. Onde editar

- **Novo / Editar produto:** `/vendedor/produtos/novo` e editar cada anúncio.
- **Política de taxas** no ecrã de criação/edição (aceitação obrigatória ao guardar).
- **Página «Vender»:** `/vender` — resumo e ligação à política.

## 5. Resumo para o comprador

- No **detalhe do produto** e no **carrinho** vê-se se há portes a pagar no checkout.
- Se marcares **só na tua região**, o comprador vê um aviso para confirmar contigo.

---

*Última atualização: documento alinhado com `web/lib/seller-fees.ts`, `web/lib/product-shipping.ts` e o webhook Stripe.*
