import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_api_route_handler_gateway_full_21_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'api_route_handler_gateway_full_21_proof_ready_runtime_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-api-route-handler-gateway-full-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-handler-gateway-full-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-handler-gateway-full-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-handler-gateway-full-proof-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-api-route-handler-gateway-full-proof.ts',
  'server/cli/ai-graphics-external-beta-api-route-handler-gateway-full-proof.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-handler-gateway-full-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.md',
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
  'externalBetaApiRouteHandlerGatewayFull21ProofPrepared',
  'sourceRouteHandlerGatewayBindingAccepted',
  'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'all21RuntimeAdmissionsAcceptedWithProvidedEvidence',
  'all21GatewayCandidatesReadyWithProvidedEvidence',
  'all21RouteHandlerToGatewayContinuityAccepted',
  'full21RouteHandlerGatewayProofReadyWithProvidedEvidence',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'gpuRuntimeStartAllowedOnlyForAcceptedExternalBetaJobs',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'agentCanExecuteToolsNow',
  'directAgentToolExecutionApprovedNow',
  'apiRouteMountedNow',
  'apiRouteExecutionApprovedNow',
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

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /apiRouteMountedNow["`:\s=]+true/i,
  /apiRouteExecutionApprovedNow["`:\s=]+true/i,
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
  /internalBetaReadyNow["`:\s=]+true/i,
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
      !file.startsWith('scripts/validation/') &&
      !file.startsWith('server/tool-registry/') &&
      !file.startsWith('server/cli/')
    ) {
      fail(`generated_artifact_tracked:${file}`)
    }
    if (file.startsWith('.local-artifacts/')) fail(`local_artifact_tracked:${file}`)
  }
}

function verifyTextSafety(files) {
  for (const file of files) {
    const text = read(file)
    for (const pattern of forbiddenDocPatterns) {
      if (pattern.test(text)) fail(`forbidden_claim:${file}:${pattern}`)
    }
  }
}

function verifyDoc(doc, md) {
  requireEqual(doc.decision, decision, 'doc_decision')
  requireEqual(doc.status, acceptedStatus, 'doc_status')
  requireEqual(doc.counts?.totalAiGraphicsTools, 21, 'doc_total_tools')
  requireEqual(doc.counts?.totalProductFacingCapabilities, 12, 'doc_total_capabilities')
  requireEqual(doc.counts?.gpuRuntimeTargetedTools, 8, 'doc_gpu_tools')
  requireEqual(
    doc.counts?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence,
    21,
    'doc_route_bound_operator_preflight_count',
  )
  requireEqual(
    doc.counts?.routeHandlerGatewayFullProofToolsWithProvidedEvidence,
    21,
    'doc_full_proof_tools',
  )
  requireEqual(
    doc.counts?.runtimeAdmissionAcceptedToolsWithProvidedEvidence,
    21,
    'doc_runtime_admission_accepted_tools',
  )
  requireEqual(
    doc.counts?.gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence,
    21,
    'doc_gateway_candidate_ready_tools',
  )
  requireEqual(
    doc.counts?.routeHandlerToGatewayContinuityAcceptedTools,
    21,
    'doc_continuity_accepted_tools',
  )
  requireEqual(
    doc.counts?.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools,
    8,
    'doc_gpu_start_allowed_tools',
  )
  requireEqual(doc.counts?.gpuRuntimeShouldStartNowTools, 0, 'doc_gpu_should_start_now')
  requireEqual(doc.counts?.externalBetaReadyNowTools, 0, 'doc_external_beta_ready_now')
  requireEqual(doc.counts?.productionReadyNowTools, 0, 'doc_production_ready_now')

  for (const key of trueKeys) requireTruthy(doc.booleans?.[key], `doc_boolean_true:${key}`)
  for (const key of falseKeys) requireFalse(doc.booleans?.[key], `doc_boolean_false:${key}`)

  const toolIds = new Set((doc.tools ?? []).map((tool) => tool.toolId))
  for (const tool of tools) {
    if (!toolIds.has(tool)) fail(`doc_missing_tool:${tool}`)
    if (!md.includes(`\`${tool}\``)) fail(`md_missing_tool:${tool}`)
  }
  for (const capability of capabilities) {
    if (!md.includes(`\`${capability}\``) && !JSON.stringify(doc).includes(capability)) {
      fail(`missing_capability:${capability}`)
    }
  }

  const gpuRows = (doc.tools ?? []).filter((tool) => tool.gpuRequiredForRuntime === true)
  const nonGpuRows = (doc.tools ?? []).filter((tool) => tool.gpuRequiredForRuntime === false)
  requireEqual(gpuRows.length, 8, 'doc_gpu_row_count')
  requireEqual(nonGpuRows.length, 13, 'doc_non_gpu_row_count')
  for (const row of gpuRows) {
    if (!gpuTools.has(row.toolId)) fail(`unexpected_gpu_tool:${row.toolId}`)
    requireTruthy(
      row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      `gpu_start_allowed:${row.toolId}`,
    )
    if (!String(row.runtimeTarget ?? '').includes('nvidia_l4')) {
      fail(`gpu_tool_not_nvidia_l4_target:${row.toolId}:${row.runtimeTarget}`)
    }
  }
  for (const row of nonGpuRows) {
    requireFalse(
      row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      `non_gpu_start_disallowed:${row.toolId}`,
    )
  }
}

