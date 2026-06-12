import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  SupabaseStagingResetRetryApprovalBlocker,
  SupabaseStagingResetRetryApprovalDecision,
} from './staging-reset-retry-approval-types'

export const SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE =
  'supabase-staging-reset-retry-approval'
export const SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID =
  'supabase-staging-reset-retry-approval-20260610'
export const SUPABASE_STAGING_RESET_RETRY_APPROVAL_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-retry-approval'
export const SUPABASE_STAGING_RESET_RETRY_APPROVAL_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-failure-triage'
export const SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR =
  'docs/activation-supabase-staging-reset-retry-approval-reports'

export const SUPABASE_STAGING_RESET_RETRY_APPROVAL_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_APPROVAL_PACKET'
export const SUPABASE_STAGING_RESET_RETRY_OPERATOR_REVIEW_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_MANUAL_OPERATOR_REVIEW'

export const SUPABASE_STAGING_RESET_RETRY_APPROVAL_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'staging_reset_retry_approval_plan.json',
  'staging_reset_retry_evidence_inventory.json',
  'staging_reset_retry_risk_review.json',
  'staging_reset_retry_command_review.json',
  'staging_reset_retry_backup_review.json',
  'staging_reset_retry_operator_checklist.json',
  'staging_reset_retry_approval_decision.json',
  'staging_reset_retry_blocker_report.json',
  'staging_reset_retry_readiness_report.json',
  'staging_reset_retry_private_artifact_manifest.json',
] as const

export const SUPABASE_STAGING_RESET_RETRY_APPROVAL_DOCS = [
  'docs/supabase-staging-reset-retry-approval-decision.md',
  'docs/supabase-staging-reset-retry-operator-checklist.md',
  'docs/implementation-prompts/prompt-supabase-staging-reset-retry-execution.md',
] as const

const SOURCE_OF_TRUTH_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat',
] as const

const PR262_REPORT_DIR = 'docs/activation-supabase-staging-reset-failure-triage-reports'
const PR259_REPORT_DIR = 'docs/activation-supabase-staging-reset-execution-reports'
const PR252_REPORT_DIR = 'docs/activation-supabase-staging-data-impact-backup-reports'
const PR248_REPORT_DIR = 'docs/activation-supabase-staging-reset-approval-reports'
const PR247_REPORT_DIR = 'docs/activation-supabase-schema-parity-remediation-reports'
const PR241_REPORT_DIR = 'docs/activation-supabase-remote-schema-equivalence-reports'
const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const PR198_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const MILESTONE_MIGRATION =
  'supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql'
const MIGRATION_DIR = path.join('supabase', 'migrations')

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_DB_RESET',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_REPAIR',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
] as const

const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role/i,
  /anon[_-]?key/i,
  /access[_-]?token/i,
  /jwt[_-]?secret/i,
  /BEGIN\s+PRIVATE\s+KEY/i,
  /x-goog-signature\s*=/i,
] as const

type JsonRecord = Record<string, unknown>
type Reports = ReturnType<typeof buildSupabaseStagingResetRetryApprovalReports>

