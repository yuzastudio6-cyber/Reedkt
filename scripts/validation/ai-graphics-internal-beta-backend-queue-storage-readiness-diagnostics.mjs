import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedNativeGpuProofCollectionPacket } from './ai-graphics-native-gpu-proof-collection-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-backend-queue-storage-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-internal-beta-backend-queue-storage-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:internal-beta-backend-queue-storage-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-backend-queue-storage-readiness-diagnostics.mjs'

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

const requiredRecordFields = [
  'toolId',
  'productionToolId',
  'jobId',
  'jobType',
  'workerType',
  'runtimeTarget',
  'capabilityIds',
  'approvedPlanSnapshotId',
  'creditReservationId',
  'privateArtifactManifestRef',
  'sourceDispatcherProbeCompletedWithProvidedEvidence',
  'jobServiceRecordCreated',
  'jobServiceRecordMockOnly',
  'jobServiceStatus',
  'jobServiceWarningCount',
  'canWriteSupabaseJobNow',
  'canCreateLiveWorkerClaimNow',
  'canDispatchLiveWorkerNow',
  'canExecuteToolNow',
]

const falseGateKeys = [
  'serviceRoleSupabaseWritesApprovedNow',
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-backend-queue-storage-'))
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
      '--require-mock-service-queue-records-ready',
    ])
  } catch {
    rejected = true
  }
  if (!rejected) fail(`bad_queue_admission_packet_not_rejected:${label}`)
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-backend-queue-storage-readiness.ts',
  'server/cli/ai-graphics-internal-beta-backend-queue-storage-readiness.ts',
  'scripts/validation/ai-graphics-internal-beta-backend-queue-storage-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-backend-queue-storage-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-backend-queue-storage-readiness.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-queue-dispatcher-readiness.json',
  'server/services/job-service.ts',
  'src/types/jobs.ts',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-backend-queue-storage-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-backend-queue-storage-readiness.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-backend-queue-storage-readiness.ts')
const jobServiceSource = read('server/services/job-service.ts')
const jobTypesSource = read('src/types/jobs.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-backend-queue-storage-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-internal-beta-backend-queue-storage-readiness'")) {
  fail('server_registry_index_does_not_export_internal_beta_backend_queue_storage_readiness')
}
if (!jobTypesSource.includes("| 'ai_graphics_tool_runtime'")) {
  fail('job_type_union_missing_ai_graphics_tool_runtime')
}
if (!jobServiceSource.includes("'ai_graphics_tool_runtime'")) {
  fail('job_service_execution_job_types_missing_ai_graphics_tool_runtime')
}
if (!jobServiceSource.includes('Execution jobs require approved snapshot and credit reservation IDs.')) {
  fail('job_service_missing_execution_snapshot_credit_requirement')
}

