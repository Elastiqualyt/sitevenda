'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, CATEGORY_PRODUTO_DIGITAL } from '@/lib/categories';
import type { Product, ProductType } from '@/lib/types';

const DIGITAL_BUCKET = 'digital-files';
const PRODUCT_IMAGES_BUCKET = 'product-images';
const ACCEPT_FILES = '.pdf,.jpg,.jpeg,.png';
const ACCEPT_IMAGES = '.jpg,.jpeg,.png,.webp';

function getFileExtension(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'jpg';
  if (name.endsWith('.png')) return 'png';
  if (name.endsWith('.webp')) return 'webp';
  return 'bin';
}

export default function EditarProdutoPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<ProductType>('physical');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isProdutoDigital = category === CATEGORY_PRODUTO_DIGITAL;

  useEffect(() => {
    if (!id) return;
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        const p = data as Product | null;
        setProduct(p);
        if (p) {
          setTitle(p.title);
          setDescription(p.description ?? '');
          setPrice(String(p.price));
          setType(p.type as ProductType);
          setCategory(p.category ?? '');
          setStock(String(p.stock ?? 0));
          setImageUrl(p.image_url ?? '');
          setFileUrl(p.file_url ?? null);
        }
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user?.id || !product) return;
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Preço inválido.');
      return;
    }
    setLoading(true);
    let finalImageUrl = imageUrl.trim() || null;
    if (photoFile) {
      const ext = getFileExtension(photoFile);
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, photoFile, {
        contentType: photoFile.type,
        upsert: false,
      });
      if (uploadErr) {
        setLoading(false);
        setError('Erro ao enviar foto: ' + uploadErr.message);
        return;
      }
      const { data: urlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
      finalImageUrl = urlData.publicUrl;
    }
    let newFileUrl: string | null = fileUrl;
    if (isProdutoDigital && digitalFile) {
      const ext = getFileExtension(digitalFile);
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(DIGITAL_BUCKET).upload(path, digitalFile, {
        contentType: digitalFile.type,
        upsert: false,
      });
      if (uploadErr) {
        setLoading(false);
        setError('Erro ao enviar ficheiro: ' + uploadErr.message);
        return;
      }
      const { data: urlData } = supabase.storage.from(DIGITAL_BUCKET).getPublicUrl(path);
      newFileUrl = urlData.publicUrl;
    }
    const { error: err } = await supabase
      .from('products')
      .update({
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        type: isProdutoDigital ? 'digital' : type,
        category: category || 'outras-vendas',
        stock: Math.max(0, parseInt(stock, 10) || 0),
        image_url: finalImageUrl,
        file_url: isProdutoDigital ? newFileUrl : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('seller_id', user.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/vendedor/produtos');
    router.refresh();
  };

  if (!product) return <p className="loading">A carregar...</p>;

  return (
    <div className="vendedor-page">
      <h1><Link href="/vendedor/produtos" className="vendedor-back">←</Link> Editar produto</h1>
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-error">{error}</p>}
          <label className="auth-label">
            Título *
            <input
              type="text"
              className="auth-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="auth-label">
            Descrição
            <textarea
              className="auth-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="auth-label">
            Preço (€) *
            <input
              type="text"
              className="auth-input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className="auth-label">
            Tipo *
            <select className="auth-input" value={type} onChange={(e) => setType(e.target.value as ProductType)}>
              <option value="digital">Digital</option>
              <option value="physical">Físico / Artesanato</option>
              <option value="used">Usado</option>
            </select>
          </label>
          <label className="auth-label">
            Categoria
            <select className="auth-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="auth-label">
            Stock
            <input
              type="number"
              min={0}
              className="auth-input"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </label>
          <label className="auth-label">
            Foto do anúncio
            <input
              type="url"
              className="auth-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL da imagem (https://...)"
            />
          </label>
          <label className="auth-label">
            Ou carregar nova foto (JPEG, PNG ou WebP)
            <input
              type="file"
              className="auth-input"
              accept={ACCEPT_IMAGES}
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
            {photoFile && <span className="perfil-hint">{photoFile.name}</span>}
            {imageUrl && !photoFile && (
              <span className="perfil-hint">Atual: <a href={imageUrl} target="_blank" rel="noopener noreferrer">Ver imagem</a></span>
            )}
          </label>
          {isProdutoDigital && (
            <label className="auth-label">
              Anexar produto (PDF ou imagem JPEG/PNG)
              <input
                type="file"
                className="auth-input"
                accept={ACCEPT_FILES}
                onChange={(e) => setDigitalFile(e.target.files?.[0] ?? null)}
              />
              {digitalFile && <span className="perfil-hint">{digitalFile.name}</span>}
              {fileUrl && !digitalFile && (
                <span className="perfil-hint">Ficheiro atual: <a href={fileUrl} target="_blank" rel="noopener noreferrer">Abrir</a></span>
              )}
            </label>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'A guardar...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}
