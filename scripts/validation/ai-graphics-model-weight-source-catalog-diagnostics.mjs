import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:model-weight-source-catalog:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-model-weight-source-catalog-diagnostics.mjs'

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

const foundationTools = ['torch_torchvision', 'transformers', 'kornia']
const sourceTools = ['sam2', 'birefnet', 'real_esrgan', 'rembg', 'transparent_background']

const expectedCandidates = {
  sam2: 'facebook_sam2_1_hiera_tiny_existing_staging_evidence',
  birefnet: 'zhengpeng7_birefnet_official_weights_review_candidate',
  real_esrgan: 'xinntao_real_esrgan_x4plus',
  rembg: 'danielgatis_rembg_model_menu_selection_required',
  transparent_background: 'plemeri_transparent_background_inspyrenet_review_candidate',
}

const expectedStatuses = {
  sam2: 'internal_evidence_verified_private_manifest_required',
  birefnet: 'internal_evidence_verified_private_manifest_required',
  real_esrgan: 'internal_evidence_verified_private_manifest_required',
  rembg: 'source_menu_identified_selection_required',
  transparent_background: 'source_identified_review_required',
}

const manifestReadyTools = ['sam2', 'birefnet', 'real_esrgan']
const manifestBlockedTools = ['rembg', 'transparent_background']

const expectedUrls = {
  sam2: 'https://github.com/facebookresearch/sam2',
  birefnet: 'https://huggingface.co/ZhengPeng7/BiRefNet',
  real_esrgan: 'https://github.com/xinntao/Real-ESRGAN',
  rembg: 'https://github.com/danielgatis/rembg',
  transparent_background: 'https://github.com/plemeri/transparent-background',
}

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
  'server/tool-registry/ai-graphics-model-weight-source-catalog.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-source-catalog.md',
  'docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json',
  'docs/tool-intelligence/ai-graphics/beta-activation-gap-report.json',
  'server/activation/sam2-runtime/sam2-runtime-policy.ts',
  'server/activation/sam2-runtime/approved-sam2-runtime-evidence.ts',
  'server/activation/enhancement-model-approval/enhancement-model-candidate-registry.ts',
  'server/activation/enhancement-model-approval/enhancement-model-license-evidence.ts',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const catalog = json('docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json')
const manifest = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-readiness-contract.json')
const manifestReview = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json')
const gpuCommandPlan = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json')
const gapReport = json('docs/tool-intelligence/ai-graphics/beta-activation-gap-report.json')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-source-catalog.md')
const source = read('server/tool-registry/ai-graphics-model-weight-source-catalog.ts')
const index = read('server/tool-registry/index.ts')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-model-weight-source-catalog'")) fail('server_index_missing_source_catalog_export')

if (catalog.decision !== 'ai_graphics_model_weight_source_catalog_prepared_with_review_blocks') fail(`unexpected_decision:${catalog.decision}`)
if (catalog.counts?.totalAiGraphicsTools !== 21) fail('total_tools_not_21')
if (catalog.counts?.gpuRuntimeTargetedTools !== 8) fail('gpu_tool_count_not_8')
if (catalog.counts?.foundationGpuToolsWithoutStandaloneManifest !== 3) fail('foundation_gpu_tool_count_not_3')
if (catalog.counts?.modelWeightSourceCatalogTools !== 5) fail('source_catalog_tool_count_not_5')
if (catalog.counts?.sourceCandidatesCovered !== 5) fail('source_candidate_count_not_5')
if (catalog.counts?.internalEvidenceBackedCandidates !== 3) fail('internal_evidence_candidate_count_not_3')
if (catalog.counts?.sourceIdentifiedReviewRequiredCandidates !== 1) fail('source_identified_review_candidate_count_not_1')
if (catalog.counts?.sourceMenuSelectionRequiredCandidates !== 1) fail('source_menu_selection_candidate_count_not_1')
if (catalog.counts?.readyForPrivateManifestAuthoringFromExistingEvidence !== 3) {
  fail('private_manifest_authoring_ready_count_not_3')
}
if (catalog.counts?.blockedPendingSourceSelectionOrReview !== 2) fail('private_manifest_source_block_count_not_2')
if (catalog.counts?.privateManifestsApprovedNow !== 0) fail('private_manifests_approved_not_zero')
if (catalog.counts?.betaReadyModelWeightTools !== 0) fail('beta_ready_model_weight_tools_not_zero')

