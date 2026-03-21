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
  { slug: 'emprego', label: 'Emprego' },
  { slug: 'servicos', label: 'Serviços' },
  { slug: 'equipamentos-e-ferramentas', label: 'Equipamentos e Ferramentas' },
  { slug: 'outras-vendas', label: 'Outras Vendas' },
  { slug: 'acessorios', label: 'Acessórios' },
  { slug: 'arte-e-colecionaveis', label: 'Arte e Colecionáveis' },
  { slug: 'bolsas-e-carteiras', label: 'Bolsas e Carteiras' },
  { slug: 'beleza-e-higiene', label: 'Beleza e Higiene' },
  { slug: 'livros-filmes-e-musica', label: 'Livros, Filmes e Música' },
  { slug: 'materiais-para-artesanato', label: 'Materiais para Artesanato' },
  { slug: 'joalharia', label: 'Joalharia' },
  { slug: 'papelaria-e-festas', label: 'Papelaria e Festas' },
  { slug: 'calcado', label: 'Calçado' },
  { slug: 'brinquedos-e-jogos', label: 'Brinquedos e Jogos' },
  { slug: 'casamentos', label: 'Casamentos' },
];

/** Slug padrão quando não há categoria (compatível com schema atual). */
export const DEFAULT_CATEGORY_SLUG = 'outras-vendas';

export function getCategoryLabel(slug: string): string {
  if (!slug) return '';
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (c) return c.label;
  if (slug === 'outros') return 'Outras Vendas';
  return slug;
}
