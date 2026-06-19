# Supabase Worker Runtime Transactional RPC 2 Proposed RPC Contract

RPC contract status: `planned_only_static_migration_ready`

This file defines planned-only RPC/backend behavior. No functions were created, no SQL was executed, and no route, worker, tool, provider, or model was run.

## Operation Family

Operation family: `tracka_private_e2e_revalidation`

Execution allowed in this phase: false

Route execution allowed now: false

Persist to database: false in this phase

## Future RPC Contract Matrix

| Operation | Purpose | Required Behavior |
| --- | --- | --- |
| `claim_tracka_private_e2e_job` | Claim exactly one eligible Track A private E2E job. | Inputs include worker/job identity, lease token, idempotency key, approved snapshot, and job family. Output returns claim id, status, lease expiry, and event id. Must use transactional single-claim behavior such as `FOR UPDATE SKIP LOCKED`, verify scope, assign lease owner, persist claim event, and reject wrong family, existing lease, cancellation, gate block, or idempotency conflict. |
| `heartbeat_tracka_private_e2e_job` | Renew an owned active lease. | Verifies claim id, worker identity, lease token, non-expiry, and idempotency key before updating heartbeat and appending sanitized event. |
| `complete_tracka_private_e2e_job` | Complete a job after private evidence is recorded. | Requires active lease, private manifest, checksums, QA report, approved scope, and idempotency key. Must reject missing evidence, public artifact, signed URL source-of-truth, final delivery, or lease mismatch. |
| `fail_tracka_private_e2e_job` | Fail an owned job with bounded retry state. | Requires lease ownership and sanitized error summary, applies retry/backoff or terminal failure, and persists failure event. |
| `cancel_tracka_private_e2e_job` | Cancel a pending or active job. | Requires authorized backend/user-action actor, sets cancellation state, releases or blocks active lease safely, and appends cancellation event. |
| `release_expired_tracka_private_e2e_leases` | Release stale leases for retry eligibility. | Requires job family, batch limit, now timestamp, and idempotency key; atomically finds expired leases, transitions retry or terminal state, and appends stale lease events. |
| `append_tracka_private_e2e_event` | Append sanitized events without broad table mutation. | Requires valid worker job, actor, event type, sanitized payload, and idempotency key; must be append-only and reject unsafe payloads. |

## Authorization Boundary

The RPCs must be callable only through a future approved backend-only Google Secret Manager credential resolution path. Frontend clients, raw prompts, browser code, broad service-role handlers, arbitrary worker utilities, public routes, and direct table writes must not claim, heartbeat, complete, fail, cancel, release leases, or append Track A events.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
