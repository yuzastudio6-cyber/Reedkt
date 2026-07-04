import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'
import { AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision =
  'ai_graphics_external_agent_execution_readiness_all21_evaluated_with_gpu_model_blocks'
const defaultStatus =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_gpu_model_blocked_pending_private_proof'
const privateProofStatus =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_plus_private_gpu_model_proof_subset'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md'
const gpuModelInstallBuildTargetsPath =
  'docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json'
const canonicalGpuWorkerProofImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const gpuModelRuntimeContainerTargets: Record<string, {
  image: string
  dockerfile: string
  profile: string
}> = {
  torch_torchvision: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    profile: 'gpu_worker_ai_graphics',
  },
  transformers: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    profile: 'gpu_worker_ai_graphics',
  },
  sam2: {
    image: 'reeditpro/ai-graphics-sam2-runtime:proof-local',
    dockerfile: 'docker/prod/sam2-runtime/Dockerfile',
    profile: 'sam2',
  },
  birefnet: {
    image: 'reeditpro/ai-graphics-birefnet-runtime:proof-local',
    dockerfile: 'docker/prod/birefnet-runtime/Dockerfile',
    profile: 'birefnet',
  },
  real_esrgan: {
    image: 'reeditpro/ai-graphics-real-esrgan-runtime:proof-local',
    dockerfile: 'docker/prod/real-esrgan-runtime/Dockerfile',
    profile: 'real_esrgan',
  },
  kornia: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    profile: 'gpu_worker_ai_graphics',
  },
  rembg: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    profile: 'gpu_worker_ai_graphics',
  },
  transparent_background: {
    image: canonicalGpuWorkerProofImage,
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    profile: 'gpu_worker_ai_graphics',
  },
}
const gpuModelRuntimeInputManifestPath =
  '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json'
const gpuModelRuntimeInputManifestOutputDir =
  '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>'
const gpuModelRuntimeInputManifestSourceImage =
  '<private-approved-frame.png>'
const privateModelRootEnvVar =
  'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT'
const defaultPrivateModelRoot =
  '.local-artifacts/ai-graphics/private-model-cache'
const remainingNativeCudaToolIds = ['sam2', 'birefnet'] as const
type RemainingNativeCudaToolId = typeof remainingNativeCudaToolIds[number]

type ReadinessState =
  | 'callable'
  | 'executable'
  | 'blocked_with_reason'
  | 'failed_with_diagnostics'

type ToolGroup = 'cpu_static' | 'browser_runtime' | 'gpu_model'

type JsonRecord = Record<string, any>

const cpuStaticTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
)
const browserRuntimeTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS,
)
const gpuModelTools = new Set<string>(
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

function stringFlags(flag: string): string[] {
  const values: string[] = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] !== flag) continue
    const value = process.argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`${flag} requires a value`)
    }
    values.push(value)
  }
  return values
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function runJsonCommand(command: string): JsonRecord {
  const output = childProcess.execSync(command, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 160 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR:
        process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
    },
  })
  return JSON.parse(output) as JsonRecord
}

function runJsonFileCommand(command: string, args: string[]): JsonRecord {
  const output = childProcess.execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 160 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR:
        process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
    },
  })
  return JSON.parse(output) as JsonRecord
}

function groupForTool(toolId: AiGraphicsCanonicalToolId): ToolGroup {
  if (cpuStaticTools.has(toolId)) return 'cpu_static'
  if (browserRuntimeTools.has(toolId)) return 'browser_runtime'
  if (gpuModelTools.has(toolId)) return 'gpu_model'
  throw new Error(`Unsupported AI graphics tool: ${toolId}`)
}

function sourceReport(pathFlag: string, defaultPath: string, command: string): JsonRecord {
  if (hasFlag('--use-records-only')) {
    return readJson(stringFlag(pathFlag) ?? defaultPath)
  }
  return runJsonCommand(command)
}

function gpuModelRequiresSourceImage(toolId: string): boolean {
  return !['torch_torchvision', 'transformers'].includes(toolId)
}

function gpuModelRequiresModelWeightManifest(toolId: string): boolean {
  return [
    'sam2',
    'birefnet',
    'real_esrgan',
    'rembg',
    'transparent_background',
  ].includes(toolId)
}

function gpuModelAllowsCpuFoundationRuntime(toolId: string): boolean {
  return toolId === 'torch_torchvision' || toolId === 'transformers'
}

function gpuModelAllowsCpuTensorRuntime(toolId: string): boolean {
  return toolId === 'kornia'
}

function gpuModelAllowsCpuModelRuntime(toolId: string): boolean {
  return toolId === 'real_esrgan' ||
    toolId === 'rembg' ||
    toolId === 'transparent_background'
}

function gpuModelMinimumPrivateRuntimeInputKeys(toolId: string): string[] {
  const keys = [
    'outputDirectory',
    gpuModelAllowsCpuTensorRuntime(toolId)
      ? 'pythonCpuTensorRuntime'
      : gpuModelAllowsCpuFoundationRuntime(toolId)
      ? 'pythonCpuFoundationRuntime'
      : gpuModelAllowsCpuModelRuntime(toolId)
      ? 'pythonCpuModelRuntime'
      : 'nativeCudaRuntime',
  ]
  if (gpuModelRequiresSourceImage(toolId)) keys.push('sourceImageLocalPath')
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
  if (blockingReasonCode.includes('_model_weight_')) {
    return 'modelWeightManifestEvidence'
  }
  if (
    blockingReasonCode.includes('cuda') ||
    blockingReasonCode.includes('container_gpu')
  ) {
    if (gpuModelAllowsCpuModelRuntime(toolId)) return 'pythonCpuModelRuntime'
    return 'nativeCudaRuntime'
  }
  if (blockingReasonCode.includes('container_image')) {
    return 'runtimeContainerImage'
  }
  if (blockingReasonCode.includes('python_package')) {
    if (gpuModelAllowsCpuTensorRuntime(toolId)) return 'pythonCpuTensorRuntime'
    if (gpuModelAllowsCpuFoundationRuntime(toolId)) return 'pythonCpuFoundationRuntime'
    if (gpuModelAllowsCpuModelRuntime(toolId)) return 'pythonCpuModelRuntime'
    return 'pythonPackageRuntime'
  }
  if (blockingReasonCode.includes('python_runtime')) {
    if (gpuModelAllowsCpuTensorRuntime(toolId)) return 'pythonCpuTensorRuntime'
    if (gpuModelAllowsCpuFoundationRuntime(toolId)) return 'pythonCpuFoundationRuntime'
    if (gpuModelAllowsCpuModelRuntime(toolId)) return 'pythonCpuModelRuntime'
    return 'pythonRuntime'
  }
  if (blockingReasonCode.includes('disabled_or_not_local_dev')) {
    return 'attemptGpuRuntime'
  }
  return null
}

function gpuModelRuntimePrerequisiteLabel(toolId: string): string {
  if (gpuModelAllowsCpuTensorRuntime(toolId)) {
    return 'approved local Python CPU tensor runtime'
  }
  if (gpuModelAllowsCpuFoundationRuntime(toolId)) {
    return 'approved local Python CPU foundation runtime'
  }
  if (gpuModelAllowsCpuModelRuntime(toolId)) {
    return 'approved local Python/Docker CPU model runtime'
  }
  return 'approved native CUDA host'
}

function gpuModelBlockedInstallReadinessState(toolId: string): string {
  if (gpuModelAllowsCpuTensorRuntime(toolId)) {
    return 'install_target_prepared_runtime_blocked_pending_cpu_tensor_private_inputs'
  }
  if (gpuModelAllowsCpuFoundationRuntime(toolId)) {
    return 'install_target_prepared_runtime_blocked_pending_cpu_foundation_private_inputs'
  }
  if (gpuModelAllowsCpuModelRuntime(toolId)) {
    return 'install_target_prepared_runtime_blocked_pending_cpu_model_private_inputs'
  }
  return 'install_target_prepared_runtime_blocked_pending_cuda_private_inputs'
}

function gpuModelHostRuntimeFlags(toolId: string): string[] {
  const flags = [
    `--tool ${toolId}`,
    '--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>',
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  ]
  if (gpuModelAllowsCpuFoundationRuntime(toolId)) {
    flags.push('--allow-cpu-foundation-runtime')
  }
  if (gpuModelAllowsCpuTensorRuntime(toolId)) {
    flags.push('--allow-cpu-tensor-runtime')
  }
  if (gpuModelAllowsCpuModelRuntime(toolId)) {
    flags.push('--allow-cpu-model-runtime')
  }
  if (gpuModelRequiresSourceImage(toolId)) {
    flags.push('--source-image <private-approved-frame.png>')
  }
  if (toolId === 'sam2') flags.push('--sam2-checkpoint <private-sam2-checkpoint.pt>')
  if (toolId === 'birefnet') flags.push('--birefnet-model <private-birefnet-model>')
  if (toolId === 'real_esrgan') {
    flags.push('--real-esrgan-model <private-real-esrgan-model.pth>')
  }
  if (toolId === 'rembg') flags.push('--rembg-model <private-rembg-model.onnx>')
  if (toolId === 'transparent_background') {
    flags.push('--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>')
  }
  return flags
}

function gpuModelControlledRouteFlags(toolId: string): string[] {
  const outputDir =
    `.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/${toolId}`
  const flags = [
    `--scoped-gpu-tool ${toolId}`,
    `--scoped-gpu-runtime-container-image ${gpuModelRuntimeContainerImage(toolId)}`,
    '--scoped-gpu-runtime-container-platform linux/amd64',
    `--scoped-gpu-output-dir ${outputDir}`,
  ]
  if (gpuModelAllowsCpuFoundationRuntime(toolId)) {
    flags.push('--scoped-gpu-allow-cpu-foundation-runtime')
  }
  if (gpuModelAllowsCpuTensorRuntime(toolId)) {
    flags.push('--scoped-gpu-allow-cpu-tensor-runtime')
  }
  if (gpuModelAllowsCpuModelRuntime(toolId)) {
    flags.push('--scoped-gpu-allow-cpu-model-runtime')
  }
  if (gpuModelRequiresSourceImage(toolId)) {
    flags.push(`--scoped-gpu-source-image ${outputDir}/private-approved-frame.ppm`)
  }
  if (toolId === 'sam2') {
    flags.push(`--scoped-gpu-sam2-checkpoint ${outputDir}/private-sam2-checkpoint.pt`)
  }
  if (toolId === 'birefnet') {
    flags.push(`--scoped-gpu-birefnet-model ${outputDir}/private-birefnet-model`)
  }
  if (toolId === 'real_esrgan') {
    flags.push(`--scoped-gpu-real-esrgan-model ${outputDir}/private-real-esrgan-model.pth`)
  }
  if (toolId === 'rembg') {
    flags.push(`--scoped-gpu-rembg-model ${outputDir}/private-rembg-model.onnx`)
  }
  if (toolId === 'transparent_background') {
    flags.push(`--scoped-gpu-transparent-background-checkpoint ${outputDir}/private-transparent-background-checkpoint.pth`)
  }
  return flags
}

