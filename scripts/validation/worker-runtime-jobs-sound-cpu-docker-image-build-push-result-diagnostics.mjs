#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_docker_image_build_push_result_completed_with_blockers_ready_for_cloud_run_job_deployment_plan'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_gcp_iam_role_binding_result_completed_with_blockers_ready_for_docker_image_build_push_plan'
const SOURCE_HEAD = '556cd5fb538379ebbecf58fde92a9034d836931c'
const TAG = 'source-556cd5fb5'
const DIGEST = 'sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b'
const SCRIPT_NAME = 'worker-runtime-jobs:sound-cpu-docker-image-build-push-result:diagnostics'

const DOCS = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-docker-image-build-push-result.md',
    label: 'worker-runtime-jobs-sound-cpu-docker-image-build-push-result',
  },
  build: {
    path: 'docs/worker-runtime-jobs-sound-cpu-docker-image-build-register.md',
    label: 'worker-runtime-jobs-sound-cpu-docker-image-build-register',
  },
  push: {
    path: 'docs/worker-runtime-jobs-sound-cpu-docker-image-push-register.md',
    label: 'worker-runtime-jobs-sound-cpu-docker-image-push-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-docker-image-remaining-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-docker-image-remaining-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-docker-image-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-docker-image-claim-policy',
  },
}

const DIRECT_PACKAGES = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(file) {
  assert(existsSync(file), `Missing required file: ${file}`)
  return readFileSync(file, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```'))
  assert(match, `Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`)
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`)
}

const parsed = Object.fromEntries(
  Object.entries(DOCS).map(([key, info]) => [key, parseBlock(info.path, info.label)]),
)

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  assert(doc.decision === DECISION, `${key} decision mismatch`)
}

const source = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-result.md',
  'worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-result',
)
assert(source.decision === SOURCE_DECISION, 'source IAM decision mismatch')
assert(source.result.minimalProjectIamRolesBound === true, 'source IAM roles missing')
assert(source.result.soundCpuAnalysisImageExists === false, 'source should not preclaim analysis image')
assert(source.result.soundAudioMetadataImageExists === false, 'source should not preclaim metadata image')

const result = parsed.result
assert(result.sourceEvidence.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceEvidence.sourcePr === 2411, 'source PR mismatch')
assert(result.sourceEvidence.sourceMergeCommit === SOURCE_HEAD, 'source merge mismatch')
assert(result.imageResult.tag === TAG, 'tag mismatch')
assert(result.imageResult.analysisDigest === DIGEST, 'analysis digest mismatch')
assert(result.imageResult.metadataDigest === DIGEST, 'metadata digest mismatch')
assert(result.imageResult.localImageId === DIGEST, 'local image id mismatch')
assert(result.imageResult.localImageSizeBytes === 510782338, 'local image size mismatch')
assert(result.imageResult.artifactRegistryTagsPresent === true, 'registry tags missing')
assert(result.imageResult.artifactRegistryDigestsPresent === true, 'registry digest missing')
assert(result.imageResult.cloudRunJobsPresent === false, 'Cloud Run jobs must stay absent')
assert(result.toolInstallEvidence.directPinnedPackageCount === 13, 'direct package count mismatch')
for (const pkg of DIRECT_PACKAGES) {
  assert(result.toolInstallEvidence.directPinnedPackages.includes(pkg), `missing direct package ${pkg}`)
}
assert(result.toolInstallEvidence.aliasCoveredTools.includes('pydub_effects'), 'pydub_effects alias missing')
assert(result.toolInstallEvidence.aliasCoveredTools.includes('ebu_r128_pyloudnorm'), 'ebu_r128 alias missing')
assert(result.toolInstallEvidence.allFifteenToolsImageInstalled === true, 'image install claim missing')
assert(result.toolInstallEvidence.allFifteenToolsCloudExecutableNow === false, 'cloud executable claim widened')
assert(result.result.soundCpuAnalysisImagePushed === true, 'analysis push result missing')
assert(result.result.soundAudioMetadataImagePushed === true, 'metadata push result missing')
for (const key of [
  'soundCpuAnalysisCloudRunJobExists',
  'soundAudioMetadataCloudRunJobExists',
  'cloudRunControlledExecutionPassed',
  'agentCloudToolCallPassed',
  'externalBetaReadyNow',
]) {
  assert(result.result[key] === false, `${key} must stay false`)
}

