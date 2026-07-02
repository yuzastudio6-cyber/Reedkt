import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks'
const status =
  'external_agent_gpu_model_proof_ref_route_caller_ready_for_eight_queue_admission_tools'
const runScriptName = 'ai-graphics:external-agent-gpu-model-proof-ref-route-caller'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-gpu-model-proof-ref-route-caller.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-gpu-model-proof-ref-route-caller:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-gpu-model-proof-ref-route-caller-diagnostics.mjs'
const routePath = '/api/ai-graphics/external-beta/tool-call'

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

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-gpu-model-proof-ref-route-caller.ts',
  'scripts/validation/ai-graphics-external-agent-gpu-model-proof-ref-route-caller-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.md',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.json',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'package.json',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuModelProofRefRouteCallerToolsNow: 8,
  modelWeightManifestRequiredTools: 5,
  nativeGpuRuntimeProofRefRequiredTools: 8,
  externalBetaPerToolRuntimeProofRefRequiredTools: 8,
  proofRefQueueAdmissionRequestEnvelopesPrepared: 8,
  expectedProofRefMockQueueAdmissionStatus202Tools: 8,
  sourceProofRefMockQueueAdmissionsAcceptedTools: 8,
  sourceMockWorkerClaimsCreated: 8,
  controlledDirectRouteCallableToolsNow: 13,
  combinedExternalAgentRouteReachableToolsWithCurrentContracts: 21,
  directlyExecutableControlledRouteToolsNow: 13,
  gpuModelQueueAdmissionOnlyToolsNow: 8,
  all21ExecutableNowTools: 0,
  liveQueueWritePerformedTools: 0,
  workerDispatchPerformedTools: 0,
  toolExecutionPerformedTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  modelWeightsLoadedTools: 0,
  publicArtifactCreatedTools: 0,
  signedUrlCreatedTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueBooleans = [
  'externalAgentGpuModelProofRefRouteCallerContractPrepared',
  'sourceGpuModelProofRefQueueAdmissionSmokeAccepted',
  'sourceControlledRouteCallerAccepted',
  'routeSchemaEnvelopeAccepted',
  'all21ToolsCoveredByCombinedCallerContracts',
  'all8GpuModelProofRefRouteCallerEnvelopesPrepared',
  'modelWeightManifestRefsRequiredWhereNeeded',
  'nativeGpuRuntimeProofRefsRequiredForAll8',
  'externalBetaPerToolRuntimeProofRefsRequiredForAll8',
  'agentCanSubmitGpuModelToolCallToQueueAdmissionNow',
  'agentCanClaimMockGpuModelWorkerLeaseNow',
  'combinedExternalAgentRouteReachableToolsWithCurrentContracts',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForAcceptedExternalBetaToolCall',
  'agentCanSelectForPlanning',
]

const falseBooleans = [
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteAll21ToolsNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'routeExecutionPerformedInThisLane',
  'backendQueueSubmissionApprovedNow',
  'backendQueueSubmissionPerformed',
  'liveQueueWriteApprovedNow',
  'liveQueueWritePerformed',
  'workerExecutionApprovedNow',
  'workerExecutionPerformed',
  'workerDispatchApprovedNow',
  'workerDispatchPerformed',
  'toolExecutionApprovedNow',
  'toolExecutionPerformed',
  'providerRuntimeApprovedNow',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimeApprovedNow',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimeApprovedNow',
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

const forbiddenPatterns = [
  /"agentCanExecuteGpuModelToolsNow"\s*:\s*true/i,
  /"agentCanExecuteAll21ToolsNow"\s*:\s*true/i,
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"backendQueueSubmissionPerformed"\s*:\s*true/i,
  /"liveQueueWritePerformed"\s*:\s*true/i,
  /"workerExecutionPerformed"\s*:\s*true/i,
  /"workerDispatchPerformed"\s*:\s*true/i,
  /"toolExecutionPerformed"\s*:\s*true/i,
  /"providerRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimeShouldStartNow"\s*:\s*true/i,
  /"modelWeightsDownloaded"\s*:\s*true/i,
  /"modelWeightsLoaded"\s*:\s*true/i,
  /"modelInferencePerformed"\s*:\s*true/i,
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

function parseJson(file) {
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
    maxBuffer: 180 * 1024 * 1024,
  })
}

