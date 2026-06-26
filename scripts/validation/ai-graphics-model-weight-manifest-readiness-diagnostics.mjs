import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:model-weight-manifest-readiness:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-model-weight-manifest-readiness-diagnostics.mjs'

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

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const modelTemplateIds = [
  'sam2_checkpoint',
  'birefnet_model',
  'real_esrgan_model',
  'rembg_model',
  'transparent_background_model',
]

const expectedRuntimeTargetByModelWeightTool = {
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
}

const requiredManifestFields = [
  'manifestId',
  'toolId',
  'templateId',
  'privateArtifactRef',
  'checksumSha256',
  'sourceLicenseRef',
  'modelCardRef',
  'commercialUseReviewed',
  'redistributionReviewed',
  'qualityReviewed',
  'securityReviewed',
  'provenanceReviewed',
  'approvedForInternalBeta',
]

const errors = []

function fail(message) {
  errors.push(message)
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-model-weight-manifest-readiness.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-readiness-contract.md',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/worker-handoff-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'server/model-weights/model-weight-manifest-templates.ts',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const contract = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-readiness-contract.json')
const worker = json('docs/tool-intelligence/ai-graphics/worker-handoff-readiness-contract.json')
const betaGate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const gpuGate = json('docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const source = read('server/tool-registry/ai-graphics-model-weight-manifest-readiness.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-readiness-contract.md')
const templatesSource = read('server/model-weights/model-weight-manifest-templates.ts')
const runtimeProbe = read('docker/prod/ai-graphics-gpu-runtime-readiness.py')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-model-weight-manifest-readiness'")) {
  fail('server_registry_index_does_not_export_model_weight_manifest_readiness')
}

if (contract.decision !== 'ai_graphics_model_weight_manifest_readiness_contract_prepared_with_review_blocks') {
  fail(`unexpected_decision:${contract.decision}`)
}
if (contract.counts?.totalAiGraphicsTools !== 21) fail('total_ai_graphics_tools_not_21')
if (contract.counts?.gpuRuntimeTargetedTools !== 8) fail('gpu_runtime_targeted_tools_not_8')
if (contract.counts?.foundationGpuToolsWithoutModelManifest !== 3) fail('foundation_gpu_without_manifest_not_3')
if (contract.counts?.modelWeightManifestRequiredTools !== 5) fail('model_weight_required_tools_not_5')
if (contract.counts?.modelWeightTemplateIdsCovered !== 5) fail('model_weight_template_count_not_5')
if (contract.counts?.manifestRecordsProvided !== 0) fail('manifest_records_provided_not_zero')
if (contract.counts?.manifestRecordsApproved !== 0) fail('manifest_records_approved_not_zero')
if (contract.counts?.betaReadyModelWeightTools !== 0) fail('beta_ready_model_weight_tools_not_zero')
for (const key of [
  'validatesManifestContent',
  'rejectsMissingRequiredFields',
  'requiresExactToolIdAndTemplateId',
  'requiresSha256Digest',
  'rejectsHttpSignedOrPublicArtifactRefs',
  'rejectsExecutionCompletionClaims',
]) {
  if (contract.runtimeProbeManifestValidation?.[key] !== true) fail(`runtime_probe_validation_not_true:${key}`)
}
for (const key of ['modelWeightsLoaded', 'modelInferencePerformed']) {
  if (contract.runtimeProbeManifestValidation?.[key] !== false) fail(`runtime_probe_validation_not_false:${key}`)
}

if (worker.decision !== 'ai_graphics_worker_handoff_readiness_contract_prepared_with_execution_blocks') {
  fail('source_worker_handoff_decision_not_accepted')
}
if (betaGate.decision !== 'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks') {
  fail('source_beta_gate_decision_not_accepted')
}
if (gpuGate.runtimeReadinessScript?.modelWeightManifestCheckAvailable !== true) fail('gpu_runtime_gate_manifest_check_missing')
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('proper_install_count_not_21')

