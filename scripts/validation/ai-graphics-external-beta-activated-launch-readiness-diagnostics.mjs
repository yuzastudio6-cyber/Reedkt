import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_activated_launch_readiness_approved_with_runtime_blocks'
const acceptedStatus =
  'external_beta_activated_launch_ready_for_controlled_on_demand_tool_calls'
const launchDecision =
  'ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks'
const launchStatus = 'external_beta_launch_go_no_go_approved_runtime_still_blocked'
const activationDecision =
  'ai_graphics_external_beta_all_21_activation_rollup_approved_with_runtime_blocks'
const activationStatus =
  'external_beta_all_21_activation_rollup_accepted_runtime_on_demand'
const runScriptName = 'ai-graphics:external-beta-activated-launch-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-activated-launch-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-activated-launch-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-activated-launch-readiness-diagnostics.mjs'

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
  'gpuRuntimePerformedByReadinessGate',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const trueReadinessKeys = [
  'externalBetaActivatedLaunchReadinessPrepared',
  'sourceExternalBetaLaunchGoNoGoAccepted',
  'sourceExternalBetaAll21ActivationRollupAccepted',
  'all21ExternalBetaActivatedLaunchReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
  'controlledExternalBetaToolCallGatewayReadyNow',
  'controlledWorkerToolCallReadyNow',
  'externalBetaCallableNow',
  'externalBetaReadyNow',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-activated-launch-readiness.ts',
  'server/cli/ai-graphics-external-beta-activated-launch-readiness.ts',
  'scripts/validation/ai-graphics-external-beta-activated-launch-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.md',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/external-beta-all-21-activation-rollup.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const generatedArtifactPathPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /directAgentToolExecutionApprovedNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /gpuRuntimePerformedByReadinessGate["`:\s=]+true/i,
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

function acceptedLaunchPacket() {
  return {
    decision: launchDecision,
    sourceExternalBetaLaunchGapDecision:
      'ai_graphics_external_beta_launch_gap_report_prepared_with_runtime_blocks',
    sourceExternalBetaEvidenceAdmissionBundleDecision:
      'ai_graphics_external_beta_evidence_admission_bundle_prepared_with_runtime_blocks',
    sourceExternalBetaServiceRoleQueueSmokePreflightDecision:
      'ai_graphics_external_beta_service_role_queue_smoke_preflight_prepared_with_runtime_blocks',
    sourceExternalBetaServiceRoleQueueSmokeProofDecision:
      'ai_graphics_external_beta_service_role_queue_smoke_proof_prepared_with_runtime_blocks',
    sourceExternalBetaLaunchControlsDecision:
      'ai_graphics_external_beta_launch_controls_approved_with_runtime_blocks',
    status: launchStatus,
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
    sourceLaunchGapReport: {},
    sourceEvidenceAdmissionBundle: {},
    sourceServiceRoleQueueSmokePreflight: {},
    sourceServiceRoleQueueSmokeProof: {},
    sourceLaunchControls: {},
    requiredLaunchApprovalRecord: {
      required: true,
      approverRole: 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER',
      launchRefRequired: true,
      rolloutCohortRefRequired: true,
      costConcurrencyCeilingRefRequired: true,
      rollbackIncidentRunbookRefRequired: true,
      privateArtifactRetentionSupportRefRequired: true,
      approvesRuntimeNow: false,
    },
    allowedLaunchGoNoGoActions: [],
    blockedRuntimeActions: [],
    missingLaunchGoNoGoEvidence: [],
    nextMilestones: [],
    booleans: {
      externalBetaLaunchGoNoGoContractPrepared: true,
      sourceExternalBetaLaunchGapAccepted: true,
      sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted: true,
      sourceExternalBetaEvidenceAdmissionBundleAccepted: true,
      sourceExternalBetaServiceRoleQueueSmokePreflightAccepted: true,
      sourceExternalBetaServiceRoleQueueSmokeProofAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      sourceExternalBetaLaunchControlsAccepted: true,
      externalBetaLaunchCandidateWithProvidedEvidence: true,
      externalBetaLaunchGoNoGoApprovalRecordAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

function acceptedActivationRollupPacket() {
  return {
    decision: activationDecision,
    sourceActivationGoNoGoDecision:
      'ai_graphics_external_beta_activation_go_no_go_approved_with_runtime_blocks',
    status: activationStatus,
    rejectionReasons: [],
    acceptedToolIds: tools,
    missingToolIds: [],
    duplicateToolIds: [],
    externalBetaActivationGoNoGoAcceptedToolsWithProvidedEvidence: 21,
    externalBetaToolCallReadyNowTools: 21,
    externalBetaReadyNowTools: 21,
    runtimeReadyForOnDemandExternalBetaToolCallTools: 21,
    productionReadyNowTools: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    activatedTools: tools.map((toolId) => ({
      toolId,
      capabilityId: capabilityByTool[toolId],
      routePath: '/api/ai-graphics/external-beta/tool-call',
      routeId: `ai_graphics_external_beta_tool_route_${toolId}`,
      gpuRuntimeTargetedTool: gpuTools.has(toolId),
      externalBetaToolCallReadyNow: true,
      runtimeReadyForOnDemandExternalBetaToolCall: true,
      gpuRuntimeOnDemandOnly: true,
      gpuRuntimeShouldStartNow: false,
      productionReadyNow: false,
    })),
    policy: {
      approvesAll21ExternalBetaToolCallReadinessMetadata: true,
      directAgentExecutionStillBlocked: true,
      runtimeStartsOnlyForAcceptedWorkerJob: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      noProductionUnlockByRollup: true,
      noPublicArtifactsByRollup: true,
      nextGateRequiresExternalBetaLaunchOwnerApproval: true,
    },
    booleans: {
      externalBetaAll21ActivationRollupPrepared: true,
      sourceActivationGoNoGoPacketsAcceptedWithProvidedEvidence: true,
      all21ActivationGoNoGoPacketsAcceptedWithProvidedEvidence: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      controlledWorkerToolCallReadyNow: true,
      externalBetaCallableNow: true,
      externalBetaReadyNow: true,
      productionReadyNow: false,
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
      productionReadyNowGlobal: false,
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
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByActivationRollup: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

function runGate(options = {}) {
  const launch = Object.prototype.hasOwnProperty.call(options, 'launch')
    ? options.launch
    : acceptedLaunchPacket()
  const activation = Object.prototype.hasOwnProperty.call(options, 'activation')
    ? options.activation
    : acceptedActivationRollupPacket()
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), '.tmp-ai-graphics-activated-launch-'))
  const args = []
  if (launch) {
    args.push('--external-beta-launch-go-no-go-packet', writeJson(path.join(tempDir, 'launch.json'), launch))
  }
  if (activation) {
    args.push('--external-beta-all-21-activation-rollup-packet', writeJson(path.join(tempDir, 'activation.json'), activation))
  }
  const output = npmJson(runScriptName, args)
  fs.rmSync(tempDir, { recursive: true, force: true })
  return output
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

function verifyTrueReadiness(packet, label) {
  for (const key of trueReadinessKeys) {
    if (packet.booleans?.[key] !== true) {
      fail(`${label}:boolean_${key}_must_be_true`)
    }
  }
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
  const docJson = json('docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json')
  requireEqual(docJson.decision, decision, 'doc_json_decision')
  requireEqual(docJson.status, acceptedStatus, 'doc_json_status')
  requireEqual(docJson.scope?.totalAiGraphicsTools, 21, 'doc_json_tool_count')
  requireEqual(docJson.scope?.productFacingCapabilities, 12, 'doc_json_capability_count')
  requireEqual(docJson.scope?.gpuRuntimeTargetedTools, 8, 'doc_json_gpu_count')
  requireEqual(docJson.scope?.externalBetaActivatedLaunchReadyToolsWithProvidedEvidence, 21, 'doc_json_ready_count')
  requireEqual(docJson.scope?.externalBetaToolCallReadyNowTools, 21, 'doc_json_tool_call_ready_count')
  requireEqual(docJson.scope?.externalBetaReadyNowTools, 21, 'doc_json_external_beta_count')
  requireEqual(docJson.scope?.runtimeReadyForOnDemandExternalBetaToolCallTools, 21, 'doc_json_runtime_ready_count')
  requireEqual(docJson.scope?.productionReadyNowTools, 0, 'doc_json_production_count')
  for (const key of trueReadinessKeys) {
    requireTruthy(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }
  for (const key of falseGateKeys) {
    requireFalse(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }

  const md = read('docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.md')
  for (const required of [
    decision,
    'controlled on-demand external-beta tool calls',
    '`externalBetaToolCallReadyNowTools`: 21',
    '`externalBetaReadyNowTools`: 21',
    '`runtimeReadyForOnDemandExternalBetaToolCallTools`: 21',
    '`agentCanExecuteToolsNow=false`',
    '`gpuRuntimeShouldStartNow=false`',
    '`productionReadyNow=false`',
  ]) {
    if (!md.includes(required)) fail(`activated_launch_md_missing:${required}`)
  }

  const scorecard = read('docs/production-beta-readiness-scorecard.md')
  for (const required of [
    'AI Graphics External-Beta Activated Launch Readiness',
    decision,
    'externalBetaReadyNowTools=21',
    '`gpuRuntimeShouldStartNow` remains false',
  ]) {
    if (!scorecard.includes(required)) fail(`scorecard_missing:${required}`)
  }

  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json',
    'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.md',
    'docs/production-beta-readiness-scorecard.md',
  ]) {
    const content = read(file)
    forbiddenDocPatterns.forEach((pattern) => {
      if (pattern.test(content)) fail(`forbidden_claim:${file}:${pattern}`)
    })
  }
}

function verifySourceWiring() {
  requiredFiles.forEach(read)
  const registry = read('server/tool-registry/index.ts')
  if (!registry.includes("export * from './ai-graphics-external-beta-activated-launch-readiness'")) {
    fail('missing_registry_export')
  }
  const evaluator = read('server/tool-registry/ai-graphics-external-beta-activated-launch-readiness.ts')
  for (const required of [
    decision,
    'controlled_external_beta_on_demand_tool_call_metadata',
    'approvesControlledExternalBetaToolCallReadiness: true',
    'directAgentExecutionStillBlocked: true',
    'runtimeStartsOnlyForAcceptedWorkerJob: true',
    'noProductionUnlockByReadinessGate: true',
    'externalBetaReadyNow: accepted',
    'gpuRuntimeShouldStartNow: false',
    'productionReadyNow: false',
  ]) {
    if (!evaluator.includes(required)) fail(`evaluator_missing:${required}`)
  }
}

function verifyCliBehavior() {
  const missing = npmJson(runScriptName)
  requireEqual(missing.status, 'missing_external_beta_launch_go_no_go', 'missing_cli_status')
  requireFalse(missing.input?.directAgentToolExecutionPerformed, 'missing_cli_no_direct_agent')
  requireFalse(missing.input?.routeExecutionPerformed, 'missing_cli_no_route')
  requireFalse(missing.input?.workerDispatchPerformedByThisCommand, 'missing_cli_no_dispatch')
  requireFalse(missing.input?.toolExecutionPerformed, 'missing_cli_no_tool')
  requireFalse(missing.input?.gpuRuntimePerformedByThisCommand, 'missing_cli_no_gpu')

  const rejectedLaunch = acceptedLaunchPacket()
  rejectedLaunch.status = 'awaiting_external_beta_launch_go_no_go_approval'
  const rejectedLaunchOutput = runGate({ launch: rejectedLaunch })
  requireEqual(rejectedLaunchOutput.status, 'external_beta_launch_go_no_go_rejected', 'rejected_launch_status')
  requireEqual(rejectedLaunchOutput.externalBetaReadyNowTools, 0, 'rejected_launch_external_beta_ready')
  verifyFalseGates(rejectedLaunchOutput, 'rejected_launch')

  const missingActivation = runGate({ activation: undefined })
  requireEqual(missingActivation.status, 'missing_external_beta_all_21_activation_rollup', 'missing_activation_status')
  requireEqual(missingActivation.externalBetaReadyNowTools, 0, 'missing_activation_external_beta_ready')
  verifyFalseGates(missingActivation, 'missing_activation')

  const rejectedActivation = acceptedActivationRollupPacket()
  rejectedActivation.status = 'partial_external_beta_activation_go_no_go_packets'
  const rejectedActivationOutput = runGate({ activation: rejectedActivation })
  requireEqual(rejectedActivationOutput.status, 'external_beta_all_21_activation_rollup_rejected', 'rejected_activation_status')
  requireEqual(rejectedActivationOutput.externalBetaReadyNowTools, 0, 'rejected_activation_external_beta_ready')
  verifyFalseGates(rejectedActivationOutput, 'rejected_activation')

  const accepted = runGate()
  requireEqual(accepted.status, acceptedStatus, 'accepted_status')
  requireTruthy(accepted.sourceExternalBetaLaunchGoNoGoAccepted, 'accepted_launch')
  requireTruthy(accepted.sourceExternalBetaAll21ActivationRollupAccepted, 'accepted_activation')
  requireEqual(
    accepted.externalBetaActivatedLaunchReadyToolsWithProvidedEvidence,
    21,
    'accepted_ready_count',
  )
  requireEqual(accepted.externalBetaToolCallReadyNowTools, 21, 'accepted_tool_call_ready')
  requireEqual(accepted.externalBetaReadyNowTools, 21, 'accepted_external_beta_ready')
  requireEqual(accepted.runtimeReadyForOnDemandExternalBetaToolCallTools, 21, 'accepted_runtime_on_demand')
  requireEqual(accepted.productionReadyNowTools, 0, 'accepted_production_count')
  requireEqual(accepted.readinessMode, 'controlled_external_beta_on_demand_tool_call_metadata', 'accepted_readiness_mode')
  requireFalse(accepted.gpuRuntimeShouldStartNow, 'accepted_gpu_should_not_start')
  verifyTrueReadiness(accepted, 'accepted')
  verifyFalseGates(accepted, 'accepted')
}

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
    status: 'ai_graphics_external_beta_activated_launch_readiness_diagnostics_failed',
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: 'ai_graphics_external_beta_activated_launch_readiness_diagnostics_passed',
  checkedFiles: requiredFiles.length,
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  externalBetaActivatedLaunchReadyToolsWithProvidedEvidence: 21,
  externalBetaToolCallReadyNowTools: 21,
  externalBetaReadyNowTools: 21,
  runtimeReadyForOnDemandExternalBetaToolCallTools: 21,
  agentCanExecuteToolsNow: false,
  gpuRuntimeShouldStartNow: false,
  productionReadyNowTools: 0,
}, null, 2))
