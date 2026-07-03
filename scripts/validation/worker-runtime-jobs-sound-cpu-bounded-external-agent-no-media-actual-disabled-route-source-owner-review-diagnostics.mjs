import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_source_owner_review_passed_with_warnings_ready_for_disabled_route_registration_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_source_created_with_warnings_ready_for_source_owner_review'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-DISABLED-ROUTE-REGISTRATION-PLAN'
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

const files = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-review.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-acceptance-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-safety-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-safety-register',
  },
  registration: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-registration-readiness-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-registration-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-blocker-follow-up-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-blocker-follow-up-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-claim-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-claim-policy',
  },
}

const requiredSourceEvidence = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-result.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-contract-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-no-registration-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-fail-closed-validation-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-runtime-claim-policy.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-plan.md',
  sourceFile,
]

const candidateRegistrationFiles = [
  'server/app.ts',
  'server/routes/index.ts',
  'src/server/index.ts',
  'src/server/server.ts',
  'src/server/server-router.ts',
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

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'actualRouteRegistrationToday',
    'routeExecutionApprovedToday',
    'workerDispatchApprovedToday',
    'toolExecutionApprovedToday',
    'realExternalAgentCredentialProvisioningApprovedToday',
    'realUserMediaApprovedToday',
    'mediaProcessingApprovedToday',
    'supabaseMutationApprovedToday',
    'sqlExecutionApprovedToday',
    'artifactWriteApprovedToday',
    'externalBetaRuntimeApprovedToday',
    'productionApprovedToday',
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
    'mediaReadinessClaimed',
    'betaReadinessClaimed',
    'productionReadinessClaimed',
    'routeExecution',
    'workerExecution',
    'workerDispatch',
    'toolExecution',
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

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.sourcePr === 2359, 'source PR mismatch')
assert(
  parsed.review.sourceVerification.sourceMergeCommit === '77975ab8514c51c091e1669fd37271511b4e4bdd',
  'source merge commit mismatch',
)
assert(parsed.review.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.review.reviewedSource.sourceFile === sourceFile, 'review source file mismatch')
assert(parsed.review.reviewedSource.internalRoutePath === routePath, 'review route path mismatch')
assert(parsed.review.reviewedSource.sourceFilePresent === true, 'source file not marked present')
assert(parsed.review.reviewedSource.routeExecutionEnabledConstant === false, 'route execution constant not false')
assert(parsed.review.reviewedSource.routeRegisteredInAppConstant === false, 'route registered constant not false')
assert(parsed.review.reviewedSource.disabledHandlerPresent === true, 'disabled handler missing')
assert(parsed.review.reviewedSource.blockedStatusCode === 409, 'blocked status code mismatch')
assert(parsed.review.reviewedSource.toolIdRequired === true, 'toolId required missing')
assert(parsed.review.reviewedSource.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.review.reviewedSource.acceptedWorkerCount === 2, 'worker count mismatch')
assert(parsed.review.reviewedSource.acceptedImageCount === 2, 'image count mismatch')
assert(parsed.review.reviewedSource.acceptedNoMediaJobTypeCount === 4, 'job type count mismatch')
assert(parsed.review.ownerReviewResult.disabledRouteSourceAcceptedForRegistrationPlanning === true, 'source not accepted')
assert(parsed.review.ownerReviewResult.disabledRouteRegistrationPlanMayProceed === true, 'registration plan not accepted')
for (const key of [
  'actualRouteRegistrationToday',
  'routeExecutionApprovedToday',
  'workerDispatchApprovedToday',
  'toolExecutionApprovedToday',
  'realExternalAgentCredentialProvisioningApprovedToday',
  'realUserMediaApprovedToday',
  'mediaProcessingApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactWriteApprovedToday',
  'externalBetaRuntimeApprovedToday',
  'productionApprovedToday',
]) {
  assert(parsed.review.ownerReviewResult[key] === false, `ownerReviewResult.${key} must be false`)
}
assertNoop(parsed.review.supabaseClassification, 'review.supabaseClassification')
assert(parsed.review.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.acceptance.decision === decision, 'acceptance decision mismatch')
assert(parsed.acceptance.acceptedForFuturePlanningOnly.sourceFile === sourceFile, 'acceptance source mismatch')
assert(parsed.acceptance.acceptedForFuturePlanningOnly.internalRoutePath === routePath, 'acceptance route mismatch')
assert(parsed.acceptance.acceptedForFuturePlanningOnly.disabledRouteHandler === 'soundCpuNoMediaAgentCallDisabledRouteHandler', 'handler mismatch')
assert(parsed.acceptance.acceptedForFuturePlanningOnly.envelopeValidator === 'validateSoundCpuNoMediaAgentCallEnvelope', 'validator mismatch')
assert(parsed.acceptance.acceptedForFuturePlanningOnly.disabledResultFactory === 'createSoundCpuNoMediaAgentCallDisabledResult', 'result factory mismatch')
assert(parsed.acceptance.acceptedForFuturePlanningOnly.registrationPlanningMayProceed === true, 'registration planning missing')
assertList(parsed.acceptance.acceptedTools, expectedTools, 'accepted tools')
assertList(parsed.acceptance.acceptedWorkers, expectedWorkers, 'accepted workers')
assertList(parsed.acceptance.acceptedImages, expectedImages, 'accepted images')
assertList(parsed.acceptance.acceptedNoMediaJobTypes, expectedJobTypes, 'accepted job types')
assertFalseMap(parsed.acceptance.acceptedForExecutionToday, 'acceptedForExecutionToday')

