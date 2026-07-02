import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_controlled_route_require_go_approved_with_gpu_model_blocks'
const status =
  'external_agent_controlled_route_execution_approved_for_thirteen_tools_gpu_model_blocked'
const runScriptName = 'ai-graphics:external-agent-controlled-route-require-go'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-controlled-route-require-go.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-controlled-route-require-go:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-controlled-route-require-go-diagnostics.mjs'

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-controlled-route-require-go.ts',
  'scripts/validation/ai-graphics-external-agent-controlled-route-require-go-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.json',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.md',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
  'package.json',
]

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

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  controlledExternalAgentRouteExecutableToolsNow: 13,
  cpuStaticControlledRouteExecutableToolsNow: 6,
  browserRuntimeControlledRouteExecutableToolsNow: 7,
  gpuModelBlockedToolsNow: 8,
  agentCanExecuteAll21ToolsNowTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  publicArtifactCreatedTools: 0,
  signedUrlCreatedTools: 0,
  productionReadyNowTools: 0,
}

const trueBooleans = [
  'externalAgentControlledRouteRequireGoApproved',
  'sourceExternalAgentExecutionGateAccepted',
  'sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'controlled13ToolsAgentExecutableNow',
  'cpuStatic6ToolsAgentExecutableNow',
  'browserRuntime7ToolsAgentExecutableNow',
  'agentCanExecuteControlledRouteToolsNow',
  'agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow',
  'routeExecutionApprovedForControlled13ToolsNow',
  'gpuModel8ToolsRemainBlocked',
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
  'workerExecutionApprovedNow',
  'workerExecutionPerformed',
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
  /"workerExecutionApprovedNow"\s*:\s*true/i,
  /"workerExecutionPerformed"\s*:\s*true/i,
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
    for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
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

const report = parseJson('docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.json')
const md = read('docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.md')
const sourceGate = parseJson('docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json')
const sourceSmoke = parseJson('docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json')

if (report.decision !== decision) fail('decision_mismatch')
if (report.status !== status) fail('status_mismatch')
if (sourceGate.decision !== 'ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings') {
  fail('source_gate_decision_mismatch')
}
if (sourceSmoke.decision !== 'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks') {
  fail('source_smoke_decision_mismatch')
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

if (!Array.isArray(report.toolRows) || report.toolRows.length !== 21) {
  fail('tool_rows_count_mismatch')
} else {
  const rowsByTool = new Map(report.toolRows.map((row) => [row.toolId, row]))
  for (const toolId of allTools) {
    if (!rowsByTool.has(toolId)) fail(`missing_tool_row:${toolId}`)
  }
  for (const toolId of cpuStaticTools) {
    const row = rowsByTool.get(toolId)
    if (row?.group !== 'cpu_static_controlled_route') fail(`cpu_static_group_mismatch:${toolId}`)
    if (row?.agentCanExecuteThisControlledToolNow !== true) fail(`cpu_static_not_executable:${toolId}`)
  }
  for (const toolId of browserRuntimeTools) {
    const row = rowsByTool.get(toolId)
    if (row?.group !== 'browser_runtime_controlled_route') fail(`browser_group_mismatch:${toolId}`)
    if (row?.agentCanExecuteThisControlledToolNow !== true) fail(`browser_not_executable:${toolId}`)
  }
  for (const toolId of gpuModelTools) {
    const row = rowsByTool.get(toolId)
    if (row?.group !== 'gpu_model_runtime') fail(`gpu_group_mismatch:${toolId}`)
    if (row?.agentCanExecuteThisControlledToolNow !== false) fail(`gpu_not_blocked:${toolId}`)
    if (!String(row?.remainingBlocker ?? '').includes('native GPU/model runtime proof')) {
      fail(`gpu_missing_block_reason:${toolId}`)
    }
  }
}

for (const toolId of allTools) {
  if (!md.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}
for (const phrase of [
  '13 proven CPU/static and browser/runtime tools',
  'eight GPU/model tools remain fail-closed',
  'does not unlock all-21 execution',
  'signed URLs',
  'public artifacts',
]) {
  if (!md.includes(phrase)) fail(`markdown_missing_phrase:${phrase}`)
}

for (const forbidden of forbiddenPatterns) {
  for (const file of [
    'server/cli/ai-graphics-external-agent-controlled-route-require-go.ts',
    'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.json',
    'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.md',
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
  status,
  controlledExternalAgentRouteExecutableToolsNow:
    report.counts.controlledExternalAgentRouteExecutableToolsNow,
  gpuModelBlockedToolsNow: report.counts.gpuModelBlockedToolsNow,
  agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
}, null, 2))
