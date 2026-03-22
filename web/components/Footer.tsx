import Link from 'next/link';
import { CookieSettingsTrigger } from '@/components/CookieSettingsTrigger';
import {
  SITE_NAME,
  COMPANY_SHORT_NAME,
  COMPANY_NIF,
  COMPANY_WEBSITE,
} from '@/lib/site-brand';

const FOOTER_COLUMNS = [
  {
    title: 'Comprar',
    links: [
      { href: '/produtos', label: 'Todos os produtos' },
      { href: '/produtos?tipo=digital', label: 'Digitais' },
      { href: '/produtos?tipo=physical', label: 'Artesanato' },
      { href: '/produtos?tipo=reutilizados', label: 'Reutilizados' },
    ],
  },
  {
    title: 'Vender',
    links: [
      { href: '/vender', label: 'Começar a vender' },
      { href: '/vender/politica', label: 'Política para vendedores' },
      { href: '/produtos', label: 'Ver anúncios' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { href: '/entrar', label: 'Iniciar sessão' },
      { href: '/registar', label: 'Criar conta' },
      { href: '/contactos', label: 'Contactos' },
      { href: '/faq', label: 'Perguntas frequentes' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '/sobre', label: 'Sobre nós' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/termos', label: 'Termos de utilização' },
      { href: '/privacidade', label: 'Privacidade' },
      { href: '/cookies', label: 'Cookies' },
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
          <div className="footer__brand">
            <p className="footer__copy">
              © {year} <strong>{SITE_NAME}</strong>. Todos os direitos reservados.
            </p>
            <p className="footer__group">
              Um serviço do grupo <strong>{COMPANY_SHORT_NAME}</strong> · NIF {COMPANY_NIF} ·{' '}
              <a href={COMPANY_WEBSITE} rel="noopener noreferrer" target="_blank">
                elastiquality.pt
              </a>
            </p>
          </div>
          <div className="footer__legal">
            <Link href="/privacidade" className="footer__legal-link">
              Privacidade
            </Link>
            <span className="footer__sep">·</span>
            <Link href="/termos" className="footer__legal-link">
              Termos
            </Link>
            <span className="footer__sep">·</span>
            <Link href="/cookies" className="footer__legal-link">
              Cookies
            </Link>
            <span className="footer__sep">·</span>
            <CookieSettingsTrigger className="footer__legal-link footer__legal-btn" />
          </div>
        </div>
      </div>
    </footer>
  );
}
