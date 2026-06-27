#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1'
const confirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE'
const project = 'reeditpro'
const region = 'us-central1'
const serviceName = 'reeditpro-qwen2-5-vl-l4-worker'
const jobName = 'reeditpro-qwen2-5-vl-private-caller'
const runId = `qwen25-adapter-runtime-fixture-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto
  .randomBytes(4)
  .toString('hex')}`
const outputDir = path.join(os.tmpdir(), 'reeditpro-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1', runId)

const serviceTempEnv = {
  QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED: 'true',
  QWEN_INFERENCE_ENABLED: 'true',
  QWEN_MODEL_IMPORT_ON_STARTUP: 'false',
  QWEN_VLLM_MAX_MODEL_LEN: '2048',
  QWEN_VLLM_MAX_NUM_BATCHED_TOKENS: '1024',
  QWEN_VLLM_MAX_NUM_SEQS: '1',
  QWEN_VLLM_GPU_MEMORY_UTILIZATION: '0.92',
  QWEN_FIXTURE_MAX_TOKENS: '180',
}

const jobTempEnvStatic = {
  QWEN_CPU_CALLER_EXECUTION_ENABLED: 'true',
  QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE: 'true',
  QWEN_CPU_CALLER_TIMEOUT_SECONDS: '900',
  QWEN_CPU_CALLER_REQUEST_ID: `${runId}-request`,
  QWEN_CPU_CALLER_APPROVED_PLAN_SNAPSHOT_ID: 'approved_snapshot_qwen_external_beta_adapter_fixture_1',
  QWEN_CPU_CALLER_APPROVED_PLAN_SNAPSHOT_HASH: 'sha256:approved-snapshot-qwen-adapter-fixture-1',
  QWEN_CPU_CALLER_APPROVAL_RECORD_ID: 'approval_record_qwen_external_beta_adapter_fixture_1',
  QWEN_CPU_CALLER_CREDIT_RESERVATION_ID: 'credit_reservation_qwen_external_beta_adapter_fixture_1',
  QWEN_CPU_CALLER_JOB_ID: 'job_qwen_external_beta_adapter_fixture_1',
  QWEN_CPU_CALLER_LEASE_ID: 'queue_lease_qwen_external_beta_adapter_fixture_1',
  QWEN_CPU_CALLER_WORKER_ID: 'worker_qwen_external_beta_adapter_fixture_1',
  QWEN_CPU_CALLER_IDEMPOTENCY_KEY: `${runId}-idempotency`,
  QWEN_CPU_CALLER_USE_CASE: 'visual_understanding',
}

const serviceRemoveEnv = [
  'QWEN_VLLM_MAX_MODEL_LEN',
  'QWEN_VLLM_MAX_NUM_BATCHED_TOKENS',
  'QWEN_VLLM_MAX_NUM_SEQS',
  'QWEN_VLLM_GPU_MEMORY_UTILIZATION',
  'QWEN_FIXTURE_MAX_TOKENS',
]

const jobRemoveEnv = [
  'QWEN_PRIVATE_INVOKE_TARGET_URL',
  'QWEN_PRIVATE_INVOKE_AUDIENCE',
  'QWEN_CPU_CALLER_REQUEST_ID',
  'QWEN_CPU_CALLER_APPROVED_PLAN_SNAPSHOT_ID',
  'QWEN_CPU_CALLER_APPROVED_PLAN_SNAPSHOT_HASH',
  'QWEN_CPU_CALLER_APPROVAL_RECORD_ID',
  'QWEN_CPU_CALLER_CREDIT_RESERVATION_ID',
  'QWEN_CPU_CALLER_JOB_ID',
  'QWEN_CPU_CALLER_LEASE_ID',
  'QWEN_CPU_CALLER_WORKER_ID',
  'QWEN_CPU_CALLER_IDEMPOTENCY_KEY',
  'QWEN_CPU_CALLER_USE_CASE',
]

function ensureConfirmed() {
  if (process.env[confirmEnv] !== 'true') {
    console.error(`${packet} blocked_pending_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture_confirmation`)
    process.exit(2)
  }
}

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env, CLOUDSDK_CORE_PROJECT: project },
    stdio: options.stdio ?? 'pipe',
    maxBuffer: 20 * 1024 * 1024,
  })
  return output.trim()
}

