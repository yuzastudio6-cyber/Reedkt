import path from 'node:path'
import { readFileSync } from 'node:fs'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION,
  SUPABASE_STAGING_RESET_EXECUTION_REQUIRED_CONFIRMATIONS,
  buildSupabaseStagingResetExecutionReports,
  executeSupabaseStagingResetExecution,
  executeSupabaseStagingResetExecutionVerify,
} from '../supabase-staging-reset-execution'
import {
  SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
} from '../supabase-staging-reset-retry-approval'
import type {
  SupabaseStagingResetRetryExecutionBlocker,
} from './staging-reset-retry-execution-types'

export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE =
  'supabase-staging-reset-retry-execution'
export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID =
  'supabase-staging-reset-retry-execution-20260610'
export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-retry-execution'
export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-retry-approval'
export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR =
  'docs/activation-supabase-staging-reset-retry-execution-reports'
export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_PR_TITLE =
  '[foundation] Supabase staging reset retry execution'

export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_EXECUTE'

export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_REQUIRED_CONFIRMATIONS = [
  SUPABASE_STAGING_RESET_RETRY_EXECUTION_CONFIRMATION,
  ...SUPABASE_STAGING_RESET_EXECUTION_REQUIRED_CONFIRMATIONS,
] as const

export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'staging_reset_retry_execution_plan.json',
  'staging_reset_retry_execution_precheck_report.json',
  'staging_reset_retry_secret_guard_report.json',
  'staging_reset_retry_cli_transport_report.json',
  'staging_reset_retry_backup_export_execution_report.json',
  'staging_reset_retry_backup_artifact_manifest.json',
  'staging_reset_retry_command_preview_report.json',
  'staging_reset_retry_execution_report.json',
  'staging_reset_retry_post_verify_report.json',
  'staging_reset_retry_schema_rls_verify_report.json',
  'staging_reset_retry_trackb_backfill_preflight_report.json',
  'staging_reset_retry_trackb_backfill_diff_report.json',
  'staging_reset_retry_blocker_report.json',
  'staging_reset_retry_readiness_report.json',
  'staging_reset_retry_private_artifact_manifest.json',
] as const

export const SUPABASE_STAGING_RESET_RETRY_EXECUTION_DOCS = [
  'docs/supabase-staging-reset-retry-execution.md',
  'docs/supabase-staging-reset-retry-secret-policy.md',
  'docs/supabase-staging-reset-retry-backup-export.md',
  'docs/supabase-staging-reset-retry-post-verification.md',
  'docs/supabase-trackb-backfill-after-reset-retry.md',
  'docs/implementation-prompts/prompt-supabase-trackb-staging-backfill-after-reset-retry.md',
] as const

type JsonRecord = Record<string, unknown>

interface RetryReports {
  sourceOfTruthOwnershipAudit: JsonRecord
  plan: JsonRecord
  precheckReport: JsonRecord
  secretGuardReport: JsonRecord
  cliTransportReport: JsonRecord
  backupExportExecutionReport: JsonRecord
  backupArtifactManifest: JsonRecord
  commandPreviewReport: JsonRecord
  executionReport: JsonRecord
  postVerifyReport: JsonRecord
  schemaRlsVerifyReport: JsonRecord
  trackBBackfillPreflightReport: JsonRecord
  trackBBackfillDiffReport: JsonRecord
  blockerReport: JsonRecord
  readinessReport: JsonRecord
  privateArtifactManifest: JsonRecord
}

interface RetryApprovalEvidence {
  approvalDecision: JsonRecord
  commandReview: JsonRecord
  backupReview: JsonRecord
  readinessReport: JsonRecord
}

