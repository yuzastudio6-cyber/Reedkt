#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'SUPABASE-CLEAN-STAGING-BRANCH-CURRENT-TARGET-GUARDED-VALIDATION-1'
const confirmationVar = 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_CURRENT_TARGET_VALIDATION'
const gcpProject = 'reeditpro'
const cleanBranchDbUrlSecret = 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL'
const accessTokenSecret = 'SUPABASE_ACCESS_TOKEN'
const parentProjectName = 'Reeditpro'
const parentProjectRef = 'wmyyttnynmteqgcdishd'
const cleanBranchName = 'reeditpro-internal-staging-clean'
const cleanBranchRef = 'fnjiylwirntrqdcwpbho'
const targetRegistryMigrationId = '202606050001'
const workerRpcMigrationId = '202606180001'
const internalBetaGapMigrationId = '20260625031135'
const reportDir = 'docs/activation-supabase-clean-staging-branch-current-target-guarded-validation-1-reports'
const reportPath = path.join(reportDir, 'clean_staging_branch_current_target_guarded_validation_report.json')
const manifestPath = path.join(reportDir, 'clean_staging_branch_current_target_guarded_validation_manifest.json')
const baseOutputDir = '/tmp/reeditpro-supabase-clean-staging-branch-current-target-guarded-validation-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)

const activationTables = [
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
]

const workerRuntimeTables = [
  'worker_jobs',
  'worker_job_events',
  'worker_job_artifacts',
]

const internalBetaTables = [
  'artifact_manifests',
  'artifact_manifest_items',
]

const privateBuckets = [
  'source-media',
  'generated-assets',
  'processed-media',
  'previews',
  'exports',
  'thumbnails',
  'qa-artifacts',
  'worker-temp',
]

fs.mkdirSync(reportDir, { recursive: true })
fs.mkdirSync(outputDir, { recursive: true })

