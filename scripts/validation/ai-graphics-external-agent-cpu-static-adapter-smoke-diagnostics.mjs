import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_adapter_smoke_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_agent_cpu_static_adapter_smoke_prepared_five_ready_one_blocked_execution_blocked'
const phase0Decision =
  'ai_graphics_cpu_static_execution_proof_phase_0_completed_with_warnings'
const adapterAuthorizationDecision =
  'ai_graphics_external_agent_tool_adapter_authorization_prepared_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-adapter-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-adapter-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-adapter-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-adapter-smoke-diagnostics.mjs'

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

const readyCpuStaticTools = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  cpuStaticCohortTools: 6,
  cpuStaticAdapterSmokeReadyTools: 5,
  cpuStaticAdapterSmokeBlockedTools: 1,
  satoriBlockedPendingApprovedFontFixtureTools: 1,
  nonCpuStaticDeferredTools: 15,
  sourceAdapterAuthorizationRows: 21,
  sourceAdapterContractsAuthorizedWithRuntimeBlocks: 21,
  externalAgentCanInvokeAdapterNowTools: 0,
  externalAgentExecutableNowTools: 0,
  toolExecutionApprovedNowTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
}

const trueKeys = [
  'externalAgentCpuStaticAdapterSmokePrepared',
  'sourcePhase0Accepted',
  'sourceAdapterAuthorizationAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'cpuStaticCohortCovered',
  'fiveCpuStaticAdapterSmokeReadyWithPrivateOutputContracts',
  'satoriBlockedPendingApprovedFontFixture',
  'nonCpuStaticToolsDeferredByRuntimeBoundary',
  'privateOutputContractsPreparedForPassedCpuStaticTools',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'externalAgentCanInvokeAdapterNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'backendQueueSubmissionPerformed',
  'liveQueueWritePerformed',
  'workerEnqueuePerformed',
  'workerDispatchPerformed',
  'toolExecutionPerformed',
  'routeExecutionPerformed',
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-agent-cpu-static-adapter-smoke.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-adapter-smoke.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-adapter-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-adapter-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-adapter-smoke.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-adapter-smoke-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-adapter-smoke.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json',
  'docs/tool-intelligence/ai-graphics/external-agent-tool-adapter-authorization-proof.json',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const allowedPackageDiffLines = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
])

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /externalAgentCanInvokeAdapterNow["`:\s=]+true/i,
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

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
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 60 * 1024 * 1024,
  })
}

function checkList(label, list, expected) {
  if (!Array.isArray(list)) {
    fail(`${label}_not_array`)
    return
  }
  if (list.length !== expected.length) fail(`${label}_count_mismatch`)
  for (const value of expected) {
    if (!list.includes(value)) fail(`${label}_missing:${value}`)
  }
}

function checkCounts(label, counts) {
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts?.[key] !== value) fail(`${label}_count_mismatch:${key}:${counts?.[key]}`)
  }
}

function checkBooleans(label, booleans) {
  for (const key of trueKeys) {
    if (booleans?.[key] !== true) fail(`${label}_boolean_not_true:${key}`)
  }
  for (const key of falseKeys) {
    if (booleans?.[key] !== false) fail(`${label}_boolean_not_false:${key}`)
  }
}

