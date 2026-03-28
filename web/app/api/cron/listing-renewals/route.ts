import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export const runtime = 'nodejs';

/**
 * Cron (Vercel ou manual): atualiza janelas `listing_fee_valid_until` (sem débito ao vendedor).
 * Protegido por `Authorization: Bearer <CRON_SECRET>` (variável CRON_SECRET).
 *
 * Configuração Vercel: ver `web/vercel.json` e `CRON_SECRET` no ambiente.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  const vercelCron = request.headers.get('x-vercel-cron');
  const fromVercelCron =
    process.env.VERCEL === '1' && (vercelCron === '1' || vercelCron === 'true');
  const bearerOk = Boolean(secret && auth === `Bearer ${secret}`);
  if (!bearerOk && !fromVercelCron) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const admin = createServiceClient();
    const { data, error } = await admin.rpc('process_listing_fee_renewals');
    if (error) {
      console.error('process_listing_fee_renewals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, result: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro no servidor.' },
      { status: 500 }
    );
  }
}
