/** Normaliza o tipo vindo da BD ou dos metadados do Supabase Auth. */
export function parseUserType(value: unknown): 'vendedor' | 'comum' {
  const s = String(value ?? '')
    .toLowerCase()
    .trim();
  if (s === 'vendedor' || s === 'vendedora' || s === 'seller') return 'vendedor';
  return 'comum';
}

export function isVendedorType(dbType: unknown, metadataType: unknown): boolean {
  return parseUserType(dbType) === 'vendedor' || parseUserType(metadataType) === 'vendedor';
}
