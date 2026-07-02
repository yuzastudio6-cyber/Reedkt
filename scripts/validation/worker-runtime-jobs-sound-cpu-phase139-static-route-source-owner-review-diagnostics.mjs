import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase139_static_route_source_validation_passed_with_warnings_ready_for_route_source_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase139_static_route_source_owner_review_passed_with_warnings_ready_for_controlled_no_media_route_import_validation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation-result.md',
  sourceHandler: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-handler-static-inspection-register.md',
  sourceSchema: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-schema-static-inspection-register.md',
  sourceSafety: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-prohibited-import-scan-register.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-acceptance-register.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-safety-register.md',
  lineage: 'docs/worker-runtime-jobs-sound-cpu-phase139-controlled-import-lineage-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation.md',
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
    'allowRouteRegistration',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation-result'),
  sourceHandler: parseJsonBlock(docs.sourceHandler, 'worker-runtime-jobs-sound-cpu-phase139-route-handler-static-inspection-register'),
  sourceSchema: parseJsonBlock(docs.sourceSchema, 'worker-runtime-jobs-sound-cpu-phase139-route-schema-static-inspection-register'),
  sourceSafety: parseJsonBlock(docs.sourceSafety, 'worker-runtime-jobs-sound-cpu-phase139-route-prohibited-import-scan-register'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-acceptance-register'),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-safety-register'),
  lineage: parseJsonBlock(docs.lineage, 'worker-runtime-jobs-sound-cpu-phase139-controlled-import-lineage-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.staticValidationResult.staticValidationPassed === true, 'source static validation missing')
assert(parsed.source.staticValidationResult.routeRegistrationDetected === false, 'source route registered')
assert(parsed.source.staticValidationResult.runtimeServiceImportDetected === false, 'source runtime service detected')
assert(parsed.sourceHandler.registrationStatus.routeExecutionEnabled === false, 'handler route execution widened')
assert(parsed.sourceSchema.acceptedJobTypes.length === 4, 'schema job type count mismatch')
assertFalseMap(parsed.sourceSafety.prohibitedFindings, 'sourceSafety.prohibitedFindings')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.acceptStaticRouteSourceValidationOnly === true, 'prompt scope missing')
assert(parsed.prompt.reviewScope.mayProceedToControlledNoMediaRouteImportValidation === true, 'prompt next missing')
assert(parsed.prompt.reviewScope.allowRouteExecution === false, 'prompt route widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2149, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'e04dc5c716ea43d9b49b55f799f516a77e45e464', 'source merge mismatch')
assert(parsed.result.ownerReview.staticRouteSourceValidationAccepted === true, 'owner acceptance missing')
assert(parsed.result.ownerReview.controlledNoMediaRouteImportValidationMayProceed === true, 'import validation next missing')
assert(parsed.result.ownerReview.routeExecutionEnabled === false, 'result route widened')
assert(parsed.result.ownerReview.supabaseMutationEnabled === false, 'result Supabase widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedEvidence.staticRouteSourceValidationPassed === true, 'acceptance source missing')
assert(parsed.acceptance.acceptedEvidence.routeRegisteredInApp === false, 'acceptance route registered')
assert(parsed.acceptance.acceptedForNextGateOnly.controlledNoMediaRouteImportValidation === true, 'next gate missing')
assert(parsed.acceptance.acceptedForNextGateOnly.routeExecutionProof === false, 'route proof widened')

assertFalseMap(parsed.safety.closedGates, 'safety.closedGates')
assert(parsed.safety.unclaimedStatuses.includes('runtime_readiness'), 'runtime readiness unclaimed missing')

assert(parsed.lineage.updatedPrompt === docs.nextPrompt, 'lineage prompt mismatch')
assert(parsed.lineage.requiredSourceDecision === decision, 'lineage required source mismatch')
assert(parsed.lineage.lineageCorrection.requiresOwnerReviewBeforeImportValidation === true, 'owner lineage correction missing')
assert(parsed.lineage.lineageCorrection.routeExecutionEnabled === false, 'lineage route widened')

assert(parsed.claimPolicy.allowedClaims.staticRouteSourceValidationAccepted === true, 'claim acceptance missing')
assert(parsed.claimPolicy.allowedClaims.controlledNoMediaRouteImportValidationMayProceed === true, 'claim next missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'Phase140 prompt must require owner review decision')
assert(parsed.nextPrompt.validationScope.controlledImportValidationOnly === true, 'Phase140 scope mismatch')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'Phase140 route widened')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2149,
      staticRouteSourceValidationAccepted: true,
      controlledNoMediaRouteImportValidationMayProceed: true,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE140-CONTROLLED-NO-MEDIA-ROUTE-IMPORT-VALIDATION',
    },
    null,
    2,
  ),
)
