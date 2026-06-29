#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_dockerfile_backed_readiness_reconciliation_completed_with_warnings_ready_for_launch_core_dependency_readiness_recheck_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_owner_review_passed_with_warnings_ready_for_controlled_launch_core_real_check_proof_no_media_no_production'
const SOURCE_HEAD = '8d0b5fb098782cbdebf3cdccd32e9563f5e7afee'
const RUNNER_PATH = 'server/workers/production-readiness/production-tool-readiness-runner.ts'
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-READINESS-RECHECK-AFTER-DOCKERFILE-BACKED-RECONCILIATION'
const TOOL_IDS = ['ffmpeg', 'ffprobe', 'libass']
const REQUIRED_PACKAGES = ['ffmpeg', 'fontconfig', 'fonts-dejavu-core', 'libass9', 'libatomic1']

const FILES = {
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-reconciliation',
  },
  tools: {
    path: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-tool-register.md',
    label: 'worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-tool-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-blocker-delta-register.md',
    label: 'worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-blocker-delta-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-dependency-readiness-recheck-after-dockerfile-backed-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-dependency-readiness-recheck-after-dockerfile-backed-reconciliation',
  },
}

const FALSE_FIELDS = [
  'commandProofPassedByThisChange',
  'mediaPolicyClosedByThisChange',
  'runtimePolicyClosedByThisChange',
  'productionReadinessUnlockedByThisChange',
  'acceptedForExecutionToday',
  'realUserMediaBetaUnlocked',
  'paidProductionUnlocked',
  'ffmpegCommandExecutionReady',
  'ffprobeCommandExecutionReady',
  'libassRuntimeSubtitleReady',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'ffmpegMediaExecution',
  'ffprobeMediaExecution',
  'modelWeightsDownloaded',
  'artifactCreation',
  'supabaseMutation',
  'sqlExecution',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
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

function assertIncludesAll(text, values, label) {
  for (const value of values) assert(text.includes(value), `${label} missing ${value}`)
}

const sourceReview = read('docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-review.md')
assert(sourceReview.includes(SOURCE_DECISION), 'required source owner-review decision missing')

const dockerfile = read(DOCKERFILE_PATH)
assertIncludesAll(dockerfile, REQUIRED_PACKAGES, 'Dockerfile package evidence')
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'runtime disabled flag missing')
assert(dockerfile.includes('REEDITPRO_WORKER_EXECUTION_ENABLED=0'), 'worker disabled flag missing')
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'media disabled flag missing')

const runner = read(RUNNER_PATH)
assert(runner.includes("const soundCpuDockerfilePath = 'server/workers/sound-cpu/Dockerfile'"), 'Dockerfile path constant missing')
assert(runner.includes('dockerfileBackedSystemPackages'), 'Dockerfile-backed package map missing')
assert(runner.includes('buildDockerfileBackedToolSet'), 'Dockerfile-backed tool set builder missing')
assert(runner.includes('dockerfileBackedStaticReviewClosedToolIds'), 'Dockerfile-backed review closure set missing')
assertIncludesAll(runner, TOOL_IDS.map((toolId) => `'${toolId}'`), 'runner tool IDs')
assertIncludesAll(runner, ['ffmpeg', 'fontconfig', 'fonts-dejavu-core', 'libass9'], 'runner package IDs')
assert(
  runner.includes('SOUND CPU Dockerfile system-package declaration, static validation, and owner review passed'),
  'Dockerfile-backed warning text missing',
)
assert(runner.includes("return 'warning'"), 'warning transition missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  if (name !== 'prompt') {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
    assert(doc.decision === DECISION, `${name} decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, name)
  }
  scanFalse(doc, [name])
}

const reconciliation = parsed.reconciliation
assert(reconciliation.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(reconciliation.sourceBase.staticValidationOwnerReviewPr === 1530, 'source PR mismatch')
assert(reconciliation.sourceBase.staticValidationOwnerReviewDecision === SOURCE_DECISION, 'source decision mismatch')
assert(reconciliation.reconciliation.runnerPath === RUNNER_PATH, 'runner path mismatch')
assert(reconciliation.reconciliation.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch')
assert(reconciliation.reconciliation.statusTransition === 'missing_to_warning_for_static_dry_run_only', 'status transition mismatch')
assert(reconciliation.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
for (const toolId of TOOL_IDS) {
  assert(reconciliation.reconciliation.recognizedDockerfileBackedTools.includes(toolId), `recognized tool missing ${toolId}`)
}

const toolRows = parsed.tools.toolRegister
assert(toolRows.length === TOOL_IDS.length, 'tool register count mismatch')
for (const toolId of TOOL_IDS) {
  const row = toolRows.find((entry) => entry.toolId === toolId)
  assert(row, `tool row missing ${toolId}`)
  assert(row.previousDryRunStatus === 'missing', `${toolId} previous status mismatch`)
  assert(row.newDryRunStatus === 'warning', `${toolId} new status mismatch`)
  assert(row.sourceEvidence === DOCKERFILE_PATH, `${toolId} source evidence mismatch`)
}

const blockers = parsed.blockers
assert(blockers.closedStaticFalseMissingBlockers.length === 3, 'closed blocker count mismatch')
assert(blockers.expectedReadinessDelta.hardBlockerReductionFromFalseMissingStaticReadiness === 3, 'hard blocker delta mismatch')
for (const blocker of [
  'controlled_command_proof_policy_for_ffmpeg_ffprobe_libass',
  'ffmpeg_lgpl_safe_build_review',
  'libass_subtitle_filter_runtime_policy',
  'real_user_media_beta_policy',
  'paid_production_policy',
]) {
  assert(blockers.stillBlocked.includes(blocker), `still-blocked item missing ${blocker}`)
}

assert(parsed.claims.allowedClaims.dockerfileBackedStaticEvidenceRecognized === true, 'allowed claim missing')
assert(parsed.claims.blockedClaims.productionReady === false, 'production claim must remain false')

const prompt = parsed.prompt
assert(prompt.owner === 'WORKER_RUNTIME_JOBS', 'prompt owner mismatch')
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(prompt.expectedInputs.expectedDryRunStatus === 'warning', 'prompt expected dry-run status mismatch')
assert(prompt.scope.blocked.includes('Docker build'), 'prompt Docker build boundary missing')
assert(prompt.scope.blocked.includes('media processing'), 'prompt media boundary missing')
assert(prompt.scope.blocked.includes('beta or production unlock'), 'prompt beta/production boundary missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-dockerfile-backed-readiness-reconciliation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-reconciliation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      dockerfilePath: DOCKERFILE_PATH,
      statusTransition: 'missing_to_warning_for_static_dry_run_only',
      tools: TOOL_IDS,
      packages: REQUIRED_PACKAGES,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
