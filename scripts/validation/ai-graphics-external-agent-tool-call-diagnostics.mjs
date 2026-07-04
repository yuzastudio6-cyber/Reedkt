import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'ai_graphics_external_agent_single_tool_call_ready'
const runScriptName = 'ai-graphics:external-agent-tool-call'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-tool-call.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-tool-call:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-tool-call-diagnostics.mjs'
const routePath = '/api/ai-graphics/external-agent/tool-call'
const canonicalGpuModelRuntimeContainerImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-tool-call.ts',
  'scripts/validation/ai-graphics-external-agent-tool-call-diagnostics.mjs',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'docs/tool-intelligence/ai-graphics/external-agent-single-tool-call.json',
  'docs/tool-intelligence/ai-graphics/external-agent-single-tool-call.md',
  'package.json',
]

const forbiddenChangedPathPattern =
  /(^|\/)(\.local-artifacts|generated-media|render-output|renders|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp|avif)$/i

const forbiddenClaimPatterns = [
  /agentCanExecuteAll21ToolsNow["`:\s=]+true/i,
  /agentCanExecuteGpuModelToolsNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
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
    maxBuffer: 80 * 1024 * 1024,
  })
}

function runToolCall(args) {
  return JSON.parse(exec(`npm run --silent ${runScriptName} -- ${args}`))
}

function spawnToolCall(args) {
  const result = childProcess.spawnSync('npm', [
    'run',
    '--silent',
    runScriptName,
    '--',
    ...args,
  ], {
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 80 * 1024 * 1024,
  })
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

function checkNoBoundaryLeaks(label, report) {
  const booleans = report.booleans ?? {}
  for (const key of [
    'gpuRuntimeShouldStartNow',
    'publicArtifactCreated',
    'signedUrlCreated',
    'runtimeReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
  ]) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }
  const normalized = report.response?.externalAgentToolCallResult ?? {}
  if (normalized.outputAccess?.publicArtifactCreated !== false) {
    fail(`${label}_normalized_public_artifact_not_false`)
  }
  if (normalized.outputAccess?.signedUrlCreated !== false) {
    fail(`${label}_normalized_signed_url_not_false`)
  }
  if (normalized.gpuRuntimeShouldStartNow !== false) {
    fail(`${label}_normalized_gpu_runtime_start_not_false`)
  }
}

function checkExecutableCall(label, report, expectedToolId, expectedGroup) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== 'external_agent_single_tool_call_executed') {
    fail(`${label}_status_mismatch:${report.status}`)
  }
  if (report.routePath !== routePath) fail(`${label}_route_path_mismatch`)
  if (report.request?.toolId !== expectedToolId) {
    fail(`${label}_tool_mismatch:${report.request?.toolId}`)
  }
  if (report.request?.group !== expectedGroup) {
    fail(`${label}_group_mismatch:${report.request?.group}`)
  }
  if (report.response?.statusCode !== 200) {
    fail(`${label}_http_not_200:${report.response?.statusCode}`)
  }
  if (report.response?.ok !== true) fail(`${label}_ok_not_true`)
  if (report.response?.externalAgentExecutionState !== 'executable') {
    fail(`${label}_state_not_executable:${report.response?.externalAgentExecutionState}`)
  }
  const normalized = report.response?.externalAgentToolCallResult ?? {}
  if (normalized.callable !== true) fail(`${label}_not_callable`)
  if (normalized.executable !== true) fail(`${label}_not_executable`)
  if (normalized.blockedWithReason !== false) fail(`${label}_unexpected_block`)
  if (normalized.failedWithDiagnostics !== false) fail(`${label}_unexpected_failure`)
  if (normalized.controlledAdapterInvokedNow !== true) {
    fail(`${label}_adapter_not_invoked`)
  }
  if (normalized.controlledAdapterExecutedNow !== true) {
    fail(`${label}_adapter_not_executed`)
  }
  if (normalized.localPackageExecutionPerformed !== true) {
    fail(`${label}_local_package_not_executed`)
  }
  if (report.booleans?.localPackageExecutionPerformed !== true) {
    fail(`${label}_boolean_local_package_not_executed`)
  }
  if (!report.response?.outputKind) fail(`${label}_missing_output_kind`)
  if (!/^[a-f0-9]{64}$/.test(String(report.response?.outputSha256 ?? ''))) {
    fail(`${label}_missing_output_sha256`)
  }
  if (report.response?.outputSource !== 'controlled_adapter_private_artifact') {
    fail(`${label}_output_source_mismatch:${report.response?.outputSource}`)
  }
  if (report.nextAction?.status !== 'none_required_tool_executed') {
    fail(`${label}_next_action_status_mismatch:${report.nextAction?.status}`)
  }
  if (
    !Array.isArray(report.nextAction?.requiredPrivateInputKeys) ||
    report.nextAction.requiredPrivateInputKeys.length !== 0
  ) {
    fail(`${label}_unexpected_next_action_private_inputs`)
  }
  checkNoBoundaryLeaks(label, report)
}

