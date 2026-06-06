import { execFile } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import { buildSupabaseTrackBBackfillReports } from '../supabase-trackb-backfill'
import {
  SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
  SUPABASE_MILESTONE_REGISTRY_TABLES,
  buildSupabaseMilestoneRegistrySchemaReports,
} from './index'
import {
  SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
  buildApprovedStagingTargetReferenceReport,
} from './milestone-registry-approved-staging-target-reference'
import {
  SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
} from './milestone-registry-supabase-plugin-deploy-plan'
import {
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
  buildSupabasePluginTargetPreflight,
} from './milestone-registry-staging-target-policy'

export const SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE =
  'supabase-staging-deploy-transport-rerun'
export const SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID =
  'supabase-staging-deploy-transport-rerun-20260606'
export const SUPABASE_STAGING_DEPLOY_TRANSPORT_BRANCH =
  'codex/rp-foundation-supabase-staging-deploy-transport-rerun'
export const SUPABASE_STAGING_DEPLOY_TRANSPORT_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-schema-deploy-after-target-reference'
export const SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR =
  'docs/activation-supabase-staging-deploy-transport-reports'
export const SUPABASE_STAGING_DEPLOY_TRANSPORT_PR_TITLE =
  '[foundation] Supabase staging deploy transport rerun'

export const SUPABASE_STAGING_DEPLOY_TRANSPORT_ALLOWED_CONFIRMATIONS = [
  SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED',
] as const

export const SUPABASE_STAGING_DEPLOY_TRANSPORT_REQUIRED_DEPLOY_CONFIRMATIONS = [
  SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
] as const

export const SUPABASE_STAGING_DEPLOY_TRANSPORT_REQUIRED_VERIFY_CONFIRMATIONS = [
  SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
] as const

export const SUPABASE_STAGING_DEPLOY_TRANSPORT_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_SECRET_MANAGER_ACCESS',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACT_OUTPUT',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
] as const

export const SUPABASE_STAGING_DB_URL_SECRET_REFERENCE_NAMES = [
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
] as const

export const SUPABASE_STAGING_DEPLOY_TRANSPORT_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'staging_deploy_transport_preflight_report.json',
  'staging_deploy_transport_strategy_report.json',
  'staging_schema_deploy_transport_report.json',
  'staging_schema_verify_after_transport_report.json',
  'staging_rls_verify_after_transport_report.json',
  'trackb_backfill_preflight_after_transport_schema_deploy.json',
  'trackb_backfill_diff_after_transport_schema_deploy.json',
  'staging_deploy_transport_blocker_report.json',
  'staging_deploy_transport_readiness_report.json',
  'staging_deploy_transport_private_artifact_manifest.json',
  'staging_deploy_transport_readiness_report.md',
] as const

type TransportStatus = 'passed' | 'blocked' | 'skipped' | 'planned'
type TransportStrategy =
  | 'cli_db_push'
  | 'npx_cli_db_push'
  | 'plugin_migration_safe_apply'
  | 'blocked_no_migration_safe_deploy_path'
  | 'blocked_credentials_unavailable'
  | 'blocked_target_not_staging'
  | 'blocked_local_evidence'

type TransportBlocker =
  | 'source_of_truth_ownership_audit_failed'
  | 'approved_staging_target_reference_missing'
  | 'supabase_plugin_staging_target_check_not_confirmed'
  | 'supabase_plugin_target_not_confirmed_as_staging'
  | 'supabase_plugin_project_ref_mismatch'
  | 'blocked_target_not_staging'
  | 'staging_supabase_db_url_secret_reference_missing'
  | 'blocked_credentials_unavailable'
  | 'cli_db_push_unavailable'
  | 'npx_cli_db_push_unavailable'
  | 'npx_cli_not_confirmed'
  | 'blocked_no_migration_safe_deploy_path'
  | 'local_migration_or_rls_evidence_blocked'
  | 'staging_schema_deploy_not_confirmed'
  | 'staging_schema_verify_not_confirmed'
  | 'staging_schema_deploy_not_run'
  | 'staging_schema_verification_not_run'
  | 'staging_schema_dry_run_failed'
  | 'staging_schema_deploy_failed'
  | 'staging_schema_verification_failed'
  | 'staging_rls_verification_failed'
  | 'forbidden_confirmation_set'

interface CommandResult {
  status: TransportStatus
  exitCode: number | null
  signal?: string | null
  command: string
  args: string[]
  cwd: string
  stdoutSummary: OutputSummary
  stderrSummary: OutputSummary
  outputContainsExpectedMigrationId?: boolean
  errorCategory?: string
}

interface OutputSummary {
  byteLength: number
  lineCount: number
  secretPatternDetected: boolean
}

interface TransportReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  preflightReport: Record<string, unknown>
  strategyReport: Record<string, unknown>
  schemaDeployTransportReport: Record<string, unknown>
  schemaVerifyAfterTransportReport: Record<string, unknown>
  rlsVerifyAfterTransportReport: Record<string, unknown>
  trackBBackfillPreflightAfterTransportSchemaDeploy: Record<string, unknown>
  trackBBackfillDiffAfterTransportSchemaDeploy: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}

