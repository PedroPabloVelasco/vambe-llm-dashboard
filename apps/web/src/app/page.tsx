import Link from 'next/link';

import { api } from '../lib/api';

import DashboardClient from './ui/DashboardClient';

export default async function Page() {
  const [summary, dealStage, intentVsFit, painPoints, bySeller] =
    await Promise.all([
      api.metricsSummary(),
      api.dealStageVsClose(),
      api.intentVsFit(),
      api.painPoints({ top: 10, normalize: true }),
      api.bySeller(),
    ]);

  return (
    <main className="app-main">
      <div className="page-shell">
        <header className="page-header">
          <div>
            <p className="section-eyebrow">Visión general</p>
            <h1 className="page-title">Vambe LLM Dashboard</h1>
            <p
              className="text-subtle"
              style={{ marginTop: '1rem', maxWidth: 520 }}
            >
              Visualiza el pulso comercial de tu equipo con métricas
              accionables, filtros intuitivos y gráficas que resaltan las
              oportunidades y riesgos detectados por el modelo.
            </p>
          </div>
          <div className="header-actions">
            <Link href="/classification" className="btn btn-ghost">
              Ver clasificaciones
            </Link>
          </div>
        </header>

        <section style={{ marginTop: '2.5rem' }}>
          <DashboardClient
            initial={{ summary, dealStage, intentVsFit, painPoints, bySeller }}
          />
        </section>
      </div>
    </main>
  );
}
