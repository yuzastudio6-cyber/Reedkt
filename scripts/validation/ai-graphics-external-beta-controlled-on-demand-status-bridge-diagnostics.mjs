import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_controlled_on_demand_status_bridge_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_controlled_on_demand_status_bridge_ready_with_warnings'
const runScriptName = 'ai-graphics:external-beta-controlled-on-demand-status-bridge'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-controlled-on-demand-status-bridge.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-controlled-on-demand-status-bridge:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-controlled-on-demand-status-bridge-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-controlled-on-demand-status-bridge.ts',
  'server/cli/ai-graphics-external-beta-controlled-on-demand-status-bridge.ts',
  'scripts/validation/ai-graphics-external-beta-controlled-on-demand-status-bridge-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.md',
  'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-boundary.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-insertion-proof.json',
  'docs/tool-intelligence/ai-graphics/production-controlled-per-tool-traffic-enablement-proof.json',
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
  'externalBetaControlledOnDemandStatusBridgePrepared',
  'sourceExternalBetaEndToEndReadinessAccepted',
  'sourceBetaProductionReadinessRollupAccepted',
  'sourceExternalBetaActivatedLaunchReadinessAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'all21ToolsReadyForControlledOnDemandExternalBetaToolCalls',
  'controlledExternalBetaToolCallReadinessClarified',
  'externalBetaReadyNow',
  'externalBetaCallableNow',
  'agentCanSelectForPlanning',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
]

const falseKeys = [
  'agentCanExecuteToolsNow',
  'directAgentToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'workerEnqueuePerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'privateArtifactWritePerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const generatedArtifactPathPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /directAgentToolExecutionApprovedNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerQueueApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /internalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /dependencyInstallPerformed["`:\s=]+true/i,
  /packageLockMutationPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
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

function npmJson(scriptName, args = []) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
  return JSON.parse(output)
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
  const docs = json('docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json')
  requireEqual(docs.decision, decision, 'docs_decision')
  requireEqual(docs.status, acceptedStatus, 'docs_status')
  requireEqual(docs.coverage?.totalAiGraphicsTools, 21, 'docs_total_tools')
  requireEqual(docs.coverage?.totalProductFacingCapabilities, 12, 'docs_total_capabilities')
  requireEqual(docs.coverage?.gpuRuntimeTargetedTools, 8, 'docs_gpu_tools')
  requireEqual(docs.coverage?.externalBetaControlledOnDemandReadyTools, 21, 'docs_controlled_ready')
  requireEqual(docs.coverage?.externalBetaCallableNowTools, 21, 'docs_callable_now')
  requireEqual(docs.coverage?.externalBetaReadyNowTools, 21, 'docs_external_beta_ready')
  requireEqual(docs.coverage?.runtimeReadyForOnDemandExternalBetaToolCallTools, 21, 'docs_runtime_on_demand')
  requireEqual(docs.coverage?.productionReadyNowTools, 0, 'docs_production_ready')
  requireEqual(
    docs.readinessInterpretation,
    'external_beta_ready_means_controlled_on_demand_worker_path_not_direct_agent_execution',
    'docs_readiness_interpretation',
  )
  for (const tool of tools) {
    if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  }
  for (const tool of gpuTools) {
    if (!docs.gpuRuntimeTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
  }
  for (const capability of capabilities) {
    if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
  }
  for (const key of trueKeys) requireTruthy(docs.booleans?.[key], `docs_boolean_${key}`)
  for (const key of falseKeys) requireFalse(docs.booleans?.[key], `docs_boolean_${key}`)

  const md = read('docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.md')
  for (const required of [
    decision,
    acceptedStatus,
    'controlled on-demand external-beta tool calls',
    '`agentCanExecuteToolsNow=false`',
    '`gpuRuntimeShouldStartNow=false`',
    '`productionReadyNow=false`',
    'GPU should stay cold until an accepted worker/tool-call job actually needs a GPU/model tool.',
  ]) {
    if (!md.includes(required)) fail(`md_missing:${required}`)
  }

  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json',
    'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.md',
    'docs/production-beta-readiness-scorecard.md',
  ]) {
    const content = read(file)
    forbiddenDocPatterns.forEach((pattern) => {
      if (pattern.test(content)) fail(`forbidden_claim:${file}:${pattern}`)
    })
  }
}

