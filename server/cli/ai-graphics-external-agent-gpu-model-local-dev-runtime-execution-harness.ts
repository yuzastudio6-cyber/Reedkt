import fs from 'node:fs'
import path from 'node:path'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_DECISION,
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
  executeAiGraphicsExternalAgentGpuModelControlledAdapter,
  type AiGraphicsExternalAgentGpuModelControlledAdapterResult,
  type AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
} from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'
import {
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

const decision =
  'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks'
const status =
  'local_dev_runtime_inputs_required_before_eight_gpu_model_tools_execute'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.md'
const canonicalGpuWorkerProofImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'

type HarnessArgs = {
  attemptLocalRuntime: boolean
  toolIds: AiGraphicsExternalAgentGpuModelControlledAdapterToolId[]
  runtimeInputManifestPath?: string
  runtimeInputManifest?: RuntimeInputManifest
  outputDirectory?: string
  sourceImageLocalPath?: string
  sam2CheckpointLocalPath?: string
  birefnetModelLocalPath?: string
  realEsrganModelLocalPath?: string
  rembgModelLocalPath?: string
  transparentBackgroundCheckpointLocalPath?: string
  runtimeExecutionBackend?: 'host_python' | 'docker_container'
  runtimeContainerImage?: string
  runtimeContainerPlatform?: string
  runtimeContainerGpu: boolean
  allowCpuTensorRuntime: boolean
  allowCpuFoundationRuntime: boolean
  privateInputPreflightOnly: boolean
  timeoutMs?: number
  resultOut?: string
  writeRecords: boolean
}

type RuntimeInputManifest = Record<string, unknown>

type LocalInputRequirement = {
  key: string
  requiredForDefaultHarness: boolean
  requiredForActualExecution: boolean
  description: string
}

const runtimeInputManifestStringFields = new Set([
  'outputDirectory',
  'sourceImageLocalPath',
  'sam2CheckpointLocalPath',
  'birefnetModelLocalPath',
  'realEsrganModelLocalPath',
  'rembgModelLocalPath',
  'transparentBackgroundCheckpointLocalPath',
  'runtimeContainerImage',
  'runtimeContainerPlatform',
])

const runtimeInputManifestPathFields = new Set([
  'outputDirectory',
  'sourceImageLocalPath',
  'sam2CheckpointLocalPath',
  'birefnetModelLocalPath',
  'realEsrganModelLocalPath',
  'rembgModelLocalPath',
  'transparentBackgroundCheckpointLocalPath',
])

const runtimeInputManifestBooleanFields = new Set([
  'allowCpuTensorRuntime',
  'allowCpuFoundationRuntime',
  'privateInputPreflightOnly',
  'localRuntimeInputPreflightOnly',
])

const runtimeInputManifestToolRecordFields = new Set([
  ...runtimeInputManifestStringFields,
  ...runtimeInputManifestBooleanFields,
])

const supportedRuntimeInputManifestTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
)

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  const value = process.argv[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

function numberFlag(flag: string): number | undefined {
  const raw = stringFlag(flag)
  if (raw === undefined) return undefined
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive number`)
  }
  return parsed
}

function parseToolIds(): AiGraphicsExternalAgentGpuModelControlledAdapterToolId[] {
  const rawTool = stringFlag('--tool')
  const rawTools = stringFlag('--tools')
  const raw = [rawTool, rawTools].filter(Boolean).join(',')
  if (!raw) return [...AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS]

  const requested = raw
    .split(',')
    .map((toolId) => toolId.trim())
    .filter(Boolean)
  if (requested.length === 0) {
    throw new Error('--tool/--tools requires at least one GPU/model tool id')
  }

  const supported = new Set<string>(
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
  )
  const unique: AiGraphicsExternalAgentGpuModelControlledAdapterToolId[] = []
  for (const toolId of requested) {
    if (!supported.has(toolId)) {
      throw new Error(
        `Unsupported GPU/model tool id for --tool/--tools: ${toolId}`,
      )
    }
    if (!unique.includes(toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId)) {
      unique.push(toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId)
    }
  }

  return unique
}

function parseArgs(): HarnessArgs {
  const runtimeInputManifestPath = stringFlag('--runtime-input-manifest')
  if (runtimeInputManifestPath && !isLocalArtifactPath(runtimeInputManifestPath)) {
    throw new Error('--runtime-input-manifest must stay under .local-artifacts/')
  }

  const args: HarnessArgs = {
    attemptLocalRuntime: hasFlag('--attempt-local-runtime'),
    toolIds: parseToolIds(),
    runtimeInputManifestPath,
    runtimeInputManifest: runtimeInputManifestPath
      ? readRuntimeInputManifest(runtimeInputManifestPath)
      : undefined,
    outputDirectory: stringFlag('--output-dir'),
    sourceImageLocalPath: stringFlag('--source-image'),
    sam2CheckpointLocalPath: stringFlag('--sam2-checkpoint'),
    birefnetModelLocalPath: stringFlag('--birefnet-model'),
    realEsrganModelLocalPath: stringFlag('--real-esrgan-model'),
    rembgModelLocalPath: stringFlag('--rembg-model'),
    transparentBackgroundCheckpointLocalPath:
      stringFlag('--transparent-background-checkpoint'),
    runtimeExecutionBackend:
      stringFlag('--runtime-backend') === 'docker_container'
        ? 'docker_container'
        : 'host_python',
    runtimeContainerImage: stringFlag('--runtime-container-image'),
    runtimeContainerPlatform: stringFlag('--runtime-container-platform'),
    runtimeContainerGpu: !hasFlag('--no-runtime-container-gpu'),
    allowCpuTensorRuntime: hasFlag('--allow-cpu-tensor-runtime'),
    allowCpuFoundationRuntime: hasFlag('--allow-cpu-foundation-runtime'),
    privateInputPreflightOnly: hasFlag('--private-input-preflight-only'),
    timeoutMs: numberFlag('--timeout-ms'),
    resultOut: stringFlag('--result-out'),
    writeRecords: hasFlag('--write-records'),
  }

  if (args.writeRecords && args.attemptLocalRuntime) {
    throw new Error(
      '--write-records cannot be combined with --attempt-local-runtime; committed records must stay skip-safe.',
    )
  }
  if (args.writeRecords && args.resultOut) {
    throw new Error(
      '--write-records cannot be combined with --result-out; private proof results must stay local-only.',
    )
  }
  if (args.writeRecords && args.runtimeInputManifestPath) {
    throw new Error(
      '--write-records cannot be combined with --runtime-input-manifest; private input manifests must stay local-only.',
    )
  }
  if (args.resultOut && !args.attemptLocalRuntime) {
    throw new Error('--result-out requires --attempt-local-runtime')
  }
  if (args.resultOut && !isLocalArtifactPath(args.resultOut)) {
    throw new Error('--result-out must stay under .local-artifacts/')
  }

  if (
    args.writeRecords &&
    args.toolIds.length !== AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.length
  ) {
    throw new Error(
      '--write-records must cover all eight GPU/model tools; scoped --tool runs are local proof only.',
    )
  }

  if (
    args.attemptLocalRuntime &&
    args.toolIds.some((toolId) => !runtimeInputsForTool(toolId, args).outputDirectory)
  ) {
    throw new Error(
      '--attempt-local-runtime requires --output-dir or runtime-input-manifest outputDirectory',
    )
  }
  if (args.attemptLocalRuntime) {
    const unsafeOutputDirectory = args.toolIds
      .map((toolId) => runtimeInputsForTool(toolId, args).outputDirectory)
      .find((outputDirectory) => (
        typeof outputDirectory === 'string' &&
        !isLocalArtifactPath(outputDirectory)
      ))
    if (unsafeOutputDirectory) {
      throw new Error(
        'runtime input manifest outputDirectory must stay under .local-artifacts/',
      )
    }
  }

  return args
}

function isLocalArtifactPath(filePath: string): boolean {
  const normalized = path.normalize(filePath)
  return normalized === '.local-artifacts' ||
    normalized.startsWith(`.local-artifacts${path.sep}`)
}

function readRuntimeInputManifest(filePath: string): RuntimeInputManifest {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('--runtime-input-manifest must be a JSON object')
  }
  const manifest = parsed as RuntimeInputManifest
  validateRuntimeInputManifest(manifest)
  return manifest
}

function validateRuntimeInputManifest(manifest: RuntimeInputManifest): void {
  const hasToolInputs = Object.prototype.hasOwnProperty.call(manifest, 'toolInputs')
  const hasTools = Object.prototype.hasOwnProperty.call(manifest, 'tools')
  if (hasToolInputs && hasTools) {
    throw new Error('runtime input manifest must use either toolInputs or tools, not both')
  }
  for (const [key, value] of Object.entries(manifest)) {
    if (key === 'toolInputs' || key === 'tools') {
      validateRuntimeInputManifestToolInputs(key, value)
      continue
    }
    if (runtimeInputManifestStringFields.has(key)) {
      safeManifestString(key, value)
      continue
    }
    if (runtimeInputManifestBooleanFields.has(key)) {
      safeManifestBoolean(key, value)
      continue
    }
    throw new Error(`runtime input manifest contains unsupported field ${key}`)
  }
}

function validateRuntimeInputManifestToolInputs(
  key: string,
  value: unknown,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`runtime input manifest field ${key} must be an object`)
  }
  for (const [toolId, record] of Object.entries(value as Record<string, unknown>)) {
    if (!supportedRuntimeInputManifestTools.has(toolId)) {
      throw new Error(`runtime input manifest references unsupported tool id ${toolId}`)
    }
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`runtime input manifest tool record ${toolId} must be an object`)
    }
    for (const [field, fieldValue] of Object.entries(record as Record<string, unknown>)) {
      if (!runtimeInputManifestToolRecordFields.has(field)) {
        throw new Error(
          `runtime input manifest tool record ${toolId} contains unsupported field ${field}`,
        )
      }
      if (runtimeInputManifestStringFields.has(field)) {
        safeManifestString(field, fieldValue)
      } else {
        safeManifestBoolean(field, fieldValue)
      }
    }
  }
}

function manifestToolRecord(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  manifest: RuntimeInputManifest | undefined,
): RuntimeInputManifest {
  if (!manifest) return {}
  const toolInputs = manifest.toolInputs ?? manifest.tools
  if (!toolInputs || typeof toolInputs !== 'object' || Array.isArray(toolInputs)) {
    return {}
  }
  const record = (toolInputs as Record<string, unknown>)[toolId]
  if (!record || typeof record !== 'object' || Array.isArray(record)) return {}
  return record as RuntimeInputManifest
}

function safeManifestString(
  key: string,
  value: unknown,
): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`runtime input manifest field ${key} must be a non-empty string`)
  }
  if (
    /^https?:\/\//i.test(value) ||
    (runtimeInputManifestPathFields.has(key) && /^[a-z][a-z0-9+.-]*:\/\//i.test(value)) ||
    value.includes('\0')
  ) {
    throw new Error(`runtime input manifest field ${key} must be a private local path`)
  }
  if (value.split(/[\\/]+/).includes('..')) {
    throw new Error(`runtime input manifest field ${key} must not contain path traversal segments`)
  }
  return value
}

function safeManifestBoolean(key: string, value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'boolean') {
    throw new Error(`runtime input manifest field ${key} must be a boolean`)
  }
  return value
}

function manifestStringForTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  args: HarnessArgs,
  key: string,
): string | undefined {
  const toolRecord = manifestToolRecord(toolId, args.runtimeInputManifest)
  return safeManifestString(
    key,
    toolRecord[key] ?? args.runtimeInputManifest?.[key],
  )
}

function manifestBooleanForTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  args: HarnessArgs,
  key: string,
): boolean | undefined {
  const toolRecord = manifestToolRecord(toolId, args.runtimeInputManifest)
  return safeManifestBoolean(
    key,
    toolRecord[key] ?? args.runtimeInputManifest?.[key],
  )
}

function runtimeInputsForTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  args: HarnessArgs,
) {
  return {
    outputDirectory:
      args.outputDirectory ?? manifestStringForTool(toolId, args, 'outputDirectory'),
    sourceImageLocalPath:
      args.sourceImageLocalPath ??
      manifestStringForTool(toolId, args, 'sourceImageLocalPath'),
    sam2CheckpointLocalPath:
      args.sam2CheckpointLocalPath ??
      manifestStringForTool(toolId, args, 'sam2CheckpointLocalPath'),
    birefnetModelLocalPath:
      args.birefnetModelLocalPath ??
      manifestStringForTool(toolId, args, 'birefnetModelLocalPath'),
    realEsrganModelLocalPath:
      args.realEsrganModelLocalPath ??
      manifestStringForTool(toolId, args, 'realEsrganModelLocalPath'),
    rembgModelLocalPath:
      args.rembgModelLocalPath ??
      manifestStringForTool(toolId, args, 'rembgModelLocalPath'),
    transparentBackgroundCheckpointLocalPath:
      args.transparentBackgroundCheckpointLocalPath ??
      manifestStringForTool(toolId, args, 'transparentBackgroundCheckpointLocalPath'),
    runtimeContainerImage:
      args.runtimeContainerImage ??
      manifestStringForTool(toolId, args, 'runtimeContainerImage'),
    runtimeContainerPlatform:
      args.runtimeContainerPlatform ??
      manifestStringForTool(toolId, args, 'runtimeContainerPlatform'),
    allowCpuTensorRuntime:
      args.allowCpuTensorRuntime ||
      manifestBooleanForTool(toolId, args, 'allowCpuTensorRuntime') === true,
    allowCpuFoundationRuntime:
      args.allowCpuFoundationRuntime ||
      manifestBooleanForTool(toolId, args, 'allowCpuFoundationRuntime') === true,
    privateInputPreflightOnly:
      args.privateInputPreflightOnly ||
      manifestBooleanForTool(toolId, args, 'privateInputPreflightOnly') === true ||
      manifestBooleanForTool(toolId, args, 'localRuntimeInputPreflightOnly') === true,
  }
}

function productCapabilities(capabilityIds: readonly string[]): string[] {
  return capabilityIds.filter((capabilityId) => (
    capabilityId !== 'planning_metadata_only' &&
    capabilityId !== 'blocked_or_deferred'
  ))
}

function primaryCapability(
  toolId: AiGraphicsCanonicalToolId,
  capabilityIds: readonly string[],
): string {
  const capabilities = productCapabilities(capabilityIds)
  const preferredByTool: Partial<Record<AiGraphicsCanonicalToolId, string>> = {
    torch_torchvision: 'model_runtime_foundation',
    transformers: 'model_runtime_foundation',
    sam2: 'subject_segmentation',
    birefnet: 'background_removal',
    real_esrgan: 'upscaling',
    kornia: 'tensor_image_ops',
    rembg: 'background_removal',
    transparent_background: 'background_removal',
  }
  const preferred = preferredByTool[toolId]
  if (preferred && capabilities.includes(preferred)) return preferred
  if (capabilities[0]) return capabilities[0]
  throw new Error(`Missing product capability for ${toolId}`)
}

function modelWeightManifestRequired(toolId: AiGraphicsCanonicalToolId): boolean {
  return [
    'sam2',
    'birefnet',
    'real_esrgan',
    'rembg',
    'transparent_background',
  ].includes(toolId)
}

function gpuModelRequiresSourceImage(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): boolean {
  return !['torch_torchvision', 'transformers'].includes(toolId)
}

function localInputRequirements(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options?: {
    allowCpuTensorRuntime?: boolean
    allowCpuFoundationRuntime?: boolean
  },
): LocalInputRequirement[] {
  const outputDirectory: LocalInputRequirement = {
    key: 'outputDirectory',
    requiredForDefaultHarness: false,
    requiredForActualExecution: true,
    description:
      'Private local worker output directory; must not be public artifact storage.',
  }
  const sourceImage: LocalInputRequirement = {
    key: 'sourceImageLocalPath',
    requiredForDefaultHarness: false,
    requiredForActualExecution: true,
    description: 'Private local representative image/frame selected from an approved plan.',
  }

  if (toolId === 'torch_torchvision' || toolId === 'transformers') {
    const foundationRuntimeRequirement: LocalInputRequirement =
      options?.allowCpuFoundationRuntime === true
        ? {
            key: 'pythonCpuFoundationRuntime',
            requiredForDefaultHarness: false,
            requiredForActualExecution: true,
            description:
              'Approved local Python foundation runtime with torch and the package-specific import; no GPU, model download, model inference, provider call, or media processing required.',
          }
        : {
            key: 'nativeCudaRuntime',
            requiredForDefaultHarness: false,
            requiredForActualExecution: true,
            description:
              'Approved local/native CUDA runtime; CPU fallback is intentionally not accepted.',
          }
    return [
      outputDirectory,
      foundationRuntimeRequirement,
    ]
  }

  if (toolId === 'kornia') {
    const korniaRuntimeRequirement: LocalInputRequirement =
      options?.allowCpuTensorRuntime === true
        ? {
            key: 'pythonCpuTensorRuntime',
            requiredForDefaultHarness: false,
            requiredForActualExecution: true,
            description:
              'Approved local Python tensor runtime with torch, PIL, numpy, and kornia; no GPU, model download, or provider call required.',
          }
        : {
            key: 'nativeCudaRuntime',
            requiredForDefaultHarness: false,
            requiredForActualExecution: true,
            description:
              'Approved CUDA runtime for bounded tensor/image operations; no model weight required.',
          }
    return [
      outputDirectory,
      sourceImage,
      korniaRuntimeRequirement,
    ]
  }

  const modelInputByTool: Record<
    Exclude<AiGraphicsExternalAgentGpuModelControlledAdapterToolId, 'torch_torchvision' | 'transformers' | 'kornia'>,
    LocalInputRequirement
  > = {
    sam2: {
      key: 'sam2CheckpointLocalPath',
      requiredForDefaultHarness: false,
      requiredForActualExecution: true,
      description: 'Reviewed private SAM2 checkpoint path; no download allowed.',
    },
    birefnet: {
      key: 'birefnetModelLocalPath',
      requiredForDefaultHarness: false,
      requiredForActualExecution: true,
      description: 'Reviewed private BiRefNet model/checkpoint path; no download allowed.',
    },
    real_esrgan: {
      key: 'realEsrganModelLocalPath',
      requiredForDefaultHarness: false,
      requiredForActualExecution: true,
      description: 'Reviewed private Real-ESRGAN model path; no download allowed.',
    },
    rembg: {
      key: 'rembgModelLocalPath',
      requiredForDefaultHarness: false,
      requiredForActualExecution: true,
      description: 'Reviewed private rembg ONNX model path; no download allowed.',
    },
    transparent_background: {
      key: 'transparentBackgroundCheckpointLocalPath',
      requiredForDefaultHarness: false,
      requiredForActualExecution: true,
      description:
        'Reviewed private transparent-background checkpoint path; no download allowed.',
    },
  }

  return toolId === 'sam2'
    ? [
        outputDirectory,
        sourceImage,
        modelInputByTool[toolId],
        {
          key: 'nativeCudaRuntime',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Approved CUDA runtime for one approved private source frame only; broad real-media/full-video execution is not accepted.',
        },
      ]
    : [
        outputDirectory,
        sourceImage,
        modelInputByTool[toolId],
        {
          key: 'nativeCudaRuntime',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Approved CUDA runtime for the scoped local worker call only.',
        },
      ]
}

function minimumPrivateRuntimeInputKeys(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options?: {
    allowCpuTensorRuntime?: boolean
    allowCpuFoundationRuntime?: boolean
  },
): string[] {
  return localInputRequirements(toolId, options)
    .filter((requirement) => requirement.requiredForActualExecution)
    .map((requirement) => requirement.key)
}

function currentBlockingPrerequisiteKey(
  blockingReasonCode: string | null | undefined,
  options?: {
    allowCpuTensorRuntime?: boolean
    allowCpuFoundationRuntime?: boolean
  },
): string | null {
  if (!blockingReasonCode) return null
  if (
    blockingReasonCode.includes('output_directory_missing') ||
    blockingReasonCode.includes('output_directory_outside_local_artifacts')
  ) {
    return 'outputDirectory'
  }
  if (
    blockingReasonCode.includes('source_frame_missing') ||
    blockingReasonCode.includes('source_frame_invalid_path_kind')
  ) {
    return 'sourceImageLocalPath'
  }
  if (
    blockingReasonCode.includes('sam2_checkpoint_missing') ||
    blockingReasonCode.includes('sam2_checkpoint_invalid_path_kind') ||
    blockingReasonCode.includes('sam2_checkpoint_invalid_extension') ||
    blockingReasonCode.includes('sam2_checkpoint_too_small_for_runtime')
  ) {
    return 'sam2CheckpointLocalPath'
  }
  if (
    blockingReasonCode.includes('birefnet_model_missing') ||
    blockingReasonCode.includes('birefnet_model_invalid_path_kind') ||
    blockingReasonCode.includes('birefnet_model_invalid_safetensors_header') ||
    blockingReasonCode.includes('birefnet_model_too_small_for_runtime')
  ) {
    return 'birefnetModelLocalPath'
  }
  if (
    blockingReasonCode.includes('real_esrgan_model_missing') ||
    blockingReasonCode.includes('real_esrgan_model_invalid_path_kind') ||
    blockingReasonCode.includes('real_esrgan_model_invalid_file_name') ||
    blockingReasonCode.includes('real_esrgan_model_too_small_for_runtime')
  ) {
    return 'realEsrganModelLocalPath'
  }
  if (
    blockingReasonCode.includes('rembg_model_missing') ||
    blockingReasonCode.includes('rembg_model_invalid_path_kind') ||
    blockingReasonCode.includes('rembg_model_invalid_extension') ||
    blockingReasonCode.includes('rembg_model_too_small_for_runtime')
  ) {
    return 'rembgModelLocalPath'
  }
  if (
    blockingReasonCode.includes('transparent_background_checkpoint_missing') ||
    blockingReasonCode.includes('transparent_background_checkpoint_invalid_path_kind') ||
    blockingReasonCode.includes('transparent_background_checkpoint_invalid_extension') ||
    blockingReasonCode.includes('transparent_background_checkpoint_too_small_for_runtime')
  ) {
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
    return 'pythonRuntime'
  }
  if (blockingReasonCode.includes('private_inputs_accepted_runtime_proof_not_requested')) {
    return 'nativeCudaRuntime'
  }
  if (blockingReasonCode.includes('disabled_or_not_local_dev')) {
    return 'attemptGpuRuntime'
  }
  return null
}

function exactRuntimeAttemptCommand(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: {
    container: boolean
  },
): string {
  const parts = [
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness --',
    '--attempt-local-runtime',
    ...(options.container
      ? [
          '--runtime-backend docker_container',
          `--runtime-container-image ${canonicalGpuWorkerProofImage}`,
          '--runtime-container-platform linux/amd64',
        ]
      : []),
    `--tool ${toolId}`,
    '--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>',
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
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
    toolId === 'kornia'
      ? '--allow-cpu-tensor-runtime'
      : '',
    (toolId === 'torch_torchvision' || toolId === 'transformers')
      ? '--allow-cpu-foundation-runtime'
      : '',
  ]

  return parts.filter(Boolean).join(' ')
}

function exactRuntimeAttemptCommandsByTool(options: {
  container: boolean
}): Record<AiGraphicsExternalAgentGpuModelControlledAdapterToolId, string> {
  return Object.fromEntries(
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.map(
      (toolId) => [toolId, exactRuntimeAttemptCommand(toolId, options)],
    ),
  ) as Record<AiGraphicsExternalAgentGpuModelControlledAdapterToolId, string>
}

function applyRuntimePayloadArgs(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  args: HarnessArgs,
): Record<string, unknown> {
  const runtimeInputs = runtimeInputsForTool(toolId, args)
  const payload: Record<string, unknown> = {
    mode: 'local_dev',
    enableGpuModelControlledExecution: true,
    enableFoundationRuntimeExecution: true,
    externalAgentGpuModelLocalDevRuntimeExecutionHarness: true,
    privateOutputOnly: true,
    gpuRuntimeOnDemandOnly: true,
    noIdleGpuRuntimeApproved: true,
    toolExecutionPerformed: false,
    gpuRuntimeShouldStartNow: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }

  if (!args.attemptLocalRuntime) return payload

  payload.outputDirectory = runtimeInputs.outputDirectory
  payload.timeoutMs = args.timeoutMs
  if (toolId === 'kornia' && runtimeInputs.allowCpuTensorRuntime) {
    payload.allowCpuTensorRuntime = true
    payload.runtimeContainerGpu = false
  }
  if (
    (toolId === 'torch_torchvision' || toolId === 'transformers') &&
    runtimeInputs.allowCpuFoundationRuntime
  ) {
    payload.allowCpuFoundationRuntime = true
    payload.runtimeContainerGpu = false
  }
  if (runtimeInputs.sourceImageLocalPath) {
    payload.sourceImageLocalPath = runtimeInputs.sourceImageLocalPath
    payload.representativeFrameLocalPath = runtimeInputs.sourceImageLocalPath
  }
  payload.runtimeExecutionBackend = args.runtimeExecutionBackend
  payload.runtimeContainerGpu =
    (toolId === 'kornia' && runtimeInputs.allowCpuTensorRuntime) ||
    (
      (toolId === 'torch_torchvision' || toolId === 'transformers') &&
      runtimeInputs.allowCpuFoundationRuntime
    )
      ? false
      : args.runtimeContainerGpu
  if (runtimeInputs.runtimeContainerImage) {
    payload.runtimeContainerImage = runtimeInputs.runtimeContainerImage
  }
  if (runtimeInputs.runtimeContainerPlatform) {
    payload.runtimeContainerPlatform = runtimeInputs.runtimeContainerPlatform
  }
  if (runtimeInputs.privateInputPreflightOnly) {
    payload.privateInputPreflightOnly = true
  }
  if (toolId === 'sam2' && runtimeInputs.sam2CheckpointLocalPath) {
    payload.sam2CheckpointLocalPath = runtimeInputs.sam2CheckpointLocalPath
  }
  if (toolId === 'birefnet' && runtimeInputs.birefnetModelLocalPath) {
    payload.birefnetModelLocalPath = runtimeInputs.birefnetModelLocalPath
  }
  if (toolId === 'real_esrgan' && runtimeInputs.realEsrganModelLocalPath) {
    payload.realEsrganModelLocalPath = runtimeInputs.realEsrganModelLocalPath
  }
  if (toolId === 'rembg' && runtimeInputs.rembgModelLocalPath) {
    payload.rembgModelLocalPath = runtimeInputs.rembgModelLocalPath
  }
  if (
    toolId === 'transparent_background' &&
    runtimeInputs.transparentBackgroundCheckpointLocalPath
  ) {
    payload.transparentBackgroundCheckpointLocalPath =
      runtimeInputs.transparentBackgroundCheckpointLocalPath
  }

  return payload
}

function buildRequest(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  args: HarnessArgs,
) {
  const readiness = getAiGraphicsToolCallReadiness(toolId)
  if (!readiness) throw new Error(`Missing readiness record for ${toolId}`)
  const capabilityId = primaryCapability(toolId, readiness.capabilities)
  const privateBase =
    `private://ai-graphics/external-agent/gpu-model-local-dev-runtime-execution-harness/${toolId}`

  return {
    workspaceId:
      'workspace_ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness',
    requestId:
      `request_ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_${toolId}`,
    toolId,
    capabilityId,
    approvedPlanSnapshotId:
      `approved_snapshot_ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_${toolId}`,
    creditReservationId:
      `credit_reservation_ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_${toolId}`,
    privateArtifactManifestRef: `${privateBase}/artifact-manifest`,
    toolRouteApprovalRef: `${privateBase}/tool-route-approval`,
    workerApprovalRef: `${privateBase}/worker-approval`,
    runtimeEnqueueApprovalRef: `${privateBase}/runtime-enqueue-approval`,
    ownerRuntimeApprovalRef: `${privateBase}/owner-runtime-approval`,
    nativeGpuRuntimeProofRef: `${privateBase}/native-gpu-runtime-proof`,
    modelWeightManifestRef: modelWeightManifestRequired(toolId)
      ? `${privateBase}/model-weight-manifest`
      : undefined,
    externalBetaPerToolRuntimeProofRef:
      `${privateBase}/external-beta-per-tool-runtime-proof`,
    traceId:
      `trace_ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_${toolId}`,
    payload: applyRuntimePayloadArgs(toolId, args),
  }
}

function skipReasonCode(result: AiGraphicsExternalAgentGpuModelControlledAdapterResult): string | null {
  const runtimeResult = result.runtimeOutput.result
  if (
    runtimeResult &&
    typeof runtimeResult === 'object' &&
    'skipReason' in runtimeResult
  ) {
    const skipReason = (runtimeResult as { skipReason?: unknown }).skipReason
    if (
      skipReason &&
      typeof skipReason === 'object' &&
      'code' in skipReason
    ) {
      const code = (skipReason as { code?: unknown }).code
      return typeof code === 'string' ? code : null
    }
  }
  return null
}

function outputJsonPathForResult(result: AiGraphicsExternalAgentGpuModelControlledAdapterResult): string | null {
  const runtimeResult = result.runtimeOutput.result
  if (
    runtimeResult &&
    typeof runtimeResult === 'object' &&
    'outputJsonPath' in runtimeResult
  ) {
    const outputPath = (runtimeResult as { outputJsonPath?: unknown }).outputJsonPath
    return typeof outputPath === 'string' ? outputPath : null
  }
  return null
}

function outputJsonSha256ForResult(result: AiGraphicsExternalAgentGpuModelControlledAdapterResult): string | null {
  const runtimeResult = result.runtimeOutput.result
  if (
    runtimeResult &&
    typeof runtimeResult === 'object' &&
    'outputJsonSha256' in runtimeResult
  ) {
    const outputSha256 = (runtimeResult as { outputJsonSha256?: unknown }).outputJsonSha256
    return typeof outputSha256 === 'string' ? outputSha256 : null
  }
  return null
}

function errorMessageForResult(result: AiGraphicsExternalAgentGpuModelControlledAdapterResult): string | null {
  const runtimeResult = result.runtimeOutput.result
  if (
    runtimeResult &&
    typeof runtimeResult === 'object' &&
    'errorMessage' in runtimeResult
  ) {
    const errorMessage = (runtimeResult as { errorMessage?: unknown }).errorMessage
    return typeof errorMessage === 'string' && errorMessage.length > 0
      ? errorMessage
      : null
  }
  return null
}

async function buildReport(args: HarnessArgs) {
  const rows = []

  for (const toolId of args.toolIds) {
    const request = buildRequest(toolId, args)
    const result = await executeAiGraphicsExternalAgentGpuModelControlledAdapter(request)
    const runtimeInputs = runtimeInputsForTool(toolId, args)
    const requirements = localInputRequirements(toolId, {
      allowCpuTensorRuntime: runtimeInputs.allowCpuTensorRuntime,
      allowCpuFoundationRuntime: runtimeInputs.allowCpuFoundationRuntime,
    })
    const reasonCode = skipReasonCode(result)
    const privateLocalRuntimeInputsAcceptedBeforeRuntime =
      reasonCode === 'gpu_model_private_inputs_accepted_runtime_proof_not_requested'
    const blockingKey = currentBlockingPrerequisiteKey(reasonCode, {
      allowCpuTensorRuntime: runtimeInputs.allowCpuTensorRuntime,
      allowCpuFoundationRuntime: runtimeInputs.allowCpuFoundationRuntime,
    })
    const minimumInputKeys = minimumPrivateRuntimeInputKeys(toolId, {
      allowCpuTensorRuntime: runtimeInputs.allowCpuTensorRuntime,
      allowCpuFoundationRuntime: runtimeInputs.allowCpuFoundationRuntime,
    })
    const remainingInputKeys =
      result.localGpuModelRuntimeExecutionPerformed
        ? []
        : blockingKey
        ? minimumInputKeys.filter((key) => key !== blockingKey)
        : minimumInputKeys
    rows.push({
      toolId,
      capabilityId: request.capabilityId,
      adapterDecision: result.decision,
      adapterStatus: result.status,
      executionState: result.executionState,
      controlledAdapterExecutableNow: result.controlledAdapterExecutableNow,
      controlledAdapterInvokedNow: result.controlledAdapterInvokedNow,
      harnessMode: args.attemptLocalRuntime
        ? 'local_dev_runtime_attempt_requested'
        : 'local_dev_prerequisite_check_only',
      localRuntimeExecutionPerformed:
        result.localGpuModelRuntimeExecutionPerformed,
      toolExecutionApprovedNow: result.toolExecutionApprovedNow,
      gpuRuntimeApprovedForScopedControlledToolCall:
        result.gpuRuntimeApprovedForScopedControlledToolCall,
      gpuRuntimeShouldStartNow: result.gpuRuntimeShouldStartNow,
      publicArtifactCreated: result.publicArtifactCreated,
      signedUrlCreated: result.signedUrlCreated,
      runtimeReadyNow: result.runtimeReadyNow,
      externalBetaReadyNow: result.externalBetaReadyNow,
      productionReadyNow: result.productionReadyNow,
      skipReasonCode: reasonCode,
      currentBlockingPrerequisiteKey: blockingKey,
      currentBlockingReasonCode: reasonCode,
      privateLocalRuntimeInputsAcceptedBeforeRuntime,
      minimumPrivateRuntimeInputKeys: minimumInputKeys,
      remainingPrivateRuntimeInputKeys: remainingInputKeys,
      allowCpuTensorRuntime: runtimeInputs.allowCpuTensorRuntime,
      allowCpuFoundationRuntime: runtimeInputs.allowCpuFoundationRuntime,
      privateInputPreflightOnly: runtimeInputs.privateInputPreflightOnly,
      errorMessage: errorMessageForResult(result),
      outputJsonPath: outputJsonPathForResult(result),
      outputJsonSha256: outputJsonSha256ForResult(result),
      localInputRequirements: requirements,
      warnings: result.warnings,
    })
  }

  const localRuntimeExecutionPerformedTools =
    rows.filter((row) => row.localRuntimeExecutionPerformed).length
  const toolExecutionApprovedNowTools =
    rows.filter((row) => row.toolExecutionApprovedNow).length
  const gpuRuntimeShouldStartNowTools =
    rows.filter((row) => row.gpuRuntimeShouldStartNow).length
  const all8GpuModelToolsCovered =
    rows.length === AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.length
  const scopedGpuModelToolSelectionActive = !all8GpuModelToolsCovered

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-gpu-model-local-dev-runtime-execution-harness',
    decision,
    status: localRuntimeExecutionPerformedTools > 0
      ? 'local_dev_runtime_executed_for_private_opt_in_subset_not_global_ready'
      : status,
    summary:
      'Exercises the real GPU/model controlled adapter in explicit local_dev mode for the eight GPU/model AI graphics tools. The committed/default record is prerequisite-check only, so it proves the guarded runtime branches and exact missing local inputs without starting GPU runtime, loading model weights, processing media, creating public artifacts, or unlocking external beta/production. Private runtime proof can be scoped with --tool so GPU/model execution starts only for the actively requested tool call.',
    sourceEvidence: {
      controlledAdapter: {
        path:
          'server/tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter.ts',
        decision:
          AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_DECISION,
      },
      controlledWorkerDispatchProof: {
        path:
          'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-controlled-worker-dispatch-proof.json',
        decision:
          'ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_proof_passed_with_runtime_blocks',
      },
      nativeGpuRuntimeProofCommandPlan: {
        path:
          'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json',
      },
      nativeGpuRuntimeProofLocalPreflight: {
        path:
          'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-local-preflight.json',
      },
    },
    interfaces: {
      packageScript:
        'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness',
      diagnosticScript:
        'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness:diagnostics',
      cli:
        'server/cli/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness-diagnostics.mjs',
      defaultCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness',
      committedRecordCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --write-records',
      privateLocalRuntimeAttemptCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool <toolId> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json <per-tool-private-input-flags>',
      korniaPrivateCpuTensorRuntimeAttemptCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool kornia --runtime-backend host_python --allow-cpu-tensor-runtime --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-kornia-cpu-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-kornia-cpu-run>/harness-result.json --source-image <private-approved-frame.png>',
      privateRuntimeInputManifestAttemptCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool <toolId> --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
      privateContainerRuntimeAttemptCommand:
        `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image ${canonicalGpuWorkerProofImage} --runtime-container-platform linux/amd64 --tool <toolId> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json <per-tool-private-input-flags>`,
      privateRuntimeAttemptCommandsByTool:
        exactRuntimeAttemptCommandsByTool({ container: false }),
      privateContainerRuntimeAttemptCommandsByTool:
        exactRuntimeAttemptCommandsByTool({ container: true }),
      privateScopedRuntimeAttemptExamples: {
        kornia:
          exactRuntimeAttemptCommand('kornia', { container: false }),
        korniaContainer:
          exactRuntimeAttemptCommand('kornia', { container: true }),
        sam2:
          exactRuntimeAttemptCommand('sam2', { container: false }),
      },
    },
    localRuntimePolicy: {
      runMode: 'explicit_local_dev_only',
      requiresApprovedPrivateInputs: true,
      requiresNativeCudaHost: true,
      onDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      noCpuFallbackForHeavyGpuModelTools: true,
      korniaCpuTensorRuntimeAllowedWhenExplicitlyRequested: true,
      korniaCpuTensorRuntimeRequiresPrivateSourceFrame: true,
      korniaCpuTensorRuntimeDoesNotStartGpu: true,
      foundationCpuRuntimeAllowedWhenExplicitlyRequested: true,
      foundationCpuRuntimeDoesNotStartGpu: true,
      noModelDownload: true,
      noProviderRuntime: true,
      noPublicArtifacts: true,
      noSignedUrls: true,
      committedRecordsMustRemainSkipSafe: true,
      hostPythonBackendSupported: true,
      dockerContainerBackendSupported: true,
      dockerContainerBackendRequiresRuntimeImage: true,
      dockerContainerBackendRequiresScopedGpuAttachment: true,
      privateInputPreflightBeforeGpuAttachment: true,
      missingPrivateInputsBlockBeforeGpuStartup: true,
      privateOutputDirectoryPreflightBeforeGpuStartup: true,
      directControlledAdapterOutputDirectoryPreflightBeforeRuntime: true,
      privateRuntimeInputPathKindPreflightBeforeGpuStartup: true,
      sourceFrameInputsMustBeFiles: true,
      fileBackedModelInputsMustBeFiles: true,
      birefnetModelInputMustBeDirectoryWithModelSafetensors: true,
      dockerContainerBackendAutoMountsPrivateRuntimePaths: true,
      dockerContainerBackendMountsRepositoryReadOnly: true,
      dockerContainerBackendMountsRuntimeScriptsReadOnly: true,
      dockerContainerBackendMountsProofOutputParentReadWrite: true,
      dockerContainerBackendMountsSourceAndModelPathsReadOnly: true,
      dockerContainerBackendMountsOutputPathsReadWrite: true,
      runtimeProofOutputValidatedBeforeCompleted: true,
      runtimeProofOutputMustDeclareOkTrue: true,
      runtimeProofOutputMustMatchExpectedToolId: true,
      runtimeProofOutputMustProveCudaOrCudaExecutionProvider: true,
      runtimeProofOutputCanSkipCudaOnlyForExplicitKorniaCpuTensorRuntime: true,
      runtimeProofOutputCanSkipCudaOnlyForExplicitFoundationCpuRuntime: true,
      runtimeProofOutputMustProveNoModelDownload: true,
      runtimeProofOutputMustProveNoProviderRuntime: true,
      runtimeProofOutputMustProveNoPublicArtifact: true,
      runtimeProofOutputMustProveNoSignedUrl: true,
      privateLocalProofResultWriteSupported: true,
      privateLocalProofResultWritePath:
        '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
      privateLocalProofResultWrittenNow: Boolean(args.resultOut),
      privateRuntimeInputManifestSupported: true,
      privateRuntimeInputManifestOutputDirectoryMustStayUnderLocalArtifacts: true,
      privateRuntimeInputManifestPath: args.runtimeInputManifestPath ?? null,
      privateRuntimeInputManifestUsedNow: Boolean(args.runtimeInputManifestPath),
      privateInputPreflightOnlySupported: true,
      privateInputPreflightOnlyUsedNow: args.privateInputPreflightOnly ||
        rows.some((row) => row.privateInputPreflightOnly === true),
      privateInputPreflightStopsBeforeDockerGpuRuntime: true,
      privateInputPreflightStopsBeforePythonRuntime: true,
    },
    counts: {
      totalAiGraphicsTools: 21,
      requestedGpuModelTools: rows.length,
      gpuModelToolsCovered: rows.length,
      localDevAdapterBranchInvokedTools:
        rows.filter((row) => row.controlledAdapterInvokedNow).length,
      localDevPrerequisiteCheckOnlyTools:
        rows.filter((row) => row.harnessMode === 'local_dev_prerequisite_check_only').length,
      localRuntimeExecutionPerformedTools,
      toolExecutionApprovedNowTools,
      gpuRuntimeApprovedForScopedControlledToolCallTools:
        rows.filter((row) => row.gpuRuntimeApprovedForScopedControlledToolCall).length,
      gpuRuntimeShouldStartNowTools,
      privateLocalRuntimeInputsAcceptedBeforeRuntimeTools:
        rows.filter((row) => row.privateLocalRuntimeInputsAcceptedBeforeRuntime).length,
      publicArtifactCreatedTools:
        rows.filter((row) => row.publicArtifactCreated).length,
      signedUrlCreatedTools:
        rows.filter((row) => row.signedUrlCreated).length,
      runtimeReadyNowTools:
        rows.filter((row) => row.runtimeReadyNow).length,
      externalBetaReadyNowTools:
        rows.filter((row) => row.externalBetaReadyNow).length,
      productionReadyNowTools:
        rows.filter((row) => row.productionReadyNow).length,
    },
    gpuModelLocalDevRuntimeExecutionHarnessRows: rows,
    booleans: {
      externalAgentGpuModelLocalDevRuntimeExecutionHarnessPrepared: true,
      scopedGpuModelToolSelectionSupported: true,
      scopedGpuModelToolSelectionActive,
      controlledAdapterSourceAccepted: true,
      controlledWorkerDispatchProofAccepted: true,
      nativeGpuRuntimeProofCommandPlanAccepted: true,
      localDevAdapterBranchInvokedForAll8: all8GpuModelToolsCovered,
      all8GpuModelToolsCovered,
      exactLocalRuntimePrerequisitesDocumented: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      committedRecordSkipSafe: !args.attemptLocalRuntime,
      privateLocalRuntimeAttemptRequested: args.attemptLocalRuntime,
      privateLocalProofResultWriteSupported: true,
      privateLocalProofResultWrittenNow: Boolean(args.resultOut),
      privateRuntimeInputManifestSupported: true,
      privateRuntimeInputManifestOutputDirectoryMustStayUnderLocalArtifacts: true,
      privateRuntimeInputManifestUsedNow: Boolean(args.runtimeInputManifestPath),
      agentCanSelectForPlanning: true,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: toolExecutionApprovedNowTools > 0,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: gpuRuntimeShouldStartNowTools > 0,
      gpuRuntimeShouldStartNow: gpuRuntimeShouldStartNowTools > 0,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      modelWeightsDownloaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    nextMilestone:
      'Run this harness on an approved native CUDA host with reviewed private model paths and private approved source inputs, then feed accepted per-tool local runtime outputs into the external-agent GPU/model runtime gate.',
  }
}

function makeMarkdown(report: Awaited<ReturnType<typeof buildReport>>): string {
  const rows = report.gpuModelLocalDevRuntimeExecutionHarnessRows
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.capabilityId}\` | \`${row.harnessMode}\` | \`${row.adapterStatus}\` | \`${row.currentBlockingPrerequisiteKey ?? 'none'}\` | \`${row.currentBlockingReasonCode ?? 'none'}\` | \`${row.remainingPrivateRuntimeInputKeys.length ? row.remainingPrivateRuntimeInputKeys.join(', ') : 'none'}\` | \`${row.errorMessage ?? 'none'}\` | ${row.localRuntimeExecutionPerformed} | ${row.toolExecutionApprovedNow} | ${row.gpuRuntimeShouldStartNow} |`
    ))
    .join('\n')

  return `# AI Graphics External Agent GPU Model Local-Dev Runtime Execution Harness

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This harness exercises the real GPU/model controlled adapter for all eight GPU/model tools in explicit \`local_dev\` mode. The committed record is prerequisite-check only: it records the guarded adapter branch and the exact private local inputs needed before runtime can start. It does not start GPU runtime, load model weights, process media, call providers, create public artifacts, create signed URLs, unlock external beta, or unlock production.

Missing private source/model/checkpoint paths block before Python runtime or Docker GPU attachment. GPU starts only after the scoped tool call supplies the required private inputs and runtime proof.

## Foundation CPU Runtime Option

\`torch_torchvision\` and \`transformers\` may use explicit CPU foundation runtime proof for bounded package import and tensor checks when \`--allow-cpu-foundation-runtime\` is supplied. This does not download models, run inference, process media, or start GPU runtime.

- \`torch_torchvision\`: \`${report.interfaces.privateRuntimeAttemptCommandsByTool.torch_torchvision}\`
- \`transformers\`: \`${report.interfaces.privateRuntimeAttemptCommandsByTool.transformers}\`
- \`foundationCpuRuntimeAllowedWhenExplicitlyRequested\`: ${report.localRuntimePolicy.foundationCpuRuntimeAllowedWhenExplicitlyRequested}
- \`foundationCpuRuntimeDoesNotStartGpu\`: ${report.localRuntimePolicy.foundationCpuRuntimeDoesNotStartGpu}

## Tool rows

| Tool | Capability | Harness mode | Adapter status | Current blocker | Blocking reason | Remaining private inputs | Error message | Local runtime executed | Tool execution approved | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Runtime proof output contract

- \`runtimeProofOutputValidatedBeforeCompleted\`: ${report.localRuntimePolicy.runtimeProofOutputValidatedBeforeCompleted}
- \`runtimeProofOutputMustDeclareOkTrue\`: ${report.localRuntimePolicy.runtimeProofOutputMustDeclareOkTrue}
- \`runtimeProofOutputMustMatchExpectedToolId\`: ${report.localRuntimePolicy.runtimeProofOutputMustMatchExpectedToolId}
- \`runtimeProofOutputMustProveCudaOrCudaExecutionProvider\`: ${report.localRuntimePolicy.runtimeProofOutputMustProveCudaOrCudaExecutionProvider}
- \`runtimeProofOutputCanSkipCudaOnlyForExplicitKorniaCpuTensorRuntime\`: ${report.localRuntimePolicy.runtimeProofOutputCanSkipCudaOnlyForExplicitKorniaCpuTensorRuntime}
- \`runtimeProofOutputCanSkipCudaOnlyForExplicitFoundationCpuRuntime\`: ${report.localRuntimePolicy.runtimeProofOutputCanSkipCudaOnlyForExplicitFoundationCpuRuntime}
- \`runtimeProofOutputMustProveNoModelDownload\`: ${report.localRuntimePolicy.runtimeProofOutputMustProveNoModelDownload}
- \`runtimeProofOutputMustProveNoProviderRuntime\`: ${report.localRuntimePolicy.runtimeProofOutputMustProveNoProviderRuntime}
- \`runtimeProofOutputMustProveNoPublicArtifact\`: ${report.localRuntimePolicy.runtimeProofOutputMustProveNoPublicArtifact}
- \`runtimeProofOutputMustProveNoSignedUrl\`: ${report.localRuntimePolicy.runtimeProofOutputMustProveNoSignedUrl}

## Private runtime attempt command

\`${report.interfaces.privateLocalRuntimeAttemptCommand}\`

## Private runtime input manifest command

\`${report.interfaces.privateRuntimeInputManifestAttemptCommand}\`

## Next milestone

${report.nextMilestone}
`
}

async function main() {
  const args = parseArgs()
  const report = await buildReport(args)
  if (args.resultOut) {
    fs.mkdirSync(path.dirname(args.resultOut), { recursive: true })
    fs.writeFileSync(args.resultOut, `${JSON.stringify(report, null, 2)}\n`)
  }
  if (args.writeRecords) {
    fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true })
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
