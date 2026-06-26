import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const validateScriptName = 'ai-graphics:beta-evidence-bundle:validate'
const validateScriptCommand = 'tsx server/cli/ai-graphics-beta-evidence-bundle.ts'
const diagnosticScriptName = 'ai-graphics:beta-evidence-bundle:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-beta-evidence-bundle-diagnostics.mjs'

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

const modelManifestTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const browserRuntimeTools = [
  'echarts',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

const requiredProfiles = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
]

const requiredImportsByProfile = {
  gpu_worker_ai_graphics: [
    'torch',
    'torchvision',
    'transformers',
    'kornia',
    'rembg',
    'transparent_background',
    'realesrgan',
    'sam2',
  ],
  sam2: [
    'torch',
    'torchvision',
    'numpy',
    'PIL',
    'cv2',
    'hydra',
    'iopath',
    'sam2',
  ],
  birefnet: [
    'torch',
    'torchvision',
    'transformers',
    'safetensors',
    'PIL',
    'cv2',
    'numpy',
    'timm',
    'kornia',
    'einops',
    'scipy',
    'skimage',
  ],
  real_esrgan: [
    'torch',
    'torchvision',
    'numpy',
    'PIL',
    'cv2',
    'basicsr',
    'realesrgan',
  ],
}

const requiredManifestToolsByProfile = {
  gpu_worker_ai_graphics: modelManifestTools,
  sam2: ['sam2'],
  birefnet: ['birefnet'],
  real_esrgan: ['real_esrgan'],
}

const templateIdByTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
}

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

function manifestRecord(toolId) {
  return {
    manifestId: `${toolId}_private_manifest_review_v1`,
    toolId,
    templateId: templateIdByTool[toolId],
    privateArtifactRef: `reeditpro-private-artifact-ref-redacted-${toolId}`,
    checksumSha256: 'a'.repeat(64),
    sourceLicenseRef: `docs/tool-intelligence/ai-graphics/${toolId}-license-review.md`,
    modelCardRef: `docs/tool-intelligence/ai-graphics/${toolId}-model-card-review.md`,
    commercialUseReviewed: true,
    redistributionReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    provenanceReviewed: true,
    approvedForInternalBeta: true,
  }
}

function manifestCheck(toolId) {
  return {
    toolId,
    manifestId: `${toolId}_private_manifest_review_v1`,
    templateId: templateIdByTool[toolId],
    privateArtifactRefStatus: 'present_private_ref_not_logged',
    checksumSha256: 'b'.repeat(64),
    status: 'validated_not_loaded',
  }
}

