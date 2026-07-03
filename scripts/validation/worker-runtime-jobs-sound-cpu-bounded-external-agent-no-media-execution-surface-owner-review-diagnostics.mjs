import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_owner_review_passed_with_warnings_ready_for_private_fixture_path_intake_or_product_route_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_proof_passed_with_warnings_ready_for_surface_owner_review'
const surfacePlanDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_completed_with_warnings_ready_for_surface_proof'

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
const expectedStopReasons = [
  'agent_origin_invalid',
  'agent_session_id_required',
  'agentSecret_not_allowed',
  'adapter_mediaFilePath_not_allowed',
  'adapter_runtime_flags_must_all_be_false',
  'adapter_tool_descriptor_0_tool_id_not_allowlisted',
  'adapter_tool_descriptor_count_mismatch',
  'adapter_worker_not_allowlisted',
  'adapter_image_not_allowlisted',
  'adapter_job_type_not_allowlisted',
  'adapter_rawPrompt_not_allowed',
]

const files = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-acceptance-register',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-fail-closed-review-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-fail-closed-review-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-blocker-follow-up-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-blocker-follow-up-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-invocation-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-fail-closed-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-runtime-claim-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-tool-coverage-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-with-explicit-path.md',
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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertList(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`)
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} mismatch`)
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'realExternalAgentCredentialsReady',
    'realExternalAgentRuntimeExecutionReady',
    'realUserMediaReady',
    'workerDispatchReady',
    'routeExecutionReady',
    'mediaProcessingReady',
    'supabaseReady',
    'sqlReady',
    'artifactWriteReady',
    'externalBetaRuntimeReady',
    'generated_local_fixture_passed',
    'dry_run_passed',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'betaReadinessClaimed',
    'paidProductionReady',
    'realExternalAgentCredentialProvisioning',
    'productRouteWiring',
    'realUserMediaRead',
    'mediaProcessing',
    'workerExecution',
    'routeExecution',
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

for (const value of Object.values(files)) assertNoForbiddenTrueClaims(value.path)
for (const file of sourceFiles) read(file)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.sourcePr === 2353, 'source PR mismatch')
assert(parsed.review.sourceVerification.sourceMergeCommit === '25a78e7658910e1a3aad258be55c35857a8feec2', 'source merge mismatch')
assert(parsed.review.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.review.sourceVerification.surfacePlanSourcePr === 2352, 'surface plan PR mismatch')
assert(parsed.review.sourceVerification.surfacePlanDecision === surfacePlanDecision, 'surface plan decision mismatch')
assert(parsed.review.sourceVerification.phase210PrivateFixtureBlockerPreserved === true, 'Phase210 blocker not preserved')
assert(parsed.review.reviewResult.boundedNoMediaExecutionSurfaceAccepted === true, 'bounded surface not accepted')
assert(
  parsed.review.reviewResult.acceptedForBoundedCredentiallessNoMediaAgentCalls === true,
  'bounded no-media agent calls not accepted',
)
assert(parsed.review.reviewResult.acceptedSoundCpuToolCount === 15, 'review tool count mismatch')
assert(parsed.review.reviewResult.acceptedWorkerCount === 2, 'review worker count mismatch')
assert(parsed.review.reviewResult.acceptedImageCount === 2, 'review image count mismatch')
assert(parsed.review.reviewResult.acceptedJobTypeCount === 4, 'review job type count mismatch')
assert(parsed.review.reviewResult.acceptedInvocationCount === 4, 'review invocation count mismatch')
assert(parsed.review.reviewResult.acceptedToolDescriptorTotal === 60, 'review descriptor total mismatch')
assert(parsed.review.reviewResult.blockedUnsafeCaseCount === 11, 'blocked unsafe count mismatch')
assert(parsed.review.reviewResult.allBlockedUnsafeCasesFailClosed === true, 'unsafe cases not fail-closed')
assert(parsed.review.reviewResult.stdoutJsonOnly === true, 'stdout JSON-only missing')
assert(parsed.review.reviewResult.runtimeFlagsRemainFalse === true, 'runtime flags not false')
assert(parsed.review.reviewResult.productRoutePlanMayProceed === true, 'product route planning not allowed')
assert(parsed.review.reviewResult.privateFixturePathIntakeMayProceed === true, 'private fixture intake not allowed')
for (const key of [
  'realExternalAgentCredentialProvisioningApprovedToday',
  'productRouteWiringApprovedToday',
  'workerDispatchApprovedToday',
  'routeExecutionApprovedToday',
  'realUserMediaApprovedToday',
  'runtimeReadinessApprovedToday',
  'externalBetaRuntimeApprovedToday',
]) {
  assert(parsed.review.reviewResult[key] === false, `reviewResult.${key} must be false`)
}
assertNoop(parsed.review.supabaseClassification, 'review.supabaseClassification')

