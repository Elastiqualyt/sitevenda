import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/products
 * Lista produtos (web e app React Native usam esta mesma API).
 * Query: ?tipo=digital|physical|used & categoria=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const categoria = searchParams.get('categoria');

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
    const { title, description, price, type, category, image_url, file_url, seller_id } = body;

    if (!title || price == null || !type || !seller_id) {
      return NextResponse.json(
        { error: 'Faltam campos: title, price, type, seller_id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        title,
        description: description ?? '',
        price: Number(price),
        type,
        category: category ?? 'outros',
        image_url: image_url ?? null,
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