function verifySourceDocs() {
  const e2e = json('docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json')
  requireEqual(e2e.decision, 'ai_graphics_external_beta_end_to_end_readiness_prepared_with_remaining_blocks', 'e2e_decision')
  requireEqual(e2e.status, 'external_beta_ready_for_controlled_on_demand_tool_calls_runtime_still_blocked', 'e2e_status')
  requireEqual(e2e.counts?.totalAiGraphicsTools, 21, 'e2e_total_tools')
  requireEqual(e2e.counts?.externalBetaReadyNowTools, 21, 'e2e_external_beta_ready')
  requireEqual(e2e.counts?.productionReadyNowTools, 0, 'e2e_production_ready')
  requireTruthy(e2e.booleans?.externalBetaActivatedLaunchReadinessAcceptedWithProvidedEvidence, 'e2e_activated_launch')
  requireTruthy(e2e.booleans?.externalBetaReadyNow, 'e2e_ready_boolean')
  requireFalse(e2e.booleans?.agentCanExecuteToolsNow, 'e2e_agent_false')
  requireFalse(e2e.booleans?.gpuRuntimeShouldStartNow, 'e2e_gpu_false')

  const rollup = json('docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json')
  requireEqual(rollup.decision, 'ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks', 'rollup_decision')
  requireEqual(rollup.status, 'owner_approved_worker_gates_ready_runtime_still_blocked', 'rollup_status')
  requireEqual(rollup.counts?.properlyInstalledForPlannedSurface, 21, 'rollup_install_count')
  requireEqual(rollup.counts?.externalBetaReadyNowTools, 21, 'rollup_external_beta_ready')
  requireEqual(rollup.counts?.productionReadyNowTools, 0, 'rollup_production_ready')
  requireTruthy(rollup.booleans?.externalBetaActivatedLaunchReadyWithProvidedEvidence, 'rollup_activated')
  requireTruthy(rollup.booleans?.externalBetaReadyNow, 'rollup_ready')
  requireFalse(rollup.booleans?.agentCanExecuteToolsNow, 'rollup_agent_false')
  requireFalse(rollup.booleans?.routeExecutionApprovedNow, 'rollup_route_false')
  requireFalse(rollup.booleans?.workerExecutionApprovedNow, 'rollup_worker_false')
  requireFalse(rollup.booleans?.toolExecutionApprovedNow, 'rollup_tool_false')

  const activated = json('docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json')
  requireEqual(activated.decision, 'ai_graphics_external_beta_activated_launch_readiness_approved_with_runtime_blocks', 'activated_decision')
  requireEqual(activated.status, 'external_beta_activated_launch_ready_for_controlled_on_demand_tool_calls', 'activated_status')
  requireEqual(activated.scope?.externalBetaReadyNowTools, 21, 'activated_external_beta_ready')
  requireEqual(activated.scope?.externalBetaToolCallReadyNowTools, 21, 'activated_tool_call_ready')
  requireEqual(activated.scope?.runtimeReadyForOnDemandExternalBetaToolCallTools, 21, 'activated_runtime_ready')
  requireEqual(activated.scope?.productionReadyNowTools, 0, 'activated_production_ready')
  requireTruthy(activated.booleans?.sourceExternalBetaLaunchGoNoGoAccepted, 'activated_launch_source')
  requireTruthy(activated.booleans?.sourceExternalBetaAll21ActivationRollupAccepted, 'activated_rollup_source')
  requireFalse(activated.booleans?.agentCanExecuteToolsNow, 'activated_agent_false')
  requireFalse(activated.booleans?.gpuRuntimeShouldStartNow, 'activated_gpu_false')
}

