import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_owner_evidence_collection_blocked_missing_owner_input'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_shell_owner_review_passed_with_warnings_ready_for_owner_evidence_collection'
const sourceHead = 'db2546730c753519a0898836dcc7fdb0b5cabea8'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-collection-blocker.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-collection-missing-input-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-collection-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-collection-claim-policy.md',
]

const ownerAreas = [
  'WORKER_RUNTIME_JOBS',
  'SOUND_RUNTIME_MEDIA',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'BILLING_STRIPE_CREDITS',
  'COMPLIANCE_SECURITY',
  'PRODUCT_BETA_READINESS',
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

function assertClosed(map, context) {
  for (const [key, value] of Object.entries(map)) {
    if (['ownerEvidenceCollectionAttempted', 'collectionBlockedOnOwnerInput'].includes(key)) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (key === 'ownerProvidedEvidenceFound') {
      assert(value === false, `${context}.${key} must be false`)
    } else if (['packetShellCountVerified', 'requiredOwnerAreaCount', 'missingOwnerEvidenceCount'].includes(key)) {
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

const blocker = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-collection-blocker.md']
assert(blocker.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(blocker.sourceVerification.pr1046.status === 'merged', 'PR #1046 status mismatch')
assert(blocker.sourceVerification.pr1046.mergeCommit === sourceHead, 'PR #1046 merge commit mismatch')
assert(blocker.sourceVerification.pr1046.decision === sourceDecision, 'PR #1046 decision mismatch')
assertClosed(blocker.collectionAttemptResult, 'collectionAttemptResult')
assert(
  blocker.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-INPUT-REQUEST: request required owner evidence, no execution',
  'next prompt mismatch'
)

const missing = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-collection-missing-input-register.md']
assert(missing.missingOwnerEvidence.length === 7, 'missing evidence row count mismatch')
for (const area of ownerAreas) {
  const row = missing.missingOwnerEvidence.find((item) => item.ownerArea === area)
  assert(row, `${area} missing evidence row absent`)
  assert(row.ownerProvidedEvidenceFound === false, `${area} evidence must be missing`)
  assert(typeof row.packetShell === 'string' && row.packetShell.endsWith('.md'), `${area} packet shell path missing`)
  const shell = parseJsonBlock(row.packetShell)
  assert(shell.ownerArea === area, `${area} shell owner area mismatch`)
  assert(shell.packetShell.blockedUntilOwnerInput === true, `${area} shell must be blocked until owner input`)
  assert(shell.packetShell.evidenceCollectedToday === false, `${area} shell collected evidence must be false`)
}
assert(missing.summary.requiredOwnerAreaCount === 7, 'summary owner count mismatch')
assert(missing.summary.missingOwnerEvidenceCount === 7, 'summary missing count mismatch')
assert(missing.summary.collectedEvidenceCountToday === 0, 'summary collected evidence must be zero')
assert(missing.summary.submittedEvidenceCountToday === 0, 'summary submitted evidence must be zero')
assert(missing.summary.acceptedEvidenceCountToday === 0, 'summary accepted evidence must be zero')
assert(missing.summary.executionApprovalsGrantedToday === 'none', 'summary execution approvals must be none')

const followUp = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-collection-blocker-follow-up-register.md']
assert(followUp.remainingBlockers.length === 12, 'remaining blocker count mismatch')
assert(followUp.blockerState.collectionBlockedOnOwnerInput === true, 'blocker state must be blocked')
assert(followUp.blockerState.remainingOwnerEvidenceBlockerCount === 12, 'remaining owner blocker count mismatch')
assert(followUp.blockerState.missingOwnerEvidenceCount === 7, 'missing owner evidence count mismatch')
assert(followUp.blockerState.collectedEvidenceCountToday === 0, 'blocker collected evidence must be zero')
assert(followUp.blockerState.submittedEvidenceCountToday === 0, 'blocker submitted evidence must be zero')
assert(followUp.blockerState.acceptedEvidenceCountToday === 0, 'blocker accepted evidence must be zero')
assert(followUp.blockerState.completedOwnerSignoffCountToday === 0, 'blocker signoffs must be zero')
assert(followUp.blockerState.closedGapCountToday === 0, 'blocker closed gaps must be zero')
assert(followUp.blockerState.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
for (const flag of [
  'dispatchContractApprovedToday',
  'workerExecutionApprovedToday',
  'runtimeReadinessClaimedToday',
  'betaProductionReadinessClaimedToday',
]) {
  assert(followUp.blockerState[flag] === false, `blocker state ${flag} must be false`)
}

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-collection-claim-policy.md']
assertClosed(policy.allowedClaims, 'allowedClaims')
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-input-request.md')
assert(nextPrompt.includes(decision), 'next prompt must require blocked decision')
assert(nextPrompt.includes('Do not collect fabricated evidence'), 'next prompt must forbid fabricated evidence')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('run Docker build/run/push'), 'next prompt must block Docker')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-collection-blocker:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-collection-blocker-diagnostics.mjs',
  'package script missing'
)

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_owner_evidence_collection_blocker_diagnostics_passed',
      decision,
      sourceHead,
      pr1046Verified: true,
      ownerProvidedEvidenceFound: false,
      missingOwnerEvidenceCount: 7,
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
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-INPUT-REQUEST: request required owner evidence, no execution',
    },
    null,
    2
  )
)