const ROOT_SOURCE_FILES = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'supabase-schema-planning-bridge.md',
  'database-migration-readiness-checklist.md',
  'supabase-table-specification.md',
  'migration-review-and-rls-hardening.md',
  'rls-hardening-matrix.md',
  'data-privacy-retention-plan.md',
  'supabase-production-test-readiness.md',
  'supabase-local-staging-test-plan.md',
] as const

const DOC_SOURCE_FILES = [
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/future-backend-service-map.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
  'docs/supabase-approved-staging-target-reference.md',
  'docs/supabase-staging-schema-deploy-after-approved-target-reference.md',
] as const

const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key/i,
  /anon[_-]?key/i,
  /access[_-]?token/i,
  /jwt[_-]?secret/i,
  /password/i,
  /BEGIN PRIVATE KEY/i,
  /x-goog-signature=/i,
] as const

export function getSupabaseStagingDeployTransportPlan() {
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    branch: SUPABASE_STAGING_DEPLOY_TRANSPORT_BRANCH,
    baseBranch: SUPABASE_STAGING_DEPLOY_TRANSPORT_BASE_BRANCH,
    prTitle: SUPABASE_STAGING_DEPLOY_TRANSPORT_PR_TITLE,
    sourcePr196: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/196',
    sourcePr198: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/198',
    sourcePr200: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/200',
    sourcePr202: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/202',
    sourcePr206: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/206',
    sourcePr209: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/209',
    sourcePr212: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/212',
    sourcePr216: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/216',
    mode: 'staging_schema_migration_safe_deploy_transport_rerun',
    reportDir: SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_DEPLOY_TRANSPORT_EXPECTED_REPORTS,
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    supabaseCliDocs: 'https://supabase.com/docs/reference/cli/supabase-db-push',
    supabaseMigrationDocs: 'https://supabase.com/docs/guides/deployment/database-migrations',
    supabaseDocsAccessedAt: '2026-06-06',
    deployStrategyOrder: [
      'cli_db_push',
      'npx_cli_db_push',
      'plugin_migration_safe_apply',
      'blocked_no_migration_safe_deploy_path',
    ],
    allowedConfirmations: SUPABASE_STAGING_DEPLOY_TRANSPORT_ALLOWED_CONFIRMATIONS,
    forbiddenConfirmations: SUPABASE_STAGING_DEPLOY_TRANSPORT_FORBIDDEN_CONFIRMATIONS,
    approvedDbUrlSecretReferenceNames: SUPABASE_STAGING_DB_URL_SECRET_REFERENCE_NAMES,
    tempMigrationContextPolicy: {
      containsOnlyMigration: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
      seedFilesIncluded: false,
      trackBExportRowsIncluded: false,
      unrelatedMigrationsIncluded: false,
      secretsIncluded: false,
    },
    noTrackBBackfillWrites: true,
    noProductionSupabase: true,
    noDirectManualSql: true,
    noProviderCalls: true,
    noRouteWorkerToolExecution: true,
    noMediaProcessing: true,
    noBetaProductionUnlock: true,
    noTrackA: true,
  }
}

export async function buildSupabaseStagingDeployTransportReports(overrides: {
  schemaDeployTransportReport?: Record<string, unknown>
  schemaVerifyAfterTransportReport?: Record<string, unknown>
  rlsVerifyAfterTransportReport?: Record<string, unknown>
} = {}): Promise<TransportReports> {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const approvedTargetReferenceReport = buildApprovedStagingTargetReferenceReport()
  const pluginTargetProofReport = buildSupabasePluginTargetPreflight()
  const secretReferenceGuardReport = buildSecretReferenceGuard()
  const cliPreflightReport = await buildCliPreflight()
  const npxPreflightReport = await buildNpxPreflight()
  const localEvidenceReport = buildLocalEvidenceReport()
  const preflightReport = buildTransportPreflightReport({
    approvedTargetReferenceReport,
    pluginTargetProofReport,
    secretReferenceGuardReport,
    cliPreflightReport,
    npxPreflightReport,
    localEvidenceReport,
  })
  const strategyReport = buildStrategyReport(preflightReport)
  const schemaDeployTransportReport =
    overrides.schemaDeployTransportReport ?? buildDefaultSchemaDeployTransportReport(strategyReport)
  const schemaVerifyAfterTransportReport =
    overrides.schemaVerifyAfterTransportReport ?? buildDefaultSchemaVerifyAfterTransportReport(strategyReport)
  const rlsVerifyAfterTransportReport =
    overrides.rlsVerifyAfterTransportReport ??
    buildDefaultRlsVerifyAfterTransportReport(schemaVerifyAfterTransportReport, localEvidenceReport)
  const backfillReports = buildSupabaseTrackBBackfillReports()
  const blockers = collectUniqueBlockers(
    extractBlockers(sourceOfTruthOwnershipAudit),
    extractBlockers(preflightReport),
    extractBlockers(strategyReport),
    extractBlockers(schemaDeployTransportReport),
    extractBlockers(schemaVerifyAfterTransportReport),
    extractBlockers(rlsVerifyAfterTransportReport),
  )
  return {
    sourceOfTruthOwnershipAudit,
    preflightReport,
    strategyReport,
    schemaDeployTransportReport,
    schemaVerifyAfterTransportReport,
    rlsVerifyAfterTransportReport,
    trackBBackfillPreflightAfterTransportSchemaDeploy: wrapBackfillReport(
      backfillReports.stagingSupabaseBackfillPreflightReport,
      'preflight',
    ),
    trackBBackfillDiffAfterTransportSchemaDeploy: wrapBackfillReport(backfillReports.diffReport, 'diff'),
    blockerReport: buildBlockerReport(blockers),
    readinessReport: buildReadinessReport(
      schemaDeployTransportReport,
      schemaVerifyAfterTransportReport,
      rlsVerifyAfterTransportReport,
      backfillReports,
      blockers,
    ),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeSupabaseStagingDeployTransportArtifacts(
  reports: TransportReports,
  reportDir = SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_deploy_transport_preflight_report.json'), reports.preflightReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_deploy_transport_strategy_report.json'), reports.strategyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_schema_deploy_transport_report.json'), reports.schemaDeployTransportReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_schema_verify_after_transport_report.json'), reports.schemaVerifyAfterTransportReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_rls_verify_after_transport_report.json'), reports.rlsVerifyAfterTransportReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_preflight_after_transport_schema_deploy.json'), reports.trackBBackfillPreflightAfterTransportSchemaDeploy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_diff_after_transport_schema_deploy.json'), reports.trackBBackfillDiffAfterTransportSchemaDeploy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_deploy_transport_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_deploy_transport_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'staging_deploy_transport_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'staging_deploy_transport_readiness_report.md'), renderReadinessMarkdown(reports))
}

