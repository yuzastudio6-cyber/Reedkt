import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_disabled_route_call_proof_passed_with_warnings_ready_for_disabled_route_call_proof_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_registration_source_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_call_proof_plan'
const sourceMergeCommit = 'ea0fab3654d6c716220bfa741afefd718ee5893f'
const routePath = '/api/internal/workers/sound-cpu/no-media-agent-call'
const proofRunner =
  'scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-runner.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-DISABLED-ROUTE-CALL-PROOF-OWNER-REVIEW'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-result',
  },
  response: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-response-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-response-register',
  },
  envelope: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-static-envelope-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-static-envelope-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-no-side-effect-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-no-side-effect-policy',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-blocker-follow-up-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-runtime-claim-policy',
  },
}

const requiredSourceEvidence = [
  proofRunner,
  'server/routes/sound-cpu-no-media-agent-call-routes.ts',
  'server/app.ts',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-acceptance-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-review.md',
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

function assertNoop(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertList(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`)
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} mismatch`)
}

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'workerDispatch',
    'workerExecution',
    'toolExecution',
    'mediaProcessing',
    'realExternalAgentCredentialProvisioning',
    'realUserMediaRead',
    'supabaseMutation',
    'sqlExecution',
    'artifactCreation',
    'providerModelCall',
    'dockerCloudRunExecution',
    'dockerGcpAction',
    'betaUnlock',
    'productionUnlock',
    'routeExecutionReady',
    'workerDispatchReady',
    'workerExecutionReady',
    'toolExecutionReady',
    'externalAgentExecutionReady',
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
const runnerText = read(proofRunner)
const routeSource = read('server/routes/sound-cpu-no-media-agent-call-routes.ts')
const packageJson = JSON.parse(read('package.json'))
const scriptProof =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof:proof'
const scriptDiagnostics =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof:diagnostics'

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.disabledRouteRegistrationSourceOwnerReviewPr === 2368, 'source PR mismatch')
assert(parsed.result.sourceVerification.disabledRouteRegistrationSourceOwnerReviewMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.result.sourceVerification.disabledRouteRegistrationSourceOwnerReviewDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.proofResult.proofRunner === proofRunner, 'proof runner mismatch')
assert(parsed.result.proofResult.routePath === routePath, 'route path mismatch')
assert(parsed.result.proofResult.localHttpPostAttempted === true, 'local proof not represented')
assert(parsed.result.proofResult.localHostOnly === true, 'local host proof not represented')
assert(parsed.result.proofResult.status === 409, 'status mismatch')
assert(parsed.result.proofResult.errorCode === 'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_NOT_ENABLED', 'error code mismatch')
assert(parsed.result.proofResult.routeRegisteredInApp === true, 'route registered mismatch')
assert(parsed.result.proofResult.routeExecutionEnabled === false, 'route execution enabled')
assert(parsed.result.proofResult.acceptedForExecution === false, 'accepted for execution')
assert(parsed.result.proofResult.envelopeValidationOk === true, 'envelope validation mismatch')
assert(parsed.result.proofResult.explicitToolId === 'librosa', 'toolId mismatch')
assert(parsed.result.proofResult.acceptedToolCount === 15, 'tool count mismatch')
assert(parsed.result.proofResult.acceptedWorkerCount === 2, 'worker count mismatch')
assert(parsed.result.proofResult.acceptedImageCount === 2, 'image count mismatch')
assert(parsed.result.proofResult.acceptedNoMediaJobTypeCount === 4, 'job type count mismatch')
assert(parsed.result.proofResult.allSideEffectsFalse === true, 'side effects not false')
assertFalseMap(parsed.result.closedExecutionScopes, 'result.closedExecutionScopes')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')
assert(parsed.result.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.response.decision === decision, 'response decision mismatch')
assert(parsed.response.response.httpStatus === 409, 'response status mismatch')
assert(parsed.response.response.topLevelOk === false, 'response ok mismatch')
assert(parsed.response.response.errorCode === 'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_NOT_ENABLED', 'response error mismatch')
assert(parsed.response.response.routeRegisteredInApp === true, 'response registered mismatch')
assert(parsed.response.response.routeExecutionEnabled === false, 'response execution mismatch')
assert(parsed.response.response.acceptedForExecution === false, 'response accepted mismatch')
assert(parsed.response.response.validationOkBeforeFailClosedBlock === true, 'validation mismatch')
assert(parsed.response.warnings.includes('route_registered_disabled_handler_only'), 'disabled warning missing')
assert(parsed.response.warnings.includes('tool_execution_not_enabled'), 'tool disabled warning missing')
assertFalseMap(parsed.response.sideEffects, 'response.sideEffects')

assert(parsed.envelope.decision === decision, 'envelope decision mismatch')
assert(parsed.envelope.safeEnvelope.workerName === 'sound-cpu-analysis-worker', 'worker mismatch')
assert(parsed.envelope.safeEnvelope.imageName === 'reeditpro/sound-cpu-analysis-worker', 'image mismatch')
assert(parsed.envelope.safeEnvelope.jobType === 'sound.package_import_smoke', 'job type mismatch')
assert(parsed.envelope.safeEnvelope.toolId === 'librosa', 'tool mismatch')
assert(parsed.envelope.safeEnvelope.runtimeFlagsAllFalse === true, 'runtime flag mismatch')
assertList(parsed.envelope.acceptedTools, expectedTools, 'accepted tools')
assertList(parsed.envelope.acceptedWorkers, expectedWorkers, 'accepted workers')
assertList(parsed.envelope.acceptedImages, expectedImages, 'accepted images')
assertList(parsed.envelope.acceptedNoMediaJobTypes, expectedJobTypes, 'accepted job types')

