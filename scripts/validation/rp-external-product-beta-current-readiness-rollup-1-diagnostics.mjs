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
  'scripts/validation/rp-external-beta-release-go-no-go-1-diagnostics.mjs',
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

const jobQueueLeaseEventGuardedRemoteWriteFiles = [
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/source-audit.md',
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/validation-results.md',
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/readiness-gate.md',
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/safety-boundary.md',
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-job-queue-lease-event-guarded-remote-write-1-results.md',
  'scripts/validation/rp-external-beta-job-queue-lease-event-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-job-queue-lease-event-guarded-remote-write-1-diagnostics.mjs',
]

const privateArtifactStorageAccessGuardedRemoteWriteFiles = [
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/source-audit.md',
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/validation-results.md',
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/readiness-gate.md',
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/safety-boundary.md',
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-results.md',
  'scripts/validation/rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-diagnostics.mjs',
]

const serviceRoleRouteRuntimeValidationFiles = [
  'docs/external-beta/service-role-route-runtime-validation-1/source-audit.md',
  'docs/external-beta/service-role-route-runtime-validation-1/validation-results.md',
  'docs/external-beta/service-role-route-runtime-validation-1/readiness-gate.md',
  'docs/external-beta/service-role-route-runtime-validation-1/safety-boundary.md',
  'docs/external-beta/service-role-route-runtime-validation-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-service-role-route-runtime-validation-1-results.md',
  'scripts/validation/rp-external-beta-service-role-route-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-service-role-route-runtime-validation-1-diagnostics.mjs',
]

const approvedSnapshotRouteWriteRuntimeValidationFiles = [
  'docs/external-beta/approved-snapshot-route-write-runtime-validation-1/source-audit.md',
  'docs/external-beta/approved-snapshot-route-write-runtime-validation-1/validation-results.md',
  'docs/external-beta/approved-snapshot-route-write-runtime-validation-1/readiness-gate.md',
  'docs/external-beta/approved-snapshot-route-write-runtime-validation-1/safety-boundary.md',
  'docs/external-beta/approved-snapshot-route-write-runtime-validation-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-approved-snapshot-route-write-runtime-validation-1-results.md',
  'server/middleware/auth.ts',
  'server/services/approved-snapshot-service.ts',
  'server/validation/approval-schemas.ts',
  'scripts/validation/rp-external-beta-approved-snapshot-route-write-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-approved-snapshot-route-write-runtime-validation-1-diagnostics.mjs',
]

const remotionPrivatePreviewExportRuntimeValidationFiles = [
  'docs/external-beta/remotion-private-preview-export-runtime-validation-1/source-audit.md',
  'docs/external-beta/remotion-private-preview-export-runtime-validation-1/validation-results.md',
  'docs/external-beta/remotion-private-preview-export-runtime-validation-1/readiness-gate.md',
  'docs/external-beta/remotion-private-preview-export-runtime-validation-1/safety-boundary.md',
  'docs/external-beta/remotion-private-preview-export-runtime-validation-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-remotion-private-preview-export-runtime-validation-1-results.md',
  'scripts/validation/rp-external-beta-remotion-private-preview-export-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-remotion-private-preview-export-runtime-validation-1-diagnostics.mjs',
]

const providerModelCallPolicyClosureFiles = [
  'docs/external-beta/provider-model-call-policy-closure-1/source-audit.md',
  'docs/external-beta/provider-model-call-policy-closure-1/provider-runtime-boundary.md',
  'docs/external-beta/provider-model-call-policy-closure-1/readiness-gate.md',
  'docs/external-beta/provider-model-call-policy-closure-1/safety-boundary.md',
  'docs/external-beta/provider-model-call-policy-closure-1/policy-closure-record.json',
  'docs/external-beta/provider-model-call-policy-closure-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-provider-model-call-policy-closure-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qa-cleanup-observability-rollback-review-1.md',
  'scripts/validation/rp-external-beta-provider-model-call-policy-closure-1-diagnostics.mjs',
]

