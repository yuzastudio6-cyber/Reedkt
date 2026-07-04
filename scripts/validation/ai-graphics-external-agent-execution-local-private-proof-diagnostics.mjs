import { execFileSync } from 'node:child_process'
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
const expectedBlockedKeys = {
  sam2: 'sam2CheckpointLocalPath',
  birefnet: 'birefnetModelLocalPath',
  real_esrgan: 'realEsrganModelLocalPath',
  rembg: 'rembgModelLocalPath',
  transparent_background: 'transparentBackgroundCheckpointLocalPath',
}

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

const runRoot = localPath(
  'gpu-model-local-dev-runtime',
  'external-agent-execution-local-private-proof',
  `run-${Date.now()}-${process.pid}`,
)
const inputDir = path.join(runRoot, 'private-inputs')
const adapterDir = path.join(runRoot, 'adapter-proof')
const blockersDir = path.join(runRoot, 'blocked-model-tools')
const routeDir = path.join(runRoot, 'route-proof')
const sourceImage = path.join(inputDir, 'private-approved-frame.ppm')
const manifestPath = path.join(runRoot, 'runtime-inputs.json')
const harnessResultPath = path.join(adapterDir, 'harness-result.json')
const blockersResultPath = path.join(blockersDir, 'harness-result.json')

ensureProofImage()
writePrivatePpm(sourceImage)
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

const readiness = runNpmJson('ai-graphics:external-agent-execution-readiness', [
  '--local-runtime-proof-result',
  harnessResultPath,
])
if (readiness.counts?.agentExecutableTools !== 16) {
  fail(`readiness_agentExecutableTools_mismatch:${readiness.counts?.agentExecutableTools}`)
}
if (readiness.counts?.gpuToolsWithValidRuntimeProof !== proofTools.length) {
  fail(`readiness_gpuToolsWithValidRuntimeProof_mismatch:${readiness.counts?.gpuToolsWithValidRuntimeProof}`)
}
if (readiness.counts?.gpuModelBlockedWithReasonTools !== blockedModelTools.length) {
  fail(`readiness_gpuModelBlockedWithReasonTools_mismatch:${readiness.counts?.gpuModelBlockedWithReasonTools}`)
}
assertTrue(readiness.booleans?.agentCanExecuteGpuModelToolsNow, 'readiness_agentCanExecuteGpuModelToolsNow')
assertFalse(readiness.booleans?.agentCanExecuteAll21ToolsNow, 'readiness_agentCanExecuteAll21ToolsNow')
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
    'ai_graphics_external_agent_execution_local_private_proof_passed_for_16_with_5_model_weight_blocks',
  runRoot: path.relative(root, runRoot),
  proofImage,
  agentCallableTools: readiness.counts?.agentCallableTools,
  agentExecutableToolsWithPrivateProof: readiness.counts?.agentExecutableTools,
  gpuToolsWithValidRuntimeProof: readiness.counts?.gpuToolsWithValidRuntimeProof,
  executableGpuModelTools: proofTools,
  blockedGpuModelTools: blockedModelTools,
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
