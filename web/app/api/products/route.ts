import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { normalizeProductType } from '@/lib/categories';

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

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (tipo) {
      query = query.eq('type', tipo);
    }
    if (categoria) {
      query = query.eq('category', categoria);
    }
    if (subcategorias.length > 0) {
      if (categoria === 'produto-digital') {
        query = query.overlaps('digital_subcategories', subcategorias);
      } else if (categoria === 'entretenimento') {
        query = query.overlaps('entertainment_subcategories', subcategorias);
      }
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

    const galleryList = Array.isArray(gallery_urls)
      ? gallery_urls.filter((x: unknown) => typeof x === 'string')
      : [];

    const { data, error } = await supabase
      .from('products')
      .insert({
        title,
        description: description ?? '',
        price: Number(price),
        type: typeNorm,
        category: category ?? 'lazer',
        digital_subcategories: subcatsDigital,
        entertainment_subcategories: subcatsEntertainment,
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
