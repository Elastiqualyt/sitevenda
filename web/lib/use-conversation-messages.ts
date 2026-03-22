'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/types';

const POLL_MS = 4000;

/**
 * Histórico + tempo real para mensagens de uma conversa.
 * - Faz polling periódico para o chat funcionar mesmo quando o WebSocket Realtime falha
 *   (ex.: chave `sb_publishable_...` em vez da anon JWT `eyJ...`).
 * - Mantém subscrição postgres_changes quando o Realtime está disponível.
 */
export function useConversationMessages(selectedId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);

  const loadMessages = useCallback(async () => {
    if (!selectedId) return;
    const res = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedId)
      .order('created_at', { ascending: true });
    setMessages((res.data as Message[]) ?? []);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    setMessages([]);
    void loadMessages();

    const poll = setInterval(() => {
      void loadMessages();
    }, POLL_MS);

    const ch = supabase
      .channel('msgs-' + selectedId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'conversation_id=eq.' + selectedId,
        },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      void supabase.removeChannel(ch);
    };
  }, [selectedId, loadMessages]);

  return { messages, setMessages, loadMessages };
}
