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
const runScriptName = 'ai-graphics:external-beta-launch-go-no-go'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-launch-go-no-go.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-launch-go-no-go:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-launch-go-no-go-diagnostics.mjs'
const packetScriptName = 'ai-graphics:external-beta-evidence-packet:validate'
const launchGapScriptName = 'ai-graphics:external-beta-launch-gap-report'
const admissionBundleScriptName = 'ai-graphics:external-beta-evidence-admission-bundle'
const workerDispatchSmokeScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke'
const workerDispatchSmokeProofScriptName =
  'ai-graphics:external-beta-worker-dispatch-smoke-proof'
const serviceRoleQueueSmokeProofScriptName =
  'ai-graphics:external-beta-service-role-queue-smoke-proof'

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

const requiredLaunchFields = [
  'externalBetaLaunchRef',
  'externalBetaRolloutCohortRef',
  'externalBetaCostConcurrencyCeilingRef',
  'externalBetaRollbackIncidentRunbookRef',
  'externalBetaPrivateArtifactRetentionSupportRef',
]

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
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
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
      sourceLiveWorkerLeasesCreatedNow: 0,
      sourceLiveWorkerDispatchesNow: 0,
      sourceLiveToolExecutionsNow: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    evidence: {
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: true,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: true,
      serviceRoleQueueSmokeAuthorizationRef:
        'private://ai-graphics/external-beta/service-role-queue-smoke/authorization.json',
    },
    booleans: {
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
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
    serviceRoleQueueSmokeAuthorizationRef:
      'private://ai-graphics/external-beta/service-role-queue-smoke/authorization.json',
    sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
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

const fullEvidenceArgs = [
  '--all-shared-gates-passed',
  '--all-external-beta-evidence-passed',
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-launch-go-no-go.ts',
  'server/cli/ai-graphics-external-beta-launch-go-no-go.ts',
  'server/tool-registry/ai-graphics-external-beta-launch-gap-report.ts',
  'server/tool-registry/ai-graphics-external-beta-readiness-gate.ts',
  'server/tool-registry/ai-graphics-external-beta-launch-controls.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-controls.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.md')
const source = read('server/tool-registry/ai-graphics-external-beta-launch-go-no-go.ts')
const cli = read('server/cli/ai-graphics-external-beta-launch-go-no-go.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-launch-go-no-go'")) {
  fail('server_registry_index_missing_external_beta_launch_go_no_go_export')
}
if (docs.decision !== 'ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  defaultExternalBetaLaunchCandidateToolsWithProvidedEvidence: 0,
  fullEvidenceExternalBetaLaunchCandidateToolsWithProvidedEvidence: 21,
  admissionBundleExternalBetaLaunchCandidateToolsWithProvidedEvidence: 21,
  serviceRoleQueueSmokePreflightAccepted: true,
  serviceRoleQueueSmokeProofAccepted: true,
  sourceLaunchGapRuntimeProofBridgeAccepted: true,
  fullLaunchApprovalExternalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence: 21,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}
for (const [key, expected] of Object.entries({
  externalBetaEvidenceAdmissionBundleMustUseSourceProofPackets: true,
  technicalEvidenceSourceModeRequired: 'source_proof_packets',
  sourceTechnicalProofPacketsRequired: true,
  sourceTechnicalProofPacketsProvided: true,
  sourceTechnicalProofPacketsAccepted: true,
  prebuiltSummaryOnlyAdmissionBundleAccepted: false,
})) {
  if (docs.sourceAdmissionRequirements?.[key] !== expected) {
    fail(`unexpected_docs_source_admission_requirement:${key}:${docs.sourceAdmissionRequirements?.[key]}`)
  }
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const field of requiredLaunchFields) {
  if (!source.includes(field)) fail(`source_missing_launch_field:${field}`)
}
for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION',
  'AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION',
  'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION',
  'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PROOF_DECISION',
  'buildAiGraphicsExternalBetaLaunchGoNoGo',
  'buildAiGraphicsExternalBetaLaunchGapReport',
  'evidenceAdmissionBundleAccepted',
  'technicalEvidenceSourceMode ===',
  'sourceTechnicalProofPacketsRequired === true',
  'sourceTechnicalProofPacketsProvided === true',
  'sourceTechnicalProofPacketsAccepted === true',
  'serviceRoleQueueSmokePreflightAccepted',
  'serviceRoleQueueSmokeProofAccepted',
  'sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted',
  'sourceExternalBetaServiceRoleQueueSmokePreflightAccepted',
  'sourceExternalBetaServiceRoleQueueSmokeProofAccepted',
  'launchGapRuntimeProofBridgeAccepted',
  'readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools === 21',
  'readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools === 0',
  'externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
  'gpuRuntimeOnDemandOnly: true',
  'agentCanExecuteToolsNow: false',
  'external beta user traffic enablement',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-launch-gap-report-packet',
  '--external-beta-evidence-admission-bundle-packet',
  '--external-beta-service-role-queue-smoke-preflight-packet',
  '--external-beta-service-role-queue-smoke-proof-packet',
  '--external-beta-evidence-admission-bundle',
  '--external-beta-worker-dispatch-smoke-proof',
  '--external-beta-worker-dispatch-smoke-proof-accepted',
  '--external-beta-evidence-packet',
  '--all-external-beta-launch-gates-approved',
  '--external-beta-launch-ref',
  '--external-beta-launch-controls-packet',
  '--external-beta-private-artifact-retention-support-ref',
  'evaluatorOnly: true',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const key of [
  'externalBetaLaunchGoNoGoContractPrepared',
  'sourceExternalBetaLaunchGapAccepted',
  'sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted',
  'sourceExternalBetaEvidenceAdmissionBundleAccepted',
  'sourceExternalBetaServiceRoleQueueSmokePreflightAccepted',
  'sourceExternalBetaServiceRoleQueueSmokeProofAccepted',
  'externalBetaLaunchCandidateWithProvidedEvidence',
  'externalBetaLaunchGoNoGoApprovalRecordAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}
if (!docsMd.includes('External-beta-ready now: `0`')) fail('markdown_missing_external_beta_ready_zero')
if (!docsMd.includes('Source launch-gap runtime proof bridge accepted: `true`')) {
  fail('markdown_missing_source_runtime_bridge_acceptance')
}
for (const needle of [
  'Admission bundle must use source proof packets: `true`',
  'Prebuilt summary-only admission bundle accepted: `false`',
  'technicalEvidenceSourceMode: source_proof_packets',
]) {
  if (!docsMd.includes(needle)) fail(`markdown_missing_source_admission_requirement:${needle}`)
}
if (!scorecard.includes('ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_external_beta_launch_go_no_go_decision')
}
if (!scorecard.includes('Source launch-gap packets must preserve the runtime-proof bridge')) {
  fail('scorecard_missing_launch_go_no_go_runtime_bridge_guard')
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-launch-go-no-go-'))
const fullRecordsPath = writeJson(path.join(tempRoot, 'full-records.json'), allTools.map(acceptedRecord))
const fullPacketPath = writeJson(
  path.join(tempRoot, 'full-packet.json'),
  parseJsonOutput(
    runNpm(packetScriptName, ['--evidence-records', fullRecordsPath]),
    'full_packet_source',
  ),
)
const betaEvidenceBundlePath = writeJson(
  path.join(tempRoot, 'accepted-beta-evidence-bundle.json'),
  acceptedBetaEvidenceBundleFixture(),
)
const modelWeightManifestReviewPacketPath = writeJson(
  path.join(tempRoot, 'model-weight-manifest-review-packet.json'),
  acceptedModelWeightManifestReviewPacket(),
)
const gpuRuntimeProofResultPacketPath = writeJson(
  path.join(tempRoot, 'gpu-runtime-proof-result-packet.json'),
  acceptedGpuRuntimeProofResultPacket(),
)
const nativeGpuProofCollectionPacketPath = writeJson(
  path.join(tempRoot, 'external-beta-native-gpu-proof-collection-packet.json'),
  acceptedNativeGpuProofCollectionPacket(),
)
const launchControlsPacketPath = writeJson(
  path.join(tempRoot, 'external-beta-launch-controls.json'),
  acceptedExternalBetaLaunchControlsPacket(),
)
const admissionBundlePath = writeJson(
  path.join(tempRoot, 'external-beta-evidence-admission-bundle.json'),
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
const prebuiltAdmissionBundlePath = writeJson(
  path.join(tempRoot, 'prebuilt-external-beta-evidence-admission-bundle.json'),
  parseJsonOutput(
    runNpm(admissionBundleScriptName, [
      '--beta-evidence-bundle-packet',
      betaEvidenceBundlePath,
      '--external-beta-evidence-packet',
      fullPacketPath,
    ]),
    'prebuilt_external_beta_evidence_admission_bundle_source',
  ),
)
const workerDispatchSmokeProofPath = writeJson(
  path.join(tempRoot, 'worker-dispatch-smoke-proof.json'),
  acceptedWorkerDispatchSmokeProofFixture(),
)
const fullLaunchGapPacket = parseJsonOutput(
  runNpm(launchGapScriptName, [
    ...fullEvidenceArgs,
    '--external-beta-evidence-packet',
    fullPacketPath,
    '--external-beta-evidence-admission-bundle',
    admissionBundlePath,
    '--external-beta-worker-dispatch-smoke-proof',
    workerDispatchSmokeProofPath,
    '--external-beta-launch-controls',
    launchControlsPacketPath,
  ]),
  'full_launch_gap_source',
)
const fullLaunchGapPath = writeJson(
  path.join(tempRoot, 'full-launch-gap-report.json'),
  fullLaunchGapPacket,
)
const readyServiceRolePreflightPath = writeJson(
  path.join(tempRoot, 'ready-service-role-queue-smoke-preflight.json'),
  readyServiceRoleQueueSmokePreflightFixture(),
)
const serviceRoleQueueSmokeReadinessPath = writeJson(
  path.join(tempRoot, 'service-role-queue-smoke-readiness.json'),
  serviceRoleQueueSmokeReadinessFixture(),
)
const serviceRoleQueueSmokeResultPath = writeJson(
  path.join(tempRoot, 'service-role-queue-smoke-result.json'),
  serviceRoleQueueSmokeResultFixture(),
)
const serviceRoleQueueSmokeProofPath = writeJson(
  path.join(tempRoot, 'service-role-queue-smoke-proof.json'),
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
const weakenedLaunchGapPath = writeJson(
  path.join(tempRoot, 'weakened-launch-gap-report.json'),
  {
    ...fullLaunchGapPacket,
    runtimeProofBridge: {
      ...fullLaunchGapPacket.runtimeProofBridge,
      readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools: 8,
    },
  },
)

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_launch_go_no_go')
const fullEvidenceWithoutPreflightOutput = parseJsonOutput(runNpm(runScriptName, [
  ...fullEvidenceArgs,
  '--external-beta-evidence-packet',
  fullPacketPath,
  '--external-beta-evidence-admission-bundle-packet',
  admissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
]), 'full_evidence_without_preflight_launch_go_no_go')
const fullEvidenceOutput = parseJsonOutput(runNpm(runScriptName, [
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
]), 'full_evidence_launch_go_no_go')
const fullEvidenceWithoutProofOutput = parseJsonOutput(runNpm(runScriptName, [
  ...fullEvidenceArgs,
  '--external-beta-evidence-packet',
  fullPacketPath,
  '--external-beta-evidence-admission-bundle-packet',
  admissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
]), 'full_evidence_without_proof_launch_go_no_go')
const approvedOutput = parseJsonOutput(runNpm(runScriptName, [
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
  launchControlsPacketPath,
  ...launchApprovalArgs,
]), 'approved_launch_go_no_go')
const admissionBundleOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-evidence-admission-bundle-packet',
  admissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
]), 'admission_bundle_launch_go_no_go')
const prebuiltAdmissionBundleOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-evidence-admission-bundle-packet',
  prebuiltAdmissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
]), 'prebuilt_admission_bundle_launch_go_no_go')
const admissionBundleWithPreflightOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-evidence-admission-bundle-packet',
  admissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
]), 'admission_bundle_with_preflight_launch_go_no_go')
const admissionBundleWithFullQueueEvidenceOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-evidence-admission-bundle-packet',
  admissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
  '--external-beta-service-role-queue-smoke-proof-packet',
  serviceRoleQueueSmokeProofPath,
]), 'admission_bundle_with_full_queue_evidence_launch_go_no_go')
const admissionBundleApprovedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-evidence-admission-bundle-packet',
  admissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
  '--external-beta-service-role-queue-smoke-proof-packet',
  serviceRoleQueueSmokeProofPath,
  '--external-beta-launch-controls-packet',
  launchControlsPacketPath,
  ...launchApprovalArgs,
]), 'admission_bundle_approved_launch_go_no_go')
const packetFedApprovedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-launch-gap-report-packet',
  fullLaunchGapPath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
  '--external-beta-service-role-queue-smoke-proof-packet',
  serviceRoleQueueSmokeProofPath,
  '--external-beta-launch-controls-packet',
  launchControlsPacketPath,
  ...launchApprovalArgs,
]), 'packet_fed_approved_launch_go_no_go')
const weakenedLaunchGapOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-launch-gap-report-packet',
  weakenedLaunchGapPath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
  '--external-beta-service-role-queue-smoke-proof-packet',
  serviceRoleQueueSmokeProofPath,
  '--external-beta-launch-controls-packet',
  launchControlsPacketPath,
  ...launchApprovalArgs,
]), 'weakened_launch_gap_launch_go_no_go')

