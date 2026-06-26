#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-RECONCILIATION-1'
const confirmationVar = 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_MIGRATION_HISTORY_RECONCILIATION'
const gcpProject = 'reeditpro'
const cleanBranchDbUrlSecret = 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL'
const accessTokenSecret = 'SUPABASE_ACCESS_TOKEN'
const parentProjectName = 'Reeditpro'
const parentProjectRef = 'wmyyttnynmteqgcdishd'
const cleanBranchName = 'reeditpro-internal-staging-clean'
const cleanBranchRef = 'fnjiylwirntrqdcwpbho'
const knownPluginGeneratedRegistryVersion = '20260610235210'
const unknownRemoteOnlyVersion = '20260626162800'
const reportDir = 'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports'
const reportPath = path.join(reportDir, 'clean_staging_branch_migration_history_reconciliation_report.json')
const manifestPath = path.join(reportDir, 'clean_staging_branch_migration_history_reconciliation_manifest.json')
const baseOutputDir = '/tmp/reeditpro-supabase-clean-staging-branch-migration-history-reconciliation-1'
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
    .replace(/password=[^\s]+/gi, 'password=[redacted]')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function summarizeText(text) {
  const sanitized = sanitize(text)
  return {
    byteLength: Buffer.byteLength(sanitized),
    lineCount: sanitized.trim().length === 0 ? 0 : sanitized.trim().split(/\r?\n/).length,
    snippet: sanitized.trim().slice(0, 2000),
    secretPatternDetected: /sbp_[A-Za-z0-9_./=-]+|\bpostgres(?:ql)?:\/\/\S+/i.test(sanitized.replaceAll('postgresql://[redacted]', '')),
  }
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
    remoteSupabaseReadCommand: false,
    remoteSupabaseMutation: false,
    sqlExecution: false,
    sqlMutation: false,
    migrationDryRun: false,
    migrationApply: false,
    migrationHistoryManualEdit: false,
    supabaseDbPull: false,
    branchResetOrRecreate: false,
    readOnlyCatalogSql: false,
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

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractMigrationIdsFromText(text) {
  const localMigrationIds = new Set()
  const remoteMigrationIds = new Set()
  const pendingLocalMigrationIds = new Set()
  const remoteOnlyMigrationIds = new Set()
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const match = line.match(/^\s*(\d{12,14})?\s*\|\s*(\d{12,14})?\s*\|/)
    if (!match) continue
    const local = match[1] ?? ''
    const remote = match[2] ?? ''
    if (local) localMigrationIds.add(local)
    if (remote) {
      remoteMigrationIds.add(remote)
      if (!local) remoteOnlyMigrationIds.add(remote)
    } else if (local) {
      pendingLocalMigrationIds.add(local)
    }
  }
  return {
    textParsed: localMigrationIds.size > 0 || remoteMigrationIds.size > 0,
    localMigrationIds: [...localMigrationIds].sort(),
    remoteMigrationIds: [...remoteMigrationIds].sort(),
    pendingLocalMigrationIds: [...pendingLocalMigrationIds].sort(),
    remoteOnlyMigrationIds: [...remoteOnlyMigrationIds].sort(),
    untrackedRemoteMigrationIds: [...remoteOnlyMigrationIds].filter((id) => !localMigrationIds.has(id)).sort(),
  }
}

