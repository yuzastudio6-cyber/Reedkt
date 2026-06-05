import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  SupabaseMilestoneRegistrySchemaBlocker,
  SupabaseMilestoneRegistrySchemaReports,
} from './milestone-registry-schema-types'

export const SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE = 'supabase-milestone-registry-schema-rls'
export const SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID = 'supabase-milestone-registry-schema-rls-20260605'
export const SUPABASE_MILESTONE_REGISTRY_SCHEMA_BRANCH = 'codex/rp-foundation-supabase-milestone-registry-schema-rls'
export const SUPABASE_MILESTONE_REGISTRY_SCHEMA_BASE_BRANCH = 'codex/rp-foundation-supabase-trackb-milestone-staging-backfill'
export const SUPABASE_MILESTONE_REGISTRY_SCHEMA_REPORT_DIR = 'docs/activation-supabase-milestone-registry-schema-reports'
export const SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH = 'supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql'
export const SUPABASE_MILESTONE_REGISTRY_SEED_PATH = 'supabase/seed/activation_milestone_registry_seed.sql'
export const SUPABASE_MILESTONE_REGISTRY_RLS_TEST_PATH = 'database/test-sql/021_activation_milestone_registry_rls_tests.sql'

export const SUPABASE_MILESTONE_REGISTRY_TABLES = [
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

export const SUPABASE_MILESTONE_REGISTRY_SCHEMA_EXPECTED_REPORTS = [
  'milestone_registry_schema_plan.json',
  'milestone_registry_migration_report.json',
  'milestone_registry_rls_policy_report.json',
  'milestone_registry_local_validation_report.json',
  'milestone_registry_rls_test_report.json',
  'milestone_registry_seed_fixture_report.json',
  'milestone_registry_staging_preflight_report.json',
  'milestone_registry_staging_deploy_report.json',
  'milestone_registry_staging_verification_report.json',
  'milestone_registry_blocker_report.json',
  'milestone_registry_readiness_report.json',
  'milestone_registry_private_artifact_manifest.json',
] as const

export const SUPABASE_MILESTONE_REGISTRY_LOCAL_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_LOCAL_VALIDATE',
] as const

export const SUPABASE_MILESTONE_REGISTRY_STAGING_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
] as const

export const SUPABASE_MILESTONE_REGISTRY_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACT_OUTPUT',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
] as const

const UNSAFE_COLUMN_NAMES = [
  'secret_value',
  'service_role_key',
  'provider_key',
  'signed_url',
  'raw_prompt',
  'raw_payload',
  'private_artifact_contents',
  'user_pii',
] as const

const UNSAFE_TEXT_PATTERNS = [
  /BEGIN PRIVATE KEY/i,
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]/i,
  /provider[_-]?key\s*[:=]/i,
  /x-goog-signature=/i,
  /private-user-images\.githubusercontent\.com/i,
] as const

export function getSupabaseMilestoneRegistrySchemaPlan() {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    branch: SUPABASE_MILESTONE_REGISTRY_SCHEMA_BRANCH,
    baseBranch: SUPABASE_MILESTONE_REGISTRY_SCHEMA_BASE_BRANCH,
    sourcePr198: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/198',
    mode: 'schema_rls_only_no_backfill',
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    seedPath: SUPABASE_MILESTONE_REGISTRY_SEED_PATH,
    rlsTestPath: SUPABASE_MILESTONE_REGISTRY_RLS_TEST_PATH,
    reportDir: SUPABASE_MILESTONE_REGISTRY_SCHEMA_REPORT_DIR,
    expectedReports: SUPABASE_MILESTONE_REGISTRY_SCHEMA_EXPECTED_REPORTS,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    localValidationConfirmations: SUPABASE_MILESTONE_REGISTRY_LOCAL_CONFIRMATIONS,
    stagingDeployConfirmations: SUPABASE_MILESTONE_REGISTRY_STAGING_CONFIRMATIONS,
    forbiddenConfirmations: SUPABASE_MILESTONE_REGISTRY_FORBIDDEN_CONFIRMATIONS,
    noTrackBBackfillRows: true,
    noProductionSupabase: true,
    noProductionSql: true,
    noProviderCalls: true,
    noRouteWorkerToolExecution: true,
    noMediaProcessing: true,
    noBetaProductionUnlock: true,
    trackA: 'not_touched',
    nextRecommendedPhase: 'Rerun the guarded PR #198 Track B staging backfill after schema/RLS is verified.',
  }
}

