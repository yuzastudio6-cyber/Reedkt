import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_plan_completed_with_warnings_ready_for_product_route_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_owner_review_passed_with_warnings_ready_for_private_fixture_path_intake_or_product_route_plan'
const proofDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_proof_passed_with_warnings_ready_for_surface_owner_review'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-PRODUCT-ROUTE-OWNER-REVIEW'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-contract-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-contract-register',
  },
  disabled: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-disabled-default-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-disabled-default-policy',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-fail-closed-boundary-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-fail-closed-boundary-register',
  },
  handoff: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review-handoff-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review-handoff-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-runtime-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-claim-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-invocation-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review.md',
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
    'productRouteCreated',
    'productRouteWired',
    'productRouteExecutionReady',
    'workerDispatchReady',
    'routeExecutionReady',
    'realExternalAgentCredentialsReady',
    'realUserMediaReady',
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
    'routeSourceCreation',
    'routeRegistration',
    'routeExecution',
    'workerExecution',
    'workerDispatch',
    'jobClaimLeaseMutation',
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

for (const value of Object.values(files)) assertNoForbiddenTrueClaims(value.path)
for (const file of sourceFiles) read(file)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

assert(parsed.plan.decision === decision, 'plan decision mismatch')
assert(parsed.plan.sourceVerification.sourcePr === 2354, 'source PR mismatch')
assert(parsed.plan.sourceVerification.sourceMergeCommit === '9cb02a44fd70228eb4d2f108ac34c283685ffcc6', 'source merge mismatch')
assert(parsed.plan.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.plan.sourceVerification.proofSourcePr === 2353, 'proof PR mismatch')
assert(parsed.plan.sourceVerification.proofDecision === proofDecision, 'proof decision mismatch')
assert(parsed.plan.productRoutePlan.actualRouteCreated === false, 'actual route created')
assert(parsed.plan.productRoutePlan.actualRouteWired === false, 'actual route wired')
assert(parsed.plan.productRoutePlan.routeExecutionEnabled === false, 'route execution enabled')
assert(parsed.plan.productRoutePlan.featureFlagDefault.endsWith('=0'), 'feature flag default must be disabled')
assert(parsed.plan.productRoutePlan.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.plan.productRoutePlan.acceptedWorkerCount === 2, 'worker count mismatch')
assert(parsed.plan.productRoutePlan.acceptedImageCount === 2, 'image count mismatch')
assert(parsed.plan.productRoutePlan.acceptedJobTypeCount === 4, 'job type count mismatch')
assert(parsed.plan.productRoutePlan.stdoutJsonOnly === true, 'stdout-only plan missing')
assert(parsed.plan.productRoutePlan.runtimeFlagsRequiredFalse === true, 'runtime flags false missing')
assert(parsed.plan.productRoutePlan.ownerReviewRequiredBeforeSourceCreation === true, 'owner review source gate missing')
assert(parsed.plan.productRoutePlan.workerDispatchAllowed === false, 'worker dispatch widened')
assert(parsed.plan.productRoutePlan.realUserMediaAllowed === false, 'real media widened')
assert(parsed.plan.productRoutePlan.supabaseMutationAllowed === false, 'Supabase widened')
assert(parsed.plan.productRoutePlan.artifactWriteAllowed === false, 'artifact write widened')
assertNoop(parsed.plan.supabaseClassification, 'plan.supabaseClassification')
assert(parsed.plan.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.contract.decision === decision, 'contract decision mismatch')
assert(parsed.contract.proposedRoute.createdToday === false, 'route created today')
assert(parsed.contract.proposedRoute.publicApi === false, 'public API widened')
assert(parsed.contract.proposedRoute.internalPlanningOnly === true, 'internal planning missing')
assert(parsed.contract.proposedRoute.disabledByDefault === true, 'disabled default missing')
assertList(parsed.contract.acceptedTools, expectedTools, 'contract accepted tools')
assertList(parsed.contract.acceptedWorkers, expectedWorkers, 'contract accepted workers')
assertList(parsed.contract.acceptedImages, expectedImages, 'contract accepted images')
assertList(parsed.contract.acceptedJobTypes, expectedJobTypes, 'contract accepted job types')
for (const field of ['rawPrompt', 'agentSecret', 'mediaFilePath', 'signedUrl', 'publicArtifactUrl', 'serviceAccountJson']) {
  assert(parsed.contract.forbiddenRequestFields.includes(field), `missing forbidden field ${field}`)
}
assert(parsed.contract.resultShape.stdoutJsonOnly === true, 'result stdout-only mismatch')
assert(parsed.contract.resultShape.persistsResult === false, 'result persistence widened')

