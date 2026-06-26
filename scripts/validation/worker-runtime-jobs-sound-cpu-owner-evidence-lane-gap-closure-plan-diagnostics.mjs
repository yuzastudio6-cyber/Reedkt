import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-plan.md',
  actions: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-action-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-readiness-boundary.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-blocker-register.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-review.md',
  sourceAudit: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-reconciliation-audit.md',
  sourceDecision: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-decision-register.md',
  sourceMap: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-source-map.md',
  syntheticProof: 'docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md',
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function parseJsonFence(relativePath, label) {
  const text = read(relativePath)
  const pattern = new RegExp('```json ' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  assert(match, `Missing JSON fence ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

const plan = parseJsonFence(files.plan, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-plan')
const actions = parseJsonFence(files.actions, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-action-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-readiness-boundary')
const blockers = parseJsonFence(files.blockers, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-blocker-register')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-claim-policy')
const sourceAudit = parseJsonFence(files.sourceAudit, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-reconciliation-audit')
const sourceDecision = parseJsonFence(files.sourceDecision, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-decision-register')
const sourceMap = parseJsonFence(files.sourceMap, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-source-map')
const syntheticProof = parseJsonFence(files.syntheticProof, 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')
const prompt = read(files.prompt)

const decision = 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_gap_closure_plan_completed_with_warnings_ready_for_owner_gap_closure_review'

assert(plan.owner === 'WORKER_RUNTIME_JOBS', 'plan owner mismatch')
assert(plan.decision === decision, 'plan decision mismatch')
assert(plan.sourceVerification.sourceHead === '36fd0f0aa84ff027791d202d582deef074c66cb8', 'source head mismatch')
assert(plan.gapClosurePlanResult.laneGapClosurePlanCreated === true, 'gap closure plan must be created')
assert(plan.gapClosurePlanResult.toolCandidateCount === 15, 'tool candidate count mismatch')
assert(plan.gapClosurePlanResult.acceptedForInternalSyntheticPlanning === true, 'internal synthetic planning should be true')
assert(plan.gapClosurePlanResult.acceptedForExternalBeta === false, 'external beta must stay false')
assert(plan.gapClosurePlanResult.acceptedForProduction === false, 'production must stay false')
assert(plan.gapClosurePlanResult.trackedGapCount === 8, 'tracked gap count mismatch')
assert(plan.gapClosurePlanResult.closureActionCount === 8, 'closure action count mismatch')
assert(plan.gapClosurePlanResult.closedGapCountToday === 0, 'closed gap count must be zero')
assert(plan.gapClosurePlanResult.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')

assert(actions.decision === decision, 'actions decision mismatch')
assert(actions.gapActions.length === 8, 'must include eight gap actions')
for (const action of actions.gapActions) {
  assert(action.closedToday === false, `${action.gapId} should not be closed today`)
  read(action.sourceEvidence)
}
assert(actions.summary.trackedGapCount === 8, 'actions tracked gap count mismatch')
assert(actions.summary.closedGapCountToday === 0, 'actions closed gap count mismatch')

for (const [key, value] of Object.entries(boundary.readinessBoundary)) {
  if (key === 'internalSyntheticToolCallPlanningMayContinue' || key === 'controlledSyntheticProofAccepted') {
    assert(value === true, `${key} should be true`)
  } else if (key === 'toolCandidateCount') {
    assert(value === 15, 'boundary tool count mismatch')
  } else {
    assert(value === false, `${key} must remain false`)
  }
}

assert(blockers.blockers.length === 2, 'blocker count mismatch')
assert(blockers.summary.resolvedToday === 0, 'no blockers should resolve today')
assert(claims.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(claims.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')
assert(claims.forbiddenClaims.includes('external beta readiness'), 'external beta readiness must be forbidden')
assert(claims.forbiddenClaims.includes('production readiness'), 'production readiness must be forbidden')

assert(
  sourceAudit.decision === 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_reconciliation_completed_with_warnings_ready_for_owner_gap_closure_plan',
  'source audit decision mismatch',
)
assert(sourceAudit.reconciliationResult.toolCandidateCount === 15, 'source audit tool count mismatch')
assert(sourceAudit.reconciliationResult.externalBetaAllowed === false, 'source audit external beta must remain false')
assert(sourceDecision.acceptedLaneEvidence.workerRuntimePlanningEvidence.requiredOwnerSignoffCount === 8, 'source signoff count mismatch')
assert(sourceMap.sourceMaps.length === 7, 'source map owner area count mismatch')
assert(syntheticProof.toolCandidateCount === 15, 'synthetic proof tool count mismatch')
assert(syntheticProof.probePassedCount === 15, 'synthetic proof probe count mismatch')

const blockedPhrases = [
  'Do not run workers',
  'run routes',
  'run tools',
  'touch Supabase',
  'execute SQL',
  'mutate credits/Stripe',
  'unlock beta',
  'unlock production',
]
for (const phrase of blockedPhrases) {
  assert(prompt.includes(phrase), `prompt missing blocked phrase: ${phrase}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_gap_closure_plan_diagnostics_passed',
      decision: plan.decision,
      sourceHead: plan.sourceVerification.sourceHead,
      toolCandidateCount: plan.gapClosurePlanResult.toolCandidateCount,
      trackedGapCount: plan.gapClosurePlanResult.trackedGapCount,
      closedGapCountToday: plan.gapClosurePlanResult.closedGapCountToday,
      executionApprovalsGrantedToday: plan.gapClosurePlanResult.executionApprovalsGrantedToday,
      externalBetaAllowed: plan.gapClosurePlanResult.acceptedForExternalBeta,
      nextPrompt: plan.nextPrompt,
    },
    null,
    2,
  ),
)
