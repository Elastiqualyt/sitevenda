/**
 * Categorias alinhadas com vinted.pt (rótulos e subcategorias consultados no catálogo público).
 * - Artigos físicos: `category` = slug folha (ex.: mulher-roupa, eletronica-videojogos-consolas).
 * - Produto digital: `category` = produto-digital + `digital_subcategories[]`.
 */

export interface CategoryItem {
  slug: string;
  label: string;
}

export const CATEGORY_PRODUTO_DIGITAL = 'produto-digital';

/** Grupos de topo + folhas (subcategorias), espelhando Vinted PT. */
export const PHYSICAL_CATEGORY_GROUPS: {
  slug: string;
  label: string;
  leaves: CategoryItem[];
}[] = [
  {
    slug: 'mulher',
    label: 'Mulher',
    leaves: [
      { slug: 'mulher-roupa', label: 'Roupa' },
      { slug: 'mulher-calcado', label: 'Calçado' },
      { slug: 'mulher-acessorios', label: 'Acessórios' },
      { slug: 'mulher-malas', label: 'Malas' },
      { slug: 'mulher-beleza', label: 'Beleza' },
    ],
  },
  {
    slug: 'homem',
    label: 'Homem',
    leaves: [
      { slug: 'homem-roupa', label: 'Roupa' },
      { slug: 'homem-sapatos', label: 'Sapatos' },
      { slug: 'homem-acessorios', label: 'Acessórios' },
      { slug: 'homem-cuidados-pessoais', label: 'Cuidados pessoais' },
    ],
  },
  {
    slug: 'pecas-estilista',
    label: 'Peças de estilista',
    leaves: [
      { slug: 'pecas-estilista-roupa-mulher', label: 'Roupa de mulher' },
      { slug: 'pecas-estilista-roupa-homem', label: 'Roupa de homem' },
      { slug: 'pecas-estilista-sapatos', label: 'Sapatos' },
      { slug: 'pecas-estilista-malas', label: 'Malas' },
      { slug: 'pecas-estilista-acessorios-joalharia', label: 'Acessórios e joalharia' },
    ],
  },
  {
    slug: 'crianca',
    label: 'Criança',
    leaves: [
      { slug: 'crianca-vestuario-rapariga', label: 'Vestuário para rapariga' },
      { slug: 'crianca-vestuario-rapaz', label: 'Vestuário para rapaz' },
      { slug: 'crianca-brinquedos', label: 'Brinquedos' },
      { slug: 'crianca-sono-roupa-cama', label: 'Sono e roupa de cama' },
      { slug: 'crianca-alimentacao-amamentacao', label: 'Alimentação e amamentação' },
      { slug: 'crianca-mobiliario-decoracao', label: 'Mobiliário e decoração' },
      { slug: 'crianca-outros', label: 'Outros artigos de criança' },
      { slug: 'crianca-carrinhos-cadeiras-auto', label: 'Carrinhos de bebé, alcofas e cadeiras auto' },
      { slug: 'crianca-banho-muda-fraldas', label: 'Banho e muda fraldas' },
      { slug: 'crianca-material-escolar', label: 'Material escolar' },
      { slug: 'crianca-saude-gravidez', label: 'Saúde e gravidez' },
      { slug: 'crianca-protecao-seguranca', label: 'Proteção e segurança infantil' },
    ],
  },
  {
    slug: 'casa',
    label: 'Casa',
    leaves: [
      { slug: 'casa-acessorios', label: 'Acessórios para a casa' },
      { slug: 'casa-artigos-mesa', label: 'Artigos de mesa' },
      { slug: 'casa-texteis', label: 'Têxteis' },
      { slug: 'casa-ferramentas-diy', label: 'Ferramentas & DIY' },
      { slug: 'casa-celebracoes-festividades', label: 'Celebrações e festividades' },
      { slug: 'casa-animais', label: 'Animais' },
      { slug: 'casa-utensilios-cozinha', label: 'Utensílios de cozinha' },
      { slug: 'casa-material-escritorio', label: 'Material de escritório' },
      { slug: 'casa-pequenos-eletrodomesticos', label: 'Pequenos eletrodomésticos de cozinha' },
      { slug: 'casa-cookware-bakeware', label: 'Utensílios de cozinha e pastelaria' },
      { slug: 'casa-cuidados-domesticos', label: 'Cuidados domésticos' },
      { slug: 'casa-exterior-jardim', label: 'Exterior e jardim' },
    ],
  },
  {
    slug: 'eletronica',
    label: 'Eletrónica',
    leaves: [
      { slug: 'eletronica-videojogos-consolas', label: 'Videojogos & consolas' },
      { slug: 'eletronica-telemoveis-comunicacao', label: 'Telemóveis e comunicação' },
      { slug: 'eletronica-computadores-acessorios', label: 'Computadores e acessórios' },
      { slug: 'eletronica-outros-dispositivos', label: 'Outros dispositivos e acessórios' },
      { slug: 'eletronica-audio-hifi', label: 'Áudio, auscultadores e hi-fi' },
      { slug: 'eletronica-beleza-cuidados-eletricos', label: 'Dispositivos elétricos de beleza e cuidados pessoais' },
      { slug: 'eletronica-camaras-acessorios', label: 'Câmaras e acessórios' },
      { slug: 'eletronica-wearables', label: 'Tecnologia wearable' },
      { slug: 'eletronica-tablets-ereaders', label: 'Tablets, e-readers e acessórios' },
      { slug: 'eletronica-tv-cinema-casa', label: 'TV e cinema em casa' },
    ],
  },
  {
    slug: 'entretenimento',
    label: 'Entretenimento',
    leaves: [
      { slug: 'entretenimento-livros', label: 'Livros' },
      { slug: 'entretenimento-musica', label: 'Música' },
      { slug: 'entretenimento-video', label: 'Vídeo' },
      { slug: 'entretenimento-revistas', label: 'Revistas' },
    ],
  },
  {
    slug: 'hobbies-colecoes',
    label: 'Hobbies e Coleções',
    leaves: [
      { slug: 'hobbies-colecoes-cartas-colecionaveis', label: 'Cartas colecionáveis' },
      { slug: 'hobbies-colecoes-trabalhos-manuais', label: 'Trabalhos manuais' },
      { slug: 'hobbies-colecoes-jogos-tabuleiro', label: 'Jogos de tabuleiro' },
      { slug: 'hobbies-colecoes-memorabilia', label: 'Memorabilia' },
      { slug: 'hobbies-colecoes-puzzles', label: 'Puzzles' },
      { slug: 'hobbies-colecoes-moedas-notas', label: 'Moedas e notas' },
      { slug: 'hobbies-colecoes-jogos-mesa-miniaturas', label: 'Jogos de mesa e de miniaturas' },
      { slug: 'hobbies-colecoes-organizacao-colecao', label: 'Organização de objetos de coleção' },
      { slug: 'hobbies-colecoes-instrumentos-equipamento', label: 'Instrumentos musicais e equipamento' },
      { slug: 'hobbies-colecoes-postais', label: 'Postais' },
      { slug: 'hobbies-colecoes-selos', label: 'Selos' },
      { slug: 'hobbies-colecoes-acessorios-jogos', label: 'Acessórios para jogos' },
    ],
  },
  {
    slug: 'desporto',
    label: 'Desporto',
    leaves: [
      { slug: 'desporto-ciclismo', label: 'Ciclismo' },
      { slug: 'desporto-equitacao', label: 'Equitação' },
      { slug: 'desporto-exterior', label: 'Desportos de exterior' },
      { slug: 'desporto-fitness-corrida-yoga', label: 'Fitness, corrida e yoga' },
      { slug: 'desporto-aquaticos', label: 'Desportos aquáticos' },
      { slug: 'desporto-coletivos', label: 'Desportos coletivos' },
      { slug: 'desporto-inverno', label: 'Desportos de inverno' },
      { slug: 'desporto-skates-trotinetes', label: 'Skates e trotinetes' },
      { slug: 'desporto-raquetes', label: 'Desportos com raquete' },
      { slug: 'desporto-boxe-artes-marciais', label: 'Boxe e artes marciais' },
      { slug: 'desporto-golfe', label: 'Golfe' },
      { slug: 'desporto-casuais', label: 'Desportos e jogos casuais' },
    ],
  },
];

