import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import { TRACK_B_TOOL_IDS } from '../track-b-capability-manifests/track-b-tool-registry'
import type {
  SupabaseTrackBBackfillBlocker,
  SupabaseTrackBBackfillReports,
  TrackBSupabaseMilestoneBackfillRecord,
  TrackBSupabaseMilestoneExport,
} from './supabase-trackb-backfill-types'

export * from './trackb-clean-staging'

export const SUPABASE_TRACKB_BACKFILL_PHASE = 'supabase-trackb-milestone-staging-backfill'
export const SUPABASE_TRACKB_BACKFILL_RUN_ID = 'supabase-trackb-milestone-staging-backfill-20260605'
export const SUPABASE_TRACKB_BACKFILL_BRANCH = 'codex/rp-foundation-supabase-trackb-milestone-staging-backfill'
export const SUPABASE_TRACKB_BACKFILL_BASE_BRANCH = 'codex/rp-trackb-readiness-rollup-supabase-milestone-export'
export const SUPABASE_TRACKB_BACKFILL_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
export const TRACK_B_SUPABASE_EXPORT_PATH = 'docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.json'
export const TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH = 'docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.schema.json'
export const TRACK_B_SUPABASE_EXPORT_VERSION = 'track-b-supabase-milestone-export-v1'

export const SUPABASE_TRACKB_BACKFILL_EXPECTED_REPORTS = [
  'trackb_backfill_plan.json',
  'trackb_export_validation_report.json',
  'staging_supabase_backfill_preflight_report.json',
  'staging_supabase_registry_schema_check.json',
  'staging_supabase_registry_rls_check.json',
  'trackb_staging_backfill_diff_report.json',
  'trackb_staging_backfill_write_report.json',
  'trackb_staging_backfill_verification_report.json',
  'trackb_staging_backfill_audit_report.json',
  'trackb_staging_backfill_rollback_plan.json',
  'trackb_staging_backfill_blocker_report.json',
  'trackb_staging_backfill_readiness_report.json',
  'trackb_staging_backfill_private_artifact_manifest.json',
] as const

export const SUPABASE_TRACKB_BACKFILL_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ',
] as const

export const SUPABASE_TRACKB_BACKFILL_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_DEPLOYMENT',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACT_OUTPUT',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
] as const

const REGISTRY_MIGRATION_PATH = 'supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql'
const REGISTRY_MODULE_PATH = 'server/activation/supabase-milestone-registry-schema'
const EXPECTED_REGISTRY_TABLES = [
  'activation_milestones',
  'activation_phase_runs',
  'activation_tool_readiness',
  'activation_pr_evidence',
  'activation_artifact_manifests',
  'activation_blockers',
  'activation_allowed_scopes',
  'activation_blocked_scopes',
  'activation_next_phases',
  'activation_human_approvals',
  'activation_sync_audit_log',
] as const

const FORBIDDEN_EXPORT_KEYS = [
  'secretValue',
  'serviceRoleKey',
  'providerKey',
  'signedUrl',
  'rawPayload',
  'userPii',
  'connectionString',
  'privateArtifactContents',
] as const

const FORBIDDEN_VALUE_PATTERNS = [
  /BEGIN PRIVATE KEY/i,
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]/i,
  /provider[_-]?key\s*[:=]/i,
  /x-goog-signature=/i,
  /awsaccesskeyid=/i,
  /private-user-images\.githubusercontent\.com/i,
] as const

export function getSupabaseTrackBBackfillPlan() {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    branch: SUPABASE_TRACKB_BACKFILL_BRANCH,
    baseBranch: SUPABASE_TRACKB_BACKFILL_BASE_BRANCH,
    sourcePr196: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/196',
    mode: 'foundation_supabase_staging_metadata_backfill_only',
    reportDir: SUPABASE_TRACKB_BACKFILL_REPORT_DIR,
    expectedReports: SUPABASE_TRACKB_BACKFILL_EXPECTED_REPORTS,
    inputExportPath: TRACK_B_SUPABASE_EXPORT_PATH,
    inputExportSchemaPath: TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH,
    requiredConfirmations: SUPABASE_TRACKB_BACKFILL_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: SUPABASE_TRACKB_BACKFILL_FORBIDDEN_CONFIRMATIONS,
    stagingWriteAllowedOnlyWhen: [
      'export validates against committed safe schema',
      'activation milestone registry schema exists before this phase',
      'registry RLS/revoke/grant policy is safe before this phase',
      'server-side staging credentials are present',
      'all required current-shell confirmations are true',
      'no forbidden confirmation is set',
      'diff contains only safe Track B metadata rows',
    ],
    noProductionSupabase: true,
    noProductionSql: true,
    noMigrationDeployment: true,
    noSchemaMutation: true,
    noProviderCalls: true,
    noRouteWorkerToolExecution: true,
    noMediaProcessing: true,
    noBetaProductionUnlock: true,
    trackA: 'not_touched',
    expectedDefaultBlockerOnPr196Base: 'supabase_milestone_registry_schema_missing',
    nextRecommendedPhase: 'Supabase Track B milestone production promotion approval packet after guarded staging evidence is reviewed.',
  }
}

