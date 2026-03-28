import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Row = { id: string; full_name: string | null; avatar_url: string | null };

/**
 * GET /api/profiles/search?q=...&limit=10
 * Pesquisa pública de membros por nome (RPC search_public_profiles).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qRaw = searchParams.get('q')?.trim() ?? '';
    const limitRaw = searchParams.get('limit');
    const limitNum =
      limitRaw != null && limitRaw !== ''
        ? Math.min(50, Math.max(1, parseInt(limitRaw, 10) || 10))
        : 10;

    if (qRaw.length < 2) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabase.rpc('search_public_profiles', {
      p_query: qRaw,
      p_limit: limitNum,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = Array.isArray(data) ? (data as Row[]) : [];
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao pesquisar membros' },
      { status: 500 }
    );
  }
}
