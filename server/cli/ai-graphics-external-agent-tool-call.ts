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
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

const decision = 'ai_graphics_external_agent_single_tool_call_ready'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-single-tool-call.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-single-tool-call.md'
const canonicalGpuModelRuntimeContainerImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const gpuModelPrivateInputPreflightAcceptedBlockingReason =
  'gpu_model_private_inputs_accepted_runtime_proof_not_requested'
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
type RuntimeInputManifest = Record<string, unknown>

const runtimeInputManifestStringFields = new Set([
  'outputDirectory',
  'sourceImageLocalPath',
  'sam2CheckpointLocalPath',
  'birefnetModelLocalPath',
  'realEsrganModelLocalPath',
  'rembgModelLocalPath',
  'transparentBackgroundCheckpointLocalPath',
  'modelWeightManifestId',
  'modelWeightChecksumSha256',
  'modelWeightChecksumEvidenceRef',
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

function runtimeInputManifestPath(): string | undefined {
  const value = stringArg('--runtime-input-manifest')
  if (!value) return undefined
  assert(
    isLocalArtifactPath(value),
    '--runtime-input-manifest must stay under .local-artifacts/',
  )
  return value
}

function readRuntimeInputManifest(
  filePath: string | undefined,
): RuntimeInputManifest | undefined {
  if (!filePath) return undefined
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown
  assert(
    parsed && typeof parsed === 'object' && !Array.isArray(parsed),
    '--runtime-input-manifest must be a JSON object',
  )
  const manifest = parsed as RuntimeInputManifest
  validateRuntimeInputManifest(manifest)
  return manifest
}

function validateRuntimeInputManifest(manifest: RuntimeInputManifest): void {
  const hasToolInputs = Object.prototype.hasOwnProperty.call(manifest, 'toolInputs')
  const hasTools = Object.prototype.hasOwnProperty.call(manifest, 'tools')
  assert(
    !(hasToolInputs && hasTools),
    'runtime input manifest must use either toolInputs or tools, not both',
  )
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
  assert(
    value && typeof value === 'object' && !Array.isArray(value),
    `runtime input manifest field ${key} must be an object`,
  )
  for (const [toolId, record] of Object.entries(value as Record<string, unknown>)) {
    assert(
      supportedRuntimeInputManifestTools.has(toolId),
      `runtime input manifest references unsupported tool id ${toolId}`,
    )
    assert(
      record && typeof record === 'object' && !Array.isArray(record),
      `runtime input manifest tool record ${toolId} must be an object`,
    )
    for (const [field, fieldValue] of Object.entries(record as Record<string, unknown>)) {
      assert(
        runtimeInputManifestToolRecordFields.has(field),
        `runtime input manifest tool record ${toolId} contains unsupported field ${field}`,
      )
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

function safeManifestString(key: string, value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  assert(
    typeof value === 'string' && value.length > 0,
    `runtime input manifest field ${key} must be a non-empty string`,
  )
  if (key === 'modelWeightManifestId') {
    assert(
      !/^[a-z][a-z0-9+.-]*:\/\//i.test(value) &&
        !value.includes('/') &&
        !value.includes('\\') &&
        !value.includes('\0') &&
        !value.split(/[\\/]+/).includes('..'),
      `runtime input manifest field ${key} must be a reviewed private manifest id`,
    )
    return value
  }
  if (key === 'modelWeightChecksumSha256') {
    assert(
      /^[a-f0-9]{64}$/i.test(value),
      `runtime input manifest field ${key} must be a 64-character SHA-256 hex digest`,
    )
    return value
  }
  if (key === 'modelWeightChecksumEvidenceRef') {
    assert(
      value.startsWith('private://') &&
        !/^https?:\/\//i.test(value) &&
        !value.startsWith('public://') &&
        !value.includes('\0') &&
        !value.split(/[\\/]+/).includes('..'),
      `runtime input manifest field ${key} must be a reviewed private:// checksum evidence ref`,
    )
    return value
  }
  assertNoSignedUrlOrRawUrl(value, key)
  assertNoPathTraversal(value, key)
  assert(
    !(runtimeInputManifestPathFields.has(key) && /^[a-z][a-z0-9+.-]*:\/\//i.test(value)),
    `runtime input manifest field ${key} must be a private local path`,
  )
  return value
}

function safeManifestBoolean(key: string, value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined
  assert(
    typeof value === 'boolean',
    `runtime input manifest field ${key} must be a boolean`,
  )
  return value
}

function manifestStringForTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  manifest: RuntimeInputManifest | undefined,
  key: string,
): string | undefined {
  const toolRecord = manifestToolRecord(toolId, manifest)
  return safeManifestString(key, toolRecord[key] ?? manifest?.[key])
}

function manifestBooleanForTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  manifest: RuntimeInputManifest | undefined,
  key: string,
): boolean | undefined {
  const toolRecord = manifestToolRecord(toolId, manifest)
  return safeManifestBoolean(key, toolRecord[key] ?? manifest?.[key])
}

function ensureParentDirectory(filePath: string): void {
  const parent = path.dirname(filePath)
  if (parent && parent !== '.') fs.mkdirSync(parent, { recursive: true })
}

function assertPrivateLocalInputPath(label: string, value: string | undefined): void {
  if (!value) return
  assertNoSignedUrlOrRawUrl(value, label)
  assertNoPathTraversal(value, label)
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

function gpuModelAllowsCpuFoundationRuntime(toolId: string): boolean {
  return toolId === 'torch_torchvision' || toolId === 'transformers'
}

function gpuModelAllowsCpuTensorRuntime(toolId: string): boolean {
  return toolId === 'kornia'
}

function gpuModelRequiredPrivateInputKeys(toolId: string): string[] {
  const keys = [
    'outputDirectory',
    gpuModelAllowsCpuTensorRuntime(toolId)
      ? 'pythonCpuTensorRuntime'
      : gpuModelAllowsCpuFoundationRuntime(toolId)
      ? 'pythonCpuFoundationRuntime'
      : 'nativeCudaRuntime',
  ]
  if (gpuModelSourceImageRequired(toolId)) keys.push('sourceImageLocalPath')
  if (toolId === 'sam2') keys.push('sam2CheckpointLocalPath')
  if (toolId === 'birefnet') keys.push('birefnetModelLocalPath')
  if (toolId === 'real_esrgan') keys.push('realEsrganModelLocalPath')
  if (toolId === 'rembg') keys.push('rembgModelLocalPath')
  if (toolId === 'transparent_background') {
    keys.push('transparentBackgroundCheckpointLocalPath')
  }
  if (
    ['sam2', 'birefnet', 'real_esrgan', 'rembg', 'transparent_background']
      .includes(toolId)
  ) {
    keys.push('modelWeightManifestEvidence')
  }
  return keys
}

function gpuModelCurrentBlockingPrerequisiteKey(
  toolId: string,
  blockingReasonCode: string | null | undefined,
): string | null {
  if (!blockingReasonCode) return null
  if (blockingReasonCode === gpuModelPrivateInputPreflightAcceptedBlockingReason) {
    return gpuModelAllowsCpuTensorRuntime(toolId)
      ? 'pythonCpuTensorRuntime'
      : gpuModelAllowsCpuFoundationRuntime(toolId)
      ? 'pythonCpuFoundationRuntime'
      : 'nativeCudaRuntime'
  }
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
    blockingReasonCode.includes('_model_weight_manifest_evidence_missing') ||
    blockingReasonCode.includes('_model_weight_checksum_invalid') ||
    blockingReasonCode.includes('_model_weight_checksum_evidence_ref_invalid')
  ) {
    return 'modelWeightManifestEvidence'
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
    if (gpuModelAllowsCpuTensorRuntime(toolId)) return 'pythonCpuTensorRuntime'
    if (gpuModelAllowsCpuFoundationRuntime(toolId)) return 'pythonCpuFoundationRuntime'
    return 'pythonPackageRuntime'
  }
  if (blockingReasonCode.includes('python_runtime')) {
    if (gpuModelAllowsCpuTensorRuntime(toolId)) return 'pythonCpuTensorRuntime'
    if (gpuModelAllowsCpuFoundationRuntime(toolId)) return 'pythonCpuFoundationRuntime'
    return 'pythonRuntime'
  }
  if (blockingReasonCode.includes('disabled_or_not_local_dev')) {
    return 'attemptGpuRuntime'
  }
  return null
}

function gpuModelPrivateInputPlaceholders(toolId: string): string[] {
  const placeholders: string[] = []
  if (gpuModelSourceImageRequired(toolId)) {
    placeholders.push('--source-image <private-approved-frame.png>')
  }
  if (toolId === 'sam2') placeholders.push('--sam2-checkpoint <private-sam2-checkpoint.pt>')
  if (toolId === 'birefnet') placeholders.push('--birefnet-model <private-birefnet-model>')
  if (toolId === 'real_esrgan') {
    placeholders.push('--real-esrgan-model <private-real-esrgan-model.pth>')
  }
  if (toolId === 'rembg') placeholders.push('--rembg-model <private-rembg-model.onnx>')
  if (toolId === 'transparent_background') {
    placeholders.push('--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>')
  }
  return placeholders
}

function gpuModelBlockedPrerequisites(toolId: string): string[] {
  const prerequisites = [
    gpuModelAllowsCpuTensorRuntime(toolId)
      ? 'approved local Python CPU tensor runtime with torch, PIL, numpy, and kornia'
      : gpuModelAllowsCpuFoundationRuntime(toolId)
      ? 'approved local Python CPU foundation runtime with torch and package-specific imports'
      : 'approved native CUDA-capable host or approved linux/amd64 Docker GPU runtime',
    'proof-local GPU worker container image built locally',
    'private output directory under .local-artifacts/',
    'no public artifact, signed URL, provider call, model download, beta unlock, or production unlock',
  ]
  if (gpuModelSourceImageRequired(toolId)) {
    prerequisites.push('private approved source image/frame on local disk')
  }
  if (toolId === 'sam2') prerequisites.push('private SAM2 checkpoint path')
  if (toolId === 'birefnet') prerequisites.push('private BiRefNet model path')
  if (toolId === 'real_esrgan') prerequisites.push('private Real-ESRGAN model path')
  if (toolId === 'rembg') prerequisites.push('private rembg model path')
  if (toolId === 'transparent_background') {
    prerequisites.push('private transparent-background checkpoint path')
  }
  return prerequisites
}

function gpuModelHostPreflightCommand(): string {
  return 'npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host'
}

function gpuModelContainerBuildCommand(): string {
  return [
    'docker buildx build',
    '--platform linux/amd64',
    '--target ai_graphics_install_proof',
    '-f docker/prod/gpu-worker/Dockerfile',
    `-t ${canonicalGpuModelRuntimeContainerImage}`,
    '.',
  ].join(' ')
}

function gpuModelScopedToolCallCommand(toolId: string): string {
  const preferredCpuRuntimeFlag = gpuModelAllowsCpuTensorRuntime(toolId)
    ? '--allow-cpu-tensor-runtime'
    : gpuModelAllowsCpuFoundationRuntime(toolId)
    ? '--allow-cpu-foundation-runtime'
    : ''
  const cpuRuntimePreferred = preferredCpuRuntimeFlag.length > 0
  return [
    'npm run --silent ai-graphics:external-agent-tool-call --',
    `--tool ${toolId}`,
    '--attempt-gpu-runtime',
    cpuRuntimePreferred ? '--runtime-backend host_python' : '--runtime-backend docker_container',
    ...(cpuRuntimePreferred
      ? []
      : [
          `--runtime-container-image ${canonicalGpuModelRuntimeContainerImage}`,
          '--runtime-container-platform linux/amd64',
        ]),
    `--gpu-output-dir .local-artifacts/ai-graphics/external-agent-single-tool-call/<private-run>/${toolId}`,
    ...gpuModelPrivateInputPlaceholders(toolId),
    preferredCpuRuntimeFlag,
    '--expect-state executable',
    '--require-output-hash',
    '--require-private-only-boundary',
    '--strict-exit-code',
  ].join(' ')
}

function gpuModelScopedToolCallManifestCommand(toolId: string): string {
  const preferredCpuRuntimeFlag = gpuModelAllowsCpuTensorRuntime(toolId)
    ? '--allow-cpu-tensor-runtime'
    : gpuModelAllowsCpuFoundationRuntime(toolId)
    ? '--allow-cpu-foundation-runtime'
    : ''
  const cpuRuntimePreferred = preferredCpuRuntimeFlag.length > 0
  return [
    'npm run --silent ai-graphics:external-agent-tool-call --',
    `--tool ${toolId}`,
    '--attempt-gpu-runtime',
    cpuRuntimePreferred ? '--runtime-backend host_python' : '--runtime-backend docker_container',
    ...(cpuRuntimePreferred
      ? []
      : [
          `--runtime-container-image ${canonicalGpuModelRuntimeContainerImage}`,
          '--runtime-container-platform linux/amd64',
        ]),
    `--gpu-output-dir .local-artifacts/ai-graphics/external-agent-single-tool-call/<private-run>/${toolId}`,
    '--runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json',
    preferredCpuRuntimeFlag,
    '--expect-state executable',
    '--require-output-hash',
    '--require-private-only-boundary',
    '--strict-exit-code',
  ].join(' ')
}

function gpuRuntimePayload(toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId) {
  const attemptGpuRuntime = hasFlag('--attempt-gpu-runtime')
  const manifestPath = runtimeInputManifestPath()
  assert(
    !manifestPath || attemptGpuRuntime,
    '--runtime-input-manifest requires --attempt-gpu-runtime',
  )
  const manifest = readRuntimeInputManifest(manifestPath)
  const privateInputPreflightOnly =
    hasFlag('--private-input-preflight-only') ||
    manifestBooleanForTool(toolId, manifest, 'privateInputPreflightOnly') === true ||
    manifestBooleanForTool(toolId, manifest, 'localRuntimeInputPreflightOnly') === true
  const allowCpuTensorRuntime =
    toolId === 'kornia' &&
    (
      hasFlag('--allow-cpu-tensor-runtime') ||
      manifestBooleanForTool(toolId, manifest, 'allowCpuTensorRuntime') === true
    )
  const allowCpuFoundationRuntime =
    (toolId === 'torch_torchvision' || toolId === 'transformers') &&
    (
      hasFlag('--allow-cpu-foundation-runtime') ||
      manifestBooleanForTool(toolId, manifest, 'allowCpuFoundationRuntime') === true
    )
  const outputDirectory =
    stringArg('--gpu-output-dir') ??
    manifestStringForTool(toolId, manifest, 'outputDirectory')
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
    runtimeInputManifestUsed: Boolean(manifestPath),
    privateInputPreflightOnly,
  }

  if (!attemptGpuRuntime) return payload

  const sourceImageLocalPath =
    stringArg('--source-image') ??
    manifestStringForTool(toolId, manifest, 'sourceImageLocalPath')
  assertPrivateLocalInputPath('sourceImageLocalPath', sourceImageLocalPath)
  const runtimeBackend = stringArg('--runtime-backend') === 'host_python'
    ? 'host_python'
    : 'docker_container'
  payload.mode = 'local_dev'
  if (allowCpuTensorRuntime) {
    payload.allowCpuTensorRuntime = true
  }
  if (allowCpuFoundationRuntime) {
    payload.allowCpuFoundationRuntime = true
  }
  payload.runtimeExecutionBackend = runtimeBackend
  payload.outputDirectory = outputDirectory
  payload.timeoutMs = Number(stringArg('--timeout-ms') ?? '30000')
  if (runtimeBackend === 'docker_container') {
    payload.runtimeContainerGpu =
      allowCpuTensorRuntime || allowCpuFoundationRuntime
        ? false
        : !hasFlag('--no-runtime-container-gpu')
    payload.runtimeContainerImage =
      stringArg('--runtime-container-image') ??
      canonicalGpuModelRuntimeContainerImage
    payload.runtimeContainerPlatform =
      stringArg('--runtime-container-platform') ?? 'linux/amd64'
  }
  if (privateInputPreflightOnly) {
    payload.localRuntimeInputPreflightOnly = true
  }
  if (sourceImageLocalPath) {
    payload.sourceImageLocalPath = sourceImageLocalPath
    payload.representativeFrameLocalPath = sourceImageLocalPath
  }
  const sam2CheckpointLocalPath =
    stringArg('--sam2-checkpoint') ??
    manifestStringForTool(toolId, manifest, 'sam2CheckpointLocalPath')
  const birefnetModelLocalPath =
    stringArg('--birefnet-model') ??
    manifestStringForTool(toolId, manifest, 'birefnetModelLocalPath')
  const realEsrganModelLocalPath =
    stringArg('--real-esrgan-model') ??
    manifestStringForTool(toolId, manifest, 'realEsrganModelLocalPath')
  const rembgModelLocalPath =
    stringArg('--rembg-model') ??
    manifestStringForTool(toolId, manifest, 'rembgModelLocalPath')
  const transparentBackgroundCheckpointLocalPath =
    stringArg('--transparent-background-checkpoint') ??
    manifestStringForTool(
      toolId,
      manifest,
      'transparentBackgroundCheckpointLocalPath',
    )
  const modelWeightManifestId =
    manifestStringForTool(toolId, manifest, 'modelWeightManifestId')
  const modelWeightChecksumSha256 =
    manifestStringForTool(toolId, manifest, 'modelWeightChecksumSha256')
  const modelWeightChecksumEvidenceRef =
    manifestStringForTool(toolId, manifest, 'modelWeightChecksumEvidenceRef')
  assertPrivateLocalInputPath('sam2CheckpointLocalPath', sam2CheckpointLocalPath)
  assertPrivateLocalInputPath('birefnetModelLocalPath', birefnetModelLocalPath)
  assertPrivateLocalInputPath('realEsrganModelLocalPath', realEsrganModelLocalPath)
  assertPrivateLocalInputPath('rembgModelLocalPath', rembgModelLocalPath)
  assertPrivateLocalInputPath(
    'transparentBackgroundCheckpointLocalPath',
    transparentBackgroundCheckpointLocalPath,
  )
  if (toolId === 'sam2') payload.sam2CheckpointLocalPath = sam2CheckpointLocalPath
  if (toolId === 'birefnet') payload.birefnetModelLocalPath = birefnetModelLocalPath
  if (toolId === 'real_esrgan') payload.realEsrganModelLocalPath = realEsrganModelLocalPath
  if (toolId === 'rembg') payload.rembgModelLocalPath = rembgModelLocalPath
  if (toolId === 'transparent_background') {
    payload.transparentBackgroundCheckpointLocalPath =
      transparentBackgroundCheckpointLocalPath
  }
  if (modelWeightManifestId) payload.modelWeightManifestId = modelWeightManifestId
  if (modelWeightChecksumSha256) {
    payload.modelWeightChecksumSha256 = modelWeightChecksumSha256
  }
  if (modelWeightChecksumEvidenceRef) {
    payload.modelWeightChecksumEvidenceRef = modelWeightChecksumEvidenceRef
  }

  if (gpuModelSourceImageRequired(toolId) && !sourceImageLocalPath) {
    payload.expectedBlockingReason = `${toolId}_source_frame_missing`
  }

  return payload
}

function unsafeRoutePayloadTestKind(): string | undefined {
  return stringArg('--unsafe-route-payload-test')
}

function unsafeRoutePayloadForGpuModelTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  kind: string,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    externalAgentSingleToolCall: true,
    privateOutputOnly: true,
    mode: 'local_dev',
    enableGpuModelControlledExecution: true,
    gpuRuntimeOnDemandOnly: true,
    noIdleGpuRuntimeApproved: true,
    runtimeExecutionBackend: 'docker_container',
    runtimeContainerGpu: true,
    runtimeContainerImage: canonicalGpuModelRuntimeContainerImage,
    runtimeContainerPlatform: 'linux/amd64',
    outputDirectory:
      '.local-artifacts/ai-graphics/external-agent-single-tool-call-diagnostic/unsafe-route-payload',
    sourceImageLocalPath: '/tmp/reeditpro-missing-private-approved-frame.png',
    representativeFrameLocalPath:
      '/tmp/reeditpro-missing-private-approved-frame.png',
    publicArtifactCreated: false,
    signedUrlCreated: false,
    providerRuntimePerformed: false,
    modelWeightsDownloaded: false,
    toolExecutionPerformed: false,
    gpuRuntimeShouldStartNow: false,
  }

  if (toolId === 'sam2') base.sam2CheckpointLocalPath = '/tmp/private-sam2-checkpoint.pt'
  if (toolId === 'birefnet') base.birefnetModelLocalPath = '/tmp/private-birefnet-model'
  if (toolId === 'real_esrgan') base.realEsrganModelLocalPath = '/tmp/private-real-esrgan-model.pth'
  if (toolId === 'rembg') base.rembgModelLocalPath = '/tmp/private-rembg-model.onnx'
  if (toolId === 'transparent_background') {
    base.transparentBackgroundCheckpointLocalPath =
      '/tmp/private-transparent-background-checkpoint.pth'
  }

  if (kind === 'raw_url_source_image') {
    return {
      ...base,
      sourceImageLocalPath: 'https://example.com/private-frame.png',
      representativeFrameLocalPath: 'https://example.com/private-frame.png',
    }
  }
  if (kind === 'path_traversal_checkpoint') {
    return {
      ...base,
      sam2CheckpointLocalPath: '../private-sam2-checkpoint.pt',
    }
  }
  if (kind === 'unsafe_output_directory') {
    return {
      ...base,
      outputDirectory: '/tmp/reeditpro-external-agent-gpu-output',
    }
  }
  if (kind === 'public_artifact_claim') {
    return {
      ...base,
      publicArtifactCreated: true,
    }
  }

  throw new Error(`Unsupported --unsafe-route-payload-test value: ${kind}`)
}

function nextActionForReport(input: {
  toolId: string
  group: ToolGroup
  executable: boolean
  blockedWithReason: boolean
  failedWithDiagnostics: boolean
  blockingReasonCode?: string | null
  normalizedCurrentBlockingPrerequisiteKey?: string | null
  normalizedRemainingPrivateInputKeys?: string[]
}) {
  if (input.executable) {
    return {
      status: 'none_required_tool_executed',
      requiredPrivateInputKeys: [],
      blockedRuntimePrerequisites: [],
      currentBlockingPrerequisiteKey: null,
      currentBlockingReasonCode: null,
      remainingPrivateInputKeys: [],
      nextExactGpuHostPreflightCommand: null,
      nextExactGpuContainerBuildCommand: null,
      nextExactScopedToolCallCommand: null,
      nextExactScopedToolCallManifestCommand: null,
      gpuRuntimeStartPolicy: 'gpu_runtime_not_started_for_completed_non_gpu_or_successful_scoped_call',
    }
  }
  if (input.group === 'gpu_model' && input.blockedWithReason) {
    const requiredPrivateInputKeys = gpuModelRequiredPrivateInputKeys(input.toolId)
    const currentBlockingPrerequisiteKey =
      input.normalizedCurrentBlockingPrerequisiteKey ??
      gpuModelCurrentBlockingPrerequisiteKey(
        input.toolId,
        input.blockingReasonCode,
      )
    return {
      status: 'blocked_until_scoped_private_gpu_runtime_proof',
      requiredPrivateInputKeys,
      blockedRuntimePrerequisites: gpuModelBlockedPrerequisites(input.toolId),
      currentBlockingPrerequisiteKey,
      currentBlockingReasonCode: input.blockingReasonCode ?? null,
      remainingPrivateInputKeys:
        input.normalizedRemainingPrivateInputKeys ??
        (currentBlockingPrerequisiteKey
          ? requiredPrivateInputKeys.filter((key) => key !== currentBlockingPrerequisiteKey)
          : requiredPrivateInputKeys),
      nextExactGpuHostPreflightCommand: gpuModelHostPreflightCommand(),
      nextExactGpuContainerBuildCommand: gpuModelContainerBuildCommand(),
      nextExactScopedToolCallCommand: gpuModelScopedToolCallCommand(input.toolId),
      nextExactScopedToolCallManifestCommand:
        gpuModelScopedToolCallManifestCommand(input.toolId),
      gpuRuntimeStartPolicy: 'on_demand_only_for_scoped_active_tool_call',
    }
  }
  if (input.failedWithDiagnostics) {
    return {
      status: 'inspect_failure_diagnostics_before_retry',
      requiredPrivateInputKeys: [],
      blockedRuntimePrerequisites: [],
      currentBlockingPrerequisiteKey: null,
      currentBlockingReasonCode: input.blockingReasonCode ?? null,
      remainingPrivateInputKeys: [],
      nextExactGpuHostPreflightCommand: null,
      nextExactGpuContainerBuildCommand: null,
      nextExactScopedToolCallCommand: null,
      nextExactScopedToolCallManifestCommand: null,
      gpuRuntimeStartPolicy: 'do_not_start_gpu_for_failed_request',
    }
  }
  return {
    status: 'unknown_result_requires_route_diagnostic',
    requiredPrivateInputKeys: [],
    blockedRuntimePrerequisites: [],
    currentBlockingPrerequisiteKey: null,
    currentBlockingReasonCode: input.blockingReasonCode ?? null,
    remainingPrivateInputKeys: [],
    nextExactGpuHostPreflightCommand: null,
    nextExactGpuContainerBuildCommand: null,
    nextExactScopedToolCallCommand: null,
    nextExactScopedToolCallManifestCommand: null,
    gpuRuntimeStartPolicy: 'do_not_start_gpu_for_unknown_result',
  }
}

function requestForTool(): AiGraphicsExternalBetaToolCallRequest {
  const toolId = stringArg('--tool') ?? 'd3'
  const capabilityIdOverride = capabilityArg()
  const source = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
    .find((item) => item.request.toolId === toolId)
  assert(source, `Unsupported AI graphics tool id: ${toolId}`)

  const group = groupForTool(toolId)
  const unsafePayloadKind = unsafeRoutePayloadTestKind()
  assert(
    !unsafePayloadKind || (group === 'gpu_model' && isGpuModelTool(toolId)),
    '--unsafe-route-payload-test is supported only for GPU/model tools',
  )
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
      ? unsafePayloadKind
        ? unsafeRoutePayloadForGpuModelTool(toolId, unsafePayloadKind)
        : gpuRuntimePayload(toolId)
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function outputSummaryFromAdapterResult(
  adapterResult: Record<string, unknown>,
): {
  outputKind: string | null
  outputSha256: string | null
  outputJsonPath: string | null
  outputSource: string | null
} {
  const staticOutput = asRecord(adapterResult.output)
  const staticOutputSha256 = stringValue(staticOutput.privateArtifactSha256)
  if (staticOutputSha256) {
    return {
      outputKind: stringValue(staticOutput.outputKind),
      outputSha256: staticOutputSha256,
      outputJsonPath: null,
      outputSource: 'controlled_adapter_private_artifact',
    }
  }

  const runtimeOutput = asRecord(adapterResult.runtimeOutput)
  const runtimeResult = asRecord(runtimeOutput.result)
  const runtimeOutputSha256 = stringValue(runtimeResult.outputJsonSha256)
  if (runtimeOutputSha256) {
    return {
      outputKind: 'gpu_model_private_runtime_output',
      outputSha256: runtimeOutputSha256,
      outputJsonPath: stringValue(runtimeResult.outputJsonPath),
      outputSource: 'gpu_model_controlled_adapter_runtime_output',
    }
  }

  return {
    outputKind: stringValue(staticOutput.outputKind),
    outputSha256: null,
    outputJsonPath: stringValue(runtimeResult.outputJsonPath),
    outputSource: null,
  }
}

async function buildReport() {
  const request = requestForTool()
  const group = groupForTool(request.toolId)
  const response = await withServer((baseUrl) => postToolCall(baseUrl, request))
  const data = response.body?.data ?? {}
  const normalized = data.externalAgentToolCallResult ?? null
  const adapterResult = data.adapterResult ?? data.controlledAdapterResult ?? {}
  const booleans = data.booleans ?? {}
  const outputSummary = outputSummaryFromAdapterResult(asRecord(adapterResult))
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
      runtimeInputManifest: runtimeInputManifestPath() ?? null,
      runtimeInputManifestUsed: Boolean(runtimeInputManifestPath()),
      privateInputPreflightOnlyRequested: hasFlag('--private-input-preflight-only'),
      allowCpuTensorRuntimeRequested: hasFlag('--allow-cpu-tensor-runtime'),
      allowCpuFoundationRuntimeRequested: hasFlag('--allow-cpu-foundation-runtime'),
      unsafeRoutePayloadTest: unsafeRoutePayloadTestKind() ?? null,
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
      outputKind: outputSummary.outputKind,
      outputSha256: outputSummary.outputSha256,
      outputJsonPath: outputSummary.outputJsonPath,
      outputSource: outputSummary.outputSource,
    },
    nextAction: nextActionForReport({
      toolId: request.toolId,
      group,
      executable,
      blockedWithReason,
      failedWithDiagnostics,
      blockingReasonCode: data.blockingReasonCode ?? null,
      normalizedCurrentBlockingPrerequisiteKey:
        normalized?.currentBlockingPrerequisiteKey ?? null,
      normalizedRemainingPrivateInputKeys:
        Array.isArray(normalized?.remainingPrivateInputKeys)
          ? normalized.remainingPrivateInputKeys
          : undefined,
    }),
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
- \`outputJsonPath\`: \`${report.response.outputJsonPath}\`
- \`outputSource\`: \`${report.response.outputSource}\`

## Next Action

- \`status\`: \`${report.nextAction.status}\`
- \`requiredPrivateInputKeys\`: \`${report.nextAction.requiredPrivateInputKeys.join(', ') || 'none'}\`
- \`blockedRuntimePrerequisites\`: \`${report.nextAction.blockedRuntimePrerequisites.join(' | ') || 'none'}\`
- \`currentBlockingPrerequisiteKey\`: \`${report.nextAction.currentBlockingPrerequisiteKey}\`
- \`currentBlockingReasonCode\`: \`${report.nextAction.currentBlockingReasonCode}\`
- \`remainingPrivateInputKeys\`: \`${report.nextAction.remainingPrivateInputKeys.join(', ') || 'none'}\`
- \`nextExactGpuHostPreflightCommand\`: \`${report.nextAction.nextExactGpuHostPreflightCommand}\`
- \`nextExactGpuContainerBuildCommand\`: \`${report.nextAction.nextExactGpuContainerBuildCommand}\`
- \`nextExactScopedToolCallCommand\`: \`${report.nextAction.nextExactScopedToolCallCommand}\`
- \`nextExactScopedToolCallManifestCommand\`: \`${report.nextAction.nextExactScopedToolCallManifestCommand}\`
- \`gpuRuntimeStartPolicy\`: \`${report.nextAction.gpuRuntimeStartPolicy}\`

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
