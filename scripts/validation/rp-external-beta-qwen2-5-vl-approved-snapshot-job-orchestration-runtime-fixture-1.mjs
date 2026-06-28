#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE_1'
const confirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE'
const coldStartConfirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_COLD_START_RETRY'
const runId = `qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(
  os.tmpdir(),
  'reeditpro-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1',
  runId,
)

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function artifact(file) {
  return {
    fileName: path.basename(file),
    bytes: fs.statSync(file).size,
    sha256: sha256File(file),
  }
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return {
    command: [command, ...args].join(' '),
    status: result.status,
    signal: result.signal,
    stdoutSnippet: String(result.stdout ?? '').slice(-8000),
    stderrSnippet: String(result.stderr ?? '').slice(-8000),
  }
}

function parseLastJson(text) {
  const input = String(text ?? '').trim()
  for (let index = input.lastIndexOf('{'); index >= 0; index = input.lastIndexOf('{', index - 1)) {
    try {
      return JSON.parse(input.slice(index))
    } catch {
      continue
    }
  }
  return null
}

function readJsonIfExists(file) {
  if (!file || !fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function readColdStartReport(summary) {
  if (!summary?.outputDir) return null
  return readJsonIfExists(
    path.join(
      summary.outputDir,
      'qwen2-5-vl-product-route-provider-runtime-fixture-1r-cold-start-retry-1-report.json',
    ),
  )
}

function readProductRouteReport(coldStartReport) {
  const productOutputDir = coldStartReport?.productRouteResult?.summary?.outputDir
  if (!productOutputDir) return null
  return readJsonIfExists(path.join(productOutputDir, 'qwen2-5-vl-product-route-provider-runtime-fixture-1r-report.json'))
}

function finalize(report, code) {
  const reportPath = path.join(outputDir, 'qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1-report.json')
  writeJson(reportPath, report)
  const manifestPath = path.join(outputDir, 'qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1-manifest.json')
  writeJson(manifestPath, {
    packet,
    runId,
    outputDir,
    artifacts: [artifact(reportPath)],
  })
  const checksumPath = path.join(outputDir, 'qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1-checksums.json')
  writeJson(checksumPath, {
    packet,
    runId,
    outputDir,
    artifacts: [artifact(reportPath), artifact(manifestPath)],
  })
  console.log(
    JSON.stringify(
      {
        packet,
        decision: report.decision,
        blocker: report.blocker ?? null,
        runId,
        outputDir,
        artifacts: [artifact(reportPath), artifact(manifestPath), artifact(checksumPath)],
      },
      null,
      2,
    ),
  )
  process.exit(code)
}

fs.mkdirSync(outputDir, { recursive: true })

const report = {
  packet,
  runId,
  outputDir,
  decision: 'blocked_pending_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture_confirmation',
  execution: 'blocked_confirmation_absent_no_runtime_execution',
  confirmationGate: {
    env: confirmEnv,
    requiredValue: 'true',
    confirmed: process.env[confirmEnv] === 'true',
  },
  sourceChain: {
    approvedSnapshotJobOrchestrationE2E: '8e4c79d11a41e9a6733eabcc00acfd5e7794eb88',
    qwenProductRouteRuntimeReadinessRollup: '71fe816d96135674bb634389ae08e2358806c33f',
    excludedPr: 577,
  },
  orchestrationEnvelope: {
    smokeCommand: 'npm run smoke:qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e-1',
    validated: false,
  },
  delegatedRuntime: {
    command: 'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1.mjs',
    confirmedEnv: coldStartConfirmEnv,
    completed: false,
  },
  safety: {
    supabaseMutation: false,
    sqlExecution: false,
    secretPayloadAccess: false,
    creditMutation: false,
    workerDispatch: false,
    workerExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    mediaProcessing: false,
    privateUserMediaProcessing: false,
    finalRenderExport: false,
    externalBetaUnlock: false,
    productionUnlock: false,
    packageLockMutation: false,
  },
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  blocker: 'blocked_pending_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture_confirmation',
}

if (process.env[confirmEnv] !== 'true') {
  finalize(report, 2)
}

const smoke = run('npm', ['run', 'smoke:qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e-1'])
report.orchestrationEnvelope.smoke = smoke
report.orchestrationEnvelope.validated = smoke.status === 0
if (smoke.status !== 0) {
  report.decision = 'blocked_qwen2_5_vl_approved_snapshot_job_orchestration_envelope_validation_failed'
  report.execution = 'blocked_before_qwen_runtime_execution'
  report.blocker = 'blocked_qwen2_5_vl_approved_snapshot_job_orchestration_envelope_validation_failed'
  finalize(report, 3)
}

const runtimeEnv = {
  ...process.env,
  [coldStartConfirmEnv]: 'true',
}

const coldStart = run(
  'node',
  ['scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1.mjs'],
  runtimeEnv,
)
const coldStartSummary = parseLastJson(coldStart.stdoutSnippet)
const coldStartReport = readColdStartReport(coldStartSummary)
const productRouteReport = readProductRouteReport(coldStartReport)
const adapterReport = coldStartReport?.adapterRuntimeReport ?? null
const completed =
  coldStart.status === 0 &&
  coldStartSummary?.decision === 'completed_qwen2_5_vl_product_route_provider_runtime_fixture_after_cold_start_retry'

report.delegatedRuntime.result = {
  ...coldStart,
  summary: coldStartSummary,
  report: coldStartReport,
  productRouteReport,
}
report.delegatedRuntime.completed = completed

if (!completed) {
  report.decision =
    coldStartSummary?.blocker || coldStartSummary?.decision || 'blocked_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture_failed'
  report.execution = 'confirmed_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture_attempted_fail_closed'
  report.blocker =
    coldStartSummary?.blocker || coldStartSummary?.decision || 'blocked_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture_failed'
  finalize(report, 3)
}

report.decision = 'completed_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture'
report.execution = 'completed_confirmed_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture'
report.blocker = null
report.runtimeEvidence = {
  qwenRuntimeRunId: coldStartReport?.productRouteResult?.summary?.runId ?? null,
  qwenColdStartRetryRunId: coldStartSummary?.runId ?? null,
  adapterRunId: productRouteReport?.runtime?.adapterRuntime?.summary?.runId ?? null,
  cloudRunExecution: adapterReport?.runtime?.executionName ?? null,
  httpStatus: adapterReport?.runtime?.callerResult?.httpStatus ?? null,
  serviceReason: adapterReport?.runtime?.callerResult?.serviceReason ?? null,
  structuredMetadataAccepted: adapterReport?.runtime?.callerResult?.structuredMetadataOutputAccepted ?? null,
  schemaValid: adapterReport?.runtime?.callerResult?.metadataOutput?.schemaValid ?? null,
  objectCount: adapterReport?.runtime?.callerResult?.metadataOutput?.objectCount ?? null,
  textLikeRegionCount: adapterReport?.runtime?.callerResult?.metadataOutput?.textLikeRegionCount ?? null,
  failClosedRestorePassed: coldStartReport?.failClosedRestorePassed === true,
}

finalize(report, 0)
