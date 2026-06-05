import { execFile } from 'node:child_process'
import {
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  buildSupabaseTrackBBackfillReports,
} from '../supabase-trackb-backfill'
import {
  SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
  SUPABASE_MILESTONE_REGISTRY_SCHEMA_BASE_BRANCH,
  SUPABASE_MILESTONE_REGISTRY_TABLES,
  buildSupabaseMilestoneRegistrySchemaReports,
} from './index'

export const SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE = 'supabase-milestone-registry-staging-deploy-verify'
export const SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID = 'supabase-milestone-registry-staging-deploy-verify-20260605'
export const SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_BRANCH = 'codex/rp-foundation-supabase-milestone-registry-staging-deploy-verify'
export const SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR = 'docs/activation-supabase-milestone-registry-staging-deploy-reports'
export const SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_DOCS_SOURCE = 'https://supabase.com/docs/reference/cli/supabase-db-push'
export const SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_MIGRATION_ID = '202606050001'

export const SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
] as const

export const SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
] as const

export const SUPABASE_MILESTONE_REGISTRY_STAGING_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACT_OUTPUT',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
] as const

export const SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_EXPECTED_REPORTS = [
  'staging_deploy_plan.json',
  'staging_credential_preflight_report.json',
  'staging_schema_deploy_report.json',
  'staging_schema_verification_report.json',
  'staging_rls_verification_report.json',
  'trackb_backfill_preflight_after_schema_deploy.json',
  'trackb_backfill_diff_after_schema_deploy.json',
  'staging_deploy_blocker_report.json',
  'staging_deploy_readiness_report.json',
  'staging_deploy_private_artifact_manifest.json',
] as const

type StagingDeployStatus = 'passed' | 'blocked' | 'skipped' | 'planned'

type StagingDeployBlocker =
  | 'local_migration_or_rls_evidence_blocked'
  | 'staging_supabase_credentials_unavailable'
  | 'staging_target_not_confirmed'
  | 'staging_supabase_cli_unavailable'
  | 'staging_schema_deploy_not_confirmed'
  | 'staging_schema_verify_not_confirmed'
  | 'staging_schema_deploy_not_run'
  | 'staging_schema_verification_not_run'
  | 'staging_schema_dry_run_failed'
  | 'staging_schema_deploy_failed'
  | 'staging_schema_verification_failed'
  | 'staging_rls_verification_failed'
  | 'forbidden_confirmation_set'

interface CliCommandResult {
  status: StagingDeployStatus
  exitCode: number | null
  signal?: string | null
  command: string
  args: string[]
  stdoutSummary: OutputSummary
  stderrSummary: OutputSummary
  stdoutContainsExpectedMigrationId?: boolean
  errorCategory?: string
}

interface OutputSummary {
  byteLength: number
  lineCount: number
  secretPatternDetected: boolean
}

interface StagingCredentialPreflight {
  phase: string
  runId: string
  status: StagingDeployStatus
  stagingOnly: true
  dbUrlProvided: boolean
  accessTokenProvided: boolean
  serviceRoleKeyProvided: boolean
  targetConfirmed: boolean
  targetReferenceStatus: string
  credentialPayloadsPrinted: false
  allowedCredentialNames: string[]
  blockers: StagingDeployBlocker[]
}

interface SupabaseCliPreflight {
  phase: string
  runId: string
  status: StagingDeployStatus
  executableSource: string
  executableLabel: string
  autoInstallAttempted: false
  npxDownloadAttempted: false
  versionStatus: StagingDeployStatus
  version?: string
  commandResult: CliCommandResult
  blockers: StagingDeployBlocker[]
}

interface StagingDeployReports {
  plan: Record<string, unknown>
  credentialPreflight: StagingCredentialPreflight
  cliPreflight: SupabaseCliPreflight
  schemaDeployReport: Record<string, unknown>
  schemaVerificationReport: Record<string, unknown>
  rlsVerificationReport: Record<string, unknown>
  trackBBackfillPreflightAfterSchema: Record<string, unknown>
  trackBBackfillDiffAfterSchema: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}