if (defaultOutput.status !== 'missing_external_beta_candidate_evidence') {
  fail(`default_status_unexpected:${defaultOutput.status}`)
}
if (defaultOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 0) {
  fail('default_candidate_tools_not_0')
}
if (defaultOutput.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 0) {
  fail('default_approved_tools_not_0')
}

if (fullEvidenceWithoutPreflightOutput.status !== 'missing_external_beta_service_role_queue_smoke_preflight') {
  fail(`full_evidence_without_preflight_status_unexpected:${fullEvidenceWithoutPreflightOutput.status}`)
}
if (fullEvidenceWithoutPreflightOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 0) {
  fail('full_evidence_without_preflight_candidate_tools_not_0')
}
if (!fullEvidenceWithoutPreflightOutput.missingLaunchGoNoGoEvidence?.includes('external_beta_service_role_queue_smoke_preflight_ready')) {
  fail('full_evidence_without_preflight_missing_preflight_not_reported')
}

if (fullEvidenceWithoutProofOutput.status !== 'missing_external_beta_service_role_queue_smoke_proof') {
  fail(`full_evidence_without_proof_status_unexpected:${fullEvidenceWithoutProofOutput.status}`)
}
if (fullEvidenceWithoutProofOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 0) {
  fail('full_evidence_without_proof_candidate_tools_not_0')
}
if (!fullEvidenceWithoutProofOutput.missingLaunchGoNoGoEvidence?.includes('external_beta_service_role_queue_smoke_proof_accepted')) {
  fail('full_evidence_without_proof_missing_proof_not_reported')
}

