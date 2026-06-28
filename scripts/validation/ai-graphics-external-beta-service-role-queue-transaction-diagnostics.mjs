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
const runScriptName = 'ai-graphics:external-beta-service-role-queue-transaction'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-service-role-queue-transaction.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-service-role-queue-transaction:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-service-role-queue-transaction-diagnostics.mjs'

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

const gpuTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

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
  'workerLeaseCreated',
  'workerDispatchPerformed',
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

function buildSourceQueueSubmissionPacket({
  toolId,
  productionToolId,
  capabilityId,
  workerType,
  runtimeTarget,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  sourceGatewayRuntimeAdmissionMode = 'all_tools_external_beta',
}) {
  const jobId = `external-beta-job-${toolId}`
  const workspaceId = 'workspace-fixture'
  const projectId = 'project-fixture'
  const approvedSnapshotId = 'approved_snapshot_external_beta_fixture'
  const creditReservationId = 'credit_reservation_external_beta_fixture'
  const toolExecutionPlanId = `tool-execution-plan-fixture-${toolId}`
  const idempotencyKey = `ai-graphics:external-beta:${workspaceId}:${projectId}:${toolId}`
  const payload = {
    jobId,
    workspaceId,
    projectId,
    approvedSnapshotId,
    creditReservationId,
    toolExecutionPlanId,
    workerType,
    requestedToolIds: [productionToolId],
    storageReferenceIds: ['private://ai-graphics/external-beta/artifact-manifest.json'],
    idempotencyKey,
    executionMode: 'production_blocked',
    metadata: {
      sourceGatewayRuntimeAdmissionMode,
      sourceGatewayTraceId: `trace-fixture-${toolId}`,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
  const queueName = 'ai-graphics-external-beta-worker-jobs'
  const queueBatchCandidate = {
    batchId: `external-beta-ai-graphics-batch-${workspaceId}-${projectId}`,
    workspaceId,
    projectId,
    queueName,
    jobCount: 1,
    status: 'prepared_not_submitted',
    serviceRoleRequired: true,
    liveInsertPerformed: false,
  }
  const queueJobCandidate = {
    jobId,
    jobType: 'ai_graphics_tool_runtime',
    workspaceId,
    projectId,
    approvedSnapshotId,
    creditReservationId,
    toolExecutionPlanId,
    workerType,
    runtimeTarget,
    sourceGatewayRuntimeAdmissionMode,
    idempotencyKey,
    payload,
    status: 'prepared_not_submitted',
    liveInsertPerformed: false,
  }
  const queueAuditCandidate = {
    auditEventRef: `external-beta-queue://audit-event/${toolId}`,
    eventName: 'external_beta_ai_graphics_queue_submission_prepared',
    toolId,
    capabilityId,
    queueName,
    traceId: `trace-fixture-${toolId}`,
    liveInsertPerformed: false,
  }
  const envelope = {
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
    queueBatchCandidate,
    queueJobCandidate,
    queueAuditCandidate,
    sourceAdapterPayloadReadyWithProvidedEvidence: true,
    submissionEnvelopeShapeValid: true,
    submissionEnvelopeReadyWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
  return {
    decision: 'external_beta_backend_queue_submission_envelope_ready',
    sourceDecision:
      'ai_graphics_external_beta_backend_queue_submission_envelope_prepared_with_runtime_blocks',
    sourceExternalBetaWorkerEnqueueAdapterDecision:
      'ai_graphics_external_beta_worker_enqueue_adapter_contract_prepared_with_runtime_blocks',
    capabilityId,
    requestedToolId: toolId,
    executionRequested: true,
    sourceExternalBetaWorkerEnqueueAdapterAccepted: true,
    missingQueueSubmissionControls: [],
    externalBetaQueueSubmissionControlsSatisfied: true,
    externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence: true,
    externalBetaBackendQueueSubmissionEnvelope: envelope,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    liveBackendQueueSubmissionsNow: 0,
    liveServiceRoleTransactionsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      workerEnqueuePerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-service-role-queue-transaction.ts',
  'server/cli/ai-graphics-external-beta-service-role-queue-transaction.ts',
  'server/tool-registry/ai-graphics-external-beta-backend-queue-submission.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-transaction.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-transaction.md',
  'docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-cpu-static-runtime-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-cpu-static-cohort-admission.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-queue-transaction-readiness.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-transaction.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-transaction.md')
const source = read('server/tool-registry/ai-graphics-external-beta-service-role-queue-transaction.ts')
const cli = read('server/cli/ai-graphics-external-beta-service-role-queue-transaction.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-service-role-queue-transaction'")) {
  fail('server_registry_index_missing_external_beta_service_role_queue_transaction_export')
}
if (docs.decision !== 'ai_graphics_external_beta_service_role_queue_transaction_envelope_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  defaultTransactionReadyExamples: 0,
  fullTransactionEnvelopeReadyExamples: 3,
  cpuStaticFirstCohortTransactionEnvelopeReadyExamples: 1,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobExamples: 1,
  serviceRoleJobBatchRowsPreparedExamples: 3,
  serviceRoleJobRowsPreparedExamples: 3,
  serviceRoleWorkerClaimInputsPreparedExamples: 3,
  serviceRoleWorkerEventRowsPreparedExamples: 6,
  serviceRoleAuditEventRowsPreparedExamples: 3,
  liveServiceRoleTransactionsNow: 0,
  liveJobBatchRowsInsertedNow: 0,
  liveJobRowsInsertedNow: 0,
  liveWorkerClaimRowsInsertedNow: 0,
  liveWorkerEventRowsInsertedNow: 0,
  liveAuditEventRowsInsertedNow: 0,
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
for (const rpc of [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
]) {
  if (!docs.requiredServiceRoleRpcs?.includes(rpc)) fail(`docs_missing_rpc:${rpc}`)
  if (!source.includes(rpc)) fail(`source_missing_rpc:${rpc}`)
}
for (const gate of [
  'accepted external-beta backend queue submission packet',
  'external beta service-role queue transaction reference',
  'external beta service-role RPC schema reference',
  'external beta queue write authorization reference',
  'external beta job batch table reference',
  'external beta job table reference',
  'external beta worker claim table reference',
  'external beta worker event table reference',
  'external beta audit event table reference',
  'external beta service-role rollback reference',
]) {
  if (!docs.requiredServiceRoleTransactionControls?.includes(gate)) {
    fail(`docs_missing_transaction_control:${gate}`)
  }
}
for (const key of [
  'externalBetaServiceRoleQueueTransactionEnvelopePrepared',
  'sourceExternalBetaBackendQueueSubmissionAccepted',
  'externalBetaServiceRoleTransactionControlsSatisfied',
  'externalBetaServiceRoleQueueTransactionEnvelopeReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'serviceRoleTransactionEnvelopeShapeValid',
  'serviceRoleQueueTransactionRefAccepted',
  'serviceRoleRpcSchemaAccepted',
  'queueWriteAuthorizationAccepted',
  'serviceRoleTablesAccepted',
  'rollbackPlanAccepted',
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
  planning_sam2_service_role_transaction: 'planning_metadata_selected',
  blocked_sam2_service_role_transaction_missing_queue_submission:
    'missing_external_beta_backend_queue_submission',
  blocked_sam2_service_role_transaction_missing_rpc_schema:
    'missing_external_beta_service_role_queue_transaction_controls',
  accepted_future_sam2_service_role_transaction_envelope:
    'external_beta_service_role_queue_transaction_envelope_ready',
  accepted_future_d3_service_role_transaction_envelope:
    'external_beta_service_role_queue_transaction_envelope_ready',
  accepted_future_d3_cpu_static_service_role_transaction_envelope:
    'external_beta_service_role_queue_transaction_envelope_ready',
})) {
  const entry = docs.exampleEvaluations?.find((example) => example.id === id)
  if (!entry) fail(`docs_missing_example:${id}`)
  if (entry?.decision !== expected) fail(`docs_example_decision_unexpected:${id}:${entry?.decision}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_DECISION',
  'evaluateAiGraphicsExternalBetaServiceRoleQueueTransaction',
  'sourceExternalBetaBackendQueueSubmissionPacket',
  'AiGraphicsExternalBetaServiceRoleJobBatchRowCandidate',
  'AiGraphicsExternalBetaServiceRoleJobRowCandidate',
  'sourceGatewayRuntimeAdmissionMode',
  'AiGraphicsExternalBetaServiceRoleWorkerClaimInputCandidate',
  'AiGraphicsExternalBetaServiceRoleWorkerEventCandidate',
  'AiGraphicsExternalBetaServiceRoleAuditEventCandidate',
  "status: 'prepared_not_inserted'",
  "claimMode: 'future_worker_claim_only'",
  'canRunServiceRoleTransactionNow: false',
  'canInsertJobBatchNow: false',
  'canCreateWorkerClaimNow: false',
  'canDispatchWorkerNow: false',
  'canExecuteToolNow: false',
  'serviceRoleTransactionPerformed: false',
  'gpuRuntimeShouldStartNow: false',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-backend-queue-submission-packet',
  '--external-beta-service-role-queue-transaction-ref',
  '--external-beta-service-role-rpc-schema-ref',
  '--external-beta-job-batch-table-ref',
  '--external-beta-worker-claim-table-ref',
  '--external-beta-service-role-rollback-ref',
  'evaluatorOnly: true',
  'serviceRoleTransactionPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'External-Beta Service-Role Queue Transaction',
  'RPC/table row candidates',
  'sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort',
  'Live service-role transactions now: `0`',
  'Live job rows inserted now: `0`',
  'Live worker dispatches now: `0`',
  'GPU remains on-demand only',
  'If no accepted worker job is inserted, claimed, and dispatched, no GPU runtime should be running',
]) {
  if (!docsMd.includes(needle)) fail(`markdown_missing:${needle}`)
}
for (const needle of [
  'AI graphics external beta service-role queue transaction decision',
  'prepared-only job batch, job, worker claim, worker event, and audit event',
  'sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort',
  '`serviceRoleTransactionPerformed=false`',
  '`liveQueueWriteApprovedNow=false`',
  '`workerDispatchPerformed=false`',
]) {
  if (!scorecard.includes(needle)) fail(`scorecard_missing:${needle}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-service-role-queue-transaction-'))
const sam2QueueSubmissionPath = writeJson(path.join(tmpRoot, 'sam2-queue-submission.json'), buildSourceQueueSubmissionPacket({
  toolId: 'sam2',
  productionToolId: 'sam2',
  capabilityId: 'background_removal',
  workerType: 'gpu_ai_worker',
  runtimeTarget: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: true,
}))
const d3QueueSubmissionPath = writeJson(path.join(tmpRoot, 'd3-queue-submission.json'), buildSourceQueueSubmissionPacket({
  toolId: 'd3',
  productionToolId: 'd3',
  capabilityId: 'chart_overlay',
  workerType: 'render_worker',
  runtimeTarget: 'node_cpu_static',
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: false,
}))
const d3CpuStaticQueueSubmissionPath = writeJson(
  path.join(tmpRoot, 'd3-cpu-static-queue-submission.json'),
  buildSourceQueueSubmissionPacket({
    toolId: 'd3',
    productionToolId: 'd3',
    capabilityId: 'chart_overlay',
    workerType: 'render_worker',
    runtimeTarget: 'node_cpu_static',
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: false,
    sourceGatewayRuntimeAdmissionMode: 'cpu_static_first_cohort',
  }),
)

const planningTransaction = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'planning_transaction')
if (planningTransaction.decision !== 'planning_metadata_selected') {
  fail(`planning_decision:${planningTransaction.decision}`)
}
const blockedMissingQueueSubmission = parseJsonOutput(runNpm(runScriptName, [
  '--execution-requested',
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'blocked_missing_queue_submission')
if (blockedMissingQueueSubmission.decision !== 'missing_external_beta_backend_queue_submission') {
  fail(`blocked_missing_queue_submission_decision:${blockedMissingQueueSubmission.decision}`)
}
const blockedMissingRpcSchema = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-backend-queue-submission-packet',
  sam2QueueSubmissionPath,
  '--execution-requested',
  '--external-beta-service-role-queue-transaction-ref',
  'external-beta-service-role://queue-transaction',
]), 'blocked_missing_rpc_schema')
if (blockedMissingRpcSchema.decision !== 'missing_external_beta_service_role_queue_transaction_controls') {
  fail(`blocked_missing_rpc_schema_decision:${blockedMissingRpcSchema.decision}`)
}

const transactionControls = [
  '--external-beta-service-role-queue-transaction-ref',
  'external-beta-service-role://queue-transaction',
  '--external-beta-service-role-rpc-schema-ref',
  'external-beta-service-role://rpc-schema/v1',
  '--external-beta-queue-write-authorization-ref',
  'external-beta-service-role://queue-write-authorization',
  '--external-beta-job-batch-table-ref',
  'service-role-table://job_batches',
  '--external-beta-job-table-ref',
  'service-role-table://jobs',
  '--external-beta-worker-claim-table-ref',
  'service-role-table://worker_job_claims',
  '--external-beta-worker-event-table-ref',
  'service-role-table://worker_events',
  '--external-beta-audit-event-table-ref',
  'service-role-table://audit_events',
  '--external-beta-service-role-rollback-ref',
  'external-beta-service-role://rollback-plan',
]

const readySam2Transaction = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-backend-queue-submission-packet',
  sam2QueueSubmissionPath,
  '--execution-requested',
  ...transactionControls,
]), 'ready_sam2_transaction')
const readyD3Transaction = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-backend-queue-submission-packet',
  d3QueueSubmissionPath,
  '--execution-requested',
  ...transactionControls,
]), 'ready_d3_transaction')
const readyD3CpuStaticTransaction = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-backend-queue-submission-packet',
  d3CpuStaticQueueSubmissionPath,
  '--execution-requested',
  ...transactionControls,
]), 'ready_d3_cpu_static_transaction')

