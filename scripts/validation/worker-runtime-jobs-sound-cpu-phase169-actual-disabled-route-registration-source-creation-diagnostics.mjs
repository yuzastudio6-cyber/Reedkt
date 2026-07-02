import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase168_disabled_route_registration_owner_review_passed_with_warnings_ready_for_actual_disabled_route_registration_source_creation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase169_actual_disabled_route_registration_source_creation_completed_with_warnings_ready_for_registration_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase170_disabled_route_registration_static_validation_passed_with_warnings_ready_for_registration_source_owner_review'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase168-disabled-route-registration-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase169-actual-disabled-route-registration-source-creation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase169-actual-disabled-route-registration-source-result.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase169-disabled-route-registry-source-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase169-registration-static-validation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase169-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase169-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation.md',
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
    'existingAdjacentExpressRouteMutated',
    'expressRouteRegistered',
    'appRouteRegisteredToday',
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
    'allowIndexExportChange',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase168-disabled-route-registration-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase169-actual-disabled-route-registration-source-creation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase169-actual-disabled-route-registration-source-result'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase169-disabled-route-registry-source-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase169-registration-static-validation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase169-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase169-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const registrySource = read(registryPath)
const routeSource = read(routePath)
const indexText = read(indexPath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)

assert(registrySource.includes("from './disabled-dispatch-route.ts'"), 'registry must reference disabled route source')
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry execution flag must be false')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry must preserve dispatch block')
assert(registrySource.includes('noWorkerExecution: true'), 'registry worker block missing')
assert(registrySource.includes('noRouteExecution: true'), 'registry route block missing')
assert(registrySource.includes('noSupabaseMutation: true'), 'registry Supabase block missing')
assert(registrySource.includes('assertSoundCpuDisabledRouteRegistryExecutionBlocked'), 'registry blocked assertion missing')
assert(!registrySource.includes('Router'), 'registry must not create Express router')
assert(!registrySource.includes('requireAuth'), 'registry must not import route auth')
assert(!registrySource.includes('process.env.REEDITPRO_WORKER_EXECUTION_ENABLED = true'), 'registry must not enable worker env')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(indexText.includes("from './disabled-dispatch-route.ts'"), 'existing disabled route index export missing')
assert(
  !indexText.includes('./disabled-route-registry.ts') || phase174RegistryIndexExportEvidenceExists(),
  'registry index export must not exist before Phase174 evidence',
)
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2214, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '684402d1484847fa2b6b2839bd0944132d48e869', 'source merge mismatch')
assert(parsed.source.ownerReviewResult.disabledRouteRegistrationPlanAccepted === true, 'source plan not accepted')
assert(parsed.source.ownerReviewResult.actualDisabledRouteRegistrySourceCreationMayProceed === true, 'source creation not accepted')
assert(parsed.source.ownerReviewResult.registrySourceCreatedToday === false, 'source registry already created')
assert(parsed.source.ownerReviewResult.appRouteRegisteredToday === false, 'source app route registered')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.sourceCreationScope.allowCreateDisabledRouteRegistrySource === true, 'source prompt source creation missing')
assert(parsed.sourcePrompt.sourceCreationScope.allowIndexExportChange === false, 'source prompt index widened')
assert(parsed.sourcePrompt.sourceCreationScope.allowExpressRouteRegistration === false, 'source prompt express route widened')
assert(parsed.sourcePrompt.sourceCreationScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2216, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '8f4f7fa6cba532b253afaf7eda263d560fe6e41b', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.sourceChange.registrySourceCreated === true, 'registry source not created')
assert(parsed.result.sourceChange.registryPath === registryPath, 'registry path mismatch')
assert(parsed.result.sourceChange.indexExportChanged === false, 'index changed')
assert(parsed.result.sourceChange.existingAdjacentExpressRouteMutated === false, 'adjacent route mutated')
assert(parsed.result.sourceChange.expressRouteRegistered === false, 'express route registered')
assert(parsed.result.sourceChange.acceptedForDispatch === false, 'dispatch accepted')
assert(parsed.result.sourceChange.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.sourceChange.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.register.registryPath === registryPath, 'register registry path mismatch')
assert(parsed.register.routePath === routePath, 'register route path mismatch')
assert(parsed.register.indexPath === indexPath, 'register index path mismatch')
assert(parsed.register.adjacentExpressRoutePath === adjacentExpressRoutePath, 'register adjacent route path mismatch')
assert(parsed.register.exportedSymbols.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY'), 'registry entry export missing')
assert(parsed.register.exportedSymbols.includes('assertSoundCpuDisabledRouteRegistryExecutionBlocked'), 'blocked assertion export missing')
assert(parsed.register.acceptedForDispatch === false, 'register dispatch accepted')
assert(parsed.register.executionEnabled === false, 'register execution enabled')
assert(parsed.register.noWorkerExecution === true, 'register worker block missing')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.staticValidationMayProceed === true, 'static validation readiness missing')
assert(parsed.readiness.indexExportValidationDeferred === true, 'index export validation should be deferred')
assert(parsed.readiness.stillForbidden.includes('index_export_change'), 'index export blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.registrySourceCreated === true, 'registry source created claim missing')
assert(parsed.claimPolicy.allowedClaims.staticValidationMayProceed === true, 'static validation claim missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForDispatch === false, 'dispatch claim widened')
assert(parsed.claimPolicy.allowedClaims.executionEnabled === false, 'execution claim widened')
assert(parsed.claimPolicy.allowedClaims.expressRouteRegistered === false, 'express route claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.allowStaticSourceImportValidation === true, 'next prompt static import missing')
assert(parsed.nextPrompt.validationScope.allowIndexExportChange === false, 'next prompt index widened')
assert(parsed.nextPrompt.validationScope.allowExpressRouteRegistration === false, 'next prompt express route widened')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase169-actual-disabled-route-registration-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase169-actual-disabled-route-registration-source-creation-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2216,
      registrySourceCreated: true,
      indexExportChanged: false,
      expressRouteRegistered: false,
      acceptedForDispatch: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE170-DISABLED-ROUTE-REGISTRATION-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
