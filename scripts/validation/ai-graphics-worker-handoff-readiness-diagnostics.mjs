import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:worker-handoff-readiness:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-worker-handoff-readiness-diagnostics.mjs'

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

const allCapabilities = [
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

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const errors = []

function fail(message) {
  errors.push(message)
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
  }).trim()
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-worker-handoff-readiness.ts',
  'docs/tool-intelligence/ai-graphics/worker-handoff-readiness-contract.md',
  'docs/tool-intelligence/ai-graphics/worker-handoff-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/tool-route-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const worker = json('docs/tool-intelligence/ai-graphics/worker-handoff-readiness-contract.json')
const route = json('docs/tool-intelligence/ai-graphics/tool-route-readiness-contract.json')
const betaGate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const handoff = json('docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const source = read('server/tool-registry/ai-graphics-worker-handoff-readiness.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/worker-handoff-readiness-contract.md')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-worker-handoff-readiness'")) {
  fail('server_registry_index_does_not_export_worker_handoff_readiness')
}

if (worker.decision !== 'ai_graphics_worker_handoff_readiness_contract_prepared_with_execution_blocks') {
  fail(`unexpected_decision:${worker.decision}`)
}
if (worker.sourceToolRouteReadinessDecision !== 'ai_graphics_tool_route_readiness_contract_prepared_with_execution_blocks') {
  fail(`unexpected_route_source:${worker.sourceToolRouteReadinessDecision}`)
}
if (worker.sourceBetaGateDecision !== 'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks') {
  fail(`unexpected_beta_source:${worker.sourceBetaGateDecision}`)
}
if (route.decision !== worker.sourceToolRouteReadinessDecision) fail('route_source_not_accepted')
if (betaGate.decision !== worker.sourceBetaGateDecision) fail('beta_gate_source_not_accepted')
if (handoff.counts?.totalTools !== 21) fail('handoff_count_not_21')
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('install_audit_count_not_21')

