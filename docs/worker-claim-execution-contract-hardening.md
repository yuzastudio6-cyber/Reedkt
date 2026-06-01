# Worker Claim Execution Contract Hardening

## Current Implementation Found

Prompt 8 already has fail-closed worker claim, lease, heartbeat, complete, fail, stale recovery, and runtime registry boundaries in `server/routes/worker-routes.ts` and `server/services/worker-claim-service.ts`. Those routes validate auth and idempotency for mutations, return `backend_required` for transactional mutation, and do not write job or worker runtime records.

Prompt 13 adds static tool readiness and worker runtime requirement metadata in `server/foundation/tool-readiness/`. Every tool remains runtime-disabled.

Prompt 14 adds an explicit worker execution envelope and preflight contract on top of those foundations. It does not enable worker execution.

## Canonical Concepts Used

- `projects`, `workspaces`, `workspace_members`
- `approved_plan_snapshots`
- `credit_estimates`, `credit_reservations`
- `media_assets`, `storage_object_records`
- `qa_reports`, render/export blockers as readiness references
- `jobs`, `job_batches`, `job_dependencies`, `job_events`
- `worker_leases`, `worker_job_claims`, `worker_runtime_configs`, `worker_heartbeats`, `job_claim_attempts`, `backend_runtime_messages`
- `api_idempotency_keys`
- `tool_runtime_checks` and `tool_call_intents` as readiness references only

Legacy/draft worker-era concepts such as `editing_jobs`, `job_steps`, and `worker_events` remain noncanonical for Prompt 14 writes.

## Responsibilities

Frontend may request worker contract status through backend routes, but must not call worker runners, pass service-role data, provide signed URLs as source of truth, or treat a contract preview as execution.

Backend API validates auth, workspace/project access, idempotency, safe metadata, canonical IDs, and returns worker envelope/preflight blockers. It must fail closed when transactional worker runtime is unavailable.

Supabase remains the future source of truth for canonical job, claim, lease, heartbeat, idempotency, and event records. Prompt 14 does not apply migrations or execute SQL.

Worker runtime remains future-only. Workers must eventually execute approved snapshots with credit reservations, canonical storage records, tool readiness, and active claims. Prompt 14 sets the contract only.

## Dependency Boundaries

- Approved snapshot dependency: workers must reference immutable `approved_plan_snapshots`, not raw chat.
- Credit dependency: paid execution must reference approved estimates and active reservations.
- Media/storage dependency: worker inputs must reference canonical record IDs and bucket/path records only.
- QA/render/export dependency: blocking QA, render, export, or revision state must prevent downstream execution.
- Tool readiness dependency: Prompt 13 static registry keeps all tools `allowedInRuntime=false`.
- Idempotency dependency: every mutation or request-style boundary requires an idempotency key.

## Lifecycles

Worker execution envelope: validate identity, gate references, idempotency, input record IDs, tool readiness, expected outputs, completion/failure semantics, and integrity metadata. `canExecute` remains false.

Worker claim lifecycle: preflight may report blockers; actual claim creation remains backend-required until transactional claim/lease code exists.

Lease lifecycle: renew, release, complete, fail, cancel, and stale recovery remain boundary responses only.

Heartbeat lifecycle: heartbeat route records no heartbeat in Prompt 14; future workers must prove active claim and lease before writing heartbeat state.

Retry lifecycle: retry budget and attempt numbers are validated and carried in the envelope; retry scheduling is not performed.

## Fail-Closed Behavior

Prompt 14 routes return `backend_required` or blocked contract results when project access, approved snapshot, credit reservation, worker runtime, tool runtime, or claim/lease state cannot be verified. Missing runtime never falls back to mock success.

## Validation Results

See `docs/prompt-14-validation-results.md`.

## Remains Blocked

Real worker execution, production job claims, Cloud Run/Pub/Sub/Cloud Tasks dispatch, provider calls, render/export execution, tool execution, media processing, browser capture, credit mutation, storage transfer, remote Supabase, migrations, deployment, production/beta unlocks, and broad service-role handlers remain blocked.
