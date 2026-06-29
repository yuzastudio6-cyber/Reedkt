import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_controlled_traffic_runtime_soak_result_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_controlled_traffic_runtime_soak_result_accepted_runtime_still_blocked'
const sourceDecision =
  'ai_graphics_external_beta_operator_traffic_switch_runtime_soak_authorization_prepared_with_runtime_blocks'
const sourceStatus =
  'external_beta_operator_traffic_switch_runtime_soak_authorization_ready_runtime_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-controlled-traffic-runtime-soak-result'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-controlled-traffic-runtime-soak-result:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-controlled-traffic-runtime-soak-result-diagnostics.mjs'

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
  'externalBetaCallableNow',
  'controlledTrafficRunExecutedByThisGate',
  'externalBetaTrafficEnabledNow',
  'externalBetaTrafficSwitchEnabledByThisGate',
  'externalBetaRuntimeSoakStartedByThisGate',
  'externalBetaTrafficSwitchApprovedNow',
  'apiRouteExecutionApprovedNow',
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
  'externalBetaReadyNow',
  'productionReadyNow',
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
  'workerLeaseCreatedByResultGate',
  'workerDispatchPerformedByResultGate',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformedByResultGate',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts',
  'server/cli/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts',
  'scripts/validation/ai-graphics-external-beta-controlled-traffic-runtime-soak-result-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-traffic-runtime-soak-result.json',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-traffic-runtime-soak-result.md',
  'docs/tool-intelligence/ai-graphics/external-beta-operator-traffic-switch-runtime-soak-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-traffic-enablement-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const generatedArtifactPathPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /controlledTrafficRunExecutedByThisGate["`:\s=]+true/i,
  /externalBetaTrafficEnabledNow["`:\s=]+true/i,
  /externalBetaTrafficSwitchEnabledByThisGate["`:\s=]+true/i,
  /externalBetaRuntimeSoakStartedByThisGate["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /gpuRuntimePerformedByResultGate["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
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

function sourceAuthorizationFixture(toolId) {
  const capabilityId = capabilityByTool[toolId]
  const routeId = `ai_graphics_external_beta_tool_route_${toolId}`
  return {
    decision: sourceDecision,
    sourcePerToolTrafficEnablementGateDecision:
      'ai_graphics_external_beta_per_tool_traffic_enablement_gate_prepared_with_runtime_blocks',
    status: sourceStatus,
    sourcePerToolTrafficEnablementGateAccepted: true,
    operatorTrafficSwitchRuntimeSoakControlsAccepted: true,
    rejectionReasons: [],
    requestedToolId: toolId,
    capabilityId,
    operatorTrafficSwitchRuntimeSoakAuthorizationPreparedRequestsWithProvidedEvidence: 1,
    sourcePerToolTrafficEnablementGateAcceptedRequestsWithProvidedEvidence: 1,
    operatorTrafficSwitchRuntimeSoakCandidateToolsWithProvidedEvidence: 1,
    externalBetaTrafficSwitchEnabledNowTools: 0,
    externalBetaRuntimeSoakStartedNowTools: 0,
    externalBetaTrafficEnabledNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    trafficSwitchRuntimeSoakCandidate: {
      toolId,
      capabilityId,
      routePath: '/api/ai-graphics/external-beta/tool-call',
      routeId,
      sourceTrafficEnablementGateAccepted: true,
      operatorTrafficSwitchApprovalRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/approval.json`,
      runtimeSoakPlanRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/runtime-soak-plan.json`,
      runtimeSoakWindowRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/runtime-soak-window.json`,
      canaryCohortRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/canary-cohort.json`,
      monitoringDashboardRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/monitoring-dashboard.json`,
      alertPolicyRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/alert-policy.json`,
      rollbackPlaybookRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/rollback-playbook.md`,
      supportPagerRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/support-pager.json`,
      costBudgetRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/cost-budget.json`,
      killSwitchDrillRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/kill-switch-drill.json`,
      postSoakReviewRef:
        `private://ai-graphics/external-beta/operator-switch/${toolId}/post-soak-review.json`,
      operatorTrafficSwitchRuntimeSoakAuthorizationPreparedWithProvidedEvidence: true,
      externalBetaTrafficSwitchEnabledNow: false,
      externalBetaRuntimeSoakStartedNow: false,
      routeExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
    },
    policy: {
      validatesOperatorSwitchAndSoakAuthorizationOnly: true,
      noExternalBetaTrafficSwitchEnabledByGate: true,
      noRuntimeSoakStartedByGate: true,
      noLiveApiRouteExecutionByGate: true,
      noLiveWorkerDispatchByGate: true,
      noToolExecutionByGate: true,
      noProviderRuntimeByGate: true,
      noGpuRuntimeStartByGate: true,
      monitoringAlertsRollbackAndSupportRequiredBeforeFutureTraffic: true,
      nextGateRequiresControlledTrafficExecutionAndObservedSoakResults: true,
    },
    booleans: {
      externalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationPrepared: true,
      sourcePerToolTrafficEnablementGateAccepted: true,
      operatorTrafficSwitchRuntimeSoakControlsAccepted: true,
      operatorTrafficSwitchRuntimeSoakAuthorizationPreparedWithProvidedEvidence: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      externalBetaTrafficEnabledNow: false,
      externalBetaTrafficSwitchEnabledNow: false,
      externalBetaRuntimeSoakStartedNow: false,
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
      workerLeaseCreatedByAuthorizationGate: false,
      workerDispatchPerformedByAuthorizationGate: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByAuthorizationGate: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

function privateObservedRefs(toolId) {
  return [
    '--external-beta-controlled-traffic-run-result-ref',
    `private://ai-graphics/external-beta/observed-soak/${toolId}/traffic-run-result.json`,
    '--external-beta-runtime-soak-metrics-ref',
    `private://ai-graphics/external-beta/observed-soak/${toolId}/runtime-soak-metrics.json`,
    '--external-beta-request-sample-audit-ref',
    `private://ai-graphics/external-beta/observed-soak/${toolId}/request-sample-audit.json`,
    '--external-beta-zero-critical-incident-ref',
    `private://ai-graphics/external-beta/observed-soak/${toolId}/zero-critical-incident.json`,
    '--external-beta-cost-observation-ref',
    `private://ai-graphics/external-beta/observed-soak/${toolId}/cost-observation.json`,
    '--external-beta-gpu-lifecycle-observation-ref',
    `private://ai-graphics/external-beta/observed-soak/${toolId}/gpu-lifecycle-observation.json`,
    '--external-beta-user-impact-review-ref',
    `private://ai-graphics/external-beta/observed-soak/${toolId}/user-impact-review.json`,
    '--external-beta-rollback-readiness-ref',
    `private://ai-graphics/external-beta/observed-soak/${toolId}/rollback-readiness.json`,
    '--external-beta-post-soak-owner-review-ref',
    `private://ai-graphics/external-beta/observed-soak/${toolId}/post-soak-owner-review.json`,
  ]
}

function runGate(toolId, extraArgs = privateObservedRefs(toolId), mutateSource) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-observed-soak-'))
  const source = sourceAuthorizationFixture(toolId)
  if (mutateSource) mutateSource(source)
  const sourcePath = writeJson(path.join(tempDir, 'operator-authorization.json'), source)
  return npmJson(runScriptName, [
    '--external-beta-operator-traffic-switch-runtime-soak-authorization-packet',
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
    '+    "ai-graphics:external-beta-activation-go-no-go": "tsx server/cli/ai-graphics-external-beta-activation-go-no-go.ts",',
    '+    "ai-graphics:external-beta-activation-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-activation-go-no-go-diagnostics.mjs",',
    '+    "ai-graphics:external-beta-all-21-activation-rollup": "tsx server/cli/ai-graphics-external-beta-all-21-activation-rollup.ts",',
    '+    "ai-graphics:external-beta-all-21-activation-rollup:diagnostics": "node scripts/validation/ai-graphics-external-beta-all-21-activation-rollup-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-activated-launch-readiness": "tsx server/cli/ai-graphics-external-beta-activated-launch-readiness.ts",',
  '+    "ai-graphics:external-beta-activated-launch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-activated-launch-readiness-diagnostics.mjs",',
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
  const docJson = json('docs/tool-intelligence/ai-graphics/external-beta-controlled-traffic-runtime-soak-result.json')
  requireEqual(docJson.decision, decision, 'doc_json_decision')
  requireEqual(docJson.status, acceptedStatus, 'doc_json_status')
  requireEqual(docJson.scope?.totalAiGraphicsTools, 21, 'doc_json_tool_count')
  requireEqual(docJson.scope?.productFacingCapabilities, 12, 'doc_json_capability_count')
  requireEqual(docJson.scope?.gpuRuntimeTargetedTools, 8, 'doc_json_gpu_count')
  requireEqual(
    docJson.scope?.controlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence,
    1,
    'doc_json_gate_count',
  )
  requireEqual(
    docJson.scope?.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAcceptedRequestsWithProvidedEvidence,
    1,
    'doc_json_source_count',
  )
  requireEqual(
    docJson.scope?.controlledTrafficRuntimeSoakObservedToolsWithProvidedEvidence,
    1,
    'doc_json_observed_count',
  )
  requireEqual(docJson.scope?.externalBetaTrafficSwitchEnabledByThisGateTools, 0, 'doc_json_switch_now_count')
  requireEqual(docJson.scope?.externalBetaRuntimeSoakStartedByThisGateTools, 0, 'doc_json_soak_now_count')
  requireEqual(docJson.scope?.externalBetaTrafficEnabledByThisGateTools, 0, 'doc_json_traffic_now_count')
  requireEqual(docJson.scope?.externalBetaReadyNowTools, 0, 'doc_json_external_beta_count')
  requireEqual(docJson.scope?.productionReadyNowTools, 0, 'doc_json_production_count')
  for (const tool of tools) {
    if (!docJson.tools?.includes(tool)) fail(`doc_json_missing_tool:${tool}`)
  }
  for (const tool of gpuTools) {
    if (!docJson.gpuTools?.includes(tool)) fail(`doc_json_missing_gpu_tool:${tool}`)
  }
  for (const key of [
    'externalBetaControlledTrafficRuntimeSoakResultPrepared',
    'sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted',
    'controlledTrafficRuntimeSoakObservedEvidenceAccepted',
    'controlledTrafficRunObservedWithProvidedEvidence',
    'runtimeSoakObservedWithProvidedEvidence',
    'all21ToolsCovered',
    'all12CapabilitiesCovered',
    'all8GpuToolsTargetGpuRuntime',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'gpuStartsOnlyForApprovedWorkerOrToolCall',
    'agentCanSelectForPlanning',
  ]) {
    requireTruthy(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }
  for (const key of falseGateKeys) {
    requireFalse(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }

  const md = read('docs/tool-intelligence/ai-graphics/external-beta-controlled-traffic-runtime-soak-result.md')
  for (const required of [
    decision,
    'does not execute traffic',
    'does not enable traffic switches',
    '`controlledTrafficRunExecutedByThisGate=false`',
    '`externalBetaRuntimeSoakStartedByThisGate=false`',
    '`gpuRuntimeShouldStartNow=false`',
    'This result gate only accepts observed evidence refs.',
  ]) {
    if (!md.includes(required)) fail(`controlled_traffic_md_missing:${required}`)
  }

  const scorecard = read('docs/production-beta-readiness-scorecard.md')
  for (const required of [
    'AI Graphics External-Beta Controlled Traffic Runtime Soak Result',
    decision,
    'observed controlled-traffic/runtime-soak result evidence intake',
    '`gpuRuntimeShouldStartNow` remains false',
  ]) {
    if (!scorecard.includes(required)) fail(`scorecard_missing:${required}`)
  }

  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-beta-controlled-traffic-runtime-soak-result.json',
    'docs/tool-intelligence/ai-graphics/external-beta-controlled-traffic-runtime-soak-result.md',
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
  if (!registry.includes("export * from './ai-graphics-external-beta-controlled-traffic-runtime-soak-result'")) {
    fail('missing_registry_export')
  }
  const evaluator = read('server/tool-registry/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts')
  for (const required of [
    decision,
    'observed_controlled_traffic_runtime_soak_result_metadata_only',
    'noControlledTrafficExecutedByGate: true',
    'noExternalBetaTrafficSwitchEnabledByGate: true',
    'noRuntimeSoakStartedByGate: true',
    'noLiveApiRouteExecutionByGate: true',
    'noLiveWorkerDispatchByGate: true',
    'noToolExecutionByGate: true',
    'noGpuRuntimeStartByGate: true',
    'controlledTrafficRunExecutedByThisGate: false',
    'externalBetaRuntimeSoakStartedByThisGate: false',
    'gpuRuntimeShouldStartNow: false',
  ]) {
    if (!evaluator.includes(required)) fail(`evaluator_missing:${required}`)
  }
}

function verifyCliBehavior() {
  const missing = npmJson(runScriptName)
  requireEqual(
    missing.status,
    'missing_external_beta_operator_traffic_switch_runtime_soak_authorization',
    'missing_cli_status',
  )
  requireFalse(missing.input?.controlledTrafficRunExecutedByThisCommand, 'missing_cli_no_traffic')
  requireFalse(missing.input?.externalBetaTrafficSwitchEnabledByThisCommand, 'missing_cli_no_switch')
  requireFalse(missing.input?.externalBetaRuntimeSoakStartedByThisCommand, 'missing_cli_no_soak')
  requireFalse(missing.input?.routeExecutionPerformed, 'missing_cli_no_route')
  requireFalse(missing.input?.workerDispatchPerformedByThisCommand, 'missing_cli_no_dispatch')
  requireFalse(missing.input?.toolExecutionPerformed, 'missing_cli_no_tool')
  requireFalse(missing.input?.gpuRuntimePerformedByThisCommand, 'missing_cli_no_gpu')

  const accepted = runGate('sam2')
  requireEqual(accepted.status, acceptedStatus, 'accepted_status')
  requireTruthy(accepted.controlledTrafficRuntimeSoakObservedEvidenceAccepted, 'accepted_evidence')
  requireEqual(
    accepted.controlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence,
    1,
    'accepted_gate_count',
  )
  requireEqual(
    accepted.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAcceptedRequestsWithProvidedEvidence,
    1,
    'accepted_source_count',
  )
  requireEqual(
    accepted.controlledTrafficRuntimeSoakObservedToolsWithProvidedEvidence,
    1,
    'accepted_observed_count',
  )
  requireEqual(accepted.externalBetaTrafficSwitchEnabledByThisGateTools, 0, 'accepted_switch_count')
  requireEqual(accepted.externalBetaRuntimeSoakStartedByThisGateTools, 0, 'accepted_soak_count')
  requireEqual(accepted.externalBetaReadyNowTools, 0, 'accepted_external_beta_count')
  requireTruthy(
    accepted.observedResult?.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted,
    'observed_source',
  )
  requireTruthy(
    accepted.observedResult?.controlledTrafficRunObservedWithProvidedEvidence,
    'observed_traffic',
  )
  requireTruthy(
    accepted.observedResult?.gpuLifecycleObservedAsOnDemandWithProvidedEvidence,
    'observed_gpu_lifecycle',
  )
  requireFalse(
    accepted.observedResult?.controlledTrafficRunExecutedByThisGate,
    'observed_no_gate_traffic',
  )
  requireFalse(
    accepted.observedResult?.externalBetaRuntimeSoakStartedByThisGate,
    'observed_no_gate_soak',
  )
  verifyFalseGates(accepted, 'accepted')

  const badSource = runGate('sam2', privateObservedRefs('sam2'), (source) => {
    source.status =
      'missing_external_beta_operator_traffic_switch_runtime_soak_controls'
  })
  requireEqual(
    badSource.status,
    'external_beta_operator_traffic_switch_runtime_soak_authorization_rejected',
    'bad_source_status',
  )

  const badPublicRef = runGate('sam2', [
    '--external-beta-controlled-traffic-run-result-ref',
    'https://example.invalid/public/traffic-run-result.json',
    '--external-beta-runtime-soak-metrics-ref',
    'private://ai-graphics/external-beta/observed-soak/sam2/runtime-soak-metrics.json',
    '--external-beta-request-sample-audit-ref',
    'private://ai-graphics/external-beta/observed-soak/sam2/request-sample-audit.json',
    '--external-beta-zero-critical-incident-ref',
    'private://ai-graphics/external-beta/observed-soak/sam2/zero-critical-incident.json',
    '--external-beta-cost-observation-ref',
    'private://ai-graphics/external-beta/observed-soak/sam2/cost-observation.json',
    '--external-beta-gpu-lifecycle-observation-ref',
    'private://ai-graphics/external-beta/observed-soak/sam2/gpu-lifecycle-observation.json',
    '--external-beta-user-impact-review-ref',
    'private://ai-graphics/external-beta/observed-soak/sam2/user-impact-review.json',
    '--external-beta-rollback-readiness-ref',
    'private://ai-graphics/external-beta/observed-soak/sam2/rollback-readiness.json',
    '--external-beta-post-soak-owner-review-ref',
    'private://ai-graphics/external-beta/observed-soak/sam2/post-soak-owner-review.json',
  ])
  requireEqual(
    badPublicRef.status,
    'missing_external_beta_controlled_traffic_runtime_soak_result_evidence',
    'bad_public_ref_status',
  )
  if (!badPublicRef.rejectionReasons?.some((reason) => reason.includes('controlled traffic run result'))) {
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
    status:
      'ai_graphics_external_beta_controlled_traffic_runtime_soak_result_diagnostics_failed',
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status:
    'ai_graphics_external_beta_controlled_traffic_runtime_soak_result_diagnostics_passed',
  checkedFiles: requiredFiles.length,
  totalAiGraphicsTools: tools.length,
  gpuRuntimeTargetedTools: gpuTools.length,
  controlledTrafficRuntimeSoakObservedEvidenceAccepted: true,
  controlledTrafficRunExecutedByThisGate: false,
  externalBetaTrafficSwitchEnabledByThisGate: false,
  externalBetaRuntimeSoakStartedByThisGate: false,
  routeExecutionApprovedNow: false,
  workerDispatchApprovedNow: false,
  toolExecutionApprovedNow: false,
  gpuRuntimeShouldStartNow: false,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
