import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const decision = 'worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_completed_with_warnings_ready_for_validation_disk_cleanup_and_controlled_runtime_preflight'
const productBetaDecision = 'worker_runtime_jobs_sound_cpu_product_beta_readiness_gap_closure_completed_with_warnings_all_planning_gaps_closed_runtime_beta_blocked'
const nextPrompt = 'REEDITPRO-LOCAL-VALIDATION-DISK-CLEANUP-1: free validation disk for SOUND CPU runtime preflight, no runtime execution'

const files = {
  resolution: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-source-register.md',
  classification: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-classification-register.md',
  nextStep: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-next-step-register.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-reeditpro-local-validation-disk-cleanup-1-sound-cpu-runtime-preflight.md',
  productBeta: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  productBetaRemaining: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-remaining-register.md',
  dispatchSchemaOwner: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review.md',
  dispatchClosureOwner: 'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-review.md',
  dispatchSignoffOwner: 'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review.md',
  ownerEvidenceShell: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-owner-review.md',
  routeReadinessClaim: 'docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-review.md',
  runtimeOwnerGateMap: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-review.md',
  runtimeGapClosure: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-plan-review.md',
  betaScorecard: 'docs/beta-readiness-scorecard.md',
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
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
  for (const key of keys) assert(value?.[key] === false, `${label}.${key} must remain false`)
}

