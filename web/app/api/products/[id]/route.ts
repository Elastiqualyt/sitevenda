import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

function supabaseForProductGet(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    if (token) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      return createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    }
  }
  return supabase;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'ID em falta' }, { status: 400 });
  }
  const client = supabaseForProductGet(request);
  const { data, error } = await client.from('products').select('*').eq('id', id).single();

  if (error || !data) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }
  return NextResponse.json(data);
}
