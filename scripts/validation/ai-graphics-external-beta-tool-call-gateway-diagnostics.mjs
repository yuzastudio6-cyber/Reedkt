import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedNativeGpuProofCollectionPacket } from './ai-graphics-native-gpu-proof-collection-fixture-packet.mjs'
import { acceptedExternalBetaLaunchControlsPacket } from './ai-graphics-external-beta-launch-controls-fixture-packet.mjs'

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
const runScriptName = 'ai-graphics:external-beta-tool-call-gateway'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-tool-call-gateway.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-tool-call-gateway:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-call-gateway-diagnostics.mjs'
const packetScriptName = 'ai-graphics:external-beta-evidence-packet:validate'
const admissionBundleScriptName = 'ai-graphics:external-beta-evidence-admission-bundle'
const launchGoNoGoScriptName = 'ai-graphics:external-beta-launch-go-no-go'
const serviceRoleQueueSmokeProofScriptName =
  'ai-graphics:external-beta-service-role-queue-smoke-proof'
const runtimeAdmissionScriptName = 'ai-graphics:external-beta-runtime-admission'
const cpuStaticRuntimeAdmissionScriptName =
  'ai-graphics:external-beta-cpu-static-runtime-admission'

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

function acceptedBetaEvidenceBundleFixture() {
  const expectedGpuRuntimeTargets = {
    torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
    transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
    sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
    birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
    real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
    kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
    rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
    transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
  }

  return {
    decision: 'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults',
    totalAiGraphicsTools: 21,
    installReadyForPlannedSurfaceTools: 21,
    productionMappedTools: 21,
    planningSelectableTools: 21,
    betaTestingReadyTools: 21,
    blockedTools: 0,
    all21BetaEvidenceReady: true,
    all21TechnicalEvidenceReadyBeforeOwnerApproval: true,
    evidence: {
      approvedPlanSnapshotGatePassed: true,
      creditReservationGatePassed: true,
      artifactBoundaryGatePassed: true,
      toolRouteGatePassed: true,
      workerGatePassed: true,
      browserCanvasWebglSandboxPassed: true,
      nativeGpuRuntimeProofPassed: true,
      modelWeightManifestsApproved: true,
      modelWeightManifestReviewPacketAccepted: true,
      internalBetaOwnerApprovalGranted: true,
    },
    evidenceSources: {
      jsRuntimeProofsAccepted: true,
      nodeRuntimeProofPacketAccepted: true,
      browserRuntimeProofPacketAccepted: true,
      satoriFontRuntimeProofPacketAccepted: true,
      nodeRuntimeProofPacketProvided: true,
      browserRuntimeProofPacketProvided: true,
      satoriFontRuntimeProofPacketProvided: true,
      modelWeightManifestReviewPacketAccepted: true,
      modelWeightManifestReviewPacketProvided: true,
      nativeGpuRuntimeProofResultPacketAccepted: true,
      nativeGpuRuntimeProofResultPacketProvided: true,
      nativeGpuProofCollectionPacketAccepted: true,
      nativeGpuProofCollectionPacketProvided: true,
      nativeGpuRuntimeProofTargetsExact: true,
      privateArtifactRefNamespaceAccepted: true,
    },
    gpuRuntimeTargetedTools: gpuTools,
    expectedGpuRuntimeTargets,
    gpuRuntimePolicy: {
      onDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      proofContainerIsEphemeral: true,
      cpuFallbackAllowedForHeavyTools: false,
    },
    tools: allTools.map((toolId) => ({
      toolId,
      installReadyForPlannedSurface: true,
      productionMapped: true,
      planningSelectable: true,
      gpuRequiredForRuntime: gpuTools.includes(toolId),
      runtimeTargetForPlannedSurface: expectedGpuRuntimeTargets[toolId] ?? null,
      betaTestingReadyNow: true,
      evidenceMissing: [],
      blockers: [],
    })),
    missingEvidence: [],
    missingTechnicalEvidenceBeforeOwnerApproval: [],
    booleans: {
      betaEvidenceBundleValidatorPrepared: true,
      all21ToolsCovered: true,
      all21ToolsInstallReadyForPlannedSurface: true,
      all21ToolsMappedToProductionRegistry: true,
      all21ToolsPlanningSelectable: true,
      agentCanSelectForPlanning: true,
      gpuRuntimeTargetsExact: true,
      gpuRuntimeOnDemandOnly: true,
      privateArtifactRefNamespaceRequired: true,
      all21BetaEvidenceReady: true,
      all21TechnicalEvidenceReadyBeforeOwnerApproval: true,
      readyForInternalBetaOwnerGate: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function acceptedWorkerDispatchSmokeProofFixture() {
  return {
    sourceDecision: 'ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks',
    decision: 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks',
    proofAcceptedWithProvidedEvidence: true,
    counts: {
      workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: 21,
      sourceSmokeJobsCompletedWithProvidedEvidence: 21,
      sourceCapabilityScenariosCompletedWithProvidedEvidence: 12,
      sourceInMemoryLeaseRecordsCreated: 21,
      sourceInMemoryLeaseRecordsReleased: 21,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
      sourceLiveWorkerLeasesCreatedNow: 0,
      sourceLiveWorkerDispatchesNow: 0,
      sourceLiveToolExecutionsNow: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    evidence: {
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: true,
    },
    booleans: {
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function readyServiceRoleQueueSmokePreflightFixture() {
  return {
    decision:
      'ai_graphics_external_beta_service_role_queue_smoke_preflight_prepared_with_environment_blocks',
    status: 'ready_to_execute_non_production_service_role_queue_smoke',
    toolsCovered: 21,
    productFacingCapabilitiesCovered: 12,
    gpuRuntimeTargetedTools: 8,
    heavyToolsIncorrectlyTargetingCpu: 0,
    requiredEnvChecks: [],
    requiredFlagChecks: [],
    missingEnvironment: [],
    missingFlags: [],
    sourceRuntimeQueueServiceProofBridgeAccepted: true,
    all21PayloadsPrepared: true,
    payloadPreviews: allTools.map((toolId) => {
      const gpuRequiredForRuntime = gpuTools.includes(toolId)
      return {
        toolId,
        productionToolId: `ai_graphics.${toolId}`,
        workerType: gpuRequiredForRuntime
          ? 'ai_graphics_gpu_model_worker'
          : 'ai_graphics_cpu_static_worker',
        runtimeTarget: gpuRequiredForRuntime
          ? 'native_gpu_model_runtime'
          : 'node_cpu_static_runtime',
        capabilityIds: gpuRequiredForRuntime
          ? ['model_runtime_foundation']
          : ['planning_metadata_only'],
        gpuRequiredForRuntime,
        gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuRequiredForRuntime,
        payloadShapeValid: true,
        toolExecutionApprovedNow: false,
        workerDispatchPerformed: false,
        gpuRuntimeShouldStartNow: false,
      }
    }),
    readyToExecuteLiveNonProductionSmoke: true,
    executeCommandTemplate:
      'preflight-only fixture; live smoke remains unexecuted by this diagnostic',
    liveServiceRoleQueueSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      externalBetaServiceRoleQueueSmokePreflightPrepared: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21PayloadsPrepared: true,
      requiredEnvironmentSatisfied: true,
      requiredFlagsSatisfied: true,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      readyToExecuteLiveNonProductionSmoke: true,
      serviceRoleCredentialsServerOnly: true,
      secretsRedactedFromOutput: true,
      nonProductionEnvironmentRequired: true,
      explicitSmokeConfirmationRequired: true,
      cleanupRequired: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      liveQueueWriteApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
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
      serviceRoleQueueSmokePerformed: false,
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

function serviceRoleQueueSmokeReadinessFixture() {
  return {
    decision: 'external_beta_service_role_queue_smoke_prepared_not_executed',
    serviceRoleQueueSmokePreparedWithProvidedEvidence: true,
    sourceExternalBetaRuntimeQueueServiceBridgeAccepted: true,
    sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted: true,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      sourceExternalBetaRuntimeQueueServiceBridgeProofBridgeAccepted: true,
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
}

function serviceRoleQueueSmokeResultFixture() {
  return {
    ok: true,
    decision: 'ai_graphics_external_beta_service_role_queue_smoke_passed_with_cleanup',
    status: 'external_beta_service_role_queue_smoke_passed_with_cleanup_no_tool_execution',
    toolsSubmitted: 21,
    toolsSubmittedIds: allTools,
    jobIdsReturned: 21,
    workerClaimsReturned: 21,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    sourceRuntimeQueueServiceProofBridgeAccepted: true,
    liveServiceRoleQueueSmokeExecutedNow: true,
    liveSupabaseQueueWritesNow: 21,
    liveWorkerClaimRowsNow: 21,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    fixtureRowsPersistedAfterCleanup: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
}

function cpuStaticCohortAdmissionFixture() {
  return {
    decision: 'external_beta_cpu_static_cohort_ready_with_gpu_blocks',
    sourceDecision: 'ai_graphics_external_beta_cpu_static_cohort_admission_prepared_with_gpu_blocks',
    sourcePerToolRuntimeProofAccepted: true,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    cpuStaticCohortCandidateToolsWithProvidedEvidence: 13,
    gpuBlockedToolsPendingNativeGpuProof: 8,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    records: allTools.map((toolId) => {
      const isGpuTool = gpuTools.includes(toolId)
      return {
        toolId,
        cohortStatus: isGpuTool
          ? 'blocked_pending_native_gpu_runtime_proof'
          : 'external_beta_cpu_static_candidate_with_provided_evidence',
        cohortCandidateWithProvidedEvidence: !isGpuTool,
        gpuRuntimeTargeted: isGpuTool,
        gpuRuntimeOnDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        externalBetaCallableNow: false,
        gpuRuntimeShouldStartNow: false,
      }
    }),
    booleans: {
      all13CpuStaticCandidatesReadyWithProvidedEvidence: true,
      all8GpuToolsRemainBlockedPendingNativeGpuProof: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      agentCanExecuteToolsNow: false,
    },
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-tool-call-gateway.ts',
  'server/cli/ai-graphics-external-beta-tool-call-gateway.ts',
  'server/tool-registry/ai-graphics-external-beta-runtime-admission.ts',
  'server/tool-registry/ai-graphics-external-beta-cpu-static-runtime-admission.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.md',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-cpu-static-runtime-admission.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.md')
const source = read('server/tool-registry/ai-graphics-external-beta-tool-call-gateway.ts')
const cli = read('server/cli/ai-graphics-external-beta-tool-call-gateway.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-tool-call-gateway'")) {
  fail('server_registry_index_missing_external_beta_tool_call_gateway_export')
}
if (docs.decision !== 'ai_graphics_external_beta_tool_call_gateway_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.sourceAllToolsRuntimeAdmissionProofBridgeAccepted !== true) {
  fail('docs_source_all_tools_runtime_admission_proof_bridge_not_true')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  defaultGatewayReadyExamples: 0,
  fullGatewayWorkerEnqueueCandidateReadyExamples: 2,
  cpuStaticGatewayWorkerEnqueueCandidateReadyExamples: 1,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobExamples: 1,
  gpuRuntimeShouldStartNow: 0,
  workerEnqueuePerformedNow: 0,
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
  'external beta user id',
  'external beta workspace id',
  'external beta request id',
  'external beta tool-call gateway reference',
  'external beta feature flag evaluation reference',
  'external beta rollout assignment reference',
  'external beta rate-limit decision reference',
  'external beta cost-ceiling decision reference',
  'external beta audit event reference',
  'external beta trace id',
  'external beta idempotency key',
  'external beta worker enqueue candidate reference',
  'accepted external-beta runtime admission packet',
  'accepted external-beta runtime admission packet preserving the native GPU runtime-proof bridge',
  'accepted external-beta CPU/static runtime admission packet for the first cohort',
]) {
  if (!docs.requiredGatewayControls?.includes(gate)) fail(`docs_missing_gateway_control:${gate}`)
}
for (const key of [
  'externalBetaToolCallGatewayPrepared',
  'sourceExternalBetaRuntimeAdmissionAccepted',
  'sourceExternalBetaRuntimeAdmissionProofBridgeAccepted',
  'sourceExternalBetaCpuStaticRuntimeAdmissionAccepted',
  'externalBetaGatewayControlsSatisfied',
  'externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'externalBetaFeatureFlagEvaluated',
  'externalBetaRolloutAssignmentAccepted',
  'externalBetaRateLimitAccepted',
  'externalBetaCostCeilingAccepted',
  'externalBetaAuditTracePrepared',
  'externalBetaIdempotencyKeyAccepted',
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
  planning_sam2_gateway: 'planning_metadata_selected',
  blocked_sam2_gateway_missing_runtime_admission: 'missing_external_beta_runtime_admission',
  blocked_sam2_gateway_missing_rate_limit: 'missing_external_beta_gateway_controls',
  accepted_future_sam2_gateway_worker_enqueue_candidate:
    'external_beta_worker_enqueue_candidate_ready',
  accepted_future_d3_gateway_worker_enqueue_candidate:
    'external_beta_worker_enqueue_candidate_ready',
  accepted_future_d3_cpu_static_gateway_worker_enqueue_candidate:
    'external_beta_worker_enqueue_candidate_ready',
})) {
  const entry = docs.exampleEvaluations?.find((example) => example.id === id)
  if (!entry) fail(`docs_missing_example:${id}`)
  if (entry?.decision !== expected) fail(`docs_example_decision_unexpected:${id}:${entry?.decision}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION',
  'evaluateAiGraphicsExternalBetaToolCallGateway',
  'sourceExternalBetaRuntimeAdmissionPacket',
  'sourceExternalBetaCpuStaticRuntimeAdmissionPacket',
  'sourceRuntimeAdmissionMode',
  'allToolsRuntimeAdmissionProofBridgeAccepted',
  'sourceExternalBetaRuntimeAdmissionProofBridgeAccepted',
  'sourceExternalBetaLaunchGoNoGoRuntimeProofBridgeAccepted',
  'externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence',
  'externalBetaWorkerEnqueueCandidate',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob',
  'gpuRuntimeShouldStartNow: false',
  'workerEnqueuePerformed: false',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
  'noIdleGpuRuntimeApproved: true',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-runtime-admission-packet',
  '--external-beta-cpu-static-runtime-admission-packet',
  '--external-beta-user-id',
  '--external-beta-workspace-id',
  '--external-beta-rate-limit-decision-ref',
  '--external-beta-worker-enqueue-candidate-ref',
  'evaluatorOnly: true',
  'workerEnqueuePerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'External-Beta Tool-Call Gateway',
  'Source all-tools runtime admission proof bridge accepted: `true`',
  'Worker enqueue performed now: `0`',
  'GPU remains on-demand only',
  'If no one is using the tool, no GPU runtime should be running',
]) {
  if (!docsMd.includes(needle)) fail(`markdown_missing:${needle}`)
}
for (const needle of [
  'AI graphics external beta tool-call gateway decision',
  'rejects source all-tools runtime-admission packets that strip',
  'worker enqueue candidate',
  '`workerEnqueuePerformed=false`',
]) {
  if (!scorecard.includes(needle)) fail(`scorecard_missing:${needle}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-tool-call-gateway-'))
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
const betaEvidenceBundlePath = writeJson(
  path.join(tmpRoot, 'accepted-beta-evidence-bundle.json'),
  acceptedBetaEvidenceBundleFixture(),
)
const modelWeightManifestReviewPacketPath = writeJson(
  path.join(tmpRoot, 'model-weight-manifest-review-packet.json'),
  acceptedModelWeightManifestReviewPacket(),
)
const gpuRuntimeProofResultPacketPath = writeJson(
  path.join(tmpRoot, 'gpu-runtime-proof-result-packet.json'),
  acceptedGpuRuntimeProofResultPacket(),
)
const nativeGpuProofCollectionPacketPath = writeJson(
  path.join(tmpRoot, 'external-beta-native-gpu-proof-collection-packet.json'),
  acceptedNativeGpuProofCollectionPacket(),
)
const admissionBundlePath = writeJson(
  path.join(tmpRoot, 'external-beta-evidence-admission-bundle.json'),
  parseJsonOutput(
    runNpm(admissionBundleScriptName, [
      '--require-source-proof-packets',
      '--all-shared-gates-passed',
      '--browser-canvas-webgl-sandbox-passed',
      '--use-committed-js-runtime-proofs',
      '--model-weight-manifest-review-packet',
      modelWeightManifestReviewPacketPath,
      '--gpu-runtime-proof-result-packet',
      gpuRuntimeProofResultPacketPath,
      '--external-beta-native-gpu-proof-collection-packet',
      nativeGpuProofCollectionPacketPath,
      '--external-beta-evidence-packet',
      fullPacketPath,
    ]),
    'external_beta_evidence_admission_bundle_source',
  ),
)
const workerDispatchSmokeProofPath = writeJson(
  path.join(tmpRoot, 'worker-dispatch-smoke-proof.json'),
  acceptedWorkerDispatchSmokeProofFixture(),
)
const launchControlsPath = writeJson(
  path.join(tmpRoot, 'external-beta-launch-controls.json'),
  acceptedExternalBetaLaunchControlsPacket(),
)

const fullEvidenceArgs = [
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
]
const launchApprovalArgs = [
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
]
const readyServiceRolePreflightPath = writeJson(
  path.join(tmpRoot, 'ready-service-role-queue-smoke-preflight.json'),
  readyServiceRoleQueueSmokePreflightFixture(),
)
const serviceRoleQueueSmokeReadinessPath = writeJson(
  path.join(tmpRoot, 'service-role-queue-smoke-readiness.json'),
  serviceRoleQueueSmokeReadinessFixture(),
)
const serviceRoleQueueSmokeResultPath = writeJson(
  path.join(tmpRoot, 'service-role-queue-smoke-result.json'),
  serviceRoleQueueSmokeResultFixture(),
)
const serviceRoleQueueSmokeProofPath = writeJson(
  path.join(tmpRoot, 'service-role-queue-smoke-proof.json'),
  parseJsonOutput(runNpm(serviceRoleQueueSmokeProofScriptName, [
    '--external-beta-service-role-queue-smoke-readiness-packet',
    serviceRoleQueueSmokeReadinessPath,
    '--external-beta-service-role-queue-smoke-result',
    serviceRoleQueueSmokeResultPath,
    '--external-beta-service-role-queue-smoke-evidence-ref',
    'private://ai-graphics/external-beta/service-role-queue-smoke-proof/evidence.json',
    '--external-beta-service-role-queue-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/service-role-queue-smoke-proof/telemetry.json',
    '--external-beta-service-role-queue-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/service-role-queue-smoke-proof/cleanup.json',
  ]), 'service_role_queue_smoke_proof_source'),
)
const launchGoNoGo = parseJsonOutput(runNpm(launchGoNoGoScriptName, [
  ...fullEvidenceArgs,
  '--external-beta-evidence-packet',
  fullPacketPath,
  '--external-beta-evidence-admission-bundle-packet',
  admissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
  '--external-beta-service-role-queue-smoke-proof-packet',
  serviceRoleQueueSmokeProofPath,
  '--external-beta-launch-controls-packet',
  launchControlsPath,
  ...launchApprovalArgs,
]), 'external_beta_launch_go_no_go')
if (launchGoNoGo.status !== 'external_beta_launch_go_no_go_approved_runtime_still_blocked') {
  fail(`launch_go_no_go_status_unexpected:${launchGoNoGo.status}`)
}
if (launchGoNoGo.booleans?.sourceExternalBetaServiceRoleQueueSmokePreflightAccepted !== true) {
  fail('launch_go_no_go_service_role_preflight_not_accepted')
}
if (launchGoNoGo.booleans?.sourceExternalBetaServiceRoleQueueSmokeProofAccepted !== true) {
  fail('launch_go_no_go_service_role_proof_not_accepted')
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
const cpuStaticCohortPath = writeJson(
  path.join(tmpRoot, 'cpu-static-cohort-admission.json'),
  cpuStaticCohortAdmissionFixture(),
)
const d3CpuStaticRuntimeAdmission = parseJsonOutput(runNpm(cpuStaticRuntimeAdmissionScriptName, [
  '--external-beta-cpu-static-cohort-admission-packet',
  cpuStaticCohortPath,
  '--execution-requested',
  '--approved-plan-snapshot-id',
  'approved_snapshot_external_beta_cpu_static_fixture',
  '--credit-reservation-id',
  'credit_reservation_external_beta_cpu_static_fixture',
  '--artifact-boundary-approval-ref',
  'artifact_boundary_approval_external_beta_cpu_static_fixture',
  '--tool-route-approval-ref',
  'tool_route_approval_external_beta_cpu_static_fixture',
  '--worker-approval-ref',
  'worker_approval_external_beta_cpu_static_fixture',
  '--runtime-enqueue-approval-ref',
  'runtime_enqueue_approval_external_beta_cpu_static_fixture',
  '--owner-runtime-approval-ref',
  'owner_runtime_approval_external_beta_cpu_static_fixture',
  '--private-artifact-manifest-ref',
  'private://ai-graphics/external-beta/cpu-static/artifact-manifest.json',
  '--external-beta-cpu-static-feature-flag-enabled',
  '--external-beta-cpu-static-feature-flag-ref',
  'external-beta-runtime://cpu-static/feature-flag',
  '--external-beta-cpu-static-runtime-admission-ref',
  'external-beta-runtime://cpu-static/runtime-admission',
  '--external-beta-cpu-static-tool-allowlist-ref',
  'external-beta-runtime://cpu-static/tool-allowlist',
  '--external-beta-cpu-static-traffic-scope-ref',
  'external-beta-runtime://cpu-static/traffic-scope',
  '--external-beta-cpu-static-telemetry-ref',
  'external-beta-runtime://cpu-static/telemetry',
  '--external-beta-cpu-static-support-ref',
  'external-beta-runtime://cpu-static/support',
  '--external-beta-cpu-static-cost-guardrail-ref',
  'external-beta-runtime://cpu-static/cost-guardrail',
  '--external-beta-cpu-static-worker-pool-ref',
  'external-beta-runtime://cpu-static/worker-pool',
  '--capability-id',
  'chart_overlay',
  '--requested-tool-id',
  'd3',
  '--node-runtime-proof-ref',
  'private://ai-graphics/node-static-proof/d3.json',
]), 'd3_cpu_static_runtime_admission')
const sam2RuntimeAdmissionPath = writeJson(path.join(tmpRoot, 'sam2-runtime-admission.json'), sam2RuntimeAdmission)
const weakenedSam2RuntimeAdmissionPath = writeJson(
  path.join(tmpRoot, 'weakened-sam2-runtime-admission.json'),
  {
    ...sam2RuntimeAdmission,
    sourceLaunchGoNoGoRuntimeProofBridgeAccepted: false,
    booleans: {
      ...sam2RuntimeAdmission.booleans,
      sourceExternalBetaLaunchGoNoGoRuntimeProofBridgeAccepted: false,
    },
  },
)
const d3RuntimeAdmissionPath = writeJson(path.join(tmpRoot, 'd3-runtime-admission.json'), d3RuntimeAdmission)
const d3CpuStaticRuntimeAdmissionPath = writeJson(
  path.join(tmpRoot, 'd3-cpu-static-runtime-admission.json'),
  d3CpuStaticRuntimeAdmission,
)

const gatewayControls = [
  '--external-beta-user-id',
  'external-beta-user-fixture',
  '--external-beta-workspace-id',
  'workspace-fixture',
  '--external-beta-request-id',
  'request-fixture',
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
  'trace-fixture',
  '--external-beta-idempotency-key',
  'ai-graphics:external-beta:workspace-fixture:request-fixture:sam2',
  '--external-beta-worker-enqueue-candidate-ref',
  'external-beta-gateway://worker-enqueue-candidate',
]
const gatewayControlsWithoutRateLimit = gatewayControls.filter((value, index, list) => (
  value !== '--external-beta-rate-limit-decision-ref' &&
  list[index - 1] !== '--external-beta-rate-limit-decision-ref'
))

const planningGateway = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'planning_gateway')
const blockedMissingRuntime = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
  '--execution-requested',
]), 'blocked_missing_runtime_gateway')
const blockedMissingRateLimit = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-runtime-admission-packet',
  sam2RuntimeAdmissionPath,
  ...gatewayControlsWithoutRateLimit,
]), 'blocked_missing_rate_limit_gateway')
const readySam2Gateway = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-runtime-admission-packet',
  sam2RuntimeAdmissionPath,
  ...gatewayControls,
]), 'ready_sam2_gateway')
const weakenedRuntimeAdmissionGateway = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-runtime-admission-packet',
  weakenedSam2RuntimeAdmissionPath,
  ...gatewayControls,
]), 'weakened_runtime_admission_gateway')
const readyD3Gateway = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-runtime-admission-packet',
  d3RuntimeAdmissionPath,
  ...gatewayControls,
  '--external-beta-idempotency-key',
  'ai-graphics:external-beta:workspace-fixture:request-fixture:d3',
]), 'ready_d3_gateway')
const readyD3CpuStaticGateway = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-cpu-static-runtime-admission-packet',
  d3CpuStaticRuntimeAdmissionPath,
  ...gatewayControls,
  '--external-beta-idempotency-key',
  'ai-graphics:external-beta:workspace-fixture:request-fixture:d3-cpu-static',
]), 'ready_d3_cpu_static_gateway')

