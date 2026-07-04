import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { closeSync, existsSync, openSync, readSync, statSync } from 'node:fs'
import path from 'node:path'
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

export type AiGraphicsExternalAgentGpuModelExecutionState =
  | 'executable'
  | 'blocked_with_reason'
  | 'failed_with_diagnostics'

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
  executionState: AiGraphicsExternalAgentGpuModelExecutionState
  blockingReasonCode: string | null
  failureDiagnostics: string | null
  controlledAdapterExecutableNow: boolean
  controlledAdapterExecutedNow: boolean
  controlledAdapterInvokedNow: boolean
  localGpuModelRuntimeExecutionPerformed: boolean
  externalAgentCanExecuteViaMountedRouteNow: boolean
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

function isLocalArtifactPath(filePath: string): boolean {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(filePath)) return false
  if (filePath.includes('\0')) return false
  const localArtifactsRoot = path.resolve('.local-artifacts')
  const resolvedPath = path.resolve(filePath)
  return resolvedPath === localArtifactsRoot ||
    resolvedPath.startsWith(`${localArtifactsRoot}${path.sep}`)
}

function runtimeExecutionBackend(
  payload: Record<string, unknown>,
): 'host_python' | 'docker_container' {
  return optionalString(payload, 'runtimeExecutionBackend') === 'docker_container' ||
    optionalString(payload, 'runtimeBackend') === 'docker_container'
    ? 'docker_container'
    : 'host_python'
}

function runtimeContainerGpu(payload: Record<string, unknown>): boolean {
  return payload.runtimeContainerGpu !== false
}

function allowKorniaCpuTensorRuntime(
  toolId: AiGraphicsCanonicalToolId | string,
  payload: Record<string, unknown>,
): boolean {
  return toolId === 'kornia' && optionalBoolean(payload, 'allowCpuTensorRuntime')
}

function allowFoundationCpuRuntime(
  toolId: AiGraphicsCanonicalToolId | string,
  payload: Record<string, unknown>,
): boolean {
  return (
    (toolId === 'torch_torchvision' || toolId === 'transformers') &&
    optionalBoolean(payload, 'allowCpuFoundationRuntime')
  )
}

function privateInputPreflightOnly(payload: Record<string, unknown>): boolean {
  return optionalBoolean(payload, 'privateInputPreflightOnly') ||
    optionalBoolean(payload, 'localRuntimeInputPreflightOnly')
}

function runtimeContainerImage(payload: Record<string, unknown>): string | undefined {
  return optionalString(payload, 'runtimeContainerImage') ??
    optionalString(payload, 'containerImage')
}

function runtimeContainerPlatform(payload: Record<string, unknown>): string | undefined {
  return optionalString(payload, 'runtimeContainerPlatform') ??
    optionalString(payload, 'containerPlatform')
}

const runtimePythonModulesByTool: Record<
  AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  string[]
> = {
  torch_torchvision: ['torch', 'torchvision'],
  transformers: ['torch', 'transformers'],
  sam2: ['torch', 'torchvision', 'numpy', 'PIL', 'sam2'],
  birefnet: [
    'torch',
    'torchvision',
    'transformers',
    'PIL',
    'timm',
    'kornia',
    'einops',
    'scipy',
    'skimage',
  ],
  real_esrgan: ['torch', 'torchvision', 'PIL', 'cv2', 'basicsr', 'realesrgan'],
  kornia: ['torch', 'PIL', 'numpy', 'kornia'],
  rembg: ['numpy', 'PIL', 'onnxruntime', 'rembg'],
  transparent_background: ['torch', 'PIL', 'numpy', 'transparent_background'],
}

const minimumPrivateModelFileBytes = 1024 * 1024
const maximumSafetensorsHeaderBytes = 1024 * 1024
const modelWeightEvidenceRequiredTools =
  new Set<AiGraphicsExternalAgentGpuModelControlledAdapterToolId>([
    'sam2',
    'birefnet',
    'real_esrgan',
    'rembg',
    'transparent_background',
  ])
const modelWeightChecksumPattern = /^[a-f0-9]{64}$/i

function hasScopedLocalRuntimeInputs(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  payload: Record<string, unknown>,
): boolean {
  const outputDirectory = optionalString(payload, 'outputDirectory')
  const sourceFrame =
    optionalString(payload, 'sourceImageLocalPath') ??
    optionalString(payload, 'representativeFrameLocalPath')
  if (!outputDirectory) return false

  if (toolId === 'torch_torchvision' || toolId === 'transformers') return true
  if (toolId === 'sam2') {
    return Boolean(sourceFrame && optionalString(payload, 'sam2CheckpointLocalPath'))
  }
  if (toolId === 'birefnet') {
    return Boolean(sourceFrame && optionalString(payload, 'birefnetModelLocalPath'))
  }
  if (toolId === 'real_esrgan') {
    return Boolean(sourceFrame && optionalString(payload, 'realEsrganModelLocalPath'))
  }
  if (toolId === 'kornia') return Boolean(sourceFrame)
  if (toolId === 'rembg') {
    return Boolean(sourceFrame && optionalString(payload, 'rembgModelLocalPath'))
  }
  return Boolean(
    sourceFrame &&
      optionalString(payload, 'transparentBackgroundCheckpointLocalPath'),
  )
}

