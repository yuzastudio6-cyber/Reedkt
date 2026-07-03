import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_registration_plan_completed_with_warnings_ready_for_actual_disabled_route_registration_source_gate'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_source_owner_review_passed_with_warnings_ready_for_disabled_route_registration_plan'
const sourceMergeCommit = '4e78819d6635bac7a152f645fe48441be740c57d'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ACTUAL-DISABLED-ROUTE-REGISTRATION-SOURCE-GATE'
const routePath = '/api/internal/workers/sound-cpu/no-media-agent-call'
const routeSourceFile = 'server/routes/sound-cpu-no-media-agent-call-routes.ts'

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
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-plan',
  },
  target: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-target-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-target-register',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-contract-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-contract-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-safety-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-safety-policy',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-blocker-follow-up-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-blocker-follow-up-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-runtime-claim-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-runtime-claim-policy',
  },
}

const requiredSourceEvidence = [
  routeSourceFile,
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-owner-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-registration-readiness-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-gate.md',
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
    'registrationImplementedInThisGate',
    'routeRegisteredToday',
    'routeExecutableToday',
    'routeExecutionEnabledToday',
    'registeredInAppNow',
    'registeredInAppAfterThisGate',
    'routeExecution',
    'workerDispatch',
    'workerExecution',
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
    'routeRegistered',
    'routeExecutable',
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
const sourceText = read(routeSourceFile)

assert(parsed.plan.decision === decision, 'plan decision mismatch')
assert(parsed.plan.sourceVerification.actualDisabledRouteSourcePr === 2359, 'actual source PR mismatch')
assert(
  parsed.plan.sourceVerification.actualDisabledRouteSourceMergeCommit ===
    '77975ab8514c51c091e1669fd37271511b4e4bdd',
  'actual source merge mismatch',
)
assert(parsed.plan.sourceVerification.actualDisabledRouteSourceOwnerReviewPr === 2360, 'owner review PR mismatch')
assert(parsed.plan.sourceVerification.actualDisabledRouteSourceOwnerReviewMergeCommit === sourceMergeCommit, 'owner review merge mismatch')
assert(parsed.plan.sourceVerification.actualDisabledRouteSourceOwnerReviewDecision === sourceDecision, 'owner review decision mismatch')
assert(parsed.plan.routeRegistrationPlan.sourceFile === routeSourceFile, 'plan source file mismatch')
assert(parsed.plan.routeRegistrationPlan.internalRoutePath === routePath, 'plan route path mismatch')
assert(parsed.plan.routeRegistrationPlan.futureRegistrationSourceGateMayProceed === true, 'future source gate not allowed')
assert(parsed.plan.routeRegistrationPlan.registrationImplementedInThisGate === false, 'registration implemented')
assert(parsed.plan.routeRegistrationPlan.routeRegisteredToday === false, 'route registered today')
assert(parsed.plan.routeRegistrationPlan.routeExecutableToday === false, 'route executable today')
assert(parsed.plan.routeRegistrationPlan.routeExecutionEnabledToday === false, 'route execution enabled today')
assert(parsed.plan.routeRegistrationPlan.futureRegistrationMustRemainDisabled === true, 'disabled future registration missing')
assert(parsed.plan.routeRegistrationPlan.futureRegistrationMustReturnBlocked409 === true, 'blocked 409 missing')
assert(parsed.plan.routeRegistrationPlan.futureRegistrationMustNotDispatchWorkers === true, 'worker dispatch guard missing')
assert(parsed.plan.routeRegistrationPlan.futureRegistrationMustNotExecuteTools === true, 'tool execution guard missing')
assert(parsed.plan.routeRegistrationPlan.futureRegistrationMustNotReadMedia === true, 'media read guard missing')
assert(parsed.plan.preservedContract.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.plan.preservedContract.acceptedWorkerCount === 2, 'worker count mismatch')
assert(parsed.plan.preservedContract.acceptedImageCount === 2, 'image count mismatch')
assert(parsed.plan.preservedContract.acceptedNoMediaJobTypeCount === 4, 'job type count mismatch')
assert(parsed.plan.preservedContract.explicitToolIdTargetingPreserved === true, 'toolId targeting not preserved')
assert(parsed.plan.preservedContract.failClosedEnvelopeValidationPreserved === true, 'fail closed not preserved')
assert(parsed.plan.preservedContract.blockedStatusCode === 409, 'blocked status mismatch')
assert(parsed.plan.preservedContract.staticOnlyRuntimeFlagsRequiredFalse === true, 'static false flags not preserved')
assertNoop(parsed.plan.supabaseClassification, 'plan.supabaseClassification')
assert(parsed.plan.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.target.decision === decision, 'target decision mismatch')
assert(parsed.target.registrationTarget.routeSourceFile === routeSourceFile, 'target source file mismatch')
assert(parsed.target.registrationTarget.routePathConstant === 'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH', 'target constant mismatch')
assert(parsed.target.registrationTarget.routePath === routePath, 'target route path mismatch')
assert(
  parsed.target.registrationTarget.disabledHandler === 'soundCpuNoMediaAgentCallDisabledRouteHandler',
  'target disabled handler mismatch',
)
assert(
  parsed.target.registrationTarget.validationFunction === 'validateSoundCpuNoMediaAgentCallEnvelope',
  'target validation function mismatch',
)
assert(
  parsed.target.registrationTarget.disabledResultFactory === 'createSoundCpuNoMediaAgentCallDisabledResult',
  'target result factory mismatch',
)
assert(parsed.target.registrationTarget.registeredInAppNow === false, 'registered now')
assert(parsed.target.registrationTarget.registeredInAppAfterThisGate === false, 'registered after this gate')
assert(parsed.target.registrationTarget.futureRegistrationGateRequired === true, 'future gate not required')
assert(parsed.target.futureRegistrationSourceConstraints.mustUseExistingRoutePathConstant === true, 'route constant guard missing')
assert(parsed.target.futureRegistrationSourceConstraints.mustUseExistingDisabledHandler === true, 'handler guard missing')
assert(parsed.target.futureRegistrationSourceConstraints.mustKeepExecutionFlagFalse === true, 'execution flag guard missing')
assert(parsed.target.futureRegistrationSourceConstraints.mustKeepRegisteredConstantFalseUntilSourceGate === true, 'registered constant guard missing')
assert(parsed.target.futureRegistrationSourceConstraints.mustNotExposePublicApi === true, 'public API guard missing')
assert(parsed.target.futureRegistrationSourceConstraints.mustNotAddWorkerDispatch === true, 'worker dispatch guard missing')
assert(parsed.target.futureRegistrationSourceConstraints.mustNotAddRuntimeExecution === true, 'runtime guard missing')
assert(parsed.target.futureRegistrationSourceConstraints.mustNotAddMediaRead === true, 'media guard missing')
assert(parsed.target.futureRegistrationSourceConstraints.mustNotAddSupabaseMutation === true, 'Supabase guard missing')
assert(parsed.target.futureRegistrationSourceConstraints.mustNotAddArtifactWrite === true, 'artifact guard missing')
assert(parsed.target.duplicateRiskCheck.samePurposeOpenPrFound === false, 'same-purpose open PR risk')
assert(parsed.target.duplicateRiskCheck.sameHeadOpenPrFound === false, 'same-head open PR risk')

assert(parsed.contract.decision === decision, 'contract decision mismatch')
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
  assert(parsed.contract.requiredEnvelopeFields.includes(field), `missing required envelope field: ${field}`)
}
assert(parsed.contract.runtimeFlagPolicy.allStaticOnlyRuntimeFlagsMustRemainFalse === true, 'runtime flags not false')
assert(parsed.contract.runtimeFlagPolicy.unsafeEnvelopeFieldsRejected === true, 'unsafe fields not rejected')
assert(parsed.contract.runtimeFlagPolicy.readinessClaimsRejected === true, 'readiness claims not rejected')
assert(parsed.contract.runtimeFlagPolicy.blockedResponseStatus === 409, 'blocked status mismatch in contract')
assert(parsed.contract.runtimeFlagPolicy.stdoutJsonOnly === true, 'stdout JSON not preserved')
assert(parsed.contract.runtimeFlagPolicy.noPersistence === true, 'no persistence not preserved')

