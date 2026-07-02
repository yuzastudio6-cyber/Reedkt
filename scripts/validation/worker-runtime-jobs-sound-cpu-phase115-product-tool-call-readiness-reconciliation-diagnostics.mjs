import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase114_limited_product_tool_call_execution_proof_owner_review_passed_with_warnings_ready_for_product_tool_call_readiness_reconciliation_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase115_product_tool_call_readiness_reconciliation_completed_with_warnings_ready_for_product_tool_call_readiness_owner_review_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE115-PRODUCT-TOOL-CALL-READINESS-OWNER-REVIEW'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-acceptance-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-reconciliation.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-reconciliation-result.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-evidence-register.md',
  scope:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-scope-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-review.md',
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
    'readyForProductToolCallExecutionToday',
    'readyForRealExternalAgentExecutionToday',
    'readyForRealUserMediaToday',
    'readyForWorkerDispatchToday',
    'readyForRouteExecutionToday',
    'readyForManifestPersistenceToday',
    'readyForMediaOpenToday',
    'readyForProviderCallToday',
    'readyForModelCallToday',
    'readyForSupabaseMutationToday',
    'readyForSqlExecutionToday',
    'readyForStorageObjectCreationToday',
    'readyForSignedUrlCreationToday',
    'readyForArtifactCreationToday',
    'readyForBetaUnlockToday',
    'readyForProductionUnlockToday',
    'externalAgentExecutionReadyClaimed',
    'productToolCallExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'manifestPersistenceReadyClaimed',
    'realUserMediaExecutionReadyClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'realUserMediaBetaReadyClaimed',
    'externalBetaUnlockClaimed',
    'productionReadinessClaimed',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-acceptance-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-reconciliation',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-reconciliation-result',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-evidence-register',
  ),
  scope: parseJsonBlock(
    docs.scope,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-scope-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2071, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '6a645566265d0c1f9399d4df148cc7845d31d976',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.limitedProductToolCallExecutionProofAccepted === true, 'source proof acceptance missing')
assert(
  parsed.source.ownerReview.productToolCallReadinessReconciliationMayProceedNext === true,
  'source reconciliation permission missing',
)
assert(parsed.source.ownerReview.acceptedForProductToolCallExecutionToday === false, 'source product execution widened')
assert(parsed.source.soundCpuTools.readyForProductToolCallReadinessReconciliation === 15, 'source reconciliation count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product execution count widened')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')
assert(parsed.source.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE115-PRODUCT-TOOL-CALL-READINESS-RECONCILIATION', 'source next prompt mismatch')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceAcceptance.acceptedProofElements.invocationCount === 4, 'source acceptance invocation mismatch')
assert(parsed.sourceAcceptance.acceptedProofElements.toolCountCovered === 15, 'source acceptance tool count mismatch')
assert(parsed.sourceAcceptance.acceptedProofElements.readyForProductToolCallExecutionToday === 0, 'source acceptance product execution widened')
assertArrayEquals(parsed.sourceAcceptance.acceptedWorkers, expectedWorkers, 'source acceptance workers')
assertArrayEquals(parsed.sourceAcceptance.acceptedImages, expectedImages, 'source acceptance images')
assertArrayEquals(parsed.sourceAcceptance.acceptedJobTypes, expectedJobTypes, 'source acceptance job types')
for (const value of Object.values(parsed.sourceAcceptance.notAcceptedForToday)) {
  assert(value === true, 'source notAcceptedForToday must remain true')
}
assert(parsed.sourceBlockers.readyForProductToolCallReadinessReconciliation === true, 'source blocker reconciliation missing')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionToday === false, 'source blocker product execution widened')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallReadinessReconciliation === true, 'source policy next reconciliation missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reconciliationScope.reconcileLimitedProductToolCallProofOnly === true, 'prompt reconciliation scope missing')
assert(parsed.prompt.reconciliationScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reconciliationScope.allowProductToolCallExecutionToday === false, 'prompt product execution widened')
assert(parsed.prompt.reconciliationScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2072, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '3f45e93adcebd9e1cc631d2cee24d03c8e489a7a',
  'result source merge mismatch',
)
assert(parsed.result.reconciliationResult.limitedProductToolCallProofReconciled === true, 'reconciliation missing')
assert(parsed.result.reconciliationResult.ownerReviewSourceAccepted === true, 'owner source acceptance missing')
assert(parsed.result.reconciliationResult.toolCountCovered === 15, 'tool count mismatch')
assert(parsed.result.reconciliationResult.readyForProductToolCallReadinessOwnerReview === 15, 'owner review count mismatch')
assert(parsed.result.reconciliationResult.readyForProductToolCallExecutionToday === 0, 'product execution widened')
assert(parsed.result.reconciliationResult.readyForRealExternalAgentExecutionToday === 0, 'external execution widened')
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
  assert(parsed.result.reconciliationResult[key] === false, `result ${key} widened`)
}
assert(parsed.result.soundCpuTools.readyForProductToolCallReadinessOwnerReview === 15, 'tool owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'tool execution widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.evidence.sourceEvidence.phase114ProofOwnerReviewAccepted === true, 'evidence source owner review missing')
assert(parsed.evidence.sourceEvidence.toolCountCovered === 15, 'evidence tool count mismatch')
assert(parsed.evidence.sourceEvidence.readyForProductToolCallExecutionToday === 0, 'evidence product execution widened')
assertArrayEquals(parsed.evidence.reconciledWorkers, expectedWorkers, 'evidence workers')
assertArrayEquals(parsed.evidence.reconciledImages, expectedImages, 'evidence images')
assertArrayEquals(parsed.evidence.reconciledJobTypes, expectedJobTypes, 'evidence job types')
for (const value of Object.values(parsed.evidence.evidenceLimitations)) {
  assert(value === true, 'evidence limitations must remain true')
}

