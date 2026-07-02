import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase159_actual_disabled_dispatch_route_source_creation_completed_with_warnings_ready_for_disabled_route_static_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase160_disabled_dispatch_route_static_validation_passed_with_warnings_ready_for_disabled_route_source_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase161_disabled_route_source_owner_review_passed_with_warnings_ready_for_disabled_route_index_export_plan'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation-result.md',
  output: 'docs/worker-runtime-jobs-sound-cpu-phase160-static-route-import-proof-output.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase160-disabled-route-validation-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase160-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase160-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase161-disabled-route-source-owner-review.md',
  proofRunner: 'scripts/validation/worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation-runner.ts',
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
    'indexExportAddedToday',
    'indexExportAdded',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation-result'),
  output: parseJsonBlock(docs.output, 'worker-runtime-jobs-sound-cpu-phase160-static-route-import-proof-output'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase160-disabled-route-validation-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase160-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase160-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase161-disabled-route-source-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const routeSource = read(routePath)
const indexText = read(indexPath)
const runnerText = read(docs.proofRunner)
assert(routeSource.includes('createSoundCpuDisabledDispatchRouteResult'), 'route helper missing')
assert(routeSource.includes('assertSoundCpuDisabledDispatchRouteExecutionBlocked'), 'blocked assertion missing')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(routeSource.includes("from './dispatch-contract.ts'"), 'route source must import direct dispatch contract')
assert(!routeSource.includes("from './index.ts'"), 'route source must not import index')
assert(!routeSource.includes('fetch('), 'route source must not call network')
assert(!routeSource.includes('child_process'), 'route source must not spawn processes')
assert(
  !indexText.includes('disabled-dispatch-route.ts') || phase164IndexExportEvidenceExists(),
  'index export must not include route source before Phase164 evidence',
)
assert(runnerText.includes("from '../../server/workers/sound-cpu/disabled-dispatch-route.ts'"), 'proof runner must import route source directly')
assert(runnerText.includes("from '../../server/workers/sound-cpu/dispatch-contract.ts'"), 'proof runner must import dispatch flags directly')
assert(!runnerText.includes('child_process'), 'proof runner must not spawn processes')
assert(!runnerText.includes('fetch('), 'proof runner must not call network')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2194, 'source source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'dfefdc836caebc0cedf2d1370c4b50ce8ac16c7a', 'source merge mismatch')
assert(parsed.source.sourceChange.routeSourceCreated === true, 'source route source not created')
assert(parsed.source.sourceChange.routeRegisteredToday === false, 'source route registered')
assert(parsed.source.sourceChange.indexExportAddedToday === false, 'source index export added')
assert(parsed.source.sourceChange.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.validationScope.allowStaticRouteSourceImport === true, 'static route validation missing')
assert(parsed.sourcePrompt.validationScope.allowRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.validationScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2196, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '2b7bdf4c128c677da741261fc7eee43a307f6a4f', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.validationResult.staticRouteSourceImportSucceeded === true, 'result static import failed')
assert(parsed.result.validationResult.safePayloadAcceptedByStaticContract === true, 'safe payload failed')
assert(parsed.result.validationResult.safePayloadAcceptedForDispatch === false, 'safe payload accepted dispatch')
assert(parsed.result.validationResult.blockedPayloadRejected === true, 'blocked payload not rejected')
assert(parsed.result.validationResult.blockedPayloadReason === 'runtime_flag_not_disabled', 'blocked payload reason mismatch')
assert(parsed.result.validationResult.assertionThrows === true, 'assertion did not throw')
assert(parsed.result.validationResult.assertionReasonMatches === true, 'assertion reason mismatch')
assert(parsed.result.validationResult.routeRegisteredToday === false, 'route registered today')
assert(parsed.result.validationResult.indexExportAddedToday === false, 'index export added today')
assert(parsed.result.validationResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.validationResult.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.output.decision === decision, 'proof output decision mismatch')
assert(parsed.output.staticRouteSourceImportSucceeded === true, 'proof import failed')
assert(parsed.output.safePayloadAcceptedByStaticContract === true, 'proof safe payload failed')
assert(parsed.output.safePayloadAcceptedForDispatch === false, 'proof accepted dispatch')
assert(parsed.output.blockedPayloadRejected === true, 'proof blocked payload failed')
assert(parsed.output.blockedPayloadReason === 'runtime_flag_not_disabled', 'proof blocked reason mismatch')
assert(parsed.output.assertionThrows === true, 'proof assertion did not throw')
assert(parsed.output.assertionReasonMatches === true, 'proof assertion reason mismatch')
assert(parsed.output.noWorkerExecution === true, 'proof worker execution not blocked')
assert(parsed.output.noRouteExecution === true, 'proof route execution not blocked')
assert(parsed.output.noSupabaseMutation === true, 'proof Supabase not blocked')
assert(parsed.output.noSqlExecution === true, 'proof SQL not blocked')
assert(parsed.output.noMediaProcessing === true, 'proof media not blocked')
assert(parsed.output.noArtifactCreated === true, 'proof artifact not blocked')
assert(parsed.output.workerDispatchExecutionEnabled === false, 'proof dispatch widened')
assert(parsed.output.routeExecutionEnabled === false, 'proof route execution widened')
assert(parsed.output.routeRegisteredToday === false, 'proof route registered')
assert(parsed.output.indexExportAddedToday === false, 'proof index export added')

assert(parsed.register.routeSourcePath === routePath, 'register route path mismatch')
assert(parsed.register.staticRouteSourceImportSucceeded === true, 'register static import failed')
assert(parsed.register.safePayloadAcceptedForDispatch === false, 'register dispatch accepted')
assert(parsed.register.blockedPayloadRejected === true, 'register blocked payload failed')
assert(parsed.register.assertionThrows === true, 'register assertion missing')
assert(parsed.register.acceptedForOwnerReview === true, 'register owner review not allowed')
assert(parsed.register.routeRegisteredToday === false, 'register route registered')
assert(parsed.register.indexExportAddedToday === false, 'register index export added')
assert(parsed.register.acceptedForExecutionToday === false, 'register accepted execution')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.disabledRouteSourceStaticValidationPassed === true, 'static validation claim missing')
assert(parsed.claimPolicy.allowedClaims.safePayloadAcceptedForDispatch === false, 'allowed dispatch claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowStaticValidationReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowIndexExportPlanning === true, 'next prompt index export planning missing')
assert(parsed.nextPrompt.reviewScope.allowRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase160-disabled-dispatch-route-static-validation:proof'] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation-runner.ts',
  'proof package script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase160-disabled-dispatch-route-static-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation-diagnostics.mjs',
  'diagnostics package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2196,
      staticRouteSourceImportSucceeded: true,
      safePayloadAcceptedByStaticContract: true,
      safePayloadAcceptedForDispatch: false,
      blockedPayloadRejected: true,
      assertionThrows: true,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE161-DISABLED-ROUTE-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
