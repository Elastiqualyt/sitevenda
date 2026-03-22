import type { Metadata } from 'next';
import Link from 'next/link';
import SitePageShell from '@/components/SitePageShell';
import { SellerListingPolicy } from '@/components/SellerListingPolicy';
import { SITE_NAME } from '@/lib/site-brand';

export const metadata: Metadata = {
  title: 'Política para vendedores',
  description: `Taxas de listagem e comissão sobre vendas no ${SITE_NAME}. Informação pública para compradores e vendedores.`,
};

export default function VenderPoliticaPage() {
  return (
    <SitePageShell>
      <article className="legal-page__article">
        <h1>Política para vendedores</h1>
        <p className="legal-page__lead">
          Condições indicativas sobre taxas aplicáveis a quem vende no <strong>{SITE_NAME}</strong>. Esta página é
          pública: podes consultá-la antes de criar conta. Ao publicares ou alterares anúncios na área de vendedor,
          confirmas no formulário que aceitas estas regras.
        </p>
        <div className="auth-card" style={{ maxWidth: 720, marginTop: '1rem' }}>
          <SellerListingPolicy />
        </div>
        <p className="legal-page__outro">
          <Link href="/vender">Área «Vender» e criação de anúncios</Link>
          {' · '}
          <Link href="/faq">Perguntas frequentes</Link>
          {' · '}
          <Link href="/contactos">Contactos</Link>
        </p>
      </article>
    </SitePageShell>
  );
}
