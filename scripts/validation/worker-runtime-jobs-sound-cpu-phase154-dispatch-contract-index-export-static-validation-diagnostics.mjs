import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase153_actual_dispatch_contract_index_export_source_creation_completed_with_warnings_ready_for_index_export_static_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase154_dispatch_contract_index_export_static_validation_passed_with_warnings_ready_for_index_export_owner_validation_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase155_dispatch_contract_index_export_owner_validation_review_passed_with_warnings_ready_for_disabled_dispatch_route_plan'
const sourcePath = 'server/workers/sound-cpu/dispatch-contract.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation-result.md',
  output: 'docs/worker-runtime-jobs-sound-cpu-phase154-static-import-proof-output.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase154-index-export-validation-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase154-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase154-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review.md',
  proofRunner: 'scripts/validation/worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation-runner.ts',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation-result'),
  output: parseJsonBlock(docs.output, 'worker-runtime-jobs-sound-cpu-phase154-static-import-proof-output'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase154-index-export-validation-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase154-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase154-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexText = read(indexPath)
const sourceText = read(sourcePath)
const runnerText = read(docs.proofRunner)
assert(indexText.includes("from './dispatch-contract.ts'"), 'index dispatch export missing')
assert(sourceText.includes('acceptedForDispatch: false'), 'source fail-closed envelope missing')
assert(runnerText.includes("from '../../server/workers/sound-cpu/index.ts'"), 'proof runner must import from package index')
assert(!runnerText.includes('child_process'), 'proof runner must not spawn processes')
assert(!runnerText.includes('fetch('), 'proof runner must not call network')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceChange.indexExportAdded === true, 'source index export missing')
assert(parsed.source.sourceChange.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.validationScope.allowStaticIndexImportValidation === true, 'static index validation missing')
assert(parsed.sourcePrompt.validationScope.allowWorkerDispatchExecution === false, 'source prompt dispatch widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2183, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '846afd4e43aefb1a45bca60c2e438b9e0e1cebe9', 'source merge mismatch')
assert(parsed.result.validationResult.staticIndexImportSucceeded === true, 'static import failed')
assert(parsed.result.validationResult.safePayloadAccepted === true, 'safe payload not accepted')
assert(parsed.result.validationResult.blockedPayloadRejected === true, 'blocked payload not rejected')
assert(parsed.result.validationResult.acceptedForDispatch === false, 'dispatch accepted unexpectedly')
assert(parsed.result.validationResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.output.decision === decision, 'proof output decision mismatch')
assert(parsed.output.staticIndexImportSucceeded === true, 'proof output import failed')
assert(parsed.output.safePayloadAccepted === true, 'proof output safe payload failed')
assert(parsed.output.blockedPayloadRejected === true, 'proof output blocked payload failed')
assert(parsed.output.blockedPayloadReason === 'runtime_flag_not_disabled', 'blocked reason mismatch')
assert(parsed.output.acceptedForDispatch === false, 'proof output accepted dispatch')
assert(parsed.output.noWorkerExecution === true, 'proof output worker execution not blocked')
assert(parsed.output.noRouteExecution === true, 'proof output route execution not blocked')
assert(parsed.output.noSupabaseMutation === true, 'proof output Supabase not blocked')
assert(parsed.output.noSqlExecution === true, 'proof output SQL not blocked')
assert(parsed.output.noMediaProcessing === true, 'proof output media not blocked')
assert(parsed.output.noArtifactCreated === true, 'proof output artifact not blocked')

assert(parsed.register.staticImportValidationPassed === true, 'register validation failed')
assert(parsed.register.acceptedForExecutionToday === false, 'register accepted execution')
assert(parsed.register.acceptedForOwnerValidationReview === true, 'owner review not allowed')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')

assert(parsed.claimPolicy.allowedClaims.staticIndexImportSucceeded === true, 'static import claim missing')
assert(parsed.claimPolicy.blockedClaims.acceptedForDispatch === false, 'accepted dispatch claim widened')
assertFalseMap(
  Object.fromEntries(Object.entries(parsed.claimPolicy.blockedClaims).filter(([key]) => key !== 'acceptedForDispatch')),
  'claimPolicy.blockedClaims',
)
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowStaticValidationReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase154-dispatch-contract-index-export-static-validation:proof'] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation-runner.ts',
  'proof package script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase154-dispatch-contract-index-export-static-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation-diagnostics.mjs',
  'diagnostics package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2183,
      staticIndexImportSucceeded: true,
      safePayloadAccepted: true,
      blockedPayloadRejected: true,
      acceptedForDispatch: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE155-DISPATCH-CONTRACT-INDEX-EXPORT-OWNER-VALIDATION-REVIEW',
    },
    null,
    2,
  ),
)
