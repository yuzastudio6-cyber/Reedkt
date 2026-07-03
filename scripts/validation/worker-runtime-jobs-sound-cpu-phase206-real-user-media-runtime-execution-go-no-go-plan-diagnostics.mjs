import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase206_real_user_media_runtime_execution_go_no_go_plan_completed_with_warnings_ready_for_selected_execution_or_blocker_gate'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase205_real_user_media_runtime_execution_blocker_recheck_completed_with_warnings_ready_for_real_user_media_runtime_execution_go_no_go_plan'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE207-CONTROLLED-PRIVATE-FIXTURE-REAL-USER-MEDIA-RUNTIME-EXECUTION-PROOF'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase206-real-user-media-runtime-execution-go-no-go-plan-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase206-real-user-media-runtime-execution-go-no-go-plan-result',
  },
  source: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase206-source-evidence-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase206-source-evidence-register',
  },
  decision: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase206-go-no-go-decision-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase206-go-no-go-decision-register',
  },
  stops: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase206-phase207-stop-conditions-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase206-phase207-stop-conditions-register',
  },
  selected: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase206-selected-next-gate-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase206-selected-next-gate-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase206-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase206-runtime-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-phase205-real-user-media-runtime-execution-blocker-recheck-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase205-current-execution-state-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase205-real-user-media-blocker-map.md',
  'docs/worker-runtime-jobs-sound-cpu-phase205-selected-next-gate-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase204-current-chain-reconciliation-after-phase203-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase207-controlled-private-fixture-real-user-media-runtime-execution-proof.md',
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
    'phase206RunsProof',
    'phase206ReadsRealUserMedia',
    'phase206ExecutesToolsWorkersOrRoutes',
    'phase206CreatesArtifacts',
    'phase206TouchesSupabase',
    'phase206WidensBeta',
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
    'realUserMediaRead',
    'mediaProcessing',
    'toolExecution',
    'workerExecution',
    'routeExecution',
    'artifactCreation',
    'supabaseMutation',
    'sqlExecution',
    'storageTransfer',
    'signedUrlCreation',
    'publicArtifactCreation',
    'providerModelCall',
    'dockerGcpAction',
    'betaUnlock',
    'productionUnlock',
    'phase206MayExecute',
    'phase206MayUnlockBeta',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

