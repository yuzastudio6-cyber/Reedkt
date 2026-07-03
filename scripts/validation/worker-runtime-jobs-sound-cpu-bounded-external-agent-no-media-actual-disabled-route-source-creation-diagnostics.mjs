import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_source_created_with_warnings_ready_for_source_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_owner_review_passed_with_warnings_ready_for_actual_disabled_route_source_creation'
const sourcePlanDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_creation_plan_completed_with_warnings_ready_for_disabled_route_source_owner_review'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ACTUAL-DISABLED-ROUTE-SOURCE-OWNER-REVIEW'
const sourceFile = 'server/routes/sound-cpu-no-media-agent-call-routes.ts'
const routePath = '/api/internal/workers/sound-cpu/no-media-agent-call'

const expectedTools = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
]
const expectedWorkers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const expectedImages = ['reeditpro/sound-cpu-analysis-worker', 'reeditpro/sound-audio-metadata-worker']
const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]
const expectedRuntimeFlags = [
  'routeExecutionEnabled',
  'workerDispatchExecutionEnabled',
  'workerExecutionEnabled',
  'mediaProcessingEnabled',
  'supabaseMutationEnabled',
  'sqlExecutionEnabled',
  'storageObjectCreationEnabled',
  'signedUrlCreationEnabled',
  'publicArtifactCreationEnabled',
  'providerModelCallEnabled',
  'dockerCloudRunExecutionEnabled',
]

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-result.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-result',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-contract-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-contract-register',
  },
  noRegistration: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-no-registration-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-no-registration-policy',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-fail-closed-validation-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-fail-closed-validation-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-blocker-follow-up-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-blocker-follow-up-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-runtime-claim-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-runtime-claim-policy',
  },
}

const requiredSourceEvidence = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-adjacent-route-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-contract-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-creation.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-review.md',
  'server/routes/sound-cpu-worker-routes.ts',
  'server/workers/sound-cpu/disabled-dispatch-route.ts',
  'server/workers/sound-cpu/disabled-route-registry.ts',
]

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parse(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertList(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`)
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} mismatch`)
}

function assertNoop(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'routeRegistered',
    'routeExecutionReady',
    'workerDispatchReady',
    'workerExecutionReady',
    'toolExecutionReady',
    'realExternalAgentCredentialsReady',
    'realUserMediaReady',
    'mediaProcessingReady',
    'supabaseReady',
    'sqlReady',
    'artifactWriteReady',
    'generated_local_fixture_passed',
    'dry_run_passed',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'betaReadinessClaimed',
    'productionReadinessClaimed',
    'routeExecution',
    'workerExecution',
    'workerDispatch',
    'jobClaimLeaseMutation',
    'toolExecution',
    'realExternalAgentCredentialProvisioning',
    'realUserMediaRead',
    'mediaProcessing',
    'artifactCreation',
    'supabaseMutation',
    'sqlExecution',
    'storageTransfer',
    'signedUrlCreation',
    'publicArtifactCreation',
    'providerModelCall',
    'dockerGcpAction',
    'betaUnlock',
    'productionUnlock',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

for (const value of Object.values(files)) {
  read(value.path)
  assertNoForbiddenTrueClaims(value.path)
}
for (const file of requiredSourceEvidence) read(file)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2358, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'c60cd0a137eb0f03b37d8be8f3f1fce5ec00afb0', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.sourceVerification.sourcePlanDecision === sourcePlanDecision, 'source plan decision mismatch')
assert(parsed.result.createdSource.sourceFile === sourceFile, 'created source file mismatch')
assert(parsed.result.createdSource.internalRoutePath === routePath, 'created route path mismatch')
assert(parsed.result.createdSource.sourceFileCreated === true, 'source file not marked created')
for (const key of [
  'routeRegistered',
  'routeExecutionEnabled',
  'routeExecuted',
  'workerDispatched',
  'toolExecutionEnabled',
  'realUserMediaRead',
  'mediaProcessing',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
]) {
  assert(parsed.result.createdSource[key] === false, `createdSource.${key} must be false`)
}
assert(parsed.result.acceptedSurface.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.result.acceptedSurface.acceptedWorkerCount === 2, 'worker count mismatch')
assert(parsed.result.acceptedSurface.acceptedImageCount === 2, 'image count mismatch')
assert(parsed.result.acceptedSurface.acceptedNoMediaJobTypeCount === 4, 'job type count mismatch')
assert(parsed.result.acceptedSurface.toolIdRequired === true, 'toolId required missing')
assert(parsed.result.acceptedSurface.staticOnlyRuntimeFlagsRequiredFalse === true, 'false runtime flags missing')
assert(parsed.result.acceptedSurface.unsafeEnvelopeFailClosed === true, 'fail closed missing')
assert(parsed.result.acceptedSurface.stdoutJsonStyleBlockedResultOnly === true, 'stdout JSON blocked result missing')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')
assert(parsed.result.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.contract.decision === decision, 'contract decision mismatch')
assert(parsed.contract.sourceFile === sourceFile, 'contract source mismatch')
assert(parsed.contract.internalRoutePath === routePath, 'contract route mismatch')
assertList(parsed.contract.acceptedTools, expectedTools, 'accepted tools')
assertList(parsed.contract.acceptedWorkers, expectedWorkers, 'accepted workers')
assertList(parsed.contract.acceptedImages, expectedImages, 'accepted images')
assertList(parsed.contract.acceptedNoMediaJobTypes, expectedJobTypes, 'accepted job types')
for (const field of [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'imageName',
  'jobType',
  'toolId',
  'attemptMetadata',
  'staticOnlyRuntimeFlags',
]) {
  assert(parsed.contract.requestEnvelope.requiredFields.includes(field), `missing required request field ${field}`)
}
assert(parsed.contract.requestEnvelope.toolIdRequired === true, 'request toolId required missing')
assertList(parsed.contract.requestEnvelope.runtimeFlagsRequiredFalse, expectedRuntimeFlags, 'runtime flags')
for (const field of ['rawPrompt', 'mediaFilePath', 'signedUrl', 'serviceRolePayload', 'modelWeightPath']) {
  assert(parsed.contract.requestEnvelope.forbiddenFieldsFailClosed.includes(field), `missing forbidden field ${field}`)
}
assert(parsed.contract.resultEnvelope.stdoutJsonStyle === true, 'result stdout JSON missing')
assert(parsed.contract.resultEnvelope.acceptedForExecution === false, 'result accepted for execution')
assert(parsed.contract.resultEnvelope.routeRegisteredInApp === false, 'route registered in app')
assert(parsed.contract.resultEnvelope.routeExecutionEnabled === false, 'route execution enabled')
assert(parsed.contract.resultEnvelope.ownerGateRequired === 'WORKER_RUNTIME_JOBS', 'owner gate mismatch')
for (const key of [
  'persistsResult',
  'writesArtifact',
  'opensMedia',
  'dispatchesWorker',
  'callsProviderOrModel',
  'mutatesSupabase',
]) {
  assert(parsed.contract.resultEnvelope[key] === false, `contract.resultEnvelope.${key} must be false`)
}

