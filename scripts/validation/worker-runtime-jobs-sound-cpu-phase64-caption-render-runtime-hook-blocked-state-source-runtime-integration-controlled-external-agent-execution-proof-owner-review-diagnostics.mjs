import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase64_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_external_agent_execution_proof_owner_review_passed_with_warnings_ready_for_real_media_artifact_readiness_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase64_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_external_agent_execution_proof_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_owner_review_no_media_no_artifacts'
const sourceHead = '53fc1011ea09c95abb12a6caf88d8de5b277b4b3'
const sourceMergeCommit = '3c1d31361c2d92954bfabfa5a17edc7ff912fb3c'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE65-CAPTION-RENDER-RUNTIME-HOOK-REAL-MEDIA-ARTIFACT-READINESS-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan',
  ],
]

const sourceDocs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-result.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-proof-output-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-proof-output-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-tool-coverage-proof-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-tool-coverage-proof-register',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) throw new Error(`Missing required file: ${relativePath}`)
  return fs.readFileSync(absolutePath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record ?? {})) {
    assertFalse(value, `${label}.${key}`)
  }
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const sourceParsed = new Map(sourceDocs.map(([file, label]) => [label, parseJsonBlock(file, label)]))

const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-claim-policy',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-register',
)
const nextPromptDoc = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan',
)

const sourceResult = sourceParsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-result',
)
const sourceOutput = sourceParsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-proof-output-register',
)
const sourceTools = sourceParsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-tool-coverage-proof-register',
)

