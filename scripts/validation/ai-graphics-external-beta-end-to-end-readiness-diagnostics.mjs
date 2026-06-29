import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedNativeGpuProofCollectionPacket } from './ai-graphics-native-gpu-proof-collection-fixture-packet.mjs'

const runScriptName = 'ai-graphics:external-beta-end-to-end-readiness'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-end-to-end-readiness.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-end-to-end-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-end-to-end-readiness-diagnostics.mjs'

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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-end-to-end-readiness.ts',
  'server/cli/ai-graphics-external-beta-end-to-end-readiness.ts',
  'scripts/validation/ai-graphics-external-beta-end-to-end-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.md',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json',
]

const falseBooleanKeys = [
  'externalBetaReadyNow',
  'productionReadyNow',
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

function readJson(filePath) {
  const content = read(filePath)
  if (!content) return {}
  try {
    return JSON.parse(content)
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function runCli(args = []) {
  const output = execFileSync(
    'npm',
    ['run', '--silent', runScriptName, '--', ...args],
    { encoding: 'utf8' },
  )
  return JSON.parse(output)
}

function runPreflight(args = [], env = {}) {
  const output = execFileSync(
    'npm',
    ['run', '--silent', 'ai-graphics:external-beta-service-role-queue-smoke-preflight', '--', ...args],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
        ...env,
      },
    },
  )
  return JSON.parse(output)
}

function runProof(args = []) {
  const output = execFileSync(
    'npm',
    ['run', '--silent', 'ai-graphics:external-beta-service-role-queue-smoke-proof', '--', ...args],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      },
    },
  )
  return JSON.parse(output)
}

function runWorkerDispatchSmoke(args = []) {
  const output = execFileSync(
    'npm',
    ['run', '--silent', 'ai-graphics:external-beta-worker-dispatch-smoke', '--', ...args],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      },
    },
  )
  return JSON.parse(output)
}

function runWorkerDispatchProof(args = []) {
  const output = execFileSync(
    'npm',
    ['run', '--silent', 'ai-graphics:external-beta-worker-dispatch-smoke-proof', '--', ...args],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      },
    },
  )
  return JSON.parse(output)
}

function runNpm(scriptName, args = []) {
  const output = execFileSync(
    'npm',
    ['run', '--silent', scriptName, '--', ...args],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      },
    },
  )
  return JSON.parse(output)
}

function acceptedExternalBetaEvidenceRecord(toolId) {
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

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
}

function assertCount(record, key, expected, label) {
  if (record?.counts?.[key] !== expected) {
    fail(`${label}_${key}_expected_${expected}_got_${record?.counts?.[key]}`)
  }
}

function assertBooleanMap(
  record,
  label,
  expectedPreflightReady,
  expectedProofAccepted,
  expectedWorkerDispatchProofAccepted,
) {
  const booleans = record?.booleans ?? {}
  for (const key of falseBooleanKeys) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }
  if (booleans.agentCanSelectForPlanning !== true) {
    fail(`${label}_agentCanSelectForPlanning_not_true`)
  }
  if (booleans.all21ToolsCovered !== true) fail(`${label}_all21ToolsCovered_not_true`)
  if (booleans.all12CapabilitiesCovered !== true) fail(`${label}_all12CapabilitiesCovered_not_true`)
  if (booleans.all8GpuToolsTargetGpuRuntime !== true) {
    fail(`${label}_all8GpuToolsTargetGpuRuntime_not_true`)
  }
  if (booleans.noDuplicateAiGraphicsProductionMappings !== true) {
    fail(`${label}_duplicate_mapping_guard_not_true`)
  }
  if (booleans.serviceRoleQueueSmokePreflightPrepared !== true) {
    fail(`${label}_service_role_preflight_prepared_not_true`)
  }
  if (booleans.serviceRoleQueueSmokePayloadsPreparedForAll21Tools !== true) {
    fail(`${label}_service_role_payloads_not_prepared`)
  }
  if (
    typeof expectedPreflightReady === 'boolean' &&
    booleans.serviceRoleQueueSmokeReadyToExecute !== expectedPreflightReady
  ) {
    fail(`${label}_service_role_ready_unexpected:${booleans.serviceRoleQueueSmokeReadyToExecute}`)
  }
  if (
    typeof expectedProofAccepted === 'boolean' &&
    booleans.serviceRoleQueueSmokeProofAcceptedWithProvidedEvidence !== expectedProofAccepted
  ) {
    fail(`${label}_service_role_proof_unexpected:${booleans.serviceRoleQueueSmokeProofAcceptedWithProvidedEvidence}`)
  }
  if (
    typeof expectedWorkerDispatchProofAccepted === 'boolean' &&
    booleans.workerDispatchSmokeProofAcceptedWithProvidedEvidence !== expectedWorkerDispatchProofAccepted
  ) {
    fail(`${label}_worker_dispatch_proof_unexpected:${booleans.workerDispatchSmokeProofAcceptedWithProvidedEvidence}`)
  }
}

