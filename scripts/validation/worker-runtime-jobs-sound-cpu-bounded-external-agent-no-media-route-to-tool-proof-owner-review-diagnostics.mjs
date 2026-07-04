import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_proof_owner_review_passed_with_warnings_ready_for_agent_callable_execution_readiness'
const proofDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_controlled_proof_passed_with_warnings_ready_for_route_to_tool_owner_review'
const proofMergeCommit = 'e1569aa66dd0d3971d746cf8c3f5356364e9abc3'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-AGENT-CALLABLE-EXECUTION-READINESS'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review-acceptance-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review-acceptance-register',
  },
  boundary: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review-boundary-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review-boundary-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review-runtime-claim-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review-runtime-claim-policy',
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
    'workerExecutionReady',
    'realUserMediaReady',
    'mediaProcessingReady',
    'externalBetaReadyForRealUserMedia',
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
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-result.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-result',
)
const proofTools = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-tool-register.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-tool-register',
)
const routeText = read('server/routes/sound-cpu-no-media-agent-call-routes.ts')
const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-execution-readiness.md')
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review:diagnostics'

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.controlledProofPr === 2391, 'proof PR mismatch')
assert(parsed.review.sourceVerification.controlledProofMergeCommit === proofMergeCommit, 'proof merge mismatch')
assert(parsed.review.sourceVerification.controlledProofDecision === proofDecision, 'proof decision mismatch')
assert(parsed.review.ownerReview.acceptedForAgentCallableReadiness === true, 'agent-callable readiness not accepted')
assert(parsed.review.ownerReview.all15AcceptedToolsRouteCallableUnderControlledGate === true, 'all 15 route-callable acceptance missing')
assert(parsed.review.ownerReview.acceptedToolCount === 15, 'accepted tool count mismatch')
assert(parsed.review.ownerReview.workerDispatchReadyToday === false, 'worker dispatch widened')
assert(parsed.review.ownerReview.realUserMediaReadyToday === false, 'real media widened')
assert(parsed.review.ownerReview.paidProductionReadyToday === false, 'production widened')
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
assert(parsed.acceptance.acceptedEvidence.httpStatusForEveryTool === 200, 'HTTP 200 acceptance missing')
assert(parsed.acceptance.acceptedEvidence.acceptedForExecutionForEveryTool === true, 'acceptedForExecution acceptance missing')
assert(parsed.acceptance.acceptedEvidence.runnerPassedForEveryTool === true, 'runner pass acceptance missing')
for (const tool of expectedTools) assert(parsed.acceptance.acceptedTools.includes(tool), `missing accepted tool ${tool}`)

assert(parsed.boundary.decision === decision, 'boundary decision mismatch')
for (const [key, value] of Object.entries(parsed.boundary.acceptedBoundary)) {
  assert(value === true, `acceptedBoundary.${key} must be true`)
}
for (const [key, value] of Object.entries(parsed.boundary.notAcceptedBoundary)) {
  assert(value === false, `notAcceptedBoundary.${key} must be false`)
}

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.claimsAllowedNow.agentCallableNoMediaReadinessMayProceed === true, 'readiness may proceed missing')
assert(parsed.claims.claimsAllowedNow.all15AcceptedToolsRouteCallableUnderControlledGate === true, 'route-callable claim missing')
for (const [key, value] of Object.entries(parsed.claims.claimsNotAllowedNow)) {
  assert(value === false, `claimsNotAllowedNow.${key} must be false`)
}

assert(proofResult.decision === proofDecision, 'source proof decision mismatch')
assert(proofResult.proofResult.attemptedToolCount === 15, 'source proof attempted mismatch')
assert(proofResult.proofResult.passedToolCount === 15, 'source proof passed mismatch')
assert(proofResult.proofResult.failedToolCount === 0, 'source proof failed mismatch')
assert(proofTools.routeResults.acceptedForExecution === true, 'source proof acceptedForExecution missing')
for (const tool of expectedTools) assert(proofTools.tools.includes(tool), `source proof missing ${tool}`)

assert(routeText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_TO_TOOL_EXECUTION_ENV'), 'route env gate missing')
assert(routeText.includes('runSoundCpuNoMediaControlledToolRunner(validation.envelope)'), 'route runner call missing')
assert(promptText.includes(nextPrompt), 'next prompt heading mismatch')
assert(promptText.includes('Claim only that external/AI agents can call and execute'), 'readiness prompt scope missing')
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  proofMergeCommit,
  acceptedToolCount: 15,
  all15AcceptedToolsRouteCallableUnderControlledGate: true,
  agentCallableNoMediaReadinessMayProceed: true,
  nextPrompt,
}, null, 2))
