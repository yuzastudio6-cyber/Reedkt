#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_COLD_START_RETRY_1'
const confirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_COLD_START_RETRY'
const runId = `qwen25-product-route-provider-runtime-fixture-cold-start-retry-1-${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(
  os.tmpdir(),
  'reeditpro-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1',
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

function readProductReport(summary) {
  if (!summary?.outputDir) return null
  const reportPath = path.join(
    summary.outputDir,
    'qwen2-5-vl-product-route-provider-runtime-fixture-1r-report.json',
  )
  if (!fs.existsSync(reportPath)) return null
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'))
}

function readAdapterReport(productReport) {
  const adapterReportPath =
    productReport?.runtime?.adapterRuntime?.summary?.outputDir &&
    path.join(
      productReport.runtime.adapterRuntime.summary.outputDir,
      'qwen2-5-vl-confirmed-adapter-runtime-fixture-report.json',
    )
  if (adapterReportPath && fs.existsSync(adapterReportPath)) {
    return JSON.parse(fs.readFileSync(adapterReportPath, 'utf8'))
  }
  return null
}

function classify(productSummary, productReport) {
  const adapterReport = readAdapterReport(productReport)
  const attempts = productReport?.runtime?.adapterRuntime?.summary
  if (
    productSummary?.decision ===
    'completed_qwen2_5_vl_product_route_provider_runtime_fixture_through_backend_handoff'
  ) {
    return {
      decision: 'completed_qwen2_5_vl_product_route_provider_runtime_fixture_after_cold_start_retry',
      execution: 'completed_confirmed_product_route_provider_runtime_fixture_after_cold_start_retry',
      blocker: null,
      adapterReport,
      attempts,
    }
  }
  const adapterAttempts = adapterReport?.runtime?.attempts ?? []
  const lastHttpStatus = adapterAttempts.at(-1)?.callerResult?.httpStatus ?? null
  const coldStartAttempted = adapterAttempts.some((attempt) => attempt.coldStartRetryCandidate === true)
  if (coldStartAttempted && lastHttpStatus === 502) {
    return {
      decision: 'blocked_qwen_adapter_runtime_fixture_http_502_after_cold_start_retry',
      execution: 'confirmed_cold_start_retry_attempted_fail_closed_restore_passed',
      blocker: 'blocked_qwen_adapter_runtime_fixture_http_502_after_cold_start_retry',
      adapterReport,
    }
  }
  if (productReport?.runtime?.adapterRuntime?.status !== 0) {
    return {
      decision: 'blocked_product_route_provider_runtime_fixture_cold_start_retry_failed',
      execution: 'confirmed_cold_start_retry_attempted_fail_closed_restore_passed',
      blocker: 'blocked_product_route_provider_runtime_fixture_cold_start_retry_failed',
      adapterReport,
      attempts,
    }
  }
  return {
    decision: 'blocked_product_route_provider_runtime_fixture_cold_start_retry_unclassified',
    execution: 'confirmed_cold_start_retry_attempted_fail_closed_restore_passed',
    blocker: 'blocked_product_route_provider_runtime_fixture_cold_start_retry_unclassified',
    adapterReport,
    attempts,
  }
}

function finalize(report, code) {
  const reportPath = path.join(
    outputDir,
    'qwen2-5-vl-product-route-provider-runtime-fixture-1r-cold-start-retry-1-report.json',
  )
  writeJson(reportPath, report)
  const manifestPath = path.join(
    outputDir,
    'qwen2-5-vl-product-route-provider-runtime-fixture-1r-cold-start-retry-1-manifest.json',
  )
  writeJson(manifestPath, {
    packet,
    runId,
    outputDir,
    artifacts: [artifact(reportPath)],
  })
  const checksumPath = path.join(
    outputDir,
    'qwen2-5-vl-product-route-provider-runtime-fixture-1r-cold-start-retry-1-checksums.json',
  )
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
  decision: 'blocked_pending_qwen_product_route_provider_runtime_fixture_cold_start_retry_confirmation',
  execution: 'blocked_confirmation_absent_no_provider_or_model_execution',
  confirmationGate: {
    env: confirmEnv,
    requiredValue: 'true',
    confirmed: process.env[confirmEnv] === 'true',
  },
  retryPolicy: {
    adapterMaxAttempts: 2,
    coldStartWaitSeconds: 300,
    retryableHttpStatuses: [502],
  },
  safety: {
    cloudRunExecutionAttempted: false,
    providerModelRuntimeAttempted: false,
    supabaseMutation: false,
    sqlExecution: false,
    secretPayloadAccess: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    mediaProcessing: false,
    workerDispatch: false,
    routeBehaviorChanged: false,
    externalBetaUnlock: false,
    productionUnlock: false,
    packageLockMutation: false,
  },
}

if (process.env[confirmEnv] !== 'true') {
  finalize(report, 2)
}

const runtimeEnv = {
  ...process.env,
  REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE: 'true',
  REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF: 'true',
  REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION: 'true',
  REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE: 'true',
  REEDITPRO_EXTERNAL_BETA_TARGET_REF: 'wmyyttnynmteqgcdishd',
  REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE: 'approved_snapshot_structured_metadata_only',
  QWEN_ADAPTER_RUNTIME_FIXTURE_MAX_ATTEMPTS: String(report.retryPolicy.adapterMaxAttempts),
  QWEN_ADAPTER_RUNTIME_FIXTURE_COLD_START_WAIT_SECONDS: String(report.retryPolicy.coldStartWaitSeconds),
}

const productRouteResult = spawnSync(
  'node',
  ['scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r.mjs'],
  {
    cwd: process.cwd(),
    env: runtimeEnv,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  },
)

const productSummary = parseLastJson(productRouteResult.stdout)
const productReport = readProductReport(productSummary)
const classification = classify(productSummary, productReport)

report.productRouteResult = {
  command: 'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r.mjs',
  status: productRouteResult.status,
  signal: productRouteResult.signal,
  stdoutSnippet: String(productRouteResult.stdout ?? '').slice(-6000),
  stderrSnippet: String(productRouteResult.stderr ?? '').slice(-6000),
  summary: productSummary,
  report: productReport,
}
if (classification.adapterReport) {
  report.adapterRuntimeReport = classification.adapterReport
}
report.decision = classification.decision
report.execution = classification.execution
report.blocker = classification.blocker
report.safety.cloudRunExecutionAttempted = true
report.safety.providerModelRuntimeAttempted = report.decision.startsWith('completed_')
report.failClosedRestorePassed = classification.adapterReport?.failClosedRestore?.passed === true

const exitCode = report.decision.startsWith('completed_') ? 0 : 3
finalize(report, exitCode)
