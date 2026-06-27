#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1'
const confirmVar = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_APPROVED_SNAPSHOT_ROUTE_WRITE_RUNTIME_VALIDATION'
const dbUrlVar = 'REEDITPRO_STAGING_SUPABASE_DB_URL'
const supabaseUrlVar = 'REEDITPRO_STAGING_SUPABASE_URL'
const serviceRoleKeyVar = 'REEDITPRO_STAGING_SUPABASE_SERVICE_ROLE_KEY'
const targetRef = 'wmyyttnynmteqgcdishd'
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-approved-snapshot-route-write-runtime-validation-1'

const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex')
const outputDir = path.join(baseOutputDir, runId)
const ids = Object.fromEntries([
  'workspaceId',
  'projectId',
  'editSessionId',
  'editPlanId',
  'editPlanVersionId',
  'creditEstimateId',
  'creditApprovalId',
  'creditWalletId',
  'creditReservationId',
].map((key) => [key, crypto.randomUUID()]))
const idempotencyKey = `rp-extbeta-approved-snapshot-route-${runId}`
const planHash = sha256(`plan:${ids.editPlanVersionId}:${runId}`)
const creditHash = sha256(`credit:${ids.creditEstimateId}:${runId}`)
const sourceSequenceHash = sha256(`source:${ids.projectId}:${runId}`)
const timingHash = sha256(`timing:${ids.editSessionId}:${runId}`)
const slug = `rp-extbeta-snapshot-route-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60)

let dbUrl = ''
let setupCommitted = false
let routeServer
let cleanupResidueReadback = null

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function writeArtifact(fileName, value) {
  fs.mkdirSync(outputDir, { recursive: true })
  const filePath = path.join(outputDir, fileName)
  fs.writeFileSync(filePath, value)
  return { fileName, path: filePath, bytes: Buffer.byteLength(value), sha256: sha256(value) }
}

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options })
}

function psql(sql) {
  return run('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-A', '-t', '-c', sql])
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function parseJsonOutput(output, blocker) {
  const jsonLine = output.split('\n').map((line) => line.trim()).find((line) => line.startsWith('{') && line.endsWith('}'))
  if (!jsonLine) fail(blocker, 'Could not locate JSON output.')
  try {
    return JSON.parse(jsonLine)
  } catch (error) {
    fail(blocker, error.message)
  }
}

function safety(completed) {
  return {
    databaseUrlPayloadSource: 'ephemeral_process_env_only',
    databaseUrlPrinted: false,
    databaseUrlPersistedInRepo: false,
    supabaseUrlPayloadSource: 'ephemeral_process_env_only',
    supabaseUrlPrinted: false,
    supabaseUrlPersistedInRepo: false,
    serviceRoleSecretPayloadAccess: completed ? 'guarded_ephemeral_route_runtime_service_role_key_payload_only' : false,
    serviceRoleSecretPayloadPrinted: false,
    serviceRoleSecretPayloadPersistedInRepo: false,
    frontendServiceRoleCredentialExposure: false,
    remoteSupabaseMutation: completed ? 'guarded_generated_approved_snapshot_route_fixture_created_read_deleted_with_residue_zero' : false,
    sqlExecution: completed ? 'guarded_generated_route_fixture_setup_cleanup_and_residue_readback_sql' : false,
    sqlMutation: completed ? 'guarded_generated_approved_snapshot_route_fixture_setup_and_cleanup_only' : false,
    persistentRowsCreated: false,
    migrationApply: false,
    serviceRoleRouteExecution: completed ? 'guarded_in_process_approved_snapshot_create_route_only' : false,
    routeExecution: completed ? 'guarded_in_process_post_approved_snapshot_route_only' : false,
    routeWriteExecution: completed ? 'guarded_in_process_approved_snapshot_create_route_only' : false,
    validationOnlyEphemeralSnapshotCleanup: completed,
    validationAuthOverride: completed ? 'uuid_validation_auth_context_for_guarded_in_process_route_harness_only' : false,
    workerExecution: false,
    workerDispatch: false,
    persistentWorkerLeaseClaim: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    storageObjectDelete: false,
    storageObjectResidueCount: 0,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    persistentCreditMutation: false,
    creditReservationCreation: completed ? 'generated_route_dependency_fixture_created_deleted_with_residue_zero' : false,
    persistentCreditReservationCreation: false,
    creditSpend: false,
    jobEnqueue: false,
    persistentJobEnqueue: false,
    jobEventWrite: false,
    persistentJobEventWrite: false,
    providerCall: false,
    modelCall: false,
    renderExport: false,
    previewRenderExecution: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
  }
}

function readCleanupResidue() {
  return parseJsonOutput(psql(`
