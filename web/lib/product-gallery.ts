/** Máximo de fotos por anúncio (capa + extras no perfil do produto). */
export const MAX_AD_PHOTOS = 5;

/** Normaliza gallery_urls vindo da API/Supabase (jsonb ou array). */
export function parseGalleryUrls(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  }
  return [];
}

/** Lista de imagens para UI: galeria ou, em alternativa, só a capa. */
export function productDisplayImages(galleryUrls: unknown, imageUrl: string | null | undefined): string[] {
  const g = parseGalleryUrls(galleryUrls);
  if (g.length > 0) return g;
  if (imageUrl?.trim()) return [imageUrl.trim()];
  return [];
}
