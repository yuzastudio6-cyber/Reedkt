import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const diagnosticScriptName =
  'ai-graphics:external-beta-browser-runtime-controlled-tool-call-route-smoke:diagnostics'
const runScriptName =
  'ai-graphics:external-beta-browser-runtime-controlled-tool-call-route-smoke'
const decision =
  'ai_graphics_external_beta_browser_runtime_controlled_tool_call_route_smoke_passed'
const routePath =
  '/api/ai-graphics/external-beta/browser-runtime/controlled-tool-call'
const routeFlag =
  'AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED'
const routeEnvField =
  'aiGraphicsExternalBetaBrowserRuntimeControlledToolCallRouteEnabled'

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter.ts',
  'server/routes/ai-graphics-external-beta-browser-runtime-controlled-tool-call-routes.ts',
  'server/cli/ai-graphics-external-beta-browser-runtime-controlled-tool-call-route-smoke.ts',
  'scripts/validation/ai-graphics-external-beta-browser-runtime-controlled-tool-call-route-smoke-diagnostics.mjs',
  'server/app.ts',
  'server/config/env.ts',
  'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-browser-runtime-controlled-tool-call-route-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-browser-runtime-controlled-tool-call-route-smoke.md',
  'docs/tool-intelligence/ai-graphics/external-beta-cpu-static-controlled-tool-call-route-smoke.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const executableTools = [
  'echarts',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

const cpuStaticTools = [
  'd3',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
]

const blockedTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
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

