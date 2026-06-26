import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  closure: 'docs/worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-closure.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-source-register.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-acceptance-register.md',
  remaining: 'docs/worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-remaining-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-readiness-boundary.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-closure.md',
  claimLeaseClosure: 'docs/worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-closure.md',
  claimLeaseRemaining: 'docs/worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-remaining-register.md',
  gate2aProof: 'docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md',
  gate2aPolicy: 'docs/sound-runtime-media-gate-2a-runtime-claim-policy.md',
  syntheticOwnerReview: 'docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review.md',
  gate2adSourcePlan: 'docs/sound-runtime-media-gate-2ad-worker-media-supabase-execution-gate-source-plan.md',
  gate2adBoundary: 'docs/sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register.md',
}

const decision = 'worker_runtime_jobs_sound_cpu_sound_runtime_media_gap_closure_completed_with_warnings_ready_for_supabase_sql_storage_gap_closure'
const claimLeaseDecision = 'worker_runtime_jobs_sound_cpu_claim_lease_lifecycle_gap_closure_completed_with_warnings_ready_for_sound_runtime_media_gap_closure'
const gate2aDecision = 'sound_runtime_media_gate_2a_controlled_synthetic_tool_call_proof_passed_with_warnings_ready_for_tool_call_owner_review'
const syntheticOwnerDecision = 'worker_runtime_jobs_sound_cpu_synthetic_tool_call_owner_review_passed_with_warnings_ready_for_synthetic_worker_route_plan'
const gate2adDecision = 'sound_runtime_media_gate_2ad_worker_media_supabase_execution_gate_source_plan_completed_with_warnings_ready_for_execution_gate_source_owner_review'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-SUPABASE-SQL-STORAGE-GAP-CLOSURE: close Supabase SQL/storage gap, no execution'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseJsonFence(relativePath, label) {
  const text = read(relativePath)
  const pattern = new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  assert(match, `Missing JSON fence ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update classification widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment classification widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase SQL classification widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migration classification widened`)
  assert(value?.nextAction === 'none', `${label} Supabase next action widened`)
}

function assertBoundary(value) {
  const allowedTrue = new Set([
    'workerDispatchContractPlanningGapClosed',
    'claimLeaseLifecyclePlanningGapClosed',
    'soundRuntimeMediaPlanningGapClosed',
    'supabaseSqlStorageGapClosureMayBePlanned',
    'internalSyntheticToolCallPlanningMayContinue',
  ])
  for (const [key, entry] of Object.entries(value)) {
    if (allowedTrue.has(key)) {
      assert(entry === true, `${key} should be true`)
    } else if (key === 'toolCandidateCount') {
      assert(entry === 15, 'boundary tool count mismatch')
    } else {
      assert(entry === false, `${key} must remain false`)
    }
  }
}

