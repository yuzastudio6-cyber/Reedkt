#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1'
const confirmVar = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_APPROVED_SNAPSHOT_REMOTE_WRITE'
const dbUrlVar = 'REEDITPRO_STAGING_SUPABASE_DB_URL'
const targetRef = 'wmyyttnynmteqgcdishd'
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1'

const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex')
const outputDir = path.join(baseOutputDir, runId)

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function sha256File(filePath) {
  return sha256(fs.readFileSync(filePath))
}

function writeArtifact(fileName, value) {
  fs.mkdirSync(outputDir, { recursive: true })
  const filePath = path.join(outputDir, fileName)
  fs.writeFileSync(filePath, value)
  return {
    fileName,
    path: filePath,
    bytes: Buffer.byteLength(value),
    sha256: sha256(value),
  }
}

function fail(blocker, detail) {
  const report = {
    packet,
    decision: blocker,
    execution: 'blocked_before_or_during_guarded_remote_write_validation',
    target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
    runId,
    blocker,
    detail,
    safety: safety(false),
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
  }
  const artifact = writeArtifact('validation-report.json', JSON.stringify(report, null, 2))
  const manifest = {
    packet,
    runId,
    outputDir,
    artifacts: [artifact],
  }
  const manifestArtifact = writeArtifact('artifact-manifest.json', JSON.stringify(manifest, null, 2))
  console.error(`${packet} failed: ${blocker}`)
  if (detail) console.error(detail)
  console.error(`Report: ${artifact.path}`)
  console.error(`Manifest: ${manifestArtifact.path}`)
  process.exit(1)
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })
}

function psql(dbUrl, sql) {
  return run('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-A', '-t', '-c', sql])
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function safety(completed) {
  return {
    databaseUrlPayloadSource: 'ephemeral_process_env_only',
    databaseUrlPrinted: false,
    databaseUrlPersistedInRepo: false,
    serviceRoleSecretPayloadAccess: false,
    frontendServiceRoleCredentialExposure: false,
    remoteSupabaseMutation: completed
      ? 'guarded_transaction_rolled_back_generated_approved_snapshot_fixture_only'
      : false,
    sqlExecution: completed
      ? 'guarded_transaction_rolled_back_generated_approved_snapshot_fixture_sql'
      : false,
    sqlMutation: completed
      ? 'guarded_transaction_rolled_back_generated_approved_snapshot_fixture_only'
      : false,
    persistentRowsCreated: false,
    migrationApply: false,
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
  }
}

if (process.env[confirmVar] !== 'true') {
  fail('blocked_pending_external_beta_approved_snapshot_remote_write_confirmation', `${confirmVar} must be true.`)
}

const dbUrl = process.env[dbUrlVar]
if (!dbUrl) {
  fail('blocked_missing_reeditpro_staging_supabase_db_url', `${dbUrlVar} is required.`)
}

let actorUserId = ''
try {
  actorUserId = psql(dbUrl, "select id::text from auth.users order by created_at nulls last, id limit 1;").trim()
} catch (error) {
  fail('blocked_auth_user_readback_failed', error.stderr?.toString() || error.message)
}

if (!/^[0-9a-f-]{36}$/i.test(actorUserId)) {
  fail('blocked_no_existing_auth_user_for_generated_fixture_fk', 'No existing auth.users id was available for FK-safe validation.')
}

const ids = {
  workspaceId: crypto.randomUUID(),
  projectId: crypto.randomUUID(),
  editSessionId: crypto.randomUUID(),
  editPlanId: crypto.randomUUID(),
  editPlanVersionId: crypto.randomUUID(),
  creditEstimateId: crypto.randomUUID(),
  snapshotId: crypto.randomUUID(),
  approvalRecordId: crypto.randomUUID(),
  auditEventId: crypto.randomUUID(),
}
const idempotencyKey = `rp-extbeta-approved-snapshot-${runId}`
const requestHash = sha256(`${packet}:${runId}:${ids.snapshotId}`)
const planHash = sha256(`plan:${ids.editPlanVersionId}:${runId}`)
const creditHash = sha256(`credit:${ids.creditEstimateId}:${runId}`)
const sourceSequenceHash = sha256(`source:${ids.projectId}:${runId}`)
const timingHash = sha256(`timing:${ids.editSessionId}:${runId}`)
const slug = `rp-extbeta-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60)

const writeSql = `
begin;
set local role service_role;

