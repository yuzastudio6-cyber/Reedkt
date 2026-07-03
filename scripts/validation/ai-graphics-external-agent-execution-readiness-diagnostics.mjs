import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_execution_readiness_all21_evaluated_with_gpu_model_blocks'
const status =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_gpu_model_blocked_pending_private_proof'
const runScriptName = 'ai-graphics:external-agent-execution-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-execution-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-execution-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-execution-readiness-diagnostics.mjs'

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
  'server/cli/ai-graphics-external-agent-execution-readiness.ts',
  'scripts/validation/ai-graphics-external-agent-execution-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md',
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  'package.json',
]

const forbiddenPatterns = [
  /agentCanExecuteAll21ToolsNow["`:\s=]+true/i,
  /agentCanExecuteGpuModelToolsNow["`:\s=]+true/i,
  /toolExecutionApprovedForAll21ToolsNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /modelInferencePerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
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
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 160 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
}

function checkPackageJson() {
  const pkg = json('package.json')
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
      if (
        JSON.stringify(pkg[section] ?? {}) !==
        JSON.stringify(headPkg[section] ?? {})
      ) {
        fail(`package_dependency_section_changed:${section}`)
      }
    }
  } catch (error) {
    fail(`package_dependency_comparison_failed:${error.message}`)
  }
}

function expectedGroup(toolId) {
  if (cpuStaticTools.includes(toolId)) return 'cpu_static'
  if (browserRuntimeTools.includes(toolId)) return 'browser_runtime'
  if (gpuModelTools.includes(toolId)) return 'gpu_model'
  return null
}