export function getSupabaseMilestoneRegistrySchemaIamPlan() {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: 'schema_rls_only_no_iam_mutation',
    publicAccess: 'revoked',
    anonAccess: 'revoked',
    authenticatedAccess: 'revoked',
    serviceRoleAccess: 'select_insert_update_delete_only',
    gcpMutation: 'blocked',
    productionCredentialUse: 'blocked',
    secretPayloadPrinting: 'blocked',
    stagingCredentialUse: 'presence_detection_only_until_guarded_deploy',
  }
}

export function getSupabaseMilestoneRegistrySchemaCostSummary() {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: 'metadata_schema_local_validation_negligible_cost',
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

export function buildSupabaseMilestoneRegistrySchemaReports(overrides: {
  requireLocalConfirmation?: boolean
  stagingDeployReport?: Record<string, unknown>
  stagingVerificationReport?: Record<string, unknown>
} = {}): SupabaseMilestoneRegistrySchemaReports {
  const migrationReport = buildMigrationReport()
  const rlsPolicyReport = buildRlsPolicyReport(migrationReport)
  const seedFixtureReport = buildSeedFixtureReport()
  const localValidationReport = buildLocalValidationReport(migrationReport, rlsPolicyReport, seedFixtureReport, Boolean(overrides.requireLocalConfirmation))
  const rlsTestReport = buildRlsTestReport(rlsPolicyReport, Boolean(overrides.requireLocalConfirmation))
  const stagingPreflightReport = buildStagingPreflightReport(migrationReport, rlsPolicyReport)
  const stagingDeployReport = overrides.stagingDeployReport ?? buildStagingDeployReport(stagingPreflightReport)
  const stagingVerificationReport = overrides.stagingVerificationReport ?? buildStagingVerificationReport(stagingDeployReport)
  const blockers = collectBlockers(
    migrationReport,
    rlsPolicyReport,
    seedFixtureReport,
    localValidationReport,
    rlsTestReport,
    stagingPreflightReport,
    stagingDeployReport,
    stagingVerificationReport,
  )
  return {
    plan: getSupabaseMilestoneRegistrySchemaPlan(),
    migrationReport,
    rlsPolicyReport,
    localValidationReport,
    rlsTestReport,
    seedFixtureReport,
    stagingPreflightReport,
    stagingDeployReport,
    stagingVerificationReport,
    blockerReport: buildBlockerReport(blockers),
    readinessReport: buildReadinessReport(migrationReport, rlsPolicyReport, localValidationReport, rlsTestReport, stagingPreflightReport, stagingDeployReport, stagingVerificationReport, blockers),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeSupabaseMilestoneRegistrySchemaArtifacts(
  reports = buildSupabaseMilestoneRegistrySchemaReports(),
  reportDir = SUPABASE_MILESTONE_REGISTRY_SCHEMA_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_schema_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_migration_report.json'), reports.migrationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_rls_policy_report.json'), reports.rlsPolicyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_local_validation_report.json'), reports.localValidationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_rls_test_report.json'), reports.rlsTestReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_seed_fixture_report.json'), reports.seedFixtureReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_staging_preflight_report.json'), reports.stagingPreflightReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_staging_deploy_report.json'), reports.stagingDeployReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_staging_verification_report.json'), reports.stagingVerificationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'milestone_registry_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'milestone_registry_readiness_report.md'), renderReadinessMarkdown(reports))
}