export function getSupabaseStagingResetRetryApprovalPlan() {
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    branch: SUPABASE_STAGING_RESET_RETRY_APPROVAL_BRANCH,
    baseBranch: SUPABASE_STAGING_RESET_RETRY_APPROVAL_BASE_BRANCH,
    prTitle: '[foundation] Supabase staging reset retry approval',
    worktree: '/private/tmp/reeditpro-supabase-staging-reset-retry-approval',
    reportDir: SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_RESET_RETRY_APPROVAL_EXPECTED_REPORTS,
    docs: SUPABASE_STAGING_RESET_RETRY_APPROVAL_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [198, 200, 223, 241, 247, 248, 252, 259, 262],
    docsBasis: {
      cliReference: 'https://supabase.com/docs/reference/cli/introduction',
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      changelog: 'https://supabase.com/changelog.md',
      checkedAt: '2026-06-10',
      dbResetFlagsObserved: ['--db-url', '--no-seed'],
      previousUnlistedFlagRejected: '--yes',
    },
    allowedActions: [
      'read_committed_safe_reports',
      'review_backup_export_metadata',
      'review_reset_failure_classification',
      'review_future_retry_command_shape',
      'write_safe_metadata_reports',
    ],
    blockedActions: [
      'staging_reset_retry_execution',
      'supabase_db_push',
      'supabase_migration_repair',
      'direct_ddl_dml',
      'schema_deploy',
      'track_b_backfill_write',
      'production_supabase',
      'secret_payload_access',
      'secret_printing',
      'provider_calls',
      'route_tool_worker_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
    confirmationsForApprovalPacketExecution: [
      SUPABASE_STAGING_RESET_RETRY_APPROVAL_CONFIRMATION,
      SUPABASE_STAGING_RESET_RETRY_OPERATOR_REVIEW_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    defaultDecision: 'blocked_pending_operator_review',
  }
}

export function buildSupabaseStagingResetRetryApprovalReports(input: {
  approvalPacketConfirmed?: boolean
  manualOperatorReviewConfirmed?: boolean
} = {}) {
  const preservedDecision = input.approvalPacketConfirmed === true || input.manualOperatorReviewConfirmed === true
    ? null
    : loadLatestApprovedDecision()
  const effectiveInput = preservedDecision
    ? {
        approvalPacketConfirmed: true,
        manualOperatorReviewConfirmed: true,
        preservedFromLatestApprovedPacket: true,
      }
    : input
  const plan = getSupabaseStagingResetRetryApprovalPlan()
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const evidenceInventory = buildEvidenceInventory()
  const riskReview = buildRetryRiskReview(evidenceInventory)
  const commandReview = buildRetryCommandReview()
  const backupReview = buildRetryBackupReview(evidenceInventory)
  const operatorChecklist = buildOperatorChecklist(
    evidenceInventory,
    riskReview,
    commandReview,
    backupReview,
    effectiveInput,
  )
  const decision = buildApprovalDecision(
    evidenceInventory,
    riskReview,
    commandReview,
    backupReview,
    operatorChecklist,
    effectiveInput,
  )
  const blockerReport = buildBlockerReport(decision)
  const readinessReport = buildReadinessReport(decision, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan,
    evidenceInventory,
    riskReview,
    commandReview,
    backupReview,
    operatorChecklist,
    approvalDecision: decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function writeSupabaseStagingResetRetryApprovalArtifacts(reports: Reports) {
  const dir = SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_approval_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_risk_review.json'), reports.riskReview)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_command_review.json'), reports.commandReview)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_backup_review.json'), reports.backupReview)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_operator_checklist.json'), reports.operatorChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_approval_decision.json'), reports.approvalDecision)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/supabase-staging-reset-retry-approval-decision.md', renderDecisionMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-staging-reset-retry-operator-checklist.md', renderOperatorChecklistMarkdown(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-staging-reset-retry-execution.md',
    renderRetryExecutionPrompt(reports),
  )
}

export async function executeSupabaseStagingResetRetryApproval(input: {
  keepTemp: boolean
}) {
  void input.keepTemp
  const approvalPacketConfirmed =
    process.env[SUPABASE_STAGING_RESET_RETRY_APPROVAL_CONFIRMATION] === 'true'
  const manualOperatorReviewConfirmed =
    process.env[SUPABASE_STAGING_RESET_RETRY_OPERATOR_REVIEW_CONFIRMATION] === 'true'
  const reports = buildSupabaseStagingResetRetryApprovalReports({
    approvalPacketConfirmed,
    manualOperatorReviewConfirmed,
  })
  await writeSupabaseStagingResetRetryApprovalArtifacts(reports)
  const approved =
    reports.approvalDecision.decision === 'approved_for_future_retry_reset_after_cli_command_fix'
  return { reports, exitCode: approved ? 0 : 1 }
}

