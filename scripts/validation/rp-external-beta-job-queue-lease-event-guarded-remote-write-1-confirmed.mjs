#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1'
const confirmVar = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_JOB_QUEUE_LEASE_EVENT_REMOTE_WRITE'
const dbUrlVar = 'REEDITPRO_STAGING_SUPABASE_DB_URL'
const targetRef = 'wmyyttnynmteqgcdishd'
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-job-queue-lease-event-guarded-remote-write-1'

const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex')
const outputDir = path.join(baseOutputDir, runId)

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function writeArtifact(fileName, value) {
  fs.mkdirSync(outputDir, { recursive: true })
  const filePath = path.join(outputDir, fileName)
  fs.writeFileSync(filePath, value)
  return { fileName, path: filePath, bytes: Buffer.byteLength(value), sha256: sha256(value) }
}

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
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
    remoteSupabaseMutation: completed ? 'guarded_transaction_rolled_back_generated_job_queue_lease_event_fixture_only' : false,
    sqlExecution: completed ? 'guarded_transaction_rolled_back_generated_job_queue_lease_event_fixture_sql' : false,
    sqlMutation: completed ? 'guarded_transaction_rolled_back_generated_job_queue_lease_event_fixture_only' : false,
    persistentRowsCreated: false,
    migrationApply: false,
    serviceRoleRouteExecution: false,
    routeExecution: false,
    workerExecution: false,
    workerDispatch: false,
    workerLeaseClaim: completed ? 'transaction_rolled_back_generated_worker_lease_fixture_only' : false,
    persistentWorkerLeaseClaim: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: completed ? 'transaction_rolled_back_generated_credit_fixture_only' : false,
    persistentCreditMutation: false,
    creditReservationCreation: completed ? 'transaction_rolled_back_generated_credit_fixture_only' : false,
    persistentCreditReservationCreation: false,
    jobEnqueue: completed ? 'transaction_rolled_back_generated_job_fixture_only' : false,
    persistentJobEnqueue: false,
    jobEventWrite: completed ? 'transaction_rolled_back_generated_job_event_fixture_only' : false,
    persistentJobEventWrite: false,
    providerCall: false,
    modelCall: false,
    renderExport: false,
    mediaProcessing: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
  }
}

function fail(blocker, detail) {
  const report = {
    packet,
    decision: blocker,
    execution: 'blocked_before_or_during_guarded_job_queue_lease_event_validation',
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
  const manifest = { packet, runId, outputDir, artifacts: [artifact] }
  const manifestArtifact = writeArtifact('artifact-manifest.json', JSON.stringify(manifest, null, 2))
  console.error(`${packet} failed: ${blocker}`)
  if (detail) console.error(detail)
  console.error(`Report: ${artifact.path}`)
  console.error(`Manifest: ${manifestArtifact.path}`)
  process.exit(1)
}

if (process.env[confirmVar] !== 'true') fail('blocked_pending_external_beta_job_queue_lease_event_remote_write_confirmation', `${confirmVar} must be true.`)
const dbUrl = process.env[dbUrlVar]
if (!dbUrl) fail('blocked_missing_reeditpro_staging_supabase_db_url', `${dbUrlVar} is required.`)

let actorProfileId = ''
try {
  actorProfileId = psql(dbUrl, 'select id::text from public.user_profiles order by created_at nulls last, id limit 1;').trim()
} catch (error) {
  fail('blocked_user_profile_readback_failed', error.stderr?.toString() || error.message)
}
if (!/^[0-9a-f-]{36}$/i.test(actorProfileId)) fail('blocked_no_existing_user_profile_for_generated_fixture_fk', 'No existing public.user_profiles id was available for FK-safe validation.')

const ids = Object.fromEntries([
  'workspaceId',
  'projectId',
  'editSessionId',
  'editPlanId',
  'editPlanVersionId',
  'creditEstimateId',
  'creditApprovalId',
  'snapshotId',
  'walletId',
  'grantId',
  'reservationId',
  'ledgerEntryId',
  'jobBatchId',
  'jobId',
  'jobEventId',
  'workerLeaseId',
  'jobClaimAttemptId',
  'auditEventId',
].map((key) => [key, crypto.randomUUID()]))

const idempotencyKey = `rp-extbeta-job-lease-${runId}`
const workerId = `rp-extbeta-worker-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 80)
const leaseTokenHash = sha256(`lease:${ids.workerLeaseId}:${runId}`)
const planHash = sha256(`plan:${ids.editPlanVersionId}:${runId}`)
const creditHash = sha256(`credit:${ids.creditEstimateId}:${runId}`)
const sourceSequenceHash = sha256(`source:${ids.projectId}:${runId}`)
const timingHash = sha256(`timing:${ids.editSessionId}:${runId}`)
const slug = `rp-extbeta-job-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60)

