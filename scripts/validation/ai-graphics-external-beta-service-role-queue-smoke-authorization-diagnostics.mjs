import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const runScriptName =
  'ai-graphics:external-beta-service-role-queue-smoke-authorization'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs'
const decision =
  'ai_graphics_external_beta_service_role_queue_smoke_authorization_prepared_with_runtime_blocks'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'

const toolProfiles = [
  ['torch_torchvision', 'torch_torchvision', ['model_runtime_foundation'], 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['transformers', 'transformers', ['model_runtime_foundation'], 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['sam2', 'sam2', ['subject_segmentation'], 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_sam2_runtime', true],
  ['birefnet', 'birefnet', ['background_removal'], 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_birefnet_runtime', true],
  ['real_esrgan', 'real_esrgan', ['upscaling'], 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_real_esrgan_runtime', true],
  ['kornia', 'kornia', ['tensor_image_ops'], 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['rembg', 'rembg', ['background_removal'], 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['transparent_background', 'transparent_background', ['background_removal'], 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['d3', 'd3', ['chart_overlay', 'data_visualization'], 'render_worker', 'node_cpu_static', false],
  ['echarts', 'echarts', ['chart_overlay', 'data_visualization'], 'render_worker', 'browser_chart_runtime_later', false],
  ['vega_lite', 'vega_lite', ['chart_overlay', 'data_visualization'], 'cpu_analysis_worker', 'node_cpu_static', false],
  ['vega', 'vega', ['chart_overlay', 'data_visualization'], 'cpu_analysis_worker', 'node_cpu_static', false],
  ['satori', 'satori', ['svg_graphics'], 'render_worker', 'node_cpu_static', false],
  ['svgdotjs_svg_js', 'svgdotjs_svg_js', ['svg_graphics'], 'render_worker', 'node_cpu_static', false],
  ['viz_js', 'viz_js', ['diagram_graphics'], 'render_worker', 'node_cpu_static', false],
  ['lottie_web', 'lottie', ['animation_overlay'], 'render_worker', 'browser_animation_runtime_later', false],
  ['animejs', 'animejs', ['animation_overlay'], 'render_worker', 'browser_animation_runtime_later', false],
  ['three_js', 'three_js', ['webgl_3d_scene'], 'render_worker', 'browser_canvas_webgl_runtime_later', false],
  ['pixi_js', 'pixijs', ['canvas_scene'], 'render_worker', 'browser_canvas_webgl_runtime_later', false],
  ['konva', 'konva', ['canvas_scene'], 'render_worker', 'browser_canvas_webgl_runtime_later', false],
  ['babylonjs', 'babylon_js', ['webgl_3d_scene'], 'render_worker', 'browser_canvas_webgl_runtime_later', false],
]

const allTools = toolProfiles.map(([toolId]) => toolId)
const gpuTools = toolProfiles.filter((profile) => profile[5]).map(([toolId]) => toolId)

const falseBooleanKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'serviceRoleQueueTransactionApprovedNow',
  'serviceRoleQueueSmokeApprovedNow',
  'liveServiceRoleQueueSmokeExecutedNow',
  'liveQueueWriteApprovedNow',
  'liveJobBatchInsertApprovedNow',
  'liveJobInsertApprovedNow',
  'liveWorkerClaimInsertApprovedNow',
  'liveWorkerEventInsertApprovedNow',
  'liveAuditEventInsertApprovedNow',
  'workerLeaseCreationApprovedNow',
  'workerDispatchApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts',
  'server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts',
  'scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.md',
  'docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json',
  'docs/production-beta-readiness-scorecard.md',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${filePath}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(filePath) {
  const content = read(filePath)
  if (!content) return {}
  try {
    return JSON.parse(content)
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function writeJson(root, filename, value) {
  const filePath = path.join(root, filename)
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function assertFalseBooleans(report, label) {
  for (const key of falseBooleanKeys) {
    if (report.booleans?.[key] !== false) {
      fail(`${label}_boolean_${key}_not_false:${report.booleans?.[key]}`)
    }
  }
}

function assertCounts(report, label, expectedRecorded, expectedGpuStartAllowed) {
  if (report.totalAiGraphicsTools !== 21) fail(`${label}_total_tools_not_21`)
  if (report.totalProductFacingCapabilities !== 12) fail(`${label}_capabilities_not_12`)
  if (report.sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence !== 21) {
    fail(`${label}_source_live_enqueue_recorded_not_21`)
  }
  if (report.sourceServiceRoleQueueSmokeReadinessAcceptedWithProvidedEvidenceRequests !== 1) {
    fail(`${label}_readiness_request_not_1`)
  }
  if (report.sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidenceRequests !== 1) {
    fail(`${label}_preflight_request_not_1`)
  }
  if (report.serviceRoleQueueSmokeAuthorizationCandidateToolsWithProvidedEvidence !== 21) {
    fail(`${label}_candidate_scope_count_not_21`)
  }
  if (report.serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence !== expectedRecorded) {
    fail(`${label}_recorded_scope_count_expected_${expectedRecorded}_got_${report.serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence}`)
  }
  if (report.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_targeted_not_8`)
  if (report.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools !== expectedGpuStartAllowed) {
    fail(`${label}_gpu_start_allowed_expected_${expectedGpuStartAllowed}_got_${report.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools}`)
  }
  for (const key of [
    'heavyToolsIncorrectlyTargetingCpu',
    'serviceRoleQueueSmokeApprovedNowTools',
    'liveQueueWritesApprovedNowTools',
    'liveQueueWritesPerformedNowTools',
    'workerDispatchApprovedNowTools',
    'toolExecutionApprovedNowTools',
    'externalBetaReadyNowTools',
    'productionReadyNowTools',
  ]) {
    if (report[key] !== 0) fail(`${label}_${key}_not_0:${report[key]}`)
  }
}

function assertScopes(report, label, expectedRecorded, expectedGpuStartAllowed) {
  const scopes = Array.isArray(report.toolScopes) ? report.toolScopes : []
  if (scopes.length !== 21) fail(`${label}_scope_count_not_21:${scopes.length}`)
  for (const toolId of allTools) {
    if (!scopes.some((scope) => scope.toolId === toolId)) {
      fail(`${label}_missing_tool_scope:${toolId}`)
    }
  }
  const recorded = scopes.filter(
    (scope) => scope.serviceRoleQueueSmokeAuthorizationRecordedWithProvidedEvidence,
  )
  if (recorded.length !== expectedRecorded) {
    fail(`${label}_recorded_scopes_expected_${expectedRecorded}_got_${recorded.length}`)
  }
  const gpuStartAllowed = scopes.filter(
    (scope) => scope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  )
  if (gpuStartAllowed.length !== expectedGpuStartAllowed) {
    fail(`${label}_gpu_start_allowed_expected_${expectedGpuStartAllowed}_got_${gpuStartAllowed.length}`)
  }
  for (const toolId of gpuTools) {
    const scope = scopes.find((item) => item.toolId === toolId)
    if (!scope?.gpuRequiredForRuntime) fail(`${label}_gpu_tool_not_targeted:${toolId}`)
    if (scope?.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_gpu_should_start_now_not_false:${toolId}`)
    }
  }
}

function liveEnqueueAuthorizationFixture() {
  const toolScopes = toolProfiles.map(([
    toolId,
    productionToolId,
    capabilityIds,
    workerType,
    runtimeTarget,
    gpuRequiredForRuntime,
  ]) => ({
    toolId,
    productionToolId,
    workerType,
    runtimeTarget,
    capabilityIds,
    gpuRequiredForRuntime,
    controlledRuntimeActivationPolicy: gpuRequiredForRuntime ? {
      onDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
    } : null,
    sourceControlledRuntimeExecutionScopeApprovedWithProvidedEvidence: true,
    sourceRuntimeQueueServiceBridgeAcceptedWithProvidedEvidence: true,
    liveEnqueueAuthorizationCandidateWithProvidedEvidence: true,
    liveEnqueueAuthorizationRecordedWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuRequiredForRuntime,
    gpuRuntimeShouldStartNow: false,
    liveQueueWriteApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
  }))
  return {
    decision: 'ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks',
    status: 'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: 21,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    liveQueueWritesApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    toolScopes,
    booleans: {
      all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence: true,
      gpuHeavyToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      gpuRuntimeShouldStartNow: false,
      liveQueueWriteApprovedNow: false,
      workerDispatchPerformed: false,
      agentCanExecuteToolsNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function serviceRoleQueueSmokeReadinessFixture() {
  return {
    sourceDecision:
      'ai_graphics_external_beta_service_role_queue_smoke_readiness_prepared_with_runtime_blocks',
    decision: 'external_beta_service_role_queue_smoke_prepared_not_executed',
    sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted: true,
    externalBetaServiceRoleQueueSmokeControlsSatisfied: true,
    serviceRoleQueueSmokePreparedWithProvidedEvidence: true,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted: true,
      serviceRoleQueueSmokePreparedWithProvidedEvidence: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      serviceRoleCredentialsServerOnly: true,
      liveServiceRoleQueueSmokeExecutedNow: false,
      liveQueueWriteApprovedNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
      agentCanExecuteToolsNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function serviceRoleQueueSmokePreflightFixture() {
  return {
    decision:
      'ai_graphics_external_beta_service_role_queue_smoke_preflight_prepared_with_environment_blocks',
    status: 'ready_to_execute_non_production_service_role_queue_smoke',
    toolsCovered: 21,
    productFacingCapabilitiesCovered: 12,
    gpuRuntimeTargetedTools: 8,
    all21PayloadsPrepared: true,
    sourceRuntimeQueueServiceProofBridgeAccepted: true,
    readyToExecuteLiveNonProductionSmoke: true,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      requiredEnvironmentSatisfied: true,
      requiredFlagsSatisfied: true,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      readyToExecuteLiveNonProductionSmoke: true,
      secretsRedactedFromOutput: true,
      serviceRoleCredentialsServerOnly: true,
      liveServiceRoleQueueSmokeExecutedNow: false,
      liveQueueWriteApprovedNow: false,
      serviceRoleQueueSmokePerformed: false,
      supabaseMutationPerformed: false,
      gpuRuntimeShouldStartNow: false,
      agentCanExecuteToolsNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

for (const filePath of requiredFiles) read(filePath)

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const pkg = json('package.json')
const source = read('server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts')
const cli = read('server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts')
const index = read('server/tool-registry/index.ts')

if (docs.decision !== decision) fail(`docs_decision_unexpected:${docs.decision}`)
if (docs.interfaces?.packageScript !== runScriptName) fail('docs_package_script_missing')
if (docs.interfaces?.diagnosticScript !== diagnosticScriptName) {
  fail('docs_diagnostic_script_missing')
}
if (!docsMd.includes(decision)) fail('markdown_missing_decision')
if (!scorecard.includes(decision)) fail('scorecard_missing_service_role_smoke_authorization')
if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_missing')
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_missing')
}
if (!index.includes("export * from './ai-graphics-external-beta-service-role-queue-smoke-authorization'")) {
  fail('index_export_missing')
}
if (!source.includes('external_beta_service_role_queue_smoke_authorization_recorded_execution_still_blocked')) {
  fail('source_missing_recorded_status')
}
if (!source.includes('AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR')) {
  fail('source_missing_operator_role')
}
if (!source.includes('serviceRoleQueueSmokeApprovedNow: false')) {
  fail('source_missing_smoke_now_block')
}
if (!source.includes('liveQueueWriteApprovedNow: false')) {
  fail('source_missing_live_queue_write_block')
}
if (!cli.includes('--external-beta-live-enqueue-authorization-packet')) {
  fail('cli_missing_live_enqueue_packet_flag')
}
if (!cli.includes('--external-beta-service-role-queue-smoke-authorization-granted')) {
  fail('cli_missing_authorization_granted_flag')
}

for (const toolId of allTools) {
  if (!docs.tools?.includes(toolId)) fail(`docs_missing_tool:${toolId}`)
}
for (const toolId of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(toolId)) {
    fail(`docs_missing_gpu_tool:${toolId}`)
  }
}
if (docs.counts?.serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence !== 21) {
  fail('docs_recorded_scope_count_not_21')
}
if (docs.counts?.serviceRoleQueueSmokeApprovedNowTools !== 0) {
  fail('docs_smoke_approved_now_not_0')
}
if (docs.counts?.liveQueueWritesApprovedNowTools !== 0) {
  fail('docs_live_queue_write_approved_now_not_0')
}
if (docs.counts?.externalBetaReadyNowTools !== 0) {
  fail('docs_external_beta_ready_now_not_0')
}
if (docs.authorizationScope?.serviceRoleQueueSmokeNow !== false) {
  fail('docs_scope_allows_service_role_smoke_now')
}
if (docs.authorizationScope?.liveQueueWriteNow !== false) {
  fail('docs_scope_allows_live_queue_write_now')
}
for (const key of falseBooleanKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_boolean_${key}_not_false`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-smoke-auth-'))
const liveEnqueuePath = writeJson(
  tmpRoot,
  'live-enqueue-authorization.json',
  liveEnqueueAuthorizationFixture(),
)
const readinessPath = writeJson(
  tmpRoot,
  'service-role-queue-smoke-readiness.json',
  serviceRoleQueueSmokeReadinessFixture(),
)
const preflightPath = writeJson(
  tmpRoot,
  'service-role-queue-smoke-preflight.json',
  serviceRoleQueueSmokePreflightFixture(),
)

const missingLive = parseJsonOutput(runNpm(runScriptName), 'missing_live')
if (missingLive.status !== 'missing_external_beta_live_enqueue_authorization') {
  fail(`missing_live_status_unexpected:${missingLive.status}`)
}

const awaiting = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-live-enqueue-authorization-packet',
  liveEnqueuePath,
  '--external-beta-service-role-queue-smoke-readiness-packet',
  readinessPath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  preflightPath,
]), 'awaiting')
if (awaiting.status !== 'awaiting_external_beta_service_role_queue_smoke_authorization') {
  fail(`awaiting_status_unexpected:${awaiting.status}`)
}
assertCounts(awaiting, 'awaiting', 0, 0)
assertScopes(awaiting, 'awaiting', 0, 0)
assertFalseBooleans(awaiting, 'awaiting')

const accepted = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-live-enqueue-authorization-packet',
  liveEnqueuePath,
  '--external-beta-service-role-queue-smoke-readiness-packet',
  readinessPath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  preflightPath,
  '--external-beta-service-role-queue-smoke-authorization-granted',
  '--external-beta-service-role-queue-smoke-authorization-ref',
  'external-beta-service-role-smoke://authorization/diagnostic',
  '--external-beta-service-role-queue-smoke-operator-role',
  'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR',
  '--external-beta-service-role-queue-smoke-readiness-ref',
  'external-beta-service-role-smoke://readiness/diagnostic',
  '--external-beta-service-role-queue-smoke-preflight-ref',
  'external-beta-service-role-smoke://preflight/diagnostic',
  '--external-beta-non-production-environment-ref',
  'external-beta-service-role-smoke://environment/non-production-diagnostic',
  '--external-beta-queue-write-window-ref',
  'external-beta-service-role-smoke://queue-window/non-production-diagnostic',
  '--external-beta-cleanup-plan-ref',
  'external-beta-service-role-smoke://cleanup/non-production-diagnostic',
  '--external-beta-rollback-plan-ref',
  'external-beta-service-role-smoke://rollback/non-production-diagnostic',
  '--external-beta-telemetry-ref',
  'external-beta-service-role-smoke://telemetry/non-production-diagnostic',
  '--external-beta-cost-ceiling-ref',
  'external-beta-service-role-smoke://cost-ceiling/non-production-diagnostic',
]), 'accepted')
if (accepted.decision !== decision) fail(`accepted_decision_unexpected:${accepted.decision}`)
if (accepted.status !== 'external_beta_service_role_queue_smoke_authorization_recorded_execution_still_blocked') {
  fail(`accepted_status_unexpected:${accepted.status}`)
}
assertCounts(accepted, 'accepted', 21, 8)
assertScopes(accepted, 'accepted', 21, 8)
assertFalseBooleans(accepted, 'accepted')
if (accepted.serviceRoleQueueSmokeAuthorizationRecord?.authorizesServiceRoleQueueSmokeNow !== false) {
  fail('accepted_record_authorizes_smoke_now')
}
if (accepted.serviceRoleQueueSmokeAuthorizationRecord?.authorizesLiveQueueWriteNow !== false) {
  fail('accepted_record_authorizes_live_queue_write_now')
}
if (accepted.booleans?.sourceExternalBetaLiveEnqueueAuthorizationAccepted !== true) {
  fail('accepted_live_enqueue_source_not_accepted')
}
if (accepted.booleans?.sourceExternalBetaServiceRoleQueueSmokeReadinessAccepted !== true) {
  fail('accepted_readiness_source_not_accepted')
}
if (accepted.booleans?.sourceExternalBetaServiceRoleQueueSmokePreflightAccepted !== true) {
  fail('accepted_preflight_source_not_accepted')
}
if (accepted.booleans?.all21ServiceRoleQueueSmokeAuthorizationScopesRecordedWithProvidedEvidence !== true) {
  fail('accepted_scopes_not_recorded')
}

const changedFiles = git(['diff', '--name-only', baseRef])
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean)

if (git(['diff', '--name-only', '--', 'package-lock.json'])) {
  fail('package_lock_changed')
}
if (git(['ls-files', '.local-artifacts'])) fail('local_artifacts_tracked')
if (changedFiles.some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_changed')
}
for (const filePath of changedFiles) {
  if (
    /(^|\/)(generated|render|browser|canvas|webgl|public|signed-url|media-output|video-output|image-output)(\/|$)/i.test(filePath)
  ) {
    fail(`generated_or_public_output_changed:${filePath}`)
  }
}

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch {
  basePackage = {}
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-api-route-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (line.startsWith('+    "ai-graphics:') && !allowedPackageAdditions.has(line)) {
    fail(`unexpected_package_json_diff:${line}`)
  }
}

for (const filePath of [
  'server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts',
  'server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.md',
  'docs/production-beta-readiness-scorecard.md',
]) {
  const content = read(filePath)
  for (const pattern of [
    /agentCanExecuteToolsNow["':\s]+true/,
    /serviceRoleQueueSmokeApprovedNow["':\s]+true/,
    /liveQueueWriteApprovedNow["':\s]+true/,
    /workerDispatchApprovedNow["':\s]+true/,
    /toolExecutionApprovedNow["':\s]+true/,
    /providerRuntimeApprovedNow["':\s]+true/,
    /browserWebglCanvasRuntimeApprovedNow["':\s]+true/,
    /gpuRuntimeApprovedNow["':\s]+true/,
    /runtimeReadyNow["':\s]+true/,
    /internalBetaReadyNow["':\s]+true/,
    /externalBetaReadyNow["':\s]+true/,
    /productionReadyNow["':\s]+true/,
    /serviceRoleQueueSmokePerformed["':\s]+true/,
    /supabaseMutationPerformed["':\s]+true/,
    /workerDispatchPerformed["':\s]+true/,
    /gpuRuntimePerformed["':\s]+true/,
    /publicArtifactCreated["':\s]+true/,
    /signedUrlCreated["':\s]+true/,
    /dry_run_passed/,
    /generated_local_fixture_passed/,
  ]) {
    if (pattern.test(content)) fail(`banned_runtime_claim:${filePath}:${pattern}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    decision,
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  checkedTools: allTools.length,
  gpuRuntimeTargetedTools: gpuTools.length,
  serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence:
    accepted.serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence,
  serviceRoleQueueSmokeApprovedNowTools:
    accepted.serviceRoleQueueSmokeApprovedNowTools,
  liveQueueWritesApprovedNowTools:
    accepted.liveQueueWritesApprovedNowTools,
  liveQueueWritesPerformedNowTools:
    accepted.liveQueueWritesPerformedNowTools,
  gpuRuntimeShouldStartNow: accepted.booleans.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: accepted.externalBetaReadyNowTools,
  productionReadyNowTools: accepted.productionReadyNowTools,
}, null, 2))
