import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
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
  SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
  buildSupabasePluginStagingDeployReports,
  executeSupabasePluginStagingDeploy,
  executeSupabasePluginStagingVerify,
} from './milestone-registry-supabase-plugin-deploy-plan'
import {
  SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
  buildApprovedStagingTargetReferenceReport,
} from './milestone-registry-approved-staging-target-reference'
import {
  OBSERVED_SUPABASE_PLUGIN_MIGRATIONS,
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
  buildSupabasePluginTargetPreflight,
} from './milestone-registry-staging-target-policy'

export const SUPABASE_STAGING_TARGET_PROOF_PHASE = 'supabase-staging-target-proof-deploy-rerun'
export const SUPABASE_STAGING_TARGET_PROOF_RUN_ID = 'supabase-staging-target-proof-deploy-rerun-20260605'
export const SUPABASE_STAGING_TARGET_PROOF_BRANCH = 'codex/rp-foundation-supabase-staging-target-proof-deploy-rerun'
export const SUPABASE_STAGING_TARGET_PROOF_BASE_BRANCH = 'codex/rp-foundation-supabase-plugin-staging-schema-deploy-verify'
export const SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR = 'docs/activation-supabase-staging-target-proof-reports'
export const SUPABASE_STAGING_TARGET_PROOF_PR_TITLE = '[foundation] Supabase staging target proof deploy rerun'

export const SUPABASE_STAGING_TARGET_PROOF_ALLOWED_CONFIRMATIONS = [
  SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
] as const

export const SUPABASE_STAGING_TARGET_PROOF_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
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

export const SUPABASE_STAGING_TARGET_PROOF_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'supabase_staging_target_proof_plan.json',
  'approved_staging_target_reference_report.json',
  'supabase_plugin_target_proof_report.json',
  'supabase_staging_target_proof_deploy_strategy_report.json',
  'supabase_staging_schema_deploy_rerun_report.json',
  'supabase_staging_schema_verify_after_target_proof_report.json',
  'supabase_staging_rls_verify_after_target_proof_report.json',
  'trackb_backfill_preflight_after_target_proof_schema_deploy.json',
  'trackb_backfill_diff_after_target_proof_schema_deploy.json',
  'supabase_staging_target_proof_blocker_report.json',
  'supabase_staging_target_proof_readiness_report.json',
  'supabase_staging_target_proof_private_artifact_manifest.json',
] as const

type TargetProofBlocker =
  | 'source_of_truth_ownership_audit_failed'
  | 'approved_staging_target_reference_missing'
  | 'supabase_plugin_target_not_confirmed_as_staging'
  | 'supabase_plugin_project_ref_mismatch'
  | 'supabase_plugin_staging_target_check_not_confirmed'
  | 'blocked_target_not_staging'
  | 'staging_schema_deploy_not_confirmed'
  | 'staging_schema_verify_not_confirmed'
  | 'staging_schema_deploy_not_run'
  | 'staging_schema_verification_not_run'
  | 'forbidden_confirmation_set'

interface TargetProofReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  plan: Record<string, unknown>
  approvedTargetReferenceReport: Record<string, unknown>
  pluginTargetProofReport: Record<string, unknown>
  deployStrategyReport: Record<string, unknown>
  schemaDeployRerunReport: Record<string, unknown>
  schemaVerifyAfterTargetProofReport: Record<string, unknown>
  rlsVerifyAfterTargetProofReport: Record<string, unknown>
  trackBBackfillPreflightAfterTargetProofSchemaDeploy: Record<string, unknown>
  trackBBackfillDiffAfterTargetProofSchemaDeploy: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}

const SOURCE_OF_TRUTH_FILES = [
  'AGENTS.md',
  'supabase-schema-planning-bridge.md',
  'database-migration-readiness-checklist.md',
  'supabase-table-specification.md',
  'migration-review-and-rls-hardening.md',
  'rls-hardening-matrix.md',
  'data-privacy-retention-plan.md',
  'supabase-production-test-readiness.md',
  'supabase-local-staging-test-plan.md',
  'docs/activation-phase-roadmap.md',
  'docs/supabase-plugin-staging-target-policy.md',
  'docs/supabase-plugin-staging-milestone-registry-deploy-verify.md',
  'docs/supabase-milestone-registry-staging-deploy-verify.md',
] as const

