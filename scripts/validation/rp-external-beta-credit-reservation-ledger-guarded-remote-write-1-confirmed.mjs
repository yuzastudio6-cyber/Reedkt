#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1'
const confirmVar = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_CREDIT_LEDGER_REMOTE_WRITE'
const dbUrlVar = 'REEDITPRO_STAGING_SUPABASE_DB_URL'
const targetRef = 'wmyyttnynmteqgcdishd'
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-credit-reservation-ledger-guarded-remote-write-1'

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
    remoteSupabaseMutation: completed
      ? 'guarded_transaction_rolled_back_generated_credit_reservation_ledger_fixture_only'
      : false,
    sqlExecution: completed
      ? 'guarded_transaction_rolled_back_generated_credit_reservation_ledger_fixture_sql'
      : false,
    sqlMutation: completed
      ? 'guarded_transaction_rolled_back_generated_credit_reservation_ledger_fixture_only'
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
    creditMutation: completed ? 'transaction_rolled_back_generated_credit_fixture_only' : false,
    persistentCreditMutation: false,
    creditReservationCreation: completed ? 'transaction_rolled_back_generated_credit_fixture_only' : false,
    persistentCreditReservationCreation: false,
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

function fail(blocker, detail) {
  const report = {
    packet,
    decision: blocker,
    execution: 'blocked_before_or_during_guarded_credit_write_validation',
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

if (process.env[confirmVar] !== 'true') fail('blocked_pending_external_beta_credit_ledger_remote_write_confirmation', `${confirmVar} must be true.`)
const dbUrl = process.env[dbUrlVar]
if (!dbUrl) fail('blocked_missing_reeditpro_staging_supabase_db_url', `${dbUrlVar} is required.`)

let actorUserId = ''
try {
  actorUserId = psql(dbUrl, "select id::text from auth.users order by created_at nulls last, id limit 1;").trim()
} catch (error) {
  fail('blocked_auth_user_readback_failed', error.stderr?.toString() || error.message)
}
if (!/^[0-9a-f-]{36}$/i.test(actorUserId)) fail('blocked_no_existing_auth_user_for_generated_fixture_fk', 'No existing auth.users id was available for FK-safe validation.')

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
  'auditEventId',
].map((key) => [key, crypto.randomUUID()]))

const idempotencyKey = `rp-extbeta-credit-ledger-${runId}`
const planHash = sha256(`plan:${ids.editPlanVersionId}:${runId}`)
const creditHash = sha256(`credit:${ids.creditEstimateId}:${runId}`)
const sourceSequenceHash = sha256(`source:${ids.projectId}:${runId}`)
const timingHash = sha256(`timing:${ids.editSessionId}:${runId}`)
const slug = `rp-extbeta-credit-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60)

const writeSql = `
begin;
set local role service_role;