const writeSql = `
begin;
set local role service_role;

with workspace_row as (
  insert into public.workspaces (id, owner_user_id, owner_id, name, slug, metadata)
  values (${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorProfileId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'RP external beta job validation', ${sqlString(slug)}, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true))
  returning id
), member_row as (
  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  select id, ${sqlString(actorProfileId)}::uuid, 'owner', now() from workspace_row returning id
), project_row as (
  insert into public.projects (id, workspace_id, created_by, owner_id, title, description, status, metadata)
  select ${sqlString(ids.projectId)}::uuid, id, ${sqlString(actorProfileId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'RP external beta job validation project', 'Generated validation fixture; transaction rolled back.', 'draft', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true) from workspace_row
  returning id
), session_row as (
  insert into public.edit_sessions (id, project_id, workspace_id, owner_user_id, status, name, metadata_json, metadata, mock_only)
  values (${sqlString(ids.editSessionId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'draft', 'RP external beta job validation session', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), false)
  returning id
), plan_row as (
  insert into public.edit_plans (id, workspace_id, project_id, created_by_user_id, status, goal_summary, plan_payload, approval_required)
  values (${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'draft', 'Generated job queue validation plan', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'rawPromptExecution', false), true)
  returning id
), plan_version_row as (
  insert into public.edit_plan_versions (id, project_id, edit_session_id, version, status, goal_summary, plan_summary_json, full_plan_json, approval_required, approved_at, approved_by)
  values (${sqlString(ids.editPlanVersionId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editSessionId)}::uuid, 1, 'approved', 'Generated job queue validation plan version', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), true, now(), ${sqlString(actorProfileId)}::uuid)
  returning id
), estimate_row as (
  insert into public.credit_estimates (id, workspace_id, project_id, edit_plan_id, edit_plan_version_id, status, total_estimated_credits, estimate_payload, estimate_reason, created_by_agent)
  values (${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.editPlanVersionId)}::uuid, 'approved', 10, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'persistentCreditMutation', false), 'Generated validation estimate, transaction rolled back.', 'codex_validation_runner')
  returning id
), approval_row as (
  insert into public.credit_approvals (id, workspace_id, project_id, credit_estimate_id, edit_plan_id, status, approved_by, approved_at, approval_payload)
  values (${sqlString(ids.creditApprovalId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, 'approved', ${sqlString(actorProfileId)}::uuid, now(), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}))
  returning id
), snapshot_row as (
  insert into public.approved_plan_snapshots (id, workspace_id, project_id, edit_session_id, edit_plan_id, edit_plan_version_id, credit_estimate_id, credit_approval_id, approved_by, approved_by_user_id, approved_at, snapshot_version, snapshot_json, immutable, status, snapshot_status, plan_hash, credit_hash, source_sequence_hash, timing_hash)
  values (${sqlString(ids.snapshotId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editSessionId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.editPlanVersionId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.creditApprovalId)}::uuid, ${sqlString(actorProfileId)}::uuid, ${sqlString(actorProfileId)}::uuid, now(), 'v1', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'jobQueueLeaseEventValidation', true, 'rawPromptExecution', false), true, 'approved', 'approved', ${sqlString(planHash)}, ${sqlString(creditHash)}, ${sqlString(sourceSequenceHash)}, ${sqlString(timingHash)})
  returning id
), wallet_row as (
  insert into public.credit_wallets (id, workspace_id, user_id, wallet_type, name, cached_available_credits, cached_reserved_credits, cached_spent_credits, cached_refunded_credits, metadata)
  values (${sqlString(ids.walletId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'workspace', 'RP external beta job validation credits', 100, 0, 0, 0, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}))
  returning id
), grant_row as (
  insert into public.credit_grants (id, credit_wallet_id, workspace_id, user_id, source_type, status, original_amount, remaining_amount, grant_reason, metadata)
  values (${sqlString(ids.grantId)}::uuid, ${sqlString(ids.walletId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'admin', 'active', 100, 90, 'Generated validation grant, transaction rolled back.', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}))
  returning id
), reservation_row as (
  insert into public.credit_reservations (id, credit_wallet_id, workspace_id, project_id, credit_estimate_id, credit_approval_id, edit_plan_id, status, reserved_credits, spent_credits, released_credits, refunded_credits, reservation_reason, idempotency_key, reserved_at, expires_at, metadata, approved_plan_snapshot_id)
  values (${sqlString(ids.reservationId)}::uuid, ${sqlString(ids.walletId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.creditApprovalId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, 'reserved', 10, 0, 0, 0, 'Generated validation reservation, transaction rolled back.', ${sqlString(idempotencyKey)}, now(), now() + interval '1 hour', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), ${sqlString(ids.snapshotId)}::uuid)
  returning id
), ledger_row as (
  insert into public.credit_ledger_entries (id, credit_wallet_id, credit_grant_id, workspace_id, user_id, entry_type, amount, balance_after, related_project_id, related_edit_plan_id, related_reservation_id, related_estimate_id, idempotency_key, description, metadata, approved_plan_snapshot_id)
  values (${sqlString(ids.ledgerEntryId)}::uuid, ${sqlString(ids.walletId)}::uuid, ${sqlString(ids.grantId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'reservation', -10, 90, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.reservationId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(idempotencyKey)}, 'Generated validation reservation ledger entry, transaction rolled back.', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), ${sqlString(ids.snapshotId)}::uuid)
  returning id
), job_batch_row as (
  insert into public.job_batches (id, workspace_id, project_id, edit_plan_id, credit_estimate_id, credit_reservation_id, status, batch_name, batch_purpose, current_stage, progress_percent, priority, created_by_user_id, created_by_agent, idempotency_key, input_payload, metadata)
  values (${sqlString(ids.jobBatchId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.reservationId)}::uuid, 'queued', 'RP external beta job validation batch', 'generated_job_queue_lease_event_validation', 'queued', 0, 'normal', ${sqlString(actorProfileId)}::uuid, 'codex_validation_runner', ${sqlString(`${idempotencyKey}:batch`)}, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'approvedSnapshotId', ${sqlString(ids.snapshotId)}, 'workerExecution', false), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true))
  returning id, status
), job_row as (
  insert into public.jobs (id, job_batch_id, workspace_id, project_id, edit_plan_id, credit_estimate_id, credit_reservation_id, job_type, status, priority, worker_target, runtime_type, job_name, job_description, input_payload, metadata, idempotency_key)
  values (${sqlString(ids.jobId)}::uuid, ${sqlString(ids.jobBatchId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.reservationId)}::uuid, 'render_preview', 'queued', 'normal', 'render_worker', 'cloud_run_job', 'RP external beta generated job validation', 'Generated queued job fixture; no worker dispatch or execution.', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'approvedSnapshotId', ${sqlString(ids.snapshotId)}, 'workerExecution', false, 'mediaProcessing', false), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true), ${sqlString(`${idempotencyKey}:job`)})
  returning id, status, job_type, worker_target, runtime_type
), event_row as (
  insert into public.job_events (id, job_id, job_batch_id, workspace_id, project_id, event_type, message, progress_percent, actor_type, actor_agent_type, payload)
  values (${sqlString(ids.jobEventId)}::uuid, ${sqlString(ids.jobId)}::uuid, ${sqlString(ids.jobBatchId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, 'queued', 'Generated queued job event validation fixture; no worker execution.', 0, 'system', 'render_worker', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true, 'workerExecution', false))
  returning id, event_type
), lease_row as (
  insert into public.worker_leases (id, workspace_id, project_id, edit_plan_id, job_batch_id, job_id, worker_id, worker_kind, status, lease_token, claimed_at, heartbeat_at, expires_at, metadata)
  values (${sqlString(ids.workerLeaseId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.jobBatchId)}::uuid, ${sqlString(ids.jobId)}::uuid, ${sqlString(workerId)}, 'render_worker', 'claimed', ${sqlString(leaseTokenHash)}, now(), now(), now() + interval '5 minutes', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true, 'workerExecution', false))
  returning id, status, worker_kind
), claim_attempt_row as (
  insert into public.job_claim_attempts (id, job_id, worker_id, worker_kind, claim_result, reason, metadata)
  values (${sqlString(ids.jobClaimAttemptId)}::uuid, ${sqlString(ids.jobId)}::uuid, ${sqlString(workerId)}, 'render_worker', 'claimed', 'Generated validation claim attempt, transaction rolled back.', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true, 'workerExecution', false))
  returning id, claim_result
), audit_row as (
  insert into public.audit_events (id, workspace_id, project_id, actor_user_id, event_type, event_json)
  values (${sqlString(ids.auditEventId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'external_beta.job_queue_lease_event_validation', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'persistentRowsCreated', false))
  returning id
)
select jsonb_build_object(
  'approvedSnapshotInserted', (select count(*) from snapshot_row),
  'creditReservationInserted', (select count(*) from reservation_row),
  'creditLedgerEntryInserted', (select count(*) from ledger_row),
  'jobBatchInserted', (select count(*) from job_batch_row),
  'jobInserted', (select count(*) from job_row),
  'jobEventInserted', (select count(*) from event_row),
  'workerLeaseInserted', (select count(*) from lease_row),
  'jobClaimAttemptInserted', (select count(*) from claim_attempt_row),
  'auditEventInserted', (select count(*) from audit_row),
  'jobBatchStatus', (select status::text from job_batch_row),
  'jobStatus', (select status::text from job_row),
  'jobType', (select job_type::text from job_row),
  'workerTarget', (select worker_target::text from job_row),
  'runtimeType', (select runtime_type::text from job_row),
  'jobEventType', (select event_type::text from event_row),
  'workerLeaseStatus', (select status from lease_row),
  'workerLeaseWorkerKind', (select worker_kind from lease_row),
  'jobClaimAttemptResult', (select claim_result from claim_attempt_row)
)::text;

rollback;
`