export function getSupabaseTrackBBackfillIamPlan() {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    gcpMutation: 'blocked',
    supabaseSchemaMutation: 'blocked',
    allowedFutureCredentialUse: 'server_side_staging_service_role_only_after_confirmations',
    forbidden: [
      'production Supabase credentials',
      'service-role secrets in frontend',
      'secret payload printing',
      'schema mutation or migration deployment',
      'public access grants',
    ],
  }
}

export function getSupabaseTrackBBackfillCostSummary() {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: 'metadata_backfill_planning_negligible_cost',
    estimatedCloudCostUsd: 0,
    billingApiCalls: 'not_run',
    providerCalls: 'not_run',
    mediaProcessing: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    privateUpload: 'not_required',
    productionAffected: false,
  }
}

export function buildSupabaseTrackBBackfillReports(overrides: {
  writeReport?: Record<string, unknown>
  verificationReport?: Record<string, unknown>
} = {}): SupabaseTrackBBackfillReports {
  const exportValidationReport = buildExportValidationReport()
  const registrySchemaCheck = buildRegistrySchemaCheck()
  const registryRlsCheck = buildRegistryRlsCheck(registrySchemaCheck)
  const stagingSupabaseBackfillPreflightReport = buildStagingPreflightReport(registrySchemaCheck, registryRlsCheck)
  const blockers = collectBlockers(exportValidationReport, registrySchemaCheck, registryRlsCheck, stagingSupabaseBackfillPreflightReport)
  const diffReport = buildDiffReport(exportValidationReport, blockers)
  const writeReport = overrides.writeReport ?? buildWriteReport(blockers)
  const verificationReport = overrides.verificationReport ?? buildVerificationReport(blockers, writeReport)
  const auditReport = buildAuditReport(exportValidationReport, diffReport, writeReport, verificationReport, blockers)
  const rollbackPlan = buildRollbackPlan(blockers)
  const blockerReport = buildBlockerReport(blockers)
  const readinessReport = buildReadinessReport(exportValidationReport, writeReport, verificationReport, blockers)
  return {
    plan: getSupabaseTrackBBackfillPlan(),
    exportValidationReport,
    stagingSupabaseBackfillPreflightReport,
    registrySchemaCheck,
    registryRlsCheck,
    diffReport,
    writeReport,
    verificationReport,
    auditReport,
    rollbackPlan,
    blockerReport,
    readinessReport,
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeSupabaseTrackBBackfillArtifacts(
  reports = buildSupabaseTrackBBackfillReports(),
  reportDir = SUPABASE_TRACKB_BACKFILL_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_export_validation_report.json'), reports.exportValidationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_supabase_backfill_preflight_report.json'), reports.stagingSupabaseBackfillPreflightReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_supabase_registry_schema_check.json'), reports.registrySchemaCheck)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_supabase_registry_rls_check.json'), reports.registryRlsCheck)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_staging_backfill_diff_report.json'), reports.diffReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_staging_backfill_write_report.json'), reports.writeReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_staging_backfill_verification_report.json'), reports.verificationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_staging_backfill_audit_report.json'), reports.auditReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_staging_backfill_rollback_plan.json'), reports.rollbackPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_staging_backfill_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_staging_backfill_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_staging_backfill_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'trackb_staging_backfill_audit_report.md'), renderAuditMarkdown(reports))
}

export function readSupabaseTrackBBackfillSummary() {
  const reports = buildSupabaseTrackBBackfillReports()
  const exportReport = reports.exportValidationReport as { recordCount?: number; status?: string }
  const blockerReport = reports.blockerReport as { activeBlockers?: string[] }
  const readiness = reports.readinessReport as { status?: string; stagingExecutionAllowed?: boolean }
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: readiness.status,
    exportValidation: exportReport.status,
    exportRecords: exportReport.recordCount,
    stagingExecutionAllowed: readiness.stagingExecutionAllowed,
    remoteSqlRun: false,
    productionSqlRun: false,
    migrationDeployment: false,
    productionAffected: false,
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    providerCalls: 'not_run',
    trackA: 'not_touched',
    activeBlockers: blockerReport.activeBlockers,
    nextRecommendedPhase: 'Supabase Track B milestone production promotion approval packet after staging evidence review.',
  }
}