function hostPythonGpuCommand(toolId: string): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness --',
    '--attempt-local-runtime',
    ...gpuModelHostRuntimeFlags(toolId),
  ].join(' ')
}

function containerGpuCommandForImage(toolId: string, image: string): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness --',
    '--attempt-local-runtime',
    '--runtime-backend docker_container',
    `--runtime-container-image ${image}`,
    '--runtime-container-platform linux/amd64',
    ...(gpuModelAllowsCpuModelRuntime(toolId) ? ['--no-runtime-container-gpu'] : []),
    ...gpuModelHostRuntimeFlags(toolId),
  ].join(' ')
}

function containerGpuCommand(toolId: string): string {
  return containerGpuCommandForImage(toolId, gpuModelRuntimeContainerImage(toolId))
}

function gpuModelRuntimeContainerTarget(toolId: string) {
  return gpuModelRuntimeContainerTargets[toolId] ?? gpuModelRuntimeContainerTargets.torch_torchvision
}

function gpuModelRuntimeContainerImage(toolId: string): string {
  return gpuModelRuntimeContainerTarget(toolId).image
}

function gpuModelPracticalLocalProofContainerImage(toolId: string): string | null {
  return toolId === 'sam2' || toolId === 'birefnet'
    ? gpuModelRuntimeContainerImage(toolId)
    : null
}

function practicalLocalProofContainerCommand(toolId: string): string | null {
  const image = gpuModelPracticalLocalProofContainerImage(toolId)
  return image ? containerGpuCommandForImage(toolId, image) : null
}

function practicalLocalProofImageProbeCommand(toolId: string): string | null {
  const image = gpuModelPracticalLocalProofContainerImage(toolId)
  if (!image) return null
  const requiredModules = toolId === 'sam2'
    ? ['torch', 'torchvision', 'numpy', 'PIL', 'sam2']
    : [
        'torch',
        'torchvision',
        'transformers',
        'PIL',
        'timm',
        'kornia',
        'einops',
        'scipy',
        'skimage',
        'safetensors',
      ]
  return [
    'docker run --rm --entrypoint python3',
    image,
    '-c',
    `'import importlib.util, json; modules=${JSON.stringify(requiredModules)}; print(json.dumps({"missingModules":[m for m in modules if importlib.util.find_spec(m) is None]}))'`,
  ].join(' ')
}

function containerGpuImageBuildCommand(toolId: string): string {
  const target = gpuModelRuntimeContainerTarget(toolId)
  return [
    'docker buildx build --platform linux/amd64 --target ai_graphics_install_proof',
    `-f ${target.dockerfile}`,
    `-t ${target.image}`,
    '.',
  ].join(' ')
}

function controlledRouteGpuCommand(toolId: string): string {
  return [
    'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke --',
    ...gpuModelControlledRouteFlags(toolId),
  ].join(' ')
}

function gpuModelRuntimeInputManifestModelArgs(toolId: string): string[] {
  if (toolId === 'sam2') {
    return ['--sam2-checkpoint', '<private-sam2-checkpoint.pt>']
  }
  if (toolId === 'birefnet') {
    return [
      '--birefnet-model',
      '<private-birefnet-model-dir-containing-model.safetensors>',
    ]
  }
  if (toolId === 'real_esrgan') {
    return [
      '--real-esrgan-model',
      '<private-real-esrgan-model-dir/RealESRGAN_x4plus.pth>',
    ]
  }
  if (toolId === 'rembg') {
    return ['--rembg-model', '<private-rembg-model.onnx>']
  }
  if (toolId === 'transparent_background') {
    return [
      '--transparent-background-checkpoint',
      '<private-transparent-background-checkpoint.pth>',
    ]
  }
  return []
}

function remainingNativeCudaModelExpectation(toolId: RemainingNativeCudaToolId) {
  if (toolId === 'sam2') {
    return {
      modelField: 'sam2CheckpointLocalPath',
      modelFlag: '--sam2-checkpoint',
      expectedArtifact:
        'SAM2.1 Hiera Tiny checkpoint file, normally sam2.1_hiera_tiny.pt',
      expectedReviewedChecksumSha256:
        '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
      expectedPrivateRootCandidates: [
        'sam2.1_hiera_tiny.pt',
        'sam2/sam2.1_hiera_tiny.pt',
        'sam2/sam2-checkpoint.pt',
        'sam2/checkpoint.pt',
      ],
      sourceEvidence:
        'facebookresearch/sam2 and facebook/sam2.1-hiera-tiny source evidence; private manifest still required',
    }
  }

  return {
    modelField: 'birefnetModelLocalPath',
    modelFlag: '--birefnet-model',
    expectedArtifact:
      'BiRefNet model directory containing model.safetensors',
    expectedReviewedChecksumSha256:
      '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
    expectedPrivateRootCandidates: [
      'birefnet',
      'ZhengPeng7/BiRefNet',
      'BiRefNet',
    ],
    sourceEvidence:
      'ZhengPeng7/BiRefNet Hugging Face source evidence; private manifest still required',
  }
}

function remainingNativeCudaOutputDir(toolId: RemainingNativeCudaToolId): string {
  return `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${toolId}>`
}

function remainingNativeCudaRuntimeInputManifestPath(
  toolId: RemainingNativeCudaToolId,
): string {
  return `${remainingNativeCudaOutputDir(toolId)}/runtime-inputs.json`
}

function remainingNativeCudaRuntimeInputManifestPrivateRootCommand(
  toolId: RemainingNativeCudaToolId,
): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest --',
    `--tool ${toolId}`,
    `--source-image ${gpuModelRuntimeInputManifestSourceImage}`,
    `--private-model-root "$${privateModelRootEnvVar}"`,
    `--output-dir ${remainingNativeCudaOutputDir(toolId)}`,
    `--manifest-out ${remainingNativeCudaRuntimeInputManifestPath(toolId)}`,
    `--model-weight-manifest-id ${toolId}_private_manifest_review_v1`,
    `--model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/${toolId}.json`,
    `--runtime-container-image ${gpuModelRuntimeContainerImage(toolId)}`,
    '--runtime-container-platform linux/amd64',
  ].join(' ')
}

function remainingNativeCudaProofSequenceCommand(
  toolId: RemainingNativeCudaToolId,
): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence --',
    '--attempt-local-runtime',
    '--runtime-backend docker_container',
    `--runtime-container-image ${gpuModelRuntimeContainerImage(toolId)}`,
    '--runtime-container-platform linux/amd64',
    `--tool ${toolId}`,
    `--runtime-input-manifest ${remainingNativeCudaRuntimeInputManifestPath(toolId)}`,
    '--detect-host',
    '--require-host-eligible',
    '--require-accepted-proof',
  ].join(' ')
}

function remainingNativeCudaFinalToolCallCommand(
  toolId: RemainingNativeCudaToolId,
): string {
  return [
    'npm run --silent ai-graphics:external-agent-tool-call --',
    `--tool ${toolId}`,
    '--attempt-gpu-runtime',
    '--expect-state executable',
    '--require-output-hash',
    '--require-private-only-boundary',
    '--strict-exit-code',
    '--runtime-backend docker_container',
    `--runtime-container-image ${gpuModelRuntimeContainerImage(toolId)}`,
    '--runtime-container-platform linux/amd64',
    `--runtime-input-manifest ${remainingNativeCudaRuntimeInputManifestPath(toolId)}`,
  ].join(' ')
}

function remainingNativeCudaReadinessRecheckCommand(
  toolId: RemainingNativeCudaToolId,
): string {
  return [
    'npm run --silent ai-graphics:external-agent-execution-readiness --',
    `--local-runtime-proof-result ${remainingNativeCudaOutputDir(toolId)}/harness-result.json`,
  ].join(' ')
}

function remainingNativeCudaModelRootForInspection(): string | null {
  if (hasFlag('--write-records')) return null
  const explicitRoot = stringFlag('--private-model-root')
  if (explicitRoot) return explicitRoot
  const envRoot = process.env[privateModelRootEnvVar]
  if (envRoot) return envRoot
  return fs.existsSync(defaultPrivateModelRoot) ? defaultPrivateModelRoot : null
}

function remainingNativeCudaCandidatePresent(
  toolId: RemainingNativeCudaToolId,
  root: string,
  candidate: string,
): boolean {
  const candidatePath = path.join(root, candidate)
  if (!fs.existsSync(candidatePath)) return false
  const stats = fs.statSync(candidatePath)
  if (toolId === 'sam2') return stats.isFile()
  return stats.isDirectory() &&
    fs.existsSync(path.join(candidatePath, 'model.safetensors')) &&
    fs.statSync(path.join(candidatePath, 'model.safetensors')).isFile()
}

function inspectRemainingNativeCudaPrivateModelRoot() {
  const root = remainingNativeCudaModelRootForInspection()
  if (!root) {
    return {
      inspected: false,
      privateModelRootEnvVar,
      defaultPrivateModelRoot,
      rootExists: false,
      reason:
        hasFlag('--write-records')
          ? 'skipped_for_write_records_to_avoid_committing_local_private_paths'
          : 'no_private_model_root_supplied_or_detected',
      tools: remainingNativeCudaToolIds.map((toolId) => ({
        toolId,
        modelPresent: false,
        matchingCandidate: null,
      })),
    }
  }
  const rootExists = fs.existsSync(root) && fs.statSync(root).isDirectory()
  return {
    inspected: true,
    privateModelRootEnvVar,
    defaultPrivateModelRoot,
    root,
    rootExists,
    tools: remainingNativeCudaToolIds.map((toolId) => {
      const expectation = remainingNativeCudaModelExpectation(toolId)
      const matchingCandidate = rootExists
        ? expectation.expectedPrivateRootCandidates.find((candidate) =>
            remainingNativeCudaCandidatePresent(toolId, root, candidate))
        : undefined
      return {
        toolId,
        modelPresent: Boolean(matchingCandidate),
        matchingCandidate: matchingCandidate ?? null,
        checkedCandidates: expectation.expectedPrivateRootCandidates,
      }
    }),
  }
}

