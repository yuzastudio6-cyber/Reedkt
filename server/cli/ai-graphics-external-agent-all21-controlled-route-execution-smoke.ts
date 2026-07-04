import fs from 'node:fs'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG,
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
  type AiGraphicsExternalBetaToolCallRequest,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
  type AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
} from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision =
  'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed'
const status =
  'external_agent_all21_controlled_route_execution_passed_with_gpu_on_demand'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.md'
const canonicalGpuModelRuntimeContainerImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const defaultScopedGpuModelPrivateOutputRoot =
  '.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke'

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

type ExternalAgentToolCallExecutionState =
  | 'executable'
  | 'blocked_with_reason'
  | 'failed_with_diagnostics'

interface ExternalAgentToolCallResult {
  contractVersion: string | null
  callable: boolean
  executable: boolean
  blockedWithReason: boolean
  failedWithDiagnostics: boolean
  executionState: ExternalAgentToolCallExecutionState | null
  blockingReasonCode: string | null
  failureDiagnostics: string | null
  controlledAdapterInvokedNow: boolean
  controlledAdapterExecutedNow: boolean
  localPackageExecutionPerformed: boolean
  localGpuModelRuntimeExecutionPerformed: boolean
  routeExecutionPerformed: boolean
  gpuRuntimeShouldStartNow: boolean
  outputAccess: {
    privateArtifactManifestRef: string | null
    publicArtifactCreated: boolean
    signedUrlCreated: boolean
  }
  nextExternalAgentAction: string | null
  nextExternalAgentCommandKind: string | null
  nextExternalAgentCommand: string | null
  nextExternalAgentRouteRetryCommandKind: string | null
  nextExternalAgentRouteRetryCommand: string | null
  requiredPrivateInputKeys: string[]
  blockedRuntimePrerequisites: string[]
  gpuRuntimeStartPolicy: string | null
}

interface ControlledRouteExecutionResult {
  toolId: string
  capabilityId: string
  group: ControlledToolGroup
  statusCode: number
  ok: boolean
  routeStatus: string | null
  externalAgentExecutionState:
    | ExternalAgentToolCallExecutionState
    | null
  externalAgentToolCallResult: ExternalAgentToolCallResult | null
  blockingReasonCode: string | null
  failureDiagnostics: string | null
  expectedCapabilities: string[]
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
  canonicalRuntimeContainerImage: string
  requestedRuntimeContainerImage: string | null
  requestedRuntimeContainerPlatform: string | null
  runtimeContainerImageProvided: boolean
  expectedBlockingReasonCode: string
  expectedBlockingReasonCodes: string[]
  executableOnCudaHostWithPrivateInput: boolean
  nextExactCommand: string
  privateOutputDirectory: string
  privateSourceImageLocalPath: string | null
  privateRuntimeInputRefs: Record<string, string>
  result: ControlledRouteExecutionResult
  booleans: {
    scopedGpuModelLocalDevRouteAttemptPerformed: true
    scopedGpuModelLocalDevRouteAttemptAccepted: boolean
    scopedGpuModelLocalDevRouteAttemptBlockedWithReason: boolean
    scopedGpuModelRuntimeContainerPayloadAccepted: boolean
    scopedGpuModelRuntimeContainerImageProvided: boolean
    scopedGpuModelRuntimeExecutionPerformed: boolean
    scopedGpuModelGpuRuntimeShouldStartNow: boolean
    scopedGpuModelPublicArtifactCreated: false
    scopedGpuModelSignedUrlCreated: false
  }
}

interface ScopedGpuModelLocalDevRouteAttemptOptions {
  runtimeContainerImage?: string
  runtimeContainerPlatform?: string
  allowCpuTensorRuntime?: boolean
  allowCpuFoundationRuntime?: boolean
  privateOutputRoot?: string
  privateOutputDirectory?: string
  privateSourceImageLocalPath?: string
  sam2CheckpointLocalPath?: string
  birefnetModelLocalPath?: string
  realEsrganModelLocalPath?: string
  rembgModelLocalPath?: string
  transparentBackgroundCheckpointLocalPath?: string
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function externalAgentExecutionState(
  value: unknown,
): ExternalAgentToolCallExecutionState | null {
  return value === 'executable' ||
    value === 'blocked_with_reason' ||
    value === 'failed_with_diagnostics'
    ? value
    : null
}

function parseExternalAgentToolCallResult(
  value: unknown,
): ExternalAgentToolCallResult | null {
  const raw = objectValue(value)
  if (!raw || Object.keys(raw).length === 0) return null
  const outputAccess = objectValue(raw.outputAccess)
  return {
    contractVersion: nullableString(raw.contractVersion),
    callable: raw.callable === true,
    executable: raw.executable === true,
    blockedWithReason: raw.blockedWithReason === true,
    failedWithDiagnostics: raw.failedWithDiagnostics === true,
    executionState: externalAgentExecutionState(raw.executionState),
    blockingReasonCode: nullableString(raw.blockingReasonCode),
    failureDiagnostics: nullableString(raw.failureDiagnostics),
    controlledAdapterInvokedNow: raw.controlledAdapterInvokedNow === true,
    controlledAdapterExecutedNow: raw.controlledAdapterExecutedNow === true,
    localPackageExecutionPerformed: raw.localPackageExecutionPerformed === true,
    localGpuModelRuntimeExecutionPerformed:
      raw.localGpuModelRuntimeExecutionPerformed === true,
    routeExecutionPerformed: raw.routeExecutionPerformed === true,
    gpuRuntimeShouldStartNow: raw.gpuRuntimeShouldStartNow === true,
    outputAccess: {
      privateArtifactManifestRef:
        nullableString(outputAccess.privateArtifactManifestRef),
      publicArtifactCreated: outputAccess.publicArtifactCreated === true,
      signedUrlCreated: outputAccess.signedUrlCreated === true,
    },
    nextExternalAgentAction: nullableString(raw.nextExternalAgentAction),
    nextExternalAgentCommandKind:
      nullableString(raw.nextExternalAgentCommandKind),
    nextExternalAgentCommand: nullableString(raw.nextExternalAgentCommand),
    nextExternalAgentRouteRetryCommandKind:
      nullableString(raw.nextExternalAgentRouteRetryCommandKind),
    nextExternalAgentRouteRetryCommand:
      nullableString(raw.nextExternalAgentRouteRetryCommand),
    requiredPrivateInputKeys: stringArray(raw.requiredPrivateInputKeys),
    blockedRuntimePrerequisites:
      stringArray(raw.blockedRuntimePrerequisites),
    gpuRuntimeStartPolicy: nullableString(raw.gpuRuntimeStartPolicy),
  }
}

function stringArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  return typeof value === 'string' && value.trim() && !value.startsWith('--')
    ? value
    : undefined
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name)
}

