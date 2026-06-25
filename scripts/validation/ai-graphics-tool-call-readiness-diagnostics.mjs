import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-gpu-model-runtime-readiness-gate'
const expectedScript = 'ai-graphics:tool-call-readiness:diagnostics'
const expectedScriptCommand = 'node scripts/validation/ai-graphics-tool-call-readiness-diagnostics.mjs'

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

const jsPackageByTool = {
  d3: 'd3',
  echarts: 'echarts',
  vega_lite: 'vega-lite',
  vega: 'vega',
  satori: 'satori',
  svgdotjs_svg_js: '@svgdotjs/svg.js',
  viz_js: '@viz-js/viz',
  lottie_web: 'lottie-web',
  animejs: 'animejs',
  three_js: 'three',
  pixi_js: 'pixi.js',
  konva: 'konva',
  babylonjs: 'babylonjs',
}

const gpuRequirementChecks = {
  torch_torchvision: ['docker/prod/gpu-worker/requirements.gpu.txt', 'torch==2.5.1+cu124', 'torchvision==0.20.1+cu124'],
  transformers: ['docker/prod/gpu-worker/requirements.gpu.txt', 'transformers==4.57.6'],
  sam2: ['docker/prod/sam2-runtime/requirements.sam2.txt', 'git+https://github.com/facebookresearch/sam2.git@2b90b9f5ceec907a1c18123530e92e794ad901a4'],
  birefnet: ['docker/prod/birefnet-runtime/requirements.birefnet.txt', 'transformers==4.57.6'],
  real_esrgan: ['docker/prod/real-esrgan-runtime/requirements.real-esrgan.txt', 'realesrgan==0.3.0'],
  kornia: ['docker/prod/gpu-worker/requirements.gpu.txt', 'kornia==0.8.1'],
  rembg: ['docker/prod/gpu-worker/requirements.gpu.txt', 'rembg[gpu]==2.0.69'],
  transparent_background: ['docker/prod/gpu-worker/requirements.gpu.txt', 'transparent-background==1.3.4'],
}

const expectedMappings = {
  torch_torchvision: null,
  transformers: null,
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real_esrgan',
  kornia: 'kornia',
  rembg: 'rembg',
  transparent_background: 'transparent_background',
  d3: 'd3',
  echarts: 'echarts',
  vega_lite: 'vega_lite',
  vega: null,
  satori: null,
  svgdotjs_svg_js: null,
  viz_js: null,
  lottie_web: 'lottie',
  animejs: null,
  three_js: 'three_js',
  pixi_js: 'pixijs',
  konva: 'konva',
  babylonjs: 'babylon_js',
}

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

const requiredFiles = [
  'server/tool-registry/ai-graphics-tool-call-readiness.ts',
  'docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.md',
  'docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json',
  'docs/prompt-ai-graphics-tool-call-readiness-contract-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-tool-call-readiness-contract.md',
]

const errors = []

function fail(message) {
  errors.push(message)
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function parseJson(filePath) {
  return JSON.parse(read(filePath))
}

function exists(filePath) {
  return fs.existsSync(filePath)
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  }).trim()
}

for (const file of requiredFiles) {
  if (!exists(file)) fail(`missing_required_file:${file}`)
}

const pkg = parseJson('package.json')
if (pkg.scripts?.[expectedScript] !== expectedScriptCommand) {
  fail(`missing_or_wrong_package_script:${expectedScript}`)
}

const contract = parseJson('docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json')
const ts = read('server/tool-registry/ai-graphics-tool-call-readiness.ts')
const index = read('server/tool-registry/index.ts')
const productionTypes = read('server/tool-registry/production-tool-types.ts')
const productionProfiles = read('server/tool-registry/production-tool-profiles.ts')

if (contract.decision !== 'ai_graphics_tool_call_readiness_contract_prepared_with_warnings') {
  fail(`unexpected_decision:${contract.decision}`)
}

if (!index.includes("export * from './ai-graphics-tool-call-readiness'")) {
  fail('server_registry_index_does_not_export_contract')
}

if (!ts.includes('AI_GRAPHICS_TOOL_CALL_READINESS_DECISION')) {
  fail('contract_ts_missing_decision_constant')
}

for (const tool of allTools) {
  if (!contract.allTools.includes(tool)) fail(`contract_json_missing_tool:${tool}`)
  if (!new RegExp(`toolId:\\s*'${tool}'`).test(ts)) fail(`contract_ts_missing_tool_record:${tool}`)
}

if (new Set(contract.allTools).size !== allTools.length) fail('contract_json_tool_count_or_duplicates_invalid')
if (contract.toolCounts.total !== 21) fail('tool_count_total_not_21')
if (contract.toolCounts.nodeDeclaredLockedAndPresent !== 13) fail('node_tool_count_not_13')
if (contract.toolCounts.gpuModelInstallTargetsPrepared !== 8) fail('gpu_tool_count_not_8')
if (contract.toolCounts.agentExecutableNow !== 0) fail('agent_executable_count_not_zero')
if (contract.toolCounts.runtimeReadyNow !== 0) fail('runtime_ready_count_not_zero')

