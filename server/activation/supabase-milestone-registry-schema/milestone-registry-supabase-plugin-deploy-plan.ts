import { existsSync, readFileSync } from 'node:fs'
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
  SUPABASE_MILESTONE_REGISTRY_TABLES,
} from './index'
import {
  SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_DOCS_SOURCE,
  buildSupabaseMilestoneRegistryStagingDeployReports,
  executeSupabaseMilestoneRegistryStagingDeploy,
  executeSupabaseMilestoneRegistryStagingVerify,
} from './milestone-registry-staging-deploy-verify'
import {
  OBSERVED_SUPABASE_PLUGIN_MIGRATIONS,
  SUPABASE_PLUGIN_ALLOWED_CONFIRMATIONS,
  SUPABASE_PLUGIN_FORBIDDEN_CONFIRMATIONS,
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
  buildSupabasePluginTargetPreflight,
  getForbiddenPluginConfirmations,
} from './milestone-registry-staging-target-policy'

export const SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE = 'supabase-plugin-staging-milestone-registry-deploy-verify'
export const SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID = 'supabase-plugin-staging-milestone-registry-deploy-verify-20260605'
export const SUPABASE_PLUGIN_STAGING_DEPLOY_BRANCH = 'codex/rp-foundation-supabase-plugin-staging-schema-deploy-verify'
export const SUPABASE_PLUGIN_STAGING_DEPLOY_BASE_BRANCH = 'codex/rp-foundation-supabase-milestone-registry-staging-deploy-verify'
export const SUPABASE_PLUGIN_STAGING_DEPLOY_REPORT_DIR = 'docs/activation-supabase-plugin-staging-deploy-reports'
export const SUPABASE_PLUGIN_STAGING_DEPLOY_PR_TITLE = '[foundation] Supabase plugin staging milestone registry deploy verify'
export const SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID = '202606050001'

export const SUPABASE_PLUGIN_STAGING_DEPLOY_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'supabase_plugin_staging_deploy_plan.json',
  'supabase_plugin_target_preflight_report.json',
  'supabase_plugin_staging_schema_state_report.json',
  'supabase_plugin_staging_rls_state_report.json',
  'supabase_plugin_staging_deploy_strategy_report.json',
  'supabase_plugin_staging_schema_deploy_report.json',
  'supabase_plugin_staging_schema_verify_report.json',
  'supabase_plugin_staging_rls_verify_report.json',
  'trackb_backfill_preflight_after_plugin_schema_deploy.json',
  'trackb_backfill_diff_after_plugin_schema_deploy.json',
  'supabase_plugin_staging_deploy_blocker_report.json',
  'supabase_plugin_staging_deploy_readiness_report.json',
] as const

type PluginDeployBlocker =
  | 'source_of_truth_ownership_audit_failed'
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
  | 'plugin_schema_state_not_inspected'
  | 'plugin_rls_state_not_inspected'
  | 'forbidden_confirmation_set'

interface PluginDeployReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  plan: Record<string, unknown>
  targetPreflightReport: Record<string, unknown>
  schemaStateReport: Record<string, unknown>
  rlsStateReport: Record<string, unknown>
  deployStrategyReport: Record<string, unknown>
  schemaDeployReport: Record<string, unknown>
  schemaVerifyReport: Record<string, unknown>
  rlsVerifyReport: Record<string, unknown>
  trackBBackfillPreflightAfterPluginSchemaDeploy: Record<string, unknown>
  trackBBackfillDiffAfterPluginSchemaDeploy: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
}

const ROOT_SOURCE_FILES = [
  'README.md',
  'AGENTS.md',
  'product-plan.md',
  'intent-led-edit-planning.md',
  'pricing-and-credits.md',
  'supabase-schema-planning-bridge.md',
  'database-migration-readiness-checklist.md',
  'supabase-table-specification.md',
  'sql-migration-draft-review.md',
  'supabase-rls-policy-draft.md',
  'supabase-storage-bucket-draft.md',
  'migration-review-and-rls-hardening.md',
  'rls-hardening-matrix.md',
  'data-privacy-retention-plan.md',
  'supabase-production-test-readiness.md',
  'supabase-local-staging-test-plan.md',
] as const

