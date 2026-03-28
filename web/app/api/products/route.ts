import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  CATEGORY_ENTRETERIMENTO,
  CATEGORY_PRODUTO_DIGITAL,
  DEFAULT_CATEGORY_SLUG,
  isAllowedProductCategorySlug,
  isMarketplaceGroupSlug,
  normalizeProductType,
} from '@/lib/categories';
import { escapeIlikePattern } from '@/lib/ilike';

/**
 * GET /api/products
 * Lista produtos (web e app React Native usam esta mesma API).
 * Query: ?tipo=digital|physical|reutilizados (legado: used)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const idList = idsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 100);
      if (!idList.length) {
        return NextResponse.json([]);
      }
      const { data, error } = await supabase.from('products').select('*').in('id', idList);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data ?? []);
    }

    const tipoRaw = searchParams.get('tipo');
    const tipo = tipoRaw ? normalizeProductType(tipoRaw) || tipoRaw : null;
    const categoria = searchParams.get('categoria');
    const subcategoriasRaw = searchParams.get('subcategorias');
    const subcategorias = subcategoriasRaw
      ? subcategoriasRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const qRaw = searchParams.get('q');
    const q = qRaw?.trim() ?? '';
    const limitRaw = searchParams.get('limit');
    const limitNum =
      limitRaw != null && limitRaw !== ''
        ? Math.min(500, Math.max(1, parseInt(limitRaw, 10) || 0))
        : null;

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (tipo) {
      query = query.eq('type', tipo);
    }
    if (categoria) {
      if (categoria === CATEGORY_PRODUTO_DIGITAL) {
        query = query.eq('category', CATEGORY_PRODUTO_DIGITAL);
      } else if (isMarketplaceGroupSlug(categoria)) {
        query = query.or(`category.eq.${categoria},category.like.${categoria}-%`);
      } else {
        query = query.eq('category', categoria);
      }
    }
    if (subcategorias.length > 0) {
      if (categoria === CATEGORY_PRODUTO_DIGITAL) {
        query = query.overlaps('digital_subcategories', subcategorias);
      } else if (categoria === CATEGORY_ENTRETERIMENTO) {
        query = query.overlaps('entertainment_subcategories', subcategorias);
      }
    }

    if (q.length > 0) {
      const pattern = `%${escapeIlikePattern(q)}%`;
      query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
    }

    if (limitNum != null && limitNum > 0) {
      query = query.limit(limitNum);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao listar produtos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Criar produto (requer auth no futuro).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      price,
      type,
      category,
      image_url,
      gallery_urls,
      file_url,
      seller_id,
      digital_subcategories,
      entertainment_subcategories,
    } = body;

    if (!title || price == null || !type || !seller_id) {
      return NextResponse.json(
        { error: 'Faltam campos: title, price, type, seller_id' },
        { status: 400 }
      );
    }

    const subcatsDigital = Array.isArray(digital_subcategories)
      ? digital_subcategories.filter((x: unknown) => typeof x === 'string')
      : [];
    const subcatsEntertainment = Array.isArray(entertainment_subcategories)
      ? entertainment_subcategories.filter((x: unknown) => typeof x === 'string')
      : [];

    const typeNorm = typeof type === 'string' ? normalizeProductType(type) || type : type;
    const catRaw = typeof category === 'string' && category.trim() ? category.trim() : '';
    let finalCategory = catRaw || DEFAULT_CATEGORY_SLUG;
    let finalType = typeNorm;

    if (finalCategory === CATEGORY_PRODUTO_DIGITAL) {
      finalType = 'digital';
      if (subcatsDigital.length === 0) {
        return NextResponse.json(
          { error: 'Produto digital: indica pelo menos uma subcategoria em digital_subcategories.' },
          { status: 400 }
        );
      }
    } else if (finalType === 'digital') {
      return NextResponse.json(
        { error: 'Tipo digital: category deve ser produto-digital.' },
        { status: 400 }
      );
    }

    if (!isAllowedProductCategorySlug(finalCategory)) {
      return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 });
    }

    const galleryList = Array.isArray(gallery_urls)
      ? gallery_urls.filter((x: unknown) => typeof x === 'string')
      : [];

    const { data, error } = await supabase
      .from('products')
      .insert({
        title,
        description: description ?? '',
        price: Number(price),
        type: finalType,
        category: finalCategory,
        digital_subcategories: finalCategory === CATEGORY_PRODUTO_DIGITAL ? subcatsDigital : [],
        entertainment_subcategories:
          finalCategory === CATEGORY_ENTRETERIMENTO ? subcatsEntertainment : [],
        image_url: image_url ?? null,
        gallery_urls: galleryList.length ? galleryList : [],
        file_url: file_url ?? null,
        seller_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}
