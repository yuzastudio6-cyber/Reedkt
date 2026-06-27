#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const packet = 'RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1'
const confirmVar = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_PRIVATE_ARTIFACT_STORAGE_ACCESS_REMOTE_WRITE'
const dbUrlVar = 'REEDITPRO_STAGING_SUPABASE_DB_URL'
const supabaseUrlVar = 'REEDITPRO_STAGING_SUPABASE_URL'
const serviceRoleKeyVar = 'REEDITPRO_STAGING_SUPABASE_SERVICE_ROLE_KEY'
const targetRef = 'wmyyttnynmteqgcdishd'
const bucket = 'previews'
const requiredPrivateBuckets = [
  'source-media',
  'generated-assets',
  'processed-media',
  'previews',
  'exports',
  'thumbnails',
  'qa-artifacts',
  'worker-temp',
]
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-private-artifact-storage-access-guarded-remote-write-1'

const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex')
const outputDir = path.join(baseOutputDir, runId)
const objectPath = `workspace/${crypto.randomUUID()}/project/${crypto.randomUUID()}/external-beta-validation/${runId}/private-preview-manifest.json`

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
    supabaseUrlPayloadSource: 'ephemeral_process_env_only',
    supabaseUrlPrinted: false,
    supabaseUrlPersistedInRepo: false,
    serviceRoleSecretPayloadAccess: completed ? 'guarded_ephemeral_storage_service_role_key_payload_only' : false,
    serviceRoleSecretPayloadPrinted: false,
    serviceRoleSecretPayloadPersistedInRepo: false,
    frontendServiceRoleCredentialExposure: false,
    remoteSupabaseMutation: completed ? 'guarded_generated_private_storage_object_fixture_and_transaction_rolled_back_artifact_metadata_fixture_only' : false,
    sqlExecution: completed ? 'guarded_readback_and_transaction_rolled_back_generated_private_artifact_metadata_fixture_sql' : false,
    sqlMutation: completed ? 'guarded_transaction_rolled_back_generated_private_artifact_metadata_fixture_only' : false,
    persistentRowsCreated: false,
    migrationApply: false,
    serviceRoleRouteExecution: false,
    routeExecution: false,
    workerExecution: false,
    workerDispatch: false,
    persistentWorkerLeaseClaim: false,
    storageObjectCreation: completed ? 'guarded_generated_private_storage_json_fixture_created_then_deleted' : false,
    storageObjectRead: completed ? 'guarded_generated_private_storage_json_fixture_readback_only' : false,
    storageObjectDelete: completed ? 'guarded_generated_private_storage_json_fixture_cleanup' : false,
    storageObjectResidueCount: completed ? 0 : null,
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

function fail(blocker, detail) {
  const report = {
    packet,
    decision: blocker,
    execution: 'blocked_before_or_during_guarded_private_artifact_storage_access_validation',
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

function parseJsonOutput(output, blocker) {
  const jsonLine = output.split('\n').map((line) => line.trim()).find((line) => line.startsWith('{') && line.endsWith('}'))
  if (!jsonLine) fail(blocker, 'Could not locate JSON output.')
  try {
    return JSON.parse(jsonLine)
  } catch (error) {
    fail(blocker, error.message)
  }
}

if (process.env[confirmVar] !== 'true') fail('blocked_pending_external_beta_private_artifact_storage_access_remote_write_confirmation', `${confirmVar} must be true.`)
const dbUrl = process.env[dbUrlVar]
const supabaseUrl = process.env[supabaseUrlVar]
const serviceRoleKey = process.env[serviceRoleKeyVar]
if (!dbUrl) fail('blocked_missing_reeditpro_staging_supabase_db_url', `${dbUrlVar} is required.`)
if (!supabaseUrl) fail('blocked_missing_reeditpro_staging_supabase_url', `${supabaseUrlVar} is required.`)
if (!serviceRoleKey) fail('blocked_missing_reeditpro_staging_supabase_service_role_key', `${serviceRoleKeyVar} is required.`)
if (!supabaseUrl.includes(targetRef)) fail('blocked_supabase_url_target_mismatch', `${supabaseUrlVar} must reference ${targetRef}.`)

let actorProfileId = ''
try {
  actorProfileId = psql(dbUrl, 'select id::text from public.user_profiles order by created_at nulls last, id limit 1;').trim()
} catch (error) {
  fail('blocked_user_profile_readback_failed', error.stderr?.toString() || error.message)
}
if (!/^[0-9a-f-]{36}$/i.test(actorProfileId)) fail('blocked_no_existing_user_profile_for_generated_fixture_fk', 'No existing public.user_profiles id was available for FK-safe validation.')

let bucketReadback
try {
  bucketReadback = parseJsonOutput(psql(dbUrl, `
select jsonb_build_object(
  'expectedBucketCount', ${requiredPrivateBuckets.length},
  'presentPrivateBucketCount', (
    select count(*) from storage.buckets
    where id = any(array[${requiredPrivateBuckets.map(sqlString).join(', ')}]::text[])
      and public is false
  ),
  'publicExpectedBucketCount', (
    select count(*) from storage.buckets
    where id = any(array[${requiredPrivateBuckets.map(sqlString).join(', ')}]::text[])
      and public is true
  ),
  'missingPrivateBuckets', (
    select coalesce(jsonb_agg(bucket_id), '[]'::jsonb)
    from (
      select unnest(array[${requiredPrivateBuckets.map(sqlString).join(', ')}]::text[]) as bucket_id
      except
      select id from storage.buckets where public is false
    ) missing
  ),
  'anonStorageObjectPolicyCount', (
    select count(*) from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and exists (
        select 1 from unnest(roles) role_name
        where role_name::text in ('anon', 'public')
      )
  )
)::text;
`), 'blocked_private_bucket_readback_parse_failed')
} catch (error) {
  fail('blocked_private_bucket_readback_failed', error.stderr?.toString() || error.message)
}
if (bucketReadback.presentPrivateBucketCount !== requiredPrivateBuckets.length) fail('blocked_private_bucket_readback_failed', 'Not all expected buckets are private.')
if (bucketReadback.publicExpectedBucketCount !== 0) fail('blocked_public_bucket_detected', 'At least one expected bucket is public.')
if (bucketReadback.anonStorageObjectPolicyCount !== 0) fail('blocked_anonymous_storage_policy_detected', 'Anonymous storage object policy was detected.')

const storageClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'x-reeditpro-validation-packet': packet } },
})

