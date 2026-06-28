# QWEN Runtime Persistence Baseline Guard

Guarded table: `public.qa_reports`

Compatibility column: `public.qa_reports.approved_plan_snapshot_id`

Constraint guarded: `qa_reports_approved_plan_snapshot_id_fkey`

Index unblocked: `idx_qa_reports_project_snapshot`

Backfill policy: `no_backfill_because_migration_must_not_invent_qa_reports_approved_snapshots_generated_assets_jobs_workers_provider_outputs_credit_records_or_qwen_runtime_records`

The split import preserves the approved-plan contract: QA output must be able to tie back to immutable approved plan snapshots, but this packet does not create QA reports, approved snapshots, jobs, generated assets, worker events, provider rows, credit rows, or QWEN runtime records.

Supabase Data API note: Supabase's 2026 changelog records that new public tables may require explicit grants before the Data/GraphQL APIs can access them. This packet does not create new public tables or remote grants. Future live schema validation must review explicit grants and RLS together rather than assuming table creation alone exposes API access.
