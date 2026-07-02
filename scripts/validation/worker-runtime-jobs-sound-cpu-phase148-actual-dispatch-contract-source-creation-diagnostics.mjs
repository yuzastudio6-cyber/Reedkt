import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase147_dispatch_contract_source_creation_plan_completed_with_warnings_ready_for_actual_dispatch_contract_source_creation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase148_actual_dispatch_contract_source_creation_completed_with_warnings_ready_for_dispatch_contract_source_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase149_dispatch_contract_source_owner_review_passed_with_warnings_ready_for_static_import_validation'
const sourcePath = 'server/workers/sound-cpu/dispatch-contract.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase147-dispatch-contract-source-creation-plan-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation-result.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-phase148-dispatch-contract-source-register.md',
  staticValidation: 'docs/worker-runtime-jobs-sound-cpu-phase148-source-static-validation-report.md',
  blockedExecution: 'docs/worker-runtime-jobs-sound-cpu-phase148-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase148-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase149-dispatch-contract-source-owner-review.md',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase147-dispatch-contract-source-creation-plan-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation-result'),
  sourceRegister: parseJsonBlock(docs.sourceRegister, 'worker-runtime-jobs-sound-cpu-phase148-dispatch-contract-source-register'),
  staticValidation: parseJsonBlock(docs.staticValidation, 'worker-runtime-jobs-sound-cpu-phase148-source-static-validation-report'),
  blockedExecution: parseJsonBlock(docs.blockedExecution, 'worker-runtime-jobs-sound-cpu-phase148-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase148-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase149-dispatch-contract-source-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.planResult.dispatchContractSourceCreationPlanned === true, 'Phase147 did not plan source creation')
assert(parsed.source.planResult.actualDispatchSourceCreatedInThisGate === false, 'Phase147 source creation widened')
assert(parsed.source.planResult.workerDispatchExecutionEnabled === false, 'Phase147 dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.sourcePath === sourcePath, 'source prompt path mismatch')
assert(parsed.sourcePrompt.sourceCreationScope.createFailClosedStaticSourceOnly === true, 'source prompt creation scope missing')
assert(parsed.sourcePrompt.sourceCreationScope.createRuntimeDispatcher === false, 'runtime dispatcher widened')
assert(parsed.sourcePrompt.sourceCreationScope.enableWorkerDispatchExecution === false, 'dispatch widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

const sourceText = read(sourcePath)
const indexText = read(indexPath)
for (const token of [
  'SOUND_CPU_DISPATCH_CONTRACT_VERSION',
  'SOUND_CPU_DISPATCH_ALLOWED_WORKERS',
  'SOUND_CPU_DISPATCH_ALLOWED_IMAGES',
  'SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES',
  'validateSoundCpuDispatchContractPayload',
  'buildDisabledSoundCpuDispatchEnvelope',
  'acceptedForDispatch: false',
  "blockedReason: 'worker_dispatch_execution_not_enabled'",
  'noWorkerExecution: true',
  'noRouteExecution: true',
  'noSupabaseMutation: true',
  'noSqlExecution: true',
  'noMediaProcessing: true',
  'noArtifactCreated: true',
]) {
  assert(sourceText.includes(token), `source missing ${token}`)
}

for (const token of [
  'child_process',
  'node:fs',
  'fetch(',
  'SupabaseClient',
  'createClient',
  'sql`',
  'docker',
  'ffmpeg',
  'ffprobe',
  'audioread',
  'pydub',
  'provider',
  'modelWeights',
]) {
  assert(!sourceText.includes(token), `source contains forbidden token ${token}`)
}

assert(!indexText.includes("dispatch-contract.ts"), 'dispatch contract must not be exported from index yet')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2171, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'e1cf4ad0b33ca91a1f369d24a7b600e4ab364218', 'source merge mismatch')
assert(parsed.result.sourceCreationResult.dispatchSourceCreated === true, 'source creation not recorded')
assert(parsed.result.sourceCreationResult.sourcePath === sourcePath, 'result source path mismatch')
assert(parsed.result.sourceCreationResult.failClosedStaticSourceOnly === true, 'fail-closed source missing')
assert(parsed.result.sourceCreationResult.indexExportAdded === false, 'index export widened')
assert(parsed.result.sourceCreationResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.sourceRegister.sourcePath === sourcePath, 'register source path mismatch')
assert(parsed.sourceRegister.contractVersion === 'phase148-fail-closed-v1', 'contract version mismatch')
assert(parsed.sourceRegister.acceptedWorkers.includes('sound-cpu-analysis-worker'), 'analysis worker missing')
assert(parsed.sourceRegister.acceptedWorkers.includes('sound-audio-metadata-worker'), 'metadata worker missing')
assert(parsed.sourceRegister.acceptedJobTypes.includes('sound.package_import_smoke'), 'package import job missing')
for (const value of Object.values(parsed.sourceRegister.runtimeDisabledFlags)) assert(value === '0', 'runtime flag not disabled')

assert(parsed.staticValidation.sourcePath === sourcePath, 'static validation path mismatch')
for (const [key, value] of Object.entries(parsed.staticValidation.validatedStaticProperties)) {
  if (key === 'indexExportAdded') assert(value === false, 'index export must remain false')
  else assert(value === true, `validatedStaticProperties.${key} must be true`)
}
assertFalseMap(parsed.staticValidation.validatedProhibitions, 'staticValidation.validatedProhibitions')

assert(parsed.blockedExecution.mustRemainBlocked.includes('worker_dispatch_execution'), 'worker dispatch blocker missing')
assert(parsed.blockedExecution.mustRemainBlocked.includes('Supabase_job_persistence'), 'Supabase blocker missing')
assert(parsed.blockedExecution.unblockedForNextGate.includes('dispatch_contract_source_owner_review'), 'owner review next gate missing')
assert(parsed.blockedExecution.acceptedForExecutionToday === false, 'execution acceptance widened')

assert(parsed.claimPolicy.allowedClaims.dispatchSourceCreated === true, 'allowed source creation claim missing')
assert(parsed.claimPolicy.allowedClaims.failClosedStaticSourceCreated === true, 'fail-closed claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.nextPrompt.sourcePath === sourcePath, 'next prompt source path mismatch')
assert(parsed.nextPrompt.reviewScope.reviewStaticSourceOnly === true, 'next prompt static review missing')
assert(parsed.nextPrompt.reviewScope.allowIndexExport === false, 'next prompt index export widened')
assert(parsed.nextPrompt.reviewScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase148-actual-dispatch-contract-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2171,
      sourcePath,
      dispatchSourceCreated: true,
      indexExportAdded: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE149-DISPATCH-CONTRACT-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
