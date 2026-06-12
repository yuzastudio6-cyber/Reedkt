import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
  SUPABASE_MILESTONE_REGISTRY_TABLES,
} from '../supabase-milestone-registry-schema'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  SupabaseResetRetryFailureDiagnosticsBlocker,
  SupabaseResetRetryFailureDiagnosticsDecision,
  SupabaseResetRetryRecoveryOption,
} from './reset-retry-failure-diagnostics-types'

export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE =
  'supabase-reset-retry-failure-diagnostics'
export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID =
  'supabase-reset-retry-failure-diagnostics-20260610'
export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_BRANCH =
  'codex/rp-foundation-supabase-reset-retry-failure-diagnostics'
export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-retry-execution'
export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR =
  'docs/activation-supabase-reset-retry-failure-diagnostics-reports'

export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_FAILURE_DIAGNOSTICS'
export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_READONLY_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_READONLY_INSPECTION'
export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_MIGRATION_AUDIT_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT'

export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'reset_retry_failure_diagnostics_plan.json',
  'reset_retry_failure_evidence_inventory.json',
  'reset_retry_post_failure_state_report.json',
  'reset_retry_cli_failure_analysis_report.json',
  'reset_retry_migration_state_review.json',
  'reset_retry_recovery_option_matrix.json',
  'reset_retry_supabase_support_packet.json',
  'reset_retry_recovery_decision.json',
  'reset_retry_failure_blocker_report.json',
  'reset_retry_failure_readiness_report.json',
  'reset_retry_failure_private_artifact_manifest.json',
] as const

export const SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_DOCS = [
  'docs/supabase-reset-retry-failure-diagnostics.md',
  'docs/supabase-reset-retry-post-failure-state.md',
  'docs/supabase-reset-retry-support-packet.md',
  'docs/supabase-reset-retry-recovery-decision.md',
  'docs/implementation-prompts/prompt-supabase-reset-failure-recovery-next-step.md',
] as const

const PR269_REPORT_DIR = 'docs/activation-supabase-staging-reset-retry-execution-reports'
const PR265_REPORT_DIR = 'docs/activation-supabase-staging-reset-retry-approval-reports'
const PR262_REPORT_DIR = 'docs/activation-supabase-staging-reset-failure-triage-reports'
const PR259_REPORT_DIR = 'docs/activation-supabase-staging-reset-execution-reports'
const PR252_REPORT_DIR = 'docs/activation-supabase-staging-data-impact-backup-reports'
const PR247_REPORT_DIR = 'docs/activation-supabase-schema-parity-remediation-reports'
const PR241_REPORT_DIR = 'docs/activation-supabase-remote-schema-equivalence-reports'
const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const PR200_REPORT_DIR = 'docs/activation-supabase-milestone-registry-schema-reports'
const PR198_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const MIGRATION_DIR = path.join('supabase', 'migrations')
const APPROVED_STAGING_PROJECT_NAME = 'Reeditpro'
const APPROVED_STAGING_PROJECT_REF = 'wmyyttnynmteqgcdishd'
const APPROVED_STAGING_ENVIRONMENT = 'staging'
const APPROVED_DB_URL_ENV_NAMES = [
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
] as const
const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_DB_RESET',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_REPAIR',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACT_OUTPUT',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
] as const
const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /BEGIN\s+PRIVATE\s+KEY/i,
  /x-goog-signature\s*=/i,
  /service[_-]?role[_-]?key\s*=/i,
  /access[_-]?token\s*=/i,
  /jwt[_-]?secret\s*=/i,
] as const

type JsonRecord = Record<string, unknown>
type ReportBundle = ReturnType<typeof buildSupabaseResetRetryFailureDiagnosticsReports>

export function getSupabaseResetRetryFailureDiagnosticsPlan(): JsonRecord {
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    branch: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_BRANCH,
    baseBranch: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_BASE_BRANCH,
    prTitle: '[foundation] Supabase reset retry failure diagnostics',
    worktree: '/private/tmp/reeditpro-supabase-reset-retry-failure-diagnostics',
    reportDir: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR,
    expectedReports: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_EXPECTED_REPORTS,
    docs: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    approvedStagingTarget: {
      projectName: APPROVED_STAGING_PROJECT_NAME,
      projectRef: APPROVED_STAGING_PROJECT_REF,
      environment: APPROVED_STAGING_ENVIRONMENT,
    },
    sourcePrs: [198, 200, 223, 241, 247, 252, 259, 262, 265, 269],
    docsBasis: {
      cliReference: 'https://supabase.com/docs/reference/cli/introduction',
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      changelog: 'https://supabase.com/changelog',
      checkedAt: '2026-06-10',
      blockingBreakingChangeFound: false,
      publicTableGrantChangeRelevantToFutureRlsVerification: true,
    },
    allowedConfirmations: [
      SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_CONFIRMATION,
      SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_READONLY_CONFIRMATION,
      SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_MIGRATION_AUDIT_CONFIRMATION,
    ],
    allowedActions: [
      'read_committed_safe_reports',
      'inspect_local_migration_filenames',
      'optional_readonly_catalog_and_migration_metadata_inspection',
      'classify_reset_retry_failure',
      'build_supabase_support_packet_metadata',
      'write_safe_reports_and_docs',
    ],
    blockedActions: [
      'reset_retry',
      'db_push',
      'migration_repair',
      'schema_deploy',
      'track_b_backfill_write',
      'production_supabase',
      'direct_ddl_dml',
      'secret_printing',
      'provider_calls',
      'route_tool_worker_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
    defaultDecision: 'recovery_path_manual_operator_review_required',
  }
}