export function getSupabaseStagingResetRetryExecutionPlan(): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    branch: SUPABASE_STAGING_RESET_RETRY_EXECUTION_BRANCH,
    baseBranch: SUPABASE_STAGING_RESET_RETRY_EXECUTION_BASE_BRANCH,
    prTitle: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PR_TITLE,
    worktree: '/private/tmp/reeditpro-supabase-staging-reset-retry-execution',
    reportDir: SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_RESET_RETRY_EXECUTION_EXPECTED_REPORTS,
    docs: SUPABASE_STAGING_RESET_RETRY_EXECUTION_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    approvedStagingTarget: {
      projectName: 'Reeditpro',
      projectRef: 'wmyyttnynmteqgcdishd',
      environment: 'staging',
    },
    sourcePrs: [198, 200, 223, 241, 247, 248, 252, 259, 262, 265],
    docsBasis: {
      cliReference: 'https://supabase.com/docs/reference/cli/introduction',
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      changelog: 'https://supabase.com/changelog.md',
      checkedAt: '2026-06-10',
      dbResetFlagsObserved: ['--db-url', '--no-seed'],
      resetDryRunSupported: false,
    },
    requiredConfirmations: SUPABASE_STAGING_RESET_RETRY_EXECUTION_REQUIRED_CONFIRMATIONS,
    backupExportConfirmation: SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION,
    approvedResetCommandShape:
      'npm exec --yes --package supabase@latest -- supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed',
    rejectedPreviousResetOperationFlag: '--yes',
    resetRetryScope: {
      stagingOnly: true,
      productionAffected: false,
      trackBBackfillWrite: false,
      migrationRepairRun: false,
      supabaseDbPushRun: false,
      directDdlDmlRun: false,
      providerCalls: false,
      routeToolWorkerExecution: false,
      mediaProcessing: false,
      trackA: false,
      betaOrProductionUnlock: false,
    },
  }
}