function checkRows(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_rows_not_array`)
    return
  }
  if (rows.length !== 21) fail(`${label}_rows_count_mismatch:${rows.length}`)
  for (const toolId of tools) {
    const row = rows.find((entry) => entry.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_row:${toolId}`)
      continue
    }
    if (readyCpuStaticTools.includes(toolId)) {
      if (
        row.adapterSmokeStatus !==
        'cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked'
      ) {
        fail(`${label}_ready_tool_status_mismatch:${toolId}:${row.adapterSmokeStatus}`)
      }
      if (row.adapterSmokePreparedWithProvidedEvidence !== true) {
        fail(`${label}_ready_tool_not_prepared:${toolId}`)
      }
      if (row.privateOutputContractPrepared !== true) {
        fail(`${label}_ready_tool_missing_private_output_contract:${toolId}`)
      }
    }
    if (toolId === 'satori') {
      if (
        row.adapterSmokeStatus !==
        'cpu_static_adapter_smoke_blocked_pending_approved_font_fixture'
      ) {
        fail(`${label}_satori_status_mismatch:${row.adapterSmokeStatus}`)
      }
      if (!/font/i.test(row.blocker ?? '')) fail(`${label}_satori_blocker_missing_font`)
      if (row.satoriApprovedFontFixtureRequired !== true) {
        fail(`${label}_satori_font_requirement_not_true`)
      }
    }
    if (!readyCpuStaticTools.includes(toolId) && toolId !== 'satori') {
      if (row.cpuStaticCohortTool && row.adapterSmokePreparedWithProvidedEvidence) {
        fail(`${label}_unexpected_cpu_static_ready:${toolId}`)
      }
    }
    for (const field of [
      'externalAgentCanInvokeAdapterNow',
      'agentCanExecuteToolsNow',
      'routeExecutionApprovedNow',
      'workerExecutionApprovedNow',
      'toolExecutionApprovedNow',
      'providerRuntimeApprovedNow',
      'browserWebglCanvasRuntimeApprovedNow',
      'gpuRuntimeApprovedNow',
      'gpuRuntimeShouldStartNow',
      'runtimeReadyNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ]) {
      if (row[field] !== false) fail(`${label}_row_runtime_gate_not_false:${toolId}:${field}`)
    }
  }
}

function checkPackageDiff(command, label) {
  const diff = exec(command)
  for (const line of diff.split('\n')) {
    if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
      continue
    }
    if (line.startsWith('+') && allowedPackageDiffLines.has(line)) continue
    if (line.startsWith('+') || line.startsWith('-')) {
      fail(`${label}_unexpected_package_diff:${line}`)
    }
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-adapter-smoke.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-adapter-smoke.md')
const promptResult = read('docs/prompt-ai-graphics-external-agent-cpu-static-adapter-smoke-results.md')
const implementationPrompt = read('docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-adapter-smoke.md')
const phase0 = json('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json')
const adapter = json('docs/tool-intelligence/ai-graphics/external-agent-tool-adapter-authorization-proof.json')
const packageJson = json('package.json')
const moduleSource = read('server/tool-registry/ai-graphics-external-agent-cpu-static-adapter-smoke.ts')
const cliSource = read('server/cli/ai-graphics-external-agent-cpu-static-adapter-smoke.ts')
const diagnosticSource = read('scripts/validation/ai-graphics-external-agent-cpu-static-adapter-smoke-diagnostics.mjs')
const indexSource = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.sourcePhase0Decision !== phase0Decision) fail('docs_phase0_decision_mismatch')
if (docs.sourceAdapterAuthorizationDecision !== adapterAuthorizationDecision) {
  fail('docs_adapter_authorization_decision_mismatch')
}
if (phase0.decision !== phase0Decision) fail('phase0_decision_mismatch')
if (phase0.status !== 'completed_with_warnings') fail('phase0_status_mismatch')
if (adapter.decision !== adapterAuthorizationDecision) fail('adapter_authorization_decision_mismatch')
if (adapter.status !== 'external_agent_tool_adapter_authorization_prepared_all_21_execution_blocked') {
  fail('adapter_authorization_status_mismatch')
}

checkList('docs_tools', docs.tools, tools)
checkList('docs_capabilities', docs.capabilities, capabilities)
checkCounts('docs', docs.counts)
checkBooleans('docs', docs.booleans)
checkRows('docs', docs.rows)

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