function checkGpuBlockedCall(label, report, expectedBlockingReason) {
  const expectedCurrentBlockingPrerequisite =
    expectedBlockingReason === 'kornia_disabled_or_not_local_dev'
      ? 'attemptGpuRuntime'
      : 'sourceImageLocalPath'
  const expectedRemainingPrivateInputKeys =
    expectedCurrentBlockingPrerequisite === 'sourceImageLocalPath'
      ? ['outputDirectory', 'pythonCpuTensorRuntime']
      : ['outputDirectory', 'pythonCpuTensorRuntime', 'sourceImageLocalPath']
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== 'external_agent_single_tool_call_blocked_with_reason') {
    fail(`${label}_status_mismatch:${report.status}`)
  }
  if (report.routePath !== routePath) fail(`${label}_route_path_mismatch`)
  if (report.request?.toolId !== 'kornia') {
    fail(`${label}_tool_mismatch:${report.request?.toolId}`)
  }
  if (report.request?.group !== 'gpu_model') {
    fail(`${label}_group_mismatch:${report.request?.group}`)
  }
  if (report.response?.statusCode !== 200) {
    fail(`${label}_http_not_200:${report.response?.statusCode}`)
  }
  if (report.response?.ok !== true) fail(`${label}_ok_not_true`)
  if (report.response?.externalAgentExecutionState !== 'blocked_with_reason') {
    fail(`${label}_state_not_blocked:${report.response?.externalAgentExecutionState}`)
  }
  if (report.response?.blockingReasonCode !== expectedBlockingReason) {
    fail(`${label}_blocking_reason_mismatch:${report.response?.blockingReasonCode}`)
  }
  if (report.response?.outputKind !== null) fail(`${label}_unexpected_output_kind`)
  if (report.response?.outputSha256 !== null) fail(`${label}_unexpected_output_hash`)
  if (report.response?.outputSource !== null) fail(`${label}_unexpected_output_source`)
  const normalized = report.response?.externalAgentToolCallResult ?? {}
  if (normalized.callable !== true) fail(`${label}_not_callable`)
  if (normalized.executable !== false) fail(`${label}_unexpected_executable`)
  if (normalized.blockedWithReason !== true) fail(`${label}_not_blocked`)
  if (normalized.failedWithDiagnostics !== false) fail(`${label}_unexpected_failure`)
  if (normalized.controlledAdapterInvokedNow !== true) {
    fail(`${label}_adapter_not_invoked`)
  }
  if (normalized.controlledAdapterExecutedNow !== false) {
    fail(`${label}_adapter_should_not_execute`)
  }
  if (normalized.localPackageExecutionPerformed !== false) {
    fail(`${label}_local_package_should_not_execute`)
  }
  if (normalized.localGpuModelRuntimeExecutionPerformed !== false) {
    fail(`${label}_gpu_runtime_should_not_execute`)
  }
  if (normalized.nextExternalAgentCommandKind !== 'gpu_model_private_proof_sequence') {
    fail(`${label}_missing_private_proof_command_kind`)
  }
  if (
    normalized.nextExternalAgentRouteRetryCommandKind !==
    'scoped_gpu_model_route_retry_after_private_proof'
  ) {
    fail(`${label}_missing_route_retry_command_kind`)
  }
  const command = String(normalized.nextExternalAgentCommand ?? '')
  for (const fragment of [
    'ai-graphics:external-agent-gpu-model-private-proof-sequence',
    '--runtime-backend host_python',
    '--allow-cpu-tensor-runtime',
    '--tool kornia',
    '--source-image <private-approved-frame.png>',
    '--require-host-eligible',
    '--require-accepted-proof',
  ]) {
    if (!command.includes(fragment)) {
      fail(`${label}_proof_command_missing:${fragment}`)
    }
  }
  for (const key of [
    'outputDirectory',
    'pythonCpuTensorRuntime',
    'sourceImageLocalPath',
  ]) {
    if (!Array.isArray(normalized.requiredPrivateInputKeys) ||
      !normalized.requiredPrivateInputKeys.includes(key)) {
      fail(`${label}_required_private_input_missing:${key}`)
    }
  }
  if (
    normalized.currentBlockingPrerequisiteKey !==
    expectedCurrentBlockingPrerequisite
  ) {
    fail(`${label}_current_blocking_prerequisite_mismatch:${normalized.currentBlockingPrerequisiteKey}`)
  }
  if (normalized.currentBlockingReasonCode !== expectedBlockingReason) {
    fail(`${label}_current_blocking_reason_mismatch:${normalized.currentBlockingReasonCode}`)
  }
  for (const key of expectedRemainingPrivateInputKeys) {
    if (!Array.isArray(normalized.remainingPrivateInputKeys) ||
      !normalized.remainingPrivateInputKeys.includes(key)) {
      fail(`${label}_remaining_private_input_missing:${key}`)
    }
  }
  if (
    expectedCurrentBlockingPrerequisite === 'sourceImageLocalPath' &&
    normalized.remainingPrivateInputKeys?.includes('sourceImageLocalPath')
  ) {
    fail(`${label}_remaining_private_input_still_contains_current_blocker`)
  }
  for (const fragment of [
    'local Python CPU tensor runtime',
    'private approved source image',
    'proof-local GPU worker container image',
    'no public artifact',
  ]) {
    if (!Array.isArray(normalized.blockedRuntimePrerequisites) ||
      !normalized.blockedRuntimePrerequisites.some((item) =>
        String(item).includes(fragment))) {
      fail(`${label}_blocked_prerequisite_missing:${fragment}`)
    }
  }
  if (
    normalized.gpuRuntimeStartPolicy !==
    'on_demand_only_for_scoped_active_tool_call'
  ) {
    fail(`${label}_gpu_runtime_start_policy_mismatch`)
  }
  const nextAction = report.nextAction ?? {}
  if (nextAction.status !== 'blocked_until_scoped_private_gpu_runtime_proof') {
    fail(`${label}_next_action_status_mismatch:${nextAction.status}`)
  }
  if (
    nextAction.gpuRuntimeStartPolicy !==
    'on_demand_only_for_scoped_active_tool_call'
  ) {
    fail(`${label}_next_action_gpu_policy_mismatch`)
  }
  if (
    nextAction.currentBlockingPrerequisiteKey !==
    expectedCurrentBlockingPrerequisite
  ) {
    fail(`${label}_next_action_current_blocking_prerequisite_mismatch:${nextAction.currentBlockingPrerequisiteKey}`)
  }
  if (nextAction.currentBlockingReasonCode !== expectedBlockingReason) {
    fail(`${label}_next_action_current_blocking_reason_mismatch:${nextAction.currentBlockingReasonCode}`)
  }
  for (const key of expectedRemainingPrivateInputKeys) {
    if (!Array.isArray(nextAction.remainingPrivateInputKeys) ||
      !nextAction.remainingPrivateInputKeys.includes(key)) {
      fail(`${label}_next_action_remaining_private_input_missing:${key}`)
    }
  }
  if (
    expectedCurrentBlockingPrerequisite === 'sourceImageLocalPath' &&
    nextAction.remainingPrivateInputKeys?.includes('sourceImageLocalPath')
  ) {
    fail(`${label}_next_action_remaining_private_input_still_contains_current_blocker`)
  }
  for (const key of [
    'outputDirectory',
    'pythonCpuTensorRuntime',
    'sourceImageLocalPath',
  ]) {
    if (!Array.isArray(nextAction.requiredPrivateInputKeys) ||
      !nextAction.requiredPrivateInputKeys.includes(key)) {
      fail(`${label}_next_action_required_private_input_missing:${key}`)
    }
  }
  for (const fragment of [
    'approved local Python CPU tensor runtime',
    'private approved source image',
    'no public artifact',
  ]) {
    if (!Array.isArray(nextAction.blockedRuntimePrerequisites) ||
      !nextAction.blockedRuntimePrerequisites.some((item) =>
        String(item).includes(fragment))) {
      fail(`${label}_next_action_prerequisite_missing:${fragment}`)
    }
  }
  for (const fragment of [
    'ai-graphics:gpu-runtime-proof-local-preflight',
    '--detect-host',
  ]) {
    if (!String(nextAction.nextExactGpuHostPreflightCommand ?? '').includes(fragment)) {
      fail(`${label}_next_action_host_preflight_missing:${fragment}`)
    }
  }
  for (const fragment of [
    'docker buildx build',
    '--platform linux/amd64',
    `-t ${canonicalGpuModelRuntimeContainerImage}`,
  ]) {
    if (!String(nextAction.nextExactGpuContainerBuildCommand ?? '').includes(fragment)) {
      fail(`${label}_next_action_container_build_missing:${fragment}`)
    }
  }
  for (const fragment of [
    'ai-graphics:external-agent-tool-call',
    '--tool kornia',
    '--attempt-gpu-runtime',
    '--runtime-backend host_python',
    '--allow-cpu-tensor-runtime',
    '--gpu-output-dir .local-artifacts/ai-graphics/external-agent-single-tool-call/<private-run>/kornia',
    '--source-image <private-approved-frame.png>',
    '--expect-state executable',
    '--require-output-hash',
    '--require-private-only-boundary',
    '--strict-exit-code',
  ]) {
    if (!String(nextAction.nextExactScopedToolCallCommand ?? '').includes(fragment)) {
      fail(`${label}_next_action_scoped_tool_call_missing:${fragment}`)
    }
  }
  for (const fragment of [
    'ai-graphics:external-agent-tool-call',
    '--tool kornia',
    '--attempt-gpu-runtime',
    '--runtime-backend host_python',
    '--runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json',
    '--allow-cpu-tensor-runtime',
    '--expect-state executable',
    '--require-output-hash',
    '--require-private-only-boundary',
    '--strict-exit-code',
  ]) {
    if (!String(nextAction.nextExactScopedToolCallManifestCommand ?? '').includes(fragment)) {
      fail(`${label}_next_action_manifest_scoped_tool_call_missing:${fragment}`)
    }
  }
  checkNoBoundaryLeaks(label, report)
}