const UNSAFE_PATTERNS = [
  /BEGIN PRIVATE KEY/i,
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]/i,
  /anon[_-]?key\s*[:=]/i,
  /access[_-]?token\s*[:=]/i,
  /password\s*[:=]/i,
] as const

export function getSupabaseStagingTargetProofPlan() {
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    branch: SUPABASE_STAGING_TARGET_PROOF_BRANCH,
    baseBranch: SUPABASE_STAGING_TARGET_PROOF_BASE_BRANCH,
    prTitle: SUPABASE_STAGING_TARGET_PROOF_PR_TITLE,
    sourcePr198: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/198',
    sourcePr200: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/200',
    sourcePr202: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/202',
    sourcePr206: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/206',
    mode: 'non_secret_staging_target_proof_and_guarded_deploy_rerun_wrapper',
    reportDir: SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_TARGET_PROOF_EXPECTED_REPORTS,
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    allowedConfirmations: SUPABASE_STAGING_TARGET_PROOF_ALLOWED_CONFIRMATIONS,
    forbiddenConfirmations: SUPABASE_STAGING_TARGET_PROOF_FORBIDDEN_CONFIRMATIONS,
    proofRequires: [
      'approved staging project ref/name from repo-safe source',
      'plugin target metadata matching approved staging reference',
      'no production or ambiguous target signal',
      'no secret payload viewed or printed',
    ],
    deployDelegation: {
      delegatesToExistingPr206PathOnlyAfterProofPasses: true,
      migrationSafeWorkflowOnly: true,
      migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
      deploySeeds: false,
      deployTrackBExportRows: false,
      deployUnrelatedMigrations: false,
      rawAdHocSql: false,
    },
    noProductionSupabase: true,
    noTrackBBackfillWrites: true,
    noProviderCalls: true,
    noRouteWorkerToolExecution: true,
    noMediaProcessing: true,
    noBetaProductionUnlock: true,
    noTrackA: true,
    defaultExpectedBlockers: [
      'approved_staging_target_reference_missing',
      'supabase_plugin_target_not_confirmed_as_staging',
    ],
    nextRecommendedPhase: 'If target proof remains blocked, add a non-secret approved staging target reference. If proof and deploy/verify pass, rerun PR #198 guarded Track B staging backfill.',
  }
}

export function getSupabaseStagingTargetProofIamPlan() {
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: 'no_iam_mutation_allowed',
    supabaseTargetProof: 'metadata_only',
    secrets: 'not_read_or_printed',
    productionCredentialUse: 'blocked',
    stagingSchemaMutation: 'delegated_only_after_target_proof_and_confirmations',
    trackBBackfillWrite: 'blocked',
    gcpIamMutation: 'blocked',
  }
}

export function getSupabaseStagingTargetProofCostSummary() {
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: 'metadata_report_negligible_cost',
    estimatedCloudCostUsd: 0,
    billingApiCalls: 'not_run',
    remoteSqlRun: false,
    providerCalls: 'not_run',
    mediaProcessing: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    productionAffected: false,
  }
}

