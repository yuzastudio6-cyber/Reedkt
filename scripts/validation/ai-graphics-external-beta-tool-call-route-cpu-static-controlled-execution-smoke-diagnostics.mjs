import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_beta_tool_call_route_cpu_static_controlled_execution_smoke_passed'
const status =
  'canonical_tool_call_route_cpu_static_controlled_execution_passed_for_six_tools'
const runScriptName =
  'ai-graphics:external-beta-tool-call-route-cpu-static-controlled-execution-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-call-route-cpu-static-controlled-execution-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-tool-call-route-cpu-static-controlled-execution-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-call-route-cpu-static-controlled-execution-smoke-diagnostics.mjs'

const cpuStaticTools = ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js']
const allTools = [
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

const requiredFiles = [
  'server/config/env.ts',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter.ts',
  'server/cli/ai-graphics-external-beta-tool-call-route-cpu-static-controlled-execution-smoke.ts',
  'scripts/validation/ai-graphics-external-beta-tool-call-route-cpu-static-controlled-execution-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-cpu-static-controlled-execution-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-cpu-static-controlled-execution-smoke.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-controlled-adapter.json',
  'package.json',
]

const forbiddenDocPatterns = [
  /agentCanExecuteAll21ToolsNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
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

function json(file) {
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
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 80 * 1024 * 1024,
  })
}

function checkReport(label, report) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== status) fail(`${label}_status_mismatch`)
  if (report.routePath !== '/api/ai-graphics/external-beta/tool-call') {
    fail(`${label}_route_path_mismatch`)
  }
  if (report.routeFlag !== 'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_ENABLED') {
    fail(`${label}_route_flag_mismatch`)
  }
  if (report.disabledCanonicalRouteStatus !== 409) fail(`${label}_disabled_status_not_409`)

  const cpuRows = report.cpuStaticResults
  if (!Array.isArray(cpuRows) || cpuRows.length !== 6) fail(`${label}_cpu_static_result_count_not_6`)
  for (const toolId of cpuStaticTools) {
    const row = cpuRows?.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_cpu_static_tool:${toolId}`)
      continue
    }
    if (row.statusCode !== 200) fail(`${label}_${toolId}_status_not_200`)
    if (row.ok !== true) fail(`${label}_${toolId}_ok_not_true`)
    if (row.externalAgentCanExecuteCpuStaticControlledToolsNow !== true) {
      fail(`${label}_${toolId}_cpu_static_execution_not_true`)
    }
    if (row.controlledCpuStaticCanonicalRouteExecutionPerformed !== true) {
      fail(`${label}_${toolId}_canonical_route_execution_not_true`)
    }
    if (row.controlledAdapterExecutedNow !== true) fail(`${label}_${toolId}_adapter_not_executed`)
    if (row.localCpuStaticPackageExecutionPerformed !== true) {
      fail(`${label}_${toolId}_local_package_execution_not_true`)
    }
    if (!row.outputSha256 || row.outputSha256.length !== 64) {
      fail(`${label}_${toolId}_missing_output_hash`)
    }
    for (const key of [
      'publicArtifactCreated',
      'signedUrlCreated',
      'gpuRuntimeShouldStartNow',
      'workerDispatchPerformed',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
  }

  const blockedRows = report.blockedResults
  if (!Array.isArray(blockedRows) || blockedRows.length !== 15) fail(`${label}_blocked_count_not_15`)
  for (const toolId of allTools.filter((tool) => !cpuStaticTools.includes(tool))) {
    const row = blockedRows?.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_blocked_tool:${toolId}`)
      continue
    }
    if (row.statusCode !== 409) fail(`${label}_${toolId}_blocked_status_not_409`)
    if (row.blocked !== true) fail(`${label}_${toolId}_blocked_not_true`)
    if (row.gpuRuntimeShouldStartNow !== false) fail(`${label}_${toolId}_gpu_started`)
    if (row.agentCanExecuteToolsNow !== false) fail(`${label}_${toolId}_all_tool_execution_enabled`)
  }

  const counts = report.counts ?? {}
  const expectedCounts = {
    totalAiGraphicsTools: 21,
    cpuStaticControlledCanonicalRouteExecutedTools: 6,
    localCpuStaticPackageExecutionPerformedTools: 6,
    controlledAdapterExecutedTools: 6,
    nonCpuStaticBlockedTools: 15,
    all21ExecutableNowTools: 0,
    workerDispatchPerformedTools: 0,
    gpuRuntimeShouldStartNowTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) fail(`${label}_count_${key}_mismatch:${counts[key]}`)
  }

  const booleans = report.booleans ?? {}
  for (const key of [
    'canonicalToolCallRouteCpuStaticControlledExecutionSmokePassed',
    'canonicalToolCallRouteMountedWithCpuStaticExecutionFlag',
    'sixCpuStaticToolsExecutableViaCanonicalRouteNow',
    'sixCpuStaticToolsExecutedViaCanonicalRouteNow',
    'localCpuStaticPackageExecutionPerformed',
    'privateOutputMetadataReturned',
    'nonCpuStaticToolsRemainBlocked',
    'agentCanExecuteCpuStaticControlledToolsNow',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'agentCanExecuteAll21ToolsNow',
    'workerExecutionApprovedNow',
    'workerDispatchPerformed',
    'providerRuntimePerformed',
    'browserWebglCanvasRuntimePerformed',
    'gpuRuntimePerformed',
    'gpuRuntimeShouldStartNow',
    'supabaseMutationPerformed',
    'gcsUploadPerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
    'runtimeReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
    'dependencyInstallPerformed',
    'packageLockMutationPerformed',
  ]) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-cpu-static-controlled-execution-smoke.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-cpu-static-controlled-execution-smoke.md')
