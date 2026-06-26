# SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1

Use this only after `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1` completes with source-aligned migration history and DB URL secret rotation.

## Goal

Run the reviewed repository migration chain against the isolated clean staging target under an explicit confirmation gate, then validate RLS/storage/readiness evidence without unlocking beta.

## Required Gate

Execution must require an explicit confirmation variable and must use `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` only through Secret Manager. No database URL, password, token, Supabase URL, or service-role payload may be committed.

## Boundaries

Do not mutate production, do not run service-role routes, do not dispatch workers, do not create public artifacts, do not create signed URLs, do not run media/render/provider/model paths, and do not unlock internal beta, external beta, production, or final delivery.