function runtimePreflightPython(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  payload: Record<string, unknown>,
): Record<string, unknown> | null {
  const modules = runtimePythonModulesByTool[toolId]
  const pythonBin = process.env.AI_GRAPHICS_PYTHON_BIN ?? process.env.PYTHON_BIN ?? 'python3'
  const code = `
import importlib.util
import json
import sys

tool_id = sys.argv[1]
allow_cpu_tensor_runtime = sys.argv[2] == "true"
allow_cpu_foundation_runtime = sys.argv[3] == "true"
modules = sys.argv[4:]
missing = [module for module in modules if importlib.util.find_spec(module) is None]
cuda_available = False
cuda_provider_available = False
if not missing:
    if tool_id == "rembg":
        import onnxruntime as ort
        cuda_provider_available = "CUDAExecutionProvider" in ort.get_available_providers()
        cuda_available = cuda_provider_available
    else:
        import torch
        cuda_available = bool(torch.cuda.is_available())
print(json.dumps({
    "missingModules": missing,
    "cudaAvailable": cuda_available,
    "cudaProviderAvailable": cuda_provider_available,
    "allowCpuTensorRuntime": allow_cpu_tensor_runtime,
    "allowCpuFoundationRuntime": allow_cpu_foundation_runtime,
}))
`
  try {
    return JSON.parse(execFileSync(pythonBin, [
      '-c',
      code,
      toolId,
      allowKorniaCpuTensorRuntime(toolId, payload) ? 'true' : 'false',
      allowFoundationCpuRuntime(toolId, payload) ? 'true' : 'false',
      ...modules,
    ], {
      encoding: 'utf8',
      env: {
        ...process.env,
        HF_DATASETS_OFFLINE: '1',
        HF_HUB_OFFLINE: '1',
        MODEL_DOWNLOADS_ENABLED: 'false',
        PROVIDER_EXECUTION_ENABLED: 'false',
        REAL_MEDIA_INPUT_ENABLED: 'false',
        TRANSFORMERS_OFFLINE: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
    })) as Record<string, unknown>
  } catch (error) {
    return {
      preflightError: error instanceof Error ? error.message : String(error),
    }
  }
}

function runtimePrerequisiteBlock(
  request: AiGraphicsExternalAgentGpuModelControlledAdapterRequest,
  payload: Record<string, unknown>,
): Record<string, unknown> | null {
  if (optionalString(payload, 'mode') !== 'local_dev') return null
  if (!executionEnabled(payload)) return null
  if (!isAiGraphicsExternalAgentGpuModelControlledAdapterTool(request.toolId)) {
    return null
  }
  const outputDirectory = optionalString(payload, 'outputDirectory')
  if (outputDirectory && !isLocalArtifactPath(outputDirectory)) {
    return skippedPrerequisiteBlock({
      toolId: request.toolId,
      code: 'gpu_model_output_directory_outside_local_artifacts',
      message:
        'GPU/model local-dev proof outputDirectory must stay under .local-artifacts/; public, signed URL, or arbitrary output locations are not approved.',
      summary:
        'GPU/model local-dev execution prerequisite blocked before runtime/GPU startup because the private proof output directory was outside .local-artifacts/.',
      warning:
        'GPU/model runtime did not start because outputDirectory was outside the approved local-only artifact root.',
      errorMessage:
        'outputDirectory must be a local-only .local-artifacts/ path for controlled GPU/model proof execution.',
    })
  }
  if (!hasScopedLocalRuntimeInputs(request.toolId, payload)) return null
  const korniaCpuTensorRuntime = allowKorniaCpuTensorRuntime(request.toolId, payload)
  const foundationCpuRuntime = allowFoundationCpuRuntime(request.toolId, payload)

  if (runtimeExecutionBackend(payload) === 'docker_container') {
    const image = runtimeContainerImage(payload)
    if (!image) {
      return {
        executionInputMode: 'local_dev',
        result: {
          status: 'skipped',
          tool: request.toolId,
          commandPlan: {
            tool: request.toolId,
            command: 'docker',
            args: ['run', '--rm', '--gpus', 'all', '<runtime-image>', 'python3', '<runtime-script>'],
            executes: false,
            summary:
              'GPU/model Docker runtime prerequisite blocked execution because no container image was provided.',
          },
          skipReason: {
            code: 'gpu_model_runtime_container_image_missing',
            message:
              'runtimeExecutionBackend=docker_container requires runtimeContainerImage.',
            tool: request.toolId,
          },
          warningCount: 1,
          errorMessage: undefined,
        },
        localRuntimeExecutionPerformed: false,
        warnings: [
          'GPU/model Docker runtime did not start because runtimeContainerImage was not provided.',
        ],
      }
    }
    if (!korniaCpuTensorRuntime && !foundationCpuRuntime && !runtimeContainerGpu(payload)) {
      return {
        executionInputMode: 'local_dev',
        result: {
          status: 'skipped',
          tool: request.toolId,
          commandPlan: {
            tool: request.toolId,
            command: 'docker',
            args: ['run', '--rm', '--gpus', 'all', image, 'python3', '<runtime-script>'],
            executes: false,
            summary:
              'GPU/model Docker runtime prerequisite blocked execution because GPU attachment was disabled.',
          },
          skipReason: {
            code: 'gpu_model_runtime_container_gpu_not_requested',
            message:
              'runtimeContainerGpu=false is not accepted for GPU/model local-dev runtime execution.',
            tool: request.toolId,
          },
          warningCount: 1,
          errorMessage: undefined,
        },
        localRuntimeExecutionPerformed: false,
        warnings: [
          'GPU/model Docker runtime did not start because the scoped tool call did not request GPU attachment.',
        ],
      }
    }
    const privateInputBlock = privateLocalRuntimeInputBlock(request.toolId, payload)
    if (privateInputBlock) return privateInputBlock
    if (privateInputPreflightOnly(payload)) {
      return skippedPrerequisiteBlock({
        toolId: request.toolId,
        code: 'gpu_model_private_inputs_accepted_runtime_proof_not_requested',
        message:
          'Private local source/model/output inputs passed path-shape preflight; native CUDA/model runtime proof was intentionally not requested for this validation pass.',
        summary:
          'GPU/model local-dev preflight accepted private local inputs and stopped before Docker/GPU/runtime startup.',
        warning:
          'GPU/model runtime did not start because this validation only proved private input path plumbing.',
      })
    }
    const privateModelContentBlock = privateModelRuntimeContentBlock(
      request.toolId,
      payload,
    )
    if (privateModelContentBlock) return privateModelContentBlock
    const modelWeightEvidenceBlock = privateModelWeightEvidenceBlock(
      request.toolId,
      payload,
    )
    if (modelWeightEvidenceBlock) return modelWeightEvidenceBlock
    try {
      execFileSync('docker', ['image', 'inspect', image], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30_000,
      })
    } catch (error) {
      return {
        executionInputMode: 'local_dev',
        result: {
          status: 'skipped',
          tool: request.toolId,
          commandPlan: {
            tool: request.toolId,
            command: 'docker',
            args: ['image', 'inspect', image],
            executes: false,
            summary:
              'GPU/model Docker runtime prerequisite blocked execution because the runtime image was unavailable.',
          },
          skipReason: {
            code: 'gpu_model_runtime_container_image_unavailable',
            message:
              error instanceof Error ? error.message : String(error),
            tool: request.toolId,
          },
          warningCount: 1,
          errorMessage: undefined,
        },
        localRuntimeExecutionPerformed: false,
        warnings: [
          'GPU/model Docker runtime did not start because the requested runtime container image is unavailable.',
        ],
      }
    }
    try {
      const platform = runtimeContainerPlatform(payload)
      execFileSync(
        'docker',
        [
          'run',
          '--rm',
          ...(platform ? ['--platform', platform] : []),
          ...(!korniaCpuTensorRuntime && !foundationCpuRuntime ? ['--gpus', 'all'] : []),
          '--entrypoint',
          'true',
          image,
        ],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 30_000,
        },
      )
      return null
    } catch (error) {
      return {
        executionInputMode: 'local_dev',
        result: {
          status: 'skipped',
          tool: request.toolId,
          commandPlan: {
            tool: request.toolId,
            command: 'docker',
            args: [
              'run',
              '--rm',
            ...(!korniaCpuTensorRuntime && !foundationCpuRuntime ? ['--gpus', 'all'] : []),
              '--entrypoint',
              'true',
              image,
            ],
            executes: false,
            summary:
              korniaCpuTensorRuntime
                ? 'Kornia CPU tensor Docker runtime prerequisite blocked execution because Docker could not start the runtime image.'
                : foundationCpuRuntime
                ? 'Foundation CPU Docker runtime prerequisite blocked execution because Docker could not start the runtime image.'
                : 'GPU/model Docker runtime prerequisite blocked execution because Docker could not attach a GPU.',
          },
          skipReason: {
            code: 'gpu_model_runtime_container_gpu_unavailable',
            message:
              error instanceof Error ? error.message : String(error),
            tool: request.toolId,
          },
          warningCount: 1,
          errorMessage: undefined,
        },
        localRuntimeExecutionPerformed: false,
        warnings: [
          'GPU/model Docker runtime did not start because Docker GPU attachment is unavailable on this host.',
        ],
      }
    }
  }

  const privateInputBlock = privateLocalRuntimeInputBlock(request.toolId, payload)
  if (privateInputBlock) return privateInputBlock
  if (privateInputPreflightOnly(payload)) {
    return skippedPrerequisiteBlock({
      toolId: request.toolId,
      code: 'gpu_model_private_inputs_accepted_runtime_proof_not_requested',
      message:
        'Private local source/model/output inputs passed path-shape preflight; native CUDA/model runtime proof was intentionally not requested for this validation pass.',
      summary:
        'GPU/model local-dev preflight accepted private local inputs and stopped before Python/GPU/runtime startup.',
      warning:
        'GPU/model runtime did not start because this validation only proved private input path plumbing.',
    })
  }
  const privateModelContentBlock = privateModelRuntimeContentBlock(
    request.toolId,
    payload,
  )
  if (privateModelContentBlock) return privateModelContentBlock
  const modelWeightEvidenceBlock = privateModelWeightEvidenceBlock(
    request.toolId,
    payload,
  )
  if (modelWeightEvidenceBlock) return modelWeightEvidenceBlock

  const preflight = runtimePreflightPython(request.toolId, payload)
  const missingModules = Array.isArray(preflight?.missingModules)
    ? preflight.missingModules.filter((module): module is string => typeof module === 'string')
    : []
  const preflightError = typeof preflight?.preflightError === 'string'
    ? preflight.preflightError
    : null
  const cudaAvailable = preflight?.cudaAvailable === true
  const cudaProviderAvailable = preflight?.cudaProviderAvailable === true

  if (preflightError) {
    return {
      executionInputMode: 'local_dev',
      result: {
        status: 'skipped',
        tool: request.toolId,
        commandPlan: {
          tool: request.toolId,
          command: 'python',
          args: ['-c', 'importlib.util.find_spec(...)'],
          executes: false,
          summary:
            'GPU/model Python runtime prerequisite preflight failed before execution.',
        },
        skipReason: {
          code: 'gpu_model_python_runtime_unavailable',
          message: preflightError,
          tool: request.toolId,
        },
        warningCount: 1,
        errorMessage: undefined,
      },
      localRuntimeExecutionPerformed: false,
      warnings: [
        'GPU/model runtime did not start because Python runtime prerequisite preflight failed.',
      ],
    }
  }

  if (missingModules.length > 0) {
    return {
      executionInputMode: 'local_dev',
      result: {
        status: 'skipped',
        tool: request.toolId,
        commandPlan: {
          tool: request.toolId,
          command: 'python',
          args: ['-c', 'importlib.util.find_spec(...)'],
          executes: false,
          summary:
            'GPU/model Python package prerequisite preflight blocked execution before runtime start.',
        },
        skipReason: {
          code: 'gpu_model_python_package_missing',
          message: `Missing Python package/module prerequisite(s): ${missingModules.join(', ')}`,
          tool: request.toolId,
        },
        missingModules,
        warningCount: 1,
        errorMessage: undefined,
      },
      localRuntimeExecutionPerformed: false,
      warnings: [
        'GPU/model runtime did not start because Python package prerequisites are missing.',
      ],
    }
  }

  if (
    !korniaCpuTensorRuntime &&
    !foundationCpuRuntime &&
    (!cudaAvailable || (request.toolId === 'rembg' && !cudaProviderAvailable))
  ) {
    return {
      executionInputMode: 'local_dev',
      result: {
        status: 'skipped',
        tool: request.toolId,
        commandPlan: {
          tool: request.toolId,
          command: 'python',
          args: ['-c', 'torch.cuda.is_available() / onnxruntime CUDAExecutionProvider'],
          executes: false,
          summary:
            'GPU/model native CUDA prerequisite preflight blocked execution before runtime start.',
        },
        skipReason: {
          code: request.toolId === 'rembg'
            ? 'gpu_model_onnxruntime_cuda_provider_missing'
            : 'gpu_model_native_cuda_runtime_missing',
          message: request.toolId === 'rembg'
            ? 'onnxruntime CUDAExecutionProvider is unavailable; no CPU fallback is accepted.'
            : 'torch.cuda.is_available() is false; no CPU fallback is accepted.',
          tool: request.toolId,
        },
        warningCount: 1,
        errorMessage: undefined,
      },
      localRuntimeExecutionPerformed: false,
      warnings: [
        'GPU/model runtime did not start because native CUDA runtime proof is missing.',
      ],
    }
  }

  return null
}

