import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks'
const status =
  'controlled_worker_claim_route_execution_passed_for_thirteen_tools_gpu_model_still_blocked'
const sourceDecision =
  'ai_graphics_external_beta_tool_call_route_browser_runtime_controlled_execution_smoke_passed'
const runScriptName =
  'ai-graphics:external-agent-controlled-worker-route-execution-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-controlled-worker-route-execution-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-controlled-worker-route-execution-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-controlled-worker-route-execution-smoke-diagnostics.mjs'

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

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-controlled-worker-route-execution-smoke.ts',
  'scripts/validation/ai-graphics-external-agent-controlled-worker-route-execution-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.md',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-browser-runtime-controlled-execution-smoke.json',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter.ts',
  'server/tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter.ts',
  'package.json',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  controlledWorkerRouteExecutionAttemptedTools: 13,
  controlledWorkerRouteExecutionCompletedTools: 13,
  mockQueueInsertedJobsWithProvidedEvidence: 13,
  mockWorkerClaimsCreatedWithProvidedEvidence: 13,
  mockWorkerEventsRecordedWithProvidedEvidence: 13,
  controlledCanonicalRouteExecutedToolsWithProvidedEvidence: 13,
  cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence: 6,
  browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence: 7,
  localControlledPackageExecutionPerformedToolsWithProvidedEvidence: 13,
  controlledAdapterExecutedToolsWithProvidedEvidence: 13,
  gpuModelBlockedToolsWithProvidedEvidence: 8,
  externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence: 13,
  externalAgentBroadExecutableNowTools: 0,
  workerDispatchPerformedTools: 0,
  routeExecutionPerformedTools: 13,
  toolExecutionPerformedTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  publicArtifactCreatedTools: 0,
  signedUrlCreatedTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueBooleans = [
  'externalAgentControlledWorkerRouteExecutionSmokePassed',
  'sourceRouteControlledExecutionSmokeAccepted',
  'mockQueueServiceClaimAccepted',
  'mockQueueServiceWorkerEventAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'thirteenControlledToolsClaimedBeforeRouteExecution',
  'thirteenControlledToolsExecutedViaClaimedCanonicalRoute',
  'sixCpuStaticToolsExecutedViaClaimedCanonicalRoute',
  'sevenBrowserRuntimeToolsExecutedViaClaimedCanonicalRoute',
  'eightGpuModelToolsRemainBlocked',
  'localControlledPackageExecutionPerformed',
  'controlledAdapterExecutionPerformed',
  'privateOutputMetadataReturned',
  'agentCanSelectForPlanning',
  'externalAgentCanExecuteControlledWorkerRouteToolsNow',
  'agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow',
  'routeExecutionApprovedNow',
  'routeExecutionPerformed',
  'mockWorkerClaimPerformed',
  'controlledLocalBrowserRuntimePerformed',
  'browserRuntimeStartedByCanonicalRoute',
]