const resolution = parseJsonFence(files.resolution, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution')
const sourceRegister = parseJsonFence(files.sourceRegister, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-source-register')
const classification = parseJsonFence(files.classification, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-classification-register')
const nextStep = parseJsonFence(files.nextStep, 'worker-runtime-jobs-sound-cpu-runtime-beta-next-step-register')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-runtime-beta-claim-policy')
const productBeta = parseJsonFence(files.productBeta, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure')
const productBetaRemaining = parseJsonFence(files.productBetaRemaining, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-remaining-register')
const dispatchSchemaOwner = parseJsonFence(files.dispatchSchemaOwner, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review')
const dispatchClosureOwner = parseJsonFence(files.dispatchClosureOwner, 'worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-review')
const dispatchSignoffOwner = parseJsonFence(files.dispatchSignoffOwner, 'worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review')
const ownerEvidenceShell = parseJsonFence(files.ownerEvidenceShell, 'worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shell-owner-review')
const routeReadinessClaim = parseJsonFence(files.routeReadinessClaim, 'worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-review')
const runtimeOwnerGateMap = parseJsonFence(files.runtimeOwnerGateMap, 'worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-review')
const runtimeGapClosure = parseJsonFence(files.runtimeGapClosure, 'worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-plan-review')
const promptText = read(files.prompt)
read(files.betaScorecard)

assert(resolution.owner === 'WORKER_RUNTIME_JOBS', 'resolution owner mismatch')
assert(resolution.decision === decision, 'resolution decision mismatch')
assert(resolution.sourceVerification.sourceHead === 'ef316547b244e64adb6296726e1fa98d39afff6d', 'source head mismatch')
assert(resolution.sourceVerification.pr1090.mergeCommit === 'ef316547b244e64adb6296726e1fa98d39afff6d', 'PR #1090 merge commit mismatch')
assert(resolution.sourceVerification.pr1090.decision === productBetaDecision, 'PR #1090 decision mismatch')
assert(productBeta.decision === productBetaDecision, 'product beta decision mismatch')
assert(productBetaRemaining.summary.closedGapCountToday === 8, 'product beta closed gap count mismatch')
assert(productBetaRemaining.summary.remainingGapCount === 0, 'product beta remaining gap count mismatch')
for (const key of Object.keys(resolution.sourceVerification.repoEvidenceInspected)) {
  assert(resolution.sourceVerification.repoEvidenceInspected[key] === true, `repo evidence not inspected: ${key}`)
}

assert(resolution.resolutionResult.toolCandidateCount === 15, 'tool count mismatch')
assert(resolution.resolutionResult.planningGapCountClosed === 8, 'planning gap count mismatch')
assert(resolution.resolutionResult.remainingPlanningGapCount === 0, 'remaining planning gap mismatch')
assert(resolution.resolutionResult.ownerChatWaitRequiredForPlanningDecision === false, 'owner chat wait should not be required')
assert(resolution.resolutionResult.repoLaneEvidenceSufficientForNextPlanningStep === true, 'repo evidence should be sufficient for next planning step')
assert(resolution.resolutionResult.staleOwnerInputWaitsReconciledForPlanning === true, 'stale owner waits should be reconciled for planning')
assert(resolution.resolutionResult.controlledRuntimePreflightMayBePlannedAfterDiskCleanup === true, 'controlled preflight should be planned after cleanup')
assert(resolution.resolutionResult.localValidationDiskCleanupRequiredBeforeHydration === true, 'disk cleanup requirement missing')
assertFalseFlags(
  resolution.resolutionResult,
  [
    'validationDependencyHydrationReadyToday',
    'runtimeExecutionApprovedToday',
    'workerExecutionApprovedToday',
    'routeExecutionApprovedToday',
    'toolExecutionApprovedToday',
    'mediaProcessingApprovedToday',
    'providerCallsApprovedToday',
    'supabaseMutationApprovedToday',
    'sqlExecutionApprovedToday',
    'artifactDeliveryApprovedToday',
    'creditMutationApprovedToday',
    'stripePaymentProcessingApprovedToday',
    'internalBetaAllowed',
    'externalBetaAllowed',
    'paidProductionAllowed',
    'productionAllowed',
    'generatedLocalFixturePassedClaimedToday',
    'dryRunPassedClaimedToday',
    'runtimeReadinessClaimedToday',
    'workerReadinessClaimedToday',
    'mediaReadinessClaimedToday',
  ],
  'resolution.resolutionResult',
)
assert(resolution.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(sourceRegister.sourceRows.length === 10, 'source row count mismatch')
for (const row of sourceRegister.sourceRows) {
  read(row.file)
  assert(row.acceptedForBlockerResolution === true, `${row.sourceId} not accepted`)
  assert(row.grantsExecutionApproval === false, `${row.sourceId} must not grant execution`)
}
assert(sourceRegister.summary.ownerWaitRowsReconciledForPlanning === 7, 'owner wait reconciliation count mismatch')
assertFalseFlags(sourceRegister.summary, ['grantsExecutionApproval', 'grantsRuntimeReadiness', 'grantsInternalBeta', 'grantsExternalBeta', 'grantsProduction'], 'sourceRegister.summary')

assert(dispatchSchemaOwner.ownerReviewResult.futureDispatchContractApprovalClosurePlanMayProceed === true, 'dispatch schema owner review not accepted for closure planning')
assert(dispatchClosureOwner.ownerReviewResult.futureDispatchContractSignoffEvidencePlanMayProceed === true, 'dispatch closure owner review not accepted for signoff evidence planning')
assert(dispatchSignoffOwner.ownerReviewResult.futureRequiredOwnerEvidenceCollectionPlanMayProceed === true, 'dispatch signoff owner review not accepted for evidence planning')
assert(ownerEvidenceShell.ownerReviewResult.packetShellsAcceptedForOwnerEvidenceCollection === true, 'owner evidence shell not accepted')
assert(ownerEvidenceShell.ownerReviewResult.ownerInputsStillMissing === true, 'owner evidence shell should record missing inputs')
assert(routeReadinessClaim.ownerReviewResult.routeReadinessClaimAcceptedForExecutionToday === false, 'route readiness must not grant execution')
assert(runtimeOwnerGateMap.ownerReviewResult.runtimeExecutionApprovedToday === false, 'runtime owner gate map must not approve execution')
assert(runtimeGapClosure.ownerReviewResult.runtimeExecutionApprovedToday === false, 'runtime gap closure must not approve execution')

assert(classification.resolvedForPlanning.length === 3, 'resolved planning count mismatch')
assert(classification.currentBlockers.length === 9, 'current blocker count mismatch')
assert(classification.summary.nextBlockerId === 'local_validation_disk_hydration_blocked', 'next blocker mismatch')
assertFalseFlags(classification.summary, ['runtimeExecutionAllowed', 'internalBetaAllowed', 'externalBetaAllowed', 'productionAllowed'], 'classification.summary')

assert(nextStep.selectedNextPrompt === nextPrompt, 'selected next prompt mismatch')
assert(nextStep.nextSteps[0].prompt === nextPrompt, 'first next step mismatch')
for (const step of nextStep.nextSteps) assert(step.runtimeExecutionAllowed === false, 'next steps must not allow runtime execution')
assertSupabaseNoop(nextStep.supabaseClassification, 'nextStep')

assert(claims.allowedClaims.includes('owner chat waits are not required for the next planning decision'), 'allowed owner-wait claim missing')
assert(claims.allowedClaims.includes('local validation disk cleanup is the next safe blocker-resolution step'), 'allowed disk cleanup claim missing')
for (const claim of ['generated_local_fixture_passed', 'dry_run_passed', 'runtime readiness', 'internal beta readiness', 'external beta readiness', 'production readiness']) {
  assert(claims.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claims')

for (const phrase of [
  decision,
  'Do not touch `/Volumes/backup/REeditpro` tracked source',
  'whole-worktree deletion is a last resort only',
  'Do not run the runtime beta preflight',
]) {
  assert(promptText.includes(phrase), `cleanup prompt missing phrase: ${phrase}`)
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-runtime-beta-blocker-resolution:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_diagnostics_passed',
  decision,
  toolCandidateCount: resolution.resolutionResult.toolCandidateCount,
  planningGapCountClosed: resolution.resolutionResult.planningGapCountClosed,
  remainingPlanningGapCount: resolution.resolutionResult.remainingPlanningGapCount,
  nextBlockerId: classification.summary.nextBlockerId,
  validationDependencyHydrationReadyToday: resolution.resolutionResult.validationDependencyHydrationReadyToday,
  runtimeExecutionApprovedToday: resolution.resolutionResult.runtimeExecutionApprovedToday,
  internalBetaAllowed: resolution.resolutionResult.internalBetaAllowed,
  externalBetaAllowed: resolution.resolutionResult.externalBetaAllowed,
  productionAllowed: resolution.resolutionResult.productionAllowed,
  nextPrompt,
}, null, 2))
