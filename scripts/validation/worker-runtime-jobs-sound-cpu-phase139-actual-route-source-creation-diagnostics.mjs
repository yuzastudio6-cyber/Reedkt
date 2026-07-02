import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase138_route_source_owner_review_passed_with_warnings_ready_for_actual_route_source_creation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase139_actual_route_source_created_with_warnings_ready_for_static_route_source_validation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-owner-review-result.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation-result.md',
  files: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-source-file-register.md',
  disabledPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-disabled-runtime-policy.md',
  staticValidation: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-static-validation-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-source-claim-policy.md',
  nextStaticPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation.md',
  nextImportPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation.md',
}

const sourceFiles = {
  route: 'server/routes/sound-cpu-worker-routes.ts',
  schemas: 'server/validation/sound-cpu-worker-route-schemas.ts',
  workerRoutes: 'server/routes/worker-routes.ts',
  app: 'server/app.ts',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoOpClassification(record, label) {
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
    'routeExecutionEnabled',
    'workerDispatchExecutionEnabled',
    'workerLeaseMutationEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'toolRuntimeExecutionAgainstUserAssetsEnabled',
    'mediaProcessingEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'storageObjectCreationEnabled',
    'signedUrlCreationEnabled',
    'publicArtifactCreationEnabled',
    'creditMutationEnabled',
    'productionUnlockEnabled',
    'allowRouteRegistration',
    'allowRouteExecution',
    'allowWorkerDispatchExecution',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowStorageObjectCreation',
    'allowRealUserMediaBetaEnablement',
    'allowPaidProduction',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase138-route-source-owner-review-result'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation-result'),
  files: parseJsonBlock(docs.files, 'worker-runtime-jobs-sound-cpu-phase139-route-source-file-register'),
  disabledPolicy: parseJsonBlock(docs.disabledPolicy, 'worker-runtime-jobs-sound-cpu-phase139-route-disabled-runtime-policy'),
  staticValidation: parseJsonBlock(docs.staticValidation, 'worker-runtime-jobs-sound-cpu-phase139-route-static-validation-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase139-route-source-claim-policy'),
  nextStaticPrompt: parseJsonBlock(docs.nextStaticPrompt, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation'),
  nextImportPrompt: parseJsonBlock(docs.nextImportPrompt, 'worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReview.actualRouteSourceCreationMayProceed === true, 'source did not approve route source creation')
assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.creationScope.allowRouteSourceCreation === true, 'prompt must allow source creation')
assert(parsed.prompt.creationScope.allowRouteExecution === false, 'prompt route execution widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2146, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '12a5f8f8724a7cee6375a9d0419e81ef1d4f1ff0', 'source merge mismatch')
assert(parsed.result.routeSourceCreationResult.routeFileCreated === true, 'route file not recorded')
assert(parsed.result.routeSourceCreationResult.validationFileCreated === true, 'validation file not recorded')
assert(parsed.result.routeSourceCreationResult.routeRegistrationModified === false, 'route registration modified')
assert(parsed.result.routeSourceCreationResult.routeRegisteredInApp === false, 'route registered')
assert(parsed.result.routeSourceCreationResult.routeExecutionEnabled === false, 'route execution widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.files.createdSourceFiles[0].path === sourceFiles.route, 'route source file path mismatch')
assert(parsed.files.createdSourceFiles[1].path === sourceFiles.schemas, 'schema source file path mismatch')
assert(parsed.files.registrationTouchpoints.every((touchpoint) => touchpoint.modifiedInThisGate === false), 'registration touchpoint modified')
assertFalseMap(parsed.files.blockedRuntimeImports, 'files.blockedRuntimeImports')

assertFalseMap(parsed.disabledPolicy.disabledRuntimeDefaults, 'disabledPolicy.disabledRuntimeDefaults')
assert(parsed.disabledPolicy.failClosedResponses.includes('route_execution_not_enabled'), 'disabled route reason missing')
assert(parsed.disabledPolicy.rejectedBeforeExecution.includes('client_service_role_payload'), 'service-role rejection missing')

assert(parsed.staticValidation.acceptedWorkerNames.length === 2, 'worker count mismatch')
assert(parsed.staticValidation.acceptedImages.length === 2, 'image count mismatch')
assert(parsed.staticValidation.acceptedJobTypes.length === 4, 'job type count mismatch')
assert(parsed.staticValidation.requiredRequestFields.includes('privateMediaManifestId'), 'manifest field missing')
assert(parsed.staticValidation.nextValidation.staticRouteSourceValidationMayProceed === true, 'static validation next missing')
assert(parsed.staticValidation.nextValidation.routeExecutionProofMayProceed === false, 'route proof widened')

assert(parsed.claimPolicy.allowedClaims.routeSourceCreated === true, 'source creation claim missing')
assert(parsed.claimPolicy.allowedClaims.validationSourceCreated === true, 'validation creation claim missing')
assert(parsed.claimPolicy.allowedClaims.staticRouteSourceValidationMayProceed === true, 'static next claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextStaticPrompt.requiredSourceDecision === decision, 'next static prompt source mismatch')
assert(parsed.nextStaticPrompt.validationScope.staticRouteSourceValidationOnly === true, 'next static scope mismatch')
assert(parsed.nextStaticPrompt.validationScope.allowRouteExecution === false, 'next static route widened')
assertNoOpClassification(parsed.nextStaticPrompt.supabaseClassification, 'nextStaticPrompt.supabaseClassification')

assert(
  parsed.nextImportPrompt.requiredSourceDecision ===
    'worker_runtime_jobs_sound_cpu_phase139_static_route_source_owner_review_passed_with_warnings_ready_for_controlled_no_media_route_import_validation',
  'next import prompt source mismatch',
)
assert(parsed.nextImportPrompt.validationScope.controlledImportValidationOnly === true, 'next import scope mismatch')
assert(parsed.nextImportPrompt.validationScope.allowRouteExecution === false, 'next import route widened')
assertNoOpClassification(parsed.nextImportPrompt.supabaseClassification, 'nextImportPrompt.supabaseClassification')

const routeSource = read(sourceFiles.route)
const schemaSource = read(sourceFiles.schemas)
const workerRoutes = read(sourceFiles.workerRoutes)
const appSource = read(sourceFiles.app)

assert(routeSource.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false'), 'route disabled constant missing')
assert(routeSource.includes('route_execution_not_enabled'), 'route fail-closed reason missing')
assert(routeSource.includes('workerDispatchStarted: false'), 'worker dispatch blocked result missing')
assert(routeSource.includes('supabaseMutationStarted: false'), 'Supabase blocked result missing')
assert(routeSource.includes('artifactCreated: false'), 'artifact blocked result missing')
assert(routeSource.includes('createSoundCpuWorkerJobRoute'), 'create handler missing')
assert(routeSource.includes('getSoundCpuWorkerJobStatusRoute'), 'status handler missing')
assert(routeSource.includes('createSoundCpuWorkerRoutes'), 'route factory missing')
assert(!routeSource.includes('createWorkerClaimService'), 'worker claim service import forbidden')
assert(!routeSource.includes('runWorkerClaimRunner'), 'worker runner import forbidden')
assert(!routeSource.includes('createClient'), 'Supabase client import forbidden')
assert(!routeSource.includes('service_role'), 'service-role text forbidden in route source')
assert(!routeSource.includes('signedUrl'), 'signed URL text forbidden in route source')

assert(schemaSource.includes('SOUND_CPU_WORKER_ROUTE_WORKER_NAMES'), 'worker names missing')
assert(schemaSource.includes('SOUND_CPU_WORKER_ROUTE_IMAGES'), 'images missing')
assert(schemaSource.includes('SOUND_CPU_WORKER_ROUTE_JOB_TYPES'), 'job types missing')
assert(schemaSource.includes('z.literal(false)'), 'disabled flag literal validation missing')
assert(schemaSource.includes('privateMediaManifestId'), 'private manifest schema missing')
assert(!schemaSource.includes('createClient'), 'Supabase client forbidden in schemas')
assert(!schemaSource.includes('service_role'), 'service-role text forbidden in schemas')

assert(!workerRoutes.includes('sound-cpu-worker-routes'), 'worker-routes registered SOUND CPU route unexpectedly')
const phase142SourceCreated = fs.existsSync(
  path.join(process.cwd(), 'docs/worker-runtime-jobs-sound-cpu-phase142-disabled-route-registration-source-result.md'),
)
if (!phase142SourceCreated) assert(!appSource.includes('sound-cpu-worker-routes'), 'app registered SOUND CPU route unexpectedly')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2146,
      routeSourceCreated: true,
      validationSourceCreated: true,
      routeRegisteredInApp: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE139-STATIC-ROUTE-SOURCE-VALIDATION',
    },
    null,
    2,
  ),
)
