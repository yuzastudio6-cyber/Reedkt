import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  APPROVED_MODEL_REPO_ID,
  MODEL_DOWNLOAD_LOCAL_DIR,
  buildAggregateChecksum,
  buildModelDownloadExecutionCommandPlans,
  buildModelDownloadReport,
  buildModelGcsUploadPlan,
  buildModelTreeManifest,
  evidenceHasChecksum,
  getApprovedModelDownloadEvidence,
  isApprovedModelRepo,
  isPathInsideRepo,
  validateModelDownloadPreflight,
  validateModelGcsStoragePath,
} from '../activation/model-download'

assert.equal(APPROVED_MODEL_REPO_ID, 'Systran/faster-whisper-tiny')
assert.equal(isApprovedModelRepo('Systran/faster-whisper-tiny'), true)
assert.equal(isApprovedModelRepo('Systran/faster-whisper-base'), false)
assert.equal(isApprovedModelRepo('facebook/sam2'), false)
assert.equal(isPathInsideRepo('/Users/macuser/Documents/REeditpro-phase26b/model.bin'), true)
assert.equal(isPathInsideRepo(MODEL_DOWNLOAD_LOCAL_DIR), false)

const preflight = validateModelDownloadPreflight({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  authenticatedAccount: 'aiediting@reeditpro.com',
  env: 'staging',
  confirmation: 'true',
  bucketName: 'reeditpro-staging-reeditpro-generated-assets',
  repoId: 'Systran/faster-whisper-tiny',
  repoPath: MODEL_DOWNLOAD_LOCAL_DIR,
})
assert.equal(preflight.allowed, true, 'valid preflight must be allowed.')
assert.ok(validateModelDownloadPreflight({ repoId: 'Systran/faster-whisper-base' }).blockers.length > 0, 'larger Whisper model must be blocked.')
assert.ok(validateModelDownloadPreflight({ env: 'production' }).blockers.length > 0, 'production env must be blocked.')
assert.ok(validateModelDownloadPreflight({ repoPath: '/Users/macuser/Documents/REeditpro/model.bin' }).blockers.length > 0, 'repo-local model path must be blocked.')

const checksumManifest = buildModelTreeManifest({
  repoId: 'Systran/faster-whisper-tiny',
  resolvedRevision: 'd90ca5fe260221311c53c58e660288d3deb8d356',
  files: [
    { relativePath: 'config.json', sha256: 'a'.repeat(64), sizeBytes: 10 },
    { relativePath: 'model.bin', sha256: 'b'.repeat(64), sizeBytes: 20 },
  ],
})
assert.equal(checksumManifest.fileCount, 2)
assert.equal(checksumManifest.totalSizeBytes, 30)
assert.equal(checksumManifest.aggregateSha256, buildAggregateChecksum(checksumManifest.files))

const evidence = getApprovedModelDownloadEvidence()
if (evidence.status === 'verified') {
  assert.equal(evidenceHasChecksum(evidence), true, 'verified evidence must include aggregate checksum.')
  assert.equal(evidence.repoId, 'Systran/faster-whisper-tiny')
  assert.ok(evidence.stagingStoragePath.includes('model-weights/faster-whisper/tiny/'))
}

assert.deepEqual(validateModelGcsStoragePath('gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/'), [])
assert.ok(validateModelGcsStoragePath('gs://reeditpro-staging-reeditpro-source-media/model-weights/faster-whisper/tiny/').length > 0)

const uploadPlan = buildModelGcsUploadPlan()
assert.ok(uploadPlan.commandString.includes('gcloud storage rsync'))
assert.equal(uploadPlan.requiresConfirmation, true)
assert.ok(!/signed-url|allUsers|gcloud\s+run|deploy/i.test(uploadPlan.commandString))

const executionPlans = buildModelDownloadExecutionCommandPlans()
assert.ok(executionPlans.some((plan) => plan.phase === 'download'))
assert.ok(executionPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(executionPlans.every((plan) => !/Systran\/faster-whisper-base|birefnet|sam2|deepfilternet|demucs|real-esrgan|film/i.test(plan.commandString)))

const report = buildModelDownloadReport()
assert.equal(report.downloadEvidence.repoId, 'Systran/faster-whisper-tiny')
assert.equal(report.providerExecuted, false)
assert.equal(report.gpuDeployed, false)
assert.equal(report.realUserMediaProcessed, false)
assert.equal(report.secretValuesCreated, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.realUserMediaTestingAllowed, false)
assert.equal(report.phase28Readiness.readyForExecution, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['smoke:activation-model-download'])
assert.ok(packageJson.scripts['activation:model-download:plan'])
assert.ok(packageJson.scripts['activation:model-download:report'])
const scriptText = [
  packageJson.scripts['smoke:activation-model-download'],
  packageJson.scripts['activation:model-download:plan'],
  packageJson.scripts['activation:model-download:report'],
].join('\n')
assert.ok(!/huggingface-cli|snapshot_download|gcloud\s+storage|pip install|docker|gcloud\s+run/i.test(scriptText), 'npm scripts must be static/report-only.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_model_only',
    'temp_path_outside_repo',
    'preflight_guards',
    'checksum_manifest',
    'private_gcs_path',
    'execution_plans_text_only',
    'false_launch_gates',
    'package_scripts_static',
  ],
}))