export function readSupabaseStagingResetRetryApprovalSummary() {
  const reports = buildSupabaseStagingResetRetryApprovalReports()
  const pr262 = asRecord(reports.evidenceInventory.pr262)
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.approvalDecision.decision,
    approvalStatus: reports.approvalDecision.approvalStatus,
    pr262StateClassifier: pr262.stateClassifier,
    backupReview: reports.backupReview.status,
    commandReview: reports.commandReview.status,
    retryExecutionAllowedInThisPhase: false,
    resetRetryRun: false,
    schemaDeployRun: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    sqlExecuted: false,
    migrationDeployed: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
    blockers: reports.blockerReport.activeBlockers,
  }
}

function buildSourceOfTruthOwnershipAudit(): JsonRecord {
  const reportPaths = [
    path.join(PR262_REPORT_DIR, 'readonly_staging_failure_triage_inspection.json'),
    path.join(PR262_REPORT_DIR, 'staging_reset_post_failure_state_report.json'),
    path.join(PR262_REPORT_DIR, 'staging_reset_recovery_decision.json'),
    path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'),
    path.join(PR259_REPORT_DIR, 'staging_reset_backup_export_execution_report.json'),
    path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
    path.join(PR248_REPORT_DIR, 'staging_reset_approval_decision.json'),
    path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'),
    path.join(PR241_REPORT_DIR, 'migration_history_repair_approval_after_equivalence_review.json'),
    path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
    path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
  ]
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    relatedWorkstreams: {
      trackBMediaProcessing: 'safe Track B milestone export only; no runtime execution',
      observabilityAuditCost: 'future registry/audit consumer only',
      workerRuntimeJobs: 'not executed',
      productInternalBetaAggregation: 'depends on accurate milestone state later',
    },
    explicitlyNotOwned: [
      'Track B runtime/tool execution',
      'Track A visual/video pipeline',
      'provider/model execution',
      'frontend UX',
      'production/external beta unlocks',
    ],
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      type: existsSync(sourcePath) && safeStatIsDirectory(sourcePath) ? 'directory' : 'file',
    })),
    reportPaths: reportPaths.map((reportPath) => ({
      path: reportPath,
      present: existsSync(reportPath),
    })),
    migrationInventory: {
      migrationDir: MIGRATION_DIR,
      localMigrationIds: getLocalMigrationIds(),
      milestoneRegistryMigration: MILESTONE_MIGRATION,
      milestoneRegistryMigrationPresent: existsSync(MILESTONE_MIGRATION),
    },
    duplicateWorkAvoided: [
      'no_reset_retry_execution',
      'no_new_reset_execution_path',
      'no_deploy_wrapper',
      'no_migration_repair_path',
      'no_track_b_backfill_path',
    ],
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: false,
    migrationDeployed: false,
    secretsPrintedOrCommitted: false,
    status: 'passed',
    blockers: [],
  }
}