function checkUnsafeGpuPayloadFailure(
  label,
  report,
  expectedToolId,
  expectedDiagnosticFragment,
) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== 'external_agent_single_tool_call_failed_with_diagnostics') {
    fail(`${label}_status_mismatch:${report.status}`)
  }
  if (report.routePath !== routePath) fail(`${label}_route_path_mismatch`)
  if (report.request?.toolId !== expectedToolId) {
    fail(`${label}_tool_mismatch:${report.request?.toolId}`)
  }
  if (report.request?.group !== 'gpu_model') {
    fail(`${label}_group_mismatch:${report.request?.group}`)
  }
  if (report.response?.statusCode !== 200) {
    fail(`${label}_http_not_200:${report.response?.statusCode}`)
  }
  if (report.response?.ok !== true) fail(`${label}_ok_not_true`)
  if (report.response?.routeStatus !== 'controlled_gpu_model_route_failed_with_diagnostics_payload_boundary') {
    fail(`${label}_route_status_mismatch:${report.response?.routeStatus}`)
  }
  if (report.response?.externalAgentExecutionState !== 'failed_with_diagnostics') {
    fail(`${label}_state_not_failed:${report.response?.externalAgentExecutionState}`)
  }
  if (!String(report.response?.failureDiagnostics ?? '').includes(expectedDiagnosticFragment)) {
    fail(`${label}_failure_diagnostic_missing:${expectedDiagnosticFragment}`)
  }
  if (report.response?.outputKind !== null) fail(`${label}_unexpected_output_kind`)
  if (report.response?.outputSha256 !== null) fail(`${label}_unexpected_output_hash`)
  if (report.response?.outputSource !== null) fail(`${label}_unexpected_output_source`)
  const normalized = report.response?.externalAgentToolCallResult ?? {}
  if (normalized.callable !== true) fail(`${label}_not_callable`)
  if (normalized.executable !== false) fail(`${label}_unexpected_executable`)
  if (normalized.blockedWithReason !== false) fail(`${label}_unexpected_block`)
  if (normalized.failedWithDiagnostics !== true) fail(`${label}_not_failed`)
  if (normalized.controlledAdapterInvokedNow !== false) {
    fail(`${label}_adapter_should_not_be_invoked`)
  }
  if (normalized.controlledAdapterExecutedNow !== false) {
    fail(`${label}_adapter_should_not_execute`)
  }
  if (normalized.localGpuModelRuntimeExecutionPerformed !== false) {
    fail(`${label}_gpu_runtime_should_not_execute`)
  }
  if (normalized.nextExternalAgentAction !== 'fix the private local GPU/model payload boundary before retrying the controlled route') {
    fail(`${label}_next_external_agent_action_mismatch`)
  }
  if (report.nextAction?.status !== 'inspect_failure_diagnostics_before_retry') {
    fail(`${label}_next_action_status_mismatch:${report.nextAction?.status}`)
  }
  if (report.booleans?.controlledAdapterInvokedNow !== false) {
    fail(`${label}_boolean_adapter_invoked_not_false`)
  }
  if (report.booleans?.controlledAdapterExecutedNow !== false) {
    fail(`${label}_boolean_adapter_executed_not_false`)
  }
  if (report.booleans?.localGpuModelRuntimeExecutionPerformed !== false) {
    fail(`${label}_boolean_gpu_runtime_executed_not_false`)
  }
  checkNoBoundaryLeaks(label, report)
}

