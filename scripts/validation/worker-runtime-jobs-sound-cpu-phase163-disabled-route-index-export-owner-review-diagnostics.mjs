import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase162_disabled_route_index_export_plan_completed_with_warnings_ready_for_disabled_route_index_export_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase163_disabled_route_index_export_owner_review_passed_with_warnings_ready_for_actual_disabled_route_index_export_source_creation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase164_actual_disabled_route_index_export_source_creation_completed_with_warnings_ready_for_index_export_static_validation'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase163-disabled-route-index-export-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase163-disabled-route-index-export-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase163-index-export-owner-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase163-source-creation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase163-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase163-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-creation.md',
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
    'indexExportAddedToday',
    'indexExportAdded',
    'routeRegistered',
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
    'allowIndexExportSourceChangeToday',
    'allowRouteRegistration',
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

function phase164IndexExportEvidenceExists() {
  const file = 'docs/worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-result.md'
  if (!fs.existsSync(path.join(process.cwd(), file))) return false

  const evidence = parseJsonBlock(
    file,
    'worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-result',
  )
  return (
    evidence.decision ===
      'worker_runtime_jobs_sound_cpu_phase164_actual_disabled_route_index_export_source_creation_completed_with_warnings_ready_for_index_export_static_validation' &&
    evidence.sourceChange?.indexExportAdded === true &&
    evidence.sourceChange?.routeRegisteredToday === false &&
    evidence.sourceChange?.workerDispatchExecutionEnabled === false &&
    evidence.sourceChange?.routeExecutionEnabled === false
  )
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase163-disabled-route-index-export-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase163-disabled-route-index-export-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase163-index-export-owner-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase163-source-creation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase163-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase163-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-creation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const routeSource = read(routePath)
const indexText = read(indexPath)
assert(routeSource.includes('createSoundCpuDisabledDispatchRouteResult'), 'route helper missing')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(
  !indexText.includes('disabled-dispatch-route.ts') || phase164IndexExportEvidenceExists(),
  'index export must not include route source before Phase164 evidence',
)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2200, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'f276f41a3c25f4655db4b8f30c37592bb3381809', 'source merge mismatch')
assert(parsed.source.planResult.indexExportPlanned === true, 'source index export plan missing')
assert(parsed.source.planResult.indexExportAddedToday === false, 'source index export added')
assert(parsed.source.planResult.routeRegisteredToday === false, 'source route registered')
assert(parsed.source.planResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowIndexExportPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowActualIndexExportSourceCreation === true, 'source prompt source creation path missing')
assert(parsed.sourcePrompt.reviewScope.allowIndexExportSourceChangeToday === false, 'source prompt source change widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2201, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '36b829b7327c84cd907046aa3b7ec4aabc0606e0', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.indexExportPlanAccepted === true, 'index export plan not accepted')
assert(parsed.result.ownerReviewResult.actualIndexExportSourceCreationMayProceed === true, 'source creation not allowed next')
assert(parsed.result.ownerReviewResult.candidateIndexPath === indexPath, 'candidate index mismatch')
assert(parsed.result.ownerReviewResult.candidateRoutePath === routePath, 'candidate route mismatch')
assert(parsed.result.ownerReviewResult.indexExportAddedToday === false, 'index export added today')
assert(parsed.result.ownerReviewResult.routeRegisteredToday === false, 'route registered today')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForActualIndexExportSourceCreation === true, 'actual source creation not accepted')
assert(parsed.acceptance.acceptedForIndexExportToday === false, 'index export accepted today')
assert(parsed.acceptance.acceptedForRouteRegistrationToday === false, 'route registration accepted')
assert(parsed.acceptance.acceptedForWorkerDispatchExecutionToday === false, 'worker execution accepted')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.actualSourceCreationMayProceed === true, 'actual source creation readiness missing')
assert(parsed.readiness.sourceCreationScope.allowIndexExportSourceChange === true, 'source change not allowed next')
assert(parsed.readiness.sourceCreationScope.allowRouteSourceChange === undefined, 'unexpected route source key in readiness')
assert(parsed.readiness.sourceCreationScope.allowRouteRegistration === false, 'readiness route registration widened')
assert(parsed.readiness.sourceCreationScope.allowRouteExecution === false, 'readiness route execution widened')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.indexExportPlanAccepted === true, 'index export accepted claim missing')
assert(parsed.claimPolicy.allowedClaims.actualIndexExportSourceCreationMayProceed === true, 'source creation claim missing')
assert(parsed.claimPolicy.allowedClaims.indexExportAddedToday === false, 'index export added claim widened')
assert(parsed.claimPolicy.allowedClaims.acceptedForDispatch === false, 'accepted dispatch claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.sourceCreationScope.allowIndexExportSourceChange === true, 'next prompt source change missing')
assert(parsed.nextPrompt.sourceCreationScope.allowRouteSourceChange === false, 'next prompt route source change widened')
assert(parsed.nextPrompt.sourceCreationScope.allowRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.sourceCreationScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase163-disabled-route-index-export-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase163-disabled-route-index-export-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2201,
      indexExportPlanAccepted: true,
      actualIndexExportSourceCreationMayProceed: true,
      indexExportAddedToday: false,
      routeRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE164-ACTUAL-DISABLED-ROUTE-INDEX-EXPORT-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
