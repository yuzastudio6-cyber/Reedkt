import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_creation_plan_completed_with_warnings_ready_for_disabled_route_source_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_owner_review_passed_with_warnings_ready_for_disabled_route_source_creation_plan'
const productRouteDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_plan_completed_with_warnings_ready_for_product_route_owner_review'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-DISABLED-ROUTE-SOURCE-OWNER-REVIEW'

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
const proposedSourceFile = 'server/routes/sound-cpu-no-media-agent-call-routes.ts'
const proposedRoutePath = '/api/internal/workers/sound-cpu/no-media-agent-call'

const files = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan',
  },
  paths: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-path-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-path-register',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-contract-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-contract-plan',
  },
  disabled: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-disabled-default-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-disabled-default-policy',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-fail-closed-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-fail-closed-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-blocker-follow-up-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-runtime-claim-policy',
  },
}

const requiredSourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-disabled-source-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-contract-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
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
    'sourceCreatedInThisGate',
    'routeRegisteredInThisGate',
    'routeExecutionEnabledInThisGate',
    'sourceFileCreated',
    'routeRegistered',
    'routeExecuted',
    'workerDispatched',
    'mediaRead',
    'supabaseTouched',
    'artifactCreated',
    'actualRouteSourceCreated',
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
for (const file of requiredSourceFiles) read(file)
assert(!fs.existsSync(path.join(process.cwd(), proposedSourceFile)), `${proposedSourceFile} must not exist in this planning gate`)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

assert(parsed.plan.decision === decision, 'plan decision mismatch')
assert(parsed.plan.sourceVerification.sourcePr === 2356, 'source PR mismatch')
assert(parsed.plan.sourceVerification.sourceMergeCommit === '40026907b5027a240a1b0388222ad5c32991b732', 'source merge mismatch')
assert(parsed.plan.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.plan.sourceVerification.productRoutePlanDecision === productRouteDecision, 'product route decision mismatch')
assert(parsed.plan.disabledRouteSourceCreationPlan.proposedInternalRoutePath === proposedRoutePath, 'route path mismatch')
assert(parsed.plan.disabledRouteSourceCreationPlan.proposedFutureSourceFile === proposedSourceFile, 'source file mismatch')
assert(parsed.plan.disabledRouteSourceCreationPlan.sourceCreatedInThisGate === false, 'source created')
assert(parsed.plan.disabledRouteSourceCreationPlan.routeRegisteredInThisGate === false, 'route registered')
assert(parsed.plan.disabledRouteSourceCreationPlan.routeExecutionEnabledInThisGate === false, 'route execution enabled')
assert(parsed.plan.disabledRouteSourceCreationPlan.internalOnly === true, 'internal-only missing')
assert(parsed.plan.disabledRouteSourceCreationPlan.disabledByDefault === true, 'disabled default missing')
assert(parsed.plan.disabledRouteSourceCreationPlan.stdoutJsonOnly === true, 'stdout JSON missing')
assert(parsed.plan.disabledRouteSourceCreationPlan.noPersistence === true, 'no persistence missing')
assert(parsed.plan.disabledRouteSourceCreationPlan.rejectUnsafeEnvelopes === true, 'unsafe reject missing')
assert(parsed.plan.disabledRouteSourceCreationPlan.staticOnlyRuntimeFlagsRequiredFalse === true, 'false flags missing')
assert(parsed.plan.disabledRouteSourceCreationPlan.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.plan.disabledRouteSourceCreationPlan.acceptedWorkerCount === 2, 'worker count mismatch')
assert(parsed.plan.disabledRouteSourceCreationPlan.acceptedImageCount === 2, 'image count mismatch')
assert(parsed.plan.disabledRouteSourceCreationPlan.acceptedNoMediaJobTypeCount === 4, 'job type count mismatch')
assert(parsed.plan.existingRouteReconciliation.samePurposeAsProposedNoMediaAgentRoute === false, 'existing route duplicate risk')
assert(parsed.plan.existingRouteReconciliation.duplicateSourceCreationRecommended === false, 'duplicate source recommended')
assertNoop(parsed.plan.supabaseClassification, 'plan.supabaseClassification')
assert(parsed.plan.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.paths.proposedFutureRoute.httpPath === proposedRoutePath, 'path register route mismatch')
assert(parsed.paths.proposedFutureRoute.sourceFile === proposedSourceFile, 'path register source mismatch')
assert(parsed.paths.proposedFutureRoute.publicApi === false, 'public API widened')
assert(parsed.paths.proposedFutureRoute.internalProductRoute === true, 'internal product route missing')
assert(parsed.paths.proposedFutureRoute.createdNow === false, 'route created now')
assert(parsed.paths.proposedFutureRoute.registeredNow === false, 'route registered now')
assert(parsed.paths.proposedFutureRoute.executableNow === false, 'route executable now')
assert(parsed.paths.adjacentExistingRoutes.length === 3, 'adjacent route count mismatch')
for (const route of parsed.paths.adjacentExistingRoutes) {
  assert(route.samePurpose === false, `adjacent same-purpose route: ${route.file}`)
  assert(route.reuseWithoutOwnerReview === false, `adjacent route reuse widened: ${route.file}`)
}
assert(parsed.paths.duplicatePolicy.mustAvoidSecondSamePurposeRoute === true, 'duplicate policy missing')
assert(parsed.paths.duplicatePolicy.mustNotRetargetExistingWorkerJobRouteWithoutOwnerReview === true, 'retarget policy missing')

