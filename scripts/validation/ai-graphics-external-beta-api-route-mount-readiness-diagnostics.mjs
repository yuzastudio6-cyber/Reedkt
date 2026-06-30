import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_api_route_mount_readiness_prepared_with_runtime_blocks'
const acceptedStatus =
  'api_route_mount_ready_with_provided_evidence_runtime_still_blocked'
const sourceDecision =
  'ai_graphics_external_beta_api_route_handler_gateway_full_21_proof_prepared_with_runtime_blocks'
const sourceStatus =
  'api_route_handler_gateway_full_21_proof_ready_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-api-route-mount-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-mount-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-mount-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-mount-readiness-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-api-route-mount-readiness.ts',
  'server/cli/ai-graphics-external-beta-api-route-mount-readiness.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-mount-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-binding.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json',
  'docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
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

const requiredControlKeys = [
  'routeMountPolicyRef',
  'routeSchemaRef',
  'routeAuthzMiddlewareRef',
  'routeRequestValidationRef',
  'approvedSnapshotResolverRef',
  'creditReservationResolverRef',
  'privateArtifactPolicyRef',
  'assetManifestBindingRef',
  'dependencyReadinessPolicyRef',
  'asyncCheckbackPolicyRef',
  'queueSubmissionAuthorizationRef',
  'serviceRoleBoundaryRef',
  'rateLimitPolicyRef',
  'costGuardrailPolicyRef',
  'idempotencyStoreRef',
  'auditLogRef',
  'telemetryRef',
  'rollbackPlanRef',
  'incidentResponseRef',
  'killSwitchRef',
  'privateNetworkRef',
]