for (const tool of gpuTools) {
  if (!catalog.gpuRuntimeTargetedTools?.includes(tool)) fail(`gpu_tool_missing:${tool}`)
}
for (const tool of foundationTools) {
  const entry = (catalog.foundationGpuToolsWithoutStandaloneManifest || []).find((candidate) => candidate.toolId === tool)
  if (!entry) fail(`foundation_tool_missing:${tool}`)
  if (entry?.standaloneModelWeightManifestRequired !== false) fail(`foundation_tool_manifest_required_not_false:${tool}`)
  if (entry?.runtimeTarget !== 'native_linux_amd64_nvidia_l4_gpu_worker') fail(`foundation_tool_runtime_target_wrong:${tool}`)
}
for (const tool of sourceTools) {
  if (!catalog.modelWeightSourceCatalogTools?.includes(tool)) fail(`source_tool_missing:${tool}`)
  const candidate = (catalog.sourceCandidates || []).find((entry) => entry.toolId === tool)
  if (!candidate) {
    fail(`candidate_missing:${tool}`)
    continue
  }
  if (candidate.candidateId !== expectedCandidates[tool]) fail(`candidate_id_mismatch:${tool}:${candidate.candidateId}`)
  if (candidate.candidateStatus !== expectedStatuses[tool]) fail(`candidate_status_mismatch:${tool}:${candidate.candidateStatus}`)
  if (candidate.upstreamSourceUrl !== expectedUrls[tool]) fail(`candidate_url_mismatch:${tool}:${candidate.upstreamSourceUrl}`)
  if (candidate.privateManifestStatus !== 'missing_reviewed_private_artifact_ref_namespace') fail(`private_manifest_status_wrong:${tool}`)
  for (const key of [
    'approvedForInternalBetaNow',
    'modelWeightsDownloaded',
    'modelWeightsLoaded',
    'modelInferencePerformed',
    'gpuRuntimeApprovedNow',
    'runtimeReadyNow',
  ]) {
    if (candidate[key] !== false) fail(`candidate_false_gate_not_false:${tool}:${key}`)
  }
  if (!candidate.nextAction || candidate.nextAction.length < 20) fail(`candidate_next_action_missing:${tool}`)
}