if (planningGateway.decision !== 'planning_metadata_selected') {
  fail(`planning_gateway_decision_unexpected:${planningGateway.decision}`)
}
if (blockedMissingRuntime.decision !== 'missing_external_beta_runtime_admission') {
  fail(`blocked_missing_runtime_decision_unexpected:${blockedMissingRuntime.decision}`)
}
if (blockedMissingRateLimit.decision !== 'missing_external_beta_gateway_controls') {
  fail(`blocked_missing_rate_limit_decision_unexpected:${blockedMissingRateLimit.decision}`)
}
if (!blockedMissingRateLimit.missingGatewayControls?.includes('external beta rate-limit decision reference is missing')) {
  fail('blocked_missing_rate_limit_not_reported')
}
if (weakenedRuntimeAdmissionGateway.decision !== 'missing_external_beta_runtime_admission') {
  fail(`weakened_runtime_admission_gateway_decision_unexpected:${weakenedRuntimeAdmissionGateway.decision}`)
}
if (weakenedRuntimeAdmissionGateway.sourceExternalBetaRuntimeAdmissionAccepted !== false) {
  fail('weakened_runtime_admission_gateway_source_runtime_accepted_not_false')
}
if (weakenedRuntimeAdmissionGateway.sourceExternalBetaRuntimeAdmissionProofBridgeAccepted !== false) {
  fail('weakened_runtime_admission_gateway_proof_bridge_not_false')
}
if (weakenedRuntimeAdmissionGateway.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence !== false) {
  fail('weakened_runtime_admission_gateway_candidate_ready_not_false')
}
for (const [label, output] of Object.entries({
  readySam2Gateway,
  readyD3Gateway,
  readyD3CpuStaticGateway,
})) {
  if (output.decision !== 'external_beta_worker_enqueue_candidate_ready') {
    fail(`${label}_decision_unexpected:${output.decision}`)
  }
  if (output.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence !== true) {
    fail(`${label}_candidate_ready_not_true`)
  }
  if (!output.externalBetaWorkerEnqueueCandidate) fail(`${label}_missing_worker_candidate`)
  if (output.externalBetaWorkerEnqueueCandidate?.workerEnqueuePerformed !== false) {
    fail(`${label}_worker_enqueue_performed_not_false`)
  }
  if (output.gpuRuntimeShouldStartNow !== false) fail(`${label}_gpu_runtime_should_start_now_not_false`)
  if (output.externalBetaReadyNowTools !== 0) fail(`${label}_external_beta_ready_now_not_0`)
  if (output.productionReadyNowTools !== 0) fail(`${label}_production_ready_now_not_0`)
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`${label}_required_false_not_false:${key}`)
    }
  }
}
if (readySam2Gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
  fail('ready_sam2_gateway_gpu_start_allowed_not_true')
}
if (readyD3Gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('ready_d3_gateway_gpu_start_allowed_not_false')
}
if (readyD3CpuStaticGateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('ready_d3_cpu_static_gateway_gpu_start_allowed_not_false')
}
if (readyD3CpuStaticGateway.sourceRuntimeAdmissionMode !== 'cpu_static_first_cohort') {
  fail(`ready_d3_cpu_static_gateway_source_mode:${readyD3CpuStaticGateway.sourceRuntimeAdmissionMode}`)
}
if (readyD3CpuStaticGateway.sourceExternalBetaCpuStaticRuntimeAdmissionAccepted !== true) {
  fail('ready_d3_cpu_static_gateway_source_not_accepted')
}
if (readySam2Gateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget !== 'native_linux_amd64_nvidia_l4_sam2_runtime') {
  fail('ready_sam2_gateway_runtime_target_unexpected')
}
if (readyD3Gateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget !== 'node_cpu_static') {
  fail('ready_d3_gateway_runtime_target_unexpected')
}
if (readyD3CpuStaticGateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget !== 'node_cpu_static') {
  fail('ready_d3_cpu_static_gateway_runtime_target_unexpected')
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.md',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json',
  'server/tool-registry/ai-graphics-external-beta-tool-call-gateway.ts',
  'server/cli/ai-graphics-external-beta-tool-call-gateway.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')

