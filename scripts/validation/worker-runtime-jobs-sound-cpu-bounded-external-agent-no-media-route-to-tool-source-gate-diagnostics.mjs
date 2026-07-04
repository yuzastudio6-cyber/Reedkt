import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_source_gate_completed_with_warnings_ready_for_controlled_route_to_tool_proof'
const unlockPlanDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_execution_unlock_plan_completed_with_warnings_ready_for_route_to_tool_source_gate'
const unlockPlanMergeCommit = 'b277447a959d805e7678b951e432dd1444c96b99'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ROUTE-TO-TOOL-CONTROLLED-PROOF'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-result.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-result',
  },
  diff: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-diff-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-diff-register',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-contract-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-contract-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-runtime-claim-policy',
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

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'externalAgentRouteExecutionReady',
    'workerExecutionReady',
    'realUserMediaReady',
    'mediaProcessingReady',
    'externalBetaReady',
    'paidProductionReady',
    'generated_local_fixture_passed',
    'dry_run_passed',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

for (const file of Object.values(files)) {
  read(file.path)
  assertNoForbiddenTrueClaims(file.path)
}

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, parse(file.path, file.label)]),
)
const unlockPlan = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-execution-unlock-plan.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-execution-unlock-plan',
)
const routeText = read('server/routes/sound-cpu-no-media-agent-call-routes.ts')
const runnerText = read('scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner.py')
const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof.md')
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate:diagnostics'

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.unlockPlanPr === 2386, 'unlock plan PR mismatch')
assert(parsed.result.sourceVerification.unlockPlanMergeCommit === unlockPlanMergeCommit, 'unlock plan merge mismatch')
assert(parsed.result.sourceVerification.unlockPlanDecision === unlockPlanDecision, 'unlock plan decision mismatch')
assert(parsed.result.sourceGate.routeToToolEnvGate === 'REEDITPRO_SOUND_CPU_NO_MEDIA_ROUTE_TO_TOOL_EXECUTION_ENABLED', 'env gate mismatch')
assert(parsed.result.sourceGate.defaultRouteToToolExecutionEnabled === false, 'default execution must be false')
assert(parsed.result.sourceGate.sourceGateAllowsControlledProofNext === true, 'controlled proof not allowed next')
assert(parsed.result.sourceGate.acceptedToolCount === 15, 'accepted tool count mismatch')
assert(parsed.result.supabaseClassification.updateRequired === 'no', 'supabase update must be no')
assert(parsed.result.supabaseClassification.environmentTouched === 'no', 'supabase environment must be no')
assert(parsed.result.supabaseClassification.sqlExecuted === 'no', 'sql executed must be no')
assert(parsed.result.supabaseClassification.migrationDeployed === 'no', 'migration deployed must be no')
assert(parsed.result.supabaseClassification.nextAction === 'none', 'supabase next action must be none')
assert(parsed.result.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.diff.decision === decision, 'diff decision mismatch')
assert(parsed.diff.sourceChanges.some((item) => item.path === 'server/routes/sound-cpu-no-media-agent-call-routes.ts'), 'route source diff missing')
assert(parsed.diff.sourceChanges[0].usesShell === false, 'source must not use shell')
assert(parsed.diff.sourceChanges[0].usesWorkerDispatch === false, 'source must not dispatch worker')
assert(parsed.diff.sourceChanges[0].opensMedia === false, 'source must not open media')

assert(parsed.contract.decision === decision, 'contract decision mismatch')
assert(parsed.contract.acceptedToolCount === 15, 'contract tool count mismatch')
assert(parsed.contract.routeResponseModes.envGateDisabled === '409_fail_closed', 'disabled response mismatch')
assert(parsed.contract.routeResponseModes.controlledRunnerSuccess === '200_bounded_no_media_tool_result', 'success response mismatch')
for (const [key, value] of Object.entries(parsed.contract.sideEffectClosures)) {
  assert(value === false, `sideEffectClosures.${key} must be false`)
}

assert(parsed.claims.decision === decision, 'claim decision mismatch')
assert(parsed.claims.claimsAllowedNow.boundedRouteToToolSourceExists === true, 'source claim missing')
assert(parsed.claims.claimsAllowedNow.controlledRouteToToolProofMayProceed === true, 'proof claim missing')
assert(parsed.claims.claimsAllowedNow.defaultRouteToToolExecutionEnabled === false, 'default enabled claim mismatch')
for (const [key, value] of Object.entries(parsed.claims.claimsNotAllowedNow)) {
  assert(value === false, `claimsNotAllowedNow.${key} must be false`)
}

assert(unlockPlan.decision === unlockPlanDecision, 'unlock plan source missing')
assert(routeText.includes("import { spawn } from 'node:child_process'"), 'route must use child_process spawn')
assert(routeText.includes('shell: false'), 'route runner spawn must set shell false')
assert(routeText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_TO_TOOL_EXECUTION_ENV'), 'route env gate missing')
assert(routeText.includes("env[SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_TO_TOOL_EXECUTION_ENV] === '1'"), 'route env gate check missing')
assert(routeText.includes('validateSoundCpuNoMediaAgentCallEnvelope(request.body)'), 'route must validate before runner')
assert(routeText.includes('runSoundCpuNoMediaControlledToolRunner(validation.envelope)'), 'route must call controlled runner after validation')
assert(routeText.includes('soundCpuNoMediaAgentCallDisabledRouteHandler(request, response)'), 'route must preserve fail-closed default')
assert(!routeText.includes('shell: true'), 'route must not use shell true')
assert(!routeText.includes('exec('), 'route must not use shell exec')
assert(!routeText.includes('docker build'), 'route must not build Docker')
assert(!routeText.includes('docker run'), 'route must not run Docker')
assert(!routeText.includes('ffmpeg'), 'route must not call ffmpeg')
assert(!routeText.includes('ffprobe'), 'route must not call ffprobe')
assert(runnerText.includes('subprocess.run('), 'runner proof source missing')
assert(!runnerText.includes('shell=True'), 'runner must remain shell-free')
assert(promptText.includes(nextPrompt), 'controlled proof prompt heading mismatch')
assert(promptText.includes('Do not run real user media'), 'controlled proof prompt must preserve no-media boundary')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  unlockPlanMergeCommit,
  boundedRouteToToolSourceExists: true,
  defaultRouteToToolExecutionEnabled: false,
  controlledRouteToToolProofMayProceed: true,
  nextPrompt,
}, null, 2))
