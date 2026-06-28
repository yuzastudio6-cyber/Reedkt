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
const runScriptName = 'ai-graphics:external-beta-backend-queue-submission'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-backend-queue-submission.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-backend-queue-submission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-backend-queue-submission-diagnostics.mjs'
const packetScriptName = 'ai-graphics:external-beta-evidence-packet:validate'
const launchGoNoGoScriptName = 'ai-graphics:external-beta-launch-go-no-go'
const runtimeAdmissionScriptName = 'ai-graphics:external-beta-runtime-admission'
const gatewayScriptName = 'ai-graphics:external-beta-tool-call-gateway'
const adapterScriptName = 'ai-graphics:external-beta-worker-enqueue-adapter'

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

function acceptedRecord(toolId) {
  const prefix = `external-beta-evidence://${toolId}`
  return {
    toolId,
    internalRuntimeSoakEvidenceRef: `${prefix}:internal-runtime-soak`,
    externalBetaQaEvidenceRef: `${prefix}:external-qa`,
    costConcurrencyPrivacyRollbackEvidenceRef: `${prefix}:cost-concurrency-privacy-rollback`,
    incidentResponseEvidenceRef: `${prefix}:incident-response`,
    ownerApprovalRef: `${prefix}:owner-approval`,
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-backend-queue-submission.ts',
  'server/cli/ai-graphics-external-beta-backend-queue-submission.ts',
  'server/tool-registry/ai-graphics-external-beta-worker-enqueue-adapter.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.md',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-enqueue-adapter.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.md')
const source = read('server/tool-registry/ai-graphics-external-beta-backend-queue-submission.ts')
const cli = read('server/cli/ai-graphics-external-beta-backend-queue-submission.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-backend-queue-submission'")) {
  fail('server_registry_index_missing_external_beta_backend_queue_submission_export')
}
if (docs.decision !== 'ai_graphics_external_beta_backend_queue_submission_envelope_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  defaultSubmissionReadyExamples: 0,
  fullSubmissionEnvelopeReadyExamples: 2,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobExamples: 1,
  liveBackendQueueSubmissionsNow: 0,
  liveServiceRoleTransactionsNow: 0,
  liveWorkerLeasesCreatedNow: 0,
  liveWorkerDispatchesNow: 0,
  workerEnqueuePerformedNow: 0,
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
  'accepted external-beta worker enqueue adapter packet',
  'external beta queue submission reference',
  'external beta queue submission schema reference',
  'external beta service-role transaction envelope reference',
  'external beta queue write authorization reference',
  'external beta approved snapshot persistence reference',
  'external beta credit reservation persistence reference',
  'external beta private artifact persistence reference',
  'external beta audit envelope reference',
  'external beta rollback plan reference',
]) {
  if (!docs.requiredQueueSubmissionControls?.includes(gate)) {
    fail(`docs_missing_submission_control:${gate}`)
  }
}
for (const key of [
  'externalBetaBackendQueueSubmissionEnvelopePrepared',
  'sourceExternalBetaWorkerEnqueueAdapterAccepted',
  'externalBetaQueueSubmissionControlsSatisfied',
  'externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'queueSubmissionEnvelopeShapeValid',
  'queueSubmissionRefAccepted',
  'queueSubmissionSchemaAccepted',
  'serviceRoleTransactionEnvelopeAccepted',
  'queueWriteAuthorizationAccepted',
  'approvedSnapshotPersistenceAccepted',
  'creditReservationPersistenceAccepted',
  'privateArtifactPersistenceAccepted',
  'auditEnvelopeAccepted',
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
  planning_sam2_backend_queue_submission: 'planning_metadata_selected',
  blocked_sam2_backend_queue_submission_missing_adapter:
    'missing_external_beta_worker_enqueue_adapter',
  blocked_sam2_backend_queue_submission_missing_write_authorization:
    'missing_external_beta_backend_queue_submission_controls',
  accepted_future_sam2_backend_queue_submission_envelope:
    'external_beta_backend_queue_submission_envelope_ready',
  accepted_future_d3_backend_queue_submission_envelope:
    'external_beta_backend_queue_submission_envelope_ready',
})) {
  const entry = docs.exampleEvaluations?.find((example) => example.id === id)
  if (!entry) fail(`docs_missing_example:${id}`)
  if (entry?.decision !== expected) fail(`docs_example_decision_unexpected:${id}:${entry?.decision}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION',
  'evaluateAiGraphicsExternalBetaBackendQueueSubmission',
  'sourceExternalBetaWorkerEnqueueAdapterPacket',
  'AiGraphicsExternalBetaQueueBatchCandidate',
  'AiGraphicsExternalBetaQueueJobCandidate',
  'AiGraphicsExternalBetaQueueAuditCandidate',
  "jobType: 'ai_graphics_tool_runtime'",
  "status: 'prepared_not_submitted'",
  'backendQueueSubmissionPerformed: false',
  'serviceRoleTransactionPerformed: false',
  'workerEnqueuePerformed: false',
  'workerLeaseCreated: false',
  'workerDispatchPerformed: false',
  'gpuRuntimeShouldStartNow: false',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-worker-enqueue-adapter-packet',
  '--external-beta-queue-submission-ref',
  '--external-beta-service-role-transaction-envelope-ref',
  '--external-beta-queue-write-authorization-ref',
  '--external-beta-rollback-plan-ref',
  'evaluatorOnly: true',
  'backendQueueSubmissionPerformed: false',
  'serviceRoleTransactionPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'External-Beta Backend Queue Submission',
  'batch, job, and audit candidates',
  'Live backend queue submissions now: `0`',
  'Live service-role transactions now: `0`',
  'GPU remains on-demand only',
  'If no accepted worker job is submitted and claimed, no GPU runtime should be running',
]) {
  if (!docsMd.includes(needle)) fail(`markdown_missing:${needle}`)
}
for (const needle of [
  'AI graphics external beta backend queue submission decision',
  'batch/job/audit queue submission envelope',
  '`backendQueueSubmissionPerformed=false`',
  '`serviceRoleTransactionPerformed=false`',
  '`workerLeaseCreated=false`',
  '`workerDispatchPerformed=false`',
]) {
  if (!scorecard.includes(needle)) fail(`scorecard_missing:${needle}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-backend-queue-submission-'))
const fullRecordsPath = writeJson(
  path.join(tmpRoot, 'external-beta-evidence-records.json'),
  allTools.map(acceptedRecord),
)
const validatedPacket = parseJsonOutput(runNpm(packetScriptName, [
  '--evidence-records',
  fullRecordsPath,
]), 'validated_external_beta_evidence_packet')
if (validatedPacket.evidenceRecordsAcceptedWithProvidedEvidence !== 21) {
  fail('validated_packet_evidence_records_not_21')
}
const fullPacketPath = writeJson(path.join(tmpRoot, 'external-beta-evidence-packet.json'), validatedPacket)

const launchGoNoGo = parseJsonOutput(runNpm(launchGoNoGoScriptName, [
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--external-beta-evidence-packet',
  fullPacketPath,
  '--all-external-beta-launch-gates-approved',
  '--external-beta-launch-ref',
  'external-beta-launch://launch-switch-approved',
  '--external-beta-rollout-cohort-ref',
  'external-beta-launch://rollout-cohort-approved',
  '--external-beta-cost-concurrency-ceiling-ref',
  'external-beta-launch://cost-concurrency-ceiling-approved',
  '--external-beta-rollback-incident-runbook-ref',
  'external-beta-launch://rollback-incident-runbook-approved',
  '--external-beta-private-artifact-retention-support-ref',
  'external-beta-launch://private-artifact-retention-support-approved',
  '--external-beta-launch-approver-role',
  'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER',
]), 'external_beta_launch_go_no_go')
if (launchGoNoGo.status !== 'external_beta_launch_go_no_go_approved_runtime_still_blocked') {
  fail(`launch_go_no_go_status_unexpected:${launchGoNoGo.status}`)
}
const launchGoNoGoPath = writeJson(path.join(tmpRoot, 'launch-go-no-go.json'), launchGoNoGo)

const commonRuntimeArgs = [
  '--external-beta-launch-go-no-go-packet',
  launchGoNoGoPath,
  '--execution-requested',
  '--approved-plan-snapshot-id',
  'approved_snapshot_external_beta_fixture',
  '--credit-reservation-id',
  'credit_reservation_external_beta_fixture',
  '--artifact-boundary-approval-ref',
  'artifact_boundary_approval_external_beta_fixture',
  '--tool-route-approval-ref',
  'tool_route_approval_external_beta_fixture',
  '--worker-approval-ref',
  'worker_approval_external_beta_fixture',
  '--runtime-enqueue-approval-ref',
  'runtime_enqueue_approval_external_beta_fixture',
  '--owner-runtime-approval-ref',
  'owner_runtime_approval_external_beta_fixture',
  '--private-artifact-manifest-ref',
  'private://ai-graphics/external-beta/artifact-manifest.json',
  '--external-beta-feature-flag-enabled',
  '--external-beta-feature-flag-ref',
  'external-beta-runtime://feature-flag-ai-graphics',
  '--external-beta-runtime-admission-ref',
  'external-beta-runtime://runtime-admission',
  '--external-beta-tool-allowlist-ref',
  'external-beta-runtime://tool-allowlist',
  '--external-beta-traffic-scope-ref',
  'external-beta-runtime://traffic-scope',
  '--external-beta-telemetry-ref',
  'external-beta-runtime://telemetry',
  '--external-beta-support-ref',
  'external-beta-runtime://support',
  '--external-beta-cost-guardrail-ref',
  'external-beta-runtime://cost-guardrail',
  '--external-beta-worker-pool-ref',
  'external-beta-runtime://worker-pool',
]
const sam2RuntimeAdmission = parseJsonOutput(runNpm(runtimeAdmissionScriptName, [
  ...commonRuntimeArgs,
  '--external-beta-gpu-concurrency-ref',
  'external-beta-runtime://gpu-concurrency',
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
  '--native-gpu-runtime-proof-ref',
  'private://ai-graphics/gpu-proof/sam2-proof.json',
  '--model-weight-manifest-ref',
  'private://ai-graphics/model-manifests/sam2.json',
]), 'sam2_runtime_admission')
const d3RuntimeAdmission = parseJsonOutput(runNpm(runtimeAdmissionScriptName, [
  ...commonRuntimeArgs,
  '--capability-id',
  'chart_overlay',
  '--requested-tool-id',
  'd3',
  '--node-runtime-proof-ref',
  'private://ai-graphics/node-static-proof/d3.json',
]), 'd3_runtime_admission')
const sam2RuntimeAdmissionPath = writeJson(path.join(tmpRoot, 'sam2-runtime-admission.json'), sam2RuntimeAdmission)
const d3RuntimeAdmissionPath = writeJson(path.join(tmpRoot, 'd3-runtime-admission.json'), d3RuntimeAdmission)

function gatewayControls(toolId) {
  return [
    '--external-beta-user-id',
    'external-beta-user-fixture',
    '--external-beta-workspace-id',
    'workspace-fixture',
    '--external-beta-request-id',
    `request-fixture-${toolId}`,
    '--external-beta-tool-call-gateway-ref',
    'external-beta-gateway://tool-call',
    '--external-beta-feature-flag-evaluation-ref',
    'external-beta-gateway://feature-flag-evaluation',
    '--external-beta-rollout-assignment-ref',
    'external-beta-gateway://rollout-assignment',
    '--external-beta-rate-limit-decision-ref',
    'external-beta-gateway://rate-limit',
    '--external-beta-cost-ceiling-decision-ref',
    'external-beta-gateway://cost-ceiling',
    '--external-beta-audit-event-ref',
    'external-beta-gateway://audit-event',
    '--external-beta-trace-id',
    `trace-fixture-${toolId}`,
    '--external-beta-idempotency-key',
    `ai-graphics:external-beta:workspace-fixture:request-fixture-${toolId}:${toolId}`,
    '--external-beta-worker-enqueue-candidate-ref',
    `external-beta-gateway://worker-enqueue-candidate/${toolId}`,
    '--approved-plan-snapshot-id',
    'approved_snapshot_external_beta_fixture',
    '--credit-reservation-id',
    'credit_reservation_external_beta_fixture',
    '--artifact-boundary-approval-ref',
    'artifact_boundary_approval_external_beta_fixture',
    '--tool-route-approval-ref',
    'tool_route_approval_external_beta_fixture',
    '--worker-approval-ref',
    'worker_approval_external_beta_fixture',
    '--runtime-enqueue-approval-ref',
    'runtime_enqueue_approval_external_beta_fixture',
    '--owner-runtime-approval-ref',
    'owner_runtime_approval_external_beta_fixture',
    '--private-artifact-manifest-ref',
    'private://ai-graphics/external-beta/artifact-manifest.json',
  ]
}

const readySam2Gateway = parseJsonOutput(runNpm(gatewayScriptName, [
  '--external-beta-runtime-admission-packet',
  sam2RuntimeAdmissionPath,
  ...gatewayControls('sam2'),
]), 'ready_sam2_gateway')
const readyD3Gateway = parseJsonOutput(runNpm(gatewayScriptName, [
  '--external-beta-runtime-admission-packet',
  d3RuntimeAdmissionPath,
  ...gatewayControls('d3'),
]), 'ready_d3_gateway')
const readySam2GatewayPath = writeJson(path.join(tmpRoot, 'sam2-gateway.json'), readySam2Gateway)
const readyD3GatewayPath = writeJson(path.join(tmpRoot, 'd3-gateway.json'), readyD3Gateway)

const adapterControls = [
  '--external-beta-project-id',
  'project-fixture',
  '--external-beta-edit-plan-id',
  'edit-plan-fixture',
  '--external-beta-tool-execution-plan-id',
  'tool-execution-plan-fixture',
  '--external-beta-backend-queue-adapter-ref',
  'external-beta-queue://backend-adapter',
  '--external-beta-queue-name',
  'ai-graphics-external-beta-worker-jobs',
  '--external-beta-service-role-boundary-ref',
  'external-beta-queue://service-role-boundary',
  '--external-beta-worker-payload-schema-ref',
  'external-beta-queue://worker-payload-schema/v1',
  '--external-beta-private-storage-policy-ref',
  'external-beta-queue://private-storage-policy',
  '--external-beta-retry-policy-ref',
  'external-beta-queue://retry-policy',
  '--external-beta-dead-letter-policy-ref',
  'external-beta-queue://dead-letter-policy',
]
function adapterControlsFor(toolId) {
  return adapterControls.map((value, index, list) => (
    list[index - 1] === '--external-beta-tool-execution-plan-id'
      ? `tool-execution-plan-fixture-${toolId}`
      : value
  ))
}

const readySam2Adapter = parseJsonOutput(runNpm(adapterScriptName, [
  '--external-beta-tool-call-gateway-packet',
  readySam2GatewayPath,
  ...adapterControlsFor('sam2'),
]), 'ready_sam2_adapter')
const readyD3Adapter = parseJsonOutput(runNpm(adapterScriptName, [
  '--external-beta-tool-call-gateway-packet',
  readyD3GatewayPath,
  ...adapterControlsFor('d3'),
]), 'ready_d3_adapter')
const readySam2AdapterPath = writeJson(path.join(tmpRoot, 'sam2-adapter.json'), readySam2Adapter)
const readyD3AdapterPath = writeJson(path.join(tmpRoot, 'd3-adapter.json'), readyD3Adapter)

const submissionControls = [
  '--external-beta-queue-submission-ref',
  'external-beta-queue://submission',
  '--external-beta-queue-submission-schema-ref',
  'external-beta-queue://submission-schema/v1',
  '--external-beta-service-role-transaction-envelope-ref',
  'external-beta-queue://service-role-transaction-envelope',
  '--external-beta-queue-write-authorization-ref',
  'external-beta-queue://queue-write-authorization',
  '--external-beta-approved-snapshot-persistence-ref',
  'external-beta-queue://approved-snapshot-persistence',
  '--external-beta-credit-reservation-persistence-ref',
  'external-beta-queue://credit-reservation-persistence',
  '--external-beta-private-artifact-persistence-ref',
  'external-beta-queue://private-artifact-persistence',
  '--external-beta-audit-envelope-ref',
  'external-beta-queue://audit-envelope',
  '--external-beta-rollback-plan-ref',
  'external-beta-queue://rollback-plan',
]
const submissionControlsWithoutWriteAuthorization = submissionControls.filter((value, index, list) => (
  value !== '--external-beta-queue-write-authorization-ref' &&
  list[index - 1] !== '--external-beta-queue-write-authorization-ref'
))

const planningSubmission = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'planning_submission')
const blockedMissingAdapter = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
  '--execution-requested',
]), 'blocked_missing_adapter_submission')
const blockedMissingWriteAuthorization = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-worker-enqueue-adapter-packet',
  readySam2AdapterPath,
  ...submissionControlsWithoutWriteAuthorization,
]), 'blocked_missing_write_authorization_submission')
const readySam2Submission = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-worker-enqueue-adapter-packet',
  readySam2AdapterPath,
  ...submissionControls,
]), 'ready_sam2_submission')
const readyD3Submission = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-worker-enqueue-adapter-packet',
  readyD3AdapterPath,
  ...submissionControls,
]), 'ready_d3_submission')

