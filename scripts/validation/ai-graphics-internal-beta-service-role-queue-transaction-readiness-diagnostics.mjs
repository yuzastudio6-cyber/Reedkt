import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedNativeGpuProofCollectionPacket } from './ai-graphics-native-gpu-proof-collection-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-service-role-queue-transaction-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:internal-beta-service-role-queue-transaction-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-service-role-queue-transaction-readiness-diagnostics.mjs'

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

const capabilities = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
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

const requiredRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
]

const requiredTables = [
  'job_batches',
  'jobs',
  'worker_job_claims',
  'worker_events',
  'approved_plan_snapshots',
  'credit_reservations',
  'audit_events',
]

const falseGateKeys = [
  'serviceRoleQueueTransactionApprovedNow',
  'serviceRoleSupabaseWritesApprovedNow',
  'liveJobBatchInsertApprovedNow',
  'liveJobInsertApprovedNow',
  'liveWorkerClaimInsertApprovedNow',
  'liveWorkerEventInsertApprovedNow',
  'liveAuditEventInsertApprovedNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'productionWorkerJobEnqueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'productionWorkerRouteExecutionApprovedNow',
  'workerLeaseCreationApprovedNow',
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
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'supabaseMutationPerformed',
  'serviceRoleTransactionPerformed',
  'workerLeaseCreated',
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
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

const inputFalseKeys = [
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'supabaseMutationPerformed',
  'serviceRoleTransactionPerformed',
  'liveWorkerClaimCreated',
  'liveWorkerLeaseCreated',
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
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
let acceptedNativeGpuProofCollectionPacketPath

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
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
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

function writeAcceptedEvidencePackets() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-service-role-queue-'))
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  acceptedNativeGpuProofCollectionPacketPath = path.join(root, 'native-gpu-proof-collection-packet.json')
  fs.writeFileSync(
    manifestPacketPath,
    `${JSON.stringify(acceptedModelWeightManifestReviewPacket(), null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    gpuPacketPath,
    `${JSON.stringify(acceptedGpuRuntimeProofResultPacket(), null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    acceptedNativeGpuProofCollectionPacketPath,
    `${JSON.stringify(acceptedNativeGpuProofCollectionPacket(), null, 2)}\n`,
    'utf8',
  )
  return { manifestPacketPath, gpuPacketPath, nativeGpuProofCollectionPacketPath: acceptedNativeGpuProofCollectionPacketPath }
}

function acceptedArgs(manifestPacketPath, gpuPacketPath) {
  return [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    ...(acceptedNativeGpuProofCollectionPacketPath
      ? ['--external-beta-native-gpu-proof-collection-packet', acceptedNativeGpuProofCollectionPacketPath]
      : []),
    '--owner-approval-granted',
    '--owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_PACKET',
    '--internal-beta-go-no-go-owner-approval-granted',
    '--internal-beta-go-no-go-owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_PACKET',
    '--internal-beta-runtime-enqueue-approval-granted',
    '--internal-beta-runtime-enqueue-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_PACKET',
    '--all-queue-admission-prerequisites-provided',
  ]
}

function writeQueueAdmissionReadinessPacket(manifestPacketPath, gpuPacketPath) {
  const sourceOutput = parseJsonOutput(
    runNpm('ai-graphics:internal-beta-queue-admission-readiness', [
      ...acceptedArgs(manifestPacketPath, gpuPacketPath),
      '--require-queue-admission-ready',
    ]),
    'source_queue_admission_packet',
  )
  const packetPath = path.join(
    path.dirname(manifestPacketPath),
    'queue-admission-readiness-packet.json',
  )
  fs.writeFileSync(packetPath, `${JSON.stringify(sourceOutput, null, 2)}\n`, 'utf8')
  return packetPath
}

function writeMutatedQueueAdmissionPacket(sourcePacketPath, label, mutate) {
  const packet = JSON.parse(fs.readFileSync(sourcePacketPath, 'utf8'))
  mutate(packet)
  const packetPath = path.join(path.dirname(sourcePacketPath), `${label}.json`)
  fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8')
  return packetPath
}

function expectQueueAdmissionPacketRejected(sourcePacketPath, label, mutate, manifestPacketPath, gpuPacketPath) {
  const badPacketPath = writeMutatedQueueAdmissionPacket(sourcePacketPath, label, mutate)
  let rejected = false
  try {
    runNpm(runScriptName, [
      ...acceptedArgs(manifestPacketPath, gpuPacketPath),
      '--internal-beta-queue-admission-readiness-packet',
      badPacketPath,
      '--require-transaction-envelope-ready',
    ])
  } catch {
    rejected = true
  }
  if (!rejected) fail(`bad_queue_admission_packet_not_rejected:${label}`)
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts',
  'server/cli/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts',
  'scripts/validation/ai-graphics-internal-beta-service-role-queue-transaction-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-queue-transaction-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-queue-transaction-readiness.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-backend-queue-storage-readiness.json',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-service-role-queue-transaction-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-service-role-queue-transaction-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-internal-beta-service-role-queue-transaction-readiness'")) {
  fail('server_registry_index_does_not_export_internal_beta_service_role_queue_transaction_readiness')
}

if (docs.decision !== 'ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.status !== 'service_role_queue_transaction_envelope_prepared_live_writes_blocked') {
  fail(`unexpected_docs_status:${docs.status}`)
}
if (docs.sourceDecisions?.backendQueueStorage !== 'ai_graphics_internal_beta_backend_queue_storage_readiness_contract_prepared_with_mock_service_records') {
  fail(`unexpected_backend_queue_storage_source_decision:${docs.sourceDecisions?.backendQueueStorage}`)
}
for (const [key, expected] of Object.entries({
  acceptsLowLevelEvidenceFlags: true,
  acceptsQueueAdmissionReadinessPacket: true,
  sourceQueueAdmissionReadinessPacketRequired: true,
  sourceQueueAdmissionPacketMustReportReady: true,
  sourceQueueAdmissionPacketMustCoverAll21Tools: true,
  sourceQueueAdmissionPacketMustCoverAll12Capabilities: true,
  sourceQueueAdmissionPacketMustKeepEightGpuFutureStartTools: true,
  sourceQueueAdmissionPacketMustKeepGpuStartNowFalse: true,
  sourceQueueAdmissionPacketMustKeepRuntimeBetaAndProductionFalse: true,
  sourceQueueAdmissionPacketMustPreserveNestedRuntimeEnqueueApproval: true,
  sourceQueueAdmissionPacketMustPreserveNestedOwnerApproval: true,
  sourceQueueAdmissionPacketMustPreserveNestedProductionWorkerGateEvidence: true,
  sourceQueueAdmissionPacketMustPreserveNestedProductionWorkerJobEvidence: true,
  sourceQueueAdmissionPacketMustPreserveNestedOnDemandGpuPolicy: true,
  sourceQueueAdmissionPacketMustRejectCpuFallbackForNestedHeavyTools: true,
  backendQueueStorageEvidenceStillRequired: true,
  serviceRoleEnvelopeStillRequired: true,
  noWriteRpcEnvelopeOnly: true,
  liveServiceRoleTransactionPerformed: false,
  runtimeUnlockPerformed: false,
})) {
  if (docs.sourceEvidencePolicy?.[key] !== expected) {
    fail(`docs_source_evidence_policy_mismatch:${key}:${docs.sourceEvidencePolicy?.[key]}`)
  }
}
for (const token of [
  '--internal-beta-queue-admission-readiness-packet',
  'sourceQueueAdmissionReadinessPacket',
  'internal_beta_queue_admission_readiness_packet',
  'validateNestedRuntimeEnqueueApproval',
  'sourceRollup must preserve exactly 8 GPU/model gate checks',
  'sourceRollup must preserve exactly 8 GPU/model source payloads',
  'cpuFallbackAllowedForHeavyTools',
]) {
  if (!cliSource.includes(token) && !moduleSource.includes(token) && !markdown.includes(token)) {
    fail(`source_missing_queue_admission_packet_token:${token}`)
  }
}

for (const status of [
  'missing_backend_queue_storage_evidence',
  'service_role_queue_transaction_envelope_prepared_live_writes_blocked',
]) {
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const rpc of requiredRpcs) {
  if (!docs.requiredServiceRoleRpcs?.includes(rpc)) fail(`docs_missing_rpc:${rpc}`)
  if (!markdown.includes(`\`${rpc}\``)) fail(`markdown_missing_rpc:${rpc}`)
  if (!moduleSource.includes(rpc)) fail(`module_missing_rpc:${rpc}`)
}
for (const table of requiredTables) {
  if (!docs.requiredServiceRoleTables?.includes(table)) fail(`docs_missing_table:${table}`)
  if (!markdown.includes(`\`${table}\``)) fail(`markdown_missing_table:${table}`)
}
for (const token of [
  'approved_plan_snapshot',
  'credit_reservation',
  'private artifact manifest',
  '`approved_snapshot_*`',
  '`credit_reservation_*`',
  'idempotent',
  'append-only',
  'roll back',
]) {
  if (!markdown.toLowerCase().includes(token)) fail(`markdown_missing_transaction_guarantee:${token}`)
}
for (const token of [
  'approvedPlanSnapshotRefAccepted',
  'creditReservationRefAccepted',
  'all21ApprovedSnapshotRefsAccepted',
  'all21CreditReservationRefsAccepted',
]) {
  if (!moduleSource.includes(token)) fail(`module_missing_ref_format_guard:${token}`)
}
for (const token of [
  '--require-transaction-envelope-ready',
  '--require-live-service-role-transaction',
  '--require-live-supabase-job-writes',
  '--require-live-worker-claims',
  '--require-runtime-ready',
  '--require-production-ready',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing_flag:${token}`)
}

if (docs.counts?.totalAiGraphicsTools !== 21) fail(`docs_total_tools:${docs.counts?.totalAiGraphicsTools}`)
if (docs.counts?.totalProductFacingCapabilities !== 12) {
  fail(`docs_total_capabilities:${docs.counts?.totalProductFacingCapabilities}`)
}
if (docs.counts?.serviceRoleTransactionRecordsPrepared !== 21) {
  fail(`docs_records_prepared:${docs.counts?.serviceRoleTransactionRecordsPrepared}`)
}
if (docs.counts?.serviceRoleTransactionRecordsReadyWithProvidedEvidence !== 21) {
  fail(`docs_records_ready:${docs.counts?.serviceRoleTransactionRecordsReadyWithProvidedEvidence}`)
}
if (docs.counts?.serviceRoleCapabilityScenariosReadyWithProvidedEvidence !== 12) {
  fail(`docs_capabilities_ready:${docs.counts?.serviceRoleCapabilityScenariosReadyWithProvidedEvidence}`)
}
if (docs.counts?.serviceRoleJobBatchRowsPrepared !== 1) fail(`docs_batch_rows:${docs.counts?.serviceRoleJobBatchRowsPrepared}`)
if (docs.counts?.serviceRoleJobRowsPrepared !== 21) fail(`docs_job_rows:${docs.counts?.serviceRoleJobRowsPrepared}`)
if (docs.counts?.serviceRoleWorkerClaimTransactionInputsPrepared !== 21) {
  fail(`docs_claim_inputs:${docs.counts?.serviceRoleWorkerClaimTransactionInputsPrepared}`)
}
if (docs.counts?.serviceRoleWorkerEventRowsPrepared !== 42) {
  fail(`docs_worker_events:${docs.counts?.serviceRoleWorkerEventRowsPrepared}`)
}
if (docs.counts?.serviceRoleAuditEventRowsPrepared !== 21) {
  fail(`docs_audit_events:${docs.counts?.serviceRoleAuditEventRowsPrepared}`)
}
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail(`docs_gpu_runtime_tools:${docs.counts?.gpuRuntimeTargetedTools}`)
if (docs.counts?.gpuRuntimeStartAllowedForAcceptedJobTools !== 8) {
  fail(`docs_gpu_future_start_tools:${docs.counts?.gpuRuntimeStartAllowedForAcceptedJobTools}`)
}
if (docs.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) {
  fail(`docs_heavy_tools_cpu:${docs.counts?.heavyToolsIncorrectlyTargetingCpu}`)
}
for (const countKey of [
  'liveServiceRoleTransactionsNow',
  'liveJobBatchRowsInsertedNow',
  'liveJobRowsInsertedNow',
  'liveWorkerClaimRowsInsertedNow',
  'liveWorkerEventRowsInsertedNow',
  'liveAuditEventRowsInsertedNow',
  'liveWorkerDispatchesNow',
  'liveToolExecutionsNow',
  'internalBetaReadyNowTools',
  'externalBetaReadyNowTools',
  'productionReadyNowTools',
]) {
  if (docs.counts?.[countKey] !== 0) fail(`docs_count_not_zero:${countKey}:${docs.counts?.[countKey]}`)
}

for (const key of [
  'internalBetaServiceRoleQueueTransactionReadinessPrepared',
  'sourceBackendQueueStorageAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21ServiceRoleTransactionRecordsPrepared',
  'all21ServiceRoleTransactionRecordsReadyWithProvidedEvidence',
  'all12CapabilityTransactionScenariosReadyWithProvidedEvidence',
  'serviceRoleRpcContractPrepared',
  'serviceRoleTransactionRollbackPlanPrepared',
  'all21IdempotencyKeysPrepared',
  'all21ApprovedSnapshotRefsAccepted',
  'all21CreditReservationRefsAccepted',
  'all21ApprovedSnapshotCreditBindingsReady',
  'privateArtifactManifestOnly',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}
if (!scorecard.includes('ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope')) {
  fail('scorecard_missing_internal_beta_service_role_queue_transaction_readiness')
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_service_role_queue_transaction')
if (defaultOutput.status !== 'missing_backend_queue_storage_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.serviceRoleTransactionRecordsPrepared !== 21) {
  fail(`default_records_prepared:${defaultOutput.serviceRoleTransactionRecordsPrepared}`)
}
if (defaultOutput.serviceRoleTransactionRecordsReadyWithProvidedEvidence !== 0) {
  fail(`default_records_ready:${defaultOutput.serviceRoleTransactionRecordsReadyWithProvidedEvidence}`)
}
if (defaultOutput.liveServiceRoleTransactionsNow !== 0) fail('default_live_transactions_not_0')

const { manifestPacketPath, gpuPacketPath } = writeAcceptedEvidencePackets()
const queueAdmissionPacketPath = writeQueueAdmissionReadinessPacket(manifestPacketPath, gpuPacketPath)
const legacyFlagOutput = parseJsonOutput(
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
  ]),
  'legacy_flag_service_role_queue_transaction',
)
if (legacyFlagOutput.status !== 'missing_backend_queue_storage_evidence') {
  fail(`legacy_flag_status:${legacyFlagOutput.status}`)
}
if (legacyFlagOutput.serviceRoleTransactionRecordsReadyWithProvidedEvidence !== 0) {
  fail(`legacy_flag_records_ready:${legacyFlagOutput.serviceRoleTransactionRecordsReadyWithProvidedEvidence}`)
}
if (legacyFlagOutput.input?.sourceEvidenceMode !== 'constructed_from_cli_flags') {
  fail(`legacy_flag_source_mode:${legacyFlagOutput.input?.sourceEvidenceMode}`)
}

const packetFedOutput = parseJsonOutput(
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
    '--internal-beta-queue-admission-readiness-packet',
    queueAdmissionPacketPath,
    '--require-transaction-envelope-ready',
  ]),
  'packet_fed_service_role_queue_transaction',
)
if (packetFedOutput.input?.sourceEvidenceMode !== 'internal_beta_queue_admission_readiness_packet') {
  fail(`packet_fed_source_mode:${packetFedOutput.input?.sourceEvidenceMode}`)
}
if (packetFedOutput.input?.internalBetaQueueAdmissionReadinessPacketRead !== true) {
  fail('packet_fed_queue_admission_packet_not_read')
}
if (packetFedOutput.status !== 'service_role_queue_transaction_envelope_prepared_live_writes_blocked') {
  fail(`packet_fed_status:${packetFedOutput.status}`)
}
if (packetFedOutput.serviceRoleTransactionRecordsReadyWithProvidedEvidence !== 21) {
  fail(`packet_fed_records_ready:${packetFedOutput.serviceRoleTransactionRecordsReadyWithProvidedEvidence}`)
}
if (packetFedOutput.serviceRoleCapabilityScenariosReadyWithProvidedEvidence !== 12) {
  fail(`packet_fed_capabilities_ready:${packetFedOutput.serviceRoleCapabilityScenariosReadyWithProvidedEvidence}`)
}
if (packetFedOutput.booleans?.gpuHeavyToolsTargetGpuRuntime !== true) {
  fail('packet_fed_gpu_runtime_targeting_not_preserved')
}
for (const key of falseGateKeys) {
  if (packetFedOutput.booleans?.[key] !== false) fail(`packet_fed_false_gate_not_false:${key}`)
}
for (const key of inputFalseKeys) {
  if (packetFedOutput.input?.[key] !== false) fail(`packet_fed_input_false_gate_not_false:${key}`)
}

expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-tool-count',
  (packet) => {
    packet.totalAiGraphicsTools = 20
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-gpu-start-now-boolean',
  (packet) => {
    packet.booleans.gpuRuntimeShouldStartNow = true
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-gpu-future-start-count',
  (packet) => {
    packet.gpuRuntimeStartAllowedForAcceptedJobTools = 7
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-gpu-approved-now',
  (packet) => {
    packet.booleans.gpuRuntimeApprovedNow = true
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-tool-scope-gpu-start-now',
  (packet) => {
    packet.queueAdmissionPackets[0].gpuRuntimeShouldStartNow = true
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-nested-runtime-enqueue-status',
  (packet) => {
    packet.sourceRuntimeEnqueueApproval.status = 'awaiting_internal_beta_runtime_enqueue_approval'
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-nested-owner-status',
  (packet) => {
    packet.sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval.status =
      'awaiting_internal_beta_go_no_go_owner_approval'
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-nested-rollup-gpu-count',
  (packet) => {
    packet.sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval.sourceGoNoGo.sourceRollup.gpuRuntimeTargetedTools = 7
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-nested-gpu-gate-target',
  (packet) => {
    const gateCheck =
      packet.sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval.sourceGoNoGo.sourceRollup
        .productionWorkerGateReadiness.productionWorkerGateChecks
        .find((candidate) => candidate.toolId === 'sam2')
    gateCheck.runtimeTarget = 'native_linux_amd64_cpu_worker'
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-nested-gpu-job-on-demand',
  (packet) => {
    const sourcePayload =
      packet.sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval.sourceGoNoGo.sourceRollup
        .productionWorkerGateReadiness.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads
        .find((candidate) => candidate.sourceToolId === 'sam2')
    sourcePayload.productionWorkerJobPayload.metadata.aiGraphicsRuntimeActivationPolicy.onDemandOnly = false
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-nested-gpu-job-cpu-fallback',
  (packet) => {
    const sourcePayload =
      packet.sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval.sourceGoNoGo.sourceRollup
        .productionWorkerGateReadiness.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads
        .find((candidate) => candidate.sourceToolId === 'sam2')
    sourcePayload.productionWorkerJobPayload.metadata.aiGraphicsRuntimeActivationPolicy.cpuFallbackAllowedForHeavyTools = true
  },
  manifestPacketPath,
  gpuPacketPath,
)

let liveTransactionExited = false
try {
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
    '--require-live-service-role-transaction',
  ])
} catch {
  liveTransactionExited = true
}
if (!liveTransactionExited) fail('require_live_service_role_transaction_did_not_fail_closed')

const forbiddenPatterns = [
  /serviceRoleQueueTransactionApprovedNow["'`:\s=]+true/i,
  /serviceRoleSupabaseWritesApprovedNow["'`:\s=]+true/i,
  /liveJobBatchInsertApprovedNow["'`:\s=]+true/i,
  /liveJobInsertApprovedNow["'`:\s=]+true/i,
  /liveWorkerClaimInsertApprovedNow["'`:\s=]+true/i,
  /liveWorkerEventInsertApprovedNow["'`:\s=]+true/i,
  /liveAuditEventInsertApprovedNow["'`:\s=]+true/i,
  /agentCanExecuteToolsNow["'`:\s=]+true/i,
  /workerQueueApprovedNow["'`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["'`:\s=]+true/i,
  /productionWorkerDispatchApprovedNow["'`:\s=]+true/i,
  /workerLeaseCreationApprovedNow["'`:\s=]+true/i,
  /toolExecutionApprovedNow["'`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["'`:\s=]+true/i,
  /gpuRuntimeApprovedNow["'`:\s=]+true/i,
  /runtimeReadyNow["'`:\s=]+true/i,
  /internalBetaReadyNow["'`:\s=]+true/i,
  /externalBetaReadyNow["'`:\s=]+true/i,
  /productionReadyNow["'`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
for (const [label, content] of Object.entries({
  moduleSource,
  cliSource,
  markdown,
  docs: JSON.stringify(docs),
})) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) fail(`forbidden_runtime_claim:${label}:${pattern}`)
  }
}

try {
  const basePkg = JSON.parse(git(['show', `${baseRef}:package.json`]))
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(basePkg[key] ?? {}) !== JSON.stringify(pkg[key] ?? {})) {
      fail(`package_dependency_section_changed:${key}`)
    }
  }
} catch (error) {
  fail(`package_dependency_compare_failed:${error.message}`)
}

try {
  const lockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
  if (lockDiff.trim()) fail('package_lock_changed')
} catch (error) {
  fail(`package_lock_diff_failed:${error.message}`)
}

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-traffic-enablement-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization": "tsx server/cli/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization.ts",',
  '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result": "tsx server/cli/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts",',
  '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-traffic-runtime-soak-result-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-activation-go-no-go": "tsx server/cli/ai-graphics-external-beta-activation-go-no-go.ts",',
  '+    "ai-graphics:external-beta-activation-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-activation-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-all-21-activation-rollup": "tsx server/cli/ai-graphics-external-beta-all-21-activation-rollup.ts",',
  '+    "ai-graphics:external-beta-all-21-activation-rollup:diagnostics": "node scripts/validation/ai-graphics-external-beta-all-21-activation-rollup-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-activated-launch-readiness": "tsx server/cli/ai-graphics-external-beta-activated-launch-readiness.ts",',
  '+    "ai-graphics:external-beta-activated-launch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-activated-launch-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly": "tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly:diagnostics": "node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-controls": "tsx server/cli/ai-graphics-external-beta-launch-controls.ts",',
  '+    "ai-graphics:external-beta-launch-controls:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs",',
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff": "tsx server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-handoff-diagnostics.mjs",`,
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:internal-beta-service-role-rpc-implementation-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-implementation-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-smoke-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-local-smoke": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-local-smoke.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-local-smoke:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-local-smoke-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-adapter-local-smoke.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-adapter-local-smoke-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-worker-handoff-local-smoke.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-worker-handoff-local-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

try {
  const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
  if (trackedLocalArtifacts.trim()) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
} catch (error) {
  fail(`local_artifacts_scan_failed:${error.message}`)
}

const generatedPathPattern = /(^|\/)(render|renders|media|canvas|webgl|public|signed-url|signed-urls|gcs)(\/|$)/i
try {
  const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
  for (const file of changedFiles) {
    if (generatedPathPattern.test(file)) fail(`generated_output_path_changed:${file}`)
  }
} catch (error) {
  fail(`generated_output_scan_failed:${error.message}`)
}

if (failures.length > 0) {
  console.error([
    'AI graphics internal beta service-role queue transaction readiness diagnostics failed:',
    ...failures.map((failure) => `- ${failure}`),
  ].join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  status: docs.status,
  tools: docs.tools.length,
  capabilities: docs.capabilities.length,
  serviceRoleTransactionRecordsPrepared: docs.counts.serviceRoleTransactionRecordsPrepared,
  serviceRoleTransactionRecordsReadyWithProvidedEvidence:
    docs.counts.serviceRoleTransactionRecordsReadyWithProvidedEvidence,
  serviceRoleCapabilityScenariosReadyWithProvidedEvidence:
    docs.counts.serviceRoleCapabilityScenariosReadyWithProvidedEvidence,
  serviceRoleJobRowsPrepared: docs.counts.serviceRoleJobRowsPrepared,
  serviceRoleWorkerEventRowsPrepared: docs.counts.serviceRoleWorkerEventRowsPrepared,
  serviceRoleAuditEventRowsPrepared: docs.counts.serviceRoleAuditEventRowsPrepared,
  liveServiceRoleTransactionsNow: docs.counts.liveServiceRoleTransactionsNow,
  liveJobRowsInsertedNow: docs.counts.liveJobRowsInsertedNow,
  liveWorkerClaimRowsInsertedNow: docs.counts.liveWorkerClaimRowsInsertedNow,
  gpuRuntimeTargetedTools: docs.counts.gpuRuntimeTargetedTools,
  gpuRuntimeStartAllowedForAcceptedJobTools: docs.counts.gpuRuntimeStartAllowedForAcceptedJobTools,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  serviceRoleQueueTransactionApprovedNow:
    docs.booleans.serviceRoleQueueTransactionApprovedNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
