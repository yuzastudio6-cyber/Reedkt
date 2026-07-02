import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase115_product_tool_call_readiness_reconciliation_completed_with_warnings_ready_for_product_tool_call_readiness_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase115_product_tool_call_readiness_owner_review_passed_with_warnings_ready_for_limited_no_real_media_tool_execution_preflight'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE116-LIMITED-NO-REAL-MEDIA-TOOL-EXECUTION-PREFLIGHT'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-reconciliation-result.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-evidence-register.md',
  sourceScope:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-scope-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-acceptance-register.md',
  preflight:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-preflight-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight.md',
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
    'acceptedForProductToolCallExecutionToday',
    'acceptedForRealExternalAgentExecutionToday',
    'acceptedForRealUserMediaToday',
    'acceptedForWorkerDispatchToday',
    'acceptedForRouteExecutionToday',
    'acceptedForManifestPersistenceToday',
    'acceptedForMediaOpenToday',
    'acceptedForProviderCallToday',
    'acceptedForModelCallToday',
    'acceptedForSupabaseMutationToday',
    'acceptedForSqlExecutionToday',
    'acceptedForStorageObjectCreationToday',
    'acceptedForSignedUrlCreationToday',
    'acceptedForArtifactCreationToday',
    'acceptedForBetaUnlockToday',
    'acceptedForProductionUnlockToday',
    'productExecutionAllowedToday',
    'realExternalAgentExecutionAllowedToday',
    'realUserMediaAllowed',
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

