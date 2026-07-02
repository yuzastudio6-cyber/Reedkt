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
```

For explicit local mock mode without Supabase service-role env:

```bash
API_ALLOW_MOCK_WITHOUT_SUPABASE=true E2E_RUNTIME_MODE=local npm run dev:api
```

## Required Future Work

Future prompts should add service-role transactions/RPCs for approved snapshots, credit reservations, worker claims, job transitions, storage object creation, and provider attempt recording before any real end-to-end editing execution begins.