if (fullEvidenceOutput.status !== 'awaiting_external_beta_launch_go_no_go_approval') {
  fail(`full_evidence_status_unexpected:${fullEvidenceOutput.status}`)
}
if (fullEvidenceOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 21) {
  fail('full_evidence_candidate_tools_not_21')
}
if (fullEvidenceOutput.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 0) {
  fail('full_evidence_approved_tools_not_0')
}
if (!fullEvidenceOutput.missingLaunchGoNoGoEvidence?.includes('external_beta_launch_ref')) {
  fail('full_evidence_missing_launch_ref_not_reported')
}
if (fullEvidenceOutput.booleans?.sourceExternalBetaServiceRoleQueueSmokePreflightAccepted !== true) {
  fail('full_evidence_service_role_preflight_boolean_not_true')
}
if (fullEvidenceOutput.booleans?.sourceExternalBetaServiceRoleQueueSmokeProofAccepted !== true) {
  fail('full_evidence_service_role_proof_boolean_not_true')
}

if (admissionBundleOutput.status !== 'missing_external_beta_service_role_queue_smoke_preflight') {
  fail(`admission_bundle_status_unexpected:${admissionBundleOutput.status}`)
}
if (admissionBundleOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 0) {
  fail('admission_bundle_candidate_tools_not_0_without_preflight')
}
if (admissionBundleOutput.booleans?.sourceExternalBetaEvidenceAdmissionBundleAccepted !== true) {
  fail('admission_bundle_source_boolean_not_true')
}
if (admissionBundleOutput.booleans?.sourceExternalBetaLaunchGapAccepted !== false) {
  fail('admission_bundle_launch_gap_source_boolean_not_false')
}
if (prebuiltAdmissionBundleOutput.status !== 'missing_external_beta_candidate_evidence') {
  fail(`prebuilt_admission_bundle_status_unexpected:${prebuiltAdmissionBundleOutput.status}`)
}
if (prebuiltAdmissionBundleOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 0) {
  fail('prebuilt_admission_bundle_candidate_tools_not_0')
}
if (prebuiltAdmissionBundleOutput.booleans?.sourceExternalBetaEvidenceAdmissionBundleAccepted !== false) {
  fail('prebuilt_admission_bundle_source_boolean_not_false')
}
if (!admissionBundleOutput.missingLaunchGoNoGoEvidence?.includes('external_beta_launch_ref')) {
  fail('admission_bundle_missing_launch_ref_not_reported')
}
if (!admissionBundleOutput.missingLaunchGoNoGoEvidence?.includes('external_beta_service_role_queue_smoke_preflight_ready')) {
  fail('admission_bundle_missing_preflight_not_reported')
}
if (admissionBundleWithPreflightOutput.status !== 'missing_external_beta_service_role_queue_smoke_proof') {
  fail(`admission_bundle_with_preflight_status_unexpected:${admissionBundleWithPreflightOutput.status}`)
}
if (admissionBundleWithPreflightOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 0) {
  fail('admission_bundle_with_preflight_candidate_tools_not_0_without_proof')
}
if (admissionBundleWithPreflightOutput.booleans?.sourceExternalBetaServiceRoleQueueSmokePreflightAccepted !== true) {
  fail('admission_bundle_with_preflight_service_role_boolean_not_true')
}
if (!admissionBundleWithPreflightOutput.missingLaunchGoNoGoEvidence?.includes('external_beta_service_role_queue_smoke_proof_accepted')) {
  fail('admission_bundle_with_preflight_missing_proof_not_reported')
}
if (admissionBundleWithFullQueueEvidenceOutput.status !== 'awaiting_external_beta_launch_go_no_go_approval') {
  fail(`admission_bundle_with_full_queue_evidence_status_unexpected:${admissionBundleWithFullQueueEvidenceOutput.status}`)
}
if (admissionBundleWithFullQueueEvidenceOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 21) {
  fail('admission_bundle_with_full_queue_evidence_candidate_tools_not_21')
}
if (admissionBundleWithFullQueueEvidenceOutput.booleans?.sourceExternalBetaServiceRoleQueueSmokeProofAccepted !== true) {
  fail('admission_bundle_with_full_queue_evidence_proof_boolean_not_true')
}
if (packetFedApprovedOutput.sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted !== true) {
  fail('packet_fed_source_runtime_bridge_not_accepted')
}
if (weakenedLaunchGapOutput.status !== 'missing_external_beta_candidate_evidence') {
  fail(`weakened_launch_gap_status_unexpected:${weakenedLaunchGapOutput.status}`)
}
if (weakenedLaunchGapOutput.sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted !== false) {
  fail('weakened_launch_gap_runtime_bridge_not_rejected')
}
if (weakenedLaunchGapOutput.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 0) {
  fail('weakened_launch_gap_approved_tools_not_0')
}