const DOC_SOURCE_FILES = [
  'docs/activation-phase-roadmap.md',
  'docs/production-beta-readiness-scorecard.md',
  'docs/production-milestone-index.md',
  'docs/supabase-activation-milestone-registry-schema.md',
  'docs/supabase-activation-milestone-registry-rls-policy.md',
  'docs/supabase-activation-milestone-registry-staging-deployment.md',
  'docs/supabase-milestone-registry-staging-deploy-verify.md',
  'docs/supabase-milestone-registry-staging-credential-policy.md',
  'docs/supabase-trackb-backfill-rerun-after-staging-schema.md',
] as const

const UNSAFE_REPORT_PATTERNS = [
  /BEGIN PRIVATE KEY/i,
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]/i,
  /anon[_-]?key\s*[:=]/i,
  /provider[_-]?key\s*[:=]/i,
  /x-goog-signature=/i,
  /private-user-images\.githubusercontent\.com/i,
] as const

export function getSupabasePluginStagingDeployPlan() {
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    branch: SUPABASE_PLUGIN_STAGING_DEPLOY_BRANCH,
    baseBranch: SUPABASE_PLUGIN_STAGING_DEPLOY_BASE_BRANCH,
    prTitle: SUPABASE_PLUGIN_STAGING_DEPLOY_PR_TITLE,
    sourcePr196: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/196',
    sourcePr198: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/198',
    sourcePr200: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/200',
    sourcePr202: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/202',
    mode: 'plugin_assisted_staging_schema_deploy_verify_reporting_only_until_target_confirmed',
    reportDir: SUPABASE_PLUGIN_STAGING_DEPLOY_REPORT_DIR,
    expectedReports: SUPABASE_PLUGIN_STAGING_DEPLOY_EXPECTED_REPORTS,
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    supabaseCliDocs: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_DOCS_SOURCE,
    supabaseCliDocsAccessedAt: '2026-06-05',
    supabaseCliDocsPolicy: 'db_push_uses_migration_history_and_dry_run_before_apply',
    allowedConfirmations: SUPABASE_PLUGIN_ALLOWED_CONFIRMATIONS,
    forbiddenConfirmations: SUPABASE_PLUGIN_FORBIDDEN_CONFIRMATIONS,
    targetPolicy: {
      stagingTargetRequired: true,
      activeProjectNameAloneIsNotStagingProof: true,
      projectRefIsSafeMetadataButNotCommittedAsApproval: true,
      defaultBlocker: 'supabase_plugin_target_not_confirmed_as_staging',
    },
    deployStrategyOrder: [
      'cli_db_push',
      'plugin_migration_safe_apply',
      'blocked_no_migration_safe_deploy_path',
      'blocked_target_not_staging',
      'blocked_credentials_unavailable',
    ],
    noProductionSupabase: true,
    noTrackBBackfillWrites: true,
    noMilestoneDataInserts: true,
    noSeedDeploy: true,
    noDirectManualSqlDeploy: true,
    noProviderCalls: true,
    noRouteWorkerToolExecution: true,
    noMediaProcessing: true,
    noBetaProductionUnlock: true,
    noTrackA: true,
    nextRecommendedPhase: 'Resolve the exact staging target/credential/CLI blocker, or rerun PR #198 guarded Track B staging backfill after verified staging schema/RLS.',
  }
}