export const MARKETPLACE_GROUP_SLUGS = PHYSICAL_CATEGORY_GROUPS.map((g) => g.slug) as readonly string[];

export const PHYSICAL_LEAF_CATEGORIES: CategoryItem[] = PHYSICAL_CATEGORY_GROUPS.flatMap((g) =>
  g.leaves.map((leaf) => ({ slug: leaf.slug, label: leaf.label }))
);

const PHYSICAL_LEAF_SET = new Set(PHYSICAL_LEAF_CATEGORIES.map((x) => x.slug));
const PHYSICAL_LEAF_LABEL_MAP = new Map(PHYSICAL_LEAF_CATEGORIES.map((x) => [x.slug, x.label]));

function findGroupForLeafSlug(leafSlug: string): (typeof PHYSICAL_CATEGORY_GROUPS)[number] | undefined {
  return PHYSICAL_CATEGORY_GROUPS.find((g) => g.leaves.some((l) => l.slug === leafSlug));
}

/** Navegação de topo: mesmos grupos + produto digital. */
export const CATEGORIES: CategoryItem[] = [
  ...PHYSICAL_CATEGORY_GROUPS.map((g) => ({ slug: g.slug, label: g.label })),
  { slug: CATEGORY_PRODUTO_DIGITAL, label: 'Produto digital' },
];