function skippedPrerequisiteBlock(input: {
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId
  code: string
  message: string
  summary: string
  warning: string
  errorMessage?: string
}): Record<string, unknown> {
  return {
    executionInputMode: 'local_dev',
    result: {
      status: 'skipped',
      tool: input.toolId,
      commandPlan: {
        tool: input.toolId,
        command: 'private-input-preflight',
        args: ['existsSync(<private-local-runtime-input>)'],
        executes: false,
        summary: input.summary,
      },
      skipReason: {
        code: input.code,
        message: input.message,
        tool: input.toolId,
      },
      warningCount: 1,
      errorMessage: input.errorMessage,
    },
    localRuntimeExecutionPerformed: false,
    warnings: [input.warning],
  }
}

type PrivateLocalPathExpectation =
  | 'file'
  | 'directory'
  | 'birefnet_model_directory'

function privateLocalPathMatchesExpectation(
  pathValue: string,
  expectation: PrivateLocalPathExpectation,
): boolean {
  let pathStat
  try {
    pathStat = statSync(pathValue)
  } catch {
    return false
  }

  if (expectation === 'file') return pathStat.isFile()
  if (expectation === 'directory') return pathStat.isDirectory()
  if (expectation === 'birefnet_model_directory') {
    if (!pathStat.isDirectory()) return false
    const modelFilePath = `${pathValue}/model.safetensors`
    if (!existsSync(modelFilePath)) return false
    try {
      return statSync(modelFilePath).isFile()
    } catch {
      return false
    }
  }
  return false
}

