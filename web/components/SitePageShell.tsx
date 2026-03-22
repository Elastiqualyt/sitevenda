import Header from '@/components/Header';
import Footer from '@/components/Footer';

type Props = {
  children: React.ReactNode;
  /** Classe extra no <main> (ex.: legal-page) */
  mainClassName?: string;
};

/**
 * Páginas estáticas (institucional, legal) com header e footer.
 */
export default function SitePageShell({ children, mainClassName = 'legal-page' }: Props) {
  return (
    <div className="page">
      <Header />
      <main className={`main ${mainClassName}`}>{children}</main>
      <Footer />
    </div>
  );
}
