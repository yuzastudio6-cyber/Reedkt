import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase155_dispatch_contract_index_export_owner_validation_review_passed_with_warnings_ready_for_disabled_dispatch_route_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase156_disabled_dispatch_route_plan_completed_with_warnings_ready_for_disabled_dispatch_route_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase157_disabled_dispatch_route_owner_review_passed_with_warnings_ready_for_disabled_dispatch_route_source_creation_plan'
const futureRoutePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-plan-result.md',
  routePlan: 'docs/worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-contract-plan.md',
  payload: 'docs/worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-payload-response-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-source-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase156-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase156-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase157-disabled-dispatch-route-owner-review.md',
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
    'routeSourceCreated',
    'routeRegistered',
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
    'allowRouteRegistration',
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

function phase159RouteSourceEvidenceExists() {
  const file = 'docs/worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-result.md'
  if (!fs.existsSync(path.join(process.cwd(), file))) return false

  const evidence = parseJsonBlock(
    file,
    'worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-result',
  )
  return (
    evidence.decision ===
      'worker_runtime_jobs_sound_cpu_phase159_actual_disabled_dispatch_route_source_creation_completed_with_warnings_ready_for_disabled_route_static_validation' &&
    evidence.sourceChange?.routeSourceCreated === true &&
    evidence.sourceChange?.routeRegisteredToday === false &&
    evidence.sourceChange?.workerDispatchExecutionEnabled === false
  )
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-plan-result'),
  routePlan: parseJsonBlock(docs.routePlan, 'worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-contract-plan'),
  payload: parseJsonBlock(docs.payload, 'worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-payload-response-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-source-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase156-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase156-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase157-disabled-dispatch-route-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(
  !fs.existsSync(path.join(process.cwd(), futureRoutePath)) || phase159RouteSourceEvidenceExists(),
  'future route source must not exist before Phase159 evidence',
)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReviewResult.disabledDispatchRoutePlanningMayProceed === true, 'source route planning not accepted')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowDisabledRoutePlan === true, 'disabled route plan not allowed')
assert(parsed.sourcePrompt.planningScope.allowRouteSourceChange === false, 'source route change widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2188, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'e57361301c9b38f43e047b5b41a8866754c2249f', 'source merge mismatch')
assert(parsed.result.planResult.disabledDispatchRoutePlanned === true, 'route plan not recorded')
assert(parsed.result.planResult.routeSourceCreated === false, 'route source created unexpectedly')
assert(parsed.result.planResult.routeRegistered === false, 'route registered unexpectedly')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.routePlan.futureRoutePath === futureRoutePath, 'future route path mismatch')
assert(parsed.routePlan.routeBehavior.mustReturnAcceptedForDispatch === false, 'route plan accepts dispatch')
assert(parsed.routePlan.routeBehavior.mustNotCallWorkers === true, 'route plan worker call blocker missing')
assert(parsed.routePlan.routeSourceCreatedToday === false, 'route source created today')
assert(parsed.routePlan.routeRegistrationCreatedToday === false, 'route registration created today')

assert(parsed.payload.requiredDisabledResponse.acceptedForDispatch === false, 'payload response accepts dispatch')
assert(parsed.payload.requiredDisabledResponse.noWorkerExecution === true, 'worker execution not blocked')
assert(parsed.payload.requiredDisabledResponse.noRouteExecution === true, 'route execution not blocked')
assert(parsed.payload.requiredDisabledResponse.noSupabaseMutation === true, 'Supabase mutation not blocked')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.routeOwnerReviewMayProceed === true, 'owner review not ready')
assert(parsed.readiness.futureSourceCreationRequiresOwnerReview === true, 'owner review requirement missing')
assert(parsed.readiness.sourceCreatedToday === false, 'source created today')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')

assert(parsed.claimPolicy.allowedClaims.disabledDispatchRoutePlanned === true, 'allowed route plan claim missing')
assert(parsed.claimPolicy.allowedClaims.routeSourceCreated === false, 'route source allowed claim widened')
assert(parsed.claimPolicy.allowedClaims.routeRegistered === false, 'route registered allowed claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowDisabledRoutePlanReview === true, 'next prompt owner review missing')
assert(parsed.nextPrompt.reviewScope.allowRouteSourceChange === false, 'next prompt source widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase156-disabled-dispatch-route-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2188,
      disabledDispatchRoutePlanned: true,
      routeSourceCreated: false,
      routeRegistered: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE157-DISABLED-DISPATCH-ROUTE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