assert(parsed.noRegistration.decision === decision, 'no-registration decision mismatch')
assert(parsed.noRegistration.sourceFile === sourceFile, 'no-registration source mismatch')
assert(parsed.noRegistration.routePath === routePath, 'no-registration route mismatch')
assert(parsed.noRegistration.registrationState.serverAppImportsSource === false, 'server app imports source')
assert(parsed.noRegistration.registrationState.serverAppRegistersRoute === false, 'server app registers route')
assert(parsed.noRegistration.registrationState.routeRegistryImportsSource === false, 'route registry imports source')
assert(parsed.noRegistration.registrationState.routeRegistryRegistersRoute === false, 'route registry registers route')
assert(parsed.noRegistration.registrationState.publicApiCreated === false, 'public API created')
assert(parsed.noRegistration.registrationState.routeExecutionEnabled === false, 'route execution enabled')
assert(parsed.noRegistration.registrationState.ownerReviewRequiredBeforeRegistration === true, 'owner review before registration missing')
assert(parsed.noRegistration.registrationState.controlledRouteProofRequiredBeforeEnablement === true, 'route proof before enablement missing')
assert(parsed.noRegistration.adjacentExistingRoutes.length === 3, 'adjacent route count mismatch')
for (const route of parsed.noRegistration.adjacentExistingRoutes) {
  assert(route.retargeted === false, `${route.file} retargeted`)
  assert(route.samePurpose === false, `${route.file} same-purpose`)
}
assert(parsed.noRegistration.duplicatePolicy.samePurposeRouteAlreadyExistedBeforeThisGate === false, 'same-purpose preexist mismatch')
assert(parsed.noRegistration.duplicatePolicy.secondSamePurposeRouteCreated === false, 'duplicate route created')
assert(parsed.noRegistration.duplicatePolicy.mustRunOwnerReviewBeforeRegistration === true, 'owner review registration policy missing')

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
assert(parsed.failClosed.validatedSourceFile === sourceFile, 'fail-closed source mismatch')
for (const reason of [
  'payload_not_record',
  'unsafe_envelope_field_present',
  'invalid_tool_id',
  'runtime_flag_not_disabled',
  'forbidden_readiness_claim',
]) {
  assert(parsed.failClosed.failClosedCases.includes(reason), `missing fail-closed reason ${reason}`)
}
assertAllFalse(parsed.failClosed.blockedSideEffects, 'failClosed.blockedSideEffects')
for (const claim of ['generated_local_fixture_passed', 'dry_run_passed', 'runtimeReadiness']) {
  assert(parsed.failClosed.forbiddenReadinessClaimsRemainBlocked.includes(claim), `missing blocked claim ${claim}`)
}

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.blockingIssuesForThisGate.length === 0, 'unexpected blocker')
assert(parsed.blockers.inheritedBlockers.length === 3, 'inherited blocker count mismatch')
assert(parsed.blockers.nextAllowedPrompt === nextPrompt, 'blocker next prompt mismatch')
assert(parsed.blockers.fixPromptRequired === false, 'fix prompt required')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.actualDisabledRouteSourceCreated === true, 'source created claim missing')
assert(parsed.policy.allowedClaims.sourceOwnerReviewMayProceed === true, 'owner review claim missing')
assert(parsed.policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'policy tool count mismatch')
assert(parsed.policy.allowedClaims.acceptedNoMediaJobTypeCount === 4, 'policy job type mismatch')
assert(parsed.policy.allowedClaims.toolIdRequiredInRequestShape === true, 'policy toolId missing')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const sourceText = read(sourceFile)
for (const token of [
  'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH',
  routePath,
  decision,
  'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED = false',
  'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP = false',
  'validateSoundCpuNoMediaAgentCallEnvelope',
  'createSoundCpuNoMediaAgentCallDisabledResult',
  'soundCpuNoMediaAgentCallDisabledRouteHandler',
  'findUnsafeEnvelopeField',
  'hasForbiddenReadinessClaim',
  'acceptedForExecution: false',
  'routeRegisteredInApp: SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP',
  'routeExecutionEnabled: SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED',
]) {
  assert(sourceText.includes(token), `source missing token ${token}`)
}
for (const tool of expectedTools) assert(sourceText.includes(`'${tool}'`), `source missing tool ${tool}`)
for (const worker of expectedWorkers) assert(sourceText.includes(`'${worker}'`), `source missing worker ${worker}`)
for (const image of expectedImages) assert(sourceText.includes(`'${image}'`), `source missing image ${image}`)
for (const jobType of expectedJobTypes) assert(sourceText.includes(`'${jobType}'`), `source missing job type ${jobType}`)
for (const flag of expectedRuntimeFlags) assert(sourceText.includes(`${flag}: false`), `source missing false flag ${flag}`)
for (const env of [
  'REEDITPRO_SOUND_CPU_BOUNDED_NO_MEDIA_PRODUCT_ROUTE_ENABLED',
  'REEDITPRO_WORKER_EXECUTION_ENABLED',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED',
  'REEDITPRO_SUPABASE_MUTATION_ENABLED',
]) {
  assert(sourceText.includes(`${env}: '0'`), `source missing env default ${env}`)
}
for (const forbidden of ['rawPrompt', 'mediaFilePath', 'signedUrl', 'serviceRolePayload', 'modelWeightPath']) {
  assert(sourceText.includes(`'${forbidden}'`), `source missing forbidden field ${forbidden}`)
}
for (const forbiddenSource of [
  'Router(',
  'requireAuth',
  'requireIdempotency',
  'createClient(',
  'supabase.from(',
  'fetch(',
  'spawn(',
  'exec(',
  'docker build',
  'docker run',
  'ffmpeg',
  'ffprobe',
]) {
  assert(!sourceText.includes(forbiddenSource), `source contains forbidden executable pattern: ${forbiddenSource}`)
}

