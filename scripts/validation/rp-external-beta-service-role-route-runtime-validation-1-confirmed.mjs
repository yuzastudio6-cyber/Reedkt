#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1'
const confirmVar = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_SERVICE_ROLE_ROUTE_RUNTIME_VALIDATION'
const dbUrlVar = 'REEDITPRO_STAGING_SUPABASE_DB_URL'
const supabaseUrlVar = 'REEDITPRO_STAGING_SUPABASE_URL'
const serviceRoleKeyVar = 'REEDITPRO_STAGING_SUPABASE_SERVICE_ROLE_KEY'
const targetRef = 'wmyyttnynmteqgcdishd'
const bucket = 'previews'
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-service-role-route-runtime-validation-1'

const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex')
const outputDir = path.join(baseOutputDir, runId)
const ids = Object.fromEntries([
  'workspaceId',
  'projectId',
  'storageObjectRecordId',
].map((key) => [key, crypto.randomUUID()]))
const objectPath = `workspace/${ids.workspaceId}/project/${ids.projectId}/external-beta-route-validation/${runId}/canonical-storage-metadata.json`
const slug = `rp-extbeta-route-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60)
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

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
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
    remoteSupabaseMutation: completed ? 'guarded_generated_route_metadata_fixture_created_read_deleted_with_residue_zero' : false,
    sqlExecution: completed ? 'guarded_generated_route_fixture_setup_cleanup_and_residue_readback_sql' : false,
    sqlMutation: completed ? 'guarded_generated_route_fixture_setup_and_cleanup_only' : false,
    persistentRowsCreated: false,
    migrationApply: false,
    serviceRoleRouteExecution: completed ? 'guarded_in_process_storage_object_metadata_read_route_only' : false,
    routeExecution: completed ? 'guarded_in_process_get_storage_object_metadata_route_only' : false,
    routeWriteExecution: false,
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
    creditReservationCreation: false,
    persistentCreditReservationCreation: false,
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
  'storageObjectRecords', (select count(*) from public.storage_object_records where id = ${sqlString(ids.storageObjectRecordId)}::uuid or object_path = ${sqlString(objectPath)})
)::text;
`), 'blocked_route_fixture_cleanup_residue_parse_failed')
}

