#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1'
const confirmationVar = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_MAIN_SUPABASE_SERVICE_ROLE_RUNTIME_VALIDATION'
const dbUrlEnv = 'REEDITPRO_STAGING_SUPABASE_DB_URL'
const targetProjectName = 'Reeditpro'
const targetProjectRef = 'wmyyttnynmteqgcdishd'
const targetClass = 'staging'
const hardeningMigration = '20260626233000_external_beta_public_grant_hardening'
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-main-supabase-service-role-runtime-validation-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)

fs.mkdirSync(outputDir, { recursive: true })

const protectedTables = [
  'api_idempotency_keys',
  'approval_records',
  'approved_plan_snapshots',
  'artifact_manifest_items',
  'artifact_manifests',
  'audit_events',
  'credit_ledger_entries',
  'credit_reservation_line_items',
  'credit_reservations',
  'editing_jobs',
  'final_exports',
  'generated_asset_versions',
  'generated_assets',
  'generation_events',
  'generation_requests',
  'job_claim_attempts',
  'job_events',
  'jobs',
  'qa_reports',
  'signed_url_events',
  'storage_object_records',
  'upload_intents',
  'worker_events',
  'worker_jobs',
]

function sanitize(value) {
  return String(value ?? '')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/\bpostgres(?:ql)?:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(/https:\/\/[a-z0-9-]+\.supabase\.co/gi, 'https://[redacted].supabase.co')
    .replace(/db\.[a-z0-9-]+\.supabase\.co/gi, 'db.[redacted].supabase.co')
    .replace(/password=[^\s]+/gi, 'password=[redacted]')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function run(command, args, options = {}) {
  try {
    const stdout = execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: options.timeout ?? 120000,
      env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1', ...options.env },
    })
    return { ok: true, exitCode: 0, stdout, stderr: '' }
  } catch (error) {
    return {
      ok: false,
      exitCode: typeof error.status === 'number' ? error.status : 1,
      stdout: error.stdout?.toString() ?? '',
      stderr: error.stderr?.toString() ?? error.message,
    }
  }
}

function writeArtifact(name, text) {
  const file = path.join(outputDir, name)
  fs.writeFileSync(file, text)
  return {
    fileName: name,
    path: file,
    bytes: fs.statSync(file).size,
    sha256: sha256(file),
  }
}

function parseJson(text, fallback) {
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

function psql(dbUrl, sql, name) {
  const result = run('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-X', '-A', '-t', '-c', sql])
  const artifact = writeArtifact(
    name,
    [
      `$ psql postgresql://[redacted] -v ON_ERROR_STOP=1 -X -A -t -c [sql]`,
      `exitCode=${result.exitCode}`,
      sanitize(result.stdout),
      sanitize(result.stderr),
      '',
    ].join('\n'),
  )
  return { ...result, artifact }
}

function supabase(dbUrl, args, name) {
  const result = run('supabase', [...args, '--db-url', dbUrl], { timeout: 180000 })
  const artifact = writeArtifact(
    name,
    [
      `$ supabase ${args.join(' ')} --db-url postgresql://[redacted]`,
      `exitCode=${result.exitCode}`,
      sanitize(result.stdout),
      sanitize(result.stderr),
      '',
    ].join('\n'),
  )
  return { ...result, artifact }
}

function buildSafety(overrides = {}) {
  return {
    databaseUrlPayloadSource: 'ephemeral_process_env_only',
    databaseUrlPrinted: false,
    databaseUrlPersistedInRepo: false,
    serviceRoleSecretPayloadAccess: false,
    frontendServiceRoleCredentialExposure: false,
    remoteSupabaseMutation: 'guarded_main_staging_public_grant_hardening_migration_apply_only',
    sqlExecution: 'guarded_readonly_catalog_validation_after_migration_apply',
    sqlMutation: 'guarded_main_staging_public_grant_hardening_migration_apply_only',
    migrationApply: '20260626233000_external_beta_public_grant_hardening',
    serviceRoleRouteExecution: false,
    routeExecution: false,
    workerExecution: false,
    workerDispatch: false,
    workerLeaseClaim: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    creditReservationCreation: false,
    jobEnqueue: false,
    jobEventWrite: false,
    providerCall: false,
    modelCall: false,
    renderExport: false,
    mediaProcessing: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
    ...overrides,
  }
}

