import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:tool-route-readiness:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-tool-route-readiness-diagnostics.mjs'

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
  'server/tool-registry/ai-graphics-tool-route-readiness.ts',
  'docs/tool-intelligence/ai-graphics/tool-route-readiness-contract.md',
  'docs/tool-intelligence/ai-graphics/tool-route-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json',
  'docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const route = json('docs/tool-intelligence/ai-graphics/tool-route-readiness-contract.json')
const evaluator = json('docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json')
const handoff = json('docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json')
const betaGate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const source = read('server/tool-registry/ai-graphics-tool-route-readiness.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/tool-route-readiness-contract.md')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-tool-route-readiness'")) {
  fail('server_registry_index_does_not_export_tool_route_readiness')
}

if (route.decision !== 'ai_graphics_tool_route_readiness_contract_prepared_with_execution_blocks') {
  fail(`unexpected_decision:${route.decision}`)
}
if (route.sourcePlanEvaluatorDecision !== 'ai_graphics_tool_call_plan_evaluator_prepared_with_execution_blocks') {
  fail(`unexpected_plan_source:${route.sourcePlanEvaluatorDecision}`)
}
if (route.sourceBetaGateDecision !== 'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks') {
  fail(`unexpected_beta_source:${route.sourceBetaGateDecision}`)
}
if (evaluator.decision !== route.sourcePlanEvaluatorDecision) fail('plan_evaluator_source_not_accepted')
if (betaGate.decision !== route.sourceBetaGateDecision) fail('beta_gate_source_not_accepted')
if (handoff.counts?.totalTools !== 21) fail('handoff_count_not_21')
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('install_audit_count_not_21')

for (const needle of [
  'AI_GRAPHICS_TOOL_ROUTE_READINESS_DECISION',
  'buildAiGraphicsToolRouteReadinessContract',
  'evaluateAiGraphicsToolRouteReadiness',
  'evaluateAiGraphicsToolCallPlan',
  'buildAiGraphicsBetaReadinessGate',
  'routeCanReturnPlanningMetadataNow: true',
  'routeCanExecuteToolsNow: false',
  'execution_route_request_blocked',
  'planning_metadata_route_ready',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}

if (route.counts?.totalTools !== 21) fail('route_total_tools_not_21')
if (route.counts?.productFacingCapabilities !== 12) fail('route_capabilities_not_12')
if (route.counts?.planningMetadataRouteReadyCapabilities !== 12) fail('planning_route_ready_count_not_12')
if (route.counts?.executionReadyCapabilities !== 0) fail('execution_ready_count_not_zero')
if (route.counts?.failClosedExecutionRequests !== 12) fail('fail_closed_execution_count_not_12')
if (route.counts?.gpuRuntimeTargetedTools !== 8) fail('gpu_tool_count_not_8')
if (route.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) fail('heavy_cpu_count_not_zero')

for (const tool of allTools) {
  if (!route.allTools?.includes(tool)) fail(`route_missing_tool:${tool}`)
  if (!handoff.allTools?.includes(tool)) fail(`handoff_missing_tool:${tool}`)
}
for (const capability of allCapabilities) {
  if (!route.allCapabilities?.includes(capability)) fail(`route_missing_capability:${capability}`)
  if (!JSON.stringify(evaluator.capabilityExamples || evaluator.capabilities || evaluator).includes(capability)) {
    fail(`evaluator_missing_capability_text:${capability}`)
  }
}
for (const tool of gpuTools) {
  if (!route.gpuRuntimeTargetedTools?.includes(tool)) fail(`gpu_tool_missing:${tool}`)
}

for (const input of [
  'approved plan snapshot id',
  'credit reservation id',
  'artifact boundary approval',
  'Tool Route approval reference',
  'Worker approval reference',
  'private artifact manifest reference',
  'runtime proof accepted by beta readiness gate',
  'internal beta owner approval',
]) {
  if (!route.requiredRouteInputsBeforeExecution?.includes(input)) fail(`missing_required_route_input:${input}`)
}

for (const action of [
  'read canonical AI graphics capability metadata',
  'rank candidate tools with the approved scoring/ranking contract',
  'return planning-only selected tools, production tool ids, worker types, runtime targets, blockers, and next milestones',
  'explain missing proof and runtime blockers',
]) {
  if (!route.allowedPlanningActions?.includes(action)) fail(`missing_allowed_planning_action:${action}`)
}

for (const blocked of [
  'agent/tool execution',
  'Tool Route execution',
  'Worker execution',
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
  if (!route.blockedExecutionActions?.includes(blocked)) fail(`missing_blocked_action:${blocked}`)
}

for (const key of [
  'toolRouteReadinessContractPrepared',
  'sourceToolCallPlanEvaluatorAccepted',
  'sourceBetaReadinessGateAccepted',
  'all21ToolsCovered',
  'all12ProductFacingCapabilitiesCovered',
  'rankingSystemUsed',
  'betaGateBlockersLinked',
  'planningMetadataRouteReady',
  'executionRequestsFailClosed',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
  'routeCanReturnPlanningMetadataNow',
]) {
  if (route.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const key of [
  'gpuHeavyToolsTargetCpuRuntime',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
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
  if (route.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

const combinedText = [markdown, JSON.stringify(route), source].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
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
  console.error('AI graphics tool route readiness diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: route.decision,
  toolsCovered: route.counts.totalTools,
  productFacingCapabilities: route.counts.productFacingCapabilities,
  planningMetadataRouteReadyCapabilities: route.counts.planningMetadataRouteReadyCapabilities,
  executionReadyCapabilities: route.counts.executionReadyCapabilities,
  failClosedExecutionRequests: route.counts.failClosedExecutionRequests,
  gpuRuntimeTargetedTools: route.counts.gpuRuntimeTargetedTools,
}, null, 2))
