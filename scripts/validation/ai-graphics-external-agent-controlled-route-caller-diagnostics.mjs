import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_controlled_route_caller_contract_prepared_for_all21_with_gpu_model_on_demand'
const status =
  'external_agent_controlled_route_caller_ready_for_all21_controlled_route_calls'
const runScriptName = 'ai-graphics:external-agent-controlled-route-caller'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-controlled-route-caller.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-controlled-route-caller:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-controlled-route-caller-diagnostics.mjs'

const cpuStaticTools = [
  'd3',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
]
const browserRuntimeTools = [
  'echarts',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]
const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]
const allTools = [...gpuModelTools, ...cpuStaticTools, ...browserRuntimeTools]
const routePath = '/api/ai-graphics/external-beta/tool-call'

const expectedPrimaryCapabilityByTool = {
  torch_torchvision: 'model_runtime_foundation',
  transformers: 'model_runtime_foundation',
  sam2: 'subject_segmentation',
  birefnet: 'background_removal',
  real_esrgan: 'upscaling',
  kornia: 'tensor_image_ops',
  rembg: 'background_removal',
  transparent_background: 'background_removal',
  d3: 'chart_overlay',
  echarts: 'chart_overlay',
  vega_lite: 'data_visualization',
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

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-controlled-route-caller.ts',
  'scripts/validation/ai-graphics-external-agent-controlled-route-caller-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.json',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.md',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.json',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'package.json',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  controlledRouteCallableToolsNow: 21,
  cpuStaticControlledRouteCallableToolsNow: 6,
  browserRuntimeControlledRouteCallableToolsNow: 7,
  gpuModelControlledRouteCallableToolsNow: 8,
  gpuModelToolsBlockedFromControlledRouteCallerNow: 0,
  requestEnvelopesPrepared: 21,
  privateOutputOnlyEnvelopes: 21,
  all21ControlledRouteExecutableNowTools: 21,
  all21ExecutableNowTools: 21,
  controlledRouteLocalPackageExecutionExpectedTools: 13,
  localGpuModelRuntimeExecutionExpectedInDefaultCallerTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  publicArtifactCreatedTools: 0,
  signedUrlCreatedTools: 0,
  routeExecutionPerformedInThisLaneTools: 0,
  productionReadyNowTools: 0,
}

const trueBooleans = [
  'externalAgentControlledRouteCallerContractPrepared',
  'sourceControlledRouteRequireGoAccepted',
  'sourceControlledWorkerRouteExecutionSmokeAccepted',
  'sourceAll21ControlledRouteExecutionSmokeAccepted',
  'routeSchemaEnvelopeAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all13ControlledRouteCallerEnvelopesPrepared',
  'all21ControlledRouteCallerEnvelopesPrepared',
  'cpuStatic6ControlledRouteCallerEnvelopesPrepared',
  'browserRuntime7ControlledRouteCallerEnvelopesPrepared',
  'gpuModel8ControlledRouteCallerEnvelopesPrepared',
  'controlledRouteCallerCanInvokeCanonicalRouteFor13ToolsNow',
  'controlledRouteCallerCanInvokeCanonicalRouteFor21ToolsNow',
  'agentCanExecuteControlledRouteToolsNow',
  'agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow',
  'agentCanExecuteControlledCpuStaticBrowserRuntimeAndGpuModelRouteToolsNow',
  'routeExecutionApprovedForControlled13ToolsNow',
  'routeExecutionApprovedForControlled21ToolsNow',
  'privateOutputOnly',
  'eightGpuModelToolsInvokeControlledOnDemandAdapter',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForAcceptedExternalBetaToolCall',
  'agentCanSelectForPlanning',
  'agentCanExecuteAll21ToolsNow',
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
]

const falseBooleans = [
  'eightGpuModelToolsRemainBlockedFromControlledRouteCaller',
  'routeExecutionPerformedInThisLane',
  'workerExecutionApprovedNow',
  'workerExecutionPerformed',
  'workerDispatchApprovedNow',
  'workerDispatchPerformed',
  'toolExecutionApprovedNow',
  'toolExecutionPerformed',
  'providerRuntimeApprovedNow',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimePerformed',
  'gpuRuntimeShouldStartNow',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
]

const forbiddenPatterns = [
  /"routeExecutionPerformedInThisLane"\s*:\s*true/i,
  /"workerExecutionApprovedNow"\s*:\s*true/i,
  /"workerExecutionPerformed"\s*:\s*true/i,
  /"workerDispatchApprovedNow"\s*:\s*true/i,
  /"workerDispatchPerformed"\s*:\s*true/i,
  /"toolExecutionApprovedNow"\s*:\s*true/i,
  /"toolExecutionPerformed"\s*:\s*true/i,
  /"providerRuntimeApprovedNow"\s*:\s*true/i,
  /"providerRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimeApprovedNow"\s*:\s*true/i,
  /"gpuRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimeShouldStartNow"\s*:\s*true/i,
  /"runtimeReadyNow"\s*:\s*true/i,
  /"externalBetaReadyNow"\s*:\s*true/i,
  /"productionReadyNow"\s*:\s*true/i,
  /"publicArtifactCreated"\s*:\s*true/i,
  /"signedUrlCreated"\s*:\s*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated-media|render-output|renders|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp|avif|pdf)$/i

