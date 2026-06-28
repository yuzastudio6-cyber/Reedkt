#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_plan_completed_with_warnings_ready_for_container_source_owner_review_no_media_no_docker_build'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_policy_closure_plan_completed_with_warnings_ready_for_container_source_plan_no_media_no_production'
const SOURCE_HEAD = '11e143256583676a2fe9b15950d433e82214a6f8'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-CONTAINER-SOURCE-OWNER-REVIEW: review FFmpeg/ffprobe/libass container source plan, no media/no Docker build'
const FUTURE_SOURCE_PATH = 'server/workers/sound-cpu/Dockerfile'
const OWNER_REVIEW_DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_owner_review_passed_with_warnings_ready_for_container_source_creation_no_media_no_docker_build'
const SOURCE_CREATION_DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_created_with_warnings_ready_for_static_validation_plan_no_media_no_docker_build'
const SOURCE_CREATION_RESULT =
  'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-creation-result.md'

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-plan',
  },
  path: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-path-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-path-register',
  },
  packagePolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-package-policy-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-package-policy-register',
  },
  staticValidation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan',
  },
  license: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-license-review-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-license-review-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-blocker-follow-up-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-claim-policy',
  },
  ownerPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-review',
  },
  staticPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-requirements.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-plan.md',
  'docker/prod/ffmpeg-lgpl-build-policy.md',
  'docker/prod/core-tool-version-policy.md',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/render-worker/Dockerfile',
  FUTURE_SOURCE_PATH,
  'package.json',
]