export async function buildSupabasePluginStagingDeployReports(overrides: {
  schemaDeployReport?: Record<string, unknown>
  schemaVerifyReport?: Record<string, unknown>
  rlsVerifyReport?: Record<string, unknown>
} = {}): Promise<PluginDeployReports> {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const targetPreflightReport = buildSupabasePluginTargetPreflight()
  const schemaStateReport = buildPluginSchemaStateReport(targetPreflightReport)
  const rlsStateReport = buildPluginRlsStateReport(targetPreflightReport, schemaStateReport)
  const cliReports = await buildSupabaseMilestoneRegistryStagingDeployReports()
  const deployStrategyReport = buildPluginDeployStrategyReport(targetPreflightReport, sourceOfTruthOwnershipAudit, cliReports)
  const schemaDeployReport = overrides.schemaDeployReport ?? buildDefaultPluginSchemaDeployReport(deployStrategyReport)
  const schemaVerifyReport = overrides.schemaVerifyReport ?? buildDefaultPluginSchemaVerifyReport(targetPreflightReport, schemaDeployReport)
  const rlsVerifyReport = overrides.rlsVerifyReport ?? buildDefaultPluginRlsVerifyReport(schemaVerifyReport)
  const backfillReports = buildSupabaseTrackBBackfillReports()
  const blockers = collectUniqueBlockers(
    extractBlockers(sourceOfTruthOwnershipAudit),
    extractBlockers(targetPreflightReport),
    extractBlockers(schemaStateReport),
    extractBlockers(rlsStateReport),
    extractBlockers(deployStrategyReport),
    extractBlockers(schemaDeployReport),
    extractBlockers(schemaVerifyReport),
    extractBlockers(rlsVerifyReport),
  )
  return {
    sourceOfTruthOwnershipAudit,
    plan: getSupabasePluginStagingDeployPlan(),
    targetPreflightReport,
    schemaStateReport,
    rlsStateReport,
    deployStrategyReport,
    schemaDeployReport,
    schemaVerifyReport,
    rlsVerifyReport,
    trackBBackfillPreflightAfterPluginSchemaDeploy: backfillReports.stagingSupabaseBackfillPreflightReport,
    trackBBackfillDiffAfterPluginSchemaDeploy: backfillReports.diffReport,
    blockerReport: buildPluginBlockerReport(blockers),
    readinessReport: buildPluginReadinessReport(schemaDeployReport, schemaVerifyReport, rlsVerifyReport, backfillReports, blockers),
  }
}

export async function writeSupabasePluginStagingDeployArtifacts(
  reports: PluginDeployReports,
  reportDir = SUPABASE_PLUGIN_STAGING_DEPLOY_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_staging_deploy_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_target_preflight_report.json'), reports.targetPreflightReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_staging_schema_state_report.json'), reports.schemaStateReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_staging_rls_state_report.json'), reports.rlsStateReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_staging_deploy_strategy_report.json'), reports.deployStrategyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_staging_schema_deploy_report.json'), reports.schemaDeployReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_staging_schema_verify_report.json'), reports.schemaVerifyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_staging_rls_verify_report.json'), reports.rlsVerifyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_preflight_after_plugin_schema_deploy.json'), reports.trackBBackfillPreflightAfterPluginSchemaDeploy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_diff_after_plugin_schema_deploy.json'), reports.trackBBackfillDiffAfterPluginSchemaDeploy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_staging_deploy_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_staging_deploy_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'supabase_plugin_staging_deploy_readiness_report.md'), renderPluginReadinessMarkdown(reports))
}

