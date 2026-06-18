# Supabase Worker Runtime Transactional RPC 1 Schema Readiness

Schema readiness: `blocked_pending_supabase_worker_rpc_migration_safety_packet`

This file documents planned-only schema requirements. It does not create tables, SQL, migrations, triggers, RLS policies, or Supabase schema changes.

## Required Future Entities

| Entity | Classification | Required Concepts |
| --- | --- | --- |
| `worker_jobs` or equivalent queue table | blocked_pending_migration | id, job_family, status, approved_plan_snapshot_id, restricted_scope_ref, idempotency_key, lease_owner, lease_expires_at, heartbeat_at, retry_count, retry_after, cancel_requested_at, canceled_at, error_summary, artifact_manifest_ref, qa_report_ref, created_at, updated_at |
| `worker_job_events` or equivalent event table | blocked_pending_migration | id, worker_job_id, event_type, event_payload_sanitized, created_at, actor_type, actor_ref |
| `worker_job_artifacts` or equivalent artifact manifest linkage | blocked_pending_migration | id, worker_job_id, artifact_type, private_artifact_ref, sha256, size_bytes, created_at |

## Required Schema Rules

- `job_family` must include `tracka_private_e2e_revalidation`.
- `approved_plan_snapshot_id` is required before future execution.
- `restricted_scope_ref` must preserve the #497/#502 Track A private E2E scope.
- `idempotency_key` must support operation replay without duplicate claims, events, artifacts, or completions.
- `lease_owner`, `lease_expires_at`, and `heartbeat_at` must support lease ownership and expiry enforcement.
- `retry_count` and `retry_after` must support bounded retry/backoff.
- `cancel_requested_at` and `canceled_at` must support safe cancellation before or during an owned lease.
- `artifact_manifest_ref`, `qa_report_ref`, and checksums must be private artifact metadata only, not signed URL or public artifact source-of-truth.
- Event payloads must be sanitized and must not store secrets, signed URL values, raw prompts, provider payloads, or private artifact payloads.

## Current Source Gap

Existing generic tables (`worker_leases`, `backend_runtime_messages`, `job_claim_attempts`, `worker_job_claims`, and `api_idempotency_keys`) are not sufficient by themselves to prove Track A-specific transactional event/lease enforcement.

## Supabase Status

Supabase update required: future_migration_required

Supabase update status: planning_only

Supabase environment touched: none

SQL executed: none

Migration deployed: no

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