for (const tool of sourceTools) {
  const row = (catalog.privateManifestPreparationPlan || []).find((entry) => entry.toolId === tool)
  if (!row) {
    fail(`private_manifest_preparation_row_missing:${tool}`)
    continue
  }
  const expectedStatus = manifestReadyTools.includes(tool)
    ? 'ready_for_private_manifest_authoring_from_existing_evidence'
    : 'blocked_pending_source_selection_or_review'
  if (row.preparationStatus !== expectedStatus) fail(`private_manifest_preparation_status_mismatch:${tool}:${row.preparationStatus}`)
  if (!row.localOnlyManifestPath?.startsWith('.local-artifacts/ai-graphics/model-weight-manifests/')) {
    fail(`private_manifest_local_path_not_local_artifacts:${tool}`)
  }
  if (!row.expectedRuntimeManifestPath?.startsWith('/opt/reeditpro/model-weights/')) fail(`runtime_manifest_path_wrong:${tool}`)
  for (const namespace of ['private://', 'reeditpro-private://', 'reeditpro-private-artifact-ref-']) {
    if (!row.acceptedPrivateArtifactRefNamespaces?.includes(namespace)) fail(`private_namespace_missing:${tool}:${namespace}`)
  }
  if (row.privateManifestReviewCommand !== 'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"') {
    fail(`private_manifest_review_command_wrong:${tool}`)
  }
  if (row.gpuProofCommandPlanCommand !== 'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"') {
    fail(`gpu_proof_command_plan_command_wrong:${tool}`)
  }
  for (const key of ['ownerReviewRequired', 'localOnly']) {
    if (row[key] !== true) fail(`private_manifest_row_true_gate_not_true:${tool}:${key}`)
  }
  for (const key of ['committedManifestApproved', 'modelDownloadRequiredNow', 'modelWeightsLoaded', 'modelInferencePerformed']) {
    if (row[key] !== false) fail(`private_manifest_row_false_gate_not_false:${tool}:${key}`)
  }
  if (manifestReadyTools.includes(tool) && !row.sourceEvidenceRefs?.length) fail(`private_manifest_ready_row_missing_evidence_refs:${tool}`)
  if (manifestBlockedTools.includes(tool) && row.sourceEvidenceRefs?.length) fail(`private_manifest_blocked_row_has_evidence_refs:${tool}`)
}

if (!catalog.sourceCandidates?.find((candidate) => candidate.toolId === 'sam2')?.existingInternalEvidenceRefs?.includes('server/activation/sam2-runtime/approved-sam2-runtime-evidence.ts')) {
  fail('sam2_internal_evidence_ref_missing')
}
if (!catalog.sourceCandidates?.find((candidate) => candidate.toolId === 'birefnet')?.existingInternalEvidenceRefs?.includes('server/activation/mask-model-download/approved-mask-model-download-evidence.ts')) {
  fail('birefnet_internal_evidence_ref_missing')
}
if (!catalog.sourceCandidates?.find((candidate) => candidate.toolId === 'real_esrgan')?.existingInternalEvidenceRefs?.includes('server/activation/enhancement-model-approval/enhancement-model-license-evidence.ts')) {
  fail('real_esrgan_internal_evidence_ref_missing')
}
if (!JSON.stringify(catalog.sourceCandidates || []).includes('e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4')) fail('birefnet_revision_missing')
if (!JSON.stringify(catalog.sourceCandidates || []).includes('mit_source_claim_requires_owner_manifest_record')) fail('birefnet_mit_license_claim_missing')
if (!JSON.stringify(catalog.sourceCandidates || []).includes('raw gs:// refs remain source evidence')) fail('sam2_gcs_source_evidence_warning_missing')
if (!JSON.stringify(catalog.sourceCandidates || []).includes('RealESRGAN_x4plus.pth')) fail('real_esrgan_release_asset_missing')
if (!JSON.stringify(catalog.sourceCandidates || []).includes('https://github.com/plemeri/InSPyReNet')) fail('inspyrenet_source_url_missing')
if (!JSON.stringify(catalog.sourceCandidates || []).includes('model menu')) fail('rembg_model_menu_not_recorded')

for (const key of [
  'onDemandOnly',
  'noIdleGpuRuntimeApproved',
  'startsOnlyForApprovedWorkerOrToolCall',
]) {
  if (catalog.gpuRuntimeActivationPolicy?.[key] !== true) fail(`gpu_policy_true_not_true:${key}`)
}
if (catalog.gpuRuntimeActivationPolicy?.cpuFallbackAllowedForHeavyTools !== false) fail('cpu_fallback_policy_not_false')

