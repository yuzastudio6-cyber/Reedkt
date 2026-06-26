import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_package_proof_owner_review_passed_with_warnings_ready_for_lane_reconciliation'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_music21_import_timeout_fix_passed_with_warnings_ready_for_package_proof_owner_review'
const sourceHead = 'cbe4c9e415a29725ebe5a574c1e41e2288d668b3'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PACKAGE-PROOF-LANE-RECONCILIATION: reconcile bounded package proof with existing SOUND CPU lanes, no execution'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-package-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-warning-review.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-downstream-reconciliation-register.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-owner-claim-policy.md',
]

const requiredFiles = [
  ...docs,
  'docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result.md',
  'docs/worker-runtime-jobs-sound-cpu-no-media-no-artifact-package-proof-register.md',
  'docs/worker-runtime-jobs-sound-cpu-music21-statistics-fallback-register.md',
  'docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-owner-review.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1109.status === 'merged', 'PR #1109 status mismatch')
assert(review.sourceVerification.pr1109.mergeCommit === sourceHead, 'PR #1109 merge commit mismatch')
assert(review.sourceVerification.pr1109.decision === sourceDecision, 'PR #1109 decision mismatch')
assert(review.ownerReviewResult.packageProofAcceptedForLaneReconciliationPlanning === true, 'package proof acceptance missing')
assert(review.ownerReviewResult.allFifteenCandidateToolsCovered === true, '15-tool coverage missing')
assert(review.ownerReviewResult.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(review.ownerReviewResult.aliasCoveredToolCount === 2, 'alias count mismatch')
assert(review.ownerReviewResult.metadataPassedCount === 13, 'metadata count mismatch')
assert(review.ownerReviewResult.moduleImportsPassedCount === 14, 'module import count mismatch')
assert(review.ownerReviewResult.syntheticAssertionsPassedCount === 5, 'synthetic count mismatch')
assert(review.ownerReviewResult.statisticsFallbackWarningAccepted === true, 'statistics warning acceptance missing')
for (const key of [
  'acceptedForToolCallExecutionToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'supabaseSqlApprovedToday',
  'dockerGcpApprovedToday',
  'artifactCreationApprovedToday',
  'betaOrProductionReadinessClaimedToday',
]) {
  assert(review.ownerReviewResult[key] === false, `${key} must remain false`)
}
assert(review.nextPrompt === nextPrompt, 'review next prompt mismatch')

const sourceResult = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result.md')
assert(sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(sourceResult.proofResult.requirementsInstallPassed === true, 'requirements proof missing')
assert(sourceResult.proofResult.metadataPassedCount === 13, 'source metadata mismatch')
assert(sourceResult.proofResult.moduleImportsPassedCount === 14, 'source import mismatch')
assert(sourceResult.proofResult.syntheticAssertionsPassedCount === 5, 'source synthetic mismatch')
assert(sourceResult.proofResult.music21ImportPassed === true, 'source music21 proof missing')
assert(sourceResult.proofResult.tempVenvRemoved === true, 'source temp venv cleanup missing')

const proof = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-no-media-no-artifact-package-proof-register.md')
assert(proof.directPinnedPackages.length === 13, 'direct pinned package list mismatch')
assert(proof.aliasCoveredTools.includes('pydub_effects'), 'pydub_effects alias missing')
assert(proof.aliasCoveredTools.includes('ebu_r128_pyloudnorm'), 'ebu_r128 alias missing')
assert(proof.moduleImports.length === 14, 'module import register mismatch')
assert(proof.moduleImports.every((row) => row.passed === true), 'all imports must pass')
assert(proof.syntheticAssertions.length === 5, 'synthetic assertion register mismatch')
assert(proof.syntheticAssertions.every((row) => row.passed === true), 'all synthetic assertions must pass')
for (const [key, value] of Object.entries(proof.proofBoundaries)) {
  assert(value === false, `proof boundary ${key} must be false`)
}

const fallback = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-music21-statistics-fallback-register.md')
assert(fallback.fallback.guardUsed === true, 'statistics guard missing')
assert(fallback.fallback.blockedExtension === '_statistics', 'statistics blocked extension mismatch')
assert(fallback.fallback.guardScope === 'proof subprocess only', 'statistics guard scope widened')
assert(fallback.fallback.guardedStatisticsProbe.passed === true, 'guarded statistics proof missing')
assert(fallback.runtimeCaveat.runtimeReadinessClaimed === false, 'runtime caveat widened')
assert(fallback.runtimeCaveat.toolCallReadinessClaimed === false, 'tool-call caveat widened')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-acceptance-register.md']
assert(acceptance.acceptedProofEvidence.directPinnedPackages.length === 13, 'accepted package count mismatch')
assert(acceptance.acceptedProofEvidence.aliasCoveredTools.length === 2, 'accepted alias count mismatch')
assert(acceptance.acceptedProofEvidence.metadataFailedCount === 0, 'metadata failure count must be zero')
assert(acceptance.acceptedProofEvidence.moduleImportsFailedCount === 0, 'module failure count must be zero')
assert(acceptance.acceptedProofEvidence.syntheticAssertionsFailedCount === 0, 'synthetic failure count must be zero')
assert(acceptance.acceptedForExecutionToday === false, 'execution acceptance must be false')
assert(acceptance.acceptedForRuntimeReadinessToday === false, 'runtime readiness acceptance must be false')
assert(acceptance.acceptedForBetaReadinessToday === false, 'beta readiness acceptance must be false')
assert(acceptance.acceptedForProductionReadinessToday === false, 'production readiness acceptance must be false')

const warnings = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-warning-review.md']
assert(warnings.acceptedWarnings.some((row) => row.warningId === 'local_python_313_statistics_c_extension_timeout' && row.accepted === true), 'statistics warning missing')
assert(warnings.runtimeCaveat.futureRuntimeImagesMustVerifyStatisticsBehavior === true, 'future runtime caveat missing')
assert(warnings.runtimeCaveat.packageProofDoesNotAuthorizeRuntimeFlags === true, 'runtime flag caveat missing')
assert(warnings.runtimeCaveat.packageProofDoesNotAuthorizeToolCallDispatch === true, 'tool-call caveat missing')

const downstream = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-downstream-reconciliation-register.md']
assert(downstream.observedDownstreamLaneState.noExecutionImportProofOwnerReviewAlreadyExists === true, 'downstream no-execution owner review must be observed')
assert(downstream.observedDownstreamLaneState.noExecutionImportProofOwnerReviewDecision === 'worker_runtime_jobs_sound_cpu_no_execution_import_proof_owner_review_passed_with_warnings_ready_for_runtime_guard_hardening_plan', 'downstream decision mismatch')
assert(downstream.reconciliationNeeded.createDuplicateDownstreamLane === false, 'duplicate downstream lane must be false')
assert(downstream.reconciliationNeeded.rewriteExistingDownstreamEvidenceNow === false, 'rewrite existing evidence must be false')
assert(downstream.remainingBlockers.some((row) => row.blockerId === 'package_proof_downstream_reconciliation_pending' && row.status === 'next'), 'next reconciliation blocker missing')

const downstreamReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-owner-review.md')
assert(downstreamReview.decision === downstream.observedDownstreamLaneState.noExecutionImportProofOwnerReviewDecision, 'observed downstream review mismatch')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-package-proof-owner-claim-policy.md']
for (const value of Object.values(policy.allowedClaims)) assert(value === true, 'allowed claims must all be true')
for (const claim of ['tool-call readiness', 'runtime readiness', 'generated_local_fixture_passed', 'dry_run_passed', 'external beta readiness', 'production readiness']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim: ${claim}`)
}
for (const value of Object.values(policy.closedGates)) assert(value === true, 'closed gates must all be true')
assertNoop(policy.supabaseClassification, 'policy.supabaseClassification')
assert(policy.nextPrompt === nextPrompt, 'policy next prompt mismatch')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation.md')
assert(prompt.includes(decision), 'reconciliation prompt must require owner-review decision')
assert(prompt.includes('Do not rerun package installation'), 'reconciliation prompt must block rerun')
assert(prompt.includes('tool runtime dispatch'), 'reconciliation prompt must block tool dispatch')
assert(prompt.includes('readiness claims'), 'reconciliation prompt must block readiness claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-package-proof-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-package-proof-owner-review-diagnostics.mjs',
  'package script missing',
)

const changedText = docs.concat(['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation.md']).map(read).join('\n')
for (const pattern of [
  /"acceptedForToolCallExecutionToday"\s*:\s*true/,
  /"workerExecutionApprovedToday"\s*:\s*true/,
  /"routeExecutionApprovedToday"\s*:\s*true/,
  /"mediaProcessingApprovedToday"\s*:\s*true/,
  /"supabaseSqlApprovedToday"\s*:\s*true/,
  /"dockerGcpApprovedToday"\s*:\s*true/,
  /"artifactCreationApprovedToday"\s*:\s*true/,
  /"betaOrProductionReadinessClaimedToday"\s*:\s*true/,
]) {
  assert(!pattern.test(changedText), `forbidden true flag matched ${pattern}`)
}

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_package_proof_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  packageProofAcceptedForLaneReconciliationPlanning: true,
  allFifteenCandidateToolsCovered: true,
  directPinnedPackageCount: 13,
  aliasCoveredToolCount: 2,
  metadataPassedCount: 13,
  moduleImportsPassedCount: 14,
  syntheticAssertionsPassedCount: 5,
  acceptedForToolCallExecutionToday: false,
  runtimeReadinessClaimedToday: false,
  nextPrompt,
}, null, 2))
