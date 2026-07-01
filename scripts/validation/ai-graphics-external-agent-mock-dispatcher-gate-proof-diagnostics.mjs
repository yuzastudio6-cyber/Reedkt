import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_mock_dispatcher_gate_proof_passed_with_runtime_blocks'
const acceptedStatus = 'mock_dispatcher_gate_blocked_all_21_before_worker_execution'
const sourceDecision =
  'ai_graphics_external_agent_mock_worker_dispatch_handoff_proof_passed_with_runtime_blocks'
const runScriptName = 'ai-graphics:external-agent-mock-dispatcher-gate-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-mock-dispatcher-gate-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-mock-dispatcher-gate-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-mock-dispatcher-gate-proof-diagnostics.mjs'

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

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  sourceMockDispatchHandoffPreparedTools: 21,
  dispatcherGateAttemptedTools: 21,
  dispatcherGateBlockedTools: 21,
  workerModeGateBlockedTools: 21,
  dispatcherLeaseCreatedTools: 0,
  dispatcherRouteOutputProducedTools: 0,
  workerDispatchPerformedTools: 0,
  toolExecutionPerformedTools: 0,
  artifactRecordsCreatedTools: 0,
  qualityGateResultsCreatedTools: 0,
  gpuRuntimeTargetedTools: 8,
  gpuRuntimeShouldStartNowTools: 0,
  externalAgentExecutableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueKeys = [
  'externalAgentMockDispatcherGateProofPassed',
  'sourceMockWorkerDispatchHandoffProofAccepted',
  'productionWorkerDispatcherBoundaryExercised',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21DispatcherGateBlocksConfirmed',
  'workerModeGateBlockedDispatch',
  'dispatcherBlockedBeforeLease',
  'dispatcherBlockedBeforeRouteOutput',
  'dispatcherBlockedBeforeToolExecution',
  'allToolRunResultsEmpty',
  'allArtifactRecordsEmpty',
  'allQualityGateResultsEmpty',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerExecutionApprovedNow',
  'workerEnqueueApprovedNow',
  'workerDispatchApprovedNow',
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
  'workerLeaseCreated',
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

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /liveQueueWriteApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /workerLeaseCreated["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-mock-dispatcher-gate-proof.ts',
  'scripts/validation/ai-graphics-external-agent-mock-dispatcher-gate-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-mock-dispatcher-gate-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-mock-dispatcher-gate-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-mock-worker-dispatch-handoff-proof.json',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-gates.ts',
  'server/workers/production/production-worker-lease-manager.ts',
  'server/tool-registry/ai-graphics-tool-call-readiness.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const changedGeneratedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

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
    maxBuffer: 40 * 1024 * 1024,
  })
}

function checkCounts(label, counts) {
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts?.[key] !== value) {
      fail(`${label}_count_mismatch:${key}:expected_${value}:got_${counts?.[key]}`)
    }
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

