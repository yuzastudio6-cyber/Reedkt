import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_registration_source_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_call_proof_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_registration_source_gate_completed_with_warnings_ready_for_disabled_route_registration_source_owner_review'
const sourceMergeCommit = 'd72d8044c33e39d72f0cb975a4dbcb4f50e700dd'
const routePath = '/api/internal/workers/sound-cpu/no-media-agent-call'
const routeSourceFile = 'server/routes/sound-cpu-no-media-agent-call-routes.ts'
const appSourceFile = 'server/app.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-CONTROLLED-DISABLED-ROUTE-CALL-PROOF-PLAN'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-review.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-acceptance-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-safety-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-safety-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-blocker-follow-up-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-blocker-follow-up-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-claim-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-claim-policy',
  },
}

const requiredSourceEvidence = [
  routeSourceFile,
  appSourceFile,
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-result.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-contract-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-safety-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-runtime-claim-policy.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-plan.md',
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
    'acceptedForDockerBuildToday',
    'acceptedForExecutionToday',
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
const promptText = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-plan.md',
)
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-review:diagnostics'

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.registrationSourcePr === 2366, 'source PR mismatch')
assert(parsed.review.sourceVerification.registrationSourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.review.sourceVerification.registrationSourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.review.reviewedRegistrationSource.routeSourceFile === routeSourceFile, 'review route source mismatch')
assert(parsed.review.reviewedRegistrationSource.appSourceFile === appSourceFile, 'review app source mismatch')
assert(parsed.review.reviewedRegistrationSource.routePath === routePath, 'review route path mismatch')
assert(parsed.review.reviewedRegistrationSource.routeFactory === 'createSoundCpuNoMediaAgentCallRoutes', 'route factory mismatch')
assert(parsed.review.reviewedRegistrationSource.disabledHandler === 'soundCpuNoMediaAgentCallDisabledRouteHandler', 'handler mismatch')
assert(parsed.review.reviewedRegistrationSource.appMount === 'app.use(createSoundCpuNoMediaAgentCallRoutes())', 'app mount mismatch')
assert(parsed.review.reviewedRegistrationSource.routeRegisteredInApp === true, 'route not registered as disabled')
assert(parsed.review.reviewedRegistrationSource.routeExecutionEnabled === false, 'route execution enabled')
assert(parsed.review.reviewedRegistrationSource.blockedStatusCode === 409, 'blocked status mismatch')
assert(parsed.review.reviewedRegistrationSource.warning === 'route_registered_disabled_handler_only', 'warning mismatch')
assert(
  parsed.review.ownerReviewResult.disabledRouteRegistrationSourceAcceptedForControlledCallProof === true,
  'controlled proof acceptance missing',
)
assert(parsed.review.ownerReviewResult.controlledDisabledRouteCallProofMayProceed === true, 'next proof not accepted')
for (const [key, value] of Object.entries(parsed.review.ownerReviewResult)) {
  if (
    key === 'disabledRouteRegistrationSourceAcceptedForControlledCallProof' ||
    key === 'controlledDisabledRouteCallProofMayProceed'
  ) {
    continue
  }
  assert(value === false, `ownerReviewResult.${key} must be false`)
}
assertNoop(parsed.review.supabaseClassification, 'review.supabaseClassification')
assert(parsed.review.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.acceptance.decision === decision, 'acceptance decision mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.routePath === routePath, 'accepted route path mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.httpMethod === 'POST', 'method mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.routeFactory === 'createSoundCpuNoMediaAgentCallRoutes', 'accepted factory mismatch')
assert(
  parsed.acceptance.acceptedForNextGateOnly.disabledHandler === 'soundCpuNoMediaAgentCallDisabledRouteHandler',
  'accepted handler mismatch',
)
assert(parsed.acceptance.acceptedForNextGateOnly.blockedStatusCode === 409, 'accepted status mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.explicitToolIdRequired === true, 'toolId requirement missing')
assert(parsed.acceptance.acceptedForNextGateOnly.registeredAsDisabledHandlerOnly === true, 'disabled registration missing')
assert(parsed.acceptance.acceptedForNextGateOnly.controlledDisabledRouteCallProofMayProceed === true, 'proof may proceed missing')
assertList(parsed.acceptance.acceptedTools, expectedTools, 'accepted tools')
assertList(parsed.acceptance.acceptedWorkers, expectedWorkers, 'accepted workers')
assertList(parsed.acceptance.acceptedImages, expectedImages, 'accepted images')
assertList(parsed.acceptance.acceptedNoMediaJobTypes, expectedJobTypes, 'accepted job types')
assertFalseMap(parsed.acceptance.acceptedForExecutionToday, 'acceptance.acceptedForExecutionToday')

assert(parsed.safety.decision === decision, 'safety decision mismatch')
assert(parsed.safety.sourceSafety.routeSourceFile === routeSourceFile, 'safety route source mismatch')
assert(parsed.safety.sourceSafety.appSourceFile === appSourceFile, 'safety app source mismatch')
assert(parsed.safety.sourceSafety.routerImportPresent === true, 'router import not represented')
assert(parsed.safety.sourceSafety.appMountPresent === true, 'app mount not represented')
assert(parsed.safety.sourceSafety.routeRegisteredInAppConstant === true, 'registered constant not represented')
assert(parsed.safety.sourceSafety.routeExecutionEnabledConstant === false, 'execution constant not false')
assert(parsed.safety.sourceSafety.handlerReturnsBlockedStatusOnly === true, 'blocked handler missing')
assert(parsed.safety.sourceSafety.blockedStatusCode === 409, 'safety status mismatch')
assert(parsed.safety.sourceSafety.unsafeEnvelopeFieldsFailClosed === true, 'unsafe fail closed missing')
assert(parsed.safety.sourceSafety.runtimeFlagsRequiredFalse === true, 'runtime flags false missing')
assert(parsed.safety.sourceSafety.readinessClaimsRejected === true, 'readiness rejection missing')
assertFalseMap(parsed.safety.closedScopes, 'safety.closedScopes')
assert(parsed.safety.readinessClaims.generated_local_fixture_passed === 'unclaimed', 'fixture claim mismatch')
assert(parsed.safety.readinessClaims.dry_run_passed === 'unclaimed', 'dry-run claim mismatch')
assert(parsed.safety.readinessClaims.routeReadiness === 'blocked', 'route readiness mismatch')
assert(parsed.safety.readinessClaims.toolExecutionReadiness === 'blocked', 'tool readiness mismatch')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.resolvedInThisGate.length === 1, 'resolved blocker count mismatch')
assert(
  parsed.blockers.resolvedInThisGate[0].blocker === 'disabled_route_registration_source_owner_review_required',
  'resolved blocker mismatch',
)
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_disabled_route_call_proof_required'),
  'route call proof blocker missing',
)
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_no_media_tool_execution_unlock_required'),
  'tool execution blocker missing',
)
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'external_agent_execution_readiness_unclaimed'),
  'external-agent readiness blocker missing',
)

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.claimPolicy.routeRegisteredInApp === 'yes_disabled_handler_only', 'route registered policy mismatch')
assert(parsed.policy.claimPolicy.controlledDisabledRouteCallProofReadyToPlan === 'yes', 'proof planning policy mismatch')
for (const [key, value] of Object.entries(parsed.policy.claimPolicy)) {
  if (key === 'routeRegisteredInApp' || key === 'controlledDisabledRouteCallProofReadyToPlan') continue
  if (key === 'generated_local_fixture_passed' || key === 'dry_run_passed') {
    assert(value === 'unclaimed', `claimPolicy.${key} must be unclaimed`)
  } else {
    assert(value === 'no', `claimPolicy.${key} must remain no`)
  }
}
assert(parsed.policy.reportingBoundary.maySayRouteRegisteredAsDisabled === true, 'route registered boundary missing')
assert(parsed.policy.reportingBoundary.maySayControlledDisabledRouteCallProofMayProceed === true, 'proof boundary missing')
assert(parsed.policy.reportingBoundary.maySayExternalAgentExecutionReady === false, 'external-agent ready claim')
assert(parsed.policy.reportingBoundary.maySayToolsReadyForExecution === false, 'tool ready claim')
assert(parsed.policy.reportingBoundary.mustSayToolExecutionUnlockStillRequired === true, 'unlock boundary missing')
assertNoop(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(routeSource.includes("import { Router } from 'express'"), 'Router import missing')
assert(routeSource.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_REGISTRATION_SOURCE_DECISION'), 'registration decision constant missing')
assert(routeSource.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP = true as const'), 'registered flag not true')
assert(routeSource.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED = false as const'), 'execution flag not false')
assert(routeSource.includes('routeRegisteredInApp: SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP'), 'registered metadata missing')
assert(routeSource.includes('registrationSourceDecision: SOUND_CPU_NO_MEDIA_AGENT_CALL_REGISTRATION_SOURCE_DECISION'), 'registration decision missing')
assert(routeSource.includes('response.status(409).json'), 'blocked 409 response missing')
assert(routeSource.includes('route_registered_disabled_handler_only'), 'disabled registration warning missing')
assert(routeSource.includes('export function createSoundCpuNoMediaAgentCallRoutes(): Router'), 'route factory missing')
assert(
  routeSource.includes('router.post(SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH, soundCpuNoMediaAgentCallDisabledRouteHandler)'),
  'factory does not mount disabled handler',
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

assert(promptText.includes(nextPrompt), 'next prompt heading missing')
assert(promptText.includes('status `409`'), 'next prompt must require 409')
assert(promptText.includes('routeExecutionEnabled: false'), 'next prompt must require execution disabled')
assert(promptText.includes('Do not dispatch workers'), 'next prompt must preserve no-dispatch scope')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  routePath,
  routeRegisteredInApp: true,
  routeExecutionEnabled: false,
  acceptedToolCount: expectedTools.length,
  controlledDisabledRouteCallProofMayProceed: true,
  toolExecutionReady: false,
  nextPrompt,
}, null, 2))
