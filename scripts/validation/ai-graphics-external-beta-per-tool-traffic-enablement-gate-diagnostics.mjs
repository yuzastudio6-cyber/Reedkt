import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_per_tool_traffic_enablement_gate_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_per_tool_traffic_enablement_gate_ready_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-per-tool-traffic-enablement-gate'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-per-tool-traffic-enablement-gate:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-per-tool-traffic-enablement-gate-diagnostics.mjs'

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
  'externalBetaTrafficEnabledNow',
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
  'workerLeaseCreatedByTrafficGate',
  'workerDispatchPerformedByTrafficGate',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformedByTrafficGate',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts',
  'server/cli/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts',
  'scripts/validation/ai-graphics-external-beta-per-tool-traffic-enablement-gate-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-traffic-enablement-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-traffic-enablement-gate.md',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-callable-result-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-controls.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const generatedArtifactPathPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /externalBetaCallableNow["`:\s=]+true/i,
  /externalBetaTrafficEnabledNow["`:\s=]+true/i,
  /externalBetaTrafficSwitchApprovedNow["`:\s=]+true/i,
  /apiRouteExecutionApprovedNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /gpuRuntimePerformedByTrafficGate["`:\s=]+true/i,
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

function runtimeForTool(toolId) {
  return gpuTools.includes(toolId)
    ? {
      runtimeTarget: `native_linux_amd64_nvidia_l4_${toolId}_runtime`,
      workerType: 'gpu_ai_worker',
      gpuRequiredForRuntime: true,
    }
    : {
      runtimeTarget: 'node_cpu_static',
      workerType: 'render_worker',
      gpuRequiredForRuntime: false,
    }
}

function callableGateFixture(toolId) {
  const runtime = runtimeForTool(toolId)
  const capabilityId = capabilityByTool[toolId]
  const savedPerToolCallableResult = {
    ok: true,
    decision:
      'ai_graphics_external_beta_per_tool_callable_result_recorded_with_runtime_blocks',
    status:
      'external_beta_per_tool_callable_result_recorded_private_non_production_runtime_still_blocked',
    sourceWorkerRuntimeSmokeProofRef:
      `private://ai-graphics/external-beta/callable-result/${toolId}/worker-runtime-smoke-proof.json`,
    sourceWorkerRuntimeSmokeProofAccepted: true,
    toolId,
    capabilityId,
    routePath: '/api/ai-graphics/external-beta/tool-call',
    routeId: `ai_graphics_external_beta_tool_route_${toolId}`,
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    idempotencyKey:
      `external-beta-idempotency-${toolId}:worker-runtime-smoke-authorization`,
    runtimeTarget: runtime.runtimeTarget,
    workerType: runtime.workerType,
    gpuRequiredForRuntime: runtime.gpuRequiredForRuntime,
    privateInputManifestRef:
      `private://ai-graphics/external-beta/artifacts/${toolId}/input-manifest.json`,
    privateOutputManifestRef:
      `private://ai-graphics/external-beta/artifacts/${toolId}/output-manifest.json`,
    privateTelemetryRef:
      `private://ai-graphics/external-beta/artifacts/${toolId}/telemetry.json`,
    privateLeaseAuditRef:
      `private://ai-graphics/external-beta/artifacts/${toolId}/lease-audit.json`,
    modelWeightOrCacheManifestRef: runtime.gpuRequiredForRuntime
      ? `private://ai-graphics/external-beta/artifacts/${toolId}/model-weight-or-cache-manifest.json`
      : null,
  }
  return {
    decision:
      'ai_graphics_external_beta_per_tool_callable_result_gate_prepared_with_runtime_blocks',
    sourceWorkerRuntimeSmokeProofDecision:
      'ai_graphics_external_beta_api_route_worker_runtime_smoke_proof_prepared_with_runtime_blocks',
    status: 'external_beta_per_tool_callable_result_gate_accepted_runtime_still_blocked',
    sourceWorkerRuntimeSmokeProofAccepted: true,
    callableResultGateAcceptedWithProvidedEvidence: true,
    rejectionReasons: [],
    requestedToolId: toolId,
    capabilityId,
    perToolCallableResultGateAcceptedRequestsWithProvidedEvidence: 1,
    sourceWorkerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence: 1,
    callableEnvelopeAcceptedWithProvidedEvidence: 1,
    workerRuntimeSmokeProofAcceptedWithProvidedEvidence: 1,
    workerLeaseLifecycleAcceptedWithProvidedEvidence: 1,
    workerDispatchAcceptedWithProvidedEvidence: 1,
    toolExecutionAcceptedWithProvidedEvidence: 0,
    routeExecutionAcceptedWithProvidedEvidence: 0,
    privateArtifactWriteAcceptedWithProvidedEvidence: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    savedPerToolCallableResult,
    booleans: {
      sourceWorkerRuntimeSmokeProofAccepted: true,
      savedPerToolCallableResultAcceptedWithProvidedEvidence: true,
      gpuRuntimeStartedForCallableResult: false,
      toolExecutionAcceptedWithProvidedEvidence: false,
      agentCanExecuteToolsNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function launchGoNoGoFixture() {
  return {
    decision: 'ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks',
    status: 'external_beta_launch_go_no_go_approved_runtime_still_blocked',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    externalBetaLaunchGoNoGoApprovalRecordAccepted: true,
    externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence: 21,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    requiredLaunchApprovalRecord: {
      approvesRuntimeNow: false,
    },
    booleans: {
      sourceExternalBetaLaunchControlsAccepted: true,
      externalBetaLaunchGoNoGoApprovalRecordAccepted: true,
      all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function privateTrafficRefs(toolId) {
  return [
    '--external-beta-traffic-owner-approval-ref',
    `private://ai-graphics/external-beta/traffic/${toolId}/owner-approval.json`,
    '--external-beta-traffic-feature-flag-ref',
    `private://ai-graphics/external-beta/traffic/${toolId}/feature-flag.json`,
    '--external-beta-traffic-rollout-cohort-ref',
    `private://ai-graphics/external-beta/traffic/${toolId}/rollout-cohort.json`,
    '--external-beta-traffic-kill-switch-ref',
    `private://ai-graphics/external-beta/traffic/${toolId}/kill-switch.json`,
    '--external-beta-traffic-rate-limit-ref',
    `private://ai-graphics/external-beta/traffic/${toolId}/rate-limit.json`,
    '--external-beta-traffic-cost-ceiling-ref',
    `private://ai-graphics/external-beta/traffic/${toolId}/cost-ceiling.json`,
    '--external-beta-traffic-support-runbook-ref',
    `private://ai-graphics/external-beta/traffic/${toolId}/support-runbook.md`,
    '--external-beta-traffic-telemetry-ref',
    `private://ai-graphics/external-beta/traffic/${toolId}/telemetry.json`,
    '--external-beta-traffic-rollback-ref',
    `private://ai-graphics/external-beta/traffic/${toolId}/rollback.json`,
  ]
}

function runGate(toolId, extraArgs = privateTrafficRefs(toolId), mutateLaunch) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-traffic-gate-'))
  const callableGate = callableGateFixture(toolId)
  const launchGoNoGo = launchGoNoGoFixture()
  if (mutateLaunch) mutateLaunch(launchGoNoGo)
  const callablePath = writeJson(path.join(tempDir, 'callable-gate.json'), callableGate)
  const launchPath = writeJson(path.join(tempDir, 'launch-go-no-go.json'), launchGoNoGo)
  return npmJson(runScriptName, [
    '--external-beta-per-tool-callable-result-gate-packet',
    callablePath,
    '--external-beta-launch-go-no-go-packet',
    launchPath,
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
    '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization": "tsx server/cli/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization.ts",',
    '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization-diagnostics.mjs",',
    '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result": "tsx server/cli/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts",',
    '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-traffic-runtime-soak-result-diagnostics.mjs",',
    '+    "ai-graphics:external-beta-activation-go-no-go": "tsx server/cli/ai-graphics-external-beta-activation-go-no-go.ts",',
    '+    "ai-graphics:external-beta-activation-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-activation-go-no-go-diagnostics.mjs",',
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
  const docJson = json('docs/tool-intelligence/ai-graphics/external-beta-per-tool-traffic-enablement-gate.json')
  requireEqual(docJson.decision, decision, 'doc_json_decision')
  requireEqual(docJson.status, acceptedStatus, 'doc_json_status')
  requireEqual(docJson.scope?.totalAiGraphicsTools, 21, 'doc_json_tool_count')
  requireEqual(docJson.scope?.productFacingCapabilities, 12, 'doc_json_capability_count')
  requireEqual(docJson.scope?.gpuRuntimeTargetedTools, 8, 'doc_json_gpu_count')
  requireEqual(docJson.scope?.perToolTrafficEnablementPreparedRequestsWithProvidedEvidence, 1, 'doc_json_gate_count')
  requireEqual(docJson.scope?.sourceCallableResultGateAcceptedRequestsWithProvidedEvidence, 1, 'doc_json_callable_gate_count')
  requireEqual(docJson.scope?.sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence, 21, 'doc_json_launch_count')
  requireEqual(docJson.scope?.externalBetaTrafficEnabledNowTools, 0, 'doc_json_traffic_now_count')
  requireEqual(docJson.scope?.externalBetaReadyNowTools, 0, 'doc_json_external_beta_count')
  requireEqual(docJson.scope?.productionReadyNowTools, 0, 'doc_json_production_count')
  for (const tool of tools) {
    if (!docJson.tools?.includes(tool)) fail(`doc_json_missing_tool:${tool}`)
  }
  for (const tool of gpuTools) {
    if (!docJson.gpuTools?.includes(tool)) fail(`doc_json_missing_gpu_tool:${tool}`)
  }
  for (const key of [
    'externalBetaPerToolTrafficEnablementGatePrepared',
    'sourcePerToolCallableResultGateAccepted',
    'sourceExternalBetaLaunchGoNoGoAccepted',
    'trafficEnablementControlsAccepted',
    'perToolTrafficEnablementPreparedWithProvidedEvidence',
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

  const md = read('docs/tool-intelligence/ai-graphics/external-beta-per-tool-traffic-enablement-gate.md')
  for (const required of [
    decision,
    'does not enable traffic',
    '`externalBetaTrafficEnabledNow=false`',
    '`externalBetaTrafficSwitchApprovedNow=false`',
    '`gpuRuntimeShouldStartNow=false`',
    'This gate only proves the controls exist.',
  ]) {
    if (!md.includes(required)) fail(`traffic_md_missing:${required}`)
  }

  const scorecard = read('docs/production-beta-readiness-scorecard.md')
  for (const required of [
    'AI Graphics External-Beta Per-Tool Traffic Enablement Gate',
    decision,
    'per-tool traffic enablement metadata gate',
    '`gpuRuntimeShouldStartNow` remains false',
  ]) {
    if (!scorecard.includes(required)) fail(`scorecard_missing:${required}`)
  }

  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-beta-per-tool-traffic-enablement-gate.json',
    'docs/tool-intelligence/ai-graphics/external-beta-per-tool-traffic-enablement-gate.md',
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
  if (!registry.includes("export * from './ai-graphics-external-beta-per-tool-traffic-enablement-gate'")) {
    fail('missing_registry_export')
  }
  const evaluator = read('server/tool-registry/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts')
  for (const required of [
    decision,
    'prepared_per_tool_traffic_enablement_metadata_only',
    'noExternalBetaTrafficEnabledByGate: true',
    'noLiveApiRouteExecutionByGate: true',
    'noLiveWorkerDispatchByGate: true',
    'noToolExecutionByGate: true',
    'noGpuRuntimeStartByGate: true',
    'externalBetaTrafficEnabledNow: false',
    'gpuRuntimeShouldStartNow: false',
    'toolExecutionApprovedNow: false',
  ]) {
    if (!evaluator.includes(required)) fail(`evaluator_missing:${required}`)
  }
}

function verifyCliBehavior() {
  const missing = npmJson(runScriptName)
  requireEqual(
    missing.status,
    'missing_external_beta_per_tool_callable_result_gate',
    'missing_cli_status',
  )
  requireFalse(missing.input?.externalBetaTrafficEnabledByThisCommand, 'missing_cli_no_traffic')
  requireFalse(missing.input?.routeExecutionPerformed, 'missing_cli_no_route')
  requireFalse(missing.input?.workerDispatchPerformedByThisCommand, 'missing_cli_no_dispatch')
  requireFalse(missing.input?.toolExecutionPerformed, 'missing_cli_no_tool')
  requireFalse(missing.input?.gpuRuntimePerformedByThisCommand, 'missing_cli_no_gpu')

  const accepted = runGate('sam2')
  requireEqual(accepted.status, acceptedStatus, 'accepted_status')
  requireTruthy(accepted.trafficEnablementControlsAccepted, 'accepted_controls')
  requireEqual(accepted.perToolTrafficEnablementPreparedRequestsWithProvidedEvidence, 1, 'accepted_gate_count')
  requireEqual(accepted.sourceCallableResultGateAcceptedRequestsWithProvidedEvidence, 1, 'accepted_callable_count')
  requireEqual(accepted.sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence, 21, 'accepted_launch_count')
  requireEqual(accepted.externalBetaTrafficCandidateToolsWithProvidedEvidence, 1, 'accepted_candidate_count')
  requireEqual(accepted.externalBetaTrafficEnabledNowTools, 0, 'accepted_traffic_now_count')
  requireTruthy(accepted.trafficEnablementCandidate?.sourceCallableResultGateAccepted, 'candidate_callable')
  requireTruthy(accepted.trafficEnablementCandidate?.sourceExternalBetaLaunchGoNoGoAccepted, 'candidate_launch')
  requireFalse(accepted.trafficEnablementCandidate?.externalBetaTrafficEnabledNow, 'candidate_traffic_false')
  verifyFalseGates(accepted, 'accepted')

  const badLaunch = runGate('sam2', privateTrafficRefs('sam2'), (launch) => {
    launch.status = 'awaiting_external_beta_launch_go_no_go_approval'
  })
  requireEqual(
    badLaunch.status,
    'external_beta_launch_go_no_go_rejected',
    'bad_launch_status',
  )

  const badPublicRef = runGate('sam2', [
    '--external-beta-traffic-owner-approval-ref',
    'https://example.invalid/public/owner.json',
    '--external-beta-traffic-feature-flag-ref',
    'private://ai-graphics/external-beta/traffic/sam2/feature-flag.json',
    '--external-beta-traffic-rollout-cohort-ref',
    'private://ai-graphics/external-beta/traffic/sam2/rollout-cohort.json',
    '--external-beta-traffic-kill-switch-ref',
    'private://ai-graphics/external-beta/traffic/sam2/kill-switch.json',
    '--external-beta-traffic-rate-limit-ref',
    'private://ai-graphics/external-beta/traffic/sam2/rate-limit.json',
    '--external-beta-traffic-cost-ceiling-ref',
    'private://ai-graphics/external-beta/traffic/sam2/cost-ceiling.json',
    '--external-beta-traffic-support-runbook-ref',
    'private://ai-graphics/external-beta/traffic/sam2/support-runbook.md',
    '--external-beta-traffic-telemetry-ref',
    'private://ai-graphics/external-beta/traffic/sam2/telemetry.json',
    '--external-beta-traffic-rollback-ref',
    'private://ai-graphics/external-beta/traffic/sam2/rollback.json',
  ])
  requireEqual(
    badPublicRef.status,
    'missing_external_beta_per_tool_traffic_enablement_controls',
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
    status: 'ai_graphics_external_beta_per_tool_traffic_enablement_gate_diagnostics_failed',
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: 'ai_graphics_external_beta_per_tool_traffic_enablement_gate_diagnostics_passed',
  checkedFiles: requiredFiles.length,
  totalAiGraphicsTools: tools.length,
  gpuRuntimeTargetedTools: gpuTools.length,
  trafficEnablementMetadataAccepted: true,
  externalBetaTrafficEnabledNow: false,
  routeExecutionApprovedNow: false,
  workerDispatchApprovedNow: false,
  toolExecutionApprovedNow: false,
  gpuRuntimeShouldStartNow: false,
  runtimeReadyNow: false,
  productionReadyNow: false,
}, null, 2))