export async function buildSupabaseStagingResetRetryExecutionReports(
  overrides: Partial<RetryReports> = {},
): Promise<RetryReports> {
  const base = await buildSupabaseStagingResetExecutionReports()
  const approval = readPr265RetryApprovalEvidence()
  const preserveActualAttempt = existingActualRetryExecutionAttempted()
  const sourceOfTruthOwnershipAudit = overrides.sourceOfTruthOwnershipAudit ??
    decorateSourceAudit(base.sourceOfTruthOwnershipAudit as JsonRecord, approval)
  const plan = overrides.plan ?? getSupabaseStagingResetRetryExecutionPlan()
  const rawPrecheckReport = overrides.precheckReport ??
    (preserveActualAttempt ? loadExistingRetryReport('staging_reset_retry_execution_precheck_report.json') : null) ??
    buildRetryPrecheckReport(base.precheckReport as JsonRecord, approval)
  const precheckReport = preserveActualAttempt
    ? normalizePrecheckAfterActualAttempt(rawPrecheckReport)
    : rawPrecheckReport
  const secretGuardReport = overrides.secretGuardReport ??
    (preserveActualAttempt ? loadExistingRetryReport('staging_reset_retry_secret_guard_report.json') : null) ??
    decorateBaseReport(base.secretGuardReport as JsonRecord)
  const cliTransportReport = overrides.cliTransportReport ??
    (preserveActualAttempt ? loadExistingRetryReport('staging_reset_retry_cli_transport_report.json') : null) ??
    decorateBaseReport(base.cliTransportReport as JsonRecord)
  const backupExportExecutionReport = overrides.backupExportExecutionReport ??
    (preserveActualAttempt ? loadExistingRetryReport('staging_reset_retry_backup_export_execution_report.json') : null) ??
    decorateBaseReport(base.backupExportExecutionReport as JsonRecord)
  const backupArtifactManifest = overrides.backupArtifactManifest ??
    (preserveActualAttempt ? loadExistingRetryReport('staging_reset_retry_backup_artifact_manifest.json') : null) ??
    decorateBaseReport(base.backupArtifactManifest as JsonRecord)
  const rawCommandPreviewReport = overrides.commandPreviewReport ??
    (preserveActualAttempt ? loadExistingRetryReport('staging_reset_retry_command_preview_report.json') : null) ??
    decoratePreviewReport(base.previewReport as JsonRecord, approval)
  const commandPreviewReport = preserveActualAttempt
    ? normalizeGateReportAfterActualAttempt(rawCommandPreviewReport)
    : rawCommandPreviewReport
  const executionReport = overrides.executionReport ??
    loadExistingActualRetryReport('staging_reset_retry_execution_report.json') ??
    buildBlockedRetryExecutionReport(['staging_reset_retry_execute_not_confirmed'])
  const postVerifyReport = overrides.postVerifyReport ??
    loadExistingActualRetryReport('staging_reset_retry_post_verify_report.json') ??
    buildBlockedRetryPostVerifyReport(executionReport)
  const schemaRlsVerifyReport = overrides.schemaRlsVerifyReport ??
    loadExistingActualRetryReport('staging_reset_retry_schema_rls_verify_report.json') ??
    buildBlockedRetrySchemaRlsReport(postVerifyReport)
  const trackBBackfillPreflightReport = overrides.trackBBackfillPreflightReport ??
    decorateBaseReport(base.trackBBackfillPreflightReport as JsonRecord)
  const trackBBackfillDiffReport = overrides.trackBBackfillDiffReport ??
    decorateBaseReport(base.trackBBackfillDiffReport as JsonRecord)
  const blockers = collectUniqueBlockers(
    extractBlockers(sourceOfTruthOwnershipAudit),
    extractBlockers(precheckReport),
    extractBlockers(secretGuardReport),
    extractBlockers(cliTransportReport),
    extractBlockers(backupExportExecutionReport),
    extractBlockers(commandPreviewReport),
    extractBlockers(executionReport),
    extractBlockers(postVerifyReport),
    extractBlockers(schemaRlsVerifyReport),
    executionReport.status === 'passed' ? extractBlockers(trackBBackfillPreflightReport) : [],
  )
  const blockerReport = overrides.blockerReport ?? buildRetryBlockerReport(blockers)
  const readinessReport = overrides.readinessReport ??
    buildRetryReadinessReport(
      executionReport,
      postVerifyReport,
      schemaRlsVerifyReport,
      trackBBackfillPreflightReport,
      blockers,
    )
  const privateArtifactManifest = overrides.privateArtifactManifest ?? buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit,
    plan,
    precheckReport,
    secretGuardReport,
    cliTransportReport,
    backupExportExecutionReport,
    backupArtifactManifest,
    commandPreviewReport,
    executionReport,
    postVerifyReport,
    schemaRlsVerifyReport,
    trackBBackfillPreflightReport,
    trackBBackfillDiffReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function writeSupabaseStagingResetRetryExecutionArtifacts(
  reports: RetryReports,
): Promise<void> {
  const dir = SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_execution_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_execution_precheck_report.json'), reports.precheckReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_secret_guard_report.json'), reports.secretGuardReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_cli_transport_report.json'), reports.cliTransportReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_backup_export_execution_report.json'), reports.backupExportExecutionReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_backup_artifact_manifest.json'), reports.backupArtifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_command_preview_report.json'), reports.commandPreviewReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_execution_report.json'), reports.executionReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_post_verify_report.json'), reports.postVerifyReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_schema_rls_verify_report.json'), reports.schemaRlsVerifyReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_trackb_backfill_preflight_report.json'), reports.trackBBackfillPreflightReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_trackb_backfill_diff_report.json'), reports.trackBBackfillDiffReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_retry_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/supabase-staging-reset-retry-execution.md', renderExecutionDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-staging-reset-retry-secret-policy.md', renderSecretPolicyDoc())
  await writeVlmRuntimeTextArtifact('docs/supabase-staging-reset-retry-backup-export.md', renderBackupExportDoc())
  await writeVlmRuntimeTextArtifact('docs/supabase-staging-reset-retry-post-verification.md', renderPostVerificationDoc())
  await writeVlmRuntimeTextArtifact('docs/supabase-trackb-backfill-after-reset-retry.md', renderTrackBHandoffDoc(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-trackb-staging-backfill-after-reset-retry.md',
    renderTrackBHandoffPrompt(reports),
  )
}

