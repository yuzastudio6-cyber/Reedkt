import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_api_route_backend_adapter_contract_prepared_with_runtime_blocks'
const acceptedStatus = 'backend_adapter_contract_ready_runtime_still_blocked'
const sourceDecision =
  'ai_graphics_external_beta_api_route_mount_implementation_qa_passed_with_runtime_blocks'
const sourceStatus =
  'route_mount_implementation_qa_passed_runtime_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-api-route-backend-adapter-contract'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-backend-adapter-contract.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-backend-adapter-contract:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-contract-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-api-route-backend-adapter-contract.ts',
  'server/cli/ai-graphics-external-beta-api-route-backend-adapter-contract.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-contract-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/app.ts',
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

const adapterRefs = [
  'approvedSnapshotLookupAdapterRef',
  'creditReservationLookupAdapterRef',
  'privateArtifactPolicyAdapterRef',
  'assetManifestBindingAdapterRef',
  'dependencyReadinessAdapterRef',
  'asyncCheckbackAdapterRef',
  'queueSubmissionAuthorizationAdapterRef',
  'workerEnqueueAuthorizationAdapterRef',
  'serviceRoleBoundaryAdapterRef',
  'idempotencyAdapterRef',
  'rateLimitAdapterRef',
  'costGuardrailAdapterRef',
  'auditTelemetryAdapterRef',
  'killSwitchAdapterRef',
  'rollbackPlanRef',
]

