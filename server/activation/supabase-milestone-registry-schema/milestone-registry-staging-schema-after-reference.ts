import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
  buildSupabaseStagingTargetProofReports,
} from './milestone-registry-staging-target-proof'
import {
  SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
  SUPABASE_MILESTONE_REGISTRY_TABLES,
} from './index'
import {
  SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
} from './milestone-registry-supabase-plugin-deploy-plan'
import {
  SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
} from './milestone-registry-approved-staging-target-reference'
import {
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
} from './milestone-registry-staging-target-policy'
import {
  buildSupabaseStagingDeployTransportReports,
  executeSupabaseStagingDeployTransportDeploy,
  executeSupabaseStagingDeployTransportVerify,
} from './milestone-registry-staging-deploy-transport'

export const SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE =
  'supabase-staging-schema-deploy-after-target-reference'
export const SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID =
  'supabase-staging-schema-deploy-after-target-reference-20260605'
export const SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_BRANCH =
  'codex/rp-foundation-supabase-staging-schema-deploy-after-target-reference'
export const SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_BASE_BRANCH =
  'codex/rp-foundation-supabase-approved-staging-target-reference'
export const SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR =
  'docs/activation-supabase-staging-schema-deploy-after-target-reference-reports'
export const SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PR_TITLE =
  '[foundation] Supabase staging schema deploy after target reference'

export const SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_ALLOWED_CONFIRMATIONS = [
  SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
] as const

export const SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ',
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

export const SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'approved_staging_target_reference_loaded_report.json',
  'supabase_plugin_target_proof_after_reference_report.json',
  'supabase_staging_schema_deploy_strategy_after_reference_report.json',
  'supabase_staging_schema_deploy_after_reference_report.json',
  'supabase_staging_schema_verify_after_reference_report.json',
  'supabase_staging_rls_verify_after_reference_report.json',
  'trackb_backfill_preflight_after_reference_schema_deploy.json',
  'trackb_backfill_diff_after_reference_schema_deploy.json',
  'supabase_staging_schema_deploy_after_reference_blocker_report.json',
  'supabase_staging_schema_deploy_after_reference_readiness_report.json',
  'supabase_staging_schema_deploy_after_reference_private_artifact_manifest.json',
  'supabase_staging_schema_deploy_after_reference_readiness_report.md',
] as const

type AfterReferenceBlocker =
  | 'source_of_truth_ownership_audit_failed'
  | 'approved_staging_target_reference_missing'
  | 'approved_staging_target_reference_not_loaded'
  | 'supabase_plugin_staging_target_check_not_confirmed'
  | 'supabase_plugin_target_not_confirmed_as_staging'
  | 'supabase_plugin_project_ref_mismatch'
  | 'blocked_target_not_staging'
  | 'blocked_credentials_unavailable'
  | 'blocked_no_migration_safe_deploy_path'
  | 'cli_db_push_unavailable'
  | 'plugin_migration_safe_apply_unavailable_from_repo_cli'
  | 'staging_schema_deploy_not_confirmed'
  | 'staging_schema_verify_not_confirmed'
  | 'staging_schema_deploy_not_run'
  | 'staging_schema_verification_not_run'
  | 'forbidden_confirmation_set'

interface AfterReferenceReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  approvedStagingTargetReferenceLoadedReport: Record<string, unknown>
  pluginTargetProofAfterReferenceReport: Record<string, unknown>
  deployStrategyAfterReferenceReport: Record<string, unknown>
  schemaDeployAfterReferenceReport: Record<string, unknown>
  schemaVerifyAfterReferenceReport: Record<string, unknown>
  rlsVerifyAfterReferenceReport: Record<string, unknown>
  trackBBackfillPreflightAfterReferenceSchemaDeploy: Record<string, unknown>
  trackBBackfillDiffAfterReferenceSchemaDeploy: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}

