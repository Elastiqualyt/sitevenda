import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { MarketplaceListsProvider } from '@/lib/marketplace-lists-context';

export const metadata: Metadata = {
  title: 'Marketplace — Comprar e vender artesanato e digitais',
  description: 'Compre e venda artigos digitais, artesanato e itens reutilizados.',
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
        </AuthProvider>
      </body>
    </html>
  );
}
