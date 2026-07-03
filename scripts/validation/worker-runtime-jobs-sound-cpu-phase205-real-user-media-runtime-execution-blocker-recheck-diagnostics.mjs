import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase205_real_user_media_runtime_execution_blocker_recheck_completed_with_warnings_ready_for_real_user_media_runtime_execution_go_no_go_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase204_current_chain_reconciliation_after_phase203_completed_with_warnings_ready_for_real_user_media_runtime_execution_blocker_recheck'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE206-REAL-USER-MEDIA-RUNTIME-EXECUTION-GO-NO-GO-PLAN'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase205-real-user-media-runtime-execution-blocker-recheck-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase205-real-user-media-runtime-execution-blocker-recheck-result',
  },
  state: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase205-current-execution-state-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase205-current-execution-state-register',
  },
  duplicate: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase205-duplicate-avoidance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase205-duplicate-avoidance-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase205-real-user-media-blocker-map.md',
    label: 'worker-runtime-jobs-sound-cpu-phase205-real-user-media-blocker-map',
  },
  selected: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase205-selected-next-gate-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase205-selected-next-gate-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase205-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase205-runtime-claim-policy',
  },
}

const requiredSourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-phase204-current-chain-reconciliation-after-phase203-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection-result.md',
  'docs/worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-closure-after-internal-dry-run.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-review-after-runner-boundary-execution-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-change-after-runner-boundary-execution-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-after-runner-boundary-execution-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase204-current-readiness-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase206-real-user-media-runtime-execution-go-no-go-plan.md',
]

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parse(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoop(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(record.nextAction === 'none', `${label}.nextAction must be none`)
}

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'toolExecutionReady',
    'workerExecutionReady',
    'routeExecutionReady',
    'realUserMediaProcessingReady',
    'mediaProcessingReady',
    'artifactDeliveryReady',
    'supabaseReady',
    'sqlReady',
    'providerModelReady',
    'dockerGcpReady',
    'internalBetaWidened',
    'externalBetaWidened',
    'realUserMediaBetaReady',
    'paidProductionReady',
    'productionReady',
    'runtimeReadinessClaimed',
    'productWideInternalBetaUnlocked',
    'toolExecutionEnabledToday',
    'workerExecutionEnabledToday',
    'routeExecutionEnabledToday',
    'realUserMediaProcessingEnabledToday',
    'mediaProcessingEnabledToday',
    'artifactDeliveryEnabledToday',
    'supabaseMutationEnabledToday',
    'sqlExecutionEnabledToday',
    'providerModelCallEnabledToday',
    'dockerGcpEnabledToday',
    'internalBetaWidenedToday',
    'externalBetaWidenedToday',
    'realUserMediaBetaUnlockedToday',
    'paidProductionUnlockedToday',
    'productionUnlockedToday',
    'phase205MayProcessRealUserMedia',
    'phase205MayExecuteWorkersRoutesTools',
    'mayExecuteInPhase205',
    'mayUnlockBetaInPhase205',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

for (const value of Object.values(files)) assertNoForbiddenTrueClaims(value.path)
for (const file of requiredSourceFiles) read(file)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2323, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'be0140789117ee7b910bcf649e5a8bf1f0df577b', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.recheckResult.ownerPasteWaitRequired === false, 'owner wait widened')
assert(parsed.result.recheckResult.acceptedSoundCpuToolCount === 15, 'accepted tool count mismatch')
assert(parsed.result.recheckResult.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(parsed.result.recheckResult.aliasCoveredToolCount === 2, 'alias count mismatch')
assert(parsed.result.recheckResult.syntheticToolCallProbePassedCount === 15, 'synthetic probe count mismatch')
assert(parsed.result.recheckResult.controlledRuntimeBetaPreflightAccepted === true, 'preflight evidence missing')
assert(parsed.result.recheckResult.boundedExternalBetaScorecardAllowed === true, 'bounded scorecard missing')
assert(parsed.result.recheckResult.realUserMediaBetaAllowed === false, 'real user media beta widened')
assert(parsed.result.recheckResult.closedRuntimeApprovalPlanningGapCount === 8, 'closed planning gap count mismatch')
assert(parsed.result.recheckResult.remainingRuntimeApprovalPlanningGapCount === 0, 'remaining planning gap count mismatch')
assert(parsed.result.recheckResult.actualRuntimeExecutionApprovedToday === false, 'runtime execution widened')
assert(parsed.result.recheckResult.selectedCurrentBlocker === 'real_user_media_runtime_execution_go_no_go_missing', 'selected blocker mismatch')
assert(parsed.result.recheckResult.selectedNextPrompt === nextPrompt, 'selected next prompt mismatch')
assertFalseMap(parsed.result.runtimeGates, 'result.runtimeGates')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.state.decision === decision, 'state decision mismatch')
assert(parsed.state.boundedProofState.acceptedSoundCpuToolCount === 15, 'state tool count mismatch')
assert(parsed.state.boundedProofState.syntheticNoMediaNoArtifactToolCallProofPassed === true, 'state synthetic proof missing')
assert(parsed.state.betaState.boundedInternalBetaMetadataState === 'bounded_internal_testing_enabled_metadata_only', 'internal beta metadata mismatch')
assert(parsed.state.betaState.boundedExternalBetaScorecardAllowed === true, 'state bounded scorecard missing')
assert(parsed.state.betaState.realUserMediaBetaAllowed === false, 'state real user media widened')
assert(parsed.state.runtimeApprovalPlanningState.runtimeApprovalPlanningGapsClosed === 8, 'state planning gap count mismatch')
assert(parsed.state.runtimeApprovalPlanningState.closedForExecution === false, 'state execution widened')
assertFalseMap(parsed.state.executionState, 'state.executionState')

