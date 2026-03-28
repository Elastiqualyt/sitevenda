-- Contagem de mensagens não lidas por conversa (para o utilizador autenticado).
-- Mesma lógica que public.unread_message_count(), por conversa.
create or replace function public.my_conversations_unread_counts()
returns table (conversation_id uuid, unread_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as conversation_id,
    coalesce(
      (
        select count(*)::bigint
        from public.messages m
        where m.conversation_id = c.id
          and (
            (
              c.buyer_id = auth.uid()
              and m.sender_id = c.seller_id
              and (c.buyer_last_read_at is null or m.created_at > c.buyer_last_read_at)
            )
            or (
              c.seller_id = auth.uid()
              and m.sender_id = c.buyer_id
              and (c.seller_last_read_at is null or m.created_at > c.seller_last_read_at)
            )
          )
      ),
      0::bigint
    ) as unread_count
  from public.conversations c
  where c.buyer_id = auth.uid() or c.seller_id = auth.uid();
$$;

comment on function public.my_conversations_unread_counts() is
  'Por conversa: número de mensagens do outro participante ainda não lidas pelo utilizador atual.';

grant execute on function public.my_conversations_unread_counts() to authenticated;
