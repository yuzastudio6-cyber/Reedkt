import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_owner_review_passed_with_warnings_ready_for_disabled_route_source_creation_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_plan_completed_with_warnings_ready_for_product_route_owner_review'
const ownerSourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_owner_review_passed_with_warnings_ready_for_private_fixture_path_intake_or_product_route_plan'
const proofSourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_proof_passed_with_warnings_ready_for_surface_owner_review'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-DISABLED-ROUTE-SOURCE-CREATION-PLAN'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-acceptance-register',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-fail-closed-review-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-fail-closed-review-register',
  },
  disabledSource: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-disabled-source-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-disabled-source-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-blocker-follow-up-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-contract-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-disabled-default-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-fail-closed-boundary-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-runtime-claim-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan.md',
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
    'actualRouteSourceCreated',
    'routeRegistered',
    'routeExecutionReady',
    'workerDispatchReady',
    'workerExecutionReady',
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
    'routeSourceFile',
    'routeRegistration',
    'runtimeHandler',
    'workerDispatcher',
    'credentialStore',
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

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.sourcePr === 2355, 'source PR mismatch')
assert(parsed.review.sourceVerification.sourceMergeCommit === '23d313cc9f542c76987c6ce4680a7eb8aa125712', 'source merge mismatch')
assert(parsed.review.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.review.sourceVerification.ownerReviewSourceDecision === ownerSourceDecision, 'owner source decision mismatch')
assert(parsed.review.sourceVerification.proofSourceDecision === proofSourceDecision, 'proof source decision mismatch')
assert(parsed.review.reviewResult.routePlanAcceptedForNextPlanning === true, 'route plan was not reviewed')
assert(parsed.review.reviewResult.disabledRouteSourceCreationPlanMayProceed === true, 'next source planning not accepted')
for (const key of [
  'actualRouteSourceCreatedToday',
  'routeRegistrationApprovedToday',
  'routeExecutionApprovedToday',
  'workerDispatchApprovedToday',
  'realExternalAgentCredentialsApprovedToday',
  'realUserMediaApprovedToday',
  'supabaseMutationApprovedToday',
  'artifactWriteApprovedToday',
  'externalBetaRuntimeApprovedToday',
]) {
  assert(parsed.review.reviewResult[key] === false, `review.${key} must be false`)
}
assert(parsed.review.preservedSurface.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.review.preservedSurface.acceptedWorkerCount === 2, 'worker count mismatch')
assert(parsed.review.preservedSurface.acceptedImageCount === 2, 'image count mismatch')
assert(parsed.review.preservedSurface.acceptedNoMediaJobTypeCount === 4, 'job type count mismatch')
assert(parsed.review.preservedSurface.stdoutJsonOnly === true, 'stdout-only not preserved')
assert(parsed.review.preservedSurface.internalRouteOnly === true, 'internal route not preserved')
assert(parsed.review.preservedSurface.disabledByDefault === true, 'disabled default not preserved')
assert(parsed.review.preservedSurface.failClosedForUnsafeEnvelope === true, 'fail-closed not preserved')
assertNoop(parsed.review.supabaseClassification, 'review.supabaseClassification')
assert(parsed.review.nextPrompt === nextPrompt, 'review next prompt mismatch')

assert(parsed.acceptance.decision === decision, 'acceptance decision mismatch')
assert(parsed.acceptance.acceptedForFuturePlanning.disabledRouteSourceCreationPlan === true, 'disabled source planning missing')
assertList(parsed.acceptance.acceptedTools, expectedTools, 'accepted tools')
assertList(parsed.acceptance.acceptedWorkers, expectedWorkers, 'accepted workers')
assertList(parsed.acceptance.acceptedImages, expectedImages, 'accepted images')
assertList(parsed.acceptance.acceptedNoMediaJobTypes, expectedJobTypes, 'accepted job types')
assertAllFalse(parsed.acceptance.acceptedForToday, 'acceptance.acceptedForToday')

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
assert(parsed.failClosed.sourceFailClosedCaseCount === 15, 'source fail-closed count mismatch')
assert(parsed.failClosed.requiredFutureSourceCreationCases.length === 15, 'future fail-closed count mismatch')
assert(parsed.failClosed.ownerReviewOutcome.failClosedBoundaryAccepted === true, 'fail-closed boundary not accepted')
assert(parsed.failClosed.ownerReviewOutcome.requiresStaticDiagnosticsBeforeSourceCreation === true, 'static diagnostics gate missing')
assert(parsed.failClosed.ownerReviewOutcome.requiresNoExecutionProofBeforeRouteEnablement === true, 'no-execution proof gate missing')
assert(parsed.failClosed.ownerReviewOutcome.allowsUnsafeEnvelopeBypass === false, 'unsafe bypass widened')
assert(parsed.failClosed.ownerReviewOutcome.allowsImplicitCredentialFallback === false, 'credential fallback widened')
assert(parsed.failClosed.ownerReviewOutcome.allowsMediaFallback === false, 'media fallback widened')
assertAllFalse(parsed.failClosed.blockedSideEffects, 'failClosed.blockedSideEffects')