export function readSupabaseMilestoneRegistrySchemaSummary() {
  const reports = buildSupabaseMilestoneRegistrySchemaReports()
  const readiness = reports.readinessReport as { status?: string; schemaRlsReadyForStaging?: boolean; stagingDeploymentStatus?: string }
  const blockers = reports.blockerReport as { activeBlockers?: string[] }
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: readiness.status,
    schemaRlsReadyForStaging: readiness.schemaRlsReadyForStaging,
    stagingDeploymentStatus: readiness.stagingDeploymentStatus,
    activeBlockers: blockers.activeBlockers,
    backfillRowsWritten: false,
    remoteSqlRun: false,
    productionSqlRun: false,
    productionAffected: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    trackA: 'not_touched',
    nextRecommendedPhase: 'Rerun PR #198 guarded Track B staging backfill after schema/RLS staging verification.',
  }
}

export async function executeSupabaseMilestoneRegistrySchemaStagingDeploy(): Promise<{ reports: SupabaseMilestoneRegistrySchemaReports; exitCode: number }> {
  const forbidden = SUPABASE_MILESTONE_REGISTRY_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const missing = SUPABASE_MILESTONE_REGISTRY_STAGING_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const baseReports = buildSupabaseMilestoneRegistrySchemaReports()
  const preflight = baseReports.stagingPreflightReport as { status?: string; blockers?: SupabaseMilestoneRegistrySchemaBlocker[] }
  const blockers = new Set<SupabaseMilestoneRegistrySchemaBlocker>()
  if (forbidden.length > 0) blockers.add('forbidden_confirmation_set')
  if (missing.length > 0) blockers.add('staging_schema_deploy_not_confirmed')
  for (const blocker of preflight.blockers ?? []) blockers.add(blocker)

  if (blockers.size > 0) {
    const reports = buildSupabaseMilestoneRegistrySchemaReports({
      stagingDeployReport: {
        phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
        runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
        status: 'blocked',
        deployPerformed: false,
        deploymentWorkflow: 'supabase_migration_workflow_only',
        credentialPayloadsPrinted: false,
        remoteSqlRun: false,
        productionSqlRun: false,
        productionAffected: false,
        blockers: [...blockers],
      },
      stagingVerificationReport: {
        phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
        runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
        status: 'blocked',
        verificationPerformed: false,
        remoteSqlRun: false,
        productionAffected: false,
        blockers: [...blockers],
      },
    })
    await writeSupabaseMilestoneRegistrySchemaArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const reports = buildSupabaseMilestoneRegistrySchemaReports({
    stagingDeployReport: {
      phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
      runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
      status: 'blocked',
      deployPerformed: false,
      deploymentWorkflow: 'supabase_migration_workflow_only',
      reason: 'guarded_staging_deploy_requires_operator_supabase_migration_workflow_in_prompt_scope',
      credentialPayloadsPrinted: false,
      remoteSqlRun: false,
      productionSqlRun: false,
      productionAffected: false,
      blockers: ['staging_toolchain_unavailable'],
    },
    stagingVerificationReport: {
      phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
      runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
      status: 'blocked',
      verificationPerformed: false,
      remoteSqlRun: false,
      productionAffected: false,
      blockers: ['staging_toolchain_unavailable'],
    },
  })
  await writeSupabaseMilestoneRegistrySchemaArtifacts(reports)
  return { reports, exitCode: 1 }
}

function buildMigrationReport() {
  const migrationExists = existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH)
  const migrationText = migrationExists ? readFileSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH, 'utf8') : ''
  const missingTables = SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) => !migrationText.includes(`public.${table}`))
  const unsafeColumns = UNSAFE_COLUMN_NAMES.filter((column) => migrationText.includes(column))
  const unsafePatterns = UNSAFE_TEXT_PATTERNS.filter((pattern) => pattern.test(migrationText)).map((pattern) => pattern.source)
  const safetyFlags = [
    'production_allowed boolean not null default false',
    'external_beta_allowed boolean not null default false',
    'paid_production_allowed boolean not null default false',
    'broad_media_allowed boolean not null default false',
    'public_output_allowed boolean not null default false',
    'provider_calls_allowed boolean not null default false',
  ]
  const missingSafetyFlags = safetyFlags.filter((snippet) => !migrationText.toLowerCase().includes(snippet.toLowerCase()))
  const blockers: SupabaseMilestoneRegistrySchemaBlocker[] = []
  if (!migrationExists) blockers.push('milestone_registry_migration_missing')
  if (missingTables.length > 0) blockers.push('milestone_registry_table_missing')
  if (unsafeColumns.length > 0 || unsafePatterns.length > 0 || missingSafetyFlags.length > 0) blockers.push('milestone_registry_rls_missing_or_unsafe')
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    migrationExists,
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    missingTables,
    unsafeColumns,
    unsafePatterns,
    safetyFlags,
    missingSafetyFlags,
    backfillRowsWritten: false,
    schemaOnly: true,
    blockers,
  }
}