assert(parsed.disabled.decision === decision, 'disabled decision mismatch')
assertAllFalse(parsed.disabled.disabledDefaults, 'disabled.disabledDefaults')
assert(parsed.disabled.proposedFeatureFlags.REEDITPRO_SOUND_CPU_BOUNDED_NO_MEDIA_PRODUCT_ROUTE_ENABLED === '0', 'route flag not disabled')
assert(parsed.disabled.ownerReviewRequirements.includes('WORKER_RUNTIME_JOBS owner review'), 'owner review requirement missing')

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
assert(parsed.failClosed.requiredFailClosedCases.length === 15, 'fail-closed case count mismatch')
assert(parsed.failClosed.inheritedProofBlockedCaseCount === 11, 'inherited fail-closed count mismatch')
assert(parsed.failClosed.newRoutePlanningBlockedCaseCount === 4, 'new route fail-closed count mismatch')
assertAllFalse(parsed.failClosed.blockedSideEffects, 'failClosed.blockedSideEffects')

assert(parsed.handoff.decision === decision, 'handoff decision mismatch')
assert(parsed.handoff.handoffTarget === 'WORKER_RUNTIME_JOBS', 'handoff target mismatch')
assert(parsed.handoff.acceptedForReview.routePlanReview === true, 'route review not accepted')
assert(parsed.handoff.acceptedForReview.disabledRouteSourceCreationMayBeConsidered === true, 'source planning not accepted')
for (const key of [
  'routeExecutionToday',
  'workerDispatchToday',
  'realUserMediaToday',
  'supabaseMutationToday',
  'artifactWriteToday',
  'externalBetaRuntimeToday',
]) {
  assert(parsed.handoff.acceptedForReview[key] === false, `handoff.${key} must be false`)
}
assert(parsed.handoff.nextPrompt === nextPrompt, 'handoff next prompt mismatch')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.boundedNoMediaProductRoutePlanCreated === true, 'route plan claim missing')
assert(parsed.policy.allowedClaims.routePlanOwnerReviewMayProceed === true, 'owner review claim missing')
assert(parsed.policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const sourceReview = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review',
)
assert(sourceReview.decision === sourceDecision, 'source owner review decision mismatch')
assert(sourceReview.reviewResult.productRoutePlanMayProceed === true, 'source did not permit product route planning')
assert(sourceReview.reviewResult.productRouteWiringApprovedToday === false, 'source product route wiring widened')

const sourceAcceptance = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-acceptance-register.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-acceptance-register',
)
assertList(sourceAcceptance.acceptedTools, expectedTools, 'source accepted tools')
assert(sourceAcceptance.acceptedForNextPlanning.productRoutePlan === true, 'source product route planning missing')
assert(sourceAcceptance.acceptedForToday.productRouteWiring === false, 'source route wiring widened')

const phase210 = parse(
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result',
)
assert(
  phase210.decision === 'worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete',
  'Phase210 blocker decision mismatch',
)
assert(phase210.intakeResult.mediaRead === false, 'Phase210 media read widened')

const ownerReviewDiagnostics = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review:diagnostics',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(ownerReviewDiagnostics.status === 0, `owner review diagnostics failed: ${ownerReviewDiagnostics.stderr}`)
assert(ownerReviewDiagnostics.stdout.includes(sourceDecision), 'owner review diagnostics source decision missing')

const ownerPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review.md',
)
assert(ownerPrompt.includes(decision), 'owner prompt source decision missing')
assert(ownerPrompt.includes('Do not create route source files'), 'owner prompt forbidden source creation missing')
assert(
  ownerPrompt.includes(
    'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_owner_review_passed_with_warnings_ready_for_disabled_route_source_creation_plan',
  ),
  'owner prompt pass decision missing',
)

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-product-route-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan-diagnostics.mjs',
  'product route plan package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2354,
      sourceMergeCommit: parsed.plan.sourceVerification.sourceMergeCommit,
      acceptedSoundCpuToolCount: 15,
      acceptedJobTypeCount: 4,
      routePlanCreated: true,
      actualRouteCreated: false,
      routeExecutionEnabled: false,
      workerDispatchAllowed: false,
      realUserMediaAllowed: false,
      supabaseUpdateRequired: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