if (planningSubmission.decision !== 'planning_metadata_selected') {
  fail(`planning_submission_decision_unexpected:${planningSubmission.decision}`)
}
if (blockedMissingAdapter.decision !== 'missing_external_beta_worker_enqueue_adapter') {
  fail(`blocked_missing_adapter_decision_unexpected:${blockedMissingAdapter.decision}`)
}
if (blockedMissingWriteAuthorization.decision !== 'missing_external_beta_backend_queue_submission_controls') {
  fail(`blocked_missing_write_authorization_decision_unexpected:${blockedMissingWriteAuthorization.decision}`)
}
if (!blockedMissingWriteAuthorization.missingQueueSubmissionControls?.includes('external beta queue write authorization reference is missing')) {
  fail('blocked_missing_write_authorization_not_reported')
}

for (const [label, output] of Object.entries({ readySam2Submission, readyD3Submission })) {
  if (output.decision !== 'external_beta_backend_queue_submission_envelope_ready') {
    fail(`${label}_decision_unexpected:${output.decision}`)
  }
  if (output.externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence !== true) {
    fail(`${label}_submission_envelope_ready_not_true`)
  }
  const envelope = output.externalBetaBackendQueueSubmissionEnvelope
  if (!envelope) fail(`${label}_missing_submission_envelope`)
  if (envelope?.submissionEnvelopeShapeValid !== true) fail(`${label}_envelope_shape_not_valid`)
  if (envelope?.queueJobCandidate?.jobType !== 'ai_graphics_tool_runtime') {
    fail(`${label}_queue_job_type_unexpected`)
  }
  if (envelope?.queueJobCandidate?.status !== 'prepared_not_submitted') {
    fail(`${label}_queue_job_status_unexpected`)
  }
  if (envelope?.queueBatchCandidate?.jobCount !== 1) fail(`${label}_queue_batch_job_count_not_1`)
  if (envelope?.queueBatchCandidate?.liveInsertPerformed !== false) {
    fail(`${label}_batch_live_insert_not_false`)
  }
  if (envelope?.queueJobCandidate?.liveInsertPerformed !== false) {
    fail(`${label}_job_live_insert_not_false`)
  }
  if (envelope?.queueAuditCandidate?.liveInsertPerformed !== false) {
    fail(`${label}_audit_live_insert_not_false`)
  }
  if (envelope?.backendQueueSubmissionPerformed !== false) {
    fail(`${label}_backend_queue_submission_performed_not_false`)
  }
  if (envelope?.serviceRoleTransactionPerformed !== false) {
    fail(`${label}_service_role_transaction_performed_not_false`)
  }
  if (envelope?.workerLeaseCreated !== false) fail(`${label}_worker_lease_created_not_false`)
  if (envelope?.workerDispatchPerformed !== false) fail(`${label}_worker_dispatch_performed_not_false`)
  if (output.gpuRuntimeShouldStartNow !== false) fail(`${label}_gpu_runtime_should_start_now_not_false`)
  if (output.liveBackendQueueSubmissionsNow !== 0) fail(`${label}_live_backend_queue_submissions_not_0`)
  if (output.liveServiceRoleTransactionsNow !== 0) fail(`${label}_live_service_role_transactions_not_0`)
  if (output.liveWorkerLeasesCreatedNow !== 0) fail(`${label}_live_worker_leases_not_0`)
  if (output.liveWorkerDispatchesNow !== 0) fail(`${label}_live_worker_dispatches_not_0`)
  if (output.externalBetaReadyNowTools !== 0) fail(`${label}_external_beta_ready_now_not_0`)
  if (output.productionReadyNowTools !== 0) fail(`${label}_production_ready_now_not_0`)
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`${label}_required_false_not_false:${key}`)
    }
  }
}
if (readySam2Submission.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
  fail('ready_sam2_submission_gpu_start_allowed_not_true')
}
if (readyD3Submission.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('ready_d3_submission_gpu_start_allowed_not_false')
}
if (readySam2Submission.externalBetaBackendQueueSubmissionEnvelope?.runtimeTarget !== 'native_linux_amd64_nvidia_l4_sam2_runtime') {
  fail('ready_sam2_submission_runtime_target_unexpected')
}
if (readyD3Submission.externalBetaBackendQueueSubmissionEnvelope?.runtimeTarget !== 'node_cpu_static') {
  fail('ready_d3_submission_runtime_target_unexpected')
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.md',
  'docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json',
  'server/tool-registry/ai-graphics-external-beta-backend-queue-submission.ts',
  'server/cli/ai-graphics-external-beta-backend-queue-submission.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')

