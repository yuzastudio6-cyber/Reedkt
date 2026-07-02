import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase141_route_registration_owner_review_passed_with_warnings_ready_for_disabled_route_registration_source_creation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase142_disabled_route_registration_source_created_with_warnings_ready_for_static_registration_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase142_static_registration_validation_passed_with_warnings_ready_for_disabled_route_owner_review'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-creation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-result.md',
  touchpoint: 'docs/worker-runtime-jobs-sound-cpu-phase142-app-registration-touchpoint-register.md',
  guard: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-runtime-guard-report.md',
  handoff: 'docs/worker-runtime-jobs-sound-cpu-phase142-static-registration-validation-handoff.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase142-registration-source-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase142-registration-source-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase142-static-registration-validation.md',
}

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
    'routeRequestExecutionEnabled',
    'workerDispatchExecutionEnabled',
    'workerLeaseOrClaimMutationEnabled',
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
    'externalProductionUnlockEnabled',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

function countOccurrences(text, needle) {
  return text.split(needle).length - 1
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-creation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-result'),
  touchpoint: parseJsonBlock(docs.touchpoint, 'worker-runtime-jobs-sound-cpu-phase142-app-registration-touchpoint-register'),
  guard: parseJsonBlock(docs.guard, 'worker-runtime-jobs-sound-cpu-phase142-disabled-runtime-guard-report'),
  handoff: parseJsonBlock(docs.handoff, 'worker-runtime-jobs-sound-cpu-phase142-static-registration-validation-handoff'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase142-registration-source-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase142-registration-source-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase142-static-registration-validation'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source owner decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2152, 'source PR mismatch')
assert(parsed.source.ownerReviewResult.disabledRouteRegistrationSourceCreationMayProceed === true, 'source did not allow source creation')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.sourcePrompt.allowedSourceChange.serverAppImportCreateSoundCpuWorkerRoutes === true, 'prompt import missing')
assert(parsed.sourcePrompt.allowedSourceChange.serverAppMountCreateSoundCpuWorkerRoutesOnce === true, 'prompt mount missing')
assert(parsed.sourcePrompt.allowedSourceChange.modifyWorkerDispatch === false, 'prompt worker widened')
assert(parsed.sourcePrompt.executionScope.routeRequestExecutionEnabled === false, 'prompt route execution widened')
assertNoOpClassification(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2153, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'a817cbf1ff243e109cde40821fa32a89aa29bb16', 'source merge mismatch')
assert(parsed.result.sourceChangeResult.serverAppImportAdded === true, 'app import not recorded')
assert(parsed.result.sourceChangeResult.serverAppRouteMountAdded === true, 'app mount not recorded')
assert(parsed.result.sourceChangeResult.routeRegisteredInAppSource === true, 'route registration source not recorded')
assert(parsed.result.sourceChangeResult.routeRequestExecutionPerformed === false, 'route request was performed')
assert(parsed.result.sourceChangeResult.routeRequestExecutionEnabled === false, 'route execution widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.touchpoint.modifiedTouchpoints[0].path === 'server/app.ts', 'touchpoint path mismatch')
assert(parsed.touchpoint.unchangedRuntimeSources.includes('server/routes/sound-cpu-worker-routes.ts'), 'route source should remain unchanged')
assertFalseMap(parsed.touchpoint.executionPerformed, 'touchpoint.executionPerformed')

assert(parsed.guard.routeSourceGuards.soundCpuWorkerRouteExecutionEnabled === false, 'route execution flag widened')
assert(parsed.guard.routeSourceGuards.disabledStatus === 409, 'disabled status mismatch')
assert(parsed.guard.appRegistrationGuards.mountCountExpected === 1, 'mount count mismatch')
assert(parsed.guard.appRegistrationGuards.routeRequestExecutionAllowed === false, 'route request allowed')

assert(parsed.handoff.nextStaticValidationDecision === nextDecision, 'handoff decision mismatch')
assert(parsed.handoff.requiredStaticChecks.includes('server_app_mounts_createSoundCpuWorkerRoutes_once'), 'handoff mount check missing')
assert(parsed.handoff.requiredStaticChecks.includes('no_http_request_execution'), 'handoff request check missing')

assert(parsed.blocker.unblockedForNextGate.includes('static_registration_validation'), 'static validation not unblocked')
assert(parsed.blocker.stillBlockedBeforeExecution.includes('http_route_request_validation'), 'request validation blocker missing')
assertFalseMap(parsed.blocker.blockedClaims, 'blocker.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.disabledRouteRegisteredInAppSource === true, 'claim registration missing')
assert(parsed.claimPolicy.allowedClaims.staticRegistrationValidationMayProceed === true, 'claim static validation missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.staticSourceInspectionOnly === true, 'next prompt static scope missing')
assert(parsed.nextPrompt.validationScope.allowHttpRouteRequest === false, 'next prompt allowed route request')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const appSource = read('server/app.ts')
assert(
  appSource.includes("import { createSoundCpuWorkerRoutes } from './routes/sound-cpu-worker-routes'"),
  'server/app.ts missing SOUND CPU route import',
)
assert(countOccurrences(appSource, 'createSoundCpuWorkerRoutes') === 2, 'server/app.ts should reference route factory exactly twice')
assert(
  appSource.includes('app.use(createWorkerRoutes())\n  app.use(createSoundCpuWorkerRoutes())\n  app.use(createRenderRoutes())'),
  'server/app.ts route mount order mismatch',
)

const routeSource = read('server/routes/sound-cpu-worker-routes.ts')
assert(routeSource.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'route execution flag widened')
assert(routeSource.includes('response.status(409)'), 'disabled status response missing')
assert(!routeSource.includes('createSupabase'), 'route imports Supabase')
assert(!routeSource.includes('dispatchWorker'), 'route dispatch implementation reference found')
assert(!routeSource.includes('claimWorker'), 'route claim implementation reference found')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2153,
      serverAppImportAdded: true,
      serverAppRouteMountAdded: true,
      routeRequestExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE142-STATIC-REGISTRATION-VALIDATION',
    },
    null,
    2,
  ),
)
