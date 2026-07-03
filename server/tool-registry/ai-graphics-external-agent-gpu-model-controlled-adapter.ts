import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'
import {
  runAiGraphicsFoundationRuntimeCheck,
  type AiGraphicsFoundationRuntimeToolId,
} from '../workers/model-runtime-foundation'
import { buildMaskTaskPlan } from '../workers/masks/mask-task-plan-builder'
import { runBiRefNetMask } from '../workers/masks/birefnet-execution-runner'
import { runKorniaMaskRefinement } from '../workers/masks/kornia-mask-refinement-adapter'
import { runRembgFallback } from '../workers/masks/rembg-adapter'
import { runSam2Tracking } from '../workers/masks/sam2-execution-runner'
import { runTransparentBackgroundFallback } from '../workers/masks/transparent-background-adapter'
import type {
  MaskExecutionInput,
  MaskIntent,
  MaskToolExecutionResult,
  MaskToolId,
} from '../workers/masks/mask-execution-types'
import { buildEnhancementTaskPlan } from '../workers/enhancement/enhancement-task-plan-builder'
import { runRealEsrganEnhancement } from '../workers/enhancement/real-esrgan-execution-runner'
import type {
  EnhancementExecutionInput,
  EnhancementToolExecutionResult,
} from '../workers/enhancement/enhancement-execution-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_DECISION =
  'ai_graphics_external_agent_gpu_model_controlled_adapter_executable_eight_on_demand_with_runtime_blocks'

export const AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

export type AiGraphicsExternalAgentGpuModelControlledAdapterToolId =
  (typeof AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS)[number]

export type AiGraphicsExternalAgentGpuModelControlledAdapterStatus =
  | 'controlled_gpu_model_adapter_invoked_runtime_skipped'
  | 'controlled_gpu_model_adapter_executed_private_output_ready'
  | 'controlled_gpu_model_adapter_failed_before_output'
  | 'controlled_gpu_model_adapter_rejected_unsupported_tool'

export interface AiGraphicsExternalAgentGpuModelControlledAdapterRequest {
  workspaceId: string
  requestId: string
  toolId: AiGraphicsCanonicalToolId
  capabilityId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  toolRouteApprovalRef: string
  workerApprovalRef: string
  runtimeEnqueueApprovalRef: string
  ownerRuntimeApprovalRef: string
  nativeGpuRuntimeProofRef?: string
  modelWeightManifestRef?: string
  externalBetaPerToolRuntimeProofRef?: string
  traceId: string
  payload?: Record<string, unknown>
}

