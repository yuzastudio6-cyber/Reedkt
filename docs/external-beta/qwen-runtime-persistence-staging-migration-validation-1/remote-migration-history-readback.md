# QWEN Runtime Persistence Staging Remote Migration History Readback

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Readback mode: `supabase_migration_list_plus_read_only_schema_migrations_sql`

Remote mutation: `false`

QWEN migration apply: `not_run`

Remote migration history status: `blocked_remote_only_versions_present`

Local pending QWEN migration:

- `20260628000100_qwen2_5_vl_backend_runtime_persistence.sql`

Remote-only versions blocking `supabase db push --dry-run`:

| Version | Remote name | Statement count | Statement MD5 |
| --- | --- | ---: | --- |
| `202606270001` | `tool_cost_metering_events` | `12` | `71e9214a04a1726aafae6aea3a9f4a1b` |
| `202606270002` | `beta_readiness_evidence_packets` | `9` | `9d83b4b38dfe2b15521c59474c6fba7c` |
| `202606270003` | `tool_cost_wallet_settlement_rpc` | `10` | `47998b2f5e92887527f4800973fc6803` |

CLI dry-run result:

`Remote migration versions not found in local migrations directory.`

Required repair before QWEN staging apply:

`RP-EXTERNAL-BETA-STAGING-MIGRATION-HISTORY-SOURCE-ALIGNMENT-1`

The repair must source-align the three remote-only migration versions without guessing, broadening migration scope, or applying QWEN on top of uncommitted staging history.