const trueKeys = [
  'externalBetaApiRouteBackendAdapterContractPrepared',
  'sourceRouteMountImplementationQaAccepted',
  'backendAdapterContractRefsAccepted',
  'approvedSnapshotLookupAdapterContractAccepted',
  'creditReservationLookupAdapterContractAccepted',
  'privateArtifactPolicyAdapterContractAccepted',
  'assetManifestBindingAdapterContractAccepted',
  'dependencyReadinessAdapterContractAccepted',
  'asyncCheckbackAdapterContractAccepted',
  'queueSubmissionAuthorizationAdapterContractAccepted',
  'workerEnqueueAuthorizationAdapterContractAccepted',
  'serviceRoleBoundaryAdapterContractAccepted',
  'routeMountBlockedUntilAdapterQa',
  'backendAdapterContractReadyWithProvidedEvidence',
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
  /credit reservation mutation performed/i,
  /approved snapshot mutation performed/i,
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

function verifySourcePacket() {
  const source = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json')
  requireEqual(source.decision, sourceDecision, 'source_qa_decision')
  requireEqual(source.status, sourceStatus, 'source_qa_status')
  requireEqual(countFrom(source, 'routeMountImplementationQaAcceptedToolsWithProvidedEvidence'), 21, 'source_qa_count')
  requireEqual(countFrom(source, 'apiRouteMountImplementationReadyToolsWithProvidedEvidence'), 21, 'source_impl_ready_count')
  requireEqual(countFrom(source, 'runtimeAdmissionAcceptedToolsWithProvidedEvidence'), 21, 'source_runtime_admission_count')
  requireEqual(countFrom(source, 'gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence'), 21, 'source_gateway_candidate_count')
  requireEqual(countFrom(source, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools'), 8, 'source_gpu_allowed_count')
  requireEqual(countFrom(source, 'gpuRuntimeShouldStartNowTools'), 0, 'source_gpu_start_now_count')
  requireEqual(countFrom(source, 'apiRouteMountedNowTools'), 0, 'source_route_mounted_count')
  requireEqual(countFrom(source, 'routeExecutionsApprovedNow'), 0, 'source_route_execution_count')
  requireEqual(countFrom(source, 'externalBetaReadyNowTools'), 0, 'source_external_beta_count')
  requireEqual(countFrom(source, 'productionReadyNowTools'), 0, 'source_production_count')
  requireTruthy(source.booleans?.routeImplementationContractQaAccepted, 'source_contract_qa_boolean')
  requireTruthy(source.booleans?.appMountStillDeferred, 'source_app_mount_deferred_boolean')
  requireFalse(source.booleans?.apiRouteMountedNow, 'source_route_mounted_false')
  requireFalse(source.booleans?.agentCanExecuteToolsNow, 'source_agent_execute_false')
}

function verifyDoc(doc, markdown) {
  requireEqual(doc.decision, decision, 'doc_decision')
  requireEqual(doc.status, acceptedStatus, 'doc_status')
  requireEqual(doc.counts?.totalAiGraphicsTools, 21, 'doc_tool_count')
  requireEqual(doc.counts?.totalProductFacingCapabilities, 12, 'doc_capability_count')
  requireEqual(doc.counts?.gpuRuntimeTargetedTools, 8, 'doc_gpu_count')
  requireEqual(doc.counts?.backendAdapterContractReadyToolsWithProvidedEvidence, 21, 'doc_backend_adapter_count')
  requireEqual(doc.counts?.routeMountImplementationQaAcceptedToolsWithProvidedEvidence, 21, 'doc_source_qa_count')
  requireEqual(doc.counts?.gpuRuntimeShouldStartNowTools, 0, 'doc_gpu_start_now_count')
  requireEqual(doc.counts?.apiRouteMountedNowTools, 0, 'doc_route_mounted_count')
  requireEqual(doc.counts?.routeExecutionsApprovedNow, 0, 'doc_route_execution_count')
  requireEqual(doc.counts?.liveQueueWriteApprovedNowTools, 0, 'doc_live_queue_count')
  requireEqual(doc.counts?.workerEnqueueApprovedNowTools, 0, 'doc_worker_enqueue_count')
  requireEqual(doc.counts?.toolExecutionsApprovedNow, 0, 'doc_tool_execution_count')
  requireEqual(doc.counts?.externalBetaReadyNowTools, 0, 'doc_external_beta_count')
  requireEqual(doc.counts?.productionReadyNowTools, 0, 'doc_production_count')

  for (const tool of tools) requireArrayIncludes(doc.tools, tool, 'doc_tools')
  for (const capability of capabilities) {
    requireArrayIncludes(doc.capabilities, capability, 'doc_capabilities')
  }
  for (const ref of adapterRefs) {
    requireIncludes(doc.backendAdapterContract?.[ref] ?? '', 'backend://ai-graphics/external-beta/', `doc_adapter_ref:${ref}`)
    requireIncludes(markdown, doc.backendAdapterContract?.[ref] ?? '', `markdown_adapter_ref:${ref}`)
  }
  requireTruthy(doc.backendAdapterContract?.routeMountStillDeferred, 'doc_route_mount_deferred')
  requireTruthy(doc.backendAdapterContract?.approvedSnapshotLookupRequired, 'doc_snapshot_required')
  requireTruthy(doc.backendAdapterContract?.creditReservationLookupRequired, 'doc_credit_required')
  requireTruthy(doc.backendAdapterContract?.privateArtifactPolicyRequired, 'doc_private_artifact_required')
  requireTruthy(doc.backendAdapterContract?.dependencyReadinessRequired, 'doc_dependency_required')
  requireTruthy(doc.backendAdapterContract?.queueSubmissionAuthorizationRequired, 'doc_queue_auth_required')
  requireTruthy(doc.backendAdapterContract?.workerEnqueueAuthorizationRequired, 'doc_worker_auth_required')
  requireTruthy(doc.adapterPolicy?.contractOnly, 'doc_contract_only')
  requireTruthy(doc.adapterPolicy?.noCreditReservationMutationByContract, 'doc_no_credit_mutation')
  requireTruthy(doc.adapterPolicy?.noPrivateArtifactWriteByContract, 'doc_no_artifact_write')
  requireTruthy(doc.adapterPolicy?.noQueueWriteByContract, 'doc_no_queue_write')
  requireTruthy(doc.adapterPolicy?.noWorkerEnqueueByContract, 'doc_no_worker_enqueue')
  requireTruthy(doc.adapterPolicy?.onDemandGpuOnly, 'doc_on_demand_gpu')
  for (const action of [
    'app route mount',
    'API route execution',
    'approved snapshot mutation',
    'credit reservation mutation',
    'live queue write',
    'Worker queue enqueue',
    'tool execution',
    'GPU/model runtime execution now',
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
  const route = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
  const app = read('server/app.ts')
  const source = read('server/tool-registry/ai-graphics-external-beta-api-route-backend-adapter-contract.ts')
  const cli = read('server/cli/ai-graphics-external-beta-api-route-backend-adapter-contract.ts')
  const index = read('server/tool-registry/index.ts')
  const scorecard = read('docs/production-beta-readiness-scorecard.md')

  requireIncludes(route, '/api/ai-graphics/external-beta/tool-call', 'route_path')
  requireIncludes(route, 'TOOL_NOT_READY', 'route_disabled_error')
  if (app.includes('createAiGraphicsExternalBetaToolCallRoutes')) {
    fail('app_mount_imported_route_factory')
  }
  if (app.includes('ai-graphics-external-beta-tool-call-routes')) {
    fail('app_imported_route_file')
  }
  requireIncludes(source, 'evaluateAiGraphicsExternalBetaApiRouteBackendAdapterContract', 'source_evaluator')
  requireIncludes(source, 'approvedSnapshotLookupAdapterRef', 'source_snapshot_ref')
  requireIncludes(source, 'creditReservationLookupAdapterRef', 'source_credit_ref')
  requireIncludes(source, 'workerEnqueueAuthorizationAdapterRef', 'source_worker_auth_ref')
  requireIncludes(source, 'apiRouteMountedNow: false', 'source_route_mounted_false')
  requireIncludes(source, 'gpuRuntimeShouldStartNow: false', 'source_gpu_false')
  requireIncludes(cli, '--route-mount-implementation-qa-packet', 'cli_source_packet_flag')
  requireIncludes(index, "export * from './ai-graphics-external-beta-api-route-backend-adapter-contract'", 'index_export')
  requireIncludes(scorecard, decision, 'scorecard_decision')
  requireIncludes(scorecard, 'backendAdapterContractReadyToolsWithProvidedEvidence=21', 'scorecard_adapter_count')
  requireIncludes(scorecard, 'apiRouteMountedNowTools=0', 'scorecard_route_mounted_zero')
}

function verifyRuntimeReport(report) {
  requireEqual(report.decision, decision, 'runtime_decision')
  requireEqual(report.status, acceptedStatus, 'runtime_status')
  requireEqual(report.totalAiGraphicsTools, 21, 'runtime_tool_count')
  requireEqual(report.totalProductFacingCapabilities, 12, 'runtime_capability_count')
  requireEqual(report.gpuRuntimeTargetedTools, 8, 'runtime_gpu_count')
  requireEqual(report.backendAdapterContractReadyToolsWithProvidedEvidence, 21, 'runtime_adapter_count')
  requireEqual(report.routeMountImplementationQaAcceptedToolsWithProvidedEvidence, 21, 'runtime_source_qa_count')
  requireEqual(report.gpuRuntimeShouldStartNowTools, 0, 'runtime_gpu_start_now_count')
  requireEqual(report.apiRouteMountedNowTools, 0, 'runtime_route_mounted_count')
  requireEqual(report.routeExecutionsApprovedNow, 0, 'runtime_route_execution_count')
  requireEqual(report.liveQueueWriteApprovedNowTools, 0, 'runtime_live_queue_count')
  requireEqual(report.workerEnqueueApprovedNowTools, 0, 'runtime_worker_enqueue_count')
  requireEqual(report.toolExecutionsApprovedNow, 0, 'runtime_tool_execution_count')
  requireEqual(report.externalBetaReadyNowTools, 0, 'runtime_external_beta_count')
  requireEqual(report.productionReadyNowTools, 0, 'runtime_production_count')
  requireTruthy(report.backendAdapterContract?.approvedSnapshotLookupRequired, 'runtime_snapshot_required')
  requireTruthy(report.backendAdapterContract?.creditReservationLookupRequired, 'runtime_credit_required')
  requireTruthy(report.backendAdapterContract?.workerEnqueueAuthorizationRequired, 'runtime_worker_auth_required')
  for (const key of trueKeys) requireTruthy(report.booleans?.[key], `runtime_boolean_true:${key}`)
  for (const key of falseKeys) requireFalse(report.booleans?.[key], `runtime_boolean_false:${key}`)
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
verifySourcePacket()

const doc = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.json')
const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.md')
verifyDoc(doc, markdown)
verifySourceFiles()
verifyTextSafety([
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.md',
  'server/tool-registry/ai-graphics-external-beta-api-route-backend-adapter-contract.ts',
  'server/cli/ai-graphics-external-beta-api-route-backend-adapter-contract.ts',
])

const runtimeReport = parseJson(runNpm(runScriptName, [
  '--route-mount-implementation-qa-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json',
]), 'route_backend_adapter_contract_cli')
verifyRuntimeReport(runtimeReport)

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  backendAdapterContractReadyToolsWithProvidedEvidence: 21,
  routeMountImplementationQaAcceptedToolsWithProvidedEvidence: 21,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  gpuRuntimeShouldStartNowTools: 0,
  apiRouteMountedNowTools: 0,
  routeExecutionsApprovedNow: 0,
  liveQueueWriteApprovedNowTools: 0,
  workerEnqueueApprovedNowTools: 0,
  toolExecutionsApprovedNow: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  agentCanExecuteToolsNow: false,
}, null, 2))
