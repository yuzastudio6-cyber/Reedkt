import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_controlled_adapter_executable_five_with_route_worker_blocks'
const status =
  'controlled_cpu_static_adapter_executed_five_private_outputs_external_route_blocked'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-controlled-adapter'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-controlled-adapter.ts'
const diagnosticsScriptName =
  'ai-graphics:external-agent-cpu-static-controlled-adapter:diagnostics'
const diagnosticsScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-controlled-adapter-diagnostics.mjs'

const tools = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js']

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-controlled-adapter.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-controlled-adapter-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-controlled-adapter.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-controlled-adapter.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-controlled-adapter-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-controlled-adapter.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const forbiddenPatterns = [
  /externalAgentCanExecuteViaMountedRouteNow["`:\s=]+true/i,
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

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
  if (!Array.isArray(report.tools) || report.tools.length !== 5) {
    fail(`${label}_tool_count_mismatch`)
  }
  for (const toolId of tools) {
    if (!report.tools?.includes(toolId)) fail(`${label}_missing_tool:${toolId}`)
    const result = report.results?.find((entry) => entry.toolId === toolId)
    if (!result) {
      fail(`${label}_missing_result:${toolId}`)
      continue
    }
    if (result.status !== 'controlled_cpu_static_adapter_executed_private_output_ready') {
      fail(`${label}_bad_result_status:${toolId}:${result.status}`)
    }
    if (result.controlledAdapterExecutableNow !== true) {
      fail(`${label}_not_executable:${toolId}`)
    }
    if (result.controlledAdapterExecutedNow !== true) {
      fail(`${label}_not_executed:${toolId}`)
    }
    if (result.localCpuStaticPackageExecutionPerformed !== true) {
      fail(`${label}_local_execution_not_true:${toolId}`)
    }
    if (!result.output?.privateArtifactSha256 || result.output.privateArtifactSha256.length !== 64) {
      fail(`${label}_missing_private_output_hash:${toolId}`)
    }
    for (const key of [
      'externalAgentCanExecuteViaMountedRouteNow',
      'routeExecutionApprovedNow',
      'workerExecutionApprovedNow',
      'toolExecutionApprovedNow',
      'browserWebglCanvasRuntimeApprovedNow',
      'gpuRuntimeApprovedNow',
      'gpuRuntimeShouldStartNow',
      'providerRuntimeApprovedNow',
      'publicArtifactCreated',
      'signedUrlCreated',
      'runtimeReadyNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ]) {
      if (result[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
  }
  const counts = report.counts ?? {}
  const expectedCounts = {
    controlledAdapterExecutableTools: 5,
    controlledAdapterExecutedTools: 5,
    localCpuStaticPackageExecutionPerformedTools: 5,
    privateOutputCandidatesReadyTools: 5,
    externalAgentRouteExecutableNowTools: 0,
    routeExecutionApprovedNowTools: 0,
    workerExecutionApprovedNowTools: 0,
    toolExecutionApprovedNowTools: 0,
    gpuRuntimeShouldStartNowTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) fail(`${label}_count_${key}_mismatch:${counts[key]}`)
  }
  const booleans = report.booleans ?? {}
  for (const key of [
    'cpuStaticControlledAdapterImplemented',
    'cpuStaticControlledAdapterSmokeExecuted',
    'fiveCpuStaticToolsControlledAdapterExecutable',
    'fiveCpuStaticToolsControlledAdapterExecuted',
    'fivePrivateOutputCandidatesReady',
    'localCpuStaticPackageExecutionPerformed',
    'npmCiFromExistingLockfilePerformedInWorktree',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'externalAgentCanExecuteViaMountedRouteNow',
    'agentCanExecuteToolsNow',
    'routeExecutionApprovedNow',
    'workerExecutionApprovedNow',
    'toolExecutionApprovedNow',
    'browserWebglCanvasRuntimeApprovedNow',
    'gpuRuntimeApprovedNow',
    'gpuRuntimeShouldStartNow',
    'providerRuntimeApprovedNow',
    'publicArtifactCreated',
    'signedUrlCreated',
    'runtimeReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
    'dependencyInstallPerformedByAdapterScript',
    'packageLockMutationPerformed',
    'supabaseMutationPerformed',
    'gcsUploadPerformed',
  ]) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-controlled-adapter.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-controlled-adapter.md')
const promptResult = read('docs/prompt-ai-graphics-external-agent-cpu-static-controlled-adapter-results.md')
const implementationPrompt = read('docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-controlled-adapter.md')
const packageJson = json('package.json')
const moduleSource = read('server/tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter.ts')
const cliSource = read('server/cli/ai-graphics-external-agent-cpu-static-controlled-adapter.ts')
const indexSource = read('server/tool-registry/index.ts')

checkReport('docs', docs)

const liveOutput = JSON.parse(exec(`npm run --silent ${runScriptName}`))
checkReport('live', liveOutput)

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('run_script_missing_or_mismatch')
}
if (packageJson.scripts?.[diagnosticsScriptName] !== diagnosticsScriptCommand) {
  fail('diagnostics_script_missing_or_mismatch')
}
if (!indexSource.includes("export * from './ai-graphics-external-agent-cpu-static-controlled-adapter'")) {
  fail('index_export_missing')
}
for (const packageName of ['d3', 'vega-lite', 'vega', '@svgdotjs/svg.js', 'jsdom', '@viz-js/viz']) {
  if (!moduleSource.includes(`import('${packageName}')`)) {
    fail(`module_missing_dynamic_import:${packageName}`)
  }
}
for (const phrase of [
  'controlledAdapterExecutableNow: true',
  'controlledAdapterExecutedNow: true',
  'localCpuStaticPackageExecutionPerformed: true',
  'externalAgentCanExecuteViaMountedRouteNow: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!moduleSource.includes(phrase)) fail(`module_missing_phrase:${phrase}`)
}
for (const phrase of [
  'Controlled adapter executable tools: `5`',
  'External route executable tools now: `0`',
  'No external mounted route execution',
]) {
  if (!promptResult.includes(phrase)) fail(`prompt_result_missing:${phrase}`)
}
for (const phrase of [
  'first real execution bridge',
  'controlled adapter is executable for the five CPU/static tools',
  'External route execution',
]) {
  if (!docsMd.includes(phrase)) fail(`docs_md_missing:${phrase}`)
}
for (const phrase of ['outputHash=', 'mounted external-beta route remains blocked']) {
  if (!implementationPrompt.includes(phrase)) fail(`implementation_prompt_missing:${phrase}`)
}

for (const [label, text] of [
  ['docs_md', docsMd],
  ['prompt_result', promptResult],
  ['implementation_prompt', implementationPrompt],
  ['module_source', moduleSource],
  ['cli_source', cliSource],
]) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`${label}_forbidden_pattern:${pattern}`)
  }
}

const packageLockDiff = exec('git diff -- package-lock.json')
if (packageLockDiff.trim()) fail('package_lock_changed')

const packageDiff = exec('git diff -- package.json')
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line === `+    "${runScriptName}": "${runScriptCommand}",`) continue
  if (line === `+    "${diagnosticsScriptName}": "${diagnosticsScriptCommand}",`) continue
  if (line.startsWith('+') || line.startsWith('-')) {
    fail(`unexpected_package_json_diff:${line}`)
  }
}

const changedFiles = exec('git diff --name-only')
  .split('\n')
  .filter(Boolean)
for (const file of changedFiles) {
  if (generatedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision,
  controlledAdapterExecutableTools: 5,
  controlledAdapterExecutedTools: 5,
  externalAgentRouteExecutableNowTools: 0,
}, null, 2))
