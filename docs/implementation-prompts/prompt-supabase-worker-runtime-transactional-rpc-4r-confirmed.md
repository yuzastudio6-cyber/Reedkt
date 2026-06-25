# SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED

Use this prompt only after `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED` has produced a successful read-only target/RLS/storage validation report for `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.

## Required Inputs

- `REEDITPRO_SUPABASE_TARGET_RLS_STORAGE_VALIDATION_REPORT=<local successful report path>`
- `REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_RPC_MIGRATION=true`
- `REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL=true`
- `REEDITPRO_CONFIRM_WORKER_RUNTIME_TRANSACTIONAL_RPC_SCOPE=true`
- `REEDITPRO_CONFIRM_SUPABASE_TARGET_IS_STAGING=true`
- `REEDITPRO_CONFIRM_NO_PRODUCTION_SUPABASE=true`
- `REEDITPRO_CONFIRM_SECRET_MANAGER_BACKEND_CREDENTIAL_RESOLUTION=true`

## Current Source Packet

`SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED` records decision `completed_rpc_4r_confirmed_runner_fail_closed_without_sql_execution` and execution `completed_guard_scaffold_no_remote_execution`.

Current runner result: `blocked_pending_rpc_4r_confirmed_staging_sql_gates`

Target validation dependency: `blocked_pending_confirmed_supabase_target_rls_storage_validation`

## Future Execution Boundary

The checked-in runner is a fail-closed prerequisite gate and sanitized evidence writer. It does not apply SQL in this Codex session.

If all target validation and confirmation gates pass, the next packet must use a separately approved guarded staging SQL execution environment and record:

- target identity and staging classification;
- migration checksum for `supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql`;
- SQL execution result;
- readback status;
- rollback readiness;
- production exclusion;
- no secret payload printing;
- no service-role route execution;
- no internal beta unlock.

## Safety

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, or broad service-role handler was enabled.