for (const value of Object.values(files)) assertNoForbiddenTrueClaims(value.path)
for (const file of sourceFiles) read(file)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2329, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '8eb37a0b812cc7aff50e31ac0505fc06432e812f', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.sourceVerification.repoLaneEvidenceUsedInsteadOfOwnerPaste === true, 'owner paste loop reopened')
assert(parsed.result.goNoGoResult.selectedOutcome === 'go_to_later_controlled_private_fixture_real_user_media_runtime_execution_proof', 'selected outcome mismatch')
assert(parsed.result.goNoGoResult.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assert(parsed.result.goNoGoResult.whyNotBeta.includes('Real-user-media beta'), 'beta guard explanation missing')
assert(parsed.result.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.result.acceptedEvidence.syntheticToolCallProbePassedCount === 15, 'probe count mismatch')
assert(parsed.result.acceptedEvidence.runtimeApprovalPlanningGapsClosedForPlanning === 8, 'planning gap count mismatch')
assert(parsed.result.acceptedEvidence.runtimeApprovalPlanningGapsClosedForExecution === 0, 'execution gap widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.source.decision === decision, 'source decision mismatch')
assert(parsed.source.sourceChain.phase205Pr === 2329, 'phase205 PR mismatch')
assert(parsed.source.sourceChain.phase205MergeCommit === '8eb37a0b812cc7aff50e31ac0505fc06432e812f', 'phase205 merge mismatch')
assert(parsed.source.evidenceReconciled.productBetaReadinessPlanning === 'closed_for_planning_only', 'product beta evidence widened')
assert(parsed.source.duplicateAvoidance.ownerPasteWaitRequired === false, 'owner wait widened')
assert(parsed.source.duplicateAvoidance.samePurposeOpenPrObserved === 'none_before_phase206_worktree_creation', 'duplicate check missing')

assert(parsed.decision.decision === decision, 'go/no-go register decision mismatch')
assert(parsed.decision.goNoGoDecision.decisionType === 'go_to_later_controlled_proof_prompt', 'decision type mismatch')
assert(parsed.decision.goNoGoDecision.selectedNextPrompt === nextPrompt, 'decision next prompt mismatch')
assert(parsed.decision.goNoGoDecision.stillForbiddenInPhase206.includes('real-user-media read'), 'phase206 real-media ban missing')
assert(parsed.decision.whyNotStopToday.nextPromptHasHardStopConditions === true, 'stop-condition rationale missing')
assert(parsed.decision.whyExecutionStillNotReadyToday.phase206IsPlanningOnly === true, 'planning-only rationale missing')

assert(parsed.stops.decision === decision, 'stops decision mismatch')
assert(parsed.stops.phase207MustStopIf.length === 9, 'stop condition count mismatch')
assert(parsed.stops.phase207MustStopIf.some((item) => item.blockerId === 'approved_private_fixture_missing'), 'fixture stop missing')
assert(parsed.stops.phase207MustStopIf.some((item) => item.blockerId === 'supabase_or_storage_required'), 'supabase stop missing')
assert(parsed.stops.phase207FailureClassifications.includes('worker_runtime_jobs_sound_cpu_phase207_blocked_private_fixture_missing'), 'fixture classification missing')
assert(parsed.stops.phase207FailureClassifications.includes('worker_runtime_jobs_sound_cpu_phase207_controlled_private_fixture_proof_failed'), 'proof failed classification missing')

assert(parsed.selected.decision === decision, 'selected decision mismatch')
assert(parsed.selected.selectedNextGate.gateId === 'controlled_private_fixture_real_user_media_runtime_execution_proof', 'selected gate mismatch')
assert(parsed.selected.selectedNextGate.nextPrompt === nextPrompt, 'selected gate prompt mismatch')
assert(parsed.selected.selectedNextGate.phase206MayProceed === true, 'phase206 proceed flag missing')
assert(parsed.selected.selectedNextGate.phase206MayExecute === false, 'phase206 execution widened')
assert(parsed.selected.selectedNextGate.phase207MustStopIfCriticalBlockerFound === true, 'phase207 stop guard missing')
assert(parsed.selected.notSelected.some((entry) => entry.gateId === 'real_user_media_beta_unlock'), 'beta not-selected guard missing')

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.allowedClaims.acceptedSoundCpuToolCount === 15, 'claims tool count mismatch')
assert(parsed.claims.allowedClaims.phase207ControlledProofMayBePlanned === true, 'phase207 planning claim missing')
assertFalseMap(parsed.claims.blockedClaims, 'claims.blockedClaims')
assertFalseMap(parsed.claims.phase206RuntimeActions, 'claims.phase206RuntimeActions')
assertNoop(parsed.claims.supabaseClassification, 'claims.supabaseClassification')
assert(read(files.claims.path).includes('real-user-media read'), 'no-scope real-user-media guard missing')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase207-controlled-private-fixture-real-user-media-runtime-execution-proof.md')
assert(prompt.includes(sourceDecision) || prompt.includes(decision), 'Phase207 source decision missing')
assert(prompt.includes('Required preflight'), 'Phase207 preflight missing')
assert(prompt.includes('Mandatory stop classifications'), 'Phase207 stop classifications missing')
assert(prompt.includes('No Supabase mutation'), 'Phase207 no-scope missing')
assert(prompt.includes('one controlled local private-fixture'), 'Phase207 controlled proof scope missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase206-real-user-media-runtime-execution-go-no-go-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase206-real-user-media-runtime-execution-go-no-go-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2329,
      selectedNextPrompt: nextPrompt,
      acceptedSoundCpuToolCount: 15,
      phase206ExecutesRuntime: false,
      phase207StopConditions: parsed.stops.phase207MustStopIf.length,
      supabaseUpdateRequired: false,
    },
    null,
    2,
  ),
)