export async function executeSupabaseStagingResetRetryExecution(): Promise<{
  reports: RetryReports
  exitCode: number
}> {
  const initialReports = await buildSupabaseStagingResetRetryExecutionReports()
  const retryBlockers = collectUniqueBlockers(
    process.env[SUPABASE_STAGING_RESET_RETRY_EXECUTION_CONFIRMATION] === 'true'
      ? []
      : ['staging_reset_retry_execute_not_confirmed'],
    extractBlockers(initialReports.precheckReport),
    extractBlockers(initialReports.sourceOfTruthOwnershipAudit),
  )
  if (retryBlockers.length > 0) {
    const reports = await buildSupabaseStagingResetRetryExecutionReports({
      executionReport: buildBlockedRetryExecutionReport(retryBlockers),
    })
    await writeSupabaseStagingResetRetryExecutionArtifacts(reports)
    return { reports, exitCode: 1 }
  }
  const result = await executeSupabaseStagingResetExecution({ keepTemp: true })
  const approval = readPr265RetryApprovalEvidence()
  const reports = await buildSupabaseStagingResetRetryExecutionReports({
    precheckReport: buildRetryPrecheckReport(result.reports.precheckReport as JsonRecord, approval),
    secretGuardReport: decorateBaseReport(result.reports.secretGuardReport as JsonRecord, {
      preserveRetryExecutionEvidence: true,
    }),
    cliTransportReport: decorateBaseReport(result.reports.cliTransportReport as JsonRecord, {
      preserveRetryExecutionEvidence: true,
    }),
    backupArtifactManifest: decorateBaseReport(result.reports.backupArtifactManifest as JsonRecord, {
      preserveRetryExecutionEvidence: true,
    }),
    commandPreviewReport: decoratePreviewReport(result.reports.previewReport as JsonRecord, approval),
    executionReport: decorateExecutionReport(result.reports.executionReport as JsonRecord, true),
    backupExportExecutionReport: decorateBaseReport(result.reports.backupExportExecutionReport as JsonRecord),
    postVerifyReport: decorateBaseReport(result.reports.postVerifyReport as JsonRecord),
    schemaRlsVerifyReport: decorateBaseReport(result.reports.schemaRlsVerifyReport as JsonRecord),
    trackBBackfillPreflightReport: decorateBaseReport(result.reports.trackBBackfillPreflightReport as JsonRecord),
    trackBBackfillDiffReport: decorateBaseReport(result.reports.trackBBackfillDiffReport as JsonRecord),
  })
  await writeSupabaseStagingResetRetryExecutionArtifacts(reports)
  return { reports, exitCode: result.exitCode }
}

export async function executeSupabaseStagingResetRetryExecutionVerify(): Promise<{
  reports: RetryReports
  exitCode: number
}> {
  const result = await executeSupabaseStagingResetExecutionVerify()
  const reports = await buildSupabaseStagingResetRetryExecutionReports({
    postVerifyReport: decorateBaseReport(result.reports.postVerifyReport as JsonRecord, {
      actualRetryExecutionAttempted: true,
      preserveRetryVerification: true,
    }),
    schemaRlsVerifyReport: decorateBaseReport(result.reports.schemaRlsVerifyReport as JsonRecord, {
      actualRetryExecutionAttempted: true,
      preserveRetryVerification: true,
    }),
    trackBBackfillPreflightReport: decorateBaseReport(result.reports.trackBBackfillPreflightReport as JsonRecord),
    trackBBackfillDiffReport: decorateBaseReport(result.reports.trackBBackfillDiffReport as JsonRecord),
  })
  await writeSupabaseStagingResetRetryExecutionArtifacts(reports)
  return { reports, exitCode: result.exitCode }
}

