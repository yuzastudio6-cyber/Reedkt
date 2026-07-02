import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase170_disabled_route_registration_static_validation_passed_with_warnings_ready_for_registration_source_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase171_disabled_route_registration_source_owner_review_passed_with_warnings_ready_for_registry_index_export_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase172_disabled_route_registry_index_export_plan_completed_with_warnings_ready_for_registry_index_export_owner_review'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation-result.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-phase170-static-registry-proof-output.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase171-disabled-route-registration-source-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase171-disabled-route-registration-source-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase171-registry-index-export-owner-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase171-index-export-plan-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase171-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase171-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan.md',
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
    'indexExportChanged',
    'indexExportChangedToday',
    'acceptedForIndexExportChangeToday',
    'indexExportSourceChangeMade',
    'existingAdjacentExpressRouteMutated',
    'existingAdjacentExpressRouteMutatedToday',
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
    'allowIndexExportSourceChange',
    'allowExistingExpressRouteMutation',
    'allowExpressRouteRegistration',
    'allowWorkerDispatchExecution',
    'allowRouteExecution',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

function phase174RegistryIndexExportEvidenceExists() {
  const file = 'docs/worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-result.md'
  if (!fs.existsSync(path.join(process.cwd(), file))) return false

  const evidence = parseJsonBlock(
    file,
    'worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-result',
  )
  return (
    evidence.decision ===
      'worker_runtime_jobs_sound_cpu_phase174_actual_disabled_route_registry_index_export_source_creation_completed_with_warnings_ready_for_registry_index_export_static_validation' &&
    evidence.sourceChange?.indexExportAdded === true &&
    evidence.sourceChange?.registrySourceChanged === false &&
    evidence.sourceChange?.existingAdjacentExpressRouteMutated === false &&
    evidence.sourceChange?.expressRouteRegistered === false &&
    evidence.sourceChange?.workerDispatchExecutionEnabled === false &&
    evidence.sourceChange?.routeExecutionEnabled === false
  )
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation-result'),
  sourceProof: parseJsonBlock(docs.sourceProof, 'worker-runtime-jobs-sound-cpu-phase170-static-registry-proof-output'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase171-disabled-route-registration-source-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase171-disabled-route-registration-source-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase171-registry-index-export-owner-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase171-index-export-plan-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase171-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase171-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const registrySource = read(registryPath)
const routeSource = read(routePath)
const indexSource = read(indexPath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)

assert(registrySource.includes("from './disabled-dispatch-route.ts'"), 'registry must reference disabled route source')
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry execution flag must be false')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry dispatch block missing')
assert(registrySource.includes('noWorkerExecution: true'), 'registry worker block missing')
assert(registrySource.includes('noRouteExecution: true'), 'registry route block missing')
assert(registrySource.includes('noSupabaseMutation: true'), 'registry Supabase block missing')
assert(registrySource.includes('noSqlExecution: true'), 'registry SQL block missing')
assert(registrySource.includes('noMediaProcessing: true'), 'registry media block missing')
assert(registrySource.includes('noArtifactCreated: true'), 'registry artifact block missing')
assert(registrySource.includes('assertSoundCpuDisabledRouteRegistryExecutionBlocked'), 'registry blocked assertion missing')
assert(!registrySource.includes('Router'), 'registry must not create an Express router')
assert(!registrySource.includes('requireAuth'), 'registry must not import route auth')
assert(routeSource.includes('acceptedForDispatch: false'), 'disabled route source must stay fail-closed')
assert(indexSource.includes("from './disabled-dispatch-route.ts'"), 'existing disabled route index export missing')
assert(
  !indexSource.includes('./disabled-route-registry.ts') || phase174RegistryIndexExportEvidenceExists(),
  'registry index export must remain unmodified before Phase174 evidence',
)
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2217, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'a81f8c8018a20a221db4530c1877e0da9c4fce92', 'source merge mismatch')
assert(parsed.source.validationResult.staticRegistryImportSucceeded === true, 'source import not accepted')
assert(parsed.source.validationResult.registryEntryCount === 1, 'source registry count mismatch')
assert(parsed.source.validationResult.registryExecutionEnabled === false, 'source registry execution widened')
assert(parsed.source.validationResult.safePayloadAcceptedByStaticContract === true, 'source safe static contract missing')
assert(parsed.source.validationResult.safePayloadAcceptedForDispatch === false, 'source safe payload accepted for dispatch')
assert(parsed.source.validationResult.blockedPayloadRejected === true, 'source blocked payload not rejected')
assert(parsed.source.validationResult.expressRouteRegistered === false, 'source express route registered')
assert(parsed.source.validationResult.workerDispatchExecutionEnabled === false, 'source worker dispatch widened')
assert(parsed.source.validationResult.routeExecutionEnabled === false, 'source route execution widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(parsed.sourceProof.staticRegistryImportSucceeded === true, 'source proof import failed')
assert(parsed.sourceProof.registryEntryCount === 1, 'source proof registry count mismatch')
assert(parsed.sourceProof.registryExecutionEnabled === false, 'source proof registry execution widened')
assert(parsed.sourceProof.registryEntryFound === true, 'source proof registry entry missing')
assert(parsed.sourceProof.safePayloadAcceptedByStaticContract === true, 'source proof safe static contract missing')
assert(parsed.sourceProof.safePayloadAcceptedForDispatch === false, 'source proof dispatch accepted')
assert(parsed.sourceProof.blockedPayloadRejected === true, 'source proof blocked payload not rejected')
assert(parsed.sourceProof.noWorkerExecution === true, 'source proof worker block missing')
assert(parsed.sourceProof.noRouteExecution === true, 'source proof route block missing')
assert(parsed.sourceProof.noSupabaseMutation === true, 'source proof Supabase block missing')
assert(parsed.sourceProof.noSqlExecution === true, 'source proof SQL block missing')
assert(parsed.sourceProof.noMediaProcessing === true, 'source proof media block missing')
assert(parsed.sourceProof.noArtifactCreated === true, 'source proof artifact block missing')
assert(parsed.sourceProof.expressRouteRegistered === false, 'source proof express route registered')
assert(parsed.sourceProof.workerDispatchExecutionEnabled === false, 'source proof dispatch widened')
assert(parsed.sourceProof.routeExecutionEnabled === false, 'source proof route execution widened')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationReview === true, 'source prompt static review missing')
assert(parsed.sourcePrompt.reviewScope.allowRegistryIndexExportPlanning === true, 'source prompt index planning missing')
assert(parsed.sourcePrompt.reviewScope.allowIndexExportChangeToday === false, 'source prompt index change widened')
assert(parsed.sourcePrompt.reviewScope.allowExistingExpressRouteMutation === false, 'source prompt route mutation widened')
assert(parsed.sourcePrompt.reviewScope.allowExpressRouteRegistration === false, 'source prompt express route widened')
assert(parsed.sourcePrompt.reviewScope.allowWorkerDispatchExecution === false, 'source prompt dispatch widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2220, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '0b06eb651869264e9eafc36d8b29167914b03450', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.staticRegistryValidationAccepted === true, 'static validation not accepted')
assert(parsed.result.ownerReviewResult.registryIndexExportPlanningMayProceed === true, 'index export planning not accepted')
assert(parsed.result.ownerReviewResult.registryPath === registryPath, 'registry path mismatch')
assert(parsed.result.ownerReviewResult.indexPath === indexPath, 'index path mismatch')
assert(parsed.result.ownerReviewResult.indexExportChangedToday === false, 'index export changed today')
assert(parsed.result.ownerReviewResult.existingAdjacentExpressRouteMutatedToday === false, 'adjacent route mutated today')
assert(parsed.result.ownerReviewResult.expressRouteRegisteredToday === false, 'express route registered today')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'worker dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'route execution widened')
assert(parsed.result.ownerReviewResult.supabaseMutationEnabled === false, 'Supabase widened')
assert(parsed.result.ownerReviewResult.sqlExecutionEnabled === false, 'SQL widened')
assert(parsed.result.ownerReviewResult.mediaProcessingEnabled === false, 'media widened')
assert(parsed.result.ownerReviewResult.artifactCreationEnabled === false, 'artifact widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForRegistryIndexExportPlanning === true, 'acceptance index planning missing')
assert(parsed.acceptance.acceptedRegistryPath === registryPath, 'acceptance registry path mismatch')
assert(parsed.acceptance.acceptedIndexPath === indexPath, 'acceptance index path mismatch')
assert(parsed.acceptance.acceptedSymbolsForFuturePlan.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY'), 'registry entry symbol missing')
assert(parsed.acceptance.acceptedSymbolsForFuturePlan.includes('assertSoundCpuDisabledRouteRegistryExecutionBlocked'), 'assertion symbol missing')
assert(parsed.acceptance.acceptedForIndexExportChangeToday === false, 'acceptance index changed today')
assert(parsed.acceptance.acceptedForExpressRouteRegistrationToday === false, 'acceptance express route widened')
assert(parsed.acceptance.acceptedForWorkerDispatchExecutionToday === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedForRouteExecutionToday === false, 'acceptance route widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.indexExportPlanningMayProceed === true, 'readiness index planning missing')
assert(parsed.readiness.reviewInputs.includes(registryPath), 'readiness registry input missing')
assert(parsed.readiness.reviewInputs.includes(indexPath), 'readiness index input missing')
assert(parsed.readiness.indexExportChangedToday === false, 'readiness index changed today')
assert(parsed.readiness.stillForbidden.includes('index_export_source_change'), 'index source change blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE172-DISABLED-ROUTE-REGISTRY-INDEX-EXPORT-PLAN', 'readiness next prompt mismatch')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.staticRegistryValidationAccepted === true, 'claim policy static validation missing')
assert(parsed.claimPolicy.allowedClaims.registryIndexExportPlanningMayProceed === true, 'claim policy index planning missing')
assert(parsed.claimPolicy.allowedClaims.indexExportChangedToday === false, 'claim policy index changed')
assert(parsed.claimPolicy.allowedClaims.expressRouteRegistered === false, 'claim policy express route widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'claim policy route widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowRegistryIndexExportPlan === true, 'next prompt index planning missing')
assert(parsed.nextPrompt.planningScope.allowIndexExportSourceChange === false, 'next prompt index source widened')
assert(parsed.nextPrompt.planningScope.allowExistingExpressRouteMutation === false, 'next prompt route mutation widened')
assert(parsed.nextPrompt.planningScope.allowExpressRouteRegistration === false, 'next prompt express route widened')
assert(parsed.nextPrompt.planningScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase171-disabled-route-registration-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase171-disabled-route-registration-source-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2220,
      staticRegistryValidationAccepted: true,
      registryIndexExportPlanningMayProceed: true,
      indexExportChangedToday: false,
      expressRouteRegistered: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE172-DISABLED-ROUTE-REGISTRY-INDEX-EXPORT-PLAN',
    },
    null,
    2,
  ),
)
