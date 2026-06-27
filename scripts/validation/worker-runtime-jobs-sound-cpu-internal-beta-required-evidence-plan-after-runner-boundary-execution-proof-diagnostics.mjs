import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_required_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_approved_snapshot_payload_evidence_plan_after_runner_boundary_execution_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_internal_beta_decision_owner_review_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_internal_beta_required_evidence_plan_after_runner_boundary_execution_proof'

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-plan-after-runner-boundary-execution-proof.md',
  map: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-map-after-runner-boundary-execution-proof.md',
  sourceLanes: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-source-lane-register-after-runner-boundary-execution-proof.md',
  closureOrder: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-closure-order-after-runner-boundary-execution-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-blocker-register-after-runner-boundary-execution-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-approved-snapshot-payload-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceOwnerReview: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-review-after-runner-boundary-execution-proof.md',
  sourceOwnerEvidence: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-required-evidence-review-register-after-runner-boundary-execution-proof.md',
  sourceOwnerBlockers: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-blocker-register-after-runner-boundary-execution-proof.md',
  approvedSnapshotPolicy: 'approved-plan-snapshot-policy.md',
  workerRuntimeArchitecture: 'worker-tool-runtime-architecture.md',
  dispatchSchemaOwner: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review.md',
  dispatchSignoffOwner: 'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review.md',
  mediaSupabaseGate: 'docs/worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register.md',
  supabaseGap: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-closure.md',
  artifactGap: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-closure.md',
  billingGap: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-closure.md',
  complianceGap: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-closure.md'
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(existsSync(fullPath), `missing file: ${relativePath}`)
  return readFileSync(fullPath, 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${relativePath}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${relativePath}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const plan = parseBlock(files.plan, 'worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-plan-after-runner-boundary-execution-proof')
const evidenceMap = parseBlock(files.map, 'worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-map-after-runner-boundary-execution-proof')
const sourceLanes = parseBlock(files.sourceLanes, 'worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-source-lane-register-after-runner-boundary-execution-proof')
const closureOrder = parseBlock(files.closureOrder, 'worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-closure-order-after-runner-boundary-execution-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-blocker-register-after-runner-boundary-execution-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-claim-policy-after-runner-boundary-execution-proof')
const sourceOwnerReview = parseBlock(files.sourceOwnerReview, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-review-after-runner-boundary-execution-proof')
const sourceOwnerEvidence = parseBlock(files.sourceOwnerEvidence, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-required-evidence-review-register-after-runner-boundary-execution-proof')
const sourceOwnerBlockers = parseBlock(files.sourceOwnerBlockers, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-blocker-register-after-runner-boundary-execution-proof')
const dispatchSchemaOwner = parseBlock(files.dispatchSchemaOwner, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review')
const dispatchSignoffOwner = parseBlock(files.dispatchSignoffOwner, 'worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review')
const mediaSupabaseGate = parseBlock(files.mediaSupabaseGate, 'worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register')
const supabaseGap = parseBlock(files.supabaseGap, 'worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-closure')
const artifactGap = parseBlock(files.artifactGap, 'worker-runtime-jobs-sound-cpu-artifact-delivery-gap-closure')
const billingGap = parseBlock(files.billingGap, 'worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-closure')
const complianceGap = parseBlock(files.complianceGap, 'worker-runtime-jobs-sound-cpu-compliance-security-gap-closure')

read(files.nextPrompt)
const approvedSnapshotPolicy = read(files.approvedSnapshotPolicy)
const workerRuntimeArchitecture = read(files.workerRuntimeArchitecture)

for (const row of [plan, evidenceMap, sourceLanes, closureOrder, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(plan.sourceDecision === sourceDecision, 'source decision mismatch')
assert(plan.sourcePr === 1280, 'source PR mismatch')
assert(plan.sourceMergeCommit === 'c930ed64fe6e412c2a957a9f81d283908f8eb2f2', 'source merge mismatch')
assert(plan.requiredEvidencePlanResult.requiredEvidencePlanCreated === true, 'plan not created')
assert(plan.requiredEvidencePlanResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(plan.requiredEvidencePlanResult.requiredEvidenceCount === 6, 'required evidence count mismatch')
assert(plan.requiredEvidencePlanResult.mappedEvidenceCount === 6, 'mapped evidence count mismatch')
assert(plan.requiredEvidencePlanResult.evidenceAcceptedForInternalBetaUnlockToday === 0, 'evidence unexpectedly accepted for unlock')
assert(plan.requiredEvidencePlanResult.nextEvidenceItem === 'approved_plan_snapshot_policy_preserved', 'wrong next evidence item')
assert(plan.requiredEvidencePlanResult.approvedSnapshotPayloadEvidencePlanMayProceed === true, 'approved snapshot payload evidence plan not allowed')

for (const key of [
  'internalBetaUnlockApprovedToday',
  'externalBetaUnlockApprovedToday',
  'productionUnlockApprovedToday',
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseSqlApprovedToday',
  'dockerGcpApprovedToday',
  'billingStripeApprovedToday'
]) {
  assert(plan.requiredEvidencePlanResult[key] === false, `${key} widened`)
}

assert(evidenceMap.mappedEvidence.length === 6, 'evidence map count mismatch')
for (const id of [
  'approved_plan_snapshot_policy_preserved',
  'no_real_user_media_boundary',
  'no_artifact_or_storage_delivery',
  'worker_route_dispatch_gate',
  'supabase_sql_gate',
  'security_cost_support_gate'
]) {
  assert(evidenceMap.mappedEvidence.some((row) => row.id === id && row.status === 'mapped_pending'), `missing mapped evidence: ${id}`)
}
assert(evidenceMap.counts.acceptedForInternalBetaUnlockTodayCount === 0, 'evidence map unlock count widened')

assert(sourceLanes.sourceLanes.length === 4, 'source lane count mismatch')
for (const lane of sourceLanes.sourceLanes) {
  assert(lane.acceptedForPlanning === true, `source lane not accepted for planning: ${lane.laneId}`)
  assert(lane.acceptedForExecutionToday === false, `source lane execution widened: ${lane.laneId}`)
  for (const file of lane.files) read(file)
}

assert(closureOrder.closureOrder.length === 6, 'closure order count mismatch')
assert(closureOrder.closureOrder[0].evidenceId === 'approved_plan_snapshot_policy_preserved', 'first closure item mismatch')
assert(closureOrder.counts.completedClosureStepCount === 0, 'closure steps unexpectedly completed')

assert(blockers.remainingBeforeInternalBetaUnlock.length === 6, 'internal beta blockers mismatch')
assert(blockers.remainingBeforeExternalBeta.includes('production_readiness_gate'), 'external beta production blocker missing')
assert(blockers.counts.internalBetaBlockingCount === 6, 'internal beta blocker count mismatch')

assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')
for (const claim of ['internal beta unlocked', 'external beta ready', 'production ready', 'worker execution ready']) {
  assert(policy.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}

assert(sourceOwnerReview.decision === sourceDecision, 'source owner review decision mismatch')
assert(sourceOwnerReview.sourcePr === 1271, 'source owner source PR mismatch')
assert(sourceOwnerReview.ownerReviewResult.pendingEvidenceCountAfterReview === 6, 'source pending count mismatch')
assert(sourceOwnerReview.ownerReviewResult.internalBetaUnlockApprovedToday === false, 'source internal beta widened')
assert(sourceOwnerEvidence.counts.pendingEvidenceCount === 6, 'source evidence pending count mismatch')
assert(sourceOwnerBlockers.counts.internalBetaBlockingCount === 6, 'source blocker count mismatch')

assert(approvedSnapshotPolicy.includes('Workers execute approved snapshots, not raw chat'), 'approved snapshot rule missing')
assert(workerRuntimeArchitecture.includes('approved snapshot ID'), 'worker runtime approved snapshot field missing')
assert(workerRuntimeArchitecture.includes('idempotency key'), 'worker runtime idempotency rule missing')
assert(dispatchSchemaOwner.ownerReviewResult.workerDispatchApprovedToday === false, 'dispatch owner widened')
assert(dispatchSignoffOwner.ownerReviewResult.workerDispatchApprovedToday === false, 'dispatch signoff widened')
assert(mediaSupabaseGate.mediaOwnerGate.mediaProcessingApprovedToday === false, 'media gate widened')
assert(mediaSupabaseGate.supabaseOwnerGate.sqlExecuted === 'no', 'media supabase SQL widened')
assert(mediaSupabaseGate.artifactOwnerGate.publicArtifactCreationApprovedToday === false, 'artifact gate widened')
assert(supabaseGap.gapClosureResult.supabaseMutationApprovedToday === false, 'supabase mutation widened')
assert(supabaseGap.gapClosureResult.sqlExecutionApprovedToday === false, 'SQL execution widened')
assert(artifactGap.gapClosureResult.artifactDeliveryPlanningGapClosed === true, 'artifact planning gap not closed')
assert(artifactGap.gapClosureResult.publicArtifactCreationApprovedToday === false, 'public artifact widened')
assert(billingGap.gapClosureResult.billingStripeCreditsPlanningGapClosed === true, 'billing planning gap not closed')
assert(billingGap.gapClosureResult.creditMutationApprovedToday === false, 'credit mutation widened')
assert(complianceGap.gapClosureResult.complianceSecurityPlanningGapClosed === true, 'compliance planning gap not closed')
assert(complianceGap.gapClosureResult.securityReviewRequiredBeforeExternalBeta === true, 'external beta security review requirement missing')
assert(complianceGap.gapClosureResult.externalBetaAllowed === false, 'external beta widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-internal-beta-required-evidence-plan-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-plan-after-runner-boundary-execution-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = [
  files.plan,
  files.map,
  files.sourceLanes,
  files.closureOrder,
  files.blockers,
  files.policy,
  files.nextPrompt
].map(read).join('\n')
for (const forbidden of [
  '"internalBetaUnlockApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"productionUnlockApprovedToday": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseSqlApprovedToday": true',
  '"dockerGcpApprovedToday": true',
  '"billingStripeApprovedToday": true',
  '"acceptedForInternalBetaUnlockTodayCount": 6',
  '"sqlExecuted": "yes"',
  'external beta ready true',
  'production ready true'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_internal_beta_required_evidence_plan_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: plan.sourcePr,
      sourceMergeCommit: plan.sourceMergeCommit,
      requiredEvidenceCount: plan.requiredEvidencePlanResult.requiredEvidenceCount,
      mappedEvidenceCount: plan.requiredEvidencePlanResult.mappedEvidenceCount,
      nextEvidenceItem: plan.requiredEvidencePlanResult.nextEvidenceItem,
      internalBetaUnlockApprovedToday: plan.requiredEvidencePlanResult.internalBetaUnlockApprovedToday,
      externalBetaUnlockApprovedToday: plan.requiredEvidencePlanResult.externalBetaUnlockApprovedToday,
      nextPrompt: plan.nextPrompt
    },
    null,
    2
  )
)
