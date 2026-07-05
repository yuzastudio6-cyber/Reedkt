import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_controlled_dispatcher_dry_run_proof_passed_with_runtime_blocks'
const acceptedStatus =
  'controlled_dispatcher_dry_run_completed_all_21_no_tool_execution'
const sourceDecision =
  'ai_graphics_external_agent_mock_dispatcher_gate_proof_passed_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-agent-controlled-dispatcher-dry-run-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-controlled-dispatcher-dry-run-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof-diagnostics.mjs'

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

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  sourceDispatcherGateBlockedTools: 21,
  controlledDispatcherDryRunAttemptedTools: 21,
  controlledDispatcherDryRunCompletedTools: 21,
  dispatcherGatesPassedTools: 21,
  dispatcherHardGateBlocks: 0,
  dispatcherRouteOutputProducedTools: 21,
  aiGraphicsToolCallHandoffRouteTools: 21,
  inMemoryWorkerLeasesCreatedTools: 21,
  inMemoryWorkerLeasesReleasedTools: 21,
  toolRunResultsCreatedTools: 0,
  artifactRecordsCreatedTools: 0,
  qualityGateResultsCreatedTools: 0,
  gpuRuntimeTargetedTools: 8,
  gpuRuntimeShouldStartNowTools: 0,
  externalAgentControlledDryRunReadyTools: 21,
  externalAgentExecutableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueKeys = [
  'externalAgentControlledDispatcherDryRunProofPassed',
  'sourceMockDispatcherGateProofAccepted',
  'productionWorkerDispatcherBoundaryExercised',
  'dispatcherDryRunGatesPassed',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21ControlledDryRunDispatchesCompleted',
  'all21AiGraphicsHandoffRoutesCreated',
  'inMemoryWorkerLeasesCreatedAndReleased',
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
  'server/cli/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof.ts',
  'scripts/validation/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-dispatcher-dry-run-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-dispatcher-dry-run-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-mock-dispatcher-gate-proof.json',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-router.ts',
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

function checkToolList(label, list) {
  if (!Array.isArray(list)) {
    fail(`${label}_tools_not_array`)
    return
  }
  if (list.length !== tools.length) fail(`${label}_tools_count_mismatch`)
  for (const tool of tools) {
    if (!list.includes(tool)) fail(`${label}_missing_tool:${tool}`)
  }
}

function checkCapabilityList(label, list) {
  if (!Array.isArray(list)) {
    fail(`${label}_capabilities_not_array`)
    return
  }
  if (list.length !== capabilities.length) fail(`${label}_capabilities_count_mismatch`)
  for (const capability of capabilities) {
    if (!list.includes(capability)) fail(`${label}_missing_capability:${capability}`)
  }
}

function checkDryRunRows(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_dry_run_rows_not_array`)
    return
  }
  if (rows.length !== 21) fail(`${label}_dry_run_row_count_not_21`)
  for (const toolId of tools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_dry_run_row:${toolId}`)
      continue
    }
    if (!row.productionToolId) fail(`${label}_missing_production_tool_id:${toolId}`)
    if (!row.workerType) fail(`${label}_missing_worker_type:${toolId}`)
    if (!row.runtimeTarget) fail(`${label}_missing_runtime_target:${toolId}`)
    if (row.executionMode !== 'dry_run') fail(`${label}_execution_mode_mismatch:${toolId}`)
    if (row.dispatcherStatus !== 'completed') fail(`${label}_dispatcher_status_mismatch:${toolId}`)
    if (row.hardGateBlockCount !== 0) fail(`${label}_hard_gate_block_count_not_zero:${toolId}`)
    for (const key of [
      'inMemoryLeaseCreated',
      'inMemoryLeaseReleased',
      'dispatcherRouteOutputProduced',
      'routeOutputMockOnly',
      'aiGraphicsToolCallHandoffRoute',
    ]) {
      if (row[key] !== true) fail(`${label}_${toolId}_${key}_not_true`)
    }
    for (const key of [
      'liveWorkerDispatchPerformedNow',
      'toolExecutionPerformedNow',
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
    for (const required of [
      'job_created',
      'gates_started',
      'gates_passed',
      'job_claimed',
      'heartbeat',
      'job_started',
      'step_started',
      'step_completed',
      'job_completed',
    ]) {
      if (!events.includes(required)) fail(`${label}_${toolId}_missing_event:${required}`)
    }
    if (typeof row.futureHandler !== 'string' || !row.futureHandler.startsWith('ai_graphics_')) {
      fail(`${label}_${toolId}_future_handler_not_ai_graphics`)
    }
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-controlled-dispatcher-dry-run-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-controlled-dispatcher-dry-run-proof.md')
const source = json('docs/tool-intelligence/ai-graphics/external-agent-mock-dispatcher-gate-proof.json')
const packageJson = json('package.json')
const cliSource = read('server/cli/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof.ts')
const diagnosticSource = read('scripts/validation/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof-diagnostics.mjs')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.sourceEvidence?.mockDispatcherGateProof !==
  'docs/tool-intelligence/ai-graphics/external-agent-mock-dispatcher-gate-proof.json') {
  fail('docs_source_dispatcher_gate_path_mismatch')
}
if (docs.interfaces?.packageScript !== runScriptName) fail('docs_package_script_mismatch')
if (docs.interfaces?.diagnosticScript !== diagnosticScriptName) fail('docs_diagnostic_script_mismatch')
if (docs.interfaces?.dispatcherBoundary !== 'dispatchProductionWorkerJob') fail('docs_dispatcher_boundary_mismatch')
if (docs.interfaces?.routerBoundary !== 'routeProductionWorkerJob') fail('docs_router_boundary_mismatch')
if (docs.interfaces?.requiredExecutionMode !== 'dry_run') fail('docs_required_execution_mode_mismatch')
if (docs.interfaces?.requiredHandoffMode !== 'metadata_dry_run') fail('docs_required_handoff_mode_mismatch')
checkToolList('docs', docs.tools)
checkCapabilityList('docs', docs.capabilities)
checkCounts('docs', docs.counts)
checkBooleans('docs', docs.booleans)

if (source.decision !== sourceDecision) fail('source_decision_mismatch')
if (source.counts?.dispatcherGateBlockedTools !== 21) fail('source_dispatcher_gate_count_mismatch')
if (source.counts?.workerModeGateBlockedTools !== 21) fail('source_worker_mode_gate_count_mismatch')
if (source.counts?.dispatcherLeaseCreatedTools !== 0) fail('source_dispatcher_lease_count_not_zero')
if (source.counts?.dispatcherRouteOutputProducedTools !== 0) fail('source_route_output_count_not_zero')
if (source.booleans?.workerDispatchPerformed !== false) fail('source_worker_dispatch_not_false')
if (source.booleans?.toolExecutionPerformed !== false) fail('source_tool_execution_not_false')
if (source.booleans?.gpuRuntimeShouldStartNow !== false) fail('source_gpu_start_not_false')

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail('package_diagnostic_script_mismatch')

for (const required of [
  'dispatchProductionWorkerJob',
  'buildWorkerIdempotencyKey',
  'createProductionWorkerRuntimeState',
  "executionMode: 'dry_run'",
  "mode: 'metadata_dry_run'",
  'output.futureHandler.startsWith',
  'state.leases.some',
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
  'dispatchProductionWorkerJob',
  'routeProductionWorkerJob',
  'in-memory leases',
  'metadata_dry_run',
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

if (!scorecard.includes('AI Graphics External Agent Controlled Dispatcher Dry-Run Proof')) {
  fail('scorecard_missing_controlled_dispatcher_section')
}
if (!scorecard.includes(decision)) fail('scorecard_missing_controlled_dispatcher_decision')
if (!scorecard.includes('controlledDispatcherDryRunCompletedTools=21')) {
  fail('scorecard_missing_controlled_dispatcher_count')
}

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
checkDryRunRows('cli', cliReport.controlledDispatcherDryRunProofs)

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
  capabilitiesCovered: capabilities.length,
  controlledDispatcherDryRunCompletedTools:
    expectedCounts.controlledDispatcherDryRunCompletedTools,
  inMemoryWorkerLeasesCreatedTools:
    expectedCounts.inMemoryWorkerLeasesCreatedTools,
  inMemoryWorkerLeasesReleasedTools:
    expectedCounts.inMemoryWorkerLeasesReleasedTools,
  aiGraphicsToolCallHandoffRouteTools:
    expectedCounts.aiGraphicsToolCallHandoffRouteTools,
  toolExecutionPerformedTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
}, null, 2))
