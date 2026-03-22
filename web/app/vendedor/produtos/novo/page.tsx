'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  CATEGORIES,
  CATEGORY_ENTRETERIMENTO,
  CATEGORY_PRODUTO_DIGITAL,
  DEFAULT_CATEGORY_SLUG,
  DIGITAL_SUBCATEGORIES,
  ENTERTAINMENT_SUBCATEGORIES,
} from '@/lib/categories';
import type { ProductType } from '@/lib/types';
import { MAX_AD_PHOTOS } from '@/lib/product-gallery';
import { uploadDigitalProductFile, uploadGalleryImages } from '@/lib/product-upload';
import {
  uploadDebug,
  uploadDebugError,
  uploadDebugTimeEnd,
  uploadDebugTimeStart,
} from '@/lib/upload-debug';
import { SellerListingPolicy, SellerListingPolicyAcceptance } from '@/components/SellerListingPolicy';
import { roundMoney2 } from '@/lib/product-shipping';

const DIGITAL_BUCKET = 'digital-files';
const PRODUCT_IMAGES_BUCKET = 'product-images';
const ACCEPT_FILES = '.pdf,.jpg,.jpeg,.png';
const ACCEPT_IMAGES = '.jpg,.jpeg,.png,.webp';

export default function NovoProdutoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<ProductType>('physical');
  const [category, setCategory] = useState('');
  const [digitalSubcategories, setDigitalSubcategories] = useState<string[]>([]);
  const [entertainmentSubcategories, setEntertainmentSubcategories] = useState<string[]>([]);
  const [stock, setStock] = useState('0');
  /** URL alternativa se não carregares ficheiros (1 imagem) */
  const [imageUrl, setImageUrl] = useState('');
  /** Fotos do anúncio (todas as categorias; máx. 5) */
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  /** Feedback durante upload (evita parecer “travado”) */
  const [uploadStatus, setUploadStatus] = useState('');
  /** Portes: vazio = não definir na plataforma; número = EUR (0 = grátis). Só artigos físicos. */
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user?.id) return;
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
      setError('Seleciona pelo menos uma subcategoria de Entretenimento.');
      return;
    }
    setLoading(true);
    setUploadStatus('A iniciar…');

    let finalImageUrl: string | null = null;
    let galleryUrlsList: string[] = [];
    let fileUrl: string | null = null;

    try {
      uploadDebug('submit: início', {
        userId: user.id,
        isProdutoDigital,
        galleryFileCount: galleryFiles.length,
        hasDigitalFile: !!digitalFile,
      });

      const filesToUpload = galleryFiles.slice(0, MAX_AD_PHOTOS);
      if (filesToUpload.length > 0) {
        setUploadStatus(`A enviar ${filesToUpload.length} foto(s) do anúncio…`);
        const tg = uploadDebugTimeStart();
        galleryUrlsList = await uploadGalleryImages(user.id, filesToUpload, PRODUCT_IMAGES_BUCKET);
        uploadDebugTimeEnd('upload galeria (todas as imagens)', tg);
        uploadDebug('galeria OK', { urls: galleryUrlsList.length });
      } else if (imageUrl.trim()) {
        galleryUrlsList = [imageUrl.trim()];
      }
      galleryUrlsList = galleryUrlsList.slice(0, MAX_AD_PHOTOS);

      if (galleryUrlsList.length === 0) {
        setError(
          `Adiciona pelo menos uma foto do anúncio (até ${MAX_AD_PHOTOS} imagens) ou cola uma URL.`
        );
        return;
      }
      finalImageUrl = galleryUrlsList[0];

      if (isProdutoDigital) {
        if (!digitalFile) {
          setError(
            'Produto digital: anexa o ficheiro que o cliente vai poder descarregar após a compra (PDF, imagem, etc.).'
          );
          return;
        }
        setUploadStatus('A enviar o ficheiro do produto (pode demorar com PDFs grandes)…');
        const td = uploadDebugTimeStart();
        fileUrl = await uploadDigitalProductFile(user.id, digitalFile, DIGITAL_BUCKET);
        uploadDebugTimeEnd('upload ficheiro digital', td);
        uploadDebug('ficheiro digital OK', {
          fileUrlPreview: fileUrl
            ? fileUrl.length > 100
              ? `${fileUrl.slice(0, 100)}…`
              : fileUrl
            : null,
        });
      }

      setUploadStatus('A guardar o anúncio na base de dados…');
      const tInsert = uploadDebugTimeStart();
      let shippingFeeEur: number | null = null;
      if (!isProdutoDigital) {
        const s = shippingFeeInput.trim();
        if (s !== '') {
          const sf = parseFloat(s.replace(',', '.'));
          if (isNaN(sf) || sf < 0) {
            setError('Portes: indica um valor válido em EUR ou deixa em branco.');
            setLoading(false);
            setUploadStatus('');
            return;
          }
          shippingFeeEur = roundMoney2(sf);
        }
      }
      const { error: err } = await supabase.from('products').insert({
        seller_id: user.id,
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        type: isProdutoDigital ? 'digital' : type,
        category: category || DEFAULT_CATEGORY_SLUG,
        digital_subcategories: isProdutoDigital ? digitalSubcategories : [],
        entertainment_subcategories: isEntretenimento ? entertainmentSubcategories : [],
        stock: isProdutoDigital ? 0 : Math.max(0, parseInt(stock, 10) || 0),
        image_url: finalImageUrl,
        gallery_urls: galleryUrlsList,
        file_url: fileUrl,
        shipping_fee_eur: isProdutoDigital ? null : shippingFeeEur,
        ships_only_same_region: !isProdutoDigital && shipsOnlySameRegion,
      });
      uploadDebugTimeEnd('insert products (Supabase)', tInsert);
      if (err) {
        uploadDebugError('insert products rejeitado', err, {
          code: (err as { code?: string }).code,
          details: (err as { details?: string }).details,
          hint: (err as { hint?: string }).hint,
        });
        setError(err.message);
        return;
      }
      uploadDebug('submit: concluído com sucesso', {});
      router.push('/vendedor/produtos');
      router.refresh();
    } catch (e) {
      uploadDebugError('submit: exceção', e);
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Ligação interrompida. Verifica a internet e tenta de novo.');
      } else if (msg.includes('row-level security') || msg.includes('RLS')) {
        setError(
          'Não foi possível enviar ficheiros (permissão no Storage). Inicia sessão de novo, confirma que os buckets product-images e digital-files existem e corre as migrações Storage no Supabase.'
        );
      } else {
        setError(`Erro: ${msg}`);
      }
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="vendedor-page">
      <h1>
        <Link href="/vendedor/produtos" className="vendedor-back">←</Link> Novo produto
      </h1>
      <div className="auth-card vendedor-form-card">
        <SellerListingPolicy />
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
              <option value="reutilizados">Reutilizado</option>
            </select>
          </label>
          <label className="auth-label">
            Categoria
            <select
              className="auth-input"
              value={category}
              onChange={(e) => {
                const v = e.target.value;
                setCategory(v);
                if (v !== CATEGORY_PRODUTO_DIGITAL) setDigitalSubcategories([]);
                if (v !== CATEGORY_ENTRETERIMENTO) setEntertainmentSubcategories([]);
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
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
              Stock (quantidade)
              <input type="number" min={0} className="auth-input" value={stock} onChange={(e) => setStock(e.target.value)} />
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
                  Se preencheres, este valor é <strong>somado ao pagamento</strong> (uma vez por linha de carrinho). A
                  comissão da plataforma (6,5 %) incide sobre preço + portes. Vê o{' '}
                  <a href="/vendedor/guia" target="_blank" rel="noopener noreferrer">
                    guia do vendedor
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
                <span>Só envio na minha região (o comprador deve confirmar contigo antes do envio)</span>
              </label>
            </>
          )}
          <label className="auth-label">
            Fotos do anúncio * (até {MAX_AD_PHOTOS})
            <input
              type="file"
              className="auth-input"
              accept={ACCEPT_IMAGES}
              multiple
              onChange={(e) =>
                setGalleryFiles(Array.from(e.target.files ?? []).slice(0, MAX_AD_PHOTOS))
              }
            />
            <span className="perfil-hint">
              A <strong>primeira</strong> foto é a de capa nas listagens; as outras aparecem na página do produto. JPEG, PNG ou WebP.
              {galleryFiles.length > 0
                ? ` ${galleryFiles.length} ficheiro(s) selecionado(s).`
                : ''}
            </span>
          </label>
          <label className="auth-label">
            Ou URL de uma imagem (se não carregares ficheiros)
            <input
              type="url"
              className="auth-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
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
              <span className="perfil-hint">
                PDF ou imagem que o comprador poderá descarregar depois de comprar (bucket `digital-files`).
              </span>
              {digitalFile && <span className="perfil-hint">{digitalFile.name}</span>}
            </label>
          )}
          <SellerListingPolicyAcceptance inputId="seller-policy-accept-novo" />
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? uploadStatus || 'A guardar…' : 'Criar produto'}
          </button>
        </form>
      </div>
    </div>
  );
}
