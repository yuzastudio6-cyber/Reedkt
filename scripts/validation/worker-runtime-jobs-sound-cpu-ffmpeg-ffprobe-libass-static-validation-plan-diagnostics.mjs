#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_created_with_warnings_ready_for_static_validation_plan_no_media_no_docker_build'
const SOURCE_HEAD = 'b028b9c564ed982f59f9a8a45ead638f90bd068f'
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION: run static Dockerfile/source validation, no media/no Docker build'
const REQUIRED_PACKAGES = ['ffmpeg', 'fontconfig', 'fonts-dejavu-core', 'libass9', 'libatomic1']

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan-result.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan-result',
  },
  checklist: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-static-checklist.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-static-checklist',
  },
  commandPlan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-command-static-validation-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-command-static-validation-plan',
  },
  libassPlan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-libass-font-validation-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-libass-font-validation-plan',
  },
  license: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-license-boundary-validation-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-license-boundary-validation-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-claim-policy',
  },
  nextPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation',
  },
}

const FALSE_FIELDS = [
  'dockerBuildRunPushApprovedToday',
  'mediaExecutionApprovedToday',
  'runtimeExecutionApprovedToday',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'productionReleaseApprovedToday',
  'staticValidationPassed',
  'ffmpegReady',
  'ffprobeReady',
  'libassReady',
  'launchCoreReadinessPassed',
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
  'ffmpegCommandExecution',
  'ffprobeCommandExecution',
  'mediaFixturesCopied',
  'secretOrServiceAccountCopied',
  'supabaseCredentialCopied',
  'providerCredentialCopied',
  'workerRuntimeEntrypointEnabled',
  'subtitleRender',
  'mediaFileOpen',
  'ffmpegFilterExecution',
  'browserCapture',
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

const sourceCreation = read('docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-creation-result.md')
assert(sourceCreation.includes(SOURCE_DECISION), 'source creation decision missing')

const dockerfile = read(DOCKERFILE_PATH)
assert(dockerfile.includes('FROM --platform=linux/amd64 python:3.13-slim'), 'approved base image not present')
assert(dockerfile.includes('COPY server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'), 'requirements source copy missing')
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

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.sourceCreationPr === 1520, 'source creation PR mismatch')
assert(result.sourceBase.sourceCreationDecision === SOURCE_DECISION, 'source creation decision mismatch')
assert(result.planResult.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch')
assert(result.planResult.staticValidationPlanCreated === true, 'static validation plan missing')
assert(result.planResult.dockerfileTextInspectionPlanned === true, 'Dockerfile text inspection plan missing')
assert(result.planResult.commandAvailabilityValidationPlanned === true, 'command validation plan missing')
assert(result.planResult.libassAndFontValidationPlanned === true, 'libass/font validation plan missing')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const checklist = parsed.checklist.requiredSourceAssertions
assert(checklist.baseImage === 'python:3.13-slim', 'base image checklist mismatch')
for (const packageName of REQUIRED_PACKAGES) {
  assert(checklist.requiredPackages.includes(packageName), `checklist missing package ${packageName}`)
}

const commandPlan = parsed.commandPlan.commandCoveragePlan
assert(commandPlan.ffmpeg.sourcePackage === 'ffmpeg', 'ffmpeg command coverage mismatch')
assert(commandPlan.ffprobe.sourcePackage === 'ffmpeg', 'ffprobe command coverage mismatch')
assert(commandPlan.libass.sourcePackage === 'libass9', 'libass command coverage mismatch')
for (const blockedCommand of ['ffmpeg -version', 'ffprobe -version', 'ffmpeg -filters', 'docker build', 'docker run']) {
  assert(parsed.commandPlan.notRunInThisGate.includes(blockedCommand), `not-run command missing ${blockedCommand}`)
}

assert(parsed.libassPlan.futureValidationTargets.libassPackageDeclared === 'libass9', 'libass package target mismatch')
assert(parsed.libassPlan.futureValidationTargets.fontconfigPackageDeclared === 'fontconfig', 'fontconfig target mismatch')
assert(parsed.license.licenseBoundary.commercialLgplReviewStillRequired === true, 'LGPL review flag missing')
assert(parsed.license.licenseBoundary.productionReleaseApprovedToday === false, 'production release must remain false')

for (const blocker of ['ffmpeg_launch_core_readiness', 'ffprobe_launch_core_readiness', 'libass_launch_core_readiness']) {
  assert(parsed.blockers.blockersNotClosed.includes(blocker), `blocker missing ${blocker}`)
}
assert(parsed.blockers.unblockedNextGate === 'static_validation_no_media_no_docker_build', 'next gate mismatch')
assert(parsed.blockers.requiredNextPrompt === NEXT_PROMPT, 'blocker next prompt mismatch')

assert(parsed.claims.allowedClaims.staticValidationPlanCreated === true, 'claim policy missing static plan claim')
assert(parsed.claims.blockedClaims.staticValidationPassed === false, 'static validation pass must remain false')

const nextPrompt = parsed.nextPrompt
assert(nextPrompt.requiredSourceDecision === DECISION, 'future prompt source decision mismatch')
assert(nextPrompt.allowedStaticChecks.readDockerfileText === true, 'future prompt must allow source text reads')
assert(nextPrompt.blockedScope.dockerBuildRunPush === false, 'future prompt must block Docker')
assert(nextPrompt.blockedScope.ffmpegCommandExecution === false, 'future prompt must block ffmpeg execution')
assert(nextPrompt.blockedScope.ffprobeCommandExecution === false, 'future prompt must block ffprobe execution')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      dockerfilePath: DOCKERFILE_PATH,
      requiredPackages: REQUIRED_PACKAGES,
      staticValidationPlanCreated: true,
      dockerBuildRunPushApprovedToday: false,
      mediaExecutionApprovedToday: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
