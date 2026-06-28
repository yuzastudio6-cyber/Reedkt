# QWEN Runtime Persistence Staging Migration Validation Results

Validation status: `blocked_remote_staging_migration_history_requires_source_alignment_before_qwen_apply`

Commands:

- `curl -fsSL https://supabase.com/changelog.md`: `passed`
- `supabase --version`: `passed_2.105.0`
- `supabase migration list --db-url [redacted]`: `passed`
- `supabase db push --db-url [redacted] --dry-run`: `blocked_remote_only_versions_present`
- `psql [redacted] -c "select version, name, array_length(statements, 1), md5(...)"`: `passed_read_only`

Skipped:

- `supabase db push --db-url [redacted]`: `skipped_remote_only_history_blocker`
- `psql [redacted] -f database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`: `skipped_qwen_migration_not_applied`

Remote-only blocker:

- `202606270001` / `tool_cost_metering_events`
- `202606270002` / `beta_readiness_evidence_packets`
- `202606270003` / `tool_cost_wallet_settlement_rpc`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Remote Supabase mutation: `false`

Remote migration apply: `false`

QWEN runtime execution: `false`

Next milestone: `RP-EXTERNAL-BETA-STAGING-MIGRATION-HISTORY-SOURCE-ALIGNMENT-1`