function runMigrationList(dbUrl) {
  const result = run('supabase', [
    '--output-format',
    'json',
    'migration',
    'list',
    '--db-url',
    dbUrl,
  ], { timeoutMs: 180000 })
  const textIds = extractMigrationIdsFromText(result.stdout)
  return {
    status: result.status === 'passed' && textIds.remoteMigrationIds.length > 0 ? 'passed' : 'blocked',
    commandClass: 'supabase migration list --db-url [redacted]',
    dbUrlPrinted: false,
    commandResult: commandSummary(result, 'supabase migration list --db-url [redacted]'),
    migrationHistoryTextParsed: textIds.textParsed,
    ...textIds,
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
storage_status as (
  select
    e.bucket_id,
    b.id is not null as present,
    coalesce(b.public, false) as is_public
  from expected_buckets e
  left join storage.buckets b on b.id = e.bucket_id
),
migration_status as (
  select version::text
  from supabase_migrations.schema_migrations
),
worker_runtime_functions as (
  select p.proname::text as function_name
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'worker_runtime'
)
select jsonb_build_object(
  'remoteMigrationVersions', coalesce((select jsonb_agg(version order by version) from migration_status), '[]'::jsonb),
  'expectedTableCount', (select count(*) from expected_tables),
  'presentTableCount', (select count(*) from table_status where present),
  'missingTables', coalesce((select jsonb_agg(table_name order by table_name) from table_status where not present), '[]'::jsonb),
  'rlsEnabledTableCount', (select count(*) from table_status where present and rls_enabled),
  'rlsMissingTables', coalesce((select jsonb_agg(table_name order by table_name) from table_status where present and not rls_enabled), '[]'::jsonb),
  'activationTablesExpected', to_jsonb(${sqlTextArray(activationTables)}),
  'workerRuntimeTablesExpected', to_jsonb(${sqlTextArray(workerRuntimeTables)}),
  'internalBetaTablesExpected', to_jsonb(${sqlTextArray(internalBetaTables)}),
  'privateBucketsExpected', to_jsonb(${sqlTextArray(privateBuckets)}),
  'presentPrivateBuckets', coalesce((select jsonb_agg(bucket_id order by bucket_id) from storage_status where present), '[]'::jsonb),
  'missingPrivateBuckets', coalesce((select jsonb_agg(bucket_id order by bucket_id) from storage_status where not present), '[]'::jsonb),
  'publicPrivateBuckets', coalesce((select jsonb_agg(bucket_id order by bucket_id) from storage_status where is_public), '[]'::jsonb),
  'workerRuntimeFunctions', coalesce((select jsonb_agg(function_name order by function_name) from worker_runtime_functions), '[]'::jsonb)
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
    commandClass: 'psql readonly catalog query against migration/public/storage metadata [db-url redacted]',
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
    decision: 'blocked_pending_clean_staging_branch_migration_history_reconciliation_confirmation',
    execution: 'blocked_confirmation_absent_no_secret_payload_access',
    blocker: 'blocked_pending_clean_staging_branch_migration_history_reconciliation_confirmation',
    confirmation: 'absent_or_not_true',
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
    execution: 'blocked_before_readonly_reconciliation',
    blocker: 'blocked_missing_clean_branch_db_url_secret_payload',
    confirmation: 'present_true',
    credentialMetadata: {
      supabaseAccessTokenSecret: accessTokenSecret,
      supabaseAccessTokenLatestVersion: accessTokenMetadata,
      cleanBranchDbUrlSecret,
      cleanBranchDbUrlLatestVersion: cleanDbUrlMetadata,
    },
    sanitizedError: sanitize(error.stderr?.toString() || error.message),
    safety: buildSafety(),
  }, 1)
}

if (!/^postgres(?:ql)?:\/\//i.test(dbUrl)) {
  finish({
    decision: 'blocked_clean_branch_db_url_secret_payload_invalid',
    execution: 'blocked_before_readonly_reconciliation',
    blocker: 'blocked_clean_branch_db_url_secret_payload_invalid',
    confirmation: 'present_true',
    credentialMetadata: {
      supabaseAccessTokenSecret: accessTokenSecret,
      supabaseAccessTokenLatestVersion: accessTokenMetadata,
      cleanBranchDbUrlSecret,
      cleanBranchDbUrlLatestVersion: cleanDbUrlMetadata,
    },
    safety: buildSafety({ secretManagerPayloadAccess: true }),
  }, 1)
}

const migrationHistory = runMigrationList(dbUrl)
const catalog = runReadOnlyCatalogSql(dbUrl)
const remoteOnlyMigrationIds = migrationHistory.untrackedRemoteMigrationIds ?? []
const missingTables = catalog.catalogReadback?.missingTables ?? []
const rlsMissingTables = catalog.catalogReadback?.rlsMissingTables ?? []
const missingPrivateBuckets = catalog.catalogReadback?.missingPrivateBuckets ?? []
const publicPrivateBuckets = catalog.catalogReadback?.publicPrivateBuckets ?? []

const activationTablesPresent = activationTables.every((tableName) => !missingTables.includes(tableName))
const activationRlsPresent = activationTables.every((tableName) => !rlsMissingTables.includes(tableName))
const workerTablesPresent = workerRuntimeTables.every((tableName) => !missingTables.includes(tableName))
const internalBetaTablesPresent = internalBetaTables.every((tableName) => !missingTables.includes(tableName))
const privateBucketsPresent = privateBuckets.every((bucketId) => !missingPrivateBuckets.includes(bucketId))
const privateBucketsPrivate = publicPrivateBuckets.length === 0