export async function readSupabaseStagingResetRetryExecutionSummary() {
  const reports = await buildSupabaseStagingResetRetryExecutionReports()
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    status: reports.readinessReport.status,
    stagingResetRetryRun: reports.executionReport.resetPerformed === true,
    stagingResetRetryAttempted: reports.executionReport.resetAttempted === true,
    stagingSqlMayHaveRun:
      reports.executionReport.stagingSqlMayHaveRun === true ||
      reports.executionReport.resetAttempted === true,
    stagingMigrationHistoryVerified: reports.postVerifyReport.migrationHistoryVerified === true,
    stagingSchemaRlsVerified: reports.schemaRlsVerifyReport.schemaRlsVerified === true,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    migrationRepairRun: false,
    supabaseDbPushRun: false,
    secretsPrintedOrCommitted: false,
    activeBlockers: reports.blockerReport.activeBlockers ?? [],
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
  }
}

function decorateSourceAudit(base: JsonRecord, approval: RetryApprovalEvidence): JsonRecord {
  const approvalDecision = approval.approvalDecision as JsonRecord
  return {
    ...decorateBaseReport(base),
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    sourcePr265: {
      decision: approvalDecision.decision,
      approvalStatus: approvalDecision.approvalStatus,
      resetRetryRun: approvalDecision.resetRetryRun,
      blockers: approvalDecision.blockers ?? [],
    },
    sourcePrs: [198, 200, 223, 241, 247, 248, 252, 259, 262, 265],
    duplicateWorkAvoided: true,
  }
}

function buildRetryPrecheckReport(
  base: JsonRecord,
  approval: RetryApprovalEvidence,
): JsonRecord {
  const approvalDecision = approval.approvalDecision as JsonRecord
  const commandReview = approval.commandReview as JsonRecord
  const backupReview = approval.backupReview as JsonRecord
  const blockers = collectUniqueBlockers(
    extractBlockers(base),
    approvalDecision.decision === 'approved_for_future_retry_reset_after_cli_command_fix'
      ? []
      : ['pr265_retry_approval_missing'],
    commandReview.status === 'passed' ? [] : ['pr265_retry_command_review_not_passed'],
    backupReview.status === 'passed' ? [] : ['pr265_retry_backup_review_not_passed'],
    process.env[SUPABASE_STAGING_RESET_RETRY_EXECUTION_CONFIRMATION] === 'true'
      ? []
      : ['staging_reset_retry_execute_not_confirmed'],
  )
  return {
    ...decorateBaseReport(base),
    status: blockers.length === 0 ? 'passed' : 'blocked',
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    pr265Approval: {
      decision: approvalDecision.decision,
      approvalStatus: approvalDecision.approvalStatus,
      approvedFutureCommandShape: approvalDecision.approvedFutureCommandShape,
      blockers: approvalDecision.blockers ?? [],
    },
    pr265CommandReview: {
      status: commandReview.status,
      futureRetryOperation: commandReview.futureRetryOperation,
      previousUnlistedFlagRejected: '--yes',
    },
    pr265BackupReview: {
      status: backupReview.status,
      futureRetryMustVerifyBackupAvailability: backupReview.futureRetryMustVerifyBackupAvailability,
    },
    retryExecutionConfirmation: {
      name: SUPABASE_STAGING_RESET_RETRY_EXECUTION_CONFIRMATION,
      set: process.env[SUPABASE_STAGING_RESET_RETRY_EXECUTION_CONFIRMATION] === 'true',
    },
    requiredConfirmations: SUPABASE_STAGING_RESET_RETRY_EXECUTION_REQUIRED_CONFIRMATIONS.map((name) => ({
      name,
      set: process.env[name] === 'true',
    })),
    blockers,
  }
}

function normalizePrecheckAfterActualAttempt(report: JsonRecord): JsonRecord {
  return normalizeGateReportAfterActualAttempt(report, {
    confirmationStatePreservedFromExecutionAttempt: true,
  })
}

