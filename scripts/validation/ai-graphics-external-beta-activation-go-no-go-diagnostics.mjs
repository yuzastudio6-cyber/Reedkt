import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_activation_go_no_go_approved_with_runtime_blocks'
const acceptedStatus =
  'external_beta_activation_go_no_go_approved_for_one_tool_runtime_on_demand'
const sourceDecision =
  'ai_graphics_external_beta_controlled_traffic_runtime_soak_result_prepared_with_runtime_blocks'
const sourceStatus =
  'external_beta_controlled_traffic_runtime_soak_result_accepted_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-activation-go-no-go'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-activation-go-no-go.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-activation-go-no-go:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-activation-go-no-go-diagnostics.mjs'

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

const capabilityByTool = {
  torch_torchvision: 'model_runtime_foundation',
  transformers: 'model_runtime_foundation',
  sam2: 'subject_segmentation',
  birefnet: 'background_removal',
  real_esrgan: 'upscaling',
  kornia: 'tensor_image_ops',
  rembg: 'background_removal',
  transparent_background: 'background_removal',
  d3: 'chart_overlay',
  echarts: 'data_visualization',
  vega_lite: 'chart_overlay',
  vega: 'data_visualization',
  satori: 'svg_graphics',
  svgdotjs_svg_js: 'svg_graphics',
  viz_js: 'diagram_graphics',
  lottie_web: 'animation_overlay',
  animejs: 'animation_overlay',
  three_js: 'webgl_3d_scene',
  pixi_js: 'canvas_scene',
  konva: 'canvas_scene',
  babylonjs: 'webgl_3d_scene',
}

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'directAgentToolExecutionApprovedNow',
  'controlledTrafficRunExecutedByThisGate',
  'apiRouteExecutionPerformedByThisGate',
  'workerDispatchPerformedByThisGate',
  'toolExecutionPerformedByThisGate',
  'productionReadyNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'privateArtifactWriteApprovedNow',
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
  'productionReadyNowGlobal',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'workerEnqueuePerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'privateArtifactWritePerformed',
  'serviceRoleQueueSmokePerformed',
  'supabaseMutationPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformedByActivationGate',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const trueActivationKeys = [
  'externalBetaActivationGoNoGoPrepared',
  'sourceControlledTrafficRuntimeSoakResultAccepted',
  'externalBetaActivationControlsAccepted',
  'externalBetaActivationApprovedWithProvidedEvidence',
  'externalBetaToolCallReadyNow',
  'runtimeReadyForOnDemandExternalBetaToolCall',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
  'controlledWorkerToolCallReadyNow',
  'externalBetaCallableNow',
  'externalBetaReadyNow',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-activation-go-no-go.ts',
  'server/cli/ai-graphics-external-beta-activation-go-no-go.ts',
  'scripts/validation/ai-graphics-external-beta-activation-go-no-go-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-activation-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/external-beta-activation-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-traffic-runtime-soak-result.json',
  'docs/tool-intelligence/ai-graphics/external-beta-operator-traffic-switch-runtime-soak-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-traffic-enablement-gate.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const generatedArtifactPathPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /directAgentToolExecutionApprovedNow["`:\s=]+true/i,
  /controlledTrafficRunExecutedByThisGate["`:\s=]+true/i,
  /apiRouteExecutionPerformedByThisGate["`:\s=]+true/i,
  /workerDispatchPerformedByThisGate["`:\s=]+true/i,
  /toolExecutionPerformedByThisGate["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /gpuRuntimePerformedByActivationGate["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
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

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return file
}

function sourceResultFixture(toolId) {
  const capabilityId = capabilityByTool[toolId]
  const routeId = `ai_graphics_external_beta_tool_route_${toolId}`
  return {
    decision: sourceDecision,
    sourceOperatorTrafficSwitchRuntimeSoakAuthorizationDecision:
      'ai_graphics_external_beta_operator_traffic_switch_runtime_soak_authorization_prepared_with_runtime_blocks',
    status: sourceStatus,
    sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted: true,
    controlledTrafficRuntimeSoakObservedEvidenceAccepted: true,
    rejectionReasons: [],
    requestedToolId: toolId,
    capabilityId,
    controlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence: 1,
    sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAcceptedRequestsWithProvidedEvidence: 1,
    controlledTrafficRuntimeSoakObservedToolsWithProvidedEvidence: 1,
    externalBetaTrafficSwitchEnabledByThisGateTools: 0,
    externalBetaRuntimeSoakStartedByThisGateTools: 0,
    externalBetaTrafficEnabledByThisGateTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    observedResult: {
      toolId,
      capabilityId,
      routePath: '/api/ai-graphics/external-beta/tool-call',
      routeId,
      sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted: true,
      controlledTrafficRunResultRef:
        `private://ai-graphics/external-beta/observed-soak/${toolId}/traffic-run-result.json`,
      runtimeSoakMetricsRef:
        `private://ai-graphics/external-beta/observed-soak/${toolId}/runtime-soak-metrics.json`,
      requestSampleAuditRef:
        `private://ai-graphics/external-beta/observed-soak/${toolId}/request-sample-audit.json`,
      zeroCriticalIncidentRef:
        `private://ai-graphics/external-beta/observed-soak/${toolId}/zero-critical-incident.json`,
      costObservationRef:
        `private://ai-graphics/external-beta/observed-soak/${toolId}/cost-observation.json`,
      gpuLifecycleObservationRef:
        `private://ai-graphics/external-beta/observed-soak/${toolId}/gpu-lifecycle-observation.json`,
      userImpactReviewRef:
        `private://ai-graphics/external-beta/observed-soak/${toolId}/user-impact-review.json`,
      rollbackReadinessRef:
        `private://ai-graphics/external-beta/observed-soak/${toolId}/rollback-readiness.json`,
      postSoakOwnerReviewRef:
        `private://ai-graphics/external-beta/observed-soak/${toolId}/post-soak-owner-review.json`,
      controlledTrafficRunObservedWithProvidedEvidence: true,
      runtimeSoakObservedWithProvidedEvidence: true,
      gpuLifecycleObservedAsOnDemandWithProvidedEvidence: true,
      controlledTrafficRunExecutedByThisGate: false,
      externalBetaTrafficSwitchEnabledByThisGate: false,
      externalBetaRuntimeSoakStartedByThisGate: false,
      routeExecutionPerformedByThisGate: false,
      workerDispatchPerformedByThisGate: false,
      toolExecutionPerformedByThisGate: false,
      gpuRuntimePerformedByThisGate: false,
    },
    policy: {
      validatesObservedResultEvidenceOnly: true,
      noControlledTrafficExecutedByGate: true,
      noExternalBetaTrafficSwitchEnabledByGate: true,
      noRuntimeSoakStartedByGate: true,
      noLiveApiRouteExecutionByGate: true,
      noLiveWorkerDispatchByGate: true,
      noToolExecutionByGate: true,
      noProviderRuntimeByGate: true,
      noGpuRuntimeStartByGate: true,
      nextGateRequiresExternalBetaActivationGoNoGo: true,
    },
    booleans: {
      externalBetaControlledTrafficRuntimeSoakResultPrepared: true,
      sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted: true,
      controlledTrafficRuntimeSoakObservedEvidenceAccepted: true,
      controlledTrafficRunObservedWithProvidedEvidence: true,
      runtimeSoakObservedWithProvidedEvidence: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      controlledTrafficRunExecutedByThisGate: false,
      externalBetaTrafficEnabledNow: false,
      externalBetaTrafficSwitchEnabledByThisGate: false,
      externalBetaRuntimeSoakStartedByThisGate: false,
      externalBetaTrafficSwitchApprovedNow: false,
      apiRouteExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      privateArtifactWriteApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      privateArtifactWritePerformed: false,
      serviceRoleQueueSmokePerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreatedByResultGate: false,
      workerDispatchPerformedByResultGate: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByResultGate: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

function privateActivationRefs(toolId) {
  return [
    '--external-beta-activation-owner-approval-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/owner-approval.json`,
    '--external-beta-activation-feature-flag-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/feature-flag.json`,
    '--external-beta-activation-cohort-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/cohort.json`,
    '--external-beta-activation-support-ack-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/support-ack.json`,
    '--external-beta-activation-monitoring-live-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/monitoring-live.json`,
    '--external-beta-activation-cost-budget-final-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/cost-budget-final.json`,
    '--external-beta-activation-rollback-armed-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/rollback-armed.json`,
    '--external-beta-activation-release-notes-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/release-notes.md`,
    '--external-beta-activation-user-comms-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/user-comms.md`,
    '--external-beta-activation-post-activation-review-ref',
    `private://ai-graphics/external-beta/activation/${toolId}/post-activation-review.json`,
  ]
}

function runGate(toolId, extraArgs = privateActivationRefs(toolId), mutateSource) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-activation-'))
  const source = sourceResultFixture(toolId)
  if (mutateSource) mutateSource(source)
  const sourcePath = writeJson(path.join(tempDir, 'observed-result.json'), source)
  return npmJson(runScriptName, [
    '--external-beta-controlled-traffic-runtime-soak-result-packet',
    sourcePath,
    ...extraArgs,
  ])
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) fail(`${label}:expected=${expected}:actual=${actual}`)
}

function requireTruthy(actual, label) {
  if (actual !== true) fail(`${label}:expected=true:actual=${actual}`)
}

function requireFalse(actual, label) {
  if (actual !== false) fail(`${label}:expected=false:actual=${actual}`)
}

function verifyFalseGates(packet, label) {
  for (const key of falseGateKeys) {
    if (packet.booleans?.[key] !== false) {
      fail(`${label}:boolean_${key}_must_be_false`)
    }
  }
}

function verifyTrueActivation(packet, label) {
  for (const key of trueActivationKeys) {
    if (packet.booleans?.[key] !== true) {
      fail(`${label}:boolean_${key}_must_be_true`)
    }
  }
}

function verifyRequiredFiles() {
  requiredFiles.forEach(read)
}

function verifyPackageJson() {
  const packageJson = json('package.json')
  requireEqual(packageJson.scripts?.[runScriptName], runScriptCommand, 'package_run_script')
  requireEqual(
    packageJson.scripts?.[diagnosticScriptName],
    diagnosticScriptCommand,
    'package_diagnostic_script',
  )

  const currentPackage = JSON.parse(read('package.json'))
  const basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const current = JSON.stringify(currentPackage[section] ?? {}, null, 2)
    const base = JSON.stringify(basePackage[section] ?? {}, null, 2)
    if (current !== base) fail(`package_dependency_section_changed:${section}`)
  }

  const allowedPackageAdditions = [
    `+    "${runScriptName}": "${runScriptCommand}",`,
    `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  ]
  const packageDiffLines = git(['diff', '--', 'package.json'])
    .split('\n')
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---)/.test(line))
  for (const line of packageDiffLines) {
    if (!allowedPackageAdditions.includes(line)) {
      fail(`unexpected_package_json_diff:${line}`)
    }
  }
}

function verifyPackageLockUnchanged() {
  const lockDiff = git(['diff', '--', 'package-lock.json'])
  if (lockDiff.trim().length > 0) fail('package_lock_changed')
}

function verifyTrackedAndChangedPaths() {
  const changed = git(['diff', '--name-only'])
    .split('\n')
    .filter(Boolean)
  const untracked = git(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean)
  for (const file of [...changed, ...untracked]) {
    if (generatedArtifactPathPattern.test(file)) {
      fail(`generated_or_artifact_path_changed:${file}`)
    }
  }
}

function verifyDocs() {
  const docJson = json('docs/tool-intelligence/ai-graphics/external-beta-activation-go-no-go.json')
  requireEqual(docJson.decision, decision, 'doc_json_decision')
  requireEqual(docJson.status, acceptedStatus, 'doc_json_status')
  requireEqual(docJson.scope?.totalAiGraphicsTools, 21, 'doc_json_tool_count')
  requireEqual(docJson.scope?.productFacingCapabilities, 12, 'doc_json_capability_count')
  requireEqual(docJson.scope?.gpuRuntimeTargetedTools, 8, 'doc_json_gpu_count')
  requireEqual(docJson.scope?.externalBetaActivationGoNoGoApprovedToolsWithProvidedEvidence, 1, 'doc_json_activation_count')
  requireEqual(docJson.scope?.sourceControlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence, 1, 'doc_json_source_count')
  requireEqual(docJson.scope?.externalBetaToolCallReadyNowTools, 1, 'doc_json_tool_call_ready_count')
  requireEqual(docJson.scope?.externalBetaReadyNowTools, 1, 'doc_json_external_beta_count')
  requireEqual(docJson.scope?.runtimeReadyForOnDemandExternalBetaToolCallTools, 1, 'doc_json_runtime_ready_count')
  requireEqual(docJson.scope?.productionReadyNowTools, 0, 'doc_json_production_count')
  for (const tool of tools) {
    if (!docJson.tools?.includes(tool)) fail(`doc_json_missing_tool:${tool}`)
  }
  for (const tool of gpuTools) {
    if (!docJson.gpuTools?.includes(tool)) fail(`doc_json_missing_gpu_tool:${tool}`)
  }
  for (const key of trueActivationKeys) {
    requireTruthy(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }
  for (const key of falseGateKeys) {
    requireFalse(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }

  const md = read('docs/tool-intelligence/ai-graphics/external-beta-activation-go-no-go.md')
  for (const required of [
    decision,
    'external-beta tool-call ready',
    '`externalBetaToolCallReadyNow=true`',
    '`runtimeReadyForOnDemandExternalBetaToolCall=true`',
    '`externalBetaReadyNow=true`',
    '`agentCanExecuteToolsNow=false`',
    '`gpuRuntimeShouldStartNow=false`',
    '`productionReadyNow=false`',
  ]) {
    if (!md.includes(required)) fail(`activation_md_missing:${required}`)
  }

  const scorecard = read('docs/production-beta-readiness-scorecard.md')
  for (const required of [
    'AI Graphics External-Beta Activation Go/No-Go',
    decision,
    'marks one tool as external-beta tool-call ready',
    '`gpuRuntimeShouldStartNow` remains false',
  ]) {
    if (!scorecard.includes(required)) fail(`scorecard_missing:${required}`)
  }

  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-beta-activation-go-no-go.json',
    'docs/tool-intelligence/ai-graphics/external-beta-activation-go-no-go.md',
    'docs/production-beta-readiness-scorecard.md',
  ]) {
    const content = read(file)
    forbiddenDocPatterns.forEach((pattern) => {
      if (pattern.test(content)) fail(`forbidden_claim:${file}:${pattern}`)
    })
  }
}

function verifySourceWiring() {
  const registry = read('server/tool-registry/index.ts')
  if (!registry.includes("export * from './ai-graphics-external-beta-activation-go-no-go'")) {
    fail('missing_registry_export')
  }
  const evaluator = read('server/tool-registry/ai-graphics-external-beta-activation-go-no-go.ts')
  for (const required of [
    decision,
    'external_beta_tool_call_ready_on_demand_metadata_only',
    'approvesExternalBetaToolCallReadinessMetadata: true',
    'directAgentExecutionStillBlocked: true',
    'runtimeStartsOnlyForAcceptedWorkerJob: true',
    'noProductionUnlockByGate: true',
    'externalBetaReadyNow: accepted',
    'gpuRuntimeShouldStartNow: false',
    'productionReadyNow: false',
  ]) {
    if (!evaluator.includes(required)) fail(`evaluator_missing:${required}`)
  }
}

function verifyCliBehavior() {
  const missing = npmJson(runScriptName)
  requireEqual(
    missing.status,
    'missing_external_beta_controlled_traffic_runtime_soak_result',
    'missing_cli_status',
  )
  requireFalse(missing.input?.directAgentToolExecutionPerformed, 'missing_cli_no_direct_agent')
  requireFalse(missing.input?.routeExecutionPerformed, 'missing_cli_no_route')
  requireFalse(missing.input?.workerDispatchPerformedByThisCommand, 'missing_cli_no_dispatch')
  requireFalse(missing.input?.toolExecutionPerformed, 'missing_cli_no_tool')
  requireFalse(missing.input?.gpuRuntimePerformedByThisCommand, 'missing_cli_no_gpu')

  const accepted = runGate('sam2')
  requireEqual(accepted.status, acceptedStatus, 'accepted_status')
  requireTruthy(accepted.externalBetaActivationControlsAccepted, 'accepted_controls')
  requireEqual(
    accepted.externalBetaActivationGoNoGoApprovedToolsWithProvidedEvidence,
    1,
    'accepted_activation_count',
  )
  requireEqual(
    accepted.sourceControlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence,
    1,
    'accepted_source_count',
  )
  requireEqual(accepted.externalBetaToolCallReadyNowTools, 1, 'accepted_tool_call_ready')
  requireEqual(accepted.externalBetaReadyNowTools, 1, 'accepted_external_beta_ready')
  requireEqual(accepted.runtimeReadyForOnDemandExternalBetaToolCallTools, 1, 'accepted_runtime_on_demand')
  requireEqual(accepted.productionReadyNowTools, 0, 'accepted_production_count')
  requireTruthy(
    accepted.activatedToolCallReadiness?.externalBetaToolCallReadyNow,
    'activated_tool_call_ready',
  )
  requireTruthy(
    accepted.activatedToolCallReadiness?.runtimeReadyForOnDemandExternalBetaToolCall,
    'activated_runtime_ready',
  )
  requireFalse(
    accepted.activatedToolCallReadiness?.gpuRuntimeShouldStartNow,
    'activated_gpu_should_not_start',
  )
  requireFalse(
    accepted.activatedToolCallReadiness?.productionReadyNow,
    'activated_production_false',
  )
  verifyTrueActivation(accepted, 'accepted')
  verifyFalseGates(accepted, 'accepted')

  const badSource = runGate('sam2', privateActivationRefs('sam2'), (source) => {
    source.status = 'missing_external_beta_controlled_traffic_runtime_soak_result_evidence'
  })
  requireEqual(
    badSource.status,
    'external_beta_controlled_traffic_runtime_soak_result_rejected',
    'bad_source_status',
  )

  const badPublicRef = runGate('sam2', [
    '--external-beta-activation-owner-approval-ref',
    'https://example.invalid/public/activation-owner.json',
    '--external-beta-activation-feature-flag-ref',
    'private://ai-graphics/external-beta/activation/sam2/feature-flag.json',
    '--external-beta-activation-cohort-ref',
    'private://ai-graphics/external-beta/activation/sam2/cohort.json',
    '--external-beta-activation-support-ack-ref',
    'private://ai-graphics/external-beta/activation/sam2/support-ack.json',
    '--external-beta-activation-monitoring-live-ref',
    'private://ai-graphics/external-beta/activation/sam2/monitoring-live.json',
    '--external-beta-activation-cost-budget-final-ref',
    'private://ai-graphics/external-beta/activation/sam2/cost-budget-final.json',
    '--external-beta-activation-rollback-armed-ref',
    'private://ai-graphics/external-beta/activation/sam2/rollback-armed.json',
    '--external-beta-activation-release-notes-ref',
    'private://ai-graphics/external-beta/activation/sam2/release-notes.md',
    '--external-beta-activation-user-comms-ref',
    'private://ai-graphics/external-beta/activation/sam2/user-comms.md',
    '--external-beta-activation-post-activation-review-ref',
    'private://ai-graphics/external-beta/activation/sam2/post-activation-review.json',
  ])
  requireEqual(
    badPublicRef.status,
    'missing_external_beta_activation_go_no_go_controls',
    'bad_public_ref_status',
  )
  if (!badPublicRef.rejectionReasons?.some((reason) => reason.includes('owner approval'))) {
    fail('bad_public_ref_missing_rejection_reason')
  }
}

verifyRequiredFiles()
verifyPackageJson()
verifyPackageLockUnchanged()
verifyTrackedAndChangedPaths()
verifyDocs()
verifySourceWiring()
verifyCliBehavior()

if (failures.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    decision,
    status: 'ai_graphics_external_beta_activation_go_no_go_diagnostics_failed',
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: 'ai_graphics_external_beta_activation_go_no_go_diagnostics_passed',
  checkedFiles: requiredFiles.length,
  totalAiGraphicsTools: tools.length,
  gpuRuntimeTargetedTools: gpuTools.length,
  externalBetaActivationApprovedWithProvidedEvidence: true,
  externalBetaToolCallReadyNowTools: 1,
  externalBetaReadyNowTools: 1,
  runtimeReadyForOnDemandExternalBetaToolCallTools: 1,
  agentCanExecuteToolsNow: false,
  gpuRuntimeShouldStartNow: false,
  productionReadyNowTools: 0,
}, null, 2))
