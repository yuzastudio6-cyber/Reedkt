import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-service-role-queue-'))
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
  'idempotent',
  'append-only',
  'roll back',
]) {
  if (!markdown.toLowerCase().includes(token)) fail(`markdown_missing_transaction_guarantee:${token}`)
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
const approvedOutput = parseJsonOutput(
  runNpm(runScriptName, [
    ...acceptedArgs(manifestPacketPath, gpuPacketPath),
    '--require-transaction-envelope-ready',
  ]),
  'approved_service_role_queue_transaction',
)
if (approvedOutput.status !== 'service_role_queue_transaction_envelope_prepared_live_writes_blocked') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.serviceRoleTransactionRecordsReadyWithProvidedEvidence !== 21) {
  fail(`approved_records_ready:${approvedOutput.serviceRoleTransactionRecordsReadyWithProvidedEvidence}`)
}
if (approvedOutput.serviceRoleCapabilityScenariosReadyWithProvidedEvidence !== 12) {
  fail(`approved_capabilities_ready:${approvedOutput.serviceRoleCapabilityScenariosReadyWithProvidedEvidence}`)
}
if (approvedOutput.serviceRoleJobBatchRowsPrepared !== 1) fail(`approved_batch_rows:${approvedOutput.serviceRoleJobBatchRowsPrepared}`)
if (approvedOutput.serviceRoleJobRowsPrepared !== 21) fail(`approved_job_rows:${approvedOutput.serviceRoleJobRowsPrepared}`)
if (approvedOutput.serviceRoleWorkerClaimTransactionInputsPrepared !== 21) {
  fail(`approved_claim_inputs:${approvedOutput.serviceRoleWorkerClaimTransactionInputsPrepared}`)
}
if (approvedOutput.serviceRoleWorkerEventRowsPrepared !== 42) {
  fail(`approved_worker_events:${approvedOutput.serviceRoleWorkerEventRowsPrepared}`)
}
if (approvedOutput.serviceRoleAuditEventRowsPrepared !== 21) {
  fail(`approved_audit_events:${approvedOutput.serviceRoleAuditEventRowsPrepared}`)
}
if (approvedOutput.serviceRoleTransactionRecords?.length !== 21) fail('approved_records_length_not_21')
if (approvedOutput.serviceRoleCapabilityScenarios?.length !== 12) fail('approved_capabilities_length_not_12')
if (approvedOutput.serviceRoleTransactionRecords?.filter((record) => record.workerType === 'gpu_ai_worker').length !== 8) {
  fail('approved_gpu_records_not_8')
}
for (const tool of gpuTools) {
  const record = approvedOutput.serviceRoleTransactionRecords?.find((item) => item.toolId === tool)
  if (!record) fail(`approved_missing_gpu_tool_record:${tool}`)
  if (record?.workerType !== 'gpu_ai_worker') fail(`approved_gpu_tool_not_gpu_worker:${tool}`)
}
for (const record of approvedOutput.serviceRoleTransactionRecords ?? []) {
  if (record.jobType !== 'ai_graphics_tool_runtime') fail(`record_job_type:${record.toolId}:${record.jobType}`)
  if (record.serviceRoleTransactionEnvelopeReadyWithProvidedEvidence !== true) fail(`record_not_ready:${record.toolId}`)
  if (!String(record.idempotencyKey ?? '').startsWith('ai_graphics_internal_beta_service_role_queue:')) {
    fail(`record_bad_idempotency_key:${record.toolId}:${record.idempotencyKey}`)
  }
  if (!String(record.privateArtifactManifestRef ?? '').startsWith('private://')) {
    fail(`record_private_manifest_ref:${record.toolId}:${record.privateArtifactManifestRef}`)
  }
  if (record.jobBatchRowPrepared !== true) fail(`record_batch_not_prepared:${record.toolId}`)
  if (record.jobRowPrepared !== true) fail(`record_job_not_prepared:${record.toolId}`)
  if (record.workerClaimTransactionInputPrepared !== true) fail(`record_claim_not_prepared:${record.toolId}`)
  if (record.workerEventRowsPrepared !== 2) fail(`record_worker_events:${record.toolId}:${record.workerEventRowsPrepared}`)
  if (record.auditEventRowsPrepared !== 1) fail(`record_audit_events:${record.toolId}:${record.auditEventRowsPrepared}`)
  if (record.canRunServiceRoleTransactionNow !== false) fail(`record_can_transaction:${record.toolId}`)
  if (record.canInsertJobBatchNow !== false) fail(`record_can_insert_batch:${record.toolId}`)
  if (record.canInsertJobNow !== false) fail(`record_can_insert_job:${record.toolId}`)
  if (record.canInsertWorkerClaimNow !== false) fail(`record_can_insert_claim:${record.toolId}`)
  if (record.canInsertWorkerEventNow !== false) fail(`record_can_insert_worker_event:${record.toolId}`)
  if (record.canInsertAuditEventNow !== false) fail(`record_can_insert_audit_event:${record.toolId}`)
  if (record.canDispatchWorkerNow !== false) fail(`record_can_dispatch:${record.toolId}`)
  if (record.canExecuteToolNow !== false) fail(`record_can_execute:${record.toolId}`)
}
for (const scenario of approvedOutput.serviceRoleCapabilityScenarios ?? []) {
  if (!capabilities.includes(scenario.capabilityId)) fail(`unknown_capability_scenario:${scenario.capabilityId}`)
  if (scenario.selectedTransactionTools?.length < 1) fail(`scenario_no_selected_tools:${scenario.capabilityId}`)
  if (scenario.scenarioTransactionReadyWithProvidedEvidence !== true) {
    fail(`scenario_not_ready:${scenario.capabilityId}`)
  }
  if (scenario.canRunServiceRoleTransactionNow !== false) fail(`scenario_can_transaction:${scenario.capabilityId}`)
  if (scenario.canDispatchWorkersNow !== false) fail(`scenario_can_dispatch:${scenario.capabilityId}`)
  if (scenario.canExecuteToolsNow !== false) fail(`scenario_can_execute:${scenario.capabilityId}`)
}
for (const key of falseGateKeys) {
  if (approvedOutput.booleans?.[key] !== false) fail(`approved_false_gate_not_false:${key}`)
}
for (const key of inputFalseKeys) {
  if (approvedOutput.input?.[key] !== false) fail(`approved_input_false_gate_not_false:${key}`)
}

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
  serviceRoleQueueTransactionApprovedNow:
    docs.booleans.serviceRoleQueueTransactionApprovedNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
