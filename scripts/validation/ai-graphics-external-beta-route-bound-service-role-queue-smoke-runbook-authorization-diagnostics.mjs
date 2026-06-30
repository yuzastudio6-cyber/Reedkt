import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_route_bound_service_role_queue_smoke_runbook_authorization_prepared_with_runtime_blocks'
const acceptedStatus =
  'route_bound_service_role_queue_smoke_runbook_authorization_ready_execution_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-route-bound-service-role-queue-smoke-runbook-authorization'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-route-bound-service-role-queue-smoke-runbook-authorization:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization-diagnostics.mjs'

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization.ts',
  'server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization.ts',
  'scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-runbook-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-runbook-authorization.md',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-authorization-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json',
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

const trueKeys = [
  'externalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPrepared',
  'sourceRouteBoundServiceRoleQueueSmokePreflightRunGateAccepted',
  'sourceServiceRoleQueueSmokeHarnessAccepted',
  'routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyWithProvidedEvidence',
  'routeBoundServiceRoleQueueSmokeRunbookToolItemsAccepted',
  'routeBoundRunbookRefsAccepted',
  'privateNonProductionRunbookOnly',
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
  'all21RouteBoundSmokeRunbookItemsPrepared',
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
  'routeBoundServiceRoleQueueSmokePreflightRunGate',
  'serviceRoleQueueSmokeHarness',
  'routeBoundServiceRoleQueueSmokeAuthorizationBridge',
  'serviceRoleQueueSmokeAuthorization',
  'serviceRoleQueueSmokeReadiness',
  'serviceRoleQueueSmokePreflight',
  'runtimeQueueServiceProofBridge',
]

const requiredRunbookRefs = [
  'routeBoundServiceRoleQueueSmokeRunbookRef',
  'routeBoundServiceRoleQueueSmokeOperatorApprovalRef',
  'routeBoundServiceRoleQueueSmokeEnvironmentRef',
  'routeBoundServiceRoleQueueSmokeCredentialHandlingRef',
  'routeBoundServiceRoleQueueSmokeIdempotencyPlanRef',
  'routeBoundServiceRoleQueueSmokeResultStorageRef',
  'routeBoundServiceRoleQueueSmokeEvidenceStorageRef',
  'routeBoundServiceRoleQueueSmokeTelemetryRef',
  'routeBoundServiceRoleQueueSmokeCleanupProofRef',
  'routeBoundServiceRoleQueueSmokeRollbackRef',
  'routeBoundServiceRoleQueueSmokeCostCeilingRef',
  'routeBoundServiceRoleQueueSmokePostRunReviewRef',
]

const requiredPolicyKeys = [
  'privateNonProductionRunbookOnly',
  'sourceRouteBoundRunGateRequired',
  'sourceServiceRoleQueueSmokeHarnessRequired',
  'explicitOperatorApprovalRequired',
  'serverOnlyServiceRoleCredentialsRequired',
  'resultEvidenceMustStayPrivate',
  'cleanupProofRequired',
  'telemetryRequired',
  'rollbackRequired',
  'costCeilingRequired',
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
  for (const tool of gpuTools) {
    if (!packet.gpuRuntimeTargetedTools?.includes(tool)) {
      fail(`${label}:missing_gpu_tool:${tool}`)
    }
  }
  for (const capability of capabilities) {
    if (!packet.capabilities?.includes(capability)) {
      fail(`${label}:missing_capability:${capability}`)
    }
  }
}

