import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
  type AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
} from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision =
  'ai_graphics_external_agent_gpu_model_private_proof_sequence_prepared_with_runtime_blocks'
const defaultStatus =
  'gpu_model_private_proof_sequence_ready_kornia_first_blocked_until_scoped_private_runtime_proof'
const privateProofStatus =
  'gpu_model_private_proof_sequence_accepted_scoped_private_runtime_proof'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-private-proof-sequence.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-private-proof-sequence.md'
const canonicalGpuWorkerProofImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const harnessScript =
  'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness'
const bridgeScript =
  'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge'
const readinessScript =
  'ai-graphics:external-agent-execution-readiness'
const hostPreflightScript =
  'ai-graphics:gpu-runtime-proof-local-preflight'
const externalAgentToolCallScript =
  'ai-graphics:external-agent-tool-call'
const gpuModelRuntimeContainerTargets: Record<
  AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  { image: string; dockerfile: string; target: string }
> = {
  torch_torchvision: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  transformers: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  sam2: {
    image: 'reeditpro/ai-graphics-sam2-runtime:proof-local',
    dockerfile: 'docker/prod/sam2-runtime/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  birefnet: {
    image: 'reeditpro/ai-graphics-birefnet-runtime:proof-local',
    dockerfile: 'docker/prod/birefnet-runtime/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  real_esrgan: {
    image: 'reeditpro/ai-graphics-real-esrgan-runtime:proof-local',
    dockerfile: 'docker/prod/real-esrgan-runtime/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  kornia: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  rembg: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  transparent_background: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
}

type JsonRecord = Record<string, any>

type SequenceArgs = {
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId
  attemptLocalRuntime: boolean
  writeRecords: boolean
  detectHost: boolean
  requireHostEligible: boolean
  requireAcceptedProof: boolean
  outputDirectory?: string
  resolvedOutputDirectory?: string
  resultOut?: string
  runtimeInputManifestPath?: string
  runtimeInputManifest?: RuntimeInputManifest
  runtimeBackend?: 'host_python' | 'docker_container'
  runtimeContainerImage?: string
  runtimeContainerPlatform?: string
  allowCpuTensorRuntime: boolean
  allowCpuFoundationRuntime: boolean
  allowCpuModelRuntime: boolean
  sourceImageLocalPath?: string
  sam2CheckpointLocalPath?: string
  birefnetModelLocalPath?: string
  realEsrganModelLocalPath?: string
  rembgModelLocalPath?: string
  transparentBackgroundCheckpointLocalPath?: string
  transparentBackgroundMode?: string
  timeoutMs?: string
}

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
  'transparentBackgroundMode',
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
  'allowCpuModelRuntime',
  'privateInputPreflightOnly',
  'localRuntimeInputPreflightOnly',
])

const runtimeInputManifestToolRecordFields = new Set([
  ...runtimeInputManifestStringFields,
  ...runtimeInputManifestBooleanFields,
])
const transparentBackgroundModes = new Set(['base', 'fast', 'base-nightly'])

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

function isGpuModelTool(
  toolId: string,
): toolId is AiGraphicsExternalAgentGpuModelControlledAdapterToolId {
  return AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.includes(
    toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  )
}

function gpuModelRuntimeContainerTarget(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): { image: string; dockerfile: string; target: string } {
  return gpuModelRuntimeContainerTargets[toolId]
}

function gpuModelRuntimeContainerImage(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): string {
  return gpuModelRuntimeContainerTarget(toolId).image
}

function gpuModelRuntimeContainerBuildCommand(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): string {
  const target = gpuModelRuntimeContainerTarget(toolId)
  return [
    'docker buildx build --platform linux/amd64',
    `--target ${target.target}`,
    `-f ${target.dockerfile}`,
    `-t ${target.image}`,
    '.',
  ].join(' ')
}

function gpuModelAllowsCpuModelRuntime(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): boolean {
  return toolId === 'real_esrgan' ||
    toolId === 'rembg' ||
    toolId === 'transparent_background'
}

function isLocalArtifactPath(filePath: string): boolean {
  const normalized = path.normalize(filePath)
  return normalized === '.local-artifacts' ||
    normalized.startsWith(`.local-artifacts${path.sep}`)
}

