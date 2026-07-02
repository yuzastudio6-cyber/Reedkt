#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-RUNTIME-VALIDATION-1'
const confirmVar = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE_RUNTIME_VALIDATION'
const dbUrlVar = 'REEDITPRO_STAGING_SUPABASE_DB_URL'
const targetRef = 'wmyyttnynmteqgcdishd'
const jobType = 'quality_check'
const payloadKind = 'gstreamer_mkvtoolnix_generated_fixture_runtime'
const workerType = 'gstreamer_mkvtoolnix_generated_fixture_worker'
const baseOutputDir =
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, 'postgresql://[redacted]')
    .replace(/(service[_-]?role[_-]?key["'\s:=]+)[A-Za-z0-9_./=-]+/gi, '$1[redacted]')
    .replace(/(database[_-]?url["'\s:=]+)postgres(?:ql)?:\/\/[^\s"']+/gi, '$1postgresql://[redacted]')
    .replace(/(password=)[^ \n\r\t]+/gi, '$1[redacted]')
}

function artifactFor(filePath) {
  const data = fs.readFileSync(filePath)
  return {
    fileName: path.basename(filePath),
    path: filePath,
    bytes: data.byteLength,
    sha256: sha256(data),
  }
}

function writeArtifact(fileName, value) {
  fs.mkdirSync(outputDir, { recursive: true })
  const filePath = path.join(outputDir, fileName)
  fs.writeFileSync(filePath, `${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`)
  return artifactFor(filePath)
}

function writeManifest(artifacts) {
  const manifestPath = path.join(outputDir, 'remote-worker-claim-lease-runtime-validation-1-manifest.json')
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        packet,
        runId,
        outputDir,
        generatedAt: new Date().toISOString(),
        artifacts,
      },
      null,
      2,
    )}\n`,
  )
  const manifestArtifact = artifactFor(manifestPath)
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        packet,
        runId,
        outputDir,
        generatedAt: new Date().toISOString(),
        artifacts: [...artifacts, manifestArtifact],
      },
      null,
      2,
    )}\n`,
  )
  return artifactFor(manifestPath)
}

function safety(completed) {
  return {
    databaseUrlPayloadSource: 'ephemeral_process_env_only',
    databaseUrlPrinted: false,
    databaseUrlPersistedInRepo: false,
    secretManagerPayloadAccessByRunner: false,
    frontendServiceRoleCredentialExposure: false,
    remoteSupabaseMutation: completed
      ? 'guarded_transaction_rolled_back_worker_claim_lease_validation_fixture_only'
      : false,
    sqlExecution: completed ? 'guarded_transaction_rolled_back_worker_claim_lease_validation_sql' : false,
    sqlMutation: completed ? 'guarded_transaction_rolled_back_worker_claim_lease_fixture_only' : false,
    migrationApply: false,
    persistentRowsCreated: false,
    routeExecution: false,
    serviceRoleRouteExecution: false,
    jobEnqueue: completed ? 'transaction_rolled_back_generated_quality_check_job_fixture_only' : false,
    persistentJobEnqueue: false,
    workerLeaseClaim: completed ? 'transaction_rolled_back_generated_worker_job_claim_only' : false,
    persistentWorkerLeaseClaim: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    ffmpegFfprobeExecution: false,
    dockerExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    providerCall: false,
    modelCall: false,
    finalRenderExport: false,
    externalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
  }
}

function finish(report, exitCode) {
  const reportArtifact = writeArtifact('remote-worker-claim-lease-runtime-validation-1-report.json', report)
  const manifestArtifact = writeManifest(report.artifacts ? [reportArtifact, ...report.artifacts] : [reportArtifact])
  console.log(`${packet} result: ${report.decision}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Output directory: ${outputDir}`)
  console.log(`Report: ${reportArtifact.path}`)
  console.log(`Manifest: ${manifestArtifact.path}`)
  process.exit(exitCode)
}

function fail(blocker, detail) {
  finish(
    {
      packet,
      decision: blocker,
      execution: 'blocked_before_or_during_guarded_remote_worker_claim_lease_runtime_validation',
      blocker,
      detail: sanitize(detail),
      target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
      runId,
      outputDir,
      jobType,
      payloadKind,
      workerType,
      safety: safety(false),
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
      productReadyEndToEndLocalOssTools: 0,
    },
    1,
  )
}

function psql(dbUrl, sql) {
  try {
    return execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-A', '-t', '-c', sql], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120000,
    })
  } catch (error) {
    const stderr = error.stderr?.toString() || error.message
    throw new Error(sanitize(stderr))
  }
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function parseJsonOutput(output, blocker) {
  const jsonLine = output
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('{') && line.endsWith('}'))
  if (!jsonLine) fail(blocker, 'No JSON output was returned from psql.')
  try {
    return JSON.parse(jsonLine)
  } catch (error) {
    fail(blocker, error.message)
  }
}

