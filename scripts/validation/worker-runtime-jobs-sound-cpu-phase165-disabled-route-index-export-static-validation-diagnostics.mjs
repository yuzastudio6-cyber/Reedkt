import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase164_actual_disabled_route_index_export_source_creation_completed_with_warnings_ready_for_index_export_static_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase165_disabled_route_index_export_static_validation_passed_with_warnings_ready_for_index_export_source_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase166_disabled_route_index_export_source_owner_review_passed_with_warnings_ready_for_disabled_route_registration_plan'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation-result.md',
  output: 'docs/worker-runtime-jobs-sound-cpu-phase165-static-index-import-proof-output.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase165-index-export-validation-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase165-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase165-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase166-disabled-route-index-export-source-owner-review.md',
  proofRunner: 'scripts/validation/worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation-runner.ts',
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
    'allowRouteRegistrationSourceChange',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase164-actual-disabled-route-index-export-source-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation-result'),
  output: parseJsonBlock(docs.output, 'worker-runtime-jobs-sound-cpu-phase165-static-index-import-proof-output'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase165-index-export-validation-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase165-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase165-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase166-disabled-route-index-export-source-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexText = read(indexPath)
const routeSource = read(routePath)
const runnerText = read(docs.proofRunner)
assert(indexText.includes("from './disabled-dispatch-route.ts'"), 'index export missing disabled route source')
assert(indexText.includes('createSoundCpuDisabledDispatchRouteResult'), 'index create result export missing')
assert(indexText.includes('assertSoundCpuDisabledDispatchRouteExecutionBlocked'), 'index blocked assertion export missing')
assert(routeSource.includes('acceptedForDispatch: false'), 'route source must stay fail-closed')
assert(runnerText.includes("from '../../server/workers/sound-cpu/index.ts'"), 'proof runner must import from index')
assert(!runnerText.includes('child_process'), 'proof runner must not spawn processes')
assert(!runnerText.includes('fetch('), 'proof runner must not call network')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2204, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'afa151d3905774f39df1508cd9043aa3f5493f0d', 'source merge mismatch')
assert(parsed.source.sourceChange.indexExportAdded === true, 'source index export missing')
assert(parsed.source.sourceChange.routeSourceChanged === false, 'source route source changed')
assert(parsed.source.sourceChange.routeRegisteredToday === false, 'source route registered')
assert(parsed.source.sourceChange.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.validationScope.allowStaticIndexImportValidation === true, 'source prompt static validation missing')
assert(parsed.sourcePrompt.validationScope.allowRouteRegistration === false, 'source prompt route registration widened')
assert(parsed.sourcePrompt.validationScope.allowRouteExecution === false, 'source prompt route execution widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2205, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'b53203a03b41f1e7b4bbf526650faab8d5f5bc17', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.validationResult.staticIndexImportSucceeded === true, 'result static import failed')
assert(parsed.result.validationResult.safePayloadAcceptedByStaticContract === true, 'safe payload failed')
assert(parsed.result.validationResult.safePayloadAcceptedForDispatch === false, 'safe payload accepted dispatch')
assert(parsed.result.validationResult.blockedPayloadRejected === true, 'blocked payload not rejected')
assert(parsed.result.validationResult.assertionThrows === true, 'assertion missing')
assert(parsed.result.validationResult.routeRegisteredToday === false, 'route registered today')
assert(parsed.result.validationResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.validationResult.routeExecutionEnabled === false, 'route execution widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.output.decision === decision, 'proof output decision mismatch')
assert(parsed.output.staticIndexImportSucceeded === true, 'proof import failed')
assert(parsed.output.safePayloadAcceptedByStaticContract === true, 'proof safe payload failed')
assert(parsed.output.safePayloadAcceptedForDispatch === false, 'proof accepted dispatch')
assert(parsed.output.blockedPayloadRejected === true, 'proof blocked payload failed')
assert(parsed.output.blockedPayloadReason === 'runtime_flag_not_disabled', 'proof blocked reason mismatch')
assert(parsed.output.assertionThrows === true, 'proof assertion missing')
assert(parsed.output.assertionReasonMatches === true, 'proof assertion mismatch')
assert(parsed.output.noWorkerExecution === true, 'proof worker execution not blocked')
assert(parsed.output.noRouteExecution === true, 'proof route execution not blocked')
assert(parsed.output.noSupabaseMutation === true, 'proof Supabase not blocked')
assert(parsed.output.noSqlExecution === true, 'proof SQL not blocked')
assert(parsed.output.noMediaProcessing === true, 'proof media not blocked')
assert(parsed.output.noArtifactCreated === true, 'proof artifact not blocked')

assert(parsed.register.staticIndexImportSucceeded === true, 'register static import missing')
assert(parsed.register.safePayloadAcceptedForDispatch === false, 'register accepted dispatch')
assert(parsed.register.blockedPayloadRejected === true, 'register blocked payload failed')
assert(parsed.register.assertionThrows === true, 'register assertion missing')
assert(parsed.register.acceptedForOwnerReview === true, 'register owner review missing')
assert(parsed.register.routeRegisteredToday === false, 'register route registered')
assert(parsed.register.acceptedForExecutionToday === false, 'register accepted execution')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.staticIndexImportSucceeded === true, 'static import claim missing')
assert(parsed.claimPolicy.allowedClaims.safePayloadAcceptedForDispatch === false, 'accepted dispatch claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowStaticValidationReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowRouteRegistrationPlanning === true, 'next prompt route planning missing')
assert(parsed.nextPrompt.reviewScope.allowRouteRegistrationSourceChange === false, 'next prompt route registration source widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase165-disabled-route-index-export-static-validation:proof'] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation-runner.ts',
  'proof package script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase165-disabled-route-index-export-static-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase165-disabled-route-index-export-static-validation-diagnostics.mjs',
  'diagnostics package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2205,
      staticIndexImportSucceeded: true,
      safePayloadAcceptedForDispatch: false,
      blockedPayloadRejected: true,
      assertionThrows: true,
      routeRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE166-DISABLED-ROUTE-INDEX-EXPORT-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
