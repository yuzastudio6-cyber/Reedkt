import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase204_current_chain_reconciliation_after_phase203_completed_with_warnings_ready_for_real_user_media_runtime_execution_blocker_recheck'
const phase203Decision =
  'worker_runtime_jobs_sound_cpu_phase203_current_execution_readiness_blocker_selection_completed_with_warnings_ready_for_product_tool_call_execution_gap_closure'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE205-REAL-USER-MEDIA-RUNTIME-EXECUTION-BLOCKER-RECHECK'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase204-current-chain-reconciliation-after-phase203-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase204-current-chain-reconciliation-after-phase203-result',
  },
  source: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase204-source-evidence-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase204-source-evidence-register',
  },
  duplicate: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase204-product-gap-duplicate-avoidance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase204-product-gap-duplicate-avoidance-register',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase204-current-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase204-current-readiness-register',
  },
  selected: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase204-selected-next-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase204-selected-next-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase204-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase204-runtime-claim-policy',
  },
}

const requiredSourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection-result.md',
  'docs/worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-closure-after-internal-dry-run.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-closure-after-product-tool-call-gap.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-execution.md',
  'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-review-no-real-user-media-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase131-bounded-external-beta-scope-register-no-real-user-media.md',
  'docs/worker-runtime-jobs-sound-cpu-paddleocr-source-readiness-adjustment-after-activation-merge.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation.md',
  'docs/worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck.md',
  'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-owner-review.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase205-real-user-media-runtime-execution-blocker-recheck.md',
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
    'realUserMediaBetaReady',
    'mediaProcessingReady',
    'artifactDeliveryReady',
    'supabaseReady',
    'sqlReady',
    'dockerGcpReady',
    'providerModelReady',
    'runtimeReadiness',
    'paidProductionReady',
    'productionReady',
    'toolExecutionApprovedToday',
    'workerExecutionApprovedToday',
    'routeExecutionApprovedToday',
    'realUserMediaProcessingApprovedToday',
    'mediaProcessingApprovedToday',
    'artifactDeliveryApprovedToday',
    'supabaseSqlApprovedToday',
    'dockerGcpApprovedToday',
    'providerModelCallApprovedToday',
    'paidProductionApprovedToday',
    'productionReadyClaimedToday',
    'productToolCallExecutionRerun',
    'workerRouteExecutionRerun',
    'mediaProcessingRerun',
    'supabaseSqlRerun',
    'externalBetaUnlockWidening',
    'mayProcessRealUserMediaInThisPrompt',
    'mayExecuteWorkersRoutesToolsInThisPrompt',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

for (const value of Object.values(files)) assertNoForbiddenTrueClaims(value.path)
for (const file of requiredSourceFiles) read(file)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2318, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '9ef423492d192286ba484726556b8e04756b860e', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === phase203Decision, 'source decision mismatch')
assert(parsed.result.reconciliationResult.duplicateProductGapClosureCreated === false, 'duplicate product gap created')
assert(parsed.result.reconciliationResult.acceptedSoundCpuToolCount === 15, 'accepted tool count mismatch')
assert(parsed.result.reconciliationResult.boundedExternalBetaScorecardAllowed === true, 'bounded scorecard not recorded')
assert(parsed.result.reconciliationResult.realUserMediaBetaAllowed === false, 'real user media beta widened')
assert(parsed.result.reconciliationResult.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertFalseMap(parsed.result.runtimeGates, 'result.runtimeGates')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.source.decision === decision, 'source register decision mismatch')
assert(parsed.source.sourceEvidence.phase203.decision === phase203Decision, 'source register phase203 mismatch')
assert(parsed.source.sourceEvidence.existingProductGapClosure.present === true, 'existing product gap missing')
assert(parsed.source.sourceEvidence.existingNoRealUserMediaProductProof.acceptedToolCount === 15, 'proof tool count mismatch')
assert(parsed.source.sourceConclusion.productGapNeedsDuplicateClosure === false, 'source register duplicate closure widened')
assert(parsed.source.sourceConclusion.currentBlockedSurface === 'real_user_media_runtime_execution', 'blocked surface mismatch')

assert(parsed.duplicate.decision === decision, 'duplicate decision mismatch')
assert(parsed.duplicate.duplicateAvoidance.doNotCreateDuplicateProductGapClosure === true, 'duplicate guard missing')
assert(parsed.duplicate.duplicateAvoidance.doNotWaitForOwnerPaste === true, 'owner-paste wait guard missing')
assertFalseMap(parsed.duplicate.blockedActions, 'duplicate.blockedActions')

assert(parsed.readiness.decision === decision, 'readiness decision mismatch')
assert(parsed.readiness.liveReadinessSnapshot.prodReadiness.hardBlockers === 47, 'hard blocker count mismatch')
assert(parsed.readiness.liveReadinessSnapshot.prodReadiness.modelWeightBlockers === 7, 'model blocker count mismatch')
assert(parsed.readiness.liveReadinessSnapshot.prodBeta.externalBetaAllowed === true, 'bounded external beta missing')
assert(parsed.readiness.liveReadinessSnapshot.prodBeta.realUserMediaBetaAllowed === false, 'real user media beta widened')
assert(parsed.readiness.soundCpuExecutionState.acceptedSoundCpuToolCount === 15, 'sound CPU tool count mismatch')
assert(parsed.readiness.soundCpuExecutionState.realUserMediaRuntimeExecutionReady === false, 'real media execution widened')
assert(parsed.readiness.readinessConclusion.nextPrompt === nextPrompt, 'readiness next prompt mismatch')

assert(parsed.selected.decision === decision, 'selected decision mismatch')
assert(parsed.selected.selectedNextBlocker.blockerId === 'real_user_media_runtime_execution_blocker', 'selected blocker mismatch')
assert(parsed.selected.selectedNextBlocker.nextPrompt === nextPrompt, 'selected next prompt mismatch')
assert(parsed.selected.selectedNextBlocker.mayProcessRealUserMediaInThisPrompt === false, 'selected prompt media widened')
assert(parsed.selected.selectedNextBlocker.mustStopIfCriticalBlockerFound === true, 'stop guard missing')
assert(parsed.selected.notSelected.some((entry) => entry.blockerId === 'product_tool_call_execution_readiness_gap'), 'product gap not-selected record missing')

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.allowedClaims.phase203Reconciled === true, 'phase203 allowed claim missing')
assert(parsed.claims.allowedClaims.acceptedSoundCpuToolCount === 15, 'claims tool count mismatch')
assertFalseMap(parsed.claims.blockedClaims, 'claims.blockedClaims')
assertNoop(parsed.claims.supabaseClassification, 'claims.supabaseClassification')
assert(read(files.claims.path).includes('No Docker build, Docker push, Docker run'), 'no-scope Docker guard missing')

const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase205-real-user-media-runtime-execution-blocker-recheck.md')
assert(promptText.includes(decision), 'Phase205 prompt source decision missing')
assert(promptText.includes('must not process real user media'), 'Phase205 real media guard missing')
assert(promptText.includes('Stop if the blocker requires media processing'), 'Phase205 stop guard missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase204-current-chain-reconciliation-after-phase203:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase204-current-chain-reconciliation-after-phase203-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2318,
      acceptedSoundCpuToolCount: 15,
      duplicateProductGapClosureCreated: false,
      boundedExternalBetaScorecardAllowed: true,
      realUserMediaBetaAllowed: false,
      selectedNextPrompt: nextPrompt,
      supabaseUpdateRequired: false,
    },
    null,
    2,
  ),
)
