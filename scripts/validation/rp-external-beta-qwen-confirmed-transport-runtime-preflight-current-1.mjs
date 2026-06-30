#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-QWEN-CONFIRMED-TRANSPORT-RUNTIME-PREFLIGHT-CURRENT-1'
const confirmationVar = 'REEDITPRO_CONFIRM_QWEN_TRANSPORT_RUNTIME_PREFLIGHT_CURRENT_1'
const runtimeGateVar = 'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE'
const targetRefVar = 'REEDITPRO_EXTERNAL_BETA_TARGET_REF'
const runtimeScopeVar = 'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE'
const expectedAccount = 'aiediting@reeditpro.com'
const project = 'reeditpro'
const region = 'us-central1'
const stagingService = 'reeditpro-staging-api'
const qwenWorkerService = 'reeditpro-qwen2-5-vl-l4-worker'
const targetRef = 'wmyyttnynmteqgcdishd'
const runtimeScope = 'approved_snapshot_structured_metadata_only'
const routePath = '/api/providers/qwen2-5-vl/structured-visual-metadata'
const routeId = 'providers.qwen25Vl.structuredVisualMetadataPlan'
const idempotencyKey = 'qwen-transport-runtime-preflight-current-1-single-tester-fixture-v1'
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)
const runEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const timeoutMs = 30_000

fs.mkdirSync(outputDir, { recursive: true })

const fixtureBody = {
  workspaceId: 'external_beta_single_tester_workspace',
  projectId: 'external_beta_qwen_transport_project',
  editSessionId: 'external_beta_qwen_transport_edit_session',
  requestId: 'qwen_transport_runtime_preflight_current_1',
  workspaceMembershipRef: 'workspace-membership://single-tester/qwen-transport-runtime-preflight-current-1',
  targetRef,
  workflowBindingId: 'workflow-binding://qwen-transport-runtime-preflight-current-1',
  adapterRequestId: 'adapter-request://qwen-transport-runtime-preflight-current-1',
  approvedSnapshotReadbackRef: 'approved-snapshot://qwen-transport-runtime-preflight-current-1/structured-metadata-only',
  creditReservationReadbackRef: 'credit-reservation://qwen-transport-runtime-preflight-current-1/no-spend',
  queueLeaseReadbackRef: 'queue-lease://qwen-transport-runtime-preflight-current-1/non-mutating-readiness',
  privateInputManifestReadbackRef: 'manifest://qwen-transport-runtime-preflight-current-1/private-input',
  privateArtifactManifestReadbackRef: 'manifest://qwen-transport-runtime-preflight-current-1/private-artifacts',
  privateArtifactChecksumReadbackRef: 'sha256:qwen-transport-runtime-preflight-current-1-private-artifacts',
  sourceSequenceMapReadbackRef: 'source-sequence-map://qwen-transport-runtime-preflight-current-1/generated-fixture',
  compiledIntentReadbackRef: 'compiled-intent://qwen-transport-runtime-preflight-current-1/generated-fixture',
  editPlanVersionReadbackRef: 'edit-plan-version://qwen-transport-runtime-preflight-current-1/generated-fixture',
  modelRoutingPolicyReadbackRef:
    'model-routing-policy://qwen-transport-runtime-preflight-current-1/qwen2-5-vl-structured-metadata-only',
  qaPolicyReadbackRef: 'qa-policy://qwen-transport-runtime-preflight-current-1/private-structured-metadata-only',
  routeReadbackExecutionRequested: false,
  providerModelCallRequested: false,
  workerDispatchRequested: false,
  mediaProcessingRequested: false,
  signedUrlCreationRequested: false,
  publicArtifactRequested: false,
  finalRenderExportRequested: false,
  externalBetaUnlockRequested: false,
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/ya29\.[A-Za-z0-9_-]+/g, 'ya29.[redacted]')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/eyJ[A-Za-z0-9._-]+/g, '[jwt-redacted]')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function fileSummary(file) {
  return {
    fileName: path.basename(file),
    path: file,
    bytes: fs.statSync(file).size,
    sha256: sha256(file),
  }
}

function runText(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: runEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 8 * 1024 * 1024,
  })
  return {
    ok: result.status === 0,
    exitCode: typeof result.status === 'number' ? result.status : 1,
    stdout: sanitize(result.stdout).trim(),
    stderr: sanitize(result.stderr).trim(),
    error: result.error?.message ? sanitize(result.error.message) : null,
  }
}

function runSecretText(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: runEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024,
  })
  return {
    ok: result.status === 0 && result.stdout.trim().length > 0,
    exitCode: typeof result.status === 'number' ? result.status : 1,
    secret: result.stdout.trim(),
    secretBytesObserved: Buffer.byteLength(result.stdout.trim()),
    stderr: sanitize(result.stderr).trim(),
    error: result.error?.message ? sanitize(result.error.message) : null,
  }
}

