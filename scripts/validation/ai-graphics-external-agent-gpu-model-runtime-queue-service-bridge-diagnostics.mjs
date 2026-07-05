import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_gpu_model_runtime_queue_service_bridge_prepared_with_runtime_blocks'
const status =
  'external_agent_gpu_model_runtime_queue_service_bridge_ready_for_eight_tools'
const runScriptName =
  'ai-graphics:external-agent-gpu-model-runtime-queue-service-bridge'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-gpu-model-runtime-queue-service-bridge:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge-diagnostics.mjs'

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

function expectedFutureHandler(toolId) {
  if (toolId === 'torch_torchvision' || toolId === 'transformers') {
    return 'gpu_ai_worker_ai_graphics_model_runtime_foundation'
  }
  if (toolId === 'real_esrgan') {
    return 'gpu_ai_worker_enhancement_slowmotion_execution'
  }
  return 'gpu_ai_worker_mask_composition_execution'
}

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuModelRuntimeQueueServiceBridgeToolsNow: 8,
  sourceGpuModelProofRefRouteCallerTools: 8,
  sourceRuntimeQueueServicePayloadsReadyWithProvidedEvidence: 21,
  mockRuntimeQueueServiceBatchesCreated: 8,
  mockRuntimeQueueServiceJobsCreated: 8,
  mockWorkerClaimsCreated: 8,
  productionWorkerPayloadsPrepared: 8,
  productionWorkerRouterDryRunsCompleted: 8,
  productionWorkerSpecificHandlerRoutesCompleted: 8,
  modelRuntimeFoundationWorkerRoutesCompleted: 2,
  maskCompositionWorkerRoutesCompleted: 5,
  enhancementWorkerRoutesCompleted: 1,
  toolsValidatedThroughCanonicalReadiness: 8,
  gpuModelRuntimeTargetedTools: 8,
  liveQueueWritePerformedTools: 0,
  workerDispatchPerformedTools: 0,
  workerExecutionPerformedTools: 0,
  toolExecutionPerformedTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  modelWeightsDownloadedTools: 0,
  modelWeightsLoadedTools: 0,
  modelInferencePerformedTools: 0,
  publicArtifactCreatedTools: 0,
  signedUrlCreatedTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueBooleans = [
  'externalAgentGpuModelRuntimeQueueServiceBridgePrepared',
  'sourceGpuModelProofRefRouteCallerAccepted',
  'sourceRuntimeQueueServiceBridgeAccepted',
  'all8GpuModelProofRefRouteCallerRowsQueuedThroughRuntimeService',
  'all8MockRuntimeQueueJobsCreated',
  'all8MockWorkerClaimsCreated',
  'all8GpuModelProductionWorkerPayloadsPrepared',
  'all8GpuModelProductionWorkerRoutesDryRunCompleted',
  'all8GpuModelProductionWorkerRoutesHitSpecificHandlers',
  'twoFoundationWorkerRoutesHitModelRuntimeFoundationHandler',
  'fiveMaskWorkerRoutesHitMaskCompositionHandler',
  'oneEnhancementWorkerRouteHitEnhancementHandler',
  'all8ToolsValidatedThroughCanonicalReadiness',
  'usesExistingAiGraphicsRuntimeQueueService',
  'usesExistingRuntimeQueueServiceValidation',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForAcceptedExternalBetaToolCall',
  'agentCanSelectForPlanning',
  'agentCanSubmitGpuModelToolCallToRuntimeQueueAdmissionNow',
  'agentCanClaimMockGpuModelWorkerLeaseNow',
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

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge.ts',
  'scripts/validation/ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.md',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'server/tool-registry/ai-graphics-tool-call-readiness.ts',
  'server/workers/production/production-worker-runtime.ts',
  'server/workers/production/production-worker-router.ts',
  'server/workers/model-runtime-foundation/ai-graphics-foundation-execution-runner.ts',
  'server/workers/mask-composition/mask-composition-pipeline.ts',
  'server/workers/enhancement-slowmotion/enhancement-slowmotion-pipeline.ts',
  'package.json',
]

const forbiddenPatterns = [
  /"agentCanExecuteGpuModelToolsNow"\s*:\s*true/i,
  /"agentCanExecuteAll21ToolsNow"\s*:\s*true/i,
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"routeExecutionPerformedInThisLane"\s*:\s*true/i,
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
    maxBuffer: 180 * 1024 * 1024,
  })
}

