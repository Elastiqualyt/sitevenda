import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromBearer } from '@/lib/supabase-route';
import { parseCsvRecords } from '@/lib/csv-parse';
import {
  CATEGORY_PRODUTO_DIGITAL,
  isPhysicalLeafCategory,
  normalizeProductType,
  PRODUCT_TYPE_REUTILIZADOS,
} from '@/lib/categories';
import { roundMoney2 } from '@/lib/product-shipping';
import { getCell, getGalleryUrlsFromRow } from '@/lib/csv-import-helpers';

const MAX_ROWS = 50;

function parseBoolCell(s: string): boolean {
  const t = s.trim().toLowerCase();
  return t === '1' || t === 'true' || t === 'sim' || t === 'yes' || t === 's';
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json({ error: 'Configuração Supabase em falta.' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'Token em falta.' }, { status: 401 });
    }

    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const ct = request.headers.get('content-type') ?? '';
    let csvText: string;
    if (ct.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'Envia um ficheiro CSV no campo "file".' }, { status: 400 });
      }
      csvText = await (file as File).text();
    } else if (ct.includes('application/json')) {
      const body = (await request.json()) as { csv?: string };
      if (!body.csv || typeof body.csv !== 'string') {
        return NextResponse.json({ error: 'Corpo JSON: { "csv": "..." }' }, { status: 400 });
      }
      csvText = body.csv;
    } else {
      return NextResponse.json(
        { error: 'Usa multipart/form-data com campo "file" ou JSON com { "csv": "..." }.' },
        { status: 400 }
      );
    }

    let rows: Record<string, string>[];
    try {
      const parsed = parseCsvRecords(csvText);
      rows = parsed.rows;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'CSV inválido.' },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Nenhuma linha de dados no CSV.' }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_ROWS} linhas por importação.` },
        { status: 400 }
      );
    }

    const created: { row: number; title: string; id?: string }[] = [];
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const title = getCell(row, 'title', 'titulo');
      const priceRaw = getCell(row, 'price', 'preco', 'preço');
      if (!title) {
        errors.push({ row: rowNum, message: 'Falta título (coluna title).' });
        continue;
      }
      if (!priceRaw) {
        errors.push({ row: rowNum, message: 'Falta preço (coluna price).' });
        continue;
      }

      const price = parseFloat(priceRaw.replace(',', '.'));
      if (Number.isNaN(price) || price < 0) {
        errors.push({ row: rowNum, message: 'Preço inválido.' });
        continue;
      }

      const categorySlug = getCell(row, 'category', 'categoria').toLowerCase().trim();
      if (!categorySlug) {
        errors.push({ row: rowNum, message: 'Falta categoria folha (coluna category), ex.: mulher-roupa.' });
        continue;
      }
      if (categorySlug === CATEGORY_PRODUTO_DIGITAL) {
        errors.push({
          row: rowNum,
          message: `Para produto digital usa a importação de CSV digital (não "${CATEGORY_PRODUTO_DIGITAL}" aqui).`,
        });
        continue;
      }
      if (!isPhysicalLeafCategory(categorySlug)) {
        errors.push({
          row: rowNum,
          message: `Categoria desconhecida ou não é folha física: "${categorySlug}". Usa um slug de categoria folha (ver exemplo CSV).`,
        });
        continue;
      }

      const typeRaw = getCell(row, 'type', 'tipo').trim().toLowerCase();
      if (typeRaw === 'digital') {
        errors.push({
          row: rowNum,
          message: 'Produto digital: usa a importação de CSV de produtos digitais.',
        });
        continue;
      }
      const normalized = normalizeProductType(typeRaw || 'physical');
      let productType: 'physical' | typeof PRODUCT_TYPE_REUTILIZADOS = 'physical';
      if (normalized === PRODUCT_TYPE_REUTILIZADOS) {
        productType = PRODUCT_TYPE_REUTILIZADOS;
      } else if (normalized && normalized !== 'physical') {
        errors.push({
          row: rowNum,
          message: `Tipo inválido (type): usa "physical", "${PRODUCT_TYPE_REUTILIZADOS}" ou vazio.`,
        });
        continue;
      }

      const stockRaw = getCell(row, 'stock', 'quantidade');
      const stock = stockRaw.trim() === '' ? 1 : Math.max(0, parseInt(stockRaw, 10) || 0);

      const shipRaw = getCell(row, 'shipping_fee_eur', 'portes', 'shipping').trim();
      let shippingFeeEur: number | null = null;
      if (shipRaw !== '') {
        const sf = parseFloat(shipRaw.replace(',', '.'));
        if (Number.isNaN(sf) || sf < 0) {
          errors.push({ row: rowNum, message: 'Portes (shipping_fee_eur) inválidos.' });
          continue;
        }
        shippingFeeEur = roundMoney2(sf);
      }

      const shipsOnly = parseBoolCell(getCell(row, 'ships_only_same_region', 'so_regiao', 'só_região'));

      const galleryUrls = getGalleryUrlsFromRow(row);
      if (galleryUrls.length === 0) {
        errors.push({
          row: rowNum,
          message: 'Falta pelo menos uma imagem (image_url_1 ou image_url / capa).',
        });
        continue;
      }

      const description = getCell(row, 'description', 'descricao', 'descrição');

      const { data: inserted, error: insErr } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price,
          type: productType,
          category: categorySlug,
          digital_subcategories: [],
          entertainment_subcategories: [],
          stock,
          image_url: galleryUrls[0],
          gallery_urls: galleryUrls,
          file_url: null,
          shipping_fee_eur: shippingFeeEur,
          ships_only_same_region: shipsOnly,
        })
        .select('id')
        .single();

      if (insErr) {
        errors.push({ row: rowNum, message: insErr.message });
        continue;
      }

      created.push({ row: rowNum, title: title.trim(), id: inserted?.id });
    }

    return NextResponse.json({
      ok: true,
      created: created.length,
      failed: errors.length,
      items: created,
      errors,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro no servidor.' },
      { status: 500 }
    );
  }
}
