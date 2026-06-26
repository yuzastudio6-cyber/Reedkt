import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-owner-approval'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-owner-approval.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-owner-approval:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-internal-beta-owner-approval-diagnostics.mjs'

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
}

const manifestToolsByProfile = {
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-internal-beta-owner-approval-'))
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
  'server/tool-registry/ai-graphics-internal-beta-owner-approval.ts',
  'server/cli/ai-graphics-internal-beta-owner-approval.ts',
  'scripts/validation/ai-graphics-internal-beta-owner-approval-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json',
  'docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-owner-approval.json')
const evidenceDocs = json('docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json')
const toolCallDocs = json('docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-owner-approval.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-owner-approval.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-owner-approval.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-internal-beta-owner-approval'")) {
  fail('server_registry_index_does_not_export_internal_beta_owner_approval')
}
if (docs.decision !== 'ai_graphics_internal_beta_owner_approval_contract_prepared_with_fail_closed_defaults') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (evidenceDocs.decision !== 'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults') {
  fail('source_evidence_bundle_not_accepted')
}
if (toolCallDocs.decision !== 'ai_graphics_beta_tool_call_readiness_contract_prepared_with_fail_closed_defaults') {
  fail('source_beta_tool_call_not_accepted')
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const status of [
  'missing_technical_evidence',
  'awaiting_owner_approval',
  'owner_approved_all21_beta_evidence_ready',
]) {
  if (!docs.states?.includes(status)) fail(`docs_missing_status:${status}`)
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}
for (const token of [
  'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  'ownerApprovalRecordAccepted',
  'all21TechnicalEvidenceReadyBeforeOwnerApproval',
  'all21BetaEvidenceReadyAfterOwnerApproval',
  'betaToolCallReadinessAfterOwnerApproval',
  '--owner-approval-granted',
  '--owner-approval-ref',
  '--owner-approver-role',
  '--require-owner-approved-evidence',
]) {
  if (!moduleSource.includes(token) && !cliSource.includes(token) && !JSON.stringify(docs).includes(token)) {
    fail(`source_missing:${token}`)
  }
}
if (docs.counts?.totalTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.counts?.defaultBetaCallableWithOwnerApprovalTools !== 0) fail('docs_default_callable_not_0')
if (docs.counts?.technicalEvidenceReadyForOwnerGateTools !== 21) fail('docs_owner_gate_count_not_21')
if (docs.counts?.ownerApprovedBetaCallableTools !== 21) fail('docs_owner_approved_callable_not_21')
if (docs.counts?.betaToolCallableNowTools !== 0) fail('docs_now_callable_not_0')
if (docs.ownerApprovalPolicy?.runtimeUnlockPerformed !== false) fail('docs_runtime_unlock_not_false')
if (docs.ownerApprovalPolicy?.ownerApproverRole !== 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER') {
  fail('docs_owner_role_missing')
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_owner_approval')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.technicalEvidenceReadyForOwnerGate !== false) fail('default_technical_ready_not_false')
if (defaultOutput.ownerApprovalRecordAccepted !== false) fail('default_owner_approval_not_false')
if (defaultOutput.all21BetaEvidenceReadyAfterOwnerApproval !== false) fail('default_all21_after_approval_not_false')
if (defaultOutput.betaToolCallableWithOwnerApprovalTools !== 0) fail('default_callable_not_0')

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
    '--require-owner-approved-evidence',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_owner_approval')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_owner_approval') fail(`awaiting_status:${awaitingOutput.status}`)
if (awaitingOutput.technicalEvidenceReadyForOwnerGate !== true) fail('awaiting_technical_ready_not_true')
if (awaitingOutput.ownerApprovalRecordAccepted !== false) fail('awaiting_owner_approval_not_false')
if (awaitingOutput.all21BetaEvidenceReadyAfterOwnerApproval !== false) fail('awaiting_all21_after_approval_not_false')
if (!awaitingOutput.missingOwnerApprovalEvidence?.includes('internal_beta_owner_approval_record')) {
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
  '--require-owner-approved-evidence',
]), 'approved_owner_approval')

if (approvedOutput.status !== 'owner_approved_all21_beta_evidence_ready') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.technicalEvidenceReadyForOwnerGate !== true) fail('approved_technical_ready_not_true')
if (approvedOutput.ownerApprovalRecordAccepted !== true) fail('approved_owner_record_not_accepted')
if (approvedOutput.all21BetaEvidenceReadyAfterOwnerApproval !== true) fail('approved_all21_after_approval_not_true')
if (approvedOutput.betaToolCallableWithOwnerApprovalTools !== 21) fail('approved_callable_not_21')
if (approvedOutput.betaToolCallableNowTools !== 0) fail('approved_now_callable_not_0')
if (approvedOutput.betaToolCallReadinessAfterOwnerApproval?.betaToolCallableWithProvidedEvidenceTools !== 21) {
  fail('approved_nested_tool_call_not_21')
}
if (approvedOutput.betaToolCallReadinessAfterOwnerApproval?.betaToolCallableNowTools !== 0) {
  fail('approved_nested_now_callable_not_0')
}

const wrongRoleOutput = parseJsonOutput(runNpm(runScriptName, [
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
  '--owner-approver-role',
  'TRACK_B_MEDIA_OSS_STEWARD',
]), 'wrong_role_owner_approval')
if (wrongRoleOutput.ownerApprovalRecordAccepted !== false) fail('wrong_role_owner_approval_was_accepted')
if (!wrongRoleOutput.missingOwnerApprovalEvidence?.includes('owner_approver_role_must_be_AI_TOOLS_CREATIVE_GRAPHICS_OWNER')) {
  fail('wrong_role_missing_gap')
}

for (const output of [defaultOutput, awaitingOutput, approvedOutput, wrongRoleOutput]) {
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

if (!scorecard.includes('ai_graphics_internal_beta_owner_approval_contract_prepared_with_fail_closed_defaults')) {
  fail('scorecard_missing_internal_beta_owner_approval_decision')
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
  'docs/tool-intelligence/ai-graphics/internal-beta-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-owner-approval.json',
  'server/tool-registry/ai-graphics-internal-beta-owner-approval.ts',
  'server/cli/ai-graphics-internal-beta-owner-approval.ts',
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
  approvedBetaCallableTools: approvedOutput.betaToolCallableWithOwnerApprovalTools,
  betaToolCallableNowTools: approvedOutput.betaToolCallableNowTools,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
}, null, 2))
