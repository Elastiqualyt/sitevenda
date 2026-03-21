export type ProductType = 'digital' | 'physical' | 'used';

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  type: ProductType;
  image_url: string | null;
  file_url?: string | null;
  category: string;
  stock: number;
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