export function getSupabaseStagingSchemaAfterReferencePlan() {
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    branch: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_BRANCH,
    baseBranch: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_BASE_BRANCH,
    prTitle: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PR_TITLE,
    sourcePr198: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/198',
    sourcePr200: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/200',
    sourcePr206: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/206',
    sourcePr209: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/209',
    sourcePr212: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/212',
    mode: 'guarded_staging_schema_deploy_after_approved_target_reference',
    reportDir: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_EXPECTED_REPORTS,
    sourceProofReportDir: SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    supabaseCliDocs: 'https://supabase.com/docs/reference/cli/supabase-db-push',
    supabaseMigrationDocs: 'https://supabase.com/docs/guides/deployment/database-migrations',
    supabaseDocsAccessedAt: '2026-06-05',
    allowedConfirmations: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_ALLOWED_CONFIRMATIONS,
    forbiddenConfirmations: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_FORBIDDEN_CONFIRMATIONS,
    deployStrategyOrder: [
      'load_pr212_approved_staging_target_reference',
      'confirm_plugin_target_matches_approved_staging_ref',
      'delegate_to_pr209_pr206_migration_safe_deploy_path',
      'blocked_no_migration_safe_deploy_path',
    ],
    tempMigrationContext: {
      containsOnlyMigration: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
      includeSeeds: false,
      includeTrackBExportRows: false,
      includeUnrelatedMigrations: false,
    },
    verificationScope: [
      'activation milestone registry table presence',
      'RLS enabled for all registry tables',
      'public anon authenticated revokes',
      'service-role-only grants',
      'migration history where safely available',
    ],
    noTrackBBackfillWrites: true,
    noProductionSupabase: true,
    noDirectManualSql: true,
    noProviderCalls: true,
    noRouteWorkerToolExecution: true,
    noMediaProcessing: true,
    noBetaProductionUnlock: true,
    noTrackA: true,
    nextRecommendedPhase:
      'After verified staging schema/RLS, rerun PR #198 guarded Track B staging backfill without schema mutation confirmations.',
  }
}

export async function buildSupabaseStagingSchemaAfterReferenceReports(overrides: {
  schemaDeployAfterReferenceReport?: Record<string, unknown>
  schemaVerifyAfterReferenceReport?: Record<string, unknown>
  rlsVerifyAfterReferenceReport?: Record<string, unknown>
} = {}): Promise<AfterReferenceReports> {
  const proofReports = await buildSupabaseStagingTargetProofReports()
  const transportReports = await buildSupabaseStagingDeployTransportReports()
  const sourceOfTruthOwnershipAudit = buildAfterReferenceSourceAudit(proofReports.sourceOfTruthOwnershipAudit)
  const approvedStagingTargetReferenceLoadedReport = buildApprovedReferenceLoadedReport(
    proofReports.approvedTargetReferenceReport,
  )
  const pluginTargetProofAfterReferenceReport = buildPluginTargetProofAfterReferenceReport(
    proofReports.pluginTargetProofReport,
    approvedStagingTargetReferenceLoadedReport,
  )
  const deployStrategyAfterReferenceReport = buildDeployStrategyAfterReferenceReport(
    proofReports.deployStrategyReport,
    pluginTargetProofAfterReferenceReport,
    transportReports.strategyReport,
  )
  const schemaDeployAfterReferenceReport =
    overrides.schemaDeployAfterReferenceReport ??
    buildSchemaDeployAfterReferenceReport(transportReports.schemaDeployTransportReport)
  const schemaVerifyAfterReferenceReport =
    overrides.schemaVerifyAfterReferenceReport ??
    buildSchemaVerifyAfterReferenceReport(transportReports.schemaVerifyAfterTransportReport)
  const rlsVerifyAfterReferenceReport =
    overrides.rlsVerifyAfterReferenceReport ??
    buildRlsVerifyAfterReferenceReport(transportReports.rlsVerifyAfterTransportReport)
  const trackBBackfillPreflightAfterReferenceSchemaDeploy = wrapTrackBBackfillReport(
    transportReports.trackBBackfillPreflightAfterTransportSchemaDeploy,
    'preflight',
  )
  const trackBBackfillDiffAfterReferenceSchemaDeploy = wrapTrackBBackfillReport(
    transportReports.trackBBackfillDiffAfterTransportSchemaDeploy,
    'diff',
  )
  const blockers = collectUniqueBlockers(
    extractBlockers(sourceOfTruthOwnershipAudit),
    extractBlockers(approvedStagingTargetReferenceLoadedReport),
    extractBlockers(pluginTargetProofAfterReferenceReport),
    extractBlockers(deployStrategyAfterReferenceReport),
    extractBlockers(schemaDeployAfterReferenceReport),
    extractBlockers(schemaVerifyAfterReferenceReport),
    extractBlockers(rlsVerifyAfterReferenceReport),
  )
  return {
    sourceOfTruthOwnershipAudit,
    approvedStagingTargetReferenceLoadedReport,
    pluginTargetProofAfterReferenceReport,
    deployStrategyAfterReferenceReport,
    schemaDeployAfterReferenceReport,
    schemaVerifyAfterReferenceReport,
    rlsVerifyAfterReferenceReport,
    trackBBackfillPreflightAfterReferenceSchemaDeploy,
    trackBBackfillDiffAfterReferenceSchemaDeploy,
    blockerReport: buildBlockerReport(blockers),
    readinessReport: buildReadinessReport(
      schemaDeployAfterReferenceReport,
      schemaVerifyAfterReferenceReport,
      rlsVerifyAfterReferenceReport,
      blockers,
    ),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeSupabaseStagingSchemaAfterReferenceArtifacts(
  reports: AfterReferenceReports,
  reportDir = SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'approved_staging_target_reference_loaded_report.json'), reports.approvedStagingTargetReferenceLoadedReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_target_proof_after_reference_report.json'), reports.pluginTargetProofAfterReferenceReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_schema_deploy_strategy_after_reference_report.json'), reports.deployStrategyAfterReferenceReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_schema_deploy_after_reference_report.json'), reports.schemaDeployAfterReferenceReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_schema_verify_after_reference_report.json'), reports.schemaVerifyAfterReferenceReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_rls_verify_after_reference_report.json'), reports.rlsVerifyAfterReferenceReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_preflight_after_reference_schema_deploy.json'), reports.trackBBackfillPreflightAfterReferenceSchemaDeploy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_diff_after_reference_schema_deploy.json'), reports.trackBBackfillDiffAfterReferenceSchemaDeploy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_schema_deploy_after_reference_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_schema_deploy_after_reference_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_schema_deploy_after_reference_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'supabase_staging_schema_deploy_after_reference_readiness_report.md'), renderReadinessMarkdown(reports))
}

