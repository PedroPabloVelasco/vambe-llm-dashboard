'use client';

import { useMemo, useState } from 'react';

type Props = {
  onChange: (value: { from?: string; to?: string }) => void;
  loading?: boolean;
};

export function FiltersBar({ onChange, loading }: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const canApply = useMemo(() => Boolean(from || to), [from, to]);

  const handleApply = () => {
    onChange({ from: from || undefined, to: to || undefined });
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    onChange({});
  };

  return (
    <section className="filters-bar surface-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <p className="section-eyebrow">Filtros rápidos</p>
        <div className="text-subtle">
          Segmenta por rango de fechas para afinar las métricas.
        </div>
        {loading ? (
          <span className="text-subtle">Actualizando datos…</span>
        ) : null}
      </div>

      <div className="filters-bar__grid">
        <label className="input-control">
          <span>Desde</span>
          <input
            type="date"
            lang="es-CL"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="input-control">
          <span>Hasta</span>
          <input
            type="date"
            lang="es-CL"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>

      <div className="filters-bar__actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleApply}
          disabled={!canApply}
        >
          Aplicar
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleClear}
          disabled={!canApply}
        >
          Limpiar
        </button>
      </div>
    </section>
  );
}