export async function readSupabaseStagingDeployTransportSummary() {
  const reports = await buildSupabaseStagingDeployTransportReports()
  const readiness = reports.readinessReport as {
    status?: string
    stagingSchemaVerified?: boolean
    nextRecommendedPhase?: string
  }
  const blocker = reports.blockerReport as { activeBlockers?: string[] }
  const strategy = reports.strategyReport as { selectedStrategy?: TransportStrategy }
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: readiness.status,
    selectedStrategy: strategy.selectedStrategy,
    stagingSchemaVerified: readiness.stagingSchemaVerified === true,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directManualSqlRun: false,
    secretsPrintedOrCommitted: false,
    activeBlockers: blocker.activeBlockers ?? [],
    nextRecommendedPhase: readiness.nextRecommendedPhase,
  }
}

export async function executeSupabaseStagingDeployTransportDeploy(input: {
  keepTemp: boolean
}): Promise<{ reports: TransportReports; exitCode: number }> {
  const initialReports = await buildSupabaseStagingDeployTransportReports()
  const strategy = initialReports.strategyReport as {
    status?: TransportStatus
    selectedStrategy?: TransportStrategy
    selectedCommand?: CommandPlan
    blockers?: TransportBlocker[]
  }
  const missingConfirmations = getMissingDeployConfirmationBlockers()
  const blockers = collectUniqueBlockers(
    extractBlockers(initialReports.preflightReport),
    extractBlockers(initialReports.strategyReport),
    missingConfirmations,
    getForbiddenConfirmationBlockers(),
  )
  if (
    blockers.length > 0 ||
    strategy.status !== 'passed' ||
    !strategy.selectedCommand ||
    !['cli_db_push', 'npx_cli_db_push'].includes(strategy.selectedStrategy ?? '')
  ) {
    const reports = await buildSupabaseStagingDeployTransportReports({
      schemaDeployTransportReport: buildBlockedSchemaDeployTransportReport(
        'blocked_before_staging_deploy',
        collectUniqueBlockers(blockers, ['staging_schema_deploy_not_run']),
      ),
    })
    await writeSupabaseStagingDeployTransportArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const dbUrl = readSelectedStagingDbUrl()
  const tempContext = createTempDeployContext()
  try {
    const dryRun = await runTransportCommand(
      strategy.selectedCommand.command,
      [...strategy.selectedCommand.prefixArgs, 'db', 'push', '--db-url', dbUrl, '--dry-run'],
      tempContext.root,
    )
    if (dryRun.status !== 'passed') {
      const reports = await buildSupabaseStagingDeployTransportReports({
        schemaDeployTransportReport: buildFailedSchemaDeployTransportReport(
          'staging_schema_dry_run_failed',
          dryRun,
          tempContext,
          true,
          false,
        ),
      })
      await writeSupabaseStagingDeployTransportArtifacts(reports)
      return { reports, exitCode: 1 }
    }

    const deploy = await runTransportCommand(
      strategy.selectedCommand.command,
      [...strategy.selectedCommand.prefixArgs, 'db', 'push', '--db-url', dbUrl],
      tempContext.root,
    )
    if (deploy.status !== 'passed') {
      const reports = await buildSupabaseStagingDeployTransportReports({
        schemaDeployTransportReport: buildFailedSchemaDeployTransportReport(
          'staging_schema_deploy_failed',
          deploy,
          tempContext,
          true,
          true,
        ),
      })
      await writeSupabaseStagingDeployTransportArtifacts(reports)
      return { reports, exitCode: 1 }
    }

    const reports = await buildSupabaseStagingDeployTransportReports({
      schemaDeployTransportReport: {
        phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
        runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
        status: 'passed',
        selectedStrategy: strategy.selectedStrategy,
        deployPerformed: true,
        dryRunPerformed: true,
        dryRunStatus: dryRun.status,
        deployStatus: deploy.status,
        migrationDeployment: true,
        migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
        migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
        tempDeployContextCreated: true,
        tempDeployContextRetained: input.keepTemp,
        tempDeployContextPolicy: tempContext.report,
        dryRunCommand: dryRun,
        deployCommand: deploy,
        credentialPayloadsPrinted: false,
        secretPayloadsRead: false,
        seedFilesIncluded: false,
        trackBRowsWritten: false,
        productionAffected: false,
        directManualSqlRun: false,
        blockers: [],
      },
      schemaVerifyAfterTransportReport: {
        phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
        runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
        status: 'planned',
        verificationPerformed: false,
        reason: 'staging_verify_command_required_after_transport_deploy',
        blockers: ['staging_schema_verification_not_run'],
      },
    })
    await writeSupabaseStagingDeployTransportArtifacts(reports)
    return { reports, exitCode: 0 }
  } finally {
    if (!input.keepTemp) rmSync(tempContext.root, { recursive: true, force: true })
  }
}

export async function executeSupabaseStagingDeployTransportVerify(): Promise<{ reports: TransportReports; exitCode: number }> {
  const initialReports = await buildSupabaseStagingDeployTransportReports()
  const strategy = initialReports.strategyReport as {
    status?: TransportStatus
    selectedStrategy?: TransportStrategy
    selectedCommand?: CommandPlan
  }
  const missingConfirmations = getMissingVerifyConfirmationBlockers()
  const blockers = collectUniqueBlockers(
    extractBlockers(initialReports.preflightReport),
    extractBlockers(initialReports.strategyReport),
    missingConfirmations,
    getForbiddenConfirmationBlockers(),
  )
  if (
    blockers.length > 0 ||
    strategy.status !== 'passed' ||
    !strategy.selectedCommand ||
    !['cli_db_push', 'npx_cli_db_push'].includes(strategy.selectedStrategy ?? '')
  ) {
    const verificationReport = {
      phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
      runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
      status: 'blocked',
      verificationPerformed: false,
      verificationWorkflow: 'supabase_migration_list_db_url_plus_static_migration_rls_evidence',
      credentialPayloadsPrinted: false,
      secretPayloadsRead: false,
      productionAffected: false,
      directManualSqlRun: false,
      blockers: collectUniqueBlockers(blockers, ['staging_schema_verification_not_run']),
    }
    const reports = await buildSupabaseStagingDeployTransportReports({
      schemaVerifyAfterTransportReport: verificationReport,
      rlsVerifyAfterTransportReport: buildDefaultRlsVerifyAfterTransportReport(
        verificationReport,
        buildLocalEvidenceReport(),
      ),
    })
    await writeSupabaseStagingDeployTransportArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const dbUrl = readSelectedStagingDbUrl()
  const migrationList = await runTransportCommand(
    strategy.selectedCommand.command,
    [...strategy.selectedCommand.prefixArgs, 'migration', 'list', '--db-url', dbUrl],
    process.cwd(),
  )
  const migrationDetected =
    migrationList.status === 'passed' && migrationList.outputContainsExpectedMigrationId === true
  const verificationBlockers: TransportBlocker[] = migrationDetected
    ? []
    : ['staging_schema_verification_failed']
  const verificationReport = {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: verificationBlockers.length === 0 ? 'passed' : 'blocked',
    verificationPerformed: migrationList.status === 'passed',
    verificationWorkflow: 'supabase_migration_list_db_url_plus_static_migration_rls_evidence',
    selectedStrategy: strategy.selectedStrategy,
    migrationListCommand: migrationList,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    migrationDetected,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    directManualSqlRun: false,
    blockers: verificationBlockers,
  }
  const rlsReport = buildRlsVerificationFromSchemaReport(verificationReport, buildLocalEvidenceReport())
  const reports = await buildSupabaseStagingDeployTransportReports({
    schemaVerifyAfterTransportReport: verificationReport,
    rlsVerifyAfterTransportReport: rlsReport,
  })
  await writeSupabaseStagingDeployTransportArtifacts(reports)
  return { reports, exitCode: verificationReport.status === 'passed' && rlsReport.status === 'passed' ? 0 : 1 }
}

function buildSourceOfTruthOwnershipAudit() {
  const rootSources = ROOT_SOURCE_FILES.map((file) => ({ file, exists: existsSync(file), requiredByAgents: true }))
  const docSources = DOC_SOURCE_FILES.map((file) => ({ file, exists: existsSync(file), requiredForThisPhase: true }))
  const crossChatDir = 'docs/cross-chat'
  const migrationExists = existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH)
  const migrationText = migrationExists ? readFileSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH, 'utf8') : ''
  const requiredTablesPresent = SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) =>
    migrationText.includes(`public.${table}`),
  )
  const unsafeMigrationTextDetected = SECRET_PATTERNS.some((pattern) => pattern.test(migrationText))
  const blockers: TransportBlocker[] =
    migrationExists &&
    requiredTablesPresent.length === SUPABASE_MILESTONE_REGISTRY_TABLES.length &&
    !unsafeMigrationTextDetected
      ? []
      : ['source_of_truth_ownership_audit_failed']
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    auditDate: '2026-06-06',
    worktreeRequired: '/private/tmp/reeditpro-supabase-staging-deploy-transport-rerun',
    branch: SUPABASE_STAGING_DEPLOY_TRANSPORT_BRANCH,
    baseBranch: SUPABASE_STAGING_DEPLOY_TRANSPORT_BASE_BRANCH,
    reviewedPrs: [196, 198, 200, 202, 206, 209, 212, 216],
    ownership: {
      thisPhaseOwns: 'migration-safe staging deploy transport proof and rerun reports',
      pr216Owns: 'after-reference deploy wrapper and prior blocker evidence',
      pr212Owns: 'approved non-secret staging target reference',
      pr198Owns: 'future Track B staging backfill, no writes in this phase',
      pr200Owns: 'registry schema/RLS migration',
    },
    rootSources,
    docSources,
    crossChat: {
      path: crossChatDir,
      exists: existsSync(crossChatDir),
      fileCount: existsSync(crossChatDir) ? readdirSync(crossChatDir).length : 0,
    },
    migration: {
      path: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
      exists: migrationExists,
      migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
      requiredTablesExpected: SUPABASE_MILESTONE_REGISTRY_TABLES,
      requiredTablesPresent,
      unsafeMigrationTextDetected,
    },
    packageLockPolicy: 'must_remain_unchanged',
    secretsCommitted: false,
    productionAffected: false,
    trackBBackfillWrites: false,
    directManualSqlRun: false,
    blockers,
  }
}

