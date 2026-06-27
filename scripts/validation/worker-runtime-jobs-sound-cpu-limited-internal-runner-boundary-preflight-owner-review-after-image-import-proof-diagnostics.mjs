import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_internal_runner_boundary_preflight_proof_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_plan_after_image_import_proof_completed_with_warnings_ready_for_limited_internal_runner_boundary_preflight_owner_review_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-acceptance-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-evidence-review-register-after-image-import-proof.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-boundary-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-review-after-image-import-proof.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-plan-after-image-import-proof.md',
  sourceScope: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-scope-register-after-image-import-proof.md',
  sourceTools: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-tool-register-after-image-import-proof.md',
  sourcePayload: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-payload-guard-register-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-evidence-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-claim-policy-after-image-import-proof.md'
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

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-review-after-image-import-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-acceptance-register-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-evidence-review-register-after-image-import-proof')
const boundary = parseBlock(files.boundary, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-boundary-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-claim-policy-after-image-import-proof')
const sourcePlan = parseBlock(files.sourcePlan, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-plan-after-image-import-proof')
const sourceScope = parseBlock(files.sourceScope, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-scope-register-after-image-import-proof')
const sourceTools = parseBlock(files.sourceTools, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-tool-register-after-image-import-proof')
const sourcePayload = parseBlock(files.sourcePayload, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-payload-guard-register-after-image-import-proof')
const sourceEvidence = parseBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-evidence-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-claim-policy-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [review, acceptance, evidence, boundary, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(review.sourceDecision === sourceDecision, 'source decision mismatch')
assert(review.sourcePr === 1209, 'source PR mismatch')
assert(review.sourceMergeCommit === '5125d6b461328a3487371c9dbed0ff2469ece09d', 'source merge mismatch')
assert(review.acceptedEvidence.limitedInternalRunnerBoundaryPreflightPlan === 'accepted_for_controlled_synthetic_preflight_proof_planning_only', 'review acceptance widened')
assert(review.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(review.acceptedEvidence.allowFixturePassCount === 15, 'allow pass count mismatch')
assert(review.acceptedEvidence.forbiddenPayloadStopCount === 14, 'forbidden stop count mismatch')
assert(review.acceptedEvidence.failedFixtureCount === 0, 'failed count widened')
assert(review.acceptedEvidence.requiredSyntheticPayloadFieldCount === 9, 'required field count mismatch')
assert(review.acceptedEvidence.runtimeFlagsRequiredFalseCount === 3, 'false runtime flag count mismatch')
assert(review.acceptedEvidence.productExecutionAuthorizedCount === 0, 'product execution widened')
assert(review.acceptedEvidence.workerExecutionAuthorizedCount === 0, 'worker execution widened')
assert(review.acceptedEvidence.internalBetaUnlockCount === 0, 'internal beta widened')
assert(review.acceptedEvidence.externalBetaReadyCount === 0, 'external beta widened')
assert(review.acceptedEvidence.productionReadyCount === 0, 'production widened')
assert(review.acceptedForToday.controlledLimitedInternalRunnerBoundaryPreflightProofPlanning === 'yes', 'controlled proof planning not accepted')

for (const key of [
  'controlledLimitedInternalRunnerBoundaryPreflightProofExecution',
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaFileOpen',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(review.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(acceptance.acceptedForControlledSyntheticProofPlanning.length === 7, 'accepted planning count mismatch')
assert(acceptance.counts.acceptedPlanningItemCount === 7, 'accepted planning item count mismatch')
assert(acceptance.counts.notAcceptedForExecutionTodayCount === 19, 'not accepted execution count mismatch')
assert(acceptance.counts.acceptedForProductExecutionTodayCount === 0, 'product execution accepted')
assert(acceptance.counts.acceptedForWorkerExecutionTodayCount === 0, 'worker execution accepted')
assert(acceptance.counts.acceptedForInternalBetaTodayCount === 0, 'internal beta accepted')
assert(acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'external beta accepted')
assert(acceptance.counts.acceptedForProductionTodayCount === 0, 'production accepted')

assert(evidence.sourceEvidence.preflightPlanPr === 1209, 'evidence source PR mismatch')
assert(evidence.sourceEvidence.preflightPlanMergeCommit === '5125d6b461328a3487371c9dbed0ff2469ece09d', 'evidence source merge mismatch')
assert(evidence.reviewResult.acceptedSoundCpuToolCount === 15, 'evidence tool count mismatch')
assert(evidence.reviewResult.allowFixturePassCount === 15, 'evidence allow count mismatch')
assert(evidence.reviewResult.forbiddenPayloadStopCount === 14, 'evidence forbidden count mismatch')
assert(evidence.reviewResult.failedFixtureCount === 0, 'evidence failed count widened')
assert(evidence.reviewResult.requiredSyntheticPayloadFieldCount === 9, 'evidence field count mismatch')
assert(evidence.reviewResult.runtimeFlagsRequiredFalseCount === 3, 'evidence false flag count mismatch')
assert(evidence.reviewResult.productExecutionAuthorizedCount === 0, 'evidence product execution widened')
assert(evidence.notEvidenceFor.includes('generated_local_fixture_passed'), 'generated fixture non-evidence missing')
assert(evidence.notEvidenceFor.includes('dry_run_passed'), 'dry-run non-evidence missing')
assert(evidence.evidenceStatus === 'accepted_for_controlled_synthetic_preflight_proof_planning_only', 'evidence status widened')

assert(boundary.boundary.controlledSyntheticProofPlanningMayProceed === true, 'proof planning boundary missing')
for (const key of [
  'controlledSyntheticProofExecutionReadyToday',
  'limitedInternalRunnerBoundaryPreflightReadyToday',
  'productToolCallExecutionReadyToday',
  'workerExecutionReadyToday',
  'routeExecutionReadyToday',
  'mediaFileOpenReadyToday',
  'mediaProcessingReadyToday',
  'artifactDeliveryReadyToday',
  'supabaseSqlReadyToday',
  'providerModelCallReadyToday',
  'dockerGcpReadyToday',
  'internalBetaUnlockedToday',
  'externalBetaReadyToday',
  'productionReadyToday'
]) {
  assert(boundary.boundary[key] === false, `${key} widened`)
}
assert(boundary.counts.requiredNextProofLimitCount === 8, 'next proof limit count mismatch')
assert(boundary.counts.readyForExecutionTodayCount === 0, 'execution readiness widened')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 3, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product execution blocker widened')

assert(policy.allowedClaims.controlledSyntheticProofPlanningMayProceed === true, 'allowed proof planning claim missing')
assert(policy.allowedClaims.limitedInternalPreflightOwnerReviewPassed === true, 'allowed owner review claim missing')
assert(policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(policy.allowedClaims.forbiddenPayloadStopCount === 14, 'allowed forbidden count mismatch')
assert(policy.allowedClaims.failedFixtureCount === 0, 'allowed failed count widened')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.internalBetaUnlocked === true, 'internal beta forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.generated_local_fixture_passed === true, 'generated fixture forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourcePlan.decision === sourceDecision, 'source plan decision mismatch')
assert(sourcePlan.sourcePr === 1205, 'source plan upstream PR mismatch')
assert(sourcePlan.sourceMergeCommit === '978e702482ec9318498a7e8e897b8f74f05f9e40', 'source plan upstream merge mismatch')
assert(sourcePlan.preflightPlan.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourcePlan.preflightPlan.forbiddenPayloadStopCount === 14, 'source forbidden count mismatch')
assert(sourcePlan.preflightPlan.failedFixtureCount === 0, 'source failed count widened')
assert(sourcePlan.acceptedForToday.productToolCallExecution === 'no', 'source product execution widened')
assert(sourceScope.counts.productExecutionAuthorizedCount === 0, 'source product execution count widened')
assert(sourceScope.counts.betaUnlockAuthorizedCount === 0, 'source beta unlock count widened')
assert(sourceTools.counts.acceptedForProductExecutionTodayCount === 0, 'source tool execution widened')
assert(sourcePayload.counts.forbiddenPayloadFamilyCount === 14, 'source payload forbidden count mismatch')
assert(sourceEvidence.acceptedEvidence.failedFixtureCount === 0, 'source evidence failed count widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-limited-internal-runner-boundary-preflight-owner-review-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-review-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecution": "yes"',
  '"workerExecution": "yes"',
  '"routeExecution": "yes"',
  '"mediaFileOpen": "yes"',
  '"mediaProcessing": "yes"',
  '"artifactWrites": "yes"',
  '"supabaseSql": "yes"',
  '"internalBetaUnlock": "yes"',
  '"externalBetaUnlock": "yes"',
  '"productionUnlock": "yes"',
  '"productExecutionAuthorizedCount": 15',
  '"workerExecutionAuthorizedCount": 15',
  '"internalBetaUnlockCount": 15',
  '"acceptedForProductExecutionTodayCount": 15',
  '"acceptedForInternalBetaTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"acceptedForProductionTodayCount": 15',
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
      status:
        'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: review.sourcePr,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedSoundCpuToolCount: review.acceptedEvidence.acceptedSoundCpuToolCount,
      forbiddenPayloadStopCount: review.acceptedEvidence.forbiddenPayloadStopCount,
      controlledSyntheticProofPlanningMayProceed: boundary.boundary.controlledSyntheticProofPlanningMayProceed,
      productExecutionAuthorizedCount: review.acceptedEvidence.productExecutionAuthorizedCount,
      internalBetaUnlockCount: review.acceptedEvidence.internalBetaUnlockCount,
      externalBetaReadyToday: boundary.boundary.externalBetaReadyToday,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