for (const [label, output] of Object.entries({
  approvedOutput,
  admissionBundleApprovedOutput,
  packetFedApprovedOutput,
})) {
  if (output.status !== 'external_beta_launch_go_no_go_approved_runtime_still_blocked') {
    fail(`${label}_status_unexpected:${output.status}`)
  }
  if (output.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 21) {
    fail(`${label}_candidate_tools_not_21`)
  }
  if (output.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
    fail(`${label}_approved_tools_not_21`)
  }
  if (output.externalBetaReadyNowTools !== 0) fail(`${label}_external_beta_ready_now_not_0`)
  if (output.productionReadyNowTools !== 0) fail(`${label}_production_ready_now_not_0`)
  if (output.booleans?.all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence !== true) {
    fail(`${label}_approved_boolean_not_true`)
  }
}

for (const output of [
  defaultOutput,
  fullEvidenceWithoutPreflightOutput,
  fullEvidenceWithoutProofOutput,
  fullEvidenceOutput,
  approvedOutput,
  admissionBundleOutput,
  admissionBundleWithPreflightOutput,
  admissionBundleWithFullQueueEvidenceOutput,
  admissionBundleApprovedOutput,
  packetFedApprovedOutput,
  weakenedLaunchGapOutput,
]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`output_required_false_not_false:${key}`)
    }
  }
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json',
  'server/tool-registry/ai-graphics-external-beta-launch-go-no-go.ts',
  'server/cli/ai-graphics-external-beta-launch-go-no-go.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')

