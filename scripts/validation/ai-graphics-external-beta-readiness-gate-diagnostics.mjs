import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:external-beta-readiness-gate:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-external-beta-readiness-gate-diagnostics.mjs'
const evaluatorScriptName = 'ai-graphics:external-beta-readiness-gate'
const evaluatorScriptCommand = 'tsx server/cli/ai-graphics-external-beta-readiness-gate.ts'
const evidencePacketScriptName = 'ai-graphics:external-beta-evidence-packet:validate'
const evidencePacketScriptCommand = 'tsx server/cli/ai-graphics-external-beta-evidence-packet.ts'
const admissionBundleScriptName = 'ai-graphics:external-beta-evidence-admission-bundle'
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

function runEvaluator(args = []) {
  return execFileSync('npm', ['run', '--silent', evaluatorScriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
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

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.md')
const evidencePacketDocs = json('docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json')
const admissionBundleDocs = json('docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json')
const workerDispatchSmokeProofDocs = json('docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json')
const betaGate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const betaToolCall = json('docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.json')
const installAudit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const gpuGate = json('docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json')
const rollup = json('docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json')
const source = read('server/tool-registry/ai-graphics-external-beta-readiness-gate.ts')
const cli = read('server/cli/ai-graphics-external-beta-readiness-gate.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (pkg.scripts?.[evaluatorScriptName] !== evaluatorScriptCommand) {
  fail(`missing_package_script:${evaluatorScriptName}`)
}
if (pkg.scripts?.[evidencePacketScriptName] !== evidencePacketScriptCommand) {
  fail(`missing_package_script:${evidencePacketScriptName}`)
}
if (!pkg.scripts?.[admissionBundleScriptName]) fail(`missing_package_script:${admissionBundleScriptName}`)
if (!pkg.scripts?.[workerDispatchSmokeScriptName]) {
  fail(`missing_package_script:${workerDispatchSmokeScriptName}`)
}
if (!pkg.scripts?.[workerDispatchSmokeProofScriptName]) {
  fail(`missing_package_script:${workerDispatchSmokeProofScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-readiness-gate'")) {
  fail('server_registry_index_missing_external_beta_gate_export')
}
if (!index.includes("export * from './ai-graphics-external-beta-evidence-packet'")) {
  fail('server_registry_index_missing_external_beta_evidence_packet_export')
}

if (docs.decision !== 'ai_graphics_external_beta_readiness_gate_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.sourceEvidence?.externalBetaEvidencePacket !== 'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json') {
  fail('docs_missing_external_beta_evidence_packet_source')
}
if (docs.sourceEvidence?.externalBetaEvidenceAdmissionBundle !== 'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json') {
  fail('docs_missing_external_beta_evidence_admission_bundle_source')
}
if (docs.sourceEvidence?.externalBetaWorkerDispatchSmokeProof !== 'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json') {
  fail('docs_missing_external_beta_worker_dispatch_smoke_proof_source')
}
if (evidencePacketDocs.decision !== 'ai_graphics_external_beta_evidence_packet_prepared_with_runtime_blocks') {
  fail(`unexpected_evidence_packet_decision:${evidencePacketDocs.decision}`)
}
if (admissionBundleDocs.decision !== 'ai_graphics_external_beta_evidence_admission_bundle_prepared_with_runtime_blocks') {
  fail(`unexpected_admission_bundle_decision:${admissionBundleDocs.decision}`)
}
if (workerDispatchSmokeProofDocs.decision !== 'ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks') {
  fail(`unexpected_worker_dispatch_smoke_proof_decision:${workerDispatchSmokeProofDocs.decision}`)
}
if (betaGate.decision !== 'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks') {
  fail(`unexpected_beta_gate_decision:${betaGate.decision}`)
}
if (betaToolCall.decision !== 'ai_graphics_beta_tool_call_readiness_contract_prepared_with_fail_closed_defaults') {
  fail(`unexpected_beta_tool_call_decision:${betaToolCall.decision}`)
}
if (installAudit.counts?.properlyInstalledForPlannedSurface !== 21) fail('install_audit_not_21')
if (installAudit.counts?.heavyToolsTargetingGpu !== 8) fail('install_audit_gpu_tool_count_not_8')
if (installAudit.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) fail('install_audit_cpu_fallback_count_not_0')
if (gpuGate.gpuRuntimePolicy?.onDemandOnly !== true) fail('gpu_gate_not_on_demand')
if (gpuGate.gpuRuntimePolicy?.cpuFallbackAllowedForHeavyTools !== false) fail('gpu_gate_cpu_fallback_allowed')
if (rollup.counts?.externalBetaReadyNowTools !== 0) fail('rollup_external_beta_ready_now_not_0')

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!docsMd.includes(`\`${tool}\``) && !docsMd.includes('21')) fail(`docs_markdown_missing_tool_context:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_READINESS_GATE_DECISION',
  'buildAiGraphicsExternalBetaReadinessGate',
  'buildAiGraphicsBetaReadinessGate',
  'buildAiGraphicsBetaToolCallReadiness',
  'externalBetaReadyWithProvidedEvidenceTools',
  'externalBetaReadyNowTools: 0',
  'externalBetaBlockedNowTools: 21',
  'productionReadyNowTools: 0',
  'internalBetaRuntimeSoakAccepted',
  'externalBetaCostConcurrencyPrivacyRollbackAccepted',
  'externalBetaIncidentResponseAccepted',
  'externalBetaEvidencePacket',
  'externalBetaEvidenceAdmissionBundle',
  'externalBetaWorkerDispatchSmokeProof',
  'AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION',
  'AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION',
  'externalBetaEvidenceAdmissionBundleAccepted',
  'externalBetaWorkerDispatchSmokeProofAccepted',
  'internalBetaRuntimeSoakAccepted:\n      externalBetaEvidenceAdmissionBundleAccepted',
  'externalBetaQaAccepted:\n      externalBetaEvidenceAdmissionBundleAccepted',
  'externalBetaOwnerApprovalGranted:\n      externalBetaEvidenceAdmissionBundleAccepted',
  'externalBetaWorkerDispatchSmokeProofAccepted:\n      externalBetaWorkerDispatchSmokeProofAcceptedFromPacket',
  'gpuRuntimeOnDemandOnly: true',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--all-external-beta-evidence-passed',
  '--internal-beta-runtime-soak-accepted',
  '--external-beta-qa-accepted',
  '--external-beta-cost-concurrency-privacy-rollback-accepted',
  '--external-beta-incident-response-accepted',
  '--external-beta-owner-approval-granted',
  '--external-beta-evidence-packet',
  '--external-beta-evidence-admission-bundle',
  '--external-beta-worker-dispatch-smoke-proof',
  '--external-beta-worker-dispatch-smoke-proof-accepted',
  'evaluatorOnly: true',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}

if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.counts?.installedForPlannedSurface !== 21) fail('docs_installed_not_21')
if (docs.counts?.productionMappedTools !== 21) fail('docs_mapped_not_21')
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_targeted_not_8')
if (docs.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) fail('docs_gpu_cpu_fallback_count_not_0')
if (docs.counts?.defaultExternalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('docs_default_external_beta_ready_with_evidence_not_0')
}
if (docs.counts?.overrideFlagExternalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('docs_override_flag_external_beta_ready_with_evidence_not_0')
}
if (docs.counts?.admissionBundleExternalBetaReadyWithProvidedEvidenceTools !== 21) {
  fail('docs_admission_bundle_external_beta_ready_with_evidence_not_21')
}
if (docs.counts?.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence !== 21) {
  fail('docs_worker_dispatch_smoke_proof_accepted_tools_not_21')
}
if (docs.counts?.externalBetaReadyNowTools !== 0) fail('docs_external_beta_ready_now_not_0')
if (docs.counts?.externalBetaBlockedNowTools !== 21) fail('docs_external_beta_blocked_now_not_21')
if (docs.counts?.productionReadyNowTools !== 0) fail('docs_production_ready_now_not_0')
if (evidencePacketDocs.counts?.fullEvidenceRecordsAcceptedWithProvidedEvidence !== 21) {
  fail('evidence_packet_full_records_not_21')
}

for (const key of [
  'externalBetaReadinessGatePrepared',
  'sourceBetaReadinessGateAccepted',
  'sourceBetaToolCallReadinessAccepted',
  'sourceExternalBetaEvidenceAdmissionBundleAccepted',
  'sourceExternalBetaWorkerDispatchSmokeProofAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21ToolsInstalledForPlannedSurface',
  'all21ToolsMappedToProductionRegistry',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'externalBetaToolCallReadinessSeparated',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of [
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
]) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}

const defaultOutput = parseJsonOutput(runEvaluator(), 'external_beta_default')
if (defaultOutput.externalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('default_external_beta_ready_with_evidence_not_0')
}
if (defaultOutput.externalBetaReadyNowTools !== 0) fail('default_external_beta_ready_now_not_0')
if (defaultOutput.externalBetaBlockedNowTools !== 21) fail('default_external_beta_blocked_now_not_21')
if (defaultOutput.tools?.length !== 21) fail('default_tool_count_not_21')

const overrideFlagOutput = parseJsonOutput(runEvaluator([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--all-external-beta-evidence-passed',
]), 'external_beta_override_flag_evidence')
if (overrideFlagOutput.betaTestingReadyWithProvidedEvidenceTools !== 21) {
  fail('override_flag_beta_testing_ready_with_evidence_not_21')
}
if (overrideFlagOutput.externalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('override_flag_external_beta_ready_with_evidence_not_0')
}
if (overrideFlagOutput.externalBetaReadyNowTools !== 0) {
  fail('override_flag_external_beta_ready_now_not_0')
}
if (overrideFlagOutput.externalBetaBlockedNowTools !== 21) {
  fail('override_flag_external_beta_blocked_now_not_21')
}
if (overrideFlagOutput.productionReadyNowTools !== 0) {
  fail('override_flag_production_ready_now_not_0')
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-gate-'))
const betaEvidenceBundlePath = writeJson(
  path.join(tempRoot, 'accepted-beta-evidence-bundle.json'),
  acceptedBetaEvidenceBundleFixture(),
)
const fullEvidenceRecordsPath = path.join(tempRoot, 'full-external-beta-evidence-records.json')
const fullEvidencePacketPath = path.join(tempRoot, 'full-external-beta-evidence-packet.json')
fs.writeFileSync(
  fullEvidenceRecordsPath,
  `${JSON.stringify(allTools.map(acceptedExternalBetaEvidenceRecord), null, 2)}\n`,
  'utf8',
)
fs.writeFileSync(
  fullEvidencePacketPath,
  runNpm(evidencePacketScriptName, ['--evidence-records', fullEvidenceRecordsPath]),
  'utf8',
)
const admissionBundlePath = writeJson(
  path.join(tempRoot, 'external-beta-evidence-admission-bundle.json'),
  parseJsonOutput(runNpm(admissionBundleScriptName, [
    '--beta-evidence-bundle-packet',
    betaEvidenceBundlePath,
    '--external-beta-evidence-packet',
    fullEvidencePacketPath,
  ]), 'external_beta_evidence_admission_bundle'),
)
const workerDispatchReadinessPath = writeJson(
  path.join(tempRoot, 'worker-dispatch-readiness.json'),
  {
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
  },
)
const workerDispatchSmokePath = writeJson(
  path.join(tempRoot, 'worker-dispatch-smoke.json'),
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
  ]), 'external_beta_worker_dispatch_smoke'),
)
const workerDispatchSmokeProofPath = writeJson(
  path.join(tempRoot, 'worker-dispatch-smoke-proof.json'),
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
  ]), 'external_beta_worker_dispatch_smoke_proof'),
)
const packetFedOutput = parseJsonOutput(runEvaluator([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--external-beta-evidence-packet',
  fullEvidencePacketPath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
]), 'external_beta_packet_fed_evidence')
if (packetFedOutput.betaTestingReadyWithProvidedEvidenceTools !== 21) {
  fail('packet_fed_beta_testing_ready_with_evidence_not_21')
}
if (packetFedOutput.externalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('packet_fed_external_beta_ready_with_evidence_not_0')
}
if (packetFedOutput.externalBetaReadyNowTools !== 0) fail('packet_fed_external_beta_ready_now_not_0')
if (packetFedOutput.externalBetaBlockedNowTools !== 21) fail('packet_fed_external_beta_blocked_now_not_21')
if (packetFedOutput.productionReadyNowTools !== 0) fail('packet_fed_production_ready_now_not_0')
if (packetFedOutput.booleans?.sourceExternalBetaWorkerDispatchSmokeProofAccepted !== true) {
  fail('packet_fed_worker_dispatch_smoke_proof_not_accepted')
}
if (packetFedOutput.booleans?.sourceExternalBetaEvidenceAdmissionBundleAccepted !== false) {
  fail('packet_fed_admission_bundle_unexpectedly_accepted')
}

const admissionBundleFedOutput = parseJsonOutput(runEvaluator([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--external-beta-evidence-admission-bundle',
  admissionBundlePath,
  '--external-beta-worker-dispatch-smoke-proof',
  workerDispatchSmokeProofPath,
]), 'external_beta_admission_bundle_fed_evidence')
if (admissionBundleFedOutput.betaTestingReadyWithProvidedEvidenceTools !== 21) {
  fail('admission_bundle_fed_beta_testing_ready_with_evidence_not_21')
}
if (admissionBundleFedOutput.externalBetaReadyWithProvidedEvidenceTools !== 21) {
  fail('admission_bundle_fed_external_beta_ready_with_evidence_not_21')
}
if (admissionBundleFedOutput.externalBetaReadyNowTools !== 0) {
  fail('admission_bundle_fed_external_beta_ready_now_not_0')
}
if (admissionBundleFedOutput.externalBetaBlockedNowTools !== 21) {
  fail('admission_bundle_fed_external_beta_blocked_now_not_21')
}
if (admissionBundleFedOutput.productionReadyNowTools !== 0) {
  fail('admission_bundle_fed_production_ready_now_not_0')
}
if (admissionBundleFedOutput.booleans?.sourceExternalBetaEvidenceAdmissionBundleAccepted !== true) {
  fail('admission_bundle_fed_admission_bundle_not_accepted')
}
if (admissionBundleFedOutput.booleans?.sourceExternalBetaWorkerDispatchSmokeProofAccepted !== true) {
  fail('admission_bundle_fed_worker_dispatch_smoke_proof_not_accepted')
}

for (const output of [defaultOutput, overrideFlagOutput, packetFedOutput, admissionBundleFedOutput]) {
  for (const tool of allTools) {
    const row = output.tools?.find((entry) => entry.toolId === tool)
    if (!row) fail(`output_missing_tool:${tool}`)
    if (row?.externalBetaReadyNow !== false) fail(`tool_external_beta_ready_now_not_false:${tool}`)
    if (row?.productionReadyNow !== false) fail(`tool_production_ready_now_not_false:${tool}`)
  }
  for (const key of [
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
    'publicArtifactCreated',
    'signedUrlCreated',
  ]) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`output_required_false_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_external_beta_readiness_gate_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_external_beta_readiness_gate_decision')
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.md',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.md',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json',
  'server/tool-registry/ai-graphics-external-beta-readiness-gate.ts',
  'server/cli/ai-graphics-external-beta-readiness-gate.ts',
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
  gpuRuntimeTargetedTools: gpuTools.length,
  defaultExternalBetaReadyWithProvidedEvidenceTools:
    defaultOutput.externalBetaReadyWithProvidedEvidenceTools,
  overrideFlagExternalBetaReadyWithProvidedEvidenceTools:
    overrideFlagOutput.externalBetaReadyWithProvidedEvidenceTools,
  packetFedExternalBetaReadyWithProvidedEvidenceTools:
    packetFedOutput.externalBetaReadyWithProvidedEvidenceTools,
  admissionBundleFedExternalBetaReadyWithProvidedEvidenceTools:
    admissionBundleFedOutput.externalBetaReadyWithProvidedEvidenceTools,
  workerDispatchSmokeProofAccepted:
    admissionBundleFedOutput.booleans?.sourceExternalBetaWorkerDispatchSmokeProofAccepted,
  externalBetaReadyNowTools: admissionBundleFedOutput.externalBetaReadyNowTools,
  externalBetaBlockedNowTools: admissionBundleFedOutput.externalBetaBlockedNowTools,
  agentCanExecuteToolsNow: admissionBundleFedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: admissionBundleFedOutput.booleans?.runtimeReadyNow,
}, null, 2))