function verifyRuntimeReport(report) {
  requireEqual(report.decision, decision, 'report_decision')
  requireEqual(report.status, acceptedStatus, 'report_status')
  requireEqual(report.rejectionReasons?.length ?? 0, 0, 'report_rejection_reason_count')
  requireTruthy(
    report.sourceRouteHandlerGatewayBindingAccepted,
    'report_source_binding_accepted',
  )
  requireEqual(report.routeHandlerGatewayFullProofToolsWithProvidedEvidence, 21, 'report_full_proof')
  requireEqual(
    report.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence,
    21,
    'report_route_bound_operator_preflight_count',
  )
  requireEqual(report.runtimeAdmissionAcceptedToolsWithProvidedEvidence, 21, 'report_admission')
  requireEqual(
    report.gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence,
    21,
    'report_gateway',
  )
  requireEqual(report.routeHandlerToGatewayContinuityAcceptedTools, 21, 'report_continuity')
  requireEqual(
    report.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools,
    8,
    'report_gpu_start_allowed',
  )
  requireEqual(report.gpuRuntimeShouldStartNowTools, 0, 'report_gpu_should_start_now')
  requireEqual(report.workerEnqueuePerformedNow, 0, 'report_worker_enqueue_performed_now')
  requireEqual(report.toolExecutionsApprovedNow, 0, 'report_tool_execution_now')
  requireEqual(report.externalBetaReadyNowTools, 0, 'report_external_beta_ready_now')
  requireEqual(report.productionReadyNowTools, 0, 'report_production_ready_now')

  for (const key of trueKeys) requireTruthy(report.booleans?.[key], `report_boolean_true:${key}`)
  for (const key of falseKeys) requireFalse(report.booleans?.[key], `report_boolean_false:${key}`)

  const perTool = report.tools ?? []
  requireEqual(perTool.length, 21, 'report_tool_count')
  for (const tool of tools) {
    const row = perTool.find((entry) => entry.toolId === tool)
    if (!row) {
      fail(`report_missing_tool:${tool}`)
      continue
    }
    requireEqual(
      row.runtimeAdmissionDecision,
      'external_beta_runtime_admission_ready_for_worker_enqueue',
      `runtime_admission_decision:${tool}`,
    )
    requireEqual(
      row.gatewayDecision,
      'external_beta_worker_enqueue_candidate_ready',
      `gateway_decision:${tool}`,
    )
    requireTruthy(
      row.routeHandlerToGatewayContinuityAccepted,
      `continuity:${tool}`,
    )
    requireFalse(row.gpuRuntimeShouldStartNow, `gpu_should_start:${tool}`)
    requireFalse(row.routeExecutionPerformed, `route_execution_performed:${tool}`)
    requireFalse(row.workerEnqueuePerformed, `worker_enqueue_performed:${tool}`)
    requireFalse(row.workerDispatchPerformed, `worker_dispatch_performed:${tool}`)
    requireFalse(row.toolExecutionPerformed, `tool_execution_performed:${tool}`)
    if (gpuTools.has(tool)) {
      requireTruthy(
        row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
        `gpu_start_allowed_report:${tool}`,
      )
    } else {
      requireFalse(
        row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
        `gpu_start_disallowed_report:${tool}`,
      )
    }
  }
}