const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key/i,
  /anon[_-]?key/i,
  /access[_-]?token/i,
  /bearer\s+[a-z0-9._-]+/i,
  /BEGIN PRIVATE KEY/i,
  /x-goog-signature=/i,
] as const

export function getSupabaseMilestoneRegistryStagingDeployPlan() {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    branch: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_BRANCH,
    baseBranch: SUPABASE_MILESTONE_REGISTRY_SCHEMA_BASE_BRANCH,
    sourcePr200: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/200',
    sourcePr198: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/198',
    mode: 'staging_schema_deploy_verify_only',
    reportDir: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR,
    expectedReports: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_EXPECTED_REPORTS,
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_MIGRATION_ID,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    supabaseCliDocs: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_DOCS_SOURCE,
    deployConfirmations: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_CONFIRMATIONS,
    verifyConfirmations: SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY_CONFIRMATIONS,
    forbiddenConfirmations: SUPABASE_MILESTONE_REGISTRY_STAGING_FORBIDDEN_CONFIRMATIONS,
    deploymentWorkflow: 'supabase db push --db-url with --dry-run first',
    verificationWorkflow: 'supabase migration list --db-url plus committed migration/RLS evidence',
    tempDeployContextPolicy: {
      containsOnlyMigration: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
      seedFilesIncluded: false,
      trackBExportIncluded: false,
      trackBBackfillRowsIncluded: false,
      unrelatedMigrationsIncluded: false,
      directSqlEditorCommands: false,
    },
    noProductionSupabase: true,
    noTrackBBackfillWrites: true,
    noMilestoneDataInserts: true,
    noProviderCalls: true,
    noRouteWorkerToolExecution: true,
    noMediaProcessing: true,
    noBetaProductionUnlock: true,
    noTrackA: true,
    nextRecommendedPhase: 'Rerun PR #198 guarded Track B staging backfill after staging schema/RLS verification passes.',
  }
}

export async function buildSupabaseMilestoneRegistryStagingDeployReports(overrides: {
  schemaDeployReport?: Record<string, unknown>
  schemaVerificationReport?: Record<string, unknown>
  rlsVerificationReport?: Record<string, unknown>
} = {}): Promise<StagingDeployReports> {
  const credentialPreflight = buildCredentialPreflight()
  const cliPreflight = await resolveSupabaseCli()
  const localEvidence = buildLocalEvidenceReport()
  const baseBlockers = collectUniqueBlockers(
    credentialPreflight.blockers,
    cliPreflight.blockers,
    localEvidence.blockers,
    getForbiddenConfirmationBlockers(),
  )
  const schemaDeployReport = overrides.schemaDeployReport ?? buildDefaultSchemaDeployReport(baseBlockers)
  const schemaVerificationReport = overrides.schemaVerificationReport ?? buildDefaultSchemaVerificationReport(baseBlockers)
  const rlsVerificationReport = overrides.rlsVerificationReport ?? buildDefaultRlsVerificationReport(schemaVerificationReport, baseBlockers)
  const backfillReports = buildSupabaseTrackBBackfillReports()
  const blockers = collectUniqueBlockers(
    baseBlockers,
    extractBlockers(schemaDeployReport),
    extractBlockers(schemaVerificationReport),
    extractBlockers(rlsVerificationReport),
  )
  return {
    plan: getSupabaseMilestoneRegistryStagingDeployPlan(),
    credentialPreflight,
    cliPreflight,
    schemaDeployReport,
    schemaVerificationReport,
    rlsVerificationReport,
    trackBBackfillPreflightAfterSchema: backfillReports.stagingSupabaseBackfillPreflightReport,
    trackBBackfillDiffAfterSchema: backfillReports.diffReport,
    blockerReport: buildBlockerReport(blockers),
    readinessReport: buildReadinessReport(schemaDeployReport, schemaVerificationReport, rlsVerificationReport, backfillReports, blockers),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeSupabaseMilestoneRegistryStagingDeployArtifacts(
  reports: StagingDeployReports,
  reportDir = SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_deploy_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_credential_preflight_report.json'), reports.credentialPreflight)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_schema_deploy_report.json'), reports.schemaDeployReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_schema_verification_report.json'), reports.schemaVerificationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_rls_verification_report.json'), reports.rlsVerificationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_preflight_after_schema_deploy.json'), reports.trackBBackfillPreflightAfterSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_diff_after_schema_deploy.json'), reports.trackBBackfillDiffAfterSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_deploy_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_deploy_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_deploy_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'staging_deploy_readiness_report.md'), renderStagingDeployMarkdown(reports))
}

