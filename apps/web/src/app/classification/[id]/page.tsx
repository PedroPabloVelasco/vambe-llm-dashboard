import Link from 'next/link';

import { api, type ClassificationLLMData } from '../../../lib/api';

function JsonBlock({ value }: { value: unknown }) {
  const content = JSON.stringify(value ?? null, null, 2);
  return <pre className="json-block">{content}</pre>;
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const ChipsList = ({ label, items }: { label: string; items: string[] }) => (
  <article>
    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.6rem' }}>
      {label}
    </h4>
    {items.length ? (
      <ul className="inline-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="text-subtle">Sin datos</p>
    )}
  </article>
);

const levelMap: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  unknown: 'Sin dato',
};

const riskMap: Record<string, string> = {
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
  unknown: 'Sin dato',
};

const boolMap: Record<string, string> = {
  true: 'Sí',
  false: 'No',
  unknown: 'Sin dato',
};

const bantMap: Record<string, string> = {
  confirmed: 'Confirmado',
  unconfirmed: 'Por confirmar',
  none: 'No aplica',
  unknown: 'Sin dato',
  decision_maker_present: 'Decisor presente',
  influencer_present: 'Influenciador presente',
  not_present: 'No presente',
  this_month: 'Este mes',
  this_quarter: 'Este trimestre',
  this_year: 'Este año',
  clear: 'Claro',
  vague: 'Difuso',
};

const unitMap: Record<string, string> = {
  daily: 'diarias',
  weekly: 'semanales',
  monthly: 'mensuales',
  unknown: 'sin dato',
};

const mapLabel = (
  value: string | null | undefined,
  dict: Record<string, string>,
) => dict[String(value ?? 'unknown').toLowerCase()] ?? 'Sin dato';

