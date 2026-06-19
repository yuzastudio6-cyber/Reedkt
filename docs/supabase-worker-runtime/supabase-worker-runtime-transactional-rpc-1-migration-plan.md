# Supabase Worker Runtime Transactional RPC 1 Migration Plan

Migration plan status: `planning_only`

This is not a migration. It does not create SQL and must not be copied into `supabase/migrations/` without a future approved milestone.

## Proposed Future Migration

Proposed migration name: `202606180001_worker_runtime_transactional_rpc.sql`

If that timestamp collides, use the next available timestamp after a future migration-safety packet explicitly authorizes migration creation.

## Future Migration Safety Requirements

- Review by Supabase and Worker Runtime owners.
- Explicit authorization before creating a migration file.
- Explicit authorization before any SQL execution.
- Staging/local validation before promotion.
- No production migration in RPC-1.
- No schema reset.
- No unrelated table changes.
- Rollback/readiness considerations for queue state, leases, events, artifacts, idempotency, and approved snapshots.
- No provider secrets, service-role keys, JWTs, signed URL values, public artifact URLs, or raw prompt payloads stored in database rows.
- RLS, grants, RPC schema placement, and service-role boundary reviewed before apply.

## Required Future Scope

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 must decide whether the future migration implements new `worker_jobs`, `worker_job_events`, and `worker_job_artifacts` tables or safely extends existing generic readiness tables. It must also decide whether the Track A operation family is implemented as Postgres RPC functions, backend-only service methods backed by transactions, or a reviewed hybrid.

## Blocked Status

Supabase update required: future_migration_required

Supabase update status: planning_only

SQL executed: none

Migration deployed: no

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 readiness: ready_for_migration_safety_packet

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
