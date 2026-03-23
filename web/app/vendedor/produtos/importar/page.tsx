'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { CATEGORY_PRODUTO_DIGITAL } from '@/lib/categories';

export default function ImportarDigitalCsvPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!file) {
      setError('Escolhe um ficheiro CSV.');
      return;
    }
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Inicia sessão de novo.');
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.set('file', file);

      const res = await fetch('/api/vendedor/import-digital-csv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erro ao importar.');
        setLoading(false);
        return;
      }

      const lines = [
        `Importados com sucesso: ${data.created}`,
        data.failed ? `Linhas com erro: ${data.failed}` : '',
        '',
        ...(data.errors?.length
          ? data.errors.map((x: { row: number; message: string }) => `Linha ${x.row}: ${x.message}`)
          : []),
      ].filter(Boolean);
      setResult(lines.join('\n'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="vendedor-page">
        <p className="loading">A carregar...</p>
      </div>
    );
  }

  if (profile?.user_type !== 'vendedor') {
    return (
      <div className="vendedor-page">
        <p className="auth-error">Apenas contas vendedor podem importar.</p>
        <Link href="/vendedor">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="vendedor-page">
      <h1>
        <Link href="/vendedor/produtos" className="vendedor-back">
          ←
        </Link>{' '}
        Importar produtos digitais (CSV)
      </h1>

      <div className="auth-card vendedor-form-card">
        <p className="auth-subtitle">
          Carrega um ficheiro <strong>CSV</strong> com uma linha por produto. O PDF deve estar no{' '}
          <strong>Google Drive</strong> com partilha &quot;Qualquer pessoa com o link&quot; (ou o comprador
          precisa de permissão). O link pode ser o URL normal de visualização do ficheiro.
        </p>
        <p className="auth-subtitle">
          <strong>Excel (Portugal):</strong> podes usar vírgula ou ponto e vírgula como separador — o import
          deteta automaticamente. Se a <strong>descrição</strong> tiver várias linhas, mantém o texto entre
          aspas <code>&quot;…&quot;</code> numa única célula (como o Excel exporta).
        </p>

        <h3 className="vendedor-import-h3">Colunas suportadas</h3>
        <ul className="vendedor-import-list">
          <li>
            <strong>title</strong> (obrigatório) — nome do anúncio
          </li>
          <li>
            <strong>price</strong> (obrigatório) — preço em EUR (ex.: 9.99)
          </li>
          <li>
            <strong>file_url</strong> (obrigatório) — link do Google Drive (ex.:{' '}
            <code>https://drive.google.com/file/d/ID/view</code>)
          </li>
          <li>
            <strong>description</strong> — opcional
          </li>
          <li>
            <strong>category</strong> — slug da categoria (predefinição: <code>{CATEGORY_PRODUTO_DIGITAL}</code>)
          </li>
          <li>
            <strong>digital_subcategories</strong> — uma ou mais subcategorias separadas por <code>|</code> ou{' '}
            <code>;</code> (se categoria for produto digital; se vazio, usa-se uma predefinição)
          </li>
          <li>
            <strong>image_url</strong> — URL da imagem de capa do anúncio (recomendado)
          </li>
        </ul>

        <p>
          <a href="/sample-import-digital.csv" download className="btn btn-secondary">
            Descarregar CSV de exemplo
          </a>
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error ? <p className="auth-error">{error}</p> : null}
          <label className="auth-label">
            Ficheiro CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="auth-input"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'A importar…' : 'Importar'}
          </button>
        </form>

        {result ? (
          <pre className="vendedor-import-result" role="status">
            {result}
          </pre>
        ) : null}

        <p className="auth-subtitle">
          Máximo <strong>50</strong> linhas por importação. Os produtos são criados como tipo{' '}
          <strong>digital</strong> com o link de download normalizado.
        </p>
      </div>
    </div>
  );
}
