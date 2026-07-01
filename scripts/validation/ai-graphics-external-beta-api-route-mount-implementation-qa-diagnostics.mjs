import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_api_route_mount_implementation_qa_passed_with_runtime_blocks'
const acceptedStatus =
  'route_mount_implementation_qa_passed_runtime_still_blocked'
const sourceDecision =
  'ai_graphics_external_beta_api_route_mount_implementation_review_prepared_with_runtime_blocks'
const sourceStatus =
  'route_mount_implementation_review_ready_runtime_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-api-route-mount-implementation-qa'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-mount-implementation-qa.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-mount-implementation-qa:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-mount-implementation-qa-diagnostics.mjs'

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/tool-registry/ai-graphics-external-beta-api-route-mount-implementation-qa.ts',
  'server/cli/ai-graphics-external-beta-api-route-mount-implementation-qa.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-mount-implementation-qa-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-review.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.json',
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

const trueKeys = [
  'externalBetaApiRouteMountImplementationQaCompleted',
  'sourceRouteMountImplementationReviewAccepted',
  'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence',
  'routeImplementationContractQaAccepted',
  'routeSchemaAll21ToolsQaAccepted',
  'routeSchemaAll12CapabilitiesQaAccepted',
  'disabledRuntimeHandlerQaAccepted',
  'appMountStillDeferred',
  'appRouteImportStillAbsent',
  'noRuntimeSideEffectsQaAccepted',
  'routeMountImplementationQaAcceptedWithProvidedEvidence',
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

function verifySourceImplementationReview() {
  const source = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-review.json')
  requireEqual(source.decision, sourceDecision, 'source_review_decision')
  requireEqual(source.status, sourceStatus, 'source_review_status')
  requireEqual(countFrom(source, 'apiRouteMountImplementationReadyToolsWithProvidedEvidence'), 21, 'source_impl_ready_count')
  requireEqual(countFrom(source, 'apiRouteMountReadyToolsWithProvidedEvidence'), 21, 'source_route_mount_ready_count')
  requireEqual(
    countFrom(source, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence'),
    21,
    'source_route_bound_operator_preflight_count',
  )
  requireEqual(countFrom(source, 'runtimeAdmissionAcceptedToolsWithProvidedEvidence'), 21, 'source_runtime_admission_count')
  requireEqual(countFrom(source, 'gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence'), 21, 'source_gateway_candidate_count')
  requireEqual(countFrom(source, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools'), 8, 'source_gpu_allowed_count')
  requireEqual(countFrom(source, 'gpuRuntimeShouldStartNowTools'), 0, 'source_gpu_start_now_count')
  requireEqual(countFrom(source, 'apiRouteMountedNowTools'), 0, 'source_route_mounted_count')
  requireEqual(countFrom(source, 'routeExecutionsApprovedNow'), 0, 'source_route_execution_count')
  requireEqual(countFrom(source, 'externalBetaReadyNowTools'), 0, 'source_external_beta_count')
  requireEqual(countFrom(source, 'productionReadyNowTools'), 0, 'source_production_count')
  requireTruthy(source.booleans?.sourceControlledRouteImplementationReviewed, 'source_impl_reviewed_boolean')
  requireTruthy(
    source.booleans?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence,
    'source_route_bound_operator_preflight_boolean',
  )
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
  requireEqual(doc.counts?.routeMountImplementationQaAcceptedToolsWithProvidedEvidence, 21, 'doc_qa_count')
  requireEqual(doc.counts?.apiRouteMountImplementationReadyToolsWithProvidedEvidence, 21, 'doc_impl_ready_count')
  requireEqual(doc.counts?.apiRouteMountReadyToolsWithProvidedEvidence, 21, 'doc_mount_ready_count')
  requireEqual(
    doc.counts?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence,
    21,
    'doc_route_bound_operator_preflight_count',
  )
  requireEqual(doc.counts?.runtimeAdmissionAcceptedToolsWithProvidedEvidence, 21, 'doc_runtime_admission_count')
  requireEqual(doc.counts?.gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence, 21, 'doc_gateway_candidate_count')
  requireEqual(doc.counts?.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools, 8, 'doc_gpu_allowed_count')
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
  requireEqual(
    doc.routeImplementationQa?.routeFile,
    'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
    'doc_route_file',
  )
  requireEqual(
    doc.routeImplementationQa?.routePath,
    '/api/ai-graphics/external-beta/tool-call',
    'doc_route_path',
  )
  requireTruthy(doc.routeImplementationQa?.routeSchemaCoversAll21Tools, 'doc_route_schema_tools')
  requireTruthy(doc.routeImplementationQa?.routeSchemaCoversAll12Capabilities, 'doc_route_schema_capabilities')
  requireFalse(doc.routeImplementationQa?.mountedInAppNow, 'doc_mounted_false')
  requireTruthy(doc.routeImplementationQa?.appImportStillAbsent, 'doc_app_import_absent')
  requireTruthy(doc.routeImplementationQa?.disabledRuntimeHandlerOnly, 'doc_disabled_handler')
  requireTruthy(doc.routeImplementationQa?.throwsBeforeQueueWorkerToolGpuOrArtifactSideEffects, 'doc_throws_before_side_effects')
  requireTruthy(doc.implementationQaPolicy?.appMountDeferred, 'doc_app_mount_deferred')
  requireTruthy(doc.implementationQaPolicy?.runtimeHandlerDisabled, 'doc_runtime_handler_disabled')
  requireTruthy(doc.implementationQaPolicy?.queueWriteDeferred, 'doc_queue_write_deferred')
  requireTruthy(doc.implementationQaPolicy?.toolExecutionDeferred, 'doc_tool_deferred')
  requireTruthy(doc.implementationQaPolicy?.onDemandGpuOnly, 'doc_on_demand_gpu')
  for (const action of [
    'app route mount',
    'API route execution',
    'live queue write',
    'Worker execution',
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
  const source = read('server/tool-registry/ai-graphics-external-beta-api-route-mount-implementation-qa.ts')
  const cli = read('server/cli/ai-graphics-external-beta-api-route-mount-implementation-qa.ts')
  const index = read('server/tool-registry/index.ts')
  const scorecard = read('docs/production-beta-readiness-scorecard.md')

  requireIncludes(route, 'createAiGraphicsExternalBetaToolCallRoutes', 'route_factory')
  requireIncludes(route, 'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH', 'route_path_constant')
  requireIncludes(route, '/api/ai-graphics/external-beta/tool-call', 'route_path')
  requireIncludes(route, 'aiGraphicsExternalBetaToolCallRequestSchema', 'route_schema')
  requireIncludes(route, 'TOOL_NOT_READY', 'route_disabled_error')
  requireIncludes(route, 'routeMountedByAppNow: true', 'route_detail_mounted_true_when_handler_runs')
  requireIncludes(route, 'routeMountFeatureFlagEnabled: true', 'route_detail_feature_flag_true_when_handler_runs')
  requireIncludes(route, 'externalAgentExecutionGateRequired: true', 'route_detail_external_agent_gate_required')
  requireIncludes(route, 'properInstallAuditAcceptedToolsWithProvidedEvidence: 21', 'route_detail_install_audit_count')
  requireIncludes(route, 'controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence: 21', 'route_detail_controlled_on_demand_count')
  requireIncludes(route, 'controlledOnDemandWorkerPathReadyButDirectAgentExecutionBlocked: true', 'route_detail_direct_agent_blocked')
  requireIncludes(route, 'directAgentToolExecutionApprovedNow: false', 'route_detail_direct_agent_execution_false')
  requireIncludes(route, 'gpuRuntimeShouldStartNow: false', 'route_detail_gpu_false')
  requireIncludes(route, 'externalBetaReadyNow: false', 'route_detail_external_false')
  for (const tool of tools) requireIncludes(route, `'${tool}'`, `route_tool:${tool}`)
  for (const capability of capabilities) {
    requireIncludes(route, `'${capability}'`, `route_capability:${capability}`)
  }
  requireIncludes(app, 'createAiGraphicsExternalBetaToolCallRoutes', 'app_imported_route_factory')
  requireIncludes(app, 'ai-graphics-external-beta-tool-call-routes', 'app_imported_route_file')
  requireIncludes(app, 'env.aiGraphicsExternalBetaToolCallRouteMountEnabled', 'app_feature_flag_gate')
  requireIncludes(app, 'app.use(createAiGraphicsExternalBetaToolCallRoutes())', 'app_gated_route_mount')
  requireIncludes(source, 'evaluateAiGraphicsExternalBetaApiRouteMountImplementationQa', 'source_evaluator')
  requireIncludes(
    source,
    'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence',
    'source_route_bound_operator_preflight_count',
  )
  requireIncludes(
    source,
    'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence',
    'source_route_bound_operator_preflight_boolean',
  )
  requireIncludes(source, 'appMountStillDeferred: true', 'source_app_mount_deferred')
  requireIncludes(source, 'apiRouteMountedNow: false', 'source_route_mounted_false')
  requireIncludes(source, 'gpuRuntimeShouldStartNow: false', 'source_gpu_false')
  requireIncludes(cli, '--route-mount-implementation-review-packet', 'cli_source_packet_flag')
  requireIncludes(index, "export * from './ai-graphics-external-beta-api-route-mount-implementation-qa'", 'index_export')
  requireIncludes(scorecard, decision, 'scorecard_decision')
  requireIncludes(scorecard, 'routeMountImplementationQaAcceptedToolsWithProvidedEvidence=21', 'scorecard_qa_count')
  requireIncludes(
    markdown,
    'Route-bound service-role queue smoke operator-preflight accepted: `21`',
    'markdown_route_bound_operator_preflight_count',
  )
  requireIncludes(scorecard, 'apiRouteMountedNowTools=0', 'scorecard_route_mounted_zero')
}

function verifyRuntimeReport(report) {
  requireEqual(report.decision, decision, 'runtime_decision')
  requireEqual(report.status, acceptedStatus, 'runtime_status')
  requireEqual(report.totalAiGraphicsTools, 21, 'runtime_tool_count')
  requireEqual(report.totalProductFacingCapabilities, 12, 'runtime_capability_count')
  requireEqual(report.gpuRuntimeTargetedTools, 8, 'runtime_gpu_count')
  requireEqual(report.routeMountImplementationQaAcceptedToolsWithProvidedEvidence, 21, 'runtime_qa_count')
  requireEqual(report.apiRouteMountImplementationReadyToolsWithProvidedEvidence, 21, 'runtime_impl_ready_count')
  requireEqual(report.apiRouteMountReadyToolsWithProvidedEvidence, 21, 'runtime_mount_ready_count')
  requireEqual(
    report.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence,
    21,
    'runtime_route_bound_operator_preflight_count',
  )
  requireEqual(report.runtimeAdmissionAcceptedToolsWithProvidedEvidence, 21, 'runtime_admission_count')
  requireEqual(report.gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence, 21, 'runtime_gateway_count')
  requireEqual(report.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools, 8, 'runtime_gpu_allowed_count')
  requireEqual(report.gpuRuntimeShouldStartNowTools, 0, 'runtime_gpu_start_now_count')
  requireEqual(report.apiRouteMountedNowTools, 0, 'runtime_route_mounted_count')
  requireEqual(report.routeExecutionsApprovedNow, 0, 'runtime_route_execution_count')
  requireEqual(report.liveQueueWriteApprovedNowTools, 0, 'runtime_live_queue_count')
  requireEqual(report.workerEnqueueApprovedNowTools, 0, 'runtime_worker_enqueue_count')
  requireEqual(report.toolExecutionsApprovedNow, 0, 'runtime_tool_execution_count')
  requireEqual(report.externalBetaReadyNowTools, 0, 'runtime_external_beta_count')
  requireEqual(report.productionReadyNowTools, 0, 'runtime_production_count')
  requireFalse(report.routeImplementationQa?.mountedInAppNow, 'runtime_mounted_false')
  requireTruthy(report.routeImplementationQa?.disabledRuntimeHandlerOnly, 'runtime_disabled_handler')
  for (const key of trueKeys) requireTruthy(report.booleans?.[key], `runtime_boolean_true:${key}`)
  for (const key of falseKeys) requireFalse(report.booleans?.[key], `runtime_boolean_false:${key}`)
}

function verifyStaleImplementationReviewOperatorPreflightRejected() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-route-qa-stale-impl-'))
  const stalePacketPath = path.join(tempDir, 'stale-route-mount-implementation-review.json')
  try {
    const source = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-review.json')
    const stale = JSON.parse(JSON.stringify(source))
    stale.counts = {
      ...(stale.counts ?? {}),
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence: 20,
    }
    stale.booleans = {
      ...(stale.booleans ?? {}),
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: false,
    }
    fs.writeFileSync(stalePacketPath, JSON.stringify(stale, null, 2))

    const report = parseJson(runNpm(runScriptName, [
      '--route-mount-implementation-review-packet',
      stalePacketPath,
    ]), 'stale_route_mount_implementation_qa_cli')

    requireEqual(report.status, 'route_mount_implementation_review_rejected', 'stale_status')
    requireFalse(
      report.sourceRouteMountImplementationReviewAccepted,
      'stale_source_implementation_review_rejected',
    )
    requireFalse(
      report.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence,
      'stale_route_bound_operator_preflight_rejected',
    )
    requireEqual(
      report.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence,
      0,
      'stale_route_bound_operator_preflight_count_zero',
    )
    requireEqual(
      report.routeMountImplementationQaAcceptedToolsWithProvidedEvidence,
      0,
      'stale_qa_ready_zero',
    )
    requireFalse(
      report.booleans?.routeMountImplementationQaAcceptedWithProvidedEvidence,
      'stale_qa_ready_false',
    )
    requireFalse(report.booleans?.agentCanExecuteToolsNow, 'stale_agent_execute_false')
    requireFalse(report.booleans?.apiRouteMountedNow, 'stale_route_mounted_false')
    requireFalse(report.booleans?.apiRouteExecutionApprovedNow, 'stale_route_execute_false')
    requireFalse(report.booleans?.workerExecutionApprovedNow, 'stale_worker_execute_false')
    requireFalse(report.booleans?.toolExecutionApprovedNow, 'stale_tool_execute_false')
    requireFalse(report.booleans?.gpuRuntimeShouldStartNow, 'stale_gpu_start_false')
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
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
verifySourceImplementationReview()

const doc = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json')
const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.md')
verifyDoc(doc, markdown)
verifySourceFiles()
verifyTextSafety([
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.md',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/tool-registry/ai-graphics-external-beta-api-route-mount-implementation-qa.ts',
  'server/cli/ai-graphics-external-beta-api-route-mount-implementation-qa.ts',
])

const runtimeReport = parseJson(runNpm(runScriptName, [
  '--route-mount-implementation-review-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-review.json',
]), 'route_mount_implementation_qa_cli')
verifyRuntimeReport(runtimeReport)
verifyStaleImplementationReviewOperatorPreflightRejected()

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  routeMountImplementationQaAcceptedToolsWithProvidedEvidence: 21,
  apiRouteMountImplementationReadyToolsWithProvidedEvidence: 21,
  apiRouteMountReadyToolsWithProvidedEvidence: 21,
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence: 21,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  gpuRuntimeShouldStartNowTools: 0,
  apiRouteMountedNowTools: 0,
  routeExecutionsApprovedNow: 0,
  liveQueueWriteApprovedNowTools: 0,
  workerEnqueueApprovedNowTools: 0,
  toolExecutionsApprovedNow: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  appMountStillDeferred: true,
  agentCanExecuteToolsNow: false,
}, null, 2))
