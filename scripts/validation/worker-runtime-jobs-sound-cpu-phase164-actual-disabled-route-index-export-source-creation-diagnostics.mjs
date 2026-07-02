import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase163_disabled_route_index_export_owner_review_passed_with_warnings_ready_for_actual_disabled_route_index_export_source_creation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase164_actual_disabled_route_index_export_source_creation_completed_with_warnings_ready_for_index_export_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase165_disabled_route_index_export_static_validation_passed_with_warnings_ready_for_index_export_source_owner_review'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase163-disabled-route-index-export-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-creation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-result.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase164-index-export-source-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase164-index-export-static-validation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase164-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase164-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation.md',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase163-disabled-route-index-export-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-creation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-result'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase164-index-export-source-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase164-index-export-static-validation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase164-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase164-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const routeSource = read(routePath)
const indexText = read(indexPath)
assert(routeSource.includes('createSoundCpuDisabledDispatchRouteResult'), 'route helper missing')
assert(routeSource.includes('assertSoundCpuDisabledDispatchRouteExecutionBlocked'), 'blocked assertion missing')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(routeSource.includes("from './dispatch-contract.ts'"), 'route source must still import direct dispatch contract')
assert(indexText.includes("from './disabled-dispatch-route.ts'"), 'index export missing disabled route source')
assert(indexText.includes('createSoundCpuDisabledDispatchRouteResult'), 'index create result export missing')
assert(indexText.includes('assertSoundCpuDisabledDispatchRouteExecutionBlocked'), 'index assert export missing')
assert(indexText.includes('type SoundCpuDisabledDispatchRouteResult'), 'index result type export missing')
assert(!routeSource.includes('fetch('), 'route source must not call network')
assert(!routeSource.includes('child_process'), 'route source must not spawn processes')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2201, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '36b829b7327c84cd907046aa3b7ec4aabc0606e0', 'source merge mismatch')
assert(parsed.source.ownerReviewResult.indexExportPlanAccepted === true, 'source plan not accepted')
assert(parsed.source.ownerReviewResult.actualIndexExportSourceCreationMayProceed === true, 'source creation not allowed')
assert(parsed.source.ownerReviewResult.indexExportAddedToday === false, 'source index export added early')
assert(parsed.source.ownerReviewResult.routeRegisteredToday === false, 'source route registered')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.sourceCreationScope.allowIndexExportSourceChange === true, 'source prompt index change missing')
assert(parsed.sourcePrompt.sourceCreationScope.allowRouteSourceChange === false, 'source prompt route source widened')
assert(parsed.sourcePrompt.sourceCreationScope.allowRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.sourceCreationScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2204, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'afa151d3905774f39df1508cd9043aa3f5493f0d', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.sourceChange.indexPath === indexPath, 'result index path mismatch')
assert(parsed.result.sourceChange.routePath === routePath, 'result route path mismatch')
assert(parsed.result.sourceChange.indexExportAdded === true, 'index export not recorded')
assert(parsed.result.sourceChange.routeSourceChanged === false, 'route source changed')
assert(parsed.result.sourceChange.routeRegisteredToday === false, 'route registered today')
assert(parsed.result.sourceChange.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.sourceChange.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.register.exportAdded === true, 'register export missing')
assert(parsed.register.exportedValues.includes('createSoundCpuDisabledDispatchRouteResult'), 'register create export missing')
assert(parsed.register.exportedTypes.includes('SoundCpuDisabledDispatchRouteResult'), 'register type export missing')
assert(parsed.register.routeRegisteredToday === false, 'register route registered')
assert(parsed.register.acceptedForExecutionToday === false, 'register accepted execution')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.staticValidationMayProceed === true, 'static validation readiness missing')
assert(parsed.readiness.requiredStaticValidation.includes('index_import_succeeds'), 'index import validation missing')
assert(parsed.readiness.routeRegistrationMayProceed === false, 'route registration readiness widened')
assert(parsed.readiness.workerDispatchExecutionMayProceed === false, 'worker dispatch readiness widened')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.indexExportAdded === true, 'index export claim missing')
assert(parsed.claimPolicy.allowedClaims.routeSourceChanged === false, 'route source changed claim widened')
assert(parsed.claimPolicy.allowedClaims.acceptedForDispatch === false, 'accepted dispatch claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.allowStaticIndexImportValidation === true, 'next prompt static validation missing')
assert(parsed.nextPrompt.validationScope.allowRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase164-actual-disabled-route-index-export-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-creation-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2204,
      indexExportAdded: true,
      routeSourceChanged: false,
      routeRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE165-DISABLED-ROUTE-INDEX-EXPORT-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