for (const file of requiredFiles) read(file)
verifyPackageJson()
verifyPackageLockUnchanged()
verifyTrackedArtifacts()

const doc = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.json')
const md = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.md')
const source = read('server/tool-registry/ai-graphics-external-beta-api-route-handler-gateway-full-proof.ts')
const cli = read('server/cli/ai-graphics-external-beta-api-route-handler-gateway-full-proof.ts')
const index = read('server/tool-registry/index.ts')
verifyTextSafety([
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.md',
  'server/tool-registry/ai-graphics-external-beta-api-route-handler-gateway-full-proof.ts',
  'server/cli/ai-graphics-external-beta-api-route-handler-gateway-full-proof.ts',
])

if (!source.includes('evaluateAiGraphicsExternalBetaRuntimeAdmission')) {
  fail('source_missing_runtime_admission_evaluator')
}
if (!source.includes('evaluateAiGraphicsExternalBetaToolCallGateway')) {
  fail('source_missing_tool_call_gateway_evaluator')
}
if (!source.includes('sourceRouteHandlerGatewayBindingAccepted')) {
  fail('source_missing_binding_acceptance')
}
if (!source.includes('sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence')) {
  fail('source_missing_route_bound_operator_preflight_count_gate')
}
if (!source.includes('sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence')) {
  fail('source_missing_route_bound_operator_preflight_boolean_gate')
}
if (!cli.includes('--route-handler-gateway-binding-packet')) {
  fail('cli_missing_source_packet_flag')
}
if (!index.includes("export * from './ai-graphics-external-beta-api-route-handler-gateway-full-proof'")) {
  fail('index_missing_export')
}

verifyDoc(doc, md)

const runtimeReport = parseJson(runNpm(runScriptName, [
  '--route-handler-gateway-binding-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-binding.json',
]), 'full_proof_cli')
verifyRuntimeReport(runtimeReport)

function verifyStaleGatewayBindingOperatorPreflightRejected() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-full-proof-'))
  try {
    const binding = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-binding.json')
    binding.counts = {
      ...(binding.counts ?? {}),
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence: 20,
    }
    binding.booleans = {
      ...(binding.booleans ?? {}),
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: false,
    }
    const staleBindingPath = path.join(tmpDir, 'stale-route-handler-gateway-binding.json')
    fs.writeFileSync(staleBindingPath, JSON.stringify(binding, null, 2))

    const output = parseJson(runNpm(runScriptName, [
      '--route-handler-gateway-binding-packet',
      staleBindingPath,
    ]), 'stale_gateway_binding_operator_preflight_full_proof_cli')

    requireEqual(
      output.status,
      'route_handler_gateway_binding_rejected',
      'stale_gateway_binding_operator_preflight_status',
    )
    requireEqual(
      output.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence,
      0,
      'stale_gateway_binding_operator_preflight_count',
    )
    requireFalse(
      output.booleans?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence,
      'stale_gateway_binding_operator_preflight_boolean',
    )
    requireEqual(
      output.routeHandlerGatewayFullProofToolsWithProvidedEvidence,
      0,
      'stale_gateway_binding_operator_preflight_full_proof_count',
    )
    requireFalse(
      output.booleans?.full21RouteHandlerGatewayProofReadyWithProvidedEvidence,
      'stale_gateway_binding_operator_preflight_ready_boolean',
    )
    requireFalse(output.booleans?.routeExecutionApprovedNow, 'stale_gateway_binding_operator_preflight_route_false')
    requireFalse(output.booleans?.workerEnqueuePerformed, 'stale_gateway_binding_operator_preflight_enqueue_false')
    requireFalse(output.booleans?.toolExecutionApprovedNow, 'stale_gateway_binding_operator_preflight_tool_false')
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

verifyStaleGatewayBindingOperatorPreflightRejected()

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: 21,
  runtimeAdmissionAcceptedToolsWithProvidedEvidence: 21,
  gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence: 21,
  routeHandlerToGatewayContinuityAcceptedTools: 21,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  gpuRuntimeShouldStartNowTools: 0,
  agentCanExecuteToolsNow: false,
  routeExecutionApprovedNow: false,
  workerEnqueuePerformedNow: false,
  toolExecutionApprovedNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