function assertTools(record, label) {
  const toolIds = (record?.tools ?? []).map((tool) => tool.toolId)
  for (const toolId of allTools) {
    if (!toolIds.includes(toolId)) fail(`${label}_missing_tool:${toolId}`)
  }
  if (toolIds.length !== 21) fail(`${label}_tool_count_${toolIds.length}`)

  for (const tool of record?.tools ?? []) {
    if (tool.installReadyForPlannedSurface !== true) fail(`${label}_install_not_true:${tool.toolId}`)
    if (tool.productionMapped !== true) fail(`${label}_production_mapping_not_true:${tool.toolId}`)
    if (tool.rankingSelectionReadyForPlanning !== true) {
      fail(`${label}_ranking_not_true:${tool.toolId}`)
    }
    if (tool.externalBetaReadyNow !== false) fail(`${label}_external_beta_ready_now:${tool.toolId}`)
    if (tool.productionReadyNow !== false) fail(`${label}_production_ready_now:${tool.toolId}`)
    if (tool.cpuFallbackAllowedForHeavyTool !== false) {
      fail(`${label}_cpu_fallback_not_false:${tool.toolId}`)
    }
    if (gpuTools.includes(tool.toolId)) {
      if (tool.gpuRequiredForRuntime !== true) fail(`${label}_gpu_required_not_true:${tool.toolId}`)
      if (!String(tool.runtimeTarget).includes('nvidia_l4')) {
        fail(`${label}_gpu_runtime_target_not_nvidia_l4:${tool.toolId}`)
      }
    }
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

function workerDispatchReadinessFixture() {
  return {
    decision: 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks',
    sourceServiceRoleQueueSmokeProofBridgeAccepted: true,
    workerDispatchReadinessPreparedWithProvidedEvidence: true,
    workerDispatchReadinessRecordsPreparedWithProvidedEvidence: 21,
    workerDispatchCapabilityScenariosPreparedWithProvidedEvidence: 12,
    gpuRuntimeTargetedTools: 8,
    acceptedSourceEvidence: {
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
    },
    records: allTools.map((toolId) => ({
      toolId,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
    })),
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    booleans: {
      sourceServiceRoleQueueSmokeProofBridgeAccepted: true,
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
}

for (const filePath of requiredFiles) read(filePath)

const packageJson = readJson('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

const indexTs = read('server/tool-registry/index.ts')
if (!indexTs.includes("export * from './ai-graphics-external-beta-end-to-end-readiness'")) {
  fail('missing_registry_export')
}
const moduleSource = read('server/tool-registry/ai-graphics-external-beta-end-to-end-readiness.ts')
if (!moduleSource.includes('sourceServiceRoleQueueSmokeProofAccepted &&\n      sourceWorkerDispatchSmokeProofAccepted')) {
  fail('tool_candidate_missing_worker_dispatch_proof_requirement')
}

const docsJson = readJson('docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json')
if (docsJson.decision !== 'ai_graphics_external_beta_end_to_end_readiness_prepared_with_remaining_blocks') {
  fail('docs_decision_mismatch')
}
assertCount(docsJson, 'totalAiGraphicsTools', 21, 'docs')
assertCount(docsJson, 'totalProductFacingCapabilities', 12, 'docs')
assertCount(docsJson, 'installReadyTools', 21, 'docs')
assertCount(docsJson, 'productionMappedTools', 21, 'docs')
assertCount(docsJson, 'gpuRuntimeTargetedTools', 8, 'docs')
assertCount(docsJson, 'heavyToolsIncorrectlyTargetingCpu', 0, 'docs')
assertCount(docsJson, 'duplicateAiGraphicsProductionToolIds', 0, 'docs')
assertCount(docsJson, 'externalBetaReadyNowTools', 0, 'docs')
assertCount(docsJson, 'productionReadyNowTools', 0, 'docs')
if (docsJson.counts?.defaultServiceRoleQueueSmokePreflightPayloadsPrepared !== 21) {
  fail('docs_default_service_role_payloads_not_21')
}
if (docsJson.counts?.defaultServiceRoleQueueSmokePreflightReadyToExecute !== 0) {
  fail('docs_default_service_role_ready_not_0')
}
if (docsJson.counts?.defaultServiceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence !== 0) {
  fail('docs_default_service_role_proof_tools_not_0')
}
if (docsJson.counts?.defaultWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence !== 0) {
  fail('docs_default_worker_dispatch_proof_tools_not_0')
}
if (
  docsJson.counts
    ?.overrideFlagWithQueueAndWorkerProofExternalBetaCandidateReadyWithProvidedEvidenceTools !== 0
) {
  fail('docs_override_flag_queue_worker_candidate_count_not_0')
}
if (docsJson.counts?.fullEvidenceServiceRoleQueueSmokePreflightReadyToExecute !== 1) {
  fail('docs_full_service_role_ready_not_1')
}
if (docsJson.counts?.fullEvidenceServiceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence !== 21) {
  fail('docs_full_service_role_proof_tools_not_21')
}
if (docsJson.counts?.fullEvidenceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence !== 21) {
  fail('docs_full_worker_dispatch_proof_tools_not_21')
}
if (docsJson.counts?.fullEvidenceWorkerDispatchSmokeProofSmokeJobsAcceptedWithProvidedEvidence !== 21) {
  fail('docs_full_worker_dispatch_smoke_jobs_not_21')
}
if (docsJson.counts?.fullEvidenceWorkerDispatchSmokeProofInMemoryLeasesAcceptedWithProvidedEvidence !== 21) {
  fail('docs_full_worker_dispatch_leases_not_21')
}
if (docsJson.counts?.fullEvidenceExternalBetaCandidateReadyWithProvidedEvidenceTools !== 21) {
  fail('docs_full_evidence_candidate_count_not_21')
}
if (docsJson.sourceEvidence?.externalBetaWorkerDispatchSmokeProof !==
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json') {
  fail('docs_missing_worker_dispatch_proof_source_evidence')
}
if (docsJson.sourceEvidence?.externalBetaEvidenceAdmissionBundle !==
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json') {
  fail('docs_missing_external_beta_admission_bundle_source_evidence')
}
if (docsJson.sourceEvidence?.externalBetaServiceRoleQueueSmokePreflight !==
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json') {
  fail('docs_missing_service_role_preflight_source_evidence')
}
if (docsJson.sourceEvidence?.externalBetaServiceRoleQueueSmokeProof !==
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.json') {
  fail('docs_missing_service_role_proof_source_evidence')
}
if (docsJson.booleans?.defaultServiceRoleQueueSmokePayloadsPreparedForAll21Tools !== true) {
  fail('docs_default_service_role_payloads_not_true')
}
if (docsJson.booleans?.defaultServiceRoleQueueSmokeReadyToExecute !== false) {
  fail('docs_default_service_role_ready_not_false')
}
if (docsJson.booleans?.defaultServiceRoleQueueSmokeProofAcceptedWithProvidedEvidence !== false) {
  fail('docs_default_service_role_proof_not_false')
}
if (docsJson.booleans?.defaultWorkerDispatchSmokeProofAcceptedWithProvidedEvidence !== false) {
  fail('docs_default_worker_dispatch_proof_not_false')
}
if (docsJson.booleans?.fullEvidenceServiceRoleQueueSmokeReadyToExecute !== true) {
  fail('docs_full_service_role_ready_not_true')
}
if (docsJson.booleans?.fullEvidenceServiceRoleQueueSmokeProofAcceptedWithProvidedEvidence !== true) {
  fail('docs_full_service_role_proof_not_true')
}
if (docsJson.booleans?.fullEvidenceWorkerDispatchSmokeProofAcceptedWithProvidedEvidence !== true) {
  fail('docs_full_worker_dispatch_proof_not_true')
}
assertBooleanMap(docsJson, 'docs', undefined)

const defaultReport = runCli()
if (defaultReport.status !== 'installed_and_mapped_runtime_blocked') {
  fail(`default_status:${defaultReport.status}`)
}
assertCount(defaultReport, 'totalAiGraphicsTools', 21, 'default')
assertCount(defaultReport, 'installReadyTools', 21, 'default')
assertCount(defaultReport, 'productionMappedTools', 21, 'default')
assertCount(defaultReport, 'gpuRuntimeTargetedTools', 8, 'default')
assertCount(defaultReport, 'externalBetaCandidateReadyWithProvidedEvidenceTools', 0, 'default')
assertCount(defaultReport, 'serviceRoleQueueSmokePreflightPayloadsPrepared', 21, 'default')
assertCount(defaultReport, 'serviceRoleQueueSmokePreflightReadyToExecute', 0, 'default')
assertCount(defaultReport, 'serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence', 0, 'default')
assertCount(defaultReport, 'workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence', 0, 'default')
assertCount(defaultReport, 'externalBetaReadyNowTools', 0, 'default')
assertBooleanMap(defaultReport, 'default', false, false, false)
assertTools(defaultReport, 'default')
if (defaultReport.serviceRoleQueueSmokePreflight?.status !== 'missing_required_environment_or_flags') {
  fail(`default_service_role_preflight_status:${defaultReport.serviceRoleQueueSmokePreflight?.status}`)
}
if (defaultReport.serviceRoleQueueSmokePreflight?.all21PayloadsPrepared !== true) {
  fail('default_service_role_payloads_not_prepared')
}
if (defaultReport.serviceRoleQueueSmokePreflight?.readyToExecuteLiveNonProductionSmoke !== false) {
  fail('default_service_role_preflight_ready_not_false')
}

const serviceRoleKeyEnvName = 'SUPABASE_' + 'SERVICE_ROLE_KEY'
const redactionProbeToken = 'sb_placeholder_external_beta_preflight_redaction_check'
const readyServiceRolePreflight = runPreflight([
  '--workspace-id', 'workspace_external_beta_smoke',
  '--project-id', 'project_external_beta_smoke',
  '--approved-plan-snapshot-id', 'approved_snapshot_external_beta_smoke',
  '--credit-reservation-id', 'credit_reservation_external_beta_smoke',
  '--idempotency-prefix', 'ai-graphics-external-beta-smoke-test',
  '--service-role-queue-smoke-readiness-ref',
  'private://ai-graphics/external-beta/service-role-queue-smoke/readiness.json',
  '--runtime-queue-service-proof-bridge-ref',
  'private://ai-graphics/external-beta/runtime-queue-service-bridge/proof.json',
  '--source-runtime-queue-service-proof-bridge-accepted',
], {
  REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE: 'true',
  REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV: 'non_production',
  SUPABASE_URL: 'https://external-beta-preflight.supabase.co',
  [serviceRoleKeyEnvName]: redactionProbeToken,
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'mock',
})
if (readyServiceRolePreflight.readyToExecuteLiveNonProductionSmoke !== true) {
  fail('ready_service_role_preflight_not_ready')
}
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-e2e-readiness-'))
const betaEvidenceBundlePath = path.join(tmpDir, 'accepted-beta-evidence-bundle.json')
fs.writeFileSync(
  betaEvidenceBundlePath,
  `${JSON.stringify(acceptedBetaEvidenceBundleFixture(), null, 2)}\n`,
)
const modelWeightManifestReviewPacketPath = path.join(tmpDir, 'model-weight-manifest-review-packet.json')
fs.writeFileSync(
  modelWeightManifestReviewPacketPath,
  `${JSON.stringify(acceptedModelWeightManifestReviewPacket(), null, 2)}\n`,
)
const gpuRuntimeProofResultPacketPath = path.join(tmpDir, 'gpu-runtime-proof-result-packet.json')
fs.writeFileSync(
  gpuRuntimeProofResultPacketPath,
  `${JSON.stringify(acceptedGpuRuntimeProofResultPacket(), null, 2)}\n`,
)
const nativeGpuProofCollectionPacketPath =
  path.join(tmpDir, 'external-beta-native-gpu-proof-collection-packet.json')
fs.writeFileSync(
  nativeGpuProofCollectionPacketPath,
  `${JSON.stringify(acceptedNativeGpuProofCollectionPacket(), null, 2)}\n`,
)
const externalBetaEvidenceRecordsPath = path.join(tmpDir, 'external-beta-evidence-records.json')
fs.writeFileSync(
  externalBetaEvidenceRecordsPath,
  `${JSON.stringify(allTools.map(acceptedExternalBetaEvidenceRecord), null, 2)}\n`,
)
const externalBetaEvidencePacket = runNpm('ai-graphics:external-beta-evidence-packet:validate', [
  '--evidence-records',
  externalBetaEvidenceRecordsPath,
])
const externalBetaEvidencePacketPath = path.join(tmpDir, 'external-beta-evidence-packet.json')
fs.writeFileSync(
  externalBetaEvidencePacketPath,
  `${JSON.stringify(externalBetaEvidencePacket, null, 2)}\n`,
)
const externalBetaEvidenceAdmissionBundle = runNpm(
  'ai-graphics:external-beta-evidence-admission-bundle',
  [
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
    externalBetaEvidencePacketPath,
  ],
)
if (
  externalBetaEvidenceAdmissionBundle.status !==
  'external_beta_admission_candidate_with_provided_evidence_runtime_still_blocked'
) {
  fail(`external_beta_admission_bundle_status:${externalBetaEvidenceAdmissionBundle.status}`)
}
const externalBetaEvidenceAdmissionBundlePath =
  path.join(tmpDir, 'external-beta-evidence-admission-bundle.json')
fs.writeFileSync(
  externalBetaEvidenceAdmissionBundlePath,
  `${JSON.stringify(externalBetaEvidenceAdmissionBundle, null, 2)}\n`,
)
const readyServiceRolePreflightPath = path.join(tmpDir, 'service-role-preflight.json')
fs.writeFileSync(
  readyServiceRolePreflightPath,
  `${JSON.stringify(readyServiceRolePreflight, null, 2)}\n`,
)
const serviceRoleQueueSmokeReadinessPath = path.join(tmpDir, 'service-role-queue-smoke-readiness.json')
fs.writeFileSync(
  serviceRoleQueueSmokeReadinessPath,
  `${JSON.stringify(serviceRoleQueueSmokeReadinessFixture(), null, 2)}\n`,
)
const serviceRoleQueueSmokeResultPath = path.join(tmpDir, 'service-role-queue-smoke-result.json')
fs.writeFileSync(
  serviceRoleQueueSmokeResultPath,
  `${JSON.stringify(serviceRoleQueueSmokeResultFixture(), null, 2)}\n`,
)
const serviceRoleQueueSmokeProof = runProof([
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
])
if (serviceRoleQueueSmokeProof.proofAcceptedWithProvidedEvidence !== true) {
  fail('service_role_queue_smoke_proof_not_accepted')
}
const serviceRoleQueueSmokeProofPath = path.join(tmpDir, 'service-role-queue-smoke-proof.json')
fs.writeFileSync(
  serviceRoleQueueSmokeProofPath,
  `${JSON.stringify(serviceRoleQueueSmokeProof, null, 2)}\n`,
)
const workerDispatchReadinessPath = path.join(tmpDir, 'worker-dispatch-readiness.json')
fs.writeFileSync(
  workerDispatchReadinessPath,
  `${JSON.stringify(workerDispatchReadinessFixture(), null, 2)}\n`,
)
const workerDispatchSmoke = runWorkerDispatchSmoke([
  '--external-beta-worker-dispatch-readiness-packet',
  workerDispatchReadinessPath,
  '--external-beta-worker-dispatch-smoke-ref',
  'private://ai-graphics/external-beta/worker-dispatch-smoke/report.json',
  '--external-beta-worker-dispatch-smoke-telemetry-ref',
  'private://ai-graphics/external-beta/worker-dispatch-smoke/telemetry.json',
  '--external-beta-worker-dispatch-smoke-lease-audit-ref',
  'private://ai-graphics/external-beta/worker-dispatch-smoke/lease-audit.json',
  '--external-beta-worker-dispatch-smoke-cleanup-ref',
  'private://ai-graphics/external-beta/worker-dispatch-smoke/cleanup.json',
])
const workerDispatchSmokePath = path.join(tmpDir, 'worker-dispatch-smoke.json')
fs.writeFileSync(
  workerDispatchSmokePath,
  `${JSON.stringify(workerDispatchSmoke, null, 2)}\n`,
)
const workerDispatchSmokeProof = runWorkerDispatchProof([
  '--external-beta-worker-dispatch-smoke-result',
  workerDispatchSmokePath,
  '--external-beta-worker-dispatch-smoke-evidence-ref',
  'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/evidence.json',
  '--external-beta-worker-dispatch-smoke-telemetry-ref',
  'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/telemetry.json',
  '--external-beta-worker-dispatch-smoke-lease-audit-ref',
  'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/lease-audit.json',
  '--external-beta-worker-dispatch-smoke-cleanup-proof-ref',
  'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/cleanup.json',
])
if (workerDispatchSmokeProof.proofAcceptedWithProvidedEvidence !== true) {
  fail('worker_dispatch_smoke_proof_not_accepted')
}
const workerDispatchSmokeProofPath = path.join(tmpDir, 'worker-dispatch-smoke-proof.json')
fs.writeFileSync(
  workerDispatchSmokeProofPath,
  `${JSON.stringify(workerDispatchSmokeProof, null, 2)}\n`,
)

const preflightOnlyFullEvidenceReport = runCli([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--internal-beta-owner-approval-granted',
  '--all-external-beta-evidence-passed',
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
])
if (preflightOnlyFullEvidenceReport.status !== 'installed_and_mapped_runtime_blocked') {
  fail(`preflight_only_full_status:${preflightOnlyFullEvidenceReport.status}`)
}
assertCount(preflightOnlyFullEvidenceReport, 'externalBetaCandidateReadyWithProvidedEvidenceTools', 0, 'preflight_only_full')
assertCount(preflightOnlyFullEvidenceReport, 'serviceRoleQueueSmokePreflightReadyToExecute', 1, 'preflight_only_full')
assertCount(preflightOnlyFullEvidenceReport, 'serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence', 0, 'preflight_only_full')
assertCount(preflightOnlyFullEvidenceReport, 'workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence', 0, 'preflight_only_full')
assertBooleanMap(preflightOnlyFullEvidenceReport, 'preflight_only_full', true, false, false)

const queueProofOnlyFullEvidenceReport = runCli([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--internal-beta-owner-approval-granted',
  '--all-external-beta-evidence-passed',
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
  '--external-beta-service-role-queue-smoke-proof-packet',
  serviceRoleQueueSmokeProofPath,
])
if (queueProofOnlyFullEvidenceReport.status !== 'installed_and_mapped_runtime_blocked') {
  fail(`queue_proof_only_full_status:${queueProofOnlyFullEvidenceReport.status}`)
}
assertCount(queueProofOnlyFullEvidenceReport, 'externalBetaCandidateReadyWithProvidedEvidenceTools', 0, 'queue_proof_only_full')
assertCount(queueProofOnlyFullEvidenceReport, 'serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence', 21, 'queue_proof_only_full')
assertCount(queueProofOnlyFullEvidenceReport, 'workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence', 0, 'queue_proof_only_full')
assertBooleanMap(queueProofOnlyFullEvidenceReport, 'queue_proof_only_full', true, true, false)

const workerProofOnlyFullEvidenceReport = runCli([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--internal-beta-owner-approval-granted',
  '--all-external-beta-evidence-passed',
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
  '--external-beta-service-role-queue-smoke-proof-packet',
  serviceRoleQueueSmokeProofPath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
])
if (workerProofOnlyFullEvidenceReport.status !== 'installed_and_mapped_runtime_blocked') {
  fail(`worker_proof_only_full_status:${workerProofOnlyFullEvidenceReport.status}`)
}
assertCount(workerProofOnlyFullEvidenceReport, 'externalBetaCandidateReadyWithProvidedEvidenceTools', 0, 'worker_proof_only_full')
assertCount(workerProofOnlyFullEvidenceReport, 'serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence', 21, 'worker_proof_only_full')
assertCount(workerProofOnlyFullEvidenceReport, 'workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence', 21, 'worker_proof_only_full')
assertBooleanMap(workerProofOnlyFullEvidenceReport, 'worker_proof_only_full', true, true, true)

const fullEvidenceReport = runCli([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--internal-beta-owner-approval-granted',
  '--all-external-beta-evidence-passed',
  '--external-beta-evidence-admission-bundle',
  externalBetaEvidenceAdmissionBundlePath,
  '--external-beta-service-role-queue-smoke-preflight-packet',
  readyServiceRolePreflightPath,
  '--external-beta-service-role-queue-smoke-proof-packet',
  serviceRoleQueueSmokeProofPath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
])
if (
  fullEvidenceReport.status !==
  'external_beta_candidate_with_provided_evidence_runtime_still_blocked'
) {
  fail(`full_evidence_status:${fullEvidenceReport.status}`)
}
assertCount(fullEvidenceReport, 'betaTechnicalEvidenceReadyWithProvidedEvidenceTools', 21, 'full')
assertCount(fullEvidenceReport, 'externalBetaCandidateReadyWithProvidedEvidenceTools', 21, 'full')
assertCount(fullEvidenceReport, 'serviceRoleQueueSmokePreflightPayloadsPrepared', 21, 'full')
assertCount(fullEvidenceReport, 'serviceRoleQueueSmokePreflightReadyToExecute', 1, 'full')
assertCount(fullEvidenceReport, 'serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence', 21, 'full')
assertCount(fullEvidenceReport, 'serviceRoleQueueSmokeProofLiveQueueWritesAcceptedWithProvidedEvidence', 21, 'full')
assertCount(fullEvidenceReport, 'workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence', 21, 'full')
assertCount(fullEvidenceReport, 'workerDispatchSmokeProofSmokeJobsAcceptedWithProvidedEvidence', 21, 'full')
assertCount(fullEvidenceReport, 'workerDispatchSmokeProofInMemoryLeasesAcceptedWithProvidedEvidence', 21, 'full')
assertCount(fullEvidenceReport, 'externalBetaReadyNowTools', 0, 'full')
assertCount(fullEvidenceReport, 'productionReadyNowTools', 0, 'full')
assertBooleanMap(fullEvidenceReport, 'full', true, true, true)
assertTools(fullEvidenceReport, 'full')
if (fullEvidenceReport.booleans?.externalBetaCandidateReadyWithProvidedEvidence !== true) {
  fail('full_evidence_candidate_boolean_not_true')
}
if (fullEvidenceReport.serviceRoleQueueSmokePreflight?.readyToExecuteLiveNonProductionSmoke !== true) {
  fail('full_service_role_preflight_ready_not_true')
}
if (fullEvidenceReport.workerDispatchSmokeProof?.proofAcceptedWithProvidedEvidence !== true) {
  fail('full_worker_dispatch_proof_not_accepted')
}

const claimScanFiles = requiredFiles.filter((filePath) => !filePath.endsWith('-diagnostics.mjs'))
const allText = claimScanFiles.map((filePath) => read(filePath)).join('\n')
for (const key of falseBooleanKeys) {
  const pattern = new RegExp(`${key}["\`]?\\s*[:=]\\s*true`, 'i')
  if (pattern.test(allText)) fail(`forbidden_true_claim:${key}`)
}
for (const phrase of [
  'dry_run_passed',
  'generated_local_fixture_passed',
  'external beta ready now: true',
  'production ready now: true',
]) {
  if (allText.toLowerCase().includes(phrase)) fail(`forbidden_phrase:${phrase}`)
}

const packageLockDiff = git(['diff', '--name-only', '--', 'package-lock.json']).trim()
if (packageLockDiff) fail('package_lock_changed')

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts']).trim()
if (trackedLocalArtifacts) fail('tracked_local_artifacts')

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
for (const filePath of stagedFiles) {
  if (/(\.local-artifacts|generated-media|render-output|browser-output|canvas-output|webgl-output|public-artifact)/i.test(filePath)) {
    fail(`staged_generated_output:${filePath}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: 'ai_graphics_external_beta_end_to_end_readiness_prepared_with_remaining_blocks',
  toolsCovered: defaultReport.counts.totalAiGraphicsTools,
  gpuToolsTargeted: defaultReport.counts.gpuRuntimeTargetedTools,
  duplicateAiGraphicsProductionToolIds: defaultReport.counts.duplicateAiGraphicsProductionToolIds,
  defaultExternalBetaCandidateReadyWithProvidedEvidenceTools:
    defaultReport.counts.externalBetaCandidateReadyWithProvidedEvidenceTools,
  fullEvidenceExternalBetaCandidateReadyWithProvidedEvidenceTools:
    fullEvidenceReport.counts.externalBetaCandidateReadyWithProvidedEvidenceTools,
  fullEvidenceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence:
    fullEvidenceReport.counts.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence,
  externalBetaReadyNowTools: defaultReport.counts.externalBetaReadyNowTools,
  productionReadyNowTools: defaultReport.counts.productionReadyNowTools,
  gpuRuntimeShouldStartNow: defaultReport.booleans.gpuRuntimeShouldStartNow,
  agentCanExecuteToolsNow: defaultReport.booleans.agentCanExecuteToolsNow,
}, null, 2))