export async function buildSupabaseStagingTargetProofReports(overrides: {
  schemaDeployRerunReport?: Record<string, unknown>
  schemaVerifyAfterTargetProofReport?: Record<string, unknown>
  rlsVerifyAfterTargetProofReport?: Record<string, unknown>
} = {}): Promise<TargetProofReports> {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const approvedTargetReferenceReport = buildApprovedStagingTargetReferenceReport()
  const pluginTargetProofReport = buildPluginTargetProofReport(approvedTargetReferenceReport)
  const pluginReports = await buildSupabasePluginStagingDeployReports()
  const deployStrategyReport = buildDeployStrategyReport(
    sourceOfTruthOwnershipAudit,
    approvedTargetReferenceReport,
    pluginTargetProofReport,
    pluginReports.deployStrategyReport,
  )
  const schemaDeployRerunReport = overrides.schemaDeployRerunReport ?? buildDefaultSchemaDeployRerunReport(deployStrategyReport)
  const schemaVerifyAfterTargetProofReport =
    overrides.schemaVerifyAfterTargetProofReport ?? buildDefaultSchemaVerifyAfterTargetProofReport(pluginTargetProofReport, schemaDeployRerunReport)
  const rlsVerifyAfterTargetProofReport =
    overrides.rlsVerifyAfterTargetProofReport ?? buildDefaultRlsVerifyAfterTargetProofReport(schemaVerifyAfterTargetProofReport)
  const backfillReports = buildSupabaseTrackBBackfillReports()
  const blockers = collectUniqueBlockers(
    extractBlockers(sourceOfTruthOwnershipAudit),
    extractBlockers(approvedTargetReferenceReport),
    extractBlockers(pluginTargetProofReport),
    extractBlockers(deployStrategyReport),
    extractBlockers(schemaDeployRerunReport),
    extractBlockers(schemaVerifyAfterTargetProofReport),
    extractBlockers(rlsVerifyAfterTargetProofReport),
  )
  return {
    sourceOfTruthOwnershipAudit,
    plan: getSupabaseStagingTargetProofPlan(),
    approvedTargetReferenceReport,
    pluginTargetProofReport,
    deployStrategyReport,
    schemaDeployRerunReport,
    schemaVerifyAfterTargetProofReport,
    rlsVerifyAfterTargetProofReport,
    trackBBackfillPreflightAfterTargetProofSchemaDeploy: backfillReports.stagingSupabaseBackfillPreflightReport,
    trackBBackfillDiffAfterTargetProofSchemaDeploy: backfillReports.diffReport,
    blockerReport: buildBlockerReport(blockers),
    readinessReport: buildReadinessReport(schemaDeployRerunReport, schemaVerifyAfterTargetProofReport, rlsVerifyAfterTargetProofReport, blockers),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeSupabaseStagingTargetProofArtifacts(
  reports: TargetProofReports,
  reportDir = SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_target_proof_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'approved_staging_target_reference_report.json'), reports.approvedTargetReferenceReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_plugin_target_proof_report.json'), reports.pluginTargetProofReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_target_proof_deploy_strategy_report.json'), reports.deployStrategyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_schema_deploy_rerun_report.json'), reports.schemaDeployRerunReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_schema_verify_after_target_proof_report.json'), reports.schemaVerifyAfterTargetProofReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_rls_verify_after_target_proof_report.json'), reports.rlsVerifyAfterTargetProofReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_preflight_after_target_proof_schema_deploy.json'), reports.trackBBackfillPreflightAfterTargetProofSchemaDeploy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_backfill_diff_after_target_proof_schema_deploy.json'), reports.trackBBackfillDiffAfterTargetProofSchemaDeploy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_target_proof_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_target_proof_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_staging_target_proof_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'supabase_staging_target_proof_readiness_report.md'), renderReadinessMarkdown(reports))
}

export async function readSupabaseStagingTargetProofSummary() {
  const reports = await buildSupabaseStagingTargetProofReports()
  const blockers = reports.blockerReport as { activeBlockers?: string[] }
  const readiness = reports.readinessReport as { status?: string; stagingDeployAllowed?: boolean; nextRecommendedPhase?: string }
  const proof = reports.pluginTargetProofReport as { stagingTargetProofPassed?: boolean }
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: readiness.status,
    stagingTargetProofPassed: proof.stagingTargetProofPassed,
    stagingDeployAllowed: readiness.stagingDeployAllowed,
    remoteSqlRun: false,
    migrationApplied: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    trackA: 'not_touched',
    activeBlockers: blockers.activeBlockers,
    nextRecommendedPhase: readiness.nextRecommendedPhase,
  }
}

export async function executeSupabaseStagingTargetProofDeploy(input: {
  keepTemp: boolean
}): Promise<{ reports: TargetProofReports; exitCode: number }> {
  const initialReports = await buildSupabaseStagingTargetProofReports()
  const strategy = initialReports.deployStrategyReport as { selectedStrategy?: string; blockers?: string[] }
  if (strategy.selectedStrategy !== 'delegate_to_pr206_plugin_deploy' || (strategy.blockers ?? []).length > 0) {
    await writeSupabaseStagingTargetProofArtifacts(initialReports)
    return { reports: initialReports, exitCode: 1 }
  }

  const result = await executeSupabasePluginStagingDeploy(input)
  const reports = await buildSupabaseStagingTargetProofReports({
    schemaDeployRerunReport: {
      phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
      runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
      status: result.reports.schemaDeployReport.status,
      deployPerformed: result.reports.schemaDeployReport.deployPerformed === true,
      delegatedToPr206PluginDeploy: true,
      delegatedReport: result.reports.schemaDeployReport,
      credentialPayloadsPrinted: false,
      secretPayloadsRead: false,
      productionAffected: false,
      trackBRowsWritten: false,
      remoteSqlRun: false,
      directManualSqlRun: false,
      blockers: extractBlockers(result.reports.schemaDeployReport),
    },
  })
  await writeSupabaseStagingTargetProofArtifacts(reports)
  return { reports, exitCode: result.exitCode }
}