with workspace_row as (
  insert into public.workspaces (id, owner_user_id, owner_id, name, slug, metadata)
  values (${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorUserId)}::uuid, ${sqlString(actorUserId)}::uuid, 'RP external beta credit validation', ${sqlString(slug)}, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true))
  returning id
), member_row as (
  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  select id, ${sqlString(actorUserId)}::uuid, 'owner', now() from workspace_row returning id
), project_row as (
  insert into public.projects (id, workspace_id, created_by, owner_id, title, description, status, metadata)
  select ${sqlString(ids.projectId)}::uuid, id, ${sqlString(actorUserId)}::uuid, ${sqlString(actorUserId)}::uuid, 'RP external beta credit validation project', 'Generated validation fixture; transaction rolled back.', 'draft', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true) from workspace_row
  returning id, workspace_id
), session_row as (
  insert into public.edit_sessions (id, project_id, workspace_id, owner_user_id, status, name, metadata_json, metadata, mock_only)
  values (${sqlString(ids.editSessionId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorUserId)}::uuid, 'draft', 'RP external beta credit validation session', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), false)
  returning id
), plan_row as (
  insert into public.edit_plans (id, workspace_id, project_id, created_by_user_id, status, goal_summary, plan_payload, approval_required)
  values (${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(actorUserId)}::uuid, 'draft', 'Generated credit ledger validation plan', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'rawPromptExecution', false), true)
  returning id
), plan_version_row as (
  insert into public.edit_plan_versions (id, project_id, edit_session_id, version, status, goal_summary, plan_summary_json, full_plan_json, approval_required, approved_at, approved_by)
  values (${sqlString(ids.editPlanVersionId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editSessionId)}::uuid, 1, 'approved', 'Generated credit ledger validation plan version', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), true, now(), ${sqlString(actorUserId)}::uuid)
  returning id
), estimate_row as (
  insert into public.credit_estimates (id, workspace_id, project_id, edit_plan_id, edit_plan_version_id, status, total_estimated_credits, estimate_payload, estimate_reason, created_by_agent)
  values (${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.editPlanVersionId)}::uuid, 'approved', 10, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'persistentCreditMutation', false), 'Generated validation estimate, transaction rolled back.', 'codex_validation_runner')
  returning id
), approval_row as (
  insert into public.credit_approvals (id, workspace_id, project_id, credit_estimate_id, edit_plan_id, status, approved_by, approved_at, approval_payload)
  values (${sqlString(ids.creditApprovalId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, 'approved', ${sqlString(actorUserId)}::uuid, now(), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}))
  returning id
), snapshot_row as (
  insert into public.approved_plan_snapshots (id, workspace_id, project_id, edit_session_id, edit_plan_id, edit_plan_version_id, credit_estimate_id, credit_approval_id, approved_by, approved_by_user_id, approved_at, snapshot_version, snapshot_json, immutable, status, snapshot_status, plan_hash, credit_hash, source_sequence_hash, timing_hash)
  values (${sqlString(ids.snapshotId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editSessionId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.editPlanVersionId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.creditApprovalId)}::uuid, ${sqlString(actorUserId)}::uuid, ${sqlString(actorUserId)}::uuid, now(), 'v1', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'creditLedgerValidation', true, 'rawPromptExecution', false), true, 'approved', 'approved', ${sqlString(planHash)}, ${sqlString(creditHash)}, ${sqlString(sourceSequenceHash)}, ${sqlString(timingHash)})
  returning id
), wallet_row as (
  insert into public.credit_wallets (id, workspace_id, user_id, wallet_type, name, cached_available_credits, cached_reserved_credits, cached_spent_credits, cached_refunded_credits, metadata)
  values (${sqlString(ids.walletId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorUserId)}::uuid, 'workspace', 'RP external beta validation credits', 100, 0, 0, 0, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}))
  returning id
), grant_row as (
  insert into public.credit_grants (id, credit_wallet_id, workspace_id, user_id, source_type, status, original_amount, remaining_amount, grant_reason, metadata)
  values (${sqlString(ids.grantId)}::uuid, ${sqlString(ids.walletId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorUserId)}::uuid, 'admin', 'active', 100, 90, 'Generated validation grant, transaction rolled back.', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}))
  returning id
), reservation_row as (
  insert into public.credit_reservations (id, credit_wallet_id, workspace_id, project_id, credit_estimate_id, credit_approval_id, edit_plan_id, status, reserved_credits, spent_credits, released_credits, refunded_credits, reservation_reason, idempotency_key, reserved_at, expires_at, metadata, approved_plan_snapshot_id)
  values (${sqlString(ids.reservationId)}::uuid, ${sqlString(ids.walletId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.creditApprovalId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, 'reserved', 10, 0, 0, 0, 'Generated validation reservation, transaction rolled back.', ${sqlString(idempotencyKey)}, now(), now() + interval '1 hour', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), ${sqlString(ids.snapshotId)}::uuid)
  returning id, status
), ledger_row as (
  insert into public.credit_ledger_entries (id, credit_wallet_id, credit_grant_id, workspace_id, user_id, entry_type, amount, balance_after, related_project_id, related_edit_plan_id, related_reservation_id, related_estimate_id, idempotency_key, description, metadata, approved_plan_snapshot_id)
  values (${sqlString(ids.ledgerEntryId)}::uuid, ${sqlString(ids.walletId)}::uuid, ${sqlString(ids.grantId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorUserId)}::uuid, 'reservation', -10, 90, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.reservationId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(idempotencyKey)}, 'Generated validation reservation ledger entry, transaction rolled back.', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), ${sqlString(ids.snapshotId)}::uuid)
  returning id, entry_type, amount, balance_after
), audit_row as (
  insert into public.audit_events (id, workspace_id, project_id, actor_user_id, event_type, event_json)
  values (${sqlString(ids.auditEventId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(actorUserId)}::uuid, 'external_beta.credit_reservation_ledger_validation', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'persistentRowsCreated', false))
  returning id
)
select jsonb_build_object(
  'creditWalletInserted', (select count(*) from wallet_row),
  'creditGrantInserted', (select count(*) from grant_row),
  'creditApprovalInserted', (select count(*) from approval_row),
  'creditReservationInserted', (select count(*) from reservation_row),
  'creditLedgerEntryInserted', (select count(*) from ledger_row),
  'approvedSnapshotInserted', (select count(*) from snapshot_row),
  'auditEventInserted', (select count(*) from audit_row),
  'reservationStatus', (select status::text from reservation_row),
  'ledgerEntryType', (select entry_type::text from ledger_row),
  'ledgerAmount', (select amount from ledger_row),
  'ledgerBalanceAfter', (select balance_after from ledger_row)
)::text;

