import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase167_disabled_route_registration_plan_completed_with_warnings_ready_for_disabled_route_registration_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase168_disabled_route_registration_owner_review_passed_with_warnings_ready_for_actual_disabled_route_registration_source_creation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase169_actual_disabled_route_registration_source_creation_completed_with_warnings_ready_for_registration_static_validation'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const registryPath = 'server/workers/sound-cpu/disabled-route-registry.ts'
const adjacentExpressRoutePath = 'server/routes/sound-cpu-worker-routes.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase167-disabled-route-registration-plan-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase168-disabled-route-registration-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase168-disabled-route-registration-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase168-registration-owner-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase168-actual-source-creation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase168-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase168-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase169-actual-disabled-route-registration-source-creation.md',
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
    'registrySourceCreated',
    'registrySourceCreatedToday',
    'registrySourceChangeMade',
    'existingAdjacentExpressRouteMutated',
    'existingAdjacentExpressRouteMutatedToday',
    'expressRouteRegistered',
    'appRouteRegisteredToday',
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
    'allowIndexExportChange',
    'allowExistingExpressRouteMutation',
    'allowExpressRouteRegistration',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase167-disabled-route-registration-plan-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase168-disabled-route-registration-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase168-disabled-route-registration-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase168-registration-owner-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase168-actual-source-creation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase168-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase168-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase169-actual-disabled-route-registration-source-creation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexText = read(indexPath)
const routeSource = read(routePath)
const adjacentExpressRoute = read(adjacentExpressRoutePath)
assert(indexText.includes("from './disabled-dispatch-route.ts'"), 'index export missing disabled route source')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(adjacentExpressRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'), 'adjacent Express route must remain disabled')
assert(!fs.existsSync(path.join(process.cwd(), registryPath)), 'registry source must not exist in owner-review phase')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2210, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '9755755f946aac5f7dab485564a46cc6fe3e90ed', 'source merge mismatch')
assert(parsed.source.planResult.disabledRouteRegistrationPlanned === true, 'source registration plan missing')
assert(parsed.source.planResult.registrySourceCreatedToday === false, 'source registry created')
assert(parsed.source.planResult.appRouteRegisteredToday === false, 'source app route registered')
assert(parsed.source.planResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.planResult.routeExecutionEnabled === false, 'source route execution widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowRegistrationPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowActualDisabledRouteRegistrySourceCreation === true, 'source prompt source creation path missing')
assert(parsed.sourcePrompt.reviewScope.allowRegistrySourceChangeToday === false, 'source prompt source change today widened')
assert(parsed.sourcePrompt.reviewScope.allowExpressRouteRegistration === false, 'source prompt express route widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2214, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '684402d1484847fa2b6b2839bd0944132d48e869', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.disabledRouteRegistrationPlanAccepted === true, 'plan not accepted')
assert(parsed.result.ownerReviewResult.actualDisabledRouteRegistrySourceCreationMayProceed === true, 'source creation not accepted')
assert(parsed.result.ownerReviewResult.candidateRegistryPath === registryPath, 'result registry path mismatch')
assert(parsed.result.ownerReviewResult.registrySourceCreatedToday === false, 'result registry source created today')
assert(parsed.result.ownerReviewResult.existingAdjacentExpressRouteMutatedToday === false, 'result adjacent route mutated')
assert(parsed.result.ownerReviewResult.appRouteRegisteredToday === false, 'result app route registered')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'result route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForActualDisabledRouteRegistrySourceCreation === true, 'acceptance source creation missing')
assert(parsed.acceptance.acceptedCandidateRegistryPath === registryPath, 'acceptance registry path mismatch')
assert(parsed.acceptance.acceptedRegistryEntryRequirements.acceptedForDispatch === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedForRegistrySourceCreationToday === false, 'accepted source creation today')
assert(parsed.acceptance.acceptedForExpressRouteMutationToday === false, 'accepted express mutation today')
assert(parsed.acceptance.acceptedForAppRouteRegistrationToday === false, 'accepted app route today')
assert(parsed.acceptance.acceptedForWorkerDispatchExecutionToday === false, 'accepted worker dispatch today')
assert(parsed.acceptance.acceptedForRouteExecutionToday === false, 'accepted route execution today')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.actualSourceCreationMayProceed === true, 'source creation readiness missing')
assert(parsed.readiness.allowedFutureSourcePath === registryPath, 'readiness source path mismatch')
assert(parsed.readiness.registrySourceCreatedToday === false, 'readiness source created today')
assert(parsed.readiness.stillForbidden.includes('express_route_registration'), 'express route blocker missing')
assert(parsed.readiness.stillForbidden.includes('route_execution'), 'route execution blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.disabledRouteRegistrationPlanAccepted === true, 'plan accepted claim missing')
assert(parsed.claimPolicy.allowedClaims.actualDisabledRouteRegistrySourceCreationMayProceed === true, 'source creation claim missing')
assert(parsed.claimPolicy.allowedClaims.registrySourceCreatedToday === false, 'source created claim widened')
assert(parsed.claimPolicy.allowedClaims.acceptedForDispatch === false, 'accepted dispatch claim widened')
assert(parsed.claimPolicy.allowedClaims.appRouteRegisteredToday === false, 'app route claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.sourceCreationScope.allowCreateDisabledRouteRegistrySource === true, 'next prompt source creation missing')
assert(parsed.nextPrompt.sourceCreationScope.allowIndexExportChange === false, 'next prompt index widened')
assert(parsed.nextPrompt.sourceCreationScope.allowExistingExpressRouteMutation === false, 'next prompt express mutation widened')
assert(parsed.nextPrompt.sourceCreationScope.allowExpressRouteRegistration === false, 'next prompt express route widened')
assert(parsed.nextPrompt.sourceCreationScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase168-disabled-route-registration-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase168-disabled-route-registration-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2214,
      disabledRouteRegistrationPlanAccepted: true,
      actualDisabledRouteRegistrySourceCreationMayProceed: true,
      registrySourceCreatedToday: false,
      appRouteRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE169-ACTUAL-DISABLED-ROUTE-REGISTRATION-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