function scopedGpuModelToolIdsFromArgs(): AiGraphicsExternalAgentGpuModelControlledAdapterToolId[] {
  const raw = stringArg('--scoped-gpu-tool')
  if (!raw) return [...AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS]
  const requested = raw.split(',').map((item) => item.trim()).filter(Boolean)
  assert(requested.length > 0, '--scoped-gpu-tool requires at least one tool id')
  for (const toolId of requested) {
    assert(
      AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.includes(
        toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
      ),
      `Unsupported --scoped-gpu-tool value: ${toolId}`,
    )
  }
  return requested as AiGraphicsExternalAgentGpuModelControlledAdapterToolId[]
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
    `${baseUrl}${AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH}`,
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

function capabilityMismatchFailureProbeRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsExternalBetaToolCallRequest {
  return {
    ...request,
    requestId:
      'all21-controlled-route-execution-capability-mismatch-failure-probe-d3',
    capabilityId: 'background_removal',
    traceId:
      'trace-all21-controlled-route-execution-capability-mismatch-failure-probe-d3',
    payload: {
      capabilityMismatchFailureProbe: true,
      expectedExecutionState: 'failed_with_diagnostics',
    },
  }
}

function scopedGpuModelPrivateOutputDirectory(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: ScopedGpuModelLocalDevRouteAttemptOptions,
): string {
  if (options.privateOutputDirectory) {
    return options.privateOutputDirectory.endsWith(`/${toolId}`)
      ? options.privateOutputDirectory
      : `${options.privateOutputDirectory}/${toolId}`
  }
  return `${options.privateOutputRoot ?? defaultScopedGpuModelPrivateOutputRoot}/${toolId}`
}

function gpuModelRequiresSourceImage(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): boolean {
  return !['torch_torchvision', 'transformers'].includes(toolId)
}

function gpuModelAllowsCpuFoundationRuntime(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): boolean {
  return toolId === 'torch_torchvision' || toolId === 'transformers'
}

function gpuModelAllowsCpuTensorRuntime(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): boolean {
  return toolId === 'kornia'
}

function gpuModelPrefersCpuTensorRuntime(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): boolean {
  return gpuModelAllowsCpuTensorRuntime(toolId)
}

function gpuModelPrefersCpuFoundationRuntime(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): boolean {
  return gpuModelAllowsCpuFoundationRuntime(toolId)
}

function scopedGpuModelUsesCpuTensorRuntime(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: { allowCpuTensorRuntime?: boolean },
): boolean {
  return gpuModelAllowsCpuTensorRuntime(toolId) &&
    options.allowCpuTensorRuntime === true
}

function scopedGpuModelUsesCpuFoundationRuntime(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: { allowCpuFoundationRuntime?: boolean },
): boolean {
  return gpuModelAllowsCpuFoundationRuntime(toolId) &&
    options.allowCpuFoundationRuntime === true
}

function gpuModelRequiredPrivateInputKeys(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: {
    allowCpuTensorRuntime?: boolean
    allowCpuFoundationRuntime?: boolean
  } = {},
): string[] {
  return [
    'outputDirectory',
    scopedGpuModelUsesCpuTensorRuntime(toolId, options)
      ? 'pythonCpuTensorRuntime'
      : scopedGpuModelUsesCpuFoundationRuntime(toolId, options)
      ? 'pythonCpuFoundationRuntime'
      : 'nativeCudaRuntime',
    gpuModelRequiresSourceImage(toolId) ? 'sourceImageLocalPath' : '',
    toolId === 'sam2' ? 'sam2CheckpointLocalPath' : '',
    toolId === 'birefnet' ? 'birefnetModelLocalPath' : '',
    toolId === 'real_esrgan' ? 'realEsrganModelLocalPath' : '',
    toolId === 'rembg' ? 'rembgModelLocalPath' : '',
    toolId === 'transparent_background'
      ? 'transparentBackgroundCheckpointLocalPath'
      : '',
  ].filter(Boolean)
}

function gpuModelPreferredPrivateInputKeys(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): string[] {
  return gpuModelRequiredPrivateInputKeys(toolId, {
    allowCpuTensorRuntime: gpuModelPrefersCpuTensorRuntime(toolId),
    allowCpuFoundationRuntime: gpuModelPrefersCpuFoundationRuntime(toolId),
  })
}

function assertPreferredGpuModelRetryCommand(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  command: string | null | undefined,
  label: string,
): void {
  if (gpuModelPrefersCpuTensorRuntime(toolId) ||
    gpuModelPrefersCpuFoundationRuntime(toolId)) {
    assert(
      command?.includes('ai-graphics:external-agent-tool-call') === true &&
        command.includes(`--tool ${toolId}`) &&
        command.includes('--runtime-backend host_python') &&
        command.includes(
          gpuModelPrefersCpuTensorRuntime(toolId)
            ? '--allow-cpu-tensor-runtime'
            : '--allow-cpu-foundation-runtime',
        ),
      `${label} missing CPU-preferred scoped route retry command`,
    )
    if (gpuModelRequiresSourceImage(toolId)) {
      assert(
        command?.includes('--source-image <private-approved-frame.png>') === true,
        `${label} missing single-tool source image flag`,
      )
      assert(
        command?.includes('--scoped-gpu-source-image') !== true,
        `${label} should not use scoped source image flag for single-tool retry command`,
      )
    }
    return
  }
  assert(
    command?.includes(`--scoped-gpu-tool ${toolId}`) === true,
    `${label} missing exact scoped route retry command`,
  )
}

function assertPreferredGpuModelBlockedPrerequisite(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  prerequisites: string[],
  label: string,
): void {
  const expectedFragment = gpuModelPrefersCpuTensorRuntime(toolId)
    ? 'CPU tensor runtime'
    : gpuModelPrefersCpuFoundationRuntime(toolId)
    ? 'CPU foundation runtime'
    : 'CUDA'
  assert(
    prerequisites.some((item) => item.includes(expectedFragment)),
    `${label} missing ${expectedFragment} prerequisite`,
  )
}

function scopedGpuModelPrivateSourceImageLocalPath(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: ScopedGpuModelLocalDevRouteAttemptOptions,
): string | null {
  if (!gpuModelRequiresSourceImage(toolId)) return null
  return options.privateSourceImageLocalPath ??
    `${scopedGpuModelPrivateOutputDirectory(toolId, options)}/private-approved-frame.ppm`
}

function scopedGpuModelPrivateRuntimeInputRefs(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: ScopedGpuModelLocalDevRouteAttemptOptions,
): Record<string, string> {
  const outputDirectory = scopedGpuModelPrivateOutputDirectory(toolId, options)
  const defaults: Record<string, Record<string, string>> = {
    torch_torchvision: {},
    transformers: {},
    sam2: {
      sam2CheckpointLocalPath:
        options.sam2CheckpointLocalPath ??
        `${outputDirectory}/private-sam2-checkpoint.pt`,
    },
    birefnet: {
      birefnetModelLocalPath:
        options.birefnetModelLocalPath ??
        `${outputDirectory}/private-birefnet-model`,
    },
    real_esrgan: {
      realEsrganModelLocalPath:
        options.realEsrganModelLocalPath ??
        `${outputDirectory}/private-real-esrgan-model.pth`,
    },
    kornia: {},
    rembg: {
      rembgModelLocalPath:
        options.rembgModelLocalPath ??
        `${outputDirectory}/private-rembg-model.onnx`,
    },
    transparent_background: {
      transparentBackgroundCheckpointLocalPath:
        options.transparentBackgroundCheckpointLocalPath ??
        `${outputDirectory}/private-transparent-background-checkpoint.pth`,
    },
  }
  return defaults[toolId] ?? {}
}

function scopedGpuModelCommand(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: ScopedGpuModelLocalDevRouteAttemptOptions,
): string {
  const outputDirectory = scopedGpuModelPrivateOutputDirectory(toolId, options)
  const sourceImage = scopedGpuModelPrivateSourceImageLocalPath(toolId, options)
  const inputRefs = scopedGpuModelPrivateRuntimeInputRefs(toolId, options)
  const allowCpuTensorRuntime = scopedGpuModelUsesCpuTensorRuntime(toolId, options)
  const allowCpuFoundationRuntime =
    scopedGpuModelUsesCpuFoundationRuntime(toolId, options)
  const parts = [
    'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke --',
    `--scoped-gpu-tool ${toolId}`,
    `--scoped-gpu-runtime-container-image ${options.runtimeContainerImage ?? canonicalGpuModelRuntimeContainerImage}`,
    `--scoped-gpu-runtime-container-platform ${options.runtimeContainerPlatform ?? 'linux/amd64'}`,
    allowCpuTensorRuntime
      ? '--scoped-gpu-allow-cpu-tensor-runtime'
      : '',
    allowCpuFoundationRuntime
      ? '--scoped-gpu-allow-cpu-foundation-runtime'
      : '',
    `--scoped-gpu-output-dir ${outputDirectory}`,
    sourceImage ? `--scoped-gpu-source-image ${sourceImage}` : '',
    inputRefs.sam2CheckpointLocalPath
      ? `--scoped-gpu-sam2-checkpoint ${inputRefs.sam2CheckpointLocalPath}`
      : '',
    inputRefs.birefnetModelLocalPath
      ? `--scoped-gpu-birefnet-model ${inputRefs.birefnetModelLocalPath}`
      : '',
    inputRefs.realEsrganModelLocalPath
      ? `--scoped-gpu-real-esrgan-model ${inputRefs.realEsrganModelLocalPath}`
      : '',
    inputRefs.rembgModelLocalPath
      ? `--scoped-gpu-rembg-model ${inputRefs.rembgModelLocalPath}`
      : '',
    inputRefs.transparentBackgroundCheckpointLocalPath
      ? `--scoped-gpu-transparent-background-checkpoint ${inputRefs.transparentBackgroundCheckpointLocalPath}`
      : '',
  ]
  return parts.filter(Boolean).join(' ')
}

function scopedGpuModelLocalDevRouteAttemptRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: ScopedGpuModelLocalDevRouteAttemptOptions = {},
): AiGraphicsExternalBetaToolCallRequest {
  const privateOutputDirectory = scopedGpuModelPrivateOutputDirectory(
    toolId,
    options,
  )
  const privateSourceImageLocalPath =
    scopedGpuModelPrivateSourceImageLocalPath(toolId, options)
  const privateRuntimeInputRefs = scopedGpuModelPrivateRuntimeInputRefs(
    toolId,
    options,
  )
  const allowCpuTensorRuntime = scopedGpuModelUsesCpuTensorRuntime(toolId, options)
  const allowCpuFoundationRuntime =
    scopedGpuModelUsesCpuFoundationRuntime(toolId, options)
  const payload: Record<string, unknown> = {
    mode: 'local_dev',
    enableGpuModelControlledExecution: true,
    externalAgentAll21ControlledRouteExecutionSmoke: true,
    scopedGpuModelLocalDevRouteAttempt: true,
    privateOutputOnly: true,
    gpuRuntimeOnDemandOnly: true,
    noIdleGpuRuntimeApproved: true,
    runtimeExecutionBackend: 'docker_container',
    runtimeContainerGpu: !(allowCpuTensorRuntime || allowCpuFoundationRuntime),
    outputDirectory: privateOutputDirectory,
    timeoutMs: 30_000,
    toolExecutionPerformed: false,
    gpuRuntimeShouldStartNow: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    ...privateRuntimeInputRefs,
  }
  if (allowCpuTensorRuntime) {
    payload.allowCpuTensorRuntime = true
  }
  if (allowCpuFoundationRuntime) {
    payload.allowCpuFoundationRuntime = true
  }
  if (privateSourceImageLocalPath) {
    payload.sourceImageLocalPath = privateSourceImageLocalPath
    payload.representativeFrameLocalPath = privateSourceImageLocalPath
  }
  if (options.runtimeContainerImage) {
    payload.runtimeContainerImage = options.runtimeContainerImage
  }
  if (options.runtimeContainerPlatform) {
    payload.runtimeContainerPlatform = options.runtimeContainerPlatform
  }

  return {
    ...request,
    toolId,
    requestId: `all21-controlled-route-execution-scoped-gpu-model-runtime-attempt-${toolId}`,
    approvedPlanSnapshotId:
      `approved-snapshot-all21-controlled-route-execution-scoped-gpu-model-runtime-attempt-${toolId}`,
    creditReservationId:
      `credit-reservation-all21-controlled-route-execution-scoped-gpu-model-runtime-attempt-${toolId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/${toolId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/${toolId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/${toolId}/worker-approval`,
    runtimeEnqueueApprovalRef:
      `private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/${toolId}/runtime-enqueue-approval`,
    ownerRuntimeApprovalRef:
      `private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/${toolId}/owner-runtime-approval`,
    nativeGpuRuntimeProofRef:
      `private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/${toolId}/native-gpu-runtime-proof`,
    externalBetaPerToolRuntimeProofRef:
      `private://ai-graphics/external-agent/all21-controlled-route-execution-smoke/scoped-gpu-model-runtime-attempt/${toolId}/external-beta-per-tool-runtime-proof`,
    traceId:
      `trace-all21-controlled-route-execution-scoped-gpu-model-runtime-attempt-${toolId}`,
    payload,
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
  const runtimeOutput = objectValue(adapterResult.runtimeOutput)
  const runtimeResult = objectValue(runtimeOutput.result)
  const group = groupForTool(request.toolId)
  const externalAgentToolCallResult = parseExternalAgentToolCallResult(
    data.externalAgentToolCallResult,
  )
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
      externalAgentExecutionState(data.externalAgentExecutionState),
    externalAgentToolCallResult,
    blockingReasonCode: typeof data.blockingReasonCode === 'string'
      ? data.blockingReasonCode
      : null,
    failureDiagnostics: typeof data.failureDiagnostics === 'string'
      ? data.failureDiagnostics
      : null,
    expectedCapabilities: stringArray(data.expectedCapabilities),
    controlledAdapterExecutedNow:
      data.controlledAdapterExecutedNow === true ||
      adapterResult.controlledAdapterExecutedNow === true,
    controlledAdapterInvokedNow:
      data.controlledAdapterInvokedNow === true ||
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
      : typeof runtimeResult.outputJsonPath === 'string'
      ? 'gpu_model_runtime_json'
      : null,
    outputSha256: typeof output.privateArtifactSha256 === 'string'
      ? output.privateArtifactSha256
      : typeof runtimeResult.outputJsonSha256 === 'string'
      ? runtimeResult.outputJsonSha256
      : null,
    publicArtifactCreated:
      data.outputAccess?.publicArtifactCreated === true ||
      data.publicArtifactCreated === true ||
      booleans.publicArtifactCreated === true ||
      adapterResult.publicArtifactCreated === true,
    signedUrlCreated:
      data.outputAccess?.signedUrlCreated === true ||
      data.signedUrlCreated === true ||
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
  options: ScopedGpuModelLocalDevRouteAttemptOptions = {},
): ScopedGpuModelLocalDevRouteAttempt {
  assert(
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.includes(
      result.toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
    ),
    `Unsupported scoped GPU/model result tool: ${result.toolId}`,
  )
  const toolId = result.toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId
  const runtimeContainerImage = options.runtimeContainerImage ?? null
  const runtimeContainerImageProvided = Boolean(runtimeContainerImage)
  const expectedBlockingReasonCodes = runtimeContainerImageProvided
    ? scopedGpuModelUsesCpuTensorRuntime(toolId, options)
      ? [
          ...privateInputBlockingReasonCodes(toolId),
          'gpu_model_runtime_container_image_unavailable',
          'gpu_model_python_runtime_unavailable',
          'gpu_model_python_package_missing',
        ]
      : scopedGpuModelUsesCpuFoundationRuntime(toolId, options)
      ? [
          'gpu_model_runtime_container_image_unavailable',
          'gpu_model_python_runtime_unavailable',
          'gpu_model_python_package_missing',
        ]
      : [
          ...privateInputBlockingReasonCodes(toolId),
          'gpu_model_runtime_container_image_unavailable',
          'gpu_model_runtime_container_gpu_unavailable',
          'gpu_model_python_runtime_unavailable',
          'gpu_model_python_package_missing',
          'gpu_model_native_cuda_runtime_missing',
          'gpu_model_onnxruntime_cuda_provider_missing',
        ]
    : ['gpu_model_runtime_container_image_missing']
  const expectedBlockingReasonCode = expectedBlockingReasonCodes[0]
  const runtimeExecuted =
    result.externalAgentExecutionState === 'executable' &&
    result.localGpuModelRuntimeExecutionPerformed === true
  const blockedWithExpectedReason =
    result.externalAgentExecutionState === 'blocked_with_reason' &&
    Boolean(
      result.blockingReasonCode &&
      expectedBlockingReasonCodes.includes(result.blockingReasonCode),
    )
  const privateOutputDirectory = scopedGpuModelPrivateOutputDirectory(
    toolId,
    options,
  )
  const privateSourceImageLocalPath =
    scopedGpuModelPrivateSourceImageLocalPath(toolId, options)
  const privateRuntimeInputRefs = scopedGpuModelPrivateRuntimeInputRefs(
    toolId,
    options,
  )
  const nextExactCommand = scopedGpuModelCommand(toolId, options)

  return {
    summary: runtimeContainerImageProvided
      ? 'POSTs a scoped GPU/model local-dev runtime request through the mounted external-agent route with explicit private local input/output paths, runtimeExecutionBackend=docker_container, and runtimeContainerImage supplied. On this host it may block at image/GPU/source prerequisites; on a CUDA Docker host with a private source frame it can execute only this scoped tool call on demand.'
      : 'POSTs a scoped GPU/model local-dev runtime request through the mounted external-agent route. The request includes explicit private local input/output paths and runtimeExecutionBackend=docker_container, but intentionally omits runtimeContainerImage so the route proves payload forwarding into the GPU/model adapter while blocking before any GPU startup or model execution.',
    requestedToolId: toolId,
    requestedRuntimeBackend: 'docker_container',
    canonicalRuntimeContainerImage: canonicalGpuModelRuntimeContainerImage,
    requestedRuntimeContainerImage: runtimeContainerImage,
    requestedRuntimeContainerPlatform: options.runtimeContainerPlatform ?? null,
    runtimeContainerImageProvided,
    expectedBlockingReasonCode,
    expectedBlockingReasonCodes,
    executableOnCudaHostWithPrivateInput: runtimeContainerImageProvided,
    nextExactCommand,
    privateOutputDirectory,
    privateSourceImageLocalPath,
    privateRuntimeInputRefs,
    result,
    booleans: {
      scopedGpuModelLocalDevRouteAttemptPerformed: true,
      scopedGpuModelLocalDevRouteAttemptAccepted:
        result.statusCode === 200 &&
        result.ok === true &&
        result.controlledAdapterInvokedNow === true &&
        (blockedWithExpectedReason || runtimeExecuted),
      scopedGpuModelLocalDevRouteAttemptBlockedWithReason:
        blockedWithExpectedReason,
      scopedGpuModelRuntimeContainerPayloadAccepted:
        runtimeContainerImageProvided
          ? blockedWithExpectedReason || runtimeExecuted
          : result.blockingReasonCode ===
              'gpu_model_runtime_container_image_missing',
      scopedGpuModelRuntimeContainerImageProvided: runtimeContainerImageProvided,
      scopedGpuModelRuntimeExecutionPerformed: runtimeExecuted,
      scopedGpuModelGpuRuntimeShouldStartNow: result.gpuRuntimeShouldStartNow,
      scopedGpuModelPublicArtifactCreated: false,
      scopedGpuModelSignedUrlCreated: false,
    },
  }
}

function privateInputBlockingReasonCodes(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): string[] {
  const codesByTool: Record<
    AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
    string[]
  > = {
    torch_torchvision: [],
    transformers: [],
    sam2: ['sam2_checkpoint_missing', 'sam2_source_frame_missing'],
    birefnet: ['birefnet_model_missing', 'birefnet_source_frame_missing'],
    real_esrgan: [
      'real_esrgan_model_missing',
      'real_esrgan_source_frame_missing',
    ],
    kornia: ['kornia_source_frame_missing'],
    rembg: ['rembg_model_missing', 'rembg_source_frame_missing'],
    transparent_background: [
      'transparent_background_checkpoint_missing',
      'transparent_background_source_frame_missing',
    ],
  }
  return codesByTool[toolId]
}

function validateResults(
  results: ControlledRouteExecutionResult[],
  disabledGpuStatus: number,
  scopedGpuModelLocalDevRouteAttempts: ScopedGpuModelLocalDevRouteAttempt[],
  expectedScopedGpuModelToolIds: AiGraphicsExternalAgentGpuModelControlledAdapterToolId[],
  capabilityMismatchFailureProbe: ControlledRouteExecutionResult,
) {
  assert(disabledGpuStatus === 409, `disabled GPU route should return 409, got ${disabledGpuStatus}`)
  assert(results.length === 21, `Expected 21 route results, got ${results.length}`)
  assert(
    scopedGpuModelLocalDevRouteAttempts.length ===
      expectedScopedGpuModelToolIds.length,
    `Expected ${expectedScopedGpuModelToolIds.length} scoped GPU/model route attempts, got ${scopedGpuModelLocalDevRouteAttempts.length}`,
  )
  assert(
    capabilityMismatchFailureProbe.toolId === 'd3',
    'capability mismatch failure probe tool mismatch',
  )
  assert(
    capabilityMismatchFailureProbe.capabilityId === 'background_removal',
    'capability mismatch failure probe capability mismatch',
  )
  assert(
    capabilityMismatchFailureProbe.statusCode === 200,
    `capability mismatch failure probe should return HTTP 200 with normalized failure result, got ${capabilityMismatchFailureProbe.statusCode}`,
  )
  assert(
    capabilityMismatchFailureProbe.ok === true,
    'capability mismatch failure probe should return ok envelope',
  )
  assert(
    capabilityMismatchFailureProbe.externalAgentExecutionState ===
      'failed_with_diagnostics',
    `capability mismatch failure probe state mismatch: ${capabilityMismatchFailureProbe.externalAgentExecutionState}`,
  )
  assert(
    capabilityMismatchFailureProbe.routeStatus ===
      'external_beta_tool_call_route_failed_with_diagnostics_capability_mismatch',
    `capability mismatch failure probe route status mismatch: ${capabilityMismatchFailureProbe.routeStatus}`,
  )
  assert(
    capabilityMismatchFailureProbe.externalAgentToolCallResult?.failedWithDiagnostics === true,
    'capability mismatch failure probe normalized failed flag missing',
  )
  assert(
    capabilityMismatchFailureProbe.externalAgentToolCallResult?.executable === false,
    'capability mismatch failure probe should not be executable',
  )
  assert(
    capabilityMismatchFailureProbe.controlledAdapterInvokedNow === false,
    'capability mismatch failure probe invoked adapter unexpectedly',
  )
  assert(
    capabilityMismatchFailureProbe.controlledAdapterExecutedNow === false,
    'capability mismatch failure probe executed adapter unexpectedly',
  )
  assert(
    capabilityMismatchFailureProbe.localPackageExecutionPerformed === false,
    'capability mismatch failure probe performed local package execution unexpectedly',
  )
  assert(
    capabilityMismatchFailureProbe.gpuRuntimeShouldStartNow === false,
    'capability mismatch failure probe started GPU unexpectedly',
  )
  assert(
    capabilityMismatchFailureProbe.publicArtifactCreated === false,
    'capability mismatch failure probe created public artifact',
  )
  assert(
    capabilityMismatchFailureProbe.signedUrlCreated === false,
    'capability mismatch failure probe created signed URL',
  )
  assert(
    capabilityMismatchFailureProbe.failureDiagnostics?.includes(
      'background_removal is not valid for d3',
    ) === true,
    'capability mismatch failure probe missing actionable diagnostics',
  )
  assert(
    capabilityMismatchFailureProbe.expectedCapabilities.includes(
      'chart_overlay',
    ),
    'capability mismatch failure probe missing expected d3 capabilities',
  )
  for (const toolId of expectedScopedGpuModelToolIds) {
    const attempt = scopedGpuModelLocalDevRouteAttempts.find(
      (item) => item.requestedToolId === toolId,
    )
    assert(attempt, `Missing scoped GPU/model route attempt for ${toolId}`)
    const scopedResult = attempt.result
    assert(scopedResult.toolId === toolId, `${toolId} scoped GPU/model route attempt tool mismatch`)
    assert(scopedResult.statusCode === 200, `${toolId} scoped GPU/model route attempt did not return HTTP 200`)
    assert(scopedResult.ok === true, `${toolId} scoped GPU/model route attempt did not return ok envelope`)
    assert(scopedResult.controlledAdapterInvokedNow === true, `${toolId} scoped GPU/model route attempt did not invoke adapter`)
    if (attempt.runtimeContainerImageProvided) {
      const blockedWithExpectedReason =
        scopedResult.externalAgentExecutionState === 'blocked_with_reason' &&
        Boolean(
          scopedResult.blockingReasonCode &&
          attempt.expectedBlockingReasonCodes.includes(
            scopedResult.blockingReasonCode,
          ),
        )
      const runtimeExecuted =
        scopedResult.externalAgentExecutionState === 'executable' &&
        scopedResult.localGpuModelRuntimeExecutionPerformed === true
      assert(
        blockedWithExpectedReason || runtimeExecuted,
        `${toolId} scoped GPU/model route attempt should block with expected prerequisite or execute on CUDA host, got state=${scopedResult.externalAgentExecutionState} block=${scopedResult.blockingReasonCode}`,
      )
    } else {
      assert(scopedResult.controlledAdapterExecutedNow === false, `${toolId} scoped GPU/model route attempt should not execute runtime without container image`)
      assert(scopedResult.externalAgentExecutionState === 'blocked_with_reason', `${toolId} scoped GPU/model route attempt should block with reason`)
      assert(
        scopedResult.blockingReasonCode === 'gpu_model_runtime_container_image_missing',
        `${toolId} scoped GPU/model route attempt blocking reason mismatch: ${scopedResult.blockingReasonCode}`,
      )
      assert(scopedResult.localGpuModelRuntimeExecutionPerformed === false, `${toolId} scoped GPU/model route attempt performed runtime unexpectedly`)
      assert(scopedResult.gpuRuntimeShouldStartNow === false, `${toolId} scoped GPU/model route attempt started GPU unexpectedly`)
    }
    assert(scopedResult.failureDiagnostics === null, `${toolId} scoped GPU/model route attempt should not fail`)
    assert(scopedResult.externalAgentToolCallResult !== null, `${toolId} scoped GPU/model route attempt missing normalized result`)
    if (scopedResult.externalAgentExecutionState === 'blocked_with_reason') {
      assert(
        scopedResult.externalAgentToolCallResult?.nextExternalAgentCommandKind ===
          'gpu_model_private_proof_sequence',
        `${toolId} scoped GPU/model route attempt missing command kind`,
      )
      assert(
        scopedResult.externalAgentToolCallResult?.nextExternalAgentCommand?.includes('ai-graphics:external-agent-gpu-model-private-proof-sequence') === true &&
          scopedResult.externalAgentToolCallResult?.nextExternalAgentCommand?.includes(`--tool ${toolId}`) === true &&
          scopedResult.externalAgentToolCallResult?.nextExternalAgentCommand?.includes('--require-host-eligible') === true &&
          scopedResult.externalAgentToolCallResult?.nextExternalAgentCommand?.includes('--require-accepted-proof') === true,
        `${toolId} scoped GPU/model route attempt missing exact private proof sequence command`,
      )
      assert(
        scopedResult.externalAgentToolCallResult?.nextExternalAgentRouteRetryCommandKind ===
          'scoped_gpu_model_route_retry_after_private_proof',
        `${toolId} scoped GPU/model route attempt missing route retry command kind`,
      )
      assertPreferredGpuModelRetryCommand(
        toolId,
        scopedResult.externalAgentToolCallResult?.nextExternalAgentRouteRetryCommand,
        `${toolId} scoped GPU/model route attempt`,
      )
      for (const key of gpuModelPreferredPrivateInputKeys(toolId)) {
        assert(
          scopedResult.externalAgentToolCallResult?.requiredPrivateInputKeys.includes(key) === true,
          `${toolId} scoped GPU/model route attempt missing required private input ${key}`,
        )
      }
    } else {
      assert(scopedResult.externalAgentExecutionState === 'executable', `${toolId} scoped GPU/model route attempt should be executable when not blocked`)
      assert(scopedResult.externalAgentToolCallResult?.executable === true, `${toolId} scoped GPU/model route attempt normalized executable mismatch`)
      assert(scopedResult.externalAgentToolCallResult?.blockedWithReason === false, `${toolId} scoped GPU/model route attempt normalized blocked mismatch`)
      assert(scopedResult.controlledAdapterExecutedNow === true, `${toolId} scoped GPU/model route attempt did not execute adapter runtime`)
      assert(scopedResult.localGpuModelRuntimeExecutionPerformed === true, `${toolId} scoped GPU/model route attempt did not perform local runtime`)
      assert(Boolean(scopedResult.outputKind), `${toolId} scoped GPU/model route attempt missing output kind`)
      assert(Boolean(scopedResult.outputSha256), `${toolId} scoped GPU/model route attempt missing private output hash`)
      assert(scopedResult.blockingReasonCode === null, `${toolId} scoped GPU/model route attempt returned blocking reason after execution`)
    }
    assert(
      scopedResult.externalAgentToolCallResult?.gpuRuntimeStartPolicy ===
        (scopedResult.externalAgentExecutionState === 'executable'
          ? 'gpu_started_only_for_completed_scoped_tool_call'
          : 'on_demand_only_for_scoped_active_tool_call'),
      `${toolId} scoped GPU/model route attempt runtime policy mismatch`,
    )
    assert(scopedResult.publicArtifactCreated === false, `${toolId} scoped GPU/model route attempt created public artifact`)
    assert(scopedResult.signedUrlCreated === false, `${toolId} scoped GPU/model route attempt created signed URL`)
    assert(attempt.booleans.scopedGpuModelLocalDevRouteAttemptAccepted === true, `${toolId} scoped GPU/model route attempt was not accepted`)
    if (!attempt.booleans.scopedGpuModelRuntimeExecutionPerformed) {
      assert(attempt.booleans.scopedGpuModelLocalDevRouteAttemptBlockedWithReason === true, `${toolId} scoped GPU/model route attempt did not block with expected reason`)
    }
    assert(attempt.booleans.scopedGpuModelRuntimeContainerPayloadAccepted === true, `${toolId} scoped GPU/model route attempt did not reach container runtime branch`)
  }

  for (const result of results) {
    assert(result.statusCode === 200, `${result.toolId} did not return HTTP 200`)
    assert(result.ok === true, `${result.toolId} did not return ok envelope`)
    assert(result.controlledAdapterInvokedNow === true, `${result.toolId} adapter was not invoked`)
    assert(
      result.externalAgentToolCallResult !== null,
      `${result.toolId} missing normalized external agent tool-call result`,
    )
    assert(
      result.externalAgentToolCallResult.callable === true,
      `${result.toolId} normalized result not callable`,
    )
    assert(
      result.externalAgentToolCallResult.executionState ===
        result.externalAgentExecutionState,
      `${result.toolId} normalized execution state mismatch`,
    )
    assert(
      result.externalAgentToolCallResult.controlledAdapterInvokedNow ===
        result.controlledAdapterInvokedNow,
      `${result.toolId} normalized adapter invoked mismatch`,
    )
    assert(
      result.externalAgentToolCallResult.controlledAdapterExecutedNow ===
        result.controlledAdapterExecutedNow,
      `${result.toolId} normalized adapter executed mismatch`,
    )
    assert(
      result.externalAgentToolCallResult.gpuRuntimeShouldStartNow === false,
      `${result.toolId} normalized result started GPU runtime unexpectedly`,
    )
    assert(
      result.externalAgentToolCallResult.outputAccess.publicArtifactCreated === false,
      `${result.toolId} normalized result created public artifact`,
    )
    assert(
      result.externalAgentToolCallResult.outputAccess.signedUrlCreated === false,
      `${result.toolId} normalized result created signed URL`,
    )
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
      assert(result.externalAgentToolCallResult.executable === true, `${result.toolId} normalized CPU/static executable mismatch`)
      assert(result.externalAgentToolCallResult.blockedWithReason === false, `${result.toolId} normalized CPU/static blocked mismatch`)
      assert(result.externalAgentToolCallResult.failedWithDiagnostics === false, `${result.toolId} normalized CPU/static failure mismatch`)
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
      assert(result.externalAgentToolCallResult.executable === true, `${result.toolId} normalized browser executable mismatch`)
      assert(result.externalAgentToolCallResult.blockedWithReason === false, `${result.toolId} normalized browser blocked mismatch`)
      assert(result.externalAgentToolCallResult.failedWithDiagnostics === false, `${result.toolId} normalized browser failure mismatch`)
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
      const toolId =
        result.toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId
      assert(result.externalAgentExecutionState === 'blocked_with_reason', `${result.toolId} GPU/model execution state mismatch`)
      assert(result.externalAgentToolCallResult.executable === false, `${result.toolId} normalized GPU/model executable mismatch`)
      assert(result.externalAgentToolCallResult.blockedWithReason === true, `${result.toolId} normalized GPU/model block mismatch`)
      assert(result.externalAgentToolCallResult.failedWithDiagnostics === false, `${result.toolId} normalized GPU/model failure mismatch`)
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
      assert(
        result.externalAgentToolCallResult.nextExternalAgentCommandKind ===
          'gpu_model_private_proof_sequence',
        `${result.toolId} GPU/model normalized command kind mismatch`,
      )
      assert(
        result.externalAgentToolCallResult.nextExternalAgentCommand?.includes('ai-graphics:external-agent-gpu-model-private-proof-sequence') === true &&
          result.externalAgentToolCallResult.nextExternalAgentCommand?.includes(`--tool ${result.toolId}`) === true &&
          result.externalAgentToolCallResult.nextExternalAgentCommand?.includes('--require-host-eligible') === true &&
          result.externalAgentToolCallResult.nextExternalAgentCommand?.includes('--require-accepted-proof') === true,
        `${result.toolId} GPU/model normalized private proof sequence command missing required fragment`,
      )
      assert(
        result.externalAgentToolCallResult.nextExternalAgentRouteRetryCommandKind ===
          'scoped_gpu_model_route_retry_after_private_proof',
        `${result.toolId} GPU/model normalized route retry command kind mismatch`,
      )
      assertPreferredGpuModelRetryCommand(
        toolId,
        result.externalAgentToolCallResult.nextExternalAgentRouteRetryCommand,
        `${result.toolId} GPU/model normalized scoped route retry command`,
      )
      assert(
        result.externalAgentToolCallResult.gpuRuntimeStartPolicy ===
          'on_demand_only_for_scoped_active_tool_call',
        `${result.toolId} GPU/model normalized runtime policy mismatch`,
      )
      for (const key of gpuModelPreferredPrivateInputKeys(toolId)) {
        assert(
          result.externalAgentToolCallResult.requiredPrivateInputKeys.includes(key),
          `${result.toolId} GPU/model normalized result missing private input key ${key}`,
        )
      }
      assertPreferredGpuModelBlockedPrerequisite(
        toolId,
        result.externalAgentToolCallResult.blockedRuntimePrerequisites,
        `${result.toolId} GPU/model normalized result`,
      )
    }
  }
}