export async function readSupabasePluginStagingDeploySummary() {
  const reports = await buildSupabasePluginStagingDeployReports()
  const readiness = reports.readinessReport as { status?: string; stagingExecutionAllowed?: boolean; nextRecommendedPhase?: string }
  const blockers = reports.blockerReport as { activeBlockers?: string[] }
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: readiness.status,
    stagingExecutionAllowed: readiness.stagingExecutionAllowed,
    pluginTargetStatus: reports.targetPreflightReport.status,
    deployPerformed: reports.schemaDeployReport.deployPerformed === true,
    verificationPerformed: reports.schemaVerifyReport.verificationPerformed === true,
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

export async function executeSupabasePluginStagingDeploy(input: {
  keepTemp: boolean
}): Promise<{ reports: PluginDeployReports; exitCode: number }> {
  const initialReports = await buildSupabasePluginStagingDeployReports()
  const strategy = initialReports.deployStrategyReport as { selectedStrategy?: string; blockers?: string[] }
  if (strategy.selectedStrategy !== 'cli_db_push' || (strategy.blockers ?? []).length > 0) {
    await writeSupabasePluginStagingDeployArtifacts(initialReports)
    return { reports: initialReports, exitCode: 1 }
  }

  const cliResult = await executeSupabaseMilestoneRegistryStagingDeploy(input)
  const reports = await buildSupabasePluginStagingDeployReports({
    schemaDeployReport: {
      phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
      runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
      status: cliResult.reports.schemaDeployReport.status,
      deployPerformed: cliResult.reports.schemaDeployReport.deployPerformed === true,
      delegatedToPr202CliDeploy: true,
      delegatedReport: cliResult.reports.schemaDeployReport,
      pluginTargetConfirmedBeforeDelegation: true,
      credentialPayloadsPrinted: false,
      trackBRowsWritten: false,
      productionAffected: false,
      remoteSqlRun: false,
      directManualSqlRun: false,
      blockers: extractBlockers(cliResult.reports.schemaDeployReport),
    },
  })
  await writeSupabasePluginStagingDeployArtifacts(reports)
  return { reports, exitCode: cliResult.exitCode }
}

export async function executeSupabasePluginStagingVerify(): Promise<{ reports: PluginDeployReports; exitCode: number }> {
  const initialReports = await buildSupabasePluginStagingDeployReports()
  const target = initialReports.targetPreflightReport as { stagingTargetConfirmed?: boolean }
  const missingVerify = process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY !== 'true'
  if (!target.stagingTargetConfirmed || missingVerify || getForbiddenPluginConfirmations().length > 0) {
    const blockers = collectUniqueBlockers(
      extractBlockers(initialReports.targetPreflightReport),
      missingVerify ? ['staging_schema_verify_not_confirmed'] : [],
      getForbiddenPluginConfirmations().length > 0 ? ['forbidden_confirmation_set'] : [],
    )
    const reports = await buildSupabasePluginStagingDeployReports({
      schemaVerifyReport: {
        phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
        runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
        status: 'blocked',
        verificationPerformed: false,
        pluginReadOnlyCatalogInspectionPerformed: false,
        delegatedToPr202CliVerify: false,
        credentialPayloadsPrinted: false,
        productionAffected: false,
        remoteSqlRun: false,
        directManualSqlRun: false,
        blockers,
      },
      rlsVerifyReport: {
        phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
        runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
        status: 'blocked',
        verificationPerformed: false,
        credentialPayloadsPrinted: false,
        productionAffected: false,
        blockers,
      },
    })
    await writeSupabasePluginStagingDeployArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const cliResult = await executeSupabaseMilestoneRegistryStagingVerify()
  const reports = await buildSupabasePluginStagingDeployReports({
    schemaVerifyReport: {
      phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
      runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
      status: cliResult.reports.schemaVerificationReport.status,
      verificationPerformed: cliResult.reports.schemaVerificationReport.verificationPerformed === true,
      delegatedToPr202CliVerify: true,
      delegatedReport: cliResult.reports.schemaVerificationReport,
      pluginTargetConfirmedBeforeDelegation: true,
      credentialPayloadsPrinted: false,
      productionAffected: false,
      remoteSqlRun: false,
      directManualSqlRun: false,
      blockers: extractBlockers(cliResult.reports.schemaVerificationReport),
    },
    rlsVerifyReport: {
      phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
      runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
      status: cliResult.reports.rlsVerificationReport.status,
      verificationPerformed: cliResult.reports.rlsVerificationReport.verificationPerformed === true,
      delegatedToPr202CliVerify: true,
      delegatedReport: cliResult.reports.rlsVerificationReport,
      credentialPayloadsPrinted: false,
      productionAffected: false,
      blockers: extractBlockers(cliResult.reports.rlsVerificationReport),
    },
  })
  await writeSupabasePluginStagingDeployArtifacts(reports)
  return { reports, exitCode: cliResult.exitCode }
}

export function buildSourceOfTruthOwnershipAudit() {
  const rootSources = ROOT_SOURCE_FILES.map((file) => ({ file, exists: existsSync(file), requiredByAgents: true }))
  const docSources = DOC_SOURCE_FILES.map((file) => ({ file, exists: existsSync(file), requiredForThisPhase: true }))
  const migrationExists = existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH)
  const migrationText = migrationExists ? readFileSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH, 'utf8') : ''
  const requiredTablesPresent = SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) => migrationText.includes(`public.${table}`))
  const unsafeMigrationText = UNSAFE_REPORT_PATTERNS.some((pattern) => pattern.test(migrationText))
  const blockers: PluginDeployBlocker[] = migrationExists && requiredTablesPresent.length === SUPABASE_MILESTONE_REGISTRY_TABLES.length && !unsafeMigrationText
    ? []
    : ['source_of_truth_ownership_audit_failed']
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    auditDate: '2026-06-05',
    worktreeRequired: '/private/tmp/reeditpro-supabase-plugin-staging-schema-deploy-verify',
    branch: SUPABASE_PLUGIN_STAGING_DEPLOY_BRANCH,
    baseBranch: SUPABASE_PLUGIN_STAGING_DEPLOY_BASE_BRANCH,
    reviewedPrs: [
      { pr: 196, role: 'Track B readiness rollup export source', expectedHead: 'codex/rp-trackb-readiness-rollup-supabase-milestone-export' },
      { pr: 198, role: 'Track B staging backfill path, no writes in this phase', expectedHead: 'codex/rp-foundation-supabase-trackb-milestone-staging-backfill' },
      { pr: 200, role: 'Activation milestone registry schema/RLS migration owner', expectedHead: 'codex/rp-foundation-supabase-milestone-registry-schema-rls' },
      { pr: 202, role: 'CLI staging deploy/verify predecessor', expectedHead: 'codex/rp-foundation-supabase-milestone-registry-staging-deploy-verify' },
    ],
    ownership: {
      thisPhaseOwns: 'plugin-assisted staging target/deploy/verify reports and fail-closed policy only',
      pr200Owns: 'registry schema/RLS migration',
      pr198Owns: 'future Track B staging metadata backfill',
      pr196Owns: 'Track B safe milestone export',
      productionPromotionOwns: 'future production approval, not this phase',
    },
    rootSources,
    docSources,
    missingRootSources: rootSources.filter((source) => !source.exists).map((source) => source.file),
    missingDocSources: docSources.filter((source) => !source.exists).map((source) => source.file),
    migration: {
      path: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
      exists: migrationExists,
      requiredTablesExpected: SUPABASE_MILESTONE_REGISTRY_TABLES,
      requiredTablesPresent,
      unsafeMigrationTextDetected: unsafeMigrationText,
    },
    packageLockPolicy: 'must_remain_unchanged',
    secretsCommitted: false,
    remoteSqlRun: false,
    productionAffected: false,
    trackBBackfillWrites: false,
    blockers,
  }
}

