import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_shell_owner_review_passed_with_warnings_ready_for_owner_evidence_collection'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_completed_with_warnings_ready_for_packet_shell_owner_review'
const priorDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_packet_authoring'
const sourceHead = '04d20d0fd3e9a6e02a3b902674ff50c819e8b4f7'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-row-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-claim-policy.md',
]

const shellDocs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-worker-runtime-jobs.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-sound-runtime-media.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-supabase-boundary.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-artifact-delivery.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-billing-credits.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-compliance-security.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-product-beta-readiness.md',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function parseJsonBlock(path) {
  const text = read(path)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${path} missing fenced json block`)
  return JSON.parse(match[1])
}

function assertReviewClosures(map, context) {
  for (const [key, value] of Object.entries(map)) {
    if (
      [
        'packetShellsReviewed',
        'packetShellsAcceptedForOwnerEvidenceCollection',
        'ownerInputsStillMissing',
        'futureOwnerEvidenceCollectionMayProceed',
        'sourceDecisionAccepted',
        'acceptedForOwnerEvidenceCollectionOnly',
        'blockedShellFilesAccepted',
        'ownerRowsAcceptedForEvidenceCollection',
        'packetShellFilesAcceptedForEvidenceCollection',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (
      ['packetShellCountAccepted', 'requiredOwnerAreaCountAccepted', 'requiredEvidenceItemCountAccepted'].includes(key)
    ) {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (
      key === 'collectedEvidenceCountToday' ||
      key === 'submittedEvidenceCountToday' ||
      key === 'acceptedEvidenceCountToday' ||
      key === 'completedOwnerSignoffCountToday' ||
      key === 'closedGapCountToday'
    ) {
      assert(value === 0, `${context}.${key} must be zero`)
    } else if (key === 'executionApprovalsGrantedToday') {
      assert(value === 'none', `${context}.${key} must be none`)
    } else {
      assert(value === false, `${context}.${key} must be false`)
    }
  }
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${path} owner mismatch`)
  assert(json.decision === decision, `${path} decision mismatch`)
}

const review = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1043.status === 'merged', 'PR #1043 status mismatch')
assert(review.sourceVerification.pr1043.mergeCommit === sourceHead, 'PR #1043 merge commit mismatch')
assert(review.sourceVerification.pr1043.decision === sourceDecision, 'PR #1043 decision mismatch')
assert(review.sourceVerification.pr1042.decision === priorDecision, 'PR #1042 decision mismatch')
assertReviewClosures(review.ownerReviewResult, 'ownerReviewResult')
assert(
  review.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-COLLECTION: collect required owner evidence, no execution',
  'next prompt mismatch'
)

const acceptance =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-acceptance-register.md']
assertReviewClosures(acceptance.acceptedShellScope, 'acceptedShellScope')

const rows = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-row-owner-review-register.md']
assert(rows.acceptedOwnerAreas.length === 7, 'accepted owner area count mismatch')
assert(rows.acceptedPacketShellFiles.length === 7, 'accepted shell file count mismatch')
for (const path of shellDocs) {
  assert(rows.acceptedPacketShellFiles.includes(path), `${path} accepted shell file missing`)
  const shell = parseJsonBlock(path)
  assert(shell.decision === sourceDecision, `${path} shell decision mismatch`)
  assert(shell.packetShell.packetShellAuthoredToday === true, `${path} shell authored flag mismatch`)
  assert(shell.packetShell.evidenceCollectedToday === false, `${path} evidence collection must be false`)
  assert(shell.packetShell.evidenceSubmittedToday === false, `${path} evidence submission must be false`)
  assert(shell.packetShell.evidenceAcceptedToday === false, `${path} evidence acceptance must be false`)
  assert(shell.packetShell.ownerSignoffCompletedToday === false, `${path} owner signoff must be false`)
  assert(shell.packetShell.executionApprovalsGrantedToday === 'none', `${path} execution approvals must be none`)
}
assertReviewClosures(rows.rowReviewResult, 'rowReviewResult')

const blockers =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-blocker-follow-up-register.md']
assert(
  blockers.resolvedForPlanning.some(
    (row) => row.blockerId === 'owner_evidence_submission_packet_shell_owner_review_pending'
  ),
  'shell owner-review blocker resolution missing'
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'required_owner_evidence_collection_pending'),
  'owner evidence collection blocker missing'
)
assert(blockers.packetShellCountAccepted === 7, 'blocker packet shell count mismatch')
assert(blockers.collectedEvidenceCountToday === 0, 'blocker collected evidence must be zero')
assert(blockers.submittedEvidenceCountToday === 0, 'blocker submitted evidence must be zero')
assert(blockers.acceptedEvidenceCountToday === 0, 'blocker accepted evidence must be zero')
assert(blockers.completedOwnerSignoffCountToday === 0, 'blocker signoff count must be zero')
assert(blockers.closedGapCountToday === 0, 'blocker closed gap count must be zero')
assert(blockers.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
for (const flag of [
  'dispatchContractApprovedToday',
  'workerDispatchApprovedToday',
  'claimLeaseApprovedToday',
  'workerExecutionApprovedToday',
  'runtimeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'supabaseSqlApprovedToday',
  'artifactDeliveryApprovedToday',
  'billingBetaProductionApprovedToday',
  'runtimeReadinessClaimedToday',
  'betaProductionReadinessClaimedToday',
]) {
  assert(blockers[flag] === false, `blocker ${flag} must be false`)
}

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-claim-policy.md']
assertReviewClosures(policy.allowedClaims, 'allowedClaims')
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'owner_evidence_collected',
  'owner_evidence_submitted',
  'owner_evidence_accepted',
  'owner_signoff_completed',
  'dispatch_contract_approved',
  'worker_execution_enabled',
  'runtime_readiness_passed',
  'worker_readiness_passed',
  'media_readiness_passed',
  'beta_readiness_passed',
  'production_readiness_passed',
]) {
  assert(policy.forbiddenClaims.includes(claim), `${claim} forbidden claim missing`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.environmentTouched === 'no', 'Supabase env classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')
assert(policy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification mismatch')
assert(policy.supabaseClassification.nextAction === 'none', 'Supabase next action classification mismatch')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-collection.md')
assert(nextPrompt.includes(decision), 'next prompt must require shell owner-review decision')
assert(nextPrompt.includes('submit evidence'), 'next prompt must not approve submission')
assert(nextPrompt.includes('accept evidence'), 'next prompt must not approve acceptance')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('run Docker build/run/push'), 'next prompt must block Docker')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-submission-packet-shell-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_shell_owner_review_diagnostics_passed',
      decision,
      sourceHead,
      pr1043Verified: true,
      packetShellCountAccepted: 7,
      ownerInputsStillMissing: true,
      collectedEvidenceCountToday: 0,
      submittedEvidenceCountToday: 0,
      acceptedEvidenceCountToday: 0,
      completedOwnerSignoffCountToday: 0,
      closedGapCountToday: 0,
      executionApprovalsGrantedToday: 'none',
      dispatchContractApprovedToday: false,
      workerExecutionApprovedToday: false,
      runtimeExecutionApprovedToday: false,
      supabaseSqlApprovedToday: false,
      futureOwnerEvidenceCollectionMayProceed: true,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-COLLECTION: collect required owner evidence, no execution',
    },
    null,
    2
  )
)
