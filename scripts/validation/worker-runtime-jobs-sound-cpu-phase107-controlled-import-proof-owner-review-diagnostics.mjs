import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_retry_passed_with_warnings_ready_for_controlled_import_proof_owner_review_no_external_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_owner_review_passed_with_warnings_ready_for_external_agent_execution_plan_no_execution'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE108-EXTERNAL-AGENT-EXECUTION-PLAN'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-result.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-acceptance-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-plan.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoOpClassification(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowExternalAgentExecutionToday',
    'allowWorkerDispatchToday',
    'allowFactoryCallToday',
    'allowManifestPersistenceToday',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'openMediaFileToday',
    'unlockBetaToday',
    'unlockProductionToday',
    'externalAgentExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'realUserMediaBetaReadyClaimed',
    'productionReadinessClaimed',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-acceptance-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.proofResult.ok === true, 'source proof not ok')
assert(parsed.source.readinessBoundary.externalAgentExecutionReadyToday === false, 'source external agent widened')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2050, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '129efe4328a6b1ac3e9e00effb75a4fc43cf6189', 'source merge mismatch')
assert(parsed.result.ownerReview.controlledImportProofAccepted === true, 'proof not accepted')
assert(parsed.result.ownerReview.externalAgentExecutionPlanMayProceed === true, 'external plan not allowed')
for (const key of [
  'acceptedForExternalAgentExecutionToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForFactoryCallToday',
  'acceptedForManifestPersistenceToday',
  'acceptedForSupabaseMutationToday',
  'acceptedForSqlExecutionToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
]) {
  assert(parsed.result.ownerReview[key] === false, `${key} widened`)
}
assert(parsed.result.soundCpuTools.covered === 15, 'tool coverage mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution readiness must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedEvidence.controlledImportProofPassed === true, 'accepted proof missing')
assert(parsed.acceptance.acceptedForPlanningOnly.externalAgentExecutionPlan === true, 'planning acceptance missing')
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'notAcceptedForToday must remain true')
}

assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker readiness widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker tools widened')
assert(parsed.blockers.remainingBlockers.includes('external_agent_execution_plan_required'), 'external plan blocker missing')

assert(parsed.policy.claimPolicy.controlledImportProofAcceptedClaimed === true, 'proof accepted claim missing')
assert(parsed.policy.claimPolicy.externalAgentExecutionPlanMayProceedClaimed === true, 'plan claim missing')
assert(parsed.policy.claimPolicy.externalAgentExecutionReadyClaimed === false, 'external agent readiness widened')
assert(parsed.policy.nextGateMayPlanExternalAgentExecution === true, 'next plan missing')
assert(parsed.policy.nextGateMayRunExternalAgent === false, 'next run widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.planningScope.planExternalAgentExecutionSurface === true, 'plan scope missing')
assert(parsed.next.planningScope.allowExternalAgentExecutionToday === false, 'next external agent widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2050,
      controlledImportProofAccepted: true,
      externalAgentExecutionPlanMayProceed: true,
      readyForRealExecutionToday: 0,
      soundCpuToolsCovered: 15,
      nextPrompt,
    },
    null,
    2,
  ),
)
