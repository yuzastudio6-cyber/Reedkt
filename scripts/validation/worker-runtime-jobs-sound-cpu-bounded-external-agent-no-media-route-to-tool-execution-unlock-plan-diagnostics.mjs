import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_execution_unlock_plan_completed_with_warnings_ready_for_route_to_tool_source_gate'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_owner_review_passed_with_warnings_ready_for_route_to_tool_execution_unlock_plan'
const ownerReviewMergeCommit = '4a58425e58e850892410f1cf8365503796eeecc6'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ROUTE-TO-TOOL-SOURCE-GATE'

const files = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-execution-unlock-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-execution-unlock-plan',
  },
  source: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-change-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-change-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-safety-invariant-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-safety-invariant-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-claim-policy',
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

for (const file of Object.values(files)) {
  read(file.path)
  assertNoForbiddenTrueClaims(file.path)
}

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, parse(file.path, file.label)]),
)
const ownerReview = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review',
)
const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate.md')
const routeText = read('server/routes/sound-cpu-no-media-agent-call-routes.ts')
const runnerText = read('scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner.py')
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-route-to-tool-execution-unlock-plan:diagnostics'

assert(parsed.plan.decision === decision, 'plan decision mismatch')
assert(parsed.plan.sourceVerification.ownerReviewPr === 2383, 'owner review PR mismatch')
assert(parsed.plan.sourceVerification.ownerReviewMergeCommit === ownerReviewMergeCommit, 'owner review merge mismatch')
assert(parsed.plan.sourceVerification.ownerReviewDecision === ownerReviewDecision, 'owner review decision mismatch')
assert(parsed.plan.unlockPlan.targetRoutePath === '/api/internal/workers/sound-cpu/no-media-agent-call', 'target route mismatch')
assert(parsed.plan.unlockPlan.allowedToolCount === 15, 'allowed tool count mismatch')
assert(parsed.plan.unlockPlan.routeToToolSourceGateMayProceed === true, 'source gate may proceed missing')
assert(parsed.plan.unlockPlan.externalAgentRouteExecutionReadyToday === false, 'route readiness widened')
assert(parsed.plan.unlockPlan.actualRouteSourceModifiedInThisPlan === false, 'plan must not modify route source')
assert(parsed.plan.supabaseClassification.updateRequired === 'no', 'supabase update must be no')
assert(parsed.plan.supabaseClassification.environmentTouched === 'no', 'supabase environment must be no')
assert(parsed.plan.supabaseClassification.sqlExecuted === 'no', 'sql executed must be no')
assert(parsed.plan.supabaseClassification.migrationDeployed === 'no', 'migration deployed must be no')
assert(parsed.plan.supabaseClassification.nextAction === 'none', 'supabase next action must be none')
assert(parsed.plan.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.source.decision === decision, 'source register decision mismatch')
assert(parsed.source.futureSourceChangesAllowed.length === 2, 'source change count mismatch')
assert(parsed.source.sourceChangesMadeInThisPlan.length === 0, 'source changes must be plan-only')
assert(parsed.source.routeExecutionReadyToday === false, 'source register route readiness widened')

assert(parsed.safety.decision === decision, 'safety decision mismatch')
for (const [key, value] of Object.entries(parsed.safety.invariantsRequiredForSourceGate)) {
  assert(value === true, `safety invariant ${key} must be true`)
}
assert(parsed.safety.stopConditions.includes('route cannot preserve sideEffects false'), 'stop condition missing')

assert(parsed.claims.decision === decision, 'claim decision mismatch')
assert(parsed.claims.claimsAllowedNow.routeToToolSourceGateMayProceed === true, 'source gate claim missing')
for (const [key, value] of Object.entries(parsed.claims.claimsNotAllowedNow)) {
  assert(value === false, `claimsNotAllowedNow.${key} must be false`)
}

assert(ownerReview.decision === ownerReviewDecision, 'source owner-review decision missing')
assert(routeText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED = false'), 'current route must remain disabled in plan')
assert(routeText.includes('validateSoundCpuNoMediaAgentCallEnvelope'), 'route validation source missing')
assert(runnerText.includes('subprocess.run('), 'controlled runner source missing isolated execution')
assert(!runnerText.includes('shell=True'), 'runner must remain shell-free')
assert(promptText.includes(nextPrompt), 'source-gate prompt heading mismatch')
assert(promptText.includes('Stop if the route cannot remain bounded'), 'source-gate stop condition missing')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-execution-unlock-plan-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  ownerReviewMergeCommit,
  routeToToolSourceGateMayProceed: true,
  routeExecutionReadyToday: false,
  nextPrompt,
}, null, 2))
