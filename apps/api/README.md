# Vambe LLM Dashboard – API (NestJS + Prisma)

## Requisitos
- Node 20+ (ideal 22)
- pnpm
- SQLite (incluida por Prisma)

## Variables de entorno
Crea `apps/api/.env`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
DATABASE_URL="file:./prisma/dev.db"

LLM_PROVIDER=openai
OPENAI_API_KEY=TU_KEY
OPENAI_MODEL=gpt-4.1-mini

# opcional
LLM_CONCURRENCY=3
LLM_TIMEOUT_MS=20000
