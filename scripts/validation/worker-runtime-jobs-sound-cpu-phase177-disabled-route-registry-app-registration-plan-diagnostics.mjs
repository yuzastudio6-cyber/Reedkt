import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase176_disabled_route_registry_index_export_source_owner_review_passed_with_warnings_ready_for_disabled_route_registry_app_registration_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase177_disabled_route_registry_app_registration_plan_completed_with_warnings_ready_for_app_registration_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase178_disabled_route_registry_app_registration_owner_review_passed_with_warnings_ready_for_app_registration_static_validation_plan'
const appPath = 'server/app.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase177-disabled-route-registry-app-registration-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase177-disabled-route-registry-app-registration-plan-result.md',
  touchpoint: 'docs/worker-runtime-jobs-sound-cpu-phase177-app-registration-touchpoint-plan.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase177-app-registration-safety-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase177-app-registration-owner-review-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase177-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase177-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase178-disabled-route-registry-app-registration-owner-review.md',
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
    'appRegistrationSourceChangeMade',
    'appRegistrationSourceChangeMadeToday',
    'duplicateAppRegistrationAdded',
    'existingAdjacentExpressRouteMutated',
    'existingAdjacentExpressRouteMutatedToday',
    'expressRouteRegistered',
    'expressRouteRegisteredToday',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase177-disabled-route-registry-app-registration-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase177-disabled-route-registry-app-registration-plan-result'),
  touchpoint: parseJsonBlock(docs.touchpoint, 'worker-runtime-jobs-sound-cpu-phase177-app-registration-touchpoint-plan'),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase177-app-registration-safety-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase177-app-registration-owner-review-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase177-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase177-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase178-disabled-route-registry-app-registration-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const appSource = read(appPath)
const indexSource = read(indexPath)
const registrySource = read(registryPath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)

assert(appSource.includes("import { createSoundCpuWorkerRoutes } from './routes/sound-cpu-worker-routes'"), 'existing app route import missing')
assert((appSource.match(/createSoundCpuWorkerRoutes/g) || []).length === 2, 'expected one import and one mount for existing sound CPU routes')
assert(appSource.includes('app.use(createSoundCpuWorkerRoutes())'), 'existing app route mount missing')
assert(indexSource.includes("from './disabled-route-registry.ts'"), 'registry index export missing')
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry execution flag widened')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry dispatch block missing')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2233, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '2551365941308ff0673d8f4e94edf2613874825a', 'source merge mismatch')
assert(parsed.source.ownerReviewResult.staticIndexImportValidationAccepted === true, 'source static validation not accepted')
assert(parsed.source.ownerReviewResult.registryIndexExportSourceAccepted === true, 'source registry source not accepted')
assert(parsed.source.ownerReviewResult.appRegistrationPlanningMayProceed === true, 'source app planning not accepted')
assert(parsed.source.ownerReviewResult.appRegistrationSourceChangeMadeToday === false, 'source app source changed')
assert(parsed.source.ownerReviewResult.expressRouteRegisteredToday === false, 'source route registered today')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.ownerReviewResult.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowAppRegistrationPlan === true, 'source prompt app plan missing')
assert(parsed.sourcePrompt.planningScope.allowAppRegistrationSourceChange === false, 'source prompt source change widened')
assert(parsed.sourcePrompt.planningScope.allowExpressRouteRegistration === false, 'source prompt registration widened')
assert(parsed.sourcePrompt.planningScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2234, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '7e9c5c604c3f09ca75b3db7f90f66e87cd724dd3', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.disabledRouteRegistryAppRegistrationPlanned === true, 'app registration plan missing')
assert(parsed.result.planResult.existingAppRegistrationSourcePresent === true, 'existing app source missing')
assert(parsed.result.planResult.duplicateAppRegistrationMustBeAvoided === true, 'duplicate guard missing')
assert(parsed.result.planResult.candidateAppPath === appPath, 'candidate app path mismatch')
assert(parsed.result.planResult.candidateAdjacentExpressRoutePath === adjacentExpressRoutePath, 'candidate adjacent route mismatch')
assert(parsed.result.planResult.candidateRegistryPath === registryPath, 'candidate registry mismatch')
assert(parsed.result.planResult.candidateIndexPath === indexPath, 'candidate index mismatch')
assert(parsed.result.planResult.appRegistrationSourceChangeMadeToday === false, 'app source changed today')
assert(parsed.result.planResult.expressRouteRegisteredToday === false, 'route registered today')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'route widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