function assertAllTrue(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === true, `${label}.${key} must be true`)
  }
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must be false`)
  }
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-reconciliation-result',
  ),
  sourceEvidence: parseJsonBlock(
    docs.sourceEvidence,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-evidence-register',
  ),
  sourceScope: parseJsonBlock(
    docs.sourceScope,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-scope-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-acceptance-register',
  ),
  preflight: parseJsonBlock(
    docs.preflight,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-preflight-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2072, 'source lineage PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '3f45e93adcebd9e1cc631d2cee24d03c8e489a7a',
  'source lineage merge mismatch',
)
assert(parsed.source.reconciliationResult.limitedProductToolCallProofReconciled === true, 'source reconciliation missing')
assert(parsed.source.reconciliationResult.toolCountCovered === 15, 'source tool count mismatch')
assert(
  parsed.source.reconciliationResult.readyForProductToolCallReadinessOwnerReview === 15,
  'source owner review readiness mismatch',
)
assert(parsed.source.reconciliationResult.readyForProductToolCallExecutionToday === 0, 'source execution widened')
assert(parsed.source.reconciliationResult.readyForRealExternalAgentExecutionToday === 0, 'source real execution widened')
assert(parsed.source.soundCpuTools.productToolCallReadinessReconciled === 15, 'source reconciled count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product count widened')
assert(parsed.source.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE115-PRODUCT-TOOL-CALL-READINESS-OWNER-REVIEW', 'source next prompt mismatch')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceEvidence.sourceEvidence.phase114ProofOwnerReviewAccepted === true, 'source evidence owner review missing')
assert(parsed.sourceEvidence.sourceEvidence.limitedProductToolCallProofPassed === true, 'source evidence proof missing')
assert(parsed.sourceEvidence.sourceEvidence.syntheticNoMediaEvidenceOnly === true, 'source evidence media boundary missing')
assert(parsed.sourceEvidence.sourceEvidence.toolCountCovered === 15, 'source evidence tool count mismatch')
assert(parsed.sourceEvidence.sourceEvidence.readyForProductToolCallExecutionToday === 0, 'source evidence execution widened')
assertArrayEquals(parsed.sourceEvidence.reconciledWorkers, expectedWorkers, 'source evidence workers')
assertArrayEquals(parsed.sourceEvidence.reconciledImages, expectedImages, 'source evidence images')
assertArrayEquals(parsed.sourceEvidence.reconciledJobTypes, expectedJobTypes, 'source evidence job types')
assertAllTrue(parsed.sourceEvidence.evidenceLimitations, 'source evidence limitations')

assert(parsed.sourceScope.readinessScope.readyForProductToolCallReadinessOwnerReview === true, 'source scope owner readiness mismatch')
assert(parsed.sourceScope.readinessScope.readyForProductToolCallExecutionToday === false, 'source scope product execution widened')
assert(parsed.sourceScope.readinessScope.readyForRealUserMediaToday === false, 'source scope real media widened')
assert(parsed.sourceScope.readinessScope.readyForWorkerDispatchToday === false, 'source scope worker dispatch widened')
assert(parsed.sourceScope.readinessScope.readyForRouteExecutionToday === false, 'source scope route widened')
assert(parsed.sourceScope.readinessScope.readyForSupabaseMutationToday === false, 'source scope Supabase widened')
assert(parsed.sourceScope.readinessScope.readyForArtifactCreationToday === false, 'source scope artifact widened')
assert(parsed.sourceScope.countSummary.toolsReadyForOwnerReview === 15, 'source scope owner count mismatch')
assert(parsed.sourceScope.countSummary.toolsReadyForProductToolCallExecutionToday === 0, 'source scope product count widened')
assert(parsed.sourceScope.countSummary.toolsReadyForRealExecutionToday === 0, 'source scope real count widened')

assert(parsed.sourceBlockers.readyForProductToolCallReadinessOwnerReview === true, 'source blocker owner review missing')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionToday === false, 'source blocker product execution widened')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallReadinessOwnerReview === true, 'source policy owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product execution widened')
assert(parsed.sourcePolicy.nextGateMayRunRealUserMedia === false, 'source policy real media widened')
assert(parsed.sourcePolicy.nextGateMayDispatchWorkers === false, 'source policy worker dispatch widened')
assert(parsed.sourcePolicy.nextGateMayPersistManifests === false, 'source policy manifest persistence widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewProductToolCallReadinessReconciliationOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.mayAcceptLimitedNoRealMediaToolExecutionPreflightNext === true, 'prompt preflight permission missing')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product execution widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2073, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '8eea5fea3cb78e4e7e9f88d62f447a1d9db70c94',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.productToolCallReadinessReconciliationAccepted === true, 'owner acceptance missing')
assert(parsed.result.ownerReview.limitedNoRealMediaToolExecutionPreflightMayProceedNext === true, 'preflight next missing')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'result product execution widened')
assert(parsed.result.ownerReview.acceptedForRealUserMediaToday === false, 'result real media widened')
assert(parsed.result.ownerReview.acceptedForWorkerDispatchToday === false, 'result worker dispatch widened')
assert(parsed.result.soundCpuTools.readyForLimitedNoRealMediaToolExecutionPreflight === 15, 'result preflight count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product execution count widened')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedReadinessElements.phase115ReconciliationAccepted === true, 'acceptance reconciliation missing')
assert(parsed.acceptance.acceptedReadinessElements.toolCountCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedReadinessElements.readyForLimitedNoRealMediaToolExecutionPreflight === 15, 'acceptance preflight count mismatch')
assert(parsed.acceptance.acceptedReadinessElements.readyForProductToolCallExecutionToday === 0, 'acceptance product execution widened')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
assertAllTrue(parsed.acceptance.acceptedForNextPreflightOnly, 'acceptedForNextPreflightOnly')
assertAllTrue(parsed.acceptance.notAcceptedForToday, 'notAcceptedForToday')

assert(parsed.preflight.preflightTarget.nextPrompt === nextPrompt, 'preflight next prompt mismatch')
assert(parsed.preflight.preflightTarget.preflightOnly === true, 'preflight only missing')
assert(parsed.preflight.preflightTarget.allowedToolCount === 15, 'preflight tool count mismatch')
assert(parsed.preflight.preflightTarget.realUserMediaAllowed === false, 'preflight real media widened')
assert(parsed.preflight.preflightTarget.productExecutionAllowedToday === false, 'preflight product execution widened')
assert(parsed.preflight.preflightTarget.realExternalAgentExecutionAllowedToday === false, 'preflight real execution widened')
assert(parsed.preflight.requiredEvidenceForPreflight.sourceOwnerReviewDecision === decision, 'preflight source decision mismatch')
assert(parsed.preflight.requiredEvidenceForPreflight.toolCount === 15, 'preflight required tool count mismatch')
assert(parsed.preflight.preflightMustStopIf.length >= 5, 'preflight stop conditions too weak')

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'product_tool_call_readiness_owner_review_pending',
  ),
  'resolved blocker missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'limited_no_real_media_tool_execution_preflight_pending',
  ),
  'preflight blocker missing',
)
assert(parsed.blockers.readyForLimitedNoRealMediaToolExecutionPreflight === true, 'blocker preflight readiness missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product execution widened')
assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker real execution widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedNoRealMediaToolExecutionPreflight === 15, 'blocker preflight tool count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallExecutionToday === 0, 'blocker product tool count widened')

assert(parsed.policy.allowedClaims.productToolCallReadinessReconciliationOwnerReviewed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.limitedNoRealMediaToolExecutionPreflightMayProceedNext === true, 'policy preflight claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolsReadyForPreflight === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'blockedClaims')
assert(parsed.policy.nextGateMayRunLimitedNoRealMediaToolExecutionPreflight === true, 'policy next preflight missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase116_limited_no_real_media_tool_execution_preflight_completed_with_warnings_ready_for_controlled_limited_no_real_media_tool_execution_proof',
  'next expected mismatch',
)
assert(parsed.next.preflightScope.preflightOnly === true, 'next preflight only missing')
assert(parsed.next.preflightScope.mayPlanControlledLimitedNoRealMediaToolExecutionProofNext === true, 'next proof planning missing')
assert(parsed.next.preflightScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.preflightScope.allowProductToolCallExecutionToday === false, 'next product execution widened')
assert(parsed.next.preflightScope.allowRealUserMedia === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      readyForLimitedNoRealMediaToolExecutionPreflight:
        parsed.result.soundCpuTools.readyForLimitedNoRealMediaToolExecutionPreflight,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