const closure = parseJsonFence(files.closure, 'worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-closure')
const sourceRegister = parseJsonFence(files.sourceRegister, 'worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-source-register')
const acceptance = parseJsonFence(files.acceptance, 'worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-acceptance-register')
const remaining = parseJsonFence(files.remaining, 'worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-remaining-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-readiness-boundary')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-claim-policy')
const claimLeaseClosure = parseJsonFence(files.claimLeaseClosure, 'worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-closure')
const claimLeaseRemaining = parseJsonFence(files.claimLeaseRemaining, 'worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-remaining-register')
const gate2aProof = parseJsonFence(files.gate2aProof, 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')
const gate2aPolicy = parseJsonFence(files.gate2aPolicy, 'sound-runtime-media-gate-2a-runtime-claim-policy')
const syntheticOwnerReview = parseJsonFence(files.syntheticOwnerReview, 'worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review')
const gate2adSourcePlan = parseJsonFence(files.gate2adSourcePlan, 'sound-runtime-media-gate-2ad-worker-media-supabase-execution-gate-source-plan')
const gate2adBoundary = parseJsonFence(files.gate2adBoundary, 'sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register')
const promptText = read(files.nextPrompt)

assert(closure.owner === 'WORKER_RUNTIME_JOBS', 'closure owner mismatch')
assert(closure.decision === decision, 'closure decision mismatch')
assert(closure.sourceVerification.sourceHead === '24f60bb64eb627d8c208605c928913ec81432337', 'source head mismatch')
assert(closure.sourceVerification.pr1068.mergeCommit === '24f60bb64eb627d8c208605c928913ec81432337', 'PR #1068 merge commit mismatch')
assert(closure.sourceVerification.pr1068.decision === claimLeaseDecision, 'PR #1068 decision mismatch')
assert(closure.sourceVerification.soundEvidence.gate2aDecision === gate2aDecision, 'Gate 2A decision mismatch')
assert(closure.sourceVerification.soundEvidence.syntheticToolCallOwnerReviewDecision === syntheticOwnerDecision, 'synthetic owner review decision mismatch')
assert(closure.sourceVerification.soundEvidence.gate2adDecision === gate2adDecision, 'Gate 2AD decision mismatch')
assert(closure.gapClosureResult.closedGapId === 'sound_runtime_media', 'closed gap mismatch')
assert(closure.gapClosureResult.closedGapCountToday === 3, 'closed gap count should be three')
assert(closure.gapClosureResult.remainingGapCount === 5, 'remaining gap count mismatch')
assert(closure.gapClosureResult.toolCandidateCount === 15, 'tool count mismatch')
assert(closure.gapClosureResult.directPackageCount === 13, 'direct package count mismatch')
assert(closure.gapClosureResult.aliasToolCount === 2, 'alias tool count mismatch')
assert(closure.gapClosureResult.metadataPassedCount === 13, 'metadata pass count mismatch')
assert(closure.gapClosureResult.importPassedCount === 13, 'import pass count mismatch')
assert(closure.gapClosureResult.probePassedCount === 15, 'probe pass count mismatch')
assert(closure.gapClosureResult.probeFailedCount === 0, 'probe fail count mismatch')
assert(closure.gapClosureResult.syntheticToolCallProofAccepted === true, 'synthetic proof should be accepted')
assert(closure.gapClosureResult.workerOwnerAcceptedForRoutePlanningOnly === true, 'owner planning acceptance missing')
assert(closure.gapClosureResult.runtimeMediaPlanningGapClosed === true, 'runtime media planning gap should close')
for (const [key, value] of Object.entries(closure.gapClosureResult)) {
  if (
    key === 'closedGapId' ||
    key === 'closedGapCountToday' ||
    key === 'remainingGapCount' ||
    key === 'toolCandidateCount' ||
    key === 'directPackageCount' ||
    key === 'aliasToolCount' ||
    key === 'metadataPassedCount' ||
    key === 'importPassedCount' ||
    key === 'probePassedCount' ||
    key === 'probeFailedCount' ||
    key === 'syntheticToolCallProofAccepted' ||
    key === 'workerOwnerAcceptedForRoutePlanningOnly' ||
    key === 'runtimeMediaPlanningGapClosed'
  ) continue
  if (key === 'executionApprovalsGrantedToday') {
    assert(value === 'none', 'execution approvals must be none')
  } else {
    assert(value === false, `${key} must remain false`)
  }
}
assert(closure.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(sourceRegister.decision === decision, 'source register decision mismatch')
assert(sourceRegister.sourceRows.length === 5, 'source row count mismatch')
for (const row of sourceRegister.sourceRows) {
  read(row.file)
  assert(row.acceptedForGapClosure === true, `${row.sourceId} not accepted`)
}
assert(sourceRegister.summary.sourceRowCount === 5, 'source row summary mismatch')
assert(sourceRegister.summary.acceptedSourceRowCount === 5, 'accepted row summary mismatch')
assert(sourceRegister.summary.acceptedForExecution === false, 'source register execution widened')

assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(acceptance.acceptedClosure.gapId === 'sound_runtime_media', 'acceptance gap mismatch')
assert(acceptance.acceptedClosure.acceptedForPlanningGapClosure === true, 'planning closure missing')
assert(acceptance.acceptedClosure.acceptedForRealUserMediaProcessing === false, 'real user media widened')
assert(acceptance.acceptedClosure.acceptedForMediaFileOpen === false, 'media file open widened')
assert(acceptance.acceptedClosure.acceptedForFfmpegOrFfprobe === false, 'ffmpeg/ffprobe widened')
assert(acceptance.acceptedClosure.acceptedForWorkerExecution === false, 'worker execution widened')
assert(acceptance.acceptedCounts.toolCandidateCount === 15, 'accepted tool count mismatch')
assert(acceptance.acceptedCounts.probePassedCount === 15, 'accepted probe count mismatch')
assert(acceptance.acceptedCounts.closedGapCountToday === 3, 'accepted closed gap count mismatch')
assert(acceptance.acceptedCounts.remainingGapCount === 5, 'accepted remaining gap count mismatch')
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(remaining.decision === decision, 'remaining decision mismatch')
assert(remaining.closedGaps.length === 3, 'closed gap list count mismatch')
assert(remaining.closedGaps[2].gapId === 'sound_runtime_media', 'third closed gap mismatch')
for (const gap of remaining.closedGaps) {
  assert(gap.closedForPlanningToday === true, `${gap.gapId} should close for planning`)
  assert(gap.executionApprovedToday === false, `${gap.gapId} must not approve execution`)
}
assert(remaining.remainingGaps.length === 5, 'remaining gap count mismatch')
assert(remaining.remainingGaps[0].gapId === 'supabase_sql_storage', 'next gap mismatch')
assert(remaining.remainingGaps[0].nextPromptMayProceed === true, 'Supabase SQL/storage should be next')
for (const gap of remaining.remainingGaps) {
  assert(gap.closedToday === false, `${gap.gapId} must remain open`)
  if (gap.gapId !== 'supabase_sql_storage') {
    assert(gap.nextPromptMayProceed === false, `${gap.gapId} should wait`)
  }
}
assert(remaining.summary.closedGapCountToday === 3, 'remaining summary closed count mismatch')
assert(remaining.summary.remainingGapCount === 5, 'remaining summary count mismatch')

assert(boundary.decision === decision, 'boundary decision mismatch')
assertBoundary(boundary.readinessBoundary)

assert(claims.decision === decision, 'claim policy decision mismatch')
assert(claims.allowedClaims.includes('SOUND runtime/media planning evidence gap closed'), 'allowed closure claim missing')
assert(claims.forbiddenClaims.includes('media readiness'), 'media readiness must be forbidden')
assert(claims.forbiddenClaims.includes('real user media beta readiness'), 'real user media beta readiness must be forbidden')
assert(claims.forbiddenClaims.includes('production readiness'), 'production readiness must be forbidden')
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

assert(claimLeaseClosure.decision === claimLeaseDecision, 'claim/lease closure source decision mismatch')
assert(claimLeaseClosure.gapClosureResult.closedGapCountToday === 2, 'claim/lease source closed count mismatch')
assert(claimLeaseRemaining.remainingGaps[0].gapId === 'sound_runtime_media', 'claim/lease source next gap mismatch')
assert(gate2aProof.decision === gate2aDecision, 'Gate 2A proof decision mismatch')
assert(gate2aProof.toolCandidateCount === 15, 'Gate 2A tool count mismatch')
assert(gate2aProof.probePassedCount === 15, 'Gate 2A probe pass count mismatch')
assert(gate2aProof.probeFailedCount === 0, 'Gate 2A probe fail count mismatch')
assert(gate2aProof.runtimeFlags.mediaFileOpenAttempted === false, 'Gate 2A media open widened')
assert(gate2aProof.runtimeFlags.ffmpegExecuted === false, 'Gate 2A ffmpeg widened')
assert(gate2aProof.runtimeFlags.workerExecutionAttempted === false, 'Gate 2A worker execution widened')
assert(gate2aProof.betaReadinessClassification.realUserMediaBetaAllowed === 'no', 'Gate 2A real user beta widened')
assert(gate2aProof.betaReadinessClassification.externalBetaAllowed === 'no', 'Gate 2A external beta widened')
assertSupabaseNoop(gate2aProof.supabaseClassification, 'Gate 2A proof')
assert(gate2aPolicy.allowedClaims.controlledSyntheticToolCallProofPassed === true, 'Gate 2A allowed claim mismatch')
assert(gate2aPolicy.forbiddenClaims.mediaReadiness === true, 'Gate 2A media readiness should be forbidden')
assert(gate2aPolicy.forbiddenClaims.externalBetaUnlock === true, 'Gate 2A external beta should be forbidden')
assert(syntheticOwnerReview.decision === syntheticOwnerDecision, 'synthetic owner decision mismatch')
assert(syntheticOwnerReview.acceptedEvidence.probePassedCount === 15, 'synthetic owner probe count mismatch')
assert(syntheticOwnerReview.acceptedForToday.workerExecution === 'no', 'synthetic owner worker execution widened')
assert(syntheticOwnerReview.acceptedForToday.uploadedMediaProcessing === 'no', 'synthetic owner media processing widened')
assert(syntheticOwnerReview.acceptedForToday.externalBetaUnlock === 'no', 'synthetic owner external beta widened')
assert(gate2adSourcePlan.decision === gate2adDecision, 'Gate 2AD decision mismatch')
assert(gate2adSourcePlan.sourcePlanResult.futureMediaBoundarySourceCategoriesPlanned === true, 'Gate 2AD media boundary planning missing')
assert(gate2adSourcePlan.sourcePlanResult.mediaProcessingApprovedToday === false, 'Gate 2AD media processing widened')
assert(gate2adSourcePlan.sourcePlanResult.supabaseSqlApprovedToday === false, 'Gate 2AD Supabase SQL widened')
assertSupabaseNoop(gate2adBoundary.supabaseClassification, 'Gate 2AD boundary')
assert(gate2adBoundary.supabaseBoundaries.sqlExecutionApprovedToday === false, 'Gate 2AD SQL execution widened')
assert(gate2adBoundary.artifactBoundaries.privateArtifactWriteApprovedToday === false, 'Gate 2AD artifact widened')

for (const phrase of [
  'Do not run workers',
  'run routes',
  'run tools',
  'dispatch jobs',
  'claim leases',
  'open/process/write media',
  'touch Supabase',
  'execute SQL',
  'unlock beta',
  'unlock production',
  'same-head and same-purpose open PRs',
]) {
  assert(promptText.includes(phrase), `next prompt missing phrase: ${phrase}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_sound_runtime_media_gap_closure_diagnostics_passed',
      decision: closure.decision,
      sourceHead: closure.sourceVerification.sourceHead,
      closedGapId: closure.gapClosureResult.closedGapId,
      closedGapCountToday: closure.gapClosureResult.closedGapCountToday,
      remainingGapCount: closure.gapClosureResult.remainingGapCount,
      toolCandidateCount: closure.gapClosureResult.toolCandidateCount,
      probePassedCount: closure.gapClosureResult.probePassedCount,
      mediaProcessingAllowed: closure.gapClosureResult.mediaProcessingApprovedToday,
      nextPrompt: closure.nextPrompt,
    },
    null,
    2,
  ),
)
