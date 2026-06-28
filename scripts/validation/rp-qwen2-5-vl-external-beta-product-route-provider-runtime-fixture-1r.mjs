#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R'
const confirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE'
const backendHandoffEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF'
const readbackEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION'
const runtimeGateEnv = 'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE'
const targetRefEnv = 'REEDITPRO_EXTERNAL_BETA_TARGET_REF'
const runtimeScopeEnv = 'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE'
const adapterFixtureConfirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE'

const requiredRuntimeScope = 'approved_snapshot_structured_metadata_only'
const requiredTargetRef = 'wmyyttnynmteqgcdishd'
const runId = `qwen25-product-route-provider-runtime-fixture-1r-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto
  .randomBytes(4)
  .toString('hex')}`
const outputDir = path.join(
  os.tmpdir(),
  'reeditpro-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r',
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

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
    maxBuffer: 24 * 1024 * 1024,
  })
  return {
    command: [command, ...args].join(' '),
    status: result.status,
    signal: result.signal,
    stdout: String(result.stdout ?? '').slice(-8000),
    stderr: String(result.stderr ?? '').slice(-8000),
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

function finalize(report, code) {
  const reportPath = path.join(outputDir, 'qwen2-5-vl-product-route-provider-runtime-fixture-1r-report.json')
  writeJson(reportPath, report)
  const manifestPath = path.join(outputDir, 'qwen2-5-vl-product-route-provider-runtime-fixture-1r-manifest.json')
  writeJson(manifestPath, {
    packet,
    runId,
    outputDir,
    artifacts: [artifact(reportPath)],
  })
  const checksumPath = path.join(outputDir, 'qwen2-5-vl-product-route-provider-runtime-fixture-1r-checksums.json')
  writeJson(checksumPath, {
    packet,
    runId,
    outputDir,
    artifacts: [artifact(reportPath), artifact(manifestPath)],
  })
  const summary = {
    packet,
    decision: report.decision,
    blocker: report.blocker ?? null,
    runId,
    outputDir,
    artifacts: [artifact(reportPath), artifact(manifestPath), artifact(checksumPath)],
  }
  console.log(JSON.stringify(summary, null, 2))
  process.exit(code)
}

fs.mkdirSync(outputDir, { recursive: true })

const gates = {
  providerFixtureConfirmation: process.env[confirmEnv] === 'true',
  backendHandoffConfirmation: process.env[backendHandoffEnv] === 'true',
  routeReadbackConfirmation: process.env[readbackEnv] === 'true',
  runtimeGate: process.env[runtimeGateEnv] === 'true',
  targetRef: process.env[targetRefEnv] === requiredTargetRef,
  runtimeScope: process.env[runtimeScopeEnv] === requiredRuntimeScope,
}

const report = {
  packet,
  runId,
  outputDir,
  decision: 'blocked_pending_product_route_provider_runtime_fixture_confirmation',
  execution: 'blocked_confirmation_absent_no_provider_or_model_execution',
  confirmationGates: {
    providerRuntimeFixture: {
      env: confirmEnv,
      requiredValue: 'true',
      confirmed: gates.providerFixtureConfirmation,
    },
    backendJobHandoff: {
      env: backendHandoffEnv,
      requiredValue: 'true',
      confirmed: gates.backendHandoffConfirmation,
    },
    routeReadbackValidation: {
      env: readbackEnv,
      requiredValue: 'true',
      confirmed: gates.routeReadbackConfirmation,
    },
    runtimeGate: {
      env: runtimeGateEnv,
      requiredValue: 'true',
      confirmed: gates.runtimeGate,
    },
    targetRef: {
      env: targetRefEnv,
      requiredValue: requiredTargetRef,
      confirmed: gates.targetRef,
    },
    runtimeScope: {
      env: runtimeScopeEnv,
      requiredValue: requiredRuntimeScope,
      confirmed: gates.runtimeScope,
    },
  },
  backendHandoff: {
    sourceContract: 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1',
    smokeCommand: 'npm run smoke:qwen2-5-vl-external-beta-product-route-backend-job-handoff-1',
    validatedInThisRun: false,
  },
  runtime: {
    delegatedAdapterFixtureScript:
      'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs',
    providerRuntimeExecuted: false,
    modelRuntimeExecuted: false,
    cloudRunJobExecuted: false,
  },
  blocker: 'blocked_pending_product_route_provider_runtime_fixture_confirmation',
  safety: {
    productRouteProviderRuntimeFixtureRunner: true,
    qwenRuntimeExecutedInThisRun: false,
    providerCall: false,
    modelCall: false,
    frontendProviderModelCall: false,
    workerExecution: false,
    workerDispatch: false,
    cloudRunServiceUpdate: false,
    cloudRunJobExecution: false,
    identityTokenFetch: false,
    secretPayloadAccess: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    mediaProcessing: false,
    privateUserMediaProcessing: false,
    rawPromptExecution: false,
    finalRenderExport: false,
    externalBetaUnlockAppliedToEnvironment: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    creditMutation: false,
    packageLockMutation: false,
  },
}

if (!gates.providerFixtureConfirmation) {
  finalize(report, 2)
}

const missingGate = Object.entries(gates).find(([, ok]) => !ok)
if (missingGate) {
  report.decision = 'blocked_pending_product_route_provider_runtime_fixture_required_gate'
  report.execution = 'blocked_missing_required_gate_no_provider_or_model_execution'
  report.blocker = `blocked_missing_${missingGate[0]}`
  finalize(report, 2)
}

const runtimeEnv = {
  ...process.env,
  [backendHandoffEnv]: 'true',
  [readbackEnv]: 'true',
  [runtimeGateEnv]: 'true',
  [targetRefEnv]: requiredTargetRef,
  [runtimeScopeEnv]: requiredRuntimeScope,
  [adapterFixtureConfirmEnv]: 'true',
}

const handoffSmoke = run('npm', ['run', 'smoke:qwen2-5-vl-external-beta-product-route-backend-job-handoff-1'], runtimeEnv)
report.backendHandoff.smoke = handoffSmoke
report.backendHandoff.validatedInThisRun = handoffSmoke.status === 0
if (handoffSmoke.status !== 0) {
  report.decision = 'blocked_product_route_backend_handoff_validation_failed'
  report.execution = 'blocked_backend_handoff_validation_no_provider_or_model_execution'
  report.blocker = 'blocked_product_route_backend_handoff_validation_failed'
  finalize(report, 3)
}

const adapterRuntime = run(
  'node',
  ['scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs'],
  runtimeEnv,
)
const adapterSummary = parseLastJson(adapterRuntime.stdout)
const adapterSucceeded =
  adapterRuntime.status === 0 &&
  adapterSummary?.decision === 'completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture'
report.runtime.adapterRuntime = {
  command: adapterRuntime.command,
  status: adapterRuntime.status,
  signal: adapterRuntime.signal,
  stdoutSnippet: adapterRuntime.stdout.slice(-4000),
  stderrSnippet: adapterRuntime.stderr.slice(-4000),
  summary: adapterSummary,
}
report.runtime.providerRuntimeExecuted = adapterSucceeded
report.runtime.modelRuntimeExecuted = adapterSucceeded
report.runtime.cloudRunJobExecuted = adapterSucceeded
report.safety.qwenRuntimeExecutedInThisRun = adapterSucceeded
report.safety.providerCall = adapterSucceeded
report.safety.modelCall = adapterSucceeded
report.safety.cloudRunServiceUpdate = adapterSucceeded
report.safety.cloudRunJobExecution = adapterSucceeded
report.safety.identityTokenFetch = adapterSucceeded

if (!adapterSucceeded) {
  report.decision = 'blocked_product_route_provider_runtime_fixture_failed'
  report.execution = 'confirmed_product_route_provider_runtime_fixture_attempted_but_failed'
  report.blocker = 'blocked_product_route_provider_runtime_fixture_failed'
  finalize(report, 3)
}

report.decision = 'completed_qwen2_5_vl_product_route_provider_runtime_fixture_through_backend_handoff'
report.execution = 'completed_confirmed_product_route_provider_runtime_fixture_via_backend_handoff'
report.blocker = null
finalize(report, 0)
