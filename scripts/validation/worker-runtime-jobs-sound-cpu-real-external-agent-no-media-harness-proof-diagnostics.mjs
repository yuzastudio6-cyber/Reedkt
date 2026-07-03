import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_proof_passed_with_warnings_ready_for_harness_owner_review'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_real_external_agent_no_media_integration_plan_completed_with_warnings_ready_for_agent_harness_proof'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof-result',
  },
  invocations: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-invocation-register.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-invocation-register',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-fail-closed-register.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-fail-closed-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-claim-policy',
  },
}

const nextPrompt =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-review.md'

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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must be false`)
  }
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'realExternalAgentCredentialsReady',
    'realExternalAgentRuntimeReady',
    'realUserMediaReady',
    'workerDispatchReady',
    'routeExecutionReady',
    'mediaProcessingReady',
    'supabaseReady',
    'sqlReady',
    'artifactWriteReady',
    'externalBetaRuntimeReady',
    'paidProductionReady',
    'realExternalAgentCredentialsUsed',
    'realUserMediaUsed',
    'mediaOpened',
    'workerDispatched',
    'routeExecuted',
    'supabaseTouched',
    'sqlExecuted',
    'artifactCreated',
    'storageTouched',
  ]
  for (const key of forbidden) {
    assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
  }
}

for (const file of Object.values(files)) assertNoForbiddenTrueClaims(file.path)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2347, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '94daabe2d4f103de875fc335b23cfd50be5483a1', 'source merge mismatch')
assert(parsed.result.sourceVerification.integrationPlanDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.proofResult.validExternalAgentNoMediaEnvelopeAccepted === true, 'accepted envelope not recorded')
assert(parsed.result.proofResult.acceptedToolCount === 15, 'accepted tool count mismatch')
assert(parsed.result.proofResult.blockedCaseCount === 4, 'blocked case count mismatch')
assert(parsed.result.proofResult.filesWritten === false, 'files written widened')
assertAllFalse(parsed.result.sideEffects, 'result.sideEffects')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.invocations.decision === decision, 'invocation decision mismatch')
assert(parsed.invocations.acceptedInvocation.agentOrigin === 'external_agent_no_media_harness', 'agent origin mismatch')
assert(parsed.invocations.acceptedInvocation.acceptedToolCount === 15, 'invocation tool count mismatch')
assert(parsed.invocations.blockedInvocations.length === 4, 'blocked invocation count mismatch')
for (const reason of [
  'agent_origin_invalid',
  'agentSecret_not_allowed',
  'adapter_mediaFilePath_not_allowed',
  'adapter_runtime_flags_must_all_be_false',
]) {
  assert(
    parsed.invocations.blockedInvocations.some((row) => row.expectedStopReason === reason),
    `missing expected stop reason ${reason}`,
  )
}

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
assert(parsed.failClosed.failClosedChecks.invalidAgentOriginBlocks === true, 'invalid origin block missing')
assert(parsed.failClosed.failClosedChecks.agentSecretBlocks === true, 'agent secret block missing')
assert(parsed.failClosed.failClosedChecks.mediaPathBlocks === true, 'media path block missing')
assert(parsed.failClosed.failClosedChecks.trueRuntimeFlagBlocks === true, 'runtime flag block missing')
assertAllFalse(parsed.failClosed.blockedSideEffects, 'failClosed.blockedSideEffects')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.externalAgentNoMediaHarnessProofPassed === true, 'allowed proof claim missing')
assert(parsed.policy.allowedClaims.validExternalAgentNoMediaEnvelopeAccepted === true, 'accepted claim missing')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const proof = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-real-external-agent-no-media-harness-proof:proof',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(proof.status === 0, `harness proof failed: ${proof.stderr}`)
const proofJson = JSON.parse(proof.stdout.slice(proof.stdout.indexOf('{')))
assert(proofJson.status === 'passed', 'proof status mismatch')
assert(proofJson.validExternalAgentNoMediaEnvelopeAccepted === true, 'proof accepted mismatch')
assert(proofJson.acceptedToolCount === 15, 'proof tool count mismatch')
assert(proofJson.blockedCaseCount === 4, 'proof blocked count mismatch')
assertAllFalse(proofJson.sideEffects, 'proof.sideEffects')

const prompt = read(nextPrompt)
assert(prompt.includes(decision), 'next prompt missing source decision')
assert(prompt.includes('worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_owner_review_passed_with_warnings_ready_for_bounded_execution_surface_plan'), 'next prompt pass decision missing')
assert(prompt.includes('No real external-agent credential provisioning'), 'next prompt forbidden scope missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-real-external-agent-no-media-harness-proof:proof'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof-runner.mjs --proof',
  'proof package script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-real-external-agent-no-media-harness-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof-diagnostics.mjs',
  'diagnostics package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2347,
      sourceMergeCommit: parsed.result.sourceVerification.sourceMergeCommit,
      validExternalAgentNoMediaEnvelopeAccepted: true,
      acceptedToolCount: 15,
      blockedCaseCount: 4,
      nextPrompt: parsed.result.nextPrompt,
      realUserMediaUsed: false,
      workerDispatched: false,
      routeExecuted: false,
      supabaseTouched: false,
    },
    null,
    2,
  ),
)
