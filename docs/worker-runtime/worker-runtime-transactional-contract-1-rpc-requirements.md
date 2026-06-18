# Worker Runtime Transactional Contract 1 RPC Requirements

RPC readiness: `blocked_pending_supabase_worker_rpc_schema_readiness`

These are planned-only requirements for a future Track A private E2E worker RPC/backend operation family. They are not implemented in this phase.

## Operation Family

workerJobFamily: `tracka_private_e2e_revalidation`

claimMode: `future_transactional_backend_or_rpc_only`

executionAllowedInThisPhase: false

routeExecutionAllowedNow: false

persistToDatabase: false in this phase

## Required Future Operations

| Operation | Purpose | Required transactional behavior | Status |
| --- | --- | --- | --- |
| `claim_tracka_private_e2e_job` | Claim exactly one eligible Track A private E2E job. | Validate approved snapshot, job family, idempotency key, route gate, Worker Gate 2R, active lease absence, cancellation status, and event append in one transaction. | planned_blocked |
| `heartbeat_tracka_private_e2e_job` | Renew an owned active lease. | Verify claim id, worker instance id, lease token, non-expired lease, job family, and append heartbeat event. | planned_blocked |
| `complete_tracka_private_e2e_job` | Complete a job after private manifest/checksum/QA evidence is recorded. | Verify owned active lease, artifact manifest, checksums, QA report, no public/signed/final artifacts, and append completion event. | planned_blocked |
| `fail_tracka_private_e2e_job` | Fail an owned job with auditable reason. | Verify lease ownership, retry policy, error class, backoff/cancel state, and append failure event. | planned_blocked |
| `cancel_tracka_private_e2e_job` | Cancel a pending or active job. | Verify authorized backend/user-action source, transition job and active lease safely, and append cancellation event. | planned_blocked |
| `release_expired_tracka_private_e2e_leases` | Release stale leases for retry eligibility. | Atomically mark expired leases and jobs for retry according to retry/backoff policy, and append stale lease events. | planned_blocked |
| `append_tracka_private_e2e_event` | Append a worker event without broad table mutation. | Validate event actor, job family, event type, snapshot ref, redaction policy, and append-only semantics. | planned_blocked |

## Common Inputs

- `approvedPlanSnapshotRef`
- `workerJobFamily`
- `jobId`
- `projectId`
- `workspaceId`
- `workerInstanceId`
- `leaseToken`
- `idempotencyKey`
- `toolRouteGateRef`
- `workerGateRef`
- `attemptNumber`
- `eventMetadata`

Inputs must not include secrets, provider keys, Secret Manager payloads, signed URL values, raw prompts, public artifact URLs, or unredacted private artifact payloads.

## Common Outputs

- `decision`
- `jobStatus`
- `claimStatus`
- `leaseExpiresAt`
- `attemptNumber`
- `eventId`
- `retryAfter`
- `blockedReason`
- `auditRef`

Outputs must not include private artifact payloads, signed URL values, provider/model secrets, Secret Manager payloads, or raw prompt text.

## Required Error Classes

- `TRACKA_WORKER_APPROVED_SNAPSHOT_REQUIRED`
- `TRACKA_WORKER_JOB_FAMILY_MISMATCH`
- `TRACKA_WORKER_GATE_NOT_READY`
- `TRACKA_TOOL_ROUTE_GATE_NOT_READY`
- `TRACKA_WORKER_CLAIM_CONFLICT`
- `TRACKA_WORKER_LEASE_EXPIRED`
- `TRACKA_WORKER_LEASE_OWNER_MISMATCH`
- `TRACKA_WORKER_IDEMPOTENCY_CONFLICT`
- `TRACKA_WORKER_CANCELLED`
- `TRACKA_WORKER_ARTIFACT_EVIDENCE_MISSING`
- `TRACKA_WORKER_PUBLIC_ARTIFACT_FORBIDDEN`
- `TRACKA_WORKER_SIGNED_URL_SOURCE_FORBIDDEN`

## Authorization Boundary

These operations must be callable only through a future approved backend/RPC/service-role path. They must not be callable from frontend code, raw prompt execution, broad service-role handlers, public routes, or arbitrary worker utilities.

## Decision

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1 decision: completed_contract_completion_plan_blocked_pending_rpc_schema_implementation

Worker runtime transactional contract readiness: blocked_pending_supabase_worker_rpc_schema_readiness

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