const failures = []

function fail(message) {
  failures.push(message)
}

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  if (!fs.existsSync(absolute(file))) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(absolute(file), 'utf8')
}

function parseJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function exec(command) {
  return childProcess.execSync(command, {
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 160 * 1024 * 1024,
  })
}

function checkPackageJson() {
  const pkg = parseJson('package.json')
  if (pkg.scripts?.[runScriptName] !== runScriptCommand) {
    fail('run_script_command_mismatch')
  }
  if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
    fail('diagnostic_script_command_mismatch')
  }

  try {
    const headPkg = JSON.parse(exec('git show HEAD:package.json'))
    for (const section of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      if (JSON.stringify(pkg[section] ?? {}) !== JSON.stringify(headPkg[section] ?? {})) {
        fail(`package_dependency_section_changed:${section}`)
      }
    }
  } catch (error) {
    fail(`package_dependency_comparison_failed:${error.message}`)
  }
}

function checkPackageLockUnchanged() {
  try {
    exec('git diff --quiet -- package-lock.json')
  } catch {
    fail('package_lock_changed')
  }
}

function checkChangedFiles() {
  let changed = ''
  try {
    changed = exec('git diff --name-only HEAD')
  } catch (error) {
    fail(`git_diff_name_only_failed:${error.message}`)
    return
  }

  for (const file of changed.split(/\r?\n/).filter(Boolean)) {
    if (file === 'package-lock.json') fail('package_lock_changed_in_diff')
    if (file.includes('.local-artifacts')) fail(`local_artifact_changed:${file}`)
    if (generatedArtifactPattern.test(file)) fail(`generated_artifact_changed:${file}`)
  }
}

for (const file of requiredFiles) read(file)
checkPackageJson()
checkPackageLockUnchanged()
checkChangedFiles()

const report = parseJson(
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.json',
)
const markdown = read(
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.md',
)
const sourceRequireGo = parseJson(
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.json',
)
const sourceWorkerRouteSmoke = parseJson(
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
)
const sourceAll21RouteSmoke = parseJson(
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
)

if (report.decision !== decision) fail('decision_mismatch')
if (report.status !== status) fail('status_mismatch')
if (
  sourceRequireGo.decision !==
  'ai_graphics_external_agent_controlled_route_require_go_approved_with_gpu_model_blocks'
) {
  fail('source_require_go_decision_mismatch')
}
if (
  sourceWorkerRouteSmoke.decision !==
  'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks'
) {
  fail('source_worker_route_smoke_decision_mismatch')
}
if (
  sourceAll21RouteSmoke.decision !==
  'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed'
) {
  fail('source_all21_route_smoke_decision_mismatch')
}
if (sourceAll21RouteSmoke.counts?.controlledRouteHttp200Tools !== 21) {
  fail('source_all21_route_http_200_count_mismatch')
}
if (sourceAll21RouteSmoke.counts?.controlledRouteAdapterInvokedTools !== 21) {
  fail('source_all21_route_adapter_invoked_count_mismatch')
}
if (sourceAll21RouteSmoke.counts?.controlledRouteAdapterExecutedTools !== 13) {
  fail('source_all21_route_adapter_executed_count_mismatch')
}
if (sourceAll21RouteSmoke.counts?.gpuModelControlledRouteInvokedTools !== 8) {
  fail('source_all21_route_gpu_invoked_count_mismatch')
}
if (sourceAll21RouteSmoke.counts?.localGpuModelRuntimeExecutionPerformedTools !== 0) {
  fail('source_all21_route_gpu_runtime_execution_count_mismatch')
}
if (sourceAll21RouteSmoke.booleans?.agentCanExecuteAll21ToolsNow !== true) {
  fail('source_all21_route_agent_can_execute_all21_mismatch')
}
if (sourceAll21RouteSmoke.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('source_all21_route_gpu_start_mismatch')
}

for (const [key, value] of Object.entries(expectedCounts)) {
  if (report.counts?.[key] !== value) fail(`count_mismatch:${key}:${report.counts?.[key]}`)
}
for (const key of trueBooleans) {
  if (report.booleans?.[key] !== true) fail(`boolean_not_true:${key}`)
}
for (const key of falseBooleans) {
  if (report.booleans?.[key] !== false) fail(`boolean_not_false:${key}`)
}

