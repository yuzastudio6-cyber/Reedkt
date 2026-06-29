import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37m_caption_render_runtime_hook_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37l_caption_render_runtime_hook_controlled_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_execution_proof_no_media_no_artifacts'
const sourceMergeCommit = 'a5c36b779d357382fb6879bb3854925b2d0f0399'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const documents = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-proof-output-register.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-proof-output-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-blocked-assertion-register.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-blocked-assertion-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-temp-file-removal-register.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-temp-file-removal-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) {
    throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  }
  try {
    return JSON.parse(match[1])
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`)
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

const parsed = new Map(documents.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof',
)
const output = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-proof-output-register',
)
const assertionRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-blocked-assertion-register',
)
const tempRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-temp-file-removal-register',
)
const blockerRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-claim-policy',
)
const ownerReviewPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review',
)

assert(result.decision === expectedDecision, 'Phase 37M result decision mismatch')
assert(result.sourceVerification.sourcePr === 1641, 'Phase 37M source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceMergeCommit, 'Phase 37M source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Phase 37M source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Phase 37M source decision mismatch')
assert(result.proof.commandStatus === 'passed', 'Proof command must be recorded as passed')
assert(result.proof.temporaryProofFileRemovedBeforeStaging === true, 'Temp proof file removal must be recorded')
assert(result.proof.hookFactoryInvoked === true, 'Hook factory invocation must be recorded')
assert(result.proof.blockedAssertionInvoked === true, 'Blocked assertion invocation must be recorded')
assert(result.proof.syntheticNoMediaInputOnly === true, 'Synthetic no-media input must be recorded')
for (const key of ['mediaRead', 'artifactWrite', 'workerDispatch', 'routeToolProviderCall', 'supabaseSql']) {
  assertFalse(result.proof[key], `proof.${key}`)
}
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
]) {
  assertFalse(result.result[key], `result.${key}`)
}
assert(result.result.noArtifactCreated === true, 'No artifact created must be true')
assert(result.result.blockedStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
assert(result.result.candidateZoneCount === 2, 'Candidate zone count mismatch')
assert(result.result.ocrRegionCount === 1, 'OCR region count mismatch')
assert(result.result.blockedCandidateZoneCount === 1, 'Blocked candidate zone count mismatch')
assert(result.result.manualCaptionLayoutReviewRequired === true, 'Manual review flag mismatch')
assert(result.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(result.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(output.sanitizedOutput.status === 'passed', 'Sanitized output status mismatch')
assert(output.sanitizedOutput.blockedAssertionThrown === true, 'Blocked assertion thrown mismatch')
assert(output.sanitizedOutput.noArtifactCreated === true, 'Sanitized output noArtifactCreated mismatch')
assert(output.omittedFromEvidence.includes('raw media'), 'Raw media omission must be recorded')
assert(output.omittedFromEvidence.includes('artifact write targets'), 'Artifact write omission must be recorded')

assert(assertionRegister.assertion.invoked === true, 'Assertion invocation missing')
assert(assertionRegister.assertion.actualThrow === true, 'Assertion throw missing')
assert(assertionRegister.assertion.messageMatched === true, 'Assertion message match missing')
assert(assertionRegister.factory.returnedBlockedResult === true, 'Factory blocked result missing')
for (const key of [
  'mediaProcessing',
  'renderExecution',
  'workerExecution',
  'artifactCreation',
  'runtimeReadinessClaimed',
]) {
  assertFalse(assertionRegister.executionBoundary[key], `assertionRegister.executionBoundary.${key}`)
}

assert(tempRegister.temporaryProofFile === tempProofFile, 'Temp proof path mismatch')
assert(tempRegister.deletedBeforeStaging === true, 'Temp proof deletion must be recorded')
assert(tempRegister.mustNotExistInCommittedTree === true, 'Temp proof committed-tree guard missing')
for (const key of ['nodeModulesStaged', 'distStaged', 'distServerStaged', 'artifactLogsStaged']) {
  assertFalse(tempRegister[key], `tempRegister.${key}`)
}
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must not exist')

assert(blockerRegister.remainingBlocked.includes('real media input'), 'Real media blocker missing')
assert(blockerRegister.remainingBlocked.includes('paid production unlock'), 'Paid production blocker missing')
assert(blockerRegister.blockedUntilOwnerReview === true, 'Owner-review blocker missing')

for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'dockerImageReadiness',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(claimPolicy.forbiddenClaims[key], `claimPolicy.forbiddenClaims.${key}`)
}
for (const key of [
  'dockerBuild',
  'dockerRun',
  'dockerPush',
  'gcpCloudRun',
  'workerDispatch',
  'routeExecution',
  'toolExecution',
  'providerModelCall',
  'mediaProcessing',
  'artifactCreation',
  'supabaseSql',
]) {
  assertFalse(claimPolicy.executionClaims[key], `claimPolicy.executionClaims.${key}`)
}

assert(ownerReviewPrompt.requiredSourceDecision === expectedDecision, 'Owner-review prompt source decision mismatch')
assert(ownerReviewPrompt.reviewFocus.controlledProofPassed === true, 'Owner-review prompt proof focus missing')
assertFalse(ownerReviewPrompt.reviewFocus.mediaReadAllowed, 'Owner-review prompt mediaReadAllowed')
assertFalse(ownerReviewPrompt.reviewFocus.artifactWriteAllowed, 'Owner-review prompt artifactWriteAllowed')
assertFalse(ownerReviewPrompt.reviewFocus.workerDispatchAllowed, 'Owner-review prompt workerDispatchAllowed')
assertFalse(ownerReviewPrompt.reviewFocus.routeToolProviderAllowed, 'Owner-review prompt routeToolProviderAllowed')
assertFalse(ownerReviewPrompt.reviewFocus.supabaseSqlAllowed, 'Owner-review prompt supabaseSqlAllowed')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-diagnostics.mjs',
  'Missing package diagnostics script',
)

const indexText = readText('server/workers/sound-cpu/index.ts')
assert(
  indexText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'),
  'Hook factory export missing from index',
)
assert(
  indexText.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'),
  'Blocked assertion export missing from index',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1641,
      sourceMergeCommit,
      controlledProofPassed: true,
      temporaryProofFileRemoved: true,
      hookFactoryInvoked: true,
      blockedAssertionInvoked: true,
      mediaRead: false,
      artifactWrite: false,
      workerDispatch: false,
      routeToolProviderCall: false,
      supabaseSql: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37M-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-EXECUTION-PROOF-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
