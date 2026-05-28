import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildContainerBuildCommandPlans,
  buildContainerBuildReport,
  buildContainerBuildResultFromParsedLog,
  containerBuildImageOrder,
  containerImageBuildPlans,
  getContainerImageBuildPlan,
  parseContainerBuildLog,
  validateContainerBuildCommandPlan,
  validateContainerImageTag,
  validateDockerfileText,
} from '../activation/container-build'
import type { ContainerBuildResult } from '../activation/container-build'
import { getGpuRequiredTools, getToolsWithModelWeights } from '../tool-registry'
import { assertRevideoReadinessBlocked } from '../workers/production-readiness'

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

const imageIds = containerImageBuildPlans.map((plan) => plan.imageId)
assert.ok(imageIds.includes('api'), 'image plan must include api.')
assert.ok(imageIds.includes('tool-readiness-worker'), 'image plan must include tool-readiness-worker.')
assert.ok(imageIds.includes('cpu-worker'), 'image plan must include cpu-worker.')
assert.ok(imageIds.includes('qa-worker'), 'image plan must include qa-worker.')
assert.ok(imageIds.includes('render-worker'), 'image plan must include render-worker.')
assert.ok(imageIds.includes('gpu-worker'), 'image plan must include gpu-worker.')
assert.deepEqual(imageIds, containerBuildImageOrder, 'build order must be api, tool-readiness, cpu, qa, render, gpu.')

for (const plan of containerImageBuildPlans) {
  assert.ok(plan.dockerfilePath.startsWith('docker/prod/'), `${plan.imageId} Dockerfile path must stay under docker/prod.`)
  assert.equal(plan.modelDownloadsAllowed, false, `${plan.imageId} must not allow model downloads.`)
  assert.equal(plan.secretsAllowed, false, `${plan.imageId} must not allow secrets.`)
  assert.equal(plan.revideoAllowed, false, `${plan.imageId} must not allow Revideo.`)
  assert.ok(plan.forbiddenTools.includes('revideo'), `${plan.imageId} must forbid Revideo.`)
}

for (const tag of ['latest', 'prod', 'production', 'manual-not-set', '']) {
  assert.equal(validateContainerImageTag(tag).allowed, false, `invalid image tag must be rejected: ${tag || '(empty)'}`)
}
assert.equal(validateContainerImageTag('staging-test-001').allowed, true, 'explicit safe tag should be accepted.')
assert.throws(() => buildContainerBuildCommandPlans(''), /Invalid REEDITPRO_IMAGE_TAG/, 'command plan must require explicit image tag.')

const commandPlans = buildContainerBuildCommandPlans('staging-test-001')
assert.equal(commandPlans.length, 6, 'command plan must include six image builds.')
for (const commandPlan of commandPlans) {
  assert.equal(validateContainerBuildCommandPlan(commandPlan).allowed, true, `${commandPlan.commandId} must pass policy.`)
  assert.equal(commandPlan.requiresHumanConfirmation, true, `${commandPlan.commandId} must require human confirmation.`)
  assert.ok(commandPlan.commandString.startsWith('docker build -f docker/prod/'), `${commandPlan.commandId} should be a build command string only.`)
  assert.ok(!/docker\s+push/i.test(commandPlan.commandString), `${commandPlan.commandId} must not include docker push.`)
  assert.ok(!/\bgcloud\b/i.test(commandPlan.commandString), `${commandPlan.commandId} must not include gcloud.`)
  assert.ok(!/provider\s+call|stripe|runway|replicate|openai|gemini/i.test(commandPlan.commandString), `${commandPlan.commandId} must not include provider calls.`)
  assert.ok(!/huggingface-cli|snapshot_download|from_pretrained|download\s+model/i.test(commandPlan.commandString), `${commandPlan.commandId} must not include model downloads.`)
  assert.ok(!/\bsk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|service[_-]?role|secret\s+value|-----BEGIN/i.test(commandPlan.commandString), `${commandPlan.commandId} must not include secrets.`)
  assert.ok(!/\/uploads\/|user[-_\s]?media|\.mp4\b|\.mov\b|\.mkv\b|\.wav\b/i.test(commandPlan.commandString), `${commandPlan.commandId} must not include media processing paths.`)
}

const gpuPlan = getContainerImageBuildPlan('gpu-worker')
assert.ok(gpuPlan?.heavyBuild, 'GPU image must be marked heavy.')
assert.ok(gpuPlan?.optionalForNonGpuStaging, 'GPU image must be optional for non-GPU staging.')
assert.ok(gpuPlan?.requiredForGpuPhase, 'GPU image must remain required for GPU phase.')
assert.ok(gpuPlan?.notes.join(' ').includes('L4'), 'GPU image must document L4 target later.')
assert.ok(!gpuPlan?.notes.join(' ').includes('RTX PRO 6000 is used by default'), 'GPU image must not use RTX PRO 6000 as default.')

const gpuAndModelTools = new Set([
  ...getGpuRequiredTools().map((profile) => profile.toolId),
  ...getToolsWithModelWeights().map((profile) => profile.toolId),
])
for (const imageId of ['api', 'cpu-worker', 'render-worker'] as const) {
  const plan = getContainerImageBuildPlan(imageId)
  assert.ok(plan, `${imageId} plan must exist.`)
  assert.ok([...gpuAndModelTools].some((tool) => plan?.forbiddenTools.includes(tool)), `${imageId} must forbid GPU/model tools.`)
}

