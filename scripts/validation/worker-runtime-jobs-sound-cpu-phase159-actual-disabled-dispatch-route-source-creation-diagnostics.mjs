import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase158_disabled_dispatch_route_source_creation_plan_completed_with_warnings_ready_for_actual_disabled_dispatch_route_source_creation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase159_actual_disabled_dispatch_route_source_creation_completed_with_warnings_ready_for_disabled_route_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase160_disabled_dispatch_route_static_validation_passed_with_warnings_ready_for_disabled_route_source_owner_review'
const routePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase158-disabled-dispatch-route-source-creation-plan-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-creation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-result.md',
  register: 'docs/worker-runtime-jobs-sound-cpu-phase159-disabled-route-source-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase159-disabled-route-static-validation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase159-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase159-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation.md',
  packageJson: 'package.json',
}

const requiredSourceSnippets = [
  'SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME',
  'SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS',
  'SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON',
  'SOUND_CPU_DISABLED_DISPATCH_ROUTE_INVALID_PAYLOAD_REASON',
  'createSoundCpuDisabledDispatchRouteResult',
  'assertSoundCpuDisabledDispatchRouteExecutionBlocked',
  'validateSoundCpuDispatchContractPayload',
  'buildDisabledSoundCpuDispatchEnvelope',
  'acceptedForDispatch: false',
  'noWorkerExecution: true',
  'noRouteExecution: true',
  'noSupabaseMutation: true',
  'noSqlExecution: true',
  'noMediaProcessing: true',
  'noArtifactCreated: true',
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
    'routeRegistered',
    'indexExportAddedToday',
    'indexExportAdded',
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
    'allowRouteRegistration',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase158-disabled-dispatch-route-source-creation-plan-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-creation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-result'),
  register: parseJsonBlock(docs.register, 'worker-runtime-jobs-sound-cpu-phase159-disabled-route-source-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase159-disabled-route-static-validation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase159-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase159-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase160-disabled-dispatch-route-static-validation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const sourceText = read(routePath)
const indexText = read(indexPath)
for (const snippet of requiredSourceSnippets) assert(sourceText.includes(snippet), `route source missing ${snippet}`)
assert(sourceText.includes("from './dispatch-contract.ts'"), 'route source must import direct dispatch contract')
assert(!sourceText.includes("from './index.ts'"), 'route source must not import index and create a cycle')
assert(!sourceText.includes('fetch('), 'route source must not call network')
assert(!sourceText.includes('child_process'), 'route source must not spawn processes')
assert(!indexText.includes('disabled-dispatch-route.ts'), 'index export must not include route source yet')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.planResult.routeSourceCreationPlanned === true, 'source creation plan missing')
assert(parsed.source.planResult.routeSourceCreatedToday === false, 'source had route created')
assert(parsed.source.planResult.routeRegisteredToday === false, 'source had route registered')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.sourceCreationScope.allowRouteSourceChange === true, 'source creation scope missing')
assert(parsed.sourcePrompt.sourceCreationScope.allowRouteRegistration === false, 'source prompt route registration widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2194, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'dfefdc836caebc0cedf2d1370c4b50ce8ac16c7a', 'source merge mismatch')
assert(parsed.result.sourceChange.routeSourceCreated === true, 'route source not recorded')
assert(parsed.result.sourceChange.routeRegisteredToday === false, 'route registered today')
assert(parsed.result.sourceChange.indexExportAddedToday === false, 'index export added today')
assert(parsed.result.sourceChange.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.register.routeSourcePath === routePath, 'register route path mismatch')
assert(parsed.register.sourceBehavior.validPayloadReturnsAcceptedForDispatch === false, 'valid payload accepts dispatch')
assert(parsed.register.sourceBehavior.invalidPayloadReturnsAcceptedForDispatch === false, 'invalid payload accepts dispatch')
assert(parsed.register.sourceBehavior.noWorkerExecution === true, 'worker execution not blocked')
assert(parsed.register.routeRegisteredToday === false, 'register route registered')
assert(parsed.register.indexExportAddedToday === false, 'register index export added')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.staticValidationMayProceed === true, 'static validation not allowed')
assert(parsed.readiness.requiredStaticValidation.includes('direct_route_source_import_succeeds'), 'direct import validation missing')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')

assert(parsed.claimPolicy.allowedClaims.routeSourceCreated === true, 'route source claim missing')
assert(parsed.claimPolicy.allowedClaims.routeRegistered === false, 'route registered allowed claim widened')
assert(parsed.claimPolicy.allowedClaims.indexExportAdded === false, 'index export allowed claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.allowStaticRouteSourceImport === true, 'next prompt static validation missing')
assert(parsed.nextPrompt.validationScope.allowRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase159-actual-disabled-dispatch-route-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-creation-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2194,
      routeSourceCreated: true,
      routeRegisteredToday: false,
      indexExportAddedToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE160-DISABLED-DISPATCH-ROUTE-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