for (const needle of [
  'AI_GRAPHICS_WORKER_HANDOFF_READINESS_DECISION',
  'buildAiGraphicsWorkerHandoffReadinessContract',
  'workerHandoffCanPreparePacketsNow: true',
  'workerCanExecuteToolsNow: false',
  'requiresApprovedSnapshot: true',
  'requiresCreditReservation: true',
  'requiresPrivateArtifactManifest: true',
  'privateArtifactManifestOnly',
  'private artifact manifest reference must use a private-only scheme',
  'approvedPlanSnapshotRefAccepted',
  'approved plan snapshot id must be a UUID or explicit approved_snapshot_* fixture ref',
  'creditReservationRefAccepted',
  'credit reservation id must be a UUID or explicit credit_reservation_* fixture ref',
  'requiresIdempotencyKey: true',
  'cpuFallbackAllowedForHeavyTool: false',
  'ai_graphics_gpu_model_worker_job',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}

if (worker.counts?.totalTools !== 21) fail('worker_total_tools_not_21')
if (worker.counts?.productFacingCapabilities !== 12) fail('worker_capabilities_not_12')
if (worker.counts?.workerHandoffPacketsPrepared !== 21) fail('worker_packets_not_21')
if (worker.counts?.workerQueueReadyTools !== 0) fail('worker_queue_ready_not_zero')
if (worker.counts?.workerExecutableTools !== 0) fail('worker_executable_not_zero')
if (worker.counts?.gpuRuntimeTargetedTools !== 8) fail('gpu_tool_count_not_8')
if (worker.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) fail('heavy_cpu_count_not_zero')

for (const tool of allTools) {
  if (!worker.allTools?.includes(tool)) fail(`worker_missing_tool:${tool}`)
  if (!handoff.allTools?.includes(tool)) fail(`handoff_missing_tool:${tool}`)
}
for (const capability of allCapabilities) {
  if (!worker.allCapabilities?.includes(capability)) fail(`worker_missing_capability:${capability}`)
  if (!route.allCapabilities?.includes(capability)) fail(`route_missing_capability:${capability}`)
}
for (const tool of gpuTools) {
  if (!worker.gpuRuntimeTargetedTools?.includes(tool)) fail(`gpu_tool_missing:${tool}`)
}
for (const tool of modelWeightTools) {
  if (!worker.modelWeightManifestRequiredTools?.includes(tool)) fail(`model_weight_tool_missing:${tool}`)
}

for (const input of [
  'approved plan snapshot id',
  'credit reservation id',
  'artifact boundary approval',
  'private artifact manifest reference',
  'Tool Route approval reference',
  'Worker approval reference',
  'idempotency key',
  'worker queue or transport readiness',
  'runtime proof accepted by beta readiness gate',
  'internal beta owner approval',
]) {
  if (!worker.requiredWorkerInputsBeforeQueue?.includes(input)) fail(`missing_required_worker_input:${input}`)
}

for (const blocked of [
  'worker queue enqueue',
  'worker execution',
  'tool execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'internal beta unlock',
  'external beta unlock',
  'production unlock',
]) {
  if (!worker.blockedWorkerActions?.includes(blocked)) fail(`missing_blocked_worker_action:${blocked}`)
}

for (const key of [
  'workerHandoffReadinessContractPrepared',
  'sourceToolRouteReadinessAccepted',
  'sourceBetaReadinessGateAccepted',
  'all21ToolsCovered',
  'all12ProductFacingCapabilitiesCovered',
  'workerHandoffPacketsPreparedForAll21Tools',
  'approvedSnapshotRequired',
  'approvedPlanSnapshotRefFormatRequired',
  'creditReservationRequired',
  'creditReservationRefFormatRequired',
  'privateArtifactManifestRequired',
  'privateArtifactManifestPrivateSchemeRequired',
  'workerIdempotencyRequired',
  'workerQueueTransportRequired',
  'runtimeProofRequired',
  'modelWeightManifestRequiredWhereApplicable',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
  'routeCanReturnPlanningMetadataNow',
  'workerHandoffCanPreparePacketsNow',
]) {
  if (worker.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

if (!markdown.includes('`approved_snapshot_*`')) fail('markdown_missing_approved_snapshot_fixture_format')
if (!markdown.includes('`credit_reservation_*`')) fail('markdown_missing_credit_reservation_fixture_format')

for (const key of [
  'gpuHeavyToolsTargetCpuRuntime',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerCanQueueNow',
  'workerCanExecuteToolsNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'modelWeightsApprovedNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (worker.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

const combinedText = [markdown, JSON.stringify(worker), source].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
  /workerCanQueueNow["`:= ]+true/i,
  /workerCanExecuteToolsNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
  /providerRuntimeApprovedNow["`:= ]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeApprovedNow["`:= ]+true/i,
  /modelWeightsApprovedNow["`:= ]+true/i,
  /runtimeReadyNow["`:= ]+true/i,
  /internalBetaReadyNow["`:= ]+true/i,
  /externalBetaReadyNow["`:= ]+true/i,
  /productionReadyNow["`:= ]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim_detected:${pattern}`)
}

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch (error) {
  fail(`base_package_read_failed:${error.message}`)
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}
if (git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])) fail('package_lock_changed')

const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of [...changedFiles, ...stagedFiles, ...trackedFiles]) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_committed_or_changed:${file}`)
}
for (const file of [...changedFiles, ...stagedFiles]) {
  if (/(^|\/)(dist|build|coverage|public\/generated|public\/artifacts|public-artifacts|render-outputs|rendered-output|browser-output|canvas-output|webgl-output)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_path_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) fail(`generated_media_or_font_changed:${file}`)
}

if (errors.length) {
  console.error('AI graphics worker handoff readiness diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: worker.decision,
  toolsCovered: worker.counts.totalTools,
  productFacingCapabilities: worker.counts.productFacingCapabilities,
  workerHandoffPacketsPrepared: worker.counts.workerHandoffPacketsPrepared,
  workerQueueReadyTools: worker.counts.workerQueueReadyTools,
  workerExecutableTools: worker.counts.workerExecutableTools,
  gpuRuntimeTargetedTools: worker.counts.gpuRuntimeTargetedTools,
}, null, 2))