assert.equal(validateDockerfileText('RUN npm install revideo', 'test').allowed, false, 'Policy must block Revideo core install.')
assert.equal(validateDockerfileText('RUN huggingface-cli download model', 'test').allowed, false, 'Policy must block model downloads.')
assert.equal(validateDockerfileText('RUN echo sk-1234567890abcdef', 'test').allowed, false, 'Policy must block secret-looking text.')

const successLog = parseContainerBuildLog([
  'Step 12/12 : exporting layers',
  'writing image sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'naming to reeditpro-api:staging-test-001',
].join('\n'), 'api-build.log')
assert.equal(successLog.parsedStatus, 'passed', 'log parser must detect successful build text.')
assert.equal(successLog.imageId, 'api', 'log parser must infer api image.')

const failedLog = parseContainerBuildLog('failed to solve: npm ERR! package not found', 'api-build.log')
assert.equal(failedLog.parsedStatus, 'failed', 'log parser must detect failed build text.')

const modelDownloadLog = parseContainerBuildLog('RUN python -c "from_pretrained()"', 'gpu-worker.log')
assert.equal(modelDownloadLog.parsedStatus, 'blocked', 'log parser must detect model download attempts.')
assert.ok(modelDownloadLog.forbiddenFindings.some((finding) => finding.includes('model-download')), 'model download finding must be surfaced.')

const secretLog = parseContainerBuildLog('RUN echo sk-1234567890abcdef', 'api.log')
assert.equal(secretLog.parsedStatus, 'blocked', 'log parser must detect secret-looking text.')

const revideoLog = parseContainerBuildLog('RUN npm install revideo', 'render-worker.log')
assert.equal(revideoLog.parsedStatus, 'blocked', 'log parser must detect Revideo install.')

const deployLog = parseContainerBuildLog('RUN gcloud run deploy service', 'api.log')
assert.equal(deployLog.parsedStatus, 'blocked', 'log parser must detect gcloud/deploy commands.')

const providerMediaLog = parseContainerBuildLog('provider call runway with user media sample.mp4', 'cpu-worker.log')
assert.equal(providerMediaLog.parsedStatus, 'blocked', 'log parser must detect provider/media signals.')

const defaultReport = buildContainerBuildReport({ imageTag: 'staging-test-001', createdAt: '2026-05-27T00:00:00.000Z' })
assert.equal(defaultReport.phase21Readiness.readyForContainerReadinessValidation, false, 'Phase 21 must block when build evidence is missing.')
assert.ok(defaultReport.blockers.some((blocker) => blocker.id.startsWith('missing-build-evidence')), 'Missing build evidence must block Phase 21.')

const nonGpuPassedResults: ContainerBuildResult[] = (['api', 'tool-readiness-worker', 'cpu-worker', 'qa-worker', 'render-worker'] as const).map((imageId) => buildContainerBuildResultFromParsedLog({
  imageTag: 'staging-test-001',
  logPath: `${imageId}.log`,
  parsedLog: parseContainerBuildLog(`exporting layers\nnaming to reeditpro-${imageId}:staging-test-001`, `${imageId}.log`),
}))
const nonGpuReport = buildContainerBuildReport({
  imageTag: 'staging-test-001',
  buildResults: nonGpuPassedResults,
  createdAt: '2026-05-27T00:00:00.000Z',
})
assert.equal(nonGpuReport.phase21Readiness.readyForNonGpuContainerReadinessValidation, true, 'Non-GPU Phase 21 readiness should be allowed with non-GPU passing evidence.')
assert.ok(nonGpuReport.phase21Readiness.optionalImagesDeferred.includes('gpu-worker'), 'GPU image should be explicitly deferred when not built.')

assert.equal(defaultReport.dockerBuildExecuted, false, 'Report must not mark Docker build executed by default.')
assert.equal(defaultReport.dockerPushExecuted, false, 'Report must not mark Docker push executed.')
assert.equal(defaultReport.gcloudExecuted, false, 'Report must not mark gcloud executed.')
assert.equal(defaultReport.productionReadyAllowed, false, 'Report must not allow production readiness.')
assert.equal(defaultReport.externalBetaAllowed, false, 'Report must not allow external beta.')
assert.equal(defaultReport.realUserMediaTestingAllowed, false, 'Report must not allow real user media testing.')

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['activation:container-build:plan'], 'package.json must include activation:container-build:plan.')
assert.ok(packageJson.scripts['activation:container-build:report'], 'package.json must include activation:container-build:report.')
assert.ok(packageJson.scripts['smoke:activation-container-build-reporting'], 'package.json must include smoke:activation-container-build-reporting.')
const phase20Scripts = [
  packageJson.scripts['activation:container-build:plan'],
  packageJson.scripts['activation:container-build:report'],
  packageJson.scripts['smoke:activation-container-build-reporting'],
].join('\n')
assert.ok(!/docker\s+build|docker\s+push|\bgcloud\b|huggingface-cli|snapshot_download|from_pretrained/i.test(phase20Scripts), 'Phase 20 npm scripts must not run Docker/GCP/model commands automatically.')

assertRevideoReadinessBlocked()

console.log(JSON.stringify({
  ok: true,
  checks: [
    'image_plans_present',
    'build_order_locked',
    'dockerfile_paths_under_docker_prod',
    'invalid_tags_rejected',
    'command_plan_text_only',
    'gpu_heavy_optional_l4_later',
    'revideo_forbidden',
    'non_gpu_forbids_gpu_model_tools',
    'log_parser_success_failure_forbidden',
    'phase21_missing_evidence_blocked',
    'phase21_non_gpu_ready_with_gpu_deferred',
    'report_execution_flags_false',
    'package_scripts_static_only',
  ],
}))