export async function executeSupabaseStagingTargetProofVerify(): Promise<{ reports: TargetProofReports; exitCode: number }> {
  const initialReports = await buildSupabaseStagingTargetProofReports()
  const proof = initialReports.pluginTargetProofReport as { stagingTargetProofPassed?: boolean; blockers?: string[] }
  if (!proof.stagingTargetProofPassed || process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY !== 'true') {
    const blockers = collectUniqueBlockers(
      proof.blockers ?? [],
      process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY !== 'true'
        ? ['staging_schema_verify_not_confirmed']
        : [],
      ['staging_schema_verification_not_run'],
    )
    const reports = await buildSupabaseStagingTargetProofReports({
      schemaVerifyAfterTargetProofReport: buildBlockedVerifyReport(blockers),
      rlsVerifyAfterTargetProofReport: buildBlockedRlsVerifyReport(blockers),
    })
    await writeSupabaseStagingTargetProofArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const result = await executeSupabasePluginStagingVerify()
  const reports = await buildSupabaseStagingTargetProofReports({
    schemaVerifyAfterTargetProofReport: {
      phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
      runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
      status: result.reports.schemaVerifyReport.status,
      verificationPerformed: result.reports.schemaVerifyReport.verificationPerformed === true,
      delegatedToPr206PluginVerify: true,
      delegatedReport: result.reports.schemaVerifyReport,
      credentialPayloadsPrinted: false,
      secretPayloadsRead: false,
      productionAffected: false,
      remoteSqlRun: false,
      directManualSqlRun: false,
      blockers: extractBlockers(result.reports.schemaVerifyReport),
    },
    rlsVerifyAfterTargetProofReport: {
      phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
      runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
      status: result.reports.rlsVerifyReport.status,
      verificationPerformed: result.reports.rlsVerifyReport.verificationPerformed === true,
      delegatedToPr206PluginVerify: true,
      delegatedReport: result.reports.rlsVerifyReport,
      credentialPayloadsPrinted: false,
      secretPayloadsRead: false,
      productionAffected: false,
      blockers: extractBlockers(result.reports.rlsVerifyReport),
    },
  })
  await writeSupabaseStagingTargetProofArtifacts(reports)
  return { reports, exitCode: result.exitCode }
}

function buildSourceOfTruthOwnershipAudit() {
  const sourceFiles = SOURCE_OF_TRUTH_FILES.map((file) => {
    const exists = existsSync(file)
    const text = exists ? readFileSync(file, 'utf8') : ''
    return {
      file,
      exists,
      unsafeSecretLikeTextDetected: UNSAFE_PATTERNS.some((pattern) => pattern.test(text)),
    }
  })
  const migrationExists = existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH)
  const migrationText = migrationExists ? readFileSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH, 'utf8') : ''
  const requiredTablesPresent = SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) => migrationText.includes(`public.${table}`))
  const blockers = new Set<TargetProofBlocker>()
  if (!migrationExists || requiredTablesPresent.length !== SUPABASE_MILESTONE_REGISTRY_TABLES.length) {
    blockers.add('source_of_truth_ownership_audit_failed')
  }
  if (sourceFiles.some((source) => source.unsafeSecretLikeTextDetected)) blockers.add('source_of_truth_ownership_audit_failed')
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: blockers.size === 0 ? 'passed' : 'blocked',
    auditDate: '2026-06-05',
    branch: SUPABASE_STAGING_TARGET_PROOF_BRANCH,
    baseBranch: SUPABASE_STAGING_TARGET_PROOF_BASE_BRANCH,
    reviewedPrs: [
      { pr: 198, role: 'future guarded Track B staging backfill, no write in this phase' },
      { pr: 200, role: 'activation milestone registry schema/RLS migration owner' },
      { pr: 202, role: 'CLI staging deploy/verify predecessor' },
      { pr: 206, role: 'plugin-assisted staging deploy verifier and current base' },
    ],
    ownership: {
      thisPhaseOwns: 'staging target proof packet and deploy-rerun wrapper only',
      pr206Owns: 'existing plugin-assisted deploy/verify policy and reports',
      pr200Owns: 'registry schema/RLS migration',
      pr198Owns: 'future Track B milestone metadata backfill',
    },
    sourceFiles,
    migration: {
      path: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
      exists: migrationExists,
      requiredTablesExpected: SUPABASE_MILESTONE_REGISTRY_TABLES,
      requiredTablesPresent,
    },
    productionAffected: false,
    remoteSqlRun: false,
    trackBBackfillRowsWritten: false,
    blockers: [...blockers],
  }
}