function buildTransportPreflightReport(input: {
  approvedTargetReferenceReport: Record<string, unknown>
  pluginTargetProofReport: Record<string, unknown>
  secretReferenceGuardReport: Record<string, unknown>
  cliPreflightReport: Record<string, unknown>
  npxPreflightReport: Record<string, unknown>
  localEvidenceReport: Record<string, unknown>
}) {
  const blockers = collectUniqueBlockers(
    extractBlockers(input.approvedTargetReferenceReport),
    extractBlockers(input.pluginTargetProofReport),
    extractBlockers(input.secretReferenceGuardReport),
    extractBlockers(input.localEvidenceReport),
    getForbiddenConfirmationBlockers(),
  )
  const target = input.pluginTargetProofReport as { stagingTargetConfirmed?: boolean }
  if (target.stagingTargetConfirmed !== true && !blockers.includes('blocked_target_not_staging')) {
    blockers.push('blocked_target_not_staging')
  }
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    approvedTargetReferenceReport: input.approvedTargetReferenceReport,
    pluginTargetProofReport: input.pluginTargetProofReport,
    secretReferenceGuardReport: input.secretReferenceGuardReport,
    cliPreflightReport: input.cliPreflightReport,
    npxPreflightReport: input.npxPreflightReport,
    localEvidenceReport: input.localEvidenceReport,
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationExists: existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH),
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    directManualSqlRun: false,
    blockers,
  }
}

