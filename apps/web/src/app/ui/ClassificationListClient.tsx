'use client';

import { useState } from 'react';

import { api, type ClassificationListItem } from '../../lib/api';
import { ClassificationTable } from '../../components/ClassificationTable';

export default function ClassificationListClient({
  initial,
}: {
  initial: { items: ClassificationListItem[]; nextCursor: string | null };
}) {
  const [items, setItems] = useState<ClassificationListItem[]>(initial.items);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const next = await api.classificationList({ take: 10, cursor });
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <ClassificationTable items={items} loading={loading} />

      <div className="list-actions">
        <button
          className="load-more-btn"
          disabled={!cursor || loading}
          onClick={loadMore}
        >
          {cursor
            ? loading
              ? 'Cargando…'
              : 'Cargar más'
            : 'No hay más resultados'}
        </button>
      </div>
    </section>
  );
}