function buildPluginTargetProofReport(approvedReference = buildApprovedStagingTargetReferenceReport()) {
  const pluginPreflight = buildSupabasePluginTargetPreflight()
  const selectedProject = pluginPreflight.selectedProject as { projectRef?: string; projectName?: string; status?: string; region?: string }
  const blockers = new Set<TargetProofBlocker>()
  for (const blocker of approvedReference.blockers ?? []) blockers.add(blocker as TargetProofBlocker)
  for (const blocker of pluginPreflight.blockers ?? []) blockers.add(blocker as TargetProofBlocker)
  const refMatches =
    approvedReference.status === 'passed' &&
    approvedReference.approvedStagingProjectRef === selectedProject.projectRef &&
    approvedReference.approvedEnvironment === 'staging'
  if (!refMatches) blockers.add('supabase_plugin_target_not_confirmed_as_staging')
  const stagingTargetProofPassed =
    approvedReference.status === 'passed' &&
    refMatches &&
    pluginPreflight.stagingTargetConfirmed === true &&
    pluginPreflight.secretsRead === false &&
    pluginPreflight.credentialPayloadsPrinted === false
  if (!stagingTargetProofPassed) blockers.add('blocked_target_not_staging')

  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: stagingTargetProofPassed ? 'passed' : 'blocked',
    proofConfirmation: SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
    proofConfirmationSet: process.env[SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION] === 'true',
    pluginTargetCheckConfirmation: SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
    pluginTargetCheckConfirmed: pluginPreflight.targetCheckConfirmed === true,
    approvedReference,
    pluginPreflight,
    selectedPluginProject: {
      projectRef: selectedProject.projectRef ?? 'unknown',
      projectName: selectedProject.projectName ?? 'unknown',
      status: selectedProject.status ?? 'unknown',
      region: selectedProject.region ?? 'unknown',
      hostRedacted: true,
    },
    observedPluginMigrations: OBSERVED_SUPABASE_PLUGIN_MIGRATIONS,
    registryMigrationObserved: (OBSERVED_SUPABASE_PLUGIN_MIGRATIONS as readonly string[]).includes(SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID),
    approvedReferenceMatchesPluginTarget: refMatches,
    stagingTargetProofPassed,
    productionSignalDetected: false,
    ambiguousTargetSignal: !stagingTargetProofPassed,
    secretPayloadsRead: false,
    secretPayloadsPrinted: false,
    blockers: [...blockers],
  }
}

