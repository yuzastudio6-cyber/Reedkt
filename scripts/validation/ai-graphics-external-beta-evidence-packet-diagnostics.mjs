import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedNativeGpuProofCollectionPacket } from './ai-graphics-native-gpu-proof-collection-fixture-packet.mjs'

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
const validateScriptName = 'ai-graphics:external-beta-evidence-packet:validate'
const validateScriptCommand = 'tsx server/cli/ai-graphics-external-beta-evidence-packet.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-evidence-packet:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-external-beta-evidence-packet-diagnostics.mjs'
const scaffoldScriptName = 'ai-graphics:external-beta-evidence-scaffold'
const scaffoldScriptCommand = 'tsx server/cli/ai-graphics-external-beta-evidence-scaffold.ts'
const admissionBundleScriptName = 'ai-graphics:external-beta-evidence-admission-bundle'
const readinessScriptName = 'ai-graphics:external-beta-readiness-gate'
const launchControlsScriptName = 'ai-graphics:external-beta-launch-controls'
const workerDispatchSmokeScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke'
const workerDispatchSmokeProofScriptName =
  'ai-graphics:external-beta-worker-dispatch-smoke-proof'

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

const requiredEvidenceClasses = [
  'internal runtime soak evidence',
  'external-beta QA evidence',
  'cost/concurrency/privacy/rollback evidence',
  'incident-response evidence',
  'external-beta owner approval evidence',
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

function writeJson(root, fileName, payload) {
  const filePath = path.join(root, fileName)
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
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

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.md')
const gateDocs = json('docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json')
const source = read('server/tool-registry/ai-graphics-external-beta-evidence-packet.ts')
const cli = read('server/cli/ai-graphics-external-beta-evidence-packet.ts')
const gateSource = read('server/tool-registry/ai-graphics-external-beta-readiness-gate.ts')
const gateCli = read('server/cli/ai-graphics-external-beta-readiness-gate.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[validateScriptName] !== validateScriptCommand) fail(`missing_package_script:${validateScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (pkg.scripts?.[scaffoldScriptName] !== scaffoldScriptCommand) fail(`missing_package_script:${scaffoldScriptName}`)
if (!index.includes("export * from './ai-graphics-external-beta-evidence-scaffold'")) {
  fail('server_registry_index_missing_external_beta_evidence_scaffold_export')
}
if (!index.includes("export * from './ai-graphics-external-beta-evidence-packet'")) {
  fail('server_registry_index_missing_external_beta_evidence_packet_export')
}

if (docs.decision !== 'ai_graphics_external_beta_evidence_packet_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.defaultEvidenceRecordsProvided !== 0) fail('docs_default_records_not_0')
if (docs.counts?.defaultEvidenceRecordsAcceptedWithProvidedEvidence !== 0) {
  fail('docs_default_accepted_records_not_0')
}
if (docs.counts?.fullEvidenceRecordsAcceptedWithProvidedEvidence !== 21) {
  fail('docs_full_accepted_records_not_21')
}
if (docs.counts?.externalBetaReadyWithProvidedEvidenceTools !== 21) {
  fail('docs_full_candidate_count_not_21')
}
if (docs.counts?.externalBetaReadyNowTools !== 0) fail('docs_external_beta_ready_now_not_0')
if (docs.counts?.productionReadyNowTools !== 0) fail('docs_production_ready_now_not_0')

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!docsMd.includes(`\`${tool}\``) && !docsMd.includes('21')) fail(`markdown_missing_tool_context:${tool}`)
}
for (const evidenceClass of requiredEvidenceClasses) {
  if (!docs.requiredEvidenceClasses?.includes(evidenceClass)) fail(`docs_missing_evidence_class:${evidenceClass}`)
  if (!docsMd.toLowerCase().includes(evidenceClass.toLowerCase())) {
    fail(`markdown_missing_evidence_class:${evidenceClass}`)
  }
}
for (const forbiddenPattern of ['http://', 'https://', 'signed-url://', 'public://', 'gs://public']) {
  if (!docs.forbiddenEvidenceRefPatterns?.includes(forbiddenPattern)) {
    fail(`docs_missing_forbidden_ref_pattern:${forbiddenPattern}`)
  }
  if (!source.includes(forbiddenPattern)) fail(`source_missing_forbidden_ref_pattern:${forbiddenPattern}`)
}
for (const namespace of ['private://', 'reeditpro-private://', 'backend-evidence://', 'owner-evidence://', 'external-beta-evidence://']) {
  if (!docs.acceptedEvidenceRefNamespaces?.includes(namespace)) {
    fail(`docs_missing_accepted_namespace:${namespace}`)
  }
  if (!source.includes(namespace)) fail(`source_missing_accepted_namespace:${namespace}`)
}

for (const key of [
  'externalBetaEvidencePacketPrepared',
  'all21ToolsCovered',
  'fullEvidencePacketCanPrepareExternalBetaCandidateSet',
  'privateOrBackendEvidenceRefsRequired',
  'publicArtifactRefsRejected',
  'signedUrlRefsRejected',
  'rawHttpRefsRejected',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET_DECISION',
  'buildAiGraphicsExternalBetaEvidencePacket',
  'externalBetaReadyWithProvidedEvidenceTools',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
  'acceptedRefsRedacted: true',
  'isSafeEvidenceRef',
  'externalBetaEvidenceAcceptedWithProvidedEvidence',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--evidence-records',
  'validatorOnly: true',
  'dependencyInstallPerformed: false',
  'toolExecutionPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'externalBetaEvidencePacket',
  '--external-beta-evidence-packet',
  'externalBetaEvidenceAdmissionBundle',
  '--external-beta-evidence-admission-bundle',
  'sourceExternalBetaEvidenceAdmissionBundleAccepted',
]) {
  if (!gateSource.includes(needle) && !gateCli.includes(needle)) fail(`readiness_gate_missing_packet_integration:${needle}`)
}
if (gateDocs.sourceEvidence?.externalBetaEvidencePacket !== 'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json') {
  fail('gate_docs_missing_external_beta_evidence_packet_source')
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-evidence-packet-'))
const fullRecordsPath = writeJson(tempRoot, 'full-records.json', allTools.map(acceptedRecord))
const fullPacketPath = writeJson(
  tempRoot,
  'full-packet.json',
  parseJsonOutput(runNpm(validateScriptName, ['--evidence-records', fullRecordsPath]), 'full_packet_source'),
)
const modelWeightManifestReviewPacketPath = writeJson(
  tempRoot,
  'model-weight-manifest-review-packet.json',
  acceptedModelWeightManifestReviewPacket(),
)
const gpuRuntimeProofResultPacketPath = writeJson(
  tempRoot,
  'gpu-runtime-proof-result-packet.json',
  acceptedGpuRuntimeProofResultPacket(),
)
const nativeGpuProofCollectionPacketPath = writeJson(
  tempRoot,
  'external-beta-native-gpu-proof-collection-packet.json',
  acceptedNativeGpuProofCollectionPacket(),
)
const admissionBundlePath = writeJson(
  tempRoot,
  'external-beta-evidence-admission-bundle.json',
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
const workerDispatchReadinessPath = writeJson(
  tempRoot,
  'worker-dispatch-readiness.json',
  {
    decision: 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks',
    sourceServiceRoleQueueSmokeProofBridgeAccepted: true,
    sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    workerDispatchReadinessPreparedWithProvidedEvidence: true,
    workerDispatchReadinessRecordsPreparedWithProvidedEvidence: 21,
    workerDispatchCapabilityScenariosPreparedWithProvidedEvidence: 12,
    gpuRuntimeTargetedTools: 8,
    acceptedSourceEvidence: {
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
      serviceRoleQueueSmokeAuthorizationRef:
        'private://ai-graphics/external-beta/service-role-queue-smoke/authorization.json',
    },
    records: allTools.map((toolId) => ({
      toolId,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    })),
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    booleans: {
      sourceServiceRoleQueueSmokeProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  },
)
const workerDispatchSmokePath = writeJson(
  tempRoot,
  'worker-dispatch-smoke.json',
  parseJsonOutput(runNpm(workerDispatchSmokeScriptName, [
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
  ]), 'worker_dispatch_smoke_source'),
)
const workerDispatchSmokeProofPath = writeJson(
  tempRoot,
  'worker-dispatch-smoke-proof.json',
  parseJsonOutput(runNpm(workerDispatchSmokeProofScriptName, [
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
  ]), 'worker_dispatch_smoke_proof_source'),
)
const launchControlsPath = writeJson(
  tempRoot,
  'external-beta-launch-controls.json',
  parseJsonOutput(runNpm(launchControlsScriptName, [
    '--internal-beta-runtime-soak-ref',
    'private://ai-graphics/external-beta/launch-controls/internal-runtime-soak.json',
    '--external-beta-qa-evidence-ref',
    'private://ai-graphics/external-beta/launch-controls/external-beta-qa.json',
    '--external-beta-cost-concurrency-privacy-rollback-ref',
    'private://ai-graphics/external-beta/launch-controls/cost-concurrency-privacy-rollback.json',
    '--external-beta-incident-response-ref',
    'private://ai-graphics/external-beta/launch-controls/incident-response.json',
    '--external-beta-owner-approval-ref',
    'private://ai-graphics/external-beta/launch-controls/owner-approval.json',
    '--external-beta-launch-switch-ref',
    'private://ai-graphics/external-beta/launch-controls/launch-switch.json',
    '--external-beta-rollout-cohort-ref',
    'private://ai-graphics/external-beta/launch-controls/rollout-cohort.json',
    '--external-beta-cost-concurrency-ceiling-ref',
    'private://ai-graphics/external-beta/launch-controls/cost-concurrency-ceiling.json',
    '--external-beta-rollback-incident-runbook-ref',
    'private://ai-graphics/external-beta/launch-controls/rollback-incident-runbook.json',
    '--external-beta-private-artifact-retention-support-ref',
    'private://ai-graphics/external-beta/launch-controls/private-artifact-retention-support.json',
    '--external-beta-support-ownership-ref',
    'private://ai-graphics/external-beta/launch-controls/support-ownership.json',
    '--external-beta-worker-dispatch-smoke-proof-ref',
    'private://ai-graphics/external-beta/launch-controls/worker-dispatch-smoke-proof.json',
    '--external-beta-launch-approver-role',
    'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER',
  ]), 'launch_controls_source'),
)
const unsafeRecordsPath = writeJson(tempRoot, 'unsafe-records.json', [
  {
    ...acceptedRecord('d3'),
    internalRuntimeSoakEvidenceRef: 'https://example.test/unsafe',
    externalBetaQaEvidenceRef: 'signed-url://unsafe',
    costConcurrencyPrivacyRollbackEvidenceRef: 'public://unsafe',
    incidentResponseEvidenceRef: 'gs://public/unsafe',
    ownerApprovalRef: 'http://example.test/unsafe',
  },
])

const defaultOutput = parseJsonOutput(runNpm(validateScriptName), 'default_packet')
const fullOutput = parseJsonOutput(runNpm(validateScriptName, ['--evidence-records', fullRecordsPath]), 'full_packet')
const unsafeOutput = parseJsonOutput(runNpm(validateScriptName, ['--evidence-records', unsafeRecordsPath]), 'unsafe_packet')
const packetFedGateOutput = parseJsonOutput(runNpm(readinessScriptName, [
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--external-beta-evidence-packet',
  fullPacketPath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
]), 'packet_fed_external_beta_gate')
const admissionBundleFedGateOutput = parseJsonOutput(runNpm(readinessScriptName, [
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--external-beta-evidence-admission-bundle',
  admissionBundlePath,
  '--external-beta-launch-controls',
  launchControlsPath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
]), 'admission_bundle_fed_external_beta_gate')

if (defaultOutput.records?.length !== 21) fail('default_output_record_count_not_21')
if (defaultOutput.evidenceRecordsProvided !== 0) fail('default_output_records_provided_not_0')
if (defaultOutput.evidenceRecordsAcceptedWithProvidedEvidence !== 0) fail('default_output_accepted_records_not_0')
if (defaultOutput.externalBetaReadyWithProvidedEvidenceTools !== 0) fail('default_candidate_count_not_0')
if (defaultOutput.externalBetaReadyNowTools !== 0) fail('default_external_beta_ready_now_not_0')

if (fullOutput.records?.length !== 21) fail('full_output_record_count_not_21')
if (fullOutput.evidenceRecordsProvided !== 21) fail('full_output_records_provided_not_21')
if (fullOutput.evidenceRecordsAcceptedWithProvidedEvidence !== 21) fail('full_output_accepted_records_not_21')
if (fullOutput.externalBetaReadyWithProvidedEvidenceTools !== 21) fail('full_output_candidate_count_not_21')
if (fullOutput.externalBetaReadyNowTools !== 0) fail('full_output_external_beta_ready_now_not_0')
if (fullOutput.productionReadyNowTools !== 0) fail('full_output_production_ready_now_not_0')

if (unsafeOutput.evidenceRecordsAcceptedWithProvidedEvidence !== 0) {
  fail('unsafe_refs_were_accepted')
}
const unsafeD3 = unsafeOutput.records?.find((record) => record.toolId === 'd3')
if (unsafeD3?.externalBetaEvidenceAcceptedWithProvidedEvidence !== false) fail('unsafe_d3_record_not_rejected')
if (!unsafeD3?.missingEvidence?.length) fail('unsafe_d3_missing_evidence_not_reported')

if (packetFedGateOutput.betaTestingReadyWithProvidedEvidenceTools !== 21) {
  fail('packet_fed_gate_beta_testing_candidates_not_21')
}
if (packetFedGateOutput.externalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('packet_fed_gate_external_beta_candidates_not_0')
}
if (packetFedGateOutput.externalBetaReadyNowTools !== 0) fail('packet_fed_gate_external_beta_ready_now_not_0')
if (packetFedGateOutput.externalBetaBlockedNowTools !== 21) fail('packet_fed_gate_blocked_now_not_21')
if (packetFedGateOutput.productionReadyNowTools !== 0) fail('packet_fed_gate_production_ready_now_not_0')
if (packetFedGateOutput.booleans?.sourceExternalBetaWorkerDispatchSmokeProofAccepted !== true) {
  fail('packet_fed_gate_worker_dispatch_smoke_proof_not_accepted')
}
if (admissionBundleFedGateOutput.externalBetaReadyWithProvidedEvidenceTools !== 21) {
  fail('admission_bundle_fed_gate_external_beta_candidates_not_21')
}
if (admissionBundleFedGateOutput.booleans?.sourceExternalBetaEvidenceAdmissionBundleAccepted !== true) {
  fail('admission_bundle_fed_gate_admission_bundle_not_accepted')
}
if (admissionBundleFedGateOutput.externalBetaReadyNowTools !== 0) {
  fail('admission_bundle_fed_gate_external_beta_ready_now_not_0')
}

for (const output of [defaultOutput, fullOutput, packetFedGateOutput, admissionBundleFedGateOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`output_required_false_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_external_beta_evidence_packet_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_external_beta_evidence_packet_decision')
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.md',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.md',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json',
  'server/tool-registry/ai-graphics-external-beta-evidence-packet.ts',
  'server/cli/ai-graphics-external-beta-evidence-packet.ts',
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
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

const packageLockDiff = git(['diff', '--', 'package-lock.json'])
if (packageLockDiff) fail('package_lock_changed')

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
  `+    "${validateScriptName}": "${validateScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  `+    "${scaffoldScriptName}": "${scaffoldScriptCommand}",`,
  '+    "ai-graphics:external-beta-evidence-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-scaffold-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-gap-report": "tsx server/cli/ai-graphics-external-beta-launch-gap-report.ts",',
  '+    "ai-graphics:external-beta-launch-gap-report:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-gap-report-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-go-no-go": "tsx server/cli/ai-graphics-external-beta-launch-go-no-go.ts",',
  '+    "ai-graphics:external-beta-launch-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-go-no-go-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
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
if (stagedFiles.some((file) => /(generated|render|browser|canvas|webgl|public-artifact|signed-url|\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.gif|\.svg)$/i.test(file))) {
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
  defaultEvidenceRecordsAcceptedWithProvidedEvidence:
    defaultOutput.evidenceRecordsAcceptedWithProvidedEvidence,
  fullEvidenceRecordsAcceptedWithProvidedEvidence:
    fullOutput.evidenceRecordsAcceptedWithProvidedEvidence,
  packetFedExternalBetaReadyWithProvidedEvidenceTools:
    packetFedGateOutput.externalBetaReadyWithProvidedEvidenceTools,
  externalBetaReadyNowTools: packetFedGateOutput.externalBetaReadyNowTools,
  productionReadyNowTools: packetFedGateOutput.productionReadyNowTools,
  agentCanExecuteToolsNow: packetFedGateOutput.booleans?.agentCanExecuteToolsNow,
}, null, 2))
