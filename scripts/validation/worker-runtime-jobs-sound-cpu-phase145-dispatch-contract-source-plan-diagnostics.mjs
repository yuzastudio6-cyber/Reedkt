import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase144_worker_dispatch_contract_gap_review_completed_with_warnings_ready_for_dispatch_source_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase145_dispatch_contract_source_plan_completed_with_warnings_ready_for_dispatch_source_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase146_dispatch_source_owner_review_passed_with_warnings_ready_for_dispatch_contract_source_creation_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan-result.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan.md',
  payloadPlan: 'docs/worker-runtime-jobs-sound-cpu-phase145-dispatch-payload-schema-plan.md',
  handoff: 'docs/worker-runtime-jobs-sound-cpu-phase145-dispatch-source-owner-handoff.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase145-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase145-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review.md',
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
    'dispatchSourceCreated',
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'claimLeaseMutationEnabled',
    'allowSourceCreation',
    'allowWorkerDispatchExecution',
    'allowRouteExecutionEnablement',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'performWorkerDispatch',
    'mutateSupabaseJobRows',
    'writeArtifacts',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan-result'),
  sourcePlan: parseJsonBlock(docs.sourcePlan, 'worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan'),
  payloadPlan: parseJsonBlock(docs.payloadPlan, 'worker-runtime-jobs-sound-cpu-phase145-dispatch-payload-schema-plan'),
  handoff: parseJsonBlock(docs.handoff, 'worker-runtime-jobs-sound-cpu-phase145-dispatch-source-owner-handoff'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase145-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase145-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.reviewResult.dispatchSourcePlanMayProceed === true, 'Phase144 did not allow source plan')
assert(parsed.source.reviewResult.workerDispatchExecutionEnabled === false, 'Phase144 worker widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.planSourceOnly === true, 'source prompt scope mismatch')
assert(parsed.sourcePrompt.reviewScope.allowWorkerDispatchExecution === false, 'source prompt worker widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2164, 'source PR mismatch')
assert(parsed.result.planResult.dispatchContractSourcePlanned === true, 'source plan not recorded')
assert(parsed.result.planResult.dispatchSourceCreated === false, 'source created unexpectedly')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'worker dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.sourcePlan.futureSourcePath === 'server/workers/sound-cpu/dispatch-contract.ts', 'future source path mismatch')
assert(parsed.sourcePlan.sourceCreationAllowedInThisGate === false, 'source creation widened')
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
assert(parsed.sourcePlan.plannedBehavior.failClosedWithoutDispatch === true, 'fail-closed behavior missing')
assert(parsed.sourcePlan.plannedBehavior.performWorkerDispatch === false, 'dispatch behavior widened')

for (const field of [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'imageName',
  'jobType',
  'attempt',
  'privateManifestRef',
  'runtimeFlags',
]) {
  assert(parsed.payloadPlan.requiredFields.includes(field), `missing payload field ${field}`)
}
assert(parsed.payloadPlan.requiredRuntimeFlags.workerDispatchAllowed === false, 'runtime flag widened')
assert(parsed.payloadPlan.blockedPayloadSources.includes('rawPrompt'), 'raw prompt blocker missing')
assert(parsed.payloadPlan.blockedPayloadSources.includes('serviceRolePayload'), 'service-role blocker missing')

assert(parsed.handoff.nextGate === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE146-DISPATCH-SOURCE-OWNER-REVIEW', 'handoff next gate mismatch')
assert(parsed.handoff.nextExpectedDecision === nextDecision, 'handoff next decision mismatch')
assert(parsed.handoff.executionAllowedInOwnerReview === false, 'owner review execution widened')

assert(parsed.blocker.stillBlocked.includes('worker_dispatch_execution'), 'worker dispatch blocker missing')
assert(parsed.blocker.unblockedForOwnerReview.includes('dispatch_contract_source_plan_review'), 'owner review handoff missing')
assert(parsed.blocker.noCurrentFixBlocker === true, 'unexpected fix blocker')

assert(parsed.claimPolicy.allowedClaims.dispatchContractSourcePlanned === true, 'allowed source-plan claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.reviewSourcePlanOnly === true, 'next prompt scope mismatch')
assert(parsed.nextPrompt.reviewScope.allowSourceCreation === false, 'next prompt source creation widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase145-dispatch-contract-source-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2164,
      futureSourcePath: parsed.sourcePlan.futureSourcePath,
      dispatchSourceCreated: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE146-DISPATCH-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
