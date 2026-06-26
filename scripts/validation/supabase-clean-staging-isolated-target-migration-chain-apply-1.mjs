#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1'
const confirmationVar = 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_ISOLATED_TARGET_MIGRATION_CHAIN_APPLY'
const gcpProject = 'reeditpro'
const targetSecret = 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL'
const targetProjectName = 'reeditpro-clean-staging-isolated-v1'
const targetProjectRef = 'fajinbvwhcjnutkaumkm'
const targetClass = 'new_isolated_non_production_supabase_target'
const targetRegistryMigrationId = '202606050001'
const workerRpcMigrationId = '202606180001'
const internalBetaGapMigrationId = '20260625031135'
const reportDir = 'docs/activation-supabase-clean-staging-isolated-target-migration-chain-apply-1-reports'
const reportPath = path.join(reportDir, 'clean_staging_isolated_target_migration_chain_apply_report.json')
const manifestPath = path.join(reportDir, 'clean_staging_isolated_target_migration_chain_apply_manifest.json')
const baseOutputDir = '/tmp/reeditpro-supabase-clean-staging-isolated-target-migration-chain-apply-1'
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
    .replace(/db\.[a-z0-9-]+\.supabase\.co/gi, 'db.[redacted].supabase.co')
    .replace(/password=[^\s]+/gi, 'password=[redacted]')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function summarizeText(text, max = 2200) {
  const sanitized = sanitize(text)
  return {
    byteLength: Buffer.byteLength(sanitized),
    lineCount: sanitized.trim().length === 0 ? 0 : sanitized.trim().split(/\r?\n/).length,
    snippet: sanitized.trim().slice(0, max),
    secretPatternDetected: /sbp_[A-Za-z0-9_./=-]+|\bpostgres(?:ql)?:\/\/\S+/i.test(
      sanitized.replaceAll('postgresql://[redacted]', ''),
    ),
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
      '--format=json(name,state,createTime)',
    ]).trim()
    const parsed = JSON.parse(output || '[]')
    const latest = Array.isArray(parsed) ? parsed[0] : null
    return latest
      ? { present: true, name: latest.name ?? null, state: latest.state ?? null, createTime: latest.createTime ?? null }
      : { present: false, name: null, state: null, createTime: null }
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
    migrationHistoryTableManualEdit: false,
    migrationHistoryUpdatedBySupabaseCliApply: false,
    rlsPolicyApplyByMigration: false,
    storageBucketMetadataUpsertByMigration: false,
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

function finish(report, exitCode) {
  const finalReport = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    targetProjectName,
    targetProjectRef,
    targetClass,
    targetDbUrlSecret: targetSecret,
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

function migrationList(dbUrl) {
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
    status: result.status === 'passed' ? 'passed' : 'blocked',
    commandClass: 'supabase migration list --db-url [redacted]',
    commandResult: commandSummary(result, 'supabase migration list --db-url [redacted]'),
    migrationHistoryParsed: parsed !== null,
    migrationHistoryTextParsed: textIds.textParsed,
    migrationIds,
    localMigrationIds: textIds.localMigrationIds,
    remoteMigrationIds: textIds.remoteMigrationIds,
    pendingLocalMigrationIds: textIds.pendingLocalMigrationIds,
    remoteOnlyMigrationIds: textIds.remoteOnlyMigrationIds,
    targetRegistryMigrationPresent: migrationIds.includes(targetRegistryMigrationId),
    workerRpcMigrationPresent: migrationIds.includes(workerRpcMigrationId),
    internalBetaGapMigrationPresent: migrationIds.includes(internalBetaGapMigrationId),
  }
}

function dryRun(dbUrl) {
  const result = run('supabase', [
    '--yes',
    'db',
    'push',
    '--dry-run',
    '--db-url',
    dbUrl,
  ], { timeoutMs: 300000 })
  return {
    status: result.status,
    commandClass: 'supabase db push --dry-run --db-url [redacted]',
    commandResult: commandSummary(result, 'supabase db push --dry-run --db-url [redacted]'),
  }
}

function applyMigrations(dbUrl) {
  const result = run('supabase', [
    '--yes',
    'db',
    'push',
    '--db-url',
    dbUrl,
  ], { timeoutMs: 900000 })
  return {
    status: result.status,
    commandClass: 'supabase db push --db-url [redacted]',
    sqlExecuted: result.status === 'passed',
    migrationDeployed: result.status === 'passed',
    seedIncluded: false,
    includeAllUsed: false,
    commandResult: commandSummary(result, 'supabase db push --db-url [redacted]'),
  }
}

function quoteList(values) {
  return values.map((value) => `('${value.replaceAll("'", "''")}')`).join(',')
}

function sqlTextArray(values) {
  return `array[${values.map((value) => `'${value.replaceAll("'", "''")}'`).join(',')}]::text[]`
}

function readOnlyCatalog(dbUrl) {
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
    coalesce(b.public, false) as is_public
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
  'publicPrivateBuckets', coalesce((select jsonb_agg(bucket_id order by bucket_id) from storage_status where is_public), '[]'::jsonb)
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
    directDdlDmlRun: false,
    storageObjectRead: false,
    storageBucketMetadataRead: result.status === 'passed',
    commandResult: commandSummary(result, 'psql readonly catalog query [db-url redacted]'),
    catalogJsonParsed: parsed !== null,
    catalogReadback: parsed,
  }
}

