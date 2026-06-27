import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_runner_boundary_proof_owner_review_after_image_import_proof_passed_with_warnings_ready_for_runner_boundary_reauthorization_decision_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-acceptance-register-after-image-import-proof.md',
  evidenceReview: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-evidence-review-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-decision-after-image-import-proof.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-proof-after-image-import-proof.md',
  sourceAllowlist: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-allowlist-proof-register-after-image-import-proof.md',
  sourceBlocked: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-blocked-payload-register-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-sanitized-evidence-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-claim-policy-after-image-import-proof.md'
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

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-review-after-image-import-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-acceptance-register-after-image-import-proof')
const evidenceReview = parseBlock(files.evidenceReview, 'worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-evidence-review-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-claim-policy-after-image-import-proof')
const sourceProof = parseBlock(files.sourceProof, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-proof-after-image-import-proof')
const sourceAllowlist = parseBlock(files.sourceAllowlist, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-allowlist-proof-register-after-image-import-proof')
const sourceBlocked = parseBlock(files.sourceBlocked, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-blocked-payload-register-after-image-import-proof')
const sourceEvidence = parseBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-sanitized-evidence-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-claim-policy-after-image-import-proof')

read(files.prompt)

for (const row of [review, acceptance, evidenceReview, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(review.sourcePr === 1188, 'source PR mismatch')
assert(review.sourceMergeCommit === 'a9c1e37e765663f3d8f1d5cc351b27683b81ddbc', 'source merge mismatch')
assert(review.acceptedEvidence.controlledRunnerBoundaryProofAccepted === true, 'proof not accepted')
assert(review.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(review.acceptedEvidence.allowPassedCount === 15, 'allow count mismatch')
assert(review.acceptedEvidence.blockedPassedCount === 14, 'blocked count mismatch')
assert(review.acceptedEvidence.failedFixtureCount === 0, 'failed fixture count widened')
assert(review.acceptedEvidence.sanitizedEvidenceOnly === true, 'sanitized evidence missing')
assert(review.acceptedForToday.runnerBoundaryReauthorizationDecisionMayProceed === 'yes', 'next decision not allowed')

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

assert(acceptance.counts.acceptedFutureDecisionItemCount === 5, 'future decision item count mismatch')
assert(acceptance.counts.acceptedForExecutionTodayCount === 0, 'accepted execution count widened')
assert(acceptance.notAcceptedForExecutionToday.includes('runner_boundary_reauthorization'), 'runner reauth non-acceptance missing')
assert(acceptance.notAcceptedForExecutionToday.includes('external_beta_unlock'), 'external beta non-acceptance missing')

for (const [key, value] of Object.entries(evidenceReview.reviewFindings)) {
  assert(value === true, `evidence finding not accepted: ${key}`)
}
assert(evidenceReview.futureDecisionScope === 'runner_boundary_reauthorization_decision_only', 'future decision scope widened')
assert(evidenceReview.productExecutionAccepted === false, 'product execution accepted unexpectedly')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 3, 'blocked later count mismatch')
assert(blockers.counts.readyForExecutionBlockerCount === 0, 'execution blocker count widened')
assert(policy.allowedClaims.controlledRunnerBoundaryProofOwnerReviewed === true, 'allowed proof review claim missing')
assert(policy.forbiddenClaims.runnerBoundaryReauthorizedToday === true, 'runner reauth forbidden missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'execution forbidden missing')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(
  sourceProof.decision ===
    'worker_runtime_jobs_sound_cpu_controlled_runner_boundary_proof_after_image_import_proof_passed_with_warnings_ready_for_runner_boundary_proof_owner_review_after_image_import_proof',
  'source proof decision mismatch'
)
assert(sourceProof.sourcePr === 1186, 'source proof PR mismatch')
assert(sourceProof.result.status === 'passed', 'source proof did not pass')
assert(sourceProof.result.acceptedToolCount === 15, 'source proof tool count mismatch')
assert(sourceProof.result.allowPassedCount === 15, 'source proof allow mismatch')
assert(sourceProof.result.blockedPassedCount === 14, 'source proof block mismatch')
assert(sourceAllowlist.allowFixtureResult.allowFailedCount === 0, 'source allow failures present')
assert(sourceBlocked.blockedFixtureResult.blockedFailedCount === 0, 'source block failures present')
assert(sourceEvidence.trackedRepoMutationFromProof === false, 'source proof tracked mutation widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-runner-boundary-proof-owner-review-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-review-after-image-import-proof-diagnostics.mjs',
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
      status: 'worker_runtime_jobs_sound_cpu_runner_boundary_proof_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedSoundCpuToolCount: review.acceptedEvidence.acceptedSoundCpuToolCount,
      allowPassedCount: review.acceptedEvidence.allowPassedCount,
      blockedPassedCount: review.acceptedEvidence.blockedPassedCount,
      acceptedForExecutionTodayCount: acceptance.counts.acceptedForExecutionTodayCount,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