assert(parsed.safety.decision === decision, 'safety decision mismatch')
assert(parsed.safety.sourceSafety.sourceFile === sourceFile, 'safety source mismatch')
for (const key of [
  'hasExpressOrServerImport',
  'hasChildProcessImport',
  'hasFsImport',
  'hasSupabaseImport',
  'hasProviderImport',
  'hasMediaProcessingImport',
  'hasDockerOrGcpImport',
  'routeExecutionEnabledConstant',
  'routeRegisteredInAppConstant',
]) {
  assert(parsed.safety.sourceSafety[key] === false, `sourceSafety.${key} must be false`)
}
assert(parsed.safety.sourceSafety.handlerReturnsBlockedStatusOnly === true, 'blocked handler missing')
assert(parsed.safety.sourceSafety.blockedStatusCode === 409, 'safety status mismatch')
assert(parsed.safety.sourceSafety.unsafeEnvelopeFieldsFailClosed === true, 'unsafe fail closed missing')
assert(parsed.safety.sourceSafety.forbiddenReadinessClaimsFailClosed === true, 'readiness fail closed missing')
assert(parsed.safety.sourceSafety.runtimeFlagsRequiredFalse === true, 'runtime flags false missing')
assert(parsed.safety.registrationSafety.serverAppRegistrationObserved === false, 'server app registration observed')
assert(parsed.safety.registrationSafety.routeRegistryRegistrationObserved === false, 'route registry registration observed')
assert(parsed.safety.registrationSafety.actualRegistrationApprovedToday === false, 'actual registration approved')
assert(parsed.safety.registrationSafety.futureRegistrationMustRemainDisabled === true, 'future disabled missing')
assertFalseMap(parsed.safety.closedScopes, 'closedScopes')