function proofResult(profile) {
  return {
    status: 'passed',
    profile,
    proofMetadata: {
      probeName: 'reeditpro_ai_graphics_gpu_runtime_readiness',
      probeVersion: '2026-06-26.native-gpu-proof-v1',
      runtimePlatform: 'linux',
      runtimeMachine: 'x86_64',
      pythonVersion: '3.11.0',
      nativeGpuRuntimeProof: true,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      providerRuntimePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    imports: requiredImportsByProfile[profile].map((label) => ({
      label,
      module: label,
      version: 'fixture',
    })),
    nvidiaSmi: {
      available: true,
      returncode: 0,
      stdout: 'NVIDIA L4, 550.54.15, 23034 MiB',
      stderr: '',
    },
    cuda: {
      available: true,
      deviceCount: 1,
      deviceName: 'NVIDIA L4',
      capability: '8.9',
      minCapabilityRequired: '8.9',
      tinyTensorProbePassed: true,
    },
    modelManifestChecks: requiredManifestToolsByProfile[profile].map(manifestCheck),
    modelWeightsLoaded: false,
    mediaProcessed: false,
    providerRuntimeUsed: false,
    toolRouteExecutionReadyNow: false,
    workerExecutionReadyNow: false,
    runtimeBetaReadyNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

function writePacketFixtures() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-beta-evidence-bundle-'))
  const manifestDir = path.join(root, 'manifests')
  const proofDir = path.join(root, 'proof-results')
  fs.mkdirSync(manifestDir)
  fs.mkdirSync(proofDir)

  for (const toolId of modelManifestTools) {
    fs.writeFileSync(
      path.join(manifestDir, `${toolId}.json`),
      `${JSON.stringify(manifestRecord(toolId), null, 2)}\n`,
      'utf8',
    )
  }
  for (const profile of requiredProfiles) {
    fs.writeFileSync(
      path.join(proofDir, `${profile}.json`),
      `${JSON.stringify(proofResult(profile), null, 2)}\n`,
      'utf8',
    )
  }

  const manifestPacket = parseJsonOutput(
    runNpm('ai-graphics:model-weight-manifest-review:validate', ['--manifest-dir', manifestDir]),
    'manifest_packet_fixture',
  )
  const gpuPacket = parseJsonOutput(
    runNpm('ai-graphics:gpu-runtime-proof-result:validate', ['--result-dir', proofDir]),
    'gpu_packet_fixture',
  )
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const countOnlyManifestPacketPath = path.join(root, 'count-only-model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  const countOnlyGpuPacketPath = path.join(root, 'count-only-gpu-runtime-proof-result-packet.json')
  fs.writeFileSync(manifestPacketPath, `${JSON.stringify(manifestPacket, null, 2)}\n`, 'utf8')
  fs.writeFileSync(countOnlyManifestPacketPath, `${JSON.stringify({
    decision: 'ai_graphics_model_weight_manifest_review_packet_prepared_with_no_private_records',
    sourceManifestReadinessDecision:
      'ai_graphics_model_weight_manifest_readiness_contract_prepared_with_review_blocks',
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
  fs.writeFileSync(gpuPacketPath, `${JSON.stringify(gpuPacket, null, 2)}\n`, 'utf8')
  fs.writeFileSync(countOnlyGpuPacketPath, `${JSON.stringify({
    decision: 'ai_graphics_gpu_runtime_proof_result_packet_prepared_with_no_runtime_results',
    status: 'ready_for_owner_review_not_beta_ready',
    runtimeProofResultsProvided: 4,
    runtimeProofResultsAcceptedForOwnerReview: 4,
    nativeGpuRuntimeProofResultsAccepted: true,
    booleans: {
      nativeGpuRuntimeProofResultsAcceptedForOwnerReview: true,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
    },
  }, null, 2)}\n`, 'utf8')

  return { manifestPacketPath, countOnlyManifestPacketPath, gpuPacketPath, countOnlyGpuPacketPath }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-beta-evidence-bundle.ts',
  'server/cli/ai-graphics-beta-evidence-bundle.ts',
  'scripts/validation/ai-graphics-beta-evidence-bundle-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/beta-evidence-bundle.md',
  'docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json',
  'docs/prompt-ai-graphics-beta-evidence-bundle-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-beta-evidence-bundle.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const betaGate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const manifestPacket = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json')
const gpuPacket = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json')
const moduleSource = read('server/tool-registry/ai-graphics-beta-evidence-bundle.ts')
const cliSource = read('server/cli/ai-graphics-beta-evidence-bundle.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/beta-evidence-bundle.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[validateScriptName] !== validateScriptCommand) fail(`missing_package_script:${validateScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-beta-evidence-bundle'")) {
  fail('server_registry_index_does_not_export_beta_evidence_bundle')
}

if (docs.decision !== 'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('audit_install_ready_count_not_21')
if (audit.counts?.gpuDockerInstallProofTools !== 8) fail('audit_gpu_install_target_count_not_8')
if (audit.counts?.nodeLockfileTools !== 13) fail('audit_node_lockfile_count_not_13')
if (betaGate.counts?.installReadyTools !== 21) fail('beta_gate_install_ready_count_not_21')
if (manifestPacket.counts?.manifestRecordsProvided !== 0) fail('public_manifest_packet_should_not_contain_private_records')
if (gpuPacket.status !== 'missing_native_gpu_runtime_proof_results') fail('public_gpu_packet_should_not_contain_runtime_results')

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuWorkerInstallTargetTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const tool of browserRuntimeTools) {
  if (!moduleSource.includes('browser_canvas_webgl_sandbox_proof')) fail(`module_missing_browser_sandbox_evidence_for:${tool}`)
}
for (const token of [
  'modelWeightManifestReviewPacketAccepted',
  'nativeGpuRuntimeProofResultPacketAccepted',
  'buildAiGraphicsBetaReadinessGate',
  'nodeRuntimeProofPacketAccepted',
  'browserRuntimeProofPacketAccepted',
  'satoriFontRuntimeProofPacketAccepted',
  'jsRuntimeProofsAccepted',
  'all21BetaEvidenceReady',
  'evidenceOverrideFlagsIgnoredForBetaReadiness',
  '--use-committed-js-runtime-proofs',
  '--node-runtime-proof-packet',
  '--browser-runtime-proof-packet',
  '--satori-font-runtime-proof-packet',
  '--model-weight-manifest-review-packet',
  '--gpu-runtime-proof-result-packet',
  '--require-all-21-beta-ready',
  'listAiGraphicsModelWeightManifestRequiredTools',
  'listAiGraphicsGpuRuntimeProofRequiredProfiles',
  'validationResults',
  'present_private_ref_not_logged',
  'ready_for_owner_review_not_beta_ready',
]) {
  if (!moduleSource.includes(token) && !cliSource.includes(token)) fail(`source_missing:${token}`)
}

for (const token of [
  'js_node_runtime_proof_packet',
  'js_browser_runtime_proof_packet',
  'satori_font_runtime_proof_packet',
  'complete_js_runtime_proof_bundle',
  'approved_plan_snapshot_gate',
  'credit_reservation_gate',
  'artifact_boundary_gate',
  'tool_route_gate',
  'worker_gate',
  'browser_canvas_webgl_sandbox_proof',
  'native_gpu_runtime_proof_packet',
  'model_weight_manifest_review_packet',
  'internal_beta_owner_approval',
]) {
  if (!docs.requiredEvidence?.includes(token)) fail(`docs_missing_required_evidence:${token}`)
}

if (docs.counts?.totalTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.installReadyForPlannedSurfaceTools !== 21) fail('docs_install_ready_not_21')
if (docs.counts?.defaultBetaTestingReadyTools !== 0) fail('docs_default_ready_not_0')
if (docs.counts?.defaultBlockedTools !== 21) fail('docs_default_blocked_not_21')
if (docs.counts?.fullTechnicalEvidenceReadyForOwnerGateTools !== 21) {
  fail('docs_full_technical_owner_gate_not_21')
}
if (docs.counts?.fullEvidenceBetaTestingReadyTools !== 21) fail('docs_full_ready_not_21')
if (docs.counts?.fullEvidenceBlockedTools !== 0) fail('docs_full_blocked_not_0')
if (docs.ownerApprovalGate !== 'internal_beta_owner_approval') fail('docs_owner_gate_missing')
if (!docs.requiredTechnicalEvidenceBeforeOwnerApproval?.includes('native_gpu_runtime_proof_packet')) {
  fail('docs_required_technical_evidence_missing_gpu_packet')
}
if (docs.requiredTechnicalEvidenceBeforeOwnerApproval?.includes('internal_beta_owner_approval')) {
  fail('docs_technical_evidence_should_not_include_owner_approval')
}
if (docs.modelWeightManifestReviewPacketPolicy?.perToolValidationResultsRequired !== true) {
  fail('docs_model_weight_per_tool_validation_results_not_required')
}
if (docs.modelWeightManifestReviewPacketPolicy?.countOnlyPacketsRejected !== true) {
  fail('docs_model_weight_count_only_packets_not_rejected')
}
for (const tool of modelManifestTools) {
  if (!docs.modelWeightManifestReviewPacketPolicy?.requiredValidationResultTools?.includes(tool)) {
    fail(`docs_model_weight_policy_missing_tool:${tool}`)
  }
}
if (!markdown.includes('Count-only packets are rejected')) {
  fail('markdown_missing_count_only_packet_rejection')
}
if (!scorecard.includes('rejects count-only model-weight manifest packets')) {
  fail('scorecard_missing_count_only_model_weight_packet_rejection')
}
if (docs.nativeGpuRuntimeProofResultPacketPolicy?.perProfileValidationResultsRequired !== true) {
  fail('docs_gpu_per_profile_validation_results_not_required')
}
if (docs.nativeGpuRuntimeProofResultPacketPolicy?.countOnlyPacketsRejected !== true) {
  fail('docs_gpu_count_only_packets_not_rejected')
}
for (const profile of requiredProfiles) {
  if (!docs.nativeGpuRuntimeProofResultPacketPolicy?.requiredValidationResultProfiles?.includes(profile)) {
    fail(`docs_gpu_policy_missing_profile:${profile}`)
  }
}
if (!markdown.includes('Count-only GPU proof packets are rejected')) {
  fail('markdown_missing_count_only_gpu_packet_rejection')
}
if (!scorecard.includes('rejects count-only native GPU proof packets')) {
  fail('scorecard_missing_count_only_gpu_packet_rejection')
}

const defaultBundle = parseJsonOutput(runNpm(validateScriptName), 'default_bundle')
if (defaultBundle.betaTestingReadyTools !== 0) fail('default_bundle_ready_not_0')
if (defaultBundle.blockedTools !== 21) fail('default_bundle_blocked_not_21')
if (defaultBundle.all21BetaEvidenceReady !== false) fail('default_bundle_all21_not_false')
for (const tool of allTools) {
  const row = defaultBundle.tools?.find((entry) => entry.toolId === tool)
  if (!row) fail(`default_bundle_missing_tool:${tool}`)
  if (row?.installReadyForPlannedSurface !== true) fail(`default_bundle_tool_not_install_ready:${tool}`)
  if (row?.productionMapped !== true) fail(`default_bundle_tool_not_mapped:${tool}`)
  if (row?.planningSelectable !== true) fail(`default_bundle_tool_not_planning_selectable:${tool}`)
  if (row?.betaTestingReadyNow !== false) fail(`default_bundle_tool_unexpected_ready:${tool}`)
}

let fullFlagExited = false
let fullFlagOutput = ''
try {
  fullFlagOutput = runNpm(validateScriptName, [
    '--all-shared-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--native-gpu-runtime-proof-passed',
    '--model-weight-manifests-approved',
    '--require-all-21-beta-ready',
  ])
} catch (error) {
  fullFlagExited = true
  fullFlagOutput = `${error.stdout || ''}${error.stderr || ''}`
}
const fullFlagBundle = parseJsonOutput(fullFlagOutput, 'full_flag_bundle')
if (!fullFlagExited) fail('full_flag_bundle_with_ignored_overrides_did_not_exit_nonzero')
if (fullFlagBundle.betaTestingReadyTools !== 13) fail('full_flag_bundle_ready_not_13_with_ignored_overrides')
if (fullFlagBundle.blockedTools !== 8) fail('full_flag_bundle_blocked_not_8_with_ignored_overrides')
if (fullFlagBundle.all21BetaEvidenceReady !== false) fail('full_flag_bundle_all21_not_false_with_ignored_overrides')
if (fullFlagBundle.evidenceSources?.jsRuntimeProofsAccepted !== false) fail('full_flag_bundle_js_proofs_unexpectedly_accepted')
if (fullFlagBundle.evidenceSources?.modelWeightManifestReviewPacketAccepted !== false) fail('full_flag_bundle_model_packet_unexpectedly_accepted')
if (fullFlagBundle.evidenceSources?.nativeGpuRuntimeProofResultPacketAccepted !== false) fail('full_flag_bundle_gpu_packet_unexpectedly_accepted')
if (fullFlagBundle.input?.evidenceOverrideFlagsIgnoredForBetaReadiness !== true) {
  fail('full_flag_bundle_override_flags_not_marked_ignored')
}
for (const token of [
  'js_node_runtime_proof_packet',
  'js_browser_runtime_proof_packet',
  'satori_font_runtime_proof_packet',
  'complete_js_runtime_proof_bundle',
  'native_gpu_runtime_proof_packet',
  'model_weight_manifest_review_packet',
]) {
  if (!fullFlagBundle.missingEvidence?.includes(token)) fail(`full_flag_bundle_missing_gap:${token}`)
}

let jsProofOverrideExited = false
let jsProofOverrideOutput = ''
try {
  jsProofOverrideOutput = runNpm(validateScriptName, [
    '--use-committed-js-runtime-proofs',
    '--all-shared-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--native-gpu-runtime-proof-passed',
    '--model-weight-manifests-approved',
    '--require-all-21-beta-ready',
  ])
} catch (error) {
  jsProofOverrideExited = true
  jsProofOverrideOutput = `${error.stdout || ''}${error.stderr || ''}`
}
const jsProofOverrideBundle = parseJsonOutput(jsProofOverrideOutput, 'js_proof_override_bundle')
if (!jsProofOverrideExited) fail('js_proof_override_bundle_did_not_exit_nonzero')
if (jsProofOverrideBundle.betaTestingReadyTools !== 13) fail('js_proof_override_bundle_ready_not_13')
if (jsProofOverrideBundle.blockedTools !== 8) fail('js_proof_override_bundle_blocked_not_8')
if (jsProofOverrideBundle.all21BetaEvidenceReady !== false) fail('js_proof_override_bundle_all21_not_false')
if (jsProofOverrideBundle.evidenceSources?.jsRuntimeProofsAccepted !== true) fail('js_proof_override_bundle_js_proofs_not_accepted')
if (jsProofOverrideBundle.evidenceSources?.modelWeightManifestReviewPacketAccepted !== false) {
  fail('js_proof_override_bundle_model_packet_unexpectedly_accepted')
}
if (jsProofOverrideBundle.evidenceSources?.nativeGpuRuntimeProofResultPacketAccepted !== false) {
  fail('js_proof_override_bundle_gpu_packet_unexpectedly_accepted')
}
if (jsProofOverrideBundle.input?.evidenceOverrideFlagsIgnoredForBetaReadiness !== true) {
  fail('js_proof_override_bundle_override_flags_not_marked_ignored')
}
for (const token of [
  'native_gpu_runtime_proof_packet',
  'model_weight_manifest_review_packet',
]) {
  if (!jsProofOverrideBundle.missingEvidence?.includes(token)) fail(`js_proof_override_bundle_missing_gap:${token}`)
}

const {
  manifestPacketPath,
  countOnlyManifestPacketPath,
  gpuPacketPath,
  countOnlyGpuPacketPath,
} = writePacketFixtures()
const technicalPacketBundle = parseJsonOutput(runNpm(validateScriptName, [
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--require-ready-for-owner-gate',
]), 'technical_packet_bundle')
if (technicalPacketBundle.betaTestingReadyTools !== 0) fail('technical_packet_bundle_ready_should_still_be_0')
if (technicalPacketBundle.blockedTools !== 21) fail('technical_packet_bundle_blocked_should_still_be_21')
if (technicalPacketBundle.all21BetaEvidenceReady !== false) fail('technical_packet_bundle_all21_beta_should_be_false')
if (technicalPacketBundle.all21TechnicalEvidenceReadyBeforeOwnerApproval !== true) {
  fail('technical_packet_bundle_owner_gate_not_true')
}
if (technicalPacketBundle.booleans?.readyForInternalBetaOwnerGate !== true) {
  fail('technical_packet_bundle_ready_for_owner_gate_boolean_not_true')
}
if (!technicalPacketBundle.missingEvidence?.includes('internal_beta_owner_approval')) {
  fail('technical_packet_bundle_missing_owner_approval_gap')
}
if (technicalPacketBundle.missingTechnicalEvidenceBeforeOwnerApproval?.length !== 0) {
  fail('technical_packet_bundle_has_missing_technical_evidence')
}

const fullPacketBundle = parseJsonOutput(runNpm(validateScriptName, [
  '--use-committed-js-runtime-proofs',
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--require-all-21-beta-ready',
]), 'full_packet_bundle')
if (fullPacketBundle.betaTestingReadyTools !== 21) fail('full_packet_bundle_ready_not_21')
if (fullPacketBundle.all21BetaEvidenceReady !== true) fail('full_packet_bundle_all21_not_true')
if (fullPacketBundle.all21TechnicalEvidenceReadyBeforeOwnerApproval !== true) {
  fail('full_packet_bundle_owner_gate_not_true')
}
if (fullPacketBundle.evidenceSources?.jsRuntimeProofsAccepted !== true) fail('full_packet_bundle_js_proofs_not_accepted')
if (fullPacketBundle.evidenceSources?.nodeRuntimeProofPacketAccepted !== true) fail('full_packet_bundle_node_proof_not_accepted')
if (fullPacketBundle.evidenceSources?.browserRuntimeProofPacketAccepted !== true) fail('full_packet_bundle_browser_proof_not_accepted')
if (fullPacketBundle.evidenceSources?.satoriFontRuntimeProofPacketAccepted !== true) fail('full_packet_bundle_satori_proof_not_accepted')
if (fullPacketBundle.evidenceSources?.modelWeightManifestReviewPacketProvided !== true) fail('full_packet_bundle_model_packet_not_provided')
if (fullPacketBundle.evidenceSources?.nativeGpuRuntimeProofResultPacketProvided !== true) fail('full_packet_bundle_gpu_packet_not_provided')
if (fullPacketBundle.evidenceSources?.modelWeightManifestReviewPacketAccepted !== true) fail('full_packet_bundle_model_packet_not_accepted')
if (fullPacketBundle.evidenceSources?.nativeGpuRuntimeProofResultPacketAccepted !== true) fail('full_packet_bundle_gpu_packet_not_accepted')

let countOnlyExited = false
let countOnlyOutput = ''
try {
  countOnlyOutput = runNpm(validateScriptName, [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    countOnlyManifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    '--require-ready-for-owner-gate',
  ])
} catch (error) {
  countOnlyExited = true
  countOnlyOutput = `${error.stdout || ''}${error.stderr || ''}`
}
const countOnlyBundle = parseJsonOutput(countOnlyOutput, 'count_only_manifest_bundle')
if (!countOnlyExited) fail('count_only_manifest_bundle_did_not_exit_nonzero')
if (countOnlyBundle.evidenceSources?.modelWeightManifestReviewPacketAccepted !== false) {
  fail('count_only_manifest_packet_unexpectedly_accepted')
}
if (!countOnlyBundle.missingEvidence?.includes('model_weight_manifest_review_packet')) {
  fail('count_only_manifest_bundle_missing_manifest_gap')
}

let countOnlyGpuExited = false
let countOnlyGpuOutput = ''
try {
  countOnlyGpuOutput = runNpm(validateScriptName, [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    countOnlyGpuPacketPath,
    '--require-ready-for-owner-gate',
  ])
} catch (error) {
  countOnlyGpuExited = true
  countOnlyGpuOutput = `${error.stdout || ''}${error.stderr || ''}`
}
const countOnlyGpuBundle = parseJsonOutput(countOnlyGpuOutput, 'count_only_gpu_bundle')
if (!countOnlyGpuExited) fail('count_only_gpu_bundle_did_not_exit_nonzero')
if (countOnlyGpuBundle.evidenceSources?.nativeGpuRuntimeProofResultPacketAccepted !== false) {
  fail('count_only_gpu_packet_unexpectedly_accepted')
}
if (!countOnlyGpuBundle.missingEvidence?.includes('native_gpu_runtime_proof_packet')) {
  fail('count_only_gpu_bundle_missing_gpu_gap')
}

let partialExited = false
try {
  runNpm(validateScriptName, [
    '--all-shared-gates-passed',
    '--require-all-21-beta-ready',
  ])
} catch {
  partialExited = true
}
if (!partialExited) fail('require_all21_did_not_exit_nonzero_when_evidence_missing')

for (const output of [
  defaultBundle,
  fullFlagBundle,
  jsProofOverrideBundle,
  technicalPacketBundle,
  fullPacketBundle,
  countOnlyBundle,
  countOnlyGpuBundle,
]) {
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
      fail(`runtime_false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults')) {
  fail('scorecard_missing_beta_evidence_bundle_decision')
}

const forbiddenTruePatterns = [
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
  /modelWeightsDownloaded["`:\s]+true/i,
  /modelWeightsLoaded["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
for (const [label, text] of [
  ['module', moduleSource],
  ['cli', cliSource],
  ['markdown', markdown],
  ['docs_json', JSON.stringify(docs)],
]) {
  for (const pattern of forbiddenTruePatterns) {
    if (pattern.test(text)) fail(`forbidden_runtime_claim:${label}:${pattern}`)
  }
}

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch (error) {
  fail(`base_package_read_failed:${error.message}`)
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}
if (git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])) fail('package_lock_changed_from_base')
if (git(['diff', '--name-only', '--', 'package-lock.json'])) fail('package_lock_changed')

const changedFiles = git(['diff', '--name-only']).split('\n').filter(Boolean)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of [...changedFiles, ...stagedFiles, ...trackedFiles]) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_committed_or_changed:${file}`)
}
for (const file of [...changedFiles, ...stagedFiles]) {
  if (/(^|\/)(dist|build|coverage|public\/generated|public\/artifacts|public-artifacts|render-outputs|rendered-output|browser-output|canvas-output|webgl-output)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_path_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) {
    fail(`generated_media_or_font_changed:${file}`)
  }
}

if (failures.length) {
  console.error('AI graphics beta evidence bundle diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  toolsCovered: docs.counts.totalTools,
  installReadyForPlannedSurfaceTools: docs.counts.installReadyForPlannedSurfaceTools,
  defaultBetaTestingReadyTools: defaultBundle.betaTestingReadyTools,
  fullEvidenceBetaTestingReadyTools: fullPacketBundle.betaTestingReadyTools,
  all21BetaEvidenceReady: fullPacketBundle.all21BetaEvidenceReady,
  agentCanExecuteToolsNow: fullPacketBundle.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: fullPacketBundle.booleans.runtimeReadyNow,
  packageLockChanged: false,
}, null, 2))
