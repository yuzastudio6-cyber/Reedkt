# Blocker Matrix

Packet: `RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1`

| Area | Current status | Required next evidence |
| --- | --- | --- |
| Supabase target owner decision | `completed_source_derived_staging_supabase_target_owner_decision_for_guarded_validation_planning` | Carry forward only |
| Supabase read-only target validation | `completed_guarded_supabase_target_rls_storage_readonly_validation` | Carry forward only |
| Staging migration path | `completed_isolated_target_migration_chain_apply_and_readback` | carry forward isolated target migration-chain evidence |
| Worker RPC 4R | `completed_worker_runtime_transactional_rpc_isolated_target_readback` | carry forward isolated target RPC catalog/grant evidence |
| Service-role route runtime | `completed_service_role_runtime_boundary_validation` | carry forward backend-only service-role boundary validation |
| Approved snapshot persistence | `blocked_pending_separate_service_role_persistence_implementation` | guarded Supabase persistence evidence |
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

`RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-IMPLEMENTATION-1`

## SUPABASE Clean Staging Branch Migration History Reconciliation 1

`SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-RECONCILIATION-1` records decision `blocked_clean_branch_remote_only_migration_versions_require_source_mapping` and execution `completed_guarded_readonly_migration_history_reconciliation_no_mutation`.

Target: `Reeditpro` / `wmyyttnynmteqgcdishd`; clean branch `reeditpro-internal-staging-clean` / `fnjiylwirntrqdcwpbho`.

Clean branch DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / latest version `1` / `enabled`. Supabase access-token secret metadata: `SUPABASE_ACCESS_TOKEN` latest version `5` / `enabled`.

Remote Supabase command class: `supabase migration list --db-url [redacted]`. Read-only catalog SQL: `psql readonly catalog query against migration/public/storage metadata [db-url redacted]`. The reconciliation mapped remote-only migration `20260610235210` to the plugin-generated activation registry equivalent of committed migration `202606050001`; remote-only migration `20260626162800` remains unmapped.

SQL execution: `read_only_catalog_sql_only`. SQL mutation: `none`. Migration deployed: `no`. Migration history manual edit: `no`. Supabase db pull: `false`. Branch reset or recreation: `false`. Storage object creation/read: `false`. Service-role route execution: `false`. Internal beta unlocked: `false`. External beta unlocked: `false`.

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: `blocked_pending_clean_staging_migration_history_source_mapping_or_repair_decision`. WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: `blocked_pending_clean_staging_migration_history_source_mapping_or_repair_decision`. TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: `blocked_pending_worker_transactional_contract`. INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_clean_staging_migration_history_source_mapping_or_repair_decision`.

Product-ready end-to-end local OSS tools: `0`. Package-lock: `unchanged`. Generated artifacts committed: `none`.

Next recommended milestone: `SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-SOURCE-DERIVED-OWNER-DECISION-1`.

## SUPABASE Clean Staging Branch Migration History Source-Derived Owner Decision 1

`SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-SOURCE-DERIVED-OWNER-DECISION-1` records decision `approved_clean_staging_branch_replacement_path_for_source_aligned_migration_chain` and execution `completed_docs_only_source_derived_owner_decision_no_remote_execution`.

Current branch `reeditpro-internal-staging-clean` / `fnjiylwirntrqdcwpbho` remains blocked by unmapped remote-only migration `20260626162800`. The decision rejects current-branch migration repair/apply/db-pull/direct-SQL paths and approves only a future explicitly gated clean branch replacement/recreation execution packet.

Remote Supabase command class: `none_in_this_phase`. SQL execution: `none`. SQL mutation: `none`. Migration deployed: `no`. Migration history manual edit: `no`. Branch reset or recreation: `false`. Internal beta unlocked: `false`. External beta unlocked: `false`.

Product-ready end-to-end local OSS tools: `0`. Package-lock: `unchanged`. Generated artifacts committed: `none`.

Next recommended milestone: `SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-EXECUTION-1`.

`SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-EXECUTION-1` ran under explicit confirmation and stopped with `blocked_replacement_branch_migration_history_not_source_aligned`. Replacement branch candidate `reeditpro-clean-staging-v2` / `rjenorvzqsxwljvvvtxd` contains remote-only migration `20260626163138`; the DB URL secret was not rotated and internal beta remains blocked.

Next recommended milestone: `SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-HISTORY-SOURCE-MAPPING-1`.

`SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-HISTORY-SOURCE-MAPPING-1` records `blocked_replacement_remote_only_migration_20260626163138_unmapped`. The replacement branch candidate remains unadopted, DB URL secret rotation did not run, and internal beta remains blocked pending isolated clean staging target approval or explicit migration-history policy.

Next recommended milestones: `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-OWNER-DECISION-1` and `SUPABASE-CLEAN-STAGING-UNADOPTED-BRANCH-CLEANUP-1`.

`SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-OWNER-DECISION-1` records `approved_isolated_clean_staging_target_path_for_source_aligned_validation_planning`. Current and replacement clean branches remain unadopted; the next approved future path is a separately gated `new_isolated_non_production_supabase_target` creation/readback packet. Internal beta remains blocked until that target exists, proves source-aligned migration history, and later migration-chain/runtime gates pass.

Next recommended milestones: `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1` and `SUPABASE-CLEAN-STAGING-UNADOPTED-BRANCH-CLEANUP-1`.

`SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1` created `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm`, proved no remote-only migrations by read-only migration-history inspection, and rotated `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` to version `2`. Internal beta remains blocked until the isolated target migration-chain apply/readback and later runtime gates pass.

Next recommended milestone: `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1`.

`SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1` records `completed_isolated_target_migration_chain_apply_and_readback`. The isolated target migration chain is applied, required migrations `202606050001`, `202606180001`, and `20260625031135` are present, and read-only catalog/storage metadata shows no missing expected tables, RLS, private buckets, or public private buckets. Internal beta remains blocked pending worker RPC readback, service-role runtime validation, private artifact runtime gates, and end-to-end negative safety evidence.

Next recommended milestone: `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1`.

`SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1` records `completed_worker_runtime_transactional_rpc_isolated_target_readback`. The isolated target has the expected private `worker_runtime` schema, service-role-only security-definer RPC functions, and worker job/event/artifact tables with RLS and service-role DML grants. Internal beta remains blocked pending service-role runtime boundary validation, private storage/artifact runtime gates, job fixture validation, and end-to-end negative safety evidence.

Next recommended milestone: `SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1`.