function cleanupFixture() {
  if (!setupCommitted || !dbUrl) return
  psql(`
begin;
set local role service_role;
delete from public.storage_object_records where id = ${sqlString(ids.storageObjectRecordId)}::uuid or object_path = ${sqlString(objectPath)};
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
    execution: 'blocked_before_or_during_guarded_service_role_route_runtime_validation',
    target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
    runId,
    blocker,
    detail,
    route: { method: 'GET', path: '/v1/storage-objects/:storageObjectRecordId', executed: false },
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
  if (process.env[confirmVar] !== 'true') fail('blocked_pending_external_beta_service_role_route_runtime_validation_confirmation', `${confirmVar} must be true.`)
  dbUrl = process.env[dbUrlVar] ?? ''
  const supabaseUrl = process.env[supabaseUrlVar] ?? ''
  const serviceRoleKey = process.env[serviceRoleKeyVar] ?? ''
  if (!dbUrl) fail('blocked_missing_reeditpro_staging_supabase_db_url', `${dbUrlVar} is required.`)
  if (!supabaseUrl) fail('blocked_missing_reeditpro_staging_supabase_url', `${supabaseUrlVar} is required.`)
  if (!serviceRoleKey) fail('blocked_missing_reeditpro_staging_supabase_service_role_key', `${serviceRoleKeyVar} is required.`)
  if (!dbUrl.includes(targetRef)) fail('blocked_supabase_db_url_target_mismatch', `${dbUrlVar} must reference ${targetRef}.`)
  if (!supabaseUrl.includes(targetRef)) fail('blocked_supabase_url_target_mismatch', `${supabaseUrlVar} must reference ${targetRef}.`)

  let actorProfileId = ''
  try {
    actorProfileId = psql('select id::text from public.user_profiles order by created_at nulls last, id limit 1;').trim()
  } catch (error) {
    fail('blocked_user_profile_readback_failed', error.stderr?.toString() || error.message)
  }
  if (!/^[0-9a-f-]{36}$/i.test(actorProfileId)) fail('blocked_no_existing_user_profile_for_generated_route_fixture_fk', 'No existing public.user_profiles id was available for FK-safe validation.')

  const payloadSha = sha256(JSON.stringify({ packet, runId, route: 'storage_object_metadata_read' }))
  const setupReadback = parseJsonOutput(psql(`
begin;
set local role service_role;

with workspace_row as (
  insert into public.workspaces (id, owner_user_id, owner_id, name, slug, metadata)
  values (${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorProfileId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'RP external beta route validation', ${sqlString(slug)}, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true))
  returning id
), member_row as (
  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  select id, ${sqlString(actorProfileId)}::uuid, 'owner', now() from workspace_row returning id
), project_row as (
  insert into public.projects (id, workspace_id, created_by, owner_id, title, description, status, metadata)
  select ${sqlString(ids.projectId)}::uuid, id, ${sqlString(actorProfileId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'RP external beta route validation project', 'Generated metadata fixture for guarded service-role route readback.', 'draft', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true) from workspace_row
  returning id
), storage_object_row as (
  insert into public.storage_object_records (id, workspace_id, project_id, bucket_name, object_path, object_purpose, mime_type, size_bytes, checksum_sha256, region, status)
  values (${sqlString(ids.storageObjectRecordId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(bucket)}, ${sqlString(objectPath)}, 'preview_render', 'application/json', 128, ${sqlString(payloadSha)}, 'us-east1', 'ready')
  returning id, bucket_name, object_path, object_purpose, status, checksum_sha256
)
select jsonb_build_object(
  'workspaceInserted', (select count(*) from workspace_row),
  'workspaceMemberInserted', (select count(*) from member_row),
  'projectInserted', (select count(*) from project_row),
  'storageObjectRecordInserted', (select count(*) from storage_object_row),
  'storageObjectId', (select id::text from storage_object_row),
  'storageObjectBucket', (select bucket_name from storage_object_row),
  'storageObjectPath', (select object_path from storage_object_row),
  'storageObjectPurpose', (select object_purpose from storage_object_row),
  'storageObjectStatus', (select status from storage_object_row),
  'storageObjectChecksumSha256', (select checksum_sha256 from storage_object_row)
)::text;

commit;
`), 'blocked_route_fixture_setup_parse_failed')
  setupCommitted = true
  for (const key of ['workspaceInserted', 'workspaceMemberInserted', 'projectInserted', 'storageObjectRecordInserted']) {
    if (setupReadback[key] !== 1) fail('blocked_route_fixture_setup_failed', `${key} expected 1, got ${setupReadback[key]}`)
  }

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

  const routePath = `/v1/storage-objects/${ids.storageObjectRecordId}?workspaceId=${ids.workspaceId}`
  const routeUrl = `http://127.0.0.1:${address.port}${routePath}`
  const response = await fetch(routeUrl, { method: 'GET', headers: { accept: 'application/json' } })
  const routeBodyText = await response.text()
  let routeBody
  try {
    routeBody = JSON.parse(routeBodyText)
  } catch (error) {
    fail('blocked_service_role_route_response_parse_failed', error.message)
  }
  if (response.status !== 200 || routeBody?.ok !== true) {
    fail('blocked_service_role_storage_object_read_route_failed', `Route status ${response.status}; body ${routeBodyText.slice(0, 500)}`)
  }

  const routeRecord = routeBody.data?.storageObjectRecord
  if (routeBody.data?.canonicalOnly !== true) fail('blocked_service_role_route_canonical_only_flag_missing', 'Route did not return canonicalOnly true.')
  if (routeRecord?.id !== ids.storageObjectRecordId) fail('blocked_service_role_route_storage_object_id_mismatch', 'Route storage object id mismatch.')
  if (routeRecord?.workspaceId !== ids.workspaceId) fail('blocked_service_role_route_workspace_id_mismatch', 'Route workspace id mismatch.')
  if (routeRecord?.projectId !== ids.projectId) fail('blocked_service_role_route_project_id_mismatch', 'Route project id mismatch.')
  if (routeRecord?.bucketName !== bucket) fail('blocked_service_role_route_bucket_mismatch', 'Route bucket mismatch.')
  if (routeRecord?.objectPath !== objectPath) fail('blocked_service_role_route_object_path_mismatch', 'Route object path mismatch.')
  if (routeRecord?.objectPurpose !== 'preview') fail('blocked_service_role_route_object_purpose_mismatch', 'Route object purpose mismatch.')
  if (routeRecord?.status !== 'ready') fail('blocked_service_role_route_object_status_mismatch', 'Route object status mismatch.')
  if (routeRecord?.checksumSha256 !== payloadSha) fail('blocked_service_role_route_checksum_mismatch', 'Route checksum mismatch.')
  if (routeBodyText.includes('signedUrl') || routeBodyText.includes('downloadUrl')) fail('blocked_unexpected_signed_url_route_response_field', 'Route response contained a signed/download URL field.')

  await new Promise((resolve) => routeServer.close(resolve))
  routeServer = undefined

  cleanupFixture()
  for (const [key, value] of Object.entries(cleanupResidueReadback)) {
    if (value !== 0) fail('blocked_route_fixture_cleanup_residue_detected', `${key} residue count was ${value}`)
  }

  const routeReadback = {
    method: 'GET',
    path: '/v1/storage-objects/:storageObjectRecordId',
    requestPath: routePath,
    httpStatus: response.status,
    ok: routeBody.ok,
    canonicalOnly: routeBody.data.canonicalOnly,
    storageObjectRecordId: routeRecord.id,
    workspaceIdHash: sha256(routeRecord.workspaceId),
    projectIdHash: sha256(routeRecord.projectId),
    bucketName: routeRecord.bucketName,
    objectPathHash: sha256(routeRecord.objectPath),
    objectPurpose: routeRecord.objectPurpose,
    databaseObjectPurpose: setupReadback.storageObjectPurpose,
    status: routeRecord.status,
    checksumSha256: routeRecord.checksumSha256,
    warnings: routeBody.warnings ?? [],
    signedUrlReturned: false,
    publicArtifactCreated: false,
  }

  const fixtureSetupArtifact = writeArtifact('route-fixture-setup-readback.json', JSON.stringify(setupReadback, null, 2))
  const routeReadbackArtifact = writeArtifact('service-role-storage-object-read-route-readback.json', JSON.stringify(routeReadback, null, 2))
  const cleanupResidueArtifact = writeArtifact('route-fixture-cleanup-residue-readback.json', JSON.stringify(cleanupResidueReadback, null, 2))

  const report = {
    packet,
    decision: 'completed_service_role_storage_object_metadata_read_route_runtime_validation',
    execution: 'completed_guarded_in_process_service_role_storage_object_metadata_read_route_validation',
    target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
    runId,
    outputDir,
    setupReadback,
    routeReadback,
    cleanupResidueReadback,
    actorProfileIdHash: sha256(actorProfileId),
    fixtureIdsHash: sha256(JSON.stringify(ids)),
    objectPathHash: sha256(objectPath),
    routeAuthMode: 'generated_mock_auth_context_for_guarded_in_process_route_harness_only',
    routeRuntime: {
      appFactory: 'createReeditProApiApp',
      routeMiddleware: ['requestIdMiddleware', 'requireAuth', 'errorHandlerMiddleware'],
      serviceFactory: 'createUploadService',
      adminClient: 'supabase_service_role_client_from_ephemeral_process_env',
      publicClientRequired: false,
      routeWriteExecution: false,
    },
    safety: safety(true),
    readiness: {
      serviceRoleRouteRuntimeValidation: 'completed_service_role_storage_object_metadata_read_route_runtime_validation',
      serviceRoleRouteWriteValidation: 'blocked_pending_approved_snapshot_route_write_runtime_validation',
      remotionPrivatePreviewExport: 'blocked_pending_render_worker_runtime_validation',
      providerModelCalls: 'blocked_pending_provider_owner_runtime_approval',
      externalProductBeta: 'blocked_pending_remaining_runtime_gates_after_service_role_route_read_validation',
    },
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: 'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1',
  }
  const reportArtifact = writeArtifact('validation-report.json', JSON.stringify(report, null, 2))
  const manifestPath = path.join(outputDir, 'artifact-manifest.json')
  const manifest = {
    packet,
    runId,
    outputDir,
    artifacts: [fixtureSetupArtifact, routeReadbackArtifact, cleanupResidueArtifact, reportArtifact],
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
  fail('blocked_service_role_route_runtime_validation_failed', error.stderr?.toString() || error.message)
})
