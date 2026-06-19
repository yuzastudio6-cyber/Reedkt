# Supabase Worker Runtime Transactional RPC 3 RPC Contract

RPC schema: `worker_runtime`

Operation family: `tracka_private_e2e_revalidation`

Execution status in RPC-3: static migration created, SQL not executed.

## RPC Functions

- `claim_tracka_private_e2e_job`: service-role-only transactional claim path using `FOR UPDATE SKIP LOCKED`, idempotency key checks, lease ownership, approved scope checks, retry eligibility, and event persistence.
- `heartbeat_tracka_private_e2e_job`: service-role-only lease ownership check, heartbeat update, lease extension, and event persistence.
- `complete_tracka_private_e2e_job`: service-role-only completion path requiring private artifact manifest and QA report refs.
- `fail_tracka_private_e2e_job`: service-role-only failure path with sanitized error summary, retry fields, lease release, and event persistence.
- `cancel_tracka_private_e2e_job`: service-role-only cancellation path with sanitized reason and event persistence.
- `release_expired_tracka_private_e2e_leases`: service-role-only stale lease release using bounded batch behavior.
- `append_tracka_private_e2e_event`: service-role-only sanitized event append helper for the operation family.

## Required Guards

- `execution_allowed` must be true before a queued job can be claimed by the future runtime.
- `approved_plan_snapshot_ref` and `restricted_scope_ref` must be present.
- Public artifacts, signed URL source-of-truth, final delivery, and internal beta unlock flags must remain false.
- Event payloads must be sanitized JSON objects.
- Function execution is revoked from public, anon, and authenticated roles.

## Future Handoff

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 remains blocked pending guarded staging SQL execution and deployed schema/RPC evidence. Worker Runtime Gate 2R remains blocked pending Supabase RPC/schema deployment and subsequent Worker Runtime validation.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
