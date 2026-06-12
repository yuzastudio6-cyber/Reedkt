import { execFile as execFileCallback } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  applySupabaseMilestoneMigrationWithPsql,
  createSupabaseMilestoneServiceClient,
  inspectSupabaseMilestoneRegistryTables,
  psqlAvailable,
  type SupabaseMilestoneCredentialResolution,
  type SupabaseMilestoneDbUrlResolution,
} from '../supabase-milestone-registry/supabase-milestone-client'
import {
  supabaseMilestoneRegistryConfig,
  supabaseMilestoneRegistryTableNames,
} from '../supabase-milestone-registry/supabase-milestone-registry-policy'
import type {
  SupabaseRegistrySchemaVerification,
  SupabaseRegistryTableName,
} from '../supabase-milestone-registry/supabase-milestone-registry-types'
import {
  buildApprovedStagingTargetReferenceReport,
} from '../supabase-milestone-registry-schema/milestone-registry-approved-staging-target-reference'

const execFile = promisify(execFileCallback)

export const SUPABASE_REGISTRY_RESTORE_PHASE = 'supabase-registry-1-activation-milestone-registry-staging-restoration'
export const SUPABASE_REGISTRY_RESTORE_BRANCH =
  'codex/rp-supabase-registry-1-activation-milestone-registry-staging-restoration'
export const SUPABASE_REGISTRY_RESTORE_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-schema-deploy-after-target-reference'
export const SUPABASE_REGISTRY_RESTORE_REPORT_DIR =
  'docs/activation-supabase-registry-restore-reports'
export const SUPABASE_REGISTRY_RESTORE_RESULTS_DOC =
  'docs/activation-supabase-registry-restore-results.md'
export const SUPABASE_REGISTRY_RESTORE_GENERATED_BUCKET =
  'reeditpro-staging-reeditpro-generated-assets'
export const SUPABASE_REGISTRY_RESTORE_QA_BUCKET =
  'reeditpro-staging-reeditpro-qa-artifacts'
export const SUPABASE_REGISTRY_RESTORE_PREFIX_BASE =
  'activation-supabase/registry-restore'
export const SUPABASE_REGISTRY_RESTORE_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_REGISTRY_RESTORE',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL',
] as const
export const SUPABASE_REGISTRY_RESTORE_REQUIRED_EXECUTION_ENV = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
  REEDITPRO_CONFIRM_SUPABASE_REGISTRY_RESTORE: 'true',
  REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL: 'true',
} as const

export const SUPABASE_REGISTRY_RESTORE_BLOCKED_FEATURES = [
  'production',
  'external_beta',
  'broad_media',
  'unrelated_sql',
  'schema_reset',
  'rls_weakening',
  'unrelated_row_writes',
  'provider_calls',
  'worker_tool_model_execution',
  'public_artifacts',
] as const

export const SUPABASE_REGISTRY_RESTORE_EXPECTED_LOCAL_ARTIFACTS = [
  'audit/staging-target-reconciliation.json',
  'audit/registry-table-status.json',
  'audit/migration-history-status.json',
  'audit/schema-cache-visibility.json',
  'policy/rls-registry-access-policy-review.json',
  'restore/registry-restore-plan.json',
  'restore/registry-restore-result.json',
  'verification/postgrest-registry-visibility.json',
  'handoff/provider1-unblock-handoff.json',
  'qa/supabase-registry-restore-qa.json',
  'reports/supabase-registry-restore-report.json',
] as const

type RestoreExecution = 'proof_only_completed' | 'restore_completed' | 'blocked'
type GateStatus = 'passed' | 'blocked' | 'warning' | 'not_attempted'

interface SecretMetadataReport {
  status: GateStatus
  secrets: Array<{ name: string; present: boolean; metadataOnly: true; blocker?: string }>
  secretPayloadsRead: boolean
  secretPayloadsPrinted: false
  blockers: string[]
}

interface BucketMetadataReport {
  status: GateStatus
  buckets: Array<{
    bucket: string
    present: boolean
    publicPrincipalDetected: boolean
    blocker?: string
  }>
  blockers: string[]
}

interface MigrationSafetyReport {
  status: GateStatus
  migrationFile: string
  exists: boolean
  expectedTablesPresent: boolean
  destructiveStatementsDetected: boolean
  migrationId: '202606040001'
  blockers: string[]
  warnings: string[]
}

interface MigrationHistoryReport {
  status: GateStatus
  migrationId: '202606040001'
  checkedWithSql: boolean
  historyPresent: boolean | null
  blocker?: string
}

interface RegistryCatalogTableStatus {
  tableName: SupabaseRegistryTableName
  exists: boolean
  rlsEnabled: boolean
  anonUnsafeAccess: boolean
  authenticatedUnsafeAccess: boolean
  publicUnsafeAccess: boolean
  serviceRoleAccess: boolean
}

interface RegistryCatalogReport {
  status: GateStatus
  checkedWithSql: boolean
  tables: RegistryCatalogTableStatus[]
  allTablesPresent: boolean
  rlsEnabledOnAllTables: boolean
  unsafeAnonAuthenticatedOrPublicAccess: boolean
  serviceRoleAccessOnAllTables: boolean
  blocker?: string
}

interface RestoreResultReport {
  status: GateStatus
  sqlExecuted: boolean
  migrationApplied: boolean
  migrationFile: string
  blocker?: string
  warnings: string[]
}

interface ProviderHandoffReport {
  status: 'ready_to_rerun_PROVIDER_1_milestone_sync' | 'blocked'
  provider1Pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/307'
  canRerunProvider1MilestoneSync: boolean
  blockers: string[]
  nextOwner: 'PROVIDER_GATEWAY_MODELS' | 'SUPABASE_RLS_STORAGE_DATABASE'
}

interface ExecutionGuardReport {
  status: GateStatus
  executeRequested: boolean
  executionAttempted: boolean
  requiredEnv: typeof SUPABASE_REGISTRY_RESTORE_REQUIRED_EXECUTION_ENV
  checks: Array<{
    name: keyof typeof SUPABASE_REGISTRY_RESTORE_REQUIRED_EXECUTION_ENV | '--execute'
    expected: string | true
    actual: string | null | boolean
    passed: boolean
  }>
  secretPayloadResolutionAllowed: boolean
  sqlAllowed: boolean
  gcsUploadAllowed: boolean
  requiredSecretSource: 'google_secret_manager'
  blockers: string[]
}

interface QaReport {
  status: GateStatus
  gates: Array<{ gateId: string; status: GateStatus; mandatory: boolean; summary: string }>
  blockers: string[]
}

export interface SupabaseRegistryRestoreArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface SupabaseRegistryRestoreReport {
  phase: typeof SUPABASE_REGISTRY_RESTORE_PHASE
  runId: string
  createdAt: string
  branch: typeof SUPABASE_REGISTRY_RESTORE_BRANCH
  baseBranch: typeof SUPABASE_REGISTRY_RESTORE_BASE_BRANCH
  execution: RestoreExecution
  approvedStagingTarget: ReturnType<typeof buildApprovedStagingTargetReferenceReport>
  gcpMetadata: Record<string, unknown>
  secretMetadata: SecretMetadataReport
  bucketMetadata: BucketMetadataReport
  migrationSafety: MigrationSafetyReport
  registryTableStatus: RegistryCatalogReport
  migrationHistoryStatus: MigrationHistoryReport
  schemaCacheVisibility: Record<string, unknown>
  rlsSecurityReview: RegistryCatalogReport
  restorePlan: Record<string, unknown>
  executionGuard: ExecutionGuardReport
  restoreResult: RestoreResultReport
  postgrestVisibility: SupabaseRegistrySchemaVerification
  provider1UnblockHandoff: ProviderHandoffReport
  qa: QaReport
  artifacts: SupabaseRegistryRestoreArtifact[]
  blockedFeatures: readonly string[]
  packageLockUnchangedRequired: true
  sqlExecuted: boolean
  migrationDeployed: boolean
  supabaseRowsWritten: false
  gcsUploaded: boolean
  blockers: string[]
  warnings: string[]
}

export function makeSupabaseRegistryRestoreRunId(): string {
  const now = new Date().toISOString()
  return `registry1-${now.slice(0, 10).replace(/-/g, '')}T${now.slice(11, 19).replace(/:/g, '')}`
}

export function supabaseRegistryRestoreArtifactPrefix(runId: string): string {
  if (!/^registry1-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) {
    throw new Error(`Unsafe SUPABASE-REGISTRY-1 run id: ${runId}`)
  }
  return `${SUPABASE_REGISTRY_RESTORE_PREFIX_BASE}/${runId}`
}

export async function runSupabaseRegistryRestore(input: {
  runId?: string
  writeLocalArtifacts?: boolean
  execute?: boolean
} = {}) {
  const runId = input.runId ?? process.env.REEDITPRO_SUPABASE_REGISTRY1_RUN_ID ?? makeSupabaseRegistryRestoreRunId()
  const executionGuard = buildExecutionGuardReport(input.execute === true)
  const restoreConfirmed = executionGuard.status === 'passed'
  const warnings: string[] = []
  const blockers: string[] = []

  const approvedStagingTarget = buildApprovedStagingTargetReferenceReport()
  if (approvedStagingTarget.status !== 'passed') blockers.push(...approvedStagingTarget.blockers)

  const [gcpMetadata, secretMetadata, bucketMetadata] = await Promise.all([
    buildGcpMetadataReport(),
    buildSecretMetadataReport(),
    buildBucketMetadataReport(),
  ])
  blockers.push(...extractStringArray(gcpMetadata, 'blockers'), ...secretMetadata.blockers, ...bucketMetadata.blockers)

  const migrationSafety = buildMigrationSafetyReport()
  if (migrationSafety.status === 'blocked') blockers.push(...migrationSafety.blockers)

  const preExecutionBlockers = [...blockers]
  const confirmedExecutionAllowed = restoreConfirmed && preExecutionBlockers.length === 0

  let registryTableStatus = notAttemptedCatalogReport(
    restoreConfirmed ? 'DB URL has not been resolved yet.' : 'Confirmed execution guard did not pass; catalog SQL was not attempted.',
  )
  let migrationHistoryStatus = notAttemptedMigrationHistory(
    restoreConfirmed ? 'DB URL has not been resolved yet.' : 'Confirmed execution guard did not pass; migration history SQL was not attempted.',
  )
  let postgrestVisibility = notAttemptedPostgrestVisibility(
    restoreConfirmed ? 'Supabase service-role credentials have not been resolved yet.' : 'Proof-only or blocked guard mode does not read service-role secret payloads.',
  )
  let restoreResult: RestoreResultReport = {
    status: restoreConfirmed ? 'blocked' : 'not_attempted',
    sqlExecuted: false,
    migrationApplied: false,
    migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
    blocker: restoreConfirmed ? 'Restore preflight has not completed.' : 'Confirmed execution guard did not pass; SQL and migrations were not attempted.',
    warnings: [],
  }

  if (!restoreConfirmed) {
    if (executionGuard.executionAttempted) {
      restoreResult = {
        status: 'blocked',
        sqlExecuted: false,
        migrationApplied: false,
        migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
        blocker: 'Confirmed restore execution was requested, but --execute and the exact staging environment guard were not all present.',
        warnings: [],
      }
      blockers.push(...executionGuard.blockers)
      warnings.push('Confirmed restore was blocked before secret payload resolution, SQL, migration apply, or GCS upload because the execution guard did not pass.')
    } else {
      blockers.push('blocked_pending_supabase_registry_restore_confirmation')
      warnings.push('Proof-only mode completed because --execute and the confirmed staging restore environment were not supplied.')
    }
  } else if (confirmedExecutionAllowed) {
    const confirmedResult = await runConfirmedRestore(approvedStagingTarget.approvedStagingProjectRef)
    registryTableStatus = confirmedResult.registryTableStatus
    migrationHistoryStatus = confirmedResult.migrationHistoryStatus
    postgrestVisibility = confirmedResult.postgrestVisibility
    restoreResult = confirmedResult.restoreResult
    blockers.push(...confirmedResult.blockers)
    warnings.push(...confirmedResult.warnings)
  } else {
    restoreResult = {
      status: 'blocked',
      sqlExecuted: false,
      migrationApplied: false,
      migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
      blocker: 'Confirmed execution guard passed, but metadata/static preflight blockers prevented secret payload resolution, SQL, migration apply, and GCS upload.',
      warnings: [],
    }
  }

  const schemaCacheVisibility = buildSchemaCacheVisibility(postgrestVisibility, registryTableStatus)
  const provider1UnblockHandoff = buildProvider1Handoff(registryTableStatus, postgrestVisibility, blockers)
  const qa = buildQaReport({
    approvedStagingTarget,
    secretMetadata,
    bucketMetadata,
    migrationSafety,
    registryTableStatus,
    migrationHistoryStatus,
    postgrestVisibility,
    restoreResult,
    provider1UnblockHandoff,
    executionGuard,
    restoreConfirmed,
  })
  blockers.push(...qa.blockers)

  const execution = computeExecution(restoreConfirmed, qa, provider1UnblockHandoff)
  const report: SupabaseRegistryRestoreReport = {
    phase: SUPABASE_REGISTRY_RESTORE_PHASE,
    runId,
    createdAt: new Date().toISOString(),
    branch: SUPABASE_REGISTRY_RESTORE_BRANCH,
    baseBranch: SUPABASE_REGISTRY_RESTORE_BASE_BRANCH,
    execution,
    approvedStagingTarget,
    gcpMetadata,
    secretMetadata,
    bucketMetadata,
    migrationSafety,
    registryTableStatus,
    migrationHistoryStatus,
    schemaCacheVisibility,
    rlsSecurityReview: registryTableStatus,
    restorePlan: buildRestorePlan(executionGuard, registryTableStatus),
    executionGuard,
    restoreResult,
    postgrestVisibility,
    provider1UnblockHandoff,
    qa,
    artifacts: [],
    blockedFeatures: SUPABASE_REGISTRY_RESTORE_BLOCKED_FEATURES,
    packageLockUnchangedRequired: true,
    sqlExecuted: restoreResult.sqlExecuted,
    migrationDeployed: restoreResult.migrationApplied,
    supabaseRowsWritten: false,
    gcsUploaded: false,
    blockers: unique(blockers),
    warnings: unique(warnings),
  }

  if (confirmedExecutionAllowed && bucketMetadata.status !== 'blocked') {
    const uploadBlockers = await uploadPrivateArtifacts(report)
    report.gcsUploaded = uploadBlockers.length === 0
    report.blockers = unique([...report.blockers, ...uploadBlockers])
    if (uploadBlockers.length) report.qa.status = 'blocked'
  }

  if (input.writeLocalArtifacts !== false) await writeSupabaseRegistryRestoreArtifacts(report)
  return report
}

