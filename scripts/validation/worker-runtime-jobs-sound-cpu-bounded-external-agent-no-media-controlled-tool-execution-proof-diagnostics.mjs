import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_passed_with_warnings_ready_for_tool_execution_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_source_gate_completed_with_warnings_ready_for_controlled_tool_execution_proof'
const sourceMergeCommit = '6bc63d1383468d3bfaea2821f302b65664fe45a5'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-CONTROLLED-TOOL-EXECUTION-PROOF-OWNER-REVIEW'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-result',
  },
  tools: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-tool-result-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-tool-result-register',
  },
  hydration: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-hydration-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-hydration-register',
  },
  sideEffects: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-no-side-effect-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-no-side-effect-register',
  },
  runnerFix: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-runner-fix-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-runner-fix-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-runtime-claim-policy',
  },
}

const runnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner.py'
const promptPath =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review.md'

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
    'externalAgentRouteExecutionReady',
    'workerExecutionReady',
    'routeExecutionReady',
    'realUserMediaReady',
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

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)
const runnerText = read(runnerPath)
const promptText = read(promptPath)
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof:diagnostics'

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceGatePr === 2375, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceGateMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceGateDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.proofResult.dependencyHydrationPassed === true, 'dependency hydration not passed')
assert(parsed.result.proofResult.attemptedToolCount === 15, 'attempted tool count mismatch')
assert(parsed.result.proofResult.passedToolCount === 15, 'passed tool count mismatch')
assert(parsed.result.proofResult.failedToolCount === 0, 'failed tool count mismatch')
assert(parsed.result.proofResult.toolTimeoutSeconds === 180, 'timeout mismatch')
assert(parsed.result.proofResult.tempVenvRemoved === true, 'temp venv not removed')
assert(parsed.result.proofResult.controlledNoMediaToolExecutionProofPassed === true, 'proof pass missing')
assert(parsed.result.proofResult.externalAgentRouteExecutionReadyToday === false, 'route readiness widened')
assert(parsed.result.proofResult.workerExecutionReadyToday === false, 'worker readiness widened')
assert(parsed.result.proofResult.realUserMediaReadyToday === false, 'real media readiness widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')
assert(parsed.result.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.tools.decision === decision, 'tool register decision mismatch')
assert(parsed.tools.tools.length === expectedTools.length, 'tool register count mismatch')
for (const tool of expectedTools) {
  const record = parsed.tools.tools.find((item) => item.toolId === tool)
  assert(record, `missing tool ${tool}`)
  assert(record.passed === true, `${tool} did not pass`)
}
assert(parsed.tools.coverage.attemptedToolCount === 15, 'coverage attempted mismatch')
assert(parsed.tools.coverage.passedToolCount === 15, 'coverage passed mismatch')
assert(parsed.tools.coverage.failedToolCount === 0, 'coverage failed mismatch')

assert(parsed.hydration.decision === decision, 'hydration decision mismatch')
assert(parsed.hydration.dependencyHydrationPassed === true, 'hydration not passed')
assert(parsed.hydration.finalHydrationAttempt.noCompileInstallPassed === true, 'no compile install not passed')
assert(parsed.hydration.finalHydrationAttempt.proofRunnerPassed === true, 'proof runner not passed')
assert(parsed.hydration.finalHydrationAttempt.tempVenvRemoved === true, 'final temp venv not removed')
assert(parsed.hydration.packageLockChanged === false, 'package lock changed')
assert(parsed.hydration.nodeModulesStaged === false, 'node_modules staged')

assert(parsed.sideEffects.decision === decision, 'side effects decision mismatch')
for (const [key, value] of Object.entries(parsed.sideEffects.sideEffects)) {
  assert(value === false, `sideEffects.${key} must be false`)
}

assert(parsed.runnerFix.decision === decision, 'runner fix decision mismatch')
assert(
  parsed.runnerFix.runnerFixesApplied.some((item) => item.fix === 'isolate_each_tool_in_same_interpreter_child_process_with_timeout'),
  'isolated runner fix missing',
)
assert(
  parsed.runnerFix.runnerFixesApplied.some((item) => item.fix === 'increase_pyloudnorm_synthetic_audio_to_one_second'),
  'pyloudnorm fix missing',
)

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.claimsAllowedNow.controlledNoMediaToolExecutionProofPassed === true, 'proof claim missing')
assert(parsed.claims.claimsAllowedNow.all15AcceptedToolsExecutedOnSyntheticInputs === true, 'all 15 claim missing')
for (const [key, value] of Object.entries(parsed.claims.claimsNotAllowedNow)) {
  assert(value === false, `claimsNotAllowedNow.${key} must be false`)
}

for (const tool of expectedTools) assert(runnerText.includes(`"${tool}"`), `runner missing ${tool}`)
assert(runnerText.includes('subprocess.run('), 'runner must isolate each tool with subprocess.run')
assert(!runnerText.includes('shell=True'), 'runner must not invoke a shell')
assert(!runnerText.includes('os.system'), 'runner must not use os.system')
assert(!runnerText.includes('Popen'), 'runner must not use raw Popen')
assert(!runnerText.includes('docker build'), 'runner must not build Docker')
assert(!runnerText.includes('docker run'), 'runner must not run Docker')
assert(!runnerText.includes('ffmpeg'), 'runner must not call ffmpeg')
assert(!runnerText.includes('ffprobe'), 'runner must not call ffprobe')
assert(runnerText.includes('numpy.zeros(48000'), 'pyloudnorm one-second synthetic silence missing')

assert(promptText.includes(nextPrompt), 'owner-review prompt heading mismatch')
assert(promptText.includes('All 15 accepted tools passed'), 'owner-review prompt must mention all 15 pass')
assert(promptText.includes('Do not enable route execution'), 'owner-review prompt must keep route execution blocked')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  sourceMergeCommit,
  attemptedToolCount: 15,
  passedToolCount: 15,
  failedToolCount: 0,
  controlledNoMediaToolExecutionProofPassed: true,
  externalAgentRouteExecutionReadyToday: false,
  nextPrompt,
}, null, 2))
