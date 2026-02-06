# Vambe – Categorización Automática y Panel de Métricas

Monorepo que demuestra el desafío técnico de Vambe AI: ingestamos reuniones desde un CSV, invocamos un LLM para etiquetarlas y exponemos las métricas en un dashboard interactivo. Se compone de:

- `apps/api`: API NestJS + Prisma + PostgreSQL (Neon). Expone ingestión CSV, clasificación vía OpenAI y endpoints de métricas.
- `apps/web`: Frontend Next.js + React + Recharts. Panel con KPIs, gráficos y flujo de “Operaciones de datos”.
- `packages/*`: Esquemas compartidos (Zod), tipos y utilidades.

## 1. Requisitos

- Node.js ≥ 20
- pnpm ≥ 9
- Cuenta con acceso a un modelo LLM compatible (ej. OpenAI GPT-4.1 mini)

## 2. Preparación del entorno

```bash
pnpm install
```

### Variables de entorno

#### API (`apps/api/.env`)

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
#CORS_ORIGIN=https://vambe-llm-dashboard-web.vercel.app
DATABASE_URL="postgresql://neondb_owner:password@ep-your-neon-host.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
LLM_TIMEOUT_MS=30000
LLM_CONCURRENCY=3
```

- `OPENAI_API_KEY`: crea un API key en <https://platform.openai.com/>.
- `DATABASE_URL`: usa la cadena “Prisma” que entrega Neon (o tu instancia Postgres); incluye `?sslmode=require` y, si usas el pooler compartido de Neon, agrega `&channel_binding=require`.
- CORS: mantén el primer `CORS_ORIGIN` para localhost y descomenta/ajusta la segunda línea para tu dominio de Vercel u orígenes adicionales.

#### Web (`apps/web/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Base de datos en Neon

1. Ve a <https://console.neon.tech/>, crea un proyecto llamado `vambe-llm-dashboard`.
2. Región: **aws-us-east-1 (N. Virginia)** para estar cerca de Vercel/Render.
3. Usa la base y usuario por defecto (`neondb`, `neondb_owner`) o crea otros si prefieres.
4. En **Connection Details** selecciona el snippet `Prisma`, deja “Connection pooling” activado y copia la URL (termina en `?sslmode=require&channel_binding=require` cuando usas el pooler).
5. Pegue esa URL en `DATABASE_URL` tanto en tu `.env` local como en las variables de Render.
6. Ejecuta `pnpm --filter api prisma migrate deploy` para crear las tablas en Neon antes de correr la API.

### Primer arranque

```bash
# En una terminal
pnpm --filter api prisma migrate deploy
pnpm --filter api prisma db seed   # opcional si quieres datos iniciales

# En terminales separadas
pnpm --filter api start:dev
pnpm --filter web dev
```

También puedes usar `pnpm dev` en la raíz para levantar ambos con `concurrently`.

## 3. Arquitectura en breve

| Capa            | Tecnología              | Descripción                                                                                                                                                 |
|-----------------|-------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Backend API     | NestJS + Prisma         | Endpoints de ingestión CSV (`POST /ingest/csv`), clasificación (`POST /classification/run`), métricas (`/metrics/*`), estado del pipeline y reset de datos. |
| LLM Integration | OpenAI SDK              | `ClassificationService` toma cada transcripción, arma el prompt (`packages/shared`), valida la respuesta con Zod y persiste el JSON normalizado.           |
| Frontend        | Next.js (app router)    | Server components para paginas, client components para gráficos y filtros.                                                                                 |
| Métricas        | Recharts + tarjetas KPI | Deal stages vs close rate, intención vs fit, pains más frecuentes, desempeño por vendedor, tabla enriquecida y detalle con toda la data del LLM.           |

## 4. Flujo completo desde el dashboard

En la home (`/`) encontrarás el panel **Operaciones de datos** que permite realizar todo el desafío sin tocar la terminal:

1. **Subir CSV**: haz clic en “Subir CSV”, elige tu archivo local (mismo formato de la prueba) y verás cuántas filas fueron procesadas u omitidas.
2. **Clasificar pendientes**: define el tamaño del lote (por defecto = registros pendientes) y presiona “Clasificar pendientes”. El panel muestra el progreso y el tiempo estimado (se actualiza automáticamente).
3. **Limpiar base actual**: si quieres repetir la demo desde cero, usa “Eliminar datos cargados”; luego carga otro CSV y vuelve a clasificar.

El resto de la página se actualiza automáticamente cuando termina una clasificación o un reset, mostrando:

- KPIs: reuniones, cierres, tasa de cierre, fit promedio.
- Gráficos: Deal Stage vs Close Rate, Intent vs Fit, Pain Points, Clasificaciones por Vendedor.
- Tabla y detalle de clasificaciones con toda la metadata del LLM (BANT, riesgos, señales, próximos pasos, etc.).

## 5. Scripts útiles

| Comando            | Descripción                                 |
|--------------------|---------------------------------------------|
| `pnpm lint`        | ESLint para todo el monorepo                |
| `pnpm format`      | formateo de archivos  |
| `pnpm --filter api start:dev` | API en modo watch                 |
| `pnpm --filter web dev`       | Frontend Next.js (port 3000)      |
| `pnpm dev`         | API + Web simultáneamente (usa concurrently)|

## 6. Deploy

La app está pensada para desplegar ambos servicios. Para una demo rápida:

1. Monta la API en Railway/Fly/Render apuntando a tu base Neon/PostgreSQL.
2. Expón las variables en el entorno (incluye `OPENAI_API_KEY`).
3. Despliega el frontend en Vercel apuntando `NEXT_PUBLIC_API_URL` a la API.

> Nota: si compartes un enlace público, recuerda configurar CORS en `apps/api/.env` con el dominio del frontend.