export async function executeSupabaseTrackBBackfill(input: {
  staging: boolean
  keepTemp: boolean
}): Promise<{ reports: SupabaseTrackBBackfillReports; exitCode: number }> {
  const confirmationBlockers = validateExecutionConfirmations(input)
  if (confirmationBlockers.length > 0) {
    const reports = buildSupabaseTrackBBackfillReports({
      writeReport: {
        phase: SUPABASE_TRACKB_BACKFILL_PHASE,
        runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
        status: 'blocked',
        writePerformed: false,
        blockers: confirmationBlockers,
      },
      verificationReport: {
        phase: SUPABASE_TRACKB_BACKFILL_PHASE,
        runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
        status: 'blocked',
        verificationPerformed: false,
        blockers: confirmationBlockers,
      },
    })
    await writeSupabaseTrackBBackfillArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const preWriteReports = buildSupabaseTrackBBackfillReports()
  const blockers = (preWriteReports.blockerReport.activeBlockers ?? []) as SupabaseTrackBBackfillBlocker[]
  if (blockers.length > 0) {
    await writeSupabaseTrackBBackfillArtifacts(preWriteReports)
    return { reports: preWriteReports, exitCode: 1 }
  }

  const exportData = loadTrackBExport()
  const credentials = getStagingCredentialsStatus()
  if (!credentials.url || !credentials.serviceRoleKey) {
    const reports = buildSupabaseTrackBBackfillReports({
      writeReport: {
        phase: SUPABASE_TRACKB_BACKFILL_PHASE,
        runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
        status: 'blocked',
        writePerformed: false,
        blockers: ['staging_supabase_credentials_unavailable'],
      },
      verificationReport: {
        phase: SUPABASE_TRACKB_BACKFILL_PHASE,
        runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
        status: 'blocked',
        verificationPerformed: false,
        blockers: ['staging_supabase_credentials_unavailable'],
      },
    })
    await writeSupabaseTrackBBackfillArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  if (!exportData.export) {
    const reports = buildSupabaseTrackBBackfillReports()
    await writeSupabaseTrackBBackfillArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const writeResult = await writeStagingRows(credentials.url, credentials.serviceRoleKey, exportData.export.records)
  const verificationResult = writeResult.status === 'passed'
    ? await verifyStagingRows(credentials.url, credentials.serviceRoleKey, exportData.export.records)
    : {
      phase: SUPABASE_TRACKB_BACKFILL_PHASE,
      runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
      status: 'blocked',
      verificationPerformed: false,
      blockers: ['staging_write_failed'],
    }
  const reports = buildSupabaseTrackBBackfillReports({
    writeReport: writeResult,
    verificationReport: verificationResult,
  })
  await writeSupabaseTrackBBackfillArtifacts(reports)
  return { reports, exitCode: writeResult.status === 'passed' && verificationResult.status === 'passed' ? 0 : 1 }
}

function buildExportValidationReport() {
  const loaded = loadTrackBExport()
  if (!loaded.export || !loaded.schema) {
    return {
      phase: SUPABASE_TRACKB_BACKFILL_PHASE,
      runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
      status: 'blocked',
      exportPath: TRACK_B_SUPABASE_EXPORT_PATH,
      schemaPath: TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH,
      blockers: loaded.blockers,
      recordCount: 0,
    }
  }
  const blockers = validateExport(loaded.export)
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    exportPath: TRACK_B_SUPABASE_EXPORT_PATH,
    schemaPath: TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH,
    exportVersion: loaded.export.exportVersion,
    schemaId: loaded.schema.$id,
    generatedByPhase: loaded.export.generatedByPhase,
    recordCount: loaded.export.records.length,
    canonicalToolIdsCovered: TRACK_B_TOOL_IDS.every((toolId) => loaded.export?.records.some((record) => record.toolIds.includes(toolId))),
    productionAffected: false,
    productionUnaffected: loaded.export.productionAffected === false,
    remoteSqlRun: loaded.export.remoteSqlRun,
    migrationDeployment: loaded.export.migrationDeployment,
    forbiddenPayloadClasses: loaded.export.forbiddenPayloadClasses,
    safeMetadataOnly: blockers.length === 0,
    blockers,
  }
}

function buildRegistrySchemaCheck() {
  const migrationExists = existsSync(REGISTRY_MIGRATION_PATH)
  const registryModuleExists = existsSync(REGISTRY_MODULE_PATH)
  const migrationText = migrationExists ? readFileSync(REGISTRY_MIGRATION_PATH, 'utf8') : ''
  const missingTables = EXPECTED_REGISTRY_TABLES.filter((table) => !migrationText.includes(`public.${table}`))
  const blockers: SupabaseTrackBBackfillBlocker[] = migrationExists && missingTables.length === 0
    ? []
    : ['supabase_milestone_registry_schema_missing']
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    schemaEvidenceMode: 'committed_registry_schema_required_before_staging_write',
    migrationPath: REGISTRY_MIGRATION_PATH,
    migrationExists,
    registryModulePath: REGISTRY_MODULE_PATH,
    registryModuleExists,
    requiredTables: EXPECTED_REGISTRY_TABLES,
    missingTables: migrationExists ? missingTables : EXPECTED_REGISTRY_TABLES,
    schemaMutationPerformed: false,
    migrationDeploymentPerformed: false,
    blockers,
  }
}

function buildRegistryRlsCheck(schemaCheck: Record<string, unknown>) {
  if (schemaCheck.status !== 'passed') {
    return {
      phase: SUPABASE_TRACKB_BACKFILL_PHASE,
      runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
      status: 'skipped',
      reason: 'schema_check_blocked_before_rls_evaluation',
      rlsSafe: false,
      blockers: [],
    }
  }
  const migrationText = readFileSync(REGISTRY_MIGRATION_PATH, 'utf8')
  const requiredSnippets = [
    'enable row level security',
    'revoke all on table public.activation_phase_runs from public, anon, authenticated',
    'grant select, insert, update, delete on table public.activation_phase_runs to service_role',
    'check (production_allowed = false)',
    'check (external_beta_allowed = false)',
    'check (broad_media_allowed = false)',
  ]
  const missingSnippets = requiredSnippets.filter((snippet) => !migrationText.toLowerCase().includes(snippet.toLowerCase()))
  const blockers: SupabaseTrackBBackfillBlocker[] = missingSnippets.length === 0
    ? []
    : ['supabase_milestone_registry_rls_missing_or_unsafe']
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    rlsSafe: blockers.length === 0,
    requiredSnippets,
    missingSnippets,
    publicAccessGranted: false,
    frontendSecretAccess: false,
    blockers,
  }
}

