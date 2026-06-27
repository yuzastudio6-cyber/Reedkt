# Blocker Matrix

Packet: `RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1`

| Area | Current status | Required next evidence |
| --- | --- | --- |
| Supabase target owner decision | `completed_source_derived_staging_supabase_target_owner_decision_for_guarded_validation_planning` | Carry forward only |
| Supabase read-only target validation | `completed_guarded_supabase_target_rls_storage_readonly_validation` | Carry forward only |
| Main Reeditpro staging migration history | `completed_reeditpro_main_supabase_target_migration_history_sync` | carry forward main target migration-history sync evidence |
| Main Reeditpro staging lint/advisor | `passed_no_schema_errors_found_and_confirmed_readonly_target_validation` | carry forward final dry-run/lint/target validation |
| Main Reeditpro public grant boundary | `completed_main_supabase_service_role_runtime_grant_boundary_validation` | carry forward public mutation grant hardening evidence |
| Historical isolated target | `historical_sandbox_evidence_only_not_active` | do not use as active target |
| Worker RPC 4R | `main_target_schema_present_pending_runtime_validation` | guarded main-target service-role/runtime readback |
| Service-role route runtime | `not_run_pending_route_specific_guarded_write_validation` | guarded backend-only service-role route write/readback validation |
| Approved snapshot persistence | `completed_approved_snapshot_persistence_guarded_remote_write_readback` | carry forward transaction-rolled-back remote write/readback evidence |
| Credit reservation ledger | `completed_credit_reservation_ledger_guarded_remote_write_readback` | carry forward transaction-rolled-back credit reservation/ledger readback evidence |
| Job queue leases/events | `ready_for_guarded_remote_write_readback_validation` | guarded job record/lease/event validation |
| Private artifact storage/access | `blocked_pending_private_storage_runtime_validation` | private bucket/readback/access evidence |
| Remotion private preview/export | `blocked_pending_render_worker_runtime_validation` | private preview/export evidence, no public artifacts |
| Provider/model calls | `blocked_pending_provider_owner_runtime_approval` | backend-only disabled-by-default policy and explicit approval |
| External beta | `blocked` | internal beta evidence plus security/privacy/support/cost/deployment review |
| Paid production | `blocked` | separate billing/legal/support/rollback approval |
| Final delivery/export | `blocked` | separate production delivery gate |

Product-ready end-to-end local OSS tools: `0`

## Current Next Action

`RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1`

## RP External Beta Reeditpro Supabase Main Target Migration Sync 1

`RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1` records decision `completed_reeditpro_main_supabase_target_migration_history_sync` and execution `completed_guarded_main_staging_migration_apply_and_readonly_validation`.

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.

Historical sandbox `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm` is no longer an active target and no data was copied from it.

Source mapping added `supabase/migrations/20260626163138_public_production_edit_session_brief_qwen_gates.sql` for remote-only main-target migration `20260626163138`. The guarded sync then applied the 18 pending repo migrations and lint-fix migration `20260626224600_worker_runtime_fail_retry_count_lint_fix.sql`.

Final migration history: `source_aligned_and_up_to_date_through_20260626224600`. Final dry-run: `Remote database is up to date.` Supabase lint: `No schema errors found`. Confirmed RLS/storage validation run ID: `2026-06-26T22-47-09-777Z-898c9851`.

Product-ready end-to-end local OSS tools: `0`. Internal beta unlocked: `false`. External beta unlocked: `false`. Production unlocked: `false`. Package-lock: `unchanged`. Generated artifacts committed: `none`.

Next recommended milestone: `RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1`.

## RP External Beta Main Supabase Service-Role Runtime Validation 1

`RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1` records decision `completed_main_supabase_service_role_runtime_grant_boundary_validation` and execution `completed_guarded_main_staging_grant_hardening_and_readonly_runtime_boundary_validation`.

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.

Grant hardening migration `supabase/migrations/20260626233000_external_beta_public_grant_hardening.sql` revoked broad `anon` / `authenticated` public-table mutation grants and public sequence privileges so backend/service-role paths own privileged writes. The confirmed runner validated final dry-run, public/worker-runtime lint, managed storage lint readback, hardening migration presence, service-role protected-table write capability, and public mutation absence.

Run ID: `2026-06-26T23-41-52-998Z-818c6ba1`. Unsafe public mutation grants: `0`. Unsafe public sequence grants: `0`.

Artifact checksums: `validation-report.json` `b0de58258882c2bbe0a7296c58ab3fc44b2f8eb645befe91bdd38adde55a83de`; `artifact-manifest.json` `cc7e3b894c2c0fb13fcb2dd0a23da27cccfeab952dc6b2ffcecd0d75b7ed5647`.

Service-role route execution remains `not_run_pending_route_specific_guarded_write_validation`. Approved snapshot persistence is now `ready_for_guarded_remote_write_validation`.

Product-ready end-to-end local OSS tools: `0`. Internal beta unlocked: `false`. External beta unlocked: `false`. Production unlocked: `false`. Package-lock: `unchanged`. Generated artifacts committed: `none`.

Next recommended milestone: `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1`.

## RP External Beta Approved Snapshot Persistence Guarded Remote Write 1

`RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1` records decision `completed_approved_snapshot_persistence_guarded_remote_write_readback` and execution `completed_guarded_transaction_rolled_back_approved_snapshot_persistence_write_readback`.

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.

The confirmed runner used `set local role service_role` inside a generated validation transaction, inserted/read back the approved snapshot dependency chain, validated immutable snapshot update rejection, rolled the transaction back, and validated residue counts as `0`.

Run ID: `2026-06-27T00-00-12-289Z-7f5e51bd`. Report checksum: `aa4d16b57305072242427398a5f2c3fadf6637490d08f4a76466087b269cb865`. Manifest checksum: `36edc2f5c48567da9ccd5860ce6b634858465933e974c9bec64bc2d59bfd73ed`.

Service-role route execution remains `not_run_pending_route_specific_guarded_write_validation`. Credit reservation ledger is now `completed_credit_reservation_ledger_guarded_remote_write_readback`.

Product-ready end-to-end local OSS tools: `0`. Internal beta unlocked: `false`. External beta unlocked: `false`. Production unlocked: `false`. Package-lock: `unchanged`. Generated artifacts committed: `none`.

Next recommended milestone: `RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1`.

## RP External Beta Credit Reservation Ledger Guarded Remote Write 1

`RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1` records decision `completed_credit_reservation_ledger_guarded_remote_write_readback` and execution `completed_guarded_transaction_rolled_back_credit_reservation_ledger_write_readback`.

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.

The confirmed runner used `set local role service_role` inside a generated validation transaction, inserted/read back a credit wallet, credit grant, credit approval, approved snapshot, credit reservation, credit ledger entry, and audit event, validated ledger append-only update rejection, rolled the transaction back, and validated residue counts as `0`.

Run ID: `2026-06-27T00-12-50-200Z-34a19fc2`. Report checksum: `ccbcd02a4264d0ecb1cba7394d7c9344e8c24ab3b3fe7f7ff5f21f385536044c`. Manifest checksum: `a2f6f7cb204903bb3bcca354fc9d5a649353330a8ef93a152bab560c331d7782`.

Service-role route execution remains `not_run_pending_route_specific_guarded_write_validation`. Job queue leases/events are now `ready_for_guarded_remote_write_readback_validation`.

Product-ready end-to-end local OSS tools: `0`. Internal beta unlocked: `false`. External beta unlocked: `false`. Production unlocked: `false`. Package-lock: `unchanged`. Generated artifacts committed: `none`.

Next recommended milestone: `RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1`.

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
