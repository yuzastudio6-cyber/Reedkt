import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:beta-execution-handoff-readiness'
const runScriptCommand = 'tsx server/cli/ai-graphics-beta-execution-handoff-readiness.ts'
const diagnosticScriptName = 'ai-graphics:beta-execution-handoff-readiness:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-beta-execution-handoff-readiness-diagnostics.mjs'

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

const modelManifestTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const requiredProfiles = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
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
  sam2: ['torch', 'torchvision', 'numpy', 'PIL', 'cv2', 'hydra', 'iopath', 'sam2'],
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
  real_esrgan: ['torch', 'torchvision', 'numpy', 'PIL', 'cv2', 'basicsr', 'realesrgan'],
  rembg: ['torch', 'numpy', 'PIL', 'cv2', 'rembg'],
  transparent_background: ['torch', 'torchvision', 'numpy', 'PIL', 'transparent_background'],
}

const manifestToolsByProfile = {
  gpu_worker_ai_graphics: modelManifestTools,
  sam2: ['sam2'],
  birefnet: ['birefnet'],
  real_esrgan: ['real_esrgan'],
  rembg: ['rembg'],
  transparent_background: ['transparent_background'],
}

const templateIdByTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
}

const sourceCandidateIdByTool = {
  sam2: 'facebook_sam2_1_hiera_tiny_existing_staging_evidence',
  birefnet: 'zhengpeng7_birefnet_official_weights_review_candidate',
  real_esrgan: 'xinntao_real_esrgan_x4plus',
  rembg: 'danielgatis_rembg_isnet_general_use_review_candidate',
  transparent_background: 'plemeri_transparent_background_base_ckpt_review_candidate',
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
    sourceCandidateId: sourceCandidateIdByTool[toolId],
    privateArtifactRef: `reeditpro-private-artifact-ref-redacted-${toolId}`,
    checksumSha256: 'a'.repeat(64),
    sourceLicenseRef: `reviewed-private-license-record-${toolId}`,
    modelCardRef: `reviewed-private-model-card-${toolId}`,
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
    sourceCandidateId: sourceCandidateIdByTool[toolId],
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
    modelManifestChecks: manifestToolsByProfile[profile].map(manifestCheck),
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-beta-execution-handoff-'))
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
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  fs.writeFileSync(manifestPacketPath, `${JSON.stringify(manifestPacket, null, 2)}\n`, 'utf8')
  fs.writeFileSync(gpuPacketPath, `${JSON.stringify(gpuPacket, null, 2)}\n`, 'utf8')

  return { manifestPacketPath, gpuPacketPath }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-beta-execution-handoff-readiness.ts',
  'server/cli/ai-graphics-beta-execution-handoff-readiness.ts',
  'scripts/validation/ai-graphics-beta-execution-handoff-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/beta-execution-handoff-readiness.md',
  'docs/tool-intelligence/ai-graphics/beta-execution-handoff-readiness.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json',
  'docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/beta-execution-handoff-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-beta-execution-handoff-readiness.ts')
const workerSource = read('server/tool-registry/ai-graphics-worker-handoff-readiness.ts')
const cliSource = read('server/cli/ai-graphics-beta-execution-handoff-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/beta-execution-handoff-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-beta-execution-handoff-readiness'")) {
  fail('server_registry_index_does_not_export_beta_execution_handoff_readiness')
}
if (!workerSource.includes('asBetaReadinessEvidence')) fail('worker_handoff_does_not_map_input_to_beta_gate')
if (!workerSource.includes('buildAiGraphicsBetaReadinessGate(asBetaReadinessEvidence(evidence))')) {
  fail('worker_handoff_beta_gate_still_uses_default_evidence')
}
if (docs.decision !== 'ai_graphics_beta_execution_handoff_readiness_contract_prepared_with_fail_closed_runtime') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
for (const decision of [
  'ai_graphics_internal_beta_owner_approval_contract_prepared_with_fail_closed_defaults',
  'ai_graphics_tool_route_readiness_contract_prepared_with_execution_blocks',
  'ai_graphics_worker_handoff_readiness_contract_prepared_with_execution_blocks',
]) {
  if (!docs.sourceDecisions?.includes(decision)) fail(`docs_missing_source_decision:${decision}`)
}
for (const status of [
  'missing_technical_evidence',
  'awaiting_owner_approval',
  'owner_approved_beta_execution_handoff_ready',
]) {
  if (!docs.states?.includes(status)) fail(`docs_missing_status:${status}`)
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const token of [
  'routeWorkerHandoffCanConsumeOwnerApprovedEvidence',
  'ownerApprovedEvidenceReadyForRouteWorkerHandoff',
  'betaExecutionHandoffReadyWithProvidedEvidence',
  '--owner-approval-granted',
  '--owner-approval-ref',
  '--require-owner-approved-handoff-ready',
]) {
  if (!moduleSource.includes(token) && !cliSource.includes(token) && !JSON.stringify(docs).includes(token)) {
    fail(`source_missing:${token}`)
  }
}
if (docs.counts?.totalTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.counts?.defaultOwnerApprovedHandoffReadyTools !== 0) fail('docs_default_handoff_not_0')
if (docs.counts?.ownerApprovedHandoffReadyToolsWithProvidedEvidence !== 21) {
  fail('docs_owner_approved_handoff_tools_not_21')
}
if (docs.counts?.ownerApprovedHandoffReadyCapabilitiesWithProvidedEvidence !== 12) {
  fail('docs_owner_approved_handoff_capabilities_not_12')
}
if (docs.counts?.betaExecutionHandoffReadyNowTools !== 0) fail('docs_now_handoff_tools_not_0')
if (docs.handoffPolicy?.actualRouteExecutionUnlocked !== false) fail('docs_route_unlock_not_false')
if (docs.handoffPolicy?.actualWorkerExecutionUnlocked !== false) fail('docs_worker_unlock_not_false')
if (docs.handoffPolicy?.runtimeUnlockPerformed !== false) fail('docs_runtime_unlock_not_false')

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_handoff')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.sourceTechnicalEvidenceAccepted !== false) fail('default_technical_accepted_not_false')
if (defaultOutput.sourceOwnerApprovalAccepted !== false) fail('default_owner_approval_not_false')
if (defaultOutput.ownerApprovedEvidenceReadyForRouteWorkerHandoff !== false) {
  fail('default_handoff_ready_not_false')
}
if (defaultOutput.ownerApprovedHandoffReadyToolsWithProvidedEvidence !== 0) fail('default_handoff_tools_not_0')

