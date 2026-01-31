'use client';

import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
};

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
      setError('API base URL no configurada');
      return;
    }

    fetch(`${baseUrl}/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }
        return response.json();
      })
      .then((data: HealthResponse) => {
        setHealth(data);
      })
      .catch(() => {
        setError('No se pudo conectar con la API');
      });
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Panel de métricas</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!error && !health && <p>Cargando estado de la API...</p>}

      {health && <p>Estado API: {health.status}</p>}
    </main>
  );
}