function remainingNativeCudaClosure(
  toolRows: JsonRecord[],
  currentHostEnvironment: JsonRecord | null,
) {
  const privateModelRootInspection =
    inspectRemainingNativeCudaPrivateModelRoot()
  const toolEntries = remainingNativeCudaToolIds.map((toolId) => {
    const row = toolRows.find((candidate) => candidate.toolId === toolId) ?? {}
    const modelProbe = Array.isArray(privateModelRootInspection.tools)
      ? privateModelRootInspection.tools.find((entry) => entry.toolId === toolId)
      : null
    const expectation = remainingNativeCudaModelExpectation(toolId)
    return {
      toolId,
      currentReadinessState: row.readinessState ?? null,
      callable: row.callable === true,
      executable: row.executable === true,
      currentBlockingPrerequisiteKey:
        row.currentBlockingPrerequisiteKey ?? null,
      currentBlockingReasonCode: row.currentBlockingReasonCode ?? null,
      remainingPrivateRuntimeInputKeys:
        row.remainingPrivateRuntimeInputKeys ?? [],
      modelField: expectation.modelField,
      modelFlag: expectation.modelFlag,
      expectedArtifact: expectation.expectedArtifact,
      expectedReviewedChecksumSha256:
        expectation.expectedReviewedChecksumSha256,
      expectedPrivateRootCandidates:
        expectation.expectedPrivateRootCandidates,
      sourceEvidence: expectation.sourceEvidence,
      privateModelRootCandidatePresent: modelProbe?.modelPresent === true,
      privateModelRootMatchingCandidate:
        modelProbe?.matchingCandidate ?? null,
      manifestMaterializerCommand:
        remainingNativeCudaRuntimeInputManifestPrivateRootCommand(toolId),
      nativeGpuProofSequenceCommand:
        remainingNativeCudaProofSequenceCommand(toolId),
      finalExternalAgentToolCallCommand:
        remainingNativeCudaFinalToolCallCommand(toolId),
      readinessRecheckCommand:
        remainingNativeCudaReadinessRecheckCommand(toolId),
      requiredHost:
        'native linux/amd64 host with Docker NVIDIA runtime, nvidia-smi, CUDA visible to the proof container, and reviewed private model/source inputs',
      gpuRuntimeStartsIdle: false,
      gpuStartsOnlyDuringScopedToolCall: true,
    }
  })

  return {
    status:
      toolEntries.every((entry) => entry.executable)
        ? 'remaining_native_cuda_tools_executable'
        : 'remaining_native_cuda_tools_blocked_pending_native_host_and_private_model_inputs',
    purpose:
      'Fast closeout for the only two tools that still require native CUDA proof instead of CPU foundation/tensor/model proof.',
    remainingToolIds: toolEntries
      .filter((entry) => entry.executable !== true)
      .map((entry) => entry.toolId),
    remainingToolCount: toolEntries.filter((entry) => entry.executable !== true).length,
    privateModelRootInspection,
    currentHostEligibleForNativeGpuProof:
      currentHostEnvironment?.hostEligibleForNativeGpuProof === true,
    currentHostBlockers: Array.isArray(currentHostEnvironment?.blockers)
      ? currentHostEnvironment.blockers
      : [],
    currentHostPreflightCommand:
      'npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible',
    tools: toolEntries,
    all21CloseoutReadinessCommand:
      [
        'npm run --silent ai-graphics:external-agent-execution-readiness --',
        '--local-runtime-proof-result <accepted-proof-for-torch_torchvision-or-foundation-bundle.json>',
        '--local-runtime-proof-result <accepted-proof-for-real_esrgan.json>',
        '--local-runtime-proof-result <accepted-proof-for-rembg.json>',
        '--local-runtime-proof-result <accepted-proof-for-transparent_background.json>',
        `--local-runtime-proof-result ${remainingNativeCudaOutputDir('sam2')}/harness-result.json`,
        `--local-runtime-proof-result ${remainingNativeCudaOutputDir('birefnet')}/harness-result.json`,
      ].join(' '),
    noScopeExpansion: {
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      gpuRuntimeStartsIdle: false,
      modelDownloadPerformed: false,
      providerRuntimePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function gpuModelRuntimeInputManifestMaterializerCommand(
  toolId: string,
): string | null {
  if (!gpuModelRequiresModelWeightManifest(toolId)) return null
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest --',
    `--tool ${toolId}`,
    `--source-image ${gpuModelRuntimeInputManifestSourceImage}`,
    ...gpuModelRuntimeInputManifestModelArgs(toolId),
    `--output-dir ${gpuModelRuntimeInputManifestOutputDir}`,
    `--manifest-out ${gpuModelRuntimeInputManifestPath}`,
    '--model-weight-manifest-id <reviewed-private-model-weight-manifest-id>',
    `--model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/${toolId}.json`,
    `--runtime-container-image ${gpuModelRuntimeContainerImage(toolId)}`,
    '--runtime-container-platform linux/amd64',
    ...(gpuModelAllowsCpuModelRuntime(toolId) ? ['--allow-cpu-model-runtime'] : []),
  ].join(' ')
}

function gpuModelRuntimeInputManifestPrivateRootMaterializerCommand(
  toolId: string,
): string | null {
  if (!gpuModelRequiresModelWeightManifest(toolId)) return null
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest --',
    `--tool ${toolId}`,
    `--source-image ${gpuModelRuntimeInputManifestSourceImage}`,
    '--private-model-root "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
    `--output-dir ${gpuModelRuntimeInputManifestOutputDir}`,
    `--manifest-out ${gpuModelRuntimeInputManifestPath}`,
    '--model-weight-manifest-id <reviewed-private-model-weight-manifest-id>',
    `--model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/${toolId}.json`,
    `--runtime-container-image ${gpuModelRuntimeContainerImage(toolId)}`,
    '--runtime-container-platform linux/amd64',
    ...(gpuModelAllowsCpuModelRuntime(toolId) ? ['--allow-cpu-model-runtime'] : []),
  ].join(' ')
}

function gpuModelRuntimeInputManifestScopedToolCallCommand(
  toolId: string,
): string | null {
  if (!gpuModelRequiresModelWeightManifest(toolId)) return null
  return [
    'npm run --silent ai-graphics:external-agent-tool-call --',
    `--tool ${toolId}`,
    '--attempt-gpu-runtime',
    '--runtime-backend docker_container',
    ...(gpuModelAllowsCpuModelRuntime(toolId) ? ['--allow-cpu-model-runtime', '--no-runtime-container-gpu'] : []),
    `--runtime-input-manifest ${gpuModelRuntimeInputManifestPath}`,
  ].join(' ')
}

function gpuModelRuntimeInputManifestHarnessCommand(
  toolId: string,
): string | null {
  if (!gpuModelRequiresModelWeightManifest(toolId)) return null
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness --',
    '--attempt-local-runtime',
    `--tool ${toolId}`,
    ...(gpuModelAllowsCpuModelRuntime(toolId) ? ['--allow-cpu-model-runtime'] : []),
    `--runtime-input-manifest ${gpuModelRuntimeInputManifestPath}`,
    `--result-out ${gpuModelRuntimeInputManifestOutputDir}/harness-result.json`,
  ].join(' ')
}

function proofRefBridgeCommand(): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge --',
    '--local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  ].join(' ')
}

