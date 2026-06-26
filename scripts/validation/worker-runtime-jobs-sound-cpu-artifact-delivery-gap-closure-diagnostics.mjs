import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  closure: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-closure.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-source-register.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-acceptance-register.md',
  remaining: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-remaining-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-readiness-boundary.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-closure.md',
  supabaseClosure: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-closure.md',
  supabaseRemaining: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-remaining-register.md',
  gate2adBoundary: 'docs/sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register.md',
  mediaSupabaseOwnerGate: 'docs/worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register.md',
  privateArtifactManifest: 'docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_private_artifact_manifest.json',
  dryRunSummary: 'docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_summary_report.json',
}

const decision = 'worker_runtime_jobs_sound_cpu_artifact_delivery_gap_closure_completed_with_warnings_ready_for_billing_stripe_credits_gap_closure'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_supabase_sql_storage_gap_closure_completed_with_warnings_ready_for_artifact_delivery_gap_closure'
const gate2adDecision = 'sound_runtime_media_gate_2ad_worker_media_supabase_execution_gate_source_plan_completed_with_warnings_ready_for_execution_gate_source_owner_review'
const mediaSupabaseOwnerGateDecision = 'worker_runtime_jobs_sound_cpu_execution_owner_gate_plan_review_passed_with_warnings_ready_for_worker_media_supabase_execution_gate_source_plan'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-BILLING-STRIPE-CREDITS-GAP-CLOSURE: close billing Stripe credits gap, no execution'

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

