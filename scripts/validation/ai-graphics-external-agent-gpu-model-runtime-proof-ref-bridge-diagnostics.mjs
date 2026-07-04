import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_gpu_model_runtime_proof_ref_bridge_prepared_with_runtime_blocks'
const status =
  'gpu_model_runtime_proof_ref_bridge_blocked_until_private_local_runtime_proof_is_supplied'
const runScriptName =
  'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge-diagnostics.mjs'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge.ts',
  'scripts/validation/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.md',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json',
  'server/cli/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness.ts',
  'server/cli/ai-graphics-external-agent-gpu-model-proof-ref-route-caller.ts',
  'package.json',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  gpuModelToolsCovered: 8,
  sourceLocalDevHarnessToolsCovered: 8,
  sourceProofRefRouteCallerToolsCovered: 8,
  privateLocalRuntimeProofResultSuppliedTools: 0,
  acceptedPrivateLocalRuntimeProofTools: 0,
  routeSubmissionReadyWithAcceptedPrivateProofTools: 0,
  blockedMissingPrivateLocalRuntimeProofResultTools: 8,
  blockedPrivateLocalRuntimeProofNotExecutedTools: 0,
  blockedPrivateLocalRuntimeOutputMissingTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  liveQueueWritePerformedTools: 0,
  workerDispatchPerformedTools: 0,
  toolExecutionPerformedByBridgeTools: 0,
  modelWeightsLoadedByBridgeTools: 0,
  publicArtifactCreatedByBridgeTools: 0,
  signedUrlCreatedByBridgeTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueBooleans = [
  'externalAgentGpuModelRuntimeProofRefBridgePrepared',
  'sourceLocalDevRuntimeExecutionHarnessAccepted',
  'sourceProofRefRouteCallerAccepted',
  'all8GpuModelToolsCoveredByBridge',
  'privateLocalRuntimeProofRequiredBeforeProofRefsAccepted',
  'exactPerToolPrivateProofEvidenceShapeEnforced',
  'committedRecordAcceptsZeroGpuModelRuntimeProofs',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForScopedAcceptedToolCall',
  'agentCanSelectForPlanning',
]

const falseBooleans = [
  'routeSubmissionAllowedOnlyWithAcceptedPrivateProof',
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteAll21ToolsNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'routeExecutionPerformedInThisLane',
  'backendQueueSubmissionApprovedNow',
  'backendQueueSubmissionPerformed',
  'liveQueueWriteApprovedNow',
  'liveQueueWritePerformed',
  'workerExecutionApprovedNow',
  'workerExecutionPerformed',
  'workerDispatchApprovedNow',
  'workerDispatchPerformed',
  'toolExecutionApprovedNow',
  'toolExecutionPerformed',
  'providerRuntimeApprovedNow',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimeApprovedNow',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimeApprovedNow',
  'gpuRuntimePerformed',
  'gpuRuntimeShouldStartNow',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
]

const forbiddenPatterns = [
  /"agentCanExecuteGpuModelToolsNow"\s*:\s*true/i,
  /"agentCanExecuteAll21ToolsNow"\s*:\s*true/i,
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"routeExecutionApprovedNow"\s*:\s*true/i,
  /"backendQueueSubmissionPerformed"\s*:\s*true/i,
  /"liveQueueWritePerformed"\s*:\s*true/i,
  /"workerExecutionPerformed"\s*:\s*true/i,
  /"workerDispatchPerformed"\s*:\s*true/i,
  /"toolExecutionPerformed"\s*:\s*true/i,
  /"providerRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimeShouldStartNow"\s*:\s*true/i,
  /"modelWeightsDownloaded"\s*:\s*true/i,
  /"modelWeightsLoaded"\s*:\s*true/i,
  /"modelInferencePerformed"\s*:\s*true/i,
  /"publicArtifactCreated"\s*:\s*true/i,
  /"signedUrlCreated"\s*:\s*true/i,
  /"runtimeReadyNow"\s*:\s*true/i,
  /"externalBetaReadyNow"\s*:\s*true/i,
  /"productionReadyNow"\s*:\s*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated-media|render-output|renders|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp|avif|pdf)$/i

const failures = []

function fail(message) {
  failures.push(message)
}

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  if (!fs.existsSync(absolute(file))) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(absolute(file), 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function exec(command) {
  return childProcess.execSync(command, {
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
  })
}

function checkPackageJson() {
  const pkg = json('package.json')
  if (pkg.scripts?.[runScriptName] !== runScriptCommand) {
    fail('run_script_command_mismatch')
  }
  if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
    fail('diagnostic_script_command_mismatch')
  }

  try {
    const headPkg = JSON.parse(exec('git show HEAD:package.json'))
    for (const section of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      if (JSON.stringify(pkg[section] ?? {}) !== JSON.stringify(headPkg[section] ?? {})) {
        fail(`package_dependency_section_changed:${section}`)
      }
    }
  } catch (error) {
    fail(`package_dependency_comparison_failed:${error.message}`)
  }
}

function checkPackageLockUnchanged() {
  try {
    exec('git diff --quiet -- package-lock.json')
  } catch {
    fail('package_lock_changed')
  }
}

