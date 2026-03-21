'use client';

import Link from 'next/link';
import { StarRating } from '@/components/StarRating';

export interface SellerPublic {
  full_name: string | null;
  avatar_url: string | null;
  user_type: string | null;
}

export function SellerBlock({
  sellerId,
  seller,
  avgRating,
  reviewCount,
}: {
  sellerId: string;
  seller: SellerPublic | null;
  avgRating: number;
  reviewCount: number;
}) {
  const name = seller?.full_name?.trim() || 'Vendedor';
  const hasStats = reviewCount > 0;

  return (
    <div className="seller-block">
      <div className="seller-block__avatar" aria-hidden>
        {seller?.avatar_url ? (
          <img src={seller.avatar_url} alt="" />
        ) : (
          <span className="seller-block__avatar-placeholder">{name.slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div className="seller-block__body">
        <p className="seller-block__label">Vendedor</p>
        <p className="seller-block__name">{name}</p>
        {hasStats ? (
          <p className="seller-block__rating">
            <StarRating value={avgRating} size="sm" />
            <span className="seller-block__rating-text">
              {avgRating.toFixed(1).replace(/\.0$/, '')} · {reviewCount}{' '}
              {reviewCount === 1 ? 'avaliação' : 'avaliações'} (todos os anúncios)
            </span>
          </p>
        ) : (
          <p className="seller-block__rating seller-block__rating--muted">Ainda sem avaliações globais</p>
        )}
        <Link href={`/loja/${sellerId}`} className="seller-block__link">
          Ver loja e todos os produtos →
        </Link>
      </div>
    </div>
  );
}
