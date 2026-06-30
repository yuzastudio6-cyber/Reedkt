#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet =
  'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-CONFIRMED-RUNTIME-1R'
const confirmEnv = 'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE'
const delegatedConfirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE'
const expectedAccount = 'aiediting@reeditpro.com'
const expectedProject = 'reeditpro'
const region = 'us-central1'
const stagingService = 'reeditpro-staging-api'
const qwenWorkerService = 'reeditpro-qwen2-5-vl-l4-worker'
const targetRef = 'wmyyttnynmteqgcdishd'
const runtimeScope = 'approved_snapshot_structured_metadata_only'
const approvedFixtureReference =
  'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404'
const outputRoot =
  '/tmp/reeditpro-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const runEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

fs.mkdirSync(outputDir, { recursive: true })

function sanitize(value) {
  return String(value ?? '')
    .replace(/ya29\.[A-Za-z0-9_-]+/g, 'ya29.[redacted]')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/eyJ[A-Za-z0-9._-]+/g, '[jwt-redacted]')
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function artifact(file) {
  return {
    fileName: path.basename(file),
    bytes: fs.statSync(file).size,
    sha256: sha256(file),
  }
}

function runText(command, args, env = runEnv, maxBuffer = 8 * 1024 * 1024) {
  const result = spawnSync(command, args, {
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer,
  })
  return {
    ok: result.status === 0,
    exitCode: typeof result.status === 'number' ? result.status : 1,
    signal: result.signal ?? null,
    command: [command, ...args].join(' '),
    stdout: sanitize(result.stdout).trim(),
    stderr: sanitize(result.stderr).trim(),
    error: result.error?.message ? sanitize(result.error.message) : null,
  }
}