function parseServiceReadback(service) {
  const commandResult = runText('gcloud', [
    'run',
    'services',
    'describe',
    service,
    `--project=${project}`,
    `--region=${region}`,
    '--format=json(metadata.name,metadata.generation,status.conditions,status.latestReadyRevisionName,status.observedGeneration,status.traffic,status.url)',
  ])
  if (!commandResult.ok) {
    return { ok: false, service, commandResult }
  }

  try {
    const parsed = JSON.parse(commandResult.stdout)
    const readyCondition = (parsed?.status?.conditions ?? []).find((condition) => condition.type === 'Ready')
    return {
      ok: true,
      service,
      url: parsed?.status?.url ?? null,
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
    return { ok: false, service, commandResult, parseError: sanitize(error.message) }
  }
}

function baseSafety(overrides = {}) {
  return {
    localGcloudConfigRead: false,
    cloudRunServiceMetadataReadback: false,
    cloudRunInvocation: false,
    cloudRunDeployment: false,
    cloudRunServiceUpdate: false,
    identityTokenFetch: false,
    identityTokenValuePrinted: false,
    identityTokenValuePersistedInRepo: false,
    authHeaderPersistedInRepo: false,
    boundedRouteRequestSent: false,
    boundedStructuredMetadataFixtureOnly: false,
    routeHandlerReached: false,
    qwen25VlExecution: false,
    providerCall: false,
    modelCall: false,
    workerExecution: false,
    workerDispatch: false,
    serviceRoleRouteExecution: false,
    supabaseMutation: false,
    sqlExecution: false,
    secretPayloadAccess: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    generatedAssetCreation: false,
    creditMutation: false,
    stripePaymentProcessing: false,
    broadExternalBetaAudienceUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    rawPromptExecution: false,
    finalRenderExport: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    dockerExecution: false,
    remotionExecution: false,
    dependencyMutation: false,
    packageLockMutation: false,
    iamMutation: false,
    groupMembershipMutation: false,
    broadServiceRoleHandler: false,
    ...overrides,
  }
}

function finish(report, exitCode) {
  const finalReport = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    expectedContext: {
      account: expectedAccount,
      project,
      region,
      stagingService,
      qwenWorkerService,
      routeId,
      routePath,
      targetRef,
      runtimeScope,
    },
    ...report,
  }
  const reportPath = path.join(outputDir, 'qwen-confirmed-transport-runtime-preflight-current-1-report.json')
  writeJson(reportPath, finalReport)

  const manifestPath = path.join(outputDir, 'qwen-confirmed-transport-runtime-preflight-current-1-manifest.json')
  writeJson(manifestPath, {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [fileSummary(reportPath)],
  })

  const checksumsPath = path.join(outputDir, 'qwen-confirmed-transport-runtime-preflight-current-1-checksums.json')
  writeJson(checksumsPath, {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [fileSummary(reportPath), fileSummary(manifestPath)],
  })

  console.log(`${packet} result: ${finalReport.decision}`)
  if (finalReport.blocker) console.log(`Blocker: ${finalReport.blocker}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Output directory: ${outputDir}`)
  console.log(`Report: ${reportPath}`)
  console.log(`Manifest: ${manifestPath}`)
  console.log(`Checksums: ${checksumsPath}`)
  process.exit(exitCode)
}

function gateMismatchReport() {
  return {
    [confirmationVar]: process.env[confirmationVar] === 'true' ? 'true' : 'absent_or_not_true',
    [runtimeGateVar]: process.env[runtimeGateVar] === 'true' ? 'true' : 'absent_or_not_true',
    [targetRefVar]: process.env[targetRefVar] === targetRef ? targetRef : 'absent_or_mismatch',
    [runtimeScopeVar]: process.env[runtimeScopeVar] === runtimeScope ? runtimeScope : 'absent_or_mismatch',
  }
}

function classifyResponse(status, json, text) {
  const textLower = text.toLowerCase()
  const errorCode = json?.error?.code ?? json?.code ?? null
  const responseLooksFailClosed =
    status === 424 &&
    (errorCode === 'backend_runtime_required' ||
      errorCode === 'QWEN_RUNTIME_DISABLED' ||
      textLower.includes('backend_runtime_required') ||
      textLower.includes('fail') ||
      textLower.includes('blocked'))

  if (responseLooksFailClosed) {
    return {
      ok: true,
      decision: 'completed_confirmed_qwen_transport_runtime_preflight_route_reached_fail_closed_no_provider_execution',
      execution: 'completed_bounded_cloud_run_route_preflight_fail_closed_no_provider_or_worker_execution',
      routeHandlerReached: true,
      blocker: null,
    }
  }

  return {
    ok: false,
    decision: 'blocked_confirmed_qwen_transport_runtime_preflight',
    execution: 'blocked_route_response_classification_no_provider_or_worker_execution',
    routeHandlerReached: false,
    blocker: 'blocked_route_response_classification_failed',
  }
}

