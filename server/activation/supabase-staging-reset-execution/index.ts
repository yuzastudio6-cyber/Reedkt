import { execFile } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
  SUPABASE_MILESTONE_REGISTRY_TABLES,
} from '../supabase-milestone-registry-schema'
import {
  buildApprovedStagingTargetReferenceReport,
} from '../supabase-milestone-registry-schema/milestone-registry-approved-staging-target-reference'
import {
  buildSupabasePluginTargetPreflight,
} from '../supabase-milestone-registry-schema/milestone-registry-staging-target-policy'
import {
  parseSupabaseMigrationListOutput,
} from '../supabase-milestone-registry-schema/milestone-registry-staging-migration-history-audit'
import { buildSupabaseTrackBBackfillReports } from '../supabase-trackb-backfill'
import type {
  SupabaseStagingResetCommandSummary,
  SupabaseStagingResetExecutionBlocker,
} from './staging-reset-execution-types'

export const SUPABASE_STAGING_RESET_EXECUTION_PHASE = 'supabase-staging-reset-reapply-execution'
export const SUPABASE_STAGING_RESET_EXECUTION_RUN_ID = 'supabase-staging-reset-reapply-execution-20260609'
export const SUPABASE_STAGING_RESET_EXECUTION_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-reapply-execution'
export const SUPABASE_STAGING_RESET_EXECUTION_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-data-impact-backup-approval'
export const SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR =
  'docs/activation-supabase-staging-reset-execution-reports'
export const SUPABASE_STAGING_RESET_EXECUTION_PR_TITLE =
  '[foundation] Supabase staging reset reapply execution'

export const SUPABASE_STAGING_RESET_EXECUTION_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_DB_RESET',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF',
  'REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_BACKUP_SNAPSHOT_APPROVAL_PACKET',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_READONLY_INSPECTION',
  'REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC',
] as const

export const SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_BACKUP_EXPORT_EXECUTE'

export const SUPABASE_STAGING_RESET_EXECUTION_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_REPAIR',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_SECRET_MANAGER_ACCESS',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACT_OUTPUT',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
] as const

export const SUPABASE_STAGING_RESET_EXECUTION_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'staging_reset_execution_plan.json',
  'staging_reset_execution_precheck_report.json',
  'staging_reset_secret_guard_report.json',
  'staging_reset_cli_transport_report.json',
  'staging_reset_backup_export_execution_report.json',
  'staging_reset_backup_artifact_manifest.json',
  'staging_reset_preview_report.json',
  'staging_reset_execution_report.json',
  'staging_reset_post_verify_report.json',
  'staging_reset_schema_rls_verify_report.json',
  'staging_reset_trackb_backfill_preflight_report.json',
  'staging_reset_trackb_backfill_diff_report.json',
  'staging_reset_blocker_report.json',
  'staging_reset_readiness_report.json',
  'staging_reset_private_artifact_manifest.json',
] as const

export const SUPABASE_STAGING_RESET_EXECUTION_DOCS = [
  'docs/supabase-staging-reset-execution.md',
  'docs/supabase-staging-reset-execution-secret-policy.md',
  'docs/supabase-staging-reset-post-verification.md',
  'docs/supabase-trackb-backfill-after-staging-reset.md',
  'docs/implementation-prompts/prompt-supabase-trackb-staging-backfill-after-staging-reset.md',
] as const

const APPROVED_STAGING_PROJECT_REF = 'wmyyttnynmteqgcdishd'
const APPROVED_STAGING_PROJECT_NAME = 'Reeditpro'
const APPROVED_STAGING_ENVIRONMENT = 'staging'
const APPROVED_DB_URL_ENV_NAMES = [
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
] as const
const TEMP_SUPABASE_CLI_NPM_CACHE = path.join('/tmp', 'reeditpro-supabase-cli-cache')
const TEMP_SUPABASE_CLI_NPM_PREFIX = path.join('/tmp', 'reeditpro-supabase-cli-prefix')
const TEMP_SUPABASE_CLI_PACKAGE = 'supabase@latest'
const BACKUP_ROOT = path.join('/tmp', 'reeditpro-staging-reset-backups')
const BACKUP_RUN_DIR = path.join(BACKUP_ROOT, SUPABASE_STAGING_RESET_EXECUTION_RUN_ID)
const BACKUP_SCHEMA_FILE = path.join(BACKUP_RUN_DIR, 'staging-schema.sql')
const PR252_REPORT_DIR = 'docs/activation-supabase-staging-data-impact-backup-reports'
const PR247_REPORT_DIR = 'docs/activation-supabase-schema-parity-remediation-reports'
const PR241_REPORT_DIR = 'docs/activation-supabase-remote-schema-equivalence-reports'
const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const PR198_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role/i,
  /anon[_-]?key/i,
  /access[_-]?token/i,
  /jwt[_-]?secret/i,
  /password/i,
  /BEGIN\s+PRIVATE\s+KEY/i,
  /x-goog-signature\s*=/i,
] as const

type JsonRecord = Record<string, unknown>

interface ResetExecutionReports {
  sourceOfTruthOwnershipAudit: JsonRecord
  plan: JsonRecord
  precheckReport: JsonRecord
  secretGuardReport: JsonRecord
  cliTransportReport: JsonRecord
  backupExportExecutionReport: JsonRecord
  backupArtifactManifest: JsonRecord
  previewReport: JsonRecord
  executionReport: JsonRecord
  postVerifyReport: JsonRecord
  schemaRlsVerifyReport: JsonRecord
  trackBBackfillPreflightReport: JsonRecord
  trackBBackfillDiffReport: JsonRecord
  blockerReport: JsonRecord
  readinessReport: JsonRecord
  privateArtifactManifest: JsonRecord
}

export function getSupabaseStagingResetExecutionPlan() {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    branch: SUPABASE_STAGING_RESET_EXECUTION_BRANCH,
    baseBranch: SUPABASE_STAGING_RESET_EXECUTION_BASE_BRANCH,
    prTitle: SUPABASE_STAGING_RESET_EXECUTION_PR_TITLE,
    worktree: '/private/tmp/reeditpro-supabase-staging-reset-reapply-execution',
    reportDir: SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_RESET_EXECUTION_EXPECTED_REPORTS,
    docs: SUPABASE_STAGING_RESET_EXECUTION_DOCS,
    approvedStagingTarget: {
      projectName: APPROVED_STAGING_PROJECT_NAME,
      projectRef: APPROVED_STAGING_PROJECT_REF,
      environment: APPROVED_STAGING_ENVIRONMENT,
    },
    sourcePrs: [198, 200, 223, 241, 247, 248, 252],
    docsBasis: {
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      dbDump: 'https://supabase.com/docs/reference/cli/supabase-db-dump',
      backups: 'https://supabase.com/docs/guides/platform/backups',
      changelog: 'https://supabase.com/changelog.md',
      checkedAt: '2026-06-09',
    },
    requiredConfirmations: SUPABASE_STAGING_RESET_EXECUTION_REQUIRED_CONFIRMATIONS,
    backupExportConfirmation: SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION,
    forbiddenConfirmations: SUPABASE_STAGING_RESET_EXECUTION_FORBIDDEN_CONFIRMATIONS,
    cliStrategy: {
      selectedOnly: 'temp_npm_exec_supabase_cli',
      commandPrefix: 'npm exec --yes --package supabase@latest -- supabase',
      tempCachePrefixOutsideRepo: true,
      packageLockMutationAllowed: false,
    },
    resetWorkflow: {
      command: 'supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed',
      resetDryRunSupported: false,
      previewMode: 'command_plan_preview_plus_backup_and_migration_inventory',
      seedBehavior: 'no_seed',
      directManualSqlAllowed: false,
      migrationRepairAllowed: false,
      productionAllowed: false,
    },
    postResetHandoff: {
      runTrackBBackfillPreflight: true,
      runTrackBBackfillDiff: true,
      runTrackBBackfillWrite: false,
      nextRecommendedPhase: 'Guarded PR #198 Track B staging backfill rerun after reset verification.',
    },
  }
}

