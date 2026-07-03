import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_agent_callable_no_media_tool_call_adapter_completed_with_warnings_ready_for_external_agent_integration_review'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter-result.md',
    label: 'worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter-result',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter-contract.md',
    label: 'worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter-contract',
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter-runtime-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter-runtime-policy',
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
    'realExternalAgentUsed',
    'realUserMediaUsed',
    'workerDispatched',
    'routeExecuted',
    'manifestPersisted',
    'mediaOpened',
    'providerCalled',
    'modelCalled',
    'supabaseTouched',
    'sqlExecuted',
    'storageObjectCreated',
    'signedUrlCreated',
    'publicArtifactCreated',
    'betaUnlocked',
    'productionUnlocked',
    'realUserMediaBetaReady',
    'paidProductionReady',
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
assert(parsed.result.sourceVerification.phase128Decision.includes('phase128_limited_external_agent_product_tool_call_execution'), 'phase128 source missing')
assert(parsed.result.adapterProof.selfTestPassed === true, 'self-test not recorded as passed')
assert(parsed.result.adapterProof.failClosedUnsafeRequestTestPassed === true, 'fail-closed test not recorded as passed')
assert(parsed.result.adapterProof.invocationCount === 4, 'invocation count mismatch')
assert(parsed.result.adapterProof.acceptedToolCountPerInvocation === 15, 'tool count mismatch')
assert(parsed.result.adapterProof.externalAgentCanSubmitJsonEnvelope === true, 'agent envelope claim missing')
assert(parsed.result.adapterProof.realExternalAgentCredentialsRequired === false, 'credentials should not be required for local adapter')
assertAllFalse(parsed.result.sideEffects, 'result.sideEffects')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.contract.decision === decision, 'contract decision mismatch')
assert(parsed.contract.acceptedWorkers.length === 2, 'worker count mismatch')
assert(parsed.contract.acceptedImages.length === 2, 'image count mismatch')
assert(parsed.contract.acceptedJobTypes.length === 4, 'job type count mismatch')
assert(parsed.contract.acceptedTools.length === 15, 'tool count mismatch')
assert(parsed.contract.requestContract.requiredFields.includes('approvedPlanSnapshotId'), 'approvedPlanSnapshotId missing')
assert(parsed.contract.requestContract.requiredFields.includes('idempotencyKey'), 'idempotencyKey missing')
assert(parsed.contract.failClosedPolicy.forbiddenPayloadFields.includes('mediaFilePath'), 'mediaFilePath guard missing')
assert(parsed.contract.failClosedPolicy.forbiddenPayloadFields.includes('rawPrompt'), 'rawPrompt guard missing')

assert(parsed.policy.decision === decision, 'policy decision mismatch')
assert(parsed.policy.allowedClaims.agentCallableNoMediaAdapterExists === true, 'adapter existence claim missing')
assert(parsed.policy.allowedClaims.selfTestPassed === true, 'self-test claim missing')
assert(parsed.policy.allowedClaims.failClosedUnsafeRequestTestPassed === true, 'fail-closed claim missing')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertAllFalse(parsed.policy.runtimeActions, 'policy.runtimeActions')

const selfTest = spawnSync(process.execPath, [
  'scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs',
  '--self-test',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert(selfTest.status === 0, `self-test failed: ${selfTest.stderr}`)
const selfTestJson = JSON.parse(selfTest.stdout)
assert(selfTestJson.status === 'passed', 'self-test status mismatch')
assert(selfTestJson.invocationCount === 4, 'self-test invocation mismatch')
assert(selfTestJson.acceptedInvocationCount === 4, 'self-test accepted mismatch')
assert(selfTestJson.acceptedToolCountPerInvocation === 15, 'self-test tool count mismatch')
for (const result of selfTestJson.results) {
  assert(result.status === 'accepted', 'self-test result not accepted')
  assert(result.acceptedToolCount === 15, 'self-test result tool count mismatch')
  assertAllFalse(result.sideEffects, 'selfTest.result.sideEffects')
}

const unsafeRequest = {
  ...JSON.parse(JSON.stringify(selfTestJson.results[0].requestSummary)),
  requestKind: 'sound_cpu_agent_callable_no_media_tool_call',
  adapterMode: 'bounded_no_real_media_external_agent_local',
  approvedPlanSnapshotId: 'unsafe-test-approved-plan-snapshot',
  workspaceId: 'unsafe-test-workspace',
  projectId: 'unsafe-test-project',
  jobId: 'unsafe-test-job',
  idempotencyKey: 'unsafe-test-idempotency-key',
  workerName: 'sound-cpu-analysis-worker',
  imageName: 'reeditpro/sound-cpu-analysis-worker',
  jobType: 'sound.package_import_smoke',
  syntheticOrNoMediaInput: true,
  realExternalAgentUsed: false,
  realUserMediaUsed: false,
  mediaFilePath: '/private/path/should-not-be-opened.wav',
  runtimeFlags: {
    allowRealExternalAgentExecution: false,
    allowRealUserMedia: false,
    allowWorkerDispatch: false,
    allowRouteExecution: false,
    allowManifestPersistence: false,
    allowMediaOpen: true,
    allowProviderCall: false,
    allowModelCall: false,
    allowSupabaseMutation: false,
    allowSqlExecution: false,
    allowStorageObjectCreation: false,
    allowSignedUrlCreation: false,
    allowPublicArtifactCreation: false,
    allowBetaUnlock: false,
    allowProductionUnlock: false,
  },
  toolDescriptors: Array.from({ length: 15 }, (_, index) => ({
    toolId: [
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
    ][index],
    agentCallableBoundaryInvoked: true,
    realExternalAgentExecution: false,
    realUserMediaInput: false,
    mediaFileOpen: false,
    mediaProcessing: false,
    workerDispatch: false,
    routeExecution: false,
    manifestPersistence: false,
    artifactWrite: false,
  })),
}

const unsafe = spawnSync(process.execPath, [
  'scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
  input: JSON.stringify(unsafeRequest),
})
assert(unsafe.status !== 0, 'unsafe request should fail closed')
const unsafeJson = JSON.parse(unsafe.stdout)
assert(unsafeJson.status === 'blocked', 'unsafe request did not block')
assert(unsafeJson.stopReasons.includes('runtime_flags_must_all_be_false'), 'unsafe request did not catch runtime flag')
assert(unsafeJson.stopReasons.includes('mediaFilePath_not_allowed'), 'unsafe request did not catch media path')
assertAllFalse(unsafeJson.sideEffects, 'unsafe.sideEffects')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-agent-callable-no-media-tool-call-adapter:invoke'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs',
  'invoke package script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-agent-callable-no-media-tool-call-adapter:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter-diagnostics.mjs',
  'diagnostics package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      selfTestStatus: selfTestJson.status,
      failClosedUnsafeRequest: true,
      invocationCount: selfTestJson.invocationCount,
      acceptedToolCountPerInvocation: selfTestJson.acceptedToolCountPerInvocation,
      realUserMediaUsed: false,
      workerDispatched: false,
      routeExecuted: false,
      supabaseTouched: false,
    },
    null,
    2,
  ),
)