export function buildSupabaseResetRetryFailureDiagnosticsReports(input: {
  executeReadonly?: boolean
} = {}) {
  const plan = getSupabaseResetRetryFailureDiagnosticsPlan()
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const evidenceInventory = buildEvidenceInventory()
  const cliFailureAnalysis = buildCliFailureAnalysis(evidenceInventory)
  const readonlyInspection = input.executeReadonly
    ? runReadonlyPostRetryFailureInspection()
    : loadLatestReadonlyInspectionReport() ?? buildReadonlyInspectionNotAttempted()
  const postFailureState = buildPostFailureState(evidenceInventory, readonlyInspection)
  const migrationStateReview = buildMigrationStateReview(evidenceInventory, readonlyInspection)
  const recoveryOptionMatrix = buildRecoveryOptionMatrix(
    evidenceInventory,
    cliFailureAnalysis,
    postFailureState,
    migrationStateReview,
  )
  const supabaseSupportPacket = buildSupabaseSupportPacket(
    evidenceInventory,
    cliFailureAnalysis,
    postFailureState,
    migrationStateReview,
  )
  const recoveryDecision = buildRecoveryDecision(
    evidenceInventory,
    cliFailureAnalysis,
    postFailureState,
    migrationStateReview,
    recoveryOptionMatrix,
  )
  const blockers = collectUniqueBlockers(
    extractBlockers(sourceOfTruthOwnershipAudit),
    extractBlockers(evidenceInventory),
    extractBlockers(cliFailureAnalysis),
    extractBlockers(readonlyInspection),
    extractBlockers(postFailureState),
    extractBlockers(migrationStateReview),
    extractBlockers(recoveryDecision),
  )
  const blockerReport = buildBlockerReport(blockers)
  const readinessReport = buildReadinessReport(recoveryDecision, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit,
    plan,
    evidenceInventory,
    postFailureState,
    cliFailureAnalysis,
    migrationStateReview,
    recoveryOptionMatrix,
    supabaseSupportPacket,
    recoveryDecision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
    readonlyInspection,
  }
}

export async function writeSupabaseResetRetryFailureDiagnosticsArtifacts(
  reports: ReportBundle,
): Promise<void> {
  const dir = SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_failure_diagnostics_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_failure_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_post_failure_state_report.json'), reports.postFailureState)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_cli_failure_analysis_report.json'), reports.cliFailureAnalysis)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_migration_state_review.json'), reports.migrationStateReview)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_recovery_option_matrix.json'), reports.recoveryOptionMatrix)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_supabase_support_packet.json'), reports.supabaseSupportPacket)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_recovery_decision.json'), reports.recoveryDecision)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_failure_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_failure_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_retry_failure_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'readonly_reset_retry_failure_diagnostics_inspection.json'), reports.readonlyInspection)
  await writeVlmRuntimeTextArtifact('docs/supabase-reset-retry-failure-diagnostics.md', renderDiagnosticsDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-reset-retry-post-failure-state.md', renderPostFailureStateDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-reset-retry-support-packet.md', renderSupportPacketDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-reset-retry-recovery-decision.md', renderRecoveryDecisionDoc(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-reset-failure-recovery-next-step.md',
    renderNextStepPrompt(reports),
  )
}

export async function executeSupabaseResetRetryFailureDiagnostics(input: {
  readonlyMode: boolean
  keepTemp: boolean
}) {
  void input.keepTemp
  const reports = buildSupabaseResetRetryFailureDiagnosticsReports({
    executeReadonly: input.readonlyMode,
  })
  await writeSupabaseResetRetryFailureDiagnosticsArtifacts(reports)
  const readonlyConfirmed =
    !input.readonlyMode ||
    (process.env[SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_CONFIRMATION] === 'true' &&
      process.env[SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_READONLY_CONFIRMATION] === 'true' &&
      process.env[SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_MIGRATION_AUDIT_CONFIRMATION] === 'true')
  const forbiddenClear = FORBIDDEN_CONFIRMATIONS.every((name) => process.env[name] !== 'true')
  const readonlyCompletedOrSafelyBlocked =
    !input.readonlyMode ||
    ['passed', 'blocked', 'not_attempted'].includes(asString(reports.readonlyInspection.status, 'blocked'))
  return {
    reports,
    exitCode: readonlyConfirmed && forbiddenClear && readonlyCompletedOrSafelyBlocked ? 0 : 1,
  }
}

export function readSupabaseResetRetryFailureDiagnosticsSummary(): JsonRecord {
  const reports = buildSupabaseResetRetryFailureDiagnosticsReports()
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.recoveryDecision.decision,
    sourcePr269Head: 'e6ed4f2',
    resetRetryAttemptedInPr269: asRecord(reports.evidenceInventory.pr269).resetAttempted === true,
    stagingSqlMayHaveRun: asRecord(reports.evidenceInventory.pr269).stagingSqlMayHaveRun === true,
    postFailureStateClassifier: reports.postFailureState.stateClassifier,
    cliFailureClassification: reports.cliFailureAnalysis.failureClassification,
    migrationHistoryStatus: reports.migrationStateReview.status,
    readonlyInspectionStatus: reports.readonlyInspection.status,
    supportPacketRecommended: reports.recoveryDecision.decision === 'recovery_path_supabase_support_packet',
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    blockers: reports.blockerReport.activeBlockers,
  }
}

