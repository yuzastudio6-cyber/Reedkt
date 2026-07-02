import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase174_actual_disabled_route_registry_index_export_source_creation_completed_with_warnings_ready_for_registry_index_export_static_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase175_disabled_route_registry_index_export_static_validation_passed_with_warnings_ready_for_registry_index_export_source_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase176_disabled_route_registry_index_export_source_owner_review_passed_with_warnings_ready_for_disabled_route_registry_app_registration_plan'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation-result.md',
  proofOutput: 'docs/worker-runtime-jobs-sound-cpu-phase175-static-registry-index-proof-output.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase175-registry-index-export-source-owner-review-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase175-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase175-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review.md',
  runner: 'scripts/validation/worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation-runner.ts',
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
    'allowExistingExpressRouteMutation',
    'allowExpressRouteRegistrationToday',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase174-actual-disabled-route-registry-index-export-source-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation-result'),
  proofOutput: parseJsonBlock(docs.proofOutput, 'worker-runtime-jobs-sound-cpu-phase175-static-registry-index-proof-output'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase175-registry-index-export-source-owner-review-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase175-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase175-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase176-disabled-route-registry-index-export-source-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexSource = read(indexPath)
const registrySource = read(registryPath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)
const runner = read(docs.runner)

assert(indexSource.includes("from './disabled-route-registry.ts'"), 'registry index export missing')
assert(indexSource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY'), 'registry export symbol missing')
assert(indexSource.includes('assertSoundCpuDisabledRouteRegistryExecutionBlocked'), 'registry assertion export missing')
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry execution flag widened')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry dispatch block missing')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')
assert(runner.includes("from '../../server/workers/sound-cpu/index.ts'"), 'runner must import through index')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2227, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'afec6864bf351c3a18c84ce4fcdb128ba9ad97cc', 'source merge mismatch')
assert(parsed.source.sourceChange.indexExportAdded === true, 'source index export missing')
assert(parsed.source.sourceChange.registrySourceChanged === false, 'source registry changed')
assert(parsed.source.sourceChange.expressRouteRegistered === false, 'source route registered')
assert(parsed.source.sourceChange.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.sourceChange.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.validationScope.allowStaticIndexImportValidation === true, 'source prompt static validation missing')
assert(parsed.sourcePrompt.validationScope.allowRegistryResultCheck === true, 'source prompt registry result missing')
assert(parsed.sourcePrompt.validationScope.allowWorkerDispatchExecution === false, 'source prompt dispatch widened')
assert(parsed.sourcePrompt.validationScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2231, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'e09ac81e1aad34cd17aa408f759a1b6fa0223f65', 'result source merge mismatch')
assert(parsed.result.validationResult.staticIndexImportSucceeded === true, 'static index import failed')
assert(parsed.result.validationResult.registryExportResolved === true, 'registry export unresolved')
assert(parsed.result.validationResult.registryEntryCount === 1, 'registry count mismatch')
assert(parsed.result.validationResult.registryExecutionEnabled === false, 'registry execution widened')
assert(parsed.result.validationResult.safePayloadAcceptedForDispatch === false, 'safe payload accepted for dispatch')
assert(parsed.result.validationResult.blockedPayloadRejected === true, 'blocked payload not rejected')
assert(parsed.result.validationResult.assertionThrows === true, 'assertion did not throw')
assert(parsed.result.validationResult.expressRouteRegistered === false, 'result route registered')
assert(parsed.result.validationResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.validationResult.routeExecutionEnabled === false, 'result route widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.proofOutput.decision === decision, 'proof decision mismatch')
assert(parsed.proofOutput.staticIndexImportSucceeded === true, 'proof import failed')
assert(parsed.proofOutput.registryExportResolved === true, 'proof registry export unresolved')
assert(parsed.proofOutput.registryEntryCount === 1, 'proof registry count mismatch')
assert(parsed.proofOutput.registryExecutionEnabled === false, 'proof registry execution widened')
assert(parsed.proofOutput.registryEntryFound === true, 'proof registry entry missing')
assert(parsed.proofOutput.safePayloadAcceptedByStaticContract === true, 'proof safe payload invalid')
assert(parsed.proofOutput.safePayloadAcceptedForDispatch === false, 'proof dispatch accepted')
assert(parsed.proofOutput.blockedPayloadRejected === true, 'proof blocked payload not rejected')
assert(parsed.proofOutput.noWorkerExecution === true, 'proof worker block missing')
assert(parsed.proofOutput.noRouteExecution === true, 'proof route block missing')
assert(parsed.proofOutput.expressRouteRegistered === false, 'proof route registered')
assert(parsed.proofOutput.workerDispatchExecutionEnabled === false, 'proof dispatch widened')
assert(parsed.proofOutput.routeExecutionEnabled === false, 'proof route widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.ownerReviewMayProceed === true, 'owner review readiness missing')
assert(parsed.readiness.staticIndexImportValidationAccepted === true, 'static validation readiness missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE176-DISABLED-ROUTE-REGISTRY-INDEX-EXPORT-SOURCE-OWNER-REVIEW', 'readiness next prompt mismatch')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.staticIndexImportSucceeded === true, 'claim static import missing')
assert(parsed.claimPolicy.allowedClaims.registryExportResolved === true, 'claim registry export missing')
assert(parsed.claimPolicy.allowedClaims.registryExecutionEnabled === false, 'claim registry execution widened')
assert(parsed.claimPolicy.allowedClaims.safePayloadAcceptedForDispatch === false, 'claim dispatch widened')
assert(parsed.claimPolicy.allowedClaims.blockedPayloadRejected === true, 'claim blocked payload missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowStaticValidationReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowAppRegistrationPlanning === true, 'next prompt app planning missing')
assert(parsed.nextPrompt.reviewScope.allowExpressRouteRegistrationToday === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase175-disabled-route-registry-index-export-static-validation:proof'] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation-runner.ts',
  'package proof script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase175-disabled-route-registry-index-export-static-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase175-disabled-route-registry-index-export-static-validation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2231,
      staticIndexImportSucceeded: true,
      registryExportResolved: true,
      safePayloadAcceptedForDispatch: false,
      blockedPayloadRejected: true,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE176-DISABLED-ROUTE-REGISTRY-INDEX-EXPORT-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
