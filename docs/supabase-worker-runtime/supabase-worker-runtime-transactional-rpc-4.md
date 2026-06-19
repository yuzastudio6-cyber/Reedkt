# SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4

Status: `blocked_pending_guarded_staging_sql_confirmation`

Patch type: Supabase Worker Runtime transactional RPC/schema guarded staging SQL execution packet.

Base: `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` at #535 merge `2944cf6fabd790cbab332a48921d25c6db6e4b9c`.

Static migration source-of-truth: `supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql`

## Source-Of-Truth Decision

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 decision: blocked_pending_confirmed_staging_target_or_execution_confirmation

execution: blocked_pending_guarded_staging_sql_confirmation

Supabase update required: future_migration_required

Supabase update status: blocked_sql_not_executed

Supabase environment touched: none

SQL executed: none

Migration deployed: no

readbackStatus: not_run

Secret Manager payload printed: false

production touched: false

Target safety status: blocked_pending_confirmed_staging_target

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-IF-NEEDED readiness: ready_for_guarded_staging_confirmation_rerun

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: blocked_pending_guarded_staging_sql_execution

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_guarded_staging_sql_execution

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract

INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract

Internal beta unlocked: false

trackAInternalBetaUnlocked: false

## Decision Reason

RPC-4 is the first packet where guarded staging SQL could be considered, but the current execution environment does not contain the required staging confirmation gates. The correct result is fail-closed: no Supabase target is touched, the RPC-3 static migration remains source-only, and future execution requires a separate confirmed staging rerun.

The worker-runtime blocker remains: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

## Required Confirmation Gates

All gates are documented only and are unset in this packet:

- `REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_RPC_MIGRATION=true`
- `REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL=true`
- `REEDITPRO_CONFIRM_WORKER_RUNTIME_TRANSACTIONAL_RPC_SCOPE=true`
- `REEDITPRO_CONFIRM_SUPABASE_TARGET_IS_STAGING=true`
- `REEDITPRO_CONFIRM_NO_PRODUCTION_SUPABASE=true`
- `REEDITPRO_CONFIRM_SECRET_MANAGER_BACKEND_CREDENTIAL_RESOLUTION=true`

If any gate is absent, false, untrusted, or not paired with a confirmed staging-only Supabase target, the only allowed result is `blocked_pending_guarded_staging_sql_confirmation`.

## Supabase Classification

Supabase update required: future_migration_required

Supabase update status: blocked_sql_not_executed

Supabase environment touched: none

SQL executed: none

Migration deployed: no

Next Supabase action: SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-IF-NEEDED -- Guarded staging confirmation rerun

## Static Migration Coverage

The unexecuted RPC-3 migration remains the only migration source for this path:

- `public.worker_jobs`
- `public.worker_job_events`
- `public.worker_job_artifacts`
- private `worker_runtime` RPC functions
- `claim_tracka_private_e2e_job`
- `heartbeat_tracka_private_e2e_job`
- `complete_tracka_private_e2e_job`
- `fail_tracka_private_e2e_job`
- `cancel_tracka_private_e2e_job`
- `release_expired_tracka_private_e2e_leases`
- `append_tracka_private_e2e_event`

RPC-4 does not change, execute, deploy, or verify that migration against any Supabase environment.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
