'use client';

import {
  BUYER_TRANSACTION_FEE_FIXED_EUR,
  BUYER_TRANSACTION_FEE_PERCENT,
  formatEurPt,
} from '@/lib/seller-fees';

/** Política de taxas (checkout) em formulários de anúncio. */
export function SellerListingPolicy() {
  return (
    <section className="seller-policy" aria-labelledby="seller-policy-heading">
      <h2 id="seller-policy-heading" className="seller-policy__title">
        Política de utilização — taxas para vendedores
      </h2>
      <p className="seller-policy__intro">
        A taxa de serviço no checkout é paga pelo comprador (ver tabela abaixo).
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
              <td>Taxa no checkout (comprador)</td>
              <td>Cobrada ao comprador no pagamento</td>
              <td>
                <strong>{BUYER_TRANSACTION_FEE_PERCENT} % + {formatEurPt(BUYER_TRANSACTION_FEE_FIXED_EUR)}</strong>{' '}
                sobre o valor do artigo (e portes, quando aplicável). Esta taxa é paga pelo comprador e financia o
                serviço da plataforma.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="seller-policy__details">
        O vendedor recebe no saldo o valor declarado do anúncio (e portes definidos), sem desconto desta taxa de
        checkout.
      </p>
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
