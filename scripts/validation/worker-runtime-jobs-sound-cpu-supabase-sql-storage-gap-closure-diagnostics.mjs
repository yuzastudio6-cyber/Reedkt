import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  closure: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-closure.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-source-register.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-acceptance-register.md',
  remaining: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-remaining-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-readiness-boundary.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-artifact-delivery-gap-closure.md',
  soundRuntimeClosure: 'docs/worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-closure.md',
  soundRuntimeRemaining: 'docs/worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-remaining-register.md',
  gate2adBoundary: 'docs/sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register.md',
  executionGateSourceOwnerReview: 'docs/worker-runtime-jobs-sound-cpu-execution-gate-source-owner-review.md',
  mediaSupabaseOwnerGate: 'docs/worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register.md',
}

const decision = 'worker_runtime_jobs_sound_cpu_supabase_sql_storage_gap_closure_completed_with_warnings_ready_for_artifact_delivery_gap_closure'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_sound_runtime_media_gap_closure_completed_with_warnings_ready_for_supabase_sql_storage_gap_closure'
const gate2adDecision = 'sound_runtime_media_gate_2ad_worker_media_supabase_execution_gate_source_plan_completed_with_warnings_ready_for_execution_gate_source_owner_review'
const executionGateSourceOwnerDecision = 'worker_runtime_jobs_sound_cpu_execution_gate_source_owner_review_passed_with_warnings_ready_for_runtime_source_creation_plan'
const mediaSupabaseOwnerGateDecision = 'worker_runtime_jobs_sound_cpu_execution_owner_gate_plan_review_passed_with_warnings_ready_for_worker_media_supabase_execution_gate_source_plan'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-ARTIFACT-DELIVERY-GAP-CLOSURE: close artifact delivery gap, no execution'

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

function assertFalseFlags(value, keys, label) {
  for (const key of keys) {
    assert(value?.[key] === false, `${label}.${key} must remain false`)
  }
}