function buildDeployStrategyReport(
  sourceAudit: Record<string, unknown>,
  approvedReference: Record<string, unknown>,
  proofReport: Record<string, unknown>,
  pr206DeployStrategy: Record<string, unknown>,
) {
  const source = sourceAudit as { status?: string; blockers?: string[] }
  const approved = approvedReference as { status?: string; blockers?: string[] }
  const proof = proofReport as { stagingTargetProofPassed?: boolean; blockers?: string[] }
  const pr206 = pr206DeployStrategy as { selectedStrategy?: string; blockers?: string[] }
  const blockers = collectUniqueBlockers(source.blockers ?? [], approved.blockers ?? [], proof.blockers ?? [])
  if (source.status !== 'passed') blockers.push('source_of_truth_ownership_audit_failed')
  if (approved.status !== 'passed') blockers.push('approved_staging_target_reference_missing')
  if (!proof.stagingTargetProofPassed) blockers.push('blocked_target_not_staging')
  const selectedStrategy = blockers.length === 0 && pr206.selectedStrategy === 'cli_db_push'
    ? 'delegate_to_pr206_plugin_deploy'
    : blockers.includes('approved_staging_target_reference_missing')
      ? 'blocked_missing_approved_staging_reference'
      : 'blocked_target_not_staging'
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    selectedStrategy,
    strategyOrder: [
      'prove_repo_approved_staging_target',
      'compare_plugin_project_to_approved_target',
      'delegate_to_pr206_plugin_deploy',
      'blocked_missing_approved_staging_reference',
      'blocked_target_not_staging',
    ],
    pr206DeployStrategy,
    delegatedMigrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    delegatedMigrationSafeWorkflowOnly: true,
    deploySeeds: false,
    deployTrackBExportRows: false,
    deployUnrelatedMigrations: false,
    rawAdHocSqlAllowed: false,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    trackBRowsWritten: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildDefaultSchemaDeployRerunReport(deployStrategyReport: Record<string, unknown>) {
  const strategy = deployStrategyReport as { selectedStrategy?: string; blockers?: string[] }
  const missingConfirmations = [
    'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
    'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  ].filter((name) => process.env[name] !== 'true')
  const blockers = collectUniqueBlockers(
    strategy.blockers ?? [],
    missingConfirmations.length > 0 ? ['staging_schema_deploy_not_confirmed'] : [],
    ['staging_schema_deploy_not_run'],
  )
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: 'blocked',
    selectedStrategy: strategy.selectedStrategy,
    deployPerformed: false,
    delegatedToPr206PluginDeploy: false,
    dryRunPerformed: false,
    migrationApplied: false,
    reason: 'blocked_before_target_proof_deploy_rerun',
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    requiredConfirmations: [
      SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
      SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
      'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
      'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
    ],
    missingConfirmations,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    productionAffected: false,
    trackBRowsWritten: false,
    blockers,
  }
}

function buildDefaultSchemaVerifyAfterTargetProofReport(
  proofReport: Record<string, unknown>,
  schemaDeployRerunReport: Record<string, unknown>,
) {
  const proof = proofReport as { stagingTargetProofPassed?: boolean; blockers?: string[] }
  const missingVerify = process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY !== 'true'
  const blockers = collectUniqueBlockers(
    proof.blockers ?? [],
    extractBlockers(schemaDeployRerunReport),
    missingVerify ? ['staging_schema_verify_not_confirmed'] : [],
    ['staging_schema_verification_not_run'],
  )
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    delegatedToPr206PluginVerify: false,
    reason: proof.stagingTargetProofPassed
      ? 'verify_requires_successful_deploy_evidence_and_confirmation'
      : 'target_proof_failed_no_verification_sql_allowed',
    requiredConfirmations: [
      SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION,
      SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
      'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
    ],
    allowlistedReadOnlyCatalogQueries: [
      'migration history presence for 202606050001',
      'registry table presence',
      'registry table RLS enabled',
      'public anon authenticated revokes and service-role-only grants',
    ],
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    productionAffected: false,
    blockers,
  }
}

function buildDefaultRlsVerifyAfterTargetProofReport(schemaVerifyAfterTargetProofReport: Record<string, unknown>) {
  const blockers = collectUniqueBlockers(extractBlockers(schemaVerifyAfterTargetProofReport), ['staging_schema_verification_not_run'])
  return buildBlockedRlsVerifyReport(blockers)
}

