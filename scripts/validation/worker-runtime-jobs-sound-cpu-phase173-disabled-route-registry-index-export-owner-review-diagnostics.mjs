import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase172_disabled_route_registry_index_export_plan_completed_with_warnings_ready_for_registry_index_export_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase173_disabled_route_registry_index_export_owner_review_passed_with_warnings_ready_for_actual_registry_index_export_source_creation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase174_actual_disabled_route_registry_index_export_source_creation_completed_with_warnings_ready_for_registry_index_export_static_validation'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase173-disabled-route-registry-index-export-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase173-disabled-route-registry-index-export-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase173-actual-registry-index-export-source-creation-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase173-index-export-source-creation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase173-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase173-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-creation.md',
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
    'indexExportSourceChangeMadeToday',
    'actualIndexExportSourceChangeMade',
    'sourceChangeMadeToday',
    'registrySourceMutated',
    'registrySourceMutatedToday',
    'disabledRouteSourceMutated',
    'existingAdjacentExpressRouteMutated',
    'existingAdjacentExpressRouteMutatedToday',
    'expressRouteRegistered',
    'expressRouteRegisteredToday',
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
    'allowIndexExportSourceChangeToday',
    'allowRegistrySourceMutation',
    'allowDisabledRouteSourceMutation',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase173-disabled-route-registry-index-export-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase173-disabled-route-registry-index-export-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase173-actual-registry-index-export-source-creation-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase173-index-export-source-creation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase173-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase173-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-creation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const registrySource = read(registryPath)
const routeSource = read(routePath)
const indexSource = read(indexPath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)

assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry execution flag must be false')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry dispatch block missing')
assert(registrySource.includes('assertSoundCpuDisabledRouteRegistryExecutionBlocked'), 'registry blocked assertion missing')
assert(routeSource.includes('acceptedForDispatch: false'), 'disabled route source must stay fail-closed')
assert(indexSource.includes("from './disabled-dispatch-route.ts'"), 'existing disabled route index export missing')
assert(!indexSource.includes('./disabled-route-registry.ts'), 'registry index export must not be added in Phase173')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2223, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '7a87b046a8d6a2c869f1c58b728068044b979342', 'source merge mismatch')
assert(parsed.source.planResult.registryIndexExportPlanned === true, 'source plan missing')
assert(parsed.source.planResult.indexExportSourceChangeMadeToday === false, 'source index changed')
assert(parsed.source.planResult.existingAdjacentExpressRouteMutatedToday === false, 'source adjacent route mutated')
assert(parsed.source.planResult.expressRouteRegisteredToday === false, 'source express route registered')
assert(parsed.source.planResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.planResult.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowRegistryIndexExportPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowActualRegistryIndexExportSourceCreation === true, 'source prompt source creation missing')
assert(parsed.sourcePrompt.reviewScope.allowIndexExportSourceChangeToday === false, 'source prompt source change widened')
assert(parsed.sourcePrompt.reviewScope.allowRegistrySourceMutation === false, 'source prompt registry mutation widened')
assert(parsed.sourcePrompt.reviewScope.allowExpressRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2224, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'bd1b7a4f597132072126082a2c0d5293bc72ab5b', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.registryIndexExportPlanAccepted === true, 'owner review did not accept plan')
assert(parsed.result.ownerReviewResult.actualRegistryIndexExportSourceCreationMayProceed === true, 'source creation not accepted')
assert(parsed.result.ownerReviewResult.candidateIndexPath === indexPath, 'result index path mismatch')
assert(parsed.result.ownerReviewResult.candidateRegistryPath === registryPath, 'result registry path mismatch')
assert(parsed.result.ownerReviewResult.indexExportSourceChangeMadeToday === false, 'result index changed today')
assert(parsed.result.ownerReviewResult.registrySourceMutatedToday === false, 'result registry mutated today')
assert(parsed.result.ownerReviewResult.existingAdjacentExpressRouteMutatedToday === false, 'result adjacent route mutated')
assert(parsed.result.ownerReviewResult.expressRouteRegisteredToday === false, 'result express route registered')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'result route widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForActualRegistryIndexExportSourceCreation === true, 'acceptance source creation missing')
assert(parsed.acceptance.acceptedIndexPath === indexPath, 'acceptance index path mismatch')
assert(parsed.acceptance.acceptedRegistryPath === registryPath, 'acceptance registry path mismatch')
assert(parsed.acceptance.acceptedExportStatement.includes("from './disabled-route-registry.ts'"), 'accepted export source missing')
assert(parsed.acceptance.acceptedForIndexExportChangeToday === false, 'acceptance index changed today')
assert(parsed.acceptance.acceptedForRegistrySourceMutationToday === false, 'acceptance registry mutation widened')
assert(parsed.acceptance.acceptedForExpressRouteRegistrationToday === false, 'acceptance route registration widened')
assert(parsed.acceptance.acceptedForWorkerDispatchExecutionToday === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedForRouteExecutionToday === false, 'acceptance route widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.actualSourceCreationMayProceed === true, 'readiness source creation missing')
assert(parsed.readiness.sourceChangeTarget === indexPath, 'readiness target mismatch')
assert(parsed.readiness.exportSource === registryPath, 'readiness source mismatch')
assert(parsed.readiness.sourceChangeMadeToday === false, 'readiness source changed today')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')
assert(parsed.readiness.stillForbidden.includes('supabase_mutation'), 'Supabase blocker missing')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE174-ACTUAL-DISABLED-ROUTE-REGISTRY-INDEX-EXPORT-SOURCE-CREATION', 'readiness next prompt mismatch')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.registryIndexExportPlanAccepted === true, 'claim policy plan acceptance missing')
assert(parsed.claimPolicy.allowedClaims.actualRegistryIndexExportSourceCreationMayProceed === true, 'claim policy source creation missing')
assert(parsed.claimPolicy.allowedClaims.indexExportSourceChangeMadeToday === false, 'claim policy index changed today')
assert(parsed.claimPolicy.allowedClaims.registrySourceMutatedToday === false, 'claim policy registry mutated today')
assert(parsed.claimPolicy.allowedClaims.expressRouteRegistered === false, 'claim policy express route widened')
assert(parsed.claimPolicy.allowedClaims.workerDispatchExecutionEnabled === false, 'claim policy dispatch widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'claim policy route widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.sourceCreationScope.allowIndexExportSourceChange === true, 'next prompt source creation missing')
assert(parsed.nextPrompt.sourceCreationScope.allowRegistrySourceMutation === false, 'next prompt registry mutation widened')
assert(parsed.nextPrompt.sourceCreationScope.allowExistingExpressRouteMutation === false, 'next prompt adjacent route mutation widened')
assert(parsed.nextPrompt.sourceCreationScope.allowExpressRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.sourceCreationScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase173-disabled-route-registry-index-export-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase173-disabled-route-registry-index-export-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2224,
      registryIndexExportPlanAccepted: true,
      actualRegistryIndexExportSourceCreationMayProceed: true,
      indexExportSourceChangeMadeToday: false,
      expressRouteRegistered: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE174-ACTUAL-DISABLED-ROUTE-REGISTRY-INDEX-EXPORT-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