function normalizeGateReportAfterActualAttempt(report: JsonRecord, extra: JsonRecord = {}): JsonRecord {
  const confirmationBlockers = new Set<string>([
    'staging_reset_execute_not_confirmed',
    'staging_db_reset_not_confirmed',
    'staging_owner_data_loss_acceptance_not_confirmed',
    'staging_backup_snapshot_packet_not_confirmed',
    'staging_schema_mutation_not_confirmed',
    'staging_schema_readonly_inspection_not_confirmed',
    'temp_cli_exec_not_confirmed',
    'staging_reset_retry_execute_not_confirmed',
  ])
  const blockers = extractBlockers(report).filter((blocker) => !confirmationBlockers.has(blocker))
  return {
    ...report,
    status: blockers.length === 0 ? 'passed_at_retry_execution_time' : 'blocked',
    actualRetryExecutionAttempted: true,
    ...extra,
    blockers,
  }
}

function decoratePreviewReport(
  base: JsonRecord,
  approval: RetryApprovalEvidence,
): JsonRecord {
  const commandReview = approval.commandReview as JsonRecord
  const baseCommand = asRecord(base.resetCommand)
  return {
    ...decorateBaseReport(base),
    commandPlanPreviewPassed: base.status === 'passed',
    resetCommand: {
      ...baseCommand,
      operation: ['db', 'reset', '--db-url', '[REDACTED_STAGING_DB_URL]', '--no-seed'],
      approvedByPr265: true,
      rejectedPreviousOperationFlag: '--yes',
      futureRetryOperationFromApproval: commandReview.futureRetryOperation,
    },
    resetDryRunSupported: false,
    seedFilesIncluded: false,
    noSeedFlagUsed: true,
  }
}

function decorateExecutionReport(base: JsonRecord, actualRetryExecutionAttempted = false): JsonRecord {
  return {
    ...decorateBaseReport(base, { actualRetryExecutionAttempted }),
    resetRetryAttempted: actualRetryExecutionAttempted && base.resetAttempted === true,
    resetRetryPerformed: actualRetryExecutionAttempted && base.resetPerformed === true,
    retryCommandShapeApprovedByPr265: true,
    rejectedPreviousOperationFlagOmitted: true,
    resetCommandIncludesYesOperationFlag: false,
    supabaseDbPushRun: false,
    migrationRepairRun: false,
    trackBBackfillWrite: false,
    productionAffected: false,
    directDdlDmlRun: false,
  }
}

function decorateBaseReport(base: JsonRecord, extra: JsonRecord = {}): JsonRecord {
  return {
    ...base,
    ...extra,
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    productionAffected: false,
    trackBBackfillWrite: false,
    trackBBackfillRowsWritten: false,
    migrationRepairRun: false,
    directDdlDmlRun: false,
    supabaseDbPushRun: false,
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    payloadPrinted: false,
    payloadCommitted: false,
  }
}

function buildBlockedRetryExecutionReport(blockers: SupabaseStagingResetRetryExecutionBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    status: 'blocked',
    resetRetryPerformed: false,
    resetRetryAttempted: false,
    actualRetryExecutionAttempted: false,
    resetPerformed: false,
    resetAttempted: false,
    stagingSqlMayHaveRun: false,
    resetCommandIncludesYesOperationFlag: false,
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    migrationRepairRun: false,
    supabaseDbPushRun: false,
    directDdlDmlRun: false,
    trackBBackfillWrite: false,
    blockers,
  }
}

function buildBlockedRetryPostVerifyReport(executionReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    migrationHistoryVerified: false,
    resetExecutionStatus: executionReport.status,
    reason: 'post_reset_retry_verify_requires_successful_retry_reset_or_explicit_verify_command',
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: ['staging_reset_retry_post_verify_failed'],
  }
}

function buildBlockedRetrySchemaRlsReport(postVerifyReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    schemaRlsVerified: false,
    postVerifyStatus: postVerifyReport.status,
    reason: 'schema_rls_verify_requires_successful_retry_post_reset_verify',
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: ['staging_reset_retry_schema_rls_verify_failed'],
  }
}