select jsonb_build_object(
  'workspaces', (select count(*) from public.workspaces where id = ${sqlString(ids.workspaceId)}::uuid),
  'workspaceMembers', (select count(*) from public.workspace_members where workspace_id = ${sqlString(ids.workspaceId)}::uuid),
  'projects', (select count(*) from public.projects where id = ${sqlString(ids.projectId)}::uuid),
  'editSessions', (select count(*) from public.edit_sessions where id = ${sqlString(ids.editSessionId)}::uuid),
  'editPlans', (select count(*) from public.edit_plans where id = ${sqlString(ids.editPlanId)}::uuid),
  'editPlanVersions', (select count(*) from public.edit_plan_versions where id = ${sqlString(ids.editPlanVersionId)}::uuid),
  'creditEstimates', (select count(*) from public.credit_estimates where id = ${sqlString(ids.creditEstimateId)}::uuid),
  'creditApprovals', (select count(*) from public.credit_approvals where id = ${sqlString(ids.creditApprovalId)}::uuid),
  'creditWallets', (select count(*) from public.credit_wallets where id = ${sqlString(ids.creditWalletId)}::uuid),
  'creditReservations', (select count(*) from public.credit_reservations where id = ${sqlString(ids.creditReservationId)}::uuid),
  'approvedPlanSnapshots', (select count(*) from public.approved_plan_snapshots where snapshot_json->>'validationRunId' = ${sqlString(runId)}),
  'apiIdempotencyKeys', (select count(*) from public.api_idempotency_keys where idempotency_key = ${sqlString(idempotencyKey)} or metadata->>'validationRunId' = ${sqlString(runId)})
)::text;
`), 'blocked_route_fixture_cleanup_residue_parse_failed')
}

function cleanupFixture() {
  if (!setupCommitted || !dbUrl) return
  psql(`