function directReadinessWithPrivateProofCommand(): string {
  return [
    'npm run --silent ai-graphics:external-agent-execution-readiness --',
    '--local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  ].join(' ')
}

function hostDetectionReadinessCommand(): string {
  return [
    'npm run --silent ai-graphics:external-agent-execution-readiness --',
    '--detect-host',
  ].join(' ')
}

function nextGpuCommand(toolId: string): string {
  return toolId === 'kornia' || gpuModelAllowsCpuModelRuntime(toolId)
    ? containerGpuCommand(toolId)
    : hostPythonGpuCommand(toolId)
}

function gpuModelRuntimeBackendDescription(toolId: string): string {
  if (gpuModelAllowsCpuTensorRuntime(toolId)) {
    return 'Use the explicit CPU tensor runtime path first; it proves Kornia with a private source frame and does not start GPU.'
  }
  if (gpuModelAllowsCpuFoundationRuntime(toolId)) {
    return 'Use the explicit CPU foundation runtime path first; it proves bounded package/runtime checks and does not start GPU.'
  }
  if (gpuModelAllowsCpuModelRuntime(toolId)) {
    return 'Use the explicit CPU model runtime path with reviewed private model weights and private source input first; it does not attach GPU, download models, or create public outputs.'
  }
  return 'Use an approved native CUDA host with reviewed private model/checkpoint and source-frame inputs.'
}

function gpuModelExecutionUnlockPlan(input: {
  toolId: string
  currentBlockingPrerequisiteKey: string | null
  currentBlockingReasonCode: string | null
  remainingPrivateRuntimeInputKeys: string[]
  minimumPrivateRuntimeInputKeys: string[]
}): JsonRecord[] {
  const {
    toolId,
    currentBlockingPrerequisiteKey,
    currentBlockingReasonCode,
    remainingPrivateRuntimeInputKeys,
    minimumPrivateRuntimeInputKeys,
  } = input

  const steps: JsonRecord[] = [
    {
      step: 1,
      action: 'resolve_current_blocker',
      currentBlockingPrerequisiteKey,
      currentBlockingReasonCode,
      remainingPrivateRuntimeInputKeys,
      minimumPrivateRuntimeInputKeys,
      note:
        'Resolve this prerequisite with private local inputs only; missing private model/source files are blockers, not success.',
    },
  ]

  const runtimeInputManifestCommand =
    gpuModelRuntimeInputManifestMaterializerCommand(toolId)
  const privateRootRuntimeInputManifestCommand =
    gpuModelRuntimeInputManifestPrivateRootMaterializerCommand(toolId)
  if (runtimeInputManifestCommand) {
    steps.push({
      step: steps.length + 1,
      action: 'materialize_model_weight_runtime_input_manifest',
      command: runtimeInputManifestCommand,
      privateModelRootCommand: privateRootRuntimeInputManifestCommand,
      privateModelRootEnvVar: 'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT',
      manifestOut: gpuModelRuntimeInputManifestPath,
      outputDirectory: gpuModelRuntimeInputManifestOutputDir,
      nextScopedToolCallCommand:
        gpuModelRuntimeInputManifestScopedToolCallCommand(toolId),
      nextHarnessCommand: gpuModelRuntimeInputManifestHarnessCommand(toolId),
      requiresReviewedPrivateModelWeightManifest: true,
      checksumComputedFromPrivateModelFile: true,
      gpuStartsDuringManifestMaterialization: false,
      privateOutputOnly: true,
    })
  }

  steps.push(
    {
      step: steps.length + 1,
      action: 'prepare_runtime_surface',
      preferredBackend: toolId === 'kornia'
        ? 'docker_container_cpu_tensor'
        : gpuModelAllowsCpuFoundationRuntime(toolId)
        ? 'host_python_or_docker_container_cpu_foundation'
        : gpuModelAllowsCpuModelRuntime(toolId)
        ? 'docker_container_cpu_model'
        : 'native_cuda_host_or_cuda_container',
      runtimePolicy: gpuModelRuntimeBackendDescription(toolId),
      runtimeContainerImage: gpuModelRuntimeContainerImage(toolId),
      runtimeContainerProfile: gpuModelRuntimeContainerTarget(toolId).profile,
      buildCommand: containerGpuImageBuildCommand(toolId),
      practicalLocalProofContainerImage:
        gpuModelPracticalLocalProofContainerImage(toolId),
      practicalLocalProofImageProbeCommand:
        practicalLocalProofImageProbeCommand(toolId),
      practicalLocalProofContainerCommand:
        practicalLocalProofContainerCommand(toolId),
      practicalLocalProofNote:
        gpuModelPracticalLocalProofContainerImage(toolId)
          ? 'Use this already-built shared proof image only for local private proof when the dedicated runtime proof tag is absent; canonical dedicated runtime image remains the production-shaped target.'
          : null,
      gpuStartsDuringBuild: false,
      gpuStartsIdle: false,
    },
    {
      step: steps.length + 2,
      action: 'run_scoped_private_local_runtime_proof',
      hostPythonCommand: hostPythonGpuCommand(toolId),
      containerCommand: containerGpuCommand(toolId),
      practicalLocalProofContainerCommand:
        practicalLocalProofContainerCommand(toolId),
      startsGpuOnlyForThisToolCall:
        !gpuModelAllowsCpuTensorRuntime(toolId) &&
        !gpuModelAllowsCpuFoundationRuntime(toolId) &&
        !gpuModelAllowsCpuModelRuntime(toolId),
      privateOutputOnly: true,
    },
    {
      step: steps.length + 3,
      action: 'bridge_private_runtime_proof_ref',
      command: proofRefBridgeCommand(),
      requiresLocalOnlyResult:
        '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
    },
    {
      step: steps.length + 4,
      action: 'recompute_external_agent_readiness_with_private_proof',
      command: directReadinessWithPrivateProofCommand(),
      successCriteria:
        'Only this tool may move from blocked_with_reason to executable after structured private runtime output and proof-ref bridge acceptance.',
    },
    {
      step: steps.length + 5,
      action: 'retry_controlled_route_with_accepted_private_proof',
      command: controlledRouteGpuCommand(toolId),
      productionStillBlocked: true,
      publicArtifactsStillBlocked: true,
    },
  )

  return steps
}

function mergeGpuHarnessWithPrivateProof(
  sourceHarness: JsonRecord,
  suppliedPrivateProofs: JsonRecord[] = [],
): JsonRecord {
  if (suppliedPrivateProofs.length === 0) return sourceHarness

  const sourceRows = Array.isArray(
    sourceHarness.gpuModelLocalDevRuntimeExecutionHarnessRows,
  )
    ? sourceHarness.gpuModelLocalDevRuntimeExecutionHarnessRows
    : []
  const suppliedRows = suppliedPrivateProofs.flatMap((proof) => (
    Array.isArray(proof.gpuModelLocalDevRuntimeExecutionHarnessRows)
      ? proof.gpuModelLocalDevRuntimeExecutionHarnessRows
      : []
  ))
  const rowsByTool = new Map<string, JsonRecord>(
    sourceRows.map((row: JsonRecord) => [String(row.toolId), row]),
  )
  const suppliedToolIds = new Set<string>()
  for (const row of suppliedRows) {
    if (typeof row?.toolId !== 'string') continue
    assert(
      !suppliedToolIds.has(row.toolId),
      `duplicate supplied GPU/model local proof tool across proof bundles: ${row.toolId}`,
    )
    suppliedToolIds.add(row.toolId)
    rowsByTool.set(row.toolId, row)
  }

  return {
    ...sourceHarness,
    privateLocalRuntimeProofMergedIntoRows: true,
    suppliedPrivateLocalRuntimeProofResults: {
      proofBundles: suppliedPrivateProofs.length,
      suppliedRows: suppliedRows.length,
    },
    gpuModelLocalDevRuntimeExecutionHarnessRows: [...rowsByTool.values()],
  }
}

function gpuModelInstallProofForTool(
  toolId: string,
  gpuInstallProof: JsonRecord,
): JsonRecord | null {
  if (!gpuModelTools.has(toolId)) return null

  const toolRecord = Array.isArray(gpuInstallProof.tools)
    ? gpuInstallProof.tools.find((row: JsonRecord) => row.toolId === toolId)
    : null
  const profileIds = Array.isArray(toolRecord?.profiles)
    ? toolRecord.profiles.filter(
        (profileId: unknown): profileId is string => typeof profileId === 'string',
      )
    : []
  const primaryProfileId = profileIds.includes(toolId)
    ? toolId
    : profileIds[0] ?? null
  const evidenceRows = Array.isArray(gpuInstallProof.localBuildEvidence)
    ? gpuInstallProof.localBuildEvidence.filter((row: JsonRecord) => (
        typeof row?.profileId === 'string' && profileIds.includes(row.profileId)
      ))
    : []
  const primaryEvidence = evidenceRows.find((row: JsonRecord) => (
    row.profileId === primaryProfileId
  )) ?? evidenceRows[0] ?? null
  const profileRows = Array.isArray(gpuInstallProof.profiles)
    ? gpuInstallProof.profiles.filter((row: JsonRecord) => (
        typeof row?.profileId === 'string' && profileIds.includes(row.profileId)
      ))
    : []
  const primaryProfile = profileRows.find((row: JsonRecord) => (
    row.profileId === primaryProfileId
  )) ?? profileRows[0] ?? null
  const installProofTargetPrepared =
    String(toolRecord?.status ?? '').includes('install_proof_target_prepared') &&
    evidenceRows.some((row: JsonRecord) => row.status === 'passed')
  const importSmokePassed = evidenceRows.some((row: JsonRecord) => (
    row.importSmokeStatus === 'passed'
  ))

  return {
    sourceEvidence: gpuModelInstallBuildTargetsPath,
    proofScope: gpuInstallProof.proofScope ?? null,
    toolStatus: toolRecord?.status ?? null,
    runtimeTarget: toolRecord?.runtimeTarget ?? null,
    profiles: profileIds,
    primaryProfile: primaryProfileId,
    primaryDockerfile: primaryProfile?.dockerfile ?? primaryEvidence?.dockerfile ?? null,
    primaryTarget: primaryProfile?.target ?? primaryEvidence?.target ?? null,
    primaryPlatform: primaryEvidence?.platform ?? 'linux/amd64',
    primaryBuildCommand: primaryEvidence?.command ?? null,
    primaryImportSmokeCommand: primaryProfile?.smokeCommand ?? null,
    installProofTargetPrepared,
    importSmokePassed,
    localBuildEvidenceStatuses: evidenceRows.map((row: JsonRecord) => ({
      profileId: row.profileId,
      status: row.status ?? null,
      importSmokeStatus: row.importSmokeStatus ?? null,
    })),
    appBundleRequiredForInstallProof:
      profileRows.some((row: JsonRecord) => row.appBundleRequiredForInstallProof === true),
    modelWeightsRequiredForInstallProof:
      profileRows.some((row: JsonRecord) => row.modelWeightsRequiredForInstallProof === true),
    nativeGpuRuntimeUsedInInstallProof:
      evidenceRows.some((row: JsonRecord) => row.nvidiaRuntimeUsed === true),
    modelWeightsLoadedInInstallProof:
      evidenceRows.some((row: JsonRecord) => row.modelWeightsLoaded === true),
    mediaProcessedInInstallProof:
      evidenceRows.some((row: JsonRecord) => row.mediaProcessed === true),
    providerRuntimeUsedInInstallProof:
      evidenceRows.some((row: JsonRecord) => row.providerRuntimeUsed === true),
    publicArtifactCreatedInInstallProof:
      evidenceRows.some((row: JsonRecord) => row.publicArtifactCreated === true),
    signedUrlCreatedInInstallProof:
      evidenceRows.some((row: JsonRecord) => row.signedUrlCreated === true),
    runtimeProofStillRequired:
      gpuInstallProof.booleans?.nativeGpuRuntimeStillRequired === true,
  }
}

function buildToolRows(
  routeSmoke: JsonRecord,
  gpuHarness: JsonRecord,
  gpuProofRefBridge: JsonRecord,
  controlledWorkerRouteSmoke: JsonRecord,
  gpuInstallProof: JsonRecord,
) {
  const routeRows = new Map<string, JsonRecord>(
    (Array.isArray(routeSmoke.results) ? routeSmoke.results : [])
      .map((row: JsonRecord) => [row.toolId, row]),
  )
  const workerRouteRows = new Map<string, JsonRecord>(
    (
      Array.isArray(controlledWorkerRouteSmoke.controlledWorkerRouteResults)
        ? controlledWorkerRouteSmoke.controlledWorkerRouteResults
        : []
    ).map((row: JsonRecord) => [row.toolId, row]),
  )
  const workerBlockedGpuRows = new Map<string, JsonRecord>(
    (
      Array.isArray(controlledWorkerRouteSmoke.blockedGpuModelResults)
        ? controlledWorkerRouteSmoke.blockedGpuModelResults
        : []
    ).map((row: JsonRecord) => [row.toolId, row]),
  )
  const gpuRows = new Map<string, JsonRecord>(
    (
      Array.isArray(gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows)
        ? gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows
        : []
    ).map((row: JsonRecord) => [row.toolId, row]),
  )
  const bridgeRows = new Map<string, JsonRecord>(
    (
      Array.isArray(gpuProofRefBridge.gpuModelRuntimeProofRefBridgeRows)
        ? gpuProofRefBridge.gpuModelRuntimeProofRefBridgeRows
        : []
    ).map((row: JsonRecord) => [row.toolId, row]),
  )

  return AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const readiness = getAiGraphicsToolCallReadiness(toolId)
    assert(readiness, `Missing tool-call readiness record for ${toolId}`)
    const group = groupForTool(toolId)
    const routeRow = routeRows.get(toolId)
    assert(routeRow, `Missing all-21 route smoke row for ${toolId}`)
    const workerRouteRow = workerRouteRows.get(toolId)
    const workerBlockedGpuRow = workerBlockedGpuRows.get(toolId)
    const gpuRow = gpuRows.get(toolId)
    const bridgeRow = groupForTool(toolId) === 'gpu_model'
      ? bridgeRows.get(toolId)
      : undefined

    const routeCallable =
      routeRow.statusCode === 200 && routeRow.controlledAdapterInvokedNow === true
    const adapterReachable = routeCallable
    const controlledWorkerRouteAccepted = group === 'gpu_model'
      ? workerBlockedGpuRow?.statusCode === 409 &&
        workerBlockedGpuRow?.blocked === true &&
        workerBlockedGpuRow?.gpuRuntimeShouldStartNow === false &&
        workerBlockedGpuRow?.agentCanExecuteToolsNow === false
      : workerRouteRow?.routeStatusCode === 200 &&
        workerRouteRow?.routeOk === true &&
        workerRouteRow?.controlledAdapterExecutedNow === true &&
        workerRouteRow?.localControlledPackageExecutionPerformed === true &&
        workerRouteRow?.mockQueueJobIdPresent === true &&
        workerRouteRow?.mockWorkerClaimIdPresent === true &&
        workerRouteRow?.mockWorkerEventIdPresent === true &&
        typeof workerRouteRow?.outputSha256 === 'string' &&
        workerRouteRow.outputSha256.length === 64 &&
        workerRouteRow?.publicArtifactCreated === false &&
        workerRouteRow?.signedUrlCreated === false &&
        workerRouteRow?.gpuRuntimeShouldStartNow === false &&
        workerRouteRow?.workerDispatchPerformed === false
    const gpuAdapterStatus = String(gpuRow?.adapterStatus ?? '')
    const gpuRuntimeSucceeded = gpuRow?.localRuntimeExecutionPerformed === true
    const routeSubmissionAccepted =
      bridgeRow?.routeSubmissionReadyWithAcceptedPrivateProof === true
    const gpuRuntimeFailed =
      gpuAdapterStatus === 'controlled_gpu_model_adapter_failed_before_output'
    const gpuInstallProofRow =
      group === 'gpu_model'
        ? gpuModelInstallProofForTool(toolId, gpuInstallProof)
        : null
    const executionAttempted =
      group === 'gpu_model'
        ? gpuRuntimeSucceeded || gpuRuntimeFailed
        : routeRow.controlledAdapterExecutedNow === true
    const executionPassed =
      group === 'gpu_model'
        ? gpuRuntimeSucceeded &&
          gpuRow?.toolExecutionApprovedNow === true &&
          routeSubmissionAccepted
        : routeRow.controlledAdapterExecutedNow === true &&
          routeRow.localPackageExecutionPerformed === true &&
          controlledWorkerRouteAccepted &&
          typeof routeRow.outputSha256 === 'string' &&
          routeRow.outputSha256.length === 64
    const failed =
      !routeCallable ||
      (executionAttempted && !executionPassed) ||
      routeRow.publicArtifactCreated === true ||
      routeRow.signedUrlCreated === true ||
      routeRow.gpuRuntimeShouldStartNow === true && group !== 'gpu_model'
    const readinessState: ReadinessState = failed
      ? 'failed_with_diagnostics'
      : executionPassed
      ? 'executable'
      : group === 'gpu_model'
      ? 'blocked_with_reason'
      : 'callable'

    const minimumPrivateRuntimeInputKeys = group === 'gpu_model'
      ? gpuModelMinimumPrivateRuntimeInputKeys(toolId)
      : []
    const blockingPrerequisite = group === 'gpu_model' && !executionPassed
      ? [
          gpuModelRuntimePrerequisiteLabel(toolId),
          ...minimumPrivateRuntimeInputKeys,
          'reviewed private proof refs',
          gpuRow?.skipReasonCode
            ? `adapter skip reason: ${gpuRow.skipReasonCode}`
            : gpuRow?.errorMessage
            ? `adapter error: ${gpuRow.errorMessage}`
            : gpuRuntimeSucceeded && !routeSubmissionAccepted
            ? `proof bridge status: ${bridgeRow?.proofRefBridgeStatus ?? 'missing'}`
            : 'local runtime not attempted',
        ].join('; ')
      : null
    const currentBlockingPrerequisiteKey = group === 'gpu_model' && !executionPassed
      ? gpuModelCurrentBlockingPrerequisiteKey(toolId, gpuRow?.skipReasonCode)
      : null
    const remainingPrivateRuntimeInputKeys =
      group === 'gpu_model' && !executionPassed
        ? currentBlockingPrerequisiteKey
          ? minimumPrivateRuntimeInputKeys.filter(
              (key) => key !== currentBlockingPrerequisiteKey,
            )
          : minimumPrivateRuntimeInputKeys
        : []

    return {
      toolId,
      displayName: readiness.displayName,
      packageName: readiness.packageName,
      installSurface: readiness.installSurface,
      installStatus: readiness.installStatus,
      installEvidence: readiness.installEvidence,
      packageRuntimePresentForPlannedSurface: true,
      packageRuntimeInstallProofPresent: group === 'gpu_model'
        ? gpuInstallProofRow?.installProofTargetPrepared === true &&
          gpuInstallProofRow?.importSmokePassed === true
        : true,
      packageRuntimeInstallProofSource: group === 'gpu_model'
        ? gpuInstallProofRow?.sourceEvidence ?? null
        : 'node/package runtime proof records',
      packageRuntimeInstallProofStatus: group === 'gpu_model'
        ? gpuInstallProofRow?.toolStatus ?? null
        : 'controlled_package_runtime_proof_passed',
      packageRuntimeInstallProofProfiles: group === 'gpu_model'
        ? gpuInstallProofRow?.profiles ?? []
        : [],
      packageRuntimeInstallProofPrimaryProfile: group === 'gpu_model'
        ? gpuInstallProofRow?.primaryProfile ?? null
        : null,
      packageRuntimeInstallProofPrimaryDockerfile: group === 'gpu_model'
        ? gpuInstallProofRow?.primaryDockerfile ?? null
        : null,
      packageRuntimeInstallProofPrimaryTarget: group === 'gpu_model'
        ? gpuInstallProofRow?.primaryTarget ?? null
        : null,
      packageRuntimeInstallProofPrimaryPlatform: group === 'gpu_model'
        ? gpuInstallProofRow?.primaryPlatform ?? null
        : null,
      packageRuntimeInstallProofPrimaryBuildCommand: group === 'gpu_model'
        ? gpuInstallProofRow?.primaryBuildCommand ?? null
        : null,
      packageRuntimeInstallProofPrimaryImportSmokeCommand: group === 'gpu_model'
        ? gpuInstallProofRow?.primaryImportSmokeCommand ?? null
        : null,
      packageRuntimeInstallProofImportSmokePassed: group === 'gpu_model'
        ? gpuInstallProofRow?.importSmokePassed === true
        : true,
      packageRuntimeInstallProofTargetPrepared: group === 'gpu_model'
        ? gpuInstallProofRow?.installProofTargetPrepared === true
        : true,
      packageRuntimeInstallProofRuntimeTarget: group === 'gpu_model'
        ? gpuInstallProofRow?.runtimeTarget ?? null
        : readiness.runtimeTarget,
      packageRuntimeInstallProofNativeGpuRuntimeUsed: group === 'gpu_model'
        ? gpuInstallProofRow?.nativeGpuRuntimeUsedInInstallProof === true
        : false,
      packageRuntimeInstallProofModelWeightsRequired: group === 'gpu_model'
        ? gpuInstallProofRow?.modelWeightsRequiredForInstallProof === true
        : false,
      packageRuntimeInstallProofModelWeightsLoaded: group === 'gpu_model'
        ? gpuInstallProofRow?.modelWeightsLoadedInInstallProof === true
        : false,
      packageRuntimeInstallProofMediaProcessed: group === 'gpu_model'
        ? gpuInstallProofRow?.mediaProcessedInInstallProof === true
        : false,
      packageRuntimeInstallProofProviderRuntimeUsed: group === 'gpu_model'
        ? gpuInstallProofRow?.providerRuntimeUsedInInstallProof === true
        : false,
      packageRuntimeInstallProofPublicArtifactCreated: group === 'gpu_model'
        ? gpuInstallProofRow?.publicArtifactCreatedInInstallProof === true
        : false,
      packageRuntimeInstallProofSignedUrlCreated: group === 'gpu_model'
        ? gpuInstallProofRow?.signedUrlCreatedInInstallProof === true
        : false,
      packageRuntimeInstallProofRuntimeProofStillRequired: group === 'gpu_model'
        ? gpuInstallProofRow?.runtimeProofStillRequired === true
        : false,
      controlledExecutionRuntimePresentNow: executionPassed,
      installReadinessState: group === 'gpu_model'
        ? executionPassed
          ? 'controlled_runtime_present_and_executed_with_private_local_proof'
          : gpuModelBlockedInstallReadinessState(toolId)
        : 'controlled_runtime_present_and_executed',
      primaryCapability: routeRow.capabilityId,
      group,
      callable: routeCallable,
      executable: executionPassed,
      blockedWithReason: readinessState === 'blocked_with_reason',
      failedWithDiagnostics: readinessState === 'failed_with_diagnostics',
      readinessState,
      routeCallable,
      adapterReachable,
      executionAttempted,
      executionPassed,
      outputKind: routeRow.outputKind ?? null,
      outputSha256: routeRow.outputSha256 ?? null,
      controlledWorkerRouteEvidenceAccepted: controlledWorkerRouteAccepted,
      controlledWorkerRouteStatus: group === 'gpu_model'
        ? workerBlockedGpuRow?.statusCode === 409
          ? 'blocked_with_reason'
          : null
        : workerRouteRow?.routeStatus ?? null,
      controlledWorkerRouteOutputSha256: workerRouteRow?.outputSha256 ?? null,
      mockWorkerQueueJobCreated:
        group === 'gpu_model'
          ? false
          : workerRouteRow?.mockQueueJobIdPresent === true,
      mockWorkerClaimPerformed:
        group === 'gpu_model'
          ? false
          : workerRouteRow?.mockWorkerClaimIdPresent === true,
      mockWorkerEventRecorded:
        group === 'gpu_model'
          ? false
          : workerRouteRow?.mockWorkerEventIdPresent === true,
      controlledWorkerRouteExecutedNow:
        group === 'gpu_model' ? false : controlledWorkerRouteAccepted,
      controlledWorkerRouteGpuBlocked:
        group === 'gpu_model' ? controlledWorkerRouteAccepted : false,
      blockingPrerequisite,
      recommendedGpuProofBackend: group === 'gpu_model'
        ? toolId === 'kornia'
          ? 'docker_container'
          : 'host_python_or_docker_container'
        : null,
      currentBlockingPrerequisiteKey,
      currentBlockingReasonCode: group === 'gpu_model' && !executionPassed
        ? gpuRow?.skipReasonCode ?? null
        : null,
      remainingPrivateRuntimeInputKeys,
      minimumPrivateRuntimeInputKeys,
      minimumHostRuntimeFlags: group === 'gpu_model'
        ? gpuModelHostRuntimeFlags(toolId)
        : [],
      minimumControlledRouteFlags: group === 'gpu_model'
        ? gpuModelControlledRouteFlags(toolId)
        : [],
      fastestGpuModelUnlockCandidate: toolId === 'kornia',
      nextExactCommand: group === 'gpu_model'
        ? nextGpuCommand(toolId)
        : 'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke',
      nextExactHostPythonCommand: group === 'gpu_model'
        ? hostPythonGpuCommand(toolId)
        : null,
      nextExactContainerCommand: group === 'gpu_model'
        ? containerGpuCommand(toolId)
        : null,
      nextExactPracticalLocalProofContainerCommand: group === 'gpu_model'
        ? practicalLocalProofContainerCommand(toolId)
        : null,
      nextExactPracticalLocalProofImageProbeCommand: group === 'gpu_model'
        ? practicalLocalProofImageProbeCommand(toolId)
        : null,
      nextExactContainerBuildCommand: group === 'gpu_model'
        ? containerGpuImageBuildCommand(toolId)
        : null,
      nextExactControlledRouteCommand: group === 'gpu_model'
        ? controlledRouteGpuCommand(toolId)
        : null,
      nextExactRuntimeInputManifestMaterializerCommand: group === 'gpu_model'
        ? gpuModelRuntimeInputManifestMaterializerCommand(toolId)
        : null,
      nextExactRuntimeInputManifestPrivateRootMaterializerCommand:
        group === 'gpu_model'
          ? gpuModelRuntimeInputManifestPrivateRootMaterializerCommand(toolId)
          : null,
      nextExactRuntimeInputManifestPath:
        group === 'gpu_model' && gpuModelRequiresModelWeightManifest(toolId)
          ? gpuModelRuntimeInputManifestPath
          : null,
      nextExactRuntimeInputManifestScopedToolCallCommand:
        group === 'gpu_model'
          ? gpuModelRuntimeInputManifestScopedToolCallCommand(toolId)
          : null,
      nextExactRuntimeInputManifestHarnessCommand: group === 'gpu_model'
        ? gpuModelRuntimeInputManifestHarnessCommand(toolId)
        : null,
      nextExactProofRefBridgeCommand: group === 'gpu_model'
        ? proofRefBridgeCommand()
        : null,
      executionUnlockPlan: group === 'gpu_model'
        ? gpuModelExecutionUnlockPlan({
            toolId,
            currentBlockingPrerequisiteKey,
            currentBlockingReasonCode: gpuRow?.skipReasonCode ?? null,
            remainingPrivateRuntimeInputKeys,
            minimumPrivateRuntimeInputKeys,
          })
        : [],
      proofRefBridgeStatus: group === 'gpu_model'
        ? bridgeRow?.proofRefBridgeStatus ?? null
        : null,
      routeSubmissionReadyWithAcceptedPrivateProof: group === 'gpu_model'
        ? routeSubmissionAccepted
        : false,
      routeStatus: routeRow.routeStatus ?? null,
      adapterStatus: group === 'gpu_model'
        ? gpuRow?.adapterStatus ?? routeRow.routeStatus ?? null
        : routeRow.routeStatus ?? null,
      adapterErrorMessage: group === 'gpu_model'
        ? gpuRow?.errorMessage ?? null
        : null,
      gpuRuntimeShouldStartNow: false,
      sourceGpuRuntimeShouldStartDuringScopedProof:
        group === 'gpu_model'
          ? gpuRow?.gpuRuntimeShouldStartNow === true
          : false,
      publicArtifactCreated:
        routeRow.publicArtifactCreated === true ||
        gpuRow?.publicArtifactCreated === true,
      signedUrlCreated:
        routeRow.signedUrlCreated === true ||
        gpuRow?.signedUrlCreated === true,
      workerDispatchPerformed: routeRow.workerDispatchPerformed === true,
      providerRuntimePerformed: routeRow.providerRuntimePerformed === true,
      runtimeReadyNow:
        routeRow.runtimeReadyNow === true ||
        gpuRow?.runtimeReadyNow === true,
      externalBetaReadyNow:
        routeRow.externalBetaReadyNow === true ||
        gpuRow?.externalBetaReadyNow === true,
      productionReadyNow:
        routeRow.productionReadyNow === true ||
        gpuRow?.productionReadyNow === true,
      sourceEvidence: {
        routeSmoke:
          'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
        gpuLocalDevHarness: group === 'gpu_model'
          ? 'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json'
          : null,
        gpuRuntimeProofRefBridge: group === 'gpu_model'
          ? 'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json'
          : null,
        executionGate:
          'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
        controlledWorkerRouteSmoke:
          'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
        gpuModelInstallBuildTargets: group === 'gpu_model'
          ? gpuModelInstallBuildTargetsPath
          : null,
      },
    }
  })
}

