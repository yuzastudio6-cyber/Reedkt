# SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1

Use this only after `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1` records `completed_isolated_target_migration_chain_apply_and_readback`.

## Goal

Run guarded readback/validation for the worker runtime transactional RPC surfaces on the isolated clean staging target. Confirm the RPC definitions, grants, RLS posture, and required table/storage metadata without dispatching workers, executing service-role routes, creating storage objects, or unlocking beta.

## Required Gate

Execution must require an explicit confirmation variable and must use `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` only through Secret Manager. No database URL, password, token, Supabase URL, service-role payload, or signed URL may be committed.

## Boundaries

Do not mutate production, do not run service-role routes, do not dispatch workers, do not process media, do not create public artifacts, do not create signed URLs, do not run provider/model/render paths, and do not unlock internal beta, external beta, production, or final delivery.
