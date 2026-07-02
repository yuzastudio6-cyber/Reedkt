import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase161_disabled_route_source_owner_review_passed_with_warnings_ready_for_disabled_route_index_export_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase162_disabled_route_index_export_plan_completed_with_warnings_ready_for_disabled_route_index_export_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase163_disabled_route_index_export_owner_review_passed_with_warnings_ready_for_actual_disabled_route_index_export_source_creation'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase161-disabled-route-source-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan-result.md',
  candidate: 'docs/worker-runtime-jobs-sound-cpu-phase162-index-export-candidate-register.md',
  safety: 'docs/worker-runtime-jobs-sound-cpu-phase162-index-export-source-change-safety-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase162-index-export-owner-review-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase162-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase162-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase163-disabled-route-index-export-owner-review.md',
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
    'sourceChangeMadeToday',
    'sourceChangeApprovedToday',
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
    'allowIndexExportSourceChange',
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

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase161-disabled-route-source-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan-result'),
  candidate: parseJsonBlock(docs.candidate, 'worker-runtime-jobs-sound-cpu-phase162-index-export-candidate-register'),
  safety: parseJsonBlock(docs.safety, 'worker-runtime-jobs-sound-cpu-phase162-index-export-source-change-safety-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase162-index-export-owner-review-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase162-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase162-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase163-disabled-route-index-export-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const routeSource = read(routePath)
const indexText = read(indexPath)
assert(routeSource.includes('createSoundCpuDisabledDispatchRouteResult'), 'route helper missing')
assert(routeSource.includes('assertSoundCpuDisabledDispatchRouteExecutionBlocked'), 'blocked assertion missing')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(!indexText.includes('disabled-dispatch-route.ts'), 'index export must not include route source in planning phase')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2198, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '797dfad8071902e304d8eb1849d6d98d88275156', 'source merge mismatch')
assert(parsed.source.ownerReviewResult.disabledRouteSourceAcceptedForIndexExportPlanning === true, 'source planning acceptance missing')
assert(parsed.source.ownerReviewResult.indexExportPlanningMayProceed === true, 'source index planning not allowed')
assert(parsed.source.ownerReviewResult.indexExportAddedToday === false, 'source index export added')
assert(parsed.source.ownerReviewResult.routeRegisteredToday === false, 'source route registered')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowIndexExportPlan === true, 'source prompt index plan missing')
assert(parsed.sourcePrompt.planningScope.allowIndexExportSourceChange === false, 'source prompt source change widened')
assert(parsed.sourcePrompt.planningScope.allowRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.planningScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2200, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'f276f41a3c25f4655db4b8f30c37592bb3381809', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.indexExportPlanned === true, 'index export plan missing')
assert(parsed.result.planResult.candidateIndexPath === indexPath, 'candidate index mismatch')
assert(parsed.result.planResult.candidateRoutePath === routePath, 'candidate route mismatch')
assert(parsed.result.planResult.plannedExports.includes('createSoundCpuDisabledDispatchRouteResult'), 'create result export missing')
assert(parsed.result.planResult.plannedTypeExports.includes('SoundCpuDisabledDispatchRouteResult'), 'result type export missing')
assert(parsed.result.planResult.indexExportAddedToday === false, 'index export added today')
assert(parsed.result.planResult.routeRegisteredToday === false, 'route registered today')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.candidate.candidateIndexPath === indexPath, 'candidate index path mismatch')
assert(parsed.candidate.candidateRoutePath === routePath, 'candidate route path mismatch')
assert(parsed.candidate.requiresSourceChangeLater === true, 'candidate future source change missing')
assert(parsed.candidate.sourceChangeMadeToday === false, 'candidate source change made today')
assert(parsed.candidate.mustAvoidImportCycle === true, 'candidate cycle safety missing')
assert(parsed.candidate.mustPreserveAcceptedForDispatchFalse === true, 'candidate fail-closed missing')

assert(parsed.safety.futureSourceChangeRules.onlyModifyIndexPath === indexPath, 'safety index path mismatch')
assert(parsed.safety.futureSourceChangeRules.onlyAddExportFrom === routePath, 'safety route path mismatch')
assert(parsed.safety.futureSourceChangeRules.doNotRegisterRoute === true, 'safety route registration missing')
assert(parsed.safety.futureSourceChangeRules.doNotEnableWorkerDispatch === true, 'safety dispatch missing')
assert(parsed.safety.sourceChangeMadeToday === false, 'safety source change made today')
assert(parsed.safety.ownerReviewRequiredBeforeSourceChange === true, 'owner review missing')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.ownerReviewMayProceed === true, 'owner review readiness missing')
assert(parsed.readiness.sourceChangeApprovedToday === false, 'source change approved today')
assert(parsed.readiness.stillForbidden.includes('index_export_source_change'), 'index source blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_registration'), 'route registration blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.indexExportPlanned === true, 'index export planned claim missing')
assert(parsed.claimPolicy.allowedClaims.indexExportAddedToday === false, 'index export added claim widened')
assert(parsed.claimPolicy.allowedClaims.acceptedForDispatch === false, 'accepted dispatch claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowIndexExportPlanReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowActualIndexExportSourceCreation === true, 'next prompt source creation path missing')
assert(parsed.nextPrompt.reviewScope.allowIndexExportSourceChangeToday === false, 'next prompt source change widened')
assert(parsed.nextPrompt.reviewScope.allowRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase162-disabled-route-index-export-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2200,
      indexExportPlanned: true,
      candidateIndexPath: indexPath,
      candidateRoutePath: routePath,
      indexExportAddedToday: false,
      routeRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE163-DISABLED-ROUTE-INDEX-EXPORT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