function readRuntimeInputManifest(filePath: string): RuntimeInputManifest {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown
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

function safeManifestString(key: string, value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`runtime input manifest field ${key} must be a non-empty string`)
  }
  if (key === 'modelWeightManifestId') {
    if (
      /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ||
      value.includes('/') ||
      value.includes('\\') ||
      value.includes('\0') ||
      value.split(/[\\/]+/).includes('..')
    ) {
      throw new Error(`runtime input manifest field ${key} must be a reviewed private manifest id`)
    }
    return value
  }
  if (key === 'modelWeightChecksumSha256') {
    if (!/^[a-f0-9]{64}$/i.test(value)) {
      throw new Error(`runtime input manifest field ${key} must be a 64-character SHA-256 hex digest`)
    }
    return value
  }
  if (key === 'modelWeightChecksumEvidenceRef') {
    if (
      !value.startsWith('private://') ||
      /^https?:\/\//i.test(value) ||
      value.startsWith('public://') ||
      value.includes('\0') ||
      value.split(/[\\/]+/).includes('..')
    ) {
      throw new Error(`runtime input manifest field ${key} must be a reviewed private:// checksum evidence ref`)
    }
    return value
  }
  if (key === 'transparentBackgroundMode') {
    if (!transparentBackgroundModes.has(value)) {
      throw new Error(`runtime input manifest field ${key} must be base, fast, or base-nightly`)
    }
    return value
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

function parseArgs(): SequenceArgs {
  const toolId = stringFlag('--tool') ?? 'kornia'
  if (!isGpuModelTool(toolId)) {
    throw new Error(`Unsupported GPU/model tool id for private proof sequence: ${toolId}`)
  }

  const attemptLocalRuntime = hasFlag('--attempt-local-runtime')
  const runtimeInputManifestPath = stringFlag('--runtime-input-manifest')
  if (runtimeInputManifestPath && !isLocalArtifactPath(runtimeInputManifestPath)) {
    throw new Error('--runtime-input-manifest must stay under .local-artifacts/')
  }
  const runtimeInputManifest = runtimeInputManifestPath
    ? readRuntimeInputManifest(runtimeInputManifestPath)
    : undefined
  const outputDirectory = stringFlag('--output-dir')
  const resolvedOutputDirectory =
    outputDirectory ??
    manifestStringForTool(toolId, runtimeInputManifest, 'outputDirectory')
  const resultOut =
    stringFlag('--result-out') ??
    (attemptLocalRuntime && resolvedOutputDirectory
      ? path.join(resolvedOutputDirectory, 'harness-result.json')
      : undefined)
  const allowCpuTensorRuntime =
    toolId === 'kornia' &&
    (
      hasFlag('--allow-cpu-tensor-runtime') ||
      manifestBooleanForTool(toolId, runtimeInputManifest, 'allowCpuTensorRuntime') === true
    )
  const allowCpuFoundationRuntime =
    (toolId === 'torch_torchvision' || toolId === 'transformers') &&
    (
      hasFlag('--allow-cpu-foundation-runtime') ||
      manifestBooleanForTool(toolId, runtimeInputManifest, 'allowCpuFoundationRuntime') === true
    )
  const allowCpuModelRuntime =
    gpuModelAllowsCpuModelRuntime(toolId) &&
    (
      hasFlag('--allow-cpu-model-runtime') ||
      manifestBooleanForTool(toolId, runtimeInputManifest, 'allowCpuModelRuntime') === true
    )
  const requestedBackend = stringFlag('--runtime-backend')
  const manifestRuntimeContainerImage =
    manifestStringForTool(toolId, runtimeInputManifest, 'runtimeContainerImage')
  const manifestRuntimeContainerPlatform =
    manifestStringForTool(toolId, runtimeInputManifest, 'runtimeContainerPlatform')
  const runtimeBackend =
    requestedBackend === 'docker_container'
      ? 'docker_container'
      : requestedBackend === 'host_python'
      ? 'host_python'
      : manifestRuntimeContainerImage
      ? 'docker_container'
      : allowCpuTensorRuntime || allowCpuFoundationRuntime
      ? 'host_python'
      : 'docker_container'
  const runtimeContainerImage =
    stringFlag('--runtime-container-image') ??
    manifestRuntimeContainerImage ??
    (runtimeBackend === 'docker_container'
      ? gpuModelRuntimeContainerImage(toolId)
      : undefined)
  const runtimeContainerPlatform =
    stringFlag('--runtime-container-platform') ??
    manifestRuntimeContainerPlatform ??
    (runtimeBackend === 'docker_container' ? 'linux/amd64' : undefined)
  if (hasFlag('--write-records') && attemptLocalRuntime) {
    throw new Error(
      '--write-records cannot be combined with --attempt-local-runtime; private proof execution output must stay local-only.',
    )
  }
  if (hasFlag('--write-records') && stringFlag('--result-out')) {
    throw new Error(
      '--write-records cannot be combined with --result-out; private proof result files must stay local-only.',
    )
  }
  if (hasFlag('--write-records') && runtimeInputManifestPath) {
    throw new Error(
      '--write-records cannot be combined with --runtime-input-manifest; private input manifests must stay local-only.',
    )
  }
  if (hasFlag('--write-records') && hasFlag('--detect-host')) {
    throw new Error(
      '--write-records cannot be combined with --detect-host; host-specific proof preflight must stay local-only.',
    )
  }
  if (hasFlag('--write-records') && hasFlag('--require-accepted-proof')) {
    throw new Error(
      '--write-records cannot be combined with --require-accepted-proof; committed records must remain blocked without private proof.',
    )
  }
  if (attemptLocalRuntime && !resolvedOutputDirectory) {
    throw new Error(
      '--attempt-local-runtime requires --output-dir or runtime-input-manifest outputDirectory',
    )
  }
  if (resultOut && !isLocalArtifactPath(resultOut)) {
    throw new Error('--result-out must stay under .local-artifacts/')
  }
  if (resolvedOutputDirectory && !isLocalArtifactPath(resolvedOutputDirectory)) {
    throw new Error('--output-dir must stay under .local-artifacts/')
  }

  return {
    toolId,
    attemptLocalRuntime,
    writeRecords: hasFlag('--write-records'),
    detectHost: hasFlag('--detect-host') || hasFlag('--require-host-eligible'),
    requireHostEligible: hasFlag('--require-host-eligible'),
    requireAcceptedProof: hasFlag('--require-accepted-proof'),
    outputDirectory,
    resolvedOutputDirectory,
    resultOut,
    runtimeInputManifestPath,
    runtimeInputManifest,
    runtimeBackend,
    runtimeContainerImage,
    runtimeContainerPlatform,
    allowCpuTensorRuntime,
    allowCpuFoundationRuntime,
    allowCpuModelRuntime,
    sourceImageLocalPath: stringFlag('--source-image'),
    sam2CheckpointLocalPath: stringFlag('--sam2-checkpoint'),
    birefnetModelLocalPath: stringFlag('--birefnet-model'),
    realEsrganModelLocalPath: stringFlag('--real-esrgan-model'),
    rembgModelLocalPath: stringFlag('--rembg-model'),
    transparentBackgroundCheckpointLocalPath:
      stringFlag('--transparent-background-checkpoint'),
    transparentBackgroundMode:
      stringFlag('--transparent-background-mode') ??
      manifestStringForTool(toolId, runtimeInputManifest, 'transparentBackgroundMode'),
    timeoutMs: stringFlag('--timeout-ms'),
  }
}

function runJsonScript(scriptName: string, args: string[]): JsonRecord {
  const output = childProcess.execFileSync('npm', [
    'run',
    '--silent',
    scriptName,
    '--',
    ...args,
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR:
        process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
    },
  })
  return JSON.parse(output) as JsonRecord
}

function pushIfValue(args: string[], flag: string, value: string | undefined): void {
  if (value) args.push(flag, value)
}

function harnessArgs(input: SequenceArgs): string[] {
  const args = ['--tool', input.toolId]
  if (input.attemptLocalRuntime) args.push('--attempt-local-runtime')
  if (input.allowCpuTensorRuntime) args.push('--allow-cpu-tensor-runtime')
  if (input.allowCpuFoundationRuntime) args.push('--allow-cpu-foundation-runtime')
  if (input.allowCpuModelRuntime) args.push('--allow-cpu-model-runtime')
  if (input.allowCpuModelRuntime) args.push('--no-runtime-container-gpu')
  pushIfValue(args, '--runtime-input-manifest', input.runtimeInputManifestPath)
  pushIfValue(args, '--output-dir', input.outputDirectory)
  pushIfValue(args, '--result-out', input.resultOut)
  if (input.runtimeBackend) args.push('--runtime-backend', input.runtimeBackend)
  pushIfValue(args, '--runtime-container-image', input.runtimeContainerImage)
  pushIfValue(args, '--runtime-container-platform', input.runtimeContainerPlatform)
  pushIfValue(args, '--source-image', input.sourceImageLocalPath)
  pushIfValue(args, '--sam2-checkpoint', input.sam2CheckpointLocalPath)
  pushIfValue(args, '--birefnet-model', input.birefnetModelLocalPath)
  pushIfValue(args, '--real-esrgan-model', input.realEsrganModelLocalPath)
  pushIfValue(args, '--rembg-model', input.rembgModelLocalPath)
  pushIfValue(
    args,
    '--transparent-background-checkpoint',
    input.transparentBackgroundCheckpointLocalPath,
  )
  pushIfValue(args, '--transparent-background-mode', input.transparentBackgroundMode)
  pushIfValue(args, '--timeout-ms', input.timeoutMs)
  return args
}

