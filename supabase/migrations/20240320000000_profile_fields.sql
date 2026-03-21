-- Campos adicionais no perfil: telemóvel, morada, IBAN, preferência de pagamento
alter table public.profiles
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists iban text,
  add column if not exists payment_preference text default 'transferencia' check (payment_preference in ('transferencia', 'mbway'));

comment on column public.profiles.phone is 'Telemóvel do utilizador';
comment on column public.profiles.address is 'Morada';
comment on column public.profiles.iban is 'IBAN para receber pagamentos (vendas)';
comment on column public.profiles.payment_preference is 'Preferência: transferência bancária ou MB Way';
