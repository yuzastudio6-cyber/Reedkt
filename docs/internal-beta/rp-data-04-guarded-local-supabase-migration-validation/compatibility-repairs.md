# RP-DATA-04 Compatibility Repairs

The local migration reset exposed historical drift between the 20260513 schema generation and the later 20260518 internal-beta schema generation. Repairs are additive or metadata-only and are scoped to making the existing migration chain locally resettable.

## Repairs

- `202605130007_generation_providers_generated_assets.sql`: qualified seed columns in generation provider model/capability inserts so provider-table columns do not collide with seed aliases.
- `202605180001_reeditpro_core_workspace_projects.sql`: added nullable compatibility columns `workspaces.owner_id`, `projects.owner_id`, `projects.current_edit_session_id`, and `chat_messages.edit_session_id` when the older tables already exist.
- `202605180002_reeditpro_media_source_sequence.sql`: added `media_assets.status`, `media_assets.size_bytes`, and `media_assets.metadata_json` when the older media table already exists.
- `202605180003_reeditpro_intent_plan_versions.sql`: added `edit_plan_segments.edit_plan_version_id` when the older segment table already exists.
- `202605180004_reeditpro_credits_approval_snapshots.sql`: added approved-plan-snapshot and edit-plan-version compatibility columns to older credit tables.
- `202605180005_reeditpro_generation_assets_jobs.sql`: added `generation_requests.approved_plan_snapshot_id` and `generated_asset_versions.version`.
- `202605180006_reeditpro_qa_exports_audit.sql`: renamed the unquoted reserved `check` column to `check_name` in the new QA check-results table and added approved-plan-snapshot compatibility columns.
- `202605180007_reeditpro_rls_policies.sql`: aligned workspace helper parameter names with earlier migration signatures.
- `202605180008_reeditpro_storage_buckets_policies.sql` and `202605200001_storage_upload_pipeline_readiness.sql`: converted `COMMENT ON` statements for Supabase-owned storage tables/policies to plain SQL comments to avoid ownership failures.
- `20260625031135_rp_data_03_internal_beta_static_gap_contract.sql`: tightened artifact table grants so `authenticated` has only `SELECT`.

No migration was applied to a remote project. The compatibility repairs were validated only against the local Supabase database on isolated RP-DATA-04 ports.
