'use client';

import { useState, type FormEvent } from 'react';
import { StarRating, StarRatingInput } from '@/components/StarRating';
import { supabase } from '@/lib/supabase';

export interface ProductReviewRow {
  id: string;
  product_id: string;
  reviewer_id: string;
  reviewer_display_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function ProductReviewsSection({
  productId,
  reviews,
  canReview,
  user,
  productAvg,
  productReviewCount,
  onRefresh,
}: {
  productId: string;
  reviews: ProductReviewRow[];
  canReview: boolean;
  user: { id: string } | null;
  productAvg: number | null;
  productReviewCount: number;
  onRefresh: () => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const hasProductRating = (productReviewCount ?? 0) > 0 && productAvg != null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setErr('');
    setBusy(true);
    const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
    const displayName = prof?.full_name?.trim() || null;
    const { error } = await supabase.from('product_reviews').insert({
      product_id: productId,
      reviewer_id: user.id,
      reviewer_display_name: displayName,
      rating,
      comment: comment.trim() || '',
    });
    setBusy(false);
    if (error) {
      setErr(error.message || 'Não foi possível guardar a avaliação.');
      return;
    }
    setComment('');
    setRating(5);
    await onRefresh();
  }

  return (
    <section id="avaliacoes" className="product-reviews-section" aria-labelledby="product-reviews-heading">
      <h2 id="product-reviews-heading">Avaliações deste anúncio</h2>
      {hasProductRating ? (
        <p className="product-reviews-summary">
          <StarRating value={productAvg!} />
          <span>
            {Number(productAvg).toFixed(1).replace(/\.0$/, '')} com base em {productReviewCount}{' '}
            {productReviewCount === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </p>
      ) : (
        <p className="product-reviews-summary product-reviews-summary--muted">Ainda não há avaliações para este anúncio.</p>
      )}
      <p className="product-reviews-hint">
        Só quem comprou este produto (com pagamento confirmado) pode deixar uma avaliação.
      </p>

      {user && canReview ? (
        <form className="product-reviews-form" onSubmit={submit}>
          <p className="product-reviews-form__title">A tua avaliação</p>
          <label className="product-reviews-form__field">
            <span className="product-reviews-form__label">Estrelas</span>
            <StarRatingInput value={rating} onChange={setRating} disabled={busy} />
          </label>
          <label className="product-reviews-form__field">
            <span className="product-reviews-form__label">Comentário (opcional)</span>
            <textarea
              className="product-reviews-form__textarea"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={busy}
              maxLength={2000}
            />
          </label>
          {err ? <p className="auth-error">{err}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'A enviar…' : 'Publicar avaliação'}
          </button>
        </form>
      ) : user && !canReview ? (
        <p className="product-reviews-locked">
          {reviews.some((r) => r.reviewer_id === user.id)
            ? 'Já deixaste uma avaliação neste anúncio.'
            : 'Só podes avaliar depois de comprares este produto (pagamento concluído).'}
        </p>
      ) : (
        <p className="product-reviews-locked">
          <a href={`/entrar?redirect=/produtos/${productId}#avaliacoes`}>Inicia sessão</a> para veres se podes avaliar.
        </p>
      )}

      <ul className="product-reviews-list">
        {reviews.map((r) => (
          <li key={r.id} className="product-reviews-item">
            <div className="product-reviews-item__head">
              <StarRating value={r.rating} size="sm" />
              <span className="product-reviews-item__name">{r.reviewer_display_name?.trim() || 'Comprador'}</span>
              <time className="product-reviews-item__date" dateTime={r.created_at}>
                {new Date(r.created_at).toLocaleDateString('pt-PT')}
              </time>
            </div>
            {r.comment?.trim() ? <p className="product-reviews-item__comment">{r.comment}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
