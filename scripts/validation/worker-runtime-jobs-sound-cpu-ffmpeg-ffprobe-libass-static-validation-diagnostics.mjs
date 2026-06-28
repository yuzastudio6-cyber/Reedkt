#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_docker_build'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build'
const SOURCE_HEAD = 'e405f08d1e974e355cf3de54f9af1f3027c5534f'
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION-OWNER-REVIEW: review static validation evidence, no media/no Docker build'
const REQUIRED_PACKAGES = ['ffmpeg', 'fontconfig', 'fonts-dejavu-core', 'libass9', 'libatomic1']

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-result.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-result',
  },
  instructions: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-instruction-validation-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-instruction-validation-register',
  },
  prohibited: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-prohibited-instruction-scan-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-prohibited-instruction-scan-register',
  },
  command: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-command-coverage-static-evidence-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-command-coverage-static-evidence-register',
  },
  libass: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-libass-font-static-evidence-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-libass-font-static-evidence-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-blocker-follow-up-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-result-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-result-claim-policy',
  },
  nextPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-review',
  },
}

const FALSE_FIELDS = [
  'dockerBuildRunPushApprovedToday',
  'ffmpegCommandExecutionApprovedToday',
  'ffprobeCommandExecutionApprovedToday',
  'mediaExecutionApprovedToday',
  'runtimeExecutionApprovedToday',
  'launchCoreReadinessPassed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'forbiddenCopyPatternsFound',
  'mediaFixturesCopied',
  'secretOrServiceAccountCopied',
  'supabaseCredentialCopied',
  'providerCredentialCopied',
  'modelWeightsCopied',
  'dockerComposeOrCloudRunConfigCopied',
  'workerRuntimeEntrypointEnabled',
  'publicArtifactPathCreated',
  'signedUrlSourceConfigured',
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
  'dockerBuild',
  'dockerRun',
  'dockerPush',
  'ffmpegCommandExecution',
  'ffprobeCommandExecution',
  'runtimeReadiness',
  'subtitleRenderRuntimeApprovedToday',
  'mediaFixtureValidationRun',
  'subtitleRenderValidationRun',
  'ffmpegFilterExecutionRun',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'productionUnlock',
  'ffmpegReady',
  'ffprobeReady',
  'libassReady',
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

const sourcePlan = read('docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan-result.md')
assert(sourcePlan.includes(SOURCE_DECISION), 'required static validation plan decision missing')

const dockerfile = read(DOCKERFILE_PATH)
assert(dockerfile.includes('FROM --platform=linux/amd64 python:3.13-slim'), 'approved base image not present')
assert(
  dockerfile.includes('COPY server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'),
  'requirements source copy missing',
)
for (const packageName of REQUIRED_PACKAGES) {
  assert(new RegExp(`\\b${packageName}\\b`).test(dockerfile), `Dockerfile missing package ${packageName}`)
}
for (const flag of [
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0',
  'REEDITPRO_WORKER_EXECUTION_ENABLED=0',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED=0',
]) {
  assert(dockerfile.includes(flag), `disabled runtime flag missing ${flag}`)
}
assert(dockerfile.includes('USER reeditpro'), 'non-root user declaration missing')
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'fail-closed command missing')
assert(!/COPY .*secret/i.test(dockerfile), 'Dockerfile must not copy secrets')
assert(!/COPY .*media/i.test(dockerfile), 'Dockerfile must not copy media fixtures')
assert(!/COPY .*service.?account/i.test(dockerfile), 'Dockerfile must not copy service accounts')
assert(!/COPY .*supabase/i.test(dockerfile), 'Dockerfile must not copy Supabase credentials')
assert(!/COPY .*provider/i.test(dockerfile), 'Dockerfile must not copy provider credentials')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.staticValidationPlanPr === 1523, 'source PR mismatch')
assert(result.sourceBase.requiredSourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.validationResult.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch')
assert(result.validationResult.staticValidationPassed === true, 'static validation pass missing')
assert(result.validationResult.dockerfileTextInspectionPassed === true, 'Dockerfile text inspection pass missing')
for (const packageName of REQUIRED_PACKAGES) {
  assert(result.validationResult.requiredPackagesPresent.includes(packageName), `result missing package ${packageName}`)
}
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const instructions = parsed.instructions.validatedInstructions
assert(instructions.baseImage.present === true, 'base image validation missing')
assert(instructions.requirementsCopy.present === true, 'requirements copy validation missing')
for (const packageName of REQUIRED_PACKAGES) {
  assert(instructions.aptPackages.present.includes(packageName), `instruction register missing package ${packageName}`)
}
assert(instructions.disabledRuntimeFlags.present === true, 'disabled flags validation missing')
assert(instructions.nonRootUser.present === true, 'non-root validation missing')
assert(instructions.failClosedCommand.present === true, 'fail-closed validation missing')

const command = parsed.command
assert(command.staticEvidence.ffmpegPackageDeclared === true, 'ffmpeg static evidence missing')
assert(command.staticEvidence.ffprobeCoveredByFfmpegPackage === true, 'ffprobe static evidence missing')
assert(command.staticEvidence.libassPackageDeclared === true, 'libass static evidence missing')
for (const blockedCommand of ['docker build', 'docker run', 'docker push', 'ffmpeg -version', 'ffprobe -version']) {
  assert(command.commandsNotRunInThisGate.includes(blockedCommand), `not-run command missing ${blockedCommand}`)
}

assert(parsed.libass.staticEvidence.libassPackage === 'libass9', 'libass package mismatch')
assert(parsed.libass.staticEvidence.fontConfigPackage === 'fontconfig', 'fontconfig package mismatch')
assert(parsed.libass.staticEvidence.fontPackage === 'fonts-dejavu-core', 'font package mismatch')

for (const blocker of [
  'ffmpeg_command_availability_not_executed',
  'ffprobe_command_availability_not_executed',
  'libass_subtitle_render_not_executed',
]) {
  assert(parsed.blockers.blockersNotClosed.includes(blocker), `blocker missing ${blocker}`)
}
assert(parsed.blockers.requiredNextPrompt === NEXT_PROMPT, 'blocker next prompt mismatch')

assert(parsed.claims.allowedClaims.staticValidationPassed === true, 'claim policy missing static validation pass')
assert(parsed.claims.blockedClaims.ffmpegReady === false, 'ffmpeg ready must remain false')
assert(parsed.claims.blockedClaims.generated_local_fixture_passed === false, 'fixture pass must remain false')
assert(parsed.claims.blockedClaims.dry_run_passed === false, 'dry-run pass must remain false')

const nextPrompt = parsed.nextPrompt
assert(nextPrompt.requiredSourceDecision === DECISION, 'future owner prompt source decision mismatch')
assert(nextPrompt.reviewSurface.dockerfilePath === DOCKERFILE_PATH, 'future owner prompt Dockerfile mismatch')
assert(nextPrompt.reviewSurface.staticValidationAcceptedForReview === true, 'future owner prompt review surface mismatch')
assert(nextPrompt.blockedScope.dockerBuildRunPush === false, 'future owner prompt must block Docker')
assert(nextPrompt.blockedScope.ffmpegCommandExecution === false, 'future owner prompt must block ffmpeg execution')
assert(nextPrompt.blockedScope.ffprobeCommandExecution === false, 'future owner prompt must block ffprobe execution')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-ffmpeg-ffprobe-libass-static-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      dockerfilePath: DOCKERFILE_PATH,
      requiredPackages: REQUIRED_PACKAGES,
      staticValidationPassed: true,
      dockerBuildRunPushApprovedToday: false,
      ffmpegCommandExecutionApprovedToday: false,
      ffprobeCommandExecutionApprovedToday: false,
      mediaExecutionApprovedToday: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