export async function readSupabaseStagingSchemaAfterReferenceSummary() {
  const reports = await buildSupabaseStagingSchemaAfterReferenceReports()
  const readiness = reports.readinessReport as {
    status?: string
    stagingSchemaVerified?: boolean
    nextRecommendedPhase?: string
  }
  const blocker = reports.blockerReport as { activeBlockers?: string[] }
  const proof = reports.pluginTargetProofAfterReferenceReport as { stagingTargetProofPassed?: boolean }
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: readiness.status,
    stagingTargetProofPassed: proof.stagingTargetProofPassed === true,
    stagingSchemaVerified: readiness.stagingSchemaVerified === true,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    toolExecution: 'not_run',
    trackA: 'not_touched',
    activeBlockers: blocker.activeBlockers ?? [],
    nextRecommendedPhase: readiness.nextRecommendedPhase,
  }
}

export async function executeSupabaseStagingSchemaAfterReferenceDeploy(input: {
  keepTemp: boolean
}): Promise<{ reports: AfterReferenceReports; exitCode: number }> {
  const result = await executeSupabaseStagingDeployTransportDeploy(input)
  const reports = await buildSupabaseStagingSchemaAfterReferenceReports({
    schemaDeployAfterReferenceReport: buildSchemaDeployAfterReferenceReport(result.reports.schemaDeployTransportReport),
  })
  await writeSupabaseStagingSchemaAfterReferenceArtifacts(reports)
  return { reports, exitCode: result.exitCode }
}

export async function executeSupabaseStagingSchemaAfterReferenceVerify(): Promise<{ reports: AfterReferenceReports; exitCode: number }> {
  const result = await executeSupabaseStagingDeployTransportVerify()
  const reports = await buildSupabaseStagingSchemaAfterReferenceReports({
    schemaVerifyAfterReferenceReport: buildSchemaVerifyAfterReferenceReport(result.reports.schemaVerifyAfterTransportReport),
    rlsVerifyAfterReferenceReport: buildRlsVerifyAfterReferenceReport(result.reports.rlsVerifyAfterTransportReport),
  })
  await writeSupabaseStagingSchemaAfterReferenceArtifacts(reports)
  return { reports, exitCode: result.exitCode }
}

