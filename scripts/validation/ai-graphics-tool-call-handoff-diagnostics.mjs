import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:tool-call-handoff:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-tool-call-handoff-diagnostics.mjs'

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

const expectedMappings = {
  torch_torchvision: 'torch_torchvision',
  transformers: 'transformers',
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real_esrgan',
  kornia: 'kornia',
  rembg: 'rembg',
  transparent_background: 'transparent_background',
  d3: 'd3',
  echarts: 'echarts',
  vega_lite: 'vega_lite',
  vega: 'vega',
  satori: 'satori',
  svgdotjs_svg_js: 'svgdotjs_svg_js',
  viz_js: 'viz_js',
  lottie_web: 'lottie',
  animejs: 'animejs',
  three_js: 'three_js',
  pixi_js: 'pixijs',
  konva: 'konva',
  babylonjs: 'babylon_js',
}

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
  'server/tool-registry/ai-graphics-tool-call-handoff.ts',
  'docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.md',
  'docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json',
  'docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'docs/prompt-ai-graphics-tool-call-readiness-contract-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-tool-call-readiness-contract.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const handoff = json('docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json')
const readiness = json('docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const source = read('server/tool-registry/ai-graphics-tool-call-handoff.ts')
const index = read('server/tool-registry/index.ts')
const handoffMd = read('docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.md')
const resultRecord = read('docs/prompt-ai-graphics-tool-call-readiness-contract-results.md')
const implementationPrompt = read('docs/implementation-prompts/prompt-ai-graphics-tool-call-readiness-contract.md')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)

if (handoff.decision !== 'ai_graphics_tool_call_handoff_contract_prepared_with_execution_blocks') {
  fail(`unexpected_decision:${handoff.decision}`)
}
if (handoff.sourceDecision !== 'ai_graphics_tool_call_readiness_contract_prepared_with_warnings') {
  fail(`unexpected_source_decision:${handoff.sourceDecision}`)
}
if (readiness.decision !== handoff.sourceDecision) fail('source_readiness_decision_not_accepted')
if (audit.decision !== 'ai_graphics_21_tool_proper_install_audit_completed_with_runtime_blocks') {
  fail(`unexpected_install_audit_decision:${audit.decision}`)
}

if (!index.includes("export * from './ai-graphics-tool-call-handoff'")) {
  fail('server_registry_index_does_not_export_handoff')
}
for (const needle of [
  'AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION',
  'buildAiGraphicsToolCallHandoffContract',
  'selectAiGraphicsToolCallHandoffForCapability',
  'approvedPlanSnapshotRequired: true',
  'creditReservationRequired: true',
  'artifactBoundaryApprovalRequired: true',
]) {
  if (!source.includes(needle)) fail(`handoff_source_missing:${needle}`)
}
if (/allCapabilitiesCovered:\s*AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS\.length as 14/.test(source)) {
  fail('handoff_source_uses_metadata_capabilities_as_routeable_count')
}

if (handoff.counts?.totalTools !== 21) fail('handoff_total_tools_not_21')
if (handoff.counts?.productFacingCapabilities !== 12) fail('handoff_product_capability_count_not_12')
if (handoff.counts?.productionToolMappings !== 21) fail('handoff_production_mapping_count_not_21')
if (handoff.counts?.gpuRuntimeTargetedTools !== 8) fail('handoff_gpu_tool_count_not_8')
if (handoff.counts?.agentExecutableNow !== 0) fail('handoff_agent_executable_count_not_zero')
if (handoff.counts?.runtimeReadyNow !== 0) fail('handoff_runtime_ready_count_not_zero')