/** Subcategorias de produto digital (checkboxes). */
export const DIGITAL_SUBCATEGORIES: CategoryItem[] = [
  { slug: 'educacao-e-formacao', label: 'Educação e Formação' },
  { slug: 'design-e-criatividade', label: 'Design e Criatividade' },
  { slug: 'software-e-tecnologia', label: 'Software e Tecnologia' },
  { slug: 'audio-e-musica', label: 'Áudio e Música' },
  { slug: 'fotografia-e-video', label: 'Fotografia e Vídeo' },
  { slug: 'conteudo-e-entretenimento', label: 'Conteúdo e Entretenimento' },
  { slug: 'planeamento-e-negocios', label: 'Planeamento e Negócios' },
];

/**
 * @deprecated Legado: categoria única «entretenimento» + entertainment_subcategories.
 */
export const CATEGORY_ENTRETERIMENTO = 'entretenimento';

/** @deprecated Só para dados antigos. */
export const ENTERTAINMENT_SUBCATEGORIES: CategoryItem[] = [
  { slug: 'brinquedos-e-jogos', label: 'Brinquedos e Jogos' },
  { slug: 'livros-filmes-e-musica', label: 'Livros, Filmes e Música' },
  { slug: 'arte-e-colecionaveis', label: 'Arte e Colecionáveis' },
];

const DIGITAL_SUB_MAP = new Map(DIGITAL_SUBCATEGORIES.map((x) => [x.slug, x.label]));
const ENTERTAINMENT_SUB_MAP = new Map(ENTERTAINMENT_SUBCATEGORIES.map((x) => [x.slug, x.label]));

export const DEFAULT_CATEGORY_SLUG = 'mulher-roupa';

/** Folhas e grupos antigos (antes do alinhamento Vinted) — só leitura na BD. */
const LEGACY_LEAF_AND_GROUP_LABELS: Record<string, string> = {
  'mulher-sapatos': 'Mulher — Sapatos',
  'homem-cuidados': 'Homem — Cuidados pessoais',
  criancas: 'Crianças',
  'criancas-bebes': 'Crianças — Bebés (0–3 anos)',
  'criancas-meninos-meninas': 'Crianças — Meninos e meninas (3+)',
  'criancas-brinquedos': 'Crianças — Brinquedos',
  'casa-decoracao': 'Casa — Decoração',
  'casa-utensilios': 'Casa — Utensílios',
  'entretenimento-eletronica': 'Entretenimento — Eletrónica',
  'entretenimento-musica-video': 'Entretenimento — Música e vídeo',
  animais: 'Animais',
  'animais-acessorios': 'Animais — Acessórios',
  'animais-vestuario-brinquedos': 'Animais — Vestuário e brinquedos',
};

/** Legado e slugs antigos — só etiquetas para leitura. */
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  lazer: 'Lazer',
  moda: 'Moda',
  'bebe-e-crianca': 'Bebé e Criança',
  'telemoveis-tablets-smartwatches': 'Telemóveis, Tablets e Smartwatches',
  desporto: 'Desporto',
  'moveis-casa-e-jardim': 'Móveis, Casa e Jardim',
  'tecnologia-e-informatica': 'Tecnologia e Informática',
  'equipamentos-e-ferramentas': 'Equipamentos e Ferramentas',
  acessorios: 'Acessórios',
  'bolsas-e-carteiras': 'Bolsas e Carteiras',
  'beleza-e-higiene': 'Beleza e Higiene',
  'materiais-para-artesanato': 'Materiais para Artesanato',
  joalharia: 'Joalharia',
  'papelaria-e-festas': 'Papelaria e Festas',
  calcado: 'Calçado',
  'outras-vendas': 'Outras vendas',
  emprego: 'Emprego',
  servicos: 'Serviços',
  'carros-motos-e-barcos': 'Carros, motos e barcos',
  imoveis: 'Imóveis',
  agricultura: 'Agricultura',
  casamentos: 'Casamentos',
};

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

export function isMarketplaceGroupSlug(s: string): boolean {
  return PHYSICAL_CATEGORY_GROUPS.some((g) => g.slug === s);
}

export function isPhysicalLeafCategory(s: string): boolean {
  return PHYSICAL_LEAF_SET.has(s);
}

/** Aceita folhas novas, produto digital e slugs antigos ainda na BD. */
export function isAllowedProductCategorySlug(slug: string): boolean {
  if (!slug) return false;
  if (slug === CATEGORY_PRODUTO_DIGITAL) return true;
  if (isPhysicalLeafCategory(slug)) return true;
  if (slug === CATEGORY_ENTRETERIMENTO) return true;
  if (Object.prototype.hasOwnProperty.call(LEGACY_LEAF_AND_GROUP_LABELS, slug)) return true;
  return Object.prototype.hasOwnProperty.call(LEGACY_CATEGORY_LABELS, slug);
}

