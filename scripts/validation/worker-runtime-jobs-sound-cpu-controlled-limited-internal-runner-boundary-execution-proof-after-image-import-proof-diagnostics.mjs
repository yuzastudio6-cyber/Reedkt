import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runProof } from './worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof-runner.mjs'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_execution_proof_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_internal_runner_boundary_execution_proof_owner_review_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_internal_runner_boundary_execution_proof_after_image_import_proof'

const files = {
  proof: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-evidence-register-after-image-import-proof.md',
  payload: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-payload-register-after-image-import-proof.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-result-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-review-after-image-import-proof.md',
  sourceAcceptance: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-acceptance-register-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-evidence-review-register-after-image-import-proof.md',
  sourceBoundary: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-boundary-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-claim-policy-after-image-import-proof.md',
  runner: 'scripts/validation/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof-runner.mjs'
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

const proof = parseBlock(files.proof, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-evidence-register-after-image-import-proof')
const payload = parseBlock(files.payload, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-payload-register-after-image-import-proof')
const result = parseBlock(files.result, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-result-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-claim-policy-after-image-import-proof')
const sourceReview = parseBlock(files.sourceReview, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-review-after-image-import-proof')
const sourceAcceptance = parseBlock(files.sourceAcceptance, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-acceptance-register-after-image-import-proof')
const sourceEvidence = parseBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-evidence-review-register-after-image-import-proof')
const sourceBoundary = parseBlock(files.sourceBoundary, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-boundary-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-claim-policy-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [proof, evidence, payload, result, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

const liveProof = runProof()
assert(liveProof.status === 'passed', 'controlled execution proof failed')
assert(liveProof.decision === decision, 'live decision mismatch')
assert(liveProof.sourcePr === 1224, 'live source PR mismatch')
assert(liveProof.sourceMergeCommit === 'b04e7f27520ed7c860690f709d54385c1ebb009f', 'live source merge mismatch')
assert(liveProof.acceptedToolCount === 15, 'live accepted tool count mismatch')
assert(liveProof.allowFixtureCount === 15, 'live allow fixture count mismatch')
assert(liveProof.allowPassedCount === 15, 'live allow pass count mismatch')
assert(liveProof.blockedFixtureCount === 14, 'live blocked fixture count mismatch')
assert(liveProof.blockedPassedCount === 14, 'live blocked pass count mismatch')
assert(liveProof.failedFixtures.length === 0, 'live failed fixtures present')
assert(liveProof.requiredFieldCount === 9, 'live required field count mismatch')
assert(liveProof.runtimeFlagsRequiredFalseCount === 3, 'live false runtime flag count mismatch')
assert(liveProof.forbiddenPayloadFamilyCount === 14, 'live forbidden family count mismatch')

for (const key of [
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
  assert(liveProof[key] === 'no', `live ${key} widened`)
  assert(proof.scope[key] === 'no', `proof scope ${key} widened`)
}

assert(proof.sourceDecision === sourceDecision, 'source decision mismatch')
assert(proof.sourcePr === 1224, 'source PR mismatch')
assert(proof.sourceMergeCommit === 'b04e7f27520ed7c860690f709d54385c1ebb009f', 'source merge mismatch')
assert(proof.result.proofStatus === 'passed', 'proof status mismatch')
assert(proof.result.acceptedSoundCpuToolCount === 15, 'proof tool count mismatch')
assert(proof.result.allowPassedCount === 15, 'proof allow count mismatch')
assert(proof.result.blockedPassedCount === 14, 'proof blocked count mismatch')
assert(proof.result.failedFixtureCount === 0, 'proof failure count widened')
assert(proof.scope.controlledLimitedInternalRunnerBoundaryExecutionProof === 'yes', 'controlled proof claim missing')

assert(evidence.sourceEvidence.executionOwnerReviewPr === 1224, 'evidence source PR mismatch')
assert(evidence.proofEvidence.acceptedToolCount === 15, 'evidence tool count mismatch')
assert(evidence.proofEvidence.allowPassedCount === 15, 'evidence allow count mismatch')
assert(evidence.proofEvidence.blockedPassedCount === 14, 'evidence blocked count mismatch')
assert(evidence.proofEvidence.failedFixtureCount === 0, 'evidence failed count widened')
assert(evidence.notEvidenceFor.includes('generated_local_fixture_passed'), 'generated fixture non-evidence missing')
assert(evidence.notEvidenceFor.includes('dry_run_passed'), 'dry-run non-evidence missing')
assert(evidence.evidenceStatus === 'accepted_for_owner_review_only', 'evidence status widened')

assert(payload.counts.requiredPayloadFieldCount === 9, 'payload required field count mismatch')
assert(payload.counts.runtimeFlagsVerifiedFalseCount === 3, 'payload false flag count mismatch')
assert(payload.counts.forbiddenPayloadFamilyStopCount === 14, 'payload forbidden stop count mismatch')
assert(payload.counts.permittedProductPayloadFamilyCountToday === 0, 'product payload count widened')
for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey', 'toolId']) {
  assert(payload.requiredPayloadFieldsVerified.includes(field), `missing required payload field: ${field}`)
}
for (const forbidden of ['rawPrompt', 'mediaFilePath', 'artifactWriteTarget', 'supabaseWriteIntent', 'sqlStatement', 'dockerRunRequest']) {
  assert(payload.forbiddenPayloadFamiliesStopped.includes(forbidden), `missing forbidden payload family: ${forbidden}`)
}

assert(result.allowlistResult.fixtureCount === 15, 'result allow fixture count mismatch')
assert(result.allowlistResult.passedCount === 15, 'result allow pass count mismatch')
assert(result.forbiddenPayloadResult.fixtureCount === 14, 'result forbidden fixture count mismatch')
assert(result.forbiddenPayloadResult.stoppedCount === 14, 'result forbidden stop count mismatch')
assert(result.toolResultCounts.productExecutionReadyCount === 0, 'result product execution widened')
assert(result.toolResultCounts.workerExecutionReadyCount === 0, 'result worker execution widened')
assert(result.toolResultCounts.internalBetaReadyCount === 0, 'result internal beta widened')
assert(result.toolResultCounts.externalBetaReadyCount === 0, 'result external beta widened')
assert(result.toolResultCounts.productionReadyCount === 0, 'result production widened')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 4, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product blocker widened')
assert(blockers.nextBlocker.recommendedPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-LIMITED-INTERNAL-RUNNER-BOUNDARY-EXECUTION-PROOF-OWNER-REVIEW-AFTER-IMAGE-IMPORT-PROOF', 'next prompt mismatch')

assert(policy.allowedClaims.controlledLimitedInternalRunnerBoundaryExecutionProofPassed === true, 'allowed proof claim missing')
assert(policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(policy.allowedClaims.allowPassedCount === 15, 'allowed allow count mismatch')
assert(policy.allowedClaims.forbiddenPayloadStopCount === 14, 'allowed stop count mismatch')
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
assert(sourceReview.sourcePr === 1221, 'source review upstream PR mismatch')
assert(sourceReview.sourceMergeCommit === '8813960ef7f6c868141669c887eaecc62490bd5f', 'source review upstream merge mismatch')
assert(sourceReview.acceptedPlanEvidence.controlledProofMayProceedInNextGate === true, 'source proof planning missing')
assert(sourceReview.acceptedPlanEvidence.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourceReview.acceptedPlanEvidence.allowPassedCount === 15, 'source allow count mismatch')
assert(sourceReview.acceptedPlanEvidence.forbiddenPayloadStopCount === 14, 'source stop count mismatch')
assert(sourceReview.acceptedPlanEvidence.failedFixtureCount === 0, 'source failed count widened')
assert(sourceReview.acceptedForToday.productToolCallExecution === 'no', 'source product execution widened')
assert(sourceAcceptance.counts.acceptedForProductExecutionTodayCount === 0, 'source product count widened')
assert(sourceEvidence.reviewedPlanEvidence.failedFixtureCount === 0, 'source evidence failed widened')
assert(sourceBoundary.counts.readyForExecutionTodayCount === 0, 'source execution readiness widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const runnerText = read(files.runner)
for (const forbidden of [
  'docker build',
  'docker run',
  'gh pr merge',
  '@supabase/',
  'createClient(',
  'createSignedUrl',
  'audio_open',
  'ffmpeg'
]) {
  assert(!runnerText.includes(forbidden), `runner contains forbidden operation text: ${forbidden}`)
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof:proof'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof-runner.mjs',
  'package proof script missing'
)
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof-diagnostics.mjs',
  'package diagnostics script missing'
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
  '"productExecutionReadyCount": 15',
  '"workerExecutionReadyCount": 15',
  '"internalBetaReadyCount": 15',
  '"externalBetaReadyCount": 15',
  '"productionReadyCount": 15',
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
      status: 'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_execution_proof_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: proof.sourcePr,
      sourceMergeCommit: proof.sourceMergeCommit,
      acceptedToolCount: liveProof.acceptedToolCount,
      allowPassedCount: liveProof.allowPassedCount,
      blockedPassedCount: liveProof.blockedPassedCount,
      failedFixtureCount: liveProof.failedFixtures.length,
      productToolCallExecution: liveProof.productToolCallExecution,
      workerExecution: liveProof.workerExecution,
      nextPrompt: proof.nextPrompt
    },
    null,
    2
  )
)
