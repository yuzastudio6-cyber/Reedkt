import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const databaseName = `reeditpro_worker_artifact_manifest_sql_smoke_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 8)}`

let databaseCreated = false

try {
  runCommand('createdb', [databaseName])
  databaseCreated = true

  runSql(databaseName, buildPrerequisiteSql())
  const migrationSql = readFileSync(
    'supabase/migrations/20260703222834_production_worker_artifact_manifest_persistence.sql',
    'utf8',
  )
  assert.ok(
    migrationSql.includes('create table if not exists public.production_worker_runtime_jobs'),
    'migration must define production_worker_runtime_jobs',
  )
  assert.ok(
    migrationSql.includes('create table if not exists public.production_worker_runtime_artifacts'),
    'migration must define production_worker_runtime_artifacts',
  )
  assert.ok(migrationSql.includes('Signed-By') === false, 'artifact manifest migration must not create apt sources')
  runSql(databaseName, migrationSql)
  runSql(databaseName, buildFixtureSql())

  const jobCount = queryScalar(databaseName, 'select count(*)::text as value from public.production_worker_runtime_jobs;')
  const artifactCount = queryScalar(databaseName, 'select count(*)::text as value from public.production_worker_runtime_artifacts;')
  assert.equal(jobCount, '1', 'worker runtime job should be inserted')
  assert.equal(artifactCount, '1', 'worker runtime artifact should be inserted')

  const persistedPath = queryScalar(databaseName, `
    select storage_object_path as value
    from public.production_worker_runtime_artifacts
    where worker_idempotency_key = 'prod-worker:artifact-sql-smoke';
  `)
  assert.equal(
    persistedPath,
    'workspaces/workspace-artifact-sql/projects/project-artifact-sql/qa/report.json',
    'persisted artifact should keep a private storage object path',
  )

  assertSqlFails(databaseName, `
    insert into public.production_worker_runtime_artifacts (
      id,
      workspace_id,
      project_id,
      job_id,
      worker_idempotency_key,
      artifact_type,
      storage_bucket_purpose,
      storage_object_path,
      is_private,
      source_of_truth,
      artifact_record
    )
    values (
      'artifact-signed-url',
      'workspace-artifact-sql',
      'project-artifact-sql',
      'job-artifact-sql',
      'prod-worker:artifact-sql-smoke',
      'qa_report',
      'qa_artifacts',
      'https://storage.example.test/signed/report.json?X-Goog-Signature=abc',
      true,
      true,
      '{}'::jsonb
    );
  `, /production_worker_runtime_artifacts_no_url_path|violates check constraint/i)

  assertSqlFails(databaseName, `
    insert into public.production_worker_runtime_artifacts (
      id,
      workspace_id,
      project_id,
      job_id,
      worker_idempotency_key,
      artifact_type,
      storage_bucket_purpose,
      storage_object_path,
      is_private,
      source_of_truth,
      artifact_record
    )
    values (
      'artifact-public',
      'workspace-artifact-sql',
      'project-artifact-sql',
      'job-artifact-sql',
      'prod-worker:artifact-sql-smoke',
      'qa_report',
      'qa_artifacts',
      'workspaces/workspace-artifact-sql/projects/project-artifact-sql/qa/public-report.json',
      false,
      true,
      '{}'::jsonb
    );
  `, /production_worker_runtime_artifacts_private|violates check constraint/i)

  assertTablePrivilege('anon', 'public.production_worker_runtime_jobs', 'select', false)
  assertTablePrivilege('authenticated', 'public.production_worker_runtime_jobs', 'select', false)
  assertTablePrivilege('service_role', 'public.production_worker_runtime_jobs', 'select', true)
  assertTablePrivilege('service_role', 'public.production_worker_runtime_jobs', 'insert', true)
  assertTablePrivilege('anon', 'public.production_worker_runtime_artifacts', 'select', false)
  assertTablePrivilege('authenticated', 'public.production_worker_runtime_artifacts', 'select', false)
  assertTablePrivilege('service_role', 'public.production_worker_runtime_artifacts', 'select', true)
  assertTablePrivilege('service_role', 'public.production_worker_runtime_artifacts', 'insert', true)

  const rlsJobs = queryScalar(databaseName, `
    select relrowsecurity::text as value
    from pg_class
    where oid = 'public.production_worker_runtime_jobs'::regclass;
  `)
  const rlsArtifacts = queryScalar(databaseName, `
    select relrowsecurity::text as value
    from pg_class
    where oid = 'public.production_worker_runtime_artifacts'::regclass;
  `)
  assert.equal(rlsJobs, 'true', 'worker runtime jobs must have RLS enabled')
  assert.equal(rlsArtifacts, 'true', 'worker runtime artifacts must have RLS enabled')

  console.log(JSON.stringify({
    ok: true,
    databaseName,
    jobCount: Number(jobCount),
    artifactCount: Number(artifactCount),
    serviceRoleOnly: true,
    rlsEnabled: true,
    signedUrlBlocked: true,
    publicArtifactBlocked: true,
    remoteSupabaseTouched: false,
  }, null, 2))
} finally {
  if (databaseCreated) {
    runCommand('dropdb', ['--if-exists', databaseName], { allowFailure: true })
  }
}

