import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_controlled_route_caller_contract_prepared_for_thirteen_tools_with_gpu_model_blocks'
const status =
  'external_agent_controlled_route_caller_ready_for_thirteen_tools_gpu_model_blocked'
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
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'package.json',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  controlledRouteCallableToolsNow: 13,
  cpuStaticControlledRouteCallableToolsNow: 6,
  browserRuntimeControlledRouteCallableToolsNow: 7,
  gpuModelToolsBlockedFromControlledRouteCallerNow: 8,
  requestEnvelopesPrepared: 13,
  privateOutputOnlyEnvelopes: 13,
  all21ExecutableNowTools: 0,
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
  'routeSchemaEnvelopeAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all13ControlledRouteCallerEnvelopesPrepared',
  'cpuStatic6ControlledRouteCallerEnvelopesPrepared',
  'browserRuntime7ControlledRouteCallerEnvelopesPrepared',
  'controlledRouteCallerCanInvokeCanonicalRouteFor13ToolsNow',
  'agentCanExecuteControlledRouteToolsNow',
  'agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow',
  'routeExecutionApprovedForControlled13ToolsNow',
  'privateOutputOnly',
  'eightGpuModelToolsRemainBlockedFromControlledRouteCaller',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForAcceptedExternalBetaToolCall',
  'agentCanSelectForPlanning',
]

const falseBooleans = [
  'agentCanExecuteAll21ToolsNow',
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
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
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"agentCanExecuteAll21ToolsNow"\s*:\s*true/i,
  /"agentCanExecuteGpuModelToolsNow"\s*:\s*true/i,
  /"routeExecutionApprovedNow"\s*:\s*true/i,
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

for (const [key, value] of Object.entries(expectedCounts)) {
  if (report.counts?.[key] !== value) fail(`count_mismatch:${key}:${report.counts?.[key]}`)
}
for (const key of trueBooleans) {
  if (report.booleans?.[key] !== true) fail(`boolean_not_true:${key}`)
}
for (const key of falseBooleans) {
  if (report.booleans?.[key] !== false) fail(`boolean_not_false:${key}`)
}

if (!Array.isArray(report.controlledCallerRows) || report.controlledCallerRows.length !== 13) {
  fail('controlled_caller_rows_count_mismatch')
} else {
  const rowsByTool = new Map(report.controlledCallerRows.map((row) => [row.toolId, row]))
  for (const toolId of [...cpuStaticTools, ...browserRuntimeTools]) {
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

if (!Array.isArray(report.blockedGpuModelRows) || report.blockedGpuModelRows.length !== 8) {
  fail('blocked_gpu_rows_count_mismatch')
} else {
  const rowsByTool = new Map(report.blockedGpuModelRows.map((row) => [row.toolId, row]))
  for (const toolId of gpuModelTools) {
    const row = rowsByTool.get(toolId)
    const expectedCapability = expectedPrimaryCapabilityByTool[toolId]
    if (!row) fail(`missing_blocked_gpu_row:${toolId}`)
    if (row?.capabilityId !== expectedCapability) {
      fail(
        `gpu_primary_capability_mismatch:${toolId}:${row?.capabilityId}:${expectedCapability}`,
      )
    }
    if (row?.requestEnvelope?.capabilityId !== expectedCapability) {
      fail(
        `gpu_request_primary_capability_mismatch:${toolId}:${row?.requestEnvelope?.capabilityId}:${expectedCapability}`,
      )
    }
    if (row?.expectedHttpStatusIfInvoked !== 409) fail(`gpu_expected_status_mismatch:${toolId}`)
    if (row?.blockedFromControlledRouteCallerNow !== true) fail(`gpu_not_blocked:${toolId}`)
    if (row?.gpuRuntimeShouldStartNow !== false) fail(`gpu_start_not_false:${toolId}`)
    if (!row?.requiredProofBeforeCallerMayInvoke?.some((item) => String(item).includes('NVIDIA L4'))) {
      fail(`gpu_missing_native_proof:${toolId}`)
    }
  }
}

for (const toolId of allTools) {
  if (!markdown.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}
for (const phrase of [
  '13 controlled AI graphics tools',
  'does not claim all 21 tools are executable',
  'eight GPU/model tools remain blocked',
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
  controlledRouteCallableToolsNow: 13,
  gpuModelToolsBlockedFromControlledRouteCallerNow: 8,
  packageLockUnchanged: true,
  generatedArtifactOutputCommitted: false,
}, null, 2))
