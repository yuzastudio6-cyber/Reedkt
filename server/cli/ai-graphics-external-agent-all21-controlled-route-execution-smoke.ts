import fs from 'node:fs'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  type AiGraphicsExternalBetaToolCallRequest,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision =
  'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed'
const status =
  'external_agent_all21_controlled_route_execution_passed_with_gpu_on_demand'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.md'

const cpuStaticTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
)
const browserRuntimeTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS,
)
const gpuModelTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
)

type ControlledToolGroup = 'cpu_static' | 'browser_runtime' | 'gpu_model'

interface ControlledRouteExecutionResult {
  toolId: string
  capabilityId: string
  group: ControlledToolGroup
  statusCode: number
  ok: boolean
  routeStatus: string | null
  externalAgentExecutionState:
    | 'executable'
    | 'blocked_with_reason'
    | 'failed_with_diagnostics'
    | null
  blockingReasonCode: string | null
  failureDiagnostics: string | null
  controlledAdapterExecutedNow: boolean
  controlledAdapterInvokedNow: boolean
  localPackageExecutionPerformed: boolean
  localGpuModelRuntimeExecutionPerformed: boolean
  gpuRuntimeShouldStartNow: boolean
  outputKind: string | null
  outputSha256: string | null
  publicArtifactCreated: boolean
  signedUrlCreated: boolean
  workerDispatchPerformed: boolean
  providerRuntimePerformed: boolean
  runtimeReadyNow: boolean
  externalBetaReadyNow: boolean
  productionReadyNow: boolean
}

interface ScopedGpuModelLocalDevRouteAttempt {
  summary: string
  requestedToolId: string
  requestedRuntimeBackend: 'docker_container'
  expectedBlockingReasonCode: string
  privateOutputDirectory: string
  privateSourceImageLocalPath: string
  result: ControlledRouteExecutionResult
  booleans: {
    scopedGpuModelLocalDevRouteAttemptPerformed: true
    scopedGpuModelLocalDevRouteAttemptAccepted: boolean
    scopedGpuModelLocalDevRouteAttemptBlockedWithReason: boolean
    scopedGpuModelRuntimeContainerPayloadAccepted: boolean
    scopedGpuModelRuntimeExecutionPerformed: false
    scopedGpuModelGpuRuntimeShouldStartNow: false
    scopedGpuModelPublicArtifactCreated: false
    scopedGpuModelSignedUrlCreated: false
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function groupForTool(toolId: string): ControlledToolGroup {
  if (cpuStaticTools.has(toolId)) return 'cpu_static'
  if (browserRuntimeTools.has(toolId)) return 'browser_runtime'
  if (gpuModelTools.has(toolId)) return 'gpu_model'
  throw new Error(`Unsupported AI graphics tool id: ${toolId}`)
}

function buildRuntimeEnv(gpuModelControlledExecutionEnabled: boolean) {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: 'true',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED:
      'false',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG]:
      'true',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG]:
      'true',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG]:
      'true',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG]:
      gpuModelControlledExecutionEnabled ? 'true' : 'false',
    AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED:
      'false',
    AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED:
      'false',
  })
}

