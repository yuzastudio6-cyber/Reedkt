import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-service-role-rpc-smoke-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:internal-beta-service-role-rpc-smoke-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-service-role-rpc-smoke-readiness-diagnostics.mjs'

const docsJsonFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-smoke-readiness.json'
const docsMdFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-smoke-readiness.md'
const sourceQueueDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-queue-transaction-readiness.json'
const sourceRpcDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-implementation-readiness.json'
const registryFile =
  'server/tool-registry/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts'
const cliFile =
  'server/cli/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts'
const serviceFile = 'server/services/ai-graphics-tool-runtime-queue-service.ts'

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

const runtimeBuckets = [
  'planning_metadata_allowed_now',
  'cpu_static_execution_previously_validated_but_not_agent_executable_now',
  'browser_chart_runtime_later',
  'animation_runtime_later',
  'browser_canvas_webgl_runtime_later',
  'model_cpu_gpu_runtime_later',
  'tool_route_handoff_later',
  'worker_handoff_later',
  'public_artifact_and_signed_url_later',
]

const requiredRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
]

const gpuTools = new Set([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const trueBooleans = [
  'internalBetaServiceRoleRpcSmokeReadinessPrepared',
  'sourceServiceRoleQueueTransactionReadinessAccepted',
  'sourceServiceRoleRpcImplementationReadinessAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21RpcSmokeCasesPrepared',
  'all21RpcSmokeCasesReadyWithProvidedEvidence',
  'backendServiceAdapterMockValidated',
  'mockAdapterCanonicalRegistryValidation',
  'mockAdapterRejectedNonCanonicalTool',
  'mockAdapterRejectedProductionToolMismatch',
  'mockAdapterRejectedCapabilityMismatch',
  'liveSmokeCommandPrepared',
  'staticMigrationRequiredBeforeLiveSmoke',
  'nonProductionEnvironmentRequired',
  'serviceRoleCredentialsRequired',
  'approvedSnapshotFixtureRequired',
  'creditReservationFixtureRequired',
  'privateArtifactManifestOnly',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]

const falseBooleans = [
  'serviceRoleRpcSmokeApprovedNow',
  'serviceRoleRpcMigrationAppliedNow',
  'serviceRoleSupabaseWritesApprovedNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
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
  'serviceRoleRpcSmokePerformed',
  'serviceRoleMigrationApplyPerformed',
  'productionWorkerDispatchPerformed',
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
    env: { ...process.env, REEDITPRO_CONFIRM_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE: '' },
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function writeServiceRoleQueueTransactionReadinessPacket() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-rpc-smoke-source-'))
  const packetPath = path.join(root, 'service-role-queue-transaction-readiness-packet.json')
  fs.writeFileSync(packetPath, JSON.stringify({
    decision:
      'ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope',
    status: 'service_role_queue_transaction_envelope_prepared_live_writes_blocked',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    serviceRoleTransactionRecordsPrepared: 21,
    serviceRoleTransactionRecordsReadyWithProvidedEvidence: 21,
    serviceRoleCapabilityScenariosReadyWithProvidedEvidence: 12,
    serviceRoleJobRowsPrepared: 21,
    serviceRoleWorkerClaimTransactionInputsPrepared: 21,
    serviceRoleWorkerEventRowsPrepared: 42,
    serviceRoleAuditEventRowsPrepared: 21,
    liveServiceRoleTransactionsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    serviceRoleTransactionRecords: allTools.map((toolId) => ({
      toolId,
      workerType: gpuTools.has(toolId) ? 'gpu_ai_worker' : 'cpu_analysis_worker',
      serviceRoleTransactionEnvelopeReadyWithProvidedEvidence: true,
      canRunServiceRoleTransactionNow: false,
      canDispatchWorkerNow: false,
      canExecuteToolNow: false,
    })),
    booleans: {
      internalBetaServiceRoleQueueTransactionReadinessPrepared: true,
      sourceBackendQueueStorageAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ServiceRoleTransactionRecordsPrepared: true,
      all21ServiceRoleTransactionRecordsReadyWithProvidedEvidence: true,
      all12CapabilityTransactionScenariosReadyWithProvidedEvidence: true,
      serviceRoleRpcContractPrepared: true,
      serviceRoleTransactionRollbackPlanPrepared: true,
      all21IdempotencyKeysPrepared: true,
      all21ApprovedSnapshotRefsAccepted: true,
      all21CreditReservationRefsAccepted: true,
      all21ApprovedSnapshotCreditBindingsReady: true,
      privateArtifactManifestOnly: true,
      gpuHeavyToolsTargetGpuRuntime: true,
      agentCanSelectForPlanning: true,
      serviceRoleQueueTransactionApprovedNow: false,
      serviceRoleSupabaseWritesApprovedNow: false,
      liveJobBatchInsertApprovedNow: false,
      liveJobInsertApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
      liveWorkerEventInsertApprovedNow: false,
      liveAuditEventInsertApprovedNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      productionWorkerJobEnqueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      productionWorkerRouteExecutionApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
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
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      supabaseMutationPerformed: false,
      serviceRoleTransactionPerformed: false,
      workerLeaseCreated: false,
      productionWorkerDispatchPerformed: false,
      productionWorkerRouteExecutionPerformed: false,
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
  }, null, 2))
  return packetPath
}

function writeMutatedServiceRoleQueueTransactionPacket(sourcePacketPath, label, mutate) {
  const packet = JSON.parse(fs.readFileSync(sourcePacketPath, 'utf8'))
  mutate(packet)
  const packetPath = path.join(path.dirname(sourcePacketPath), `${label}.json`)
  fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8')
  return packetPath
}

function expectServiceRoleQueueTransactionPacketRejected(sourcePacketPath, label, mutate) {
  const badPacketPath = writeMutatedServiceRoleQueueTransactionPacket(sourcePacketPath, label, mutate)
  let rejected = false
  try {
    runNpm(runScriptName, [
      '--internal-beta-service-role-queue-transaction-readiness-packet',
      badPacketPath,
    ])
  } catch {
    rejected = true
  }
  if (!rejected) fail(`bad_service_role_queue_transaction_packet_not_rejected:${label}`)
}

for (const file of [
  docsJsonFile,
  docsMdFile,
  sourceQueueDocsFile,
  sourceRpcDocsFile,
  registryFile,
  cliFile,
  serviceFile,
  'package.json',
  'docs/production-beta-readiness-scorecard.md',
]) {
  read(file)
}

const pkg = json('package.json')
const docs = json(docsJsonFile)
const sourceQueueDocs = json(sourceQueueDocsFile)
const sourceRpcDocs = json(sourceRpcDocsFile)
const markdown = read(docsMdFile)
const registry = read(registryFile)
const cli = read(cliFile)
const service = read(serviceFile)
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

if (sourceQueueDocs.decision !== 'ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope') {
  fail(`unexpected_source_queue_decision:${sourceQueueDocs.decision}`)
}
if (sourceRpcDocs.decision !== 'ai_graphics_internal_beta_service_role_rpc_implementation_readiness_contract_prepared_with_static_migration') {
  fail(`unexpected_source_rpc_decision:${sourceRpcDocs.decision}`)
}
if (docs.decision !== 'ai_graphics_internal_beta_service_role_rpc_smoke_readiness_contract_prepared_live_smoke_blocked') {
  fail(`unexpected_decision:${docs.decision}`)
}
if (docs.status !== 'service_role_rpc_smoke_harness_prepared_live_smoke_blocked') {
  fail(`unexpected_status:${docs.status}`)
}
if (docs.sourceEvidencePolicy?.acceptsCommittedReadinessDocs !== true) {
  fail('docs_source_policy_missing_committed_docs_mode')
}
if (docs.sourceEvidencePolicy?.acceptsServiceRoleQueueTransactionReadinessPacket !== true) {
  fail('docs_source_policy_missing_transaction_packet_mode')
}
if (docs.sourceEvidencePolicy?.sourceServiceRoleQueueTransactionPacketMustReportNoWriteEnvelopeReady !== true) {
  fail('docs_source_policy_missing_no_write_envelope_requirement')
}
if (docs.sourceEvidencePolicy?.sourceServiceRoleQueueTransactionPacketMustCoverAll21Tools !== true) {
  fail('docs_source_policy_missing_all21_requirement')
}
if (docs.sourceEvidencePolicy?.sourceServiceRoleQueueTransactionPacketMustKeepEightGpuFutureStartTools !== true) {
  fail('docs_source_policy_missing_eight_gpu_future_start_requirement')
}
if (docs.sourceEvidencePolicy?.sourceServiceRoleQueueTransactionPacketMustKeepGpuStartNowFalse !== true) {
  fail('docs_source_policy_missing_gpu_start_now_false_requirement')
}
if (docs.sourceEvidencePolicy?.sourceServiceRoleQueueTransactionPacketMustKeepRuntimeBetaAndProductionFalse !== true) {
  fail('docs_source_policy_missing_runtime_beta_production_false_requirement')
}
if (docs.sourceEvidencePolicy?.liveSmokeExecutedNow !== false) {
  fail('docs_source_policy_live_smoke_not_false')
}
if (docs.sourceEvidencePolicy?.runtimeUnlockPerformed !== false) {
  fail('docs_source_policy_runtime_unlock_not_false')
}

for (const tool of allTools) {
  if (!docs.toolsCovered?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilitiesCovered?.includes(capability)) fail(`docs_missing_capability:${capability}`)
  if (!markdown.includes(`\`${capability}\``)) fail(`markdown_missing_capability:${capability}`)
}
for (const bucket of runtimeBuckets) {
  if (!docs.runtimeBuckets?.includes(bucket)) fail(`docs_missing_runtime_bucket:${bucket}`)
}
for (const rpc of requiredRpcs) {
  if (!docs.requiredServiceRoleRpcs?.includes(rpc)) fail(`docs_missing_rpc:${rpc}`)
  if (!registry.includes(rpc)) fail(`registry_missing_rpc:${rpc}`)
  if (!cli.includes(rpc)) fail(`cli_missing_rpc:${rpc}`)
  if (!service.includes(rpc)) fail(`service_missing_rpc:${rpc}`)
}

for (const token of [
  '--internal-beta-service-role-queue-transaction-readiness-packet',
  'sourceEvidenceMode',
  'internal_beta_service_role_queue_transaction_readiness_packet',
  'internalBetaServiceRoleQueueTransactionReadinessPacketRead',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE',
  'REEDITPRO_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE_ENV',
  '--execute-live-smoke',
  '--smoke-env',
  '--workspace-id',
  '--project-id',
  '--approved-plan-snapshot-id',
  '--credit-reservation-id',
  'AI graphics service-role RPC smoke is blocked in production.',
  'createSupabaseAdminClient',
  'buildAiGraphicsServiceRoleRpcSmokeJobs',
]) {
  if (!cli.includes(token)) fail(`cli_missing_guard:${token}`)
}
for (const token of [
  'createAiGraphicsToolRuntimeQueueService',
  'buildAiGraphicsServiceRoleRpcSmokeJobs',
  'mockAdapterRejectsPatchedJob',
  'listAiGraphicsToolCallReadiness',
  'private://ai-graphics/internal-beta/service-role-rpc-smoke',
  'not in the canonical 21-tool registry',
  'productionToolId mismatch',
  'capabilityId chart_overlay is not valid',
  'toolExecutionApprovedNow: false',
  'workerExecutionApprovedNow: false',
  'gpuHeavyToolsTargetGpuRuntime',
]) {
  if (!registry.includes(token)) fail(`registry_missing_token:${token}`)
}
for (const token of [
  'getAiGraphicsToolCallReadiness',
  'getAiGraphicsMappedProductionProfile',
  'Duplicate AI graphics tool-runtime job is not allowed',
  'productionToolId mismatch',
  'workerType mismatch',
  'runtimeTarget mismatch',
  'capabilityId',
]) {
  if (!service.includes(token)) fail(`service_missing_canonical_validation:${token}`)
}

if (docs.counts?.totalAiGraphicsTools !== 21) fail(`docs_total_tools:${docs.counts?.totalAiGraphicsTools}`)
if (docs.counts?.totalProductFacingCapabilities !== 12) {
  fail(`docs_total_capabilities:${docs.counts?.totalProductFacingCapabilities}`)
}
if (docs.counts?.rpcSmokeCasesPrepared !== 21) fail(`docs_smoke_case_count:${docs.counts?.rpcSmokeCasesPrepared}`)
if (docs.counts?.rpcSmokeCasesReadyWithProvidedEvidence !== 21) {
  fail(`docs_smoke_ready_count:${docs.counts?.rpcSmokeCasesReadyWithProvidedEvidence}`)
}
if (docs.counts?.serviceRoleRpcsCovered !== 4) fail(`docs_rpc_count:${docs.counts?.serviceRoleRpcsCovered}`)
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail(`docs_gpu_count:${docs.counts?.gpuRuntimeTargetedTools}`)
if (docs.counts?.gpuRuntimeStartAllowedForAcceptedJobTools !== 8) {
  fail(`docs_gpu_start_allowed_count:${docs.counts?.gpuRuntimeStartAllowedForAcceptedJobTools}`)
}
if (docs.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) {
  fail(`docs_heavy_cpu_count:${docs.counts?.heavyToolsIncorrectlyTargetingCpu}`)
}
for (const countKey of [
  'liveServiceRoleRpcSmokeExecutedNow',
  'liveMigrationAppliesNow',
  'liveJobRowsInsertedNow',
  'liveWorkerClaimRowsInsertedNow',
  'liveWorkerEventRowsInsertedNow',
  'liveAuditEventRowsInsertedNow',
  'liveToolExecutionsNow',
  'internalBetaReadyNowTools',
  'externalBetaReadyNowTools',
  'productionReadyNowTools',
]) {
  if (docs.counts?.[countKey] !== 0) fail(`docs_count_not_zero:${countKey}:${docs.counts?.[countKey]}`)
}
for (const key of trueBooleans) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}
for (const key of falseBooleans) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}

let dryOutput = {}
try {
  dryOutput = JSON.parse(runNpm(runScriptName))
} catch (error) {
  fail(`dry_readiness_command_failed:${error.message}`)
}
if (dryOutput.decision !== docs.decision) fail(`dry_output_decision:${dryOutput.decision}`)
if (dryOutput.rpcSmokeCasesPrepared !== 21) fail(`dry_output_smoke_cases:${dryOutput.rpcSmokeCasesPrepared}`)
if (dryOutput.rpcSmokeCasesReadyWithProvidedEvidence !== 21) {
  fail(`dry_output_ready_cases:${dryOutput.rpcSmokeCasesReadyWithProvidedEvidence}`)
}
const dryOutputTools = Array.isArray(dryOutput.rpcSmokeCases)
  ? dryOutput.rpcSmokeCases.map((record) => record.toolId)
  : []
for (const tool of allTools) {
  if (!dryOutputTools.includes(tool)) fail(`dry_output_missing_tool:${tool}`)
}
if (dryOutput.liveServiceRoleRpcSmokeExecutedNow !== 0) {
  fail(`dry_output_live_smoke:${dryOutput.liveServiceRoleRpcSmokeExecutedNow}`)
}
if (dryOutput.booleans?.agentCanExecuteToolsNow !== false) fail('dry_output_agent_execution_not_false')
if (dryOutput.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('dry_output_gpu_runtime_should_start_now_not_false')
}
if (dryOutput.booleans?.serviceRoleSupabaseWritesApprovedNow !== false) {
  fail('dry_output_supabase_writes_not_false')
}
if (dryOutput.booleans?.mockAdapterCanonicalRegistryValidation !== true) {
  fail('dry_output_canonical_registry_validation_not_true')
}
if (dryOutput.booleans?.mockAdapterRejectedNonCanonicalTool !== true) {
  fail('dry_output_noncanonical_tool_rejection_not_true')
}
if (dryOutput.booleans?.mockAdapterRejectedProductionToolMismatch !== true) {
  fail('dry_output_production_tool_mismatch_rejection_not_true')
}
if (dryOutput.booleans?.mockAdapterRejectedCapabilityMismatch !== true) {
  fail('dry_output_capability_mismatch_rejection_not_true')
}

let packetFedOutput = {}
const validServiceRoleQueueTransactionPacket = writeServiceRoleQueueTransactionReadinessPacket()
try {
  packetFedOutput = JSON.parse(runNpm(runScriptName, [
    '--internal-beta-service-role-queue-transaction-readiness-packet',
    validServiceRoleQueueTransactionPacket,
  ]))
} catch (error) {
  fail(`packet_fed_readiness_command_failed:${error.message}`)
}
if (packetFedOutput.input?.sourceEvidenceMode !== 'internal_beta_service_role_queue_transaction_readiness_packet') {
  fail(`packet_fed_source_mode:${packetFedOutput.input?.sourceEvidenceMode}`)
}
if (packetFedOutput.input?.internalBetaServiceRoleQueueTransactionReadinessPacketRead !== true) {
  fail('packet_fed_source_packet_not_read')
}
if (packetFedOutput.rpcSmokeCasesReadyWithProvidedEvidence !== 21) {
  fail(`packet_fed_ready_cases:${packetFedOutput.rpcSmokeCasesReadyWithProvidedEvidence}`)
}
if (packetFedOutput.booleans?.serviceRoleRpcSmokeApprovedNow !== false) {
  fail('packet_fed_service_role_rpc_smoke_not_false')
}
if (packetFedOutput.booleans?.serviceRoleSupabaseWritesApprovedNow !== false) {
  fail('packet_fed_supabase_writes_not_false')
}
if (packetFedOutput.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('packet_fed_gpu_runtime_should_start_now_not_false')
}
if (packetFedOutput.booleans?.runtimeReadyNow !== false) fail('packet_fed_runtime_not_false')
if (packetFedOutput.input?.gpuRuntimePerformed !== false) fail('packet_fed_gpu_runtime_performed_not_false')

expectServiceRoleQueueTransactionPacketRejected(
  validServiceRoleQueueTransactionPacket,
  'missing-one-tool',
  (packet) => {
    packet.totalAiGraphicsTools = 20
  },
)
expectServiceRoleQueueTransactionPacketRejected(
  validServiceRoleQueueTransactionPacket,
  'gpu-start-now',
  (packet) => {
    packet.booleans.gpuRuntimeShouldStartNow = true
  },
)
expectServiceRoleQueueTransactionPacketRejected(
  validServiceRoleQueueTransactionPacket,
  'gpu-worker-count-seven',
  (packet) => {
    const gpuRecord = packet.serviceRoleTransactionRecords.find((record) => (
      record.workerType === 'gpu_ai_worker'
    ))
    gpuRecord.workerType = 'cpu_analysis_worker'
  },
)
expectServiceRoleQueueTransactionPacketRejected(
  validServiceRoleQueueTransactionPacket,
  'gpu-approved-now',
  (packet) => {
    packet.booleans.gpuRuntimeApprovedNow = true
  },
)
expectServiceRoleQueueTransactionPacketRejected(
  validServiceRoleQueueTransactionPacket,
  'tool-execution-now',
  (packet) => {
    packet.serviceRoleTransactionRecords[0].canExecuteToolNow = true
  },
)
expectServiceRoleQueueTransactionPacketRejected(
  validServiceRoleQueueTransactionPacket,
  'service-role-transaction-approved-now',
  (packet) => {
    packet.booleans.serviceRoleQueueTransactionApprovedNow = true
  },
)

if (!scorecard.includes('ai_graphics_internal_beta_service_role_rpc_smoke_readiness_contract_prepared_live_smoke_blocked')) {
  fail('scorecard_missing_service_role_rpc_smoke_readiness')
}

const forbiddenPatterns = [
  /agentCanExecuteToolsNow["'`:\s=]+true/i,
  /routeExecutionApprovedNow["'`:\s=]+true/i,
  /workerExecutionApprovedNow["'`:\s=]+true/i,
  /toolExecutionApprovedNow["'`:\s=]+true/i,
  /serviceRoleRpcSmokeApprovedNow["'`:\s=]+true/i,
  /serviceRoleRpcMigrationAppliedNow["'`:\s=]+true/i,
  /serviceRoleSupabaseWritesApprovedNow["'`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["'`:\s=]+true/i,
  /runtimeReadyNow["'`:\s=]+true/i,
  /internalBetaReadyNow["'`:\s=]+true/i,
  /externalBetaReadyNow["'`:\s=]+true/i,
  /productionReadyNow["'`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
for (const [label, content] of Object.entries({
  docs: JSON.stringify(docs),
  markdown,
  registry,
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
    'AI graphics internal beta service-role RPC smoke readiness diagnostics failed:',
    ...failures.map((failure) => `- ${failure}`),
  ].join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  status: docs.status,
  tools: docs.toolsCovered.length,
  capabilities: docs.capabilitiesCovered.length,
  rpcSmokeCasesPrepared: docs.counts.rpcSmokeCasesPrepared,
  rpcSmokeCasesReadyWithProvidedEvidence: docs.counts.rpcSmokeCasesReadyWithProvidedEvidence,
  serviceRoleRpcsCovered: docs.counts.serviceRoleRpcsCovered,
  gpuRuntimeTargetedTools: docs.counts.gpuRuntimeTargetedTools,
  gpuRuntimeStartAllowedForAcceptedJobTools: docs.counts.gpuRuntimeStartAllowedForAcceptedJobTools,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  liveServiceRoleRpcSmokeExecutedNow: docs.counts.liveServiceRoleRpcSmokeExecutedNow,
  liveMigrationAppliesNow: docs.counts.liveMigrationAppliesNow,
  liveToolExecutionsNow: docs.counts.liveToolExecutionsNow,
  serviceRoleRpcSmokeApprovedNow: docs.booleans.serviceRoleRpcSmokeApprovedNow,
  serviceRoleSupabaseWritesApprovedNow: docs.booleans.serviceRoleSupabaseWritesApprovedNow,
  agentCanExecuteToolsNow: docs.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
