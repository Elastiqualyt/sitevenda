'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { PaymentPreference } from '@/lib/auth-context';
import { parseUserType } from '@/lib/user-type';

const AVATARS_BUCKET = 'avatars';
const ACCEPT_AVATAR_IMAGES = '.jpg,.jpeg,.png,.webp';

export default function PerfilPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [iban, setIban] = useState('');
  const [paymentPreference, setPaymentPreference] = useState<PaymentPreference>('transferencia');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [vendorActivating, setVendorActivating] = useState(false);
  const [vendorMessage, setVendorMessage] = useState('');

  const isComum = profile ? parseUserType(profile.user_type) === 'comum' : false;

  useEffect(() => {
    if (!user) return;
    if (!authLoading && !user) {
      router.replace('/entrar?redirect=/perfil');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setAvatarUrl(profile.avatar_url ?? null);
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
    setIban(profile.iban ?? '');
    setPaymentPreference((profile.payment_preference as PaymentPreference) || 'transferencia');
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setMessage('');
    let finalAvatarUrl = avatarUrl;

    if (avatarFile) {
      const ext = avatarFile.name.toLowerCase().split('.').pop() || 'jpg';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(AVATARS_BUCKET).upload(path, avatarFile, {
        contentType: avatarFile.type,
        upsert: true,
      });
      if (uploadErr) {
        setSaving(false);
        setMessage('Erro ao enviar foto de perfil: ' + uploadErr.message + '. Garante que o bucket "avatars" existe no Supabase Storage.');
        return;
      }
      const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
      finalAvatarUrl = data.publicUrl;
      setAvatarUrl(finalAvatarUrl);
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        avatar_url: finalAvatarUrl,
        phone: phone.trim() || null,
        address: address.trim() || null,
        iban: iban.trim() || null,
        payment_preference: paymentPreference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setMessage('Erro ao guardar: ' + error.message);
      return;
    }
    setMessage('Perfil atualizado.');
    await refreshProfile();
  };

  const handleActivateVendor = async () => {
    if (!user?.id || !profile) return;
    if (
      !window.confirm(
        'Ao ativares a conta de vendedor, podes criar anúncios, gerir produtos e aceder à área vendedor. Continuar?'
      )
    ) {
      return;
    }
    setVendorActivating(true);
    setVendorMessage('');
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({
        user_type: 'vendedor',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (dbErr) {
      setVendorActivating(false);
      setVendorMessage('Erro ao ativar: ' + dbErr.message);
      return;
    }

    const { error: authErr } = await supabase.auth.updateUser({
      data: {
        user_type: 'vendedor',
        ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
      },
    });

    setVendorActivating(false);
    if (authErr) {
      setVendorMessage('Conta atualizada na base de dados, mas os metadados da sessão falharam: ' + authErr.message + '. Recarrega a página.');
      await refreshProfile();
      return;
    }
    setVendorMessage('');
    await refreshProfile();
    setMessage('Conta de vendedor ativada. Já podes usar Vender e a área vendedor no menu.');
  };

  if (authLoading) {
    return (
      <div className="page">
        <Header />
        <main className="main"><p className="loading">A carregar...</p></main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="page">
      <Header />
      <main className="main">
        <h1>O meu perfil</h1>
        <p className="auth-subtitle">Atualiza os teus dados pessoais e preferências de pagamento.</p>

        {isComum && (
          <div className="auth-card perfil-card perfil-vendor-cta">
            <h2 className="perfil-vendor-cta__title">Vender no marketplace</h2>
            <p className="perfil-vendor-cta__text">
              Registaste-te como utilizador comum. Podes ativar a qualquer momento uma <strong>conta de vendedor</strong> para
              publicar produtos, gerir stock e falar com compradores.
            </p>
            {vendorMessage && <p className="auth-error">{vendorMessage}</p>}
            <button
              type="button"
              className="btn btn-primary perfil-vendor-cta__btn"
              disabled={vendorActivating}
              onClick={handleActivateVendor}
            >
              {vendorActivating ? 'A ativar...' : 'Ativar conta de vendedor'}
            </button>
          </div>
        )}

        <div className="auth-card perfil-card">
          <form onSubmit={handleSubmit} className="auth-form">
            {message && <p className={message.startsWith('Erro') ? 'auth-error' : 'auth-success'}>{message}</p>}

            <div className="perfil-avatar-section">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Foto de perfil" className="perfil-avatar-img" />
              ) : (
                <div className="perfil-avatar-placeholder">Sem foto</div>
              )}
              <label className="auth-label" style={{ marginTop: '0.5rem' }}>
                Foto de perfil
                <input
                  type="file"
                  className="auth-input"
                  accept={ACCEPT_AVATAR_IMAGES}
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                />
                {avatarFile && <span className="perfil-hint">{avatarFile.name}</span>}
                {!avatarFile && avatarUrl && (
                  <span className="perfil-hint">Foto atual. Carrega um ficheiro para atualizar.</span>
                )}
              </label>
            </div>

            <label className="auth-label">
              Nome completo
              <input
                type="text"
                className="auth-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="O teu nome"
              />
            </label>

            <label className="auth-label">
              Email
              <input
                type="email"
                className="auth-input auth-input--readonly"
                value={user.email ?? ''}
                readOnly
                disabled
                title="O email altera-se na área de conta do utilizador."
              />
              <span className="perfil-hint">O email não pode ser alterado aqui.</span>
            </label>

            <label className="auth-label">
              Telemóvel
              <input
                type="tel"
                className="auth-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+351 912 345 678"
              />
            </label>

            <label className="auth-label">
              Morada
              <textarea
                className="auth-input"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, código postal, localidade"
              />
            </label>

            <div className="auth-radio-group">
              <span className="auth-label-block">Receber pagamentos (vendas) por:</span>
              <label className="auth-radio">
                <input
                  type="radio"
                  name="paymentPreference"
                  value="transferencia"
                  checked={paymentPreference === 'transferencia'}
                  onChange={() => setPaymentPreference('transferencia')}
                />
                <span>Transferência bancária (IBAN)</span>
              </label>
              <label className="auth-radio">
                <input
                  type="radio"
                  name="paymentPreference"
                  value="mbway"
                  checked={paymentPreference === 'mbway'}
                  onChange={() => setPaymentPreference('mbway')}
                />
                <span>MB Way</span>
              </label>
            </div>

            <label className="auth-label">
              IBAN (para transferência)
              <input
                type="text"
                className="auth-input"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="PT50 0000 0000 0000 0000 00000"
                maxLength={34}
              />
              <span className="perfil-hint">Preenchido se escolheste transferência bancária.</span>
            </label>

            <button type="submit" className="btn btn-primary auth-submit" disabled={saving}>
              {saving ? 'A guardar...' : 'Guardar perfil'}
            </button>
          </form>
        </div>

        <p style={{ marginTop: '1rem' }}>
          <Link href="/">Voltar ao início</Link>
          {profile?.user_type === 'vendedor' && (
            <> · <Link href="/vendedor">Área vendedor</Link></>
          )}
        </p>
      </main>
      <Footer />
    </div>
  );
}