function buildRetryBlockerReport(blockers: SupabaseStagingResetRetryExecutionBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    resetRetryExecutionAllowed: blockers.length === 0,
    stillBlockedScopes: [
      'production_supabase',
      'production_sql',
      'track_b_backfill_write',
      'migration_repair',
      'supabase_db_push',
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
  }
}

function buildRetryReadinessReport(
  executionReport: JsonRecord,
  postVerifyReport: JsonRecord,
  schemaRlsVerifyReport: JsonRecord,
  trackBPreflightReport: JsonRecord,
  blockers: SupabaseStagingResetRetryExecutionBlocker[],
): JsonRecord {
  const passed =
    executionReport.status === 'passed' &&
    postVerifyReport.status === 'passed' &&
    schemaRlsVerifyReport.status === 'passed'
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    stagingResetRetryComplete: passed,
    stagingResetRetryRun: executionReport.resetPerformed === true,
    migrationHistoryVerified: postVerifyReport.status === 'passed',
    schemaRlsVerified: schemaRlsVerifyReport.status === 'passed',
    trackBBackfillPreflightStatus: trackBPreflightReport.status,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    migrationRepairRun: false,
    supabaseDbPushRun: false,
    secretsPrintedOrCommitted: false,
    blockers,
    nextRecommendedPhase: passed
      ? 'Guarded PR #198 Track B staging backfill rerun after verified reset retry.'
      : 'Resolve the exact retry execution blocker before Track B backfill or production work.',
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_RETRY_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_RETRY_EXECUTION_RUN_ID,
    status: 'committed_safe_metadata_only',
    reportDir: SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_RESET_RETRY_EXECUTION_EXPECTED_REPORTS,
    backupArtifacts: {
      location: 'redacted_temp_directory_outside_repo',
      committed: false,
      printed: false,
    },
    privateUploadRequired: false,
    privateUploadPerformed: false,
    secretsCommitted: false,
    dbUrlCommitted: false,
    stagingDataBackfillWritten: false,
    productionAffected: false,
  }
}

function renderExecutionDoc(reports: RetryReports): string {
  return [
    '# Supabase Staging Reset Retry Execution',
    '',
    `- Status: \`${reports.readinessReport.status}\``,
    `- Reset retry run: \`${reports.executionReport.resetPerformed === true ? 'yes' : 'no'}\``,
    '- Approved target: `Reeditpro / wmyyttnynmteqgcdishd / staging`',
    '- Approved command shape: `npm exec --yes --package supabase@latest -- supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed`',
    '- Rejected previous operation flag: `--yes`',
    '- Production affected: `false`',
    '- Track B backfill rows written: `false`',
    '- Migration repair run: `false`',
    '- `supabase db push` run: `false`',
    `- Active blockers: \`${(reports.blockerReport.activeBlockers as string[] | undefined)?.join(', ') || 'none'}\``,
    `- Next recommended phase: ${reports.readinessReport.nextRecommendedPhase}`,
    '',
  ].join('\n')
}

function renderSecretPolicyDoc(): string {
  return [
    '# Supabase Staging Reset Retry Secret Policy',
    '',
    '- Secret reference: `SUPABASE_DB_URL`.',
    '- The DB URL may be loaded only into the current process environment for the retry execution.',
    '- Reports may record presence, target-match status, payload access status, and `payloadPrinted:false`.',
    '- Reports must not include DB URLs, hosts, usernames, passwords, service-role keys, anon keys, tokens, signed URLs, or credential payloads.',
    '- Production, Track B writes, provider calls, workers, routes, media, Track A, beta, and production unlocks remain blocked.',
    '',
  ].join('\n')
}