with inserted_workspace as (
  insert into public.workspaces (id, owner_user_id, owner_id, name, slug, metadata)
  values (
    ${sqlString(ids.workspaceId)}::uuid,
    ${sqlString(actorUserId)}::uuid,
    ${sqlString(actorUserId)}::uuid,
    'RP external beta approved snapshot validation',
    ${sqlString(slug)},
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true)
  )
  returning id
), inserted_member as (
  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  select id, ${sqlString(actorUserId)}::uuid, 'owner', now() from inserted_workspace
  returning id
), inserted_project as (
  insert into public.projects (id, workspace_id, created_by, owner_id, title, description, status, metadata)
  select
    ${sqlString(ids.projectId)}::uuid,
    id,
    ${sqlString(actorUserId)}::uuid,
    ${sqlString(actorUserId)}::uuid,
    'RP external beta approved snapshot validation project',
    'Generated validation fixture; transaction rolled back.',
    'draft',
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true)
  from inserted_workspace
  returning id, workspace_id
), inserted_session as (
  insert into public.edit_sessions (id, project_id, workspace_id, owner_user_id, status, name, metadata_json, metadata, mock_only)
  select
    ${sqlString(ids.editSessionId)}::uuid,
    id,
    workspace_id,
    ${sqlString(actorUserId)}::uuid,
    'draft',
    'RP external beta approved snapshot validation session',
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}),
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}),
    false
  from inserted_project
  returning id, project_id, workspace_id
), inserted_plan as (
  insert into public.edit_plans (id, workspace_id, project_id, created_by_user_id, status, goal_summary, plan_payload, approval_required)
  select
    ${sqlString(ids.editPlanId)}::uuid,
    workspace_id,
    project_id,
    ${sqlString(actorUserId)}::uuid,
    'draft',
    'Generated approved snapshot persistence validation plan',
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'rawPromptExecution', false),
    true
  from inserted_session
  returning id, project_id, workspace_id
), inserted_plan_version as (
  insert into public.edit_plan_versions (
    id,
    project_id,
    edit_session_id,
    version,
    status,
    goal_summary,
    plan_summary_json,
    full_plan_json,
    approval_required,
    approved_at,
    approved_by
  )
  values (
    ${sqlString(ids.editPlanVersionId)}::uuid,
    ${sqlString(ids.projectId)}::uuid,
    ${sqlString(ids.editSessionId)}::uuid,
    1,
    'approved',
    'Generated approved snapshot persistence validation plan version',
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}),
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'approvedSnapshotOnly', true),
    true,
    now(),
    ${sqlString(actorUserId)}::uuid
  )
  returning id
), inserted_credit_estimate as (
  insert into public.credit_estimates (
    id,
    workspace_id,
    project_id,
    edit_plan_id,
    edit_plan_version_id,
    status,
    total_estimated_credits,
    estimate_payload,
    estimate_reason,
    created_by_agent
  )
  values (
    ${sqlString(ids.creditEstimateId)}::uuid,
    ${sqlString(ids.workspaceId)}::uuid,
    ${sqlString(ids.projectId)}::uuid,
    ${sqlString(ids.editPlanId)}::uuid,
    ${sqlString(ids.editPlanVersionId)}::uuid,
    'draft',
    0,
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'creditMutation', false),
    'Generated validation estimate, transaction rolled back.',
    'codex_validation_runner'
  )
  returning id
), inserted_snapshot as (
  insert into public.approved_plan_snapshots (
    id,
    workspace_id,
    project_id,
    edit_session_id,
    edit_plan_id,
    edit_plan_version_id,
    credit_estimate_id,
    approved_by,
    approved_by_user_id,
    approved_at,
    snapshot_version,
    snapshot_json,
    immutable,
    status,
    snapshot_status,
    plan_hash,
    credit_hash,
    source_sequence_hash,
    timing_hash
  )
  values (
    ${sqlString(ids.snapshotId)}::uuid,
    ${sqlString(ids.workspaceId)}::uuid,
    ${sqlString(ids.projectId)}::uuid,
    ${sqlString(ids.editSessionId)}::uuid,
    ${sqlString(ids.editPlanId)}::uuid,
    ${sqlString(ids.editPlanVersionId)}::uuid,
    ${sqlString(ids.creditEstimateId)}::uuid,
    ${sqlString(actorUserId)}::uuid,
    ${sqlString(actorUserId)}::uuid,
    now(),
    'v1',
    jsonb_build_object(
      'sourcePacket', ${sqlString(packet)},
      'validationRunId', ${sqlString(runId)},
      'approvedSnapshotPersistence', true,
      'rawPromptExecution', false,
      'workerExecution', false,
      'providerCall', false,
      'modelCall', false,
      'signedUrlCreation', false,
      'publicArtifactCreation', false
    ),
    true,
    'approved',
    'approved',
    ${sqlString(planHash)},
    ${sqlString(creditHash)},
    ${sqlString(sourceSequenceHash)},
    ${sqlString(timingHash)}
  )
  returning id, snapshot_json, immutable
), inserted_approval as (
  insert into public.approval_records (
    id,
    project_id,
    edit_session_id,
    edit_plan_version_id,
    credit_estimate_id,
    approval_type,
    approved_by,
    approved_at,
    approved_snapshot_id,
    approved_snapshot_summary_json,
    audit_metadata_json
  )
  values (
    ${sqlString(ids.approvalRecordId)}::uuid,
    ${sqlString(ids.projectId)}::uuid,
    ${sqlString(ids.editSessionId)}::uuid,
    ${sqlString(ids.editPlanVersionId)}::uuid,
    ${sqlString(ids.creditEstimateId)}::uuid,
    'internal_beta_validation',
    ${sqlString(actorUserId)}::uuid,
    now(),
    ${sqlString(ids.snapshotId)}::uuid,
    jsonb_build_object('approvedSnapshotId', ${sqlString(ids.snapshotId)}, 'validationRunId', ${sqlString(runId)}),
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'transactionRolledBack', true)
  )
  returning id
), inserted_idempotency as (
  insert into public.api_idempotency_keys (
    workspace_id,
    user_id,
    idempotency_key,
    request_method,
    request_path,
    request_hash,
    response_status,
    response_hash,
    expires_at,
    metadata
  )
  values (
    ${sqlString(ids.workspaceId)}::uuid,
    ${sqlString(actorUserId)}::uuid,
    ${sqlString(idempotencyKey)},
    'POST',
    '/external-beta/approved-plan-snapshots/validation',
    ${sqlString(requestHash)},
    201,
    ${sqlString(sha256(`approved_plan_snapshots:${ids.snapshotId}`))},
    now() + interval '1 hour',
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)})
  )
  returning id
), inserted_audit as (
  insert into public.audit_events (id, workspace_id, project_id, actor_user_id, event_type, event_json)
  values (
    ${sqlString(ids.auditEventId)}::uuid,
    ${sqlString(ids.workspaceId)}::uuid,
    ${sqlString(ids.projectId)}::uuid,
    ${sqlString(actorUserId)}::uuid,
    'external_beta.approved_snapshot_persistence_validation',
    jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'persistentRowsCreated', false)
  )
  returning id
)
select jsonb_build_object(
  'workspaceInserted', (select count(*) from inserted_workspace),
  'projectInserted', (select count(*) from inserted_project),
  'editSessionInserted', (select count(*) from inserted_session),
  'editPlanInserted', (select count(*) from inserted_plan),
  'editPlanVersionInserted', (select count(*) from inserted_plan_version),
  'creditEstimateInserted', (select count(*) from inserted_credit_estimate),
  'approvedSnapshotInserted', (select count(*) from inserted_snapshot),
  'approvalRecordInserted', (select count(*) from inserted_approval),
  'idempotencyKeyInserted', (select count(*) from inserted_idempotency),
  'auditEventInserted', (select count(*) from inserted_audit),
  'snapshotImmutable', (select immutable from inserted_snapshot),
  'snapshotValidationRunId', (select snapshot_json->>'validationRunId' from inserted_snapshot),
  'snapshotId', ${sqlString(ids.snapshotId)}
)::text;

