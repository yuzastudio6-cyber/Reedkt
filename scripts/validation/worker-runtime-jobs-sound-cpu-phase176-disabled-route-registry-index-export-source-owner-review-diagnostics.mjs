import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase175_disabled_route_registry_index_export_static_validation_passed_with_warnings_ready_for_registry_index_export_source_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase176_disabled_route_registry_index_export_source_owner_review_passed_with_warnings_ready_for_disabled_route_registry_app_registration_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase177_disabled_route_registry_app_registration_plan_completed_with_warnings_ready_for_app_registration_owner_review'
const indexPath = 'server/workers/sound-cpu/index.ts'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation-result.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-phase175-static-registry-index-proof-output.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-app-registration-plan-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase176-app-registration-plan-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase176-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase176-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase177-disabled-route-registry-app-registration-plan.md',
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
    'appRegistrationSourceChangeMade',
    'appRegistrationSourceChangeMadeToday',
    'appRegistrationSourceChanged',
    'acceptedForAppRegistrationSourceChangeToday',
    'existingAdjacentExpressRouteMutated',
    'existingAdjacentExpressRouteMutatedToday',
    'acceptedForExistingExpressRouteMutationToday',
    'expressRouteRegistered',
    'expressRouteRegisteredToday',
    'acceptedForExpressRouteRegistrationToday',
    'workerDispatchExecutionEnabled',
    'acceptedForWorkerDispatchExecutionToday',
    'claimLeaseMutationEnabled',
    'routeExecutionEnabled',
    'acceptedForRouteExecutionToday',
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
    'allowAppRegistrationSourceChange',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation-result'),
  sourceProof: parseJsonBlock(docs.sourceProof, 'worker-runtime-jobs-sound-cpu-phase175-static-registry-index-proof-output'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-app-registration-plan-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase176-app-registration-plan-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase176-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase176-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase177-disabled-route-registry-app-registration-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexSource = read(indexPath)
const registrySource = read(registryPath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)

assert(indexSource.includes("from './disabled-route-registry.ts'"), 'registry index export missing')
assert(indexSource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY'), 'registry export symbol missing')
assert(indexSource.includes('listSoundCpuDisabledRouteRegistry'), 'registry list export missing')
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry execution flag widened')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry dispatch block missing')
assert(registrySource.includes('noWorkerExecution: true'), 'registry worker block missing')
assert(registrySource.includes('noRouteExecution: true'), 'registry route block missing')
assert(registrySource.includes('noSupabaseMutation: true'), 'registry Supabase block missing')
assert(registrySource.includes('noSqlExecution: true'), 'registry SQL block missing')
assert(registrySource.includes('noMediaProcessing: true'), 'registry media block missing')
assert(!registrySource.includes('Router'), 'registry must not create an Express router')
assert(!registrySource.includes('requireAuth'), 'registry must not import route auth')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2231, 'source source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'e09ac81e1aad34cd17aa408f759a1b6fa0223f65', 'source merge mismatch')
assert(parsed.source.validationResult.staticIndexImportSucceeded === true, 'source static index import failed')
assert(parsed.source.validationResult.registryExportResolved === true, 'source registry export unresolved')
assert(parsed.source.validationResult.registryEntryCount === 1, 'source registry count mismatch')
assert(parsed.source.validationResult.registryExecutionEnabled === false, 'source registry execution widened')
assert(parsed.source.validationResult.safePayloadAcceptedForDispatch === false, 'source dispatch accepted')
assert(parsed.source.validationResult.blockedPayloadRejected === true, 'source blocked payload not rejected')
assert(parsed.source.validationResult.workerDispatchExecutionEnabled === false, 'source worker dispatch widened')
assert(parsed.source.validationResult.routeExecutionEnabled === false, 'source route execution widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(parsed.sourceProof.staticIndexImportSucceeded === true, 'source proof static import failed')
assert(parsed.sourceProof.registryExportResolved === true, 'source proof registry unresolved')
assert(parsed.sourceProof.registryEntryCount === 1, 'source proof registry count mismatch')
assert(parsed.sourceProof.registryExecutionEnabled === false, 'source proof execution widened')
assert(parsed.sourceProof.safePayloadAcceptedForDispatch === false, 'source proof dispatch accepted')
assert(parsed.sourceProof.blockedPayloadRejected === true, 'source proof blocked payload not rejected')
assert(parsed.sourceProof.noWorkerExecution === true, 'source proof worker block missing')
assert(parsed.sourceProof.noRouteExecution === true, 'source proof route block missing')
assert(parsed.sourceProof.expressRouteRegistered === false, 'source proof route registered')
assert(parsed.sourceProof.workerDispatchExecutionEnabled === false, 'source proof dispatch widened')
assert(parsed.sourceProof.routeExecutionEnabled === false, 'source proof route widened')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationReview === true, 'source prompt static review missing')
assert(parsed.sourcePrompt.reviewScope.allowAppRegistrationPlanning === true, 'source prompt app planning missing')
assert(parsed.sourcePrompt.reviewScope.allowExistingExpressRouteMutation === false, 'source prompt adjacent route mutation widened')
assert(parsed.sourcePrompt.reviewScope.allowExpressRouteRegistrationToday === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2233, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '2551365941308ff0673d8f4e94edf2613874825a', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.staticIndexImportValidationAccepted === true, 'static validation not accepted')
assert(parsed.result.ownerReviewResult.registryIndexExportSourceAccepted === true, 'registry source not accepted')
assert(parsed.result.ownerReviewResult.appRegistrationPlanningMayProceed === true, 'app registration planning not accepted')
assert(parsed.result.ownerReviewResult.indexPath === indexPath, 'result index path mismatch')
assert(parsed.result.ownerReviewResult.registryPath === registryPath, 'result registry path mismatch')
assert(parsed.result.ownerReviewResult.appRegistrationSourceChangeMadeToday === false, 'app registration source changed today')
assert(parsed.result.ownerReviewResult.existingAdjacentExpressRouteMutatedToday === false, 'adjacent route mutated today')
assert(parsed.result.ownerReviewResult.expressRouteRegisteredToday === false, 'express route registered today')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'worker dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForAppRegistrationPlanning === true, 'acceptance planning missing')
assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2233, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.staticIndexImportSucceeded === true, 'acceptance static import missing')
assert(parsed.acceptance.acceptedSourceEvidence.registryExportResolved === true, 'acceptance registry export missing')
assert(parsed.acceptance.acceptedSourceEvidence.registryEntryCount === 1, 'acceptance registry count mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.registryExecutionEnabled === false, 'acceptance registry execution widened')
assert(parsed.acceptance.acceptedSourceEvidence.safePayloadAcceptedForDispatch === false, 'acceptance dispatch accepted')
assert(parsed.acceptance.acceptedSourceEvidence.blockedPayloadRejected === true, 'acceptance blocked payload missing')
assert(parsed.acceptance.acceptedPlanningSurface.indexPath === indexPath, 'acceptance index path mismatch')
assert(parsed.acceptance.acceptedPlanningSurface.registryPath === registryPath, 'acceptance registry path mismatch')
assert(parsed.acceptance.acceptedPlanningSurface.adjacentExpressRoutePath === adjacentExpressRoutePath, 'acceptance adjacent route mismatch')
assert(parsed.acceptance.acceptedForAppRegistrationSourceChangeToday === false, 'acceptance app source changed today')
assert(parsed.acceptance.acceptedForExistingExpressRouteMutationToday === false, 'acceptance adjacent route mutation widened')
assert(parsed.acceptance.acceptedForExpressRouteRegistrationToday === false, 'acceptance route registration widened')
assert(parsed.acceptance.acceptedForWorkerDispatchExecutionToday === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedForRouteExecutionToday === false, 'acceptance route execution widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.appRegistrationPlanningMayProceed === true, 'readiness app planning missing')
assert(parsed.readiness.staticIndexImportValidationAccepted === true, 'readiness static validation missing')
assert(parsed.readiness.registryIndexExportSourceAccepted === true, 'readiness registry source missing')
assert(parsed.readiness.sourceChangeMadeToday === false, 'readiness source changed today')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')
assert(parsed.readiness.stillForbidden.includes('supabase_mutation'), 'Supabase blocker missing')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE177-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-PLAN', 'readiness next prompt mismatch')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.staticIndexImportValidationAccepted === true, 'claim static validation missing')
assert(parsed.claimPolicy.allowedClaims.registryIndexExportSourceAccepted === true, 'claim registry source missing')
assert(parsed.claimPolicy.allowedClaims.appRegistrationPlanningMayProceed === true, 'claim app planning missing')
assert(parsed.claimPolicy.allowedClaims.appRegistrationSourceChangeMadeToday === false, 'claim app source changed today')
assert(parsed.claimPolicy.allowedClaims.expressRouteRegisteredToday === false, 'claim express route widened')
assert(parsed.claimPolicy.allowedClaims.workerDispatchExecutionEnabled === false, 'claim dispatch widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'claim route widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowAppRegistrationPlan === true, 'next prompt app plan missing')
assert(parsed.nextPrompt.planningScope.allowAppRegistrationSourceChange === false, 'next prompt app source change widened')
assert(parsed.nextPrompt.planningScope.allowExistingExpressRouteMutation === false, 'next prompt adjacent mutation widened')
assert(parsed.nextPrompt.planningScope.allowExpressRouteRegistration === false, 'next prompt registration widened')
assert(parsed.nextPrompt.planningScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2233,
      staticIndexImportValidationAccepted: true,
      registryIndexExportSourceAccepted: true,
      appRegistrationPlanningMayProceed: true,
      appRegistrationSourceChangeMadeToday: false,
      expressRouteRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE177-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-PLAN',
    },
    null,
    2,
  ),
)