function missingRequired(history) {
  return [targetRegistryMigrationId, workerRpcMigrationId, internalBetaGapMigrationId]
    .filter((id) => !history.migrationIds.includes(id))
}

if (process.env[confirmationVar] !== 'true') {
  finish({
    decision: 'blocked_pending_isolated_target_migration_chain_apply_confirmation',
    execution: 'blocked_confirmation_absent_no_secret_payload_access',
    blocker: 'blocked_pending_isolated_target_migration_chain_apply_confirmation',
    confirmation: 'absent_or_not_true',
    safety: buildSafety(),
  }, 1)
}

const targetSecretMetadata = latestSecretVersion(targetSecret)
let dbUrl
try {
  dbUrl = accessSecretPayload(targetSecret)
} catch (error) {
  finish({
    decision: 'blocked_missing_isolated_target_db_url_secret_payload',
    execution: 'blocked_before_migration_chain_apply',
    blocker: 'blocked_missing_isolated_target_db_url_secret_payload',
    confirmation: 'present_true',
    credentialMetadata: {
      targetDbUrlSecret: targetSecret,
      targetDbUrlLatestVersion: targetSecretMetadata,
    },
    sanitizedError: sanitize(error.stderr?.toString() || error.message),
    safety: buildSafety({ secretManagerPayloadAccess: false }),
  }, 1)
}

if (!/^postgres(?:ql)?:\/\//i.test(dbUrl)) {
  finish({
    decision: 'blocked_isolated_target_db_url_secret_payload_invalid',
    execution: 'blocked_before_migration_chain_apply',
    blocker: 'blocked_isolated_target_db_url_secret_payload_invalid',
    confirmation: 'present_true',
    credentialMetadata: {
      targetDbUrlSecret: targetSecret,
      targetDbUrlLatestVersion: targetSecretMetadata,
    },
    safety: buildSafety({ secretManagerPayloadAccess: true }),
  }, 1)
}

const beforeHistory = migrationList(dbUrl)
const beforeMissing = missingRequired(beforeHistory)
if ((beforeHistory.remoteOnlyMigrationIds ?? []).length > 0) {
  finish({
    decision: 'blocked_isolated_target_remote_migration_history_has_untracked_versions',
    execution: 'blocked_before_migration_dry_run_no_sql_mutation',
    blocker: 'blocked_isolated_target_remote_migration_history_has_untracked_versions',
    confirmation: 'present_true',
    credentialMetadata: {
      targetDbUrlSecret: targetSecret,
      targetDbUrlLatestVersion: targetSecretMetadata,
      dbUrlPayloadPrinted: false,
      dbUrlPayloadPersistedInRepo: false,
    },
    beforeMigrationHistory: beforeHistory,
    beforeMissingRequiredMigrationIds: beforeMissing,
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      remoteSupabaseReadCommand: true,
    }),
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
  }, 1)
}

const dryRunResult = dryRun(dbUrl)
if (dryRunResult.status !== 'passed') {
  finish({
    decision: 'blocked_isolated_target_migration_chain_dry_run_failed',
    execution: 'blocked_before_migration_apply_no_sql_mutation',
    blocker: 'blocked_isolated_target_migration_chain_dry_run_failed',
    confirmation: 'present_true',
    credentialMetadata: {
      targetDbUrlSecret: targetSecret,
      targetDbUrlLatestVersion: targetSecretMetadata,
      dbUrlPayloadPrinted: false,
      dbUrlPayloadPersistedInRepo: false,
    },
    beforeMigrationHistory: beforeHistory,
    beforeMissingRequiredMigrationIds: beforeMissing,
    dryRun: dryRunResult,
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      remoteSupabaseReadCommand: true,
      migrationDryRun: true,
    }),
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
  }, 1)
}

const apply = applyMigrations(dbUrl)
if (apply.status !== 'passed') {
  const afterFailedHistory = migrationList(dbUrl)
  finish({
    decision: 'blocked_isolated_target_migration_chain_apply_failed',
    execution: 'blocked_migration_apply_failed_readback_recorded',
    blocker: 'blocked_isolated_target_migration_chain_apply_failed',
    confirmation: 'present_true',
    credentialMetadata: {
      targetDbUrlSecret: targetSecret,
      targetDbUrlLatestVersion: targetSecretMetadata,
      dbUrlPayloadPrinted: false,
      dbUrlPayloadPersistedInRepo: false,
    },
    beforeMigrationHistory: beforeHistory,
    beforeMissingRequiredMigrationIds: beforeMissing,
    dryRun: dryRunResult,
    apply,
    afterMigrationHistory: afterFailedHistory,
    afterMissingRequiredMigrationIds: missingRequired(afterFailedHistory),
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      remoteSupabaseReadCommand: true,
      remoteSupabaseMutation: true,
      sqlExecution: true,
      sqlMutation: true,
      migrationDryRun: true,
      migrationApply: true,
      migrationHistoryUpdatedBySupabaseCliApply: true,
      rlsPolicyApplyByMigration: true,
      storageBucketMetadataUpsertByMigration: true,
    }),
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
  }, 1)
}