if (!Array.isArray(report.controlledCallerRows) || report.controlledCallerRows.length !== 21) {
  fail('controlled_caller_rows_count_mismatch')
} else {
  const rowsByTool = new Map(report.controlledCallerRows.map((row) => [row.toolId, row]))
  for (const toolId of allTools) {
    if (!rowsByTool.has(toolId)) fail(`missing_controlled_caller_row:${toolId}`)
  }
  for (const toolId of cpuStaticTools) {
    const row = rowsByTool.get(toolId)
    if (row?.group !== 'cpu_static_controlled_route') fail(`cpu_static_group_mismatch:${toolId}`)
  }
  for (const toolId of browserRuntimeTools) {
    const row = rowsByTool.get(toolId)
    if (row?.group !== 'browser_runtime_controlled_route') fail(`browser_group_mismatch:${toolId}`)
  }
  for (const toolId of gpuModelTools) {
    const row = rowsByTool.get(toolId)
    if (row?.group !== 'gpu_model_controlled_route_on_demand') {
      fail(`gpu_model_group_mismatch:${toolId}`)
    }
    if (row?.localPackageExecutionExpectedInDefaultSmoke !== false) {
      fail(`gpu_default_local_package_execution_not_false:${toolId}`)
    }
    if (row?.localGpuModelRuntimeExecutionExpectedInDefaultSmoke !== false) {
      fail(`gpu_default_runtime_execution_not_false:${toolId}`)
    }
    if (row?.requestEnvelope?.payload?.gpuModelRuntimeOnDemandOnly !== true) {
      fail(`gpu_on_demand_payload_missing:${toolId}`)
    }
    if (row?.requestEnvelope?.payload?.enableGpuModelControlledExecution !== false) {
      fail(`gpu_default_execution_enablement_not_false:${toolId}`)
    }
  }
  for (const row of report.controlledCallerRows) {
    const expectedCapability = expectedPrimaryCapabilityByTool[row.toolId]
    if (!expectedCapability) fail(`missing_expected_capability:${row.toolId}`)
    if (row.capabilityId !== expectedCapability) {
      fail(
        `primary_capability_mismatch:${row.toolId}:${row.capabilityId}:${expectedCapability}`,
      )
    }
    if (row.routePath !== routePath) fail(`route_path_mismatch:${row.toolId}`)
    if (row.method !== 'POST') fail(`method_mismatch:${row.toolId}`)
    if (row.expectedHttpStatusIfInvoked !== 200) fail(`status_mismatch:${row.toolId}`)
    if (row.canonicalRouteWillRunControlledAdapter !== true) fail(`adapter_expected_false:${row.toolId}`)
    if (row.localGpuModelRuntimeExecutionExpectedInDefaultSmoke !== false) {
      fail(`default_gpu_runtime_not_false:${row.toolId}`)
    }
    if (row.gpuRuntimeShouldStartNow !== false) fail(`gpu_start_not_false:${row.toolId}`)
    if (row.publicArtifactCreated !== false) fail(`public_artifact_not_false:${row.toolId}`)
    if (row.signedUrlCreated !== false) fail(`signed_url_not_false:${row.toolId}`)
    const envelope = row.requestEnvelope ?? {}
    if (envelope.toolId !== row.toolId) fail(`request_tool_mismatch:${row.toolId}`)
    if (envelope.capabilityId !== row.capabilityId) fail(`request_capability_mismatch:${row.toolId}`)
    if (envelope.capabilityId !== expectedCapability) {
      fail(
        `request_primary_capability_mismatch:${row.toolId}:${envelope.capabilityId}:${expectedCapability}`,
      )
    }
    for (const key of [
      'privateArtifactManifestRef',
      'toolRouteApprovalRef',
      'workerApprovalRef',
      'runtimeEnqueueApprovalRef',
      'ownerRuntimeApprovalRef',
    ]) {
      if (!String(envelope[key] ?? '').startsWith('private://')) {
        fail(`request_private_ref_missing:${row.toolId}:${key}`)
      }
    }
    if (envelope.payload?.rawPromptExecutionAllowed !== false) {
      fail(`request_raw_prompt_not_blocked:${row.toolId}`)
    }
    if (envelope.payload?.privateOutputOnly !== true) {
      fail(`request_private_output_not_true:${row.toolId}`)
    }
  }
}
if (Array.isArray(report.blockedGpuModelRows) && report.blockedGpuModelRows.length > 0) {
  fail('blocked_gpu_rows_should_be_removed_after_all21_route_proof')
}

for (const toolId of allTools) {
  if (!markdown.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}
for (const phrase of [
  'all 21 controlled AI graphics tools',
  'GPU/model tools are callable through the controlled route',
  'local GPU/model runtime starts only',
  'GPU stays cold',
  'signed URLs',
  'public artifacts',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_phrase:${phrase}`)
}

for (const forbidden of forbiddenPatterns) {
  for (const file of [
    'server/cli/ai-graphics-external-agent-controlled-route-caller.ts',
    'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.json',
    'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.md',
  ]) {
    if (forbidden.test(read(file))) fail(`forbidden_claim:${file}:${forbidden}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  controlledRouteCallableToolsNow: 21,
  gpuModelControlledRouteCallableToolsNow: 8,
  gpuModelToolsBlockedFromControlledRouteCallerNow: 0,
  packageLockUnchanged: true,
  generatedArtifactOutputCommitted: false,
}, null, 2))