export function buildPluginSchemaStateReport(targetPreflightReport = buildSupabasePluginTargetPreflight()) {
  const target = targetPreflightReport as { stagingTargetConfirmed?: boolean; blockers?: string[] }
  const migrationObserved = (OBSERVED_SUPABASE_PLUGIN_MIGRATIONS as readonly string[]).includes(SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID)
  const blockers: PluginDeployBlocker[] = target.stagingTargetConfirmed
    ? migrationObserved ? [] : ['plugin_schema_state_not_inspected']
    : ['supabase_plugin_target_not_confirmed_as_staging', 'plugin_schema_state_not_inspected']
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    targetConfirmedStaging: target.stagingTargetConfirmed === true,
    schemaInspectionPerformed: target.stagingTargetConfirmed === true && migrationObserved,
    pluginReadOnlyCatalogSqlRun: false,
    reason: target.stagingTargetConfirmed
      ? 'plugin_observed_migration_history_safe_metadata_only'
      : 'target_not_confirmed_as_staging_no_schema_inspection_allowed',
    observedMigrationIds: OBSERVED_SUPABASE_PLUGIN_MIGRATIONS,
    registryMigrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    registryMigrationObserved: migrationObserved,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    tableState: target.stagingTargetConfirmed ? 'not_inspected_by_repo_cli' : 'blocked_until_staging_target_confirmed',
    credentialPayloadsPrinted: false,
    productionAffected: false,
    remoteSqlRun: false,
    blockers: collectUniqueBlockers(target.blockers ?? [], blockers),
  }
}