export interface AiGraphicsExternalAgentGpuModelControlledAdapterResult {
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_DECISION
  status: AiGraphicsExternalAgentGpuModelControlledAdapterStatus
  requestId: string
  traceId: string
  toolId: AiGraphicsCanonicalToolId
  capabilityId: string
  controlledAdapterExecutableNow: boolean
  controlledAdapterInvokedNow: boolean
  localGpuModelRuntimeExecutionPerformed: boolean
  externalAgentCanExecuteViaMountedRouteNow: false
  routeExecutionApprovedNow: false
  workerExecutionApprovedNow: false
  toolExecutionApprovedNow: boolean
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedForScopedControlledToolCall: boolean
  gpuRuntimeShouldStartNow: boolean
  providerRuntimeApprovedNow: false
  publicArtifactCreated: false
  signedUrlCreated: false
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
  privateArtifactManifestRef: string
  runtimeOutput: Record<string, unknown>
  warnings: string[]
  blockersBeforeGlobalExecution: string[]
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function optionalString(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

function optionalNumber(
  payload: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = payload[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optionalBoolean(payload: Record<string, unknown>, key: string): boolean {
  return payload[key] === true
}

function privateRef(value: string, field: string): void {
  if (!value.startsWith('private://')) {
    throw new Error(`${field} must be a private:// reference`)
  }
}

function assertRequestBoundary(
  request: AiGraphicsExternalAgentGpuModelControlledAdapterRequest,
): void {
  if (!request.workspaceId) throw new Error('workspaceId is required')
  if (!request.requestId) throw new Error('requestId is required')
  if (!request.approvedPlanSnapshotId) {
    throw new Error('approvedPlanSnapshotId is required')
  }
  if (!request.creditReservationId) {
    throw new Error('creditReservationId is required')
  }
  if (!request.traceId) throw new Error('traceId is required')
  privateRef(request.privateArtifactManifestRef, 'privateArtifactManifestRef')
  privateRef(request.toolRouteApprovalRef, 'toolRouteApprovalRef')
  privateRef(request.workerApprovalRef, 'workerApprovalRef')
  privateRef(request.runtimeEnqueueApprovalRef, 'runtimeEnqueueApprovalRef')
  privateRef(request.ownerRuntimeApprovalRef, 'ownerRuntimeApprovalRef')
}

export function isAiGraphicsExternalAgentGpuModelControlledAdapterTool(
  toolId: AiGraphicsCanonicalToolId | string,
): toolId is AiGraphicsExternalAgentGpuModelControlledAdapterToolId {
  return AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.includes(
    toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  )
}

function executionEnabled(payload: Record<string, unknown>): boolean {
  return optionalBoolean(payload, 'enableGpuModelControlledExecution')
}

function maskInput(
  request: AiGraphicsExternalAgentGpuModelControlledAdapterRequest,
  payload: Record<string, unknown>,
  selectedPrimaryTool: MaskToolId,
  maskIntent: MaskIntent,
): MaskExecutionInput {
  const representativeFrameLocalPath = optionalString(payload, 'representativeFrameLocalPath')
  const fallbackTools = Array.isArray(payload.fallbackTools)
    ? payload.fallbackTools.filter((tool): tool is MaskToolId => (
        typeof tool === 'string' &&
        ['birefnet', 'sam2', 'transparent_background', 'rembg', 'opencv', 'kornia', 'none'].includes(tool)
      ))
    : []

  return {
    mode: optionalString(payload, 'mode') === 'local_dev' ? 'local_dev' : 'dry_run',
    workspaceId: request.workspaceId,
    projectId:
      optionalString(payload, 'projectId') ??
      `project-ai-graphics-${request.workspaceId}`,
    mediaAssetId:
      optionalString(payload, 'mediaAssetId') ??
      `${request.toolId}-controlled-gpu-model-runtime`,
    approvedSnapshotId: request.approvedPlanSnapshotId,
    toolExecutionPlanId: optionalString(payload, 'toolExecutionPlanId'),
    idempotencyKey:
      optionalString(payload, 'idempotencyKey') ??
      `ai-graphics-external-agent-gpu-model-controlled:${request.requestId}:${request.toolId}`,
    sourceImageLocalPath: optionalString(payload, 'sourceImageLocalPath'),
    sourceVideoLocalPath: optionalString(payload, 'sourceVideoLocalPath'),
    proxyVideoLocalPath: optionalString(payload, 'proxyVideoLocalPath'),
    representativeFrameLocalPaths: representativeFrameLocalPath
      ? [representativeFrameLocalPath]
      : undefined,
    outputDirectory: optionalString(payload, 'outputDirectory'),
    maskIntent,
    selectedPrimaryTool,
    fallbackTools,
    modelWeightManifestIds: request.modelWeightManifestRef
      ? [request.modelWeightManifestRef]
      : undefined,
    birefnetModelLocalPath: optionalString(payload, 'birefnetModelLocalPath'),
    sam2CheckpointLocalPath: optionalString(payload, 'sam2CheckpointLocalPath'),
    rembgModelLocalPath: optionalString(payload, 'rembgModelLocalPath'),
    rembgModelName: optionalString(payload, 'rembgModelName'),
    transparentBackgroundCheckpointLocalPath: optionalString(
      payload,
      'transparentBackgroundCheckpointLocalPath',
    ),
    transparentBackgroundMode:
      optionalString(payload, 'transparentBackgroundMode') as
        | 'base'
        | 'fast'
        | 'base-nightly'
        | undefined,
    maskConfidenceHint: optionalNumber(payload, 'maskConfidenceHint'),
    motionRequiresTracking: selectedPrimaryTool === 'sam2',
    enableModelMaskExecution: executionEnabled(payload),
    enableMaskPreview: false,
    allowModelDownload: false,
    allowFinalRender: false,
    timeoutMs: optionalNumber(payload, 'timeoutMs'),
  }
}

function enhancementInput(
  request: AiGraphicsExternalAgentGpuModelControlledAdapterRequest,
  payload: Record<string, unknown>,
): EnhancementExecutionInput {
  const representativeFrameLocalPath = optionalString(payload, 'representativeFrameLocalPath')
  return {
    mode: optionalString(payload, 'mode') === 'local_dev' ? 'local_dev' : 'dry_run',
    workspaceId: request.workspaceId,
    projectId:
      optionalString(payload, 'projectId') ??
      `project-ai-graphics-${request.workspaceId}`,
    mediaAssetId:
      optionalString(payload, 'mediaAssetId') ??
      'real-esrgan-controlled-gpu-model-runtime',
    approvedSnapshotId: request.approvedPlanSnapshotId,
    toolExecutionPlanId: optionalString(payload, 'toolExecutionPlanId'),
    idempotencyKey:
      optionalString(payload, 'idempotencyKey') ??
      `ai-graphics-external-agent-gpu-model-controlled:${request.requestId}:real_esrgan`,
    sourceImageLocalPath: optionalString(payload, 'sourceImageLocalPath'),
    sourceVideoLocalPath: optionalString(payload, 'sourceVideoLocalPath'),
    representativeFrameLocalPaths: representativeFrameLocalPath
      ? [representativeFrameLocalPath]
      : undefined,
    outputDirectory: optionalString(payload, 'outputDirectory'),
    enhancementIntent: optionalString(payload, 'enhancementIntent') === 'restore_video_frames'
      ? 'restore_video_frames'
      : optionalString(payload, 'enhancementIntent') === 'enhance_thumbnail'
      ? 'enhance_thumbnail'
      : optionalString(payload, 'enhancementIntent') === 'improve_low_resolution_clip'
      ? 'improve_low_resolution_clip'
      : 'upscale_image',
    targetScale: optionalNumber(payload, 'targetScale') ?? 2,
    sourceQualityIssueDetected: true,
    approvedEnhancementReason:
      optionalString(payload, 'approvedEnhancementReason') ??
      'external agent controlled on-demand Real-ESRGAN runtime request',
    sampleOnly: true,
    sampleCount: 1,
    modelWeightManifestIds: request.modelWeightManifestRef
      ? [request.modelWeightManifestRef]
      : undefined,
    realEsrganModelLocalPath: optionalString(payload, 'realEsrganModelLocalPath'),
    enableModelEnhancementExecution: executionEnabled(payload),
    enableFfmpegFallbackPreview: false,
    allowModelDownload: false,
    allowFinalRender: false,
    timeoutMs: optionalNumber(payload, 'timeoutMs'),
  }
}

function toolResultSummary(
  result: MaskToolExecutionResult | EnhancementToolExecutionResult,
): Record<string, unknown> {
  return {
    status: result.status,
    tool: result.tool,
    commandPlan: result.commandPlan ?? null,
    artifactCount:
      (result.artifact ? 1 : 0) +
      (Array.isArray(result.artifacts) ? result.artifacts.length : 0),
    skipReason: result.skipReason ?? null,
    warningCount: result.warnings.length,
    errorMessage: result.errorMessage,
  }
}

async function runMaskTool(
  request: AiGraphicsExternalAgentGpuModelControlledAdapterRequest,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const selectedPrimaryTool = request.toolId as MaskToolId
  const maskIntent: MaskIntent = request.toolId === 'sam2'
    ? 'subject_cutout'
    : request.toolId === 'kornia'
    ? 'background_removal_video'
    : 'background_removal_image'
  const executionInput = maskInput(request, payload, selectedPrimaryTool, maskIntent)
  const taskPlan = buildMaskTaskPlan(executionInput)
  const directInput = { executionInput, taskPlan }
  const result =
    request.toolId === 'sam2'
      ? await runSam2Tracking(directInput)
      : request.toolId === 'birefnet'
      ? await runBiRefNetMask(directInput)
      : request.toolId === 'kornia'
      ? await runKorniaMaskRefinement(directInput)
      : request.toolId === 'rembg'
      ? await runRembgFallback(directInput)
      : await runTransparentBackgroundFallback(directInput)

  return {
    executionInputMode: executionInput.mode,
    taskPlanId: taskPlan.taskPlanId,
    selectedPrimaryTool: taskPlan.primaryTool,
    result: toolResultSummary(result),
    localRuntimeExecutionPerformed:
      result.status === 'completed' && result.commandPlan?.executes === true,
    warnings: result.warnings,
  }
}

async function runEnhancementTool(
  request: AiGraphicsExternalAgentGpuModelControlledAdapterRequest,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const executionInput = enhancementInput(request, payload)
  const taskPlan = buildEnhancementTaskPlan(executionInput)
  const result = await runRealEsrganEnhancement({ executionInput, taskPlan })

  return {
    executionInputMode: executionInput.mode,
    taskPlanId: taskPlan.taskPlanId,
    selectedPrimaryTool: taskPlan.primaryTool,
    result: toolResultSummary(result),
    localRuntimeExecutionPerformed:
      result.status === 'completed' && result.commandPlan?.executes === true,
    warnings: result.warnings,
  }
}

async function runFoundationTool(
  request: AiGraphicsExternalAgentGpuModelControlledAdapterRequest,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = await runAiGraphicsFoundationRuntimeCheck({
    mode: optionalString(payload, 'mode') === 'local_dev' ? 'local_dev' : 'dry_run',
    toolId: request.toolId as AiGraphicsFoundationRuntimeToolId,
    workspaceId: request.workspaceId,
    projectId:
      optionalString(payload, 'projectId') ??
      `project-ai-graphics-${request.workspaceId}`,
    approvedSnapshotId: request.approvedPlanSnapshotId,
    outputDirectory: optionalString(payload, 'outputDirectory'),
    enableFoundationRuntimeExecution:
      optionalBoolean(payload, 'enableFoundationRuntimeExecution') ||
      executionEnabled(payload),
    timeoutMs: optionalNumber(payload, 'timeoutMs'),
  })
  return {
    executionInputMode: optionalString(payload, 'mode') === 'local_dev'
      ? 'local_dev'
      : 'dry_run',
    result: {
      status: result.status,
      tool: result.tool,
      commandPlan: result.commandPlan,
      outputJsonPath: result.outputJsonPath,
      outputJsonSizeBytes: result.outputJsonSizeBytes,
      skipReason: result.skipReason ?? null,
      warningCount: result.warnings.length,
      errorMessage: result.errorMessage,
    },
    localRuntimeExecutionPerformed:
      result.status === 'completed' && result.commandPlan.executes === true,
    warnings: result.warnings,
  }
}

export async function executeAiGraphicsExternalAgentGpuModelControlledAdapter(
  request: AiGraphicsExternalAgentGpuModelControlledAdapterRequest,
): Promise<AiGraphicsExternalAgentGpuModelControlledAdapterResult> {
  assertRequestBoundary(request)

  if (!isAiGraphicsExternalAgentGpuModelControlledAdapterTool(request.toolId)) {
    return {
      decision: AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_DECISION,
      status: 'controlled_gpu_model_adapter_rejected_unsupported_tool',
      requestId: request.requestId,
      traceId: request.traceId,
      toolId: request.toolId,
      capabilityId: request.capabilityId,
      controlledAdapterExecutableNow: false,
      controlledAdapterInvokedNow: false,
      localGpuModelRuntimeExecutionPerformed: false,
      externalAgentCanExecuteViaMountedRouteNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedForScopedControlledToolCall: false,
      gpuRuntimeShouldStartNow: false,
      providerRuntimeApprovedNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      privateArtifactManifestRef: request.privateArtifactManifestRef,
      runtimeOutput: {},
      warnings: [],
      blockersBeforeGlobalExecution: ['unsupported GPU/model tool id'],
    }
  }

  const payload = asObject(request.payload)
  const runtimeOutput = request.toolId === 'torch_torchvision' ||
      request.toolId === 'transformers'
    ? await runFoundationTool(request, payload)
    : request.toolId === 'real_esrgan'
    ? await runEnhancementTool(request, payload)
    : await runMaskTool(request, payload)

  const localRuntimeExecutionPerformed =
    runtimeOutput.localRuntimeExecutionPerformed === true
  const skipped = (
    runtimeOutput.result as { status?: unknown } | undefined
  )?.status === 'skipped'
  const failed = (
    runtimeOutput.result as { status?: unknown } | undefined
  )?.status === 'failed'

  return {
    decision: AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_DECISION,
    status: localRuntimeExecutionPerformed
      ? 'controlled_gpu_model_adapter_executed_private_output_ready'
      : failed
      ? 'controlled_gpu_model_adapter_failed_before_output'
      : 'controlled_gpu_model_adapter_invoked_runtime_skipped',
    requestId: request.requestId,
    traceId: request.traceId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    controlledAdapterExecutableNow: true,
    controlledAdapterInvokedNow: true,
    localGpuModelRuntimeExecutionPerformed: localRuntimeExecutionPerformed,
    externalAgentCanExecuteViaMountedRouteNow: false,
    routeExecutionApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: localRuntimeExecutionPerformed,
    browserWebglCanvasRuntimeApprovedNow: false,
    gpuRuntimeApprovedForScopedControlledToolCall: localRuntimeExecutionPerformed,
    gpuRuntimeShouldStartNow: localRuntimeExecutionPerformed,
    providerRuntimeApprovedNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    runtimeOutput,
    warnings: [
      ...(
        Array.isArray(runtimeOutput.warnings)
          ? runtimeOutput.warnings.filter((warning): warning is string => typeof warning === 'string')
          : []
      ),
      ...(skipped
        ? ['GPU/model runtime did not start because explicit local-dev execution inputs were not provided.']
        : []),
      'GPU/model runtime is approved only for the scoped accepted tool call; idle GPU startup remains blocked.',
    ],
    blockersBeforeGlobalExecution: [
      'external beta and production readiness remain blocked',
      'public artifact and signed URL creation remain blocked',
      'provider/model service calls remain blocked; only local worker runtime hooks may execute',
    ],
  }
}
