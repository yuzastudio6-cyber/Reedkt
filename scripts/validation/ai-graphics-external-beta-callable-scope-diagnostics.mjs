import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const runScriptName = 'ai-graphics:external-beta-callable-scope'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-callable-scope.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-callable-scope:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-callable-scope-diagnostics.mjs'
const decision = 'ai_graphics_external_beta_callable_scope_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_callable_scope_candidate_recorded_runtime_still_blocked'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'

const allTools = [
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

const capabilityIdsForTool = (toolId) => {
  const known = {
    torch_torchvision: ['model_runtime_foundation', 'tensor_image_ops'],
    transformers: ['model_runtime_foundation'],
    sam2: ['subject_segmentation', 'background_removal'],
    birefnet: ['background_removal'],
    real_esrgan: ['upscaling'],
    kornia: ['tensor_image_ops'],
    rembg: ['background_removal'],
    transparent_background: ['background_removal'],
    d3: ['chart_overlay', 'data_visualization', 'svg_graphics'],
    echarts: ['chart_overlay', 'data_visualization'],
    vega_lite: ['chart_overlay', 'data_visualization'],
    vega: ['chart_overlay', 'data_visualization'],
    satori: ['svg_graphics'],
    svgdotjs_svg_js: ['svg_graphics'],
    viz_js: ['diagram_graphics'],
    lottie_web: ['animation_overlay'],
    animejs: ['animation_overlay'],
    three_js: ['webgl_3d_scene'],
    pixi_js: ['canvas_scene'],
    konva: ['canvas_scene'],
    babylonjs: ['webgl_3d_scene'],
  }
  return known[toolId] ?? ['planning_metadata_only']
}

const falseBooleanKeys = [
  'agentCanExecuteToolsNow',
  'externalBetaCallableNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-callable-scope.ts',
  'server/cli/ai-graphics-external-beta-callable-scope.ts',
  'scripts/validation/ai-graphics-external-beta-callable-scope-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-scope.json',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-scope.md',
  'docs/production-beta-readiness-scorecard.md',
  'server/tool-registry/index.ts',
  'package.json',
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
  try {
    return JSON.parse(read(filePath))
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

function writeTempJson(root, filename, value) {
  const filePath = path.join(root, filename)
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function workerTypeForTool(toolId) {
  return gpuTools.includes(toolId) ? 'gpu_ai_worker' : 'render_worker'
}

function runtimeTargetForTool(toolId) {
  if (toolId === 'sam2') return 'native_linux_amd64_nvidia_l4_sam2_runtime'
  if (toolId === 'birefnet') return 'native_linux_amd64_nvidia_l4_birefnet_runtime'
  if (toolId === 'real_esrgan') return 'native_linux_amd64_nvidia_l4_real_esrgan_runtime'
  return gpuTools.includes(toolId)
    ? 'native_linux_amd64_nvidia_l4_gpu_worker'
    : 'node_cpu_static'
}

function sourceLiveScope(toolId) {
  const gpuRequiredForRuntime = gpuTools.includes(toolId)
  return {
    toolId,
    productionToolId: `ai_graphics.${toolId}`,
    workerType: workerTypeForTool(toolId),
    runtimeTarget: runtimeTargetForTool(toolId),
    capabilityIds: capabilityIdsForTool(toolId),
    gpuRequiredForRuntime,
    controlledRuntimeActivationPolicy: gpuRequiredForRuntime
      ? {
        onDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        startsOnlyForApprovedWorkerOrToolCall: true,
        cpuFallbackAllowedForHeavyTools: false,
      }
      : null,
    sourceControlledRuntimeExecutionScopeApprovedWithProvidedEvidence: true,
    sourceRuntimeQueueServiceBridgeAcceptedWithProvidedEvidence: true,
    liveEnqueueAuthorizationCandidateWithProvidedEvidence: true,
    liveEnqueueAuthorizationRecordedWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuRequiredForRuntime,
    gpuRuntimeShouldStartNow: false,
    liveQueueWriteApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    nextExternalBetaMilestone:
      'run non-production live queue write smoke after explicit service-role owner gate',
  }
}

function launchGoNoGoFixture() {
  return {
    decision: 'ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks',
    status: 'external_beta_launch_go_no_go_approved_runtime_still_blocked',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeOnDemandOnly: true,
    externalBetaLaunchCandidateToolsWithProvidedEvidence: 21,
    externalBetaLaunchCandidateCapabilitiesWithProvidedEvidence: 12,
    externalBetaLaunchGoNoGoApprovalRecordAccepted: true,
    sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted: true,
    externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence: 21,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      sourceExternalBetaServiceRoleQueueSmokeProofAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      sourceExternalBetaLaunchControlsAccepted: true,
      all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence: true,
      agentCanExecuteToolsNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function liveEnqueueAuthorizationFixture() {
  return {
    decision: 'ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks',
    status: 'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    controlledRuntimeExecutionApprovedToolsWithProvidedEvidence: 21,
    runtimeQueueServiceBridgeAcceptedWithProvidedEvidenceRequests: 1,
    liveEnqueueAuthorizationCandidateToolsWithProvidedEvidence: 21,
    liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: 21,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    heavyToolsIncorrectlyTargetingCpu: 0,
    liveQueueWritesApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerDispatchApprovedNowTools: 0,
    toolExecutionApprovedNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    toolScopes: allTools.map(sourceLiveScope),
    booleans: {
      sourceControlledRuntimeExecutionApprovalAccepted: true,
      sourceRuntimeQueueServiceBridgeAccepted: true,
      liveEnqueueAuthorizationRecordAccepted: true,
      all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      liveQueueWriteApprovedNow: false,
      workerDispatchApprovedNow: false,
      agentCanExecuteToolsNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function workerDispatchSmokeProofFixture() {
  return {
    sourceDecision: 'ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks',
    decision: 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks',
    proofAcceptedWithProvidedEvidence: true,
    counts: {
      workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: 21,
      sourceSmokeJobsCompletedWithProvidedEvidence: 21,
      sourceCapabilityScenariosCompletedWithProvidedEvidence: 12,
      sourceInMemoryLeaseRecordsCreated: 21,
      sourceInMemoryLeaseRecordsReleased: 21,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
      sourceLiveWorkerLeasesCreatedNow: 0,
      sourceLiveWorkerDispatchesNow: 0,
      sourceLiveToolExecutionsNow: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    evidence: {
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: true,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: true,
      serviceRoleQueueSmokeAuthorizationRef:
        'external-beta-runtime://service-role-queue-smoke/authorization/diagnostic',
    },
    booleans: {
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function assertFalseBooleans(report, label) {
  for (const key of falseBooleanKeys) {
    if (report.booleans?.[key] !== false) {
      fail(`${label}_boolean_${key}_not_false:${report.booleans?.[key]}`)
    }
  }
}

function assertAcceptedCallableScope(report, label) {
  if (report.decision !== decision) fail(`${label}_decision_unexpected:${report.decision}`)
  if (report.status !== acceptedStatus) fail(`${label}_status_unexpected:${report.status}`)
  if (report.totalAiGraphicsTools !== 21) fail(`${label}_tools_not_21`)
  if (report.totalProductFacingCapabilities !== 12) fail(`${label}_capabilities_not_12`)
  if (report.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_tools_not_8`)
  if (report.heavyToolsIncorrectlyTargetingCpu !== 0) {
    fail(`${label}_heavy_tools_targeting_cpu_not_0`)
  }
  if (report.sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
    fail(`${label}_launch_go_no_go_tools_not_21`)
  }
  if (report.sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence !== 21) {
    fail(`${label}_live_enqueue_tools_not_21`)
  }
  if (report.sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence !== 21) {
    fail(`${label}_worker_smoke_tools_not_21`)
  }
  if (report.externalBetaCallableCandidateToolsWithProvidedEvidence !== 21) {
    fail(`${label}_callable_candidate_tools_not_21`)
  }
  if (report.externalBetaCallableCandidateCapabilitiesWithProvidedEvidence !== 12) {
    fail(`${label}_callable_candidate_capabilities_not_12`)
  }
  if (report.externalBetaCallableNowTools !== 0) {
    fail(`${label}_callable_now_not_0`)
  }
  if (report.externalBetaReadyNowTools !== 0) fail(`${label}_external_beta_ready_not_0`)
  if (report.productionReadyNowTools !== 0) fail(`${label}_production_ready_not_0`)
  const scopes = Array.isArray(report.callableScopes) ? report.callableScopes : []
  if (scopes.length !== 21) fail(`${label}_scope_count_not_21:${scopes.length}`)
  for (const toolId of allTools) {
    const scope = scopes.find((item) => item.toolId === toolId)
    if (!scope) {
      fail(`${label}_missing_tool_scope:${toolId}`)
      continue
    }
    if (scope.externalBetaCallableCandidateWithProvidedEvidence !== true) {
      fail(`${label}_tool_not_callable_candidate:${toolId}`)
    }
    if (scope.externalBetaCallableNow !== false) {
      fail(`${label}_tool_callable_now_not_false:${toolId}`)
    }
    if (scope.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_tool_gpu_should_start_now_not_false:${toolId}`)
    }
  }
  const gpuScopes = scopes.filter((scope) => scope.gpuRequiredForRuntime)
  if (gpuScopes.length !== 8) fail(`${label}_gpu_scope_count_not_8:${gpuScopes.length}`)
  for (const toolId of gpuTools) {
    const scope = scopes.find((item) => item.toolId === toolId)
    if (!scope?.gpuRequiredForRuntime) fail(`${label}_gpu_tool_not_targeted:${toolId}`)
    if (scope?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
      fail(`${label}_gpu_tool_future_start_not_allowed:${toolId}`)
    }
  }
  assertFalseBooleans(report, label)
  for (const key of [
    'sourceExternalBetaLaunchGoNoGoAccepted',
    'sourceExternalBetaLiveEnqueueAuthorizationAccepted',
    'sourceExternalBetaWorkerDispatchSmokeProofAccepted',
    'sourceServiceRoleQueueSmokeAuthorizationAccepted',
    'all21ToolsCovered',
    'all12CapabilitiesCovered',
    'all8GpuToolsTargetGpuRuntime',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'gpuStartsOnlyForApprovedWorkerOrToolCall',
    'all21ExternalBetaCallableCandidatesWithProvidedEvidence',
  ]) {
    if (report.booleans?.[key] !== true) {
      fail(`${label}_boolean_${key}_not_true:${report.booleans?.[key]}`)
    }
  }
}

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-callable-scope.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-callable-scope.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const source = read('server/tool-registry/ai-graphics-external-beta-callable-scope.ts')
const cli = read('server/cli/ai-graphics-external-beta-callable-scope.ts')
const index = read('server/tool-registry/index.ts')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_missing')
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_missing')
}
if (!index.includes("export * from './ai-graphics-external-beta-callable-scope'")) {
  fail('index_export_missing')
}
if (docs.decision !== decision) fail(`docs_decision_unexpected:${docs.decision}`)
if (docs.status !== acceptedStatus) fail(`docs_status_unexpected:${docs.status}`)
if (!docsMd.includes(decision)) fail('markdown_missing_decision')
if (!scorecard.includes(decision)) fail('scorecard_missing_callable_scope_decision')
if (!source.includes('external_beta_callable_scope_candidate_recorded_runtime_still_blocked')) {
  fail('source_missing_accepted_status')
}
if (!source.includes('gpuStartsOnlyForApprovedWorkerOrToolCall')) {
  fail('source_missing_gpu_on_demand_boundary')
}
if (!cli.includes('--external-beta-launch-go-no-go-packet')) {
  fail('cli_missing_launch_go_no_go_flag')
}
if (!cli.includes('--external-beta-live-enqueue-authorization-packet')) {
  fail('cli_missing_live_enqueue_flag')
}
if (!cli.includes('--external-beta-worker-dispatch-smoke-proof-packet')) {
  fail('cli_missing_worker_smoke_flag')
}

for (const toolId of allTools) {
  if (!docs.tools?.includes(toolId)) fail(`docs_missing_tool:${toolId}`)
}
for (const toolId of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(toolId)) {
    fail(`docs_missing_gpu_tool:${toolId}`)
  }
}
for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  heavyToolsIncorrectlyTargetingCpu: 0,
  sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence: 21,
  sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: 21,
  sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: 21,
  externalBetaCallableCandidateToolsWithProvidedEvidence: 21,
  externalBetaCallableCandidateCapabilitiesWithProvidedEvidence: 12,
  externalBetaCallableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) {
    fail(`docs_count_${key}_expected_${expected}_got_${docs.counts?.[key]}`)
  }
}
for (const key of falseBooleanKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_boolean_${key}_not_false`)
}
for (const key of [
  'externalBetaCallableScopePrepared',
  'sourceExternalBetaLaunchGoNoGoAccepted',
  'sourceExternalBetaLiveEnqueueAuthorizationAccepted',
  'sourceExternalBetaWorkerDispatchSmokeProofAccepted',
  'sourceServiceRoleQueueSmokeAuthorizationAccepted',
  'all21ExternalBetaCallableCandidatesWithProvidedEvidence',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_boolean_${key}_not_true`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-callable-scope-'))
const launchFile = writeTempJson(tmpRoot, 'launch-go-no-go.json', launchGoNoGoFixture())
const liveEnqueueFile = writeTempJson(
  tmpRoot,
  'live-enqueue-authorization.json',
  liveEnqueueAuthorizationFixture(),
)
const workerSmokeProofFile = writeTempJson(
  tmpRoot,
  'worker-dispatch-smoke-proof.json',
  workerDispatchSmokeProofFixture(),
)

const missingLaunch = parseJsonOutput(runNpm(runScriptName), 'missing_launch')
if (missingLaunch.status !== 'missing_external_beta_launch_go_no_go') {
  fail(`missing_launch_status_unexpected:${missingLaunch.status}`)
}

const missingLiveEnqueue = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-launch-go-no-go-packet',
  launchFile,
]), 'missing_live_enqueue')
if (missingLiveEnqueue.status !== 'missing_external_beta_live_enqueue_authorization') {
  fail(`missing_live_enqueue_status_unexpected:${missingLiveEnqueue.status}`)
}

const missingWorkerProof = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-launch-go-no-go-packet',
  launchFile,
  '--external-beta-live-enqueue-authorization-packet',
  liveEnqueueFile,
]), 'missing_worker_proof')
if (missingWorkerProof.status !== 'missing_external_beta_worker_dispatch_smoke_proof') {
  fail(`missing_worker_proof_status_unexpected:${missingWorkerProof.status}`)
}

const accepted = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-launch-go-no-go-packet',
  launchFile,
  '--external-beta-live-enqueue-authorization-packet',
  liveEnqueueFile,
  '--external-beta-worker-dispatch-smoke-proof-packet',
  workerSmokeProofFile,
]), 'accepted')
assertAcceptedCallableScope(accepted, 'accepted')

