import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_beta_tool_call_gap_closure_owner_review_after_image_import_proof_passed_with_warnings_ready_for_runner_boundary_reauthorization_plan_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-acceptance-register-after-image-import-proof.md',
  gates: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-remaining-gates-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-plan-after-image-import-proof.md',
  sourceGapClosure: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-after-image-import-proof.md',
  sourceClosureRegister: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-register-after-image-import-proof.md'
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

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-review-after-image-import-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-acceptance-register-after-image-import-proof')
const gates = parseBlock(files.gates, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-remaining-gates-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-claim-policy-after-image-import-proof')
const sourceGapClosure = parseBlock(files.sourceGapClosure, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-after-image-import-proof')
const sourceClosureRegister = parseBlock(files.sourceClosureRegister, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-register-after-image-import-proof')

read(files.prompt)

assert(review.decision === decision, 'review decision mismatch')
assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(gates.decision === decision, 'gates decision mismatch')
assert(policy.decision === decision, 'policy decision mismatch')
assert(review.sourcePr === 1179, 'source PR mismatch')
assert(review.sourceMergeCommit === '9ad6a4173cd581b4078d2398fdbf2a03ded8f5ca', 'source merge mismatch')
assert(review.acceptedEvidence.docsPlanningGapClosed === true, 'docs gap not accepted')
assert(review.acceptedEvidence.convertedToNextGateCount === 3, 'converted gates mismatch')
assert(review.acceptedEvidence.externalBetaReadyCount === 0, 'external beta widened')
assert(review.acceptedEvidence.productionReadyCount === 0, 'production widened')

assert(acceptance.counts.acceptedForExecutionTodayCount === 0, 'execution accepted unexpectedly')
assert(acceptance.notAcceptedForExecutionToday.includes('worker_execution'), 'worker execution non-acceptance missing')
assert(acceptance.notAcceptedForExecutionToday.includes('external_beta'), 'external beta non-acceptance missing')

assert(gates.counts.nextGateCount === 1, 'next gate count mismatch')
assert(gates.counts.requiredLaterGateCount === 2, 'later gate count mismatch')
assert(gates.counts.readyForExecutionGateCount === 0, 'ready execution gate count widened')
assert(gates.remainingGates.some((row) => row.gateId === 'runner_boundary_reauthorization_plan' && row.status === 'next'), 'runner boundary next gate missing')

assert(policy.allowedClaims.runnerBoundaryReauthorizationPlanningMayProceed === true, 'allowed next planning claim missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql widened')

assert(
  sourceGapClosure.decision ===
    'worker_runtime_jobs_sound_cpu_limited_beta_tool_call_gap_closure_after_image_import_proof_completed_with_warnings_ready_for_gap_closure_owner_review_after_image_import_proof',
  'source gap closure decision mismatch'
)
assert(sourceGapClosure.gapClosureResult.externalBetaApprovedToday === false, 'source external beta widened')
assert(sourceClosureRegister.counts.closedGapCount === 1, 'source closed gap count mismatch')
assert(sourceClosureRegister.counts.convertedToNextGateCount === 3, 'source converted gate count mismatch')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-limited-beta-tool-call-gap-closure-owner-review-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-review-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecutionReady": false',
  '"workerExecutionReady": false',
  '"routeExecutionReady": false',
  '"externalBetaReadyCount": 15',
  '"productionReadyCount": 15',
  '"acceptedForExecutionTodayCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_limited_beta_tool_call_gap_closure_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: review.sourceMergeCommit,
      convertedToNextGateCount: review.acceptedEvidence.convertedToNextGateCount,
      nextGateCount: gates.counts.nextGateCount,
      externalBetaReadyCount: review.acceptedEvidence.externalBetaReadyCount,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