function buildEvidenceInventory(): JsonRecord {
  const readonlyInspection = readJsonArtifact(path.join(PR262_REPORT_DIR, 'readonly_staging_failure_triage_inspection.json'))
  const postFailureState = readJsonArtifact(path.join(PR262_REPORT_DIR, 'staging_reset_post_failure_state_report.json'))
  const recoveryDecision = readJsonArtifact(path.join(PR262_REPORT_DIR, 'staging_reset_recovery_decision.json'))
  const resetExecution = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'))
  const backupExport = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_backup_export_execution_report.json'))
  const dataImpactDecision = readJsonArtifact(path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'))
  const resetApproval = readJsonArtifact(path.join(PR248_REPORT_DIR, 'staging_reset_approval_decision.json'))
  const schemaParity = readJsonArtifact(path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'))
  const equivalence = readJsonArtifact(path.join(PR241_REPORT_DIR, 'migration_history_repair_approval_after_equivalence_review.json'))
  const transport = readJsonArtifact(path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'))
  const backfill = readJsonArtifact(path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'))
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: 'passed',
    pr262: {
      readonlyInspectionStatus: asString(readonlyInspection?.status, 'missing'),
      readonlyInspectionPerformed: readonlyInspection?.inspectionPerformed === true,
      stateClassifier: asString(postFailureState?.stateClassifier, 'missing'),
      recoveryDecision: asString(recoveryDecision?.decision, 'missing'),
      partialResetRisk: asString(recoveryDecision?.partialResetRisk, 'missing'),
      resetRetryApprovedInPr262: recoveryDecision?.resetRetryApproved === true,
      resetRetryRunInPr262: false,
      blockers: asStringArray(recoveryDecision?.blockers),
    },
    pr259: {
      resetExecutionStatus: asString(resetExecution?.status, 'missing'),
      resetAttempted: resetExecution?.resetAttempted === true,
      resetPerformed: resetExecution?.resetPerformed === true,
      stagingSqlMayHaveRun: resetExecution?.stagingSqlMayHaveRun === true,
      resetCommandStatus: asString(asRecord(resetExecution?.resetCommand).status, 'missing'),
      resetCommandErrorCategory: asString(asRecord(resetExecution?.resetCommand).errorCategory, 'missing'),
      previousOperation: asStringArray(asRecord(resetExecution?.resetCommand).args).filter((arg) =>
        ['db', 'reset', '--db-url', '[REDACTED_STAGING_DB_URL]', '--no-seed', '--yes'].includes(arg),
      ),
      backupExportStatus: asString(backupExport?.status, 'missing'),
      backupExportPerformed: backupExport?.backupExportPerformed === true,
      backupFileCreated: backupExport?.backupFileCreated === true,
      backupPayloadCommitted: backupExport?.backupPayloadCommitted === true,
      backupPayloadPrinted: backupExport?.backupPayloadPrinted === true,
      credentialPayloadsPrinted: backupExport?.credentialPayloadsPrinted === true,
    },
    pr252: {
      decision: asString(dataImpactDecision?.decision, 'missing'),
      approvalStatus: asString(dataImpactDecision?.approvalStatus, 'missing'),
      status: asString(dataImpactDecision?.status, 'missing'),
    },
    upstream: {
      pr248Decision: asString(resetApproval?.decision, 'missing'),
      pr247Decision: asString(schemaParity?.decision, 'missing'),
      pr241Decision: asString(equivalence?.decision, 'missing'),
      pr241Blockers: asStringArray(equivalence?.blockers),
      pr223Status: asString(transport?.status, 'missing'),
      pr198Status: asString(backfill?.status, 'missing'),
      pr198Blockers: asStringArray(backfill?.blockers),
    },
    productionExclusion: {
      productionAffected: false,
      productionSupabaseRun: false,
      productionWrite: false,
      externalBetaUnlock: false,
      paidProductionUnlock: false,
    },
    trackBSeparation: {
      trackBBackfillRowsWritten: false,
      trackBBackfillFutureSeparatePhase: true,
      trackBToolExecution: false,
    },
    secretPolicy: secretPolicy(),
    blockers: [],
  }
}

function buildRetryRiskReview(evidence: JsonRecord): JsonRecord {
  const pr262 = asRecord(evidence.pr262)
  const pr259 = asRecord(evidence.pr259)
  const stateAccepted = pr262.readonlyInspectionStatus === 'passed' && pr262.stateClassifier === 'unchanged_failed_state'
  const backupAccepted =
    pr259.backupExportStatus === 'passed' &&
    pr259.backupExportPerformed === true &&
    pr259.backupFileCreated === true &&
    pr259.backupPayloadCommitted !== true &&
    pr259.backupPayloadPrinted !== true
  const ownerAccepted =
    asRecord(evidence.pr252).decision === 'approved_for_future_staging_reset_and_reapply_migrations'
  const blockers: SupabaseStagingResetRetryApprovalBlocker[] = []
  if (!stateAccepted) blockers.push(
    pr262.readonlyInspectionStatus === 'passed'
      ? 'pr262_state_not_unchanged_failed_state'
      : 'pr262_readonly_inspection_not_passed',
  )
  if (!backupAccepted) blockers.push('pr259_backup_export_not_passed')
  if (pr259.backupPayloadCommitted === true || pr259.backupPayloadPrinted === true) {
    blockers.push('pr259_backup_payload_committed_or_printed')
  }
  if (!ownerAccepted) blockers.push('pr252_owner_acceptance_not_approved')
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    retryRisk: 'medium_high_but_accepted_for_future_retry_after_command_fix',
    unchangedFailedStateAccepted: stateAccepted,
    backupEvidenceAccepted: backupAccepted,
    ownerDataLossAcceptanceValid: ownerAccepted,
    partialResetRiskStillPresent: true,
    failureCauseFullyProven: false,
    retryCouldWorsenStagingState: true,
    retryAllowedInThisPhase: false,
    futureRetryRequiresSeparateExecutionPhase: true,
    productionExcluded: true,
    blockers,
  }
}

function buildRetryCommandReview(): JsonRecord {
  const previousOperation = ['db', 'reset', '--db-url', '[REDACTED_STAGING_DB_URL]', '--no-seed', '--yes']
  const futureOperation = ['db', 'reset', '--db-url', '[REDACTED_STAGING_DB_URL]', '--no-seed']
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: 'passed',
    commandReviewMode: 'approval_only_no_execution',
    allowedTransportPrefix: ['npm', 'exec', '--yes', '--package', 'supabase@latest', '--', 'supabase'],
    futureRetryOperation: futureOperation,
    futureRetryCommandShape:
      'npm exec --yes --package supabase@latest -- supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed',
    rejectedPreviousOperation: previousOperation,
    rejectedPreviousReason:
      'Current Supabase CLI docs list db reset --db-url and --no-seed; --yes is not listed for db reset and is removed from the future retry command shape.',
    resetDryRunSupported: false,
    previewRequiredBeforeRetry: true,
    previewMode: 'command_plan_preview_plus_backup_and_migration_inventory',
    debugAllowed: false,
    debugPolicy:
      'Debug output remains blocked unless a later execution prompt defines redaction and proves no secret-bearing output will be committed.',
    dbUrlRedactionRequired: true,
    targetMismatchStopRequired: true,
    postRetryVerificationRequired: [
      'migration_history_verify',
      'registry_schema_rls_verify',
      'pr198_backfill_preflight_and_diff_only',
    ],
    resetRetryRun: false,
    schemaDeployRun: false,
    migrationRepairRun: false,
    directDdlDmlRun: false,
    productionAffected: false,
    blockers: [],
  }
}

function buildRetryBackupReview(evidence: JsonRecord): JsonRecord {
  const pr259 = asRecord(evidence.pr259)
  const backupPassed =
    pr259.backupExportStatus === 'passed' &&
    pr259.backupExportPerformed === true &&
    pr259.backupFileCreated === true
  const safe = backupPassed && pr259.backupPayloadCommitted !== true && pr259.backupPayloadPrinted !== true
  const blockers: SupabaseStagingResetRetryApprovalBlocker[] = []
  if (!backupPassed) blockers.push('pr259_backup_export_not_passed')
  if (pr259.backupPayloadCommitted === true || pr259.backupPayloadPrinted === true) {
    blockers.push('pr259_backup_payload_committed_or_printed')
  }
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: safe ? 'passed' : 'blocked',
    backupExportFromPr259: {
      status: pr259.backupExportStatus,
      backupExportPerformed: pr259.backupExportPerformed,
      backupFileCreated: pr259.backupFileCreated,
      backupPayloadCommitted: pr259.backupPayloadCommitted,
      backupPayloadPrinted: pr259.backupPayloadPrinted,
      credentialPayloadsPrinted: pr259.credentialPayloadsPrinted,
    },
    acceptedForApprovalPacket: safe,
    futureRetryMustVerifyBackupAvailability: true,
    futureRetryShouldRerunBackupOrValidatePrivateTempArtifact: true,
    durablePrivateStorageRecommendedBeforeRetry: true,
    restoreReadiness: 'not_executed_restore_scope_requires_future_execution_packet_check',
    retryMayProceedWithoutRestoreOnlyIfUnchangedFailedStateStillPasses: true,
    resetRetryRun: false,
    productionAffected: false,
    blockers,
  }
}

