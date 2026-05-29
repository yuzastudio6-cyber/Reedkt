# Production Testing Checklist

## Offline Foundation Gate

- `npm run lint` passes.
- `npm test` passes.
- `npm run test:unit` passes.
- `npm run test:integration` passes.
- `npm run test:e2e` passes in mocked/offline mode.
- `npm run build` passes.
- `npm run build:server` passes.
- `git diff --check` passes.
- `package-lock.json` is unchanged unless an approved dependency slice requires it.

## Environment Gate

- `FRONTEND_URL` is set to the deployed frontend origin.
- `BACKEND_URL` is set to the deployed API origin.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are configured only in secure backend runtime.
- Frontend variables are limited to safe `VITE_*` values.
- No raw provider, payment, database, or service-role secret is committed or printed.

## Backend Gate

- `/health` responds.
- `/health/readiness` exposes only safe runtime summaries.
- Production CORS only allows approved frontend origins.
- Security headers are present.
- Unexpected production errors are sanitized.
- Protected API routes reject unauthenticated requests.
- Real provider calls remain disabled unless a future approved backend/worker milestone enables them.

## Database Gate

- Supabase migrations are reviewed before execution.
- Staging database has backups and rollback plan.
- SQL smoke checks are run against the intended test database only after credentials are approved.
- Service-role access stays backend-only.

## Deployment Gate

- No Cloud Run, GCP resource mutation, Docker push, provider call, media processing, model download, or public URL creation occurs without an explicit deployment phase.
- Staging deploy has rollback instructions.
- Logs avoid authorization headers, service-role keys, provider keys, signed URLs, and raw user media payloads.
- Monitoring and alerting are reviewed before external beta.

## Known Non-Goals For This Slice

- No Reddit OAuth/API implementation.
- No direct PostgreSQL `pg` pool implementation.
- No Playwright browser E2E dependency.
- No production deploy.
- No provider, render, worker, payment, or media-processing execution.
