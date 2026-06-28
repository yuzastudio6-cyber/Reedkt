# QWEN Runtime Persistence Staging Migration Apply Validation Results

Validation status: `passed`

Commands:

- `supabase db push --db-url [redacted] --dry-run`: `passed_only_qwen_pending`
- `supabase db push --db-url [redacted] --yes`: `passed_single_qwen_migration_apply`
- `supabase migration list --db-url [redacted]`: `passed_qwen_remote_present`
- `psql [redacted] -v ON_ERROR_STOP=1 -f database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`: `passed`
- `supabase db push --db-url [redacted] --dry-run`: `passed_remote_database_is_up_to_date`

Remote mutation: `true`

Remote mutation scope: `single_staging_migration_apply_only`

QWEN runtime execution: `false`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Next milestone: `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-RLS-STORAGE-READBACK-1`
