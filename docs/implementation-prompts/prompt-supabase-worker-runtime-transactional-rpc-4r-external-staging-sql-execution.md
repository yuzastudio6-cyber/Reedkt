# SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED-EXTERNAL-STAGING-SQL-EXECUTION

Use this prompt only after a successful `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED` run exists for `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.

## Current Source Decision

`SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED-EXTERNAL-STAGING-SQL-EXECUTION` records decision `blocked_pending_external_guarded_staging_sql_execution`.

Execution: `completed_docs_only_external_staging_sql_gate_no_sql_execution`

Current blocker: `blocked_pending_external_guarded_staging_sql_execution`

Target validation dependency: `passed_confirmed_supabase_target_rls_storage_validation`

RPC 4R confirmed closure result: `blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner`

## Required Before Future SQL

- A passing target validation report for `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED`.
- All six RPC-4R staging confirmations set to `true`.
- Backend-only credential handling with no secret payload printing.
- Migration checksum review.
- Rollback readiness.
- Readback verification plan and evidence.
- Production exclusion.

## Safety

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, or broad service-role handler was enabled. Approved Secret Manager credential aliases were resolved only into ephemeral process environment variables for the guard run.