const trueKeys = [
  'externalBetaApiRouteMountReadinessPrepared',
  'sourceRouteHandlerGatewayFullProofAccepted',
  'routeMountControlsSatisfied',
  'apiRouteMountReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'approvedSnapshotResolverAccepted',
  'creditReservationResolverAccepted',
  'privateArtifactPolicyAccepted',
  'assetManifestBindingAccepted',
  'dependencyReadinessPolicyAccepted',
  'asyncCheckbackPolicyAccepted',
  'queueSubmissionAuthorizationAccepted',
  'serviceRoleBoundaryAccepted',
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
  /directAgentToolExecutionApprovedNow["`:\s=]+true/i,
  /apiRouteMountedNow["`:\s=]+true/i,
  /apiRouteExecutionApprovedNow["`:\s=]+true/i,
  /apiRouteExecutionPerformed["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerQueueApprovedNow["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /serviceRoleQueueTransactionApprovedNow["`:\s=]+true/i,
  /liveQueueWriteApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /productionWorkerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /internalBetaReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /dependencyInstallPerformed["`:\s=]+true/i,
  /packageLockMutationPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const generatedArtifactPathPattern =
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

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function runNpm(scriptName, args = []) {
  return childProcess.execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function parseJson(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
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

function requireIncludes(text, value, label) {
  if (!text.includes(value)) fail(`${label}:missing:${value}`)
}

function requireArrayIncludes(array, value, label) {
  if (!Array.isArray(array) || !array.includes(value)) {
    fail(`${label}:missing:${value}`)
  }
}

function countFrom(packet, key) {
  const value = packet?.[key]
  const countValue = packet?.counts?.[key]
  return typeof value === 'number' ? value :
    typeof countValue === 'number' ? countValue :
    undefined
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
    /"dependencies"|"devDependencies"|"optionalDependencies"|"peerDependencies"|package-lock|npm install|npm ci/.test(line)
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

function verifySourceEvidence() {
  const source = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.json')
  requireEqual(source.decision, sourceDecision, 'source_full_proof_decision')
  requireEqual(source.status, sourceStatus, 'source_full_proof_status')
  requireEqual(countFrom(source, 'totalAiGraphicsTools'), 21, 'source_tool_count')
  requireEqual(countFrom(source, 'totalProductFacingCapabilities'), 12, 'source_capability_count')
  requireEqual(countFrom(source, 'gpuRuntimeTargetedTools'), 8, 'source_gpu_count')
  requireEqual(countFrom(source, 'routeHandlerGatewayFullProofToolsWithProvidedEvidence'), 21, 'source_full_proof_count')
  requireEqual(countFrom(source, 'runtimeAdmissionAcceptedToolsWithProvidedEvidence'), 21, 'source_runtime_admission_count')
  requireEqual(countFrom(source, 'gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence'), 21, 'source_gateway_candidate_count')
  requireEqual(countFrom(source, 'routeHandlerToGatewayContinuityAcceptedTools'), 21, 'source_continuity_count')
  requireEqual(countFrom(source, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools'), 8, 'source_gpu_allowed_count')
  requireEqual(countFrom(source, 'gpuRuntimeShouldStartNowTools'), 0, 'source_gpu_start_now_count')
  requireEqual(countFrom(source, 'externalBetaReadyNowTools'), 0, 'source_external_beta_count')
  requireEqual(countFrom(source, 'productionReadyNowTools'), 0, 'source_production_count')
  requireTruthy(source.booleans?.full21RouteHandlerGatewayProofReadyWithProvidedEvidence, 'source_full_proof_boolean')
  requireFalse(source.booleans?.agentCanExecuteToolsNow, 'source_agent_execute_false')
  requireFalse(source.booleans?.gpuRuntimeShouldStartNow, 'source_gpu_start_now_false')
}

function verifyDoc(doc, markdown) {
  requireEqual(doc.decision, decision, 'doc_decision')
  requireEqual(doc.status, acceptedStatus, 'doc_status')
  requireEqual(doc.counts?.totalAiGraphicsTools, 21, 'doc_tool_count')
  requireEqual(doc.counts?.totalProductFacingCapabilities, 12, 'doc_capability_count')
  requireEqual(doc.counts?.gpuRuntimeTargetedTools, 8, 'doc_gpu_count')
  requireEqual(doc.counts?.apiRouteMountReadyToolsWithProvidedEvidence, 21, 'doc_route_mount_ready_count')
  requireEqual(doc.counts?.routeHandlerGatewayFullProofToolsWithProvidedEvidence, 21, 'doc_source_full_proof_count')
  requireEqual(doc.counts?.runtimeAdmissionAcceptedToolsWithProvidedEvidence, 21, 'doc_runtime_admission_count')
  requireEqual(doc.counts?.gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence, 21, 'doc_gateway_candidate_count')
  requireEqual(doc.counts?.routeHandlerToGatewayContinuityAcceptedTools, 21, 'doc_continuity_count')
  requireEqual(doc.counts?.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools, 8, 'doc_gpu_allowed_count')
  requireEqual(doc.counts?.gpuRuntimeShouldStartNowTools, 0, 'doc_gpu_start_now_count')
  requireEqual(doc.counts?.apiRouteMountedNowTools, 0, 'doc_route_mounted_count')
  requireEqual(doc.counts?.routeExecutionsApprovedNow, 0, 'doc_route_execution_count')
  requireEqual(doc.counts?.workerEnqueueApprovedNowTools, 0, 'doc_worker_enqueue_count')
  requireEqual(doc.counts?.toolExecutionsApprovedNow, 0, 'doc_tool_execution_count')
  requireEqual(doc.counts?.externalBetaReadyNowTools, 0, 'doc_external_beta_count')
  requireEqual(doc.counts?.productionReadyNowTools, 0, 'doc_production_count')

  for (const tool of tools) requireArrayIncludes(doc.tools, tool, 'doc_tools')
  for (const capability of capabilities) {
    requireArrayIncludes(doc.capabilities, capability, 'doc_capabilities')
  }
  for (const key of requiredControlKeys) {
    if (
      typeof doc.routeMountControls?.[key] !== 'string' ||
      !doc.routeMountControls[key].startsWith('private://')
    ) {
      fail(`doc_private_control_missing:${key}`)
    }
  }
  requireEqual(doc.routeMountCandidate?.routePath, '/api/ai-graphics/external-beta/tool-call', 'doc_route_path')
  requireFalse(doc.routeMountCandidate?.expressRouteMountedNow, 'doc_route_mounted_false')
  requireTruthy(doc.routeMountCandidate?.sourceControlledMountOnly, 'doc_source_controlled_mount')
  requireTruthy(doc.routeMountCandidate?.onDemandGpuOnly, 'doc_candidate_on_demand_gpu')
  requireTruthy(doc.routeMountPolicy?.routeMountDeferred, 'doc_route_mount_deferred')
  requireTruthy(doc.routeMountPolicy?.apiRouteExecutionDeferred, 'doc_route_execution_deferred')
  requireTruthy(doc.routeMountPolicy?.queueWriteDeferred, 'doc_queue_write_deferred')
  requireTruthy(doc.routeMountPolicy?.workerDispatchDeferred, 'doc_worker_dispatch_deferred')
  requireTruthy(doc.routeMountPolicy?.toolExecutionDeferred, 'doc_tool_execution_deferred')
  requireTruthy(doc.routeMountPolicy?.onDemandGpuOnly, 'doc_on_demand_gpu')
  requireTruthy(doc.routeMountPolicy?.noIdleGpuRuntimeApproved, 'doc_no_idle_gpu')

  for (const action of [
    'mounted API route creation',
    'API route execution',
    'live queue write',
    'Worker execution',
    'GPU/model runtime execution now',
    'idle or always-on GPU runtime',
    'signed URL creation',
    'public artifact creation',
    'external beta traffic enablement',
    'production unlock',
  ]) {
    requireArrayIncludes(doc.blockedRuntimeActions, action, 'doc_blocked_actions')
    requireIncludes(markdown, action, 'markdown_blocked_actions')
  }
  for (const key of trueKeys) requireTruthy(doc.booleans?.[key], `doc_boolean_true:${key}`)
  for (const key of falseKeys) requireFalse(doc.booleans?.[key], `doc_boolean_false:${key}`)
}

function verifySourceFiles() {
  const source = read('server/tool-registry/ai-graphics-external-beta-api-route-mount-readiness.ts')
  const cli = read('server/cli/ai-graphics-external-beta-api-route-mount-readiness.ts')
  const index = read('server/tool-registry/index.ts')
  const scorecard = read('docs/production-beta-readiness-scorecard.md')

  requireIncludes(source, 'evaluateAiGraphicsExternalBetaApiRouteMountReadiness', 'source_evaluator')
  requireIncludes(source, 'buildAiGraphicsExternalBetaApiRouteMountReadinessInput', 'source_input_builder')
  requireIncludes(source, "routePath: '/api/ai-graphics/external-beta/tool-call'", 'source_route_path')
  requireIncludes(source, 'apiRouteMountedNow: false', 'source_route_mounted_false')
  requireIncludes(source, 'gpuRuntimeShouldStartNow: false', 'source_gpu_start_false')
  requireIncludes(source, 'noIdleGpuRuntimeApproved: true', 'source_no_idle_gpu')
  requireIncludes(cli, '--route-handler-gateway-full-proof-packet', 'cli_source_packet_flag')
  requireIncludes(index, "export * from './ai-graphics-external-beta-api-route-mount-readiness'", 'index_export')
  requireIncludes(scorecard, decision, 'scorecard_decision')
  requireIncludes(scorecard, 'apiRouteMountReadyToolsWithProvidedEvidence=21', 'scorecard_route_mount_count')
  requireIncludes(scorecard, 'apiRouteMountedNowTools=0', 'scorecard_route_mounted_zero')
}

function verifyRuntimeReport(report) {
  requireEqual(report.decision, decision, 'runtime_decision')
  requireEqual(report.status, acceptedStatus, 'runtime_status')
  requireEqual(report.totalAiGraphicsTools, 21, 'runtime_tool_count')
  requireEqual(report.totalProductFacingCapabilities, 12, 'runtime_capability_count')
  requireEqual(report.gpuRuntimeTargetedTools, 8, 'runtime_gpu_count')
  requireEqual(report.apiRouteMountReadyToolsWithProvidedEvidence, 21, 'runtime_route_mount_ready_count')
  requireEqual(report.routeHandlerGatewayFullProofToolsWithProvidedEvidence, 21, 'runtime_full_proof_count')
  requireEqual(report.runtimeAdmissionAcceptedToolsWithProvidedEvidence, 21, 'runtime_admission_count')
  requireEqual(report.gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence, 21, 'runtime_gateway_candidate_count')
  requireEqual(report.routeHandlerToGatewayContinuityAcceptedTools, 21, 'runtime_continuity_count')
  requireEqual(report.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools, 8, 'runtime_gpu_allowed_count')
  requireEqual(report.gpuRuntimeShouldStartNowTools, 0, 'runtime_gpu_start_now_count')
  requireEqual(report.apiRouteMountedNowTools, 0, 'runtime_route_mounted_count')
  requireEqual(report.routeExecutionsApprovedNow, 0, 'runtime_route_execution_count')
  requireEqual(report.workerEnqueueApprovedNowTools, 0, 'runtime_worker_enqueue_count')
  requireEqual(report.toolExecutionsApprovedNow, 0, 'runtime_tool_execution_count')
  requireEqual(report.externalBetaReadyNowTools, 0, 'runtime_external_beta_count')
  requireEqual(report.productionReadyNowTools, 0, 'runtime_production_count')
  requireEqual(report.routeMountCandidate?.routePath, '/api/ai-graphics/external-beta/tool-call', 'runtime_route_path')
  requireFalse(report.routeMountCandidate?.expressRouteMountedNow, 'runtime_route_mounted_false')
  for (const key of trueKeys) requireTruthy(report.booleans?.[key], `runtime_boolean_true:${key}`)
  for (const key of falseKeys) requireFalse(report.booleans?.[key], `runtime_boolean_false:${key}`)
  requireFalse(report.input?.routeExecutionPerformed, 'runtime_input_route_execution_false')
  requireFalse(report.input?.gpuRuntimePerformed, 'runtime_input_gpu_false')
}

function verifyTextSafety(files) {
  const combined = files.map(read).join('\n')
  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(combined)) fail(`forbidden_claim:${pattern}`)
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) fail(`missing_file:${file}`)
}

verifyPackageJson()
verifyPackageLockUnchanged()
verifyTrackedArtifacts()
verifySourceEvidence()

const doc = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.json')
const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.md')
verifyDoc(doc, markdown)
verifySourceFiles()
verifyTextSafety([
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.md',
  'server/tool-registry/ai-graphics-external-beta-api-route-mount-readiness.ts',
  'server/cli/ai-graphics-external-beta-api-route-mount-readiness.ts',
])

const runtimeReport = parseJson(runNpm(runScriptName, [
  '--route-handler-gateway-full-proof-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.json',
]), 'route_mount_readiness_cli')
verifyRuntimeReport(runtimeReport)

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  apiRouteMountReadyToolsWithProvidedEvidence: 21,
  routeHandlerGatewayFullProofToolsWithProvidedEvidence: 21,
  runtimeAdmissionAcceptedToolsWithProvidedEvidence: 21,
  gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence: 21,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  gpuRuntimeShouldStartNowTools: 0,
  apiRouteMountedNowTools: 0,
  routeExecutionsApprovedNow: 0,
  workerEnqueueApprovedNowTools: 0,
  toolExecutionsApprovedNow: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  agentCanExecuteToolsNow: false,
}, null, 2))
