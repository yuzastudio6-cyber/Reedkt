import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-queue-dispatcher-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-internal-beta-queue-dispatcher-readiness.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-queue-dispatcher-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-queue-dispatcher-readiness-diagnostics.mjs'

const allTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

const capabilities = [
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
]

const gpuTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const expectedGpuRuntimeTargets = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
}

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'productionWorkerJobEnqueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'productionWorkerRouteExecutionApprovedNow',
  'workerLeaseCreationApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'workerLeaseCreated',
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const inputFalseKeys = [
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'liveWorkerLeaseCreated',
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${filePath}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(filePath) {
  try {
    return JSON.parse(read(filePath))
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  }).trim()
}

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function writeAcceptedEvidencePackets() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-queue-dispatcher-'))
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  fs.writeFileSync(
    manifestPacketPath,
    `${JSON.stringify(acceptedModelWeightManifestReviewPacket(), null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    gpuPacketPath,
    `${JSON.stringify(acceptedGpuRuntimeProofResultPacket(), null, 2)}\n`,
    'utf8',
  )
  return { manifestPacketPath, gpuPacketPath }
}

function acceptedArgs(manifestPacketPath, gpuPacketPath) {
  return [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    '--owner-approval-granted',
    '--owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_PACKET',
    '--internal-beta-go-no-go-owner-approval-granted',
    '--internal-beta-go-no-go-owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_PACKET',
    '--internal-beta-runtime-enqueue-approval-granted',
    '--internal-beta-runtime-enqueue-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_PACKET',
    '--all-queue-admission-prerequisites-provided',
  ]
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-queue-dispatcher-readiness.ts',
  'server/cli/ai-graphics-internal-beta-queue-dispatcher-readiness.ts',
  'scripts/validation/ai-graphics-internal-beta-queue-dispatcher-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-queue-dispatcher-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-queue-dispatcher-readiness.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-queue-adapter-readiness.json',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-gates.ts',
  'server/workers/production/production-worker-lease-manager.ts',
  'server/workers/production/production-worker-router.ts',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-queue-dispatcher-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-queue-dispatcher-readiness.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-queue-dispatcher-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-queue-dispatcher-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-internal-beta-queue-dispatcher-readiness'")) {
  fail('server_registry_index_does_not_export_internal_beta_queue_dispatcher_readiness')
}

if (docs.decision !== 'ai_graphics_internal_beta_queue_dispatcher_readiness_contract_prepared_with_mock_safe_dispatcher') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.status !== 'mock_safe_dispatcher_probe_completed_runtime_still_blocked') {
  fail(`unexpected_docs_status:${docs.status}`)
}
if (docs.sourceDecisions?.queueAdapter !== 'ai_graphics_internal_beta_queue_adapter_readiness_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_queue_adapter_source_decision:${docs.sourceDecisions?.queueAdapter}`)
}

for (const status of [
  'missing_queue_adapter_evidence',
  'mock_safe_dispatcher_probe_completed_runtime_still_blocked',
]) {
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const token of [
  'dispatchProductionWorkerJob',
  'createProductionWorkerRuntimeState',
  'dispatcherProbeCompletedWithProvidedEvidence',
  'allInMemoryLeaseRecordsReleased',
  '--require-dispatcher-probe-ready',
  '--require-live-worker-dispatch',
]) {
  if (!moduleSource.includes(token) && !cliSource.includes(token) && !JSON.stringify(docs).includes(token)) {
    fail(`source_missing:${token}`)
  }
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  dispatcherProbeJobsPrepared: 21,
  dispatcherProbeJobsCompletedWithProvidedEvidence: 21,
  dispatcherCapabilityScenariosPrepared: 12,
  dispatcherCapabilityScenariosCompletedWithProvidedEvidence: 12,
  dispatcherHardGateBlockCount: 0,
  inMemoryDispatcherLeaseRecordsCreated: 21,
  inMemoryDispatcherLeaseRecordsReleased: 21,
  inMemoryDispatcherEventsRecorded: 189,
  gpuRuntimeTargetedTools: 8,
  heavyToolsIncorrectlyTargetingCpu: 0,
  liveBackendQueueSubmissionsNow: 0,
  liveWorkerLeasesCreatedNow: 0,
  liveProductionWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  internalBetaReadyNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`docs_count_mismatch:${key}:${docs.counts?.[key]}`)
}

