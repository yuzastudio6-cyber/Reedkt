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
  'externalBetaCallableInstallReadyNow',
  'agentCanExecuteToolsNow',
  'externalAgentExecutionAllowedNow',
  'apiRouteMountedNow',
  'apiRouteExecutionApprovedNow',
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
  'source21ToolProperInstallAuditAccepted',
  'sourceExternalBetaCallableRequestAdmissionAccepted',
  'sourceExternalBetaApiRouteMountReadinessAccepted',
  'sourceExternalBetaControlledOnDemandStatusBridgeAccepted',
  'properInstallAuditAccepted',
  'all21ToolsProperlyInstalledForPlannedSurface',
  'installAuditSeparatesPlannedSurfaceFromRuntimeCallable',
  'controlledOnDemandExternalBetaReadyWithProvidedEvidence',
  'controlledOnDemandWorkerPathReadyButDirectAgentExecutionBlocked',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'externalBetaCallableCandidatesWithProvidedEvidence',
  'externalBetaCallableRequestAdmissionReadyWithProvidedEvidence',
  'routeMountReadyWithProvidedEvidence',
  'routeMountPreparedButNotMounted',
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
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
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

function runBlockedReadinessCases() {
  const output = execFileSync(
    'npx',
    [
      'tsx',
      '-e',
      [
        "import { listAiGraphicsExternalBetaToolCallBlockedReadinessCases } from './server/routes/ai-graphics-external-beta-tool-call-routes.ts'",
        'console.log(JSON.stringify(listAiGraphicsExternalBetaToolCallBlockedReadinessCases()))',
      ].join('; '),
    ],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    },
  )
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
    if (row.properlyInstalledForPlannedSurface !== true) {
      fail(`${label}_${row.toolId}_proper_install_not_true`)
    }
    if (row.externalBetaCallableInstallReadyNow !== false) {
      fail(`${label}_${row.toolId}_external_beta_callable_install_not_false`)
    }
    if (row.runtimeReadyNow !== false) {
      fail(`${label}_${row.toolId}_runtime_ready_not_false`)
    }
    if (!row.installSurface) {
      fail(`${label}_${row.toolId}_install_surface_missing`)
    }
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
const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capability_count_not_12')
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.counts?.properlyInstalledForPlannedSurfaceTools !== 21) {
  fail('docs_properly_installed_for_planned_surface_not_21')
}
if (docs.counts?.runtimeProofPassedButToolCallBlockedTools !== 13) {
  fail('docs_runtime_proof_passed_blocked_not_13')
}
if (docs.counts?.nativeGpuRuntimeProofPendingTools !== 8) {
  fail('docs_native_gpu_runtime_proof_pending_not_8')
}
if (docs.counts?.modelWeightManifestPendingTools !== 5) {
  fail('docs_model_weight_manifest_pending_not_5')
}
if (docs.counts?.externalBetaCallableInstallReadyNowTools !== 0) {
  fail('docs_external_beta_callable_install_ready_not_0')
}
if (docs.counts?.controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence !== 21) {
  fail('docs_controlled_on_demand_ready_not_21')
}
if (docs.counts?.controlledOnDemandExternalBetaCallableToolsWithProvidedEvidence !== 21) {
  fail('docs_controlled_on_demand_callable_not_21')
}
if (docs.counts?.controlledOnDemandRuntimeReadyForToolCallToolsWithProvidedEvidence !== 21) {
  fail('docs_controlled_on_demand_runtime_ready_not_21')
}
if (docs.counts?.disabledRouteBlockedDetailCasesWithProvidedEvidence !== 21) {
  fail('docs_disabled_route_blocked_detail_cases_not_21')
}
if (docs.counts?.externalAgentExecutableNowTools !== 0) fail('docs_executable_now_not_0')
if (docs.counts?.apiRouteMountReadyToolsWithProvidedEvidence !== 21) {
  fail('docs_route_mount_ready_tools_not_21')
}
if (docs.counts?.apiRouteMountedNowTools !== 0) {
  fail('docs_route_mounted_now_tools_not_0')
}
assertToolCoverage('docs', docs.tools)
assertRuntimeRows('docs', docs.tools)
assertTrueBooleans('docs', docs.booleans)
assertFalseBooleans('docs', docs.booleans)

