import Link from 'next/link';

export const metadata = {
  title: 'Guia do vendedor — Portes, região e taxas',
};

export default function VendedorGuiaPage() {
  return (
    <div className="vendedor-page vendedor-guia">
      <h1>Guia do vendedor</h1>
      <p className="vendedor-guia__lead">
        Portes opcionais, envio só na tua região e taxas da plataforma (listagem e comissão sobre vendas).
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
                <td>Taxa de listagem</td>
                <td>Publicar ou renovar um anúncio</td>
                <td>
                  Cerca de <strong>0,17 €</strong> por listagem; válida <strong>4 meses</strong> ou até vender (o que
                  ocorrer primeiro).
                </td>
              </tr>
              <tr>
                <td>Comissão sobre a venda</td>
                <td>Comissão sobre o valor pago</td>
                <td>
                  <strong>6,5 %</strong> sobre o preço da venda, <strong>incluindo os portes</strong> que definires no
                  anúncio (quando entram no pagamento).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          A <strong>comissão de 6,5 %</strong> é aplicada ao <strong>creditar o teu saldo</strong> após o pagamento
          confirmado: recebes o valor <strong>líquido</strong>; em Finanças vês a referência com bruto e comissão.
        </p>
        <p className="vendedor-guia__note">
          A taxa de listagem está na política; a cobrança automática desta taxa pode ser evoluída na plataforma.
        </p>
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