for (const [tool, mapped] of Object.entries(expectedMappings)) {
  if (contract.productionToolMappings[tool] !== mapped) {
    fail(`unexpected_production_mapping:${tool}:${contract.productionToolMappings[tool]}`)
  }

  if (mapped) {
    if (!productionTypes.includes(`| '${mapped}'`) && !productionTypes.includes(`'${mapped}',`)) {
      fail(`mapped_production_tool_missing_from_types:${tool}:${mapped}`)
    }
    if (!productionProfiles.includes(`toolId: '${mapped}'`)) {
      fail(`mapped_production_tool_missing_profile:${tool}:${mapped}`)
    }
  }
}

for (const tool of contract.planningWrapperWithoutProductionToolId) {
  if (contract.productionToolMappings[tool] !== null) fail(`planning_wrapper_has_production_mapping:${tool}`)
}

for (const tool of gpuTools) {
  if (!contract.gpuRequiredForRuntime.includes(tool)) fail(`gpu_required_list_missing:${tool}`)
  const target = contract.runtimeTargetByTool[tool]
  if (!target || !target.includes('nvidia_l4')) fail(`gpu_tool_not_targeting_nvidia_l4:${tool}:${target}`)
}

for (const [tool, packageName] of Object.entries(jsPackageByTool)) {
  const rootDependencies = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.optionalDependencies,
  }
  if (!rootDependencies[packageName]) fail(`package_json_missing_js_tool:${tool}:${packageName}`)

  const lock = parseJson('package-lock.json')
  const rootLockDependencies = lock.packages?.['']?.dependencies ?? {}
  if (!rootLockDependencies[packageName]) fail(`package_lock_root_missing_js_tool:${tool}:${packageName}`)

  const nodePackagePath = `node_modules/${packageName}`
  if (!lock.packages?.[nodePackagePath]) fail(`package_lock_node_missing_js_tool:${tool}:${packageName}`)
}

for (const [tool, [file, ...needles]] of Object.entries(gpuRequirementChecks)) {
  const text = read(file)
  for (const needle of needles) {
    if (!text.includes(needle)) fail(`gpu_requirement_missing:${tool}:${needle}`)
  }
}

for (const capability of capabilities) {
  const selection = contract.capabilitySelections[capability]
  if (!selection || selection.length === 0) fail(`missing_capability_selection:${capability}`)
  if (!new RegExp(`capabilityId:\\s*'${capability}'`).test(ts)) fail(`contract_ts_missing_capability:${capability}`)
}

const booleans = contract.booleans
const requiredTrue = [
  'toolCallReadinessContractPrepared',
  'all21ToolsCovered',
  'rankingSystemLinked',
  'capabilitySelectionLinked',
  'installReadinessLinked',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]
for (const key of requiredTrue) if (booleans[key] !== true) fail(`required_true_boolean_not_true:${key}`)

const requiredFalse = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
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
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]
for (const key of requiredFalse) if (booleans[key] !== false) fail(`required_false_boolean_not_false:${key}`)

const newDocs = [
  read('docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.md'),
  read('docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json'),
  read('docs/prompt-ai-graphics-tool-call-readiness-contract-results.md'),
  read('docs/implementation-prompts/prompt-ai-graphics-tool-call-readiness-contract.md'),
].join('\n')

const forbiddenClaims = [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
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
for (const pattern of forbiddenClaims) {
  if (pattern.test(newDocs)) fail(`forbidden_claim_detected:${pattern}`)
}

let changedPackageLock = ''
try {
  changedPackageLock = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
} catch (error) {
  fail(`package_lock_diff_check_failed:${error.message}`)
}
if (changedPackageLock) fail('package_lock_changed')

let basePackage = null
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch (error) {
  fail(`base_package_json_read_failed:${error.message}`)
}
if (basePackage) {
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(pkg[key] ?? {}) !== JSON.stringify(basePackage[key] ?? {})) {
      fail(`package_dependency_section_changed:${key}`)
    }
  }
}

const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
for (const file of [...trackedFiles, ...stagedFiles, ...changedFiles]) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_committed_or_changed:${file}`)
}

for (const file of [...stagedFiles, ...changedFiles]) {
  if (/(^|\/)(dist|build|coverage|\.local-artifacts|public\/generated|public\/artifacts|public-artifacts|render-outputs|rendered-output|browser-output|canvas-output|webgl-output)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_path_changed:${file}`)
  }
}

if (errors.length > 0) {
  console.error('AI graphics tool-call readiness diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: contract.decision,
  toolsCovered: contract.toolCounts.total,
  nodePackagesChecked: contract.toolCounts.nodeDeclaredLockedAndPresent,
  gpuToolsChecked: contract.toolCounts.gpuModelInstallTargetsPrepared,
  productionToolIdMapped: contract.toolCounts.productionToolIdMapped,
  agentCanSelectForPlanning: contract.booleans.agentCanSelectForPlanning,
  agentCanExecuteToolsNow: contract.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: contract.booleans.runtimeReadyNow,
}, null, 2))