export function buildPluginRlsStateReport(
  targetPreflightReport = buildSupabasePluginTargetPreflight(),
  schemaStateReport = buildPluginSchemaStateReport(targetPreflightReport),
) {
  const target = targetPreflightReport as { stagingTargetConfirmed?: boolean; blockers?: string[] }
  const schema = schemaStateReport as { status?: string; blockers?: string[] }
  const blockers: PluginDeployBlocker[] = target.stagingTargetConfirmed && schema.status === 'passed'
    ? []
    : ['supabase_plugin_target_not_confirmed_as_staging', 'plugin_rls_state_not_inspected']
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    targetConfirmedStaging: target.stagingTargetConfirmed === true,
    rlsInspectionPerformed: blockers.length === 0,
    pluginReadOnlyCatalogSqlRun: false,
    reason: blockers.length === 0
      ? 'staging_schema_confirmed_and_rls_catalog_verification_may_run_in_verify_phase'
      : 'target_not_confirmed_as_staging_no_rls_inspection_allowed',
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    rlsExpectedEnabled: SUPABASE_MILESTONE_REGISTRY_TABLES,
    publicAnonAuthenticatedRevokesExpected: true,
    serviceRoleOnlyGrantExpected: true,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(target.blockers ?? [], schema.blockers ?? [], blockers),
  }
}

function buildPluginDeployStrategyReport(
  targetPreflightReport: Record<string, unknown>,
  sourceAudit: Record<string, unknown>,
  cliReports: Awaited<ReturnType<typeof buildSupabaseMilestoneRegistryStagingDeployReports>>,
) {
  const target = targetPreflightReport as { stagingTargetConfirmed?: boolean; blockers?: string[] }
  const source = sourceAudit as { status?: string; blockers?: string[] }
  const credentialPreflight = cliReports.credentialPreflight as { status?: string; dbUrlProvided?: boolean; targetConfirmed?: boolean; blockers?: string[] }
  const cliPreflight = cliReports.cliPreflight as { status?: string; blockers?: string[] }
  const blockers = new Set<PluginDeployBlocker>()
  for (const blocker of source.blockers ?? []) blockers.add(blocker as PluginDeployBlocker)
  for (const blocker of target.blockers ?? []) blockers.add(blocker as PluginDeployBlocker)
  if (source.status !== 'passed') blockers.add('source_of_truth_ownership_audit_failed')
  if (!target.stagingTargetConfirmed) blockers.add('blocked_target_not_staging')
  if (!credentialPreflight.dbUrlProvided) blockers.add('blocked_credentials_unavailable')
  if (cliPreflight.status !== 'passed') blockers.add('cli_db_push_unavailable')

  const cliReady = target.stagingTargetConfirmed === true && credentialPreflight.dbUrlProvided === true && cliPreflight.status === 'passed'
  const pluginMigrationSafeApplyAvailable = process.env.REEDITPRO_SUPABASE_PLUGIN_MIGRATION_SAFE_APPLY_AVAILABLE === 'true'
  let selectedStrategy = 'blocked_target_not_staging'
  if (cliReady) selectedStrategy = 'cli_db_push'
  else if (target.stagingTargetConfirmed && pluginMigrationSafeApplyAvailable) selectedStrategy = 'plugin_migration_safe_apply'
  else if (target.stagingTargetConfirmed) selectedStrategy = 'blocked_no_migration_safe_deploy_path'

  if (selectedStrategy === 'plugin_migration_safe_apply') {
    blockers.add('plugin_migration_safe_apply_unavailable_from_repo_cli')
  }
  if (selectedStrategy === 'blocked_no_migration_safe_deploy_path') {
    blockers.add('blocked_no_migration_safe_deploy_path')
  }

  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: blockers.size === 0 ? 'passed' : 'blocked',
    selectedStrategy,
    strategyOrder: [
      'cli_db_push',
      'plugin_migration_safe_apply',
      'blocked_no_migration_safe_deploy_path',
      'blocked_target_not_staging',
      'blocked_credentials_unavailable',
    ],
    cliDbPush: {
      available: cliPreflight.status === 'passed',
      stagingDbUrlProvided: credentialPreflight.dbUrlProvided === true,
      stagingTargetConfirmedByPlugin: target.stagingTargetConfirmed === true,
      dryRunRequiredBeforeApply: true,
      sourceReport: 'docs/activation-supabase-milestone-registry-staging-deploy-reports/staging_credential_preflight_report.json',
    },
    pluginMigrationSafeApply: {
      availableToRepoCli: false,
      operatorPluginToolAvailableInCodexSession: true,
      allowedOnlyWhenTargetConfirmedStaging: true,
      directSqlFallbackAllowed: false,
      status: pluginMigrationSafeApplyAvailable ? 'blocked_requires_operator_plugin_execution_not_repo_cli' : 'not_available',
    },
    blockedNoMigrationSafeDeployPathWhenOnlyDirectSqlExists: true,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    trackBRowsWritten: false,
    blockers: [...blockers],
  }
}