function directHarnessCommand(input: SequenceArgs): string {
  return [
    `npm run --silent ${harnessScript} --`,
    ...harnessArgs(input),
  ].join(' ')
}

function bridgeCommand(resultPath: string): string {
  return [
    `npm run --silent ${bridgeScript} --`,
    '--local-runtime-proof-result',
    resultPath,
  ].join(' ')
}

function readinessCommand(resultPath: string): string {
  return [
    `npm run --silent ${readinessScript} --`,
    '--local-runtime-proof-result',
    resultPath,
  ].join(' ')
}

function finalExternalAgentToolCallOutputDirectory(input: SequenceArgs): string | undefined {
  return input.resolvedOutputDirectory
    ? path.join(input.resolvedOutputDirectory, 'external-agent-single-tool-call', input.toolId)
    : `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${input.toolId}>/external-agent-single-tool-call/${input.toolId}`
}

function finalExternalAgentToolCallResultPath(input: SequenceArgs): string | undefined {
  return input.resolvedOutputDirectory
    ? path.join(input.resolvedOutputDirectory, 'external-agent-single-tool-call-result.json')
    : `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${input.toolId}>/external-agent-single-tool-call-result.json`
}

function finalExternalAgentToolCallArgs(input: SequenceArgs): string[] {
  const args = [
    '--tool',
    input.toolId,
    '--attempt-gpu-runtime',
    '--expect-state',
    'executable',
    '--require-output-hash',
    '--require-private-only-boundary',
    '--strict-exit-code',
  ]
  if (input.runtimeBackend) args.push('--runtime-backend', input.runtimeBackend)
  if (input.allowCpuTensorRuntime) args.push('--allow-cpu-tensor-runtime')
  if (input.allowCpuFoundationRuntime) args.push('--allow-cpu-foundation-runtime')
  if (input.allowCpuModelRuntime) args.push('--allow-cpu-model-runtime')
  if (input.allowCpuModelRuntime) args.push('--no-runtime-container-gpu')
  pushIfValue(args, '--runtime-input-manifest', input.runtimeInputManifestPath)
  pushIfValue(args, '--runtime-container-image', input.runtimeContainerImage)
  pushIfValue(args, '--runtime-container-platform', input.runtimeContainerPlatform)
  pushIfValue(args, '--gpu-output-dir', finalExternalAgentToolCallOutputDirectory(input))
  pushIfValue(args, '--result-out', finalExternalAgentToolCallResultPath(input))
  pushIfValue(args, '--source-image', input.sourceImageLocalPath)
  pushIfValue(args, '--sam2-checkpoint', input.sam2CheckpointLocalPath)
  pushIfValue(args, '--birefnet-model', input.birefnetModelLocalPath)
  pushIfValue(args, '--real-esrgan-model', input.realEsrganModelLocalPath)
  pushIfValue(args, '--rembg-model', input.rembgModelLocalPath)
  pushIfValue(
    args,
    '--transparent-background-checkpoint',
    input.transparentBackgroundCheckpointLocalPath,
  )
  pushIfValue(args, '--transparent-background-mode', input.transparentBackgroundMode)
  pushIfValue(args, '--timeout-ms', input.timeoutMs)
  return args
}

function finalExternalAgentToolCallCommandArgs(input: SequenceArgs): string[] {
  const args = finalExternalAgentToolCallArgs(input)
  const manifestCanProvidePrivateInputs = Boolean(input.runtimeInputManifestPath)
  if (
    !manifestCanProvidePrivateInputs &&
    !input.sourceImageLocalPath &&
    !['torch_torchvision', 'transformers'].includes(input.toolId)
  ) {
    args.push('--source-image', '<private-approved-frame.png>')
  }
  if (
    input.toolId === 'sam2' &&
    !manifestCanProvidePrivateInputs &&
    !input.sam2CheckpointLocalPath
  ) {
    args.push('--sam2-checkpoint', '<private-sam2-checkpoint.pt>')
  }
  if (
    input.toolId === 'birefnet' &&
    !manifestCanProvidePrivateInputs &&
    !input.birefnetModelLocalPath
  ) {
    args.push('--birefnet-model', '<private-birefnet-model>')
  }
  if (
    input.toolId === 'real_esrgan' &&
    !manifestCanProvidePrivateInputs &&
    !input.realEsrganModelLocalPath
  ) {
    args.push('--real-esrgan-model', '<private-real-esrgan-model.pth>')
  }
  if (
    input.toolId === 'rembg' &&
    !manifestCanProvidePrivateInputs &&
    !input.rembgModelLocalPath
  ) {
    args.push('--rembg-model', '<private-rembg-model.onnx>')
  }
  if (
    input.toolId === 'transparent_background' &&
    !manifestCanProvidePrivateInputs &&
    !input.transparentBackgroundCheckpointLocalPath
  ) {
    args.push(
      '--transparent-background-checkpoint',
      '<private-transparent-background-checkpoint.pth>',
    )
  }
  return args
}

function finalExternalAgentToolCallCommand(input: SequenceArgs): string | null {
  return [
    `npm run --silent ${externalAgentToolCallScript} --`,
    ...finalExternalAgentToolCallCommandArgs(input),
  ].join(' ')
}

type RequestedProofMode =
  | 'native_gpu'
  | 'cpu_tensor'
  | 'cpu_foundation'
  | 'cpu_model'

function requestedProofMode(input: SequenceArgs): RequestedProofMode {
  if (input.allowCpuFoundationRuntime) return 'cpu_foundation'
  if (input.allowCpuTensorRuntime) return 'cpu_tensor'
  if (input.allowCpuModelRuntime) return 'cpu_model'
  return 'native_gpu'
}

function requestedProofRequiresNativeGpu(input: SequenceArgs): boolean {
  return requestedProofMode(input) === 'native_gpu'
}

function finalExternalAgentToolCallCommandForTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: { container: boolean },
): string {
  return [
    `npm run --silent ${externalAgentToolCallScript} --`,
    `--tool ${toolId}`,
    '--attempt-gpu-runtime',
    '--expect-state executable',
    '--require-output-hash',
    '--require-private-only-boundary',
    '--strict-exit-code',
    ...(options.container
      ? [
          '--runtime-backend docker_container',
          `--runtime-container-image ${gpuModelRuntimeContainerImage(toolId)}`,
          '--runtime-container-platform linux/amd64',
        ]
      : ['--runtime-backend host_python']),
    ...(toolId === 'kornia' && !options.container
      ? ['--allow-cpu-tensor-runtime']
      : []),
    ...((toolId === 'torch_torchvision' || toolId === 'transformers') &&
    !options.container
      ? ['--allow-cpu-foundation-runtime']
      : []),
    ...(gpuModelAllowsCpuModelRuntime(toolId)
      ? ['--allow-cpu-model-runtime', '--no-runtime-container-gpu']
      : []),
    `--gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${toolId}>/external-agent-single-tool-call/${toolId}`,
    `--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${toolId}>/external-agent-single-tool-call-result.json`,
    ...privateProofSequenceInputFlags(toolId),
  ].join(' ')
}

function finalExternalAgentToolCallCommandsByTool(options: {
  container: boolean
}): Record<
  AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  string
> {
  return Object.fromEntries(
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.map(
      (toolId) => [toolId, finalExternalAgentToolCallCommandForTool(toolId, options)],
    ),
  ) as Record<AiGraphicsExternalAgentGpuModelControlledAdapterToolId, string>
}

function defaultKorniaCommand(): string {
  return [
    `npm run --silent ${harnessScript} --`,
    '--attempt-local-runtime',
    '--runtime-backend docker_container',
    `--runtime-container-image ${canonicalGpuWorkerProofImage}`,
    '--runtime-container-platform linux/amd64',
    '--tool kornia',
    '--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>',
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
    '--source-image <private-approved-frame.png>',
  ].join(' ')
}

function defaultKorniaCpuTensorCommand(): string {
  return [
    `npm run --silent ${harnessScript} --`,
    '--attempt-local-runtime',
    '--runtime-backend host_python',
    '--allow-cpu-tensor-runtime',
    '--tool kornia',
    '--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-kornia-cpu-run>',
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-kornia-cpu-run>/harness-result.json',
    '--source-image <private-approved-frame.png>',
  ].join(' ')
}

function defaultFoundationCpuCommand(toolId: 'torch_torchvision' | 'transformers'): string {
  return [
    `npm run --silent ${harnessScript} --`,
    '--attempt-local-runtime',
    '--runtime-backend host_python',
    '--allow-cpu-foundation-runtime',
    `--tool ${toolId}`,
    `--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-${toolId}-cpu-run>`,
    `--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-${toolId}-cpu-run>/harness-result.json`,
  ].join(' ')
}

function defaultCpuModelCommand(
  toolId: 'real_esrgan' | 'rembg' | 'transparent_background',
): string {
  return [
    `npm run --silent ${harnessScript} --`,
    '--attempt-local-runtime',
    '--runtime-backend docker_container',
    `--runtime-container-image ${canonicalGpuWorkerProofImage}`,
    '--runtime-container-platform linux/amd64',
    '--no-runtime-container-gpu',
    '--allow-cpu-model-runtime',
    `--tool ${toolId}`,
    `--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-${toolId}-cpu-run>`,
    `--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-${toolId}-cpu-run>/harness-result.json`,
    '--source-image <private-approved-frame.png>',
    toolId === 'real_esrgan'
      ? '--real-esrgan-model <private-real-esrgan-model.pth>'
      : toolId === 'rembg'
      ? '--rembg-model <private-rembg-model.onnx>'
      : '--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>',
    '--runtime-input-manifest <private-runtime-inputs-with-model-weight-evidence.json>',
  ].join(' ')
}

function privateProofSequenceInputFlags(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): string[] {
  const flags: string[] = []
  if (!['torch_torchvision', 'transformers'].includes(toolId)) {
    flags.push('--source-image <private-approved-frame.png>')
  }
  if (toolId === 'sam2') {
    flags.push('--sam2-checkpoint <private-sam2-checkpoint.pt>')
  }
  if (toolId === 'birefnet') {
    flags.push('--birefnet-model <private-birefnet-model>')
  }
  if (toolId === 'real_esrgan') {
    flags.push('--real-esrgan-model <private-real-esrgan-model.pth>')
  }
  if (toolId === 'rembg') {
    flags.push('--rembg-model <private-rembg-model.onnx>')
  }
  if (toolId === 'transparent_background') {
    flags.push(
      '--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>',
    )
  }
  return flags
}

function sequenceCommandForTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: { container: boolean },
): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence --',
    '--attempt-local-runtime',
    ...(options.container
      ? [
          '--runtime-backend docker_container',
          `--runtime-container-image ${gpuModelRuntimeContainerImage(toolId)}`,
          '--runtime-container-platform linux/amd64',
        ]
      : []),
    ...(toolId === 'kornia' && !options.container
      ? ['--runtime-backend host_python', '--allow-cpu-tensor-runtime']
      : []),
    ...((toolId === 'torch_torchvision' || toolId === 'transformers') &&
    !options.container
      ? ['--runtime-backend host_python', '--allow-cpu-foundation-runtime']
      : []),
    ...(gpuModelAllowsCpuModelRuntime(toolId)
      ? ['--allow-cpu-model-runtime', '--no-runtime-container-gpu']
      : []),
    `--tool ${toolId}`,
    `--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${toolId}>`,
    ...privateProofSequenceInputFlags(toolId),
    '--detect-host',
    '--require-host-eligible',
    '--require-accepted-proof',
  ].join(' ')
}

function sequenceManifestCommandForTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  options: { container: boolean },
): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence --',
    '--attempt-local-runtime',
    ...(options.container
      ? [
          '--runtime-backend docker_container',
          `--runtime-container-image ${gpuModelRuntimeContainerImage(toolId)}`,
          '--runtime-container-platform linux/amd64',
        ]
      : []),
    ...(toolId === 'kornia' && !options.container
      ? ['--runtime-backend host_python', '--allow-cpu-tensor-runtime']
      : []),
    ...((toolId === 'torch_torchvision' || toolId === 'transformers') &&
    !options.container
      ? ['--runtime-backend host_python', '--allow-cpu-foundation-runtime']
      : []),
    ...(gpuModelAllowsCpuModelRuntime(toolId)
      ? ['--allow-cpu-model-runtime', '--no-runtime-container-gpu']
      : []),
    `--tool ${toolId}`,
    `--runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${toolId}>/runtime-inputs.json`,
    '--detect-host',
    '--require-host-eligible',
    '--require-accepted-proof',
  ].join(' ')
}