function privateLocalPathExpectationLabel(
  expectation: PrivateLocalPathExpectation,
): string {
  if (expectation === 'birefnet_model_directory') {
    return 'a directory containing model.safetensors'
  }
  return `a ${expectation}`
}

function modelFilePathForRuntimeContentCheck(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  payload: Record<string, unknown>,
): {
  pathValue?: string
  code: string
  label: string
  expectedExtensions?: string[]
  expectedFileName?: string
  requiresSafetensorsHeader?: boolean
} | null {
  if (toolId === 'sam2') {
    return {
      pathValue: optionalString(payload, 'sam2CheckpointLocalPath'),
      code: 'sam2_checkpoint_too_small_for_runtime',
      label: 'SAM2 checkpoint',
      expectedExtensions: ['.pt', '.pth'],
    }
  }
  if (toolId === 'birefnet') {
    const modelDir = optionalString(payload, 'birefnetModelLocalPath')
    return {
      pathValue: modelDir ? path.join(modelDir, 'model.safetensors') : undefined,
      code: 'birefnet_model_too_small_for_runtime',
      label: 'BiRefNet model.safetensors',
      expectedFileName: 'model.safetensors',
      requiresSafetensorsHeader: true,
    }
  }
  if (toolId === 'real_esrgan') {
    return {
      pathValue: optionalString(payload, 'realEsrganModelLocalPath'),
      code: 'real_esrgan_model_too_small_for_runtime',
      label: 'Real-ESRGAN model',
      expectedFileName: 'RealESRGAN_x4plus.pth',
      expectedExtensions: ['.pth'],
    }
  }
  if (toolId === 'rembg') {
    return {
      pathValue: optionalString(payload, 'rembgModelLocalPath'),
      code: 'rembg_model_too_small_for_runtime',
      label: 'rembg ONNX model',
      expectedExtensions: ['.onnx'],
    }
  }
  if (toolId === 'transparent_background') {
    return {
      pathValue: optionalString(payload, 'transparentBackgroundCheckpointLocalPath'),
      code: 'transparent_background_checkpoint_too_small_for_runtime',
      label: 'transparent-background checkpoint',
      expectedExtensions: ['.pth'],
    }
  }
  return null
}

