import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_completed_with_warnings_ready_for_surface_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_owner_review_passed_with_warnings_ready_for_bounded_execution_surface_plan'
const nextProofPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-EXECUTION-SURFACE-PROOF'

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

const files = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-plan',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-surface-contract-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-surface-contract-register',
  },
  coverage: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-tool-coverage-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-tool-coverage-register',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-fail-closed-boundary-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-fail-closed-boundary-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-runtime-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-invocation-register.md',
  'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-fail-closed-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof.md',
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

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
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
    'paidProductionReady',
    'realExternalAgentCredentialProvisioning',
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
    'generated_local_fixture_passed',
    'dry_run_passed',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

for (const value of Object.values(files)) assertNoForbiddenTrueClaims(value.path)
for (const file of sourceFiles) read(file)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

assert(parsed.plan.decision === decision, 'plan decision mismatch')
assert(parsed.plan.sourceVerification.sourcePr === 2350, 'source PR mismatch')
assert(parsed.plan.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.plan.sourceVerification.phase210Merged === true, 'phase210 merge evidence missing')
assert(parsed.plan.surfacePlan.acceptedToolCount === 15, 'surface tool count mismatch')
assert(parsed.plan.surfacePlan.acceptedWorkerCount === 2, 'surface worker count mismatch')
assert(parsed.plan.surfacePlan.acceptedImageCount === 2, 'surface image count mismatch')
assert(parsed.plan.surfacePlan.acceptedJobTypeCount === 4, 'surface job type count mismatch')
assert(parsed.plan.surfacePlan.externalAgentEnvelopeAcceptedBySource === true, 'source envelope acceptance missing')
assert(parsed.plan.surfacePlan.boundedNoMediaCallsMayProceed === true, 'bounded no-media call plan missing')
assert(parsed.plan.surfacePlan.realExternalAgentCredentialProvisioning === false, 'credential provisioning widened')
assert(parsed.plan.surfacePlan.realUserMediaAllowed === false, 'real-user media widened')
assert(parsed.plan.surfacePlan.productRouteWiringAllowed === false, 'route wiring widened')
assert(parsed.plan.surfacePlan.workerDispatchAllowed === false, 'worker dispatch widened')
assert(parsed.plan.surfacePlan.fileWritesAllowed === false, 'file write widened')
assert(parsed.plan.surfacePlan.stdoutJsonOnly === true, 'stdout JSON boundary missing')
assert(parsed.plan.surfacePlan.nextProofPrompt === nextProofPrompt, 'next proof prompt mismatch')
assertNoop(parsed.plan.supabaseClassification, 'plan.supabaseClassification')

assert(parsed.contract.decision === decision, 'contract decision mismatch')
assert(parsed.contract.surfaceContract.harnessKind === 'sound_cpu_real_external_agent_no_media_harness', 'harness kind mismatch')
assert(parsed.contract.surfaceContract.requestKind === 'sound_cpu_agent_callable_no_media_tool_call', 'request kind mismatch')
assert(parsed.contract.surfaceContract.agentOrigin === 'external_agent_no_media_harness', 'agent origin mismatch')
assert(parsed.contract.surfaceContract.writesFiles === false, 'contract writes files widened')
assert(parsed.contract.surfaceContract.readsMedia === false, 'contract media read widened')
assert(parsed.contract.surfaceContract.dispatchesWorkers === false, 'contract worker dispatch widened')
assert(parsed.contract.surfaceContract.executesRoutes === false, 'contract route execution widened')
assert(parsed.contract.surfaceContract.requiresCredentials === false, 'contract credentials widened')
assert(parsed.contract.surfaceContract.mutatesSupabase === false, 'contract Supabase widened')
assert(parsed.contract.surfaceContract.createsArtifacts === false, 'contract artifacts widened')
assert(parsed.contract.acceptedWorkers.length === 2, 'accepted worker count mismatch')
assert(parsed.contract.acceptedImages.length === 2, 'accepted image count mismatch')
assert(parsed.contract.acceptedJobTypes.length === 4, 'accepted job type count mismatch')