assert(parsed.contract.decision === decision, 'contract decision mismatch')
assertList(parsed.contract.acceptedTools, expectedTools, 'accepted tools')
assertList(parsed.contract.acceptedWorkers, expectedWorkers, 'accepted workers')
assertList(parsed.contract.acceptedImages, expectedImages, 'accepted images')
assertList(parsed.contract.acceptedNoMediaJobTypes, expectedJobTypes, 'accepted job types')
for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey']) {
  assert(parsed.contract.futureRequestEnvelope.requiredFields.includes(field), `missing required field ${field}`)
}
for (const field of ['rawPrompt', 'agentSecret', 'mediaFilePath', 'signedUrl', 'publicArtifactUrl']) {
  assert(parsed.contract.futureRequestEnvelope.forbiddenFields.includes(field), `missing forbidden field ${field}`)
}
assert(parsed.contract.futureRequestEnvelope.runtimeFlagsRequiredFalse.length === 11, 'runtime false flag count mismatch')
assert(parsed.contract.futureResultEnvelope.stdoutJsonOnly === true, 'stdout-only result missing')
assertAllFalse(
  {
    persistsResult: parsed.contract.futureResultEnvelope.persistsResult,
    writesArtifact: parsed.contract.futureResultEnvelope.writesArtifact,
    opensMedia: parsed.contract.futureResultEnvelope.opensMedia,
    dispatchesWorker: parsed.contract.futureResultEnvelope.dispatchesWorker,
    executesRoute: parsed.contract.futureResultEnvelope.executesRoute,
    callsProviderOrModel: parsed.contract.futureResultEnvelope.callsProviderOrModel,
    mutatesSupabase: parsed.contract.futureResultEnvelope.mutatesSupabase,
  },
  'contract.futureResultEnvelope',
)

