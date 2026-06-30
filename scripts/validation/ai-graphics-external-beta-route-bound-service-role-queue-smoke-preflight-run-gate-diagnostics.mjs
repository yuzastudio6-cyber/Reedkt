import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_route_bound_service_role_queue_smoke_preflight_run_gate_prepared_with_runtime_blocks'
const acceptedStatus =
  'route_bound_service_role_queue_smoke_preflight_run_gate_ready_execution_still_blocked'
const sourceRouteBoundDecision =
  'ai_graphics_external_beta_route_bound_service_role_queue_smoke_authorization_bridge_prepared_with_runtime_blocks'
const sourcePreflightDecision =
  'ai_graphics_external_beta_service_role_queue_smoke_preflight_prepared_with_environment_blocks'
const runScriptName =
  'ai-graphics:external-beta-route-bound-service-role-queue-smoke-preflight-run-gate'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-route-bound-service-role-queue-smoke-preflight-run-gate:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate-diagnostics.mjs'

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.ts',
  'server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.ts',
  'scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.md',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-authorization-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-to-live-enqueue-authorization-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
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
  'externalBetaRouteBoundServiceRoleQueueSmokePreflightRunGatePrepared',
  'sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeAccepted',
  'sourceServiceRoleQueueSmokePreflightAccepted',
  'routeBoundServiceRoleQueueSmokePreflightRunGateReadyWithProvidedEvidence',
  'routeBoundServiceRoleQueueSmokePreflightRunGateCandidatesAccepted',
  'routeBoundOperatorRefsAccepted',
  'cpuStaticRouteBoundServiceRoleQueueSmokeRunGateAccepted',
  'gpuModelRouteBoundServiceRoleQueueSmokeRunGateAccepted',
  'privateRouteBoundServiceRoleQueueSmokeRunGateOnly',
  'queueJobPreparedNotSubmittedOnly',
  'serviceRoleCredentialsServerOnly',
  'nonProductionEnvironmentRequired',
  'explicitSmokeConfirmationRequired',
  'cleanupRequired',
  'rollbackRequired',
  'telemetryRequired',
  'costCeilingRequired',
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
  'expressRouteMountedInAppNow',
  'apiRouteExecutionApprovedNow',
  'apiRouteExecutionPerformed',
  'routeExecutionApprovedNow',
  'routeBoundServiceRoleQueueSmokeRunApprovedNow',
  'serviceRoleQueueSmokeApprovedNow',
  'liveServiceRoleQueueSmokeExecutedNow',
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
  'serviceRoleQueueSmokePerformed',
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

const requiredSourceEvidence = [
  'routeBoundServiceRoleQueueSmokeAuthorizationBridge',
  'serviceRoleQueueSmokePreflight',
  'routeToLiveEnqueueAuthorizationBridge',
  'serviceRoleQueueSmokeAuthorization',
  'serviceRoleQueueSmokeReadiness',
  'liveEnqueueAuthorization',
]

const requiredRunGateRefs = [
  'routeBoundServiceRoleQueueSmokeRunGateRef',
  'routeBoundServiceRoleQueueSmokeOperatorRef',
  'routeBoundServiceRoleQueueSmokeReadinessRef',
  'routeBoundServiceRoleQueueSmokePreflightRef',
  'routeBoundServiceRoleQueueSmokeEnvironmentRef',
  'routeBoundServiceRoleQueueSmokeRouteExecutionWindowRef',
  'routeBoundServiceRoleQueueSmokeQueueWriteWindowRef',
  'routeBoundServiceRoleQueueSmokeCleanupPlanRef',
  'routeBoundServiceRoleQueueSmokeRollbackPlanRef',
  'routeBoundServiceRoleQueueSmokeTelemetryRef',
  'routeBoundServiceRoleQueueSmokeCostCeilingRef',
]

