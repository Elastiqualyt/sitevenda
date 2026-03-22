import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SITE_NAME } from '@/lib/site-brand';

export default function HomePage() {
  return (
    <div className="page">
      <Header />

      <main className="main">
        <section className="hero">
          <p className="hero__brand">{SITE_NAME}</p>
          <h1>Compre e venda com confiança</h1>
          <p>
            Artigos digitais, artesanato e itens reutilizados. Um lugar para criar e
            encontrar o que procura.
          </p>
          <div className="hero-actions">
            <Link href="/produtos" className="btn btn-primary">
              Explorar produtos
            </Link>
            <Link href="/vender" className="btn btn-secondary">
              Começar a vender
            </Link>
          </div>
        </section>

        <section className="categories">
          <h2>Tipo de anúncio</h2>
          <div className="category-grid category-grid--small">
            <Link href="/produtos?tipo=digital" className="card">
              <span className="card-icon">📁</span>
              <h3>Digitais</h3>
              <p>Ficheiros, artes e templates</p>
            </Link>
            <Link href="/produtos?tipo=physical" className="card">
              <span className="card-icon">🎨</span>
              <h3>Artesanato</h3>
              <p>Feito à mão com cuidado</p>
            </Link>
            <Link href="/produtos?tipo=reutilizados" className="card">
              <span className="card-icon">♻️</span>
              <h3>Reutilizados</h3>
              <p>Itens em segunda mão</p>
            </Link>
          </div>
        </section>

        <section className="categories">
          <h2>Categorias</h2>
          <div className="category-grid category-grid--many">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/produtos?categoria=${encodeURIComponent(c.slug)}`}
                className="card card--category"
              >
                <h3>{c.label}</h3>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
