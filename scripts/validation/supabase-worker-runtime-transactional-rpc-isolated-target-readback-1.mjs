#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1'
const confirmationVar = 'REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_TRANSACTIONAL_RPC_ISOLATED_TARGET_READBACK'
const gcpProject = 'reeditpro'
const targetSecret = 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL'
const targetProjectName = 'reeditpro-clean-staging-isolated-v1'
const targetProjectRef = 'fajinbvwhcjnutkaumkm'
const reportDir = 'docs/activation-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-reports'
const reportPath = path.join(reportDir, 'worker_runtime_transactional_rpc_isolated_target_readback_report.json')
const manifestPath = path.join(reportDir, 'worker_runtime_transactional_rpc_isolated_target_readback_manifest.json')
const baseOutputDir = '/tmp/reeditpro-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)

const expectedFunctions = [
  'append_tracka_private_e2e_event',
  'claim_tracka_private_e2e_job',
  'heartbeat_tracka_private_e2e_job',
  'complete_tracka_private_e2e_job',
  'fail_tracka_private_e2e_job',
  'cancel_tracka_private_e2e_job',
  'release_expired_tracka_private_e2e_leases',
]

const expectedTables = [
  'worker_jobs',
  'worker_job_events',
  'worker_job_artifacts',
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

function commandSummary(result, commandClass) {
  return {
    commandClass,
    status: result.status,
    exitCode: result.exitCode,
    stdout: summarizeText(result.stdout),
    stderr: summarizeText(result.stderr),
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
    rpcExecution: false,
    serviceRoleRouteExecution: false,
    workerExecution: false,
    workerDispatch: false,
    workerLeaseClaim: false,
    storageObjectCreation: false,
    storageObjectRead: false,
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

function sqlTextArray(values) {
  return `array[${values.map((value) => `'${value.replaceAll("'", "''")}'`).join(',')}]::text[]`
}

function readback(dbUrl) {
  const sql = `
with expected_functions(proname) as (
  select unnest(${sqlTextArray(expectedFunctions)})
),
expected_tables(relname) as (
  select unnest(${sqlTextArray(expectedTables)})
),
function_status as (
  select
    e.proname,
    p.oid is not null as present,
    coalesce(p.prosecdef, false) as security_definer,
    pg_get_function_arguments(p.oid) as arguments,
    has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
    has_function_privilege('public', p.oid, 'EXECUTE') as public_execute
  from expected_functions e
  left join pg_namespace n on n.nspname = 'worker_runtime'
  left join pg_proc p on p.pronamespace = n.oid and p.proname = e.proname
),
table_status as (
  select
    e.relname,
    c.oid is not null as present,
    coalesce(c.relrowsecurity, false) as rls_enabled,
    has_table_privilege('service_role', c.oid, 'SELECT') as service_role_select,
    has_table_privilege('service_role', c.oid, 'INSERT') as service_role_insert,
    has_table_privilege('service_role', c.oid, 'UPDATE') as service_role_update,
    has_table_privilege('service_role', c.oid, 'DELETE') as service_role_delete,
    has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
    has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_select,
    has_table_privilege('public', c.oid, 'SELECT') as public_select
  from expected_tables e
  left join pg_namespace n on n.nspname = 'public'
  left join pg_class c on c.relnamespace = n.oid and c.relname = e.relname and c.relkind in ('r', 'p')
),
policy_counts as (
  select tablename, count(*)::int as policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename in (select relname from expected_tables)
  group by tablename
)
select jsonb_build_object(
  'schemaPresent', exists(select 1 from pg_namespace where nspname = 'worker_runtime'),
  'schemaServiceRoleUsage', has_schema_privilege('service_role', 'worker_runtime', 'USAGE'),
  'schemaAnonUsage', has_schema_privilege('anon', 'worker_runtime', 'USAGE'),
  'schemaAuthenticatedUsage', has_schema_privilege('authenticated', 'worker_runtime', 'USAGE'),
  'schemaPublicUsage', has_schema_privilege('public', 'worker_runtime', 'USAGE'),
  'expectedFunctions', to_jsonb(${sqlTextArray(expectedFunctions)}),
  'functionStatus', coalesce((select jsonb_agg(to_jsonb(function_status) order by proname) from function_status), '[]'::jsonb),
  'missingFunctions', coalesce((select jsonb_agg(proname order by proname) from function_status where not present), '[]'::jsonb),
  'nonSecurityDefinerFunctions', coalesce((select jsonb_agg(proname order by proname) from function_status where present and not security_definer), '[]'::jsonb),
  'functionsMissingServiceRoleExecute', coalesce((select jsonb_agg(proname order by proname) from function_status where present and not service_role_execute), '[]'::jsonb),
  'functionsExecutableByAnon', coalesce((select jsonb_agg(proname order by proname) from function_status where anon_execute), '[]'::jsonb),
  'functionsExecutableByAuthenticated', coalesce((select jsonb_agg(proname order by proname) from function_status where authenticated_execute), '[]'::jsonb),
  'functionsExecutableByPublic', coalesce((select jsonb_agg(proname order by proname) from function_status where public_execute), '[]'::jsonb),
  'expectedTables', to_jsonb(${sqlTextArray(expectedTables)}),
  'tableStatus', coalesce((select jsonb_agg(to_jsonb(table_status) order by relname) from table_status), '[]'::jsonb),
  'missingTables', coalesce((select jsonb_agg(relname order by relname) from table_status where not present), '[]'::jsonb),
  'tablesMissingRls', coalesce((select jsonb_agg(relname order by relname) from table_status where present and not rls_enabled), '[]'::jsonb),
  'tablesMissingServiceRoleDml', coalesce((select jsonb_agg(relname order by relname) from table_status where present and not (service_role_select and service_role_insert and service_role_update and service_role_delete)), '[]'::jsonb),
  'tablesSelectableByAnon', coalesce((select jsonb_agg(relname order by relname) from table_status where anon_select), '[]'::jsonb),
  'tablesSelectableByAuthenticated', coalesce((select jsonb_agg(relname order by relname) from table_status where authenticated_select), '[]'::jsonb),
  'tablesSelectableByPublic', coalesce((select jsonb_agg(relname order by relname) from table_status where public_select), '[]'::jsonb),
  'policyCount', coalesce((select sum(policy_count)::int from policy_counts), 0)
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
    commandClass: 'psql readonly worker_runtime catalog query [db-url redacted]',
    commandResult: commandSummary(result, 'psql readonly worker_runtime catalog query [db-url redacted]'),
    catalogJsonParsed: parsed !== null,
    readback: parsed,
  }
}

function listIsEmpty(value) {
  return Array.isArray(value) && value.length === 0
}

if (process.env[confirmationVar] !== 'true') {
  finish({
    decision: 'blocked_pending_worker_runtime_transactional_rpc_isolated_target_readback_confirmation',
    execution: 'blocked_confirmation_absent_no_secret_payload_access',
    blocker: 'blocked_pending_worker_runtime_transactional_rpc_isolated_target_readback_confirmation',
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
    execution: 'blocked_before_worker_rpc_readback',
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
    execution: 'blocked_before_worker_rpc_readback',
    blocker: 'blocked_isolated_target_db_url_secret_payload_invalid',
    confirmation: 'present_true',
    credentialMetadata: {
      targetDbUrlSecret: targetSecret,
      targetDbUrlLatestVersion: targetSecretMetadata,
    },
    safety: buildSafety({ secretManagerPayloadAccess: true }),
  }, 1)
}

const catalog = readback(dbUrl)
const rb = catalog.readback ?? {}

let decision = 'completed_worker_runtime_transactional_rpc_isolated_target_readback'
let blocker = 'none'
if (catalog.status !== 'passed') {
  decision = 'blocked_worker_runtime_rpc_catalog_readback_failed'
  blocker = 'blocked_worker_runtime_rpc_catalog_readback_failed'
} else if (rb.schemaPresent !== true || rb.schemaServiceRoleUsage !== true || rb.schemaAnonUsage !== false || rb.schemaAuthenticatedUsage !== false || rb.schemaPublicUsage !== false) {
  decision = 'blocked_worker_runtime_rpc_schema_grants_readback_failed'
  blocker = 'blocked_worker_runtime_rpc_schema_grants_readback_failed'
} else if (
  !listIsEmpty(rb.missingFunctions) ||
  !listIsEmpty(rb.nonSecurityDefinerFunctions) ||
  !listIsEmpty(rb.functionsMissingServiceRoleExecute) ||
  !listIsEmpty(rb.functionsExecutableByAnon) ||
  !listIsEmpty(rb.functionsExecutableByAuthenticated) ||
  !listIsEmpty(rb.functionsExecutableByPublic)
) {
  decision = 'blocked_worker_runtime_rpc_function_grants_readback_failed'
  blocker = 'blocked_worker_runtime_rpc_function_grants_readback_failed'
} else if (
  !listIsEmpty(rb.missingTables) ||
  !listIsEmpty(rb.tablesMissingRls) ||
  !listIsEmpty(rb.tablesMissingServiceRoleDml) ||
  !listIsEmpty(rb.tablesSelectableByAnon) ||
  !listIsEmpty(rb.tablesSelectableByAuthenticated) ||
  !listIsEmpty(rb.tablesSelectableByPublic)
) {
  decision = 'blocked_worker_runtime_rpc_table_rls_grants_readback_failed'
  blocker = 'blocked_worker_runtime_rpc_table_rls_grants_readback_failed'
}

finish({
  decision,
  execution: decision === 'completed_worker_runtime_transactional_rpc_isolated_target_readback'
    ? 'completed_guarded_readonly_worker_rpc_catalog_readback_no_runtime_execution'
    : 'blocked_readonly_worker_rpc_catalog_readback_no_runtime_execution',
  blocker,
  confirmation: 'present_true',
  credentialMetadata: {
    targetDbUrlSecret: targetSecret,
    targetDbUrlLatestVersion: targetSecretMetadata,
    dbUrlPayloadPrinted: false,
    dbUrlPayloadPersistedInRepo: false,
  },
  readback: catalog,
  validationSummary: {
    schemaPresent: rb.schemaPresent === true,
    schemaServiceRoleUsage: rb.schemaServiceRoleUsage === true,
    schemaAnonUsage: rb.schemaAnonUsage === false,
    schemaAuthenticatedUsage: rb.schemaAuthenticatedUsage === false,
    schemaPublicUsage: rb.schemaPublicUsage === false,
    missingFunctions: rb.missingFunctions ?? [],
    nonSecurityDefinerFunctions: rb.nonSecurityDefinerFunctions ?? [],
    functionsMissingServiceRoleExecute: rb.functionsMissingServiceRoleExecute ?? [],
    functionsExecutableByAnon: rb.functionsExecutableByAnon ?? [],
    functionsExecutableByAuthenticated: rb.functionsExecutableByAuthenticated ?? [],
    functionsExecutableByPublic: rb.functionsExecutableByPublic ?? [],
    missingTables: rb.missingTables ?? [],
    tablesMissingRls: rb.tablesMissingRls ?? [],
    tablesMissingServiceRoleDml: rb.tablesMissingServiceRoleDml ?? [],
    tablesSelectableByAnon: rb.tablesSelectableByAnon ?? [],
    tablesSelectableByAuthenticated: rb.tablesSelectableByAuthenticated ?? [],
    tablesSelectableByPublic: rb.tablesSelectableByPublic ?? [],
    policyCount: rb.policyCount ?? 0,
  },
  readiness: {
    workerRuntimeTransactionalContract2: decision === 'completed_worker_runtime_transactional_rpc_isolated_target_readback'
      ? 'ready_for_service_role_runtime_boundary_validation'
      : 'blocked_pending_worker_rpc_readback_closure',
    workerRuntimeTrackaPrivateE2eExecutionGate2r: decision === 'completed_worker_runtime_transactional_rpc_isolated_target_readback'
      ? 'blocked_pending_service_role_runtime_validation_and_job_fixture_gate'
      : 'blocked_pending_worker_rpc_readback_closure',
    internalBetaReadinessRollup: decision === 'completed_worker_runtime_transactional_rpc_isolated_target_readback'
      ? 'blocked_pending_service_role_runtime_private_storage_artifact_job_and_e2e_gates'
      : 'blocked_pending_worker_rpc_readback_closure',
    externalProductBeta: 'blocked_pending_internal_beta_evidence_security_privacy_support_cost_and_deployment_gates',
  },
  safety: buildSafety({
    secretManagerPayloadAccess: true,
    credentialPayloadPrinted: false,
    credentialPayloadPersistedInRepo: false,
    remoteSupabaseReadCommand: true,
    sqlExecution: true,
    sqlMutation: false,
    rpcExecution: false,
    remoteSupabaseMutation: false,
  }),
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}, decision === 'completed_worker_runtime_transactional_rpc_isolated_target_readback' ? 0 : 1)
