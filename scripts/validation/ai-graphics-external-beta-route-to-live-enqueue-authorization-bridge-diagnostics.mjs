import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_route_to_live_enqueue_authorization_bridge_prepared_with_runtime_blocks'
const acceptedStatus =
  'route_to_live_enqueue_authorization_bridge_ready_runtime_still_blocked'
const sourceRouteDecision =
  'ai_graphics_external_beta_route_to_queue_authorization_bridge_prepared_with_runtime_blocks'
const sourceRouteStatus =
  'route_to_queue_authorization_bridge_ready_runtime_still_blocked'
const sourceLiveDecision =
  'ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-beta-route-to-live-enqueue-authorization-bridge'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-route-to-live-enqueue-authorization-bridge:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge-diagnostics.mjs'

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts',
  'server/cli/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts',
  'scripts/validation/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-route-to-live-enqueue-authorization-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-to-live-enqueue-authorization-bridge.md',
  'docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json',
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
  'externalBetaRouteToLiveEnqueueAuthorizationBridgePrepared',
  'sourceRouteToQueueAuthorizationBridgeAccepted',
  'sourceLiveEnqueueAuthorizationAccepted',
  'routeToLiveEnqueueAuthorizationCandidatesAccepted',
  'routeToLiveEnqueueAuthorizationBridgeReadyWithProvidedEvidence',
  'cpuStaticRouteToLiveEnqueueAuthorizationAccepted',
  'gpuModelRouteToLiveEnqueueAuthorizationAccepted',
  'privateRouteToLiveEnqueueAuthorizationBridgeOnly',
  'queueJobPreparedNotSubmittedOnly',
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
  'routeToQueueAuthorizationApprovedNow',
  'routeToLiveEnqueueAuthorizationApprovedNow',
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
  'serviceRoleQueueSmokePerformed',
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
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /routeToQueueAuthorizationApprovedNow["`:\s=]+true/i,
  /routeToLiveEnqueueAuthorizationApprovedNow["`:\s=]+true/i,
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
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
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
  return direct ?? packet?.counts?.[key] ?? packet?.scope?.[key]
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

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-route-to-live-enqueue-authorization-bridge.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-route-to-live-enqueue-authorization-bridge.md')
const sourceRoute = json('docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json')
const sourceLive = json('docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json')
const source = read('server/routes/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts')
const cli = read('server/cli/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts')
const packageJson = json('package.json')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('decision_mismatch')
if (docs.status !== acceptedStatus) fail('status_mismatch')
if (sourceRoute.decision !== sourceRouteDecision) fail('source_route_decision_mismatch')
if (sourceRoute.status !== sourceRouteStatus) fail('source_route_status_mismatch')
if (sourceLive.decision !== sourceLiveDecision) fail('source_live_decision_mismatch')
if (countFrom(sourceRoute, 'routeToQueueAuthorizationCandidatesWithProvidedEvidence') !== 21) {
  fail('source_route_candidate_count_mismatch')
}
if (countFrom(sourceLive, 'liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence') !== 21) {
  fail('source_live_recorded_count_mismatch')
}
if (sourceLive.booleans?.liveQueueWriteApprovedNow !== false ||
    sourceLive.booleans?.workerDispatchApprovedNow !== false ||
    sourceLive.booleans?.toolExecutionApprovedNow !== false ||
    sourceLive.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('source_live_runtime_flags_not_false')
}

if (countFrom(docs, 'totalAiGraphicsTools') !== 21) fail('total_tools_mismatch')
if (countFrom(docs, 'totalProductFacingCapabilities') !== 12) fail('total_capabilities_mismatch')
if (countFrom(docs, 'gpuRuntimeTargetedTools') !== 8) fail('gpu_tools_mismatch')
if (countFrom(docs, 'routeToLiveEnqueueAuthorizationBridgeReadyToolsWithProvidedEvidence') !== 21) {
  fail('bridge_ready_count_mismatch')
}
if (countFrom(docs, 'sourceRouteToQueueAuthorizationBridgeReadyToolsWithProvidedEvidence') !== 21) {
  fail('source_route_ready_count_mismatch')
}
if (countFrom(docs, 'sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence') !== 21) {
  fail('source_live_ready_count_mismatch')
}
if (countFrom(docs, 'routeToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence') !== 21) {
  fail('candidate_count_mismatch')
}
if (countFrom(docs, 'cpuStaticRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence') !== 13) {
  fail('cpu_static_candidate_count_mismatch')
}
if (countFrom(docs, 'gpuModelRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence') !== 8) {
  fail('gpu_model_candidate_count_mismatch')
}
for (const zeroKey of [
  'apiRouteMountedNowTools',
  'routeExecutionsApprovedNow',
  'routeToQueueAuthorizationsApprovedNow',
  'routeToLiveEnqueueAuthorizationsApprovedNow',
  'backendQueueSubmissionApprovedNowTools',
  'liveQueueWriteApprovedNowTools',
  'liveQueueWritesPerformedNowTools',
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

const candidates = docs.routeToLiveEnqueueAuthorizationCandidates ?? []
if (candidates.length !== tools.length) fail('candidate_length_mismatch')
const candidateToolIds = candidates.map((item) => item.toolId).sort()
if (JSON.stringify(candidateToolIds) !== JSON.stringify([...tools].sort())) {
  fail('candidate_tool_coverage_mismatch')
}
const gpuCandidates = candidates.filter(
  (item) => item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
)
const cpuStaticCandidates = candidates.filter(
  (item) => item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === false,
)
if (gpuCandidates.length !== 8) fail(`gpu_candidate_count_unexpected:${gpuCandidates.length}`)
if (cpuStaticCandidates.length !== 13) {
  fail(`cpu_static_candidate_count_unexpected:${cpuStaticCandidates.length}`)
}
const d3Candidate = candidates.find((item) => item.toolId === 'd3')
const sam2Candidate = candidates.find((item) => item.toolId === 'sam2')
if (!d3Candidate) fail('missing_d3_candidate')
if (!sam2Candidate) fail('missing_sam2_candidate')
if (d3Candidate) {
  if (d3Candidate.capabilityId !== 'chart_overlay') fail('d3_capability_mismatch')
  if (d3Candidate.runtimeTarget !== 'node_cpu_static') fail('d3_runtime_target_mismatch')
  if (d3Candidate.workerType !== 'render_worker') fail('d3_worker_type_mismatch')
  if (d3Candidate.queueJobStatus !== 'prepared_not_submitted') fail('d3_queue_status_mismatch')
  if (d3Candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
    fail('d3_gpu_start_allowed_not_false')
  }
}
if (sam2Candidate) {
  if (sam2Candidate.capabilityId !== 'subject_segmentation') fail('sam2_capability_mismatch')
  if (sam2Candidate.runtimeTarget !== 'native_linux_amd64_nvidia_l4_sam2_runtime') {
    fail('sam2_runtime_target_mismatch')
  }
  if (sam2Candidate.workerType !== 'gpu_ai_worker') fail('sam2_worker_type_mismatch')
  if (sam2Candidate.queueJobStatus !== 'prepared_not_submitted') fail('sam2_queue_status_mismatch')
  if (sam2Candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
    fail('sam2_gpu_start_allowed_not_true')
  }
}

for (const candidate of candidates) {
  const sourceRouteCandidate = sourceRoute.routeToQueueAuthorizationCandidates?.find(
    (item) => item.toolId === candidate.toolId,
  )
  if (!sourceRouteCandidate) fail(`candidate_missing_source_route:${candidate.toolId}`)
  if (sourceRouteCandidate && candidate.authorizationId !== sourceRouteCandidate.authorizationId) {
    fail(`candidate_authorization_mismatch:${candidate.toolId}`)
  }
  if (sourceRouteCandidate && candidate.capabilityId !== sourceRouteCandidate.capabilityId) {
    fail(`candidate_capability_mismatch:${candidate.toolId}`)
  }
  if (sourceRouteCandidate && candidate.runtimeTarget !== sourceRouteCandidate.runtimeTarget) {
    fail(`candidate_runtime_target_mismatch:${candidate.toolId}`)
  }
  if (sourceRouteCandidate && candidate.workerType !== sourceRouteCandidate.workerType) {
    fail(`candidate_worker_type_mismatch:${candidate.toolId}`)
  }
  for (const key of [
    'apiRouteMountedNow',
    'apiRouteExecutionApprovedNow',
    'routeExecutionPerformed',
    'routeToQueueAuthorizationApprovedNow',
    'routeToLiveEnqueueAuthorizationApprovedNow',
    'backendQueueSubmissionApprovedNow',
    'backendQueueSubmissionPerformed',
    'liveQueueWriteApprovedNow',
    'liveQueueWritePerformed',
    'workerEnqueueApprovedNow',
    'workerEnqueuePerformed',
    'workerLeaseCreated',
    'workerDispatchPerformed',
    'toolExecutionPerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
    'gpuRuntimeShouldStartNow',
  ]) {
    if (candidate[key] !== false) {
      fail(`candidate_flag_not_false:${candidate.toolId}:${key}`)
    }
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
  'external-beta-route-to-queue-authorization-bridge.json',
  'external-beta-live-enqueue-authorization.json',
  'external-beta-backend-queue-submission.json',
  'external-beta-worker-enqueue-adapter.json',
  'external-beta-runtime-queue-service-bridge.json',
]) {
  if (!JSON.stringify(docs.sourceEvidence ?? {}).includes(required) && !docsMd.includes(required)) {
    fail(`missing_source_evidence:${required}`)
  }
}

for (const required of [
  'privateRouteToLiveEnqueueAuthorizationBridgeOnly',
  'sourceRouteToQueueAuthorizationRequired',
  'sourceLiveEnqueueAuthorizationRequired',
  'queueJobPreparedNotSubmittedOnly',
  'noApiRouteExecution',
  'noBackendQueueSubmission',
  'noLiveQueueWrite',
  'noWorkerEnqueue',
  'noWorkerDispatch',
  'noToolExecution',
  'onDemandGpuOnly',
  'noIdleGpuRuntimeApproved',
]) {
  if (!JSON.stringify(docs.routeToLiveEnqueueAuthorizationPolicy ?? {}).includes(required) && !source.includes(required)) {
    fail(`missing_bridge_policy:${required}`)
  }
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(JSON.stringify(docs)) || pattern.test(docsMd)) {
    fail(`forbidden_claim:${pattern}`)
  }
}

for (const required of [
  'AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_LIVE_ENQUEUE_AUTHORIZATION_BRIDGE_DECISION',
  'evaluateAiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridge',
  'buildAiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeInput',
  'AI_GRAPHICS_CANONICAL_TOOL_IDS',
  'route-to-live-enqueue-authorization-${toolId}',
  'route_authorization_matched_to_live_enqueue_scope_not_enqueued',
  'queueJobStatus',
  'prepared_not_submitted',
  'liveQueueWritePerformed: false',
  'workerEnqueuePerformed: false',
  'toolExecutionPerformed: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(required)) fail(`source_missing:${required}`)
}

for (const required of [
  '--route-to-queue-authorization-bridge-packet',
  '--live-enqueue-authorization-packet',
  'evaluateAiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridge',
  'sourceRouteToQueueAuthorizationBridgePacketRead',
  'sourceLiveEnqueueAuthorizationPacketRead',
  'liveQueueWritePerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(required)) fail(`cli_missing:${required}`)
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

if (!scorecard.includes(decision) ||
    !scorecard.toLowerCase().includes('route-to-live-enqueue authorization bridge')) {
  fail('scorecard_missing_route_to_live_enqueue_authorization_bridge_status')
}
if (/runtimeReadyNow["`:\s=]+true/i.test(scorecard) ||
    /productionReadyNow["`:\s=]+true/i.test(scorecard)) {
  fail('scorecard_claims_runtime_or_production_ready')
}

let cliReport = {}
try {
  cliReport = JSON.parse(exec([
    'npx',
    'tsx',
    'server/cli/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts',
    '--route-to-queue-authorization-bridge-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json',
    '--live-enqueue-authorization-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json',
  ].join(' ')))
} catch (error) {
  fail(`cli_execution_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
if (cliReport.booleans?.routeToLiveEnqueueAuthorizationBridgeReadyWithProvidedEvidence !== true) {
  fail('cli_bridge_ready_not_true')
}
if (cliReport.booleans?.agentCanExecuteToolsNow !== false) {
  fail('cli_agent_execution_not_false')
}
if (cliReport.booleans?.liveQueueWritePerformed !== false) {
  fail('cli_live_queue_write_not_false')
}
if (cliReport.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('cli_gpu_start_not_false')
}
if (cliReport.input?.routeExecutionPerformed !== false ||
    cliReport.input?.backendQueueSubmissionPerformed !== false ||
    cliReport.input?.workerEnqueuePerformed !== false ||
    cliReport.input?.liveQueueWritePerformed !== false ||
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
  '+    "ai-graphics:external-agent-mounted-blocked-route-smoke": "tsx server/cli/ai-graphics-external-agent-mounted-blocked-route-smoke.ts",',
  '+    "ai-graphics:external-agent-mounted-blocked-route-smoke:diagnostics": "node scripts/validation/ai-graphics-external-agent-mounted-blocked-route-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-route-to-queue-blocked-admission": "tsx server/cli/ai-graphics-external-agent-route-to-queue-blocked-admission.ts",',
  '+    "ai-graphics:external-agent-route-to-queue-blocked-admission:diagnostics": "node scripts/validation/ai-graphics-external-agent-route-to-queue-blocked-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-queue-insertion-proof": "tsx server/cli/ai-graphics-external-agent-mock-queue-insertion-proof.ts",',
  '+    "ai-graphics:external-agent-mock-queue-insertion-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-queue-insertion-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-worker-claim-proof": "tsx server/cli/ai-graphics-external-agent-mock-worker-claim-proof.ts",',
  '+    "ai-graphics:external-agent-mock-worker-claim-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-worker-claim-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-agent-mock-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-dispatcher-gate-proof": "tsx server/cli/ai-graphics-external-agent-mock-dispatcher-gate-proof.ts",',
  '+    "ai-graphics:external-agent-mock-dispatcher-gate-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-dispatcher-gate-proof-diagnostics.mjs",',
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
  routeToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence: 21,
  cpuStaticRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence: 13,
  gpuModelRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence: 8,
  liveQueueWritePerformed: false,
  workerEnqueuePerformed: false,
  packageLockUnchanged: true,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