export async function readSupabaseMilestoneRegistryStagingDeploySummary() {
  const reports = await buildSupabaseMilestoneRegistryStagingDeployReports()
  const readiness = reports.readinessReport as { status?: string; stagingExecutionAllowed?: boolean; nextRecommendedPhase?: string }
  const blockers = reports.blockerReport as { activeBlockers?: string[] }
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: readiness.status,
    stagingExecutionAllowed: readiness.stagingExecutionAllowed,
    deployPerformed: reports.schemaDeployReport.deployPerformed === true,
    verificationPerformed: reports.schemaVerificationReport.verificationPerformed === true,
    backfillRowsWritten: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    trackA: 'not_touched',
    activeBlockers: blockers.activeBlockers,
    nextRecommendedPhase: readiness.nextRecommendedPhase,
  }
}

export async function executeSupabaseMilestoneRegistryStagingDeploy(input: {
  keepTemp: boolean
}): Promise<{ reports: StagingDeployReports; exitCode: number }> {
  const credentialPreflight = buildCredentialPreflight()
  const cliPreflight = await resolveSupabaseCli()
  const localEvidence = buildLocalEvidenceReport()
  const confirmationBlockers = getMissingDeployConfirmationBlockers()
  const blockers = collectUniqueBlockers(
    credentialPreflight.blockers,
    cliPreflight.blockers,
    localEvidence.blockers,
    getForbiddenConfirmationBlockers(),
    confirmationBlockers,
  )
  if (blockers.length > 0 || !credentialPreflight.dbUrlProvided) {
    const reports = await buildSupabaseMilestoneRegistryStagingDeployReports({
      schemaDeployReport: {
        phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
        runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
        status: 'blocked',
        deployPerformed: false,
        dryRunPerformed: false,
        tempDeployContextCreated: false,
        deploymentWorkflow: 'supabase_db_push_db_url_dry_run_then_apply',
        credentialPayloadsPrinted: false,
        seedFilesIncluded: false,
        trackBRowsWritten: false,
        productionAffected: false,
        remoteSqlRun: false,
        directManualSqlRun: false,
        blockers,
      },
    })
    await writeSupabaseMilestoneRegistryStagingDeployArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const dbUrl = readStagingDbUrl()
  const tempContext = createTempDeployContext()
  const cliExecutable = cliPreflight.executableSource === 'env_path' ? process.env.REEDITPRO_SUPABASE_CLI_PATH ?? 'supabase' : 'supabase'
  try {
    const dryRun = await runSupabaseCli(cliExecutable, ['db', 'push', '--db-url', dbUrl, '--dry-run'], tempContext.root)
    if (dryRun.status !== 'passed') {
      const reports = await buildSupabaseMilestoneRegistryStagingDeployReports({
        schemaDeployReport: buildFailedDeployReport('staging_schema_dry_run_failed', dryRun, tempContext, true, false),
      })
      await writeSupabaseMilestoneRegistryStagingDeployArtifacts(reports)
      return { reports, exitCode: 1 }
    }

    const deploy = await runSupabaseCli(cliExecutable, ['db', 'push', '--db-url', dbUrl], tempContext.root)
    if (deploy.status !== 'passed') {
      const reports = await buildSupabaseMilestoneRegistryStagingDeployReports({
        schemaDeployReport: buildFailedDeployReport('staging_schema_deploy_failed', deploy, tempContext, true, true),
      })
      await writeSupabaseMilestoneRegistryStagingDeployArtifacts(reports)
      return { reports, exitCode: 1 }
    }

    const reports = await buildSupabaseMilestoneRegistryStagingDeployReports({
      schemaDeployReport: {
        phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
        runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
        status: 'passed',
        deployPerformed: true,
        dryRunPerformed: true,
        dryRunStatus: dryRun.status,
        deployStatus: deploy.status,
        tempDeployContextCreated: true,
        tempDeployContextRetained: input.keepTemp,
        tempDeployContextPolicy: tempContext.report,
        deploymentWorkflow: 'supabase_db_push_db_url_dry_run_then_apply',
        commandDocs: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_DOCS_SOURCE,
        dryRunCommand: dryRun,
        deployCommand: deploy,
        credentialPayloadsPrinted: false,
        seedFilesIncluded: false,
        trackBRowsWritten: false,
        productionAffected: false,
        remoteSqlRun: false,
        directManualSqlRun: false,
        blockers: [],
      },
      schemaVerificationReport: {
        phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
        runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
        status: 'planned',
        verificationPerformed: false,
        reason: 'staging_verify_command_required_after_deploy',
        requiredConfirmations: SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY_CONFIRMATIONS,
        blockers: ['staging_schema_verification_not_run'],
      },
    })
    await writeSupabaseMilestoneRegistryStagingDeployArtifacts(reports)
    return { reports, exitCode: 0 }
  } finally {
    if (!input.keepTemp) rmSync(tempContext.root, { recursive: true, force: true })
  }
}

export async function executeSupabaseMilestoneRegistryStagingVerify(): Promise<{ reports: StagingDeployReports; exitCode: number }> {
  const credentialPreflight = buildCredentialPreflight()
  const cliPreflight = await resolveSupabaseCli()
  const localEvidence = buildLocalEvidenceReport()
  const blockers = collectUniqueBlockers(
    credentialPreflight.blockers,
    cliPreflight.blockers,
    localEvidence.blockers,
    getForbiddenConfirmationBlockers(),
    getMissingVerifyConfirmationBlockers(),
  )
  if (blockers.length > 0 || !credentialPreflight.dbUrlProvided) {
    const verificationReport = {
      phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
      runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
      status: 'blocked',
      verificationPerformed: false,
      verificationWorkflow: 'supabase_migration_list_db_url_plus_static_migration_rls_evidence',
      credentialPayloadsPrinted: false,
      productionAffected: false,
      remoteSqlRun: false,
      directManualSqlRun: false,
      blockers,
    }
    const reports = await buildSupabaseMilestoneRegistryStagingDeployReports({
      schemaVerificationReport: verificationReport,
      rlsVerificationReport: buildDefaultRlsVerificationReport(verificationReport, blockers),
    })
    await writeSupabaseMilestoneRegistryStagingDeployArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const dbUrl = readStagingDbUrl()
  const cliExecutable = cliPreflight.executableSource === 'env_path' ? process.env.REEDITPRO_SUPABASE_CLI_PATH ?? 'supabase' : 'supabase'
  const migrationList = await runSupabaseCli(cliExecutable, ['migration', 'list', '--db-url', dbUrl], process.cwd())
  const migrationDetected = migrationList.status === 'passed' && migrationOutputIncludesMigrationId(migrationList)
  const verificationBlockers: StagingDeployBlocker[] = migrationDetected ? [] : ['staging_schema_verification_failed']
  const schemaVerificationReport = {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: verificationBlockers.length === 0 ? 'passed' : 'blocked',
    verificationPerformed: migrationList.status === 'passed',
    verificationWorkflow: 'supabase_migration_list_db_url_plus_static_migration_rls_evidence',
    commandDocs: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_DOCS_SOURCE,
    migrationListCommand: migrationList,
    migrationId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_MIGRATION_ID,
    migrationDetected,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    tableEvidenceMode: 'committed_migration_expected_after_verified_migration_history',
    credentialPayloadsPrinted: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    blockers: verificationBlockers,
  }
  const rlsVerificationReport = buildRlsVerificationFromSchemaReport(schemaVerificationReport, localEvidence.blockers)
  const reports = await buildSupabaseMilestoneRegistryStagingDeployReports({
    schemaVerificationReport,
    rlsVerificationReport,
  })
  await writeSupabaseMilestoneRegistryStagingDeployArtifacts(reports)
  return { reports, exitCode: schemaVerificationReport.status === 'passed' && rlsVerificationReport.status === 'passed' ? 0 : 1 }
}

function buildCredentialPreflight(): StagingCredentialPreflight {
  const targetConfirmed = process.env.REEDITPRO_SUPABASE_TARGET_ENV === 'staging' || process.env.REEDITPRO_STAGING_SUPABASE_TARGET_CONFIRMED === 'true'
  const dbUrlProvided = Boolean(readStagingDbUrl({ presenceOnly: true }))
  const accessTokenProvided = Boolean(process.env.SUPABASE_ACCESS_TOKEN || process.env.REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN)
  const serviceRoleKeyProvided = Boolean(process.env.REEDITPRO_STAGING_SUPABASE_SERVICE_ROLE_KEY)
  const blockers: StagingDeployBlocker[] = []
  if (!dbUrlProvided) blockers.push('staging_supabase_credentials_unavailable')
  if (!targetConfirmed) blockers.push('staging_target_not_confirmed')
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    stagingOnly: true,
    dbUrlProvided,
    accessTokenProvided,
    serviceRoleKeyProvided,
    targetConfirmed,
    targetReferenceStatus: process.env.REEDITPRO_STAGING_SUPABASE_TARGET_REFERENCE ? 'redacted_reference_provided' : 'redacted_required_at_execution_time',
    credentialPayloadsPrinted: false,
    allowedCredentialNames: [
      'REEDITPRO_STAGING_SUPABASE_DB_URL',
      'REEDITPRO_SUPABASE_TARGET_ENV=staging or REEDITPRO_STAGING_SUPABASE_TARGET_CONFIRMED=true',
      'REEDITPRO_STAGING_SUPABASE_TARGET_REFERENCE',
      'SUPABASE_ACCESS_TOKEN or REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN (presence only)',
      'REEDITPRO_STAGING_SUPABASE_SERVICE_ROLE_KEY (presence only, not required for db push)',
    ],
    blockers,
  }
}

async function resolveSupabaseCli(): Promise<SupabaseCliPreflight> {
  const configured = process.env.REEDITPRO_SUPABASE_CLI_PATH
  const executable = configured || 'supabase'
  const commandResult = await runSupabaseCli(executable, ['--version'], process.cwd())
  const blockers: StagingDeployBlocker[] = commandResult.status === 'passed' ? [] : ['staging_supabase_cli_unavailable']
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    executableSource: configured ? 'env_path' : 'path',
    executableLabel: configured ? 'REEDITPRO_SUPABASE_CLI_PATH_provided_redacted' : 'supabase_from_path',
    autoInstallAttempted: false,
    npxDownloadAttempted: false,
    versionStatus: commandResult.status,
    version: commandResult.status === 'passed' ? extractVersion(commandResult) : undefined,
    commandResult,
    blockers,
  }
}

