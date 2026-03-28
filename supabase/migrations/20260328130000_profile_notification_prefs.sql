-- Preferências de notificação por utilizador (UI definições / e-mail).
alter table public.profiles
  add column if not exists notification_prefs jsonb not null default jsonb_build_object(
    'email_enabled', true,
    'news_updates', true,
    'marketing', true,
    'messages', true,
    'reviews', true,
    'price_drops', true,
    'favorites', true,
    'new_items', true,
    'daily_limit', 'Até 2 notificações'
  );

comment on column public.profiles.notification_prefs is
  'Preferências de notificação (email, marketing, limites diários, etc.).';
