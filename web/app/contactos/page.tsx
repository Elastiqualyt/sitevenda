import type { Metadata } from 'next';
import SitePageShell from '@/components/SitePageShell';
import {
  SITE_NAME,
  COMPANY_LEGAL_NAME,
  COMPANY_NIF,
  COMPANY_WEBSITE,
  COMPANY_WEBSITE_HOST,
  COMPANY_CONTACT_EMAIL,
} from '@/lib/site-brand';

export const metadata: Metadata = {
  title: 'Contactos',
  description: `Contacte a equipa ${SITE_NAME} e a ${COMPANY_LEGAL_NAME}.`,
};

export default function ContactosPage() {
  return (
    <SitePageShell>
      <article className="legal-page__article">
        <h1>Contactos</h1>
        <p className="legal-page__lead">
          Serviço <strong>{SITE_NAME}</strong> · Operado por <strong>{COMPANY_LEGAL_NAME}</strong>
        </p>

        <section className="contact-block">
          <h2>Empresa</h2>
          <p>
            <strong>{COMPANY_LEGAL_NAME}</strong>
            <br />
            NIF: {COMPANY_NIF}
            <br />
            Sede: Portugal
            <br />
            Website do grupo:{' '}
            <a href={COMPANY_WEBSITE} rel="noopener noreferrer" target="_blank">
              {COMPANY_WEBSITE_HOST}
            </a>
          </p>
        </section>

        <section className="contact-block">
          <h2>Apoio ao utilizador</h2>
          <p>
            Para questões sobre encomendas, conta, vendedores ou utilização do site, consulta primeiro as{' '}
            <a href="/faq">Perguntas frequentes</a>.
          </p>
          <p>
            <strong>E-mail (geral):</strong>{' '}
            <a href={`mailto:${COMPANY_CONTACT_EMAIL}`}>{COMPANY_CONTACT_EMAIL}</a>
          </p>
        </section>

        <section className="contact-block">
          <h2>Privacidade e dados</h2>
          <p>
            Pedidos relacionados com dados pessoais: indicar no assunto &quot;RGPD — {SITE_NAME}&quot; no mesmo canal de
            contacto ou seguir o procedimento descrito na <a href="/privacidade">Política de privacidade</a>.
          </p>
        </section>
      </article>
    </SitePageShell>
  );
}
