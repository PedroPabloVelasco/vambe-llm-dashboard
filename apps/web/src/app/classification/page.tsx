import Link from 'next/link';

import { api } from '../../lib/api';
import ClassificationListClient from '../ui/ClassificationListClient';

export default async function ClassificationPage() {
  const first = await api.classificationList({ take: 10 });

  return (
    <main className="app-main">
      <div className="page-shell">
        <header className="page-header">
          <div>
            <p className="section-eyebrow">Clasificaciones</p>
            <h1 className="page-title">Historial de reuniones etiquetadas</h1>
            <p
              className="text-subtle"
              style={{ marginTop: '1rem', maxWidth: 520 }}
            >
              Explora cada conversación con contexto de cliente, etapa y riesgo
              para detectar patrones o profundizar en oportunidades específicas.
            </p>
          </div>
          <div className="header-actions">
            <Link href="/" className="btn btn-ghost">
              Volver al dashboard
            </Link>
          </div>
        </header>

        <section style={{ marginTop: '2.5rem' }}>
          <ClassificationListClient initial={first} />
        </section>
      </div>
    </main>
  );
}
