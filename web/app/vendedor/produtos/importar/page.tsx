'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  CATEGORY_PRODUTO_DIGITAL,
  DIGITAL_SUBCATEGORIES,
  PHYSICAL_LEAF_CATEGORIES,
  PRODUCT_TYPE_REUTILIZADOS,
} from '@/lib/categories';

function formatImportResult(data: {
  created: number;
  failed?: number;
  errors?: { row: number; message: string }[];
}) {
  const lines = [
    `Importados com sucesso: ${data.created}`,
    data.failed ? `Linhas com erro: ${data.failed}` : '',
    '',
    ...(data.errors?.length
      ? data.errors.map((x) => `Linha ${x.row}: ${x.message}`)
      : []),
  ].filter(Boolean);
  return lines.join('\n');
}

export default function ImportarCsvPage() {
  const { user, loading: authLoading } = useAuth();
  const [fileDigital, setFileDigital] = useState<File | null>(null);
  const [filePhysical, setFilePhysical] = useState<File | null>(null);
  const [busy, setBusy] = useState<'digital' | 'physical' | null>(null);
  const [errDigital, setErrDigital] = useState('');
  const [errPhysical, setErrPhysical] = useState('');
  const [resDigital, setResDigital] = useState<string | null>(null);
  const [resPhysical, setResPhysical] = useState<string | null>(null);

  const runImport = async (kind: 'digital' | 'physical', file: File | null) => {
    const setErr = kind === 'digital' ? setErrDigital : setErrPhysical;
    const setRes = kind === 'digital' ? setResDigital : setResPhysical;
    setErr('');
    setRes(null);
    if (!file) {
      setErr('Escolhe um ficheiro CSV.');
      return;
    }
    setBusy(kind);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setErr('Inicia sessão de novo.');
        return;
      }

      const form = new FormData();
      form.set('file', file);

      const url =
        kind === 'digital' ? '/api/vendedor/import-digital-csv' : '/api/vendedor/import-physical-csv';
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? 'Erro ao importar.');
        return;
      }

      setRes(formatImportResult(data));
    } catch (err) {
      setErr(err instanceof Error ? err.message : 'Erro de rede.');
    } finally {
      setBusy(null);
    }
  };

  const handleSubmitDigital = async (e: React.FormEvent) => {
    e.preventDefault();
    await runImport('digital', fileDigital);
  };

  const handleSubmitPhysical = async (e: React.FormEvent) => {
    e.preventDefault();
    await runImport('physical', filePhysical);
  };

  if (authLoading || !user) {
    return (
      <div className="vendedor-page">
        <p className="loading">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="vendedor-page">
      <h1>
        <Link href="/vendedor/produtos" className="vendedor-back">
          ←
        </Link>{' '}
        Importar produtos (CSV)
      </h1>

      <p className="auth-subtitle" style={{ maxWidth: '42rem' }}>
        <strong>Excel (Portugal):</strong> podes usar vírgula ou ponto e vírgula como separador. Descrições com
        várias linhas: texto entre aspas <code>&quot;…&quot;</code> numa única célula. Máximo{' '}
        <strong>50</strong> linhas por envio em cada importação.
      </p>

      <div className="auth-card vendedor-form-card">
        <h2 className="vendedor-import-h2">Produtos digitais (PDF / ficheiro no Google Drive)</h2>
        <p className="auth-subtitle">
          Uma linha por anúncio. O ficheiro para o comprador deve estar no <strong>Google Drive</strong> com
          partilha &quot;Qualquer pessoa com o link&quot;.
        </p>

        <h3 className="vendedor-import-h3">Colunas</h3>
        <ul className="vendedor-import-list">
          <li>
            <strong>title</strong>, <strong>price</strong>, <strong>file_url</strong> (obrigatórios)
          </li>
          <li>
            <strong>description</strong>, <strong>category</strong> (<code>{CATEGORY_PRODUTO_DIGITAL}</code> ou
            vazio)
          </li>
          <li>
            <strong>digital_subcategories</strong> — <code>{DIGITAL_SUBCATEGORIES.map((s) => s.slug).join(', ')}</code>
          </li>
          <li>
            <strong>image_url_1</strong>…<strong>image_url_5</strong> (ou <strong>image_url</strong> / <strong>capa</strong>)
          </li>
        </ul>

        <p>
          <a href="/sample-import-digital.csv" download className="btn btn-secondary">
            CSV de exemplo (digital)
          </a>
        </p>
        <p className="auth-subtitle">
          O exemplo inclui uma linha por subcategoria digital. Substitui links antes de importar.
        </p>

        <form onSubmit={handleSubmitDigital} className="auth-form">
          {errDigital ? <p className="auth-error">{errDigital}</p> : null}
          <label className="auth-label">
            Ficheiro CSV (digital)
            <input
              type="file"
              accept=".csv,text/csv"
              className="auth-input"
              onChange={(e) => setFileDigital(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy !== null}>
            {busy === 'digital' ? 'A importar…' : 'Importar digitais'}
          </button>
        </form>

        {resDigital ? (
          <pre className="vendedor-import-result" role="status">
            {resDigital}
          </pre>
        ) : null}
      </div>

      <div className="auth-card vendedor-form-card" style={{ marginTop: '1.5rem' }}>
        <h2 className="vendedor-import-h2">Produtos físicos ou reutilizados</h2>
        <p className="auth-subtitle">
          Uma linha por anúncio. É obrigatório pelo menos um URL de imagem por linha.{' '}
          <strong>category</strong> deve ser o slug de uma <strong>categoria folha</strong> (não uses{' '}
          <code>{CATEGORY_PRODUTO_DIGITAL}</code> aqui).
        </p>

        <h3 className="vendedor-import-h3">Colunas</h3>
        <ul className="vendedor-import-list">
          <li>
            <strong>title</strong>, <strong>price</strong>, <strong>category</strong> (obrigatórios)
          </li>
          <li>
            <strong>type</strong> — <code>physical</code> (predefinição) ou <code>{PRODUCT_TYPE_REUTILIZADOS}</code>
          </li>
          <li>
            <strong>stock</strong> — inteiro ≥ 0 (vazio = 1)
          </li>
          <li>
            <strong>shipping_fee_eur</strong> / <strong>portes</strong> — vazio = sem portes na plataforma;{' '}
            <code>0</code> = grátis
          </li>
          <li>
            <strong>ships_only_same_region</strong> — <code>sim</code> / <code>nao</code> (ou{' '}
            <code>true</code> / <code>false</code>)
          </li>
          <li>
            <strong>description</strong> — opcional
          </li>
          <li>
            <strong>image_url_1</strong>…<strong>image_url_5</strong> — pelo menos uma imagem obrigatória
          </li>
        </ul>

        <p>
          <a href="/sample-import-physical.csv" download className="btn btn-secondary">
            CSV de exemplo (físico / reutilizado)
          </a>
        </p>
        <details className="vendedor-import-details">
          <summary>Slugs de categoria folha aceites ({PHYSICAL_LEAF_CATEGORIES.length})</summary>
          <p className="auth-subtitle vendedor-import-slugs">
            <code>{PHYSICAL_LEAF_CATEGORIES.map((c) => c.slug).join(', ')}</code>
          </p>
        </details>

        <form onSubmit={handleSubmitPhysical} className="auth-form">
          {errPhysical ? <p className="auth-error">{errPhysical}</p> : null}
          <label className="auth-label">
            Ficheiro CSV (físico / reutilizado)
            <input
              type="file"
              accept=".csv,text/csv"
              className="auth-input"
              onChange={(e) => setFilePhysical(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy !== null}>
            {busy === 'physical' ? 'A importar…' : 'Importar físicos / reutilizados'}
          </button>
        </form>

        {resPhysical ? (
          <pre className="vendedor-import-result" role="status">
            {resPhysical}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