const { manifestPacketPath, gpuPacketPath } = writePacketFixtures()
let awaitingExited = false
let awaitingOutputText = ''
try {
  awaitingOutputText = runNpm(runScriptName, [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    '--require-owner-approved-handoff-ready',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_owner_approval')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_owner_approval') fail(`awaiting_status:${awaitingOutput.status}`)
if (awaitingOutput.sourceTechnicalEvidenceAccepted !== true) fail('awaiting_technical_accepted_not_true')
if (awaitingOutput.sourceOwnerApprovalAccepted !== false) fail('awaiting_owner_approval_not_false')
if (awaitingOutput.ownerApprovedEvidenceReadyForRouteWorkerHandoff !== false) {
  fail('awaiting_handoff_ready_not_false')
}
if (!awaitingOutput.missingEvidenceBeforeHandoff?.includes('internal_beta_owner_approval_record')) {
  fail('awaiting_missing_owner_approval_record_gap')
}

const approvedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--require-owner-approved-handoff-ready',
]), 'approved_handoff')

if (approvedOutput.status !== 'owner_approved_beta_execution_handoff_ready') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.sourceTechnicalEvidenceAccepted !== true) fail('approved_technical_accepted_not_true')
if (approvedOutput.sourceOwnerApprovalAccepted !== true) fail('approved_owner_approval_not_true')
if (approvedOutput.ownerApprovedEvidenceReadyForRouteWorkerHandoff !== true) {
  fail('approved_handoff_ready_not_true')
}
if (approvedOutput.routeWorkerHandoffCanConsumeOwnerApprovedEvidence !== true) {
  fail('approved_route_worker_consume_not_true')
}
if (approvedOutput.ownerApprovedHandoffReadyToolsWithProvidedEvidence !== 21) {
  fail('approved_handoff_tools_not_21')
}
if (approvedOutput.ownerApprovedHandoffReadyCapabilitiesWithProvidedEvidence !== 12) {
  fail('approved_handoff_capabilities_not_12')
}
if (approvedOutput.betaExecutionHandoffReadyNowTools !== 0) fail('approved_now_tools_not_0')
if (approvedOutput.betaExecutionHandoffReadyNowCapabilities !== 0) fail('approved_now_capabilities_not_0')
if (approvedOutput.workerHandoffEvidenceInput?.nativeGpuRuntimeProofPassed !== true) {
  fail('approved_worker_evidence_gpu_not_true')
}
if (approvedOutput.workerHandoffEvidenceInput?.browserCanvasWebglSandboxPassed !== true) {
  fail('approved_worker_evidence_browser_not_true')
}
if (approvedOutput.workerHandoffEvidenceInput?.modelWeightManifestsApproved !== true) {
  fail('approved_worker_evidence_model_manifest_not_true')
}
if (!String(approvedOutput.workerHandoffEvidenceInput?.privateArtifactManifestRef ?? '').startsWith('private://')) {
  fail('approved_worker_evidence_private_manifest_ref_not_private_scheme')
}
if (!String(approvedOutput.workerHandoffEvidenceInput?.approvedPlanSnapshotId ?? '').startsWith('approved_snapshot_')) {
  fail('approved_worker_evidence_snapshot_ref_not_explicit_fixture')
}
if (!String(approvedOutput.workerHandoffEvidenceInput?.creditReservationId ?? '').startsWith('credit_reservation_')) {
  fail('approved_worker_evidence_credit_ref_not_explicit_fixture')
}

for (const output of [defaultOutput, awaitingOutput, approvedOutput]) {
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
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_beta_execution_handoff_readiness_contract_prepared_with_fail_closed_runtime')) {
  fail('scorecard_missing_beta_execution_handoff_readiness_decision')
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
const combinedText = [
  'docs/tool-intelligence/ai-graphics/beta-execution-handoff-readiness.md',
  'docs/tool-intelligence/ai-graphics/beta-execution-handoff-readiness.json',
  'server/tool-registry/ai-graphics-beta-execution-handoff-readiness.ts',
  'server/cli/ai-graphics-beta-execution-handoff-readiness.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')
for (const pattern of forbiddenTruePatterns) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /\.(png|jpe?g|webp|gif|mp4|mov|webm)$/i.test(file))) {
  fail('generated_media_staged')
}
if (git(['diff', '--name-only', '--', 'package-lock.json'])) fail('package_lock_changed')

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

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  defaultStatus: defaultOutput.status,
  awaitingStatus: awaitingOutput.status,
  approvedStatus: approvedOutput.status,
  toolsCovered: allTools.length,
  approvedHandoffReadyTools: approvedOutput.ownerApprovedHandoffReadyToolsWithProvidedEvidence,
  approvedHandoffReadyCapabilities: approvedOutput.ownerApprovedHandoffReadyCapabilitiesWithProvidedEvidence,
  betaExecutionHandoffReadyNowTools: approvedOutput.betaExecutionHandoffReadyNowTools,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
}, null, 2))