assert(parsed.disabledSource.decision === decision, 'disabled source decision mismatch')
assert(parsed.disabledSource.futureSourceCreationPlan.mayPlanDisabledRouteSource === true, 'disabled source plan not allowed')
assert(
  parsed.disabledSource.futureSourceCreationPlan.proposedInternalPath === '/api/internal/workers/sound-cpu/no-media-agent-call',
  'proposed route mismatch',
)
assert(parsed.disabledSource.futureSourceCreationPlan.mustStayInternal === true, 'internal requirement missing')
assert(parsed.disabledSource.futureSourceCreationPlan.mustStayDisabledByDefault === true, 'disabled requirement missing')
assert(parsed.disabledSource.futureSourceCreationPlan.mustReturnStdoutJsonOnly === true, 'stdout requirement missing')
assert(parsed.disabledSource.futureSourceCreationPlan.mustNotPersistResults === true, 'persistence ban missing')
assert(parsed.disabledSource.futureSourceCreationPlan.mustRejectUnsafeEnvelope === true, 'unsafe envelope rejection missing')
assert(parsed.disabledSource.futureSourceCreationPlan.mustPreserveNoMedia === true, 'no-media requirement missing')
assert(parsed.disabledSource.requiredDisabledFlags.REEDITPRO_SOUND_CPU_BOUNDED_NO_MEDIA_PRODUCT_ROUTE_ENABLED === '0', 'route flag not disabled')
assertAllFalse(parsed.disabledSource.currentGateCreated, 'disabledSource.currentGateCreated')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.blockingIssuesForThisReview.length === 0, 'unexpected blocker')
assert(parsed.blockers.inheritedBlockers.length === 3, 'inherited blocker count mismatch')
assert(parsed.blockers.nextPrompt === nextPrompt, 'blocker next prompt mismatch')
assert(parsed.blockers.fixPromptRequired === false, 'fix prompt should not be required')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.productRoutePlanReviewed === true, 'policy route review missing')
assert(parsed.policy.allowedClaims.disabledRouteSourceCreationPlanMayProceed === true, 'policy next planning missing')
assert(parsed.policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'policy tool count mismatch')
assert(parsed.policy.allowedClaims.acceptedNoMediaJobTypeCount === 4, 'policy job type count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const sourcePlan = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan',
)
assert(sourcePlan.decision === sourceDecision, 'source plan decision mismatch')
assert(sourcePlan.productRoutePlan.actualRouteCreated === false, 'source actual route created')
assert(sourcePlan.productRoutePlan.routeExecutionEnabled === false, 'source route execution widened')
assert(sourcePlan.productRoutePlan.workerDispatchAllowed === false, 'source worker dispatch widened')
assert(sourcePlan.productRoutePlan.realUserMediaAllowed === false, 'source media widened')
assert(sourcePlan.productRoutePlan.supabaseMutationAllowed === false, 'source Supabase widened')

const sourceContract = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-contract-register.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-contract-register',
)
assertList(sourceContract.acceptedTools, expectedTools, 'source accepted tools')
assertList(sourceContract.acceptedWorkers, expectedWorkers, 'source accepted workers')
assertList(sourceContract.acceptedImages, expectedImages, 'source accepted images')
assertList(sourceContract.acceptedJobTypes, expectedJobTypes, 'source accepted job types')
assert(sourceContract.proposedRoute.disabledByDefault === true, 'source route disabled default missing')
assert(sourceContract.proposedRoute.createdToday === false, 'source route created')

const phase210 = parse(
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result',
)
assert(
  phase210.decision === 'worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete',
  'Phase210 blocker decision mismatch',
)
assert(phase210.intakeResult.mediaRead === false, 'Phase210 media read widened')

const planDiagnostics = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-product-route-plan:diagnostics',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(planDiagnostics.status === 0, `product route plan diagnostics failed: ${planDiagnostics.stderr}`)
assert(planDiagnostics.stdout.includes(sourceDecision), 'product route plan diagnostics source decision missing')

const prompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan.md',
)
assert(prompt.includes(decision), 'disabled route source prompt source decision missing')
assert(prompt.includes('Do not execute routes'), 'disabled route source prompt no-execution missing')
assert(
  prompt.includes(
    'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_creation_plan_completed_with_warnings_ready_for_disabled_route_source_owner_review',
  ),
  'disabled route source prompt pass decision missing',
)

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-product-route-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review-diagnostics.mjs',
  'owner review package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2355,
      sourceMergeCommit: parsed.review.sourceVerification.sourceMergeCommit,
      acceptedSoundCpuToolCount: 15,
      acceptedNoMediaJobTypeCount: 4,
      productRoutePlanReviewed: true,
      disabledRouteSourceCreationPlanMayProceed: true,
      actualRouteSourceCreatedToday: false,
      routeExecutionApprovedToday: false,
      workerDispatchApprovedToday: false,
      realUserMediaApprovedToday: false,
      supabaseUpdateRequired: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
