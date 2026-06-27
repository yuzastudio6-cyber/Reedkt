import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runProof } from './worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-after-image-import-proof-runner.mjs'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_internal_runner_boundary_execution_proof_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_plan_after_image_import_proof_completed_with_warnings_ready_for_limited_internal_runner_boundary_execution_owner_review_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-acceptance-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-evidence-review-register-after-image-import-proof.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-boundary-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-review-after-image-import-proof.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-after-image-import-proof.md',
  sourceTools: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-tool-register-after-image-import-proof.md',
  sourcePayload: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-payload-register-after-image-import-proof.md',
  sourceGuards: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-guard-register-after-image-import-proof.md',
  sourceBlockers: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-blocker-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-claim-policy-after-image-import-proof.md'
}

const expectedTools = [
  'librosa',
  'audioread',
  'pydub',
  'pydub_effects',
  'scipy',
  'resampy',
  'pyloudnorm',
  'ebu_r128_pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval'
]

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

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-review-after-image-import-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-acceptance-register-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-evidence-review-register-after-image-import-proof')
const boundary = parseBlock(files.boundary, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-boundary-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-claim-policy-after-image-import-proof')
const sourcePlan = parseBlock(files.sourcePlan, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-after-image-import-proof')
const sourceTools = parseBlock(files.sourceTools, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-tool-register-after-image-import-proof')
const sourcePayload = parseBlock(files.sourcePayload, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-payload-register-after-image-import-proof')
const sourceGuards = parseBlock(files.sourceGuards, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-guard-register-after-image-import-proof')
const sourceBlockers = parseBlock(files.sourceBlockers, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-blocker-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-claim-policy-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [review, acceptance, evidence, boundary, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

const liveProof = runProof()
assert(liveProof.status === 'passed', 'controlled preflight proof no longer passes')
assert(liveProof.allowPassedCount === 15, 'live allow count mismatch')
assert(liveProof.blockedPassedCount === 14, 'live blocked count mismatch')
assert(liveProof.failedFixtures.length === 0, 'live failed fixtures present')
assert(liveProof.productToolCallExecution === 'no', 'live product execution widened')
assert(liveProof.workerExecution === 'no', 'live worker execution widened')
assert(liveProof.internalBetaUnlock === 'no', 'live internal beta widened')

assert(review.sourceDecision === sourceDecision, 'source decision mismatch')
assert(review.sourcePr === 1221, 'source PR mismatch')
assert(review.sourceMergeCommit === '8813960ef7f6c868141669c887eaecc62490bd5f', 'source merge mismatch')
assert(review.acceptedPlanEvidence.controlledProofMayProceedInNextGate === true, 'next proof planning not accepted')
assert(review.acceptedPlanEvidence.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(review.acceptedPlanEvidence.allowPassedCount === 15, 'allow count mismatch')
assert(review.acceptedPlanEvidence.forbiddenPayloadStopCount === 14, 'forbidden stop count mismatch')
assert(review.acceptedPlanEvidence.failedFixtureCount === 0, 'failed fixture count widened')
assert(review.acceptedPlanEvidence.requiredFieldCount === 9, 'required field count mismatch')
assert(review.acceptedPlanEvidence.runtimeFlagsRequiredFalseCount === 3, 'false runtime flag count mismatch')
assert(review.acceptedPlanEvidence.sanitizedEvidenceOnly === true, 'sanitized evidence missing')
assert(review.acceptedForToday.controlledLimitedInternalRunnerBoundaryExecutionProofPlanning === 'yes', 'controlled proof planning not accepted')

for (const key of [
  'controlledLimitedInternalRunnerBoundaryExecutionProofInThisOwnerReview',
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

assert(acceptance.counts.acceptedControlledProofPlanningItemCount === 10, 'accepted planning count mismatch')
assert(acceptance.counts.notAcceptedForExecutionTodayCount === 22, 'not accepted count mismatch')
assert(acceptance.counts.acceptedForProductExecutionTodayCount === 0, 'product execution count widened')
assert(acceptance.counts.acceptedForWorkerExecutionTodayCount === 0, 'worker execution count widened')
assert(acceptance.counts.acceptedForInternalBetaTodayCount === 0, 'internal beta count widened')
assert(acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'external beta count widened')
assert(acceptance.counts.acceptedForProductionTodayCount === 0, 'production count widened')
for (const item of ['product_tool_call_execution', 'media_file_open', 'artifact_write_or_storage_transfer', 'supabase_mutation', 'sql_execution']) {
  assert(acceptance.notAcceptedForExecutionToday.includes(item), `missing non-acceptance: ${item}`)
}

assert(evidence.sourceEvidence.executionPlanPr === 1221, 'evidence source PR mismatch')
assert(evidence.sourceEvidence.executionPlanMergeCommit === '8813960ef7f6c868141669c887eaecc62490bd5f', 'evidence source merge mismatch')
assert(evidence.reviewedPlanEvidence.acceptedToolCount === 15, 'evidence tool count mismatch')
assert(evidence.reviewedPlanEvidence.allowPassedCount === 15, 'evidence allow count mismatch')
assert(evidence.reviewedPlanEvidence.forbiddenPayloadStopCount === 14, 'evidence stop count mismatch')
assert(evidence.reviewedPlanEvidence.failedFixtureCount === 0, 'evidence failed count widened')
assert(evidence.reviewedPlanEvidence.ownerReviewRequiredBeforeFutureProof === true, 'source owner-review guard missing')
assert(evidence.notEvidenceFor.includes('generated_local_fixture_passed'), 'generated fixture non-evidence missing')
assert(evidence.notEvidenceFor.includes('dry_run_passed'), 'dry-run non-evidence missing')
assert(evidence.evidenceStatus === 'accepted_for_controlled_limited_internal_runner_boundary_execution_proof_planning_only', 'evidence status widened')

assert(boundary.boundary.controlledLimitedInternalRunnerBoundaryExecutionProofPlanningMayProceed === true, 'proof planning boundary missing')
for (const key of [
  'controlledLimitedInternalRunnerBoundaryExecutionProofReadyToday',
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
assert(boundary.counts.readyForExecutionTodayCount === 0, 'execution readiness count widened')
assert(boundary.counts.readyForInternalBetaTodayCount === 0, 'internal beta readiness widened')
assert(boundary.counts.readyForExternalBetaTodayCount === 0, 'external beta readiness widened')
assert(boundary.counts.readyForProductionTodayCount === 0, 'production readiness widened')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 4, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product blocker widened')
assert(blockers.nextBlocker.recommendedPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-LIMITED-INTERNAL-RUNNER-BOUNDARY-EXECUTION-PROOF-AFTER-IMAGE-IMPORT-PROOF', 'next prompt mismatch')

assert(policy.allowedClaims.controlledLimitedInternalRunnerBoundaryExecutionProofPlanningMayProceed === true, 'allowed proof planning claim missing')
assert(policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(policy.allowedClaims.allowPassedCount === 15, 'allowed allow count mismatch')
assert(policy.allowedClaims.forbiddenPayloadStopCount === 14, 'allowed stop count mismatch')
assert(policy.allowedClaims.failedFixtureCount === 0, 'allowed failed count widened')
assert(policy.forbiddenClaims.controlledLimitedInternalRunnerBoundaryExecutionProofPassed === true, 'proof pass forbidden missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.internalBetaUnlocked === true, 'internal beta forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.generated_local_fixture_passed === true, 'generated fixture forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourcePlan.decision === sourceDecision, 'source plan decision mismatch')
assert(sourcePlan.sourcePr === 1219, 'source plan upstream PR mismatch')
assert(sourcePlan.sourceMergeCommit === '9fc6a76f407ecc16d79501f9df2f74409568a2c7', 'source plan upstream merge mismatch')
assert(sourcePlan.executionPlan.acceptedSoundCpuToolCount === 15, 'source plan tool count mismatch')
assert(sourcePlan.executionPlan.allowPassedCount === 15, 'source plan allow count mismatch')
assert(sourcePlan.executionPlan.forbiddenPayloadStopCount === 14, 'source plan stop count mismatch')
assert(sourcePlan.executionPlan.failedFixtureCount === 0, 'source plan failed count widened')
assert(sourcePlan.acceptedForToday.productToolCallExecution === 'no', 'source product execution widened')
assert(JSON.stringify(sourceTools.acceptedForFutureLimitedInternalRunnerBoundaryExecutionPlanning) === JSON.stringify(expectedTools), 'source tool list mismatch')
assert(sourceTools.counts.acceptedForProductExecutionTodayCount === 0, 'source product tool count widened')
assert(sourcePayload.counts.requiredFutureSyntheticPayloadFieldCount === 9, 'source payload field count mismatch')
assert(sourcePayload.counts.forbiddenPayloadFamilyCount === 14, 'source forbidden payload count mismatch')
assert(sourceGuards.counts.readyForProductExecutionGuardCount === 0, 'source product guard widened')
assert(sourceBlockers.counts.readyForProductExecutionBlockerCount === 0, 'source product blocker widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-limited-internal-runner-boundary-execution-owner-review-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-review-after-image-import-proof-diagnostics.mjs',
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
  '"controlledLimitedInternalRunnerBoundaryExecutionProofInThisOwnerReview": "yes"',
  '"acceptedForProductExecutionTodayCount": 15',
  '"acceptedForWorkerExecutionTodayCount": 15',
  '"acceptedForInternalBetaTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"acceptedForProductionTodayCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled',
  'production ready'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: review.sourcePr,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedSoundCpuToolCount: review.acceptedPlanEvidence.acceptedSoundCpuToolCount,
      allowPassedCount: review.acceptedPlanEvidence.allowPassedCount,
      forbiddenPayloadStopCount: review.acceptedPlanEvidence.forbiddenPayloadStopCount,
      failedFixtureCount: review.acceptedPlanEvidence.failedFixtureCount,
      controlledProofPlanningMayProceed: review.acceptedPlanEvidence.controlledProofMayProceedInNextGate,
      productExecutionAuthorizedToday: review.acceptedForToday.productToolCallExecution,
      workerExecutionAuthorizedToday: review.acceptedForToday.workerExecution,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
