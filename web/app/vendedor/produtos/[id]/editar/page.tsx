'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  CATEGORY_ENTRETERIMENTO,
  CATEGORY_PRODUTO_DIGITAL,
  DEFAULT_CATEGORY_SLUG,
  DIGITAL_SUBCATEGORIES,
  ENTERTAINMENT_SUBCATEGORIES,
  getCategoryLabel,
  isPhysicalLeafCategory,
  PHYSICAL_CATEGORY_GROUPS,
} from '@/lib/categories';
import type { Product, ProductType } from '@/lib/types';
import { MAX_AD_PHOTOS, parseGalleryUrls } from '@/lib/product-gallery';
import { uploadDigitalProductFile, uploadGalleryImages } from '@/lib/product-upload';
import { SellerListingPolicy, SellerListingPolicyAcceptance } from '@/components/SellerListingPolicy';
import { roundMoney2 } from '@/lib/product-shipping';

const DIGITAL_BUCKET = 'digital-files';
const PRODUCT_IMAGES_BUCKET = 'product-images';
const ACCEPT_FILES = '.pdf,.jpg,.jpeg,.png';
const ACCEPT_IMAGES = '.jpg,.jpeg,.png,.webp';

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
  const [digitalSubcategories, setDigitalSubcategories] = useState<string[]>([]);
  const [entertainmentSubcategories, setEntertainmentSubcategories] = useState<string[]>([]);
  const [stock, setStock] = useState('0');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryFilesToAdd, setGalleryFilesToAdd] = useState<File[]>([]);
  const [extraImageUrl, setExtraImageUrl] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [shippingFeeInput, setShippingFeeInput] = useState('');
  const [shipsOnlySameRegion, setShipsOnlySameRegion] = useState(false);

  const isProdutoDigital = category === CATEGORY_PRODUTO_DIGITAL;
  const isEntretenimento = category === CATEGORY_ENTRETERIMENTO;

  const toggleDigitalSubcategory = (slug: string) => {
    setDigitalSubcategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleEntertainmentSubcategory = (slug: string) => {
    setEntertainmentSubcategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

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
          setDigitalSubcategories(
            Array.isArray(p.digital_subcategories) ? [...p.digital_subcategories] : []
          );
          setEntertainmentSubcategories(
            Array.isArray(p.entertainment_subcategories) ? [...p.entertainment_subcategories] : []
          );
          setStock(String(p.stock ?? 0));
          const g = parseGalleryUrls(p.gallery_urls);
          setGalleryUrls(g.length > 0 ? g : p.image_url ? [p.image_url] : []);
          setExtraImageUrl('');
          setGalleryFilesToAdd([]);
          setFileUrl(p.file_url ?? null);
          setShippingFeeInput(
            p.shipping_fee_eur != null && p.shipping_fee_eur !== undefined ? String(p.shipping_fee_eur) : ''
          );
          setShipsOnlySameRegion(!!p.ships_only_same_region);
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
    if (isProdutoDigital && digitalSubcategories.length === 0) {
      setError('Seleciona pelo menos uma subcategoria de Produto Digital.');
      return;
    }
    if (isEntretenimento && entertainmentSubcategories.length === 0) {
      setError('Seleciona pelo menos uma subcategoria de Entretenimento (anúncio legado) ou altera a categoria.');
      return;
    }
    setLoading(true);
    setUploadStatus('A iniciar…');

    let finalImageUrl: string | null = null;
    let mergedGallery: string[] = [];
    let newFileUrl: string | null = fileUrl;

    try {
      mergedGallery = [...galleryUrls];
      if (extraImageUrl.trim()) {
        const u = extraImageUrl.trim();
        if (!mergedGallery.includes(u)) mergedGallery.push(u);
      }
      const room = Math.max(0, MAX_AD_PHOTOS - mergedGallery.length);
      if (galleryFilesToAdd.length > 0 && room > 0) {
        const toUpload = galleryFilesToAdd.slice(0, room);
        setUploadStatus(`A enviar ${toUpload.length} foto(s)…`);
        const uploaded = await uploadGalleryImages(user.id, toUpload, PRODUCT_IMAGES_BUCKET);
        mergedGallery = [...mergedGallery, ...uploaded];
      }
      mergedGallery = mergedGallery.slice(0, MAX_AD_PHOTOS);

      if (mergedGallery.length === 0) {
        setError(`Adiciona pelo menos uma foto do anúncio (até ${MAX_AD_PHOTOS} imagens).`);
        return;
      }
      finalImageUrl = mergedGallery[0];

      if (isProdutoDigital) {
        if (digitalFile) {
          setUploadStatus('A enviar ficheiro do produto…');
          newFileUrl = await uploadDigitalProductFile(user.id, digitalFile, DIGITAL_BUCKET);
        }
        if (!newFileUrl) {
          setError('Produto digital: é necessário um ficheiro para download (carrega um ficheiro ou mantém o atual).');
          return;
        }
      }

      setUploadStatus('A guardar…');
      let shippingFeeEur: number | null = null;
      if (!isProdutoDigital) {
        const s = shippingFeeInput.trim();
        if (s !== '') {
          const sf = parseFloat(s.replace(',', '.'));
          if (isNaN(sf) || sf < 0) {
            setError('Portes: indica um valor válido em EUR ou deixa em branco.');
            return;
          }
          shippingFeeEur = roundMoney2(sf);
        }
      }
      const { error: err } = await supabase
        .from('products')
        .update({
          title: title.trim(),
          description: description.trim(),
          price: priceNum,
          type: isProdutoDigital ? 'digital' : type,
          category: category || DEFAULT_CATEGORY_SLUG,
          digital_subcategories: isProdutoDigital ? digitalSubcategories : [],
          entertainment_subcategories: isEntretenimento ? entertainmentSubcategories : [],
          stock: isProdutoDigital ? 0 : Math.max(0, parseInt(stock, 10) || 0),
          image_url: finalImageUrl,
          gallery_urls: mergedGallery,
          file_url: isProdutoDigital ? newFileUrl : null,
          shipping_fee_eur: isProdutoDigital ? null : shippingFeeEur,
          ships_only_same_region: !isProdutoDigital && shipsOnlySameRegion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('seller_id', user.id);
      if (err) {
        setError(err.message);
        return;
      }
      router.push('/vendedor/produtos');
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes('Failed to fetch') || msg.includes('NetworkError')
          ? 'Ligação interrompida. Verifica a internet.'
          : `Erro: ${msg}`
      );
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  if (!product) return <p className="loading">A carregar...</p>;

  return (
    <div className="vendedor-page">
      <h1><Link href="/vendedor/produtos" className="vendedor-back">←</Link> Editar produto</h1>
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <SellerListingPolicy />
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
            <select
              className="auth-input"
              value={type}
              onChange={(e) => {
                const v = e.target.value as ProductType;
                setType(v);
                if (v === 'digital') {
                  setCategory(CATEGORY_PRODUTO_DIGITAL);
                } else if (category === CATEGORY_PRODUTO_DIGITAL) {
                  setCategory(DEFAULT_CATEGORY_SLUG);
                }
              }}
            >
              <option value="digital">Digital</option>
              <option value="physical">Físico / Artesanato</option>
              <option value="reutilizados">Reutilizado</option>
            </select>
          </label>
          <label className="auth-label">
            Categoria *
            <select
              className="auth-input"
              value={category}
              onChange={(e) => {
                const v = e.target.value;
                setCategory(v);
                if (v === CATEGORY_PRODUTO_DIGITAL) {
                  setType('digital');
                  setEntertainmentSubcategories([]);
                  return;
                }
                setDigitalSubcategories([]);
                if (v !== CATEGORY_ENTRETERIMENTO) setEntertainmentSubcategories([]);
                if (type === 'digital') setType('physical');
              }}
              required
            >
              <option value="">— Escolher —</option>
              {PHYSICAL_CATEGORY_GROUPS.map((g) => (
                <optgroup key={g.slug} label={g.label}>
                  {g.leaves.map((leaf) => (
                    <option key={leaf.slug} value={leaf.slug}>
                      {leaf.label}
                    </option>
                  ))}
                </optgroup>
              ))}
              <optgroup label="Produto digital">
                <option value={CATEGORY_PRODUTO_DIGITAL}>Produto digital (ficheiros para download)</option>
              </optgroup>
              {product.category &&
              !isPhysicalLeafCategory(product.category) &&
              product.category !== CATEGORY_PRODUTO_DIGITAL ? (
                <optgroup label="Categoria atual (legado)">
                  <option value={product.category}>{getCategoryLabel(product.category)}</option>
                </optgroup>
              ) : null}
            </select>
          </label>
          {isProdutoDigital && (
            <label className="auth-label">
              Subcategorias (Produto Digital) *
              <span className="digital-subcategories">
                {DIGITAL_SUBCATEGORIES.map((c) => (
                  <label key={c.slug} className="digital-subcategories__item">
                    <input
                      type="checkbox"
                      checked={digitalSubcategories.includes(c.slug)}
                      onChange={() => toggleDigitalSubcategory(c.slug)}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </span>
            </label>
          )}
          {isEntretenimento && (
            <label className="auth-label">
              Subcategorias (Entretenimento) *
              <span className="digital-subcategories">
                {ENTERTAINMENT_SUBCATEGORIES.map((c) => (
                  <label key={c.slug} className="digital-subcategories__item">
                    <input
                      type="checkbox"
                      checked={entertainmentSubcategories.includes(c.slug)}
                      onChange={() => toggleEntertainmentSubcategory(c.slug)}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </span>
            </label>
          )}
          {!isProdutoDigital && (
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
          )}
          {!isProdutoDigital && (
            <>
              <label className="auth-label">
                Portes (€) — opcional
                <input
                  type="text"
                  className="auth-input"
                  value={shippingFeeInput}
                  onChange={(e) => setShippingFeeInput(e.target.value)}
                  placeholder="Vazio = não somar portes no pagamento; 0 = grátis"
                />
                <span className="perfil-hint">
                  Se preencheres, este valor é somado ao pagamento (uma vez por linha). A taxa de checkout (6% + 0,50 €)
                  é paga pelo comprador sobre artigo + portes.{' '}
                  <a href="/vendedor/guia" target="_blank" rel="noopener noreferrer">
                    Guia do vendedor
                  </a>
                  .
                </span>
              </label>
              <label className="auth-label auth-label--checkbox">
                <input
                  type="checkbox"
                  checked={shipsOnlySameRegion}
                  onChange={(e) => setShipsOnlySameRegion(e.target.checked)}
                />
                <span>Só envio na minha região (confirmar com o comprador)</span>
              </label>
            </>
          )}
          <label className="auth-label">
            Fotos do anúncio * (até {MAX_AD_PHOTOS})
            <div className="vendedor-gallery-chips">
              {galleryUrls.map((url, idx) => (
                <span key={url + idx} className="vendedor-gallery-chip">
                  {idx === 0 && <span className="vendedor-gallery-chip__badge">Capa</span>}
                  <img src={url} alt="" className="vendedor-gallery-chip__img" />
                  {idx > 0 && (
                    <button
                      type="button"
                      className="vendedor-gallery-chip__cover"
                      onClick={() =>
                        setGalleryUrls((prev) => {
                          if (idx <= 0 || idx >= prev.length) return prev;
                          const next = [...prev];
                          const [item] = next.splice(idx, 1);
                          next.unshift(item);
                          return next;
                        })
                      }
                      title="Usar como foto de capa"
                    >
                      Capa
                    </button>
                  )}
                  <button
                    type="button"
                    className="vendedor-gallery-chip__remove"
                    onClick={() => setGalleryUrls((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remover imagem"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="file"
              className="auth-input"
              accept={ACCEPT_IMAGES}
              multiple
              disabled={galleryUrls.length >= MAX_AD_PHOTOS}
              onChange={(e) => {
                const room = Math.max(0, MAX_AD_PHOTOS - galleryUrls.length);
                setGalleryFilesToAdd(Array.from(e.target.files ?? []).slice(0, room));
              }}
            />
            <span className="perfil-hint">
              A primeira foto é a de capa nas listagens. Máximo {MAX_AD_PHOTOS} fotos no total.
              {galleryUrls.length >= MAX_AD_PHOTOS
                ? ' Remove uma foto para adicionar outra.'
                : galleryFilesToAdd.length > 0
                  ? ` ${galleryFilesToAdd.length} novo(s) ficheiro(s) serão enviados ao guardar.`
                  : ''}
            </span>
          </label>
          <label className="auth-label">
            Adicionar imagem por URL (opcional, se ainda houver espaço)
            <input
              type="url"
              className="auth-input"
              value={extraImageUrl}
              onChange={(e) => setExtraImageUrl(e.target.value)}
              placeholder="https://..."
              disabled={galleryUrls.length >= MAX_AD_PHOTOS}
            />
          </label>
          {isProdutoDigital && (
            <label className="auth-label">
              Ficheiro do produto (download após compra) *
              <input
                type="file"
                className="auth-input"
                accept={ACCEPT_FILES}
                onChange={(e) => setDigitalFile(e.target.files?.[0] ?? null)}
              />
              <span className="perfil-hint">Substitui o ficheiro atual se carregares um novo.</span>
              {digitalFile && <span className="perfil-hint">{digitalFile.name}</span>}
              {fileUrl && !digitalFile && (
                <span className="perfil-hint">Ficheiro atual: <a href={fileUrl} target="_blank" rel="noopener noreferrer">Abrir</a></span>
              )}
            </label>
          )}
          <SellerListingPolicyAcceptance inputId="seller-policy-accept-editar" />
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? uploadStatus || 'A guardar…' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}
