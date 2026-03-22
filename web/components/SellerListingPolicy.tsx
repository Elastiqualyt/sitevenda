'use client';

import {
  SELLER_LISTING_FEE_EUR,
  SELLER_LISTING_VALIDITY_MONTHS,
  SELLER_TRANSACTION_FEE_PERCENT,
  formatEurPt,
} from '@/lib/seller-fees';

/** Política de taxas exibida ao publicar ou renovar anúncios. */
export function SellerListingPolicy() {
  const listingFee = formatEurPt(SELLER_LISTING_FEE_EUR);

  return (
    <section className="seller-policy" aria-labelledby="seller-policy-heading">
      <h2 id="seller-policy-heading" className="seller-policy__title">
        Política de utilização — taxas para vendedores
      </h2>
      <p className="seller-policy__intro">
        Ao publicares ou renovares um anúncio nesta loja (EUR), aplicam-se as regras indicativas seguintes:
      </p>
      <div className="seller-policy__table-wrap">
        <table className="seller-policy__table">
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col">O que é</th>
              <th scope="col">Valor indicado (PT / loja em EUR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Taxa de listagem</td>
              <td>Publicar ou renovar um anúncio</td>
              <td>
                Cerca de <strong>{listingFee}</strong> por listagem; válida{' '}
                <strong>{SELLER_LISTING_VALIDITY_MONTHS} meses</strong> ou até vender (o que ocorrer primeiro).
              </td>
            </tr>
            <tr>
              <td>Taxa de transação</td>
              <td>Comissão sobre a venda</td>
              <td>
                <strong>{SELLER_TRANSACTION_FEE_PERCENT} %</strong> sobre o preço da venda,{' '}
                <strong>incluindo os portes</strong> que definires.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Confirmação obrigatória antes de submeter o formulário de anúncio. */
export function SellerListingPolicyAcceptance({ inputId = 'seller-policy-accept' }: { inputId?: string }) {
  return (
    <label className="seller-policy__accept">
      <input type="checkbox" id={inputId} required />
      <span>Li e aceito a política de taxas acima. Entendo que publicar ou guardar este anúncio implica aceitar estas condições.</span>
    </label>
  );
}
