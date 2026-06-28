# Local Harness Result

Harness type: `local_supabase_db_only`

Remote Supabase execution: `none`

Start command: `supabase start --exclude edge-runtime,gotrue,imgproxy,kong,logflare,mailpit,postgres-meta,postgrest,realtime,storage-api,studio,supavisor,vector --ignore-health-check`

Start result: `passed`

Active baseline migration status: `passed_through_latest_integration_migration`

Latest migration reached: `20260626233000`

Repaired migration reached: `202605180006_reeditpro_qa_exports_audit.sql`

Readback checks:

- `qa_reports.approved_plan_snapshot_id=1`
- `qa_reports_approved_plan_snapshot_id_fkey=1`
- `idx_qa_reports_project_snapshot=1`

QWEN draft SQL status: `not_present_in_current_integration`

QWEN local SQL tests status: `not_present_in_current_integration`

Cleanup command: `supabase stop --project-id reeditpro-rp-data-04-local-validation --no-backup`

Cleanup result: `passed`

Unrelated local Supabase project stopped: `false`

QWEN runtime executed: `false`

Worker dispatch: `false`

Provider/model calls: `false`

Next milestone: `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-DRAFT-SOURCE-SPLIT-IMPORT-1`