function buildDefaultPluginSchemaDeployReport(deployStrategyReport: Record<string, unknown>) {
  const strategy = deployStrategyReport as { selectedStrategy?: string; blockers?: string[] }
  const missingDeployConfirmations = [
    'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
    'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  ].filter((name) => process.env[name] !== 'true')
  const blockers = collectUniqueBlockers(
    strategy.blockers ?? [],
    missingDeployConfirmations.length > 0 ? ['staging_schema_deploy_not_confirmed'] : [],
    ['staging_schema_deploy_not_run'],
  )
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: 'blocked',
    selectedStrategy: strategy.selectedStrategy,
    deployPerformed: false,
    dryRunPerformed: false,
    pluginMigrationSafeApplyPerformed: false,
    cliDbPushDelegated: false,
    reason: 'blocked_before_plugin_assisted_staging_deploy',
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    requiredConfirmations: [
      SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
      'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
      'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
    ],
    missingConfirmations: missingDeployConfirmations,
    credentialPayloadsPrinted: false,
    trackBRowsWritten: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    blockers,
  }
}

function buildDefaultPluginSchemaVerifyReport(
  targetPreflightReport: Record<string, unknown>,
  schemaDeployReport: Record<string, unknown>,
) {
  const target = targetPreflightReport as { stagingTargetConfirmed?: boolean; blockers?: string[] }
  const missingVerifyConfirmation = process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY !== 'true'
  const blockers = collectUniqueBlockers(
    target.blockers ?? [],
    extractBlockers(schemaDeployReport),
    missingVerifyConfirmation ? ['staging_schema_verify_not_confirmed'] : [],
    ['staging_schema_verification_not_run'],
  )
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    pluginReadOnlyCatalogInspectionPerformed: false,
    delegatedToPr202CliVerify: false,
    reason: target.stagingTargetConfirmed
      ? 'verify_requires_deploy_evidence_and_current_shell_confirmation'
      : 'target_not_confirmed_as_staging_no_verification_allowed',
    requiredConfirmations: [
      SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
      'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
    ],
    allowlistedReadOnlyCatalogQueries: [
      'information_schema.tables registry table presence',
      'pg_class relrowsecurity for registry tables',
      'information_schema.role_table_grants public/anon/authenticated/service_role checks',
      'pg_indexes and pg_constraint registry metadata checks',
    ],
    credentialPayloadsPrinted: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    blockers,
  }
}

function buildDefaultPluginRlsVerifyReport(schemaVerifyReport: Record<string, unknown>) {
  const blockers = collectUniqueBlockers(extractBlockers(schemaVerifyReport), ['staging_schema_verification_not_run'])
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    pluginReadOnlyCatalogInspectionPerformed: false,
    reason: 'schema_verification_not_passed',
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    rlsExpectedEnabled: SUPABASE_MILESTONE_REGISTRY_TABLES,
    publicAnonAuthenticatedRevokesExpected: true,
    serviceRoleOnlyGrantExpected: true,
    credentialPayloadsPrinted: false,
    productionAffected: false,
    blockers,
  }
}

