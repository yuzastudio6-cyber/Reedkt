#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_owner_review_passed_with_warnings_ready_for_container_source_creation_no_media_no_docker_build'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_plan_completed_with_warnings_ready_for_container_source_owner_review_no_media_no_docker_build'
const SOURCE_HEAD = '8fbb24e7b774af81add1a587b386ad7f4e1941a3'
const FUTURE_SOURCE_PATH = 'server/workers/sound-cpu/Dockerfile'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-CONTAINER-SOURCE-CREATION: create FFmpeg/ffprobe/libass container source declarations, no media/no Docker build'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-acceptance-register',
  },
  packageApproval: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-package-owner-approval-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-package-owner-approval-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-blocker-follow-up-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-claim-policy',
  },
  sourceCreationPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-creation.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-creation',
  },
  staticPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan',
  },
}

const REQUIRED_SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-package-policy-register.md',
  'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-license-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-claim-policy.md',
  'docker/prod/ffmpeg-lgpl-build-policy.md',
  'docker/prod/core-tool-version-policy.md',
  FUTURE_SOURCE_PATH,
]

const FALSE_FIELDS = [
  'actualDockerfileEditedToday',
  'dockerBuildRunPushApprovedToday',
  'mediaExecutionApprovedToday',
  'runtimeExecutionApprovedToday',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'acceptedForDockerBuildToday',
  'acceptedForProductionReleaseToday',
  'dockerBuildRunPush',
  'mediaProcessing',
  'ffmpegMediaExecution',
  'ffprobeMediaExecution',
  'runtimeExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'productionRelease',
  'ffmpegReady',
  'ffprobeReady',
  'libassReady',
  'launchCoreReadinessPassed',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'generated_local_fixture_passed',
  'dry_run_passed',
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

for (const path of REQUIRED_SOURCE_FILES) read(path)

const sourcePlan = read('docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-plan.md')
assert(sourcePlan.includes(SOURCE_DECISION), 'source container plan decision missing')

const dockerfile = read(FUTURE_SOURCE_PATH)
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'SOUND CPU Dockerfile must preserve disabled runtime flag')
assert(!dockerfile.includes('apt-get install --no-install-recommends -y ffmpeg'), 'owner review must not edit Dockerfile to install ffmpeg')
assert(!dockerfile.includes('libass9'), 'owner review must not edit Dockerfile to install libass')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const review = parsed.review
assert(review.decision === DECISION, 'review decision mismatch')
assert(review.sourceBase.sourceHead === SOURCE_HEAD, 'review source head mismatch')
assert(review.sourceBase.containerSourcePlanPr === 1513, 'review source PR mismatch')
assert(review.sourceBase.containerSourcePlanDecision === SOURCE_DECISION, 'review source decision mismatch')
assert(review.reviewResult.futureSourcePath === FUTURE_SOURCE_PATH, 'review future source path mismatch')
assert(review.reviewResult.plannedPackagesAcceptedForSourceCreation === true, 'package surface acceptance missing')
assert(review.reviewResult.containerSourceCreationMayProceed === true, 'source creation proceed flag missing')
assert(review.reviewResult.staticValidationRequiredAfterSourceCreation === true, 'static validation requirement missing')
assert(review.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance.acceptedForFutureSourceCreation
assert(acceptance.futureSourcePath === FUTURE_SOURCE_PATH, 'acceptance future source path mismatch')
for (const pkg of ['ffmpeg', 'libass9', 'fontconfig', 'fonts-dejavu-core']) {
  assert(acceptance.plannedSystemPackages.includes(pkg), `acceptance package missing ${pkg}`)
}
assert(acceptance.ffmpegProvidesFfprobe === true, 'ffmpeg/ffprobe coverage missing')
assert(acceptance.sourceCreationMayEditDockerfileInFutureGate === true, 'future source edit flag missing')

const approvals = parsed.packageApproval.packageApprovals
assert(approvals.length === 4, 'package approval count mismatch')
for (const pkg of ['ffmpeg', 'libass9', 'fontconfig', 'fonts-dejavu-core']) {
  const approval = approvals.find((entry) => entry.packageName === pkg)
  assert(approval, `package approval missing ${pkg}`)
  assert(approval.acceptedForFutureSourceCreation === true, `${pkg} future source approval missing`)
  assert(approval.acceptedForDockerBuildToday === false, `${pkg} Docker build must be false`)
  assert(approval.acceptedForProductionReleaseToday === false, `${pkg} production release must be false`)
}

for (const blocker of ['ffmpeg_launch_core_readiness', 'ffprobe_launch_core_readiness', 'libass_launch_core_readiness']) {
  assert(parsed.blockers.blockersNotClosed.includes(blocker), `blocker missing ${blocker}`)
}
assert(parsed.blockers.unblockedNextGate === 'container_source_creation', 'unblocked next gate mismatch')
assert(parsed.blockers.requiredNextPrompts.includes(NEXT_PROMPT), 'blocker register missing next prompt')

const claims = parsed.claims
assert(claims.allowedClaims.containerSourceOwnerReviewPassed === true, 'owner review claim missing')
assert(claims.allowedClaims.containerSourceCreationMayProceed === true, 'source creation claim missing')
assert(claims.requiredNoScopeStatement.includes('No Dockerfile edit'), 'claim policy must state no Dockerfile edit today')

const sourceCreationPrompt = parsed.sourceCreationPrompt
assert(sourceCreationPrompt.requiredSourceDecision === DECISION, 'source creation prompt source decision mismatch')
assert(sourceCreationPrompt.allowedFutureSourceEdit.path === FUTURE_SOURCE_PATH, 'source creation prompt path mismatch')
for (const pkg of ['ffmpeg', 'libass9', 'fontconfig', 'fonts-dejavu-core']) {
  assert(sourceCreationPrompt.allowedFutureSourceEdit.packages.includes(pkg), `source creation prompt package missing ${pkg}`)
}
assert(sourceCreationPrompt.blockedScope.dockerBuildRunPush === false, 'source creation prompt must block Docker build')
assert(sourceCreationPrompt.blockedScope.mediaProcessing === false, 'source creation prompt must block media')

const staticPrompt = parsed.staticPrompt
assert(staticPrompt.requiredSourceDecision === DECISION, 'static prompt must require owner review decision')
assert(staticPrompt.requiredSourceCreationDecision === 'container_source_creation_gate_merges', 'static prompt must require source creation')
assert(staticPrompt.blockedUntil.includes('actual_source_creation_gate_merges'), 'static prompt source creation blocker missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      futureSourcePath: FUTURE_SOURCE_PATH,
      containerSourceCreationMayProceed: true,
      dockerBuildRunPushApprovedToday: false,
      mediaExecutionApprovedToday: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
