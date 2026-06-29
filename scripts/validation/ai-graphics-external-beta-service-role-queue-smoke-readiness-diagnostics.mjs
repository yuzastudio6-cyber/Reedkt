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
const runScriptName = 'ai-graphics:external-beta-service-role-queue-smoke-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-service-role-queue-smoke-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-readiness-diagnostics.mjs'

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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'serviceRoleQueueTransactionApprovedNow',
  'serviceRoleQueueSmokeApprovedNow',
  'liveServiceRoleQueueSmokeExecutedNow',
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
  'serviceRoleQueueSmokePerformed',
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

function buildRuntimeQueueServiceBridgePacket(profile) {
  const [toolId, productionToolId, capabilityId, workerType, runtimeTarget, gpu] = profile
  const sourceGatewayRuntimeAdmissionMode =
    toolId === 'd3' ? 'cpu_static_first_cohort' : 'all_tools_external_beta'
  const approvedSnapshotId = 'approved_snapshot_external_beta_fixture'
  const creditReservationId = 'credit_reservation_external_beta_fixture'
  const privateArtifactManifestRef = `private://ai-graphics/external-beta/${toolId}/artifact-manifest.json`
  return {
    decision: 'external_beta_runtime_queue_service_payload_ready',
    sourceDecision: 'ai_graphics_external_beta_runtime_queue_service_bridge_prepared_with_runtime_blocks',
    sourceExternalBetaLocalQueueStorageDecision:
      'ai_graphics_external_beta_local_queue_storage_mock_write_prepared_with_runtime_blocks',
    capabilityId,
    requestedToolId: toolId,
    executionRequested: true,
    sourceExternalBetaLocalQueueStorage: {
      decision: 'external_beta_local_queue_storage_mock_record_ready',
      sourceDecision: 'ai_graphics_external_beta_local_queue_storage_mock_write_prepared_with_runtime_blocks',
      sourceExternalBetaServiceRoleQueueTransactionProofBridgeAccepted: true,
      externalBetaLocalQueueStorageRecord: {
        sourceServiceRoleTransactionProofBridgeAccepted: true,
      },
      booleans: {
        sourceExternalBetaServiceRoleQueueTransactionProofBridgeAccepted: true,
      },
    },
    sourceExternalBetaLocalQueueStorageAccepted: true,
    sourceExternalBetaLocalQueueStorageProofBridgeAccepted: true,
    missingRuntimeQueueServiceControls: [],
    externalBetaRuntimeQueueServiceControlsSatisfied: true,
    runtimeQueueServicePayloadReadyWithProvidedEvidence: true,
    externalBetaRuntimeQueueServiceBridgeRecord: {
      toolId,
      productionToolId,
      workerType,
      runtimeTarget,
      sourceGatewayRuntimeAdmissionMode,
      capabilityIds: [capabilityId],
      sourceLocalQueueJobBatchId: `mock-job-batch-${toolId}`,
      sourceLocalQueueJobId: `mock-job-${toolId}`,
      sourceTransactionId: `external-beta-service-role-queue-tx-${toolId}`,
      approvedSnapshotId,
      creditReservationId,
      privateArtifactManifestRef,
      runtimeQueueJobBatchId: `mock-runtime-queue-batch-${toolId}`,
      runtimeQueueJobIds: [`mock-runtime-queue-job-${toolId}`],
      insertedJobCount: 1,
      queueServiceMockOnly: true,
      queueServiceWarningCount: 1,
      enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs',
      claimRpcName: 'claim_ai_graphics_tool_runtime_job',
      sourceLocalQueueStorageProofBridgeAccepted: true,
      runtimeQueueServicePayloadReadyWithProvidedEvidence: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
      gpuRuntimeShouldStartNow: false,
      canWriteSupabaseQueueNow: false,
      canClaimWorkerNow: false,
      canCreateWorkerLeaseNow: false,
      canDispatchWorkerNow: false,
      canExecuteToolNow: false,
    },
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    localMockRuntimeQueueServiceBatchesCreatedNow: 1,
    localMockRuntimeQueueServiceJobsCreatedNow: 1,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      runtimeQueueServicePayloadReadyWithProvidedEvidence: true,
      canonicalRuntimeQueueServiceValidationPassed: true,
      sourceExternalBetaLocalQueueStorageProofBridgeAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      usesExistingAiGraphicsRuntimeQueueService: true,
      runtimeQueueServiceMockOnly: true,
      runtimeQueueServiceUsesServiceRoleRpcNames: true,
      liveQueueWriteApprovedNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
      agentCanExecuteToolsNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts',
  'server/cli/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts',
  'server/tool-registry/ai-graphics-external-beta-runtime-queue-service-bridge.ts',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.md',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.md')
const source = read('server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts')
const cli = read('server/cli/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts')
const runtimeBridge = read('server/tool-registry/ai-graphics-external-beta-runtime-queue-service-bridge.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-service-role-queue-smoke-readiness'")) {
  fail('server_registry_index_missing_external_beta_service_role_queue_smoke_readiness_export')
}
if (docs.decision !== 'ai_graphics_external_beta_service_role_queue_smoke_readiness_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
for (const phrase of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production',
  'SUPABASE_SERVICE_ROLE_KEY',
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
  'liveServiceRoleQueueSmokeExecutedNow: false',
  'serviceRoleCredentialsServerOnly: true',
  'sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted',
  'sourceRuntimeQueueServiceProofBridgeAccepted',
]) {
  if (!source.includes(phrase) && !docsMd.includes(phrase)) fail(`missing_source_phrase:${phrase}`)
}
if (!runtimeBridge.includes('createAiGraphicsToolRuntimeQueueService')) {
  fail('source_runtime_bridge_missing_queue_service')
}
for (const flag of [
  '--external-beta-runtime-queue-service-bridge-packet',
  '--external-beta-service-role-queue-smoke-ref',
  '--external-beta-service-role-queue-smoke-environment-ref',
  '--external-beta-service-role-queue-smoke-owner-approval-ref',
  '--external-beta-service-role-queue-smoke-rollback-ref',
  '--external-beta-service-role-queue-smoke-cleanup-ref',
  '--external-beta-service-role-queue-smoke-telemetry-ref',
]) {
  if (!cli.includes(flag)) fail(`cli_missing_flag:${flag}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  serviceRoleQueueSmokeReadinessRecordsPreparedWithProvidedEvidence: 21,
  cpuStaticFirstCohortServiceRoleQueueSmokeReadinessRecordsPreparedWithProvidedEvidence: 1,
  canonicalRuntimeQueueServiceValidationAcceptedTools: 21,
  sourceRuntimeQueueServiceProofBridgeAcceptedTools: 21,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  heavyToolsIncorrectlyTargetingCpu: 0,
  liveServiceRoleQueueSmokeExecutedNow: 0,
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
for (const bucket of runtimeBuckets) {
  if (!docs.runtimeBuckets?.includes(bucket)) fail(`docs_missing_runtime_bucket:${bucket}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_gate_not_false:${key}`)
}
if (docs.booleans?.externalBetaServiceRoleQueueSmokeReadinessPrepared !== true) {
  fail('docs_missing_service_role_queue_smoke_readiness_true')
}
if (docs.booleans?.sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted !== true) {
  fail('docs_missing_source_runtime_queue_service_proof_bridge_true')
}
if (docs.booleans?.runtimeQueueServiceUsesServiceRoleRpcNames !== true) {
  fail('docs_missing_runtime_queue_service_rpc_true')
}
if (!docs.serviceRoleQueueSmoke?.requiredControls?.includes(
  'accepted external-beta runtime queue service bridge packet preserving native GPU runtime-proof bridge',
)) {
  fail('docs_missing_required_proof_bridge_control')
}
if (!docsMd.includes('non-production service-role queue/claim smoke')) {
  fail('docs_md_missing_external_beta_non_production_scope')
}
if (!docsMd.includes('native GPU runtime-proof bridge stripped')) {
  fail('docs_md_missing_stripped_runtime_proof_bridge_rejection')
}
if (!docsMd.includes('sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort')) {
  fail('docs_md_missing_cpu_static_source_mode')
}
if (!docsMd.includes('No idle GPU runtime is approved')) {
  fail('docs_md_missing_no_idle_gpu_policy')
}
if (!scorecard.includes('AI Graphics External-Beta Service-Role Queue Smoke Readiness')) {
  fail('scorecard_missing_service_role_queue_smoke_readiness_checkpoint')
}
if (!scorecard.includes('sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort')) {
  fail('scorecard_missing_cpu_static_service_role_smoke_source_mode')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-service-role-queue-smoke-'))
const results = []
for (const profile of toolProfiles) {
  const [toolId] = profile
  const packetPath = writeJson(
    path.join(tmpRoot, `${toolId}-runtime-queue-service-bridge.json`),
    buildRuntimeQueueServiceBridgePacket(profile),
  )
  const output = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-runtime-queue-service-bridge-packet',
    packetPath,
    '--execution-requested',
    '--external-beta-service-role-queue-smoke-ref',
    'external-beta-service-role://queue-smoke',
    '--external-beta-service-role-queue-smoke-environment-ref',
    'external-beta-service-role://non-production-environment',
    '--external-beta-service-role-queue-smoke-owner-approval-ref',
    'external-beta-service-role://queue-smoke-owner-approval',
    '--external-beta-service-role-queue-smoke-rollback-ref',
    'external-beta-service-role://rollback',
    '--external-beta-service-role-queue-smoke-cleanup-ref',
    'external-beta-service-role://cleanup',
    '--external-beta-service-role-queue-smoke-telemetry-ref',
    'external-beta-service-role://telemetry',
  ]), `ready_${toolId}_service_role_queue_smoke`)
  results.push([profile, output])
}

const readyResults = results.filter(([, output]) => (
  output.decision === 'external_beta_service_role_queue_smoke_prepared_not_executed' &&
  output.serviceRoleQueueSmokePreparedWithProvidedEvidence === true &&
  output.externalBetaServiceRoleQueueSmokeReadinessRecord?.serviceRoleQueueSmokeEnvironment ===
    'non_production_external_beta' &&
  output.externalBetaServiceRoleQueueSmokeReadinessRecord?.liveServiceRoleQueueSmokeExecutedNow === false
))
if (readyResults.length !== 21) fail(`all_tool_ready_count:${readyResults.length}`)

const gpuReady = results.filter(([profile, output]) => (
  profile[5] === true &&
  output.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
  output.externalBetaServiceRoleQueueSmokeReadinessRecord?.workerType === 'gpu_ai_worker'
))
if (gpuReady.length !== 8) fail(`gpu_ready_count:${gpuReady.length}`)

const heavyCpuFallbacks = results.filter(([profile, output]) => (
  profile[5] === true &&
  output.externalBetaServiceRoleQueueSmokeReadinessRecord?.workerType !== 'gpu_ai_worker'
))
if (heavyCpuFallbacks.length !== 0) fail(`heavy_cpu_fallbacks:${heavyCpuFallbacks.length}`)

const planningSmoke = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'planning_smoke')
if (planningSmoke.decision !== 'planning_metadata_selected') {
  fail(`planning_decision:${planningSmoke.decision}`)
}

const blockedMissingBridge = parseJsonOutput(runNpm(runScriptName, [
  '--execution-requested',
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'blocked_missing_bridge')
if (blockedMissingBridge.decision !== 'missing_external_beta_runtime_queue_service_bridge') {
  fail(`blocked_missing_bridge_decision:${blockedMissingBridge.decision}`)
}

const sam2PacketPath = path.join(tmpRoot, 'sam2-runtime-queue-service-bridge.json')
const blockedMissingControls = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-runtime-queue-service-bridge-packet',
  sam2PacketPath,
  '--execution-requested',
  '--external-beta-service-role-queue-smoke-ref',
  'external-beta-service-role://queue-smoke',
]), 'blocked_missing_controls')
if (blockedMissingControls.decision !== 'missing_external_beta_service_role_queue_smoke_controls') {
  fail(`blocked_missing_controls_decision:${blockedMissingControls.decision}`)
}

const forgedSam2Profile = toolProfiles.find(([toolId]) => toolId === 'sam2')
const forgedSam2Packet = buildRuntimeQueueServiceBridgePacket(forgedSam2Profile)
forgedSam2Packet.sourceExternalBetaLocalQueueStorageProofBridgeAccepted = false
forgedSam2Packet.booleans.sourceExternalBetaLocalQueueStorageProofBridgeAccepted = false
forgedSam2Packet.externalBetaRuntimeQueueServiceBridgeRecord
  .sourceLocalQueueStorageProofBridgeAccepted = false
forgedSam2Packet.sourceExternalBetaLocalQueueStorage
  .sourceExternalBetaServiceRoleQueueTransactionProofBridgeAccepted = false
forgedSam2Packet.sourceExternalBetaLocalQueueStorage.booleans
  .sourceExternalBetaServiceRoleQueueTransactionProofBridgeAccepted = false
forgedSam2Packet.sourceExternalBetaLocalQueueStorage.externalBetaLocalQueueStorageRecord
  .sourceServiceRoleTransactionProofBridgeAccepted = false
const forgedSam2PacketPath = writeJson(
  path.join(tmpRoot, 'sam2-runtime-queue-service-bridge-stripped-proof.json'),
  forgedSam2Packet,
)
const blockedStrippedProofBridge = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-runtime-queue-service-bridge-packet',
  forgedSam2PacketPath,
  '--execution-requested',
  '--external-beta-service-role-queue-smoke-ref',
  'external-beta-service-role://queue-smoke',
  '--external-beta-service-role-queue-smoke-environment-ref',
  'external-beta-service-role://non-production-environment',
  '--external-beta-service-role-queue-smoke-owner-approval-ref',
  'external-beta-service-role://queue-smoke-owner-approval',
  '--external-beta-service-role-queue-smoke-rollback-ref',
  'external-beta-service-role://rollback',
  '--external-beta-service-role-queue-smoke-cleanup-ref',
  'external-beta-service-role://cleanup',
  '--external-beta-service-role-queue-smoke-telemetry-ref',
  'external-beta-service-role://telemetry',
]), 'blocked_stripped_proof_bridge')
if (blockedStrippedProofBridge.decision !== 'missing_external_beta_runtime_queue_service_bridge') {
  fail(`blocked_stripped_proof_bridge_decision:${blockedStrippedProofBridge.decision}`)
}
if (blockedStrippedProofBridge.sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted !== false) {
  fail('blocked_stripped_proof_bridge_unexpectedly_accepted')
}
if (blockedStrippedProofBridge.externalBetaServiceRoleQueueSmokeReadinessRecord !== null) {
  fail('blocked_stripped_proof_bridge_created_readiness_record')
}

const sam2Result = results.find(([profile]) => profile[0] === 'sam2')?.[1] ?? {}
const d3Result = results.find(([profile]) => profile[0] === 'd3')?.[1] ?? {}
if (sam2Result.externalBetaServiceRoleQueueSmokeReadinessRecord?.runtimeTarget !== 'native_linux_amd64_nvidia_l4_sam2_runtime') {
  fail('sam2_runtime_target_unexpected')
}
if (d3Result.externalBetaServiceRoleQueueSmokeReadinessRecord?.runtimeTarget !== 'node_cpu_static') {
  fail('d3_runtime_target_unexpected')
}
if (
  d3Result.externalBetaServiceRoleQueueSmokeReadinessRecord
    ?.sourceGatewayRuntimeAdmissionMode !== 'cpu_static_first_cohort'
) {
  fail('d3_source_gateway_runtime_admission_mode_unexpected')
}
if (sam2Result.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
  fail('sam2_gpu_not_start_allowed_for_future_job')
}
if (d3Result.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('d3_gpu_start_allowed_unexpected')
}
if (sam2Result.externalBetaServiceRoleQueueSmokeReadinessRecord?.enqueueRpcName !== 'enqueue_ai_graphics_tool_runtime_jobs') {
  fail('sam2_enqueue_rpc_unexpected')
}
if (sam2Result.externalBetaServiceRoleQueueSmokeReadinessRecord?.claimRpcName !== 'claim_ai_graphics_tool_runtime_job') {
  fail('sam2_claim_rpc_unexpected')
}

for (const [profile, output] of results) {
  const [toolId] = profile
  if (output.liveServiceRoleQueueSmokeExecutedNow !== false) fail(`${toolId}_live_smoke_executed`)
  if (output.liveSupabaseQueueWritesNow !== 0) fail(`${toolId}_live_supabase_queue_writes`)
  if (output.liveWorkerClaimRowsNow !== 0) fail(`${toolId}_live_worker_claim_rows`)
  if (output.liveWorkerDispatchesNow !== 0) fail(`${toolId}_live_dispatches`)
  if (output.externalBetaReadyNowTools !== 0) fail(`${toolId}_external_beta_ready`)
  if (output.productionReadyNowTools !== 0) fail(`${toolId}_production_ready`)
  if (output.sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted !== true) {
    fail(`${toolId}_source_runtime_queue_service_proof_bridge_not_accepted`)
  }
  if (
    output.externalBetaServiceRoleQueueSmokeReadinessRecord
      ?.sourceRuntimeQueueServiceProofBridgeAccepted !== true
  ) {
    fail(`${toolId}_record_runtime_queue_service_proof_bridge_not_accepted`)
  }
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
  /serviceRoleQueueSmokeApprovedNow["'`\s:]*true/i,
  /serviceRoleQueueSmokePerformed["'`\s:]*true/i,
  /liveServiceRoleQueueSmokeExecutedNow["'`\s:]*true/i,
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
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-callable-scope": "tsx server/cli/ai-graphics-external-beta-callable-scope.ts",',
  '+    "ai-graphics:external-beta-callable-scope:diagnostics": "node scripts/validation/ai-graphics-external-beta-callable-scope-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly": "tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly:diagnostics": "node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-controls": "tsx server/cli/ai-graphics-external-beta-launch-controls.ts",',
  '+    "ai-graphics:external-beta-launch-controls:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-service-role-queue-smoke-preflight": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-preflight.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-preflight:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-preflight-diagnostics.mjs",',
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
  '+    "ai-graphics:model-weight-private-evidence-intake": "tsx server/cli/ai-graphics-model-weight-private-evidence-intake.ts",',
  '+    "ai-graphics:model-weight-private-evidence-intake:diagnostics": "node scripts/validation/ai-graphics-model-weight-private-evidence-intake-diagnostics.mjs",',
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
  planningSmokeDecision: planningSmoke.decision,
  blockedMissingBridgeDecision: blockedMissingBridge.decision,
  blockedMissingControlsDecision: blockedMissingControls.decision,
  blockedStrippedProofBridgeDecision: blockedStrippedProofBridge.decision,
  serviceRoleQueueSmokeReadinessRecordsPreparedWithProvidedEvidence: readyResults.length,
  canonicalRuntimeQueueServiceValidationAcceptedTools: readyResults.length,
  sourceRuntimeQueueServiceProofBridgeAcceptedTools: readyResults.length,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: gpuReady.length,
  heavyToolsIncorrectlyTargetingCpu: heavyCpuFallbacks.length,
  sam2RuntimeTarget: sam2Result.externalBetaServiceRoleQueueSmokeReadinessRecord?.runtimeTarget,
  d3RuntimeTarget: d3Result.externalBetaServiceRoleQueueSmokeReadinessRecord?.runtimeTarget,
  d3SourceGatewayRuntimeAdmissionMode:
    d3Result.externalBetaServiceRoleQueueSmokeReadinessRecord
      ?.sourceGatewayRuntimeAdmissionMode,
  sam2ServiceRoleQueueSmokeEnvironment:
    sam2Result.externalBetaServiceRoleQueueSmokeReadinessRecord?.serviceRoleQueueSmokeEnvironment,
  sam2EnqueueRpcName:
    sam2Result.externalBetaServiceRoleQueueSmokeReadinessRecord?.enqueueRpcName,
  sam2ClaimRpcName:
    sam2Result.externalBetaServiceRoleQueueSmokeReadinessRecord?.claimRpcName,
  liveServiceRoleQueueSmokeExecutedNow: sam2Result.liveServiceRoleQueueSmokeExecutedNow,
  liveSupabaseQueueWritesNow: sam2Result.liveSupabaseQueueWritesNow,
  liveWorkerClaimRowsNow: sam2Result.liveWorkerClaimRowsNow,
  liveWorkerDispatchesNow: sam2Result.liveWorkerDispatchesNow,
  gpuRuntimeShouldStartNow: sam2Result.booleans?.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: sam2Result.externalBetaReadyNowTools,
  productionReadyNowTools: sam2Result.productionReadyNowTools,
  agentCanExecuteToolsNow: sam2Result.booleans?.agentCanExecuteToolsNow,
}, null, 2))
