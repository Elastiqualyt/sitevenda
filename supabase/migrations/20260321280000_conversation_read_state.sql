-- Estado de leitura por conversa (comprador vs vendedor)
alter table public.conversations
  add column if not exists buyer_last_read_at timestamptz,
  add column if not exists seller_last_read_at timestamptz;

comment on column public.conversations.buyer_last_read_at is 'Última vez que o comprador viu a conversa (mensagens do vendedor anteriores a isto contam como lidas).';
comment on column public.conversations.seller_last_read_at is 'Última vez que o vendedor viu a conversa.';

-- Participantes podem atualizar a conversa (ex.: estado de leitura)
drop policy if exists "Participantes podem atualizar conversa (leitura)" on public.conversations;

create policy "Participantes podem atualizar conversa (leitura)"
  on public.conversations for update
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid())
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- Marcar conversa como lida (evita alterar outros campos por engano)
create or replace function public.mark_conversation_read(conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations c
  set
    buyer_last_read_at = case when c.buyer_id = auth.uid() then now() else c.buyer_last_read_at end,
    seller_last_read_at = case when c.seller_id = auth.uid() then now() else c.seller_last_read_at end,
    updated_at = now()
  where c.id = conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid());
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Número de mensagens recebidas ainda não lidas (de outros participantes)
create or replace function public.unread_message_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(count(*)::integer, 0)
  from public.messages m
  inner join public.conversations c on c.id = m.conversation_id
  where
    (
      c.buyer_id = auth.uid()
      and m.sender_id = c.seller_id
      and (c.buyer_last_read_at is null or m.created_at > c.buyer_last_read_at)
    )
    or (
      c.seller_id = auth.uid()
      and m.sender_id = c.buyer_id
      and (c.seller_last_read_at is null or m.created_at > c.seller_last_read_at)
    );
$$;

grant execute on function public.unread_message_count() to authenticated;
