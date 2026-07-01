import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_route_to_queue_blocked_admission_prepared_with_runtime_blocks'
const acceptedStatus =
  'mounted_route_to_queue_blocked_admission_ready_runtime_still_blocked'
const sourceSmokeDecision =
  'ai_graphics_external_agent_mounted_blocked_route_smoke_passed_with_runtime_blocks'
const sourceRouteDecision =
  'ai_graphics_external_beta_route_to_queue_authorization_bridge_prepared_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-agent-route-to-queue-blocked-admission'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-route-to-queue-blocked-admission.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-route-to-queue-blocked-admission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-route-to-queue-blocked-admission-diagnostics.mjs'

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

const gpuTools = new Set([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-route-to-queue-blocked-admission.ts',
  'scripts/validation/ai-graphics-external-agent-route-to-queue-blocked-admission-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-route-to-queue-blocked-admission.json',
  'docs/tool-intelligence/ai-graphics/external-agent-route-to-queue-blocked-admission.md',
  'docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.md',
  'docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  mountedBlockedRouteSmokeCases: 33,
  flagEnabledToolNotReadyResponses: 33,
  routeToQueueAuthorizationCandidates: 21,
  routeToQueueBlockedAdmissionMappedTools: 21,
  queuePreparedNotSubmittedTools: 21,
  gpuRuntimeTargetedTools: 8,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  gpuRuntimeShouldStartNowTools: 0,
  routeExecutionApprovedNowTools: 0,
  routeToQueueAuthorizationApprovedNowTools: 0,
  backendQueueSubmissionApprovedNowTools: 0,
  liveQueueWriteApprovedNowTools: 0,
  workerEnqueueApprovedNowTools: 0,
  workerDispatchPerformedTools: 0,
  toolExecutionPerformedTools: 0,
  externalAgentExecutableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueKeys = [
  'externalAgentRouteToQueueBlockedAdmissionPrepared',
  'sourceMountedBlockedRouteSmokeAccepted',
  'sourceRouteToQueueAuthorizationBridgeAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'mountedRouteReturnsStructuredToolNotReadyForAll21',
  'routeResponseMappedToQueueAuthorizationForAll21',
  'queueJobPreparedNotSubmittedOnly',
  'requestAcceptedForPlanningMetadataForAll21',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'routeToQueueAuthorizationApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerExecutionApprovedNow',
  'workerEnqueueApprovedNow',
  'workerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'backendQueueSubmissionPerformed',
  'liveQueueWritePerformed',
  'workerEnqueuePerformed',
  'workerDispatchPerformed',
  'toolExecutionPerformed',
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

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /routeToQueueAuthorizationApprovedNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /liveQueueWriteApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
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
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
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

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  if (!fs.existsSync(absolute(file))) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(absolute(file), 'utf8')
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
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 30 * 1024 * 1024,
  })
}

function checkBooleans(label, booleans) {
  for (const key of trueKeys) {
    if (booleans?.[key] !== true) fail(`${label}_boolean_not_true:${key}`)
  }
  for (const key of falseKeys) {
    if (booleans?.[key] !== false) fail(`${label}_boolean_not_false:${key}`)
  }
}

function checkCounts(label, counts) {
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts?.[key] !== value) {
      fail(`${label}_count_mismatch:${key}:expected_${value}:got_${counts?.[key]}`)
    }
  }
}

function checkTools(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_tools_not_array`)
    return
  }
  if (rows.length !== 21) fail(`${label}_tool_count_not_21`)
  for (const toolId of tools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_tool:${toolId}`)
      continue
    }
    if (row.capabilityId === undefined) fail(`${label}_missing_capability:${toolId}`)
    const routeStatusCode = row.routeStatusCode ?? row.statusCode
    const routeErrorCode = row.routeErrorCode ?? row.errorCode
    if (routeStatusCode !== 409) fail(`${label}_route_status_not_409:${toolId}`)
    if (routeErrorCode !== 'TOOL_NOT_READY') {
      fail(`${label}_route_error_not_tool_not_ready:${toolId}`)
    }
    if (row.queueAuthorizationId !== `route-to-queue-authorization-${toolId}`) {
      fail(`${label}_queue_authorization_id_mismatch:${toolId}`)
    }
    if (row.queueJobStatus !== 'prepared_not_submitted') {
      fail(`${label}_queue_status_mismatch:${toolId}`)
    }
    if (row.gpuRuntimeTargetedTool !== gpuTools.has(toolId)) {
      fail(`${label}_gpu_target_mismatch:${toolId}`)
    }
    if (row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== gpuTools.has(toolId)) {
      fail(`${label}_gpu_start_allowed_mismatch:${toolId}`)
    }
    for (const key of [
      'gpuRuntimeShouldStartNow',
      'routeExecutionApprovedNow',
      'routeToQueueAuthorizationApprovedNow',
      'backendQueueSubmissionApprovedNow',
      'liveQueueWriteApprovedNow',
      'workerEnqueueApprovedNow',
      'workerDispatchPerformed',
      'toolExecutionPerformed',
    ]) {
      if (row[key] !== undefined && row[key] !== false) {
        fail(`${label}_${toolId}_${key}_not_false`)
      }
    }
  }
}

