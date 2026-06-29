import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-service-role-queue-smoke-preflight'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-preflight.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-service-role-queue-smoke-preflight:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-preflight-diagnostics.mjs'

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

const falseBooleanKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'serviceRoleQueueSmokeApprovedNow',
  'liveServiceRoleQueueSmokeExecutedNow',
  'liveQueueWriteApprovedNow',
  'liveWorkerClaimInsertApprovedNow',
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
  'serviceRoleQueueSmokePerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreated',
  'workerDispatchPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-preflight.ts',
  'server/cli/ai-graphics-external-beta-service-role-queue-smoke-preflight.ts',
  'scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-preflight-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.md',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json',
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
  }).trim()
}

function runNpm(args, env = {}) {
  return execFileSync('npm', ['run', '--silent', ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      ...env,
    },
  })
}

function parseOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_output:${label}:${error.message}`)
    return {}
  }
}

function assertToolCoverage(container, label) {
  const toolSet = new Set(container.tools ?? container.payloadPreviews?.map((entry) => entry.toolId) ?? [])
  for (const toolId of allTools) {
    if (!toolSet.has(toolId)) fail(`${label}_missing_tool:${toolId}`)
  }
  if (toolSet.size !== allTools.length) fail(`${label}_tool_count_unexpected:${toolSet.size}`)
}

function assertCapabilities(container, label) {
  const capabilitySet = new Set(container.capabilities ?? [])
  for (const capability of capabilities) {
    if (!capabilitySet.has(capability)) fail(`${label}_missing_capability:${capability}`)
  }
  if (capabilitySet.size !== capabilities.length) fail(`${label}_capability_count_unexpected:${capabilitySet.size}`)
}

function assertFalseBooleans(output, label) {
  for (const key of falseBooleanKeys) {
    if (output.booleans?.[key] !== false) fail(`${label}_required_false_not_false:${key}`)
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) fail(`missing_required_file:${file}`)
}

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json')
const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.md')
const registrySource = read('server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-preflight.ts')
const cliSource = read('server/cli/ai-graphics-external-beta-service-role-queue-smoke-preflight.ts')
const indexSource = read('server/tool-registry/index.ts')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail('missing_or_wrong_run_script')
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('missing_or_wrong_diagnostic_script')
}
if (!indexSource.includes("export * from './ai-graphics-external-beta-service-role-queue-smoke-preflight'")) {
  fail('missing_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_service_role_queue_smoke_preflight_prepared_with_environment_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
assertToolCoverage(docs, 'docs')
assertCapabilities(docs, 'docs')

for (const toolId of gpuTools) {
  if (!docs.gpuTools?.includes(toolId)) fail(`docs_missing_gpu_tool:${toolId}`)
}
if (docs.gpuTools?.length !== gpuTools.length) fail('docs_gpu_tool_count_unexpected')

for (const [key, expected] of Object.entries({
  toolsCovered: 21,
  productFacingCapabilitiesCovered: 12,
  gpuRuntimeTargetedTools: 8,
  heavyToolsIncorrectlyTargetingCpu: 0,
  payloadPreviewsPrepared: 21,
  liveSupabaseQueueWritesNow: 0,
  liveWorkerClaimRowsNow: 0,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.expectedCounts?.[key] !== expected) {
    fail(`docs_expected_count_unexpected:${key}:${docs.expectedCounts?.[key]}`)
  }
}

for (const key of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
]) {
  if (!docs.requiredEnvironment?.includes(key)) fail(`docs_missing_required_env:${key}`)
  if (!markdown.includes(key)) fail(`markdown_missing_required_env:${key}`)
}

for (const flag of [
  '--workspace-id',
  '--project-id',
  '--approved-plan-snapshot-id',
  '--credit-reservation-id',
  '--idempotency-prefix',
  '--service-role-queue-smoke-readiness-ref',
  '--runtime-queue-service-proof-bridge-ref',
  '--source-runtime-queue-service-proof-bridge-accepted',
]) {
  if (!docs.requiredFlags?.includes(flag)) fail(`docs_missing_required_flag:${flag}`)
  if (!markdown.includes(flag)) fail(`markdown_missing_required_flag:${flag}`)
}

for (const [key, expected] of Object.entries({
  externalBetaServiceRoleQueueSmokePreflightPrepared: true,
  all21ToolsCovered: true,
  all12CapabilitiesCovered: true,
  all8GpuToolsTargetGpuRuntime: true,
  serviceRoleCredentialsServerOnly: true,
  secretsRedactedFromOutput: true,
  nonProductionEnvironmentRequired: true,
  explicitSmokeConfirmationRequired: true,
  cleanupRequired: true,
  gpuRuntimeOnDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  gpuStartsOnlyForApprovedWorkerOrToolCall: true,
  agentCanSelectForPlanning: true,
})) {
  if (docs.booleans?.[key] !== expected) fail(`docs_required_true_unexpected:${key}`)
}
for (const key of falseBooleanKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_unexpected:${key}`)
}

