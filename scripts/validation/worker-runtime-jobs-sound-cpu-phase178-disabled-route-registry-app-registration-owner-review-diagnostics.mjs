import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase177_disabled_route_registry_app_registration_plan_completed_with_warnings_ready_for_app_registration_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase178_disabled_route_registry_app_registration_owner_review_passed_with_warnings_ready_for_app_registration_static_validation_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase179_disabled_route_registry_app_registration_static_validation_plan_completed_with_warnings_ready_for_static_validation_owner_review'
const appPath = 'server/app.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase177-disabled-route-registry-app-registration-plan-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase178-disabled-route-registry-app-registration-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase178-disabled-route-registry-app-registration-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase178-static-validation-plan-acceptance-register.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase178-duplicate-registration-owner-safety-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase178-static-validation-plan-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase178-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase178-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan.md',
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
    'serverAppSourceChanged',
    'serverAppSourceChangeMadeToday',
    'duplicateAppRegistrationAdded',
    'duplicateAppRegistrationAddedToday',
    'existingAdjacentExpressRouteMutated',
    'existingAdjacentExpressRouteMutatedToday',
    'expressRouteRegistered',
    'httpRouteRequestExecuted',
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
    'allowServerAppSourceChange',
    'allowDuplicateAppRegistration',
    'allowExistingExpressRouteMutation',
    'allowExpressRouteRegistration',
    'allowHttpRouteRequestExecution',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase177-disabled-route-registry-app-registration-plan-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase178-disabled-route-registry-app-registration-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase178-disabled-route-registry-app-registration-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase178-static-validation-plan-acceptance-register'),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase178-duplicate-registration-owner-safety-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase178-static-validation-plan-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase178-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase178-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const appSource = read(appPath)
const indexSource = read(indexPath)
const registrySource = read(registryPath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)

assert(appSource.includes("import { createSoundCpuWorkerRoutes } from './routes/sound-cpu-worker-routes'"), 'existing app route import missing')
assert((appSource.match(/createSoundCpuWorkerRoutes/g) || []).length === 2, 'expected one import and one mount')
assert(appSource.includes('app.use(createSoundCpuWorkerRoutes())'), 'existing app route mount missing')
assert(indexSource.includes("from './disabled-route-registry.ts'"), 'registry index export missing')
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry execution flag widened')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry dispatch block missing')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2234, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '7e9c5c604c3f09ca75b3db7f90f66e87cd724dd3', 'source merge mismatch')
assert(parsed.source.planResult.disabledRouteRegistryAppRegistrationPlanned === true, 'source plan missing')
assert(parsed.source.planResult.existingAppRegistrationSourcePresent === true, 'source existing app missing')
assert(parsed.source.planResult.duplicateAppRegistrationMustBeAvoided === true, 'source duplicate guard missing')
assert(parsed.source.planResult.appRegistrationSourceChangeMadeToday === false, 'source app source changed')
assert(parsed.source.planResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.planResult.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowAppRegistrationPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationPlanning === true, 'source prompt static planning missing')
assert(parsed.sourcePrompt.reviewScope.allowServerAppSourceChange === false, 'source prompt app source widened')
assert(parsed.sourcePrompt.reviewScope.allowDuplicateAppRegistration === false, 'source prompt duplicate widened')
assert(parsed.sourcePrompt.reviewScope.allowHttpRouteRequestExecution === false, 'source prompt HTTP widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2237, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '8ab835257be0471e66fa9385bb1ff1353dc12433', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.duplicateSafeAppRegistrationPlanAccepted === true, 'plan not accepted')
assert(parsed.result.ownerReviewResult.existingAppRegistrationSourceAcceptedForStaticPlanning === true, 'existing app not accepted')
assert(parsed.result.ownerReviewResult.staticValidationPlanningMayProceed === true, 'static planning not accepted')
assert(parsed.result.ownerReviewResult.appPath === appPath, 'app path mismatch')
assert(parsed.result.ownerReviewResult.adjacentExpressRoutePath === adjacentExpressRoutePath, 'adjacent route path mismatch')
assert(parsed.result.ownerReviewResult.registryPath === registryPath, 'registry path mismatch')
assert(parsed.result.ownerReviewResult.serverAppSourceChangeMadeToday === false, 'server app changed today')
assert(parsed.result.ownerReviewResult.duplicateAppRegistrationAddedToday === false, 'duplicate registration added')
assert(parsed.result.ownerReviewResult.httpRouteRequestExecuted === false, 'HTTP request executed')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'route widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForStaticValidationPlanning === true, 'acceptance static planning missing')
assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2237, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.existingAppRegistrationSourcePresent === true, 'acceptance existing app missing')
assert(parsed.acceptance.acceptedSourceEvidence.duplicateAppRegistrationMustBeAvoided === true, 'acceptance duplicate guard missing')
assert(parsed.acceptance.acceptedStaticValidationTargets.includes(appPath), 'acceptance app target missing')
assert(parsed.acceptance.acceptedStaticValidationTargets.includes(adjacentExpressRoutePath), 'acceptance route target missing')
assert(parsed.acceptance.acceptedForServerAppSourceChangeToday === false, 'acceptance server app changed')
assert(parsed.acceptance.acceptedForDuplicateAppRegistrationToday === false, 'acceptance duplicate widened')
assert(parsed.acceptance.acceptedForHttpRouteRequestExecutionToday === false, 'acceptance HTTP widened')
assert(parsed.acceptance.acceptedForRouteExecutionToday === false, 'acceptance route widened')

