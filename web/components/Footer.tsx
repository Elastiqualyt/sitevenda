import Link from 'next/link';

const FOOTER_COLUMNS = [
  {
    title: 'Comprar',
    links: [
      { href: '/produtos', label: 'Todos os produtos' },
      { href: '/produtos?tipo=digital', label: 'Digitais' },
      { href: '/produtos?tipo=physical', label: 'Artesanato' },
      { href: '/produtos?tipo=used', label: 'Usados' },
    ],
  },
  {
    title: 'Vender',
    links: [
      { href: '/vender', label: 'Começar a vender' },
      { href: '/produtos', label: 'Ver anúncios' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { href: '/entrar', label: 'Iniciar sessão' },
      { href: '/registar', label: 'Criar conta' },
      { href: '#', label: 'Contactos' },
      { href: '#', label: 'Perguntas frequentes' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '#', label: 'Sobre nós' },
      { href: '#', label: 'Blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '#', label: 'Termos de utilização' },
      { href: '#', label: 'Privacidade' },
      { href: '#', label: 'Cookies' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__columns">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="footer__col">
              <h3 className="footer__col-title">{col.title}</h3>
              <ul className="footer__links">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="footer__link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} Marketplace. Todos os direitos reservados.
          </p>
          <div className="footer__legal">
            <Link href="#" className="footer__legal-link">Privacidade</Link>
            <span className="footer__sep">·</span>
            <Link href="#" className="footer__legal-link">Termos</Link>
            <span className="footer__sep">·</span>
            <Link href="#" className="footer__legal-link">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