function buildPrerequisiteSql(): string {
  return `
    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon;
      end if;

      if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated;
      end if;

      if not exists (select 1 from pg_roles where rolname = 'service_role') then
        create role service_role;
      end if;
    end
    $$;
  `
}

function buildFixtureSql(): string {
  return `
    insert into public.production_worker_runtime_jobs (
      id,
      workspace_id,
      project_id,
      job_id,
      tool_execution_plan_id,
      approved_plan_snapshot_id,
      credit_estimate_id,
      credit_reservation_id,
      production_readiness_evidence_packet_id,
      worker_type,
      execution_mode,
      requested_tool_ids,
      requested_recipe_ids,
      api_idempotency_key,
      worker_idempotency_key,
      attempt,
      max_attempts,
      status,
      lease_json,
      output_artifact_ids,
      retry_decision_json
    )
    values (
      'worker-runtime-job:workspace-artifact-sql:project-artifact-sql:job-artifact-sql',
      'workspace-artifact-sql',
      'project-artifact-sql',
      'job-artifact-sql',
      'tool-plan-artifact-sql',
      'approved-snapshot-artifact-sql',
      'credit-estimate-artifact-sql',
      'credit-reservation-artifact-sql',
      'production-evidence-artifact-sql',
      'tool_readiness_worker',
      'production_ready',
      '["gpac_mp4box"]'::jsonb,
      '["tracka-native-validation"]'::jsonb,
      'api-idempotency-artifact-sql',
      'prod-worker:artifact-sql-smoke',
      1,
      1,
      'completed',
      '{"leaseStatus":"released"}'::jsonb,
      '["artifact-qa-report"]'::jsonb,
      '{"shouldRetry":false,"nextRetryDelayMs":0,"maxAttempts":1}'::jsonb
    );

    insert into public.production_worker_runtime_artifacts (
      id,
      workspace_id,
      project_id,
      job_id,
      worker_idempotency_key,
      artifact_type,
      storage_bucket_purpose,
      storage_object_path,
      is_private,
      source_of_truth,
      artifact_record
    )
    values (
      'artifact-qa-report',
      'workspace-artifact-sql',
      'project-artifact-sql',
      'job-artifact-sql',
      'prod-worker:artifact-sql-smoke',
      'qa_report',
      'qa_artifacts',
      'workspaces/workspace-artifact-sql/projects/project-artifact-sql/qa/report.json',
      true,
      true,
      '{
        "id":"artifact-qa-report",
        "workspaceId":"workspace-artifact-sql",
        "projectId":"project-artifact-sql",
        "mediaAssetId":"media-artifact-sql",
        "toolRunId":"job-artifact-sql:gpac_mp4box",
        "artifactType":"qa_report",
        "storageBucketPurpose":"qa_artifacts",
        "storageObjectPath":"workspaces/workspace-artifact-sql/projects/project-artifact-sql/qa/report.json",
        "contentType":"application/json",
        "createdAt":"2026-07-03T00:00:00.000Z",
        "isPrivate":true,
        "metadata":{"sqlSmoke":true},
        "previewAllowed":false,
        "sourceOfTruth":true
      }'::jsonb
    );
  `
}

function runSql(database: string, sql: string): void {
  runCommand('psql', ['-v', 'ON_ERROR_STOP=1', '--quiet', database], { input: sql })
}

function assertSqlFails(database: string, sql: string, pattern: RegExp): void {
  const result = runCommand('psql', ['-v', 'ON_ERROR_STOP=1', '--quiet', database], {
    input: sql,
    allowFailure: true,
  })
  assert.notEqual(result.status, 0, 'SQL command should fail')
  assert.match(`${result.stdout}\n${result.stderr}`, pattern)
}

function assertTablePrivilege(role: string, table: string, privilege: string, expected: boolean): void {
  const allowed = queryScalar(databaseName, `
    select has_table_privilege('${role}', '${table}', '${privilege}')::text as value;
  `)
  assert.equal(allowed, expected ? 'true' : 'false', `${role} ${privilege} privilege on ${table}`)
}

function queryScalar(database: string, sql: string): string {
  return runCommand('psql', [
    '-v',
    'ON_ERROR_STOP=1',
    '--tuples-only',
    '--no-align',
    database,
    '-c',
    sql,
  ]).stdout.trim()
}

function runCommand(
  command: string,
  args: string[],
  options: { input?: string; allowFailure?: boolean } = {},
): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(command, args, {
    input: options.input,
    encoding: 'utf8',
  })
  if (!options.allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`)
  }
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
  }
}