for (const [key, expected] of Object.entries({
  gpuToolsUseNativeL4: true,
  gpuRuntimeTargetsExact: true,
  gpuRuntimeOnDemandOnly: true,
  dispatcherProbePreservesExactGpuRuntimeTargets: true,
  idleGpuRuntimeApprovedNow: false,
  gpuStartsOnlyAfterApprovedWorkerJob: true,
})) {
  if (docs.runtimeTargets?.[key] !== expected) {
    fail(`docs_runtime_target_policy_mismatch:${key}:${docs.runtimeTargets?.[key]}`)
  }
}
for (const [tool, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  if (docs.runtimeTargets?.expectedGpuRuntimeTargets?.[tool] !== runtimeTarget) {
    fail(`docs_expected_gpu_runtime_target_mismatch:${tool}:${docs.runtimeTargets?.expectedGpuRuntimeTargets?.[tool]}`)
  }
  if (!markdown.includes(runtimeTarget)) fail(`markdown_missing_gpu_runtime_target:${tool}`)
  if (!moduleSource.includes(runtimeTarget)) fail(`module_missing_gpu_runtime_target:${tool}`)
}
if (!markdown.includes('GPU runtime remains on-demand only')) {
  fail('markdown_missing_gpu_on_demand_policy')
}

for (const action of [
  'run all 21 adapter payloads through the in-memory production worker dispatcher probe',
  'evaluate production worker gates, idempotency, lease lifecycle, event emission, and placeholder routing',
  'verify GPU-heavy tools remain assigned to gpu_ai_worker dispatcher probes',
  'verify dispatcher routes remain mockOnly and do not execute tools, providers, browser runtimes, or GPU model runtimes',
]) {
  if (!docs.allowedMockSafeDispatcherProbeActions?.includes(action)) fail(`docs_missing_allowed_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_allowed_action:${action}`)
}

for (const action of [
  'backend queue submission',
  'live worker queue enqueue',
  'live worker lease creation',
  'live production worker dispatch',
  'production worker route execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'signed URL creation',
  'public artifact creation',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(action)) fail(`docs_missing_blocked_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_blocked_action:${action}`)
  if (!markdown.includes(action)) fail(`markdown_missing_blocked_action:${action}`)
}

for (const [key, expected] of Object.entries({
  internalBetaQueueDispatcherReadinessPrepared: true,
  sourceQueueAdapterAccepted: true,
  all21ToolsCovered: true,
  all12CapabilitiesCovered: true,
  all21DispatcherProbeJobsPrepared: true,
  all21DispatcherProbeJobsCompletedWithProvidedEvidence: true,
  all12CapabilityScenariosCompletedWithProvidedEvidence: true,
  allDispatcherGateHardBlocksClear: true,
  allDispatcherRoutesMockOnly: true,
  allInMemoryLeaseRecordsReleased: true,
  gpuHeavyToolsTargetGpuRuntime: true,
  gpuRuntimeTargetsExact: true,
  gpuRuntimeOnDemandOnly: true,
  privateArtifactManifestOnly: true,
  agentCanSelectForPlanning: true,
})) {
  if (docs.booleans?.[key] !== expected) fail(`docs_boolean_mismatch:${key}:${docs.booleans?.[key]}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_gate_not_false:${key}`)
}

if (!scorecard.includes('ai_graphics_internal_beta_queue_dispatcher_readiness_contract_prepared_with_mock_safe_dispatcher')) {
  fail('scorecard_missing_internal_beta_queue_dispatcher_readiness')
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_queue_dispatcher')
if (defaultOutput.status !== 'missing_queue_adapter_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.dispatcherProbeJobsCompletedWithProvidedEvidence !== 0) {
  fail('default_dispatcher_probe_jobs_not_0')
}
if (defaultOutput.inMemoryDispatcherLeaseRecordsCreated !== 0) {
  fail('default_in_memory_leases_not_0')
}

const { manifestPacketPath, gpuPacketPath } = writeAcceptedEvidencePackets()
const approvedOutput = parseJsonOutput(
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
    '--require-dispatcher-probe-ready',
  ]),
  'approved_queue_dispatcher',
)
if (approvedOutput.status !== 'mock_safe_dispatcher_probe_completed_runtime_still_blocked') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.dispatcherProbeJobsCompletedWithProvidedEvidence !== 21) {
  fail('approved_dispatcher_probe_jobs_not_21')
}
if (approvedOutput.dispatcherCapabilityScenariosCompletedWithProvidedEvidence !== 12) {
  fail('approved_dispatcher_capabilities_not_12')
}
if (approvedOutput.dispatcherHardGateBlockCount !== 0) fail('approved_hard_gate_blocks_not_0')
if (approvedOutput.inMemoryDispatcherLeaseRecordsCreated !== 21) fail('approved_in_memory_leases_created_not_21')
if (approvedOutput.inMemoryDispatcherLeaseRecordsReleased !== 21) fail('approved_in_memory_leases_released_not_21')
if (approvedOutput.inMemoryDispatcherEventsRecorded !== 189) fail('approved_dispatcher_events_not_189')
if (approvedOutput.dispatcherProbeResults?.length !== 21) fail('approved_dispatcher_results_length_not_21')
if (approvedOutput.dispatcherCapabilityScenarios?.length !== 12) fail('approved_dispatcher_capabilities_length_not_12')
if (approvedOutput.dispatcherProbeResults?.filter((result) => result.workerType === 'gpu_ai_worker').length !== 8) {
  fail('approved_gpu_dispatcher_results_not_8')
}
for (const tool of gpuTools) {
  const result = approvedOutput.dispatcherProbeResults?.find((item) => item.toolId === tool)
  if (!result) fail(`approved_missing_gpu_tool_result:${tool}`)
  if (result?.workerType !== 'gpu_ai_worker') fail(`approved_gpu_tool_not_gpu_worker:${tool}`)
}
if (approvedOutput.booleans?.gpuRuntimeTargetsExact !== true) fail('approved_gpu_runtime_targets_not_exact')
if (approvedOutput.booleans?.gpuRuntimeOnDemandOnly !== true) fail('approved_gpu_runtime_not_on_demand')
for (const [tool, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  const result = approvedOutput.dispatcherProbeResults?.find((item) => item.toolId === tool)
  if (!result) fail(`approved_missing_gpu_tool_result:${tool}`)
  if (result?.workerType !== 'gpu_ai_worker') fail(`approved_gpu_tool_not_gpu_worker:${tool}`)
  if (result?.runtimeTarget !== runtimeTarget) {
    fail(`approved_gpu_runtime_target_mismatch:${tool}:${result?.runtimeTarget}`)
  }
}
for (const result of approvedOutput.dispatcherProbeResults ?? []) {
  if (result.productionWorkerJobStatus !== 'completed') fail(`probe_not_completed:${result.toolId}`)
  if (result.dispatcherProbeCompletedWithProvidedEvidence !== true) fail(`probe_not_ready:${result.toolId}`)
  if (result.mockOnlyRoute !== true) fail(`probe_not_mock_only:${result.toolId}`)
  if (result.hardGateBlockCount !== 0) fail(`probe_hard_gate_blocks:${result.toolId}`)
  if (result.inMemoryLeaseRecordCreated !== true) fail(`probe_lease_not_created:${result.toolId}`)
  if (result.inMemoryLeaseReleased !== true) fail(`probe_lease_not_released:${result.toolId}`)
  if (result.canSubmitToBackendQueueNow !== false) fail(`probe_can_submit_not_false:${result.toolId}`)
  if (result.canCreateLiveWorkerLeaseNow !== false) fail(`probe_can_live_lease_not_false:${result.toolId}`)
  if (result.canDispatchLiveProductionWorkerNow !== false) fail(`probe_can_live_dispatch_not_false:${result.toolId}`)
  if (result.canExecuteToolNow !== false) fail(`probe_can_execute_not_false:${result.toolId}`)
}
for (const key of falseGateKeys) {
  if (approvedOutput.booleans?.[key] !== false) fail(`approved_false_gate_not_false:${key}`)
}
for (const key of inputFalseKeys) {
  if (approvedOutput.input?.[key] !== false) fail(`approved_input_false_gate_not_false:${key}`)
}

let liveDispatchExited = false
try {
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
    '--require-live-worker-dispatch',
  ])
} catch {
  liveDispatchExited = true
}
if (!liveDispatchExited) fail('require_live_worker_dispatch_did_not_fail_closed')

