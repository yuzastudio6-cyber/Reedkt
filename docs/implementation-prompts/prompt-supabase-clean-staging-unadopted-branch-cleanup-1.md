# SUPABASE-CLEAN-STAGING-UNADOPTED-BRANCH-CLEANUP-1

Use this after `SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-HISTORY-SOURCE-MAPPING-1` if cleanup is desired.

## Target

Unadopted replacement branch candidate: `reeditpro-clean-staging-v2` / `rjenorvzqsxwljvvvtxd`

## Required Gate

Any cleanup packet must require an explicit confirmation variable and must verify that `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` was not rotated to this branch before deletion.

## Boundaries

Do not delete or reset any branch without explicit confirmation, do not mutate production, do not run SQL, do not apply migrations, do not access service-role routes/workers/providers/media, and do not unlock internal beta, external beta, production, or final delivery.
