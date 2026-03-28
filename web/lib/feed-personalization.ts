/**
 * Preferências de feed (personalização) — alinhado ao espírito da Vinted PT.
 * Tamanhos adulto: letras + equivalência numérica EU comum na Vinted (ajuda: tabelas de tamanhos).
 * Referência marcas: https://www.vinted.pt/brands
 */

export type FeedSizeOption = { id: string; label: string };

/** Roupa adulta (mulher/homem): formato Vinted-style letra + nº EU frequente. */
export const FEED_SIZES_ADULT: FeedSizeOption[] = [
  { id: 'xxs', label: 'XXS · 32' },
  { id: 'xs', label: 'XS · 34' },
  { id: 's', label: 'S · 36' },
  { id: 'm', label: 'M · 38' },
  { id: 'l', label: 'L · 40' },
  { id: 'xl', label: 'XL · 42' },
  { id: 'xxl', label: 'XXL · 44' },
  { id: 'xxxl', label: 'XXXL · 46' },
  { id: 'one-size', label: 'Tamanho único' },
];

/**
 * Criança: faixas etárias / meses usadas em marketplaces tipo Vinted (varia por categoria no catálogo real).
 */
export const FEED_SIZES_KIDS: FeedSizeOption[] = [
  { id: 'nb', label: 'Recém-nascido' },
  { id: '0-1m', label: '0-1 m' },
  { id: '1-3m', label: '1-3 m' },
  { id: '3-6m', label: '3-6 m' },
  { id: '6-9m', label: '6-9 m' },
  { id: '9-12m', label: '9-12 m' },
  { id: '12-18m', label: '12-18 m' },
  { id: '18-24m', label: '18-24 m' },
  { id: '2y', label: '2 anos' },
  { id: '3y', label: '3 anos' },
  { id: '4y', label: '4 anos' },
  { id: '5y', label: '5 anos' },
  { id: '6y', label: '6 anos' },
  { id: '7-8y', label: '7-8 anos' },
  { id: '9-10y', label: '9-10 anos' },
  { id: '11-12y', label: '11-12 anos' },
  { id: '13-14y', label: '13-14 anos' },
  { id: '15-16y', label: '15-16 anos' },
  { id: 'kids-one-size', label: 'Tamanho único' },
];

export type FeedBrandEntry = { id: string; label: string };