for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
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
  '+    "ai-graphics:external-beta-callable-scope": "tsx server/cli/ai-graphics-external-beta-callable-scope.ts",',
  '+    "ai-graphics:external-beta-callable-scope:diagnostics": "node scripts/validation/ai-graphics-external-beta-callable-scope-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-callable-request-admission": "tsx server/cli/ai-graphics-external-beta-callable-request-admission.ts",',
  '+    "ai-graphics:external-beta-callable-request-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-callable-request-admission-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-runtime-admission": "tsx server/cli/ai-graphics-external-beta-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-runtime-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-tool-call-gateway": "tsx server/cli/ai-graphics-external-beta-tool-call-gateway.ts",',
  '+    "ai-graphics:external-beta-tool-call-gateway:diagnostics": "node scripts/validation/ai-graphics-external-beta-tool-call-gateway-diagnostics.mjs",',
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
  defaultStatus: defaultOutput.status,
  fullEvidenceStatus: fullEvidenceOutput.status,
  approvedStatus: approvedOutput.status,
  admissionBundleStatus: admissionBundleOutput.status,
  admissionBundleApprovedStatus: admissionBundleApprovedOutput.status,
  packetFedApprovedStatus: packetFedApprovedOutput.status,
  sourceLaunchGapRuntimeProofBridgeAccepted:
    packetFedApprovedOutput.sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted,
  weakenedLaunchGapStatus: weakenedLaunchGapOutput.status,
  externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence:
    approvedOutput.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence,
  externalBetaReadyNowTools: approvedOutput.externalBetaReadyNowTools,
  productionReadyNowTools: approvedOutput.productionReadyNowTools,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  gpuRuntimeApprovedNow: approvedOutput.booleans?.gpuRuntimeApprovedNow,
}, null, 2))
