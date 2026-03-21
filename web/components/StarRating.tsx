'use client';

/** Exibição de estrelas (1–5). */
export function StarRating({
  value,
  max = 5,
  size = 'md',
}: {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
}) {
  const v = Math.min(max, Math.max(0, Math.round(Number(value) || 0)));
  const label = `${Number(value).toFixed(1).replace(/\.0$/, '')} de ${max} estrelas`;
  return (
    <span className={`star-rating star-rating--${size}`} role="img" aria-label={label}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < v ? 'star-rating__fill' : 'star-rating__empty'} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

/** Seleção de 1–5 estrelas (clique). */
export function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="star-rating-input" role="group" aria-label="Classificação em estrelas">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-rating-input__btn${n <= value ? ' star-rating-input__btn--on' : ''}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          aria-pressed={n === value}
          aria-label={`${n} estrelas`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
