import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  APPROVED_MASK_MODEL_REPO_ID,
  MASK_MODEL_DOWNLOAD_LOCAL_DIR,
  buildMaskModelAggregateChecksum,
  buildMaskModelDownloadExecutionCommandPlans,
  buildMaskModelDownloadReport,
  buildMaskModelGcsUploadPlan,
  buildMaskModelTreeManifest,
  getApprovedMaskModelDownloadEvidence,
  isApprovedMaskModelRepo,
  isMaskModelPathInsideRepo,
  maskDownloadEvidenceHasChecksum,
  validateMaskModelDownloadPreflight,
  validateMaskModelGcsStoragePath,
} from '../activation/mask-model-download'

assert.equal(APPROVED_MASK_MODEL_REPO_ID, 'ZhengPeng7/BiRefNet')
assert.equal(isApprovedMaskModelRepo('ZhengPeng7/BiRefNet'), true)
assert.equal(isApprovedMaskModelRepo('facebook/sam2-hiera-tiny'), false)
assert.equal(isApprovedMaskModelRepo('facebookresearch/sam2'), false)
assert.equal(isMaskModelPathInsideRepo('/Users/macuser/Documents/REeditpro-phase33b/model.safetensors'), true)
assert.equal(isMaskModelPathInsideRepo(MASK_MODEL_DOWNLOAD_LOCAL_DIR), false)

const preflight = validateMaskModelDownloadPreflight({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  authenticatedAccount: 'aiediting@reeditpro.com',
  env: 'staging',
  confirmation: 'true',
  bucketName: 'reeditpro-staging-reeditpro-generated-assets',
  repoId: 'ZhengPeng7/BiRefNet',
  repoPath: MASK_MODEL_DOWNLOAD_LOCAL_DIR,
})
assert.equal(preflight.allowed, true, 'valid BiRefNet preflight must be allowed.')
assert.ok(validateMaskModelDownloadPreflight({ repoId: 'facebook/sam2-hiera-tiny' }).blockers.length > 0, 'SAM2 download must be blocked.')
assert.ok(validateMaskModelDownloadPreflight({ repoId: 'Real-ESRGAN' }).blockers.length > 0, 'non-BiRefNet model must be blocked.')
assert.ok(validateMaskModelDownloadPreflight({ env: 'production' }).blockers.length > 0, 'production env must be blocked.')
assert.ok(validateMaskModelDownloadPreflight({ repoPath: '/Users/macuser/Documents/REeditpro/model.bin' }).blockers.length > 0, 'repo-local model path must be blocked.')

const checksumManifest = buildMaskModelTreeManifest({
  repoId: 'ZhengPeng7/BiRefNet',
  resolvedRevision: 'revision-placeholder',
  files: [
    { relativePath: 'README.md', sha256: 'a'.repeat(64), sizeBytes: 10 },
    { relativePath: 'model.safetensors', sha256: 'b'.repeat(64), sizeBytes: 20 },
    { relativePath: 'configuration_birefnet.py', sha256: 'c'.repeat(64), sizeBytes: 30 },
  ],
})
assert.equal(checksumManifest.fileCount, 3)
assert.equal(checksumManifest.totalSizeBytes, 60)
assert.equal(checksumManifest.aggregateSha256, buildMaskModelAggregateChecksum(checksumManifest.files))
assert.equal(checksumManifest.hasCustomCode, true)
assert.equal(checksumManifest.hasSafetensorsOrBinWeights, true)

const evidence = getApprovedMaskModelDownloadEvidence()
if (evidence.status === 'verified') {
  assert.equal(maskDownloadEvidenceHasChecksum(evidence), true, 'verified evidence must include aggregate checksum.')
  assert.equal(evidence.repoId, 'ZhengPeng7/BiRefNet')
  assert.ok(evidence.stagingStoragePath.includes('model-weights/birefnet/main/'))
  assert.ok(evidence.fileCount && evidence.fileCount > 0)
  assert.ok(evidence.totalSizeBytes && evidence.totalSizeBytes > 0)
  assert.equal(evidence.hasCustomCode, evidence.customCodeFiles.length > 0)
  assert.equal(evidence.hasSafetensorsOrBinWeights, evidence.modelWeightFiles.some((file) => /\.(safetensors|bin)$/i.test(file)))
}

assert.deepEqual(validateMaskModelGcsStoragePath('gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/'), [])
assert.ok(validateMaskModelGcsStoragePath('gs://reeditpro-staging-reeditpro-source-media/model-weights/birefnet/main/').length > 0)

const uploadPlan = buildMaskModelGcsUploadPlan()
assert.ok(uploadPlan.commandString.includes('gcloud storage rsync'))
assert.equal(uploadPlan.requiresConfirmation, true)
assert.ok(!/signed-url|allUsers|gcloud\s+run|deploy/i.test(uploadPlan.commandString))

const executionPlans = buildMaskModelDownloadExecutionCommandPlans()
assert.ok(executionPlans.some((plan) => plan.phase === 'download'))
assert.ok(executionPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(executionPlans.every((plan) => !/sam2|deepfilternet|demucs|real-esrgan|film|paddleocr/i.test(plan.commandString)))

const report = buildMaskModelDownloadReport()
assert.equal(report.downloadEvidence.repoId, 'ZhengPeng7/BiRefNet')
assert.equal(report.providerExecuted, false)
assert.equal(report.gpuDeployed, false)
assert.equal(report.frameOrVideoProcessed, false)
assert.equal(report.maskExecutionRan, false)
assert.equal(report.textBehindSubjectExecutionRan, false)
assert.equal(report.secretValuesCreated, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.phase33DReadiness.readyForControlledMaskTest, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['smoke:activation-mask-model-download'])
assert.ok(packageJson.scripts['activation:mask-model-download:plan'])
assert.ok(packageJson.scripts['activation:mask-model-download:report'])
const scriptText = [
  packageJson.scripts['smoke:activation-mask-model-download'],
  packageJson.scripts['activation:mask-model-download:plan'],
  packageJson.scripts['activation:mask-model-download:report'],
].join('\n')
assert.ok(!/huggingface-cli|snapshot_download|gcloud\s+storage|pip install|docker|gcloud\s+run/i.test(scriptText), 'npm scripts must be static/report-only.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'birefnet_only',
    'sam2_blocked',
    'temp_path_outside_repo',
    'preflight_guards',
    'checksum_manifest',
    'custom_code_recorded_not_executed',
    'private_gcs_path',
    'execution_plans_text_only',
    'false_launch_gates',
    'package_scripts_static',
  ],
}))
