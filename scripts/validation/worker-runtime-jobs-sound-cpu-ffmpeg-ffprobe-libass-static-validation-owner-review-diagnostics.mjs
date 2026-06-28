#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_owner_review_passed_with_warnings_ready_for_controlled_launch_core_real_check_proof_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_docker_build'
const SOURCE_HEAD = '19fde0cc06a7b0a4584dc557e7eeecd954428267'
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile'
const NEXT_PROMPT = 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-LAUNCH-CORE-REAL-CHECK-PROOF-AFTER-PLAN'
const REQUIRED_PACKAGES = ['ffmpeg', 'fontconfig', 'fonts-dejavu-core', 'libass9', 'libatomic1']

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-acceptance-register',
  },
  evidence: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-evidence-review-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-evidence-review-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-blocker-follow-up-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-claim-policy',
  },
}

const FALSE_FIELDS = [
  'acceptedForDockerBuildToday',
  'acceptedForDockerRunToday',
  'acceptedForDockerPushToday',
  'acceptedForFfmpegExecutionToday',
  'acceptedForFfprobeExecutionToday',
  'acceptedForMediaProcessingToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForProductionToday',
  'forbiddenCopyPatternsFound',
  'dockerBuildRunPush',
  'ffmpegCommandExecution',
  'ffprobeCommandExecution',
  'mediaProcessing',
  'runtimeExecution',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'ffmpegReady',
  'ffprobeReady',
  'libassReady',
  'launchCoreReadinessPassed',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'ffmpegMediaExecution',
  'ffprobeMediaExecution',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'productionReady',
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

const sourceResult = read('docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-result.md')
assert(sourceResult.includes(SOURCE_DECISION), 'required static validation decision missing')

const nextPromptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-proof-after-plan.md')
assert(nextPromptText.includes(NEXT_PROMPT), 'existing controlled real-check proof prompt missing')
assert(nextPromptText.includes('It must not process media'), 'next prompt no-media boundary missing')
assert(nextPromptText.includes('Docker build/run/push'), 'next prompt Docker boundary missing')

const dockerfile = read(DOCKERFILE_PATH)
assert(dockerfile.includes('FROM --platform=linux/amd64 python:3.13-slim'), 'approved base image not present')
for (const packageName of REQUIRED_PACKAGES) {
  assert(new RegExp(`\\b${packageName}\\b`).test(dockerfile), `Dockerfile missing package ${packageName}`)
}
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'runtime disabled flag missing')
assert(dockerfile.includes('USER reeditpro'), 'non-root user missing')
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'fail-closed command missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assert(doc.decision === DECISION, `${name} decision mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const review = parsed.review
assert(review.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(review.sourceBase.staticValidationPr === 1527, 'source PR mismatch')
assert(review.sourceBase.staticValidationDecision === SOURCE_DECISION, 'source decision mismatch')
assert(review.reviewDecision.staticValidationAcceptedForNextGate === true, 'owner acceptance missing')
assert(review.reviewDecision.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch')
for (const packageName of REQUIRED_PACKAGES) {
  assert(review.reviewDecision.packagesReviewed.includes(packageName), `package review missing ${packageName}`)
}
assert(review.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(acceptance.acceptedEvidence.staticValidationPassed === true, 'static validation evidence not accepted')
assert(acceptance.acceptedForNextGate.controlledLaunchCoreRealCheckProofPlanning === true, 'next gate planning acceptance missing')

const evidence = parsed.evidence.reviewedDockerfileAssertions
assert(evidence.ffmpegPackagePresent === true, 'ffmpeg evidence missing')
assert(evidence.ffprobeCoveredByFfmpegPackage === true, 'ffprobe coverage missing')
assert(evidence.libassPackagePresent === true, 'libass evidence missing')
assert(evidence.runtimeFlagsDisabled === true, 'runtime flags evidence missing')

for (const blocker of [
  'ffmpeg_command_availability_not_proved_by_this_owner_review',
  'ffprobe_command_availability_not_proved_by_this_owner_review',
  'libass_subtitle_render_not_proved_by_this_owner_review',
]) {
  assert(parsed.blockers.stillBlocked.includes(blocker), `blocker missing ${blocker}`)
}
assert(parsed.blockers.nextPrompt === NEXT_PROMPT, 'blocker next prompt mismatch')

assert(parsed.claims.allowedClaims.staticValidationOwnerReviewed === true, 'owner claim missing')
assert(parsed.claims.allowedClaims.controlledLaunchCoreRealCheckProofMayProceed === true, 'proof proceed claim missing')
assert(parsed.claims.blockedClaims.launchCoreReadinessPassed === false, 'launch readiness must remain false')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      dockerfilePath: DOCKERFILE_PATH,
      packagesReviewed: REQUIRED_PACKAGES,
      staticValidationAcceptedForNextGate: true,
      launchCoreReadinessPassed: false,
      realUserMediaBetaAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
