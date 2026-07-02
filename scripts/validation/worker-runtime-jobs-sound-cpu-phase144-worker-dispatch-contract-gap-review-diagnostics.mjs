import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase143_disabled_route_request_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_gap_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase144_worker_dispatch_contract_gap_review_completed_with_warnings_ready_for_dispatch_source_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase145_dispatch_contract_source_plan_completed_with_warnings_ready_for_dispatch_source_owner_review'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-review-result.md',
  handoff: 'docs/worker-runtime-jobs-sound-cpu-phase143-worker-dispatch-gap-handoff.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review-result.md',
  gapRegister: 'docs/worker-runtime-jobs-sound-cpu-phase144-dispatch-contract-gap-register.md',
  readinessMap: 'docs/worker-runtime-jobs-sound-cpu-phase144-dispatch-source-readiness-map.md',
  blockerFix: 'docs/worker-runtime-jobs-sound-cpu-phase144-blocker-fix-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase144-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan.md',
  packageJson: 'package.json',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const match = read(file).match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoop(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'dispatchImplementationMayProceed',
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'workerClaimLeaseMutationEnabled',
    'allowWorkerDispatchExecution',
    'allowRouteExecutionEnablement',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'executionReady',
    'sourceCreationReady',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-review-result'),
  handoff: parseJsonBlock(docs.handoff, 'worker-runtime-jobs-sound-cpu-phase143-worker-dispatch-gap-handoff'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review-result'),
  gapRegister: parseJsonBlock(docs.gapRegister, 'worker-runtime-jobs-sound-cpu-phase144-dispatch-contract-gap-register'),
  readinessMap: parseJsonBlock(docs.readinessMap, 'worker-runtime-jobs-sound-cpu-phase144-dispatch-source-readiness-map'),
  blockerFix: parseJsonBlock(docs.blockerFix, 'worker-runtime-jobs-sound-cpu-phase144-blocker-fix-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase144-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReviewResult.workerDispatchContractGapReviewMayProceed === true, 'source gap review not allowed')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.handoff.nextGate === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE144-WORKER-DISPATCH-CONTRACT-GAP-REVIEW', 'handoff next gate mismatch')
assert(parsed.handoff.nextExpectedDecision.includes('phase144_worker_dispatch_contract_gap_review'), 'handoff expected decision mismatch')
assert(parsed.handoff.executionAllowedInNextGate === false, 'handoff execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source decision mismatch')
assert(parsed.prompt.reviewScope.inspectWorkerDispatchContractsOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.allowWorkerDispatchExecution === false, 'prompt worker execution widened')
assertNoop(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2161, 'result source PR mismatch')
assert(parsed.result.sourceVerification.diagnosticsFixPr === 2163, 'diagnostics fix PR mismatch')
assert(parsed.result.reviewResult.phase143DisabledRouteProofAccepted === true, 'Phase143 proof not accepted')
assert(parsed.result.reviewResult.dispatchSourcePlanMayProceed === true, 'dispatch source plan not unblocked')
assert(parsed.result.reviewResult.dispatchImplementationMayProceed === false, 'dispatch implementation widened')
assert(parsed.result.reviewResult.workerDispatchExecutionEnabled === false, 'worker dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.gapRegister.closedInputs.includes('disabled_post_get_return_409'), 'disabled route proof input missing')
assert(parsed.gapRegister.remainingGaps.some((gap) => gap.id === 'dispatch_source_contract_missing'), 'dispatch source gap missing')
assert(parsed.gapRegister.remainingGaps.some((gap) => gap.id === 'worker_job_persistence_boundary_missing'), 'job persistence gap missing')
assert(parsed.gapRegister.executionEnabled === false, 'gap register execution widened')

for (const field of [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'imageName',
  'jobType',
  'privateManifestRef',
]) {
  assert(parsed.readinessMap.requiredDispatchContractFields.includes(field), `missing dispatch field ${field}`)
}
assert(parsed.readinessMap.sourcePlanReady === true, 'source plan should be ready')
assert(parsed.readinessMap.sourceCreationReady === false, 'source creation widened')
assert(parsed.readinessMap.executionReady === false, 'execution widened')

assert(parsed.blockerFix.noFixBlockerFound === true, 'unexpected fix blocker')
assert(parsed.blockerFix.allowedNextAction === 'dispatch_contract_source_plan_only', 'next action mismatch')
assert(parsed.blockerFix.mustRemainBlocked.includes('worker_dispatch_execution'), 'dispatch blocker missing')

assert(parsed.claimPolicy.allowedClaims.workerDispatchContractGapReviewed === true, 'allowed claim missing')
assert(parsed.claimPolicy.allowedClaims.dispatchSourcePlanMayProceed === true, 'source plan claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.nextPrompt.reviewScope.planSourceOnly === true, 'next prompt scope mismatch')
assert(parsed.nextPrompt.reviewScope.allowWorkerDispatchExecution === false, 'next prompt worker widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase144-worker-dispatch-contract-gap-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2161,
      dispatchSourcePlanMayProceed: true,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE145-DISPATCH-CONTRACT-SOURCE-PLAN',
    },
    null,
    2,
  ),
)
