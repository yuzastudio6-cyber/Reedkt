import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_proof_passed_with_warnings_ready_for_surface_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_completed_with_warnings_ready_for_surface_proof'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-EXECUTION-SURFACE-OWNER-REVIEW'

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
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-result',
  },
  invocations: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-invocation-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-invocation-register',
  },
  failClosed: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-fail-closed-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-fail-closed-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-runtime-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-surface-contract-register.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-tool-coverage-register.md',
  'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review.md',
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

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'realExternalAgentCredentialsReady',
    'realExternalAgentRuntimeExecutionReady',
    'realUserMediaReady',
    'workerDispatchReady',
    'routeExecutionReady',
    'mediaProcessingReady',
    'supabaseReady',
    'sqlReady',
    'artifactWriteReady',
    'externalBetaRuntimeReady',
    'paidProductionReady',
    'realExternalAgentCredentialProvisioning',
    'realUserMediaRead',
    'mediaProcessing',
    'workerExecution',
    'routeExecution',
    'artifactCreation',
    'supabaseMutation',
    'sqlExecution',
    'storageTransfer',
    'signedUrlCreation',
    'publicArtifactCreation',
    'providerModelCall',
    'dockerGcpAction',
    'betaUnlock',
    'productionUnlock',
    'generated_local_fixture_passed',
    'dry_run_passed',
    'runtimeReadinessClaimed',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

for (const value of Object.values(files)) assertNoForbiddenTrueClaims(value.path)
for (const file of sourceFiles) read(file)

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2352, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '252e0ce80cc61959433ef881ccacb4afb92d866e', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.sourceVerification.phase210PrivateFixtureBlockerPreserved === true, 'Phase210 blocker not preserved')
assert(parsed.result.proofResult.proofMode === 'local_credentialless_stdout_json_only', 'proof mode mismatch')
assert(parsed.result.proofResult.acceptedInvocationCount === 4, 'accepted invocation count mismatch')
assert(parsed.result.proofResult.acceptedToolCountPerInvocation === 15, 'accepted tool count mismatch')
assert(parsed.result.proofResult.acceptedToolCountTotal === 60, 'accepted total tool count mismatch')
assert(parsed.result.proofResult.blockedCaseCount === 11, 'blocked case count mismatch')
assert(parsed.result.proofResult.validExternalAgentNoMediaEnvelopeAccepted === true, 'valid envelope missing')
assert(parsed.result.proofResult.allAcceptedInvocationsStdoutJsonOnly === true, 'stdout-only evidence missing')
assert(parsed.result.proofResult.allAcceptedInvocationsRuntimeFlagsFalse === true, 'runtime flags evidence missing')
assert(parsed.result.proofResult.allBlockedCasesFailClosed === true, 'fail-closed evidence missing')
assert(parsed.result.proofResult.filesWritten === false, 'files written widened')
assert(parsed.result.proofResult.mediaRead === false, 'media read widened')
assert(parsed.result.proofResult.workerDispatched === false, 'worker dispatch widened')
assert(parsed.result.proofResult.routeExecuted === false, 'route execution widened')
assert(parsed.result.proofResult.supabaseTouched === false, 'Supabase widened')
assert(parsed.result.nextPrompt === nextPrompt, 'next prompt mismatch')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.invocations.decision === decision, 'invocation decision mismatch')
assert(parsed.invocations.acceptedInvocations.length === 4, 'accepted invocation rows mismatch')
for (const row of parsed.invocations.acceptedInvocations) {
  assert(row.status === 'accepted', `accepted row ${row.jobType} status mismatch`)
  assert(row.acceptedToolCount === 15, `accepted row ${row.jobType} tool count mismatch`)
  assert(row.stdoutJsonOnly === true, `accepted row ${row.jobType} stdout mismatch`)
}
assert(JSON.stringify(parsed.invocations.acceptedTools) === JSON.stringify(expectedTools), 'accepted tool list mismatch')
assert(parsed.invocations.aliasCoverage.pydub_effects === 'covered_by_pydub', 'pydub alias mismatch')
assert(parsed.invocations.aliasCoverage.ebu_r128_pyloudnorm === 'covered_by_pyloudnorm', 'pyloudnorm alias mismatch')
assertFalseMap(parsed.invocations.sideEffects, 'invocations.sideEffects')