function buildRlsPolicyReport(migrationReport: Record<string, unknown>) {
  if (migrationReport.status !== 'passed') {
    return {
      phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
      runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
      status: 'skipped',
      reason: 'migration_report_blocked_before_rls_evaluation',
      rlsSafe: false,
      blockers: [],
    }
  }
  const migrationText = readFileSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH, 'utf8').toLowerCase()
  const missingRlsEnable = SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) => !migrationText.includes(`alter table public.${table} enable row level security`))
  const missingRevoke = SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) => !migrationText.includes(`revoke all on table public.${table} from public, anon, authenticated`))
  const missingServiceRoleGrant = SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) => !migrationText.includes(`grant select, insert, update, delete on table public.${table} to service_role`))
  const unsafePolicies = /create\s+policy[\s\S]+to\s+(anon|authenticated|public)/i.test(migrationText)
  const blockers: SupabaseMilestoneRegistrySchemaBlocker[] = missingRlsEnable.length === 0 && missingRevoke.length === 0 && missingServiceRoleGrant.length === 0 && !unsafePolicies
    ? []
    : ['milestone_registry_rls_missing_or_unsafe']
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    rlsSafe: blockers.length === 0,
    rlsEnabledTables: SUPABASE_MILESTONE_REGISTRY_TABLES.filter((table) => !missingRlsEnable.includes(table)),
    missingRlsEnable,
    missingRevoke,
    missingServiceRoleGrant,
    unsafePoliciesDetected: unsafePolicies,
    publicAccessGranted: false,
    anonAccessGranted: false,
    authenticatedAccessGranted: false,
    serviceRoleAccessOnly: blockers.length === 0,
    blockers,
  }
}

function buildSeedFixtureReport() {
  const seedExists = existsSync(SUPABASE_MILESTONE_REGISTRY_SEED_PATH)
  const seedText = seedExists ? readFileSync(SUPABASE_MILESTONE_REGISTRY_SEED_PATH, 'utf8') : ''
  const includesPassed = seedText.includes("'passed'")
  const includesBlocked = seedText.includes("'blocked'")
  const includesReadiness = seedText.includes('activation_tool_readiness')
  const includesBlocker = seedText.includes('activation_blockers')
  const includesPrEvidence = seedText.includes('activation_pr_evidence')
  const includesArtifact = seedText.includes('activation_artifact_manifests')
  const unsafe = UNSAFE_TEXT_PATTERNS.some((pattern) => pattern.test(seedText))
  const blockers: SupabaseMilestoneRegistrySchemaBlocker[] = seedExists && includesPassed && includesBlocked && includesReadiness && includesBlocker && includesPrEvidence && includesArtifact && !unsafe
    ? []
    : ['milestone_registry_seed_fixture_missing']
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    seedPath: SUPABASE_MILESTONE_REGISTRY_SEED_PATH,
    seedExists,
    localOnly: true,
    includesPassedMilestone: includesPassed,
    includesBlockedMilestone: includesBlocked,
    includesReadiness,
    includesBlocker,
    includesPrEvidence,
    includesArtifactMetadata: includesArtifact,
    unsafePayloadDetected: unsafe,
    stagingSeedRun: false,
    productionSeedRun: false,
    blockers,
  }
}

