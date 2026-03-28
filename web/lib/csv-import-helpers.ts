/** Partilhado entre import-digital-csv e import-physical-csv. */

export const MAX_GALLERY_IMAGES = 5;

export function getCell(row: Record<string, string>, ...aliases: string[]): string {
  for (const a of aliases) {
    const v = row[a.toLowerCase()];
    if (v !== undefined && v !== '') return v;
  }
  return '';
}

/** Até 5 URLs: `image_url_1`…`image_url_5` (ou `imagem_n` / `capa_n`). */
export function getGalleryUrlsFromRow(row: Record<string, string>): string[] {
  const slots: string[] = [];
  for (let i = 1; i <= MAX_GALLERY_IMAGES; i++) {
    const u = getCell(row, `image_url_${i}`, `imagem_${i}`, `capa_${i}`).trim();
    if (u) slots.push(u);
  }
  if (slots.length === 0) {
    const legacy = getCell(row, 'image_url', 'imagem', 'capa').trim();
    if (legacy) slots.push(legacy);
    return slots;
  }
  const legacyFirst = getCell(row, 'image_url', 'imagem', 'capa').trim();
  if (legacyFirst && !getCell(row, 'image_url_1', 'imagem_1', 'capa_1').trim()) {
    slots.unshift(legacyFirst);
  }
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const u of slots) {
    if (seen.has(u)) continue;
    seen.add(u);
    deduped.push(u);
    if (deduped.length >= MAX_GALLERY_IMAGES) break;
  }
  return deduped;
}

export function parseSubcatList(s: string): string[] {
  if (!s.trim()) return [];
  return s
    .split(/[|;,\n]/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}
