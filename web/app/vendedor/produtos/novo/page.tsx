'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, CATEGORY_PRODUTO_DIGITAL } from '@/lib/categories';
import type { ProductType } from '@/lib/types';

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

export default function NovoProdutoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<ProductType>('physical');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isProdutoDigital = category === CATEGORY_PRODUTO_DIGITAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user?.id) return;
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
        setError('Erro ao enviar foto: ' + uploadErr.message + '. Cria o bucket "product-images" no Supabase Storage.');
        return;
      }
      const { data: urlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
      finalImageUrl = urlData.publicUrl;
    }
    let fileUrl: string | null = null;
    if (isProdutoDigital && digitalFile) {
      const ext = getFileExtension(digitalFile);
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(DIGITAL_BUCKET).upload(path, digitalFile, {
        contentType: digitalFile.type,
        upsert: false,
      });
      if (uploadErr) {
        setLoading(false);
        setError('Erro ao enviar ficheiro: ' + uploadErr.message + '. Cria o bucket "digital-files" no Supabase Storage.');
        return;
      }
      const { data: urlData } = supabase.storage.from(DIGITAL_BUCKET).getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }
    const { error: err } = await supabase.from('products').insert({
      seller_id: user.id,
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      type: isProdutoDigital ? 'digital' : type,
      category: category || 'outras-vendas',
      stock: Math.max(0, parseInt(stock, 10) || 0),
      image_url: finalImageUrl,
      file_url: fileUrl,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/vendedor/produtos');
    router.refresh();
  };

  return (
    <div className="vendedor-page">
      <h1>
        <Link href="/vendedor/produtos" className="vendedor-back">←</Link> Novo produto
      </h1>
      <div className="auth-card vendedor-form-card">
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-error">{error}</p>}
          <label className="auth-label">
            Título *
            <input type="text" className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="auth-label">
            Descrição
            <textarea className="auth-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="auth-label">
            Preço (€) *
            <input type="text" className="auth-input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required />
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
            Stock (quantidade)
            <input type="number" min={0} className="auth-input" value={stock} onChange={(e) => setStock(e.target.value)} />
          </label>
          <label className="auth-label">
            Foto do anúncio
            <input type="url" className="auth-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL da imagem (https://...)" />
          </label>
          <label className="auth-label">
            Ou carregar foto (JPEG, PNG ou WebP)
            <input
              type="file"
              className="auth-input"
              accept={ACCEPT_IMAGES}
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
            {photoFile && <span className="perfil-hint">{photoFile.name}</span>}
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
            </label>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'A guardar...' : 'Criar produto'}
          </button>
        </form>
      </div>
    </div>
  );
}