export function summarizeSupabaseRegistryRestoreReport(report: SupabaseRegistryRestoreReport): string {
  const tables = report.registryTableStatus.tables.map((table) => `${table.tableName}:${table.exists ? 'present' : 'missing'}`).join(', ')
  return [
    `SUPABASE-REGISTRY-1 ${report.execution}`,
    `Run ID: ${report.runId}`,
    `Approved target: ${report.approvedStagingTarget.approvedStagingProjectName ?? 'unknown'} / ${report.approvedStagingTarget.approvedStagingProjectRef ?? 'unknown'} / ${report.approvedStagingTarget.approvedEnvironment ?? 'unknown'}`,
    `Registry tables: ${tables || report.registryTableStatus.status}`,
    `Migration status: ${report.migrationHistoryStatus.status}${report.migrationHistoryStatus.historyPresent === null ? '' : ` (history present: ${report.migrationHistoryStatus.historyPresent})`}`,
    `PostgREST visibility: ${report.postgrestVisibility.status}`,
    `Provider-1 unblock: ${report.provider1UnblockHandoff.status}`,
    `SQL executed: ${report.sqlExecuted}`,
    `GCS uploaded: ${report.gcsUploaded}`,
    `Blockers: ${report.blockers.length ? report.blockers.join('; ') : 'none'}`,
  ].join('\n')
}

export async function writeSupabaseRegistryRestoreArtifacts(report: SupabaseRegistryRestoreReport): Promise<void> {
  await mkdir(SUPABASE_REGISTRY_RESTORE_REPORT_DIR, { recursive: true })
  const artifactValues = buildArtifactValueMap(report)
  for (const [relativePath, value] of artifactValues) {
    await writeJson(path.join(SUPABASE_REGISTRY_RESTORE_REPORT_DIR, relativePath), value)
  }
  await writeFile(SUPABASE_REGISTRY_RESTORE_RESULTS_DOC, renderResultsDoc(report), 'utf8')
}

async function runConfirmedRestore(approvedProjectRef: string | null): Promise<{
  registryTableStatus: RegistryCatalogReport
  migrationHistoryStatus: MigrationHistoryReport
  postgrestVisibility: SupabaseRegistrySchemaVerification
  restoreResult: RestoreResultReport
  blockers: string[]
  warnings: string[]
}> {
  const blockers: string[] = []
  const warnings: string[] = []
  const credentialResolution = await resolveConfirmedSecretManagerCredentials()
  warnings.push(...credentialResolution.warnings)
  if (!credentialResolution.configured) blockers.push(...credentialResolution.blockers)

  const resolvedProjectRef = credentialResolution.supabaseUrl ? extractProjectRef(credentialResolution.supabaseUrl) : null
  if (approvedProjectRef && resolvedProjectRef && approvedProjectRef !== resolvedProjectRef) {
    blockers.push(`Supabase URL project ref mismatch: expected ${approvedProjectRef}, got ${resolvedProjectRef}.`)
  }

  const dbUrlResolution = await resolveConfirmedSecretManagerDbUrl()
  warnings.push(...dbUrlResolution.warnings)
  if (!dbUrlResolution.configured || !dbUrlResolution.dbUrl) blockers.push(...dbUrlResolution.blockers)

  let postgrestVisibility = credentialResolution.configured
    ? await inspectSupabaseMilestoneRegistryTables(createSupabaseMilestoneServiceClient(credentialResolution))
    : notAttemptedPostgrestVisibility('Supabase service-role credentials were not resolved.')

  let registryTableStatus = dbUrlResolution.dbUrl
    ? await queryRegistryCatalog(dbUrlResolution.dbUrl)
    : notAttemptedCatalogReport('SUPABASE_DB_URL was not resolved.')
  let migrationHistoryStatus = dbUrlResolution.dbUrl
    ? await queryMigrationHistory(dbUrlResolution.dbUrl)
    : notAttemptedMigrationHistory('SUPABASE_DB_URL was not resolved.')

  let restoreResult: RestoreResultReport = {
    status: 'not_attempted',
    sqlExecuted: false,
    migrationApplied: false,
    migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
    warnings: [],
  }

  const catalogTablesPresent = registryTableStatus.checkedWithSql && registryTableStatus.allTablesPresent
  const postgrestBlocked = postgrestVisibility.status === 'blocked'
  if (catalogTablesPresent && postgrestBlocked) {
    restoreResult = {
      ...restoreResult,
      status: 'blocked',
      blocker: 'Registry tables exist in SQL catalog but PostgREST zero-row probes are blocked; treating as schema cache visibility blocker.',
    }
    blockers.push('blocked_schema_cache_visibility')
  } else if (!catalogTablesPresent && dbUrlResolution.dbUrl && blockers.length === 0) {
    const psqlReady = await psqlAvailable()
    if (!psqlReady) {
      restoreResult = {
        ...restoreResult,
        status: 'blocked',
        blocker: 'psql is unavailable; migration apply was not attempted.',
      }
      blockers.push('psql_unavailable')
    } else {
      const apply = await applySupabaseMilestoneMigrationWithPsql(dbUrlResolution.dbUrl, supabaseMilestoneRegistryConfig.migrationFile)
      restoreResult = {
        status: apply.ok ? 'passed' : 'blocked',
        sqlExecuted: true,
        migrationApplied: apply.ok,
        migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
        blocker: apply.ok ? undefined : apply.error ?? 'psql migration apply failed.',
        warnings: apply.ok
          ? ['Applied only the existing SUPABASE-REGISTRY-1 migration through psql after both confirmation gates were present.']
          : [],
      }
      if (!apply.ok) blockers.push(restoreResult.blocker ?? 'psql migration apply failed.')
      registryTableStatus = await queryRegistryCatalog(dbUrlResolution.dbUrl)
      migrationHistoryStatus = await queryMigrationHistory(dbUrlResolution.dbUrl)
      if (credentialResolution.configured) {
        postgrestVisibility = await inspectSupabaseMilestoneRegistryTables(createSupabaseMilestoneServiceClient(credentialResolution))
      }
    }
  } else if (catalogTablesPresent && postgrestVisibility.allTablesPresent) {
    restoreResult = {
      status: 'passed',
      sqlExecuted: false,
      migrationApplied: false,
      migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
      warnings: ['Registry tables already existed and were visible; migration apply was not required.'],
    }
  }

  if (registryTableStatus.status === 'blocked') blockers.push(registryTableStatus.blocker ?? 'registry_catalog_blocked')
  if (migrationHistoryStatus.status === 'blocked') blockers.push(migrationHistoryStatus.blocker ?? 'migration_history_blocked')
  if (postgrestVisibility.status === 'blocked') blockers.push(...postgrestVisibility.blockers)
  warnings.push(...restoreResult.warnings)

  return {
    registryTableStatus,
    migrationHistoryStatus,
    postgrestVisibility,
    restoreResult,
    blockers: unique(blockers),
    warnings: unique(warnings),
  }
}