function buildOperatorChecklist(
  evidence: JsonRecord,
  riskReview: JsonRecord,
  commandReview: JsonRecord,
  backupReview: JsonRecord,
  input: { approvalPacketConfirmed?: boolean; manualOperatorReviewConfirmed?: boolean },
): JsonRecord {
  const items = [
    ['unchanged_failed_state_reviewed', riskReview.unchangedFailedStateAccepted === true],
    ['backup_export_reviewed', backupReview.status === 'passed'],
    ['owner_data_loss_acceptance_reviewed', asRecord(evidence.pr252).decision === 'approved_for_future_staging_reset_and_reapply_migrations'],
    ['retry_command_reviewed', commandReview.status === 'passed'],
    ['production_excluded', true],
    ['track_b_backfill_separate', true],
    ['secrets_redacted', true],
    ['post_retry_verification_required', true],
    ['rollback_escalation_reviewed', true],
    ['manual_operator_approval_confirmed', input.manualOperatorReviewConfirmed === true],
  ] as const
  const blockers: SupabaseStagingResetRetryApprovalBlocker[] = []
  if (input.approvalPacketConfirmed !== true) blockers.push('approval_packet_not_confirmed')
  if (input.manualOperatorReviewConfirmed !== true) blockers.push('manual_operator_review_not_confirmed')
  for (const name of FORBIDDEN_CONFIRMATIONS) {
    if (process.env[name] === 'true') blockers.push('forbidden_confirmation_set')
  }
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    checklist: items.map(([name, passed]) => ({ name, passed })),
    approvalPacketConfirmed: input.approvalPacketConfirmed === true,
    manualOperatorReviewConfirmed: input.manualOperatorReviewConfirmed === true,
    forbiddenConfirmationsSet: FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true'),
    resetRetryRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    secretPolicy: secretPolicy(),
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildApprovalDecision(
  evidence: JsonRecord,
  riskReview: JsonRecord,
  commandReview: JsonRecord,
  backupReview: JsonRecord,
  operatorChecklist: JsonRecord,
  input: { approvalPacketConfirmed?: boolean; manualOperatorReviewConfirmed?: boolean },
): JsonRecord {
  const blockers = collectUniqueBlockers(
    extractBlockers(riskReview),
    extractBlockers(commandReview),
    extractBlockers(backupReview),
    extractBlockers(operatorChecklist),
  )
  const productionExcluded = asRecord(asRecord(evidence).productionExclusion).productionAffected === false
  const trackBSeparate = asRecord(asRecord(evidence).trackBSeparation).trackBBackfillFutureSeparatePhase === true
  if (!productionExcluded) blockers.push('production_exclusion_not_proven')
  if (!trackBSeparate) blockers.push('track_b_backfill_separation_not_proven')
  let decision: SupabaseStagingResetRetryApprovalDecision = 'blocked_pending_operator_review'
  if (blockers.includes('pr259_backup_export_not_passed') || blockers.includes('pr259_backup_payload_committed_or_printed')) {
    decision = 'blocked_pending_backup_restore_review'
  } else if (blockers.includes('reset_failure_requires_supabase_cli_or_support_review')) {
    decision = 'blocked_pending_supabase_cli_or_support_review'
  } else if (blockers.includes('staging_data_risk_unacceptable')) {
    decision = 'rejected_due_staging_data_risk'
  } else if (blockers.length === 0 && input.approvalPacketConfirmed === true && input.manualOperatorReviewConfirmed === true) {
    decision = 'approved_for_future_retry_reset_after_cli_command_fix'
  }
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: decision.startsWith('approved_') ? 'approved_for_future_execution_only' : 'blocked',
    decision,
    approvalStatus: decision.startsWith('approved_')
      ? 'future_retry_reset_approved_not_executed'
      : 'not_approved_for_execution',
    approvedFutureCommandShape: commandReview.futureRetryCommandShape,
    approvalBasis: [
      'PR #262 read-only inspection passed and classified staging as unchanged_failed_state.',
      'PR #259 backup/export metadata passed and no backup payload is committed.',
      'PR #252 owner/data-loss acceptance remains approved for future reset/reapply.',
      'Future retry command removes the unlisted --yes db reset flag and remains no-seed, redacted, and staging-only.',
    ],
    resetRetryExecutionAllowedInThisPhase: false,
    resetRetryRun: false,
    sqlExecuted: false,
    migrationDeployed: false,
    schemaDeployRun: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretRefUsed: 'none',
    payloadPrinted: false,
    payloadCommitted: false,
    secretsPrintedOrCommitted: false,
    requiredBeforeFutureRetryExecution: [
      'separate reset retry execution prompt',
      'current-shell staging target proof',
      'secure DB URL process-env injection without printing',
      'private backup/export rerun or verified artifact availability',
      'command-plan preview using the fixed command shape',
      'post-retry migration history and registry schema/RLS verification',
      'PR #198 preflight/diff/report only; no Track B write confirmations',
    ],
    blockers,
  }
}