function buildSecretReferenceGuard() {
  const presentReferenceNames = SUPABASE_STAGING_DB_URL_SECRET_REFERENCE_NAMES.filter((name) =>
    Boolean(process.env[name]),
  )
  const selectedReferenceName = presentReferenceNames[0] ?? null
  const accessTokenReferencePresent = Boolean(
    process.env.SUPABASE_ACCESS_TOKEN || process.env.REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN,
  )
  const blockers: TransportBlocker[] = []
  if (!selectedReferenceName) {
    blockers.push('staging_supabase_db_url_secret_reference_missing', 'blocked_credentials_unavailable')
  }
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    approvedDbUrlReferenceNames: SUPABASE_STAGING_DB_URL_SECRET_REFERENCE_NAMES,
    presentDbUrlReferenceNames: presentReferenceNames,
    selectedDbUrlReferenceName: selectedReferenceName,
    dbUrlPayloadViewed: false,
    dbUrlValuePrinted: false,
    accessTokenReferencePresent,
    accessTokenPayloadViewed: false,
    serviceRoleKeyRequired: false,
    serviceRoleKeyPayloadViewed: false,
    productionDbUrlReferenceSelected: false,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    blockers,
  }
}

async function buildCliPreflight() {
  const configured = process.env.REEDITPRO_SUPABASE_CLI_PATH
  const command = configured || 'supabase'
  const result = await runTransportCommand(command, ['--version'], process.cwd(), 30000)
  const blockers: TransportBlocker[] = result.status === 'passed' ? [] : ['cli_db_push_unavailable']
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    executableSource: configured ? 'REEDITPRO_SUPABASE_CLI_PATH' : 'PATH',
    executableLabel: configured ? 'configured_cli_path_redacted' : 'supabase_from_path',
    commandResult: result,
    versionOutputPresent: result.stdoutSummary.byteLength > 0 || result.stderrSummary.byteLength > 0,
    cliUsableForDbPush: blockers.length === 0,
    autoInstallAttempted: false,
    npxAttempted: false,
    credentialPayloadsPrinted: false,
    blockers,
  }
}

async function buildNpxPreflight() {
  const npxConfirmed = process.env.REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED === 'true'
  const nodeVersion = process.versions.node
  if (!npxConfirmed) {
    return {
      phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
      runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
      status: 'skipped',
      npxConfirmation: 'REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED',
      npxConfirmed,
      nodeVersion,
      npxDownloadAttempted: false,
      credentialPayloadsPrinted: false,
      blockers: ['npx_cli_not_confirmed'],
    }
  }
  const result = await runTransportCommand('npx', ['--yes', 'supabase', '--version'], process.cwd(), 60000)
  const blockers: TransportBlocker[] = result.status === 'passed' ? [] : ['npx_cli_db_push_unavailable']
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    npxConfirmation: 'REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED',
    npxConfirmed,
    nodeVersion,
    npxCommandResult: result,
    npxDownloadAttempted: true,
    repoDependencyInstalled: false,
    packageLockChanged: false,
    credentialPayloadsPrinted: false,
    blockers,
  }
}

