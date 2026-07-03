import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_unlock_plan_completed_with_warnings_ready_for_controlled_tool_execution_source_gate'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_call_proof_owner_review_passed_with_warnings_ready_for_controlled_tool_execution_unlock_plan'
const sourceMergeCommit = '975503b1a6974811893841bb651c7d01c3f2b601'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-CONTROLLED-TOOL-EXECUTION-SOURCE-GATE'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-plan',
  },
  surface: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-surface-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-surface-register',
  },
  operations: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-operation-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-operation-plan',
  },
  closed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-closed-scope-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-closed-scope-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-blocker-register',
  },
}

const requiredSourceEvidence = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-call-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-bounded-execution-surface-readiness-register.md',
  'scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof-runner.mjs',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-gate.md',
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

function assertListContainsAll(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`)
  for (const item of expected) assert(actual.includes(item), `${label} missing ${item}`)
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'toolExecutionReady',
    'externalAgentExecutionReady',
    'workerExecutionReady',
    'mediaProcessingReady',
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
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-plan:diagnostics'
const promptText = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-gate.md',
)
const adapterText = read('scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs')

assert(parsed.plan.decision === decision, 'plan decision mismatch')
assert(parsed.plan.sourceVerification.disabledRouteCallProofOwnerReviewPr === 2372, 'source PR mismatch')
assert(parsed.plan.sourceVerification.disabledRouteCallProofOwnerReviewMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.plan.sourceVerification.disabledRouteCallProofOwnerReviewDecision === sourceDecision, 'source decision mismatch')
assert(parsed.plan.sourceVerification.realExternalAgentNoMediaHarnessOwnerReviewPr === 2349, 'harness owner source mismatch')
assert(parsed.plan.planResult.registeredDisabledRouteProofAccepted === true, 'route proof not accepted')
assert(parsed.plan.planResult.externalAgentNoMediaHarnessAccepted === true, 'harness not accepted')
assert(parsed.plan.planResult.acceptedToolCount === 15, 'tool count mismatch')
assert(parsed.plan.planResult.explicitToolIdRequired === true, 'toolId requirement missing')
assert(parsed.plan.planResult.sourceGateMayProceed === true, 'source gate not allowed')
assert(parsed.plan.planResult.toolExecutionApprovedToday === false, 'tool execution approved too early')
assert(parsed.plan.planResult.externalAgentExecutionReadyToday === false, 'external agent ready too early')
assertNoop(parsed.plan.supabaseClassification, 'plan.supabaseClassification')
assert(parsed.plan.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.surface.decision === decision, 'surface decision mismatch')
assert(parsed.surface.acceptedSurfaceForSourceGate.routePath === '/api/internal/workers/sound-cpu/no-media-agent-call', 'route path mismatch')
assert(parsed.surface.acceptedSurfaceForSourceGate.requiresExplicitToolId === true, 'explicit tool requirement missing')
assert(parsed.surface.acceptedSurfaceForSourceGate.requiresNoRealCredentials === true, 'credential block missing')
assert(parsed.surface.acceptedSurfaceForSourceGate.requiresNoRealUserMedia === true, 'real media block missing')
assertListContainsAll(parsed.surface.acceptedTools, expectedTools, 'surface.acceptedTools')
assert(parsed.surface.acceptedNoMediaJobTypes.length === 4, 'job type count mismatch')

assert(parsed.operations.decision === decision, 'operations decision mismatch')
assert(parsed.operations.plannedOperationsForSourceGate.length === 4, 'operation count mismatch')
assert(
  parsed.operations.plannedOperationsForSourceGate.every((operation) => operation.writesArtifacts === false),
  'operations must not write artifacts',
)
assert(parsed.operations.sourceGateRequirement.mustKeepRouteFailClosedUntilProof === true, 'fail closed requirement missing')
assert(parsed.operations.sourceGateRequirement.mustAddProofRunnerBeforeClaimingExecutionReady === true, 'proof runner requirement missing')
assert(parsed.operations.sourceGateRequirement.mustProveAll15ToolsOrRecordExactPartialCoverage === true, 'coverage requirement missing')

assert(parsed.closed.decision === decision, 'closed decision mismatch')
for (const [key, value] of Object.entries(parsed.closed.closedScopes)) {
  assert(value === false, `closedScopes.${key} must be false`)
}
assert(parsed.closed.readinessClaims.toolExecutionReadiness === 'blocked_until_source_and_proof', 'tool readiness mismatch')
assert(parsed.closed.readinessClaims.externalAgentExecutionReadiness === 'blocked_until_source_and_proof', 'agent readiness mismatch')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.resolvedInThisGate.length === 1, 'resolved blocker count mismatch')
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_tool_execution_source_gate_required'),
  'source gate blocker missing',
)
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_tool_execution_proof_required'),
  'proof blocker missing',
)

for (const tool of expectedTools) assert(adapterText.includes(`'${tool}'`), `adapter missing ${tool}`)
assert(adapterText.includes('invokeSoundCpuAgentCallableNoMediaToolCall'), 'adapter invoke missing')
assert(adapterText.includes('createSelfTestRequests'), 'adapter self-test missing')

assert(promptText.includes(nextPrompt), 'next prompt heading missing')
assert(promptText.includes('Create the bounded source path'), 'next prompt must request source path')
assert(promptText.includes('Do not claim readiness'), 'next prompt must preserve no readiness claim')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-plan-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  sourceMergeCommit,
  acceptedToolCount: 15,
  sourceGateMayProceed: true,
  toolExecutionReady: false,
  nextPrompt,
}, null, 2))
