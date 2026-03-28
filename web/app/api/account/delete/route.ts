import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';
import { getUserFromBearer } from '@/lib/supabase-route';

export const runtime = 'nodejs';

async function removeAvatarFolder(admin: ReturnType<typeof createServiceClient>, userId: string) {
  try {
    const { data: files, error } = await admin.storage.from('avatars').list(userId, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error || !files?.length) return;
    const paths = files
      .filter((f) => typeof f.name === 'string' && f.name.length > 0)
      .map((f) => `${userId}/${f.name}`);
    if (!paths.length) return;
    await admin.storage.from('avatars').remove(paths);
  } catch {
    // Não bloquear eliminação de conta por erro de limpeza de storage.
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Inicia sessão novamente.' }, { status: 401 });
    }

    const admin = createServiceClient();

    // Limpeza explícita extra para relações sem FK em cascata (defensivo).
    await admin.from('profile_follows').delete().eq('follower_id', user.id);
    await admin.from('profile_follows').delete().eq('following_id', user.id);

    await removeAvatarFolder(admin, user.id);

    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      return NextResponse.json(
        { error: 'Não foi possível eliminar a conta.', details: deleteErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro no servidor.' },
      { status: 500 }
    );
  }
}
