import Link from 'next/link';

export default function VenderPage() {
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
        <h1>Vender no Marketplace</h1>
        <p>Página para criar anúncios (formulário de produto) em breve.</p>
        <p><Link href="/produtos">Ver produtos</Link></p>
      </main>
    </div>
  );
}
