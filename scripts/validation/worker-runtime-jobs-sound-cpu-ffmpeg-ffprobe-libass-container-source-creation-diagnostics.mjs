#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_created_with_warnings_ready_for_static_validation_plan_no_media_no_docker_build'
const OWNER_REVIEW_DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_owner_review_passed_with_warnings_ready_for_container_source_creation_no_media_no_docker_build'
const SOURCE_HEAD = '41b6899e5203d61916ad96bbe2af2fdf1867deee'
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION-PLAN: plan static validation after source creation, no media/no Docker build'
const REQUIRED_PACKAGES = ['ffmpeg', 'fontconfig', 'fonts-dejavu-core', 'libass9', 'libatomic1']

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-creation-result.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-creation-result',
  },
  packageRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-package-declaration-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-package-declaration-register',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-source-creation-validation-report.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-source-creation-validation-report',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-source-creation-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-source-creation-blocker-follow-up-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-source-creation-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-source-creation-claim-policy',
  },
  ownerReview: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-review',
  },
  staticPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan',
  },
}

const FALSE_FIELDS = [
  'dockerBuildRunPushApprovedToday',
  'mediaExecutionApprovedToday',
  'runtimeExecutionApprovedToday',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'acceptedForDockerBuildToday',
  'acceptedForProductionReleaseToday',
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
  'ffmpegReady',
  'ffprobeReady',
  'libassReady',
  'launchCoreReadinessPassed',
  'productionUnlock',
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
    if (FALSE_FIELDS.includes(key)) assert(child === false, `${trail.concat(key).join('.')} must be false`)
    scanFalse(child, trail.concat(key))
  }
}

const dockerfile = read(DOCKERFILE_PATH)
assert(dockerfile.includes('FROM --platform=linux/amd64 python:3.13-slim'), 'approved base image changed')
assert(dockerfile.includes('COPY server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'), 'requirements copy missing')
for (const packageName of REQUIRED_PACKAGES) {
  assert(new RegExp(`\\b${packageName}\\b`).test(dockerfile), `Dockerfile missing package ${packageName}`)
}
for (const flag of [
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0',
  'REEDITPRO_WORKER_EXECUTION_ENABLED=0',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED=0',
]) {
  assert(dockerfile.includes(flag), `disabled flag missing ${flag}`)
}
assert(dockerfile.includes('USER reeditpro'), 'non-root user missing')
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'fail-closed CMD missing')
assert(!/COPY .*secret/i.test(dockerfile), 'Dockerfile must not copy secrets')
assert(!/COPY .*media/i.test(dockerfile), 'Dockerfile must not copy media fixtures')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'source creation decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.ownerReviewPr === 1517, 'owner review PR mismatch')
assert(result.sourceBase.ownerReviewDecision === OWNER_REVIEW_DECISION, 'owner review decision mismatch')
assert(result.sourceResult.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch')
assert(result.sourceResult.dockerfileEditedToday === true, 'Dockerfile edit claim missing')
assert(result.sourceResult.ffmpegProvidesFfprobe === true, 'ffprobe coverage missing')
assert(result.sourceResult.runtimeDisabledDefaultsPreserved === true, 'runtime flag preservation missing')
assert(result.sourceResult.nonRootUserPreserved === true, 'non-root preservation missing')
assert(result.sourceResult.failClosedCommandPreserved === true, 'fail-closed preservation missing')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const declared = parsed.packageRegister.declaredPackages
for (const packageName of ['ffmpeg', 'libass9', 'fontconfig', 'fonts-dejavu-core']) {
  const entry = declared.find((item) => item.packageName === packageName)
  assert(entry, `package register missing ${packageName}`)
  assert(entry.declaredInDockerfile === true, `${packageName} must be declared`)
}

for (const key of [
  'dockerfileTextInspectionPassed',
  'approvedBaseImagePreserved',
  'approvedRequirementsCopyPreserved',
  'disabledRuntimeFlagsPreserved',
  'nonRootUserPreserved',
  'failClosedCommandPreserved',
  'forbiddenMediaFixturesAbsent',
  'forbiddenSecretsAbsent',
  'dockerBuildRunPushNotExecuted',
]) {
  assert(parsed.validation.staticSourceChecks[key] === true, `validation flag missing ${key}`)
}

assert(parsed.blockers.sourceCreationCompleted === true, 'source creation completion missing')
for (const blocker of ['ffmpeg_launch_core_readiness', 'ffprobe_launch_core_readiness', 'libass_launch_core_readiness']) {
  assert(parsed.blockers.blockersNotClosed.includes(blocker), `blocker missing ${blocker}`)
}

assert(parsed.claims.allowedClaims.dockerfileSourceDeclarationsCreated === true, 'source declaration claim missing')
assert(parsed.claims.allowedClaims.ffprobeCoveredByFfmpegPackageDeclaration === true, 'ffprobe claim missing')

assert(parsed.ownerReview.decision === OWNER_REVIEW_DECISION, 'owner review source doc mismatch')

const staticPrompt = parsed.staticPrompt
assert(staticPrompt.requiredSourceDecision === DECISION, 'static validation prompt source decision mismatch')
assert(staticPrompt.requiredSourceCreationDecision === DECISION, 'static validation prompt source creation decision mismatch')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-ffmpeg-ffprobe-libass-container-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-creation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      dockerfilePath: DOCKERFILE_PATH,
      packagesDeclared: REQUIRED_PACKAGES,
      dockerBuildRunPushApprovedToday: false,
      mediaExecutionApprovedToday: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
