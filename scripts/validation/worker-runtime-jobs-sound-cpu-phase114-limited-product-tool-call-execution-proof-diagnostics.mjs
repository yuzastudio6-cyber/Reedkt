import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase113_limited_product_tool_call_execution_owner_review_passed_with_warnings_ready_for_limited_product_tool_call_execution_proof_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase114_limited_product_tool_call_execution_proof_passed_with_warnings_ready_for_limited_product_tool_call_execution_proof_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE114-LIMITED-PRODUCT-TOOL-CALL-EXECUTION-PROOF-OWNER-REVIEW'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review-result.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof.md',
  runner:
    'scripts/validation/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-runner.mjs',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-result.md',
  output:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-proof-output-register.md',
  verification:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-no-side-effect-verification-register.md',
  coverage:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-tool-coverage-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-review.md',
}

const expectedWorkers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const expectedImages = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
]
const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoOpClassification(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertArrayEquals(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`)
  assert(actual.length === expected.length, `${label} length mismatch`)
  for (const item of expected) assert(actual.includes(item), `${label} missing ${item}`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowProductToolCallExecutionToday',
    'allowRealExternalAgentExecutionToday',
    'allowWorkerDispatchToday',
    'allowRouteExecutionToday',
    'allowManifestPersistenceToday',
    'allowMediaOpenToday',
    'allowProviderCallToday',
    'allowModelCallToday',
    'allowSupabaseMutationToday',
    'allowSqlExecutionToday',
    'allowStorageObjectCreationToday',
    'allowSignedUrlCreationToday',
    'allowArtifactCreationToday',
    'allowBetaUnlockToday',
    'allowProductionUnlockToday',
    'externalAgentExecutionReadyClaimed',
    'productToolCallExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'manifestPersistenceReadyClaimed',
    'realUserMediaExecutionReadyClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'realUserMediaBetaReadyClaimed',
    'productionReadinessClaimed',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review-result',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-result',
  ),
  output: parseJsonBlock(
    docs.output,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-proof-output-register',
  ),
  verification: parseJsonBlock(
    docs.verification,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-no-side-effect-verification-register',
  ),
  coverage: parseJsonBlock(
    docs.coverage,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-tool-coverage-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2068, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '759e09884bfe6f7f1b6f689c776b725ed7c8bdc8',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.limitedProductToolCallExecutionProofMayProceedNext === true, 'source proof permission missing')
assert(parsed.source.soundCpuTools.readyForLimitedProductToolCallExecutionProof === 15, 'source proof count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.proofScope.runLimitedProductToolCallBoundary === true, 'prompt limited boundary missing')
assert(parsed.prompt.proofScope.useSyntheticOrNoMediaInputsOnly === true, 'prompt no-media missing')
assert(parsed.prompt.proofScope.allowedToolCount === 15, 'prompt tool count mismatch')
assertArrayEquals(parsed.prompt.proofScope.allowedWorkers, expectedWorkers, 'prompt workers')
assertArrayEquals(parsed.prompt.proofScope.allowedImages, expectedImages, 'prompt images')
assertArrayEquals(parsed.prompt.proofScope.allowedJobTypes, expectedJobTypes, 'prompt job types')
assert(parsed.prompt.proofScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

const runnerText = read(docs.runner)
assert(runnerText.includes('invokeLimitedProductToolCallBoundary'), 'runner boundary function missing')
assert(runnerText.includes('proofOutputWrittenToDisk: false'), 'runner disk guard missing')
assert(runnerText.includes('realUserMediaUsed: false'), 'runner real media guard missing')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2069, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '892464ccce94e9ab240d3367af2d6009e392110c',
  'result source merge mismatch',
)
assert(parsed.result.proofResult.status === 'passed', 'proof status mismatch')
assert(parsed.result.proofResult.limitedProductToolCallBoundaryInvoked === true, 'limited product boundary not invoked')
assert(parsed.result.proofResult.syntheticOrNoMediaInputAccepted === true, 'synthetic/no-media not accepted')
assert(parsed.result.proofResult.invocationCount === 4, 'invocation count mismatch')
assert(parsed.result.proofResult.acceptedJobTypeCount === 4, 'job type count mismatch')
assert(parsed.result.proofResult.toolCountCovered === 15, 'tool count mismatch')
assert(parsed.result.proofResult.runtimeFlagsAllFalse === true, 'runtime flags mismatch')
for (const key of [
  'realUserMediaUsed',
  'workerDispatched',
  'routeExecuted',
  'manifestPersisted',
  'mediaOpened',
  'supabaseTouched',
  'sqlExecuted',
  'artifactCreated',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assert(parsed.result.proofResult[key] === false, `result ${key} widened`)
}
assert(parsed.result.soundCpuTools.limitedProductToolCallExecutionProofPassed === 15, 'proof count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product execution widened')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real readiness widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.output.proofCommand === 'npm run worker-runtime-jobs:sound-cpu-phase114-limited-product-tool-call-execution-proof:proof', 'proof command mismatch')
assert(parsed.output.sanitizedProofOutput.status === 'passed', 'output status mismatch')
assert(parsed.output.sanitizedProofOutput.invocationCount === 4, 'output invocation count mismatch')
assert(parsed.output.sanitizedProofOutput.acceptedJobTypeCount === 4, 'output job type count mismatch')
assert(parsed.output.sanitizedProofOutput.toolCountCovered === 15, 'output tool count mismatch')
assert(parsed.output.proofOutputWrittenToDisk === false, 'proof output written to disk')
assert(parsed.output.tempProofArtifactsCreated === false, 'temp proof artifacts created')

for (const value of Object.values(parsed.verification.verifiedFalse)) {
  assert(value === false, 'verified false value must remain false')
}
assert(parsed.verification.runtimeFlagsAllFalse === true, 'verification runtime flags missing')
assert(parsed.verification.noGeneratedArtifactsStaged === true, 'generated artifact staging guard missing')
assert(parsed.verification.packageLockUnchanged === true, 'package lock guard missing')

assert(parsed.coverage.soundCpuToolSet.totalToolsInLane === 15, 'coverage total mismatch')
assert(parsed.coverage.soundCpuToolSet.limitedProductToolCallBoundaryProofComplete === true, 'coverage limited proof missing')
assert(parsed.coverage.soundCpuToolSet.readyForProductToolCallExecutionToday === 0, 'coverage product execution widened')
assert(parsed.coverage.soundCpuToolSet.readyForRealExecutionToday === 0, 'coverage real readiness widened')
assertArrayEquals(parsed.coverage.allowedWorkers, expectedWorkers, 'coverage workers')
assertArrayEquals(parsed.coverage.allowedImages, expectedImages, 'coverage images')
assertArrayEquals(parsed.coverage.allowedJobTypesExercised, expectedJobTypes, 'coverage job types')

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'limited_product_tool_call_execution_proof_pending',
  ),
  'proof blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'limited_product_tool_call_execution_proof_owner_review_pending',
  ),
  'owner-review blocker missing',
)
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product execution widened')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallExecutionToday === 0, 'blocker tool readiness widened')

assert(parsed.policy.allowedClaims.limitedProductToolCallExecutionProofPassedClaimed === true, 'proof claim missing')
assert(parsed.policy.allowedClaims.limitedProductToolCallBoundaryInvokedClaimed === true, 'boundary claim missing')
assert(parsed.policy.allowedClaims.allAcceptedJobTypesExercisedClaimed === true, 'job type claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product readiness widened')
assert(parsed.policy.nextGateMayReviewLimitedProof === true, 'next review missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'product execution widened')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'real media widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewLimitedProofOnly === true, 'next review scope missing')
assert(parsed.next.reviewScope.mayAcceptProductToolCallReadinessReconciliationNext === true, 'next reconciliation missing')
assert(parsed.next.reviewScope.allowProductToolCallExecutionToday === false, 'next product execution widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.reviewScope.allowSupabaseMutationToday === false, 'next Supabase widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2069,
      limitedProductToolCallExecutionProofPassed: true,
      invocationCount: 4,
      soundCpuToolsCovered: 15,
      readyForProductToolCallExecutionToday: 0,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