if (docs.decision !== 'ai_graphics_internal_beta_backend_queue_storage_readiness_contract_prepared_with_mock_service_records') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.status !== 'mock_service_queue_records_created_runtime_still_blocked') {
  fail(`unexpected_docs_status:${docs.status}`)
}
if (docs.sourceDecisions?.queueDispatcher !== 'ai_graphics_internal_beta_queue_dispatcher_readiness_contract_prepared_with_mock_safe_dispatcher') {
  fail(`unexpected_queue_dispatcher_source_decision:${docs.sourceDecisions?.queueDispatcher}`)
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
  queueDispatcherProbeStillRequired: true,
  productionWorkerJobEvidenceStillRequired: true,
  mockServiceRecordsOnly: true,
  liveSupabaseWritesPerformed: false,
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
  'missing_queue_dispatcher_evidence',
  'mock_service_queue_records_created_runtime_still_blocked',
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
for (const field of requiredRecordFields) {
  if (!docs.jobServiceRecordFields?.includes(field)) fail(`docs_missing_job_service_record_field:${field}`)
}
for (const token of [
  'createJobService',
  'createJobBatch',
  'createJob',
  'ai_graphics_tool_runtime',
  'approvedPlanSnapshotId',
  'creditReservationId',
  'privateArtifactManifestRef',
  'mockJobServiceRecordsOnly',
  'serviceRoleSupabaseWritesApprovedNow',
  'approvedPlanSnapshotRefAccepted',
  'creditReservationRefAccepted',
]) {
  if (!moduleSource.includes(token)) fail(`module_missing_token:${token}`)
}
for (const token of [
  '`approved_snapshot_*`',
  '`credit_reservation_*`',
  'Generic placeholders are not backend queue storage evidence.',
]) {
  if (!markdown.includes(token)) fail(`markdown_missing_ref_format_policy:${token}`)
}
for (const token of [
  '--require-mock-service-queue-records-ready',
  '--require-live-supabase-job-writes',
  '--require-live-worker-claims',
  '--require-runtime-ready',
  '--require-production-ready',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing_flag:${token}`)
}
for (const table of [
  'job_batches',
  'jobs',
  'worker_job_claims',
  'worker_events',
  'approved_plan_snapshots',
  'credit_reservations',
  'audit_events',
]) {
  if (!docs.requiredLiveServiceRoleTables?.includes(table)) fail(`docs_missing_required_table:${table}`)
  if (!markdown.includes(`\`${table}\``)) fail(`markdown_missing_required_table:${table}`)
}
for (const action of [
  'Supabase service-role job write',
  'backend queue submission',
  'live worker queue enqueue',
  'live worker claim row creation',
  'live worker lease creation',
  'live production worker dispatch',
  'tool execution',
  'Tool Route execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'signed URL creation',
  'public artifact creation',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(action)) fail(`docs_missing_blocked_action:${action}`)
  if (!markdown.includes(action)) fail(`markdown_missing_blocked_action:${action}`)
}

if (docs.counts?.totalAiGraphicsTools !== 21) fail(`docs_total_tools:${docs.counts?.totalAiGraphicsTools}`)
if (docs.counts?.totalProductFacingCapabilities !== 12) {
  fail(`docs_total_capabilities:${docs.counts?.totalProductFacingCapabilities}`)
}
if (docs.counts?.backendQueueStorageRecordsPrepared !== 21) {
  fail(`docs_records_prepared:${docs.counts?.backendQueueStorageRecordsPrepared}`)
}
if (docs.counts?.backendQueueStorageRecordsCreatedWithProvidedEvidence !== 21) {
  fail(`docs_records_ready:${docs.counts?.backendQueueStorageRecordsCreatedWithProvidedEvidence}`)
}
if (docs.counts?.backendQueueStorageCapabilityScenariosPrepared !== 12) {
  fail(`docs_capability_scenarios_prepared:${docs.counts?.backendQueueStorageCapabilityScenariosPrepared}`)
}
if (docs.counts?.backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence !== 12) {
  fail(`docs_capability_scenarios_ready:${docs.counts?.backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence}`)
}
if (docs.counts?.mockJobBatchCreated !== true) fail('docs_mock_job_batch_not_created')
if (docs.counts?.mockJobBatchWarningCount !== 1) fail(`docs_batch_warning_count:${docs.counts?.mockJobBatchWarningCount}`)
if (docs.counts?.mockJobServiceWarnings !== 22) fail(`docs_mock_job_service_warnings:${docs.counts?.mockJobServiceWarnings}`)
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail(`docs_gpu_runtime_tools:${docs.counts?.gpuRuntimeTargetedTools}`)
if (docs.counts?.gpuRuntimeStartAllowedForAcceptedJobTools !== 8) {
  fail(`docs_gpu_future_start_tools:${docs.counts?.gpuRuntimeStartAllowedForAcceptedJobTools}`)
}
if (docs.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) {
  fail(`docs_heavy_tools_cpu:${docs.counts?.heavyToolsIncorrectlyTargetingCpu}`)
}
for (const countKey of [
  'liveSupabaseJobWritesNow',
  'liveWorkerClaimRowsNow',
  'liveWorkerDispatchesNow',
  'liveToolExecutionsNow',
  'internalBetaReadyNowTools',
  'externalBetaReadyNowTools',
  'productionReadyNowTools',
]) {
  if (docs.counts?.[countKey] !== 0) fail(`docs_count_not_zero:${countKey}:${docs.counts?.[countKey]}`)
}

