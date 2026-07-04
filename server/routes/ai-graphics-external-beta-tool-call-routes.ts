import { Router } from 'express'
import path from 'node:path'
import { z } from 'zod'
import { ApiError } from '../errors/api-error'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import {
  executeAiGraphicsExternalAgentCpuStaticControlledAdapter,
  isAiGraphicsExternalAgentCpuStaticControlledAdapterTool,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import {
  executeAiGraphicsExternalAgentBrowserRuntimeControlledAdapter,
  isAiGraphicsExternalAgentBrowserRuntimeControlledAdapterTool,
} from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import {
  executeAiGraphicsExternalAgentGpuModelControlledAdapter,
  isAiGraphicsExternalAgentGpuModelControlledAdapterTool,
} from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'
import { listAiGraphicsToolCallHandoffTools } from '../tool-registry/ai-graphics-tool-call-handoff'
import { evaluateAiGraphicsOnDemandRuntimeAdmission } from '../tool-registry/ai-graphics-on-demand-runtime-admission'
import { evaluateAiGraphicsToolCallPlan } from '../tool-registry/ai-graphics-tool-call-plan-evaluator'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  getAiGraphicsToolCallReadiness,
} from '../tool-registry/ai-graphics-tool-call-readiness'
import type { ServiceContext } from '../types'
import { validateBody } from '../validation/common-schemas'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH =
  '/api/ai-graphics/external-beta/tool-call'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_READINESS_ROUTE_PATH =
  '/api/ai-graphics/external-beta/tool-call/readiness'

export const AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH =
  '/api/ai-graphics/external-agent/tool-call'

export const AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_READINESS_ROUTE_PATH =
  '/api/ai-graphics/external-agent/tool-call/readiness'

export const AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG =
  'AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_REQUIRED_FUTURE_MIDDLEWARE = [
  'requireAuth',
  'requireIdempotency',
  'approvedSnapshotResolver',
  'creditReservationResolver',
  'privateArtifactPolicy',
  'assetManifestBinding',
  'dependencyReadinessPolicy',
  'asyncCheckbackPolicy',
  'queueSubmissionAuthorization',
  'serviceRoleBoundary',
  'rateLimitPolicy',
  'costGuardrailPolicy',
  'auditLog',
  'telemetry',
  'killSwitch',
] as const

const AI_GRAPHICS_CANONICAL_GPU_MODEL_RUNTIME_CONTAINER_IMAGE =
  'reeditpro/ai-graphics-gpu-worker:proof-local'

const AI_GRAPHICS_CANONICAL_GPU_MODEL_RUNTIME_CONTAINER_BUILD_COMMAND =
  `docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/gpu-worker/Dockerfile -t ${AI_GRAPHICS_CANONICAL_GPU_MODEL_RUNTIME_CONTAINER_IMAGE} .`

const aiGraphicsToolIdSchema = z.enum([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
])

const aiGraphicsCapabilitySchema = z.enum([
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
])

type AiGraphicsExternalBetaToolCallCapability = z.infer<
  typeof aiGraphicsCapabilitySchema
>

const aiGraphicsExternalBetaToolCallPrimaryCapabilityByToolId: Record<
  string,
  AiGraphicsExternalBetaToolCallCapability
> = {
  torch_torchvision: 'model_runtime_foundation',
  transformers: 'model_runtime_foundation',
  sam2: 'subject_segmentation',
  birefnet: 'background_removal',
  real_esrgan: 'upscaling',
  kornia: 'tensor_image_ops',
  rembg: 'background_removal',
  transparent_background: 'background_removal',
  d3: 'chart_overlay',
  echarts: 'chart_overlay',
  vega_lite: 'data_visualization',
  vega: 'data_visualization',
  satori: 'svg_graphics',
  svgdotjs_svg_js: 'svg_graphics',
  viz_js: 'diagram_graphics',
  lottie_web: 'animation_overlay',
  animejs: 'animation_overlay',
  three_js: 'webgl_3d_scene',
  pixi_js: 'canvas_scene',
  konva: 'canvas_scene',
  babylonjs: 'webgl_3d_scene',
}

