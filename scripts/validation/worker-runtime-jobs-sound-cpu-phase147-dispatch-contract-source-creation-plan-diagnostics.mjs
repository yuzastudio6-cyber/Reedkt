import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase146_dispatch_source_owner_review_passed_with_warnings_ready_for_dispatch_contract_source_creation_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase147_dispatch_contract_source_creation_plan_completed_with_warnings_ready_for_actual_dispatch_contract_source_creation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase148_actual_dispatch_contract_source_creation_completed_with_warnings_ready_for_dispatch_contract_source_owner_review'
const futureSourcePath = 'server/workers/sound-cpu/dispatch-contract.ts'
const phase148ResultPath =
  'docs/worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation-result.md'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase147-dispatch-contract-source-creation-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase147-dispatch-contract-source-creation-plan-result.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-phase147-source-file-contract-plan.md',
  contentChecklist: 'docs/worker-runtime-jobs-sound-cpu-phase147-source-content-checklist.md',
  safetyRegister: 'docs/worker-runtime-jobs-sound-cpu-phase147-source-creation-safety-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase147-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation.md',
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
    'actualDispatchSourceCreatedInThisGate',
    'dispatchSourceCreated',
    'dispatchSourceFileExistsNow',
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
    'performWorkerDispatch',
    'claimLeaseJobs',
    'callRoutesOrTools',
    'mutateSupabaseJobRows',
    'writeArtifacts',
    'processMedia',
    'enableWorkerDispatchExecution',
    'enableRouteExecution',
    'enableClaimLeaseMutation',
    'enableSupabaseMutation',
    'enableSqlExecution',
    'enableMediaProcessing',
    'enableArtifactCreation',
    'enableRealUserMediaBeta',
    'enablePaidProduction'
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase147-dispatch-contract-source-creation-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase147-dispatch-contract-source-creation-plan-result'),
  sourcePlan: parseJsonBlock(docs.sourcePlan, 'worker-runtime-jobs-sound-cpu-phase147-source-file-contract-plan'),
  contentChecklist: parseJsonBlock(docs.contentChecklist, 'worker-runtime-jobs-sound-cpu-phase147-source-content-checklist'),
  safetyRegister: parseJsonBlock(docs.safetyRegister, 'worker-runtime-jobs-sound-cpu-phase147-source-creation-safety-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase147-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const futureSourceExists = fs.existsSync(path.join(process.cwd(), futureSourcePath))
const phase148ResultExists = fs.existsSync(path.join(process.cwd(), phase148ResultPath))
assert(
  !futureSourceExists || phase148ResultExists,
  `${futureSourcePath} must not exist until Phase148 result evidence exists`,
)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReviewResult.sourceCreationPlanMayProceed === true, 'Phase146 did not allow Phase147')
assert(parsed.source.ownerReviewResult.sourceCreationAllowedToday === false, 'Phase146 source creation widened')
assert(parsed.source.ownerReviewResult.workerDispatchExecutionEnabled === false, 'Phase146 worker dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.futureSourcePath === futureSourcePath, 'source prompt future path mismatch')
assert(parsed.sourcePrompt.reviewScope.planSourceCreationOnly === true, 'source prompt scope mismatch')
assert(parsed.sourcePrompt.reviewScope.allowActualSourceCreation === false, 'source prompt actual creation widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2168, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '88ce7857d0514c8e5904ddf8d96621c304cdbef5', 'source merge mismatch')
assert(parsed.result.planResult.dispatchContractSourceCreationPlanned === true, 'creation plan missing')
assert(parsed.result.planResult.futureSourcePath === futureSourcePath, 'result future path mismatch')
assert(parsed.result.planResult.dispatchSourceFileExistsNow === false, 'result says source exists')
assert(parsed.result.planResult.actualDispatchSourceCreatedInThisGate === false, 'source created in Phase147')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'result worker dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.sourcePlan.futureSourcePath === futureSourcePath, 'source plan future path mismatch')
assert(parsed.sourcePlan.sourceCreationAllowedInThisGate === false, 'source plan source creation widened')
for (const exportName of [
  'SOUND_CPU_DISPATCH_CONTRACT_VERSION',
  'SOUND_CPU_DISPATCH_ALLOWED_WORKERS',
  'SOUND_CPU_DISPATCH_ALLOWED_IMAGES',
  'SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES',
  'validateSoundCpuDispatchContractPayload',
  'buildDisabledSoundCpuDispatchEnvelope',
]) {
  assert(parsed.sourcePlan.plannedExports.includes(exportName), `missing planned export ${exportName}`)
}
assert(parsed.sourcePlan.plannedConstants.workers.includes('sound-cpu-analysis-worker'), 'analysis worker missing')
assert(parsed.sourcePlan.plannedConstants.workers.includes('sound-audio-metadata-worker'), 'metadata worker missing')
assert(parsed.sourcePlan.plannedConstants.jobTypes.includes('sound.package_import_smoke'), 'package import job missing')
assert(parsed.sourcePlan.plannedBehavior.failClosedWithoutDispatch === true, 'fail-closed behavior missing')
assert(parsed.sourcePlan.plannedBehavior.performWorkerDispatch === false, 'dispatch behavior widened')
assert(parsed.sourcePlan.plannedBehavior.mutateSupabaseJobRows === false, 'Supabase behavior widened')

assert(parsed.contentChecklist.futureSourcePath === futureSourcePath, 'content checklist path mismatch')
for (const [key, value] of Object.entries(parsed.contentChecklist.requiredFutureContent)) {
  assert(value === true, `requiredFutureContent.${key} must be true`)
}
assertFalseMap(parsed.contentChecklist.prohibitedFutureContent, 'contentChecklist.prohibitedFutureContent')

assert(parsed.safetyRegister.sourcePathPrecondition.futureSourcePath === futureSourcePath, 'safety future path mismatch')
assert(parsed.safetyRegister.sourcePathPrecondition.mustNotExistBeforePhase148 === true, 'missing path absence precondition')
assert(parsed.safetyRegister.sourcePathPrecondition.phase147ObservedExists === false, 'Phase147 observed source exists')
assert(parsed.safetyRegister.mustRemainBlocked.includes('worker_dispatch_execution'), 'worker dispatch blocker missing')
assert(parsed.safetyRegister.mustRemainBlocked.includes('Supabase_job_persistence'), 'Supabase blocker missing')
assert(parsed.safetyRegister.unblockedForNextGate.includes('fail_closed_dispatch_contract_source_creation'), 'next gate missing')
assert(parsed.safetyRegister.currentGateExecutionAllowed === false, 'current execution widened')

assert(parsed.claimPolicy.allowedClaims.dispatchContractSourceCreationPlanned === true, 'allowed plan claim missing')
assert(parsed.claimPolicy.allowedClaims.dispatchSourceFileAbsentInPhase147 === true, 'source absence claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.nextPrompt.sourcePath === futureSourcePath, 'next prompt path mismatch')
assert(parsed.nextPrompt.sourceCreationScope.createFailClosedStaticSourceOnly === true, 'next prompt source scope missing')
assert(parsed.nextPrompt.sourceCreationScope.createRuntimeDispatcher === false, 'next prompt runtime dispatcher widened')
assert(parsed.nextPrompt.sourceCreationScope.enableWorkerDispatchExecution === false, 'next prompt worker dispatch widened')
assert(parsed.nextPrompt.sourceCreationScope.enableSupabaseMutation === false, 'next prompt Supabase widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase147-dispatch-contract-source-creation-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase147-dispatch-contract-source-creation-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2168,
      futureSourcePath,
      dispatchSourceFileExistsNow: false,
      actualDispatchSourceCreatedInThisGate: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE148-ACTUAL-DISPATCH-CONTRACT-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
