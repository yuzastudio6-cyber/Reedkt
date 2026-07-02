import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase152_dispatch_contract_index_export_owner_review_passed_with_warnings_ready_for_actual_index_export_source_creation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase153_actual_dispatch_contract_index_export_source_creation_completed_with_warnings_ready_for_index_export_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase154_dispatch_contract_index_export_static_validation_passed_with_warnings_ready_for_index_export_owner_validation_review'
const sourcePath = 'server/workers/sound-cpu/dispatch-contract.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-creation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-result.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase153-index-export-source-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase153-static-validation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase153-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase153-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation.md',
  packageJson: 'package.json',
}

const requiredExports = [
  'SOUND_CPU_DISPATCH_ALLOWED_IMAGES',
  'SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES',
  'SOUND_CPU_DISPATCH_ALLOWED_WORKERS',
  'SOUND_CPU_DISPATCH_CONTRACT_VERSION',
  'SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS',
  'buildDisabledSoundCpuDispatchEnvelope',
  'validateSoundCpuDispatchContractPayload',
]

const requiredTypeExports = [
  'SoundCpuDisabledDispatchEnvelope',
  'SoundCpuDispatchAttemptMetadata',
  'SoundCpuDispatchContractPayload',
  'SoundCpuDispatchImageName',
  'SoundCpuDispatchJobType',
  'SoundCpuDispatchRuntimeFlags',
  'SoundCpuDispatchValidationResult',
  'SoundCpuDispatchWorkerName',
]

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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-creation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-result'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase153-index-export-source-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase153-static-validation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase153-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase153-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const indexText = read(indexPath)
const sourceText = read(sourcePath)
assert(indexText.includes("from './dispatch-contract.ts'"), 'index export missing dispatch-contract.ts')

for (const name of requiredExports) {
  assert(sourceText.includes(`export const ${name}`) || sourceText.includes(`export function ${name}`), `${name} missing from source`)
  assert(indexText.includes(name), `${name} missing from index export`)
  assert(parsed.register.exportedValues.includes(name), `${name} missing from source register`)
}

for (const name of requiredTypeExports) {
  assert(sourceText.includes(`export type ${name}`), `${name} type missing from source`)
  assert(indexText.includes(`type ${name}`), `${name} missing from index type export`)
  assert(parsed.register.exportedTypes.includes(name), `${name} missing from type register`)
}

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReviewResult.actualIndexExportSourceCreationMayProceed === true, 'source creation not accepted')
assert(parsed.source.ownerReviewResult.indexExportAddedToday === false, 'source review already exported index')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.sourceCreationScope.allowIndexExportSourceChange === true, 'source prompt did not allow index source')
assert(parsed.sourcePrompt.sourceCreationScope.allowWorkerDispatchExecution === false, 'source prompt dispatch widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2180, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'cb10ab0f5ca535fc07c10d13c27513f7ddf10d5b', 'source merge mismatch')
assert(parsed.result.sourceChange.indexExportAdded === true, 'index export not recorded')
assert(parsed.result.sourceChange.exportedFailClosedContractOnly === true, 'fail-closed contract source not recorded')
assert(parsed.result.sourceChange.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.register.acceptedForStaticImportValidation === true, 'static import validation not accepted')
assert(parsed.register.acceptedForWorkerDispatchExecutionToday === false, 'worker dispatch accepted unexpectedly')
assert(parsed.register.acceptedForRouteExecutionToday === false, 'route execution accepted unexpectedly')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.staticValidationMayProceed === true, 'static validation readiness missing')
assert(parsed.readiness.stillForbidden.includes('worker_dispatch_execution'), 'worker dispatch blocker missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')

assert(parsed.claimPolicy.allowedClaims.indexExportAdded === true, 'allowed index claim missing')
assert(parsed.claimPolicy.allowedClaims.failClosedDispatchContractExported === true, 'fail-closed claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.nextPrompt.validationScope.allowStaticIndexImportValidation === true, 'next prompt static validation missing')
assert(parsed.nextPrompt.validationScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase153-actual-dispatch-contract-index-export-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-creation-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2180,
      sourcePath,
      indexPath,
      indexExportAdded: true,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE154-DISPATCH-CONTRACT-INDEX-EXPORT-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
