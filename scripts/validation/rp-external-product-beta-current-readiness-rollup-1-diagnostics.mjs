#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const mainTargetMigrationSyncFiles = [
  'docs/external-beta/reeditpro-supabase-main-target-migration-sync-1/source-audit.md',
  'docs/external-beta/reeditpro-supabase-main-target-migration-sync-1/migration-history-sync.md',
  'docs/external-beta/reeditpro-supabase-main-target-migration-sync-1/validation-results.md',
  'docs/external-beta/reeditpro-supabase-main-target-migration-sync-1/readiness-gate.md',
  'docs/external-beta/reeditpro-supabase-main-target-migration-sync-1/safety-boundary.md',
  'docs/external-beta/reeditpro-supabase-main-target-migration-sync-1/sync-record.json',
  'docs/activation-phase-rp-external-beta-reeditpro-supabase-main-target-migration-sync-1-results.md',
  'supabase/migrations/20260626163138_public_production_edit_session_brief_qwen_gates.sql',
  'supabase/migrations/20260626224600_worker_runtime_fail_retry_count_lint_fix.sql',
  'scripts/validation/rp-external-beta-reeditpro-supabase-main-target-migration-sync-1-diagnostics.mjs',
]

const relatedDiagnosticsAllowlist = [
  'scripts/validation/rp-internal-beta-supabase-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-diagnostics.mjs',
]

const followOnSupabaseCleanStagingTargetOwnerApproval1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-target-owner-approval-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-target-owner-approval-1-record.json',
  'docs/activation-phase-supabase-clean-staging-target-owner-approval-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-execution-current-target-revalidation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
]

const followOnSupabaseCleanStagingBranchCurrentTargetRevalidation1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-current-target-revalidation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-db-url-secret-handoff-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-db-url-secret-handoff-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-db-url-secret-handoff-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-db-url-secret-handoff-1-results.md',
  'docs/activation-supabase-clean-staging-branch-db-url-secret-handoff-1-reports/clean_staging_branch_db_url_secret_handoff_report.json',
  'docs/activation-supabase-clean-staging-branch-db-url-secret-handoff-1-reports/clean_staging_branch_db_url_secret_handoff_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-current-target-guarded-validation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
]

const followOnSupabaseCleanStagingBranchCurrentTargetGuardedValidation1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-guarded-validation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-guarded-validation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-current-target-guarded-validation-1-results.md',
  'docs/activation-supabase-clean-staging-branch-current-target-guarded-validation-1-reports/clean_staging_branch_current_target_guarded_validation_report.json',
  'docs/activation-supabase-clean-staging-branch-current-target-guarded-validation-1-reports/clean_staging_branch_current_target_guarded_validation_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-chain-apply-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const mainSupabaseServiceRoleRuntimeValidationFiles = [
  'docs/external-beta/main-supabase-service-role-runtime-validation-1/source-audit.md',
  'docs/external-beta/main-supabase-service-role-runtime-validation-1/grant-hardening.md',
  'docs/external-beta/main-supabase-service-role-runtime-validation-1/validation-results.md',
  'docs/external-beta/main-supabase-service-role-runtime-validation-1/readiness-gate.md',
  'docs/external-beta/main-supabase-service-role-runtime-validation-1/safety-boundary.md',
  'docs/external-beta/main-supabase-service-role-runtime-validation-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-main-supabase-service-role-runtime-validation-1-results.md',
  'supabase/migrations/20260626233000_external_beta_public_grant_hardening.sql',
  'scripts/validation/rp-external-beta-main-supabase-service-role-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-main-supabase-service-role-runtime-validation-1-diagnostics.mjs',
]

const approvedSnapshotGuardedRemoteWriteFiles = [
  'docs/external-beta/approved-snapshot-persistence-guarded-remote-write-1/source-audit.md',
  'docs/external-beta/approved-snapshot-persistence-guarded-remote-write-1/validation-results.md',
  'docs/external-beta/approved-snapshot-persistence-guarded-remote-write-1/readiness-gate.md',
  'docs/external-beta/approved-snapshot-persistence-guarded-remote-write-1/safety-boundary.md',
  'docs/external-beta/approved-snapshot-persistence-guarded-remote-write-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-results.md',
  'scripts/validation/rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-diagnostics.mjs',
]

const creditReservationLedgerGuardedRemoteWriteFiles = [
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/source-audit.md',
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/validation-results.md',
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/readiness-gate.md',
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/safety-boundary.md',
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-credit-reservation-ledger-guarded-remote-write-1-results.md',
  'scripts/validation/rp-external-beta-credit-reservation-ledger-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-credit-reservation-ledger-guarded-remote-write-1-diagnostics.mjs',
]

