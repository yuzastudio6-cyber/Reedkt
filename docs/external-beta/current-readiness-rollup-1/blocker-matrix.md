# Blocker Matrix

Packet: `RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1`

| Area | Current status | Required next evidence |
| --- | --- | --- |
| Supabase target owner decision | `completed_source_derived_staging_supabase_target_owner_decision_for_guarded_validation_planning` | Carry forward only |
| Supabase read-only target validation | `completed_guarded_supabase_target_rls_storage_readonly_validation` | Carry forward only |
| Staging migration path | `blocked_clean_branch_remote_only_migration_versions_require_source_mapping` | source-derived owner decision for unmapped `20260626162800` before any apply retry |
| Worker RPC 4R | `blocked_pending_clean_staging_migration_history_source_mapping_or_repair_decision` | source-aligned clean branch migration history, then apply/currentness and RPC readback |
| Service-role route runtime | `blocked_pending_worker_transactional_contract` | post-RPC runtime validation |
| Approved snapshot persistence | `blocked_pending_service_role_runtime_validation` | guarded Supabase persistence evidence |
| Credit reservation ledger | `blocked_pending_service_role_runtime_validation` | guarded internal ledger mutation evidence |
| Job queue leases/events | `blocked_pending_service_role_runtime_validation` | guarded job record/lease/event validation |
| Private artifact storage/access | `blocked_pending_private_storage_runtime_validation` | private bucket/readback/access evidence |
| Remotion private preview/export | `blocked_pending_render_worker_runtime_validation` | private preview/export evidence, no public artifacts |
| Provider/model calls | `blocked_pending_provider_owner_runtime_approval` | backend-only disabled-by-default policy and explicit approval |
| External beta | `blocked` | internal beta evidence plus security/privacy/support/cost/deployment review |
| Paid production | `blocked` | separate billing/legal/support/rollback approval |
| Final delivery/export | `blocked` | separate production delivery gate |

Product-ready end-to-end local OSS tools: `0`

## Current Next Action

`SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-SOURCE-DERIVED-OWNER-DECISION-1`

## SUPABASE Clean Staging Branch Migration History Reconciliation 1

`SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-RECONCILIATION-1` records decision `blocked_clean_branch_remote_only_migration_versions_require_source_mapping` and execution `completed_guarded_readonly_migration_history_reconciliation_no_mutation`.

Target: `Reeditpro` / `wmyyttnynmteqgcdishd`; clean branch `reeditpro-internal-staging-clean` / `fnjiylwirntrqdcwpbho`.

Clean branch DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / latest version `1` / `enabled`. Supabase access-token secret metadata: `SUPABASE_ACCESS_TOKEN` latest version `5` / `enabled`.

Remote Supabase command class: `supabase migration list --db-url [redacted]`. Read-only catalog SQL: `psql readonly catalog query against migration/public/storage metadata [db-url redacted]`. The reconciliation mapped remote-only migration `20260610235210` to the plugin-generated activation registry equivalent of committed migration `202606050001`; remote-only migration `20260626162800` remains unmapped.

SQL execution: `read_only_catalog_sql_only`. SQL mutation: `none`. Migration deployed: `no`. Migration history manual edit: `no`. Supabase db pull: `false`. Branch reset or recreation: `false`. Storage object creation/read: `false`. Service-role route execution: `false`. Internal beta unlocked: `false`. External beta unlocked: `false`.

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: `blocked_pending_clean_staging_migration_history_source_mapping_or_repair_decision`. WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: `blocked_pending_clean_staging_migration_history_source_mapping_or_repair_decision`. TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: `blocked_pending_worker_transactional_contract`. INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_clean_staging_migration_history_source_mapping_or_repair_decision`.

Product-ready end-to-end local OSS tools: `0`. Package-lock: `unchanged`. Generated artifacts committed: `none`.

Next recommended milestone: `SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-SOURCE-DERIVED-OWNER-DECISION-1`.
