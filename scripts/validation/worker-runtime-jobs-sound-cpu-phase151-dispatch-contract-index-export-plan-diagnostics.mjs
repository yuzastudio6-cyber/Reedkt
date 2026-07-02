import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase150_dispatch_contract_static_import_validation_passed_with_warnings_ready_for_index_export_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase151_dispatch_contract_index_export_plan_completed_with_warnings_ready_for_index_export_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase152_dispatch_contract_index_export_owner_review_passed_with_warnings_ready_for_actual_index_export_source_creation'
const sourcePath = 'server/workers/sound-cpu/dispatch-contract.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan-result.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-phase151-index-export-source-plan.md',
  handoff: 'docs/worker-runtime-jobs-sound-cpu-phase151-index-export-owner-handoff.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase151-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase151-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review.md',
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
    'indexExportAddedInThisGate',
    'indexExportSourceChange',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan-result'),
  sourcePlan: parseJsonBlock(docs.sourcePlan, 'worker-runtime-jobs-sound-cpu-phase151-index-export-source-plan'),
  handoff: parseJsonBlock(docs.handoff, 'worker-runtime-jobs-sound-cpu-phase151-index-export-owner-handoff'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase151-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase151-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexText = read(indexPath)
assert(fs.existsSync(path.join(process.cwd(), sourcePath)), 'dispatch contract source missing')
assert(!indexText.includes('dispatch-contract.ts'), 'index export must not exist in Phase151')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.validationResult.staticImportSucceeded === true, 'static import source missing')
assert(parsed.source.validationResult.indexExportAdded === false, 'source index export widened')
assert(parsed.source.validationResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.planningScope.allowIndexExportPlan === true, 'index export plan not allowed')
assert(parsed.sourcePrompt.planningScope.allowIndexExportSourceChange === false, 'source prompt source change widened')
assert(parsed.sourcePrompt.planningScope.allowWorkerDispatchExecution === false, 'source prompt dispatch widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2177, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'aeaf78225f67f2646a5e12766c775744e8610fbf', 'source merge mismatch')
assert(parsed.result.planResult.indexExportPlanned === true, 'index export plan missing')
assert(parsed.result.planResult.indexExportAddedInThisGate === false, 'index export added')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.sourcePlan.sourcePath === sourcePath, 'source plan source mismatch')
assert(parsed.sourcePlan.indexPath === indexPath, 'source plan index mismatch')
assert(parsed.sourcePlan.plannedExportBlock.exportHelpers.includes('validateSoundCpuDispatchContractPayload'), 'validation helper export missing')
assert(parsed.sourcePlan.sourceChangeAllowedInThisGate === false, 'source change widened')
assert(parsed.sourcePlan.executionAllowedInThisGate === false, 'execution widened')

assert(parsed.handoff.nextExpectedDecision === nextDecision, 'handoff next decision mismatch')
assert(parsed.handoff.handoffEvidence.includes('Phase150 static import validation passed'), 'handoff evidence missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assert(parsed.blocked.noFixBlockerFound === true, 'unexpected fix blocker')

assert(parsed.claimPolicy.allowedClaims.indexExportPlanned === true, 'allowed index plan claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.nextPrompt.reviewScope.reviewIndexExportPlanOnly === true, 'next prompt review scope mismatch')
assert(parsed.nextPrompt.reviewScope.allowIndexExportSourceChange === false, 'next prompt source change widened')
assert(parsed.nextPrompt.reviewScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase151-dispatch-contract-index-export-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2177,
      sourcePath,
      indexPath,
      indexExportPlanned: true,
      indexExportAddedInThisGate: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE152-DISPATCH-CONTRACT-INDEX-EXPORT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
