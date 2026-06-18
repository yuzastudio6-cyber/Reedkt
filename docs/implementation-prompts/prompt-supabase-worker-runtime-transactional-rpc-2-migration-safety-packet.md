# SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2

Migration safety packet for Track A private E2E Worker Runtime transactional RPC/schema support.

## Goal

Create the migration safety packet required after SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1. Do not create migrations, execute SQL, mutate Supabase, read Secret Manager payloads, implement RPCs, deploy schema/RLS changes, execute workers, claim jobs, create signed URLs, create public artifacts, or unlock beta/production unless a future prompt explicitly authorizes that scope.

## Required Source Evidence

- SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 decision: `completed_migration_readiness_planning_blocked_pending_migration_safety_packet`.
- Supabase update required: `future_migration_required`.
- Supabase update status: `planning_only`.
- Worker runtime transactional contract readiness: `blocked_pending_supabase_worker_rpc_migration_safety_packet`.
- SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 readiness: `ready_for_migration_safety_packet`.
- WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: `blocked_pending_supabase_rpc_schema_safety_packet`.
- WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: `blocked_pending_supabase_rpc_schema_implementation`.
- Internal beta unlocked: false.
- Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

## Required Planning Topics

- Migration safety decision for `202606180001_worker_runtime_transactional_rpc.sql` or next available timestamp.
- Whether to create new `worker_jobs`, `worker_job_events`, and `worker_job_artifacts` entities or extend existing readiness tables.
- RPC/backend safety design for `claim_tracka_private_e2e_job`, `heartbeat_tracka_private_e2e_job`, `complete_tracka_private_e2e_job`, `fail_tracka_private_e2e_job`, `cancel_tracka_private_e2e_job`, `release_expired_tracka_private_e2e_leases`, and `append_tracka_private_e2e_event`.
- RLS, grants, function schema placement, service-role-only mutation boundary, and no broad service-role handler.
- Idempotency, lease ownership, heartbeat, retry/backoff, cancellation, event log persistence, private artifact manifest, checksums, and QA report enforcement.
- Secret Manager metadata-only credential plan with no payload reads or printed values.
- Rollback/readiness plan and staging/local validation plan before any production consideration.

## Required Output

Record whether migration creation remains blocked, ready for a reviewed migration draft, or ready for a local-only migration implementation packet. Keep Worker Runtime Contract 2, Worker Gate 2R, Track A guarded execution, and internal beta blocked unless all safety prerequisites are explicitly complete.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
