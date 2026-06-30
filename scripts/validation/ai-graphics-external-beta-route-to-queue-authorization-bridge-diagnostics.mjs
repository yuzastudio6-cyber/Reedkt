import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_route_to_queue_authorization_bridge_prepared_with_runtime_blocks'
const acceptedStatus =
  'route_to_queue_authorization_bridge_ready_runtime_still_blocked'
const sourceHandlerDecision =
  'ai_graphics_external_beta_tool_call_handler_bridge_prepared_with_runtime_blocks'
const sourceHandlerStatus = 'disabled_handler_bridge_ready_runtime_still_blocked'
const sourceQueueDecision =
  'ai_graphics_external_beta_backend_queue_submission_envelope_prepared_with_runtime_blocks'
const sourceQueueStatus =
  'prepared_external_beta_backend_queue_submission_envelope_runtime_blocked'
const runScriptName =
  'ai-graphics:external-beta-route-to-queue-authorization-bridge'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-route-to-queue-authorization-bridge.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-route-to-queue-authorization-bridge:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-route-to-queue-authorization-bridge-diagnostics.mjs'

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-route-to-queue-authorization-bridge.ts',
  'server/cli/ai-graphics-external-beta-route-to-queue-authorization-bridge.ts',
  'scripts/validation/ai-graphics-external-beta-route-to-queue-authorization-bridge-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.md',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-handler-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json',
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
  'externalBetaRouteToQueueAuthorizationBridgePrepared',
  'sourceHandlerBridgeAccepted',
  'sourceBackendQueueSubmissionAccepted',
  'routeToQueueAuthorizationCandidatesAccepted',
  'routeToQueueAuthorizationBridgeReadyWithProvidedEvidence',
  'cpuStaticRouteToQueueAuthorizationAccepted',
  'gpuModelRouteToQueueAuthorizationAccepted',
  'privateRouteToQueueAuthorizationBridgeOnly',
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
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /routeToQueueAuthorizationApprovedNow["`:\s=]+true/i,
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

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.md')
const sourceHandler = json('docs/tool-intelligence/ai-graphics/external-beta-tool-call-handler-bridge.json')
const sourceQueue = json('docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json')
const source = read('server/routes/ai-graphics-external-beta-route-to-queue-authorization-bridge.ts')
const cli = read('server/cli/ai-graphics-external-beta-route-to-queue-authorization-bridge.ts')
const packageJson = json('package.json')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('decision_mismatch')
if (docs.status !== acceptedStatus) fail('status_mismatch')
if (sourceHandler.decision !== sourceHandlerDecision) fail('source_handler_decision_mismatch')
if (sourceHandler.status !== sourceHandlerStatus) fail('source_handler_status_mismatch')
if (sourceQueue.decision !== sourceQueueDecision) fail('source_queue_decision_mismatch')
if (sourceQueue.status !== sourceQueueStatus) fail('source_queue_status_mismatch')
if (countFrom(sourceQueue, 'liveBackendQueueSubmissionsNow') !== 0) {
  fail('source_queue_live_submissions_not_zero')
}
if (sourceQueue.booleans?.backendQueueSubmissionPerformed !== false) {
  fail('source_queue_submission_performed_not_false')
}
if (countFrom(docs, 'totalAiGraphicsTools') !== 21) fail('total_tools_mismatch')
if (countFrom(docs, 'totalProductFacingCapabilities') !== 12) fail('total_capabilities_mismatch')
if (countFrom(docs, 'gpuRuntimeTargetedTools') !== 8) fail('gpu_tools_mismatch')
if (countFrom(docs, 'routeToQueueAuthorizationBridgeReadyToolsWithProvidedEvidence') !== 21) {
  fail('bridge_ready_count_mismatch')
}
if (countFrom(docs, 'sourceHandlerBridgeReadyToolsWithProvidedEvidence') !== 21) {
  fail('source_handler_ready_count_mismatch')
}
if (countFrom(docs, 'sourceBackendQueueSubmissionReadyExamplesWithProvidedEvidence') !== 3) {
  fail('source_queue_examples_count_mismatch')
}
if (countFrom(docs, 'routeToQueueAuthorizationCandidatesWithProvidedEvidence') !== 2) {
  fail('candidate_count_mismatch')
}
if (countFrom(docs, 'cpuStaticRouteToQueueAuthorizationCandidatesWithProvidedEvidence') !== 1) {
  fail('cpu_static_candidate_count_mismatch')
}
if (countFrom(docs, 'gpuModelRouteToQueueAuthorizationCandidatesWithProvidedEvidence') !== 1) {
  fail('gpu_model_candidate_count_mismatch')
}
for (const zeroKey of [
  'apiRouteMountedNowTools',
  'routeExecutionsApprovedNow',
  'routeToQueueAuthorizationsApprovedNow',
  'backendQueueSubmissionApprovedNowTools',
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

const candidates = docs.routeToQueueAuthorizationCandidates ?? []
if (candidates.length !== 2) fail('candidate_length_mismatch')
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
  for (const key of [
    'apiRouteMountedNow',
    'apiRouteExecutionApprovedNow',
    'routeExecutionPerformed',
    'routeToQueueAuthorizationApprovedNow',
    'backendQueueSubmissionApprovedNow',
    'backendQueueSubmissionPerformed',
    'liveQueueWriteApprovedNow',
    'liveQueueWritePerformed',
    'workerEnqueueApprovedNow',
    'workerEnqueuePerformed',
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
  'external-beta-tool-call-handler-bridge.json',
  'external-beta-backend-queue-submission.json',
  'external-beta-worker-enqueue-adapter.json',
  'external-beta-runtime-admission.json',
]) {
  if (!JSON.stringify(docs.sourceEvidence ?? {}).includes(required) && !docsMd.includes(required)) {
    fail(`missing_source_evidence:${required}`)
  }
}

for (const required of [
  'privateRouteToQueueAuthorizationBridgeOnly',
  'sourceHandlerBridgeRequired',
  'sourceBackendQueueSubmissionRequired',
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
  if (!JSON.stringify(docs.routeToQueueAuthorizationPolicy ?? {}).includes(required) && !source.includes(required)) {
    fail(`missing_bridge_policy:${required}`)
  }
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(JSON.stringify(docs)) || pattern.test(docsMd)) {
    fail(`forbidden_claim:${pattern}`)
  }
}

for (const required of [
  'AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_QUEUE_AUTHORIZATION_BRIDGE_DECISION',
  'evaluateAiGraphicsExternalBetaRouteToQueueAuthorizationBridge',
  'buildAiGraphicsExternalBetaRouteToQueueAuthorizationBridgeInput',
  'route-to-queue-authorization-d3',
  'route-to-queue-authorization-sam2',
  'queueJobStatus',
  'prepared_not_submitted',
  'backendQueueSubmissionPerformed: false',
  'liveQueueWritePerformed: false',
  'workerEnqueuePerformed: false',
  'toolExecutionPerformed: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(required)) fail(`source_missing:${required}`)
}

for (const required of [
  '--handler-bridge-packet',
  '--backend-queue-submission-packet',
  'evaluateAiGraphicsExternalBetaRouteToQueueAuthorizationBridge',
  'sourceHandlerBridgePacketRead',
  'sourceBackendQueueSubmissionPacketRead',
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
    !scorecard.toLowerCase().includes('route-to-queue authorization bridge')) {
  fail('scorecard_missing_route_to_queue_authorization_bridge_status')
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
    'server/cli/ai-graphics-external-beta-route-to-queue-authorization-bridge.ts',
    '--handler-bridge-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-tool-call-handler-bridge.json',
    '--backend-queue-submission-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json',
  ].join(' ')))
} catch (error) {
  fail(`cli_execution_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
if (cliReport.booleans?.routeToQueueAuthorizationBridgeReadyWithProvidedEvidence !== true) {
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
  routeToQueueAuthorizationCandidatesWithProvidedEvidence: 2,
  cpuStaticRouteToQueueAuthorizationCandidatesWithProvidedEvidence: 1,
  gpuModelRouteToQueueAuthorizationCandidatesWithProvidedEvidence: 1,
  liveQueueWritePerformed: false,
  packageLockUnchanged: true,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