const sourceMappings = []
if (remoteOnlyMigrationIds.includes(knownPluginGeneratedRegistryVersion) && activationTablesPresent && activationRlsPresent) {
  sourceMappings.push({
    remoteOnlyMigrationId: knownPluginGeneratedRegistryVersion,
    mappingStatus: 'source_mapped_to_plugin_generated_activation_registry_equivalent',
    committedMigrationId: '202606050001',
    committedMigrationFile: 'supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql',
    evidence: 'docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_branch_migration_history_verify_report.json',
  })
}

const unmappedRemoteOnlyMigrationIds = remoteOnlyMigrationIds.filter((id) => (
  !sourceMappings.some((mapping) => mapping.remoteOnlyMigrationId === id)
))

let decision = 'blocked_clean_branch_remote_only_migration_versions_require_source_mapping'
let blocker = 'blocked_clean_branch_remote_only_migration_versions_require_source_mapping'
if (migrationHistory.status !== 'passed' || catalog.status !== 'passed') {
  decision = 'blocked_clean_branch_migration_history_reconciliation_readback_failed'
  blocker = 'blocked_clean_branch_migration_history_reconciliation_readback_failed'
} else if (unmappedRemoteOnlyMigrationIds.length > 0) {
  decision = 'blocked_clean_branch_remote_only_migration_versions_require_source_mapping'
  blocker = 'blocked_clean_branch_remote_only_migration_versions_require_source_mapping'
} else {
  decision = 'completed_clean_branch_remote_only_migration_history_source_mapping_ready_for_owner_repair_decision'
  blocker = 'none'
}

finish({
  decision,
  execution: 'completed_guarded_readonly_migration_history_reconciliation_no_mutation',
  blocker,
  confirmation: 'present_true',
  credentialMetadata: {
    supabaseAccessTokenSecret: accessTokenSecret,
    supabaseAccessTokenLatestVersion: accessTokenMetadata,
    cleanBranchDbUrlSecret,
    cleanBranchDbUrlLatestVersion: cleanDbUrlMetadata,
    dbUrlPayloadPrinted: false,
    dbUrlPayloadPersistedInRepo: false,
  },
  migrationHistory,
  schemaRlsStorageReadback: catalog,
  sourceMappings,
  unmappedRemoteOnlyMigrationIds,
  reconciliationSummary: {
    remoteOnlyMigrationIds,
    knownPluginGeneratedRegistryVersion,
    unknownRemoteOnlyVersion,
    activationTablesPresent,
    activationRlsPresent,
    workerTablesPresent,
    internalBetaTablesPresent,
    privateBucketsPresent,
    privateBucketsPrivate,
    missingTables,
    rlsMissingTables,
    missingPrivateBuckets,
    publicPrivateBuckets,
    workerRuntimeFunctions: catalog.catalogReadback?.workerRuntimeFunctions ?? [],
  },
  readiness: {
    workerRuntimeTransactionalContract2: 'blocked_pending_clean_staging_migration_history_owner_decision',
    workerRuntimeTrackaPrivateE2eExecutionGate2r: 'blocked_pending_clean_staging_migration_history_owner_decision',
    trackaPrivateE2eRevalidation2: 'blocked_pending_worker_transactional_contract',
    internalBetaReadinessRollup: 'blocked_pending_clean_staging_migration_history_owner_decision',
    externalProductBeta: 'blocked_pending_internal_beta_evidence_security_privacy_support_cost_and_deployment_gates',
  },
  safety: buildSafety({
    secretManagerPayloadAccess: true,
    credentialPayloadPrinted: false,
    credentialPayloadPersistedInRepo: false,
    remoteSupabaseReadCommand: true,
    sqlExecution: catalog.status === 'passed' ? 'read_only_catalog_sql_only' : false,
    readOnlyCatalogSql: catalog.status === 'passed',
    storageBucketMetadataRead: catalog.status === 'passed',
  }),
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}, decision === 'completed_clean_branch_remote_only_migration_history_source_mapping_ready_for_owner_repair_decision' ? 0 : 1)
