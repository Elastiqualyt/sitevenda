import type { Metadata } from 'next';
import SitePageShell from '@/components/SitePageShell';
import {
  SITE_NAME,
  SITE_TAGLINE,
  COMPANY_LEGAL_NAME,
  COMPANY_NIF,
  COMPANY_WEBSITE,
  COMPANY_WEBSITE_HOST,
  SITE_GROUP_LINE,
} from '@/lib/site-brand';

export const metadata: Metadata = {
  title: 'Sobre nós',
  description: `${SITE_NAME}: ${SITE_TAGLINE}. ${SITE_GROUP_LINE}`,
};

export default function SobrePage() {
  return (
    <SitePageShell>
      <article className="legal-page__article">
        <h1>Sobre o {SITE_NAME}</h1>
        <p className="legal-page__lead">
          O <strong>{SITE_NAME}</strong> é um marketplace português dedicado a artigos digitais, artesanato e produtos
          reutilizados: um espaço para criar, comprar e vender com confiança.
        </p>

        <section>
          <h2>Missão</h2>
          <p>
            Aproximar criadores e compradores, valorizar o feito à mão e o consumo mais consciente, com tecnologia simples
            e segura.
          </p>
        </section>

        <section>
          <h2>Grupo e empresa</h2>
          <p>{SITE_GROUP_LINE}</p>
          <p>
            <strong>{COMPANY_LEGAL_NAME}</strong>
            <br />
            NIF: {COMPANY_NIF}
            <br />
            Web:{' '}
            <a href={COMPANY_WEBSITE} rel="noopener noreferrer" target="_blank">
              {COMPANY_WEBSITE_HOST}
            </a>
          </p>
        </section>

        <section>
          <h2>Contacto</h2>
          <p>
            Para parcerias, apoio ou informações gerais, utilize a página <a href="/contactos">Contactos</a> ou consulte
            as <a href="/faq">perguntas frequentes</a>.
          </p>
        </section>
      </article>
    </SitePageShell>
  );
}
