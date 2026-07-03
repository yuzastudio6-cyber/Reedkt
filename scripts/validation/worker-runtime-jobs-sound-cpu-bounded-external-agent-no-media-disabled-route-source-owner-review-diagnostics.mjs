import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_owner_review_passed_with_warnings_ready_for_actual_disabled_route_source_creation'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_creation_plan_completed_with_warnings_ready_for_disabled_route_source_owner_review'
const productRouteOwnerDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_owner_review_passed_with_warnings_ready_for_disabled_route_source_creation_plan'
const productRoutePlanDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_plan_completed_with_warnings_ready_for_product_route_owner_review'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ACTUAL-DISABLED-ROUTE-SOURCE-CREATION'
const proposedSourceFile = 'server/routes/sound-cpu-no-media-agent-call-routes.ts'
const proposedRoutePath = '/api/internal/workers/sound-cpu/no-media-agent-call'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-acceptance-register',
  },
  adjacent: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-adjacent-route-review-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-adjacent-route-review-register',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-fail-closed-review-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-fail-closed-review-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-blocker-follow-up-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-blocker-follow-up-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-claim-policy',
  },
}

const requiredSourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-path-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-contract-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-disabled-default-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-fail-closed-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-creation.md',
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
    'actualRouteSourceCreated',
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
    'routeSourceCreation',
    'routeRegistration',
    'routeExecution',
    'workerExecution',
    'workerDispatch',
    'toolExecution',
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

