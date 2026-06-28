#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_policy_closure_plan_completed_with_warnings_ready_for_container_source_plan_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_hyperframe_readiness_semantics_fixed_with_warnings_ready_for_ffmpeg_ffprobe_libass_policy_closure_no_runtime_no_production'
const SOURCE_HEAD = '4ce40b23899eb36b803ef46f56ee295b3bb55c95'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-CONTAINER-SOURCE-PLAN: plan container-source FFmpeg/ffprobe/libass closure, no media/no Docker build'

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan',
  },
  inspection: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-local-inspection-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-local-inspection-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-blocker-split-register.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-blocker-split-register',
  },
  requirements: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-requirements.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-requirements',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-claim-policy',
  },
  nextPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-fix.md',
  'docs/worker-runtime-jobs-sound-cpu-hyperframe-readiness-delta-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan.md',
  'server/workers/production-readiness/core-tool-command-checks.ts',
  'server/workers/production-readiness/production-tool-readiness-runner.ts',
  'package.json',
]

const MUST_BE_FALSE = [
  'localFfmpegAcceptedForProduction',
  'localFfprobeAcceptedForProduction',
  'libassFilterDetectedLocally',
  'mediaExecutionApprovedToday',
  'dockerBuildRunPushApprovedToday',
  'runtimeExecutionApprovedToday',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'acceptedForProductionEvidence',
  'assFilterDetected',
  'subtitlesFilterDetected',
  'libassFilterDetected',
  'acceptedForProductionToday',
  'localFilterDetected',
  'ffmpegReady',
  'ffprobeReady',
  'libassReady',
  'launchCoreReadinessPassed',
  'runtimeExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'ffmpegMediaExecution',
  'ffprobeMediaExecution',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'realUserMediaBetaUnlock',
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
    if (MUST_BE_FALSE.includes(key)) assert(child === false, `${trail.concat(key).join('.')} must remain false`)
    scanFalse(child, trail.concat(key))
  }
}

for (const file of SOURCE_FILES) read(file)

const source = read('docs/worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-fix.md')
assert(source.includes(SOURCE_DECISION), 'Hyperframe source decision missing')

const commandChecks = read('server/workers/production-readiness/core-tool-command-checks.ts')
for (const toolId of ['ffmpeg', 'ffprobe', 'libass']) {
  assert(commandChecks.includes(`toolId: '${toolId}'`), `core command check missing ${toolId}`)
}
assert(commandChecks.includes("command: 'ffmpeg'"), 'ffmpeg command check missing')
assert(commandChecks.includes("command: 'ffprobe'"), 'ffprobe command check missing')
assert(commandChecks.includes('expectedPattern: /\\bass\\b|subtitle/i'), 'libass expected filter pattern missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const plan = parsed.plan
assert(plan.decision === DECISION, 'plan decision mismatch')
assert(plan.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(plan.sourceBase.hyperframeSemanticsPr === 1507, 'source PR mismatch')
assert(plan.sourceBase.hyperframeSemanticsDecision === SOURCE_DECISION, 'source decision mismatch')
assert(plan.planResult.ffmpegLocalCommandAvailable === true, 'ffmpeg local command evidence missing')
assert(plan.planResult.ffprobeLocalCommandAvailable === true, 'ffprobe local command evidence missing')
assert(plan.planResult.containerSourcePlanRequired === true, 'container source plan requirement missing')
assert(plan.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const commands = parsed.inspection.commandsRun
assert(commands.length === 3, 'inspection command count mismatch')
const ffmpeg = commands.find((entry) => entry.command === 'ffmpeg -version')
const ffprobe = commands.find((entry) => entry.command === 'ffprobe -version')
const filters = commands.find((entry) => entry.command === 'ffmpeg -hide_banner -filters')
assert(ffmpeg?.sanitizedEvidence.version === '8.1.1', 'ffmpeg version mismatch')
assert(ffprobe?.sanitizedEvidence.version === '8.1.1', 'ffprobe version mismatch')
assert(ffmpeg.sanitizedEvidence.configurationIncludesGplFlag === true, 'ffmpeg GPL evidence missing')
assert(ffmpeg.sanitizedEvidence.configurationIncludesLibassFlag === false, 'ffmpeg libass evidence mismatch')
assert(filters?.result === 'no_libass_related_filter_detected', 'filter inspection result mismatch')
for (const command of commands) {
  assert(command.mediaInputOpened === false, `${command.command} must not open media`)
}

const split = parsed.blockers.blockerSplit
for (const toolId of ['ffmpeg', 'ffprobe', 'libass']) {
  const entry = split.find((item) => item.toolId === toolId)
  assert(entry, `blocker split missing ${toolId}`)
  assert(entry.currentReadinessStatus === 'missing', `${toolId} status mismatch`)
  assert(entry.acceptedForProductionToday === false, `${toolId} must not be production accepted`)
}

const requirements = parsed.requirements.requiredFutureEvidence
for (const key of ['containerSourceDeclared', 'ffmpegBinaryPathDeclared', 'ffprobeBinaryPathDeclared', 'libassOrSubtitleFilterPolicyDeclared', 'licenseCompatibilityReviewed', 'commercialUsePolicyReviewed']) {
  assert(requirements[key] === true, `future requirement ${key} missing`)
}
for (const blocked of ['run media through ffmpeg', 'run media through ffprobe', 'build or push Docker images']) {
  assert(parsed.requirements.containerSourcePlanMustNot.includes(blocked), `container-source prohibition missing ${blocked}`)
}

const claims = parsed.claims
assert(claims.allowedClaims.ffmpegFfprobeLibassPolicyClosurePlanCreated === true, 'allowed plan claim missing')
assert(claims.allowedClaims.localCommandVersionInspectionRecorded === true, 'local inspection claim missing')
assert(claims.blockedClaims.launchCoreReadinessPassed === false, 'launch-core must remain blocked')
assert(claims.requiredNoScopeStatement.includes('external beta unlock'), 'no-scope statement missing external beta unlock')
assert(claims.requiredNoScopeStatement.includes('FFmpeg media execution'), 'no-scope statement missing FFmpeg media block')

const prompt = parsed.nextPrompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(prompt.allowedScope.containerSourcePlan === true, 'prompt container source scope missing')
assert(prompt.allowedScope.mediaProcessing === false, 'prompt must block media processing')
assert(prompt.allowedScope.dockerBuildRunPush === false, 'prompt must block Docker build/run/push')
for (const output of ['container source path/register plan', 'license compatibility policy plan', 'libass filter/source evidence plan']) {
  assert(prompt.requiredOutputs.includes(output), `prompt output missing ${output}`)
}

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      localFfmpeg: '8.1.1-not-production-evidence',
      localFfprobe: '8.1.1-not-production-evidence',
      libassFilterDetectedLocally: false,
      nextPrompt: NEXT_PROMPT,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
