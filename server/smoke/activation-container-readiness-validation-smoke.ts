import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildContainerReadinessCommandPlans,
  buildContainerReadinessReport,
  containerReadinessImageExpectations,
  containerReadinessImageOrder,
  getExpectedToolsForImage,
  parseContainerReadinessLog,
  validateContainerReadinessCommandPlan,
} from '../activation'
import type {
  ContainerReadinessCommandPlan,
  ContainerReadinessImageId,
} from '../activation'
import { assertRevideoReadinessBlocked } from '../workers/production-readiness'

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

function toolIds(imageId: ContainerReadinessImageId): string[] {
  return getExpectedToolsForImage(imageId).map((tool) => tool.toolId)
}

for (const imageId of containerReadinessImageOrder) {
  assert.ok(getExpectedToolsForImage(imageId).length > 0, `expected tools must exist for ${imageId}.`)
}

assert.ok(toolIds('api').includes('node-runtime'), 'API image must expect Node runtime.')
assert.ok(toolIds('tool-readiness-worker').includes('readiness-scripts'), 'tool-readiness image must expect readiness scripts.')
assert.ok(toolIds('cpu-worker').includes('ffmpeg'), 'CPU image must expect ffmpeg.')
assert.ok(toolIds('qa-worker').includes('opencv-python-headless'), 'QA image must expect OpenCV.')
assert.ok(toolIds('render-worker').includes('remotion'), 'render image must expect Remotion.')
assert.ok(toolIds('gpu-worker').includes('model-weight-directories'), 'GPU image must track model-weight directory readiness.')

const apiTools = toolIds('api').join('\n')
assert.ok(!/ffmpeg|ffprobe|torch|cuda|model-weight|revideo/i.test(apiTools), 'API image expected tools must not include heavy media/GPU/model/Revideo tools.')

const renderExpectation = containerReadinessImageExpectations.find((expectation) => expectation.imageId === 'render-worker')
assert.ok(renderExpectation?.forbiddenTools.includes('revideo'), 'render image must forbid Revideo.')

const gpuExpectation = containerReadinessImageExpectations.find((expectation) => expectation.imageId === 'gpu-worker')
assert.ok(gpuExpectation?.heavy, 'GPU image must be heavy.')
assert.ok(gpuExpectation?.optionalForNonGpuStaging, 'GPU image must be optional/deferred for non-GPU staging.')
assert.ok(gpuExpectation?.requiredForGpuPhase, 'GPU image must remain required for GPU/model phases.')

const commandPlans = buildContainerReadinessCommandPlans('staging-test-001')
assert.equal(commandPlans.length, 8, 'command plans must include static, six images, and all-images readiness.')
assert.ok(commandPlans.some((plan) => plan.commandId === 'readiness_static'), 'static readiness command plan must exist.')
for (const imageId of containerReadinessImageOrder) {
  assert.ok(commandPlans.some((plan) => plan.imageId === imageId), `command plan must exist for ${imageId}.`)
}
assert.ok(commandPlans.some((plan) => plan.imageId === 'all-images'), 'all-images readiness command plan must exist.')

for (const plan of commandPlans) {
  const policyCheck = validateContainerReadinessCommandPlan(plan)
  assert.equal(policyCheck.allowed, true, `${plan.commandId} must pass readiness command policy: ${policyCheck.blockers.join('; ')}`)
  assert.ok(plan.requiredEnvVars.includes('REEDITPRO_CONFIRM_CONTAINER_READINESS=true'), `${plan.commandId} must require readiness confirmation.`)
  assert.equal(plan.requiresHumanConfirmation, true, `${plan.commandId} must require human confirmation.`)
  assert.ok(!/\bdocker\s+build\b|\bdocker\s+push\b|\bdocker\s+compose\b|\bdocker-compose\b/i.test(plan.commandString), `${plan.commandId} must not build/push/compose Docker.`)
  assert.ok(!/\bgcloud\b|\bcloud\s+run\b|\bdeploy\b/i.test(plan.commandString), `${plan.commandId} must not include gcloud/deploy.`)
  assert.ok(!/provider\s+call|stripe|runway|replicate|openai|gemini/i.test(plan.commandString), `${plan.commandId} must not include provider calls.`)
  assert.ok(!/huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download/i.test(plan.commandString), `${plan.commandId} must not include model downloads.`)
}

const unsafeCommandPlan: ContainerReadinessCommandPlan = {
  ...commandPlans[0],
  commandId: 'unsafe_readiness',
  commandString: 'docker push image && gcloud run deploy service',
}
assert.equal(validateContainerReadinessCommandPlan(unsafeCommandPlan).allowed, false, 'policy must block docker push/gcloud/deploy command examples.')

const passedLog = parseContainerReadinessLog('ffmpeg version check passed\nreadiness passed', 'cpu-worker-readiness.log')
assert.equal(passedLog.parsedStatus, 'passed', 'parser must detect passed readiness log.')
assert.equal(passedLog.imageId, 'cpu-worker', 'parser must infer cpu-worker image.')

const missingLog = parseContainerReadinessLog('ffprobe command not found', 'cpu-worker-readiness.log')
assert.equal(missingLog.parsedStatus, 'failed', 'parser must detect missing tool log.')