function buildLocalEvidenceReport() {
  const reports = buildSupabaseMilestoneRegistrySchemaReports()
  const localBlockers: StagingDeployBlocker[] = []
  if (reports.migrationReport.status !== 'passed' || reports.rlsPolicyReport.status !== 'passed') {
    localBlockers.push('local_migration_or_rls_evidence_blocked')
  }
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: localBlockers.length === 0 ? 'passed' : 'blocked',
    migrationStatus: reports.migrationReport.status,
    rlsPolicyStatus: reports.rlsPolicyReport.status,
    localValidationStatus: reports.localValidationReport.status,
    sourcePr200Reports: 'docs/activation-supabase-milestone-registry-schema-reports',
    blockers: localBlockers,
  }
}

function buildDefaultSchemaDeployReport(baseBlockers: StagingDeployBlocker[]) {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: baseBlockers.length === 0 ? 'skipped' : 'blocked',
    deployPerformed: false,
    dryRunPerformed: false,
    reason: baseBlockers.length === 0
      ? 'staging_deploy_requires_execute_flag_and_current_shell_confirmations'
      : 'blocked_before_staging_deploy',
    deploymentWorkflow: 'supabase_db_push_db_url_dry_run_then_apply',
    commandDocs: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_DOCS_SOURCE,
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    tempDeployContextPolicy: {
      migrationOnly: true,
      seedFilesIncluded: false,
      trackBExportIncluded: false,
      unrelatedMigrationsIncluded: false,
    },
    credentialPayloadsPrinted: false,
    trackBRowsWritten: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    blockers: baseBlockers.length === 0 ? ['staging_schema_deploy_not_run'] : baseBlockers,
  }
}