function buildReport(
  disabledGpuStatus: number,
  results: ControlledRouteExecutionResult[],
  scopedGpuModelLocalDevRouteAttempts: ScopedGpuModelLocalDevRouteAttempt[],
  capabilityMismatchFailureProbe: ControlledRouteExecutionResult,
) {
  const scopedGpuModelLocalDevRouteAttempt =
    scopedGpuModelLocalDevRouteAttempts.find(
      (item) => item.requestedToolId === 'kornia',
    ) ?? scopedGpuModelLocalDevRouteAttempts[0]
  const scopedGpuModelBlockedAttempts = scopedGpuModelLocalDevRouteAttempts
    .filter((item) => (
      item.booleans.scopedGpuModelLocalDevRouteAttemptBlockedWithReason
    ))
  const scopedGpuModelRuntimeExecutedAttempts = scopedGpuModelLocalDevRouteAttempts
    .filter((item) => item.booleans.scopedGpuModelRuntimeExecutionPerformed)
  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-all21-controlled-route-execution-smoke',
    decision,
    status,
    routePath: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
    routeFlags: {
      routeMount: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG,
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
    capabilityMismatchFailureProbe,
    scopedGpuModelLocalDevRouteAttempt,
    scopedGpuModelLocalDevRouteAttempts,
    gpuModelRuntimePolicy: {
      scopedGpuModelPrivateInputPreflightBeforeGpuAttachment: true,
      scopedGpuModelMissingPrivateInputsBlockBeforeGpuStartup: true,
      scopedGpuModelRuntimeImageMissingBlocksBeforeInputInspection: true,
      scopedGpuModelGpuStartsOnlyAfterPrivateInputsAndRuntimeProof: true,
      noIdleGpuRuntimeApproved: true,
    },
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
      normalizedExternalAgentToolCallResultTools:
        results.filter((item) => item.externalAgentToolCallResult !== null).length,
      normalizedExternalAgentCallableResultTools:
        results.filter((item) => item.externalAgentToolCallResult?.callable).length,
      normalizedExternalAgentExecutableResultTools:
        results.filter((item) => item.externalAgentToolCallResult?.executable).length,
      normalizedExternalAgentBlockedWithReasonResultTools:
        results.filter((item) => item.externalAgentToolCallResult?.blockedWithReason).length,
      normalizedExternalAgentFailedWithDiagnosticsResultTools:
        results.filter((item) => item.externalAgentToolCallResult?.failedWithDiagnostics).length,
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
      scopedGpuModelLocalDevRouteAttemptTools:
        scopedGpuModelLocalDevRouteAttempts.length,
      scopedGpuModelLocalDevRouteAttemptBlockedWithReasonTools:
        scopedGpuModelBlockedAttempts.length,
      scopedGpuModelLocalDevRouteAttemptRuntimeExecutedTools:
        scopedGpuModelRuntimeExecutedAttempts.length,
      capabilityMismatchFailureProbeTools:
        capabilityMismatchFailureProbe.externalAgentExecutionState ===
        'failed_with_diagnostics'
          ? 1
          : 0,
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
      normalizedExternalAgentToolCallResultsReturned:
        results.every((item) => item.externalAgentToolCallResult !== null),
      normalizedExternalAgentToolCallResultsMatchStates:
        results.every((item) => (
          item.externalAgentToolCallResult?.executionState ===
            item.externalAgentExecutionState
        )),
      normalizedExternalAgentToolCallResultsPreserveSafetyGates:
        results.every((item) => (
          item.externalAgentToolCallResult?.callable === true &&
          item.externalAgentToolCallResult?.gpuRuntimeShouldStartNow === false &&
          item.externalAgentToolCallResult?.outputAccess.publicArtifactCreated === false &&
          item.externalAgentToolCallResult?.outputAccess.signedUrlCreated === false
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
      all8ScopedGpuModelLocalDevRouteAttemptsAccepted:
        scopedGpuModelLocalDevRouteAttempts.length === 8 &&
        scopedGpuModelLocalDevRouteAttempts.every((item) => (
          item.booleans.scopedGpuModelLocalDevRouteAttemptAccepted
        )),
      all8ScopedGpuModelRuntimeContainerPayloadsAccepted:
        scopedGpuModelLocalDevRouteAttempts.length === 8 &&
        scopedGpuModelLocalDevRouteAttempts.every((item) => (
          item.booleans.scopedGpuModelRuntimeContainerPayloadAccepted
        )),
      capabilityMismatchFailureProbeAccepted:
        capabilityMismatchFailureProbe.externalAgentExecutionState ===
          'failed_with_diagnostics' &&
        capabilityMismatchFailureProbe.externalAgentToolCallResult
          ?.failedWithDiagnostics === true &&
        capabilityMismatchFailureProbe.controlledAdapterInvokedNow === false &&
        capabilityMismatchFailureProbe.controlledAdapterExecutedNow === false,
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
      gpuRuntimePerformed:
        scopedGpuModelLocalDevRouteAttempts.some((item) => (
          item.booleans.scopedGpuModelRuntimeExecutionPerformed &&
            item.booleans.scopedGpuModelGpuRuntimeShouldStartNow
        )),
      gpuRuntimeShouldStartNow:
        scopedGpuModelLocalDevRouteAttempts.some((item) => (
          item.booleans.scopedGpuModelGpuRuntimeShouldStartNow
        )),
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
      `| \`${item.toolId}\` | \`${item.group}\` | \`${item.capabilityId}\` | \`${item.externalAgentExecutionState}\` | \`${item.externalAgentToolCallResult?.callable}\` | \`${item.externalAgentToolCallResult?.executable}\` | \`${item.externalAgentToolCallResult?.blockedWithReason}\` | \`${item.statusCode}\` | \`${item.controlledAdapterInvokedNow}\` | \`${item.controlledAdapterExecutedNow}\` | \`${item.localPackageExecutionPerformed}\` | \`${item.localGpuModelRuntimeExecutionPerformed}\` | \`${item.gpuRuntimeShouldStartNow}\` |`
    ))
    .join('\n')
  const scopedRows = report.scopedGpuModelLocalDevRouteAttempts
    .map((item) => {
      const preferredRetryCommand =
        item.result.externalAgentToolCallResult?.nextExternalAgentRouteRetryCommand ??
        item.nextExactCommand
      return `| \`${item.requestedToolId}\` | \`${item.result.externalAgentExecutionState}\` | \`${item.result.blockingReasonCode}\` | \`${item.runtimeContainerImageProvided}\` | \`${item.result.localGpuModelRuntimeExecutionPerformed}\` | \`${item.result.gpuRuntimeShouldStartNow}\` | \`${preferredRetryCommand}\` |`
    })
    .join('\n')
  const failureProbe = report.capabilityMismatchFailureProbe

  return `# AI Graphics External Agent All-21 Controlled Route Execution Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This smoke starts the real Express app and POSTs all 21 AI graphics tool calls through \`${report.routePath}\` with the controlled CPU/static, browser-runtime, and GPU/model route flags enabled. It proves the agent-facing route can accept every tool call now. It does not claim all 21 tools have real runtime execution proof: CPU/static and browser-runtime adapters execute now, while GPU/model adapters are route-callable and remain blocked from runtime execution until native GPU proof and reviewed private model manifests are accepted.

## Tool Results

| Tool | Group | Capability | External-agent state | Callable | Executable | Blocked with reason | HTTP status | Adapter invoked | Adapter executed | Local package execution | Local GPU/model runtime | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Scoped GPU/model route attempts

| Tool | External-agent state | Blocking reason | Runtime image provided | Runtime executed | GPU starts now | Preferred retry command |
| --- | --- | --- | --- | --- | --- | --- |
${scopedRows}

## Capability mismatch failure probe

- \`toolId\`: \`${failureProbe.toolId}\`
- \`requestedCapabilityId\`: \`${failureProbe.capabilityId}\`
- \`externalAgentExecutionState\`: \`${failureProbe.externalAgentExecutionState}\`
- \`routeStatus\`: \`${failureProbe.routeStatus}\`
- \`failureDiagnostics\`: \`${failureProbe.failureDiagnostics}\`
- \`adapterInvoked\`: \`${failureProbe.controlledAdapterInvokedNow}\`
- \`adapterExecuted\`: \`${failureProbe.controlledAdapterExecutedNow}\`
- \`expectedCapabilities\`: \`${failureProbe.expectedCapabilities.join(', ')}\`

## Canonical fastest scoped GPU/model route attempt

- \`toolId\`: \`${report.scopedGpuModelLocalDevRouteAttempt.requestedToolId}\`
- \`runtimeExecutionBackend\`: \`${report.scopedGpuModelLocalDevRouteAttempt.requestedRuntimeBackend}\`
- \`runtimeContainerImageProvided\`: \`${report.scopedGpuModelLocalDevRouteAttempt.runtimeContainerImageProvided}\`
- \`requestedRuntimeContainerImage\`: \`${report.scopedGpuModelLocalDevRouteAttempt.requestedRuntimeContainerImage}\`
- \`nextExactCommand\`: \`${report.scopedGpuModelLocalDevRouteAttempt.nextExactCommand}\`
- \`externalAgentExecutionState\`: \`${report.scopedGpuModelLocalDevRouteAttempt.result.externalAgentExecutionState}\`
- \`blockingReasonCode\`: \`${report.scopedGpuModelLocalDevRouteAttempt.result.blockingReasonCode}\`
- \`gpuRuntimeShouldStartNow\`: \`${report.scopedGpuModelLocalDevRouteAttempt.result.gpuRuntimeShouldStartNow}\`

${report.scopedGpuModelLocalDevRouteAttempt.summary}

## Boundary

This smoke does not dispatch Workers, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, download model weights, unlock paid production, or mark runtime/beta/production ready. CPU/static and browser-runtime adapters execute in the explicit mock/local controlled route. GPU/model adapters are invoked through the controlled route, but local GPU/model runtime does not start until a scoped request supplies explicit local-dev runtime inputs, reviewed private manifests, accepted native GPU proof, and approval refs.

Missing private source/model/checkpoint paths block before Docker GPU attachment. If no Docker runtime image is supplied, the scoped request blocks at the missing image prerequisite before inspecting local private inputs.
`
}

async function main() {
  const scopedGpuModelOptions: ScopedGpuModelLocalDevRouteAttemptOptions = {
    runtimeContainerImage: stringArg('--scoped-gpu-runtime-container-image'),
    runtimeContainerPlatform:
      stringArg('--scoped-gpu-runtime-container-platform'),
    allowCpuTensorRuntime:
      hasFlag('--scoped-gpu-allow-cpu-tensor-runtime'),
    allowCpuFoundationRuntime:
      hasFlag('--scoped-gpu-allow-cpu-foundation-runtime'),
    privateOutputRoot: stringArg('--scoped-gpu-output-root'),
    privateOutputDirectory: stringArg('--scoped-gpu-output-dir'),
    privateSourceImageLocalPath: stringArg('--scoped-gpu-source-image'),
    sam2CheckpointLocalPath: stringArg('--scoped-gpu-sam2-checkpoint'),
    birefnetModelLocalPath: stringArg('--scoped-gpu-birefnet-model'),
    realEsrganModelLocalPath: stringArg('--scoped-gpu-real-esrgan-model'),
    rembgModelLocalPath: stringArg('--scoped-gpu-rembg-model'),
    transparentBackgroundCheckpointLocalPath:
      stringArg('--scoped-gpu-transparent-background-checkpoint'),
  }
  const scopedGpuModelToolIds = scopedGpuModelToolIdsFromArgs()
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

  const scopedGpuModelLocalDevRouteAttempts = await withServer(
    true,
    async (baseUrl) => {
      const attempts: ScopedGpuModelLocalDevRouteAttempt[] = []
      for (const toolId of scopedGpuModelToolIds) {
        const sourceCase = cases.find((item) => item.toolId === toolId) ?? gpuCase
        const result = await runControlledCase(
          baseUrl,
          scopedGpuModelLocalDevRouteAttemptRequest(
            {
              ...sourceCase,
              toolId,
              capabilityId: sourceCase.capabilityId,
            },
            toolId,
            scopedGpuModelOptions,
          ),
        )
        attempts.push(buildScopedGpuModelLocalDevRouteAttempt(
          result,
          scopedGpuModelOptions,
        ))
      }
      return attempts
    },
  )
  const d3Case = cases.find((item) => item.toolId === 'd3')
  assert(d3Case, 'Expected d3 controlled route case')
  const capabilityMismatchFailureProbe = await withServer(
    true,
    async (baseUrl) => runControlledCase(
      baseUrl,
      capabilityMismatchFailureProbeRequest(d3Case),
    ),
  )

  validateResults(
    results,
    disabledGpuStatus,
    scopedGpuModelLocalDevRouteAttempts,
    scopedGpuModelToolIds,
    capabilityMismatchFailureProbe,
  )
  const report = buildReport(
    disabledGpuStatus,
    results,
    scopedGpuModelLocalDevRouteAttempts,
    capabilityMismatchFailureProbe,
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