const afterHistory = migrationList(dbUrl)
const afterMissing = missingRequired(afterHistory)
const catalog = afterMissing.length === 0 ? readOnlyCatalog(dbUrl) : null
const missingTables = catalog?.catalogReadback?.missingTables ?? []
const rlsMissingTables = catalog?.catalogReadback?.rlsMissingTables ?? []
const missingPrivateBuckets = catalog?.catalogReadback?.missingPrivateBuckets ?? []
const publicPrivateBuckets = catalog?.catalogReadback?.publicPrivateBuckets ?? []

let decision = 'completed_isolated_target_migration_chain_apply_and_readback'
let blocker = 'none'
if (afterHistory.status !== 'passed' || afterMissing.length > 0) {
  decision = 'blocked_isolated_target_post_apply_migration_history_not_current'
  blocker = 'blocked_isolated_target_post_apply_migration_history_not_current'
} else if (!catalog || catalog.status !== 'passed') {
  decision = 'blocked_isolated_target_post_apply_catalog_readback_failed'
  blocker = 'blocked_isolated_target_post_apply_catalog_readback_failed'
} else if (missingTables.length > 0 || rlsMissingTables.length > 0) {
  decision = 'blocked_isolated_target_post_apply_schema_rls_readback_failed'
  blocker = 'blocked_isolated_target_post_apply_schema_rls_readback_failed'
} else if (missingPrivateBuckets.length > 0 || publicPrivateBuckets.length > 0) {
  decision = 'blocked_isolated_target_post_apply_private_storage_bucket_metadata_readback_failed'
  blocker = 'blocked_isolated_target_post_apply_private_storage_bucket_metadata_readback_failed'
}

finish({
  decision,
  execution: decision === 'completed_isolated_target_migration_chain_apply_and_readback'
    ? 'completed_guarded_isolated_target_migration_chain_apply_readback_no_beta_unlock'
    : 'blocked_post_apply_readback_no_beta_unlock',
  blocker,
  confirmation: 'present_true',
  credentialMetadata: {
    targetDbUrlSecret: targetSecret,
    targetDbUrlLatestVersion: targetSecretMetadata,
    dbUrlPayloadPrinted: false,
    dbUrlPayloadPersistedInRepo: false,
  },
  beforeMigrationHistory: beforeHistory,
  beforeMissingRequiredMigrationIds: beforeMissing,
  dryRun: dryRunResult,
  apply,
  afterMigrationHistory: afterHistory,
  afterMissingRequiredMigrationIds: afterMissing,
  schemaRlsStorageReadback: catalog,
  validationSummary: {
    targetRegistryMigrationPresent: afterHistory.targetRegistryMigrationPresent === true,
    workerRpcMigrationPresent: afterHistory.workerRpcMigrationPresent === true,
    internalBetaGapMigrationPresent: afterHistory.internalBetaGapMigrationPresent === true,
    missingTables,
    rlsMissingTables,
    missingPrivateBuckets,
    publicPrivateBuckets,
  },
  readiness: {
    workerRuntimeTransactionalContract2: decision === 'completed_isolated_target_migration_chain_apply_and_readback'
      ? 'ready_for_isolated_target_worker_rpc_readback'
      : 'blocked_pending_isolated_target_post_apply_readback_closure',
    workerRuntimeTrackaPrivateE2eExecutionGate2r: decision === 'completed_isolated_target_migration_chain_apply_and_readback'
      ? 'blocked_pending_worker_rpc_readback_and_service_role_runtime_validation'
      : 'blocked_pending_isolated_target_post_apply_readback_closure',
    internalBetaReadinessRollup: decision === 'completed_isolated_target_migration_chain_apply_and_readback'
      ? 'blocked_pending_worker_rpc_readback_service_role_runtime_private_storage_and_runtime_gates'
      : 'blocked_pending_isolated_target_post_apply_readback_closure',
    externalProductBeta: 'blocked_pending_internal_beta_evidence_security_privacy_support_cost_and_deployment_gates',
  },
  safety: buildSafety({
    secretManagerPayloadAccess: true,
    credentialPayloadPrinted: false,
    credentialPayloadPersistedInRepo: false,
    remoteSupabaseReadCommand: true,
    remoteSupabaseMutation: true,
    sqlExecution: true,
    sqlMutation: true,
    readOnlyCatalogSql: Boolean(catalog),
    migrationDryRun: true,
    migrationApply: true,
    migrationHistoryTableManualEdit: false,
    migrationHistoryUpdatedBySupabaseCliApply: apply.status === 'passed',
    rlsPolicyApplyByMigration: apply.status === 'passed',
    storageBucketMetadataUpsertByMigration: apply.status === 'passed',
    storageObjectCreation: false,
    storageObjectRead: false,
    storageBucketMetadataRead: Boolean(catalog),
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
  }),
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}, decision === 'completed_isolated_target_migration_chain_apply_and_readback' ? 0 : 1)
