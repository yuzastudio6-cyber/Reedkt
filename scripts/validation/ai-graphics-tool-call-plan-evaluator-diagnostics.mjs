import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:tool-call-plan-evaluator:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-tool-call-plan-evaluator-diagnostics.mjs'

const productCapabilities = [
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
  'server/tool-registry/ai-graphics-tool-call-plan-evaluator.ts',
  'server/tool-registry/ai-graphics-tool-call-handoff.ts',
  'docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.md',
  'docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json',
  'docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json',
  'docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const evaluator = json('docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json')
const handoff = json('docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json')
const readiness = json('docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const source = read('server/tool-registry/ai-graphics-tool-call-plan-evaluator.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.md')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (evaluator.decision !== 'ai_graphics_tool_call_plan_evaluator_prepared_with_execution_blocks') {
  fail(`unexpected_decision:${evaluator.decision}`)
}
if (evaluator.sourceDecision !== 'ai_graphics_tool_call_handoff_contract_prepared_with_execution_blocks') {
  fail(`unexpected_source_decision:${evaluator.sourceDecision}`)
}
if (handoff.decision !== evaluator.sourceDecision) fail('handoff_source_decision_not_accepted')
if (readiness.toolCounts?.productionToolIdMapped !== 21) fail('readiness_mapping_count_not_21')
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('proper_install_count_not_21')

if (!index.includes("export * from './ai-graphics-tool-call-plan-evaluator'")) {
  fail('server_registry_index_does_not_export_plan_evaluator')
}
for (const needle of [
  'AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION',
  'evaluateAiGraphicsToolCallPlan',
  'listAiGraphicsToolCallPlanEvaluations',
  'execution_request_blocked',
  'invalid_capability_blocked',
  'approved plan snapshot is missing',
  'credit reservation is missing',
  'artifact boundary approval is missing',
]) {
  if (!source.includes(needle)) fail(`evaluator_source_missing:${needle}`)
}

if (evaluator.counts?.totalTools !== 21) fail('evaluator_total_tools_not_21')
if (evaluator.counts?.productFacingCapabilities !== 12) fail('evaluator_capability_count_not_12')
if (evaluator.counts?.gpuRuntimeTargetedTools !== 8) fail('evaluator_gpu_tool_count_not_8')
if (evaluator.counts?.agentExecutableNow !== 0) fail('evaluator_agent_executable_not_zero')
if (evaluator.counts?.runtimeReadyNow !== 0) fail('evaluator_runtime_ready_not_zero')

for (const capability of productCapabilities) {
  if (!evaluator.productFacingCapabilities?.includes(capability)) fail(`evaluator_missing_capability:${capability}`)
  if (!handoff.capabilityHandoffs?.[capability]?.length) fail(`handoff_missing_capability:${capability}`)
  if (!source.includes('buildAiGraphicsToolCallHandoffCapability')) fail('evaluator_not_linked_to_handoff_capabilities')
}

for (const tool of allTools) {
  if (!handoff.allTools?.includes(tool)) fail(`handoff_missing_tool:${tool}`)
  if (!readiness.allTools?.includes(tool)) fail(`readiness_missing_tool:${tool}`)
  if (!JSON.stringify(audit.toolRows || []).includes(`"toolId":"${tool}"`)) fail(`audit_missing_tool:${tool}`)
}

for (const tool of gpuTools) {
  if (!handoff.gpuRuntimeTargetedTools?.includes(tool)) fail(`handoff_gpu_tool_missing:${tool}`)
  const row = (audit.toolRows || []).find((entry) => entry.toolId === tool)
  if (!row?.runtimeTarget?.includes('nvidia_l4')) fail(`gpu_tool_not_targeting_l4:${tool}:${row?.runtimeTarget}`)
}

for (const gate of [
  'approved plan snapshot is required before execution',
  'credit reservation is required before execution',
  'artifact boundary approval is required before execution',
  'Tool Route execution approval is required',
  'Worker execution approval is required',
  'runtime-specific proof must be complete before execution',
]) {
  if (!evaluator.requiredExecutionGates?.includes(gate)) fail(`required_gate_missing:${gate}`)
}

for (const key of [
  'toolCallPlanEvaluatorPrepared',
  'sourceToolCallHandoffAccepted',
  'all21ToolsCovered',
  'all12ProductFacingCapabilitiesCovered',
  'rankingSystemLinked',
  'productionToolIdsReturned',
  'workerTypesReturned',
  'runtimeTargetsReturned',
  'blockersReturned',
  'nextMilestonesReturned',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]) {
  if (evaluator.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
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
  if (evaluator.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

const combinedText = [markdown, JSON.stringify(evaluator), source].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
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
  console.error('AI graphics tool-call plan evaluator diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: evaluator.decision,
  toolsCovered: evaluator.counts.totalTools,
  productFacingCapabilities: evaluator.counts.productFacingCapabilities,
  gpuRuntimeTargetedTools: evaluator.counts.gpuRuntimeTargetedTools,
  agentCanSelectForPlanning: evaluator.booleans.agentCanSelectForPlanning,
  agentCanExecuteToolsNow: evaluator.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: evaluator.booleans.runtimeReadyNow,
}, null, 2))