function readLocalResult(filePath) {
  if (!fs.existsSync(absolute(filePath))) {
    fail(`missing_local_result:${filePath}`)
    return {}
  }
  try {
    return JSON.parse(fs.readFileSync(absolute(filePath), 'utf8'))
  } catch (error) {
    fail(`invalid_local_result:${filePath}:${error.message}`)
    return {}
  }
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
const docsJson = json(
  'docs/tool-intelligence/ai-graphics/external-agent-single-tool-call.json',
)
const docsMd = read(
  'docs/tool-intelligence/ai-graphics/external-agent-single-tool-call.md',
)
const cliSource = read('server/cli/ai-graphics-external-agent-tool-call.ts')
const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('diagnostic_script_mismatch')
}

if (docsJson.schemaVersion !== '2026-07-04.ai-graphics.external-agent-single-tool-call') {
  fail('docs_schema_mismatch')
}
checkExecutableCall('docs_d3', docsJson, 'd3', 'cpu_static')

for (const phrase of [
  'createReeditProApiApp',
  'AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG',
  'listAiGraphicsExternalBetaToolCallBlockedReadinessCases',
  '--attempt-gpu-runtime',
  '--gpu-output-dir',
  '--runtime-input-manifest',
  '--allow-cpu-tensor-runtime',
  'readRuntimeInputManifest',
  'manifestBooleanForTool',
  'manifestStringForTool',
  'gpuModelScopedToolCallManifestCommand',
  '--runtime-container-image',
  canonicalGpuModelRuntimeContainerImage,
  'privateOutputOnly',
  'gpuRuntimeOnDemandOnly',
  '--expect-state',
  '--expect-blocking-reason',
  '--result-out',
  '--strict-exit-code',
  '--require-output-hash',
  '--require-private-only-boundary',
  'strictExitCodeForReport',
  'validationFailures',
  'outputSummaryFromAdapterResult',
  'gpu_model_private_runtime_output',
  'gpu_model_controlled_adapter_runtime_output',
  'outputJsonSha256',
  'outputJsonPath',
  'nextActionForReport',
  'assertPrivateLocalInputPath',
  'assertNoSignedUrlOrRawUrl',
  'gpuModelRequiredPrivateInputKeys',
  'gpuModelCurrentBlockingPrerequisiteKey',
  'blocked_until_scoped_private_gpu_runtime_proof',
  'nextExactScopedToolCallCommand',
  'nextExactScopedToolCallManifestCommand',
  '--unsafe-route-payload-test',
  'unsafeRoutePayloadForGpuModelTool',
]) {
  if (!cliSource.includes(phrase)) fail(`cli_missing:${phrase}`)
}