const packageJson = json('package.json')
const envSource = read('server/config/env.ts')
const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
const cliSource = read('server/cli/ai-graphics-external-beta-tool-call-route-cpu-static-controlled-execution-smoke.ts')

checkReport('docs', docs)

const live = JSON.parse(exec(`npm run --silent ${runScriptName}`))
checkReport('live', live)

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('diagnostic_script_mismatch')
}
for (const phrase of [
  'aiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionEnabled',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_ENABLED',
]) {
  if (!envSource.includes(phrase)) fail(`env_missing:${phrase}`)
}
for (const phrase of [
  'executeAiGraphicsExternalBetaToolCallCpuStaticControlledAdapter',
  'executeAiGraphicsExternalAgentCpuStaticControlledAdapter',
  'isAiGraphicsExternalAgentCpuStaticControlledAdapterTool',
  'external_beta_tool_call_route_cpu_static_controlled_execution_private_output_ready',
]) {
  if (!routeSource.includes(phrase)) fail(`route_missing:${phrase}`)
}
for (const phrase of [
  'withoutBlockedDetailsPayload',
  'Expected six CPU/static cases',
  'Expected fifteen blocked cases',
]) {
  if (!cliSource.includes(phrase)) fail(`cli_missing:${phrase}`)
}
for (const phrase of [
  'canonical external-beta tool-call route can execute the six proven CPU/static tools',
  'No Worker dispatch',
]) {
  if (!docsMd.includes(phrase)) fail(`docs_md_missing:${phrase}`)
}
for (const [label, text] of [
  ['docs_md', docsMd],
  ['docs_json', JSON.stringify(docs)],
]) {
  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(text)) fail(`${label}_forbidden_pattern:${pattern}`)
  }
}

const packageLockDiff = exec('git diff -- package-lock.json')
if (packageLockDiff.trim()) fail('package_lock_changed')

const trackedLocalArtifacts = exec('git ls-files .local-artifacts')
if (trackedLocalArtifacts.trim()) fail('local_artifacts_tracked')

const changedFiles = [
  ...exec('git diff --name-only HEAD').split('\n'),
  ...exec('git ls-files --others --exclude-standard').split('\n'),
].filter(Boolean)
for (const file of changedFiles) {
  if (changedGeneratedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status,
  cpuStaticControlledCanonicalRouteExecutedTools:
    docs.counts.cpuStaticControlledCanonicalRouteExecutedTools,
  nonCpuStaticBlockedTools: docs.counts.nonCpuStaticBlockedTools,
  agentCanExecuteCpuStaticControlledToolsNow:
    docs.booleans.agentCanExecuteCpuStaticControlledToolsNow,
  agentCanExecuteAll21ToolsNow: docs.booleans.agentCanExecuteAll21ToolsNow,
  workerDispatchPerformed: docs.booleans.workerDispatchPerformed,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
}, null, 2))