function checkPackageJson() {
  const pkg = parseJson('package.json')
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
      if (JSON.stringify(pkg[section] ?? {}) !== JSON.stringify(headPkg[section] ?? {})) {
        fail(`package_dependency_section_changed:${section}`)
      }
    }
  } catch (error) {
    fail(`package_dependency_comparison_failed:${error.message}`)
  }
}

function checkPackageLockUnchanged() {
  try {
    exec('git diff --quiet -- package-lock.json')
  } catch {
    fail('package_lock_changed')
  }
}

function checkChangedFiles() {
  let changed = ''
  try {
    changed = exec('git diff --name-only HEAD')
  } catch (error) {
    fail(`git_diff_name_only_failed:${error.message}`)
    return
  }

  for (const file of changed.split(/\r?\n/).filter(Boolean)) {
    if (file === 'package-lock.json') fail('package_lock_changed_in_diff')
    if (file.includes('.local-artifacts')) fail(`local_artifact_changed:${file}`)
    if (generatedArtifactPattern.test(file)) fail(`generated_artifact_changed:${file}`)
  }
}

for (const file of requiredFiles) read(file)
checkPackageJson()
checkPackageLockUnchanged()
checkChangedFiles()

const report = parseJson(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json',
)
const markdown = read(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.md',
)
const sourceGpuProofRefQueue = parseJson(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.json',
)
const sourceControlledRouteCaller = parseJson(
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.json',
)

if (report.decision !== decision) fail('decision_mismatch')
if (report.status !== status) fail('status_mismatch')
if (
  sourceGpuProofRefQueue.decision !==
  'ai_graphics_external_beta_tool_call_route_gpu_model_proof_ref_queue_admission_smoke_passed'
) {
  fail('source_gpu_proof_ref_queue_decision_mismatch')
}
if (
  sourceGpuProofRefQueue.booleans?.all8GpuModelProofRefMockQueueAdmissionsAccepted !== true
) {
  fail('source_gpu_proof_ref_queue_not_all8')
}
if (
  sourceControlledRouteCaller.decision !==
  'ai_graphics_external_agent_controlled_route_caller_contract_prepared_for_thirteen_tools_with_gpu_model_blocks'
) {
  fail('source_controlled_route_caller_decision_mismatch')
}

for (const [key, value] of Object.entries(expectedCounts)) {
  if (report.counts?.[key] !== value) fail(`count_mismatch:${key}:${report.counts?.[key]}`)
}
for (const key of trueBooleans) {
  if (report.booleans?.[key] !== true) fail(`boolean_not_true:${key}`)
}
for (const key of falseBooleans) {
  if (report.booleans?.[key] !== false) fail(`boolean_not_false:${key}`)
}