const falseBooleans = [
  'agentCanExecuteAll21ToolsNow',
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteToolsNow',
  'backendQueueSubmissionApprovedNow',
  'backendQueueSubmissionPerformed',
  'liveQueueWriteApprovedNow',
  'liveQueueWritePerformed',
  'workerExecutionApprovedNow',
  'workerExecutionPerformed',
  'workerEnqueueApprovedNow',
  'workerEnqueuePerformed',
  'workerDispatchApprovedNow',
  'workerDispatchPerformed',
  'toolExecutionApprovedNow',
  'toolExecutionPerformed',
  'providerRuntimeApprovedNow',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimeApprovedNow',
  'browserWebglCanvasRuntimePerformed',
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

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /agentCanExecuteAll21ToolsNow["`:\s=]+true/i,
  /agentCanExecuteGpuModelToolsNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /liveQueueWriteApprovedNow["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /modelInferencePerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /internalBetaReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const changedGeneratedArtifactPattern =
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

function checkRows(label, rows, expectedTools, group, routeStatus) {
  if (!Array.isArray(rows)) {
    fail(`${label}_rows_not_array`)
    return
  }
  const groupRows = rows.filter((row) => row.group === group)
  if (groupRows.length !== expectedTools.length) {
    fail(`${label}_${group}_count_mismatch:${groupRows.length}`)
  }
  for (const toolId of expectedTools) {
    const row = groupRows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_${group}_tool:${toolId}`)
      continue
    }
    if (row.routeStatusCode !== 200) fail(`${label}_${toolId}_status_not_200`)
    if (row.routeOk !== true) fail(`${label}_${toolId}_ok_not_true`)
    if (row.routeStatus !== routeStatus) fail(`${label}_${toolId}_route_status_mismatch`)
    if (row.controlledAdapterExecutedNow !== true) fail(`${label}_${toolId}_adapter_not_executed`)
    if (row.localControlledPackageExecutionPerformed !== true) fail(`${label}_${toolId}_local_package_not_executed`)
    if (row.mockQueueJobIdPresent !== true) fail(`${label}_${toolId}_missing_queue_job`)
    if (row.mockWorkerClaimIdPresent !== true) fail(`${label}_${toolId}_missing_worker_claim`)
    if (row.mockWorkerEventIdPresent !== true) fail(`${label}_${toolId}_missing_worker_event`)
    if (!row.outputKind) fail(`${label}_${toolId}_missing_output_kind`)
    if (!row.outputSha256 || row.outputSha256.length !== 64) fail(`${label}_${toolId}_missing_output_hash`)
    for (const key of [
      'publicArtifactCreated',
      'signedUrlCreated',
      'gpuRuntimeShouldStartNow',
      'workerDispatchPerformed',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
  }
}

function checkReport(label, report) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== status) fail(`${label}_status_mismatch`)
  if (report.interfaces?.packageScript !== runScriptName) fail(`${label}_package_script_ref_mismatch`)
  if (report.interfaces?.diagnosticScript !== diagnosticScriptName) fail(`${label}_diagnostic_script_ref_mismatch`)
  if (report.interfaces?.routePath !== '/api/ai-graphics/external-beta/tool-call') fail(`${label}_route_path_mismatch`)

  for (const [key, value] of Object.entries(expectedCounts)) {
    if (report.counts?.[key] !== value) {
      fail(`${label}_count_mismatch:${key}:expected_${value}:got_${report.counts?.[key]}`)
    }
  }
  for (const key of trueBooleans) {
    if (report.booleans?.[key] !== true) fail(`${label}_boolean_not_true:${key}`)
  }
  for (const key of falseBooleans) {
    if (report.booleans?.[key] !== false) fail(`${label}_boolean_not_false:${key}`)
  }

  checkRows(
    label,
    report.controlledWorkerRouteResults,
    cpuStaticTools,
    'cpu_static',
    'external_beta_tool_call_route_cpu_static_controlled_execution_private_output_ready',
  )
  checkRows(
    label,
    report.controlledWorkerRouteResults,
    browserRuntimeTools,
    'browser_runtime',
    'external_beta_tool_call_route_browser_runtime_controlled_execution_private_output_ready',
  )

  const blocked = report.blockedGpuModelResults
  if (!Array.isArray(blocked) || blocked.length !== 8) fail(`${label}_blocked_gpu_model_count_mismatch`)
  for (const toolId of gpuModelTools) {
    const row = blocked?.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_blocked_gpu_tool:${toolId}`)
      continue
    }
    if (row.statusCode !== 409) fail(`${label}_${toolId}_blocked_status_not_409`)
    if (row.blocked !== true) fail(`${label}_${toolId}_blocked_not_true`)
    if (row.gpuRuntimeShouldStartNow !== false) fail(`${label}_${toolId}_gpu_started`)
    if (row.agentCanExecuteToolsNow !== false) fail(`${label}_${toolId}_agent_execution_enabled`)
  }

  const represented = new Set([
    ...(report.controlledWorkerRouteResults ?? []).map((row) => row.toolId),
    ...(report.blockedGpuModelResults ?? []).map((row) => row.toolId),
  ])
  for (const toolId of allTools) {
    if (!represented.has(toolId)) fail(`${label}_tool_not_represented:${toolId}`)
  }
}

for (const file of requiredFiles) read(file)
checkPackageJson()

const source = parseJson('docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-browser-runtime-controlled-execution-smoke.json')
if (source.decision !== sourceDecision) fail('source_route_smoke_decision_mismatch')
if (source.counts?.controlledAdapterExecutedTools !== 13) fail('source_route_smoke_adapter_count_not_13')
if (source.booleans?.agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow !== true) {
  fail('source_route_smoke_controlled_execution_not_accepted')
}
if (source.booleans?.agentCanExecuteAll21ToolsNow !== false) {
  fail('source_route_smoke_all_21_execution_not_blocked')
}

const docsReport = parseJson('docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json')
checkReport('docs', docsReport)

let liveReport = {}
try {
  liveReport = JSON.parse(exec(`npm run --silent ${runScriptName}`))
  checkReport('live', liveReport)
} catch (error) {
  fail(`live_smoke_failed:${error.message}`)
}

const md = read('docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.md')
for (const fragment of [
  'controlledWorkerRouteExecutionCompletedTools`: 13',
  'mockWorkerClaimsCreatedWithProvidedEvidence`: 13',
  'externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence`: 13',
  'externalAgentBroadExecutableNowTools`: 0',
  'gpuRuntimeShouldStartNowTools`: 0',
]) {
  if (!md.includes(fragment)) fail(`markdown_missing_fragment:${fragment}`)
}
for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(md) || pattern.test(JSON.stringify(docsReport))) {
    fail(`forbidden_runtime_claim:${pattern}`)
  }
}

let changedFiles = []
try {
  changedFiles = exec('git diff --name-only').trim().split('\n').filter(Boolean)
  changedFiles.push(...exec('git diff --cached --name-only').trim().split('\n').filter(Boolean))
} catch (error) {
  fail(`git_diff_name_only_failed:${error.message}`)
}
for (const file of changedFiles) {
  if (file === 'package-lock.json') fail('package_lock_changed')
  if (changedGeneratedArtifactPattern.test(file)) {
    fail(`generated_artifact_path_changed:${file}`)
  }
}

try {
  const trackedLocalArtifacts = exec('git ls-files .local-artifacts').trim()
  if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
} catch (error) {
  fail(`local_artifacts_check_failed:${error.message}`)
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  controlledWorkerRouteExecutedTools: 13,
  gpuModelToolsStillBlocked: 8,
  packageLockUnchanged: true,
}, null, 2))
