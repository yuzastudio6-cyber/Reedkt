# Production Readiness Audit

Date: 2026-05-29

## Current Repo Structure Summary

ReeditPro is an AI video editing application, not a Reddit OAuth application. The product identity and approval-gated edit flow are documented in `README.md`, `product-plan.md`, `intent-led-edit-planning.md`, and `AGENTS.md`.

The current production-runtime branch contains:

- React/Vite frontend under `src/`.
- Node/Express backend runtime under `server/`.
- Supabase/PostgreSQL migrations under `supabase/migrations/`.
- SQL smoke tests under `database/test-sql/`.
- Runtime smoke scripts under `server/smoke/`.
- Cloud/runtime planning docs under `docs/` and `docker/`.
- Package scripts and dependency declarations in `package.json`.

The current repository does not contain Reddit OAuth, Reddit API clients, Reddit post/comment/subreddit routes, or Reddit token storage. The Reddit handoff scope appears to belong to a different application or stale plan.

## Frontend Status

- `src/App.tsx` and `src/pages/*` provide the current React/Vite app shell and product pages.
- `src/backend/api/frontend-api-client.ts` and `src/backend/api/backend-runtime-config.ts` define the frontend-safe mock/live API boundary.
- Browser-facing configuration uses Vite variables such as `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_REEDITPRO_API_BASE_URL`, and `VITE_REEDITPRO_API_MODE`.
- The frontend remains mostly mock/planning oriented; live HTTP transport is intentionally constrained by the backend runtime boundary docs.
- No Reddit login, Reddit OAuth callback route, Reddit dashboard, Reddit posts/comments/subreddit UI, or Reddit posting UI exists in this codebase.

## Backend Status

- `server/app.ts` creates the Express app, registers runtime state, route groups, request IDs, and central error middleware.
- `server/index.ts` loads environment config, asserts runtime readiness, and starts the API server.
- Runtime routes exist under `server/routes/` for health, projects, chat, upload, approval, credit, jobs, workers, rendering, and provider gateway boundaries.
- `server/middleware/auth.ts` uses Supabase bearer-token validation, with explicit mock-user behavior only when `API_ALLOW_MOCK_WITHOUT_SUPABASE=true`.
- `server/services/provider-gateway-service.ts` blocks real provider calls.
- This slice adds production URL validation, production CORS allowlisting, security headers, sanitized unexpected errors, and safe request logging.

## Database And Migration Status

- The active database path is Supabase/PostgreSQL, not a direct `pg` pool.
- Active migrations live in `supabase/migrations/`.
- Migration drafts and SQL readiness tests live in `database/migration-drafts/` and `database/test-sql/`.
- `DATABASE_URL` is documented as a future/direct Postgres runtime or test variable and is not consumed by the current backend.
- Production database testing still requires human-provided Supabase project credentials, migration approval, and provider/database access outside this repository.

## Reddit OAuth And API Status

- No `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REDIRECT_URI`, `SESSION_SECRET`, or `JWT_SECRET` runtime variables are used by this repo.
- No Reddit OAuth URL builder, callback handler, token refresh service, Reddit API client, Reddit posting route, or Reddit account table was found.
- Implementing Reddit OAuth here would conflict with the actual ReeditPro AI video editing product scope.
- If Reddit integration is still desired, the correct repository or a new product decision is required before implementation.

## Environment And Config Status

- `.env.example` documents frontend-safe Vite values and server-only values.
- `server/config/env.ts` validates runtime configuration with `zod`.
- Production-like runtime now requires Supabase admin/public configuration plus `FRONTEND_URL` and `BACKEND_URL` unless explicitly running test/mock mode.
- `createSafeRuntimeSummary` reports presence booleans only and does not expose secrets or full deployment URLs.
- Provider secrets remain represented as Secret Manager reference names, not raw values.

## Test Setup Status

- The repo uses `tsx` smoke scripts today, not Vitest/Jest/Playwright.
- Existing smoke scripts live under `server/smoke/`.
- The foundation slice added `npm test`, `npm run test:unit`, `npm run test:integration`, and `npm run test:e2e` as offline smoke-style commands.
- The mocked browser E2E slice adds Playwright Chromium coverage through `npm run test:e2e:browser`.
- Formal live/staging browser E2E remains a future controlled slice requiring deployment credentials and approval.

## Deployment And Build Status

- Frontend build: `npm run build`.
- Server typecheck/build: `npm run build:server`.
- API dev runtime: `npm run dev:api`.
- Server start after server build: `npm run start:server`.
- Cloud Run and GCP execution remain planned/documented but not executed by this slice.
- Docker build/push and Cloud deployment scripts exist for future controlled phases but were not run.

## Security Issues

- Before this slice, CORS allowed all origins in the Express runtime.
- Before this slice, unexpected production errors could expose raw error messages.
- Runtime rate limiting is documented in policy docs but not enforced by backend middleware yet.
- No deployed staging browser smoke is wired.
- Production secrets, provider credentials, Supabase credentials, and deployment credentials must be supplied by humans through secure infrastructure, not committed.

## Reliability Issues

- The current backend still depends on mock-safe service behavior for many editing operations.
- Worker, provider, render, payment, and storage mutation paths remain blocked or future-controlled.
- Direct production database migration execution is not automated here.
- There is no deployed monitoring, alerting, or request-rate enforcement in this slice.

## Duplicated Or Dead Code

- No duplicate Reddit implementation exists because no Reddit implementation exists.
- The repo has many planning/readiness docs and smoke scripts; they are intentional milestone artifacts, not deleted in this slice.
- Existing route and service boundaries were preserved rather than rewritten.

## Missing Production Readiness Pieces

- Human-provisioned Supabase staging/production credentials and migration execution.
- Live staging browser E2E harness.
- Runtime rate limiting.
- Production observability and alerting.
- Deployed backend API service.
- Secure worker deployment and provider Secret Manager wiring.
- Payment/credit production integration.
- Real media-processing worker readiness beyond the explicitly approved bounded activation phases.

## Prioritized Implementation Plan

1. Keep this foundation branch focused on environment validation, backend HTTP hardening, offline tests, and docs.
2. Add runtime rate limiting and production observability once dependency and deployment targets are approved.
3. Run Supabase local/staging migration validation with human-provided database credentials.
4. Deploy a staging backend only after secrets, CORS URLs, Supabase credentials, and rollback steps are approved.
5. Expand browser E2E across the real approval-gated edit flow before any production/beta claim.
