# Migration History Sync

Packet: `RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1`

## Pre-Apply Remote History

The main Reeditpro staging target had these applied versions before the sync:

- `202605130001`
- `202605130002`
- `202605130003`
- `202605130004`
- `202605130005`
- `202605130006`
- `20260626163138`

The target also contained live staging rows:

- `workspaces`: `11`
- `projects`: `11`
- `edit_sessions`: `11`
- `edit_briefs`: `11`
- `edit_cues`: `11`
- `api_idempotency_keys`: `11`

Because the target had live rows and a remote-only migration, the repair path preserved the remote-only migration in source instead of marking it reverted.

## Source Mapping

Added source mapping:

- `supabase/migrations/20260626163138_public_production_edit_session_brief_qwen_gates.sql`

This maps the main target remote-only version `20260626163138` to committed repository source.

## Applied Pending Repo Migrations

The guarded main-target migration sync applied:

- `202605130007_generation_providers_generated_assets.sql`
- `202605130008_render_preview_export_revision_qa.sql`
- `202605180001_reeditpro_core_workspace_projects.sql`
- `202605180002_reeditpro_media_source_sequence.sql`
- `202605180003_reeditpro_intent_plan_versions.sql`
- `202605180004_reeditpro_credits_approval_snapshots.sql`
- `202605180005_reeditpro_generation_assets_jobs.sql`
- `202605180006_reeditpro_qa_exports_audit.sql`
- `202605180007_reeditpro_rls_policies.sql`
- `202605180008_reeditpro_storage_buckets_policies.sql`
- `202605190001_sfx_director_tables.sql`
- `202605190002_storytiming_master_tables.sql`
- `202605200001_storage_upload_pipeline_readiness.sql`
- `202605200002_worker_leases_runtime_transport.sql`
- `202605210001_e2e_runtime_readiness_tables.sql`
- `202606050001_activation_milestone_registry_schema_rls.sql`
- `202606180001_worker_runtime_transactional_rpc.sql`
- `20260625031135_rp_data_03_internal_beta_static_gap_contract.sql`

## Lint Fix Migration

Supabase schema lint then reported one function issue:

- `worker_runtime.fail_tracka_private_e2e_job`: ambiguous `retry_count` reference.

The follow-up migration fixes only that function body:

- `supabase/migrations/20260626224600_worker_runtime_fail_retry_count_lint_fix.sql`

## Final Remote History

Final `supabase migration list --db-url [redacted]` shows local and remote aligned through:

- `20260626224600`

Final `supabase db push --dry-run --db-url [redacted]` result:

- `Remote database is up to date.`

Final `supabase db lint --db-url [redacted]` result:

- `No schema errors found`