function buildAfterReferenceSourceAudit(sourceAudit: Record<string, unknown>) {
  const blockers = extractBlockers(sourceAudit)
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    branch: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_BRANCH,
    baseBranch: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_BASE_BRANCH,
    reviewedPrs: [
      { pr: 198, role: 'future guarded Track B staging backfill, preflight/diff only in this phase' },
      { pr: 200, role: 'activation milestone registry schema/RLS migration owner' },
      { pr: 206, role: 'plugin-assisted deploy/verify wrapper' },
      { pr: 209, role: 'staging target proof deploy rerun wrapper' },
      { pr: 212, role: 'approved non-secret staging target reference' },
    ],
    sourceProofReportDir: SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
    delegatedSourceAudit: sourceAudit,
    ownership: {
      thisPhaseOwns: 'after-reference deploy/verify rerun reports and script namespace',
      pr212Owns: 'approved staging target reference metadata',
      pr209Owns: 'target proof and deploy delegation policy',
      pr206Owns: 'plugin/CLI migration-safe deploy and verify path',
      pr198Owns: 'future Track B metadata backfill write path',
    },
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    secretsIncluded: false,
    credentialPayloadsPrinted: false,
    remoteSqlRun: false,
    productionAffected: false,
    trackBRowsWritten: false,
    blockers,
  }
}

function buildApprovedReferenceLoadedReport(report: Record<string, unknown>) {
  const ref = report as {
    status?: string
    approved?: boolean
    approvedStagingTargetReferenceFound?: boolean
    approvedStagingProjectName?: string
    approvedStagingProjectRef?: string
    approvedEnvironment?: string
    blockers?: string[]
  }
  const blockers = new Set<AfterReferenceBlocker>()
  for (const blocker of ref.blockers ?? []) blockers.add(blocker as AfterReferenceBlocker)
  const loaded =
    ref.status === 'passed' &&
    (ref.approved === true || ref.approvedStagingTargetReferenceFound === true) &&
    ref.approvedStagingProjectName === 'Reeditpro' &&
    ref.approvedStagingProjectRef === 'wmyyttnynmteqgcdishd' &&
    ref.approvedEnvironment === 'staging'
  if (!loaded) blockers.add('approved_staging_target_reference_not_loaded')
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: loaded ? 'passed' : 'blocked',
    sourcePr212: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/212',
    sourceReport: 'docs/activation-supabase-approved-staging-target-reports/approved_staging_target_reference.json',
    approvedReferenceLoaded: loaded,
    approvedStagingProjectName: ref.approvedStagingProjectName ?? 'unknown',
    approvedStagingProjectRef: ref.approvedStagingProjectRef ?? 'unknown',
    approvedEnvironment: ref.approvedEnvironment ?? 'unknown',
    credentialPayloadViewed: false,
    credentialPayloadPrinted: false,
    secretsIncluded: false,
    remoteSqlRun: false,
    migrationDeployment: false,
    productionAffected: false,
    delegatedReport: report,
    blockers: [...blockers],
  }
}

function buildPluginTargetProofAfterReferenceReport(
  report: Record<string, unknown>,
  approvedReferenceLoadedReport: Record<string, unknown>,
) {
  const proof = report as {
    status?: string
    stagingTargetProofPassed?: boolean
    blockers?: string[]
    selectedPluginProject?: Record<string, unknown>
  }
  const approved = approvedReferenceLoadedReport as { status?: string; approvedStagingProjectRef?: string }
  const blockers = collectUniqueBlockers(proof.blockers ?? [], extractBlockers(approvedReferenceLoadedReport))
  const passed =
    approved.status === 'passed' &&
    proof.status === 'passed' &&
    proof.stagingTargetProofPassed === true
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    sourcePr209: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/209',
    sourceReport: 'docs/activation-supabase-staging-target-proof-reports/supabase_plugin_target_proof_report.json',
    proofConfirmation: SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
    proofConfirmationSet: process.env[SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION] === 'true',
    pluginTargetCheckConfirmation: SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
    pluginTargetCheckConfirmed: process.env[SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION] === 'true',
    approvedStagingProjectRef: approved.approvedStagingProjectRef,
    selectedPluginProject: proof.selectedPluginProject,
    stagingTargetProofPassed: passed,
    productionTargetConfirmed: false,
    ambiguousTargetSignal: !passed,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    delegatedReport: report,
    blockers: passed ? [] : blockers,
  }
}