function buildStagingPreflightReport(schemaCheck: Record<string, unknown>, rlsCheck: Record<string, unknown>) {
  const credentials = getStagingCredentialsStatus()
  const blockers: SupabaseTrackBBackfillBlocker[] = []
  if (schemaCheck.status === 'passed' && rlsCheck.status === 'passed' && (!credentials.urlProvided || !credentials.serviceRoleKeyProvided || !credentials.targetConfirmed)) {
    blockers.push('staging_supabase_credentials_unavailable')
  }
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    stagingOnly: true,
    productionTargetRejected: true,
    stagingTargetReference: credentials.targetReferenceStatus,
    credentialNamesAllowed: credentials.allowedCredentialNames,
    credentialPayloadsPrinted: false,
    urlProvided: credentials.urlProvided,
    serviceRoleKeyProvided: credentials.serviceRoleKeyProvided,
    targetConfirmed: credentials.targetConfirmed,
    remoteReadPerformed: false,
    remoteSqlRun: false,
    migrationDeployment: false,
    schemaMutation: false,
    blockers,
  }
}

function buildDiffReport(exportValidationReport: Record<string, unknown>, blockers: SupabaseTrackBBackfillBlocker[]) {
  const loaded = loadTrackBExport()
  const records = loaded.export?.records ?? []
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    diffMode: blockers.length === 0 ? 'planned_idempotent_upsert_rows' : 'blocked_before_staging_diff',
    sourceExportValidated: exportValidationReport.status === 'passed',
    plannedTable: 'public.activation_phase_runs',
    plannedRows: records.length,
    plannedUniqueKey: ['phase_id', 'run_id'],
    remoteStagingReadPerformed: false,
    remoteSqlRun: false,
    rowsToInsertOrUpdate: blockers.length === 0 ? records.map((record) => toActivationRunRow(record)) : [],
    blockers,
  }
}

