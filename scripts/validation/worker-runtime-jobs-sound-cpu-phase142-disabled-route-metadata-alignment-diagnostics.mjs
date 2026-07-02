import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase142_disabled_route_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_request_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase142_disabled_route_metadata_aligned_with_warnings_ready_for_controlled_disabled_route_request_validation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review-result.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-result.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-claim-policy.md',
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
    'routeRequestExecutionPerformed',
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

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-review-result'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-result'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2156, 'source PR mismatch')
assert(parsed.source.ownerReviewResult.controlledDisabledRouteRequestValidationMayProceed === true, 'source did not allow request validation')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2157, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '156144ebe2d63c3b564885b93f6eedfa05a2fec5', 'source merge mismatch')
assert(parsed.result.metadataAlignmentResult.routeRegisteredInAppMetadataSetTrue === true, 'metadata not aligned')
assert(parsed.result.metadataAlignmentResult.routeExecutionFlagRemainsFalse === true, 'route flag widened')
assert(parsed.result.metadataAlignmentResult.disabledStatusRemains === 409, 'disabled status mismatch')
assert(parsed.result.metadataAlignmentResult.workerDispatchExecutionEnabled === false, 'worker dispatch widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.register.alignedSource === 'server/routes/sound-cpu-worker-routes.ts', 'aligned source mismatch')
assert(parsed.register.alignedFields['SoundCpuWorkerRouteDisabledResponse.routeRegisteredInApp'] === true, 'type metadata not aligned')
assert(parsed.register.alignedFields['createSoundCpuRouteDisabledResponse.routeRegisteredInApp'] === true, 'response metadata not aligned')
assertFalseMap(parsed.register.unchangedRuntimeGuards, 'register.unchangedRuntimeGuards')
assert(parsed.register.requestExecutionDuringAlignment === false, 'request executed during alignment')

assert(parsed.claimPolicy.allowedClaims.disabledRouteRegisteredInAppMetadataAligned === true, 'claim alignment missing')
assert(parsed.claimPolicy.allowedClaims.controlledDisabledRouteRequestValidationMayProceed === true, 'claim next missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === sourceDecision, 'next prompt owner source mismatch')
assert(parsed.nextPrompt.requiredMetadataAlignmentDecision === decision, 'next prompt metadata source mismatch')

const routeSource = read('server/routes/sound-cpu-worker-routes.ts')
assert(routeSource.includes('routeRegisteredInApp: true'), 'route registered metadata not true')
assert(!routeSource.includes('routeRegisteredInApp: false'), 'stale route registered metadata remains')
assert(routeSource.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'route execution flag widened')
assert(routeSource.includes('response.status(409)'), 'disabled status missing')
assert(!routeSource.includes('createSupabase'), 'route imports Supabase')
assert(!routeSource.includes('dispatchWorker'), 'route dispatch implementation reference found')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2157,
      routeRegisteredInAppMetadataSetTrue: true,
      routeExecutionEnabled: false,
      workerDispatchExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE143-CONTROLLED-DISABLED-ROUTE-REQUEST-VALIDATION',
    },
    null,
    2,
  ),
)
