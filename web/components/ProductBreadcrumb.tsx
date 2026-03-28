import Link from 'next/link';
import type { ProductBreadcrumbItem } from '@/lib/categories';

export function ProductBreadcrumb({ items }: { items: ProductBreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="product-breadcrumb" aria-label="Caminho na loja">
      <ol className="product-breadcrumb__list">
        {items.map((item, i) => (
          <li key={`${i}-${item.label.slice(0, 24)}`} className="product-breadcrumb__li">
            {i > 0 ? (
              <span className="product-breadcrumb__sep" aria-hidden>
                /
              </span>
            ) : null}
            {item.href ? (
              <Link href={item.href} className="product-breadcrumb__link">
                {item.label}
              </Link>
            ) : (
              <span className="product-breadcrumb__current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
