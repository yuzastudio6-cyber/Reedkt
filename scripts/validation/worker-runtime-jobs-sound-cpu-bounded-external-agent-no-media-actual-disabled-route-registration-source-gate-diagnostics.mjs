import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_registration_source_gate_completed_with_warnings_ready_for_disabled_route_registration_source_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_registration_plan_completed_with_warnings_ready_for_actual_disabled_route_registration_source_gate'
const sourceMergeCommit = '8feeb12303057815e906c187460415952f832830'
const routePath = '/api/internal/workers/sound-cpu/no-media-agent-call'
const routeSourceFile = 'server/routes/sound-cpu-no-media-agent-call-routes.ts'
const appSourceFile = 'server/app.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-DISABLED-ROUTE-REGISTRATION-SOURCE-OWNER-REVIEW'

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
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-result.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-result',
  },
  register: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-register',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-contract-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-contract-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-safety-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-safety-policy',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-blocker-follow-up-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-blocker-follow-up-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-runtime-claim-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-runtime-claim-policy',
  },
}

const requiredSourceEvidence = [
  routeSourceFile,
  appSourceFile,
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-target-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-gate.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-review.md',
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
    'routeExecutionReady',
    'workerDispatchReady',
    'workerExecutionReady',
    'toolExecutionReady',
    'mediaProcessingReady',
    'supabaseReady',
    'artifactWriteReady',
    'externalBetaReady',
    'productionReady',
    'generated_local_fixture_passed',
    'dry_run_passed',
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
const routeSource = read(routeSourceFile)
const appSource = read(appSourceFile)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.disabledRouteRegistrationPlanPr === 2361, 'source PR mismatch')
assert(parsed.result.sourceVerification.disabledRouteRegistrationPlanMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.result.sourceVerification.disabledRouteRegistrationPlanDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.sourceChangeResult.routeSourceFile === routeSourceFile, 'result route source mismatch')
assert(parsed.result.sourceChangeResult.appSourceFile === appSourceFile, 'result app source mismatch')
assert(parsed.result.sourceChangeResult.routePath === routePath, 'result route path mismatch')
assert(parsed.result.sourceChangeResult.routeFactoryAdded === 'createSoundCpuNoMediaAgentCallRoutes', 'route factory mismatch')
assert(
  parsed.result.sourceChangeResult.disabledHandlerMounted === 'soundCpuNoMediaAgentCallDisabledRouteHandler',
  'handler mismatch',
)
assert(parsed.result.sourceChangeResult.routeRegisteredInApp === true, 'route not marked registered')
assert(parsed.result.sourceChangeResult.routeExecutionEnabled === false, 'route execution enabled')
assert(parsed.result.sourceChangeResult.blockedStatusCode === 409, 'blocked status mismatch')
assert(parsed.result.sourceChangeResult.acceptedForExecution === false, 'accepted for execution')
assert(parsed.result.sourceChangeResult.routeExecutedInThisGate === false, 'route executed in this gate')
assert(parsed.result.acceptedSurfacePreserved.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.result.acceptedSurfacePreserved.acceptedWorkerCount === 2, 'worker count mismatch')
assert(parsed.result.acceptedSurfacePreserved.acceptedImageCount === 2, 'image count mismatch')
assert(parsed.result.acceptedSurfacePreserved.acceptedNoMediaJobTypeCount === 4, 'job type count mismatch')
assert(parsed.result.acceptedSurfacePreserved.explicitToolIdTargetingPreserved === true, 'toolId targeting missing')
assert(parsed.result.acceptedSurfacePreserved.failClosedEnvelopeValidationPreserved === true, 'fail-closed missing')
assert(parsed.result.acceptedSurfacePreserved.staticOnlyRuntimeFlagsRequiredFalse === true, 'static false flags missing')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')
assert(parsed.result.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.register.decision === decision, 'register decision mismatch')
assert(parsed.register.registeredRoute.routePathConstant === 'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH', 'route constant mismatch')
assert(parsed.register.registeredRoute.routePath === routePath, 'register route path mismatch')
assert(parsed.register.registeredRoute.routeFactory === 'createSoundCpuNoMediaAgentCallRoutes', 'register factory mismatch')
assert(parsed.register.registeredRoute.routeFactoryFile === routeSourceFile, 'register source mismatch')
assert(parsed.register.registeredRoute.appMountFile === appSourceFile, 'register app mismatch')
assert(parsed.register.registeredRoute.appMount === 'app.use(createSoundCpuNoMediaAgentCallRoutes())', 'app mount mismatch')
assert(parsed.register.registeredRoute.httpMethod === 'POST', 'method mismatch')
assert(parsed.register.registeredRoute.handler === 'soundCpuNoMediaAgentCallDisabledRouteHandler', 'register handler mismatch')
assert(parsed.register.registeredRoute.internalOnlyPathPrefix === '/api/internal', 'internal prefix mismatch')
assert(parsed.register.registrationFlags.SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP === true, 'flag registered mismatch')
assert(parsed.register.registrationFlags.SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED === false, 'flag execution mismatch')
assertFalseMap(parsed.register.closedExecutionFlags, 'register.closedExecutionFlags')

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
  assert(parsed.contract.requiredEnvelopeFields.includes(field), `missing required field ${field}`)
}
assert(parsed.contract.failClosedBehavior.blockedStatusCode === 409, 'contract blocked status mismatch')
assert(parsed.contract.failClosedBehavior.explicitToolIdRequired === true, 'toolId required mismatch')
assert(parsed.contract.failClosedBehavior.unsafeEnvelopeFieldsRejected === true, 'unsafe field guard mismatch')
assert(parsed.contract.failClosedBehavior.runtimeFlagTrueRejected === true, 'runtime flag guard mismatch')
assert(parsed.contract.failClosedBehavior.readinessClaimsRejected === true, 'readiness guard mismatch')
assert(parsed.contract.failClosedBehavior.acceptedForExecution === false, 'contract accepted for execution')