for (const key of [
  'internalBetaBackendQueueStorageReadinessPrepared',
  'sourceQueueDispatcherAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21BackendQueueStorageRecordsPrepared',
  'all21BackendQueueStorageRecordsCreatedWithProvidedEvidence',
  'all12CapabilityScenariosCreatedWithProvidedEvidence',
  'aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit',
  'mockJobServiceRecordsOnly',
  'gpuHeavyToolsTargetGpuRuntime',
  'all21ApprovedSnapshotRefsAccepted',
  'all21CreditReservationRefsAccepted',
  'privateArtifactManifestOnly',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}
if (!scorecard.includes('ai_graphics_internal_beta_backend_queue_storage_readiness_contract_prepared_with_mock_service_records')) {
  fail('scorecard_missing_internal_beta_backend_queue_storage_readiness')
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_backend_queue_storage')
if (defaultOutput.status !== 'missing_queue_dispatcher_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.backendQueueStorageRecordsPrepared !== 21) {
  fail(`default_records_prepared:${defaultOutput.backendQueueStorageRecordsPrepared}`)
}
if (defaultOutput.backendQueueStorageRecordsCreatedWithProvidedEvidence !== 0) {
  fail(`default_records_ready:${defaultOutput.backendQueueStorageRecordsCreatedWithProvidedEvidence}`)
}
if (defaultOutput.mockJobBatchCreated !== false) fail('default_mock_job_batch_created')
if (defaultOutput.liveSupabaseJobWritesNow !== 0) fail('default_live_supabase_writes_not_0')

const { manifestPacketPath, gpuPacketPath } = writeAcceptedEvidencePackets()
const queueAdmissionPacketPath = writeQueueAdmissionReadinessPacket(manifestPacketPath, gpuPacketPath)
const legacyFlagOutput = parseJsonOutput(
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
  ]),
  'legacy_flag_backend_queue_storage',
)
if (legacyFlagOutput.status !== 'missing_queue_dispatcher_evidence') {
  fail(`legacy_flag_status:${legacyFlagOutput.status}`)
}
if (legacyFlagOutput.backendQueueStorageRecordsCreatedWithProvidedEvidence !== 0) {
  fail(`legacy_flag_records_ready:${legacyFlagOutput.backendQueueStorageRecordsCreatedWithProvidedEvidence}`)
}
if (legacyFlagOutput.input?.sourceEvidenceMode !== 'constructed_from_cli_flags') {
  fail(`legacy_flag_source_mode:${legacyFlagOutput.input?.sourceEvidenceMode}`)
}