function buildDefaultSchemaVerificationReport(baseBlockers: StagingDeployBlocker[]) {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: baseBlockers.length === 0 ? 'skipped' : 'blocked',
    verificationPerformed: false,
    reason: baseBlockers.length === 0
      ? 'staging_verify_requires_verify_confirmation_after_deploy'
      : 'blocked_before_staging_verify',
    verificationWorkflow: 'supabase_migration_list_db_url_plus_static_migration_rls_evidence',
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    blockers: baseBlockers.length === 0 ? ['staging_schema_verification_not_run'] : baseBlockers,
  }
}

function buildDefaultRlsVerificationReport(schemaVerificationReport: Record<string, unknown>, baseBlockers: StagingDeployBlocker[]) {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: schemaVerificationReport.status === 'passed' ? 'passed' : baseBlockers.length === 0 ? 'skipped' : 'blocked',
    verificationPerformed: schemaVerificationReport.status === 'passed',
    verificationWorkflow: 'static_pr200_migration_rls_evidence_after_verified_migration_history',
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    rlsExpectedEnabled: SUPABASE_MILESTONE_REGISTRY_TABLES,
    publicAnonAuthenticatedRevokedExpected: true,
    serviceRoleOnlyExpected: true,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: schemaVerificationReport.status === 'passed'
      ? []
      : baseBlockers.length === 0
        ? ['staging_schema_verification_not_run']
        : baseBlockers,
  }
}

