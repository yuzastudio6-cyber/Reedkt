import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase154_dispatch_contract_index_export_static_validation_passed_with_warnings_ready_for_index_export_owner_validation_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase155_dispatch_contract_index_export_owner_validation_review_passed_with_warnings_ready_for_disabled_dispatch_route_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase156_disabled_dispatch_route_plan_completed_with_warnings_ready_for_disabled_dispatch_route_owner_review'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation-result.md',
  sourceOutput: 'docs/worker-runtime-jobs-sound-cpu-phase154-static-import-proof-output.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase155-static-validation-owner-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase155-disabled-dispatch-route-plan-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase155-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase155-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-plan.md',
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
    'workerDispatchExecutionEnabled',
    'claimLeaseMutationEnabled',
    'routeExecutionEnabled',
    'toolExecutionEnabled',
    'providerCallEnabled',
    'modelCallEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'dockerBuildEnabled',
    'dockerPushEnabled',
    'dockerRunEnabled',
    'gcpCloudRunEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'allowRouteSourceChange',
    'allowWorkerDispatchExecution',
    'allowRouteExecution',
    'allowClaimLeaseMutation',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation-result'),
  sourceOutput: parseJsonBlock(docs.sourceOutput, 'worker-runtime-jobs-sound-cpu-phase154-static-import-proof-output'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase155-static-validation-owner-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase155-disabled-dispatch-route-plan-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase155-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase155-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.validationResult.staticIndexImportSucceeded === true, 'static import source missing')
assert(parsed.source.validationResult.acceptedForDispatch === false, 'source dispatch accepted')
assert(parsed.source.validationResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceOutput.decision === sourceDecision, 'source output decision mismatch')
assert(parsed.sourceOutput.blockedPayloadRejected === true, 'source output blocked payload not rejected')
assert(parsed.sourceOutput.acceptedForDispatch === false, 'source output dispatch accepted')
assert(parsed.sourceOutput.noWorkerExecution === true, 'source output worker execution not blocked')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowWorkerDispatchExecution === false, 'source prompt dispatch widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2187, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '22aecd89a8aa4140fa48fa643e182923af9de421', 'source merge mismatch')
assert(parsed.result.ownerReviewResult.staticIndexImportAccepted === true, 'static import not accepted')
assert(parsed.result.ownerReviewResult.disabledDispatchRoutePlanningMayProceed === true, 'disabled route planning not allowed')
assert(parsed.result.ownerReviewResult.disabledEnvelopeAcceptedForDispatch === false, 'dispatch accepted')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForDisabledRoutePlanning === true, 'disabled route planning not accepted')
assert(parsed.acceptance.acceptedForWorkerDispatchExecutionToday === false, 'worker execution accepted')
assert(parsed.acceptance.acceptedForRouteExecutionToday === false, 'route execution accepted')
assert(parsed.acceptance.acceptedForClaimLeaseMutationToday === false, 'claim mutation accepted')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.disabledRoutePlanningMayProceed === true, 'route planning readiness missing')
assert(parsed.readiness.plannedOnlyRouteSurface.mustReturnDisabledEnvelope === true, 'disabled envelope requirement missing')
assert(parsed.readiness.stillForbidden.includes('worker_dispatch_execution'), 'worker dispatch blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')

assert(parsed.claimPolicy.allowedClaims.staticIndexImportAccepted === true, 'allowed static claim missing')
assert(parsed.claimPolicy.allowedClaims.disabledDispatchRoutePlanningMayProceed === true, 'allowed route plan claim missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForDispatch === false, 'acceptedForDispatch claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowDisabledRoutePlan === true, 'next prompt route plan missing')
assert(parsed.nextPrompt.planningScope.allowRouteSourceChange === false, 'next prompt source widened')
assert(parsed.nextPrompt.planningScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2187,
      staticIndexImportAccepted: true,
      disabledDispatchRoutePlanningMayProceed: true,
      acceptedForDispatch: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE156-DISABLED-DISPATCH-ROUTE-PLAN',
    },
    null,
    2,
  ),
)
