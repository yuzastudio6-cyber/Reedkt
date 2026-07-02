import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase173_disabled_route_registry_index_export_owner_review_passed_with_warnings_ready_for_actual_registry_index_export_source_creation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase174_actual_disabled_route_registry_index_export_source_creation_completed_with_warnings_ready_for_registry_index_export_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase175_disabled_route_registry_index_export_static_validation_passed_with_warnings_ready_for_registry_index_export_source_owner_review'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase173-disabled-route-registry-index-export-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-creation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-result.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase174-registry-index-export-source-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase174-registry-index-export-static-validation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase174-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase174-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation.md',
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
    'registrySourceMutated',
    'disabledRouteSourceMutated',
    'existingAdjacentExpressRouteMutated',
    'expressRouteRegistered',
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
    'allowRegistrySourceMutation',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase173-disabled-route-registry-index-export-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-creation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-result'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase174-registry-index-export-source-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase174-registry-index-export-static-validation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase174-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase174-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation'),
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
assert(indexSource.includes("from './disabled-route-registry.ts'"), 'registry index export missing')
assert(indexSource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED'), 'registry execution flag export missing')
assert(indexSource.includes('assertSoundCpuDisabledRouteRegistryExecutionBlocked'), 'registry assertion export missing')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2224, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'bd1b7a4f597132072126082a2c0d5293bc72ab5b', 'source merge mismatch')
assert(parsed.source.ownerReviewResult.registryIndexExportPlanAccepted === true, 'source plan not accepted')
assert(parsed.source.ownerReviewResult.actualRegistryIndexExportSourceCreationMayProceed === true, 'source creation not accepted')
assert(parsed.source.ownerReviewResult.indexExportSourceChangeMadeToday === false, 'source already changed')
assert(parsed.source.ownerReviewResult.registrySourceMutatedToday === false, 'source registry mutated')
assert(parsed.source.ownerReviewResult.expressRouteRegisteredToday === false, 'source express route registered')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.ownerReviewResult.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.sourceCreationScope.allowIndexExportSourceChange === true, 'source prompt index export missing')
assert(parsed.sourcePrompt.sourceCreationScope.allowRegistrySourceMutation === false, 'source prompt registry mutation widened')
assert(parsed.sourcePrompt.sourceCreationScope.allowExistingExpressRouteMutation === false, 'source prompt route mutation widened')
assert(parsed.sourcePrompt.sourceCreationScope.allowExpressRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.sourceCreationScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2227, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'afec6864bf351c3a18c84ce4fcdb128ba9ad97cc', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.sourceChange.indexExportAdded === true, 'index export not added')
assert(parsed.result.sourceChange.indexPath === indexPath, 'result index path mismatch')
assert(parsed.result.sourceChange.registryPath === registryPath, 'result registry path mismatch')
assert(parsed.result.sourceChange.registrySourceChanged === false, 'registry source changed')
assert(parsed.result.sourceChange.disabledRouteSourceChanged === false, 'disabled route source changed')
assert(parsed.result.sourceChange.existingAdjacentExpressRouteMutated === false, 'adjacent route mutated')
assert(parsed.result.sourceChange.expressRouteRegistered === false, 'express route registered')
assert(parsed.result.sourceChange.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.sourceChange.routeExecutionEnabled === false, 'route widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.register.indexPath === indexPath, 'register index path mismatch')
assert(parsed.register.registryPath === registryPath, 'register registry path mismatch')
assert(parsed.register.exportedSymbols.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY'), 'registry entry export missing')
assert(parsed.register.exportedSymbols.includes('assertSoundCpuDisabledRouteRegistryExecutionBlocked'), 'registry assertion export missing')
assert(parsed.register.exportedTypes.includes('SoundCpuDisabledRouteRegistryEntry'), 'registry type export missing')
assert(parsed.register.registryExecutionEnabled === false, 'register registry execution widened')
assert(parsed.register.acceptedForDispatch === false, 'register dispatch widened')
assert(parsed.register.routeExecutionEnabled === false, 'register route widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.staticValidationMayProceed === true, 'static validation readiness missing')
assert(parsed.readiness.registrySourceChanged === false, 'readiness registry source changed')
assert(parsed.readiness.disabledRouteSourceChanged === false, 'readiness disabled route source changed')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE175-DISABLED-ROUTE-REGISTRY-INDEX-EXPORT-STATIC-VALIDATION', 'readiness next prompt mismatch')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.indexExportAdded === true, 'claim policy index export missing')
assert(parsed.claimPolicy.allowedClaims.staticValidationMayProceed === true, 'claim policy validation missing')
assert(parsed.claimPolicy.allowedClaims.registrySourceChanged === false, 'claim policy registry source changed')
assert(parsed.claimPolicy.allowedClaims.disabledRouteSourceChanged === false, 'claim policy disabled route source changed')
assert(parsed.claimPolicy.allowedClaims.expressRouteRegistered === false, 'claim policy express route widened')
assert(parsed.claimPolicy.allowedClaims.workerDispatchExecutionEnabled === false, 'claim policy dispatch widened')
assert(parsed.claimPolicy.allowedClaims.routeExecutionEnabled === false, 'claim policy route widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.allowStaticIndexImportValidation === true, 'next prompt static validation missing')
assert(parsed.nextPrompt.validationScope.allowRegistryResultCheck === true, 'next prompt registry result missing')
assert(parsed.nextPrompt.validationScope.allowRegistrySourceMutation === false, 'next prompt registry mutation widened')
assert(parsed.nextPrompt.validationScope.allowExpressRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase174-actual-disabled-route-registry-index-export-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-creation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2227,
      indexExportAdded: true,
      registrySourceChanged: false,
      disabledRouteSourceChanged: false,
      expressRouteRegistered: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE175-DISABLED-ROUTE-REGISTRY-INDEX-EXPORT-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