assert(parsed.registration.decision === decision, 'registration decision mismatch')
assert(parsed.registration.registrationReadiness.disabledRouteRegistrationPlanningMayProceed === true, 'registration planning not ready')
assert(parsed.registration.registrationReadiness.approvedRoutePath === routePath, 'registration route mismatch')
assert(parsed.registration.registrationReadiness.approvedSourceFile === sourceFile, 'registration source mismatch')
assert(parsed.registration.registrationReadiness.approvedHandler === 'soundCpuNoMediaAgentCallDisabledRouteHandler', 'registration handler mismatch')
for (const key of [
  'mustReturnBlockedUntilExecutionGate',
  'mustKeepRouteExecutionEnabledFalse',
  'mustKeepWorkerDispatchExecutionEnabledFalse',
  'mustKeepToolExecutionEnabledFalse',
  'mustKeepMediaProcessingEnabledFalse',
  'mustKeepSupabaseSqlArtifactEnabledFalse',
]) {
  assert(parsed.registration.registrationReadiness[key] === true, `registrationReadiness.${key} must be true`)
}
assert(parsed.registration.registrationReadiness.mustKeepStatusCode === 409, 'registration status mismatch')
for (const value of Object.values(parsed.registration.nextGateRequirements)) {
  if (typeof value === 'boolean') assert(value === true, 'next gate boolean requirement must be true')
}
assertFalseMap(parsed.registration.notAuthorizedInThisReview, 'notAuthorizedInThisReview')

assert(parsed.blockers.decision === decision, 'blockers decision mismatch')
assert(Array.isArray(parsed.blockers.closedByThisReview), 'closed blockers must be array')
assert(Array.isArray(parsed.blockers.remainingBlockers), 'remaining blockers must be array')
assert(parsed.blockers.remainingBlockers.some((item) => item.blocker === 'disabled_route_not_registered'), 'missing registration blocker')
assert(parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_route_execution_proof_missing'), 'missing route proof blocker')
assert(parsed.blockers.fixPrompt === null, 'unexpected fix prompt')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.claimsAllowed.disabledRouteSourceOwnerReviewed === true, 'claim allowed missing')
assert(parsed.policy.claimsAllowed.disabledRouteRegistrationPlanningMayProceed === true, 'registration claim allowed missing')
for (const [key, value] of Object.entries(parsed.policy.claimsForbidden)) {
  assert(value === 'forbidden', `claimsForbidden.${key} must be forbidden`)
}
assertNoop(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

const sourceText = read(sourceFile)
assert(sourceText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH'), 'route path constant missing')
assert(sourceText.includes(`'${routePath}'`), 'route path value missing')
assert(sourceText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED = false as const'), 'execution false constant missing')
assert(sourceText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP = false as const'), 'registered false constant missing')
assert(sourceText.includes('soundCpuNoMediaAgentCallDisabledRouteHandler'), 'disabled handler missing from source')
assert(sourceText.includes('response.status(409).json'), 'blocked response missing')
assert(sourceText.includes('acceptedToolCount: 15'), 'accepted tool count missing from source')
assert(sourceText.includes('acceptedWorkerCount: 2'), 'accepted worker count missing from source')
assert(sourceText.includes('acceptedImageCount: 2'), 'accepted image count missing from source')
assert(sourceText.includes('acceptedJobTypeCount: 4'), 'accepted job type count missing from source')
assert(!/^import\\s/m.test(sourceText), 'source route should not import runtime modules yet')
for (const tool of expectedTools) assert(sourceText.includes(`'${tool}'`), `source missing tool ${tool}`)

for (const file of candidateRegistrationFiles) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) continue
  const text = fs.readFileSync(full, 'utf8')
  assert(!text.includes(routePath), `${file} already references disabled route path`)
  assert(!text.includes('soundCpuNoMediaAgentCallDisabledRouteHandler'), `${file} already registers disabled route handler`)
}

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-plan.md')
assert(prompt.includes('Do not register the route in this prompt.'), 'prompt registration boundary missing')
assert(prompt.includes('Do not execute the route.'), 'prompt execution boundary missing')
assert(prompt.includes(routePath), 'prompt route path missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-review-diagnostics.mjs',
  'missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceFile,
      routePath,
      registrationPlanningMayProceed: true,
      routeRegistered: false,
      routeExecutionApproved: false,
      acceptedToolCount: expectedTools.length,
      nextPrompt,
      supabase: {
        updateRequired: 'no',
        environmentTouched: 'no',
        sqlExecuted: 'no',
        migrationDeployed: 'no',
        nextAction: 'none',
      },
    },
    null,
    2,
  ),
)
