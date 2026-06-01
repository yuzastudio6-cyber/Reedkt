# Prompt 8 - Job Orchestration, Worker Claims, Leases, And Idempotency

## Small Context

Prompts 0-7 consolidated source of truth, froze architecture, reviewed schema, implemented narrow auth/storage/snapshot/credit foundations, and hardened the backend API route surface. Prompt 8 creates the bounded job/worker/idempotency foundation required before future media, provider, render, tool, and worker execution prompts.

## Allowed Scope

- Job readiness checks.
- Job batch/job creation boundaries.
- Job dependency and event boundaries.
- Worker claim, lease, heartbeat, release, complete, fail, and stale recovery boundaries.
- Idempotency validation and conflict reporting through existing middleware/service contracts.
- Route contracts, diagnostics, docs, and draft SQL/RLS tests.

## Forbidden Scope

- Real worker execution.
- Cloud Run, Pub/Sub, Cloud Tasks, or production queue execution.
- Provider calls.
- Rendering/export.
- Tool execution.
- Media analysis/transcript/probe execution.
- Credit mutation beyond Prompt 6 fail-closed boundaries.
- Storage upload/download execution beyond Prompt 4 boundaries.
- Approved snapshot mutation beyond Prompt 5 boundaries.
- Stripe checkout/webhooks/payment processing.
- Schema-changing migrations.
- Remote/staging Supabase execution.
- Deployment.
- Broad service-role handlers.

## Canonical Concepts/Tables

Prompt 8 uses `job_batches`, `jobs`, `job_dependencies`, `job_events`, `worker_leases`, `worker_job_claims`, `job_claim_attempts`, `backend_runtime_messages`, and `api_idempotency_keys` as the operational compatibility target. `editing_jobs`, `job_steps`, and `worker_events` remain unresolved alternate job-era tables and must not be targeted for writes.

## Deliverables

- `docs/job-orchestration-worker-runtime.md`
- `docs/job-orchestration-route-contract.md`
- `docs/job-worker-gate-contract.md`
- `docs/prompt-08-validation-results.md`
- `database/test-sql/010_job_worker_lease_idempotency_rls_smoke_tests.draft.sql`
- `scripts/validation/job-worker-scope-diagnostics.mjs`
- Hardened job/worker services, schemas, routes, and API metadata.
- Updated source-of-truth tracking.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-07-backend-api-runtime-route-hardening...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent schema:static-audit`
- `npm run --silent auth:rls:diagnostics`
- `npm run --silent storage:scope:diagnostics`
- `npm run --silent snapshot:scope:diagnostics`
- `npm run --silent credit:scope:diagnostics`
- `npm run --silent backend:api:diagnostics`
- `npm run --silent job:worker:diagnostics`
- `npm run foundation:validate`
- `npm run foundation:validate:with-build`

## GitHub Requirement

Create branch `codex/rp-foundation-08-job-orchestration-worker-claims-idempotency`, push it, and open a PR titled `[foundation] Prompt 8 job orchestration worker claims idempotency` against `codex/rp-foundation-07-backend-api-runtime-route-hardening`. Do not merge.

## Acceptance Criteria

- Job/worker lifecycle is documented and represented by route/service boundaries.
- Job/worker route contracts and gate contracts exist.
- Mutation routes require idempotency and fail closed without transactional runtime.
- Job/worker diagnostics exist and pass.
- SQL/RLS draft test exists and remains honest about execution status.
- No real worker execution or downstream provider/render/tool/media execution is enabled.
- Prompt 8 is tracked in implementation prompts.
