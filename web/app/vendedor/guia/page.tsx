import Link from 'next/link';
import {
  BUYER_TRANSACTION_FEE_FIXED_EUR,
  BUYER_TRANSACTION_FEE_PERCENT,
  formatEurPt,
} from '@/lib/seller-fees';

export const metadata = {
  title: 'Guia do vendedor — Portes, região e taxas',
};

export default function VendedorGuiaPage() {
  return (
    <div className="vendedor-page vendedor-guia">
      <h1>Guia do vendedor</h1>
      <p className="vendedor-guia__lead">
        Portes opcionais, envio só na tua região e taxa de serviço no checkout (paga pelo comprador).
      </p>

      <section className="vendedor-guia__section">
        <h2>1. Portes de envio</h2>
        <p>
          Em <strong>Novo produto</strong> e <strong>Editar produto</strong>, para artigos <strong>físicos</strong> ou{' '}
          <strong>reutilizados</strong>, podes preencher o campo <strong>Portes (€)</strong>:
        </p>
        <ul>
          <li>
            <strong>Campo vazio:</strong> não é cobrado porte no pagamento pelo site — combina com o comprador (ex. em Mensagens).
          </li>
          <li>
            <strong>0 €:</strong> envio <strong>grátis</strong>; aparece assim na página do produto e no checkout.
          </li>
          <li>
            <strong>Valor maior que 0:</strong> esse montante é <strong>somado uma vez por linha</strong> do carrinho (por
            anúncio), além do preço × quantidade. No pagamento Stripe aparece uma linha separada «Portes».
          </li>
        </ul>
        <p className="vendedor-guia__note">Produtos <strong>digitais</strong> não usam portes na plataforma.</p>
      </section>

      <section className="vendedor-guia__section">
        <h2>2. Só envio na minha região</h2>
        <p>
          A opção <strong>«Só envio na minha região»</strong> avisa o comprador de que deves confirmar morada e
          disponibilidade antes do envio. A plataforma <strong>não valida</strong> moradas — usa as{' '}
          <strong>Mensagens</strong> para combinar.
        </p>
        <p>Recomenda-se descrever na <strong>descrição do anúncio</strong> a zona onde envias.</p>
      </section>

      <section className="vendedor-guia__section">
        <h2>3. Taxas cobradas</h2>
        <p>
          A plataforma cobra ao <strong>comprador</strong>, no pagamento, uma taxa de serviço sobre cada linha do
          pedido.
        </p>
        <div className="seller-policy__table-wrap">
          <table className="seller-policy__table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>O que é</th>
                <th>Valor indicado (PT / EUR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Taxa no checkout (comprador)</td>
                <td>Taxa da plataforma no pagamento</td>
                <td>
                  <strong>{BUYER_TRANSACTION_FEE_PERCENT} % + {formatEurPt(BUYER_TRANSACTION_FEE_FIXED_EUR)}</strong>{' '}
                  sobre o valor do artigo (e portes quando aplicável), paga pelo comprador.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Recebes no teu saldo o valor declarado no anúncio (e portes definidos), sem desconto desta taxa.</p>
      </section>

      <section className="vendedor-guia__section">
        <h2>4. Onde configurar</h2>
        <ul>
          <li>
            <Link href="/vendedor/produtos/novo">Novo produto</Link> e editar cada anúncio em Meus produtos
          </li>
          <li>
            <Link href="/vender">Página Vender</Link> — resumo e política de taxas
          </li>
          <li>
            Documento em Markdown (repositório): <code>web/docs/VENDEDOR-PORTES-REGIAO-E-TAXAS.md</code>
          </li>
        </ul>
      </section>

      <p>
        <Link href="/vendedor/produtos" className="btn btn-secondary">
          ← Voltar a Meus produtos
        </Link>
      </p>
    </div>
  );
}