const appTouchpoint = parsed.touchpoint.plannedTouchpoints.find((entry) => entry.path === appPath)
assert(appTouchpoint, 'app touchpoint missing')
assert(appTouchpoint.sourceChangedToday === false, 'app touchpoint changed today')
assert(parsed.touchpoint.duplicatePrevention.existingAppRegistrationSourcePresent === true, 'duplicate prevention existing state missing')
assert(parsed.touchpoint.duplicatePrevention.addSecondAppUseEntry === false, 'duplicate app.use allowed')
assert(parsed.touchpoint.duplicatePrevention.mutateExistingRouteHandlers === false, 'route handler mutation allowed')
assert(parsed.touchpoint.duplicatePrevention.enableRouteExecution === false, 'route execution allowed')

assert(parsed.safety.safetyRules.doNotAddDuplicateAppRegistration === true, 'duplicate safety missing')
assert(parsed.safety.safetyRules.doNotMutateServerAppToday === true, 'server app guard missing')
assert(parsed.safety.safetyRules.doNotSendHttpRequests === true, 'HTTP guard missing')
assert(parsed.safety.safetyRules.doNotEnableRouteExecution === true, 'route execution guard missing')
assert(parsed.safety.appRegistrationSourceChangeMadeToday === false, 'safety app source changed')
assert(parsed.safety.expressRouteRegisteredToday === false, 'safety route registered')
assert(parsed.safety.ownerReviewRequiredBeforeAnySourceChange === true, 'owner review requirement missing')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.ownerReviewMayProceed === true, 'owner review readiness missing')
assert(parsed.readiness.disabledRouteRegistryAppRegistrationPlanned === true, 'readiness plan missing')
assert(parsed.readiness.existingAppRegistrationSourcePresent === true, 'readiness existing app state missing')
assert(parsed.readiness.duplicateAppRegistrationMustBeAvoided === true, 'readiness duplicate guard missing')
assert(parsed.readiness.sourceChangeApprovedToday === false, 'readiness source approved today')
assert(parsed.readiness.stillForbidden.includes('duplicate_app_registration'), 'duplicate blocker missing')
assert(parsed.readiness.stillForbidden.includes('http_route_request_execution'), 'HTTP execution blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.disabledRouteRegistryAppRegistrationPlanned === true, 'claim plan missing')
assert(parsed.claimPolicy.allowedClaims.existingAppRegistrationSourcePresent === true, 'claim existing app missing')
assert(parsed.claimPolicy.allowedClaims.duplicateAppRegistrationMustBeAvoided === true, 'claim duplicate guard missing')
assert(parsed.claimPolicy.allowedClaims.ownerReviewMayProceed === true, 'claim owner review missing')
assert(parsed.claimPolicy.allowedClaims.appRegistrationSourceChangeMadeToday === false, 'claim app source changed')
assert(parsed.claimPolicy.allowedClaims.expressRouteRegisteredToday === false, 'claim route registered')
assert(parsed.claimPolicy.allowedClaims.workerDispatchExecutionEnabled === false, 'claim dispatch widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'claim route widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowAppRegistrationPlanReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowStaticValidationPlanning === true, 'next prompt static validation plan missing')
assert(parsed.nextPrompt.reviewScope.allowServerAppSourceChange === false, 'next prompt app source change widened')
assert(parsed.nextPrompt.reviewScope.allowDuplicateAppRegistration === false, 'next prompt duplicate widened')
assert(parsed.nextPrompt.reviewScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP execution widened')
assert(parsed.nextPrompt.reviewScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase177-disabled-route-registry-app-registration-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase177-disabled-route-registry-app-registration-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2234,
      disabledRouteRegistryAppRegistrationPlanned: true,
      existingAppRegistrationSourcePresent: true,
      duplicateAppRegistrationMustBeAvoided: true,
      appRegistrationSourceChangeMadeToday: false,
      expressRouteRegisteredToday: false,
      httpRouteRequestExecuted: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE178-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
