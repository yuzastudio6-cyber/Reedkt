import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase111_limited_external_agent_execution_proof_owner_review_passed_with_warnings_ready_for_external_agent_readiness_reconciliation_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase112_external_agent_readiness_reconciliation_completed_with_warnings_ready_for_external_agent_readiness_owner_review_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE112-EXTERNAL-AGENT-READINESS-OWNER-REVIEW'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-acceptance-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-reconciliation.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-reconciliation-result.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-evidence-register.md',
  scope:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-scope-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-review.md',
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
    'allowExecutionToday',
    'allowRealUserMedia',
    'allowRealExternalAgentExecutionToday',
    'allowProductToolCallExecutionToday',
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
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-acceptance-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-reconciliation',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-reconciliation-result',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-evidence-register',
  ),
  scope: parseJsonBlock(
    docs.scope,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-scope-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2063, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '2f811c6614eb39b3f25c10ee1e5a9a486a23e194',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.limitedExternalAgentExecutionProofAccepted === true, 'source proof acceptance missing')
assert(
  parsed.source.ownerReview.externalAgentReadinessReconciliationMayProceedNext === true,
  'source reconciliation permission missing',
)
assert(parsed.source.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'source real execution widened')
assert(parsed.source.soundCpuTools.readyForExternalAgentReadinessReconciliation === 15, 'source reconciliation count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')
assert(parsed.source.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE112-EXTERNAL-AGENT-READINESS-RECONCILIATION', 'source next prompt mismatch')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceAcceptance.acceptedEvidence.invocationCount === 4, 'source acceptance invocation mismatch')
assert(parsed.sourceAcceptance.acceptedEvidence.toolCountCovered === 15, 'source acceptance tool count mismatch')
assert(parsed.sourceAcceptance.acceptedEvidence.realUserMediaUsed === false, 'source acceptance real media used')
assertArrayEquals(parsed.sourceAcceptance.acceptedWorkers, expectedWorkers, 'source acceptance workers')
assertArrayEquals(parsed.sourceAcceptance.acceptedImages, expectedImages, 'source acceptance images')
assertArrayEquals(parsed.sourceAcceptance.acceptedJobTypes, expectedJobTypes, 'source acceptance job types')
for (const value of Object.values(parsed.sourceAcceptance.notAcceptedForToday)) {
  assert(value === true, 'source notAcceptedForToday must remain true')
}
assert(parsed.sourceBlockers.readyForExternalAgentReadinessReconciliation === true, 'source blocker reconciliation missing')
assert(parsed.sourceBlockers.readyForRealExecutionToday === false, 'source blocker real execution widened')
assert(parsed.sourcePolicy.nextGateMayRunExternalAgentReadinessReconciliation === true, 'source policy next reconciliation missing')
assert(parsed.sourcePolicy.nextGateMayRunRealExternalAgentExecution === false, 'source policy real execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reconciliationScope.reconcileLimitedExternalAgentProofOnly === true, 'prompt reconciliation scope missing')
assert(parsed.prompt.reconciliationScope.allowedToolCount === 15, 'prompt tool count mismatch')
assertArrayEquals(parsed.prompt.reconciliationScope.allowedWorkers, expectedWorkers, 'prompt workers')
assertArrayEquals(parsed.prompt.reconciliationScope.allowedImages, expectedImages, 'prompt images')
assertArrayEquals(parsed.prompt.reconciliationScope.allowedJobTypes, expectedJobTypes, 'prompt job types')
assert(parsed.prompt.reconciliationScope.allowExecutionToday === false, 'prompt execution widened')
assert(parsed.prompt.reconciliationScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2064, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '103ca34f5bda2dc80df3bd86b15a9b35a056456b',
  'result source merge mismatch',
)
assert(parsed.result.reconciliationResult.limitedExternalAgentProofReconciled === true, 'reconciliation missing')
assert(parsed.result.reconciliationResult.toolCountCovered === 15, 'result tool count mismatch')
assert(parsed.result.reconciliationResult.readyForExternalAgentReadinessOwnerReview === 15, 'owner review count mismatch')
assert(parsed.result.reconciliationResult.readyForRealExternalAgentExecutionToday === 0, 'real execution count widened')
assert(parsed.result.reconciliationResult.workerDispatched === false, 'worker dispatch widened')
assert(parsed.result.reconciliationResult.routeExecuted === false, 'route execution widened')
assert(parsed.result.reconciliationResult.supabaseTouched === false, 'Supabase widened')
assert(parsed.result.soundCpuTools.externalAgentReadinessReconciled === 15, 'tool reconciliation count mismatch')
assert(parsed.result.soundCpuTools.readyForExternalAgentReadinessOwnerReview === 15, 'tool owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'tool real execution widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.evidence.sourceEvidence.phase112ReadinessReconciliationCompleted === true, 'evidence phase112 missing')
assert(parsed.evidence.sourceEvidence.sourcePr === 2064, 'evidence source PR mismatch')
assertArrayEquals(parsed.evidence.reconciledWorkers, expectedWorkers, 'evidence workers')
assertArrayEquals(parsed.evidence.reconciledImages, expectedImages, 'evidence images')
assertArrayEquals(parsed.evidence.reconciledJobTypes, expectedJobTypes, 'evidence job types')
assert(parsed.evidence.reconciledToolCount === 15, 'evidence tool count mismatch')
for (const value of Object.values(parsed.evidence.evidenceLimitations)) {
  assert(value === true, 'evidence limitations must remain true')
}

assert(parsed.scope.readinessScope.readyForExternalAgentReadinessOwnerReview === true, 'scope owner review missing')
assert(parsed.scope.readinessScope.readyForLimitedProductToolCallPlanning === false, 'scope product tool-call widened')
assert(parsed.scope.readinessScope.readyForRealExternalAgentExecutionToday === false, 'scope real execution widened')
assert(parsed.scope.countSummary.soundCpuToolsInLane === 15, 'scope lane count mismatch')
assert(parsed.scope.countSummary.toolsReadyForOwnerReview === 15, 'scope owner review count mismatch')
assert(parsed.scope.countSummary.toolsReadyForRealExecutionToday === 0, 'scope real count mismatch')

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'external_agent_readiness_reconciliation_pending',
  ),
  'reconciliation blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'external_agent_readiness_owner_review_pending',
  ),
  'owner review blocker missing',
)
assert(parsed.blockers.readyForExternalAgentReadinessOwnerReview === true, 'blocker owner review missing')
assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker real execution widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker real count widened')

assert(parsed.policy.allowedClaims.externalAgentReadinessReconciliationCompletedClaimed === true, 'policy reconciliation claim missing')
assert(parsed.policy.allowedClaims.externalAgentReadinessOwnerReviewMayProceedClaimed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.externalAgentExecutionReadyClaimed === false, 'policy execution readiness widened')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product tool call widened')
assert(parsed.policy.nextGateMayRunExternalAgentReadinessOwnerReview === true, 'policy next owner review missing')
assert(parsed.policy.nextGateMayRunRealExternalAgentExecution === false, 'policy real execution widened')
assert(parsed.policy.nextGateMayDispatchWorkers === false, 'policy worker dispatch widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewExternalAgentReadinessReconciliationOnly === true, 'next review scope missing')
assert(parsed.next.reviewScope.mayAcceptLimitedProductToolCallExecutionPlanNext === true, 'next planning permission missing')
assert(parsed.next.reviewScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reviewScope.allowExecutionToday === false, 'next execution today widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.reviewScope.allowWorkerDispatchToday === false, 'next worker dispatch widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2064,
      externalAgentReadinessReconciled: true,
      readyForExternalAgentReadinessOwnerReview: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
