import type { Metadata } from 'next';
import Link from 'next/link';
import SitePageShell from '@/components/SitePageShell';
import { SITE_NAME } from '@/lib/site-brand';

export const metadata: Metadata = {
  title: 'Blog',
  description: `Notícias e ideias do ${SITE_NAME} — artesanato, sustentabilidade e comunidade.`,
};

export default function BlogPage() {
  return (
    <SitePageShell>
      <div className="legal-page__article">
        <h1>Blog</h1>
        <p className="legal-page__lead">
          Histórias, dicas para vendedores e novidades do <strong>{SITE_NAME}</strong>.
        </p>

        <div className="blog-placeholder">
          <p>
            <strong>Em breve.</strong> Estamos a preparar artigos sobre artesanato, economia circular e boas práticas na
            plataforma.
          </p>
          <p>
            Quando o blog estiver ativo, poderás encontrar aqui publicações regulares. Até lá, segue-nos em{' '}
            <a href="https://elastiquality.pt" rel="noopener noreferrer" target="_blank">
              elastiquality.pt
            </a>{' '}
            ou envia-nos uma mensagem em <Link href="/contactos">Contactos</Link>.
          </p>
        </div>
      </div>
    </SitePageShell>
  );
}