function buildReport() {
  const localRuntimeProofResultPaths = stringFlags('--local-runtime-proof-result')
  if (localRuntimeProofResultPaths.length > 0 && hasFlag('--write-records')) {
    throw new Error(
      '--write-records cannot be combined with --local-runtime-proof-result; private proof results must stay local-only.',
    )
  }
  if (hasFlag('--write-records') && hasFlag('--detect-host')) {
    throw new Error(
      '--write-records cannot be combined with --detect-host; host-specific GPU proof preflight must stay local-only.',
    )
  }
  if (
    localRuntimeProofResultPaths.length > 0 &&
    stringFlag('--gpu-runtime-proof-ref-bridge-packet')
  ) {
    throw new Error(
      '--local-runtime-proof-result cannot be combined with --gpu-runtime-proof-ref-bridge-packet.',
    )
  }

  const routeSmoke = sourceReport(
    '--all21-route-smoke-packet',
    'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
    'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke',
  )
  const sourceGpuHarness = sourceReport(
    '--gpu-local-dev-harness-packet',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness',
  )
  const suppliedPrivateLocalRuntimeProofs = localRuntimeProofResultPaths.map((proofPath) => readJson(proofPath))
  const gpuHarness = mergeGpuHarnessWithPrivateProof(
    sourceGpuHarness,
    suppliedPrivateLocalRuntimeProofs,
  )
  const executionGate = readJson(
    stringFlag('--execution-gate-packet') ??
      'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  )
  const gpuInstallProof = readJson(
    stringFlag('--gpu-model-install-build-targets-packet') ??
      gpuModelInstallBuildTargetsPath,
  )
  const gpuProofRefBridge = localRuntimeProofResultPaths.length > 0
    ? runJsonFileCommand('npm', [
        'run',
        '--silent',
        'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge',
        '--',
        ...localRuntimeProofResultPaths.flatMap((proofPath) => [
          '--local-runtime-proof-result',
          proofPath,
        ]),
      ])
    : readJson(
        stringFlag('--gpu-runtime-proof-ref-bridge-packet') ??
          'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
      )
  const currentHostGpuProofPreflight = hasFlag('--detect-host')
    ? runJsonFileCommand('npm', [
        'run',
        '--silent',
        'ai-graphics:gpu-runtime-proof-local-preflight',
        '--',
        '--detect-host',
      ])
    : null
  const controlledWorkerRouteSmoke = sourceReport(
    '--controlled-worker-route-smoke-packet',
    'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
    'npm run --silent ai-graphics:external-agent-controlled-worker-route-execution-smoke',
  )

  assert(
    routeSmoke.decision ===
      'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed',
    'all-21 controlled route smoke decision mismatch',
  )
  assert(
      sourceGpuHarness.decision ===
      'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks',
    'GPU/model local-dev harness decision mismatch',
  )
  for (const suppliedPrivateLocalRuntimeProof of suppliedPrivateLocalRuntimeProofs) {
    assert(
      suppliedPrivateLocalRuntimeProof.decision ===
        'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks',
      'supplied private GPU/model local-dev proof decision mismatch',
    )
  }
  assert(
    executionGate.decision ===
      'ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings',
    'external-agent execution gate decision mismatch',
  )
  assert(
    gpuProofRefBridge.decision ===
      'ai_graphics_external_agent_gpu_model_runtime_proof_ref_bridge_prepared_with_runtime_blocks',
    'GPU/model runtime proof-ref bridge decision mismatch',
  )
  assert(
    controlledWorkerRouteSmoke.decision ===
      'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks',
    'external-agent controlled worker route smoke decision mismatch',
  )
  assert(
    gpuInstallProof.decision ===
      'ai_graphics_gpu_model_install_build_targets_prepared_with_warnings',
    'GPU/model install build targets decision mismatch',
  )
  assert(
    gpuInstallProof.booleans?.all8GpuModelInstallProofTargetsBuiltLocally === true,
    'GPU/model install build targets must record all eight install-proof targets built locally',
  )

  const toolRows = buildToolRows(
    routeSmoke,
    gpuHarness,
    gpuProofRefBridge,
    controlledWorkerRouteSmoke,
    gpuInstallProof,
  )
  const executableTools = toolRows.filter((row) => row.executable)
  const nonGpuExecutableTools = executableTools.filter(
    (row) => row.group !== 'gpu_model',
  )
  const gpuExecutableTools = toolRows.filter(
    (row) => row.group === 'gpu_model' && row.executable,
  )
  const blockedRows = toolRows.filter((row) => row.blockedWithReason)
  const gpuBlockedRows = blockedRows.filter((row) => row.group === 'gpu_model')
  const failedRows = toolRows.filter((row) => row.failedWithDiagnostics)
  const currentHostEnvironment =
    currentHostGpuProofPreflight &&
    typeof currentHostGpuProofPreflight.hostEnvironment === 'object'
      ? currentHostGpuProofPreflight.hostEnvironment
      : null
  const currentHostGpuProofBlockers = Array.isArray(
    currentHostEnvironment?.blockers,
  )
    ? currentHostEnvironment.blockers.filter(
        (blocker: unknown): blocker is string => typeof blocker === 'string',
      )
    : []
  const currentHostEligibleForGpuProof =
    currentHostEnvironment?.hostEligibleForNativeGpuProof === true
  const executionScope = {
    agentCanSubmitControlledRequestsForAll21: true,
    agentCanExecuteAnyControlledToolNow: executableTools.length > 0,
    agentCanExecute13NonGpuControlledToolsNow:
      nonGpuExecutableTools.length === 13,
    agentCanExecuteGpuModelToolsNow: gpuExecutableTools.length > 0,
    agentCanExecuteAll21ControlledToolsNow: executableTools.length === 21,
    agentExecutableToolCountNow: executableTools.length,
    agentExecutableNonGpuToolCountNow: nonGpuExecutableTools.length,
    agentExecutableGpuModelToolCountNow: gpuExecutableTools.length,
    gpuModelBlockedToolCountNow: gpuBlockedRows.length,
    currentHostGpuProofPreflightRequested:
      currentHostGpuProofPreflight !== null,
    currentHostEligibleForGpuProof,
    currentHostGpuProofBlockers,
    currentHostGpuProofPreflightCommand: hostDetectionReadinessCommand(),
  }

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-execution-readiness',
    decision,
    status: gpuExecutableTools.length > 0 ? privateProofStatus : defaultStatus,
    summary:
      'Strict external-agent readiness report for all 21 AI graphics tools. Callable means the agent can submit a controlled private request. Executable means the controlled adapter actually performed runtime work and returned structured private output evidence, including the mock worker-claim-to-canonical-route smoke for the 13 non-GPU tools. GPU/model tools now carry explicit install-proof linkage from gpu-model-install-build-targets: their package/runtime images were proved at install/import-smoke level, while runtime execution still requires private proof refs and tool-specific inputs. CPU foundation proof applies to torch/torchvision and transformers, CPU tensor proof applies to kornia, explicit CPU model proof applies to Real-ESRGAN, rembg, and transparent-background when reviewed private model/input/checksum evidence is supplied, and native CUDA remains required for SAM2 and BiRefNet. Capability-mismatch calls fail closed with failed_with_diagnostics and do not invoke adapters.',
    stateDefinitions: {
      callable:
        'The external agent can submit the controlled private route request.',
      executable:
        'The controlled adapter performed bounded runtime work and produced structured private output evidence.',
      blocked_with_reason:
        'The request shape is valid, but a required runtime/model/input prerequisite is absent.',
      failed_with_diagnostics:
        'Execution was attempted or route validation failed and the row includes an actionable reason.',
    },
    sourceEvidence: {
      all21ControlledRouteExecutionSmoke: {
        decision: routeSmoke.decision,
        status: routeSmoke.status,
        accepted: true,
        capabilityMismatchFailureProbeAccepted:
          routeSmoke.booleans?.capabilityMismatchFailureProbeAccepted === true,
        capabilityMismatchFailureProbeState:
          routeSmoke.capabilityMismatchFailureProbe
            ?.externalAgentExecutionState ?? null,
      },
      gpuModelLocalDevRuntimeExecutionHarness: {
        decision: sourceGpuHarness.decision,
        status: sourceGpuHarness.status,
        accepted: true,
      },
      suppliedPrivateLocalRuntimeProofResults: suppliedPrivateLocalRuntimeProofs.length > 0
        ? suppliedPrivateLocalRuntimeProofs.map((proof, index) => ({
            path: localRuntimeProofResultPaths[index],
            decision: proof.decision,
            status: proof.status,
            rows: Array.isArray(proof.gpuModelLocalDevRuntimeExecutionHarnessRows)
              ? proof.gpuModelLocalDevRuntimeExecutionHarnessRows.length
              : 0,
            mergedIntoReadinessRows: true,
          }))
        : null,
      externalAgentExecutionGate: {
        decision: executionGate.decision,
        status: executionGate.status,
        accepted: true,
      },
      gpuModelRuntimeProofRefBridge: {
        decision: gpuProofRefBridge.decision,
        status: gpuProofRefBridge.status,
        accepted: true,
        diagnosticOnlyPrivateProofFixtureRejectionReason:
          'private_local_runtime_proof_bundle_is_diagnostic_only',
      },
      controlledWorkerRouteExecutionSmoke: {
        decision: controlledWorkerRouteSmoke.decision,
        status: controlledWorkerRouteSmoke.status,
        accepted: true,
      },
      gpuModelInstallBuildTargets: {
        decision: gpuInstallProof.decision,
        status: gpuInstallProof.status,
        proofScope: gpuInstallProof.proofScope,
        accepted: true,
        all8GpuModelInstallProofTargetsBuiltLocally:
          gpuInstallProof.booleans?.all8GpuModelInstallProofTargetsBuiltLocally === true,
        nativeGpuRuntimeStillRequired:
          gpuInstallProof.booleans?.nativeGpuRuntimeStillRequired === true,
      },
      currentHostGpuProofPreflight: currentHostGpuProofPreflight
        ? {
            decision: currentHostGpuProofPreflight.decision,
            hostEnvironment: currentHostEnvironment,
            accepted: true,
          }
        : null,
    },
    executionScope,
    counts: {
      totalToolsCovered: toolRows.length,
      packageRuntimePresentForPlannedSurfaceTools:
        toolRows.filter((row) => row.packageRuntimePresentForPlannedSurface).length,
      packageRuntimeInstallProofPresentTools:
        toolRows.filter((row) => row.packageRuntimeInstallProofPresent).length,
      gpuModelInstallProofTargetPreparedTools:
        toolRows.filter((row) => (
          row.group === 'gpu_model' &&
          row.packageRuntimeInstallProofTargetPrepared === true
        )).length,
      gpuModelInstallProofImportSmokePassedTools:
        toolRows.filter((row) => (
          row.group === 'gpu_model' &&
          row.packageRuntimeInstallProofImportSmokePassed === true
        )).length,
      controlledExecutionRuntimePresentNowTools:
        toolRows.filter((row) => row.controlledExecutionRuntimePresentNow).length,
      agentCallableTools: toolRows.filter((row) => row.callable).length,
      agentExecutableTools: executableTools.length,
      cpuStaticExecutableTools: toolRows.filter(
        (row) => row.group === 'cpu_static' && row.executable,
      ).length,
      browserRuntimeExecutableTools: toolRows.filter(
        (row) => row.group === 'browser_runtime' && row.executable,
      ).length,
      gpuToolsWithValidRuntimeProof: gpuExecutableTools.length,
      gpuModelProofRefBridgeAcceptedTools:
        toolRows.filter((row) => row.routeSubmissionReadyWithAcceptedPrivateProof).length,
      gpuModelProofRefBridgeBlockedTools:
        toolRows.filter((row) => (
          row.group === 'gpu_model' &&
          row.routeSubmissionReadyWithAcceptedPrivateProof === false
        )).length,
      controlledWorkerRouteExecutableTools:
        toolRows.filter((row) => (
          row.group !== 'gpu_model' &&
          row.controlledWorkerRouteEvidenceAccepted === true
        )).length,
      mockWorkerQueueJobCreatedTools:
        toolRows.filter((row) => row.mockWorkerQueueJobCreated === true).length,
      mockWorkerClaimPerformedTools:
        toolRows.filter((row) => row.mockWorkerClaimPerformed === true).length,
      mockWorkerEventRecordedTools:
        toolRows.filter((row) => row.mockWorkerEventRecorded === true).length,
      gpuModelBlockedByControlledWorkerRouteTools:
        toolRows.filter((row) => row.controlledWorkerRouteGpuBlocked === true).length,
      gpuModelBlockedWithReasonTools: gpuBlockedRows.length,
      currentHostGpuProofBlockers:
        currentHostGpuProofBlockers.length,
      blockedWithReasonTools: blockedRows.length,
      failedWithDiagnosticsTools: failedRows.length,
      capabilityMismatchFailureProbeTools:
        routeSmoke.counts?.capabilityMismatchFailureProbeTools ?? 0,
      gpuRuntimeShouldStartNowTools:
        toolRows.filter((row) => row.gpuRuntimeShouldStartNow).length,
      publicArtifactCreatedTools:
        toolRows.filter((row) => row.publicArtifactCreated).length,
      signedUrlCreatedTools:
        toolRows.filter((row) => row.signedUrlCreated).length,
      workerDispatchPerformedTools:
        toolRows.filter((row) => row.workerDispatchPerformed).length,
      providerRuntimePerformedTools:
        toolRows.filter((row) => row.providerRuntimePerformed).length,
      runtimeReadyNowTools:
        toolRows.filter((row) => row.runtimeReadyNow).length,
      externalBetaReadyNowTools:
        toolRows.filter((row) => row.externalBetaReadyNow).length,
      productionReadyNowTools:
        toolRows.filter((row) => row.productionReadyNow).length,
      fastestGpuModelUnlockCandidateTools:
        toolRows.filter((row) => row.fastestGpuModelUnlockCandidate).length,
      privateLocalRuntimeProofResultSuppliedTools:
        suppliedPrivateLocalRuntimeProofs.reduce((total, proof) => (
          total + (
            Array.isArray(proof.gpuModelLocalDevRuntimeExecutionHarnessRows)
              ? proof.gpuModelLocalDevRuntimeExecutionHarnessRows.length
              : 0
          )
        ), 0),
    },
    booleans: {
      externalAgentExecutionReadinessCompleted: true,
      all21ToolsCovered: toolRows.length === 21,
      all21ToolsHaveInstallSurfaceEvidence:
        toolRows.every((row) => row.packageRuntimePresentForPlannedSurface === true),
      all21ToolsHaveRuntimeInstallProofEvidence:
        toolRows.every((row) => row.packageRuntimeInstallProofPresent === true),
      all8GpuModelToolsHaveInstallProofTargetEvidence:
        toolRows.filter((row) => (
          row.group === 'gpu_model' &&
          row.packageRuntimeInstallProofTargetPrepared === true
        )).length === 8,
      all8GpuModelInstallProofImportSmokesPassed:
        toolRows.filter((row) => (
          row.group === 'gpu_model' &&
          row.packageRuntimeInstallProofImportSmokePassed === true
        )).length === 8,
      gpuModelInstallProofSeparatedFromRuntimeExecution:
        toolRows
          .filter((row) => row.group === 'gpu_model')
          .every((row) => (
            row.packageRuntimeInstallProofPresent === true &&
            row.packageRuntimeInstallProofRuntimeProofStillRequired === true &&
            row.executable === false
          )),
      gpuModelInstallProofDidNotStartNativeGpu:
        toolRows
          .filter((row) => row.group === 'gpu_model')
          .every((row) => row.packageRuntimeInstallProofNativeGpuRuntimeUsed === false),
      gpuModelInstallProofDidNotLoadModelsOrProcessMedia:
        toolRows
          .filter((row) => row.group === 'gpu_model')
          .every((row) => (
            row.packageRuntimeInstallProofModelWeightsLoaded === false &&
            row.packageRuntimeInstallProofMediaProcessed === false
          )),
      thirteenToolsHaveControlledExecutionRuntimePresentNow:
        toolRows.filter((row) => row.controlledExecutionRuntimePresentNow).length === 13,
      eightGpuModelToolsInstallTargetPreparedButRuntimeBlocked:
        toolRows.filter((row) => (
          row.group === 'gpu_model' &&
          (
            row.installReadinessState ===
              'install_target_prepared_runtime_blocked_pending_cuda_private_inputs' ||
            row.installReadinessState ===
              'install_target_prepared_runtime_blocked_pending_cpu_foundation_private_inputs' ||
            row.installReadinessState ===
              'install_target_prepared_runtime_blocked_pending_cpu_tensor_private_inputs' ||
            row.installReadinessState ===
              'install_target_prepared_runtime_blocked_pending_cpu_model_private_inputs'
          )
        )).length === 8,
      agentCanSubmitControlledToolRequests: true,
      agentCallableToolsReady: toolRows.every((row) => row.callable),
      all13NonGpuControlledAdapterOutputsValidated:
        nonGpuExecutableTools.length === 13,
      controlledWorkerRouteSmokeAccepted: true,
      all13NonGpuControlledWorkerRouteOutputsValidated:
        toolRows.filter((row) => (
          row.group !== 'gpu_model' &&
          row.controlledWorkerRouteEvidenceAccepted === true
        )).length === 13,
      mockWorkerClaimBeforeRouteExecutionAccepted:
        toolRows.filter((row) => row.mockWorkerClaimPerformed === true).length === 13,
      mockWorkerEventAfterRouteExecutionAccepted:
        toolRows.filter((row) => row.mockWorkerEventRecorded === true).length === 13,
      all8GpuModelToolsBlockedByControlledWorkerRoute:
        toolRows.filter((row) => row.controlledWorkerRouteGpuBlocked === true).length === 8,
      all8GpuModelToolsEvaluated: toolRows.filter((row) => row.group === 'gpu_model').length === 8,
      gpuModelToolsBlockedUntilPrerequisites:
        gpuBlockedRows.length + gpuExecutableTools.length === 8,
      gpuModelProofRefBridgeBlocksUntilPrivateProof:
        toolRows
          .filter((row) => row.group === 'gpu_model')
          .every((row) => row.routeSubmissionReadyWithAcceptedPrivateProof === false),
      scopedGpuModelRuntimeProofAcceptedTools: gpuExecutableTools.length,
      privateLocalRuntimeProofResultSupplied:
        suppliedPrivateLocalRuntimeProofs.length > 0,
      strictCallableExecutableBlockedFailedContractCreated: true,
      capabilityMismatchFailureProbeAccepted:
        routeSmoke.booleans?.capabilityMismatchFailureProbeAccepted === true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      sourceScopedGpuRuntimeStartedOnlyDuringAcceptedProof:
        toolRows
          .filter((row) => row.group === 'gpu_model')
          .every((row) => (
            row.executable ||
            row.sourceGpuRuntimeShouldStartDuringScopedProof === false
          )),
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: executableTools.length > 0,
      agentCanExecuteAnyControlledToolNow:
        executionScope.agentCanExecuteAnyControlledToolNow,
      agentCanExecute13ControlledToolsNow: nonGpuExecutableTools.length === 13,
      agentCanExecute13NonGpuControlledToolsNow:
        executionScope.agentCanExecute13NonGpuControlledToolsNow,
      agentCanExecuteAll21ToolsNow: executableTools.length === 21,
      agentCanExecuteAll21ControlledToolsNow:
        executionScope.agentCanExecuteAll21ControlledToolsNow,
      agentCanExecuteGpuModelToolsNow: gpuExecutableTools.length > 0,
      currentHostGpuProofPreflightRequested:
        executionScope.currentHostGpuProofPreflightRequested,
      currentHostEligibleForGpuProof:
        executionScope.currentHostEligibleForGpuProof,
      routeExecutionApprovedNow: true,
      routeExecutionPerformedInReadinessRunner: !hasFlag('--use-records-only'),
      controlledWorkerRouteExecutionPerformedInReadinessRunner:
        !hasFlag('--use-records-only'),
      toolExecutionApprovedFor13ControlledToolsNow: true,
      toolExecutionApprovedForGpuModelToolsNow: gpuExecutableTools.length > 0,
      toolExecutionApprovedForAll21ToolsNow: executableTools.length === 21,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimePerformed: false,
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
    toolReadinessRows: toolRows,
    remainingNativeCudaClosure:
      remainingNativeCudaClosure(toolRows, currentHostEnvironment),
    fastestGpuModelUnlockCandidate: {
      toolId: 'kornia',
      reason:
        'Kornia is the narrowest GPU/model execution unlock candidate because it uses the real controlled adapter, can prove local CPU tensor execution with a private approved frame and output directory, and does not require a model-weight manifest.',
      recommendedBackend: 'docker_container',
      canonicalProofImage: canonicalGpuWorkerProofImage,
      nextExactContainerBuildCommand: containerGpuImageBuildCommand('kornia'),
      nextExactCommand: containerGpuCommand('kornia'),
      nextExactControlledRouteCommand: controlledRouteGpuCommand('kornia'),
      nextExactProofRefBridgeCommand: proofRefBridgeCommand(),
      nextExactReadinessWithPrivateProofCommand:
        directReadinessWithPrivateProofCommand(),
      nextExactCurrentHostPreflightCommand: hostDetectionReadinessCommand(),
      expectedCurrentHostBlockerWhenNoNvidiaGpuIsAttached:
        'gpu_model_python_package_missing',
      remainsBlockedUntil:
        'Run with the canonical proof image available, approved local Python CPU tensor runtime packages, and a private approved source frame mounted locally.',
    },
    nextExactAction:
      'First target kornia with the container local-dev CPU tensor command. After kornia returns structured private local output, feed that private harness result into the GPU/model runtime proof-ref bridge, then repeat per GPU/model tool with reviewed model/checkpoint paths where required.',
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.toolReadinessRows
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.group}\` | \`${row.packageRuntimeInstallProofPrimaryProfile ?? 'node_or_browser_lockfile'}\` | ${row.packageRuntimeInstallProofPresent} | \`${row.installReadinessState}\` | \`${row.readinessState}\` | ${row.callable} | ${row.executable} | ${row.controlledWorkerRouteEvidenceAccepted} | \`${row.currentBlockingPrerequisiteKey ?? 'none'}\` | \`${row.remainingPrivateRuntimeInputKeys.length ? row.remainingPrivateRuntimeInputKeys.join(', ') : 'none'}\` | \`${row.minimumPrivateRuntimeInputKeys.length ? row.minimumPrivateRuntimeInputKeys.join(', ') : 'none'}\` | \`${row.nextExactCommand ?? 'none'}\` | \`${row.blockingPrerequisite ?? 'none'}\` |`
    ))
    .join('\n')
  const runtimeInputManifestRows = report.toolReadinessRows
    .filter((row) => row.nextExactRuntimeInputManifestMaterializerCommand)
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.currentBlockingPrerequisiteKey ?? 'none'}\` | \`${row.nextExactRuntimeInputManifestPath}\` | \`${row.nextExactRuntimeInputManifestMaterializerCommand}\` | \`${row.nextExactRuntimeInputManifestScopedToolCallCommand}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Agent Execution Readiness

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This is the strict all-21 external-agent readiness report. It separates \`callable\` from \`executable\`: all 21 tools can receive controlled private requests, 13 tools execute controlled local adapters now, and those 13 are also proven through the mock worker-claim-to-canonical-route smoke. The eight GPU/model tools now carry explicit install-proof linkage from \`gpu-model-install-build-targets\`: their package/runtime images were proved at install/import-smoke level, while runtime execution still requires private proof refs and tool-specific inputs. CPU foundation proof applies to \`torch_torchvision\` and \`transformers\`, CPU tensor proof applies to \`kornia\`, explicit CPU model proof applies to \`real_esrgan\`, \`rembg\`, and \`transparent_background\` when reviewed private model/input/checksum evidence is supplied, and native CUDA remains required for \`sam2\` and \`birefnet\`. The mounted route also proves a capability-mismatch request returns \`failed_with_diagnostics\` without invoking an adapter. GPU runtime is on-demand only and does not start idle.

## State Definitions

${Object.entries(report.stateDefinitions).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Execution Scope

${Object.entries(report.executionScope).map(([key, value]) => `- \`${key}\`: ${Array.isArray(value) ? value.join('; ') || 'none' : value}`).join('\n')}