if (process.env[confirmVar] !== 'true') {
  fail('blocked_pending_gstreamer_mkvtoolnix_remote_worker_claim_lease_runtime_validation_confirmation', `${confirmVar}=true is required.`)
}

const dbUrl = process.env[dbUrlVar]
if (!dbUrl) fail('blocked_missing_reeditpro_staging_supabase_db_url', `${dbUrlVar} is required.`)
if (!dbUrl.includes(targetRef)) {
  fail('blocked_supabase_db_url_target_mismatch', `${dbUrlVar} must point at the approved ${targetRef} staging project.`)
}

let actorProfileId = ''
try {
  actorProfileId = psql(dbUrl, 'select id::text from public.user_profiles order by created_at nulls last, id limit 1;').trim()
} catch (error) {
  fail('blocked_worker_claim_schema_compatibility_failed', error.message)
}
if (!/^[0-9a-f-]{36}$/i.test(actorProfileId)) {
  fail('blocked_no_existing_user_profile_for_generated_fixture_fk', 'No existing public.user_profiles id was available for FK-safe rollback validation.')
}

const ids = Object.fromEntries(
  [
    'workspaceId',
    'projectId',
    'jobBatchId',
    'jobId',
    'workerClaimId',
    'approvedSnapshotId',
    'approvalRecordId',
  ].map((key) => [key, crypto.randomUUID()]),
)
const slug = `rp-gst-mkv-claim-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60)
const idempotencyBase = `rp-extbeta-gst-mkv-claim:${runId}`
const workerInstanceId = `rp-extbeta-gst-mkv-worker-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 80)