const followOnSupabaseCleanStagingBranchMigrationChainApply1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-chain-apply-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-chain-apply-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-chain-apply-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingBranchMigrationHistoryReconciliation1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-reconciliation-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingBranchMigrationHistorySourceDerivedOwnerDecision1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingBranchReplacementExecution1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-execution-1-results.md',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_report.json',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingBranchReplacementHistorySourceMapping1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-history-source-mapping-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-owner-decision-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-unadopted-branch-cleanup-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingIsolatedTargetOwnerDecision1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-owner-decision-1-record.json',
  'docs/activation-phase-supabase-clean-staging-isolated-target-owner-decision-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-creation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-isolated-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingIsolatedTargetCreation1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-creation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-creation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-isolated-target-creation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-migration-chain-apply-1.md',
  'docs/activation-supabase-clean-staging-isolated-target-creation-1-reports/clean_staging_isolated_target_creation_report.json',
  'docs/activation-supabase-clean-staging-isolated-target-creation-1-reports/clean_staging_isolated_target_creation_manifest.json',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingIsolatedTargetMigrationChainApply1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-migration-chain-apply-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-migration-chain-apply-1-record.json',
  'docs/activation-phase-supabase-clean-staging-isolated-target-migration-chain-apply-1-results.md',
  'docs/activation-supabase-clean-staging-isolated-target-migration-chain-apply-1-reports/clean_staging_isolated_target_migration_chain_apply_report.json',
  'docs/activation-supabase-clean-staging-isolated-target-migration-chain-apply-1-reports/clean_staging_isolated_target_migration_chain_apply_manifest.json',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseWorkerRuntimeTransactionalRpcIsolatedTargetReadback1Files = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-record.json',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-results.md',
  'docs/activation-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-reports/worker_runtime_transactional_rpc_isolated_target_readback_report.json',
  'docs/activation-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-reports/worker_runtime_transactional_rpc_isolated_target_readback_manifest.json',
  'docs/implementation-prompts/prompt-supabase-service-role-runtime-boundary-validation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseServiceRoleRuntimeBoundaryValidation1Files = [
  'docs/supabase-worker-runtime/supabase-service-role-runtime-boundary-validation-1.md',
  'docs/supabase-worker-runtime/supabase-service-role-runtime-boundary-validation-1-record.json',
  'docs/activation-phase-supabase-service-role-runtime-boundary-validation-1-results.md',
  'docs/activation-supabase-service-role-runtime-boundary-validation-1-reports/service_role_runtime_boundary_validation_report.json',
  'docs/activation-supabase-service-role-runtime-boundary-validation-1-reports/service_role_runtime_boundary_validation_manifest.json',
  'docs/implementation-prompts/prompt-rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-service-role-runtime-boundary-validation-1.mjs',
  'scripts/validation/supabase-service-role-runtime-boundary-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnApprovedSnapshotServiceRolePersistenceImplementation1Files = [
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/implementation-contract.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/validation-results.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/service-role-persistence-implementation-record.json',
  'docs/activation-phase-rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1-results.md',
  'docs/activation-phase-rp-internal-beta-supabase-credential-context-contract-1-results.md',
  'docs/activation-phase-rp-internal-beta-supabase-target-credential-context-preflight-1-results.md',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'docs/internal-beta/rp-internal-beta-supabase-credential-context-contract-1/alias-matrix.md',
  'docs/internal-beta/rp-internal-beta-supabase-credential-context-contract-1/credential-context-contract-record.json',
  'docs/internal-beta/rp-internal-beta-supabase-target-credential-context-preflight-1/alias-matrix.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-credential-context-preflight-1/credential-context-preflight-record.json',
  'docs/internal-beta/rp-internal-beta-supabase-target-credential-context-preflight-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner-record.json',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/source-audit.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'server/config/internal-beta-supabase-credential-context-contract.ts',
  'server/services/internal-beta-approved-snapshot-service-role-persistence-implementation.ts',
  'server/smoke/internal-beta-supabase-credential-context-contract-smoke.ts',
  'server/smoke/internal-beta-approved-snapshot-service-role-persistence-implementation-smoke.ts',
  'scripts/validation/rp-internal-beta-supabase-credential-context-contract-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1-diagnostics.mjs',
  'scripts/validation/supabase-service-role-runtime-boundary-validation-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-approved-snapshot-persistence-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_external_product_beta_pending_remaining_runtime_gates_after_credit_ledger_remote_write_readback',
  'completed_docs_only_current_beta_readiness_rollup_no_runtime_execution',
  'completed_reeditpro_main_supabase_target_migration_history_sync',
  'completed_main_supabase_service_role_runtime_grant_boundary_validation',
  'completed_approved_snapshot_persistence_guarded_remote_write_readback',
  'completed_credit_reservation_ledger_guarded_remote_write_readback',
  'source_aligned_and_up_to_date_through_20260626224600',
  'Remote database is up to date.',
  'No schema errors found',
  'Unsafe public mutation grants: `0`',
  'Unsafe public sequence grants: `0`',
  'completed_guarded_supabase_target_rls_storage_readonly_validation',
  'External product beta status: `blocked`',
  'Internal beta status: `blocked_pending_service_role_runtime_private_artifact_render_provider_security_gates`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1',
  'residue counts as `0`',
  'fajinbvwhcjnutkaumkm` is no longer an active target and no data was copied from it',
  '20260626163138_public_production_edit_session_brief_qwen_gates.sql',
  '20260626224600_worker_runtime_fail_retry_count_lint_fix.sql',
  '20260626233000_external_beta_public_grant_hardening.sql',
  'PR #577 remains open/draft/blocked and excluded',
  'Remote Supabase mutation for the preceding sync, service-role validation, approved snapshot validation, and credit ledger validation packets was limited to guarded staging migration apply, guarded public grant hardening, a transaction-rolled-back generated approved snapshot fixture, and a transaction-rolled-back generated credit reservation and ledger fixture on the single main Reeditpro project `wmyyttnynmteqgcdishd`; no data was copied from the isolated project and approved snapshot plus credit ledger residue readback was `0`.',
]

