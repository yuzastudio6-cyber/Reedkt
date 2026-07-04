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

const sourceImageRequiredTools = new Set([
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const toolSpecificFlagByTool = {
  sam2: '--sam2-checkpoint',
  birefnet: '--birefnet-model',
  real_esrgan: '--real-esrgan-model',
  rembg: '--rembg-model',
  transparent_background: '--transparent-background-checkpoint',
}

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
  'scopedGpuModelToolSelectionSupported',
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
  'privateLocalProofResultWriteSupported',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'privateLocalRuntimeAttemptRequested',
  'privateLocalProofResultWrittenNow',
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
  'server/workers/ai-graphics-runtime-script-runner.ts',
  'server/workers/model-runtime-foundation/ai-graphics-foundation-execution-runner.ts',
  'server/workers/masks/kornia-mask-refinement-adapter.ts',
  'server/workers/masks/sam2-execution-runner.ts',
  'server/workers/masks/birefnet-execution-runner.ts',
  'server/workers/enhancement/real-esrgan-execution-runner.ts',
  'server/workers/masks/rembg-adapter.ts',
  'server/workers/masks/transparent-background-adapter.ts',
  'docker/prod/model-runtime-foundation/foundation_local.py',
  'docker/prod/kornia-runtime/kornia_local.py',
  'docker/prod/sam2-runtime/sam2_runtime_local.py',
  'docker/prod/birefnet-runtime/birefnet_local.py',
  'docker/prod/real-esrgan-runtime/real_esrgan_local.py',
  'docker/prod/rembg-runtime/rembg_local.py',
  'docker/prod/transparent-background-runtime/transparent_background_local.py',
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
if (report.localRuntimePolicy?.hostPythonBackendSupported !== true) {
  fail('host_python_backend_not_supported')
}
if (report.localRuntimePolicy?.dockerContainerBackendSupported !== true) {
  fail('docker_container_backend_not_supported')
}
if (report.localRuntimePolicy?.dockerContainerBackendRequiresRuntimeImage !== true) {
  fail('docker_container_runtime_image_not_required')
}
if (report.localRuntimePolicy?.dockerContainerBackendRequiresScopedGpuAttachment !== true) {
  fail('docker_container_scoped_gpu_attachment_not_required')
}
if (report.localRuntimePolicy?.privateInputPreflightBeforeGpuAttachment !== true) {
  fail('private_input_preflight_before_gpu_attachment_not_recorded')
}
if (report.localRuntimePolicy?.missingPrivateInputsBlockBeforeGpuStartup !== true) {
  fail('missing_private_inputs_do_not_block_before_gpu_startup')
}
if (report.localRuntimePolicy?.dockerContainerBackendAutoMountsPrivateRuntimePaths !== true) {
  fail('docker_container_private_runtime_path_mounts_not_recorded')
}
if (report.localRuntimePolicy?.dockerContainerBackendMountsSourceAndModelPathsReadOnly !== true) {
  fail('docker_container_readonly_input_model_mounts_not_recorded')
}
if (report.localRuntimePolicy?.dockerContainerBackendMountsOutputPathsReadWrite !== true) {
  fail('docker_container_readwrite_output_mounts_not_recorded')
}
for (const requiredProofPolicy of [
  'runtimeProofOutputValidatedBeforeCompleted',
  'runtimeProofOutputMustDeclareOkTrue',
  'runtimeProofOutputMustMatchExpectedToolId',
  'runtimeProofOutputMustProveCudaOrCudaExecutionProvider',
  'runtimeProofOutputMustProveNoModelDownload',
  'runtimeProofOutputMustProveNoProviderRuntime',
  'runtimeProofOutputMustProveNoPublicArtifact',
  'runtimeProofOutputMustProveNoSignedUrl',
]) {
  if (report.localRuntimePolicy?.[requiredProofPolicy] !== true) {
    fail(`runtime_proof_policy_not_recorded:${requiredProofPolicy}`)
  }
}
if (report.localRuntimePolicy?.privateLocalProofResultWriteSupported !== true) {
  fail('private_local_proof_result_write_not_supported')
}
if (report.localRuntimePolicy?.privateLocalProofResultWrittenNow !== false) {
  fail('private_local_proof_result_written_in_committed_record')
}
if (!String(report.localRuntimePolicy?.privateLocalProofResultWritePath ?? '').includes('.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
  fail('private_local_proof_result_path_not_local_artifact')
}

const runtimeRunnerSource = read('server/workers/ai-graphics-runtime-script-runner.ts')
for (const requiredSnippet of [
  'AiGraphicsRuntimeContainerBindMount',
  'AiGraphicsRuntimeProofExpectation',
  'assertAiGraphicsRuntimeProofOutput',
  'buildAiGraphicsRuntimeContainerBindMounts',
  'normalizeContainerBindMounts',
  'containerBindMountPath cannot be the filesystem root',
  'AI graphics runtime proof output must include ok=true',
  'AI graphics runtime proof output toolId mismatch',
  'modelDownloadedExternally',
  'providerRuntimePerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (!runtimeRunnerSource.includes(requiredSnippet)) {
    fail(`runtime_runner_missing_private_bind_mount_support:${requiredSnippet}`)
  }
}

const maskExecutionTypes = read('server/workers/masks/mask-execution-types.ts')
for (const requiredToken of [
  'outputJsonPath?: string',
  'outputJsonSizeBytes?: number',
  'outputJsonSha256?: string',
]) {
  if (!maskExecutionTypes.includes(requiredToken)) {
    fail(`mask_execution_result_missing_runtime_output_token:${requiredToken}`)
  }
}

const enhancementExecutionTypes = read(
  'server/workers/enhancement/enhancement-execution-types.ts',
)
for (const requiredToken of [
  'outputJsonPath?: string',
  'outputJsonSizeBytes?: number',
  'outputJsonSha256?: string',
]) {
  if (!enhancementExecutionTypes.includes(requiredToken)) {
    fail(`enhancement_execution_result_missing_runtime_output_token:${requiredToken}`)
  }
}

for (const workerFile of [
  'server/workers/model-runtime-foundation/ai-graphics-foundation-execution-runner.ts',
  'server/workers/masks/kornia-mask-refinement-adapter.ts',
  'server/workers/masks/sam2-execution-runner.ts',
  'server/workers/masks/birefnet-execution-runner.ts',
  'server/workers/enhancement/real-esrgan-execution-runner.ts',
  'server/workers/masks/rembg-adapter.ts',
  'server/workers/masks/transparent-background-adapter.ts',
]) {
  const source = read(workerFile)
  if (!source.includes('buildAiGraphicsRuntimeContainerBindMounts')) {
    fail(`worker_missing_private_bind_mount_builder:${workerFile}`)
  }
  if (!source.includes('containerBindMounts')) {
    fail(`worker_missing_private_bind_mounts:${workerFile}`)
  }
  if (!source.includes('proofExpectation')) {
    fail(`worker_missing_runtime_proof_expectation:${workerFile}`)
  }
  if (!source.includes('outputJsonPath: runtimeResult.outputJsonPath')) {
    fail(`worker_missing_runtime_output_json_path:${workerFile}`)
  }
  if (!source.includes('outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes')) {
    fail(`worker_missing_runtime_output_json_size:${workerFile}`)
  }
  if (!source.includes('outputJsonSha256: runtimeResult.outputJsonSha256')) {
    fail(`worker_missing_runtime_output_json_sha256:${workerFile}`)
  }
  for (const requiredProofToken of [
    'expectedToolId',
    'requireNoModelDownload: true',
    'requireNoProviderRuntime: true',
    'requireNoPublicArtifact: true',
    'requireNoSignedUrl: true',
  ]) {
    if (!source.includes(requiredProofToken)) {
      fail(`worker_missing_runtime_proof_token:${workerFile}:${requiredProofToken}`)
    }
  }
}

const controlledAdapterSource = read(
  'server/tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter.ts',
)
for (const requiredToken of [
  'outputJsonPath: result.outputJsonPath ?? null',
  'outputJsonSizeBytes: result.outputJsonSizeBytes ?? null',
  'outputJsonSha256: result.outputJsonSha256 ?? null',
]) {
  if (!controlledAdapterSource.includes(requiredToken)) {
    fail(`controlled_adapter_summary_missing_runtime_output_token:${requiredToken}`)
  }
}

const runtimeProofFilesByTool = {
  torch_torchvision: 'docker/prod/model-runtime-foundation/foundation_local.py',
  transformers: 'docker/prod/model-runtime-foundation/foundation_local.py',
  sam2: 'docker/prod/sam2-runtime/sam2_runtime_local.py',
  birefnet: 'docker/prod/birefnet-runtime/birefnet_local.py',
  real_esrgan: 'docker/prod/real-esrgan-runtime/real_esrgan_local.py',
  kornia: 'docker/prod/kornia-runtime/kornia_local.py',
  rembg: 'docker/prod/rembg-runtime/rembg_local.py',
  transparent_background: 'docker/prod/transparent-background-runtime/transparent_background_local.py',
}

for (const [tool, file] of Object.entries(runtimeProofFilesByTool)) {
  const source = read(file)
  if (!source.includes('"ok": True')) {
    fail(`runtime_script_missing_ok_true:${tool}`)
  }
  if (tool === 'torch_torchvision' || tool === 'transformers') {
    if (!source.includes('"toolId": "')) {
      fail(`runtime_script_missing_tool_id:${tool}`)
    }
  } else if (!source.includes(`"toolId": "${tool}"`)) {
    fail(`runtime_script_missing_tool_id:${tool}`)
  }
  if (tool === 'rembg') {
    if (!source.includes('"cudaExecutionProviderAvailable": True')) {
      fail('runtime_script_missing_rembg_cuda_provider_proof')
    }
  } else if (!source.includes('"cudaAvailable": True')) {
    fail(`runtime_script_missing_cuda_proof:${tool}`)
  }
  for (const requiredRuntimeFlag of [
    '"modelDownloadedExternally": False',
    '"providerRuntimePerformed": False',
    '"publicArtifactCreated": False',
    '"signedUrlCreated": False',
  ]) {
    if (!source.includes(requiredRuntimeFlag)) {
      fail(`runtime_script_missing_boundary_flag:${tool}:${requiredRuntimeFlag}`)
    }
  }
}

const sam2RunnerSource = read('server/workers/masks/sam2-execution-runner.ts')
for (const requiredSam2Token of [
  "sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]",
  'sam2_source_frame_missing',
  "'--source-image-path'",
  "APPROVED_PRIVATE_SOURCE_FRAME_ENABLED: 'true'",
  "REAL_MEDIA_INPUT_ENABLED: 'false'",
  'privateSourceFrameUsed: true',
]) {
  if (!sam2RunnerSource.includes(requiredSam2Token)) {
    fail(`sam2_runner_missing_private_source_frame_token:${requiredSam2Token}`)
  }
}
if (sam2RunnerSource.includes('generatedFixtureOnly: true')) {
  fail('sam2_runner_still_claims_generated_fixture_only')
}

const sam2RuntimeSource = read('docker/prod/sam2-runtime/sam2_runtime_local.py')
for (const requiredSam2RuntimeToken of [
  'parser.add_argument("--source-image-path", required=True)',
  'APPROVED_PRIVATE_SOURCE_FRAME_ENABLED',
  'create_source_frame_sequence',
  'privateSourceFrameUsed',
  'broadRealMediaInputEnabled',
]) {
  if (!sam2RuntimeSource.includes(requiredSam2RuntimeToken)) {
    fail(`sam2_runtime_missing_private_source_frame_token:${requiredSam2RuntimeToken}`)
  }
}
if (sam2RuntimeSource.includes('create_fixture_frames')) {
  fail('sam2_runtime_still_uses_generated_fixture_frame_builder')
}
if (!String(report.interfaces?.privateLocalRuntimeAttemptCommand ?? '').includes('--attempt-local-runtime')) {
  fail('missing_private_runtime_attempt_command')
}
if (!String(report.interfaces?.privateLocalRuntimeAttemptCommand ?? '').includes('--tool <toolId>')) {
  fail('private_runtime_attempt_command_not_scoped_to_tool')
}
if (!String(report.interfaces?.privateLocalRuntimeAttemptCommand ?? '').includes('.local-artifacts/ai-graphics/gpu-model-local-dev-runtime')) {
  fail('private_runtime_attempt_command_not_local_artifact_only')
}
if (!String(report.interfaces?.privateLocalRuntimeAttemptCommand ?? '').includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
  fail('private_runtime_attempt_command_missing_result_out')
}
if (!String(report.interfaces?.privateContainerRuntimeAttemptCommand ?? '').includes('--runtime-backend docker_container')) {
  fail('missing_private_container_runtime_backend_command')
}
if (!String(report.interfaces?.privateContainerRuntimeAttemptCommand ?? '').includes('--runtime-container-image')) {
  fail('missing_private_container_runtime_image_command')
}
if (!String(report.interfaces?.privateContainerRuntimeAttemptCommand ?? '').includes('reeditpro/ai-graphics-gpu-worker:proof-local')) {
  fail('private_container_runtime_command_not_canonical_image')
}
if (!String(report.interfaces?.privateContainerRuntimeAttemptCommand ?? '').includes('--runtime-container-platform')) {
  fail('missing_private_container_runtime_platform_command')
}
if (!String(report.interfaces?.privateContainerRuntimeAttemptCommand ?? '').includes('.local-artifacts/ai-graphics/gpu-model-local-dev-runtime')) {
  fail('private_container_runtime_command_not_local_artifact_only')
}
if (!String(report.interfaces?.privateContainerRuntimeAttemptCommand ?? '').includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
  fail('private_container_runtime_command_missing_result_out')
}
if (!String(report.interfaces?.privateScopedRuntimeAttemptExamples?.kornia ?? '').includes('--tool kornia')) {
  fail('missing_scoped_kornia_runtime_attempt_example')
}
if (!String(report.interfaces?.privateScopedRuntimeAttemptExamples?.sam2 ?? '').includes('--tool sam2')) {
  fail('missing_scoped_sam2_runtime_attempt_example')
}
if (!String(report.interfaces?.privateScopedRuntimeAttemptExamples?.korniaContainer ?? '').includes('--runtime-backend docker_container')) {
  fail('missing_scoped_kornia_container_runtime_attempt_example')
}
if (!String(report.interfaces?.privateScopedRuntimeAttemptExamples?.korniaContainer ?? '').includes('--tool kornia')) {
  fail('scoped_kornia_container_runtime_attempt_not_scoped')
}
if (!String(report.interfaces?.privateScopedRuntimeAttemptExamples?.korniaContainer ?? '').includes('reeditpro/ai-graphics-gpu-worker:proof-local')) {
  fail('scoped_kornia_container_runtime_attempt_not_canonical_image')
}

const hostCommandsByTool = report.interfaces?.privateRuntimeAttemptCommandsByTool ?? {}
const containerCommandsByTool =
  report.interfaces?.privateContainerRuntimeAttemptCommandsByTool ?? {}
for (const tool of tools) {
  const hostCommand = String(hostCommandsByTool[tool] ?? '')
  const containerCommand = String(containerCommandsByTool[tool] ?? '')
  if (!hostCommand.includes(`--tool ${tool}`)) {
    fail(`missing_exact_host_runtime_command:${tool}`)
  }
  if (!containerCommand.includes(`--tool ${tool}`)) {
    fail(`missing_exact_container_runtime_command:${tool}`)
  }
  if (!hostCommand.includes('--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>')) {
    fail(`host_runtime_command_missing_local_output:${tool}`)
  }
  if (!hostCommand.includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
    fail(`host_runtime_command_missing_result_out:${tool}`)
  }
  if (!containerCommand.includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
    fail(`container_runtime_command_missing_result_out:${tool}`)
  }
  if (!containerCommand.includes('--runtime-backend docker_container')) {
    fail(`container_runtime_command_missing_backend:${tool}`)
  }
  if (!containerCommand.includes('reeditpro/ai-graphics-gpu-worker:proof-local')) {
    fail(`container_runtime_command_missing_canonical_image:${tool}`)
  }
  const requiresSource = sourceImageRequiredTools.has(tool)
  if (requiresSource && !hostCommand.includes('--source-image <private-approved-frame.png>')) {
    fail(`host_runtime_command_missing_source_image:${tool}`)
  }
  if (requiresSource && !containerCommand.includes('--source-image <private-approved-frame.png>')) {
    fail(`container_runtime_command_missing_source_image:${tool}`)
  }
  if (!requiresSource && hostCommand.includes('--source-image')) {
    fail(`host_runtime_command_unnecessary_source_image:${tool}`)
  }
  if (!requiresSource && containerCommand.includes('--source-image')) {
    fail(`container_runtime_command_unnecessary_source_image:${tool}`)
  }
  const requiredToolSpecificFlag = toolSpecificFlagByTool[tool]
  if (requiredToolSpecificFlag && !hostCommand.includes(requiredToolSpecificFlag)) {
    fail(`host_runtime_command_missing_tool_specific_flag:${tool}`)
  }
  if (requiredToolSpecificFlag && !containerCommand.includes(requiredToolSpecificFlag)) {
    fail(`container_runtime_command_missing_tool_specific_flag:${tool}`)
  }
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
  if (row.executionState !== 'blocked_with_reason') {
    fail(`execution_state_mismatch:${tool}:${row.executionState}`)
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
  if (tool === 'sam2') {
    const nativeRequirement = row.localInputRequirements.find(
      (entry) => entry.key === 'nativeCudaRuntime',
    )
    if (!String(nativeRequirement?.description ?? '').includes('one approved private source frame')) {
      fail('sam2_native_cuda_requirement_missing_private_source_frame_scope')
    }
    if (
      row.localInputRequirements.some((entry) =>
        String(entry.description ?? '').includes('generated fixture'),
      )
    ) {
      fail('sam2_requirement_still_mentions_generated_fixture')
    }
  }
}

const liveOutput = JSON.parse(exec(`npm run --silent ${runScriptName}`))
if (liveOutput.decision !== decision) fail('live_output_decision_mismatch')
if (liveOutput.status !== status) fail('live_output_status_mismatch')
checkCounts('live_output', liveOutput.counts)
checkBooleans('live_output', liveOutput.booleans)

const scopedOutput = JSON.parse(exec(`npm run --silent ${runScriptName} -- --tool kornia`))
if (scopedOutput.decision !== decision) fail('scoped_output_decision_mismatch')
if (scopedOutput.counts?.gpuModelToolsCovered !== 1) fail('scoped_output_tool_count_mismatch')
if (scopedOutput.counts?.localDevAdapterBranchInvokedTools !== 1) fail('scoped_output_adapter_count_mismatch')
if (scopedOutput.counts?.localRuntimeExecutionPerformedTools !== 0) fail('scoped_output_runtime_executed')
if (scopedOutput.booleans?.scopedGpuModelToolSelectionActive !== true) fail('scoped_output_not_marked_scoped')
if (scopedOutput.booleans?.all8GpuModelToolsCovered !== false) fail('scoped_output_claims_all8')
if (scopedOutput.booleans?.localDevAdapterBranchInvokedForAll8 !== false) fail('scoped_output_claims_all8_invoked')
if (scopedOutput.booleans?.gpuRuntimeShouldStartNow !== false) fail('scoped_output_started_gpu')
if (scopedOutput.booleans?.toolExecutionApprovedNow !== false) fail('scoped_output_approved_tool_execution')
const scopedRows = Array.isArray(scopedOutput.gpuModelLocalDevRuntimeExecutionHarnessRows)
  ? scopedOutput.gpuModelLocalDevRuntimeExecutionHarnessRows
  : []
if (scopedRows.length !== 1 || scopedRows[0]?.toolId !== 'kornia') {
  fail('scoped_output_not_limited_to_kornia')
}
if (scopedRows[0]?.skipReasonCode !== 'kornia_source_frame_missing') {
  fail(`scoped_output_unexpected_skip_reason:${scopedRows[0]?.skipReasonCode}`)
}
if (scopedRows[0]?.executionState !== 'blocked_with_reason') {
  fail(`scoped_output_unexpected_execution_state:${scopedRows[0]?.executionState}`)
}

const source = [
  read('docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json'),
  read('docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.md'),
  read('server/cli/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness.ts'),
  read('server/tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter.ts'),
  read('server/workers/ai-graphics-runtime-script-runner.ts'),
]
for (const [index, text] of source.entries()) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden_claim_${index}:${pattern}`)
  }
}

const joinedSource = source.join('\n')
if (
  joinedSource.includes(
    'Current script uses an approved generated fixture only, not real media.',
  )
) {
  fail('gpu_model_harness_still_describes_sam2_as_generated_fixture_only')
}
for (const requiredSourceToken of [
  'docker_container',
  'runtimeContainerImage',
  'runtimeContainerGpu',
  'containerRuntimeEnv',
  'gpu_model_runtime_container_image_missing',
  'gpu_model_runtime_container_image_unavailable',
  'gpu_model_runtime_container_gpu_not_requested',
  'gpu_model_runtime_container_gpu_unavailable',
  'privateLocalRuntimeInputBlock',
  'private-input-preflight',
  'missingPrivateInputsBlockBeforeGpuStartup',
  'executionState',
]) {
  if (!joinedSource.includes(requiredSourceToken)) {
    fail(`missing_container_runtime_source_token:${requiredSourceToken}`)
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
