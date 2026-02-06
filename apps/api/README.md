# Vambe LLM Dashboard – API (NestJS + Prisma)

## Requisitos

- Node 20+ (ideal 22)
- pnpm
- Una base PostgreSQL (Neon/Postgres gestionado recomendado)

## Variables de entorno

Crea `apps/api/.env`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
DATABASE_URL="postgresql://neondb_owner:password@ep-your-neon-host.aws.neon.tech/neondb?sslmode=require"

LLM_PROVIDER=openai
OPENAI_API_KEY=TU_KEY
OPENAI_MODEL=gpt-4.1-mini

# opcional
LLM_CONCURRENCY=3
LLM_TIMEOUT_MS=20000
```

- La cadena de conexión debe apuntar a tu proyecto Neon (o cualquier Postgres compatible).
- Después de crear la base ejecuta `pnpm --filter api prisma migrate deploy` para aplicar los esquemas.
