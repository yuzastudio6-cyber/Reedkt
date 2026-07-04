import fs from 'node:fs'
import path from 'node:path'

const decision = 'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_agent_callable_execution_ready_with_warnings'
const ownerDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_proof_owner_review_passed_with_warnings_ready_for_agent_callable_execution_readiness'
const ownerMergeCommit = '8fc779ca7009f66c845d1587398702cfc34ebfb6'

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
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-execution-readiness.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-execution-readiness',
  },
  tools: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-tool-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-tool-register',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-contract.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-contract',
  },
  boundary: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-boundary',
  },
  audit: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-completion-audit.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-completion-audit',
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
const owner = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-proof-owner-review',
)
const proof = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-result.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-controlled-proof-result',
)
const routeText = read('server/routes/sound-cpu-no-media-agent-call-routes.ts')
const packageJson = JSON.parse(read('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-agent-callable-execution-readiness:diagnostics'

assert(parsed.readiness.decision === decision, 'readiness decision mismatch')
assert(parsed.readiness.sourceVerification.proofOwnerReviewPr === 2393, 'owner review PR mismatch')
assert(parsed.readiness.sourceVerification.proofOwnerReviewMergeCommit === ownerMergeCommit, 'owner merge mismatch')
assert(parsed.readiness.sourceVerification.proofOwnerReviewDecision === ownerDecision, 'owner decision mismatch')
assert(parsed.readiness.readiness.agentCanCallAndExecuteTools === true, 'agent callability not ready')
assert(parsed.readiness.readiness.scope === 'bounded_no_media_internal_route', 'scope mismatch')
assert(parsed.readiness.readiness.acceptedToolCount === 15, 'accepted tool count mismatch')
assert(parsed.readiness.readiness.all15ToolsPassedRouteProof === true, 'all 15 proof missing')
assert(parsed.readiness.readiness.proofHttpStatusForEveryTool === 200, 'HTTP status evidence mismatch')
assert(parsed.readiness.readiness.acceptedForExecutionForEveryTool === true, 'accepted execution evidence mismatch')
for (const [key, value] of Object.entries(parsed.readiness.notReady)) {
  assert(value === false, `notReady.${key} must be false`)
}
assert(parsed.readiness.supabaseClassification.updateRequired === 'no', 'supabase update must be no')
assert(parsed.readiness.supabaseClassification.environmentTouched === 'no', 'supabase environment must be no')
assert(parsed.readiness.supabaseClassification.sqlExecuted === 'no', 'sql executed must be no')
assert(parsed.readiness.supabaseClassification.migrationDeployed === 'no', 'migration deployed must be no')
assert(parsed.readiness.supabaseClassification.nextAction === 'none', 'supabase next action must be none')

assert(parsed.tools.decision === decision, 'tool register decision mismatch')
assert(parsed.tools.toolCount === 15, 'tool count mismatch')
for (const tool of expectedTools) assert(parsed.tools.tools.includes(tool), `missing tool ${tool}`)
assert(parsed.tools.callabilityEvidence.routeCallable === true, 'route callable evidence missing')
assert(parsed.tools.callabilityEvidence.packageExecutable === true, 'package executable evidence missing')
assert(parsed.tools.callabilityEvidence.syntheticNoMediaOnly === true, 'synthetic/no-media evidence missing')
assert(parsed.tools.callabilityEvidence.acceptedForExecution === true, 'acceptedForExecution evidence missing')

assert(parsed.contract.decision === decision, 'contract decision mismatch')
assert(parsed.contract.routeContract.method === 'POST', 'contract method mismatch')
assert(parsed.contract.routeContract.requiredEnvGate.value === '1', 'env gate value mismatch')
for (const field of ['approvedPlanSnapshotId', 'idempotencyKey', 'toolId', 'staticOnlyRuntimeFlags']) {
  assert(parsed.contract.routeContract.requiredEnvelopeFields.includes(field), `missing contract field ${field}`)
}
assert(parsed.contract.routeContract.rejectedInputs.includes('mediaFilePath'), 'media rejection missing')
assert(parsed.contract.routeContract.rejectedInputs.includes('serviceRolePayload'), 'service-role rejection missing')

assert(parsed.boundary.decision === decision, 'boundary decision mismatch')
for (const [key, value] of Object.entries(parsed.boundary.readyBoundary)) {
  assert(value === true, `readyBoundary.${key} must be true`)
}
for (const [key, value] of Object.entries(parsed.boundary.closedBoundary)) {
  assert(value === false, `closedBoundary.${key} must be false`)
}

assert(parsed.audit.decision === decision, 'audit decision mismatch')
assert(parsed.audit.objectiveAudit.externalAgentCanCallAndExecute === 'proved_under_explicit_env_gate', 'objective audit mismatch')
assert(parsed.audit.completionEvidence.length >= 4, 'completion evidence missing')

assert(owner.decision === ownerDecision, 'owner review source missing')
assert(owner.ownerReview.all15AcceptedToolsRouteCallableUnderControlledGate === true, 'owner review route-callable evidence missing')
assert(proof.proofResult.passedToolCount === 15, 'proof passed count mismatch')
assert(proof.proofResult.failedToolCount === 0, 'proof failed count mismatch')
assert(routeText.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_TO_TOOL_EXECUTION_ENV'), 'route env gate missing')
assert(routeText.includes('validateSoundCpuNoMediaAgentCallEnvelope(request.body)'), 'route validation missing')

assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-execution-readiness-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision,
  ownerMergeCommit,
  agentCanCallAndExecuteTools: true,
  scope: 'bounded_no_media_internal_route',
  acceptedToolCount: 15,
  all15ToolsPassedRouteProof: true,
  realUserMediaReady: false,
  paidProductionReady: false,
}, null, 2))
