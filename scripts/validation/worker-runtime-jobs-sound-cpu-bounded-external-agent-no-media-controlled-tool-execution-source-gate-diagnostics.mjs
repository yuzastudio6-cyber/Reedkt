import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_source_gate_completed_with_warnings_ready_for_controlled_tool_execution_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_unlock_plan_completed_with_warnings_ready_for_controlled_tool_execution_source_gate'
const sourceMergeCommit = '42ce1217fb81f1d0ebbb757a98b3be1739427f62'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-CONTROLLED-TOOL-EXECUTION-PROOF'

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
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-gate.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-gate',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-contract-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-contract-register',
  },
  operations: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-tool-operation-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-tool-operation-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-safety-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-safety-policy',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-blocker-follow-up-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-blocker-follow-up-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runtime-claim-policy',
  },
}

const runnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner.py'
const promptPath =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof.md'
const sourcePromptPath =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-gate.md'
const sourcePlanPath =
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-plan.md'

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

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'toolExecutionReady',
    'externalAgentExecutionReady',
    'workerExecutionReady',
    'routeExecutionReady',
    'mediaProcessingReady',
    'externalBetaReady',
    'paidProductionReady',
    'generated_local_fixture_passed',
    'dry_run_passed',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

for (const value of Object.values(files)) {
  read(value.path)
  assertNoForbiddenTrueClaims(value.path)
}
read(runnerPath)
read(promptPath)
read(sourcePromptPath)
read(sourcePlanPath)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)
const runnerText = read(runnerPath)
const promptText = read(promptPath)
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-gate:diagnostics'

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.unlockPlanPr === 2373, 'source PR mismatch')
assert(parsed.result.sourceVerification.unlockPlanMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.result.sourceVerification.unlockPlanDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.sourceGateResult.controlledToolExecutionRunnerAdded === true, 'runner not added')
assert(parsed.result.sourceGateResult.acceptedToolCount === 15, 'tool count mismatch')
assert(parsed.result.sourceGateResult.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(parsed.result.sourceGateResult.aliasCoveredToolCount === 2, 'alias count mismatch')
assert(parsed.result.sourceGateResult.syntheticNoMediaOnly === true, 'synthetic boundary missing')
assert(parsed.result.sourceGateResult.realMediaAccepted === false, 'real media widened')
assert(parsed.result.sourceGateResult.executionProofRunInThisGate === false, 'proof must not run in source gate')
assert(parsed.result.sourceGateResult.agentExecutionReadyToday === false, 'agent readiness claimed too early')
assert(parsed.result.sourceGateResult.toolExecutionReadyToday === false, 'tool readiness claimed too early')
assert(parsed.result.sourceGateResult.proofMayProceedNext === true, 'next proof not allowed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')
assert(parsed.result.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.contract.decision === decision, 'contract decision mismatch')
assert(parsed.contract.acceptedWorkers.length === 2, 'worker count mismatch')
assert(parsed.contract.acceptedImages.length === 2, 'image count mismatch')
assert(parsed.contract.acceptedJobTypes.length === 4, 'job type count mismatch')
assert(parsed.contract.requiredEnvelopeFields.includes('toolId'), 'explicit toolId requirement missing')
assert(parsed.contract.acceptedForExecutionInThisGate === false, 'source gate must not execute')
assert(parsed.contract.acceptedForControlledProofNext === true, 'next proof not accepted')

assert(parsed.operations.decision === decision, 'operations decision mismatch')
assert(parsed.operations.tools.length === expectedTools.length, 'operation tool count mismatch')
const operationIds = parsed.operations.tools.map((tool) => tool.toolId)
for (const tool of expectedTools) assert(operationIds.includes(tool), `operation register missing ${tool}`)
assert(parsed.operations.proofRequirement.mustAttemptAll15Tools === true, 'proof must attempt all 15')
assert(parsed.operations.proofRequirement.mustNotUseRealMedia === true, 'proof real media block missing')
assert(parsed.operations.proofRequirement.mustNotWriteArtifacts === true, 'proof artifact block missing')

assert(parsed.safety.decision === decision, 'safety decision mismatch')
assert(parsed.safety.allowedInNextProof.syntheticInMemoryNumericArrays === true, 'synthetic arrays not allowed')
for (const [key, value] of Object.entries(parsed.safety.blocked)) {
  assert(value === false, `safety.blocked.${key} must be false`)
}
assert(parsed.safety.stopInsteadOfForce === true, 'stop instead of force missing')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(
  parsed.blockers.resolvedInThisGate.some((item) => item.blocker === 'controlled_tool_execution_source_gate_required'),
  'source gate blocker not resolved',
)
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'controlled_tool_execution_proof_required'),
  'proof blocker missing',
)
assert(
  parsed.blockers.remainingBlockers.some((item) => item.blocker === 'external_agent_execution_readiness_unproved'),
  'agent readiness blocker missing',
)

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.claimsAllowedNow.sourceGateAdded === true, 'source claim missing')
assert(parsed.claims.claimsAllowedNow.controlledProofMayProceedNext === true, 'next proof claim missing')
for (const [key, value] of Object.entries(parsed.claims.claimsNotAllowedNow)) {
  assert(value === false, `claimsNotAllowedNow.${key} must be false`)
}

for (const tool of expectedTools) assert(runnerText.includes(`"toolId": "${tool}"`) || runnerText.includes(`"${tool}"`), `runner missing ${tool}`)
for (const phrase of [
  'os.system',
  'Popen',
  'shell=True',
  'docker build',
  'docker run',
  'ffmpeg',
  'ffprobe',
  'audio_open(',
  'createClient(',
  'supabase.from(',
  'supabase.rpc(',
  'signedUrlCreated: true',
]) {
  assert(!runnerText.includes(phrase), `runner contains forbidden phrase: ${phrase}`)
}
assert(runnerText.includes('def op_librosa'), 'runner missing librosa operation')
assert(runnerText.includes('def op_pydub_effects'), 'runner missing pydub alias operation')
assert(runnerText.includes('def op_ebu_r128_pyloudnorm'), 'runner missing pyloudnorm alias operation')
assert(runnerText.includes('"readsRealMedia": False'), 'runner contract must keep readsRealMedia false')
assert(runnerText.includes('"writesArtifacts": False'), 'runner contract must keep writesArtifacts false')

assert(promptText.includes(nextPrompt), 'proof prompt heading mismatch')
assert(promptText.includes('Execute/import all 15 accepted tool IDs'), 'proof prompt must require all 15 tools')
assert(promptText.includes('Stop instead of forcing'), 'proof prompt must stop instead of force')
assert(promptText.includes('Do not use real user media'), 'proof prompt must block real media')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-gate-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  sourceMergeCommit,
  acceptedToolCount: expectedTools.length,
  directPinnedPackageCount: 13,
  aliasCoveredToolCount: 2,
  proofMayProceedNext: true,
  toolExecutionReadyToday: false,
  nextPrompt,
}, null, 2))