function runJson(scriptName) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', scriptName], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    maxBuffer: 128 * 1024 * 1024,
  })
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_run_json:${scriptName}:${error.message}`)
    return {}
  }
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !==
  'tsx server/cli/ai-graphics-external-beta-browser-runtime-controlled-tool-call-route-smoke.ts') {
  fail('missing_run_script')
}
if (packageJson.scripts?.[diagnosticScriptName] !==
  'node scripts/validation/ai-graphics-external-beta-browser-runtime-controlled-tool-call-route-smoke-diagnostics.mjs') {
  fail('missing_diagnostic_script')
}

const routeSource = read('server/routes/ai-graphics-external-beta-browser-runtime-controlled-tool-call-routes.ts')
const appSource = read('server/app.ts')
const envSource = read('server/config/env.ts')
const adapterSource = read('server/tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter.ts')
const doc = json('docs/tool-intelligence/ai-graphics/external-beta-browser-runtime-controlled-tool-call-route-smoke.json')
const proof = json('docs/tool-intelligence/ai-graphics/browser-runtime-proof.json')
const cpuRouteDoc = json('docs/tool-intelligence/ai-graphics/external-beta-cpu-static-controlled-tool-call-route-smoke.json')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

for (const token of [
  routePath,
  routeFlag,
  'executeAiGraphicsExternalAgentBrowserRuntimeControlledAdapter',
  'externalAgentCanExecuteBrowserRuntimeControlledToolsNow',
  'browserRuntimeProofRef',
  'approvedPlanSnapshotId',
  'creditReservationId',
]) {
  if (!routeSource.includes(token)) fail(`route_missing:${token}`)
}

for (const token of [
  'chromium.launch',
  'echarts/dist/echarts.min.js',
  'lottie-web/build/player/lottie.min.js',
  'animejs/dist/modules/index.js',
  'three/build/three.module.js',
  'pixi.js/dist/pixi.mjs',
  'konva/konva.min.js',
  'babylonjs/babylon.js',
]) {
  if (!adapterSource.includes(token)) fail(`adapter_missing:${token}`)
}

for (const tool of executableTools) {
  if (!routeSource.includes(tool)) fail(`route_missing_tool:${tool}`)
  if (!adapterSource.includes(tool)) fail(`adapter_missing_tool:${tool}`)
  if (!JSON.stringify(doc).includes(tool)) fail(`doc_missing_tool:${tool}`)
  if (!JSON.stringify(proof).includes(tool)) fail(`browser_proof_missing_tool:${tool}`)
}

for (const tool of cpuStaticTools) {
  if (!JSON.stringify(doc).includes(tool)) fail(`doc_missing_cpu_static_tool:${tool}`)
}

for (const tool of blockedTools) {
  if (!JSON.stringify(doc).includes(tool)) fail(`doc_missing_blocked_tool:${tool}`)
}

if (!appSource.includes('createAiGraphicsExternalBetaBrowserRuntimeControlledToolCallRoutes')) {
  fail('app_missing_controlled_browser_runtime_route_factory')
}
if (!appSource.includes(`env.${routeEnvField}`)) {
  fail('app_missing_controlled_browser_runtime_env_gate')
}
if (!envSource.includes(routeFlag)) fail('env_missing_flag')
if (!envSource.includes(routeEnvField)) fail('env_missing_field')
if (!scorecard.includes('AI Graphics External Beta Browser Runtime Controlled Tool Call Route Smoke')) {
  fail('scorecard_missing_section')
}

if (proof.decision !== 'ai_graphics_browser_runtime_proof_completed_with_warnings') {
  fail('browser_runtime_proof_decision_mismatch')
}
if (proof.booleans?.all7BrowserRuntimeToolsProofPassed !== true) {
  fail('browser_runtime_proof_not_all_7_passed')
}
if (cpuRouteDoc.counts?.controlledCpuStaticRouteCallableNowTools !== 6 &&
  cpuRouteDoc.controlledCpuStaticRouteCallableNowTools !== 6) {
  fail('cpu_static_route_doc_not_6_callable')
}

for (const [key, expected] of Object.entries({
  externalBetaBrowserRuntimeControlledToolCallRouteSmokePassed: true,
  externalAgentCanExecuteBrowserRuntimeControlledToolsNow: true,
  scopedBrowserRuntimePerformedNow: true,
  externalAgentCanExecuteCpuStaticControlledToolsNow: true,
  agentCanExecuteAll21ToolsNow: false,
  routeExecutionApprovedForBroadAll21RouteNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  gpuRuntimeApprovedNow: false,
  gpuRuntimeShouldStartNow: false,
  publicArtifactCreated: false,
  signedUrlCreated: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
  dependencyInstallPerformed: false,
  packageLockMutationPerformed: false,
})) {
  if (doc.booleans?.[key] !== expected) fail(`doc_boolean_mismatch:${key}`)
}

if (doc.counts?.controlledBrowserRuntimeRouteCallableNowTools !== 7) fail('doc_browser_callable_not_7')
if (doc.counts?.controlledCpuStaticRouteCallableNowTools !== 6) fail('doc_cpu_static_callable_not_6')
if (doc.counts?.scopedControlledToolsCallableNow !== 13) fail('doc_scoped_callable_not_13')
if (doc.counts?.remainingToolsStillBlockedForRuntime !== 8) fail('doc_remaining_blocked_not_8')
if (doc.counts?.gpuRuntimeShouldStartNowTools !== 0) fail('doc_gpu_started_now')
if (doc.counts?.publicArtifactCreatedTools !== 0) fail('doc_public_artifacts_created')
if (doc.counts?.signedUrlCreatedTools !== 0) fail('doc_signed_urls_created')

const smoke = runJson(runScriptName)
if (smoke.decision !== decision) fail('smoke_decision_mismatch')
if (smoke.disabledRouteStatus !== 404) fail('disabled_route_not_404')
if (smoke.controlledBrowserRuntimeRouteExecutedTools !== 7) fail('route_executed_tools_not_7')
if (smoke.controlledBrowserRuntimeRouteCallableNowTools !== 7) fail('callable_tools_not_7')
if (smoke.controlledBrowserRuntimeAdapterExecutedTools !== 7) fail('adapter_executed_tools_not_7')
if (smoke.localBrowserRuntimePackageExecutionPerformedTools !== 7) fail('browser_runtime_execution_tools_not_7')
if (smoke.scopedControlledToolsCallableNow !== 13) fail('scoped_callable_not_13')
if (smoke.remainingToolsStillBlockedForRuntime !== 8) fail('remaining_blocked_tools_not_8')
if (smoke.gpuRuntimeShouldStartNowTools !== 0) fail('gpu_started_now')
if (smoke.providerRuntimeApprovedNowTools !== 0) fail('provider_runtime_approved')
if (smoke.publicArtifactCreatedTools !== 0) fail('public_artifacts_created')
if (smoke.signedUrlCreatedTools !== 0) fail('signed_urls_created')
if (smoke.booleans?.externalAgentCanExecuteBrowserRuntimeControlledToolsNow !== true) {
  fail('scoped_browser_agent_execution_not_true')
}
if (smoke.booleans?.agentCanExecuteAll21ToolsNow !== false) {
  fail('all_21_execution_not_false')
}
if (smoke.booleans?.externalBetaReadyNow !== false) fail('external_beta_ready_true')
if (smoke.booleans?.productionReadyNow !== false) fail('production_ready_true')

for (const result of smoke.routeResults ?? []) {
  if (result.statusCode !== 200) fail(`tool_status_not_200:${result.toolId}`)
  if (result.adapterExecutedNow !== true) fail(`tool_adapter_not_executed:${result.toolId}`)
  if (result.localBrowserRuntimePackageExecutionPerformed !== true) {
    fail(`tool_browser_runtime_not_executed:${result.toolId}`)
  }
  if (!result.outputSha256) fail(`tool_output_hash_missing:${result.toolId}`)
  if (result.publicArtifactCreated !== false) fail(`tool_public_artifact:${result.toolId}`)
  if (result.signedUrlCreated !== false) fail(`tool_signed_url:${result.toolId}`)
  if (result.gpuRuntimeShouldStartNow !== false) fail(`tool_gpu_started:${result.toolId}`)
  if (result.providerRuntimeApprovedNow !== false) fail(`tool_provider_approved:${result.toolId}`)
}

for (const pattern of [
  /agentCanExecuteAll21ToolsNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /gpuRuntimeShouldStartNow["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(JSON.stringify(doc)) || pattern.test(scorecard)) {
    fail(`forbidden_claim:${pattern}`)
  }
}

let packageLockDiff = ''
try {
  packageLockDiff = git(['diff', '--', 'package-lock.json'])
} catch (error) {
  fail(`package_lock_diff_failed:${error.message}`)
}
if (packageLockDiff.trim()) fail('package_lock_changed')

let changed = ''
try {
  changed = git(['diff', '--name-only', 'HEAD'])
} catch (error) {
  fail(`changed_files_failed:${error.message}`)
}
for (const file of changed.split('\n').filter(Boolean)) {
  if (file.includes('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/(^|\/)(generated|render|renders|public-artifacts)(\/|$)/i.test(file)) {
    fail(`generated_output_changed:${file}`)
  }
  if (/\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i.test(file)) {
    fail(`generated_media_changed:${file}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision,
  routePath,
  routeFlag,
  controlledBrowserRuntimeRouteExecutedTools: smoke.controlledBrowserRuntimeRouteExecutedTools,
  controlledBrowserRuntimeRouteCallableNowTools: smoke.controlledBrowserRuntimeRouteCallableNowTools,
  scopedControlledToolsCallableNow: smoke.scopedControlledToolsCallableNow,
  remainingToolsStillBlockedForRuntime: smoke.remainingToolsStillBlockedForRuntime,
  gpuRuntimeShouldStartNowTools: smoke.gpuRuntimeShouldStartNowTools,
  publicArtifactCreatedTools: smoke.publicArtifactCreatedTools,
  packageLockChanged: false,
}, null, 2))