for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
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
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly": "tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly:diagnostics": "node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-launch-controls": "tsx server/cli/ai-graphics-external-beta-launch-controls.ts",',
  '+    "ai-graphics:external-beta-launch-controls:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-runtime-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-enqueue-adapter": "tsx server/cli/ai-graphics-external-beta-worker-enqueue-adapter.ts",',
  '+    "ai-graphics:external-beta-worker-enqueue-adapter:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-enqueue-adapter-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-backend-queue-submission": "tsx server/cli/ai-graphics-external-beta-backend-queue-submission.ts",',
  '+    "ai-graphics:external-beta-backend-queue-submission:diagnostics": "node scripts/validation/ai-graphics-external-beta-backend-queue-submission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-transaction": "tsx server/cli/ai-graphics-external-beta-service-role-queue-transaction.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-transaction:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-transaction-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-local-queue-storage": "tsx server/cli/ai-graphics-external-beta-local-queue-storage.ts",',
  '+    "ai-graphics:external-beta-local-queue-storage:diagnostics": "node scripts/validation/ai-graphics-external-beta-local-queue-storage-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge": "tsx server/cli/ai-graphics-external-beta-runtime-queue-service-bridge.ts",',
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-runtime-queue-service-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-readiness-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-cohort-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-cohort-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-end-to-end-readiness": "tsx server/cli/ai-graphics-external-beta-end-to-end-readiness.ts",',
  '+    "ai-graphics:external-beta-end-to-end-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-end-to-end-readiness-diagnostics.mjs",',
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
  planningGatewayDecision: planningGateway.decision,
  blockedMissingRuntimeDecision: blockedMissingRuntime.decision,
  blockedMissingRateLimitDecision: blockedMissingRateLimit.decision,
  weakenedRuntimeAdmissionGatewayDecision: weakenedRuntimeAdmissionGateway.decision,
  readySam2GatewayDecision: readySam2Gateway.decision,
  readyD3GatewayDecision: readyD3Gateway.decision,
  readyD3CpuStaticGatewayDecision: readyD3CpuStaticGateway.decision,
  readyD3CpuStaticGatewaySourceMode: readyD3CpuStaticGateway.sourceRuntimeAdmissionMode,
  readySam2GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readySam2Gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  readyD3GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readyD3Gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  readyD3CpuStaticGpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readyD3CpuStaticGateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  sam2RuntimeTarget: readySam2Gateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget,
  d3RuntimeTarget: readyD3Gateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget,
  d3CpuStaticRuntimeTarget:
    readyD3CpuStaticGateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget,
  workerEnqueuePerformed: readySam2Gateway.booleans?.workerEnqueuePerformed,
  gpuRuntimeShouldStartNow: readySam2Gateway.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: readySam2Gateway.externalBetaReadyNowTools,
  productionReadyNowTools: readySam2Gateway.productionReadyNowTools,
  agentCanExecuteToolsNow: readySam2Gateway.booleans?.agentCanExecuteToolsNow,
}, null, 2))