function checkChangedFiles() {
  let changed = ''
  try {
    changed = exec('git diff --name-only HEAD')
  } catch (error) {
    fail(`git_diff_name_only_failed:${error.message}`)
    return
  }

  for (const file of changed.split(/\r?\n/).filter(Boolean)) {
    if (file === 'package-lock.json') fail('package_lock_changed_in_diff')
    if (file.includes('.local-artifacts')) fail(`local_artifact_changed:${file}`)
    if (generatedArtifactPattern.test(file)) fail(`generated_artifact_changed:${file}`)
  }
}

for (const file of requiredFiles) read(file)
checkPackageJson()
checkPackageLockUnchanged()
checkChangedFiles()

const report = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
)
const markdown = read(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.md',
)
const cli = read(
  'server/cli/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge.ts',
)
const sourceHarness = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
)
const sourceProofRefCaller = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json',
)

if (report.decision !== decision) fail('decision_mismatch')
if (report.status !== status) fail('status_mismatch')
if (
  sourceHarness.decision !==
  'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks'
) {
  fail('source_harness_decision_mismatch')
}
if (
  sourceProofRefCaller.decision !==
  'ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks'
) {
  fail('source_proof_ref_route_caller_decision_mismatch')
}

for (const row of sourceHarness.gpuModelLocalDevRuntimeExecutionHarnessRows ?? []) {
  if (!gpuModelTools.includes(row.toolId)) continue
  if (row.executionState !== 'blocked_with_reason') {
    fail(`source_harness_execution_state_mismatch:${row.toolId}:${row.executionState}`)
  }
}

for (const [key, expected] of Object.entries(expectedCounts)) {
  if (report.counts?.[key] !== expected) {
    fail(`count_mismatch:${key}:expected_${expected}:got_${report.counts?.[key]}`)
  }
}

for (const key of trueBooleans) {
  if (report.booleans?.[key] !== true) fail(`boolean_not_true:${key}`)
}
for (const key of falseBooleans) {
  if (report.booleans?.[key] !== false) fail(`boolean_not_false:${key}`)
}

if (
  !Array.isArray(report.gpuModelRuntimeProofRefBridgeRows) ||
  report.gpuModelRuntimeProofRefBridgeRows.length !== 8
) {
  fail('bridge_rows_count_mismatch')
} else {
  const rowsByTool = new Map(
    report.gpuModelRuntimeProofRefBridgeRows.map((row) => [row.toolId, row]),
  )
  for (const toolId of gpuModelTools) {
    const row = rowsByTool.get(toolId)
    if (!row) {
      fail(`missing_bridge_row:${toolId}`)
      continue
    }
    if (row.localRuntimeProofResultProvided !== false) {
      fail(`committed_local_proof_unexpectedly_supplied:${toolId}`)
    }
    if (row.localRuntimeProofAccepted !== false) {
      fail(`committed_local_proof_unexpectedly_accepted:${toolId}`)
    }
    if (
      row.proofRefBridgeStatus !==
      'blocked_missing_private_local_runtime_proof_result'
    ) {
      fail(`bridge_status_mismatch:${toolId}:${row.proofRefBridgeStatus}`)
    }
    if (row.routeSubmissionReadyWithAcceptedPrivateProof !== false) {
      fail(`route_submission_unexpectedly_ready:${toolId}`)
    }
    if (row.gpuRuntimeShouldStartNow !== false) {
      fail(`gpu_start_unexpectedly_ready:${toolId}`)
    }
    if (modelWeightManifestRequiredTools.includes(toolId)) {
      if (row.modelWeightManifestRequired !== true) {
        fail(`model_manifest_required_missing:${toolId}`)
      }
      if (!String(row.modelWeightManifestRef ?? '').startsWith('private://')) {
        fail(`model_manifest_private_ref_missing:${toolId}`)
      }
    } else if (row.modelWeightManifestRequired !== false) {
      fail(`unexpected_model_manifest_required:${toolId}`)
    }
    for (const key of [
      'nativeGpuRuntimeProofRef',
      'externalBetaPerToolRuntimeProofRef',
    ]) {
      if (!String(row[key] ?? '').startsWith('private://')) {
        fail(`private_ref_missing:${toolId}:${key}`)
      }
    }
    for (const key of [
      'liveQueueWritePerformed',
      'workerDispatchPerformed',
      'toolExecutionPerformedByBridge',
      'modelWeightsLoadedByBridge',
      'publicArtifactCreatedByBridge',
      'signedUrlCreatedByBridge',
    ]) {
      if (row[key] !== false) fail(`row_forbidden_not_false:${toolId}:${key}`)
    }
  }
}

for (const toolId of gpuModelTools) {
  if (!markdown.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}

for (const phrase of [
  'accepts zero GPU/model proofs',
  'does not start GPU runtime',
  'write live queues',
  'dispatch workers',
  'create public artifacts',
  'create signed URLs',
  '--local-runtime-proof-result',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_phrase:${phrase}`)
}

for (const phrase of [
  '--local-runtime-proof-result',
  '--write-records cannot be combined',
  'privateOutputJsonPathExists',
  'localRuntimeExecutionPerformed',
  'routeSubmissionReadyWithAcceptedPrivateProof',
]) {
  if (!cli.includes(phrase)) fail(`cli_missing_phrase:${phrase}`)
}

for (const forbidden of forbiddenPatterns) {
  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.md',
  ]) {
    if (forbidden.test(read(file))) fail(`forbidden_claim:${file}:${forbidden}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  gpuModelToolsCovered: 8,
  acceptedPrivateLocalRuntimeProofTools: 0,
  routeSubmissionReadyWithAcceptedPrivateProofTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  packageLockUnchanged: true,
}, null, 2))
