import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  artifactPushImageOrder,
  buildArtifactImageDigestSummary,
  buildArtifactImageManifest,
  buildArtifactPushCommandPlans,
  buildArtifactPushReport,
  parseArtifactPushLog,
  validateArtifactImageTag,
} from '../activation'

const input = {
  project: 'reeditpro',
  artifactRegion: 'us-central1',
  repository: 'reeditpro-staging-workers',
  imageTag: 'staging-local-001',
}

const manifest = buildArtifactImageManifest(input)
assert.deepEqual(artifactPushImageOrder, ['api', 'tool-readiness-worker', 'cpu-worker', 'qa-worker', 'render-worker', 'gpu-worker'])
assert.equal(manifest.length, 6, 'manifest must include all six image roles.')
for (const imageId of ['api', 'tool-readiness-worker', 'cpu-worker', 'qa-worker', 'render-worker']) {
  const entry = manifest.find((candidate) => candidate.imageId === imageId)
  assert.ok(entry, `${imageId} manifest entry must exist.`)
  assert.ok(entry.targetFullImageName.includes('/reeditpro-staging-workers/reeditpro-staging-'), `${imageId} must target staging image name.`)
  assert.equal(entry.deferred, false, `${imageId} must not be deferred.`)
}
assert.equal(manifest.find((entry) => entry.imageId === 'gpu-worker')?.deferred, true, 'GPU image must be deferred.')

for (const invalidTag of ['', 'latest', 'prod', 'production', 'manual-not-set', 'bad;tag', 'bad tag', 'bad$(tag)']) {
  assert.equal(validateArtifactImageTag(invalidTag).allowed, false, `${invalidTag || 'empty'} must be rejected.`)
}
assert.equal(validateArtifactImageTag('staging-local-001').allowed, true, 'staging-local-001 must be accepted.')

const commandPlans = buildArtifactPushCommandPlans(input)
assert.equal(commandPlans.length, 6, 'command plan must include six roles including deferred GPU.')
for (const plan of commandPlans) {
  assert.equal(plan.requiresHumanConfirmation, true, `${plan.commandId} must require confirmation.`)
  assert.equal(plan.confirmationEnvVar, 'REEDITPRO_CONFIRM_ARTIFACT_PUSH')
  assert.ok(!/gcloud\s+run|deploy|provider\s+call|huggingface-cli|snapshot_download|from_pretrained|\/uploads\/|SECRET_VALUE/i.test(plan.commandString), `${plan.commandId} must not contain forbidden behavior.`)
}
assert.ok(!/docker\s+push/i.test(commandPlans.find((plan) => plan.imageId === 'gpu-worker')?.commandString ?? ''), 'GPU command plan must not push.')
assert.ok(commandPlans.filter((plan) => !plan.deferred).every((plan) => /docker tag .* docker push/i.test(plan.commandString)), 'non-GPU plans must include tag and push text.')

const successLog = 'The push refers to repository [us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-api]\\nstaging-local-001: digest: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa size: 1234'
const parsedSuccess = parseArtifactPushLog(successLog, 'api-push.log')
assert.equal(parsedSuccess.parsedStatus, 'pushed', 'parser must detect successful push digest.')
assert.equal(parsedSuccess.imageId, 'api')
assert.equal(parsedSuccess.detectedDigest, 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
assert.equal(parseArtifactPushLog('denied: Permission denied', 'api-push.log').parsedStatus, 'failed', 'parser must detect push failure.')
assert.equal(parseArtifactPushLog('docker push reeditpro-staging-gpu-worker:staging-local-001', 'gpu-push.log').parsedStatus, 'blocked', 'parser must block GPU push.')
assert.equal(parseArtifactPushLog('gcloud run deploy service', 'api-push.log').parsedStatus, 'blocked', 'parser must block deploy signal.')

const digestEvidence = ['api', 'tool-readiness-worker', 'cpu-worker', 'qa-worker', 'render-worker'].map((imageId) => ({
  imageId: imageId as 'api',
  targetFullImageName: manifest.find((entry) => entry.imageId === imageId)?.targetFullImageName ?? '',
  digest: `sha256:${imageId.padEnd(64, 'a').slice(0, 64)}`,
  verified: true,
  source: 'artifact_registry' as const,
  warnings: [],
}))
const report = buildArtifactPushReport({
  ...input,
  parsedLogs: [
    { logPath: 'api-push.log', parsedLog: parsedSuccess },
    { logPath: 'tool-readiness-worker-push.log', parsedLog: parseArtifactPushLog(successLog.replace(/api/g, 'tool-readiness-worker'), 'tool-readiness-worker-push.log') },
    { logPath: 'cpu-worker-push.log', parsedLog: parseArtifactPushLog(successLog.replace(/api/g, 'cpu-worker'), 'cpu-worker-push.log') },
    { logPath: 'qa-worker-push.log', parsedLog: parseArtifactPushLog(successLog.replace(/api/g, 'qa-worker'), 'qa-worker-push.log') },
    { logPath: 'render-worker-push.log', parsedLog: parseArtifactPushLog(successLog.replace(/api/g, 'render-worker'), 'render-worker-push.log') },
  ],
  digestEvidence,
})
assert.equal(report.phase24Readiness.readyForNonGpuStagingDeploy, true, 'Phase 24B should be ready when all non-GPU pushes and digests are verified.')
assert.equal(report.phase27Readiness.readyForGpuStaging, false, 'Phase 27 must remain blocked because GPU is deferred.')
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.realUserMediaTestingAllowed, false)
assert.equal(report.deploymentExecuted, false)
assert.equal(report.dockerBuildExecuted, false)
assert.equal(report.providerExecuted, false)
assert.equal(report.modelDownloadExecuted, false)
assert.equal(report.mediaProcessingExecuted, false)
assert.equal(report.secretValuesCreated, false)

const digestSummary = buildArtifactImageDigestSummary(digestEvidence)
assert.equal(digestSummary.requiredDigestsVerified, true, 'digest summary must pass with five non-GPU digests.')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['activation:artifact-push:plan'], 'package.json must include artifact push plan script.')
assert.ok(packageJson.scripts['activation:artifact-push:report'], 'package.json must include artifact push report script.')
assert.ok(packageJson.scripts['activation:image-digest:summary'], 'package.json must include image digest summary script.')
assert.ok(packageJson.scripts['smoke:activation-artifact-push-verification'], 'package.json must include artifact push smoke script.')
const staticScripts = [
  packageJson.scripts['activation:artifact-push:plan'],
  packageJson.scripts['activation:artifact-push:report'],
  packageJson.scripts['activation:image-digest:summary'],
  packageJson.scripts['smoke:activation-artifact-push-verification'],
].join('\n')
assert.ok(!/\bdocker\s+push\b|\bgcloud\b|\bdocker\s+tag\b|\bgcloud\s+run\b/i.test(staticScripts), 'npm scripts must not execute Docker push/tag or gcloud.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'manifest_non_gpu_targets',
    'gpu_deferred',
    'tag_policy',
    'command_plan_guarded',
    'parser_success_failure_forbidden',
    'phase24_ready_with_digests',
    'phase27_blocked',
    'false_launch_gates',
    'package_scripts_static',
  ],
}))