const modelBlockedLog = parseContainerReadinessLog('model-weight-directories model_weight_blocked', 'gpu-worker-readiness.log')
assert.equal(modelBlockedLog.parsedStatus, 'blocked', 'parser must detect model_weight_blocked log.')

const manualReviewLog = parseContainerReadinessLog('libass pending_manual_review', 'render-worker-readiness.log')
assert.equal(manualReviewLog.parsedStatus, 'warning', 'parser must detect pending_manual_review log.')

const forbiddenLog = parseContainerReadinessLog('signedUrl rawPrompt secretValue', 'api-readiness.log')
assert.equal(forbiddenLog.parsedStatus, 'blocked', 'parser must detect forbidden signed URL/raw prompt/secret text.')
assert.ok(forbiddenLog.forbiddenFindings.length >= 3, 'forbidden findings must surface signed URL, raw prompt, and secret text.')

const defaultReport = buildContainerReadinessReport({
  imageTag: 'staging-test-001',
  createdAt: '2026-05-27T00:00:00.000Z',
})
assert.equal(defaultReport.phase23Readiness.readyForArtifactRegistryPush, false, 'Phase 23 must block when required readiness evidence is missing.')
assert.equal(defaultReport.phase22Readiness.gpuReadinessRequired, false, 'Phase 22 must not require GPU readiness.')
assert.equal(defaultReport.phase22Readiness.readyForGcpStagingFoundationSetup, true, 'Phase 22 setup readiness should not be blocked by missing readiness logs alone.')
assert.ok(defaultReport.phase23Readiness.optionalImagesDeferred.includes('gpu-worker'), 'GPU deferral should be recorded for non-GPU staging.')

const nonGpuLogs = (['api', 'tool-readiness-worker', 'cpu-worker', 'qa-worker', 'render-worker'] as const)
  .map((imageId) => parseContainerReadinessLog(passingReadinessLogFor(imageId), `${imageId}-readiness.log`))
const nonGpuReport = buildContainerReadinessReport({
  imageTag: 'staging-test-001',
  parsedLogs: nonGpuLogs,
  createdAt: '2026-05-27T00:00:00.000Z',
})
assert.equal(nonGpuReport.phase23Readiness.readyForArtifactRegistryPush, true, 'Phase 23 should allow non-GPU image push readiness when non-GPU evidence passes and GPU is deferred.')
assert.ok(nonGpuReport.phase23Readiness.optionalImagesDeferred.includes('gpu-worker'), 'GPU deferral warning must remain for non-GPU staging.')

assert.equal(defaultReport.productionReadyAllowed, false, 'Report must not allow production readiness.')
assert.equal(defaultReport.externalBetaAllowed, false, 'Report must not allow external beta.')
assert.equal(defaultReport.realUserMediaTestingAllowed, false, 'Report must not allow real user media testing.')
assert.equal(defaultReport.dockerExecuted, false, 'Report must not mark Docker executed.')
assert.equal(defaultReport.gcloudExecuted, false, 'Report must not mark gcloud executed.')
assert.equal(defaultReport.providerExecuted, false, 'Report must not mark provider execution.')
assert.equal(defaultReport.modelDownloadExecuted, false, 'Report must not mark model downloads.')
assert.equal(defaultReport.mediaProcessingExecuted, false, 'Report must not mark media processing.')

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['activation:container-readiness:plan'], 'package.json must include activation:container-readiness:plan.')
assert.ok(packageJson.scripts['activation:container-readiness:report'], 'package.json must include activation:container-readiness:report.')
assert.ok(packageJson.scripts['smoke:activation-container-readiness-validation'], 'package.json must include smoke:activation-container-readiness-validation.')
const readinessScripts = [
  packageJson.scripts['activation:container-readiness:plan'],
  packageJson.scripts['activation:container-readiness:report'],
  packageJson.scripts['smoke:activation-container-readiness-validation'],
].join('\n')
assert.ok(!/\bdocker\b|\bgcloud\b|huggingface-cli|snapshot_download|from_pretrained|provider\s+call/i.test(readinessScripts), 'Phase 21 npm scripts must not run Docker/GCP/model/provider commands automatically.')

assertRevideoReadinessBlocked()

console.log(JSON.stringify({
  ok: true,
  checks: [
    'expected_tools_all_images',
    'api_lightweight',
    'render_revideo_forbidden',
    'gpu_deferred_for_non_gpu_staging',
    'command_plans_static_and_all_images',
    'confirmation_env_required',
    'parser_pass_missing_manual_model_forbidden',
    'phase22_does_not_require_gpu',
    'phase23_requires_non_gpu_evidence',
    'report_execution_flags_false',
    'package_scripts_static_only',
    'revideo_evaluation_only',
  ],
}))

function passingReadinessLogFor(imageId: ContainerReadinessImageId): string {
  return [
    `image: reeditpro-${imageId}:staging-test-001`,
    `digest: sha256:${'a'.repeat(64)}`,
    ...getExpectedToolsForImage(imageId)
      .filter((tool) => tool.requiredForPhase23)
      .map((tool) => `${tool.displayName} version check passed`),
    'readiness passed',
  ].join('\n')
}