function buildLocalValidationReport(
  migrationReport: Record<string, unknown>,
  rlsPolicyReport: Record<string, unknown>,
  seedFixtureReport: Record<string, unknown>,
  requireConfirmation: boolean,
) {
  const confirmed = process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_LOCAL_VALIDATE === 'true'
  const localBlockers: SupabaseMilestoneRegistrySchemaBlocker[] = []
  if (requireConfirmation && !confirmed) localBlockers.push('milestone_registry_local_validation_confirmation_missing')
  const blockers = [
    ...((migrationReport.blockers ?? []) as SupabaseMilestoneRegistrySchemaBlocker[]),
    ...((rlsPolicyReport.blockers ?? []) as SupabaseMilestoneRegistrySchemaBlocker[]),
    ...((seedFixtureReport.blockers ?? []) as SupabaseMilestoneRegistrySchemaBlocker[]),
    ...localBlockers,
  ]
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    localValidationMode: 'static_migration_seed_rls_assertion_inspection',
    confirmationRequired: SUPABASE_MILESTONE_REGISTRY_LOCAL_CONFIRMATIONS,
    confirmationPresent: confirmed,
    confirmationRequiredForThisInvocation: requireConfirmation,
    migrationStatus: migrationReport.status,
    rlsStatus: rlsPolicyReport.status,
    seedStatus: seedFixtureReport.status,
    remoteSqlRun: false,
    productionSqlRun: false,
    stagingMutation: false,
    blockers: [...new Set(blockers)],
  }
}

function buildRlsTestReport(rlsPolicyReport: Record<string, unknown>, requireConfirmation: boolean) {
  const confirmed = process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_LOCAL_VALIDATE === 'true'
  const testExists = existsSync(SUPABASE_MILESTONE_REGISTRY_RLS_TEST_PATH)
  const testText = testExists ? readFileSync(SUPABASE_MILESTONE_REGISTRY_RLS_TEST_PATH, 'utf8') : ''
  const requiredSnippets = [
    'activation registry RLS is enabled on every table',
    'activation registry has no anon/authenticated table privileges',
    'activation registry has no unsafe payload columns',
    'activation registry hard safety flags default false',
  ]
  const missingSnippets = requiredSnippets.filter((snippet) => !testText.includes(snippet))
  const blockers: SupabaseMilestoneRegistrySchemaBlocker[] = []
  if (requireConfirmation && !confirmed) blockers.push('milestone_registry_local_validation_confirmation_missing')
  if (!testExists || missingSnippets.length > 0 || rlsPolicyReport.status !== 'passed') blockers.push('milestone_registry_rls_test_missing')
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    rlsTestPath: SUPABASE_MILESTONE_REGISTRY_RLS_TEST_PATH,
    rlsTestExists: testExists,
    confirmationRequired: SUPABASE_MILESTONE_REGISTRY_LOCAL_CONFIRMATIONS,
    confirmationPresent: confirmed,
    confirmationRequiredForThisInvocation: requireConfirmation,
    requiredSnippets,
    missingSnippets,
    remoteSqlRun: false,
    productionSqlRun: false,
    blockers: [...new Set(blockers)],
  }
}

