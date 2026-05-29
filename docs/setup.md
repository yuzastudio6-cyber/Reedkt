# Setup

## Local Requirements

- Node/npm matching the project toolchain.
- Existing dependencies from `npm install` or `npm ci`.
- Supabase credentials only when testing live backend behavior.
- No provider, GCP, Docker, media-processing, or model credentials are required for the offline foundation tests.

## Environment

Start from `.env.example` and keep real values out of git.

Frontend-safe values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_REEDITPRO_API_BASE_URL`
- `VITE_REEDITPRO_API_MODE`

Server-only values:

- `NODE_ENV`
- `API_PORT` or `PORT`
- `FRONTEND_URL`
- `BACKEND_URL`
- `E2E_RUNTIME_MODE`
- `API_ALLOW_MOCK_WITHOUT_SUPABASE`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` only if a future direct Postgres path explicitly uses it

Production-like backend startup requires Supabase admin/public runtime plus `FRONTEND_URL` and `BACKEND_URL`, unless the runtime is explicitly in test/mock mode.

## Commands

```bash
npm run dev
npm run dev:api
npm run build
npm run build:server
npm run start:server
```

## Database

The current database path is Supabase/PostgreSQL:

- Active migrations: `supabase/migrations/`
- Migration order notes: `supabase/migration-order.md`
- SQL smoke checks: `database/test-sql/`

Do not run migrations against staging or production without a reviewed Supabase project, backup/rollback plan, and approved credentials.

## Reddit Handoff Note

This repository does not implement Reddit OAuth or Reddit API behavior. Do not add `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REDIRECT_URI`, Reddit token tables, or Reddit posting flows unless a future product decision targets this ReeditPro application intentionally.