const appText = fs.existsSync(path.join(process.cwd(), 'server/app.ts')) ? read('server/app.ts') : ''
assert(!appText.includes(sourceFile), 'server app imports source file')
assert(!appText.includes(routePath), 'server app registers route path')
for (const adjacentFile of [
  'server/routes/sound-cpu-worker-routes.ts',
  'server/workers/sound-cpu/disabled-dispatch-route.ts',
  'server/workers/sound-cpu/disabled-route-registry.ts',
]) {
  const text = read(adjacentFile)
  assert(!text.includes(routePath), `${adjacentFile} references proposed route path`)
  assert(!text.includes(sourceFile), `${adjacentFile} references proposed source file`)
}

const ownerReview = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-review.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-review',
)
assert(ownerReview.decision === sourceDecision, 'owner review source decision mismatch')
assert(ownerReview.reviewResult.actualDisabledRouteSourceCreationMayProceed === true, 'owner review did not allow source creation')
assert(ownerReview.reviewResult.routeExecutionApprovedToday === false, 'owner review route execution widened')

const sourcePlan = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan',
)
assert(sourcePlan.decision === sourcePlanDecision, 'source plan decision mismatch')
assert(sourcePlan.disabledRouteSourceCreationPlan.proposedFutureSourceFile === sourceFile, 'source plan file mismatch')
assert(sourcePlan.disabledRouteSourceCreationPlan.proposedInternalRoutePath === routePath, 'source plan route mismatch')

const prompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-review.md',
)
assert(prompt.includes(decision), 'owner-review prompt decision missing')
assert(prompt.includes(sourceFile), 'owner-review prompt source missing')
assert(prompt.includes('Confirm the route source exists and is not registered in the server app.'), 'owner-review prompt no-registration check missing')
assert(prompt.includes('Expected pass decision:'), 'owner-review prompt pass decision missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-creation-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      sourceMergeCommit: parsed.result.sourceVerification.sourceMergeCommit,
      sourceFile,
      routePath,
      acceptedSoundCpuToolCount: 15,
      acceptedNoMediaJobTypeCount: 4,
      toolIdRequired: true,
      sourceFileCreated: true,
      routeRegistered: false,
      routeExecutionEnabled: false,
      workerDispatched: false,
      toolExecutionEnabled: false,
      realUserMediaReady: false,
      supabaseUpdateRequired: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
