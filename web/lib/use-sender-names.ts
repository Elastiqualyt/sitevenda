'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

/** Nomes publicos via RPC get_seller_public (qualquer utilizador). */
export async function fetchSenderDisplayNames(userIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  const out: Record<string, string> = {};
  await Promise.all(
    unique.map(async (uid) => {
      const { data, error } = await supabase.rpc('get_seller_public', { p_id: uid });
      if (error || data == null) {
        out[uid] = 'Utilizador';
        return;
      }
      const row = data as { full_name?: string | null };
      out[uid] = row.full_name?.trim() || 'Utilizador';
    })
  );
  return out;
}

export function useSenderNames(messages: { sender_id: string }[]) {
  const key = useMemo(
    () => [...new Set(messages.map((m) => m.sender_id))].sort().join('|'),
    [messages]
  );
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!key) {
      setNames({});
      return;
    }
    const ids = key.split('|');
    let cancelled = false;
    (async () => {
      const n = await fetchSenderDisplayNames(ids);
      if (!cancelled) setNames(n);
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return names;
}