const validationSql = `
begin;
set local role service_role;

create temp table rp_gst_mkv_claim_validation_readback (
  key text primary key,
  value jsonb not null
) on commit drop;

insert into public.workspaces (id, owner_user_id, name, slug, metadata)
values (
  ${sqlString(ids.workspaceId)}::uuid,
  ${sqlString(actorProfileId)}::uuid,
  'RP external beta GStreamer MKVToolNix claim validation',
  ${sqlString(slug)},
  jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true)
);

insert into public.workspace_members (workspace_id, user_id, role, joined_at)
values (${sqlString(ids.workspaceId)}::uuid, ${sqlString(actorProfileId)}::uuid, 'owner', now());

insert into public.projects (id, workspace_id, created_by, title, description, status, metadata)
values (
  ${sqlString(ids.projectId)}::uuid,
  ${sqlString(ids.workspaceId)}::uuid,
  ${sqlString(actorProfileId)}::uuid,
  'RP external beta GStreamer MKVToolNix claim validation project',
  'Generated validation fixture; transaction rolled back.',
  'draft',
  jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true)
);

insert into public.job_batches (
  id,
  workspace_id,
  project_id,
  status,
  batch_name,
  batch_purpose,
  current_stage,
  progress_percent,
  priority,
  created_by_user_id,
  created_by_agent,
  idempotency_key,
  input_payload,
  metadata
)
values (
  ${sqlString(ids.jobBatchId)}::uuid,
  ${sqlString(ids.workspaceId)}::uuid,
  ${sqlString(ids.projectId)}::uuid,
  'queued',
  'RP external beta GStreamer MKVToolNix claim validation batch',
  'remote_worker_claim_lease_runtime_validation',
  'queued',
  0,
  'normal',
  ${sqlString(actorProfileId)}::uuid,
  'codex_validation_runner',
  ${sqlString(`${idempotencyBase}:batch`)},
  jsonb_build_object(
    'sourcePacket', ${sqlString(packet)},
    'validationRunId', ${sqlString(runId)},
    'approvedSnapshotId', ${sqlString(ids.approvedSnapshotId)},
    'workerExecution', false
  ),
  jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true)
);

insert into public.jobs (
  id,
  job_batch_id,
  workspace_id,
  project_id,
  job_type,
  status,
  priority,
  worker_target,
  runtime_type,
  job_name,
  job_description,
  input_payload,
  metadata,
  idempotency_key
)
values (
  ${sqlString(ids.jobId)}::uuid,
  ${sqlString(ids.jobBatchId)}::uuid,
  ${sqlString(ids.workspaceId)}::uuid,
  ${sqlString(ids.projectId)}::uuid,
  ${sqlString(jobType)},
  'queued',
  'normal',
  'render_worker',
  'cloud_run_job',
  'GStreamer MKVToolNix generated fixture runtime claim validation',
  'Generated quality_check job fixture; no worker dispatch, worker execution, media processing, or tool execution.',
  jsonb_build_object(
    'sourcePacket', ${sqlString(packet)},
    'validationRunId', ${sqlString(runId)},
    'approvedSnapshotId', ${sqlString(ids.approvedSnapshotId)},
    'approvalRecordId', ${sqlString(ids.approvalRecordId)},
    'persistedJobPayloadKind', ${sqlString(payloadKind)},
    'workerType', ${sqlString(workerType)},
    'workerExecution', false,
    'gstreamerExecution', false,
    'mkvtoolnixExecution', false,
    'mediaProcessing', false
  ),
  jsonb_build_object('sourcePacket', ${sqlString(packet)}, 'validationRunId', ${sqlString(runId)}, 'generatedFixture', true),
  ${sqlString(`${idempotencyBase}:job`)}
);

insert into rp_gst_mkv_claim_validation_readback (key, value)
values (
  'preClaim',
  jsonb_build_object(
    'canRunBefore', public.can_run_job(${sqlString(ids.jobId)}::uuid),
    'canClaimBefore', public.can_claim_worker_job(${sqlString(ids.jobId)}::uuid),
    'activeClaimBefore', public.active_worker_claim_exists(${sqlString(ids.jobId)}::uuid)
  )
);

insert into public.worker_job_claims (
  id,
  workspace_id,
  project_id,
  job_id,
  worker_type,
  worker_instance_id,
  lease_expires_at,
  idempotency_key
)
values (
  ${sqlString(ids.workerClaimId)}::uuid,
  ${sqlString(ids.workspaceId)}::uuid,
  ${sqlString(ids.projectId)}::uuid,
  ${sqlString(ids.jobId)}::uuid,
  ${sqlString(workerType)},
  ${sqlString(workerInstanceId)},
  now() + interval '5 minutes',
  ${sqlString(`${idempotencyBase}:claim`)}
);

insert into rp_gst_mkv_claim_validation_readback (key, value)
values (
  'postClaim',
  jsonb_build_object(
    'activeClaimAfter', public.active_worker_claim_exists(${sqlString(ids.jobId)}::uuid),
    'canClaimAfter', public.can_claim_worker_job(${sqlString(ids.jobId)}::uuid)
  )
);

select jsonb_build_object(
  'workspaceInserted', (select count(*) from public.workspaces where id = ${sqlString(ids.workspaceId)}::uuid),
  'workspaceMemberInserted', (select count(*) from public.workspace_members where workspace_id = ${sqlString(ids.workspaceId)}::uuid and user_id = ${sqlString(actorProfileId)}::uuid),
  'projectInserted', (select count(*) from public.projects where id = ${sqlString(ids.projectId)}::uuid),
  'jobBatchInserted', (select count(*) from public.job_batches where id = ${sqlString(ids.jobBatchId)}::uuid),
  'jobInserted', (select count(*) from public.jobs where id = ${sqlString(ids.jobId)}::uuid),
  'workerClaimInserted', (select count(*) from public.worker_job_claims where id = ${sqlString(ids.workerClaimId)}::uuid),
  'jobBatchStatus', (select status::text from public.job_batches where id = ${sqlString(ids.jobBatchId)}::uuid),
  'jobStatus', (select status::text from public.jobs where id = ${sqlString(ids.jobId)}::uuid),
  'jobType', (select job_type::text from public.jobs where id = ${sqlString(ids.jobId)}::uuid),
  'workerTarget', (select worker_target::text from public.jobs where id = ${sqlString(ids.jobId)}::uuid),
  'runtimeType', (select runtime_type::text from public.jobs where id = ${sqlString(ids.jobId)}::uuid),
  'workerClaimStatus', (select claim_status from public.worker_job_claims where id = ${sqlString(ids.workerClaimId)}::uuid),
  'workerClaimType', (select worker_type from public.worker_job_claims where id = ${sqlString(ids.workerClaimId)}::uuid),
  'canRunBefore', ((select value from rp_gst_mkv_claim_validation_readback where key = 'preClaim')->>'canRunBefore')::boolean,
  'canClaimBefore', ((select value from rp_gst_mkv_claim_validation_readback where key = 'preClaim')->>'canClaimBefore')::boolean,
  'activeClaimBefore', ((select value from rp_gst_mkv_claim_validation_readback where key = 'preClaim')->>'activeClaimBefore')::boolean,
  'activeClaimAfter', ((select value from rp_gst_mkv_claim_validation_readback where key = 'postClaim')->>'activeClaimAfter')::boolean,
  'canClaimAfter', ((select value from rp_gst_mkv_claim_validation_readback where key = 'postClaim')->>'canClaimAfter')::boolean
)::text;

rollback;
`