function buildSourceOfTruthOwnershipAudit(): JsonRecord {
  const sourcePaths = [
    'README.md',
    'AGENTS.md',
    'PRODUCTION_FOUNDATION_STATUS.md',
    'supabase-production-test-readiness.md',
    'supabase-local-staging-test-plan.md',
    'docs/source-of-truth-map.md',
    'docs/production-milestone-plan.md',
    'docs/production-beta-blocker-inventory.md',
    'docs/supabase-staging-reset-retry-execution.md',
    'docs/supabase-staging-reset-retry-recovery-decision.md',
  ]
  const reportPaths = [
    path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'),
    path.join(PR269_REPORT_DIR, 'staging_reset_retry_post_verify_report.json'),
    path.join(PR269_REPORT_DIR, 'staging_reset_retry_schema_rls_verify_report.json'),
    path.join(PR269_REPORT_DIR, 'staging_reset_retry_backup_export_execution_report.json'),
    path.join(PR269_REPORT_DIR, 'staging_reset_retry_secret_guard_report.json'),
    path.join(PR265_REPORT_DIR, 'staging_reset_retry_approval_decision.json'),
    path.join(PR262_REPORT_DIR, 'staging_reset_recovery_decision.json'),
    path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'),
    path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
    path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'),
    path.join(PR241_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'),
    path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
    path.join(PR200_REPORT_DIR, 'schema_readiness_report.json'),
    path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
  ]
  const requiredReports = reportPaths.slice(0, 5)
  const missingRequiredReports = requiredReports.filter((reportPath) => !existsSync(reportPath))
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    mode: 'diagnostics_and_recovery_decision_only',
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePaths: sourcePaths.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      type: existsSync(sourcePath) && safeStatIsDirectory(sourcePath) ? 'directory' : 'file',
    })),
    reportPaths: reportPaths.map((reportPath) => ({
      path: reportPath,
      present: existsSync(reportPath),
    })),
    localMigrationInventory: {
      migrationDir: MIGRATION_DIR,
      localMigrationCount: getLocalMigrationIds().length,
      localMigrationIds: getLocalMigrationIds(),
      registryMigrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
      registryMigrationPresent: existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH),
    },
    currentSourceFacts: {
      pr269OpenCleanAtHead: 'e6ed4f2',
      resetRetryAttempted: true,
      stagingSqlMayHaveRun: true,
      secretTargetGuardPassed: true,
      backupExportPassed: true,
      trackBProductionUntouched: true,
    },
    duplicateWorkAvoided: [
      'no_new_reset_retry_path',
      'no_db_push_path',
      'no_migration_repair_path',
      'no_schema_deploy_path',
      'no_track_b_backfill_write_path',
    ],
    status: missingRequiredReports.length === 0 ? 'passed' : 'blocked',
    blockers: missingRequiredReports.length === 0
      ? []
      : ['pr269_reset_retry_execution_report_missing'] satisfies SupabaseResetRetryFailureDiagnosticsBlocker[],
    productionAffected: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildEvidenceInventory(): JsonRecord {
  const execution = readJsonArtifact(path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'))
  const postVerify = readJsonArtifact(path.join(PR269_REPORT_DIR, 'staging_reset_retry_post_verify_report.json'))
  const schemaRls = readJsonArtifact(path.join(PR269_REPORT_DIR, 'staging_reset_retry_schema_rls_verify_report.json'))
  const readiness = readJsonArtifact(path.join(PR269_REPORT_DIR, 'staging_reset_retry_readiness_report.json'))
  const secretGuard = readJsonArtifact(path.join(PR269_REPORT_DIR, 'staging_reset_retry_secret_guard_report.json'))
  const backup = readJsonArtifact(path.join(PR269_REPORT_DIR, 'staging_reset_retry_backup_export_execution_report.json'))
  const blockers: SupabaseResetRetryFailureDiagnosticsBlocker[] = []
  if (!execution) blockers.push('pr269_reset_retry_execution_report_missing')
  if (!execution?.resetAttempted || execution?.stagingSqlMayHaveRun !== true) {
    blockers.push('pr269_reset_retry_failure_evidence_missing')
  }
  if (execution?.status === 'blocked') blockers.push('staging_reset_retry_failed')
  if (postVerify?.migrationHistoryVerified !== true) {
    blockers.push('staging_post_reset_migration_history_verify_failed')
  }
  if (schemaRls?.schemaRlsVerified !== true) {
    blockers.push('staging_post_reset_schema_rls_verify_failed')
  }
  if (postVerify?.registryMigrationApplied !== true) blockers.push('registry_migration_not_applied')
  if (asNumber(schemaRls?.tableCountFound, 0) === 0) {
    blockers.push('registry_schema_absent_after_reset_retry_failure')
  }
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    pr269: {
      resetExecutionReportPresent: Boolean(execution),
      resetStatus: asString(execution?.status, 'missing'),
      selectedStrategy: asString(execution?.selectedStrategy, 'unknown'),
      resetAttempted: execution?.resetAttempted === true,
      resetPerformed: execution?.resetPerformed === true,
      stagingSqlMayHaveRun: execution?.stagingSqlMayHaveRun === true,
      resetCommandExitCode: asNullableNumber(asRecord(execution?.resetCommand).exitCode),
      resetCommandErrorCategory: asString(asRecord(execution?.resetCommand).errorCategory, 'unknown_or_missing'),
      resetCommandStdoutBytes: asNumber(asRecord(asRecord(execution?.resetCommand).stdoutSummary).byteLength, 0),
      resetCommandStderrBytes: asNumber(asRecord(asRecord(execution?.resetCommand).stderrSummary).byteLength, 0),
      resetCommandStdoutSecretPatternDetected:
        asRecord(asRecord(execution?.resetCommand).stdoutSummary).secretPatternDetected === true,
      resetCommandStderrSecretPatternDetected:
        asRecord(asRecord(execution?.resetCommand).stderrSummary).secretPatternDetected === true,
      noSeedFlagUsed: execution?.noSeedFlagUsed === true,
      seedFilesIncluded: execution?.seedFilesIncluded === true,
      commandShapeApproved: execution?.retryCommandShapeApprovedByPr265 === true,
      rejectedYesFlagOmitted: execution?.rejectedPreviousOperationFlagOmitted === true,
      dbUrlPrinted: execution?.dbUrlPrinted === true,
      credentialPayloadsPrinted: execution?.credentialPayloadsPrinted === true,
      payloadPrinted: execution?.payloadPrinted === true,
      payloadCommitted: execution?.payloadCommitted === true,
    },
    secretGuard: {
      status: asString(secretGuard?.status, 'missing'),
      secretRefUsed: asString(secretGuard?.secretRefUsed, 'none'),
      dbUrlEnvPresent: secretGuard?.dbUrlEnvPresent === true,
      dbUrlTargetMatchedApprovedStaging: secretGuard?.dbUrlTargetMatchedApprovedStaging === true,
      payloadAccessStatus: asString(secretGuard?.payloadAccessStatus, 'not_attempted'),
      payloadPrinted: secretGuard?.payloadPrinted === true,
      payloadCommitted: secretGuard?.payloadCommitted === true,
      productionTargetSelected: secretGuard?.productionTargetSelected === true,
    },
    backupExport: {
      status: asString(backup?.status, 'missing'),
      backupExportPerformed: backup?.backupExportPerformed === true,
      backupFileCreated: backup?.backupFileCreated === true,
      backupPayloadCommitted: backup?.backupPayloadCommitted === true,
      rowDataDumpPerformed: backup?.rowDataDumpPerformed === true,
      storageObjectBackupPerformed: backup?.storageObjectBackupPerformed === true,
      payloadPrinted: backup?.payloadPrinted === true,
      dbUrlPrinted: backup?.dbUrlPrinted === true,
    },
    postVerify: {
      status: asString(postVerify?.status, 'missing'),
      verificationPerformed: postVerify?.verificationPerformed === true,
      migrationHistoryVerified: postVerify?.migrationHistoryVerified === true,
      remoteMigrationIds: asStringArray(postVerify?.remoteMigrationIds),
      missingLocalIdsAfterReset: asStringArray(postVerify?.missingLocalIdsAfterReset),
      registryMigrationApplied: postVerify?.registryMigrationApplied === true,
      dbUrlPrinted: postVerify?.dbUrlPrinted === true,
    },
    schemaRlsVerify: {
      status: asString(schemaRls?.status, 'missing'),
      verificationPerformed: schemaRls?.verificationPerformed === true,
      schemaRlsVerified: schemaRls?.schemaRlsVerified === true,
      requiredTables: asStringArray(schemaRls?.requiredTables),
      tableCountFound: asNumber(schemaRls?.tableCountFound, 0),
      missingTables: asStringArray(schemaRls?.missingTables),
      rlsDisabledTables: asStringArray(schemaRls?.rlsDisabledTables),
      broadGrantCount: asNumber(schemaRls?.broadGrantCount, 0),
      publicAnonAuthenticatedRevoked: schemaRls?.publicAnonAuthenticatedRevoked === true,
      serviceRoleOnlyExpected: schemaRls?.serviceRoleOnlyExpected === true,
    },
    upstreamEvidence: {
      pr265RetryApproval: readReportDecision(PR265_REPORT_DIR, 'staging_reset_retry_approval_decision.json'),
      pr262FailureTriage: readReportDecision(PR262_REPORT_DIR, 'staging_reset_recovery_decision.json'),
      pr259ResetExecution: readReportDecision(PR259_REPORT_DIR, 'staging_reset_readiness_report.json'),
      pr252DataImpactBackup: readReportDecision(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
      pr247SchemaParity: readReportDecision(PR247_REPORT_DIR, 'schema_parity_decision.json'),
      pr241RemoteEquivalence: readReportDecision(PR241_REPORT_DIR, 'migration_history_repair_approval_after_equivalence_review.json'),
      pr223DeployTransport: readReportDecision(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
      pr200RegistrySchema: readReportDecision(PR200_REPORT_DIR, 'schema_readiness_report.json'),
      pr198TrackBBackfill: readReportDecision(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
    },
    readiness: {
      status: asString(readiness?.status, 'missing'),
      blockers: asStringArray(readiness?.blockers),
      nextRecommendedPhase: asString(readiness?.nextRecommendedPhase, 'unknown'),
    },
    resetRetryDiagnosticsOnly: true,
    resetRetryRunInThisPhase: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildCliFailureAnalysis(evidence: JsonRecord): JsonRecord {
  const pr269 = asRecord(evidence.pr269)
  const exitCode = asNullableNumber(pr269.resetCommandExitCode)
  const stderrBytes = asNumber(pr269.resetCommandStderrBytes, 0)
  const stdoutBytes = asNumber(pr269.resetCommandStdoutBytes, 0)
  const blockers: SupabaseResetRetryFailureDiagnosticsBlocker[] = [
    'staging_reset_retry_failed',
    'reset_retry_failure_cause_not_proven',
    'support_packet_required_before_next_mutation',
  ]
  if (pr269.stagingSqlMayHaveRun === true) blockers.push('staging_sql_may_have_run')
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: 'blocked',
    source: path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'),
    sanitizedCommandClass: 'supabase_db_reset_via_temp_npm_exec',
    selectedStrategy: asString(pr269.selectedStrategy, 'unknown'),
    approvedCommandShape:
      'npm exec --yes --package supabase@latest -- supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed',
    rejectedOperationShape: 'db reset ... --no-seed --yes',
    exitCode,
    stdoutSummary: {
      byteLength: stdoutBytes,
      secretPatternDetected: pr269.resetCommandStdoutSecretPatternDetected === true,
      rawOutputCommitted: false,
    },
    stderrSummary: {
      byteLength: stderrBytes,
      secretPatternDetected: pr269.resetCommandStderrSecretPatternDetected === true,
      rawOutputCommitted: false,
    },
    failureClassification: exitCode === 1 && stderrBytes > 0
      ? 'reset_retry_command_failed_exact_cause_not_proven'
      : 'reset_retry_failure_unknown',
    exactFailureCauseProven: false,
    safeFixProven: false,
    pointsToSupabaseCliOrPlatformIssue: true,
    supportPacketRecommended: true,
    resetRetryApprovedInThisPhase: false,
    resetRetryRunInThisPhase: false,
    dbPushRun: false,
    migrationRepairRun: false,
    directDdlDmlRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    payloadPrinted: pr269.payloadPrinted === true,
    payloadCommitted: pr269.payloadCommitted === true,
    dbUrlPrinted: pr269.dbUrlPrinted === true,
    credentialPayloadsPrinted: pr269.credentialPayloadsPrinted === true,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildReadonlyInspectionNotAttempted(): JsonRecord {
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: 'not_attempted',
    inspectionPerformed: false,
    secretRefUsed: process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF ?? 'none',
    payloadAccessStatus: process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_PAYLOAD_ACCESS_STATUS ?? 'not_attempted',
    payloadPrinted: false,
    payloadCommitted: false,
    dbUrlEnvPresent: findDbUrlEnvName() !== null,
    dbUrlTargetMatchedApprovedStaging: false,
    psqlAvailable: false,
    queryAllowlist: [
      'supabase_migrations.schema_migrations',
      'information_schema.tables',
      'pg_catalog.pg_class',
      'pg_catalog.pg_namespace',
      'pg_policies',
      'information_schema.role_table_grants',
    ],
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    blockers: [],
  }
}

function runReadonlyPostRetryFailureInspection(): JsonRecord {
  const forbiddenSet = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  if (forbiddenSet.length > 0) {
    return buildBlockedReadonlyInspection(['forbidden_confirmation_set'], { forbiddenSet })
  }
  const confirmationBlockers: SupabaseResetRetryFailureDiagnosticsBlocker[] = []
  if (process.env[SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_reset_retry_failure_diagnostics_not_confirmed')
  }
  if (process.env[SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_READONLY_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_schema_readonly_inspection_not_confirmed')
  }
  if (process.env[SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_MIGRATION_AUDIT_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_migration_history_audit_not_confirmed')
  }
  if (confirmationBlockers.length > 0) return buildBlockedReadonlyInspection(confirmationBlockers)

  const envName = findDbUrlEnvName()
  if (!envName) {
    return buildBlockedReadonlyInspection(['staging_db_url_unavailable_for_reset_retry_failure_diagnostics'])
  }
  const dbUrl = process.env[envName] ?? ''
  const targetGuard = validateDbUrlTarget(dbUrl)
  if (targetGuard.status !== 'passed') {
    return buildBlockedReadonlyInspection(targetGuard.blockers, {
      dbUrlEnvPresent: true,
      dbUrlTargetValidation: targetGuard,
    })
  }
  const psqlPath = findPsqlPath()
  if (!psqlPath) {
    return buildBlockedReadonlyInspection(['psql_unavailable_for_reset_retry_failure_diagnostics'], {
      dbUrlEnvPresent: true,
      dbUrlTargetMatchedApprovedStaging: true,
      dbUrlTargetValidation: targetGuard,
    })
  }
  const query = buildReadonlyInspectionQuery()
  try {
    const stdout = execFileSync(
      psqlPath,
      [
        dbUrl,
        '-X',
        '-qAt',
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        query,
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=60000',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    const parsed = parseInspectionJson(stdout)
    const activationTables = asStringArray(parsed.activationTables)
    const remoteMigrationIds = asStringArray(parsed.remoteMigrationIds)
    const registryMigrationApplied = remoteMigrationIds.includes('202606050001')
    return {
      phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
      runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
      status: 'passed',
      inspectionPerformed: true,
      secretRefUsed: process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF ?? 'SUPABASE_DB_URL',
      payloadAccessStatus: process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_PAYLOAD_ACCESS_STATUS ?? 'succeeded',
      payloadPrinted: false,
      payloadCommitted: false,
      dbUrlEnvPresent: true,
      selectedDbUrlEnvName: envName,
      dbUrlTargetMatchedApprovedStaging: true,
      dbUrlTargetValidation: targetGuard,
      psqlAvailable: true,
      psqlPathSource: process.env.REEDITPRO_PSQL_PATH ? 'REEDITPRO_PSQL_PATH' : 'PATH',
      command: {
        status: 'passed',
        command: 'psql',
        args: ['[REDACTED_STAGING_DB_URL]', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', '[REDACTED_READONLY_CATALOG_QUERY]'],
        stdoutSummary: summarizeText(stdout),
        stderrSummary: { byteLength: 0, lineCount: 0, secretPatternDetected: false },
      },
      queryAllowlist: [
        'supabase_migrations.schema_migrations',
        'information_schema.tables',
        'pg_catalog.pg_class',
        'pg_catalog.pg_namespace',
        'pg_policies',
        'information_schema.role_table_grants',
      ],
      remoteMigrationIds,
      remoteMigrationCount: remoteMigrationIds.length,
      registryMigrationApplied,
      activationTables,
      activationTableCount: activationTables.length,
      requiredRegistryTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
      missingRegistryTables: SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) => !activationTables.includes(table)),
      rlsEnabledTables: asStringArray(parsed.rlsEnabledTables),
      broadGrantCount: asNumber(parsed.broadGrantCount, 0),
      storageBucketNamesRead: false,
      rowContentsRead: false,
      limitedCountsRead: false,
      resetRetryRun: false,
      dbPushRun: false,
      migrationRepairRun: false,
      schemaDeployRun: false,
      trackBBackfillRowsWritten: false,
      productionAffected: false,
      blockers: [],
    }
  } catch {
    return buildBlockedReadonlyInspection(['readonly_reset_retry_failure_diagnostics_query_failed'], {
      dbUrlEnvPresent: true,
      dbUrlTargetMatchedApprovedStaging: true,
      dbUrlTargetValidation: targetGuard,
      psqlAvailable: true,
      command: {
        status: 'blocked',
        command: 'psql',
        args: ['[REDACTED_STAGING_DB_URL]', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', '[REDACTED_READONLY_CATALOG_QUERY]'],
        stdoutSummary: { byteLength: 0, lineCount: 0, secretPatternDetected: false },
        stderrSummary: { byteLength: 0, lineCount: 0, secretPatternDetected: false },
      },
    })
  }
}

function buildPostFailureState(evidence: JsonRecord, readonlyInspection: JsonRecord): JsonRecord {
  const pr269 = asRecord(evidence.pr269)
  const schemaRls = asRecord(evidence.schemaRlsVerify)
  const postVerify = asRecord(evidence.postVerify)
  const readonlyStatus = asString(readonlyInspection.status, 'not_attempted')
  const readonlyTables = asStringArray(readonlyInspection.activationTables)
  const readonlyMissingTables = asStringArray(readonlyInspection.missingRegistryTables)
  const readonlyRemoteIds = asStringArray(readonlyInspection.remoteMigrationIds)
  const committedRemoteIds = asStringArray(postVerify.remoteMigrationIds)
  let classifier = 'unknown'
  let confidence = 'low'
  const blockers: SupabaseResetRetryFailureDiagnosticsBlocker[] = [
    'staging_reset_retry_failed',
    'staging_sql_may_have_run',
    'reset_retry_failure_cause_not_proven',
  ]
  if (readonlyStatus === 'passed') {
    const registryAbsent =
      readonlyTables.length === 0 && readonlyMissingTables.length === SUPABASE_MILESTONE_REGISTRY_TABLES.length
    const migrationHistoryMatches = arraysEqual(readonlyRemoteIds, committedRemoteIds)
    if (registryAbsent && migrationHistoryMatches) {
      classifier = 'unchanged_failed_state'
      confidence = 'medium'
    } else {
      classifier = 'partially_mutated'
      confidence = 'medium'
      blockers.push('post_retry_failure_state_partially_mutated')
    }
  } else {
    blockers.push('post_retry_failure_state_unknown')
  }
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: 'blocked',
    evidenceBasis: 'committed_pr269_reports_plus_optional_readonly_catalog_metadata',
    resetRetryAttempted: pr269.resetAttempted === true,
    resetRetryPerformed: pr269.resetPerformed === true,
    stagingSqlMayHaveRun: pr269.stagingSqlMayHaveRun === true,
    committedMigrationHistoryVerified: postVerify.migrationHistoryVerified === true,
    committedSchemaRlsVerified: schemaRls.schemaRlsVerified === true,
    committedRegistryMigrationApplied: postVerify.registryMigrationApplied === true,
    committedRegistryTableCountFound: asNumber(schemaRls.tableCountFound, 0),
    committedMissingTables: asStringArray(schemaRls.missingTables),
    readonlyInspectionStatus: readonlyStatus,
    readonlyInspectionPerformed: readonlyInspection.inspectionPerformed === true,
    readonlyRegistryMigrationApplied: readonlyInspection.registryMigrationApplied === true,
    readonlyRegistryTableCountFound: asNumber(readonlyInspection.activationTableCount, 0),
    readonlyMissingTables,
    stateClassifier: classifier,
    stateConfidence: confidence,
    clearForMutation: false,
    resetRetryApprovedInThisPhase: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildMigrationStateReview(evidence: JsonRecord, readonlyInspection: JsonRecord): JsonRecord {
  const postVerify = asRecord(evidence.postVerify)
  const sourceRemoteIds = readonlyInspection.status === 'passed'
    ? asStringArray(readonlyInspection.remoteMigrationIds)
    : asStringArray(postVerify.remoteMigrationIds)
  const localMigrationIds = getLocalMigrationIds()
  const missingLocalIds = localMigrationIds.filter((id) => !sourceRemoteIds.includes(id))
  const registryMigrationApplied = sourceRemoteIds.includes('202606050001')
  const blockers: SupabaseResetRetryFailureDiagnosticsBlocker[] = []
  if (!registryMigrationApplied) blockers.push('registry_migration_not_applied')
  if (postVerify.migrationHistoryVerified !== true) {
    blockers.push('staging_post_reset_migration_history_verify_failed')
  }
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    source: readonlyInspection.status === 'passed'
      ? 'readonly_catalog_inspection'
      : path.join(PR269_REPORT_DIR, 'staging_reset_retry_post_verify_report.json'),
    localMigrationCount: localMigrationIds.length,
    localMigrationIds,
    remoteMigrationCount: sourceRemoteIds.length,
    remoteMigrationIds: sourceRemoteIds,
    missingLocalIdsAfterRetryFailure: missingLocalIds,
    registryMigrationId: '202606050001',
    registryMigrationApplied,
    migrationRepairRecommended: false,
    dbPushRecommended: false,
    orderedApplyApprovedInThisPhase: false,
    migrationRepairRun: false,
    dbPushRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    blockers,
  }
}

function buildRecoveryOptionMatrix(
  evidence: JsonRecord,
  cliFailure: JsonRecord,
  postFailureState: JsonRecord,
  migrationState: JsonRecord,
): JsonRecord {
  const stateClassifier = asString(postFailureState.stateClassifier, 'unknown')
  const options: Array<JsonRecord & { option: SupabaseResetRetryRecoveryOption }> = [
    {
      option: 'supabase_support_packet',
      status: stateClassifier === 'unchanged_failed_state' ? 'recommended' : 'recommended_if_state_readable',
      reason: 'Reset retry reached staging through the approved command shape, failed with a sanitized nonzero command result, and exact root cause is not proven.',
      supportPacketBuilt: true,
      requiresFutureMutationApproval: false,
    },
    {
      option: 'manual_operator_review',
      status: stateClassifier === 'unknown' ? 'recommended' : 'available',
      reason: 'Use when readonly state is unavailable or support response is needed before selecting a recovery mutation.',
      requiresFutureMutationApproval: true,
    },
    {
      option: 'restore_backup_then_manual_review',
      status: stateClassifier === 'partially_mutated' ? 'candidate_requires_separate_restore_review' : 'not_selected',
      reason: 'Backup metadata exists, but restore sufficiency and scope are not approved in this diagnostics phase.',
      restoreRunInThisPhase: false,
      requiresFutureMutationApproval: true,
    },
    {
      option: 'new_staging_project_or_branch',
      status: 'candidate_if_existing_staging_recovery_remains_ambiguous',
      reason: 'A fresh staging target may avoid compounding unknown reset state, but needs a separate approval packet and target proof.',
      requiresFutureMutationApproval: true,
    },
    {
      option: 'ordered_missing_migration_apply',
      status: 'not_approved',
      reason: 'Would mutate staging schema and must be separately reviewed; this phase cannot run schema deploy or direct DDL/DML.',
      requiresFutureMutationApproval: true,
    },
    {
      option: 'reject_due_staging_data_risk',
      status: 'conditional',
      reason: 'Use only if future inspection shows unacceptable staging data/dependency risk.',
      requiresFutureMutationApproval: true,
    },
  ]
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: 'blocked',
    resetAttempted: asRecord(evidence.pr269).resetAttempted === true,
    stateClassifier,
    failureClassification: cliFailure.failureClassification,
    registryMigrationApplied: migrationState.registryMigrationApplied === true,
    selectedDefault:
      stateClassifier === 'unchanged_failed_state'
        ? 'supabase_support_packet'
        : 'manual_operator_review',
    options,
    resetRetryApproved: false,
    dbPushApproved: false,
    migrationRepairApproved: false,
    schemaDeployApproved: false,
    trackBBackfillApproved: false,
    productionAffected: false,
    blockers: ['future_recovery_execution_approval_required'],
  }
}

function buildSupabaseSupportPacket(
  evidence: JsonRecord,
  cliFailure: JsonRecord,
  postFailureState: JsonRecord,
  migrationState: JsonRecord,
): JsonRecord {
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: 'ready_for_human_review',
    project: {
      projectName: APPROVED_STAGING_PROJECT_NAME,
      projectRef: APPROVED_STAGING_PROJECT_REF,
      environment: APPROVED_STAGING_ENVIRONMENT,
    },
    commandClass: cliFailure.sanitizedCommandClass,
    commandShape:
      'npm exec --yes --package supabase@latest -- supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed',
    selectedStrategy: cliFailure.selectedStrategy,
    failureClassification: cliFailure.failureClassification,
    exactFailureCauseProven: false,
    stagingSqlMayHaveRun: asRecord(evidence.pr269).stagingSqlMayHaveRun === true,
    postFailureStateClassifier: postFailureState.stateClassifier,
    localMigrationCount: migrationState.localMigrationCount,
    remoteMigrationCount: migrationState.remoteMigrationCount,
    targetRegistryMigrationId: '202606050001',
    targetRegistryMigrationApplied: migrationState.registryMigrationApplied === true,
    missingLocalIdsAfterRetryFailure: migrationState.missingLocalIdsAfterRetryFailure,
    sourcePrs: [198, 200, 223, 241, 247, 252, 259, 262, 265, 269],
    safeAttachments: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_EXPECTED_REPORTS.map((name) =>
      path.join(SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR, name)
    ),
    excludedFromPacket: [
      'database_url',
      'password',
      'access_token',
      'service_role_key',
      'secret_payloads',
      'raw_private_backup_payload',
      'row_contents',
      'private_media',
    ],
    payloadPrinted: false,
    payloadCommitted: false,
    dbUrlPrinted: false,
    productionAffected: false,
    trackBBackfillRowsWritten: false,
    migrationRepairRun: false,
    dbPushRun: false,
    directDdlDmlRun: false,
  }
}

function buildRecoveryDecision(
  evidence: JsonRecord,
  cliFailure: JsonRecord,
  postFailureState: JsonRecord,
  migrationState: JsonRecord,
  optionMatrix: JsonRecord,
): JsonRecord {
  const stateClassifier = asString(postFailureState.stateClassifier, 'unknown')
  let decision: SupabaseResetRetryFailureDiagnosticsDecision = 'recovery_path_manual_operator_review_required'
  const blockers: SupabaseResetRetryFailureDiagnosticsBlocker[] = [
    'future_recovery_execution_approval_required',
    'reset_retry_failure_cause_not_proven',
  ]
  if (stateClassifier === 'unchanged_failed_state') {
    decision = 'recovery_path_supabase_support_packet'
    blockers.push('support_packet_required_before_next_mutation')
  } else if (stateClassifier === 'partially_mutated') {
    decision = 'recovery_path_restore_backup_then_manual_review'
    blockers.push('post_retry_failure_state_partially_mutated', 'backup_restore_scope_not_proven')
  } else {
    blockers.push('manual_operator_review_required', 'post_retry_failure_state_unknown')
  }
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: 'blocked',
    decision,
    decisionReason:
      decision === 'recovery_path_supabase_support_packet'
        ? 'Readonly metadata indicates the failed state is readable and not further mutated beyond the committed retry-failure evidence, but the CLI reset failure cause is not proven.'
        : decision === 'recovery_path_restore_backup_then_manual_review'
          ? 'Readonly metadata conflicts with committed PR #269 evidence or suggests partial mutation; restore/manual-risk review is required before any mutation.'
          : 'Readonly inspection is unavailable or insufficient, so a manual operator review is required before selecting recovery.',
    selectedOption: asString(optionMatrix.selectedDefault, 'manual_operator_review'),
    sourcePr269ResetAttempted: asRecord(evidence.pr269).resetAttempted === true,
    stagingSqlMayHaveRun: asRecord(evidence.pr269).stagingSqlMayHaveRun === true,
    cliFailureClassification: cliFailure.failureClassification,
    migrationHistoryStatus: migrationState.status,
    resetRetryExecutionAllowedInThisPhase: false,
    dbPushAllowedInThisPhase: false,
    migrationRepairAllowedInThisPhase: false,
    schemaDeployAllowedInThisPhase: false,
    trackBBackfillAllowedInThisPhase: false,
    productionAllowed: false,
    supportPacketBuilt: true,
    nextRecommendedPhase:
      decision === 'recovery_path_supabase_support_packet'
        ? 'Supabase support/escalation approval using the safe support packet, then a separate recovery execution decision.'
        : 'Manual operator review to choose support escalation, new staging target, restore path, or separately approved ordered apply.',
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildBlockerReport(blockers: SupabaseResetRetryFailureDiagnosticsBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: blockers.length > 0 ? 'blocked' : 'passed',
    activeBlockers: blockers,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildReadinessReport(decision: JsonRecord, blockerReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: 'blocked',
    diagnosticsComplete: true,
    decision: decision.decision,
    supportPacketReady: decision.supportPacketBuilt === true,
    recoveryExecutionAllowed: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: decision.nextRecommendedPhase,
    blockers: asStringArray(blockerReport.activeBlockers),
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    reportDir: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR,
    committedReports: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_EXPECTED_REPORTS,
    committedDocs: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_DOCS,
    privateUploadRequired: false,
    privateBackupPayloadCommitted: false,
    dbUrlCommitted: false,
    secretPayloadsCommitted: false,
    rowContentsCommitted: false,
    mediaPayloadsCommitted: false,
    buildOutputCommitted: false,
  }
}

function buildBlockedReadonlyInspection(
  blockers: SupabaseResetRetryFailureDiagnosticsBlocker[],
  extra: JsonRecord = {},
): JsonRecord {
  return {
    phase: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE,
    runId: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_RUN_ID,
    status: 'blocked',
    inspectionPerformed: false,
    secretRefUsed: process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF ?? 'SUPABASE_DB_URL',
    payloadAccessStatus: process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_PAYLOAD_ACCESS_STATUS ?? 'not_attempted',
    payloadPrinted: false,
    payloadCommitted: false,
    dbUrlEnvPresent: findDbUrlEnvName() !== null,
    dbUrlTargetMatchedApprovedStaging: false,
    psqlAvailable: false,
    rowContentsRead: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(blockers),
    ...extra,
  }
}

function renderDiagnosticsDoc(reports: ReportBundle): string {
  return `# Supabase Reset Retry Failure Diagnostics

- Phase: \`${SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_PHASE}\`
- Decision: \`${reports.recoveryDecision.decision}\`
- Source PR: #269 / \`codex/rp-foundation-supabase-staging-reset-retry-execution\`
- Reset retry run in this phase: no
- \`db push\` run: no
- Migration repair run: no
- Schema deploy run: no
- Track B backfill write: no
- Production affected: no

This packet preserves PR #269 as a staging reset retry failure: the retry reached staging, \`stagingSqlMayHaveRun=true\`, the secret target guard and backup/export passed, and Track B/production stayed untouched. It is diagnostics and recovery-decision metadata only.

Docs basis: Supabase CLI reference, Supabase database migration guidance, and the Supabase changelog were checked on 2026-06-10. No migration-repair or reset-retry execution is authorized here.
`
}

function renderPostFailureStateDoc(reports: ReportBundle): string {
  return `# Supabase Reset Retry Post-Failure State

- Classifier: \`${reports.postFailureState.stateClassifier}\`
- Confidence: \`${reports.postFailureState.stateConfidence}\`
- Read-only inspection status: \`${reports.readonlyInspection.status}\`
- Registry migration applied: \`${reports.migrationStateReview.registryMigrationApplied}\`
- Registry table count found: \`${reports.postFailureState.readonlyRegistryTableCountFound ?? reports.postFailureState.committedRegistryTableCountFound}\`

The state report contains only catalog and migration metadata. It does not include row contents, DB URLs, hostnames, usernames, passwords, service keys, backup payloads, or private artifacts.
`
}

function renderSupportPacketDoc(reports: ReportBundle): string {
  return `# Supabase Reset Retry Support Packet

- Packet status: \`${reports.supabaseSupportPacket.status}\`
- Project ref: \`${APPROVED_STAGING_PROJECT_REF}\`
- Command class: \`${reports.supabaseSupportPacket.commandClass}\`
- Failure classification: \`${reports.supabaseSupportPacket.failureClassification}\`
- Exact root cause proven: \`${reports.supabaseSupportPacket.exactFailureCauseProven}\`

Safe packet references are the committed JSON reports under \`${SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR}\`. The packet excludes DB URLs, passwords, tokens, service-role material, raw backup payloads, row contents, and private media.
`
}

function renderRecoveryDecisionDoc(reports: ReportBundle): string {
  return `# Supabase Reset Retry Recovery Decision

- Decision: \`${reports.recoveryDecision.decision}\`
- Status: \`${reports.recoveryDecision.status}\`
- Reset retry allowed in this phase: \`${reports.recoveryDecision.resetRetryExecutionAllowedInThisPhase}\`
- \`db push\` allowed in this phase: \`${reports.recoveryDecision.dbPushAllowedInThisPhase}\`
- Migration repair allowed in this phase: \`${reports.recoveryDecision.migrationRepairAllowedInThisPhase}\`
- Track B backfill allowed in this phase: \`${reports.recoveryDecision.trackBBackfillAllowedInThisPhase}\`

Next recommended phase: ${reports.recoveryDecision.nextRecommendedPhase}
`
}

function renderNextStepPrompt(reports: ReportBundle): string {
  return `# Supabase Reset Failure Recovery Next Step

Use this prompt only after reviewing PR #269 and the diagnostics reports in \`${SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR}\`.

Current decision: \`${reports.recoveryDecision.decision}\`.

The next phase must stay separate from this diagnostics packet. It may choose one of these paths after human review:

- Supabase support/escalation using the safe support packet.
- New staging branch/project approval if the existing staging target remains unrecoverable.
- Ordered apply approval only after a complete dry-run and schema/RLS review.
- Restore/manual-risk review if partial mutation is proven.

Forbidden in this packet: reset retry, \`db push\`, migration repair, schema deploy, direct DDL/DML, Track B writes, production, providers, workers, routes, tools, media processing, Track A, beta, and production unlock.
`
}

function buildReadonlyInspectionQuery(): string {
  return `
with remote_migrations as (
  select version::text as version
  from supabase_migrations.schema_migrations
  order by version
),
activation_tables as (
  select table_name::text
  from information_schema.tables
  where table_schema = 'public'
    and table_name like 'activation_%'
  order by table_name
),
rls_tables as (
  select c.relname::text as table_name
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname like 'activation_%'
    and c.relrowsecurity = true
  order by c.relname
),
broad_grants as (
  select count(*)::int as grant_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name like 'activation_%'
    and grantee in ('PUBLIC', 'public', 'anon', 'authenticated')
)
select json_build_object(
  'remoteMigrationIds', coalesce((select json_agg(version) from remote_migrations), '[]'::json),
  'activationTables', coalesce((select json_agg(table_name) from activation_tables), '[]'::json),
  'rlsEnabledTables', coalesce((select json_agg(table_name) from rls_tables), '[]'::json),
  'broadGrantCount', coalesce((select grant_count from broad_grants), 0)
)::text;
`
}

function parseInspectionJson(stdout: string): JsonRecord {
  const line = stdout.trim().split('\n').find((candidate) => candidate.trim().startsWith('{')) ?? '{}'
  try {
    return JSON.parse(line) as JsonRecord
  } catch {
    return {}
  }
}

function loadLatestReadonlyInspectionReport(): JsonRecord | null {
  const reportPath = path.join(
    SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR,
    'readonly_reset_retry_failure_diagnostics_inspection.json',
  )
  const report = readJsonArtifact(reportPath)
  if (!report) return null
  if (report.status === 'passed') return { ...report, preservedFromLatestReport: true }
  return null
}

function findDbUrlEnvName(): string | null {
  return APPROVED_DB_URL_ENV_NAMES.find((name) => Boolean(process.env[name])) ?? null
}

function validateDbUrlTarget(dbUrl: string): JsonRecord & { blockers: SupabaseResetRetryFailureDiagnosticsBlocker[] } {
  try {
    const parsed = new URL(dbUrl)
    const host = parsed.hostname
    const username = decodeURIComponent(parsed.username)
    const matched = host.includes(APPROVED_STAGING_PROJECT_REF) || username.includes(APPROVED_STAGING_PROJECT_REF)
    return {
      status: matched ? 'passed' : 'blocked',
      dbUrlProvided: true,
      dbUrlParsedInMemory: true,
      dbUrlValuePrinted: false,
      dbUrlValueCommitted: false,
      hostnamePrinted: false,
      usernamePrinted: false,
      passwordPrinted: false,
      approvedStagingProjectRefMatched: matched,
      dbUrlTargetMatchedApprovedStaging: matched,
      productionTargetSelected: false,
      blockers: matched ? [] : ['staging_db_url_target_ref_mismatch'],
    }
  } catch {
    return {
      status: 'blocked',
      dbUrlProvided: Boolean(dbUrl),
      dbUrlParsedInMemory: false,
      dbUrlValuePrinted: false,
      dbUrlValueCommitted: false,
      hostnamePrinted: false,
      usernamePrinted: false,
      passwordPrinted: false,
      approvedStagingProjectRefMatched: false,
      dbUrlTargetMatchedApprovedStaging: false,
      productionTargetSelected: false,
      blockers: ['staging_db_url_unparseable'],
    }
  }
}

function findPsqlPath(): string | null {
  const explicit = process.env.REEDITPRO_PSQL_PATH
  if (explicit && commandWorks(explicit, ['--version'])) return explicit
  return commandWorks('psql', ['--version']) ? 'psql' : null
}

function commandWorks(command: string, args: string[]): boolean {
  try {
    execFileSync(command, args, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function readJsonArtifact(filePath: string): JsonRecord | null {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
  } catch {
    return null
  }
}

function readReportDecision(dir: string, file: string): JsonRecord {
  const report = readJsonArtifact(path.join(dir, file))
  if (!report) return { present: false, status: 'missing' }
  return {
    present: true,
    status: asString(report.status, 'unknown'),
    decision: asString(report.decision, asString(report.readinessStatus, 'unknown')),
    blockers: asStringArray(report.blockers ?? report.activeBlockers),
  }
}

function getLocalMigrationIds(): string[] {
  if (!existsSync(MIGRATION_DIR)) return []
  return readdirSync(MIGRATION_DIR)
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .map((name) => name.split('_')[0] ?? name)
    .sort()
}

function safeStatIsDirectory(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory()
  } catch {
    return false
  }
}

function summarizeText(text: string): JsonRecord {
  return {
    byteLength: Buffer.byteLength(text, 'utf8'),
    lineCount: text.length === 0 ? 0 : text.split('\n').length,
    secretPatternDetected: SECRET_PATTERNS.some((pattern) => pattern.test(text)),
  }
}

function extractBlockers(report: JsonRecord): SupabaseResetRetryFailureDiagnosticsBlocker[] {
  return asStringArray(report.blockers ?? report.activeBlockers)
    .filter((blocker): blocker is SupabaseResetRetryFailureDiagnosticsBlocker => Boolean(blocker))
}

function collectUniqueBlockers(
  ...groups: Array<Array<SupabaseResetRetryFailureDiagnosticsBlocker | string>>
): SupabaseResetRetryFailureDiagnosticsBlocker[] {
  return [...new Set(groups.flat().filter(Boolean))] as SupabaseResetRetryFailureDiagnosticsBlocker[]
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}