for (const [label, output] of Object.entries({
  readySam2Transaction,
  readyD3Transaction,
  readyD3CpuStaticTransaction,
})) {
  if (output.decision !== 'external_beta_service_role_queue_transaction_envelope_ready') {
    fail(`${label}_decision:${output.decision}`)
  }
  if (output.externalBetaServiceRoleQueueTransactionEnvelopeReadyWithProvidedEvidence !== true) {
    fail(`${label}_not_ready_with_evidence`)
  }
  const envelope = output.externalBetaServiceRoleQueueTransactionEnvelope
  if (!envelope) fail(`${label}_missing_envelope`)
  if (envelope?.enqueueRpcName !== 'enqueue_ai_graphics_tool_runtime_jobs') fail(`${label}_enqueue_rpc`)
  if (envelope?.claimRpcName !== 'claim_ai_graphics_tool_runtime_job') fail(`${label}_claim_rpc`)
  if (envelope?.jobRowCandidate?.status !== 'prepared_not_inserted') fail(`${label}_job_row_status`)
  if (typeof envelope?.sourceGatewayRuntimeAdmissionMode !== 'string') {
    fail(`${label}_missing_source_gateway_runtime_admission_mode`)
  }
  if (envelope?.jobRowCandidate?.sourceGatewayRuntimeAdmissionMode !== envelope?.sourceGatewayRuntimeAdmissionMode) {
    fail(`${label}_job_row_source_mode_mismatch`)
  }
  if (envelope?.workerClaimInputCandidate?.status !== 'prepared_not_claimed') fail(`${label}_claim_status`)
  if (envelope?.workerEventCandidates?.length !== 2) fail(`${label}_worker_event_count`)
  if (envelope?.serviceRoleTransactionEnvelopeShapeValid !== true) fail(`${label}_shape_not_valid`)
  if (envelope?.canRunServiceRoleTransactionNow !== false) fail(`${label}_can_run_transaction_now`)
  if (envelope?.canDispatchWorkerNow !== false) fail(`${label}_can_dispatch_worker_now`)
  if (envelope?.canExecuteToolNow !== false) fail(`${label}_can_execute_tool_now`)
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false) fail(`${label}_false_gate_not_false:${key}`)
  }
}
if (readySam2Transaction.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
  fail('sam2_gpu_start_allowed_not_true_for_future_job')
}
if (readyD3Transaction.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('d3_gpu_start_allowed_not_false')
}
if (readyD3CpuStaticTransaction.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('d3_cpu_static_gpu_start_allowed_not_false')
}
if (readySam2Transaction.externalBetaServiceRoleQueueTransactionEnvelope?.runtimeTarget !== 'native_linux_amd64_nvidia_l4_sam2_runtime') {
  fail('sam2_runtime_target_unexpected')
}
if (readyD3Transaction.externalBetaServiceRoleQueueTransactionEnvelope?.runtimeTarget !== 'node_cpu_static') {
  fail('d3_runtime_target_unexpected')
}
if (readyD3CpuStaticTransaction.externalBetaServiceRoleQueueTransactionEnvelope?.runtimeTarget !== 'node_cpu_static') {
  fail('d3_cpu_static_runtime_target_unexpected')
}
if (
  readyD3CpuStaticTransaction.externalBetaServiceRoleQueueTransactionEnvelope
    ?.sourceGatewayRuntimeAdmissionMode !== 'cpu_static_first_cohort'
) {
  fail('d3_cpu_static_source_mode_unexpected')
}

