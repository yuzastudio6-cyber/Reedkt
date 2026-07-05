import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:21-tool-proper-install-audit:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-21-tool-proper-install-audit-diagnostics.mjs'

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

const jsPackages = {
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

const gpuRequirementNeedles = {
  torch_torchvision: ['docker/prod/gpu-worker/requirements.gpu.txt', 'torch==2.5.1+cu124', 'torchvision==0.20.1+cu124'],
  transformers: ['docker/prod/gpu-worker/requirements.gpu.txt', 'transformers==4.57.6'],
  sam2: ['docker/prod/sam2-runtime/requirements.sam2.txt', 'git+https://github.com/facebookresearch/sam2.git@2b90b9f5ceec907a1c18123530e92e794ad901a4'],
  birefnet: ['docker/prod/birefnet-runtime/requirements.birefnet.txt', 'transformers==4.57.6', 'timm==1.0.27', 'kornia==0.8.1'],
  real_esrgan: ['docker/prod/real-esrgan-runtime/requirements.real-esrgan.txt', 'realesrgan==0.3.0', 'basicsr==1.4.2'],
  kornia: ['docker/prod/gpu-worker/requirements.gpu.txt', 'kornia==0.8.1'],
  rembg: ['docker/prod/gpu-worker/requirements.gpu.txt', 'rembg[gpu]==2.0.69'],
  transparent_background: ['docker/prod/gpu-worker/requirements.gpu.txt', 'transparent-background==1.3.4'],
}

const expectedProductionMappings = {
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

const expectedGpuTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]
const expectedRuntimeProofPassedBlockedTools = [
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
const expectedModelWeightManifestTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const expectedRuntimeTargets = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
}

const expectedInstallProfiles = ['gpu_worker_ai_graphics', 'sam2', 'real_esrgan', 'birefnet']
const expectedAiGraphicsModelTemplateIds = [
  'sam2_checkpoint',
  'birefnet_model',
  'real_esrgan_model',
  'rembg_model',
  'transparent_background_model',
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

const pkg = json('package.json')
const lock = json('package-lock.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const auditMd = read('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.md')
const contract = json('docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json')
const gpuInstall = json('docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json')
const gpuGate = json('docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json')
const modelWeightTypes = read('server/model-weights/model-weight-manifest-types.ts')
const modelWeightTemplates = read('server/model-weights/model-weight-manifest-templates.ts')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (audit.decision !== 'ai_graphics_21_tool_proper_install_audit_completed_with_runtime_blocks') fail(`unexpected_decision:${audit.decision}`)
if (audit.counts?.totalTools !== 21) fail('audit_total_tools_not_21')
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('proper_install_count_not_21')
if (audit.counts?.nodeLockfileTools !== 13) fail('node_lockfile_count_not_13')
if (audit.counts?.gpuDockerInstallProofTools !== 8) fail('gpu_install_proof_tool_count_not_8')
if (audit.counts?.productionToolIdMapped !== 21) fail('production_mapping_count_not_21')
if (audit.counts?.unmappedPlanningWrappers !== 0) fail('unmapped_planning_wrapper_count_not_zero')
if (audit.counts?.heavyToolsTargetingGpu !== 8) fail('heavy_gpu_target_count_not_8')
if (audit.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) fail('heavy_tools_cpu_target_count_not_zero')
if (audit.counts?.aiGraphicsModelWeightTemplateTypes !== 5) fail('ai_graphics_model_template_count_not_5')
if (audit.counts?.runtimeProofPassedButToolCallBlocked !== 13) fail('runtime_proof_passed_blocked_count_not_13')
if (audit.counts?.externalBetaCallableInstallReadyNow !== 0) fail('external_beta_callable_install_ready_not_zero')
if (audit.counts?.properlyInstalledForExternalBetaRuntimeNow !== 0) {
  fail('properly_installed_for_external_beta_runtime_not_zero')
}
if (audit.counts?.runtimeReadyNow !== 0) fail('runtime_ready_count_not_zero')
if (audit.counts?.betaTestingReadyNow !== 0) fail('beta_testing_ready_count_not_zero')

function assertSameSet(label, actual, expected) {
  const actualValues = [...(actual || [])].sort()
  const expectedValues = [...expected].sort()
  if (JSON.stringify(actualValues) !== JSON.stringify(expectedValues)) {
    fail(`${label}_mismatch:${JSON.stringify(actualValues)}`)
  }
}

assertSameSet(
  'planned_surface_install_declared_or_locked_tools',
  audit.installMaturitySummary?.plannedSurfaceInstallDeclaredOrLockedTools,
  allTools,
)
assertSameSet(
  'runtime_proof_passed_but_tool_call_blocked_tools',
  audit.installMaturitySummary?.runtimeProofPassedButToolCallBlockedTools,
  expectedRuntimeProofPassedBlockedTools,
)
assertSameSet(
  'gpu_install_targets_prepared_native_proof_pending_tools',
  audit.installMaturitySummary?.gpuInstallTargetsPreparedNativeProofPendingTools,
  expectedGpuTools,
)
assertSameSet(
  'model_weight_manifest_required_before_external_beta_tools',
  audit.installMaturitySummary?.modelWeightManifestRequiredBeforeExternalBetaTools,
  expectedModelWeightManifestTools,
)
assertSameSet(
  'external_beta_callable_install_ready_now_tools',
  audit.installMaturitySummary?.externalBetaCallableInstallReadyNowTools,
  [],
)

const auditRows = new Map((audit.toolRows || []).map((row) => [row.toolId, row]))
if (auditRows.size !== 21) fail(`audit_row_count_not_21:${auditRows.size}`)
for (const tool of allTools) {
  const row = auditRows.get(tool)
  if (!row) fail(`missing_audit_row:${tool}`)
  if (row?.properlyInstalledForPlannedSurface !== true) fail(`tool_not_marked_properly_installed:${tool}`)
  if (row?.runtimeReadyNow !== false) fail(`tool_runtime_ready_not_false:${tool}`)
  if (contract.productionToolMappings?.[tool] !== expectedProductionMappings[tool]) {
    fail(`contract_mapping_mismatch:${tool}:${contract.productionToolMappings?.[tool]}`)
  }
  if (row?.productionToolId !== expectedProductionMappings[tool]) fail(`audit_mapping_mismatch:${tool}:${row?.productionToolId}`)
  if (!auditMd.includes(`\`${tool}\``)) fail(`audit_markdown_missing_tool:${tool}`)
}

const rootDeps = {
  ...(pkg.dependencies || {}),
  ...(pkg.devDependencies || {}),
  ...(pkg.optionalDependencies || {}),
}
const rootLockDeps = lock.packages?.['']?.dependencies || {}
for (const [tool, packageName] of Object.entries(jsPackages)) {
  if (!rootDeps[packageName]) fail(`package_json_missing:${tool}:${packageName}`)
  if (!rootLockDeps[packageName]) fail(`package_lock_root_missing:${tool}:${packageName}`)
  if (!lock.packages?.[`node_modules/${packageName}`]) fail(`package_lock_node_missing:${tool}:${packageName}`)
  if (!['node_package_lock', 'node_package_lock_with_production_alias'].includes(auditRows.get(tool)?.installSurface)) {
    fail(`js_tool_wrong_install_surface:${tool}:${auditRows.get(tool)?.installSurface}`)
  }
}

for (const [tool, [filePath, ...needles]] of Object.entries(gpuRequirementNeedles)) {
  const text = read(filePath)
  for (const needle of needles) {
    if (!text.includes(needle)) fail(`gpu_requirement_missing:${tool}:${needle}`)
  }
  const row = auditRows.get(tool)
  if (!row?.runtimeTarget?.includes('nvidia_l4')) fail(`gpu_tool_not_targeting_l4:${tool}:${row?.runtimeTarget}`)
  if (row?.runtimeTarget !== expectedRuntimeTargets[tool]) fail(`gpu_tool_runtime_target_mismatch:${tool}:${row?.runtimeTarget}`)
  if (!expectedGpuTools.includes(tool)) fail(`unexpected_gpu_tool:${tool}`)
}

if (contract.toolCounts?.productionToolIdMapped !== 21) fail('contract_production_mapping_count_not_21')
if (contract.toolCounts?.planningWrapperWithoutProductionToolId !== 0) fail('contract_unmapped_wrappers_not_zero')
if (contract.toolCounts?.agentExecutableNow !== 0) fail('contract_agent_executable_not_zero')
if (contract.toolCounts?.runtimeReadyNow !== 0) fail('contract_runtime_ready_not_zero')
if (contract.booleans?.gpuHeavyToolsTargetGpuRuntime !== true) fail('contract_gpu_heavy_target_boolean_not_true')
if (contract.booleans?.agentCanExecuteToolsNow !== false) fail('contract_agent_execute_not_false')

const installEvidence = new Map((gpuInstall.localBuildEvidence || []).map((entry) => [entry.profileId, entry]))
for (const profile of expectedInstallProfiles) {
  const entry = installEvidence.get(profile)
  if (!entry) fail(`missing_gpu_install_profile:${profile}`)
  if (entry?.status !== 'passed') fail(`gpu_install_profile_not_passed:${profile}:${entry?.status}`)
  if (entry?.importSmokeStatus !== 'passed') fail(`gpu_import_smoke_not_passed:${profile}:${entry?.importSmokeStatus}`)
  for (const key of ['nvidiaRuntimeUsed', 'modelWeightsLoaded', 'mediaProcessed', 'providerRuntimeUsed', 'publicArtifactCreated', 'signedUrlCreated']) {
    if (entry?.[key] !== false) fail(`gpu_install_profile_forbidden_true:${profile}:${key}`)
  }
}

for (const tool of expectedGpuTools) {
  const gateTool = (gpuGate.tools || []).find((entry) => entry.toolId === tool)
  if (!gateTool) fail(`missing_gpu_runtime_gate_tool:${tool}`)
  if (gateTool?.status !== 'runtime_gate_prepared_native_gpu_required') fail(`unexpected_gpu_runtime_gate_status:${tool}:${gateTool?.status}`)
}

const requiredTrue = [
  'all21ToolsAudited',
  'all21ToolsMappedToProductionRegistry',
  'all13JsToolsDeclaredInPackageJson',
  'all13JsToolsLockedInPackageLock',
  'all8GpuModelToolsHaveDockerInstallProof',
  'aiGraphicsModelWeightTemplateTypesAligned',
  'gpuHeavyToolsTargetGpuRuntime',
  'properInstallAuditSeparatesPlannedSurfaceFromRuntimeCallable',
  'all21ToolsInstalledForPlannedSurfaceOnly',
  'agentCanSelectForPlanning',
]
for (const key of requiredTrue) if (audit.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)

const requiredFalse = [
  'gpuHeavyToolsTargetCpuRuntime',
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
  'dependencyInstallPerformedInThisAudit',
  'packageLockMutationPerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]
for (const key of requiredFalse) if (audit.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)

for (const templateId of expectedAiGraphicsModelTemplateIds) {
  if (!modelWeightTypes.includes(`| '${templateId}'`)) fail(`model_weight_template_id_missing_from_type:${templateId}`)
  if (!modelWeightTemplates.includes(`id: '${templateId}'`)) fail(`model_weight_template_missing:${templateId}`)
  if (!audit.aiGraphicsModelWeightTemplateTypes?.includes(templateId)) fail(`audit_missing_model_weight_template_id:${templateId}`)
}

const combinedText = [auditMd, JSON.stringify(audit), JSON.stringify(contract), JSON.stringify(gpuGate)].join('\n')
for (const pattern of [
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
  /modelWeightsDownloaded["`:= ]+true/i,
  /modelWeightsLoaded["`:= ]+true/i,
  /mediaProcessingPerformed["`:= ]+true/i,
  /publicArtifactCreated["`:= ]+true/i,
  /signedUrlCreated["`:= ]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim_detected:${pattern}`)
}
for (const needle of [
  'Runtime-proofed JS tools that remain tool-call blocked: 13.',
  'GPU install targets prepared but native NVIDIA proof pending: 8.',
  'Model-weight manifest tools still pending before external beta: 5.',
  'Properly installed for external-beta runtime now: 0.',
  'External-beta callable install-ready now: 0.',
  'It does not mean the tool can be called by an external-beta user.',
]) {
  if (!auditMd.includes(needle)) fail(`audit_markdown_missing_maturity_needle:${needle}`)
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
for (const file of [...changedFiles, ...stagedFiles]) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/(^|\/)(dist|build|coverage|public\/generated|public\/artifacts|public-artifacts|render-outputs|rendered-output|browser-output|canvas-output|webgl-output)(\/|$)/i.test(file)) {
    fail(`generated_output_path_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) fail(`generated_media_or_font_changed:${file}`)
}

if (errors.length) {
  console.error('AI graphics 21-tool proper install audit diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: audit.decision,
  toolsAudited: audit.counts.totalTools,
  properlyInstalledForPlannedSurface: audit.counts.properlyInstalledForPlannedSurface,
  nodeLockfileTools: audit.counts.nodeLockfileTools,
  gpuDockerInstallProofTools: audit.counts.gpuDockerInstallProofTools,
  runtimeProofPassedButToolCallBlocked: audit.counts.runtimeProofPassedButToolCallBlocked,
  externalBetaCallableInstallReadyNow: audit.counts.externalBetaCallableInstallReadyNow,
  heavyToolsIncorrectlyTargetingCpu: audit.counts.heavyToolsIncorrectlyTargetingCpu,
  agentCanExecuteToolsNow: audit.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: audit.booleans.runtimeReadyNow,
  betaTestingReadyNow: false,
}, null, 2))