export async function buildSupabaseStagingResetExecutionReports(overrides: {
  precheckReport?: JsonRecord
  backupExportExecutionReport?: JsonRecord
  executionReport?: JsonRecord
  postVerifyReport?: JsonRecord
  schemaRlsVerifyReport?: JsonRecord
} = {}): Promise<ResetExecutionReports> {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const plan = getSupabaseStagingResetExecutionPlan()
  const precheckReport = overrides.precheckReport ?? buildPrecheckReport(sourceOfTruthOwnershipAudit)
  const secretGuardReport = buildSecretGuardReport()
  const cliTransportReport = await buildCliTransportReport()
  const backupExportExecutionReport =
    overrides.backupExportExecutionReport ??
    loadExistingReport('staging_reset_backup_export_execution_report.json') ??
    buildDefaultBackupExportExecutionReport(precheckReport, secretGuardReport, cliTransportReport)
  const backupArtifactManifest = buildBackupArtifactManifest(backupExportExecutionReport)
  const previewReport = buildResetPreviewReport(
    sourceOfTruthOwnershipAudit,
    precheckReport,
    secretGuardReport,
    cliTransportReport,
    backupExportExecutionReport,
  )
  const executionReport =
    overrides.executionReport ??
    loadExistingReport('staging_reset_execution_report.json') ??
    buildDefaultResetExecutionReport(previewReport, backupExportExecutionReport)
  const postVerifyReport =
    overrides.postVerifyReport ??
    loadExistingReport('staging_reset_post_verify_report.json') ??
    buildDefaultPostVerifyReport(executionReport)
  const schemaRlsVerifyReport =
    overrides.schemaRlsVerifyReport ??
    loadExistingReport('staging_reset_schema_rls_verify_report.json') ??
    buildDefaultSchemaRlsVerifyReport(postVerifyReport)
  const trackBBackfillReports = buildSupabaseTrackBBackfillReports()
  const trackBBackfillPreflightReport = wrapTrackBBackfillReport(
    trackBBackfillReports.stagingSupabaseBackfillPreflightReport,
    'preflight',
  )
  const trackBBackfillDiffReport = wrapTrackBBackfillReport(trackBBackfillReports.diffReport, 'diff')
  const blockers = collectUniqueBlockers(
    extractBlockers(sourceOfTruthOwnershipAudit),
    extractBlockers(precheckReport),
    extractBlockers(secretGuardReport),
    extractBlockers(cliTransportReport),
    extractBlockers(backupExportExecutionReport),
    extractBlockers(previewReport),
    extractBlockers(executionReport),
    extractBlockers(postVerifyReport),
    extractBlockers(schemaRlsVerifyReport),
    executionReport.status === 'passed' ? extractBlockers(trackBBackfillPreflightReport) : [],
  )
  const blockerReport = buildBlockerReport(blockers)
  const readinessReport = buildReadinessReport(
    executionReport,
    postVerifyReport,
    schemaRlsVerifyReport,
    trackBBackfillPreflightReport,
    blockers,
  )
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit,
    plan,
    precheckReport,
    secretGuardReport,
    cliTransportReport,
    backupExportExecutionReport,
    backupArtifactManifest,
    previewReport,
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

export async function writeSupabaseStagingResetExecutionArtifacts(
  reports: ResetExecutionReports,
  reportDir = SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_execution_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_execution_precheck_report.json'), reports.precheckReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_secret_guard_report.json'), reports.secretGuardReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_cli_transport_report.json'), reports.cliTransportReport)
  await writeVlmRuntimeJsonArtifact(
    path.join(reportDir, 'staging_reset_backup_export_execution_report.json'),
    reports.backupExportExecutionReport,
  )
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_backup_artifact_manifest.json'), reports.backupArtifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_preview_report.json'), reports.previewReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_execution_report.json'), reports.executionReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_post_verify_report.json'), reports.postVerifyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_schema_rls_verify_report.json'), reports.schemaRlsVerifyReport)
  await writeVlmRuntimeJsonArtifact(
    path.join(reportDir, 'staging_reset_trackb_backfill_preflight_report.json'),
    reports.trackBBackfillPreflightReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(reportDir, 'staging_reset_trackb_backfill_diff_report.json'),
    reports.trackBBackfillDiffReport,
  )
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_reset_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'staging_reset_readiness_report.md'), renderReadinessMarkdown(reports))
}