const defaultOutput = parseOutput(runNpm([runScriptName], {
  REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE: '',
  REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV: '',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  E2E_RUNTIME_MODE: '',
  WORKER_RUNTIME_MODE: '',
}), 'default_preflight')

const readySecret = 'sb_secret_external_beta_preflight_should_not_appear'
const readyOutputRaw = runNpm([runScriptName, '--',
  '--workspace-id', 'workspace_external_beta_smoke',
  '--project-id', 'project_external_beta_smoke',
  '--approved-plan-snapshot-id', 'approved_snapshot_external_beta_smoke',
  '--credit-reservation-id', 'credit_reservation_external_beta_smoke',
  '--idempotency-prefix', 'ai-graphics-external-beta-smoke-test',
  '--service-role-queue-smoke-readiness-ref', 'private://ai-graphics/external-beta/service-role-queue-smoke/readiness.json',
  '--runtime-queue-service-proof-bridge-ref', 'private://ai-graphics/external-beta/runtime-queue-service-bridge/proof.json',
  '--source-runtime-queue-service-proof-bridge-accepted',
], {
  REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE: 'true',
  REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV: 'non_production',
  SUPABASE_URL: 'https://external-beta-preflight.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: readySecret,
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'mock',
})
const readyOutput = parseOutput(readyOutputRaw, 'ready_preflight')

if (readyOutputRaw.includes(readySecret)) fail('ready_output_leaked_service_role_secret')
if (readyOutputRaw.includes('https://external-beta-preflight.supabase.co')) {
  fail('ready_output_leaked_supabase_url_value')
}

if (defaultOutput.status !== 'missing_required_environment_or_flags') {
  fail(`default_status_unexpected:${defaultOutput.status}`)
}
if (defaultOutput.readyToExecuteLiveNonProductionSmoke !== false) {
  fail('default_ready_to_execute_not_false')
}
if (defaultOutput.missingEnvironment?.length !== 6) {
  fail(`default_missing_environment_count_unexpected:${defaultOutput.missingEnvironment?.length}`)
}
if (defaultOutput.missingFlags?.length !== 7) {
  fail(`default_missing_flags_count_unexpected:${defaultOutput.missingFlags?.length}`)
}
if (defaultOutput.all21PayloadsPrepared !== true) fail('default_payloads_not_prepared')
assertToolCoverage(defaultOutput, 'default_output')
assertFalseBooleans(defaultOutput, 'default_output')

