'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getCategoryLabel } from '@/lib/categories';
import { useConversationMessages } from '@/lib/use-conversation-messages';
import { useSenderNames } from '@/lib/use-sender-names';
import { ChatMessageRow } from '@/components/ChatMessageRow';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type ConvRow = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  product?: { title: string; image_url: string | null; category: string };
  counterpartName?: string;
  counterpartAvatar?: string | null;
};

function MensagensContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const openId = searchParams.get('c');
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(openId);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState('');
  const [unreadByConv, setUnreadByConv] = useState<Record<string, number>>({});

  const refreshUnreadCounts = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.rpc('my_conversations_unread_counts');
    if (error || !Array.isArray(data)) return;
    const next: Record<string, number> = {};
    for (const row of data as Array<{ conversation_id: string; unread_count: number | string }>) {
      next[String(row.conversation_id)] = Number(row.unread_count) || 0;
    }
    setUnreadByConv(next);
  }, [user?.id]);

  const { messages, loadMessages } = useConversationMessages(selectedId);
  const senderNames = useSenderNames(messages);

  useEffect(() => {
    setSelectedId(openId);
  }, [openId]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await supabase
          .from('conversations')
          .select('id, product_id, buyer_id, seller_id')
          .or('buyer_id.eq.' + user.id + ',seller_id.eq.' + user.id)
          .order('updated_at', { ascending: false });
        const list = (res.data ?? []) as ConvRow[];
        for (const c of list) {
          const oid = c.seller_id === user.id ? c.buyer_id : c.seller_id;
          const [p, pubRes] = await Promise.all([
            supabase.from('products').select('title, image_url, category').eq('id', c.product_id).single(),
            supabase.rpc('get_seller_public', { p_id: oid }),
          ]);
          c.product = p.data as ConvRow['product'];
          const pub = pubRes.data as { full_name?: string | null; avatar_url?: string | null } | null;
          c.counterpartName = pub?.full_name?.trim() || (c.seller_id === user.id ? 'Comprador' : 'Vendedor');
          c.counterpartAvatar = pub?.avatar_url ?? null;
        }
        setConversations(list);
        await refreshUnreadCounts();
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, refreshUnreadCounts]);

  useEffect(() => {
    if (!user?.id) return;
    const onRefresh = () => {
      void refreshUnreadCounts();
    };
    window.addEventListener('marketplace-unread-refresh', onRefresh);
    const channel = supabase
      .channel(`messages-unread-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          void refreshUnreadCounts();
        }
      )
      .subscribe();
    return () => {
      window.removeEventListener('marketplace-unread-refresh', onRefresh);
      void supabase.removeChannel(channel);
    };
  }, [user?.id, refreshUnreadCounts]);

  useEffect(() => {
    if (!selectedId || !user?.id) return;
    void supabase.rpc('mark_conversation_read', { conversation_id: selectedId }).then(() => {
      setUnreadByConv((prev) => ({ ...prev, [selectedId]: 0 }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('marketplace-unread-refresh'));
      }
    });
  }, [selectedId, messages.length, user?.id]);

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

  if (authLoading || !user) {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <p className="loading">A carregar...</p>
          {!user && !authLoading && <p><Link href="/entrar">Iniciar sessão</Link> para ver mensagens.</p>}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <main className="main">
        <h1>Mensagens</h1>
        <div className="chat-layout">
          <div className="chat-list">
            {loading ? (
              <p className="loading">A carregar...</p>
            ) : conversations.length === 0 ? (
              <p className="empty">Ainda não tens conversas. Contacta um vendedor a partir da página de um produto.</p>
            ) : (
              conversations.map((c) => {
                const oid = c.seller_id === user.id ? c.buyer_id : c.seller_id;
                const thumb = c.counterpartAvatar || c.product?.image_url || null;
                const initial = (c.counterpartName ?? 'U').slice(0, 1).toUpperCase();
                const unreadHere = (unreadByConv[c.id] ?? 0) > 0;
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    className={
                      'chat-list-item' +
                      (selectedId === c.id ? ' chat-list-item--active' : '') +
                      (unreadHere ? ' chat-list-item--unread' : '')
                    }
                    aria-label={
                      unreadHere
                        ? `Conversa com ${c.counterpartName ?? 'utilizador'}, mensagens por ler`
                        : `Conversa com ${c.counterpartName ?? 'utilizador'}`
                    }
                    onClick={() => {
                      setSelectedId(c.id);
                      router.push(`/mensagens?c=${encodeURIComponent(c.id)}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(c.id);
                        router.push(`/mensagens?c=${encodeURIComponent(c.id)}`);
                      }
                    }}
                  >
                    <Link
                      href={`/perfil/${oid}`}
                      aria-label={`Ver perfil público de ${c.counterpartName ?? 'utilizador'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Foto de ${c.counterpartName ?? 'utilizador'}`}
                          className={
                            'chat-list-item__img' + (c.counterpartAvatar ? ' chat-list-item__img--avatar' : '')
                          }
                        />
                      ) : (
                        <span className="chat-list-item__placeholder chat-list-item__placeholder--letter" aria-hidden>
                          {initial}
                        </span>
                      )}
                    </Link>
                    <div className="chat-list-item__text">
                      <Link
                        href={`/perfil/${oid}`}
                        className="chat-list-item__title-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.counterpartName ?? '…'}
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
                  <h2>
                    <Link href={`/perfil/${selected.seller_id === user.id ? selected.buyer_id : selected.seller_id}`}>
                      {selected.counterpartName ?? 'Conversa'}
                    </Link>
                  </h2>
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
                      currentUserId={user.id}
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
      </main>
      <Footer />
    </div>
  );
}

export default function MensagensPage() {
  return (
    <Suspense fallback={
      <div className="page">
        <Header />
        <main className="main"><p className="loading">A carregar...</p></main>
        <Footer />
      </div>
    }>
      <MensagensContent />
    </Suspense>
  );
}
