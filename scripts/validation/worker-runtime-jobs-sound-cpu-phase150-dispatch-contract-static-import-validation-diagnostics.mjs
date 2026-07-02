import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase149_dispatch_contract_source_owner_review_passed_with_warnings_ready_for_static_import_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase150_dispatch_contract_static_import_validation_passed_with_warnings_ready_for_index_export_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase151_dispatch_contract_index_export_plan_completed_with_warnings_ready_for_index_export_owner_review'
const sourcePath = 'server/workers/sound-cpu/dispatch-contract.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase149-dispatch-contract-source-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation-result.md',
  output: 'docs/worker-runtime-jobs-sound-cpu-phase150-static-import-proof-output.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase150-static-import-validation-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase150-index-export-plan-readiness.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase150-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan.md',
  proofRunner: 'scripts/validation/worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation-runner.ts',
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
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'toolExecutionEnabled',
    'providerCallEnabled',
    'modelCallEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'allowIndexExportSourceChange',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase149-dispatch-contract-source-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation-result'),
  output: parseJsonBlock(docs.output, 'worker-runtime-jobs-sound-cpu-phase150-static-import-proof-output'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase150-static-import-validation-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase150-index-export-plan-readiness'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase150-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const sourceText = read(sourcePath)
const indexText = read(indexPath)
const runnerText = read(docs.proofRunner)
assert(sourceText.includes('validateSoundCpuDispatchContractPayload'), 'source helper missing')
assert(sourceText.includes('buildDisabledSoundCpuDispatchEnvelope'), 'disabled envelope helper missing')
assert(!indexText.includes('dispatch-contract.ts'), 'index export must remain blocked')
assert(runnerText.includes('validateSoundCpuDispatchContractPayload'), 'runner does not import validation helper')
assert(runnerText.includes('buildDisabledSoundCpuDispatchEnvelope'), 'runner does not import envelope helper')
assert(!runnerText.includes('fetch('), 'runner must not call network')
assert(!runnerText.includes('child_process'), 'runner must not spawn processes')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReviewResult.staticImportValidationMayProceed === true, 'static import not approved')
assert(parsed.source.ownerReviewResult.indexExportAllowedToday === false, 'source index export widened')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.validationScope.allowStaticImport === true, 'source prompt static import missing')
assert(parsed.sourcePrompt.validationScope.allowDisabledEnvelopeConstruction === true, 'source prompt disabled envelope missing')
assert(parsed.sourcePrompt.validationScope.allowIndexExport === false, 'source prompt index export widened')
assert(parsed.sourcePrompt.validationScope.allowWorkerDispatchExecution === false, 'source prompt dispatch widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2174, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'd093c6dd6cb3c1d3063497de03015668d05c2588', 'source merge mismatch')
assert(parsed.result.validationResult.staticImportSucceeded === true, 'static import missing')
assert(parsed.result.validationResult.safePayloadAccepted === true, 'safe payload not accepted')
assert(parsed.result.validationResult.blockedPayloadRejected === true, 'blocked payload not rejected')
assert(parsed.result.validationResult.acceptedForDispatch === false, 'dispatch acceptance widened')
assert(parsed.result.validationResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

const sanitized = parsed.output.sanitizedOutput
assert(sanitized.ok === true, 'proof output not ok')
assert(sanitized.staticImportSucceeded === true, 'proof import missing')
assert(sanitized.blockedPayloadReason === 'runtime_flag_not_disabled', 'blocked reason mismatch')
assert(sanitized.acceptedForDispatch === false, 'proof dispatch acceptance widened')
assert(sanitized.noWorkerExecution === true, 'proof noWorker marker missing')
assert(sanitized.noSupabaseMutation === true, 'proof noSupabase marker missing')
assert(sanitized.workerDispatchExecutionEnabled === false, 'proof dispatch widened')

assert(parsed.register.sourcePath === sourcePath, 'register path mismatch')
assert(parsed.register.validatedExports.includes('validateSoundCpuDispatchContractPayload'), 'validation export missing')
assert(parsed.register.validatedFixtures.safeSyntheticPayload === true, 'safe fixture missing')
assertFalseMap(parsed.register.runtimeActionsPerformed, 'register.runtimeActionsPerformed')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.indexExportMayBePlanned === true, 'index export plan not allowed')
assert(parsed.readiness.indexExportAddedToday === false, 'index export added today')
assert(parsed.readiness.executionStillBlocked.includes('worker_dispatch_execution'), 'worker dispatch blocker missing')

assert(parsed.claimPolicy.allowedClaims.staticImportSucceeded === true, 'allowed static import claim missing')
assert(parsed.claimPolicy.allowedClaims.disabledEnvelopeBuilt === true, 'allowed envelope claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.nextPrompt.planningScope.allowIndexExportPlan === true, 'next prompt index plan missing')
assert(parsed.nextPrompt.planningScope.allowIndexExportSourceChange === false, 'next prompt index source widened')
assert(parsed.nextPrompt.planningScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase150-dispatch-contract-static-import-validation:proof'] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation-runner.ts',
  'package proof script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase150-dispatch-contract-static-import-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2174,
      sourcePath,
      staticImportSucceeded: true,
      safePayloadAccepted: true,
      blockedPayloadRejected: true,
      disabledEnvelopeBuilt: true,
      acceptedForDispatch: false,
      indexExportAdded: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE151-DISPATCH-CONTRACT-INDEX-EXPORT-PLAN',
    },
    null,
    2,
  ),
)