function buildStagingPreflightReport(migrationReport: Record<string, unknown>, rlsPolicyReport: Record<string, unknown>) {
  const credentials = getStagingCredentialStatus()
  const blockers: SupabaseMilestoneRegistrySchemaBlocker[] = []
  if (migrationReport.status !== 'passed') blockers.push(...(migrationReport.blockers as SupabaseMilestoneRegistrySchemaBlocker[]))
  if (rlsPolicyReport.status !== 'passed') blockers.push(...(rlsPolicyReport.blockers as SupabaseMilestoneRegistrySchemaBlocker[]))
  if (!credentials.urlProvided || !credentials.accessTokenOrDbPasswordProvided || !credentials.targetConfirmed) blockers.push('staging_supabase_credentials_unavailable')
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    stagingOnly: true,
    productionTargetRejected: true,
    credentialPayloadsPrinted: false,
    stagingTargetReference: credentials.targetReferenceStatus,
    allowedCredentialNames: credentials.allowedCredentialNames,
    urlProvided: credentials.urlProvided,
    accessTokenOrDbPasswordProvided: credentials.accessTokenOrDbPasswordProvided,
    targetConfirmed: credentials.targetConfirmed,
    migrationWorkflowOnly: true,
    remoteSqlRun: false,
    productionSqlRun: false,
    schemaMutationPerformed: false,
    blockers: [...new Set(blockers)],
  }
}

function buildStagingDeployReport(stagingPreflightReport: Record<string, unknown>) {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: 'skipped',
    deployPerformed: false,
    reason: stagingPreflightReport.status === 'passed'
      ? 'staging_deploy_requires_execute_script_and_current_shell_confirmations'
      : 'blocked_before_staging_deploy',
    deploymentWorkflow: 'supabase_migration_workflow_only',
    migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
    requiredConfirmations: SUPABASE_MILESTONE_REGISTRY_STAGING_CONFIRMATIONS,
    credentialPayloadsPrinted: false,
    remoteSqlRun: false,
    productionSqlRun: false,
    productionAffected: false,
    backfillRowsWritten: false,
    blockers: stagingPreflightReport.status === 'passed'
      ? ['staging_schema_deploy_not_run']
      : (stagingPreflightReport.blockers as SupabaseMilestoneRegistrySchemaBlocker[]),
  }
}

function buildStagingVerificationReport(stagingDeployReport: Record<string, unknown>) {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: stagingDeployReport.status === 'passed' ? 'planned' : 'skipped',
    verificationPerformed: false,
    reason: stagingDeployReport.status === 'passed' ? 'staging_verify_requires_post_deploy_command' : 'staging_deploy_not_performed',
    requiredTables: SUPABASE_MILESTONE_REGISTRY_TABLES,
    remoteSqlRun: false,
    productionSqlRun: false,
    productionAffected: false,
    blockers: stagingDeployReport.status === 'passed' ? ['staging_schema_verification_not_run'] : (stagingDeployReport.blockers as SupabaseMilestoneRegistrySchemaBlocker[]),
  }
}

function buildBlockerReport(blockers: SupabaseMilestoneRegistrySchemaBlocker[]) {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: [...new Set(blockers)],
    expectedPr198BlockerResolvedByThisPhase: 'supabase_milestone_registry_schema_missing',
    stillBlockedScopes: [
      'track_b_data_backfill',
      'production_supabase_write',
      'production_sql',
      'remote_manual_sql',
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
  migrationReport: Record<string, unknown>,
  rlsPolicyReport: Record<string, unknown>,
  localValidationReport: Record<string, unknown>,
  rlsTestReport: Record<string, unknown>,
  stagingPreflightReport: Record<string, unknown>,
  stagingDeployReport: Record<string, unknown>,
  stagingVerificationReport: Record<string, unknown>,
  blockers: SupabaseMilestoneRegistrySchemaBlocker[],
) {
  const localPassed = migrationReport.status === 'passed' && rlsPolicyReport.status === 'passed' && localValidationReport.status === 'passed' && rlsTestReport.status === 'passed'
  const stagingVerified = stagingDeployReport.status === 'passed' && stagingVerificationReport.status === 'passed'
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: stagingVerified ? 'passed' : localPassed ? 'local_schema_ready_staging_blocked_or_not_run' : 'blocked',
    schemaRlsReadyForStaging: localPassed,
    migrationStatus: migrationReport.status,
    rlsStatus: rlsPolicyReport.status,
    localValidationStatus: localValidationReport.status,
    localRlsTestStatus: rlsTestReport.status,
    stagingPreflightStatus: stagingPreflightReport.status,
    stagingDeploymentStatus: stagingDeployReport.status,
    stagingVerificationStatus: stagingVerificationReport.status,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    remoteSqlRun: false,
    productionSqlRun: false,
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    trackA: 'not_touched',
    nextRecommendedPhase: stagingVerified
      ? 'Rerun PR #198 guarded Track B staging backfill.'
      : 'Resolve staging credential/toolchain blockers, deploy schema via guarded Supabase migration workflow, then rerun PR #198 guarded backfill.',
    blockers: [...new Set(blockers)],
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_MILESTONE_REGISTRY_SCHEMA_PHASE,
    runId: SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID,
    status: 'committed_safe_metadata_only',
    privateUploadRequired: false,
    privateUploadPerformed: false,
    reportDir: SUPABASE_MILESTONE_REGISTRY_SCHEMA_REPORT_DIR,
    expectedReports: SUPABASE_MILESTONE_REGISTRY_SCHEMA_EXPECTED_REPORTS,
    forbiddenPayloadsCommitted: false,
    stagingDataWritten: false,
    productionAffected: false,
  }
}