function buildLocalEvidenceReport() {
  const reports = buildSupabaseMilestoneRegistrySchemaReports()
  const blockers: TransportBlocker[] =
    reports.migrationReport.status === 'passed' && reports.rlsPolicyReport.status === 'passed'
      ? []
      : ['local_migration_or_rls_evidence_blocked']
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    migrationReportStatus: reports.migrationReport.status,
    rlsPolicyReportStatus: reports.rlsPolicyReport.status,
    localValidationReportStatus: reports.localValidationReport.status,
    sourceReportDir: 'docs/activation-supabase-milestone-registry-schema-reports',
    blockers,
  }
}

interface CommandPlan {
  command: string
  prefixArgs: string[]
  commandLabel: string
}

function buildStrategyReport(preflightReport: Record<string, unknown>) {
  const preflight = preflightReport as {
    status?: TransportStatus
    pluginTargetProofReport?: { stagingTargetConfirmed?: boolean }
    secretReferenceGuardReport?: { selectedDbUrlReferenceName?: string | null }
    cliPreflightReport?: { status?: TransportStatus }
    npxPreflightReport?: { status?: TransportStatus }
    localEvidenceReport?: { status?: TransportStatus }
    blockers?: TransportBlocker[]
  }
  const blockers = new Set<TransportBlocker>(preflight.blockers ?? [])
  const targetConfirmed = preflight.pluginTargetProofReport?.stagingTargetConfirmed === true
  const credentialsReady = Boolean(preflight.secretReferenceGuardReport?.selectedDbUrlReferenceName)
  const localEvidenceReady = preflight.localEvidenceReport?.status === 'passed'
  const cliReady = preflight.cliPreflightReport?.status === 'passed'
  const npxReady = preflight.npxPreflightReport?.status === 'passed'
  const pluginMigrationSafeApplyReady =
    process.env.REEDITPRO_SUPABASE_PLUGIN_MIGRATION_SAFE_APPLY_AVAILABLE === 'true' &&
    process.env.REEDITPRO_SUPABASE_PLUGIN_MIGRATION_SAFE_APPLY_PRESERVES_HISTORY === 'true'

  let selectedStrategy: TransportStrategy
  let selectedCommand: CommandPlan | null = null
  if (!localEvidenceReady) selectedStrategy = 'blocked_local_evidence'
  else if (!targetConfirmed) selectedStrategy = 'blocked_target_not_staging'
  else if (!credentialsReady) selectedStrategy = 'blocked_credentials_unavailable'
  else if (cliReady) {
    selectedStrategy = 'cli_db_push'
    selectedCommand = {
      command: process.env.REEDITPRO_SUPABASE_CLI_PATH || 'supabase',
      prefixArgs: [],
      commandLabel: process.env.REEDITPRO_SUPABASE_CLI_PATH ? 'configured_supabase_cli_path_redacted' : 'supabase_from_path',
    }
  } else if (npxReady) {
    selectedStrategy = 'npx_cli_db_push'
    selectedCommand = {
      command: 'npx',
      prefixArgs: ['--yes', 'supabase'],
      commandLabel: 'npx_supabase_gated',
    }
  } else if (pluginMigrationSafeApplyReady) {
    selectedStrategy = 'plugin_migration_safe_apply'
    blockers.add('blocked_no_migration_safe_deploy_path')
  } else {
    selectedStrategy = 'blocked_no_migration_safe_deploy_path'
  }

  if (!cliReady) blockers.add('cli_db_push_unavailable')
  if (!npxReady) blockers.add('npx_cli_db_push_unavailable')
  if (selectedStrategy === 'blocked_no_migration_safe_deploy_path') blockers.add('blocked_no_migration_safe_deploy_path')

  const passed = blockers.size === 0 && selectedCommand !== null
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    selectedStrategy,
    selectedCommand,
    strategyOrder: [
      'cli_db_push',
      'npx_cli_db_push',
      'plugin_migration_safe_apply',
      'blocked_no_migration_safe_deploy_path',
      'blocked_credentials_unavailable',
      'blocked_target_not_staging',
    ],
    cliDbPush: {
      available: cliReady,
      source: process.env.REEDITPRO_SUPABASE_CLI_PATH ? 'REEDITPRO_SUPABASE_CLI_PATH' : 'PATH',
      dryRunRequiredBeforeApply: true,
    },
    npxCliDbPush: {
      available: npxReady,
      requiresConfirmation: 'REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED',
      repoDependencyInstalled: false,
      packageLockChanged: false,
      dryRunRequiredBeforeApply: true,
    },
    pluginMigrationSafeApply: {
      available: pluginMigrationSafeApplyReady,
      selected: selectedStrategy === 'plugin_migration_safe_apply',
      migrationHistoryMustBePreserved: true,
      directSqlFallbackAllowed: false,
    },
    directManualSqlAllowed: false,
    dashboardSqlEditorAllowed: false,
    seedDeployAllowed: false,
    trackBExportRowsAllowed: false,
    unrelatedMigrationsAllowed: false,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    blockers: passed ? [] : [...blockers],
  }
}

