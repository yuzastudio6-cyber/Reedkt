#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-QWEN-PRODUCT-FLOW-RUNTIME-1'
const confirmEnv = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_QWEN_PRODUCT_FLOW_RUNTIME'
const testerEmail = 'aiediting@reeditpro.com'
const productFlowConfirmEnv = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_PRODUCT_FLOW_SMOKE'
const qwenConfirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE'
const runId = `single-tester-qwen-product-flow-runtime-1-${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(os.tmpdir(), 'reeditpro-rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1', runId)

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
    maxBuffer: 96 * 1024 * 1024,
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

function parseLineValue(text, label) {
  const line = String(text ?? '')
    .split('\n')
    .find((candidate) => candidate.startsWith(`${label}: `))
  return line ? line.slice(label.length + 2).trim() : null
}

function readJsonIfExists(file) {
  if (!file || !fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function summarizeProductFlow(result) {
  const runIdFromOutput = parseLineValue(result.stdoutSnippet, 'Run ID')
  const outputDirFromOutput = parseLineValue(result.stdoutSnippet, 'Output')
  const report = readJsonIfExists(path.join(outputDirFromOutput ?? '', 'controlled-tester-product-flow-smoke-report.json'))
  const manifest = readJsonIfExists(path.join(outputDirFromOutput ?? '', 'artifact-manifest.json'))
  return {
    runId: runIdFromOutput,
    outputDir: outputDirFromOutput,
    reportDecision: report?.decision ?? null,
    unauthenticatedHealth: report?.smoke?.unauthenticatedHealth ?? null,
    routeMapStatus: report?.routeMap?.status ?? null,
    mockReadyRoutes: report?.routeMap?.mockReadyRoutes ?? null,
    requiredRoutesPresent: report?.routeMap?.requiredRoutesPresent ?? null,
    planningStoppedAtApproval:
      report?.smoke?.successRoutes?.find((route) => route.routeId === 'planning.demo.chatNative.create')?.nextRequiredAction ??
      null,
    backendRequiredRoutesBlocked: (report?.smoke?.blockedRoutes ?? []).every(
      (route) => route.httpStatus === 424 && route.errorCode === 'backend_runtime_required',
    ),
    jobGateAllowedWorkerExecution:
      report?.smoke?.successRoutes?.find((route) => route.routeId === 'jobs.gate.check')?.jobGateOk ?? null,
    artifacts: [
      ...(report ? [artifact(path.join(outputDirFromOutput, 'controlled-tester-product-flow-smoke-report.json'))] : []),
      ...(manifest ? [artifact(path.join(outputDirFromOutput, 'artifact-manifest.json'))] : []),
    ],
  }
}

function summarizeQwen(result) {
  const summary = parseLastJson(result.stdoutSnippet)
  const report = readJsonIfExists(
    path.join(
      summary?.outputDir ?? '',
      'qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1-report.json',
    ),
  )
  return {
    summary,
    reportDecision: report?.decision ?? null,
    wrapperRunId: report?.runId ?? null,
    outputDir: report?.outputDir ?? summary?.outputDir ?? null,
    qwenRuntimeRunId: report?.runtimeEvidence?.qwenRuntimeRunId ?? null,
    qwenColdStartRetryRunId: report?.runtimeEvidence?.qwenColdStartRetryRunId ?? null,
    adapterRunId: report?.runtimeEvidence?.adapterRunId ?? null,
    cloudRunExecution: report?.runtimeEvidence?.cloudRunExecution ?? null,
    httpStatus: report?.runtimeEvidence?.httpStatus ?? null,
    serviceReason: report?.runtimeEvidence?.serviceReason ?? null,
    structuredMetadataAccepted: report?.runtimeEvidence?.structuredMetadataAccepted ?? null,
    schemaValid: report?.runtimeEvidence?.schemaValid ?? null,
    failClosedRestorePassed: report?.runtimeEvidence?.failClosedRestorePassed ?? null,
    artifacts: summary?.artifacts ?? [],
  }
}

function finalize(report, code) {
  const reportPath = path.join(outputDir, 'controlled-single-tester-qwen-product-flow-runtime-1-report.json')
  writeJson(reportPath, report)
  const manifestPath = path.join(outputDir, 'controlled-single-tester-qwen-product-flow-runtime-1-manifest.json')
  writeJson(manifestPath, {
    packet,
    runId,
    outputDir,
    artifacts: [artifact(reportPath)],
  })
  const checksumPath = path.join(outputDir, 'controlled-single-tester-qwen-product-flow-runtime-1-checksums.json')
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
  decision: 'blocked_pending_external_beta_single_tester_qwen_product_flow_runtime_confirmation',
  execution: 'blocked_confirmation_absent_no_runtime_execution',
  blocker: 'blocked_pending_external_beta_single_tester_qwen_product_flow_runtime_confirmation',
  confirmationGate: {
    env: confirmEnv,
    requiredValue: 'true',
    confirmed: process.env[confirmEnv] === 'true',
  },
  controlledTester: {
    email: testerEmail,
    additionalTesterExpansion: 'blocked_no_additional_named_tester_list',
  },
  sourceChain: {
    productFlowAfterQwenPacket: 'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-PRODUCT-FLOW-AFTER-QWEN-ORCHESTRATION-1',
    productFlowAfterQwenMergeSha: 'afde458c1967cc0f90bf7db6aebea0e5e6f9b544',
    qwenApprovedSnapshotQaRollupMergeSha: '2b32604324fb843d3c52c9a006dffda3f685b441',
    currentReadinessRollupAfterQwenMergeSha: 'cd51c6999b02e1d18a0cfe087c652cdbe181204d',
    excludedPr: 577,
  },
  delegatedChecks: {
    controlledTesterProductFlowSmoke: {
      command: 'npm run rp-external-beta-controlled-tester-product-flow-smoke-1',
      completed: false,
    },
    qwenApprovedSnapshotJobOrchestrationRuntimeFixture: {
      command: 'npm run rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1',
      completed: false,
    },
  },
  readiness: {
    productFlowRuntime: 'blocked_pending_confirmation',
    nextMilestone: 'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-PRODUCT-WALKTHROUGH-QA-1',
    productReadyEndToEndLocalOssTools: 0,
  },
  safety: {
    boundedSingleTesterRuntimeValidation: true,
    controlledTesterProductFlowSmokeExecuted: false,
    qwenRuntimeExecutedInThisPacket: false,
    boundedQwenProviderModelCall: false,
    workerDispatch: false,
    workerExecution: false,
    supabaseMutation: false,
    sqlExecution: false,
    secretManagerPayloadAccess: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    persistentCreditMutation: false,
    creditSpend: false,
    stripePaymentProcessing: false,
    browserCapture: false,
    mediaProcessing: false,
    privateUserMediaProcessing: false,
    finalRenderExport: false,
    internalBetaBroadUnlock: false,
    externalBetaGlobalUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    deployment: false,
    cloudRunServiceUpdate: false,
    packageLockMutation: false,
  },
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}

if (process.env[confirmEnv] !== 'true') {
  finalize(report, 2)
}

const productFlowEnv = {
  ...process.env,
  [productFlowConfirmEnv]: 'true',
  REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL: testerEmail,
}
const productFlow = run('npm', ['run', 'rp-external-beta-controlled-tester-product-flow-smoke-1'], productFlowEnv)
const productFlowSummary = summarizeProductFlow(productFlow)
report.delegatedChecks.controlledTesterProductFlowSmoke.result = productFlow
report.delegatedChecks.controlledTesterProductFlowSmoke.summary = productFlowSummary
report.delegatedChecks.controlledTesterProductFlowSmoke.completed =
  productFlow.status === 0 &&
  productFlowSummary.reportDecision === 'completed_external_beta_controlled_tester_product_flow_smoke' &&
  productFlowSummary.unauthenticatedHealth === 'blocked_403' &&
  productFlowSummary.routeMapStatus === 200 &&
  productFlowSummary.requiredRoutesPresent === true &&
  productFlowSummary.planningStoppedAtApproval === 'approve_plan_and_credits' &&
  productFlowSummary.backendRequiredRoutesBlocked === true &&
  productFlowSummary.jobGateAllowedWorkerExecution === false

report.safety.controlledTesterProductFlowSmokeExecuted = productFlow.status === 0

if (!report.delegatedChecks.controlledTesterProductFlowSmoke.completed) {
  report.decision = 'blocked_controlled_tester_product_flow_smoke_failed'
  report.execution = 'confirmed_single_tester_qwen_product_flow_runtime_attempted_fail_closed'
  report.blocker = 'blocked_controlled_tester_product_flow_smoke_failed'
  finalize(report, 3)
}

const qwenEnv = {
  ...process.env,
  [qwenConfirmEnv]: 'true',
}
const qwen = run('npm', ['run', 'rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1'], qwenEnv)
const qwenSummary = summarizeQwen(qwen)
report.delegatedChecks.qwenApprovedSnapshotJobOrchestrationRuntimeFixture.result = qwen
report.delegatedChecks.qwenApprovedSnapshotJobOrchestrationRuntimeFixture.summary = qwenSummary
report.delegatedChecks.qwenApprovedSnapshotJobOrchestrationRuntimeFixture.completed =
  qwen.status === 0 &&
  qwenSummary.reportDecision === 'completed_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture' &&
  qwenSummary.httpStatus === 200 &&
  qwenSummary.serviceReason === 'qwen_fixture_inference_smoke_completed' &&
  qwenSummary.structuredMetadataAccepted === true &&
  qwenSummary.schemaValid === true &&
  qwenSummary.failClosedRestorePassed === true

report.safety.qwenRuntimeExecutedInThisPacket = qwen.status === 0
report.safety.boundedQwenProviderModelCall = qwen.status === 0

if (!report.delegatedChecks.qwenApprovedSnapshotJobOrchestrationRuntimeFixture.completed) {
  report.decision = 'blocked_qwen_approved_snapshot_job_orchestration_runtime_fixture_failed'
  report.execution = 'confirmed_single_tester_qwen_product_flow_runtime_attempted_fail_closed'
  report.blocker = 'blocked_qwen_approved_snapshot_job_orchestration_runtime_fixture_failed'
  finalize(report, 3)
}

report.decision = 'completed_controlled_single_tester_qwen_product_flow_runtime_validation'
report.execution = 'completed_confirmed_controlled_single_tester_qwen_product_flow_runtime_validation'
report.blocker = null
report.readiness.productFlowRuntime = 'validated_for_single_tester_qwen_product_flow_walkthrough_qa'

finalize(report, 0)