function sequenceCommand(): string {
  return sequenceCommandForTool('kornia', { container: true })
}

function privateProofSequenceCommandsByTool(options: {
  container: boolean
}): Record<
  AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  string
> {
  return Object.fromEntries(
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.map(
      (toolId) => [toolId, sequenceCommandForTool(toolId, options)],
    ),
  ) as Record<AiGraphicsExternalAgentGpuModelControlledAdapterToolId, string>
}

function privateProofSequenceManifestCommandsByTool(options: {
  container: boolean
}): Record<
  AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  string
> {
  return Object.fromEntries(
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.map(
      (toolId) => [toolId, sequenceManifestCommandForTool(toolId, options)],
    ),
  ) as Record<AiGraphicsExternalAgentGpuModelControlledAdapterToolId, string>
}

function rowForTool(report: JsonRecord, toolId: string): JsonRecord {
  const rows = Array.isArray(report.gpuModelLocalDevRuntimeExecutionHarnessRows)
    ? report.gpuModelLocalDevRuntimeExecutionHarnessRows
    : []
  return rows.find((row: JsonRecord) => row.toolId === toolId) ?? {}
}

function readinessToolRow(report: JsonRecord, toolId: string): JsonRecord {
  const rows = Array.isArray(report.toolReadinessRows)
    ? report.toolReadinessRows
    : []
  return rows.find((row: JsonRecord) => row.toolId === toolId) ?? {}
}

