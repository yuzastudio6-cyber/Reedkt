import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  APPROVED_ENHANCEMENT_MODEL_FILE,
  APPROVED_ENHANCEMENT_MODEL_SOURCE_URL,
  ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR,
  buildEnhancementModelAggregateChecksum,
  buildEnhancementModelDownloadExecutionCommandPlans,
  buildEnhancementModelDownloadReport,
  buildEnhancementModelGcsUploadPlan,
  buildEnhancementModelTreeManifest,
  enhancementDownloadEvidenceHasChecksum,
  getApprovedEnhancementModelDownloadEvidence,
  isApprovedEnhancementModelFile,
  isApprovedEnhancementModelSourceUrl,
  isEnhancementModelPathInsideRepo,
  validateEnhancementModelDownloadPreflight,
  validateEnhancementModelGcsStoragePath,
} from '../activation/enhancement-model-download'

assert.equal(APPROVED_ENHANCEMENT_MODEL_FILE, 'RealESRGAN_x4plus.pth')
assert.equal(isApprovedEnhancementModelSourceUrl(APPROVED_ENHANCEMENT_MODEL_SOURCE_URL), true)
assert.equal(isApprovedEnhancementModelSourceUrl('https://github.com/google-research/frame-interpolation'), false)
assert.equal(isApprovedEnhancementModelFile('RealESRGAN_x4plus.pth'), true)
assert.equal(isApprovedEnhancementModelFile('RealESRGAN_x2plus.pth'), false)
assert.equal(isApprovedEnhancementModelFile('RealESRGAN_x4plus_anime_6B.pth'), false)
assert.equal(isApprovedEnhancementModelFile('realesr-general-x4v3.pth'), false)
assert.equal(isApprovedEnhancementModelFile('GFPGANv1.4.pth'), false)
assert.equal(isApprovedEnhancementModelFile('detection_Resnet50_Final.pth'), false)
assert.equal(isEnhancementModelPathInsideRepo('/Users/macuser/Documents/REeditpro-phase34b/RealESRGAN_x4plus.pth'), true)
assert.equal(isEnhancementModelPathInsideRepo(ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR), false)

const preflight = validateEnhancementModelDownloadPreflight({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  authenticatedAccount: 'aiediting@reeditpro.com',
  env: 'staging',
  confirmation: 'true',
  bucketName: 'reeditpro-staging-reeditpro-generated-assets',
  sourceUrl: APPROVED_ENHANCEMENT_MODEL_SOURCE_URL,
  fileName: 'RealESRGAN_x4plus.pth',
  repoPath: ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR,
})
assert.equal(preflight.allowed, true, 'valid Real-ESRGAN preflight must be allowed.')
assert.ok(validateEnhancementModelDownloadPreflight({ sourceUrl: 'https://example.com/RealESRGAN_x4plus.pth' }).blockers.length > 0, 'unapproved source URL must be blocked.')
assert.ok(validateEnhancementModelDownloadPreflight({ fileName: 'RealESRGAN_x2plus.pth' }).blockers.length > 0, 'non-x4plus model must be blocked.')
assert.ok(validateEnhancementModelDownloadPreflight({ env: 'production' }).blockers.length > 0, 'production env must be blocked.')
assert.ok(validateEnhancementModelDownloadPreflight({ repoPath: '/Users/macuser/Documents/REeditpro/model.pth' }).blockers.length > 0, 'repo-local model path must be blocked.')

const checksumManifest = buildEnhancementModelTreeManifest({
  files: [
    { relativePath: 'RealESRGAN_x4plus.pth', sha256: 'a'.repeat(64), sizeBytes: 10 },
    { relativePath: 'file_checksums_sha256.txt', sha256: 'b'.repeat(64), sizeBytes: 20 },
  ],
})
assert.equal(checksumManifest.fileCount, 2)
assert.equal(checksumManifest.totalSizeBytes, 30)
assert.equal(checksumManifest.aggregateSha256, buildEnhancementModelAggregateChecksum(checksumManifest.files))
assert.equal(checksumManifest.hasPthWeight, true)
assert.equal(checksumManifest.modelWeightFiles.length, 1)

const evidence = getApprovedEnhancementModelDownloadEvidence()
if (evidence.status === 'verified') {
  assert.equal(enhancementDownloadEvidenceHasChecksum(evidence), true, 'verified evidence must include file and aggregate checksums.')
  assert.equal(evidence.sourceUrl, APPROVED_ENHANCEMENT_MODEL_SOURCE_URL)
  assert.equal(evidence.fileName, 'RealESRGAN_x4plus.pth')
  assert.ok(evidence.stagingStoragePath.includes('model-weights/real-esrgan/x4plus/'))
  assert.ok(evidence.fileCount && evidence.fileCount > 0)
  assert.ok(evidence.totalSizeBytes && evidence.totalSizeBytes > 0)
  assert.equal(evidence.hasPthWeight, evidence.modelWeightFiles.some((file) => /\.pth$/i.test(file)))
  assert.equal(evidence.modelWeightFiles.length, 1)
}

assert.deepEqual(validateEnhancementModelGcsStoragePath('gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/'), [])
assert.ok(validateEnhancementModelGcsStoragePath('gs://reeditpro-staging-reeditpro-source-media/model-weights/real-esrgan/x4plus/').length > 0)

const uploadPlan = buildEnhancementModelGcsUploadPlan()
assert.ok(uploadPlan.commandString.includes('gcloud storage cp'))
assert.equal(uploadPlan.requiresConfirmation, true)
assert.ok(!/signed-url|allUsers|gcloud\s+run|deploy/i.test(uploadPlan.commandString))

const executionPlans = buildEnhancementModelDownloadExecutionCommandPlans()
assert.ok(executionPlans.some((plan) => plan.phase === 'download'))
assert.ok(executionPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(executionPlans.every((plan) => !/frame-interpolation|sam2|birefnet|deepfilternet|demucs|facexlib|gfpgan/i.test(plan.commandString)))

const report = buildEnhancementModelDownloadReport()
assert.equal(report.downloadEvidence.modelName, 'RealESRGAN_x4plus')
assert.equal(report.providerExecuted, false)
assert.equal(report.gpuDeployed, false)
assert.equal(report.frameOrVideoProcessed, false)
assert.equal(report.enhancementExecutionRan, false)
assert.equal(report.slowMotionExecutionRan, false)
assert.equal(report.secretValuesCreated, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.phase34DReadiness.readyForControlledEnhancementSample, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['smoke:activation-enhancement-model-download'])
assert.ok(packageJson.scripts['activation:enhancement-model-download:plan'])
assert.ok(packageJson.scripts['activation:enhancement-model-download:report'])
const scriptText = [
  packageJson.scripts['smoke:activation-enhancement-model-download'],
  packageJson.scripts['activation:enhancement-model-download:plan'],
  packageJson.scripts['activation:enhancement-model-download:report'],
].join('\n')
assert.ok(!/curl|wget|gcloud\s+storage|pip install|docker|gcloud\s+run/i.test(scriptText), 'npm scripts must be static/report-only.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'real_esrgan_x4plus_only',
    'film_blocked',
    'alternate_weights_blocked',
    'temp_path_outside_repo',
    'preflight_guards',
    'checksum_manifest',
    'private_gcs_path',
    'execution_plans_text_only',
    'false_launch_gates',
    'package_scripts_static',
  ],
}))