for (const phrase of [
  'validateAiGraphicsGpuModelControlledPayloadBoundary',
  'buildAiGraphicsExternalBetaToolCallUnsafeGpuPayloadResult',
  'controlled_gpu_model_route_failed_with_diagnostics_payload_boundary',
  'gpuModelPayloadLocalPathFields',
  'gpuModelPayloadForbiddenTrueFields',
  'currentBlockingPrerequisiteKey',
  'remainingPrivateInputKeys',
  'assertNoSignedUrlOrRawUrl',
  'assertNoPathTraversal',
  'outputDirectory must stay under .local-artifacts/',
]) {
  if (!routeSource.includes(phrase)) fail(`route_missing:${phrase}`)
}

for (const [label, text] of [
  ['docs_json', JSON.stringify(docsJson)],
  ['docs_md', docsMd],
]) {
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`${label}_forbidden_claim:${pattern}`)
  }
}

const d3Live = runToolCall('--tool d3')
checkExecutableCall('live_d3', d3Live, 'd3', 'cpu_static')

const echartsLive = runToolCall('--tool echarts')
checkExecutableCall('live_echarts', echartsLive, 'echarts', 'browser_runtime')

const korniaBlockedLive = runToolCall('--tool kornia')
checkGpuBlockedCall(
  'live_kornia_blocked',
  korniaBlockedLive,
  'kornia_disabled_or_not_local_dev',
)