function checkReport(label, report) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== status) fail(`${label}_status_mismatch`)
  const counts = report.counts ?? {}
  const expectedCounts = {
    totalToolsCovered: 21,
    agentCallableTools: 21,
    agentExecutableTools: 13,
    cpuStaticExecutableTools: 6,
    browserRuntimeExecutableTools: 7,
    gpuToolsWithValidRuntimeProof: 0,
    gpuModelBlockedWithReasonTools: 8,
    blockedWithReasonTools: 8,
    failedWithDiagnosticsTools: 0,
    gpuRuntimeShouldStartNowTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
    workerDispatchPerformedTools: 0,
    providerRuntimePerformedTools: 0,
    runtimeReadyNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) fail(`${label}_count_mismatch:${key}:${counts[key]}`)
  }

  const booleans = report.booleans ?? {}
  for (const key of [
    'externalAgentExecutionReadinessCompleted',
    'all21ToolsCovered',
    'agentCanSubmitControlledToolRequests',
    'agentCallableToolsReady',
    'all13NonGpuControlledAdapterOutputsValidated',
    'all8GpuModelToolsEvaluated',
    'gpuModelToolsBlockedUntilPrerequisites',
    'strictCallableExecutableBlockedFailedContractCreated',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'agentCanSelectForPlanning',
    'agentCanExecuteToolsNow',
    'agentCanExecute13ControlledToolsNow',
    'routeExecutionApprovedNow',
    'toolExecutionApprovedFor13ControlledToolsNow',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'gpuRuntimeShouldStartNow',
    'agentCanExecuteAll21ToolsNow',
    'agentCanExecuteGpuModelToolsNow',
    'toolExecutionApprovedForGpuModelToolsNow',
    'toolExecutionApprovedForAll21ToolsNow',
    'workerExecutionApprovedNow',
    'workerExecutionPerformed',
    'workerDispatchPerformed',
    'providerRuntimeApprovedNow',
    'providerRuntimePerformed',
    'browserWebglCanvasRuntimeApprovedNow',
    'gpuRuntimeApprovedNow',
    'gpuRuntimePerformed',
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
  ]) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }

  const rows = Array.isArray(report.toolReadinessRows)
    ? report.toolReadinessRows
    : []
  if (rows.length !== 21) {
    fail(`${label}_row_count_mismatch:${rows.length}`)
    return
  }
  for (const toolId of allTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_tool:${toolId}`)
      continue
    }
    if (row.group !== expectedGroup(toolId)) fail(`${label}_${toolId}_group_mismatch`)
    if (row.callable !== true) fail(`${label}_${toolId}_not_callable`)
    if (row.routeCallable !== true) fail(`${label}_${toolId}_route_not_callable`)
    if (row.adapterReachable !== true) fail(`${label}_${toolId}_adapter_not_reachable`)
    for (const key of [
      'gpuRuntimeShouldStartNow',
      'publicArtifactCreated',
      'signedUrlCreated',
      'workerDispatchPerformed',
      'providerRuntimePerformed',
      'runtimeReadyNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
    if (gpuModelTools.includes(toolId)) {
      if (row.readinessState !== 'blocked_with_reason') {
        fail(`${label}_${toolId}_gpu_state_not_blocked:${row.readinessState}`)
      }
      if (row.executable !== false || row.executionPassed !== false) {
        fail(`${label}_${toolId}_gpu_claimed_executable`)
      }
      if (!String(row.blockingPrerequisite ?? '').includes('approved native CUDA host')) {
        fail(`${label}_${toolId}_missing_cuda_blocker`)
      }
      if (!String(row.nextExactCommand ?? '').includes('--attempt-local-runtime')) {
        fail(`${label}_${toolId}_missing_gpu_next_command`)
      }
    } else {
      if (row.readinessState !== 'executable') {
        fail(`${label}_${toolId}_non_gpu_state_not_executable:${row.readinessState}`)
      }
      if (row.executable !== true || row.executionPassed !== true) {
        fail(`${label}_${toolId}_non_gpu_not_executable`)
      }
      if (!row.outputSha256 || row.outputSha256.length !== 64) {
        fail(`${label}_${toolId}_missing_output_hash`)
      }
    }
  }
}

for (const file of requiredFiles) read(file)
checkPackageJson()

const docs = json(
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json',
)
const markdown = read(
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md',
)
const routeSmoke = json(
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
)
const gpuHarness = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
)
const executionGate = json(
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
)

checkReport('docs', docs)
const live = JSON.parse(exec(`npm run --silent ${runScriptName}`))
checkReport('live', live)

if (routeSmoke.counts?.controlledRouteAdapterExecutedTools !== 13) {
  fail('route_smoke_executed_count_not_13')
}
if (routeSmoke.counts?.gpuModelRuntimeProofRequiredTools !== 8) {
  fail('route_smoke_gpu_proof_required_not_8')
}
if (gpuHarness.counts?.localRuntimeExecutionPerformedTools !== 0) {
  fail('gpu_harness_default_executed_runtime')
}
if (gpuHarness.counts?.gpuRuntimeShouldStartNowTools !== 0) {
  fail('gpu_harness_default_started_gpu')
}
if (executionGate.counts?.externalAgentExecutableNowTools !== 13) {
  fail('execution_gate_executable_now_not_13')
}
if (executionGate.booleans?.agentCanExecuteAll21ToolsNow !== false) {
  fail('execution_gate_claims_all21_execution')
}

for (const toolId of allTools) {
  if (!JSON.stringify(docs).includes(`"${toolId}"`)) fail(`docs_missing_tool:${toolId}`)
  if (!markdown.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}
for (const phrase of [
  'callable',
  'executable',
  'blocked_with_reason',
  'failed_with_diagnostics',
  'GPU runtime is on-demand only',
  '13 tools execute controlled local adapters now',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_phrase:${phrase}`)
}

for (const pattern of forbiddenPatterns) {
  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json',
    'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md',
  ]) {
    if (pattern.test(read(file))) fail(`forbidden_claim:${file}:${pattern}`)
  }
}

try {
  exec('git diff --quiet -- package-lock.json')
} catch {
  fail('package_lock_changed')
}

const trackedLocalArtifacts = exec('git ls-files .local-artifacts')
if (trackedLocalArtifacts.trim()) fail('local_artifacts_tracked')

const changedFiles = [
  ...exec('git diff --name-only HEAD').split('\n'),
  ...exec('git ls-files --others --exclude-standard').split('\n'),
].filter(Boolean)
for (const file of changedFiles) {
  if (file === 'package-lock.json') fail('package_lock_changed_in_diff')
  if (generatedArtifactPattern.test(file)) {
    fail(`generated_artifact_path_changed:${file}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status,
  totalToolsCovered: docs.counts.totalToolsCovered,
  agentCallableTools: docs.counts.agentCallableTools,
  agentExecutableTools: docs.counts.agentExecutableTools,
  gpuToolsWithValidRuntimeProof: docs.counts.gpuToolsWithValidRuntimeProof,
  blockedWithReasonTools: docs.counts.blockedWithReasonTools,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
}, null, 2))