function assertBoundary(value) {
  const allowedTrue = new Set([
    'workerDispatchContractPlanningGapClosed',
    'claimLeaseLifecyclePlanningGapClosed',
    'soundRuntimeMediaPlanningGapClosed',
    'supabaseSqlStoragePlanningGapClosed',
    'artifactDeliveryGapClosureMayBePlanned',
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

const closure = parseJsonFence(files.closure, 'worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-closure')
const sourceRegister = parseJsonFence(files.sourceRegister, 'worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-source-register')
const acceptance = parseJsonFence(files.acceptance, 'worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-acceptance-register')
const remaining = parseJsonFence(files.remaining, 'worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-remaining-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-readiness-boundary')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-claim-policy')
const soundRuntimeClosure = parseJsonFence(files.soundRuntimeClosure, 'worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-closure')
const soundRuntimeRemaining = parseJsonFence(files.soundRuntimeRemaining, 'worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-remaining-register')
const gate2adBoundary = parseJsonFence(files.gate2adBoundary, 'sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register')
const executionGateSourceOwnerReview = parseJsonFence(files.executionGateSourceOwnerReview, 'worker-runtime-jobs-sound-cpu-execution-gate-source-owner-review')
const mediaSupabaseOwnerGate = parseJsonFence(files.mediaSupabaseOwnerGate, 'worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register')
const promptText = read(files.nextPrompt)

assert(closure.owner === 'WORKER_RUNTIME_JOBS', 'closure owner mismatch')
assert(closure.decision === decision, 'closure decision mismatch')
assert(closure.sourceVerification.sourceHead === 'd8ab0b8c6e49d0749e6da540dff87bc1c84b7726', 'source head mismatch')
assert(closure.sourceVerification.pr1072.mergeCommit === 'd8ab0b8c6e49d0749e6da540dff87bc1c84b7726', 'PR #1072 merge commit mismatch')
assert(closure.sourceVerification.pr1072.decision === sourceDecision, 'PR #1072 decision mismatch')
assert(closure.sourceVerification.supabaseBoundaryEvidence.gate2adDecision === gate2adDecision, 'Gate 2AD decision mismatch')
assert(closure.sourceVerification.supabaseBoundaryEvidence.executionGateSourceOwnerReviewDecision === executionGateSourceOwnerDecision, 'execution gate source owner review decision mismatch')
assert(closure.sourceVerification.supabaseBoundaryEvidence.mediaSupabaseOwnerGateDecision === mediaSupabaseOwnerGateDecision, 'media/Supabase owner gate decision mismatch')
assert(closure.gapClosureResult.closedGapId === 'supabase_sql_storage', 'closed gap mismatch')
assert(closure.gapClosureResult.closedGapCountToday === 4, 'closed gap count should be four')
assert(closure.gapClosureResult.remainingGapCount === 4, 'remaining gap count mismatch')
assert(closure.gapClosureResult.toolCandidateCount === 15, 'tool count mismatch')
assert(closure.gapClosureResult.workerDispatchContractPlanningGapClosed === true, 'worker dispatch planning gap should be closed')
assert(closure.gapClosureResult.claimLeaseLifecyclePlanningGapClosed === true, 'claim/lease planning gap should be closed')
assert(closure.gapClosureResult.soundRuntimeMediaPlanningGapClosed === true, 'runtime/media planning gap should be closed')
assert(closure.gapClosureResult.supabaseSqlStoragePlanningGapClosed === true, 'Supabase SQL/storage planning gap should be closed')
assert(closure.gapClosureResult.supabaseBoundaryEvidenceAccepted === true, 'Supabase boundary evidence should be accepted')
assert(closure.gapClosureResult.storageBoundaryEvidenceAccepted === true, 'storage boundary evidence should be accepted')
assert(closure.gapClosureResult.serviceRoleBoundaryEvidenceAccepted === true, 'service-role boundary evidence should be accepted')
assertFalseFlags(
  closure.gapClosureResult,
  [
    'supabaseMutationApprovedToday',
    'serviceRoleMutationApprovedToday',
    'sqlExecutionApprovedToday',
    'storageWriteApprovedToday',
    'signedUrlCreationApprovedToday',
    'artifactDeliveryApprovedToday',
    'workerDispatchApprovedToday',
    'claimLeaseApprovedToday',
    'workerExecutionApprovedToday',
    'runtimeExecutionApprovedToday',
    'mediaProcessingApprovedToday',
    'billingStripeApprovedToday',
    'complianceSecurityApprovedToday',
    'internalBetaAllowed',
    'externalBetaAllowed',
    'productionAllowed',
  ],
  'closure.gapClosureResult',
)
assert(closure.gapClosureResult.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')
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
assert(sourceRegister.summary.acceptedForSupabaseMutation === false, 'source register Supabase mutation widened')
assert(sourceRegister.summary.acceptedForSqlExecution === false, 'source register SQL execution widened')
assert(sourceRegister.summary.acceptedForStorageWrite === false, 'source register storage write widened')
assert(sourceRegister.summary.acceptedForSignedUrlCreation === false, 'source register signed URL creation widened')

assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(acceptance.acceptedClosure.gapId === 'supabase_sql_storage', 'acceptance gap mismatch')
assert(acceptance.acceptedClosure.acceptedForPlanningGapClosure === true, 'planning closure missing')
assertFalseFlags(
  acceptance.acceptedClosure,
  [
    'acceptedForSupabaseMutation',
    'acceptedForServiceRoleMutation',
    'acceptedForSqlExecution',
    'acceptedForStorageWrite',
    'acceptedForSignedUrlCreation',
    'acceptedForArtifactDelivery',
    'acceptedForWorkerExecution',
    'acceptedForRouteExecution',
    'acceptedForRuntimeReadiness',
  ],
  'acceptance.acceptedClosure',
)
assert(acceptance.acceptedCounts.toolCandidateCount === 15, 'accepted tool count mismatch')
assert(acceptance.acceptedCounts.closedGapCountToday === 4, 'accepted closed gap count mismatch')
assert(acceptance.acceptedCounts.remainingGapCount === 4, 'accepted remaining gap count mismatch')
assert(acceptance.acceptedCounts.sourceRowCount === 5, 'accepted source row count mismatch')
assert(acceptance.acceptedCounts.acceptedSourceRowCount === 5, 'accepted source row summary mismatch')
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(remaining.decision === decision, 'remaining decision mismatch')
assert(remaining.closedGaps.length === 4, 'closed gap list count mismatch')
assert(remaining.closedGaps.map((gap) => gap.gapId).join(',') === 'worker_dispatch_contract,claim_lease_lifecycle,sound_runtime_media,supabase_sql_storage', 'closed gap order mismatch')
for (const gap of remaining.closedGaps) {
  assert(gap.closedForPlanningToday === true, `${gap.gapId} should close for planning`)
  assert(gap.executionApprovedToday === false, `${gap.gapId} must not approve execution`)
}
assert(remaining.remainingGaps.length === 4, 'remaining gap count mismatch')
assert(remaining.remainingGaps[0].gapId === 'artifact_delivery', 'next gap mismatch')
assert(remaining.remainingGaps[0].nextPromptMayProceed === true, 'artifact delivery should be next')
for (const gap of remaining.remainingGaps) {
  assert(gap.closedToday === false, `${gap.gapId} must remain open`)
  if (gap.gapId !== 'artifact_delivery') {
    assert(gap.nextPromptMayProceed === false, `${gap.gapId} should wait`)
  }
}
assert(remaining.summary.closedGapCountToday === 4, 'remaining summary closed count mismatch')
assert(remaining.summary.remainingGapCount === 4, 'remaining summary count mismatch')
assert(remaining.summary.nextPromptMayProceedCount === 1, 'next prompt count mismatch')

assert(boundary.decision === decision, 'boundary decision mismatch')
assertBoundary(boundary.readinessBoundary)

assert(claims.decision === decision, 'claim policy decision mismatch')
assert(claims.allowedClaims.includes('Supabase SQL/storage planning evidence gap closed'), 'allowed Supabase closure claim missing')
assert(claims.allowedClaims.includes('artifact delivery gap closure may be planned next'), 'allowed artifact handoff claim missing')
assert(claims.forbiddenClaims.includes('Supabase readiness'), 'Supabase readiness must be forbidden')
assert(claims.forbiddenClaims.includes('SQL readiness'), 'SQL readiness must be forbidden')
assert(claims.forbiddenClaims.includes('storage readiness'), 'storage readiness must be forbidden')
assert(claims.forbiddenClaims.includes('signed URL readiness'), 'signed URL readiness must be forbidden')
assert(claims.forbiddenClaims.includes('artifact readiness'), 'artifact readiness must be forbidden')
assert(claims.forbiddenClaims.includes('production readiness'), 'production readiness must be forbidden')
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

assert(soundRuntimeClosure.decision === sourceDecision, 'source closure decision mismatch')
assert(soundRuntimeClosure.sourceVerification.sourceHead === '24f60bb64eb627d8c208605c928913ec81432337', 'source closure source head mismatch')
assert(soundRuntimeClosure.gapClosureResult.closedGapCountToday === 3, 'source closure closed count mismatch')
assert(soundRuntimeClosure.gapClosureResult.remainingGapCount === 5, 'source closure remaining count mismatch')
assert(soundRuntimeClosure.gapClosureResult.toolCandidateCount === 15, 'source closure tool count mismatch')
assert(soundRuntimeClosure.gapClosureResult.supabaseSqlApprovedToday === false, 'source Supabase SQL widened')
assert(soundRuntimeClosure.gapClosureResult.artifactDeliveryApprovedToday === false, 'source artifact widened')
assert(soundRuntimeRemaining.remainingGaps[0].gapId === 'supabase_sql_storage', 'source next gap mismatch')
assert(soundRuntimeRemaining.remainingGaps[0].nextPromptMayProceed === true, 'source Supabase gap should have been next')

assert(gate2adBoundary.decision === gate2adDecision, 'Gate 2AD boundary decision mismatch')
assertSupabaseNoop(gate2adBoundary.supabaseClassification, 'Gate 2AD boundary')
assertFalseFlags(
  gate2adBoundary.supabaseBoundaries,
  [
    'sqlContractSourceCreatedToday',
    'storageContractSourceCreatedToday',
    'serviceRoleMutationApprovedToday',
    'sqlExecutionApprovedToday',
    'storageWriteApprovedToday',
    'signedUrlCreationApprovedToday',
  ],
  'gate2adBoundary.supabaseBoundaries',
)
assertFalseFlags(
  gate2adBoundary.artifactBoundaries,
  [
    'privateArtifactWriteApprovedToday',
    'publicArtifactCreationApprovedToday',
    'storageTransferApprovedToday',
    'artifactSourceCreatedToday',
  ],
  'gate2adBoundary.artifactBoundaries',
)

assert(executionGateSourceOwnerReview.decision === executionGateSourceOwnerDecision, 'execution owner decision mismatch')
assert(executionGateSourceOwnerReview.ownerReviewResult.mediaSupabaseArtifactSourceCategoriesAcceptedForPlanning === true, 'media/Supabase source categories should be accepted for planning')
assert(executionGateSourceOwnerReview.ownerReviewResult.futureRuntimeSourceCreationPlanMayProceed === true, 'future runtime source planning should be accepted')
assertFalseFlags(
  executionGateSourceOwnerReview.ownerReviewResult,
  [
    'runtimeSourceCreationApprovedToday',
    'runtimeSourceEditedToday',
    'publicApiChangedToday',
    'workerExecutionApprovedToday',
    'mediaProcessingApprovedToday',
    'supabaseSqlApprovedToday',
    'artifactCreationApprovedToday',
    'betaOrProductionReadinessClaimedToday',
  ],
  'executionGateSourceOwnerReview.ownerReviewResult',
)

assert(mediaSupabaseOwnerGate.decision === mediaSupabaseOwnerGateDecision, 'media/Supabase owner gate decision mismatch')
assertSupabaseNoop(mediaSupabaseOwnerGate.supabaseOwnerGate, 'media/Supabase owner gate')
assertFalseFlags(
  mediaSupabaseOwnerGate.supabaseOwnerGate,
  [
    'serviceRoleMutationApprovedToday',
    'storageWriteApprovedToday',
    'signedUrlCreationApprovedToday',
  ],
  'mediaSupabaseOwnerGate.supabaseOwnerGate',
)
assertFalseFlags(
  mediaSupabaseOwnerGate.artifactOwnerGate,
  [
    'privateArtifactWriteApprovedToday',
    'publicArtifactCreationApprovedToday',
    'storageTransferApprovedToday',
  ],
  'mediaSupabaseOwnerGate.artifactOwnerGate',
)
assertFalseFlags(
  mediaSupabaseOwnerGate.mediaOwnerGate,
  [
    'mediaFileOpenApprovedToday',
    'mediaProcessingApprovedToday',
    'ffmpegFfprobeApprovedToday',
    'audioOutputWriteApprovedToday',
    'modelWeightDownloadApprovedToday',
  ],
  'mediaSupabaseOwnerGate.mediaOwnerGate',
)

for (const phrase of [
  'Do not run workers',
  'run routes',
  'run tools',
  'dispatch jobs',
  'claim leases',
  'touch Supabase',
  'execute SQL',
  'write storage objects',
  'create signed/public URLs',
  'unlock beta',
  'unlock production',
  'same-head and same-purpose open PRs',
]) {
  assert(promptText.includes(phrase), `next prompt missing phrase: ${phrase}`)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      closedGapCountToday: closure.gapClosureResult.closedGapCountToday,
      remainingGapCount: closure.gapClosureResult.remainingGapCount,
      nextPrompt,
      supabaseClassification: acceptance.supabaseClassification,
      executionApprovalsGrantedToday: closure.gapClosureResult.executionApprovalsGrantedToday,
    },
    null,
    2,
  ),
)
