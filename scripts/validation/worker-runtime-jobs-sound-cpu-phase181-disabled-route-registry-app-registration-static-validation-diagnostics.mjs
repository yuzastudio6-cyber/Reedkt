import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase180_disabled_route_registry_app_registration_static_validation_owner_review_passed_with_warnings_ready_for_actual_static_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase181_disabled_route_registry_app_registration_static_validation_passed_with_warnings_ready_for_static_validation_result_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase182_disabled_route_registry_app_registration_static_validation_result_owner_review_passed_with_warnings_ready_for_disabled_route_runtime_readiness_plan'

const sourceMergeCommit = 'a15ec81b28572eb9f3d3dd4089b341ca8e2112a2'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation-result.md',
  proof: 'docs/worker-runtime-jobs-sound-cpu-phase181-source-only-app-registration-proof-output.md',
  duplicate: 'docs/worker-runtime-jobs-sound-cpu-phase181-duplicate-app-registration-proof-register.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase181-no-http-no-handler-validation-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase181-static-validation-result-owner-review-readiness-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase181-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review.md',
  runner:
    'scripts/validation/worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation-runner.mjs',
  packageJson: 'package.json',
}

const sources = {
  app: 'server/app.ts',
  route: 'server/routes/sound-cpu-worker-routes.ts',
  registry: 'server/workers/sound-cpu/disabled-route-registry.ts',
  index: 'server/workers/sound-cpu/index.ts',
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

function countMatches(text, pattern) {
  return Array.from(text.matchAll(pattern)).length
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
    'duplicateAppRegistrationFound',
    'duplicateAppRegistrationAddedToday',
    'serverAppSourceChangedToday',
    'serverStarted',
    'serverStartedToday',
    'httpRouteRequestExecuted',
    'httpRouteRequestExecutedToday',
    'routeHandlerInvoked',
    'routeHandlerInvokedToday',
    'expressRouterInstantiatedByValidation',
    'authMiddlewareInvoked',
    'idempotencyMiddlewareInvoked',
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
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
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
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase180-disabled-route-registry-app-registration-static-validation-owner-review-result',
  ),
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation-result',
  ),
  proof: parseJsonBlock(docs.proof, 'worker-runtime-jobs-sound-cpu-phase181-source-only-app-registration-proof-output'),
  duplicate: parseJsonBlock(
    docs.duplicate,
    'worker-runtime-jobs-sound-cpu-phase181-duplicate-app-registration-proof-register',
  ),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase181-no-http-no-handler-validation-register'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase181-static-validation-result-owner-review-readiness-register',
  ),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase181-claim-policy'),
  nextPrompt: parseJsonBlock(
    docs.nextPrompt,
    'worker-runtime-jobs-sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review',
  ),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const appSource = read(sources.app)
const routeSource = read(sources.route)
const registrySource = read(sources.registry)
const indexSource = read(sources.index)
const runnerSource = read(docs.runner)