const packetFedOutput = parseJsonOutput(
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
    '--internal-beta-queue-admission-readiness-packet',
    queueAdmissionPacketPath,
    '--require-mock-service-queue-records-ready',
  ]),
  'packet_fed_backend_queue_storage',
)
if (packetFedOutput.input?.sourceEvidenceMode !== 'internal_beta_queue_admission_readiness_packet') {
  fail(`packet_fed_source_mode:${packetFedOutput.input?.sourceEvidenceMode}`)
}
if (packetFedOutput.input?.internalBetaQueueAdmissionReadinessPacketRead !== true) {
  fail('packet_fed_queue_admission_packet_not_read')
}
if (packetFedOutput.status !== 'mock_service_queue_records_created_runtime_still_blocked') {
  fail(`packet_fed_status:${packetFedOutput.status}`)
}
if (packetFedOutput.backendQueueStorageRecordsCreatedWithProvidedEvidence !== 21) {
  fail(`packet_fed_records_ready:${packetFedOutput.backendQueueStorageRecordsCreatedWithProvidedEvidence}`)
}
if (packetFedOutput.backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence !== 12) {
  fail(`packet_fed_capabilities_ready:${packetFedOutput.backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence}`)
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
    packet.sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval
      .sourceGoNoGo.sourceRollup.gpuRuntimeTargetedTools = 7
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-nested-gpu-gate-target',
  (packet) => {
    const gate = packet.sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval
      .sourceGoNoGo.sourceRollup.productionWorkerGateReadiness.productionWorkerGateChecks
      .find((item) => item.toolId === 'sam2')
    gate.runtimeTarget = 'native_linux_amd64_cpu_worker'
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-nested-gpu-job-on-demand',
  (packet) => {
    const job = packet.sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval
      .sourceGoNoGo.sourceRollup.productionWorkerGateReadiness
      .sourceProductionWorkerJobReadiness.productionWorkerJobPayloads
      .find((item) => item.sourceToolId === 'sam2')
    job.productionWorkerJobPayload.metadata.aiGraphicsRuntimeActivationPolicy.onDemandOnly = false
  },
  manifestPacketPath,
  gpuPacketPath,
)
expectQueueAdmissionPacketRejected(
  queueAdmissionPacketPath,
  'bad-nested-gpu-job-cpu-fallback',
  (packet) => {
    const job = packet.sourceRuntimeEnqueueApproval.sourceGoNoGoOwnerApproval
      .sourceGoNoGo.sourceRollup.productionWorkerGateReadiness
      .sourceProductionWorkerJobReadiness.productionWorkerJobPayloads
      .find((item) => item.sourceToolId === 'sam2')
    job.productionWorkerJobPayload.metadata.aiGraphicsRuntimeActivationPolicy.cpuFallbackAllowedForHeavyTools = true
  },
  manifestPacketPath,
  gpuPacketPath,
)

let liveWritesExited = false
try {
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
    '--require-live-supabase-job-writes',
  ])
} catch {
  liveWritesExited = true
}
if (!liveWritesExited) fail('require_live_supabase_job_writes_did_not_fail_closed')

const forbiddenPatterns = [
  /serviceRoleSupabaseWritesApprovedNow["'`:\s=]+true/i,
  /agentCanExecuteToolsNow["'`:\s=]+true/i,
  /workerQueueApprovedNow["'`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["'`:\s=]+true/i,
  /productionWorkerJobEnqueueApprovedNow["'`:\s=]+true/i,
  /productionWorkerDispatchApprovedNow["'`:\s=]+true/i,
  /productionWorkerRouteExecutionApprovedNow["'`:\s=]+true/i,
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
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-queue-transaction-readiness-diagnostics.mjs",',
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
    'AI graphics internal beta backend queue storage readiness diagnostics failed:',
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
  backendQueueStorageRecordsPrepared: docs.counts.backendQueueStorageRecordsPrepared,
  backendQueueStorageRecordsCreatedWithProvidedEvidence:
    docs.counts.backendQueueStorageRecordsCreatedWithProvidedEvidence,
  backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence:
    docs.counts.backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence,
  mockJobBatchCreated: docs.counts.mockJobBatchCreated,
  mockJobServiceWarnings: docs.counts.mockJobServiceWarnings,
  liveSupabaseJobWritesNow: docs.counts.liveSupabaseJobWritesNow,
  liveWorkerClaimRowsNow: docs.counts.liveWorkerClaimRowsNow,
  liveWorkerDispatchesNow: docs.counts.liveWorkerDispatchesNow,
  gpuRuntimeTargetedTools: docs.counts.gpuRuntimeTargetedTools,
  gpuRuntimeStartAllowedForAcceptedJobTools: docs.counts.gpuRuntimeStartAllowedForAcceptedJobTools,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  serviceRoleSupabaseWritesApprovedNow:
    docs.booleans.serviceRoleSupabaseWritesApprovedNow,
  backendQueueSubmissionApprovedNow: docs.booleans.backendQueueSubmissionApprovedNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
