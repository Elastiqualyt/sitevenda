'use client';

import Link from 'next/link';
import type { Message } from '@/lib/types';

export function ChatMessageRow({
  message,
  senderName,
  currentUserId,
}: {
  message: Message;
  senderName: string;
  currentUserId: string | undefined;
}) {
  const own = message.sender_id === currentUserId;
  return (
    <div className={'chat-message' + (own ? ' chat-message--own' : '')}>
      <div className="chat-message__head">
        <Link href={`/perfil/${message.sender_id}`} className="chat-message__author">
          {senderName}
        </Link>
      </div>
      <p className="chat-message__content">{message.content}</p>
      <span className="chat-message__time">{new Date(message.created_at).toLocaleString('pt-PT')}</span>
    </div>
  );
}