const strippedAuthorizationLaunchFile = writeTempJson(
  tmpRoot,
  'stripped-authorization-launch-go-no-go.json',
  {
    ...launchGoNoGoFixture(),
    booleans: {
      ...launchGoNoGoFixture().booleans,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: false,
    },
  },
)
const strippedAuthorization = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-launch-go-no-go-packet',
  strippedAuthorizationLaunchFile,
  '--external-beta-live-enqueue-authorization-packet',
  liveEnqueueFile,
  '--external-beta-worker-dispatch-smoke-proof-packet',
  workerSmokeProofFile,
]), 'stripped_authorization')
if (strippedAuthorization.status !== 'external_beta_launch_go_no_go_rejected') {
  fail(`stripped_authorization_status_unexpected:${strippedAuthorization.status}`)
}

const strippedWorkerProofFile = writeTempJson(
  tmpRoot,
  'stripped-worker-proof.json',
  {
    ...workerDispatchSmokeProofFixture(),
    evidence: {
      ...workerDispatchSmokeProofFixture().evidence,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: false,
      serviceRoleQueueSmokeAuthorizationRef: null,
    },
    booleans: {
      ...workerDispatchSmokeProofFixture().booleans,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: false,
    },
  },
)
const strippedWorkerProof = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-launch-go-no-go-packet',
  launchFile,
  '--external-beta-live-enqueue-authorization-packet',
  liveEnqueueFile,
  '--external-beta-worker-dispatch-smoke-proof-packet',
  strippedWorkerProofFile,
]), 'stripped_worker_proof')
if (strippedWorkerProof.status !== 'external_beta_worker_dispatch_smoke_proof_rejected') {
  fail(`stripped_worker_proof_status_unexpected:${strippedWorkerProof.status}`)
}