let writeOutput = ''
try {
  writeOutput = psql(dbUrl, writeSql)
} catch (error) {
  fail('blocked_job_queue_lease_event_remote_write_readback_failed', error.stderr?.toString() || error.message)
}

const jsonLine = writeOutput.split('\n').map((line) => line.trim()).find((line) => line.startsWith('{') && line.endsWith('}'))
if (!jsonLine) fail('blocked_job_queue_lease_event_readback_parse_failed', 'Could not locate validation JSON output.')
let writeReadback
try {
  writeReadback = JSON.parse(jsonLine)
} catch (error) {
  fail('blocked_job_queue_lease_event_readback_parse_failed', error.message)
}

for (const [key, value] of Object.entries(writeReadback)) {
  if (key.endsWith('Inserted') && value !== 1) fail('blocked_job_queue_lease_event_remote_write_readback_failed', `${key} expected 1, got ${value}`)
}
if (writeReadback.jobBatchStatus !== 'queued') fail('blocked_job_batch_status_readback_failed', 'Job batch status mismatch.')
if (writeReadback.jobStatus !== 'queued') fail('blocked_job_status_readback_failed', 'Job status mismatch.')
if (writeReadback.jobType !== 'render_preview') fail('blocked_job_type_readback_failed', 'Job type mismatch.')
if (writeReadback.workerTarget !== 'render_worker') fail('blocked_worker_target_readback_failed', 'Worker target mismatch.')
if (writeReadback.runtimeType !== 'cloud_run_job') fail('blocked_runtime_type_readback_failed', 'Runtime type mismatch.')
if (writeReadback.jobEventType !== 'queued') fail('blocked_job_event_type_readback_failed', 'Job event type mismatch.')
if (writeReadback.workerLeaseStatus !== 'claimed') fail('blocked_worker_lease_status_readback_failed', 'Worker lease status mismatch.')
if (writeReadback.workerLeaseWorkerKind !== 'render_worker') fail('blocked_worker_lease_kind_readback_failed', 'Worker lease kind mismatch.')
if (writeReadback.jobClaimAttemptResult !== 'claimed') fail('blocked_job_claim_attempt_readback_failed', 'Job claim attempt result mismatch.')