function confirmationsPresent(): boolean {
  return SUPABASE_REGISTRY_RESTORE_REQUIRED_CONFIRMATIONS.every((name) => process.env[name] === 'true')
}

function buildExecutionGuardReport(executeRequested: boolean): ExecutionGuardReport {
  const requiredEnv = SUPABASE_REGISTRY_RESTORE_REQUIRED_EXECUTION_ENV
  const envChecks = Object.entries(requiredEnv).map(([name, expected]) => {
    const actual = process.env[name] ?? null
    return {
      name: name as keyof typeof SUPABASE_REGISTRY_RESTORE_REQUIRED_EXECUTION_ENV,
      expected,
      actual,
      passed: actual === expected,
    }
  })
  const checks: ExecutionGuardReport['checks'] = [
    {
      name: '--execute',
      expected: true,
      actual: executeRequested,
      passed: executeRequested,
    },
    ...envChecks,
  ]
  const blockers = checks
    .filter((check) => !check.passed)
    .map((check) => check.name === '--execute'
      ? 'blocked_pending_restore_execute_flag'
      : `blocked_pending_restore_env:${check.name}`)
  const executionAttempted = executeRequested
    || confirmationsPresent()
    || Object.keys(requiredEnv).some((name) => Boolean(process.env[name]))
  const passed = blockers.length === 0
  return {
    status: passed ? 'passed' : 'blocked',
    executeRequested,
    executionAttempted,
    requiredEnv,
    checks,
    secretPayloadResolutionAllowed: passed,
    sqlAllowed: passed,
    gcsUploadAllowed: passed,
    requiredSecretSource: 'google_secret_manager',
    blockers,
  }
}

async function resolveConfirmedSecretManagerCredentials(): Promise<SupabaseMilestoneCredentialResolution> {
  try {
    const [rawSupabaseUrl, serviceRoleKey] = await Promise.all([
      accessSecretManagerValue('SUPABASE_URL'),
      accessSecretManagerValue('SUPABASE_SERVICE_ROLE_KEY'),
    ])
    if (!rawSupabaseUrl || !serviceRoleKey) {
      return missingSecretManagerCredentials('Secret Manager returned an empty SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY value.')
    }
    const normalized = normalizeSupabaseProjectUrl(rawSupabaseUrl)
    return {
      configured: true,
      source: 'google_secret_manager',
      supabaseUrl: normalized.url,
      serviceRoleKey,
      secretValuePrinted: false,
      secretValueStored: false,
      blockers: [],
      warnings: [
        'Confirmed restore credentials resolved only from Google Secret Manager without printing or storing secret values.',
        ...normalized.warnings,
      ],
    }
  } catch (error) {
    return missingSecretManagerCredentials(`Unable to resolve confirmed Secret Manager credentials: ${sanitizeError(error instanceof Error ? error.message : String(error))}`)
  }
}

async function resolveConfirmedSecretManagerDbUrl(): Promise<SupabaseMilestoneDbUrlResolution> {
  try {
    const dbUrl = await accessSecretManagerValue('SUPABASE_DB_URL')
    if (!dbUrl) {
      return missingSecretManagerDbUrl('Secret Manager returned an empty SUPABASE_DB_URL value.')
    }
    return {
      configured: true,
      source: 'google_secret_manager',
      dbUrl,
      secretValuePrinted: false,
      secretValueStored: false,
      blockers: [],
      warnings: ['Confirmed restore DB URL resolved only from SUPABASE_DB_URL in Google Secret Manager without printing or storing the value.'],
    }
  } catch (error) {
    return missingSecretManagerDbUrl(`Unable to resolve confirmed SUPABASE_DB_URL from Secret Manager: ${sanitizeError(error instanceof Error ? error.message : String(error))}`)
  }
}

async function accessSecretManagerValue(secretName: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_DB_URL'): Promise<string> {
  try {
    const { stdout } = await execFile('gcloud', [
      'secrets',
      'versions',
      'access',
      'latest',
      `--secret=${secretName}`,
      '--project=reeditpro',
    ], { maxBuffer: 8 * 1024 * 1024 })
    return stdout.trim()
  } catch (error) {
    const err = error as { message?: string; stdout?: string; stderr?: string }
    throw new Error(sanitizeError(err.stderr || err.message || String(error)), { cause: error })
  }
}

