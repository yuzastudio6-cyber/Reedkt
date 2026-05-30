import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEEPFILTERNET_CLI_FILE_NAME,
  DEEPFILTERNET_CLI_SOURCE_URL,
  DEEPFILTERNET_DOWNLOAD_GCS_PATH,
  DEEPFILTERNET_DOWNLOAD_TARGET_PREFIX,
  DEEPFILTERNET_LICENSE_NAME,
  DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME,
  DEEPFILTERNET_ONNX_ARCHIVE_SOURCE_URL,
  buildDeepFilterNetAggregateChecksum,
  buildDeepFilterNetDownloadExecutionCommandPlans,
  buildDeepFilterNetDownloadReport,
  buildDeepFilterNetModelTreeManifest,
  selectedDeepFilterNetArtifacts,
  validateDeepFilterNetDownloadExecutionEnv,
  validateDeepFilterNetDownloadStaticPlan,
} from '../activation/audio-ai-download'

assert.equal(DEEPFILTERNET_CLI_FILE_NAME, 'deep-filter-0.5.6-x86_64-unknown-linux-musl')
assert.equal(DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME, 'DeepFilterNet3_onnx.tar.gz')
assert.equal(DEEPFILTERNET_CLI_SOURCE_URL, 'https://github.com/Rikorose/DeepFilterNet/releases/download/v0.5.6/deep-filter-0.5.6-x86_64-unknown-linux-musl')
assert.equal(DEEPFILTERNET_ONNX_ARCHIVE_SOURCE_URL, 'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/models/DeepFilterNet3_onnx.tar.gz')
assert.equal(DEEPFILTERNET_LICENSE_NAME, 'MIT OR Apache-2.0')
assert.equal(DEEPFILTERNET_DOWNLOAD_GCS_PATH, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/')
assert.equal(DEEPFILTERNET_DOWNLOAD_TARGET_PREFIX, 'model-weights/audio-ai/deepfilternet/v0.5.6/')
assert.equal(selectedDeepFilterNetArtifacts.length, 2)

const staticPlan = validateDeepFilterNetDownloadStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  artifactUrls: selectedDeepFilterNetArtifacts.map((artifact) => artifact.sourceUrl),
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateDeepFilterNetDownloadStaticPlan({ artifactUrls: ['https://example.com/model.bin'] }).blockers.length > 0)