const storagePayload = JSON.stringify({
  packet,
  runId,
  generatedFixture: true,
  objectPurpose: 'preview_render',
  mediaProcessing: false,
  previewRenderExecution: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  createdAt: new Date().toISOString(),
}, null, 2)
const storagePayloadSha = sha256(storagePayload)
const storagePayloadBytes = Buffer.byteLength(storagePayload)

let storageWriteReadback
try {
  const upload = await storageClient.storage.from(bucket).upload(objectPath, Buffer.from(storagePayload), {
    contentType: 'application/json',
    upsert: false,
  })
  if (upload.error) fail('blocked_private_storage_object_write_failed', upload.error.message)

  const download = await storageClient.storage.from(bucket).download(objectPath)
  if (download.error) fail('blocked_private_storage_object_readback_failed', download.error.message)
  const readbackBytes = Buffer.from(await download.data.arrayBuffer())
  const readbackSha = sha256(readbackBytes)
  if (readbackSha !== storagePayloadSha) fail('blocked_private_storage_object_checksum_mismatch', 'Downloaded private storage object checksum did not match uploaded payload.')

  const remove = await storageClient.storage.from(bucket).remove([objectPath])
  if (remove.error) fail('blocked_private_storage_object_cleanup_failed', remove.error.message)

  const postDelete = await storageClient.storage.from(bucket).download(objectPath)
  if (!postDelete.error) fail('blocked_private_storage_object_cleanup_residue_detected', 'Private storage object was still downloadable after cleanup.')

  storageWriteReadback = {
    bucket,
    objectPath,
    mimeType: 'application/json',
    sizeBytes: storagePayloadBytes,
    checksumSha256: storagePayloadSha,
    uploadCompleted: true,
    readbackCompleted: true,
    checksumMatched: true,
    cleanupCompleted: true,
    postDeleteReadbackBlocked: true,
    signedUrlCreated: false,
    publicArtifactCreated: false,
  }
} catch (error) {
  try {
    await storageClient.storage.from(bucket).remove([objectPath])
  } catch {
    // Best-effort cleanup only. Failure is reported by the original blocker.
  }
  if (error?.message?.startsWith(`${packet} failed:`)) throw error
  fail('blocked_private_storage_object_access_failed', error.message)
}

const ids = Object.fromEntries([
  'workspaceId',
  'projectId',
  'editSessionId',
  'storageObjectRecordId',
  'artifactManifestId',
  'artifactManifestItemId',
  'auditEventId',
].map((key) => [key, crypto.randomUUID()]))
const slug = `rp-extbeta-artifact-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60)

const metadataSql = `
begin;
set local role service_role;

