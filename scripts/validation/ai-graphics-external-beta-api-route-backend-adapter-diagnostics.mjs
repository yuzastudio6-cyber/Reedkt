import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_api_route_backend_adapter_preflight_ready_with_runtime_blocks'
const acceptedStatus = 'backend_adapter_preflight_ready_runtime_still_blocked'
const sourceBackendDecision =
  'ai_graphics_external_beta_api_route_backend_adapter_contract_prepared_with_runtime_blocks'
const sourceBackendStatus = 'backend_adapter_contract_ready_runtime_still_blocked'
const sourceHandlerDecision =
  'ai_graphics_external_beta_api_route_handler_contract_prepared_with_runtime_blocks'
const sourceHandlerStatus =
  'external_beta_api_route_handler_contract_ready_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-api-route-backend-adapter'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-backend-adapter.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-backend-adapter:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-api-route-backend-adapter.ts',
  'server/cli/ai-graphics-external-beta-api-route-backend-adapter.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json',
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

const requiredStubIds = [
  'approved_snapshot_lookup',
  'credit_reservation_lookup',
  'private_artifact_policy',
  'asset_manifest_binding',
  'dependency_readiness',
  'async_checkback',
  'queue_submission_authorization',
  'worker_enqueue_authorization',
  'service_role_boundary',
  'idempotency',
  'rate_limit',
  'cost_guardrail',
  'audit_telemetry',
  'kill_switch',
  'rollback',
]

const trueKeys = [
  'externalBetaApiRouteBackendAdapterPreflightPrepared',
  'sourceBackendAdapterContractAccepted',
  'sourceApiRouteHandlerContractAccepted',
  'backendAdapterPreflightRefsAccepted',
  'backendAdapterPreflightReadyWithProvidedEvidence',
  'approvedSnapshotLookupAdapterStubReady',
  'creditReservationLookupAdapterStubReady',
  'privateArtifactPolicyAdapterStubReady',
  'assetManifestBindingAdapterStubReady',
  'dependencyReadinessAdapterStubReady',
  'asyncCheckbackAdapterStubReady',
  'queueSubmissionAuthorizationAdapterStubReady',
  'workerEnqueueAuthorizationAdapterStubReady',
  'serviceRoleBoundaryAdapterStubReady',
  'idempotencyAdapterStubReady',
  'rateLimitAdapterStubReady',
  'costGuardrailAdapterStubReady',
  'auditTelemetryAdapterStubReady',
  'killSwitchAdapterStubReady',
  'rollbackAdapterStubReady',
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
    if (packet.booleans?.[key] !== true) {
      fail(`boolean_not_true:${key}`)
    }
  }
  for (const key of falseKeys) {
    if (packet.booleans?.[key] !== false) {
      fail(`boolean_not_false:${key}`)
    }
  }
}

function checkSourcePacket(packet, expectedDecision, expectedStatus, label) {
  if (packet.decision !== expectedDecision) fail(`${label}_decision_mismatch`)
  if (packet.status !== expectedStatus) fail(`${label}_status_mismatch`)
  if (countFrom(packet, 'totalAiGraphicsTools') !== 21) {
    fail(`${label}_tool_count_mismatch`)
  }
  if (countFrom(packet, 'totalProductFacingCapabilities') !== 12) {
    fail(`${label}_capability_count_mismatch`)
  }
  if (countFrom(packet, 'gpuRuntimeTargetedTools') !== 8) {
    fail(`${label}_gpu_count_mismatch`)
  }
  if (packet.booleans?.agentCanExecuteToolsNow !== false) {
    fail(`${label}_agent_execution_not_false`)
  }
  if (packet.booleans?.gpuRuntimeShouldStartNow !== false) {
    fail(`${label}_gpu_start_not_false`)
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter.md')
const source = read('server/tool-registry/ai-graphics-external-beta-api-route-backend-adapter.ts')
const cli = read('server/cli/ai-graphics-external-beta-api-route-backend-adapter.ts')
const index = read('server/tool-registry/index.ts')
const packageJson = json('package.json')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const backendContract = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.json')
const handlerContract = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json')

if (docs.decision !== decision) fail('decision_mismatch')
if (docs.status !== acceptedStatus) fail('status_mismatch')
if (countFrom(docs, 'totalAiGraphicsTools') !== 21) fail('total_tools_mismatch')
if (countFrom(docs, 'totalProductFacingCapabilities') !== 12) {
  fail('total_capabilities_mismatch')
}
if (countFrom(docs, 'gpuRuntimeTargetedTools') !== 8) fail('gpu_tools_mismatch')
if (countFrom(docs, 'backendAdapterPreflightReadyToolsWithProvidedEvidence') !== 21) {
  fail('preflight_ready_count_mismatch')
}
if (countFrom(docs, 'apiRouteMountedNowTools') !== 0) fail('api_route_mounted_count_not_zero')
if (countFrom(docs, 'routeExecutionsApprovedNow') !== 0) {
  fail('route_execution_count_not_zero')
}
if (countFrom(docs, 'workerEnqueueApprovedNowTools') !== 0) {
  fail('worker_enqueue_count_not_zero')
}
if (countFrom(docs, 'gpuRuntimeShouldStartNowTools') !== 0) {
  fail('gpu_should_start_count_not_zero')
}
if (countFrom(docs, 'externalBetaReadyNowTools') !== 0) {
  fail('external_beta_ready_count_not_zero')
}
if (countFrom(docs, 'productionReadyNowTools') !== 0) {
  fail('production_ready_count_not_zero')
}

checkBooleans(docs)
checkSourcePacket(backendContract, sourceBackendDecision, sourceBackendStatus, 'backend_contract')
checkSourcePacket(handlerContract, sourceHandlerDecision, sourceHandlerStatus, 'handler_contract')

for (const tool of tools) {
  if (!docs.tools?.includes(tool)) fail(`missing_tool:${tool}`)
  if (!docsMd.includes(tool)) fail(`missing_tool_markdown:${tool}`)
}

for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`missing_capability:${capability}`)
}