function runTokenProbe(args, label) {
  const tempFile = path.join(os.tmpdir(), `reeditpro-${label}-${process.pid}-${crypto.randomBytes(4).toString('hex')}.token`)
  const fd = fs.openSync(tempFile, 'w', 0o600)
  let result
  try {
    result = spawnSync('gcloud', args, {
      env: runEnv,
      stdio: ['ignore', fd, 'pipe'],
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    })
  } finally {
    fs.closeSync(fd)
  }

  let bytes = 0
  try {
    bytes = fs.existsSync(tempFile) ? fs.statSync(tempFile).size : 0
  } finally {
    if (fs.existsSync(tempFile)) fs.rmSync(tempFile, { force: true })
  }

  return {
    ok: result.status === 0 && bytes > 0,
    exitCode: typeof result.status === 'number' ? result.status : 1,
    tokenBytesObserved: bytes,
    tempFileDeleted: !fs.existsSync(tempFile),
    stderr: sanitize(result.stderr ?? '').trim(),
    error: result.error?.message ? sanitize(result.error.message) : null,
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

function readDelegatedReport(summary) {
  if (!summary?.outputDir) return null
  return readJsonIfExists(
    path.join(
      summary.outputDir,
      'qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1-report.json',
    ),
  )
}

function parseCloudRunService(service) {
  const result = runText('gcloud', [
    'run',
    'services',
    'describe',
    service,
    `--project=${expectedProject}`,
    `--region=${region}`,
    '--format=json(metadata.name,metadata.generation,status.conditions,status.latestReadyRevisionName,status.observedGeneration,status.traffic,status.url)',
  ])
  if (!result.ok) return { ok: false, service, commandResult: result }
  try {
    const parsed = JSON.parse(result.stdout)
    const readyCondition = (parsed?.status?.conditions ?? []).find((condition) => condition.type === 'Ready')
    return {
      ok: true,
      service,
      urlHost: parsed?.status?.url ? new URL(parsed.status.url).host : null,
      metadataName: parsed?.metadata?.name ?? null,
      generation: parsed?.metadata?.generation ?? null,
      observedGeneration: parsed?.status?.observedGeneration ?? null,
      readyStatus: readyCondition?.status ?? null,
      latestReadyRevisionName: parsed?.status?.latestReadyRevisionName ?? null,
      traffic: (parsed?.status?.traffic ?? []).map((item) => ({
        percent: item.percent ?? null,
        revisionName: item.revisionName ?? null,
        latestRevision: item.latestRevision ?? null,
      })),
    }
  } catch (error) {
    return { ok: false, service, commandResult: result, parseError: sanitize(error.message) }
  }
}

function readIfExists(file) {
  if (!fs.existsSync(file)) return ''
  return fs.readFileSync(file, 'utf8')
}

function sourceBridgeReady() {
  const source = readIfExists('server/services/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge.ts')
  const record = readJsonIfExists(
    'docs/external-beta/qwen-persisted-worker-dispatch-runtime-source-bridge-1/qwen-persisted-worker-dispatch-runtime-source-bridge-record.json',
  )
  return {
    servicePresent: source.includes('RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-RUNTIME-SOURCE-BRIDGE-1'),
    decisionPresent: source.includes('completed_qwen_persisted_worker_dispatch_runtime_source_bridge'),
    directAdapterShortcutBlocked: source.includes('directAdapterShortcutAllowed: false'),
    delegatedFixtureBehindBridge: source.includes('existingProductRouteRuntimeFixtureAllowedOnlyBehindPersistedBridge: true'),
    workerLeaseReferenceRequired: source.includes('worker_lease_reference_required'),
    idempotencyKeyRequired: source.includes('route_idempotency_key_required'),
    privateManifestRequired: source.includes('private_input_manifest_reference_required'),
    recordDecision: record?.decision ?? null,
    recordStatus: record?.bridge?.status ?? null,
    ready:
      source.includes('completed_qwen_persisted_worker_dispatch_runtime_source_bridge') &&
      source.includes('directAdapterShortcutAllowed: false') &&
      source.includes('existingProductRouteRuntimeFixtureAllowedOnlyBehindPersistedBridge: true') &&
      record?.bridge?.status === 'ready_for_confirmed_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime_retry',
  }
}

function baseSafety(overrides = {}) {
  return {
    localGcloudConfigRead: false,
    userAccessTokenProbe: false,
    adcAccessTokenProbe: false,
    cloudRunServiceMetadataReadback: false,
    sourceBridgeValidated: false,
    routeInvocation: false,
    qwenProviderCall: false,
    modelCall: false,
    qwenInference: false,
    workerExecution: false,
    workerDispatch: false,
    cloudRunJobExecution: false,
    cloudRunServiceUpdate: false,
    cloudRunDeployment: false,
    secretPayloadAccess: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    persistentCreditMutation: false,
    stripePaymentProcessing: false,
    browserCapture: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    rawPromptExecution: false,
    finalRenderExport: false,
    broadExternalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    dependencyMutation: false,
    packageLockMutation: false,
    tokenValuePrinted: false,
    tokenValuePersistedInRepo: false,
    tokenTempFileDeleted: true,
    generatedArtifactCommitted: false,
    ...overrides,
  }
}

function finish(report, code) {
  const finalReport = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    target: {
      googleCloudProject: expectedProject,
      region,
      stagingService,
      qwenWorkerService,
      supabaseProjectRef: targetRef,
      environment: 'staging',
      tester: expectedAccount,
    },
    approvedFixture: {
      fixtureReference: approvedFixtureReference,
      runtimeScope,
      creditPolicy: 'credit_no_spend_no_persistent_credit_mutation',
      timeoutCostCeiling: 'single_request_timeout_and_cost_ceiling_required',
      failClosedRestoreRequired: true,
      directAdapterShortcutAllowed: false,
    },
    ...report,
  }
  const reportPath = path.join(outputDir, 'qwen-persisted-dispatch-approved-fixture-inference-confirmed-runtime-1r-report.json')
  writeJson(reportPath, finalReport)
  const manifestPath = path.join(outputDir, 'qwen-persisted-dispatch-approved-fixture-inference-confirmed-runtime-1r-manifest.json')
  writeJson(manifestPath, {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [artifact(reportPath)],
  })
  const checksumsPath = path.join(outputDir, 'qwen-persisted-dispatch-approved-fixture-inference-confirmed-runtime-1r-checksums.json')
  writeJson(checksumsPath, {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [artifact(reportPath), artifact(manifestPath)],
  })
  console.log(
    JSON.stringify(
      {
        packet,
        decision: finalReport.decision,
        blocker: finalReport.blocker ?? null,
        runId,
        outputDir,
        artifacts: [artifact(reportPath), artifact(manifestPath), artifact(checksumsPath)],
      },
      null,
      2,
    ),
  )
  process.exit(code)
}

if (process.env[confirmEnv] !== 'true') {
  finish(
    {
      decision: 'blocked_pending_qwen_persisted_worker_dispatch_approved_fixture_inference_confirmation',
      execution: 'blocked_confirmation_absent_no_runtime_execution',
      blocker: 'blocked_pending_qwen_persisted_worker_dispatch_approved_fixture_inference_confirmation',
      confirmationGate: { env: confirmEnv, requiredValue: 'true', confirmed: false },
      safety: baseSafety(),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    2,
  )
}

const account = runText('gcloud', ['config', 'get-value', 'account'])
const configuredProject = runText('gcloud', ['config', 'get-value', 'project'])
const accountValue = account.stdout.split('\n').at(-1)?.trim()
const projectValue = configuredProject.stdout.split('\n').at(-1)?.trim()
if (!account.ok || !configuredProject.ok || accountValue !== expectedAccount || projectValue !== expectedProject) {
  finish(
    {
      decision: 'blocked_gcloud_account_or_project_mismatch_before_qwen_persisted_dispatch',
      execution: 'blocked_gcloud_context_mismatch_no_runtime_execution',
      blocker: 'blocked_gcloud_account_or_project_mismatch_before_qwen_persisted_dispatch',
      observedContext: { account: accountValue ?? null, project: projectValue ?? null },
      commandResults: { account, configuredProject },
      confirmationGate: { env: confirmEnv, requiredValue: 'true', confirmed: true },
      safety: baseSafety({ localGcloudConfigRead: true }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const userTokenProbe = runTokenProbe(['auth', 'print-access-token', '--quiet'], 'qwen-persisted-dispatch-1r-user-access')
const adcTokenProbe = runTokenProbe(
  ['auth', 'application-default', 'print-access-token', '--quiet'],
  'qwen-persisted-dispatch-1r-adc-access',
)
if (!userTokenProbe.ok || !adcTokenProbe.ok) {
  finish(
    {
      decision: 'blocked_operator_adc_or_user_token_unavailable',
      execution: 'blocked_operator_token_probe_no_runtime_execution',
      blocker: 'blocked_operator_adc_or_user_token_unavailable',
      observedContext: { account: accountValue, project: projectValue },
      userTokenProbe,
      adcTokenProbe,
      confirmationGate: { env: confirmEnv, requiredValue: 'true', confirmed: true },
      safety: baseSafety({
        localGcloudConfigRead: true,
        userAccessTokenProbe: true,
        adcAccessTokenProbe: true,
        tokenTempFileDeleted: userTokenProbe.tempFileDeleted && adcTokenProbe.tempFileDeleted,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const stagingReadback = parseCloudRunService(stagingService)
const qwenWorkerReadback = parseCloudRunService(qwenWorkerService)
if (!stagingReadback.ok || stagingReadback.readyStatus !== 'True' || !qwenWorkerReadback.ok || qwenWorkerReadback.readyStatus !== 'True') {
  finish(
    {
      decision: 'blocked_qwen_persisted_dispatch_transport_failed',
      execution: 'blocked_cloud_run_metadata_readback_no_runtime_execution',
      blocker: 'blocked_qwen_persisted_dispatch_transport_failed',
      observedContext: { account: accountValue, project: projectValue },
      serviceReadback: { staging: stagingReadback, qwenWorker: qwenWorkerReadback },
      confirmationGate: { env: confirmEnv, requiredValue: 'true', confirmed: true },
      safety: baseSafety({
        localGcloudConfigRead: true,
        userAccessTokenProbe: true,
        adcAccessTokenProbe: true,
        cloudRunServiceMetadataReadback: true,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const bridge = sourceBridgeReady()
const bridgeSmoke = runText(
  'npm',
  ['run', 'smoke:rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1'],
  runEnv,
  16 * 1024 * 1024,
)
if (!bridge.ready || !bridgeSmoke.ok) {
  finish(
    {
      decision: 'blocked_missing_persisted_job_or_queue_lease_reference',
      execution: 'blocked_source_bridge_not_validated_no_qwen_runtime_execution',
      blocker: 'blocked_missing_persisted_job_or_queue_lease_reference',
      observedContext: { account: accountValue, project: projectValue },
      serviceReadback: { staging: stagingReadback, qwenWorker: qwenWorkerReadback },
      sourceBridge: bridge,
      bridgeSmoke,
      confirmationGate: { env: confirmEnv, requiredValue: 'true', confirmed: true },
      safety: baseSafety({
        localGcloudConfigRead: true,
        userAccessTokenProbe: true,
        adcAccessTokenProbe: true,
        cloudRunServiceMetadataReadback: true,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const delegatedEnv = {
  ...runEnv,
  [delegatedConfirmEnv]: 'true',
}

const delegatedRuntime = runText(
  'npm',
  ['run', 'rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1'],
  delegatedEnv,
  96 * 1024 * 1024,
)
const delegatedSummary = parseLastJson(delegatedRuntime.stdout)
const delegatedReport = readDelegatedReport(delegatedSummary)
const completed =
  delegatedRuntime.ok &&
  delegatedSummary?.decision === 'completed_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture' &&
  delegatedReport?.decision === 'completed_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture' &&
  delegatedReport?.runtimeEvidence?.httpStatus === 200 &&
  delegatedReport?.runtimeEvidence?.structuredMetadataAccepted === true &&
  delegatedReport?.runtimeEvidence?.schemaValid === true &&
  delegatedReport?.runtimeEvidence?.failClosedRestorePassed === true

if (!completed) {
  const blocker =
    delegatedSummary?.blocker ||
    delegatedSummary?.decision ||
    delegatedReport?.blocker ||
    delegatedReport?.decision ||
    'blocked_qwen_persisted_dispatch_inference_failed'
  finish(
    {
      decision: blocker,
      execution: 'confirmed_qwen_persisted_dispatch_approved_fixture_inference_attempted_fail_closed',
      blocker,
      observedContext: { account: accountValue, project: projectValue },
      serviceReadback: { staging: stagingReadback, qwenWorker: qwenWorkerReadback },
      sourceBridge: bridge,
      bridgeSmoke,
      delegatedRuntime: {
        command: delegatedRuntime.command,
        exitCode: delegatedRuntime.exitCode,
        signal: delegatedRuntime.signal,
        stdoutSnippet: delegatedRuntime.stdout.slice(-6000),
        stderrSnippet: delegatedRuntime.stderr.slice(-6000),
        summary: delegatedSummary,
        report: delegatedReport,
      },
      confirmationGate: { env: confirmEnv, requiredValue: 'true', confirmed: true },
      safety: baseSafety({
        localGcloudConfigRead: true,
        userAccessTokenProbe: true,
        adcAccessTokenProbe: true,
        cloudRunServiceMetadataReadback: true,
        sourceBridgeValidated: true,
        cloudRunJobExecution: Boolean(delegatedReport?.runtimeEvidence?.cloudRunExecution),
        qwenProviderCall: false,
        modelCall: false,
        qwenInference: false,
        cloudRunServiceUpdate: false,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

finish(
  {
    decision: 'completed_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime',
    execution: 'completed_single_bounded_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime',
    blocker: null,
    observedContext: { account: accountValue, project: projectValue },
    serviceReadback: { staging: stagingReadback, qwenWorker: qwenWorkerReadback },
    sourceBridge: bridge,
    bridgeSmoke,
    delegatedRuntime: {
      command: delegatedRuntime.command,
      exitCode: delegatedRuntime.exitCode,
      signal: delegatedRuntime.signal,
      summary: delegatedSummary,
      report: {
        decision: delegatedReport.decision,
        execution: delegatedReport.execution,
        runtimeEvidence: delegatedReport.runtimeEvidence,
        failClosedRestorePassed: delegatedReport.runtimeEvidence?.failClosedRestorePassed === true,
      },
    },
    runtimeEvidence: {
      qwenRuntimeRunId: delegatedReport.runtimeEvidence?.qwenRuntimeRunId ?? null,
      qwenColdStartRetryRunId: delegatedReport.runtimeEvidence?.qwenColdStartRetryRunId ?? null,
      adapterRunId: delegatedReport.runtimeEvidence?.adapterRunId ?? null,
      cloudRunExecution: delegatedReport.runtimeEvidence?.cloudRunExecution ?? null,
      httpStatus: delegatedReport.runtimeEvidence?.httpStatus ?? null,
      serviceReason: delegatedReport.runtimeEvidence?.serviceReason ?? null,
      structuredMetadataAccepted: delegatedReport.runtimeEvidence?.structuredMetadataAccepted ?? null,
      schemaValid: delegatedReport.runtimeEvidence?.schemaValid ?? null,
      objectCount: delegatedReport.runtimeEvidence?.objectCount ?? null,
      textLikeRegionCount: delegatedReport.runtimeEvidence?.textLikeRegionCount ?? null,
      failClosedRestorePassed: delegatedReport.runtimeEvidence?.failClosedRestorePassed === true,
    },
    confirmationGate: { env: confirmEnv, requiredValue: 'true', confirmed: true },
    safety: baseSafety({
      localGcloudConfigRead: true,
      userAccessTokenProbe: true,
      adcAccessTokenProbe: true,
      cloudRunServiceMetadataReadback: true,
      sourceBridgeValidated: true,
      qwenProviderCall: true,
      modelCall: true,
      qwenInference: true,
      cloudRunJobExecution: true,
      cloudRunServiceUpdate: true,
    }),
    stillBlocked: {
      arbitraryUserMedia: true,
      publicArtifacts: true,
      signedUrlSourceOfTruth: true,
      creditSpendOrPersistentCreditMutation: true,
      broadExternalBetaAudience: true,
      paidProduction: true,
      production: true,
      finalDeliveryExport: true,
    },
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
  },
  0,
)