export async function executeSupabaseStagingResetExecution(input: {
  keepTemp: boolean
}): Promise<{ reports: ResetExecutionReports; exitCode: number }> {
  void input
  const initialReports = await buildSupabaseStagingResetExecutionReports()
  const gateBlockers = collectUniqueBlockers(
    extractBlockers(initialReports.sourceOfTruthOwnershipAudit),
    extractBlockers(initialReports.precheckReport),
    extractBlockers(initialReports.secretGuardReport),
    extractBlockers(initialReports.cliTransportReport),
    getMissingExecutionConfirmationBlockers(),
    getForbiddenConfirmationBlockers(),
  )
  if (gateBlockers.length > 0) {
    const reports = await buildSupabaseStagingResetExecutionReports({
      backupExportExecutionReport: buildBlockedBackupExportExecutionReport(gateBlockers),
      executionReport: buildBlockedResetExecutionReport(gateBlockers),
    })
    await writeSupabaseStagingResetExecutionArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const backupReport = await executeBackupExport()
  const reportsAfterBackup = await buildSupabaseStagingResetExecutionReports({
    backupExportExecutionReport: backupReport,
  })
  const preview = reportsAfterBackup.previewReport
  if (backupReport.status !== 'passed' || preview.status !== 'passed') {
    const reports = await buildSupabaseStagingResetExecutionReports({
      backupExportExecutionReport: backupReport,
      executionReport: buildBlockedResetExecutionReport(
        collectUniqueBlockers(extractBlockers(backupReport), extractBlockers(preview)),
      ),
    })
    await writeSupabaseStagingResetExecutionArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const resetReport = await executeResetCommand()
  if (resetReport.status !== 'passed') {
    const reports = await buildSupabaseStagingResetExecutionReports({
      backupExportExecutionReport: backupReport,
      executionReport: resetReport,
    })
    await writeSupabaseStagingResetExecutionArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const postVerify = await executePostResetMigrationHistoryVerify()
  const schemaRlsVerify = await executePostResetSchemaRlsVerify()
  const reports = await buildSupabaseStagingResetExecutionReports({
    backupExportExecutionReport: backupReport,
    executionReport: resetReport,
    postVerifyReport: postVerify,
    schemaRlsVerifyReport: schemaRlsVerify,
  })
  await writeSupabaseStagingResetExecutionArtifacts(reports)
  return {
    reports,
    exitCode: postVerify.status === 'passed' && schemaRlsVerify.status === 'passed' ? 0 : 1,
  }
}

export async function executeSupabaseStagingResetExecutionVerify(): Promise<{
  reports: ResetExecutionReports
  exitCode: number
}> {
  const gateReports = await buildSupabaseStagingResetExecutionReports()
  const verifyPrecheckReport = buildPrecheckReport(gateReports.sourceOfTruthOwnershipAudit, {
    requireExecutionConfirmations: false,
  })
  const blockers = collectUniqueBlockers(
    extractBlockers(verifyPrecheckReport),
    extractBlockers(gateReports.secretGuardReport),
    extractBlockers(gateReports.cliTransportReport),
    getMissingVerifyConfirmationBlockers(),
    getForbiddenConfirmationBlockers(),
  )
  if (blockers.length > 0) {
    const reports = await buildSupabaseStagingResetExecutionReports({
      precheckReport: verifyPrecheckReport,
      postVerifyReport: buildBlockedPostVerifyReport(blockers),
      schemaRlsVerifyReport: buildBlockedSchemaRlsVerifyReport(blockers),
    })
    await writeSupabaseStagingResetExecutionArtifacts(reports)
    return { reports, exitCode: 1 }
  }
  const postVerify = await executePostResetMigrationHistoryVerify()
  const schemaRlsVerify = await executePostResetSchemaRlsVerify()
  const reports = await buildSupabaseStagingResetExecutionReports({
    precheckReport: verifyPrecheckReport,
    postVerifyReport: postVerify,
    schemaRlsVerifyReport: schemaRlsVerify,
  })
  await writeSupabaseStagingResetExecutionArtifacts(reports)
  return {
    reports,
    exitCode: postVerify.status === 'passed' && schemaRlsVerify.status === 'passed' ? 0 : 1,
  }
}

export async function readSupabaseStagingResetExecutionSummary() {
  const reports = await buildSupabaseStagingResetExecutionReports()
  const readiness = (readJson(path.join(SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR, 'staging_reset_readiness_report.json')) ??
    reports.readinessReport) as { status?: string; nextRecommendedPhase?: string }
  const blocker = (readJson(path.join(SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR, 'staging_reset_blocker_report.json')) ??
    reports.blockerReport) as { activeBlockers?: string[] }
  const execution = (readJson(path.join(SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR, 'staging_reset_execution_report.json')) ??
    reports.executionReport) as { resetPerformed?: boolean; resetAttempted?: boolean; stagingSqlMayHaveRun?: boolean }
  const verify = (readJson(path.join(SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR, 'staging_reset_post_verify_report.json')) ??
    reports.postVerifyReport) as { status?: string; migrationHistoryVerified?: boolean }
  const rls = (readJson(path.join(SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR, 'staging_reset_schema_rls_verify_report.json')) ??
    reports.schemaRlsVerifyReport) as { status?: string; schemaRlsVerified?: boolean }
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: readiness.status,
    stagingResetRun: execution.resetPerformed === true,
    stagingResetAttempted: execution.resetAttempted === true,
    stagingSqlMayHaveRun: execution.stagingSqlMayHaveRun === true || execution.resetAttempted === true,
    stagingMigrationHistoryVerified: verify.migrationHistoryVerified === true,
    stagingSchemaRlsVerified: rls.schemaRlsVerified === true,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    migrationRepairRun: false,
    secretsPrintedOrCommitted: false,
    activeBlockers: blocker.activeBlockers ?? [],
    nextRecommendedPhase: readiness.nextRecommendedPhase,
  }
}

function buildSourceOfTruthOwnershipAudit(): JsonRecord {
  const sourceFiles = [
    'README.md',
    'AGENTS.md',
    'PRODUCTION_FOUNDATION_STATUS.md',
    'docs/source-of-truth-map.md',
    'docs/production-milestone-plan.md',
    'docs/beta-readiness-scorecard.md',
    'docs/production-beta-blocker-inventory.md',
    'docs/supabase-staging-data-impact-backup-approval-decision.md',
    'docs/supabase-staging-owner-data-loss-acceptance.md',
    'docs/supabase-staging-reset-owner-approval-decision.md',
    'docs/implementation-prompts/prompt-supabase-staging-reset-and-reapply-execution.md',
  ].map((file) => ({ file, exists: existsSync(file) }))
  const reportFiles = [
    path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
    path.join(PR252_REPORT_DIR, 'staging_backup_snapshot_plan.json'),
    path.join(PR252_REPORT_DIR, 'staging_owner_data_loss_acceptance_decision_update.json'),
    path.join(PR252_REPORT_DIR, 'staging_data_impact_inventory.json'),
    path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'),
    path.join(PR241_REPORT_DIR, 'migration_history_repair_approval_after_equivalence_review.json'),
    path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
    path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
  ].map((file) => ({ file, exists: existsSync(file) }))
  const migrationExists = existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH)
  const migrationIds = getLocalMigrationIds()
  const requiredDecisionDocsPresent = sourceFiles
    .filter((source) => source.file.includes('supabase-staging'))
    .every((source) => source.exists)
  const requiredReportsPresent = reportFiles.slice(0, 4).every((file) => file.exists)
  const blockers: SupabaseStagingResetExecutionBlocker[] =
    migrationExists && requiredDecisionDocsPresent && requiredReportsPresent
      ? []
      : ['source_of_truth_ownership_audit_failed']
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    sourceFiles,
    reportFiles,
    missingNonBlockingSourceFiles: sourceFiles.filter((source) => !source.exists).map((source) => source.file),
    migration: {
      path: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
      exists: migrationExists,
      localMigrationCount: migrationIds.length,
      localMigrationIds: migrationIds,
    },
    ownership: {
      pr252: 'staging data-impact, backup planning, and owner acceptance approval',
      thisPhase: 'guarded staging reset/reapply execution and post-reset verification',
      pr198: 'future Track B staging metadata backfill only after reset verification',
    },
    productionAffected: false,
    trackBBackfillWrite: false,
    secretsPrintedOrCommitted: false,
    blockers,
  }
}