function missingSecretManagerCredentials(message: string): SupabaseMilestoneCredentialResolution {
  return {
    configured: false,
    source: 'missing',
    secretValuePrinted: false,
    secretValueStored: false,
    blockers: [message],
    warnings: ['Confirmed registry restore requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from Google Secret Manager.'],
  }
}

function missingSecretManagerDbUrl(message: string): SupabaseMilestoneDbUrlResolution {
  return {
    configured: false,
    source: 'unavailable',
    secretValuePrinted: false,
    secretValueStored: false,
    blockers: [message],
    warnings: ['Confirmed registry restore requires SUPABASE_DB_URL from Google Secret Manager.'],
  }
}

async function buildGcpMetadataReport(): Promise<Record<string, unknown>> {
  const account = await safeGcloud(['config', 'get-value', 'account'])
  const project = await safeGcloud(['config', 'get-value', 'project'])
  const projectDescribe = await safeGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)'])
  const blockers = [
    account.ok ? null : `gcloud account metadata unavailable: ${account.error}`,
    project.ok && project.stdout.trim() === 'reeditpro' ? null : 'Active gcloud project must be reeditpro.',
    projectDescribe.ok && projectDescribe.stdout.trim() === 'reeditpro' ? null : `gcloud project describe failed: ${projectDescribe.ok ? 'unexpected project id' : projectDescribe.error}`,
  ].filter(Boolean) as string[]
  return {
    status: blockers.length ? 'blocked' : 'passed',
    account: account.ok ? account.stdout.trim() : null,
    project: project.ok ? project.stdout.trim() : null,
    projectDescribe: projectDescribe.ok ? projectDescribe.stdout.trim() : null,
    metadataOnly: true,
    blockers,
  }
}

async function buildSecretMetadataReport(): Promise<SecretMetadataReport> {
  const secretNames = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_URL'] as const
  const secrets = []
  for (const name of secretNames) {
    const result = await safeGcloud(['secrets', 'describe', name, '--project=reeditpro', '--format=value(name)'])
    secrets.push({
      name,
      present: result.ok,
      metadataOnly: true as const,
      blocker: result.ok ? undefined : result.error,
    })
  }
  const blockers = secrets.filter((secret) => !secret.present).map((secret) => `${secret.name}: ${secret.blocker ?? 'metadata missing'}`)
  return {
    status: blockers.length ? 'blocked' : 'passed',
    secrets,
    secretPayloadsRead: false,
    secretPayloadsPrinted: false,
    blockers,
  }
}

async function buildBucketMetadataReport(): Promise<BucketMetadataReport> {
  const buckets = [SUPABASE_REGISTRY_RESTORE_GENERATED_BUCKET, SUPABASE_REGISTRY_RESTORE_QA_BUCKET]
  const results = []
  for (const bucket of buckets) {
    const describe = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=value(name)'])
    const iam = await safeGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    const publicPrincipalDetected = iam.ok && (iam.stdout.includes('allUsers') || iam.stdout.includes('allAuthenticatedUsers'))
    results.push({
      bucket,
      present: describe.ok,
      publicPrincipalDetected,
      blocker: !describe.ok ? describe.error : publicPrincipalDetected ? 'Public principal detected in bucket IAM.' : undefined,
    })
  }
  const blockers = results.filter((bucket) => !bucket.present || bucket.publicPrincipalDetected).map((bucket) => `${bucket.bucket}: ${bucket.blocker ?? 'bucket metadata blocked'}`)
  return { status: blockers.length ? 'blocked' : 'passed', buckets: results, blockers }
}

function buildMigrationSafetyReport(): MigrationSafetyReport {
  const migrationFile = supabaseMilestoneRegistryConfig.migrationFile
  const exists = existsSync(migrationFile)
  const text = exists ? readFileSync(migrationFile, 'utf8') : ''
  const expectedTablesPresent = supabaseMilestoneRegistryTableNames.every((table) => text.includes(`public.${table}`))
  const destructiveStatementsDetected = /\b(drop\s+table|drop\s+schema|truncate\s+table|delete\s+from|alter\s+table\s+\S+\s+drop\s+column)\b/i.test(text)
  const blockers = []
  if (!exists) blockers.push(`${migrationFile} is missing.`)
  if (!expectedTablesPresent) blockers.push('Migration does not include all six Phase 51D registry table names.')
  if (destructiveStatementsDetected) blockers.push('Migration contains destructive table/schema/data statements.')
  return {
    status: blockers.length ? 'blocked' : 'passed',
    migrationFile,
    exists,
    expectedTablesPresent,
    destructiveStatementsDetected,
    migrationId: '202606040001',
    blockers,
    warnings: ['Static scan allows drop trigger statements but blocks table/schema/data destructive statements.'],
  }
}

async function queryRegistryCatalog(dbUrl: string): Promise<RegistryCatalogReport> {
  const values = supabaseMilestoneRegistryTableNames.map((table) => `('${table}')`).join(',')
  const sql = `
with expected(table_name) as (values ${values})
select coalesce(jsonb_agg(jsonb_build_object(
  'tableName', e.table_name,
  'exists', c.oid is not null,
  'rlsEnabled', coalesce(c.relrowsecurity, false),
  'anonUnsafeAccess', case when c.oid is null then false else has_table_privilege('anon', format('%I.%I', 'public', e.table_name), 'select') end,
  'authenticatedUnsafeAccess', case when c.oid is null then false else has_table_privilege('authenticated', format('%I.%I', 'public', e.table_name), 'select') end,
  'publicUnsafeAccess', case when c.oid is null then false else has_table_privilege('public', format('%I.%I', 'public', e.table_name), 'select') end,
  'serviceRoleAccess', case when c.oid is null then false else (
    has_table_privilege('service_role', format('%I.%I', 'public', e.table_name), 'select')
    and has_table_privilege('service_role', format('%I.%I', 'public', e.table_name), 'insert')
    and has_table_privilege('service_role', format('%I.%I', 'public', e.table_name), 'update')
    and has_table_privilege('service_role', format('%I.%I', 'public', e.table_name), 'delete')
  ) end
) order by e.table_name), '[]'::jsonb)::text
from expected e
left join pg_namespace n on n.nspname = 'public'
left join pg_class c on c.relnamespace = n.oid and c.relname = e.table_name and c.relkind in ('r', 'p');
`
  const result = await runPsql(dbUrl, ['-t', '-A', '-q', '-c', sql])
  if (!result.ok) return notAttemptedCatalogReport(result.error, 'blocked')
  try {
    const tables = JSON.parse(result.stdout.trim()) as RegistryCatalogTableStatus[]
    const allTablesPresent = tables.every((table) => table.exists)
    const rlsEnabledOnAllTables = tables.every((table) => table.exists && table.rlsEnabled)
    const unsafeAnonAuthenticatedOrPublicAccess = tables.some((table) => table.anonUnsafeAccess || table.authenticatedUnsafeAccess || table.publicUnsafeAccess)
    const serviceRoleAccessOnAllTables = tables.every((table) => table.exists && table.serviceRoleAccess)
    const blocked = !allTablesPresent || !rlsEnabledOnAllTables || unsafeAnonAuthenticatedOrPublicAccess || !serviceRoleAccessOnAllTables
    return {
      status: blocked ? 'blocked' : 'passed',
      checkedWithSql: true,
      tables,
      allTablesPresent,
      rlsEnabledOnAllTables,
      unsafeAnonAuthenticatedOrPublicAccess,
      serviceRoleAccessOnAllTables,
      blocker: blocked ? 'Registry catalog/RLS/service-role verification did not pass for all six tables.' : undefined,
    }
  } catch (error) {
    return notAttemptedCatalogReport(`Unable to parse registry catalog SQL result: ${sanitizeError(error instanceof Error ? error.message : String(error))}`, 'blocked')
  }
}