function readBytes(filePath: string, byteLength: number, position = 0): Buffer | null {
  let fd: number | null = null
  try {
    fd = openSync(filePath, 'r')
    const buffer = Buffer.alloc(byteLength)
    const bytesRead = readSync(fd, buffer, 0, byteLength, position)
    return buffer.subarray(0, bytesRead)
  } catch {
    return null
  } finally {
    if (fd !== null) closeSync(fd)
  }
}

function hasReadableSafetensorsHeader(filePath: string): boolean {
  const prefix = readBytes(filePath, 8)
  if (!prefix || prefix.length !== 8) return false
  const headerLength = Number(prefix.readBigUInt64LE(0))
  if (
    !Number.isSafeInteger(headerLength) ||
    headerLength <= 0 ||
    headerLength > maximumSafetensorsHeaderBytes
  ) {
    return false
  }
  const headerBytes = readBytes(filePath, headerLength, 8)
  if (!headerBytes || headerBytes.length !== headerLength) return false
  try {
    const header = JSON.parse(headerBytes.toString('utf8')) as unknown
    return Boolean(header && typeof header === 'object' && !Array.isArray(header))
  } catch {
    return false
  }
}

function invalidModelFileNameOrExtensionBlock(input: {
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId
  pathValue: string
  label: string
  expectedExtensions?: string[]
  expectedFileName?: string
}): Record<string, unknown> | null {
  const fileName = path.basename(input.pathValue)
  if (input.expectedFileName && fileName !== input.expectedFileName) {
    const code = input.toolId === 'real_esrgan'
      ? 'real_esrgan_model_invalid_file_name'
      : `${input.toolId}_model_invalid_file_name`
    return skippedPrerequisiteBlock({
      toolId: input.toolId,
      code,
      message:
        `${input.label} must use the approved private filename ${input.expectedFileName}; ` +
        'no model download, alias resolution, or public fetch is allowed.',
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU/Python startup because the supplied private model file name did not match the approved runtime contract.',
      warning:
        'GPU/model runtime did not start because the supplied private model/checkpoint filename did not match the approved runtime artifact contract.',
      errorMessage:
        `${input.label} filename must be ${input.expectedFileName} for controlled GPU/model runtime proof.`,
    })
  }
  if (
    input.expectedExtensions &&
    !input.expectedExtensions.includes(path.extname(input.pathValue).toLowerCase())
  ) {
    const code = input.toolId === 'sam2'
      ? 'sam2_checkpoint_invalid_extension'
      : input.toolId === 'transparent_background'
      ? 'transparent_background_checkpoint_invalid_extension'
      : input.toolId === 'rembg'
      ? 'rembg_model_invalid_extension'
      : `${input.toolId}_model_invalid_extension`
    return skippedPrerequisiteBlock({
      toolId: input.toolId,
      code,
      message:
        `${input.label} must use approved private runtime extension(s): ` +
        `${input.expectedExtensions.join(', ')}.`,
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU/Python startup because the supplied private model file extension did not match the approved runtime contract.',
      warning:
        'GPU/model runtime did not start because the supplied private model/checkpoint extension did not match the approved runtime artifact contract.',
      errorMessage:
        `${input.label} extension is not accepted for controlled GPU/model runtime proof.`,
    })
  }
  return null
}