for (const required of [
  'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_DECISION',
  'buildAiGraphicsExternalAgentCpuStaticAdapterSmoke',
  'fiveCpuStaticAdapterSmokeReadyWithPrivateOutputContracts',
  'satoriBlockedPendingApprovedFontFixture',
  'externalAgentCanInvokeAdapterNow: false',
  'agentCanExecuteToolsNow: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!moduleSource.includes(required)) fail(`module_missing_required_text:${required}`)
}

for (const required of [
  'phase0Path',
  'adapterAuthorizationPath',
  'buildAiGraphicsExternalAgentCpuStaticAdapterSmoke',
  '--write-records',
  'report.counts.cpuStaticAdapterSmokeReadyTools === 5',
  'report.booleans.agentCanExecuteToolsNow === false',
]) {
  if (!cliSource.includes(required)) fail(`cli_missing_required_text:${required}`)
}

if (!diagnosticSource.includes('forbiddenDocPatterns')) fail('diagnostic_missing_forbidden_patterns')
if (!diagnosticSource.includes('generatedArtifactPattern')) {
  fail('diagnostic_missing_generated_artifact_scan')
}
if (!indexSource.includes("export * from './ai-graphics-external-agent-cpu-static-adapter-smoke'")) {
  fail('index_missing_cpu_static_adapter_smoke_export')
}

let cliReport = {}
try {
  cliReport = JSON.parse(exec(`npm run --silent ${runScriptName}`))
} catch (error) {
  fail(`cli_report_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
checkList('cli_tools', cliReport.tools, tools)
checkList('cli_capabilities', cliReport.capabilities, capabilities)
checkCounts('cli', cliReport.counts)
checkBooleans('cli', cliReport.booleans)
checkRows('cli', cliReport.rows)

if (JSON.stringify(docs.counts) !== JSON.stringify(cliReport.counts)) {
  fail('docs_cli_counts_mismatch')
}
if (JSON.stringify(docs.booleans) !== JSON.stringify(cliReport.booleans)) {
  fail('docs_cli_booleans_mismatch')
}

for (const fileText of [JSON.stringify(docs), docsMd, promptResult, implementationPrompt]) {
  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(fileText)) fail(`forbidden_doc_claim:${pattern}`)
  }
}

for (const required of [
  decision,
  acceptedStatus,
  'externalAgentCanInvokeAdapterNow=false',
  'agentCanExecuteToolsNow=false',
  'gpuRuntimeShouldStartNow=false',
  'Satori blocked pending approved font fixture',
  'Adapter-smoke ready with private output contracts',
]) {
  if (!docsMd.includes(required)) fail(`docs_md_missing:${required}`)
}

for (const required of [
  'AI Graphics External Agent CPU Static Adapter Smoke',
  decision,
  'cpuStaticAdapterSmokeReadyTools=5',
  'satoriBlockedPendingApprovedFontFixtureTools=1',
  'externalAgentCanInvokeAdapterNowTools=0',
  'toolExecutionApprovedNowTools=0',
]) {
  if (!scorecard.includes(required)) fail(`scorecard_missing:${required}`)
}

checkPackageDiff('git diff --unified=0 -- package.json', 'working')
checkPackageDiff('git diff --cached --unified=0 -- package.json', 'cached')

const packageLockDiff = [
  exec('git diff -- package-lock.json'),
  exec('git diff --cached -- package-lock.json'),
].join('\n').trim()
if (packageLockDiff) fail('package_lock_changed')

const changedFiles = [
  exec('git diff --name-only HEAD'),
  exec('git diff --cached --name-only'),
  exec('git ls-files --others --exclude-standard'),
].join('\n')

for (const file of changedFiles.split('\n').filter(Boolean)) {
  if (generatedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
}

const localArtifacts = [
  exec('git ls-files .local-artifacts'),
  exec('git diff --name-only HEAD -- .local-artifacts'),
  exec('git diff --cached --name-only -- .local-artifacts'),
].join('\n').trim()
if (localArtifacts) fail(`local_artifacts_changed:${localArtifacts}`)

if (failures.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        failures,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      status: acceptedStatus,
      totalTools: 21,
      readyCpuStaticTools: readyCpuStaticTools.length,
      satoriBlocked: true,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      gpuRuntimeShouldStartNow: false,
    },
    null,
    2,
  ),
)
