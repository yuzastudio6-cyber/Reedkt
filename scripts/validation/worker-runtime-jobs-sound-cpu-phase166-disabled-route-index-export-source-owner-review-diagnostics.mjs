import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase165_disabled_route_index_export_static_validation_passed_with_warnings_ready_for_index_export_source_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase166_disabled_route_index_export_source_owner_review_passed_with_warnings_ready_for_disabled_route_registration_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase167_disabled_route_registration_plan_completed_with_warnings_ready_for_disabled_route_registration_owner_review'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation-result.md',
  sourceOutput: 'docs/worker-runtime-jobs-sound-cpu-phase165-static-index-import-proof-output.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase166-disabled-route-index-export-source-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase166-disabled-route-index-export-source-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase166-index-export-owner-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase166-route-registration-plan-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase166-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase166-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase167-disabled-route-registration-plan.md',
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
    'routeRegistrationSourceChangeMade',
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
    'allowRouteRegistrationSourceChange',
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

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation-result'),
  sourceOutput: parseJsonBlock(docs.sourceOutput, 'worker-runtime-jobs-sound-cpu-phase165-static-index-import-proof-output'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase166-disabled-route-index-export-source-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase166-disabled-route-index-export-source-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase166-index-export-owner-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase166-route-registration-plan-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase166-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase166-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase167-disabled-route-registration-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexText = read(indexPath)
const routeSource = read(routePath)
assert(indexText.includes("from './disabled-dispatch-route.ts'"), 'index export missing disabled route source')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2205, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'b53203a03b41f1e7b4bbf526650faab8d5f5bc17', 'source merge mismatch')
assert(parsed.source.validationResult.staticIndexImportSucceeded === true, 'source static index import failed')
assert(parsed.source.validationResult.safePayloadAcceptedForDispatch === false, 'source accepted dispatch')
assert(parsed.source.validationResult.blockedPayloadRejected === true, 'source blocked payload missing')
assert(parsed.source.validationResult.routeRegisteredToday === false, 'source route registered')
assert(parsed.source.validationResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceOutput.decision === sourceDecision, 'source output decision mismatch')
assert(parsed.sourceOutput.staticIndexImportSucceeded === true, 'source output import failed')
assert(parsed.sourceOutput.safePayloadAcceptedForDispatch === false, 'source output accepted dispatch')
assert(parsed.sourceOutput.noWorkerExecution === true, 'source output worker execution not blocked')
assert(parsed.sourceOutput.noRouteExecution === true, 'source output route execution not blocked')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowRouteRegistrationPlanning === true, 'source prompt route planning missing')
assert(parsed.sourcePrompt.reviewScope.allowRouteRegistrationSourceChange === false, 'source prompt route source widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2209, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '1420374c04cbaa7518127f048fa03857f9859c24', 'result source merge mismatch')
assert(parsed.result.ownerReviewResult.indexExportStaticValidationAccepted === true, 'static validation not accepted')
assert(parsed.result.ownerReviewResult.routeRegistrationPlanningMayProceed === true, 'route planning not allowed')
assert(parsed.result.ownerReviewResult.safePayloadAcceptedForDispatch === false, 'owner accepted dispatch')
assert(parsed.result.ownerReviewResult.routeRegisteredToday === false, 'owner route registered')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'owner dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'owner route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForRouteRegistrationPlanning === true, 'route registration planning not accepted')
assert(parsed.acceptance.acceptedForRouteRegistrationSourceChangeToday === false, 'route registration source accepted')
assert(parsed.acceptance.acceptedForRouteRegistrationToday === false, 'route registration accepted')
assert(parsed.acceptance.acceptedForWorkerDispatchExecutionToday === false, 'worker dispatch accepted')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.routeRegistrationPlanningMayProceed === true, 'route registration readiness missing')
assert(parsed.readiness.plannedOnlyRouteRegistrationSurface.mustPreserveAcceptedForDispatchFalse === true, 'fail-closed requirement missing')
assert(parsed.readiness.stillForbidden.includes('route_registration_source_change'), 'source change blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.indexExportStaticValidationAccepted === true, 'static validation claim missing')
assert(parsed.claimPolicy.allowedClaims.routeRegistrationPlanningMayProceed === true, 'route planning claim missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForDispatch === false, 'accepted dispatch claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowRouteRegistrationPlan === true, 'next prompt route plan missing')
assert(parsed.nextPrompt.planningScope.allowRouteRegistrationSourceChange === false, 'next prompt source change widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase166-disabled-route-index-export-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase166-disabled-route-index-export-source-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2209,
      indexExportStaticValidationAccepted: true,
      routeRegistrationPlanningMayProceed: true,
      routeRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE167-DISABLED-ROUTE-REGISTRATION-PLAN',
    },
    null,
    2,
  ),
)