function sanitize(value) {
  return String(value ?? '')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/\bpostgres(?:ql)?:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(/postgres:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(/password=[^\s]+/gi, 'password=[redacted]')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function finish(report, exitCode) {
  const finalReport = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    parentProjectName,
    parentProjectRef,
    cleanBranchName,
    cleanBranchRef,
    cleanBranchDbUrlSecret,
    accessTokenSecret,
    ...report,
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(finalReport, null, 2)}\n`)
  const manifest = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [
      {
        fileName: path.basename(reportPath),
        path: reportPath,
        bytes: fs.statSync(reportPath).size,
        sha256: sha256(reportPath),
      },
    ],
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  manifest.artifacts.push({
    fileName: path.basename(manifestPath),
    path: manifestPath,
    bytes: fs.statSync(manifestPath).size,
    sha256: sha256(manifestPath),
  })
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  console.log(`${packet} result: ${finalReport.decision}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Report: ${reportPath}`)
  console.log(`Manifest: ${manifestPath}`)
  process.exit(exitCode)
}

function buildSafety(overrides = {}) {
  return {
    secretManagerPayloadAccess: false,
    credentialPayloadPrinted: false,
    credentialPayloadPersistedInRepo: false,
    supabaseManagementApiRead: false,
    remoteSupabaseReadCommand: false,
    remoteSupabaseMutation: false,
    sqlExecution: false,
    sqlMutation: false,
    readOnlyCatalogSql: false,
    migrationApply: false,
    migrationHistoryTableEdited: false,
    storageBucketCreation: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    storageBucketMetadataRead: false,
    serviceRoleRouteExecution: false,
    workerExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
    ...overrides,
  }
}

function gcloud(args) {
  return execFileSync('gcloud', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120000,
  })
}

function latestSecretVersion(secretName) {
  try {
    const output = gcloud([
      'secrets',
      'versions',
      'list',
      secretName,
      `--project=${gcpProject}`,
      '--limit=1',
      '--sort-by=~createTime',
      '--format=value(name,state,createTime)',
    ]).trim()
    const [name, state, createTime] = output.split(/\s+/)
    return { present: Boolean(name), name: name ?? null, state: state ?? null, createTime: createTime ?? null }
  } catch (error) {
    return { present: false, name: null, state: null, createTime: null, sanitizedError: sanitize(error.stderr?.toString() || error.message) }
  }
}

function accessSecretPayload(secretName) {
  return gcloud([
    'secrets',
    'versions',
    'access',
    'latest',
    `--project=${gcpProject}`,
    `--secret=${secretName}`,
  ]).trim()
}

function commandSummary(result, commandClass) {
  return {
    commandClass,
    status: result.status,
    exitCode: result.exitCode,
    stdout: summarizeText(result.stdout),
    stderr: summarizeText(result.stderr),
  }
}

function summarizeText(text) {
  const sanitized = sanitize(text)
  return {
    byteLength: Buffer.byteLength(sanitized),
    lineCount: sanitized.trim().length === 0 ? 0 : sanitized.trim().split(/\r?\n/).length,
    snippet: sanitized.trim().slice(0, 1000),
    secretPatternDetected: /sbp_[A-Za-z0-9_./=-]+|\bpostgres(?:ql)?:\/\/\S+/i.test(sanitized.replaceAll('postgresql://[redacted]', '')),
  }
}

function run(command, args, options = {}) {
  try {
    const stdout = execFileSync(command, args, {
      encoding: 'utf8',
      env: options.env ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: options.timeoutMs ?? 120000,
    })
    return { status: 'passed', exitCode: 0, stdout, stderr: '' }
  } catch (error) {
    return {
      status: 'blocked',
      exitCode: typeof error.status === 'number' ? error.status : 1,
      stdout: error.stdout?.toString() ?? '',
      stderr: error.stderr?.toString() ?? error.message,
    }
  }
}

function runSupabaseMigrationList(dbUrl) {
  const result = run('supabase', [
    '--output-format',
    'json',
    'migration',
    'list',
    '--db-url',
    dbUrl,
  ], { timeoutMs: 180000 })
  const parsed = parseJson(result.stdout)
  const textIds = extractMigrationIdsFromText(result.stdout)
  const migrationIds = extractMigrationIds(parsed, result.stdout)
  return {
    status: result.status === 'passed' && migrationIds.length > 0 ? 'passed' : 'blocked',
    commandClass: 'supabase migration list --db-url [redacted]',
    dbUrlPrinted: false,
    commandResult: commandSummary(result, 'supabase migration list --db-url [redacted]'),
    migrationHistoryParsed: parsed !== null,
    migrationHistoryTextParsed: textIds.textParsed,
    migrationIds,
    localMigrationIds: textIds.localMigrationIds,
    remoteMigrationIds: textIds.remoteMigrationIds,
    pendingLocalMigrationIds: textIds.pendingLocalMigrationIds,
    requiredMigrationIds: [
      targetRegistryMigrationId,
      workerRpcMigrationId,
      internalBetaGapMigrationId,
    ],
    targetRegistryMigrationPresent: migrationIds.includes(targetRegistryMigrationId),
    workerRpcMigrationPresent: migrationIds.includes(workerRpcMigrationId),
    internalBetaGapMigrationPresent: migrationIds.includes(internalBetaGapMigrationId),
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractMigrationIds(parsed, text = '') {
  const ids = new Set()
  const visit = (value) => {
    if (typeof value === 'string' && /^\d{12,14}$/.test(value)) ids.add(value)
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry)
      return
    }
    for (const [key, entry] of Object.entries(value)) {
      if (/version|migration/i.test(key) && typeof entry === 'string' && /^\d{12,14}/.test(entry)) {
        ids.add(entry.slice(0, 14))
      }
      visit(entry)
    }
  }
  visit(parsed)
  for (const id of extractMigrationIdsFromText(text).remoteMigrationIds) ids.add(id)
  return [...ids].sort()
}

function extractMigrationIdsFromText(text) {
  const localMigrationIds = new Set()
  const remoteMigrationIds = new Set()
  const pendingLocalMigrationIds = new Set()
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const match = line.match(/^\s*(\d{12,14})\s*\|\s*(\d{12,14})?\s*\|/)
    if (!match) continue
    const local = match[1]
    const remote = match[2] ?? ''
    localMigrationIds.add(local)
    if (remote) {
      remoteMigrationIds.add(remote)
    } else {
      pendingLocalMigrationIds.add(local)
    }
  }
  return {
    textParsed: localMigrationIds.size > 0,
    localMigrationIds: [...localMigrationIds].sort(),
    remoteMigrationIds: [...remoteMigrationIds].sort(),
    pendingLocalMigrationIds: [...pendingLocalMigrationIds].sort(),
  }
}

function quoteList(values) {
  return values.map((value) => `('${value.replaceAll("'", "''")}')`).join(',')
}

function sqlTextArray(values) {
  return `array[${values.map((value) => `'${value.replaceAll("'", "''")}'`).join(',')}]::text[]`
}

function runReadOnlyCatalogSql(dbUrl) {
  const expectedTables = [...activationTables, ...workerRuntimeTables, ...internalBetaTables]
  const sql = `
with expected_tables(table_name) as (
  values ${quoteList(expectedTables)}
),
expected_buckets(bucket_id) as (
  values ${quoteList(privateBuckets)}
),
table_status as (
  select
    e.table_name,
    c.oid is not null as present,
    coalesce(c.relrowsecurity, false) as rls_enabled
  from expected_tables e
  left join pg_namespace n on n.nspname = 'public'
  left join pg_class c on c.relnamespace = n.oid and c.relname = e.table_name and c.relkind in ('r', 'p')
),
policy_counts as (
  select tablename, count(*)::int as policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename in (select table_name from expected_tables)
  group by tablename
),
storage_status as (
  select
    e.bucket_id,
    b.id is not null as present,
    coalesce(b.public, false) as public
  from expected_buckets e
  left join storage.buckets b on b.id = e.bucket_id
)
select jsonb_build_object(
  'expectedTableCount', (select count(*) from expected_tables),
  'presentTableCount', (select count(*) from table_status where present),
  'missingTables', coalesce((select jsonb_agg(table_name order by table_name) from table_status where not present), '[]'::jsonb),
  'rlsEnabledTableCount', (select count(*) from table_status where present and rls_enabled),
  'rlsMissingTables', coalesce((select jsonb_agg(table_name order by table_name) from table_status where present and not rls_enabled), '[]'::jsonb),
  'policyCount', coalesce((select sum(policy_count)::int from policy_counts), 0),
  'activationTablesExpected', to_jsonb(${sqlTextArray(activationTables)}),
  'workerRuntimeTablesExpected', to_jsonb(${sqlTextArray(workerRuntimeTables)}),
  'internalBetaTablesExpected', to_jsonb(${sqlTextArray(internalBetaTables)}),
  'privateBucketsExpected', to_jsonb(${sqlTextArray(privateBuckets)}),
  'presentPrivateBuckets', coalesce((select jsonb_agg(bucket_id order by bucket_id) from storage_status where present), '[]'::jsonb),
  'missingPrivateBuckets', coalesce((select jsonb_agg(bucket_id order by bucket_id) from storage_status where not present), '[]'::jsonb),
  'publicPrivateBuckets', coalesce((select jsonb_agg(bucket_id order by bucket_id) from storage_status where public), '[]'::jsonb)
)::text;
`
  const result = run('psql', [
    dbUrl,
    '-X',
    '-q',
    '-t',
    '-A',
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    sql,
  ], { timeoutMs: 180000 })
  const parsed = parseJson(result.stdout.trim())
  return {
    status: result.status === 'passed' && parsed ? 'passed' : 'blocked',
    commandClass: 'psql readonly catalog query against public/storage metadata [db-url redacted]',
    dbUrlPrinted: false,
    directDdlDmlRun: false,
    storageObjectRead: false,
    storageBucketMetadataRead: result.status === 'passed',
    commandResult: commandSummary(result, 'psql readonly catalog query [db-url redacted]'),
    catalogJsonParsed: parsed !== null,
    catalogReadback: parsed,
  }
}

if (process.env[confirmationVar] !== 'true') {
  finish({
    decision: 'blocked_pending_clean_staging_branch_current_target_validation_confirmation',
    execution: 'blocked_confirmation_absent_no_secret_payload_access',
    blocker: 'blocked_pending_clean_staging_branch_current_target_validation_confirmation',
    confirmation: 'absent_or_not_true',
    currentValidation: 'not_run_confirmation_absent',
    safety: buildSafety(),
  }, 1)
}

const accessTokenMetadata = latestSecretVersion(accessTokenSecret)
const cleanDbUrlMetadata = latestSecretVersion(cleanBranchDbUrlSecret)

let dbUrl
try {
  dbUrl = accessSecretPayload(cleanBranchDbUrlSecret)
} catch (error) {
  finish({
    decision: 'blocked_missing_clean_branch_db_url_secret_payload',
    execution: 'blocked_before_remote_readback',
    blocker: 'blocked_missing_clean_branch_db_url_secret_payload',
    confirmation: 'present_true',
    credentialMetadata: {
      supabaseAccessTokenSecret: accessTokenSecret,
      supabaseAccessTokenLatestVersion: accessTokenMetadata,
      cleanBranchDbUrlSecret: cleanBranchDbUrlSecret,
      cleanBranchDbUrlLatestVersion: cleanDbUrlMetadata,
    },
    sanitizedError: sanitize(error.stderr?.toString() || error.message),
    safety: buildSafety({ secretManagerPayloadAccess: false }),
  }, 1)
}

if (!/^postgres(?:ql)?:\/\//i.test(dbUrl)) {
  finish({
    decision: 'blocked_clean_branch_db_url_secret_payload_invalid',
    execution: 'blocked_before_remote_readback',
    blocker: 'blocked_clean_branch_db_url_secret_payload_invalid',
    confirmation: 'present_true',
    credentialMetadata: {
      supabaseAccessTokenSecret: accessTokenSecret,
      supabaseAccessTokenLatestVersion: accessTokenMetadata,
      cleanBranchDbUrlSecret: cleanBranchDbUrlSecret,
      cleanBranchDbUrlLatestVersion: cleanDbUrlMetadata,
    },
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      credentialPayloadPrinted: false,
      credentialPayloadPersistedInRepo: false,
    }),
  }, 1)
}