function buildWriteReport(blockers: SupabaseTrackBBackfillBlocker[]) {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'skipped' : 'blocked',
    writePerformed: false,
    reason: blockers.length === 0 ? 'write_requires_execute_command_and_current_shell_confirmations' : 'blocked_before_staging_write',
    stagingOnly: true,
    productionAffected: false,
    remoteSqlRun: false,
    migrationDeployment: false,
    schemaMutation: false,
    rowsWritten: 0,
    blockers,
  }
}

function buildVerificationReport(blockers: SupabaseTrackBBackfillBlocker[], writeReport: Record<string, unknown>) {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: writeReport.status === 'passed' ? 'passed' : blockers.length > 0 ? 'blocked' : 'skipped',
    verificationPerformed: writeReport.status === 'passed',
    reason: writeReport.status === 'passed' ? 'written_rows_verified_by_phase_id_and_run_id' : blockers.length > 0 ? 'blocked_before_verification' : 'verification_requires_successful_execute_write',
    rowsVerified: 0,
    remoteSqlRun: false,
    productionAffected: false,
    blockers,
  }
}

function buildAuditReport(
  exportValidationReport: Record<string, unknown>,
  diffReport: Record<string, unknown>,
  writeReport: Record<string, unknown>,
  verificationReport: Record<string, unknown>,
  blockers: SupabaseTrackBBackfillBlocker[],
) {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: blockers.length === 0 && writeReport.status === 'passed' && verificationReport.status === 'passed'
      ? 'passed'
      : blockers.length > 0
        ? 'blocked'
        : 'planned',
    sourcePr196: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/196',
    exportValidationStatus: exportValidationReport.status,
    diffStatus: diffReport.status,
    writeStatus: writeReport.status,
    verificationStatus: verificationReport.status,
    credentialPayloadsPrinted: false,
    secretsCommitted: false,
    productionAffected: false,
    remoteSqlRun: false,
    productionSqlRun: false,
    migrationDeployment: false,
    schemaMutation: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    toolExecution: 'not_run',
    mediaProcessing: 'not_run',
    publicOutput: 'blocked',
    betaProductionUnlock: 'blocked',
    trackA: 'not_touched',
    blockers,
  }
}

function buildRollbackPlan(blockers: SupabaseTrackBBackfillBlocker[]) {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: 'rollback_plan_documented',
    rollbackRequiredForCurrentReports: false,
    rollbackRequiredIfFutureWriteRuns: true,
    rollbackScope: 'staging_activation_phase_runs_rows_written_by_phase_id_and_run_id_from_phase44p_export',
    cleanupPolicy: [
      'delete or revert only rows whose phase_id/run_id match this backfill run',
      'do not drop tables',
      'do not mutate production',
      'do not remove unrelated activation registry rows',
      'record redacted cleanup evidence before promotion review',
    ],
    blockers,
  }
}

function buildBlockerReport(blockers: SupabaseTrackBBackfillBlocker[]) {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    expectedDefaultBlockerOnPr196Base: 'supabase_milestone_registry_schema_missing',
    stillBlockedScopes: [
      'production_supabase_write',
      'production_sql',
      'remote_schema_mutation',
      'migration_deployment',
      'service_role_secret_printing',
      'provider_calls',
      'route_execution',
      'worker_execution',
      'tool_execution',
      'media_processing',
      'public_artifacts',
      'beta_unlock',
      'production_unlock',
      'track_a',
    ],
  }
}

function buildReadinessReport(
  exportValidationReport: Record<string, unknown>,
  writeReport: Record<string, unknown>,
  verificationReport: Record<string, unknown>,
  blockers: SupabaseTrackBBackfillBlocker[],
) {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: blockers.length === 0 && writeReport.status === 'passed' && verificationReport.status === 'passed'
      ? 'passed'
      : blockers.length > 0
        ? 'blocked'
        : 'planned',
    exportValidation: exportValidationReport.status,
    stagingExecutionAllowed: blockers.length === 0,
    stagingWriteStatus: writeReport.status,
    stagingVerificationStatus: verificationReport.status,
    productionAffected: false,
    remoteSqlRun: false,
    migrationDeployment: false,
    schemaMutation: false,
    productBetaUnlocked: false,
    productionUnlocked: false,
    nextRecommendedPhase: blockers.length === 0 && writeReport.status === 'passed'
      ? 'Supabase Track B milestone production promotion approval packet after human review of staging evidence.'
      : 'Resolve the exact blocker before any staging write or production promotion approval.',
    blockers,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_TRACKB_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
    status: 'committed_safe_metadata_only',
    privateUploadRequired: false,
    privateUploadPerformed: false,
    privatePayloadsCommitted: false,
    secretPayloadsCommitted: false,
    reportDir: SUPABASE_TRACKB_BACKFILL_REPORT_DIR,
    expectedReports: SUPABASE_TRACKB_BACKFILL_EXPECTED_REPORTS,
  }
}

