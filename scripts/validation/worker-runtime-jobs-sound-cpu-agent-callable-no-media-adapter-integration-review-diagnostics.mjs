import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_agent_callable_no_media_adapter_integration_review_passed_with_warnings_ready_for_real_external_agent_no_media_integration_plan'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_agent_callable_no_media_tool_call_adapter_completed_with_warnings_ready_for_external_agent_integration_review'

const files = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-review.md',
    label: 'worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-acceptance-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-blocker-register',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-claim-policy',
  },
}

const promptPath =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-real-external-agent-no-media-integration-plan.md'

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
    'manifestPersistenceReady',
    'artifactWriteReady',
    'supabaseReady',
    'sqlReady',
    'externalBetaReady',
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

assert(parsed.review.decision === decision, 'review decision mismatch')
assert(parsed.review.sourceVerification.sourcePr === 2342, 'source PR mismatch')
assert(parsed.review.sourceVerification.sourceMergeCommit === '15d5f5f806f34cde6eb5badee425b115a6800726', 'source merge mismatch')
assert(parsed.review.sourceVerification.adapterDecision === sourceDecision, 'adapter decision mismatch')
assert(parsed.review.reviewResult.adapterSourceReviewed === true, 'adapter source not reviewed')
assert(parsed.review.reviewResult.adapterDiagnosticsReviewed === true, 'adapter diagnostics not reviewed')
assert(parsed.review.reviewResult.jsonFileAndStdinInputAccepted === true, 'json input not accepted')
assert(parsed.review.reviewResult.unsafeRequestFailsClosed === true, 'fail-closed review missing')
assert(parsed.review.reviewResult.allFifteenSoundCpuToolsRepresented === true, 'tool representation missing')
assert(parsed.review.reviewResult.externalAgentIntegrationPlanMayProceed === true, 'next plan not allowed')
assert(parsed.review.reviewResult.realExternalAgentCredentialsApprovedToday === false, 'credentials widened')
assert(parsed.review.reviewResult.realExternalAgentRuntimeExecutionApprovedToday === false, 'runtime widened')
assert(parsed.review.reviewResult.realUserMediaApprovedToday === false, 'real media widened')
assertNoop(parsed.review.supabaseClassification, 'review.supabaseClassification')

assert(parsed.acceptance.decision === decision, 'acceptance decision mismatch')
assert(parsed.acceptance.acceptedForNextPlanning.realExternalAgentNoMediaIntegrationPlan === true, 'next planning not accepted')
assert(parsed.acceptance.acceptedTools.length === 15, 'accepted tool count mismatch')
assert(parsed.acceptance.acceptedWorkers.length === 2, 'worker count mismatch')
assert(parsed.acceptance.acceptedImages.length === 2, 'image count mismatch')
assert(parsed.acceptance.acceptedJobTypes.length === 4, 'job type count mismatch')
assertAllFalse(parsed.acceptance.acceptedForToday, 'acceptance.acceptedForToday')

assert(parsed.blockers.decision === decision, 'blocker decision mismatch')
assert(parsed.blockers.remainingBlockers.realUserMedia === 'blocked_by_phase209_private_fixture_path_or_boundary_missing', 'real media blocker mismatch')
assert(parsed.blockers.allowedNextPlanning.realExternalAgentNoMediaIntegrationPlan === true, 'next plan blocker missing')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.realExternalAgentNoMediaIntegrationPlanMayProceed === true, 'allowed next claim missing')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const prompt = read(promptPath)
assert(prompt.includes(decision), 'next prompt missing source decision')
assert(prompt.includes('worker_runtime_jobs_sound_cpu_real_external_agent_no_media_integration_plan_completed_with_warnings_ready_for_agent_harness_proof'), 'next prompt pass decision missing')
assert(prompt.includes('No real external-agent credential provisioning'), 'next prompt forbidden scope missing')

const adapterDiagnostics = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-agent-callable-no-media-tool-call-adapter:diagnostics',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(adapterDiagnostics.status === 0, `adapter diagnostics failed: ${adapterDiagnostics.stderr}`)
assert(adapterDiagnostics.stdout.includes(sourceDecision), 'adapter diagnostics source decision missing')

const contract = spawnSync('npm', [
  'run',
  'worker-runtime-jobs:sound-cpu-agent-callable-no-media-tool-call-adapter:invoke',
  '--',
  '--print-contract',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(contract.status === 0, `adapter contract failed: ${contract.stderr}`)
const contractJson = JSON.parse(contract.stdout.slice(contract.stdout.indexOf('{')))
assert(contractJson.tools.length === 15, 'contract tool count mismatch')
assert(contractJson.dispatchesWorkers === false, 'contract widened worker dispatch')
assert(contractJson.executesRoutes === false, 'contract widened route execution')
assert(contractJson.mutatesSupabase === false, 'contract widened Supabase')
assert(contractJson.createsArtifacts === false, 'contract widened artifacts')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-agent-callable-no-media-adapter-integration-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2342,
      sourceMergeCommit: parsed.review.sourceVerification.sourceMergeCommit,
      acceptedToolCount: parsed.acceptance.acceptedTools.length,
      nextPrompt: parsed.review.nextPrompt,
      realExternalAgentRuntimeExecutionApprovedToday: false,
      realUserMediaApprovedToday: false,
      workerDispatched: false,
      routeExecuted: false,
      supabaseTouched: false,
    },
    null,
    2,
  ),
)