function buildReport(input: SequenceArgs) {
  const harness = runJsonScript(harnessScript, harnessArgs(input))
  const harnessRow = rowForTool(harness, input.toolId)
  const localRuntimeExecuted = harnessRow.localRuntimeExecutionPerformed === true
  const privateResultPath = input.resultOut ?? null
  const shouldRunPrivateProofChecks =
    input.attemptLocalRuntime && typeof privateResultPath === 'string'
  const bridge = shouldRunPrivateProofChecks
    ? runJsonScript(bridgeScript, ['--local-runtime-proof-result', privateResultPath])
    : runJsonScript(bridgeScript, [])
  const readiness = shouldRunPrivateProofChecks
    ? runJsonScript(readinessScript, ['--local-runtime-proof-result', privateResultPath])
    : runJsonScript(readinessScript, [])
  const hostPreflight = input.detectHost
    ? runJsonScript(hostPreflightScript, ['--detect-host'])
    : null
  const readinessRow = readinessToolRow(readiness, input.toolId)
  const bridgeRows = Array.isArray(bridge.gpuModelRuntimeProofRefBridgeRows)
    ? bridge.gpuModelRuntimeProofRefBridgeRows
    : []
  const bridgeRow =
    bridgeRows.find((row: JsonRecord) => row.toolId === input.toolId) ?? {}
  const acceptedPrivateProof =
    bridgeRow.routeSubmissionReadyWithAcceptedPrivateProof === true &&
    readinessRow.executable === true
  const finalExternalAgentSingleToolCall = acceptedPrivateProof
    ? runJsonScript(externalAgentToolCallScript, finalExternalAgentToolCallArgs(input))
    : null
  const hostEnvironment =
    hostPreflight && typeof hostPreflight.hostEnvironment === 'object'
      ? hostPreflight.hostEnvironment
      : null
  const hostEligibleForNativeGpuProof =
    hostEnvironment?.hostEligibleForNativeGpuProof === true
  const hostBlockers = Array.isArray(hostEnvironment?.blockers)
    ? hostEnvironment.blockers.filter((blocker: unknown): blocker is string => typeof blocker === 'string')
    : []
  const proofMode = requestedProofMode(input)
  const nativeGpuHostEligibilityRequired =
    requestedProofRequiresNativeGpu(input)
  const harnessSkipReasonCode =
    typeof harnessRow.skipReasonCode === 'string'
      ? harnessRow.skipReasonCode
      : null
  const hostEligibleForRequestedProof = nativeGpuHostEligibilityRequired
    ? hostEligibleForNativeGpuProof
    : localRuntimeExecuted
  const requestedProofHostBlockers = nativeGpuHostEligibilityRequired
    ? hostBlockers
    : hostEligibleForRequestedProof
    ? []
    : harnessSkipReasonCode
    ? [
        `CPU proof host/runtime is not eligible for ${input.toolId}: ${harnessSkipReasonCode}.`,
      ]
    : [
        `CPU proof host/runtime is not eligible for ${input.toolId}; run the host Python private proof with the required local packages and private inputs.`,
      ]

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-gpu-model-private-proof-sequence',
    decision,
    status: acceptedPrivateProof ? privateProofStatus : defaultStatus,
    summary:
      'Runs the scoped GPU/model private proof sequence for one tool: local-dev controlled adapter harness, SHA-checked proof-ref bridge, then all-21 external-agent readiness recomputation. The default committed record targets Kornia without runtime execution and stays blocked. Actual runtime execution requires --attempt-local-runtime plus private inputs and remains local-only; Kornia may use explicit CPU tensor runtime when local torch/PIL/numpy/kornia prerequisites exist.',
    requestedToolId: input.toolId,
    fastestUnlockCandidate: 'kornia',
    sourceEvidence: {
      gpuModelLocalDevRuntimeExecutionHarness: {
        decision: harness.decision,
        status: harness.status,
        accepted: true,
      },
      gpuModelRuntimeProofRefBridge: {
        decision: bridge.decision,
        status: bridge.status,
        accepted: true,
      },
      externalAgentExecutionReadiness: {
        decision: readiness.decision,
        status: readiness.status,
        accepted: true,
      },
      currentHostGpuProofPreflight: hostPreflight
        ? {
            decision: hostPreflight.decision,
            hostEnvironment,
            accepted: true,
          }
        : null,
    },
    interfaces: {
      packageScript:
        'ai-graphics:external-agent-gpu-model-private-proof-sequence',
      diagnosticScript:
        'ai-graphics:external-agent-gpu-model-private-proof-sequence:diagnostics',
      cli:
        'server/cli/ai-graphics-external-agent-gpu-model-private-proof-sequence.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-gpu-model-private-proof-sequence-diagnostics.mjs',
      defaultCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence',
      writeRecordsCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --write-records',
      korniaFirstPrivateProofSequenceCommand: sequenceCommand(),
      korniaFirstPrivateProofSequenceManifestCommand:
        sequenceManifestCommandForTool('kornia', { container: true }),
      privateContainerProofSequenceCommandsByTool:
        privateProofSequenceCommandsByTool({ container: true }),
      privateHostProofSequenceCommandsByTool:
        privateProofSequenceCommandsByTool({ container: false }),
      privateContainerProofSequenceManifestCommandsByTool:
        privateProofSequenceManifestCommandsByTool({ container: true }),
      privateHostProofSequenceManifestCommandsByTool:
        privateProofSequenceManifestCommandsByTool({ container: false }),
      directHarnessCommand: directHarnessCommand(input),
      defaultKorniaHarnessCommand: defaultKorniaCommand(),
      defaultKorniaCpuTensorHarnessCommand: defaultKorniaCpuTensorCommand(),
      defaultTorchTorchvisionCpuFoundationHarnessCommand:
        defaultFoundationCpuCommand('torch_torchvision'),
      defaultTransformersCpuFoundationHarnessCommand:
        defaultFoundationCpuCommand('transformers'),
      defaultRealEsrganCpuModelHarnessCommand:
        defaultCpuModelCommand('real_esrgan'),
      defaultRembgCpuModelHarnessCommand:
        defaultCpuModelCommand('rembg'),
      defaultTransparentBackgroundCpuModelHarnessCommand:
        defaultCpuModelCommand('transparent_background'),
      bridgeCommand: privateResultPath ? bridgeCommand(privateResultPath) : null,
      readinessCommand: privateResultPath ? readinessCommand(privateResultPath) : null,
      finalExternalAgentSingleToolCallCommand:
        finalExternalAgentToolCallCommand(input),
      finalExternalAgentSingleToolCallOutputDirectory:
        finalExternalAgentToolCallOutputDirectory(input) ?? null,
      finalExternalAgentSingleToolCallResultPath:
        finalExternalAgentToolCallResultPath(input) ?? null,
      finalExternalAgentSingleToolCallContainerCommandsByTool:
        finalExternalAgentToolCallCommandsByTool({ container: true }),
      finalExternalAgentSingleToolCallHostCommandsByTool:
        finalExternalAgentToolCallCommandsByTool({ container: false }),
      hostPreflightCommand:
        `npm run --silent ${hostPreflightScript} -- --detect-host`,
      canonicalGpuWorkerProofImage,
      canonicalGpuWorkerProofImageBuildCommand:
        `docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/gpu-worker/Dockerfile -t ${canonicalGpuWorkerProofImage} .`,
      gpuModelRuntimeContainerTargets,
      gpuModelRuntimeContainerBuildCommandsByTool: Object.fromEntries(
        AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.map(
          (toolId) => [toolId, gpuModelRuntimeContainerBuildCommand(toolId)],
        ),
      ),
    },
    sequencePolicy: {
      scopedToolOnly: true,
      oneToolPerPrivateProofSequence: true,
      defaultTool: 'kornia',
      allGpuModelToolsHaveExactPrivateProofSequenceCommand: true,
      allGpuModelToolsHaveExactContainerPrivateProofSequenceCommand: true,
      allGpuModelToolsHaveExactHostPrivateProofSequenceCommand: true,
      defaultToolReason:
        'Kornia requires one private approved frame and no private model/checkpoint file; it can use explicit CPU tensor runtime when torch/PIL/numpy/kornia are locally present, otherwise CUDA proof remains available.',
      explicitRuntimeAttemptRequired: true,
      privateInputsRequired: true,
      privateRuntimeInputManifestSupported: true,
      privateRuntimeInputManifestUsedNow: Boolean(input.runtimeInputManifestPath),
      korniaCpuTensorRuntimeRequested: input.allowCpuTensorRuntime,
      foundationCpuRuntimeRequested: input.allowCpuFoundationRuntime,
      cpuModelRuntimeRequested: input.allowCpuModelRuntime,
      privateRuntimeInputManifestMustStayUnderLocalArtifacts: true,
      privateRuntimeInputManifestRejectedForWriteRecords: true,
      privateProofResultMustStayUnderLocalArtifacts: true,
      proofBridgeRequiresOutputJsonSha256Match: true,
      noIdleGpuRuntimeApproved: true,
      gpuMayStartOnlyDuringScopedLocalRuntimeAttempt:
        input.attemptLocalRuntime === true &&
        input.allowCpuTensorRuntime !== true &&
        input.allowCpuFoundationRuntime !== true &&
        input.allowCpuModelRuntime !== true,
      noCpuFallbackForCudaOnlyGpuModelTools: true,
      cpuModelRuntimeAllowedForReviewedRealEsrganRembgAndTransparentBackgroundWhenExplicitlyRequested: true,
      cpuModelRuntimeDoesNotStartGpu: true,
      korniaCpuTensorRuntimeAllowedWhenExplicitlyRequested: true,
      korniaCpuTensorRuntimeDoesNotStartGpu: true,
      foundationCpuRuntimeAllowedWhenExplicitlyRequested: true,
      foundationCpuRuntimeDoesNotStartGpu: true,
      noModelDownload: true,
      noProviderRuntime: true,
      noPublicArtifacts: true,
      noSignedUrls: true,
      noExternalBetaUnlock: true,
      noProductionUnlock: true,
      hostEligibilityGateSupported: true,
      hostEligibilityGateUsesRequestedProofMode: true,
      nativeGpuHostEligibilityRequired,
      cpuHostEligibilityCanSatisfyRequestedProof:
        nativeGpuHostEligibilityRequired === false,
      requireHostEligibleFlagSupported: true,
      requireAcceptedProofFlagSupported: true,
      perToolPrivateProofSequenceCommandsPrepared: true,
      perToolContainerPrivateProofSequenceCommandsPrepared: true,
      perToolHostPrivateProofSequenceCommandsPrepared: true,
      finalExternalAgentSingleToolCallProofRunsAfterAcceptedPrivateProof: true,
      finalExternalAgentSingleToolCallRequiresExecutableState: true,
      allGpuModelToolsHaveExactFinalExternalAgentSingleToolCallCommand: true,
      allGpuModelToolsHaveExactContainerFinalExternalAgentSingleToolCallCommand: true,
      allGpuModelToolsHaveExactHostFinalExternalAgentSingleToolCallCommand: true,
    },
    counts: {
      requestedGpuModelTools: 1,
      localRuntimeExecutionPerformedTools:
        harness.counts?.localRuntimeExecutionPerformedTools ?? 0,
      toolExecutionApprovedNowTools:
        harness.counts?.toolExecutionApprovedNowTools ?? 0,
      acceptedPrivateProofTools:
        bridge.counts?.acceptedPrivateLocalRuntimeProofTools ?? 0,
      routeSubmissionReadyWithAcceptedPrivateProofTools:
        bridge.counts?.routeSubmissionReadyWithAcceptedPrivateProofTools ?? 0,
      readinessAgentExecutableTools:
        readiness.counts?.agentExecutableTools ?? 0,
      readinessGpuToolsWithValidRuntimeProof:
        readiness.counts?.gpuToolsWithValidRuntimeProof ?? 0,
      readinessBlockedWithReasonTools:
        readiness.counts?.blockedWithReasonTools ?? 0,
      gpuRuntimeShouldStartNowTools:
        readiness.counts?.gpuRuntimeShouldStartNowTools ?? 0,
      publicArtifactCreatedTools:
        readiness.counts?.publicArtifactCreatedTools ?? 0,
      signedUrlCreatedTools:
        readiness.counts?.signedUrlCreatedTools ?? 0,
      currentHostGpuProofBlockers: hostBlockers.length,
      currentRequestedProofHostBlockers: requestedProofHostBlockers.length,
      finalExternalAgentSingleToolCallsExecuted:
        finalExternalAgentSingleToolCall ? 1 : 0,
    },
    currentHostGpuProofPreflight: {
      requested: input.detectHost,
      hostEligibleForNativeGpuProof,
      blockers: hostBlockers,
      hostEnvironment,
    },
    currentHostProofPreflight: {
      requested: input.detectHost,
      requestedProofMode: proofMode,
      nativeGpuHostEligibilityRequired,
      hostEligibleForNativeGpuProof,
      hostEligibleForRequestedProof,
      nativeGpuBlockers: hostBlockers,
      requestedProofBlockers: requestedProofHostBlockers,
      hostEnvironment,
    },
    requestedToolResult: {
      harness: {
        adapterStatus: harnessRow.adapterStatus ?? null,
        executionState: harnessRow.executionState ?? null,
        localRuntimeExecutionPerformed:
          harnessRow.localRuntimeExecutionPerformed === true,
        toolExecutionApprovedNow:
          harnessRow.toolExecutionApprovedNow === true,
        gpuRuntimeShouldStartNow:
          harnessRow.gpuRuntimeShouldStartNow === true,
        skipReasonCode: harnessRow.skipReasonCode ?? null,
        errorMessage: harnessRow.errorMessage ?? null,
        outputJsonPath: harnessRow.outputJsonPath ?? null,
        outputJsonSha256: harnessRow.outputJsonSha256 ?? null,
      },
      bridge: {
        proofRefBridgeStatus: bridgeRow.proofRefBridgeStatus ?? null,
        routeSubmissionReadyWithAcceptedPrivateProof:
          bridgeRow.routeSubmissionReadyWithAcceptedPrivateProof === true,
        localRuntimeProofAccepted:
          bridgeRow.localRuntimeProofAccepted === true,
        privateOutputJsonSha256Matches:
          bridgeRow.localProofEvidenceObserved
            ?.privateOutputJsonSha256Matches === true,
        privateOutputJsonRejectionReason:
          bridgeRow.localProofEvidenceObserved
            ?.privateOutputJsonRejectionReason ?? null,
      },
      readiness: {
        readinessState: readinessRow.readinessState ?? null,
        executable: readinessRow.executable === true,
        routeSubmissionReadyWithAcceptedPrivateProof:
          readinessRow.routeSubmissionReadyWithAcceptedPrivateProof === true,
        blockingPrerequisite: readinessRow.blockingPrerequisite ?? null,
      },
      finalExternalAgentSingleToolCall: finalExternalAgentSingleToolCall
        ? {
            status: finalExternalAgentSingleToolCall.status ?? null,
            executionState:
              finalExternalAgentSingleToolCall.response
                ?.externalAgentExecutionState ?? null,
            executable:
              finalExternalAgentSingleToolCall.booleans?.executable === true,
            outputSource:
              finalExternalAgentSingleToolCall.response?.outputSource ?? null,
            outputSha256:
              finalExternalAgentSingleToolCall.response?.outputSha256 ?? null,
            outputJsonPath:
              finalExternalAgentSingleToolCall.response?.outputJsonPath ?? null,
            gpuRuntimeShouldStartNow:
              finalExternalAgentSingleToolCall.booleans
                ?.gpuRuntimeShouldStartNow === true,
            publicArtifactCreated:
              finalExternalAgentSingleToolCall.booleans
                ?.publicArtifactCreated === true,
            signedUrlCreated:
              finalExternalAgentSingleToolCall.booleans?.signedUrlCreated === true,
          }
        : {
            status: 'not_run_until_private_proof_is_accepted',
            executionState: null,
            executable: false,
            outputSource: null,
            outputSha256: null,
            outputJsonPath: null,
            gpuRuntimeShouldStartNow: false,
            publicArtifactCreated: false,
            signedUrlCreated: false,
          },
    },
    booleans: {
      externalAgentGpuModelPrivateProofSequencePrepared: true,
      korniaFirstUnlockPathPrepared: true,
      scopedToolOnly: true,
      localRuntimeAttemptRequested: input.attemptLocalRuntime,
      privateRuntimeInputManifestSupported: true,
      privateRuntimeInputManifestUsedNow: Boolean(input.runtimeInputManifestPath),
      localRuntimeExecutedForRequestedTool: localRuntimeExecuted,
      proofBridgeExecuted: true,
      readinessRecomputed: true,
      acceptedPrivateProofForRequestedTool: acceptedPrivateProof,
      finalExternalAgentSingleToolCallAttempted:
        finalExternalAgentSingleToolCall !== null,
      finalExternalAgentSingleToolCallExecutable:
        finalExternalAgentSingleToolCall?.booleans?.executable === true,
      hostPreflightRequested: input.detectHost,
      hostEligibleForNativeGpuProof,
      hostEligibleForRequestedProof,
      nativeGpuHostEligibilityRequired,
      requireHostEligible: input.requireHostEligible,
      requireAcceptedProof: input.requireAcceptedProof,
      agentCanExecute13NonGpuControlledToolsNow:
        readiness.booleans?.agentCanExecute13NonGpuControlledToolsNow === true,
      agentCanExecuteGpuModelToolsNow:
        readiness.booleans?.agentCanExecuteGpuModelToolsNow === true,
      agentCanExecuteAll21ToolsNow:
        readiness.booleans?.agentCanExecuteAll21ToolsNow === true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      gpuRuntimeStartedOnlyDuringScopedAttempt:
        input.allowCpuTensorRuntime || input.allowCpuFoundationRuntime || input.allowCpuModelRuntime
          ? harnessRow.gpuRuntimeShouldStartNow !== true
          : !localRuntimeExecuted || harnessRow.gpuRuntimeShouldStartNow === true,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      providerRuntimePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
    nextExactAction: acceptedPrivateProof
      ? 'Feed the accepted private proof into the controlled external-agent route admission path for this scoped tool, then repeat the sequence for the next GPU/model tool.'
      : input.detectHost && !hostEligibleForRequestedProof && nativeGpuHostEligibilityRequired
      ? 'Move this proof sequence to an approved native Linux/amd64 NVIDIA CUDA host, then rerun with --require-host-eligible and --require-accepted-proof.'
      : input.detectHost && !hostEligibleForRequestedProof
      ? 'Install or activate the approved local Python CPU runtime packages for this scoped tool, keep outputs under .local-artifacts/, then rerun with --require-host-eligible and --require-accepted-proof.'
      : 'Run the Kornia-first private proof sequence with either explicit CPU tensor runtime on a host with torch/PIL/numpy/kornia or CUDA runtime on an approved native Linux/amd64 NVIDIA CUDA host.',
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  return `# AI Graphics External Agent GPU Model Private Proof Sequence

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This runner is the one-command local-only path for a scoped GPU/model proof: it calls the real local-dev controlled adapter harness, validates the resulting private proof through the SHA-checked proof-ref bridge, then recomputes all-21 external-agent readiness.

## Requested Tool

- Tool: \`${report.requestedToolId}\`
- Fastest unlock candidate: \`${report.fastestUnlockCandidate}\`
- Local runtime attempted: \`${report.booleans.localRuntimeAttemptRequested}\`
- Local runtime executed for requested tool: \`${report.booleans.localRuntimeExecutedForRequestedTool}\`
- Accepted private proof: \`${report.booleans.acceptedPrivateProofForRequestedTool}\`
- Host preflight requested: \`${report.booleans.hostPreflightRequested}\`
- Host eligible for native GPU proof: \`${report.booleans.hostEligibleForNativeGpuProof}\`

## Kornia First Command

\`${report.interfaces.korniaFirstPrivateProofSequenceCommand}\`

## Kornia First Manifest Command

\`${report.interfaces.korniaFirstPrivateProofSequenceManifestCommand}\`

## Per-Tool Container Private Proof Sequence Commands

${Object.entries(report.interfaces.privateContainerProofSequenceCommandsByTool).map(([toolId, command]) => `- \`${toolId}\`: \`${command}\``).join('\n')}