const qaCleanupObservabilityRollbackReviewFiles = [
  'docs/external-beta/qa-cleanup-observability-rollback-review-1/source-audit.md',
  'docs/external-beta/qa-cleanup-observability-rollback-review-1/qa-cleanup-readiness.md',
  'docs/external-beta/qa-cleanup-observability-rollback-review-1/observability-rollback-readiness.md',
  'docs/external-beta/qa-cleanup-observability-rollback-review-1/security-privacy-cost-deployment.md',
  'docs/external-beta/qa-cleanup-observability-rollback-review-1/readiness-gate.md',
  'docs/external-beta/qa-cleanup-observability-rollback-review-1/safety-boundary.md',
  'docs/external-beta/qa-cleanup-observability-rollback-review-1/review-record.json',
  'docs/external-beta/qa-cleanup-observability-rollback-review-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-qa-cleanup-observability-rollback-review-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-release-go-no-go-1.md',
  'scripts/validation/rp-external-beta-qa-cleanup-observability-rollback-review-1-diagnostics.mjs',
]

const releaseGoNoGoFiles = [
  'docs/external-beta/release-go-no-go-1/source-audit.md',
  'docs/external-beta/release-go-no-go-1/release-boundary.md',
  'docs/external-beta/release-go-no-go-1/readiness-gate.md',
  'docs/external-beta/release-go-no-go-1/safety-boundary.md',
  'docs/external-beta/release-go-no-go-1/release-decision-record.json',
  'docs/external-beta/release-go-no-go-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-release-go-no-go-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-enablement-1.md',
  'scripts/validation/rp-external-beta-release-go-no-go-1-diagnostics.mjs',
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
  'approved_external_beta_release_go_no_go_source_chain_accepted',
  'completed_docs_only_current_beta_readiness_rollup_no_runtime_execution',
  'completed_reeditpro_main_supabase_target_migration_history_sync',
  'completed_main_supabase_service_role_runtime_grant_boundary_validation',
  'completed_approved_snapshot_persistence_guarded_remote_write_readback',
  'completed_credit_reservation_ledger_guarded_remote_write_readback',
  'completed_job_queue_lease_event_guarded_remote_write_readback',
  'completed_private_artifact_storage_access_guarded_remote_write_readback',
  'completed_guarded_generated_private_storage_object_write_read_delete_and_transaction_rolled_back_artifact_metadata_readback',
  'completed_service_role_storage_object_metadata_read_route_runtime_validation',
  'completed_guarded_in_process_service_role_storage_object_metadata_read_route_validation',
  'completed_approved_snapshot_route_write_runtime_validation',
  'completed_guarded_in_process_approved_snapshot_route_write_readback_and_cleanup',
  'completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation',
  'completed_confirmation_gated_external_beta_generated_local_remotion_render',
  'passed_external_beta_generated_local_private_preview_fixture',
  'source_aligned_and_up_to_date_through_20260626224600',
  'Remote database is up to date.',
  'No schema errors found',
  'Unsafe public mutation grants: `0`',
  'Unsafe public sequence grants: `0`',
  'completed_guarded_supabase_target_rls_storage_readonly_validation',
  'External product beta readiness: `ready_for_controlled_external_beta_enablement`',
  'External beta unlocked in this packet: `false`',
  'Internal beta status: `blocked_pending_service_role_runtime_private_artifact_render_provider_security_gates`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1',
  'RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1',
  'RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1',
  'completed_external_beta_provider_model_call_policy_closure_no_runtime_calls',
  'completed_docs_only_provider_model_policy_closure_no_provider_or_model_execution',
  'completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution',
  'completed_docs_only_qa_cleanup_observability_rollback_review_no_runtime_execution',
  'provider/model runtime as `disabled_by_default`',
  'Provider/model calls executed: `none`',
  'Frontend provider calls: `forbidden`',
  'Backend-only provider adapters: `required`',
  'RP-EXTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-ROLLBACK-REVIEW-1',
  'RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1',
  'RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1',
  'source_evidence_review_passed_ready_for_release_go_no_go',
  'ephemeral_fixture_cleanup_evidence_passed_ready_for_release_go_no_go',
  'audit_manifest_checksum_status_evidence_passed_ready_for_release_go_no_go',
  'transaction_rollback_and_fixture_residue_evidence_passed_ready_for_release_go_no_go',
  'reviewed_pending_release_go_no_go_operator_acceptance',
  'reeditpro-external-beta-generated-local-preview.mp4',
  'ea12d55c9ef1675da711769c97c9e76bb2da8547bd4c471176a0ff64b03c1c5b',
  'residue counts as `0`',
  'storage object residue count: `0`',
  'artifact metadata rollback residue count: `0`',
  'route fixture cleanup residue count: `0`',
  'route write fixture cleanup residue count: `0`',
  'private bucket public count: `0`',
  'canonicalOnly: `true`',
  'signed URL creation: `false`',
  'public artifact creation: `false`',
  'fajinbvwhcjnutkaumkm` is no longer an active target and no data was copied from it',
  '20260626163138_public_production_edit_session_brief_qwen_gates.sql',
  '20260626224600_worker_runtime_fail_retry_count_lint_fix.sql',
  '20260626233000_external_beta_public_grant_hardening.sql',
  'PR #577 remains open/draft/blocked and excluded',
  'Remotion execution in the current source chain was limited to confirmation-gated rendering of a generated local preview fixture under `/tmp`; no generated media was committed.',
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
  'server/middleware/auth.ts',
  'server/services/approved-snapshot-service.ts',
  'server/validation/approval-schemas.ts',
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
if (record.decision !== 'approved_external_beta_release_go_no_go_source_chain_accepted') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_current_beta_readiness_rollup_no_runtime_execution') fail('record execution mismatch')
if (record.statuses?.externalProductBeta !== 'ready_for_controlled_external_beta_enablement') fail('external beta status mismatch')
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
if (record.mainSupabaseTarget?.jobQueueLeaseEvents !== 'completed_job_queue_lease_event_guarded_remote_write_readback') fail('job queue lease/event status mismatch')
if (record.mainSupabaseTarget?.jobQueueLeaseEventPersistentRowsCreated !== false) fail('job queue persistent rows flag mismatch')
if (record.mainSupabaseTarget?.jobQueueLeaseEventRollbackResidueCount !== 0) fail('job queue residue count mismatch')
if (record.mainSupabaseTarget?.jobQueueJobStatus !== 'queued') fail('job queue status mismatch')
if (record.mainSupabaseTarget?.jobQueueJobEventType !== 'queued') fail('job event type mismatch')
if (record.mainSupabaseTarget?.jobQueueWorkerLeaseStatus !== 'claimed') fail('worker lease status mismatch')
if (record.mainSupabaseTarget?.privateArtifactStorageAccess !== 'completed_private_artifact_storage_access_guarded_remote_write_readback') fail('private artifact storage status mismatch')
if (record.mainSupabaseTarget?.privateArtifactBucketCount !== 8) fail('private artifact bucket count mismatch')
if (record.mainSupabaseTarget?.privateArtifactBucketPublicCount !== 0) fail('private artifact public bucket count mismatch')
if (record.mainSupabaseTarget?.privateArtifactAnonStoragePolicyCount !== 0) fail('private artifact anonymous policy count mismatch')
if (record.mainSupabaseTarget?.privateArtifactStorageObjectResidueCount !== 0) fail('private artifact storage residue mismatch')
if (record.mainSupabaseTarget?.privateArtifactMetadataRollbackResidueCount !== 0) fail('private artifact metadata residue mismatch')
if (record.mainSupabaseTarget?.privateArtifactStorageRunId !== '2026-06-27T01-26-45-265Z-df201682') fail('private artifact run id mismatch')
if (record.mainSupabaseTarget?.privateArtifactStorageReportSha256 !== '809bea0a749e09cd63da4893e607420c719ab79d72da9d712d56bb3c91263686') fail('private artifact report checksum mismatch')
if (record.mainSupabaseTarget?.privateArtifactStorageManifestSha256 !== '16ee022cb847d5367f05678880c69cf50b4f83f407f10f174e3351b039960b2d') fail('private artifact manifest checksum mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteRuntimeValidation !== 'completed_service_role_storage_object_metadata_read_route_runtime_validation') fail('service-role route validation status mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteExecution !== 'guarded_in_process_storage_object_metadata_read_route_only') fail('service-role route execution scope mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteMethod !== 'GET') fail('service-role route method mismatch')
if (record.mainSupabaseTarget?.serviceRoleRoutePath !== '/v1/storage-objects/:storageObjectRecordId') fail('service-role route path mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteCanonicalOnly !== true) fail('service-role route canonical flag mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteWriteValidation !== 'completed_approved_snapshot_route_write_runtime_validation') fail('service-role route write status mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteWriteExecution !== 'guarded_in_process_approved_snapshot_create_route_only') fail('service-role route write execution scope mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteWriteMethod !== 'POST') fail('service-role route write method mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteWritePath !== '/v1/edit-plans/:editPlanId/approved-snapshots') fail('service-role route write path mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteWriteFixtureResidueCount !== 0) fail('service-role route write residue mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteWriteRunId !== '2026-06-27T02-22-16-532Z-97b253a9') fail('service-role route write run id mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteWriteReportSha256 !== 'b2ca9e8ec9493060d631bd9387438b123eab6002db7c061c058edda736759441') fail('service-role route write report checksum mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteWriteManifestSha256 !== 'f2ff4e97b33d013f0864362a5272b24390153f5de9563ed52457ab55ead9b0c0') fail('service-role route write manifest checksum mismatch')
if (record.mainSupabaseTarget?.remotionPrivatePreviewExportRuntimeValidation !== 'completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation') fail('Remotion private preview/export status mismatch')
if (record.mainSupabaseTarget?.remotionPrivatePreviewExportExecution !== 'completed_confirmation_gated_external_beta_generated_local_remotion_render') fail('Remotion private preview/export execution mismatch')
if (record.mainSupabaseTarget?.remotionPrivatePreviewExportRunId !== '2026-06-27T02-41-01-252Z-7ce79dc6') fail('Remotion private preview/export run id mismatch')
if (record.mainSupabaseTarget?.remotionPrivatePreviewExportOutputFile !== 'reeditpro-external-beta-generated-local-preview.mp4') fail('Remotion output file mismatch')
if (record.mainSupabaseTarget?.remotionPrivatePreviewExportOutputBytes !== 64855) fail('Remotion output bytes mismatch')
if (record.mainSupabaseTarget?.remotionPrivatePreviewExportOutputSha256 !== 'ea12d55c9ef1675da711769c97c9e76bb2da8547bd4c471176a0ff64b03c1c5b') fail('Remotion output checksum mismatch')
if (record.mainSupabaseTarget?.remotionPrivatePreviewExportManifestSha256 !== '24675b34cb0bd3b1ff255dd29343ffce2e12d7d045070bf59fba3404db15356c') fail('Remotion manifest checksum mismatch')
if (record.mainSupabaseTarget?.remotionPrivatePreviewExportQaReportSha256 !== '847efc9202c556f394d17df16a6a9250513f4106c6b3ebe884a453caaa8e5879') fail('Remotion QA checksum mismatch')
if (record.sourceClosure?.providerModelCallPolicyClosure !== 'rp_external_beta_provider_model_call_policy_closure_1') fail('provider policy closure source mismatch')
if (record.sourceClosure?.qaCleanupObservabilityRollbackReview !== 'rp_external_beta_qa_cleanup_observability_rollback_review_1') fail('QA cleanup review source mismatch')
if (record.sourceClosure?.releaseGoNoGo !== 'rp_external_beta_release_go_no_go_1') fail('release go/no-go source mismatch')
if (record.mainSupabaseTarget?.providerModelCallPolicyClosure !== 'completed_external_beta_provider_model_call_policy_closure_no_runtime_calls') fail('provider policy closure status mismatch')
if (record.mainSupabaseTarget?.providerModelCallPolicyExecution !== 'completed_docs_only_provider_model_policy_closure_no_provider_or_model_execution') fail('provider policy closure execution mismatch')
if (record.mainSupabaseTarget?.providerModelRuntime !== 'disabled_by_default') fail('provider runtime status mismatch')
if (record.mainSupabaseTarget?.providerModelCallsExecuted !== 'none') fail('provider calls executed mismatch')
if (record.mainSupabaseTarget?.frontendProviderCalls !== 'forbidden') fail('frontend provider policy mismatch')
if (record.mainSupabaseTarget?.backendOnlyProviderAdapters !== 'required') fail('backend adapter policy mismatch')
for (const key of [
  'providerApprovedSnapshotRequired',
  'providerCreditReservationRequired',
  'providerIdempotencyRequired',
  'providerCostCapRequired',
  'providerQaFallbackPolicyRequired',
  'providerServerSideSecretIsolationRequired',
]) {
  if (record.mainSupabaseTarget?.[key] !== true) fail(`${key} mismatch`)
}
if (record.mainSupabaseTarget?.qaCleanupObservabilityRollbackReview !== 'completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution') fail('QA cleanup review status mismatch')
if (record.mainSupabaseTarget?.qaReview !== 'source_evidence_review_passed_ready_for_release_go_no_go') fail('QA review mismatch')
if (record.mainSupabaseTarget?.cleanupReview !== 'ephemeral_fixture_cleanup_evidence_passed_ready_for_release_go_no_go') fail('cleanup review mismatch')
if (record.mainSupabaseTarget?.observabilityReview !== 'audit_manifest_checksum_status_evidence_passed_ready_for_release_go_no_go') fail('observability review mismatch')
if (record.mainSupabaseTarget?.rollbackReview !== 'transaction_rollback_and_fixture_residue_evidence_passed_ready_for_release_go_no_go') fail('rollback review mismatch')
if (record.mainSupabaseTarget?.securityPrivacySupportCostDeploymentReview !== 'reviewed_pending_release_go_no_go_operator_acceptance') fail('security/privacy/support/cost/deployment review mismatch')
if (record.mainSupabaseTarget?.releaseGoNoGo !== 'approved_external_beta_release_go_no_go_source_chain_accepted') fail('release go/no-go status mismatch')
if (record.mainSupabaseTarget?.externalBetaUnlock !== false) fail('external beta unlock must remain false')
if (record.mainSupabaseTarget?.controlledEnablementRequired !== true) fail('controlled enablement required flag mismatch')
if (record.mainSupabaseTarget?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1') fail('next milestone mismatch')
if (record.requiredNextOwnerDecision?.[0] !== 'RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1') fail('controlled enablement next decision mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteFixtureResidueCount !== 0) fail('service-role route residue mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteRunId !== '2026-06-27T01-48-16-104Z-82f6c630') fail('service-role route run id mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteReportSha256 !== '25772fc0efe3d6d1aa699a1408ec621cc7df0dbe13bb52fe526b3939030fbb65') fail('service-role route report checksum mismatch')
if (record.mainSupabaseTarget?.serviceRoleRouteManifestSha256 !== '682eb65b765996e9a3aa669c7f76575ca204de92b9734a66b967918b8ea27acb') fail('service-role route manifest checksum mismatch')
if (record.mainSupabaseTarget?.isolatedSandboxActive !== false) fail('isolated sandbox must not be active')
if (record.mainSupabaseTarget?.isolatedSandboxDataCopied !== false) fail('isolated sandbox data copy must be false')
if (record.safety?.supabaseMutation !== 'guarded_main_staging_migration_apply_grant_hardening_transaction_rolled_back_snapshot_fixture_credit_fixture_job_queue_fixture_and_private_artifact_metadata_fixture_plus_generated_private_storage_json_fixture_generated_route_metadata_fixture_and_generated_approved_snapshot_route_fixture_setup_cleanup_only') fail('Supabase mutation scope mismatch')
if (record.safety?.sqlMutation !== 'guarded_main_staging_migration_apply_grant_hardening_transaction_rolled_back_snapshot_fixture_credit_fixture_job_queue_fixture_and_private_artifact_metadata_fixture_plus_generated_route_metadata_fixture_and_generated_approved_snapshot_route_fixture_setup_cleanup_only') fail('SQL mutation scope mismatch')
if (record.safety?.migrationApply !== 'guarded_main_staging_migration_apply_and_grant_hardening_only') fail('migration apply scope mismatch')
if (record.safety?.persistentRowsCreated !== false) fail('persistent rows flag mismatch')
if (record.safety?.persistentCreditMutation !== false) fail('persistent credit mutation flag mismatch')
if (record.safety?.persistentCreditReservationCreation !== false) fail('persistent credit reservation flag mismatch')
if (record.safety?.creditSpend !== false) fail('credit spend flag mismatch')
if (record.safety?.jobEnqueue !== 'transaction_rolled_back_generated_job_fixture_only') fail('job enqueue scope mismatch')
if (record.safety?.persistentJobEnqueue !== false) fail('persistent job enqueue flag mismatch')
if (record.safety?.jobEventWrite !== 'transaction_rolled_back_generated_job_event_fixture_only') fail('job event write scope mismatch')
if (record.safety?.persistentJobEventWrite !== false) fail('persistent job event flag mismatch')
if (record.safety?.workerLeaseClaim !== 'transaction_rolled_back_generated_worker_lease_fixture_only') fail('worker lease scope mismatch')
if (record.safety?.persistentWorkerLeaseClaim !== false) fail('persistent worker lease flag mismatch')
if (record.safety?.storageObjectCreation !== 'guarded_generated_private_storage_json_fixture_created_then_deleted') fail('storage object creation scope mismatch')
if (record.safety?.storageObjectRead !== 'guarded_generated_private_storage_json_fixture_readback_only') fail('storage object read scope mismatch')
if (record.safety?.storageObjectDelete !== 'guarded_generated_private_storage_json_fixture_cleanup') fail('storage object delete scope mismatch')
if (record.safety?.storageObjectResidueCount !== 0) fail('storage object residue safety mismatch')
if (record.safety?.serviceRoleRouteExecution !== 'guarded_in_process_storage_object_metadata_read_route_only') fail('service-role route safety scope mismatch')
if (record.safety?.routeExecution !== 'guarded_in_process_get_storage_object_metadata_route_only') fail('route execution safety scope mismatch')
if (record.safety?.routeWriteExecution !== 'guarded_in_process_approved_snapshot_create_route_only') fail('route write execution safety mismatch')
if (record.safety?.routeWriteFixtureResidueCount !== 0) fail('route write fixture residue safety mismatch')
if (record.safety?.validationOnlyEphemeralSnapshotCleanup !== true) fail('validation cleanup safety mismatch')
if (record.safety?.serviceRoleRouteFixtureResidueCount !== 0) fail('service-role route fixture residue safety mismatch')
if (record.safety?.secretPayloadAccess !== 'guarded_ephemeral_storage_and_route_runtime_service_role_key_payload_only') fail('secret payload access scope mismatch')
if (record.safety?.secretPayloadPrinted !== false) fail('secret payload printed flag mismatch')
if (record.safety?.secretPayloadPersisted !== false) fail('secret payload persisted flag mismatch')
if (record.safety?.providerModelCall !== false) fail('provider/model call flag mismatch')
if (record.safety?.providerModelPolicyClosure !== 'completed_docs_only_no_runtime_calls') fail('provider policy closure safety mismatch')
if (record.safety?.providerSecretPayloadAccess !== false) fail('provider secret payload flag mismatch')
if (record.safety?.rawPromptExecution !== false) fail('raw prompt execution flag mismatch')
if (record.safety?.previewRenderExecution !== 'confirmation_gated_generated_local_remotion_preview_fixture_only') fail('preview render execution scope mismatch')
if (record.safety?.remotionExecution !== 'confirmation_gated_generated_local_remotion_preview_fixture_only') fail('Remotion execution scope mismatch')
if (record.safety?.directFfmpegCommandExecutionByRunner !== false) fail('direct FFmpeg command flag mismatch')
if (record.safety?.ffprobeExecution !== false) fail('FFprobe flag mismatch')
if (record.safety?.qaCleanupObservabilityRollbackReviewRuntimeExecution !== false) fail('QA cleanup review runtime flag mismatch')
if (record.safety?.releaseGoNoGoApproved !== true) fail('release go/no-go approval flag mismatch')
if (record.safety?.controlledExternalBetaEnablement !== false) fail('controlled external beta enablement flag mismatch')
if (record.safety?.privateMediaProcessing !== false) fail('private media processing flag mismatch')
if (record.safety?.userMediaProcessing !== false) fail('user media processing flag mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-product-beta-current-readiness-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}
if (
  packageJson.scripts?.['rp-external-beta-qa-cleanup-observability-rollback-review-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qa-cleanup-observability-rollback-review-1-diagnostics.mjs'
) {
  fail('missing QA cleanup diagnostics script')
}
if (
  packageJson.scripts?.['rp-external-beta-release-go-no-go-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-release-go-no-go-1-diagnostics.mjs'
) {
  fail('missing release go/no-go diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowed = new Set([
  ...requiredFiles,
  ...mainTargetMigrationSyncFiles,
  ...mainSupabaseServiceRoleRuntimeValidationFiles,
  ...approvedSnapshotGuardedRemoteWriteFiles,
  ...creditReservationLedgerGuardedRemoteWriteFiles,
  ...jobQueueLeaseEventGuardedRemoteWriteFiles,
  ...privateArtifactStorageAccessGuardedRemoteWriteFiles,
  ...serviceRoleRouteRuntimeValidationFiles,
  ...approvedSnapshotRouteWriteRuntimeValidationFiles,
  ...remotionPrivatePreviewExportRuntimeValidationFiles,
  ...providerModelCallPolicyClosureFiles,
  ...qaCleanupObservabilityRollbackReviewFiles,
  ...releaseGoNoGoFiles,
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
console.log('Decision: approved_external_beta_release_go_no_go_source_chain_accepted')
console.log('External product beta readiness: ready_for_controlled_external_beta_enablement')
console.log('External beta unlocked: false')
console.log('SQL mutation: guarded_main_staging_migration_apply_grant_hardening_transaction_rolled_back_snapshot_fixture_credit_fixture_job_queue_fixture_and_private_artifact_metadata_fixture_plus_generated_route_metadata_fixture_and_generated_approved_snapshot_route_fixture_setup_cleanup_only')
