import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_controlled_proof_passed_with_warnings_ready_for_route_to_tool_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_source_gate_completed_with_warnings_ready_for_controlled_route_to_tool_proof'
const sourceMergeCommit = '20c167d2e4d96125a432c75f00af36d99eda9e83'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ROUTE-TO-TOOL-PROOF-OWNER-REVIEW'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-result',
  },
  tools: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-tool-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-tool-register',
  },
  hydration: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-hydration-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-hydration-register',
  },
  sideEffects: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-side-effect-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-side-effect-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-runtime-claim-policy',
  },
}

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

for (const file of Object.values(files)) read(file.path)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, parse(file.path, file.label)]),
)
const sourceGate = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-result.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-result',
)
const runnerText = read('scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-runner.ts')
const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review.md')
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof:diagnostics'

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceGatePr === 2388, 'source gate PR mismatch')
assert(parsed.result.sourceVerification.sourceGateMergeCommit === sourceMergeCommit, 'source gate merge mismatch')
assert(parsed.result.sourceVerification.sourceGateDecision === sourceDecision, 'source gate decision mismatch')
assert(parsed.result.proofResult.localHttpPostAttempted === true, 'localhost HTTP proof missing')
assert(parsed.result.proofResult.localHostOnly === true, 'proof must be localhost only')
assert(parsed.result.proofResult.routeToToolEnvGateEnabledForProof === true, 'env gate not enabled for proof')
assert(parsed.result.proofResult.attemptedToolCount === 15, 'attempted count mismatch')
assert(parsed.result.proofResult.passedToolCount === 15, 'passed count mismatch')
assert(parsed.result.proofResult.failedToolCount === 0, 'failed count mismatch')
assert(parsed.result.proofResult.tempVenvRemoved === true, 'temp venv not removed')
assert(parsed.result.proofResult.boundedNoMediaRouteToToolExecutionProofPassed === true, 'proof pass missing')
assert(parsed.result.supabaseClassification.updateRequired === 'no', 'supabase update must be no')
assert(parsed.result.supabaseClassification.environmentTouched === 'no', 'supabase env must be no')
assert(parsed.result.supabaseClassification.sqlExecuted === 'no', 'sql must be no')
assert(parsed.result.supabaseClassification.migrationDeployed === 'no', 'migration must be no')
assert(parsed.result.supabaseClassification.nextAction === 'none', 'supabase next action must be none')
assert(parsed.result.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.tools.decision === decision, 'tool register decision mismatch')
assert(parsed.tools.tools.length === expectedTools.length, 'tool list length mismatch')
for (const tool of expectedTools) assert(parsed.tools.tools.includes(tool), `missing tool ${tool}`)
assert(parsed.tools.routeResults.httpStatus === 200, 'tool register HTTP status mismatch')
assert(parsed.tools.routeResults.acceptedForExecution === true, 'acceptedForExecution missing')
assert(parsed.tools.routeResults.routeToToolExecutionEnabled === true, 'route-to-tool enabled missing')
assert(parsed.tools.routeResults.runnerPassed === true, 'runner pass missing')
assert(parsed.tools.routeResults.attemptedToolCount === 15, 'tool attempted mismatch')
assert(parsed.tools.routeResults.passedToolCount === 15, 'tool passed mismatch')
assert(parsed.tools.routeResults.failedToolCount === 0, 'tool failed mismatch')

assert(parsed.hydration.decision === decision, 'hydration decision mismatch')
assert(parsed.hydration.hydration.disposableVenvUsed === true, 'venv use missing')
assert(parsed.hydration.hydration.venvInsideTrackedSource === false, 'venv must be outside tracked source')
assert(parsed.hydration.hydration.dependencyHydrationPassed === true, 'hydration not passed')
assert(parsed.hydration.hydration.tempVenvRemoved === true, 'venv not removed')
assert(parsed.hydration.hydration.packageLockChanged === false, 'package lock changed')

assert(parsed.sideEffects.decision === decision, 'side effects decision mismatch')
assert(parsed.sideEffects.sideEffects.routeToToolExecuted === true, 'route-to-tool side effect missing')
for (const [key, value] of Object.entries(parsed.sideEffects.sideEffects)) {
  if (key === 'routeToToolExecuted') continue
  assert(value === false, `sideEffects.${key} must be false`)
}

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.claimsAllowedNow.boundedNoMediaRouteToToolExecutionProofPassed === true, 'proof claim missing')
assert(parsed.claims.claimsAllowedNow.all15AcceptedToolsRouteCallableUnderControlledGate === true, 'callability claim missing')
for (const [key, value] of Object.entries(parsed.claims.claimsNotAllowedNow)) {
  assert(value === false, `claimsNotAllowedNow.${key} must be false`)
}

assert(sourceGate.decision === sourceDecision, 'source gate decision missing')
assert(runnerText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_TOOLS.entries()'), 'proof runner must iterate all tools')
assert(runnerText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_TO_TOOL_EXECUTION_ENV'), 'proof runner env gate missing')
assert(runnerText.includes('python3'), 'proof runner must use local python3 venv')
assert(!runnerText.includes('docker build'), 'proof runner must not build Docker')
assert(!runnerText.includes('docker run'), 'proof runner must not run Docker')
assert(promptText.includes(nextPrompt), 'owner-review prompt heading mismatch')
assert(promptText.includes('All 15 allowlisted tool ids returned HTTP 200'), 'owner-review prompt must mention all 15 HTTP proof')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-diagnostics.mjs',
  'package diagnostics script missing',
)
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof:proof'] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-runner.ts',
  'package proof script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  sourceMergeCommit,
  attemptedToolCount: 15,
  passedToolCount: 15,
  failedToolCount: 0,
  boundedNoMediaRouteToToolExecutionProofPassed: true,
  nextPrompt,
}, null, 2))