for (const value of Object.values(files)) {
  read(value.path)
  assertNoForbiddenTrueClaims(value.path)
}
for (const file of requiredSourceFiles) read(file)
assert(!fs.existsSync(path.join(process.cwd(), proposedSourceFile)), `${proposedSourceFile} must not exist in owner review`)

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-review-diagnostics.mjs',
  'missing package diagnostics script',
)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.sourcePr === 2357, 'source PR mismatch')
assert(parsed.review.sourceVerification.sourceMergeCommit === '7f28e10d28a1d228da77f4b051fa558d11fb88dc', 'source merge mismatch')
assert(parsed.review.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.review.sourceVerification.productRouteOwnerReviewDecision === productRouteOwnerDecision, 'product owner decision mismatch')
assert(parsed.review.sourceVerification.productRoutePlanDecision === productRoutePlanDecision, 'product route plan decision mismatch')
assert(parsed.review.reviewResult.disabledRouteSourcePlanAccepted === true, 'source plan not accepted')
assert(parsed.review.reviewResult.actualDisabledRouteSourceCreationMayProceed === true, 'actual source creation not accepted for next gate')
for (const key of [
  'actualRouteSourceCreatedToday',
  'routeRegisteredToday',
  'routeExecutionApprovedToday',
  'workerDispatchApprovedToday',
  'toolExecutionApprovedToday',
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
assert(parsed.review.preservedSurface.proposedInternalRoutePath === proposedRoutePath, 'route path mismatch')
assert(parsed.review.preservedSurface.proposedFutureSourceFile === proposedSourceFile, 'source file mismatch')
assert(parsed.review.preservedSurface.stdoutJsonOnly === true, 'stdout JSON missing')
assert(parsed.review.preservedSurface.internalRouteOnly === true, 'internal route missing')
assert(parsed.review.preservedSurface.disabledByDefault === true, 'disabled default missing')
assert(parsed.review.preservedSurface.failClosedForUnsafeEnvelope === true, 'fail closed missing')
assert(parsed.review.preservedSurface.noPersistence === true, 'no persistence missing')
assert(parsed.review.preservedSurface.noMedia === true, 'no media missing')
assertNoop(parsed.review.supabaseClassification, 'review.supabaseClassification')
assert(parsed.review.nextPrompt === nextPrompt, 'review next prompt mismatch')

assert(parsed.acceptance.decision === decision, 'acceptance decision mismatch')
assert(parsed.acceptance.acceptedForNextGate.actualDisabledRouteSourceCreation === true, 'next source creation not accepted')
assert(parsed.acceptance.acceptedForNextGate.proposedInternalRoutePath === proposedRoutePath, 'acceptance route mismatch')
assert(parsed.acceptance.acceptedForNextGate.proposedFutureSourceFile === proposedSourceFile, 'acceptance source mismatch')
assert(parsed.acceptance.acceptedForNextGate.featureFlagDisabledDefault === true, 'disabled default not accepted')
assert(parsed.acceptance.acceptedForNextGate.stdoutJsonOnlyResult === true, 'stdout not accepted')
assert(parsed.acceptance.acceptedForNextGate.noPersistence === true, 'no persistence not accepted')
assert(parsed.acceptance.acceptedForNextGate.unsafeEnvelopeFailClosedCases === true, 'fail closed not accepted')
assert(parsed.acceptance.acceptedForNextGate.noMediaBoundary === true, 'no media not accepted')
assertList(parsed.acceptance.acceptedTools, expectedTools, 'accepted tools')
assertList(parsed.acceptance.acceptedWorkers, expectedWorkers, 'accepted workers')
assertList(parsed.acceptance.acceptedImages, expectedImages, 'accepted images')
assertList(parsed.acceptance.acceptedNoMediaJobTypes, expectedJobTypes, 'accepted job types')
assertAllFalse(parsed.acceptance.acceptedForToday, 'acceptance.acceptedForToday')

assert(parsed.adjacent.decision === decision, 'adjacent decision mismatch')
assert(parsed.adjacent.proposedNoMediaAgentRoute.httpPath === proposedRoutePath, 'adjacent route mismatch')
assert(parsed.adjacent.proposedNoMediaAgentRoute.sourceFile === proposedSourceFile, 'adjacent source mismatch')
assert(parsed.adjacent.proposedNoMediaAgentRoute.createdNow === false, 'source created now')
assert(parsed.adjacent.proposedNoMediaAgentRoute.registeredNow === false, 'route registered now')
assert(parsed.adjacent.proposedNoMediaAgentRoute.executableNow === false, 'route executable now')
assert(parsed.adjacent.adjacentExistingRoutes.length === 3, 'adjacent route count mismatch')
for (const route of parsed.adjacent.adjacentExistingRoutes) {
  assert(route.samePurposeAsNoMediaAgentCallRoute === false, `same-purpose route: ${route.file}`)
  assert(route.retargetForThisGate === false, `retargeted adjacent route: ${route.file}`)
  assert(route.reuseWithoutLaterOwnerReview === false, `unreviewed reuse widened: ${route.file}`)
}
assert(parsed.adjacent.duplicatePolicy.samePurposeRouteAlreadyExists === false, 'same-purpose route already exists')
assert(parsed.adjacent.duplicatePolicy.duplicateSourceCreationRecommended === false, 'duplicate creation recommended')
assert(parsed.adjacent.duplicatePolicy.mustReinspectBeforeActualSourceCreation === true, 'reinspect guard missing')
assert(parsed.adjacent.duplicatePolicy.mustAvoidSecondSamePurposeRoute === true, 'duplicate guard missing')
assert(parsed.adjacent.duplicatePolicy.mustNotRetargetExistingWorkerJobRouteWithoutOwnerReview === true, 'retarget guard missing')

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
assert(parsed.failClosed.futureUnsafeEnvelopeCases.length === 15, 'unsafe envelope case count mismatch')
assert(parsed.failClosed.requiredFutureFailureBehavior.returnStructuredJson === true, 'structured JSON failure missing')
assert(parsed.failClosed.requiredFutureFailureBehavior.explainBlockedReason === true, 'blocked reason missing')
for (const [key, value] of Object.entries(parsed.failClosed.requiredFutureFailureBehavior)) {
  if (key === 'returnStructuredJson' || key === 'explainBlockedReason') continue
  assert(value === false, `failure behavior ${key} must be false`)
}
assertAllFalse(parsed.failClosed.currentGateObservedSideEffects, 'failClosed.currentGateObservedSideEffects')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.blockingIssuesForThisReview.length === 0, 'unexpected blocker')
assert(parsed.blockers.acceptedWarnings.length === 2, 'accepted warning count mismatch')
assert(parsed.blockers.inheritedBlockers.length === 3, 'inherited blocker count mismatch')
assert(parsed.blockers.nextPrompt === nextPrompt, 'blocker next prompt mismatch')
assert(parsed.blockers.fixPromptRequired === false, 'fix prompt should not be required')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.disabledRouteSourcePlanReviewed === true, 'policy review claim missing')
assert(parsed.policy.allowedClaims.actualDisabledRouteSourceCreationMayProceed === true, 'policy next gate claim missing')
assert(parsed.policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'policy tool count mismatch')
assert(parsed.policy.allowedClaims.acceptedNoMediaJobTypeCount === 4, 'policy job type count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const sourcePlan = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan',
)
assert(sourcePlan.decision === sourceDecision, 'source plan decision mismatch')
assert(sourcePlan.disabledRouteSourceCreationPlan.proposedInternalRoutePath === proposedRoutePath, 'source route path mismatch')
assert(sourcePlan.disabledRouteSourceCreationPlan.proposedFutureSourceFile === proposedSourceFile, 'source file mismatch')
assert(sourcePlan.disabledRouteSourceCreationPlan.sourceCreatedInThisGate === false, 'source plan created source')
assert(sourcePlan.disabledRouteSourceCreationPlan.routeRegisteredInThisGate === false, 'source plan registered route')
assert(sourcePlan.disabledRouteSourceCreationPlan.routeExecutionEnabledInThisGate === false, 'source plan enabled route')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-creation.md')
assert(prompt.includes(decision), 'next prompt missing source decision')
assert(prompt.includes(proposedSourceFile), 'next prompt missing proposed source file')
assert(prompt.includes(proposedRoutePath), 'next prompt missing proposed route')
assert(prompt.includes('Do not retarget'), 'next prompt missing duplicate guard')
assert(prompt.includes('Expected pass decision'), 'next prompt missing pass decision')

const result = {
  ok: true,
  decision,
  sourcePr: 2357,
  sourceMergeCommit: '7f28e10d28a1d228da77f4b051fa558d11fb88dc',
  acceptedToolCount: expectedTools.length,
  acceptedWorkerCount: expectedWorkers.length,
  acceptedImageCount: expectedImages.length,
  acceptedNoMediaJobTypeCount: expectedJobTypes.length,
  proposedRoutePath,
  proposedSourceFile,
  actualRouteSourceCreatedToday: false,
  routeRegisteredToday: false,
  routeExecutionApprovedToday: false,
  workerDispatchApprovedToday: false,
  realUserMediaApprovedToday: false,
  supabaseUpdateRequired: false,
  nextPrompt,
}

console.log(JSON.stringify(result, null, 2))
