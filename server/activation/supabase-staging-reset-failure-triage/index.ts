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
  SupabaseStagingResetFailureRecoveryOption,
  SupabaseStagingResetFailureTriageBlocker,
} from './staging-reset-failure-triage-types'

export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE =
  'supabase-staging-reset-failure-triage'
export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID =
  'supabase-staging-reset-failure-triage-20260609'
export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-failure-triage'
export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-reapply-execution'
export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR =
  'docs/activation-supabase-staging-reset-failure-triage-reports'

export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_FAILURE_TRIAGE'
export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_READONLY_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_READONLY_INSPECTION'
export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_MIGRATION_AUDIT_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT'

export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'post_failure_source_evidence_inventory.json',
  'backup_export_artifact_status.json',
  'reset_failure_command_evidence.json',
  'post_failure_staging_state_assessment.json',
  'staging_reset_post_failure_state_report.json',
  'migration_history_delta_after_failed_reset.json',
  'registry_schema_rls_state_after_failed_reset.json',
  'readonly_staging_failure_triage_inspection.json',
  'partial_reset_risk_classification.json',
  'staging_reset_failure_classification_report.json',
  'recovery_option_matrix.json',
  'recovery_strategy_recommendation.json',
  'recovery_decision.json',
  'staging_reset_recovery_decision.json',
  'recovery_blocker_report.json',
  'staging_reset_failure_blocker_report.json',
  'recovery_readiness_report.json',
  'recovery_private_artifact_manifest.json',
] as const

export const SUPABASE_STAGING_RESET_FAILURE_TRIAGE_DOCS = [
  'docs/supabase-staging-reset-failure-triage.md',
  'docs/supabase-staging-reset-failure-recovery-decision.md',
  'docs/supabase-staging-reset-failure-operator-checklist.md',
  'docs/implementation-prompts/prompt-supabase-staging-reset-recovery-execution.md',
] as const

const PR259_REPORT_DIR = 'docs/activation-supabase-staging-reset-execution-reports'
const PR252_REPORT_DIR = 'docs/activation-supabase-staging-data-impact-backup-reports'
const PR248_REPORT_DIR = 'docs/activation-supabase-staging-reset-approval-reports'
const PR247_REPORT_DIR = 'docs/activation-supabase-schema-parity-remediation-reports'
const PR241_REPORT_DIR = 'docs/activation-supabase-remote-schema-equivalence-reports'
const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const PR198_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const MIGRATION_DIR = path.join('supabase', 'migrations')
const APPROVED_STAGING_PROJECT_REF = 'wmyyttnynmteqgcdishd'
const APPROVED_STAGING_PROJECT_NAME = 'Reeditpro'
const APPROVED_STAGING_ENVIRONMENT = 'staging'
const APPROVED_DB_URL_ENV_NAMES = [
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
] as const
const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_DB_RESET',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_REPAIR',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACT_OUTPUT',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
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
type ReportBundle = ReturnType<typeof buildSupabaseStagingResetFailureTriageReports>

export function getSupabaseStagingResetFailureTriagePlan() {
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    branch: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_BRANCH,
    baseBranch: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_BASE_BRANCH,
    prTitle: '[foundation] Supabase staging reset failure triage',
    worktree: '/private/tmp/reeditpro-supabase-staging-reset-failure-triage',
    reportDir: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_EXPECTED_REPORTS,
    docs: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_DOCS,
    sourcePrs: [198, 223, 241, 247, 248, 252, 259],
    approvedStagingTarget: {
      projectName: APPROVED_STAGING_PROJECT_NAME,
      projectRef: APPROVED_STAGING_PROJECT_REF,
      environment: APPROVED_STAGING_ENVIRONMENT,
    },
    docsBasis: {
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      dbPush: 'https://supabase.com/docs/reference/cli/introduction#supabase-db-push',
      changelog: 'https://supabase.com/changelog.md',
      checkedAt: '2026-06-09',
      blockingBreakingChangeFound: false,
    },
    allowedActions: [
      'read_committed_safe_reports',
      'inspect_local_migration_filenames',
      'optional_readonly_catalog_migration_schema_inspection_when_confirmed',
      'classify_partial_reset_risk',
      'recommend_future_recovery_phase',
      'write_safe_metadata_reports',
    ],
    blockedActions: [
      'retry_staging_reset',
      'supabase_db_push',
      'supabase_migration_repair',
      'direct_ddl_dml',
      'track_b_backfill_write',
      'production_supabase',
      'secret_printing',
      'provider_calls',
      'route_tool_worker_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
    allowedConfirmations: [
      SUPABASE_STAGING_RESET_FAILURE_TRIAGE_CONFIRMATION,
      SUPABASE_STAGING_RESET_FAILURE_TRIAGE_READONLY_CONFIRMATION,
      SUPABASE_STAGING_RESET_FAILURE_TRIAGE_MIGRATION_AUDIT_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    defaultDecision: 'recovery_path_manual_operator_review_required',
  }
}

export function buildSupabaseStagingResetFailureTriageReports(input: {
  executeReadonly?: boolean
} = {}) {
  const plan = getSupabaseStagingResetFailureTriagePlan()
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const evidenceInventory = buildEvidenceInventory()
  const backupExportArtifactStatus = buildBackupExportArtifactStatus(evidenceInventory)
  const resetFailureCommandEvidence = buildResetFailureCommandEvidence()
  const migrationHistoryDelta = buildMigrationHistoryDelta(evidenceInventory)
  const registrySchemaRlsState = buildRegistrySchemaRlsState(evidenceInventory)
  const readonlyInspection = input.executeReadonly
    ? runReadonlyStagingFailureTriageInspection()
    : loadLatestReadonlyInspectionReport() ?? buildReadonlyInspectionNotAttempted()
  const postFailureStagingState = buildPostFailureStagingState(
    evidenceInventory,
    migrationHistoryDelta,
    registrySchemaRlsState,
    readonlyInspection,
  )
  const partialResetRisk = buildPartialResetRiskClassification(
    evidenceInventory,
    postFailureStagingState,
    readonlyInspection,
  )
  const recoveryOptionMatrix = buildRecoveryOptionMatrix(evidenceInventory, partialResetRisk)
  const recoveryStrategyRecommendation = buildRecoveryStrategyRecommendation(recoveryOptionMatrix, partialResetRisk)
  const recoveryDecision = buildRecoveryDecision(recoveryStrategyRecommendation, partialResetRisk)
  const blockers = collectUniqueBlockers(
    extractBlockers(sourceOfTruthOwnershipAudit),
    extractBlockers(evidenceInventory),
    extractBlockers(resetFailureCommandEvidence),
    extractBlockers(migrationHistoryDelta),
    extractBlockers(registrySchemaRlsState),
    extractBlockers(readonlyInspection),
    extractBlockers(partialResetRisk),
    extractBlockers(recoveryDecision),
  )
  const blockerReport = buildBlockerReport(blockers)
  const readinessReport = buildReadinessReport(recoveryDecision, partialResetRisk, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit,
    plan,
    evidenceInventory,
    backupExportArtifactStatus,
    resetFailureCommandEvidence,
    postFailureStagingState,
    migrationHistoryDelta,
    registrySchemaRlsState,
    readonlyInspection,
    partialResetRisk,
    recoveryOptionMatrix,
    recoveryStrategyRecommendation,
    recoveryDecision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function writeSupabaseStagingResetFailureTriageArtifacts(reports: ReportBundle) {
  const dir = SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'post_failure_source_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'backup_export_artifact_status.json'), reports.backupExportArtifactStatus)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'reset_failure_command_evidence.json'), reports.resetFailureCommandEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'post_failure_staging_state_assessment.json'), reports.postFailureStagingState)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_post_failure_state_report.json'), reports.postFailureStagingState)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_delta_after_failed_reset.json'), reports.migrationHistoryDelta)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'registry_schema_rls_state_after_failed_reset.json'), reports.registrySchemaRlsState)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'readonly_staging_failure_triage_inspection.json'), reports.readonlyInspection)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'partial_reset_risk_classification.json'), reports.partialResetRisk)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_failure_classification_report.json'), reports.partialResetRisk)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'recovery_option_matrix.json'), reports.recoveryOptionMatrix)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'recovery_strategy_recommendation.json'), reports.recoveryStrategyRecommendation)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'recovery_decision.json'), reports.recoveryDecision)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_recovery_decision.json'), reports.recoveryDecision)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'recovery_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_failure_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'recovery_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'recovery_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/supabase-staging-reset-failure-triage.md', renderTriageMarkdown(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-staging-reset-failure-recovery-decision.md',
    renderDecisionMarkdown(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-staging-reset-failure-operator-checklist.md',
    renderOperatorChecklistMarkdown(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-staging-reset-recovery-execution.md',
    renderRecoveryExecutionPrompt(reports),
  )
}

