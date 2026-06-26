import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_package_proof_lane_reconciliation_completed_with_warnings_ready_for_current_lane_status_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_package_proof_owner_review_passed_with_warnings_ready_for_lane_reconciliation'
const sourceHead = '5a8082efbd81313687d0d16470ae6058f2a53889'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-CURRENT-LANE-STATUS-REVIEW: review current SOUND CPU lane status, no execution'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-lane-source-map.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-downstream-status-register.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-duplicate-risk-register.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-current-lane-next-step-register.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation-claim-policy.md',
]

const requiredFiles = [
  ...docs,
  'docs/worker-runtime-jobs-sound-cpu-package-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-reconciliation-audit.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-current-lane-status-review.md',
  'package.json',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(file) {
  assert(fs.existsSync(file), `Missing file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJsonBlock(file) {
  const text = read(file)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${file} missing fenced json block`)
  return JSON.parse(match[1])
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value?.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value?.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value?.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value?.nextAction === 'none', `${label}.nextAction must be none`)
}

for (const file of requiredFiles) read(file)

const parsed = Object.fromEntries(docs.map((file) => [file, parseJsonBlock(file)]))
for (const [file, json] of Object.entries(parsed)) {
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${file} owner mismatch`)
  assert(json.decision === decision, `${file} decision mismatch`)
}

const reconciliation = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation.md']
assert(reconciliation.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(reconciliation.sourceVerification.pr1111.mergeCommit === sourceHead, 'PR #1111 merge commit mismatch')
assert(reconciliation.sourceVerification.pr1111.decision === sourceDecision, 'PR #1111 decision mismatch')
assert(reconciliation.reconciliationResult.newPackageProofAcceptedAsSupplementalEvidence === true, 'supplemental package proof flag missing')
assert(reconciliation.reconciliationResult.allFifteenCandidateToolsPackageProofCovered === true, '15-tool package proof coverage missing')
assert(reconciliation.reconciliationResult.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(reconciliation.reconciliationResult.aliasCoveredToolCount === 2, 'alias count mismatch')
assert(reconciliation.reconciliationResult.metadataPassedCount === 13, 'metadata count mismatch')
assert(reconciliation.reconciliationResult.moduleImportsPassedCount === 14, 'module import count mismatch')
assert(reconciliation.reconciliationResult.syntheticAssertionsPassedCount === 5, 'synthetic count mismatch')
assert(reconciliation.reconciliationResult.existingDownstreamLaneArtifactsInspected === true, 'downstream inspection missing')
assert(reconciliation.reconciliationResult.duplicateDownstreamLaneCreationAllowed === false, 'duplicate downstream creation must stay false')
assert(reconciliation.reconciliationResult.ownerChatWaitRequired === false, 'owner chat wait must be false')
for (const key of [
  'toolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'supabaseSqlApprovedToday',
  'dockerGcpApprovedToday',
  'artifactCreationApprovedToday',
  'internalBetaAllowed',
  'externalBetaAllowed',
  'productionAllowed',
]) {
  assert(reconciliation.reconciliationResult[key] === false, `${key} must remain false`)
}
assert(reconciliation.nextPrompt === nextPrompt, 'next prompt mismatch')

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-package-proof-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'package proof owner-review source mismatch')
assert(sourceReview.ownerReviewResult.allFifteenCandidateToolsCovered === true, 'source 15-tool proof missing')
assert(sourceReview.ownerReviewResult.acceptedForToolCallExecutionToday === false, 'source tool-call gate widened')

const music21Fix = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result.md')
assert(music21Fix.proofResult.moduleImportsPassedCount === 14, 'music21 fix module count mismatch')
assert(music21Fix.proofResult.syntheticAssertionsPassedCount === 5, 'music21 fix synthetic count mismatch')

const sourceMap = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-lane-source-map.md']
assert(sourceMap.sourceRows.length === 5, 'source row count mismatch')
for (const row of sourceMap.sourceRows) {
  assert(Array.isArray(row.evidenceFiles) && row.evidenceFiles.length > 0, `${row.sourceId} evidence list missing`)
  for (const file of row.evidenceFiles) read(file)
}

const downstream = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-downstream-status-register.md']
assert(downstream.downstreamStatuses.length === 4, 'downstream status count mismatch')
assert(downstream.downstreamStatuses.every((row) => row.alreadyPresent === true), 'all downstream lanes must be present')
assert(downstream.downstreamStatuses.every((row) => row.duplicateAllowed === false), 'downstream duplicates must be false')
assert(downstream.statusConclusion.newEvidenceRequiresAdditiveCurrentStatusReview === true, 'current status review conclusion missing')
assert(downstream.statusConclusion.existingDownstreamDocsShouldNotBeRecreated === true, 'no-recreate conclusion missing')

const duplicate = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-duplicate-risk-register.md']
assert(duplicate.duplicateRiskReview.openSamePurposePrFound === false, 'same-purpose PR must be false')
assert(duplicate.duplicateRiskReview.oldMergedOwnerEvidenceLaneReconciliationFound === true, 'old merged lane must be recorded')
assert(duplicate.duplicateRiskReview.currentPacketPurposeIsDistinct === true, 'distinct packet purpose missing')
for (const value of Object.values(duplicate.duplicateCreationPolicy)) assert(value === true, 'duplicate creation policy must all be true')

const next = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-current-lane-next-step-register.md']
assert(next.nextStepDecision.recommendedNextPrompt === nextPrompt, 'recommended next prompt mismatch')
assert(next.nextStepDecision.ownerChatWaitRequired === false, 'owner chat wait must be false')
assert(next.nextStepDecision.repoEvidenceInspectionRequired === true, 'repo inspection requirement missing')
assert(next.nextStepDecision.executionAllowedInNextPrompt === false, 'next prompt must not allow execution')
for (const value of Object.values(next.stillBlocked)) assert(value === true, 'next-step blocked gates must all be true')

const claimPolicy = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation-claim-policy.md']
for (const value of Object.values(claimPolicy.allowedClaims)) assert(value === true, 'allowed claims must be true')
for (const claim of ['tool-call execution ready', 'runtime readiness', 'generated_local_fixture_passed', 'dry_run_passed', 'external beta readiness', 'production readiness']) {
  assert(claimPolicy.forbiddenClaims.includes(claim), `missing forbidden claim: ${claim}`)
}
assertNoop(claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')
assert(claimPolicy.requiredNoScopeStatement.includes('No Docker build, Docker push, or Docker run'), 'required no-scope statement missing Docker closure')

const oldAudit = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-reconciliation-audit.md')
assert(oldAudit.reconciliationResult.toolCandidateCount === 15, 'old audit tool count mismatch')
assert(oldAudit.reconciliationResult.externalBetaAllowed === false, 'old audit beta gate widened')

const preflight = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight.md')
assert(preflight.preflightResult.toolCandidateCount === 15, 'preflight tool count mismatch')
assert(preflight.preflightResult.runtimeExecutionApprovedToday === false, 'preflight runtime gate widened')

const runtimeGate = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md')
assert(runtimeGate.approvalGateResult.toolCandidateCount === 15, 'runtime gate tool count mismatch')
assert(runtimeGate.approvalGateResult.approvedForExecutionToday === false, 'runtime gate execution approval widened')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-current-lane-status-review.md')
assert(prompt.includes(decision), 'current status prompt must require reconciliation decision')
assert(prompt.includes('Use repo evidence rather than waiting for owner chat responses'), 'current status prompt must avoid owner wait')
assert(prompt.includes('Do not create duplicate'), 'current status prompt must block duplicates')
assert(prompt.includes('readiness claims'), 'current status prompt must block readiness claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-package-proof-lane-reconciliation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_package_proof_lane_reconciliation_diagnostics_passed',
  decision,
  sourceHead,
  allFifteenCandidateToolsPackageProofCovered: true,
  duplicateDownstreamLaneCreationAllowed: false,
  ownerChatWaitRequired: false,
  toolCallExecutionApprovedToday: false,
  runtimeReadinessClaimedToday: false,
  nextPrompt,
}, null, 2))