if (new Set(handoff.allTools || []).size !== 21) fail('handoff_tool_list_has_duplicates_or_wrong_count')
for (const tool of allTools) {
  if (!handoff.allTools?.includes(tool)) fail(`handoff_missing_tool:${tool}`)
  if (handoff.productionToolMappings?.[tool] !== expectedMappings[tool]) {
    fail(`handoff_mapping_mismatch:${tool}:${handoff.productionToolMappings?.[tool]}`)
  }
  if (readiness.productionToolMappings?.[tool] !== expectedMappings[tool]) {
    fail(`readiness_mapping_mismatch:${tool}:${readiness.productionToolMappings?.[tool]}`)
  }
  if (!handoffMd.includes(`\`${tool}\``) && !handoffMd.includes(tool)) {
    fail(`handoff_markdown_missing_tool:${tool}`)
  }
}

if (new Set(handoff.productFacingCapabilities || []).size !== 12) {
  fail('handoff_capability_list_has_duplicates_or_wrong_count')
}
for (const capability of productCapabilities) {
  if (!handoff.productFacingCapabilities?.includes(capability)) fail(`handoff_missing_capability:${capability}`)
  const selection = handoff.capabilityHandoffs?.[capability]
  if (!Array.isArray(selection) || selection.length === 0) fail(`handoff_missing_capability_selection:${capability}`)
}

for (const tool of gpuTools) {
  if (!handoff.gpuRuntimeTargetedTools?.includes(tool)) fail(`handoff_gpu_list_missing:${tool}`)
  if (!readiness.gpuRequiredForRuntime?.includes(tool)) fail(`readiness_gpu_list_missing:${tool}`)
  const auditRow = (audit.toolRows || []).find((row) => row.toolId === tool)
  if (!auditRow?.runtimeTarget?.includes('nvidia_l4')) fail(`audit_gpu_tool_not_targeting_l4:${tool}:${auditRow?.runtimeTarget}`)
}

for (const requirement of [
  'approved plan snapshot',
  'credit reservation',
  'productionToolId',
  'workerType',
  'runtimeTarget',
  'private artifact manifests',
  'native NVIDIA L4 runtime proof',
  'browser/canvas/WebGL tools require approved sandbox',
  'public artifact and signed URL creation remain blocked',
]) {
  const combinedRequirements = (handoff.handoffRequirements || []).join('\n')
  if (!combinedRequirements.includes(requirement)) fail(`handoff_requirement_missing:${requirement}`)
}

for (const gate of [
  'agent/tool execution',
  'Tool Route execution',
  'Worker execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime',
  'GPU/model runtime',
  'model weight loading',
  'signed URL creation',
  'public artifact creation',
  'internal beta',
  'external beta',
  'production',
]) {
  if (!handoff.blockedRuntimeGates?.includes(gate)) fail(`blocked_runtime_gate_missing:${gate}`)
}

const requiredTrue = [
  'toolCallHandoffContractPrepared',
  'sourceToolCallReadinessAccepted',
  'properInstallAuditAccepted',
  'all21ToolsCovered',
  'all12ProductFacingCapabilitiesCovered',
  'all21ToolsMappedToProductionRegistry',
  'all8GpuModelToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
  'approvedPlanSnapshotRequired',
  'creditReservationRequired',
  'artifactBoundaryApprovalRequired',
]
for (const key of requiredTrue) if (handoff.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)

const requiredFalse = [
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
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]
for (const key of requiredFalse) if (handoff.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)

const docsText = [
  handoffMd,
  JSON.stringify(handoff),
].join('\n')
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
  if (pattern.test(docsText)) fail(`forbidden_claim_detected:${pattern}`)
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
  console.error('AI graphics tool-call handoff diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: handoff.decision,
  toolsCovered: handoff.counts.totalTools,
  productFacingCapabilities: handoff.counts.productFacingCapabilities,
  productionToolMappings: handoff.counts.productionToolMappings,
  gpuRuntimeTargetedTools: handoff.counts.gpuRuntimeTargetedTools,
  agentCanSelectForPlanning: handoff.booleans.agentCanSelectForPlanning,
  agentCanExecuteToolsNow: handoff.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: handoff.booleans.runtimeReadyNow,
}, null, 2))