begin;
set local role service_role;
delete from public.api_idempotency_keys where idempotency_key = ${sqlString(idempotencyKey)} or metadata->>'validationRunId' = ${sqlString(runId)};
delete from public.approved_plan_snapshots where snapshot_json->>'validationRunId' = ${sqlString(runId)} and immutable = false and status = 'validation_ephemeral';
delete from public.credit_reservations where id = ${sqlString(ids.creditReservationId)}::uuid;
delete from public.credit_approvals where id = ${sqlString(ids.creditApprovalId)}::uuid;
delete from public.credit_estimates where id = ${sqlString(ids.creditEstimateId)}::uuid;
delete from public.credit_wallets where id = ${sqlString(ids.creditWalletId)}::uuid;
delete from public.edit_plan_versions where id = ${sqlString(ids.editPlanVersionId)}::uuid;
delete from public.edit_plans where id = ${sqlString(ids.editPlanId)}::uuid;
delete from public.edit_sessions where id = ${sqlString(ids.editSessionId)}::uuid;
delete from public.projects where id = ${sqlString(ids.projectId)}::uuid;
delete from public.workspace_members where workspace_id = ${sqlString(ids.workspaceId)}::uuid;
delete from public.workspaces where id = ${sqlString(ids.workspaceId)}::uuid;
commit;
`)
  cleanupResidueReadback = readCleanupResidue()
}

function closeServerSync() {
  if (!routeServer) return
  routeServer.close()
  routeServer = undefined
}

function fail(blocker, detail) {
  try {
    closeServerSync()
  } catch {
    // Best-effort local server cleanup. The blocker below remains authoritative.
  }
  try {
    cleanupFixture()
  } catch (cleanupError) {
    detail = `${detail ?? ''}\nCleanup failure: ${cleanupError.stderr?.toString() || cleanupError.message}`.trim()
  }
  const report = {
    packet,
    decision: blocker,
    execution: 'blocked_before_or_during_guarded_approved_snapshot_route_write_runtime_validation',
    target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
    runId,
    blocker,
    detail,
    route: { method: 'POST', path: '/v1/edit-plans/:editPlanId/approved-snapshots', executed: false },
    cleanupResidueReadback,
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

async function main() {
  if (process.env[confirmVar] !== 'true') fail('blocked_pending_external_beta_approved_snapshot_route_write_runtime_validation_confirmation', `${confirmVar} must be true.`)
  dbUrl = process.env[dbUrlVar] ?? ''
  const supabaseUrl = process.env[supabaseUrlVar] ?? ''
  const serviceRoleKey = process.env[serviceRoleKeyVar] ?? ''
  if (!dbUrl) fail('blocked_missing_reeditpro_staging_supabase_db_url', `${dbUrlVar} is required.`)
  if (!supabaseUrl) fail('blocked_missing_reeditpro_staging_supabase_url', `${supabaseUrlVar} is required.`)
  if (!serviceRoleKey) fail('blocked_missing_reeditpro_staging_supabase_service_role_key', `${serviceRoleKeyVar} is required.`)
  if (!dbUrl.includes(targetRef)) fail('blocked_supabase_db_url_target_mismatch', `${dbUrlVar} must reference ${targetRef}.`)
  if (!supabaseUrl.includes(targetRef)) fail('blocked_supabase_url_target_mismatch', `${supabaseUrlVar} must reference ${targetRef}.`)

  let actorUserId = ''
  try {
    actorUserId = psql('select id::text from auth.users order by created_at nulls last, id limit 1;').trim()
  } catch (error) {
    fail('blocked_auth_user_readback_failed', error.stderr?.toString() || error.message)
  }
  if (!/^[0-9a-f-]{36}$/i.test(actorUserId)) fail('blocked_no_existing_auth_user_for_generated_route_fixture_fk', 'No existing auth.users id was available for FK-safe validation.')

  const setupReadback = parseJsonOutput(psql(`
begin;
set local role service_role;