const migrationHistory = runSupabaseMigrationList(dbUrl)
const missingMigrations = migrationHistory.requiredMigrationIds.filter((id) => !migrationHistory.migrationIds.includes(id))
const catalog = migrationHistory.status === 'passed' && missingMigrations.length === 0 ? runReadOnlyCatalogSql(dbUrl) : null
const missingTables = catalog?.catalogReadback?.missingTables ?? []
const rlsMissingTables = catalog?.catalogReadback?.rlsMissingTables ?? []
const publicPrivateBuckets = catalog?.catalogReadback?.publicPrivateBuckets ?? []
const missingPrivateBuckets = catalog?.catalogReadback?.missingPrivateBuckets ?? []

let decision = 'completed_clean_staging_branch_current_target_guarded_validation'
let blocker = 'none'
if (migrationHistory.status !== 'passed' || missingMigrations.length > 0) {
  decision = 'blocked_clean_branch_migration_history_not_current'
  blocker = 'blocked_clean_branch_migration_history_not_current'
} else if (!catalog || catalog.status !== 'passed') {
  decision = 'blocked_clean_branch_catalog_readback_failed'
  blocker = 'blocked_clean_branch_catalog_readback_failed'
} else if (missingTables.length > 0 || rlsMissingTables.length > 0) {
  decision = 'blocked_clean_branch_schema_rls_readback_failed'
  blocker = 'blocked_clean_branch_schema_rls_readback_failed'
} else if (missingPrivateBuckets.length > 0 || publicPrivateBuckets.length > 0) {
  decision = 'blocked_clean_branch_private_storage_bucket_metadata_readback_failed'
  blocker = 'blocked_clean_branch_private_storage_bucket_metadata_readback_failed'
}

