# Backend API Runtime Hardening

Prompt 7 hardens the backend API runtime and route surface without enabling new production execution. It keeps the Prompt 3-6 limited foundations available and makes execution-capable route groups fail closed.

## Current Implementation Found

- `server/app.ts` registers health, auth/project, chat, upload, approved snapshot, credit, job, worker, render, and provider routes.
- Prompt 3-6 route groups provide limited foundations for auth/profile/workspace/project, storage/upload, approved snapshots, and credits.
- Some older route groups could still call services that insert job/render/provider records or run worker/tool paths when admin runtime exists.
- API metadata exists in `src/backend/api/routes/*`, and the mock API router blocks backend-required routes but previously did not derive Prompt 7 blocked readiness for old mock execution domains.

## Route Groups

Allowed limited foundations:

- Health/readiness/runtime status.
- Auth/profile/workspace/project access.
- Storage/upload route/service boundary from Prompt 4.
- Approved snapshot route/service boundary from Prompt 5.
- Credit route/service boundary from Prompt 6.

Blocked route groups:

- Chat persistence and planning generation.
- Jobs and job events.
- Worker claims, heartbeat, tool readiness, media probe, and worker execution.
- Provider gateway requests/webhooks.
- Render jobs, renders, preview review, and render smoke execution.
- Generation, SFX, music, StoryTiming execution, Stripe, admin, provider, and broad service-role routes.

## Runtime Hardening Added

- Success responses now include `status: "ok"` and `requestId` while preserving `ok`, `data`, and `warnings`.
- Error responses now include `ok: false`, normalized status labels, `requestId`, and redacted details.
- Route helpers now provide standardized `backend_required` and `blocked` response envelopes.
- Job, worker, provider gateway, render, and chat persistence server routes return backend-required blockers instead of calling execution-capable services.
- Health routes expose runtime status and route capability reporting without exposing raw env values or executing tool checks.
- Route registry derives Prompt 7 production readiness so old mock execution domains are treated as blocked/future.
- Mock API router uses derived production readiness and fails closed for blocked/future routes.

## Capability Reporting

`GET /health/routes` reports route metadata, status, runtime mode, security level, idempotency expectation, fail-closed behavior, and derived production readiness. This endpoint is reporting-only and does not start work.

`GET /health/runtime-status` reports safe runtime configuration booleans, known blockers, limited foundation route groups, and blocked route groups.

`GET /health/tool-readiness` reports capability blockers only. It does not execute tool checks or write `tool_runtime_checks`.

## Remaining Blockers

- No deployed production backend runtime exists.
- Remote Supabase validation and migrations were not run.
- Broad service-role mutation remains blocked.
- Job orchestration and worker claims remain Prompt 8 scope.
- Provider, render/export, tools, Stripe, media analysis, generation, SFX/music, and StoryTiming execution remain blocked.
- Local full build may remain environment-blocked by the known Rolldown native binding issue; Linux CI is the expected full-build validation route.

## Next Recommendation

Prompt 8 - Job Orchestration, Worker Claims, Leases, and Idempotency if Prompt 7 validation and CI pass; otherwise Prompt 7A - Backend API Route Hardening Fix.