async function queryMigrationHistory(dbUrl: string): Promise<MigrationHistoryReport> {
  const sql = `
select case
  when to_regclass('supabase_migrations.schema_migrations') is null then 'missing_table'
  when exists (select 1 from supabase_migrations.schema_migrations where version = '202606040001') then 'present'
  else 'missing_version'
end;
`
  const result = await runPsql(dbUrl, ['-t', '-A', '-q', '-c', sql])
  if (!result.ok) {
    return {
      status: 'blocked',
      migrationId: '202606040001',
      checkedWithSql: true,
      historyPresent: null,
      blocker: result.error,
    }
  }
  const status = result.stdout.trim()
  const present = status === 'present'
  return {
    status: present ? 'passed' : 'warning',
    migrationId: '202606040001',
    checkedWithSql: true,
    historyPresent: present,
    blocker: present ? undefined : `Migration history did not include 202606040001 after verification (${status || 'unknown'}).`,
  }
}

function notAttemptedCatalogReport(blocker: string, status: GateStatus = 'not_attempted'): RegistryCatalogReport {
  return {
    status,
    checkedWithSql: false,
    tables: supabaseMilestoneRegistryTableNames.map((tableName) => ({
      tableName,
      exists: false,
      rlsEnabled: false,
      anonUnsafeAccess: false,
      authenticatedUnsafeAccess: false,
      publicUnsafeAccess: false,
      serviceRoleAccess: false,
    })),
    allTablesPresent: false,
    rlsEnabledOnAllTables: false,
    unsafeAnonAuthenticatedOrPublicAccess: false,
    serviceRoleAccessOnAllTables: false,
    blocker,
  }
}

function notAttemptedMigrationHistory(blocker: string): MigrationHistoryReport {
  return {
    status: 'not_attempted',
    migrationId: '202606040001',
    checkedWithSql: false,
    historyPresent: null,
    blocker,
  }
}

function notAttemptedPostgrestVisibility(blocker: string): SupabaseRegistrySchemaVerification {
  return {
    status: 'not_attempted',
    tables: supabaseMilestoneRegistryTableNames.map((tableName) => ({
      tableName,
      exists: false,
      readCountStatus: 'not_attempted',
      count: null,
      blocker,
    })),
    allTablesPresent: false,
    serviceRoleRestUsed: false,
    ddlUsedThroughRest: false,
    blockers: [blocker],
    warnings: [],
  }
}

function buildSchemaCacheVisibility(
  postgrestVisibility: SupabaseRegistrySchemaVerification,
  registryTableStatus: RegistryCatalogReport,
) {
  const catalogPresent = registryTableStatus.checkedWithSql && registryTableStatus.allTablesPresent
  return {
    status: catalogPresent && postgrestVisibility.status === 'blocked' ? 'blocked_schema_cache_visibility' : postgrestVisibility.status,
    catalogTablesPresent: catalogPresent,
    postgrestAllTablesVisible: postgrestVisibility.allTablesPresent,
    serviceRoleRestUsed: postgrestVisibility.serviceRoleRestUsed,
    blockers: postgrestVisibility.blockers,
  }
}

function buildRestorePlan(executionGuard: ExecutionGuardReport, registryTableStatus: RegistryCatalogReport) {
  return {
    mode: executionGuard.status === 'passed'
      ? 'guarded_restore'
      : executionGuard.executionAttempted ? 'blocked_pending_execution_guard' : 'proof_only',
    executeRequested: executionGuard.executeRequested,
    requiredConfirmations: SUPABASE_REGISTRY_RESTORE_REQUIRED_CONFIRMATIONS,
    requiredExecutionEnv: SUPABASE_REGISTRY_RESTORE_REQUIRED_EXECUTION_ENV,
    confirmationsPresent: confirmationsPresent(),
    executionGuardPassed: executionGuard.status === 'passed',
    confirmedSecretSourceRequired: 'google_secret_manager',
    migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
    applyOnlyThisMigration: true,
    dbPushOverFullMigrationDirectoryAllowed: false,
    historicalBackfillAllowed: false,
    provider1RerunAllowed: false,
    providerCallsAllowed: false,
    publicArtifactsAllowed: false,
    expectedTables: supabaseMilestoneRegistryTableNames,
    nextAction: executionGuard.status === 'passed'
      ? registryTableStatus.allTablesPresent ? 'verify_postgrest_visibility' : 'apply_existing_registry_migration_if_catalog_missing'
      : executionGuard.executionAttempted ? 'rerun_with_execute_and_exact_staging_env' : 'set_confirmation_gates_before_sql_or_gcs_execution',
  }
}

function buildProvider1Handoff(
  registryTableStatus: RegistryCatalogReport,
  postgrestVisibility: SupabaseRegistrySchemaVerification,
  blockers: string[],
): ProviderHandoffReport {
  const unblocked = registryTableStatus.allTablesPresent
    && registryTableStatus.rlsEnabledOnAllTables
    && !registryTableStatus.unsafeAnonAuthenticatedOrPublicAccess
    && postgrestVisibility.allTablesPresent
    && blockers.length === 0
  return {
    status: unblocked ? 'ready_to_rerun_PROVIDER_1_milestone_sync' : 'blocked',
    provider1Pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/307',
    canRerunProvider1MilestoneSync: unblocked,
    blockers: unblocked ? [] : unique([
      ...blockers,
      registryTableStatus.blocker,
      ...postgrestVisibility.blockers,
    ].filter(Boolean) as string[]),
    nextOwner: unblocked ? 'PROVIDER_GATEWAY_MODELS' : 'SUPABASE_RLS_STORAGE_DATABASE',
  }
}

