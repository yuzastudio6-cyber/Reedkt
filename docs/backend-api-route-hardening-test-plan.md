# Backend API Route Hardening Test Plan

Prompt 7 does not add executable integration tests. These cases should be used for future local/API tests once a test harness is selected.

## Response Envelope

- Success responses include `ok: true`, `status: "ok"`, `requestId`, `data`, and `warnings`.
- Error responses include `ok: false`, normalized `status`, `requestId`, and redacted error details.
- Request IDs are propagated from `x-request-id` or generated server-side.

## Auth, Access, And Idempotency

- Unauthorized requests to protected routes return `unauthorized`.
- Project/workspace access failures return `forbidden`.
- Mutation routes without `Idempotency-Key` return `validation_failed`.
- Reused idempotency keys with different bodies return `idempotency_conflict`.

## Fail-Closed Route Groups

- Job routes return `backend_required` and do not create job batches, jobs, or job events.
- Worker routes return `backend_required` and do not claim jobs, heartbeat, run workers, probe media, or write tool runtime checks.
- Provider routes return `backend_required` and do not write attempts/webhooks or call providers.
- Render routes return `backend_required` and do not create render jobs, run render smoke, write preview reviews, run Remotion, or run FFmpeg.
- Chat persistence routes return `backend_required` and do not create chat sessions, messages, attachments, or planning records.

## Capability Reporting

- `/health/runtime-status` returns safe configuration booleans and blockers only.
- `/health/routes` reports derived production readiness for blocked execution domains as `blocked` or `future`.
- `/health/tool-readiness` does not execute tool checks and does not write records.
- Mock API router returns backend-required for Prompt 7 blocked/future route readiness.

## Secrecy And Side Effects

- No response includes service-role keys, provider keys, Stripe keys, raw credentials, signed URL values, or private media.
- Diagnostics report zero critical findings.
- No route starts provider calls, rendering, Stripe checkout/webhooks, worker execution, job creation, media analysis, storage/upload execution beyond Prompt 4 boundaries, planning generation, approved snapshot mutation beyond Prompt 5 boundaries, or credit mutation beyond Prompt 6 fail-closed boundaries.
