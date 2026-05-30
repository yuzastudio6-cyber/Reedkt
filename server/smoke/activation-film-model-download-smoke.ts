import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  FILM_CHECKPOINT_SOURCE_URL,
  FILM_EXPECTED_MODEL_FILE_PATHS,
  FILM_LICENSE_NAME,
  FILM_MODEL_DOWNLOAD_GCS_PATH,
  FILM_MODEL_DOWNLOAD_TARGET_PREFIX,
  FILM_SELECTED_ARTIFACT_ROOT,
  FILM_SOURCE_REPO_URL,
  buildFilmAggregateChecksum,
  buildFilmModelDownloadExecutionCommandPlans,
  buildFilmModelDownloadReport,
  buildFilmModelTreeManifest,
  validateFilmModelDownloadExecutionEnv,
  validateFilmModelDownloadStaticPlan,
} from '../activation/film-model-download'

assert.equal(FILM_SOURCE_REPO_URL, 'https://github.com/google-research/frame-interpolation')
assert.equal(FILM_CHECKPOINT_SOURCE_URL, 'https://drive.google.com/drive/folders/1q8110-qp225asX3DQvZnfLfJPkCHmDpy?usp=sharing')
assert.equal(FILM_SELECTED_ARTIFACT_ROOT, 'film_net/Style/saved_model')
assert.equal(FILM_LICENSE_NAME, 'Apache-2.0')
assert.equal(FILM_MODEL_DOWNLOAD_GCS_PATH, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/')
assert.equal(FILM_MODEL_DOWNLOAD_TARGET_PREFIX, 'model-weights/film/film-net-style-saved-model/')
assert.deepEqual([...FILM_EXPECTED_MODEL_FILE_PATHS].sort(), [
  'film_net/Style/saved_model/keras_metadata.pb',
  'film_net/Style/saved_model/saved_model.pb',
  'film_net/Style/saved_model/variables/variables.data-00000-of-00001',
  'film_net/Style/saved_model/variables/variables.index',
])

const staticPlan = validateFilmModelDownloadStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  sourceRepoUrl: FILM_SOURCE_REPO_URL,
  checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
  selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateFilmModelDownloadStaticPlan({ checkpointSourceUrl: 'https://example.com/model' }).blockers.length > 0)
assert.ok(validateFilmModelDownloadStaticPlan({ selectedArtifactRoot: 'film_net/L1/saved_model' }).blockers.length > 0)

const executionEnv = validateFilmModelDownloadExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  bucketName: 'reeditpro-staging-reeditpro-generated-assets',
  targetPrefix: FILM_MODEL_DOWNLOAD_TARGET_PREFIX,
  sourceRepoUrl: FILM_SOURCE_REPO_URL,
  checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
  selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
  localTempDir: '/tmp/reeditpro-film-model-download/film-net-style-saved-model',
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
})
assert.equal(executionEnv.allowed, true)
assert.ok(validateFilmModelDownloadExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD=true')))
assert.ok(validateFilmModelDownloadExecutionEnv({ projectId: 'prod' }).blockers.length > 0)

const checksumEntries = [
  { relativePath: 'film_net/Style/saved_model/keras_metadata.pb', sha256: 'a'.repeat(64), sizeBytes: 10 },
  { relativePath: 'film_net/Style/saved_model/saved_model.pb', sha256: 'b'.repeat(64), sizeBytes: 20 },
  { relativePath: 'film_net/Style/saved_model/variables/variables.data-00000-of-00001', sha256: 'c'.repeat(64), sizeBytes: 30 },
  { relativePath: 'film_net/Style/saved_model/variables/variables.index', sha256: 'd'.repeat(64), sizeBytes: 40 },
]
const manifest = buildFilmModelTreeManifest({
  createdAt: '2026-05-30T00:00:00.000Z',
  files: checksumEntries,
})
assert.equal(manifest.aggregateSha256, buildFilmAggregateChecksum(checksumEntries))
assert.equal(manifest.filmRuntimeAllowed, false)
assert.equal(manifest.slowMotionAllowed, false)
assert.equal(manifest.realVideoSlowMotionAllowed, false)
assert.equal(manifest.fullVideoInterpolationAllowed, false)
assert.equal(manifest.productionReadyAllowed, false)
assert.equal(manifest.externalBetaAllowed, false)
assert.equal(manifest.paidProductionAllowed, false)
assert.equal(manifest.broadRealUserMediaAllowed, false)
assert.equal(manifest.providerAllowed, false)
assert.equal(manifest.revideoAllowed, false)

const executionPlans = buildFilmModelDownloadExecutionCommandPlans()
assert.ok(executionPlans.some((plan) => plan.commandId === 'film_model_download_selected_saved_model_tree'))
assert.ok(executionPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(executionPlans.filter((plan) => plan.requiresConfirmation).every((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD'))
assert.ok(executionPlans.every((plan) => !/allUsers|allAuthenticatedUsers|signed-url|gcloud\s+run|deploy|docker\s+(build|push)|provider|revideo/i.test(plan.commandString)))

const report = buildFilmModelDownloadReport()
assert.equal(report.downloadEvidence.selectedArtifactRoot, FILM_SELECTED_ARTIFACT_ROOT)
assert.equal(report.downloadEvidence.targetGcsPath, FILM_MODEL_DOWNLOAD_GCS_PATH)
assert.equal(report.downloadEvidence.licenseName, 'Apache-2.0')
assert.equal(report.filmRuntimeAllowed, false)
assert.equal(report.slowMotionAllowed, false)
assert.equal(report.realVideoSlowMotionAllowed, false)
assert.equal(report.fullVideoInterpolationAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
if (report.downloadEvidence.status === 'verified') {
  assert.equal(report.blockers.length, 0)
  assert.equal(report.filmDownloadCompleted, true)
  assert.equal(report.phase38CReadiness.readyForGeneratedFrameRuntimeVerification, true)
  assert.match(report.downloadEvidence.aggregateSha256 ?? '', /^[a-f0-9]{64}$/)
  assert.equal(report.downloadEvidence.fileChecksums.length, 4)
  assert.equal(report.downloadEvidence.uploadedObjectCount, 9)
} else {
  assert.ok(report.blockers.some((blocker) => blocker.includes('not yet verified') || blocker.includes('missing')))
  assert.equal(report.phase38CReadiness.readyForGeneratedFrameRuntimeVerification, false)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:film-model-download:plan'], 'tsx server/cli/activation-film-model-download-plan.ts')
assert.equal(packageJson.scripts['activation:film-model-download'], 'tsx server/cli/activation-film-model-download.ts')
assert.equal(packageJson.scripts['activation:film-model-download:report'], 'tsx server/cli/activation-film-model-download-report.ts')
assert.equal(packageJson.scripts['smoke:activation-film-model-download'], 'tsx server/smoke/activation-film-model-download-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_film_style_saved_model_source',
    'apache_2_license',
    'private_gcs_prefix',
    'confirmation_required',
    'checksum_manifest',
    'download_report_gates',
    'false_runtime_slowmotion_video_launch_gates',
    'package_scripts',
  ],
  status: report.downloadEvidence.status,
}))
