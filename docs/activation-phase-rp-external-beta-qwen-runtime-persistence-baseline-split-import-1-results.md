# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1 Results

Decision: `completed_qwen_runtime_persistence_baseline_split_import_qa_reports_approved_snapshot_guard`

Execution: `completed_source_import_qa_reports_approved_snapshot_guard_no_remote_execution`

Integration base: `9f89a608f0861e1a24953c4cad0a1329a51e3c46`

Source QWEN PR: `#1465`

Source QWEN head: `52bee9537d8c9d9fd26a595953f4ee362a213d22`

Repaired migration: `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`

Compatibility column: `public.qa_reports.approved_plan_snapshot_id`

Constraint guarded: `qa_reports_approved_plan_snapshot_id_fkey`

Index unblocked: `idx_qa_reports_project_snapshot`

Backfill policy: `no_backfill_because_migration_must_not_invent_qa_reports_approved_snapshots_generated_assets_jobs_workers_provider_outputs_credit_records_or_qwen_runtime_records`

Direct stack merge: `not_approved`

Blind cherry-pick: `not_approved`

Broad QWEN stack imported: `false`

Next milestone: `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-11`

Product-ready end-to-end local OSS tools: `0`

Validation: `passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`

No Supabase remote execution, SQL execution, migration apply, Supabase CLI execution, Secret Manager payload access, provider call, model call, QWEN runtime execution, worker execution, worker dispatch, route execution, Cloud Run invocation, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, additional tester access grant, broad external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled.