const importCount = countMatches(
  appSource,
  /import\s+\{\s*createSoundCpuWorkerRoutes\s*\}\s+from\s+['"]\.\/routes\/sound-cpu-worker-routes['"]/g,
)
const mountCount = countMatches(appSource, /app\.use\(createSoundCpuWorkerRoutes\(\)\)/g)
const referenceCount = countMatches(appSource, /createSoundCpuWorkerRoutes/g)

assert(importCount === 1, 'app import count mismatch')
assert(mountCount === 1, 'app mount count mismatch')
assert(referenceCount === 2, 'app route factory reference count mismatch')
assert(routeSource.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'route execution flag widened')
assert(routeSource.includes('workerDispatchStarted: false'), 'route dispatch block missing')
assert(routeSource.includes('routeRegisteredInApp: true'), 'route registration evidence missing')
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry flag widened')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry dispatch block missing')
assert(indexSource.includes("from './disabled-route-registry.ts'"), 'registry index export missing')
assert(runnerSource.includes("import fs from 'node:fs'"), 'runner must use fs source reads')
assert(!runnerSource.includes("from '../../server/"), 'runner must not import server modules')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2240, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'a55bcc6b0fa3821a1a24b32b821c7309dbc1601e', 'source merge mismatch')
assert(parsed.source.ownerReviewResult.actualStaticValidationMayProceed === true, 'source actual validation missing')
assert(parsed.source.ownerReviewResult.sourceOnlyValidationRequired === true, 'source source-only missing')
assert(parsed.source.ownerReviewResult.serverStartedToday === false, 'source server start widened')
assert(parsed.source.ownerReviewResult.httpRouteRequestExecuted === false, 'source HTTP widened')
assert(parsed.source.ownerReviewResult.routeHandlerInvoked === false, 'source handler widened')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.ownerReviewResult.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.validationScope.allowReadSourceFiles === true, 'source prompt read missing')
assert(parsed.sourcePrompt.validationScope.allowCountAppRegistrations === true, 'source prompt count missing')
assert(parsed.sourcePrompt.validationScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.validationScope.allowHttpRouteRequestExecution === false, 'source prompt HTTP widened')
assert(parsed.sourcePrompt.validationScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.validationScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2243, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.validationResult.sourceOnlyStaticValidationPassed === true, 'result source validation failed')
assert(parsed.result.validationResult.appImportCount === 1, 'result import count mismatch')
assert(parsed.result.validationResult.appMountCount === 1, 'result mount count mismatch')
assert(parsed.result.validationResult.routeFactoryReferenceCount === 2, 'result reference count mismatch')
assert(parsed.result.validationResult.duplicateAppRegistrationFound === false, 'result duplicate found')
assert(parsed.result.validationResult.routeExecutionFlagFalse === true, 'result route flag missing')
assert(parsed.result.validationResult.routeDisabledResponsePreservesNoExecution === true, 'result route disabled response missing')
assert(parsed.result.validationResult.registryExecutionFlagFalse === true, 'result registry flag missing')
assert(parsed.result.validationResult.registryDispatchBlocked === true, 'result registry dispatch block missing')
assert(parsed.result.validationResult.registryIndexExportPresent === true, 'result index export missing')
assert(parsed.result.validationResult.serverStarted === false, 'result server started')
assert(parsed.result.validationResult.httpRouteRequestExecuted === false, 'result HTTP executed')
assert(parsed.result.validationResult.routeHandlerInvoked === false, 'result handler invoked')
assert(parsed.result.validationResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.validationResult.routeExecutionEnabled === false, 'result route widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.proof.decision === decision, 'proof decision mismatch')
assert(parsed.proof.sourceOnlyStaticValidationPassed === true, 'proof static validation failed')
assert(parsed.proof.appImportCount === 1, 'proof import count mismatch')
assert(parsed.proof.appMountCount === 1, 'proof mount count mismatch')
assert(parsed.proof.routeFactoryReferenceCount === 2, 'proof reference count mismatch')
assert(parsed.proof.duplicateAppRegistrationFound === false, 'proof duplicate found')
assert(parsed.proof.routeExecutionFlagFalse === true, 'proof route flag missing')
assert(parsed.proof.registryExecutionFlagFalse === true, 'proof registry flag missing')
assert(parsed.proof.registryIndexExportPresent === true, 'proof index export missing')
assert(parsed.proof.serverStarted === false, 'proof server started')
assert(parsed.proof.httpRouteRequestExecuted === false, 'proof HTTP executed')
assert(parsed.proof.routeHandlerInvoked === false, 'proof handler invoked')
assert(parsed.proof.workerDispatchExecutionEnabled === false, 'proof dispatch widened')
assert(parsed.proof.routeExecutionEnabled === false, 'proof route widened')

assert(parsed.duplicate.actualImportCount === 1, 'duplicate import count mismatch')
assert(parsed.duplicate.actualMountCount === 1, 'duplicate mount count mismatch')
assert(parsed.duplicate.actualReferenceCount === 2, 'duplicate reference count mismatch')
assert(parsed.duplicate.duplicateAppRegistrationFound === false, 'duplicate found')
assert(parsed.duplicate.serverAppSourceChangedToday === false, 'server app changed')

assert(parsed.safety.serverStarted === false, 'safety server started')
assert(parsed.safety.httpRouteRequestExecuted === false, 'safety HTTP executed')
assert(parsed.safety.routeHandlerInvoked === false, 'safety handler invoked')
assert(parsed.safety.expressRouterInstantiatedByValidation === false, 'safety router instantiated')
assert(parsed.safety.workerDispatchExecutionEnabled === false, 'safety dispatch widened')
assert(parsed.safety.routeExecutionEnabled === false, 'safety route widened')
assert(parsed.safety.supabaseMutationEnabled === false, 'safety Supabase widened')
assert(parsed.safety.sqlExecutionEnabled === false, 'safety SQL widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.sourceOnlyStaticValidationPassed === true, 'readiness static validation missing')
assert(parsed.readiness.ownerReviewMayProceed === true, 'readiness owner review missing')
assert(parsed.readiness.acceptedForRuntimeReadinessPlanning === false, 'readiness runtime planning widened')
assert(parsed.readiness.acceptedForWorkerDispatchExecution === false, 'readiness dispatch widened')
assert(parsed.readiness.acceptedForRouteExecution === false, 'readiness route widened')
assert(parsed.readiness.stillForbidden.includes('route_handler_invocation'), 'handler blocker missing')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE182-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION-RESULT-OWNER-REVIEW', 'next prompt mismatch')

assert(parsed.claimPolicy.allowedClaims.sourceOnlyStaticValidationPassed === true, 'claim static validation missing')
assert(parsed.claimPolicy.allowedClaims.appImportCount === 1, 'claim import count mismatch')
assert(parsed.claimPolicy.allowedClaims.appMountCount === 1, 'claim mount count mismatch')
assert(parsed.claimPolicy.allowedClaims.routeFactoryReferenceCount === 2, 'claim reference count mismatch')
assert(parsed.claimPolicy.allowedClaims.duplicateAppRegistrationFound === false, 'claim duplicate widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionFlagFalse === true, 'claim route flag missing')
assert(parsed.claimPolicy.allowedClaims.workerDispatchExecutionEnabled === false, 'claim dispatch widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'claim route widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowStaticValidationResultReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowRuntimeReadinessPlanningNext === true, 'next prompt planning missing')
assert(parsed.nextPrompt.reviewScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.reviewScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.reviewScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase181-disabled-route-registry-app-registration-static-validation:proof'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation-runner.mjs',
  'package proof script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase181-disabled-route-registry-app-registration-static-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2243,
      sourceOnlyStaticValidationPassed: true,
      appImportCount: 1,
      appMountCount: 1,
      routeFactoryReferenceCount: 2,
      duplicateAppRegistrationFound: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE182-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION-RESULT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
