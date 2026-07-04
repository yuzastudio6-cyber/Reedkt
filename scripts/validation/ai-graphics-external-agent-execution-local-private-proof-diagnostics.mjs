import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const proofImage = 'reeditpro/ai-graphics-gpu-worker:proof-local'
const platform = 'linux/amd64'
const proofTools = ['torch_torchvision', 'transformers', 'kornia']
const blockedModelTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]
const cpuModelRuntimeTools = ['real_esrgan', 'rembg', 'transparent_background']
const dockerRuntimeModulesByTool = {
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
  rembg: ['numpy', 'PIL', 'onnxruntime', 'rembg'],
  transparent_background: ['torch', 'PIL', 'numpy', 'transparent_background'],
}
const expectedBlockedKeys = {
  sam2: 'sam2CheckpointLocalPath',
  birefnet: 'birefnetModelLocalPath',
  real_esrgan: 'realEsrganModelLocalPath',
  rembg: 'rembgModelLocalPath',
  transparent_background: 'transparentBackgroundCheckpointLocalPath',
}
const privateInputPreflightAcceptedCode =
  'gpu_model_private_inputs_accepted_runtime_proof_not_requested'
const privateModelRootEnvVar = 'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT'
const privateSourceImageEnvVar = 'REEDITPRO_AI_GRAPHICS_PRIVATE_SOURCE_IMAGE'
const requirePrivateCpuModelProofEnvVar =
  'REEDITPRO_AI_GRAPHICS_REQUIRE_PRIVATE_CPU_MODEL_PROOF'

const failures = []

function fail(message) {
  failures.push(message)
}

function localPath(...segments) {
  return path.join(root, '.local-artifacts', 'ai-graphics', ...segments)
}

function relativeLocalPath(filePath) {
  return path.relative(root, filePath)
}

function runJson(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 96 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })
  return JSON.parse(output)
}

function runNpmJson(script, args = []) {
  return runJson('npm', ['run', '--silent', script, '--', ...args])
}

function runNpmJsonAttempt(script, args = [], options = {}) {
  const result = spawnSync('npm', ['run', '--silent', script, '--', ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 160 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      DEVELOPER_DIR:
        process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
    },
    ...options,
  })
  let json = null
  try {
    json = result.stdout ? JSON.parse(result.stdout) : null
  } catch {
    json = null
  }
  return {
    ok: result.status === 0,
    exitCode: result.status,
    signal: result.signal,
    json,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
  }
}

function ensureProofImage() {
  try {
    execFileSync('docker', ['image', 'inspect', proofImage], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
    })
  } catch (error) {
    throw new Error(
      `Required local proof image is unavailable: ${proofImage}. Build it first with ` +
        '`docker buildx build --platform linux/amd64 --target ai_graphics_install_proof ' +
        '-f docker/prod/gpu-worker/Dockerfile -t reeditpro/ai-graphics-gpu-worker:proof-local .`',
    )
  }
}

function dockerRuntimeModuleReadiness() {
  const code = `
import importlib.util
import json
import sys

raw = json.loads(sys.argv[1])
print(json.dumps({
    tool_id: [module for module in modules if importlib.util.find_spec(module) is None]
    for tool_id, modules in raw.items()
}, sort_keys=True))
`
  return runJson('docker', [
    'run',
    '--rm',
    '--platform',
    platform,
    '--entrypoint',
    'python3',
    proofImage,
    '-c',
    code,
    JSON.stringify(dockerRuntimeModulesByTool),
  ], { timeout: 30_000 })
}

function writePrivatePpm(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const lines = ['P3', '8 8', '255']
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      lines.push(`${x * 32} ${y * 32} ${(x + y) * 16}`)
    }
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8')
}

