import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  VLM_MODEL_DOWNLOAD_BUCKET,
  VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS,
  VLM_MODEL_DOWNLOAD_GCS_PATH,
  VLM_MODEL_DOWNLOAD_MODEL_ID,
  VLM_MODEL_DOWNLOAD_SELECTED_FILES,
  VLM_MODEL_DOWNLOAD_TARGET_PREFIX,
  buildPendingVlmChecksumManifest,
  buildVlmAssetSelectionManifest,
  buildVlmModelDownloadCommandPlan,
  buildVlmModelDownloadIamPlan,
  buildVlmModelDownloadReadiness,
  buildVlmPhase39AEvidenceReview,
  buildVlmRuntimeHandoffManifest,
  buildVlmSelectedAssetsFromSiblings,
  getApprovedVlmModelDownloadEvidence,
  selectedVlmModelFilesMatch,
  validateVlmModelDownloadExecutionEnv,
  validateVlmModelDownloadStaticPlan,
  vlmModelDownloadNotReadyFor,
} from '../activation/vlm-model-download'

const createdAt = '2026-05-31T00:00:00.000Z'
const phase39AReview = buildVlmPhase39AEvidenceReview(createdAt)
assert.equal(phase39AReview.candidateModel, 'Qwen/Qwen3-VL-8B-Instruct')
assert.equal(phase39AReview.runtimeCandidate, 'vLLM')
assert.equal(phase39AReview.phase39BReady, true)
assert.equal(phase39AReview.modelDownloadAllowedInPhase39A, false)
assert.equal(phase39AReview.runtimeAllowedInPhase39A, false)
assert.equal(phase39AReview.trackAAllowedInPhase39A, false)

assert.equal(VLM_MODEL_DOWNLOAD_MODEL_ID, 'Qwen/Qwen3-VL-8B-Instruct')
assert.match(VLM_MODEL_DOWNLOAD_EXPECTED_REVISION, /^[0-9a-f]{40}$/)
assert.equal(VLM_MODEL_DOWNLOAD_SELECTED_FILES.length, 15)
assert.equal(selectedVlmModelFilesMatch([...VLM_MODEL_DOWNLOAD_SELECTED_FILES]), true)
assert.equal(VLM_MODEL_DOWNLOAD_BUCKET, 'reeditpro-staging-reeditpro-generated-assets')
assert.equal(VLM_MODEL_DOWNLOAD_TARGET_PREFIX, `model-weights/qwen3-vl/qwen3-vl-8b-instruct/${VLM_MODEL_DOWNLOAD_EXPECTED_REVISION}/`)
assert.equal(VLM_MODEL_DOWNLOAD_GCS_PATH.startsWith('gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/'), true)
assert.equal(VLM_MODEL_DOWNLOAD_GCS_PATH.includes('http'), false)
assert.equal(VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS.length, 14)
assert.ok(VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS.includes('phase_39b_vlm_model_download_report.json'))

const selectedAssets = buildVlmSelectedAssetsFromSiblings([])
assert.equal(selectedAssets.length, 15)
assert.equal(selectedAssets.every((asset) => asset.gcsUri.startsWith(VLM_MODEL_DOWNLOAD_GCS_PATH)), true)
assert.equal(selectedAssets.some((asset) => asset.relativePath.endsWith('.safetensors')), true)

const staticValidation = validateVlmModelDownloadStaticPlan({
  bucketName: VLM_MODEL_DOWNLOAD_BUCKET,
  targetPrefix: VLM_MODEL_DOWNLOAD_TARGET_PREFIX,
  revision: VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
})
assert.equal(staticValidation.allowed, true)
assert.equal(validateVlmModelDownloadStaticPlan({ targetPrefix: 'public/test/' }).allowed, false)
assert.equal(validateVlmModelDownloadExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  bucketName: VLM_MODEL_DOWNLOAD_BUCKET,
  targetPrefix: VLM_MODEL_DOWNLOAD_TARGET_PREFIX,
  revision: VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  localTempDir: '/tmp/reeditpro/activation/phase39b/qwen3-vl-8b-instruct/test/downloads',
  providerExecutionEnabled: 'false',
  vlmRuntimeExecutionEnabled: 'false',
  transformersInferenceEnabled: 'false',
  gpuJobEnabled: 'false',
  mediaProcessingEnabled: 'false',
  productionReady: 'false',
  internalBetaReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
  trackAExecutionEnabled: 'false',
  publicOutputEnabled: 'false',
}).allowed, false)
assert.equal(validateVlmModelDownloadExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  downloadConfirmation: 'true',
  privateGcsUploadConfirmation: 'true',
  bucketName: VLM_MODEL_DOWNLOAD_BUCKET,
  targetPrefix: VLM_MODEL_DOWNLOAD_TARGET_PREFIX,
  revision: VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  localTempDir: '/tmp/reeditpro/activation/phase39b/qwen3-vl-8b-instruct/test/downloads',
  providerExecutionEnabled: 'false',
  vlmRuntimeExecutionEnabled: 'false',
  transformersInferenceEnabled: 'false',
  gpuJobEnabled: 'false',
  mediaProcessingEnabled: 'false',
  productionReady: 'false',
  internalBetaReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
  trackAExecutionEnabled: 'false',
  publicOutputEnabled: 'false',
}).allowed, true)

