import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_plan_after_image_import_proof_completed_with_warnings_ready_for_runner_boundary_owner_review_after_image_import_proof'

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-plan-after-image-import-proof.md',
  criteria: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-criteria-after-image-import-proof.md',
  guards: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-payload-guard-register-after-image-import-proof.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-stop-condition-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-owner-review-after-image-import-proof.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-review-after-image-import-proof.md',
  sourceGates: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-remaining-gates-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-claim-policy-after-image-import-proof.md'
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(existsSync(fullPath), `missing file: ${relativePath}`)
  return readFileSync(fullPath, 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${relativePath}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${relativePath}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const plan = parseBlock(files.plan, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-plan-after-image-import-proof')
const criteria = parseBlock(files.criteria, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-criteria-after-image-import-proof')
const guards = parseBlock(files.guards, 'worker-runtime-jobs-sound-cpu-runner-boundary-payload-guard-register-after-image-import-proof')
const stops = parseBlock(files.stops, 'worker-runtime-jobs-sound-cpu-runner-boundary-stop-condition-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runner-boundary-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runner-boundary-claim-policy-after-image-import-proof')
const sourceReview = parseBlock(files.sourceReview, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-review-after-image-import-proof')
const sourceGates = parseBlock(files.sourceGates, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-remaining-gates-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-claim-policy-after-image-import-proof')

read(files.prompt)

for (const row of [plan, criteria, guards, stops, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(plan.sourcePr === 1181, 'source PR mismatch')
assert(plan.sourceMergeCommit === '4e80c1b436b0684048b95ba56f19618ea868e2d2', 'source merge mismatch')
assert(plan.priorGapClosurePr === 1179, 'prior gap closure PR mismatch')
assert(plan.priorGapClosureMergeCommit === '9ad6a4173cd581b4078d2398fdbf2a03ded8f5ca', 'prior gap closure merge mismatch')
assert(plan.acceptedSoundCpuToolCount === 15, 'accepted tool count mismatch')
assert(plan.runnerBoundaryReauthorizedToday === false, 'runner boundary must not be reauthorized today')
assert(plan.productToolCallExecutionApprovedToday === false, 'tool-call execution must remain false')
assert(plan.acceptedForToday.futureRunnerBoundaryOwnerReviewMayProceed === 'yes', 'owner review next step missing')

for (const key of [
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(plan.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(criteria.criteriaCount === 5, 'criteria count mismatch')
assert(criteria.readyForExecutionTodayCount === 0, 'criteria execution readiness widened')
assert(criteria.futureProofCriteria.some((row) => row.criterionId === 'approved_snapshot_bound'), 'approved snapshot criterion missing')
assert(criteria.futureProofCriteria.some((row) => row.criterionId === 'idempotency_bound'), 'idempotency criterion missing')
assert(criteria.futureProofCriteria.some((row) => row.criterionId === 'no_media_no_artifact_mode'), 'no-media/no-artifact criterion missing')

for (const field of ['approvedPlanSnapshotId', 'idempotencyKey', 'runtimeFlags']) {
  assert(guards.requiredFutureFields.includes(field), `required field missing: ${field}`)
}
for (const field of ['rawPrompt', 'mediaPath', 'signedUrl', 'artifactWriteTarget', 'supabaseSql', 'serviceRolePayload']) {
  assert(guards.forbiddenFutureFields.includes(field), `forbidden field missing: ${field}`)
}
for (const value of Object.values(guards.failClosedRuntimeFlags)) {
  assert(value === '0', 'runtime flag widened')
}
assert(guards.payloadExecutionApprovedToday === false, 'payload execution widened')

assert(stops.stopConditionCount === stops.futureStopConditions.length, 'stop condition count mismatch')
assert(stops.futureStopConditions.includes('worker_dispatch_requested'), 'worker dispatch stop missing')
assert(stops.futureStopConditions.includes('external_beta_or_production_claim_requested'), 'beta/production stop missing')
assert(stops.stopOnFirstUnsafeCondition === true, 'stop-on-first-unsafe missing')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 3, 'blocked later count mismatch')
assert(blockers.counts.readyForExecutionBlockerCount === 0, 'execution blocker count widened')
assert(blockers.blockers.some((row) => row.blockerId === 'media_artifact_supabase_policy_owner_review_required'), 'media/artifact/Supabase blocker missing')

assert(policy.allowedClaims.runnerBoundaryReauthorizationPlanCreated === true, 'allowed planning claim missing')
assert(policy.forbiddenClaims.runnerBoundaryReauthorizedToday === true, 'runner reauth forbidden missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'execution forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(
  sourceReview.decision ===
    'worker_runtime_jobs_sound_cpu_limited_beta_tool_call_gap_closure_owner_review_after_image_import_proof_passed_with_warnings_ready_for_runner_boundary_reauthorization_plan_after_image_import_proof',
  'source review decision mismatch'
)
assert(sourceReview.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourceReview.acceptedEvidence.externalBetaReadyCount === 0, 'source external beta widened')
assert(sourceGates.counts.readyForExecutionGateCount === 0, 'source execution gate widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-runner-boundary-reauthorization-plan-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-plan-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecutionApprovedToday": true',
  '"payloadExecutionApprovedToday": true',
  '"readyForExecutionTodayCount": 15',
  '"readyForExecutionGateCount": 1',
  '"externalBetaReadyCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled',
  'external beta ready',
  'production ready'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_plan_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: plan.sourceMergeCommit,
      acceptedSoundCpuToolCount: plan.acceptedSoundCpuToolCount,
      criteriaCount: criteria.criteriaCount,
      stopConditionCount: stops.stopConditionCount,
      readyForExecutionTodayCount: criteria.readyForExecutionTodayCount,
      nextPrompt: plan.nextPrompt
    },
    null,
    2
  )
)