function buildDeployStrategyAfterReferenceReport(
  report: Record<string, unknown>,
  pluginTargetProofAfterReferenceReport: Record<string, unknown>,
  transportStrategyReport: Record<string, unknown>,
) {
  const strategy = report as {
    status?: string
    selectedStrategy?: string
    blockers?: string[]
    pr206DeployStrategy?: Record<string, unknown>
  }
  const proof = pluginTargetProofAfterReferenceReport as { status?: string; blockers?: string[] }
  const transport = transportStrategyReport as { status?: string; selectedStrategy?: string; blockers?: string[] }
  const pr206DeployStrategy = strategy.pr206DeployStrategy as { blockers?: string[]; selectedStrategy?: string; status?: string } | undefined
  const blockers = collectUniqueBlockers(
    strategy.blockers ?? [],
    proof.blockers ?? [],
    pr206DeployStrategy?.blockers ?? [],
    transport.blockers ?? [],
  )
  const selectedStrategy =
    proof.status === 'passed' && transport.status === 'passed'
      ? 'delegate_to_supabase_staging_deploy_transport'
      : strategy.selectedStrategy === 'blocked_no_migration_safe_deploy_path' ||
          pr206DeployStrategy?.selectedStrategy === 'blocked_no_migration_safe_deploy_path' ||
          transport.selectedStrategy === 'blocked_no_migration_safe_deploy_path'
        ? 'blocked_no_migration_safe_deploy_path'
        : 'blocked_until_target_proof_and_migration_safe_path_pass'
  if (selectedStrategy !== 'delegate_to_supabase_staging_deploy_transport' && blockers.length === 0) {
    blockers.push('blocked_no_migration_safe_deploy_path')
  }
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: blockers.length === 0 && selectedStrategy === 'delegate_to_supabase_staging_deploy_transport'
      ? 'passed'
      : 'blocked',
    selectedStrategy,
    strategyOrder: [
      'load_pr212_approved_staging_target_reference',
      'confirm_plugin_target_matches_approved_staging_ref',
      'delegate_to_supabase_staging_deploy_transport',
      'delegate_to_pr209_pr206_migration_safe_deploy_path',
      'blocked_no_migration_safe_deploy_path',
    ],
    cliDbPushPreferred: true,
    dryRunRequiredBeforeApply: true,
    pluginMigrationSafeApplyAllowedOnlyIfMigrationHistorySafe: true,
    transportStrategyReport,
    directManualSqlAllowed: false,
    seedDeployAllowed: false,
    trackBExportRowsAllowed: false,
    unrelatedMigrationsAllowed: false,
    delegatedReport: report,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    blockers,
  }
}

function buildSchemaDeployAfterReferenceReport(report: Record<string, unknown>) {
  const source = report as { status?: string; deployPerformed?: boolean; blockers?: string[] }
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: source.status === 'passed' && source.deployPerformed === true ? 'passed' : 'blocked',
    sourcePr216: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/216',
    sourceReport: 'docs/activation-supabase-staging-deploy-transport-reports/staging_schema_deploy_transport_report.json',
    deployPerformed: source.deployPerformed === true,
    migrationApplied: source.deployPerformed === true,
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    migrationSafeWorkflowOnly: true,
    tempMigrationContextContainsOnlyRegistryMigration: true,
    dryRunRequiredBeforeApply: true,
    seedDeployAllowed: false,
    trackBRowsWritten: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    delegatedReport: report,
    blockers: extractBlockers(report),
  }
}

function buildSchemaVerifyAfterReferenceReport(report: Record<string, unknown>) {
  const source = report as { status?: string; verificationPerformed?: boolean; blockers?: string[] }
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: source.status === 'passed' && source.verificationPerformed === true ? 'passed' : 'blocked',
    sourceReport: 'docs/activation-supabase-staging-deploy-transport-reports/staging_schema_verify_after_transport_report.json',
    verificationPerformed: source.verificationPerformed === true,
    schemaMetadataOnly: true,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    allowlistedReadOnlyCatalogQueriesOnly: true,
    remoteSqlRun: false,
    directManualSqlRun: false,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    delegatedReport: report,
    blockers: extractBlockers(report),
  }
}

function buildRlsVerifyAfterReferenceReport(report: Record<string, unknown>) {
  const source = report as { status?: string; verificationPerformed?: boolean; blockers?: string[] }
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: source.status === 'passed' && source.verificationPerformed === true ? 'passed' : 'blocked',
    sourceReport: 'docs/activation-supabase-staging-deploy-transport-reports/staging_rls_verify_after_transport_report.json',
    verificationPerformed: source.verificationPerformed === true,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    rlsExpectedEnabled: SUPABASE_MILESTONE_REGISTRY_TABLES,
    publicAnonAuthenticatedRevokesExpected: true,
    serviceRoleOnlyGrantExpected: true,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    delegatedReport: report,
    blockers: extractBlockers(report),
  }
}

