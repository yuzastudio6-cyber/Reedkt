import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase166_disabled_route_index_export_source_owner_review_passed_with_warnings_ready_for_disabled_route_registration_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase167_disabled_route_registration_plan_completed_with_warnings_ready_for_disabled_route_registration_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase168_disabled_route_registration_owner_review_passed_with_warnings_ready_for_actual_disabled_route_registration_source_creation'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase166-disabled-route-index-export-source-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase167-disabled-route-registration-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase167-disabled-route-registration-plan-result.md',
  candidate: 'docs/worker-runtime-jobs-sound-cpu-phase167-registration-candidate-register.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase167-registration-safety-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase167-registration-owner-review-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase167-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase167-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase168-disabled-route-registration-owner-review.md',
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
    'registrySourceCreated',
    'registrySourceCreatedToday',
    'registrySourceChangeMade',
    'existingAdjacentExpressRouteMutated',
    'existingAdjacentExpressRouteMutatedToday',
    'expressRouteRegistered',
    'appRouteRegisteredToday',
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
    'allowRegistrySourceChangeToday',
    'allowExistingExpressRouteMutation',
    'allowExpressRouteRegistration',
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
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase166-disabled-route-index-export-source-owner-review-result',
  ),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase167-disabled-route-registration-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase167-disabled-route-registration-plan-result'),
  candidate: parseJsonBlock(docs.candidate, 'worker-runtime-jobs-sound-cpu-phase167-registration-candidate-register'),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase167-registration-safety-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase167-registration-owner-review-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase167-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase167-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase168-disabled-route-registration-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexText = read(indexPath)
const routeSource = read(routePath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)
assert(indexText.includes("from './disabled-dispatch-route.ts'"), 'index export missing disabled route source')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(routeSource.includes('assertSoundCpuDisabledDispatchRouteExecutionBlocked'), 'blocked assertion missing')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')
assert(!fs.existsSync(path.join(process.cwd(), registryPath)), 'registry source must not exist in planning phase')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2209, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '1420374c04cbaa7518127f048fa03857f9859c24', 'source merge mismatch')
assert(parsed.source.ownerReviewResult.indexExportStaticValidationAccepted === true, 'source static validation not accepted')
assert(parsed.source.ownerReviewResult.routeRegistrationPlanningMayProceed === true, 'source route planning not allowed')
assert(parsed.source.ownerReviewResult.routeRegisteredToday === false, 'source route registered')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.ownerReviewResult.routeExecutionEnabled === false, 'source route execution widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowRouteRegistrationPlan === true, 'source prompt route plan missing')
assert(parsed.sourcePrompt.planningScope.allowRouteRegistrationSourceChange === false, 'source prompt source change widened')
assert(parsed.sourcePrompt.planningScope.allowRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.planningScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2210, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '9755755f946aac5f7dab485564a46cc6fe3e90ed', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.disabledRouteRegistrationPlanned === true, 'registration plan missing')
assert(parsed.result.planResult.candidateRegistryPath === registryPath, 'candidate registry path mismatch')
assert(parsed.result.planResult.candidateIndexPath === indexPath, 'candidate index mismatch')
assert(parsed.result.planResult.candidateRoutePath === routePath, 'candidate route mismatch')
assert(parsed.result.planResult.existingAdjacentExpressRoutePath === adjacentExpressRoutePath, 'adjacent route path mismatch')
assert(parsed.result.planResult.existingAdjacentExpressRouteMutatedToday === false, 'adjacent route mutated today')
assert(parsed.result.planResult.registrySourceCreatedToday === false, 'registry source created today')
assert(parsed.result.planResult.appRouteRegisteredToday === false, 'app route registered today')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.candidate.candidateRegistryPath === registryPath, 'candidate registry path mismatch')
assert(parsed.candidate.candidateIndexPath === indexPath, 'candidate index path mismatch')
assert(parsed.candidate.candidateRoutePath === routePath, 'candidate route path mismatch')
assert(parsed.candidate.plannedRegistryEntry.acceptedForDispatch === false, 'planned entry accepted dispatch')
assert(parsed.candidate.plannedRegistryEntry.noWorkerExecution === true, 'planned entry worker block missing')
assert(parsed.candidate.requiresSourceChangeLater === true, 'candidate future source change missing')
assert(parsed.candidate.registrySourceCreatedToday === false, 'candidate registry created today')
assert(parsed.candidate.mustAvoidDuplicateExpressRoute === true, 'duplicate route guard missing')

assert(parsed.safety.futureSourceChangeRules.onlyCreateRegistryPath === registryPath, 'safety registry path mismatch')
assert(parsed.safety.futureSourceChangeRules.mayReferenceIndexPath === indexPath, 'safety index path mismatch')
assert(parsed.safety.futureSourceChangeRules.mayReferenceRoutePath === routePath, 'safety route path mismatch')
assert(parsed.safety.futureSourceChangeRules.doNotModifyExistingExpressRoutePath === adjacentExpressRoutePath, 'safety adjacent route mismatch')
assert(parsed.safety.futureSourceChangeRules.doNotRegisterExpressRoute === true, 'safety express route guard missing')
assert(parsed.safety.futureSourceChangeRules.doNotEnableRouteExecution === true, 'safety route execution guard missing')
assert(parsed.safety.registrySourceCreatedToday === false, 'safety registry source created today')
assert(parsed.safety.existingAdjacentExpressRouteMutatedToday === false, 'safety adjacent route mutated today')
assert(parsed.safety.ownerReviewRequiredBeforeSourceChange === true, 'owner review missing')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.ownerReviewMayProceed === true, 'owner review readiness missing')
assert(parsed.readiness.sourceChangeApprovedToday === false, 'source change approved today')
assert(parsed.readiness.stillForbidden.includes('registry_source_change'), 'registry source blocker missing')
assert(parsed.readiness.stillForbidden.includes('express_route_registration'), 'express route blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.disabledRouteRegistrationPlanned === true, 'registration planned claim missing')
assert(parsed.claimPolicy.allowedClaims.registrationOwnerReviewMayProceed === true, 'owner review claim missing')
assert(parsed.claimPolicy.allowedClaims.registrySourceCreatedToday === false, 'registry source created claim widened')
assert(parsed.claimPolicy.allowedClaims.acceptedForDispatch === false, 'accepted dispatch claim widened')
assert(parsed.claimPolicy.allowedClaims.appRouteRegisteredToday === false, 'app route registered claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowRegistrationPlanReview === true, 'next prompt review missing')
assert(
  parsed.nextPrompt.reviewScope.allowActualDisabledRouteRegistrySourceCreation === true,
  'next prompt source creation path missing',
)
assert(parsed.nextPrompt.reviewScope.allowRegistrySourceChangeToday === false, 'next prompt source change widened')
assert(parsed.nextPrompt.reviewScope.allowExistingExpressRouteMutation === false, 'next prompt adjacent route widened')
assert(parsed.nextPrompt.reviewScope.allowExpressRouteRegistration === false, 'next prompt express route widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase167-disabled-route-registration-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase167-disabled-route-registration-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2210,
      disabledRouteRegistrationPlanned: true,
      registrySourceCreatedToday: false,
      appRouteRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE168-DISABLED-ROUTE-REGISTRATION-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