function buildPrecheckReport(
  sourceAudit: JsonRecord,
  input: { requireExecutionConfirmations?: boolean } = {},
): JsonRecord {
  const requireExecutionConfirmations = input.requireExecutionConfirmations !== false
  const decision = readJson(path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'))
  const backup = readJson(path.join(PR252_REPORT_DIR, 'staging_backup_snapshot_plan.json'))
  const owner = readJson(path.join(PR252_REPORT_DIR, 'staging_owner_data_loss_acceptance_decision_update.json'))
  const dataImpact = readJson(path.join(PR252_REPORT_DIR, 'staging_data_impact_inventory.json'))
  const approvedReference = buildApprovedStagingTargetReferenceReport()
  const pluginTarget = buildSupabasePluginTargetPreflight()
  const blockers: SupabaseStagingResetExecutionBlocker[] = []
  if (sourceAudit.status !== 'passed') blockers.push('source_of_truth_ownership_audit_failed')
  if (decision?.decision !== 'approved_for_future_staging_reset_and_reapply_migrations') {
    blockers.push('pr252_reset_approval_missing')
  }
  if (dataImpact?.status !== 'reviewed_from_readonly_metadata') blockers.push('pr252_data_impact_not_reviewed')
  if (backup?.status !== 'acceptable_for_future_execution_not_run') blockers.push('pr252_backup_plan_not_acceptable')
  if (owner?.ownerAcceptanceAccepted !== true) blockers.push('pr252_owner_acceptance_missing')
  if (approvedReference.status !== 'passed') blockers.push('approved_staging_target_reference_missing')
  if (pluginTarget.status !== 'passed') {
    blockers.push(...normalizePluginTargetBlockers(pluginTarget.blockers))
  }
  if (requireExecutionConfirmations) blockers.push(...getMissingExecutionConfirmationBlockers())
  blockers.push(...getForbiddenConfirmationBlockers())
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    sourceDecision: decision
      ? {
          decision: decision.decision,
          approvalStatus: decision.approvalStatus,
          stagingResetRun: decision.stagingResetRun,
          productionAffected: decision.productionAffected,
        }
      : null,
    backupPlan: backup
      ? {
          status: backup.status,
          backupRunInThisPhase: backup.backupRunInThisPhase,
          blockers: backup.blockers ?? [],
        }
      : null,
    ownerAcceptance: owner
      ? {
          status: owner.status,
          ownerAcceptanceAccepted: owner.ownerAcceptanceAccepted,
        }
      : null,
    dataImpact: dataImpact
      ? {
          status: dataImpact.status,
          tableCount: dataImpact.tableCount,
          blockers: dataImpact.blockers ?? [],
        }
      : null,
    approvedTargetReference: {
      status: approvedReference.status,
      approvedStagingTargetReferenceFound: approvedReference.approvedStagingTargetReferenceFound,
      approvedStagingProjectName: approvedReference.approvedStagingProjectName,
      approvedStagingProjectRef: approvedReference.approvedStagingProjectRef,
      approvedEnvironment: approvedReference.approvedEnvironment,
      secretPayloadsPrinted: approvedReference.secretPayloadsPrinted,
    },
    pluginTargetProof: {
      status: pluginTarget.status,
      stagingTargetConfirmed: pluginTarget.stagingTargetConfirmed,
      selectedProject: pluginTarget.selectedProject,
      credentialPayloadsPrinted: pluginTarget.credentialPayloadsPrinted,
    },
    requiredConfirmations: SUPABASE_STAGING_RESET_EXECUTION_REQUIRED_CONFIRMATIONS.map((name) => ({
      name,
      set: process.env[name] === 'true',
      requiredForThisPrecheck: requireExecutionConfirmations,
    })),
    backupExportConfirmation: {
      name: SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION,
      set: process.env[SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION] === 'true',
    },
    forbiddenConfirmationsSet: SUPABASE_STAGING_RESET_EXECUTION_FORBIDDEN_CONFIRMATIONS.filter(
      (name) => process.env[name] === 'true',
    ),
    stagingOnlyTarget: true,
    productionAffected: false,
    trackBBackfillWrite: false,
    migrationRepairRun: false,
    directDdlDmlRun: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildSecretGuardReport(): JsonRecord {
  const presentNames = APPROVED_DB_URL_ENV_NAMES.filter((name) => Boolean(process.env[name]))
  const selectedName = presentNames[0] ?? null
  const selectedValue = selectedName ? process.env[selectedName] : undefined
  const payloadStatus = process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_PAYLOAD_ACCESS_STATUS
  const targetValidation = buildDbUrlTargetValidation(selectedValue)
  const blockers: SupabaseStagingResetExecutionBlocker[] = []
  if (!selectedName) blockers.push('staging_db_url_secret_reference_missing')
  if (payloadStatus === 'denied') blockers.push('staging_db_url_secret_payload_access_denied')
  if (payloadStatus === 'invalid') blockers.push('staging_db_url_secret_payload_invalid')
  if (selectedName) blockers.push(...targetValidation.blockers)
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    secretRefUsed: process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF ?? 'SUPABASE_DB_URL',
    approvedDbUrlEnvNames: APPROVED_DB_URL_ENV_NAMES,
    presentDbUrlEnvNames: presentNames,
    selectedDbUrlEnvName: selectedName,
    dbUrlEnvPresent: Boolean(selectedName),
    dbUrlTargetValidation: targetValidation,
    dbUrlTargetMatchedApprovedStaging: targetValidation.dbUrlTargetMatchedApprovedStaging,
    payloadAccessStatus: payloadStatus ?? 'not_attempted_or_not_reported',
    payloadPrinted: false,
    payloadCommitted: false,
    dbUrlPrinted: false,
    dbUrlCommitted: false,
    hostnamePrinted: false,
    usernamePrinted: false,
    passwordPrinted: false,
    credentialPayloadsPrinted: false,
    secretPayloadsReadForReports: false,
    productionTargetSelected: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

async function buildCliTransportReport(): Promise<JsonRecord> {
  const confirmed = process.env.REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC === 'true'
  const cachePolicy = buildTempNpmExecCachePolicy()
  if (!confirmed) {
    return {
      phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
      runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
      status: 'skipped',
      selectedStrategy: 'blocked',
      confirmation: 'REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC',
      confirmed,
      npmExecAttempted: false,
      packageName: TEMP_SUPABASE_CLI_PACKAGE,
      cachePolicy,
      packageLockChanged: false,
      repoDependencyInstalled: false,
      globalInstallAttempted: false,
      credentialPayloadsPrinted: false,
      blockers: ['temp_cli_exec_not_confirmed'],
    }
  }
  ensureTempNpmExecDirs()
  const command = await runCommand(
    'npm',
    ['exec', '--yes', '--package', TEMP_SUPABASE_CLI_PACKAGE, '--', 'supabase', '--version'],
    process.cwd(),
    120000,
    getTempNpmExecEnvOverrides(),
  )
  const blockers: SupabaseStagingResetExecutionBlocker[] =
    command.status === 'passed' ? [] : ['temp_npm_exec_supabase_cli_unavailable']
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    selectedStrategy: blockers.length === 0 ? 'temp_npm_exec_supabase_cli' : 'blocked',
    confirmation: 'REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC',
    confirmed,
    packageName: TEMP_SUPABASE_CLI_PACKAGE,
    command,
    cachePolicy,
    packageLockChanged: false,
    repoDependencyInstalled: false,
    globalInstallAttempted: false,
    credentialPayloadsPrinted: false,
    blockers,
  }
}

function buildDefaultBackupExportExecutionReport(
  precheck: JsonRecord,
  secretGuard: JsonRecord,
  cliTransport: JsonRecord,
): JsonRecord {
  const blockers = collectUniqueBlockers(
    extractBlockers(precheck),
    extractBlockers(secretGuard),
    extractBlockers(cliTransport),
    process.env[SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION] === 'true'
      ? []
      : ['staging_backup_export_not_confirmed'],
  )
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: 'blocked',
    backupExportPerformed: false,
    backupRequiredBeforeReset: true,
    backupType: 'private_temp_schema_dump_and_migration_history_metadata',
    backupDestination: 'redacted_temp_directory_outside_repo',
    backupPayloadCommitted: false,
    backupPayloadPrinted: false,
    rowDataDumpPerformed: false,
    storageObjectBackupPerformed: false,
    privateDestinationConfigured: true,
    reason: 'backup_export_requires_execute_path_and_backup_confirmation',
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildBackupArtifactManifest(backupReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: backupReport.status === 'passed' ? 'private_temp_backup_created_not_committed' : 'not_created',
    backupRoot: 'redacted_temp_directory_outside_repo',
    backupFiles: backupReport.status === 'passed'
      ? [
          {
            class: 'schema_dump',
            path: 'redacted_temp_schema_dump_path',
            committed: false,
            printed: false,
          },
        ]
      : [],
    privateUploadRequired: false,
    privateUploadPerformed: false,
    backupPayloadCommitted: false,
    backupPayloadPrinted: false,
    dbUrlCommitted: false,
    secretsCommitted: false,
  }
}

function buildResetPreviewReport(
  sourceAudit: JsonRecord,
  precheck: JsonRecord,
  secretGuard: JsonRecord,
  cliTransport: JsonRecord,
  backupReport: JsonRecord,
): JsonRecord {
  const localMigrations = getLocalMigrationIds()
  const hasNoSeed = true
  const blockers = collectUniqueBlockers(
    extractBlockers(sourceAudit),
    extractBlockers(precheck),
    extractBlockers(secretGuard),
    extractBlockers(cliTransport),
    extractBlockers(backupReport),
    hasNoSeed ? [] : ['reset_command_plan_missing_no_seed'],
  )
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    resetDryRunSupported: false,
    previewMode: 'command_plan_preview_plus_backup_and_migration_inventory',
    commandPlanPreviewPassed: blockers.length === 0,
    resetCommand: {
      command: 'npm',
      prefixArgs: ['exec', '--yes', '--package', TEMP_SUPABASE_CLI_PACKAGE, '--', 'supabase'],
      operation: ['db', 'reset', '--db-url', '[REDACTED_STAGING_DB_URL]', '--no-seed'],
      seedBehavior: 'no_seed',
      dbUrlRedacted: true,
    },
    migrationInventory: {
      localMigrationCount: localMigrations.length,
      localMigrationIds: localMigrations,
      registryMigrationPresent: localMigrations.includes('202606050001'),
      migrationDirectory: 'supabase/migrations',
    },
    backupGatePassed: backupReport.status === 'passed',
    targetGatePassed: precheck.status === 'passed' && secretGuard.status === 'passed',
    cliGatePassed: cliTransport.status === 'passed',
    commandPlanContainsNoSeed: hasNoSeed,
    seedFilesIncluded: false,
    migrationRepairRun: false,
    trackBBackfillWrite: false,
    productionAffected: false,
    directDdlDmlRun: false,
    credentialPayloadsPrinted: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildDefaultResetExecutionReport(previewReport: JsonRecord, backupReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: 'blocked',
    selectedStrategy: 'temp_npm_exec_supabase_cli',
    resetPerformed: false,
    resetAttempted: false,
    resetCommandPreviewStatus: previewReport.status,
    backupExportStatus: backupReport.status,
    reason: 'reset_execution_requires_execute_flag_after_passed_backup_and_preview',
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    seedFilesIncluded: false,
    noSeedFlagUsed: true,
    migrationRepairRun: false,
    trackBBackfillWrite: false,
    productionAffected: false,
    directDdlDmlRun: false,
    blockers: collectUniqueBlockers(extractBlockers(previewReport), ['staging_reset_execute_not_confirmed']),
  }
}

function buildDefaultPostVerifyReport(executionReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    migrationHistoryVerified: false,
    reason: 'post_reset_verify_requires_successful_reset_or_explicit_verify_command',
    resetExecutionStatus: executionReport.status,
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(
      extractBlockers(executionReport),
      ['staging_post_reset_migration_history_verify_failed'],
    ),
  }
}

function buildDefaultSchemaRlsVerifyReport(postVerifyReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: 'blocked',
    schemaRlsVerified: false,
    verificationPerformed: false,
    reason: 'schema_rls_verify_requires_successful_post_reset_migration_history_verify',
    postVerifyStatus: postVerifyReport.status,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(extractBlockers(postVerifyReport), ['staging_post_reset_schema_rls_verify_failed']),
  }
}