with workspace_row as (
  insert into public.workspaces (id, owner_user_id, owner_id, name, slug, metadata)
  values (${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorUserId)}::uuid, ${sqlString(actorUserId)}::uuid, 'RP external beta approved snapshot route validation', ${sqlString(slug)}, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true))
  returning id
), member_row as (
  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  select id, ${sqlString(actorUserId)}::uuid, 'owner', now() from workspace_row returning id
), project_row as (
  insert into public.projects (id, workspace_id, created_by, owner_id, title, description, status, metadata)
  select ${sqlString(ids.projectId)}::uuid, id, ${sqlString(actorUserId)}::uuid, ${sqlString(actorUserId)}::uuid, 'RP external beta approved snapshot route validation project', 'Generated route write validation fixture.', 'draft', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true) from workspace_row
  returning id, workspace_id
), session_row as (
  insert into public.edit_sessions (id, project_id, workspace_id, owner_user_id, status, name, metadata_json, metadata, mock_only)
  values (${sqlString(ids.editSessionId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorUserId)}::uuid, 'draft', 'RP external beta approved snapshot route validation session', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), false)
  returning id
), plan_row as (
  insert into public.edit_plans (id, workspace_id, project_id, created_by_user_id, status, goal_summary, plan_payload, approval_required)
  values (${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(actorUserId)}::uuid, 'approved', 'Generated approved snapshot route validation plan', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'rawPromptExecution', false), true)
  returning id
), plan_version_row as (
  insert into public.edit_plan_versions (id, project_id, edit_session_id, version, status, goal_summary, plan_summary_json, full_plan_json, approval_required, approved_at, approved_by)
  values (${sqlString(ids.editPlanVersionId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editSessionId)}::uuid, 1, 'approved', 'Generated approved snapshot route validation plan version', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'approvedSnapshotRouteWriteValidation', true), true, now(), ${sqlString(actorUserId)}::uuid)
  returning id
), estimate_row as (
  insert into public.credit_estimates (id, workspace_id, project_id, edit_plan_id, edit_plan_version_id, status, total_estimated_credits, estimate_payload, estimate_reason, created_by_agent)
  values (${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, ${sqlString(ids.editPlanVersionId)}::uuid, 'approved', 0, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'creditSpend', false), 'Generated route validation estimate.', 'codex_validation_runner')
  returning id
), approval_row as (
  insert into public.credit_approvals (id, workspace_id, project_id, credit_estimate_id, edit_plan_id, status, approved_by, approved_at, approval_payload)
  values (${sqlString(ids.creditApprovalId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, 'approved', ${sqlString(actorUserId)}::uuid, now(), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}))
  returning id
), wallet_row as (
  insert into public.credit_wallets (id, workspace_id, user_id, wallet_type, name, cached_available_credits, cached_reserved_credits, cached_spent_credits, cached_refunded_credits, metadata)
  values (${sqlString(ids.creditWalletId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorUserId)}::uuid, 'workspace', 'RP external beta approved snapshot route validation wallet', 0, 0, 0, 0, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}))
  returning id
), reservation_row as (
  insert into public.credit_reservations (id, credit_wallet_id, workspace_id, project_id, credit_estimate_id, credit_approval_id, edit_plan_id, status, reserved_credits, spent_credits, released_credits, refunded_credits, reservation_reason, idempotency_key, reserved_at, expires_at, metadata)
  values (${sqlString(ids.creditReservationId)}::uuid, ${sqlString(ids.creditWalletId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.creditEstimateId)}::uuid, ${sqlString(ids.creditApprovalId)}::uuid, ${sqlString(ids.editPlanId)}::uuid, 'reserved', 0, 0, 0, 0, 'Generated route validation reservation.', ${sqlString(idempotencyKey)}, now(), now() + interval '1 hour', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}))
  returning id, status
)
select jsonb_build_object(
  'workspaceInserted', (select count(*) from workspace_row),
  'workspaceMemberInserted', (select count(*) from member_row),
  'projectInserted', (select count(*) from project_row),
  'editSessionInserted', (select count(*) from session_row),
  'editPlanInserted', (select count(*) from plan_row),
  'editPlanVersionInserted', (select count(*) from plan_version_row),
  'creditEstimateInserted', (select count(*) from estimate_row),
  'creditApprovalInserted', (select count(*) from approval_row),
  'creditWalletInserted', (select count(*) from wallet_row),
  'creditReservationInserted', (select count(*) from reservation_row),
  'editPlanStatus', (select 'approved' from plan_row),
  'creditEstimateStatus', (select 'approved' from estimate_row),
  'creditApprovalStatus', (select 'approved' from approval_row),
  'creditReservationStatus', (select status::text from reservation_row)
)::text;

