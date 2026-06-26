import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_completed_with_warnings_ready_for_packet_shell_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_packet_authoring'
const sourceHead = '90f942dc4a1b6b6182024fab3cd30d5d9ccf815d'

const packetDocs = [
  [
    'WORKER_RUNTIME_JOBS',
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-worker-runtime-jobs.md',
  ],
  [
    'SOUND_RUNTIME_MEDIA',
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-sound-runtime-media.md',
  ],
  [
    'SUPABASE_RLS_STORAGE_DATABASE',
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-supabase-boundary.md',
  ],
  [
    'PUBLIC_ARTIFACT_DELIVERY_POLICY',
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-artifact-delivery.md',
  ],
  [
    'BILLING_STRIPE_CREDITS',
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-billing-credits.md',
  ],
  [
    'COMPLIANCE_SECURITY',
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-compliance-security.md',
  ],
  [
    'PRODUCT_BETA_READINESS',
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-product-beta-readiness.md',
  ],
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

function assertClosedGates(gates, path) {
  for (const [key, value] of Object.entries(gates)) {
    assert(value === false, `${path}.${key} must be false`)
  }
}

let authoredShells = 0
for (const [ownerArea, path] of packetDocs) {
  const json = parseJsonBlock(path)
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${path} owner mismatch`)
  assert(json.ownerArea === ownerArea, `${path} owner area mismatch`)
  assert(json.decision === decision, `${path} decision mismatch`)
  assert(json.sourceVerification.sourceHead === sourceHead, `${path} source head mismatch`)
  assert(json.sourceVerification.pr1042.status === 'merged', `${path} PR #1042 status mismatch`)
  assert(json.sourceVerification.pr1042.mergeCommit === sourceHead, `${path} PR #1042 merge commit mismatch`)
  assert(json.sourceVerification.pr1042.decision === sourceDecision, `${path} PR #1042 decision mismatch`)
  assert(json.packetShell.packetShellAuthoredToday === true, `${path} shell must be authored`)
  assert(typeof json.packetShell.requiredEvidenceItem === 'string', `${path} evidence item missing`)
  assert(json.packetShell.requiredEvidenceItem.length > 40, `${path} evidence item too short`)
  assert(json.packetShell.evidenceCollectedToday === false, `${path} evidence collection must be false`)
  assert(json.packetShell.evidenceSubmittedToday === false, `${path} evidence submission must be false`)
  assert(json.packetShell.evidenceAcceptedToday === false, `${path} evidence acceptance must be false`)
  assert(json.packetShell.ownerSignoffCompletedToday === false, `${path} owner signoff must be false`)
  assert(json.packetShell.blockedUntilOwnerInput === true, `${path} must remain blocked until owner input`)
  assert(json.packetShell.executionApprovalsGrantedToday === 'none', `${path} execution approvals must be none`)
  assertClosedGates(json.closedGates, path)
  assert(json.supabaseClassification.updateRequired === 'no', `${path} Supabase update classification mismatch`)
  assert(json.supabaseClassification.environmentTouched === 'no', `${path} Supabase env classification mismatch`)
  assert(json.supabaseClassification.sqlExecuted === 'no', `${path} Supabase SQL classification mismatch`)
  assert(json.supabaseClassification.migrationDeployed === 'no', `${path} Supabase migration classification mismatch`)
  assert(json.supabaseClassification.nextAction === 'none', `${path} Supabase next action classification mismatch`)
  authoredShells += 1
}

assert(authoredShells === 7, 'packet shell count must be 7')

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-owner-review.md'
)
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(
  sourceReview.ownerReviewResult.futureOwnerEvidencePacketAuthoringMayProceed === true,
  'source owner-review must allow packet authoring'
)

const nextPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-owner-review.md'
)
assert(nextPrompt.includes(decision), 'next prompt must require packet authoring decision')
assert(nextPrompt.includes('packet shell count `7`'), 'next prompt must preserve shell count')
assert(nextPrompt.includes('collected evidence count `0`'), 'next prompt must preserve collected evidence zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('run Docker build/run/push'), 'next prompt must block Docker')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-submission-packet-authoring:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-diagnostics.mjs',
  'package script missing'
)

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_diagnostics_passed',
      decision,
      sourceHead,
      pr1042Verified: true,
      authoredPacketShellCountToday: authoredShells,
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
        'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PACKET-SHELL-OWNER-REVIEW: review owner evidence packet shells, no execution',
    },
    null,
    2
  )
)