let readback
try {
  readback = parseJsonOutput(
    psql(dbUrl, validationSql),
    'blocked_worker_claim_runtime_validation_readback_parse_failed',
  )
} catch (error) {
  fail('blocked_worker_claim_runtime_validation_failed', error.message)
}

for (const [key, value] of Object.entries(readback)) {
  if (key.endsWith('Inserted') && value !== 1) {
    fail('blocked_worker_claim_runtime_validation_failed', `${key} expected 1 and observed ${value}.`)
  }
}
if (readback.jobBatchStatus !== 'queued') fail('blocked_worker_claim_runtime_validation_failed', 'Job batch status mismatch.')
if (readback.jobStatus !== 'queued') fail('blocked_worker_claim_runtime_validation_failed', 'Job status mismatch.')
if (readback.jobType !== jobType) fail('blocked_worker_claim_schema_compatibility_failed', 'Persisted job type mismatch.')
if (readback.workerTarget !== 'render_worker') fail('blocked_worker_claim_runtime_validation_failed', 'Worker target mismatch.')
if (readback.runtimeType !== 'cloud_run_job') fail('blocked_worker_claim_runtime_validation_failed', 'Runtime type mismatch.')
if (readback.workerClaimStatus !== 'active') fail('blocked_worker_claim_runtime_validation_failed', 'Worker claim status mismatch.')
if (readback.workerClaimType !== workerType) fail('blocked_worker_claim_runtime_validation_failed', 'Worker claim type mismatch.')
if (readback.canRunBefore !== true) fail('blocked_worker_claim_schema_compatibility_failed', 'can_run_job was not true before claim.')
if (readback.canClaimBefore !== true) fail('blocked_worker_claim_schema_compatibility_failed', 'can_claim_worker_job was not true before claim.')
if (readback.activeClaimBefore !== false) fail('blocked_worker_claim_runtime_validation_failed', 'active_worker_claim_exists was not false before claim.')
if (readback.activeClaimAfter !== true) fail('blocked_worker_claim_runtime_validation_failed', 'active_worker_claim_exists was not true after claim.')
if (readback.canClaimAfter !== false) fail('blocked_worker_claim_runtime_validation_failed', 'can_claim_worker_job was not false after claim.')

const residueSql = `
select jsonb_build_object(
  'workspaces', (select count(*) from public.workspaces where metadata->>'validationRunId' = ${sqlString(runId)}),
  'projects', (select count(*) from public.projects where metadata->>'validationRunId' = ${sqlString(runId)}),
  'jobBatches', (select count(*) from public.job_batches where metadata->>'validationRunId' = ${sqlString(runId)}),
  'jobs', (select count(*) from public.jobs where metadata->>'validationRunId' = ${sqlString(runId)}),
  'workerJobClaims', (select count(*) from public.worker_job_claims where id = ${sqlString(ids.workerClaimId)}::uuid)
)::text;
`

let residue
try {
  residue = parseJsonOutput(psql(dbUrl, residueSql), 'blocked_worker_claim_residue_readback_parse_failed')
} catch (error) {
  fail('blocked_worker_claim_residue_readback_failed', error.message)
}
for (const [key, value] of Object.entries(residue)) {
  if (value !== 0) fail('blocked_worker_claim_residue_detected', `${key} residue count was ${value}.`)
}

const readbackArtifact = writeArtifact('worker-claim-lease-readback.json', readback)
const residueArtifact = writeArtifact('rollback-residue-readback.json', residue)
const report = {
  packet,
  decision: 'completed_gstreamer_mkvtoolnix_remote_worker_claim_lease_runtime_validation',
  execution: 'completed_guarded_transaction_rolled_back_remote_worker_claim_lease_validation',
  target: { projectName: 'Reeditpro', projectRef: targetRef, class: 'staging' },
  runId,
  outputDir,
  jobType,
  payloadKind,
  schemaCompatibility: 'db_job_type_uses_public_job_type_enum_payload_kind_preserves_gstreamer_mkvtoolnix_runtime_identity',
  workerType,
  readback,
  rollbackResidueReadback: residue,
  actorProfileIdHash: sha256(actorProfileId),
  idempotencyKeyHash: sha256(idempotencyBase),
  workerInstanceIdHash: sha256(workerInstanceId),
  safety: safety(true),
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-SOURCE-GATE-1',
  artifacts: [readbackArtifact, residueArtifact],
}
finish(report, 0)