function buildRlsVerificationFromSchemaReport(schemaVerificationReport: Record<string, unknown>, localBlockers: StagingDeployBlocker[]) {
  const blockers: StagingDeployBlocker[] = schemaVerificationReport.status === 'passed' && localBlockers.length === 0
    ? []
    : ['staging_rls_verification_failed']
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    verificationPerformed: schemaVerificationReport.status === 'passed',
    verificationWorkflow: 'static_pr200_migration_rls_evidence_after_verified_migration_history',
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    rlsExpectedEnabled: SUPABASE_MILESTONE_REGISTRY_TABLES,
    anonAuthenticatedPublicRevokesExpected: true,
    serviceRoleOnlyGrantExpected: true,
    noPublicReadViewExpected: true,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers,
  }
}

function buildFailedDeployReport(blocker: StagingDeployBlocker, command: CliCommandResult, tempContext: ReturnType<typeof createTempDeployContext>, dryRunPerformed: boolean, deployAttempted: boolean) {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: 'blocked',
    deployPerformed: false,
    dryRunPerformed,
    deployAttempted,
    tempDeployContextCreated: true,
    tempDeployContextPolicy: tempContext.report,
    deploymentWorkflow: 'supabase_db_push_db_url_dry_run_then_apply',
    failedCommand: command,
    credentialPayloadsPrinted: false,
    trackBRowsWritten: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    blockers: [blocker],
  }
}

