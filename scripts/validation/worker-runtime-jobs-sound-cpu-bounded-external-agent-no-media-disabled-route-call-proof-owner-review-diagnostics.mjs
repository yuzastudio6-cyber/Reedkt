import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_call_proof_owner_review_passed_with_warnings_ready_for_controlled_tool_execution_unlock_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_disabled_route_call_proof_passed_with_warnings_ready_for_disabled_route_call_proof_owner_review'
const sourceMergeCommit = '6eaead0d1d151bfa95741d7e27693dbabe217c76'
const routePath = '/api/internal/workers/sound-cpu/no-media-agent-call'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-CONTROLLED-TOOL-EXECUTION-UNLOCK-PLAN'

const files = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-acceptance-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-blocker-follow-up-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-claim-policy',
  },
}

const requiredSourceEvidence = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-response-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-runtime-claim-policy.md',
  'scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-runner.ts',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-plan.md',
]

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

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'routeExecution',
    'workerDispatch',
    'workerExecution',
    'toolExecution',
    'mediaProcessing',
    'supabaseMutation',
    'sqlExecution',
    'artifactWrite',
    'providerModelCall',
    'dockerCloudRunExecution',
    'externalBetaRuntime',
    'productionRuntime',
    'routeExecutionReady',
    'workerExecutionReady',
    'toolExecutionReady',
    'externalAgentExecutionReady',
    'externalBetaReady',
    'productionReady',
    'generated_local_fixture_passed',
    'dry_run_passed',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

for (const value of Object.values(files)) {
  read(value.path)
  assertNoForbiddenTrueClaims(value.path)
}
for (const file of requiredSourceEvidence) read(file)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-review:diagnostics'
const promptText = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-plan.md',
)

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.controlledDisabledRouteCallProofPr === 2370, 'source PR mismatch')
assert(parsed.review.sourceVerification.controlledDisabledRouteCallProofMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.review.sourceVerification.controlledDisabledRouteCallProofDecision === sourceDecision, 'source decision mismatch')
assert(parsed.review.reviewedProof.routePath === routePath, 'route path mismatch')
assert(parsed.review.reviewedProof.localHttpPostAttempted === true, 'local proof missing')
assert(parsed.review.reviewedProof.status === 409, 'status mismatch')
assert(parsed.review.reviewedProof.acceptedForExecution === false, 'accepted for execution')
assert(parsed.review.reviewedProof.routeRegisteredInApp === true, 'route registered mismatch')
assert(parsed.review.reviewedProof.routeExecutionEnabled === false, 'route execution enabled')
assert(parsed.review.reviewedProof.explicitToolId === 'librosa', 'toolId mismatch')
assert(parsed.review.reviewedProof.acceptedToolCount === 15, 'tool count mismatch')
assert(parsed.review.reviewedProof.allSideEffectsFalse === true, 'side effects mismatch')
assert(parsed.review.ownerReviewResult.disabledRouteCallProofAcceptedForUnlockPlanning === true, 'proof not accepted for planning')
assert(parsed.review.ownerReviewResult.controlledToolExecutionUnlockPlanMayProceed === true, 'unlock plan not accepted')
for (const [key, value] of Object.entries(parsed.review.ownerReviewResult)) {
  if (key === 'disabledRouteCallProofAcceptedForUnlockPlanning' || key === 'controlledToolExecutionUnlockPlanMayProceed') {
    continue
  }
  assert(value === false, `ownerReviewResult.${key} must be false`)
}
assertNoop(parsed.review.supabaseClassification, 'review.supabaseClassification')
assert(parsed.review.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.acceptance.decision === decision, 'acceptance decision mismatch')
for (const [key, value] of Object.entries(parsed.acceptance.acceptedProofEvidence)) {
  if (key === 'acceptedToolCount') {
    assert(value === 15, 'acceptedToolCount mismatch')
  } else {
    assert(value === true, `acceptedProofEvidence.${key} must be true`)
  }
}
assertFalseMap(parsed.acceptance.acceptedForExecutionToday, 'acceptance.acceptedForExecutionToday')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.resolvedInThisGate.length === 1, 'resolved blocker count mismatch')
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_tool_execution_unlock_plan_required'),
  'unlock plan blocker missing',
)
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_tool_execution_proof_required'),
  'execution proof blocker missing',
)
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'external_agent_execution_readiness_unclaimed'),
  'readiness blocker missing',
)

assert(parsed.claims.decision === decision, 'claim decision mismatch')
assert(parsed.claims.claimPolicy.disabledRouteReachable === 'yes_local_controlled_proof_only', 'route reachability claim mismatch')
assert(parsed.claims.claimPolicy.failClosedEnvelopeVerified === 'yes', 'fail closed claim mismatch')
assert(parsed.claims.claimPolicy.controlledToolExecutionUnlockPlanReady === 'yes', 'unlock plan readiness mismatch')
for (const [key, value] of Object.entries(parsed.claims.claimPolicy)) {
  if (
    key === 'disabledRouteReachable' ||
    key === 'failClosedEnvelopeVerified' ||
    key === 'controlledToolExecutionUnlockPlanReady'
  ) {
    continue
  }
  if (key === 'generated_local_fixture_passed' || key === 'dry_run_passed') {
    assert(value === 'unclaimed', `claimPolicy.${key} must be unclaimed`)
  } else {
    assert(value === 'no', `claimPolicy.${key} must remain no`)
  }
}
assert(parsed.claims.reportingBoundary.maySayUnlockPlanningMayProceed === true, 'unlock planning boundary missing')
assert(parsed.claims.reportingBoundary.maySayAgentCanExecuteTools === false, 'agent execute claim')
assert(parsed.claims.reportingBoundary.maySayToolsReadyForExecution === false, 'tool ready claim')
assert(parsed.claims.reportingBoundary.mustSayControlledToolExecutionProofStillRequired === true, 'proof boundary missing')
assertNoop(parsed.claims.supabaseClassification, 'claims.supabaseClassification')

assert(promptText.includes(nextPrompt), 'next prompt heading missing')
assert(promptText.includes('bounded no-media execution path'), 'next prompt must stay bounded')
assert(promptText.includes('Do not process real media'), 'next prompt must preserve media block')
assert(promptText.includes('Do not claim execution readiness'), 'next prompt must preserve no readiness claim')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  routePath,
  proofAcceptedForUnlockPlanning: true,
  acceptedToolCount: 15,
  toolExecutionReady: false,
  nextPrompt,
}, null, 2))
