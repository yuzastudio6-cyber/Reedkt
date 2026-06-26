import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

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
  fs.writeFileSync(manifestPacketPath, `${JSON.stringify({
    manifestRecordsProvided: 5,
    schemaValidManifestRecords: 5,
    reviewAcceptedManifestRecords: 5,
    nativeGpuProofInputEligibleRecords: 5,
    privateArtifactRefsLogged: 0,
    booleans: {
      privateArtifactRefsNotLogged: true,
      publicOrSignedArtifactRefsRejected: true,
    },
  }, null, 2)}\n`, 'utf8')
  fs.writeFileSync(gpuPacketPath, `${JSON.stringify({
    runtimeProofResultsProvided: 4,
    runtimeProofResultsAcceptedForOwnerReview: 4,
    nativeGpuRuntimeProofResultsAccepted: true,
    booleans: {
      nativeGpuRuntimeProofResultsAcceptedForOwnerReview: true,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
    },
  }, null, 2)}\n`, 'utf8')
  return { manifestPacketPath, gpuPacketPath }
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
]) {
  if (!moduleSource.includes(token)) fail(`module_missing_token:${token}`)
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
const approvedOutput = parseJsonOutput(
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
    '--require-mock-service-queue-records-ready',
  ]),
  'approved_backend_queue_storage',
)
if (approvedOutput.status !== 'mock_service_queue_records_created_runtime_still_blocked') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.backendQueueStorageRecordsCreatedWithProvidedEvidence !== 21) {
  fail(`approved_records_ready:${approvedOutput.backendQueueStorageRecordsCreatedWithProvidedEvidence}`)
}
if (approvedOutput.backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence !== 12) {
  fail(`approved_capabilities_ready:${approvedOutput.backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence}`)
}
if (approvedOutput.mockJobBatchCreated !== true) fail('approved_mock_job_batch_not_created')
if (approvedOutput.mockJobBatchWarningCount !== 1) fail(`approved_batch_warning_count:${approvedOutput.mockJobBatchWarningCount}`)
if (approvedOutput.mockJobServiceWarnings !== 22) fail(`approved_mock_job_service_warnings:${approvedOutput.mockJobServiceWarnings}`)
if (approvedOutput.backendQueueStorageRecords?.length !== 21) fail('approved_records_length_not_21')
if (approvedOutput.backendQueueStorageCapabilityScenarios?.length !== 12) fail('approved_capabilities_length_not_12')
if (approvedOutput.backendQueueStorageRecords?.filter((record) => record.workerType === 'gpu_ai_worker').length !== 8) {
  fail('approved_gpu_records_not_8')
}
for (const tool of gpuTools) {
  const record = approvedOutput.backendQueueStorageRecords?.find((item) => item.toolId === tool)
  if (!record) fail(`approved_missing_gpu_tool_record:${tool}`)
  if (record?.workerType !== 'gpu_ai_worker') fail(`approved_gpu_tool_not_gpu_worker:${tool}`)
}
for (const record of approvedOutput.backendQueueStorageRecords ?? []) {
  if (record.jobType !== 'ai_graphics_tool_runtime') fail(`record_job_type:${record.toolId}:${record.jobType}`)
  if (record.jobServiceStatus !== 'queued') fail(`record_status:${record.toolId}:${record.jobServiceStatus}`)
  if (record.jobServiceRecordCreated !== true) fail(`record_not_created:${record.toolId}`)
  if (record.jobServiceRecordMockOnly !== true) fail(`record_not_mock_only:${record.toolId}`)
  if (record.jobServiceWarningCount !== 1) fail(`record_warning_count:${record.toolId}:${record.jobServiceWarningCount}`)
  if (record.sourceDispatcherProbeCompletedWithProvidedEvidence !== true) fail(`record_source_not_ready:${record.toolId}`)
  if (record.approvedPlanSnapshotId !== 'approved_snapshot_ai_graphics_internal_beta_fixture') {
    fail(`record_approved_snapshot_id:${record.toolId}:${record.approvedPlanSnapshotId}`)
  }
  if (record.creditReservationId !== 'credit_reservation_ai_graphics_internal_beta_fixture') {
    fail(`record_credit_reservation_id:${record.toolId}:${record.creditReservationId}`)
  }
  if (!String(record.privateArtifactManifestRef ?? '').startsWith('private://')) {
    fail(`record_private_manifest_ref:${record.toolId}:${record.privateArtifactManifestRef}`)
  }
  if (record.canWriteSupabaseJobNow !== false) fail(`record_can_write_supabase:${record.toolId}`)
  if (record.canCreateLiveWorkerClaimNow !== false) fail(`record_can_live_claim:${record.toolId}`)
  if (record.canDispatchLiveWorkerNow !== false) fail(`record_can_live_dispatch:${record.toolId}`)
  if (record.canExecuteToolNow !== false) fail(`record_can_execute:${record.toolId}`)
}
for (const scenario of approvedOutput.backendQueueStorageCapabilityScenarios ?? []) {
  if (!capabilities.includes(scenario.capabilityId)) fail(`unknown_capability_scenario:${scenario.capabilityId}`)
  if (scenario.selectedQueueStorageTools?.length < 1) fail(`scenario_no_selected_tools:${scenario.capabilityId}`)
  if (scenario.scenarioQueueStorageReadyWithProvidedEvidence !== true) {
    fail(`scenario_not_ready:${scenario.capabilityId}`)
  }
  if (scenario.canWriteSupabaseJobsNow !== false) fail(`scenario_can_write_supabase:${scenario.capabilityId}`)
  if (scenario.canCreateLiveWorkerClaimsNow !== false) fail(`scenario_can_claim:${scenario.capabilityId}`)
  if (scenario.canExecuteToolsNow !== false) fail(`scenario_can_execute:${scenario.capabilityId}`)
}
for (const key of falseGateKeys) {
  if (approvedOutput.booleans?.[key] !== false) fail(`approved_false_gate_not_false:${key}`)
}
for (const key of inputFalseKeys) {
  if (approvedOutput.input?.[key] !== false) fail(`approved_input_false_gate_not_false:${key}`)
}

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
  serviceRoleSupabaseWritesApprovedNow:
    docs.booleans.serviceRoleSupabaseWritesApprovedNow,
  backendQueueSubmissionApprovedNow: docs.booleans.backendQueueSubmissionApprovedNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