assert(parsed.safety.decision === decision, 'safety decision mismatch')
assertFalseMap(parsed.safety.closedScopes, 'safety.closedScopes')
assert(parsed.safety.registrationPlanGuardrails.registerDisabledOnlyInFutureGate === true, 'future disabled registration guard missing')
assert(parsed.safety.registrationPlanGuardrails.blocked409ResponseRequired === true, 'blocked 409 guard missing')
for (const key of [
  'doNotAttachExecutionMiddleware',
  'doNotAttachWorkerDispatcher',
  'doNotAttachMediaReaders',
  'doNotAttachSupabaseClients',
  'doNotAttachArtifactWriters',
  'doNotAttachProviderClients',
  'doNotAttachSecrets',
]) {
  assert(parsed.safety.registrationPlanGuardrails[key] === true, `missing guardrail ${key}`)
}
assert(parsed.safety.readinessClaims.generated_local_fixture_passed === 'unclaimed', 'generated fixture claim widened')
assert(parsed.safety.readinessClaims.dry_run_passed === 'unclaimed', 'dry run claim widened')
assert(parsed.safety.readinessClaims.routeReadiness === 'blocked', 'route readiness widened')
assert(parsed.safety.readinessClaims.workerReadiness === 'blocked', 'worker readiness widened')
assert(parsed.safety.readinessClaims.toolExecutionReadiness === 'blocked', 'tool readiness widened')
assert(parsed.safety.readinessClaims.mediaReadiness === 'blocked', 'media readiness widened')
assert(parsed.safety.readinessClaims.betaReadiness === 'blocked', 'beta readiness widened')
assert(parsed.safety.readinessClaims.productionReadiness === 'blocked', 'production readiness widened')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.currentBlockers.length === 3, 'blocker count mismatch')
assert(
  parsed.blockers.currentBlockers.some((item) => item.id === 'actual_disabled_registration_source_missing'),
  'missing registration source blocker',
)
assert(parsed.blockers.nonBlockingAdjacentOpenPrs.length === 2, 'non-blocking adjacent PR count mismatch')
assert(parsed.blockers.nextConcreteStep === 'Create the actual disabled route registration source gate without enabling execution.', 'next step mismatch')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.disabledRouteSourceExists === true, 'source exists claim missing')
assert(parsed.policy.allowedClaims.disabledRouteSourceOwnerReviewed === true, 'owner reviewed claim missing')
assert(parsed.policy.allowedClaims.disabledRouteRegistrationPlanCreated === true, 'registration plan claim missing')
assert(parsed.policy.allowedClaims.all15NoMediaToolIdsPreserved === true, 'tool preservation claim missing')
assert(parsed.policy.allowedClaims.futureRegistrationSourceGateMayProceed === true, 'future gate claim missing')
for (const [key, value] of Object.entries(parsed.policy.claimsForbidden)) assert(value === 'forbidden', `claimsForbidden.${key}`)
assertNoop(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

const laterRegistrationSourceGatePresent = sourceText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_REGISTRATION_SOURCE_DECISION')
assert(
  sourceText.includes(
    laterRegistrationSourceGatePresent
      ? 'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP = true'
      : 'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP = false',
  ),
  'route registered source constant mismatch',
)
assert(sourceText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED = false'), 'route execution source constant changed')
assert(sourceText.includes('soundCpuNoMediaAgentCallDisabledRouteHandler'), 'disabled handler missing from source')
assert(sourceText.includes('status(409)'), 'disabled source must return 409')
for (const tool of expectedTools) assert(sourceText.includes(`'${tool}'`), `source missing tool: ${tool}`)
for (const worker of expectedWorkers) assert(sourceText.includes(`'${worker}'`), `source missing worker: ${worker}`)
for (const image of expectedImages) assert(sourceText.includes(`'${image}'`), `source missing image: ${image}`)
for (const jobType of expectedJobTypes) assert(sourceText.includes(`'${jobType}'`), `source missing job type: ${jobType}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      routePath,
      routeSourceFile,
      acceptedToolCount: expectedTools.length,
      acceptedWorkerCount: expectedWorkers.length,
      acceptedImageCount: expectedImages.length,
      acceptedJobTypeCount: expectedJobTypes.length,
      registrationImplementedInThisGate: false,
      routeRegisteredToday: false,
      routeExecutableToday: false,
      nextPrompt,
      supabase: parsed.plan.supabaseClassification,
    },
    null,
    2,
  ),
)
