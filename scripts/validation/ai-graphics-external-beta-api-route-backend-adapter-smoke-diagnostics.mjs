import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_api_route_backend_adapter_smoke_prepared_with_runtime_blocks'
const acceptedStatus = 'route_to_backend_adapter_smoke_ready_runtime_still_blocked'
const sourceDecision =
  'ai_graphics_external_beta_api_route_backend_adapter_preflight_ready_with_runtime_blocks'
const sourceStatus = 'backend_adapter_preflight_ready_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-api-route-backend-adapter-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-backend-adapter-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-smoke-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts',
  'server/cli/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-smoke.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter.json',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const tools = [
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

const trueKeys = [
  'externalBetaApiRouteBackendAdapterSmokePrepared',
  'sourceBackendAdapterPreflightAccepted',
  'routeSmokeRequestsAccepted',
  'backendAdapterSmokeReadyWithProvidedEvidence',
  'cpuStaticRouteSmokeAccepted',
  'gpuModelRouteSmokeAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'agentCanExecuteToolsNow',
  'directAgentToolExecutionApprovedNow',
  'apiRouteMountedNow',
  'apiRouteExecutionApprovedNow',
  'apiRouteExecutionPerformed',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'workerEnqueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'serviceRoleQueueTransactionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerLeaseCreationApprovedNow',
  'workerDispatchApprovedNow',
  'productionWorkerDispatchApprovedNow',
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
  'workerEnqueuePerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'serviceRoleTransactionPerformed',
  'supabaseMutationPerformed',
  'liveQueueWritePerformed',
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

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /apiRouteMountedNow["`:\s=]+true/i,
  /apiRouteExecutionApprovedNow["`:\s=]+true/i,
  /apiRouteExecutionPerformed["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /liveQueueWriteApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /dependencyInstallPerformed["`:\s=]+true/i,
  /packageLockMutationPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const changedGeneratedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const failures = []

function fail(message) {
  failures.push(message)
}

function read(file) {
  const filePath = path.join(process.cwd(), file)
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
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
    cwd: process.cwd(),
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function countFrom(packet, key) {
  const direct = packet?.[key]
  if (Array.isArray(direct)) return direct.length
  return direct ?? packet?.counts?.[key] ?? packet?.coverage?.[key] ?? packet?.scope?.[key]
}

function checkBooleans(packet) {
  for (const key of trueKeys) {
    if (packet.booleans?.[key] !== true) fail(`boolean_not_true:${key}`)
  }
  for (const key of falseKeys) {
    if (packet.booleans?.[key] !== false) fail(`boolean_not_false:${key}`)
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-smoke.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-smoke.md')
const sourcePacket = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter.json')
const source = read('server/tool-registry/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts')
const cli = read('server/cli/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts')
const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
const index = read('server/tool-registry/index.ts')
const packageJson = json('package.json')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('decision_mismatch')
if (docs.status !== acceptedStatus) fail('status_mismatch')
if (countFrom(docs, 'totalAiGraphicsTools') !== 21) fail('total_tools_mismatch')
if (countFrom(docs, 'totalProductFacingCapabilities') !== 12) fail('total_capabilities_mismatch')
if (countFrom(docs, 'gpuRuntimeTargetedTools') !== 8) fail('gpu_tools_mismatch')
if (countFrom(docs, 'backendAdapterSmokeReadyToolsWithProvidedEvidence') !== 21) {
  fail('smoke_ready_count_mismatch')
}
if (countFrom(docs, 'routeSmokeRequestsAcceptedWithProvidedEvidence') !== 2) {
  fail('route_smoke_request_count_mismatch')
}
if (countFrom(docs, 'cpuStaticRouteSmokeCasesAcceptedWithProvidedEvidence') !== 1) {
  fail('cpu_static_smoke_count_mismatch')
}
if (countFrom(docs, 'gpuModelRouteSmokeCasesAcceptedWithProvidedEvidence') !== 1) {
  fail('gpu_model_smoke_count_mismatch')
}
for (const zeroKey of [
  'apiRouteMountedNowTools',
  'routeExecutionsApprovedNow',
  'liveQueueWriteApprovedNowTools',
  'workerEnqueueApprovedNowTools',
  'workerDispatchesApprovedNow',
  'toolExecutionsApprovedNow',
  'gpuRuntimeShouldStartNowTools',
  'externalBetaReadyNowTools',
  'productionReadyNowTools',
]) {
  if (countFrom(docs, zeroKey) !== 0) fail(`count_not_zero:${zeroKey}`)
}

checkBooleans(docs)

if (sourcePacket.decision !== sourceDecision) fail('source_decision_mismatch')
if (sourcePacket.status !== sourceStatus) fail('source_status_mismatch')
if (sourcePacket.booleans?.backendAdapterPreflightReadyWithProvidedEvidence !== true) {
  fail('source_backend_adapter_preflight_not_ready')
}
if (sourcePacket.booleans?.agentCanExecuteToolsNow !== false) {
  fail('source_agent_execution_not_false')
}

const cases = docs.routeSmokeCases ?? []
if (cases.length !== 2) fail('route_smoke_cases_length_mismatch')
const d3Case = cases.find((item) => item.toolId === 'd3')
const sam2Case = cases.find((item) => item.toolId === 'sam2')
if (!d3Case) fail('missing_d3_smoke_case')
if (!sam2Case) fail('missing_sam2_smoke_case')
if (d3Case) {
  if (d3Case.capabilityId !== 'chart_overlay') fail('d3_capability_mismatch')
  if (d3Case.runtimeTarget !== 'node_cpu_static') fail('d3_runtime_target_mismatch')
  if (d3Case.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
    fail('d3_gpu_start_allowed_not_false')
  }
  if (d3Case.gpuRuntimeShouldStartNow !== false) fail('d3_gpu_should_start_not_false')
}
if (sam2Case) {
  if (sam2Case.capabilityId !== 'subject_segmentation') fail('sam2_capability_mismatch')
  if (sam2Case.runtimeTarget !== 'native_linux_amd64_nvidia_l4_sam2_runtime') {
    fail('sam2_runtime_target_mismatch')
  }
  if (sam2Case.workerType !== 'gpu_ai_worker') fail('sam2_worker_type_mismatch')
  if (sam2Case.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
    fail('sam2_gpu_start_allowed_not_true')
  }
  if (sam2Case.gpuRuntimeShouldStartNow !== false) fail('sam2_gpu_should_start_not_false')
}

for (const smokeCase of cases) {
  for (const key of [
    'appRouteMountedNow',
    'apiRouteExecutionApprovedNow',
    'routeExecutionPerformed',
    'backendQueueSubmissionApprovedNow',
    'backendQueueSubmissionPerformed',
    'workerEnqueueApprovedNow',
    'workerEnqueuePerformed',
    'workerDispatchPerformed',
    'toolExecutionPerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
  ]) {
    if (smokeCase[key] !== false) fail(`smoke_case_flag_not_false:${smokeCase.toolId}:${key}`)
  }
}

for (const tool of tools) {
  if (!docs.tools?.includes(tool)) fail(`missing_tool:${tool}`)
  if (!docsMd.includes(tool)) fail(`missing_tool_markdown:${tool}`)
}

for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`missing_capability:${capability}`)
}

for (const required of [
  'external-beta-api-route-backend-adapter.json',
  'external-beta-api-route-backend-adapter-contract.json',
  'external-beta-api-route-handler-contract.json',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
]) {
  if (!JSON.stringify(docs.sourceEvidence ?? {}).includes(required) && !docsMd.includes(required)) {
    fail(`missing_source_evidence:${required}`)
  }
}

for (const required of [
  'privateRouteToBackendAdapterSmokeOnly',
  'routeSchemaValidationOnly',
  'noApiRouteExecution',
  'noBackendQueueSubmission',
  'noLiveQueueWrite',
  'noWorkerEnqueue',
  'noWorkerDispatch',
  'noToolExecution',
  'onDemandGpuOnly',
]) {
  if (!JSON.stringify(docs.smokePolicy ?? {}).includes(required) && !source.includes(required)) {
    fail(`missing_smoke_policy:${required}`)
  }
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(JSON.stringify(docs)) || pattern.test(docsMd)) {
    fail(`forbidden_claim:${pattern}`)
  }
}

for (const required of [
  'AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_SMOKE_DECISION',
  'evaluateAiGraphicsExternalBetaApiRouteBackendAdapterSmoke',
  'buildAiGraphicsExternalBetaApiRouteBackendAdapterSmokeInput',
  'aiGraphicsExternalBetaToolCallRequestSchema.safeParse',
  'route-backend-adapter-smoke-d3-cpu-static',
  'route-backend-adapter-smoke-sam2-gpu-model',
  'backendQueueSubmissionApprovedNow: false',
  'workerEnqueueApprovedNow: false',
  'toolExecutionPerformed: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(required)) fail(`source_missing:${required}`)
}

for (const required of [
  '--backend-adapter-packet',
  'evaluateAiGraphicsExternalBetaApiRouteBackendAdapterSmoke',
  'routeSmokeRequestsBuilt',
  'toolExecutionPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(required)) fail(`cli_missing:${required}`)
}

if (!routeSource.includes('aiGraphicsExternalBetaToolCallRequestSchema')) {
  fail('route_schema_missing')
}
if (routeSource.includes('createAiGraphicsExternalBetaToolCallRoutes()') &&
    read('server/app.ts').includes('createAiGraphicsExternalBetaToolCallRoutes')) {
  fail('route_is_mounted_in_app')
}

if (!index.includes("export * from './ai-graphics-external-beta-api-route-backend-adapter-smoke'")) {
  fail('missing_index_export')
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

if (!scorecard.includes(decision) ||
    !scorecard.toLowerCase().includes('backend adapter smoke')) {
  fail('scorecard_missing_backend_adapter_smoke_status')
}
if (/runtimeReadyNow["`:\s=]+true/i.test(scorecard) ||
    /externalBetaReadyNow["`:\s=]+true/i.test(scorecard) ||
    /productionReadyNow["`:\s=]+true/i.test(scorecard)) {
  fail('scorecard_claims_runtime_or_beta_or_production_ready')
}

let cliReport = {}
try {
  cliReport = JSON.parse(exec([
    'npx',
    'tsx',
    'server/cli/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts',
    '--backend-adapter-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter.json',
  ].join(' ')))
} catch (error) {
  fail(`cli_execution_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
if (cliReport.booleans?.backendAdapterSmokeReadyWithProvidedEvidence !== true) {
  fail('cli_smoke_ready_not_true')
}
if (cliReport.booleans?.agentCanExecuteToolsNow !== false) {
  fail('cli_agent_execution_not_false')
}
if (cliReport.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('cli_gpu_start_not_false')
}
if (cliReport.input?.routeExecutionPerformed !== false ||
    cliReport.input?.backendQueueSubmissionPerformed !== false ||
    cliReport.input?.workerEnqueuePerformed !== false ||
    cliReport.input?.gpuRuntimePerformed !== false) {
  fail('cli_input_runtime_flags_not_false')
}

const packageDiff = [
  exec('git diff -- package.json'),
  exec('git diff --cached -- package.json'),
].join('\n')
const allowedPackageAdditions = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-tool-call-handler-bridge": "tsx server/cli/ai-graphics-external-beta-tool-call-handler-bridge.ts",',
  '+    "ai-graphics:external-beta-tool-call-handler-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-tool-call-handler-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-to-queue-authorization-bridge": "tsx server/cli/ai-graphics-external-beta-route-to-queue-authorization-bridge.ts",',
  '+    "ai-graphics:external-beta-route-to-queue-authorization-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-to-queue-authorization-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-to-live-enqueue-authorization-bridge": "tsx server/cli/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts",',
  '+    "ai-graphics:external-beta-route-to-live-enqueue-authorization-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-authorization-bridge": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-authorization-bridge.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-authorization-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-authorization-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-preflight-run-gate": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-preflight-run-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-runbook-authorization": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-runbook-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-result-capture-contract": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-result-capture-contract.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-result-capture-contract:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-result-capture-contract-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-operator-preflight": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-operator-preflight.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-operator-preflight:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-operator-preflight-diagnostics.mjs",',
])
const unexpectedPackageAdditions = packageDiff
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .filter((line) => !allowedPackageAdditions.has(line))
if (unexpectedPackageAdditions.length > 0) {
  fail(`unexpected_package_json_additions:${unexpectedPackageAdditions.join('|')}`)
}

const lockDiff = [
  exec('git diff -- package-lock.json'),
  exec('git diff --cached -- package-lock.json'),
].join('').trim()
if (lockDiff.length > 0) fail('package_lock_changed')

const changedFiles = [
  exec('git diff --name-only'),
  exec('git diff --cached --name-only'),
].join('\n').split('\n').filter(Boolean)
for (const changedFile of changedFiles) {
  if (changedGeneratedArtifactPattern.test(changedFile)) {
    fail(`generated_artifact_path_changed:${changedFile}`)
  }
}

if (changedFiles.some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_changed')
}

if (failures.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    decision,
    acceptedStatus,
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  acceptedStatus,
  tools: tools.length,
  capabilities: capabilities.length,
  routeSmokeRequestsAcceptedWithProvidedEvidence: 2,
  cpuStaticRouteSmokeCasesAcceptedWithProvidedEvidence: 1,
  gpuModelRouteSmokeCasesAcceptedWithProvidedEvidence: 1,
  packageLockUnchanged: true,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