for (const needle of [
  'AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_READINESS_DECISION',
  'buildAiGraphicsModelWeightManifestReadinessContract',
  'listAiGraphicsModelWeightManifestRequirements',
  'AiGraphicsModelWeightManifestEvidenceRecord',
  'privateArtifactRef',
  'checksumSha256',
  'sourceLicenseRef',
  'modelCardRef',
  'approvedForInternalBeta',
  'manifestApprovedNow: false',
  'modelWeightsDownloaded: false',
  'modelWeightsLoaded: false',
  'modelInferencePerformed: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}

for (const tool of allTools) {
  if (!JSON.stringify(audit.toolRows || []).includes(`"toolId":"${tool}"`)) fail(`audit_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!contract.gpuRuntimeTargetedTools?.includes(tool)) fail(`gpu_tool_missing:${tool}`)
}
for (const tool of modelWeightTools) {
  if (!contract.modelWeightManifestRequiredTools?.includes(tool)) fail(`model_weight_tool_missing:${tool}`)
  if (!JSON.stringify(contract.requirements || []).includes(`"toolId":"${tool}"`)) fail(`requirement_missing_tool:${tool}`)
  if (!worker.modelWeightManifestRequiredTools?.includes(tool)) fail(`worker_missing_model_weight_tool:${tool}`)
  const requirement = (contract.requirements || []).find((entry) => entry.toolId === tool)
  if (requirement?.runtimeTarget !== expectedRuntimeTargetByModelWeightTool[tool]) {
    fail(`model_weight_runtime_target_mismatch:${tool}:${requirement?.runtimeTarget}`)
  }
}
for (const templateId of modelTemplateIds) {
  if (!contract.modelWeightTemplateIdsCovered?.includes(templateId)) fail(`contract_missing_template:${templateId}`)
  if (!templatesSource.includes(`id: '${templateId}'`)) fail(`template_source_missing:${templateId}`)
  if (!JSON.stringify(contract.requirements || []).includes(`"templateId":"${templateId}"`)) fail(`requirement_missing_template:${templateId}`)
}
for (const field of requiredManifestFields) {
  if (!contract.requiredManifestFields?.includes(field)) fail(`required_manifest_field_missing:${field}`)
  if (!source.includes(field)) fail(`source_missing_manifest_field:${field}`)
  if (!runtimeProbe.includes(field)) fail(`runtime_probe_missing_manifest_field:${field}`)
}
for (const field of [
  'No reviewed private model/checkpoint manifest records are approved in this lane.',
  'Generic model-weight readiness still reports 10 needs-review templates.',
  'Native linux/amd64 NVIDIA L4 runtime proof is still required before model load or inference.',
  'Tool Route, Worker, approved snapshot, credit reservation, private artifact, idempotency, and owner beta gates remain blocked.',
  'Model-weight download, model load, inference, media processing, signed URL creation, public artifact creation, beta, and production remain blocked.',
]) {
  if (!contract.globalBlockers?.includes(field)) fail(`global_blocker_missing:${field}`)
}

for (const key of [
  'modelWeightManifestReadinessContractPrepared',
  'sourceWorkerHandoffAccepted',
  'sourceBetaReadinessGateAccepted',
  'all5ModelWeightToolsCovered',
  'all5TemplateTypesCovered',
  'privateArtifactManifestRequired',
  'checksumRequired',
  'licenseReviewRequired',
  'provenanceReviewRequired',
  'qualityReviewRequired',
  'securityReviewRequired',
  'gpuRuntimeProofRequired',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]) {
  if (contract.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const key of [
  'modelWeightManifestsApprovedNow',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerCanQueueNow',
  'workerCanExecuteToolsNow',
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
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (contract.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

const combinedText = [markdown, JSON.stringify(contract), source].join('\n')
for (const token of [
  'REQUIRED_MODEL_MANIFEST_FIELDS',
  'MODEL_MANIFEST_TEMPLATE_IDS',
  'FORBIDDEN_MANIFEST_TRUE_FIELDS',
  'SHA256_PATTERN',
  'validate_model_manifest',
  'validate_private_artifact_ref',
  'blocked_model_manifest_validation_failed',
  'validated_not_loaded',
  'present_private_ref_not_logged',
  'privateArtifactRef must not be an HTTP(S) URL',
  'checksumSha256 must be a 64-character hex SHA-256 digest',
]) {
  if (!runtimeProbe.includes(token)) fail(`runtime_probe_missing:${token}`)
}
for (const pattern of [
  /modelWeightManifestsApprovedNow["`:= ]+true/i,
  /modelWeightsDownloaded["`:= ]+true/i,
  /modelWeightsLoaded["`:= ]+true/i,
  /modelInferencePerformed["`:= ]+true/i,
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
  /workerCanQueueNow["`:= ]+true/i,
  /workerCanExecuteToolsNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
  /providerRuntimeApprovedNow["`:= ]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeApprovedNow["`:= ]+true/i,
  /runtimeReadyNow["`:= ]+true/i,
  /internalBetaReadyNow["`:= ]+true/i,
  /externalBetaReadyNow["`:= ]+true/i,
  /productionReadyNow["`:= ]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
  /from_pretrained/i,
  /snapshot_download/i,
  /hf_hub_download/i,
  /torch\.load/i,
  /load_state_dict/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim_detected:${pattern}`)
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
if (git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])) fail('package_lock_changed')

const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of [...changedFiles, ...stagedFiles, ...trackedFiles]) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_committed_or_changed:${file}`)
}
for (const file of [...changedFiles, ...stagedFiles]) {
  if (/(^|\/)(dist|build|coverage|public\/generated|public\/artifacts|public-artifacts|render-outputs|rendered-output|browser-output|canvas-output|webgl-output)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_path_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) fail(`generated_media_or_font_changed:${file}`)
}

if (errors.length) {
  console.error('AI graphics model-weight manifest readiness diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: contract.decision,
  totalAiGraphicsTools: contract.counts.totalAiGraphicsTools,
  gpuRuntimeTargetedTools: contract.counts.gpuRuntimeTargetedTools,
  modelWeightManifestRequiredTools: contract.counts.modelWeightManifestRequiredTools,
  modelWeightTemplateIdsCovered: contract.counts.modelWeightTemplateIdsCovered,
  manifestRecordsProvided: contract.counts.manifestRecordsProvided,
  manifestRecordsApproved: contract.counts.manifestRecordsApproved,
  betaReadyModelWeightTools: contract.counts.betaReadyModelWeightTools,
}, null, 2))
