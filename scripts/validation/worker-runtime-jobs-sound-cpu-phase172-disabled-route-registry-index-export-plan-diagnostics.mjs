import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase171_disabled_route_registration_source_owner_review_passed_with_warnings_ready_for_registry_index_export_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase172_disabled_route_registry_index_export_plan_completed_with_warnings_ready_for_registry_index_export_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase173_disabled_route_registry_index_export_owner_review_passed_with_warnings_ready_for_actual_registry_index_export_source_creation'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase171-disabled-route-registration-source-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan-result.md',
  candidate: 'docs/worker-runtime-jobs-sound-cpu-phase172-registry-index-export-candidate-register.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase172-index-export-source-change-safety-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase172-registry-index-export-owner-review-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase172-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase172-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase173-disabled-route-registry-index-export-owner-review.md',
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
    'sourceChangeApprovedToday',
    'registrySourceMutated',
    'disabledRouteSourceMutated',
    'existingAdjacentExpressRouteMutated',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase171-disabled-route-registration-source-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan-result'),
  candidate: parseJsonBlock(docs.candidate, 'worker-runtime-jobs-sound-cpu-phase172-registry-index-export-candidate-register'),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase172-index-export-source-change-safety-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase172-registry-index-export-owner-review-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase172-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase172-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase173-disabled-route-registry-index-export-owner-review'),
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
assert(!indexSource.includes('./disabled-route-registry.ts'), 'registry index export must not be added in Phase172')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2220, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '0b06eb651869264e9eafc36d8b29167914b03450', 'source merge mismatch')
assert(parsed.source.ownerReviewResult.staticRegistryValidationAccepted === true, 'source static validation not accepted')
assert(parsed.source.ownerReviewResult.registryIndexExportPlanningMayProceed === true, 'source index planning not allowed')
assert(parsed.source.ownerReviewResult.indexExportChangedToday === false, 'source index export changed')
assert(parsed.source.ownerReviewResult.existingAdjacentExpressRouteMutatedToday === false, 'source adjacent route mutated')
assert(parsed.source.ownerReviewResult.expressRouteRegisteredToday === false, 'source express route registered')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.ownerReviewResult.routeExecutionEnabled === false, 'source route execution widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowRegistryIndexExportPlan === true, 'source prompt plan missing')
assert(parsed.sourcePrompt.planningScope.allowIndexExportSourceChange === false, 'source prompt source change widened')
assert(parsed.sourcePrompt.planningScope.allowExistingExpressRouteMutation === false, 'source prompt route mutation widened')
assert(parsed.sourcePrompt.planningScope.allowExpressRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.planningScope.allowWorkerDispatchExecution === false, 'source prompt dispatch widened')
assert(parsed.sourcePrompt.planningScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2223, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '7a87b046a8d6a2c869f1c58b728068044b979342', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.registryIndexExportPlanned === true, 'registry index export plan missing')
assert(parsed.result.planResult.candidateIndexPath === indexPath, 'candidate index mismatch')
assert(parsed.result.planResult.candidateRegistryPath === registryPath, 'candidate registry mismatch')
assert(parsed.result.planResult.plannedExports.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY'), 'registry entry export missing')
assert(parsed.result.planResult.plannedExports.includes('assertSoundCpuDisabledRouteRegistryExecutionBlocked'), 'registry assertion export missing')
assert(parsed.result.planResult.plannedTypeExports.includes('SoundCpuDisabledRouteRegistryEntry'), 'registry type export missing')
assert(parsed.result.planResult.indexExportSourceChangeMadeToday === false, 'index source change made today')
assert(parsed.result.planResult.existingAdjacentExpressRouteMutatedToday === false, 'adjacent route mutated today')
assert(parsed.result.planResult.expressRouteRegisteredToday === false, 'express route registered today')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.candidate.candidateIndexPath === indexPath, 'candidate index path mismatch')
assert(parsed.candidate.candidateRegistryPath === registryPath, 'candidate registry path mismatch')
assert(parsed.candidate.requiresSourceChangeLater === true, 'candidate future source change missing')
assert(parsed.candidate.sourceChangeMadeToday === false, 'candidate source change made today')
assert(parsed.candidate.mustAvoidImportCycle === true, 'candidate cycle safety missing')
assert(parsed.candidate.mustPreserveAcceptedForDispatchFalse === true, 'candidate dispatch block missing')
assert(parsed.candidate.mustPreserveRegistryExecutionEnabledFalse === true, 'candidate registry execution block missing')

assert(parsed.safety.futureSourceChangeRules.onlyModifyIndexPath === indexPath, 'safety index path mismatch')
assert(parsed.safety.futureSourceChangeRules.onlyAddExportFrom === registryPath, 'safety registry path mismatch')
assert(parsed.safety.futureSourceChangeRules.doNotModifyRegistrySource === true, 'safety registry mutation missing')
assert(parsed.safety.futureSourceChangeRules.doNotMutateExistingAdjacentExpressRoute === true, 'safety adjacent route mutation missing')
assert(parsed.safety.futureSourceChangeRules.doNotRegisterRoute === true, 'safety route registration missing')
assert(parsed.safety.futureSourceChangeRules.doNotEnableWorkerDispatch === true, 'safety dispatch missing')
assert(parsed.safety.futureSourceChangeRules.doNotEnableRouteExecution === true, 'safety route execution missing')
assert(parsed.safety.sourceChangeMadeToday === false, 'safety source change made today')
assert(parsed.safety.ownerReviewRequiredBeforeSourceChange === true, 'owner review missing')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.ownerReviewMayProceed === true, 'owner review readiness missing')
assert(parsed.readiness.plannedSourceChangeTarget === indexPath, 'readiness target mismatch')
assert(parsed.readiness.plannedExportSource === registryPath, 'readiness source mismatch')
assert(parsed.readiness.sourceChangeApprovedToday === false, 'source change approved today')
assert(parsed.readiness.stillForbidden.includes('index_export_source_change'), 'index source blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.registryIndexExportPlanned === true, 'index export planned claim missing')
assert(parsed.claimPolicy.allowedClaims.registryIndexExportOwnerReviewMayProceed === true, 'owner review claim missing')
assert(parsed.claimPolicy.allowedClaims.indexExportSourceChangeMadeToday === false, 'index source change claim widened')
assert(parsed.claimPolicy.allowedClaims.expressRouteRegistered === false, 'express route claim widened')
assert(parsed.claimPolicy.allowedClaims.workerDispatchExecutionEnabled === false, 'dispatch claim widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'route claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowRegistryIndexExportPlanReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowActualRegistryIndexExportSourceCreation === true, 'next prompt source creation path missing')
assert(parsed.nextPrompt.reviewScope.allowIndexExportSourceChangeToday === false, 'next prompt source change widened')
assert(parsed.nextPrompt.reviewScope.allowRegistrySourceMutation === false, 'next prompt registry mutation widened')
assert(parsed.nextPrompt.reviewScope.allowExpressRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase172-disabled-route-registry-index-export-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2223,
      registryIndexExportPlanned: true,
      candidateIndexPath: indexPath,
      candidateRegistryPath: registryPath,
      indexExportSourceChangeMadeToday: false,
      expressRouteRegistered: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE173-DISABLED-ROUTE-REGISTRY-INDEX-EXPORT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
