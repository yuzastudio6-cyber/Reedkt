import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_runner_boundary_proof_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-owner-acceptance-register-after-image-import-proof.md',
  criteriaReview: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-owner-criteria-review-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-owner-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-owner-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-runner-boundary-proof-after-image-import-proof.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-plan-after-image-import-proof.md',
  sourceCriteria: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-criteria-after-image-import-proof.md',
  sourceGuards: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-payload-guard-register-after-image-import-proof.md',
  sourceStops: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-stop-condition-register-after-image-import-proof.md',
  sourceBlockers: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-blocker-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-claim-policy-after-image-import-proof.md'
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

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-owner-review-after-image-import-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-runner-boundary-owner-acceptance-register-after-image-import-proof')
const criteriaReview = parseBlock(files.criteriaReview, 'worker-runtime-jobs-sound-cpu-runner-boundary-owner-criteria-review-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runner-boundary-owner-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runner-boundary-owner-claim-policy-after-image-import-proof')
const sourcePlan = parseBlock(files.sourcePlan, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-plan-after-image-import-proof')
const sourceCriteria = parseBlock(files.sourceCriteria, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-criteria-after-image-import-proof')
const sourceGuards = parseBlock(files.sourceGuards, 'worker-runtime-jobs-sound-cpu-runner-boundary-payload-guard-register-after-image-import-proof')
const sourceStops = parseBlock(files.sourceStops, 'worker-runtime-jobs-sound-cpu-runner-boundary-stop-condition-register-after-image-import-proof')
const sourceBlockers = parseBlock(files.sourceBlockers, 'worker-runtime-jobs-sound-cpu-runner-boundary-blocker-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-runner-boundary-claim-policy-after-image-import-proof')

read(files.prompt)

for (const row of [review, acceptance, criteriaReview, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(review.sourcePr === 1184, 'source PR mismatch')
assert(review.sourceMergeCommit === '932a71bcfea871bdafb7a0e52074e6f61ba88cb5', 'source merge mismatch')
assert(review.acceptedEvidence.runnerBoundaryPlanAcceptedForFutureProof === true, 'runner boundary plan not accepted')
assert(review.acceptedEvidence.criteriaCountAccepted === 5, 'criteria count mismatch')
assert(review.acceptedEvidence.stopConditionCountAccepted === 14, 'stop condition count mismatch')
assert(review.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(review.acceptedEvidence.readyForExecutionTodayCount === 0, 'execution readiness widened')
assert(review.acceptedForToday.controlledRunnerBoundaryProofPlanningMayProceed === 'yes', 'next proof planning not allowed')

for (const key of [
  'runnerBoundaryReauthorized',
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
  assert(review.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(acceptance.counts.acceptedFutureProofItemCount === 7, 'accepted future proof item count mismatch')
assert(acceptance.counts.acceptedForExecutionTodayCount === 0, 'accepted execution count widened')
for (const item of ['worker_dispatch', 'route_execution', 'media_file_open', 'supabase_mutation', 'sql_execution', 'external_beta_unlock']) {
  assert(acceptance.notAcceptedForExecutionToday.includes(item), `missing non-acceptance item: ${item}`)
}

for (const [key, value] of Object.entries(criteriaReview.reviewFindings)) {
  assert(value === true, `criteria finding not accepted: ${key}`)
}
assert(criteriaReview.futureProofMustRemain === 'synthetic_guard_behavior_only', 'future proof scope widened')
assert(criteriaReview.productExecutionAccepted === false, 'product execution accepted unexpectedly')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 3, 'blocked later count mismatch')
assert(blockers.counts.readyForExecutionBlockerCount === 0, 'execution blocker count widened')
assert(blockers.blockers.some((row) => row.blockerId === 'controlled_runner_boundary_proof_required'), 'controlled proof blocker missing')

assert(policy.allowedClaims.runnerBoundaryPlanOwnerReviewed === true, 'allowed owner review claim missing')
assert(policy.allowedClaims.controlledRunnerBoundaryProofMayProceed === true, 'allowed proof next claim missing')
assert(policy.forbiddenClaims.runnerBoundaryReauthorizedToday === true, 'runner reauth forbidden missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'execution forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(
  sourcePlan.decision ===
    'worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_plan_after_image_import_proof_completed_with_warnings_ready_for_runner_boundary_owner_review_after_image_import_proof',
  'source plan decision mismatch'
)
assert(sourcePlan.sourcePr === 1181, 'source plan PR mismatch')
assert(sourcePlan.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourcePlan.runnerBoundaryReauthorizedToday === false, 'source runner boundary widened')
assert(sourceCriteria.criteriaCount === 5, 'source criteria count mismatch')
assert(sourceCriteria.readyForExecutionTodayCount === 0, 'source execution readiness widened')
assert(sourceGuards.payloadExecutionApprovedToday === false, 'source payload execution widened')
assert(sourceStops.stopConditionCount === 14, 'source stop count mismatch')
assert(sourceBlockers.counts.readyForExecutionBlockerCount === 0, 'source blocker widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-runner-boundary-reauthorization-owner-review-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-owner-review-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"runnerBoundaryReauthorized": "yes"',
  '"productToolCallExecution": "yes"',
  '"workerExecution": "yes"',
  '"routeExecution": "yes"',
  '"mediaProcessing": "yes"',
  '"artifactWrites": "yes"',
  '"supabaseSql": "yes"',
  '"acceptedForExecutionTodayCount": 15',
  '"readyForExecutionTodayCount": 15',
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
      status: 'worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedSoundCpuToolCount: review.acceptedEvidence.acceptedSoundCpuToolCount,
      criteriaCountAccepted: review.acceptedEvidence.criteriaCountAccepted,
      stopConditionCountAccepted: review.acceptedEvidence.stopConditionCountAccepted,
      acceptedForExecutionTodayCount: acceptance.counts.acceptedForExecutionTodayCount,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
