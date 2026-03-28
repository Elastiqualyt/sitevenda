/**
 * Sinais de navegação (localStorage) para personalização do feed:
 * artigos vistos e pesquisas de produtos — base para maior exposição a gostos do utilizador.
 */

export const BROWSE_SIGNALS_STORAGE_KEY = 'terraplace_browse_signals_v1';

const MAX_VIEWED = 40;
const MAX_SEARCHES = 25;
const MAX_QUERY_LEN = 200;

export type ViewedProductSignal = {
  id: string;
  title: string;
  imageUrl: string | null;
  at: string;
};

export type ProductSearchSignal = {
  query: string;
  at: string;
};

export type BrowseSignalsState = {
  viewedProducts: ViewedProductSignal[];
  productSearches: ProductSearchSignal[];
};

function defaultState(): BrowseSignalsState {
  return { viewedProducts: [], productSearches: [] };
}

function parseState(raw: string | null): BrowseSignalsState {
  if (!raw) return defaultState();
  try {
    const p = JSON.parse(raw) as Partial<BrowseSignalsState>;
    const viewed = Array.isArray(p.viewedProducts) ? p.viewedProducts : [];
    const searches = Array.isArray(p.productSearches) ? p.productSearches : [];
    return {
      viewedProducts: viewed
        .filter(
          (v): v is ViewedProductSignal =>
            v != null &&
            typeof v === 'object' &&
            typeof (v as ViewedProductSignal).id === 'string' &&
            typeof (v as ViewedProductSignal).title === 'string' &&
            typeof (v as ViewedProductSignal).at === 'string'
        )
        .map((v) => ({
          id: v.id,
          title: v.title.slice(0, 300),
          imageUrl: typeof v.imageUrl === 'string' ? v.imageUrl : null,
          at: v.at,
        })),
      productSearches: searches
        .filter(
          (s): s is ProductSearchSignal =>
            s != null &&
            typeof s === 'object' &&
            typeof (s as ProductSearchSignal).query === 'string' &&
            typeof (s as ProductSearchSignal).at === 'string'
        )
        .map((s) => ({
          query: s.query.slice(0, MAX_QUERY_LEN),
          at: s.at,
        })),
    };
  } catch {
    return defaultState();
  }
}

function persist(state: BrowseSignalsState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BROWSE_SIGNALS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function getBrowseSignals(): BrowseSignalsState {
  if (typeof window === 'undefined') return defaultState();
  return parseState(localStorage.getItem(BROWSE_SIGNALS_STORAGE_KEY));
}

/** Ids de produtos vistos (mais recentes primeiro) — útil para boost no feed. */
export function getViewedProductIdsForFeed(): string[] {
  const { viewedProducts } = getBrowseSignals();
  return viewedProducts.map((v) => v.id);
}

/** Termos de pesquisa recentes (mais recentes primeiro), sem duplicados case-insensitive. */
export function getRecentSearchQueriesForFeed(): string[] {
  const { productSearches } = getBrowseSignals();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of productSearches) {
    const k = s.query.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s.query.trim());
  }
  return out;
}

export function recordProductView(input: { id: string; title: string; image_url?: string | null }) {
  if (typeof window === 'undefined' || !input.id?.trim()) return;
  const state = parseState(localStorage.getItem(BROWSE_SIGNALS_STORAGE_KEY));
  const id = input.id.trim();
  const rest = state.viewedProducts.filter((v) => v.id !== id);
  const next: ViewedProductSignal = {
    id,
    title: (input.title || 'Artigo').slice(0, 300),
    imageUrl: input.image_url ?? null,
    at: new Date().toISOString(),
  };
  state.viewedProducts = [next, ...rest].slice(0, MAX_VIEWED);
  persist(state);
}

export function recordProductSearchQuery(query: string) {
  if (typeof window === 'undefined') return;
  const q = query.trim().slice(0, MAX_QUERY_LEN);
  if (q.length < 2) return;
  const state = parseState(localStorage.getItem(BROWSE_SIGNALS_STORAGE_KEY));
  const lower = q.toLowerCase();
  const rest = state.productSearches.filter((s) => s.query.trim().toLowerCase() !== lower);
  const next: ProductSearchSignal = { query: q, at: new Date().toISOString() };
  state.productSearches = [next, ...rest].slice(0, MAX_SEARCHES);
  persist(state);
}

export function clearViewedProducts() {
  if (typeof window === 'undefined') return;
  const state = parseState(localStorage.getItem(BROWSE_SIGNALS_STORAGE_KEY));
  state.viewedProducts = [];
  persist(state);
}

export function clearProductSearches() {
  if (typeof window === 'undefined') return;
  const state = parseState(localStorage.getItem(BROWSE_SIGNALS_STORAGE_KEY));
  state.productSearches = [];
  persist(state);
}

export function clearAllBrowseSignals() {
  if (typeof window === 'undefined') return;
  persist(defaultState());
}

export function formatSeenAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