## Per-Tool Host Python Private Proof Sequence Commands

${Object.entries(report.interfaces.privateHostProofSequenceCommandsByTool).map(([toolId, command]) => `- \`${toolId}\`: \`${command}\``).join('\n')}

## Per-Tool Container Private Manifest Proof Sequence Commands

${Object.entries(report.interfaces.privateContainerProofSequenceManifestCommandsByTool).map(([toolId, command]) => `- \`${toolId}\`: \`${command}\``).join('\n')}

## Per-Tool Host Python Private Manifest Proof Sequence Commands

${Object.entries(report.interfaces.privateHostProofSequenceManifestCommandsByTool).map(([toolId, command]) => `- \`${toolId}\`: \`${command}\``).join('\n')}

## Requested Tool Result

- Harness adapter status: \`${report.requestedToolResult.harness.adapterStatus}\`
- Harness execution state: \`${report.requestedToolResult.harness.executionState}\`
- Harness skip reason: \`${report.requestedToolResult.harness.skipReasonCode}\`
- Harness output JSON SHA-256: \`${report.requestedToolResult.harness.outputJsonSha256}\`
- Bridge status: \`${report.requestedToolResult.bridge.proofRefBridgeStatus}\`
- Bridge SHA-256 accepted: \`${report.requestedToolResult.bridge.privateOutputJsonSha256Matches}\`
- Readiness state: \`${report.requestedToolResult.readiness.readinessState}\`
- Readiness blocking prerequisite: \`${report.requestedToolResult.readiness.blockingPrerequisite}\`
- Final external-agent single-tool call status: \`${report.requestedToolResult.finalExternalAgentSingleToolCall.status}\`
- Final external-agent single-tool call execution state: \`${report.requestedToolResult.finalExternalAgentSingleToolCall.executionState}\`
- Final external-agent single-tool call executable: \`${report.requestedToolResult.finalExternalAgentSingleToolCall.executable}\`
- Final external-agent single-tool call output source: \`${report.requestedToolResult.finalExternalAgentSingleToolCall.outputSource}\`
- Final external-agent single-tool call output SHA-256: \`${report.requestedToolResult.finalExternalAgentSingleToolCall.outputSha256}\`

## Final External-Agent Single-Tool Caller

- Command: \`${report.interfaces.finalExternalAgentSingleToolCallCommand}\`
- Output directory: \`${report.interfaces.finalExternalAgentSingleToolCallOutputDirectory}\`
- Result path: \`${report.interfaces.finalExternalAgentSingleToolCallResultPath}\`

## Per-Tool Final External-Agent Single-Tool Caller Commands

### Container

${Object.entries(report.interfaces.finalExternalAgentSingleToolCallContainerCommandsByTool).map(([toolId, command]) => `- \`${toolId}\`: \`${command}\``).join('\n')}

