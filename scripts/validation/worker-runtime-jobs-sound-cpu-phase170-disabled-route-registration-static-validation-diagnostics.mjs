import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase169_actual_disabled_route_registration_source_creation_completed_with_warnings_ready_for_registration_static_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase170_disabled_route_registration_static_validation_passed_with_warnings_ready_for_registration_source_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase171_disabled_route_registration_source_owner_review_passed_with_warnings_ready_for_registry_index_export_plan'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase169-actual-disabled-route-registration-source-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation-result.md',
  proofOutput: 'docs/worker-runtime-jobs-sound-cpu-phase170-static-registry-proof-output.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase170-registration-source-owner-review-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase170-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase170-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase171-disabled-route-registration-source-owner-review.md',
  runner: 'scripts/validation/worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation-runner.ts',
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
    'allowIndexExportChangeToday',
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

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase169-actual-disabled-route-registration-source-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation-result'),
  proofOutput: parseJsonBlock(docs.proofOutput, 'worker-runtime-jobs-sound-cpu-phase170-static-registry-proof-output'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase170-registration-source-owner-review-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase170-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase170-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase171-disabled-route-registration-source-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const registrySource = read(registryPath)
const routeSource = read(routePath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)
const runner = read(docs.runner)
assert(registrySource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const'), 'registry execution flag must be false')
assert(registrySource.includes('acceptedForDispatch: false'), 'registry dispatch block missing')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')
assert(runner.includes("from '../../server/workers/sound-cpu/disabled-route-registry.ts'"), 'runner must import registry directly')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2216, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '8f4f7fa6cba532b253afaf7eda263d560fe6e41b', 'source merge mismatch')
assert(parsed.source.sourceChange.registrySourceCreated === true, 'source registry not created')
assert(parsed.source.sourceChange.indexExportChanged === false, 'source index changed')
assert(parsed.source.sourceChange.expressRouteRegistered === false, 'source express route registered')
assert(parsed.source.sourceChange.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.validationScope.allowStaticSourceImportValidation === true, 'source prompt static import missing')
assert(parsed.sourcePrompt.validationScope.allowSafePayloadRegistryResultCheck === true, 'source prompt safe result missing')
assert(parsed.sourcePrompt.validationScope.allowIndexExportChange === false, 'source prompt index widened')
assert(parsed.sourcePrompt.validationScope.allowExpressRouteRegistration === false, 'source prompt express route widened')
assert(parsed.sourcePrompt.validationScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2217, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'a81f8c8018a20a221db4530c1877e0da9c4fce92', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.validationResult.staticRegistryImportSucceeded === true, 'static registry import failed')
assert(parsed.result.validationResult.registryEntryCount === 1, 'registry entry count mismatch')
assert(parsed.result.validationResult.registryExecutionEnabled === false, 'registry execution enabled')
assert(parsed.result.validationResult.safePayloadAcceptedForDispatch === false, 'safe payload accepted dispatch')
assert(parsed.result.validationResult.blockedPayloadRejected === true, 'blocked payload not rejected')
assert(parsed.result.validationResult.assertionThrows === true, 'assertion did not throw')
assert(parsed.result.validationResult.expressRouteRegistered === false, 'express route registered')
assert(parsed.result.validationResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.validationResult.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.proofOutput.decision === decision, 'proof decision mismatch')
assert(parsed.proofOutput.staticRegistryImportSucceeded === true, 'proof import failed')
assert(parsed.proofOutput.registryEntryCount === 1, 'proof entry count mismatch')
assert(parsed.proofOutput.registryExecutionEnabled === false, 'proof registry execution enabled')
assert(parsed.proofOutput.registryEntryFound === true, 'proof registry entry missing')
assert(parsed.proofOutput.safePayloadAcceptedByStaticContract === true, 'proof safe payload invalid')
assert(parsed.proofOutput.safePayloadAcceptedForDispatch === false, 'proof accepted dispatch')
assert(parsed.proofOutput.blockedPayloadRejected === true, 'proof blocked payload not rejected')
assert(parsed.proofOutput.blockedPayloadReason === 'runtime_flag_not_disabled', 'proof blocked reason mismatch')
assert(parsed.proofOutput.assertionThrows === true, 'proof assertion did not throw')
assert(parsed.proofOutput.assertionReasonMatches === true, 'proof assertion reason mismatch')
assert(parsed.proofOutput.noWorkerExecution === true, 'proof worker execution block missing')
assert(parsed.proofOutput.noRouteExecution === true, 'proof route execution block missing')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.ownerReviewMayProceed === true, 'owner review readiness missing')
assert(parsed.readiness.indexExportApprovedToday === false, 'index export approved today')
assert(parsed.readiness.expressRouteRegistrationApprovedToday === false, 'express route registration approved today')
assert(parsed.readiness.stillForbidden.includes('index_export_change'), 'index export blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.staticRegistryImportSucceeded === true, 'static import claim missing')
assert(parsed.claimPolicy.allowedClaims.registrySourceOwnerReviewMayProceed === true, 'owner review claim missing')
assert(parsed.claimPolicy.allowedClaims.safePayloadAcceptedForDispatch === false, 'dispatch claim widened')
assert(parsed.claimPolicy.allowedClaims.registryExecutionEnabled === false, 'execution claim widened')
assert(parsed.claimPolicy.allowedClaims.expressRouteRegistered === false, 'express route claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowStaticValidationReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowRegistryIndexExportPlanning === true, 'next prompt index planning missing')
assert(parsed.nextPrompt.reviewScope.allowIndexExportChangeToday === false, 'next prompt index widened')
assert(parsed.nextPrompt.reviewScope.allowExpressRouteRegistration === false, 'next prompt express route widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase170-disabled-route-registration-static-validation:proof'] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation-runner.ts',
  'package proof script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase170-disabled-route-registration-static-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase170-disabled-route-registration-static-validation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2217,
      staticRegistryImportSucceeded: true,
      registryEntryCount: 1,
      safePayloadAcceptedForDispatch: false,
      blockedPayloadRejected: true,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE171-DISABLED-ROUTE-REGISTRATION-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