async function withServer<T>(
  gpuModelControlledExecutionEnabled: boolean,
  callback: (baseUrl: string) => Promise<T>,
) {
  const app = createReeditProApiApp(
    buildRuntimeEnv(gpuModelControlledExecutionEnabled),
  )
  const server = app.listen(0, '127.0.0.1') as Server
  await once(server, 'listening')
  const address = server.address() as AddressInfo
  try {
    return await callback(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
}

async function postToolCall(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
) {
  const response = await fetch(
    `${baseUrl}${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': request.traceId,
      },
      body: JSON.stringify(request),
    },
  )
  const text = await response.text()
  let body: Record<string, any> | null = null
  try {
    body = JSON.parse(text) as Record<string, any>
  } catch {
    body = null
  }
  return { response, body }
}

function controlledRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsExternalBetaToolCallRequest {
  return {
    ...request,
    requestId: request.requestId.replace(
      'blocked-details-',
      'all21-controlled-route-execution-',
    ),
    traceId: request.traceId.replace(
      'blocked-details',
      'all21-controlled-route-execution',
    ),
    payload: groupForTool(request.toolId) === 'gpu_model'
      ? {}
      : undefined,
  }
}

function scopedGpuModelLocalDevRouteAttemptRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsExternalBetaToolCallRequest {
  const privateOutputDirectory =
    '.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia'
  const privateSourceImageLocalPath =
    `${privateOutputDirectory}/private-approved-frame.ppm`

  return {
    ...request,
    requestId: 'all21-controlled-route-execution-scoped-gpu-model-runtime-attempt-kornia',
    approvedPlanSnapshotId:
      'approved-snapshot-all21-controlled-route-execution-scoped-gpu-model-runtime-attempt-kornia',
    creditReservationId:
      'credit-reservation-all21-controlled-route-execution-scoped-gpu-model-runtime-attempt-kornia',
    privateArtifactManifestRef:
      'private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/kornia/artifact-manifest',
    toolRouteApprovalRef:
      'private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/kornia/tool-route-approval',
    workerApprovalRef:
      'private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/kornia/worker-approval',
    runtimeEnqueueApprovalRef:
      'private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/kornia/runtime-enqueue-approval',
    ownerRuntimeApprovalRef:
      'private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/kornia/owner-runtime-approval',
    nativeGpuRuntimeProofRef:
      'private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/kornia/native-gpu-runtime-proof',
    externalBetaPerToolRuntimeProofRef:
      'private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/kornia/external-beta-per-tool-runtime-proof',
    traceId:
      'trace-all21-controlled-route-execution-scoped-gpu-model-runtime-attempt-kornia',
    payload: {
      mode: 'local_dev',
      enableGpuModelControlledExecution: true,
      externalAgentAll21ControlledRouteExecutionSmoke: true,
      scopedGpuModelLocalDevRouteAttempt: true,
      privateOutputOnly: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      runtimeExecutionBackend: 'docker_container',
      runtimeContainerGpu: true,
      outputDirectory: privateOutputDirectory,
      sourceImageLocalPath: privateSourceImageLocalPath,
      representativeFrameLocalPath: privateSourceImageLocalPath,
      timeoutMs: 30_000,
      toolExecutionPerformed: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

async function runControlledCase(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
): Promise<ControlledRouteExecutionResult> {
  const { response, body } = await postToolCall(baseUrl, request)
  const data = body?.data ?? {}
  const booleans = data.booleans ?? {}
  const adapterResult = data.adapterResult ?? data.controlledAdapterResult ?? {}
  const output = adapterResult.output ?? {}
  const group = groupForTool(request.toolId)
  const localGpuModelRuntimeExecutionPerformed =
    adapterResult.localGpuModelRuntimeExecutionPerformed === true

  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    group,
    statusCode: response.status,
    ok: body?.ok === true,
    routeStatus: typeof data.routeStatus === 'string'
      ? data.routeStatus
      : null,
    externalAgentExecutionState:
      data.externalAgentExecutionState === 'executable' ||
      data.externalAgentExecutionState === 'blocked_with_reason' ||
      data.externalAgentExecutionState === 'failed_with_diagnostics'
        ? data.externalAgentExecutionState
        : null,
    blockingReasonCode: typeof data.blockingReasonCode === 'string'
      ? data.blockingReasonCode
      : null,
    failureDiagnostics: typeof data.failureDiagnostics === 'string'
      ? data.failureDiagnostics
      : null,
    controlledAdapterExecutedNow:
      adapterResult.controlledAdapterExecutedNow === true,
    controlledAdapterInvokedNow:
      adapterResult.controlledAdapterInvokedNow === true ||
      adapterResult.controlledAdapterExecutedNow === true,
    localPackageExecutionPerformed:
      booleans.localCpuStaticPackageExecutionPerformed === true ||
      booleans.localBrowserRuntimePackageExecutionPerformed === true ||
      adapterResult.localCpuStaticPackageExecutionPerformed === true ||
      adapterResult.localBrowserRuntimePackageExecutionPerformed === true,
    localGpuModelRuntimeExecutionPerformed,
    gpuRuntimeShouldStartNow:
      data.gpuRuntimeShouldStartNow === true ||
      booleans.gpuRuntimeShouldStartNow === true ||
      adapterResult.gpuRuntimeShouldStartNow === true,
    outputKind: typeof output.outputKind === 'string'
      ? output.outputKind
      : null,
    outputSha256: typeof output.privateArtifactSha256 === 'string'
      ? output.privateArtifactSha256
      : null,
    publicArtifactCreated:
      data.outputAccess?.publicArtifactCreated === true ||
      booleans.publicArtifactCreated === true ||
      adapterResult.publicArtifactCreated === true,
    signedUrlCreated:
      data.outputAccess?.signedUrlCreated === true ||
      booleans.signedUrlCreated === true ||
      adapterResult.signedUrlCreated === true,
    workerDispatchPerformed: booleans.workerDispatchPerformed === true,
    providerRuntimePerformed: booleans.providerRuntimePerformed === true,
    runtimeReadyNow: booleans.runtimeReadyNow === true,
    externalBetaReadyNow: booleans.externalBetaReadyNow === true,
    productionReadyNow: booleans.productionReadyNow === true,
  }
}

function buildScopedGpuModelLocalDevRouteAttempt(
  result: ControlledRouteExecutionResult,
): ScopedGpuModelLocalDevRouteAttempt {
  return {
    summary:
      'POSTs a scoped GPU/model local-dev runtime request through the mounted external-agent route. The request includes explicit private local input/output paths and runtimeExecutionBackend=docker_container, but intentionally omits runtimeContainerImage so the route proves payload forwarding into the GPU/model adapter while blocking before any GPU startup or model execution.',
    requestedToolId: result.toolId,
    requestedRuntimeBackend: 'docker_container',
    expectedBlockingReasonCode: 'gpu_model_runtime_container_image_missing',
    privateOutputDirectory:
      '.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia',
    privateSourceImageLocalPath:
      '.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia/private-approved-frame.ppm',
    result,
    booleans: {
      scopedGpuModelLocalDevRouteAttemptPerformed: true,
      scopedGpuModelLocalDevRouteAttemptAccepted:
        result.statusCode === 200 &&
        result.ok === true &&
        result.controlledAdapterInvokedNow === true,
      scopedGpuModelLocalDevRouteAttemptBlockedWithReason:
        result.externalAgentExecutionState === 'blocked_with_reason' &&
        result.blockingReasonCode === 'gpu_model_runtime_container_image_missing',
      scopedGpuModelRuntimeContainerPayloadAccepted:
        result.blockingReasonCode === 'gpu_model_runtime_container_image_missing',
      scopedGpuModelRuntimeExecutionPerformed: false,
      scopedGpuModelGpuRuntimeShouldStartNow: false,
      scopedGpuModelPublicArtifactCreated: false,
      scopedGpuModelSignedUrlCreated: false,
    },
  }
}

function validateResults(
  results: ControlledRouteExecutionResult[],
  disabledGpuStatus: number,
  scopedGpuModelLocalDevRouteAttempt: ScopedGpuModelLocalDevRouteAttempt,
) {
  assert(disabledGpuStatus === 409, `disabled GPU route should return 409, got ${disabledGpuStatus}`)
  assert(results.length === 21, `Expected 21 route results, got ${results.length}`)
  const scopedResult = scopedGpuModelLocalDevRouteAttempt.result
  assert(scopedResult.toolId === 'kornia', 'scoped GPU/model route attempt should use kornia')
  assert(scopedResult.statusCode === 200, `scoped GPU/model route attempt did not return HTTP 200`)
  assert(scopedResult.ok === true, 'scoped GPU/model route attempt did not return ok envelope')
  assert(scopedResult.controlledAdapterInvokedNow === true, 'scoped GPU/model route attempt did not invoke adapter')
  assert(scopedResult.controlledAdapterExecutedNow === false, 'scoped GPU/model route attempt should not execute runtime without container image')
  assert(scopedResult.externalAgentExecutionState === 'blocked_with_reason', 'scoped GPU/model route attempt should block with reason')
  assert(
    scopedResult.blockingReasonCode === 'gpu_model_runtime_container_image_missing',
    `scoped GPU/model route attempt blocking reason mismatch: ${scopedResult.blockingReasonCode}`,
  )
  assert(scopedResult.failureDiagnostics === null, 'scoped GPU/model route attempt should not fail')
  assert(scopedResult.localGpuModelRuntimeExecutionPerformed === false, 'scoped GPU/model route attempt performed runtime unexpectedly')
  assert(scopedResult.gpuRuntimeShouldStartNow === false, 'scoped GPU/model route attempt started GPU unexpectedly')
  assert(scopedResult.publicArtifactCreated === false, 'scoped GPU/model route attempt created public artifact')
  assert(scopedResult.signedUrlCreated === false, 'scoped GPU/model route attempt created signed URL')
  assert(scopedGpuModelLocalDevRouteAttempt.booleans.scopedGpuModelLocalDevRouteAttemptAccepted === true, 'scoped GPU/model route attempt was not accepted')
  assert(scopedGpuModelLocalDevRouteAttempt.booleans.scopedGpuModelLocalDevRouteAttemptBlockedWithReason === true, 'scoped GPU/model route attempt did not block with expected reason')
  assert(scopedGpuModelLocalDevRouteAttempt.booleans.scopedGpuModelRuntimeContainerPayloadAccepted === true, 'scoped GPU/model route attempt did not reach container runtime branch')

  for (const result of results) {
    assert(result.statusCode === 200, `${result.toolId} did not return HTTP 200`)
    assert(result.ok === true, `${result.toolId} did not return ok envelope`)
    assert(result.controlledAdapterInvokedNow === true, `${result.toolId} adapter was not invoked`)
    assert(result.publicArtifactCreated === false, `${result.toolId} created public artifact`)
    assert(result.signedUrlCreated === false, `${result.toolId} created signed URL`)
    assert(result.workerDispatchPerformed === false, `${result.toolId} dispatched worker`)
    assert(result.providerRuntimePerformed === false, `${result.toolId} ran provider runtime`)
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime unexpectedly`)
    assert(result.runtimeReadyNow === false, `${result.toolId} claimed runtime readiness`)
    assert(result.externalBetaReadyNow === false, `${result.toolId} claimed external beta readiness`)
    assert(result.productionReadyNow === false, `${result.toolId} claimed production readiness`)

    if (result.group === 'cpu_static') {
      assert(result.externalAgentExecutionState === 'executable', `${result.toolId} CPU/static execution state mismatch`)
      assert(result.blockingReasonCode === null, `${result.toolId} CPU/static returned blocking reason`)
      assert(result.failureDiagnostics === null, `${result.toolId} CPU/static returned failure diagnostics`)
      assert(
        result.routeStatus ===
          'external_beta_tool_call_route_cpu_static_controlled_execution_private_output_ready',
        `${result.toolId} CPU/static route status mismatch`,
      )
      assert(result.controlledAdapterExecutedNow === true, `${result.toolId} CPU/static adapter did not execute`)
      assert(result.localPackageExecutionPerformed === true, `${result.toolId} CPU/static package execution missing`)
      assert(Boolean(result.outputKind), `${result.toolId} missing private output kind`)
      assert(Boolean(result.outputSha256), `${result.toolId} missing private output hash`)
    }

    if (result.group === 'browser_runtime') {
      assert(result.externalAgentExecutionState === 'executable', `${result.toolId} browser execution state mismatch`)
      assert(result.blockingReasonCode === null, `${result.toolId} browser returned blocking reason`)
      assert(result.failureDiagnostics === null, `${result.toolId} browser returned failure diagnostics`)
      assert(
        result.routeStatus ===
          'external_beta_tool_call_route_browser_runtime_controlled_execution_private_output_ready',
        `${result.toolId} browser route status mismatch`,
      )
      assert(result.controlledAdapterExecutedNow === true, `${result.toolId} browser adapter did not execute`)
      assert(result.localPackageExecutionPerformed === true, `${result.toolId} browser package execution missing`)
      assert(Boolean(result.outputKind), `${result.toolId} missing private output kind`)
      assert(Boolean(result.outputSha256), `${result.toolId} missing private output hash`)
    }

    if (result.group === 'gpu_model') {
      assert(result.externalAgentExecutionState === 'blocked_with_reason', `${result.toolId} GPU/model execution state mismatch`)
      assert(Boolean(result.blockingReasonCode), `${result.toolId} GPU/model missing blocking reason code`)
      assert(result.failureDiagnostics === null, `${result.toolId} GPU/model returned failure diagnostics in blocked state`)
      assert(
        result.routeStatus ===
          'controlled_gpu_model_route_blocked_with_reason',
        `${result.toolId} GPU/model route status mismatch`,
      )
      assert(result.controlledAdapterExecutedNow === false, `${result.toolId} GPU/model adapter should not perform local runtime in default smoke`)
      assert(result.localPackageExecutionPerformed === false, `${result.toolId} GPU/model package execution should stay off by default`)
      assert(result.localGpuModelRuntimeExecutionPerformed === false, `${result.toolId} GPU/model runtime performed unexpectedly`)
      assert(result.outputKind === null, `${result.toolId} GPU/model smoke should not create output kind`)
      assert(result.outputSha256 === null, `${result.toolId} GPU/model smoke should not create output hash`)
    }
  }
}

function buildReport(
  disabledGpuStatus: number,
  results: ControlledRouteExecutionResult[],
  scopedGpuModelLocalDevRouteAttempt: ScopedGpuModelLocalDevRouteAttempt,
) {
  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-all21-controlled-route-execution-smoke',
    decision,
    status,
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlags: {
      cpuStatic:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
      browserRuntime:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
      gpuModelRuntimeAdmission:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
      gpuModelControlledExecution:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG,
    },
    disabledGpuControlledRouteStatus: disabledGpuStatus,
    results,
    scopedGpuModelLocalDevRouteAttempt,
    counts: {
      totalAiGraphicsTools: 21,
      controlledRouteHttp200Tools: results.filter((item) => item.statusCode === 200).length,
      controlledRouteCallableTools:
        results.filter((item) => item.statusCode === 200 && item.controlledAdapterInvokedNow).length,
      controlledRouteAdapterInvokedTools:
        results.filter((item) => item.controlledAdapterInvokedNow).length,
      controlledRouteAdapterExecutedTools:
        results.filter((item) => item.controlledAdapterExecutedNow).length,
      realRuntimeExecutedTools:
        results.filter((item) => item.controlledAdapterExecutedNow).length,
      executableStateTools:
        results.filter((item) => item.externalAgentExecutionState === 'executable').length,
      blockedWithReasonStateTools:
        results.filter((item) => item.externalAgentExecutionState === 'blocked_with_reason').length,
      failedWithDiagnosticsStateTools:
        results.filter((item) => item.externalAgentExecutionState === 'failed_with_diagnostics').length,
      cpuStaticControlledRouteExecutedTools:
        results.filter((item) => item.group === 'cpu_static' && item.controlledAdapterExecutedNow).length,
      browserRuntimeControlledRouteExecutedTools:
        results.filter((item) => item.group === 'browser_runtime' && item.controlledAdapterExecutedNow).length,
      gpuModelControlledRouteInvokedTools:
        results.filter((item) => item.group === 'gpu_model' && item.controlledAdapterInvokedNow).length,
      gpuModelRuntimeProofRequiredTools:
        results.filter((item) => item.group === 'gpu_model' && !item.localGpuModelRuntimeExecutionPerformed).length,
      localPackageExecutionPerformedTools:
        results.filter((item) => item.localPackageExecutionPerformed).length,
      localGpuModelRuntimeExecutionPerformedTools:
        results.filter((item) => item.localGpuModelRuntimeExecutionPerformed).length,
      gpuRuntimeShouldStartNowTools:
        results.filter((item) => item.gpuRuntimeShouldStartNow).length,
      workerDispatchPerformedTools:
        results.filter((item) => item.workerDispatchPerformed).length,
      providerRuntimePerformedTools:
        results.filter((item) => item.providerRuntimePerformed).length,
      publicArtifactCreatedTools:
        results.filter((item) => item.publicArtifactCreated).length,
      signedUrlCreatedTools:
        results.filter((item) => item.signedUrlCreated).length,
      scopedGpuModelLocalDevRouteAttemptTools: 1,
      scopedGpuModelLocalDevRouteAttemptBlockedWithReasonTools:
        scopedGpuModelLocalDevRouteAttempt.booleans
          .scopedGpuModelLocalDevRouteAttemptBlockedWithReason
          ? 1
          : 0,
      scopedGpuModelLocalDevRouteAttemptRuntimeExecutedTools: 0,
    },
    booleans: {
      all21ControlledRouteExecutionSmokePassed: true,
      all21ToolsCovered: results.length === 21,
      all21ToolsReturnedHttp200: results.every((item) => item.statusCode === 200),
      all21ControlledAdaptersInvoked: results.every((item) => item.controlledAdapterInvokedNow),
      cpuStaticControlledAdaptersExecuted: results.filter((item) => item.group === 'cpu_static').every((item) => item.controlledAdapterExecutedNow),
      browserRuntimeControlledAdaptersExecuted: results.filter((item) => item.group === 'browser_runtime').every((item) => item.controlledAdapterExecutedNow),
      gpuModelControlledAdaptersInvoked: results.filter((item) => item.group === 'gpu_model').every((item) => item.controlledAdapterInvokedNow),
      normalizedExternalAgentExecutionStatesReturned:
        results.every((item) => (
          item.externalAgentExecutionState === 'executable' ||
          item.externalAgentExecutionState === 'blocked_with_reason' ||
          item.externalAgentExecutionState === 'failed_with_diagnostics'
        )),
      thirteenToolsReturnExecutableState:
        results.filter((item) => item.externalAgentExecutionState === 'executable').length === 13,
      eightGpuModelToolsReturnBlockedWithReasonState:
        results.filter((item) => item.externalAgentExecutionState === 'blocked_with_reason').length === 8,
      noToolsReturnFailedWithDiagnosticsState:
        results.filter((item) => item.externalAgentExecutionState === 'failed_with_diagnostics').length === 0,
      agentCanCallAll21ControlledRoutesNow: true,
      agentCanExecuteToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteRealRuntimeFor13ToolsNow: true,
      agentCanExecuteRealRuntimeForAll21ToolsNow: false,
      gpuModelRuntimeProofAcceptedNow: false,
      routeExecutionApprovedNow: true,
      routeExecutionPerformed: true,
      controlledToolRouteExecutionPerformed: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      scopedGpuModelLocalDevRouteAttemptAccepted:
        scopedGpuModelLocalDevRouteAttempt.booleans
          .scopedGpuModelLocalDevRouteAttemptAccepted,
      scopedGpuModelLocalDevRouteAttemptBlockedWithReason:
        scopedGpuModelLocalDevRouteAttempt.booleans
          .scopedGpuModelLocalDevRouteAttemptBlockedWithReason,
      scopedGpuModelRuntimeContainerPayloadAccepted:
        scopedGpuModelLocalDevRouteAttempt.booleans
          .scopedGpuModelRuntimeContainerPayloadAccepted,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformedOutsideControlledAdapter: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
    },
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.results
    .map((item) => (
      `| \`${item.toolId}\` | \`${item.group}\` | \`${item.capabilityId}\` | \`${item.externalAgentExecutionState}\` | \`${item.statusCode}\` | \`${item.controlledAdapterInvokedNow}\` | \`${item.controlledAdapterExecutedNow}\` | \`${item.localPackageExecutionPerformed}\` | \`${item.localGpuModelRuntimeExecutionPerformed}\` | \`${item.gpuRuntimeShouldStartNow}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Agent All-21 Controlled Route Execution Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This smoke starts the real Express app and POSTs all 21 AI graphics tool calls through \`${report.routePath}\` with the controlled CPU/static, browser-runtime, and GPU/model route flags enabled. It proves the agent-facing route can accept every tool call now. It does not claim all 21 tools have real runtime execution proof: CPU/static and browser-runtime adapters execute now, while GPU/model adapters are route-callable and remain blocked from runtime execution until native GPU proof and reviewed private model manifests are accepted.

## Tool Results

| Tool | Group | Capability | External-agent state | HTTP status | Adapter invoked | Adapter executed | Local package execution | Local GPU/model runtime | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Scoped GPU/model route attempt

- \`toolId\`: \`${report.scopedGpuModelLocalDevRouteAttempt.requestedToolId}\`
- \`runtimeExecutionBackend\`: \`${report.scopedGpuModelLocalDevRouteAttempt.requestedRuntimeBackend}\`
- \`externalAgentExecutionState\`: \`${report.scopedGpuModelLocalDevRouteAttempt.result.externalAgentExecutionState}\`
- \`blockingReasonCode\`: \`${report.scopedGpuModelLocalDevRouteAttempt.result.blockingReasonCode}\`
- \`gpuRuntimeShouldStartNow\`: \`${report.scopedGpuModelLocalDevRouteAttempt.result.gpuRuntimeShouldStartNow}\`

${report.scopedGpuModelLocalDevRouteAttempt.summary}

## Boundary

This smoke does not dispatch Workers, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, download model weights, unlock paid production, or mark runtime/beta/production ready. CPU/static and browser-runtime adapters execute in the explicit mock/local controlled route. GPU/model adapters are invoked through the controlled route, but local GPU/model runtime does not start until a scoped request supplies explicit local-dev runtime inputs, reviewed private manifests, accepted native GPU proof, and approval refs.
`
}

async function main() {
  const cases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
    .map((item) => controlledRequest(item.request))
  const gpuCase = cases.find((item) => groupForTool(item.toolId) === 'gpu_model')
  assert(gpuCase, 'Expected at least one GPU/model case')

  const disabledGpuStatus = await withServer(false, async (baseUrl) => {
    const { response } = await postToolCall(baseUrl, gpuCase)
    return response.status
  })

  const results = await withServer(true, async (baseUrl) => {
    const rows: ControlledRouteExecutionResult[] = []
    for (const request of cases) {
      rows.push(await runControlledCase(baseUrl, request))
    }
    return rows
  })

  const scopedGpuModelLocalDevRouteAttemptResult = await withServer(
    true,
    async (baseUrl) => runControlledCase(
      baseUrl,
      scopedGpuModelLocalDevRouteAttemptRequest({
        ...gpuCase,
        toolId: 'kornia',
        capabilityId: 'tensor_image_ops',
      }),
    ),
  )
  const scopedGpuModelLocalDevRouteAttempt =
    buildScopedGpuModelLocalDevRouteAttempt(
      scopedGpuModelLocalDevRouteAttemptResult,
    )

  validateResults(results, disabledGpuStatus, scopedGpuModelLocalDevRouteAttempt)
  const report = buildReport(
    disabledGpuStatus,
    results,
    scopedGpuModelLocalDevRouteAttempt,
  )
  if (process.argv.includes('--write-records')) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
