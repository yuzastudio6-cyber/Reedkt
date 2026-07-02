import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase178_disabled_route_registry_app_registration_owner_review_passed_with_warnings_ready_for_app_registration_static_validation_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase179_disabled_route_registry_app_registration_static_validation_plan_completed_with_warnings_ready_for_static_validation_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase180_disabled_route_registry_app_registration_static_validation_owner_review_passed_with_warnings_ready_for_actual_static_validation'
const appPath = 'server/app.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const routePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase178-disabled-route-registry-app-registration-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan-result.md',
  targets: 'docs/worker-runtime-jobs-sound-cpu-phase179-static-validation-target-register.md',
  procedure: 'docs/worker-runtime-jobs-sound-cpu-phase179-static-validation-procedure-plan.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase179-no-http-execution-safety-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase179-static-validation-owner-review-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase179-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase179-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review.md',
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
    'serverStarted',
    'httpRouteRequestExecuted',
    'routeHandlerInvoked',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase178-disabled-route-registry-app-registration-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan-result'),
  targets: parseJsonBlock(docs.targets, 'worker-runtime-jobs-sound-cpu-phase179-static-validation-target-register'),
  procedure: parseJsonBlock(docs.procedure, 'worker-runtime-jobs-sound-cpu-phase179-static-validation-procedure-plan'),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase179-no-http-execution-safety-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase179-static-validation-owner-review-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase179-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase179-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const appSource = read(appPath)
const indexSource = read(indexPath)
const registrySource = read(registryPath)
const routeSource = read(routePath)

assert(appSource.includes("import { createSoundCpuWorkerRoutes } from './routes/sound-cpu-worker-routes'"), 'app import missing')
assert((appSource.match(/createSoundCpuWorkerRoutes/g) || []).length === 2, 'expected one import and one mount')
assert(appSource.includes('app.use(createSoundCpuWorkerRoutes())'), 'app mount missing')
assert(indexSource.includes("from './disabled-route-registry.ts'"), 'registry index export missing')
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry execution flag widened')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry dispatch block missing')
assert(routeSource.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'route execution flag widened')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2237, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '8ab835257be0471e66fa9385bb1ff1353dc12433', 'source merge mismatch')
assert(parsed.source.ownerReviewResult.staticValidationPlanningMayProceed === true, 'source static planning missing')
assert(parsed.source.ownerReviewResult.serverAppSourceChangeMadeToday === false, 'source app changed')
assert(parsed.source.ownerReviewResult.httpRouteRequestExecuted === false, 'source HTTP executed')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.ownerReviewResult.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.staticValidationPlanScope.allowAppImportAndMountInspectionPlan === true, 'source prompt app inspection missing')
assert(parsed.sourcePrompt.staticValidationPlanScope.allowDuplicateRegistrationCheckPlan === true, 'source prompt duplicate check missing')
assert(parsed.sourcePrompt.staticValidationPlanScope.allowServerAppSourceChange === false, 'source prompt app source widened')
assert(parsed.sourcePrompt.staticValidationPlanScope.allowHttpRouteRequestExecution === false, 'source prompt HTTP widened')
assert(parsed.sourcePrompt.staticValidationPlanScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2238, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '5740989478d64d98e867917d73abab1b644d1e23', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.staticValidationPlanned === true, 'static validation plan missing')
assert(parsed.result.planResult.appImportAndMountInspectionPlanned === true, 'app inspection missing')
assert(parsed.result.planResult.disabledRouteHandlerInspectionPlanned === true, 'handler inspection missing')
assert(parsed.result.planResult.registryExportInspectionPlanned === true, 'registry export inspection missing')
assert(parsed.result.planResult.duplicateRegistrationCheckPlanned === true, 'duplicate check missing')
assert(parsed.result.planResult.serverAppSourceChangeMadeToday === false, 'server app changed')
assert(parsed.result.planResult.httpRouteRequestExecutionPlanned === false, 'HTTP execution planned')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'route widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.targets.staticValidationTargets.length === 4, 'target count mismatch')
assert(parsed.targets.staticValidationTargets.some((target) => target.path === appPath), 'app target missing')
assert(parsed.targets.staticValidationTargets.every((target) => target.sourceChangedToday === false), 'target changed today')
assert(parsed.targets.httpRouteRequestExecutionPlanned === false, 'target HTTP planned')
assert(parsed.targets.workerDispatchExecutionPlanned === false, 'target dispatch planned')

assert(parsed.procedure.plannedStaticChecks.readServerAppSource === true, 'procedure app read missing')
assert(parsed.procedure.plannedStaticChecks.confirmSingleImportAndSingleMount === true, 'procedure duplicate check missing')
assert(parsed.procedure.plannedStaticChecks.confirmRouteExecutionFlagFalse === true, 'procedure route flag missing')
assert(parsed.procedure.forbiddenDuringValidation.httpRouteRequestExecution === false, 'procedure HTTP widened')
assert(parsed.procedure.forbiddenDuringValidation.workerDispatchExecution === false, 'procedure dispatch widened')
assert(parsed.procedure.forbiddenDuringValidation.routeExecution === false, 'procedure route widened')
assert(parsed.procedure.forbiddenDuringValidation.supabaseMutation === false, 'procedure Supabase widened')

assert(parsed.safety.safetyRules.doNotStartServer === true, 'server start guard missing')
assert(parsed.safety.safetyRules.doNotSendHttpRequests === true, 'HTTP guard missing')
assert(parsed.safety.safetyRules.doNotRunRouteHandlers === true, 'route handler guard missing')
assert(parsed.safety.serverStartedToday === false, 'server started')
assert(parsed.safety.httpRouteRequestExecuted === false, 'HTTP executed')
assert(parsed.safety.routeHandlerInvoked === false, 'handler invoked')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.staticValidationPlanCompleted === true, 'readiness plan missing')
assert(parsed.readiness.ownerReviewMayProceed === true, 'owner review missing')
assert(parsed.readiness.sourceChangeApprovedToday === false, 'source approved')
assert(parsed.readiness.stillForbidden.includes('http_route_request_execution'), 'HTTP blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route blocker missing')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE180-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION-OWNER-REVIEW', 'next prompt mismatch')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.staticValidationPlanned === true, 'claim static plan missing')
assert(parsed.claimPolicy.allowedClaims.appImportAndMountInspectionPlanned === true, 'claim app inspection missing')
assert(parsed.claimPolicy.allowedClaims.httpRouteRequestExecutionPlanned === false, 'claim HTTP planned')
assert(parsed.claimPolicy.allowedClaims.workerDispatchExecutionEnabled === false, 'claim dispatch widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'claim route widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowActualStaticValidationNext === true, 'next prompt actual static validation missing')
assert(parsed.nextPrompt.reviewScope.allowServerAppSourceChange === false, 'next prompt app source widened')
assert(parsed.nextPrompt.reviewScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2238,
      staticValidationPlanned: true,
      duplicateRegistrationCheckPlanned: true,
      serverAppSourceChangeMadeToday: false,
      httpRouteRequestExecutionPlanned: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE180-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
