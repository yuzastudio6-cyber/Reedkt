import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  SAM2_CHECKPOINT_FILE_NAME,
  SAM2_CHECKPOINT_SOURCE_URL,
  SAM2_CONFIG_FILE_NAME,
  SAM2_CONFIG_SOURCE_URL,
  SAM2_LICENSE_NAME,
  SAM2_MODEL_DOWNLOAD_GCS_PATH,
  SAM2_MODEL_DOWNLOAD_TARGET_PREFIX,
  buildSam2AggregateChecksum,
  buildSam2ModelDownloadExecutionCommandPlans,
  buildSam2ModelDownloadReport,
  buildSam2ModelTreeManifest,
  validateSam2ModelDownloadExecutionEnv,
  validateSam2ModelDownloadStaticPlan,
} from '../activation/sam2-model-download'

assert.equal(SAM2_CHECKPOINT_FILE_NAME, 'sam2.1_hiera_tiny.pt')
assert.equal(SAM2_CONFIG_FILE_NAME, 'sam2.1_hiera_t.yaml')
assert.equal(SAM2_CHECKPOINT_SOURCE_URL, 'https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_tiny.pt')
assert.equal(SAM2_CONFIG_SOURCE_URL, 'https://raw.githubusercontent.com/facebookresearch/sam2/main/sam2/configs/sam2.1/sam2.1_hiera_t.yaml')
assert.equal(SAM2_LICENSE_NAME, 'Apache-2.0')
assert.equal(SAM2_MODEL_DOWNLOAD_GCS_PATH, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/')
assert.equal(SAM2_MODEL_DOWNLOAD_TARGET_PREFIX, 'model-weights/sam2/sam2.1-hiera-tiny/')

const staticPlan = validateSam2ModelDownloadStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  checkpointSourceUrl: SAM2_CHECKPOINT_SOURCE_URL,
  configSourceUrl: SAM2_CONFIG_SOURCE_URL,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateSam2ModelDownloadStaticPlan({ checkpointSourceUrl: 'https://example.com/model.pt' }).blockers.length > 0)
assert.ok(validateSam2ModelDownloadStaticPlan({ configSourceUrl: 'https://example.com/config.yaml' }).blockers.length > 0)

const executionEnv = validateSam2ModelDownloadExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  bucketName: 'reeditpro-staging-reeditpro-generated-assets',
  targetPrefix: SAM2_MODEL_DOWNLOAD_TARGET_PREFIX,
  checkpointSourceUrl: SAM2_CHECKPOINT_SOURCE_URL,
  configSourceUrl: SAM2_CONFIG_SOURCE_URL,
  localTempDir: '/tmp/reeditpro-sam2-model-download/sam2.1-hiera-tiny',
  providerExecutionEnabled: 'false',
})
assert.equal(executionEnv.allowed, true)
assert.ok(validateSam2ModelDownloadExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_SAM2_MODEL_DOWNLOAD=true')))
assert.ok(validateSam2ModelDownloadExecutionEnv({ projectId: 'prod' }).blockers.length > 0)

const manifest = buildSam2ModelTreeManifest({
  createdAt: '2026-05-29T00:00:00.000Z',
  files: [
    { relativePath: SAM2_CHECKPOINT_FILE_NAME, sha256: 'a'.repeat(64), sizeBytes: 10 },
    { relativePath: SAM2_CONFIG_FILE_NAME, sha256: 'b'.repeat(64), sizeBytes: 20 },
  ],
})
assert.equal(manifest.aggregateSha256, buildSam2AggregateChecksum([
  { relativePath: SAM2_CHECKPOINT_FILE_NAME, sha256: 'a'.repeat(64), sizeBytes: 10 },
  { relativePath: SAM2_CONFIG_FILE_NAME, sha256: 'b'.repeat(64), sizeBytes: 20 },
]))
assert.equal(manifest.runtimeAllowed, false)
assert.equal(manifest.temporalTrackingAllowed, false)
assert.equal(manifest.fullVideoMaskAllowed, false)
assert.equal(manifest.fullVideoTextBehindSubjectAllowed, false)
assert.equal(manifest.productionReadyAllowed, false)
assert.equal(manifest.externalBetaAllowed, false)
assert.equal(manifest.paidProductionAllowed, false)
assert.equal(manifest.broadRealUserMediaAllowed, false)
assert.equal(manifest.providerAllowed, false)
assert.equal(manifest.revideoAllowed, false)

const executionPlans = buildSam2ModelDownloadExecutionCommandPlans()
assert.ok(executionPlans.some((plan) => plan.commandId === 'sam2_model_download_checkpoint'))
assert.ok(executionPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(executionPlans.filter((plan) => plan.requiresConfirmation).every((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_SAM2_MODEL_DOWNLOAD'))
assert.ok(executionPlans.every((plan) => !/allUsers|allAuthenticatedUsers|signed-url|gcloud\s+run|deploy|docker\s+(build|push)|provider/i.test(plan.commandString)))

const report = buildSam2ModelDownloadReport()
assert.equal(report.downloadEvidence.checkpointFileName, SAM2_CHECKPOINT_FILE_NAME)
assert.equal(report.downloadEvidence.configFileName, SAM2_CONFIG_FILE_NAME)
assert.equal(report.downloadEvidence.targetGcsPath, SAM2_MODEL_DOWNLOAD_GCS_PATH)
assert.equal(report.downloadEvidence.licenseName, 'Apache-2.0')
assert.equal(report.sam2RuntimeAllowed, false)
assert.equal(report.sam2TemporalTrackingAllowed, false)
assert.equal(report.sam2FullVideoMaskAllowed, false)
assert.equal(report.fullVideoTextBehindSubjectAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
if (report.downloadEvidence.status === 'verified') {
  assert.equal(report.blockers.length, 0)
  assert.equal(report.sam2DownloadCompleted, true)
  assert.equal(report.phase35CReadiness.readyForGeneratedSyntheticRuntimeVerification, true)
  assert.match(report.downloadEvidence.checkpointSha256 ?? '', /^[a-f0-9]{64}$/)
  assert.match(report.downloadEvidence.configSha256 ?? '', /^[a-f0-9]{64}$/)
  assert.match(report.downloadEvidence.aggregateSha256 ?? '', /^[a-f0-9]{64}$/)
  assert.equal(report.downloadEvidence.uploadedObjectCount, 5)
} else {
  assert.ok(report.blockers.some((blocker) => blocker.includes('not yet verified') || blocker.includes('missing')))
  assert.equal(report.phase35CReadiness.readyForGeneratedSyntheticRuntimeVerification, false)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:sam2-model-download:plan'], 'tsx server/cli/activation-sam2-model-download-plan.ts')
assert.equal(packageJson.scripts['activation:sam2-model-download'], 'tsx server/cli/activation-sam2-model-download.ts')
assert.equal(packageJson.scripts['activation:sam2-model-download:report'], 'tsx server/cli/activation-sam2-model-download-report.ts')
assert.equal(packageJson.scripts['smoke:activation-sam2-model-download'], 'tsx server/smoke/activation-sam2-model-download-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_sam2_tiny_sources',
    'apache_2_license',
    'private_gcs_prefix',
    'confirmation_required',
    'checksum_manifest',
    'download_report_gates',
    'false_runtime_tracking_video_launch_gates',
    'package_scripts',
  ],
  status: report.downloadEvidence.status,
}))
