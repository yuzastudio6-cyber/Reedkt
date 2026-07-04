import fs from 'node:fs'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG,
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
  type AiGraphicsExternalBetaToolCallRequest,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
  type AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
} from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision = 'ai_graphics_external_agent_single_tool_call_ready'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-single-tool-call.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-single-tool-call.md'
const canonicalGpuModelRuntimeContainerImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const allowedCapabilityIds = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
] as const

type ToolGroup = 'cpu_static' | 'browser_runtime' | 'gpu_model'
type CapabilityId = typeof allowedCapabilityIds[number]
type ExpectedExecutionState =
  | 'executable'
  | 'blocked_with_reason'
  | 'failed_with_diagnostics'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function stringArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  return typeof value === 'string' && value.trim() && !value.startsWith('--')
    ? value
    : undefined
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function isLocalArtifactPath(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/')
  return normalized === '.local-artifacts' ||
    normalized.startsWith('.local-artifacts/')
}

function groupForTool(toolId: string): ToolGroup {
  if (AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS.includes(toolId as any)) {
    return 'cpu_static'
  }
  if (AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS.includes(toolId as any)) {
    return 'browser_runtime'
  }
  if (AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.includes(toolId as any)) {
    return 'gpu_model'
  }
  throw new Error(`Unsupported AI graphics tool id: ${toolId}`)
}

function isGpuModelTool(
  toolId: string,
): toolId is AiGraphicsExternalAgentGpuModelControlledAdapterToolId {
  return AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.includes(
    toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  )
}

function capabilityArg(): CapabilityId | undefined {
  const value = stringArg('--capability')
  if (!value) return undefined
  assert(
    allowedCapabilityIds.includes(value as CapabilityId),
    `Unsupported --capability value: ${value}`,
  )
  return value as CapabilityId
}

function expectedStateArg(): ExpectedExecutionState | undefined {
  const value = stringArg('--expect-state')
  if (!value) return undefined
  assert(
    value === 'executable' ||
      value === 'blocked_with_reason' ||
      value === 'failed_with_diagnostics',
    `Unsupported --expect-state value: ${value}`,
  )
  return value
}

function resultOutPath(): string | undefined {
  const value = stringArg('--result-out')
  if (!value) return undefined
  assert(
    isLocalArtifactPath(value),
    '--result-out must stay under .local-artifacts/',
  )
  return value
}

function ensureParentDirectory(filePath: string): void {
  const parent = path.dirname(filePath)
  if (parent && parent !== '.') fs.mkdirSync(parent, { recursive: true })
}

function buildRuntimeEnv() {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    [AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG]: 'true',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: 'false',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED:
      'false',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG]:
      'true',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG]:
      'true',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG]:
      'true',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG]:
      'true',
    AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED:
      'false',
    AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED:
      'false',
  })
}