function verifySourceWiring() {
  requiredFiles.forEach(read)
  const registry = read('server/tool-registry/index.ts')
  if (!registry.includes("export * from './ai-graphics-external-beta-controlled-on-demand-status-bridge'")) {
    fail('missing_registry_export')
  }
  const source = read('server/tool-registry/ai-graphics-external-beta-controlled-on-demand-status-bridge.ts')
  for (const required of [
    decision,
    'external_beta_ready_means_controlled_on_demand_worker_path_not_direct_agent_execution',
    'production_requires_separate_operator_traffic_cutover_and_live_runtime_evidence',
    'gpuRuntimeShouldStartNow: false',
    'agentCanExecuteToolsNow: false',
    'productionReadyNow: false',
  ]) {
    if (!source.includes(required)) fail(`source_missing:${required}`)
  }
}

function verifyCliBehavior() {
  const missing = npmJson(runScriptName)
  requireEqual(missing.status, 'missing_external_beta_end_to_end_readiness', 'missing_status')
  requireEqual(missing.externalBetaReadyNowTools, 0, 'missing_external_beta_ready')
  requireFalse(missing.input?.directAgentToolExecutionPerformed, 'missing_no_agent_execution')
  requireFalse(missing.input?.routeExecutionPerformed, 'missing_no_route_execution')
  requireFalse(missing.input?.workerExecutionPerformed, 'missing_no_worker_execution')
  requireFalse(missing.input?.gpuRuntimePerformedByThisCommand, 'missing_no_gpu_runtime')

  const accepted = npmJson(runScriptName, [
    '--external-beta-end-to-end-readiness-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json',
    '--beta-production-readiness-rollup-packet',
    'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json',
    '--external-beta-activated-launch-readiness-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json',
  ])
  requireEqual(accepted.status, acceptedStatus, 'accepted_status')
  requireEqual(accepted.externalBetaControlledOnDemandReadyTools, 21, 'accepted_controlled_ready')
  requireEqual(accepted.externalBetaCallableNowTools, 21, 'accepted_callable_now')
  requireEqual(accepted.externalBetaReadyNowTools, 21, 'accepted_external_beta_ready')
  requireEqual(accepted.runtimeReadyForOnDemandExternalBetaToolCallTools, 21, 'accepted_runtime_ready')
  requireEqual(accepted.productionReadyNowTools, 0, 'accepted_production')
  requireEqual(
    accepted.readinessInterpretation,
    'external_beta_ready_means_controlled_on_demand_worker_path_not_direct_agent_execution',
    'accepted_interpretation',
  )
  for (const key of trueKeys) requireTruthy(accepted.booleans?.[key], `accepted_boolean_${key}`)
  for (const key of falseKeys) requireFalse(accepted.booleans?.[key], `accepted_boolean_${key}`)
  requireFalse(accepted.input?.toolExecutionPerformed, 'accepted_no_tool_execution')
  requireFalse(accepted.input?.workerExecutionPerformed, 'accepted_no_worker_execution')
  requireFalse(accepted.input?.routeExecutionPerformed, 'accepted_no_route_execution')
  requireFalse(accepted.input?.gpuRuntimePerformedByThisCommand, 'accepted_no_gpu_runtime')
}

verifyPackageJson()
verifyPackageLockUnchanged()
verifyTrackedAndChangedPaths()
verifyDocs()
verifySourceDocs()
verifySourceWiring()
verifyCliBehavior()

if (failures.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    decision,
    status: 'ai_graphics_external_beta_controlled_on_demand_status_bridge_diagnostics_failed',
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: 'ai_graphics_external_beta_controlled_on_demand_status_bridge_diagnostics_passed',
  checkedFiles: requiredFiles.length,
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  externalBetaControlledOnDemandReadyTools: 21,
  externalBetaCallableNowTools: 21,
  externalBetaReadyNowTools: 21,
  runtimeReadyForOnDemandExternalBetaToolCallTools: 21,
  agentCanExecuteToolsNow: false,
  routeExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  gpuRuntimeShouldStartNow: false,
  productionReadyNowTools: 0,
}, null, 2))