commit;
`), 'blocked_route_fixture_setup_parse_failed')
  setupCommitted = true
  for (const key of ['workspaceInserted', 'workspaceMemberInserted', 'projectInserted', 'editSessionInserted', 'editPlanInserted', 'editPlanVersionInserted', 'creditEstimateInserted', 'creditApprovalInserted', 'creditWalletInserted', 'creditReservationInserted']) {
    if (setupReadback[key] !== 1) fail('blocked_route_fixture_setup_failed', `${key} expected 1, got ${setupReadback[key]}`)
  }
  if (setupReadback.editPlanStatus !== 'approved') fail('blocked_route_fixture_setup_failed', 'edit plan was not approved')
  if (setupReadback.creditEstimateStatus !== 'approved') fail('blocked_route_fixture_setup_failed', 'credit estimate was not approved')
  if (setupReadback.creditApprovalStatus !== 'approved') fail('blocked_route_fixture_setup_failed', 'credit approval was not approved')
  if (setupReadback.creditReservationStatus !== 'reserved') fail('blocked_route_fixture_setup_failed', 'credit reservation was not reserved')

  const previousValidationAuthUser = process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID
  const previousValidationAuthEmail = process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_EMAIL
  const previousEphemeral = process.env.REEDITPRO_ROUTE_VALIDATION_EPHEMERAL_APPROVED_SNAPSHOT
  process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID = actorUserId
  process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_EMAIL = 'approved-snapshot-route-validation@reeditpro.local'
  process.env.REEDITPRO_ROUTE_VALIDATION_EPHEMERAL_APPROVED_SNAPSHOT = 'true'
  const { createReeditProApiApp } = await import('../../server/app.ts')
  const { loadRuntimeEnv } = await import('../../server/config/env.ts')
  const runtimeEnv = loadRuntimeEnv({
    NODE_ENV: 'test',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    E2E_RUNTIME_MODE: 'local',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: '.reeditpro-local-storage',
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    GCS_DEFAULT_REGION: 'us-east1',
    WORKER_RUNTIME_MODE: 'disabled',
  })
  if (!runtimeEnv.hasSupabaseAdmin || runtimeEnv.mockOnly) fail('blocked_route_runtime_admin_client_unavailable', 'Supabase admin route runtime was not available.')

  const app = createReeditProApiApp(runtimeEnv)
  routeServer = http.createServer(app)
  await new Promise((resolve, reject) => {
    routeServer.once('error', reject)
    routeServer.listen(0, '127.0.0.1', resolve)
  })
  const address = routeServer.address()
  if (!address || typeof address === 'string') fail('blocked_route_runtime_server_start_failed', 'Could not allocate a local in-process route server port.')

  const routePath = `/v1/edit-plans/${ids.editPlanId}/approved-snapshots`
  const routeUrl = `http://127.0.0.1:${address.port}${routePath}`
  const requestBody = {
    workspaceId: ids.workspaceId,
    projectId: ids.projectId,
    editSessionId: ids.editSessionId,
    editPlanVersionId: ids.editPlanVersionId,
    creditEstimateId: ids.creditEstimateId,
    creditApprovalId: ids.creditApprovalId,
    creditReservationId: ids.creditReservationId,
    snapshotVersion: 1,
    snapshotJson: {
      sourcePacket: packet,
      validationRunId: runId,
      validationEphemeralApprovedSnapshotRouteWrite: true,
      approvedSnapshotRouteWriteValidation: true,
      rawPromptExecution: false,
      workerExecution: false,
      providerCall: false,
      modelCall: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
    },
    planHash,
    creditHash,
    sourceSequenceHash,
    timingHash,
  }
  const response = await fetch(routeUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(requestBody),
  })
  const routeBodyText = await response.text()
  if (previousValidationAuthUser === undefined) delete process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID
  else process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID = previousValidationAuthUser
  if (previousValidationAuthEmail === undefined) delete process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_EMAIL
  else process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_EMAIL = previousValidationAuthEmail
  if (previousEphemeral === undefined) delete process.env.REEDITPRO_ROUTE_VALIDATION_EPHEMERAL_APPROVED_SNAPSHOT
  else process.env.REEDITPRO_ROUTE_VALIDATION_EPHEMERAL_APPROVED_SNAPSHOT = previousEphemeral

  let routeBody
  try {
    routeBody = JSON.parse(routeBodyText)
  } catch (error) {
    fail('blocked_approved_snapshot_route_response_parse_failed', error.message)
  }
  if (response.status !== 201 || routeBody?.ok !== true) {
    fail('blocked_approved_snapshot_route_write_failed', `Route status ${response.status}; body ${routeBodyText.slice(0, 700)}`)
  }

  await new Promise((resolve) => routeServer.close(resolve))
  routeServer = undefined

  const snapshot = routeBody.data?.approvedPlanSnapshot
  const snapshotId = snapshot?.id
  if (!/^[0-9a-f-]{36}$/i.test(snapshotId)) fail('blocked_approved_snapshot_route_snapshot_id_missing', 'Route did not return an approved snapshot id.')

  const routeReadback = parseJsonOutput(psql(`
select jsonb_build_object(
  'approvedSnapshotCount', (select count(*) from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'idempotencyKeyCount', (select count(*) from public.api_idempotency_keys where idempotency_key = ${sqlString(idempotencyKey)}),
  'workspaceIdMatches', (select workspace_id = ${sqlString(ids.workspaceId)}::uuid from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'projectIdMatches', (select project_id = ${sqlString(ids.projectId)}::uuid from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'editPlanIdMatches', (select edit_plan_id = ${sqlString(ids.editPlanId)}::uuid from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'editPlanVersionIdMatches', (select edit_plan_version_id = ${sqlString(ids.editPlanVersionId)}::uuid from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'creditEstimateIdMatches', (select credit_estimate_id = ${sqlString(ids.creditEstimateId)}::uuid from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'creditApprovalIdMatches', (select credit_approval_id = ${sqlString(ids.creditApprovalId)}::uuid from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'creditReservationIdMatches', (select credit_reservation_id = ${sqlString(ids.creditReservationId)}::uuid from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'approvedByUserIdMatches', (select approved_by_user_id = ${sqlString(actorUserId)}::uuid from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'snapshotStatus', (select snapshot_status from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'status', (select status from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'immutable', (select immutable from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'validationRunId', (select snapshot_json->>'validationRunId' from public.approved_plan_snapshots where id = ${sqlString(snapshotId)}::uuid),
  'idempotencyUserMatches', (select user_id = ${sqlString(actorUserId)}::uuid from public.api_idempotency_keys where idempotency_key = ${sqlString(idempotencyKey)} limit 1),
  'idempotencyWorkspaceMatches', (select workspace_id = ${sqlString(ids.workspaceId)}::uuid from public.api_idempotency_keys where idempotency_key = ${sqlString(idempotencyKey)} limit 1),
  'idempotencyMethod', (select request_method from public.api_idempotency_keys where idempotency_key = ${sqlString(idempotencyKey)} limit 1)
)::text;
`), 'blocked_approved_snapshot_route_readback_parse_failed')

  if (routeReadback.approvedSnapshotCount !== 1) fail('blocked_approved_snapshot_route_readback_failed', 'approved snapshot count mismatch')
  if (routeReadback.idempotencyKeyCount !== 1) fail('blocked_approved_snapshot_route_readback_failed', 'idempotency key count mismatch')
  for (const key of ['workspaceIdMatches', 'projectIdMatches', 'editPlanIdMatches', 'editPlanVersionIdMatches', 'creditEstimateIdMatches', 'creditApprovalIdMatches', 'creditReservationIdMatches', 'approvedByUserIdMatches', 'idempotencyUserMatches', 'idempotencyWorkspaceMatches']) {
    if (routeReadback[key] !== true) fail('blocked_approved_snapshot_route_readback_failed', `${key} was not true`)
  }
  if (routeReadback.snapshotStatus !== 'approved') fail('blocked_approved_snapshot_route_readback_failed', 'snapshot status mismatch')
  if (routeReadback.status !== 'validation_ephemeral') fail('blocked_approved_snapshot_route_readback_failed', 'validation cleanup status mismatch')
  if (routeReadback.immutable !== false) fail('blocked_approved_snapshot_route_readback_failed', 'validation cleanup immutable flag mismatch')
  if (routeReadback.validationRunId !== runId) fail('blocked_approved_snapshot_route_readback_failed', 'validation run id mismatch')
  if (routeReadback.idempotencyMethod !== 'POST') fail('blocked_approved_snapshot_route_readback_failed', 'idempotency method mismatch')

  cleanupFixture()
  for (const [key, value] of Object.entries(cleanupResidueReadback)) {
    if (value !== 0) fail('blocked_approved_snapshot_route_fixture_cleanup_residue_detected', `${key} residue count was ${value}`)
  }

  const routeSummary = {
    method: 'POST',
    path: '/v1/edit-plans/:editPlanId/approved-snapshots',
    requestPath: routePath,
    httpStatus: response.status,
    ok: routeBody.ok,
    approvedSnapshotIdHash: sha256(snapshotId),
    workspaceIdHash: sha256(ids.workspaceId),
    projectIdHash: sha256(ids.projectId),
    editPlanIdHash: sha256(ids.editPlanId),
    editPlanVersionIdHash: sha256(ids.editPlanVersionId),
    creditEstimateIdHash: sha256(ids.creditEstimateId),
    creditApprovalIdHash: sha256(ids.creditApprovalId),
    creditReservationIdHash: sha256(ids.creditReservationId),
    snapshotStatus: routeReadback.snapshotStatus,
    validationCleanupStatus: routeReadback.status,
    validationCleanupImmutable: routeReadback.immutable,
    idempotencyMethod: routeReadback.idempotencyMethod,
    warnings: routeBody.warnings ?? [],
  }

  const setupArtifact = writeArtifact('route-fixture-setup-readback.json', JSON.stringify(setupReadback, null, 2))
  const routeArtifact = writeArtifact('approved-snapshot-route-write-readback.json', JSON.stringify(routeSummary, null, 2))
  const dbReadbackArtifact = writeArtifact('approved-snapshot-route-db-readback.json', JSON.stringify(routeReadback, null, 2))
  const cleanupArtifact = writeArtifact('route-fixture-cleanup-residue-readback.json', JSON.stringify(cleanupResidueReadback, null, 2))

  const report = {
    packet,
    decision: 'completed_approved_snapshot_route_write_runtime_validation',
    execution: 'completed_guarded_in_process_approved_snapshot_route_write_readback_and_cleanup',
    target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
    runId,
    outputDir,
    setupReadback,
    routeReadback: routeSummary,
    databaseReadback: routeReadback,
    cleanupResidueReadback,
    idempotencyKeyHash: sha256(idempotencyKey),
    actorUserIdHash: sha256(actorUserId),
    fixtureIdsHash: sha256(JSON.stringify(ids)),
    routeAuthMode: 'uuid_validation_auth_context_for_guarded_in_process_route_harness_only',
    routeRuntime: {
      appFactory: 'createReeditProApiApp',
      routeMiddleware: ['requestIdMiddleware', 'requireAuth', 'requireIdempotency', 'errorHandlerMiddleware'],
      serviceFactory: 'createApprovedSnapshotService',
      adminClient: 'supabase_service_role_client_from_ephemeral_process_env',
      publicClientRequired: false,
      routeWriteExecution: 'guarded_in_process_approved_snapshot_create_route_only',
      validationOnlyEphemeralSnapshotCleanup: true,
      immutableSnapshotBehaviorSource: 'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1',
    },
    safety: safety(true),
    readiness: {
      approvedSnapshotRouteWriteRuntimeValidation: 'completed_approved_snapshot_route_write_runtime_validation',
      serviceRoleRouteRuntimeValidation: 'completed_service_role_storage_object_metadata_read_route_runtime_validation',
      remotionPrivatePreviewExport: 'blocked_pending_render_worker_runtime_validation',
      providerModelCalls: 'blocked_pending_provider_owner_runtime_approval',
      externalProductBeta: 'blocked_pending_remaining_runtime_gates_after_approved_snapshot_route_write_validation',
    },
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: 'RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1',
  }
  const reportArtifact = writeArtifact('validation-report.json', JSON.stringify(report, null, 2))
  const manifestPath = path.join(outputDir, 'artifact-manifest.json')
  const manifest = {
    packet,
    runId,
    outputDir,
    artifacts: [setupArtifact, routeArtifact, dbReadbackArtifact, cleanupArtifact, reportArtifact],
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  const manifestSha = sha256(fs.readFileSync(manifestPath))

  console.log(`${packet} completed`)
  console.log(`Decision: ${report.decision}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Output directory: ${outputDir}`)
  console.log(`Report sha256: ${reportArtifact.sha256}`)
  console.log(`Manifest sha256: ${manifestSha}`)
}

main().catch((error) => {
  fail('blocked_approved_snapshot_route_write_runtime_validation_failed', error.stderr?.toString() || error.message)
})
