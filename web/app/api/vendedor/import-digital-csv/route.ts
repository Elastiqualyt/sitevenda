import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromBearer } from '@/lib/supabase-route';
import { parseCsvRecords } from '@/lib/csv-parse';
import { normalizeGoogleDriveDownloadUrl } from '@/lib/google-drive-url';
import { CATEGORY_PRODUTO_DIGITAL, DIGITAL_SUBCATEGORIES } from '@/lib/categories';
import { getCell, getGalleryUrlsFromRow, parseSubcatList } from '@/lib/csv-import-helpers';

const MAX_ROWS = 50;

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
      const driveRaw = getCell(
        row,
        'file_url',
        'drive_url',
        'pdf_url',
        'link',
        'google_drive',
        'drive'
      );

      if (!title) {
        errors.push({ row: rowNum, message: 'Falta título (coluna title).' });
        continue;
      }
      if (!priceRaw) {
        errors.push({ row: rowNum, message: 'Falta preço (coluna price).' });
        continue;
      }
      if (!driveRaw) {
        errors.push({ row: rowNum, message: 'Falta link do ficheiro (coluna file_url ou drive_url).' });
        continue;
      }

      const price = parseFloat(priceRaw.replace(',', '.'));
      if (Number.isNaN(price) || price < 0) {
        errors.push({ row: rowNum, message: 'Preço inválido.' });
        continue;
      }

      const normalized = normalizeGoogleDriveDownloadUrl(driveRaw);
      if (!normalized.ok) {
        errors.push({ row: rowNum, message: normalized.reason });
        continue;
      }

      const description = getCell(row, 'description', 'descricao', 'descrição');
      const categoryRaw = getCell(row, 'category', 'categoria').toLowerCase().trim();
      if (categoryRaw && categoryRaw !== CATEGORY_PRODUTO_DIGITAL) {
        errors.push({
          row: rowNum,
          message: `Importação só aceita categoria "${CATEGORY_PRODUTO_DIGITAL}" (ou vazio).`,
        });
        continue;
      }

      let digitalSubcategories = parseSubcatList(
        getCell(row, 'digital_subcategories', 'subcategorias_digitais')
      );
      if (digitalSubcategories.length === 0) {
        digitalSubcategories = [DIGITAL_SUBCATEGORIES[0].slug];
      }

      const galleryUrls = getGalleryUrlsFromRow(row);
      const imageUrl = galleryUrls[0] ?? null;

      const { data: inserted, error: insErr } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price,
          type: 'digital',
          category: CATEGORY_PRODUTO_DIGITAL,
          digital_subcategories: digitalSubcategories,
          entertainment_subcategories: [],
          stock: 0,
          image_url: imageUrl,
          gallery_urls: galleryUrls,
          file_url: normalized.url,
          shipping_fee_eur: null,
          ships_only_same_region: false,
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