function checkCounts(packet, label) {
  const expected = {
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyToolsWithProvidedEvidence: 21,
    sourceRouteBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence: 21,
    sourceServiceRoleQueueSmokeHarnessPreparedToolsWithProvidedEvidence: 21,
    routeBoundServiceRoleQueueSmokeRunbookToolItemsPreparedWithProvidedEvidence: 21,
    routeBoundRepresentativeCandidatesWithProvidedEvidence: 2,
    cpuStaticRouteBoundRepresentativeCandidatesWithProvidedEvidence: 1,
    gpuModelRouteBoundRepresentativeCandidatesWithProvidedEvidence: 1,
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

function checkRunbookPacket(packet, label) {
  if (packet.decision !== decision) fail(`${label}:bad_decision`)
  if (packet.status !== acceptedStatus) fail(`${label}:bad_status`)
  if (packet.interfaces?.runScript !== runScriptName) fail(`${label}:bad_run_script`)
  if (packet.interfaces?.diagnosticScript !== diagnosticScriptName) {
    fail(`${label}:bad_diagnostic_script`)
  }
  for (const key of requiredSourceEvidence) {
    if (!packet.sourceEvidence?.[key]) fail(`${label}:missing_source_evidence:${key}`)
  }
  for (const key of requiredRunbookRefs) {
    if (!packet.requiredRunbookRefs?.[key]) fail(`${label}:missing_runbook_ref:${key}`)
  }
  for (const key of requiredPolicyKeys) {
    if (packet.routeBoundServiceRoleQueueSmokeRunbookPolicy?.[key] !== true) {
      fail(`${label}:policy_not_true:${key}`)
    }
  }
  if (!packet.allowedRunbookActions?.some((item) => item.includes('all-21'))) {
    fail(`${label}:missing_all21_allowed_action`)
  }
  for (const blocked of [
    'API route execution',
    'service-role queue smoke execution now',
    'live queue write',
    'Worker execution',
    'tool execution',
    'GPU/model runtime execution now',
    'idle or always-on GPU runtime',
    'signed URL creation',
    'public artifact creation',
    'production unlock',
  ]) {
    if (!packet.blockedRuntimeActions?.includes(blocked)) {
      fail(`${label}:missing_blocked_action:${blocked}`)
    }
  }
  if (!packet.routeBoundRepresentativeTools?.includes('d3')) fail(`${label}:missing_d3_representative`)
  if (!packet.routeBoundRepresentativeTools?.includes('sam2')) fail(`${label}:missing_sam2_representative`)
  checkToolsAndCapabilities(packet, label)
  checkCounts(packet, label)
  checkBooleans(packet, label)
}

function checkEvaluatorReport(report) {
  if (report.decision !== decision) fail('evaluator:bad_decision')
  if (report.status !== acceptedStatus) fail('evaluator:bad_status')
  if (report.rejectionReasons?.length) {
    fail(`evaluator:unexpected_rejections:${report.rejectionReasons.join('|')}`)
  }
  const items = report.routeBoundServiceRoleQueueSmokeRunbookToolItems ?? []
  if (items.length !== 21) fail('evaluator:expected_21_runbook_items')
  const itemTools = items.map((item) => item.toolId)
  for (const tool of tools) {
    if (!itemTools.includes(tool)) fail(`evaluator:missing_runbook_item:${tool}`)
  }
  const gpuItemCount = items.filter((item) => (
    item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true
  )).length
  if (gpuItemCount !== 8) fail('evaluator:expected_8_gpu_runbook_items')
  for (const item of items) {
    if (item.queueName !== 'ai_graphics_external_beta_tool_runtime') {
      fail(`evaluator:bad_queue_name:${item.toolId}`)
    }
    if (item.queueJobStatus !== 'prepared_not_submitted') {
      fail(`evaluator:bad_queue_status:${item.toolId}`)
    }
    if (item.gpuRuntimeShouldStartNow !== false) {
      fail(`evaluator:gpu_should_start_now:${item.toolId}`)
    }
    for (const key of [
      'routeExecutionApprovedNow',
      'serviceRoleQueueSmokeApprovedNow',
      'serviceRoleQueueSmokePerformed',
      'liveQueueWriteApprovedNow',
      'liveQueueWritePerformed',
      'workerEnqueueApprovedNow',
      'workerEnqueuePerformed',
      'workerDispatchApprovedNow',
      'workerDispatchPerformed',
      'toolExecutionApprovedNow',
      'toolExecutionPerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) {
      if (item[key] !== false) fail(`evaluator:item_boolean_not_false:${item.toolId}:${key}`)
    }
  }
  checkCounts(report, 'evaluator')
  checkBooleans(report, 'evaluator')
}

function checkForbiddenClaims() {
  const files = requiredFiles
    .filter((file) => file.endsWith('.md') || file.endsWith('.json'))
    .concat(['docs/production-beta-readiness-scorecard.md'])
  for (const file of files) {
    const content = read(file)
    for (const pattern of forbiddenDocPatterns) {
      if (pattern.test(content)) fail(`forbidden_claim:${file}:${pattern}`)
    }
  }
}

function checkPackageScripts() {
  const pkg = json('package.json')
  if (pkg.scripts?.[runScriptName] !== runScriptCommand) {
    fail('package_json:missing_run_script')
  }
  if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
    fail('package_json:missing_diagnostic_script')
  }

  const packageDiff = exec('git diff -- package.json')
  const addedLines = packageDiff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  for (const line of addedLines) {
    if (!allowedPackageDiffLines.includes(line)) {
      fail(`package_json:unexpected_added_line:${line}`)
    }
  }
  const dependencyDiff = packageDiff
    .split('\n')
    .some((line) => /"dependencies"|"devDependencies"|"optionalDependencies"|"peerDependencies"/.test(line))
  if (dependencyDiff) fail('package_json:dependency_section_changed')
}

function checkGitHygiene() {
  if (exec('git diff -- package-lock.json').trim()) fail('package_lock_changed')
  const changed = exec('git diff --name-only --cached && git diff --name-only')
    .split('\n')
    .filter(Boolean)
  for (const file of changed) {
    if (changedGeneratedArtifactPattern.test(file)) fail(`generated_or_local_artifact_changed:${file}`)
  }
}

for (const file of requiredFiles) read(file)

const packet = json('docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-runbook-authorization.json')
checkRunbookPacket(packet, 'docs')

const cliOutput = exec([
  'npx tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization.ts',
  '--route-bound-service-role-queue-smoke-preflight-run-gate-packet docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.json',
  '--service-role-queue-smoke-harness-packet docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke.json',
  '--route-bound-service-role-queue-smoke-runbook-ref route-bound-smoke://runbook/private-non-production-v1',
  '--route-bound-service-role-queue-smoke-operator-approval-ref route-bound-smoke://operator/approval-required-v1',
  '--route-bound-service-role-queue-smoke-environment-ref route-bound-smoke://environment/non-production-only-v1',
  '--route-bound-service-role-queue-smoke-credential-handling-ref route-bound-smoke://credentials/server-only-service-role-v1',
  '--route-bound-service-role-queue-smoke-idempotency-plan-ref route-bound-smoke://idempotency/unique-run-prefix-v1',
  '--route-bound-service-role-queue-smoke-result-storage-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/result.json',
  '--route-bound-service-role-queue-smoke-evidence-storage-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/evidence.json',
  '--route-bound-service-role-queue-smoke-telemetry-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/telemetry.json',
  '--route-bound-service-role-queue-smoke-cleanup-proof-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/cleanup-proof.json',
  '--route-bound-service-role-queue-smoke-rollback-ref route-bound-smoke://rollback/no-persisted-rows-v1',
  '--route-bound-service-role-queue-smoke-cost-ceiling-ref route-bound-smoke://cost-ceiling/non-production-minimum-v1',
  '--route-bound-service-role-queue-smoke-post-run-review-ref route-bound-smoke://post-run-review/required-v1',
].join(' '))
checkEvaluatorReport(JSON.parse(cliOutput))

const scorecard = read('docs/production-beta-readiness-scorecard.md')
for (const fragment of [
  'AI Graphics External-Beta Route-Bound Service-Role Queue Smoke Runbook Authorization',
  decision,
  'routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyWithProvidedEvidence=true',
  'serviceRoleQueueSmokeApprovedNow=false',
  'liveQueueWritePerformed=false',
  'workerDispatchPerformed=false',
  'toolExecutionPerformed=false',
  'gpuRuntimeShouldStartNow=false',
]) {
  if (!scorecard.includes(fragment)) fail(`scorecard:missing_fragment:${fragment}`)
}

checkForbiddenClaims()
checkPackageScripts()
checkGitHygiene()

if (failures.length) {
  console.error(`AI graphics route-bound service-role queue-smoke runbook authorization diagnostics failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics route-bound service-role queue-smoke runbook authorization diagnostics passed')