## Install Proof Linkage

- GPU/model install proof source: \`${report.sourceEvidence.gpuModelInstallBuildTargets.proofScope}\`
- All eight GPU/model install-proof targets built locally: \`${report.sourceEvidence.gpuModelInstallBuildTargets.all8GpuModelInstallProofTargetsBuiltLocally}\`
- Native GPU runtime still required before model execution: \`${report.sourceEvidence.gpuModelInstallBuildTargets.nativeGpuRuntimeStillRequired}\`
- Guard: install/import-smoke proof is not runtime execution proof and does not start native GPU, load model weights, process media, create public artifacts, or sign URLs.

## Tool Rows

| Tool | Group | Install proof profile | Install proof present | Install/runtime state | Readiness state | Callable | Executable | Worker-route evidence accepted | Current blocker | Remaining private runtime inputs | Minimum private runtime inputs | Next exact command | Blocking prerequisite |
| --- | --- | --- | ---: | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- |
${rows}

## Model-Weight Runtime Input Manifest Commands

These commands are local-only preparation steps for the five GPU/model tools that require private model/checkpoint files. They compute checksum evidence from the supplied private model file and write a strict runtime input manifest under \`.local-artifacts/\`; they do not start GPU, run inference, download models, call providers, create signed URLs, or create public artifacts.

| Tool | Current blocker | Manifest path | Manifest materializer command | Next scoped tool-call command |
| --- | --- | --- | --- | --- |
${runtimeInputManifestRows}

## Remaining Native CUDA Closure

- Status: \`${report.remainingNativeCudaClosure.status}\`
- Remaining native CUDA tools: \`${report.remainingNativeCudaClosure.remainingToolIds.join(', ') || 'none'}\`
- Current host eligible for native GPU proof: \`${report.remainingNativeCudaClosure.currentHostEligibleForNativeGpuProof}\`
- Current host blockers: \`${report.remainingNativeCudaClosure.currentHostBlockers.join('; ') || 'none'}\`
- Host preflight command: \`${report.remainingNativeCudaClosure.currentHostPreflightCommand}\`
- Private model root inspected: \`${report.remainingNativeCudaClosure.privateModelRootInspection.inspected}\`
- Private model root exists: \`${report.remainingNativeCudaClosure.privateModelRootInspection.rootExists}\`
- All-21 closeout readiness command: \`${report.remainingNativeCudaClosure.all21CloseoutReadinessCommand}\`

| Tool | Current state | Current blocker | Model field | Expected candidates | Model candidate present | Matching candidate | Manifest command | Native proof command | Final tool call |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |
${report.remainingNativeCudaClosure.tools.map((entry) => `| \`${entry.toolId}\` | \`${entry.currentReadinessState}\` | \`${entry.currentBlockingPrerequisiteKey ?? 'none'}\` | \`${entry.modelField}\` | \`${entry.expectedPrivateRootCandidates.join(', ')}\` | ${entry.privateModelRootCandidatePresent} | \`${entry.privateModelRootMatchingCandidate ?? 'none'}\` | \`${entry.manifestMaterializerCommand}\` | \`${entry.nativeGpuProofSequenceCommand}\` | \`${entry.finalExternalAgentToolCallCommand}\` |`).join('\n')}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Fastest GPU/Model Unlock Candidate

