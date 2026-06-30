import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_api_route_handler_gateway_binding_prepared_with_runtime_blocks'
const acceptedStatus =
  'api_route_handler_gateway_binding_ready_runtime_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-api-route-handler-gateway-binding'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-handler-gateway-binding.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-handler-gateway-binding:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-handler-gateway-binding-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-api-route-handler-gateway-binding.ts',
  'server/cli/ai-graphics-external-beta-api-route-handler-gateway-binding.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-handler-gateway-binding-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-binding.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-binding.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-cpu-static-runtime-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json',
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
  'externalBetaApiRouteHandlerGatewayBindingPrepared',
  'sourceExternalBetaApiRouteHandlerContractAccepted',
  'sourceExternalBetaToolCallGatewayContractAccepted',
  'routeHandlerRequestShapeAll21Accepted',
  'gatewayContractAll21CoverageAccepted',
  'gatewayCandidateShapeAcceptedWithProvidedEvidence',
  'routeHandlerGatewayBindingControlsSatisfied',
  'routeHandlerGatewayBindingReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'routeHandlerGatewayBindingCoveredToolsWithProvidedEvidence',
  'fullPerToolGatewayBindingProofDeferred',
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
  /apiRouteMountedNow["`:\s=]+true/i,
  /apiRouteExecutionApprovedNow["`:\s=]+true/i,
  /apiRouteExecutionPerformed["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerQueueApprovedNow["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
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
  /workerExecutionPerformed["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
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

function verifySourceEvidence() {
  const routeHandler = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json')
  const gateway = json('docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json')

  requireEqual(
    routeHandler.decision,
    'ai_graphics_external_beta_api_route_handler_contract_prepared_with_runtime_blocks',
    'route_handler_decision',
  )
  requireEqual(
    routeHandler.status,
    'external_beta_api_route_handler_contract_ready_runtime_still_blocked',
    'route_handler_status',
  )
  requireEqual(routeHandler.counts?.apiRouteHandlerContractReadyToolsWithProvidedEvidence, 21, 'route_handler_ready_count')
  requireEqual(routeHandler.counts?.apiRouteMountedNowTools, 0, 'route_handler_mounted_count')
  requireEqual(routeHandler.counts?.routeExecutionsApprovedNow, 0, 'route_handler_route_count')
  requireFalse(routeHandler.booleans?.apiRouteMountedNow, 'route_handler_mounted_false')
  requireFalse(routeHandler.booleans?.routeExecutionApprovedNow, 'route_handler_route_false')
  requireFalse(routeHandler.booleans?.toolExecutionApprovedNow, 'route_handler_tool_false')
  requireFalse(routeHandler.booleans?.gpuRuntimeShouldStartNow, 'route_handler_gpu_false')

  requireEqual(
    gateway.decision,
    'ai_graphics_external_beta_tool_call_gateway_contract_prepared_with_runtime_blocks',
    'gateway_decision',
  )
  requireEqual(gateway.status, 'prepared_external_beta_tool_call_gateway_runtime_blocked', 'gateway_status')
  requireEqual(gateway.counts?.totalAiGraphicsTools, 21, 'gateway_tool_count')
  requireEqual(gateway.counts?.totalProductFacingCapabilities, 12, 'gateway_capability_count')
  requireEqual(gateway.counts?.gpuRuntimeTargetedTools, 8, 'gateway_gpu_count')
  if ((gateway.counts?.fullGatewayWorkerEnqueueCandidateReadyExamples ?? 0) < 2) {
    fail('gateway_full_candidate_examples_too_low')
  }
  if ((gateway.counts?.cpuStaticGatewayWorkerEnqueueCandidateReadyExamples ?? 0) < 1) {
    fail('gateway_cpu_static_candidate_examples_too_low')
  }
  requireEqual(gateway.counts?.workerEnqueuePerformedNow, 0, 'gateway_enqueue_count')
  requireEqual(gateway.counts?.externalBetaReadyNowTools, 0, 'gateway_external_beta_count')
  requireEqual(gateway.counts?.productionReadyNowTools, 0, 'gateway_production_count')
  requireTruthy(gateway.booleans?.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence, 'gateway_candidate_shape_true')
  requireFalse(gateway.booleans?.agentCanExecuteToolsNow, 'gateway_agent_false')
  requireFalse(gateway.booleans?.routeExecutionApprovedNow, 'gateway_route_false')
  requireFalse(gateway.booleans?.workerQueueApprovedNow, 'gateway_queue_false')
  requireFalse(gateway.booleans?.toolExecutionApprovedNow, 'gateway_tool_false')
  requireFalse(gateway.booleans?.gpuRuntimeShouldStartNow, 'gateway_gpu_false')
}

function verifyDocs() {
  const doc = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-binding.json')
  const md = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-binding.md')
  const source = read('server/tool-registry/ai-graphics-external-beta-api-route-handler-gateway-binding.ts')
  const cli = read('server/cli/ai-graphics-external-beta-api-route-handler-gateway-binding.ts')
  const index = read('server/tool-registry/index.ts')
  const scorecard = read('docs/production-beta-readiness-scorecard.md')

  requireEqual(doc.decision, decision, 'doc_decision')
  requireEqual(doc.status, acceptedStatus, 'doc_status')
  requireEqual(doc.counts?.totalAiGraphicsTools, 21, 'doc_tool_count')
  requireEqual(doc.counts?.totalProductFacingCapabilities, 12, 'doc_capability_count')
  requireEqual(doc.counts?.gpuRuntimeTargetedTools, 8, 'doc_gpu_count')
  requireEqual(doc.counts?.routeHandlerRequestShapeAcceptedTools, 21, 'doc_route_handler_tool_count')
  requireEqual(doc.counts?.gatewayContractCoveredTools, 21, 'doc_gateway_tool_count')
  requireEqual(doc.counts?.gatewayWorkerEnqueueCandidateReadyExamples, 3, 'doc_gateway_examples')
  requireEqual(doc.counts?.routeHandlerGatewayBindingCoveredToolsWithProvidedEvidence, 21, 'doc_binding_count')
  requireEqual(doc.counts?.fullPerToolGatewayBindingProofToolsNow, 0, 'doc_full_per_tool_count')
  requireEqual(doc.counts?.apiRouteMountedNowTools, 0, 'doc_mounted_count')
  requireEqual(doc.counts?.routeExecutionsApprovedNow, 0, 'doc_route_count')
  requireEqual(doc.counts?.workerEnqueuePerformedNow, 0, 'doc_enqueue_count')
  requireEqual(doc.counts?.toolExecutionsApprovedNow, 0, 'doc_tool_count_false')
  requireEqual(doc.counts?.externalBetaReadyNowTools, 0, 'doc_external_beta_count')
  requireEqual(doc.counts?.productionReadyNowTools, 0, 'doc_production_count')

  for (const tool of tools) requireArrayIncludes(doc.tools, tool, 'doc_tools')
  for (const capability of capabilities) {
    requireArrayIncludes(doc.capabilities, capability, 'doc_capabilities')
  }
  for (const key of trueKeys) requireTruthy(doc.booleans?.[key], `doc_boolean_true:${key}`)
  for (const key of falseKeys) requireFalse(doc.booleans?.[key], `doc_boolean_false:${key}`)

  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(md) || pattern.test(JSON.stringify(doc))) {
      fail(`forbidden_runtime_claim:${pattern}`)
    }
  }

  if (!source.includes('evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayBinding')) {
    fail('source_missing_evaluator')
  }
  if (!source.includes('fullPerToolGatewayBindingProofDeferred: true')) {
    fail('source_missing_per_tool_deferred_policy')
  }
  if (!source.includes('apiRouteMountedNow: false')) {
    fail('source_missing_route_mounted_false')
  }
  if (!cli.includes('evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayBinding')) {
    fail('cli_missing_evaluator')
  }
  if (!index.includes("export * from './ai-graphics-external-beta-api-route-handler-gateway-binding'")) {
    fail('index_missing_export')
  }
  if (!scorecard.includes(decision)) fail('scorecard_missing_decision')
}

function verifyCli() {
  const output = parseJson(runNpm(runScriptName, [
    '--external-beta-api-route-handler-contract-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json',
    '--external-beta-tool-call-gateway-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json',
    '--route-handler-gateway-binding-ref',
    'external-beta-route-binding://ai-graphics/binding',
    '--route-handler-gateway-schema-ref',
    'external-beta-route-binding://ai-graphics/schema',
    '--route-handler-gateway-policy-ref',
    'external-beta-route-binding://ai-graphics/policy',
    '--route-handler-gateway-audit-ref',
    'external-beta-route-binding://ai-graphics/audit',
    '--route-handler-gateway-rollback-ref',
    'external-beta-route-binding://ai-graphics/rollback',
  ]), 'binding_cli')

  requireEqual(output.decision, decision, 'cli_decision')
  requireEqual(output.status, acceptedStatus, 'cli_status')
  requireEqual(output.routeHandlerRequestShapeAcceptedTools, 21, 'cli_route_handler_tools')
  requireEqual(output.gatewayContractCoveredTools, 21, 'cli_gateway_tools')
  requireEqual(output.routeHandlerGatewayBindingCoveredToolsWithProvidedEvidence, 21, 'cli_binding_tools')
  requireEqual(output.fullPerToolGatewayBindingProofToolsNow, 0, 'cli_per_tool_count')
  requireEqual(output.apiRouteMountedNowTools, 0, 'cli_mounted_count')
  requireEqual(output.routeExecutionsApprovedNow, 0, 'cli_route_count')
  requireEqual(output.workerEnqueuePerformedNow, 0, 'cli_enqueue_count')
  requireEqual(output.toolExecutionsApprovedNow, 0, 'cli_tool_count')
  for (const key of trueKeys) requireTruthy(output.booleans?.[key], `cli_true:${key}`)
  for (const key of falseKeys) requireFalse(output.booleans?.[key], `cli_false:${key}`)

  const blocked = parseJson(runNpm(runScriptName, [
    '--external-beta-api-route-handler-contract-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json',
    '--external-beta-tool-call-gateway-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json',
  ]), 'blocked_binding_cli')
  requireEqual(blocked.status, 'missing_route_handler_gateway_binding_controls', 'blocked_status')
  requireEqual(blocked.routeHandlerGatewayBindingReadyWithProvidedEvidence, false, 'blocked_ready_false')
}

for (const file of requiredFiles) read(file)
verifyPackageJson()
verifyPackageLockUnchanged()
verifyTrackedArtifacts()
verifySourceEvidence()
verifyDocs()
verifyCli()

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
  routeHandlerRequestShapeAcceptedTools: 21,
  gatewayContractCoveredTools: 21,
  gatewayWorkerEnqueueCandidateReadyExamples: 3,
  routeHandlerGatewayBindingCoveredToolsWithProvidedEvidence: 21,
  fullPerToolGatewayBindingProofToolsNow: 0,
  apiRouteMountedNowTools: 0,
  routeExecutionsApprovedNow: 0,
  workerEnqueuePerformedNow: 0,
  toolExecutionsApprovedNow: 0,
  gpuRuntimeShouldStartNow: false,
  packageLockMutationPerformed: false,
  generatedArtifactsCommitted: false,
}, null, 2))
