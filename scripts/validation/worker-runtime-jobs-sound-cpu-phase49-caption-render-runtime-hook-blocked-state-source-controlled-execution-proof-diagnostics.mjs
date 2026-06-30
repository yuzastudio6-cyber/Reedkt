import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase49_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase48_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_execution_proof_no_media_no_artifacts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE49-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-EXECUTION-PROOF-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof:diagnostics'

const sourcePr = 1793
const sourceHead = 'ea0e0da813dc4b31e0f0aa1fdd7623ec96542490'
const sourceMergeCommit = '80578bf3dbfbdd63069726e0f762069b5e5636ab'
const temporaryProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const temporaryProofFileSha256 =
  '6b11032b509758b58e1c4a310654352fe84df4c681271f9cc166b26cf4627384'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-result.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-input-register.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-input-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-call-register.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-call-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-validation-report.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-validation-report',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
  ],
]

function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) throw new Error(`Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-result',
)
const input = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-input-register',
)
const calls = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-call-register',
)
const validation = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-validation-report',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-claim-policy',
)
const prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
)

assert(result.decision === decision, 'result decision mismatch')
assert(result.sourceVerification.sourcePr === sourcePr, 'source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(result.proofResult.temporaryProofFile === temporaryProofFile, 'temporary proof file mismatch')
assertTrue(result.proofResult.temporaryProofFileCreated, 'temporary proof created')
assertTrue(result.proofResult.temporaryProofFileRemovedBeforeStaging, 'temporary proof removed')
assert(result.proofResult.temporaryProofFileSha256 === temporaryProofFileSha256, 'temporary proof hash mismatch')
assert(result.proofResult.temporaryProofFileLineCount === 171, 'temporary proof line count mismatch')
assertTrue(result.proofResult.controlledProofExecuted, 'controlled proof executed')
assertTrue(result.proofResult.syntheticNoMediaInputOnly, 'synthetic input only')
assert(result.proofResult.blockedResultsCreated === 3, 'blocked results count mismatch')
assert(result.proofResult.factoryInvocationCount === 3, 'factory count mismatch')
assert(result.proofResult.blockedAssertionInvocationCount === 3, 'assertion count mismatch')
assertTrue(result.proofResult.blockedAssertionsMatchedExpectedReasons, 'assertions matched')
assertTrue(result.proofResult.expectedBlockedResultOnly, 'expected blocked only')
assertTrue(result.proofResult.noArtifactCreated, 'no artifact created')
for (const key of Object.keys(result.validationSummary)) {
  if (key === 'packageLockChanged' || key === 'nodeModulesStaged' || key === 'buildOutputsStaged') {
    assertFalse(result.validationSummary[key], `result.validationSummary.${key}`)
  } else {
    assertTrue(result.validationSummary[key], `result.validationSummary.${key}`)
  }
}
assert(result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(input.decision === decision, 'input decision mismatch')
assert(input.syntheticInputSurface.captionCandidateZoneCount === 2, 'caption zone count mismatch')
assert(input.syntheticInputSurface.ocrRegionBoxCount === 1, 'OCR region count mismatch')
assert(input.syntheticInputSurface.hashedOcrRegionIdCount === 1, 'hash count mismatch')
assert(input.syntheticInputSurface.lowerThirdCollisionFlagCount === 1, 'collision flag count mismatch')
assert(input.syntheticInputSurface.manualReviewRequiredFlagCount === 1, 'manual flag count mismatch')
assertTrue(input.inputBoundaries.syntheticMetadataOnly, 'synthetic metadata only')
for (const [key, value] of Object.entries(input.inputBoundaries)) {
  if (key !== 'syntheticMetadataOnly') assertFalse(value, `input.inputBoundaries.${key}`)
}
assertTrue(input.expectedBlockedResultOnly, 'input expected blocked result only')

assert(calls.decision === decision, 'calls decision mismatch')
assert(calls.allowedFactoryCalls.length === 3, 'allowed factory call count mismatch')
assert(calls.allowedBlockedAssertionCalls.length === 3, 'allowed assertion call count mismatch')
assert(calls.callCounts.factoryInvocationCount === 3, 'call factory count mismatch')
assert(calls.callCounts.blockedAssertionInvocationCount === 3, 'call assertion count mismatch')
assert(calls.callCounts.matchedExpectedBlockedReasons === 3, 'matched reason count mismatch')
assert(calls.callCounts.unexpectedSuccessCount === 0, 'unexpected success count mismatch')
assert(calls.callCounts.unexpectedErrorCount === 0, 'unexpected error count mismatch')
assertTrue(calls.callBoundaries.callsContainedInTemporaryProofFileOnly, 'calls contained in temp file')
assertTrue(calls.callBoundaries.temporaryProofFileRemovedBeforeStaging, 'temp file removed in calls')
for (const [key, value] of Object.entries(calls.callBoundaries)) {
  if (!['callsContainedInTemporaryProofFileOnly', 'temporaryProofFileRemovedBeforeStaging'].includes(key)) {
    assertFalse(value, `calls.callBoundaries.${key}`)
  }
}

assert(validation.decision === decision, 'validation decision mismatch')
for (const value of Object.values(validation.proofCommandResults)) assertTrue(value, 'proof command result')
assert(validation.validationHydration.dependencySource === 'ignored sibling-worktree node_modules symlink', 'dependency source mismatch')
assertFalse(validation.validationHydration.dependencySymlinkStaged, 'dependency symlink staged')
assertFalse(validation.validationHydration.packageLockChanged, 'package lock changed')
assertFalse(validation.validationHydration.distArtifactsStaged, 'dist artifacts staged')
assertFalse(validation.validationHydration.distServerArtifactsStaged, 'dist-server artifacts staged')
for (const value of Object.values(validation.safetyScanSummary)) assertFalse(value, 'safety scan flag')

assert(blocker.decision === decision, 'blocker decision mismatch')
assert(Array.isArray(blocker.blockingItems) && blocker.blockingItems.length === 0, 'blocker register must be empty')
assert(blocker.selectedNextPrompt === nextPrompt, 'blocker next prompt mismatch')
for (const value of Object.values(blocker.inheritedClosedGates)) assert(value === 'blocked', 'inherited gate must be blocked')
for (const value of Object.values(blocker.unclaimedReadiness)) assert(value === 'unclaimed', 'readiness must be unclaimed')

assert(claimPolicy.decision === decision, 'claim policy decision mismatch')
for (const value of Object.values(claimPolicy.allowedClaims)) assertTrue(value, 'allowed claim')
for (const value of Object.values(claimPolicy.disallowedClaims)) assertFalse(value, 'disallowed claim')
assertNoop(claimPolicy.supabaseClassification, 'claim policy')

assert(prompt.requiredSourceDecision === decision, 'prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'prompt source head mismatch')
assert(prompt.sourceEvidence.sourcePr === sourcePr, 'prompt source PR mismatch')
assert(prompt.sourceEvidence.sourceMergeCommit === sourceMergeCommit, 'prompt merge commit mismatch')
assertTrue(prompt.sourceEvidence.temporaryProofFileRemovedBeforeStaging, 'prompt temp removed')
assert(prompt.sourceEvidence.factoryInvocationCount === 3, 'prompt factory count mismatch')
assert(prompt.sourceEvidence.blockedAssertionInvocationCount === 3, 'prompt assertion count mismatch')
assertTrue(prompt.sourceEvidence.expectedBlockedResultOnly, 'prompt expected blocked only')
assertTrue(prompt.reviewScope.acceptControlledProofEvidenceForNextPlanningOnly, 'prompt review planning only')
for (const [key, value] of Object.entries(prompt.reviewScope)) {
  if (key !== 'acceptControlledProofEvidenceForNextPlanningOnly') assertFalse(value, `prompt.reviewScope.${key}`)
}
assertNoop(prompt.supabaseClassification, 'prompt')

assert(!fs.existsSync(path.join(repoRoot, temporaryProofFile)), 'temporary proof file must not exist after staging boundary')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-diagnostics.mjs',
  'package script mismatch',
)

const sourceOwner = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review',
)
assert(sourceOwner.decision === sourceDecision, 'source owner decision mismatch')
assert(sourceOwner.sourceVerification.sourceMergeCommit === '72d6faf228cb8305896ade0b77ac6713c854f6c4', 'source owner merge mismatch')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr,
      sourceMergeCommit,
      temporaryProofFileRemovedBeforeStaging: true,
      blockedResultsCreated: result.proofResult.blockedResultsCreated,
      factoryInvocationCount: result.proofResult.factoryInvocationCount,
      blockedAssertionInvocationCount: result.proofResult.blockedAssertionInvocationCount,
      nextPrompt,
      supabaseClassification: result.supabaseClassification,
    },
    null,
    2,
  ),
)