assert(parsed.scope.readinessScope.readyForProductToolCallReadinessOwnerReview === true, 'scope owner review missing')
assert(parsed.scope.readinessScope.readyForProductToolCallExecutionToday === false, 'scope product execution widened')
assert(parsed.scope.readinessScope.readyForRealUserMediaToday === false, 'scope real media widened')
assert(parsed.scope.countSummary.toolsReadyForOwnerReview === 15, 'scope owner review count mismatch')
assert(parsed.scope.countSummary.toolsReadyForProductToolCallExecutionToday === 0, 'scope product execution count widened')

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'product_tool_call_readiness_reconciliation_pending',
  ),
  'reconciliation blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'product_tool_call_readiness_owner_review_pending',
  ),
  'owner review blocker missing',
)
assert(parsed.blockers.readyForProductToolCallReadinessOwnerReview === true, 'blocker owner review readiness missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product execution widened')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallReadinessOwnerReview === 15, 'blocker owner review count mismatch')

assert(parsed.policy.allowedClaims.productToolCallReadinessReconciledClaimed === true, 'reconciled claim missing')
assert(parsed.policy.allowedClaims.productToolCallReadinessOwnerReviewMayProceedClaimed === true, 'owner review claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product execution widened')
assert(parsed.policy.nextGateMayRunProductToolCallReadinessOwnerReview === true, 'next owner review missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'product execution permission widened')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'real media permission widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewProductToolCallReadinessReconciliationOnly === true, 'next review scope missing')
assert(parsed.next.reviewScope.mayAcceptLimitedNoRealMediaToolExecutionPreflightNext === true, 'next preflight missing')
assert(parsed.next.reviewScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reviewScope.allowProductToolCallExecutionToday === false, 'next product execution widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      readyForProductToolCallReadinessOwnerReview:
        parsed.result.reconciliationResult.readyForProductToolCallReadinessOwnerReview,
      readyForProductToolCallExecutionToday:
        parsed.result.reconciliationResult.readyForProductToolCallExecutionToday,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