const stubs = docs.backendAdapterPreflight?.adapterStubs ?? []
if (stubs.length !== requiredStubIds.length) fail('adapter_stub_count_mismatch')
for (const stubId of requiredStubIds) {
  const stub = stubs.find((item) => item.stubId === stubId)
  if (!stub) {
    fail(`missing_adapter_stub:${stubId}`)
    continue
  }
  if (stub.mode !== 'read_only_preflight') fail(`adapter_stub_mode_mismatch:${stubId}`)
  if (stub.requiredBeforeRouteMount !== true) {
    fail(`adapter_stub_required_before_route_mount_not_true:${stubId}`)
  }
  if (stub.mutationPerformed !== false) fail(`adapter_stub_mutation_not_false:${stubId}`)
  if (stub.runtimeExecutionPerformed !== false) {
    fail(`adapter_stub_runtime_execution_not_false:${stubId}`)
  }
  if (!/^backend:\/\/ai-graphics\/external-beta\//.test(stub.adapterRef ?? '')) {
    fail(`adapter_stub_ref_not_backend_scoped:${stubId}`)
  }
}

for (const required of [
  'existing_snapshot_ref_required_no_mutation',
  'existing_reservation_ref_required_no_mutation',
  'private_manifest_ref_required_no_signed_url',
  'authorization_preflight_only_no_live_write',
  'authorization_preflight_only_no_enqueue',
  'on_demand_only_no_start_now',
]) {
  if (!JSON.stringify(docs.backendAdapterPreflight ?? {}).includes(required)) {
    fail(`missing_preflight_mode:${required}`)
  }
}

for (const required of [
  'external-beta-api-route-backend-adapter-contract.json',
  'external-beta-api-route-handler-contract.json',
  'external-beta-api-route-mount-implementation-qa.json',
  'approved-plan-snapshot-policy.md',
  'pricing-and-credits.md',
  'dependency-readiness-policy.md',
  'async-checkback-policy.md',
  'editing-asset-manifest.md',
]) {
  if (!JSON.stringify(docs.sourceEvidence ?? {}).includes(required) && !docsMd.includes(required)) {
    fail(`missing_source_evidence:${required}`)
  }
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(JSON.stringify(docs)) || pattern.test(docsMd)) {
    fail(`forbidden_claim:${pattern}`)
  }
}

for (const required of [
  'AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_DECISION',
  'evaluateAiGraphicsExternalBetaApiRouteBackendAdapter',
  'buildAiGraphicsExternalBetaApiRouteBackendAdapterInput',
  'read_only_preflight',
  'backendQueueSubmissionApprovedNow: false',
  'workerEnqueueApprovedNow: false',
  'toolExecutionApprovedNow: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(required)) fail(`source_missing:${required}`)
}

for (const required of [
  '--backend-adapter-contract-packet',
  '--api-route-handler-contract-packet',
  'evaluateAiGraphicsExternalBetaApiRouteBackendAdapter',
  'toolExecutionPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(required)) fail(`cli_missing:${required}`)
}

if (!index.includes("export * from './ai-graphics-external-beta-api-route-backend-adapter'")) {
  fail('missing_index_export')
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

if (!scorecard.includes(decision) ||
    !scorecard.toLowerCase().includes('backend adapter preflight')) {
  fail('scorecard_missing_backend_adapter_preflight_status')
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
    'server/cli/ai-graphics-external-beta-api-route-backend-adapter.ts',
    '--backend-adapter-contract-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.json',
    '--api-route-handler-contract-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json',
  ].join(' ')))
} catch (error) {
  fail(`cli_execution_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
if (cliReport.booleans?.backendAdapterPreflightReadyWithProvidedEvidence !== true) {
  fail('cli_preflight_ready_not_true')
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
const unexpectedPackageAdditions = packageDiff
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .filter((line) => !line.includes(runScriptName))
  .filter((line) => !line.includes(diagnosticScriptName))
  .filter((line) => !line.includes('ai-graphics:external-beta-tool-call-handler-bridge'))
  .filter((line) => !line.includes('ai-graphics:external-beta-route-to-queue-authorization-bridge'))
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
  adapterStubs: requiredStubIds.length,
  packageLockUnchanged: true,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
