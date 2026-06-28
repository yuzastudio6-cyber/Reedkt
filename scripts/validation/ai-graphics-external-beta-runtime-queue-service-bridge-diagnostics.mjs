import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const toolRouteRuntimeProofScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof'
const toolRouteRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-route-runtime-proof.ts'
const toolRouteRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof:diagnostics'
const toolRouteRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-route-runtime-proof-diagnostics.mjs'
const perToolRuntimeProofScriptName =
  'ai-graphics:external-beta-per-tool-runtime-proof'
const perToolRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-per-tool-runtime-proof.ts'
const perToolRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-per-tool-runtime-proof:diagnostics'
const perToolRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-per-tool-runtime-proof-diagnostics.mjs'
const nativeGpuProofCollectionScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection'
const nativeGpuProofCollectionScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-native-gpu-proof-collection.ts'
const nativeGpuProofCollectionDiagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection:diagnostics'
const nativeGpuProofCollectionDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-collection-diagnostics.mjs'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-runtime-queue-service-bridge'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-runtime-queue-service-bridge.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-runtime-queue-service-bridge:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-runtime-queue-service-bridge-diagnostics.mjs'

const toolProfiles = [
  ['torch_torchvision', 'torch_torchvision', 'model_runtime_foundation', 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['transformers', 'transformers', 'model_runtime_foundation', 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['sam2', 'sam2', 'subject_segmentation', 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_sam2_runtime', true],
  ['birefnet', 'birefnet', 'background_removal', 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_birefnet_runtime', true],
  ['real_esrgan', 'real_esrgan', 'upscaling', 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_real_esrgan_runtime', true],
  ['kornia', 'kornia', 'tensor_image_ops', 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['rembg', 'rembg', 'background_removal', 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['transparent_background', 'transparent_background', 'background_removal', 'gpu_ai_worker', 'native_linux_amd64_nvidia_l4_gpu_worker', true],
  ['d3', 'd3', 'chart_overlay', 'render_worker', 'node_cpu_static', false],
  ['echarts', 'echarts', 'data_visualization', 'render_worker', 'browser_chart_runtime_later', false],
  ['vega_lite', 'vega_lite', 'data_visualization', 'cpu_analysis_worker', 'node_cpu_static', false],
  ['vega', 'vega', 'data_visualization', 'cpu_analysis_worker', 'node_cpu_static', false],
  ['satori', 'satori', 'svg_graphics', 'render_worker', 'node_cpu_static', false],
  ['svgdotjs_svg_js', 'svgdotjs_svg_js', 'svg_graphics', 'render_worker', 'node_cpu_static', false],
  ['viz_js', 'viz_js', 'diagram_graphics', 'render_worker', 'node_cpu_static', false],
  ['lottie_web', 'lottie', 'animation_overlay', 'render_worker', 'browser_animation_runtime_later', false],
  ['animejs', 'animejs', 'animation_overlay', 'render_worker', 'browser_animation_runtime_later', false],
  ['three_js', 'three_js', 'webgl_3d_scene', 'render_worker', 'browser_canvas_webgl_runtime_later', false],
  ['pixi_js', 'pixijs', 'canvas_scene', 'render_worker', 'browser_canvas_webgl_runtime_later', false],
  ['konva', 'konva', 'canvas_scene', 'render_worker', 'browser_canvas_webgl_runtime_later', false],
  ['babylonjs', 'babylon_js', 'webgl_3d_scene', 'render_worker', 'browser_canvas_webgl_runtime_later', false],
]

const allTools = toolProfiles.map(([toolId]) => toolId)
const gpuTools = toolProfiles.filter((profile) => profile[5] === true).map(([toolId]) => toolId)

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'serviceRoleQueueTransactionApprovedNow',
  'liveQueueWriteApprovedNow',
  'liveJobBatchInsertApprovedNow',
  'liveJobInsertApprovedNow',
  'liveWorkerClaimInsertApprovedNow',
  'liveWorkerEventInsertApprovedNow',
  'liveAuditEventInsertApprovedNow',
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
  'backendQueueSubmissionPerformed',
  'serviceRoleTransactionPerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreated',
  'workerDispatchPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${filePath}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(filePath) {
  try {
    return JSON.parse(read(filePath))
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function buildLocalQueueStoragePacket(profile) {
  const [toolId, productionToolId, capabilityId, workerType, runtimeTarget, gpu] = profile
  const workspaceId = 'workspace-fixture'
  const projectId = 'project-fixture'
  const approvedSnapshotId = 'approved_snapshot_external_beta_fixture'
  const creditReservationId = 'credit_reservation_external_beta_fixture'
  const toolExecutionPlanId = `tool-execution-plan-fixture-${toolId}`
  const jobId = `external-beta-job-${toolId}`
  const sourceLocalJobId = `mock-job-${toolId}`
  const sourceLocalBatchId = `mock-job-batch-${toolId}`
  const idempotencyKey = `ai-graphics:external-beta:${workspaceId}:${projectId}:${toolId}`
  const privateArtifactManifestRef = `private://ai-graphics/external-beta/${toolId}/artifact-manifest.json`
  const sourceQueueSubmissionEnvelope = {
    toolId,
    productionToolId,
    workerType,
    runtimeTarget,
    capabilityId,
    queueName: 'ai-graphics-external-beta-worker-jobs',
    productionWorkerJobPayload: {
      jobId,
      workspaceId,
      projectId,
      approvedSnapshotId,
      creditReservationId,
      toolExecutionPlanId,
      workerType,
      requestedToolIds: [productionToolId],
      storageReferenceIds: [privateArtifactManifestRef],
      idempotencyKey,
      executionMode: 'production_blocked',
      metadata: {
        serviceRoleTransactionPerformed: false,
        workerDispatchPerformed: false,
        gpuRuntimeShouldStartNow: false,
      },
    },
    sourceAdapterPayloadReadyWithProvidedEvidence: true,
    submissionEnvelopeShapeValid: true,
    submissionEnvelopeReadyWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    gpuRuntimeShouldStartNow: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
  const envelope = {
    toolId,
    productionToolId,
    workerType,
    runtimeTarget,
    capabilityId,
    queueName: sourceQueueSubmissionEnvelope.queueName,
    transactionId: `external-beta-service-role-queue-tx-${jobId}`,
    serviceRoleQueueTransactionRef: 'external-beta-service-role://queue-transaction',
    serviceRoleRpcSchemaRef: 'external-beta-service-role://rpc-schema/v1',
    enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs',
    claimRpcName: 'claim_ai_graphics_tool_runtime_job',
    workerEventRpcName: 'record_ai_graphics_worker_event',
    auditEventRpcName: 'record_ai_graphics_audit_event',
    sourceQueueSubmissionEnvelope,
    jobBatchRowCandidate: {
      batchId: `external-beta-ai-graphics-batch-${workspaceId}-${projectId}`,
      workspaceId,
      projectId,
      queueName: sourceQueueSubmissionEnvelope.queueName,
      jobCount: 1,
      status: 'prepared_not_inserted',
      liveInsertPerformed: false,
    },
    jobRowCandidate: {
      jobId,
      jobType: 'ai_graphics_tool_runtime',
      workspaceId,
      projectId,
      approvedSnapshotId,
      creditReservationId,
      toolExecutionPlanId,
      workerType,
      runtimeTarget,
      idempotencyKey,
      status: 'prepared_not_inserted',
      liveInsertPerformed: false,
    },
    serviceRoleTransactionEnvelopeReadyWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    gpuRuntimeShouldStartNow: false,
    serviceRoleTransactionPerformed: false,
    liveQueueWriteApprovedNow: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
  const sourceTransaction = {
    decision: 'external_beta_service_role_queue_transaction_envelope_ready',
    sourceDecision: 'ai_graphics_external_beta_service_role_queue_transaction_envelope_prepared_with_runtime_blocks',
    capabilityId,
    requestedToolId: toolId,
    executionRequested: true,
    externalBetaServiceRoleQueueTransactionEnvelope: envelope,
    externalBetaServiceRoleQueueTransactionEnvelopeReadyWithProvidedEvidence: true,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      serviceRoleTransactionPerformed: false,
      liveQueueWriteApprovedNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
  return {
    decision: 'external_beta_local_queue_storage_mock_record_ready',
    sourceDecision: 'ai_graphics_external_beta_local_queue_storage_mock_write_prepared_with_runtime_blocks',
    sourceExternalBetaServiceRoleQueueTransactionDecision:
      'ai_graphics_external_beta_service_role_queue_transaction_envelope_prepared_with_runtime_blocks',
    capabilityId,
    requestedToolId: toolId,
    executionRequested: true,
    sourceExternalBetaServiceRoleQueueTransaction: sourceTransaction,
    sourceExternalBetaServiceRoleQueueTransactionAccepted: true,
    missingLocalQueueStorageControls: [],
    externalBetaLocalQueueStorageControlsSatisfied: true,
    externalBetaLocalQueueStorageRecordReadyWithProvidedEvidence: true,
    externalBetaLocalQueueStorageRecord: {
      toolId,
      productionToolId,
      workerType,
      runtimeTarget,
      capabilityId,
      sourceTransactionId: envelope.transactionId,
      sourceJobId: jobId,
      jobBatchId: sourceLocalBatchId,
      jobId: sourceLocalJobId,
      jobType: 'ai_graphics_tool_runtime',
      approvedSnapshotId,
      creditReservationId,
      privateArtifactManifestRef,
      localQueueStatus: 'queued',
      jobBatchMockOnly: true,
      jobRecordMockOnly: true,
      jobServiceWarningCount: 2,
      sourceServiceRoleTransactionReadyWithProvidedEvidence: true,
      localQueueRecordReadyWithProvidedEvidence: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
      gpuRuntimeShouldStartNow: false,
      canWriteSupabaseJobNow: false,
      canCreateWorkerClaimNow: false,
      canCreateWorkerLeaseNow: false,
      canDispatchWorkerNow: false,
      canExecuteToolNow: false,
    },
    localMockJobBatchRecordsCreatedNow: 1,
    localMockJobRecordsCreatedNow: 1,
    liveSupabaseJobWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      externalBetaLocalQueueStoragePrepared: true,
      sourceExternalBetaServiceRoleQueueTransactionAccepted: true,
      externalBetaLocalQueueStorageControlsSatisfied: true,
      externalBetaLocalQueueStorageRecordReadyWithProvidedEvidence: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      usesExistingJobServiceBoundary: true,
      jobBatchMockOnly: true,
      jobRecordMockOnly: true,
      aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit: true,
      approvedSnapshotRefAccepted: true,
      creditReservationRefAccepted: true,
      privateArtifactManifestOnly: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      liveJobBatchInsertApprovedNow: false,
      liveJobInsertApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
      liveWorkerEventInsertApprovedNow: false,
      liveAuditEventInsertApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-runtime-queue-service-bridge.ts',
  'server/cli/ai-graphics-external-beta-runtime-queue-service-bridge.ts',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'server/tool-registry/ai-graphics-external-beta-local-queue-storage.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.md',
  'docs/tool-intelligence/ai-graphics/external-beta-local-queue-storage.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.md')
const source = read('server/tool-registry/ai-graphics-external-beta-runtime-queue-service-bridge.ts')
const cli = read('server/cli/ai-graphics-external-beta-runtime-queue-service-bridge.ts')
const queueService = read('server/services/ai-graphics-tool-runtime-queue-service.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-runtime-queue-service-bridge'")) {
  fail('server_registry_index_missing_external_beta_runtime_queue_service_bridge_export')
}
if (docs.decision !== 'ai_graphics_external_beta_runtime_queue_service_bridge_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
for (const phrase of [
  'createAiGraphicsToolRuntimeQueueService',
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  "E2E_RUNTIME_MODE: 'mock'",
  "SUPABASE_SERVICE_ROLE_KEY: ''",
]) {
  if (!source.includes(phrase) && !queueService.includes(phrase)) fail(`missing_source_phrase:${phrase}`)
}
if (!queueService.includes('validateCanonicalAiGraphicsRuntimeJob')) {
  fail('queue_service_missing_canonical_validation')
}
for (const flag of [
  '--external-beta-local-queue-storage-packet',
  '--external-beta-runtime-queue-service-ref',
  '--external-beta-runtime-queue-rpc-schema-ref',
  '--external-beta-worker-claim-readiness-ref',
  '--external-beta-queue-telemetry-ref',
]) {
  if (!cli.includes(flag)) fail(`cli_missing_flag:${flag}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  runtimeQueueServicePayloadsReadyWithProvidedEvidence: 21,
  canonicalRuntimeQueueServiceValidationPassedTools: 21,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  heavyToolsIncorrectlyTargetingCpu: 0,
  localMockRuntimeQueueServiceBatchesCreatedInDiagnostic: 21,
  localMockRuntimeQueueServiceJobsCreatedInDiagnostic: 21,
  liveSupabaseQueueWritesNow: 0,
  liveWorkerClaimRowsNow: 0,
  liveWorkerLeasesCreatedNow: 0,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  gpuRuntimeShouldStartNow: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_gate_not_false:${key}`)
}
if (docs.booleans?.usesExistingAiGraphicsRuntimeQueueService !== true) {
  fail('docs_missing_runtime_queue_service_bridge_true')
}
if (!docsMd.includes('createAiGraphicsToolRuntimeQueueService')) {
  fail('docs_md_missing_runtime_queue_service')
}
if (!docsMd.includes('No idle GPU runtime is approved')) {
  fail('docs_md_missing_no_idle_gpu_policy')
}
if (!scorecard.includes('AI graphics external beta local queue storage decision')) {
  fail('scorecard_missing_previous_local_queue_storage_checkpoint')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-runtime-queue-service-bridge-'))
const results = []
for (const profile of toolProfiles) {
  const [toolId] = profile
  const packetPath = writeJson(
    path.join(tmpRoot, `${toolId}-local-queue-storage.json`),
    buildLocalQueueStoragePacket(profile),
  )
  const output = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-local-queue-storage-packet',
    packetPath,
    '--execution-requested',
    '--external-beta-runtime-queue-service-ref',
    'external-beta-runtime-queue://service',
    '--external-beta-runtime-queue-rpc-schema-ref',
    'external-beta-runtime-queue://rpc-schema/v1',
    '--external-beta-worker-claim-readiness-ref',
    'external-beta-runtime-queue://worker-claim-readiness',
    '--external-beta-queue-telemetry-ref',
    'external-beta-runtime-queue://telemetry',
  ]), `ready_${toolId}_runtime_queue_service_bridge`)
  results.push([profile, output])
}

const readyResults = results.filter(([, output]) => (
  output.decision === 'external_beta_runtime_queue_service_payload_ready' &&
  output.runtimeQueueServicePayloadReadyWithProvidedEvidence === true &&
  output.externalBetaRuntimeQueueServiceBridgeRecord?.queueServiceMockOnly === true &&
  output.externalBetaRuntimeQueueServiceBridgeRecord?.insertedJobCount === 1 &&
  output.booleans?.canonicalRuntimeQueueServiceValidationPassed === true
))
if (readyResults.length !== 21) fail(`all_tool_ready_count:${readyResults.length}`)
const gpuReady = results.filter(([profile, output]) => (
  profile[5] === true &&
  output.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
  output.externalBetaRuntimeQueueServiceBridgeRecord?.workerType === 'gpu_ai_worker'
))
if (gpuReady.length !== 8) fail(`gpu_ready_count:${gpuReady.length}`)
const heavyCpuFallbacks = results.filter(([profile, output]) => (
  profile[5] === true &&
  output.externalBetaRuntimeQueueServiceBridgeRecord?.workerType !== 'gpu_ai_worker'
))
if (heavyCpuFallbacks.length !== 0) fail(`heavy_cpu_fallbacks:${heavyCpuFallbacks.length}`)

const planningBridge = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'planning_bridge')
if (planningBridge.decision !== 'planning_metadata_selected') {
  fail(`planning_decision:${planningBridge.decision}`)
}
const blockedMissingLocal = parseJsonOutput(runNpm(runScriptName, [
  '--execution-requested',
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'blocked_missing_local_queue_storage')
if (blockedMissingLocal.decision !== 'missing_external_beta_local_queue_storage') {
  fail(`blocked_missing_local_decision:${blockedMissingLocal.decision}`)
}
const sam2PacketPath = path.join(tmpRoot, 'sam2-local-queue-storage.json')
const blockedMissingControls = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-local-queue-storage-packet',
  sam2PacketPath,
  '--execution-requested',
  '--external-beta-runtime-queue-service-ref',
  'external-beta-runtime-queue://service',
]), 'blocked_missing_controls')
if (blockedMissingControls.decision !== 'missing_external_beta_runtime_queue_service_controls') {
  fail(`blocked_missing_controls_decision:${blockedMissingControls.decision}`)
}

const sam2Result = results.find(([profile]) => profile[0] === 'sam2')?.[1] ?? {}
const d3Result = results.find(([profile]) => profile[0] === 'd3')?.[1] ?? {}
if (sam2Result.externalBetaRuntimeQueueServiceBridgeRecord?.runtimeTarget !== 'native_linux_amd64_nvidia_l4_sam2_runtime') {
  fail('sam2_runtime_target_unexpected')
}
if (d3Result.externalBetaRuntimeQueueServiceBridgeRecord?.runtimeTarget !== 'node_cpu_static') {
  fail('d3_runtime_target_unexpected')
}
if (sam2Result.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
  fail('sam2_gpu_not_start_allowed_for_future_job')
}
if (d3Result.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('d3_gpu_start_allowed_unexpected')
}
if (sam2Result.externalBetaRuntimeQueueServiceBridgeRecord?.enqueueRpcName !== 'enqueue_ai_graphics_tool_runtime_jobs') {
  fail('sam2_enqueue_rpc_unexpected')
}
if (sam2Result.externalBetaRuntimeQueueServiceBridgeRecord?.claimRpcName !== 'claim_ai_graphics_tool_runtime_job') {
  fail('sam2_claim_rpc_unexpected')
}

for (const [profile, output] of results) {
  const [toolId] = profile
  if (output.localMockRuntimeQueueServiceBatchesCreatedNow !== 1) fail(`${toolId}_local_runtime_batch_count`)
  if (output.localMockRuntimeQueueServiceJobsCreatedNow !== 1) fail(`${toolId}_local_runtime_job_count`)
  if (output.liveSupabaseQueueWritesNow !== 0) fail(`${toolId}_live_supabase_queue_writes`)
  if (output.liveWorkerClaimRowsNow !== 0) fail(`${toolId}_live_worker_claim_rows`)
  if (output.liveWorkerDispatchesNow !== 0) fail(`${toolId}_live_dispatches`)
  if (output.externalBetaReadyNowTools !== 0) fail(`${toolId}_external_beta_ready`)
  if (output.productionReadyNowTools !== 0) fail(`${toolId}_production_ready`)
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false) fail(`${toolId}_false_gate_not_false:${key}`)
  }
}

const combinedText = [
  JSON.stringify(docs),
  docsMd,
  source,
  cli,
  queueService,
  scorecard,
  JSON.stringify(results.map(([, output]) => output)),
].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /routeExecutionApprovedNow["'`\s:]*true/i,
  /workerExecutionApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /serviceRoleTransactionPerformed["'`\s:]*true/i,
  /backendQueueSubmissionPerformed["'`\s:]*true/i,
  /supabaseMutationPerformed["'`\s:]*true/i,
  /workerDispatchPerformed["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /browserWebglCanvasRuntimePerformed["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /gcsUploadPerformed["'`\s:]*true/i,
  /publicArtifactCreated["'`\s:]*true/i,
  /signedUrlCreated["'`\s:]*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

if (git(['diff', '--', 'package-lock.json'])) fail('package_lock_changed')

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch {
  basePackage = {}
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff": "tsx server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-handoff-diagnostics.mjs",`,
  `+    "${perToolRuntimeProofScriptName}": "${perToolRuntimeProofScriptCommand}",`,
  `+    "${perToolRuntimeProofDiagnosticScriptName}": "${perToolRuntimeProofDiagnosticScriptCommand}",`,
  `+    "${nativeGpuProofCollectionScriptName}": "${nativeGpuProofCollectionScriptCommand}",`,
  `+    "${nativeGpuProofCollectionDiagnosticScriptName}": "${nativeGpuProofCollectionDiagnosticScriptCommand}",`,
  `+    "${toolRouteRuntimeProofScriptName}": "${toolRouteRuntimeProofScriptCommand}",`,
  `+    "${toolRouteRuntimeProofDiagnosticScriptName}": "${toolRouteRuntimeProofDiagnosticScriptCommand}",`,
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-readiness": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-readiness.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-private-artifact-manifest": "tsx server/cli/ai-graphics-external-beta-private-artifact-manifest.ts",',
  '+    "ai-graphics:external-beta-private-artifact-manifest:diagnostics": "node scripts/validation/ai-graphics-external-beta-private-artifact-manifest-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /(generated|render|renders|media|browser|canvas|webgl|public-artifact|signed-url|\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.gif|\.svg)$/i.test(file))) {
  fail('generated_output_staged')
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  toolsCovered: allTools.length,
  gpuToolsCovered: gpuTools.length,
  planningBridgeDecision: planningBridge.decision,
  blockedMissingLocalQueueStorageDecision: blockedMissingLocal.decision,
  blockedMissingControlsDecision: blockedMissingControls.decision,
  runtimeQueueServicePayloadsReadyWithProvidedEvidence: readyResults.length,
  canonicalRuntimeQueueServiceValidationPassedTools: readyResults.length,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: gpuReady.length,
  heavyToolsIncorrectlyTargetingCpu: heavyCpuFallbacks.length,
  sam2RuntimeTarget: sam2Result.externalBetaRuntimeQueueServiceBridgeRecord?.runtimeTarget,
  d3RuntimeTarget: d3Result.externalBetaRuntimeQueueServiceBridgeRecord?.runtimeTarget,
  sam2QueueServiceMockOnly: sam2Result.externalBetaRuntimeQueueServiceBridgeRecord?.queueServiceMockOnly,
  sam2EnqueueRpcName: sam2Result.externalBetaRuntimeQueueServiceBridgeRecord?.enqueueRpcName,
  sam2ClaimRpcName: sam2Result.externalBetaRuntimeQueueServiceBridgeRecord?.claimRpcName,
  liveSupabaseQueueWritesNow: sam2Result.liveSupabaseQueueWritesNow,
  liveWorkerClaimRowsNow: sam2Result.liveWorkerClaimRowsNow,
  liveWorkerDispatchesNow: sam2Result.liveWorkerDispatchesNow,
  gpuRuntimeShouldStartNow: sam2Result.booleans?.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: sam2Result.externalBetaReadyNowTools,
  productionReadyNowTools: sam2Result.productionReadyNowTools,
  agentCanExecuteToolsNow: sam2Result.booleans?.agentCanExecuteToolsNow,
}, null, 2))