const korniaScopedGpuAttemptLive = runToolCall([
  '--tool kornia',
  '--attempt-gpu-runtime',
  '--runtime-backend docker_container',
  `--runtime-container-image ${canonicalGpuModelRuntimeContainerImage}`,
  '--runtime-container-platform linux/amd64',
  '--gpu-output-dir .local-artifacts/ai-graphics/external-agent-single-tool-call-diagnostic/kornia',
  '--source-image /tmp/reeditpro-missing-private-approved-frame.png',
].join(' '))
checkGpuBlockedCall(
  'live_kornia_scoped_gpu_attempt',
  korniaScopedGpuAttemptLive,
  'kornia_source_frame_missing',
)
if (
  korniaScopedGpuAttemptLive.request?.payload?.runtimeContainerImage !==
  canonicalGpuModelRuntimeContainerImage
) {
  fail('live_kornia_scoped_gpu_attempt_runtime_image_not_accepted')
}
if (
  korniaScopedGpuAttemptLive.request?.payload?.outputDirectory !==
  '.local-artifacts/ai-graphics/external-agent-single-tool-call-diagnostic/kornia'
) {
  fail('live_kornia_scoped_gpu_attempt_output_dir_mismatch')
}
if (
  korniaScopedGpuAttemptLive.request?.payload?.sourceImageLocalPath !==
  '/tmp/reeditpro-missing-private-approved-frame.png'
) {
  fail('live_kornia_scoped_gpu_attempt_source_image_mismatch')
}

const runtimeManifestDir =
  '.local-artifacts/ai-graphics/external-agent-single-tool-call-diagnostic/manifest'
const runtimeManifestPath = `${runtimeManifestDir}/runtime-inputs.json`
fs.mkdirSync(absolute(runtimeManifestDir), { recursive: true })
fs.writeFileSync(absolute(runtimeManifestPath), JSON.stringify({
  outputDirectory: `${runtimeManifestDir}/kornia-output`,
  toolInputs: {
    kornia: {
      sourceImageLocalPath: '/tmp/reeditpro-missing-private-approved-frame.png',
    },
  },
}, null, 2))
const korniaManifestGpuAttemptLive = runToolCall([
  '--tool kornia',
  '--attempt-gpu-runtime',
  '--runtime-backend docker_container',
  `--runtime-container-image ${canonicalGpuModelRuntimeContainerImage}`,
  '--runtime-container-platform linux/amd64',
  `--runtime-input-manifest ${runtimeManifestPath}`,
].join(' '))
checkGpuBlockedCall(
  'live_kornia_manifest_gpu_attempt',
  korniaManifestGpuAttemptLive,
  'kornia_source_frame_missing',
)
if (korniaManifestGpuAttemptLive.agentCommandContract?.runtimeInputManifest !== runtimeManifestPath) {
  fail('live_kornia_manifest_gpu_attempt_contract_path_mismatch')
}
if (korniaManifestGpuAttemptLive.agentCommandContract?.runtimeInputManifestUsed !== true) {
  fail('live_kornia_manifest_gpu_attempt_contract_used_not_true')
}
if (korniaManifestGpuAttemptLive.request?.payload?.runtimeInputManifestUsed !== true) {
  fail('live_kornia_manifest_gpu_attempt_payload_manifest_used_not_true')
}
if (
  korniaManifestGpuAttemptLive.request?.payload?.outputDirectory !==
  `${runtimeManifestDir}/kornia-output`
) {
  fail('live_kornia_manifest_gpu_attempt_output_dir_mismatch')
}
if (
  korniaManifestGpuAttemptLive.request?.payload?.sourceImageLocalPath !==
  '/tmp/reeditpro-missing-private-approved-frame.png'
) {
  fail('live_kornia_manifest_gpu_attempt_source_image_mismatch')
}

const cpuTensorDir =
  '.local-artifacts/ai-graphics/external-agent-single-tool-call-diagnostic/kornia-cpu'
