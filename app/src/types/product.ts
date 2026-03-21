export type ProductType = 'digital' | 'physical' | 'reutilizados';

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  type: ProductType;
  image_url: string | null;
  gallery_urls?: string[] | null;
  file_url?: string | null;
  category: string;
  digital_subcategories?: string[] | null;
  entertainment_subcategories?: string[] | null;
  created_at: string;
  updated_at: string;
}
