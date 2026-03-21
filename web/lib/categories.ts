/**
 * Categorias de produtos do marketplace.
 * Sem duplicados (ex.: Pet Supplies = Animais, Clothing = Moda, Home & Living = Móveis Casa e Jardim).
 */

export interface CategoryItem {
  slug: string;
  label: string;
}

/** Slug da categoria Produto Digital (permite anexar ficheiro PDF/JPEG). */
export const CATEGORY_PRODUTO_DIGITAL = 'produto-digital';

/** Slug da categoria Entretenimento (subcategorias em checkbox). */
export const CATEGORY_ENTRETERIMENTO = 'entretenimento';

/** Subcategorias de Produto Digital (checkboxes; slugs estáveis). */
export const DIGITAL_SUBCATEGORIES: CategoryItem[] = [
  { slug: 'educacao-e-formacao', label: 'Educação e Formação' },
  { slug: 'design-e-criatividade', label: 'Design e Criatividade' },
  { slug: 'software-e-tecnologia', label: 'Software e Tecnologia' },
  { slug: 'audio-e-musica', label: 'Áudio e Música' },
  { slug: 'fotografia-e-video', label: 'Fotografia e Vídeo' },
  { slug: 'conteudo-e-entretenimento', label: 'Conteúdo e Entretenimento' },
  { slug: 'planeamento-e-negocios', label: 'Planeamento e Negócios' },
];

/** Subcategorias de Entretenimento (checkboxes). */
export const ENTERTAINMENT_SUBCATEGORIES: CategoryItem[] = [
  { slug: 'brinquedos-e-jogos', label: 'Brinquedos e Jogos' },
  { slug: 'livros-filmes-e-musica', label: 'Livros, Filmes e Música' },
  { slug: 'arte-e-colecionaveis', label: 'Arte e Colecionáveis' },
];

const DIGITAL_SUB_MAP = new Map(DIGITAL_SUBCATEGORIES.map((x) => [x.slug, x.label]));
const ENTERTAINMENT_SUB_MAP = new Map(ENTERTAINMENT_SUBCATEGORIES.map((x) => [x.slug, x.label]));

export function getDigitalSubcategoryLabel(slug: string): string {
  return DIGITAL_SUB_MAP.get(slug) ?? slug;
}

export function formatDigitalSubcategoriesList(slugs: string[] | null | undefined): string {
  if (!slugs?.length) return '';
  return slugs.map((s) => getDigitalSubcategoryLabel(s)).join(', ');
}

export function getEntertainmentSubcategoryLabel(slug: string): string {
  return ENTERTAINMENT_SUB_MAP.get(slug) ?? slug;
}

export function formatEntertainmentSubcategoriesList(slugs: string[] | null | undefined): string {
  if (!slugs?.length) return '';
  return slugs.map((s) => getEntertainmentSubcategoryLabel(s)).join(', ');
}

export const CATEGORIES: CategoryItem[] = [
  { slug: CATEGORY_PRODUTO_DIGITAL, label: 'Produto Digital' },
  { slug: 'carros-motos-e-barcos', label: 'Carros, motos e barcos' },
  { slug: 'imoveis', label: 'Imóveis' },
  { slug: 'bebe-e-crianca', label: 'Bebé e Criança' },
  { slug: 'lazer', label: 'Lazer' },
  { slug: 'telemoveis-tablets-smartwatches', label: 'Telemóveis, Tablets e Smartwatches' },
  { slug: 'agricultura', label: 'Agricultura' },
  { slug: 'animais', label: 'Animais' },
  { slug: 'desporto', label: 'Desporto' },
  { slug: 'moda', label: 'Moda' },
  { slug: 'moveis-casa-e-jardim', label: 'Móveis, Casa e Jardim' },
  { slug: 'tecnologia-e-informatica', label: 'Tecnologia e Informática' },
  { slug: 'equipamentos-e-ferramentas', label: 'Equipamentos e Ferramentas' },
  { slug: CATEGORY_ENTRETERIMENTO, label: 'Entretenimento' },
  { slug: 'acessorios', label: 'Acessórios' },
  { slug: 'bolsas-e-carteiras', label: 'Bolsas e Carteiras' },
  { slug: 'beleza-e-higiene', label: 'Beleza e Higiene' },
  { slug: 'materiais-para-artesanato', label: 'Materiais para Artesanato' },
  { slug: 'joalharia', label: 'Joalharia' },
  { slug: 'papelaria-e-festas', label: 'Papelaria e Festas' },
  { slug: 'calcado', label: 'Calçado' },
  { slug: 'casamentos', label: 'Casamentos' },
];

/** Slug padrão quando não há categoria (compatível com schema atual). */
export const DEFAULT_CATEGORY_SLUG = 'lazer';

/** Categorias removidas ou antigas — ainda podem existir em dados antigos. */
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  'outras-vendas': 'Outras vendas',
  emprego: 'Emprego',
  servicos: 'Serviços',
  'brinquedos-e-jogos': 'Brinquedos e Jogos',
  'livros-filmes-e-musica': 'Livros, Filmes e Música',
  'arte-e-colecionaveis': 'Arte e Colecionáveis',
};

export function getCategoryLabel(slug: string): string {
  if (!slug) return '';
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (c) return c.label;
  if (slug === 'outros') return 'Lazer';
  const legacy = LEGACY_CATEGORY_LABELS[slug];
  if (legacy) return legacy;
  return slug;
}

/** Valor em BD / API para anúncios de artigos reutilizados (antes: used). */
export const PRODUCT_TYPE_REUTILIZADOS = 'reutilizados';

/** Normaliza tipo antigo `used` ou URLs legadas. */
export function normalizeProductType(type: string | null | undefined): string {
  if (!type) return '';
  if (type === 'used') return PRODUCT_TYPE_REUTILIZADOS;
  return type;
}

/** Rótulo em português para o campo `products.type`. */
export function formatProductTypeLabel(type: string): string {
  const t = normalizeProductType(type);
  const map: Record<string, string> = {
    physical: 'Físico',
    digital: 'Digital',
    reutilizados: 'Reutilizado',
  };
  return map[t] ?? type;
}