assert(parsed.failClosed.decision === decision, 'fail-closed decision mismatch')
assert(parsed.failClosed.blockedCaseCount === 11, 'blocked case rows mismatch')
for (const row of parsed.failClosed.blockedInvocations) {
  assert(row.status === 'blocked', `blocked row ${row.name} status mismatch`)
  assert(Boolean(row.expectedStopReason), `blocked row ${row.name} missing expected reason`)
}
for (const reason of [
  'agent_origin_invalid',
  'agent_session_id_required',
  'agentSecret_not_allowed',
  'adapter_mediaFilePath_not_allowed',
  'adapter_runtime_flags_must_all_be_false',
  'adapter_tool_descriptor_0_tool_id_not_allowlisted',
  'adapter_tool_descriptor_count_mismatch',
  'adapter_worker_not_allowlisted',
  'adapter_image_not_allowlisted',
  'adapter_job_type_not_allowlisted',
  'adapter_rawPrompt_not_allowed',
]) {
  assert(
    parsed.failClosed.blockedInvocations.some((row) => row.expectedStopReason === reason),
    `missing blocked reason ${reason}`,
  )
}
assertFalseMap(parsed.failClosed.blockedSideEffects, 'failClosed.blockedSideEffects')

assert(parsed.claims.decision === decision, 'claim decision mismatch')
assert(parsed.claims.allowedClaims.boundedExternalAgentNoMediaSurfaceProofPassed === true, 'proof allowed claim missing')
assert(parsed.claims.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(parsed.claims.allowedClaims.acceptedJobTypeCount === 4, 'allowed job type count mismatch')
assert(parsed.claims.allowedClaims.surfaceOwnerReviewMayProceed === true, 'owner review handoff missing')
assertFalseMap(parsed.claims.blockedClaims, 'claims.blockedClaims')
assertFalseMap(parsed.claims.runtimeActions, 'claims.runtimeActions')

const plan = parse(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-plan.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-plan',
)
assert(plan.decision === sourceDecision, 'plan source decision mismatch')
assert(plan.surfacePlan.acceptedToolCount === 15, 'plan tool count mismatch')
assert(plan.surfacePlan.boundedNoMediaCallsMayProceed === true, 'plan did not permit proof')
assert(plan.surfacePlan.realUserMediaAllowed === false, 'plan real media widened')

const phase210 = parse(
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result',
)
assert(
  phase210.decision === 'worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete',
  'Phase210 blocker decision mismatch',
)
assert(phase210.intakeResult.mediaRead === false, 'Phase210 media read widened')

const proof = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-execution-surface-proof:proof',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(proof.status === 0, `bounded surface proof failed: ${proof.stderr}`)
const proofJson = JSON.parse(proof.stdout.slice(proof.stdout.indexOf('{')))
assert(proofJson.status === 'passed', 'proof status mismatch')
assert(proofJson.decision === decision, 'proof decision mismatch')
assert(proofJson.acceptedInvocationCount === 4, 'proof accepted invocation count mismatch')
assert(proofJson.acceptedToolCountPerInvocation === 15, 'proof tool count mismatch')
assert(proofJson.acceptedToolCountTotal === 60, 'proof total tool count mismatch')
assert(proofJson.blockedCaseCount === 11, 'proof blocked count mismatch')
assertFalseMap(proofJson.sideEffects, 'proof.sideEffects')
for (const row of proofJson.acceptedInvocations) assert(row.sideEffectsAllFalse === true, `proof ${row.jobType} side effects`)
for (const row of proofJson.blockedInvocations) assert(row.expectedStopReasonPresent === true, `proof ${row.name} stop reason`)

const ownerPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-owner-review.md',
)
assert(ownerPrompt.includes(decision), 'owner review prompt source decision missing')
assert(ownerPrompt.includes('No real external-agent credential provisioning'), 'owner review prompt forbidden scope missing')
assert(ownerPrompt.includes('worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_owner_review_passed_with_warnings_ready_for_private_fixture_path_intake_or_product_route_plan'), 'owner review pass decision missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-execution-surface-proof:proof'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-runner.mjs',
  'proof package script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-bounded-external-agent-no-media-execution-surface-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-diagnostics.mjs',
  'diagnostics package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2352,
      acceptedSoundCpuToolCount: 15,
      acceptedInvocationCount: 4,
      blockedCaseCount: 11,
      validExternalAgentNoMediaEnvelopeAccepted: true,
      nextPrompt,
      realUserMediaAllowed: false,
      workerDispatchAllowed: false,
      routeExecutionAllowed: false,
      supabaseUpdateRequired: false,
    },
    null,
    2,
  ),
)
