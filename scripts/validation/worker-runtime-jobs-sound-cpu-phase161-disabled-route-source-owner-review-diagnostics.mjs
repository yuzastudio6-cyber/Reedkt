import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase160_disabled_dispatch_route_static_validation_passed_with_warnings_ready_for_disabled_route_source_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase161_disabled_route_source_owner_review_passed_with_warnings_ready_for_disabled_route_index_export_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase162_disabled_route_index_export_plan_completed_with_warnings_ready_for_disabled_route_index_export_owner_review'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation-result.md',
  sourceOutput: 'docs/worker-runtime-jobs-sound-cpu-phase160-static-route-import-proof-output.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase161-disabled-route-source-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase161-disabled-route-source-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase161-source-owner-acceptance-register.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-phase161-static-validation-evidence-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase161-index-export-plan-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase161-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase161-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan.md',
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
    'allowIndexExportSourceChange',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation-result'),
  sourceOutput: parseJsonBlock(docs.sourceOutput, 'worker-runtime-jobs-sound-cpu-phase160-static-route-import-proof-output'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase161-disabled-route-source-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase161-disabled-route-source-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase161-source-owner-acceptance-register'),
  evidence: parseJsonBlock(docs.evidence, 'worker-runtime-jobs-sound-cpu-phase161-static-validation-evidence-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase161-index-export-plan-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase161-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase161-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const routeSource = read(routePath)
const indexText = read(indexPath)
assert(routeSource.includes('createSoundCpuDisabledDispatchRouteResult'), 'route helper missing')
assert(routeSource.includes('assertSoundCpuDisabledDispatchRouteExecutionBlocked'), 'blocked assertion missing')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(
  !indexText.includes('disabled-dispatch-route.ts') || phase164IndexExportEvidenceExists(),
  'index export must not include route source before Phase164 evidence',
)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2196, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '2b7bdf4c128c677da741261fc7eee43a307f6a4f', 'source merge mismatch')
assert(parsed.source.validationResult.staticRouteSourceImportSucceeded === true, 'source static import failed')
assert(parsed.source.validationResult.safePayloadAcceptedForDispatch === false, 'source dispatch accepted')
assert(parsed.source.validationResult.blockedPayloadRejected === true, 'source blocked payload failed')
assert(parsed.source.validationResult.assertionThrows === true, 'source assertion missing')
assert(parsed.source.validationResult.indexExportAddedToday === false, 'source index export added')
assert(parsed.source.validationResult.routeRegisteredToday === false, 'source route registered')
assert(parsed.source.validationResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceOutput.decision === sourceDecision, 'source output decision mismatch')
assert(parsed.sourceOutput.safePayloadAcceptedForDispatch === false, 'source output accepted dispatch')
assert(parsed.sourceOutput.blockedPayloadRejected === true, 'source output blocked payload failed')
assert(parsed.sourceOutput.assertionReasonMatches === true, 'source output assertion mismatch')
assert(parsed.sourceOutput.noWorkerExecution === true, 'source output worker execution not blocked')
assert(parsed.sourceOutput.noRouteExecution === true, 'source output route execution not blocked')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowIndexExportPlanning === true, 'source prompt index planning missing')
assert(parsed.sourcePrompt.reviewScope.allowRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2198, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '797dfad8071902e304d8eb1849d6d98d88275156', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.disabledRouteSourceAcceptedForIndexExportPlanning === true, 'owner review did not accept planning')
assert(parsed.result.ownerReviewResult.staticRouteSourceImportAccepted === true, 'static import not accepted')
assert(parsed.result.ownerReviewResult.safePayloadAcceptedForDispatch === false, 'owner review dispatch accepted')
assert(parsed.result.ownerReviewResult.blockedPayloadRejected === true, 'owner review blocked payload missing')
assert(parsed.result.ownerReviewResult.assertionThrows === true, 'owner review assertion missing')
assert(parsed.result.ownerReviewResult.indexExportPlanningMayProceed === true, 'index planning not allowed')
assert(parsed.result.ownerReviewResult.indexExportAddedToday === false, 'index export added today')
assert(parsed.result.ownerReviewResult.routeRegisteredToday === false, 'route registered today')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForIndexExportPlanning === true, 'index export planning not accepted')
assert(parsed.acceptance.acceptedForIndexExportToday === false, 'index export accepted today')
assert(parsed.acceptance.acceptedForRouteRegistrationToday === false, 'route registration accepted')
assert(parsed.acceptance.acceptedForWorkerDispatchExecutionToday === false, 'worker execution accepted')
assert(parsed.acceptance.acceptedForRouteExecutionToday === false, 'route execution accepted')

assert(parsed.evidence.staticRouteSourceImportSucceeded === true, 'evidence static import failed')
assert(parsed.evidence.safePayloadAcceptedForDispatch === false, 'evidence accepted dispatch')
assert(parsed.evidence.blockedPayloadRejected === true, 'evidence blocked payload failed')
assert(parsed.evidence.assertionThrows === true, 'evidence assertion missing')
assert(parsed.evidence.evidenceAcceptedForOwnerReview === true, 'evidence owner review missing')
assert(parsed.evidence.executionClaimsAccepted === false, 'evidence execution accepted')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.indexExportPlanningMayProceed === true, 'index planning readiness missing')
assert(parsed.readiness.plannedOnlySurface.mustPreserveAcceptedForDispatchFalse === true, 'fail-closed requirement missing')
assert(parsed.readiness.stillForbidden.includes('index_export_source_change'), 'index source blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_registration'), 'route registration blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.disabledRouteSourceAcceptedForIndexExportPlanning === true, 'allowed owner claim missing')
assert(parsed.claimPolicy.allowedClaims.indexExportPlanningMayProceed === true, 'allowed index planning claim missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForDispatch === false, 'allowed acceptedForDispatch widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowIndexExportPlan === true, 'next prompt index plan missing')
assert(parsed.nextPrompt.planningScope.allowIndexExportSourceChange === false, 'next prompt source change widened')
assert(parsed.nextPrompt.planningScope.allowRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase161-disabled-route-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase161-disabled-route-source-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2198,
      disabledRouteSourceAcceptedForIndexExportPlanning: true,
      staticRouteSourceImportAccepted: true,
      safePayloadAcceptedForDispatch: false,
      blockedPayloadRejected: true,
      indexExportPlanningMayProceed: true,
      indexExportAddedToday: false,
      routeRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE162-DISABLED-ROUTE-INDEX-EXPORT-PLAN',
    },
    null,
    2,
  ),
)