### Host Python

${Object.entries(report.interfaces.finalExternalAgentSingleToolCallHostCommandsByTool).map(([toolId, command]) => `- \`${toolId}\`: \`${command}\``).join('\n')}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Current Host Preflight

- Requested: \`${report.currentHostGpuProofPreflight.requested}\`
- Eligible: \`${report.currentHostGpuProofPreflight.hostEligibleForNativeGpuProof}\`
- Blockers: \`${report.currentHostGpuProofPreflight.blockers.join('; ') || 'none'}\`
- Requested proof mode: \`${report.currentHostProofPreflight.requestedProofMode}\`
- Native GPU required for requested proof: \`${report.currentHostProofPreflight.nativeGpuHostEligibilityRequired}\`
- Requested proof eligible: \`${report.currentHostProofPreflight.hostEligibleForRequestedProof}\`
- Requested proof blockers: \`${report.currentHostProofPreflight.requestedProofBlockers.join('; ') || 'none'}\`

## Safety Boundary

${Object.entries(report.sequencePolicy).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Next Action

${report.nextExactAction}
`
}

const args = parseArgs()
const report = buildReport(args)
if (args.writeRecords) {
  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true })
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
}
console.log(JSON.stringify(report, null, 2))
if (args.requireHostEligible && !report.currentHostProofPreflight.hostEligibleForRequestedProof) {
  process.exitCode = 2
} else if (args.requireAcceptedProof && !report.booleans.acceptedPrivateProofForRequestedTool) {
  process.exitCode = 2
}