const executionEnv = validateDeepFilterNetDownloadExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  bucketName: 'reeditpro-staging-reeditpro-generated-assets',
  targetPrefix: DEEPFILTERNET_DOWNLOAD_TARGET_PREFIX,
  artifactUrls: selectedDeepFilterNetArtifacts.map((artifact) => artifact.sourceUrl),
  localTempDir: '/tmp/reeditpro-deepfilternet-artifact-download/v0.5.6',
  providerExecutionEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
})
assert.equal(executionEnv.allowed, true)
assert.ok(validateDeepFilterNetDownloadExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_DEEPFILTERNET_ARTIFACT_DOWNLOAD=true')))
assert.ok(validateDeepFilterNetDownloadExecutionEnv({ projectId: 'prod' }).blockers.length > 0)

const checksumFixture = [
  { relativePath: DEEPFILTERNET_CLI_FILE_NAME, sha256: 'a'.repeat(64), sizeBytes: 10 },
  { relativePath: DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME, sha256: 'b'.repeat(64), sizeBytes: 20 },
]
const manifest = buildDeepFilterNetModelTreeManifest({
  createdAt: '2026-05-30T00:00:00.000Z',
  files: checksumFixture,
})
assert.equal(manifest.aggregateSha256, buildDeepFilterNetAggregateChecksum(checksumFixture))
assert.equal(manifest.runtimeAllowed, false)
assert.equal(manifest.audioProcessingAllowed, false)
assert.equal(manifest.realVideoAudioAiCleanupAllowed, false)
assert.equal(manifest.rnnoiseDownloadAllowed, false)
assert.equal(manifest.demucsDownloadAllowed, false)
assert.equal(manifest.providerAllowed, false)
assert.equal(manifest.revideoAllowed, false)
assert.equal(manifest.productionReadyAllowed, false)
assert.equal(manifest.externalBetaAllowed, false)
assert.equal(manifest.paidProductionAllowed, false)
assert.equal(manifest.broadRealUserMediaAllowed, false)
assert.equal(manifest.filmAllowed, false)
assert.equal(manifest.slowMotionAllowed, false)

const executionPlans = buildDeepFilterNetDownloadExecutionCommandPlans()
assert.ok(executionPlans.some((plan) => plan.commandId === 'deepfilternet_download_linux_cli'))
assert.ok(executionPlans.some((plan) => plan.commandId === 'deepfilternet_download_dfn3_onnx_archive'))
assert.ok(executionPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(executionPlans.filter((plan) => plan.requiresConfirmation).every((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_DEEPFILTERNET_ARTIFACT_DOWNLOAD'))
assert.ok(executionPlans.every((plan) => !/allUsers|allAuthenticatedUsers|signed-url|gcloud\s+run|deploy|docker\s+(build|push)|provider|revideo|film|slow/i.test(plan.commandString)))

const report = buildDeepFilterNetDownloadReport()
assert.equal(report.downloadEvidence.selectedVersion, 'v0.5.6')
assert.equal(report.downloadEvidence.targetGcsPath, DEEPFILTERNET_DOWNLOAD_GCS_PATH)
assert.equal(report.downloadEvidence.licenseName, 'MIT OR Apache-2.0')
assert.equal(report.deepFilterNetRuntimeAllowed, false)
assert.equal(report.audioProcessingAllowed, false)
assert.equal(report.realVideoAudioAiCleanupAllowed, false)
assert.equal(report.rnnoiseDownloadAllowed, false)
assert.equal(report.rnnoiseRuntimeAllowed, false)
assert.equal(report.demucsDownloadAllowed, false)
assert.equal(report.demucsRuntimeAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.filmAllowed, false)
assert.equal(report.slowMotionAllowed, false)
if (report.downloadEvidence.status === 'verified') {
  assert.equal(report.blockers.length, 0)
  assert.equal(report.deepFilterNetDownloadCompleted, true)
  assert.equal(report.phase36CReadiness.readyForGeneratedAudioRuntimeVerification, true)
  assert.match(report.downloadEvidence.cliSha256 ?? '', /^[a-f0-9]{64}$/)
  assert.match(report.downloadEvidence.modelArchiveSha256 ?? '', /^[a-f0-9]{64}$/)
  assert.match(report.downloadEvidence.aggregateSha256 ?? '', /^[a-f0-9]{64}$/)
  assert.equal(report.downloadEvidence.uploadedObjectCount, 7)
} else {
  assert.ok(report.blockers.some((blocker) => blocker.includes('not yet verified') || blocker.includes('missing')))
  assert.equal(report.phase36CReadiness.readyForGeneratedAudioRuntimeVerification, false)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:deepfilternet-download:plan'], 'tsx server/cli/activation-deepfilternet-download-plan.ts')
assert.equal(packageJson.scripts['activation:deepfilternet-download'], 'tsx server/cli/activation-deepfilternet-download.ts')
assert.equal(packageJson.scripts['activation:deepfilternet-download:report'], 'tsx server/cli/activation-deepfilternet-download-report.ts')
assert.equal(packageJson.scripts['smoke:activation-deepfilternet-download'], 'tsx server/smoke/activation-deepfilternet-download-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_deepfilternet_v0_5_6_artifacts',
    'mit_or_apache_2_license',
    'private_gcs_prefix',
    'confirmation_required',
    'checksum_manifest',
    'download_report_gates',
    'false_runtime_audio_media_launch_gates',
    'blocked_rnnoise_demucs_provider_revideo_film_slow_motion',
    'package_scripts',
  ],
  status: report.downloadEvidence.status,
}))