export async function executeSupabaseStagingResetFailureTriage(input: {
  readonlyMode: boolean
  keepTemp: boolean
}) {
  void input.keepTemp
  const reports = buildSupabaseStagingResetFailureTriageReports({
    executeReadonly: input.readonlyMode,
  })
  await writeSupabaseStagingResetFailureTriageArtifacts(reports)
  const readonlyConfirmed =
    !input.readonlyMode ||
    (process.env[SUPABASE_STAGING_RESET_FAILURE_TRIAGE_CONFIRMATION] === 'true' &&
      process.env[SUPABASE_STAGING_RESET_FAILURE_TRIAGE_READONLY_CONFIRMATION] === 'true' &&
      process.env[SUPABASE_STAGING_RESET_FAILURE_TRIAGE_MIGRATION_AUDIT_CONFIRMATION] === 'true')
  const forbiddenClear = FORBIDDEN_CONFIRMATIONS.every((name) => process.env[name] !== 'true')
  const readonlyPassed = !input.readonlyMode || reports.readonlyInspection.status === 'passed'
  return {
    reports,
    exitCode: readonlyConfirmed && forbiddenClear && readonlyPassed ? 0 : 1,
  }
}

export function readSupabaseStagingResetFailureTriageSummary() {
  const reports = buildSupabaseStagingResetFailureTriageReports()
  const pr259Evidence = asRecord(reports.evidenceInventory.pr259)
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.recoveryDecision.decision,
    resetAttemptedInPr259: pr259Evidence.resetAttempted === true,
    stagingSqlMayHaveRun: pr259Evidence.stagingSqlMayHaveRun === true,
    registryMigrationApplied: reports.migrationHistoryDelta.registryMigrationApplied,
    registryTablesFound: reports.registrySchemaRlsState.tableCountFound,
    partialResetRisk: reports.partialResetRisk.riskLevel,
    postFailureStateClassifier: reports.postFailureStagingState.stateClassifier,
    readonlyInspectionStatus: reports.readonlyInspection.status,
    readonlyInspectionPreserved: reports.readonlyInspection.preservedFromLatestReport === true,
    secretRefUsed: reports.readonlyInspection.secretRefUsed,
    payloadAccessStatus: reports.readonlyInspection.payloadAccessStatus,
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
    resetRetryRun: false,
    schemaDeployRun: false,
    migrationRepairRun: false,
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
    'docs/source-of-truth-map.md',
    'docs/production-milestone-plan.md',
    'docs/beta-readiness-scorecard.md',
    'docs/production-beta-blocker-inventory.md',
    'docs/supabase-staging-reset-execution.md',
    'docs/supabase-staging-reset-failure-triage.md',
  ]
  const reportPaths = [
    path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'),
    path.join(PR259_REPORT_DIR, 'staging_reset_post_verify_report.json'),
    path.join(PR259_REPORT_DIR, 'staging_reset_schema_rls_verify_report.json'),
    path.join(PR259_REPORT_DIR, 'staging_reset_backup_export_execution_report.json'),
    path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
    path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'),
    path.join(PR241_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'),
    path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
    path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
  ]
  const missingRequiredReports = reportPaths.slice(0, 4).filter((reportPath) => !existsSync(reportPath))
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    mode: 'post_failed_reset_triage_reporting_only',
    sourcePaths: sourcePaths.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      type: existsSync(sourcePath) && safeStatIsDirectory(sourcePath) ? 'directory' : 'file',
    })),
    reportPaths: reportPaths.map((reportPath) => ({
      path: reportPath,
      present: existsSync(reportPath),
    })),
    migration: {
      path: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
      present: existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH),
      localMigrationIds: getLocalMigrationIds(),
    },
    ownership: {
      pr259: 'guarded staging reset/reapply execution attempt and post-failure verification evidence',
      thisPhase: 'triage, risk classification, and non-executable recovery recommendation',
      futurePhase: 'separate human-approved recovery execution only',
    },
    duplicateWorkAvoided: [
      'no_new_schema',
      'no_new_reset_path',
      'no_new_deploy_wrapper',
      'no_migration_repair_path',
      'no_track_b_backfill_write_path',
    ],
    status: missingRequiredReports.length === 0 ? 'passed' : 'blocked',
    blockers: missingRequiredReports.length === 0
      ? []
      : ['pr259_reset_execution_report_missing'] satisfies SupabaseStagingResetFailureTriageBlocker[],
    productionAffected: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildEvidenceInventory(): JsonRecord {
  const execution = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'))
  const postVerify = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_post_verify_report.json'))
  const schemaRls = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_schema_rls_verify_report.json'))
  const backup = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_backup_export_execution_report.json'))
  const blocker = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_blocker_report.json'))
  const readiness = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_readiness_report.json'))
  const blockers: SupabaseStagingResetFailureTriageBlocker[] = []
  if (!execution) blockers.push('pr259_reset_execution_report_missing')
  if (!execution?.resetAttempted || execution?.stagingSqlMayHaveRun !== true) {
    blockers.push('pr259_reset_failure_evidence_missing')
  }
  if (!postVerify) blockers.push('pr259_post_verify_report_missing')
  if (!schemaRls) blockers.push('pr259_schema_rls_verify_report_missing')
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    pr259: {
      resetExecutionReportPresent: Boolean(execution),
      postVerifyReportPresent: Boolean(postVerify),
      schemaRlsVerifyReportPresent: Boolean(schemaRls),
      backupExportReportPresent: Boolean(backup),
      resetStatus: asString(execution?.status, 'missing'),
      resetAttempted: execution?.resetAttempted === true,
      resetPerformed: execution?.resetPerformed === true,
      stagingSqlMayHaveRun: execution?.stagingSqlMayHaveRun === true,
      resetCommandExitCode: asNullableNumber(asRecord(execution?.resetCommand)?.exitCode),
      resetErrorCategory: asString(asRecord(execution?.resetCommand)?.errorCategory, 'unknown_or_missing'),
      resetCommandStdoutSecretPatternDetected:
        asRecord(asRecord(execution?.resetCommand)?.stdoutSummary)?.secretPatternDetected === true,
      resetCommandStderrSecretPatternDetected:
        asRecord(asRecord(execution?.resetCommand)?.stderrSummary)?.secretPatternDetected === true,
      migrationHistoryVerified: postVerify?.migrationHistoryVerified === true,
      schemaRlsVerified: schemaRls?.schemaRlsVerified === true,
      registryMigrationApplied: postVerify?.registryMigrationApplied === true,
      registryTablesFound: asNumber(schemaRls?.tableCountFound, 0),
      activeBlockers: asStringArray(blocker?.activeBlockers),
      readinessStatus: asString(readiness?.status, 'missing'),
    },
    upstreamEvidence: {
      pr252Decision: readReportDecision(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
      pr248Decision: readReportDecision(PR248_REPORT_DIR, 'staging_reset_approval_decision.json'),
      pr247Decision: readReportDecision(PR247_REPORT_DIR, 'schema_parity_decision.json'),
      pr241Equivalence: readReportDecision(PR241_REPORT_DIR, 'migration_history_repair_approval_after_equivalence_review.json'),
      pr223Transport: readReportDecision(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
      pr198Backfill: readReportDecision(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
    },
    safeMetadataOnly: true,
    resetRetryRun: false,
    schemaDeployRun: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildBackupExportArtifactStatus(evidence: JsonRecord): JsonRecord {
  const backup = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_backup_export_execution_report.json'))
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: backup?.status === 'passed' ? 'backup_metadata_available' : 'backup_metadata_missing_or_blocked',
    backupExportPerformedInPr259: backup?.backupExportPerformed === true,
    backupType: asString(backup?.backupType, 'unknown'),
    backupDestination: backup?.backupDestination === 'redacted_temp_directory_outside_repo'
      ? 'redacted_temp_directory_outside_repo'
      : 'not_reported_or_untrusted',
    backupFileCreated: backup?.backupFileCreated === true,
    backupFileByteLength: asNumber(backup?.backupFileByteLength, 0),
    backupPayloadCommitted: backup?.backupPayloadCommitted === true,
    backupPayloadPrinted: backup?.backupPayloadPrinted === true,
    dbUrlPrinted: backup?.dbUrlPrinted === true,
    credentialPayloadsPrinted: backup?.credentialPayloadsPrinted === true,
    restoreScopeProven: false,
    restoreCanBeApprovedInThisPhase: false,
    restoreRequiresSeparateExecutionApproval: true,
    evidenceResetAttempted: asRecord(evidence.pr259).resetAttempted === true,
    blockers: backup?.status === 'passed' ? [] : ['backup_restore_scope_not_proven'],
  }
}

function buildResetFailureCommandEvidence(): JsonRecord {
  const execution = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'))
  const resetCommand = asRecord(execution?.resetCommand)
  const blockers: SupabaseStagingResetFailureTriageBlocker[] = []
  if (!execution) blockers.push('pr259_reset_execution_report_missing')
  if (execution?.resetAttempted !== true) blockers.push('pr259_reset_failure_evidence_missing')
  if (execution?.status === 'blocked') blockers.push('staging_reset_failed')
  if (execution?.stagingSqlMayHaveRun === true) blockers.push('staging_sql_may_have_run')
  blockers.push('reset_failure_cause_not_proven')
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'blocked',
    source: path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'),
    resetAttempted: execution?.resetAttempted === true,
    resetPerformed: execution?.resetPerformed === true,
    stagingSqlMayHaveRun: execution?.stagingSqlMayHaveRun === true,
    selectedStrategy: asString(execution?.selectedStrategy, 'unknown'),
    noSeedFlagUsed: execution?.noSeedFlagUsed === true,
    seedFilesIncluded: execution?.seedFilesIncluded === true,
    command: {
      status: asString(resetCommand.status, 'missing'),
      command: asString(resetCommand.command, 'unknown'),
      args: asStringArray(resetCommand.args),
      exitCode: asNullableNumber(resetCommand.exitCode),
      stdoutSummary: asRecord(resetCommand.stdoutSummary),
      stderrSummary: asRecord(resetCommand.stderrSummary),
      errorCategory: asString(resetCommand.errorCategory, 'unknown_or_missing'),
    },
    rawStdoutCommitted: false,
    rawStderrCommitted: false,
    dbUrlPrinted: execution?.dbUrlPrinted === true,
    credentialPayloadsPrinted: execution?.credentialPayloadsPrinted === true,
    resetRetryApproved: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildMigrationHistoryDelta(evidence: JsonRecord): JsonRecord {
  const postVerify = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_post_verify_report.json'))
  const missing = asStringArray(postVerify?.missingLocalIdsAfterReset)
  const registryMigrationApplied = postVerify?.registryMigrationApplied === true
  const blockers: SupabaseStagingResetFailureTriageBlocker[] = []
  if (!postVerify) blockers.push('pr259_post_verify_report_missing')
  if (postVerify?.migrationHistoryVerified !== true) {
    blockers.push('staging_post_reset_migration_history_verify_failed')
  }
  if (!registryMigrationApplied) blockers.push('registry_migration_not_applied')
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    source: path.join(PR259_REPORT_DIR, 'staging_reset_post_verify_report.json'),
    verificationPerformed: postVerify?.verificationPerformed === true,
    migrationHistoryVerified: postVerify?.migrationHistoryVerified === true,
    migrationHistoryParseMode: asString(postVerify?.migrationHistoryParseMode, 'missing'),
    localMigrationIds: asStringArray(postVerify?.localMigrationIds),
    remoteMigrationIds: asStringArray(postVerify?.remoteMigrationIds),
    missingLocalIdsAfterReset: missing,
    missingLocalMigrationCount: missing.length,
    registryMigrationId: '202606050001',
    registryMigrationApplied,
    remoteUnknownIdsAfterReset: asStringArray(postVerify?.remoteUnknownIdsAfterReset),
    localMigrationCount: getLocalMigrationIds().length,
    stagingMayBePartiallyReset: asRecord(evidence.pr259).stagingSqlMayHaveRun === true && missing.length > 0,
    resetRetryApproved: false,
    migrationRepairApproved: false,
    schemaDeployApproved: false,
    dbUrlPrinted: postVerify?.dbUrlPrinted === true,
    credentialPayloadsPrinted: postVerify?.credentialPayloadsPrinted === true,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildRegistrySchemaRlsState(evidence: JsonRecord): JsonRecord {
  const schemaRls = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_schema_rls_verify_report.json'))
  const missingTables = asStringArray(schemaRls?.missingTables)
  const blockers: SupabaseStagingResetFailureTriageBlocker[] = []
  if (!schemaRls) blockers.push('pr259_schema_rls_verify_report_missing')
  if (schemaRls?.schemaRlsVerified !== true) blockers.push('staging_post_reset_schema_rls_verify_failed')
  if (missingTables.length > 0) blockers.push('registry_schema_absent_after_failed_reset')
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    source: path.join(PR259_REPORT_DIR, 'staging_reset_schema_rls_verify_report.json'),
    verificationPerformed: schemaRls?.verificationPerformed === true,
    schemaRlsVerified: schemaRls?.schemaRlsVerified === true,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    tableCountFound: asNumber(schemaRls?.tableCountFound, 0),
    missingTables,
    rlsDisabledTables: asStringArray(schemaRls?.rlsDisabledTables),
    broadGrantCount: asNumber(schemaRls?.broadGrantCount, 0),
    publicAnonAuthenticatedRevoked: schemaRls?.publicAnonAuthenticatedRevoked === true,
    serviceRoleOnlyExpected: schemaRls?.serviceRoleOnlyExpected === true,
    stagingMayBePartiallyReset: asRecord(evidence.pr259).stagingSqlMayHaveRun === true,
    resetRetryApproved: false,
    migrationRepairApproved: false,
    schemaDeployApproved: false,
    dbUrlPrinted: schemaRls?.dbUrlPrinted === true,
    hostnamePrinted: schemaRls?.hostnamePrinted === true,
    usernamePrinted: schemaRls?.usernamePrinted === true,
    passwordPrinted: schemaRls?.passwordPrinted === true,
    credentialPayloadsPrinted: schemaRls?.credentialPayloadsPrinted === true,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildPostFailureStagingState(
  evidence: JsonRecord,
  migrationHistoryDelta: JsonRecord,
  registrySchemaRlsState: JsonRecord,
  readonlyInspection: JsonRecord,
): JsonRecord {
  const classifier = classifyPostFailureState(migrationHistoryDelta, readonlyInspection)
  const blockers = collectUniqueBlockers(
    [
      'staging_reset_failed',
      'staging_post_reset_migration_history_verify_failed',
      'staging_post_reset_schema_rls_verify_failed',
      'manual_operator_review_required',
    ],
    classifier.blockers,
  )
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'blocked',
    source: 'committed_pr259_reports_plus_optional_readonly_inspection',
    resetAttempted: asRecord(evidence.pr259).resetAttempted === true,
    resetPerformed: asRecord(evidence.pr259).resetPerformed === true,
    stagingSqlMayHaveRun: asRecord(evidence.pr259).stagingSqlMayHaveRun === true,
    migrationHistoryVerified: migrationHistoryDelta.migrationHistoryVerified === true,
    registryMigrationApplied: migrationHistoryDelta.registryMigrationApplied === true,
    registryTablesFound: asNumber(registrySchemaRlsState.tableCountFound, 0),
    registryTablesMissing: asStringArray(registrySchemaRlsState.missingTables),
    optionalReadonlyInspectionStatus: asString(readonlyInspection.status, 'not_attempted'),
    optionalReadonlyInspectionPerformed: readonlyInspection.inspectionPerformed === true,
    stateClassifier: classifier.stateClassifier,
    stateConfidence: classifier.confidence,
    readonlyComparison: classifier.comparison,
    readonlyEvidenceSummary: classifier.evidenceSummary,
    clearForFurtherMutation: false,
    mutationBlockReason: classifier.mutationBlockReason,
    productionAffected: false,
    blockers,
  }
}

function buildPartialResetRiskClassification(
  evidence: JsonRecord,
  postFailureState: JsonRecord,
  readonlyInspection: JsonRecord,
): JsonRecord {
  const stagingSqlMayHaveRun = asRecord(evidence.pr259).stagingSqlMayHaveRun === true
  const registryAbsent = asNumber(postFailureState.registryTablesFound, 0) === 0
  const stateClassifier = asString(postFailureState.stateClassifier, 'unknown')
  const blockers: SupabaseStagingResetFailureTriageBlocker[] = [
    'reset_failure_cause_not_proven',
    'manual_operator_review_required',
    'future_recovery_execution_approval_required',
  ]
  if (stagingSqlMayHaveRun) blockers.push('staging_sql_may_have_run')
  if (registryAbsent) blockers.push('registry_schema_absent_after_failed_reset')
  if (stateClassifier === 'unknown') blockers.push('post_failure_state_unknown')
  if (stateClassifier === 'partially_mutated') blockers.push('post_failure_state_partially_mutated')
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'blocked',
    riskLevel: stateClassifier === 'partially_mutated'
      ? 'high'
      : stagingSqlMayHaveRun
        ? 'medium_high'
        : 'medium',
    classification: stateClassifier === 'unchanged_failed_state'
      ? 'unchanged_failed_state_registry_absent_manual_review_required'
      : stateClassifier === 'partially_mutated'
        ? 'partial_or_conflicting_post_failure_state_manual_review_required'
        : 'post_failure_state_unknown_manual_review_required',
    stateClassifier,
    readonlyComparison: asRecord(postFailureState.readonlyComparison),
    failureCauseClassification: classifyResetFailureCause().classification,
    failureCauseFixableByTransportRepair: classifyResetFailureCause().fixableByTransportRepair,
    pointsToUnresolvedSupabaseCliOrPlatformIssue: classifyResetFailureCause().pointsToSupabaseCliOrPlatformIssue,
    evidenceBasis: [
      'PR #259 reset command exited nonzero',
      'PR #259 recorded stagingSqlMayHaveRun true',
      'post-reset migration history verification failed',
      'activation registry migration and tables remain absent',
      `post-failure state classifier: ${stateClassifier}`,
    ],
    readonlyInspectionStatus: asString(readonlyInspection.status, 'not_attempted'),
    recoveryCanProceedAutomatically: false,
    resetRetrySafeWithoutReview: false,
    migrationRepairSafeWithoutReview: false,
    schemaDeploySafeWithoutReview: false,
    trackBBackfillSafeWithoutReview: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildRecoveryOptionMatrix(evidence: JsonRecord, risk: JsonRecord): JsonRecord {
  const stateClassifier = asString(risk.stateClassifier, 'unknown')
  const failureCause = classifyResetFailureCause()
  const retryStatus = stateClassifier === 'unchanged_failed_state' && failureCause.fixableByTransportRepair
    ? 'candidate_requires_separate_execution_approval'
    : 'not_approved'
  const supportStatus = stateClassifier === 'unchanged_failed_state' && failureCause.pointsToSupabaseCliOrPlatformIssue
    ? 'conditional_recommended'
    : 'conditional'
  const restoreStatus = stateClassifier === 'partially_mutated'
    ? 'candidate_only_if_backup_restore_sufficiency_is_separately_proven'
    : 'not_approved'
  const options: Array<JsonRecord & { option: SupabaseStagingResetFailureRecoveryOption }> = [
    {
      option: 'retry_reset_after_fix',
      status: retryStatus,
      reason: retryStatus === 'not_approved'
        ? 'Exact reset failure cause is not proven as a safe fixable CLI/transport issue.'
        : 'Current readonly state appears unchanged, but execution still requires a separate recovery approval phase.',
      requiresFutureApproval: true,
      resetRetryRunInThisPhase: false,
    },
    {
      option: 'restore_backup_then_retry',
      status: restoreStatus,
      reason: 'PR #259 backup is private temp schema/migration-history metadata; restore sufficiency is not proven for this triage phase.',
      requiresFutureApproval: true,
      restoreRunInThisPhase: false,
    },
    {
      option: 'ordered_migration_apply_without_reset',
      status: 'not_approved',
      reason: 'Would be a staging schema mutation and must be separately scoped, dry-run reviewed, and approved.',
      requiresFutureApproval: true,
      schemaDeployRunInThisPhase: false,
    },
    {
      option: 'manual_operator_review',
      status: 'recommended_default',
      reason: 'Failure reached the reset CLI and current evidence still does not prove a safe automated recovery action.',
      requiresFutureApproval: true,
      selected: true,
    },
    {
      option: 'supabase_support_or_cli_issue',
      status: supportStatus,
      reason: 'Use only if redacted logs or readonly evidence identifies a CLI/platform issue.',
      requiresFutureApproval: true,
    },
    {
      option: 'reject_due_staging_data_risk',
      status: 'conditional',
      reason: 'Use only if staging data/dependency review shows reset recovery is unacceptable.',
      requiresFutureApproval: true,
    },
  ]
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'blocked',
    decisionDefault: 'recovery_path_manual_operator_review_required',
    riskClassification: asString(risk.classification, 'unknown'),
    stateClassifier,
    failureCauseClassification: failureCause.classification,
    resetAttemptedInPr259: asRecord(evidence.pr259).resetAttempted === true,
    stagingSqlMayHaveRun: asRecord(evidence.pr259).stagingSqlMayHaveRun === true,
    options,
    resetRetryApproved: false,
    restoreApproved: false,
    orderedMigrationApplyApproved: false,
    migrationRepairApproved: false,
    trackBBackfillApproved: false,
    productionAffected: false,
    blockers: ['manual_operator_review_required', 'future_recovery_execution_approval_required'],
  }
}

function buildRecoveryStrategyRecommendation(optionMatrix: JsonRecord, risk: JsonRecord): JsonRecord {
  const stateClassifier = asString(risk.stateClassifier, 'unknown')
  const failureCause = classifyResetFailureCause()
  const decision = selectRecoveryDecision(stateClassifier, failureCause)
  const selectedRecommendation =
    decision === 'recovery_path_retry_reset_after_fix'
      ? 'future_retry_reset_after_fix_requires_separate_execution_approval'
      : decision === 'recovery_path_blocked_pending_supabase_support_or_cli_issue'
        ? 'supabase_support_or_cli_issue_review_before_recovery_mutation'
        : 'manual_operator_review_before_any_recovery_mutation'
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'blocked',
    selectedRecommendation,
    decision,
    rationale: [
      'PR #259 reset failed after reaching the Supabase CLI.',
      'Committed post-failure verification shows registry migration and registry tables are still absent.',
      `Current post-failure state classifier: ${stateClassifier}.`,
      'The PR #259 backup exists only as private temp metadata backup and is not committed.',
      'No future reset retry, restore, ordered apply, or migration repair is safe without a separate approval phase.',
    ],
    nextRecommendedPhase:
      'Human-approved staging reset recovery execution packet after operator review of safe failure logs, backup sufficiency, and target state.',
    rejectedAutomaticOptions: asArray(optionMatrix.options).filter((option) => asString(option.status, '') === 'not_approved'),
    partialResetRisk: asString(risk.riskLevel, 'unknown'),
    resetRetryRun: false,
    schemaDeployRun: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    blockers: ['manual_operator_review_required', 'future_recovery_execution_approval_required'],
  }
}

function buildRecoveryDecision(recommendation: JsonRecord, risk: JsonRecord): JsonRecord {
  const decision = asString(recommendation.decision, 'recovery_path_manual_operator_review_required')
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'blocked',
    decision,
    approvalStatus: 'not_approved_for_recovery_execution',
    recoveryExecutionAllowedInThisPhase: false,
    resetRetryApproved: false,
    restoreApproved: false,
    orderedMigrationApplyApproved: false,
    migrationRepairApproved: false,
    schemaDeployApproved: false,
    trackBBackfillApproved: false,
    productionApproved: false,
    selectedRecommendation: recommendation.selectedRecommendation,
    partialResetRisk: asString(risk.riskLevel, 'unknown'),
    stateClassifier: asString(risk.stateClassifier, 'unknown'),
    failureCauseClassification: asString(risk.failureCauseClassification, 'unknown'),
    requiredBeforeFutureRecovery: [
      'redacted reset failure log review',
      'operator confirmation of staging state after failed reset',
      'backup/restore sufficiency review',
      'separate human approval for exact recovery action',
      'post-recovery migration history and schema/RLS verification',
    ],
    sqlExecutedInThisPhase: false,
    stagingMutationInThisPhase: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    blockers: ['manual_operator_review_required', 'future_recovery_execution_approval_required'],
  }
}

function buildBlockerReport(blockers: SupabaseStagingResetFailureTriageBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'blocked',
    activeBlockers: collectUniqueBlockers(blockers),
    expectedSafeBlockers: [
      'staging_reset_failed',
      'staging_sql_may_have_run',
      'staging_post_reset_migration_history_verify_failed',
      'staging_post_reset_schema_rls_verify_failed',
      'registry_migration_not_applied',
      'registry_schema_absent_after_failed_reset',
      'manual_operator_review_required',
      'future_recovery_execution_approval_required',
    ],
    stillBlockedScopes: [
      'staging_reset_retry',
      'schema_deploy',
      'migration_repair',
      'track_b_backfill_write',
      'production_supabase',
      'direct_manual_sql',
      'provider_calls',
      'route_execution',
      'worker_execution',
      'tool_execution',
      'media_processing',
      'track_a',
      'beta_unlock',
      'production_unlock',
    ],
    resetRetryAllowed: false,
    recoveryExecutionAllowed: false,
    productionAffected: false,
  }
}

function buildReadinessReport(decision: JsonRecord, risk: JsonRecord, blocker: JsonRecord): JsonRecord {
  const decisionValue = asString(decision.decision, 'recovery_path_manual_operator_review_required')
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'blocked',
    decision: decision.decision,
    approvalStatus: decision.approvalStatus,
    partialResetRisk: risk.riskLevel,
    stagingResetFailureTriaged: true,
    recoveryExecutionReady: false,
    resetRetryAllowed: false,
    restoreAllowed: false,
    schemaDeployAllowed: false,
    migrationRepairAllowed: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    blockers: asStringArray(blocker.activeBlockers),
    nextRecommendedPhase: decisionValue === 'recovery_path_retry_reset_after_fix'
      ? 'Separate human-approved reset retry execution packet after redacted CLI/transport fix evidence and backup sufficiency review.'
      : decisionValue === 'recovery_path_blocked_pending_supabase_support_or_cli_issue'
        ? 'Supabase CLI/platform issue review packet before any recovery mutation.'
        : 'Separate human-approved staging reset recovery execution packet after operator review of failure cause and backup sufficiency.',
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'committed_safe_metadata_only',
    reportDir: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_EXPECTED_REPORTS,
    privateUploadRequired: false,
    privateUploadPerformed: false,
    backupArtifacts: {
      source: 'pr259_redacted_metadata_only',
      backupPayloadCommitted: false,
      backupPayloadPrinted: false,
      backupLocationCommitted: false,
    },
    dbUrlCommitted: false,
    secretsCommitted: false,
    stagingDataBackfillWritten: false,
    productionAffected: false,
  }
}

function loadLatestReadonlyInspectionReport(): JsonRecord | null {
  const report = readJsonArtifact(path.join(
    SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR,
    'readonly_staging_failure_triage_inspection.json',
  ))
  if (!report || asString(report.status, 'not_attempted') === 'not_attempted') return null
  return {
    ...report,
    ...getSecretHandlingMetadata(report),
    preservedFromLatestReport: true,
    preservedByNonExecuteReport: true,
    preservationReason:
      'default report generation preserves the latest explicit readonly inspection instead of overwriting it to not_attempted',
  }
}

function buildReadonlyInspectionNotAttempted(): JsonRecord {
  const secretHandling = getSecretHandlingMetadata()
  return {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: 'not_attempted',
    inspectionPerformed: false,
    reason: 'readonly_staging_inspection_optional_and_not_requested_for_default_reports',
    ...secretHandling,
    dbUrlValuePrinted: false,
    credentialPayloadsPrinted: false,
    secretPayloadPrinted: false,
    productionTouched: false,
    directDdlDmlRun: false,
    mutationRun: false,
    blockers: [],
  }
}

function runReadonlyStagingFailureTriageInspection(): JsonRecord {
  const secretHandling = getSecretHandlingMetadata()
  const forbiddenConfirmationsSet = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const confirmationBlockers: SupabaseStagingResetFailureTriageBlocker[] = []
  if (process.env[SUPABASE_STAGING_RESET_FAILURE_TRIAGE_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_reset_failure_triage_not_confirmed')
  }
  if (process.env[SUPABASE_STAGING_RESET_FAILURE_TRIAGE_READONLY_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_schema_readonly_inspection_not_confirmed')
  }
  if (process.env[SUPABASE_STAGING_RESET_FAILURE_TRIAGE_MIGRATION_AUDIT_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_migration_history_audit_not_confirmed')
  }
  if (forbiddenConfirmationsSet.length > 0) confirmationBlockers.push('forbidden_confirmation_set')
  const dbUrlCheck = getApprovedDbUrlEnv()
  const psqlCheck = findUsablePsql()
  const blockers = collectUniqueBlockers(
    confirmationBlockers,
    dbUrlCheck.blockers,
    psqlCheck.blockers,
  )
  const base = {
    phase: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_PHASE,
    runId: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_RUN_ID,
    status: blockers.length === 0 ? 'planned' : 'blocked',
    inspectionPerformed: blockers.length === 0,
    mode: 'readonly_staging_failure_triage_catalog_inspection',
    approvedDbUrlEnvNames: APPROVED_DB_URL_ENV_NAMES,
    ...secretHandling,
    dbUrlEnvPresent: dbUrlCheck.present,
    dbUrlEnvName: dbUrlCheck.envName,
    dbUrlTargetMatchedApprovedStaging: dbUrlCheck.targetMatched,
    dbUrlValuePrinted: false,
    hostnamePrinted: false,
    usernamePrinted: false,
    passwordPrinted: false,
    credentialPayloadsPrinted: false,
    secretPayloadPrinted: false,
    payloadPrinted: false,
    payloadCommitted: false,
    secretPayloadCommitted: false,
    psqlAvailable: psqlCheck.available,
    psqlVersionChecked: psqlCheck.versionChecked,
    psqlVersionSummary: psqlCheck.versionSummary,
    forbiddenConfirmationsSet,
    productionTouched: false,
    directDdlDmlRun: false,
    mutationRun: false,
  }
  if (blockers.length > 0 || !dbUrlCheck.parsed || !psqlCheck.psqlPath) {
    return {
      ...base,
      status: 'blocked',
      inspectionPerformed: false,
      queryReports: [],
      catalog: emptyReadonlyCatalog(),
      blockers,
    }
  }
  const catalog = emptyReadonlyCatalog()
  const queryReports: JsonRecord[] = []
  for (const [key, sql] of Object.entries(READONLY_FAILURE_TRIAGE_QUERIES)) {
    const result = runReadonlyPsqlJsonQuery(psqlCheck.psqlPath, dbUrlCheck.parsed, key, sql)
    queryReports.push(result.report)
    if (result.status === 'passed') {
      ;(catalog as Record<string, JsonRecord[]>)[key] = result.rows
    } else {
      blockers.push('readonly_failure_triage_query_failed')
    }
  }
  return {
    ...base,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    inspectionPerformed: true,
    queryReports,
    catalog,
    migrationHistoryCount: catalog.migrationHistory.length,
    registryTableCount: catalog.registryTables.length,
    registryRlsRows: catalog.registryRls.length,
    registryGrantRows: catalog.registryGrants.length,
    rowContentsRead: false,
    countOnlyOrCatalogMetadataOnly: true,
    blockers: collectUniqueBlockers(blockers),
  }
}

function getApprovedDbUrlEnv() {
  const envName = APPROVED_DB_URL_ENV_NAMES.find((name) => Boolean(process.env[name]))
  if (!envName) {
    return {
      present: false,
      envName: null,
      parsed: null,
      targetMatched: false,
      blockers: ['staging_db_url_unavailable_for_failure_triage'] as SupabaseStagingResetFailureTriageBlocker[],
    }
  }
  try {
    const rawUrl = process.env[envName] ?? ''
    const parsedUrl = new URL(rawUrl)
    const targetMatched = rawUrl.includes(APPROVED_STAGING_PROJECT_REF)
    return {
      present: true,
      envName,
      parsed: parsedUrl,
      targetMatched,
      blockers: targetMatched
        ? []
        : ['staging_db_url_target_ref_mismatch'] as SupabaseStagingResetFailureTriageBlocker[],
    }
  } catch {
    return {
      present: true,
      envName,
      parsed: null,
      targetMatched: false,
      blockers: ['staging_db_url_unparseable'] as SupabaseStagingResetFailureTriageBlocker[],
    }
  }
}

function findUsablePsql() {
  const candidates = collectUniqueStrings([process.env.REEDITPRO_PSQL_PATH, 'psql'].filter(Boolean) as string[])
  for (const candidate of candidates) {
    try {
      const version = execFileSync(candidate, ['--version'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000,
      }).trim()
      return {
        available: true,
        psqlPath: candidate,
        versionChecked: true,
        versionSummary: version.replace(/\s+/g, ' ').slice(0, 120),
        blockers: [] as SupabaseStagingResetFailureTriageBlocker[],
      }
    } catch {
      // Try the next candidate.
    }
  }
  return {
    available: false,
    psqlPath: null,
    versionChecked: true,
    versionSummary: null,
    blockers: ['psql_unavailable_for_failure_triage'] as SupabaseStagingResetFailureTriageBlocker[],
  }
}

function runReadonlyPsqlJsonQuery(psqlPath: string, dbUrl: URL, queryName: string, sql: string) {
  const env = {
    ...process.env,
    PGHOST: dbUrl.hostname,
    PGPORT: dbUrl.port || '5432',
    PGDATABASE: dbUrl.pathname.replace(/^\//, '') || 'postgres',
    PGUSER: decodeURIComponent(dbUrl.username),
    PGPASSWORD: decodeURIComponent(dbUrl.password),
    PGSSLMODE: dbUrl.searchParams.get('sslmode') ?? 'require',
    PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=15000',
  }
  const args = ['-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql]
  try {
    const stdout = execFileSync(psqlPath, args, {
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 20000,
    }).trim()
    return {
      status: 'passed',
      rows: JSON.parse(stdout || '[]') as JsonRecord[],
      report: sanitizedPsqlQueryReport(queryName, 0, stdout, false),
    }
  } catch (error) {
    const output = error instanceof Error ? error.message : ''
    return {
      status: 'blocked',
      rows: [],
      report: sanitizedPsqlQueryReport(queryName, 1, output, true),
    }
  }
}

function sanitizedPsqlQueryReport(queryName: string, exitCode: number, output: string, failed: boolean) {
  return {
    queryName,
    status: failed ? 'blocked' : 'passed',
    exitCode,
    command: 'psql',
    args: ['-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', '[REDACTED_READONLY_FAILURE_TRIAGE_QUERY]'],
    sqlClass: 'readonly_catalog_or_migration_history_select',
    stdoutSummary: {
      byteLength: output.length,
      lineCount: output.length > 0 ? output.split('\n').length : 0,
      secretPatternDetected: SECRET_PATTERNS.some((pattern) => pattern.test(output)),
    },
    stderrSummary: {
      byteLength: 0,
      lineCount: 0,
      secretPatternDetected: false,
    },
    rowContentsRead: false,
    dbUrlPrinted: false,
    secretPayloadPrinted: false,
  }
}

const READONLY_FAILURE_TRIAGE_QUERIES = {
  migrationHistory:
    "select case when to_regclass('supabase_migrations.schema_migrations') is null then '[]'::json::text else (select coalesce(json_agg(json_build_object('version', version::text) order by version::text), '[]'::json)::text from supabase_migrations.schema_migrations) end;",
  registryTables:
    "select coalesce(json_agg(json_build_object('schema', table_schema, 'table', table_name, 'type', table_type) order by table_schema, table_name), '[]'::json)::text from information_schema.tables where table_schema = 'public' and table_name like 'activation_%';",
  registryRls:
    "select coalesce(json_agg(json_build_object('schema', n.nspname, 'table', c.relname, 'rlsEnabled', c.relrowsecurity, 'rlsForced', c.relforcerowsecurity) order by n.nspname, c.relname), '[]'::json)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relname like 'activation_%';",
  registryGrants:
    "select coalesce(json_agg(json_build_object('schema', table_schema, 'table', table_name, 'grantee', grantee, 'privilege', privilege_type) order by table_schema, table_name, grantee, privilege_type), '[]'::json)::text from information_schema.role_table_grants where table_schema = 'public' and table_name like 'activation_%' and grantee in ('public', 'anon', 'authenticated');",
} as const

function emptyReadonlyCatalog() {
  return {
    migrationHistory: [] as JsonRecord[],
    registryTables: [] as JsonRecord[],
    registryRls: [] as JsonRecord[],
    registryGrants: [] as JsonRecord[],
  }
}

function getSecretHandlingMetadata(existing: JsonRecord = {}): JsonRecord {
  const dbUrlEnvPresent = APPROVED_DB_URL_ENV_NAMES.some((name) => Boolean(process.env[name]))
  const rawStatus = process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_PAYLOAD_ACCESS_STATUS
  const payloadAccessStatus = rawStatus === 'succeeded' || rawStatus === 'failed' || rawStatus === 'not_attempted'
    ? rawStatus
    : asString(existing.payloadAccessStatus, 'not_attempted')
  const rawSecretRef = process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF
  const secretRefUsed = rawSecretRef === 'SUPABASE_DB_URL'
    ? 'SUPABASE_DB_URL'
    : asString(existing.secretRefUsed, rawSecretRef ? '[UNAPPROVED_SECRET_REF_REDACTED]' : 'not_used')
  return {
    secretRefUsed,
    payloadAccessStatus,
    payloadPrinted: false,
    payloadCommitted: false,
    dbUrlEnvPresent: dbUrlEnvPresent || existing.dbUrlEnvPresent === true,
    dbUrlValuePrinted: false,
    credentialPayloadsPrinted: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
  }
}

function classifyPostFailureState(migrationHistoryDelta: JsonRecord, readonlyInspection: JsonRecord) {
  const readonlyStatus = asString(readonlyInspection.status, 'not_attempted')
  const catalog = asRecord(readonlyInspection.catalog)
  const blockers: SupabaseStagingResetFailureTriageBlocker[] = []
  const pr259RemoteMigrationIds = asStringArray(migrationHistoryDelta.remoteMigrationIds)
  const currentMigrationIds = extractCatalogMigrationVersions(catalog.migrationHistory)
  const currentRegistryTables = extractCatalogTableNames(catalog.registryTables)
  const requiredRegistryTablesPresent = SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) =>
    currentRegistryTables.includes(table),
  )
  const registryRlsRows = asArray(catalog.registryRls)
  const registryGrantRows = asArray(catalog.registryGrants)
  const migrationHistoryMatchesPr259 =
    readonlyStatus === 'passed' && arraysEqual(pr259RemoteMigrationIds, currentMigrationIds)
  const currentRequiredRegistryTableCount = requiredRegistryTablesPresent.length
  const registryTablesRemainAbsent = currentRequiredRegistryTableCount === 0
  const partiallyPresentRegistryTables =
    currentRequiredRegistryTableCount > 0 && currentRequiredRegistryTableCount < SUPABASE_MILESTONE_REGISTRY_TABLES.length
  const registryStateConflictsWithPr259 =
    currentRequiredRegistryTableCount > 0 ||
    registryRlsRows.length > 0 ||
    registryGrantRows.length > 0 ||
    !migrationHistoryMatchesPr259

  if (readonlyStatus !== 'passed') {
    blockers.push('post_failure_state_unknown')
    return {
      stateClassifier: 'unknown',
      confidence: 'low_until_readonly_inspection_passes',
      mutationBlockReason:
        'current post-failure staging state is unknown because read-only inspection is missing or blocked',
      comparison: {
        readonlyStatus,
        migrationHistoryMatchesPr259: false,
        currentMigrationCount: currentMigrationIds.length,
        pr259RemoteMigrationCount: pr259RemoteMigrationIds.length,
        currentRequiredRegistryTableCount,
        registryTablesRemainAbsent,
      },
      evidenceSummary: {
        currentMigrationIds,
        pr259RemoteMigrationIds,
        requiredRegistryTablesPresent,
        registryRlsRowCount: registryRlsRows.length,
        registryGrantRowCount: registryGrantRows.length,
      },
      blockers: collectUniqueBlockers(blockers, extractBlockers(readonlyInspection)),
    }
  }

  if (migrationHistoryMatchesPr259 && registryTablesRemainAbsent && registryRlsRows.length === 0 && registryGrantRows.length === 0) {
    return {
      stateClassifier: 'unchanged_failed_state',
      confidence: 'medium_high_from_current_readonly_catalog_metadata',
      mutationBlockReason:
        'current read-only catalog metadata matches PR #259 failed-state evidence and registry tables remain absent',
      comparison: {
        readonlyStatus,
        migrationHistoryMatchesPr259,
        currentMigrationCount: currentMigrationIds.length,
        pr259RemoteMigrationCount: pr259RemoteMigrationIds.length,
        currentRequiredRegistryTableCount,
        registryTablesRemainAbsent,
      },
      evidenceSummary: {
        currentMigrationIds,
        pr259RemoteMigrationIds,
        requiredRegistryTablesPresent,
        registryRlsRowCount: registryRlsRows.length,
        registryGrantRowCount: registryGrantRows.length,
      },
      blockers: [] as SupabaseStagingResetFailureTriageBlocker[],
    }
  }

  if (!migrationHistoryMatchesPr259) blockers.push('migration_history_changed_after_failed_reset')
  if (partiallyPresentRegistryTables) blockers.push('registry_schema_partially_present_after_failed_reset')
  if (registryStateConflictsWithPr259) blockers.push('post_failure_state_partially_mutated')
  return {
    stateClassifier: 'partially_mutated',
    confidence: 'medium_from_current_readonly_catalog_metadata',
    mutationBlockReason:
      'current read-only catalog metadata conflicts with PR #259 failed-state evidence or shows partial registry state',
    comparison: {
      readonlyStatus,
      migrationHistoryMatchesPr259,
      currentMigrationCount: currentMigrationIds.length,
      pr259RemoteMigrationCount: pr259RemoteMigrationIds.length,
      currentRequiredRegistryTableCount,
      registryTablesRemainAbsent,
      partiallyPresentRegistryTables,
    },
    evidenceSummary: {
      currentMigrationIds,
      pr259RemoteMigrationIds,
      requiredRegistryTablesPresent,
      registryRlsRowCount: registryRlsRows.length,
      registryGrantRowCount: registryGrantRows.length,
    },
    blockers: collectUniqueBlockers(blockers),
  }
}

function classifyResetFailureCause() {
  const execution = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'))
  const resetCommand = asRecord(execution?.resetCommand)
  const errorCategory = asString(resetCommand.errorCategory, 'unknown_or_missing')
  const commandStatus = asString(resetCommand.status, 'unknown_or_missing')
  const knownFixableTransportCategories = [
    'bad_cpu_type',
    'cli_unavailable',
    'npx_cli_unavailable',
    'temp_npm_exec_supabase_cli_unavailable',
    'transport_preflight_failed',
  ]
  const knownSupabaseCliOrPlatformCategories = [
    'supabase_cli_issue',
    'supabase_platform_issue',
    'migration_engine_issue',
  ]
  const fixableByTransportRepair = knownFixableTransportCategories.includes(errorCategory)
  const pointsToSupabaseCliOrPlatformIssue = knownSupabaseCliOrPlatformCategories.includes(errorCategory)
  return {
    classification: fixableByTransportRepair
      ? 'safe_fixable_cli_transport_issue'
      : pointsToSupabaseCliOrPlatformIssue
        ? 'unresolved_supabase_cli_or_platform_issue'
        : 'reset_failure_cause_not_proven',
    commandStatus,
    errorCategory,
    fixableByTransportRepair,
    pointsToSupabaseCliOrPlatformIssue,
  }
}

function selectRecoveryDecision(
  stateClassifier: string,
  failureCause: ReturnType<typeof classifyResetFailureCause>,
) {
  if (stateClassifier === 'unchanged_failed_state' && failureCause.fixableByTransportRepair) {
    return 'recovery_path_retry_reset_after_fix'
  }
  if (failureCause.pointsToSupabaseCliOrPlatformIssue) {
    return 'recovery_path_blocked_pending_supabase_support_or_cli_issue'
  }
  return 'recovery_path_manual_operator_review_required'
}

function extractCatalogMigrationVersions(value: unknown) {
  return asArray(value)
    .map((row) => asString(row.version, ''))
    .filter(Boolean)
    .sort()
}

function extractCatalogTableNames(value: unknown) {
  return asArray(value)
    .map((row) => asString(row.table, ''))
    .filter(Boolean)
    .sort()
}

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function renderTriageMarkdown(reports: ReportBundle): string {
  return `# Supabase Staging Reset Failure Triage

Decision: \`${reports.recoveryDecision.decision}\`

PR #259 reset evidence is preserved as the source of truth. The reset command was attempted, the command exited nonzero, and \`stagingSqlMayHaveRun\` is recorded as \`true\`. Post-failure verification still shows the milestone registry migration is not applied and the activation registry tables are absent.

Current read-only inspection status: \`${reports.readonlyInspection.status}\`

Post-failure state classifier: \`${reports.postFailureStagingState.stateClassifier}\`

This packet is triage/reporting only. It does not retry reset, deploy schema, repair migration history, write Track B rows, run direct SQL/DDL/DML, touch production, print secrets, run providers/tools/workers/routes/media, touch Track A, or unlock beta/production.

## Recovery Recommendation

${asStringArray(reports.recoveryStrategyRecommendation.rationale).map((item) => `- ${item}`).join('\n')}

Next recommended phase: ${reports.recoveryStrategyRecommendation.nextRecommendedPhase}
`
}

function renderDecisionMarkdown(reports: ReportBundle): string {
  return `# Supabase Staging Reset Failure Recovery Decision

- Decision: \`${reports.recoveryDecision.decision}\`
- Approval status: \`${reports.recoveryDecision.approvalStatus}\`
- Partial reset risk: \`${reports.partialResetRisk.riskLevel}\`
- Read-only inspection status: \`${reports.readonlyInspection.status}\`
- Post-failure state classifier: \`${reports.recoveryDecision.stateClassifier}\`
- Failure cause classification: \`${reports.recoveryDecision.failureCauseClassification}\`
- Recovery execution allowed in this phase: \`${reports.recoveryDecision.recoveryExecutionAllowedInThisPhase}\`
- Reset retry approved: \`${reports.recoveryDecision.resetRetryApproved}\`
- Migration repair approved: \`${reports.recoveryDecision.migrationRepairApproved}\`
- Schema deploy approved: \`${reports.recoveryDecision.schemaDeployApproved}\`
- Track B backfill approved: \`${reports.recoveryDecision.trackBBackfillApproved}\`
- Production affected: \`${reports.recoveryDecision.productionAffected}\`

Future recovery requires a separate human-approved execution packet with redacted failure-log review, backup/restore sufficiency review, approved staging target proof, and post-recovery migration/schema/RLS verification.
`
}

function renderOperatorChecklistMarkdown(reports: ReportBundle): string {
  return `# Supabase Staging Reset Failure Operator Checklist

Before any future recovery execution:

- Review safe PR #259 reset failure evidence and any redacted Supabase CLI/platform logs.
- Confirm whether staging was partially reset, left unchanged, or left in an intermediate migration-history state.
- Confirm backup/export artifact sufficiency and restore scope before considering a restore-based path.
- Choose exactly one future recovery strategy and approve it in a separate execution prompt.
- Keep Track B backfill writes blocked until migration history and registry schema/RLS verification pass.
- Use the latest read-only classifier \`${reports.postFailureStagingState.stateClassifier}\` to select the next phase.
- Do not retry reset unless a separate approval packet proves the failure cause is safely fixed and backup/restore sufficiency is still acceptable.

Current blockers:

${asStringArray(reports.blockerReport.activeBlockers).map((blocker) => `- \`${blocker}\``).join('\n')}
`
}

function renderRecoveryExecutionPrompt(reports: ReportBundle): string {
  return `# Prompt: Supabase Staging Reset Recovery Execution

Use this prompt only after the reset failure triage packet is reviewed and a human/operator approves one exact recovery strategy.

Current triage decision: \`${reports.recoveryDecision.decision}\`.
Current read-only inspection status: \`${reports.readonlyInspection.status}\`.
Current post-failure state classifier: \`${reports.postFailureStagingState.stateClassifier}\`.

Remaining evidence gaps:

${asStringArray(reports.blockerReport.activeBlockers).map((blocker) => `- \`${blocker}\``).join('\n')}

Do not run this prompt unless the future approval names the selected recovery path, confirms backup/restore sufficiency, proves the approved staging target, and defines post-recovery verification. Track B backfill remains a later separate phase after migration history and registry schema/RLS verification pass.

Forbidden unless separately approved: reset retry, schema deploy, migration repair, direct/manual SQL, Track B row writes, production Supabase, provider calls, route/tool/worker execution, media processing, Track A, beta, and production unlocks.
`
}

function readReportDecision(reportDir: string, reportName: string) {
  const report = readJsonArtifact(path.join(reportDir, reportName))
  return {
    path: path.join(reportDir, reportName),
    present: Boolean(report),
    status: asString(report?.status, 'missing'),
    decision: asString(report?.decision, 'missing'),
    blockers: asStringArray(report?.blockers ?? report?.activeBlockers),
  }
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

function collectUniqueBlockers(...groups: Array<unknown>): SupabaseStagingResetFailureTriageBlocker[] {
  const values = groups.flatMap((group) => asStringArray(group))
  return collectUniqueStrings(values) as SupabaseStagingResetFailureTriageBlocker[]
}

function extractBlockers(report: unknown) {
  const record = asRecord(report)
  return asStringArray(record.blockers ?? record.activeBlockers)
}

function collectUniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
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

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' ? value : fallback
}

function asNullableNumber(value: unknown) {
  return typeof value === 'number' ? value : null
}

function safeStatIsDirectory(filePath: string) {
  try {
    return statSync(filePath).isDirectory()
  } catch {
    return false
  }
}
