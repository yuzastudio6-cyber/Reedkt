# ReeditPro Server Runtime Skeleton

This top-level `server/` folder is the server-only RP-E2E backend runtime boundary. It is intentionally separate from Vite/browser import paths.

## Current State

- Express route skeletons for health, projects, chat, uploads, approved snapshots, credits, jobs, worker claims, renders, and provider gateway records.
- Zod request validation, request IDs, auth middleware, idempotency middleware, and normalized error envelopes.
- Supabase admin and anon client factories that only run in server code.
- Upload/storage adapters for local test storage and future GCS storage boundaries.
- Worker runtime readiness for safe job claims, tool checks, job events, and mock-safe worker handlers.
- Mock/local mode for development when `API_ALLOW_MOCK_WITHOUT_SUPABASE=true`.

## Safety Rules

- Never import `server/` from frontend/Vite code.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in any response, log, database row, or frontend variable.
- Provider gateway routes are fail-closed. They do not call OpenAI, Wan, Hailuo, Veo, Lyria, Mirelo, or MMAudio.
- Render routes create metadata only. They do not run Remotion, FFmpeg, media downloads, uploads, or Cloud Run jobs.
- Stripe is not installed or called.
- Local storage is for testing only. Production storage must stay behind backend credentials and temporary targets.
- Canonical storage records store bucket/object path only; signed URLs are temporary and must not be stored as truth.

## Upload And Storage Routes

- `POST /v1/projects/:projectId/upload-intents`
- `PUT /v1/upload-intents/:uploadIntentId/local-object`
- `POST /v1/upload-intents/:uploadIntentId/finalize`
- `POST /v1/upload-intents/:uploadIntentId/signed-url-events`
- `GET /v1/storage-objects/:storageObjectRecordId`
- `POST /v1/storage-objects/:storageObjectRecordId/download-target`
- `GET /v1/storage-objects/:storageObjectRecordId/local-object`
- `POST /v1/workers/tool-readiness/check`
- `POST /v1/workers/jobs/:jobId/run`
- `POST /v1/workers/jobs/:jobId/probe-media`

Local mode writes private test files under `LOCAL_STORAGE_ROOT` and only returns backend routes, not filesystem paths. GCS mode is a future backend-only path and must never be called directly from frontend code.

## Worker And Tool Readiness

Required tool checks for actual editing tests:

- `ffmpeg`: ingest/trim/transcode/audio extract readiness.
- `ffprobe`: source media metadata readiness.

Optional until future worker milestones:

- `remotion`, `sharp_libvips`, `audioflux`, `signalsmith_stretch`, `opencv`, `vapoursynth`, `playwright`.

The Docker worker skeleton lives in `docker/worker/`. It installs Node, FFmpeg/FFprobe, Python 3, pip, and small shell utilities only, and does not deploy or call providers.

Prompt 6 readiness requires `ffmpeg` and `ffprobe`. If those are missing on the host, use the Docker worker path:

```bash
npm run docker:worker:build
npm run docker:worker:tools
npm run docker:worker:smoke
```

Strict Prompt 6 readiness can be checked with:

```bash
STRICT_PROMPT6_TOOL_READINESS=true npm run smoke:prompt6-ready
```

or inside Docker:

```bash
docker run --rm --env API_ALLOW_MOCK_WITHOUT_SUPABASE=true --env E2E_RUNTIME_MODE=local --env WORKER_RUNTIME_MODE=local --env STRICT_PROMPT6_TOOL_READINESS=true reeditpro-worker-dev npm run smoke:prompt6-ready
```

The Docker image is local/dev/test only. Production FFmpeg and codec usage still needs LGPL-safe build/configuration review.

## Basic Render Smoke

The first real local editing smoke path is FFmpeg/FFprobe only. It does not use Remotion, providers, Stripe, Cloud Run, or secrets.

```bash
npm run smoke:render
npm run smoke:render:test
```

`npm run smoke:render` skips with a clear warning when FFmpeg/FFprobe are missing. Strict mode fails when tools are unavailable:

```bash
npm run smoke:render:strict
```

Docker path, when Docker is installed:

```bash
npm run docker:worker:render-smoke
```

The route is:

- `POST /v1/render-jobs/:renderJobId/basic-smoke-preview`

It requires auth, idempotency, approved snapshot ID, credit reservation ID, source storage object ID, local storage mode, and a worker claim.

## Supabase Persistence Smoke

Prompt 7 adds disabled-by-default Supabase persistence checks. They connect only when live server env is explicitly configured.

```bash
npm run smoke:supabase:tables
npm run smoke:supabase:write
npm run smoke:e2e:persisted-render
npm run smoke:supabase:readiness:test
npm run smoke:supabase:write:test
npm run smoke:e2e:persisted-render:test
```

Safe defaults:

- `SUPABASE_E2E_SMOKE_MODE=disabled`
- `SUPABASE_E2E_ALLOW_WRITES=false`
- `SUPABASE_E2E_CLEANUP=true`

Live write and persisted-render smokes require server-only Supabase backend admin configuration plus `SUPABASE_E2E_SMOKE_MODE=live`, `SUPABASE_E2E_ALLOW_WRITES=true`, and an existing safe test user ID. The service-role value must never be committed, returned to clients, logged, or imported by frontend code.

Routes:

- `GET /health/supabase/tables`
- `POST /v1/e2e/supabase/write-smoke`
- `POST /v1/e2e/supabase/persisted-render-smoke`

The persisted render smoke still uses local storage and FFmpeg/FFprobe only. It does not call providers, Stripe, Remotion, GCS, or Cloud Run.

## Service-Role RPC Smoke

Prompt 8 adds local/review-ready Supabase service-role RPCs for the no-AI persisted render path. The SQL lives at:

```text
supabase/migrations/202605210002_e2e_service_role_runtime_rpcs.sql
```

The migration is not applied by the server. Apply it manually in a safe local/staging Supabase environment before running live RPC smoke.

Commands:

```bash
npm run smoke:supabase:rpcs
npm run smoke:e2e:rpc-persisted-render
npm run smoke:supabase:rpcs:test
npm run smoke:e2e:rpc-persisted-render:test
```

Live RPC persisted render requires `SUPABASE_E2E_SMOKE_MODE=live`, `SUPABASE_E2E_ALLOW_WRITES=true`, `SUPABASE_E2E_USER_ID`, server-only Supabase admin env, local storage mode, and FFmpeg/FFprobe. If the RPC migration is missing, the command fails clearly instead of using loose runtime inserts.

The RPC path remains smoke-only. Production route transactions, billing rigor, provider dispatch, and hardened non-smoke upload/source setup are Prompt 9+ work.

## Production-Shaped No-AI E2E Paths

Prompt 9 adds route-integrated no-AI full-flow commands:

```bash
npm run e2e:readiness
npm run smoke:e2e:local-full
npm run smoke:e2e:local-full:test
npm run smoke:e2e:supabase-full
npm run smoke:e2e:supabase-full:test
npm run smoke:e2e:readiness:test
```

Routes:

- `GET /health/e2e/readiness`
- `POST /v1/e2e/local/full-editing-flow`
- `POST /v1/e2e/supabase/full-editing-flow`

The local route is mock/local only and requires FFmpeg/FFprobe. It creates a synthetic source clip, moves it through upload/finalize/attach/approval/credit/job/claim/render/QA service boundaries, and returns `preview_ready` when the local preview path succeeds.

The Supabase full-flow route is disabled by default. It requires `SUPABASE_E2E_SMOKE_MODE=live`, `SUPABASE_E2E_ALLOW_WRITES=true`, an existing safe `SUPABASE_E2E_USER_ID`, required runtime tables, manually applied Prompt 8/9 RPCs, local storage, and FFmpeg/FFprobe. It never runs providers, Stripe, Remotion, Cloud Run, or production migrations.

Prompt 9 also adds this local/review-ready SQL file:

```text
supabase/migrations/202605210003_e2e_production_service_path_hardening.sql
```

Do not apply it remotely from this repo without staging validation and explicit approval.

## Local Commands

```bash
npm run dev:api
npm run typecheck:api
npm run build:api
npm run smoke:api
npm run smoke:upload
npm run smoke:tools
npm run smoke:worker
npm run tools:check
npm run tools:summary
npm run smoke:prompt6-ready
npm run smoke:render
npm run smoke:render:test
npm run smoke:supabase:tables
npm run smoke:supabase:readiness:test
npm run smoke:supabase:write:test
npm run smoke:e2e:persisted-render:test
npm run smoke:supabase:rpcs
npm run smoke:e2e:rpc-persisted-render
npm run smoke:supabase:rpcs:test
npm run smoke:e2e:rpc-persisted-render:test
npm run e2e:readiness
npm run smoke:e2e:local-full
npm run smoke:e2e:local-full:test
npm run smoke:e2e:supabase-full:test
npm run smoke:e2e:readiness:test
```

For explicit local mock mode without Supabase service-role env:

```bash
API_ALLOW_MOCK_WITHOUT_SUPABASE=true E2E_RUNTIME_MODE=local npm run dev:api
```

## Required Future Work

Future prompts should harden the service-role RPCs beyond smoke usage, connect production backend routes to transaction-safe paths, and add provider attempt recording only after approval, credit, storage, retry/refund, QA, and logging safety pass.
## Prompt 10 Live Supabase Staging Validation

Prompt 10 adds manual-gated live Supabase readiness checks. These commands do not apply migrations and do not run provider calls, Stripe, Remotion, or Cloud Run deployment.

Read-only/default commands:

```bash
npm run smoke:supabase:migration-manifest
npm run smoke:supabase:live-env
npm run smoke:supabase:tables
npm run smoke:supabase:rpcs
npm run smoke:supabase:rls-auth
```

Disabled-mode tests:

```bash
npm run smoke:supabase:migration-manifest:test
npm run smoke:supabase:live-env:test
npm run smoke:supabase:rls-auth:test
npm run smoke:supabase:write-guard:test
```

Live write smokes require all of:

- `SUPABASE_E2E_SMOKE_MODE=live`
- `SUPABASE_E2E_ALLOW_WRITES=true`
- server-only Supabase URL and service-role key
- an existing safe `SUPABASE_E2E_USER_ID`
- applied runtime tables and service-role RPC migrations

Every live smoke write is tagged with `e2eSmoke=true`, `smokeRunId`, and `createdBy="rp-e2e-smoke"`. Cleanup refuses untagged or cross-run records.

No service-role key may be placed in a `VITE_*` environment variable or returned in an API response.
