import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase179_disabled_route_registry_app_registration_static_validation_plan_completed_with_warnings_ready_for_static_validation_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase180_disabled_route_registry_app_registration_static_validation_owner_review_passed_with_warnings_ready_for_actual_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase181_disabled_route_registry_app_registration_static_validation_passed_with_warnings_ready_for_static_validation_result_owner_review'
const appPath = 'server/app.ts'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const routePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase180-actual-static-validation-acceptance-register.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase180-no-http-validation-safety-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase180-actual-static-validation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase180-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase180-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation.md',
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
    'serverStarted',
    'serverStartedToday',
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
    'allowServerStart',
    'allowHttpRouteRequestExecution',
    'allowRouteHandlerInvocation',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase179-disabled-route-registry-app-registration-static-validation-plan-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase180-actual-static-validation-acceptance-register'),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase180-no-http-validation-safety-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase180-actual-static-validation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase180-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase180-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const appSource = read(appPath)
const registrySource = read(registryPath)
const routeSource = read(routePath)
assert(appSource.includes('app.use(createSoundCpuWorkerRoutes())'), 'app mount missing')
assert((appSource.match(/createSoundCpuWorkerRoutes/g) || []).length === 2, 'expected one import and one mount')
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry flag widened')
assert(routeSource.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'route flag widened')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2238, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '5740989478d64d98e867917d73abab1b644d1e23', 'source merge mismatch')
assert(parsed.source.planResult.staticValidationPlanned === true, 'source static plan missing')
assert(parsed.source.planResult.httpRouteRequestExecutionPlanned === false, 'source HTTP planned')
assert(parsed.source.planResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.planResult.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowActualStaticValidationNext === true, 'source prompt actual static validation missing')
assert(parsed.sourcePrompt.reviewScope.allowServerAppSourceChange === false, 'source prompt app change widened')
assert(parsed.sourcePrompt.reviewScope.allowHttpRouteRequestExecution === false, 'source prompt HTTP widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2240, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'a55bcc6b0fa3821a1a24b32b821c7309dbc1601e', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.staticValidationPlanAccepted === true, 'plan not accepted')
assert(parsed.result.ownerReviewResult.actualStaticValidationMayProceed === true, 'actual static validation not accepted')
assert(parsed.result.ownerReviewResult.sourceOnlyValidationRequired === true, 'source-only requirement missing')
assert(parsed.result.ownerReviewResult.serverStartedToday === false, 'server started')
assert(parsed.result.ownerReviewResult.httpRouteRequestExecuted === false, 'HTTP executed')
assert(parsed.result.ownerReviewResult.routeHandlerInvoked === false, 'route handler invoked')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'route widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForActualStaticValidation === true, 'acceptance missing')
assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2240, 'acceptance source mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.staticValidationPlanned === true, 'acceptance plan missing')
assert(parsed.acceptance.acceptedSourceEvidence.httpRouteRequestExecutionPlanned === false, 'acceptance HTTP planned')
assert(parsed.acceptance.allowedNextValidation.readSourceFiles === true, 'read source missing')
assert(parsed.acceptance.allowedNextValidation.countAppRegistrations === true, 'count registrations missing')
assert(parsed.acceptance.allowedNextValidation.startServer === false, 'server start widened')
assert(parsed.acceptance.allowedNextValidation.sendHttpRequests === false, 'HTTP widened')
assert(parsed.acceptance.allowedNextValidation.invokeRouteHandlers === false, 'handler widened')
assert(parsed.acceptance.allowedNextValidation.dispatchWorkers === false, 'dispatch widened')

assert(parsed.safety.safetyRequirementsForNextPhase.mustNotStartServer === true, 'server guard missing')
assert(parsed.safety.safetyRequirementsForNextPhase.mustNotSendHttpRequests === true, 'HTTP guard missing')
assert(parsed.safety.safetyRequirementsForNextPhase.mustNotInvokeRouteHandlers === true, 'handler guard missing')
assert(parsed.safety.acceptedValidationMode === 'source-only static validation', 'validation mode mismatch')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.actualStaticValidationMayProceed === true, 'readiness actual validation missing')
assert(parsed.readiness.sourceOnlyValidationRequired === true, 'readiness source-only missing')
assert(parsed.readiness.sourceChangeApprovedToday === false, 'source approved')
assert(parsed.readiness.stillForbidden.includes('server_start'), 'server start blocker missing')
assert(parsed.readiness.stillForbidden.includes('http_route_request_execution'), 'HTTP blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_handler_invocation'), 'handler blocker missing')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE181-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION', 'next prompt mismatch')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.staticValidationPlanAccepted === true, 'claim plan missing')
assert(parsed.claimPolicy.allowedClaims.actualStaticValidationMayProceed === true, 'claim actual validation missing')
assert(parsed.claimPolicy.allowedClaims.sourceOnlyValidationRequired === true, 'claim source-only missing')
assert(parsed.claimPolicy.allowedClaims.serverStartedToday === false, 'claim server start widened')
assert(parsed.claimPolicy.allowedClaims.httpRouteRequestExecuted === false, 'claim HTTP widened')
assert(parsed.claimPolicy.allowedClaims.routeHandlerInvoked === false, 'claim handler widened')
assert(parsed.claimPolicy.allowedClaims.workerDispatchExecutionEnabled === false, 'claim dispatch widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'claim route widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.allowReadSourceFiles === true, 'next prompt read missing')
assert(parsed.nextPrompt.validationScope.allowServerStart === false, 'next prompt server start widened')
assert(parsed.nextPrompt.validationScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.validationScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2240,
      staticValidationPlanAccepted: true,
      actualStaticValidationMayProceed: true,
      sourceOnlyValidationRequired: true,
      serverStartedToday: false,
      httpRouteRequestExecuted: false,
      routeHandlerInvoked: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE181-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