assert(parsed.safety.decision === decision, 'safety decision mismatch')
assert(parsed.safety.allowedInThisGate.disabledRouteRegistrationSource === true, 'source registration not allowed')
assert(parsed.safety.allowedInThisGate.appRouteTableMount === true, 'app mount not allowed')
assertFalseMap(parsed.safety.closedScopes, 'safety.closedScopes')
assert(parsed.safety.readinessClaims.generated_local_fixture_passed === 'unclaimed', 'fixture claim mismatch')
assert(parsed.safety.readinessClaims.dry_run_passed === 'unclaimed', 'dry-run claim mismatch')
assert(parsed.safety.readinessClaims.routeReadiness === 'blocked', 'route readiness mismatch')
assert(parsed.safety.readinessClaims.toolExecutionReadiness === 'blocked', 'tool readiness mismatch')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.resolvedInThisGate.length === 1, 'resolved blocker count mismatch')
assert(parsed.blockers.remainingBlockers.some((item) => item.blocker === 'disabled_route_registration_source_owner_review_required'), 'owner review blocker missing')
assert(parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_disabled_route_call_proof_required'), 'route call proof blocker missing')
assert(parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_no_media_tool_execution_unlock_required'), 'tool execution blocker missing')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.claimPolicy.routeRegisteredInApp === 'yes_disabled_handler_only', 'policy route registered mismatch')
for (const [key, value] of Object.entries(parsed.policy.claimPolicy)) {
  if (key === 'routeRegisteredInApp') continue
  if (key === 'generated_local_fixture_passed' || key === 'dry_run_passed') {
    assert(value === 'unclaimed', `policy ${key} must be unclaimed`)
  } else {
    assert(value === 'no', `policy ${key} must remain no`)
  }
}
assert(parsed.policy.reportingBoundary.maySayRouteRegisteredAsDisabled === true, 'reporting registered boundary missing')
assert(parsed.policy.reportingBoundary.maySayExternalAgentExecutionReady === false, 'external agent execution ready claim')
assert(parsed.policy.reportingBoundary.maySayToolsReadyForExecution === false, 'tool execution ready claim')
assert(parsed.policy.reportingBoundary.mustSayNextProofRequired === true, 'next proof boundary missing')

assert(routeSource.includes("import { Router } from 'express'"), 'Router import missing')
assert(routeSource.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_REGISTRATION_SOURCE_DECISION'), 'registration decision constant missing')
assert(routeSource.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP = true as const'), 'registered flag not true')
assert(routeSource.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED = false as const'), 'execution flag not false')
assert(routeSource.includes('routeRegisteredInApp: SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP'), 'route registered metadata not linked to constant')
assert(routeSource.includes('registrationSourceDecision: SOUND_CPU_NO_MEDIA_AGENT_CALL_REGISTRATION_SOURCE_DECISION'), 'registration decision not in result')
assert(routeSource.includes('response.status(409).json'), 'blocked 409 response missing')
assert(routeSource.includes('route_registered_disabled_handler_only'), 'disabled registration warning missing')
assert(routeSource.includes('export function createSoundCpuNoMediaAgentCallRoutes(): Router'), 'route factory missing')
assert(
  routeSource.includes('router.post(SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH, soundCpuNoMediaAgentCallDisabledRouteHandler)'),
  'route factory does not mount disabled handler',
)
assert(!routeSource.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED = true'), 'route execution enabled')
assert(!routeSource.includes('acceptedForExecution: true'), 'accepted for execution true')

for (const tool of expectedTools) assert(routeSource.includes(`'${tool}'`), `route source missing tool ${tool}`)
for (const worker of expectedWorkers) assert(routeSource.includes(`'${worker}'`), `route source missing worker ${worker}`)
for (const image of expectedImages) assert(routeSource.includes(`'${image}'`), `route source missing image ${image}`)
for (const jobType of expectedJobTypes) assert(routeSource.includes(`'${jobType}'`), `route source missing job type ${jobType}`)

assert(
  appSource.includes("import { createSoundCpuNoMediaAgentCallRoutes } from './routes/sound-cpu-no-media-agent-call-routes'"),
  'app import missing',
)
assert(appSource.includes('app.use(createSoundCpuNoMediaAgentCallRoutes())'), 'app mount missing')
assert(!appSource.includes('soundCpuNoMediaAgentCallDisabledRouteHandler'), 'app must use route factory, not raw handler')

const routeExecutionForbiddenSnippets = [
  'runWorkerClaimRunner',
  'runToolReadinessChecks',
  'createWorkerClaimService',
  'createSupabaseAdminClient',
  'createSupabasePublicClient',
]
for (const snippet of routeExecutionForbiddenSnippets) {
  assert(!routeSource.includes(snippet), `route source imported execution helper ${snippet}`)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  routePath,
  routeRegisteredInApp: true,
  routeExecutionEnabled: false,
  acceptedToolCount: expectedTools.length,
  acceptedWorkerCount: expectedWorkers.length,
  acceptedImageCount: expectedImages.length,
  acceptedNoMediaJobTypeCount: expectedJobTypes.length,
  nextPrompt,
}, null, 2))