assert(sourceResult.decision === sourceDecision, 'Source result decision mismatch')
assert(sourceResult.proofResult.proofKind === 'controlled_synthetic_external_agent_boundary', 'Source proof kind mismatch')
assert(sourceResult.proofResult.blockedStatus === 'blocked_by_owner_gate', 'Source blocked status mismatch')
assert(sourceResult.proofResult.sourceStatus === 'source_created_execution_blocked', 'Source status mismatch')
assert(sourceResult.proofResult.soundCpuToolCountCovered === 15, 'Source tool count mismatch')
for (const key of [
  'realMediaUsed',
  'artifactCreated',
  'workerDispatched',
  'routeToolProviderCalled',
  'supabaseSqlTouched',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assertFalse(sourceResult.proofResult[key], `sourceResult.proofResult.${key}`)
}

assert(sourceOutput.sanitizedProofOutput.status === 'passed', 'Source proof output status mismatch')
assert(sourceOutput.sanitizedProofOutput.candidateZoneCount === 3, 'Source candidate-zone count mismatch')
assert(sourceOutput.sanitizedProofOutput.ocrRegionCount === 2, 'Source OCR-region count mismatch')
assertFalse(sourceOutput.tempProofArtifactsCreated, 'sourceOutput.tempProofArtifactsCreated')
assertFalse(sourceOutput.proofOutputWrittenToDisk, 'sourceOutput.proofOutputWrittenToDisk')

assert(sourceTools.soundCpuToolSet.totalToolsInLane === 15, 'Source total tool count mismatch')
assertTrue(sourceTools.soundCpuToolSet.packageImportProofComplete, 'Package/import proof missing')
assertTrue(sourceTools.soundCpuToolSet.dockerBuildProofComplete, 'Docker build proof missing')
assertTrue(sourceTools.soundCpuToolSet.controlledSyntheticExternalAgentProofPassed, 'Controlled proof missing')
assert(sourceTools.soundCpuToolSet.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1880, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedControlledProof.proofKindAccepted === 'controlled_synthetic_external_agent_boundary', 'Reviewed proof kind mismatch')
assertTrue(review.reviewedControlledProof.blockedMetadataResultAccepted, 'Blocked metadata acceptance missing')
assertTrue(
  review.reviewedControlledProof.noArtifactWorkerSupabaseVerificationAccepted,
  'No-artifact/worker/Supabase acceptance missing',
)
assertTrue(review.reviewedControlledProof.realMediaArtifactReadinessPlanMayProceed, 'Readiness planning acceptance missing')
assert(review.reviewedControlledProof.soundCpuToolCountAccepted === 15, 'Accepted tool count mismatch')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(review.reviewedControlledProof[key], `review.reviewedControlledProof.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase64Pr === 1880, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase64Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase64MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Ready for real execution must remain zero')
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
for (const key of [
  'controlledSyntheticExternalAgentBoundaryPassed',
  'blockedMetadataResultReturned',
  'manualCaptionLayoutReviewRequired',
  'noArtifactCreated',
  'noWorkerDispatched',
  'noSupabaseSqlTouched',
  'noRouteToolProviderCalled',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assertTrue(acceptance.acceptedScope.realMediaArtifactReadinessPlanning, 'Readiness planning scope missing')
for (const key of [
  'realMediaProcessing',
  'artifactCreation',
  'workerDispatch',
  'routeToolProviderExecution',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.reviewSafety.allowedNextStep === 'real media artifact readiness plan', 'Safety next step mismatch')
assertTrue(safety.reviewSafety.nextStepMustRemainPlanningOnly, 'Next-step planning-only guard missing')
for (const key of [
  'realMediaInputAllowedToday',
  'artifactWriteAllowedToday',
  'workerDispatchAllowedToday',
  'routeToolProviderAllowedToday',
  'supabaseSqlAllowedToday',
  'betaUnlockAllowedToday',
  'productionUnlockAllowedToday',
]) {
  assertFalse(safety.reviewSafety[key], `safety.reviewSafety.${key}`)
}
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase64_controlled_external_agent_execution_proof_owner_review_pending',
  ),
  'Owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'real_media_artifact_readiness_plan_pending'),
  'Readiness-plan blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_beta_unlock_pending'),
  'External-beta blocker missing',
)

assertTrue(claims.allowedClaims.phase64OwnerReviewPassed, 'Owner review allowed claim missing')
assertTrue(claims.allowedClaims.controlledSyntheticExternalAgentProofAccepted, 'Controlled proof claim missing')
assertTrue(claims.allowedClaims.realMediaArtifactReadinessPlanMayProceed, 'Readiness plan claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(readiness.sourceDecision === expectedDecision, 'Readiness source decision mismatch')
assertTrue(readiness.readinessPlanMayProceed, 'Readiness plan may proceed missing')
assert(readiness.readinessPlanScope.confirmSoundCpuToolCount === 15, 'Readiness tool count mismatch')
for (const key of [
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(readiness.readinessPlanScope[key], `readiness.readinessPlanScope.${key}`)
}
assert(readiness.nextPrompt === nextPrompt, 'Readiness next prompt mismatch')

assert(nextPromptDoc.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
assert(nextPromptDoc.expectedDecision.includes('phase65'), 'Next prompt expected decision must be Phase 65')
assertTrue(nextPromptDoc.planningScope.planRealMediaInputReadiness, 'Next prompt real-media planning scope missing')
assertTrue(nextPromptDoc.planningScope.planArtifactOutputReadiness, 'Next prompt artifact planning scope missing')
assertNoop(nextPromptDoc.supabaseClassification, 'next prompt')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(nextPromptDoc.planningScope[key], `nextPromptDoc.planningScope.${key}`)
}

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

const changedText = docs.map(([file]) => readText(file)).join('\n')
const forbiddenPatterns = [
  /"useRealMedia(?:Today)?":\s*true/,
  /"createArtifact(?:Today)?":\s*true/,
  /"dispatchWorker(?:Today)?":\s*true/,
  /"callRouteToolProvider(?:Today)?":\s*true/,
  /"touchSupabaseSql(?:Today)?":\s*true/,
  /"unlockBeta(?:Today)?":\s*true/,
  /"unlockProduction(?:Today)?":\s*true/,
  /"realMediaProcessing":\s*true/,
  /"artifactCreation":\s*true/,
  /"workerDispatch":\s*true/,
  /"routeToolProviderExecution":\s*true/,
  /"supabaseSql":\s*true/,
  /"realUserMediaBeta":\s*true/,
  /"paidProduction":\s*true/,
  /generated_local_fixture_passed":\s*true/,
  /dry_run_passed":\s*true/,
  /runtime_readiness":\s*true/,
  /worker_readiness":\s*true/,
  /media_readiness":\s*true/,
  /beta_readiness":\s*true/,
  /production_readiness":\s*true/,
]
for (const pattern of forbiddenPatterns) {
  assert(!pattern.test(changedText), `Forbidden readiness or execution claim matched ${pattern}`)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1880,
      sourceMergeCommit,
      nextPrompt,
      soundCpuToolCount: 15,
      readyForRealExecutionToday: 0,
      supabaseClassification: 'no-op',
    },
    null,
    2,
  ),
)
