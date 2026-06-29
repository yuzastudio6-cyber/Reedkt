import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_all_21_activation_rollup_approved_with_runtime_blocks'
const acceptedStatus =
  'external_beta_all_21_activation_rollup_accepted_runtime_on_demand'
const sourceDecision =
  'ai_graphics_external_beta_activation_go_no_go_approved_with_runtime_blocks'
const sourceStatus =
  'external_beta_activation_go_no_go_approved_for_one_tool_runtime_on_demand'
const runScriptName = 'ai-graphics:external-beta-all-21-activation-rollup'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-all-21-activation-rollup.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-all-21-activation-rollup:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-all-21-activation-rollup-diagnostics.mjs'

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
  'gpuRuntimePerformedByActivationRollup',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const trueRollupKeys = [
  'externalBetaAll21ActivationRollupPrepared',
  'sourceActivationGoNoGoPacketsAcceptedWithProvidedEvidence',
  'all21ActivationGoNoGoPacketsAcceptedWithProvidedEvidence',
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
  'server/tool-registry/ai-graphics-external-beta-all-21-activation-rollup.ts',
  'server/cli/ai-graphics-external-beta-all-21-activation-rollup.ts',
  'scripts/validation/ai-graphics-external-beta-all-21-activation-rollup-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-all-21-activation-rollup.json',
  'docs/tool-intelligence/ai-graphics/external-beta-all-21-activation-rollup.md',
  'docs/tool-intelligence/ai-graphics/external-beta-activation-go-no-go.json',
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
  /gpuRuntimePerformedByActivationRollup["`:\s=]+true/i,
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

function activationPacketFixture(toolId) {
  const capabilityId = capabilityByTool[toolId]
  const routeId = `ai_graphics_external_beta_tool_route_${toolId}`
  return {
    decision: sourceDecision,
    sourceControlledTrafficRuntimeSoakResultDecision:
      'ai_graphics_external_beta_controlled_traffic_runtime_soak_result_prepared_with_runtime_blocks',
    status: sourceStatus,
    sourceControlledTrafficRuntimeSoakResultAccepted: true,
    externalBetaActivationControlsAccepted: true,
    rejectionReasons: [],
    requestedToolId: toolId,
    capabilityId,
    externalBetaActivationGoNoGoApprovedToolsWithProvidedEvidence: 1,
    sourceControlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence: 1,
    externalBetaToolCallReadyNowTools: 1,
    externalBetaReadyNowTools: 1,
    runtimeReadyForOnDemandExternalBetaToolCallTools: 1,
    productionReadyNowTools: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    activatedToolCallReadiness: {
      toolId,
      capabilityId,
      routePath: '/api/ai-graphics/external-beta/tool-call',
      routeId,
      sourceControlledTrafficRuntimeSoakResultAccepted: true,
      externalBetaActivationApprovedWithProvidedEvidence: true,
      externalBetaToolCallReadyNow: true,
      runtimeReadyForOnDemandExternalBetaToolCall: true,
      gpuRuntimeOnDemandOnly: true,
      gpuRuntimeShouldStartNow: false,
      productionReadyNow: false,
      ownerApprovalRef: `private://ai-graphics/external-beta/activation/${toolId}/owner-approval.json`,
      featureFlagRef: `private://ai-graphics/external-beta/activation/${toolId}/feature-flag.json`,
      cohortRef: `private://ai-graphics/external-beta/activation/${toolId}/cohort.json`,
      supportAckRef: `private://ai-graphics/external-beta/activation/${toolId}/support-ack.json`,
      monitoringLiveRef: `private://ai-graphics/external-beta/activation/${toolId}/monitoring-live.json`,
      costBudgetFinalRef: `private://ai-graphics/external-beta/activation/${toolId}/cost-budget-final.json`,
      rollbackArmedRef: `private://ai-graphics/external-beta/activation/${toolId}/rollback-armed.json`,
      releaseNotesRef: `private://ai-graphics/external-beta/activation/${toolId}/release-notes.md`,
      userCommsRef: `private://ai-graphics/external-beta/activation/${toolId}/user-comms.md`,
      postActivationReviewRef: `private://ai-graphics/external-beta/activation/${toolId}/post-activation-review.json`,
    },
    evidence: {
      ownerApprovalRef: `private://ai-graphics/external-beta/activation/${toolId}/owner-approval.json`,
      featureFlagRef: `private://ai-graphics/external-beta/activation/${toolId}/feature-flag.json`,
      cohortRef: `private://ai-graphics/external-beta/activation/${toolId}/cohort.json`,
      supportAckRef: `private://ai-graphics/external-beta/activation/${toolId}/support-ack.json`,
      monitoringLiveRef: `private://ai-graphics/external-beta/activation/${toolId}/monitoring-live.json`,
      costBudgetFinalRef: `private://ai-graphics/external-beta/activation/${toolId}/cost-budget-final.json`,
      rollbackArmedRef: `private://ai-graphics/external-beta/activation/${toolId}/rollback-armed.json`,
      releaseNotesRef: `private://ai-graphics/external-beta/activation/${toolId}/release-notes.md`,
      userCommsRef: `private://ai-graphics/external-beta/activation/${toolId}/user-comms.md`,
      postActivationReviewRef: `private://ai-graphics/external-beta/activation/${toolId}/post-activation-review.json`,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredActivationMode: 'external_beta_tool_call_ready_on_demand_metadata_only',
      sourceControlledTrafficRuntimeSoakResultRequired: true,
    },
    policy: {
      approvesExternalBetaToolCallReadinessMetadata: true,
      directAgentExecutionStillBlocked: true,
      runtimeStartsOnlyForAcceptedWorkerJob: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      noProductionUnlockByGate: true,
      noPublicArtifactsByGate: true,
      nextGateRequiresAll21ToolActivationRollup: true,
    },
    booleans: {
      externalBetaActivationGoNoGoPrepared: true,
      sourceControlledTrafficRuntimeSoakResultAccepted: true,
      externalBetaActivationControlsAccepted: true,
      externalBetaActivationApprovedWithProvidedEvidence: true,
      externalBetaToolCallReadyNow: true,
      runtimeReadyForOnDemandExternalBetaToolCall: true,
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
      controlledTrafficRunExecutedByThisGate: false,
      apiRouteExecutionPerformedByThisGate: false,
      workerDispatchPerformedByThisGate: false,
      toolExecutionPerformedByThisGate: false,
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
      gpuRuntimePerformedByActivationGate: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

function packetArgsForTools(toolIds) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-all21-activation-'))
  return toolIds.flatMap((toolId) => [
    '--external-beta-activation-go-no-go-packet',
    writeJson(path.join(tempDir, `${toolId}.json`), activationPacketFixture(toolId)),
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

function verifyTrueRollup(packet, label) {
  for (const key of trueRollupKeys) {
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
  const docJson = json('docs/tool-intelligence/ai-graphics/external-beta-all-21-activation-rollup.json')
  requireEqual(docJson.decision, decision, 'doc_json_decision')
  requireEqual(docJson.status, acceptedStatus, 'doc_json_status')
  requireEqual(docJson.scope?.totalAiGraphicsTools, 21, 'doc_json_tool_count')
  requireEqual(docJson.scope?.productFacingCapabilities, 12, 'doc_json_capability_count')
  requireEqual(docJson.scope?.gpuRuntimeTargetedTools, 8, 'doc_json_gpu_count')
  requireEqual(docJson.scope?.externalBetaActivationGoNoGoAcceptedToolsWithProvidedEvidence, 21, 'doc_json_activation_count')
  requireEqual(docJson.scope?.externalBetaToolCallReadyNowTools, 21, 'doc_json_tool_call_ready_count')
  requireEqual(docJson.scope?.externalBetaReadyNowTools, 21, 'doc_json_external_beta_count')
  requireEqual(docJson.scope?.runtimeReadyForOnDemandExternalBetaToolCallTools, 21, 'doc_json_runtime_ready_count')
  requireEqual(docJson.scope?.productionReadyNowTools, 0, 'doc_json_production_count')
  for (const tool of tools) {
    if (!docJson.tools?.includes(tool)) fail(`doc_json_missing_tool:${tool}`)
  }
  for (const tool of gpuTools) {
    if (!docJson.gpuTools?.includes(tool)) fail(`doc_json_missing_gpu_tool:${tool}`)
  }
  for (const key of trueRollupKeys) {
    requireTruthy(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }
  for (const key of falseGateKeys) {
    requireFalse(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }

  const md = read('docs/tool-intelligence/ai-graphics/external-beta-all-21-activation-rollup.md')
  for (const required of [
    decision,
    'external-beta tool-call ready',
    '`externalBetaToolCallReadyNowTools`: 21',
    '`externalBetaReadyNowTools`: 21',
    '`runtimeReadyForOnDemandExternalBetaToolCallTools`: 21',
    '`agentCanExecuteToolsNow=false`',
    '`gpuRuntimeShouldStartNow=false`',
    '`productionReadyNow=false`',
  ]) {
    if (!md.includes(required)) fail(`all21_activation_md_missing:${required}`)
  }

  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-beta-all-21-activation-rollup.json',
    'docs/tool-intelligence/ai-graphics/external-beta-all-21-activation-rollup.md',
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
  if (!registry.includes("export * from './ai-graphics-external-beta-all-21-activation-rollup'")) {
    fail('missing_registry_export')
  }
  const evaluator = read('server/tool-registry/ai-graphics-external-beta-all-21-activation-rollup.ts')
  for (const required of [
    decision,
    'approvesAll21ExternalBetaToolCallReadinessMetadata: true',
    'directAgentExecutionStillBlocked: true',
    'runtimeStartsOnlyForAcceptedWorkerJob: true',
    'noProductionUnlockByRollup: true',
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
    'missing_external_beta_activation_go_no_go_packets',
    'missing_cli_status',
  )
  requireFalse(missing.input?.directAgentToolExecutionPerformed, 'missing_cli_no_direct_agent')
  requireFalse(missing.input?.routeExecutionPerformed, 'missing_cli_no_route')
  requireFalse(missing.input?.workerDispatchPerformedByThisCommand, 'missing_cli_no_dispatch')
  requireFalse(missing.input?.toolExecutionPerformed, 'missing_cli_no_tool')
  requireFalse(missing.input?.gpuRuntimePerformedByThisCommand, 'missing_cli_no_gpu')

  const partial = npmJson(runScriptName, packetArgsForTools(['sam2']))
  requireEqual(partial.status, 'partial_external_beta_activation_go_no_go_packets', 'partial_status')
  requireEqual(partial.externalBetaActivationGoNoGoAcceptedToolsWithProvidedEvidence, 1, 'partial_accepted_count')
  requireEqual(partial.externalBetaReadyNowTools, 0, 'partial_external_beta_ready')
  requireEqual(partial.missingToolIds?.length, 20, 'partial_missing_count')
  verifyFalseGates(partial, 'partial')

  const duplicate = npmJson(runScriptName, packetArgsForTools(['sam2', 'sam2']))
  requireEqual(duplicate.status, 'duplicate_external_beta_activation_go_no_go_tool_packets', 'duplicate_status')
  requireEqual(duplicate.externalBetaReadyNowTools, 0, 'duplicate_external_beta_ready')
  requireEqual(duplicate.duplicateToolIds?.[0], 'sam2', 'duplicate_tool')
  verifyFalseGates(duplicate, 'duplicate')

  const accepted = npmJson(runScriptName, packetArgsForTools(tools))
  requireEqual(accepted.status, acceptedStatus, 'accepted_status')
  requireEqual(
    accepted.externalBetaActivationGoNoGoAcceptedToolsWithProvidedEvidence,
    21,
    'accepted_activation_count',
  )
  requireEqual(accepted.externalBetaToolCallReadyNowTools, 21, 'accepted_tool_call_ready')
  requireEqual(accepted.externalBetaReadyNowTools, 21, 'accepted_external_beta_ready')
  requireEqual(accepted.runtimeReadyForOnDemandExternalBetaToolCallTools, 21, 'accepted_runtime_on_demand')
  requireEqual(accepted.productionReadyNowTools, 0, 'accepted_production_count')
  requireEqual(accepted.activatedTools?.length, 21, 'accepted_activated_tool_count')
  requireEqual(
    accepted.activatedTools?.filter((tool) => tool.gpuRuntimeTargetedTool).length,
    8,
    'accepted_gpu_tool_count',
  )
  requireFalse(accepted.gpuRuntimeShouldStartNow, 'accepted_gpu_should_not_start')
  verifyTrueRollup(accepted, 'accepted')
  verifyFalseGates(accepted, 'accepted')
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
    status: 'ai_graphics_external_beta_all_21_activation_rollup_diagnostics_failed',
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: 'ai_graphics_external_beta_all_21_activation_rollup_diagnostics_passed',
  checkedFiles: requiredFiles.length,
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  externalBetaActivationGoNoGoAcceptedToolsWithProvidedEvidence: 21,
  externalBetaToolCallReadyNowTools: 21,
  externalBetaReadyNowTools: 21,
  runtimeReadyForOnDemandExternalBetaToolCallTools: 21,
  agentCanExecuteToolsNow: false,
  gpuRuntimeShouldStartNow: false,
  productionReadyNowTools: 0,
}, null, 2))
