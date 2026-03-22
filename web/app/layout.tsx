import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { MarketplaceListsProvider } from '@/lib/marketplace-lists-context';
import { CookieBanner } from '@/components/CookieBanner';

export const metadata: Metadata = {
  title: {
    default: 'TerraPlace — Comprar e vender artesanato e digitais',
    template: '%s | TerraPlace',
  },
  description:
    'TerraPlace: compre e venda artigos digitais, artesanato e reutilizados. Serviço do grupo Elastiquality.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>
        <AuthProvider>
          <MarketplaceListsProvider>{children}</MarketplaceListsProvider>
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