function buildDefaultSchemaDeployTransportReport(strategyReport: Record<string, unknown>) {
  const strategy = strategyReport as { selectedStrategy?: TransportStrategy; blockers?: TransportBlocker[] }
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: 'blocked',
    selectedStrategy: strategy.selectedStrategy,
    deployPerformed: false,
    dryRunPerformed: false,
    migrationDeployment: false,
    reason: 'staging_schema_deploy_transport_requires_execute_flag_and_all_current_shell_gates',
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    seedFilesIncluded: false,
    trackBRowsWritten: false,
    productionAffected: false,
    directManualSqlRun: false,
    blockers: collectUniqueBlockers(strategy.blockers ?? [], ['staging_schema_deploy_not_run']),
  }
}

function buildDefaultSchemaVerifyAfterTransportReport(strategyReport: Record<string, unknown>) {
  const strategy = strategyReport as { selectedStrategy?: TransportStrategy; blockers?: TransportBlocker[] }
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: 'blocked',
    selectedStrategy: strategy.selectedStrategy,
    verificationPerformed: false,
    reason: 'staging_verify_requires_successful_transport_deploy_and_verify_confirmation',
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    directManualSqlRun: false,
    blockers: collectUniqueBlockers(strategy.blockers ?? [], ['staging_schema_verification_not_run']),
  }
}

function buildDefaultRlsVerifyAfterTransportReport(
  schemaVerifyAfterTransportReport: Record<string, unknown>,
  localEvidenceReport: Record<string, unknown>,
) {
  const schema = schemaVerifyAfterTransportReport as { status?: TransportStatus; verificationPerformed?: boolean }
  const localEvidence = localEvidenceReport as { status?: TransportStatus; blockers?: TransportBlocker[] }
  const passed = schema.status === 'passed' && schema.verificationPerformed === true && localEvidence.status === 'passed'
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    verificationPerformed: passed,
    verificationWorkflow: 'verified_migration_history_plus_static_committed_rls_evidence',
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    rlsExpectedEnabled: SUPABASE_MILESTONE_REGISTRY_TABLES,
    publicAnonAuthenticatedRevokesExpected: true,
    serviceRoleOnlyGrantExpected: true,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    blockers: passed
      ? []
      : collectUniqueBlockers(extractBlockers(schemaVerifyAfterTransportReport), localEvidence.blockers ?? [], [
          'staging_rls_verification_failed',
        ]),
  }
}

function buildRlsVerificationFromSchemaReport(
  schemaVerifyAfterTransportReport: Record<string, unknown>,
  localEvidenceReport: Record<string, unknown>,
) {
  return buildDefaultRlsVerifyAfterTransportReport(schemaVerifyAfterTransportReport, localEvidenceReport)
}

function buildBlockedSchemaDeployTransportReport(reason: string, blockers: TransportBlocker[]) {
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: 'blocked',
    deployPerformed: false,
    dryRunPerformed: false,
    migrationDeployment: false,
    reason,
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    seedFilesIncluded: false,
    trackBRowsWritten: false,
    productionAffected: false,
    directManualSqlRun: false,
    blockers,
  }
}

function buildFailedSchemaDeployTransportReport(
  blocker: TransportBlocker,
  command: CommandResult,
  tempContext: ReturnType<typeof createTempDeployContext>,
  dryRunPerformed: boolean,
  deployAttempted: boolean,
) {
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: 'blocked',
    deployPerformed: false,
    dryRunPerformed,
    deployAttempted,
    migrationDeployment: false,
    tempDeployContextCreated: true,
    tempDeployContextPolicy: tempContext.report,
    failedCommand: command,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    trackBRowsWritten: false,
    productionAffected: false,
    directManualSqlRun: false,
    blockers: [blocker],
  }
}

function wrapBackfillReport(report: Record<string, unknown>, mode: 'preflight' | 'diff') {
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
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

function buildBlockerReport(blockers: TransportBlocker[]) {
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    expectedCurrentEnvironmentBlockers: [
      'staging_supabase_db_url_secret_reference_missing',
      'blocked_credentials_unavailable',
      'cli_db_push_unavailable',
      'npx_cli_db_push_unavailable',
      'blocked_no_migration_safe_deploy_path',
      'staging_schema_deploy_not_run',
      'staging_schema_verification_not_run',
    ],
    operatorActionRequired: blockers.length === 0
      ? 'No blocker recorded for staging deploy transport.'
      : 'Resolve the exact CLI, npx, staging DB URL secret-reference, or target-proof blocker before retrying deploy.',
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
  schemaDeployTransportReport: Record<string, unknown>,
  schemaVerifyAfterTransportReport: Record<string, unknown>,
  rlsVerifyAfterTransportReport: Record<string, unknown>,
  backfillReports: ReturnType<typeof buildSupabaseTrackBBackfillReports>,
  blockers: TransportBlocker[],
) {
  const stagingSchemaVerified =
    schemaDeployTransportReport.status === 'passed' &&
    schemaVerifyAfterTransportReport.status === 'passed' &&
    rlsVerifyAfterTransportReport.status === 'passed'
  const backfillSchemaCheck = backfillReports.registrySchemaCheck as { status?: string; blockers?: string[] }
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: stagingSchemaVerified ? 'passed' : 'blocked',
    stagingSchemaVerified,
    stagingDeployStatus: schemaDeployTransportReport.status,
    stagingVerifyStatus: schemaVerifyAfterTransportReport.status,
    stagingRlsVerifyStatus: rlsVerifyAfterTransportReport.status,
    pr198SchemaCheckStatusAfterSchema: backfillSchemaCheck.status,
    pr198SchemaMissingResolvedByCommittedMigration: !(backfillSchemaCheck.blockers ?? []).includes(
      'supabase_milestone_registry_schema_missing',
    ),
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directManualSqlRun: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    trackA: 'not_touched',
    blockers,
    nextRecommendedPhase: stagingSchemaVerified
      ? 'Rerun PR #198 guarded Track B staging backfill without schema mutation confirmations.'
      : 'Resolve the exact CLI, npx, staging DB URL secret-reference, or migration-safe transport blocker.',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
    runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
    status: 'committed_safe_metadata_only',
    reportDir: SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_DEPLOY_TRANSPORT_EXPECTED_REPORTS,
    privateUploadRequired: false,
    privateUploadPerformed: false,
    secretsCommitted: false,
    credentialPayloadsPrinted: false,
    stagingDataWritten: false,
    productionAffected: false,
  }
}