function buildBlockerReport(blockers: StagingDeployBlocker[]) {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    expectedCurrentEnvironmentBlockers: [
      'staging_supabase_credentials_unavailable',
      'staging_supabase_cli_unavailable',
    ],
    stillBlockedScopes: [
      'track_b_backfill_write',
      'milestone_data_insert',
      'production_supabase',
      'production_sql',
      'manual_remote_sql',
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
  schemaDeployReport: Record<string, unknown>,
  schemaVerificationReport: Record<string, unknown>,
  rlsVerificationReport: Record<string, unknown>,
  backfillReports: ReturnType<typeof buildSupabaseTrackBBackfillReports>,
  blockers: StagingDeployBlocker[],
) {
  const stagingVerified = schemaDeployReport.status === 'passed' && schemaVerificationReport.status === 'passed' && rlsVerificationReport.status === 'passed'
  const backfillSchemaCheck = backfillReports.registrySchemaCheck as { status?: string; blockers?: string[] }
  const backfillRlsCheck = backfillReports.registryRlsCheck as { status?: string; blockers?: string[] }
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: stagingVerified ? 'passed' : 'blocked',
    stagingExecutionAllowed: blockers.length === 0,
    stagingDeployStatus: schemaDeployReport.status,
    stagingVerifyStatus: schemaVerificationReport.status,
    stagingRlsVerifyStatus: rlsVerificationReport.status,
    pr198SchemaCheckStatusAfterSchema: backfillSchemaCheck.status,
    pr198RlsCheckStatusAfterSchema: backfillRlsCheck.status,
    pr198SchemaMissingResolvedByCommittedMigration: !(backfillSchemaCheck.blockers ?? []).includes('supabase_milestone_registry_schema_missing'),
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    trackA: 'not_touched',
    blockers,
    nextRecommendedPhase: stagingVerified
      ? 'Rerun PR #198 guarded Track B staging backfill without setting schema mutation confirmations.'
      : 'Resolve the exact staging credential/CLI/target blockers, then rerun guarded staging schema deploy/verify.',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID,
    status: 'committed_safe_metadata_only',
    reportDir: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR,
    expectedReports: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_EXPECTED_REPORTS,
    privateUploadRequired: false,
    privateUploadPerformed: false,
    secretsCommitted: false,
    credentialPayloadsPrinted: false,
    stagingDataWritten: false,
    productionAffected: false,
  }
}

function createTempDeployContext() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'reeditpro-milestone-registry-staging-deploy-'))
  const migrationDir = path.join(root, 'supabase', 'migrations')
  mkdirSync(migrationDir, { recursive: true })
  const migrationFileName = path.basename(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH)
  copyFileSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH, path.join(migrationDir, migrationFileName))
  return {
    root,
    report: {
      root: 'redacted_temp_directory',
      migrationFileName,
      migrationFilesCopied: [migrationFileName],
      copiedFileCount: 1,
      seedFilesIncluded: false,
      trackBExportIncluded: false,
      trackBBackfillRowsIncluded: false,
      unrelatedMigrationsIncluded: false,
      secretsIncluded: false,
    },
  }
}

function runSupabaseCli(command: string, args: string[], cwd: string): Promise<CliCommandResult> {
  return new Promise((resolve) => {
    try {
      execFile(command, args, {
        cwd,
        shell: false,
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        env: process.env,
      }, (error, stdout, stderr) => {
        const err = error as NodeJS.ErrnoException & { code?: number | string; signal?: string }
        const exitCode = typeof err?.code === 'number' ? err.code : error ? 1 : 0
        const output = `${stdout ?? ''}\n${stderr ?? ''}\n${error?.message ?? ''}`
        resolve({
          status: error ? 'blocked' : 'passed',
          exitCode,
          signal: err?.signal,
          command: path.basename(command),
          args: redactArgs(args),
          stdoutSummary: summarizeOutput(stdout ?? ''),
          stderrSummary: summarizeOutput(stderr ?? ''),
          stdoutContainsExpectedMigrationId: (stdout ?? '').includes(SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_MIGRATION_ID),
          errorCategory: error ? detectErrorCategory(output) : undefined,
        })
      })
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      const output = error instanceof Error ? error.message : String(error)
      resolve({
        status: 'blocked',
        exitCode: typeof err.errno === 'number' ? err.errno : 1,
        signal: undefined,
        command: path.basename(command),
        args: redactArgs(args),
        stdoutSummary: summarizeOutput(''),
        stderrSummary: summarizeOutput(output),
        stdoutContainsExpectedMigrationId: false,
        errorCategory: detectErrorCategory(output),
      })
    }
  })
}

