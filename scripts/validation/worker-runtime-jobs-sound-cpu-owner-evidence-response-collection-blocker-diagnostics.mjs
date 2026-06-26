import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_owner_evidence_response_collection_blocked_no_owner_responses'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_owner_evidence_input_request_created_blocked_until_owner_responses'
const sourceHead = '9ecfe4ba3a4cda4556133cad5b79746dcec3ba66'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-response-collection-blocker.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-response-missing-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-response-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-response-collection-claim-policy.md',
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
    if (['ownerResponseCollectionAttempted', 'responseCollectionBlocked'].includes(key)) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (key === 'ownerResponsesFound') {
      assert(value === false, `${context}.${key} must be false`)
    } else if (key === 'requiredOwnerAreaCount' || key === 'requestedEvidenceStatementCount') {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (
      key === 'ownerResponsesReceivedToday' ||
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

const blocker = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-response-collection-blocker.md']
assert(blocker.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(blocker.sourceVerification.pr1051.status === 'merged', 'PR #1051 status mismatch')
assert(blocker.sourceVerification.pr1051.mergeCommit === sourceHead, 'PR #1051 merge commit mismatch')
assert(blocker.sourceVerification.pr1051.decision === sourceDecision, 'PR #1051 decision mismatch')
assertClosed(blocker.responseCollectionResult, 'responseCollectionResult')
assert(
  blocker.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-RESPONSE-WAIT: wait for required owner responses, no execution',
  'next prompt mismatch'
)

const missing = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-response-missing-register.md']
assert(missing.missingOwnerResponses.length === 7, 'missing response count mismatch')
for (const area of ownerAreas) {
  assert(missing.missingOwnerResponses.includes(area), `${area} missing response not recorded`)
}
assert(missing.responseState.requiredOwnerAreaCount === 7, 'response state owner count mismatch')
assert(missing.responseState.missingOwnerResponseCount === 7, 'response state missing count mismatch')
assert(missing.responseState.ownerResponsesReceivedToday === 0, 'responses received must be zero')
assert(missing.responseState.collectedEvidenceCountToday === 0, 'collected evidence must be zero')
assert(missing.responseState.submittedEvidenceCountToday === 0, 'submitted evidence must be zero')
assert(missing.responseState.acceptedEvidenceCountToday === 0, 'accepted evidence must be zero')
assert(missing.responseState.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')

const followUp = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-response-blocker-follow-up-register.md']
assert(followUp.remainingBlockers.length === 13, 'remaining blocker count mismatch')
assert(followUp.blockerState.responseCollectionBlocked === true, 'response collection must be blocked')
assert(followUp.blockerState.remainingOwnerResponseBlockerCount === 13, 'remaining response blocker count mismatch')
assert(followUp.blockerState.ownerResponsesReceivedToday === 0, 'blocker responses must be zero')
assert(followUp.blockerState.collectedEvidenceCountToday === 0, 'blocker collected evidence must be zero')
assert(followUp.blockerState.submittedEvidenceCountToday === 0, 'blocker submitted evidence must be zero')
assert(followUp.blockerState.acceptedEvidenceCountToday === 0, 'blocker accepted evidence must be zero')
assert(followUp.blockerState.completedOwnerSignoffCountToday === 0, 'blocker signoffs must be zero')
assert(followUp.blockerState.closedGapCountToday === 0, 'blocker gaps must be zero')
assert(followUp.blockerState.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
for (const flag of [
  'dispatchContractApprovedToday',
  'workerExecutionApprovedToday',
  'runtimeReadinessClaimedToday',
  'betaProductionReadinessClaimedToday',
]) {
  assert(followUp.blockerState[flag] === false, `blocker ${flag} must be false`)
}

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-response-collection-claim-policy.md']
assertClosed(policy.allowedClaims, 'allowedClaims')
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'owner_response_received',
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-response-wait.md')
assert(nextPrompt.includes(decision), 'next prompt must require blocked response decision')
assert(nextPrompt.includes('Do not create, infer, or fabricate owner responses'), 'next prompt must forbid fabricated responses')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('run Docker build/run/push'), 'next prompt must block Docker')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-response-collection-blocker:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-response-collection-blocker-diagnostics.mjs',
  'package script missing'
)

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_owner_evidence_response_collection_blocker_diagnostics_passed',
      decision,
      sourceHead,
      pr1051Verified: true,
      ownerResponsesFound: false,
      ownerResponsesReceivedToday: 0,
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
        'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-RESPONSE-WAIT: wait for required owner responses, no execution',
    },
    null,
    2
  )
)
