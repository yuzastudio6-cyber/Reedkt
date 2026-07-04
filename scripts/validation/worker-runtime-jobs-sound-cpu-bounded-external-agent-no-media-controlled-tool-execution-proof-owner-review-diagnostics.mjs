import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_owner_review_passed_with_warnings_ready_for_route_to_tool_execution_unlock_plan'
const proofDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_passed_with_warnings_ready_for_tool_execution_owner_review'
const proofMergeCommit = 'e5038200b408f421b769b3d35ab6151528805991'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ROUTE-TO-TOOL-EXECUTION-UNLOCK-PLAN'

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
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review-acceptance-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review-acceptance-register',
  },
  routeUnlock: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review-route-unlock-readiness-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review-route-unlock-readiness-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review-runtime-claim-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review-runtime-claim-policy',
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
const proofResult = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-result.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-result',
)
const proofTools = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-tool-result-register.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-tool-result-register',
)
const promptText = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-execution-unlock-plan.md',
)
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review:diagnostics'

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.proofPr === 2381, 'proof PR mismatch')
assert(parsed.review.sourceVerification.proofMergeCommit === proofMergeCommit, 'proof merge mismatch')
assert(parsed.review.sourceVerification.proofDecision === proofDecision, 'proof decision mismatch')
assert(parsed.review.ownerReview.acceptedForRouteToToolUnlockPlanning === true, 'route unlock planning not accepted')
assert(parsed.review.ownerReview.acceptedToolCount === 15, 'accepted tool count mismatch')
assert(parsed.review.ownerReview.controlledNoMediaPackageExecutionProofPassed === true, 'proof not accepted')
assert(parsed.review.ownerReview.externalAgentRouteExecutionReadyToday === false, 'route readiness widened')
assert(parsed.review.ownerReview.workerExecutionReadyToday === false, 'worker readiness widened')
assert(parsed.review.ownerReview.realUserMediaReadyToday === false, 'real media readiness widened')
assert(parsed.review.supabaseClassification.updateRequired === 'no', 'supabase update must be no')
assert(parsed.review.supabaseClassification.environmentTouched === 'no', 'supabase environment must be no')
assert(parsed.review.supabaseClassification.sqlExecuted === 'no', 'sql executed must be no')
assert(parsed.review.supabaseClassification.migrationDeployed === 'no', 'migration deployed must be no')
assert(parsed.review.supabaseClassification.nextAction === 'none', 'supabase next action must be none')
assert(parsed.review.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.acceptance.decision === decision, 'acceptance decision mismatch')
assert(parsed.acceptance.acceptedEvidence.attemptedToolCount === 15, 'attempted count mismatch')
assert(parsed.acceptance.acceptedEvidence.passedToolCount === 15, 'passed count mismatch')
assert(parsed.acceptance.acceptedEvidence.failedToolCount === 0, 'failed count mismatch')
for (const tool of expectedTools) {
  assert(parsed.acceptance.acceptedEvidence.toolIds.includes(tool), `acceptance missing ${tool}`)
  const record = proofTools.tools.find((item) => item.toolId === tool)
  assert(record?.passed === true, `proof tool not passed: ${tool}`)
}
assert(parsed.acceptance.acceptedForToday.routeToToolUnlockPlanning === true, 'route unlock planning not accepted today')
for (const [key, value] of Object.entries(parsed.acceptance.notAcceptedForToday)) {
  assert(value === false, `notAcceptedForToday.${key} must be false`)
}

assert(parsed.routeUnlock.decision === decision, 'route unlock decision mismatch')
assert(parsed.routeUnlock.routePath === '/api/internal/workers/sound-cpu/no-media-agent-call', 'route path mismatch')
assert(parsed.routeUnlock.currentRouteState.routeExecutionEnabled === false, 'route must remain disabled')
assert(parsed.routeUnlock.routeExecutionReadyToday === false, 'route execution readiness widened')
assert(parsed.routeUnlock.nextPrompt === nextPrompt, 'route next prompt mismatch')

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.claimsAllowedNow.controlledNoMediaPackageExecutionProofAccepted === true, 'proof acceptance claim missing')
assert(parsed.claims.claimsAllowedNow.routeToToolExecutionUnlockPlanMayProceed === true, 'unlock plan claim missing')
for (const [key, value] of Object.entries(parsed.claims.claimsNotAllowedNow)) {
  assert(value === false, `claimsNotAllowedNow.${key} must be false`)
}

assert(proofResult.decision === proofDecision, 'source proof result decision mismatch')
assert(proofResult.proofResult.passedToolCount === 15, 'source proof result pass count mismatch')
assert(proofResult.proofResult.failedToolCount === 0, 'source proof result fail count mismatch')

assert(promptText.includes(nextPrompt), 'route unlock prompt heading mismatch')
assert(promptText.includes('Do not enable broad worker dispatch'), 'route unlock prompt must preserve worker boundary')
assert(promptText.includes('Stop rather than force readiness'), 'route unlock prompt must include stop condition')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  proofMergeCommit,
  acceptedToolCount: 15,
  routeToToolUnlockPlanningMayProceed: true,
  externalAgentRouteExecutionReadyToday: false,
  nextPrompt,
}, null, 2))
