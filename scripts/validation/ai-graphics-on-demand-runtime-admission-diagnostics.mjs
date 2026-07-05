import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:on-demand-runtime-admission:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-on-demand-runtime-admission-diagnostics.mjs'

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
  'server/tool-registry/ai-graphics-on-demand-runtime-admission.ts',
  'server/tool-registry/ai-graphics-tool-call-plan-evaluator.ts',
  'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission.md',
  'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission.json',
  'docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json',
  'docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const admission = json('docs/tool-intelligence/ai-graphics/on-demand-runtime-admission.json')
const evaluator = json('docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json')
const handoff = json('docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const source = read('server/tool-registry/ai-graphics-on-demand-runtime-admission.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/on-demand-runtime-admission.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-on-demand-runtime-admission'")) {
  fail('server_registry_index_does_not_export_on_demand_runtime_admission')
}

if (admission.decision !== 'ai_graphics_on_demand_runtime_admission_prepared_with_fail_closed_blocks') {
  fail(`unexpected_decision:${admission.decision}`)
}
if (admission.sourceDecision !== 'ai_graphics_tool_call_plan_evaluator_prepared_with_execution_blocks') {
  fail(`unexpected_source_decision:${admission.sourceDecision}`)
}
if (evaluator.decision !== admission.sourceDecision) fail('source_plan_evaluator_not_accepted')
if (handoff.gpuRuntimeTargetedTools?.length !== 8) fail('handoff_gpu_tool_count_not_8')
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('proper_install_count_not_21')

for (const needle of [
  'AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION',
  'evaluateAiGraphicsOnDemandRuntimeAdmission',
  'buildAiGraphicsOnDemandRuntimeAdmissionExamples',
  'privateArtifactManifestAccepted',
  'on_demand_start_allowed_after_live_worker_enqueue',
  'gpuRuntimeShouldStartNow: false',
  'gpuRuntimePerformed: false',
  'noIdleGpuRuntimeApproved: true',
  'startsOnlyForApprovedWorkerOrToolCall: true',
  'cpuFallbackAllowedForHeavyTools: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}

for (const gate of [
  'approved plan snapshot is missing',
  'credit reservation is missing',
  'artifact boundary approval is missing',
  'Tool Route approval reference is missing',
  'Worker approval reference is missing',
  'runtime enqueue approval reference is missing',
  'owner runtime approval reference is missing',
  'private artifact manifest reference is missing or not private-scoped',
  'native NVIDIA GPU runtime proof reference is missing',
  'reviewed model-weight manifest reference is missing',
  'browser/canvas/WebGL runtime proof reference is missing',
]) {
  if (!source.includes(gate)) fail(`source_gate_missing:${gate}`)
}

if (admission.counts?.totalTools !== 21) fail('admission_total_tools_not_21')
if (admission.counts?.productFacingCapabilities !== 12) fail('admission_capability_count_not_12')
if (admission.counts?.gpuRuntimeTargetedTools !== 8) fail('admission_gpu_tool_count_not_8')
if (admission.counts?.gpuRuntimeStartedNow !== 0) fail('gpu_runtime_started_now_not_zero')
if (admission.counts?.idleGpuRuntimeApprovedNow !== 0) fail('idle_gpu_approved_not_zero')
if (admission.counts?.agentExecutableNow !== 0) fail('agent_executable_now_not_zero')
if (admission.counts?.runtimeReadyNow !== 0) fail('runtime_ready_now_not_zero')

for (const tool of allTools) {
  if (!admission.allTools?.includes(tool)) fail(`admission_missing_tool:${tool}`)
}
for (const capability of productCapabilities) {
  if (!admission.productFacingCapabilities?.includes(capability)) {
    fail(`admission_missing_capability:${capability}`)
  }
}
for (const tool of gpuTools) {
  if (!admission.gpuRuntimeTargetedTools?.includes(tool)) fail(`admission_missing_gpu_tool:${tool}`)
}

for (const gate of [
  'approved plan snapshot',
  'credit reservation',
  'artifact boundary approval',
  'Tool Route approval',
  'Worker approval',
  'runtime enqueue approval',
  'owner runtime approval',
  'private artifact manifest',
]) {
  if (!admission.requiredRuntimeJobGates?.includes(gate)) fail(`required_runtime_job_gate_missing:${gate}`)
}

const examples = new Map((admission.exampleEvaluations || []).map((example) => [example.id, example]))
if (examples.get('planning_sam2')?.gpuRuntimeStartupAuthorization !== 'not_requested_planning_metadata_only') {
  fail('planning_sam2_not_planning_only')
}
if (examples.get('blocked_sam2_missing_gates')?.gpuRuntimeStartupAuthorization !== 'blocked_missing_runtime_job_gates') {
  fail('blocked_sam2_not_blocked')
}
if (examples.get('accepted_future_sam2_worker_job')?.gpuRuntimeStartupAuthorization !== 'on_demand_start_allowed_after_live_worker_enqueue') {
  fail('accepted_sam2_not_on_demand_authorized')
}
if (examples.get('accepted_future_sam2_worker_job')?.gpuRuntimeStartAllowedForAcceptedJob !== true) {
  fail('accepted_sam2_gpu_start_not_allowed_for_accepted_job')
}
if (examples.get('accepted_future_sam2_worker_job')?.gpuRuntimeShouldStartNow !== false) {
  fail('accepted_sam2_started_gpu_now')
}
if (examples.get('accepted_future_d3_worker_job')?.gpuRuntimeStartupAuthorization !== 'not_applicable_non_gpu_runtime') {
  fail('accepted_d3_not_non_gpu')
}
if (examples.get('accepted_future_d3_worker_job')?.gpuRuntimeStartAllowedForAcceptedJob !== false) {
  fail('accepted_d3_gpu_start_allowed')
}

for (const key of [
  'onDemandRuntimeAdmissionPrepared',
  'sourcePlanEvaluatorAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'agentCanSelectForPlanning',
  'runtimeJobAdmissionReadyWithProvidedEvidence',
  'gpuRuntimeStartAllowedForAcceptedJob',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'privateArtifactManifestRequired',
]) {
  if (admission.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const key of [
  'cpuFallbackAllowedForHeavyTools',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
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
]) {
  if (admission.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

if (!markdown.includes('If no one is using the tool, no GPU runtime should be running.')) {
  fail('markdown_missing_no_idle_gpu_statement')
}
if (!scorecard.includes('AI Graphics On-Demand Runtime Admission')) {
  fail('scorecard_missing_on_demand_runtime_admission')
}

const combinedText = [markdown, JSON.stringify(admission), source].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
  /workerQueueApprovedNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeShouldStartNow["`:= ]+true/i,
  /gpuRuntimePerformed["`:= ]+true/i,
  /modelWeightsDownloaded["`:= ]+true/i,
  /modelWeightsLoaded["`:= ]+true/i,
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
  console.error('AI graphics on-demand runtime admission diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: admission.decision,
  toolsCovered: admission.counts.totalTools,
  productFacingCapabilities: admission.counts.productFacingCapabilities,
  gpuRuntimeTargetedTools: admission.counts.gpuRuntimeTargetedTools,
  gpuRuntimeOnDemandOnly: admission.booleans.gpuRuntimeOnDemandOnly,
  noIdleGpuRuntimeApproved: admission.booleans.noIdleGpuRuntimeApproved,
  gpuRuntimeStartAllowedForAcceptedJob:
    admission.booleans.gpuRuntimeStartAllowedForAcceptedJob,
  gpuRuntimeShouldStartNow: admission.booleans.gpuRuntimeShouldStartNow,
}, null, 2))
