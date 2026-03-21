'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getCategoryLabel } from '@/lib/categories';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Message } from '@/lib/types';

type ConvRow = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  product?: { title: string; image_url: string | null; category: string };
};

function MensagensContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const openId = searchParams.get('c');
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(openId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

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
          const p = await supabase.from('products').select('title, image_url, category').eq('id', c.product_id).single();
          c.product = p.data as ConvRow['product'];
        }
        setConversations(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    supabase.from('messages').select('*').eq('conversation_id', selectedId).order('created_at', { ascending: true }).then((res) => setMessages((res.data as Message[]) ?? []));
    const ch = supabase.channel('msgs-' + selectedId).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + selectedId }, (p) => {
      setMessages((m) => [...m, p.new as Message]);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedId]);

  const sendMessage = () => {
    if (!selectedId || !newMessage.trim() || !user?.id) return;
    supabase.from('messages').insert({ conversation_id: selectedId, sender_id: user.id, content: newMessage.trim() });
    setNewMessage('');
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
              conversations.map((c) => (
                <button key={c.id} type="button" className={'chat-list-item' + (selectedId === c.id ? ' chat-list-item--active' : '')} onClick={() => setSelectedId(c.id)}>
                  {c.product?.image_url ? <img src={c.product.image_url} alt="" className="chat-list-item__img" /> : <span className="chat-list-item__placeholder">📦</span>}
                  <div className="chat-list-item__text">
                    <strong>{c.product?.title ?? 'Produto'}</strong>
                    <span className="chat-list-item__meta">{c.seller_id === user.id ? 'Vendedor' : 'Comprador'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="chat-panel">
            {!selected ? (
              <p className="empty">Escolhe uma conversa.</p>
            ) : (
              <>
                <div className="chat-panel__header">
                  <h2>{selected.product?.title ?? 'Produto'}</h2>
                  <span>{getCategoryLabel(selected.product?.category ?? '')}</span>
                </div>
                <div className="chat-messages">
                  {messages.map((m) => (
                    <div key={m.id} className={'chat-message' + (m.sender_id === user.id ? ' chat-message--own' : '')}>
                      <p className="chat-message__content">{m.content}</p>
                      <span className="chat-message__time">{new Date(m.created_at).toLocaleString('pt-PT')}</span>
                    </div>
                  ))}
                </div>
                <form className="chat-form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                  <input type="text" className="auth-input chat-form__input" placeholder="Escreve uma mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                  <button type="submit" className="btn btn-primary">Enviar</button>
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
