import type { Metadata } from 'next';
import SitePageShell from '@/components/SitePageShell';
import { CookiePreferencesBlock } from '@/components/CookiePreferencesBlock';
import {
  SITE_NAME,
  COMPANY_LEGAL_NAME,
  COMPANY_NIF,
  COMPANY_WEBSITE,
  COMPANY_WEBSITE_HOST,
} from '@/lib/site-brand';

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: `Utilização de cookies e tecnologias similares no site ${SITE_NAME}.`,
};

export default function CookiesPage() {
  return (
    <SitePageShell>
      <article className="legal-page__article">
        <h1>Política de cookies</h1>
        <p className="legal-page__meta">
          Última atualização: março de 2026 · <strong>{COMPANY_LEGAL_NAME}</strong> (NIF {COMPANY_NIF}) · Serviço:{' '}
          <strong>{SITE_NAME}</strong> ·{' '}
          <a href={COMPANY_WEBSITE} rel="noopener noreferrer" target="_blank">
            {COMPANY_WEBSITE_HOST}
          </a>
        </p>

        <section>
          <h2>1. O que são cookies</h2>
          <p>
            Os cookies são pequenos ficheiros guardados no seu dispositivo quando visita um site. Permitem reconhecer o
            dispositivo, memorizar preferências e compreender como o site é utilizado.
          </p>
        </section>

        <section>
          <h2>2. Como utilizamos cookies no {SITE_NAME}</h2>
          <p>No âmbito do serviço <strong>{SITE_NAME}</strong> podem ser utilizados:</p>
          <ul>
            <li>
              <strong>Cookies necessários</strong> — sessão, autenticação e segurança (funcionamento básico do site);
            </li>
            <li>
              <strong>Cookies de preferências</strong> — idioma ou opções que escolhe;
            </li>
            <li>
              <strong>Cookies de terceiros</strong> — por exemplo, prestadores de pagamento ou análise, quando
              integrados, segundo as respetivas políticas.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Gestão de cookies</h2>
          <p>
            Pode configurar o seu navegador para bloquear ou eliminar cookies. Note que desativar cookies necessários
            pode afetar o login ou funcionalidades essenciais.
          </p>
          <p>
            No primeiro acesso ao site, é apresentado um painel onde pode escolher <strong>apenas cookies necessários</strong>{' '}
            ou <strong>aceitar todos</strong> (necessários e opcionais). Também pode abrir{' '}
            <strong>Definições de cookies</strong> para ajustar a escolha antes de guardar.
          </p>
          <CookiePreferencesBlock />
        </section>

        <section>
          <h2>4. Mais informação</h2>
          <p>
            Para dados pessoais associados ao uso do site, consulte a <a href="/privacidade">Política de privacidade</a>.
            Questões: <a href="/contactos">Contactos</a>.
          </p>
        </section>
      </article>
    </SitePageShell>
  );
}
