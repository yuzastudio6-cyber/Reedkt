import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_owner_review_passed_with_warnings_ready_for_bounded_execution_surface_plan'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_proof_passed_with_warnings_ready_for_harness_owner_review'

const files = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-acceptance-register',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-fail-closed-review.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-fail-closed-review',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-bounded-execution-surface-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-bounded-execution-surface-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-blocker-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-claim-policy',
  },
}

const nextPrompt =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-plan.md'

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parse(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoop(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must be false`)
  }
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'realExternalAgentCredentialsReady',
    'realExternalAgentRuntimeReady',
    'realUserMediaReady',
    'workerDispatchReady',
    'routeExecutionReady',
    'mediaProcessingReady',
    'supabaseReady',
    'sqlReady',
    'artifactWriteReady',
    'externalBetaRuntimeReady',
    'paidProductionReady',
    'realExternalAgentCredentialsUsed',
    'realUserMediaUsed',
    'mediaOpened',
    'workerDispatched',
    'routeExecuted',
    'supabaseTouched',
    'sqlExecuted',
    'artifactCreated',
    'storageTouched',
  ]
  for (const key of forbidden) {
    assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
  }
}

for (const file of Object.values(files)) assertNoForbiddenTrueClaims(file.path)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.sourcePr === 2349, 'source PR mismatch')
assert(parsed.review.sourceVerification.sourceMergeCommit === '1fe1ac1ae9d1fa815fcdb8cc6dddf1d71a7eb304', 'source merge mismatch')
assert(parsed.review.sourceVerification.harnessProofDecision === sourceDecision, 'source decision mismatch')
assert(parsed.review.reviewResult.harnessRunnerReviewed === true, 'harness runner not reviewed')
assert(parsed.review.reviewResult.harnessDiagnosticsReviewed === true, 'harness diagnostics not reviewed')
assert(parsed.review.reviewResult.validExternalAgentNoMediaEnvelopeAccepted === true, 'accepted envelope not reviewed')
assert(parsed.review.reviewResult.acceptedToolCount === 15, 'tool count mismatch')
assert(parsed.review.reviewResult.invalidOriginBlocks === true, 'invalid origin block missing')
assert(parsed.review.reviewResult.agentSecretBlocks === true, 'agent secret block missing')
assert(parsed.review.reviewResult.mediaPathBlocks === true, 'media path block missing')
assert(parsed.review.reviewResult.trueRuntimeFlagBlocks === true, 'runtime flag block missing')
assert(parsed.review.reviewResult.boundedExecutionSurfacePlanMayProceed === true, 'surface plan not allowed')
assert(parsed.review.reviewResult.realExternalAgentCredentialsApprovedToday === false, 'credentials widened')
assert(parsed.review.reviewResult.realExternalAgentRuntimeExecutionApprovedToday === false, 'runtime widened')
assert(parsed.review.reviewResult.realUserMediaApprovedToday === false, 'real media widened')
assert(parsed.review.reviewResult.workerDispatchApprovedToday === false, 'worker dispatch widened')
assert(parsed.review.reviewResult.routeExecutionApprovedToday === false, 'route execution widened')
assertNoop(parsed.review.supabaseClassification, 'review.supabaseClassification')

assert(parsed.acceptance.decision === decision, 'acceptance decision mismatch')
assert(parsed.acceptance.acceptedForNextPlanning.boundedExecutionSurfacePlan === true, 'bounded plan missing')
assert(parsed.acceptance.acceptedTools.length === 15, 'accepted tool count mismatch')
assert(parsed.acceptance.acceptedWorkers.length === 2, 'worker count mismatch')
assert(parsed.acceptance.acceptedImages.length === 2, 'image count mismatch')
assert(parsed.acceptance.acceptedJobTypes.length === 4, 'job type count mismatch')
assertAllFalse(parsed.acceptance.acceptedForToday, 'acceptance.acceptedForToday')

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
for (const row of Object.values(parsed.failClosed.reviewedFailClosedCases)) {
  assert(row.passed === true, `fail-closed case did not pass: ${row.stopReason}`)
}
assertAllFalse(parsed.failClosed.blockedSideEffects, 'failClosed.blockedSideEffects')

assert(parsed.readiness.decision === decision, 'readiness decision mismatch')
assert(parsed.readiness.readinessForNextPlanning.acceptedToolCount === 15, 'readiness tool count mismatch')
assert(parsed.readiness.readinessForNextPlanning.boundedExecutionSurfacePlanMayProceed === true, 'readiness next plan missing')
assert(parsed.readiness.nextSurfaceRequirements.includes('all_15_tools_preserved'), 'next requirement missing')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.remainingBlockers.realUserMedia === 'blocked_by_phase209_private_fixture_path_or_boundary_missing', 'real media blocker mismatch')
assert(parsed.blockers.notBlocked.boundedExternalAgentNoMediaExecutionSurfacePlan === true, 'surface plan blocker mismatch')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.boundedExecutionSurfacePlanMayProceed === true, 'policy next claim missing')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const prompt = read(nextPrompt)
assert(prompt.includes(decision), 'next prompt missing source decision')
assert(prompt.includes('worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_completed_with_warnings_ready_for_surface_proof'), 'next prompt pass decision missing')
assert(prompt.includes('No real external-agent credential provisioning'), 'next prompt forbidden scope missing')

const harnessDiagnostics = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-real-external-agent-no-media-harness-proof:diagnostics',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(harnessDiagnostics.status === 0, `harness diagnostics failed: ${harnessDiagnostics.stderr}`)
assert(harnessDiagnostics.stdout.includes(sourceDecision), 'harness diagnostics source decision missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-real-external-agent-no-media-harness-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2349,
      sourceMergeCommit: parsed.review.sourceVerification.sourceMergeCommit,
      acceptedToolCount: parsed.review.reviewResult.acceptedToolCount,
      boundedExecutionSurfacePlanMayProceed: true,
      nextPrompt: parsed.review.nextPrompt,
      realExternalAgentRuntimeExecutionApprovedToday: false,
      realUserMediaApprovedToday: false,
      workerDispatched: false,
      routeExecuted: false,
      supabaseTouched: false,
    },
    null,
    2,
  ),
)