assert(parsed.policy.decision === decision, 'no-side-effect policy decision mismatch')
assert(parsed.policy.allowedInThisGate.localEphemeralExpressApp === true, 'local app not allowed')
assert(parsed.policy.allowedInThisGate.localHttpPostToDisabledRoute === true, 'local post not allowed')
assert(parsed.policy.allowedInThisGate.safeStaticEnvelopeValidation === true, 'safe validation not allowed')
assert(parsed.policy.allowedInThisGate.failClosedResponseInspection === true, 'inspection not allowed')
assertFalseMap(parsed.policy.blockedInThisGate, 'policy.blockedInThisGate')
assert(parsed.policy.proofBoundary.maySayDisabledRouteReachable === true, 'route reachable boundary missing')
assert(parsed.policy.proofBoundary.maySayFailClosedEnvelopeVerified === true, 'fail-closed boundary missing')
assert(parsed.policy.proofBoundary.maySayAgentToolExecutionReady === false, 'agent tool execution ready claim')
assert(parsed.policy.proofBoundary.maySayExternalBetaReady === false, 'external beta ready claim')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.resolvedInThisGate.length === 1, 'resolved blocker count mismatch')
assert(parsed.blockers.resolvedInThisGate[0].blocker === 'controlled_disabled_route_call_proof_required', 'resolved blocker mismatch')
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'disabled_route_call_proof_owner_review_required'),
  'owner review blocker missing',
)
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_no_media_tool_execution_unlock_required'),
  'tool execution unlock blocker missing',
)

assert(parsed.claims.decision === decision, 'claim policy decision mismatch')
assert(parsed.claims.claimPolicy.disabledRouteReachable === 'yes_local_controlled_proof_only', 'disabled route claim mismatch')
assert(parsed.claims.claimPolicy.failClosedEnvelopeVerified === 'yes', 'fail closed claim mismatch')
for (const [key, value] of Object.entries(parsed.claims.claimPolicy)) {
  if (key === 'disabledRouteReachable' || key === 'failClosedEnvelopeVerified' || key === 'routeRegisteredInApp') continue
  if (key === 'generated_local_fixture_passed' || key === 'dry_run_passed') {
    assert(value === 'unclaimed', `claimPolicy.${key} must be unclaimed`)
  } else {
    assert(value === 'no', `claimPolicy.${key} must remain no`)
  }
}
assert(parsed.claims.reportingBoundary.maySayDisabledRouteCallProofPassed === true, 'proof reporting boundary missing')
assert(parsed.claims.reportingBoundary.maySayToolsReadyForExecution === false, 'tool ready reporting claim')
assert(parsed.claims.reportingBoundary.maySayAgentCanExecuteTools === false, 'agent execute claim')
assert(parsed.claims.reportingBoundary.mustSayOwnerReviewAndExecutionUnlockStillRequired === true, 'owner review boundary missing')
assertNoop(parsed.claims.supabaseClassification, 'claims.supabaseClassification')

assert(runnerText.includes("import express from 'express'"), 'runner must use express')
assert(runnerText.includes("app.listen(0, '127.0.0.1')"), 'runner must use local ephemeral listener')
assert(runnerText.includes('fetch(`http://127.0.0.1:'), 'runner must use local HTTP POST')
assert(runnerText.includes('response.status === 409'), 'runner must assert 409')
assert(runnerText.includes("toolId: 'librosa'"), 'runner must use explicit toolId')
assert(runnerText.includes('allSideEffectsFalse: true'), 'runner must record side effects false')
assert(!runnerText.includes('createReeditProApiApp'), 'runner must not create full API app')
assert(!runnerText.includes('createSupabase'), 'runner must not create Supabase clients')
assert(!runnerText.includes('child_process'), 'runner must not shell out')
assert(!/\bdocker\s+(build|run|push|image|compose)\b/i.test(runnerText), 'runner must not call Docker commands')
assert(!runnerText.includes('spawn('), 'runner must not spawn subprocesses')
assert(!runnerText.includes('exec('), 'runner must not exec subprocesses')
assert(routeSource.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED = false as const'), 'route execution enabled')
assert(routeSource.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP = true as const'), 'route registered flag missing')

assert(
  packageJson.scripts?.[scriptProof] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-runner.ts',
  'proof package script missing',
)
assert(
  packageJson.scripts?.[scriptDiagnostics] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-diagnostics.mjs',
  'diagnostics package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  routePath,
  localHttpPostAttempted: true,
  status: 409,
  acceptedForExecution: false,
  routeExecutionEnabled: false,
  explicitToolId: 'librosa',
  acceptedToolCount: expectedTools.length,
  allSideEffectsFalse: true,
  toolExecutionReady: false,
  nextPrompt,
}, null, 2))