function collectBlockers(...reports: Record<string, unknown>[]): SupabaseTrackBBackfillBlocker[] {
  const blockers = new Set<SupabaseTrackBBackfillBlocker>()
  for (const report of reports) {
    for (const blocker of (report.blockers ?? []) as SupabaseTrackBBackfillBlocker[]) blockers.add(blocker)
  }
  return [...blockers]
}

function validateExecutionConfirmations(input: { staging: boolean }): SupabaseTrackBBackfillBlocker[] {
  const missing = SUPABASE_TRACKB_BACKFILL_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const forbidden = SUPABASE_TRACKB_BACKFILL_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const blockers: SupabaseTrackBBackfillBlocker[] = []
  if (!input.staging) blockers.push('missing_required_confirmation')
  if (missing.length > 0) blockers.push('missing_required_confirmation')
  if (forbidden.length > 0) blockers.push('forbidden_confirmation_set')
  return [...new Set(blockers)]
}

function loadTrackBExport(): {
  export?: TrackBSupabaseMilestoneExport
  schema?: Record<string, unknown>
  blockers: SupabaseTrackBBackfillBlocker[]
} {
  const blockers: SupabaseTrackBBackfillBlocker[] = []
  if (!existsSync(TRACK_B_SUPABASE_EXPORT_PATH)) blockers.push('track_b_supabase_export_missing')
  if (!existsSync(TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH)) blockers.push('track_b_supabase_export_schema_missing')
  if (blockers.length > 0) return { blockers }
  const exportJson = JSON.parse(readFileSync(TRACK_B_SUPABASE_EXPORT_PATH, 'utf8')) as TrackBSupabaseMilestoneExport
  const schemaJson = JSON.parse(readFileSync(TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH, 'utf8')) as Record<string, unknown>
  return { export: exportJson, schema: schemaJson, blockers }
}

function validateExport(exportJson: TrackBSupabaseMilestoneExport): SupabaseTrackBBackfillBlocker[] {
  const failures: string[] = []
  if (exportJson.exportVersion !== TRACK_B_SUPABASE_EXPORT_VERSION) failures.push('unexpected_export_version')
  if (exportJson.generatedByPhase !== '44P') failures.push('unexpected_generated_phase')
  if (exportJson.supabaseWritePerformed !== false) failures.push('source_export_already_wrote_supabase')
  if (exportJson.remoteSqlRun !== false) failures.push('source_export_remote_sql_run')
  if (exportJson.migrationDeployment !== false) failures.push('source_export_migration_deployment')
  if (!Array.isArray(exportJson.records) || exportJson.records.length === 0) failures.push('missing_records')
  if (!TRACK_B_TOOL_IDS.every((toolId) => exportJson.records.some((record) => record.toolIds.includes(toolId)))) failures.push('missing_canonical_tool_id')

  exportJson.records.forEach((record, index) => {
    const pathPrefix = `records[${index}]`
    const allowedKeys = new Set([
      'phaseId',
      'track',
      'family',
      'toolIds',
      'milestoneName',
      'status',
      'readinessStatus',
      'betaStatus',
      'branch',
      'prNumber',
      'prUrl',
      'commitSha',
      'artifactPrefix',
      'artifactObjectCount',
      'allowedScope',
      'blockedScopes',
      'nextPhase',
      'createdFromReportPath',
      'exportVersion',
    ])
    for (const key of Object.keys(record)) {
      if (!allowedKeys.has(key)) failures.push(`${pathPrefix}.unexpected_key.${key}`)
      if ((FORBIDDEN_EXPORT_KEYS as readonly string[]).includes(key)) failures.push(`${pathPrefix}.forbidden_key.${key}`)
    }
    if (record.track !== 'track_b') failures.push(`${pathPrefix}.track_not_track_b`)
    if (record.exportVersion !== TRACK_B_SUPABASE_EXPORT_VERSION) failures.push(`${pathPrefix}.bad_export_version`)
    if (record.prUrl && !/^https:\/\/github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/[0-9]+$/.test(record.prUrl)) failures.push(`${pathPrefix}.unexpected_pr_url`)
    if (record.artifactPrefix && !/^(docs\/|gs:\/\/reeditpro-staging-reeditpro-qa-artifacts\/activation\/)/.test(record.artifactPrefix)) failures.push(`${pathPrefix}.unsafe_artifact_prefix`)
    if (!record.createdFromReportPath.startsWith('docs/')) failures.push(`${pathPrefix}.unsafe_report_path`)
    collectForbiddenValueFailures(record, pathPrefix).forEach((failure) => failures.push(failure))
  })

  return failures.length === 0 ? [] : ['track_b_supabase_export_validation_failed']
}

