import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const runScriptName = 'ai-graphics:external-agent-execution-gate'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-agent-execution-gate.ts'
const diagnosticScriptName = 'ai-graphics:external-agent-execution-gate:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-execution-gate-diagnostics.mjs'
const decision =
  'ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings'
const acceptedStatus = 'external_agent_execution_gate_fail_closed_runtime_blocked'

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

const gpuTools = new Set([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const falseBooleanKeys = [
  'rawChatExecutionAllowed',
  'agentCanExecuteToolsNow',
  'externalAgentExecutionAllowedNow',
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
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'workerEnqueuePerformed',
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

const trueBooleanKeys = [
  'externalAgentExecutionGatePrepared',
  'sourceExternalBetaCallableRequestAdmissionAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'externalBetaCallableCandidatesWithProvidedEvidence',
  'externalBetaCallableRequestAdmissionReadyWithProvidedEvidence',
  'approvedPlanSnapshotRequired',
  'creditReservationRequired',
  'privateArtifactManifestRequired',
  'structuredToolEnvelopeRequired',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-agent-execution-gate.ts',
  'server/cli/ai-graphics-external-agent-execution-gate.ts',
  'scripts/validation/ai-graphics-external-agent-execution-gate-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.md',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.json',
  'server/tool-registry/index.ts',
  'package.json',
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

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function runGate(args = []) {
  const output = execFileSync('npm', ['run', '--silent', runScriptName, '--', ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  return JSON.parse(output)
}

function assertFalseBooleans(label, booleans) {
  for (const key of falseBooleanKeys) {
    if (booleans?.[key] !== false) {
      fail(`${label}_${key}_not_false`)
    }
  }
}

function assertTrueBooleans(label, booleans) {
  for (const key of trueBooleanKeys) {
    if (booleans?.[key] !== true) {
      fail(`${label}_${key}_not_true`)
    }
  }
}

function assertToolCoverage(label, tools) {
  if (!Array.isArray(tools)) {
    fail(`${label}_tools_not_array`)
    return
  }
  if (tools.length !== 21) fail(`${label}_tool_count_not_21`)
  for (const toolId of allTools) {
    if (!tools.some((tool) => tool.toolId === toolId || tool === toolId)) {
      fail(`${label}_missing_tool:${toolId}`)
    }
  }
}

function assertRuntimeRows(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_rows_not_array`)
    return
  }
  for (const row of rows) {
    if (row.executionAllowedNow !== false) fail(`${label}_${row.toolId}_execution_not_false`)
    if (row.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_${row.toolId}_gpu_runtime_should_start_not_false`)
    }
    if (!row.currentBlocker?.includes('fail_closed')) {
      fail(`${label}_${row.toolId}_missing_fail_closed_blocker`)
    }
    if (gpuTools.has(row.toolId) && row.gpuRequiredForRuntime !== true) {
      fail(`${label}_${row.toolId}_gpu_required_not_true`)
    }
    if (!gpuTools.has(row.toolId) && row.gpuRequiredForRuntime !== false) {
      fail(`${label}_${row.toolId}_gpu_required_not_false`)
    }
  }
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

const indexSource = read('server/tool-registry/index.ts')
if (!indexSource.includes("export * from './ai-graphics-external-agent-execution-gate'")) {
  fail('registry_export_missing')
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-execution-gate.md')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capability_count_not_12')
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.counts?.externalAgentExecutableNowTools !== 0) fail('docs_executable_now_not_0')
assertToolCoverage('docs', docs.tools)
assertRuntimeRows('docs', docs.tools)
assertTrueBooleans('docs', docs.booleans)
assertFalseBooleans('docs', docs.booleans)

for (const phrase of [
  'fail-closed',
  '21',
  'GPU startup as on-demand only',
  'exit code `2`',
  'agentCanExecuteToolsNow=false',
]) {
  if (!docsMd.includes(phrase)) fail(`docs_md_missing:${phrase}`)
}

for (const forbidden of [
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"externalAgentExecutionAllowedNow"\s*:\s*true/i,
  /"routeExecutionApprovedNow"\s*:\s*true/i,
  /"workerExecutionApprovedNow"\s*:\s*true/i,
  /"toolExecutionApprovedNow"\s*:\s*true/i,
  /"gpuRuntimeShouldStartNow"\s*:\s*true/i,
  /"gpuRuntimePerformed"\s*:\s*true/i,
  /"runtimeReadyNow"\s*:\s*true/i,
  /"externalBetaReadyNow"\s*:\s*true/i,
  /"productionReadyNow"\s*:\s*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  for (const file of [
    'server/tool-registry/ai-graphics-external-agent-execution-gate.ts',
    'server/cli/ai-graphics-external-agent-execution-gate.ts',
    'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
    'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.md',
  ]) {
    if (forbidden.test(read(file))) {
      fail(`forbidden_claim:${file}:${forbidden}`)
    }
  }
}

const missingSourceReport = runGate()
if (missingSourceReport.status !== 'missing_external_beta_callable_request_admission') {
  fail('missing_source_status_mismatch')
}
if (missingSourceReport.executionAllowedNow !== false) fail('missing_source_execution_not_false')
assertFalseBooleans('missing_source_report', missingSourceReport.booleans)

const acceptedSourceReport = runGate([
  '--external-beta-callable-request-admission-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.json',
])
if (acceptedSourceReport.decision !== decision) fail('accepted_report_decision_mismatch')
if (acceptedSourceReport.status !== acceptedStatus) fail('accepted_report_status_mismatch')
if (acceptedSourceReport.executionAllowedNow !== false) fail('accepted_report_execution_not_false')
if (acceptedSourceReport.readyForAnyExternalAgentExecutionNow !== false) {
  fail('accepted_report_ready_any_not_false')
}
if (acceptedSourceReport.externalBetaCallableCandidateToolsWithProvidedEvidence !== 21) {
  fail('accepted_report_candidate_tools_not_21')
}
if (acceptedSourceReport.externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence !== 1) {
  fail('accepted_report_request_admission_tools_not_1')
}
assertToolCoverage('accepted_report', acceptedSourceReport.toolRows)
assertRuntimeRows('accepted_report', acceptedSourceReport.toolRows)
assertTrueBooleans('accepted_report', acceptedSourceReport.booleans)
assertFalseBooleans('accepted_report', acceptedSourceReport.booleans)

const requireGo = spawnSync(
  'npm',
  [
    'run',
    '--silent',
    runScriptName,
    '--',
    '--external-beta-callable-request-admission-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.json',
    '--require-go',
  ],
  {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  },
)
if (requireGo.status !== 2) fail(`require_go_exit_not_2:${requireGo.status}`)
const requireGoReport = JSON.parse(requireGo.stdout)
if (requireGoReport.executionAllowedNow !== false) fail('require_go_execution_not_false')

if (git(['diff', '--name-only', '--', 'package-lock.json'])) {
  fail('package_lock_changed')
}
const stagedFiles = git(['diff', '--cached', '--name-only'])
if (stagedFiles.split('\n').filter(Boolean).some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_staged')
}
const generatedPathPattern = /(^|\/)(generated|renders?|browser-output|canvas-output|webgl-output|public-artifacts?)(\/|$)/i
if (stagedFiles.split('\n').filter(Boolean).some((file) => generatedPathPattern.test(file))) {
  fail('generated_output_staged')
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedSourceReport.status,
  toolsCovered: acceptedSourceReport.totalAiGraphicsTools,
  gpuRuntimeTargetedTools: acceptedSourceReport.gpuRuntimeTargetedTools,
  externalBetaCallableCandidateToolsWithProvidedEvidence:
    acceptedSourceReport.externalBetaCallableCandidateToolsWithProvidedEvidence,
  externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence:
    acceptedSourceReport.externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence,
  executionAllowedNow: acceptedSourceReport.executionAllowedNow,
  requireGoBlockedExitCode: requireGo.status,
  agentCanExecuteToolsNow: acceptedSourceReport.booleans.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: acceptedSourceReport.booleans.gpuRuntimeShouldStartNow,
  packageLockChanged: false,
}, null, 2))