do $$
declare
  mutation_error text := null;
begin
  begin
    update public.credit_ledger_entries
      set amount = -9
      where id = ${sqlString(ids.ledgerEntryId)}::uuid;
    raise exception 'credit ledger update unexpectedly succeeded';
  exception when others then
    mutation_error := sqlerrm;
    if mutation_error not like 'credit_ledger_entries are append-only and cannot be updated or deleted%' then
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
  fail('blocked_credit_reservation_ledger_remote_write_readback_failed', error.stderr?.toString() || error.message)
}

const jsonLine = writeOutput.split('\n').map((line) => line.trim()).find((line) => line.startsWith('{') && line.endsWith('}'))
if (!jsonLine) fail('blocked_credit_reservation_ledger_readback_parse_failed', 'Could not locate validation JSON output.')
let writeReadback
try {
  writeReadback = JSON.parse(jsonLine)
} catch (error) {
  fail('blocked_credit_reservation_ledger_readback_parse_failed', error.message)
}

for (const [key, value] of Object.entries(writeReadback)) {
  if (key.endsWith('Inserted') && value !== 1) fail('blocked_credit_reservation_ledger_remote_write_readback_failed', `${key} expected 1, got ${value}`)
}
if (writeReadback.reservationStatus !== 'reserved') fail('blocked_credit_reservation_status_readback_failed', 'Reservation status mismatch.')
if (writeReadback.ledgerEntryType !== 'reservation') fail('blocked_credit_ledger_entry_type_readback_failed', 'Ledger entry type mismatch.')
if (writeReadback.ledgerAmount !== -10 || writeReadback.ledgerBalanceAfter !== 90) fail('blocked_credit_ledger_amount_readback_failed', 'Ledger amount/balance mismatch.')

const residueSql = `
select jsonb_build_object(
  'creditWallets', (select count(*) from public.credit_wallets where metadata->>'validationRunId' = ${sqlString(runId)}),
  'creditGrants', (select count(*) from public.credit_grants where metadata->>'validationRunId' = ${sqlString(runId)}),
  'creditApprovals', (select count(*) from public.credit_approvals where approval_payload->>'validationRunId' = ${sqlString(runId)}),
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
  fail('blocked_credit_reservation_ledger_residue_readback_failed', error.stderr?.toString() || error.message)
}
for (const [key, value] of Object.entries(residue)) {
  if (value !== 0) fail('blocked_credit_reservation_ledger_transaction_rollback_residue_detected', `${key} residue count was ${value}`)
}

const writeArtifactResult = writeArtifact('credit-ledger-write-readback.json', JSON.stringify(writeReadback, null, 2))
const residueArtifact = writeArtifact('rollback-residue-readback.json', JSON.stringify(residue, null, 2))
const report = {
  packet,
  decision: 'completed_credit_reservation_ledger_guarded_remote_write_readback',
  execution: 'completed_guarded_transaction_rolled_back_credit_reservation_ledger_write_readback',
  target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
  runId,
  outputDir,
  writeReadback,
  rollbackResidueReadback: residue,
  idempotencyKeyHash: sha256(idempotencyKey),
  actorUserIdHash: sha256(actorUserId),
  safety: safety(true),
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone: 'RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1',
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