async function withServer<T>(callback: (baseUrl: string) => Promise<T>) {
  const app = createReeditProApiApp(buildRuntimeEnv())
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

function gpuModelSourceImageRequired(toolId: string): boolean {
  return !['torch_torchvision', 'transformers'].includes(toolId)
}

function gpuRuntimePayload(toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId) {
  const attemptGpuRuntime = hasFlag('--attempt-gpu-runtime')
  const outputDirectory = stringArg('--gpu-output-dir')
  if (attemptGpuRuntime) {
    assert(outputDirectory, '--attempt-gpu-runtime requires --gpu-output-dir')
    assert(
      isLocalArtifactPath(outputDirectory),
      '--gpu-output-dir must stay under .local-artifacts/',
    )
  }

  const payload: Record<string, unknown> = {
    externalAgentSingleToolCall: true,
    privateOutputOnly: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    gpuRuntimeOnDemandOnly: true,
    noIdleGpuRuntimeApproved: true,
    enableGpuModelControlledExecution: attemptGpuRuntime,
    toolExecutionPerformed: false,
    gpuRuntimeShouldStartNow: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
  }

  if (!attemptGpuRuntime) return payload

  const sourceImageLocalPath = stringArg('--source-image')
  const runtimeBackend = stringArg('--runtime-backend') === 'host_python'
    ? 'host_python'
    : 'docker_container'
  payload.mode = 'local_dev'
  payload.runtimeExecutionBackend = runtimeBackend
  payload.outputDirectory = outputDirectory
  payload.timeoutMs = Number(stringArg('--timeout-ms') ?? '30000')
  if (runtimeBackend === 'docker_container') {
    payload.runtimeContainerGpu = !hasFlag('--no-runtime-container-gpu')
    payload.runtimeContainerImage =
      stringArg('--runtime-container-image') ??
      canonicalGpuModelRuntimeContainerImage
    payload.runtimeContainerPlatform =
      stringArg('--runtime-container-platform') ?? 'linux/amd64'
  }
  if (sourceImageLocalPath) {
    payload.sourceImageLocalPath = sourceImageLocalPath
    payload.representativeFrameLocalPath = sourceImageLocalPath
  }
  if (toolId === 'sam2') payload.sam2CheckpointLocalPath = stringArg('--sam2-checkpoint')
  if (toolId === 'birefnet') payload.birefnetModelLocalPath = stringArg('--birefnet-model')
  if (toolId === 'real_esrgan') payload.realEsrganModelLocalPath = stringArg('--real-esrgan-model')
  if (toolId === 'rembg') payload.rembgModelLocalPath = stringArg('--rembg-model')
  if (toolId === 'transparent_background') {
    payload.transparentBackgroundCheckpointLocalPath =
      stringArg('--transparent-background-checkpoint')
  }

  if (gpuModelSourceImageRequired(toolId) && !sourceImageLocalPath) {
    payload.expectedBlockingReason = `${toolId}_source_frame_missing`
  }

  return payload
}

function requestForTool(): AiGraphicsExternalBetaToolCallRequest {
  const toolId = stringArg('--tool') ?? 'd3'
  const capabilityIdOverride = capabilityArg()
  const source = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
    .find((item) => item.request.toolId === toolId)
  assert(source, `Unsupported AI graphics tool id: ${toolId}`)

  const group = groupForTool(toolId)
  const request: AiGraphicsExternalBetaToolCallRequest = {
    ...source.request,
    requestId: `external-agent-single-tool-call-${toolId}`,
    capabilityId: capabilityIdOverride ?? source.request.capabilityId,
    approvedPlanSnapshotId:
      `approved-snapshot-external-agent-single-tool-call-${toolId}`,
    creditReservationId:
      `credit-reservation-external-agent-single-tool-call-${toolId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-agent/single-tool-call/${toolId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-agent/single-tool-call/${toolId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-agent/single-tool-call/${toolId}/worker-approval`,
    runtimeEnqueueApprovalRef:
      `private://ai-graphics/external-agent/single-tool-call/${toolId}/runtime-enqueue-approval`,
    ownerRuntimeApprovalRef:
      `private://ai-graphics/external-agent/single-tool-call/${toolId}/owner-runtime-approval`,
    traceId: `trace-external-agent-single-tool-call-${toolId}`,
    payload: group === 'gpu_model' && isGpuModelTool(toolId)
      ? gpuRuntimePayload(toolId)
      : {
          externalAgentSingleToolCall: true,
          privateOutputOnly: true,
          publicArtifactCreated: false,
          signedUrlCreated: false,
        },
  }

  if (group === 'gpu_model') {
    request.nativeGpuRuntimeProofRef =
      `private://ai-graphics/external-agent/single-tool-call/${toolId}/native-gpu-runtime-proof`
    request.externalBetaPerToolRuntimeProofRef =
      `private://ai-graphics/external-agent/single-tool-call/${toolId}/per-tool-runtime-proof`
    if (!['torch_torchvision', 'transformers', 'kornia'].includes(toolId)) {
      request.modelWeightManifestRef =
        `private://ai-graphics/external-agent/single-tool-call/${toolId}/model-weight-manifest`
    }
  }

  return request
}

async function postToolCall(baseUrl: string, request: AiGraphicsExternalBetaToolCallRequest) {
  const response = await fetch(`${baseUrl}${AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': request.traceId,
    },
    body: JSON.stringify(request),
  })
  const text = await response.text()
  let body: Record<string, any> | null = null
  try {
    body = JSON.parse(text) as Record<string, any>
  } catch {
    body = null
  }
  return { statusCode: response.status, body, rawBody: text }
}

async function buildReport() {
  const request = requestForTool()
  const group = groupForTool(request.toolId)
  const response = await withServer((baseUrl) => postToolCall(baseUrl, request))
  const data = response.body?.data ?? {}
  const normalized = data.externalAgentToolCallResult ?? null
  const adapterResult = data.adapterResult ?? data.controlledAdapterResult ?? {}
  const booleans = data.booleans ?? {}
  const output = adapterResult.output ?? {}
  const executable = normalized?.executable === true ||
    data.externalAgentExecutionState === 'executable'
  const blockedWithReason = normalized?.blockedWithReason === true ||
    data.externalAgentExecutionState === 'blocked_with_reason'
  const failedWithDiagnostics = normalized?.failedWithDiagnostics === true ||
    data.externalAgentExecutionState === 'failed_with_diagnostics'

  return {
    schemaVersion:
      '2026-07-04.ai-graphics.external-agent-single-tool-call',
    decision,
    status: executable
      ? 'external_agent_single_tool_call_executed'
      : blockedWithReason
      ? 'external_agent_single_tool_call_blocked_with_reason'
      : failedWithDiagnostics
      ? 'external_agent_single_tool_call_failed_with_diagnostics'
      : 'external_agent_single_tool_call_unknown_result',
    routePath: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
    routeMountFlag: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG,
    request: {
      toolId: request.toolId,
      capabilityId: request.capabilityId,
      group,
      requestId: request.requestId,
      privateArtifactManifestRef: request.privateArtifactManifestRef,
      payload: request.payload ?? {},
    },
    agentCommandContract: {
      expectedState: expectedStateArg() ?? null,
      expectedBlockingReasonCode:
        stringArg('--expect-blocking-reason') ?? null,
      resultOut: resultOutPath() ?? null,
      strictExitCodeRequested: hasFlag('--strict-exit-code'),
      requireOutputHash: hasFlag('--require-output-hash'),
      requirePrivateOnlyBoundary: hasFlag('--require-private-only-boundary'),
      executableExitCode: 0,
      blockedWithReasonExitCode: 2,
      failedWithDiagnosticsExitCode: 3,
      validationFailureExitCode: 1,
      unknownResultExitCode: 4,
    },
    response: {
      statusCode: response.statusCode,
      ok: response.body?.ok === true,
      routeStatus: data.routeStatus ?? null,
      externalAgentExecutionState: data.externalAgentExecutionState ?? null,
      blockingReasonCode: data.blockingReasonCode ?? null,
      failureDiagnostics: data.failureDiagnostics ?? null,
      externalAgentToolCallResult: normalized,
      outputKind: output.outputKind ?? null,
      outputSha256: output.privateArtifactSha256 ?? null,
    },
    booleans: {
      externalAgentSingleToolCallPerformed: true,
      routeMountedForCall: response.statusCode !== 404,
      routeReturnedHttp200: response.statusCode === 200,
      normalizedExternalAgentResultReturned: normalized !== null,
      callable: normalized?.callable === true,
      executable,
      blockedWithReason,
      failedWithDiagnostics,
      controlledAdapterInvokedNow:
        data.controlledAdapterInvokedNow === true ||
        adapterResult.controlledAdapterInvokedNow === true ||
        adapterResult.controlledAdapterExecutedNow === true,
      controlledAdapterExecutedNow:
        data.controlledAdapterExecutedNow === true ||
        adapterResult.controlledAdapterExecutedNow === true,
      localPackageExecutionPerformed:
        booleans.localCpuStaticPackageExecutionPerformed === true ||
        booleans.localBrowserRuntimePackageExecutionPerformed === true ||
        adapterResult.localCpuStaticPackageExecutionPerformed === true ||
        adapterResult.localBrowserRuntimePackageExecutionPerformed === true,
      localGpuModelRuntimeExecutionPerformed:
        adapterResult.localGpuModelRuntimeExecutionPerformed === true,
      gpuRuntimeShouldStartNow:
        data.gpuRuntimeShouldStartNow === true ||
        booleans.gpuRuntimeShouldStartNow === true ||
        adapterResult.gpuRuntimeShouldStartNow === true ||
        normalized?.gpuRuntimeShouldStartNow === true,
      publicArtifactCreated:
        data.outputAccess?.publicArtifactCreated === true ||
        data.publicArtifactCreated === true ||
        adapterResult.publicArtifactCreated === true ||
        normalized?.outputAccess?.publicArtifactCreated === true,
      signedUrlCreated:
        data.outputAccess?.signedUrlCreated === true ||
        data.signedUrlCreated === true ||
        adapterResult.signedUrlCreated === true ||
        normalized?.outputAccess?.signedUrlCreated === true,
      runtimeReadyNow: booleans.runtimeReadyNow === true,
      externalBetaReadyNow: booleans.externalBetaReadyNow === true,
      productionReadyNow: booleans.productionReadyNow === true,
    },
  }
}

function validationFailures(report: Awaited<ReturnType<typeof buildReport>>): string[] {
  const failures: string[] = []
  const expectedState = expectedStateArg()
  const expectedBlockingReasonCode = stringArg('--expect-blocking-reason')
  const state = report.response.externalAgentExecutionState
  if (expectedState && state !== expectedState) {
    failures.push(`expected_state_mismatch:${expectedState}:${state}`)
  }
  if (
    expectedBlockingReasonCode &&
    report.response.blockingReasonCode !== expectedBlockingReasonCode
  ) {
    failures.push(
      `expected_blocking_reason_mismatch:${expectedBlockingReasonCode}:${report.response.blockingReasonCode}`,
    )
  }
  if (hasFlag('--require-output-hash')) {
    const hash = report.response.outputSha256
    if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) {
      failures.push('required_output_hash_missing')
    }
  }
  if (hasFlag('--require-private-only-boundary')) {
    for (const key of [
      'publicArtifactCreated',
      'signedUrlCreated',
      'runtimeReadyNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ] as const) {
      if (report.booleans[key] !== false) {
        failures.push(`private_boundary_boolean_not_false:${key}`)
      }
    }
  }
  return failures
}

function strictExitCodeForReport(report: Awaited<ReturnType<typeof buildReport>>): number {
  const state = report.response.externalAgentExecutionState
  if (state === 'executable') return 0
  if (state === 'blocked_with_reason') return 2
  if (state === 'failed_with_diagnostics') return 3
  return 4
}

function makeMarkdown(report: Awaited<ReturnType<typeof buildReport>>): string {
  return `# AI Graphics External Agent Single Tool Call

Decision: \`${report.decision}\`

Status: \`${report.status}\`

Route: \`${report.routePath}\`

## Request

- \`toolId\`: \`${report.request.toolId}\`
- \`capabilityId\`: \`${report.request.capabilityId}\`
- \`group\`: \`${report.request.group}\`
- \`requestId\`: \`${report.request.requestId}\`
- \`privateArtifactManifestRef\`: \`${report.request.privateArtifactManifestRef}\`

## Response

- \`statusCode\`: \`${report.response.statusCode}\`
- \`ok\`: \`${report.response.ok}\`
- \`routeStatus\`: \`${report.response.routeStatus}\`
- \`externalAgentExecutionState\`: \`${report.response.externalAgentExecutionState}\`
- \`blockingReasonCode\`: \`${report.response.blockingReasonCode}\`
- \`failureDiagnostics\`: \`${report.response.failureDiagnostics}\`
- \`outputKind\`: \`${report.response.outputKind}\`
- \`outputSha256\`: \`${report.response.outputSha256}\`

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Boundary

This caller starts the local API with only the scoped external-agent controlled route enabled. It does not install packages, run providers, create public artifacts, create signed URLs, mutate Supabase/GCS, unlock beta, or unlock production. GPU/model execution remains on-demand and starts only when the selected tool call supplies explicit local-dev runtime prerequisites.
`
}

async function main() {
  assert(
    !(hasFlag('--write-records') && resultOutPath()),
    '--write-records cannot be combined with --result-out',
  )
  const report = await buildReport()
  if (hasFlag('--write-records')) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
  }
  const localResultOut = resultOutPath()
  if (localResultOut) {
    ensureParentDirectory(localResultOut)
    fs.writeFileSync(localResultOut, `${JSON.stringify(report, null, 2)}\n`)
  }
  console.log(JSON.stringify(report, null, 2))
  const failures = validationFailures(report)
  if (failures.length) {
    console.error(JSON.stringify({
      ok: false,
      decision,
      failures,
      executionState: report.response.externalAgentExecutionState,
      blockingReasonCode: report.response.blockingReasonCode,
    }, null, 2))
    process.exit(1)
  }
  if (hasFlag('--strict-exit-code')) {
    process.exit(strictExitCodeForReport(report))
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
