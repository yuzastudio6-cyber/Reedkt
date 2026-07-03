import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks'
const status =
  'local_dev_runtime_inputs_required_before_eight_gpu_model_tools_execute'
const runScriptName =
  'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness-diagnostics.mjs'

const tools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  gpuModelToolsCovered: 8,
  localDevAdapterBranchInvokedTools: 8,
  localDevPrerequisiteCheckOnlyTools: 8,
  localRuntimeExecutionPerformedTools: 0,
  toolExecutionApprovedNowTools: 0,
  gpuRuntimeApprovedForScopedControlledToolCallTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  publicArtifactCreatedTools: 0,
  signedUrlCreatedTools: 0,
  runtimeReadyNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueKeys = [
  'externalAgentGpuModelLocalDevRuntimeExecutionHarnessPrepared',
  'controlledAdapterSourceAccepted',
  'controlledWorkerDispatchProofAccepted',
  'nativeGpuRuntimeProofCommandPlanAccepted',
  'localDevAdapterBranchInvokedForAll8',
  'all8GpuModelToolsCovered',
  'exactLocalRuntimePrerequisitesDocumented',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'committedRecordSkipSafe',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'privateLocalRuntimeAttemptRequested',
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteAll21ToolsNow',
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
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'modelWeightsDownloaded',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness.ts',
  'scripts/validation/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.md',
  'server/tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter.ts',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-controlled-worker-dispatch-proof.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-local-preflight.json',
  'package.json',
]

const forbiddenPatterns = [
  /"agentCanExecuteGpuModelToolsNow"\s*:\s*true/i,
  /"agentCanExecuteAll21ToolsNow"\s*:\s*true/i,
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"backendQueueSubmissionPerformed"\s*:\s*true/i,
  /"liveQueueWritePerformed"\s*:\s*true/i,
  /"workerExecutionPerformed"\s*:\s*true/i,
  /"workerEnqueuePerformed"\s*:\s*true/i,
  /"workerDispatchPerformed"\s*:\s*true/i,
  /"routeExecutionPerformed"\s*:\s*true/i,
  /"providerRuntimePerformed"\s*:\s*true/i,
  /"modelWeightsDownloaded"\s*:\s*true/i,
  /"mediaProcessingPerformed"\s*:\s*true/i,
  /"publicArtifactCreated"\s*:\s*true/i,
  /"signedUrlCreated"\s*:\s*true/i,
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
    maxBuffer: 120 * 1024 * 1024,
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

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const pkg = json('package.json')
if (pkg.scripts?.[runScriptName] !== runScriptCommand) {
  fail('run_script_command_mismatch')
}
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('diagnostic_script_command_mismatch')
}

const report = json('docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json')
if (report.decision !== decision) fail(`decision_mismatch:${report.decision}`)
if (report.status !== status) fail(`status_mismatch:${report.status}`)
checkCounts('record', report.counts)
checkBooleans('record', report.booleans)

if (report.sourceEvidence?.controlledAdapter?.decision !== 'ai_graphics_external_agent_gpu_model_controlled_adapter_executable_eight_on_demand_with_runtime_blocks') {
  fail('controlled_adapter_source_decision_mismatch')
}
if (report.localRuntimePolicy?.runMode !== 'explicit_local_dev_only') {
  fail('local_runtime_policy_mode_mismatch')
}
if (report.localRuntimePolicy?.committedRecordsMustRemainSkipSafe !== true) {
  fail('committed_record_not_skip_safe')
}
if (!String(report.interfaces?.privateLocalRuntimeAttemptCommand ?? '').includes('--attempt-local-runtime')) {
  fail('missing_private_runtime_attempt_command')
}
if (!String(report.interfaces?.privateLocalRuntimeAttemptCommand ?? '').includes('.local-artifacts/ai-graphics/gpu-model-local-dev-runtime')) {
  fail('private_runtime_attempt_command_not_local_artifact_only')
}

const rows = Array.isArray(report.gpuModelLocalDevRuntimeExecutionHarnessRows)
  ? report.gpuModelLocalDevRuntimeExecutionHarnessRows
  : []
if (rows.length !== 8) fail(`row_count_mismatch:${rows.length}`)
for (const tool of tools) {
  const row = rows.find((item) => item.toolId === tool)
  if (!row) {
    fail(`missing_tool_row:${tool}`)
    continue
  }
  if (row.adapterDecision !== 'ai_graphics_external_agent_gpu_model_controlled_adapter_executable_eight_on_demand_with_runtime_blocks') {
    fail(`adapter_decision_mismatch:${tool}`)
  }
  if (row.harnessMode !== 'local_dev_prerequisite_check_only') {
    fail(`harness_mode_mismatch:${tool}`)
  }
  if (row.controlledAdapterInvokedNow !== true) {
    fail(`adapter_not_invoked:${tool}`)
  }
  if (row.localRuntimeExecutionPerformed !== false) {
    fail(`runtime_executed_in_default_record:${tool}`)
  }
  if (row.toolExecutionApprovedNow !== false) fail(`tool_execution_approved:${tool}`)
  if (row.gpuRuntimeShouldStartNow !== false) fail(`gpu_started:${tool}`)
  if (row.publicArtifactCreated !== false) fail(`public_artifact_created:${tool}`)
  if (row.signedUrlCreated !== false) fail(`signed_url_created:${tool}`)
  if (!Array.isArray(row.localInputRequirements) || row.localInputRequirements.length === 0) {
    fail(`missing_local_input_requirements:${tool}`)
  }
  if (!row.localInputRequirements.some((entry) => entry.key === 'nativeCudaRuntime')) {
    fail(`missing_native_cuda_requirement:${tool}`)
  }
}

const liveOutput = JSON.parse(exec(`npm run --silent ${runScriptName}`))
if (liveOutput.decision !== decision) fail('live_output_decision_mismatch')
if (liveOutput.status !== status) fail('live_output_status_mismatch')
checkCounts('live_output', liveOutput.counts)
checkBooleans('live_output', liveOutput.booleans)

const source = [
  read('docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json'),
  read('docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.md'),
  read('server/cli/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness.ts'),
]
for (const [index, text] of source.entries()) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden_claim_${index}:${pattern}`)
  }
}

const packageLockChanged = exec('git diff --name-only -- package-lock.json').trim()
if (packageLockChanged) fail('package_lock_changed')

const trackedLocalArtifacts = exec('git ls-files .local-artifacts').trim()
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const changedFiles = exec('git diff --name-only').trim().split(/\r?\n/).filter(Boolean)
const generatedChanges = changedFiles.filter((file) => generatedArtifactPattern.test(file))
if (generatedChanges.length) {
  fail(`generated_artifact_paths_changed:${generatedChanges.join(',')}`)
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status,
  gpuModelToolsCovered: 8,
  localDevAdapterBranchInvokedTools: 8,
  localRuntimeExecutionPerformedTools: 0,
  toolExecutionApprovedNowTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  packageLockUnchanged: true,
}, null, 2))