function parseJsonFile(relativePath) {
  return JSON.parse(read(relativePath))
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
    'artifactDeliveryPlanningGapClosed',
    'billingStripeCreditsGapClosureMayBePlanned',
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

const closure = parseJsonFence(files.closure, 'worker-runtime-jobs-sound-cpu-artifact-delivery-gap-closure')
const sourceRegister = parseJsonFence(files.sourceRegister, 'worker-runtime-jobs-sound-cpu-artifact-delivery-gap-source-register')
const acceptance = parseJsonFence(files.acceptance, 'worker-runtime-jobs-sound-cpu-artifact-delivery-gap-acceptance-register')
const remaining = parseJsonFence(files.remaining, 'worker-runtime-jobs-sound-cpu-artifact-delivery-gap-remaining-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-artifact-delivery-gap-readiness-boundary')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-artifact-delivery-gap-claim-policy')
const supabaseClosure = parseJsonFence(files.supabaseClosure, 'worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-closure')
const supabaseRemaining = parseJsonFence(files.supabaseRemaining, 'worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-remaining-register')
const gate2adBoundary = parseJsonFence(files.gate2adBoundary, 'sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register')
const mediaSupabaseOwnerGate = parseJsonFence(files.mediaSupabaseOwnerGate, 'worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register')
const privateArtifactManifest = parseJsonFile(files.privateArtifactManifest)
const dryRunSummary = parseJsonFile(files.dryRunSummary)
const promptText = read(files.nextPrompt)

assert(closure.owner === 'WORKER_RUNTIME_JOBS', 'closure owner mismatch')
assert(closure.decision === decision, 'closure decision mismatch')
assert(closure.sourceVerification.sourceHead === '22936001c5b5348ed7b28b7798b557eea8c029a7', 'source head mismatch')
assert(closure.sourceVerification.pr1076.mergeCommit === '22936001c5b5348ed7b28b7798b557eea8c029a7', 'PR #1076 merge commit mismatch')
assert(closure.sourceVerification.pr1076.decision === sourceDecision, 'PR #1076 decision mismatch')
assert(closure.sourceVerification.artifactBoundaryEvidence.gate2adDecision === gate2adDecision, 'Gate 2AD decision mismatch')
assert(closure.sourceVerification.artifactBoundaryEvidence.mediaSupabaseOwnerGateDecision === mediaSupabaseOwnerGateDecision, 'media/Supabase owner gate decision mismatch')
assert(closure.sourceVerification.artifactBoundaryEvidence.planSnapshotDryRunStatus === 'passed', 'dry-run status mismatch')
assert(closure.gapClosureResult.closedGapId === 'artifact_delivery', 'closed gap mismatch')
assert(closure.gapClosureResult.closedGapCountToday === 5, 'closed gap count should be five')
assert(closure.gapClosureResult.remainingGapCount === 3, 'remaining gap count mismatch')
assert(closure.gapClosureResult.toolCandidateCount === 15, 'tool count mismatch')
for (const key of [
  'workerDispatchContractPlanningGapClosed',
  'claimLeaseLifecyclePlanningGapClosed',
  'soundRuntimeMediaPlanningGapClosed',
  'supabaseSqlStoragePlanningGapClosed',
  'artifactDeliveryPlanningGapClosed',
  'artifactBoundaryEvidenceAccepted',
  'privateArtifactBoundaryEvidenceAccepted',
  'publicArtifactBoundaryEvidenceAccepted',
  'signedUrlBoundaryEvidenceAccepted',
  'storageTransferBoundaryEvidenceAccepted',
]) {
  assert(closure.gapClosureResult[key] === true, `${key} should be true`)
}
assertFalseFlags(
  closure.gapClosureResult,
  [
    'privateArtifactWriteApprovedToday',
    'publicArtifactCreationApprovedToday',
    'storageTransferApprovedToday',
    'signedUrlCreationApprovedToday',
    'artifactSourceCreatedToday',
    'supabaseMutationApprovedToday',
    'serviceRoleMutationApprovedToday',
    'sqlExecutionApprovedToday',
    'storageWriteApprovedToday',
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
assert(sourceRegister.sourceRows.length === 6, 'source row count mismatch')
for (const row of sourceRegister.sourceRows) {
  read(row.file)
  assert(row.acceptedForGapClosure === true, `${row.sourceId} not accepted`)
}
assert(sourceRegister.summary.sourceRowCount === 6, 'source row summary mismatch')
assert(sourceRegister.summary.acceptedSourceRowCount === 6, 'accepted row summary mismatch')
assertFalseFlags(
  sourceRegister.summary,
  [
    'acceptedForExecution',
    'acceptedForPrivateArtifactWrite',
    'acceptedForPublicArtifactCreation',
    'acceptedForStorageTransfer',
    'acceptedForSignedUrlCreation',
  ],
  'sourceRegister.summary',
)

assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(acceptance.acceptedClosure.gapId === 'artifact_delivery', 'acceptance gap mismatch')
assert(acceptance.acceptedClosure.acceptedForPlanningGapClosure === true, 'planning closure missing')
assertFalseFlags(
  acceptance.acceptedClosure,
  [
    'acceptedForPrivateArtifactWrite',
    'acceptedForPublicArtifactCreation',
    'acceptedForStorageTransfer',
    'acceptedForSignedUrlCreation',
    'acceptedForSupabaseMutation',
    'acceptedForWorkerExecution',
    'acceptedForRouteExecution',
    'acceptedForRuntimeReadiness',
  ],
  'acceptance.acceptedClosure',
)
assert(acceptance.acceptedCounts.toolCandidateCount === 15, 'accepted tool count mismatch')
assert(acceptance.acceptedCounts.closedGapCountToday === 5, 'accepted closed gap count mismatch')
assert(acceptance.acceptedCounts.remainingGapCount === 3, 'accepted remaining gap count mismatch')
assert(acceptance.acceptedCounts.sourceRowCount === 6, 'accepted source row count mismatch')
assert(acceptance.acceptedCounts.acceptedSourceRowCount === 6, 'accepted source row summary mismatch')
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(remaining.decision === decision, 'remaining decision mismatch')
assert(remaining.closedGaps.length === 5, 'closed gap list count mismatch')
assert(remaining.closedGaps.map((gap) => gap.gapId).join(',') === 'worker_dispatch_contract,claim_lease_lifecycle,sound_runtime_media,supabase_sql_storage,artifact_delivery', 'closed gap order mismatch')
for (const gap of remaining.closedGaps) {
  assert(gap.closedForPlanningToday === true, `${gap.gapId} should close for planning`)
  assert(gap.executionApprovedToday === false, `${gap.gapId} must not approve execution`)
}
assert(remaining.remainingGaps.length === 3, 'remaining gap count mismatch')
assert(remaining.remainingGaps[0].gapId === 'billing_stripe_credits', 'next gap mismatch')
assert(remaining.remainingGaps[0].nextPromptMayProceed === true, 'billing Stripe credits should be next')
for (const gap of remaining.remainingGaps) {
  assert(gap.closedToday === false, `${gap.gapId} must remain open`)
  if (gap.gapId !== 'billing_stripe_credits') {
    assert(gap.nextPromptMayProceed === false, `${gap.gapId} should wait`)
  }
}
assert(remaining.summary.closedGapCountToday === 5, 'remaining summary closed count mismatch')
assert(remaining.summary.remainingGapCount === 3, 'remaining summary count mismatch')
assert(remaining.summary.nextPromptMayProceedCount === 1, 'next prompt count mismatch')

assert(boundary.decision === decision, 'boundary decision mismatch')
assertBoundary(boundary.readinessBoundary)

assert(claims.decision === decision, 'claim policy decision mismatch')
assert(claims.allowedClaims.includes('artifact delivery planning evidence gap closed'), 'allowed artifact closure claim missing')
assert(claims.allowedClaims.includes('billing Stripe credits gap closure may be planned next'), 'allowed billing handoff claim missing')
assert(claims.forbiddenClaims.includes('artifact readiness'), 'artifact readiness must be forbidden')
assert(claims.forbiddenClaims.includes('private artifact readiness'), 'private artifact readiness must be forbidden')
assert(claims.forbiddenClaims.includes('public artifact readiness'), 'public artifact readiness must be forbidden')
assert(claims.forbiddenClaims.includes('storage transfer readiness'), 'storage transfer readiness must be forbidden')
assert(claims.forbiddenClaims.includes('billing readiness'), 'billing readiness must be forbidden')
assert(claims.forbiddenClaims.includes('production readiness'), 'production readiness must be forbidden')
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

assert(supabaseClosure.decision === sourceDecision, 'source closure decision mismatch')
assert(supabaseClosure.sourceVerification.sourceHead === 'd8ab0b8c6e49d0749e6da540dff87bc1c84b7726', 'source closure source head mismatch')
assert(supabaseClosure.gapClosureResult.closedGapCountToday === 4, 'source closure closed count mismatch')
assert(supabaseClosure.gapClosureResult.remainingGapCount === 4, 'source closure remaining count mismatch')
assert(supabaseClosure.gapClosureResult.artifactDeliveryApprovedToday === false, 'source artifact delivery widened')
assert(supabaseRemaining.remainingGaps[0].gapId === 'artifact_delivery', 'source next gap mismatch')
assert(supabaseRemaining.remainingGaps[0].nextPromptMayProceed === true, 'source artifact gap should have been next')

assert(gate2adBoundary.decision === gate2adDecision, 'Gate 2AD boundary decision mismatch')
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
assert(gate2adBoundary.supabaseBoundaries.signedUrlCreationApprovedToday === false, 'Gate 2AD signed URL widened')
assertSupabaseNoop(gate2adBoundary.supabaseClassification, 'Gate 2AD boundary')

assert(mediaSupabaseOwnerGate.decision === mediaSupabaseOwnerGateDecision, 'media/Supabase owner gate decision mismatch')
assertFalseFlags(
  mediaSupabaseOwnerGate.artifactOwnerGate,
  [
    'privateArtifactWriteApprovedToday',
    'publicArtifactCreationApprovedToday',
    'storageTransferApprovedToday',
  ],
  'mediaSupabaseOwnerGate.artifactOwnerGate',
)
assert(mediaSupabaseOwnerGate.supabaseOwnerGate.signedUrlCreationApprovedToday === false, 'owner gate signed URL widened')
assertSupabaseNoop(mediaSupabaseOwnerGate.supabaseOwnerGate, 'media/Supabase owner gate')

assert(privateArtifactManifest.status === 'passed', 'private artifact manifest status mismatch')
assertFalseFlags(
  privateArtifactManifest,
  [
    'privateArtifactsCommitted',
    'secretPayloadsCommitted',
    'rawProviderResponsesCommitted',
    'mediaPayloadsCommitted',
    'buildOutputsCommitted',
    'cacheArtifactsCommitted',
    'providerCalls',
    'secretPayloadAccess',
    'secretPayloadPrinted',
    'secretPayloadCommitted',
    'supabaseWrites',
    'sqlExecuted',
    'migrationDeployed',
    'workerExecution',
    'toolExecution',
    'routeExecution',
    'rawPromptExecution',
    'mediaProcessing',
    'publicArtifacts',
    'signedUrls',
    'productionAffected',
    'externalBeta',
    'paidProduction',
  ],
  'privateArtifactManifest',
)
assert(dryRunSummary.status === 'passed', 'dry-run summary status mismatch')
assert(dryRunSummary.publicArtifactsCreated === false, 'dry-run public artifacts widened')
assert(dryRunSummary.signedUrlsCreated === false, 'dry-run signed URLs widened')
assert(dryRunSummary.executionFlagsEnabledCount === 0, 'dry-run execution flags widened')
assert(dryRunSummary.workerToolProviderExecutionCount === 0, 'dry-run worker/tool/provider execution widened')
assert(dryRunSummary.supabaseWritesCount === 0, 'dry-run Supabase writes widened')

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
  'mutate credits/Stripe',
  'run Stripe checkout/webhooks/payment processing',
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
      artifactDeliveryAllowed: boundary.readinessBoundary.artifactDeliveryAllowed,
      executionApprovalsGrantedToday: closure.gapClosureResult.executionApprovalsGrantedToday,
    },
    null,
    2,
  ),
)
