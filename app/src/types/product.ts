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
  created_at: string;
  updated_at: string;
}
