# External Beta Staging Migration History Source Alignment Result

Decision: `completed_staging_remote_only_migration_history_source_alignment`

Execution: `completed_source_alignment_import_no_remote_migration_apply`

Remote-only source alignment:

| Version | Name | Local source file | Remote statement MD5 | Local file SHA-256 |
| --- | --- | --- | --- | --- |
| `202606270001` | `tool_cost_metering_events` | `supabase/migrations/202606270001_tool_cost_metering_events.sql` | `71e9214a04a1726aafae6aea3a9f4a1b` | `6653396cf311412bd402cc3ca78a00d56d96538cff899396a2745d672b79786d` |
| `202606270002` | `beta_readiness_evidence_packets` | `supabase/migrations/202606270002_beta_readiness_evidence_packets.sql` | `9d83b4b38dfe2b15521c59474c6fba7c` | `eeff596176d8a4e2c6a83be91953a0e379e290e82e11c32d871172517ccc9c6d` |
| `202606270003` | `tool_cost_wallet_settlement_rpc` | `supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql` | `47998b2f5e92887527f4800973fc6803` | `123cf0f71e47041598f68f1d90b04d8b82573ab7fcf15c0a6e82611528201e1a` |

Post-alignment dry-run:

`supabase db push --db-url [redacted] --dry-run` reports only:

- `20260628000100_qwen2_5_vl_backend_runtime_persistence.sql`

Next milestone: `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-APPLY-1`
