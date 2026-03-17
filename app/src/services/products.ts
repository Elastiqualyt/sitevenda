import { apiUrl } from '../config/api';
import type { Product } from '../types/product';

export async function fetchProducts(type?: string): Promise<Product[]> {
  const url = type ? apiUrl(`/api/products?tipo=${type}`) : apiUrl('/api/products');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao carregar produtos');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const res = await fetch(apiUrl(`/api/products/${id}`));
  if (!res.ok) return null;
  return res.json();
}
