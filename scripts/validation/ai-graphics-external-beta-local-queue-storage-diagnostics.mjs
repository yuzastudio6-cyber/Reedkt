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
const runScriptName = 'ai-graphics:external-beta-local-queue-storage'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-local-queue-storage.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-local-queue-storage:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-local-queue-storage-diagnostics.mjs'

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

function buildSourceTransactionPacket(profile) {
  const [toolId, productionToolId, capabilityId, workerType, runtimeTarget, gpu] = profile
  const jobId = `external-beta-job-${toolId}`
  const workspaceId = 'workspace-fixture'
  const projectId = 'project-fixture'
  const approvedSnapshotId = 'approved_snapshot_external_beta_fixture'
  const creditReservationId = 'credit_reservation_external_beta_fixture'
  const toolExecutionPlanId = `tool-execution-plan-fixture-${toolId}`
  const idempotencyKey = `ai-graphics:external-beta:${workspaceId}:${projectId}:${toolId}`
  const privateArtifactManifestRef = `private://ai-graphics/external-beta/${toolId}/artifact-manifest.json`
  const payload = {
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
      sourceGatewayTraceId: `trace-fixture-${toolId}`,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
  const queueName = 'ai-graphics-external-beta-worker-jobs'
  const sourceQueueSubmissionEnvelope = {
    toolId,
    productionToolId,
    workerType,
    runtimeTarget,
    capabilityId,
    queueName,
    backendQueueSubmissionRef: 'external-beta-queue://submission',
    queueSubmissionSchemaRef: 'external-beta-queue://submission-schema/v1',
    serviceRoleTransactionEnvelopeRef: 'external-beta-service-role://transaction-envelope',
    queueWriteAuthorizationRef: 'external-beta-service-role://queue-write-authorization',
    sourceAdapterCandidateRef: `external-beta-gateway://worker-enqueue-candidate/${toolId}`,
    productionWorkerJobPayload: payload,
    queueBatchCandidate: {
      batchId: `external-beta-ai-graphics-batch-${workspaceId}-${projectId}`,
      workspaceId,
      projectId,
      queueName,
      jobCount: 1,
      status: 'prepared_not_submitted',
      serviceRoleRequired: true,
      liveInsertPerformed: false,
    },
    queueJobCandidate: {
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
      payload,
      status: 'prepared_not_submitted',
      liveInsertPerformed: false,
    },
    queueAuditCandidate: {
      auditEventRef: `external-beta-queue://audit-event/${toolId}`,
      eventName: 'external_beta_ai_graphics_queue_submission_prepared',
      toolId,
      capabilityId,
      queueName,
      traceId: `trace-fixture-${toolId}`,
      liveInsertPerformed: false,
    },
    sourceAdapterPayloadReadyWithProvidedEvidence: true,
    submissionEnvelopeShapeValid: true,
    submissionEnvelopeReadyWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    gpuRuntimeShouldStartNow: false,
    backendQueueSubmissionApprovedNow: false,
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
    queueName,
    transactionId: `external-beta-service-role-queue-tx-${jobId}`,
    serviceRoleQueueTransactionRef: 'external-beta-service-role://queue-transaction',
    serviceRoleRpcSchemaRef: 'external-beta-service-role://rpc-schema/v1',
    enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs',
    claimRpcName: 'claim_ai_graphics_tool_runtime_job',
    workerEventRpcName: 'record_ai_graphics_worker_event',
    auditEventRpcName: 'record_ai_graphics_audit_event',
    jobBatchTableRef: 'service-role-table://job_batches',
    jobTableRef: 'service-role-table://jobs',
    workerClaimTableRef: 'service-role-table://worker_job_claims',
    workerEventTableRef: 'service-role-table://worker_events',
    auditEventTableRef: 'service-role-table://audit_events',
    rollbackRef: 'external-beta-service-role://rollback-plan',
    sourceQueueSubmissionEnvelope,
    jobBatchRowCandidate: {
      batchId: sourceQueueSubmissionEnvelope.queueBatchCandidate.batchId,
      workspaceId,
      projectId,
      queueName,
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
    workerClaimInputCandidate: {
      jobId,
      workerType,
      runtimeTarget,
      claimMode: 'future_worker_claim_only',
      status: 'prepared_not_claimed',
      liveClaimPerformed: false,
    },
    workerEventCandidates: [
      {
        jobId,
        eventName: 'external_beta_ai_graphics_job_prepared_for_enqueue',
        status: 'prepared_not_inserted',
        liveInsertPerformed: false,
      },
      {
        jobId,
        eventName: 'external_beta_ai_graphics_job_waiting_for_worker_claim',
        status: 'prepared_not_inserted',
        liveInsertPerformed: false,
      },
    ],
    auditEventCandidate: {
      auditEventRef: `external-beta-queue://audit-event/${toolId}`,
      eventName: 'external_beta_ai_graphics_service_role_transaction_prepared',
      toolId,
      capabilityId,
      traceId: `trace-fixture-${toolId}`,
      status: 'prepared_not_inserted',
      liveInsertPerformed: false,
    },
    sourceQueueSubmissionEnvelopeReadyWithProvidedEvidence: true,
    serviceRoleTransactionEnvelopeShapeValid: true,
    serviceRoleTransactionEnvelopeReadyWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    gpuRuntimeShouldStartNow: false,
    canRunServiceRoleTransactionNow: false,
    canInsertJobBatchNow: false,
    canInsertJobNow: false,
    canCreateWorkerClaimNow: false,
    canInsertWorkerEventNow: false,
    canInsertAuditEventNow: false,
    canDispatchWorkerNow: false,
    canExecuteToolNow: false,
  }
  return {
    decision: 'external_beta_service_role_queue_transaction_envelope_ready',
    sourceDecision:
      'ai_graphics_external_beta_service_role_queue_transaction_envelope_prepared_with_runtime_blocks',
    sourceExternalBetaBackendQueueSubmissionDecision:
      'ai_graphics_external_beta_backend_queue_submission_envelope_prepared_with_runtime_blocks',
    capabilityId,
    requestedToolId: toolId,
    executionRequested: true,
    sourceExternalBetaBackendQueueSubmissionAccepted: true,
    missingServiceRoleTransactionControls: [],
    externalBetaServiceRoleTransactionControlsSatisfied: true,
    externalBetaServiceRoleQueueTransactionEnvelopeReadyWithProvidedEvidence: true,
    externalBetaServiceRoleQueueTransactionEnvelope: envelope,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    liveServiceRoleTransactionsNow: 0,
    liveJobBatchRowsInsertedNow: 0,
    liveJobRowsInsertedNow: 0,
    liveWorkerClaimRowsInsertedNow: 0,
    liveWorkerEventRowsInsertedNow: 0,
    liveAuditEventRowsInsertedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      serviceRoleTransactionPerformed: false,
      liveQueueWriteApprovedNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-local-queue-storage.ts',
  'server/cli/ai-graphics-external-beta-local-queue-storage.ts',
  'server/tool-registry/ai-graphics-external-beta-service-role-queue-transaction.ts',
  'server/services/job-service.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-local-queue-storage.json',
  'docs/tool-intelligence/ai-graphics/external-beta-local-queue-storage.md',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-transaction.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-backend-queue-storage-readiness.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-local-queue-storage.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-local-queue-storage.md')
const source = read('server/tool-registry/ai-graphics-external-beta-local-queue-storage.ts')
const cli = read('server/cli/ai-graphics-external-beta-local-queue-storage.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const jobServiceSource = read('server/services/job-service.ts')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-local-queue-storage'")) {
  fail('server_registry_index_missing_external_beta_local_queue_storage_export')
}
if (docs.decision !== 'ai_graphics_external_beta_local_queue_storage_mock_write_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (!jobServiceSource.includes('ai_graphics_tool_runtime')) fail('job_service_missing_ai_graphics_job_type')
if (!source.includes('createJobService')) fail('source_does_not_use_create_job_service')
if (!source.includes("E2E_RUNTIME_MODE: 'mock'")) fail('source_does_not_force_mock_runtime')
if (!source.includes("SUPABASE_SERVICE_ROLE_KEY: ''")) fail('source_does_not_clear_service_role_key')

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  defaultLocalQueueReadyExamples: 0,
  allToolLocalQueueRecordsReadyWithProvidedEvidence: 21,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  localMockJobBatchRecordsCreatedInDiagnostic: 21,
  localMockJobRecordsCreatedInDiagnostic: 21,
  liveSupabaseJobWritesNow: 0,
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
  if (!docs.gpuRuntimeTargetedTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const gate of [
  'accepted external-beta service-role queue transaction packet',
  'external beta local queue storage reference',
  'external beta mock job service reference',
  'external beta local queue storage schema reference',
  'external beta local queue storage isolation reference',
]) {
  if (!docs.requiredLocalQueueStorageControls?.includes(gate)) {
    fail(`docs_missing_local_queue_control:${gate}`)
  }
}
for (const key of [
  'externalBetaLocalQueueStoragePrepared',
  'sourceExternalBetaServiceRoleQueueTransactionAccepted',
  'externalBetaLocalQueueStorageControlsSatisfied',
  'externalBetaLocalQueueStorageRecordReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'usesExistingJobServiceBoundary',
  'jobBatchMockOnly',
  'jobRecordMockOnly',
  'aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit',
  'approvedSnapshotRefAccepted',
  'creditReservationRefAccepted',
  'privateArtifactManifestOnly',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}
for (const [id, expected] of Object.entries({
  planning_sam2_local_queue_storage: 'planning_metadata_selected',
  blocked_sam2_local_queue_storage_missing_transaction:
    'missing_external_beta_service_role_queue_transaction',
  blocked_sam2_local_queue_storage_missing_isolation_ref:
    'missing_external_beta_local_queue_storage_controls',
  accepted_future_sam2_local_queue_storage_record:
    'external_beta_local_queue_storage_mock_record_ready',
  accepted_future_d3_local_queue_storage_record:
    'external_beta_local_queue_storage_mock_record_ready',
})) {
  const entry = docs.exampleEvaluations?.find((example) => example.id === id)
  if (!entry) fail(`docs_missing_example:${id}`)
  if (entry?.decision !== expected) fail(`docs_example_decision_unexpected:${id}:${entry?.decision}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_LOCAL_QUEUE_STORAGE_DECISION',
  'evaluateAiGraphicsExternalBetaLocalQueueStorage',
  'sourceExternalBetaServiceRoleQueueTransactionPacket',
  'createMockQueueServiceContext',
  'createJobService',
  'ai_graphics_tool_runtime',
  'localMockRecordsOnly: true',
  'noSupabaseWrites: true',
  'canWriteSupabaseJobNow: false',
  'canCreateWorkerClaimNow: false',
  'canCreateWorkerLeaseNow: false',
  'canDispatchWorkerNow: false',
  'canExecuteToolNow: false',
  'supabaseMutationPerformed: false',
  'workerDispatchPerformed: false',
  'gpuRuntimeShouldStartNow: false',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-service-role-queue-transaction-packet',
  '--external-beta-local-queue-storage-ref',
  '--external-beta-mock-job-service-ref',
  '--external-beta-local-queue-storage-schema-ref',
  '--external-beta-local-queue-storage-isolation-ref',
  'evaluatorOnly: true',
  'supabaseMutationPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'External-Beta Local Queue Storage',
  'existing `createJobService` boundary',
  'All-tool local queue records ready with provided evidence in diagnostics: `21`',
  'Live Supabase job writes now: `0`',
  'GPU remains on-demand only',
  'If no worker claim and dispatch occurs, no GPU runtime should be running',
]) {
  if (!docsMd.includes(needle)) fail(`markdown_missing:${needle}`)
}
for (const needle of [
  'AI graphics external beta local queue storage decision',
  'existing `createJobService` boundary',
  'all 21 AI graphics tools as mock-only',
  '`liveQueueWriteApprovedNow=false`',
  '`supabaseMutationPerformed=false`',
  '`workerDispatchPerformed=false`',
]) {
  if (!scorecard.includes(needle)) fail(`scorecard_missing:${needle}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-local-queue-storage-'))
const results = []
for (const profile of toolProfiles) {
  const [toolId] = profile
  const packetPath = writeJson(
    path.join(tmpRoot, `${toolId}-service-role-transaction.json`),
    buildSourceTransactionPacket(profile),
  )
  const output = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-service-role-queue-transaction-packet',
    packetPath,
    '--execution-requested',
    '--external-beta-local-queue-storage-ref',
    'external-beta-local-queue://storage',
    '--external-beta-mock-job-service-ref',
    'external-beta-local-queue://mock-job-service',
    '--external-beta-local-queue-storage-schema-ref',
    'external-beta-local-queue://schema/v1',
    '--external-beta-local-queue-storage-isolation-ref',
    'external-beta-local-queue://isolated-diagnostics',
  ]), `ready_${toolId}_local_queue_storage`)
  results.push([profile, output])
}

const readyResults = results.filter(([, output]) => (
  output.decision === 'external_beta_local_queue_storage_mock_record_ready' &&
  output.externalBetaLocalQueueStorageRecordReadyWithProvidedEvidence === true &&
  output.externalBetaLocalQueueStorageRecord?.jobRecordMockOnly === true &&
  output.externalBetaLocalQueueStorageRecord?.localQueueStatus === 'queued'
))
if (readyResults.length !== 21) fail(`all_tool_ready_count:${readyResults.length}`)
function gpuRuntimeStartAllowedForFutureAcceptedJob(output) {
  return output.externalBetaLocalQueueStorageRecord
    ?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
    output.booleans?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true
}
const gpuReady = results.filter(([profile, output]) => (
  profile[5] === true &&
  gpuRuntimeStartAllowedForFutureAcceptedJob(output) &&
  output.externalBetaLocalQueueStorageRecord?.workerType === 'gpu_ai_worker'
))
if (gpuReady.length !== 8) fail(`gpu_ready_count:${gpuReady.length}`)
const heavyCpuFallbacks = results.filter(([profile, output]) => (
  profile[5] === true &&
  output.externalBetaLocalQueueStorageRecord?.workerType !== 'gpu_ai_worker'
))
if (heavyCpuFallbacks.length !== 0) fail(`heavy_cpu_fallbacks:${heavyCpuFallbacks.length}`)

const planningStorage = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'planning_storage')
if (planningStorage.decision !== 'planning_metadata_selected') {
  fail(`planning_decision:${planningStorage.decision}`)
}
const blockedMissingTransaction = parseJsonOutput(runNpm(runScriptName, [
  '--execution-requested',
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'blocked_missing_transaction')
if (blockedMissingTransaction.decision !== 'missing_external_beta_service_role_queue_transaction') {
  fail(`blocked_missing_transaction_decision:${blockedMissingTransaction.decision}`)
}
const sam2PacketPath = path.join(tmpRoot, 'sam2-service-role-transaction.json')
const blockedMissingIsolation = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-service-role-queue-transaction-packet',
  sam2PacketPath,
  '--execution-requested',
  '--external-beta-local-queue-storage-ref',
  'external-beta-local-queue://storage',
]), 'blocked_missing_isolation')
if (blockedMissingIsolation.decision !== 'missing_external_beta_local_queue_storage_controls') {
  fail(`blocked_missing_isolation_decision:${blockedMissingIsolation.decision}`)
}

const sam2Result = results.find(([profile]) => profile[0] === 'sam2')?.[1] ?? {}
const d3Result = results.find(([profile]) => profile[0] === 'd3')?.[1] ?? {}
if (sam2Result.externalBetaLocalQueueStorageRecord?.runtimeTarget !== 'native_linux_amd64_nvidia_l4_sam2_runtime') {
  fail('sam2_runtime_target_unexpected')
}
if (d3Result.externalBetaLocalQueueStorageRecord?.runtimeTarget !== 'node_cpu_static') {
  fail('d3_runtime_target_unexpected')
}
if (!gpuRuntimeStartAllowedForFutureAcceptedJob(sam2Result)) fail('sam2_gpu_not_start_allowed_for_future_job')
if (gpuRuntimeStartAllowedForFutureAcceptedJob(d3Result)) fail('d3_gpu_start_allowed_unexpected')

for (const [profile, output] of results) {
  const [toolId] = profile
  if (output.localMockJobBatchRecordsCreatedNow !== 1) fail(`${toolId}_local_batch_count`)
  if (output.localMockJobRecordsCreatedNow !== 1) fail(`${toolId}_local_job_count`)
  if (output.liveSupabaseJobWritesNow !== 0) fail(`${toolId}_live_supabase_writes`)
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
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge": "tsx server/cli/ai-graphics-external-beta-runtime-queue-service-bridge.ts",',
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-runtime-queue-service-bridge-diagnostics.mjs",',
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
  planningStorageDecision: planningStorage.decision,
  blockedMissingTransactionDecision: blockedMissingTransaction.decision,
  blockedMissingIsolationDecision: blockedMissingIsolation.decision,
  allToolLocalQueueRecordsReadyWithProvidedEvidence: readyResults.length,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: gpuReady.length,
  heavyToolsIncorrectlyTargetingCpu: heavyCpuFallbacks.length,
  sam2RuntimeTarget: sam2Result.externalBetaLocalQueueStorageRecord?.runtimeTarget,
  d3RuntimeTarget: d3Result.externalBetaLocalQueueStorageRecord?.runtimeTarget,
  sam2LocalQueueStatus: sam2Result.externalBetaLocalQueueStorageRecord?.localQueueStatus,
  sam2JobRecordMockOnly: sam2Result.externalBetaLocalQueueStorageRecord?.jobRecordMockOnly,
  sam2GpuRuntimeStartAllowedForFutureAcceptedJob:
    gpuRuntimeStartAllowedForFutureAcceptedJob(sam2Result),
  liveSupabaseJobWritesNow: sam2Result.liveSupabaseJobWritesNow,
  liveWorkerDispatchesNow: sam2Result.liveWorkerDispatchesNow,
  gpuRuntimeShouldStartNow: sam2Result.booleans?.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: sam2Result.externalBetaReadyNowTools,
  productionReadyNowTools: sam2Result.productionReadyNowTools,
  agentCanExecuteToolsNow: sam2Result.booleans?.agentCanExecuteToolsNow,
}, null, 2))