for (const phrase of [
  'fail-closed',
  '21',
  'GPU startup as on-demand only',
  'route-mount readiness evidence',
  'proper-install audit',
  'properlyInstalledForPlannedSurfaceTools: `21`',
  'externalBetaCallableInstallReadyNowTools: `0`',
  'controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence: `21`',
  'Representative disabled route blocked-detail cases covered: `21`',
  'direct agent execution remains blocked',
  'tool/capability-specific blocked details',
  'apiRouteMountedNow=false',
  'exit code `2`',
  'agentCanExecuteToolsNow=false',
]) {
  if (!docsMd.includes(phrase)) fail(`docs_md_missing:${phrase}`)
}

for (const phrase of [
  'evaluateAiGraphicsToolCallPlan',
  'buildAiGraphicsExternalBetaToolCallBlockedDetails',
  'listAiGraphicsExternalBetaToolCallBlockedReadinessCases',
  'requestAcceptedForPlanningMetadata',
  'planEvaluationDecision',
  'requestedToolsAcceptedForPlanning',
  'selectedPlanningTools',
  'missingProofBeforeExecution',
  'missingExecutionGates',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!routeSource.includes(phrase)) fail(`route_source_missing:${phrase}`)
}

const blockedReadinessCases = runBlockedReadinessCases()
if (!Array.isArray(blockedReadinessCases)) {
  fail('blocked_readiness_cases_not_array')
} else {
  if (blockedReadinessCases.length !== 21) {
    fail(`blocked_readiness_cases_count_not_21:${blockedReadinessCases.length}`)
  }
  const seenTools = new Set()
  let gpuStartAllowedCases = 0
  for (const item of blockedReadinessCases) {
    const request = item.request ?? {}
    const details = item.blockedDetails ?? {}
    seenTools.add(request.toolId)
    if (details.requestAcceptedForPlanningMetadata !== true) {
      fail(`blocked_case_not_planning_accepted:${request.toolId}`)
    }
    if (details.toolId !== request.toolId) {
      fail(`blocked_case_tool_mismatch:${request.toolId}`)
    }
    if (details.capabilityId !== request.capabilityId) {
      fail(`blocked_case_capability_mismatch:${request.toolId}`)
    }
    if (details.planEvaluationDecision !== 'execution_request_blocked') {
      fail(`blocked_case_decision_not_blocked:${request.toolId}`)
    }
    if (!Array.isArray(details.selectedPlanningTools) ||
        !details.selectedPlanningTools.some((tool) => tool.toolId === request.toolId)) {
      fail(`blocked_case_missing_selected_tool:${request.toolId}`)
    }
    if (!Array.isArray(details.requestedToolsAcceptedForPlanning) ||
        !details.requestedToolsAcceptedForPlanning.includes(request.toolId)) {
      fail(`blocked_case_missing_accepted_tool:${request.toolId}`)
    }
    if (!Array.isArray(details.missingExecutionGates) ||
        !details.missingExecutionGates.includes('Tool Route execution approval is required') ||
        !details.missingExecutionGates.includes('Worker execution approval is required') ||
        !details.missingExecutionGates.includes('runtime-specific proof must be complete before execution')) {
      fail(`blocked_case_missing_execution_gates:${request.toolId}`)
    }
    if (!Array.isArray(details.missingProofBeforeExecution) ||
        details.missingProofBeforeExecution.length === 0) {
      fail(`blocked_case_missing_proof_empty:${request.toolId}`)
    }
    if (details.controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence !== 21) {
      fail(`blocked_case_controlled_ready_not_21:${request.toolId}`)
    }
    if (details.controlledOnDemandWorkerPathReadyButDirectAgentExecutionBlocked !== true) {
      fail(`blocked_case_direct_block_not_true:${request.toolId}`)
    }
    for (const key of [
      'directAgentToolExecutionApprovedNow',
      'routeExecutionApprovedNow',
      'queueWriteApprovedNow',
      'workerEnqueueApprovedNow',
      'workerDispatchApprovedNow',
      'toolExecutionApprovedNow',
      'gpuRuntimeShouldStartNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ]) {
      if (details[key] !== false) {
        fail(`blocked_case_${key}_not_false:${request.toolId}`)
      }
    }
    const expectedGpuStartAllowed = gpuTools.has(request.toolId)
    if (details.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== expectedGpuStartAllowed) {
      fail(`blocked_case_gpu_start_allowed_mismatch:${request.toolId}`)
    }
    if (expectedGpuStartAllowed) gpuStartAllowedCases += 1
  }
  for (const toolId of allTools) {
    if (!seenTools.has(toolId)) fail(`blocked_case_missing_tool:${toolId}`)
  }
  if (gpuStartAllowedCases !== 8) {
    fail(`blocked_case_gpu_start_allowed_count_not_8:${gpuStartAllowedCases}`)
  }
}

for (const forbidden of [
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"externalAgentExecutionAllowedNow"\s*:\s*true/i,
  /"apiRouteMountedNow"\s*:\s*true/i,
  /"apiRouteExecutionApprovedNow"\s*:\s*true/i,
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
if (missingSourceReport.status !== 'missing_21_tool_proper_install_audit') {
  fail('missing_source_status_mismatch')
}
if (missingSourceReport.executionAllowedNow !== false) fail('missing_source_execution_not_false')
assertFalseBooleans('missing_source_report', missingSourceReport.booleans)

const acceptedSourceReport = runGate([
  '--proper-install-audit-packet',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  '--external-beta-callable-request-admission-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.json',
  '--external-beta-api-route-mount-readiness-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.json',
  '--external-beta-controlled-on-demand-status-bridge-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json',
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
if (acceptedSourceReport.properlyInstalledForPlannedSurfaceTools !== 21) {
  fail('accepted_report_proper_install_tools_not_21')
}
if (acceptedSourceReport.runtimeProofPassedButToolCallBlockedTools !== 13) {
  fail('accepted_report_runtime_proof_passed_blocked_not_13')
}
if (acceptedSourceReport.nativeGpuRuntimeProofPendingTools !== 8) {
  fail('accepted_report_native_gpu_pending_not_8')
}
if (acceptedSourceReport.modelWeightManifestPendingTools !== 5) {
  fail('accepted_report_model_manifest_pending_not_5')
}
if (acceptedSourceReport.externalBetaCallableInstallReadyNowTools !== 0) {
  fail('accepted_report_external_beta_callable_install_not_0')
}
if (acceptedSourceReport.controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence !== 21) {
  fail('accepted_report_controlled_ready_tools_not_21')
}
if (acceptedSourceReport.controlledOnDemandExternalBetaCallableToolsWithProvidedEvidence !== 21) {
  fail('accepted_report_controlled_callable_tools_not_21')
}
if (acceptedSourceReport.controlledOnDemandRuntimeReadyForToolCallToolsWithProvidedEvidence !== 21) {
  fail('accepted_report_controlled_runtime_tools_not_21')
}
if (acceptedSourceReport.externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence !== 1) {
  fail('accepted_report_request_admission_tools_not_1')
}
if (acceptedSourceReport.apiRouteMountReadyToolsWithProvidedEvidence !== 21) {
  fail('accepted_report_route_mount_ready_tools_not_21')
}
if (acceptedSourceReport.apiRouteMountedNowTools !== 0) {
  fail('accepted_report_route_mounted_now_tools_not_0')
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
    '--proper-install-audit-packet',
    'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
    '--external-beta-callable-request-admission-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.json',
    '--external-beta-api-route-mount-readiness-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-readiness.json',
    '--external-beta-controlled-on-demand-status-bridge-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json',
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
  properlyInstalledForPlannedSurfaceTools:
    acceptedSourceReport.properlyInstalledForPlannedSurfaceTools,
  externalBetaCallableInstallReadyNowTools:
    acceptedSourceReport.externalBetaCallableInstallReadyNowTools,
  controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence:
    acceptedSourceReport.controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence,
  externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence:
    acceptedSourceReport.externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence,
  apiRouteMountReadyToolsWithProvidedEvidence:
    acceptedSourceReport.apiRouteMountReadyToolsWithProvidedEvidence,
  apiRouteMountedNowTools: acceptedSourceReport.apiRouteMountedNowTools,
  executionAllowedNow: acceptedSourceReport.executionAllowedNow,
  requireGoBlockedExitCode: requireGo.status,
  agentCanExecuteToolsNow: acceptedSourceReport.booleans.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: acceptedSourceReport.booleans.gpuRuntimeShouldStartNow,
  packageLockChanged: false,
}, null, 2))