function privateModelRuntimeContentBlock(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  payload: Record<string, unknown>,
): Record<string, unknown> | null {
  const modelFile = modelFilePathForRuntimeContentCheck(toolId, payload)
  if (!modelFile || !modelFile.pathValue) return null
  const fileNameBlock = invalidModelFileNameOrExtensionBlock({
    toolId,
    pathValue: modelFile.pathValue,
    label: modelFile.label,
    expectedExtensions: modelFile.expectedExtensions,
    expectedFileName: modelFile.expectedFileName,
  })
  if (fileNameBlock) return fileNameBlock
  let sizeBytes = 0
  try {
    sizeBytes = statSync(modelFile.pathValue).size
  } catch {
    return null
  }
  if (sizeBytes < minimumPrivateModelFileBytes) {
    return skippedPrerequisiteBlock({
      toolId,
      code: modelFile.code,
      message:
        `${modelFile.label} is too small (${sizeBytes} bytes) for accepted private runtime proof; ` +
        `expected at least ${minimumPrivateModelFileBytes} bytes before any CUDA/GPU runtime may start.`,
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU/Python startup because the supplied private model file was too small to be accepted as runtime proof input.',
      warning:
        'GPU/model runtime did not start because the supplied private model/checkpoint file looked like a placeholder rather than a real reviewed model artifact.',
      errorMessage:
        `${modelFile.label} is too small for controlled GPU/model runtime proof.`,
    })
  }
  if (
    modelFile.requiresSafetensorsHeader &&
    !hasReadableSafetensorsHeader(modelFile.pathValue)
  ) {
    return skippedPrerequisiteBlock({
      toolId,
      code: 'birefnet_model_invalid_safetensors_header',
      message:
        `${modelFile.label} must contain a readable safetensors header before any CUDA/GPU runtime may start.`,
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU/Python startup because the supplied private safetensors file did not contain a readable safetensors header.',
      warning:
        'GPU/model runtime did not start because the supplied private BiRefNet model file did not look like a valid safetensors artifact.',
      errorMessage:
        `${modelFile.label} did not contain a readable safetensors header for controlled GPU/model runtime proof.`,
    })
  }
  return null
}

function validModelWeightManifestId(value: string): boolean {
  return /^[a-z0-9][a-z0-9_.:-]{2,127}$/i.test(value) &&
    !/^[a-z][a-z0-9+.-]*:\/\//i.test(value) &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('\0') &&
    !value.split(/[\\/]+/).includes('..')
}

function validPrivateChecksumEvidenceRef(value: string): boolean {
  return value.startsWith('private://') &&
    !/^https?:\/\//i.test(value) &&
    !value.startsWith('public://') &&
    !value.includes('\0') &&
    !value.split(/[\\/]+/).includes('..')
}

function sha256File(filePath: string): string | null {
  let fd: number | null = null
  try {
    fd = openSync(filePath, 'r')
    const hash = createHash('sha256')
    const buffer = Buffer.alloc(1024 * 1024)
    while (true) {
      const bytesRead = readSync(fd, buffer, 0, buffer.length, null)
      if (bytesRead === 0) break
      hash.update(buffer.subarray(0, bytesRead))
    }
    return hash.digest('hex')
  } catch {
    return null
  } finally {
    if (fd !== null) closeSync(fd)
  }
}

function privateModelWeightEvidenceBlock(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  payload: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!modelWeightEvidenceRequiredTools.has(toolId)) return null

  const manifestId = optionalString(payload, 'modelWeightManifestId')
  const checksumSha256 = optionalString(payload, 'modelWeightChecksumSha256')
  const checksumEvidenceRef = optionalString(
    payload,
    'modelWeightChecksumEvidenceRef',
  )

  if (
    !manifestId ||
    !checksumSha256 ||
    !checksumEvidenceRef ||
    !validModelWeightManifestId(manifestId)
  ) {
    return skippedPrerequisiteBlock({
      toolId,
      code: `${toolId}_model_weight_manifest_evidence_missing`,
      message:
        'Reviewed private model-weight manifest evidence is required before any CUDA/GPU runtime may start. ' +
        'Provide modelWeightManifestId, modelWeightChecksumSha256, and modelWeightChecksumEvidenceRef with the private model/checkpoint path.',
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU/Python startup because reviewed model-weight manifest evidence was missing.',
      warning:
        'GPU/model runtime did not start because the private model/checkpoint path did not include reviewed model-weight evidence.',
      errorMessage:
        'Reviewed private model-weight manifest evidence is required for controlled GPU/model runtime proof.',
    })
  }

  if (!modelWeightChecksumPattern.test(checksumSha256)) {
    return skippedPrerequisiteBlock({
      toolId,
      code: `${toolId}_model_weight_checksum_invalid`,
      message:
        'modelWeightChecksumSha256 must be a 64-character SHA-256 hex digest before any CUDA/GPU runtime may start.',
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU/Python startup because the model-weight checksum was invalid.',
      warning:
        'GPU/model runtime did not start because the private model/checkpoint checksum evidence was malformed.',
      errorMessage:
        'modelWeightChecksumSha256 must be a 64-character SHA-256 hex digest.',
    })
  }

  if (!validPrivateChecksumEvidenceRef(checksumEvidenceRef)) {
    return skippedPrerequisiteBlock({
      toolId,
      code: `${toolId}_model_weight_checksum_evidence_ref_invalid`,
      message:
        'modelWeightChecksumEvidenceRef must be a reviewed private:// checksum evidence reference; public, signed, URL, or path-traversal refs are not accepted.',
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU/Python startup because the model-weight checksum evidence reference was not a reviewed private ref.',
      warning:
        'GPU/model runtime did not start because the private model/checkpoint checksum evidence reference was not acceptable.',
      errorMessage:
        'modelWeightChecksumEvidenceRef must be a reviewed private:// checksum evidence reference.',
    })
  }

  const modelFile = modelFilePathForRuntimeContentCheck(toolId, payload)
  if (!modelFile || !modelFile.pathValue) return null
  const actualChecksumSha256 = sha256File(modelFile.pathValue)
  if (!actualChecksumSha256) {
    return skippedPrerequisiteBlock({
      toolId,
      code: `${toolId}_model_weight_checksum_unreadable`,
      message:
        `${modelFile.label} could not be read for SHA-256 verification before CUDA/GPU runtime startup.`,
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU/Python startup because the private model/checkpoint checksum could not be computed.',
      warning:
        'GPU/model runtime did not start because the supplied private model/checkpoint file could not be hashed against reviewed model-weight evidence.',
      errorMessage:
        `${modelFile.label} could not be hashed for controlled GPU/model runtime proof.`,
    })
  }
  if (actualChecksumSha256.toLowerCase() !== checksumSha256.toLowerCase()) {
    return skippedPrerequisiteBlock({
      toolId,
      code: `${toolId}_model_weight_checksum_mismatch`,
      message:
        `${modelFile.label} SHA-256 does not match modelWeightChecksumSha256; ` +
        'reviewed model-weight evidence must match the exact private model/checkpoint file before CUDA/GPU runtime may start.',
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU/Python startup because the private model/checkpoint checksum did not match reviewed evidence.',
      warning:
        'GPU/model runtime did not start because the supplied private model/checkpoint file did not match the reviewed model-weight checksum.',
      errorMessage:
        `${modelFile.label} checksum did not match modelWeightChecksumSha256.`,
    })
  }

  return null
}