function wrapTrackBBackfillReport(report: Record<string, unknown>, mode: 'preflight' | 'diff') {
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: report.status ?? 'blocked',
    mode,
    sourcePr198: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/198',
    sourceReport: mode === 'preflight'
      ? 'docs/activation-supabase-staging-target-proof-reports/trackb_backfill_preflight_after_target_proof_schema_deploy.json'
      : 'docs/activation-supabase-staging-target-proof-reports/trackb_backfill_diff_after_target_proof_schema_deploy.json',
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

function buildBlockerReport(blockers: AfterReferenceBlocker[]) {
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    expectedSafeBlockersWhenCredentialsOrCliAreMissing: [
      'blocked_credentials_unavailable',
      'cli_db_push_unavailable',
      'blocked_no_migration_safe_deploy_path',
      'staging_schema_deploy_not_run',
      'staging_schema_verification_not_run',
    ],
    operatorActionRequired: blockers.length === 0
      ? 'No blocker recorded for the after-reference schema deploy/verify path.'
      : 'Resolve the exact credential, CLI, target-proof, or migration-safe deploy blocker before retrying staging schema deploy.',
    stillBlockedScopes: [
      'track_b_backfill_write',
      'production_supabase',
      'production_sql',
      'direct_manual_remote_sql',
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
  schemaDeployAfterReferenceReport: Record<string, unknown>,
  schemaVerifyAfterReferenceReport: Record<string, unknown>,
  rlsVerifyAfterReferenceReport: Record<string, unknown>,
  blockers: AfterReferenceBlocker[],
) {
  const stagingSchemaVerified =
    schemaDeployAfterReferenceReport.status === 'passed' &&
    schemaVerifyAfterReferenceReport.status === 'passed' &&
    rlsVerifyAfterReferenceReport.status === 'passed'
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: stagingSchemaVerified ? 'passed' : 'blocked',
    stagingSchemaVerified,
    stagingDeployAllowedOnlyWithConfirmations: true,
    schemaDeployStatus: schemaDeployAfterReferenceReport.status,
    schemaVerifyStatus: schemaVerifyAfterReferenceReport.status,
    rlsVerifyStatus: rlsVerifyAfterReferenceReport.status,
    pr198BackfillRowsWritten: false,
    trackBBackfillWriteStillBlocked: true,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    toolExecution: 'not_run',
    trackA: 'not_touched',
    blockers,
    nextRecommendedPhase: stagingSchemaVerified
      ? 'Rerun PR #198 guarded Track B staging backfill without schema mutation confirmations.'
      : 'Resolve the exact credential/CLI/migration-safe deploy blocker and rerun the after-reference deploy wrapper.',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_PHASE,
    runId: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_RUN_ID,
    status: 'metadata_committed_only',
    reportDir: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_EXPECTED_REPORTS,
    privateUploadRequired: false,
    secretsIncluded: false,
    dbUrlsIncluded: false,
    serviceKeysIncluded: false,
    accessTokensIncluded: false,
    signedUrlsIncluded: false,
    mediaPayloadsIncluded: false,
  }
}

function renderReadinessMarkdown(reports: AfterReferenceReports) {
  const readiness = reports.readinessReport as {
    status?: string
    blockers?: string[]
    nextRecommendedPhase?: string
  }
  return [
    '# Supabase Staging Schema Deploy After Target Reference',
    '',
    `Status: \`${readiness.status ?? 'blocked'}\``,
    '',
    'This report is safe metadata only. It does not include DB URLs, access tokens, passwords, service-role keys, anon keys, signed URLs, private payloads, raw Supabase output, or Track B backfill rows.',
    '',
    `Active blockers: ${(readiness.blockers ?? []).map((blocker) => `\`${blocker}\``).join(', ') || 'none'}`,
    '',
    `Next: ${readiness.nextRecommendedPhase ?? 'Resolve blockers and rerun.'}`,
    '',
  ].join('\n')
}

function extractBlockers(report: Record<string, unknown>): AfterReferenceBlocker[] {
  const blockers = Array.isArray(report.blockers)
    ? report.blockers
    : Array.isArray(report.activeBlockers)
      ? report.activeBlockers
      : []
  return blockers.filter((blocker): blocker is AfterReferenceBlocker => typeof blocker === 'string') as AfterReferenceBlocker[]
}

function collectUniqueBlockers(...groups: Array<readonly string[]>): AfterReferenceBlocker[] {
  const blockers = new Set<AfterReferenceBlocker>()
  for (const group of groups) {
    for (const blocker of group) blockers.add(blocker as AfterReferenceBlocker)
  }
  return [...blockers]
}