export default async function ClassificationDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = 'then' in params ? await params : params;
  const { id } = resolvedParams;
  const item = await api.classificationById(id);

  if (!item) {
    return (
      <main className="app-main">
        <div className="page-shell">
          <header className="page-header">
            <div>
              <p className="section-eyebrow">Clasificación</p>
              <h1 className="page-title">No encontramos esta reunión</h1>
              <p className="text-subtle" style={{ marginTop: '1rem' }}>
                Revisa el enlace o intenta nuevamente más tarde.
              </p>
            </div>
            <div className="header-actions">
              <Link href="/classification" className="btn btn-ghost">
                Volver al listado
              </Link>
            </div>
          </header>
        </div>
      </main>
    );
  }

  const meta = item.raw as ClassificationLLMData;
  const customer = item.meeting?.customer?.name ?? 'Cliente sin nombre';
  const email = item.meeting?.customer?.email ?? 'Sin correo';
  const seller = item.meeting?.seller ?? 'Sin asignar';
  const closed = item.meeting?.closed ? 'Sí' : 'No';
  const formattedMeetingDate = formatDate(item.meeting?.meetingDate ?? null);
  const interaction = meta?.interaction_volume;

  return (
    <main className="app-main">
      <div className="page-shell">
        <header className="page-header">
          <div>
            <p className="section-eyebrow">Clasificación</p>
            <h1 className="page-title">{customer}</h1>
            <p className="text-subtle" style={{ marginTop: '0.5rem' }}>
              {email}
            </p>
          </div>
          <div className="header-actions">
            <Link href="/classification" className="btn btn-ghost">
              Volver al listado
            </Link>
          </div>
        </header>

        <section
          style={{
            marginTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <article className="surface-card" style={{ padding: '1.8rem' }}>
            <div className="detail-grid">
              <div className="detail-chip">
                <span className="text-subtle">Etapa del deal: </span>
                <strong>{item.dealStage}</strong>
              </div>
              <div className="detail-chip">
                <span className="text-subtle">Intención: </span>
                <strong>{mapLabel(item.intent, levelMap)}</strong>
              </div>
              <div className="detail-chip">
                <span className="text-subtle">Puntaje de fit: </span>
                <strong>{item.fitScore}</strong>
              </div>
              <div className="detail-chip">
                <span className="text-subtle">Riesgo: </span>
                <strong>{mapLabel(item.riskLevel, riskMap)}</strong>
              </div>
              <div className="detail-chip">
                <span className="text-subtle">Prioridad dolor: </span>
                <strong>{mapLabel(meta?.priority_pain, levelMap)}</strong>
              </div>
              <div className="detail-chip">
                <span className="text-subtle">Confianza del modelo: </span>
                <strong>{Math.round((meta?.confidence ?? 0) * 100)}%</strong>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h3 className="chart-card__title">Resumen del LLM</h3>
              <p className="text-subtle" style={{ marginTop: '0.8rem' }}>
                {meta?.summary ?? 'Sin resumen disponible.'}
              </p>
            </div>

            <div className="classification-meta">
              <div>
                <span>Ejecutivo</span>
                <strong>{seller}</strong>
              </div>
              <div>
                <span>¿Cerró?</span>
                <strong>{closed}</strong>
              </div>
              <div>
                <span>Industria</span>
                <strong>{meta?.industry ?? 'Sin dato'}</strong>
              </div>
              <div>
                <span>Contexto</span>
                <strong>{meta?.company_context ?? 'Sin dato'}</strong>
              </div>
              <div>
                <span>Fecha reunión</span>
                <strong>{formattedMeetingDate}</strong>
              </div>
              <div>
                <span>Volumen de interacción</span>
                <strong>
                  {interaction?.value
                    ? `${interaction.value} ${mapLabel(interaction.unit, unitMap)}`
                    : mapLabel(interaction?.unit, unitMap)}
                </strong>
              </div>
            </div>
          </article>

          <div className="two-column">
            <article>
              <h3 className="chart-card__title">Motivadores y dolores</h3>
              <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                <ChipsList label="Casos de uso" items={meta?.use_cases ?? []} />
                <ChipsList
                  label="Puntos de dolor"
                  items={meta?.pain_points ?? []}
                />
                <ChipsList
                  label="Razones de fit"
                  items={meta?.fit_reasons ?? []}
                />
                <ChipsList
                  label="Riesgos detectados"
                  items={meta?.risks ?? []}
                />
              </div>
            </article>

            <article>
              <h3 className="chart-card__title">Objecciones y competencia</h3>
              <div
                style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}
              >
                <div>
                  <span className="text-subtle">Severidad</span>
                  <p>{mapLabel(meta?.objection_severity, levelMap)}</p>
                </div>
                {meta?.objections?.length ? (
                  meta.objections.map((obj, idx) => (
                    <div key={`${obj.type}-${idx}`} className="detail-chip">
                      <strong>{obj.type.replace(/_/g, ' ')}</strong>
                      <p
                        className="text-subtle"
                        style={{ marginTop: '0.3rem' }}
                      >
                        {obj.evidence}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-subtle">Sin objeciones.</p>
                )}
                <div>
                  <span className="text-subtle">Competidores mencionados</span>
                  <p>
                    {meta?.competitors_mentioned?.length
                      ? meta.competitors_mentioned.join(', ')
                      : 'Sin dato'}
                  </p>
                </div>
                <div>
                  <span className="text-subtle">Estado actual</span>
                  <p>{mapLabel(meta?.status_quo, boolMap)}</p>
                </div>
              </div>
            </article>
          </div>

          <div className="two-column">
            <article>
              <h3 className="chart-card__title">BANT</h3>
              <div className="detail-grid" style={{ marginTop: '1rem' }}>
                <div className="detail-chip">
                  <span className="text-subtle">Presupuesto: </span>
                  <strong>{mapLabel(meta?.bant?.budget, bantMap)}</strong>
                </div>
                <div className="detail-chip">
                  <span className="text-subtle">Autoridad: </span>
                  <strong>{mapLabel(meta?.bant?.authority, bantMap)}</strong>
                </div>
                <div className="detail-chip">
                  <span className="text-subtle">Tiempo: </span>
                  <strong>{mapLabel(meta?.bant?.timeline, bantMap)}</strong>
                </div>
                <div className="detail-chip">
                  <span className="text-subtle">Necesidad: </span>
                  <strong>{mapLabel(meta?.bant?.need, bantMap)}</strong>
                </div>
              </div>
            </article>

            <article>
              <h3 className="chart-card__title">Próximos pasos y señales</h3>
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                {meta?.next_steps?.length ? (
                  meta.next_steps.map((step, idx) => (
                    <div
                      key={`${step.description}-${idx}`}
                      className="detail-chip"
                    >
                      <strong>{step.description}</strong>
                      <span className="text-subtle">
                        {formatDate(step.date)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-subtle">
                    No hay próximos pasos definidos.
                  </p>
                )}
                <ChipsList
                  label="Señales positivas"
                  items={meta?.signals?.positive ?? []}
                />
                <ChipsList
                  label="Señales de alerta"
                  items={meta?.signals?.negative ?? []}
                />
              </div>
            </article>
          </div>

          <article className="surface-card" style={{ padding: '1.6rem' }}>
            <h3 className="chart-card__title">Evidencia de la IA</h3>
            <div
              style={{ marginTop: '0.8rem', display: 'grid', gap: '0.6rem' }}
            >
              {meta?.evidence?.length ? (
                meta.evidence.map((item, idx) => (
                  <p key={`${item}-${idx}`} className="text-subtle">
                    • {item}
                  </p>
                ))
              ) : (
                <p className="text-subtle">Sin evidencia registrada.</p>
              )}
            </div>
          </article>

          <details className="surface-card" style={{ padding: '1.4rem' }}>
            <summary className="btn btn-ghost" style={{ width: 'fit-content' }}>
              Ver JSON crudo
            </summary>
            <JsonBlock value={meta} />
          </details>
        </section>
      </div>
    </main>
  );
}