/** Marcas populares por letra (subconjunto inspirado na página de marcas da Vinted PT). */
export const POPULAR_BRANDS_BY_LETTER: { letter: string; brands: FeedBrandEntry[] }[] = [
  {
    letter: 'A',
    brands: [
      { id: 'adidas', label: 'adidas' },
      { id: 'asos', label: 'ASOS' },
      { id: 'amisu', label: 'Amisu' },
      { id: 'atmosphere', label: 'Atmosphere' },
      { id: 'apple', label: 'Apple' },
      { id: 'amazon', label: 'Amazon' },
      { id: 'abercrombie-fitch', label: 'Abercrombie & Fitch' },
      { id: 'asics', label: 'Asics' },
    ],
  },
  {
    letter: 'B',
    brands: [
      { id: 'bershka', label: 'Bershka' },
      { id: 'boohoo', label: 'Boohoo' },
      { id: 'burberry', label: 'Burberry' },
      { id: 'bonobo', label: 'Bonobo' },
      { id: 'barbie', label: 'Barbie' },
      { id: 'brandy-melville', label: 'Brandy Melville' },
      { id: 'boss', label: 'Boss' },
      { id: 'bonprix', label: 'Bonprix' },
    ],
  },
  {
    letter: 'C',
    brands: [
      { id: 'ca', label: 'C&A' },
      { id: 'camaieu', label: 'Camaïeu' },
      { id: 'calvin-klein', label: 'Calvin Klein' },
      { id: 'cache-cache', label: 'Cache Cache' },
      { id: 'converse', label: 'Converse' },
      { id: 'carhartt', label: 'Carhartt' },
      { id: 'champion', label: 'Champion' },
      { id: 'cool-club', label: 'Cool Club' },
      { id: 'chicco', label: 'Chicco' },
      { id: 'cropp', label: 'CROPP' },
      { id: 'celio', label: 'Celio' },
      { id: 'calzedonia', label: 'Calzedonia' },
      { id: 'cos', label: 'COS' },
      { id: 'crocs', label: 'Crocs' },
      { id: 'clarks', label: 'Clarks' },
      { id: 'columbia', label: 'Columbia' },
    ],
  },
  {
    letter: 'D',
    brands: [
      { id: 'disney', label: 'Disney' },
      { id: 'decathlon', label: 'Decathlon' },
      { id: 'desigual', label: 'Desigual' },
      { id: 'du-pareil-au-meme', label: 'Du Pareil au Même' },
      { id: 'diesel', label: 'Diesel' },
      { id: 'dr-martens', label: 'Dr. Martens' },
      { id: 'disney-baby', label: 'Disney Baby' },
      { id: 'domyos', label: 'Domyos' },
      { id: 'dickies', label: 'Dickies' },
      { id: 'dkny', label: 'DKNY' },
      { id: 'dior', label: 'Dior' },
    ],
  },
  {
    letter: 'E',
    brands: [
      { id: 'esprit', label: 'Esprit' },
      { id: 'etam', label: 'Etam' },
      { id: 'esmara', label: 'Esmara' },
      { id: 'ellesse', label: 'Ellesse' },
      { id: 'el-corte-ingles', label: 'El Corte Inglés' },
    ],
  },
  {
    letter: 'F',
    brands: [
      { id: 'ff', label: 'F&F' },
      { id: 'funko', label: 'Funko' },
      { id: 'fila', label: 'FILA' },
      { id: 'forever-21', label: 'Forever 21' },
      { id: 'fisher-price', label: 'Fisher Price' },
    ],
  },
  {
    letter: 'G',
    brands: [
      { id: 'guess', label: 'GUESS' },
      { id: 'gemo', label: 'Gémo' },
      { id: 'george', label: 'George' },
      { id: 'gap', label: 'GAP' },
      { id: 'gymshark', label: 'Gymshark' },
      { id: 'geox', label: 'Geox' },
      { id: 'gucci', label: 'Gucci' },
      { id: 'g-star', label: 'G-Star' },
      { id: 'gant', label: 'GANT' },
    ],
  },
  {
    letter: 'H',
    brands: [
      { id: 'hm', label: 'H&M' },
      { id: 'hollister', label: 'Hollister' },
      { id: 'hugo-boss', label: 'Hugo Boss' },
      { id: 'hema', label: 'Hema' },
      { id: 'house', label: 'House' },
      { id: 'hot-wheels', label: 'Hot Wheels' },
      { id: 'harry-potter', label: 'Harry Potter' },
      { id: 'hasbro', label: 'Hasbro' },
      { id: 'hello-kitty', label: 'Hello Kitty' },
    ],
  },
  {
    letter: 'I',
    brands: [
      { id: 'ikks', label: 'IKKS' },
      { id: 'ikea', label: 'IKEA' },
    ],
  },
  {
    letter: 'J',
    brands: [
      { id: 'jennyfer', label: 'Jennyfer' },
      { id: 'jordan', label: 'Jordan' },
      { id: 'jack-jones', label: 'Jack & Jones' },
      { id: 'jules', label: 'Jules' },
      { id: 'jacadi', label: 'Jacadi' },
    ],
  },
  {
    letter: 'K',
    brands: [
      { id: 'kiabi', label: 'Kiabi' },
      { id: 'kaporal', label: 'Kaporal' },
      { id: 'kappa', label: 'Kappa' },
      { id: 'kenzo', label: 'Kenzo' },
    ],
  },
  {
    letter: 'L',
    brands: [
      { id: 'levis', label: "Levi's" },
      { id: 'lacoste', label: 'Lacoste' },
      { id: 'lego', label: 'LEGO' },
      { id: 'lupilu', label: 'Lupilu' },
      { id: 'lefties', label: 'Lefties' },
      { id: 'lindex', label: 'Lindex' },
      { id: 'liu-jo', label: 'Liu Jo' },
      { id: 'la-redoute', label: 'La Redoute' },
      { id: 'louis-vuitton', label: 'Louis Vuitton' },
    ],
  },
  {
    letter: 'M',
    brands: [
      { id: 'mango', label: 'Mango' },
      { id: 'marks-spencer', label: 'Marks & Spencer' },
      { id: 'mayoral', label: 'Mayoral' },
      { id: 'massimo-dutti', label: 'Massimo Dutti' },
      { id: 'mohito', label: 'Mohito' },
      { id: 'michael-kors', label: 'Michael Kors' },
      { id: 'marvel', label: 'Marvel' },
      { id: 'monki', label: 'Monki' },
      { id: 'maje', label: 'Maje' },
    ],
  },
  {
    letter: 'N',
    brands: [
      { id: 'nike', label: 'Nike' },
      { id: 'next', label: 'Next' },
      { id: 'new-look', label: 'New Look' },
      { id: 'new-yorker', label: 'New Yorker' },
      { id: 'new-balance', label: 'New Balance' },
      { id: 'name-it', label: 'Name It' },
      { id: 'naf-naf', label: 'Naf Naf' },
      { id: 'nintendo', label: 'Nintendo' },
      { id: 'napapijri', label: 'Napapijri' },
    ],
  },
  {
    letter: 'O',
    brands: [
      { id: 'only', label: 'ONLY' },
      { id: 'orchestra', label: 'Orchestra' },
      { id: 'okaidi', label: 'Okaïdi' },
      { id: 'obaibi', label: 'Obaïbi' },
      { id: 'ovs', label: 'OVS' },
    ],
  },
  {
    letter: 'P',
    brands: [
      { id: 'primark', label: 'Primark' },
      { id: 'pull-bear', label: 'Pull & Bear' },
      { id: 'pokemon', label: 'Pokémon' },
      { id: 'puma', label: 'Puma' },
      { id: 'pimkie', label: 'Pimkie' },
      { id: 'prettylittlething', label: 'PrettyLittleThing' },
      { id: 'promod', label: 'Promod' },
      { id: 'petit-bateau', label: 'Petit Bateau' },
      { id: 'playmobil', label: 'Playmobil' },
      { id: 'pandora', label: 'Pandora' },
      { id: 'pepe-jeans', label: 'Pepe Jeans' },
      { id: 'parfois', label: 'Parfois' },
    ],
  },
  {
    letter: 'Q',
    brands: [
      { id: 'quechua', label: 'Quechua' },
      { id: 'quiz', label: 'Quiz' },
    ],
  },
  {
    letter: 'R',
    brands: [
      { id: 'ralph-lauren', label: 'Ralph Lauren' },
      { id: 'river-island', label: 'River Island' },
      { id: 'reserved', label: 'Reserved' },
      { id: 'reebok', label: 'Reebok' },
      { id: 'ray-ban', label: 'Ray-Ban' },
    ],
  },
  {
    letter: 'S',
    brands: [
      { id: 'shein', label: 'Shein' },
      { id: 'stradivarius', label: 'Stradivarius' },
      { id: 'sinsay', label: 'Sinsay' },
      { id: 'superdry', label: 'Superdry' },
      { id: 'soliver', label: 's.Oliver' },
      { id: 'springfield', label: 'Springfield' },
      { id: 'star-wars', label: 'Star Wars' },
      { id: 'samsung', label: 'Samsung' },
    ],
  },
  {
    letter: 'T',
    brands: [
      { id: 'tommy-hilfiger', label: 'Tommy Hilfiger' },
      { id: 'topshop', label: 'Topshop' },
      { id: 'the-north-face', label: 'The North Face' },
      { id: 'timberland', label: 'Timberland' },
      { id: 'tezenis', label: 'Tezenis' },
    ],
  },
  {
    letter: 'U',
    brands: [
      { id: 'united-colors-benetton', label: 'United Colors of Benetton' },
      { id: 'urban-outfitters', label: 'Urban Outfitters' },
      { id: 'under-armour', label: 'Under Armour' },
      { id: 'uniqlo', label: 'Uniqlo' },
      { id: 'ugg', label: 'UGG' },
    ],
  },
  {
    letter: 'V',
    brands: [
      { id: 'vintage-dressing', label: 'Vintage Dressing' },
      { id: 'vero-moda', label: 'Vero Moda' },
      { id: 'vans', label: 'Vans' },
      { id: 'vertbaudet', label: 'Vertbaudet' },
      { id: 'vtech', label: 'VTech' },
    ],
  },
  {
    letter: 'W',
    brands: [{ id: 'wedze', label: "Wed'ze" }],
  },
  {
    letter: 'Z',
    brands: [
      { id: 'zara', label: 'Zara' },
      { id: 'zeeman', label: 'Zeeman' },
    ],
  },
  {
    letter: 'Outro',
    brands: [{ id: 'other-stories', label: '& Other Stories' }],
  },
];

export const FEED_PERSONALIZATION_STORAGE_KEY = 'terraplace_feed_personalization_v2';

/** Chave antiga (migração automática para v2). */
export const FEED_PERSONALIZATION_STORAGE_KEY_LEGACY = 'terraplace_feed_personalization_v1';

const ALL_SIZE_IDS = new Set([
  ...FEED_SIZES_ADULT.map((s) => s.id),
  ...FEED_SIZES_KIDS.map((s) => s.id),
]);

/** Converte valores guardados (ex. maiúsculas da v1) para ids atuais. */
export function normalizeImportedSizeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const legacyMap: Record<string, string> = {
    xxs: 'xxs',
    xs: 'xs',
    s: 's',
    m: 'm',
    l: 'l',
    xl: 'xl',
    xxl: 'xxl',
    xxxl: 'xxxl',
    'one-size': 'one-size',
    'tamanho único': 'one-size',
    'tamanho unico': 'one-size',
  };
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const t = item.trim().toLowerCase();
    const id = legacyMap[t] ?? t;
    if (ALL_SIZE_IDS.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function normalizeImportedBrandIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(POPULAR_BRANDS_BY_LETTER.flatMap((g) => g.brands.map((b) => b.id)));
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const id = item.trim();
    if (known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}
