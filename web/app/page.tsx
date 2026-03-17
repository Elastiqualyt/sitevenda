import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="page">
      <header className="header">
        <Link href="/" className="logo">Marketplace</Link>
        <nav className="nav">
          <Link href="/produtos">Produtos</Link>
          <Link href="/vender">Vender</Link>
          <Link href="/entrar">Entrar</Link>
        </nav>
      </header>

      <main className="main">
        <section className="hero">
          <h1>Compre e venda com confiança</h1>
          <p>
            Artigos digitais, artesanato e itens usados. Um lugar para criar e
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
          <h2>Categorias</h2>
          <div className="category-grid">
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
            <Link href="/produtos?tipo=used" className="card">
              <span className="card-icon">♻️</span>
              <h3>Usados</h3>
              <p>Itens em segunda mão</p>
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Marketplace. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