assert(parsed.coverage.decision === decision, 'coverage decision mismatch')
assert(parsed.coverage.acceptedToolCount === expectedTools.length, 'coverage accepted count mismatch')
assert(JSON.stringify(parsed.coverage.acceptedTools) === JSON.stringify(expectedTools), 'accepted tool list mismatch')
assert(parsed.coverage.coverageEvidence.agentCallableNoMediaAdapterAcceptedAllTools === true, 'adapter coverage missing')
assert(parsed.coverage.coverageEvidence.realExternalAgentNoMediaHarnessAcceptedAllTools === true, 'harness coverage missing')
assert(
  parsed.coverage.notCoveredToday.realUserMediaToolExecution ===
    'blocked_by_phase210_missing_explicit_private_fixture_path_and_boundaries',
  'real-user media blocker mismatch',
)

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
assert(parsed.failClosed.failClosedBoundaries.invalidAgentOriginBlocks === true, 'invalid origin boundary missing')
assert(parsed.failClosed.failClosedBoundaries.agentSecretBlocks === true, 'agent secret boundary missing')
assert(parsed.failClosed.failClosedBoundaries.mediaPathBlocks === true, 'media path boundary missing')
assert(parsed.failClosed.failClosedBoundaries.trueRuntimeFlagBlocks === true, 'runtime flag boundary missing')
assert(parsed.failClosed.failClosedBoundaries.unknownToolBlocks === true, 'unknown tool boundary missing')
assert(parsed.failClosed.runtimeFlagPolicy.allRuntimeFlagsMustRemainFalse === true, 'runtime flag policy missing')
assert(parsed.failClosed.runtimeFlagPolicy.allowRealUserMedia === false, 'real media flag widened')
assert(parsed.failClosed.runtimeFlagPolicy.allowWorkerDispatch === false, 'worker flag widened')
assert(parsed.failClosed.runtimeFlagPolicy.allowRouteExecution === false, 'route flag widened')

assert(parsed.claims.decision === decision, 'claim policy decision mismatch')
assert(parsed.claims.allowedClaims.boundedExternalAgentNoMediaSurfacePlanned === true, 'allowed surface claim missing')
assert(parsed.claims.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(parsed.claims.allowedClaims.surfaceProofMayProceed === true, 'surface proof claim missing')
assertFalseMap(parsed.claims.blockedClaims, 'claims.blockedClaims')
assertFalseMap(parsed.claims.runtimeActions, 'claims.runtimeActions')

const ownerReview = parse(
  'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-review.md',
  'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-review',
)
assert(ownerReview.decision === sourceDecision, 'owner review source decision mismatch')
assert(ownerReview.reviewResult.validExternalAgentNoMediaEnvelopeAccepted === true, 'owner review accepted envelope mismatch')
assert(ownerReview.reviewResult.acceptedToolCount === 15, 'owner review tool count mismatch')
assert(ownerReview.reviewResult.boundedExecutionSurfacePlanMayProceed === true, 'owner review handoff missing')

const proof = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-real-external-agent-no-media-harness-proof:proof',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(proof.status === 0, `real external-agent no-media harness proof failed: ${proof.stderr}`)
const proofJson = JSON.parse(proof.stdout.slice(proof.stdout.indexOf('{')))
assert(proofJson.status === 'passed', 'proof status mismatch')
assert(proofJson.validExternalAgentNoMediaEnvelopeAccepted === true, 'proof envelope acceptance mismatch')
assert(proofJson.acceptedToolCount === 15, 'proof accepted tool count mismatch')
assert(proofJson.blockedCaseCount === 4, 'proof blocked case count mismatch')
assertFalseMap(proofJson.sideEffects, 'proof.sideEffects')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof.md')
assert(prompt.includes(decision), 'next proof prompt source decision missing')
assert(prompt.includes('No real external-agent credential provisioning'), 'next proof prompt forbidden scope missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-execution-surface-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2350,
      acceptedSoundCpuToolCount: 15,
      validExternalAgentNoMediaEnvelopeAccepted: true,
      boundedNoMediaCallsMayProceed: true,
      nextPrompt: nextProofPrompt,
      realUserMediaAllowed: false,
      workerDispatchAllowed: false,
      routeExecutionAllowed: false,
      supabaseUpdateRequired: false,
    },
    null,
    2,
  ),
)
