'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getCategoryLabel } from '@/lib/categories';
import { useConversationMessages } from '@/lib/use-conversation-messages';
import { useSenderNames } from '@/lib/use-sender-names';
import { ChatMessageRow } from '@/components/ChatMessageRow';
import type { Conversation } from '@/lib/types';

type ConversationWithProduct = Conversation & {
  product?: { id: string; title: string; image_url: string | null; category: string };
  buyerDisplayName?: string;
  buyerAvatarUrl?: string | null;
};

export default function VendedorMensagensPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProduct[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState('');

  const { messages, loadMessages } = useConversationMessages(selectedId);
  const senderNames = useSenderNames(messages);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await supabase
          .from('conversations')
          .select('id, product_id, buyer_id, seller_id, created_at, updated_at')
          .eq('seller_id', user.id)
          .order('updated_at', { ascending: false });
        const list = (res.data ?? []) as ConversationWithProduct[];
        for (const c of list) {
          const [prod, pubRes] = await Promise.all([
            supabase.from('products').select('id, title, image_url, category').eq('id', c.product_id).single(),
            supabase.rpc('get_seller_public', { p_id: c.buyer_id }),
          ]);
          c.product = prod.data as ConversationWithProduct['product'];
          const pub = pubRes.data as { full_name?: string | null; avatar_url?: string | null } | null;
          c.buyerDisplayName = pub?.full_name?.trim() || 'Comprador';
          c.buyerAvatarUrl = pub?.avatar_url ?? null;
        }
        setConversations(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const sendMessage = async () => {
    if (!selectedId || !newMessage.trim() || !user?.id) return;
    setSendError('');
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: selectedId, sender_id: user.id, content: newMessage.trim() })
      .select()
      .single();
    setNewMessage('');
    if (error) {
      setSendError(error.message || 'Não foi possível enviar.');
      return;
    }
    if (data) {
      await loadMessages();
    }
  };

  const selected = conversations.find((c) => c.id === selectedId);

  if (loading) return <p className="loading">A carregar...</p>;

  return (
    <div className="vendedor-page">
      <h1>Mensagens</h1>
      <div className="chat-layout">
        <div className="chat-list">
          {conversations.length === 0 ? (
            <p className="empty">Ainda não tens conversas.</p>
          ) : (
            conversations.map((c) => {
              const thumb =
                c.buyerAvatarUrl ||
                c.product?.image_url ||
                null;
              const initial = (c.buyerDisplayName ?? 'C').slice(0, 1).toUpperCase();
              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  className={'chat-list-item' + (selectedId === c.id ? ' chat-list-item--active' : '')}
                  onClick={() => setSelectedId(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(c.id);
                    }
                  }}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className={
                        'chat-list-item__img' + (c.buyerAvatarUrl ? ' chat-list-item__img--avatar' : '')
                      }
                    />
                  ) : (
                    <span className="chat-list-item__placeholder chat-list-item__placeholder--letter" aria-hidden>
                      {initial}
                    </span>
                  )}
                  <div className="chat-list-item__text">
                    <Link
                      href={`/perfil/${c.buyer_id}`}
                      className="chat-list-item__title-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {c.buyerDisplayName ?? '…'}
                    </Link>
                    <span className="chat-list-item__meta">{c.product?.title ?? 'Produto'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="chat-panel">
          {!selected ? (
            <p className="empty">Escolhe uma conversa.</p>
          ) : (
            <>
              <div className="chat-panel__header">
                <h2>{selected.buyerDisplayName ?? 'Comprador'}</h2>
                <span className="chat-panel__header-sub">
                  {selected.product?.title ?? 'Produto'}
                  {selected.product?.category ? (
                    <>
                      {' · '}
                      {getCategoryLabel(selected.product.category)}
                    </>
                  ) : null}
                </span>
              </div>
              <div className="chat-messages">
                {messages.map((m) => (
                  <ChatMessageRow
                    key={m.id}
                    message={m}
                    senderName={senderNames[m.sender_id] ?? '…'}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
              {sendError ? <p className="auth-error chat-send-err">{sendError}</p> : null}
              <form
                className="chat-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage();
                }}
              >
                <input
                  type="text"
                  className="auth-input chat-form__input"
                  placeholder="Escreve uma mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Enviar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
