#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_hyperframe_readiness_semantics_fixed_with_warnings_ready_for_ffmpeg_ffprobe_libass_policy_closure_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_hyperframe_package_identity_owner_review_passed_with_warnings_ready_for_readiness_semantics_fix_no_runtime_no_production'
const SOURCE_HEAD = '457579a0c244f3838f7d749cb8ab251ecbcc0a40'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-POLICY-CLOSURE-PLAN: plan FFmpeg/ffprobe/libass policy closure, no media/no production'

const FILES = {
  fix: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-fix.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-fix',
  },
  code: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-code-register.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-code-register',
  },
  delta: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-readiness-delta-register.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-readiness-delta-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-readiness-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-readiness-runtime-claim-policy',
  },
  nextPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-hyperframe-package-identity-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-decision-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-fix.md',
  'server/workers/production-readiness/core-tool-node-import-checks.ts',
  'server/workers/production-readiness/core-cpu-render-readiness-checks.ts',
  'server/workers/production-readiness/production-tool-readiness-runner.ts',
  'package.json',
]

const MUST_BE_FALSE = [
  'hyperframeLiteralNpmPackageRequiredForReadiness',
  'hyperframePassed',
  'hyperframeNotChecked',
  'packageInstallApprovedToday',
  'packageLockMutationApprovedToday',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'installHyperframePackage',
  'installReplacementPackage',
  'packageLockMutation',
  'markHyperframePassed',
  'markHyperframeRuntimeReady',
  'launchCoreReadinessPassed',
  'runtimeExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
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

const sourceReview = read('docs/worker-runtime-jobs-sound-cpu-hyperframe-package-identity-owner-review.md')
assert(sourceReview.includes(SOURCE_DECISION), 'Hyperframe identity review source decision missing')

const nodeChecks = read('server/workers/production-readiness/core-tool-node-import-checks.ts')
assert(nodeChecks.includes("toolId: 'hyperframe'"), 'Hyperframe node check missing')
assert(nodeChecks.includes("packageJsonPath: 'hyperframe/package.json'"), 'Hyperframe package path evidence must remain visible')
assert(nodeChecks.includes('internalBoundary: true'), 'Hyperframe internal boundary flag missing')
assert(nodeChecks.includes("boundaryStatus: 'warning'"), 'Hyperframe warning boundary status missing')
assert(nodeChecks.includes('install guessed package names'), 'Hyperframe no-guessed-package wording missing')

const coreChecks = read('server/workers/production-readiness/core-cpu-render-readiness-checks.ts')
assert(coreChecks.includes('if (definition.internalBoundary)'), 'Core readiness must short-circuit internal boundaries')
assert(coreChecks.includes("checkKind: 'registry_policy'"), 'Internal boundary must be policy/readiness, not package import execution')
assert(coreChecks.includes('definition.boundaryStatus ??'), 'Core readiness missing boundary status handling')

const runner = read('server/workers/production-readiness/production-tool-readiness-runner.ts')
assert(runner.includes('internalPreviewBoundaryWarningToolIds'), 'Runner missing internal preview boundary warning set')
assert(runner.includes("'hyperframe'"), 'Runner missing Hyperframe warning member')
assert(runner.includes("if (internalPreviewBoundaryWarningToolIds.has(specToolId)) return 'warning'"), 'Runner must map Hyperframe to warning')
assert(runner.includes('does not require hyperframe/package.json'), 'Runner warning must reject literal package requirement')
assert(!runner.includes("return 'passed'"), 'Runner must not add a passed shortcut')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const fix = parsed.fix
assert(fix.decision === DECISION, 'fix decision mismatch')
assert(fix.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(fix.sourceBase.hyperframeIdentityReviewPr === 1503, 'source PR mismatch')
assert(fix.sourceBase.hyperframeIdentityReviewDecision === SOURCE_DECISION, 'source decision mismatch')
assert(fix.fixResult.hyperframeInternalPreviewBoundaryWarning === true, 'boundary warning claim missing')
assert(fix.fixResult.hyperframeStatusAfterFix === 'warning', 'Hyperframe status mismatch')
assert(fix.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const code = parsed.code
assert(code.codeChanges.length === 3, 'code change count mismatch')
for (const file of [
  'server/workers/production-readiness/core-tool-node-import-checks.ts',
  'server/workers/production-readiness/core-cpu-render-readiness-checks.ts',
  'server/workers/production-readiness/production-tool-readiness-runner.ts',
]) {
  assert(code.codeChanges.some((entry) => entry.file === file && entry.runtimeExecution === false), `code register missing ${file}`)
}

const delta = parsed.delta.readinessDelta
assert(delta.before.hardBlockers === 84, 'before hard blocker count mismatch')
assert(delta.after.hardBlockers === 81, 'after hard blocker count mismatch')
assert(delta.before.hyperframeStatus === 'not_installed', 'before Hyperframe status mismatch')
assert(delta.after.hyperframeStatus === 'warning', 'after Hyperframe status mismatch')
assert(parsed.delta.betaDelta.boundedNoRuntimeExternalBetaAllowed === true, 'bounded external beta evidence mismatch')
assert(parsed.delta.betaDelta.realUserMediaBetaAllowed === false, 'real user media beta must remain false')
for (const toolId of ['ffmpeg', 'ffprobe', 'libass']) {
  assert(parsed.delta.remainingTopLaunchCoreBlockers.includes(toolId), `remaining blocker ${toolId} missing`)
}

const claims = parsed.claims
assert(claims.allowedClaims.hyperframeReadinessSemanticsFixedToday === true, 'allowed semantics fix claim missing')
assert(claims.allowedClaims.hyperframeInternalPreviewBoundaryWarning === true, 'allowed boundary warning claim missing')
assert(claims.blockedClaims.hyperframeRuntimeReady === false, 'Hyperframe runtime must remain blocked')
assert(claims.requiredNoScopeStatement.includes('external beta unlock'), 'no-scope statement missing external beta unlock')

const prompt = parsed.nextPrompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
for (const toolId of ['ffmpeg', 'ffprobe', 'libass']) {
  assert(prompt.currentLaunchCoreBlockers.includes(toolId), `prompt blocker ${toolId} missing`)
}
assert(prompt.allowedScope.localCommandInspection === true, 'prompt local inspection scope missing')
assert(prompt.allowedScope.mediaProcessing === false, 'prompt must block media processing')
assert(prompt.allowedScope.productionUnlock === false, 'prompt must block production unlock')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-hyperframe-readiness-semantics-fix:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-fix-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      hyperframeStatus: 'warning',
      hardBlockersAfterFix: 81,
      boundedNoRuntimeExternalBetaAllowed: true,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