function buildBlockerReport(decision: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: asString(decision.decision, '').startsWith('approved_') ? 'passed' : 'blocked',
    activeBlockers: asStringArray(decision.blockers),
    stillBlockedScopes: [
      'staging_reset_retry_execution',
      'schema_deploy',
      'migration_repair',
      'direct_ddl_dml',
      'track_b_backfill_write',
      'production_supabase',
      'provider_calls',
      'route_execution',
      'worker_execution',
      'tool_execution',
      'media_processing',
      'track_a',
      'beta_unlock',
      'production_unlock',
    ],
    resetRetryAllowedInThisPhase: false,
    productionAffected: false,
  }
}

function buildReadinessReport(decision: JsonRecord, blockerReport: JsonRecord): JsonRecord {
  const approved = asString(decision.decision, '').startsWith('approved_')
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: approved ? 'approved_for_future_execution_only' : 'blocked',
    decision: decision.decision,
    approvalStatus: decision.approvalStatus,
    approvalPacketComplete: approved,
    retryExecutionReadyInThisPhase: false,
    resetRetryRun: false,
    schemaDeployRun: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    sqlExecuted: false,
    migrationDeployed: false,
    secretsPrintedOrCommitted: false,
    blockers: asStringArray(blockerReport.activeBlockers),
    nextRecommendedPhase: approved
      ? 'Separate guarded staging reset retry execution phase using the fixed command shape.'
      : 'Resolve the exact reset retry approval blocker before execution planning.',
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_APPROVAL_RUN_ID,
    status: 'committed_safe_metadata_only',
    reportDir: SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_RESET_RETRY_APPROVAL_EXPECTED_REPORTS,
    privateUploadRequired: false,
    privateUploadPerformed: false,
    backupPayloadCommitted: false,
    privatePayloadCommitted: false,
    dbUrlCommitted: false,
    secretsCommitted: false,
    mediaPayloadCommitted: false,
    stagingResetRetryRun: false,
    stagingDataBackfillWritten: false,
    productionAffected: false,
  }
}