function checkPackageJson() {
  const packageJson = json('package.json')
  if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
    fail('run_script_command_mismatch')
  }
  if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
    fail('diagnostic_script_command_mismatch')
  }

  try {
    const headPackageJson = JSON.parse(exec('git show HEAD:package.json'))
    for (const section of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      if (
        JSON.stringify(packageJson[section] ?? {}) !==
        JSON.stringify(headPackageJson[section] ?? {})
      ) {
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

const report = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.json',
)
const markdown = read(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.md',
)
const sourceCaller = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json',
)
const sourceRuntimeQueue = json(
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json',
)

if (report.decision !== decision) fail('decision_mismatch')
if (report.status !== status) fail('status_mismatch')
if (
  sourceCaller.decision !==
  'ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks'
) {
  fail('source_caller_decision_mismatch')
}
if (
  sourceRuntimeQueue.decision !==
  'ai_graphics_external_beta_runtime_queue_service_bridge_prepared_with_runtime_blocks'
) {
  fail('source_runtime_queue_decision_mismatch')
}

for (const [key, value] of Object.entries(expectedCounts)) {
  if (report.counts?.[key] !== value) {
    fail(`count_mismatch:${key}:${report.counts?.[key]}`)
  }
}
for (const key of trueBooleans) {
  if (report.booleans?.[key] !== true) fail(`boolean_not_true:${key}`)
}
for (const key of falseBooleans) {
  if (report.booleans?.[key] !== false) fail(`boolean_not_false:${key}`)
}

if (!Array.isArray(report.queueBridgeRows) || report.queueBridgeRows.length !== 8) {
  fail('queue_bridge_rows_count_mismatch')
} else {
  const rowsByTool = new Map(report.queueBridgeRows.map((row) => [row.toolId, row]))
  for (const toolId of gpuModelTools) {
    const row = rowsByTool.get(toolId)
    if (!row) {
      fail(`missing_queue_bridge_row:${toolId}`)
      continue
    }
    if (row.workerType !== 'gpu_ai_worker') fail(`worker_type_mismatch:${toolId}`)
    if (!String(row.runtimeTarget ?? '').startsWith('native_linux_amd64_nvidia_l4')) {
      fail(`runtime_target_mismatch:${toolId}:${row.runtimeTarget}`)
    }
    for (const privateKey of [
      'privateArtifactManifestRef',
      'nativeGpuRuntimeProofRef',
      'externalBetaPerToolRuntimeProofRef',
    ]) {
      if (!String(row[privateKey] ?? '').startsWith('private://')) {
        fail(`private_ref_missing:${toolId}:${privateKey}`)
      }
    }
    if (!row.mockRuntimeQueueBatchId) fail(`mock_batch_id_missing:${toolId}`)
    if (!row.mockRuntimeQueueJobId) fail(`mock_job_id_missing:${toolId}`)
    if (!row.mockWorkerClaimId) fail(`mock_worker_claim_id_missing:${toolId}`)
    if (row.mockRuntimeQueueServiceUsed !== true) fail(`mock_queue_service_not_used:${toolId}`)
    if (row.mockWorkerLeaseCreated !== true) fail(`mock_worker_lease_not_created:${toolId}`)
    if (row.productionWorkerStatus !== 'completed') {
      fail(`production_worker_status_mismatch:${toolId}:${row.productionWorkerStatus}`)
    }
    if (row.productionWorkerFutureHandler !== expectedFutureHandler(toolId)) {
      fail(`production_worker_future_handler_mismatch:${toolId}:${row.productionWorkerFutureHandler}`)
    }
    if (row.productionWorkerGatesPassed !== true) {
      fail(`production_worker_gates_not_passed:${toolId}`)
    }
    if (row.productionWorkerRouteableToSpecificHandler !== true) {
      fail(`production_worker_not_specific_handler:${toolId}`)
    }
    if (row.productionWorkerMockOnly !== true) {
      fail(`production_worker_not_mock_only:${toolId}`)
    }
    if (row.productionWorkerExecutionMode !== 'dry_run') {
      fail(`production_worker_execution_mode_mismatch:${toolId}:${row.productionWorkerExecutionMode}`)
    }
    if (row.productionWorkerToolExecutionPerformed !== false) {
      fail(`production_worker_tool_execution_not_false:${toolId}`)
    }

    const job = row.runtimeQueueJobInput ?? {}
    if (job.toolId !== toolId) fail(`job_tool_mismatch:${toolId}`)
    if (job.productionToolId !== row.productionToolId) fail(`job_production_tool_mismatch:${toolId}`)
    if (job.workerType !== row.workerType) fail(`job_worker_type_mismatch:${toolId}`)
    if (job.runtimeTarget !== row.runtimeTarget) fail(`job_runtime_target_mismatch:${toolId}`)
    if (!Array.isArray(job.capabilityIds) || !job.capabilityIds.includes(row.capabilityId)) {
      fail(`job_capability_missing:${toolId}`)
    }
    if (!String(job.privateArtifactManifestRef ?? '').startsWith('private://')) {
      fail(`job_private_artifact_missing:${toolId}`)
    }
    if (job.inputPayload?.gpuRuntimeShouldStartNow !== false) {
      fail(`job_gpu_start_not_false:${toolId}`)
    }
    if (job.inputPayload?.toolExecutionPerformed !== false) {
      fail(`job_tool_execution_not_false:${toolId}`)
    }
    if (job.inputPayload?.productionWorkerPayloadPrepared !== true) {
      fail(`job_production_worker_payload_not_prepared:${toolId}`)
    }
    if (job.inputPayload?.productionWorkerExpectedFutureHandler !== expectedFutureHandler(toolId)) {
      fail(`job_expected_handler_mismatch:${toolId}:${job.inputPayload?.productionWorkerExpectedFutureHandler}`)
    }

    const productionWorkerPayload = row.productionWorkerPayload ?? {}
    if (productionWorkerPayload.workerType !== 'gpu_ai_worker') {
      fail(`production_worker_payload_worker_mismatch:${toolId}`)
    }
    if (productionWorkerPayload.executionMode !== 'dry_run') {
      fail(`production_worker_payload_mode_mismatch:${toolId}`)
    }
    if (!Array.isArray(productionWorkerPayload.requestedToolIds) || productionWorkerPayload.requestedToolIds.length !== 1) {
      fail(`production_worker_payload_requested_tools_mismatch:${toolId}`)
    }
    if (productionWorkerPayload.requestedToolIds?.[0] !== row.productionToolId) {
      fail(`production_worker_payload_production_tool_mismatch:${toolId}`)
    }
    if (!productionWorkerPayload.approvedSnapshotId) {
      fail(`production_worker_payload_snapshot_missing:${toolId}`)
    }
    if (!productionWorkerPayload.creditReservationId) {
      fail(`production_worker_payload_credit_missing:${toolId}`)
    }
    if (!String(productionWorkerPayload.idempotencyKey ?? '').startsWith('prod-worker:')) {
      fail(`production_worker_payload_idempotency_missing:${toolId}`)
    }
    const metadata = productionWorkerPayload.metadata ?? {}
    if (metadata.aiGraphicsCanonicalToolId !== toolId) {
      fail(`production_worker_payload_canonical_tool_mismatch:${toolId}`)
    }
    if (metadata.gpuRuntimeOnDemandOnly !== true || metadata.noIdleGpuRuntimeApproved !== true) {
      fail(`production_worker_payload_gpu_policy_missing:${toolId}`)
    }
    if (metadata.startsOnlyForApprovedWorkerOrToolCall !== true || metadata.cpuFallbackAllowedForHeavyTools !== false) {
      fail(`production_worker_payload_activation_policy_mismatch:${toolId}`)
    }
    if (metadata.gpuRuntimeShouldStartNow !== false) {
      fail(`production_worker_payload_gpu_start_not_false:${toolId}`)
    }
    if (metadata.modelWeightsLoadedForDryRun !== false || metadata.modelInferencePerformedInDryRun !== false) {
      fail(`production_worker_payload_model_runtime_not_false:${toolId}`)
    }

    for (const forbidden of [
      'liveQueueWritePerformed',
      'workerDispatchPerformed',
      'workerExecutionPerformed',
      'toolExecutionPerformed',
      'gpuRuntimeShouldStartNow',
      'modelWeightsDownloaded',
      'modelWeightsLoaded',
      'modelInferencePerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) {
      if (row[forbidden] !== false) fail(`row_forbidden_not_false:${toolId}:${forbidden}`)
    }
  }
}

for (const phrase of [
  'eight external-agent GPU/model proof-ref request envelopes',
  'existing AI graphics runtime queue service',
  'mock-only runtime queue jobs',
  'mock worker leases',
  'dry-run production worker payload',
  'concrete worker handler',
  'model-runtime foundation',
  'mask/background composition',
  'enhancement',
  'GPU remains cold',
  'accepted live worker job claim starts it on demand',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_phrase:${phrase}`)
}

for (const toolId of gpuModelTools) {
  if (!markdown.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}

for (const forbidden of forbiddenPatterns) {
  for (const file of [
    'server/cli/ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge.ts',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.json',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.md',
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
  gpuModelRuntimeQueueServiceBridgeToolsNow: 8,
  mockRuntimeQueueServiceJobsCreated: 8,
  mockWorkerClaimsCreated: 8,
  agentCanExecuteGpuModelToolsNow: false,
  gpuRuntimeShouldStartNow: false,
  packageLockUnchanged: true,
}, null, 2))