function readStagingDbUrl(options: { presenceOnly?: boolean } = {}) {
  const url = process.env.REEDITPRO_STAGING_SUPABASE_DB_URL
  if (!url) return ''
  if (options.presenceOnly) return 'provided'
  return url
}

function getMissingDeployConfirmationBlockers(): StagingDeployBlocker[] {
  return SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_CONFIRMATIONS.every((name) => process.env[name] === 'true')
    ? []
    : ['staging_schema_deploy_not_confirmed']
}

function getMissingVerifyConfirmationBlockers(): StagingDeployBlocker[] {
  return SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY_CONFIRMATIONS.every((name) => process.env[name] === 'true')
    ? []
    : ['staging_schema_verify_not_confirmed']
}

function getForbiddenConfirmationBlockers(): StagingDeployBlocker[] {
  return SUPABASE_MILESTONE_REGISTRY_STAGING_FORBIDDEN_CONFIRMATIONS.some((name) => process.env[name] === 'true')
    ? ['forbidden_confirmation_set']
    : []
}

function redactArgs(args: string[]) {
  return args.map((arg, index) => args[index - 1] === '--db-url' ? '[REDACTED_STAGING_DB_URL]' : arg)
}

function summarizeOutput(output: string): OutputSummary {
  return {
    byteLength: Buffer.byteLength(output, 'utf8'),
    lineCount: output.length === 0 ? 0 : output.split(/\r?\n/).filter(Boolean).length,
    secretPatternDetected: SECRET_PATTERNS.some((pattern) => pattern.test(output)),
  }
}

function extractVersion(commandResult: CliCommandResult) {
  return commandResult.stdoutSummary.byteLength > 0 ? 'version_output_present_redacted' : 'version_output_unavailable'
}

function detectErrorCategory(output: string) {
  if (/bad cpu type/i.test(output)) return 'bad_cpu_type_in_executable'
  if (/enoent|not found/i.test(output)) return 'executable_not_found'
  if (/permission denied/i.test(output)) return 'permission_denied'
  if (/timed out|timeout/i.test(output)) return 'timeout'
  return 'command_failed'
}

function migrationOutputIncludesMigrationId(commandResult: CliCommandResult) {
  return commandResult.status === 'passed' && commandResult.stdoutContainsExpectedMigrationId === true
}

function extractBlockers(report: Record<string, unknown>): StagingDeployBlocker[] {
  return (report.blockers ?? []) as StagingDeployBlocker[]
}

function collectUniqueBlockers(...blockerGroups: StagingDeployBlocker[][]): StagingDeployBlocker[] {
  return [...new Set(blockerGroups.flat())]
}

function renderStagingDeployMarkdown(reports: StagingDeployReports): string {
  const readiness = reports.readinessReport as { status?: string; blockers?: string[]; nextRecommendedPhase?: string }
  return `# Supabase Milestone Registry Staging Deploy/Verify

Run id: \`${SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_RUN_ID}\`

This follow-up is staging-only and schema-only. It deploys only \`${SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH}\` via the guarded Supabase migration workflow when credentials, CLI, staging target proof, dry-run, and confirmations pass.

- Readiness: ${readiness.status}
- Deploy performed: ${reports.schemaDeployReport.deployPerformed === true ? 'yes' : 'no'}
- Verification performed: ${reports.schemaVerificationReport.verificationPerformed === true ? 'yes' : 'no'}
- Track B backfill rows written: no
- Production affected: no
- Active blockers: ${(readiness.blockers ?? []).join(', ') || 'none'}
- Next: ${readiness.nextRecommendedPhase}
`
}