const forbiddenPatterns = [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /workerQueueApprovedNow["`:= ]+true/i,
  /backendQueueSubmissionApprovedNow["`:= ]+true/i,
  /productionWorkerJobEnqueueApprovedNow["`:= ]+true/i,
  /productionWorkerDispatchApprovedNow["`:= ]+true/i,
  /productionWorkerRouteExecutionApprovedNow["`:= ]+true/i,
  /workerLeaseCreationApprovedNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeApprovedNow["`:= ]+true/i,
  /runtimeReadyNow["`:= ]+true/i,
  /internalBetaReadyNow["`:= ]+true/i,
  /externalBetaReadyNow["`:= ]+true/i,
  /productionReadyNow["`:= ]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
for (const [label, content] of Object.entries({
  moduleSource,
  cliSource,
  markdown,
  docs: JSON.stringify(docs),
})) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) fail(`forbidden_runtime_claim:${label}:${pattern}`)
  }
}

try {
  const basePkg = JSON.parse(git(['show', `${baseRef}:package.json`]))
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(basePkg[key] ?? {}) !== JSON.stringify(pkg[key] ?? {})) {
      fail(`package_dependency_section_changed:${key}`)
    }
  }
} catch (error) {
  fail(`package_dependency_compare_failed:${error.message}`)
}

try {
  const lockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
  if (lockDiff.trim()) fail('package_lock_changed')
} catch (error) {
  fail(`package_lock_diff_failed:${error.message}`)
}

try {
  const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
  if (trackedLocalArtifacts.trim()) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
} catch (error) {
  fail(`local_artifacts_scan_failed:${error.message}`)
}

const generatedPathPattern = /(^|\/)(render|renders|media|canvas|webgl|public|signed-url|signed-urls|gcs)(\/|$)/i
try {
  const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
  for (const file of changedFiles) {
    if (generatedPathPattern.test(file)) fail(`generated_output_path_changed:${file}`)
  }
} catch (error) {
  fail(`generated_output_scan_failed:${error.message}`)
}

if (failures.length > 0) {
  console.error([
    'AI graphics internal beta queue-dispatcher readiness diagnostics failed:',
    ...failures.map((failure) => `- ${failure}`),
  ].join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  status: docs.status,
  tools: docs.tools.length,
  capabilities: docs.capabilities.length,
  dispatcherProbeJobsPrepared: docs.counts.dispatcherProbeJobsPrepared,
  dispatcherProbeJobsCompletedWithProvidedEvidence:
    docs.counts.dispatcherProbeJobsCompletedWithProvidedEvidence,
  dispatcherHardGateBlockCount: docs.counts.dispatcherHardGateBlockCount,
  inMemoryDispatcherLeaseRecordsCreated: docs.counts.inMemoryDispatcherLeaseRecordsCreated,
  inMemoryDispatcherLeaseRecordsReleased: docs.counts.inMemoryDispatcherLeaseRecordsReleased,
  gpuRuntimeTargetedTools: docs.counts.gpuRuntimeTargetedTools,
  backendQueueSubmissionApprovedNow: docs.booleans.backendQueueSubmissionApprovedNow,
  productionWorkerDispatchApprovedNow: docs.booleans.productionWorkerDispatchApprovedNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