with workspace_row as (
  insert into public.workspaces (id, owner_user_id, owner_id, name, slug, metadata)
  values (${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorProfileId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'RP external beta private artifact validation', ${sqlString(slug)}, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true))
  returning id
), member_row as (
  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  select id, ${sqlString(actorProfileId)}::uuid, 'owner', now() from workspace_row returning id
), project_row as (
  insert into public.projects (id, workspace_id, created_by, owner_id, title, description, status, metadata)
  select ${sqlString(ids.projectId)}::uuid, id, ${sqlString(actorProfileId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'RP external beta private artifact validation project', 'Generated private artifact metadata fixture; transaction rolled back.', 'draft', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true) from workspace_row
  returning id
), session_row as (
  insert into public.edit_sessions (id, project_id, workspace_id, owner_user_id, status, name, metadata_json, metadata, mock_only)
  values (${sqlString(ids.editSessionId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'draft', 'RP external beta private artifact validation session', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}), false)
  returning id
), storage_object_row as (
  insert into public.storage_object_records (id, workspace_id, project_id, bucket_name, object_path, object_purpose, mime_type, size_bytes, checksum_sha256, region, status)
  values (${sqlString(ids.storageObjectRecordId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(bucket)}, ${sqlString(objectPath)}, 'preview_render', 'application/json', ${storagePayloadBytes}, ${sqlString(storagePayloadSha)}, 'us-east1', 'ready')
  returning id, bucket_name, object_path, object_purpose, status, checksum_sha256
), artifact_manifest_row as (
  insert into public.artifact_manifests (id, project_id, edit_session_id, manifest_role, status, storage_bucket, storage_path, manifest_json, checksum_manifest_json, cleanup_policy_json, retention_policy_json, created_by_worker_id)
  values (${sqlString(ids.artifactManifestId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(ids.editSessionId)}::uuid, 'preview', 'ready', ${sqlString(bucket)}, ${sqlString(objectPath)}, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedPrivateFixture', true, 'signedUrlCreation', false, 'publicArtifactCreation', false), jsonb_build_array(jsonb_build_object('fileName', 'private-preview-manifest.json', 'sha256', ${sqlString(storagePayloadSha)}, 'bytes', ${storagePayloadBytes})), jsonb_build_object('cleanup', 'storage_object_deleted_before_metadata_transaction'), jsonb_build_object('retention', 'transaction_rolled_back'), 'codex_validation_runner')
  returning id, manifest_role, status, storage_bucket, storage_path
), artifact_manifest_item_row as (
  insert into public.artifact_manifest_items (id, artifact_manifest_id, item_role, storage_bucket, storage_path, mime_type, size_bytes, checksum_sha256, metadata_json)
  values (${sqlString(ids.artifactManifestItemId)}::uuid, ${sqlString(ids.artifactManifestId)}::uuid, 'preview', ${sqlString(bucket)}, ${sqlString(objectPath)}, 'application/json', ${storagePayloadBytes}, ${sqlString(storagePayloadSha)}, jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedPrivateFixture', true))
  returning id, item_role, storage_bucket, storage_path, checksum_sha256
), audit_row as (
  insert into public.audit_events (id, workspace_id, project_id, actor_user_id, event_type, event_json)
  values (${sqlString(ids.auditEventId)}::uuid, ${sqlString(ids.workspaceId)}::uuid, ${sqlString(ids.projectId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'external_beta.private_artifact_storage_access_validation', jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'persistentRowsCreated', false, 'storageObjectResidueCount', 0))
  returning id
)
select jsonb_build_object(
  'storageObjectRecordInserted', (select count(*) from storage_object_row),
  'artifactManifestInserted', (select count(*) from artifact_manifest_row),
  'artifactManifestItemInserted', (select count(*) from artifact_manifest_item_row),
  'auditEventInserted', (select count(*) from audit_row),
  'storageObjectBucket', (select bucket_name from storage_object_row),
  'storageObjectPath', (select object_path from storage_object_row),
  'storageObjectPurpose', (select object_purpose from storage_object_row),
  'storageObjectStatus', (select status from storage_object_row),
  'storageObjectChecksumSha256', (select checksum_sha256 from storage_object_row),
  'artifactManifestRole', (select manifest_role from artifact_manifest_row),
  'artifactManifestStatus', (select status from artifact_manifest_row),
  'artifactManifestItemRole', (select item_role from artifact_manifest_item_row),
  'artifactManifestItemChecksumSha256', (select checksum_sha256 from artifact_manifest_item_row)
)::text;

rollback;
`

let metadataReadback
try {
  metadataReadback = parseJsonOutput(psql(dbUrl, metadataSql), 'blocked_private_artifact_metadata_readback_parse_failed')
} catch (error) {
  fail('blocked_private_artifact_metadata_write_readback_failed', error.stderr?.toString() || error.message)
}

for (const key of ['storageObjectRecordInserted', 'artifactManifestInserted', 'artifactManifestItemInserted', 'auditEventInserted']) {
  if (metadataReadback[key] !== 1) fail('blocked_private_artifact_metadata_write_readback_failed', `${key} expected 1, got ${metadataReadback[key]}`)
}
if (metadataReadback.storageObjectBucket !== bucket) fail('blocked_private_artifact_metadata_bucket_mismatch', 'Storage object bucket mismatch.')
if (metadataReadback.storageObjectPath !== objectPath) fail('blocked_private_artifact_metadata_path_mismatch', 'Storage object path mismatch.')
if (metadataReadback.storageObjectPurpose !== 'preview_render') fail('blocked_private_artifact_metadata_purpose_mismatch', 'Storage object purpose mismatch.')
if (metadataReadback.storageObjectStatus !== 'ready') fail('blocked_private_artifact_metadata_status_mismatch', 'Storage object status mismatch.')
if (metadataReadback.storageObjectChecksumSha256 !== storagePayloadSha) fail('blocked_private_artifact_metadata_checksum_mismatch', 'Storage object checksum mismatch.')
if (metadataReadback.artifactManifestRole !== 'preview') fail('blocked_private_artifact_manifest_role_mismatch', 'Artifact manifest role mismatch.')
if (metadataReadback.artifactManifestStatus !== 'ready') fail('blocked_private_artifact_manifest_status_mismatch', 'Artifact manifest status mismatch.')
if (metadataReadback.artifactManifestItemRole !== 'preview') fail('blocked_private_artifact_manifest_item_role_mismatch', 'Artifact item role mismatch.')
if (metadataReadback.artifactManifestItemChecksumSha256 !== storagePayloadSha) fail('blocked_private_artifact_manifest_item_checksum_mismatch', 'Artifact item checksum mismatch.')

const residueSql = `
select jsonb_build_object(
  'storageObjectRecords', (select count(*) from public.storage_object_records where object_path = ${sqlString(objectPath)}),
  'artifactManifests', (select count(*) from public.artifact_manifests where manifest_json->>'validationRunId' = ${sqlString(runId)}),
  'artifactManifestItems', (
    select count(*) from public.artifact_manifest_items ami
    join public.artifact_manifests am on am.id = ami.artifact_manifest_id
    where am.manifest_json->>'validationRunId' = ${sqlString(runId)}
  ),
  'auditEvents', (select count(*) from public.audit_events where event_json->>'validationRunId' = ${sqlString(runId)})
)::text;
`

let metadataResidue
try {
  metadataResidue = JSON.parse(psql(dbUrl, residueSql).trim())
} catch (error) {
  fail('blocked_private_artifact_metadata_residue_readback_failed', error.stderr?.toString() || error.message)
}
for (const [key, value] of Object.entries(metadataResidue)) {
  if (value !== 0) fail('blocked_private_artifact_metadata_transaction_rollback_residue_detected', `${key} residue count was ${value}`)
}

const storageReadbackArtifact = writeArtifact('private-storage-object-write-read-delete-readback.json', JSON.stringify(storageWriteReadback, null, 2))
const bucketReadbackArtifact = writeArtifact('private-bucket-policy-readback.json', JSON.stringify(bucketReadback, null, 2))
const metadataReadbackArtifact = writeArtifact('private-artifact-metadata-write-readback.json', JSON.stringify(metadataReadback, null, 2))
const residueArtifact = writeArtifact('rollback-residue-readback.json', JSON.stringify(metadataResidue, null, 2))

const report = {
  packet,
  decision: 'completed_private_artifact_storage_access_guarded_remote_write_readback',
  execution: 'completed_guarded_generated_private_storage_object_write_read_delete_and_transaction_rolled_back_artifact_metadata_readback',
  target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
  runId,
  outputDir,
  bucketReadback,
  storageWriteReadback,
  metadataReadback,
  rollbackResidueReadback: metadataResidue,
  actorProfileIdHash: sha256(actorProfileId),
  objectPathHash: sha256(objectPath),
  safety: safety(true),
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone: 'RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1',
}
const reportArtifact = writeArtifact('validation-report.json', JSON.stringify(report, null, 2))
const manifestPath = path.join(outputDir, 'artifact-manifest.json')
const manifest = {
  packet,
  runId,
  outputDir,
  artifacts: [storageReadbackArtifact, bucketReadbackArtifact, metadataReadbackArtifact, residueArtifact, reportArtifact],
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
const manifestSha = sha256(fs.readFileSync(manifestPath))

console.log(`${packet} completed`)
console.log(`Decision: ${report.decision}`)
console.log(`Run ID: ${runId}`)
console.log(`Output directory: ${outputDir}`)
console.log(`Report sha256: ${reportArtifact.sha256}`)
console.log(`Manifest sha256: ${manifestSha}`)
