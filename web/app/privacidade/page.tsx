import type { Metadata } from 'next';
import SitePageShell from '@/components/SitePageShell';
import {
  SITE_NAME,
  COMPANY_LEGAL_NAME,
  COMPANY_NIF,
  COMPANY_WEBSITE,
  COMPANY_WEBSITE_HOST,
} from '@/lib/site-brand';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: 'Tratamento de dados pessoais no serviço TerraPlace.',
};

export default function PrivacidadePage() {
  return (
    <SitePageShell>
      <article className="legal-page__article">
        <h1>Política de privacidade</h1>
        <p className="legal-page__meta">
          Última atualização: março de 2026 · Responsável pelo tratamento: <strong>{COMPANY_LEGAL_NAME}</strong> (NIF{' '}
          {COMPANY_NIF}) · Serviço: <strong>{SITE_NAME}</strong> ·{' '}
          <a href={COMPANY_WEBSITE} rel="noopener noreferrer" target="_blank">
            {COMPANY_WEBSITE_HOST}
          </a>
        </p>

        <section>
          <h2>1. Quem somos</h2>
          <p>
            A <strong>{COMPANY_LEGAL_NAME}</strong>, com sede em Portugal e NIF <strong>{COMPANY_NIF}</strong>, é a
            entidade responsável pelo tratamento dos dados pessoais recolhidos no âmbito do website e serviço{' '}
            <strong>{SITE_NAME}</strong>.
          </p>
        </section>

        <section>
          <h2>2. Que dados tratamos</h2>
          <p>Consoante a utilização do serviço, podem ser tratados, entre outros:</p>
          <ul>
            <li>Dados de identificação e contacto (nome, e-mail);</li>
            <li>Dados de conta e perfil (tipo de utilizador, preferências);</li>
            <li>Dados de transações e encomendas necessários à execução do contrato;</li>
            <li>Dados técnicos (logs, identificadores de sessão, endereço IP) para segurança e funcionamento;</li>
            <li>Comunicações através da plataforma (mensagens entre compradores e vendedores).</li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidades e bases legais</h2>
          <p>Os dados são tratados para:</p>
          <ul>
            <li>
              <strong>Execução de contrato</strong> e prestação do serviço {SITE_NAME} (conta, compras, vendas,
              pagamentos);
            </li>
            <li>
              <strong>Interesses legítimos</strong> (segurança, prevenção de fraude, melhoria do serviço), equilibrados
              com os seus direitos;
            </li>
            <li>
              <strong>Cumprimento de obrigações legais</strong> (ex.: fiscais, quando aplicável);
            </li>
            <li>
              <strong>Consentimento</strong>, quando exigido (ex.: comunicações opcionais, cookies não necessários; ver
              política de cookies).
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Conservação</h2>
          <p>
            Os dados conservam-se pelo tempo necessário às finalidades indicadas e às obrigações legais. Critérios
            concretos podem constar de registos internos e ser solicitados via contacto.
          </p>
        </section>

        <section>
          <h2>5. Destinatários e transferências</h2>
          <p>
            Os dados podem ser comunicados a prestadores que atuem em nome da responsável pelo tratamento (alojamento,
            base de dados, processamento de pagamentos, e-mail transacional), com contratos adequados. Alguns
            prestadores podem estar situados fora do EEE; nesses casos aplicam-se salvaguardas previstas no RGPD.
          </p>
        </section>

        <section>
          <h2>6. Os seus direitos</h2>
          <p>
            Nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD), pode solicitar acesso, retificação,
            apagamento, limitação, oposição e portabilidade dos seus dados, e retirar consentimentos quando aplicável.
            Pode apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD).
          </p>
          <p>
            Para exercer direitos ou esclarecimentos: utilize a página <a href="/contactos">Contactos</a> ou o endereço
            indicado para o efeito.
          </p>
        </section>
      </article>
    </SitePageShell>
  );
}
