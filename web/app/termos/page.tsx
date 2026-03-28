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
  title: 'Termos de utilização',
  description: `Condições gerais de utilização do serviço ${SITE_NAME}.`,
};

export default function TermosPage() {
  return (
    <SitePageShell>
      <article className="legal-page__article">
        <h1>Termos de utilização</h1>
        <p className="legal-page__meta">
          Última atualização: março de 2026 · Serviço: <strong>{SITE_NAME}</strong> · Operado por{' '}
          <strong>{COMPANY_LEGAL_NAME}</strong> (NIF {COMPANY_NIF}) ·{' '}
          <a href={COMPANY_WEBSITE} rel="noopener noreferrer" target="_blank">
            {COMPANY_WEBSITE_HOST}
          </a>
        </p>

        <section>
          <h2>1. Aceitação</h2>
          <p>
            Ao aceder, registar-se ou utilizar o site e os serviços <strong>{SITE_NAME}</strong>, o utilizador declara
            ter lido e aceite integralmente estes Termos de utilização. Se não concordar, não deve utilizar o serviço.
          </p>
        </section>

        <section>
          <h2>2. Objeto do serviço</h2>
          <p>
            O <strong>{SITE_NAME}</strong> é uma plataforma online que permite a publicação de anúncios e a venda de
            produtos entre utilizadores (compradores e vendedores), incluindo artigos digitais, artesanato e artigos
            reutilizados, nos termos das funcionalidades então disponíveis.
          </p>
          <p>
            A <strong>{COMPANY_LEGAL_NAME}</strong> presta o serviço de intermediação tecnológica; a relação de compra
            e venda estabelece-se entre comprador e vendedor, salvo disposição legal em contrário.
          </p>
        </section>

        <section>
          <h2>3. Contas e responsabilidades</h2>
          <p>
            O utilizador compromete-se a fornecer informações verdadeiras, a manter a confidencialidade das credenciais
            de acesso e a notificar alterações relevantes. É responsável por toda a atividade realizada na sua conta.
          </p>
          <p>
            Os vendedores devem cumprir a legislação aplicável (incluindo fiscal e de consumo), descrever corretamente os
            produtos e honrar as vendas concluídas através da plataforma, conforme as regras então em vigor (taxas,
            prazos e políticas divulgadas no site).
          </p>
        </section>

        <section>
          <h2>4. Pagamentos e taxas</h2>
          <p>
            Os pagamentos podem ser processados através de prestadores externos (ex.: Stripe). Aplica-se a taxa de
            checkout cobrada ao comprador descrita na área do vendedor e na documentação associada, podendo ser
            atualizadas com aviso prévio razoável na plataforma.
          </p>
        </section>

        <section>
          <h2>5. Conduta e conteúdos</h2>
          <p>
            É proibido utilizar o serviço para fins ilícitos, fraudulentos, que violem direitos de terceiros ou que
            prejudiquem outros utilizadores ou o bom funcionamento da plataforma. A empresa reserva-se o direito de
            remover conteúdos, suspender contas ou recusar o serviço, nos termos legais aplicáveis.
          </p>
        </section>

        <section>
          <h2>6. Limitação de responsabilidade</h2>
          <p>
            O serviço é prestado &quot;no estado em que se encontra&quot;. Na medida máxima permitida pela lei, a{' '}
            <strong>{COMPANY_LEGAL_NAME}</strong> não será responsável por danos indiretos, lucros cessantes ou
            interrupções do serviço, sem prejuízo de direitos imperativos do consumidor.
          </p>
        </section>

        <section>
          <h2>7. Alterações e contacto</h2>
          <p>
            Estes termos podem ser alterados; a versão aplicável é a publicada no site com indicação da data. Para
            questões relacionadas com o serviço <strong>{SITE_NAME}</strong>, utilize os{' '}
            <a href="/contactos">contactos</a> indicados no site.
          </p>
        </section>
      </article>
    </SitePageShell>
  );
}
