import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase139_actual_route_source_created_with_warnings_ready_for_static_route_source_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase139_static_route_source_validation_passed_with_warnings_ready_for_route_source_owner_review'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase139_static_route_source_owner_review_passed_with_warnings_ready_for_controlled_no_media_route_import_validation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation-result.md',
  sourceFiles: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-source-file-register.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-source-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation-result.md',
  handler: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-handler-static-inspection-register.md',
  schema: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-schema-static-inspection-register.md',
  prohibited: 'docs/worker-runtime-jobs-sound-cpu-phase139-route-prohibited-import-scan-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase139-static-route-source-claim-policy.md',
  ownerPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-review.md',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation-result'),
  sourceFiles: parseJsonBlock(docs.sourceFiles, 'worker-runtime-jobs-sound-cpu-phase139-route-source-file-register'),
  sourcePolicy: parseJsonBlock(docs.sourcePolicy, 'worker-runtime-jobs-sound-cpu-phase139-route-source-claim-policy'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation-result'),
  handler: parseJsonBlock(docs.handler, 'worker-runtime-jobs-sound-cpu-phase139-route-handler-static-inspection-register'),
  schema: parseJsonBlock(docs.schema, 'worker-runtime-jobs-sound-cpu-phase139-route-schema-static-inspection-register'),
  prohibited: parseJsonBlock(docs.prohibited, 'worker-runtime-jobs-sound-cpu-phase139-route-prohibited-import-scan-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-claim-policy'),
  ownerPrompt: parseJsonBlock(docs.ownerPrompt, 'worker-runtime-jobs-sound-cpu-phase139-static-route-source-owner-review'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.routeSourceCreationResult.routeFileCreated === true, 'source route file missing')
assert(parsed.source.routeSourceCreationResult.validationFileCreated === true, 'source schema file missing')
assert(parsed.source.routeSourceCreationResult.routeRegisteredInApp === false, 'source route registered')
assert(parsed.sourceFiles.createdSourceFiles[0].path === sourceFiles.route, 'route file path mismatch')
assert(parsed.sourceFiles.createdSourceFiles[1].path === sourceFiles.schemas, 'schema file path mismatch')
assert(parsed.sourcePolicy.allowedClaims.staticRouteSourceValidationMayProceed === true, 'source policy next missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.validationScope.staticRouteSourceValidationOnly === true, 'prompt scope missing')
assert(parsed.prompt.validationScope.allowRouteExecution === false, 'prompt route widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2148, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'e0d8a5261915d11acd65993ab55f3a0c65cd9f06', 'source merge mismatch')
assert(parsed.result.staticValidationResult.staticValidationPassed === true, 'static validation not passed')
assert(parsed.result.staticValidationResult.routeRegistrationDetected === false, 'route registration detected')
assert(parsed.result.staticValidationResult.runtimeServiceImportDetected === false, 'runtime service detected')
assert(parsed.result.staticValidationResult.supabaseClientImportDetected === false, 'Supabase client detected')
assert(parsed.result.staticValidationResult.unsafeTrueRuntimeFlagDetected === false, 'unsafe true flag detected')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.handler.inspectedFile === sourceFiles.route, 'handler inspected path mismatch')
assert(parsed.handler.handlersDetected.includes('createSoundCpuWorkerJobRoute'), 'create handler missing')
assert(parsed.handler.handlersDetected.includes('getSoundCpuWorkerJobStatusRoute'), 'status handler missing')
assert(parsed.handler.routeFactoryDetected === 'createSoundCpuWorkerRoutes', 'route factory missing')
assert(parsed.handler.failClosedResponsesDetected.includes('route_execution_not_enabled'), 'fail closed missing')
assert(parsed.handler.registrationStatus.registeredInServerApp === false, 'server app registered')
assert(parsed.handler.registrationStatus.registeredInWorkerRoutes === false, 'worker routes registered')
assert(parsed.handler.registrationStatus.routeExecutionEnabled === false, 'handler route widened')

assert(parsed.schema.inspectedFile === sourceFiles.schemas, 'schema inspected path mismatch')
assert(parsed.schema.acceptedWorkerNames.length === 2, 'worker count mismatch')
assert(parsed.schema.acceptedImages.length === 2, 'image count mismatch')
assert(parsed.schema.acceptedJobTypes.length === 4, 'job type count mismatch')
assert(parsed.schema.requiredFieldsDetected.includes('privateMediaManifestId'), 'manifest field missing')
assert(parsed.schema.disabledRuntimeFlagValidation === 'z.literal(false)', 'disabled literal validation missing')

assert(parsed.prohibited.scanPassed === true, 'prohibited scan not passed')
assertFalseMap(parsed.prohibited.prohibitedFindings, 'prohibited.prohibitedFindings')

assert(parsed.claimPolicy.allowedClaims.staticRouteSourceValidationPassed === true, 'validation claim missing')
assert(parsed.claimPolicy.allowedClaims.routeSourceOwnerReviewMayProceed === true, 'owner review next missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.ownerPrompt.requiredSourceDecision === decision, 'owner prompt source mismatch')
assert(parsed.ownerPrompt.expectedDecision === ownerReviewDecision, 'owner prompt expected mismatch')
assert(parsed.ownerPrompt.reviewScope.acceptStaticRouteSourceValidationOnly === true, 'owner prompt review scope missing')
assert(parsed.ownerPrompt.reviewScope.allowRouteExecution === false, 'owner prompt route widened')
assertNoOpClassification(parsed.ownerPrompt.supabaseClassification, 'ownerPrompt.supabaseClassification')

const routeSource = read(sourceFiles.route)
const schemaSource = read(sourceFiles.schemas)
const workerRoutes = read(sourceFiles.workerRoutes)
const appSource = read(sourceFiles.app)

assert(routeSource.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false'), 'route disabled constant missing')
assert(routeSource.includes('ROUTE_EXECUTION_NOT_ENABLED'), 'disabled error code missing')
assert(routeSource.includes('routeRegisteredInApp: false'), 'route registered response missing')
assert(routeSource.includes('workerDispatchStarted: false'), 'dispatch blocked missing')
assert(routeSource.includes('supabaseMutationStarted: false'), 'Supabase blocked missing')
assert(routeSource.includes('artifactCreated: false'), 'artifact blocked missing')
assert(!routeSource.includes('createWorkerClaimService'), 'worker claim service import forbidden')
assert(!routeSource.includes('runWorkerClaimRunner'), 'worker runner import forbidden')
assert(!routeSource.includes('createClient'), 'Supabase client import forbidden')
assert(!routeSource.includes('service_role'), 'service-role text forbidden')
assert(!routeSource.includes('signedUrl'), 'signed URL text forbidden')

const falseLiteralCount = (schemaSource.match(/z\.literal\(false\)/g) ?? []).length
assert(falseLiteralCount >= 10, 'disabled runtime flag literal count too low')
assert(schemaSource.includes('createSoundCpuWorkerJobRouteSchema'), 'create schema missing')
assert(schemaSource.includes('getSoundCpuWorkerJobStatusRouteSchema'), 'status schema missing')
assert(schemaSource.includes('privateMediaManifestId'), 'private manifest schema missing')
assert(!schemaSource.includes('createClient'), 'schema Supabase client forbidden')
assert(!schemaSource.includes('service_role'), 'schema service-role text forbidden')

assert(!workerRoutes.includes('sound-cpu-worker-routes'), 'worker-routes registered Phase139 route')
assert(!appSource.includes('sound-cpu-worker-routes'), 'app registered Phase139 route')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2148,
      staticValidationPassed: true,
      routeRegisteredInApp: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE139-STATIC-ROUTE-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
