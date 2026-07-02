import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase151_dispatch_contract_index_export_plan_completed_with_warnings_ready_for_index_export_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase152_dispatch_contract_index_export_owner_review_passed_with_warnings_ready_for_actual_index_export_source_creation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase153_actual_dispatch_contract_index_export_source_creation_completed_with_warnings_ready_for_index_export_static_validation'
const sourcePath = 'server/workers/sound-cpu/dispatch-contract.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase152-index-export-owner-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase152-source-creation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase152-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase152-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-creation.md',
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
    'indexExportAdded',
    'indexExportAddedToday',
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'claimLeaseMutationEnabled',
    'toolExecutionEnabled',
    'providerCallEnabled',
    'modelCallEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
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
    'allowPaidProduction'
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase152-index-export-owner-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase152-source-creation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase152-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase152-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-creation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexText = read(indexPath)
assert(fs.existsSync(path.join(process.cwd(), sourcePath)), 'dispatch contract source missing')
assert(!indexText.includes('dispatch-contract.ts'), 'index export must not exist in Phase152')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.planResult.indexExportPlanned === true, 'index export plan missing')
assert(parsed.source.planResult.indexExportAddedInThisGate === false, 'source index export widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.reviewIndexExportPlanOnly === true, 'review scope mismatch')
assert(parsed.sourcePrompt.reviewScope.allowIndexExportSourceChange === false, 'source prompt change widened')
assert(parsed.sourcePrompt.reviewScope.allowWorkerDispatchExecution === false, 'dispatch widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2179, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '6b1bb821f0921ee162ea0c9b00fc89854997277d', 'source merge mismatch')
assert(parsed.result.ownerReviewResult.indexExportPlanAccepted === true, 'index plan not accepted')
assert(parsed.result.ownerReviewResult.actualIndexExportSourceCreationMayProceed === true, 'source creation not approved')
assert(parsed.result.ownerReviewResult.indexExportAddedToday === false, 'index export added today')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForFutureSourceCreation === true, 'future source creation not accepted')
assert(parsed.acceptance.acceptedExports.includes('validateSoundCpuDispatchContractPayload'), 'validation export missing')
assert(parsed.acceptance.acceptedForExecutionToday === false, 'execution accepted unexpectedly')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.sourceCreationMayProceed === true, 'source creation readiness missing')
assert(parsed.readiness.stillForbidden.includes('worker_dispatch_execution'), 'worker dispatch blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assert(parsed.blocked.noFixBlockerFound === true, 'unexpected fix blocker')

assert(parsed.claimPolicy.allowedClaims.indexExportPlanAccepted === true, 'allowed owner claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.nextPrompt.sourceCreationScope.allowIndexExportSourceChange === true, 'next prompt source change missing')
assert(parsed.nextPrompt.sourceCreationScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase152-dispatch-contract-index-export-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2179,
      sourcePath,
      indexPath,
      actualIndexExportSourceCreationMayProceed: true,
      indexExportAddedToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE153-ACTUAL-DISPATCH-CONTRACT-INDEX-EXPORT-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
