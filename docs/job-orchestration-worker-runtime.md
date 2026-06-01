# Job Orchestration Worker Runtime

Prompt 8 adds a limited job/worker route and service foundation. It does not enable production job execution, worker execution, Cloud Run, providers, rendering, tools, media analysis, storage execution, credit mutation, migrations, deployment, or remote Supabase execution.

## Current Implementation Found

- Prompt 7 made `server/routes/job-routes.ts` and `server/routes/worker-routes.ts` fail closed with backend-required responses.
- Pre-Prompt 8 `server/services/job-service.ts` could insert `job_batches` and `jobs` when an admin client was available, and could return mock queue success when it was not.
- Pre-Prompt 8 `server/services/worker-claim-service.ts` could insert/update `worker_job_claims`, record `tool_runtime_checks`, and keep mock active claims.
- `server/middleware/idempotency.ts` already validates an `Idempotency-Key` header and may record `api_idempotency_keys`.

Prompt 8 replaces unsafe job/worker writes with backend-required boundary results and keeps idempotency middleware as the only allowed runtime write concept from this milestone.

## Canonical Tables And Compatibility Decision

Prompt 8 targets the operational compatibility family:

- `job_batches`
- `jobs`
- `job_dependencies`
- `job_events`
- `worker_leases`
- `worker_job_claims`
- `job_claim_attempts`
- `backend_runtime_messages`
- `api_idempotency_keys`

This is intentional because active worker lease and worker claim migrations reference `jobs`. The alternate RP-DATA job-era tables `editing_jobs`, `job_steps`, and `worker_events` remain unresolved compatibility/cleanup targets. Prompt 8 must not write them until a later schema cleanup prompt resolves the split.

## Layer Responsibilities

- Frontend: may request status/readiness and show blockers; must not call workers directly.
- Backend API: validates auth, workspace/project access, idempotency, route input, and returns boundary/readiness results.
- Supabase: remains the future source of truth for job, dependency, event, claim, lease, idempotency, and audit records.
- Workers: future only; must claim jobs before execution and execute approved snapshots, not raw chat.

## Required Dependencies

Every future executable job requires:

- `AuthGate`
- `WorkspaceGate`
- `ProjectAccessGate`
- `ApprovedSnapshotGate`
- `CreditEstimateApprovalGate`
- `CreditReservationGate`
- `JobIdempotencyGate`
- `JobDependencyGate`
- `WorkerClaimGate`
- `WorkerLeaseGate`

Prompt 8 can validate and report these gates but does not create executable work.

## Lifecycles

- Job batch lifecycle: readiness -> backend-required creation boundary -> future transactional insert -> progress events -> terminal status.
- Job lifecycle: readiness -> queued boundary -> dependency gating -> worker claim -> heartbeat -> completion/failure/cancellation.
- Dependency lifecycle: proposed edge -> backend-required create boundary -> future append-style dependency record -> downstream readiness checks.
- Job event lifecycle: sanitized append intent -> backend-required append boundary -> future append-only event row.
- Worker claim lifecycle: readiness -> backend-required claim boundary -> future single active claim enforced transactionally.
- Lease lifecycle: claim -> heartbeat/renew -> release/complete/fail/cancel -> stale recovery.
- Idempotency lifecycle: mutation route requires header -> middleware checks or records `api_idempotency_keys` -> route returns backend-required boundary response.

## Fail-Closed Behavior

Mutation routes return `status: backend_required` inside a safe response body until a future reviewed transactional service exists. Prompt 8 does not:

- create job batches, jobs, dependencies, events, claims, or leases;
- run workers;
- dispatch Cloud Run, Pub/Sub, or Cloud Tasks;
- call providers;
- render media;
- execute tools;
- run media analysis;
- mutate credits;
- upload/download storage.

## Validation Results

See `docs/prompt-08-validation-results.md`.

## What Remains Blocked

Production job execution, worker execution, transactional claim/lease mutation, local/staging RLS validation, stale recovery execution, retry execution, provider/render/tool/media worker execution, and operational monitoring remain blocked.
