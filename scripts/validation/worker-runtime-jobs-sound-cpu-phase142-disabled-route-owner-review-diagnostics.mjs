import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase142_static_registration_validation_passed_with_warnings_ready_for_disabled_route_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase142_disabled_route_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_request_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase143_controlled_disabled_route_request_validation_passed_with_warnings_ready_for_disabled_route_request_owner_review'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase142-static-registration-validation-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase142-controlled-disabled-request-readiness-register.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation.md',
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
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase142-static-registration-validation-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase142-controlled-disabled-request-readiness-register'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2154, 'source PR mismatch')
assert(parsed.source.staticValidationResult.serverAppMountValidated === true, 'source mount validation missing')
assert(parsed.source.staticValidationResult.httpRouteRequestExecuted === false, 'source request already executed')
assert(parsed.source.staticValidationResult.workerDispatchExecutionEnabled === false, 'source worker widened')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt required mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.acceptStaticRegistrationValidation === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.mayProceedToControlledDisabledRouteRequestValidation === true, 'source prompt next missing')
assertNoOpClassification(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2156, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'c0a927fe95c9a0d5440cd88915fcd3b237527056', 'source merge mismatch')
assert(parsed.result.ownerReviewResult.staticRegistrationValidationAccepted === true, 'owner did not accept static validation')
assert(parsed.result.ownerReviewResult.controlledDisabledRouteRequestValidationMayProceed === true, 'owner did not allow controlled disabled request')
assert(parsed.result.ownerReviewResult.allowedRequestScope === 'local_disabled_route_response_only', 'request scope mismatch')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'owner worker widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedEvidence.mountCount === 1, 'acceptance mount count mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.oneLocalDisabledPostRequest === true, 'post request not allowed')
assert(parsed.acceptance.acceptedForNextGateOnly.oneLocalDisabledGetRequest === true, 'get request not allowed')
assert(parsed.acceptance.acceptedForNextGateOnly.expectedHttpStatus === 409, 'expected disabled status mismatch')
assertFalseMap(parsed.acceptance.notAcceptedForExecution, 'acceptance.notAcceptedForExecution')

assert(parsed.readiness.nextGateReadiness.controlledDisabledRouteRequestValidationMayProceed === true, 'readiness not allowed')
assert(parsed.readiness.nextGateReadiness.localAppInstanceOnly === true, 'readiness local-only missing')
assert(parsed.readiness.nextGateReadiness.noWorkerDispatch === true, 'readiness worker guard missing')
assert(parsed.readiness.requiredAssertions.includes('POST /v1/sound-cpu/jobs returns 409 disabled response'), 'post assertion missing')

assert(parsed.blocker.unblockedForNextGate.includes('controlled_disabled_route_request_validation'), 'request validation not unblocked')
assert(parsed.blocker.stillBlockedBeforeExecution.includes('route_request_execution_enablement'), 'route execution enablement blocker missing')
assertFalseMap(parsed.blocker.blockedClaims, 'blocker.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.staticRegistrationValidationAccepted === true, 'claim static validation missing')
assert(parsed.claimPolicy.allowedClaims.controlledDisabledRouteRequestValidationMayProceed === true, 'claim next missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.allowedValidation.localDisabledPostRequest === true, 'next prompt post missing')
assert(parsed.nextPrompt.allowedValidation.localDisabledGetRequest === true, 'next prompt get missing')
assert(parsed.nextPrompt.allowedValidation.expectedHttpStatus === 409, 'next prompt expected status mismatch')
assertFalseMap(parsed.nextPrompt.blockedExecution, 'nextPrompt.blockedExecution')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const appSource = read('server/app.ts')
assert(appSource.includes("import { createSoundCpuWorkerRoutes } from './routes/sound-cpu-worker-routes'"), 'app import missing')
assert(appSource.includes('app.use(createSoundCpuWorkerRoutes())'), 'app mount missing')

const routeSource = read('server/routes/sound-cpu-worker-routes.ts')
assert(routeSource.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'route execution flag widened')
assert(routeSource.includes('response.status(409)'), 'disabled status missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2156,
      controlledDisabledRouteRequestValidationMayProceed: true,
      workerDispatchExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE143-CONTROLLED-DISABLED-ROUTE-REQUEST-VALIDATION',
    },
    null,
    2,
  ),
)