function buildBlockedVerifyReport(blockers: string[]) {
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    delegatedToPr206PluginVerify: false,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildBlockedRlsVerifyReport(blockers: string[]) {
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: 'blocked',
    verificationPerformed: false,
    delegatedToPr206PluginVerify: false,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    rlsExpectedEnabled: SUPABASE_MILESTONE_REGISTRY_TABLES,
    publicAnonAuthenticatedRevokesExpected: true,
    serviceRoleOnlyGrantExpected: true,
    credentialPayloadsPrinted: false,
    secretPayloadsRead: false,
    productionAffected: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildBlockerReport(blockers: TargetProofBlocker[]) {
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    expectedCurrentEnvironmentBlockers: [
      'approved_staging_target_reference_missing',
      'supabase_plugin_target_not_confirmed_as_staging',
    ],
    operatorActionRequired: blockers.includes('approved_staging_target_reference_missing')
      ? 'Add an approved non-secret staging Supabase project reference in repo-safe metadata before rerun.'
      : blockers.includes('supabase_plugin_target_not_confirmed_as_staging') || blockers.includes('blocked_target_not_staging')
        ? 'Confirm the plugin target matches the approved staging reference before rerun.'
        : 'Review remaining blocker reports.',
    stillBlockedScopes: [
      'staging_schema_deploy_until_target_proof_passes',
      'staging_schema_verify_until_target_proof_passes',
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
  schemaDeployRerunReport: Record<string, unknown>,
  schemaVerifyAfterTargetProofReport: Record<string, unknown>,
  rlsVerifyAfterTargetProofReport: Record<string, unknown>,
  blockers: TargetProofBlocker[],
) {
  const verified =
    schemaDeployRerunReport.status === 'passed' &&
    schemaVerifyAfterTargetProofReport.status === 'passed' &&
    rlsVerifyAfterTargetProofReport.status === 'passed'
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: verified ? 'passed' : 'blocked',
    stagingTargetProofRequired: true,
    stagingDeployAllowed: blockers.length === 0,
    schemaDeployStatus: schemaDeployRerunReport.status,
    schemaVerifyStatus: schemaVerifyAfterTargetProofReport.status,
    rlsVerifyStatus: rlsVerifyAfterTargetProofReport.status,
    pr198BackfillRowsWritten: false,
    productionAffected: false,
    remoteSqlRun: false,
    directManualSqlRun: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    trackA: 'not_touched',
    blockers,
    nextRecommendedPhase: verified
      ? 'Rerun PR #198 guarded Track B staging backfill without schema mutation confirmations.'
      : 'Resolve the exact missing staging target proof before attempting deploy/verify again.',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_STAGING_TARGET_PROOF_PHASE,
    runId: SUPABASE_STAGING_TARGET_PROOF_RUN_ID,
    status: 'metadata_committed_only',
    reportDir: SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_TARGET_PROOF_EXPECTED_REPORTS,
    privateUploadRequired: false,
    secretsIncluded: false,
    dbUrlsIncluded: false,
    serviceKeysIncluded: false,
    mediaPayloadsIncluded: false,
  }
}

function renderReadinessMarkdown(reports: TargetProofReports) {
  const readiness = reports.readinessReport as { status?: string; blockers?: string[]; nextRecommendedPhase?: string }
  return [
    '# Supabase Staging Target Proof Readiness',
    '',
    `Status: \`${readiness.status ?? 'blocked'}\``,
    '',
    'This report is safe metadata only. It does not include DB URLs, tokens, passwords, service-role keys, anon keys, signed URLs, private payloads, or raw Supabase output.',
    '',
    `Active blockers: ${(readiness.blockers ?? []).map((blocker) => `\`${blocker}\``).join(', ') || 'none'}`,
    '',
    `Next: ${readiness.nextRecommendedPhase ?? 'Resolve blockers and rerun.'}`,
    '',
  ].join('\n')
}

function extractBlockers(report: Record<string, unknown>): TargetProofBlocker[] {
  const blockers = Array.isArray(report.blockers) ? report.blockers : Array.isArray(report.activeBlockers) ? report.activeBlockers : []
  return blockers.filter((blocker): blocker is TargetProofBlocker => typeof blocker === 'string') as TargetProofBlocker[]
}

function collectUniqueBlockers(...groups: Array<readonly string[]>): TargetProofBlocker[] {
  const blockers = new Set<TargetProofBlocker>()
  for (const group of groups) {
    for (const blocker of group) blockers.add(blocker as TargetProofBlocker)
  }
  return [...blockers]
}

export function listSupabaseStagingTargetProofReportFiles(root = SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR): string[] {
  if (!existsSync(root)) return []
  const files: string[] = []
  for (const name of readdirSync(root)) {
    const fullPath = path.join(root, name)
    if (statSync(fullPath).isDirectory()) continue
    files.push(fullPath)
  }
  return files.sort()
}