function buildBlockedBackupExportExecutionReport(blockers: SupabaseStagingResetExecutionBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: 'blocked',
    backupExportPerformed: false,
    backupRequiredBeforeReset: true,
    backupPayloadCommitted: false,
    backupPayloadPrinted: false,
    dbUrlPrinted: false,
    blockers: collectUniqueBlockers(blockers, ['staging_backup_export_failed']),
  }
}

function buildBlockedResetExecutionReport(blockers: SupabaseStagingResetExecutionBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: 'blocked',
    resetPerformed: false,
    resetAttempted: false,
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    seedFilesIncluded: false,
    noSeedFlagUsed: true,
    migrationRepairRun: false,
    trackBBackfillWrite: false,
    productionAffected: false,
    directDdlDmlRun: false,
    blockers: collectUniqueBlockers(blockers, ['staging_reset_failed']),
  }
}

function buildBlockedPostVerifyReport(blockers: SupabaseStagingResetExecutionBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    migrationHistoryVerified: false,
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(blockers, ['staging_post_reset_migration_history_verify_failed']),
  }
}

function buildBlockedSchemaRlsVerifyReport(blockers: SupabaseStagingResetExecutionBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    schemaRlsVerified: false,
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(blockers, ['staging_post_reset_schema_rls_verify_failed']),
  }
}

async function executeBackupExport(): Promise<JsonRecord> {
  const confirmationSet = process.env[SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION] === 'true'
  if (!confirmationSet) return buildBlockedBackupExportExecutionReport(['staging_backup_export_not_confirmed'])
  mkdirSync(BACKUP_RUN_DIR, { recursive: true })
  const dbUrl = readSelectedStagingDbUrl()
  const envOverrides = getTempNpmExecEnvOverrides()
  const dryRun = await runCommand(
    'npm',
    [
      'exec',
      '--yes',
      '--package',
      TEMP_SUPABASE_CLI_PACKAGE,
      '--',
      'supabase',
      'db',
      'dump',
      '--db-url',
      dbUrl,
      '--dry-run',
      '--file',
      BACKUP_SCHEMA_FILE,
      '--schema',
      'public,auth,storage,supabase_migrations',
    ],
    process.cwd(),
    120000,
    envOverrides,
  )
  if (dryRun.status !== 'passed') {
    return {
      phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
      runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
      status: 'blocked',
      backupExportPerformed: false,
      dryRunPerformed: true,
      dryRunCommand: dryRun,
      backupPayloadCommitted: false,
      backupPayloadPrinted: false,
      dbUrlPrinted: false,
      blockers: ['staging_backup_export_failed'],
    }
  }
  const dump = await runCommand(
    'npm',
    [
      'exec',
      '--yes',
      '--package',
      TEMP_SUPABASE_CLI_PACKAGE,
      '--',
      'supabase',
      'db',
      'dump',
      '--db-url',
      dbUrl,
      '--file',
      BACKUP_SCHEMA_FILE,
      '--schema',
      'public,auth,storage,supabase_migrations',
    ],
    process.cwd(),
    180000,
    envOverrides,
  )
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: dump.status === 'passed' ? 'passed' : 'blocked',
    backupExportPerformed: dump.status === 'passed',
    backupRequiredBeforeReset: true,
    backupType: 'private_temp_schema_dump_and_migration_history_metadata',
    dryRunPerformed: true,
    dryRunCommand: dryRun,
    backupCommand: dump,
    backupDestination: 'redacted_temp_directory_outside_repo',
    backupFileCreated: dump.status === 'passed' && existsSync(BACKUP_SCHEMA_FILE),
    backupFileByteLength: dump.status === 'passed' && existsSync(BACKUP_SCHEMA_FILE)
      ? statSync(BACKUP_SCHEMA_FILE).size
      : 0,
    backupPayloadCommitted: false,
    backupPayloadPrinted: false,
    rowDataDumpPerformed: false,
    storageObjectBackupPerformed: false,
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: dump.status === 'passed' ? [] : ['staging_backup_export_failed'],
  }
}

async function executeResetCommand(): Promise<JsonRecord> {
  const dbUrl = readSelectedStagingDbUrl()
  const command = await runCommand(
    'npm',
    [
      'exec',
      '--yes',
      '--package',
      TEMP_SUPABASE_CLI_PACKAGE,
      '--',
      'supabase',
      'db',
      'reset',
      '--db-url',
      dbUrl,
      '--no-seed',
    ],
    process.cwd(),
    300000,
    getTempNpmExecEnvOverrides(),
  )
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: command.status === 'passed' ? 'passed' : 'blocked',
    selectedStrategy: 'temp_npm_exec_supabase_cli',
    resetPerformed: command.status === 'passed',
    resetAttempted: true,
    stagingSqlMayHaveRun: true,
    resetCommand: command,
    noSeedFlagUsed: true,
    seedFilesIncluded: false,
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    migrationRepairRun: false,
    trackBBackfillWrite: false,
    productionAffected: false,
    directDdlDmlRun: false,
    blockers: command.status === 'passed' ? [] : ['staging_reset_failed'],
  }
}