const changedFiles = git(['diff', '--name-only', baseRef])
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean)

if (git(['diff', '--name-only', '--', 'package-lock.json'])) fail('package_lock_changed')
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

const pkgDiff = git(['diff', baseRef, '--', 'package.json'])
if (/^\+.*"(dependencies|devDependencies|optionalDependencies|peerDependencies)"/m.test(pkgDiff)) {
  fail('package_dependency_section_changed')
}
if (pkgDiff && (!pkg.scripts?.[runScriptName] || !pkg.scripts?.[diagnosticScriptName])) {
  fail('package_diff_missing_new_scripts')
}

for (const filePath of [
  'server/tool-registry/ai-graphics-external-beta-callable-scope.ts',
  'server/cli/ai-graphics-external-beta-callable-scope.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-scope.json',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-scope.md',
]) {
  const content = read(filePath)
  for (const pattern of [
    /agentCanExecuteToolsNow["':\s]+true/,
    /externalBetaCallableNow["':\s]+true/,
    /routeExecutionApprovedNow["':\s]+true/,
    /workerExecutionApprovedNow["':\s]+true/,
    /workerQueueApprovedNow["':\s]+true/,
    /liveQueueWriteApprovedNow["':\s]+true/,
    /toolExecutionApprovedNow["':\s]+true/,
    /providerRuntimeApprovedNow["':\s]+true/,
    /browserWebglCanvasRuntimeApprovedNow["':\s]+true/,
    /gpuRuntimeApprovedNow["':\s]+true/,
    /gpuRuntimeShouldStartNow["':\s]+true/,
    /runtimeReadyNow["':\s]+true/,
    /internalBetaReadyNow["':\s]+true/,
    /externalBetaReadyNow["':\s]+true/,
    /productionReadyNow["':\s]+true/,
    /dependencyInstallPerformed["':\s]+true/,
    /packageLockMutationPerformed["':\s]+true/,
    /toolExecutionPerformed["':\s]+true/,
    /workerExecutionPerformed["':\s]+true/,
    /routeExecutionPerformed["':\s]+true/,
    /supabaseMutationPerformed["':\s]+true/,
    /gcsUploadPerformed["':\s]+true/,
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
  status: accepted.status,
  toolsCovered: accepted.totalAiGraphicsTools,
  capabilitiesCovered: accepted.totalProductFacingCapabilities,
  gpuRuntimeTargetedTools: accepted.gpuRuntimeTargetedTools,
  externalBetaCallableCandidateToolsWithProvidedEvidence:
    accepted.externalBetaCallableCandidateToolsWithProvidedEvidence,
  externalBetaCallableNowTools: accepted.externalBetaCallableNowTools,
  externalBetaReadyNowTools: accepted.externalBetaReadyNowTools,
  productionReadyNowTools: accepted.productionReadyNowTools,
  gpuRuntimeShouldStartNow: accepted.booleans.gpuRuntimeShouldStartNow,
  agentCanExecuteToolsNow: accepted.booleans.agentCanExecuteToolsNow,
}, null, 2))
