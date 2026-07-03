import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed'
const status =
  'external_agent_all21_controlled_route_execution_passed_with_gpu_on_demand'
const runScriptName =
  'ai-graphics:external-agent-all21-controlled-route-execution-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-all21-controlled-route-execution-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-all21-controlled-route-execution-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-all21-controlled-route-execution-smoke-diagnostics.mjs'
const canonicalGpuModelRuntimeContainerImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'

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
const sourceImageRequiredGpuModelTools = new Set([
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter.ts',
  'server/cli/ai-graphics-external-agent-all21-controlled-route-execution-smoke.ts',
  'scripts/validation/ai-graphics-external-agent-all21-controlled-route-execution-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.md',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-readiness-probe-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const forbiddenDocPatterns = [
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
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
    maxBuffer: 160 * 1024 * 1024,
  })
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
  if (report.routePath !== '/api/ai-graphics/external-beta/tool-call') {
    fail(`${label}_route_path_mismatch`)
  }
  if (report.disabledGpuControlledRouteStatus !== 409) {
    fail(`${label}_disabled_gpu_status_not_409`)
  }

  const rows = report.results
  if (!Array.isArray(rows) || rows.length !== 21) {
    fail(`${label}_result_count_mismatch`)
    return
  }

  for (const toolId of allTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_tool:${toolId}`)
      continue
    }
    if (row.group !== expectedGroup(toolId)) fail(`${label}_${toolId}_group_mismatch`)
    if (row.statusCode !== 200) fail(`${label}_${toolId}_status_not_200`)
    if (row.ok !== true) fail(`${label}_${toolId}_ok_not_true`)
    if (row.controlledAdapterInvokedNow !== true) {
      fail(`${label}_${toolId}_adapter_not_invoked`)
    }
    if (![
      'executable',
      'blocked_with_reason',
      'failed_with_diagnostics',
    ].includes(row.externalAgentExecutionState)) {
      fail(`${label}_${toolId}_external_agent_state_missing`)
    }
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
  }

  for (const toolId of [...cpuStaticTools, ...browserRuntimeTools]) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) continue
    if (row.controlledAdapterExecutedNow !== true) {
      fail(`${label}_${toolId}_adapter_not_executed`)
    }
    if (row.externalAgentExecutionState !== 'executable') {
      fail(`${label}_${toolId}_not_executable_state`)
    }
    if (row.blockingReasonCode !== null) {
      fail(`${label}_${toolId}_unexpected_blocking_reason`)
    }
    if (row.failureDiagnostics !== null) {
      fail(`${label}_${toolId}_unexpected_failure_diagnostics`)
    }
    if (row.localPackageExecutionPerformed !== true) {
      fail(`${label}_${toolId}_local_package_not_executed`)
    }
    if (!row.outputKind) fail(`${label}_${toolId}_missing_output_kind`)
    if (!row.outputSha256 || row.outputSha256.length !== 64) {
      fail(`${label}_${toolId}_missing_output_hash`)
    }
  }

  for (const toolId of gpuModelTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) continue
    if (row.controlledAdapterExecutedNow !== false) {
      fail(`${label}_${toolId}_gpu_adapter_should_skip_runtime`)
    }
    if (row.externalAgentExecutionState !== 'blocked_with_reason') {
      fail(`${label}_${toolId}_gpu_not_blocked_with_reason_state`)
    }
    if (!row.blockingReasonCode) {
      fail(`${label}_${toolId}_gpu_missing_blocking_reason`)
    }
    if (row.failureDiagnostics !== null) {
      fail(`${label}_${toolId}_gpu_unexpected_failure_diagnostics`)
    }
    if (row.localPackageExecutionPerformed !== false) {
      fail(`${label}_${toolId}_gpu_local_package_should_not_execute`)
    }
    if (row.localGpuModelRuntimeExecutionPerformed !== false) {
      fail(`${label}_${toolId}_gpu_runtime_performed`)
    }
    if (row.outputKind !== null) fail(`${label}_${toolId}_unexpected_output_kind`)
    if (row.outputSha256 !== null) fail(`${label}_${toolId}_unexpected_output_hash`)
  }

  const counts = report.counts ?? {}
  const expectedCounts = {
    totalAiGraphicsTools: 21,
    controlledRouteHttp200Tools: 21,
    controlledRouteCallableTools: 21,
    controlledRouteAdapterInvokedTools: 21,
    controlledRouteAdapterExecutedTools: 13,
    realRuntimeExecutedTools: 13,
    executableStateTools: 13,
    blockedWithReasonStateTools: 8,
    failedWithDiagnosticsStateTools: 0,
    cpuStaticControlledRouteExecutedTools: 6,
    browserRuntimeControlledRouteExecutedTools: 7,
    gpuModelControlledRouteInvokedTools: 8,
    gpuModelRuntimeProofRequiredTools: 8,
    localPackageExecutionPerformedTools: 13,
    localGpuModelRuntimeExecutionPerformedTools: 0,
    gpuRuntimeShouldStartNowTools: 0,
    workerDispatchPerformedTools: 0,
    providerRuntimePerformedTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
    scopedGpuModelLocalDevRouteAttemptTools: 8,
    scopedGpuModelLocalDevRouteAttemptBlockedWithReasonTools: 8,
    scopedGpuModelLocalDevRouteAttemptRuntimeExecutedTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) fail(`${label}_count_${key}_mismatch:${counts[key]}`)
  }

  const gpuModelRuntimePolicy = report.gpuModelRuntimePolicy ?? {}
  for (const key of [
    'scopedGpuModelPrivateInputPreflightBeforeGpuAttachment',
    'scopedGpuModelMissingPrivateInputsBlockBeforeGpuStartup',
    'scopedGpuModelRuntimeImageMissingBlocksBeforeInputInspection',
    'scopedGpuModelGpuStartsOnlyAfterPrivateInputsAndRuntimeProof',
    'noIdleGpuRuntimeApproved',
  ]) {
    if (gpuModelRuntimePolicy[key] !== true) {
      fail(`${label}_gpu_model_runtime_policy_not_true:${key}`)
    }
  }

  const scopedAttempt = report.scopedGpuModelLocalDevRouteAttempt
  if (!scopedAttempt || typeof scopedAttempt !== 'object') {
    fail(`${label}_missing_scoped_gpu_model_local_dev_route_attempt`)
  } else {
    const scopedResult = scopedAttempt.result ?? {}
    if (scopedAttempt.requestedToolId !== 'kornia') {
      fail(`${label}_scoped_attempt_tool_mismatch:${scopedAttempt.requestedToolId}`)
    }
    if (scopedAttempt.requestedRuntimeBackend !== 'docker_container') {
      fail(`${label}_scoped_attempt_backend_mismatch:${scopedAttempt.requestedRuntimeBackend}`)
    }
    if (
      scopedAttempt.expectedBlockingReasonCode !==
      'gpu_model_runtime_container_image_missing'
    ) {
      fail(`${label}_scoped_attempt_expected_block_code_mismatch`)
    }
    if (scopedAttempt.canonicalRuntimeContainerImage !== canonicalGpuModelRuntimeContainerImage) {
      fail(`${label}_scoped_attempt_canonical_image_mismatch:${scopedAttempt.canonicalRuntimeContainerImage}`)
    }
    if (scopedAttempt.requestedRuntimeContainerImage !== null) {
      fail(`${label}_scoped_attempt_default_image_should_be_null`)
    }
    if (scopedAttempt.runtimeContainerImageProvided !== false) {
      fail(`${label}_scoped_attempt_default_image_provided_not_false`)
    }
    if (!Array.isArray(scopedAttempt.expectedBlockingReasonCodes)) {
      fail(`${label}_scoped_attempt_expected_codes_missing`)
    } else if (
      scopedAttempt.expectedBlockingReasonCodes.length !== 1 ||
      scopedAttempt.expectedBlockingReasonCodes[0] !==
        'gpu_model_runtime_container_image_missing'
    ) {
      fail(`${label}_scoped_attempt_expected_codes_mismatch`)
    }
    if (!String(scopedAttempt.nextExactCommand ?? '').includes(canonicalGpuModelRuntimeContainerImage)) {
      fail(`${label}_scoped_attempt_next_command_missing_canonical_image`)
    }
    for (const flag of [
      '--scoped-gpu-runtime-container-image',
      '--scoped-gpu-runtime-container-platform',
      '--scoped-gpu-output-dir',
    ]) {
      if (!String(scopedAttempt.nextExactCommand ?? '').includes(flag)) {
        fail(`${label}_scoped_attempt_next_command_missing:${flag}`)
      }
    }
    if (
      sourceImageRequiredGpuModelTools.has(scopedAttempt.requestedToolId) &&
      !String(scopedAttempt.nextExactCommand ?? '').includes('--scoped-gpu-source-image')
    ) {
      fail(`${label}_scoped_attempt_next_command_missing_source_image`)
    }
    if (
      !sourceImageRequiredGpuModelTools.has(scopedAttempt.requestedToolId) &&
      String(scopedAttempt.nextExactCommand ?? '').includes('--scoped-gpu-source-image')
    ) {
      fail(`${label}_scoped_attempt_next_command_unnecessary_source_image`)
    }
    if (scopedResult.statusCode !== 200) {
      fail(`${label}_scoped_attempt_http_not_200:${scopedResult.statusCode}`)
    }
    if (scopedResult.ok !== true) fail(`${label}_scoped_attempt_ok_not_true`)
    if (scopedResult.routeStatus !== 'controlled_gpu_model_route_blocked_with_reason') {
      fail(`${label}_scoped_attempt_route_status_mismatch:${scopedResult.routeStatus}`)
    }
    if (scopedResult.externalAgentExecutionState !== 'blocked_with_reason') {
      fail(`${label}_scoped_attempt_state_mismatch:${scopedResult.externalAgentExecutionState}`)
    }
    if (scopedResult.blockingReasonCode !== 'gpu_model_runtime_container_image_missing') {
      fail(`${label}_scoped_attempt_block_code_mismatch:${scopedResult.blockingReasonCode}`)
    }
    for (const key of [
      'controlledAdapterExecutedNow',
      'localPackageExecutionPerformed',
      'localGpuModelRuntimeExecutionPerformed',
      'gpuRuntimeShouldStartNow',
      'publicArtifactCreated',
      'signedUrlCreated',
      'workerDispatchPerformed',
      'providerRuntimePerformed',
      'runtimeReadyNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ]) {
      if (scopedResult[key] !== false) {
        fail(`${label}_scoped_attempt_${key}_not_false`)
      }
    }
    for (const key of [
      'scopedGpuModelLocalDevRouteAttemptPerformed',
      'scopedGpuModelLocalDevRouteAttemptAccepted',
      'scopedGpuModelLocalDevRouteAttemptBlockedWithReason',
      'scopedGpuModelRuntimeContainerPayloadAccepted',
    ]) {
      if (scopedAttempt.booleans?.[key] !== true) {
        fail(`${label}_scoped_attempt_boolean_not_true:${key}`)
      }
    }
    for (const key of [
      'scopedGpuModelRuntimeExecutionPerformed',
      'scopedGpuModelRuntimeContainerImageProvided',
      'scopedGpuModelGpuRuntimeShouldStartNow',
      'scopedGpuModelPublicArtifactCreated',
      'scopedGpuModelSignedUrlCreated',
    ]) {
      if (scopedAttempt.booleans?.[key] !== false) {
        fail(`${label}_scoped_attempt_boolean_not_false:${key}`)
      }
    }
  }

  const scopedAttempts = Array.isArray(report.scopedGpuModelLocalDevRouteAttempts)
    ? report.scopedGpuModelLocalDevRouteAttempts
    : []
  if (scopedAttempts.length !== 8) {
    fail(`${label}_scoped_attempts_count_mismatch:${scopedAttempts.length}`)
  }
  for (const toolId of gpuModelTools) {
    const attempt = scopedAttempts.find((item) => item.requestedToolId === toolId)
    if (!attempt) {
      fail(`${label}_missing_scoped_attempt:${toolId}`)
      continue
    }
    const scopedResult = attempt.result ?? {}
    if (scopedResult.toolId !== toolId) {
      fail(`${label}_${toolId}_scoped_result_tool_mismatch:${scopedResult.toolId}`)
    }
    if (attempt.requestedRuntimeBackend !== 'docker_container') {
      fail(`${label}_${toolId}_scoped_backend_mismatch:${attempt.requestedRuntimeBackend}`)
    }
    if (attempt.canonicalRuntimeContainerImage !== canonicalGpuModelRuntimeContainerImage) {
      fail(`${label}_${toolId}_scoped_canonical_image_mismatch`)
    }
    if (attempt.runtimeContainerImageProvided !== false) {
      fail(`${label}_${toolId}_scoped_default_image_provided_not_false`)
    }
    if (attempt.expectedBlockingReasonCode !== 'gpu_model_runtime_container_image_missing') {
      fail(`${label}_${toolId}_scoped_expected_block_code_mismatch:${attempt.expectedBlockingReasonCode}`)
    }
    if (scopedResult.statusCode !== 200) {
      fail(`${label}_${toolId}_scoped_http_not_200:${scopedResult.statusCode}`)
    }
    if (scopedResult.ok !== true) fail(`${label}_${toolId}_scoped_ok_not_true`)
    if (scopedResult.controlledAdapterInvokedNow !== true) {
      fail(`${label}_${toolId}_scoped_adapter_not_invoked`)
    }
    if (scopedResult.externalAgentExecutionState !== 'blocked_with_reason') {
      fail(`${label}_${toolId}_scoped_state_mismatch:${scopedResult.externalAgentExecutionState}`)
    }
    if (scopedResult.blockingReasonCode !== 'gpu_model_runtime_container_image_missing') {
      fail(`${label}_${toolId}_scoped_block_code_mismatch:${scopedResult.blockingReasonCode}`)
    }
    for (const key of [
      'controlledAdapterExecutedNow',
      'localPackageExecutionPerformed',
      'localGpuModelRuntimeExecutionPerformed',
      'gpuRuntimeShouldStartNow',
      'publicArtifactCreated',
      'signedUrlCreated',
      'workerDispatchPerformed',
      'providerRuntimePerformed',
      'runtimeReadyNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ]) {
      if (scopedResult[key] !== false) {
        fail(`${label}_${toolId}_scoped_${key}_not_false`)
      }
    }
    if (!String(attempt.nextExactCommand ?? '').includes(`--scoped-gpu-tool ${toolId}`)) {
      fail(`${label}_${toolId}_scoped_next_command_not_tool_scoped`)
    }
    for (const flag of [
      '--scoped-gpu-runtime-container-image',
      '--scoped-gpu-runtime-container-platform',
      '--scoped-gpu-output-dir',
    ]) {
      if (!String(attempt.nextExactCommand ?? '').includes(flag)) {
        fail(`${label}_${toolId}_scoped_next_command_missing:${flag}`)
      }
    }
    if (
      sourceImageRequiredGpuModelTools.has(toolId) &&
      !String(attempt.nextExactCommand ?? '').includes('--scoped-gpu-source-image')
    ) {
      fail(`${label}_${toolId}_scoped_next_command_missing_source_image`)
    }
    if (
      !sourceImageRequiredGpuModelTools.has(toolId) &&
      String(attempt.nextExactCommand ?? '').includes('--scoped-gpu-source-image')
    ) {
      fail(`${label}_${toolId}_scoped_next_command_unnecessary_source_image`)
    }
    if (
      sourceImageRequiredGpuModelTools.has(toolId) &&
      typeof attempt.privateSourceImageLocalPath !== 'string'
    ) {
      fail(`${label}_${toolId}_missing_private_source_image_path`)
    }
    if (
      !sourceImageRequiredGpuModelTools.has(toolId) &&
      attempt.privateSourceImageLocalPath !== null
    ) {
      fail(`${label}_${toolId}_unexpected_private_source_image_path`)
    }
    const inputRefs = attempt.privateRuntimeInputRefs ?? {}
    if (toolId === 'sam2' && !inputRefs.sam2CheckpointLocalPath) {
      fail(`${label}_${toolId}_missing_private_checkpoint_ref`)
    }
    if (toolId === 'birefnet' && !inputRefs.birefnetModelLocalPath) {
      fail(`${label}_${toolId}_missing_private_model_ref`)
    }
    if (toolId === 'real_esrgan' && !inputRefs.realEsrganModelLocalPath) {
      fail(`${label}_${toolId}_missing_private_model_ref`)
    }
    if (toolId === 'rembg' && !inputRefs.rembgModelLocalPath) {
      fail(`${label}_${toolId}_missing_private_model_ref`)
    }
    if (
      toolId === 'transparent_background' &&
      !inputRefs.transparentBackgroundCheckpointLocalPath
    ) {
      fail(`${label}_${toolId}_missing_private_checkpoint_ref`)
    }
    for (const key of [
      'scopedGpuModelLocalDevRouteAttemptPerformed',
      'scopedGpuModelLocalDevRouteAttemptAccepted',
      'scopedGpuModelLocalDevRouteAttemptBlockedWithReason',
      'scopedGpuModelRuntimeContainerPayloadAccepted',
    ]) {
      if (attempt.booleans?.[key] !== true) {
        fail(`${label}_${toolId}_scoped_boolean_not_true:${key}`)
      }
    }
    for (const key of [
      'scopedGpuModelRuntimeExecutionPerformed',
      'scopedGpuModelRuntimeContainerImageProvided',
      'scopedGpuModelGpuRuntimeShouldStartNow',
      'scopedGpuModelPublicArtifactCreated',
      'scopedGpuModelSignedUrlCreated',
    ]) {
      if (attempt.booleans?.[key] !== false) {
        fail(`${label}_${toolId}_scoped_boolean_not_false:${key}`)
      }
    }
  }

  const booleans = report.booleans ?? {}
  for (const key of [
    'all21ControlledRouteExecutionSmokePassed',
    'all21ToolsCovered',
    'all21ToolsReturnedHttp200',
    'all21ControlledAdaptersInvoked',
    'cpuStaticControlledAdaptersExecuted',
    'browserRuntimeControlledAdaptersExecuted',
    'gpuModelControlledAdaptersInvoked',
    'normalizedExternalAgentExecutionStatesReturned',
    'thirteenToolsReturnExecutableState',
    'eightGpuModelToolsReturnBlockedWithReasonState',
    'noToolsReturnFailedWithDiagnosticsState',
    'agentCanCallAll21ControlledRoutesNow',
    'agentCanExecuteRealRuntimeFor13ToolsNow',
    'routeExecutionApprovedNow',
    'routeExecutionPerformed',
    'controlledToolRouteExecutionPerformed',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'all8ScopedGpuModelLocalDevRouteAttemptsAccepted',
    'all8ScopedGpuModelRuntimeContainerPayloadsAccepted',
    'scopedGpuModelLocalDevRouteAttemptAccepted',
    'scopedGpuModelLocalDevRouteAttemptBlockedWithReason',
    'scopedGpuModelRuntimeContainerPayloadAccepted',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'agentCanExecuteToolsNow',
    'agentCanExecuteAll21ToolsNow',
    'agentCanExecuteGpuModelToolsNow',
    'agentCanExecuteRealRuntimeForAll21ToolsNow',
    'gpuModelRuntimeProofAcceptedNow',
    'workerExecutionApprovedNow',
    'workerExecutionPerformed',
    'workerDispatchApprovedNow',
    'workerDispatchPerformed',
    'providerRuntimeApprovedNow',
    'providerRuntimePerformed',
    'browserWebglCanvasRuntimePerformedOutsideControlledAdapter',
    'gpuRuntimePerformed',
    'gpuRuntimeShouldStartNow',
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
}

for (const file of requiredFiles) read(file)

const docs = json(
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
)
const docsMd = read(
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.md',
)
const packageJson = json('package.json')
const cliSource = read(
  'server/cli/ai-graphics-external-agent-all21-controlled-route-execution-smoke.ts',
)
const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
const gpuAdapterSource = read(
  'server/tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter.ts',
)
const readinessProbe = json(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-readiness-probe-smoke.json',
)
const executionGate = json(
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
)
const scorecard = read('docs/production-beta-readiness-scorecard.md')

checkReport('docs', docs)
const live = JSON.parse(exec(`npm run --silent ${runScriptName}`))
checkReport('live', live)

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('diagnostic_script_mismatch')
}

for (const phrase of [
  'createReeditProApiApp',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG',
  'listAiGraphicsExternalBetaToolCallBlockedReadinessCases',
  'controlledAdapterInvokedNow',
  'gpuRuntimeShouldStartNow',
  'all21ToolsReturnedHttp200',
  'scopedGpuModelLocalDevRouteAttemptRequest',
  'scopedGpuModelToolIdsFromArgs',
  'scopedGpuModelLocalDevRouteAttempts',
  'all8ScopedGpuModelLocalDevRouteAttemptsAccepted',
  '--scoped-gpu-tool',
  '--scoped-gpu-runtime-container-image',
  '--scoped-gpu-runtime-container-platform',
  '--scoped-gpu-output-root',
  '--scoped-gpu-output-dir',
  '--scoped-gpu-source-image',
  '--scoped-gpu-sam2-checkpoint',
  '--scoped-gpu-birefnet-model',
  '--scoped-gpu-real-esrgan-model',
  '--scoped-gpu-rembg-model',
  '--scoped-gpu-transparent-background-checkpoint',
  canonicalGpuModelRuntimeContainerImage,
  'runtimeExecutionBackend',
  'runtimeContainerImage',
  'gpu_model_runtime_container_image_missing',
  'gpu_model_runtime_container_gpu_unavailable',
]) {
  if (!cliSource.includes(phrase)) fail(`cli_missing:${phrase}`)
}
for (const phrase of [
  'executeAiGraphicsExternalAgentGpuModelControlledAdapter',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG',
  'controlled_gpu_model_route_blocked_with_reason',
  'externalAgentExecutionState',
  'blockingReasonCode',
  'failureDiagnostics',
]) {
  if (!routeSource.includes(phrase)) fail(`route_missing:${phrase}`)
}
for (const phrase of [
  'AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS',
  'controlled_gpu_model_adapter_invoked_runtime_skipped',
  'allowModelDownload: false',
  'allowFinalRender: false',
]) {
  if (!gpuAdapterSource.includes(phrase)) fail(`gpu_adapter_missing:${phrase}`)
}

if (readinessProbe.counts?.externalAgentRouteCallableNowTools !== 21) {
  fail('readiness_probe_not_all21_callable')
}
if (readinessProbe.counts?.externalAgentRouteExecutableNowTools !== 13) {
  fail('readiness_probe_executable_not_13')
}
if (readinessProbe.booleans?.agentCanCallAll21ControlledRoutesNow !== true) {
  fail('readiness_probe_all21_callable_boolean_not_true')
}
if (readinessProbe.booleans?.agentCanExecuteAll21ToolsNow !== false) {
  fail('readiness_probe_all21_runtime_boolean_not_false')
}
if (readinessProbe.counts?.realRuntimeExecutableNowTools !== 13) {
  fail('readiness_probe_real_runtime_executable_not_13')
}
if (readinessProbe.counts?.gpuModelRuntimeProofRequiredTools !== 8) {
  fail('readiness_probe_gpu_model_proof_required_not_8')
}
if (executionGate.counts?.scopedControlledRouteExecutableNowTools !== 13) {
  fail('execution_gate_scoped_runtime_executable_not_13')
}
if (executionGate.counts?.scopedControlledRouteGpuModelBlockedTools !== 8) {
  fail('execution_gate_gpu_model_blocked_not_8')
}
if (executionGate.booleans?.agentCanExecuteAll21ToolsNow !== false) {
  fail('execution_gate_all21_runtime_boolean_not_false')
}
if (executionGate.booleans?.agentCanExecuteToolsNow !== true) {
  fail('execution_gate_agent_execution_not_true')
}

if (
  !scorecard.includes(
    'AI Graphics External Agent All-21 Controlled Route Execution Smoke',
  )
) {
  fail('scorecard_missing_all21_execution_section')
}
if (!scorecard.includes('controlledRouteHttp200Tools=21')) {
  fail('scorecard_missing_all21_http200_count')
}
if (!scorecard.includes('agentCanCallAll21ControlledRoutesNow=true')) {
  fail('scorecard_missing_all21_callable_true')
}
if (!scorecard.includes('agentCanExecuteAll21ToolsNow=false')) {
  fail('scorecard_missing_all21_runtime_execution_false')
}
if (!scorecard.includes('realRuntimeExecutedTools=13')) {
  fail('scorecard_missing_real_runtime_executed_13')
}
if (!scorecard.includes('gpuModelRuntimeProofRequiredTools=8')) {
  fail('scorecard_missing_gpu_proof_required_8')
}
if (!scorecard.includes('gpuRuntimeShouldStartNow=false')) {
  fail('scorecard_missing_gpu_start_false')
}

for (const toolId of allTools) {
  if (!JSON.stringify(docs).includes(`"${toolId}"`)) fail(`docs_json_missing_tool:${toolId}`)
  if (!docsMd.includes(`\`${toolId}\``)) fail(`docs_md_missing_tool:${toolId}`)
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
  if (changedGeneratedArtifactPattern.test(file)) {
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
  controlledRouteHttp200Tools: docs.counts.controlledRouteHttp200Tools,
  controlledRouteAdapterInvokedTools:
    docs.counts.controlledRouteAdapterInvokedTools,
  controlledRouteAdapterExecutedTools:
    docs.counts.controlledRouteAdapterExecutedTools,
  realRuntimeExecutedTools:
    docs.counts.realRuntimeExecutedTools,
  gpuModelControlledRouteInvokedTools:
    docs.counts.gpuModelControlledRouteInvokedTools,
  gpuModelRuntimeProofRequiredTools:
    docs.counts.gpuModelRuntimeProofRequiredTools,
  agentCanCallAll21ControlledRoutesNow:
    docs.booleans.agentCanCallAll21ControlledRoutesNow,
  agentCanExecuteAll21ToolsNow:
    docs.booleans.agentCanExecuteAll21ToolsNow,
  gpuRuntimeShouldStartNow:
    docs.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
}, null, 2))
