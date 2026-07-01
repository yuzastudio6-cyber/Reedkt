import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_owner_review_passed_with_warnings_ready_for_external_agent_execution_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase108_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_owner_review_no_execution'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE108-EXTERNAL-AGENT-EXECUTION-OWNER-REVIEW'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-review-result.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-plan-result.md',
  surface: 'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-surface-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-blocked-effects-register.md',
  requirements: 'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-proof-requirements.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-review.md',
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
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-plan-result',
  ),
  surface: parseJsonBlock(
    docs.surface,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-surface-register',
  ),
  blocked: parseJsonBlock(
    docs.blocked,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-blocked-effects-register',
  ),
  requirements: parseJsonBlock(
    docs.requirements,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-proof-requirements',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReview.externalAgentExecutionPlanMayProceed === true, 'source plan permission missing')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source execution readiness widened')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2051, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '4732ed44b47245bfada6e2b46a3adb7594b7c719', 'source merge mismatch')
assert(parsed.result.planResult.externalAgentExecutionSurfacePlanned === true, 'surface plan missing')
assert(parsed.result.planResult.acceptedToolCount === 15, 'tool count mismatch')
for (const key of [
  'externalAgentExecutionToday',
  'workerDispatchToday',
  'factoryCallToday',
  'manifestPersistenceToday',
  'supabaseMutationToday',
  'mediaOpenToday',
]) {
  assert(parsed.result.planResult[key] === false, `${key} widened`)
}
assert(parsed.result.soundCpuTools.covered === 15, 'sound tools coverage mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution readiness must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.surface.plannedSurface.allowedToolCount === 15, 'surface tool count mismatch')
assert(parsed.surface.requiredInputEnvelope.includes('runtimeFlags'), 'runtime flags input missing')
assert(parsed.surface.runtimeFlagsMustBeFalse.includes('allowWorkerDispatch'), 'worker dispatch flag missing')

for (const value of Object.values(parsed.blocked.blockedEffects)) {
  assert(value === true, 'blocked effect must remain true')
}

assert(parsed.requirements.futureProofRequirements.requiresOwnerReviewBeforeProof === true, 'owner review before proof missing')
assert(parsed.requirements.futureProofRequirements.requiresNoMediaOpen === true, 'no media proof requirement missing')
assert(parsed.requirements.expectedFirstProofResultIfSuccessful.toolCountCovered === 15, 'expected proof tool count mismatch')
assert(parsed.requirements.expectedFirstProofResultIfSuccessful.workerDispatched === false, 'expected proof worker dispatch widened')

assert(parsed.policy.claimPolicy.externalAgentExecutionSurfacePlannedClaimed === true, 'surface planned claim missing')
assert(parsed.policy.claimPolicy.externalAgentExecutionReadyClaimed === false, 'external agent readiness widened')
assert(parsed.policy.nextGateMayReviewExternalAgentExecutionPlan === true, 'next review missing')
assert(parsed.policy.nextGateMayRunExternalAgent === false, 'next run widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewExternalAgentExecutionPlanOnly === true, 'review scope missing')
assert(parsed.next.reviewScope.allowControlledExternalAgentProofNext === true, 'controlled proof next missing')
assert(parsed.next.reviewScope.allowExternalAgentExecutionToday === false, 'external agent today widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2051,
      externalAgentExecutionSurfacePlanned: true,
      controlledProofNextMayBeReviewed: true,
      readyForRealExecutionToday: 0,
      soundCpuToolsCovered: 15,
      nextPrompt,
    },
    null,
    2,
  ),
)