assert(parsed.disabled.decision === decision, 'disabled decision mismatch')
for (const value of Object.values(parsed.disabled.requiredEnvironmentDefaults)) assert(value === '0', 'environment default must be 0')
assert(parsed.disabled.disabledSourceRules.mustReturnBlockedResponseWhenDisabled === true, 'blocked response rule missing')
assert(parsed.disabled.disabledSourceRules.mustRequireOwnerGateBeforeEnablement === true, 'owner gate missing')
assert(parsed.disabled.disabledSourceRules.mustKeepNoMediaBoundary === true, 'no-media boundary missing')
assertAllFalse(parsed.disabled.currentGateState, 'disabled.currentGateState')

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
assert(parsed.failClosed.futureUnsafeEnvelopeCases.length === 15, 'unsafe envelope case count mismatch')
assert(parsed.failClosed.requiredFailureBehavior.returnStructuredJson === true, 'structured JSON failure missing')
assert(parsed.failClosed.requiredFailureBehavior.explainBlockedReason === true, 'blocked reason missing')
for (const [key, value] of Object.entries(parsed.failClosed.requiredFailureBehavior)) {
  if (key === 'returnStructuredJson' || key === 'explainBlockedReason') continue
  assert(value === false, `failure behavior ${key} must be false`)
}
assertAllFalse(parsed.failClosed.currentGateObservedSideEffects, 'failClosed.currentGateObservedSideEffects')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.blockingIssuesForThisGate.length === 0, 'unexpected blocker')
assert(parsed.blockers.inheritedBlockers.length === 3, 'inherited blocker count mismatch')
assert(parsed.blockers.nextAllowedPrompt === nextPrompt, 'blocker next prompt mismatch')
assert(parsed.blockers.fixPromptRequired === false, 'fix prompt required unexpectedly')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.disabledRouteSourceCreationPlanCreated === true, 'allowed plan claim missing')
assert(parsed.policy.allowedClaims.ownerReviewMayProceed === true, 'owner review claim missing')
assert(parsed.policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'policy tool count mismatch')
assert(parsed.policy.allowedClaims.acceptedNoMediaJobTypeCount === 4, 'policy job type mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const sourceReview = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-review',
)
assert(sourceReview.decision === sourceDecision, 'source review decision mismatch')
assert(sourceReview.reviewResult.disabledRouteSourceCreationPlanMayProceed === true, 'source did not permit next planning')
assert(sourceReview.reviewResult.actualRouteSourceCreatedToday === false, 'source actual route widened')
assert(sourceReview.reviewResult.routeExecutionApprovedToday === false, 'source route execution widened')
assert(sourceReview.reviewResult.workerDispatchApprovedToday === false, 'source dispatch widened')

const productRoutePlan = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-plan',
)
assert(productRoutePlan.decision === productRouteDecision, 'product route plan decision mismatch')
assert(productRoutePlan.productRoutePlan.actualRouteCreated === false, 'product route source widened')
assert(productRoutePlan.productRoutePlan.routeExecutionEnabled === false, 'product route execution widened')
assert(productRoutePlan.productRoutePlan.acceptedSoundCpuToolCount === 15, 'product route tool count mismatch')

const phase210 = parse(
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result',
)
assert(
  phase210.decision === 'worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete',
  'Phase210 blocker decision mismatch',
)
assert(phase210.intakeResult.mediaRead === false, 'Phase210 media read widened')

const workerRoute = read('server/routes/sound-cpu-worker-routes.ts')
assert(workerRoute.includes('SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false'), 'worker route execution flag not false')
assert(workerRoute.includes("router.post('/v1/sound-cpu/jobs'"), 'worker job route missing')
assert(!workerRoute.includes('/api/internal/workers/sound-cpu/no-media-agent-call'), 'worker route already uses proposed no-media path')

const disabledDispatch = read('server/workers/sound-cpu/disabled-dispatch-route.ts')
assert(disabledDispatch.includes('noWorkerExecution: true'), 'disabled dispatch worker block missing')
assert(disabledDispatch.includes('noRouteExecution: true'), 'disabled dispatch route block missing')

const ownerReview = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-product-route-owner-review:diagnostics',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(ownerReview.status === 0, `product route owner-review diagnostics failed: ${ownerReview.stderr}`)
assert(ownerReview.stdout.includes(sourceDecision), 'owner review source decision missing')

const prompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-owner-review.md',
)
assert(prompt.includes(decision), 'owner review prompt source decision missing')
assert(prompt.includes('Do not create route source files'), 'owner review prompt forbidden source creation missing')
assert(
  prompt.includes(
    'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_owner_review_passed_with_warnings_ready_for_actual_disabled_route_source_creation',
  ),
  'owner review prompt pass decision missing',
)

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-creation-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2356,
      sourceMergeCommit: parsed.plan.sourceVerification.sourceMergeCommit,
      acceptedSoundCpuToolCount: 15,
      acceptedNoMediaJobTypeCount: 4,
      proposedInternalRoutePath: proposedRoutePath,
      proposedFutureSourceFile: proposedSourceFile,
      sourceCreatedInThisGate: false,
      routeRegisteredInThisGate: false,
      routeExecutionEnabledInThisGate: false,
      duplicateSourceCreationRecommended: false,
      realUserMediaReady: false,
      supabaseUpdateRequired: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
