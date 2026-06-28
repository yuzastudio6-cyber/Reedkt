# QWEN Runtime Persistence Baseline Split Import Source Audit

Packet: `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1`

Decision: `completed_qwen_runtime_persistence_baseline_split_import_qa_reports_approved_snapshot_guard`

Execution: `completed_source_import_qa_reports_approved_snapshot_guard_no_remote_execution`

Integration base: `9f89a608f0861e1a24953c4cad0a1329a51e3c46`

Source guard packet: `#1474`

Source QWEN stack PR: `#1465`

Source QWEN stack head: `52bee9537d8c9d9fd26a595953f4ee362a213d22`

Direct stack merge: `not_approved`

Blind cherry-pick: `not_approved`

Broad QWEN stack imported: `false`

Imported source slice: `qa_reports.approved_plan_snapshot_id compatibility guard`

Current migration source repaired: `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`

The source-derived import is intentionally narrow. It carries forward the #1465 baseline fix family that guards `public.qa_reports.approved_plan_snapshot_id` before `idx_qa_reports_project_snapshot` is created and records the no-backfill policy. It does not import unrelated planner UI surfacing, Cloud Run GPU readiness rollup changes, remote harness execution records, QWEN runtime execution, provider calls, workers, or deployment behavior.

PR `#577` remains open/draft/blocked and excluded from this source-of-truth chain.
