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
  'scripts/validation/rp-external-beta-controlled-enablement-1-diagnostics.mjs',
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

const controlledEnablementFiles = [
  'docs/external-beta/controlled-enablement-1/source-audit.md',
  'docs/external-beta/controlled-enablement-1/flag-boundary.md',
  'docs/external-beta/controlled-enablement-1/rollback-boundary.md',
  'docs/external-beta/controlled-enablement-1/controlled-enablement-record.json',
  'docs/external-beta/controlled-enablement-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-controlled-enablement-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-staging-flag-application-1.md',
  'server/config/external-beta-controlled-enablement-contract.ts',
  'server/smoke/external-beta-controlled-enablement-contract-smoke.ts',
  'scripts/validation/rp-external-beta-controlled-enablement-1-diagnostics.mjs',
]

const stagingFlagApplicationFiles = [
  'docs/external-beta/staging-flag-application-1/source-audit.md',
  'docs/external-beta/staging-flag-application-1/flag-application-attempt.md',
  'docs/external-beta/staging-flag-application-1/staging-flag-application-record.json',
  'docs/external-beta/staging-flag-application-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-staging-flag-application-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-staging-flag-application-1r-after-gcloud-reauth.md',
  'scripts/validation/rp-external-beta-staging-flag-application-1-diagnostics.mjs',
]

const stagingFlagApplication1rFiles = [
  'docs/external-beta/staging-flag-application-1r-after-gcloud-reauth/source-audit.md',
  'docs/external-beta/staging-flag-application-1r-after-gcloud-reauth/flag-application-evidence.md',
  'docs/external-beta/staging-flag-application-1r-after-gcloud-reauth/rollback-boundary.md',
  'docs/external-beta/staging-flag-application-1r-after-gcloud-reauth/staging-flag-application-record.json',
  'docs/external-beta/staging-flag-application-1r-after-gcloud-reauth/validation-results.md',
  'docs/activation-phase-rp-external-beta-staging-flag-application-1r-after-gcloud-reauth-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-smoke-validation-1.md',
  'scripts/validation/rp-external-beta-staging-flag-application-1r-diagnostics.mjs',
]

const controlledSmokeValidationFiles = [
  'docs/external-beta/controlled-smoke-validation-1/source-audit.md',
  'docs/external-beta/controlled-smoke-validation-1/smoke-evidence.md',
  'docs/external-beta/controlled-smoke-validation-1/safety-boundary.md',
  'docs/external-beta/controlled-smoke-validation-1/controlled-smoke-record.json',
  'docs/external-beta/controlled-smoke-validation-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-controlled-smoke-validation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-access-1.md',
  'scripts/validation/rp-external-beta-controlled-smoke-validation-1-diagnostics.mjs',
]

const controlledPrivateInviteAccessFiles = [
  'docs/external-beta/controlled-private-invite-access-1/source-audit.md',
  'docs/external-beta/controlled-private-invite-access-1/invite-access-policy.md',
  'docs/external-beta/controlled-private-invite-access-1/iam-readback.md',
  'docs/external-beta/controlled-private-invite-access-1/safety-boundary.md',
  'docs/external-beta/controlled-private-invite-access-1/controlled-private-invite-access-record.json',
  'docs/external-beta/controlled-private-invite-access-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-controlled-private-invite-access-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1.md',
  'scripts/validation/rp-external-beta-controlled-private-invite-access-1-diagnostics.mjs',
]

const controlledPrivateInviteIamGrantFiles = [
  'docs/external-beta/controlled-private-invite-iam-grant-1/source-audit.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1/iam-grant-blocker.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1/rollback-and-smoke-plan.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1/safety-boundary.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1/controlled-private-invite-iam-grant-record.json',
  'docs/external-beta/controlled-private-invite-iam-grant-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-controlled-private-invite-iam-grant-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-private-invite-iam-grant-1r-after-identity-list.md',
  'scripts/validation/rp-external-beta-controlled-private-invite-iam-grant-1-diagnostics.mjs',
]