const privateRefSchema = z.string().min(1).regex(/^private:\/\//)

const gpuModelPayloadLocalPathFields = [
  'sourceImageLocalPath',
  'representativeFrameLocalPath',
  'sourceVideoLocalPath',
  'proxyVideoLocalPath',
  'sam2CheckpointLocalPath',
  'birefnetModelLocalPath',
  'realEsrganModelLocalPath',
  'rembgModelLocalPath',
  'transparentBackgroundCheckpointLocalPath',
] as const

const gpuModelPayloadForbiddenTrueFields = [
  'publicArtifactCreated',
  'signedUrlCreated',
  'providerRuntimePerformed',
  'providerRuntimeApprovedNow',
  'modelWeightsDownloaded',
  'modelDownloadedExternally',
  'externalModelDownloadAttempted',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
] as const

const aiGraphicsGpuModelRuntimeAdmissionToolIds = new Set<string>([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const aiGraphicsModelWeightManifestRequiredToolIds = new Set<string>([
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
])

const AI_GRAPHICS_GPU_MODEL_PRIVATE_EVIDENCE_COMMANDS = [
  'npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence',
  'npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence',
  'npm run --silent ai-graphics:model-weight-manifest-authoring -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --out-dir .local-artifacts/ai-graphics/model-weight-manifests',
  'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests',
  'npm run --silent ai-graphics:model-weight-private-evidence-intake -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --manifest-supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests',
] as const

const AI_GRAPHICS_GPU_MODEL_NATIVE_PROOF_COMMANDS = [
  'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests --script-out .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh',
  'npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible',
  'npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results',
  'npm run --silent ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector -- --source-cloud-run-job-scaffold-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json --logs-dir .local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results --out-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results/cloud-run-extracted-profile-results',
  'npm run --silent ai-graphics:external-beta-native-gpu-proof-collection:diagnostics',
] as const

const AI_GRAPHICS_GPU_MODEL_PER_TOOL_RECHECK_COMMANDS = [
  'npm run --silent ai-graphics:external-beta-per-tool-runtime-proof -- --external-beta-tool-route-runtime-proof-packet docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json --node-runtime-proof-packet docs/tool-intelligence/ai-graphics/node-runtime-proof.json --browser-runtime-proof-packet docs/tool-intelligence/ai-graphics/browser-runtime-proof.json --satori-font-runtime-proof-packet docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json --gpu-runtime-proof-result-packet .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json --external-beta-per-tool-runtime-proof-policy-ref private://ai-graphics/external-beta/per-tool-runtime-proof/policy --external-beta-per-tool-runtime-proof-schema-ref private://ai-graphics/external-beta/per-tool-runtime-proof/schema --external-beta-runtime-proof-evidence-ref private://ai-graphics/external-beta/per-tool-runtime-proof/evidence --external-beta-runtime-proof-telemetry-ref private://ai-graphics/external-beta/per-tool-runtime-proof/telemetry --external-beta-runtime-proof-rollback-ref private://ai-graphics/external-beta/per-tool-runtime-proof/rollback',
] as const

export function isAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionTool(
  toolId: string,
) {
  return aiGraphicsGpuModelRuntimeAdmissionToolIds.has(toolId)
}

export const aiGraphicsExternalBetaToolCallRequestSchema = z.object({
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  toolId: aiGraphicsToolIdSchema,
  capabilityId: aiGraphicsCapabilitySchema,
  approvedPlanSnapshotId: z.string().min(1),
  creditReservationId: z.string().min(1),
  privateArtifactManifestRef: privateRefSchema,
  toolRouteApprovalRef: privateRefSchema,
  workerApprovalRef: privateRefSchema,
  runtimeEnqueueApprovalRef: privateRefSchema,
  ownerRuntimeApprovalRef: privateRefSchema,
  nativeGpuRuntimeProofRef: privateRefSchema.optional(),
  modelWeightManifestRef: privateRefSchema.optional(),
  externalBetaPerToolRuntimeProofRef: privateRefSchema.optional(),
  traceId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export type AiGraphicsExternalBetaToolCallRequest = z.infer<
  typeof aiGraphicsExternalBetaToolCallRequestSchema
>

export type AiGraphicsExternalAgentToolCallExecutionState =
  | 'executable'
  | 'blocked_with_reason'
  | 'failed_with_diagnostics'

interface AiGraphicsExternalAgentToolCallResultInput {
  requestId: string
  toolId: string
  capabilityId: string
  routeStatus: string
  executionState: AiGraphicsExternalAgentToolCallExecutionState
  blockingReasonCode?: string | null
  failureDiagnostics?: string | null
  callable?: boolean
  executable?: boolean
  controlledAdapterInvokedNow?: boolean
  controlledAdapterExecutedNow?: boolean
  localPackageExecutionPerformed?: boolean
  localGpuModelRuntimeExecutionPerformed?: boolean
  routeExecutionPerformed?: boolean
  gpuRuntimeShouldStartNow?: boolean
  privateArtifactManifestRef?: string | null
  publicArtifactCreated?: boolean
  signedUrlCreated?: boolean
  nextExternalAgentAction?: string | null
  nextExternalAgentCommandKind?: string | null
  nextExternalAgentCommand?: string | null
  nextExternalAgentRouteRetryCommandKind?: string | null
  nextExternalAgentRouteRetryCommand?: string | null
  requiredPrivateInputKeys?: string[]
  blockedRuntimePrerequisites?: string[]
  currentBlockingPrerequisiteKey?: string | null
  currentBlockingReasonCode?: string | null
  remainingPrivateInputKeys?: string[]
  gpuRuntimeStartPolicy?: string | null
}

export function buildAiGraphicsExternalAgentToolCallResult(
  input: AiGraphicsExternalAgentToolCallResultInput,
) {
  const callable = input.callable !== false
  const executable =
    input.executable ?? input.executionState === 'executable'
  const blockedWithReason = input.executionState === 'blocked_with_reason'
  const failedWithDiagnostics =
    input.executionState === 'failed_with_diagnostics'

  return {
    contractVersion:
      '2026-07-03.ai-graphics.external-agent-tool-call-result',
    requestId: input.requestId,
    toolId: input.toolId,
    capabilityId: input.capabilityId,
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeStatus: input.routeStatus,
    callable,
    executable,
    blockedWithReason,
    failedWithDiagnostics,
    executionState: input.executionState,
    blockingReasonCode: input.blockingReasonCode ?? null,
    failureDiagnostics: input.failureDiagnostics ?? null,
    controlledAdapterInvokedNow: input.controlledAdapterInvokedNow === true,
    controlledAdapterExecutedNow: input.controlledAdapterExecutedNow === true,
    localPackageExecutionPerformed: input.localPackageExecutionPerformed === true,
    localGpuModelRuntimeExecutionPerformed:
      input.localGpuModelRuntimeExecutionPerformed === true,
    routeExecutionPerformed: input.routeExecutionPerformed === true,
    gpuRuntimeShouldStartNow: input.gpuRuntimeShouldStartNow === true,
    outputAccess: {
      privateArtifactManifestRef: input.privateArtifactManifestRef ?? null,
      publicArtifactCreated: input.publicArtifactCreated === true,
      signedUrlCreated: input.signedUrlCreated === true,
    },
    nextExternalAgentAction: input.nextExternalAgentAction ?? null,
    nextExternalAgentCommandKind:
      input.nextExternalAgentCommandKind ?? null,
    nextExternalAgentCommand: input.nextExternalAgentCommand ?? null,
    nextExternalAgentRouteRetryCommandKind:
      input.nextExternalAgentRouteRetryCommandKind ?? null,
    nextExternalAgentRouteRetryCommand:
      input.nextExternalAgentRouteRetryCommand ?? null,
    requiredPrivateInputKeys: input.requiredPrivateInputKeys ?? [],
    blockedRuntimePrerequisites: input.blockedRuntimePrerequisites ?? [],
    currentBlockingPrerequisiteKey:
      input.currentBlockingPrerequisiteKey ?? null,
    currentBlockingReasonCode: input.currentBlockingReasonCode ?? null,
    remainingPrivateInputKeys: input.remainingPrivateInputKeys ?? [],
    gpuRuntimeStartPolicy: input.gpuRuntimeStartPolicy ?? null,
  }
}

function gpuModelRequiresSourceImage(toolId: string): boolean {
  return !['torch_torchvision', 'transformers'].includes(toolId)
}

function gpuModelScopedRuntimeProofFlags(toolId: string): string[] {
  return [
    gpuModelRequiresSourceImage(toolId)
      ? '--scoped-gpu-source-image <private-approved-frame.png>'
      : '',
    toolId === 'sam2'
      ? '--scoped-gpu-sam2-checkpoint <private-sam2-checkpoint.pt>'
      : '',
    toolId === 'birefnet'
      ? '--scoped-gpu-birefnet-model <private-birefnet-model>'
      : '',
    toolId === 'real_esrgan'
      ? '--scoped-gpu-real-esrgan-model <private-real-esrgan-model.pth>'
      : '',
    toolId === 'rembg'
      ? '--scoped-gpu-rembg-model <private-rembg-model.onnx>'
      : '',
    toolId === 'transparent_background'
      ? '--scoped-gpu-transparent-background-checkpoint <private-transparent-background-checkpoint.pth>'
      : '',
  ].filter(Boolean)
}

function gpuModelSingleToolRuntimeProofFlags(toolId: string): string[] {
  return [
    gpuModelRequiresSourceImage(toolId)
      ? '--source-image <private-approved-frame.png>'
      : '',
    toolId === 'sam2'
      ? '--sam2-checkpoint <private-sam2-checkpoint.pt>'
      : '',
    toolId === 'birefnet'
      ? '--birefnet-model <private-birefnet-model>'
      : '',
    toolId === 'real_esrgan'
      ? '--real-esrgan-model <private-real-esrgan-model.pth>'
      : '',
    toolId === 'rembg'
      ? '--rembg-model <private-rembg-model.onnx>'
      : '',
    toolId === 'transparent_background'
      ? '--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>'
      : '',
  ].filter(Boolean)
}

function payloadAllowsKorniaCpuTensorRuntime(
  toolId: string,
  payload?: Record<string, unknown> | null,
): boolean {
  return toolId === 'kornia' && payload?.allowCpuTensorRuntime === true
}

function payloadAllowsFoundationCpuRuntime(
  toolId: string,
  payload?: Record<string, unknown> | null,
): boolean {
  return (
    (toolId === 'torch_torchvision' || toolId === 'transformers') &&
    payload?.allowCpuFoundationRuntime === true
  )
}

function preferredCpuTensorRuntimeForTool(toolId: string): boolean {
  return toolId === 'kornia'
}

function preferredCpuFoundationRuntimeForTool(toolId: string): boolean {
  return toolId === 'torch_torchvision' || toolId === 'transformers'
}

function exactGpuModelScopedRouteProofCommand(
  toolId: string,
  options?: {
    allowCpuTensorRuntime?: boolean
    allowCpuFoundationRuntime?: boolean
  },
): string {
  if (
    options?.allowCpuTensorRuntime === true ||
    options?.allowCpuFoundationRuntime === true
  ) {
    return [
      'npm run --silent ai-graphics:external-agent-tool-call --',
      `--tool ${toolId}`,
      '--attempt-gpu-runtime',
      '--runtime-backend host_python',
      ...(options?.allowCpuTensorRuntime === true
        ? ['--allow-cpu-tensor-runtime']
        : ['--allow-cpu-foundation-runtime']),
      `--gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/${toolId}`,
      ...gpuModelSingleToolRuntimeProofFlags(toolId),
      '--expect-state executable',
      '--require-output-hash',
      '--require-private-only-boundary',
      '--strict-exit-code',
    ].join(' ')
  }
  return [
    'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke --',
    `--scoped-gpu-tool ${toolId}`,
    `--scoped-gpu-runtime-container-image ${AI_GRAPHICS_CANONICAL_GPU_MODEL_RUNTIME_CONTAINER_IMAGE}`,
    '--scoped-gpu-runtime-container-platform linux/amd64',
    `--scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/${toolId}`,
    ...gpuModelScopedRuntimeProofFlags(toolId),
  ].join(' ')
}

function gpuModelPrivateProofSequenceFlags(toolId: string): string[] {
  return [
    gpuModelRequiresSourceImage(toolId)
      ? '--source-image <private-approved-frame.png>'
      : '',
    toolId === 'sam2'
      ? '--sam2-checkpoint <private-sam2-checkpoint.pt>'
      : '',
    toolId === 'birefnet'
      ? '--birefnet-model <private-birefnet-model>'
      : '',
    toolId === 'real_esrgan'
      ? '--real-esrgan-model <private-real-esrgan-model.pth>'
      : '',
    toolId === 'rembg'
      ? '--rembg-model <private-rembg-model.onnx>'
      : '',
    toolId === 'transparent_background'
      ? '--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>'
      : '',
  ].filter(Boolean)
}

function exactGpuModelPrivateProofSequenceCommand(
  toolId: string,
  options?: {
    allowCpuTensorRuntime?: boolean
    allowCpuFoundationRuntime?: boolean
  },
): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence --',
    '--attempt-local-runtime',
    ...(options?.allowCpuTensorRuntime === true ||
    options?.allowCpuFoundationRuntime === true
      ? [
          '--runtime-backend host_python',
          options?.allowCpuTensorRuntime === true
            ? '--allow-cpu-tensor-runtime'
            : '--allow-cpu-foundation-runtime',
        ]
      : [
          '--runtime-backend docker_container',
          `--runtime-container-image ${AI_GRAPHICS_CANONICAL_GPU_MODEL_RUNTIME_CONTAINER_IMAGE}`,
          '--runtime-container-platform linux/amd64',
        ]),
    `--tool ${toolId}`,
    `--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${toolId}>`,
    ...gpuModelPrivateProofSequenceFlags(toolId),
    '--detect-host',
    '--require-host-eligible',
    '--require-accepted-proof',
  ].join(' ')
}

function gpuModelRequiredPrivateInputKeys(
  toolId: string,
  options?: {
    allowCpuTensorRuntime?: boolean
    allowCpuFoundationRuntime?: boolean
  },
): string[] {
  return [
    'outputDirectory',
    options?.allowCpuTensorRuntime === true
      ? 'pythonCpuTensorRuntime'
      : options?.allowCpuFoundationRuntime === true
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

function gpuModelCurrentBlockingPrerequisiteKey(
  blockingReasonCode: string | null | undefined,
  options?: {
    allowCpuTensorRuntime?: boolean
    allowCpuFoundationRuntime?: boolean
  },
): string | null {
  if (!blockingReasonCode) return null
  if (blockingReasonCode.includes('output_directory_missing')) {
    return 'outputDirectory'
  }
  if (blockingReasonCode.includes('source_frame_missing')) {
    return 'sourceImageLocalPath'
  }
  if (blockingReasonCode.includes('sam2_checkpoint_missing')) {
    return 'sam2CheckpointLocalPath'
  }
  if (blockingReasonCode.includes('birefnet_model_missing')) {
    return 'birefnetModelLocalPath'
  }
  if (blockingReasonCode.includes('real_esrgan_model_missing')) {
    return 'realEsrganModelLocalPath'
  }
  if (blockingReasonCode.includes('rembg_model_missing')) {
    return 'rembgModelLocalPath'
  }
  if (blockingReasonCode.includes('transparent_background_checkpoint_missing')) {
    return 'transparentBackgroundCheckpointLocalPath'
  }
  if (
    blockingReasonCode.includes('cuda') ||
    blockingReasonCode.includes('container_gpu')
  ) {
    return 'nativeCudaRuntime'
  }
  if (blockingReasonCode.includes('container_image')) {
    return 'runtimeContainerImage'
  }
  if (blockingReasonCode.includes('python_package')) {
    return options?.allowCpuTensorRuntime === true
      ? 'pythonCpuTensorRuntime'
      : options?.allowCpuFoundationRuntime === true
      ? 'pythonCpuFoundationRuntime'
      : 'pythonPackageRuntime'
  }
  if (blockingReasonCode.includes('python_runtime')) {
    return options?.allowCpuTensorRuntime === true
      ? 'pythonCpuTensorRuntime'
      : options?.allowCpuFoundationRuntime === true
      ? 'pythonCpuFoundationRuntime'
      : 'pythonRuntime'
  }
  if (blockingReasonCode.includes('disabled_or_not_local_dev')) {
    return 'attemptGpuRuntime'
  }
  return null
}

function gpuModelBlockedRuntimePrerequisites(
  toolId: string,
  options?: {
    allowCpuTensorRuntime?: boolean
    allowCpuFoundationRuntime?: boolean
  },
): string[] {
  return [
    'private output directory under .local-artifacts/ai-graphics',
    options?.allowCpuTensorRuntime === true
      ? 'local Python CPU tensor runtime with torch, PIL, numpy, and kornia'
      : options?.allowCpuFoundationRuntime === true
      ? 'local Python CPU foundation runtime with torch and package-specific imports'
      : 'native CUDA-capable host with NVIDIA runtime proof',
    gpuModelRequiresSourceImage(toolId)
      ? 'private approved source image or frame local path'
      : '',
    aiGraphicsModelWeightManifestRequiredToolIds.has(toolId)
      ? 'reviewed private model/checkpoint path with checksum evidence'
      : '',
    'proof-local GPU worker container image or equivalent approved runtime',
    'no public artifact, signed URL, provider call, beta, or production unlock',
  ].filter(Boolean)
}

function gpuModelExternalAgentProofFields(input: {
  toolId: string
  executionPassed: boolean
  blockingReasonCode?: string | null
  payload?: Record<string, unknown> | null
}) {
  const allowCpuTensorRuntime = payloadAllowsKorniaCpuTensorRuntime(
    input.toolId,
    input.payload,
  ) || preferredCpuTensorRuntimeForTool(input.toolId)
  const allowCpuFoundationRuntime = payloadAllowsFoundationCpuRuntime(
    input.toolId,
    input.payload,
  ) || preferredCpuFoundationRuntimeForTool(input.toolId)
  const currentBlockingPrerequisiteKey = input.executionPassed
    ? null
    : gpuModelCurrentBlockingPrerequisiteKey(input.blockingReasonCode, {
        allowCpuTensorRuntime,
        allowCpuFoundationRuntime,
      })
  const requiredPrivateInputKeys = input.executionPassed
    ? []
    : gpuModelRequiredPrivateInputKeys(input.toolId, {
        allowCpuTensorRuntime,
        allowCpuFoundationRuntime,
      })
  return {
    nextExternalAgentCommandKind: input.executionPassed
      ? null
      : 'gpu_model_private_proof_sequence',
    nextExternalAgentCommand: input.executionPassed
      ? null
      : exactGpuModelPrivateProofSequenceCommand(input.toolId, {
          allowCpuTensorRuntime,
          allowCpuFoundationRuntime,
        }),
    nextExternalAgentRouteRetryCommandKind: input.executionPassed
      ? null
      : 'scoped_gpu_model_route_retry_after_private_proof',
    nextExternalAgentRouteRetryCommand: input.executionPassed
      ? null
      : exactGpuModelScopedRouteProofCommand(input.toolId, {
          allowCpuTensorRuntime,
          allowCpuFoundationRuntime,
        }),
    requiredPrivateInputKeys,
    blockedRuntimePrerequisites: input.executionPassed
      ? []
      : gpuModelBlockedRuntimePrerequisites(input.toolId, {
          allowCpuTensorRuntime,
          allowCpuFoundationRuntime,
        }),
    currentBlockingPrerequisiteKey,
    currentBlockingReasonCode: input.executionPassed
      ? null
      : input.blockingReasonCode ?? null,
    remainingPrivateInputKeys: currentBlockingPrerequisiteKey
      ? requiredPrivateInputKeys.filter((key) => key !== currentBlockingPrerequisiteKey)
      : requiredPrivateInputKeys,
    gpuRuntimeStartPolicy: input.executionPassed
      ? 'gpu_started_only_for_completed_scoped_tool_call'
      : 'on_demand_only_for_scoped_active_tool_call',
  }
}

function gpuModelNextExternalAgentAction(input: {
  toolId: string
  executionPassed: boolean
  blockingReasonCode?: string | null
  payload?: Record<string, unknown> | null
}): string {
  if (input.executionPassed) {
    return 'use the private runtime output in the approved downstream planning or worker lane'
  }

  const blockingReason = input.blockingReasonCode ?? 'gpu_model_runtime_prerequisites_missing'
  const allowCpuTensorRuntime = payloadAllowsKorniaCpuTensorRuntime(
    input.toolId,
    input.payload,
  ) || preferredCpuTensorRuntimeForTool(input.toolId)
  const allowCpuFoundationRuntime = payloadAllowsFoundationCpuRuntime(
    input.toolId,
    input.payload,
  ) || preferredCpuFoundationRuntimeForTool(input.toolId)
  const cpuProofAllowed = allowCpuTensorRuntime || allowCpuFoundationRuntime
  const privateProofSequenceCommand = exactGpuModelPrivateProofSequenceCommand(
    input.toolId,
    {
      allowCpuTensorRuntime,
      allowCpuFoundationRuntime,
    },
  )
  const scopedRouteRetryCommand = exactGpuModelScopedRouteProofCommand(
    input.toolId,
    {
      allowCpuTensorRuntime,
      allowCpuFoundationRuntime,
    },
  )
  return [
    `blocked_with_reason:${blockingReason}`,
    cpuProofAllowed
      ? 'verify the approved local Python CPU runtime first; do not start GPU for this blocked call:'
      : 'if the proof-local image is missing, build the exact local proof image first:',
    cpuProofAllowed
      ? (allowCpuTensorRuntime
        ? 'python runtime must import torch, PIL, numpy, and kornia with private local input/output paths'
        : 'python runtime must import torch and the package-specific foundation module with private local output paths')
      : AI_GRAPHICS_CANONICAL_GPU_MODEL_RUNTIME_CONTAINER_BUILD_COMMAND,
    'run the private proof sequence before retrying route execution:',
    privateProofSequenceCommand,
    'after accepted private proof exists, retry the controlled route with:',
    scopedRouteRetryCommand,
    cpuProofAllowed
      ? 'GPU remains idle for CPU proof tools unless a later scoped GPU proof is explicitly requested; missing CPU runtime or private input proof remains a block, not a pass.'
      : 'GPU starts only during that scoped active tool call; missing CUDA/model/input proof remains a block, not a pass.',
  ].join(' ')
}

function hasAcceptedPrivateRef(value?: string): boolean {
  return privateRefSchema.safeParse(value).success
}

export function buildAiGraphicsExternalBetaToolCallBlockedDetails(
  request: AiGraphicsExternalBetaToolCallRequest,
) {
  const planEvaluation = evaluateAiGraphicsToolCallPlan({
    capabilityId: request.capabilityId,
    requestedToolIds: [request.toolId],
    executionRequested: true,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    artifactBoundaryApproved: true,
  })
  const selectedTool = planEvaluation.selectedTools.find(
    (tool) => tool.toolId === request.toolId,
  )

  return {
    routeMountedByAppNow: true,
    routeMountFeatureFlagEnabled: true,
    externalAgentExecutionGateRequired: true,
    requestAcceptedForPlanningMetadata: selectedTool !== undefined,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    planEvaluationDecision: planEvaluation.decision,
    planEvaluationSourceDecision: planEvaluation.sourceDecision,
    requestedToolsAcceptedForPlanning:
      planEvaluation.requestedToolsAcceptedForPlanning,
    requestedToolsEliminated: planEvaluation.requestedToolsEliminated,
    selectedPlanningTools: planEvaluation.selectedTools.map((tool) => ({
      toolId: tool.toolId,
      productionToolId: tool.productionToolId,
      workerType: tool.workerType,
      rankingTier: tool.rankingTier,
      runtimeTarget: tool.runtimeTarget,
      gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
      canSelectForPlanning: tool.canSelectForPlanning,
      canExecuteNow: tool.canExecuteNow,
      blockersBeforeExecution: tool.blockersBeforeExecution,
      nextProofMilestone: tool.nextProofMilestone,
    })),
    missingProofBeforeExecution: planEvaluation.missingProofBeforeExecution,
    missingExecutionGates: planEvaluation.missingExecutionGates,
    properInstallAuditAcceptedToolsWithProvidedEvidence: 21,
    controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence: 21,
    controlledOnDemandWorkerPathReadyButDirectAgentExecutionBlocked: true,
    directAgentToolExecutionApprovedNow: false,
    routeExecutionApprovedNow: false,
    queueWriteApprovedNow: false,
    workerEnqueueApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      selectedTool?.gpuRequiredForRuntime === true,
    gpuRuntimeShouldStartNow: false,
    externalAgentToolCallResult: buildAiGraphicsExternalAgentToolCallResult({
      requestId: request.requestId,
      toolId: request.toolId,
      capabilityId: request.capabilityId,
      routeStatus: 'external_agent_execution_gates_missing',
      executionState: 'blocked_with_reason',
      blockingReasonCode: 'external_agent_execution_gates_missing',
      controlledAdapterInvokedNow: false,
      controlledAdapterExecutedNow: false,
      routeExecutionPerformed: false,
      gpuRuntimeShouldStartNow: false,
      privateArtifactManifestRef: request.privateArtifactManifestRef,
      nextExternalAgentAction:
        'submit through an approved controlled adapter route or provide the missing runtime proof gates',
    }),
    externalBetaReadyNow: false,
    productionReadyNow: false,
  }
}

export async function admitAiGraphicsExternalBetaToolCallToMockQueue(
  request: AiGraphicsExternalBetaToolCallRequest,
  serviceContext: ServiceContext,
) {
  if (!serviceContext.env.aiGraphicsExternalBetaToolCallRouteMockQueueAdmissionEnabled) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta tool-call route queue admission is disabled.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }
  if (!serviceContext.env.mockOnly) {
    throw new ApiError(
      'MOCK_ONLY',
      'AI graphics external-beta route queue admission smoke requires explicit mock runtime mode; live service-role queue writes remain separately gated.',
      409,
      {
        requestId: request.requestId,
        toolId: request.toolId,
        capabilityId: request.capabilityId,
        queueAdmissionSmokeRequiresMockOnly: true,
        liveQueueWriteApprovedNow: false,
        workerDispatchApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
      },
    )
  }

  const readiness = getAiGraphicsToolCallReadiness(request.toolId)
  if (!readiness?.productionToolId) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `AI graphics canonical production mapping is missing for ${request.toolId}.`,
      400,
    )
  }
  if (!readiness.capabilities.includes(request.capabilityId)) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `AI graphics capability ${request.capabilityId} is not valid for ${request.toolId}.`,
      400,
    )
  }

  const queueService = createAiGraphicsToolRuntimeQueueService(serviceContext)
  const enqueue = await queueService.enqueueToolRuntimeJobs({
    workspaceId: request.workspaceId,
    projectId: `project-ai-graphics-external-beta-${request.workspaceId}`,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    idempotencyKey: `ai-graphics-external-beta-tool-call-route:${request.requestId}:${request.toolId}`,
    batchName: 'AI graphics external beta tool-call route mock queue admission',
    createdByAgent: 'ai_graphics_external_beta_tool_call_route',
    jobs: [
      {
        toolId: request.toolId,
        productionToolId: readiness.productionToolId,
        workerType: readiness.productionWorkerType,
        runtimeTarget: readiness.runtimeTarget,
        capabilityIds: [request.capabilityId],
        privateArtifactManifestRef: request.privateArtifactManifestRef,
        idempotencyKey:
          `ai-graphics-external-beta-tool-call-route:${request.requestId}:${request.toolId}:job`,
        priority: 'normal',
        maxAttempts: 3,
        inputPayload: {
          sourceRoute: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
          traceId: request.traceId,
          toolRouteApprovalRef: request.toolRouteApprovalRef,
          workerApprovalRef: request.workerApprovalRef,
          runtimeEnqueueApprovalRef: request.runtimeEnqueueApprovalRef,
          ownerRuntimeApprovalRef: request.ownerRuntimeApprovalRef,
          payload: request.payload ?? {},
          routeQueueAdmissionSmokeOnly: true,
          routeExecutionPerformed: true,
          backendQueueSubmissionPerformed: false,
          workerEnqueuePerformed: false,
          workerDispatchPerformed: false,
          toolExecutionPerformed: false,
          gpuRuntimeShouldStartNow: false,
          publicArtifactCreated: false,
          signedUrlCreated: false,
        },
      },
    ],
  })
  const queueResult = enqueue.queueResult as {
    jobBatchId?: string
    jobIds?: string[]
    insertedJobCount?: number
    mockOnly?: boolean
    liveToolExecutionPerformed?: boolean
  }

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_mock_queue_admission_accepted',
    routeStatus:
      'external_beta_tool_call_route_mock_queue_admission_accepted_runtime_still_blocked',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
    workspaceId: request.workspaceId,
    requestId: request.requestId,
    toolId: request.toolId,
    productionToolId: readiness.productionToolId,
    capabilityId: request.capabilityId,
    workerType: readiness.productionWorkerType,
    runtimeTarget: readiness.runtimeTarget,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueAdmissionMode: 'mock_only',
    externalAgentToolCallResult: buildAiGraphicsExternalAgentToolCallResult({
      requestId: request.requestId,
      toolId: request.toolId,
      capabilityId: request.capabilityId,
      routeStatus:
        'external_beta_tool_call_route_mock_queue_admission_accepted_runtime_still_blocked',
      executionState: 'blocked_with_reason',
      blockingReasonCode: 'mock_queue_admission_runtime_still_blocked',
      controlledAdapterInvokedNow: false,
      controlledAdapterExecutedNow: false,
      routeExecutionPerformed: true,
      gpuRuntimeShouldStartNow: false,
      privateArtifactManifestRef: request.privateArtifactManifestRef,
      nextExternalAgentAction:
        'wait for a later worker execution lane before treating queue admission as runtime execution',
    }),
    queueResult: {
      jobBatchId: queueResult.jobBatchId ?? null,
      jobIds: Array.isArray(queueResult.jobIds) ? queueResult.jobIds : [],
      insertedJobCount: queueResult.insertedJobCount ?? 0,
      mockOnly: queueResult.mockOnly === true,
      liveToolExecutionPerformed: queueResult.liveToolExecutionPerformed === true,
    },
    warnings: enqueue.warnings,
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      mockQueueAdmissionAcceptedTools: 1,
      scopedControlledToolsCallableNow: 13,
      remainingGpuModelToolsBlockedForRuntime: 8,
      liveQueueWritePerformedTools: 0,
      workerDispatchPerformedTools: 0,
      toolExecutionPerformedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteMockQueueAdmissionAccepted: true,
      routeSchemaAccepted: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: true,
      mockOnlyRuntimeModeEnforced: true,
      agentCanSelectForPlanning: true,
      agentCanSubmitToolCallToQueueAdmissionNow: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      routeExecutionPerformed: true,
      backendQueueSubmissionApprovedNow: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWriteApprovedNow: false,
      liveQueueWritePerformed: false,
      workerExecutionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerEnqueuePerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

export async function executeAiGraphicsExternalBetaToolCallCpuStaticControlledAdapter(
  request: AiGraphicsExternalBetaToolCallRequest,
  serviceContext: ServiceContext,
) {
  if (!serviceContext.env.aiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionEnabled) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call CPU/static controlled execution is disabled.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }
  if (!serviceContext.env.mockOnly) {
    throw new ApiError(
      'MOCK_ONLY',
      'AI graphics external-beta canonical tool-call CPU/static controlled execution requires explicit mock runtime mode; live worker execution remains separately gated.',
      409,
      {
        requestId: request.requestId,
        toolId: request.toolId,
        capabilityId: request.capabilityId,
        cpuStaticControlledExecutionRequiresMockOnly: true,
        workerDispatchApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
      },
    )
  }
  if (!isAiGraphicsExternalAgentCpuStaticControlledAdapterTool(request.toolId)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call CPU/static execution is available only for the six proven CPU/static tools.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }

  const adapterResult = await executeAiGraphicsExternalAgentCpuStaticControlledAdapter({
    requestId: request.requestId,
    toolId: request.toolId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    toolRouteApprovalRef: request.toolRouteApprovalRef,
    workerApprovalRef: request.workerApprovalRef,
    traceId: request.traceId,
    payload: request.payload,
  })

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_cpu_static_controlled_execution_accepted',
    routeStatus:
      'external_beta_tool_call_route_cpu_static_controlled_execution_private_output_ready',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag:
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
    workspaceId: request.workspaceId,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    externalAgentExecutionState: 'executable',
    blockingReasonCode: null,
    failureDiagnostics: null,
    externalAgentCanExecuteCpuStaticControlledToolsNow: true,
    controlledCpuStaticCanonicalRouteExecutionPerformed: true,
    controlledCpuStaticToolsCallableNow: 6,
    all21ToolsCoveredByAiGraphicsLane: 21,
    remainingToolsStillBlockedForRuntime: 15,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    globalAllToolExecutionStillBlocked: true,
    externalAgentToolCallResult: buildAiGraphicsExternalAgentToolCallResult({
      requestId: request.requestId,
      toolId: request.toolId,
      capabilityId: request.capabilityId,
      routeStatus:
        'external_beta_tool_call_route_cpu_static_controlled_execution_private_output_ready',
      executionState: 'executable',
      blockingReasonCode: null,
      failureDiagnostics: null,
      controlledAdapterInvokedNow: true,
      controlledAdapterExecutedNow: true,
      localPackageExecutionPerformed: true,
      routeExecutionPerformed: true,
      gpuRuntimeShouldStartNow: false,
      privateArtifactManifestRef: adapterResult.privateArtifactManifestRef,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      nextExternalAgentAction:
        'use the returned private artifact manifest ref in the approved downstream planning or worker lane',
    }),
    adapterResult,
    outputAccess: {
      privateArtifactManifestRef: adapterResult.privateArtifactManifestRef,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    counts: {
      totalAiGraphicsTools: 21,
      requestedToolCallableTools: 1,
      requestedToolExecutableTools: 1,
      requestedToolBlockedWithReasonTools: 0,
      requestedToolFailedWithDiagnosticsTools: 0,
      controlledCpuStaticCanonicalRouteExecutedTools: 1,
      controlledCpuStaticToolsCallableNow: 6,
      remainingToolsStillBlockedForRuntime: 15,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteCpuStaticControlledExecutionAccepted: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: true,
      mockOnlyRuntimeModeEnforced: true,
      agentCanSelectForPlanning: true,
      agentCanCallRequestedToolNow: true,
      agentCanExecuteRequestedToolNow: true,
      externalAgentCanExecuteCpuStaticControlledToolsNow: true,
      controlledCpuStaticCanonicalRouteExecutionPerformed: true,
      localCpuStaticPackageExecutionPerformed: true,
      agentCanExecuteAll21ToolsNow: false,
      routeExecutionPerformed: true,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

export async function executeAiGraphicsExternalBetaToolCallBrowserRuntimeControlledAdapter(
  request: AiGraphicsExternalBetaToolCallRequest,
  serviceContext: ServiceContext,
) {
  if (!serviceContext.env.aiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionEnabled) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call browser-runtime controlled execution is disabled.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }
  if (!serviceContext.env.mockOnly) {
    throw new ApiError(
      'MOCK_ONLY',
      'AI graphics external-beta canonical tool-call browser-runtime controlled execution requires explicit mock runtime mode; live worker execution remains separately gated.',
      409,
      {
        requestId: request.requestId,
        toolId: request.toolId,
        capabilityId: request.capabilityId,
        browserRuntimeControlledExecutionRequiresMockOnly: true,
        workerDispatchApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
      },
    )
  }
  if (!isAiGraphicsExternalAgentBrowserRuntimeControlledAdapterTool(request.toolId)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call browser-runtime execution is available only for the seven proven browser/runtime tools.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }

  const adapterResult = await executeAiGraphicsExternalAgentBrowserRuntimeControlledAdapter({
    requestId: request.requestId,
    toolId: request.toolId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    toolRouteApprovalRef: request.toolRouteApprovalRef,
    workerApprovalRef: request.workerApprovalRef,
    browserRuntimeProofRef: request.runtimeEnqueueApprovalRef,
    traceId: request.traceId,
    payload: request.payload,
  })

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_browser_runtime_controlled_execution_accepted',
    routeStatus:
      'external_beta_tool_call_route_browser_runtime_controlled_execution_private_output_ready',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag:
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
    workspaceId: request.workspaceId,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    externalAgentExecutionState: 'executable',
    blockingReasonCode: null,
    failureDiagnostics: null,
    externalAgentCanExecuteBrowserRuntimeControlledToolsNow: true,
    controlledBrowserRuntimeCanonicalRouteExecutionPerformed: true,
    controlledBrowserRuntimeToolsCallableNow: 7,
    scopedControlledToolsCallableNow: 13,
    all21ToolsCoveredByAiGraphicsLane: 21,
    remainingToolsStillBlockedForRuntime: 8,
    browserRuntimeStartedByCanonicalRoute: true,
    gpuRuntimeShouldStartNow: false,
    providerRuntimeApprovedNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    globalAllToolExecutionStillBlocked: true,
    externalAgentToolCallResult: buildAiGraphicsExternalAgentToolCallResult({
      requestId: request.requestId,
      toolId: request.toolId,
      capabilityId: request.capabilityId,
      routeStatus:
        'external_beta_tool_call_route_browser_runtime_controlled_execution_private_output_ready',
      executionState: 'executable',
      blockingReasonCode: null,
      failureDiagnostics: null,
      controlledAdapterInvokedNow: true,
      controlledAdapterExecutedNow: true,
      localPackageExecutionPerformed: true,
      routeExecutionPerformed: true,
      gpuRuntimeShouldStartNow: false,
      privateArtifactManifestRef: adapterResult.privateArtifactManifestRef,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      nextExternalAgentAction:
        'use the returned private artifact manifest ref in the approved downstream planning or worker lane',
    }),
    adapterResult,
    outputAccess: {
      privateArtifactManifestRef: adapterResult.privateArtifactManifestRef,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    counts: {
      totalAiGraphicsTools: 21,
      requestedToolCallableTools: 1,
      requestedToolExecutableTools: 1,
      requestedToolBlockedWithReasonTools: 0,
      requestedToolFailedWithDiagnosticsTools: 0,
      controlledBrowserRuntimeCanonicalRouteExecutedTools: 1,
      controlledBrowserRuntimeToolsCallableNow: 7,
      scopedControlledToolsCallableNow: 13,
      remainingToolsStillBlockedForRuntime: 8,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteBrowserRuntimeControlledExecutionAccepted: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: true,
      mockOnlyRuntimeModeEnforced: true,
      agentCanSelectForPlanning: true,
      agentCanCallRequestedToolNow: true,
      agentCanExecuteRequestedToolNow: true,
      externalAgentCanExecuteBrowserRuntimeControlledToolsNow: true,
      controlledBrowserRuntimeCanonicalRouteExecutionPerformed: true,
      localBrowserRuntimePackageExecutionPerformed: true,
      browserRuntimeStartedByCanonicalRoute: true,
      agentCanExecuteAll21ToolsNow: false,
      routeExecutionPerformed: true,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

export function buildAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionBlockedDetails(
  request: AiGraphicsExternalBetaToolCallRequest,
) {
  const modelWeightManifestRequired =
    aiGraphicsModelWeightManifestRequiredToolIds.has(request.toolId)
  const nativeGpuRuntimeProofRefAccepted =
    hasAcceptedPrivateRef(request.nativeGpuRuntimeProofRef)
  const modelWeightManifestRefAccepted =
    modelWeightManifestRequired && hasAcceptedPrivateRef(request.modelWeightManifestRef)
  const externalBetaPerToolRuntimeProofRecheckAccepted =
    hasAcceptedPrivateRef(request.externalBetaPerToolRuntimeProofRef)
  const admission = evaluateAiGraphicsOnDemandRuntimeAdmission({
    capabilityId: request.capabilityId,
    requestedToolId: request.toolId,
    executionRequested: true,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    artifactBoundaryApproved: true,
    toolRouteApprovalRef: request.toolRouteApprovalRef,
    workerApprovalRef: request.workerApprovalRef,
    runtimeEnqueueApprovalRef: request.runtimeEnqueueApprovalRef,
    ownerRuntimeApprovalRef: request.ownerRuntimeApprovalRef,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    nativeGpuRuntimeProofRef: nativeGpuRuntimeProofRefAccepted
      ? request.nativeGpuRuntimeProofRef
      : undefined,
    modelWeightManifestRef: modelWeightManifestRefAccepted
      ? request.modelWeightManifestRef
      : undefined,
  })
  const gpuModelUnblockPlan = buildAiGraphicsGpuModelUnblockPlan(
    request.toolId,
    modelWeightManifestRequired,
  )
  const runtimeJobAdmissionReadyWithProvidedEvidence =
    admission.runtimeJobAdmissionReadyWithProvidedEvidence === true &&
    externalBetaPerToolRuntimeProofRecheckAccepted
  const missingRuntimeProofGates = [
    ...admission.missingRuntimeProofGates,
    ...(!externalBetaPerToolRuntimeProofRecheckAccepted
      ? ['external-beta per-tool runtime proof recheck reference is missing']
      : []),
  ]
  const gpuModelAdmissionEvidenceState =
    runtimeJobAdmissionReadyWithProvidedEvidence
      ? 'proof_refs_accepted_pending_live_worker_enqueue'
      : gpuModelUnblockPlan.status
  const nextExternalAgentAction = runtimeJobAdmissionReadyWithProvidedEvidence
    ? 'wait_for_live_worker_enqueue_authorization_or_submit_to_approved_worker_lane'
    : gpuModelUnblockPlan.nextExternalAgentAction
  const gpuModelProofFields = gpuModelExternalAgentProofFields({
    toolId: request.toolId,
    executionPassed: false,
  })
  const missingPrivateModelWeightEvidence = missingRuntimeProofGates.length === 0
    ? []
    : [
        ...(modelWeightManifestRequired && !modelWeightManifestRefAccepted
          ? [
              'reviewed private model-weight manifest reference is missing',
              'private checksum evidence is missing',
            ]
          : []),
        ...(!nativeGpuRuntimeProofRefAccepted
          ? ['native NVIDIA L4 model/runtime proof is missing']
          : []),
        ...(!externalBetaPerToolRuntimeProofRecheckAccepted
          ? ['external-beta per-tool runtime proof recheck reference is missing']
          : []),
      ]

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_gpu_model_runtime_admission_blocked',
    routeStatus:
      'gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag:
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    productionToolId: admission.selectedTool?.productionToolId ?? null,
    workerType: admission.selectedTool?.workerType ?? null,
    runtimeTarget: admission.selectedTool?.runtimeTarget ?? null,
    gpuRequiredForRuntime: admission.selectedTool?.gpuRequiredForRuntime === true,
    modelWeightManifestRequired,
    gpuModelExternalBetaReadinessBlocker: gpuModelUnblockPlan.status,
    gpuModelAdmissionEvidenceState,
    nextExternalAgentAction,
    nextExternalAgentCommandKind:
      gpuModelProofFields.nextExternalAgentCommandKind,
    nextExternalAgentCommand:
      gpuModelProofFields.nextExternalAgentCommand,
    requiredPrivateInputKeys:
      gpuModelProofFields.requiredPrivateInputKeys,
    blockedRuntimePrerequisites:
      gpuModelProofFields.blockedRuntimePrerequisites,
    gpuRuntimeStartPolicy: gpuModelProofFields.gpuRuntimeStartPolicy,
    modelWeightPrivateEvidenceRequired:
      gpuModelUnblockPlan.modelWeightPrivateEvidenceRequired,
    modelWeightPrivateEvidenceAccepted: modelWeightManifestRefAccepted,
    modelWeightManifestRefAccepted,
    nativeGpuRuntimeProofRequired:
      gpuModelUnblockPlan.nativeGpuRuntimeProofRequired,
    nativeGpuRuntimeProofAccepted: nativeGpuRuntimeProofRefAccepted,
    nativeGpuRuntimeProofRefAccepted,
    externalBetaPerToolRuntimeProofRecheckRequired:
      gpuModelUnblockPlan.externalBetaPerToolRuntimeProofRecheckRequired,
    externalBetaPerToolRuntimeProofRecheckAccepted:
      externalBetaPerToolRuntimeProofRecheckAccepted,
    externalBetaPerToolRuntimeProofRefAccepted:
      externalBetaPerToolRuntimeProofRecheckAccepted,
    runtimeJobAdmissionReadyWithProvidedEvidence,
    workerEnqueueStillBlockedByCurrentLane: true,
    admissionDecision: admission.decision,
    gpuRuntimeStartupAuthorization: admission.gpuRuntimeStartupAuthorization,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      admission.gpuRuntimeStartAllowedForAcceptedJob,
    gpuRuntimeShouldStartNow: false,
    missingRuntimeJobGates: admission.missingRuntimeJobGates,
    missingRuntimeProofGates,
    missingPrivateModelWeightEvidence,
    externalAgentToolCallResult: buildAiGraphicsExternalAgentToolCallResult({
      requestId: request.requestId,
      toolId: request.toolId,
      capabilityId: request.capabilityId,
      routeStatus:
        'gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence',
      executionState: 'blocked_with_reason',
      blockingReasonCode: gpuModelUnblockPlan.status,
      controlledAdapterInvokedNow: false,
      controlledAdapterExecutedNow: false,
      routeExecutionPerformed: true,
      gpuRuntimeShouldStartNow: false,
      privateArtifactManifestRef: request.privateArtifactManifestRef,
      nextExternalAgentAction,
      ...gpuModelProofFields,
    }),
    nextRequiredProofs: [
      'collect reviewed private checksum evidence for model-weight tools',
      'validate reviewed private model-weight manifests for tools that require weights',
      'run native linux/amd64 NVIDIA L4 runtime proof on an approved GPU host',
      'rerun external-beta per-tool runtime proof with accepted private evidence',
      'only then allow worker enqueue to start GPU on demand for an accepted job',
    ],
    gpuModelUnblockPlan,
    onDemandRuntimeAdmission: admission,
    counts: {
      totalAiGraphicsTools: 21,
      gpuModelRuntimeAdmissionBlockedTools: 8,
      gpuRuntimeShouldStartNowTools: 0,
      modelWeightManifestRequiredTools: 5,
      nativeGpuRuntimeProofRequiredTools: 8,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteGpuModelRuntimeAdmissionEvaluated: true,
      gpuModelRuntimeAdmissionFailClosed: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: admission.privateArtifactManifestAccepted,
      onDemandRuntimeAdmissionApplied: true,
      modelWeightManifestRequired,
      modelWeightManifestRefAccepted,
      nativeGpuRuntimeProofRefAccepted,
      runtimeJobAdmissionReadyWithProvidedEvidence,
      workerEnqueueStillBlockedByCurrentLane: true,
      nativeGpuRuntimeProofRequired: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      routeExecutionApprovedNow: false,
      routeExecutionPerformed: true,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimeApprovedNow: false,
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

export async function admitAiGraphicsExternalBetaToolCallGpuModelRuntime(
  request: AiGraphicsExternalBetaToolCallRequest,
  serviceContext: ServiceContext,
) {
  if (!serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionEnabled) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call GPU/model runtime admission is disabled.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }
  if (!isAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionTool(request.toolId)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call GPU/model runtime admission applies only to the eight GPU/model tools.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }

  const details =
    buildAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionBlockedDetails(request)
  if (details.runtimeJobAdmissionReadyWithProvidedEvidence === true) {
    if (!serviceContext.env.aiGraphicsExternalBetaToolCallRouteMockQueueAdmissionEnabled) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'AI graphics GPU/model tool-call runtime has accepted required private proof refs, but mock queue admission is disabled.',
        409,
        {
          ...details,
          routeStatus:
            'gpu_model_runtime_admission_ready_pending_mock_queue_admission',
          workerEnqueueStillBlockedByCurrentLane: true,
          mockQueueAdmissionRequiredBeforeExecution: true,
          gpuRuntimeShouldStartNow: false,
        },
      )
    }
    if (!serviceContext.env.mockOnly) {
      throw new ApiError(
        'MOCK_ONLY',
        'AI graphics GPU/model proof-ref queue admission requires explicit mock runtime mode; live service-role queue writes remain separately gated.',
        409,
        {
          ...details,
          routeStatus:
            'gpu_model_runtime_admission_ready_live_queue_write_still_blocked',
          liveQueueWriteApprovedNow: false,
          workerDispatchApprovedNow: false,
          toolExecutionApprovedNow: false,
          gpuRuntimeShouldStartNow: false,
        },
      )
    }

    const readiness = getAiGraphicsToolCallReadiness(request.toolId)
    if (!readiness?.productionToolId) {
      throw new ApiError(
        'VALIDATION_FAILED',
        `AI graphics canonical production mapping is missing for ${request.toolId}.`,
        400,
      )
    }
    if (!readiness.capabilities.includes(request.capabilityId)) {
      throw new ApiError(
        'VALIDATION_FAILED',
        `AI graphics capability ${request.capabilityId} is not valid for ${request.toolId}.`,
        400,
      )
    }

    const queueService = createAiGraphicsToolRuntimeQueueService(serviceContext)
    const enqueue = await queueService.enqueueToolRuntimeJobs({
      workspaceId: request.workspaceId,
      projectId: `project-ai-graphics-external-beta-${request.workspaceId}`,
      approvedPlanSnapshotId: request.approvedPlanSnapshotId,
      creditReservationId: request.creditReservationId,
      idempotencyKey:
        `ai-graphics-external-beta-gpu-model-proof-ref-route:${request.requestId}:${request.toolId}`,
      batchName:
        'AI graphics external beta GPU/model proof-ref route mock queue admission',
      createdByAgent:
        'ai_graphics_external_beta_gpu_model_proof_ref_tool_call_route',
      jobs: [
        {
          toolId: request.toolId,
          productionToolId: readiness.productionToolId,
          workerType: readiness.productionWorkerType,
          runtimeTarget: readiness.runtimeTarget,
          capabilityIds: [request.capabilityId],
          privateArtifactManifestRef: request.privateArtifactManifestRef,
          idempotencyKey:
            `ai-graphics-external-beta-gpu-model-proof-ref-route:${request.requestId}:${request.toolId}:job`,
          priority: 'high',
          maxAttempts: 1,
          inputPayload: {
            sourceRoute: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
            traceId: request.traceId,
            toolRouteApprovalRef: request.toolRouteApprovalRef,
            workerApprovalRef: request.workerApprovalRef,
            runtimeEnqueueApprovalRef: request.runtimeEnqueueApprovalRef,
            ownerRuntimeApprovalRef: request.ownerRuntimeApprovalRef,
            nativeGpuRuntimeProofRef: request.nativeGpuRuntimeProofRef,
            modelWeightManifestRef: request.modelWeightManifestRef,
            externalBetaPerToolRuntimeProofRef:
              request.externalBetaPerToolRuntimeProofRef,
            payload: request.payload ?? {},
            gpuModelProofRefMockQueueAdmissionOnly: true,
            runtimeJobAdmissionReadyWithProvidedEvidence: true,
            gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
              details.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
            gpuRuntimeOnDemandOnly: true,
            noIdleGpuRuntimeApproved: true,
            routeExecutionPerformed: true,
            backendQueueSubmissionPerformed: false,
            workerEnqueuePerformed: false,
            workerDispatchPerformed: false,
            toolExecutionPerformed: false,
            gpuRuntimeShouldStartNow: false,
            modelWeightsLoaded: false,
            publicArtifactCreated: false,
            signedUrlCreated: false,
          },
        },
      ],
    })
    const queueResult = enqueue.queueResult as {
      jobBatchId?: string
      jobIds?: string[]
      insertedJobCount?: number
      mockOnly?: boolean
      liveToolExecutionPerformed?: boolean
    }

    return {
      routeDecision:
        'ai_graphics_external_beta_tool_call_route_gpu_model_proof_ref_mock_queue_admission_accepted',
      routeStatus:
        'external_beta_tool_call_route_gpu_model_proof_ref_mock_queue_admission_accepted_runtime_still_blocked',
      routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
      routeFlag:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
      queueAdmissionFlag:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
      workspaceId: request.workspaceId,
      requestId: request.requestId,
      toolId: request.toolId,
      productionToolId: readiness.productionToolId,
      capabilityId: request.capabilityId,
      workerType: readiness.productionWorkerType,
      runtimeTarget: readiness.runtimeTarget,
      approvedPlanSnapshotId: request.approvedPlanSnapshotId,
      creditReservationId: request.creditReservationId,
      privateArtifactManifestRef: request.privateArtifactManifestRef,
      nativeGpuRuntimeProofRefAccepted: details.nativeGpuRuntimeProofRefAccepted,
      modelWeightManifestRequired: details.modelWeightManifestRequired,
      modelWeightManifestRefAccepted: details.modelWeightManifestRefAccepted,
      externalBetaPerToolRuntimeProofRecheckAccepted:
        details.externalBetaPerToolRuntimeProofRecheckAccepted,
      externalBetaPerToolRuntimeProofRefAccepted:
        details.externalBetaPerToolRuntimeProofRefAccepted,
      runtimeJobAdmissionReadyWithProvidedEvidence: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
        details.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      gpuRuntimeShouldStartNow: false,
      queueName: 'ai_graphics_external_beta_tool_runtime',
      queueAdmissionMode: 'mock_only_gpu_model_proof_ref',
      externalAgentToolCallResult: buildAiGraphicsExternalAgentToolCallResult({
        requestId: request.requestId,
        toolId: request.toolId,
        capabilityId: request.capabilityId,
        routeStatus:
          'external_beta_tool_call_route_gpu_model_proof_ref_mock_queue_admission_accepted_runtime_still_blocked',
        executionState: 'blocked_with_reason',
        blockingReasonCode:
          'gpu_model_proof_ref_queue_admission_runtime_still_blocked',
        controlledAdapterInvokedNow: false,
        controlledAdapterExecutedNow: false,
        routeExecutionPerformed: true,
        gpuRuntimeShouldStartNow: false,
        privateArtifactManifestRef: request.privateArtifactManifestRef,
        nextExternalAgentAction:
          'wait for live worker enqueue authorization before GPU runtime may start on demand',
      }),
      queueResult: {
        jobBatchId: queueResult.jobBatchId ?? null,
        jobIds: Array.isArray(queueResult.jobIds) ? queueResult.jobIds : [],
        insertedJobCount: queueResult.insertedJobCount ?? 0,
        mockOnly: queueResult.mockOnly === true,
        liveToolExecutionPerformed:
          queueResult.liveToolExecutionPerformed === true,
      },
      onDemandRuntimeAdmission: details.onDemandRuntimeAdmission,
      warnings: enqueue.warnings,
      counts: {
        totalAiGraphicsTools: 21,
        totalProductFacingCapabilities: 12,
        gpuModelProofRefMockQueueAdmissionAcceptedTools: 1,
        gpuModelRuntimeAdmissionReadyWithProvidedEvidenceTools: 1,
        scopedControlledToolsCallableNow: 13,
        remainingGpuModelToolsRequiringProofRefs: 7,
        liveQueueWritePerformedTools: 0,
        workerDispatchPerformedTools: 0,
        toolExecutionPerformedTools: 0,
        gpuRuntimeShouldStartNowTools: 0,
        modelWeightsLoadedTools: 0,
        publicArtifactCreatedTools: 0,
        signedUrlCreatedTools: 0,
      },
      booleans: {
        externalBetaToolCallRouteGpuModelProofRefMockQueueAdmissionAccepted:
          true,
        routeSchemaAccepted: true,
        approvedPlanSnapshotAccepted: true,
        creditReservationAccepted: true,
        privateArtifactManifestAccepted: hasAcceptedPrivateRef(
          request.privateArtifactManifestRef,
        ),
        nativeGpuRuntimeProofRefAccepted:
          details.nativeGpuRuntimeProofRefAccepted,
        modelWeightManifestRequired: details.modelWeightManifestRequired,
        modelWeightManifestRefAccepted: details.modelWeightManifestRefAccepted,
        externalBetaPerToolRuntimeProofRecheckAccepted:
          details.externalBetaPerToolRuntimeProofRecheckAccepted,
        externalBetaPerToolRuntimeProofRefAccepted:
          details.externalBetaPerToolRuntimeProofRefAccepted,
        runtimeJobAdmissionReadyWithProvidedEvidence: true,
        gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
          details.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
        mockOnlyRuntimeModeEnforced: true,
        gpuRuntimeOnDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        gpuStartsOnlyForApprovedWorkerOrToolCall: true,
        agentCanSelectForPlanning: true,
        agentCanSubmitGpuModelToolCallToQueueAdmissionNow: true,
        agentCanExecuteGpuModelToolsNow: false,
        agentCanExecuteAll21ToolsNow: false,
        agentCanExecuteToolsNow: false,
        routeExecutionApprovedNow: true,
        routeExecutionPerformed: true,
        backendQueueSubmissionApprovedNow: false,
        backendQueueSubmissionPerformed: false,
        liveQueueWriteApprovedNow: false,
        liveQueueWritePerformed: false,
        workerExecutionApprovedNow: false,
        workerExecutionPerformed: false,
        workerEnqueueApprovedNow: false,
        workerEnqueuePerformed: false,
        workerDispatchApprovedNow: false,
        workerDispatchPerformed: false,
        toolExecutionApprovedNow: false,
        toolExecutionPerformed: false,
        providerRuntimeApprovedNow: false,
        providerRuntimePerformed: false,
        browserWebglCanvasRuntimeApprovedNow: false,
        browserWebglCanvasRuntimePerformed: false,
        gpuRuntimeApprovedNow: false,
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
      },
    }
  }

  const message =
    'AI graphics GPU/model tool-call runtime has accepted required private proof refs, but live worker enqueue and GPU runtime execution remain blocked in this lane.'

  throw new ApiError(
    'TOOL_NOT_READY',
    message,
    409,
    details,
  )
}

function buildRepresentativeToolCallRequest(
  toolId: string,
  capabilityId: string,
): AiGraphicsExternalBetaToolCallRequest {
  return {
    workspaceId: 'workspace_ai_graphics_external_beta_all_tool_blocked_details',
    requestId: `blocked-details-${toolId}`,
    toolId: aiGraphicsToolIdSchema.parse(toolId),
    capabilityId: aiGraphicsCapabilitySchema.parse(capabilityId),
    approvedPlanSnapshotId: `approved-snapshot-${toolId}`,
    creditReservationId: `credit-reservation-${toolId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/worker-approval`,
    runtimeEnqueueApprovalRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/runtime-enqueue-approval`,
    ownerRuntimeApprovalRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/owner-runtime-approval`,
    traceId: `trace-ai-graphics-blocked-details-${toolId}`,
    payload: {
      blockedDetailsOnly: true,
      externalAgentExecutionGateRequired: true,
    },
  }
}

function getAiGraphicsExternalBetaToolCallPrimaryCapability(
  toolId: string,
  capabilities: readonly string[],
) {
  const primaryCapability =
    aiGraphicsExternalBetaToolCallPrimaryCapabilityByToolId[toolId]
  if (
    primaryCapability &&
    capabilities.includes(primaryCapability)
  ) {
    return primaryCapability
  }

  const routeCapability = capabilities.find(
    (capabilityId) => aiGraphicsCapabilitySchema.safeParse(capabilityId).success,
  )
  if (!routeCapability) {
    throw new Error(`AI graphics route capability is missing for ${toolId}`)
  }
  return routeCapability
}

export function listAiGraphicsExternalBetaToolCallBlockedReadinessCases() {
  return listAiGraphicsToolCallHandoffTools().map((tool) => {
    const routeCapability = getAiGraphicsExternalBetaToolCallPrimaryCapability(
      tool.toolId,
      tool.capabilities,
    )

    const request = buildRepresentativeToolCallRequest(tool.toolId, routeCapability)
    return {
      request,
      blockedDetails: buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    }
  })
}

function getAiGraphicsExternalBetaToolCallRouteCapability(toolId: string) {
  const readiness = getAiGraphicsToolCallReadiness(toolId)
  if (!readiness) {
    throw new Error(`AI graphics route readiness mapping is missing for ${toolId}`)
  }
  const routeCapability = getAiGraphicsExternalBetaToolCallPrimaryCapability(
    toolId,
    readiness.capabilities,
  )
  return { readiness, routeCapability }
}

function getAiGraphicsExternalBetaToolCallRouteMode(toolId: string) {
  if (isAiGraphicsExternalAgentCpuStaticControlledAdapterTool(toolId)) {
    return 'cpu_static_controlled_execution'
  }
  if (isAiGraphicsExternalAgentBrowserRuntimeControlledAdapterTool(toolId)) {
    return 'browser_runtime_controlled_execution'
  }
  if (isAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionTool(toolId)) {
    return 'gpu_model_controlled_execution'
  }
  return 'not_mapped_to_canonical_route'
}

function buildAiGraphicsExternalBetaToolCallCapabilityMismatchResult(
  request: AiGraphicsExternalBetaToolCallRequest,
) {
  const readiness = getAiGraphicsToolCallReadiness(request.toolId)
  const expectedCapabilities = readiness?.capabilities ?? []
  const failureDiagnostics =
    `AI graphics capability ${request.capabilityId} is not valid for ${request.toolId}.`

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_failed_capability_mismatch',
    routeStatus:
      'external_beta_tool_call_route_failed_with_diagnostics_capability_mismatch',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    expectedCapabilities,
    externalAgentExecutionState: 'failed_with_diagnostics',
    blockingReasonCode: null,
    failureDiagnostics,
    controlledAdapterInvokedNow: false,
    controlledAdapterExecutedNow: false,
    routeExecutionPerformed: true,
    gpuRuntimeShouldStartNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    externalAgentToolCallResult: buildAiGraphicsExternalAgentToolCallResult({
      requestId: request.requestId,
      toolId: request.toolId,
      capabilityId: request.capabilityId,
      routeStatus:
        'external_beta_tool_call_route_failed_with_diagnostics_capability_mismatch',
      executionState: 'failed_with_diagnostics',
      blockingReasonCode: null,
      failureDiagnostics,
      callable: true,
      executable: false,
      controlledAdapterInvokedNow: false,
      controlledAdapterExecutedNow: false,
      routeExecutionPerformed: true,
      gpuRuntimeShouldStartNow: false,
      privateArtifactManifestRef: request.privateArtifactManifestRef,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      nextExternalAgentAction:
        'retry with one of the expected product-facing capabilities for this tool before requesting controlled execution',
    }),
    counts: {
      totalAiGraphicsTools: 21,
      capabilityMismatchRejectedTools: 1,
      requestedToolCallableTools: 1,
      requestedToolExecutableTools: 0,
      requestedToolBlockedWithReasonTools: 0,
      requestedToolFailedWithDiagnosticsTools: 1,
      controlledAdapterInvokedTools: 0,
      controlledAdapterExecutedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
    },
    booleans: {
      routeSchemaAccepted: true,
      routeCapabilityMismatchFailedClosed: true,
      agentCanSelectForPlanning: true,
      agentCanCallRequestedToolNow: true,
      agentCanExecuteRequestedToolNow: false,
      routeExecutionPerformed: true,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function stringPayloadValue(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

function isLocalArtifactPath(value: string): boolean {
  const normalized = value.replaceAll('\\', '/')
  return normalized === '.local-artifacts' ||
    normalized.startsWith('.local-artifacts/')
}

function assertGpuModelPayloadLocalPath(
  field: string,
  value: string | undefined,
): void {
  if (!value) return
  assertNoSignedUrlOrRawUrl(value, field)
  assertNoPathTraversal(value, field)
  const resolved = path.resolve(value)
  if (resolved === path.parse(resolved).root) {
    throw new Error(`${field} must not resolve to a filesystem root.`)
  }
}

function validateAiGraphicsGpuModelControlledPayloadBoundary(
  request: AiGraphicsExternalBetaToolCallRequest,
): string | null {
  const payload = request.payload ?? {}

  for (const field of gpuModelPayloadForbiddenTrueFields) {
    if (payload[field] === true) {
      return `${field}=true is not allowed in an external-agent GPU/model tool-call payload.`
    }
  }

  const outputDirectory = stringPayloadValue(payload, 'outputDirectory')
  if (outputDirectory) {
    try {
      assertGpuModelPayloadLocalPath('outputDirectory', outputDirectory)
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
    if (!isLocalArtifactPath(outputDirectory)) {
      return 'outputDirectory must stay under .local-artifacts/ for external-agent GPU/model local proof.'
    }
  }

  for (const field of gpuModelPayloadLocalPathFields) {
    try {
      assertGpuModelPayloadLocalPath(field, stringPayloadValue(payload, field))
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  for (const field of [
    'runtimeContainerImage',
    'containerImage',
    'runtimeContainerPlatform',
    'containerPlatform',
  ]) {
    const value = stringPayloadValue(payload, field)
    if (!value) continue
    try {
      assertNoSignedUrlOrRawUrl(value, field)
      assertNoPathTraversal(value, field)
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  return null
}

function buildAiGraphicsExternalBetaToolCallUnsafeGpuPayloadResult(
  request: AiGraphicsExternalBetaToolCallRequest,
  failureDiagnostics: string,
) {
  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_failed_gpu_model_payload_boundary',
    routeStatus:
      'controlled_gpu_model_route_failed_with_diagnostics_payload_boundary',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    externalAgentExecutionState: 'failed_with_diagnostics',
    blockingReasonCode: null,
    failureDiagnostics,
    controlledAdapterInvokedNow: false,
    controlledAdapterExecutedNow: false,
    routeExecutionPerformed: true,
    gpuRuntimeShouldStartNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    externalAgentToolCallResult: buildAiGraphicsExternalAgentToolCallResult({
      requestId: request.requestId,
      toolId: request.toolId,
      capabilityId: request.capabilityId,
      routeStatus:
        'controlled_gpu_model_route_failed_with_diagnostics_payload_boundary',
      executionState: 'failed_with_diagnostics',
      blockingReasonCode: null,
      failureDiagnostics,
      callable: true,
      executable: false,
      controlledAdapterInvokedNow: false,
      controlledAdapterExecutedNow: false,
      routeExecutionPerformed: true,
      gpuRuntimeShouldStartNow: false,
      privateArtifactManifestRef: request.privateArtifactManifestRef,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      nextExternalAgentAction:
        'fix the private local GPU/model payload boundary before retrying the controlled route',
    }),
    counts: {
      totalAiGraphicsTools: 21,
      gpuModelControlledCallableTools: 1,
      gpuModelControlledExecutableNowTools: 0,
      gpuModelBlockedWithReasonTools: 0,
      gpuModelFailedWithDiagnosticsTools: 1,
      controlledAdapterInvokedTools: 0,
      controlledAdapterExecutedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
    },
    booleans: {
      routeSchemaAccepted: true,
      gpuModelPayloadBoundaryRejectedUnsafeInput: true,
      agentCanSelectForPlanning: true,
      agentCanCallRequestedToolNow: true,
      agentCanExecuteRequestedToolNow: false,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionPerformed: true,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function buildAiGraphicsGpuModelUnblockPlan(
  toolId: string,
  modelWeightManifestRequired: boolean,
) {
  const requiredEvidence = [
    ...(modelWeightManifestRequired
      ? [
          'reviewed private model-weight manifest',
          'private checksum evidence',
        ]
      : []),
    'native linux/amd64 NVIDIA L4 runtime proof result',
    'external-beta per-tool runtime proof recheck with accepted GPU evidence',
  ]
  const nextProofCommands = [
    ...(modelWeightManifestRequired
      ? AI_GRAPHICS_GPU_MODEL_PRIVATE_EVIDENCE_COMMANDS
      : []),
    ...AI_GRAPHICS_GPU_MODEL_NATIVE_PROOF_COMMANDS,
    ...AI_GRAPHICS_GPU_MODEL_PER_TOOL_RECHECK_COMMANDS,
  ]

  return {
    status: modelWeightManifestRequired
      ? 'blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof'
      : 'blocked_pending_native_gpu_runtime_proof',
    toolId,
    nextExternalAgentAction: modelWeightManifestRequired
      ? 'provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result'
      : 'provide_native_gpu_runtime_result',
    requiredEvidence,
    nextProofCommands,
    localEvidenceRoot: '.local-artifacts/ai-graphics',
    modelWeightPrivateEvidenceRequired: modelWeightManifestRequired,
    modelWeightPrivateEvidenceAccepted: false,
    nativeGpuRuntimeProofRequired: true,
    nativeGpuRuntimeProofAccepted: false,
    externalBetaPerToolRuntimeProofRecheckRequired: true,
    externalBetaPerToolRuntimeProofRecheckAccepted: false,
    gpuRuntimeStartPolicy:
      'on_demand_only_after_accepted_external_beta_worker_or_tool_call_job',
    gpuRuntimeShouldStartNow: false,
    routeAdmissionIfCalledNow:
      'fail_closed_http_409_until_required_evidence_is_accepted',
    booleans: {
      actionableUnblockPlanExposed: true,
      modelWeightPrivateEvidenceRequired: modelWeightManifestRequired,
      modelWeightPrivateEvidenceAccepted: false,
      nativeGpuRuntimeProofRequired: true,
      nativeGpuRuntimeProofAccepted: false,
      externalBetaPerToolRuntimeProofRecheckRequired: true,
      externalBetaPerToolRuntimeProofRecheckAccepted: false,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      agentCanExecuteGpuModelToolNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
    },
  }
}

export function buildAiGraphicsExternalBetaToolCallRouteReadiness(
  serviceContext: ServiceContext,
) {
  const toolReadiness = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const { readiness, routeCapability } =
      getAiGraphicsExternalBetaToolCallRouteCapability(toolId)
    const mode = getAiGraphicsExternalBetaToolCallRouteMode(toolId)
    const cpuStaticControlledExecutable =
      mode === 'cpu_static_controlled_execution' &&
      serviceContext.env.mockOnly &&
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionEnabled
    const browserRuntimeControlledExecutable =
      mode === 'browser_runtime_controlled_execution' &&
      serviceContext.env.mockOnly &&
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionEnabled
    const gpuModelRuntimeAdmissionEvaluated =
      mode === 'gpu_model_controlled_execution' &&
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionEnabled
    const gpuModelControlledCallable =
      mode === 'gpu_model_controlled_execution' &&
      serviceContext.env.mockOnly &&
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelControlledExecutionEnabled
    const routeCanExecuteNow =
      cpuStaticControlledExecutable ||
      browserRuntimeControlledExecutable
    const routeCanCallControlledAdapterNow =
      routeCanExecuteNow ||
      gpuModelControlledCallable
    const routeCanEvaluateFailClosedGpuModelAdmissionNow =
      gpuModelRuntimeAdmissionEvaluated
    const modelWeightManifestRequired =
      aiGraphicsModelWeightManifestRequiredToolIds.has(toolId)

    const disabledBlockers = []
    if (
      mode === 'cpu_static_controlled_execution' &&
      !serviceContext.env.aiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionEnabled
    ) {
      disabledBlockers.push(
        `${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG} is disabled`,
      )
    }
    if (
      mode === 'browser_runtime_controlled_execution' &&
      !serviceContext.env.aiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionEnabled
    ) {
      disabledBlockers.push(
        `${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG} is disabled`,
      )
    }
    if (
      mode === 'gpu_model_controlled_execution' &&
      !serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionEnabled
    ) {
      disabledBlockers.push(
        `${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG} is disabled`,
      )
    }
    if (
      mode === 'gpu_model_controlled_execution' &&
      !serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelControlledExecutionEnabled
    ) {
      disabledBlockers.push(
        `${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG} is disabled`,
      )
    }
    if (
      (mode === 'cpu_static_controlled_execution' ||
        mode === 'browser_runtime_controlled_execution' ||
        mode === 'gpu_model_controlled_execution') &&
      !serviceContext.env.mockOnly
    ) {
      disabledBlockers.push('mock-only runtime mode is required for controlled route execution')
    }

    const gpuModelBlockers = mode === 'gpu_model_controlled_execution'
      ? [
          'native linux/amd64 NVIDIA L4 runtime proof is required',
          ...(modelWeightManifestRequired
            ? [
                'reviewed private model-weight manifest is required',
                'private checksum evidence is required',
              ]
            : []),
          'GPU runtime may start only on demand for a future accepted worker/tool-call job',
        ]
      : []
    const gpuModelUnblockPlan =
      mode === 'gpu_model_controlled_execution'
        ? buildAiGraphicsGpuModelUnblockPlan(
            toolId,
            modelWeightManifestRequired,
          )
        : null

    const httpOutcomeIfCalledNow = routeCanExecuteNow
      ? {
          statusCode: 200,
          status: 'controlled_private_output_ready',
          routeExecutionPerformed: true,
        }
      : gpuModelControlledCallable
      ? {
          statusCode: 200,
          status: 'controlled_gpu_model_route_blocked_with_reason',
          routeExecutionPerformed: true,
        }
      : routeCanEvaluateFailClosedGpuModelAdmissionNow
        ? {
            statusCode: 409,
            status:
              'gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence',
            routeExecutionPerformed: true,
          }
        : serviceContext.env.aiGraphicsExternalBetaToolCallRouteMockQueueAdmissionEnabled
          ? {
              statusCode: 202,
              status:
                'mock_queue_admission_accepted_runtime_still_blocked',
              routeExecutionPerformed: true,
            }
          : {
              statusCode: 409,
              status: 'route_blocked_or_required_flag_disabled',
              routeExecutionPerformed: false,
            }

    return {
      toolId,
      productionToolId: readiness.productionToolId,
      displayName: readiness.displayName,
      packageName: readiness.packageName,
      capabilityId: routeCapability,
      capabilities: readiness.capabilities,
      canonicalRouteMode: mode,
      runtimeTarget: readiness.runtimeTarget,
      workerType: readiness.productionWorkerType,
      installStatus: readiness.installStatus,
      proofStatus: readiness.proofStatus,
      externalAgentCanSelectForPlanning: readiness.agentCanSelectForPlanning,
      externalAgentCanCallThisToolNow: routeCanCallControlledAdapterNow,
      externalAgentCanExecuteThisToolNow: routeCanExecuteNow,
      routeCanCallControlledAdapterNow,
      routeCanExecuteControlledAdapterNow: routeCanExecuteNow,
      routeCanEvaluateFailClosedGpuModelAdmissionNow,
      modelWeightManifestRequired,
      gpuRequiredForRuntime: readiness.gpuRequiredForRuntime,
      gpuRuntimeOnDemandOnly: readiness.gpuRequiredForRuntime,
      gpuRuntimeShouldStartNow: false,
      gpuModelUnblockPlan,
      httpOutcomeIfCalledNow,
      blockersBeforeExecution: [
        ...disabledBlockers,
        ...gpuModelBlockers,
        ...readiness.blockersBeforeExecution,
      ],
      nextProofMilestone: readiness.nextProofMilestone,
      booleans: {
        externalAgentCanSelectForPlanning: readiness.agentCanSelectForPlanning,
        externalAgentCanCallThisToolNow: routeCanCallControlledAdapterNow,
        externalAgentCanExecuteThisToolNow: routeCanExecuteNow,
        routeExecutionApprovedNow: routeCanExecuteNow,
        routeExecutionPerformedByReadinessProbe: false,
        controlledLocalMockExecutionRequired: routeCanExecuteNow,
        workerExecutionApprovedNow: false,
        workerDispatchApprovedNow: false,
        workerDispatchPerformed: false,
        toolExecutionApprovedNow: false,
        toolExecutionPerformedByReadinessProbe: false,
        providerRuntimeApprovedNow: false,
        providerRuntimePerformed: false,
        browserWebglCanvasRuntimeApprovedNow: false,
        browserWebglCanvasRuntimePerformedByReadinessProbe: false,
        gpuRuntimeApprovedNow: false,
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
        productionReadyNow: false,
      },
    }
  })

  const executableTools = toolReadiness.filter(
    (tool) => tool.externalAgentCanExecuteThisToolNow,
  )
  const callableTools = toolReadiness.filter(
    (tool) => tool.externalAgentCanCallThisToolNow,
  )
  const realRuntimeExecutableTools = toolReadiness.filter(
    (tool) => (
      tool.externalAgentCanExecuteThisToolNow &&
      !tool.gpuRequiredForRuntime
    ),
  )
  const gpuAdmissionTools = toolReadiness.filter(
    (tool) => tool.canonicalRouteMode === 'gpu_model_controlled_execution',
  )

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_readiness_probe_passed',
    routeStatus:
      executableTools.length === 21
        ? 'canonical_tool_call_route_readiness_reports_all_twenty_one_route_callable_and_eight_gpu_model_runtime_proof_required'
        : 'canonical_tool_call_route_readiness_reports_thirteen_runtime_executable_and_eight_gpu_model_runtime_proof_required',
    schemaVersion:
      '2026-07-02.ai-graphics.external-beta-tool-call-route-readiness-probe',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    readinessRoutePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_READINESS_ROUTE_PATH,
    routeFlags: {
      mockQueueAdmission:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
      cpuStaticControlledExecution:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
      browserRuntimeControlledExecution:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
      gpuModelRuntimeAdmission:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
      gpuModelControlledExecution:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG,
    },
    routeFlagState: {
      routeMounted: serviceContext.env.aiGraphicsExternalBetaToolCallRouteMountEnabled,
      mockOnlyRuntimeMode: serviceContext.env.mockOnly,
      mockQueueAdmission:
        serviceContext.env.aiGraphicsExternalBetaToolCallRouteMockQueueAdmissionEnabled,
      cpuStaticControlledExecution:
        serviceContext.env.aiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionEnabled,
      browserRuntimeControlledExecution:
        serviceContext.env.aiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionEnabled,
      gpuModelRuntimeAdmission:
        serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionEnabled,
      gpuModelControlledExecution:
        serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelControlledExecutionEnabled,
    },
    toolReadiness,
    counts: {
      totalAiGraphicsTools: toolReadiness.length,
      productFacingCapabilities: 12,
      externalAgentRouteCallableNowTools: callableTools.length,
      externalAgentRouteExecutableNowTools: executableTools.length,
      realRuntimeExecutableNowTools: realRuntimeExecutableTools.length,
      cpuStaticControlledExecutableNowTools:
        toolReadiness.filter((tool) => (
          tool.canonicalRouteMode === 'cpu_static_controlled_execution' &&
          tool.externalAgentCanExecuteThisToolNow
        )).length,
      browserRuntimeControlledExecutableNowTools:
        toolReadiness.filter((tool) => (
          tool.canonicalRouteMode === 'browser_runtime_controlled_execution' &&
          tool.externalAgentCanExecuteThisToolNow
        )).length,
      gpuModelRuntimeAdmissionBlockedTools:
        gpuAdmissionTools.filter((tool) => !tool.externalAgentCanExecuteThisToolNow).length,
      gpuModelRuntimeAdmissionEvaluatedFailClosedTools:
        gpuAdmissionTools.filter(
          (tool) => tool.routeCanEvaluateFailClosedGpuModelAdmissionNow,
        ).length,
      gpuModelRuntimeUnblockPlanExposedTools:
        gpuAdmissionTools.filter((tool) => tool.gpuModelUnblockPlan).length,
      gpuModelNativeGpuProofRequiredTools:
        gpuAdmissionTools.filter(
          (tool) => tool.gpuModelUnblockPlan?.nativeGpuRuntimeProofRequired,
        ).length,
      gpuModelPrivateEvidenceAndNativeGpuProofRequiredTools:
        gpuAdmissionTools.filter(
          (tool) => tool.gpuModelUnblockPlan?.modelWeightPrivateEvidenceRequired,
        ).length,
      gpuModelNativeGpuProofOnlyRequiredTools:
        gpuAdmissionTools.filter(
          (tool) => (
            tool.gpuModelUnblockPlan?.nativeGpuRuntimeProofRequired &&
            !tool.gpuModelUnblockPlan?.modelWeightPrivateEvidenceRequired
          ),
        ).length,
      gpuModelRuntimeProofRequiredTools: gpuAdmissionTools.length,
      gpuModelToolsReadyForExecutionAfterCurrentEvidence:
        gpuAdmissionTools.filter((tool) => (
          tool.gpuModelUnblockPlan?.nativeGpuRuntimeProofAccepted &&
          (
            !tool.gpuModelUnblockPlan.modelWeightPrivateEvidenceRequired ||
            tool.gpuModelUnblockPlan.modelWeightPrivateEvidenceAccepted
          )
        )).length,
      modelWeightManifestRequiredTools:
        toolReadiness.filter((tool) => tool.modelWeightManifestRequired).length,
      gpuRuntimeShouldStartNowTools:
        toolReadiness.filter((tool) => tool.gpuRuntimeShouldStartNow).length,
      workerDispatchApprovedNowTools: 0,
      workerDispatchPerformedTools: 0,
      providerRuntimePerformedTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteReadinessProbeSafe: true,
      routeMountedByAppNow:
        serviceContext.env.aiGraphicsExternalBetaToolCallRouteMountEnabled,
      mockOnlyRuntimeModeEnforced: serviceContext.env.mockOnly,
      agentCanSelectForPlanning: true,
      agentCanCallAll21ControlledRoutesNow: callableTools.length === 21,
      externalAgentCanExecuteSomeToolsNow: executableTools.length > 0,
      agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow:
        executableTools.filter((tool) => !tool.gpuRequiredForRuntime).length === 13,
      agentCanExecuteRealRuntimeFor13ToolsNow:
        realRuntimeExecutableTools.length === 13,
      gpuModelUnblockPlanExposed:
        gpuAdmissionTools.filter((tool) => tool.gpuModelUnblockPlan).length === 8,
      allEightGpuModelToolsHaveActionableUnblockPlan:
        gpuAdmissionTools.every((tool) => tool.gpuModelUnblockPlan !== null),
      fiveModelWeightToolsRequirePrivateEvidenceBeforeGpuProof:
        gpuAdmissionTools.filter(
          (tool) => tool.gpuModelUnblockPlan?.modelWeightPrivateEvidenceRequired,
        ).length === 5,
      threeFoundationGpuToolsRequireNativeGpuProofOnly:
        gpuAdmissionTools.filter(
          (tool) => (
            tool.gpuModelUnblockPlan?.nativeGpuRuntimeProofRequired &&
            !tool.gpuModelUnblockPlan?.modelWeightPrivateEvidenceRequired
          ),
        ).length === 3,
      gpuModelToolsReadyForExecutionAfterCurrentEvidence:
        gpuAdmissionTools.every((tool) => (
          tool.gpuModelUnblockPlan?.nativeGpuRuntimeProofAccepted &&
          (
            !tool.gpuModelUnblockPlan.modelWeightPrivateEvidenceRequired ||
            tool.gpuModelUnblockPlan.modelWeightPrivateEvidenceAccepted
          )
        )),
      gpuModelRuntimeProofAcceptedNow: false,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteGpuModelToolsNow: false,
      routeExecutionPerformedByReadinessProbe: false,
      workerExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformedByReadinessProbe: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      browserWebglCanvasRuntimePerformedByReadinessProbe: false,
      gpuRuntimeApprovedNow: false,
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

interface AiGraphicsToolCallRoutePaths {
  toolCallPath: string
  readinessPath: string
}

const aiGraphicsExternalBetaToolCallRoutePaths: AiGraphicsToolCallRoutePaths = {
  toolCallPath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  readinessPath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_READINESS_ROUTE_PATH,
}

const aiGraphicsExternalAgentToolCallRoutePaths: AiGraphicsToolCallRoutePaths = {
  toolCallPath: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
  readinessPath: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_READINESS_ROUTE_PATH,
}

function rewriteAiGraphicsToolCallRoutePaths(
  value: unknown,
  paths: AiGraphicsToolCallRoutePaths,
): unknown {
  if (paths.toolCallPath === AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteAiGraphicsToolCallRoutePaths(item, paths))
  }
  if (!value || typeof value !== 'object') {
    return value
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      if (
        (key === 'routePath' || key === 'sourceRoute') &&
        item === AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH
      ) {
        return [key, paths.toolCallPath]
      }
      if (
        key === 'readinessRoutePath' &&
        item === AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_READINESS_ROUTE_PATH
      ) {
        return [key, paths.readinessPath]
      }
      return [key, rewriteAiGraphicsToolCallRoutePaths(item, paths)]
    }),
  )
}

export function createAiGraphicsExternalBetaToolCallRoutes(
  paths: AiGraphicsToolCallRoutePaths = aiGraphicsExternalBetaToolCallRoutePaths,
): Router {
  const router = Router()

  const sendRouteOk = (
    response: Parameters<typeof sendOk>[0],
    data: unknown,
    warnings: string[] = [],
    status = 200,
  ) => {
    sendOk(
      response,
      rewriteAiGraphicsToolCallRoutePaths(data, paths),
      warnings,
      status,
    )
  }

  router.get(paths.readinessPath, asyncRoute(async (request, response) => {
    const serviceContext = getServiceContext(request)
    sendRouteOk(
      response,
      buildAiGraphicsExternalBetaToolCallRouteReadiness(serviceContext),
      [],
      200,
    )
  }))

  router.post(paths.toolCallPath, asyncRoute(async (request, response) => {
    const body = validateBody(aiGraphicsExternalBetaToolCallRequestSchema, request.body)
    const serviceContext = getServiceContext(request)
    const readiness = getAiGraphicsToolCallReadiness(body.toolId)
    if (!readiness?.capabilities.includes(body.capabilityId)) {
      const mismatch =
        buildAiGraphicsExternalBetaToolCallCapabilityMismatchResult(body)
      sendRouteOk(response, mismatch, [mismatch.failureDiagnostics], 200)
      return
    }
    if (
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelControlledExecutionEnabled &&
      isAiGraphicsExternalAgentGpuModelControlledAdapterTool(body.toolId)
    ) {
      if (!serviceContext.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'AI graphics GPU/model controlled execution requires explicit mock/local runtime mode; live backend worker dispatch remains separately gated.',
          409,
          {
            requestId: body.requestId,
            toolId: body.toolId,
            capabilityId: body.capabilityId,
            gpuRuntimeOnDemandOnly: true,
            gpuRuntimeShouldStartNow: false,
            workerExecutionApprovedNow: false,
            providerRuntimeApprovedNow: false,
            publicArtifactCreated: false,
            signedUrlCreated: false,
          },
        )
      }
      const gpuModelPayloadBoundaryFailure =
        validateAiGraphicsGpuModelControlledPayloadBoundary(body)
      if (gpuModelPayloadBoundaryFailure) {
        const failureResult =
          buildAiGraphicsExternalBetaToolCallUnsafeGpuPayloadResult(
            body,
            gpuModelPayloadBoundaryFailure,
          )
        sendRouteOk(response, failureResult, [gpuModelPayloadBoundaryFailure], 200)
        return
      }
      const execution =
        await executeAiGraphicsExternalAgentGpuModelControlledAdapter({
          ...body,
          payload: body.payload ?? {},
        })
      const gpuModelExecutionState = execution.executionState
      const gpuModelExecutionPassed = gpuModelExecutionState === 'executable'
      const gpuModelBlockedWithReason =
        gpuModelExecutionState === 'blocked_with_reason'
      const gpuModelFailedWithDiagnostics =
        gpuModelExecutionState === 'failed_with_diagnostics'
      const gpuModelProofFields = gpuModelExternalAgentProofFields({
        toolId: body.toolId,
        executionPassed: gpuModelExecutionPassed,
        blockingReasonCode: execution.blockingReasonCode,
        payload: body.payload ?? {},
      })
      sendRouteOk(response, {
        routeDecision:
          'ai_graphics_external_beta_tool_call_route_gpu_model_controlled_execution_accepted',
        routeStatus: gpuModelExecutionPassed
          ? 'controlled_gpu_model_route_executed_private_output_ready'
          : gpuModelFailedWithDiagnostics
          ? 'controlled_gpu_model_route_failed_with_diagnostics'
          : 'controlled_gpu_model_route_blocked_with_reason',
        externalAgentExecutionState: gpuModelExecutionState,
        blockingReasonCode: execution.blockingReasonCode,
        failureDiagnostics: execution.failureDiagnostics,
        externalAgentToolCallResult: buildAiGraphicsExternalAgentToolCallResult({
          requestId: body.requestId,
          toolId: body.toolId,
          capabilityId: body.capabilityId,
          routeStatus: gpuModelExecutionPassed
            ? 'controlled_gpu_model_route_executed_private_output_ready'
            : gpuModelFailedWithDiagnostics
            ? 'controlled_gpu_model_route_failed_with_diagnostics'
            : 'controlled_gpu_model_route_blocked_with_reason',
          executionState: gpuModelExecutionState,
          blockingReasonCode: execution.blockingReasonCode,
          failureDiagnostics: execution.failureDiagnostics,
          controlledAdapterInvokedNow: execution.controlledAdapterInvokedNow,
          controlledAdapterExecutedNow: execution.controlledAdapterExecutedNow,
          localGpuModelRuntimeExecutionPerformed:
            execution.localGpuModelRuntimeExecutionPerformed,
          routeExecutionPerformed: true,
          gpuRuntimeShouldStartNow: execution.gpuRuntimeShouldStartNow,
          privateArtifactManifestRef: execution.privateArtifactManifestRef,
          publicArtifactCreated: execution.publicArtifactCreated,
          signedUrlCreated: execution.signedUrlCreated,
          nextExternalAgentAction: gpuModelNextExternalAgentAction({
            toolId: body.toolId,
            executionPassed: gpuModelExecutionPassed,
            blockingReasonCode: execution.blockingReasonCode,
            payload: body.payload ?? {},
          }),
          ...gpuModelProofFields,
        }),
        routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
        routeFlag:
          AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG,
        requestId: body.requestId,
        toolId: body.toolId,
        capabilityId: body.capabilityId,
        controlledAdapterResult: execution,
        counts: {
          totalAiGraphicsTools: 21,
          gpuModelControlledCallableTools: 1,
          gpuModelControlledExecutableNowTools:
            gpuModelExecutionPassed ? 1 : 0,
          gpuModelBlockedWithReasonTools:
            gpuModelBlockedWithReason ? 1 : 0,
          gpuModelFailedWithDiagnosticsTools:
            gpuModelFailedWithDiagnostics ? 1 : 0,
          gpuRuntimeShouldStartNowTools: execution.gpuRuntimeShouldStartNow ? 1 : 0,
          localGpuModelRuntimeExecutionPerformedTools:
            execution.localGpuModelRuntimeExecutionPerformed ? 1 : 0,
          publicArtifactCreatedTools: 0,
          signedUrlCreatedTools: 0,
        },
        booleans: {
          routeSchemaAccepted: true,
          approvedPlanSnapshotAccepted: true,
          creditReservationAccepted: true,
          privateArtifactManifestAccepted: true,
          gpuRuntimeOnDemandOnly: true,
          noIdleGpuRuntimeApproved: true,
          gpuStartsOnlyForApprovedWorkerOrToolCall: true,
          agentCanSelectForPlanning: true,
          agentCanCallRequestedToolNow: true,
          agentCanExecuteRequestedToolNow: gpuModelExecutionPassed,
          agentCanExecuteGpuModelToolsNow: gpuModelExecutionPassed,
          agentCanExecuteAll21ToolsNow: false,
          agentCanExecuteToolsNow: gpuModelExecutionPassed,
          routeExecutionApprovedNow: true,
          routeExecutionPerformed: true,
          workerExecutionApprovedNow: false,
          workerExecutionPerformed: false,
          toolExecutionApprovedNow: gpuModelExecutionPassed,
          toolExecutionPerformed:
            execution.localGpuModelRuntimeExecutionPerformed,
          providerRuntimeApprovedNow: false,
          providerRuntimePerformed: false,
          browserWebglCanvasRuntimeApprovedNow: false,
          browserWebglCanvasRuntimePerformed: false,
          gpuRuntimeApprovedForScopedControlledToolCall:
            execution.gpuRuntimeApprovedForScopedControlledToolCall,
          gpuRuntimePerformed: execution.gpuRuntimeShouldStartNow,
          gpuRuntimeShouldStartNow: execution.gpuRuntimeShouldStartNow,
          publicArtifactCreated: false,
          signedUrlCreated: false,
          runtimeReadyNow: false,
          internalBetaReadyNow: false,
          externalBetaReadyNow: false,
          productionReadyNow: false,
        },
      }, execution.warnings, 200)
      return
    }
    if (
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionEnabled &&
      isAiGraphicsExternalAgentCpuStaticControlledAdapterTool(body.toolId)
    ) {
      const execution =
        await executeAiGraphicsExternalBetaToolCallCpuStaticControlledAdapter(
          body,
          serviceContext,
        )
      sendRouteOk(response, execution, [], 200)
      return
    }
    if (
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionEnabled &&
      isAiGraphicsExternalAgentBrowserRuntimeControlledAdapterTool(body.toolId)
    ) {
      const execution =
        await executeAiGraphicsExternalBetaToolCallBrowserRuntimeControlledAdapter(
          body,
          serviceContext,
        )
      sendRouteOk(response, execution, [], 200)
      return
    }
    if (
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionEnabled &&
      isAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionTool(body.toolId)
    ) {
      const admission = await admitAiGraphicsExternalBetaToolCallGpuModelRuntime(
        body,
        serviceContext,
      )
      sendRouteOk(response, admission, admission.warnings, 202)
      return
    }
    if (serviceContext.env.aiGraphicsExternalBetaToolCallRouteMockQueueAdmissionEnabled) {
      const admission = await admitAiGraphicsExternalBetaToolCallToMockQueue(
        body,
        serviceContext,
      )
      sendRouteOk(response, admission, admission.warnings, 202)
      return
    }
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta tool-call route is source-controlled but not approved for runtime execution.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(body),
    )
  }))

  return router
}

export function createAiGraphicsExternalAgentToolCallRoutes(): Router {
  return createAiGraphicsExternalBetaToolCallRoutes(
    aiGraphicsExternalAgentToolCallRoutePaths,
  )
}
