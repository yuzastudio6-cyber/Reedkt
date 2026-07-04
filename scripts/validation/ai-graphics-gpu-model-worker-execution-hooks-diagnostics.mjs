#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const requiredFiles = [
  'server/workers/ai-graphics-runtime-script-runner.ts',
  'server/workers/production/production-worker-router.ts',
  'server/workers/production/production-worker-types.ts',
  'server/workers/model-runtime-foundation/ai-graphics-foundation-execution-runner.ts',
  'server/workers/model-runtime-foundation/index.ts',
  'server/workers/masks/sam2-execution-runner.ts',
  'server/workers/masks/birefnet-execution-runner.ts',
  'server/workers/masks/kornia-mask-refinement-adapter.ts',
  'server/workers/masks/rembg-adapter.ts',
  'server/workers/masks/transparent-background-adapter.ts',
  'server/workers/enhancement/real-esrgan-execution-runner.ts',
  'docker/prod/model-runtime-foundation/foundation_local.py',
  'docker/prod/sam2-runtime/sam2_runtime_local.py',
  'docker/prod/birefnet-runtime/birefnet_local.py',
  'docker/prod/kornia-runtime/kornia_local.py',
  'docker/prod/rembg-runtime/rembg_local.py',
  'docker/prod/transparent-background-runtime/transparent_background_local.py',
  'docker/prod/real-esrgan-runtime/real_esrgan_local.py',
  'package.json',
]

const failures = []

function requireFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`)
    return ''
  }
  return readFileSync(absolutePath, 'utf8')
}

for (const relativePath of requiredFiles) {
  requireFile(relativePath)
}

const helper = requireFile('server/workers/ai-graphics-runtime-script-runner.ts')
for (const token of [
  'execFileAsync',
  "MODEL_DOWNLOADS_ENABLED: 'false'",
  "PROVIDER_EXECUTION_ENABLED: 'false'",
  "HF_HUB_OFFLINE: '1'",
  "TRANSFORMERS_OFFLINE: '1'",
  "addMount({ hostPath: cwd, containerPath: cwd, mode: 'ro' })",
  'bindMountDirectoryForPath(outputJsonPath)',
  'must be a local/private filesystem path or command argument, not a URL',
]) {
  if (!helper.includes(token)) {
    failures.push(`Runtime script helper is missing expected guard: ${token}`)
  }
}

const productionRouter = requireFile('server/workers/production/production-worker-router.ts')
for (const token of [
  'executeAiGraphicsExternalAgentGpuModelControlledAdapter',
  'aiGraphicsGpuModelControlledAdapter',
  'hasAiGraphicsGpuModelControlledAdapterRequest',
  'buildAiGraphicsGpuModelControlledAdapterRequest',
  'gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter',
  'aiGraphicsGpuModelControlledAdapterResult',
  'isAiGraphicsExternalAgentGpuModelControlledAdapterTool',
]) {
  if (!productionRouter.includes(token)) {
    failures.push(`Production worker router is missing GPU/model controlled adapter route token: ${token}`)
  }
}

const productionTypes = requireFile('server/workers/production/production-worker-types.ts')
if (!productionTypes.includes('aiGraphicsGpuModelControlledAdapterResult?: unknown')) {
  failures.push('Production worker route output type is missing aiGraphicsGpuModelControlledAdapterResult.')
}

const controlledAdapterSource = requireFile('server/tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter.ts')
if (!controlledAdapterSource.includes('toolExecutionApprovedNow: localRuntimeExecutionPerformed')) {
  failures.push('GPU/model controlled adapter must only set toolExecutionApprovedNow when local runtime actually executed.')
}
if (!controlledAdapterSource.includes('gpuRuntimeApprovedForScopedControlledToolCall: localRuntimeExecutionPerformed')) {
  failures.push('GPU/model controlled adapter must only approve scoped GPU runtime when local runtime actually executed.')
}

const packageJson = JSON.parse(requireFile('package.json'))
if (
  packageJson.scripts?.['ai-graphics:gpu-model-worker-execution-hooks:diagnostics'] !==
  'node scripts/validation/ai-graphics-gpu-model-worker-execution-hooks-diagnostics.mjs'
) {
  failures.push('package.json is missing ai-graphics:gpu-model-worker-execution-hooks:diagnostics script.')
}

const runnerExpectations = [
  {
    file: 'server/workers/model-runtime-foundation/ai-graphics-foundation-execution-runner.ts',
    tokens: [
      'runAiGraphicsPythonRuntimeScript',
      'docker/prod/model-runtime-foundation/foundation_local.py',
      "tool: input.toolId",
      "status: 'completed'",
      'executes: true',
      "status: 'failed'",
      'foundation_runtime_disabled_or_not_local_dev',
      'foundation_runtime_output_directory_missing',
      'enableFoundationRuntimeExecution',
    ],
  },
  {
    file: 'server/workers/masks/sam2-execution-runner.ts',
    tokens: [
      'runAiGraphicsPythonRuntimeScript',
      'docker/prod/sam2-runtime/sam2_runtime_local.py',
      "status: 'completed'",
      'executes: true',
      "status: 'failed'",
      'sam2_output_directory_missing',
      'sam2_source_frame_missing',
      "sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]",
      "'--source-image-path'",
      "APPROVED_PRIVATE_SOURCE_FRAME_ENABLED: 'true'",
      'privateSourceFrameUsed: true',
    ],
  },
  {
    file: 'server/workers/masks/birefnet-execution-runner.ts',
    tokens: [
      'runAiGraphicsPythonRuntimeScript',
      'docker/prod/birefnet-runtime/birefnet_local.py',
      "status: 'completed'",
      'executes: true',
      "status: 'failed'",
      'birefnet_output_directory_missing',
      "sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]",
    ],
  },
  {
    file: 'server/workers/masks/kornia-mask-refinement-adapter.ts',
    tokens: [
      'runAiGraphicsPythonRuntimeScript',
      'docker/prod/kornia-runtime/kornia_local.py',
      "status: 'completed'",
      'executes: true',
      "status: 'failed'",
      'kornia_output_directory_missing',
      "sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]",
    ],
  },
  {
    file: 'server/workers/masks/rembg-adapter.ts',
    tokens: [
      'runAiGraphicsPythonRuntimeScript',
      'docker/prod/rembg-runtime/rembg_local.py',
      "status: 'completed'",
      'executes: true',
      "status: 'failed'",
      'rembg_output_directory_missing',
      'rembgModelLocalPath',
      "sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]",
    ],
  },
  {
    file: 'server/workers/masks/transparent-background-adapter.ts',
    tokens: [
      'runAiGraphicsPythonRuntimeScript',
      'docker/prod/transparent-background-runtime/transparent_background_local.py',
      "status: 'completed'",
      'executes: true',
      "status: 'failed'",
      'transparent_background_output_directory_missing',
      'transparentBackgroundCheckpointLocalPath',
      "sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]",
    ],
  },
  {
    file: 'server/workers/enhancement/real-esrgan-execution-runner.ts',
    tokens: [
      'runAiGraphicsPythonRuntimeScript',
      'docker/prod/real-esrgan-runtime/real_esrgan_local.py',
      "status: 'completed'",
      'executes: true',
      "status: 'failed'",
      'real_esrgan_output_directory_missing',
      "sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]",
    ],
  },
]

for (const expectation of runnerExpectations) {
  const source = requireFile(expectation.file)
  for (const token of expectation.tokens) {
    if (!source.includes(token)) {
      failures.push(`${expectation.file} is missing expected execution hook token: ${token}`)
    }
  }
  for (const blockedPhrase of [
    'scaffolded only; no inference is run',
    'plannedOnly: true',
  ]) {
    if (source.includes(blockedPhrase)) {
      failures.push(`${expectation.file} still contains planned-only blocker phrase: ${blockedPhrase}`)
    }
  }
}

const runtimeScriptExpectations = [
  {
    file: 'docker/prod/model-runtime-foundation/foundation_local.py',
    tokens: [
      'block_network()',
      'HF_HUB_OFFLINE',
      'MODEL_DOWNLOADS_ENABLED',
      'PROVIDER_EXECUTION_ENABLED',
      'TRANSFORMERS_OFFLINE',
      'torch.cuda.is_available()',
      'no CPU fallback is allowed',
      'import torchvision',
      'import transformers',
      'modelWeightsLoaded',
      'modelInferencePerformed',
      'modelDownloadedExternally',
    ],
  },
  {
    file: 'docker/prod/sam2-runtime/sam2_runtime_local.py',
    tokens: [
      'MODEL_DOWNLOADS_ENABLED',
      'PROVIDER_EXECUTION_ENABLED',
      'REAL_MEDIA_INPUT_ENABLED',
      'APPROVED_PRIVATE_SOURCE_FRAME_ENABLED',
      'parser.add_argument("--source-image-path", required=True)',
      'create_source_frame_sequence',
      'privateSourceFrameUsed',
      'broadRealMediaInputEnabled',
    ],
  },
  {
    file: 'docker/prod/kornia-runtime/kornia_local.py',
    tokens: [
      'block_network()',
      'MODEL_DOWNLOADS_ENABLED',
      'PROVIDER_EXECUTION_ENABLED',
      'torch.cuda.is_available()',
      'no CPU fallback is allowed',
      'import kornia',
      'kornia.filters.sobel',
      'modelDownloadedExternally',
    ],
  },
  {
    file: 'docker/prod/rembg-runtime/rembg_local.py',
    tokens: [
      'block_network()',
      'MODEL_DOWNLOADS_ENABLED',
      'PROVIDER_EXECUTION_ENABLED',
      'CUDAExecutionProvider',
      'no CPU fallback is allowed',
      'U2NET_HOME',
      'new_session',
      'remove',
      'modelDownloadedExternally',
    ],
  },
  {
    file: 'docker/prod/transparent-background-runtime/transparent_background_local.py',
    tokens: [
      'block_network()',
      'MODEL_DOWNLOADS_ENABLED',
      'PROVIDER_EXECUTION_ENABLED',
      'torch.cuda.is_available()',
      'no CPU fallback is allowed',
      'Remover',
      'ckpt=str(checkpoint_path)',
      'modelDownloadedExternally',
    ],
  },
]

for (const expectation of runtimeScriptExpectations) {
  const source = requireFile(expectation.file)
  for (const token of expectation.tokens) {
    if (!source.includes(token)) {
      failures.push(`${expectation.file} is missing expected runtime guard token: ${token}`)
    }
  }
  for (const blockedPhrase of [
    'requests.get(',
    'urllib.request',
    'from_pretrained(',
    'snapshot_download(',
  ]) {
    if (source.includes(blockedPhrase)) {
      failures.push(`${expectation.file} contains disallowed download/network token: ${blockedPhrase}`)
    }
  }
}

const packageLockDiff = execGit(['diff', '--name-only', '--', 'package-lock.json']).trim()
if (packageLockDiff) {
  failures.push('package-lock.json has unstaged modifications.')
}

const stagedPackageLockDiff = execGit(['diff', '--cached', '--name-only', '--', 'package-lock.json']).trim()
if (stagedPackageLockDiff) {
  failures.push('package-lock.json has staged modifications.')
}

const trackedLocalArtifacts = execGit(['ls-files', '.local-artifacts']).trim()
if (trackedLocalArtifacts) {
  failures.push(`.local-artifacts paths are tracked:\n${trackedLocalArtifacts}`)
}

const stagedGeneratedOutputs = execGit(['diff', '--cached', '--name-only']).split('\n').filter((line) => (
  line.includes('.local-artifacts/')
  || line.includes('/generated/')
  || line.includes('/render/')
  || line.includes('/browser/')
  || line.includes('/canvas/')
  || line.includes('/webgl/')
  || line.includes('/public/')
)).filter(Boolean)
if (stagedGeneratedOutputs.length > 0) {
  failures.push(`Generated/runtime output paths are staged:\n${stagedGeneratedOutputs.join('\n')}`)
}

if (failures.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    diagnostic: 'ai_graphics_gpu_model_worker_execution_hooks_diagnostics',
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  diagnostic: 'ai_graphics_gpu_model_worker_execution_hooks_diagnostics',
  executionHooks: {
    torch_torchvision: 'guarded_local_cuda_foundation_runtime_script_invocation',
    transformers: 'guarded_local_cuda_foundation_runtime_script_invocation',
    sam2: 'guarded_local_runtime_script_invocation',
    birefnet: 'guarded_local_runtime_script_invocation',
    kornia: 'guarded_local_cuda_tensor_runtime_script_invocation',
    rembg: 'guarded_local_cuda_onnx_runtime_script_invocation',
    transparent_background: 'guarded_local_cuda_checkpoint_runtime_script_invocation',
    real_esrgan: 'guarded_local_runtime_script_invocation',
  },
  packageLockUnchanged: true,
  localArtifactsTracked: false,
}, null, 2))

function execGit(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}