function buildQaReport(input: {
  approvedStagingTarget: ReturnType<typeof buildApprovedStagingTargetReferenceReport>
  secretMetadata: SecretMetadataReport
  bucketMetadata: BucketMetadataReport
  migrationSafety: MigrationSafetyReport
  registryTableStatus: RegistryCatalogReport
  migrationHistoryStatus: MigrationHistoryReport
  postgrestVisibility: SupabaseRegistrySchemaVerification
  restoreResult: RestoreResultReport
  provider1UnblockHandoff: ProviderHandoffReport
  executionGuard: ExecutionGuardReport
  restoreConfirmed: boolean
}): QaReport {
  const restoreSafetyStatus: GateStatus = input.executionGuard.executionAttempted && input.executionGuard.status === 'blocked'
    ? 'blocked'
    : input.restoreConfirmed ? input.restoreResult.status : 'passed'
  const gates = [
    gate('approved_staging_target_verified', input.approvedStagingTarget.status, true, 'Approved staging target reference must resolve to Reeditpro / wmyyttnynmteqgcdishd / staging.'),
    gate('secret_metadata_only', input.secretMetadata.status, true, 'Secret Manager metadata is checked without printing values; proof-only mode does not read payloads.'),
    gate('registry_table_status', input.registryTableStatus.status, true, 'Six Phase 51D registry tables must exist in the approved staging target.'),
    gate('migration_history_status', input.migrationHistoryStatus.status, true, 'Migration history should include the registry migration when a migration-safe transport is available; warning is acceptable for direct psql restore when table/RLS/PostgREST checks pass.'),
    gate('rls_safety', input.registryTableStatus.status, true, 'Registry tables must have RLS enabled, no unsafe public/anon/authenticated access, and service-role access.'),
    gate('postgrest_visibility', mapPostgrestStatus(input.postgrestVisibility.status), true, 'Service-role zero-row PostgREST probes must see the six registry tables.'),
    gate('restore_safety', restoreSafetyStatus, true, 'SQL and GCS writes remain blocked unless --execute and the exact confirmed staging restore environment are present.'),
    gate('provider1_unblock_status', input.provider1UnblockHandoff.status === 'ready_to_rerun_PROVIDER_1_milestone_sync' ? 'passed' : 'blocked', true, 'Provider-1 remains blocked until table/RLS/PostgREST checks pass.'),
    gate('blocked_features', 'passed', true, 'Production, beta, broad media, provider calls, workers/tools/models, public artifacts, and unrelated SQL remain blocked.'),
  ]
  const blockers = gates.filter((item) => item.mandatory && item.status === 'blocked').map((item) => item.gateId)
  return { status: blockers.length ? 'blocked' : 'passed', gates, blockers }
}

function gate(gateId: string, status: GateStatus, mandatory: boolean, summary: string) {
  return { gateId, status, mandatory, summary }
}

function mapPostgrestStatus(status: SupabaseRegistrySchemaVerification['status']): GateStatus {
  if (status === 'completed') return 'passed'
  return status
}

function computeExecution(
  restoreConfirmed: boolean,
  qa: QaReport,
  handoff: ProviderHandoffReport,
): RestoreExecution {
  if (!restoreConfirmed && !qa.gates.some((gate) => gate.gateId === 'restore_safety' && gate.status === 'blocked')) return 'proof_only_completed'
  if (qa.status === 'passed' && handoff.status === 'ready_to_rerun_PROVIDER_1_milestone_sync') return 'restore_completed'
  return 'blocked'
}