if (readyOutput.status !== 'ready_to_execute_non_production_service_role_queue_smoke') {
  fail(`ready_status_unexpected:${readyOutput.status}`)
}
if (readyOutput.readyToExecuteLiveNonProductionSmoke !== true) {
  fail('ready_to_execute_not_true')
}
if (readyOutput.missingEnvironment?.length !== 0) fail('ready_missing_environment_not_empty')
if (readyOutput.missingFlags?.length !== 0) fail('ready_missing_flags_not_empty')
if (readyOutput.sourceRuntimeQueueServiceProofBridgeAccepted !== true) {
  fail('ready_source_bridge_not_true')
}
if (readyOutput.toolsCovered !== 21) fail('ready_tools_covered_not_21')
if (readyOutput.productFacingCapabilitiesCovered !== 12) fail('ready_capabilities_not_12')
if (readyOutput.gpuRuntimeTargetedTools !== 8) fail('ready_gpu_tool_count_not_8')
if (readyOutput.payloadPreviews?.length !== 21) fail('ready_payload_preview_count_not_21')
for (const preview of readyOutput.payloadPreviews ?? []) {
  if (!allTools.includes(preview.toolId)) fail(`ready_payload_unknown_tool:${preview.toolId}`)
  if (preview.payloadShapeValid !== true) fail(`ready_payload_invalid:${preview.toolId}`)
  if (preview.toolExecutionApprovedNow !== false) fail(`ready_payload_tool_execution_not_false:${preview.toolId}`)
  if (preview.workerDispatchPerformed !== false) fail(`ready_payload_dispatch_not_false:${preview.toolId}`)
  if (preview.gpuRuntimeShouldStartNow !== false) fail(`ready_payload_gpu_start_not_false:${preview.toolId}`)
  if (gpuTools.includes(preview.toolId) && preview.gpuRequiredForRuntime !== true) {
    fail(`ready_gpu_tool_not_marked_gpu:${preview.toolId}`)
  }
}
assertToolCoverage(readyOutput, 'ready_output')
assertFalseBooleans(readyOutput, 'ready_output')
if (readyOutput.booleans?.requiredEnvironmentSatisfied !== true) fail('ready_env_satisfied_not_true')
if (readyOutput.booleans?.requiredFlagsSatisfied !== true) fail('ready_flags_satisfied_not_true')
if (readyOutput.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted !== true) {
  fail('ready_bridge_boolean_not_true')
}

const combinedText = [
  markdown,
  JSON.stringify(docs),
  registrySource,
  cliSource,
].join('\n')

for (const forbidden of [
  /agentCanExecuteToolsNow["`:=\s]+true/i,
  /routeExecutionApprovedNow["`:=\s]+true/i,
  /workerExecutionApprovedNow["`:=\s]+true/i,
  /toolExecutionApprovedNow["`:=\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:=\s]+true/i,
  /gpuRuntimeApprovedNow["`:=\s]+true/i,
  /runtimeReadyNow["`:=\s]+true/i,
  /externalBetaReadyNow["`:=\s]+true/i,
  /productionReadyNow["`:=\s]+true/i,
  /supabaseMutationPerformed["`:=\s]+true/i,
  /publicArtifactCreated["`:=\s]+true/i,
  /signedUrlCreated["`:=\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (forbidden.test(combinedText)) fail(`forbidden_claim:${forbidden}`)
}

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch {
  basePackage = {}
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-traffic-enablement-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly": "tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly:diagnostics": "node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-controls": "tsx server/cli/ai-graphics-external-beta-launch-controls.ts",',
  '+    "ai-graphics:external-beta-launch-controls:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs",',
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:model-weight-private-evidence-intake": "tsx server/cli/ai-graphics-model-weight-private-evidence-intake.ts",',
  '+    "ai-graphics:model-weight-private-evidence-intake:diagnostics": "node scripts/validation/ai-graphics-model-weight-private-evidence-intake-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

if (git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])) fail('package_lock_changed')
if (git(['ls-files', '.local-artifacts'])) fail('local_artifacts_tracked')
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /(^|\/)(dist|build|coverage)\//.test(file))) {
  fail('generated_build_output_staged')
}
if (stagedFiles.some((file) => /\.(png|jpg|jpeg|webp|gif|mp4|mov|webm)$/i.test(file))) {
  fail('generated_media_output_staged')
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  defaultStatus: defaultOutput.status,
  readyStatus: readyOutput.status,
  toolsCovered: readyOutput.toolsCovered,
  capabilitiesCovered: readyOutput.productFacingCapabilitiesCovered,
  gpuRuntimeTargetedTools: readyOutput.gpuRuntimeTargetedTools,
  all21PayloadsPrepared: readyOutput.all21PayloadsPrepared,
  readyToExecuteLiveNonProductionSmoke: readyOutput.readyToExecuteLiveNonProductionSmoke,
  liveSupabaseQueueWritesNow: readyOutput.liveSupabaseQueueWritesNow,
  liveWorkerDispatchesNow: readyOutput.liveWorkerDispatchesNow,
  liveToolExecutionsNow: readyOutput.liveToolExecutionsNow,
  gpuRuntimeShouldStartNow: readyOutput.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: readyOutput.externalBetaReadyNowTools,
  productionReadyNowTools: readyOutput.productionReadyNowTools,
}, null, 2))