finish({
  decision,
  execution: decision === 'completed_clean_staging_branch_current_target_guarded_validation'
    ? 'completed_guarded_clean_branch_readonly_migration_schema_storage_validation_no_mutation'
    : 'blocked_guarded_clean_branch_readonly_validation_no_mutation',
  blocker,
  confirmation: 'present_true',
  credentialMetadata: {
    supabaseAccessTokenSecret: accessTokenSecret,
    supabaseAccessTokenLatestVersion: accessTokenMetadata,
    cleanBranchDbUrlSecret: cleanBranchDbUrlSecret,
    cleanBranchDbUrlLatestVersion: cleanDbUrlMetadata,
    dbUrlPayloadPrinted: false,
    dbUrlPayloadPersistedInRepo: false,
  },
  migrationHistory,
  schemaRlsReadback: catalog,
  validationSummary: {
    missingMigrations,
    missingTables,
    rlsMissingTables,
    missingPrivateBuckets,
    publicPrivateBuckets,
    targetRegistryMigrationPresent: migrationHistory.targetRegistryMigrationPresent === true,
    workerRpcMigrationPresent: migrationHistory.workerRpcMigrationPresent === true,
    internalBetaGapMigrationPresent: migrationHistory.internalBetaGapMigrationPresent === true,
  },
  readiness: {
    workerRuntimeTransactionalContract2: decision === 'completed_clean_staging_branch_current_target_guarded_validation'
      ? 'ready_for_clean_staging_worker_rpc_readback'
      : 'blocked_pending_clean_staging_migration_chain_currentness',
    workerRuntimeTrackaPrivateE2eExecutionGate2r: decision === 'completed_clean_staging_branch_current_target_guarded_validation'
      ? 'blocked_pending_worker_rpc_readback_and_service_role_runtime_validation'
      : 'blocked_pending_clean_staging_migration_chain_currentness',
    internalBetaReadinessRollup: decision === 'completed_clean_staging_branch_current_target_guarded_validation'
      ? 'blocked_pending_worker_rpc_readback_service_role_runtime_private_storage_and_runtime_gates'
      : 'blocked_pending_clean_staging_migration_chain_currentness',
    externalProductBeta: 'blocked_pending_internal_beta_evidence_security_privacy_support_cost_and_deployment_gates',
  },
  safety: buildSafety({
    secretManagerPayloadAccess: true,
    credentialPayloadPrinted: false,
    credentialPayloadPersistedInRepo: false,
    remoteSupabaseReadCommand: true,
    sqlExecution: Boolean(catalog),
    readOnlyCatalogSql: Boolean(catalog),
    storageBucketMetadataRead: Boolean(catalog),
    storageObjectRead: false,
  }),
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}, decision === 'completed_clean_staging_branch_current_target_guarded_validation' ? 0 : 1)