const residueSql = `
select jsonb_build_object(
  'jobBatches', (select count(*) from public.job_batches where metadata->>'validationRunId' = ${sqlString(runId)}),
  'jobs', (select count(*) from public.jobs where metadata->>'validationRunId' = ${sqlString(runId)}),
  'jobEvents', (select count(*) from public.job_events where payload->>'validationRunId' = ${sqlString(runId)}),
  'workerLeases', (select count(*) from public.worker_leases where metadata->>'validationRunId' = ${sqlString(runId)}),
  'jobClaimAttempts', (select count(*) from public.job_claim_attempts where metadata->>'validationRunId' = ${sqlString(runId)}),
  'creditReservations', (select count(*) from public.credit_reservations where metadata->>'validationRunId' = ${sqlString(runId)}),
  'creditLedgerEntries', (select count(*) from public.credit_ledger_entries where metadata->>'validationRunId' = ${sqlString(runId)}),
  'approvedPlanSnapshots', (select count(*) from public.approved_plan_snapshots where snapshot_json->>'validationRunId' = ${sqlString(runId)}),
  'auditEvents', (select count(*) from public.audit_events where event_json->>'validationRunId' = ${sqlString(runId)})
)::text;
`

let residue
try {
  residue = JSON.parse(psql(dbUrl, residueSql).trim())
} catch (error) {
  fail('blocked_job_queue_lease_event_residue_readback_failed', error.stderr?.toString() || error.message)
}
for (const [key, value] of Object.entries(residue)) {
  if (value !== 0) fail('blocked_job_queue_lease_event_transaction_rollback_residue_detected', `${key} residue count was ${value}`)
}