const cpuTensorSourcePath = `${cpuTensorDir}/private-approved-frame.ppm`
fs.mkdirSync(absolute(cpuTensorDir), { recursive: true })
fs.writeFileSync(absolute(cpuTensorSourcePath), [
  'P3',
  '2 2',
  '255',
  '255 0 0 0 255 0',
  '0 0 255 255 255 255',
  '',
].join('\n'))
const korniaCpuTensorAttemptLive = runToolCall([
  '--tool kornia',
  '--attempt-gpu-runtime',
  '--runtime-backend host_python',
  '--allow-cpu-tensor-runtime',
  `--gpu-output-dir ${cpuTensorDir}/output`,
  `--source-image ${cpuTensorSourcePath}`,
].join(' '))
if (korniaCpuTensorAttemptLive.decision !== decision) {
  fail('live_kornia_cpu_tensor_attempt_decision_mismatch')
}
if (korniaCpuTensorAttemptLive.request?.payload?.allowCpuTensorRuntime !== true) {
  fail('live_kornia_cpu_tensor_attempt_payload_flag_missing')
}
if (korniaCpuTensorAttemptLive.request?.payload?.runtimeExecutionBackend !== 'host_python') {
  fail('live_kornia_cpu_tensor_attempt_backend_mismatch')
}
if (korniaCpuTensorAttemptLive.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('live_kornia_cpu_tensor_attempt_started_gpu')
}
if (
  korniaCpuTensorAttemptLive.response?.externalAgentExecutionState ===
  'blocked_with_reason'
) {
  const normalized =
    korniaCpuTensorAttemptLive.response?.externalAgentToolCallResult ?? {}
  if (
    korniaCpuTensorAttemptLive.response?.blockingReasonCode !==
    'gpu_model_python_package_missing'
  ) {
    fail(`live_kornia_cpu_tensor_attempt_unexpected_block:${korniaCpuTensorAttemptLive.response?.blockingReasonCode}`)
  }
  if (normalized.currentBlockingPrerequisiteKey !== 'pythonCpuTensorRuntime') {
    fail(`live_kornia_cpu_tensor_attempt_blocker_mismatch:${normalized.currentBlockingPrerequisiteKey}`)
  }
  if (normalized.localGpuModelRuntimeExecutionPerformed !== false) {
    fail('live_kornia_cpu_tensor_attempt_blocked_but_runtime_executed')
  }
} else if (
  korniaCpuTensorAttemptLive.response?.externalAgentExecutionState ===
  'executable'
) {
  const normalized =
    korniaCpuTensorAttemptLive.response?.externalAgentToolCallResult ?? {}
  if (normalized.controlledAdapterExecutedNow !== true) {
    fail('live_kornia_cpu_tensor_attempt_executable_adapter_not_executed')
  }
  if (!/^[a-f0-9]{64}$/.test(String(korniaCpuTensorAttemptLive.response?.outputSha256 ?? ''))) {
    fail('live_kornia_cpu_tensor_attempt_missing_output_sha256')
  }
  if (normalized.gpuRuntimeShouldStartNow !== false) {
    fail('live_kornia_cpu_tensor_attempt_executable_started_gpu')
  }
} else {
  fail(`live_kornia_cpu_tensor_attempt_unexpected_state:${korniaCpuTensorAttemptLive.response?.externalAgentExecutionState}`)
}

const manifestOutsideLocalArtifacts = spawnToolCall([
  '--tool',
  'kornia',
  '--attempt-gpu-runtime',
  '--runtime-input-manifest',
  '/tmp/reeditpro-runtime-inputs.json',
])
if (manifestOutsideLocalArtifacts.status === 0) {
  fail('runtime_input_manifest_outside_local_artifacts_unexpected_success')
}
if (!manifestOutsideLocalArtifacts.stderr.includes('--runtime-input-manifest must stay under .local-artifacts/')) {
  fail('runtime_input_manifest_outside_local_artifacts_missing_diagnostic')
}

const unsafeRawUrlRoutePayload = runToolCall([
  '--tool kornia',
  '--unsafe-route-payload-test raw_url_source_image',
].join(' '))
checkUnsafeGpuPayloadFailure(
  'live_unsafe_raw_url_route_payload',
  unsafeRawUrlRoutePayload,
  'kornia',
  'sourceImageLocalPath must be a private storage/local reference',
)

const unsafeTraversalRoutePayload = runToolCall([
  '--tool sam2',
  '--unsafe-route-payload-test path_traversal_checkpoint',
].join(' '))
checkUnsafeGpuPayloadFailure(
  'live_unsafe_traversal_route_payload',
  unsafeTraversalRoutePayload,
  'sam2',
  'sam2CheckpointLocalPath must not contain path traversal segments',
)

const unsafeOutputRoutePayload = runToolCall([
  '--tool kornia',
  '--unsafe-route-payload-test unsafe_output_directory',
].join(' '))
checkUnsafeGpuPayloadFailure(
  'live_unsafe_output_route_payload',
  unsafeOutputRoutePayload,
  'kornia',
  'outputDirectory must stay under .local-artifacts/',
)

const unsafePublicArtifactRoutePayload = runToolCall([
  '--tool kornia',
  '--unsafe-route-payload-test public_artifact_claim',
].join(' '))
checkUnsafeGpuPayloadFailure(
  'live_unsafe_public_artifact_route_payload',
  unsafePublicArtifactRoutePayload,
  'kornia',
  'publicArtifactCreated=true is not allowed',
)

const localResultDir =
  '.local-artifacts/ai-graphics/external-agent-single-tool-call-diagnostic'
