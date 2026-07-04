import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_execution_readiness_all21_evaluated_with_gpu_model_blocks'
const status =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_gpu_model_blocked_pending_private_proof'
const privateProofStatus =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_plus_private_gpu_model_proof_subset'
const runScriptName = 'ai-graphics:external-agent-execution-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-execution-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-execution-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-execution-readiness-diagnostics.mjs'
const canonicalGpuWorkerProofImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const canonicalGpuWorkerProofImageBuildCommand =
  `docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/gpu-worker/Dockerfile -t ${canonicalGpuWorkerProofImage} .`

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
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
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

function execFileJson(command, args) {
  return JSON.parse(childProcess.execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  }))
}

function createScopedKorniaPrivateProofFixture() {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'reeditpro-kornia-readiness-proof-'),
  )
  const outputJsonPath = path.join(tempDir, 'kornia-runtime-result.json')
  fs.writeFileSync(outputJsonPath, `${JSON.stringify({
    toolId: 'kornia',
    runtimeExecuted: true,
    privateLocalProofFixture: true,
  }, null, 2)}\n`)

  const source = json(
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
  )
  const proof = {
    ...source,
    status:
      'local_dev_runtime_executed_for_private_opt_in_subset_not_global_ready',
    counts: {
      ...(source.counts ?? {}),
      requestedGpuModelTools: 1,
      gpuModelToolsCovered: 1,
      localDevAdapterBranchInvokedTools: 1,
      localDevPrerequisiteCheckOnlyTools: 0,
      localRuntimeExecutionPerformedTools: 1,
      toolExecutionApprovedNowTools: 1,
      gpuRuntimeApprovedForScopedControlledToolCallTools: 1,
      gpuRuntimeShouldStartNowTools: 1,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      runtimeReadyNowTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    gpuModelLocalDevRuntimeExecutionHarnessRows: [{
      toolId: 'kornia',
      capabilityId: 'tensor_image_ops',
      adapterDecision:
        'ai_graphics_external_agent_gpu_model_controlled_adapter_executable_eight_on_demand_with_runtime_blocks',
      adapterStatus: 'controlled_gpu_model_adapter_executed_private_output_ready',
      executionState: 'executable',
      controlledAdapterExecutableNow: true,
      controlledAdapterInvokedNow: true,
      harnessMode: 'local_dev_runtime_attempt_requested',
      localRuntimeExecutionPerformed: true,
      toolExecutionApprovedNow: true,
      gpuRuntimeApprovedForScopedControlledToolCall: true,
      gpuRuntimeShouldStartNow: true,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      skipReasonCode: null,
      errorMessage: null,
      outputJsonPath,
      localInputRequirements: [
        {
          key: 'outputDirectory',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Private local worker output directory; must not be public artifact storage.',
        },
        {
          key: 'sourceImageLocalPath',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Private local representative image/frame selected from an approved plan.',
        },
        {
          key: 'nativeCudaRuntime',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Approved CUDA runtime for bounded tensor/image operations; no model weight required.',
        },
      ],
      warnings: [
        'Diagnostic-only private proof fixture; no GPU/runtime was started by this diagnostic.',
      ],
    }],
  }
  const proofPath = path.join(tempDir, 'harness-result.json')
  fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`)
  return proofPath
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

function gpuModelRequiresSourceImage(toolId) {
  return !['torch_torchvision', 'transformers'].includes(toolId)
}

function expectedMinimumPrivateRuntimeInputKeys(toolId) {
  const keys = ['outputDirectory', 'nativeCudaRuntime']
  if (gpuModelRequiresSourceImage(toolId)) keys.push('sourceImageLocalPath')
  if (toolId === 'sam2') keys.push('sam2CheckpointLocalPath')
  if (toolId === 'birefnet') keys.push('birefnetModelLocalPath')
  if (toolId === 'real_esrgan') keys.push('realEsrganModelLocalPath')
  if (toolId === 'rembg') keys.push('rembgModelLocalPath')
  if (toolId === 'transparent_background') {
    keys.push('transparentBackgroundCheckpointLocalPath')
  }
  return keys
}

function expectedHostRuntimeFlags(toolId) {
  const flags = [`--tool ${toolId}`, '--output-dir']
  if (gpuModelRequiresSourceImage(toolId)) flags.push('--source-image')
  if (toolId === 'sam2') flags.push('--sam2-checkpoint')
  if (toolId === 'birefnet') flags.push('--birefnet-model')
  if (toolId === 'real_esrgan') flags.push('--real-esrgan-model')
  if (toolId === 'rembg') flags.push('--rembg-model')
  if (toolId === 'transparent_background') {
    flags.push('--transparent-background-checkpoint')
  }
  return flags
}

function expectedControlledRouteFlags(toolId) {
  const flags = [
    `--scoped-gpu-tool ${toolId}`,
    '--scoped-gpu-runtime-container-image',
    '--scoped-gpu-runtime-container-platform',
    '--scoped-gpu-output-dir',
  ]
  if (gpuModelRequiresSourceImage(toolId)) flags.push('--scoped-gpu-source-image')
  if (toolId === 'sam2') flags.push('--scoped-gpu-sam2-checkpoint')
  if (toolId === 'birefnet') flags.push('--scoped-gpu-birefnet-model')
  if (toolId === 'real_esrgan') flags.push('--scoped-gpu-real-esrgan-model')
  if (toolId === 'rembg') flags.push('--scoped-gpu-rembg-model')
  if (toolId === 'transparent_background') {
    flags.push('--scoped-gpu-transparent-background-checkpoint')
  }
  return flags
}

function arrayMatches(actual, expected) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    expected.every((value) => actual.includes(value))
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
    gpuModelProofRefBridgeAcceptedTools: 0,
    gpuModelProofRefBridgeBlockedTools: 8,
    gpuModelBlockedWithReasonTools: 8,
    currentHostGpuProofBlockers: 0,
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
    fastestGpuModelUnlockCandidateTools: 1,
    privateLocalRuntimeProofResultSuppliedTools: 0,
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
    'gpuModelProofRefBridgeBlocksUntilPrivateProof',
    'strictCallableExecutableBlockedFailedContractCreated',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'agentCanSelectForPlanning',
    'agentCanExecuteToolsNow',
    'agentCanExecuteAnyControlledToolNow',
    'agentCanExecute13ControlledToolsNow',
    'agentCanExecute13NonGpuControlledToolsNow',
    'routeExecutionApprovedNow',
    'toolExecutionApprovedFor13ControlledToolsNow',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'gpuRuntimeShouldStartNow',
    'agentCanExecuteAll21ToolsNow',
    'agentCanExecuteAll21ControlledToolsNow',
    'agentCanExecuteGpuModelToolsNow',
    'currentHostGpuProofPreflightRequested',
    'currentHostEligibleForGpuProof',
    'privateLocalRuntimeProofResultSupplied',
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

  const executionScope = report.executionScope ?? {}
  const expectedScope = {
    agentCanSubmitControlledRequestsForAll21: true,
    agentCanExecuteAnyControlledToolNow: true,
    agentCanExecute13NonGpuControlledToolsNow: true,
    agentCanExecuteGpuModelToolsNow: false,
    agentCanExecuteAll21ControlledToolsNow: false,
    agentExecutableToolCountNow: 13,
    agentExecutableNonGpuToolCountNow: 13,
    agentExecutableGpuModelToolCountNow: 0,
    gpuModelBlockedToolCountNow: 8,
    currentHostGpuProofPreflightRequested: false,
    currentHostEligibleForGpuProof: false,
  }
  for (const [key, value] of Object.entries(expectedScope)) {
    if (executionScope[key] !== value) {
      fail(`${label}_execution_scope_mismatch:${key}:${executionScope[key]}`)
    }
  }
  if (!Array.isArray(executionScope.currentHostGpuProofBlockers)) {
    fail(`${label}_execution_scope_host_blockers_not_array`)
  } else if (executionScope.currentHostGpuProofBlockers.length !== 0) {
    fail(`${label}_execution_scope_default_host_blockers_not_empty`)
  }
  if (
    !String(executionScope.currentHostGpuProofPreflightCommand ?? '').includes(
      '--detect-host',
    )
  ) {
    fail(`${label}_execution_scope_missing_detect_host_command`)
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
      if (!String(row.nextExactCommand ?? '').includes(`--tool ${toolId}`)) {
        fail(`${label}_${toolId}_gpu_next_command_not_tool_scoped`)
      }
      if (!String(row.nextExactCommand ?? '').includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
        fail(`${label}_${toolId}_gpu_next_command_missing_result_out`)
      }
      if (!String(row.nextExactContainerCommand ?? '').includes('--runtime-backend docker_container')) {
        fail(`${label}_${toolId}_missing_gpu_container_command`)
      }
      if (!String(row.nextExactHostPythonCommand ?? '').includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
        fail(`${label}_${toolId}_host_python_command_missing_result_out`)
      }
      if (!String(row.nextExactContainerCommand ?? '').includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
        fail(`${label}_${toolId}_container_command_missing_result_out`)
      }
      if (!String(row.nextExactContainerCommand ?? '').includes('reeditpro/ai-graphics-gpu-worker:proof-local')) {
        fail(`${label}_${toolId}_gpu_container_command_not_canonical_image`)
      }
      if (row.nextExactContainerBuildCommand !== canonicalGpuWorkerProofImageBuildCommand) {
        fail(`${label}_${toolId}_gpu_container_build_command_mismatch`)
      }
      if (!String(row.nextExactHostPythonCommand ?? '').includes('--attempt-local-runtime')) {
        fail(`${label}_${toolId}_missing_gpu_host_python_command`)
      }
      const expectedInputKeys = expectedMinimumPrivateRuntimeInputKeys(toolId)
      if (!arrayMatches(row.minimumPrivateRuntimeInputKeys, expectedInputKeys)) {
        fail(`${label}_${toolId}_minimum_input_keys_mismatch:${JSON.stringify(row.minimumPrivateRuntimeInputKeys)}`)
      }
      for (const flag of expectedHostRuntimeFlags(toolId)) {
        if (!String(row.nextExactHostPythonCommand ?? '').includes(flag)) {
          fail(`${label}_${toolId}_host_python_command_missing:${flag}`)
        }
        if (!String(row.nextExactContainerCommand ?? '').includes(flag)) {
          fail(`${label}_${toolId}_container_command_missing:${flag}`)
        }
        if (!row.minimumHostRuntimeFlags?.some((value) => String(value).includes(flag))) {
          fail(`${label}_${toolId}_minimum_host_flags_missing:${flag}`)
        }
      }
      if (!gpuModelRequiresSourceImage(toolId)) {
        if (String(row.nextExactHostPythonCommand ?? '').includes('--source-image')) {
          fail(`${label}_${toolId}_host_python_command_has_unneeded_source_image`)
        }
        if (String(row.nextExactContainerCommand ?? '').includes('--source-image')) {
          fail(`${label}_${toolId}_container_command_has_unneeded_source_image`)
        }
        if (row.minimumPrivateRuntimeInputKeys?.includes('sourceImageLocalPath')) {
          fail(`${label}_${toolId}_minimum_inputs_include_unneeded_source_image`)
        }
      }
      if (
        !String(row.nextExactControlledRouteCommand ?? '').includes(
          'ai-graphics:external-agent-all21-controlled-route-execution-smoke',
        )
      ) {
        fail(`${label}_${toolId}_missing_gpu_controlled_route_command`)
      }
      if (!String(row.nextExactControlledRouteCommand ?? '').includes(`--scoped-gpu-tool ${toolId}`)) {
        fail(`${label}_${toolId}_controlled_route_command_not_tool_scoped`)
      }
      if (
        row.proofRefBridgeStatus !==
        'blocked_missing_private_local_runtime_proof_result'
      ) {
        fail(`${label}_${toolId}_proof_ref_bridge_status_mismatch:${row.proofRefBridgeStatus}`)
      }
      if (row.routeSubmissionReadyWithAcceptedPrivateProof !== false) {
        fail(`${label}_${toolId}_proof_ref_route_submission_unexpectedly_ready`)
      }
      if (
        !String(row.nextExactProofRefBridgeCommand ?? '').includes(
          'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge',
        )
      ) {
        fail(`${label}_${toolId}_missing_proof_ref_bridge_command`)
      }
      if (!String(row.nextExactProofRefBridgeCommand ?? '').includes('--local-runtime-proof-result')) {
        fail(`${label}_${toolId}_proof_ref_bridge_command_missing_private_result_flag`)
      }
      for (const flag of expectedControlledRouteFlags(toolId)) {
        if (!String(row.nextExactControlledRouteCommand ?? '').includes(flag)) {
          fail(`${label}_${toolId}_controlled_route_command_missing:${flag}`)
        }
        if (!row.minimumControlledRouteFlags?.some((value) => String(value).includes(flag))) {
          fail(`${label}_${toolId}_minimum_controlled_route_flags_missing:${flag}`)
        }
      }
      if (!gpuModelRequiresSourceImage(toolId)) {
        if (String(row.nextExactControlledRouteCommand ?? '').includes('--scoped-gpu-source-image')) {
          fail(`${label}_${toolId}_controlled_route_command_has_unneeded_source_image`)
        }
      }
      if (toolId === 'kornia') {
        if (row.fastestGpuModelUnlockCandidate !== true) {
          fail(`${label}_${toolId}_not_fastest_gpu_unlock_candidate`)
        }
        if (row.recommendedGpuProofBackend !== 'docker_container') {
          fail(`${label}_${toolId}_recommended_backend_not_container`)
        }
        if (!String(row.nextExactCommand ?? '').includes('--runtime-backend docker_container')) {
          fail(`${label}_${toolId}_next_command_not_container_first`)
        }
      } else if (row.fastestGpuModelUnlockCandidate !== false) {
        fail(`${label}_${toolId}_unexpected_fastest_gpu_unlock_candidate`)
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

function checkMountedControlledRouteSmoke(label, report) {
  if (report.decision !== 'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed') {
    fail(`${label}_decision_mismatch`)
  }
  if (report.status !== 'external_agent_all21_controlled_route_execution_passed_with_gpu_on_demand') {
    fail(`${label}_status_mismatch`)
  }
  if (report.routePath !== '/api/ai-graphics/external-beta/tool-call') {
    fail(`${label}_route_path_mismatch`)
  }

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
    normalizedExternalAgentToolCallResultTools: 21,
    normalizedExternalAgentCallableResultTools: 21,
    normalizedExternalAgentExecutableResultTools: 13,
    normalizedExternalAgentBlockedWithReasonResultTools: 8,
    normalizedExternalAgentFailedWithDiagnosticsResultTools: 0,
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
  }
  const counts = report.counts ?? {}
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) {
      fail(`${label}_count_mismatch:${key}:expected_${value}:got_${counts[key]}`)
    }
  }

  const requiredTrueBooleans = [
    'all21ControlledRouteExecutionSmokePassed',
    'all21ToolsCovered',
    'all21ToolsReturnedHttp200',
    'all21ControlledAdaptersInvoked',
    'cpuStaticControlledAdaptersExecuted',
    'browserRuntimeControlledAdaptersExecuted',
    'gpuModelControlledAdaptersInvoked',
    'normalizedExternalAgentExecutionStatesReturned',
    'normalizedExternalAgentToolCallResultsReturned',
    'normalizedExternalAgentToolCallResultsMatchStates',
    'normalizedExternalAgentToolCallResultsPreserveSafetyGates',
    'thirteenToolsReturnExecutableState',
    'eightGpuModelToolsReturnBlockedWithReasonState',
    'agentCanCallAll21ControlledRoutesNow',
    'agentCanExecuteRealRuntimeFor13ToolsNow',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
  ]
  const requiredFalseBooleans = [
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
  ]
  const booleans = report.booleans ?? {}
  for (const key of requiredTrueBooleans) {
    if (booleans[key] !== true) fail(`${label}_boolean_not_true:${key}`)
  }
  for (const key of requiredFalseBooleans) {
    if (booleans[key] !== false) fail(`${label}_boolean_not_false:${key}`)
  }

  const rows = Array.isArray(report.results) ? report.results : []
  if (rows.length !== 21) {
    fail(`${label}_result_count_mismatch:${rows.length}`)
    return
  }
  for (const toolId of allTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_route_result:${toolId}`)
      continue
    }
    const normalized = row.externalAgentToolCallResult ?? {}
    if (row.statusCode !== 200) fail(`${label}_${toolId}_status_not_200`)
    if (row.ok !== true) fail(`${label}_${toolId}_ok_not_true`)
    if (row.controlledAdapterInvokedNow !== true) {
      fail(`${label}_${toolId}_adapter_not_invoked`)
    }
    if (normalized.callable !== true) {
      fail(`${label}_${toolId}_normalized_callable_not_true`)
    }
    if (normalized.routeExecutionPerformed !== true) {
      fail(`${label}_${toolId}_normalized_route_execution_not_true`)
    }
    if (normalized.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_${toolId}_normalized_gpu_start_not_false`)
    }
    if (normalized.outputAccess?.publicArtifactCreated !== false) {
      fail(`${label}_${toolId}_normalized_public_artifact_not_false`)
    }
    if (normalized.outputAccess?.signedUrlCreated !== false) {
      fail(`${label}_${toolId}_normalized_signed_url_not_false`)
    }
    if (gpuModelTools.includes(toolId)) {
      if (row.externalAgentExecutionState !== 'blocked_with_reason') {
        fail(`${label}_${toolId}_gpu_state_not_blocked:${row.externalAgentExecutionState}`)
      }
      if (normalized.executable !== false) {
        fail(`${label}_${toolId}_normalized_gpu_executable_not_false`)
      }
      if (normalized.blockedWithReason !== true) {
        fail(`${label}_${toolId}_normalized_gpu_blocked_not_true`)
      }
      if (normalized.failedWithDiagnostics !== false) {
        fail(`${label}_${toolId}_normalized_gpu_failed_not_false`)
      }
      if (row.localGpuModelRuntimeExecutionPerformed !== false) {
        fail(`${label}_${toolId}_gpu_runtime_performed`)
      }
    } else {
      if (row.externalAgentExecutionState !== 'executable') {
        fail(`${label}_${toolId}_non_gpu_state_not_executable:${row.externalAgentExecutionState}`)
      }
      if (normalized.executable !== true) {
        fail(`${label}_${toolId}_normalized_non_gpu_executable_not_true`)
      }
      if (normalized.blockedWithReason !== false) {
        fail(`${label}_${toolId}_normalized_non_gpu_blocked_not_false`)
      }
      if (normalized.failedWithDiagnostics !== false) {
        fail(`${label}_${toolId}_normalized_non_gpu_failed_not_false`)
      }
      if (row.localPackageExecutionPerformed !== true) {
        fail(`${label}_${toolId}_local_package_not_executed`)
      }
      if (!row.outputSha256 || row.outputSha256.length !== 64) {
        fail(`${label}_${toolId}_missing_private_output_hash`)
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
const gpuProofRefBridge = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
)
const executionGate = json(
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
)

const sam2HarnessRow = Array.isArray(
  gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows,
)
  ? gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows.find(
    (row) => row.toolId === 'sam2',
  )
  : undefined
if (!sam2HarnessRow) {
  fail('gpu_harness_missing_sam2_row')
} else {
  const sam2NativeRequirement = Array.isArray(sam2HarnessRow.localInputRequirements)
    ? sam2HarnessRow.localInputRequirements.find(
      (entry) => entry.key === 'nativeCudaRuntime',
    )
    : undefined
  if (
    !String(sam2NativeRequirement?.description ?? '').includes(
      'one approved private source frame',
    )
  ) {
    fail('gpu_harness_sam2_missing_private_source_frame_requirement')
  }
  if (
    JSON.stringify(sam2HarnessRow).includes(
      'Current script uses an approved generated fixture only',
    )
  ) {
    fail('gpu_harness_sam2_still_describes_generated_fixture_only')
  }
}

const sam2RunnerSource = read('server/workers/masks/sam2-execution-runner.ts')
for (const requiredSam2Token of [
  'sam2_source_frame_missing',
  "'--source-image-path'",
  "APPROVED_PRIVATE_SOURCE_FRAME_ENABLED: 'true'",
  'privateSourceFrameUsed: true',
]) {
  if (!sam2RunnerSource.includes(requiredSam2Token)) {
    fail(`sam2_runner_missing_readiness_token:${requiredSam2Token}`)
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
]) {
  if (!sam2RuntimeSource.includes(requiredSam2RuntimeToken)) {
    fail(`sam2_runtime_missing_readiness_token:${requiredSam2RuntimeToken}`)
  }
}
if (sam2RuntimeSource.includes('create_fixture_frames')) {
  fail('sam2_runtime_still_uses_generated_fixture_frame_builder')
}

if (docs.fastestGpuModelUnlockCandidate?.toolId !== 'kornia') {
  fail('fastest_gpu_unlock_candidate_not_kornia')
}
if (
  docs.fastestGpuModelUnlockCandidate?.expectedCurrentHostBlockerWhenNoNvidiaGpuIsAttached !==
  'gpu_model_runtime_container_gpu_unavailable'
) {
  fail('fastest_gpu_unlock_candidate_missing_expected_gpu_unavailable_blocker')
}
if (
  !String(docs.fastestGpuModelUnlockCandidate?.nextExactCommand ?? '').includes(
    canonicalGpuWorkerProofImage,
  )
) {
  fail('fastest_gpu_unlock_candidate_not_using_canonical_image')
}
if (
  docs.fastestGpuModelUnlockCandidate?.nextExactContainerBuildCommand !==
  canonicalGpuWorkerProofImageBuildCommand
) {
  fail('fastest_gpu_unlock_candidate_container_build_command_mismatch')
}
if (
  !String(docs.fastestGpuModelUnlockCandidate?.nextExactCommand ?? '').includes(
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  )
) {
  fail('fastest_gpu_unlock_candidate_missing_result_out')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate?.nextExactControlledRouteCommand ?? '',
  ).includes('ai-graphics:external-agent-all21-controlled-route-execution-smoke')
) {
  fail('fastest_gpu_unlock_candidate_missing_controlled_route_command')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate?.nextExactProofRefBridgeCommand ?? '',
  ).includes('ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge')
) {
  fail('fastest_gpu_unlock_candidate_missing_proof_ref_bridge_command')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate?.nextExactProofRefBridgeCommand ?? '',
  ).includes('--local-runtime-proof-result')
) {
  fail('fastest_gpu_unlock_candidate_proof_ref_bridge_missing_private_result_flag')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate
      ?.nextExactReadinessWithPrivateProofCommand ?? '',
  ).includes('ai-graphics:external-agent-execution-readiness')
) {
  fail('fastest_gpu_unlock_candidate_missing_private_proof_readiness_command')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate
      ?.nextExactReadinessWithPrivateProofCommand ?? '',
  ).includes('--local-runtime-proof-result')
) {
  fail('fastest_gpu_unlock_candidate_readiness_command_missing_private_result_flag')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate
      ?.nextExactCurrentHostPreflightCommand ?? '',
  ).includes('--detect-host')
) {
  fail('fastest_gpu_unlock_candidate_missing_current_host_preflight_command')
}
for (const flag of [
  '--scoped-gpu-tool kornia',
  '--scoped-gpu-runtime-container-image',
  '--scoped-gpu-runtime-container-platform',
  '--scoped-gpu-output-dir',
  '--scoped-gpu-source-image',
]) {
  if (
    !String(
      docs.fastestGpuModelUnlockCandidate?.nextExactControlledRouteCommand ?? '',
    ).includes(flag)
  ) {
    fail(`fastest_gpu_unlock_candidate_controlled_route_command_missing:${flag}`)
  }
}

checkMountedControlledRouteSmoke('route_smoke', routeSmoke)
checkReport('docs', docs)
const live = JSON.parse(exec(`npm run --silent ${runScriptName}`))
checkReport('live', live)
const scopedKorniaProofPath = createScopedKorniaPrivateProofFixture()
const liveWithPrivateProof = execFileJson('npm', [
  'run',
  '--silent',
  runScriptName,
  '--',
  '--local-runtime-proof-result',
  scopedKorniaProofPath,
])
if (liveWithPrivateProof.status !== status) {
  fail(`synthetic_private_proof_status_mismatch:${liveWithPrivateProof.status}`)
}
if (liveWithPrivateProof.counts?.agentExecutableTools !== 13) {
  fail(`synthetic_private_proof_executable_count_mismatch:${liveWithPrivateProof.counts?.agentExecutableTools}`)
}
if (liveWithPrivateProof.counts?.gpuToolsWithValidRuntimeProof !== 0) {
  fail('synthetic_private_proof_gpu_valid_count_not_zero')
}
if (liveWithPrivateProof.counts?.gpuModelProofRefBridgeAcceptedTools !== 0) {
  fail('synthetic_private_proof_bridge_accepted_count_not_zero')
}
if (liveWithPrivateProof.counts?.gpuModelProofRefBridgeBlockedTools !== 8) {
  fail('synthetic_private_proof_bridge_blocked_count_not_eight')
}
if (liveWithPrivateProof.counts?.blockedWithReasonTools !== 7) {
  fail('synthetic_private_proof_blocked_count_not_seven')
}
if (liveWithPrivateProof.counts?.failedWithDiagnosticsTools !== 1) {
  fail('synthetic_private_proof_failed_count_not_one')
}
if (liveWithPrivateProof.counts?.gpuRuntimeShouldStartNowTools !== 0) {
  fail('synthetic_private_proof_readiness_started_gpu')
}
if (liveWithPrivateProof.booleans?.privateLocalRuntimeProofResultSupplied !== true) {
  fail('synthetic_private_proof_result_not_marked_supplied')
}
if (liveWithPrivateProof.booleans?.agentCanExecuteGpuModelToolsNow !== false) {
  fail('synthetic_private_proof_gpu_tools_marked_executable')
}
if (liveWithPrivateProof.booleans?.toolExecutionApprovedForGpuModelToolsNow !== false) {
  fail('synthetic_private_proof_gpu_tool_execution_marked_approved')
}
if (liveWithPrivateProof.booleans?.agentCanExecuteAll21ToolsNow !== false) {
  fail('synthetic_private_proof_claims_all21_executable')
}
if (liveWithPrivateProof.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('synthetic_private_proof_idle_gpu_start_claim')
}
const privateProofRows = Array.isArray(liveWithPrivateProof.toolReadinessRows)
  ? liveWithPrivateProof.toolReadinessRows
  : []
const privateProofKornia = privateProofRows.find((row) => row.toolId === 'kornia')
if (!privateProofKornia) {
  fail('synthetic_private_proof_missing_kornia_row')
} else {
  if (privateProofKornia.readinessState !== 'failed_with_diagnostics') {
    fail(`synthetic_private_proof_kornia_not_failed:${privateProofKornia.readinessState}`)
  }
  if (privateProofKornia.executable !== false) {
    fail('synthetic_private_proof_kornia_executable_true')
  }
  if (privateProofKornia.routeSubmissionReadyWithAcceptedPrivateProof !== false) {
    fail('synthetic_private_proof_kornia_route_submission_ready')
  }
  if (
    privateProofKornia.proofRefBridgeStatus !==
    'blocked_private_local_runtime_output_missing'
  ) {
    fail(`synthetic_private_proof_kornia_bridge_status:${privateProofKornia.proofRefBridgeStatus}`)
  }
  if (
    !String(privateProofKornia.blockingPrerequisite ?? '').includes(
      'proof bridge status: blocked_private_local_runtime_output_missing',
    )
  ) {
    fail('synthetic_private_proof_kornia_missing_bridge_blocker')
  }
  if (privateProofKornia.gpuRuntimeShouldStartNow !== false) {
    fail('synthetic_private_proof_kornia_idle_gpu_start_claim')
  }
  if (privateProofKornia.sourceGpuRuntimeShouldStartDuringScopedProof !== true) {
    fail('synthetic_private_proof_kornia_scoped_gpu_start_not_recorded')
  }
}
for (const row of privateProofRows.filter((item) => gpuModelTools.includes(item.toolId) && item.toolId !== 'kornia')) {
  if (row.readinessState !== 'blocked_with_reason') {
    fail(`synthetic_private_proof_unexpected_non_kornia_gpu_state:${row.toolId}:${row.readinessState}`)
  }
}
const liveHost = JSON.parse(exec(`npm run --silent ${runScriptName} -- --detect-host`))
if (liveHost.executionScope?.currentHostGpuProofPreflightRequested !== true) {
  fail('live_host_preflight_not_requested')
}
if (liveHost.booleans?.currentHostGpuProofPreflightRequested !== true) {
  fail('live_host_boolean_preflight_not_requested')
}
if (liveHost.sourceEvidence?.currentHostGpuProofPreflight?.accepted !== true) {
  fail('live_host_preflight_source_not_accepted')
}
if (
  typeof liveHost.executionScope?.currentHostEligibleForGpuProof !== 'boolean'
) {
  fail('live_host_eligible_not_boolean')
}
const liveHostBlockers = liveHost.executionScope?.currentHostGpuProofBlockers
if (!Array.isArray(liveHostBlockers)) {
  fail('live_host_blockers_not_array')
} else if (
  liveHost.executionScope.currentHostEligibleForGpuProof === false &&
  liveHostBlockers.length === 0
) {
  fail('live_host_ineligible_without_blockers')
}
if (
  liveHost.counts?.currentHostGpuProofBlockers !==
  (Array.isArray(liveHostBlockers) ? liveHostBlockers.length : undefined)
) {
  fail('live_host_blocker_count_mismatch')
}

const cli = read('server/cli/ai-graphics-external-agent-execution-readiness.ts')
for (const phrase of [
  '--local-runtime-proof-result',
  '--write-records cannot be combined with --local-runtime-proof-result',
  '--write-records cannot be combined with --detect-host',
  'hostDetectionReadinessCommand',
  'currentHostGpuProofPreflight',
  'currentHostEligibleForGpuProof',
  'mergeGpuHarnessWithPrivateProof',
  'runJsonFileCommand',
  'privateProofStatus',
  'nextExactReadinessWithPrivateProofCommand',
  'nextExactCurrentHostPreflightCommand',
]) {
  if (!cli.includes(phrase)) fail(`cli_missing_private_proof_phrase:${phrase}`)
}

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
if (gpuProofRefBridge.counts?.acceptedPrivateLocalRuntimeProofTools !== 0) {
  fail('proof_ref_bridge_default_accepted_private_proof')
}
if (gpuProofRefBridge.counts?.routeSubmissionReadyWithAcceptedPrivateProofTools !== 0) {
  fail('proof_ref_bridge_default_route_submission_ready')
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
  'Execution Scope',
  'Fastest GPU/Model Unlock Candidate',
  'Next controlled route command',
  'Next proof-ref bridge command',
  'Next direct readiness command with private proof',
  'Next current-host preflight command',
  'gpu_model_runtime_container_gpu_unavailable',
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
