import Link from 'next/link';

export default function EntrarPage() {
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
        <h1>Entrar</h1>
        <p>Login e registo (Supabase Auth) em breve.</p>
        <p><Link href="/">Voltar ao início</Link></p>
      </main>
    </div>
  );
}
