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
  'external_agent_call_ready_for_all21_runtime_execution_ready_for19_plus_private_gpu_model_proof_subset'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md'
const birefNetModelDirectoryPlaceholder =
  '<private-birefnet-model-dir-containing-model.safetensors>'
const gpuModelInstallBuildTargetsPath =
  'docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json'
const canonicalGpuWorkerProofImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const cpuSafeGpuModelRouteProofToolIds = [
  'torch_torchvision',
  'transformers',
  'kornia',
] as const
const cpuSafeGpuModelRouteProofOutputRoot =
  '.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-cpu-safe-diagnostic'
const cpuSafeGpuModelRouteProofSourceImage =
  '.local-artifacts/ai-graphics/gpu-model-route-private-input-preflight-diagnostic/inputs/private-approved-frame.ppm'
const cpuSafeGpuModelRouteProofPacketPath =
  '.local-artifacts/ai-graphics/external-agent-execution-readiness/cpu-safe-gpu-model-route-proof.json'
const cpuModelGpuModelRouteProofToolIds = [
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const
const cpuModelGpuModelRouteProofOutputRoot =
  '.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-cpu-model-diagnostic'
const cpuModelGpuModelRouteProofSourceImage =
  '.local-artifacts/ai-graphics/gpu-model-route-private-input-preflight-diagnostic/inputs/private-approved-frame-96.ppm'
const cpuModelGpuModelRouteProofRealEsrganModel =
  '.local-artifacts/ai-graphics/private-model-cache/real-esrgan/RealESRGAN_x4plus.pth'
const cpuModelGpuModelRouteProofRembgModel =
  '.local-artifacts/ai-graphics/private-model-cache/rembg/u2netp.onnx'
const cpuModelGpuModelRouteProofTransparentBackgroundCheckpoint =
  '.local-artifacts/ai-graphics/private-model-cache/transparent-background/ckpt_fast.pth'
const cpuModelGpuModelRouteProofPacketPath =
  '.local-artifacts/ai-graphics/external-agent-execution-readiness/cpu-model-gpu-model-route-proof-next.json'
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
const privateModelManifestDirEnvVar =
  'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_MANIFEST_DIR'
const defaultPrivateModelRoot =
  '.local-artifacts/ai-graphics/private-model-cache'
const nativeCudaCloseoutScript =
  'ai-graphics:external-agent-native-cuda-closeout'
const nativeCudaCloseoutOutputRoot =
  '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout'
const nativeCudaCloseoutScriptOut =
  `${nativeCudaCloseoutOutputRoot}/run-native-cuda-closeout.sh`
const nativeCudaCloseoutResultRootFlag = '--native-cuda-closeout-result-root'
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
  if (toolId === 'birefnet') {
    flags.push(`--birefnet-model ${birefNetModelDirectoryPlaceholder}`)
  }
  if (toolId === 'real_esrgan') {
    flags.push('--real-esrgan-model <private-real-esrgan-model.pth>')
  }
  if (toolId === 'rembg') flags.push('--rembg-model <private-rembg-model.onnx>')
  if (toolId === 'transparent_background') {
    flags.push('--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>')
    flags.push('--transparent-background-mode fast')
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
    flags.push(`--scoped-gpu-birefnet-model ${outputDir}/models/birefnet`)
  }
  if (toolId === 'real_esrgan') {
    flags.push(`--scoped-gpu-real-esrgan-model ${outputDir}/private-real-esrgan-model.pth`)
  }
  if (toolId === 'rembg') {
    flags.push(`--scoped-gpu-rembg-model ${outputDir}/private-rembg-model.onnx`)
  }
  if (toolId === 'transparent_background') {
    flags.push(`--scoped-gpu-transparent-background-checkpoint ${outputDir}/private-transparent-background-checkpoint.pth`)
    flags.push('--scoped-gpu-transparent-background-mode fast')
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
      '--transparent-background-mode',
      'fast',
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

function remainingNativeCudaExplicitModelPathPlaceholder(
  toolId: RemainingNativeCudaToolId,
): string {
  return toolId === 'sam2'
    ? '<private-sam2-checkpoint.pt>'
    : birefNetModelDirectoryPlaceholder
}

function remainingNativeCudaRuntimeInputManifestExplicitModelPathCommand(
  toolId: RemainingNativeCudaToolId,
): string {
  const expectation = remainingNativeCudaModelExpectation(toolId)
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest --',
    `--tool ${toolId}`,
    `--source-image ${gpuModelRuntimeInputManifestSourceImage}`,
    `${expectation.modelFlag} ${remainingNativeCudaExplicitModelPathPlaceholder(toolId)}`,
    `--output-dir ${remainingNativeCudaOutputDir(toolId)}`,
    `--manifest-out ${remainingNativeCudaRuntimeInputManifestPath(toolId)}`,
    `--model-weight-manifest-id ${toolId}_private_manifest_review_v1`,
    `--model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/${toolId}.json`,
    `--model-weight-manifest-dir "$${privateModelManifestDirEnvVar}"`,
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

function remainingNativeCudaDirectToolCallPrivateRootCommand(
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
    `--gpu-output-dir ${remainingNativeCudaOutputDir(toolId)}`,
    `--source-image ${gpuModelRuntimeInputManifestSourceImage}`,
    `--private-model-root "$${privateModelRootEnvVar}"`,
    `--model-weight-manifest-dir "$${privateModelManifestDirEnvVar}"`,
  ].join(' ')
}

function remainingNativeCudaDirectToolCallExplicitModelPathCommand(
  toolId: RemainingNativeCudaToolId,
): string {
  const expectation = remainingNativeCudaModelExpectation(toolId)
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
    `--gpu-output-dir ${remainingNativeCudaOutputDir(toolId)}`,
    `--source-image ${gpuModelRuntimeInputManifestSourceImage}`,
    `${expectation.modelFlag} ${remainingNativeCudaExplicitModelPathPlaceholder(toolId)}`,
    `--model-weight-manifest-dir "$${privateModelManifestDirEnvVar}"`,
    '--materialize-runtime-input-manifest',
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

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value
  return `'${value.replace(/'/g, "'\\''")}'`
}

function remainingNativeCudaExistingProofArgs(
  existingProofResults: string[] | undefined,
): string[] {
  if (existingProofResults && existingProofResults.length > 0) {
    return existingProofResults.flatMap((proofResult) => [
      '--existing-proof-result',
      shellQuote(proofResult),
    ])
  }
  return []
}

function remainingNativeCudaCloseoutCommand(options: {
  strict: boolean
  existingProofResults?: string[]
  scriptOut?: boolean
  attemptLocalRuntime?: boolean
}): string {
  const attemptLocalRuntime = options.attemptLocalRuntime ?? true
  const sourceImageArg = options.existingProofResults?.length
    ? '"$REEDITPRO_AI_GRAPHICS_PRIVATE_SOURCE_IMAGE"'
    : '<private-approved-frame.png>'
  const command = [
    `npm run --silent ${nativeCudaCloseoutScript} --`,
    '--detect-host',
    '--private-model-root "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
    `--model-weight-manifest-dir "$${privateModelManifestDirEnvVar}"`,
    `--source-image ${sourceImageArg}`,
    `--output-root ${nativeCudaCloseoutOutputRoot}`,
    `--cpu-safe-gpu-model-route-proof-packet ${cpuSafeGpuModelRouteProofPacketPath}`,
    `--cpu-model-gpu-model-route-proof-packet ${cpuModelGpuModelRouteProofPacketPath}`,
    ...remainingNativeCudaExistingProofArgs(options.existingProofResults),
  ]
  if (options.scriptOut) command.push(`--script-out ${nativeCudaCloseoutScriptOut}`)
  if (attemptLocalRuntime) command.push('--attempt-local-runtime')
  if (options.strict) command.push('--strict-exit-code')
  return command.join(' ')
}

function remainingNativeCudaAll21CloseoutReadinessCommand(
  existingProofResults: string[] | undefined,
): string {
  const existingProofArgs = existingProofResults && existingProofResults.length > 0
    ? existingProofResults.flatMap((proofResult) => [
        '--local-runtime-proof-result',
        shellQuote(proofResult),
      ])
    : []
  return [
    'npm run --silent ai-graphics:external-agent-execution-readiness --',
    `--cpu-safe-gpu-model-route-proof-packet ${cpuSafeGpuModelRouteProofPacketPath}`,
    `--cpu-model-gpu-model-route-proof-packet ${cpuModelGpuModelRouteProofPacketPath}`,
    ...existingProofArgs,
    `${nativeCudaCloseoutResultRootFlag} ${nativeCudaCloseoutOutputRoot}`,
  ].join(' ')
}

function assertLocalProofPath(flag: string, value: string) {
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(value)) {
    throw new Error(`${flag} must be a local filesystem path, not a URL: ${value}`)
  }
  if (value.includes('\0')) {
    throw new Error(`${flag} must not contain NUL bytes: ${value}`)
  }
  const normalized = path.normalize(value)
  if (normalized.split(path.sep).includes('..')) {
    throw new Error(`${flag} must not traverse parent directories: ${value}`)
  }
}

function nativeCudaCloseoutProofPathsFromRoot(rootPath: string): string[] {
  assertLocalProofPath(nativeCudaCloseoutResultRootFlag, rootPath)
  return remainingNativeCudaToolIds.map((toolId) =>
    path.join(rootPath, toolId, 'harness-result.json'))
}

function localRuntimeProofResultInputs() {
  const explicitLocalRuntimeProofResultPaths =
    stringFlags('--local-runtime-proof-result')
  for (const proofPath of explicitLocalRuntimeProofResultPaths) {
    assertLocalProofPath('--local-runtime-proof-result', proofPath)
  }
  const nativeCudaCloseoutResultRoots =
    stringFlags(nativeCudaCloseoutResultRootFlag)
  const nativeCudaCloseoutExpandedProofResultPaths =
    nativeCudaCloseoutResultRoots.flatMap(nativeCudaCloseoutProofPathsFromRoot)
  for (const proofPath of nativeCudaCloseoutExpandedProofResultPaths) {
    if (!fs.existsSync(proofPath)) {
      throw new Error(
        `${nativeCudaCloseoutResultRootFlag} expected proof result file is missing: ${proofPath}`,
      )
    }
  }
  return {
    explicitLocalRuntimeProofResultPaths,
    nativeCudaCloseoutResultRoots,
    nativeCudaCloseoutExpandedProofResultPaths,
    localRuntimeProofResultPaths: [
      ...explicitLocalRuntimeProofResultPaths,
      ...nativeCudaCloseoutExpandedProofResultPaths,
    ],
  }
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
  existingProofResults: string[] = [],
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
      explicitModelPathManifestMaterializerCommand:
        remainingNativeCudaRuntimeInputManifestExplicitModelPathCommand(toolId),
      nativeGpuProofSequenceCommand:
        remainingNativeCudaProofSequenceCommand(toolId),
      finalExternalAgentToolCallCommand:
        remainingNativeCudaFinalToolCallCommand(toolId),
      directExternalAgentToolCallWithPrivateRootCommand:
        remainingNativeCudaDirectToolCallPrivateRootCommand(toolId),
      directExternalAgentToolCallWithExplicitModelPathCommand:
        remainingNativeCudaDirectToolCallExplicitModelPathCommand(toolId),
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
    currentHostPreflightRequested: currentHostEnvironment !== null,
    currentHostEligibleForNativeGpuProof:
      currentHostEnvironment?.hostEligibleForNativeGpuProof === true,
    currentHostBlockers: Array.isArray(currentHostEnvironment?.blockers)
      ? currentHostEnvironment.blockers
      : [],
    currentHostPreflightCommand:
      'npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible',
    nativeCudaCloseoutCommand:
      remainingNativeCudaCloseoutCommand({
        strict: false,
        existingProofResults,
        attemptLocalRuntime: true,
      }),
    nativeCudaCloseoutStrictCommand:
      remainingNativeCudaCloseoutCommand({
        strict: true,
        existingProofResults,
        attemptLocalRuntime: true,
      }),
    nativeCudaCloseoutScriptGeneratorCommand:
      remainingNativeCudaCloseoutCommand({
        strict: false,
        existingProofResults,
        scriptOut: true,
        attemptLocalRuntime: false,
      }),
    nativeCudaCloseoutScriptPath: nativeCudaCloseoutScriptOut,
    nativeCudaCloseoutDiagnosticCommand:
      'npm run --silent ai-graphics:external-agent-native-cuda-closeout:diagnostics',
    tools: toolEntries,
    all21CloseoutReadinessCommand:
      remainingNativeCudaAll21CloseoutReadinessCommand(existingProofResults),
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

function cpuSafeGpuModelRouteProofArgs(): string[] {
  return [
    'run',
    '--silent',
    'ai-graphics:external-agent-all21-controlled-route-execution-smoke',
    '--',
    '--scoped-gpu-tool',
    cpuSafeGpuModelRouteProofToolIds.join(','),
    '--scoped-gpu-runtime-container-image',
    canonicalGpuWorkerProofImage,
    '--scoped-gpu-runtime-container-platform',
    'linux/amd64',
    '--scoped-gpu-timeout-ms',
    '30000',
    '--scoped-gpu-allow-cpu-foundation-runtime',
    '--scoped-gpu-allow-cpu-tensor-runtime',
    '--scoped-gpu-output-root',
    cpuSafeGpuModelRouteProofOutputRoot,
    '--scoped-gpu-source-image',
    cpuSafeGpuModelRouteProofSourceImage,
  ]
}

function cpuSafeGpuModelRouteProofCommand(): string {
  return [
    'npm',
    ...cpuSafeGpuModelRouteProofArgs(),
  ].join(' ')
}

function sourceCpuSafeGpuModelRouteProof(): JsonRecord | null {
  const packet = stringFlag('--cpu-safe-gpu-model-route-proof-packet')
  if (packet) return readJson(packet)
  if (!hasFlag('--attempt-cpu-safe-gpu-model-route-proof')) return null
  return runJsonFileCommand('npm', cpuSafeGpuModelRouteProofArgs())
}

function cpuModelGpuModelRouteProofArgs(): string[] {
  return [
    'run',
    '--silent',
    'ai-graphics:external-agent-all21-controlled-route-execution-smoke',
    '--',
    '--scoped-gpu-tool',
    cpuModelGpuModelRouteProofToolIds.join(','),
    '--scoped-gpu-use-tool-specific-runtime-images',
    '--scoped-gpu-runtime-container-platform',
    'linux/amd64',
    '--scoped-gpu-timeout-ms',
    '120000',
    '--scoped-gpu-allow-cpu-model-runtime',
    '--scoped-gpu-output-root',
    cpuModelGpuModelRouteProofOutputRoot,
    '--scoped-gpu-source-image',
    cpuModelGpuModelRouteProofSourceImage,
    '--scoped-gpu-real-esrgan-model',
    cpuModelGpuModelRouteProofRealEsrganModel,
    '--scoped-gpu-real-esrgan-sample-size',
    '16',
    '--scoped-gpu-rembg-model',
    cpuModelGpuModelRouteProofRembgModel,
    '--scoped-gpu-transparent-background-checkpoint',
    cpuModelGpuModelRouteProofTransparentBackgroundCheckpoint,
    '--scoped-gpu-transparent-background-mode',
    'fast',
  ]
}

function cpuModelGpuModelRouteProofCommand(): string {
  return [
    'npm',
    ...cpuModelGpuModelRouteProofArgs(),
  ].join(' ')
}

function sourceCpuModelGpuModelRouteProof(): JsonRecord | null {
  const packet = stringFlag('--cpu-model-gpu-model-route-proof-packet')
  if (packet) return readJson(packet)
  if (!hasFlag('--attempt-cpu-model-gpu-model-route-proof')) return null
  return runJsonFileCommand('npm', cpuModelGpuModelRouteProofArgs())
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

function summarizeCpuSafeGpuModelRouteProof(
  proof: JsonRecord | null,
  nonGpuExecutableToolCount: number,
) {
  const expectedToolIds: string[] = [...cpuSafeGpuModelRouteProofToolIds]
  const attempts = Array.isArray(proof?.scopedGpuModelLocalDevRouteAttempts)
    ? proof.scopedGpuModelLocalDevRouteAttempts
    : []
  const executableAttempts = attempts.filter((attempt: JsonRecord) => {
    const result = attempt.result ?? {}
    return expectedToolIds.includes(String(attempt.requestedToolId)) &&
      attempt.booleans?.scopedGpuModelLocalDevRouteAttemptAccepted === true &&
      attempt.booleans?.scopedGpuModelRuntimeExecutionPerformed === true &&
      attempt.booleans?.scopedGpuModelGpuRuntimeShouldStartNow === false &&
      result.externalAgentExecutionState === 'executable' &&
      result.localGpuModelRuntimeExecutionPerformed === true &&
      result.controlledAdapterExecutedNow === true &&
      result.gpuRuntimeShouldStartNow === false &&
      typeof result.outputSha256 === 'string' &&
      result.outputSha256.length === 64 &&
      result.publicArtifactCreated === false &&
      result.signedUrlCreated === false
  })
  const executableToolIds = executableAttempts
    .map((attempt: JsonRecord) => String(attempt.requestedToolId))
    .filter((toolId: string) => expectedToolIds.includes(toolId))
  const executableToolIdSet = new Set(executableToolIds)
  const accepted =
    proof !== null &&
    proof.decision ===
      'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed' &&
    expectedToolIds.every((toolId) => executableToolIdSet.has(toolId)) &&
    proof.booleans?.gpuRuntimeShouldStartNow === false &&
    proof.booleans?.publicArtifactCreated === false &&
    proof.booleans?.signedUrlCreated === false &&
    proof.booleans?.modelWeightsDownloaded === false &&
    proof.booleans?.providerRuntimePerformed === false
  const remainingGpuModelBlockedToolIds =
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS
      .filter((toolId) => !executableToolIdSet.has(toolId))

  return {
    attempted: proof !== null,
    accepted,
    status: accepted
      ? 'cpu_safe_gpu_model_route_proof_executed_for_3_tools_16_total_controlled_route_tools_executable'
      : proof
      ? 'cpu_safe_gpu_model_route_proof_attempted_but_not_accepted'
      : 'cpu_safe_gpu_model_route_proof_not_attempted',
    proofCommand: cpuSafeGpuModelRouteProofCommand(),
    proofOutputRoot: cpuSafeGpuModelRouteProofOutputRoot,
    proofSourceImage: cpuSafeGpuModelRouteProofSourceImage,
    expectedToolIds,
    attemptedToolIds: attempts
      .map((attempt: JsonRecord) => String(attempt.requestedToolId))
      .filter(Boolean),
    executableToolIds,
    executableTools: executableToolIds.length,
    nonGpuExecutableTools: nonGpuExecutableToolCount,
    agentExecutableToolsWithCpuSafeGpuModelRouteProof:
      accepted
        ? nonGpuExecutableToolCount + executableToolIds.length
        : nonGpuExecutableToolCount,
    remainingGpuModelBlockedToolIds,
    remainingGpuModelBlockedTools: remainingGpuModelBlockedToolIds.length,
    gpuRuntimeShouldStartNow: false,
    gpuRuntimeStartsIdle: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    providerRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    proofRows: executableAttempts.map((attempt: JsonRecord) => ({
      toolId: attempt.requestedToolId,
      externalAgentExecutionState:
        attempt.result?.externalAgentExecutionState ?? null,
      outputKind: attempt.result?.outputKind ?? null,
      outputSha256: attempt.result?.outputSha256 ?? null,
      localGpuModelRuntimeExecutionPerformed:
        attempt.result?.localGpuModelRuntimeExecutionPerformed === true,
      gpuRuntimeShouldStartNow:
        attempt.result?.gpuRuntimeShouldStartNow === true,
      controlledAdapterExecutedNow:
        attempt.result?.controlledAdapterExecutedNow === true,
    })),
    sourceEvidence: proof
      ? {
          decision: proof.decision ?? null,
          status: proof.status ?? null,
          scopedGpuModelLocalDevRouteAttemptTools:
            proof.counts?.scopedGpuModelLocalDevRouteAttemptTools ?? null,
          scopedGpuModelLocalDevRouteAttemptRuntimeExecutedTools:
            proof.counts?.scopedGpuModelLocalDevRouteAttemptRuntimeExecutedTools ?? null,
          scopedGpuModelLocalDevRouteAttemptBlockedWithReasonTools:
            proof.counts?.scopedGpuModelLocalDevRouteAttemptBlockedWithReasonTools ?? null,
        }
      : null,
  }
}

function summarizeCpuModelGpuModelRouteProof(
  proof: JsonRecord | null,
  nonGpuExecutableToolCount: number,
  priorGpuExecutableToolIds: string[],
) {
  const expectedToolIds: string[] = [...cpuModelGpuModelRouteProofToolIds]
  const attempts = Array.isArray(proof?.scopedGpuModelLocalDevRouteAttempts)
    ? proof.scopedGpuModelLocalDevRouteAttempts
    : []
  const executableAttempts = attempts.filter((attempt: JsonRecord) => {
    const result = attempt.result ?? {}
    return expectedToolIds.includes(String(attempt.requestedToolId)) &&
      attempt.booleans?.scopedGpuModelLocalDevRouteAttemptAccepted === true &&
      attempt.booleans?.scopedGpuModelRuntimeExecutionPerformed === true &&
      attempt.booleans?.scopedGpuModelGpuRuntimeShouldStartNow === false &&
      result.externalAgentExecutionState === 'executable' &&
      result.localGpuModelRuntimeExecutionPerformed === true &&
      result.controlledAdapterExecutedNow === true &&
      result.gpuRuntimeShouldStartNow === false &&
      typeof result.outputSha256 === 'string' &&
      result.outputSha256.length === 64 &&
      result.publicArtifactCreated === false &&
      result.signedUrlCreated === false
  })
  const executableToolIds = executableAttempts
    .map((attempt: JsonRecord) => String(attempt.requestedToolId))
    .filter((toolId: string) => expectedToolIds.includes(toolId))
  const executableToolIdSet = new Set([
    ...priorGpuExecutableToolIds,
    ...executableToolIds,
  ])
  const safetyAccepted =
    proof !== null &&
    proof.decision ===
      'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed' &&
    proof.booleans?.gpuRuntimeShouldStartNow === false &&
    proof.booleans?.publicArtifactCreated === false &&
    proof.booleans?.signedUrlCreated === false &&
    proof.booleans?.modelWeightsDownloaded === false &&
    proof.booleans?.providerRuntimePerformed === false
  const allExpectedAccepted =
    safetyAccepted &&
    expectedToolIds.every((toolId) => executableToolIds.includes(toolId))
  const accepted = safetyAccepted && executableToolIds.length > 0
  const remainingGpuModelBlockedToolIds =
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS
      .filter((toolId) => !executableToolIdSet.has(toolId))
  const totalExecutableToolCount =
    nonGpuExecutableToolCount + executableToolIdSet.size

  return {
    attempted: proof !== null,
    accepted,
    status: allExpectedAccepted
      ? 'cpu_model_gpu_model_route_proof_executed_for_3_tools_19_total_controlled_route_tools_executable'
      : accepted
      ? `cpu_model_gpu_model_route_proof_partially_executed_for_${executableToolIds.length}_tools_${totalExecutableToolCount}_total_controlled_route_tools_executable`
      : proof
      ? 'cpu_model_gpu_model_route_proof_attempted_but_not_accepted'
      : 'cpu_model_gpu_model_route_proof_not_attempted',
    proofCommand: cpuModelGpuModelRouteProofCommand(),
    proofOutputRoot: cpuModelGpuModelRouteProofOutputRoot,
    proofSourceImage: cpuModelGpuModelRouteProofSourceImage,
    proofModelInputs: {
      realEsrganModelLocalPath: cpuModelGpuModelRouteProofRealEsrganModel,
      rembgModelLocalPath: cpuModelGpuModelRouteProofRembgModel,
      transparentBackgroundCheckpointLocalPath:
        cpuModelGpuModelRouteProofTransparentBackgroundCheckpoint,
    },
    expectedToolIds,
    attemptedToolIds: attempts
      .map((attempt: JsonRecord) => String(attempt.requestedToolId))
      .filter(Boolean),
    allExpectedAccepted,
    executableToolIds,
    executableTools: executableToolIds.length,
    priorGpuExecutableToolIds,
    combinedGpuExecutableToolIds: [...executableToolIdSet],
    nonGpuExecutableTools: nonGpuExecutableToolCount,
    agentExecutableToolsWithCpuSafeAndCpuModelGpuModelRouteProof:
      accepted
        ? totalExecutableToolCount
        : nonGpuExecutableToolCount + priorGpuExecutableToolIds.length,
    remainingGpuModelBlockedToolIds,
    remainingGpuModelBlockedTools: remainingGpuModelBlockedToolIds.length,
    rejectedAsTooSlowOrStillBlockedToolIds: expectedToolIds
      .filter((toolId) => !executableToolIds.includes(toolId)),
    gpuRuntimeShouldStartNow: false,
    gpuRuntimeStartsIdle: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    providerRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    proofRows: executableAttempts.map((attempt: JsonRecord) => ({
      toolId: attempt.requestedToolId,
      externalAgentExecutionState:
        attempt.result?.externalAgentExecutionState ?? null,
      outputKind: attempt.result?.outputKind ?? null,
      outputSha256: attempt.result?.outputSha256 ?? null,
      localGpuModelRuntimeExecutionPerformed:
        attempt.result?.localGpuModelRuntimeExecutionPerformed === true,
      gpuRuntimeShouldStartNow:
        attempt.result?.gpuRuntimeShouldStartNow === true,
      controlledAdapterExecutedNow:
        attempt.result?.controlledAdapterExecutedNow === true,
    })),
    sourceEvidence: proof
      ? {
          decision: proof.decision ?? null,
          status: proof.status ?? null,
          scopedGpuModelLocalDevRouteAttemptTools:
            proof.counts?.scopedGpuModelLocalDevRouteAttemptTools ?? null,
          scopedGpuModelLocalDevRouteAttemptRuntimeExecutedTools:
            proof.counts?.scopedGpuModelLocalDevRouteAttemptRuntimeExecutedTools ?? null,
          scopedGpuModelLocalDevRouteAttemptBlockedWithReasonTools:
            proof.counts?.scopedGpuModelLocalDevRouteAttemptBlockedWithReasonTools ?? null,
        }
      : null,
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
  const {
    explicitLocalRuntimeProofResultPaths,
    nativeCudaCloseoutResultRoots,
    nativeCudaCloseoutExpandedProofResultPaths,
    localRuntimeProofResultPaths,
  } = localRuntimeProofResultInputs()
  if (localRuntimeProofResultPaths.length > 0 && hasFlag('--write-records')) {
    throw new Error(
      '--write-records cannot be combined with --local-runtime-proof-result or --native-cuda-closeout-result-root; private proof results must stay local-only.',
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
  const cpuSafeGpuModelRouteProof = sourceCpuSafeGpuModelRouteProof()
  const cpuModelGpuModelRouteProof = sourceCpuModelGpuModelRouteProof()

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
  const cpuSafeGpuModelRouteProofSummary =
    summarizeCpuSafeGpuModelRouteProof(
      cpuSafeGpuModelRouteProof,
      nonGpuExecutableTools.length,
    )
  const cpuModelGpuModelRouteProofSummary =
    summarizeCpuModelGpuModelRouteProof(
      cpuModelGpuModelRouteProof,
      nonGpuExecutableTools.length,
      cpuSafeGpuModelRouteProofSummary.accepted
        ? cpuSafeGpuModelRouteProofSummary.executableToolIds
        : [],
    )
  const acceptedProofSubsetGpuToolIds = [
    ...new Set([
      ...gpuExecutableTools.map((row) => String(row.toolId)),
      ...(cpuSafeGpuModelRouteProofSummary.accepted
        ? cpuSafeGpuModelRouteProofSummary.executableToolIds
        : []),
      ...(cpuModelGpuModelRouteProofSummary.accepted
        ? cpuModelGpuModelRouteProofSummary.combinedGpuExecutableToolIds
        : []),
    ]),
  ].filter((toolId) =>
    (AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS as readonly string[])
      .includes(toolId))
  const proofInclusiveExecutableToolCount =
    nonGpuExecutableTools.length + acceptedProofSubsetGpuToolIds.length
  const proofInclusiveGpuModelBlockedToolCount =
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.length -
    acceptedProofSubsetGpuToolIds.length
  const acceptedProofSubsetGpuToolIdSet =
    new Set(acceptedProofSubsetGpuToolIds)
  const proofInclusiveToolRows = toolRows.map((row) => {
    if (
      row.group === 'gpu_model' &&
      acceptedProofSubsetGpuToolIdSet.has(String(row.toolId))
    ) {
      return {
        ...row,
        controlledRouteProofBackedExecutable: true,
        controlledRouteProofBackedExecutableSource:
          cpuSafeGpuModelRouteProofSummary.executableToolIds.includes(String(row.toolId))
            ? 'cpu_safe_gpu_model_route_proof'
            : cpuModelGpuModelRouteProofSummary.combinedGpuExecutableToolIds.includes(String(row.toolId))
            ? 'cpu_model_gpu_model_route_proof'
            : 'private_local_runtime_proof',
        controlledExecutionRuntimePresentNow: true,
        installReadinessState:
          'controlled_runtime_present_and_executed_with_accepted_private_route_proof',
        executable: true,
        blockedWithReason: false,
        failedWithDiagnostics: false,
        readinessState: 'executable',
        executionAttempted: true,
        executionPassed: true,
        blockingPrerequisite: null,
        currentBlockingPrerequisiteKey: null,
        currentBlockingReasonCode: null,
        remainingPrivateRuntimeInputKeys: [],
        executionUnlockPlan: [],
        fastestGpuModelUnlockCandidate: false,
      }
    }
    return {
      ...row,
      controlledRouteProofBackedExecutable: row.executable === true,
      controlledRouteProofBackedExecutableSource: row.executable === true
        ? 'direct_controlled_adapter_execution'
        : null,
    }
  })
  const proofInclusiveExecutableTools =
    proofInclusiveToolRows.filter((row) => row.executable)
  const proofInclusiveBlockedRows =
    proofInclusiveToolRows.filter((row) => row.blockedWithReason)
  const proofInclusiveGpuBlockedRows =
    proofInclusiveBlockedRows.filter((row) => row.group === 'gpu_model')
  const proofInclusiveFailedRows =
    proofInclusiveToolRows.filter((row) => row.failedWithDiagnostics)
  const proofInclusiveExecutionScope = {
    ...executionScope,
    agentCanExecuteGpuModelToolsNow:
      acceptedProofSubsetGpuToolIds.length > 0,
    agentCanExecuteAll21ControlledToolsNow:
      proofInclusiveExecutableToolCount === 21,
    agentExecutableToolCountNow: proofInclusiveExecutableToolCount,
    agentExecutableGpuModelToolCountNow:
      acceptedProofSubsetGpuToolIds.length,
    gpuModelBlockedToolCountNow:
      proofInclusiveGpuModelBlockedToolCount,
    agentCanExecuteGpuModelProofSubsetNow:
      acceptedProofSubsetGpuToolIds.length > 0,
    agentExecutableToolCountWithAcceptedProofNow:
      proofInclusiveExecutableToolCount,
    agentExecutableGpuModelProofSubsetToolCountNow:
      acceptedProofSubsetGpuToolIds.length,
    gpuModelBlockedToolCountWithAcceptedProofNow:
      proofInclusiveGpuModelBlockedToolCount,
    acceptedProofSubsetGpuToolIds,
  }
  const nativeCudaClosure = remainingNativeCudaClosure(
    proofInclusiveToolRows,
    currentHostEnvironment,
    localRuntimeProofResultPaths,
  )
  const privateRuntimeProofSupplied =
    suppliedPrivateLocalRuntimeProofs.length > 0
  const cpuModelRouteProofStillHasBlockedTools =
    cpuModelGpuModelRouteProofSummary.accepted === true &&
    cpuModelGpuModelRouteProofSummary.allExpectedAccepted !== true
  const nextGpuModelUnlockCandidate =
    cpuModelRouteProofStillHasBlockedTools
      ? {
          toolIds:
            cpuModelGpuModelRouteProofSummary
              .rejectedAsTooSlowOrStillBlockedToolIds,
          reason:
            'CPU-model controlled route proof is partially accepted. Transparent Background now executes, but Real-ESRGAN and rembg still return failed_with_diagnostics, so those two are the next fastest closeout before the native CUDA SAM2/BiRefNet lane.',
          recommendedBackend: 'docker_container_cpu_model_runtime',
          canonicalProofImage: canonicalGpuWorkerProofImage,
          nextExactCommand: cpuModelGpuModelRouteProofSummary.proofCommand,
          nextExactControlledRouteCommand:
            cpuModelGpuModelRouteProofSummary.proofCommand,
          nextExactProofRefBridgeCommand:
            'Rerun external-agent execution readiness with accepted proof refs for real_esrgan and rembg after their scoped route failures are fixed.',
          nextExactReadinessWithPrivateProofCommand:
            'npm run --silent ai-graphics:external-agent-execution-readiness -- --cpu-safe-gpu-model-route-proof-packet <accepted-cpu-safe-proof.json> --cpu-model-gpu-model-route-proof-packet <accepted-real-esrgan-rembg-transparent-background-proof.json> --write-records',
          remainsBlockedUntil:
            'Fix the Real-ESRGAN/rembg CPU-model route failure diagnostics and rerun the scoped private controlled route proof without starting idle GPU.',
        }
      : (privateRuntimeProofSupplied || cpuModelGpuModelRouteProofSummary.accepted) &&
    nativeCudaClosure.remainingToolCount > 0
      ? {
          toolIds: nativeCudaClosure.remainingToolIds,
          reason:
            'Accepted private local runtime proof already covers the CPU foundation, CPU tensor, and CPU model GPU/model tools. The remaining unlock path is native CUDA proof for SAM2 and BiRefNet with reviewed private model/source inputs.',
          recommendedBackend: 'docker_container_native_cuda',
          nativeCudaCloseoutCommand:
            nativeCudaClosure.nativeCudaCloseoutCommand,
          nativeCudaCloseoutStrictCommand:
            nativeCudaClosure.nativeCudaCloseoutStrictCommand,
          nativeCudaCloseoutScriptGeneratorCommand:
            nativeCudaClosure.nativeCudaCloseoutScriptGeneratorCommand,
          nativeCudaCloseoutScriptPath:
            nativeCudaClosure.nativeCudaCloseoutScriptPath,
          all21CloseoutReadinessCommand:
            nativeCudaClosure.all21CloseoutReadinessCommand,
          nativeCudaCloseoutDiagnosticCommand:
            nativeCudaClosure.nativeCudaCloseoutDiagnosticCommand,
          currentHostEligibleForNativeGpuProof:
            nativeCudaClosure.currentHostEligibleForNativeGpuProof,
          currentHostBlockers: nativeCudaClosure.currentHostBlockers,
          remainsBlockedUntil:
            'Run the native CUDA closeout on a linux/amd64 host with Docker NVIDIA runtime, nvidia-smi, CUDA-visible proof containers, reviewed private SAM2/BiRefNet model inputs, and the accepted CPU-safe and CPU-model GPU/model route proof packets.',
        }
      : {
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
        }
  const nextExactAction =
    executableTools.length === 21
      ? 'All 21 AI graphics tools have accepted controlled external-agent execution proof. Keep production/beta/public-artifact gates closed until the separate launch gates approve them.'
      : privateRuntimeProofSupplied &&
        nativeCudaClosure.remainingToolCount > 0
      ? 'Private proof now covers the accepted GPU/model subset. Run the next scoped proof only for tools with real accepted private runtime evidence; GPU must start only during active scoped tool calls.'
      : cpuModelGpuModelRouteProofSummary.accepted
      ? `Controlled route proof now covers ${proofInclusiveExecutableToolCount}/21 tools: 13 non-GPU tools plus the accepted GPU/model proof subset (${acceptedProofSubsetGpuToolIds.join(', ')}). Keep the remaining GPU/model tools blocked until their scoped private runtime proof succeeds.`
      : 'First target kornia with the container local-dev CPU tensor command. After kornia returns structured private local output, feed that private harness result into the GPU/model runtime proof-ref bridge, then repeat per GPU/model tool with reviewed model/checkpoint paths where required.'

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-execution-readiness',
    decision,
    status: gpuExecutableTools.length > 0 ||
      cpuSafeGpuModelRouteProofSummary.accepted ||
      cpuModelGpuModelRouteProofSummary.accepted
      ? privateProofStatus
      : defaultStatus,
    summary:
      `Strict external-agent readiness report for all 21 AI graphics tools. Callable means the agent can submit a controlled private request. Executable means the controlled adapter actually performed bounded runtime work and returned structured private output evidence. The 13 non-GPU tools execute through controlled CPU/static or browser/runtime adapters and are also proven through the mock worker-claim-to-canonical-route smoke. ${acceptedProofSubsetGpuToolIds.length} GPU/model tools have accepted controlled-route proof in the current packet: ${acceptedProofSubsetGpuToolIds.join(', ') || 'none'}. Remaining GPU/model tools stay blocked or failed-with-diagnostics until their scoped private runtime proof succeeds. Capability-mismatch calls fail closed with failed_with_diagnostics and do not invoke adapters.`,
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
            source:
              nativeCudaCloseoutExpandedProofResultPaths.includes(
                localRuntimeProofResultPaths[index],
              )
                ? 'native_cuda_closeout_result_root'
                : 'explicit_local_runtime_proof_result',
            decision: proof.decision,
            status: proof.status,
            rows: Array.isArray(proof.gpuModelLocalDevRuntimeExecutionHarnessRows)
              ? proof.gpuModelLocalDevRuntimeExecutionHarnessRows.length
              : 0,
            mergedIntoReadinessRows: true,
          }))
        : null,
      nativeCudaCloseoutResultRoots: nativeCudaCloseoutResultRoots.length > 0
        ? nativeCudaCloseoutResultRoots.map((rootPath) => ({
            rootPath,
            expectedProofResultPaths:
              nativeCudaCloseoutProofPathsFromRoot(rootPath),
            expandedIntoLocalRuntimeProofResults: true,
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
      cpuSafeGpuModelRouteProof: {
        accepted: cpuSafeGpuModelRouteProofSummary.accepted,
        status: cpuSafeGpuModelRouteProofSummary.status,
        proofCommand: cpuSafeGpuModelRouteProofSummary.proofCommand,
        sourceEvidence: cpuSafeGpuModelRouteProofSummary.sourceEvidence,
      },
      cpuModelGpuModelRouteProof: {
        accepted: cpuModelGpuModelRouteProofSummary.accepted,
        status: cpuModelGpuModelRouteProofSummary.status,
        proofCommand: cpuModelGpuModelRouteProofSummary.proofCommand,
        sourceEvidence: cpuModelGpuModelRouteProofSummary.sourceEvidence,
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
    executionScope: proofInclusiveExecutionScope,
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
        proofInclusiveToolRows.filter((row) => row.controlledExecutionRuntimePresentNow).length,
      agentCallableTools: proofInclusiveToolRows.filter((row) => row.callable).length,
      agentExecutableTools: proofInclusiveExecutableToolCount,
      agentExecutableToolsWithAcceptedProof:
        proofInclusiveExecutableToolCount,
      cpuStaticExecutableTools: toolRows.filter(
        (row) => row.group === 'cpu_static' && row.executable,
      ).length,
      browserRuntimeExecutableTools: toolRows.filter(
        (row) => row.group === 'browser_runtime' && row.executable,
      ).length,
      gpuToolsWithValidRuntimeProof:
        acceptedProofSubsetGpuToolIds.length,
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
      gpuModelBlockedWithReasonTools:
        proofInclusiveGpuBlockedRows.length,
      currentHostGpuProofBlockers:
        currentHostGpuProofBlockers.length,
      blockedWithReasonTools:
        proofInclusiveBlockedRows.length,
      failedWithDiagnosticsTools: proofInclusiveFailedRows.length,
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
        Array.isArray(nextGpuModelUnlockCandidate?.toolIds)
          ? nextGpuModelUnlockCandidate.toolIds.length
          : 0,
      privateLocalRuntimeProofResultSuppliedTools:
        suppliedPrivateLocalRuntimeProofs.reduce((total, proof) => (
          total + (
            Array.isArray(proof.gpuModelLocalDevRuntimeExecutionHarnessRows)
              ? proof.gpuModelLocalDevRuntimeExecutionHarnessRows.length
              : 0
          )
        ), 0),
      cpuSafeGpuModelRouteProofAttemptedTools:
        cpuSafeGpuModelRouteProofSummary.attemptedToolIds.length,
      cpuSafeGpuModelRouteProofExecutableTools:
        cpuSafeGpuModelRouteProofSummary.executableTools,
      agentExecutableToolsWithCpuSafeGpuModelRouteProof:
        cpuSafeGpuModelRouteProofSummary
          .agentExecutableToolsWithCpuSafeGpuModelRouteProof,
      remainingGpuModelBlockedToolsAfterCpuSafeGpuModelRouteProof:
        cpuSafeGpuModelRouteProofSummary.remainingGpuModelBlockedTools,
      cpuModelGpuModelRouteProofAttemptedTools:
        cpuModelGpuModelRouteProofSummary.attemptedToolIds.length,
      cpuModelGpuModelRouteProofExecutableTools:
        cpuModelGpuModelRouteProofSummary.executableTools,
      agentExecutableToolsWithCpuSafeAndCpuModelGpuModelRouteProof:
        cpuModelGpuModelRouteProofSummary
          .agentExecutableToolsWithCpuSafeAndCpuModelGpuModelRouteProof,
      remainingGpuModelBlockedToolsAfterCpuSafeAndCpuModelGpuModelRouteProof:
        cpuModelGpuModelRouteProofSummary.remainingGpuModelBlockedTools,
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
      seventeenToolsHaveAcceptedControlledExecutionProofNow:
        proofInclusiveExecutableTools.length === 17,
      nineteenToolsHaveAcceptedControlledExecutionProofNow:
        proofInclusiveExecutableTools.length === 19,
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
        proofInclusiveGpuBlockedRows.length +
        acceptedProofSubsetGpuToolIds.length === 8,
      gpuModelProofRefBridgeBlocksUntilPrivateProof:
        toolRows
          .filter((row) => row.group === 'gpu_model')
          .every((row) => row.routeSubmissionReadyWithAcceptedPrivateProof === false),
      scopedGpuModelRuntimeProofAcceptedTools: gpuExecutableTools.length,
      acceptedGpuModelControlledRouteProofTools:
        acceptedProofSubsetGpuToolIds.length,
      privateLocalRuntimeProofResultSupplied:
        suppliedPrivateLocalRuntimeProofs.length > 0,
      nativeCudaCloseoutResultRootSupplied:
        nativeCudaCloseoutResultRoots.length > 0,
      explicitLocalRuntimeProofResultSupplied:
        explicitLocalRuntimeProofResultPaths.length > 0,
      cpuSafeGpuModelRouteProofAttempted:
        cpuSafeGpuModelRouteProofSummary.attempted,
      cpuSafeGpuModelRouteProofAccepted:
        cpuSafeGpuModelRouteProofSummary.accepted,
      agentCanExecuteCpuSafeGpuModelRouteProofToolsNow:
        cpuSafeGpuModelRouteProofSummary.accepted,
      agentCanExecute16ControlledRouteToolsWithCpuSafeGpuModelRouteProofNow:
        cpuSafeGpuModelRouteProofSummary
          .agentExecutableToolsWithCpuSafeGpuModelRouteProof === 16,
      cpuModelGpuModelRouteProofAttempted:
        cpuModelGpuModelRouteProofSummary.attempted,
      cpuModelGpuModelRouteProofAccepted:
        cpuModelGpuModelRouteProofSummary.accepted,
      agentCanExecuteCpuModelGpuModelRouteProofToolsNow:
        cpuModelGpuModelRouteProofSummary.accepted,
      agentCanExecute19ControlledRouteToolsWithCpuSafeAndCpuModelGpuModelRouteProofNow:
        cpuModelGpuModelRouteProofSummary
          .agentExecutableToolsWithCpuSafeAndCpuModelGpuModelRouteProof === 19,
      agentCanExecute17ControlledRouteToolsWithCpuSafeAndCpuModelGpuModelRouteProofNow:
        cpuModelGpuModelRouteProofSummary
          .agentExecutableToolsWithCpuSafeAndCpuModelGpuModelRouteProof === 17,
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
      agentCanExecuteAll21ToolsNow:
        proofInclusiveExecutableToolCount === 21,
      agentCanExecuteAll21ControlledToolsNow:
        proofInclusiveExecutionScope.agentCanExecuteAll21ControlledToolsNow,
      agentCanExecuteGpuModelToolsNow:
        acceptedProofSubsetGpuToolIds.length > 0,
      currentHostGpuProofPreflightRequested:
        executionScope.currentHostGpuProofPreflightRequested,
      currentHostEligibleForGpuProof:
        executionScope.currentHostEligibleForGpuProof,
      routeExecutionApprovedNow: true,
      routeExecutionPerformedInReadinessRunner: !hasFlag('--use-records-only'),
      controlledWorkerRouteExecutionPerformedInReadinessRunner:
        !hasFlag('--use-records-only'),
      toolExecutionApprovedFor13ControlledToolsNow: true,
      toolExecutionApprovedForGpuModelToolsNow:
        acceptedProofSubsetGpuToolIds.length > 0,
      toolExecutionApprovedForAll21ToolsNow:
        proofInclusiveExecutableToolCount === 21,
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
    toolReadinessRows: proofInclusiveToolRows,
    cpuSafeGpuModelRouteProof: cpuSafeGpuModelRouteProofSummary,
    cpuModelGpuModelRouteProof: cpuModelGpuModelRouteProofSummary,
    remainingNativeCudaClosure: nativeCudaClosure,
    fastestGpuModelUnlockCandidate: nextGpuModelUnlockCandidate,
    nextExactAction,
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const inlineToolIds = (toolIds: string[]) => (
    toolIds.length ? `\`${toolIds.join('`, `')}\`` : '`none`'
  )
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
  const unlockCandidate = report.fastestGpuModelUnlockCandidate as JsonRecord
  const unlockCandidateToolLabel = Array.isArray(unlockCandidate.toolIds)
    ? unlockCandidate.toolIds.join(', ')
    : unlockCandidate.toolId ?? 'none'
  const unlockCandidateRecommendedBackend =
    unlockCandidate.recommendedBackend ?? 'native_cuda_closeout'
  const unlockCandidateCanonicalProofImage =
    unlockCandidate.canonicalProofImage ?? 'see native CUDA closeout commands'
  const unlockCandidateBuildCommand =
    unlockCandidate.nextExactContainerBuildCommand ??
    unlockCandidate.nativeCudaCloseoutScriptGeneratorCommand ??
    'none'
  const unlockCandidateDirectCommand =
    unlockCandidate.nextExactCommand ??
    unlockCandidate.nativeCudaCloseoutCommand ??
    'none'
  const unlockCandidateRouteCommand =
    unlockCandidate.nextExactControlledRouteCommand ??
    unlockCandidate.nativeCudaCloseoutStrictCommand ??
    'none'
  const unlockCandidateBridgeCommand =
    unlockCandidate.nextExactProofRefBridgeCommand ??
    unlockCandidate.all21CloseoutReadinessCommand ??
    'none'
  const unlockCandidateReadinessCommand =
    unlockCandidate.nextExactReadinessWithPrivateProofCommand ??
    unlockCandidate.all21CloseoutReadinessCommand ??
    'none'
  const unlockCandidateHostPreflightCommand =
    unlockCandidate.nextExactCurrentHostPreflightCommand ??
    report.remainingNativeCudaClosure.currentHostPreflightCommand ??
    'none'
  const unlockCandidateExpectedBlocker =
    unlockCandidate.expectedCurrentHostBlockerWhenNoNvidiaGpuIsAttached ??
    unlockCandidate.remainsBlockedUntil ??
    'none'
  const cpuModelAcceptedTools =
    report.cpuModelGpuModelRouteProof.executableToolIds
  const cpuModelStillBlockedTools =
    report.cpuModelGpuModelRouteProof.rejectedAsTooSlowOrStillBlockedToolIds
  const combinedAcceptedGpuProofTools =
    report.cpuModelGpuModelRouteProof.combinedGpuExecutableToolIds
  const cpuModelProofSummarySentence = cpuModelAcceptedTools.length > 0
    ? `accepted CPU-model route proof currently applies to ${inlineToolIds(cpuModelAcceptedTools)}. The CPU-model tools still blocked after investigation are ${inlineToolIds(cpuModelStillBlockedTools)}.`
    : `CPU-model route proof has not accepted any of ${inlineToolIds(report.cpuModelGpuModelRouteProof.expectedToolIds)} yet.`
  const nativeCudaHostBlockersLabel =
    report.remainingNativeCudaClosure.currentHostPreflightRequested === true
      ? report.remainingNativeCudaClosure.currentHostBlockers.join('; ') || 'none'
      : 'not_checked_run_host_preflight_command'

  return `# AI Graphics External Agent Execution Readiness

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This is the strict all-21 external-agent readiness report. It separates \`callable\` from \`executable\`: all 21 tools can receive controlled private requests, 13 tools execute controlled local adapters now, and those 13 are also proven through the mock worker-claim-to-canonical-route smoke. The eight GPU/model tools now carry explicit install-proof linkage from \`gpu-model-install-build-targets\`: their package/runtime images were proved at install/import-smoke level, while runtime execution still requires private proof refs and tool-specific inputs. CPU foundation proof applies to \`torch_torchvision\` and \`transformers\`, CPU tensor proof applies to \`kornia\`, and ${cpuModelProofSummarySentence} Native CUDA remains required for \`sam2\` and \`birefnet\`. The mounted route also proves a capability-mismatch request returns \`failed_with_diagnostics\` without invoking an adapter. GPU runtime is on-demand only and does not start idle.

## State Definitions

${Object.entries(report.stateDefinitions).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Execution Scope

${Object.entries(report.executionScope).map(([key, value]) => `- \`${key}\`: ${Array.isArray(value) ? value.join('; ') || 'none' : value}`).join('\n')}

## Install Proof Linkage

- GPU/model install proof source: \`${report.sourceEvidence.gpuModelInstallBuildTargets.proofScope}\`
- All eight GPU/model install-proof targets built locally: \`${report.sourceEvidence.gpuModelInstallBuildTargets.all8GpuModelInstallProofTargetsBuiltLocally}\`
- Native GPU runtime still required before model execution: \`${report.sourceEvidence.gpuModelInstallBuildTargets.nativeGpuRuntimeStillRequired}\`
- Guard: install/import-smoke proof is not runtime execution proof and does not start native GPU, load model weights, process media, create public artifacts, or sign URLs.

## CPU-Safe GPU/Model Controlled Route Proof

- Status: \`${report.cpuSafeGpuModelRouteProof.status}\`
- Attempted: \`${report.cpuSafeGpuModelRouteProof.attempted}\`
- Accepted: \`${report.cpuSafeGpuModelRouteProof.accepted}\`
- Expected tools: \`${report.cpuSafeGpuModelRouteProof.expectedToolIds.join(', ')}\`
- Executed tools: \`${report.cpuSafeGpuModelRouteProof.executableToolIds.join(', ') || 'none'}\`
- Executable tool count with this local proof: \`${report.cpuSafeGpuModelRouteProof.agentExecutableToolsWithCpuSafeGpuModelRouteProof}\`
- Remaining GPU/model blocked tools: \`${report.cpuSafeGpuModelRouteProof.remainingGpuModelBlockedToolIds.join(', ') || 'none'}\`
- Proof command: \`${report.cpuSafeGpuModelRouteProof.proofCommand}\`
- Proof output root: \`${report.cpuSafeGpuModelRouteProof.proofOutputRoot}\`
- Proof source image: \`${report.cpuSafeGpuModelRouteProof.proofSourceImage}\`
- Guard: this proof uses the scoped controlled external-agent route, keeps GPU idle for CPU-safe model tools, writes only local private artifacts, and does not approve the five remaining model tools.

| Tool | State | Output kind | Output hash | Local GPU/model runtime performed | GPU starts now | Adapter executed |
| --- | --- | --- | --- | ---: | ---: | ---: |
${report.cpuSafeGpuModelRouteProof.proofRows.map((row) => `| \`${row.toolId}\` | \`${row.externalAgentExecutionState}\` | \`${row.outputKind}\` | \`${row.outputSha256}\` | ${row.localGpuModelRuntimeExecutionPerformed} | ${row.gpuRuntimeShouldStartNow} | ${row.controlledAdapterExecutedNow} |`).join('\n') || '| `none` | `not_attempted` | `none` | `none` | false | false | false |'}

## CPU-Model GPU/Model Controlled Route Proof

- Status: \`${report.cpuModelGpuModelRouteProof.status}\`
- Attempted: \`${report.cpuModelGpuModelRouteProof.attempted}\`
- Accepted: \`${report.cpuModelGpuModelRouteProof.accepted}\`
- Expected tools: \`${report.cpuModelGpuModelRouteProof.expectedToolIds.join(', ')}\`
- Executed tools: \`${report.cpuModelGpuModelRouteProof.executableToolIds.join(', ') || 'none'}\`
- Combined GPU/model proof tools: \`${combinedAcceptedGpuProofTools.join(', ') || 'none'}\`
- Executable tool count with CPU-safe plus CPU-model local proof: \`${report.cpuModelGpuModelRouteProof.agentExecutableToolsWithCpuSafeAndCpuModelGpuModelRouteProof}\`
- Remaining GPU/model blocked tools: \`${report.cpuModelGpuModelRouteProof.remainingGpuModelBlockedToolIds.join(', ') || 'none'}\`
- Tools proven executable by this route proof: \`${report.cpuModelGpuModelRouteProof.executableToolIds.join(', ') || 'none'}\`
- Proof command: \`${report.cpuModelGpuModelRouteProof.proofCommand}\`
- Proof output root: \`${report.cpuModelGpuModelRouteProof.proofOutputRoot}\`
- Proof source image: \`${report.cpuModelGpuModelRouteProof.proofSourceImage}\`
- Guard: this proof accepts only ${inlineToolIds(cpuModelAcceptedTools)} from the CPU-model group because those tools produced structured private output through the mounted controlled route with CPU model runtime and GPU idle after the active scoped call completed. The CPU-model tools still blocked are ${inlineToolIds(cpuModelStillBlockedTools)}; native CUDA remains a separate closeout path for \`sam2\` and \`birefnet\`.

| Tool | State | Output kind | Output hash | Local GPU/model runtime performed | GPU starts now | Adapter executed |
| --- | --- | --- | --- | ---: | ---: | ---: |
${report.cpuModelGpuModelRouteProof.proofRows.map((row) => `| \`${row.toolId}\` | \`${row.externalAgentExecutionState}\` | \`${row.outputKind}\` | \`${row.outputSha256}\` | ${row.localGpuModelRuntimeExecutionPerformed} | ${row.gpuRuntimeShouldStartNow} | ${row.controlledAdapterExecutedNow} |`).join('\n') || '| `none` | `not_attempted` | `none` | `none` | false | false | false |'}

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
- Current host preflight requested: \`${report.remainingNativeCudaClosure.currentHostPreflightRequested}\`
- Current host eligible for native GPU proof: \`${report.remainingNativeCudaClosure.currentHostEligibleForNativeGpuProof}\`
- Current host blockers: \`${nativeCudaHostBlockersLabel}\`
- Host preflight command: \`${report.remainingNativeCudaClosure.currentHostPreflightCommand}\`
- Native CUDA script generator command: \`${report.remainingNativeCudaClosure.nativeCudaCloseoutScriptGeneratorCommand}\`
- Native CUDA generated script path: \`${report.remainingNativeCudaClosure.nativeCudaCloseoutScriptPath}\`
- Native CUDA closeout command: \`${report.remainingNativeCudaClosure.nativeCudaCloseoutCommand}\`
- Native CUDA strict closeout command: \`${report.remainingNativeCudaClosure.nativeCudaCloseoutStrictCommand}\`
- Native CUDA closeout diagnostic command: \`${report.remainingNativeCudaClosure.nativeCudaCloseoutDiagnosticCommand}\`
- Private model root inspected: \`${report.remainingNativeCudaClosure.privateModelRootInspection.inspected}\`
- Private model root exists: \`${report.remainingNativeCudaClosure.privateModelRootInspection.rootExists}\`
- All-21 closeout readiness command: \`${report.remainingNativeCudaClosure.all21CloseoutReadinessCommand}\`

| Tool | Current state | Current blocker | Model field | Expected candidates | Model candidate present | Matching candidate | Private-root manifest command | Explicit-path manifest command | Native proof command | Final manifest tool call | Direct private-root tool call | Direct explicit-path tool call |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
${report.remainingNativeCudaClosure.tools.map((entry) => `| \`${entry.toolId}\` | \`${entry.currentReadinessState}\` | \`${entry.currentBlockingPrerequisiteKey ?? 'none'}\` | \`${entry.modelField}\` | \`${entry.expectedPrivateRootCandidates.join(', ')}\` | ${entry.privateModelRootCandidatePresent} | \`${entry.privateModelRootMatchingCandidate ?? 'none'}\` | \`${entry.manifestMaterializerCommand}\` | \`${entry.explicitModelPathManifestMaterializerCommand}\` | \`${entry.nativeGpuProofSequenceCommand}\` | \`${entry.finalExternalAgentToolCallCommand}\` | \`${entry.directExternalAgentToolCallWithPrivateRootCommand}\` | \`${entry.directExternalAgentToolCallWithExplicitModelPathCommand}\` |`).join('\n')}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Fastest GPU/Model Unlock Candidate

- Tool: \`${unlockCandidateToolLabel}\`
- Recommended backend: \`${unlockCandidateRecommendedBackend}\`
- Canonical proof image: \`${unlockCandidateCanonicalProofImage}\`
- Reason: ${unlockCandidate.reason}
- Expected current-host blocker without attached NVIDIA GPU: \`${unlockCandidateExpectedBlocker}\`
- Build proof-local image if missing: \`${unlockCandidateBuildCommand}\`
- Next direct harness command: \`${unlockCandidateDirectCommand}\`
- Next controlled route command: \`${unlockCandidateRouteCommand}\`
- Next proof-ref bridge command: \`${unlockCandidateBridgeCommand}\`
- Next direct readiness command with private proof: \`${unlockCandidateReadinessCommand}\`
- Next current-host preflight command: \`${unlockCandidateHostPreflightCommand}\`

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