const mutation = result.boundedDockerAndRegistryMutation
assert(mutation.dockerBuildExecuted === true, 'docker build should be true')
assert(mutation.dockerPushExecuted === true, 'docker push should be true')
for (const key of [
  'dockerRunExecuted',
  'cloudRunDeploymentExecuted',
  'cloudRunJobExecuted',
  'gcpCloudRunExecutionEnabled',
  'workerExecutionEnabled',
  'routeExecutionEnabled',
  'mediaProcessingEnabled',
  'supabaseMutationEnabled',
  'artifactWriteEnabled',
  'externalBetaUnlocked',
  'productionUnlocked',
]) {
  assert(mutation[key] === false, `${key} must stay false`)
}

const build = parsed.build
assert(build.build.sourceHead === SOURCE_HEAD, 'build source head mismatch')
assert(build.build.tag === TAG, 'build tag mismatch')
assert(build.build.buildPassed === true, 'build pass missing')
assert(build.build.dockerRunExecuted === false, 'docker run must be false')
for (const pkg of DIRECT_PACKAGES) {
  assert(build.installedPinnedPackages.some((entry) => entry.startsWith(`${pkg}==`)), `missing pinned package ${pkg}`)
}
assert(build.aliasCoverage.pydub_effects === 'covered_by_pydub', 'pydub alias coverage mismatch')
assert(build.aliasCoverage.ebu_r128_pyloudnorm === 'covered_by_pyloudnorm', 'pyloudnorm alias coverage mismatch')

const push = parsed.push
assert(push.artifactRegistry.projectId === 'reeditpro', 'registry project mismatch')
assert(push.artifactRegistry.region === 'us-central1', 'registry region mismatch')
assert(push.pushedImages.length === 2, 'pushed image count mismatch')
for (const image of push.pushedImages) {
  assert(image.tag === TAG, `${image.logicalWorker} tag mismatch`)
  assert(image.digest === DIGEST, `${image.logicalWorker} digest mismatch`)
  assert(image.tagReadbackPresent === true, `${image.logicalWorker} tag readback missing`)
}
assert(push.cloudRunJobsReadback.soundCpuAnalysisWorkerJobPresent === false, 'analysis job should be absent')
assert(push.cloudRunJobsReadback.soundAudioMetadataWorkerJobPresent === false, 'metadata job should be absent')

const blockers = parsed.blockers
assert(blockers.closedByThisGate.includes('sound_cpu_analysis_image_not_pushed'), 'analysis closed blocker missing')
assert(blockers.closedByThisGate.includes('sound_audio_metadata_image_not_pushed'), 'metadata closed blocker missing')
assert(blockers.closedByThisGate.includes('fifteen_sound_cpu_tools_not_present_in_cloud_image'), 'tool image blocker missing')
for (const blocker of [
  'sound_cpu_cloud_run_jobs_not_deployed',
  'cloud_run_jobs_not_executed',
  'agent_cloud_tool_call_not_verified',
  'external_beta_not_ready',
]) {
  assert(blockers.blockingBeforeCloudExecution.some((entry) => entry.blocker === blocker), `missing blocker ${blocker}`)
}

const claims = parsed.claims
assert(claims.allowedClaims.dockerImageBuildPassed === true, 'docker build allowed claim missing')
assert(claims.allowedClaims.dockerImagePushPassed === true, 'docker push allowed claim missing')
assert(claims.allowedClaims.allFifteenToolsImageInstalled === true, 'fifteen tool image claim missing')
assert(claims.acceptedForToday.dockerBuild === 'yes', 'docker build accepted claim mismatch')
assert(claims.acceptedForToday.dockerPush === 'yes', 'docker push accepted claim mismatch')
for (const [key, value] of Object.entries(claims.acceptedForToday)) {
  if (key === 'dockerBuild' || key === 'dockerPush') continue
  assert(value === 'no', `${key} must stay no`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-plan.md')
assert(promptText.includes(DECISION), 'Cloud Run deployment prompt missing source decision')
assert(promptText.includes('no job execution'), 'Cloud Run deployment prompt must block execution')
assert(promptText.includes(DIGEST), 'Cloud Run deployment prompt missing digest')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[SCRIPT_NAME] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-docker-image-build-push-result-diagnostics.mjs',
  'package script missing',
)

console.log(`${SCRIPT_NAME}: ok`)