assert(parsed.acceptance.decision === decision, 'acceptance decision mismatch')
assertList(parsed.acceptance.acceptedTools, expectedTools, 'accepted tools')
assert(parsed.acceptance.aliasCoverage.pydub_effects === 'covered_by_pydub', 'pydub alias mismatch')
assert(parsed.acceptance.aliasCoverage.ebu_r128_pyloudnorm === 'covered_by_pyloudnorm', 'pyloudnorm alias mismatch')
assertList(parsed.acceptance.acceptedWorkers, expectedWorkers, 'accepted workers')
assertList(parsed.acceptance.acceptedImages, expectedImages, 'accepted images')
assertList(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'accepted job types')
assert(parsed.acceptance.acceptedForToday.boundedCredentiallessNoMediaAgentCalls === true, 'bounded calls not accepted today')
assert(parsed.acceptance.acceptedForToday.stdoutJsonOnly === true, 'stdout-only not accepted today')
assert(parsed.acceptance.acceptedForToday.localProofSurfaceOnly === true, 'local proof surface not accepted today')
for (const key of [
  'realExternalAgentCredentials',
  'productRouteWiring',
  'workerDispatch',
  'routeExecution',
  'mediaRead',
  'mediaProcessing',
  'supabaseMutation',
  'sqlExecution',
  'artifactWrite',
  'externalBetaRuntime',
  'productionRuntime',
]) {
  assert(parsed.acceptance.acceptedForToday[key] === false, `acceptedForToday.${key} must be false`)
}
assert(parsed.acceptance.acceptedForNextPlanning.productRoutePlan === true, 'product route plan not accepted')
assert(parsed.acceptance.acceptedForNextPlanning.privateFixturePathIntakeWithExplicitPath === true, 'private fixture intake missing')
assert(parsed.acceptance.acceptedForNextPlanning.realUserMediaRuntimeProof === false, 'real media proof widened')

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
assert(parsed.failClosed.reviewedBlockedCaseCount === 11, 'reviewed blocked count mismatch')
assert(parsed.failClosed.reviewedFailClosedCases.length === 11, 'reviewed fail-closed rows mismatch')
for (const reason of expectedStopReasons) {
  assert(
    parsed.failClosed.reviewedFailClosedCases.some((row) => row.expectedStopReason === reason && row.ownerAccepted === true),
    `missing accepted stop reason ${reason}`,
  )
}
assertAllFalse(parsed.failClosed.blockedSideEffects, 'failClosed.blockedSideEffects')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.notBlocked.boundedCredentiallessNoMediaAgentCalls === true, 'bounded no-media blocked')
assert(parsed.blockers.notBlocked.productRoutePlanning === true, 'product route planning blocked')
assert(
  parsed.blockers.remainingBlockers.realUserMediaExecution ===
    'blocked_by_phase210_missing_explicit_private_fixture_path_and_boundaries',
  'real media blocker mismatch',
)
assert(parsed.blockers.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-PRODUCT-ROUTE-PLAN', 'next prompt mismatch')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.boundedExternalAgentNoMediaSurfaceOwnerReviewed === true, 'owner reviewed claim missing')
assert(parsed.policy.allowedClaims.boundedCredentiallessNoMediaAgentCallsAccepted === true, 'bounded accepted claim missing')
assert(parsed.policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'policy tool count mismatch')
assert(parsed.policy.allowedClaims.productRoutePlanningMayProceed === true, 'product route policy missing')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const proofResult = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-result.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-result',
)
assert(proofResult.decision === sourceDecision, 'proof source decision mismatch')
assert(proofResult.proofResult.acceptedInvocationCount === 4, 'proof accepted invocation mismatch')
assert(proofResult.proofResult.acceptedToolCountPerInvocation === 15, 'proof tool count mismatch')
assert(proofResult.proofResult.acceptedToolCountTotal === 60, 'proof descriptor total mismatch')
assert(proofResult.proofResult.blockedCaseCount === 11, 'proof blocked case mismatch')
assert(proofResult.proofResult.allBlockedCasesFailClosed === true, 'proof fail-closed mismatch')

const proofInvocations = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-invocation-register.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-invocation-register',
)
assertList(proofInvocations.acceptedTools, expectedTools, 'proof accepted tools')
assert(proofInvocations.acceptedInvocations.length === 4, 'proof invocation count mismatch')
for (const jobType of expectedJobTypes) {
  assert(proofInvocations.acceptedInvocations.some((row) => row.jobType === jobType), `missing proof job type ${jobType}`)
}

const phase210 = parse(
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result',
)
assert(
  phase210.decision === 'worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete',
  'Phase210 blocker decision mismatch',
)
assert(phase210.intakeResult.mediaRead === false, 'Phase210 media read widened')

const productRoutePrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan.md',
)
assert(productRoutePrompt.includes(decision), 'product route prompt missing source decision')
assert(productRoutePrompt.includes('Do not create or modify production routes'), 'product route forbidden scope missing')
assert(
  productRoutePrompt.includes(
    'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_plan_completed_with_warnings_ready_for_product_route_owner_review',
  ),
  'product route prompt pass decision missing',
)

const proofDiagnostics = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-execution-surface-proof:diagnostics',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(proofDiagnostics.status === 0, `bounded surface proof diagnostics failed: ${proofDiagnostics.stderr}`)
assert(proofDiagnostics.stdout.includes(sourceDecision), 'proof diagnostics source decision missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review-diagnostics.mjs',
  'owner review package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2353,
      sourceMergeCommit: parsed.review.sourceVerification.sourceMergeCommit,
      acceptedSoundCpuToolCount: 15,
      acceptedInvocationCount: 4,
      acceptedToolDescriptorTotal: 60,
      blockedUnsafeCaseCount: 11,
      boundedCredentiallessNoMediaAgentCallsAccepted: true,
      productRoutePlanningMayProceed: true,
      realUserMediaApprovedToday: false,
      workerDispatchApprovedToday: false,
      routeExecutionApprovedToday: false,
      supabaseUpdateRequired: false,
    },
    null,
    2,
  ),
)
