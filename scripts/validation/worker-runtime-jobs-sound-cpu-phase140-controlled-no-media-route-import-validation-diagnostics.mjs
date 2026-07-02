import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase139_static_route_source_owner_review_passed_with_warnings_ready_for_controlled_no_media_route_import_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase140_controlled_no_media_route_import_validation_passed_with_warnings_ready_for_route_registration_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-review-result.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation-result.md',
  proof: 'docs/worker-runtime-jobs-sound-cpu-phase140-import-proof-register.md',
  exports: 'docs/worker-runtime-jobs-sound-cpu-phase140-route-export-inspection-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase140-no-route-execution-policy.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase140-route-registration-plan-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase140-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase141-route-registration-plan.md',
}

const runner = 'scripts/validation/worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation-runner.ts'

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoOpClassification(record, label) {
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
    'routeRegistered',
    'routeExecutionEnabled',
    'workerDispatchExecutionEnabled',
    'workerLeaseMutationEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'toolRuntimeExecutionAgainstUserAssetsEnabled',
    'mediaProcessingEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'storageObjectCreationEnabled',
    'signedUrlCreationEnabled',
    'publicArtifactCreationEnabled',
    'creditMutationEnabled',
    'productionUnlockEnabled',
    'allowRouteExecution',
    'allowWorkerDispatchExecution',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowStorageObjectCreation',
    'allowRealUserMediaBetaEnablement',
    'allowPaidProduction',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-review-result'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation-result'),
  proof: parseJsonBlock(docs.proof, 'worker-runtime-jobs-sound-cpu-phase140-import-proof-register'),
  exports: parseJsonBlock(docs.exports, 'worker-runtime-jobs-sound-cpu-phase140-route-export-inspection-register'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase140-no-route-execution-policy'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase140-route-registration-plan-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase140-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-plan'),
}

for (const file of [...Object.values(docs), runner]) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReview.controlledNoMediaRouteImportValidationMayProceed === true, 'source next missing')
assert(parsed.source.ownerReview.routeExecutionEnabled === false, 'source route widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.validationScope.controlledImportValidationOnly === true, 'prompt import scope missing')
assert(parsed.prompt.validationScope.allowRouteExecution === false, 'prompt route widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2150, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '4c7bcb11a23b67075cabbca2394fd8d8e6437369', 'source merge mismatch')
assert(parsed.result.importValidationResult.routeModuleImported === true, 'route import missing')
assert(parsed.result.importValidationResult.schemaModuleImported === true, 'schema import missing')
assert(parsed.result.importValidationResult.routeFactoryInvoked === false, 'route factory invoked')
assert(parsed.result.importValidationResult.routeExecutionEnabled === false, 'route execution widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.proof.proofRunner === runner, 'proof runner mismatch')
assert(parsed.proof.importedModules.includes('server/routes/sound-cpu-worker-routes.ts'), 'route module proof missing')
assert(parsed.proof.proofOutput.routeFactoryInvoked === false, 'proof invoked route factory')
assert(parsed.proof.proofOutput.routeExecutionEnabled === false, 'proof route widened')

assert(parsed.exports.routeExports.includes('createSoundCpuWorkerRoutes'), 'route factory export missing')
assert(parsed.exports.acceptedWorkerNames.length === 2, 'worker count mismatch')
assert(parsed.exports.acceptedImages.length === 2, 'image count mismatch')
assert(parsed.exports.acceptedJobTypes.length === 4, 'job type count mismatch')

assertFalseMap(parsed.policy.closedGates, 'policy.closedGates')
assert(parsed.blocker.unblockedForNextPlanning.includes('route_registration_plan'), 'route registration plan next missing')
assertFalseMap(parsed.blocker.notUnblockedByThisGate, 'blocker.notUnblockedByThisGate')

assert(parsed.claimPolicy.allowedClaims.controlledNoMediaRouteImportValidationPassed === true, 'import claim missing')
assert(parsed.claimPolicy.allowedClaims.routeRegistrationPlanMayProceed === true, 'registration plan claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.planningScope.planRouteRegistrationOnly === true, 'next prompt scope missing')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.planningScope.allowRouteRegistrationSourceChange === false, 'next prompt registration source widened')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const runnerSource = read(runner)
assert(runnerSource.includes('await import(routeModulePath)'), 'runner route import missing')
assert(runnerSource.includes('await import(schemaModulePath)'), 'runner schema import missing')
assert(runnerSource.includes('routeFactoryInvoked: false'), 'runner route factory boundary missing')
assert(!runnerSource.includes('createSoundCpuWorkerRoutes()'), 'runner must not invoke route factory')
assert(!runnerSource.includes('fetch('), 'runner must not execute route over HTTP')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2150,
      routeModuleImported: true,
      schemaModuleImported: true,
      routeFactoryInvoked: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE141-ROUTE-REGISTRATION-PLAN',
    },
    null,
    2,
  ),
)