function checkCapabilities(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_capabilities_not_array`)
    return
  }
  if (rows.length !== 12) fail(`${label}_capability_count_not_12`)
  for (const capabilityId of capabilities) {
    const row = rows.find((item) => item.capabilityId === capabilityId)
    if (!row) {
      fail(`${label}_missing_capability:${capabilityId}`)
      continue
    }
    const routeStatusCode = row.routeStatusCode ?? row.statusCode
    const routeErrorCode = row.routeErrorCode ?? row.errorCode
    if (routeStatusCode !== 409) fail(`${label}_capability_status_not_409:${capabilityId}`)
    if (routeErrorCode !== 'TOOL_NOT_READY') {
      fail(`${label}_capability_error_not_tool_not_ready:${capabilityId}`)
    }
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-route-to-queue-blocked-admission.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-route-to-queue-blocked-admission.md')
const sourceSmoke = json('docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.json')
const sourceRoute = json('docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json')
const sourceQueue = json('docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json')
const packageJson = json('package.json')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const cliSource = read('server/cli/ai-graphics-external-agent-route-to-queue-blocked-admission.ts')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (sourceSmoke.decision !== sourceSmokeDecision) fail('source_smoke_decision_mismatch')
if (sourceRoute.decision !== sourceRouteDecision) fail('source_route_decision_mismatch')
if (sourceQueue.booleans?.backendQueueSubmissionPerformed !== false) {
  fail('source_queue_submission_performed_not_false')
}

checkCounts('docs', docs.counts)
checkBooleans('docs', docs.booleans)
checkTools('docs', docs.tools)
checkCapabilities('docs', docs.capabilities)

for (const toolId of tools) {
  if (!docsMd.includes(toolId)) fail(`markdown_missing_tool:${toolId}`)
}
for (const capabilityId of capabilities) {
  if (!JSON.stringify(docs.capabilities).includes(capabilityId) && !docsMd.includes(capabilityId)) {
    fail(`missing_capability:${capabilityId}`)
  }
}

for (const required of [
  'external-agent-mounted-blocked-route-smoke.json',
  'external-beta-route-to-queue-authorization-bridge.json',
  'external-beta-backend-queue-submission.json',
  'external-agent-execution-gate.json',
  'prepared_not_submitted',
  '409 TOOL_NOT_READY',
]) {
  if (!JSON.stringify(docs).includes(required) && !docsMd.includes(required)) {
    fail(`missing_reference:${required}`)
  }
}

for (const required of [
  mountedSmokeScriptName(),
  'routeToQueueBridgePath',
  'prepared_not_submitted',
  'gpuRuntimeShouldStartNow: false',
  'backendQueueSubmissionPerformed',
  'liveQueueWritePerformed',
]) {
  if (!cliSource.includes(required)) fail(`cli_missing:${required}`)
}

function mountedSmokeScriptName() {
  return 'ai-graphics:external-agent-mounted-blocked-route-smoke'
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(JSON.stringify(docs)) || pattern.test(docsMd)) {
    fail(`forbidden_claim:${pattern}`)
  }
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

if (!scorecard.includes(decision) ||
    !scorecard.includes('External Agent Route-To-Queue Blocked Admission')) {
  fail('scorecard_missing_blocked_admission_section')
}
if (/runtimeReadyNow["`:\s=]+true/i.test(scorecard) ||
    /productionReadyNow["`:\s=]+true/i.test(scorecard)) {
  fail('scorecard_claims_runtime_or_production_ready')
}

let cliReport = {}
try {
  cliReport = JSON.parse(exec(`npm run --silent ${runScriptName}`))
} catch (error) {
  fail(`cli_execution_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
checkCounts('cli', cliReport.counts)
checkBooleans('cli', cliReport.booleans)
checkTools('cli', cliReport.tools)
checkCapabilities('cli', cliReport.capabilities)

const packageDiff = [
  exec('git diff -- package.json'),
  exec('git diff --cached -- package.json'),
].join('\n')
const allowedPackageAdditions = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-agent-mock-queue-insertion-proof": "tsx server/cli/ai-graphics-external-agent-mock-queue-insertion-proof.ts",',
  '+    "ai-graphics:external-agent-mock-queue-insertion-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-queue-insertion-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-worker-claim-proof": "tsx server/cli/ai-graphics-external-agent-mock-worker-claim-proof.ts",',
  '+    "ai-graphics:external-agent-mock-worker-claim-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-worker-claim-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-agent-mock-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-dispatcher-gate-proof": "tsx server/cli/ai-graphics-external-agent-mock-dispatcher-gate-proof.ts",',
  '+    "ai-graphics:external-agent-mock-dispatcher-gate-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-dispatcher-gate-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-controlled-dispatcher-dry-run-proof": "tsx server/cli/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof.ts",',
  '+    "ai-graphics:external-agent-controlled-dispatcher-dry-run-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-tool-adapter-authorization-proof": "tsx server/cli/ai-graphics-external-agent-tool-adapter-authorization-proof.ts",',
  '+    "ai-graphics:external-agent-tool-adapter-authorization-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-tool-adapter-authorization-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-adapter-smoke": "tsx server/cli/ai-graphics-external-agent-cpu-static-adapter-smoke.ts",',
  '+    "ai-graphics:external-agent-cpu-static-adapter-smoke:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-adapter-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-handoff-admission": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-handoff-admission.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-handoff-admission:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-handoff-admission-diagnostics.mjs",',
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
  routeToQueueBlockedAdmissionMappedTools: 21,
  mountedBlockedRouteSmokeCases: 33,
  queuePreparedNotSubmittedTools: 21,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  gpuRuntimeShouldStartNowTools: 0,
  agentCanExecuteToolsNow: false,
  liveQueueWritePerformed: false,
  workerDispatchPerformed: false,
  toolExecutionPerformed: false,
  packageLockUnchanged: true,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
