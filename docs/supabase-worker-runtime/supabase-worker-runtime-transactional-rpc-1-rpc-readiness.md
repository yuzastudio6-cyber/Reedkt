# Supabase Worker Runtime Transactional RPC 1 RPC Readiness

RPC readiness: `blocked_pending_supabase_worker_rpc_migration_safety_packet`

This file defines future RPC/backend operation requirements only. No functions were created and no SQL was executed.

## Planned Operation Family

Operation family: `tracka_private_e2e_revalidation`

Execution allowed in this phase: false

Route execution allowed now: false

Persist to database: false in this phase

## Future RPC Contract Matrix

| Operation | Purpose | Inputs | Outputs | Transactional Behavior | Expected Errors |
| --- | --- | --- | --- | --- | --- |
| `claim_tracka_private_e2e_job` | Claim exactly one eligible Track A private E2E job. | worker_job_id, worker_instance_id, lease_token, idempotency_key, approved_plan_snapshot_id, job_family | claim_id, status, lease_expires_at, sanitized event id | Atomically verifies snapshot, job family, idempotency, no active lease, cancellation state, Worker Gate 2R readiness, Tool Route gate, and appends claim event. | not_found, wrong_family, already_claimed, cancelled, gate_blocked, idempotency_conflict |
| `heartbeat_tracka_private_e2e_job` | Renew an owned active lease. | worker_job_id, claim_id, worker_instance_id, lease_token, idempotency_key | status, heartbeat_at, lease_expires_at, sanitized event id | Verifies lease ownership and non-expiry, updates heartbeat/lease timestamp, and appends heartbeat event in one transaction. | lease_not_owned, lease_expired, cancelled, idempotency_conflict |
| `complete_tracka_private_e2e_job` | Complete a job after private evidence is recorded. | worker_job_id, claim_id, worker_instance_id, lease_token, artifact_manifest_ref, qa_report_ref, checksums, idempotency_key | status, completed_at, sanitized event id | Verifies active lease, private manifest, checksums, QA report, no public/signed/final artifacts, records completion, and appends completion event. | lease_not_owned, missing_manifest, missing_qa_report, public_artifact_blocked, signed_url_blocked |
| `fail_tracka_private_e2e_job` | Fail an owned job with bounded retry state. | worker_job_id, claim_id, worker_instance_id, lease_token, error_summary, retry_after, idempotency_key | status, retry_after, sanitized event id | Verifies lease ownership, records sanitized error summary, applies retry/backoff or terminal failure, and appends failure event. | lease_not_owned, invalid_retry, cancelled, idempotency_conflict |
| `cancel_tracka_private_e2e_job` | Cancel a pending or active job. | worker_job_id, actor_ref, cancel_reason, idempotency_key | status, canceled_at, sanitized event id | Verifies backend/user-action authorization, marks cancellation, releases or blocks active lease safely, and appends cancellation event. | not_authorized, already_terminal, idempotency_conflict |
| `release_expired_tracka_private_e2e_leases` | Release stale leases for retry eligibility. | job_family, now, batch_limit, idempotency_key | released_count, sanitized event ids | Atomically finds expired Track A leases, moves jobs to retry or failed state according to policy, and appends stale lease events. | invalid_family, batch_limit_exceeded |
| `append_tracka_private_e2e_event` | Append a sanitized event without broad table mutation. | worker_job_id, event_type, event_payload_sanitized, actor_type, actor_ref, idempotency_key | event_id, created_at | Validates event actor, job family, redaction policy, append-only semantics, and approved snapshot ref. | not_authorized, invalid_event_type, unsafe_payload, idempotency_conflict |

## Authorization Boundary

Each operation must be callable only through a future approved backend/RPC/service-role path. Frontend clients, raw prompts, broad service-role handlers, public routes, arbitrary worker utilities, and direct table writes must not claim, heartbeat, complete, fail, cancel, release leases, or append Track A events.

## RLS/Security Considerations

Future functions must keep service-role or security-definer behavior outside exposed/publicly callable paths where required by Supabase security review. Anonymous and authenticated clients must not directly claim jobs. Event payloads must be sanitized. Artifact refs must remain private metadata. Signed URLs and public artifacts are not source-of-truth.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