async function uploadPrivateArtifacts(report: SupabaseRegistryRestoreReport): Promise<string[]> {
  const blockers: string[] = []
  const localRoot = path.join(os.tmpdir(), `reeditpro-supabase-registry-restore-${report.runId}`)
  await mkdir(localRoot, { recursive: true })
  const prefix = supabaseRegistryRestoreArtifactPrefix(report.runId)
  const values = buildArtifactValueMap(report)
  for (const [relativePath, value] of values) {
    const bucket = relativePath.startsWith('qa/') || relativePath.startsWith('reports/')
      ? SUPABASE_REGISTRY_RESTORE_QA_BUCKET
      : SUPABASE_REGISTRY_RESTORE_GENERATED_BUCKET
    try {
      const artifact = await uploadJson(localRoot, bucket, `${prefix}/${relativePath}`, value, relativePath)
      report.artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${relativePath}: ${sanitizeError(error instanceof Error ? error.message : String(error))}`)
    }
  }
  return blockers
}

function buildArtifactValueMap(report: SupabaseRegistryRestoreReport): Array<[string, unknown]> {
  const values: Array<[string, unknown]> = [
    ['audit/staging-target-reconciliation.json', {
      approvedStagingTarget: report.approvedStagingTarget,
      gcpMetadata: report.gcpMetadata,
      secretMetadata: report.secretMetadata,
      bucketMetadata: report.bucketMetadata,
    }],
    ['audit/registry-table-status.json', report.registryTableStatus],
    ['audit/migration-history-status.json', report.migrationHistoryStatus],
    ['audit/schema-cache-visibility.json', report.schemaCacheVisibility],
    ['policy/rls-registry-access-policy-review.json', report.rlsSecurityReview],
    ['restore/registry-restore-plan.json', report.restorePlan],
    ['verification/postgrest-registry-visibility.json', report.postgrestVisibility],
    ['handoff/provider1-unblock-handoff.json', report.provider1UnblockHandoff],
    ['qa/supabase-registry-restore-qa.json', report.qa],
  ]
  values.push(['restore/registry-restore-result.json', report.restoreResult])
  values.push(['reports/supabase-registry-restore-report.json', report])
  return values
}

async function uploadJson(localRoot: string, bucket: string, objectPath: string, value: unknown, id: string): Promise<SupabaseRegistryRestoreArtifact> {
  const localPath = path.join(localRoot, id.replace(/\//g, '__'))
  await writeJson(localPath, value)
  await execFile('gcloud', ['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`], { maxBuffer: 8 * 1024 * 1024 })
  const fileStat = await stat(localPath)
  const bytes = await readFile(localPath)
  return {
    id,
    kind: 'private_json',
    bucket,
    object: objectPath,
    gcsUri: `gs://${bucket}/${objectPath}`,
    sizeBytes: fileStat.size,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string } | { ok: false; stdout: string; error: string }> {
  try {
    const { stdout } = await execFile('gcloud', args, { maxBuffer: 8 * 1024 * 1024 })
    return { ok: true, stdout }
  } catch (error) {
    const err = error as { message?: string; stdout?: string; stderr?: string }
    return { ok: false, stdout: err.stdout ?? '', error: sanitizeError(err.stderr || err.message || String(error)) }
  }
}

async function runPsql(dbUrl: string, args: string[]): Promise<{ ok: true; stdout: string } | { ok: false; stdout: string; error: string }> {
  try {
    const { stdout } = await execFile('psql', args, { env: buildPsqlEnv(dbUrl), maxBuffer: 8 * 1024 * 1024 })
    return { ok: true, stdout }
  } catch (error) {
    const err = error as { message?: string; stdout?: string; stderr?: string }
    return { ok: false, stdout: err.stdout ?? '', error: sanitizeError(err.stderr || err.message || String(error)) }
  }
}

function buildPsqlEnv(dbUrl: string): NodeJS.ProcessEnv {
  const parsed = new URL(dbUrl)
  const env: NodeJS.ProcessEnv = { ...process.env }
  env.PGHOST = parsed.hostname
  if (parsed.port) env.PGPORT = parsed.port
  env.PGDATABASE = decodeURIComponent(parsed.pathname.replace(/^\//, '') || 'postgres')
  if (parsed.username) env.PGUSER = decodeURIComponent(parsed.username)
  if (parsed.password) env.PGPASSWORD = decodeURIComponent(parsed.password)
  env.PGSSLMODE = parsed.searchParams.get('sslmode') || 'require'
  env.PGCONNECT_TIMEOUT = '15'
  delete env.SUPABASE_DB_URL
  delete env.DATABASE_URL
  return env
}

function extractProjectRef(supabaseUrl: string): string | null {
  try {
    const parsed = new URL(supabaseUrl)
    const [projectRef] = parsed.hostname.split('.')
    return projectRef || null
  } catch {
    return null
  }
}

function normalizeSupabaseProjectUrl(rawUrl: string): { url: string; warnings: string[] } {
  try {
    const parsed = new URL(rawUrl)
    const normalized = `${parsed.protocol}//${parsed.host}`
    const warnings: string[] = []
    if (parsed.pathname !== '/' && parsed.pathname !== '') {
      warnings.push('Secret Manager SUPABASE_URL contained a path and was normalized to the project origin before creating the server-only client.')
    }
    return { url: normalized, warnings }
  } catch {
    return {
      url: rawUrl,
      warnings: ['Secret Manager SUPABASE_URL could not be parsed for path normalization; the raw backend-only value was passed to the client without printing it.'],
    }
  }
}

function extractStringArray(value: Record<string, unknown>, key: string): string[] {
  const raw = value[key]
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : []
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function sanitizeError(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .replace(/password\s*=\s*[^\s,\n]+/gi, 'password=<redacted>')
    .replace(/\/var\/folders\/[^\s]+/g, '<local-temp-file>')
    .slice(0, 700)
}

function renderResultsDoc(report: SupabaseRegistryRestoreReport): string {
  const tableLines = report.registryTableStatus.tables
    .map((table) => `- \`${table.tableName}\`: ${table.exists ? 'present' : 'missing_or_not_checked'}`)
    .join('\n')
  const artifactLines = report.artifacts.length
    ? report.artifacts.map((artifact) => `- \`${artifact.gcsUri}\``).join('\n')
    : '- None. Proof-only mode does not upload GCS artifacts.'
  return `# SUPABASE-REGISTRY-1 Activation Milestone Registry Staging Restoration Results

Status: \`${report.execution}\`

Branch: \`${report.branch}\`

Base: \`${report.baseBranch}\`

Run ID: \`${report.runId}\`

## Execution

- Proof-only mode: \`${!report.sqlExecuted && !report.gcsUploaded}\`
- SQL executed: \`${report.sqlExecuted}\`
- Migration deployed: \`${report.migrationDeployed}\`
- Supabase rows written: \`${report.supabaseRowsWritten}\`
- GCS uploaded: \`${report.gcsUploaded}\`

## Approved Staging Target

- Project label: \`${report.approvedStagingTarget.approvedStagingProjectName ?? 'unknown'}\`
- Project ref: \`${report.approvedStagingTarget.approvedStagingProjectRef ?? 'unknown'}\`
- Environment: \`${report.approvedStagingTarget.approvedEnvironment ?? 'unknown'}\`

## Registry Tables

${tableLines}

## Migration Status

- Migration file: \`${report.migrationSafety.migrationFile}\`
- Static migration safety: \`${report.migrationSafety.status}\`
- Migration history status: \`${report.migrationHistoryStatus.status}\`
- Migration history present: \`${report.migrationHistoryStatus.historyPresent ?? 'not_checked'}\`

## RLS And Security

- RLS enabled on all tables: \`${report.registryTableStatus.rlsEnabledOnAllTables}\`
- Unsafe public/anon/authenticated access: \`${report.registryTableStatus.unsafeAnonAuthenticatedOrPublicAccess}\`
- Service-role access on all tables: \`${report.registryTableStatus.serviceRoleAccessOnAllTables}\`
- Secret payloads printed: \`false\`

## PostgREST Visibility

- Status: \`${report.postgrestVisibility.status}\`
- Service-role REST used: \`${report.postgrestVisibility.serviceRoleRestUsed}\`
- All tables visible: \`${report.postgrestVisibility.allTablesPresent}\`

## Provider-1 Unblock Status

- Status: \`${report.provider1UnblockHandoff.status}\`
- Can rerun Provider-1 milestone sync: \`${report.provider1UnblockHandoff.canRerunProvider1MilestoneSync}\`
- Next owner: \`${report.provider1UnblockHandoff.nextOwner}\`

## Artifacts

${artifactLines}

## QA

- QA status: \`${report.qa.status}\`
- Blockers: ${report.blockers.length ? report.blockers.map((blocker) => `\`${blocker}\``).join(', ') : '`none`'}

## Blocked Features

${report.blockedFeatures.map((feature) => `- \`${feature}\``).join('\n')}

## Human Action Required

${report.execution === 'proof_only_completed'
    ? 'Set `REEDITPRO_CONFIRM_SUPABASE_REGISTRY_RESTORE=true` and `REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL=true` in a fresh shell before running guarded staging SQL restore.'
    : report.provider1UnblockHandoff.status === 'ready_to_rerun_PROVIDER_1_milestone_sync'
      ? 'Hand back to PROVIDER_GATEWAY_MODELS to rerun Provider-1 milestone sync.'
      : 'Resolve the listed Supabase registry blockers before rerunning guarded restore.'}
`
}