function finish(report, exitCode, artifacts = []) {
  const reportPath = path.join(outputDir, 'validation-report.json')
  const finalReport = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    target: {
      projectName: targetProjectName,
      projectRef: targetProjectRef,
      class: targetClass,
    },
    ...report,
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(finalReport, null, 2)}\n`)
  const reportArtifact = {
    fileName: path.basename(reportPath),
    path: reportPath,
    bytes: fs.statSync(reportPath).size,
    sha256: sha256(reportPath),
  }
  const manifestPath = path.join(outputDir, 'artifact-manifest.json')
  const manifest = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [...artifacts, reportArtifact],
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  console.log(`${packet} result: ${finalReport.decision}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Output directory: ${outputDir}`)
  console.log(`Report: ${reportPath}`)
  console.log(`Manifest: ${manifestPath}`)
  process.exit(exitCode)
}

if (process.env[confirmationVar] !== 'true') {
  finish(
    {
      decision: 'blocked_pending_external_beta_main_supabase_service_role_runtime_validation_confirmation',
      execution: 'blocked_no_remote_validation_confirmation_absent',
      blocker: 'blocked_pending_external_beta_main_supabase_service_role_runtime_validation_confirmation',
      confirmationVar,
      confirmationObserved: 'absent_or_not_true',
      safety: buildSafety({
        remoteSupabaseMutation: false,
        sqlExecution: false,
        sqlMutation: false,
        migrationApply: false,
      }),
      productReadyEndToEndLocalOssTools: 0,
    },
    1,
  )
}

const dbUrl = process.env[dbUrlEnv]
if (!dbUrl) {
  finish(
    {
      decision: 'blocked_missing_reeditpro_staging_supabase_db_url_env',
      execution: 'blocked_no_remote_validation_missing_db_url_env',
      blocker: 'blocked_missing_reeditpro_staging_supabase_db_url_env',
      confirmationVar,
      confirmationObserved: 'present_true',
      selectedDatabaseUrlEnvName: dbUrlEnv,
      safety: buildSafety({
        remoteSupabaseMutation: false,
        sqlExecution: false,
        sqlMutation: false,
        migrationApply: false,
      }),
      productReadyEndToEndLocalOssTools: 0,
    },
    1,
  )
}

const artifacts = []

const dryRun = supabase(dbUrl, ['db', 'push', '--dry-run'], 'db-push-dry-run-final.txt')
artifacts.push(dryRun.artifact)

const publicWorkerLint = supabase(
  dbUrl,
  ['db', 'lint', '--schema', 'public,worker_runtime', '--level', 'warning', '--fail-on', 'warning'],
  'db-lint-public-worker-runtime.txt',
)
artifacts.push(publicWorkerLint.artifact)

const storageLint = supabase(
  dbUrl,
  ['db', 'lint', '--schema', 'storage', '--level', 'warning', '--fail-on', 'none'],
  'db-lint-storage-observed.txt',
)
artifacts.push(storageLint.artifact)

const protectedValues = protectedTables.map((table) => `('public','${table}')`).join(',')
const grantSql = `
with protected_tables(table_schema, table_name) as (
  values ${protectedValues}
),
unsafe_table_grants as (
  select grantee, table_schema, table_name, privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public'
    and grantee in ('anon','authenticated')
    and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
),
unsafe_sequence_grants as (
  select grantee, object_schema, object_name, privilege_type
  from information_schema.role_usage_grants
  where object_schema = 'public'
    and grantee in ('anon','authenticated')
),
protected_status as (
  select
    p.table_name,
    to_regclass(format('%I.%I', p.table_schema, p.table_name)) is not null as exists,
    has_table_privilege('service_role', format('%I.%I', p.table_schema, p.table_name), 'SELECT') as service_role_select,
    has_table_privilege('service_role', format('%I.%I', p.table_schema, p.table_name), 'INSERT') as service_role_insert,
    has_table_privilege('service_role', format('%I.%I', p.table_schema, p.table_name), 'UPDATE') as service_role_update,
    has_table_privilege('authenticated', format('%I.%I', p.table_schema, p.table_name), 'INSERT') as authenticated_insert,
    has_table_privilege('authenticated', format('%I.%I', p.table_schema, p.table_name), 'UPDATE') as authenticated_update,
    has_table_privilege('authenticated', format('%I.%I', p.table_schema, p.table_name), 'DELETE') as authenticated_delete,
    has_table_privilege('anon', format('%I.%I', p.table_schema, p.table_name), 'INSERT') as anon_insert,
    has_table_privilege('anon', format('%I.%I', p.table_schema, p.table_name), 'UPDATE') as anon_update,
    has_table_privilege('anon', format('%I.%I', p.table_schema, p.table_name), 'DELETE') as anon_delete
  from protected_tables p
)
select json_build_object(
  'unsafePublicMutationGrantCount', (select count(*) from unsafe_table_grants),
  'unsafePublicSequenceGrantCount', (select count(*) from unsafe_sequence_grants),
  'hardeningMigrationPresent', exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '20260626233000'
  ),
  'protectedTableStatus', coalesce((select json_agg(protected_status order by table_name) from protected_status), '[]'::json)
)::text;
`

const grantValidation = psql(dbUrl, grantSql, 'grant-validation.json.txt')
artifacts.push(grantValidation.artifact)
const grantSummary = parseJson(grantValidation.stdout.trim(), null)

const blockers = []
if (!dryRun.ok || !dryRun.stdout.includes('Remote database is up to date.')) {
  blockers.push('blocked_main_supabase_migration_history_not_up_to_date')
}
if (!publicWorkerLint.ok) blockers.push('blocked_public_worker_runtime_schema_lint_failed')
if (!storageLint.ok) blockers.push('blocked_storage_schema_lint_readback_failed')
if (!grantValidation.ok || !grantSummary) blockers.push('blocked_grant_validation_query_failed')
if (grantSummary?.unsafePublicMutationGrantCount !== 0) {
  blockers.push('blocked_unsafe_public_anon_authenticated_mutation_grants_remain')
}
if (grantSummary?.unsafePublicSequenceGrantCount !== 0) {
  blockers.push('blocked_unsafe_public_anon_authenticated_sequence_grants_remain')
}
if (grantSummary?.hardeningMigrationPresent !== true) {
  blockers.push('blocked_public_grant_hardening_migration_not_present')
}
for (const row of grantSummary?.protectedTableStatus ?? []) {
  if (row.exists !== true) blockers.push(`blocked_missing_protected_table_${row.table_name}`)
  if (row.service_role_select !== true || row.service_role_insert !== true || row.service_role_update !== true) {
    blockers.push(`blocked_service_role_privileges_missing_${row.table_name}`)
  }
  if (
    row.authenticated_insert === true ||
    row.authenticated_update === true ||
    row.authenticated_delete === true ||
    row.anon_insert === true ||
    row.anon_update === true ||
    row.anon_delete === true
  ) {
    blockers.push(`blocked_public_mutation_privilege_remaining_${row.table_name}`)
  }
}

if (blockers.length > 0) {
  finish(
    {
      decision: blockers[0],
      execution: 'blocked_guarded_main_staging_service_role_runtime_validation',
      blocker: blockers[0],
      allBlockers: [...new Set(blockers)],
      confirmationVar,
      confirmationObserved: 'present_true',
      selectedDatabaseUrlEnvName: dbUrlEnv,
      dryRun: dryRun.ok ? 'passed' : 'failed',
      publicWorkerRuntimeLint: publicWorkerLint.ok ? 'passed' : 'failed',
      storageLintReadback: storageLint.ok ? 'completed_with_managed_storage_warnings_allowed' : 'failed',
      grantSummary,
      safety: buildSafety(),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
    artifacts,
  )
}

finish(
  {
    decision: 'completed_main_supabase_service_role_runtime_grant_boundary_validation',
    execution: 'completed_guarded_main_staging_grant_hardening_and_readonly_runtime_boundary_validation',
    blocker: 'none',
    confirmationVar,
    confirmationObserved: 'present_true',
    selectedDatabaseUrlEnvName: dbUrlEnv,
    hardeningMigration: `${hardeningMigration}.sql`,
    dryRun: 'passed_remote_database_is_up_to_date',
    publicWorkerRuntimeLint: 'passed_no_warnings',
    storageLintReadback: 'completed_with_managed_storage_warnings_allowed',
    grantSummary,
    readiness: {
      mainSupabaseServiceRoleGrantBoundary:
        'ready_for_approved_snapshot_persistence_guarded_remote_write_validation',
      serviceRoleRouteExecution: 'not_run_pending_route_specific_guarded_write_validation',
      approvedSnapshotPersistence: 'ready_for_guarded_remote_write_validation',
      externalProductBeta: 'blocked_pending_remaining_runtime_gates',
    },
    safety: buildSafety(),
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: 'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1',
  },
  0,
  artifacts,
)