const commandPlan = buildVlmModelDownloadCommandPlan()
assert.equal(commandPlan.some((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_VLM_MODEL_DOWNLOAD'), true)
assert.equal(commandPlan.some((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_UPLOAD'), true)
assert.equal(commandPlan.every((plan) => plan.textOnlyByDefault), true)
assert.doesNotMatch(commandPlan.map((plan) => plan.commandString).join('\n'), /vllm\s+serve|AutoModel|pipeline\(|docker\s+push|gcloud\s+run\s+deploy/i)

const checksumManifest = buildPendingVlmChecksumManifest({ createdAt, revision: VLM_MODEL_DOWNLOAD_EXPECTED_REVISION, selectedAssets })
assert.equal(checksumManifest.status, 'pending_until_download')
assert.equal(checksumManifest.entries.length, 15)
const assetSelection = buildVlmAssetSelectionManifest({
  createdAt,
  revision: VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  selectedAssets,
  excludedRepoFiles: ['.gitattributes'],
})
assert.equal(assetSelection.runtimeAutoDownloadAllowed, false)
assert.equal(assetSelection.inferenceAllowed, false)

const runtimeHandoff = buildVlmRuntimeHandoffManifest({
  createdAt,
  revision: VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  checksumVerified: true,
  blockers: [],
})
assert.equal(runtimeHandoff.phase39CReadyForGeneratedRuntimeVerification, true)
assert.ok(runtimeHandoff.requiredRuntimeRules.some((rule) => rule.includes('local model path')))
assert.ok(vlmModelDownloadNotReadyFor.includes('Track A execution/runtime code'))
assert.equal(buildVlmModelDownloadIamPlan(createdAt).iamMutationAllowed, false)

const approvedEvidence = getApprovedVlmModelDownloadEvidence()
const readiness = buildVlmModelDownloadReadiness(approvedEvidence)
assert.equal(readiness.phase39CReadyForGeneratedRuntimeVerification, approvedEvidence.status === 'verified')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-model-download:plan'], 'tsx server/cli/activation-vlm-model-download-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-model-download'], 'tsx server/cli/activation-vlm-model-download.ts')
assert.equal(packageJson.scripts['activation:vlm-model-download:report'], 'tsx server/cli/activation-vlm-model-download-report.ts')
assert.equal(packageJson.scripts['activation:vlm-model-download:iam-plan'], 'tsx server/cli/activation-vlm-model-download-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-model-download'], 'tsx server/smoke/activation-vlm-model-download-smoke.ts')

assert.equal(existsSync(new URL('../activation/vlm-model-download/index.ts', import.meta.url)), true)
const moduleDir = new URL('../activation/vlm-model-download/', import.meta.url)
const moduleSource = readdirSync(moduleDir)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => readFileSync(new URL(fileName, moduleDir), 'utf8'))
  .join('\n')
assert.equal(/from\s+['"].*workers\//.test(moduleSource), false)
assert.equal(/vllm\s+serve|AutoModel.*from_pretrained|pipeline\(|from\s+['"]transformers|gcloud\s+run\s+deploy/i.test(moduleSource), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase39a_evidence_reference',
    'qwen3_vl_exact_revision_registry',
    'download_and_upload_confirmation_gates',
    'private_gcs_prefix',
    'checksum_and_tree_manifest_schema',
    'phase39c_runtime_handoff',
    'blocked_runtime_media_provider_gpu_beta_production_track_a',
  ],
}))