const controlledPrivateInviteIamInheritanceAuditFiles = [
  'docs/external-beta/controlled-private-invite-iam-inheritance-audit-1/source-audit.md',
  'docs/external-beta/controlled-private-invite-iam-inheritance-audit-1/project-iam-inheritance-audit.md',
  'docs/external-beta/controlled-private-invite-iam-inheritance-audit-1/safety-boundary.md',
  'docs/external-beta/controlled-private-invite-iam-inheritance-audit-1/controlled-private-invite-iam-inheritance-audit-record.json',
  'docs/external-beta/controlled-private-invite-iam-inheritance-audit-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-controlled-private-invite-iam-inheritance-audit-1-results.md',
  'scripts/validation/rp-external-beta-controlled-private-invite-iam-inheritance-audit-1-diagnostics.mjs',
]

const controlledPrivateInviteIamGrant1rFiles = [
  'docs/external-beta/controlled-private-invite-iam-grant-1r-after-identity-list/source-audit.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1r-after-identity-list/iam-grant-result.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1r-after-identity-list/smoke-readback.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1r-after-identity-list/rollback-and-membership-plan.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1r-after-identity-list/safety-boundary.md',
  'docs/external-beta/controlled-private-invite-iam-grant-1r-after-identity-list/controlled-private-invite-iam-grant-1r-record.json',
  'docs/external-beta/controlled-private-invite-iam-grant-1r-after-identity-list/validation-results.md',
  'docs/activation-phase-rp-external-beta-controlled-private-invite-iam-grant-1r-results.md',
  'scripts/validation/rp-external-beta-controlled-private-invite-iam-grant-1r-diagnostics.mjs',
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
  'completed_controlled_external_beta_enablement_source_contract_default_off',
  'blocked_gcloud_reauthentication_required_before_staging_flag_application',
  'completed_controlled_external_beta_staging_flag_application',
  'completed_controlled_private_invite_iam_grant_for_owner_managed_group',
  'blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant',
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
  'External product beta readiness: `ready_for_owner_managed_external_beta_tester_membership_addition`',
  'External beta enabled in this phase: `true`',
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
  'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH',
  'RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1',
  'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1',
  'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1',
  'RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST',
  'completed_controlled_external_beta_authenticated_staging_smoke_validation',
  'completed_authenticated_health_readiness_source_status_smoke_only',
  'controlled_external_beta_smoke_validated_authenticated_staging_api',
  'completed_controlled_private_invite_access_policy_no_access_mutation',
  'completed_docs_only_invite_access_policy_and_iam_readback_no_access_grants',
  'completed_docs_only_iam_grant_blocker_review_no_access_mutation',
  'completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant',
  'completed_readonly_project_iam_policy_analysis_no_iam_mutation',
  'completed_readonly_project_iam_inheritance_audit_no_broad_invoker',
  'blocked_pending_explicit_invite_identity_for_controlled_private_access_grant',
  'ready_for_owner_managed_external_beta_tester_membership_addition',
  'not_run_missing_explicit_identity_list',
  'not_present_in_source',
  'external-beta-testers@reeditpro.com',
  'group:external-beta-testers@reeditpro.com',
  'groups/0279ka651g62ifo',
  'Project-level `roles/run.invoker` binding count: `1`',
  'Project-level `roles/run.invoker` member classes: `serviceAccount`',
  'Broad inherited Cloud Run invoker access: `false`',
  'service-level `allUsers` invoker binding `false`',
  'service-level `allAuthenticatedUsers` invoker binding `false`',
  'service-level binding count `0`',
  'authenticated `/health`: `200`',
  'authenticated `/ready`: `200`',
  'authenticated `/api/runtime/status`: `200`',
  'unauthenticated access returned `403`',
  'runtime stayed `mock` / `mockOnly: true`',
  'reeditpro-staging-api-00005-7gs',
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
  'server/config/external-beta-controlled-enablement-contract.ts',
  'server/config/internal-beta-supabase-credential-context-contract.ts',
  'server/smoke/external-beta-controlled-enablement-contract-smoke.ts',
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
if (record.decision !== 'completed_controlled_private_invite_iam_grant_for_owner_managed_group') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_current_beta_readiness_rollup_no_runtime_execution') fail('record execution mismatch')
if (record.integrationHead !== '4ff3b917b9544ba04af0a73dfec3ec0c961b0b98') fail('integration head mismatch')
if (record.statuses?.externalProductBeta !== 'ready_for_owner_managed_external_beta_tester_membership_addition') fail('external beta status mismatch')
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
if (record.sourceClosure?.controlledEnablement !== 'rp_external_beta_controlled_enablement_1') fail('controlled enablement source mismatch')
if (record.sourceClosure?.stagingFlagApplication !== 'rp_external_beta_staging_flag_application_1') fail('staging flag application source mismatch')
if (record.sourceClosure?.stagingFlagApplication1r !== 'rp_external_beta_staging_flag_application_1r_after_gcloud_reauth') fail('staging flag application 1R source mismatch')
if (record.sourceClosure?.controlledSmokeValidation !== 'rp_external_beta_controlled_smoke_validation_1') fail('controlled smoke validation source mismatch')
if (record.sourceClosure?.controlledPrivateInviteAccess !== 'rp_external_beta_controlled_private_invite_access_1') fail('controlled private invite access source mismatch')
if (record.sourceClosure?.controlledPrivateInviteIamGrant !== 'rp_external_beta_controlled_private_invite_iam_grant_1') fail('controlled private invite IAM grant source mismatch')
if (record.sourceClosure?.controlledPrivateInviteIamInheritanceAudit !== 'rp_external_beta_controlled_private_invite_iam_inheritance_audit_1') fail('controlled private invite IAM inheritance audit source mismatch')
if (record.sourceClosure?.controlledPrivateInviteIamGrant1r !== 'rp_external_beta_controlled_private_invite_iam_grant_1r_after_identity_list') fail('controlled private invite IAM grant 1R source mismatch')
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
if (record.mainSupabaseTarget?.controlledEnablement !== 'completed_controlled_external_beta_enablement_source_contract_default_off') fail('controlled enablement status mismatch')
if (record.mainSupabaseTarget?.externalBetaSourceContract !== 'ready_for_explicit_staging_flag_application') fail('external beta source contract mismatch')
if (record.mainSupabaseTarget?.externalBetaEnabledInThisPhase !== true) fail('external beta enabled in this phase mismatch')
if (record.mainSupabaseTarget?.stagingFlagApplicationRequired !== true) fail('staging flag application required flag mismatch')
if (record.mainSupabaseTarget?.stagingFlagApplication !== 'completed_controlled_external_beta_staging_flag_application') fail('staging flag application status mismatch')
if (record.mainSupabaseTarget?.stagingFlagApplicationBlocker !== 'closed') fail('staging flag blocker mismatch')
if (record.mainSupabaseTarget?.cloudRunServiceDiscovery !== 'completed') fail('Cloud Run service discovery status mismatch')
if (record.mainSupabaseTarget?.cloudRunService !== 'reeditpro-staging-api') fail('Cloud Run service mismatch')
if (record.mainSupabaseTarget?.cloudRunRegion !== 'us-central1') fail('Cloud Run region mismatch')
if (record.mainSupabaseTarget?.cloudRunPreviousReadyRevision !== 'reeditpro-staging-api-00004-4lh') fail('Cloud Run previous revision mismatch')
if (record.mainSupabaseTarget?.cloudRunLatestReadyRevision !== 'reeditpro-staging-api-00005-7gs') fail('Cloud Run latest revision mismatch')
if (record.mainSupabaseTarget?.cloudRunTraffic !== '100_percent_latest_revision') fail('Cloud Run traffic mismatch')
if (record.mainSupabaseTarget?.environmentMutation !== 'completed_controlled_staging_api_env_update') fail('environment mutation status mismatch')
if (record.mainSupabaseTarget?.deployment !== 'completed_cloud_run_revision_for_staging_api') fail('deployment status mismatch')
if (record.mainSupabaseTarget?.controlledSmokeValidation !== 'completed_controlled_external_beta_authenticated_staging_smoke_validation') fail('controlled smoke validation status mismatch')
if (record.mainSupabaseTarget?.unauthenticatedAccess !== 'blocked_403') fail('unauthenticated access mismatch')
if (record.mainSupabaseTarget?.authenticatedHealth !== 'passed_200') fail('authenticated health mismatch')
if (record.mainSupabaseTarget?.authenticatedReadiness !== 'passed_200_ready_endpoint') fail('authenticated readiness mismatch')
if (record.mainSupabaseTarget?.authenticatedRuntimeStatus !== 'passed_200') fail('authenticated runtime status mismatch')
if (record.mainSupabaseTarget?.runtimeMode !== 'mock') fail('runtime mode mismatch')
if (record.mainSupabaseTarget?.mockOnly !== true) fail('mock-only flag mismatch')
if (record.mainSupabaseTarget?.providerRealCallsEnabled !== false) fail('provider real call flag mismatch')
if (record.mainSupabaseTarget?.controlledPrivateInviteAccess !== 'completed_controlled_private_invite_access_policy_no_access_mutation') fail('controlled private invite access status mismatch')
if (record.mainSupabaseTarget?.privateInviteAccessExecution !== 'completed_docs_only_invite_access_policy_and_iam_readback_no_access_grants') fail('controlled private invite access execution mismatch')
if (record.mainSupabaseTarget?.cloudRunIamPolicyReadback !== 'completed_readonly_no_service_level_public_invoker_binding') fail('Cloud Run IAM readback status mismatch')
if (record.mainSupabaseTarget?.cloudRunIamServiceLevelBindingCount !== 0) fail('Cloud Run IAM binding count mismatch')
if (record.mainSupabaseTarget?.cloudRunAllUsersInvoker !== false) fail('Cloud Run allUsers invoker mismatch')
if (record.mainSupabaseTarget?.cloudRunAllAuthenticatedUsersInvoker !== false) fail('Cloud Run allAuthenticatedUsers invoker mismatch')
if (record.mainSupabaseTarget?.inviteAccessGrantMutation !== false) fail('invite access grant mutation mismatch')
if (record.mainSupabaseTarget?.approvedInviteSource !== 'explicit_identity_list_required_before_grant') fail('approved invite source mismatch')
if (record.mainSupabaseTarget?.privateInviteAccessReadiness !== 'ready_for_owner_managed_external_beta_tester_membership_addition') fail('private invite readiness mismatch')
if (record.mainSupabaseTarget?.controlledPrivateInviteIamGrant !== 'completed_controlled_private_invite_iam_grant_for_owner_managed_group') fail('private invite IAM grant status mismatch')
if (record.mainSupabaseTarget?.privateInviteIamGrantExecution !== 'completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant') fail('private invite IAM grant execution mismatch')
if (record.mainSupabaseTarget?.privateInviteIamGrant !== 'completed_group_roles_run_invoker_on_reeditpro_staging_api') fail('private invite IAM grant mismatch')
if (record.mainSupabaseTarget?.explicitInvitedIdentityList !== 'owner_managed_google_group') fail('explicit invited identity list mismatch')
if (record.mainSupabaseTarget?.approvedGoogleGroup !== 'external-beta-testers@reeditpro.com') fail('approved Google Group mismatch')
if (record.mainSupabaseTarget?.approvedGoogleGroupResource !== 'groups/0279ka651g62ifo') fail('approved Google Group resource mismatch')
if (record.mainSupabaseTarget?.cloudIdentityApiEnablement !== 'completed') fail('Cloud Identity API enablement mismatch')
if (record.mainSupabaseTarget?.cloudRunIamMutation !== true) fail('Cloud Run IAM mutation mismatch')
if (record.mainSupabaseTarget?.cloudRunIamMutationScope !== 'roles/run.invoker_on_reeditpro-staging-api_for_group_external-beta-testers_only') fail('Cloud Run IAM mutation scope mismatch')
if (record.mainSupabaseTarget?.cloudRunIamServiceLevelBindingCountAfterGrant !== 1) fail('Cloud Run IAM binding count after grant mismatch')
if (record.mainSupabaseTarget?.cloudRunIamServiceLevelMemberAfterGrant !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run IAM member after grant mismatch')
if (record.mainSupabaseTarget?.cloudRunServiceUpdate !== false) fail('Cloud Run service update mismatch')
if (record.mainSupabaseTarget?.cloudRunInviteGrantAllUsers !== false) fail('Cloud Run allUsers grant mismatch')
if (record.mainSupabaseTarget?.cloudRunInviteGrantAllAuthenticatedUsers !== false) fail('Cloud Run allAuthenticatedUsers grant mismatch')
if (record.mainSupabaseTarget?.controlledPrivateInviteIamGrant1r !== 'completed_controlled_private_invite_iam_grant_for_owner_managed_group') fail('private invite IAM grant 1R status mismatch')
if (record.mainSupabaseTarget?.postGrantUnauthenticatedHealth !== 'blocked_403') fail('post-grant unauthenticated health mismatch')
if (record.mainSupabaseTarget?.postGrantAuthenticatedHealth !== 'passed_200') fail('post-grant authenticated health mismatch')
if (record.mainSupabaseTarget?.postGrantAuthenticatedReady !== 'passed_200') fail('post-grant authenticated ready mismatch')
if (record.mainSupabaseTarget?.postGrantAuthenticatedRuntimeStatus !== 'passed_200') fail('post-grant runtime status mismatch')
if (record.mainSupabaseTarget?.controlledPrivateInviteIamInheritanceAudit !== 'completed_readonly_project_iam_inheritance_audit_no_broad_invoker') fail('private invite IAM inheritance audit status mismatch')
if (record.mainSupabaseTarget?.projectLevelRunInvokerBindingCount !== 1) fail('project-level run.invoker binding count mismatch')
if (record.mainSupabaseTarget?.projectLevelRunInvokerMemberCount !== 1) fail('project-level run.invoker member count mismatch')
if (record.mainSupabaseTarget?.projectLevelRunInvokerMemberClasses?.join(',') !== 'serviceAccount') fail('project-level run.invoker member classes mismatch')
if (record.mainSupabaseTarget?.projectLevelRunInvokerUserMemberCount !== 0) fail('project-level run.invoker user count mismatch')
if (record.mainSupabaseTarget?.projectLevelRunInvokerGroupMemberCount !== 0) fail('project-level run.invoker group count mismatch')
if (record.mainSupabaseTarget?.projectLevelRunInvokerDomainMemberCount !== 0) fail('project-level run.invoker domain count mismatch')
if (record.mainSupabaseTarget?.projectLevelRunInvokerAllUsersMemberCount !== 0) fail('project-level run.invoker allUsers count mismatch')
if (record.mainSupabaseTarget?.projectLevelRunInvokerAllAuthenticatedUsersMemberCount !== 0) fail('project-level run.invoker allAuthenticatedUsers count mismatch')
if (record.mainSupabaseTarget?.broadInheritedCloudRunInvokerAccess !== false) fail('broad inherited Cloud Run invoker mismatch')
if (record.mainSupabaseTarget?.sanitizedProjectIamPrincipalNamesRecorded !== false) fail('project IAM principal sanitization mismatch')
if (record.mainSupabaseTarget?.nextMilestone !== 'add_or_remove_external_beta_testers_by_google_group_membership') fail('next milestone mismatch')
if (record.requiredNextOwnerDecision?.[0] !== 'add_or_remove_external_beta_testers_by_google_group_membership') fail('controlled private invite next decision mismatch')
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
if (record.safety?.controlledExternalBetaEnablementSourceContract !== true) fail('controlled external beta source contract flag mismatch')
if (record.safety?.stagingFlagApplication !== 'completed_controlled_external_beta_staging_flag_application') fail('staging flag application safety mismatch')
if (record.safety?.cloudRunServiceUpdated !== true) fail('Cloud Run service update safety mismatch')
if (record.safety?.cloudRunServiceUpdatedName !== 'reeditpro-staging-api') fail('Cloud Run service update name mismatch')
if (record.safety?.deploymentPerformed !== true) fail('deployment performed safety mismatch')
if (record.safety?.deploymentScope !== 'cloud_run_staging_api_revision_only') fail('deployment scope mismatch')
if (record.safety?.externalBetaEnvironmentUnlock !== true) fail('external beta environment unlock mismatch')
if (record.safety?.externalBetaEnvironmentUnlockScope !== 'controlled_staging_api_private_preview_only') fail('external beta environment unlock scope mismatch')
if (record.safety?.controlledSmokeValidation !== 'completed_authenticated_health_readiness_source_status_smoke_only') fail('controlled smoke safety mismatch')
if (record.safety?.authenticatedHealthReadinessRouteExecution !== 'safe_get_health_ready_runtime_status_only') fail('authenticated health/readiness route scope mismatch')
if (record.safety?.unauthenticatedAccessPublicOpen !== false) fail('unauthenticated public access flag mismatch')
if (record.safety?.controlledPrivateInviteAccess !== 'completed_docs_only_invite_access_policy_and_readonly_iam_readback') fail('controlled private invite safety mismatch')
if (record.safety?.controlledPrivateInviteIamGrant !== 'completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant') fail('controlled private invite IAM grant safety mismatch')
if (record.safety?.controlledPrivateInviteIamGrant1r !== 'completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant') fail('controlled private invite IAM grant 1R safety mismatch')
if (record.safety?.controlledPrivateInviteIamInheritanceAudit !== 'completed_readonly_project_iam_policy_analysis_no_iam_mutation') fail('controlled private invite IAM inheritance audit safety mismatch')
if (record.safety?.cloudRunIamPolicyReadback !== true) fail('Cloud Run IAM policy readback safety mismatch')
if (record.safety?.cloudRunIamPolicyMutation !== true) fail('Cloud Run IAM mutation safety mismatch')
if (record.safety?.cloudRunIamMutationScope !== 'roles/run.invoker_on_reeditpro-staging-api_for_group_external-beta-testers_only') fail('Cloud Run IAM mutation scope safety mismatch')
if (record.safety?.projectIamPolicyReadback !== true) fail('project IAM policy readback safety mismatch')
if (record.safety?.projectIamPolicyMutation !== false) fail('project IAM policy mutation safety mismatch')
if (record.safety?.projectLevelRunInvokerAllUsers !== false) fail('project-level allUsers invoker safety mismatch')
if (record.safety?.projectLevelRunInvokerAllAuthenticatedUsers !== false) fail('project-level allAuthenticatedUsers invoker safety mismatch')
if (record.safety?.broadInheritedCloudRunInvokerGrant !== false) fail('broad inherited invoker grant safety mismatch')
if (record.safety?.sanitizedProjectIamPrincipalNamesRecorded !== false) fail('project IAM principal sanitization safety mismatch')
if (record.safety?.inviteGrantMutation !== true) fail('invite grant mutation safety mismatch')
if (record.safety?.inviteGrantMutationScope !== 'owner_managed_google_group_on_staging_api_only') fail('invite grant mutation scope safety mismatch')
if (record.safety?.broadPublicInvokerGrant !== false) fail('broad public invoker grant safety mismatch')
if (record.safety?.allUsersGrant !== false) fail('allUsers grant safety mismatch')
if (record.safety?.allAuthenticatedUsersGrant !== false) fail('allAuthenticatedUsers grant safety mismatch')
if (record.safety?.explicitInviteIdentityListPresent !== true) fail('explicit invite identity list safety mismatch')
if (record.safety?.approvedGoogleGroup !== 'external-beta-testers@reeditpro.com') fail('approved Google Group safety mismatch')
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
if (
  packageJson.scripts?.['smoke:external-beta-controlled-enablement-contract'] !==
  'tsx server/smoke/external-beta-controlled-enablement-contract-smoke.ts'
) {
  fail('missing controlled enablement smoke script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-enablement-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-enablement-1-diagnostics.mjs'
) {
  fail('missing controlled enablement diagnostics script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-smoke-validation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-smoke-validation-1-diagnostics.mjs'
) {
  fail('missing controlled smoke diagnostics script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-private-invite-access-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-private-invite-access-1-diagnostics.mjs'
) {
  fail('missing controlled private invite access diagnostics script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-private-invite-iam-grant-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-private-invite-iam-grant-1-diagnostics.mjs'
) {
  fail('missing controlled private invite IAM grant diagnostics script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-private-invite-iam-inheritance-audit-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-private-invite-iam-inheritance-audit-1-diagnostics.mjs'
) {
  fail('missing controlled private invite IAM inheritance audit diagnostics script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-private-invite-iam-grant-1r:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-private-invite-iam-grant-1r-diagnostics.mjs'
) {
  fail('missing controlled private invite IAM grant 1R diagnostics script')
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
  ...controlledEnablementFiles,
  ...stagingFlagApplicationFiles,
  ...stagingFlagApplication1rFiles,
  ...controlledSmokeValidationFiles,
  ...controlledPrivateInviteAccessFiles,
  ...controlledPrivateInviteIamGrantFiles,
  ...controlledPrivateInviteIamInheritanceAuditFiles,
  ...controlledPrivateInviteIamGrant1rFiles,
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
console.log('Decision: completed_controlled_private_invite_iam_grant_for_owner_managed_group')
console.log('External product beta readiness: ready_for_owner_managed_external_beta_tester_membership_addition')
console.log('External beta enabled in this phase: true')
console.log('SQL mutation: guarded_main_staging_migration_apply_grant_hardening_transaction_rolled_back_snapshot_fixture_credit_fixture_job_queue_fixture_and_private_artifact_metadata_fixture_plus_generated_route_metadata_fixture_and_generated_approved_snapshot_route_fixture_setup_cleanup_only')