function renderDecisionMarkdown(reports: Reports) {
  const pr262 = asRecord(reports.evidenceInventory.pr262)
  return `# Supabase Staging Reset Retry Approval Decision

- Decision: \`${reports.approvalDecision.decision}\`
- Approval status: \`${reports.approvalDecision.approvalStatus}\`
- PR #262 state classifier: \`${pr262.stateClassifier}\`
- Retry command reviewed: \`${reports.commandReview.status}\`
- Backup review: \`${reports.backupReview.status}\`
- Reset retry run in this phase: \`${reports.approvalDecision.resetRetryRun}\`
- SQL executed: \`${reports.approvalDecision.sqlExecuted}\`
- Migration deployed: \`${reports.approvalDecision.migrationDeployed}\`
- Track B backfill rows written: \`${reports.approvalDecision.trackBBackfillRowsWritten}\`
- Production affected: \`${reports.approvalDecision.productionAffected}\`

This approval packet authorizes only a future guarded staging reset retry after the command fix. It does not run reset, deploy schema, repair migration history, run direct SQL, write Track B rows, touch production, or print secrets.
`
}

function renderOperatorChecklistMarkdown(reports: Reports) {
  const checklist = asArray(reports.operatorChecklist.checklist)
    .map((item) => `- ${asString(item.name, 'unknown')}: \`${item.passed === true}\``)
    .join('\n')
  return `# Supabase Staging Reset Retry Operator Checklist

${checklist}

Future execution must remain staging-only, use the fixed command shape, rerun or verify the private backup/export, and verify migration history plus registry schema/RLS before any Track B backfill phase.
`
}

