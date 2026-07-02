import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase148_actual_dispatch_contract_source_creation_completed_with_warnings_ready_for_dispatch_contract_source_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase149_dispatch_contract_source_owner_review_passed_with_warnings_ready_for_static_import_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase150_dispatch_contract_static_import_validation_passed_with_warnings_ready_for_index_export_plan'
const sourcePath = 'server/workers/sound-cpu/dispatch-contract.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation-result.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-phase148-dispatch-contract-source-register.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase149-dispatch-contract-source-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase149-dispatch-contract-source-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase149-source-owner-acceptance-register.md',
  importReadiness: 'docs/worker-runtime-jobs-sound-cpu-phase149-static-import-readiness-register.md',
  blockedExecution: 'docs/worker-runtime-jobs-sound-cpu-phase149-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase149-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation.md',
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
    'indexExportAllowedToday',
    'indexExportAdded',
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
    'allowIndexExport',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation-result'),
  sourceRegister: parseJsonBlock(docs.sourceRegister, 'worker-runtime-jobs-sound-cpu-phase148-dispatch-contract-source-register'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase149-dispatch-contract-source-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase149-dispatch-contract-source-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase149-source-owner-acceptance-register'),
  importReadiness: parseJsonBlock(docs.importReadiness, 'worker-runtime-jobs-sound-cpu-phase149-static-import-readiness-register'),
  blockedExecution: parseJsonBlock(docs.blockedExecution, 'worker-runtime-jobs-sound-cpu-phase149-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase149-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const sourceText = read(sourcePath)
const indexText = read(indexPath)
assert(sourceText.includes('SOUND_CPU_DISPATCH_CONTRACT_VERSION'), 'dispatch contract source missing')
assert(sourceText.includes('acceptedForDispatch: false'), 'fail-closed envelope missing')
assert(sourceText.includes('noWorkerExecution: true'), 'no worker execution marker missing')
assert(!indexText.includes('dispatch-contract.ts'), 'index export must remain blocked')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceCreationResult.dispatchSourceCreated === true, 'source not created')
assert(parsed.source.sourceCreationResult.indexExportAdded === false, 'source index export widened')
assert(parsed.source.sourceCreationResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceRegister.sourcePath === sourcePath, 'source register path mismatch')
assert(parsed.sourceRegister.contractVersion === 'phase148-fail-closed-v1', 'contract version mismatch')
assert(parsed.sourceRegister.acceptedWorkers.includes('sound-cpu-analysis-worker'), 'analysis worker missing')
assert(parsed.sourceRegister.acceptedJobTypes.includes('sound.package_import_smoke'), 'package import job missing')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.reviewScope.reviewStaticSourceOnly === true, 'source prompt static review missing')
assert(parsed.sourcePrompt.reviewScope.allowIndexExport === false, 'source prompt index export widened')
assert(parsed.sourcePrompt.reviewScope.allowWorkerDispatchExecution === false, 'source prompt dispatch widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2173, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '59c79f872c31a731613004c5b4439e7cc4e1cc13', 'source merge mismatch')
assert(parsed.result.ownerReviewResult.dispatchContractSourceAccepted === true, 'source not accepted')
assert(parsed.result.ownerReviewResult.staticImportValidationMayProceed === true, 'static import not allowed')
assert(parsed.result.ownerReviewResult.indexExportAllowedToday === false, 'index export widened')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.sourcePath === sourcePath, 'acceptance source path mismatch')
assert(parsed.acceptance.acceptedForExecutionToday === false, 'execution accepted unexpectedly')
assert(parsed.acceptance.acceptedForStaticImportValidation === true, 'static import acceptance missing')
assert(parsed.acceptance.acceptedSourceProperties.disabledRuntimeFlags === true, 'disabled flags missing')

assert(parsed.importReadiness.nextExpectedDecision === nextDecision, 'next expected decision mismatch')
assert(parsed.importReadiness.allowedNextChecks.includes('static_import_module'), 'static import check missing')
assert(parsed.importReadiness.stillForbiddenInNextGate.includes('worker_dispatch_execution'), 'worker dispatch blocker missing')

assertFalseMap(parsed.blockedExecution.blockedToday, 'blockedExecution.blockedToday')
assert(parsed.blockedExecution.noFixBlockerFound === true, 'unexpected fix blocker')

assert(parsed.claimPolicy.allowedClaims.staticImportValidationMayProceed === true, 'allowed static import claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.nextPrompt.sourcePath === sourcePath, 'next prompt source path mismatch')
assert(parsed.nextPrompt.validationScope.allowStaticImport === true, 'static import scope missing')
assert(parsed.nextPrompt.validationScope.allowIndexExport === false, 'next prompt index export widened')
assert(parsed.nextPrompt.validationScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase149-dispatch-contract-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase149-dispatch-contract-source-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2173,
      sourcePath,
      staticImportValidationMayProceed: true,
      indexExportAllowedToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE150-DISPATCH-CONTRACT-STATIC-IMPORT-VALIDATION',
    },
    null,
    2,
  ),
)