function missingLocalPathBlock(input: {
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId
  pathValue: string | undefined
  code: string
  label: string
  expectation: PrivateLocalPathExpectation
}): Record<string, unknown> | null {
  if (
    input.pathValue &&
    existsSync(input.pathValue) &&
    privateLocalPathMatchesExpectation(input.pathValue, input.expectation)
  ) return null
  if (input.pathValue && existsSync(input.pathValue)) {
    return skippedPrerequisiteBlock({
      toolId: input.toolId,
      code: input.code.replace(/_missing$/, '_invalid_path_kind'),
      message: `${input.label} must be ${privateLocalPathExpectationLabel(input.expectation)} at the supplied private local path; no download or public fetch is allowed.`,
      summary:
        'GPU/model local-dev execution prerequisite blocked before Docker/GPU startup because a required private local runtime input had the wrong filesystem type.',
      warning:
        'GPU/model runtime did not start because a required private local input path had the wrong filesystem type.',
      errorMessage:
        `${input.label} has the wrong filesystem type for this controlled GPU/model tool call.`,
    })
  }
  return skippedPrerequisiteBlock({
    toolId: input.toolId,
    code: input.code,
    message: `${input.label} is missing or not readable at the supplied private local path; no download or public fetch is allowed.`,
    summary:
      'GPU/model local-dev execution prerequisite blocked before Docker/GPU startup because a required private local runtime input was missing.',
    warning:
      'GPU/model runtime did not start because a required private local input path was missing.',
  })
}

