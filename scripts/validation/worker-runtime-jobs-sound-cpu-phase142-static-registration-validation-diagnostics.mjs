import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase142_disabled_route_registration_source_created_with_warnings_ready_for_static_registration_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase142_static_registration_validation_passed_with_warnings_ready_for_disabled_route_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase142_disabled_route_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_request_validation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-result.md',
  sourceClaim: 'docs/worker-runtime-jobs-sound-cpu-phase142-registration-source-claim-policy.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase142-static-registration-validation-result.md',
  appScan: 'docs/worker-runtime-jobs-sound-cpu-phase142-app-registration-static-scan-register.md',
  routeGuard: 'docs/worker-runtime-jobs-sound-cpu-phase142-route-guard-static-scan-register.md',
  handoff: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review-handoff.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase142-static-registration-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase142-static-registration-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review.md',
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
    'httpRouteRequestExecuted',
    'routeRequestExecutionEnabled',
    'workerDispatchExecutionEnabled',
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

function countOccurrences(text, needle) {
  return text.split(needle).length - 1
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-result'),
  sourceClaim: parseJsonBlock(docs.sourceClaim, 'worker-runtime-jobs-sound-cpu-phase142-registration-source-claim-policy'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase142-static-registration-validation-result'),
  appScan: parseJsonBlock(docs.appScan, 'worker-runtime-jobs-sound-cpu-phase142-app-registration-static-scan-register'),
  routeGuard: parseJsonBlock(docs.routeGuard, 'worker-runtime-jobs-sound-cpu-phase142-route-guard-static-scan-register'),
  handoff: parseJsonBlock(docs.handoff, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review-handoff'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase142-static-registration-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase142-static-registration-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2153, 'source PR mismatch')
assert(parsed.source.sourceChangeResult.routeRegisteredInAppSource === true, 'source app registration missing')
assert(parsed.source.sourceChangeResult.routeRequestExecutionPerformed === false, 'source request executed')
assert(parsed.source.sourceChangeResult.routeRequestExecutionEnabled === false, 'source route execution widened')
assert(parsed.sourceClaim.allowedClaims.staticRegistrationValidationMayProceed === true, 'source claim did not allow static validation')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2154, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '65ab440096971fd99aea000abb08f49d6a567fa5', 'source merge mismatch')
assert(parsed.result.staticValidationResult.serverAppImportValidated === true, 'app import not validated')
assert(parsed.result.staticValidationResult.serverAppMountValidated === true, 'app mount not validated')
assert(parsed.result.staticValidationResult.mountCount === 1, 'mount count mismatch')
assert(parsed.result.staticValidationResult.routeExecutionFlagFalse === true, 'route flag not validated')
assert(parsed.result.staticValidationResult.disabledStatusValidated === 409, 'disabled status mismatch')
assert(parsed.result.staticValidationResult.httpRouteRequestExecuted === false, 'HTTP request executed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.appScan.appSource === 'server/app.ts', 'app source mismatch')
assert(parsed.appScan.validatedCounts.routeFactoryReferences === 2, 'route factory reference count mismatch')
assert(parsed.appScan.validatedCounts.routeFactoryMounts === 1, 'route factory mount count mismatch')
assert(parsed.appScan.requestExecutionDuringValidation === false, 'request execution during validation')

assert(parsed.routeGuard.validatedGuards.soundCpuWorkerRouteExecutionEnabledFalse === true, 'route execution guard missing')
assert(parsed.routeGuard.validatedGuards.disabledHttpStatus === 409, 'disabled status guard missing')
assertFalseMap(parsed.routeGuard.forbiddenSourceFindings, 'routeGuard.forbiddenSourceFindings')

assert(parsed.handoff.nextOwnerReviewDecision === nextDecision, 'handoff next decision mismatch')
assert(parsed.handoff.acceptedEvidenceForReview.includes('server_app_mount_validated_once'), 'handoff mount evidence missing')
assert(parsed.handoff.notAcceptedForExecutionYet.includes('controlled_disabled_route_request_validation'), 'request validation should still need owner review')

assert(parsed.blocker.unblockedForNextGate.includes('disabled_route_owner_review'), 'owner review not unblocked')
assert(parsed.blocker.stillBlockedBeforeExecution.includes('http_route_request_validation_without_owner_review'), 'request validation blocker missing')
assertFalseMap(parsed.blocker.blockedClaims, 'blocker.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.staticRegistrationValidationPassed === true, 'claim static validation missing')
assert(parsed.claimPolicy.allowedClaims.disabledRouteOwnerReviewMayProceed === true, 'claim next missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.acceptStaticRegistrationValidation === true, 'next prompt review scope missing')
assert(parsed.nextPrompt.reviewScope.mayProceedToControlledDisabledRouteRequestValidation === true, 'next prompt next scope missing')
assert(parsed.nextPrompt.reviewScope.allowWorkerDispatchExecution === false, 'next prompt worker widened')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const appSource = read('server/app.ts')
assert(
  appSource.includes(parsed.appScan.expectedImport),
  'server/app.ts missing expected SOUND CPU route import',
)
assert(appSource.includes(parsed.appScan.expectedMount), 'server/app.ts missing expected SOUND CPU route mount')
assert(countOccurrences(appSource, 'createSoundCpuWorkerRoutes') === 2, 'server/app.ts route factory reference count mismatch')
assert(countOccurrences(appSource, 'app.use(createSoundCpuWorkerRoutes())') === 1, 'server/app.ts route mount count mismatch')
assert(appSource.includes(parsed.appScan.expectedMountOrder.join('\n  ')), 'server/app.ts route mount order mismatch')

const routeSource = read('server/routes/sound-cpu-worker-routes.ts')
assert(routeSource.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'route execution flag widened')
assert(routeSource.includes('response.status(409)'), 'disabled 409 response missing')
assert(!routeSource.includes('createSupabase'), 'route imports Supabase')
assert(!routeSource.includes('dispatchWorker'), 'route dispatch implementation reference found')
assert(!routeSource.includes('claimWorker'), 'route claim implementation reference found')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2154,
      serverAppImportValidated: true,
      serverAppMountValidated: true,
      mountCount: 1,
      httpRouteRequestExecuted: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE142-DISABLED-ROUTE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