function buildPluginBlockerReport(blockers: PluginDeployBlocker[]) {
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    expectedCurrentEnvironmentBlocker: 'supabase_plugin_target_not_confirmed_as_staging',
    operatorActionRequired: blockers.includes('supabase_plugin_target_not_confirmed_as_staging') || blockers.includes('blocked_target_not_staging')
      ? 'Provide explicit staging target proof or use a Supabase staging branch/project before rerun.'
      : 'Review remaining blockers.',
    stillBlockedScopes: [
      'track_b_backfill_write',
      'milestone_data_insert',
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

function buildPluginReadinessReport(
  schemaDeployReport: Record<string, unknown>,
  schemaVerifyReport: Record<string, unknown>,
  rlsVerifyReport: Record<string, unknown>,
  backfillReports: ReturnType<typeof buildSupabaseTrackBBackfillReports>,
  blockers: PluginDeployBlocker[],
) {
  const stagingVerified = schemaDeployReport.status === 'passed' && schemaVerifyReport.status === 'passed' && rlsVerifyReport.status === 'passed'
  const backfillSchemaCheck = backfillReports.registrySchemaCheck as { status?: string; blockers?: string[] }
  const backfillRlsCheck = backfillReports.registryRlsCheck as { status?: string; blockers?: string[] }
  return {
    phase: SUPABASE_PLUGIN_STAGING_DEPLOY_PHASE,
    runId: SUPABASE_PLUGIN_STAGING_DEPLOY_RUN_ID,
    status: stagingVerified ? 'passed' : 'blocked',
    stagingExecutionAllowed: blockers.length === 0,
    pluginTargetRequired: true,
    pluginTargetConfirmed: !blockers.includes('supabase_plugin_target_not_confirmed_as_staging') && !blockers.includes('blocked_target_not_staging'),
    schemaDeployStatus: schemaDeployReport.status,
    schemaVerifyStatus: schemaVerifyReport.status,
    rlsVerifyStatus: rlsVerifyReport.status,
    pr198SchemaCheckStatusAfterPluginSchemaDeploy: backfillSchemaCheck.status,
    pr198RlsCheckStatusAfterPluginSchemaDeploy: backfillRlsCheck.status,
    pr198BackfillRowsWritten: false,
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
      : 'Resolve the exact staging target/credential/CLI/plugin migration-safe path blocker before rerunning deploy/verify.',
  }
}

function renderPluginReadinessMarkdown(reports: PluginDeployReports) {
  const readiness = reports.readinessReport as { status?: string; blockers?: string[]; nextRecommendedPhase?: string }
  return [
    '# Supabase Plugin Staging Deploy Readiness',
    '',
    `Status: \`${readiness.status ?? 'blocked'}\``,
    '',
    'This report is safe metadata only. It does not include DB URLs, tokens, service-role keys, anon keys, signed URLs, private payloads, or raw Supabase output.',
    '',
    `Active blockers: ${(readiness.blockers ?? []).map((blocker) => `\`${blocker}\``).join(', ') || 'none'}`,
    '',
    `Next: ${readiness.nextRecommendedPhase ?? 'Resolve blockers and rerun.'}`,
    '',
  ].join('\n')
}

function extractBlockers(report: Record<string, unknown>): PluginDeployBlocker[] {
  const blockers = Array.isArray(report.blockers) ? report.blockers : Array.isArray(report.activeBlockers) ? report.activeBlockers : []
  return blockers.filter((blocker): blocker is PluginDeployBlocker => typeof blocker === 'string') as PluginDeployBlocker[]
}

function collectUniqueBlockers(...groups: Array<readonly string[]>): PluginDeployBlocker[] {
  const blockers = new Set<PluginDeployBlocker>()
  for (const group of groups) {
    for (const blocker of group) blockers.add(blocker as PluginDeployBlocker)
  }
  return [...blockers]
}
