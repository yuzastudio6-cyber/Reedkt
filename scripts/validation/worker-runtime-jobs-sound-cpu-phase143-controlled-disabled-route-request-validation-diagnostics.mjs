import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase142_disabled_route_metadata_aligned_with_warnings_ready_for_controlled_disabled_route_request_validation'
const ownerDecision =
  'worker_runtime_jobs_sound_cpu_phase142_disabled_route_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_request_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase143_controlled_disabled_route_request_validation_passed_with_warnings_ready_for_disabled_route_request_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase143_disabled_route_request_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_gap_review'

const docs = {
  owner: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review-result.md',
  source: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation-result.md',
  proof: 'docs/worker-runtime-jobs-sound-cpu-phase143-disabled-route-proof-evidence-register.md',
  response: 'docs/worker-runtime-jobs-sound-cpu-phase143-disabled-route-response-register.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase143-no-dispatch-safety-register.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-review.md',
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
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  owner: parseJsonBlock(docs.owner, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review-result'),
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation-result'),
  proof: parseJsonBlock(docs.proof, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-proof-evidence-register'),
  response: parseJsonBlock(docs.response, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-response-register'),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase143-no-dispatch-safety-register'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-review'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.owner.decision === ownerDecision, 'owner decision mismatch')
assert(parsed.owner.ownerReviewResult.controlledDisabledRouteRequestValidationMayProceed === true, 'owner did not allow controlled disabled request')
assert(parsed.source.decision === sourceDecision, 'metadata alignment decision mismatch')
assert(parsed.source.metadataAlignmentResult.routeRegisteredInAppMetadataSetTrue === true, 'metadata alignment missing')

assert(parsed.sourcePrompt.requiredSourceDecision === ownerDecision, 'prompt owner decision mismatch')
assert(parsed.sourcePrompt.requiredMetadataAlignmentDecision === sourceDecision, 'prompt metadata decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.sourcePrompt.allowedValidation.localDisabledPostRequest === true, 'prompt post missing')
assert(parsed.sourcePrompt.allowedValidation.localDisabledGetRequest === true, 'prompt get missing')
assert(parsed.sourcePrompt.allowedValidation.expectedHttpStatus === 409, 'prompt expected status mismatch')
assertFalseMap(parsed.sourcePrompt.blockedExecution, 'sourcePrompt.blockedExecution')
assertNoOpClassification(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2159, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'b8d40fd4bbcc532cf8a9e3485ea91d43b48a1b8d', 'source merge mismatch')
assert(parsed.result.proofResult.localLoopbackOnly === true, 'proof not local-only')
assert(parsed.result.proofResult.postRequestCount === 1, 'post count mismatch')
assert(parsed.result.proofResult.getRequestCount === 1, 'get count mismatch')
assert(parsed.result.proofResult.postStatus === 409, 'post status mismatch')
assert(parsed.result.proofResult.getStatus === 409, 'get status mismatch')
assert(parsed.result.proofResult.postAccepted === false, 'post accepted unexpectedly')
assert(parsed.result.proofResult.getAccepted === false, 'get accepted unexpectedly')
assert(parsed.result.proofResult.routeRegisteredInApp === true, 'route registration metadata mismatch')
assert(parsed.result.proofResult.serverClosed === true, 'server close not recorded')
assert(parsed.result.proofResult.workerDispatchExecutionEnabled === false, 'worker dispatch widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.proof.proofCommand === 'npm run worker-runtime-jobs:sound-cpu-phase143-controlled-disabled-route-request-validation:proof', 'proof command mismatch')
assert(parsed.proof.requests.length === 2, 'request evidence count mismatch')
assert(parsed.proof.requests.every((request) => request.status === 409), 'request status mismatch')
assert(parsed.proof.requests.every((request) => request.accepted === false), 'request accepted unexpectedly')
assert(parsed.proof.serverClosed === true, 'proof server close missing')

assert(parsed.response.sharedResponseAssertions.routeRegisteredInApp === true, 'response metadata mismatch')
assert(parsed.response.sharedResponseAssertions.workerDispatchStarted === false, 'response worker dispatch started')
assertFalseMap(parsed.response.staticRuntimeFlagsRemainFalse, 'response.staticRuntimeFlagsRemainFalse')

assert(parsed.safety.proofSafety.localLoopbackOnly === true, 'safety local-only missing')
assert(parsed.safety.proofSafety.realUserMediaUsed === false, 'real media used')
assertFalseMap(
  Object.fromEntries(Object.entries(parsed.safety.proofSafety).filter(([key]) => key !== 'localLoopbackOnly')),
  'safety.proofSafety',
)
assertFalseMap(parsed.safety.runtimeReadinessClaims, 'safety.runtimeReadinessClaims')

assert(parsed.blocker.unblockedForNextGate.includes('disabled_route_request_owner_review'), 'owner review not unblocked')
assert(parsed.blocker.stillBlockedBeforeExecution.includes('worker_dispatch_claim_lease_execution'), 'worker dispatch blocker missing')
assertFalseMap(parsed.blocker.blockedClaims, 'blocker.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.controlledDisabledPostRequestReturned409 === true, 'post claim missing')
assert(parsed.claimPolicy.allowedClaims.controlledDisabledGetRequestReturned409 === true, 'get claim missing')
assert(parsed.claimPolicy.allowedClaims.disabledRouteRequestOwnerReviewMayProceed === true, 'owner next claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.acceptControlledDisabledRouteProof === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.mayProceedToWorkerDispatchContractGapReview === true, 'next prompt next missing')
assert(parsed.nextPrompt.reviewScope.allowWorkerDispatchExecution === false, 'next prompt worker widened')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const runnerSource = read('scripts/validation/worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation-runner.ts')
assert(runnerSource.includes("host: '127.0.0.1'"), 'runner is not loopback-only')
assert(!runnerSource.includes('createSupabase'), 'runner imports Supabase')
assert(!runnerSource.includes('docker'), 'runner mentions Docker')
assert(!runnerSource.includes('child_process'), 'runner imports child_process')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2159,
      postStatus: 409,
      getStatus: 409,
      routeRegisteredInApp: true,
      workerDispatchExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE143-DISABLED-ROUTE-REQUEST-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
