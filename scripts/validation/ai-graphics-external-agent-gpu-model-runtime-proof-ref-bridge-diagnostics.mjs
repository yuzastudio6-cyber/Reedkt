import childProcess from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_gpu_model_runtime_proof_ref_bridge_prepared_with_runtime_blocks'
const status =
  'gpu_model_runtime_proof_ref_bridge_blocked_until_private_local_runtime_proof_is_supplied'
const acceptedStatus =
  'gpu_model_runtime_proof_ref_bridge_accepts_private_local_runtime_proof_for_scoped_route_submission'
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

function execFileJson(command, args) {
  return JSON.parse(childProcess.execFileSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
  }))
}

function createScopedKorniaPrivateProofFixture() {
  const fixtureRoot = path.join(
    root,
    '.local-artifacts',
    'ai-graphics',
    'gpu-model-local-dev-runtime',
  )
  fs.mkdirSync(fixtureRoot, { recursive: true })
  const tempDir = fs.mkdtempSync(
    path.join(fixtureRoot, 'diagnostic-kornia-private-proof-'),
  )
  const outputJsonPath = path.join(tempDir, 'kornia-runtime-result.json')
  const maskPath = path.join(tempDir, 'private-kornia-mask.pgm')
  fs.writeFileSync(maskPath, 'P2\n1 1\n255\n255\n')
  fs.writeFileSync(outputJsonPath, `${JSON.stringify({
    ok: true,
    toolId: 'kornia',
    cudaAvailable: false,
    deviceType: 'cpu',
    cpuTensorRuntimeAllowed: true,
    runtime: {
      modelDownloadedExternally: false,
      providerRuntimePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    mask: {
      path: maskPath,
    },
    metrics: {
      gaussianKernel: 1,
    },
  }, null, 2)}\n`)
  const outputJsonSha256 = createHash('sha256')
    .update(fs.readFileSync(outputJsonPath))
    .digest('hex')

  const source = json(
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
  )
  const proof = {
    ...source,
    status:
      'local_dev_runtime_executed_for_private_opt_in_subset_not_global_ready',
    counts: {
      ...(source.counts ?? {}),
      requestedGpuModelTools: 1,
      gpuModelToolsCovered: 1,
      localDevAdapterBranchInvokedTools: 1,
      localDevPrerequisiteCheckOnlyTools: 0,
      localRuntimeExecutionPerformedTools: 1,
      toolExecutionApprovedNowTools: 1,
      gpuRuntimeApprovedForScopedControlledToolCallTools: 1,
      gpuRuntimeShouldStartNowTools: 1,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      runtimeReadyNowTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    gpuModelLocalDevRuntimeExecutionHarnessRows: [{
      toolId: 'kornia',
      capabilityId: 'tensor_image_ops',
      adapterDecision:
        'ai_graphics_external_agent_gpu_model_controlled_adapter_executable_eight_on_demand_with_runtime_blocks',
      adapterStatus: 'controlled_gpu_model_adapter_executed_private_output_ready',
      executionState: 'executable',
      controlledAdapterExecutableNow: true,
      controlledAdapterInvokedNow: true,
      harnessMode: 'local_dev_runtime_attempt_requested',
      localRuntimeExecutionPerformed: true,
      toolExecutionApprovedNow: true,
      gpuRuntimeApprovedForScopedControlledToolCall: false,
      gpuRuntimeShouldStartNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      skipReasonCode: null,
      errorMessage: null,
      outputJsonPath,
      outputJsonSha256,
      allowCpuTensorRuntime: true,
      allowCpuFoundationRuntime: false,
      localInputRequirements: [
        {
          key: 'outputDirectory',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Private local worker output directory; must not be public artifact storage.',
        },
        {
          key: 'sourceImageLocalPath',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Private local representative image/frame selected from an approved plan.',
        },
        {
          key: 'pythonCpuTensorRuntime',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Approved local Python CPU tensor runtime with torch, PIL, numpy, and kornia; no model weight required.',
        },
      ],
      warnings: [
        'Diagnostic-only private proof fixture; no GPU/runtime was started by this diagnostic.',
      ],
    }],
  }
  const proofPath = path.join(tempDir, 'harness-result.json')
  fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`)
  return proofPath
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
  'privateOutputJsonSha256Matches',
  'localRuntimeExecutionPerformed',
  'routeSubmissionReadyWithAcceptedPrivateProof',
  'modelWeightsDownloaded',
  'private_output_json_sha256_missing',
  'private_output_json_sha256_mismatch',
  'private_output_json_outside_local_artifacts_gpu_model_runtime_namespace',
  'requiresPrivateOutputJsonSha256Match',
  'requiresPrivateOutputJsonUnderLocalArtifactsGpuModelRuntime',
  'sha256File',
  'createHash',
  'path.relative(process.cwd(), file)',
  'return isLocalGpuModelProofOutputPath(relative)',
]) {
  if (!cli.includes(phrase)) fail(`cli_missing_phrase:${phrase}`)
}

if (
  report.proofRefBridgePolicy?.requiresPrivateOutputJsonUnderLocalArtifactsGpuModelRuntime !==
    true
) {
  fail('proof_ref_bridge_policy_missing_local_artifacts_namespace_requirement')
}
if (report.proofRefBridgePolicy?.requiresPrivateOutputJsonSha256Match !== true) {
  fail('proof_ref_bridge_policy_missing_output_sha256_match_requirement')
}

if (
  !String(report.interfaces?.upstreamPrivateProofCommand ?? '').includes(
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  )
) {
  fail('upstream_private_proof_command_missing_result_out')
}

for (const forbidden of forbiddenPatterns) {
  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.md',
  ]) {
    if (forbidden.test(read(file))) fail(`forbidden_claim:${file}:${forbidden}`)
  }
}

const scopedKorniaProofPath = createScopedKorniaPrivateProofFixture()
const scopedBridge = execFileJson('npm', [
  'run',
  '--silent',
  runScriptName,
  '--',
  '--local-runtime-proof-result',
  scopedKorniaProofPath,
])
if (scopedBridge.status !== acceptedStatus) {
  fail(`synthetic_scoped_bridge_status_mismatch:${scopedBridge.status}`)
}
if (scopedBridge.counts?.privateLocalRuntimeProofResultSuppliedTools !== 1) {
  fail('synthetic_scoped_bridge_supplied_count_not_one')
}
if (scopedBridge.counts?.acceptedPrivateLocalRuntimeProofTools !== 1) {
  fail('synthetic_scoped_bridge_accepted_count_not_one')
}
if (scopedBridge.counts?.routeSubmissionReadyWithAcceptedPrivateProofTools !== 1) {
  fail('synthetic_scoped_bridge_route_ready_count_not_one')
}
if (scopedBridge.counts?.blockedMissingPrivateLocalRuntimeProofResultTools !== 7) {
  fail('synthetic_scoped_bridge_remaining_blocked_count_not_seven')
}
if (scopedBridge.counts?.blockedPrivateLocalRuntimeOutputMissingTools !== 0) {
  fail('synthetic_scoped_bridge_output_missing_count_not_zero')
}
const scopedBridgeRows = Array.isArray(scopedBridge.gpuModelRuntimeProofRefBridgeRows)
  ? scopedBridge.gpuModelRuntimeProofRefBridgeRows
  : []
const scopedKorniaRow = scopedBridgeRows.find((row) => row.toolId === 'kornia')
if (!scopedKorniaRow) {
  fail('synthetic_scoped_bridge_missing_kornia_row')
} else {
  if (scopedKorniaRow.localRuntimeProofAccepted !== true) {
    fail('synthetic_scoped_bridge_kornia_not_accepted')
  }
  if (scopedKorniaRow.routeSubmissionReadyWithAcceptedPrivateProof !== true) {
    fail('synthetic_scoped_bridge_kornia_route_not_ready')
  }
  if (
    scopedKorniaRow.proofRefBridgeStatus !==
    'accepted_private_local_runtime_proof_ready_for_proof_ref_route_submission'
  ) {
    fail(`synthetic_scoped_bridge_kornia_status:${scopedKorniaRow.proofRefBridgeStatus}`)
  }
  if (
    scopedKorniaRow.localProofEvidenceObserved
      ?.privateOutputJsonAccepted !== true
  ) {
    fail('synthetic_scoped_bridge_kornia_output_json_not_accepted')
  }
  if (
    scopedKorniaRow.localProofEvidenceObserved
      ?.privateOutputJsonRejectionReason !== null
  ) {
    fail(`synthetic_scoped_bridge_kornia_output_rejection:${scopedKorniaRow.localProofEvidenceObserved?.privateOutputJsonRejectionReason}`)
  }
  if (scopedKorniaRow.gpuRuntimeShouldStartNow !== false) {
    fail('synthetic_scoped_bridge_kornia_started_gpu')
  }
}
for (const row of scopedBridgeRows.filter((item) => item.toolId !== 'kornia')) {
  if (row.proofRefBridgeStatus !== 'blocked_missing_private_local_runtime_proof_result') {
    fail(`scoped_bridge_unexpected_non_kornia_status:${row.toolId}:${row.proofRefBridgeStatus}`)
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
