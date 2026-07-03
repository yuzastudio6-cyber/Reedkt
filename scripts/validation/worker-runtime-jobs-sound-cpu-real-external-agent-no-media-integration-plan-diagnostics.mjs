import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_real_external_agent_no_media_integration_plan_completed_with_warnings_ready_for_agent_harness_proof'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_agent_callable_no_media_adapter_integration_review_passed_with_warnings_ready_for_real_external_agent_no_media_integration_plan'

const files = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-integration-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-integration-plan',
  },
  boundary: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-agent-submission-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-agent-submission-boundary',
  },
  credentials: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-credentialless-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-credentialless-policy',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-blocker-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-claim-policy',
  },
}

const nextPrompt =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof.md'

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
    'realExternalAgentExecutionReady',
    'realExternalAgentCredentialsReady',
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
    'realExternalAgentRuntimeCalled',
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

assert(parsed.plan.decision === decision, 'plan decision mismatch')
assert(parsed.plan.sourceVerification.sourcePr === 2345, 'source PR mismatch')
assert(parsed.plan.sourceVerification.sourceMergeCommit === '5babc5145b01d4a2464a59eaf91e5814b233c8a1', 'source merge mismatch')
assert(parsed.plan.sourceVerification.integrationReviewDecision === sourceDecision, 'source decision mismatch')
assert(parsed.plan.planResult.realExternalAgentNoMediaHarnessProofMayProceed === true, 'harness proof not allowed')
assert(parsed.plan.planResult.externalAgentEnvelopeShapeDefined === true, 'envelope shape missing')
assert(parsed.plan.planResult.credentiallessLocalAgentBoundaryDefined === true, 'credentialless boundary missing')
assert(parsed.plan.planResult.adapterForwardingStrategyDefined === true, 'forwarding strategy missing')
assert(parsed.plan.planResult.realExternalAgentRuntimeExecutionApprovedToday === false, 'runtime widened')
assert(parsed.plan.planResult.realExternalAgentCredentialsApprovedToday === false, 'credentials widened')
assert(parsed.plan.planResult.realUserMediaApprovedToday === false, 'real media widened')
assert(parsed.plan.acceptedPlanningSurface.toolCount === 15, 'tool count mismatch')
assertNoop(parsed.plan.supabaseClassification, 'plan.supabaseClassification')

assert(parsed.boundary.decision === decision, 'boundary decision mismatch')
assert(parsed.boundary.plannedExternalAgentEnvelope.agentOrigin === 'external_agent_no_media_harness', 'agent origin mismatch')
assert(parsed.boundary.plannedExternalAgentEnvelope.toolDescriptorCount === 15, 'boundary tool count mismatch')
assert(parsed.boundary.plannedForwardingRules.forwardOnlyAllowlistedAdapterFields === true, 'allowlist forwarding missing')
assert(parsed.boundary.blockedPayloadFields.includes('agentSecret'), 'agent secret guard missing')
assert(parsed.boundary.blockedPayloadFields.includes('mediaFilePath'), 'media path guard missing')

assert(parsed.credentials.decision === decision, 'credential policy decision mismatch')
assert(parsed.credentials.credentialPolicy.realExternalAgentCredentialsProvisioned === false, 'credentials provisioned')
assert(parsed.credentials.credentialPolicy.localOpaqueAgentIdsOnly === true, 'opaque identity policy missing')
assert(parsed.credentials.identityPolicy.agentIdentityAuthorizesRuntime === false, 'identity authorizes runtime')
assertNoop(parsed.credentials.supabaseClassification, 'credentials.supabaseClassification')

assert(parsed.readiness.decision === decision, 'readiness decision mismatch')
assert(parsed.readiness.harnessProofReadiness.mayImplementHarnessProofNext === true, 'harness not ready')
assert(parsed.readiness.expectedHarnessProofChecks.includes('agent_secret_blocks'), 'secret proof missing')
assert(parsed.readiness.expectedHarnessProofChecks.includes('media_path_blocks'), 'media proof missing')
assertAllFalse(parsed.readiness.expectedHarnessProofSideEffects, 'readiness.expectedHarnessProofSideEffects')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.notBlocked.localCredentiallessAgentHarnessProof === true, 'harness blocker mismatch')
assert(parsed.blockers.remainingBlockers.realUserMedia === 'blocked_by_phase209_private_fixture_path_or_boundary_missing', 'real media blocker mismatch')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.credentiallessHarnessProofMayProceed === true, 'policy harness claim missing')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const prompt = read(nextPrompt)
assert(prompt.includes(decision), 'next prompt missing source decision')
assert(prompt.includes('worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_proof_passed_with_warnings_ready_for_harness_owner_review'), 'next prompt pass decision missing')
assert(prompt.includes('No real external-agent credential provisioning'), 'next prompt forbidden scope missing')

const integrationReview = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-agent-callable-no-media-adapter-integration-review:diagnostics',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(integrationReview.status === 0, `integration review diagnostics failed: ${integrationReview.stderr}`)
assert(integrationReview.stdout.includes(sourceDecision), 'source diagnostic decision missing')

const adapter = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-agent-callable-no-media-tool-call-adapter:diagnostics',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(adapter.status === 0, `adapter diagnostics failed: ${adapter.stderr}`)

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-real-external-agent-no-media-integration-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-integration-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2345,
      sourceMergeCommit: parsed.plan.sourceVerification.sourceMergeCommit,
      acceptedToolCount: parsed.plan.acceptedPlanningSurface.toolCount,
      nextPrompt: parsed.plan.nextPrompt,
      harnessProofMayProceed: true,
      realExternalAgentRuntimeExecutionApprovedToday: false,
      realExternalAgentCredentialsApprovedToday: false,
      realUserMediaApprovedToday: false,
      workerDispatched: false,
      routeExecuted: false,
      supabaseTouched: false,
    },
    null,
    2,
  ),
)