async function executePostResetMigrationHistoryVerify(): Promise<JsonRecord> {
  const dbUrl = readSelectedStagingDbUrl()
  const result = await runCommandWithRaw(
    'npm',
    [
      'exec',
      '--yes',
      '--package',
      TEMP_SUPABASE_CLI_PACKAGE,
      '--',
      'supabase',
      'migration',
      'list',
      '--db-url',
      dbUrl,
      '--output-format',
      'json',
    ],
    process.cwd(),
    120000,
    getTempNpmExecEnvOverrides(),
  )
  const parsed = parseSupabaseMigrationListOutput(result.stdout)
  const localIds = getLocalMigrationIds()
  const missingLocalIds = localIds.filter((id) => !parsed.remoteIds.includes(id))
  const passed = result.report.status === 'passed' && missingLocalIds.length === 0
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    verificationPerformed: result.report.status === 'passed',
    migrationHistoryVerified: passed,
    migrationListCommand: result.report,
    migrationHistoryParseMode: parsed.parseMode,
    migrationHistoryJsonParsed: parsed.jsonParsed,
    localMigrationIds: localIds,
    remoteMigrationIds: parsed.remoteIds,
    missingLocalIdsAfterReset: missingLocalIds,
    registryMigrationApplied: parsed.remoteIds.includes('202606050001'),
    dbUrlPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: passed ? [] : ['staging_post_reset_migration_history_verify_failed'],
  }
}

async function executePostResetSchemaRlsVerify(): Promise<JsonRecord> {
  const psqlCommand = findPsqlCommand()
  if (!psqlCommand) return buildBlockedSchemaRlsVerifyReport(['psql_unavailable_for_post_reset_verify'])
  const dbUrl = readSelectedStagingDbUrl()
  const connection = parseDbUrlForPsqlEnv(dbUrl)
  if (!connection) return buildBlockedSchemaRlsVerifyReport(['staging_db_url_target_unparseable'])
  const tableList = SUPABASE_MILESTONE_REGISTRY_TABLES.map((table) => `'${table}'`).join(',')
  const query = `
with registry_tables as (
  select c.relname as table_name, c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r','p')
    and c.relname in (${tableList})
),
registry_grants as (
  select table_name, grantee, privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (${tableList})
    and grantee in ('PUBLIC','public','anon','authenticated','service_role')
),
registry_indexes as (
  select tablename as table_name, count(*)::int as index_count
  from pg_indexes
  where schemaname = 'public'
    and tablename in (${tableList})
  group by tablename
)
select json_build_object(
  'tables', coalesce((select json_agg(registry_tables order by table_name) from registry_tables), '[]'::json),
  'grants', coalesce((select json_agg(registry_grants order by table_name, grantee, privilege_type) from registry_grants), '[]'::json),
  'indexes', coalesce((select json_agg(registry_indexes order by table_name) from registry_indexes), '[]'::json)
)::text;
`
  const command = await runPsqlJsonCommand(psqlCommand, connection, query)
  const parsed = parseJsonObject(command.stdout)
  const tables = Array.isArray(parsed?.tables) ? parsed.tables as Array<Record<string, unknown>> : []
  const grants = Array.isArray(parsed?.grants) ? parsed.grants as Array<Record<string, unknown>> : []
  const missingTables = SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) =>
    !tables.some((row) => row.table_name === table),
  )
  const rlsDisabledTables = tables
    .filter((row) => row.rls_enabled !== true)
    .map((row) => String(row.table_name))
  const broadGrantRows = grants.filter((row) =>
    ['PUBLIC', 'public', 'anon', 'authenticated'].includes(String(row.grantee)),
  )
  const passed =
    command.report.status === 'passed' &&
    missingTables.length === 0 &&
    rlsDisabledTables.length === 0 &&
    broadGrantRows.length === 0
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    verificationPerformed: command.report.status === 'passed',
    schemaRlsVerified: passed,
    psqlCommand: command.report,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    tableCountFound: tables.length,
    missingTables,
    rlsDisabledTables,
    broadGrantCount: broadGrantRows.length,
    publicAnonAuthenticatedRevoked: broadGrantRows.length === 0,
    serviceRoleOnlyExpected: true,
    dbUrlPrinted: false,
    hostnamePrinted: false,
    usernamePrinted: false,
    passwordPrinted: false,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: passed ? [] : ['staging_post_reset_schema_rls_verify_failed'],
  }
}

function wrapTrackBBackfillReport(report: JsonRecord, mode: 'preflight' | 'diff'): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: report.status ?? 'blocked',
    mode,
    sourcePr198: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/198',
    writePathRun: false,
    stagingMetadataWriteConfirmationSet: process.env.REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE === 'true',
    trackBBackfillConfirmationSet: process.env.REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL === 'true',
    productionAffected: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    trackA: 'not_touched',
    delegatedReport: report,
    blockers: extractBlockers(report),
  }
}