const localD3ResultPath = `${localResultDir}/d3-result.json`
const localKorniaResultPath = `${localResultDir}/kornia-result.json`
const d3ExpectedState = spawnToolCall([
  '--tool',
  'd3',
  '--expect-state',
  'executable',
  '--require-output-hash',
  '--require-private-only-boundary',
  '--result-out',
  localD3ResultPath,
])
if (d3ExpectedState.status !== 0) {
  fail(`d3_expected_state_status:${d3ExpectedState.status}:${d3ExpectedState.stderr}`)
}
const localD3Result = readLocalResult(localD3ResultPath)
checkExecutableCall('local_result_d3', localD3Result, 'd3', 'cpu_static')
if (localD3Result.agentCommandContract?.resultOut !== localD3ResultPath) {
  fail('local_result_d3_result_out_mismatch')
}

const korniaExpectedState = spawnToolCall([
  '--tool',
  'kornia',
  '--expect-state',
  'blocked_with_reason',
  '--expect-blocking-reason',
  'kornia_disabled_or_not_local_dev',
  '--require-private-only-boundary',
  '--result-out',
  localKorniaResultPath,
])
if (korniaExpectedState.status !== 0) {
  fail(`kornia_expected_state_status:${korniaExpectedState.status}:${korniaExpectedState.stderr}`)
}
const localKorniaResult = readLocalResult(localKorniaResultPath)
checkGpuBlockedCall(
  'local_result_kornia',
  localKorniaResult,
  'kornia_disabled_or_not_local_dev',
)
if (localKorniaResult.agentCommandContract?.resultOut !== localKorniaResultPath) {
  fail('local_result_kornia_result_out_mismatch')
}

const korniaStrictExit = spawnToolCall([
  '--tool',
  'kornia',
  '--strict-exit-code',
])
if (korniaStrictExit.status !== 2) {
  fail(`kornia_strict_exit_code_mismatch:${korniaStrictExit.status}`)
}

const d3WrongExpectedState = spawnToolCall([
  '--tool',
  'd3',
  '--expect-state',
  'blocked_with_reason',
])
if (d3WrongExpectedState.status !== 1) {
  fail(`d3_wrong_expected_state_status:${d3WrongExpectedState.status}`)
}
if (!d3WrongExpectedState.stderr.includes('expected_state_mismatch')) {
  fail('d3_wrong_expected_state_missing_diagnostic')
}

const korniaRawUrlInput = spawnToolCall([
  '--tool',
  'kornia',
  '--attempt-gpu-runtime',
  '--runtime-backend',
  'docker_container',
  '--gpu-output-dir',
  '.local-artifacts/ai-graphics/external-agent-single-tool-call-diagnostic/kornia-url-rejected',
  '--source-image',
  'https://example.com/private-frame.png',
])
if (korniaRawUrlInput.status === 0) {
  fail('kornia_raw_url_input_unexpected_success')
}
if (!korniaRawUrlInput.stderr.includes('sourceImageLocalPath must be a private storage/local reference')) {
  fail('kornia_raw_url_input_missing_diagnostic')
}

const sam2TraversalInput = spawnToolCall([
  '--tool',
  'sam2',
  '--attempt-gpu-runtime',
  '--runtime-backend',
  'docker_container',
  '--gpu-output-dir',
  '.local-artifacts/ai-graphics/external-agent-single-tool-call-diagnostic/sam2-traversal-rejected',
  '--source-image',
  '/tmp/reeditpro-missing-private-approved-frame.png',
  '--sam2-checkpoint',
  '../private-sam2-checkpoint.pt',
])
if (sam2TraversalInput.status === 0) {
  fail('sam2_traversal_input_unexpected_success')
}
if (!sam2TraversalInput.stderr.includes('sam2CheckpointLocalPath must not contain path traversal segments')) {
  fail('sam2_traversal_input_missing_diagnostic')
}

const packageJsonDiff = exec('git diff -- package.json')
const packageJsonChangedLines = packageJsonDiff
  .split('\n')
  .filter((line) => /^[+-]\s+/.test(line))
for (const line of packageJsonChangedLines) {
  if (!line.includes('"ai-graphics:external-agent-tool-call"') &&
    !line.includes('"ai-graphics:external-agent-tool-call:diagnostics"')) {
    fail(`package_json_unexpected_changed_line:${line}`)
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
  if (forbiddenChangedPathPattern.test(file)) {
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
  d3Executable: true,
  echartsExecutable: true,
  korniaBlocked: true,
  korniaBlockedReason:
    korniaBlockedLive.response.externalAgentToolCallResult.blockingReasonCode,
  korniaGpuAttemptBlocked: true,
  korniaGpuAttemptBlockedReason:
    korniaScopedGpuAttemptLive.response.externalAgentToolCallResult
      .blockingReasonCode,
  gpuRuntimeShouldStartNow: false,
  publicArtifactCreated: false,
  signedUrlCreated: false,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
  packageLockUnchanged: true,
}, null, 2))