function writeRuntimeInputManifest(filePath, input) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(input, null, 2)}\n`, 'utf8')
}

function assertFalse(value, label) {
  if (value !== false) fail(`${label}_not_false`)
}

function assertTrue(value, label) {
  if (value !== true) fail(`${label}_not_true`)
}

function rowByTool(rows, toolId) {
  return rows.find((row) => row?.toolId === toolId)
}

function outputSha(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function optionalPrivateCpuModelRuntimeProof(input) {
  const privateModelRoot = process.env[privateModelRootEnvVar]
  const privateSourceImage = process.env[privateSourceImageEnvVar]
  const requireAllPrivateCpuModelProof =
    process.env[requirePrivateCpuModelProofEnvVar] === 'true'
  const requested = Boolean(privateModelRoot || privateSourceImage)
  const proofRoot = path.join(input.runRoot, 'private-cpu-model-runtime-proof')
  const records = []
  const acceptedTools = []
  const acceptedHarnessResultPaths = []

  if (!requested) {
    return {
      requested: false,
      status: 'not_requested_private_model_root_and_source_image_absent',
      envVars: {
        privateModelRootEnvVar,
        privateSourceImageEnvVar,
        requirePrivateCpuModelProofEnvVar,
      },
      requireAllPrivateCpuModelProof,
      attemptedTools: [],
      acceptedTools,
      acceptedHarnessResultPaths,
      records,
      nextExactAction:
        `Set ${privateModelRootEnvVar} to the reviewed private model root and ` +
        `${privateSourceImageEnvVar} to an approved private source frame, then rerun this diagnostic.`,
    }
  }

  if (!privateModelRoot || !privateSourceImage) {
    fail('private_cpu_model_runtime_env_incomplete')
    return {
      requested: true,
      status: 'blocked_private_model_root_or_source_image_env_missing',
      envVars: {
        privateModelRootEnvVar,
        privateSourceImageEnvVar,
        requirePrivateCpuModelProofEnvVar,
      },
      requireAllPrivateCpuModelProof,
      attemptedTools: [],
      acceptedTools,
      acceptedHarnessResultPaths,
      records,
      nextExactAction:
        `Provide both ${privateModelRootEnvVar} and ${privateSourceImageEnvVar}; ` +
        'missing private local inputs are blockers, not executable proof.',
    }
  }

  if (!fs.existsSync(privateModelRoot) || !fs.statSync(privateModelRoot).isDirectory()) {
    if (requireAllPrivateCpuModelProof) fail('private_cpu_model_runtime_root_missing')
    return {
      requested: true,
      status: 'blocked_private_model_root_not_readable',
      privateModelRoot,
      privateSourceImage,
      requireAllPrivateCpuModelProof,
      attemptedTools: [],
      acceptedTools,
      acceptedHarnessResultPaths,
      records,
      nextExactAction:
        `${privateModelRootEnvVar} must point to a readable private model directory.`,
    }
  }

  if (!fs.existsSync(privateSourceImage) || !fs.statSync(privateSourceImage).isFile()) {
    if (requireAllPrivateCpuModelProof) fail('private_cpu_model_runtime_source_image_missing')
    return {
      requested: true,
      status: 'blocked_private_source_image_not_readable',
      privateModelRoot,
      privateSourceImage,
      requireAllPrivateCpuModelProof,
      attemptedTools: [],
      acceptedTools,
      acceptedHarnessResultPaths,
      records,
      nextExactAction:
        `${privateSourceImageEnvVar} must point to a readable approved private source frame.`,
    }
  }

  for (const toolId of cpuModelRuntimeTools) {
    const toolOutputDir = path.join(proofRoot, toolId)
    const manifestOut = path.join(toolOutputDir, 'runtime-inputs.json')
    const harnessResultPath = path.join(toolOutputDir, 'harness-result.json')
    fs.mkdirSync(toolOutputDir, { recursive: true })

    const materializer = runNpmJsonAttempt(
      'ai-graphics:external-agent-gpu-model-runtime-input-manifest',
      [
        '--tool',
        toolId,
        '--source-image',
        privateSourceImage,
        '--private-model-root',
        privateModelRoot,
        '--output-dir',
        relativeLocalPath(toolOutputDir),
        '--manifest-out',
        relativeLocalPath(manifestOut),
        '--runtime-container-image',
        proofImage,
        '--runtime-container-platform',
        platform,
        '--allow-cpu-model-runtime',
        '--force',
      ],
    )

    if (!materializer.ok || !materializer.json?.ok) {
      records.push({
        toolId,
        stage: 'runtime_input_manifest',
        status: 'blocked_with_reason',
        exitCode: materializer.exitCode,
        errorMessage:
          materializer.json?.errorMessage ??
          materializer.stderr?.trim() ??
          materializer.error?.message ??
          'runtime input manifest materializer failed',
      })
      if (requireAllPrivateCpuModelProof) {
        fail(`private_cpu_model_runtime_manifest_blocked:${toolId}`)
      }
      continue
    }

    const sequence = runNpmJsonAttempt(
      'ai-graphics:external-agent-gpu-model-private-proof-sequence',
      [
        '--tool',
        toolId,
        '--attempt-local-runtime',
        '--runtime-input-manifest',
        relativeLocalPath(manifestOut),
        '--require-accepted-proof',
      ],
      { timeout: 30 * 60 * 1000 },
    )
    const sequenceJson = sequence.json ?? {}
    const accepted =
      sequence.ok &&
      sequenceJson.booleans?.acceptedPrivateProofForRequestedTool === true &&
      sequenceJson.booleans?.finalExternalAgentSingleToolCallExecutable === true &&
      sequenceJson.booleans?.gpuRuntimeShouldStartNow === false &&
      sequenceJson.booleans?.publicArtifactCreated === false &&
      sequenceJson.booleans?.signedUrlCreated === false

    records.push({
      toolId,
      stage: 'private_proof_sequence',
      status: accepted ? 'executable' : 'blocked_or_failed_with_diagnostics',
      exitCode: sequence.exitCode,
      manifestOut: relativeLocalPath(manifestOut),
      harnessResultPath: relativeLocalPath(harnessResultPath),
      acceptedPrivateProof:
        sequenceJson.booleans?.acceptedPrivateProofForRequestedTool === true,
      finalExternalAgentSingleToolCallExecutable:
        sequenceJson.booleans?.finalExternalAgentSingleToolCallExecutable === true,
      readinessAgentExecutableTools:
        sequenceJson.counts?.readinessAgentExecutableTools ?? null,
      readinessGpuToolsWithValidRuntimeProof:
        sequenceJson.counts?.readinessGpuToolsWithValidRuntimeProof ?? null,
      blockingPrerequisite:
        sequenceJson.requestedToolResult?.readiness?.blockingPrerequisite ?? null,
      harnessExecutionState:
        sequenceJson.requestedToolResult?.harness?.executionState ?? null,
      harnessErrorMessage:
        sequenceJson.requestedToolResult?.harness?.errorMessage ?? null,
      finalExternalAgentExecutionState:
        sequenceJson.requestedToolResult?.finalExternalAgentSingleToolCall
          ?.executionState ?? null,
      gpuRuntimeShouldStartNow:
        sequenceJson.booleans?.gpuRuntimeShouldStartNow === true,
      publicArtifactCreated:
        sequenceJson.booleans?.publicArtifactCreated === true,
      signedUrlCreated:
        sequenceJson.booleans?.signedUrlCreated === true,
      errorMessage:
        sequenceJson.requestedToolResult?.harness?.errorMessage ??
        sequence.stderr?.trim() ??
        sequence.error?.message ??
        null,
    })

    if (accepted) {
      acceptedTools.push(toolId)
      acceptedHarnessResultPaths.push(harnessResultPath)
    } else if (requireAllPrivateCpuModelProof) {
      fail(`private_cpu_model_runtime_proof_not_accepted:${toolId}`)
    }
  }

  return {
    requested: true,
    status:
      acceptedTools.length === cpuModelRuntimeTools.length
        ? 'accepted_private_cpu_model_runtime_proof_for_all_three'
        : acceptedTools.length > 0
        ? 'accepted_private_cpu_model_runtime_proof_for_subset'
        : 'blocked_or_failed_private_cpu_model_runtime_proof_for_all_three',
    privateModelRoot,
    privateSourceImage,
    requireAllPrivateCpuModelProof,
    attemptedTools: cpuModelRuntimeTools,
    acceptedTools,
    acceptedHarnessResultPaths: acceptedHarnessResultPaths.map(relativeLocalPath),
    records,
    nextExactAction:
      acceptedTools.length === cpuModelRuntimeTools.length
        ? 'Recompute all-21 readiness with the accepted private proof result paths and repeat for SAM2/BiRefNet on an approved native CUDA host.'
        : `Resolve the blocked private CPU model proof records, then rerun with ${requirePrivateCpuModelProofEnvVar}=true to enforce all three.`,
  }
}

const runRoot = localPath(
  'gpu-model-local-dev-runtime',
  'external-agent-execution-local-private-proof',
  `run-${Date.now()}-${process.pid}`,
)
const inputDir = path.join(runRoot, 'private-inputs')
const adapterDir = path.join(runRoot, 'adapter-proof')
const blockersDir = path.join(runRoot, 'blocked-model-tools')
const privateInputPreflightDir = path.join(runRoot, 'blocked-model-private-input-preflight')
const routeDir = path.join(runRoot, 'route-proof')
const sourceImage = path.join(inputDir, 'private-approved-frame.ppm')
const manifestPath = path.join(runRoot, 'runtime-inputs.json')
const privateInputPreflightManifestPath = path.join(
  privateInputPreflightDir,
  'runtime-inputs.json',
)
const harnessResultPath = path.join(adapterDir, 'harness-result.json')
const blockersResultPath = path.join(blockersDir, 'harness-result.json')
const privateInputPreflightResultPath = path.join(
  privateInputPreflightDir,
  'harness-result.json',
)
const placeholderModelPaths = {
  sam2: path.join(inputDir, 'models', 'sam2', 'sam2-hiera-tiny-local.pt'),
  birefnet: path.join(inputDir, 'models', 'birefnet'),
  real_esrgan: path.join(inputDir, 'models', 'real-esrgan', 'RealESRGAN_x4plus.pth'),
  rembg: path.join(inputDir, 'models', 'rembg', 'u2net.onnx'),
  transparent_background: path.join(
    inputDir,
    'models',
    'transparent-background',
    'ckpt_base.pth',
  ),
}

ensureProofImage()
const dockerModuleReadiness = dockerRuntimeModuleReadiness()
for (const toolId of blockedModelTools) {
  const missingModules = dockerModuleReadiness?.[toolId]
  if (!Array.isArray(missingModules)) {
    fail(`docker_module_readiness_missing_tool:${toolId}`)
  } else if (missingModules.length > 0) {
    fail(`docker_module_readiness_missing_modules:${toolId}:${missingModules.join(',')}`)
  }
}
writePrivatePpm(sourceImage)
for (const filePath of [
  placeholderModelPaths.sam2,
  path.join(placeholderModelPaths.birefnet, 'model.safetensors'),
  placeholderModelPaths.real_esrgan,
  placeholderModelPaths.rembg,
  placeholderModelPaths.transparent_background,
]) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(
    filePath,
    'local-private-placeholder-for-path-preflight-only\n',
    'utf8',
  )
}
writeRuntimeInputManifest(manifestPath, {
  outputDirectory: relativeLocalPath(adapterDir),
  runtimeContainerImage: proofImage,
  runtimeContainerPlatform: platform,
  toolInputs: {
    torch_torchvision: {
      allowCpuFoundationRuntime: true,
    },
    transformers: {
      allowCpuFoundationRuntime: true,
    },
    kornia: {
      allowCpuTensorRuntime: true,
      sourceImageLocalPath: relativeLocalPath(sourceImage),
    },
  },
})
writeRuntimeInputManifest(privateInputPreflightManifestPath, {
  outputDirectory: relativeLocalPath(privateInputPreflightDir),
  sourceImageLocalPath: relativeLocalPath(sourceImage),
  runtimeContainerImage: proofImage,
  runtimeContainerPlatform: platform,
  privateInputPreflightOnly: true,
  toolInputs: {
    sam2: {
      sam2CheckpointLocalPath: relativeLocalPath(placeholderModelPaths.sam2),
    },
    birefnet: {
      birefnetModelLocalPath: relativeLocalPath(placeholderModelPaths.birefnet),
    },
    real_esrgan: {
      allowCpuModelRuntime: true,
      realEsrganModelLocalPath: relativeLocalPath(placeholderModelPaths.real_esrgan),
    },
    rembg: {
      allowCpuModelRuntime: true,
      rembgModelLocalPath: relativeLocalPath(placeholderModelPaths.rembg),
    },
    transparent_background: {
      allowCpuModelRuntime: true,
      transparentBackgroundCheckpointLocalPath: relativeLocalPath(
        placeholderModelPaths.transparent_background,
      ),
    },
  },
})

const harness = runNpmJson(
  'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness',
  [
    '--attempt-local-runtime',
    '--runtime-backend',
    'docker_container',
    '--tools',
    proofTools.join(','),
    '--runtime-input-manifest',
    relativeLocalPath(manifestPath),
    '--result-out',
    relativeLocalPath(harnessResultPath),
  ],
)

if (!fs.existsSync(harnessResultPath)) fail('combined_harness_result_missing')
if (harness.counts?.localRuntimeExecutionPerformedTools !== proofTools.length) {
  fail(`combined_harness_executed_count_mismatch:${harness.counts?.localRuntimeExecutionPerformedTools}`)
}
assertFalse(harness.booleans?.gpuRuntimeShouldStartNow, 'combined_harness_gpuRuntimeShouldStartNow')
assertFalse(harness.booleans?.publicArtifactCreated, 'combined_harness_publicArtifactCreated')
assertFalse(harness.booleans?.signedUrlCreated, 'combined_harness_signedUrlCreated')
assertFalse(harness.booleans?.runtimeReadyNow, 'combined_harness_runtimeReadyNow')
assertFalse(harness.booleans?.externalBetaReadyNow, 'combined_harness_externalBetaReadyNow')
assertFalse(harness.booleans?.productionReadyNow, 'combined_harness_productionReadyNow')

for (const toolId of proofTools) {
  const row = rowByTool(harness.gpuModelLocalDevRuntimeExecutionHarnessRows ?? [], toolId)
  if (!row) {
    fail(`combined_harness_missing_row:${toolId}`)
    continue
  }
  if (row.executionState !== 'executable') fail(`combined_harness_state_mismatch:${toolId}:${row.executionState}`)
  assertTrue(row.localRuntimeExecutionPerformed, `combined_harness_localRuntimeExecutionPerformed:${toolId}`)
  assertTrue(row.toolExecutionApprovedNow, `combined_harness_toolExecutionApprovedNow:${toolId}`)
  assertFalse(row.gpuRuntimeShouldStartNow, `combined_harness_gpuRuntimeShouldStartNow:${toolId}`)
  assertFalse(row.publicArtifactCreated, `combined_harness_publicArtifactCreated:${toolId}`)
  assertFalse(row.signedUrlCreated, `combined_harness_signedUrlCreated:${toolId}`)
  if (!row.outputJsonPath || !fs.existsSync(row.outputJsonPath)) {
    fail(`combined_harness_output_missing:${toolId}`)
  } else if (outputSha(row.outputJsonPath) !== row.outputJsonSha256) {
    fail(`combined_harness_output_sha_mismatch:${toolId}`)
  }
}

const bridge = runNpmJson('ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge', [
  '--local-runtime-proof-result',
  harnessResultPath,
])
if (bridge.counts?.acceptedPrivateLocalRuntimeProofTools !== proofTools.length) {
  fail(`bridge_accepted_private_proof_count_mismatch:${bridge.counts?.acceptedPrivateLocalRuntimeProofTools}`)
}
for (const toolId of proofTools) {
  const row = rowByTool(bridge.gpuModelRuntimeProofRefBridgeRows ?? [], toolId)
  if (!row?.routeSubmissionReadyWithAcceptedPrivateProof) {
    fail(`bridge_route_submission_not_ready:${toolId}`)
  }
}
assertFalse(bridge.booleans?.gpuRuntimeShouldStartNow, 'bridge_gpuRuntimeShouldStartNow')
assertFalse(bridge.booleans?.publicArtifactCreated, 'bridge_publicArtifactCreated')
assertFalse(bridge.booleans?.signedUrlCreated, 'bridge_signedUrlCreated')

const privateCpuModelProof = optionalPrivateCpuModelRuntimeProof({ runRoot })
const acceptedPrivateCpuModelTools = privateCpuModelProof.acceptedTools ?? []
const acceptedPrivateCpuModelToolSet = new Set(acceptedPrivateCpuModelTools)
const readinessArgs = [
  '--local-runtime-proof-result',
  harnessResultPath,
]
for (const resultPath of privateCpuModelProof.acceptedHarnessResultPaths ?? []) {
  readinessArgs.push('--local-runtime-proof-result', resultPath)
}

const readiness = runNpmJson('ai-graphics:external-agent-execution-readiness', readinessArgs)
const expectedAgentExecutableTools = 16 + acceptedPrivateCpuModelTools.length
const expectedGpuToolsWithValidRuntimeProof =
  proofTools.length + acceptedPrivateCpuModelTools.length
const expectedGpuModelBlockedWithReasonTools =
  blockedModelTools.length - acceptedPrivateCpuModelTools.length
if (readiness.counts?.agentExecutableTools !== expectedAgentExecutableTools) {
  fail(`readiness_agentExecutableTools_mismatch:${readiness.counts?.agentExecutableTools}`)
}
if (
  readiness.counts?.gpuToolsWithValidRuntimeProof !==
    expectedGpuToolsWithValidRuntimeProof
) {
  fail(`readiness_gpuToolsWithValidRuntimeProof_mismatch:${readiness.counts?.gpuToolsWithValidRuntimeProof}`)
}
if (
  readiness.counts?.gpuModelBlockedWithReasonTools !==
    expectedGpuModelBlockedWithReasonTools
) {
  fail(`readiness_gpuModelBlockedWithReasonTools_mismatch:${readiness.counts?.gpuModelBlockedWithReasonTools}`)
}
assertTrue(readiness.booleans?.agentCanExecuteGpuModelToolsNow, 'readiness_agentCanExecuteGpuModelToolsNow')
if (expectedAgentExecutableTools === 21) {
  assertTrue(readiness.booleans?.agentCanExecuteAll21ToolsNow, 'readiness_agentCanExecuteAll21ToolsNow')
} else {
  assertFalse(readiness.booleans?.agentCanExecuteAll21ToolsNow, 'readiness_agentCanExecuteAll21ToolsNow')
}
assertFalse(readiness.booleans?.gpuRuntimeShouldStartNow, 'readiness_gpuRuntimeShouldStartNow')
assertFalse(readiness.booleans?.publicArtifactCreated, 'readiness_publicArtifactCreated')
assertFalse(readiness.booleans?.signedUrlCreated, 'readiness_signedUrlCreated')
assertFalse(readiness.booleans?.runtimeReadyNow, 'readiness_runtimeReadyNow')
assertFalse(readiness.booleans?.externalBetaReadyNow, 'readiness_externalBetaReadyNow')
assertFalse(readiness.booleans?.productionReadyNow, 'readiness_productionReadyNow')

const routeSummaries = []
for (const toolId of proofTools) {
  const args = [
    '--scoped-gpu-tool',
    toolId,
    '--scoped-gpu-runtime-container-image',
    proofImage,
    '--scoped-gpu-runtime-container-platform',
    platform,
    '--scoped-gpu-output-dir',
    relativeLocalPath(path.join(routeDir, toolId)),
  ]
  if (toolId === 'kornia') {
    args.push(
      '--scoped-gpu-allow-cpu-tensor-runtime',
      '--scoped-gpu-source-image',
      relativeLocalPath(sourceImage),
    )
  } else {
    args.push('--scoped-gpu-allow-cpu-foundation-runtime')
  }

  const route = runNpmJson('ai-graphics:external-agent-all21-controlled-route-execution-smoke', args)
  const scoped = route.scopedGpuModelLocalDevRouteAttempt
  const result = scoped?.result
  if (result?.externalAgentExecutionState !== 'executable') {
    fail(`route_scoped_state_mismatch:${toolId}:${result?.externalAgentExecutionState}`)
  }
  assertTrue(result?.controlledAdapterExecutedNow, `route_controlledAdapterExecutedNow:${toolId}`)
  assertTrue(result?.localGpuModelRuntimeExecutionPerformed, `route_localGpuModelRuntimeExecutionPerformed:${toolId}`)
  assertFalse(result?.gpuRuntimeShouldStartNow, `route_gpuRuntimeShouldStartNow:${toolId}`)
  assertFalse(result?.publicArtifactCreated, `route_publicArtifactCreated:${toolId}`)
  assertFalse(result?.signedUrlCreated, `route_signedUrlCreated:${toolId}`)
  assertFalse(result?.runtimeReadyNow, `route_runtimeReadyNow:${toolId}`)
  assertFalse(result?.externalBetaReadyNow, `route_externalBetaReadyNow:${toolId}`)
  assertFalse(result?.productionReadyNow, `route_productionReadyNow:${toolId}`)
  routeSummaries.push({
    toolId,
    routeStatus: result?.routeStatus,
    executionState: result?.externalAgentExecutionState,
    outputSha256: result?.outputSha256,
  })
}

for (const record of privateCpuModelProof.records ?? []) {
  if (record.status !== 'executable') continue
  routeSummaries.push({
    toolId: record.toolId,
    routeStatus: 'external_agent_single_tool_call_accepted_private_cpu_model_proof',
    executionState: record.finalExternalAgentExecutionState,
    outputSha256: null,
  })
}

const blockers = runNpmJson(
  'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness',
  [
    '--attempt-local-runtime',
    '--runtime-backend',
    'docker_container',
    '--runtime-container-image',
    proofImage,
    '--runtime-container-platform',
    platform,
    '--tools',
    blockedModelTools.join(','),
    '--output-dir',
    relativeLocalPath(blockersDir),
    '--result-out',
    relativeLocalPath(blockersResultPath),
    '--source-image',
    relativeLocalPath(sourceImage),
  ],
)
if (blockers.counts?.localRuntimeExecutionPerformedTools !== 0) {
  fail(`blocked_tools_unexpected_execution:${blockers.counts?.localRuntimeExecutionPerformedTools}`)
}
assertFalse(blockers.booleans?.gpuRuntimeShouldStartNow, 'blocked_tools_gpuRuntimeShouldStartNow')
assertFalse(blockers.booleans?.publicArtifactCreated, 'blocked_tools_publicArtifactCreated')
assertFalse(blockers.booleans?.signedUrlCreated, 'blocked_tools_signedUrlCreated')
for (const toolId of blockedModelTools) {
  const row = rowByTool(blockers.gpuModelLocalDevRuntimeExecutionHarnessRows ?? [], toolId)
  if (!row) {
    fail(`blocked_tools_missing_row:${toolId}`)
    continue
  }
  if (row.executionState !== 'blocked_with_reason') {
    fail(`blocked_tools_state_mismatch:${toolId}:${row.executionState}`)
  }
  if (row.currentBlockingPrerequisiteKey !== expectedBlockedKeys[toolId]) {
    fail(`blocked_tools_blocker_mismatch:${toolId}:${row.currentBlockingPrerequisiteKey}`)
  }
  assertFalse(row.localRuntimeExecutionPerformed, `blocked_tools_localRuntimeExecutionPerformed:${toolId}`)
  assertFalse(row.gpuRuntimeShouldStartNow, `blocked_tools_gpuRuntimeShouldStartNow:${toolId}`)
}

const privateInputPreflight = runNpmJson(
  'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness',
  [
    '--attempt-local-runtime',
    '--runtime-backend',
    'docker_container',
    '--tools',
    blockedModelTools.join(','),
    '--runtime-input-manifest',
    relativeLocalPath(privateInputPreflightManifestPath),
    '--result-out',
    relativeLocalPath(privateInputPreflightResultPath),
  ],
)
if (!fs.existsSync(privateInputPreflightResultPath)) {
  fail('private_input_preflight_result_missing')
}
if (privateInputPreflight.counts?.localRuntimeExecutionPerformedTools !== 0) {
  fail(
    `private_input_preflight_unexpected_execution:${privateInputPreflight.counts?.localRuntimeExecutionPerformedTools}`,
  )
}
if (
  privateInputPreflight.counts
    ?.privateLocalRuntimeInputsAcceptedBeforeRuntimeTools !== blockedModelTools.length
) {
  fail(
    `private_input_preflight_accepted_count_mismatch:${privateInputPreflight.counts?.privateLocalRuntimeInputsAcceptedBeforeRuntimeTools}`,
  )
}
assertFalse(
  privateInputPreflight.booleans?.gpuRuntimeShouldStartNow,
  'private_input_preflight_gpuRuntimeShouldStartNow',
)
assertFalse(
  privateInputPreflight.booleans?.publicArtifactCreated,
  'private_input_preflight_publicArtifactCreated',
)
assertFalse(
  privateInputPreflight.booleans?.signedUrlCreated,
  'private_input_preflight_signedUrlCreated',
)
assertFalse(
  privateInputPreflight.booleans?.runtimeReadyNow,
  'private_input_preflight_runtimeReadyNow',
)
assertFalse(
  privateInputPreflight.booleans?.externalBetaReadyNow,
  'private_input_preflight_externalBetaReadyNow',
)
assertFalse(
  privateInputPreflight.booleans?.productionReadyNow,
  'private_input_preflight_productionReadyNow',
)
for (const toolId of blockedModelTools) {
  const row = rowByTool(
    privateInputPreflight.gpuModelLocalDevRuntimeExecutionHarnessRows ?? [],
    toolId,
  )
  if (!row) {
    fail(`private_input_preflight_missing_row:${toolId}`)
    continue
  }
  if (row.executionState !== 'blocked_with_reason') {
    fail(`private_input_preflight_state_mismatch:${toolId}:${row.executionState}`)
  }
  if (row.currentBlockingReasonCode !== privateInputPreflightAcceptedCode) {
    fail(
      `private_input_preflight_blocker_mismatch:${toolId}:${row.currentBlockingReasonCode}`,
    )
  }
  const expectedRuntimeKey = cpuModelRuntimeTools.includes(toolId)
    ? 'pythonCpuModelRuntime'
    : 'nativeCudaRuntime'
  if (row.currentBlockingPrerequisiteKey !== expectedRuntimeKey) {
    fail(
      `private_input_preflight_blocking_key_mismatch:${toolId}:${row.currentBlockingPrerequisiteKey}`,
    )
  }
  assertTrue(
    row.privateLocalRuntimeInputsAcceptedBeforeRuntime,
    `private_input_preflight_inputsAccepted:${toolId}`,
  )
  assertFalse(
    row.localRuntimeExecutionPerformed,
    `private_input_preflight_localRuntimeExecutionPerformed:${toolId}`,
  )
  assertFalse(
    row.toolExecutionApprovedNow,
    `private_input_preflight_toolExecutionApprovedNow:${toolId}`,
  )
  assertFalse(
    row.gpuRuntimeShouldStartNow,
    `private_input_preflight_gpuRuntimeShouldStartNow:${toolId}`,
  )
}

try {
  execFileSync('git', ['diff', '--exit-code', '--', 'package-lock.json'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
} catch {
  fail('package_lock_changed')
}

try {
  const trackedLocalArtifacts = execFileSync('git', ['ls-files', '.local-artifacts'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  }).trim()
  if (trackedLocalArtifacts) fail('local_artifacts_tracked')
} catch (error) {
  fail(`local_artifacts_tracked_check_failed:${error.message}`)
}

const summary = {
  ok: failures.length === 0,
  decision:
    acceptedPrivateCpuModelTools.length === cpuModelRuntimeTools.length
      ? 'ai_graphics_external_agent_execution_local_private_proof_passed_for_19_with_2_native_cuda_blocks'
      : acceptedPrivateCpuModelTools.length > 0
      ? 'ai_graphics_external_agent_execution_local_private_proof_passed_for_private_subset_with_remaining_model_blocks'
      : 'ai_graphics_external_agent_execution_local_private_proof_passed_for_16_with_5_model_weight_blocks',
  runRoot: path.relative(root, runRoot),
  proofImage,
  agentCallableTools: readiness.counts?.agentCallableTools,
  agentExecutableToolsWithPrivateProof: readiness.counts?.agentExecutableTools,
  gpuToolsWithValidRuntimeProof: readiness.counts?.gpuToolsWithValidRuntimeProof,
  executableGpuModelTools: [
    ...proofTools,
    ...acceptedPrivateCpuModelTools,
  ],
  blockedGpuModelTools: blockedModelTools.filter(
    (toolId) => !acceptedPrivateCpuModelToolSet.has(toolId),
  ),
  optionalPrivateCpuModelRuntimeProof: privateCpuModelProof,
  dockerRuntimePythonModulesPresentForBlockedTools: Object.fromEntries(
    blockedModelTools.map((toolId) => [
      toolId,
      Array.isArray(dockerModuleReadiness?.[toolId]) &&
        dockerModuleReadiness[toolId].length === 0,
    ]),
  ),
  privateInputPreflightAcceptedBeforeRuntimeTools:
    privateInputPreflight.counts?.privateLocalRuntimeInputsAcceptedBeforeRuntimeTools,
  blockedGpuModelToolsNextRuntimePrerequisite:
    acceptedPrivateCpuModelTools.length === cpuModelRuntimeTools.length
      ? 'nativeCudaRuntime for sam2/birefnet'
      : 'nativeCudaRuntime for sam2/birefnet; pythonCpuModelRuntime for real_esrgan/rembg/transparent_background',
  routeProofs: routeSummaries,
  gpuRuntimeShouldStartNow: readiness.booleans?.gpuRuntimeShouldStartNow,
  runtimeReadyNow: readiness.booleans?.runtimeReadyNow,
  externalBetaReadyNow: readiness.booleans?.externalBetaReadyNow,
  productionReadyNow: readiness.booleans?.productionReadyNow,
  packageLockUnchanged: failures.includes('package_lock_changed') === false,
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ...summary, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify(summary, null, 2))