const writeArtifactResult = writeArtifact('job-queue-lease-event-write-readback.json', JSON.stringify(writeReadback, null, 2))
const residueArtifact = writeArtifact('rollback-residue-readback.json', JSON.stringify(residue, null, 2))
const report = {
  packet,
  decision: 'completed_job_queue_lease_event_guarded_remote_write_readback',
  execution: 'completed_guarded_transaction_rolled_back_job_queue_lease_event_write_readback',
  target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
  runId,
  outputDir,
  writeReadback,
  rollbackResidueReadback: residue,
  idempotencyKeyHash: sha256(idempotencyKey),
  actorProfileIdHash: sha256(actorProfileId),
  workerIdHash: sha256(workerId),
  leaseTokenHash: sha256(leaseTokenHash),
  safety: safety(true),
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone: 'RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1',
}
const reportArtifact = writeArtifact('validation-report.json', JSON.stringify(report, null, 2))
const manifestPath = path.join(outputDir, 'artifact-manifest.json')
const manifest = { packet, runId, outputDir, artifacts: [writeArtifactResult, residueArtifact, reportArtifact] }
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
const manifestSha = sha256(fs.readFileSync(manifestPath))

console.log(`${packet} completed`)
console.log(`Decision: ${report.decision}`)
console.log(`Run ID: ${runId}`)
console.log(`Output directory: ${outputDir}`)
console.log(`Report sha256: ${reportArtifact.sha256}`)
console.log(`Manifest sha256: ${manifestSha}`)
