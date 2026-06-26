import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_owner_evidence_input_request_created_blocked_until_owner_responses'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_owner_evidence_collection_blocked_missing_owner_input'
const sourceHead = 'b419623138eb532a267fe130b6d5aa26bb1defe8'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-input-request.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-input-request-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-input-request-blocker-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-input-request-claim-policy.md',
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

function assertCounts(map, context) {
  for (const [key, value] of Object.entries(map)) {
    if (key === 'ownerEvidenceInputRequestCreated' || key === 'ownerResponsesRequired') {
      assert(value === true, `${context}.${key} must be true`)
    } else if (key === 'requiredOwnerAreaCount' || key === 'requestedEvidenceStatementCount') {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (key === 'ownerResponseBlockerCount') {
      assert(value === 13, `${context}.${key} must be 13`)
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

const request = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-input-request.md']
assert(request.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(request.sourceVerification.pr1049.status === 'merged', 'PR #1049 status mismatch')
assert(request.sourceVerification.pr1049.mergeCommit === sourceHead, 'PR #1049 merge commit mismatch')
assert(request.sourceVerification.pr1049.decision === sourceDecision, 'PR #1049 decision mismatch')
assertCounts(request.requestResult, 'requestResult')
assert(
  request.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-RESPONSE-COLLECTION: collect owner responses, no execution',
  'next prompt mismatch'
)

const register = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-input-request-register.md']
assert(register.ownerEvidenceRequests.length === 7, 'request row count mismatch')
for (const area of ownerAreas) {
  const row = register.ownerEvidenceRequests.find((item) => item.ownerArea === area)
  assert(row, `${area} request row missing`)
  assert(row.ownerResponseReceivedToday === false, `${area} response must be missing`)
  assert(typeof row.requestedStatement === 'string' && row.requestedStatement.length > 80, `${area} request too short`)
}
assert(register.summary.requiredOwnerAreaCount === 7, 'summary owner count mismatch')
assert(register.summary.requestedEvidenceStatementCount === 7, 'summary requested statement count mismatch')
assert(register.summary.ownerResponsesReceivedToday === 0, 'summary responses must be zero')
assert(register.summary.collectedEvidenceCountToday === 0, 'summary collected evidence must be zero')
assert(register.summary.submittedEvidenceCountToday === 0, 'summary submitted evidence must be zero')
assert(register.summary.acceptedEvidenceCountToday === 0, 'summary accepted evidence must be zero')
assert(register.summary.executionApprovalsGrantedToday === 'none', 'summary execution approvals must be none')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-input-request-blocker-register.md']
assert(blockers.remainingBlockers.length === 13, 'remaining blocker count mismatch')
assertCounts(blockers.blockerState, 'blockerState')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-input-request-claim-policy.md']
assertCounts(policy.allowedClaims, 'allowedClaims')
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-response-collection.md')
assert(nextPrompt.includes(decision), 'next prompt must require input request decision')
assert(nextPrompt.includes('do not invent responses'), 'next prompt must forbid invented responses')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('run Docker build/run/push'), 'next prompt must block Docker')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-input-request:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-input-request-diagnostics.mjs',
  'package script missing'
)

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_owner_evidence_input_request_diagnostics_passed',
      decision,
      sourceHead,
      pr1049Verified: true,
      ownerEvidenceInputRequestCreated: true,
      requestedEvidenceStatementCount: 7,
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
        'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-RESPONSE-COLLECTION: collect owner responses, no execution',
    },
    null,
    2
  )
)