for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s]+true/i,
  /serviceRoleQueueTransactionApprovedNow["`:\s]+true/i,
  /liveQueueWriteApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeShouldStartNow["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /workerEnqueuePerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /backendQueueSubmissionPerformed["`:\s]+true/i,
  /serviceRoleTransactionPerformed["`:\s]+true/i,
  /workerLeaseCreated["`:\s]+true/i,
  /workerDispatchPerformed["`:\s]+true/i,
  /providerRuntimePerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
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
  '+    "ai-graphics:external-beta-worker-enqueue-adapter": "tsx server/cli/ai-graphics-external-beta-worker-enqueue-adapter.ts",',
  '+    "ai-graphics:external-beta-worker-enqueue-adapter:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-enqueue-adapter-diagnostics.mjs",',
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-service-role-queue-transaction": "tsx server/cli/ai-graphics-external-beta-service-role-queue-transaction.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-transaction:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-transaction-diagnostics.mjs",',
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
  planningSubmissionDecision: planningSubmission.decision,
  blockedMissingAdapterDecision: blockedMissingAdapter.decision,
  blockedMissingWriteAuthorizationDecision: blockedMissingWriteAuthorization.decision,
  readySam2SubmissionDecision: readySam2Submission.decision,
  readyD3SubmissionDecision: readyD3Submission.decision,
  readySam2GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readySam2Submission.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  readyD3GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readyD3Submission.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  sam2RuntimeTarget: readySam2Submission.externalBetaBackendQueueSubmissionEnvelope?.runtimeTarget,
  d3RuntimeTarget: readyD3Submission.externalBetaBackendQueueSubmissionEnvelope?.runtimeTarget,
  sam2JobType: readySam2Submission.externalBetaBackendQueueSubmissionEnvelope?.queueJobCandidate?.jobType,
  d3JobType: readyD3Submission.externalBetaBackendQueueSubmissionEnvelope?.queueJobCandidate?.jobType,
  queueJobStatus: readySam2Submission.externalBetaBackendQueueSubmissionEnvelope?.queueJobCandidate?.status,
  backendQueueSubmissionPerformed:
    readySam2Submission.booleans?.backendQueueSubmissionPerformed,
  serviceRoleTransactionPerformed:
    readySam2Submission.booleans?.serviceRoleTransactionPerformed,
  workerLeaseCreated: readySam2Submission.booleans?.workerLeaseCreated,
  workerDispatchPerformed: readySam2Submission.booleans?.workerDispatchPerformed,
  gpuRuntimeShouldStartNow: readySam2Submission.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: readySam2Submission.externalBetaReadyNowTools,
  productionReadyNowTools: readySam2Submission.productionReadyNowTools,
  agentCanExecuteToolsNow: readySam2Submission.booleans?.agentCanExecuteToolsNow,
}, null, 2))