const forbiddenPatterns = [
  /external product beta status:\s*`?(ready|unlocked|approved)`?/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /providerModelCall"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /package-lock mutation:\s*`?true`?/i,
]

const blockedPaths = [
  'package-lock.json',
  'supabase/migrations',
  'supabase/functions',
  'server',
  'src',
  'docker',
  'database',
  '.github/workflows',
  '.dockerignore',
]

const allowedRuntimeImplementationFiles = new Set([
  'server/config/internal-beta-supabase-credential-context-contract.ts',
  'server/services/internal-beta-approved-snapshot-service-role-persistence-implementation.ts',
  'server/smoke/internal-beta-supabase-credential-context-contract-smoke.ts',
  'server/smoke/internal-beta-approved-snapshot-service-role-persistence-implementation-smoke.ts',
])

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (record.decision !== 'blocked_external_product_beta_pending_remaining_runtime_gates_after_credit_ledger_remote_write_readback') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_current_beta_readiness_rollup_no_runtime_execution') fail('record execution mismatch')
if (record.statuses?.externalProductBeta !== 'blocked') fail('external beta status mismatch')
if (record.statuses?.internalBeta !== 'blocked_pending_service_role_runtime_private_artifact_render_provider_security_gates') fail('internal beta status mismatch')
if (record.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.mainSupabaseTarget?.projectRef !== 'wmyyttnynmteqgcdishd') fail('main target ref mismatch')
if (record.mainSupabaseTarget?.migrationHistory !== 'source_aligned_and_up_to_date_through_20260626224600') fail('main target migration history mismatch')
if (record.mainSupabaseTarget?.serviceRoleGrantBoundary !== 'completed_main_supabase_service_role_runtime_grant_boundary_validation') fail('main target service-role grant boundary mismatch')
if (record.mainSupabaseTarget?.unsafePublicMutationGrantCount !== 0) fail('main target unsafe public mutation grants not zero')
if (record.mainSupabaseTarget?.unsafePublicSequenceGrantCount !== 0) fail('main target unsafe public sequence grants not zero')
if (record.mainSupabaseTarget?.approvedSnapshotPersistence !== 'completed_approved_snapshot_persistence_guarded_remote_write_readback') fail('approved snapshot persistence status mismatch')
if (record.mainSupabaseTarget?.approvedSnapshotPersistentRowsCreated !== false) fail('approved snapshot persistent rows flag mismatch')
if (record.mainSupabaseTarget?.approvedSnapshotRollbackResidueCount !== 0) fail('approved snapshot residue count mismatch')
if (record.mainSupabaseTarget?.creditReservationLedger !== 'completed_credit_reservation_ledger_guarded_remote_write_readback') fail('credit reservation ledger status mismatch')
if (record.mainSupabaseTarget?.creditReservationLedgerPersistentRowsCreated !== false) fail('credit ledger persistent rows flag mismatch')
if (record.mainSupabaseTarget?.creditReservationLedgerRollbackResidueCount !== 0) fail('credit ledger residue count mismatch')
if (record.mainSupabaseTarget?.creditLedgerAppendOnlyUpdateRejection !== 'passed') fail('credit ledger append-only status mismatch')
if (record.mainSupabaseTarget?.isolatedSandboxActive !== false) fail('isolated sandbox must not be active')
if (record.mainSupabaseTarget?.isolatedSandboxDataCopied !== false) fail('isolated sandbox data copy must be false')
if (record.safety?.supabaseMutation !== 'guarded_main_staging_migration_apply_grant_hardening_transaction_rolled_back_snapshot_fixture_and_transaction_rolled_back_credit_fixture_only') fail('Supabase mutation scope mismatch')
if (record.safety?.sqlMutation !== 'guarded_main_staging_migration_apply_grant_hardening_transaction_rolled_back_snapshot_fixture_and_transaction_rolled_back_credit_fixture_only') fail('SQL mutation scope mismatch')
if (record.safety?.migrationApply !== 'guarded_main_staging_migration_apply_and_grant_hardening_only') fail('migration apply scope mismatch')
if (record.safety?.persistentRowsCreated !== false) fail('persistent rows flag mismatch')
if (record.safety?.persistentCreditMutation !== false) fail('persistent credit mutation flag mismatch')
if (record.safety?.persistentCreditReservationCreation !== false) fail('persistent credit reservation flag mismatch')
if (record.safety?.creditSpend !== false) fail('credit spend flag mismatch')
if (record.safety?.jobEnqueue !== false) fail('job enqueue flag mismatch')
if (record.safety?.jobEventWrite !== false) fail('job event write flag mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-product-beta-current-readiness-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowed = new Set([
  ...requiredFiles,
  ...mainTargetMigrationSyncFiles,
  ...mainSupabaseServiceRoleRuntimeValidationFiles,
  ...approvedSnapshotGuardedRemoteWriteFiles,
  ...creditReservationLedgerGuardedRemoteWriteFiles,
  ...relatedDiagnosticsAllowlist,
  ...followOnSupabaseCleanStagingTargetOwnerApproval1Files,
  ...followOnSupabaseCleanStagingBranchCurrentTargetRevalidation1Files,
  ...followOnSupabaseCleanStagingBranchCurrentTargetGuardedValidation1Files,
  ...followOnSupabaseCleanStagingBranchMigrationChainApply1Files,
  ...followOnSupabaseCleanStagingBranchMigrationHistoryReconciliation1Files,
  ...followOnSupabaseCleanStagingBranchMigrationHistorySourceDerivedOwnerDecision1Files,
  ...followOnSupabaseCleanStagingBranchReplacementExecution1Files,
  ...followOnSupabaseCleanStagingBranchReplacementHistorySourceMapping1Files,
  ...followOnSupabaseCleanStagingIsolatedTargetOwnerDecision1Files,
  ...followOnSupabaseCleanStagingIsolatedTargetCreation1Files,
  ...followOnSupabaseCleanStagingIsolatedTargetMigrationChainApply1Files,
  ...followOnSupabaseWorkerRuntimeTransactionalRpcIsolatedTargetReadback1Files,
  ...followOnSupabaseServiceRoleRuntimeBoundaryValidation1Files,
  ...followOnApprovedSnapshotServiceRolePersistenceImplementation1Files,
])
const allowedSqlFiles = new Set([
  'supabase/migrations/20260626163138_public_production_edit_session_brief_qwen_gates.sql',
  'supabase/migrations/20260626224600_worker_runtime_fail_retry_count_lint_fix.sql',
  'supabase/migrations/20260626233000_external_beta_public_grant_hardening.sql',
])
for (const file of changedFiles()) {
  if (!allowed.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blockedPath of blockedPaths) {
    if (
      (file === blockedPath || file.startsWith(`${blockedPath}/`)) &&
      !allowedRuntimeImplementationFiles.has(file) &&
      !allowedSqlFiles.has(file)
    ) {
      fail(`blocked path changed: ${file}`)
    }
  }
  if (file.endsWith('.sql') && !allowedSqlFiles.has(file)) fail(`SQL file changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text
    .replaceAll('postgresql://[redacted]', '')
    .replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_external_product_beta_pending_remaining_runtime_gates_after_credit_ledger_remote_write_readback')
console.log('External product beta: blocked')
console.log('SQL mutation: guarded_main_staging_migration_apply_grant_hardening_transaction_rolled_back_snapshot_fixture_and_transaction_rolled_back_credit_fixture_only')