assert(parsed.duplicate.decision === decision, 'duplicate decision mismatch')
assert(parsed.duplicate.duplicateAvoidance.doNotWaitForOwnerPaste === true, 'owner-paste guard missing')
assert(parsed.duplicate.duplicateAvoidance.repoLaneEvidenceIsSourceOfTruth === true, 'repo evidence guard missing')
assert(parsed.duplicate.alreadyRepresentedEvidence.includes('eight_runtime_approval_planning_gaps'), 'planning gaps not represented')
assertFalseMap(parsed.duplicate.blockedActions, 'duplicate.blockedActions')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.blockers.some((entry) => entry.blockerId === 'real_user_media_runtime_execution_go_no_go_missing' && entry.status === 'selected_current_blocker'), 'selected current blocker missing')
assert(parsed.blockers.realUserMediaBetaAllowedToday === false, 'blocker beta widened')
assert(parsed.blockers.phase205MayProcessRealUserMedia === false, 'blocker media widened')
assert(parsed.blockers.phase205MayExecuteWorkersRoutesTools === false, 'blocker execution widened')

assert(parsed.selected.decision === decision, 'selected decision mismatch')
assert(parsed.selected.selectedNextGate.gateId === 'real_user_media_runtime_execution_go_no_go', 'selected gate mismatch')
assert(parsed.selected.selectedNextGate.nextPrompt === nextPrompt, 'selected gate prompt mismatch')
assert(parsed.selected.selectedNextGate.mayExecuteInPhase205 === false, 'selected gate execution widened')
assert(parsed.selected.selectedNextGate.mustStopIfCriticalBlockerFound === true, 'stop guard missing')
assert(parsed.selected.notSelected.some((entry) => entry.gateId === 'owner_evidence_response_collection'), 'owner evidence loop not marked duplicate')

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.allowedClaims.acceptedSoundCpuToolCount === 15, 'claims tool count mismatch')
assert(parsed.claims.allowedClaims.selectedNextPrompt === nextPrompt, 'claims next prompt mismatch')
assertFalseMap(parsed.claims.blockedClaims, 'claims.blockedClaims')
assertNoop(parsed.claims.supabaseClassification, 'claims.supabaseClassification')
assert(read(files.claims.path).includes('No Docker build, Docker push, Docker run'), 'no-scope Docker guard missing')

const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase206-real-user-media-runtime-execution-go-no-go-plan.md')
assert(promptText.includes(decision), 'Phase206 prompt source decision missing')
assert(promptText.includes('No real-user-media read'), 'Phase206 real media guard missing')
assert(promptText.includes('stop with the exact blocker'), 'Phase206 blocker stop language missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase205-real-user-media-runtime-execution-blocker-recheck:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase205-real-user-media-runtime-execution-blocker-recheck-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2323,
      acceptedSoundCpuToolCount: 15,
      boundedInternalBetaMetadataState: 'bounded_internal_testing_enabled_metadata_only',
      boundedExternalBetaScorecardAllowed: true,
      realUserMediaBetaAllowed: false,
      selectedNextPrompt: nextPrompt,
      supabaseUpdateRequired: false,
    },
    null,
    2,
  ),
)