export const PRODUCT_TYPE_REUTILIZADOS = 'reutilizados';

export function normalizeProductType(type: string | null | undefined): string {
  if (!type) return '';
  if (type === 'used') return PRODUCT_TYPE_REUTILIZADOS;
  return type;
}

export function formatProductTypeLabel(type: string): string {
  const t = normalizeProductType(type);
  const map: Record<string, string> = {
    physical: 'Físico',
    digital: 'Digital',
    reutilizados: 'Reutilizado',
  };
  return map[t] ?? type;
}

/** Item para filo de navegação no detalhe do produto (href null = página atual). */
export type ProductBreadcrumbItem = { label: string; href: string | null };

/**
 * Caminho tipo «Início / Eletrónica / Videojogos & consolas / Título do anúncio»
 * com links para listagens filtradas quando possível.
 */
export function buildProductBreadcrumbItems(product: {
  category: string;
  title: string;
  digital_subcategories?: string[] | null;
  entertainment_subcategories?: string[] | null;
}): ProductBreadcrumbItem[] {
  const items: ProductBreadcrumbItem[] = [{ label: 'Início', href: '/' }];
  const cat = product.category;

  if (cat === CATEGORY_PRODUTO_DIGITAL) {
    items.push({
      label: 'Produto digital',
      href: `/produtos?categoria=${encodeURIComponent(CATEGORY_PRODUTO_DIGITAL)}`,
    });
    for (const slug of product.digital_subcategories ?? []) {
      if (!slug?.trim()) continue;
      const s = slug.trim().toLowerCase();
      items.push({
        label: getDigitalSubcategoryLabel(s),
        href: `/produtos?categoria=${encodeURIComponent(CATEGORY_PRODUTO_DIGITAL)}&subcategorias=${encodeURIComponent(s)}`,
      });
    }
    items.push({ label: product.title.trim() || 'Produto', href: null });
    return items;
  }

  if (cat === CATEGORY_ENTRETERIMENTO) {
    items.push({
      label: 'Entretenimento',
      href: `/produtos?categoria=${encodeURIComponent(CATEGORY_ENTRETERIMENTO)}`,
    });
    for (const slug of product.entertainment_subcategories ?? []) {
      if (!slug?.trim()) continue;
      const s = slug.trim().toLowerCase();
      items.push({
        label: getEntertainmentSubcategoryLabel(s),
        href: `/produtos?categoria=${encodeURIComponent(CATEGORY_ENTRETERIMENTO)}&subcategorias=${encodeURIComponent(s)}`,
      });
    }
    items.push({ label: product.title.trim() || 'Produto', href: null });
    return items;
  }

  if (isPhysicalLeafCategory(cat)) {
    const grp = findGroupForLeafSlug(cat);
    const leafLabel = PHYSICAL_LEAF_LABEL_MAP.get(cat) ?? cat;
    if (grp) {
      items.push({
        label: grp.label,
        href: `/produtos?categoria=${encodeURIComponent(grp.slug)}`,
      });
      items.push({
        label: leafLabel,
        href: `/produtos?categoria=${encodeURIComponent(cat)}`,
      });
    } else {
      items.push({
        label: getCategoryLabel(cat),
        href: `/produtos?categoria=${encodeURIComponent(cat)}`,
      });
    }
    items.push({ label: product.title.trim() || 'Produto', href: null });
    return items;
  }

  items.push({
    label: getCategoryLabel(cat),
    href: `/produtos?categoria=${encodeURIComponent(cat)}`,
  });
  items.push({ label: product.title.trim() || 'Produto', href: null });
  return items;
}

/** Rótulo completo para `products.category` (folha, digital ou legado). */
export function getCategoryLabel(slug: string): string {
  if (!slug) return '';
  if (slug === CATEGORY_PRODUTO_DIGITAL) return 'Produto digital';
  const legacyLeaf = LEGACY_LEAF_AND_GROUP_LABELS[slug];
  if (legacyLeaf) return legacyLeaf;
  const leaf = PHYSICAL_LEAF_LABEL_MAP.get(slug);
  if (leaf) {
    const grp = findGroupForLeafSlug(slug);
    if (grp) return `${grp.label} — ${leaf}`;
    return leaf;
  }
  const nav = CATEGORIES.find((x) => x.slug === slug);
  if (nav) return nav.label;
  if (slug === 'outros') return 'Lazer';
  const legacy = LEGACY_CATEGORY_LABELS[slug];
  if (legacy) return legacy;
  if (slug === CATEGORY_ENTRETERIMENTO) return 'Entretenimento (legado)';
  return slug;
}
