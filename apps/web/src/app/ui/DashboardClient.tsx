'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  api,
  type BySellerItem,
  type DealStageItem,
  type IntentVsFitItem,
  type MetricsSummary,
  type PainPointItem,
} from '../../lib/api';
import { KpiCard } from '../../components/KpiCard';
import { ChartCard } from '../../components/ChartCard';
import { FiltersBar } from '../../components/FiltersBar';
import { DataOpsPanel } from '../../components/DataOpsPanel';

const ChartEmpty = ({ message }: { message: string }) => (
  <div className="chart-empty">{message}</div>
);

type Initial = {
  summary: MetricsSummary;
  dealStage: { items: DealStageItem[] };
  intentVsFit: { items: IntentVsFitItem[] };
  painPoints: { items: PainPointItem[] };
  bySeller: { items: BySellerItem[] };
};

export default function DashboardClient({ initial }: { initial: Initial }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initial);
  const [activeFilter, setActiveFilter] = useState<{
    from?: string;
    to?: string;
  }>({});

  const kpis = useMemo(() => {
    return {
      meetings: data.summary.totals.meetings,
      closed: data.summary.totals.closed,
      closeRate: data.summary.totals.closeRatePct,
      avgFit: data.summary.classification.avgFitScore,
    };
  }, [data]);

  const insights = useMemo(() => {
    const painPoints = data.painPoints.items.slice(0, 3);
    const sellerSorted = [...data.bySeller.items].sort(
      (a, b) => b.closeRatePct - a.closeRatePct,
    );
    const bestSeller = sellerSorted[0];
    const intentSorted = [...data.intentVsFit.items].sort(
      (a, b) => b.avgFitScore - a.avgFitScore,
    );
    const healthiestIntent = intentSorted[0];
    return { painPoints, bestSeller, healthiestIntent };
  }, [data]);

  const axisStyle = {
    stroke: 'rgba(15,23,42,0.35)',
    strokeWidth: 1,
    tickLine: false,
  };
  const tickStyle = { fill: 'rgba(15,23,42,0.55)', fontSize: 12 };

  const applyFilters = async (filter: { from?: string; to?: string }) => {
    setActiveFilter(filter);
    setLoading(true);
    try {
      const [summary, dealStage, intentVsFit, painPoints, bySeller] =
        await Promise.all([
          api.metricsSummary(filter),
          api.dealStageVsClose(filter),
          api.intentVsFit(filter),
          api.painPoints({ top: 10, normalize: true, ...filter }),
          api.bySeller(filter),
        ]);
      setData({ summary, dealStage, intentVsFit, painPoints, bySeller });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <FiltersBar onChange={applyFilters} loading={loading} />

      <section className="layout-grid layout-grid--four">
        <KpiCard
          label="Reuniones"
          value={`${kpis.meetings}`}
          hint="Total del periodo"
        />
        <KpiCard
          label="Cierres"
          value={`${kpis.closed}`}
          hint="Operaciones ganadas"
        />
        <KpiCard
          label="Tasa de cierre"
          value={`${kpis.closeRate}%`}
          hint="Porcentaje sobre reuniones"
        />
        <KpiCard
          label="Fit promedio"
          value={`${kpis.avgFit}`}
          hint="Salud general"
        />
      </section>

      <section className="layout-grid layout-grid--two">
        <ChartCard
          title="Etapas vs tasa de cierre"
          subtitle="Identifica qué etapa del embudo convierte mejor"
          right={
            loading ? <span className="text-subtle">Actualizando…</span> : null
          }
        >
          {data.dealStage.items.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.dealStage.items}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(15,23,42,0.08)"
                />
                <XAxis dataKey="dealStage" {...axisStyle} tick={tickStyle} />
                <YAxis {...axisStyle} tick={tickStyle} unit="%" />
                <Tooltip
                  formatter={(value?: number) => [
                    value !== undefined ? `${value}%` : '—',
                    'Tasa de cierre',
                  ]}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="closeRatePct"
                  name="Tasa de cierre"
                  fill="url(#dealGradient)"
                  radius={[12, 12, 4, 4]}
                />
                <defs>
                  <linearGradient id="dealGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="Aún no hay clasificaciones para graficar." />
          )}
        </ChartCard>

        <ChartCard
          title="Intención vs fit promedio"
          subtitle="Cruza motivación declarada con afinidad estimada"
          right={
            loading ? <span className="text-subtle">Actualizando…</span> : null
          }
        >
          {data.intentVsFit.items.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.intentVsFit.items}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(15,23,42,0.08)"
                />
                <XAxis dataKey="intent" {...axisStyle} tick={tickStyle} />
                <YAxis {...axisStyle} tick={tickStyle} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value?: number) => [
                    value !== undefined ? value : '—',
                    'Fit promedio',
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgFitScore"
                  name="Fit promedio"
                  stroke="#0f9d58"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="Sin datos suficientes para esta visualización." />
          )}
        </ChartCard>
      </section>

      <section className="layout-grid layout-grid--two">
        <ChartCard
          title="Dolores más frecuentes"
          subtitle="Temas que domina el discurso de los clientes"
          right={
            loading ? <span className="text-subtle">Actualizando…</span> : null
          }
        >
          {data.painPoints.items.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.painPoints.items}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(15,23,42,0.08)"
                />
                <XAxis dataKey="painPoint" hide />
                <YAxis {...axisStyle} tick={tickStyle} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  name="Menciones"
                  fill="#60a5fa"
                  radius={[12, 12, 4, 4]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="Carga datos para visualizar los puntos de dolor." />
          )}
        </ChartCard>

        <ChartCard
          title="Clasificaciones por vendedor"
          subtitle="Distribución de fit promedio por cada ejecutivo"
          right={
            loading ? <span className="text-subtle">Actualizando…</span> : null
          }
        >
          {data.bySeller.items.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.bySeller.items}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(15,23,42,0.08)"
                />
                <XAxis dataKey="seller" {...axisStyle} tick={tickStyle} />
                <YAxis {...axisStyle} tick={tickStyle} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                  }}
                  formatter={(value?: number) => [
                    value !== undefined ? value : '—',
                    'Fit promedio',
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="avgFitScore"
                  name="Fit promedio"
                  fill="#fda557"
                  radius={[12, 12, 4, 4]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="No hay vendedores con clasificaciones registradas." />
          )}
        </ChartCard>
      </section>

      <section className="surface-card" style={{ padding: '1.5rem' }}>
        <h3 className="chart-card__title">Hallazgos recomendados</h3>
        <ul
          style={{
            marginTop: '0.9rem',
            display: 'grid',
            gap: '0.6rem',
            paddingLeft: '1rem',
          }}
        >
          {insights.painPoints.map((p) => (
            <li key={p.painPoint} className="text-subtle">
              • Dolor recurrente: <strong>{p.painPoint}</strong> ({p.count}{' '}
              menciones).
            </li>
          ))}
          {insights.bestSeller ? (
            <li className="text-subtle">
              • Mejor tasa de cierre:{' '}
              <strong>{insights.bestSeller.seller}</strong> con{' '}
              {insights.bestSeller.closeRatePct}%.
            </li>
          ) : null}
          {insights.healthiestIntent ? (
            <li className="text-subtle">
              • Intención más saludable:{' '}
              <strong>{insights.healthiestIntent.intent}</strong> con fit
              promedio {insights.healthiestIntent.avgFitScore}.
            </li>
          ) : null}
          {insights.painPoints.length === 0 &&
          !insights.bestSeller &&
          !insights.healthiestIntent ? (
            <li className="text-subtle">
              Aún no hay hallazgos, aplica un filtro o ingresa datos.
            </li>
          ) : null}
        </ul>
      </section>
      <DataOpsPanel onDataRefresh={() => applyFilters(activeFilter)} />
    </div>
  );
}
