/**
 * Escapa `%`, `_` e `\` para uso em padrões ILIKE (PostgreSQL).
 */
export function escapeIlikePattern(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