- Tool: \`${report.fastestGpuModelUnlockCandidate.toolId}\`
- Recommended backend: \`${report.fastestGpuModelUnlockCandidate.recommendedBackend}\`
- Canonical proof image: \`${report.fastestGpuModelUnlockCandidate.canonicalProofImage}\`
- Reason: ${report.fastestGpuModelUnlockCandidate.reason}
- Expected current-host blocker without attached NVIDIA GPU: \`${report.fastestGpuModelUnlockCandidate.expectedCurrentHostBlockerWhenNoNvidiaGpuIsAttached}\`
- Build proof-local image if missing: \`${report.fastestGpuModelUnlockCandidate.nextExactContainerBuildCommand}\`
- Next direct harness command: \`${report.fastestGpuModelUnlockCandidate.nextExactCommand}\`
- Next controlled route command: \`${report.fastestGpuModelUnlockCandidate.nextExactControlledRouteCommand}\`
- Next proof-ref bridge command: \`${report.fastestGpuModelUnlockCandidate.nextExactProofRefBridgeCommand}\`
- Next direct readiness command with private proof: \`${report.fastestGpuModelUnlockCandidate.nextExactReadinessWithPrivateProofCommand}\`
- Next current-host preflight command: \`${report.fastestGpuModelUnlockCandidate.nextExactCurrentHostPreflightCommand}\`

## Failure Diagnostics Guard

- Capability mismatch probe accepted: \`${report.booleans.capabilityMismatchFailureProbeAccepted}\`
- Probe count: \`${report.counts.capabilityMismatchFailureProbeTools}\`
- Probe state: \`${report.sourceEvidence.all21ControlledRouteExecutionSmoke.capabilityMismatchFailureProbeState}\`
- Guard: a valid tool with the wrong product-facing capability returns \`failed_with_diagnostics\` and does not invoke or execute an adapter.

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Next Action

${report.nextExactAction}
`
}

const report = buildReport()
if (hasFlag('--write-records')) {
  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true })
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
}
console.log(JSON.stringify(report, null, 2))