function buildBlockerReport(blockers: SupabaseStagingResetExecutionBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    resetExecutionAllowed: blockers.length === 0,
    expectedSafeBlockers: [
      'staging_db_url_secret_reference_missing',
      'staging_db_url_secret_payload_access_denied',
      'temp_cli_exec_not_confirmed',
      'staging_backup_export_not_confirmed',
      'staging_backup_export_failed',
      'staging_reset_failed',
      'staging_post_reset_migration_history_verify_failed',
      'staging_post_reset_schema_rls_verify_failed',
    ],
    stillBlockedScopes: [
      'production_supabase',
      'production_sql',
      'track_b_backfill_write',
      'migration_repair',
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

function buildReadinessReport(
  executionReport: JsonRecord,
  postVerifyReport: JsonRecord,
  schemaRlsVerifyReport: JsonRecord,
  trackBPreflightReport: JsonRecord,
  blockers: SupabaseStagingResetExecutionBlocker[],
): JsonRecord {
  const passed =
    executionReport.status === 'passed' &&
    postVerifyReport.status === 'passed' &&
    schemaRlsVerifyReport.status === 'passed'
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    stagingResetReapplyComplete: passed,
    stagingResetRun: executionReport.resetPerformed === true,
    migrationHistoryVerified: postVerifyReport.status === 'passed',
    schemaRlsVerified: schemaRlsVerifyReport.status === 'passed',
    trackBBackfillPreflightStatus: trackBPreflightReport.status,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
    migrationRepairRun: false,
    secretsPrintedOrCommitted: false,
    blockers,
    nextRecommendedPhase: passed
      ? 'Guarded PR #198 Track B staging backfill rerun with write confirmations still separate.'
      : 'Resolve the exact staging reset backup, secret, CLI, reset, or post-reset verification blocker before Track B backfill.',
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_STAGING_RESET_EXECUTION_PHASE,
    runId: SUPABASE_STAGING_RESET_EXECUTION_RUN_ID,
    status: 'committed_safe_metadata_only',
    reportDir: SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_RESET_EXECUTION_EXPECTED_REPORTS,
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

function renderReadinessMarkdown(reports: ResetExecutionReports): string {
  const readiness = reports.readinessReport as { status?: string; nextRecommendedPhase?: string }
  const blocker = reports.blockerReport as { activeBlockers?: string[] }
  const execution = reports.executionReport as { resetPerformed?: boolean }
  return [
    '# Supabase Staging Reset/Reapply Execution Readiness',
    '',
    `- Status: \`${readiness.status}\``,
    `- Staging reset run: \`${execution.resetPerformed === true ? 'yes' : 'no'}\``,
    '- Production affected: `false`',
    '- Track B backfill rows written: `false`',
    '- Migration repair run: `false`',
    '- Direct DDL/DML run: `false`',
    `- Active blockers: \`${(blocker.activeBlockers ?? []).join(', ') || 'none'}\``,
    `- Next recommended phase: ${readiness.nextRecommendedPhase}`,
    '',
  ].join('\n')
}

function normalizePluginTargetBlockers(blockers: unknown): SupabaseStagingResetExecutionBlocker[] {
  if (!Array.isArray(blockers)) return []
  return blockers.map((blocker) => {
    if (blocker === 'approved_staging_target_reference_missing') return 'approved_staging_target_reference_missing'
    if (blocker === 'supabase_plugin_staging_target_check_not_confirmed') {
      return 'supabase_plugin_staging_target_check_not_confirmed'
    }
    if (blocker === 'supabase_plugin_target_not_confirmed_as_staging') {
      return 'supabase_plugin_target_not_confirmed_as_staging'
    }
    return 'forbidden_confirmation_set'
  })
}

function getMissingExecutionConfirmationBlockers(): SupabaseStagingResetExecutionBlocker[] {
  const blockers: SupabaseStagingResetExecutionBlocker[] = []
  const missing = new Set(
    SUPABASE_STAGING_RESET_EXECUTION_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true'),
  )
  if (missing.has('REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE')) {
    blockers.push('staging_reset_execute_not_confirmed')
  }
  if (missing.has('REEDITPRO_CONFIRM_SUPABASE_DB_RESET')) blockers.push('staging_db_reset_not_confirmed')
  if (missing.has('REEDITPRO_CONFIRM_SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE')) {
    blockers.push('staging_owner_data_loss_acceptance_not_confirmed')
  }
  if (missing.has('REEDITPRO_CONFIRM_SUPABASE_STAGING_BACKUP_SNAPSHOT_APPROVAL_PACKET')) {
    blockers.push('staging_backup_snapshot_packet_not_confirmed')
  }
  if (missing.has('REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION')) {
    blockers.push('staging_schema_mutation_not_confirmed')
  }
  if (missing.has('REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_READONLY_INSPECTION')) {
    blockers.push('staging_schema_readonly_inspection_not_confirmed')
  }
  if (missing.has('REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC')) blockers.push('temp_cli_exec_not_confirmed')
  return collectUniqueBlockers(blockers)
}

function getMissingVerifyConfirmationBlockers(): SupabaseStagingResetExecutionBlocker[] {
  const required = [
    'REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF',
    'REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK',
    'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_READONLY_INSPECTION',
    'REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC',
  ] as const
  return required.every((name) => process.env[name] === 'true')
    ? []
    : ['staging_schema_readonly_inspection_not_confirmed']
}

function getForbiddenConfirmationBlockers(): SupabaseStagingResetExecutionBlocker[] {
  return SUPABASE_STAGING_RESET_EXECUTION_FORBIDDEN_CONFIRMATIONS.some((name) => process.env[name] === 'true')
    ? ['forbidden_confirmation_set']
    : []
}

function buildDbUrlTargetValidation(dbUrl: string | undefined): JsonRecord & {
  blockers: SupabaseStagingResetExecutionBlocker[]
  dbUrlTargetMatchedApprovedStaging: boolean
} {
  if (!dbUrl) {
    return {
      status: 'skipped',
      dbUrlProvided: false,
      dbUrlParsedInMemory: false,
      dbUrlValuePrinted: false,
      dbUrlValueCommitted: false,
      hostnamePrinted: false,
      usernamePrinted: false,
      passwordPrinted: false,
      approvedStagingProjectRefMatched: false,
      dbUrlTargetMatchedApprovedStaging: false,
      directDbHostPatternRecognized: false,
      poolerUsernamePatternRecognized: false,
      productionTargetSelected: false,
      blockers: [],
    }
  }
  const blockers: SupabaseStagingResetExecutionBlocker[] = []
  let parsedUrl: URL
  try {
    parsedUrl = new URL(dbUrl)
  } catch {
    blockers.push('staging_db_url_target_unparseable')
    return {
      status: 'blocked',
      dbUrlProvided: true,
      dbUrlParsedInMemory: false,
      dbUrlValuePrinted: false,
      dbUrlValueCommitted: false,
      hostnamePrinted: false,
      usernamePrinted: false,
      passwordPrinted: false,
      approvedStagingProjectRefMatched: false,
      dbUrlTargetMatchedApprovedStaging: false,
      directDbHostPatternRecognized: false,
      poolerUsernamePatternRecognized: false,
      productionTargetSelected: false,
      blockers,
    }
  }
  const hostname = parsedUrl.hostname.toLowerCase()
  const username = decodeURIComponent(parsedUrl.username).toLowerCase()
  const candidateRefs = new Set<string>()
  const directDbHostMatch = hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/)
  if (directDbHostMatch?.[1]) candidateRefs.add(directDbHostMatch[1])
  for (const match of username.matchAll(/[a-z0-9]{20}/g)) candidateRefs.add(match[0])
  const protocolAllowed = parsedUrl.protocol === 'postgres:' || parsedUrl.protocol === 'postgresql:'
  const refMatched = candidateRefs.has(APPROVED_STAGING_PROJECT_REF) || dbUrl.includes(APPROVED_STAGING_PROJECT_REF)
  const targetRefDetected = candidateRefs.size > 0 || refMatched
  if (!protocolAllowed) blockers.push('staging_db_url_target_unparseable')
  if (!targetRefDetected) blockers.push('staging_db_url_target_ref_missing')
  if (targetRefDetected && !refMatched) blockers.push('staging_db_url_target_ref_mismatch')
  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    dbUrlProvided: true,
    dbUrlParsedInMemory: true,
    dbUrlValuePrinted: false,
    dbUrlValueCommitted: false,
    hostnamePrinted: false,
    usernamePrinted: false,
    passwordPrinted: false,
    approvedStagingProjectRefMatched: refMatched,
    dbUrlTargetMatchedApprovedStaging: refMatched && blockers.length === 0,
    directDbHostPatternRecognized: Boolean(directDbHostMatch),
    poolerUsernamePatternRecognized: username.includes('postgres.') && /[a-z0-9]{20}/.test(username),
    productionTargetSelected: false,
    blockers,
  }
}

function readSelectedStagingDbUrl(): string {
  for (const name of APPROVED_DB_URL_ENV_NAMES) {
    const value = process.env[name]
    if (value) return value
  }
  return ''
}

function ensureTempNpmExecDirs(): void {
  mkdirSync(TEMP_SUPABASE_CLI_NPM_CACHE, { recursive: true })
  mkdirSync(TEMP_SUPABASE_CLI_NPM_PREFIX, { recursive: true })
}

function getTempNpmExecEnvOverrides(): Record<string, string> {
  ensureTempNpmExecDirs()
  return {
    NPM_CONFIG_CACHE: TEMP_SUPABASE_CLI_NPM_CACHE,
    NPM_CONFIG_PREFIX: TEMP_SUPABASE_CLI_NPM_PREFIX,
    npm_config_cache: TEMP_SUPABASE_CLI_NPM_CACHE,
    npm_config_prefix: TEMP_SUPABASE_CLI_NPM_PREFIX,
  }
}

function buildTempNpmExecCachePolicy(): JsonRecord {
  return {
    cacheDir: 'redacted_temp_npm_cache_outside_repo',
    prefixDir: 'redacted_temp_npm_prefix_outside_repo',
    cacheInsideRepo: isPathInsideRepo(TEMP_SUPABASE_CLI_NPM_CACHE),
    prefixInsideRepo: isPathInsideRepo(TEMP_SUPABASE_CLI_NPM_PREFIX),
    repoDependencyInstalled: false,
    packageLockChanged: false,
    globalInstallAttempted: false,
  }
}

function isPathInsideRepo(candidatePath: string): boolean {
  const relative = path.relative(process.cwd(), candidatePath)
  return relative.length === 0 || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  timeout = 60000,
  envOverrides: Record<string, string> = {},
): Promise<SupabaseStagingResetCommandSummary> {
  return new Promise((resolve) => {
    try {
      execFile(command, args, {
        cwd,
        shell: false,
        timeout,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, ...envOverrides },
      }, (error, stdout, stderr) => {
        const err = error as NodeJS.ErrnoException & { code?: number | string }
        const exitCode = typeof err?.code === 'number' ? err.code : error ? 1 : 0
        const output = `${stdout ?? ''}\n${stderr ?? ''}\n${error?.message ?? ''}`
        resolve({
          status: error ? 'blocked' : 'passed',
          command: path.basename(command),
          args: redactArgs(args),
          cwd: cwd === process.cwd() ? 'process_cwd' : 'redacted_temp_directory',
          exitCode,
          stdoutSummary: summarizeOutput(stdout ?? ''),
          stderrSummary: summarizeOutput(stderr ?? ''),
          errorCategory: error ? detectErrorCategory(output) : undefined,
        })
      })
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      const output = error instanceof Error ? error.message : String(error)
      resolve({
        status: 'blocked',
        command: path.basename(command),
        args: redactArgs(args),
        cwd: cwd === process.cwd() ? 'process_cwd' : 'redacted_temp_directory',
        exitCode: typeof err.errno === 'number' ? err.errno : 1,
        stdoutSummary: summarizeOutput(''),
        stderrSummary: summarizeOutput(output),
        errorCategory: detectErrorCategory(output),
      })
    }
  })
}