for (const key of [
  'modelWeightSourceCatalogPrepared',
  'all8GpuRuntimeToolsCovered',
  'all5ModelWeightSourceToolsCovered',
  'sourceCandidatesIdentifiedForAll5ModelWeightTools',
  'internalEvidenceBackedSourcesRecorded',
  'privateManifestPreparationPlanPrepared',
  'existingEvidenceCanAuthor3PrivateManifestDrafts',
  'sourceSelectionStillBlocks2PrivateManifestDrafts',
  'privateManifestReviewStillRequired',
  'privateArtifactRefNamespaceRequired',
  'checksumReviewStillRequired',
  'licenseReviewStillRequired',
  'provenanceReviewStillRequired',
  'qualityReviewStillRequired',
  'securityReviewStillRequired',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'agentCanSelectForPlanning',
]) {
  if (catalog.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}
for (const key of [
  'cpuFallbackAllowedForHeavyTools',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'modelWeightManifestsApprovedNow',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
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
  if (catalog.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

if (manifest.counts?.modelWeightManifestRequiredTools !== 5) fail('manifest_readiness_model_weight_count_not_5')
if (manifest.counts?.manifestRecordsApproved !== 0) fail('manifest_readiness_approved_not_zero')
if (manifestReview.counts?.reviewAcceptedManifestRecords !== 0) fail('manifest_review_accepted_records_not_zero')
if (gpuCommandPlan.gpuRuntimePolicy?.onDemandOnly !== true) fail('gpu_command_plan_not_on_demand')
if (gpuCommandPlan.gpuRuntimePolicy?.noIdleGpuRuntimeApproved !== true) fail('gpu_command_plan_idle_gpu_policy_missing')
if (gapReport.gpuRuntimeOnDemandOnly !== true) fail('gap_report_not_on_demand')

for (const needle of [
  'AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION',
  'buildAiGraphicsModelWeightSourceCatalogPacket',
  'listAiGraphicsModelWeightSourceCandidates',
  'buildAiGraphicsModelWeightPrivateManifestPreparationPlan',
  'privateManifestStatus',
  'privateManifestPreparationPlan',
  'source_menu_identified_selection_required',
  'ready_for_private_manifest_authoring_from_existing_evidence',
  'blocked_pending_source_selection_or_review',
  'noIdleGpuRuntimeApproved',
  'cpuFallbackAllowedForHeavyTools: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}

const combinedText = [markdown, JSON.stringify(catalog), source].join('\n')
for (const phrase of [
  'private://',
  'reeditpro-private://',
  'SAM2 existing `gs://` staging evidence is recorded only as internal source evidence',
  'Private manifests approved now: 0',
  'ready_for_private_manifest_authoring_from_existing_evidence',
  'blocked_pending_source_selection_or_review',
  'model-weight-manifest-review:validate',
  'Beta-ready model-weight tools: 0',
  'GPU capacity remains future worker-only',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing:${phrase}`)
}
for (const pattern of [
  /approvedForInternalBetaNow["`:= ]+true/i,
  /modelWeightManifestsApprovedNow["`:= ]+true/i,
  /modelWeightsDownloaded["`:= ]+true/i,
  /modelWeightsLoaded["`:= ]+true/i,
  /modelInferencePerformed["`:= ]+true/i,
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
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
  console.error('AI graphics model-weight source catalog diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: catalog.decision,
  gpuRuntimeTargetedTools: catalog.counts.gpuRuntimeTargetedTools,
  modelWeightSourceCatalogTools: catalog.counts.modelWeightSourceCatalogTools,
  sourceCandidatesCovered: catalog.counts.sourceCandidatesCovered,
  internalEvidenceBackedCandidates: catalog.counts.internalEvidenceBackedCandidates,
  readyForPrivateManifestAuthoringFromExistingEvidence: catalog.counts.readyForPrivateManifestAuthoringFromExistingEvidence,
  blockedPendingSourceSelectionOrReview: catalog.counts.blockedPendingSourceSelectionOrReview,
  privateManifestsApprovedNow: catalog.counts.privateManifestsApprovedNow,
  betaReadyModelWeightTools: catalog.counts.betaReadyModelWeightTools,
  gpuRuntimeOnDemandOnly: catalog.booleans.gpuRuntimeOnDemandOnly,
}, null, 2))