assert(parsed.safety.duplicateRegistrationSafety.existingAppRegistrationSourcePresent === true, 'safety existing app missing')
assert(parsed.safety.duplicateRegistrationSafety.addSecondAppUseEntry === false, 'safety duplicate app.use allowed')
assert(parsed.safety.duplicateRegistrationSafety.mutateExistingAppUseEntryToday === false, 'safety app mutation allowed')
assert(parsed.safety.duplicateRegistrationSafety.executeHttpRouteRequestToday === false, 'safety HTTP allowed')
assert(parsed.safety.duplicateRegistrationSafety.enableRouteExecutionToday === false, 'safety route execution allowed')
assert(parsed.safety.staticValidationPlanningRules.mayPlanDuplicateRegistrationCheck === true, 'safety duplicate check plan missing')
assert(parsed.safety.staticValidationPlanningRules.mayPlanHttpRequestExecution === false, 'safety HTTP plan widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.staticValidationPlanningMayProceed === true, 'readiness static planning missing')
assert(parsed.readiness.duplicateSafeAppRegistrationPlanAccepted === true, 'readiness plan missing')
assert(parsed.readiness.existingAppRegistrationSourceAcceptedForStaticPlanning === true, 'readiness existing app missing')
assert(parsed.readiness.sourceChangeApprovedToday === false, 'readiness source approved')
assert(parsed.readiness.stillForbidden.includes('duplicate_app_registration'), 'duplicate blocker missing')
assert(parsed.readiness.stillForbidden.includes('http_route_request_execution'), 'HTTP blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route blocker missing')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE179-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION-PLAN', 'readiness next prompt mismatch')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.duplicateSafeAppRegistrationPlanAccepted === true, 'claim plan missing')
assert(parsed.claimPolicy.allowedClaims.existingAppRegistrationSourceAcceptedForStaticPlanning === true, 'claim existing app missing')
assert(parsed.claimPolicy.allowedClaims.staticValidationPlanningMayProceed === true, 'claim static planning missing')
assert(parsed.claimPolicy.allowedClaims.serverAppSourceChangeMadeToday === false, 'claim server app changed')
assert(parsed.claimPolicy.allowedClaims.duplicateAppRegistrationAddedToday === false, 'claim duplicate added')
assert(parsed.claimPolicy.allowedClaims.httpRouteRequestExecuted === false, 'claim HTTP executed')
assert(parsed.claimPolicy.allowedClaims.workerDispatchExecutionEnabled === false, 'claim dispatch widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'claim route widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.staticValidationPlanScope.allowAppImportAndMountInspectionPlan === true, 'next prompt app inspection missing')
assert(parsed.nextPrompt.staticValidationPlanScope.allowDuplicateRegistrationCheckPlan === true, 'next prompt duplicate check missing')
assert(parsed.nextPrompt.staticValidationPlanScope.allowServerAppSourceChange === false, 'next prompt server app widened')
assert(parsed.nextPrompt.staticValidationPlanScope.allowDuplicateAppRegistration === false, 'next prompt duplicate widened')
assert(parsed.nextPrompt.staticValidationPlanScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.staticValidationPlanScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase178-disabled-route-registry-app-registration-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase178-disabled-route-registry-app-registration-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2237,
      duplicateSafeAppRegistrationPlanAccepted: true,
      existingAppRegistrationSourceAcceptedForStaticPlanning: true,
      staticValidationPlanningMayProceed: true,
      serverAppSourceChangeMadeToday: false,
      duplicateAppRegistrationAddedToday: false,
      httpRouteRequestExecuted: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE179-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION-PLAN',
    },
    null,
    2,
  ),
)