const combinedText = [
  JSON.stringify(docs),
  docsMd,
  source,
  cli,
  scorecard,
  JSON.stringify(readySam2Transaction),
  JSON.stringify(readyD3Transaction),
  JSON.stringify(readyD3CpuStaticTransaction),
].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /routeExecutionApprovedNow["'`\s:]*true/i,
  /workerExecutionApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /serviceRoleTransactionPerformed["'`\s:]*true/i,
  /backendQueueSubmissionPerformed["'`\s:]*true/i,
  /workerDispatchPerformed["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /browserWebglCanvasRuntimePerformed["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /supabaseMutationPerformed["'`\s:]*true/i,
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
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-cohort-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-cohort-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-runtime-admission-diagnostics.mjs",',
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector-diagnostics.mjs",`,
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
  '+    "ai-graphics:external-beta-local-queue-storage": "tsx server/cli/ai-graphics-external-beta-local-queue-storage.ts",',
  '+    "ai-graphics:external-beta-local-queue-storage:diagnostics": "node scripts/validation/ai-graphics-external-beta-local-queue-storage-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
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
  planningTransactionDecision: planningTransaction.decision,
  blockedMissingQueueSubmissionDecision: blockedMissingQueueSubmission.decision,
  blockedMissingRpcSchemaDecision: blockedMissingRpcSchema.decision,
  readySam2TransactionDecision: readySam2Transaction.decision,
  readyD3TransactionDecision: readyD3Transaction.decision,
  readyD3CpuStaticTransactionDecision: readyD3CpuStaticTransaction.decision,
  readySam2GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readySam2Transaction.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  readyD3GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readyD3Transaction.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  readyD3CpuStaticGatewaySourceMode:
    readyD3CpuStaticTransaction.externalBetaServiceRoleQueueTransactionEnvelope
      ?.sourceGatewayRuntimeAdmissionMode,
  sam2RuntimeTarget:
    readySam2Transaction.externalBetaServiceRoleQueueTransactionEnvelope?.runtimeTarget,
  d3RuntimeTarget:
    readyD3Transaction.externalBetaServiceRoleQueueTransactionEnvelope?.runtimeTarget,
  d3CpuStaticRuntimeTarget:
    readyD3CpuStaticTransaction.externalBetaServiceRoleQueueTransactionEnvelope?.runtimeTarget,
  enqueueRpcName:
    readySam2Transaction.externalBetaServiceRoleQueueTransactionEnvelope?.enqueueRpcName,
  claimRpcName:
    readySam2Transaction.externalBetaServiceRoleQueueTransactionEnvelope?.claimRpcName,
  jobRowStatus:
    readySam2Transaction.externalBetaServiceRoleQueueTransactionEnvelope?.jobRowCandidate?.status,
  workerClaimStatus:
    readySam2Transaction.externalBetaServiceRoleQueueTransactionEnvelope?.workerClaimInputCandidate?.status,
  serviceRoleTransactionPerformed:
    readySam2Transaction.booleans?.serviceRoleTransactionPerformed,
  liveQueueWriteApprovedNow:
    readySam2Transaction.booleans?.liveQueueWriteApprovedNow,
  workerDispatchPerformed:
    readySam2Transaction.booleans?.workerDispatchPerformed,
  gpuRuntimeShouldStartNow:
    readySam2Transaction.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: readySam2Transaction.externalBetaReadyNowTools,
  productionReadyNowTools: readySam2Transaction.productionReadyNowTools,
  agentCanExecuteToolsNow: readySam2Transaction.booleans?.agentCanExecuteToolsNow,
}, null, 2))