function collectBlockers(...reports: Record<string, unknown>[]): SupabaseMilestoneRegistrySchemaBlocker[] {
  const blockers = new Set<SupabaseMilestoneRegistrySchemaBlocker>()
  for (const report of reports) {
    for (const blocker of (report.blockers ?? []) as SupabaseMilestoneRegistrySchemaBlocker[]) blockers.add(blocker)
  }
  return [...blockers]
}

function getStagingCredentialStatus() {
  const urlProvided = Boolean(process.env.REEDITPRO_STAGING_SUPABASE_URL)
  const accessTokenProvided = Boolean(process.env.SUPABASE_ACCESS_TOKEN || process.env.REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN)
  const dbPasswordProvided = Boolean(process.env.SUPABASE_DB_PASSWORD || process.env.REEDITPRO_STAGING_SUPABASE_DB_PASSWORD)
  const targetConfirmed = process.env.REEDITPRO_SUPABASE_TARGET_ENV === 'staging' || process.env.REEDITPRO_STAGING_SUPABASE_TARGET_CONFIRMED === 'true'
  return {
    urlProvided,
    accessTokenOrDbPasswordProvided: accessTokenProvided || dbPasswordProvided,
    targetConfirmed,
    targetReferenceStatus: process.env.REEDITPRO_STAGING_SUPABASE_TARGET_REFERENCE ? 'redacted_reference_provided' : 'redacted_required_at_execution_time',
    allowedCredentialNames: [
      'REEDITPRO_STAGING_SUPABASE_URL',
      'SUPABASE_ACCESS_TOKEN or REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN',
      'SUPABASE_DB_PASSWORD or REEDITPRO_STAGING_SUPABASE_DB_PASSWORD',
      'REEDITPRO_SUPABASE_TARGET_ENV=staging or REEDITPRO_STAGING_SUPABASE_TARGET_CONFIRMED=true',
    ],
  }
}

function renderReadinessMarkdown(reports: SupabaseMilestoneRegistrySchemaReports): string {
  const readiness = reports.readinessReport as { status?: string; schemaRlsReadyForStaging?: boolean; blockers?: string[] }
  return `# Supabase Activation Milestone Registry Schema/RLS

Run id: \`${SUPABASE_MILESTONE_REGISTRY_SCHEMA_RUN_ID}\`

This phase creates the activation milestone registry schema/RLS migration and local validation metadata. It does not backfill Track B rows, run production SQL, call providers, execute tools/workers/routes, process media, or unlock beta/production.

- Readiness: ${readiness.status}
- Schema/RLS ready for staging: ${readiness.schemaRlsReadyForStaging ? 'yes' : 'no'}
- Active blockers: ${(readiness.blockers ?? []).join(', ') || 'none'}
- Next: rerun the guarded PR #198 Track B staging backfill after schema/RLS staging verification.
`
}