function collectForbiddenValueFailures(value: unknown, pathPrefix: string): string[] {
  const failures: string[] = []
  if (typeof value === 'string') {
    for (const pattern of FORBIDDEN_VALUE_PATTERNS) {
      if (pattern.test(value)) failures.push(`${pathPrefix}.forbidden_value`)
    }
    return failures
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => failures.push(...collectForbiddenValueFailures(item, `${pathPrefix}[${index}]`)))
    return failures
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if ((FORBIDDEN_EXPORT_KEYS as readonly string[]).includes(key)) failures.push(`${pathPrefix}.${key}.forbidden_key`)
      failures.push(...collectForbiddenValueFailures(child, `${pathPrefix}.${key}`))
    }
  }
  return failures
}

function getStagingCredentialsStatus() {
  const stagingUrl = process.env.REEDITPRO_STAGING_SUPABASE_URL
  const stagingKey = process.env.REEDITPRO_STAGING_SUPABASE_SERVICE_ROLE_KEY
  const fallbackUrl = process.env.REEDITPRO_SUPABASE_TARGET_ENV === 'staging' ? process.env.SUPABASE_URL : undefined
  const fallbackKey = process.env.REEDITPRO_SUPABASE_TARGET_ENV === 'staging' ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined
  const url = stagingUrl || fallbackUrl
  const serviceRoleKey = stagingKey || fallbackKey
  const targetConfirmed = process.env.REEDITPRO_SUPABASE_TARGET_ENV === 'staging' || process.env.REEDITPRO_STAGING_SUPABASE_TARGET_CONFIRMED === 'true'
  return {
    url,
    serviceRoleKey,
    urlProvided: Boolean(url),
    serviceRoleKeyProvided: Boolean(serviceRoleKey),
    targetConfirmed,
    targetReferenceStatus: process.env.REEDITPRO_STAGING_SUPABASE_TARGET_REFERENCE ? 'redacted_reference_provided' : 'redacted_required_at_execution_time',
    allowedCredentialNames: [
      'REEDITPRO_STAGING_SUPABASE_URL',
      'REEDITPRO_STAGING_SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_URL only when REEDITPRO_SUPABASE_TARGET_ENV=staging',
      'SUPABASE_SERVICE_ROLE_KEY only when REEDITPRO_SUPABASE_TARGET_ENV=staging',
    ],
  }
}

function toActivationRunRow(record: TrackBSupabaseMilestoneBackfillRecord) {
  return {
    phase_id: record.phaseId,
    run_id: `${record.phaseId}-${record.exportVersion}`,
    run_status: mapActivationStatus(record.status),
    track: record.track,
    family: record.family,
    branch: record.branch,
    pr_number: record.prNumber,
    pr_url: record.prUrl,
    commit_sha: record.commitSha,
    source_report_path: record.createdFromReportPath,
    completed_at: null,
    result_json: {
      milestoneName: record.milestoneName,
      readinessStatus: record.readinessStatus,
      family: record.family,
      toolIds: record.toolIds,
      betaStatus: record.betaStatus,
      allowedScope: record.allowedScope,
      nextPhase: record.nextPhase,
      createdFromReportPath: record.createdFromReportPath,
      exportVersion: record.exportVersion,
      artifactPrefix: record.artifactPrefix,
      artifactObjectCount: record.artifactObjectCount ?? 0,
    },
    blocker_codes: record.blockedScopes,
    production_allowed: false,
    external_beta_allowed: false,
    paid_production_allowed: false,
    broad_media_allowed: false,
    public_output_allowed: false,
    provider_calls_allowed: false,
    warnings: [
      'staging metadata backfill only',
      'production, beta, route execution, workers, tools, media, providers, and Track A remain blocked',
    ],
  }
}