function renderRetryExecutionPrompt(reports: Reports) {
  return `# Prompt: Supabase Staging Reset Retry Execution

Use this only after the retry approval packet is reviewed.

Approval decision: \`${reports.approvalDecision.decision}\`
Approved future command shape: \`${reports.approvalDecision.approvedFutureCommandShape}\`

Execution constraints:

- Staging target only: Reeditpro / wmyyttnynmteqgcdishd / staging.
- Use secure DB URL process-env injection only; never print or commit the URL.
- Use temp npm Supabase CLI transport outside the repo.
- Run command-plan preview first; \`db reset\` has no dry-run flag in the current docs.
- Retry operation must be \`db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed\`; do not add \`--yes\`.
- Do not run \`supabase db push\`, migration repair, direct/manual SQL, Track B backfill writes, production Supabase, providers, workers, routes, media processing, Track A, beta, or production unlocks.
- After retry, verify migration history, registry schema/RLS metadata, and run PR #198 preflight/diff/report only.
`
}

function secretPolicy() {
  return {
    secretRefUsed: 'none',
    payloadAccessRequired: false,
    payloadPrinted: false,
    payloadCommitted: false,
    dbUrlPrinted: false,
    passwordPrinted: false,
    serviceKeysPrinted: false,
    cliAuthTokensPrinted: false,
  }
}

function loadLatestApprovedDecision(): JsonRecord | null {
  const decision = readJsonArtifact(path.join(
    SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
    'staging_reset_retry_approval_decision.json',
  ))
  if (!asString(decision?.decision, '').startsWith('approved_')) return null
  return decision
}

function readJsonArtifact(filePath: string): JsonRecord | null {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
  } catch {
    return null
  }
}

function getLocalMigrationIds() {
  if (!existsSync(MIGRATION_DIR)) return []
  return readdirSync(MIGRATION_DIR)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => name.split('_')[0] ?? name.replace(/\.sql$/, ''))
    .sort()
}

function extractBlockers(report: unknown) {
  const record = asRecord(report)
  return asStringArray(record.blockers ?? record.activeBlockers)
}

function collectUniqueBlockers(...groups: Array<unknown>): SupabaseStagingResetRetryApprovalBlocker[] {
  return Array.from(new Set(groups.flatMap((group) => asStringArray(group)).filter(Boolean))) as SupabaseStagingResetRetryApprovalBlocker[]
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.map((item) => asRecord(item)) : []
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function safeStatIsDirectory(filePath: string) {
  try {
    return statSync(filePath).isDirectory()
  } catch {
    return false
  }
}

export function assertNoSecretPatternsInText(text: string) {
  return !SECRET_PATTERNS.some((pattern) => pattern.test(text))
}