function checkDispatcherRows(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_dispatcher_rows_not_array`)
    return
  }
  if (rows.length !== 21) fail(`${label}_dispatcher_row_count_not_21`)
  for (const toolId of tools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_dispatcher_row:${toolId}`)
      continue
    }
    if (!row.productionToolId) fail(`${label}_missing_production_tool_id:${toolId}`)
    if (!row.workerType) fail(`${label}_missing_worker_type:${toolId}`)
    if (!row.runtimeTarget) fail(`${label}_missing_runtime_target:${toolId}`)
    if (row.executionMode !== 'production_blocked') fail(`${label}_execution_mode_mismatch:${toolId}`)
    if (row.dispatcherStatus !== 'blocked') fail(`${label}_dispatcher_status_mismatch:${toolId}`)
    if (row.requiredBlockedGate !== 'worker_mode') fail(`${label}_required_blocked_gate_mismatch:${toolId}`)
    if (!Array.isArray(row.failedGateNames) || !row.failedGateNames.includes('worker_mode')) {
      fail(`${label}_missing_worker_mode_gate:${toolId}`)
    }
    for (const key of [
      'blockedBeforeLease',
      'blockedBeforeRouteOutput',
      'blockedBeforeToolExecution',
      'blockedBeforeGpuRuntime',
    ]) {
      if (row[key] !== true) fail(`${label}_${toolId}_${key}_not_true`)
    }
    for (const key of [
      'workerLeaseCreated',
      'routeOutputProduced',
      'gpuRuntimeShouldStartNow',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
    for (const key of [
      'toolRunResultsCreated',
      'artifactRecordsCreated',
      'qualityGateResultsCreated',
    ]) {
      if (row[key] !== 0) fail(`${label}_${toolId}_${key}_not_zero`)
    }
    const events = Array.isArray(row.eventNames) ? row.eventNames : []
    for (const required of ['job_created', 'gates_started', 'gates_failed', 'job_blocked']) {
      if (!events.includes(required)) fail(`${label}_${toolId}_missing_event:${required}`)
    }
    for (const forbidden of [
      'gates_passed',
      'job_claimed',
      'heartbeat',
      'job_started',
      'step_started',
      'step_completed',
      'job_completed',
    ]) {
      if (events.includes(forbidden)) fail(`${label}_${toolId}_forbidden_event:${forbidden}`)
    }
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-mock-dispatcher-gate-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-mock-dispatcher-gate-proof.md')
const source = json('docs/tool-intelligence/ai-graphics/external-agent-mock-worker-dispatch-handoff-proof.json')
const packageJson = json('package.json')
const cliSource = read('server/cli/ai-graphics-external-agent-mock-dispatcher-gate-proof.ts')
const diagnosticSource = read('scripts/validation/ai-graphics-external-agent-mock-dispatcher-gate-proof-diagnostics.mjs')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.sourceEvidence?.mockWorkerDispatchHandoffProof !==
  'docs/tool-intelligence/ai-graphics/external-agent-mock-worker-dispatch-handoff-proof.json') {
  fail('docs_source_handoff_path_mismatch')
}
if (docs.interfaces?.packageScript !== runScriptName) fail('docs_package_script_mismatch')
if (docs.interfaces?.diagnosticScript !== diagnosticScriptName) fail('docs_diagnostic_script_mismatch')
if (docs.interfaces?.dispatcherBoundary !== 'dispatchProductionWorkerJob') fail('docs_dispatcher_boundary_mismatch')
if (docs.interfaces?.requiredExecutionMode !== 'production_blocked') fail('docs_required_execution_mode_mismatch')
if (docs.interfaces?.requiredBlockedGate !== 'worker_mode') fail('docs_required_blocked_gate_mismatch')
checkCounts('docs', docs.counts)
checkBooleans('docs', docs.booleans)
checkDispatcherRows('docs', docs.dispatcherGateProofs)

if (source.decision !== sourceDecision) fail('source_decision_mismatch')
if (source.counts?.mockDispatchHandoffPreparedTools !== 21) fail('source_handoff_count_mismatch')
if (source.booleans?.workerDispatchPerformed !== false) fail('source_worker_dispatch_not_false')
if (source.booleans?.toolExecutionPerformed !== false) fail('source_tool_execution_not_false')
if (source.booleans?.gpuRuntimeShouldStartNow !== false) fail('source_gpu_start_not_false')

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail('package_diagnostic_script_mismatch')

for (const required of [
  'dispatchProductionWorkerJob',
  'buildWorkerIdempotencyKey',
  'createProductionWorkerRuntimeState',
  "executionMode: 'production_blocked'",
  "failedGateNames.includes('worker_mode')",
  'state.leases.length === 0',
  'result.output === undefined',
  'result.toolRunResults.length === 0',
  'result.artifactRecords.length === 0',
  'result.qualityGateResults.length === 0',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!cliSource.includes(required)) fail(`cli_missing_required_text:${required}`)
}

if (!diagnosticSource.includes('forbiddenDocPatterns')) fail('diagnostic_missing_forbidden_patterns')
if (!diagnosticSource.includes('changedGeneratedArtifactPattern')) fail('diagnostic_missing_generated_artifact_scan')

for (const required of [
  decision,
  acceptedStatus,
  'worker_mode',
  'production_blocked',
  'dispatchProductionWorkerJob',
  'blocked before lease',
  'gpuRuntimeShouldStartNow=false',
  'agentCanExecuteToolsNow=false',
]) {
  if (!docsMd.includes(required)) fail(`docs_md_missing:${required}`)
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(JSON.stringify(docs)) || pattern.test(docsMd)) {
    fail(`forbidden_doc_claim:${pattern}`)
  }
}

if (!scorecard.includes('AI Graphics External Agent Mock Dispatcher Gate Proof')) {
  fail('scorecard_missing_dispatcher_gate_section')
}
if (!scorecard.includes(decision)) fail('scorecard_missing_dispatcher_gate_decision')
if (!scorecard.includes('dispatcherGateBlockedTools=21')) fail('scorecard_missing_dispatcher_gate_count')

let cliReport = {}
try {
  cliReport = JSON.parse(exec(`npm run --silent ${runScriptName}`))
} catch (error) {
  fail(`cli_report_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
checkCounts('cli', cliReport.counts)
checkBooleans('cli', cliReport.booleans)
checkDispatcherRows('cli', cliReport.dispatcherGateProofs)

for (const key of Object.keys(expectedCounts)) {
  if (docs.counts?.[key] !== cliReport.counts?.[key]) {
    fail(`docs_cli_count_mismatch:${key}`)
  }
}
for (const key of [...trueKeys, ...falseKeys]) {
  if (docs.booleans?.[key] !== cliReport.booleans?.[key]) {
    fail(`docs_cli_boolean_mismatch:${key}`)
  }
}

let packageLockDiff = ''
try {
  packageLockDiff = exec('git diff -- package-lock.json')
} catch (error) {
  fail(`package_lock_diff_failed:${error.message}`)
}
if (packageLockDiff.trim()) fail('package_lock_changed')

let changedFiles = []
try {
  changedFiles = exec('git diff --name-only HEAD').trim().split('\n').filter(Boolean)
} catch (error) {
  fail(`changed_files_failed:${error.message}`)
}
for (const file of changedFiles) {
  if (changedGeneratedArtifactPattern.test(file)) fail(`generated_or_local_artifact_changed:${file}`)
}

let trackedLocalArtifacts = ''
try {
  trackedLocalArtifacts = exec('git ls-files .local-artifacts')
} catch (error) {
  fail(`tracked_local_artifacts_failed:${error.message}`)
}
if (trackedLocalArtifacts.trim()) fail('local_artifacts_tracked')

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: tools.length,
  dispatcherGateBlockedTools: expectedCounts.dispatcherGateBlockedTools,
  workerModeGateBlockedTools: expectedCounts.workerModeGateBlockedTools,
  workerLeaseCreatedTools: 0,
  toolExecutionPerformedTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
}, null, 2))