if (process.env[confirmationVar] !== 'true') {
  finish(
    {
      decision: 'blocked_confirmed_qwen_transport_runtime_preflight',
      execution: 'blocked_confirmation_absent_no_cloud_run_request',
      blocker: 'blocked_missing_qwen_transport_runtime_preflight_confirmation',
      gateObserved: gateMismatchReport(),
      safety: baseSafety(),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

if (
  process.env[runtimeGateVar] !== 'true' ||
  process.env[targetRefVar] !== targetRef ||
  process.env[runtimeScopeVar] !== runtimeScope
) {
  finish(
    {
      decision: 'blocked_confirmed_qwen_transport_runtime_preflight',
      execution: 'blocked_runtime_gate_mismatch_no_cloud_run_request',
      blocker: 'blocked_runtime_gate_env_mismatch',
      gateObserved: gateMismatchReport(),
      safety: baseSafety(),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const account = runText('gcloud', ['config', 'get-value', 'account'])
const configuredProject = runText('gcloud', ['config', 'get-value', 'project'])
const accountValue = account.stdout.split('\n').at(-1)?.trim()
const projectValue = configuredProject.stdout.split('\n').at(-1)?.trim()
if (!account.ok || !configuredProject.ok || accountValue !== expectedAccount || projectValue !== project) {
  finish(
    {
      decision: 'blocked_confirmed_qwen_transport_runtime_preflight',
      execution: 'blocked_gcloud_context_mismatch_no_cloud_run_request',
      blocker: 'blocked_identity_token_fetch_failed',
      observedContext: { account: accountValue ?? null, project: projectValue ?? null },
      commandResults: { account, configuredProject },
      gateObserved: gateMismatchReport(),
      safety: baseSafety({ localGcloudConfigRead: true }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const stagingReadback = parseServiceReadback(stagingService)
if (!stagingReadback.ok || stagingReadback.readyStatus !== 'True' || !stagingReadback.url) {
  finish(
    {
      decision: 'blocked_confirmed_qwen_transport_runtime_preflight',
      execution: 'blocked_cloud_run_service_metadata_readback_no_route_request',
      blocker: 'blocked_cloud_run_request_failed',
      observedContext: { account: accountValue, project: projectValue },
      serviceReadback: { staging: stagingReadback },
      gateObserved: gateMismatchReport(),
      safety: baseSafety({ localGcloudConfigRead: true, cloudRunServiceMetadataReadback: true }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const qwenReadback = parseServiceReadback(qwenWorkerService)
if (!qwenReadback.ok || qwenReadback.readyStatus !== 'True') {
  finish(
    {
      decision: 'blocked_confirmed_qwen_transport_runtime_preflight',
      execution: 'blocked_qwen_worker_metadata_readback_no_route_request',
      blocker: 'blocked_cloud_run_request_failed',
      observedContext: { account: accountValue, project: projectValue },
      serviceReadback: { staging: stagingReadback, qwenWorker: qwenReadback },
      gateObserved: gateMismatchReport(),
      safety: baseSafety({ localGcloudConfigRead: true, cloudRunServiceMetadataReadback: true }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

let token = null
let identityTokenMode = 'audience_scoped'
let tokenFetch = runSecretText('gcloud', ['auth', 'print-identity-token', `--audiences=${stagingReadback.url}`])
if (!tokenFetch.ok) {
  const audienceScopedError = tokenFetch.stderr || tokenFetch.error || 'audience_scoped_identity_token_unavailable'
  identityTokenMode = 'user_account_default_audience'
  tokenFetch = runSecretText('gcloud', ['auth', 'print-identity-token'])
  tokenFetch.audienceScopedFallbackReason = audienceScopedError
}
if (!tokenFetch.ok) {
  finish(
    {
      decision: 'blocked_confirmed_qwen_transport_runtime_preflight',
      execution: 'blocked_identity_token_fetch_no_route_request',
      blocker: 'blocked_identity_token_fetch_failed',
      observedContext: { account: accountValue, project: projectValue },
      serviceReadback: { staging: stagingReadback, qwenWorker: qwenReadback },
      tokenFetch: {
        ok: false,
        exitCode: tokenFetch.exitCode,
        secretBytesObserved: tokenFetch.secretBytesObserved,
        stderr: tokenFetch.stderr,
        error: tokenFetch.error,
        audienceScopedFallbackReason: tokenFetch.audienceScopedFallbackReason ?? null,
      },
      gateObserved: gateMismatchReport(),
      safety: baseSafety({
        localGcloudConfigRead: true,
        cloudRunServiceMetadataReadback: true,
        identityTokenFetch: true,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}
token = tokenFetch.secret

let responseSummary = null
let responseText = ''
let responseJson = null
try {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const response = await fetch(`${stagingReadback.url}${routePath}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(fixtureBody),
    signal: controller.signal,
  })
  clearTimeout(timeout)
  responseText = sanitize(await response.text())
  try {
    responseJson = responseText ? JSON.parse(responseText) : null
  } catch {
    responseJson = null
  }
  responseSummary = {
    httpStatus: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type') ?? null,
    bodySnippet: responseText.slice(0, 600),
    jsonSummary: responseJson
      ? {
          ok: responseJson.ok ?? null,
          statusCode: responseJson.statusCode ?? null,
          mockOnly: responseJson.mockOnly ?? null,
          errorCode: responseJson.error?.code ?? responseJson.code ?? null,
          dataKeys: responseJson.data ? Object.keys(responseJson.data).slice(0, 20) : [],
        }
      : null,
  }
} catch (error) {
  finish(
    {
      decision: 'blocked_confirmed_qwen_transport_runtime_preflight',
      execution: 'blocked_cloud_run_request_failed_no_provider_or_worker_execution',
      blocker: 'blocked_cloud_run_request_failed',
      observedContext: { account: accountValue, project: projectValue },
      serviceReadback: { staging: stagingReadback, qwenWorker: qwenReadback },
      tokenFetch: {
        ok: true,
        mode: identityTokenMode,
        secretBytesObserved: tokenFetch.secretBytesObserved,
        tokenValuePrinted: false,
        tokenValuePersistedInRepo: false,
      },
      routeRequest: {
        routeId,
        method: 'POST',
        path: routePath,
        idempotencyKey,
        timeoutMs,
        error: sanitize(error?.message || error),
      },
      gateObserved: gateMismatchReport(),
      safety: baseSafety({
        localGcloudConfigRead: true,
        cloudRunServiceMetadataReadback: true,
        cloudRunInvocation: true,
        identityTokenFetch: true,
        boundedRouteRequestSent: true,
        boundedStructuredMetadataFixtureOnly: true,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
} finally {
  token = null
}

const classification = classifyResponse(responseSummary.httpStatus, responseJson, responseText)
finish(
  {
    decision: classification.decision,
    execution: classification.execution,
    blocker: classification.blocker,
    observedContext: { account: accountValue, project: projectValue },
    gateObserved: gateMismatchReport(),
    serviceReadback: { staging: stagingReadback, qwenWorker: qwenReadback },
    tokenFetch: {
      ok: true,
      mode: identityTokenMode,
      secretBytesObserved: tokenFetch.secretBytesObserved,
      tokenValuePrinted: false,
      tokenValuePersistedInRepo: false,
    },
    routeRequest: {
      routeId,
      method: 'POST',
      path: routePath,
      idempotencyKey,
      timeoutMs,
      requestBody: fixtureBody,
      response: responseSummary,
    },
    readiness: {
      qwenTransportRuntimePreflightCurrent1: classification.ok
        ? 'passed_route_reached_fail_closed_no_provider_execution'
        : 'blocked_route_response_classification_failed',
      qwen25VlExecution: 'blocked_pending_separate_confirmed_provider_runtime_packet',
      providerModelCall: 'blocked_pending_separate_confirmed_provider_runtime_packet',
      workerDispatch: 'blocked_pending_separate_confirmed_worker_dispatch_packet',
      broadExternalBetaExpansion: 'blocked_no_additional_named_tester_list',
      externalProduction: 'blocked_pending_broad_beta_tool_runtime_billing_support_legal_security_and_final_export_gates',
      productReadyEndToEndLocalOssTools: 0,
      nextMilestone: classification.ok
        ? 'RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1'
        : 'RP-EXTERNAL-BETA-QWEN-CONFIRMED-TRANSPORT-RUNTIME-PREFLIGHT-CURRENT-1R',
    },
    safety: baseSafety({
      localGcloudConfigRead: true,
      cloudRunServiceMetadataReadback: true,
      cloudRunInvocation: true,
      identityTokenFetch: true,
      boundedRouteRequestSent: true,
      boundedStructuredMetadataFixtureOnly: true,
      routeHandlerReached: classification.routeHandlerReached,
    }),
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
  },
  classification.ok ? 0 : 1,
)
