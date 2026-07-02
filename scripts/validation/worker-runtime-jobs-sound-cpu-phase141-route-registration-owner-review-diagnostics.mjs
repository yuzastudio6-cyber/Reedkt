import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase141_route_registration_plan_completed_with_warnings_ready_for_route_registration_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase141_route_registration_owner_review_passed_with_warnings_ready_for_disabled_route_registration_source_creation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase142_disabled_route_registration_source_created_with_warnings_ready_for_static_registration_validation'

const docs = {
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-plan-result.md',
  sourceTouchpoint: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-touchpoint-plan.md',
  sourceClaimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-claim-policy.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-acceptance-register.md',
  touchpointApproval: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-touchpoint-owner-approval-register.md',
  sourceReadiness: 'docs/worker-runtime-jobs-sound-cpu-phase141-disabled-route-registration-source-readiness-register.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-creation.md',
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
    'routeRegisteredInApp',
    'routeRegisteredInAppInThisGate',
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

const parsed = {
  sourceResult: parseJsonBlock(docs.sourceResult, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-plan-result'),
  sourceTouchpoint: parseJsonBlock(docs.sourceTouchpoint, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-touchpoint-plan'),
  sourceClaimPolicy: parseJsonBlock(docs.sourceClaimPolicy, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-claim-policy'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-acceptance-register'),
  touchpointApproval: parseJsonBlock(
    docs.touchpointApproval,
    'worker-runtime-jobs-sound-cpu-phase141-route-registration-touchpoint-owner-approval-register',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase141-disabled-route-registration-source-readiness-register',
  ),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-creation'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2151, 'upstream source PR mismatch')
assert(parsed.sourceResult.registrationPlanResult.routeRegistrationPlanned === true, 'source route registration not planned')
assert(parsed.sourceResult.registrationPlanResult.routeRegisteredInApp === false, 'source route already registered')
assert(parsed.sourceResult.registrationPlanResult.routeExecutionEnabled === false, 'source route execution widened')

assert(parsed.sourceTouchpoint.plannedFutureTouchpoints[0].path === 'server/app.ts', 'source app touchpoint mismatch')
assert(parsed.sourceTouchpoint.registeredInThisGate === false, 'source plan registered route')
assert(parsed.sourceClaimPolicy.allowedClaims.routeRegistrationOwnerReviewMayProceed === true, 'source did not allow owner review')

assert(parsed.result.decision === decision, 'owner result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2152, 'owner result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '671eb7773419ac4799f1d0630f1fbba5a1935d7b', 'owner source merge mismatch')
assert(parsed.result.ownerReviewResult.routeRegistrationPlanAccepted === true, 'owner did not accept plan')
assert(parsed.result.ownerReviewResult.disabledRouteRegistrationSourceCreationMayProceed === true, 'next source gate not allowed')
assert(parsed.result.ownerReviewResult.routeRegistrationSourceChangedInThisGate === false, 'owner review changed source')
assert(parsed.result.ownerReviewResult.routeRegisteredInAppInThisGate === false, 'owner review registered route')
assert(parsed.result.ownerReviewResult.routeRequestExecutionEnabled === false, 'owner review enabled route execution')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForNextGateOnly.targetAppTouchpoint === 'server/app.ts', 'acceptance touchpoint mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.routeFactory === 'createSoundCpuWorkerRoutes', 'route factory mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.futureRouteFactoryInvocationForAppMountMayBeRepresented === true, 'future app mount not accepted')
assertFalseMap(parsed.acceptance.notAcceptedForExecution, 'acceptance.notAcceptedForExecution')

assert(parsed.touchpointApproval.approvedFutureTouchpoints[0].path === 'server/app.ts', 'approval touchpoint mismatch')
assert(parsed.touchpointApproval.approvedFutureTouchpoints[0].modifiedInThisGate === false, 'approval changed source')
assert(parsed.touchpointApproval.approvedFutureTouchpoints[0].requiresStaticValidationAfterChange === true, 'approval missing static validation')

assert(parsed.sourceReadiness.readinessForNextGate.disabledRegistrationSourceCreationMayProceed === true, 'readiness not unblocked')
assert(parsed.sourceReadiness.readinessForNextGate.mustKeepDisabledResponseStatus === 409, 'disabled status mismatch')
assert(parsed.sourceReadiness.requiredPostChangeStaticChecks.includes('server_app_mounts_createSoundCpuWorkerRoutes_once'), 'mount static check missing')
assert(parsed.sourceReadiness.requiredPostChangeStaticChecks.includes('no_route_request_execution'), 'route execution check missing')

assert(parsed.blocker.unblockedForNextGate.includes('disabled_route_registration_source_creation'), 'disabled source next missing')
assert(parsed.blocker.stillBlockedBeforeExecution.includes('route_request_execution'), 'route execution blocker missing')
assertFalseMap(parsed.blocker.blockedClaims, 'blocker.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.routeRegistrationPlanOwnerReviewed === true, 'claim review missing')
assert(parsed.claimPolicy.allowedClaims.disabledRouteRegistrationSourceCreationMayProceed === true, 'claim next missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.allowedSourceChange.serverAppImportCreateSoundCpuWorkerRoutes === true, 'next prompt import not allowed')
assert(parsed.nextPrompt.allowedSourceChange.serverAppMountCreateSoundCpuWorkerRoutesOnce === true, 'next prompt mount not allowed')
assert(parsed.nextPrompt.allowedSourceChange.modifyWorkerDispatch === false, 'next prompt worker widened')
assert(parsed.nextPrompt.executionScope.routeRequestExecutionEnabled === false, 'next prompt route execution widened')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const appSource = read('server/app.ts')
const phase142SourceCreated = fs.existsSync(
  path.join(process.cwd(), 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-result.md'),
)
if (!phase142SourceCreated) {
  assert(!appSource.includes('sound-cpu-worker-routes'), 'owner review unexpectedly changed app route registration')
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2152,
      disabledRouteRegistrationSourceCreationMayProceed: true,
      routeRegistrationSourceChangedInThisGate: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE142-DISABLED-ROUTE-REGISTRATION-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