function mapActivationStatus(status: string): 'planned' | 'passed' | 'blocked' | 'warning' | 'skipped' | 'approved' {
  if (status.includes('blocked') || status.includes('excluded')) return 'blocked'
  if (status.includes('phase_complete') || status.includes('internally_beta_ready_candidate')) return 'passed'
  if (status.includes('approved')) return 'approved'
  return 'warning'
}

async function writeStagingRows(url: string, serviceRoleKey: string, records: TrackBSupabaseMilestoneBackfillRecord[]) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const rows = records.map((record) => toActivationRunRow(record))
    const { error, data } = await client
      .from('activation_phase_runs')
      .upsert(rows, { onConflict: 'phase_id,run_id' })
      .select('phase_id,run_id,run_status')
    if (error) {
      return {
        phase: SUPABASE_TRACKB_BACKFILL_PHASE,
        runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
        status: 'blocked',
        writePerformed: false,
        rowsAttempted: rows.length,
        rowsWritten: 0,
        errorCode: error.code,
        errorMessageRedacted: error.message ? 'redacted_error_message_present' : 'none',
        blockers: ['staging_write_failed'],
      }
    }
    return {
      phase: SUPABASE_TRACKB_BACKFILL_PHASE,
      runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
      status: 'passed',
      writePerformed: true,
      stagingOnly: true,
      productionAffected: false,
      remoteSqlRun: false,
      migrationDeployment: false,
      rowsAttempted: rows.length,
      rowsWritten: Array.isArray(data) ? data.length : rows.length,
      returnedRowsRedacted: Array.isArray(data) ? data.length : 0,
      blockers: [],
    }
  } catch {
    return {
      phase: SUPABASE_TRACKB_BACKFILL_PHASE,
      runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
      status: 'blocked',
      writePerformed: false,
      rowsWritten: 0,
      errorMessageRedacted: 'redacted_exception_present',
      blockers: ['staging_write_failed'],
    }
  }
}

async function verifyStagingRows(url: string, serviceRoleKey: string, records: TrackBSupabaseMilestoneBackfillRecord[]) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const phaseIds = records.map((record) => record.phaseId)
    const { data, error } = await client
      .from('activation_phase_runs')
      .select('phase_id,run_id,run_status')
      .in('phase_id', phaseIds)
    if (error) {
      return {
        phase: SUPABASE_TRACKB_BACKFILL_PHASE,
        runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
        status: 'blocked',
        verificationPerformed: false,
        errorCode: error.code,
        errorMessageRedacted: error.message ? 'redacted_error_message_present' : 'none',
        blockers: ['staging_verification_failed'],
      }
    }
    const verifiedRows = Array.isArray(data) ? data.length : 0
    return {
      phase: SUPABASE_TRACKB_BACKFILL_PHASE,
      runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
      status: verifiedRows >= records.length ? 'passed' : 'blocked',
      verificationPerformed: true,
      rowsExpected: records.length,
      rowsVerified: verifiedRows,
      returnedRowsRedacted: verifiedRows,
      blockers: verifiedRows >= records.length ? [] : ['staging_verification_failed'],
    }
  } catch {
    return {
      phase: SUPABASE_TRACKB_BACKFILL_PHASE,
      runId: SUPABASE_TRACKB_BACKFILL_RUN_ID,
      status: 'blocked',
      verificationPerformed: false,
      errorMessageRedacted: 'redacted_exception_present',
      blockers: ['staging_verification_failed'],
    }
  }
}

function renderAuditMarkdown(reports: SupabaseTrackBBackfillReports): string {
  const blockerReport = reports.blockerReport as { activeBlockers?: string[] }
  const exportReport = reports.exportValidationReport as { recordCount?: number; status?: string }
  const writeReport = reports.writeReport as { status?: string; writePerformed?: boolean; rowsWritten?: number }
  return `# Supabase Track B Backfill Audit

Run id: \`${SUPABASE_TRACKB_BACKFILL_RUN_ID}\`

This phase consumes the Phase 44P safe Track B milestone export and may write staging metadata only after explicit gates. It does not run production SQL, deploy migrations, mutate schema, execute routes/workers/tools, process media, call providers, unlock beta/production, or touch Track A.

- Export validation: ${exportReport.status}
- Export records: ${exportReport.recordCount ?? 0}
- Write status: ${writeReport.status}
- Write performed: ${writeReport.writePerformed ? 'yes' : 'no'}
- Rows written: ${writeReport.rowsWritten ?? 0}
- Active blockers: ${(blockerReport.activeBlockers ?? []).join(', ') || 'none'}
`
}