function runCommandWithRaw(
  command: string,
  args: string[],
  cwd: string,
  timeout = 60000,
  envOverrides: Record<string, string> = {},
): Promise<{ report: SupabaseStagingResetCommandSummary; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    try {
      execFile(command, args, {
        cwd,
        shell: false,
        timeout,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, ...envOverrides },
      }, (error, stdout, stderr) => {
        const err = error as NodeJS.ErrnoException & { code?: number | string }
        const exitCode = typeof err?.code === 'number' ? err.code : error ? 1 : 0
        const output = `${stdout ?? ''}\n${stderr ?? ''}\n${error?.message ?? ''}`
        resolve({
          report: {
            status: error ? 'blocked' : 'passed',
            command: path.basename(command),
            args: redactArgs(args),
            cwd: cwd === process.cwd() ? 'process_cwd' : 'redacted_temp_directory',
            exitCode,
            stdoutSummary: summarizeOutput(stdout ?? ''),
            stderrSummary: summarizeOutput(stderr ?? ''),
            errorCategory: error ? detectErrorCategory(output) : undefined,
          },
          stdout: stdout ?? '',
          stderr: stderr ?? '',
        })
      })
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      const output = error instanceof Error ? error.message : String(error)
      resolve({
        report: {
          status: 'blocked',
          command: path.basename(command),
          args: redactArgs(args),
          cwd: cwd === process.cwd() ? 'process_cwd' : 'redacted_temp_directory',
          exitCode: typeof err.errno === 'number' ? err.errno : 1,
          stdoutSummary: summarizeOutput(''),
          stderrSummary: summarizeOutput(output),
          errorCategory: detectErrorCategory(output),
        },
        stdout: '',
        stderr: output,
      })
    }
  })
}

function runPsqlJsonCommand(
  command: string,
  connection: Record<string, string>,
  query: string,
): Promise<{ report: SupabaseStagingResetCommandSummary; stdout: string; stderr: string }> {
  return runCommandWithRaw(command, ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', query], process.cwd(), 120000, {
    ...connection,
    PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=60000',
  })
}

function findPsqlCommand(): string | null {
  const configured = process.env.REEDITPRO_PSQL_PATH
  if (configured) return configured
  return 'psql'
}

function parseDbUrlForPsqlEnv(dbUrl: string): Record<string, string> | null {
  try {
    const parsed = new URL(dbUrl)
    if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') return null
    return {
      PGHOST: parsed.hostname,
      PGPORT: parsed.port || '5432',
      PGUSER: decodeURIComponent(parsed.username),
      PGPASSWORD: decodeURIComponent(parsed.password),
      PGDATABASE: decodeURIComponent(parsed.pathname.replace(/^\//, '') || 'postgres'),
      PGSSLMODE: parsed.searchParams.get('sslmode') ?? 'require',
    }
  } catch {
    return null
  }
}

function redactArgs(args: string[]): string[] {
  return args.map((arg, index) => {
    if (args[index - 1] === '--db-url') return '[REDACTED_STAGING_DB_URL]'
    if (args[index - 1] === '-c') return '[REDACTED_READONLY_SCHEMA_QUERY]'
    if (arg === BACKUP_SCHEMA_FILE) return 'redacted_temp_schema_dump_path'
    return arg
  })
}

function summarizeOutput(output: string): { byteLength: number; lineCount: number; secretPatternDetected: boolean } {
  return {
    byteLength: Buffer.byteLength(output, 'utf8'),
    lineCount: output.length === 0 ? 0 : output.split(/\r?\n/).filter(Boolean).length,
    secretPatternDetected: SECRET_PATTERNS.some((pattern) => pattern.test(output)),
  }
}

function detectErrorCategory(output: string): string {
  if (/command not found|ENOENT|bad CPU type|spawn .* ENOENT/i.test(output)) return 'cli_unavailable'
  if (/permission denied|access denied|403|PERMISSION_DENIED/i.test(output)) return 'permission_denied'
  if (/password authentication failed|authentication failed|invalid password/i.test(output)) return 'authentication_failed'
  if (/does not support dry-run|unknown flag.*dry-run/i.test(output)) return 'dry_run_unsupported'
  if (/timeout/i.test(output)) return 'timeout'
  return 'command_failed'
}

function getLocalMigrationIds(): string[] {
  if (!existsSync('supabase/migrations')) return []
  return readdirSync('supabase/migrations')
    .filter((file) => /^\d+_.*\.sql$/.test(file))
    .map((file) => file.split('_')[0])
    .sort()
}

function readJson(file: string): JsonRecord | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as JsonRecord
  } catch {
    return null
  }
}

function loadExistingReport(fileName: string): JsonRecord | null {
  const report = readJson(path.join(SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR, fileName))
  if (
    fileName === 'staging_reset_execution_report.json' &&
    report?.resetAttempted === true &&
    report.stagingSqlMayHaveRun !== true
  ) {
    return { ...report, stagingSqlMayHaveRun: true }
  }
  return report
}

function parseJsonObject(text: string): JsonRecord | null {
  try {
    return JSON.parse(text.trim()) as JsonRecord
  } catch {
    return null
  }
}

function extractBlockers(report: unknown): SupabaseStagingResetExecutionBlocker[] {
  if (!report || typeof report !== 'object') return []
  const maybeBlockers = (report as { blockers?: unknown; activeBlockers?: unknown }).blockers ??
    (report as { activeBlockers?: unknown }).activeBlockers
  if (!Array.isArray(maybeBlockers)) return []
  return maybeBlockers.filter((blocker): blocker is SupabaseStagingResetExecutionBlocker =>
    typeof blocker === 'string',
  )
}

function collectUniqueBlockers(
  ...sets: Array<readonly SupabaseStagingResetExecutionBlocker[]>
): SupabaseStagingResetExecutionBlocker[] {
  return [...new Set(sets.flat())]
}
