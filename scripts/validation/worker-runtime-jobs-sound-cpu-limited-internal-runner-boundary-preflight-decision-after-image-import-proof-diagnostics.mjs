import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_decision_after_image_import_proof_passed_with_warnings_ready_for_limited_internal_runner_boundary_preflight_plan_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_beta_runner_boundary_preflight_proof_owner_review_after_image_import_proof_passed_with_warnings_ready_for_limited_internal_runner_boundary_preflight_decision_after_image_import_proof'

const files = {
  decision: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-evidence-register-after-image-import-proof.md',
  scope: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-scope-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-plan-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-after-image-import-proof.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-review-after-image-import-proof.md',
  sourceAcceptance: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-acceptance-register-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-evidence-review-register-after-image-import-proof.md',
  sourceBoundary: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-boundary-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-claim-policy-after-image-import-proof.md',
  controlledProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof.md',
  controlledProofEvidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-evidence-register-after-image-import-proof.md'
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

const decisionDoc = parseBlock(files.decision, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-evidence-register-after-image-import-proof')
const scope = parseBlock(files.scope, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-scope-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-claim-policy-after-image-import-proof')
const sourceReview = parseBlock(files.sourceReview, 'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-review-after-image-import-proof')
const sourceAcceptance = parseBlock(files.sourceAcceptance, 'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-acceptance-register-after-image-import-proof')
const sourceEvidence = parseBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-evidence-review-register-after-image-import-proof')
const sourceBoundary = parseBlock(files.sourceBoundary, 'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-boundary-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-claim-policy-after-image-import-proof')
const controlledProof = parseBlock(files.controlledProof, 'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof')
const controlledProofEvidence = parseBlock(files.controlledProofEvidence, 'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-evidence-register-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [decisionDoc, evidence, scope, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(decisionDoc.sourceDecision === sourceDecision, 'source decision mismatch')
assert(decisionDoc.sourcePr === 1202, 'source PR mismatch')
assert(decisionDoc.sourceMergeCommit === '0f14c9b9727451cc65dd00d269eafcb02d367cef', 'source merge mismatch')
assert(decisionDoc.acceptedDecision.limitedInternalRunnerBoundaryPreflightPlanningMayProceed === true, 'limited internal planning not accepted')
assert(decisionDoc.acceptedDecision.boundedNoMediaNoArtifactScope === true, 'bounded scope missing')
assert(decisionDoc.acceptedDecision.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(decisionDoc.acceptedDecision.allowPassedCount === 15, 'allow count mismatch')
assert(decisionDoc.acceptedDecision.blockedPassedCount === 14, 'blocked count mismatch')
assert(decisionDoc.acceptedDecision.failedFixtureCount === 0, 'failed fixture count widened')
assert(decisionDoc.acceptedDecision.productExecutionAuthorizedCount === 0, 'product execution widened')
assert(decisionDoc.acceptedDecision.internalBetaUnlockCount === 0, 'internal beta unlock widened')
assert(decisionDoc.acceptedDecision.externalBetaReadyCount === 0, 'external beta widened')
assert(decisionDoc.acceptedDecision.productionReadyCount === 0, 'production widened')
assert(decisionDoc.acceptedDecision.sanitizedEvidenceOnly === true, 'sanitized evidence missing')
assert(decisionDoc.acceptedForToday.limitedInternalRunnerBoundaryPreflightPlanning === 'yes', 'next planning not accepted')

for (const key of [
  'limitedInternalRunnerBoundaryPreflightExecution',
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
  assert(decisionDoc.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(evidence.sourceEvidence.proofOwnerReviewPr === 1202, 'evidence owner review PR mismatch')
assert(evidence.sourceEvidence.proofOwnerReviewMergeCommit === '0f14c9b9727451cc65dd00d269eafcb02d367cef', 'evidence owner review merge mismatch')
assert(evidence.acceptedProofEvidence.acceptedToolCount === 15, 'evidence tool count mismatch')
assert(evidence.acceptedProofEvidence.allowPassedCount === 15, 'evidence allow count mismatch')
assert(evidence.acceptedProofEvidence.blockedPassedCount === 14, 'evidence blocked count mismatch')
assert(evidence.acceptedProofEvidence.failedFixtureCount === 0, 'evidence failed count widened')
assert(evidence.acceptedProofEvidence.syntheticPayloadFixturesOnly === true, 'synthetic evidence missing')
assert(evidence.acceptedProofEvidence.sanitizedEvidenceOnly === true, 'sanitized evidence missing')
assert(evidence.notEvidenceFor.includes('generated_local_fixture_passed'), 'generated fixture non-evidence missing')
assert(evidence.notEvidenceFor.includes('dry_run_passed'), 'dry-run non-evidence missing')
assert(evidence.evidenceStatus === 'accepted_for_limited_internal_runner_boundary_preflight_planning_only', 'evidence status widened')

assert(scope.counts.authorizedNextPlanningItemCount === 6, 'authorized planning count mismatch')
assert(scope.counts.notAuthorizedTodayCount === 21, 'not authorized count mismatch')
for (const key of [
  'productExecutionAuthorizedCount',
  'workerExecutionAuthorizedCount',
  'mediaProcessingAuthorizedCount',
  'artifactDeliveryAuthorizedCount',
  'supabaseSqlAuthorizedCount',
  'betaUnlockAuthorizedCount',
  'productionUnlockAuthorizedCount'
]) {
  assert(scope.counts[key] === 0, `${key} widened`)
}
assert(scope.notAuthorized.includes('product_tool_call_execution'), 'product execution non-authorization missing')
assert(scope.notAuthorized.includes('dry_run_passed_claim'), 'dry-run non-authorization missing')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 3, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product blocker widened')

assert(policy.allowedClaims.limitedInternalRunnerBoundaryPreflightPlanningMayProceed === true, 'allowed planning claim missing')
assert(policy.allowedClaims.boundedNoMediaNoArtifactScopePreserved === true, 'allowed bounded claim missing')
assert(policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(policy.allowedClaims.allowPassedCount === 15, 'allowed allow count mismatch')
assert(policy.allowedClaims.blockedPassedCount === 14, 'allowed blocked count mismatch')
assert(policy.allowedClaims.failedFixtureCount === 0, 'allowed failed count widened')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.internalBetaUnlocked === true, 'internal beta forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.generated_local_fixture_passed === true, 'generated fixture forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourceReview.decision === sourceDecision, 'source review decision mismatch')
assert(sourceReview.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourceReview.acceptedEvidence.allowPassedCount === 15, 'source allow count mismatch')
assert(sourceReview.acceptedEvidence.blockedPassedCount === 14, 'source blocked count mismatch')
assert(sourceReview.acceptedEvidence.failedFixtureCount === 0, 'source failed fixtures widened')
assert(sourceReview.acceptedEvidence.productExecutionAuthorizedCount === 0, 'source product execution widened')
assert(sourceReview.acceptedEvidence.externalBetaReadyCount === 0, 'source external beta widened')
assert(sourceReview.acceptedEvidence.productionReadyCount === 0, 'source production widened')
assert(sourceAcceptance.counts.acceptedForProductExecutionTodayCount === 0, 'source product execution count widened')
assert(sourceAcceptance.counts.acceptedForExternalBetaTodayCount === 0, 'source external beta count widened')
assert(sourceAcceptance.counts.acceptedForProductionTodayCount === 0, 'source production count widened')
assert(sourceEvidence.reviewedProofEvidence.failedFixtureCount === 0, 'source evidence failed count widened')
assert(sourceBoundary.counts.readyForExecutionTodayCount === 0, 'source execution readiness widened')
assert(sourceBoundary.boundary.externalBetaReadyToday === false, 'source external beta readiness widened')
assert(sourceBoundary.boundary.productionReadyToday === false, 'source production readiness widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

assert(controlledProof.result.allowPassedCount === 15, 'controlled proof allow count mismatch')
assert(controlledProof.result.blockedPassedCount === 14, 'controlled proof blocked count mismatch')
assert(controlledProof.result.failedFixtures.length === 0, 'controlled proof failures widened')
assert(controlledProof.scope.productToolCallExecution === 'no', 'controlled proof product execution widened')
assert(controlledProof.scope.workerExecution === 'no', 'controlled proof worker execution widened')
assert(controlledProofEvidence.proofEvidence.failedFixtureCount === 0, 'controlled proof evidence failed count widened')
assert(controlledProofEvidence.evidenceStatus === 'accepted_for_owner_review_only', 'controlled proof evidence status mismatch')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-limited-internal-runner-boundary-preflight-decision-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-after-image-import-proof-diagnostics.mjs',
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
  '"betaUnlockAuthorizedCount": 15',
  '"externalBetaReadyCount": 15',
  '"productionReadyCount": 15',
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
      status: 'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_decision_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: decisionDoc.sourcePr,
      sourceMergeCommit: decisionDoc.sourceMergeCommit,
      acceptedSoundCpuToolCount: decisionDoc.acceptedDecision.acceptedSoundCpuToolCount,
      allowPassedCount: decisionDoc.acceptedDecision.allowPassedCount,
      blockedPassedCount: decisionDoc.acceptedDecision.blockedPassedCount,
      failedFixtureCount: decisionDoc.acceptedDecision.failedFixtureCount,
      productExecutionAuthorizedCount: decisionDoc.acceptedDecision.productExecutionAuthorizedCount,
      internalBetaUnlockCount: decisionDoc.acceptedDecision.internalBetaUnlockCount,
      externalBetaReadyCount: decisionDoc.acceptedDecision.externalBetaReadyCount,
      productionReadyCount: decisionDoc.acceptedDecision.productionReadyCount,
      nextPrompt: decisionDoc.nextPrompt
    },
    null,
    2
  )
)
