'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import type { ClassificationListItem } from '../lib/api';

const pillTone: Record<string, string> = {
  high: 'risk-pill high',
  medium: 'risk-pill medium',
  low: 'risk-pill low',
  unknown: 'risk-pill unknown',
};

const riskLabels: Record<string, string> = {
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
  unknown: 'Sin dato',
};

const priorityLabels: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  unknown: 'Sin dato',
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const labelFromMap = (
  value: string | null | undefined,
  map: Record<string, string>,
) => map[String(value ?? 'unknown').toLowerCase()] ?? 'Sin dato';

export function ClassificationTable({
  items,
  loading,
}: {
  items: ClassificationListItem[];
  loading?: boolean;
}) {
  const rows = useMemo(() => items ?? [], [items]);

  return (
    <section className="surface-card table-wrapper">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.2rem',
        }}
      >
        <div>
          <p className="section-eyebrow">Listado</p>
          <h3 className="chart-card__title">Clasificaciones recientes</h3>
        </div>
        {loading ? <span className="text-subtle">Cargando…</span> : null}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="classification-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Industria</th>
              <th>Etapa</th>
              <th>Intención</th>
              <th>Fit</th>
              <th>¿Cerró?</th>
              <th>Riesgo</th>
              <th>Prioridad del dolor</th>
              <th>Próx. paso</th>
              <th>Resumen</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const customer = c.meeting?.customer?.name ?? '—';
              const seller = c.meeting?.seller ?? '—';
              const closed = c.meeting?.closed ? 'Sí' : 'No';
              const meta = c.raw;
              const priority = meta?.priority_pain ?? 'unknown';
              const nextStep = meta?.next_steps?.[0];
              const created = formatDate(c.createdAt);
              const summary = meta?.summary ?? '—';
              const summaryPreview =
                summary.length > 120 ? `${summary.slice(0, 120)}…` : summary;

              return (
                <tr key={c.id}>
                  <td>{customer}</td>
                  <td>{seller}</td>
                  <td>{meta?.industry ?? '—'}</td>
                  <td>{c.dealStage}</td>
                  <td>{c.intent}</td>
                  <td>{c.fitScore}</td>
                  <td>{closed}</td>
                  <td>
                    <span
                      className={
                        pillTone[String(c.riskLevel).toLowerCase()] ??
                        pillTone.unknown
                      }
                    >
                      {labelFromMap(c.riskLevel, riskLabels)}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {labelFromMap(priority, priorityLabels)}
                  </td>
                  <td>
                    {nextStep ? (
                      <div>
                        <strong
                          style={{ display: 'block', fontSize: '0.85rem' }}
                        >
                          {nextStep.description}
                        </strong>
                        <span
                          className="text-subtle"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {formatDate(nextStep.date)}
                        </span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    <span className="text-subtle">{summaryPreview}</span>
                  </td>
                  <td>{created}</td>
                  <td>
                    <Link
                      href={`/classification/${c.id}`}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td
                  style={{ padding: '1.5rem', color: 'var(--text-muted)' }}
                  colSpan={12}
                >
                  No hay datos disponibles.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