function renderBackupExportDoc(): string {
  return [
    '# Supabase Staging Reset Retry Backup/Export',
    '',
    '- A private backup/export gate is required before reset retry.',
    '- Backup artifacts stay in redacted temp storage outside the repository.',
    '- Backup payloads are never committed, printed, or summarized beyond safe metadata.',
    '- The reset retry remains blocked if the backup/export command or confirmation is missing.',
    '',
  ].join('\n')
}

function renderPostVerificationDoc(): string {
  return [
    '# Supabase Staging Reset Retry Post Verification',
    '',
    '- Verify migration history after reset retry.',
    '- Verify activation milestone registry schema/RLS metadata with read-only catalog inspection.',
    '- Run PR #198 Track B preflight/diff/report only after verification.',
    '- Do not run Track B metadata writes in this phase.',
    '',
  ].join('\n')
}

function renderTrackBHandoffDoc(reports: RetryReports): string {
  return [
    '# Track B Backfill After Reset Retry',
    '',
    `- Reset retry readiness: \`${reports.readinessReport.status}\``,
    '- Track B backfill write remains blocked in this phase.',
    '- Next phase may rerun PR #198 guarded Track B staging backfill only after reset retry verification passes.',
    '- Production Supabase remains blocked.',
    '',
  ].join('\n')
}

function renderTrackBHandoffPrompt(reports: RetryReports): string {
  return [
    '# Prompt: Supabase Track B Staging Backfill After Reset Retry',
    '',
    `Current reset retry status: \`${reports.readinessReport.status}\`.`,
    '',
    'If reset retry verification passed, rerun the guarded PR #198 Track B staging backfill path with its separate confirmations. Do not write Track B rows from the reset retry phase. Keep production, provider calls, routes, workers, media, Track A, beta, and production unlocks blocked.',
    '',
  ].join('\n')
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function readPr265RetryApprovalEvidence(): RetryApprovalEvidence {
  return {
    approvalDecision: readJson(path.join(
      SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
      'staging_reset_retry_approval_decision.json',
    )),
    commandReview: readJson(path.join(
      SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
      'staging_reset_retry_command_review.json',
    )),
    backupReview: readJson(path.join(
      SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
      'staging_reset_retry_backup_review.json',
    )),
    readinessReport: readJson(path.join(
      SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
      'staging_reset_retry_readiness_report.json',
    )),
  }
}

function readJson(file: string): JsonRecord {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as JsonRecord
  } catch {
    return {}
  }
}

function loadExistingActualRetryReport(fileName: string): JsonRecord | null {
  try {
    const file = path.join(SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR, fileName)
    const report = JSON.parse(readFileSync(file, 'utf8')) as JsonRecord
    if (fileName === 'staging_reset_retry_execution_report.json') {
      return report.actualRetryExecutionAttempted === true ? report : null
    }
    return report.preserveRetryVerification === true ? report : null
  } catch {
    return null
  }
}

function loadExistingRetryReport(fileName: string): JsonRecord | null {
  try {
    const file = path.join(SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR, fileName)
    return JSON.parse(readFileSync(file, 'utf8')) as JsonRecord
  } catch {
    return null
  }
}

function existingActualRetryExecutionAttempted(): boolean {
  const report = loadExistingRetryReport('staging_reset_retry_execution_report.json')
  return report?.actualRetryExecutionAttempted === true || report?.resetRetryAttempted === true
}

function extractBlockers(report: unknown): SupabaseStagingResetRetryExecutionBlocker[] {
  if (!report || typeof report !== 'object') return []
  const maybeBlockers = (report as { blockers?: unknown; activeBlockers?: unknown }).blockers ??
    (report as { activeBlockers?: unknown }).activeBlockers
  if (!Array.isArray(maybeBlockers)) return []
  return maybeBlockers.filter((blocker): blocker is SupabaseStagingResetRetryExecutionBlocker =>
    typeof blocker === 'string',
  )
}

function collectUniqueBlockers(
  ...sets: Array<readonly SupabaseStagingResetRetryExecutionBlocker[]>
): SupabaseStagingResetRetryExecutionBlocker[] {
  return [...new Set(sets.flat())]
}
