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
const runScriptName = 'ai-graphics:external-beta-launch-gap-report'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-launch-gap-report.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-launch-gap-report:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-launch-gap-report-diagnostics.mjs'
const packetScriptName = 'ai-graphics:external-beta-evidence-packet:validate'
const admissionBundleScriptName = 'ai-graphics:external-beta-evidence-admission-bundle'
const launchControlsScriptName = 'ai-graphics:external-beta-launch-controls'

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

const finalLaunchGateBlockers = [
  'external beta launch switch is not approved',
  'external beta rollout cohort is not approved',
  'external beta cost and concurrency ceiling is not approved',
  'external beta rollback and incident-response runbook is not approved for live users',
  'external beta private artifact retention and support ownership are not approved',
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-launch-gap-report.ts',
  'server/cli/ai-graphics-external-beta-launch-gap-report.ts',
  'server/tool-registry/ai-graphics-external-beta-evidence-scaffold.ts',
  'server/tool-registry/ai-graphics-external-beta-evidence-packet.ts',
  'server/tool-registry/ai-graphics-external-beta-readiness-gate.ts',
  'server/tool-registry/ai-graphics-external-beta-launch-controls.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.md',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-scaffold.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-controls.json',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.md')
const source = read('server/tool-registry/ai-graphics-external-beta-launch-gap-report.ts')
const cli = read('server/cli/ai-graphics-external-beta-launch-gap-report.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-launch-gap-report'")) {
  fail('server_registry_index_missing_external_beta_launch_gap_report_export')
}
if (docs.decision !== 'ai_graphics_external_beta_launch_gap_report_prepared_with_remaining_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  evidenceScaffoldRecordsPrepared: 21,
  installReadyTools: 21,
  productionMappedTools: 21,
  planningSelectableTools: 21,
  gpuRuntimeTargetedTools: 8,
  defaultExternalBetaCandidatesWithProvidedEvidenceTools: 0,
  fullEvidenceExternalBetaCandidatesWithProvidedEvidenceTools: 21,
  fullEvidenceExternalBetaLaunchControlsAccepted: true,
  externalBetaReadyNowTools: 0,
  externalBetaBlockedNowTools: 21,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
if (gpuTools.length !== 8) fail('diagnostic_gpu_tool_count_not_8')

for (const blocker of finalLaunchGateBlockers) {
  if (!docs.remainingExternalBetaLaunchGates?.includes(blocker)) {
    fail(`docs_missing_launch_gate_blocker:${blocker}`)
  }
  if (!source.includes(blocker)) fail(`source_missing_launch_gate_blocker:${blocker}`)
}
for (const [key, expected] of Object.entries({
  checkedInRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
  checkedInBlockedPendingNativeGpuRuntimeProofTools: 8,
  readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools: 21,
  readyAfterNativeGpuCollectionNativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 8,
  readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools: 0,
  sourcePacketFlag: '--external-beta-native-gpu-proof-collection-packet',
  sourceCollectionDecision: 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready',
  perToolRecheckDecision: 'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks',
  gpuRuntimeShouldStartNow: false,
})) {
  if (docs.runtimeProofBridge?.[key] !== expected) {
    fail(`unexpected_docs_runtime_proof_bridge:${key}:${docs.runtimeProofBridge?.[key]}`)
  }
}
for (const [key, expected] of Object.entries({
  cpuStaticAndBrowserCohortTools: 13,
  nativeGpuModelCohortTools: 8,
  allToolsCandidateAfterFullEvidence: 21,
})) {
  if (docs.launchCohorts?.[key] !== expected) {
    fail(`unexpected_docs_launch_cohort:${key}:${docs.launchCohorts?.[key]}`)
  }
}
for (const sequenceNeedle of [
  'Generate local-only external-beta evidence templates',
  'Replace all rejected public placeholders with private/backend evidence refs',
  'Validate the sanitized evidence',
  'Feed the validated packet and accepted launch controls into ai-graphics:external-beta-readiness-gate',
  'Run a separate external-beta launch go/no-go',
]) {
  if (!source.includes(sequenceNeedle)) fail(`source_missing_launch_sequence:${sequenceNeedle}`)
}
for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION',
  'buildAiGraphicsExternalBetaLaunchGapReport',
  'buildAiGraphicsExternalBetaReadinessGate',
  'buildAiGraphicsExternalBetaEvidenceScaffoldPacket',
  'externalBetaReadyNowTools: 0',
  'externalBetaBlockedNowTools: 21',
  'productionReadyNowTools: 0',
  'runtimeProofBridge',
  'readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools: 21',
  'readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools: 0',
  'sourcePacketFlag: \'--external-beta-native-gpu-proof-collection-packet\'',
  'launchCohorts',
  'nativeGpuModelCohortTools: 8',
  'gpuRuntimeOnDemandOnly: true',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-evidence-packet',
  '--external-beta-evidence-admission-bundle',
  '--external-beta-worker-dispatch-smoke-proof',
  '--external-beta-launch-controls',
  '--external-beta-worker-dispatch-smoke-proof-accepted',
  '--all-shared-gates-passed',
  '--all-external-beta-evidence-passed',
  'reportOnly: true',
  'toolExecutionPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}

for (const key of [
  'externalBetaLaunchGapReportPrepared',
  'sourceExternalBetaReadinessGateAccepted',
  'sourceExternalBetaEvidenceScaffoldAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21ToolsInstalledForPlannedSurface',
  'all21ToolsMappedToProductionRegistry',
  'evidenceScaffoldPreparedForAll21Tools',
  'gpuRuntimeOnDemandOnly',
  'externalBetaCandidatesWithProvidedEvidence',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}
if (!scorecard.includes('ai_graphics_external_beta_launch_gap_report_prepared_with_remaining_blocks')) {
  fail('scorecard_missing_external_beta_launch_gap_report_decision')
}
if (!docsMd.includes('External-beta-ready now: `0`')) fail('markdown_missing_external_beta_ready_zero')
if (!docsMd.includes('Recheck after `--external-beta-native-gpu-proof-collection-packet`: `21` accepted with provided evidence')) {
  fail('markdown_missing_native_gpu_collection_recheck')
}
if (!scorecard.includes('checked-in per-tool proof is 13 accepted / 8 GPU blocked')) {
  fail('scorecard_missing_runtime_proof_bridge_summary')
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-launch-gap-'))
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
const workerDispatchSmokeProofPath = writeJson(
  path.join(tempRoot, 'worker-dispatch-smoke-proof.json'),
  acceptedWorkerDispatchSmokeProofFixture(),
)

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_launch_gap_report')
const fullOutput = parseJsonOutput(runNpm(runScriptName, [
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--external-beta-evidence-packet',
  fullPacketPath,
  '--external-beta-evidence-admission-bundle',
  admissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
  '--external-beta-launch-controls',
  launchControlsPacketPath,
]), 'full_launch_gap_report')

if (defaultOutput.externalBetaCandidatesWithProvidedEvidenceTools !== 0) {
  fail('default_launch_gap_candidates_not_0')
}
if (defaultOutput.externalBetaReadyNowTools !== 0) fail('default_launch_gap_ready_now_not_0')
if (defaultOutput.externalBetaBlockedNowTools !== 21) fail('default_launch_gap_blocked_not_21')
if (defaultOutput.productionReadyNowTools !== 0) fail('default_launch_gap_production_not_0')
if (defaultOutput.booleans?.externalBetaCandidatesWithProvidedEvidence !== false) {
  fail('default_launch_gap_candidate_boolean_not_false')
}

if (fullOutput.externalBetaCandidatesWithProvidedEvidenceTools !== 21) {
  fail('full_launch_gap_candidates_not_21')
}
if (fullOutput.externalBetaReadyNowTools !== 0) fail('full_launch_gap_ready_now_not_0')
if (fullOutput.externalBetaBlockedNowTools !== 21) fail('full_launch_gap_blocked_not_21')
if (fullOutput.productionReadyNowTools !== 0) fail('full_launch_gap_production_not_0')
if (fullOutput.booleans?.externalBetaCandidatesWithProvidedEvidence !== true) {
  fail('full_launch_gap_candidate_boolean_not_true')
}
for (const [key, expected] of Object.entries({
  checkedInRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
  checkedInBlockedPendingNativeGpuRuntimeProofTools: 8,
  readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools: 21,
  readyAfterNativeGpuCollectionNativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 8,
  readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools: 0,
  gpuRuntimeShouldStartNow: false,
})) {
  if (defaultOutput.runtimeProofBridge?.[key] !== expected) {
    fail(`default_runtime_proof_bridge_unexpected:${key}:${defaultOutput.runtimeProofBridge?.[key]}`)
  }
  if (fullOutput.runtimeProofBridge?.[key] !== expected) {
    fail(`full_runtime_proof_bridge_unexpected:${key}:${fullOutput.runtimeProofBridge?.[key]}`)
  }
}
for (const [key, expected] of Object.entries({
  cpuStaticAndBrowserCohortTools: 13,
  nativeGpuModelCohortTools: 8,
  allToolsCandidateAfterFullEvidence: 21,
})) {
  if (defaultOutput.launchCohorts?.[key] !== expected) {
    fail(`default_launch_cohort_unexpected:${key}:${defaultOutput.launchCohorts?.[key]}`)
  }
  if (fullOutput.launchCohorts?.[key] !== expected) {
    fail(`full_launch_cohort_unexpected:${key}:${fullOutput.launchCohorts?.[key]}`)
  }
}
for (const tool of allTools) {
  const defaultTool = defaultOutput.tools?.find((entry) => entry.toolId === tool)
  const fullTool = fullOutput.tools?.find((entry) => entry.toolId === tool)
  if (!defaultTool) fail(`default_output_missing_tool:${tool}`)
  if (!fullTool) fail(`full_output_missing_tool:${tool}`)
  if (defaultTool?.externalBetaReadyNow !== false) fail(`default_tool_ready_now_not_false:${tool}`)
  if (fullTool?.externalBetaReadyNow !== false) fail(`full_tool_ready_now_not_false:${tool}`)
  if (fullTool?.productionReadyNow !== false) fail(`full_tool_production_not_false:${tool}`)
  for (const blocker of finalLaunchGateBlockers) {
    if (!fullTool?.remainingLaunchGates?.includes(blocker)) {
      fail(`full_tool_missing_remaining_launch_gate:${tool}:${blocker}`)
    }
  }
}
for (const tool of gpuTools) {
  const fullTool = fullOutput.tools?.find((entry) => entry.toolId === tool)
  if (fullTool?.gpuRequiredForRuntime !== true) fail(`gpu_tool_not_gpu_required:${tool}`)
}

for (const output of [defaultOutput, fullOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`output_required_false_not_false:${key}`)
    }
  }
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.md',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.json',
  'server/tool-registry/ai-graphics-external-beta-launch-gap-report.ts',
  'server/cli/ai-graphics-external-beta-launch-gap-report.ts',
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
  defaultExternalBetaCandidatesWithProvidedEvidenceTools:
    defaultOutput.externalBetaCandidatesWithProvidedEvidenceTools,
  fullExternalBetaCandidatesWithProvidedEvidenceTools:
    fullOutput.externalBetaCandidatesWithProvidedEvidenceTools,
  readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools:
    fullOutput.runtimeProofBridge?.readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools,
  readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools:
    fullOutput.runtimeProofBridge?.readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools,
  externalBetaReadyNowTools: fullOutput.externalBetaReadyNowTools,
  externalBetaBlockedNowTools: fullOutput.externalBetaBlockedNowTools,
  productionReadyNowTools: fullOutput.productionReadyNowTools,
  agentCanExecuteToolsNow: fullOutput.booleans?.agentCanExecuteToolsNow,
  gpuRuntimeApprovedNow: fullOutput.booleans?.gpuRuntimeApprovedNow,
}, null, 2))