function gcloud(args, options) {
  return run('gcloud', args, options)
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function envMap(resource, type) {
  const container =
    type === 'service'
      ? resource?.spec?.template?.spec?.containers?.[0]
      : resource?.spec?.template?.spec?.template?.spec?.containers?.[0]
  const env = {}
  for (const item of container?.env ?? []) {
    if (item?.name) env[item.name] = item.value ?? null
  }
  return env
}

function serviceStatus(resource) {
  const env = envMap(resource, 'service')
  return {
    url: resource?.status?.url ?? null,
    latestReadyRevisionName: resource?.status?.latestReadyRevisionName ?? null,
    env: Object.fromEntries(
      Object.entries(env).filter(([key]) =>
        [
          'QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED',
          'QWEN_INFERENCE_ENABLED',
          'QWEN_MODEL_IMPORT_ON_STARTUP',
          ...serviceRemoveEnv,
        ].includes(key),
      ),
    ),
  }
}

function jobStatus(resource) {
  const env = envMap(resource, 'job')
  const spec = resource?.spec?.template?.spec?.template?.spec ?? {}
  return {
    generation: resource?.metadata?.generation ?? null,
    taskTimeoutSeconds: spec.timeoutSeconds ?? null,
    env: Object.fromEntries(
      Object.entries(env).filter(([key]) =>
        [
          'QWEN_CPU_CALLER_EXECUTION_ENABLED',
          'QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE',
          'QWEN_CPU_CALLER_TIMEOUT_SECONDS',
          'QWEN_PRIVATE_INVOKE_TARGET_URL',
          'QWEN_PRIVATE_INVOKE_AUDIENCE',
          ...jobRemoveEnv,
        ].includes(key),
      ),
    ),
  }
}

function describeService() {
  return JSON.parse(
    gcloud(['run', 'services', 'describe', serviceName, '--project', project, '--region', region, '--format=json']),
  )
}

function describeJob() {
  return JSON.parse(gcloud(['run', 'jobs', 'describe', jobName, '--project', project, '--region', region, '--format=json']))
}

function envArg(values) {
  return Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join(',')
}

function updateServiceTemp() {
  gcloud([
    'run',
    'services',
    'update',
    serviceName,
    '--project',
    project,
    '--region',
    region,
    '--update-env-vars',
    envArg(serviceTempEnv),
    '--quiet',
  ])
}

function updateJobTemp(serviceUrl) {
  gcloud([
    'run',
    'jobs',
    'update',
    jobName,
    '--project',
    project,
    '--region',
    region,
    '--task-timeout',
    '900s',
    '--update-env-vars',
    envArg({
      ...jobTempEnvStatic,
      QWEN_PRIVATE_INVOKE_TARGET_URL: serviceUrl,
      QWEN_PRIVATE_INVOKE_AUDIENCE: serviceUrl,
    }),
    '--quiet',
  ])
}

function restoreService() {
  gcloud([
    'run',
    'services',
    'update',
    serviceName,
    '--project',
    project,
    '--region',
    region,
    '--update-env-vars',
    'QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false,QWEN_INFERENCE_ENABLED=false,QWEN_MODEL_IMPORT_ON_STARTUP=false',
    '--quiet',
  ])
  gcloud([
    'run',
    'services',
    'update',
    serviceName,
    '--project',
    project,
    '--region',
    region,
    '--remove-env-vars',
    serviceRemoveEnv.join(','),
    '--quiet',
  ])
}

function restoreJob() {
  gcloud([
    'run',
    'jobs',
    'update',
    jobName,
    '--project',
    project,
    '--region',
    region,
    '--task-timeout',
    '60s',
    '--update-env-vars',
    'QWEN_CPU_CALLER_EXECUTION_ENABLED=false,QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false,QWEN_CPU_CALLER_TIMEOUT_SECONDS=20',
    '--quiet',
  ])
  gcloud([
    'run',
    'jobs',
    'update',
    jobName,
    '--project',
    project,
    '--region',
    region,
    '--remove-env-vars',
    jobRemoveEnv.join(','),
    '--quiet',
  ])
}

function executeJob() {
  const output = gcloud([
    'run',
    'jobs',
    'execute',
    jobName,
    '--project',
    project,
    '--region',
    region,
    '--wait',
    '--format=json',
  ])
  return JSON.parse(output)
}

function executionName(execution) {
  const name = execution?.metadata?.name ?? execution?.name ?? ''
  return String(name).split('/').pop()
}

function describeExecution(name) {
  return JSON.parse(
    gcloud(['run', 'jobs', 'executions', 'describe', name, '--project', project, '--region', region, '--format=json']),
  )
}

function readExecutionLogs(name) {
  const filter = [
    'resource.type="cloud_run_job"',
    `resource.labels.job_name="${jobName}"`,
    `labels."run.googleapis.com/execution_name"="${name}"`,
  ].join(' AND ')
  const output = gcloud(['logging', 'read', filter, '--project', project, '--limit=100', '--order=asc', '--format=json'])
  return JSON.parse(output || '[]')
}

function extractCallerJson(logs) {
  for (const entry of logs) {
    const payload = entry?.textPayload ?? entry?.jsonPayload
    if (typeof payload === 'object' && payload?.fixtureInferenceSmokePassed !== undefined) return payload
    if (typeof payload !== 'string') continue
    const start = payload.indexOf('{')
    if (start === -1) continue
    const candidate = payload.slice(start).trim()
    try {
      const parsed = JSON.parse(candidate)
      if (parsed?.fixtureInferenceSmokePassed !== undefined || parsed?.structuredMetadataOutputAccepted !== undefined) {
        return parsed
      }
    } catch {
      continue
    }
  }
  return null
}

function executionSucceeded(execution) {
  const conditions = execution?.status?.conditions ?? []
  return conditions.some((condition) => condition.type === 'Completed' && condition.status === 'True')
}

function validateRestore(serviceAfter, jobAfter) {
  const serviceEnv = envMap(serviceAfter, 'service')
  const jobEnv = envMap(jobAfter, 'job')
  const serviceOk =
    serviceEnv.QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED === 'false' &&
    serviceEnv.QWEN_INFERENCE_ENABLED === 'false' &&
    serviceEnv.QWEN_MODEL_IMPORT_ON_STARTUP === 'false' &&
    serviceRemoveEnv.every((key) => serviceEnv[key] === undefined)
  const jobOk =
    jobEnv.QWEN_CPU_CALLER_EXECUTION_ENABLED === 'false' &&
    jobEnv.QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE === 'false' &&
    jobEnv.QWEN_CPU_CALLER_TIMEOUT_SECONDS === '20' &&
    jobRemoveEnv.every((key) => jobEnv[key] === undefined)
  return { serviceOk, jobOk, passed: serviceOk && jobOk }
}

function buildArtifactManifest(files) {
  return files.map((file) => ({
    fileName: path.basename(file),
    bytes: fs.statSync(file).size,
    sha256: sha256File(file),
  }))
}

ensureConfirmed()
fs.mkdirSync(outputDir, { recursive: true })

const report = {
  packet,
  runId,
  outputDir,
  project,
  region,
  serviceName,
  jobName,
  decision: 'blocked_pending_runtime_result',
  execution: 'confirmed_adapter_runtime_fixture_attempted',
  safety: {
    supabaseMutation: false,
    sqlExecution: false,
    secretPayloadAccess: false,
    frontendProviderCall: false,
    productRouteExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    generatedAssetCreation: false,
    creditMutation: false,
    stripeProcessing: false,
    broadExternalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    rawPromptExecution: false,
    finalRenderExport: false,
    arbitraryPrivateMediaProcessing: false,
    arbitraryUserMediaProcessing: false,
    dockerPush: false,
    packageLockMutation: false,
  },
}

let execution = null
let executionDescription = null
let logs = []
let callerResult = null
let restore = { attempted: false, passed: false }

try {
  const serviceBefore = describeService()
  const jobBefore = describeJob()
  report.before = {
    service: serviceStatus(serviceBefore),
    job: jobStatus(jobBefore),
  }

  const serviceUrl = serviceBefore?.status?.url
  if (!serviceUrl) throw new Error('blocked_qwen_service_url_missing')

  updateServiceTemp()
  updateJobTemp(serviceUrl)

  execution = executeJob()
  const name = executionName(execution)
  if (!name) throw new Error('blocked_qwen_execution_name_missing')
  executionDescription = describeExecution(name)
  logs = readExecutionLogs(name)
  callerResult = extractCallerJson(logs)

  const metadata = callerResult?.metadataOutput ?? {}
  const success =
    executionSucceeded(executionDescription) &&
    callerResult?.ok === true &&
    callerResult?.httpStatus === 200 &&
    callerResult?.serviceReason === 'qwen_fixture_inference_smoke_completed' &&
    callerResult?.fixtureInferenceSmokePassed === true &&
    callerResult?.structuredMetadataOutputAccepted === true &&
    callerResult?.modelInferenceEnabled === true &&
    callerResult?.runtimeContractExecutesNow === true &&
    metadata?.parsedJson === true &&
    metadata?.schemaValid === true &&
    metadata?.objectCount === 3 &&
    metadata?.textLikeRegionCount === 1 &&
    metadata?.rawOutputStoredInRepo === false &&
    callerResult?.runtimeSideEffects?.generatedAssetsCreated === false &&
    callerResult?.runtimeSideEffects?.publicArtifactsCreated === false &&
    callerResult?.runtimeSideEffects?.signedUrlsCreated === false &&
    callerResult?.runtimeSideEffects?.supabaseTouched === false &&
    callerResult?.runtimeSideEffects?.sqlExecuted === false

  report.runtime = {
    executionName: name,
    executionSucceeded: executionSucceeded(executionDescription),
    callerResult,
  }
  report.decision = success
    ? 'completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture'
    : 'blocked_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture_failed'
  report.execution = success
    ? 'completed_confirmed_backend_adapter_runtime_fixture_with_fail_closed_restore'
    : 'confirmed_backend_adapter_runtime_fixture_attempted_but_failed'
} catch (error) {
  report.error = {
    name: error?.name ?? 'Error',
    message: String(error?.message ?? error).slice(0, 500),
  }
  report.decision = 'blocked_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture_failed'
} finally {
  try {
    restore.attempted = true
    restoreJob()
    restoreService()
    const serviceAfter = describeService()
    const jobAfter = describeJob()
    restore = {
      ...restore,
      ...validateRestore(serviceAfter, jobAfter),
      service: serviceStatus(serviceAfter),
      job: jobStatus(jobAfter),
    }
  } catch (restoreError) {
    restore = {
      ...restore,
      passed: false,
      error: {
        name: restoreError?.name ?? 'Error',
        message: String(restoreError?.message ?? restoreError).slice(0, 500),
      },
    }
  }
  report.failClosedRestore = restore
}

if (!report.failClosedRestore?.passed) {
  report.decision = 'blocked_qwen2_5_vl_external_beta_fail_closed_restore_failed'
}

const reportPath = path.join(outputDir, 'qwen2-5-vl-confirmed-adapter-runtime-fixture-report.json')
writeJson(reportPath, report)
const manifestPath = path.join(outputDir, 'qwen2-5-vl-confirmed-adapter-runtime-fixture-manifest.json')
writeJson(manifestPath, {
  packet,
  runId,
  outputDir,
  artifacts: buildArtifactManifest([reportPath]),
})
const checksumPath = path.join(outputDir, 'qwen2-5-vl-confirmed-adapter-runtime-fixture-checksums.json')
const manifest = {
  packet,
  runId,
  outputDir,
  artifacts: buildArtifactManifest([reportPath]),
}
writeJson(manifestPath, manifest)
const checksums = {
  packet,
  runId,
  outputDir,
  artifacts: buildArtifactManifest([reportPath, manifestPath]),
}
writeJson(checksumPath, checksums)

console.log(JSON.stringify({ decision: report.decision, runId, outputDir, manifest, checksums }, null, 2))

if (report.decision !== 'completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture') {
  process.exit(3)
}