do $$
declare
  immutable_error text := null;
begin
  begin
    update public.approved_plan_snapshots
      set status = 'superseded'
      where id = ${sqlString(ids.snapshotId)}::uuid;
    raise exception 'immutable update unexpectedly succeeded';
  exception when others then
    immutable_error := sqlerrm;
    if immutable_error not like 'approved_plan_snapshots rows with immutable=true cannot be updated or deleted%' then
      raise;
    end if;
  end;
end $$;

rollback;
`

let writeOutput = ''
try {
  writeOutput = psql(dbUrl, writeSql)
} catch (error) {
  fail('blocked_approved_snapshot_remote_write_readback_failed', error.stderr?.toString() || error.message)
}

const jsonLine = writeOutput
  .split('\n')
  .map((line) => line.trim())
  .find((line) => line.startsWith('{') && line.endsWith('}'))

if (!jsonLine) {
  fail('blocked_approved_snapshot_remote_write_readback_parse_failed', 'Could not locate validation JSON output.')
}

let writeReadback
try {
  writeReadback = JSON.parse(jsonLine)
} catch (error) {
  fail('blocked_approved_snapshot_remote_write_readback_parse_failed', error.message)
}

for (const [key, value] of Object.entries(writeReadback)) {
  if (key.endsWith('Inserted') && value !== 1) {
    fail('blocked_approved_snapshot_remote_write_readback_failed', `${key} expected 1, got ${value}`)
  }
}
if (writeReadback.snapshotImmutable !== true) {
  fail('blocked_approved_snapshot_immutability_validation_failed', 'Snapshot immutable flag was not true.')
}
if (writeReadback.snapshotValidationRunId !== runId) {
  fail('blocked_approved_snapshot_remote_write_readback_failed', 'Snapshot validation run id mismatch.')
}

const residueSql = `
select jsonb_build_object(
  'workspaces', (select count(*) from public.workspaces where metadata->>'validationRunId' = ${sqlString(runId)}),
  'projects', (select count(*) from public.projects where metadata->>'validationRunId' = ${sqlString(runId)}),
  'editSessions', (select count(*) from public.edit_sessions where metadata_json->>'validationRunId' = ${sqlString(runId)} or metadata->>'validationRunId' = ${sqlString(runId)}),
  'editPlans', (select count(*) from public.edit_plans where plan_payload->>'validationRunId' = ${sqlString(runId)}),
  'editPlanVersions', (select count(*) from public.edit_plan_versions where full_plan_json->>'validationRunId' = ${sqlString(runId)}),
  'creditEstimates', (select count(*) from public.credit_estimates where estimate_payload->>'validationRunId' = ${sqlString(runId)}),
  'approvedPlanSnapshots', (select count(*) from public.approved_plan_snapshots where snapshot_json->>'validationRunId' = ${sqlString(runId)}),
  'approvalRecords', (select count(*) from public.approval_records where audit_metadata_json->>'validationRunId' = ${sqlString(runId)}),
  'apiIdempotencyKeys', (select count(*) from public.api_idempotency_keys where idempotency_key = ${sqlString(idempotencyKey)} or metadata->>'validationRunId' = ${sqlString(runId)}),
  'auditEvents', (select count(*) from public.audit_events where event_json->>'validationRunId' = ${sqlString(runId)})
)::text;
`

let residue
try {
  residue = JSON.parse(psql(dbUrl, residueSql).trim())
} catch (error) {
  fail('blocked_approved_snapshot_residue_readback_failed', error.stderr?.toString() || error.message)
}

for (const [key, value] of Object.entries(residue)) {
  if (value !== 0) {
    fail('blocked_approved_snapshot_transaction_rollback_residue_detected', `${key} residue count was ${value}`)
  }
}

const sanitizedWriteReadback = writeArtifact('approved-snapshot-write-readback.json', JSON.stringify(writeReadback, null, 2))
const sanitizedResidueReadback = writeArtifact('rollback-residue-readback.json', JSON.stringify(residue, null, 2))
const report = {
  packet,
  decision: 'completed_approved_snapshot_persistence_guarded_remote_write_readback',
  execution: 'completed_guarded_transaction_rolled_back_approved_snapshot_persistence_write_readback',
  target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
  runId,
  outputDir,
  writeReadback,
  rollbackResidueReadback: residue,
  idempotencyKeyHash: sha256(idempotencyKey),
  actorUserIdHash: sha256(actorUserId),
  tableChain: [
    'workspaces',
    'workspace_members',
    'projects',
    'edit_sessions',
    'edit_plans',
    'edit_plan_versions',
    'credit_estimates',
    'approved_plan_snapshots',
    'approval_records',
    'api_idempotency_keys',
    'audit_events',
  ],
  safety: safety(true),
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone: 'RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1',
}
const reportArtifact = writeArtifact('validation-report.json', JSON.stringify(report, null, 2))
const manifest = {
  packet,
  runId,
  outputDir,
  artifacts: [sanitizedWriteReadback, sanitizedResidueReadback, reportArtifact],
}
const manifestPath = path.join(outputDir, 'artifact-manifest.json')
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
const finalManifestSha = sha256File(manifestPath)

console.log(`${packet} completed`)
console.log(`Decision: ${report.decision}`)
console.log(`Run ID: ${runId}`)
console.log(`Output directory: ${outputDir}`)
console.log(`Report sha256: ${reportArtifact.sha256}`)
console.log(`Manifest sha256: ${finalManifestSha}`)