const requiredPolicyKeys = [
  'privateRouteBoundServiceRoleQueueSmokePreflightRunGateOnly',
  'sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeRequired',
  'sourceServiceRoleQueueSmokePreflightRequired',
  'explicitOperatorConfirmationRequired',
  'nonProductionEnvironmentRequired',
  'serverOnlyServiceRoleCredentialsRequired',
  'routeExecutionWindowRequired',
  'queueWriteWindowRequired',
  'cleanupPlanRequired',
  'rollbackPlanRequired',
  'telemetryRequired',
  'costCeilingRequired',
  'queueJobPreparedNotSubmittedOnly',
  'noApiRouteExecution',
  'noServiceRoleQueueSmoke',
  'noBackendQueueSubmission',
  'noServiceRoleTransaction',
  'noLiveQueueWrite',
  'noWorkerEnqueue',
  'noWorkerDispatch',
  'noToolExecution',
  'onDemandGpuOnly',
  'noIdleGpuRuntimeApproved',
]

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /apiRouteMountedNow["`:\s=]+true/i,
  /apiRouteExecutionApprovedNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /routeBoundServiceRoleQueueSmokeRunApprovedNow["`:\s=]+true/i,
  /serviceRoleQueueSmokeApprovedNow["`:\s=]+true/i,
  /liveServiceRoleQueueSmokeExecutedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /serviceRoleQueueTransactionApprovedNow["`:\s=]+true/i,
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
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /serviceRoleQueueSmokePerformed["`:\s=]+true/i,
  /serviceRoleTransactionPerformed["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const changedGeneratedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const allowedPackageDiffLines = [
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-runbook-authorization": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-runbook-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization-diagnostics.mjs",',
]

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
  return direct ?? packet?.counts?.[key] ?? packet?.expectedCounts?.[key] ?? packet?.scope?.[key]
}

function checkBooleans(packet, label) {
  for (const key of trueKeys) {
    if (packet.booleans?.[key] !== true) fail(`${label}:boolean_not_true:${key}`)
  }
  for (const key of falseKeys) {
    if (packet.booleans?.[key] !== false) fail(`${label}:boolean_not_false:${key}`)
  }
}

function checkToolsAndCapabilities(packet, label) {
  for (const tool of tools) {
    if (!packet.tools?.includes(tool)) fail(`${label}:missing_tool:${tool}`)
  }
  for (const capability of capabilities) {
    if (!packet.capabilities?.includes(capability)) fail(`${label}:missing_capability:${capability}`)
  }
}

function checkCounts(packet, label) {
  const expected = {
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    routeBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence: 21,
    sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeReadyToolsWithProvidedEvidence: 21,
    sourceServiceRoleQueueSmokePreflightReadyToolsWithProvidedEvidence: 21,
    routeBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence: 2,
    cpuStaticRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence: 1,
    gpuModelRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence: 1,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    routeBoundServiceRoleQueueSmokeRunApprovedNowTools: 0,
    serviceRoleQueueSmokeApprovedNowTools: 0,
    serviceRoleQueueSmokesPerformedNowTools: 0,
    backendQueueSubmissionApprovedNowTools: 0,
    serviceRoleQueueTransactionApprovedNowTools: 0,
    liveQueueWriteApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
  for (const [key, value] of Object.entries(expected)) {
    if (countFrom(packet, key) !== value) fail(`${label}:bad_count:${key}`)
  }
}

function checkCandidates(packet, label) {
  const candidates = packet.routeBoundServiceRoleQueueSmokePreflightRunGateCandidates ?? []
  if (candidates.length !== 2) fail(`${label}:expected_two_candidates`)
  const d3 = candidates.find((candidate) => candidate.toolId === 'd3')
  const sam2 = candidates.find((candidate) => candidate.toolId === 'sam2')
  if (!d3) fail(`${label}:missing_d3_candidate`)
  if (!sam2) fail(`${label}:missing_sam2_candidate`)
  const expected = [
    [d3, 'd3', 'chart_overlay', 'node_cpu_static', 'render_worker', false],
    [sam2, 'sam2', 'subject_segmentation', 'native_linux_amd64_nvidia_l4_sam2_runtime', 'gpu_ai_worker', true],
  ]
  for (const [candidate, toolId, capabilityId, runtimeTarget, workerType, gpuAllowed] of expected) {
    if (!candidate) continue
    if (candidate.gateId !== `route-bound-service-role-queue-smoke-preflight-run-gate-${toolId}`) {
      fail(`${label}:bad_gate_id:${toolId}`)
    }
    if (candidate.sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeId !==
      `route-bound-service-role-queue-smoke-authorization-${toolId}`) {
      fail(`${label}:bad_source_bridge_id:${toolId}`)
    }
    if (candidate.capabilityId !== capabilityId) fail(`${label}:bad_capability:${toolId}`)
    if (candidate.runtimeTarget !== runtimeTarget) fail(`${label}:bad_runtime_target:${toolId}`)
    if (candidate.workerType !== workerType) fail(`${label}:bad_worker_type:${toolId}`)
    if (candidate.queueJobStatus !== 'prepared_not_submitted') fail(`${label}:bad_queue_status:${toolId}`)
    if (candidate.runGateMode !==
      'route_bound_service_role_queue_smoke_preflight_ready_execution_still_blocked') {
      fail(`${label}:bad_mode:${toolId}`)
    }
    if (candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== gpuAllowed) {
      fail(`${label}:bad_gpu_allowed:${toolId}`)
    }
    for (const key of [
      'gpuRuntimeShouldStartNow',
      'apiRouteMountedNow',
      'apiRouteExecutionApprovedNow',
      'routeExecutionPerformed',
      'routeBoundServiceRoleQueueSmokeRunApprovedNow',
      'serviceRoleQueueSmokeApprovedNow',
      'serviceRoleQueueSmokePerformed',
      'backendQueueSubmissionApprovedNow',
      'backendQueueSubmissionPerformed',
      'serviceRoleQueueTransactionApprovedNow',
      'serviceRoleTransactionPerformed',
      'liveQueueWriteApprovedNow',
      'liveQueueWritePerformed',
      'workerEnqueueApprovedNow',
      'workerEnqueuePerformed',
      'workerLeaseCreated',
      'workerDispatchApprovedNow',
      'workerDispatchPerformed',
      'toolExecutionApprovedNow',
      'toolExecutionPerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) {
      if (candidate[key] !== false) fail(`${label}:candidate_boolean_not_false:${toolId}:${key}`)
    }
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.md')
const sourceRouteBound = json('docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-authorization-bridge.json')
const sourcePreflight = json('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json')
const source = read('server/routes/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.ts')
const cli = read('server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.ts')
const packageJson = json('package.json')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (sourceRouteBound.decision !== sourceRouteBoundDecision) fail('source_route_bound_decision_mismatch')
if (sourceRouteBound.status !== 'route_bound_service_role_queue_smoke_authorization_bridge_ready_runtime_still_blocked') {
  fail('source_route_bound_status_mismatch')
}
if (sourcePreflight.decision !== sourcePreflightDecision) fail('source_preflight_decision_mismatch')
if (countFrom(sourcePreflight, 'payloadPreviewsPrepared') !== 21) {
  fail('source_preflight_not_all_21')
}
if (sourcePreflight.expectedStatuses?.readyStatusWithEnvFlagsAndBridge !==
  'ready_to_execute_non_production_service_role_queue_smoke') {
  fail('source_preflight_ready_status_missing')
}

checkToolsAndCapabilities(docs, 'docs')
checkCounts(docs, 'docs')
checkBooleans(docs, 'docs')
checkCandidates(docs, 'docs')

for (const key of requiredSourceEvidence) {
  const evidencePath = docs.sourceEvidence?.[key]
  if (typeof evidencePath !== 'string') {
    fail(`missing_source_evidence:${key}`)
  } else if (!fs.existsSync(path.join(process.cwd(), evidencePath))) {
    fail(`missing_source_evidence_file:${key}:${evidencePath}`)
  }
}

for (const key of requiredRunGateRefs) {
  const value = docs.requiredRunGateRefs?.[key]
  if (typeof value !== 'string' || !value.startsWith('route-bound-smoke://')) {
    fail(`missing_run_gate_ref:${key}`)
  }
}

for (const key of requiredPolicyKeys) {
  if (docs.routeBoundServiceRoleQueueSmokePreflightRunGatePolicy?.[key] !== true) {
    fail(`policy_key_not_true:${key}`)
  }
}

for (const tool of tools) {
  if (!docsMd.includes(tool)) fail(`md_missing_tool:${tool}`)
}
for (const capability of ['chart_overlay', 'subject_segmentation']) {
  if (!docsMd.includes(capability)) fail(`md_missing_capability:${capability}`)
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(JSON.stringify(docs)) || pattern.test(docsMd)) {
    fail(`forbidden_claim:${pattern}`)
  }
}

for (const snippet of [
  decision,
  'AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_BRIDGE_DECISION',
  'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION',
  'route-bound-service-role-queue-smoke-preflight-run-gate-${toolId}',
  'route_bound_service_role_queue_smoke_preflight_ready_execution_still_blocked',
  'serviceRoleQueueSmokePerformed: false',
  'liveQueueWritePerformed: false',
  'workerDispatchPerformed: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(snippet)) fail(`source_missing_snippet:${snippet}`)
}

for (const flag of [
  '--route-bound-service-role-queue-smoke-authorization-bridge-packet',
  '--service-role-queue-smoke-preflight-packet',
  '--route-bound-service-role-queue-smoke-run-gate-ref',
  '--route-bound-service-role-queue-smoke-operator-ref',
  '--route-bound-service-role-queue-smoke-queue-write-window-ref',
]) {
  if (!cli.includes(flag)) fail(`cli_missing_flag:${flag}`)
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

if (!scorecard.includes('AI Graphics External-Beta Route-Bound Service-Role Queue Smoke Preflight Run Gate')) {
  fail('scorecard_missing_section')
}
if (!scorecard.includes(decision)) fail('scorecard_missing_decision')

let cliReport = {}
try {
  cliReport = JSON.parse(exec(
    'npx tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.ts --route-bound-service-role-queue-smoke-authorization-bridge-packet docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-authorization-bridge.json --service-role-queue-smoke-preflight-packet docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json --route-bound-service-role-queue-smoke-run-gate-ref route-bound-smoke://run-gate/2026-06-30/private-non-production --route-bound-service-role-queue-smoke-operator-ref route-bound-smoke://operator/explicit-approval-required --route-bound-service-role-queue-smoke-readiness-ref route-bound-smoke://readiness/pr-862 --route-bound-service-role-queue-smoke-preflight-ref route-bound-smoke://preflight/service-role-queue-smoke --route-bound-service-role-queue-smoke-environment-ref route-bound-smoke://environment/non-production-only --route-bound-service-role-queue-smoke-route-execution-window-ref route-bound-smoke://window/route-execution-controlled --route-bound-service-role-queue-smoke-queue-write-window-ref route-bound-smoke://window/queue-write-controlled --route-bound-service-role-queue-smoke-cleanup-plan-ref route-bound-smoke://cleanup/required --route-bound-service-role-queue-smoke-rollback-plan-ref route-bound-smoke://rollback/required --route-bound-service-role-queue-smoke-telemetry-ref route-bound-smoke://telemetry/required --route-bound-service-role-queue-smoke-cost-ceiling-ref route-bound-smoke://cost-ceiling/required',
  ))
} catch (error) {
  fail(`cli_execution_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
if (Array.isArray(cliReport.rejectionReasons) && cliReport.rejectionReasons.length > 0) {
  fail(`cli_rejection_reasons:${cliReport.rejectionReasons.join('|')}`)
}
checkCounts(cliReport, 'cli')
checkBooleans(cliReport, 'cli')
checkCandidates(cliReport, 'cli')
for (const key of requiredRunGateRefs) {
  if (cliReport.requiredRunGateRefs?.[key] !== true) fail(`cli_missing_ref:${key}`)
}
if (cliReport.input?.routeExecutionPerformed !== false) fail('cli_input_route_execution_not_false')
if (cliReport.input?.serviceRoleQueueSmokePerformed !== false) fail('cli_input_smoke_not_false')
if (cliReport.input?.gpuRuntimePerformed !== false) fail('cli_input_gpu_not_false')

const packageDiff = exec('git diff -- package.json')
const packageDiffLines = packageDiff
  .split('\n')
  .filter((line) => line.startsWith('+    "ai-graphics:') || line.startsWith('-    "ai-graphics:'))
for (const line of packageDiffLines) {
  if (!allowedPackageDiffLines.includes(line)) fail(`unexpected_package_script_diff:${line}`)
}

try {
  const lockDiff = exec('git diff --name-only -- package-lock.json').trim()
  if (lockDiff) fail('package_lock_changed')
} catch (error) {
  fail(`package_lock_check_failed:${error.message}`)
}

const changedFiles = exec('git diff --name-only HEAD').split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (changedGeneratedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
}
const stagedLocalArtifacts = exec('git diff --cached --name-only').split('\n').filter(Boolean)
for (const file of stagedLocalArtifacts) {
  if (file.includes('.local-artifacts')) fail(`local_artifact_staged:${file}`)
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  tools: tools.length,
  capabilities: capabilities.length,
  candidates: docs.routeBoundServiceRoleQueueSmokePreflightRunGateCandidates.length,
  gpuRuntimeShouldStartNow: false,
  liveQueueWritePerformed: false,
  serviceRoleQueueSmokePerformed: false,
  workerDispatchPerformed: false,
  toolExecutionPerformed: false,
  packageLockUnchanged: true,
}, null, 2))