if (
  !Array.isArray(report.gpuModelProofRefCallerRows) ||
  report.gpuModelProofRefCallerRows.length !== 8
) {
  fail('gpu_model_proof_ref_caller_rows_count_mismatch')
} else {
  const rowsByTool = new Map(
    report.gpuModelProofRefCallerRows.map((row) => [row.toolId, row]),
  )
  for (const toolId of gpuModelTools) {
    const row = rowsByTool.get(toolId)
    if (!row) {
      fail(`missing_gpu_model_proof_ref_caller_row:${toolId}`)
      continue
    }
    if (row.group !== 'gpu_model_proof_ref_queue_admission') fail(`group_mismatch:${toolId}`)
    if (row.routePath !== routePath) fail(`route_path_mismatch:${toolId}`)
    if (row.method !== 'POST') fail(`method_mismatch:${toolId}`)
    if (row.expectedHttpStatusIfInvokedWithProofRefs !== 202) {
      fail(`expected_status_mismatch:${toolId}`)
    }
    if (row.expectedQueueAdmissionMode !== 'mock_only_gpu_model_proof_ref') {
      fail(`queue_mode_mismatch:${toolId}`)
    }
    if (row.expectedWorkerType !== 'gpu_ai_worker') fail(`worker_type_mismatch:${toolId}`)
    if (row.routeMayCreateMockQueueJob !== true) fail(`mock_queue_job_not_allowed:${toolId}`)
    if (row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
      fail(`future_gpu_start_not_allowed:${toolId}`)
    }
    for (const forbidden of [
      'liveQueueWritePerformed',
      'workerDispatchPerformed',
      'toolExecutionPerformed',
      'gpuRuntimeShouldStartNow',
      'modelWeightsLoaded',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) {
      if (row[forbidden] !== false) fail(`row_forbidden_not_false:${toolId}:${forbidden}`)
    }
    if (modelWeightManifestRequiredTools.includes(toolId)) {
      if (row.modelWeightManifestRequired !== true) {
        fail(`model_weight_manifest_not_required:${toolId}`)
      }
    } else if (row.modelWeightManifestRequired !== false) {
      fail(`unexpected_model_weight_manifest_required:${toolId}`)
    }

    const envelope = row.requestEnvelope ?? {}
    if (envelope.toolId !== toolId) fail(`request_tool_mismatch:${toolId}`)
    if (envelope.capabilityId !== row.capabilityId) fail(`request_capability_mismatch:${toolId}`)
    for (const key of [
      'privateArtifactManifestRef',
      'toolRouteApprovalRef',
      'workerApprovalRef',
      'runtimeEnqueueApprovalRef',
      'ownerRuntimeApprovalRef',
      'nativeGpuRuntimeProofRef',
      'externalBetaPerToolRuntimeProofRef',
    ]) {
      if (!String(envelope[key] ?? '').startsWith('private://')) {
        fail(`request_private_ref_missing:${toolId}:${key}`)
      }
    }
    if (modelWeightManifestRequiredTools.includes(toolId)) {
      if (!String(envelope.modelWeightManifestRef ?? '').startsWith('private://')) {
        fail(`request_model_manifest_private_ref_missing:${toolId}`)
      }
    } else if (envelope.modelWeightManifestRef !== undefined) {
      fail(`unexpected_model_manifest_ref:${toolId}`)
    }
    if (envelope.payload?.rawPromptExecutionAllowed !== false) {
      fail(`request_raw_prompt_not_blocked:${toolId}`)
    }
    if (envelope.payload?.privateOutputOnly !== true) {
      fail(`request_private_output_not_true:${toolId}`)
    }
    if (envelope.payload?.gpuRuntimeShouldStartNow !== false) {
      fail(`request_gpu_start_not_false:${toolId}`)
    }
    if (envelope.payload?.toolExecutionPerformed !== false) {
      fail(`request_tool_execution_not_false:${toolId}`)
    }
  }
}

for (const toolId of gpuModelTools) {
  if (!markdown.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}
for (const phrase of [
  'eight GPU/model tools',
  'does not claim GPU/model tool execution is ready',
  'GPU stays cold',
  'live queue writes',
  'worker dispatch',
  'signed URLs',
  'public artifacts',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_phrase:${phrase}`)
}

for (const forbidden of forbiddenPatterns) {
  for (const file of [
    'server/cli/ai-graphics-external-agent-gpu-model-proof-ref-route-caller.ts',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.md',
  ]) {
    if (forbidden.test(read(file))) fail(`forbidden_claim:${file}:${forbidden}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  gpuModelProofRefRouteCallerToolsNow: 8,
  combinedExternalAgentRouteReachableToolsWithCurrentContracts: 21,
  directlyExecutableControlledRouteToolsNow: 13,
  gpuModelQueueAdmissionOnlyToolsNow: 8,
  agentCanExecuteGpuModelToolsNow: false,
  gpuRuntimeShouldStartNow: false,
  packageLockUnchanged: true,
}, null, 2))
