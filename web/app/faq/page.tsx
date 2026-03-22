import type { Metadata } from 'next';
import Link from 'next/link';
import SitePageShell from '@/components/SitePageShell';
import { SITE_NAME, COMPANY_LEGAL_NAME, COMPANY_NIF } from '@/lib/site-brand';

export const metadata: Metadata = {
  title: 'Perguntas frequentes',
  description: `Respostas rápidas sobre compras, vendas e conta no ${SITE_NAME}.`,
};

const FAQ_ITEMS = [
  {
    q: `O que é o ${SITE_NAME}?`,
    a: `O ${SITE_NAME} é um marketplace onde podes comprar e vender artigos digitais, artesanato e produtos reutilizados, com pagamento seguro e área de mensagens entre utilizadores.`,
  },
  {
    q: 'Como compro um produto?',
    a: 'Cria conta ou inicia sessão, adiciona artigos ao carrinho e conclui o pagamento com cartão (Stripe). Recebes confirmação do pedido na tua área de conta.',
  },
  {
    q: 'Como me torno vendedor?',
    a: 'Precisas de uma conta de vendedor. No teu perfil ou na página Vender podes ativar essa opção. Depois publicas anúncios na área do vendedor e aceitas a política de taxas.',
  },
  {
    q: 'Que taxas existem para vendedores?',
    a: 'Aplica-se uma taxa de listagem por anúncio e uma comissão percentual sobre cada venda (incluindo portes quando definidos). O detalhe está na página Vender e no guia do vendedor.',
  },
  {
    q: 'Como funcionam os portes?',
    a: 'Em artigos físicos ou reutilizados, o vendedor pode definir portes em euros, envio grátis ou deixar em branco para combinar contigo. Vê a descrição do produto e o carrinho antes de pagar.',
  },
  {
    q: 'Quem opera o site?',
    a: (
      <>
        O serviço {SITE_NAME} é prestado no âmbito da <strong>{COMPANY_LEGAL_NAME}</strong> (NIF {COMPANY_NIF}).
        Mais informação em <Link href="/sobre">Sobre nós</Link> e{' '}
        <a href="https://elastiquality.pt" rel="noopener noreferrer" target="_blank">
          elastiquality.pt
        </a>
        .
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <SitePageShell>
      <div className="legal-page__article">
        <h1>Perguntas frequentes</h1>
        <p className="legal-page__lead">Respostas rápidas sobre o {SITE_NAME}.</p>

        <dl className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="faq-list__item">
              <dt className="faq-list__q">{item.q}</dt>
              <dd className="faq-list__a">{item.a}</dd>
            </div>
          ))}
        </dl>

        <p className="legal-page__outro">
          Não encontraste o que procuras? <Link href="/contactos">Contacta-nos</Link>.
        </p>
      </div>
    </SitePageShell>
  );
}