const MUST_BE_FALSE = [
  'actualDockerfileEditedToday',
  'dockerBuildRunPushApprovedToday',
  'mediaExecutionApprovedToday',
  'runtimeExecutionApprovedToday',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'acceptedForProductionReleaseToday',
  'productionReleaseApprovedToday',
  'dockerfileEdit',
  'dockerBuildRunPush',
  'runtimeExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'ffmpegMediaExecution',
  'ffprobeMediaExecution',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'productionUnlock',
  'ffmpegReady',
  'ffprobeReady',
  'libassReady',
  'launchCoreReadinessPassed',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function parseBlock(info) {
  const text = read(info.path)
  const marker = '```json ' + info.label
  const start = text.indexOf(marker)
  assert(start >= 0, `${info.path} missing fenced JSON label ${info.label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${info.path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value?.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value?.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value?.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function scanFalse(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanFalse(entry, trail.concat(String(index))))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (MUST_BE_FALSE.includes(key)) assert(child === false, `${trail.concat(key).join('.')} must remain false`)
    scanFalse(child, trail.concat(key))
  }
}

for (const file of SOURCE_FILES) read(file)

const source = read('docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan.md')
assert(source.includes(SOURCE_DECISION), 'source policy closure decision missing')

const soundCpuDockerfile = read(FUTURE_SOURCE_PATH)
const sourceCreationResultExists = existsSync(SOURCE_CREATION_RESULT) && read(SOURCE_CREATION_RESULT).includes(SOURCE_CREATION_DECISION)
assert(soundCpuDockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'SOUND CPU Dockerfile must retain disabled runtime flag')
if (!sourceCreationResultExists) {
  assert(!soundCpuDockerfile.includes('apt-get install --no-install-recommends -y ffmpeg'), 'SOUND CPU Dockerfile must not be edited to install ffmpeg in this plan')
  assert(!soundCpuDockerfile.includes('libass9'), 'SOUND CPU Dockerfile must not be edited to install libass in this plan')
}

const ffmpegPolicy = read('docker/prod/ffmpeg-lgpl-build-policy.md')
assert(ffmpegPolicy.includes('commercial LGPL verification remains pending manual review'), 'FFmpeg LGPL policy source mismatch')

const cpuDockerfile = read('docker/prod/cpu-worker/Dockerfile')
const renderDockerfile = read('docker/prod/render-worker/Dockerfile')
assert(cpuDockerfile.includes('ffmpeg'), 'CPU worker reference Dockerfile missing ffmpeg declaration')
assert(renderDockerfile.includes('ffmpeg'), 'Render worker reference Dockerfile missing ffmpeg declaration')
assert(renderDockerfile.includes('libass9'), 'Render worker reference Dockerfile missing libass declaration')
assert(renderDockerfile.includes('fonts-dejavu-core'), 'Render worker reference Dockerfile missing font package declaration')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const plan = parsed.plan
assert(plan.decision === DECISION, 'plan decision mismatch')
assert(plan.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(plan.sourceBase.policyClosurePr === 1510, 'source PR mismatch')
assert(plan.sourceBase.policyClosureDecision === SOURCE_DECISION, 'source decision mismatch')
assert(plan.planResult.futureSourcePath === FUTURE_SOURCE_PATH, 'future source path mismatch')
assert(plan.planResult.containerSourceOwnerReviewRequired === true, 'owner review requirement missing')
assert(plan.planResult.staticValidationRequiredAfterOwnerReview === true, 'static validation requirement missing')
assert(plan.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const pathRegister = parsed.path.futureSourcePath
assert(pathRegister.path === FUTURE_SOURCE_PATH, 'path register future source path mismatch')
assert(pathRegister.existsToday === true, 'future source file should exist today')
assert(pathRegister.editedToday === false, 'future source file must not be edited today')
for (const reference of ['docker/prod/ffmpeg-lgpl-build-policy.md', 'docker/prod/core-tool-version-policy.md', 'docker/prod/cpu-worker/Dockerfile', 'docker/prod/render-worker/Dockerfile']) {
  assert(parsed.path.referencePolicySources.includes(reference), `reference policy missing ${reference}`)
  assert(parsed.path.sourceFilesNotEditedToday.includes(reference) || reference.includes('policy'), `not-edited source missing ${reference}`)
}

const packagePolicy = parsed.packagePolicy.plannedSystemPackageSurface
assert(packagePolicy.ffmpegPackage.packageName === 'ffmpeg', 'ffmpeg package name mismatch')
assert(packagePolicy.ffmpegPackage.provides.includes('ffprobe'), 'ffmpeg package must cover ffprobe')
assert(packagePolicy.libassPackage.packageName === 'libass9', 'libass package mismatch')
assert(packagePolicy.fontSupportPackages.packageNames.includes('fontconfig'), 'fontconfig plan missing')
assert(packagePolicy.fontSupportPackages.packageNames.includes('fonts-dejavu-core'), 'font package plan missing')

const staticValidation = parsed.staticValidation.futureStaticValidationAfterSource
for (const key of ['dockerfileTextInspection', 'requiresFfmpegPackageDeclaration', 'requiresFfprobeAvailabilityViaFfmpegPackage', 'requiresLibassRuntimeDeclaration', 'requiresFontconfigAndFontPackageDeclaration', 'requiresRuntimeDisabledDefaultsPreserved', 'requiresNoMediaFixtures', 'requiresNoWorkerExecutionEntrypoint']) {
  assert(staticValidation[key] === true, `static validation flag ${key} missing`)
}

const license = parsed.license.licenseReviewState
assert(license.ffmpegCommercialLgplReviewRequired === true, 'FFmpeg LGPL review flag missing')
assert(license.ffprobeCommercialLgplReviewRequired === true, 'ffprobe LGPL review flag missing')
assert(license.libassReviewRequired === true, 'libass review flag missing')
assert(license.currentRepoPolicy === 'docker/prod/ffmpeg-lgpl-build-policy.md', 'current policy path mismatch')

for (const blocker of ['ffmpeg_launch_core_readiness', 'ffprobe_launch_core_readiness', 'libass_launch_core_readiness']) {
  assert(parsed.blockers.blockersNotClosed.includes(blocker), `blocker missing ${blocker}`)
}

const claims = parsed.claims
assert(claims.allowedClaims.containerSourcePlanCreated === true, 'container source plan claim missing')
assert(claims.allowedClaims.futureSourcePathSelected === true, 'future source path claim missing')
assert(claims.blockedClaims.actualDockerfileEditedToday === false, 'Dockerfile edit must be blocked')
assert(claims.requiredNoScopeStatement.includes('No Dockerfile edit'), 'no-scope statement missing Dockerfile edit block')

const ownerPrompt = parsed.ownerPrompt
assert(ownerPrompt.requiredSourceDecision === DECISION, 'owner prompt source decision mismatch')
assert(ownerPrompt.reviewSurface.futureSourcePath === FUTURE_SOURCE_PATH, 'owner prompt source path mismatch')
for (const plannedPackage of ['ffmpeg', 'libass9', 'fontconfig', 'fonts-dejavu-core']) {
  assert(ownerPrompt.reviewSurface.plannedPackages.includes(plannedPackage), `owner prompt package missing ${plannedPackage}`)
}
assert(ownerPrompt.allowedScope.dockerfileEdit === false, 'owner prompt must block Dockerfile edit')
assert(ownerPrompt.allowedScope.dockerBuildRunPush === false, 'owner prompt must block Docker build')

const staticPrompt = parsed.staticPrompt
assert(
  [DECISION, OWNER_REVIEW_DECISION, SOURCE_CREATION_DECISION].includes(staticPrompt.requiredSourceDecision),
  'static prompt source decision mismatch',
)
assert(staticPrompt.blockedUntil.includes('container_source_owner_review_passes'), 'static prompt owner gate missing')
assert(staticPrompt.blockedUntil.includes('actual_source_creation_gate_merges'), 'static prompt source gate missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-ffmpeg-ffprobe-libass-container-source-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      futureSourcePath: FUTURE_SOURCE_PATH,
      actualDockerfileEditedToday: false,
      dockerBuildRunPushApprovedToday: false,
      mediaExecutionApprovedToday: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
