export type ProductType = 'digital' | 'physical' | 'reutilizados';

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  type: ProductType;
  image_url: string | null;
  /** URLs das imagens do anúncio (galeria); a primeira costuma coincidir com image_url. */
  gallery_urls?: string[] | null;
  file_url?: string | null;
  category: string;
  /** Slugs das subcategorias (categoria produto-digital). */
  digital_subcategories?: string[] | null;
  /** Slugs das subcategorias (categoria entretenimento). */
  entertainment_subcategories?: string[] | null;
  stock: number;
  /** Portes fixos por linha de pedido (só artigos físicos). null = não definido na plataforma; 0 = grátis. */
  shipping_fee_eur?: number | null;
  /** Se true, o vendedor indica envio apenas na própria região. */
  ships_only_same_region?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface BalanceTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'sale' | 'purchase';
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}