function privateLocalRuntimeInputBlock(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  payload: Record<string, unknown>,
): Record<string, unknown> | null {
  const sourceFrame =
    optionalString(payload, 'sourceImageLocalPath') ??
    optionalString(payload, 'representativeFrameLocalPath')

  if (toolId === 'torch_torchvision' || toolId === 'transformers') return null

  if (toolId === 'sam2') {
    return missingLocalPathBlock({
      toolId,
      pathValue: optionalString(payload, 'sam2CheckpointLocalPath'),
      code: 'sam2_checkpoint_missing',
      label: 'SAM2 checkpoint',
      expectation: 'file',
    }) ?? missingLocalPathBlock({
      toolId,
      pathValue: sourceFrame,
      code: 'sam2_source_frame_missing',
      label: 'SAM2 private source image/frame',
      expectation: 'file',
    })
  }

  if (toolId === 'birefnet') {
    return missingLocalPathBlock({
      toolId,
      pathValue: optionalString(payload, 'birefnetModelLocalPath'),
      code: 'birefnet_model_missing',
      label: 'BiRefNet model/checkpoint',
      expectation: 'birefnet_model_directory',
    }) ?? missingLocalPathBlock({
      toolId,
      pathValue: sourceFrame,
      code: 'birefnet_source_frame_missing',
      label: 'BiRefNet private source image/frame',
      expectation: 'file',
    })
  }

  if (toolId === 'real_esrgan') {
    return missingLocalPathBlock({
      toolId,
      pathValue: optionalString(payload, 'realEsrganModelLocalPath'),
      code: 'real_esrgan_model_missing',
      label: 'Real-ESRGAN model',
      expectation: 'file',
    }) ?? missingLocalPathBlock({
      toolId,
      pathValue: sourceFrame,
      code: 'real_esrgan_source_frame_missing',
      label: 'Real-ESRGAN private source image/frame',
      expectation: 'file',
    })
  }

  if (toolId === 'kornia') {
    return missingLocalPathBlock({
      toolId,
      pathValue: sourceFrame,
      code: 'kornia_source_frame_missing',
      label: 'Kornia private source image/frame',
      expectation: 'file',
    })
  }

  if (toolId === 'rembg') {
    return missingLocalPathBlock({
      toolId,
      pathValue: optionalString(payload, 'rembgModelLocalPath'),
      code: 'rembg_model_missing',
      label: 'rembg ONNX model',
      expectation: 'file',
    }) ?? missingLocalPathBlock({
      toolId,
      pathValue: sourceFrame,
      code: 'rembg_source_frame_missing',
      label: 'rembg private source image/frame',
      expectation: 'file',
    })
  }

  return missingLocalPathBlock({
    toolId,
    pathValue: optionalString(payload, 'transparentBackgroundCheckpointLocalPath'),
    code: 'transparent_background_checkpoint_missing',
    label: 'transparent-background checkpoint',
    expectation: 'file',
  }) ?? missingLocalPathBlock({
    toolId,
    pathValue: sourceFrame,
    code: 'transparent_background_source_frame_missing',
    label: 'transparent-background private source image/frame',
    expectation: 'file',
  })
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

function shouldAddMissingExecutionInputWarning(
  skipReasonCode: string | null,
): boolean {
  if (!skipReasonCode) return true
  if (
    skipReasonCode.includes('_too_small_for_runtime') ||
    skipReasonCode.includes('_invalid_extension') ||
    skipReasonCode.includes('_invalid_file_name') ||
    skipReasonCode.includes('_invalid_safetensors_header') ||
    skipReasonCode.includes('_model_weight_') ||
    skipReasonCode.includes('_invalid_path_kind') ||
    skipReasonCode.includes('_outside_local_artifacts') ||
    skipReasonCode.startsWith('gpu_model_python') ||
    skipReasonCode.startsWith('gpu_model_runtime_container') ||
    skipReasonCode.includes('cuda')
  ) {
    return false
  }
  return true
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
    runtimeExecutionBackend: runtimeExecutionBackend(payload),
    runtimeContainerImage: runtimeContainerImage(payload),
    runtimeContainerPlatform: runtimeContainerPlatform(payload),
    runtimeContainerGpu: runtimeContainerGpu(payload),
    allowCpuTensorRuntime: allowKorniaCpuTensorRuntime(request.toolId, payload),
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
    runtimeExecutionBackend: runtimeExecutionBackend(payload),
    runtimeContainerImage: runtimeContainerImage(payload),
    runtimeContainerPlatform: runtimeContainerPlatform(payload),
    runtimeContainerGpu: runtimeContainerGpu(payload),
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
    outputJsonPath: result.outputJsonPath ?? null,
    outputJsonSizeBytes: result.outputJsonSizeBytes ?? null,
    outputJsonSha256: result.outputJsonSha256 ?? null,
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
    runtimeExecutionBackend: runtimeExecutionBackend(payload),
    runtimeContainerImage: runtimeContainerImage(payload),
    runtimeContainerPlatform: runtimeContainerPlatform(payload),
    runtimeContainerGpu: runtimeContainerGpu(payload),
    allowCpuFoundationRuntime: allowFoundationCpuRuntime(request.toolId, payload),
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
      outputJsonSha256: result.outputJsonSha256,
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
      executionState: 'failed_with_diagnostics',
      blockingReasonCode: null,
      failureDiagnostics: 'unsupported GPU/model tool id',
      controlledAdapterExecutableNow: false,
      controlledAdapterExecutedNow: false,
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
  const prerequisiteBlock = runtimePrerequisiteBlock(request, payload)
  const runtimeOutput = prerequisiteBlock ?? (request.toolId === 'torch_torchvision' ||
      request.toolId === 'transformers'
    ? await runFoundationTool(request, payload)
    : request.toolId === 'real_esrgan'
    ? await runEnhancementTool(request, payload)
    : await runMaskTool(request, payload))

  const localRuntimeExecutionPerformed =
    runtimeOutput.localRuntimeExecutionPerformed === true
  const gpuRuntimeUsedForScopedControlledToolCall =
    localRuntimeExecutionPerformed &&
    !allowKorniaCpuTensorRuntime(request.toolId, payload) &&
    !allowFoundationCpuRuntime(request.toolId, payload)
  const skipped = (
    runtimeOutput.result as { status?: unknown } | undefined
  )?.status === 'skipped'
  const skipCode = (
    (runtimeOutput.result as { skipReason?: { code?: unknown } } | undefined)
      ?.skipReason
      ?.code
  )
  const skipReasonCode = typeof skipCode === 'string' ? skipCode : null
  const failed = (
    runtimeOutput.result as { status?: unknown } | undefined
  )?.status === 'failed'
  const executionState: AiGraphicsExternalAgentGpuModelExecutionState =
    localRuntimeExecutionPerformed
      ? 'executable'
      : failed
      ? 'failed_with_diagnostics'
      : 'blocked_with_reason'
  const failureDiagnostics =
    typeof (runtimeOutput.result as { errorMessage?: unknown } | undefined)
      ?.errorMessage === 'string'
      ? (runtimeOutput.result as { errorMessage: string }).errorMessage
      : failed
      ? 'GPU/model controlled adapter failed before producing private output.'
      : null

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
    executionState,
    blockingReasonCode: executionState === 'blocked_with_reason'
      ? skipReasonCode ?? 'gpu_model_runtime_prerequisites_missing'
      : null,
    failureDiagnostics,
    controlledAdapterExecutableNow: localRuntimeExecutionPerformed,
    controlledAdapterExecutedNow: localRuntimeExecutionPerformed,
    controlledAdapterInvokedNow: true,
    localGpuModelRuntimeExecutionPerformed: localRuntimeExecutionPerformed,
    externalAgentCanExecuteViaMountedRouteNow: localRuntimeExecutionPerformed,
    routeExecutionApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: localRuntimeExecutionPerformed,
    browserWebglCanvasRuntimeApprovedNow: false,
    gpuRuntimeApprovedForScopedControlledToolCall:
      gpuRuntimeUsedForScopedControlledToolCall,
    gpuRuntimeShouldStartNow: gpuRuntimeUsedForScopedControlledToolCall,
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
      ...(skipped && shouldAddMissingExecutionInputWarning(skipReasonCode)
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
