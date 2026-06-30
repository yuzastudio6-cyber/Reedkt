import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_api_route_handler_contract_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_handler_contract_ready_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-api-route-handler-contract'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-handler-contract.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-handler-contract:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-handler-contract-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-api-route-handler-contract.ts',
  'server/cli/ai-graphics-external-beta-api-route-handler-contract.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-handler-contract-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.md',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-dispatch-handoff-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const toolProfiles = [
  ['torch_torchvision', 'model_runtime_foundation', true],
  ['transformers', 'model_runtime_foundation', true],
  ['sam2', 'subject_segmentation', true],
  ['birefnet', 'background_removal', true],
  ['real_esrgan', 'upscaling', true],
  ['kornia', 'tensor_image_ops', true],
  ['rembg', 'background_removal', true],
  ['transparent_background', 'background_removal', true],
  ['d3', 'chart_overlay', false],
  ['echarts', 'data_visualization', false],
  ['vega_lite', 'data_visualization', false],
  ['vega', 'data_visualization', false],
  ['satori', 'svg_graphics', false],
  ['svgdotjs_svg_js', 'svg_graphics', false],
  ['viz_js', 'diagram_graphics', false],
  ['lottie_web', 'animation_overlay', false],
  ['animejs', 'animation_overlay', false],
  ['three_js', 'webgl_3d_scene', false],
  ['pixi_js', 'canvas_scene', false],
  ['konva', 'canvas_scene', false],
  ['babylonjs', 'webgl_3d_scene', false],
]

const tools = toolProfiles.map(([toolId]) => toolId)
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
  'externalBetaApiRouteHandlerContractPrepared',
  'sourceExternalBetaControlledOnDemandStatusBridgeAccepted',
  'sourceExternalBetaApiRouteWorkerDispatchHandoffProofAccepted',
  'requestedToolPresentInCanonical21',
  'requestedCapabilityAcceptedForTool',
  'externalBetaApiRouteHandlerControlsSatisfied',
  'externalBetaApiRouteHandlerContractReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'controlledOnDemandExternalBetaHandlerReadyWithProvidedEvidence',
  'approvedPlanSnapshotAccepted',
  'creditReservationAccepted',
  'privateArtifactManifestAccepted',
  'routeHandlerSourceControlled',
  'expressRouteMountDeferred',
  'apiRouteRegistryMetadataOnly',
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

const generatedArtifactPathPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /directAgentToolExecutionApprovedNow["`:\s=]+true/i,
  /apiRouteMountedNow["`:\s=]+true/i,
  /apiRouteExecutionApprovedNow["`:\s=]+true/i,
  /apiRouteExecutionPerformed["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerQueueApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /internalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /dependencyInstallPerformed["`:\s=]+true/i,
  /packageLockMutationPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
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

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function npmJson(scriptName, args = []) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) fail(`${label}:expected:${expected}:actual:${actual}`)
}

function requireTruthy(value, label) {
  if (value !== true) fail(`${label}:not_true`)
}

function requireFalse(value, label) {
  if (value !== false) fail(`${label}:not_false`)
}

function requireArrayIncludes(array, value, label) {
  if (!Array.isArray(array) || !array.includes(value)) {
    fail(`${label}:missing:${value}`)
  }
}

function verifyPackageJson() {
  const pkg = json('package.json')
  requireEqual(pkg.scripts?.[runScriptName], runScriptCommand, 'run_script_command')
  requireEqual(
    pkg.scripts?.[diagnosticScriptName],
    diagnosticScriptCommand,
    'diagnostic_script_command',
  )

  const pkgDiff = git(['diff', '--', 'package.json'])
  const forbidden = pkgDiff.split('\n').filter((line) => (
    /^\+/.test(line) &&
    /"dependencies"|"devDependencies"|package-lock|npm install|npm ci/.test(line)
  ))
  if (forbidden.length > 0) fail(`package_dependency_section_changed:${forbidden.join('|')}`)
}

function verifyPackageLockUnchanged() {
  const lockDiff = git(['diff', '--', 'package-lock.json'])
  if (lockDiff.trim().length > 0) fail('package_lock_changed')
}

function verifyTrackedArtifacts() {
  const changed = git(['diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD'])
    .split('\n')
    .filter(Boolean)
  for (const file of changed) {
    if (
      generatedArtifactPathPattern.test(file) &&
      !file.startsWith('docs/tool-intelligence/ai-graphics/') &&
      !file.startsWith('scripts/validation/')
    ) {
      fail(`generated_artifact_tracked:${file}`)
    }
    if (file.startsWith('.local-artifacts/')) fail(`local_artifact_tracked:${file}`)
  }
}

function verifyDocs() {
  const doc = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json')
  const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.md')
  const source = read('server/tool-registry/ai-graphics-external-beta-api-route-handler-contract.ts')
  const cli = read('server/cli/ai-graphics-external-beta-api-route-handler-contract.ts')
  const index = read('server/tool-registry/index.ts')
  const scorecard = read('docs/production-beta-readiness-scorecard.md')

  requireEqual(doc.decision, decision, 'doc_decision')
  requireEqual(doc.status, acceptedStatus, 'doc_status')
  requireEqual(doc.counts?.totalAiGraphicsTools, 21, 'doc_tool_count')
  requireEqual(doc.counts?.totalProductFacingCapabilities, 12, 'doc_capability_count')
  requireEqual(doc.counts?.gpuRuntimeTargetedTools, 8, 'doc_gpu_count')
  requireEqual(doc.counts?.externalBetaControlledOnDemandReadyTools, 21, 'doc_controlled_ready_count')
  requireEqual(doc.counts?.externalBetaCallableNowTools, 21, 'doc_callable_count')
  requireEqual(doc.counts?.apiRouteHandlerContractReadyToolsWithProvidedEvidence, 21, 'doc_handler_ready_count')
  requireEqual(doc.counts?.apiRouteMountedNowTools, 0, 'doc_route_mounted_count')
  requireEqual(doc.counts?.routeExecutionsApprovedNow, 0, 'doc_route_approved_count')
  requireEqual(doc.counts?.workerDispatchesApprovedNow, 0, 'doc_worker_dispatch_count')
  requireEqual(doc.counts?.toolExecutionsApprovedNow, 0, 'doc_tool_execution_count')
  requireEqual(doc.counts?.productionReadyNowTools, 0, 'doc_production_count')

  for (const tool of tools) requireArrayIncludes(doc.tools, tool, 'doc_tools')
  for (const capability of capabilities) {
    requireArrayIncludes(doc.capabilities, capability, 'doc_capabilities')
  }
  for (const key of trueKeys) requireTruthy(doc.booleans?.[key], `doc_boolean_true:${key}`)
  for (const key of falseKeys) requireFalse(doc.booleans?.[key], `doc_boolean_false:${key}`)

  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(markdown) || pattern.test(JSON.stringify(doc))) {
      fail(`forbidden_runtime_claim:${pattern}`)
    }
  }

  if (!source.includes('evaluateAiGraphicsExternalBetaApiRouteHandlerContract')) {
    fail('source_missing_evaluator')
  }
  if (!source.includes('expressRouteMountDeferred: true')) {
    fail('source_missing_deferred_mount_policy')
  }
  if (!source.includes('apiRouteMountedNow: false')) {
    fail('source_missing_route_mounted_false')
  }
  if (!cli.includes('evaluateAiGraphicsExternalBetaApiRouteHandlerContract')) {
    fail('cli_missing_evaluator_call')
  }
  if (!index.includes("export * from './ai-graphics-external-beta-api-route-handler-contract'")) {
    fail('index_missing_export')
  }
  if (!scorecard.includes(decision)) {
    fail('scorecard_missing_decision')
  }
}

function verifySourceEvidence() {
  const bridge = json('docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json')
  const handoff = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-dispatch-handoff-proof.json')
  const bridgeCoverage = bridge.coverage ?? {}
  const handoffScope = handoff.scope ?? {}
  requireEqual(
    bridge.decision,
    'ai_graphics_external_beta_controlled_on_demand_status_bridge_prepared_with_runtime_blocks',
    'source_bridge_decision',
  )
  requireEqual(
    bridge.status,
    'external_beta_controlled_on_demand_status_bridge_ready_with_warnings',
    'source_bridge_status',
  )
  requireEqual(bridgeCoverage.externalBetaControlledOnDemandReadyTools, 21, 'source_bridge_ready_count')
  requireEqual(bridgeCoverage.runtimeReadyForOnDemandExternalBetaToolCallTools, 21, 'source_bridge_runtime_count')
  requireFalse(bridge.booleans?.routeExecutionApprovedNow, 'source_bridge_route_false')
  requireFalse(bridge.booleans?.workerExecutionApprovedNow, 'source_bridge_worker_false')
  requireFalse(bridge.booleans?.toolExecutionApprovedNow, 'source_bridge_tool_false')
  requireFalse(bridge.booleans?.gpuRuntimeShouldStartNow, 'source_bridge_gpu_start_false')

  requireEqual(
    handoff.decision,
    'ai_graphics_external_beta_api_route_worker_dispatch_handoff_proof_prepared_with_runtime_blocks',
    'source_handoff_decision',
  )
  requireEqual(
    handoff.status,
    'external_beta_api_route_worker_dispatch_handoff_proof_ready_runtime_still_blocked',
    'source_handoff_status',
  )
  requireEqual(handoffScope.totalAiGraphicsTools, 21, 'source_handoff_tool_count')
  requireEqual(handoffScope.productFacingCapabilities, 12, 'source_handoff_capability_count')
  requireEqual(handoffScope.gpuRuntimeTargetedTools, 8, 'source_handoff_gpu_count')
  requireEqual(handoffScope.sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence, 21, 'source_handoff_worker_count')
  requireTruthy(handoff.booleans?.sourceExternalBetaApiRouteQueueSmokeProofAccepted, 'source_handoff_route_smoke')
  requireTruthy(handoff.booleans?.sourceExternalBetaWorkerDispatchSmokeProofAccepted, 'source_handoff_worker_smoke')
  requireFalse(handoff.booleans?.apiRouteExecutionPerformed, 'source_handoff_route_execution_false')
  requireFalse(handoff.booleans?.workerDispatchPerformed, 'source_handoff_worker_dispatch_false')
  requireFalse(handoff.booleans?.toolExecutionPerformed, 'source_handoff_tool_false')
}

function verifyCliForAllTools() {
  const baseArgs = [
    '--controlled-on-demand-status-bridge-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json',
    '--api-route-worker-dispatch-handoff-proof-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-dispatch-handoff-proof.json',
  ]

  for (const [toolId, capabilityId, gpuRequired] of toolProfiles) {
    const output = npmJson(runScriptName, [
      ...baseArgs,
      '--requested-tool-id',
      toolId,
      '--capability-id',
      capabilityId,
      '--workspace-id',
      'workspace-fixture',
      '--project-id',
      'project-fixture',
      '--approved-plan-snapshot-id',
      `approved-snapshot-${toolId}`,
      '--credit-reservation-id',
      `credit-reservation-${toolId}`,
      '--private-artifact-manifest-ref',
      `private://ai-graphics/external-beta/${toolId}/artifact-manifest.json`,
      '--request-id',
      `request-${toolId}`,
      '--trace-id',
      `trace-${toolId}`,
      '--idempotency-key',
      `idempotency-${toolId}`,
    ])
    requireEqual(output.decision, decision, `cli_decision:${toolId}`)
    requireEqual(output.status, acceptedStatus, `cli_status:${toolId}`)
    requireEqual(output.requestedToolId, toolId, `cli_tool:${toolId}`)
    requireEqual(output.requestedCapabilityId, capabilityId, `cli_capability:${toolId}`)
    requireEqual(output.apiRouteHandlerContractReadyToolsWithProvidedEvidence, 21, `cli_ready_count:${toolId}`)
    requireEqual(output.apiRouteMountedNowTools, 0, `cli_mounted_count:${toolId}`)
    requireEqual(output.routeExecutionsApprovedNow, 0, `cli_route_count:${toolId}`)
    requireEqual(output.workerDispatchesApprovedNow, 0, `cli_worker_count:${toolId}`)
    requireEqual(output.toolExecutionsApprovedNow, 0, `cli_tool_count:${toolId}`)
    requireEqual(
      output.handlerCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      gpuRequired,
      `cli_gpu_start_allowed:${toolId}`,
    )
    requireFalse(output.handlerCandidate?.gpuRuntimeShouldStartNow, `cli_gpu_start_now:${toolId}`)
    for (const key of trueKeys) requireTruthy(output.booleans?.[key], `cli_true:${toolId}:${key}`)
    for (const key of falseKeys) requireFalse(output.booleans?.[key], `cli_false:${toolId}:${key}`)
  }
}

for (const file of requiredFiles) read(file)
verifyPackageJson()
verifyPackageLockUnchanged()
verifyTrackedArtifacts()
verifyDocs()
verifySourceEvidence()
verifyCliForAllTools()

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: tools.length,
  capabilitiesCovered: capabilities.length,
  routeHandlerContractReadyToolsWithProvidedEvidence: 21,
  apiRouteMountedNowTools: 0,
  routeExecutionsApprovedNow: 0,
  workerDispatchesApprovedNow: 0,
  toolExecutionsApprovedNow: 0,
  gpuRuntimeShouldStartNow: false,
  packageLockMutationPerformed: false,
  generatedArtifactsCommitted: false,
}, null, 2))