function createTempDeployContext() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'reeditpro-staging-deploy-transport-'))
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
      trackBExportRowsIncluded: false,
      unrelatedMigrationsIncluded: false,
      secretsIncluded: false,
    },
  }
}

function runTransportCommand(command: string, args: string[], cwd: string, timeout = 60000): Promise<CommandResult> {
  return new Promise((resolve) => {
    try {
      execFile(command, args, {
        cwd,
        shell: false,
        timeout,
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
          cwd: cwd === process.cwd() ? 'process_cwd' : 'redacted_temp_directory',
          stdoutSummary: summarizeOutput(stdout ?? ''),
          stderrSummary: summarizeOutput(stderr ?? ''),
          outputContainsExpectedMigrationId: output.includes(SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID),
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
        cwd: cwd === process.cwd() ? 'process_cwd' : 'redacted_temp_directory',
        stdoutSummary: summarizeOutput(''),
        stderrSummary: summarizeOutput(output),
        outputContainsExpectedMigrationId: false,
        errorCategory: detectErrorCategory(output),
      })
    }
  })
}

function readSelectedStagingDbUrl() {
  for (const name of SUPABASE_STAGING_DB_URL_SECRET_REFERENCE_NAMES) {
    const value = process.env[name]
    if (value) return value
  }
  return ''
}

function getMissingDeployConfirmationBlockers(): TransportBlocker[] {
  return SUPABASE_STAGING_DEPLOY_TRANSPORT_REQUIRED_DEPLOY_CONFIRMATIONS.every(
    (name) => process.env[name] === 'true',
  )
    ? []
    : ['staging_schema_deploy_not_confirmed']
}

function getMissingVerifyConfirmationBlockers(): TransportBlocker[] {
  return SUPABASE_STAGING_DEPLOY_TRANSPORT_REQUIRED_VERIFY_CONFIRMATIONS.every(
    (name) => process.env[name] === 'true',
  )
    ? []
    : ['staging_schema_verify_not_confirmed']
}

function getForbiddenConfirmationBlockers(): TransportBlocker[] {
  return SUPABASE_STAGING_DEPLOY_TRANSPORT_FORBIDDEN_CONFIRMATIONS.some((name) => process.env[name] === 'true')
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

function detectErrorCategory(output: string) {
  if (/bad cpu type/i.test(output)) return 'bad_cpu_type_in_executable'
  if (/enoent|not found/i.test(output)) return 'executable_not_found'
  if (/permission denied/i.test(output)) return 'permission_denied'
  if (/timed out|timeout/i.test(output)) return 'timeout'
  return 'command_failed'
}

function extractBlockers(report: Record<string, unknown>): TransportBlocker[] {
  return (report.blockers ?? []) as TransportBlocker[]
}

function collectUniqueBlockers(...blockerGroups: TransportBlocker[][]): TransportBlocker[] {
  return [...new Set(blockerGroups.flat())]
}

function renderReadinessMarkdown(reports: TransportReports): string {
  const readiness = reports.readinessReport as { status?: string; blockers?: string[]; nextRecommendedPhase?: string }
  const strategy = reports.strategyReport as { selectedStrategy?: string }
  return `# Supabase Staging Deploy Transport Rerun

Run id: \`${SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID}\`

This phase proves a migration-safe staging deploy transport for \`${SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH}\` and reruns schema/RLS verification only when every target, credential, CLI, dry-run, and confirmation gate passes.

- Readiness: ${readiness.status}
- Selected strategy: ${strategy.selectedStrategy}
- Deploy performed: ${reports.schemaDeployTransportReport.deployPerformed === true ? 'yes' : 'no'}
- Verification performed: ${reports.schemaVerifyAfterTransportReport.verificationPerformed === true ? 'yes' : 'no'}
- Track B backfill rows written: no
- Production affected: no
- Direct/manual SQL run: no
- Active blockers: ${(readiness.blockers ?? []).join(', ') || 'none'}
- Next: ${readiness.nextRecommendedPhase}
`
}
