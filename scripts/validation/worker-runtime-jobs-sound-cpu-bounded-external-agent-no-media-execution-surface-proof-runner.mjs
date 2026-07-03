import { spawnSync } from 'node:child_process'
import {
  createSelfTestRequests,
} from './worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_proof_passed_with_warnings_ready_for_surface_owner_review'
const blockedDecision = 'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_proof_blocked'

const tools = [
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

const jobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

const workers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const images = ['reeditpro/sound-cpu-analysis-worker', 'reeditpro/sound-audio-metadata-worker']

function sideEffects() {
  return {
    realExternalAgentCredentialsUsed: false,
    realUserMediaUsed: false,
    mediaOpened: false,
    workerDispatched: false,
    routeExecuted: false,
    manifestPersisted: false,
    providerCalled: false,
    modelCalled: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectCreated: false,
    signedUrlCreated: false,
    publicArtifactCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    outputWrittenToDisk: false,
    tempArtifactsCreated: false,
  }
}

function allFalse(record) {
  return Object.values(record ?? {}).every((value) => value === false)
}

function createHarnessEnvelope(adapterRequest, index, suffix = `accepted-${index + 1}`) {
  return {
    harnessKind: 'sound_cpu_real_external_agent_no_media_harness',
    agentOrigin: 'external_agent_no_media_harness',
    agentSessionId: 'bounded-agent-surface-proof-session',
    agentRequestId: `bounded-agent-surface-proof-${suffix}`,
    adapterRequest,
  }
}

function invokeHarnessViaStdout(request) {
  const child = spawnSync('node', ['scripts/validation/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof-runner.mjs'], {
    cwd: process.cwd(),
    input: JSON.stringify(request),
    encoding: 'utf8',
  })
  const raw = child.stdout.trim()
  const jsonStart = raw.indexOf('{')
  const result = jsonStart >= 0 ? JSON.parse(raw.slice(jsonStart)) : null
  return {
    exitStatus: child.status,
    stderrPresent: child.stderr.trim().length > 0,
    result,
  }
}

function createBlockedRequests(base) {
  const clone = (value) => JSON.parse(JSON.stringify(value))
  return [
    {
      name: 'invalid_agent_origin',
      expectedStopReason: 'agent_origin_invalid',
      request: { ...clone(base), agentOrigin: 'unknown_agent', agentRequestId: 'bounded-agent-surface-proof-invalid-origin' },
    },
    {
      name: 'missing_agent_session_id',
      expectedStopReason: 'agent_session_id_required',
      request: (() => {
        const request = clone(base)
        request.agentRequestId = 'bounded-agent-surface-proof-missing-session'
        delete request.agentSessionId
        return request
      })(),
    },
    {
      name: 'agent_secret',
      expectedStopReason: 'agentSecret_not_allowed',
      request: { ...clone(base), agentRequestId: 'bounded-agent-surface-proof-secret', agentSecret: 'blocked-secret-placeholder' },
    },
    {
      name: 'adapter_media_path',
      expectedStopReason: 'adapter_mediaFilePath_not_allowed',
      request: (() => {
        const request = clone(base)
        request.agentRequestId = 'bounded-agent-surface-proof-media-path'
        request.adapterRequest.mediaFilePath = '/private/no-media-should-not-open.wav'
        return request
      })(),
    },
    {
      name: 'adapter_true_runtime_flag',
      expectedStopReason: 'adapter_runtime_flags_must_all_be_false',
      request: (() => {
        const request = clone(base)
        request.agentRequestId = 'bounded-agent-surface-proof-runtime-flag'
        request.adapterRequest.runtimeFlags.allowWorkerDispatch = true
        return request
      })(),
    },
    {
      name: 'adapter_unknown_tool',
      expectedStopReason: 'adapter_tool_descriptor_0_tool_id_not_allowlisted',
      request: (() => {
        const request = clone(base)
        request.agentRequestId = 'bounded-agent-surface-proof-unknown-tool'
        request.adapterRequest.toolDescriptors[0].toolId = 'unknown_sound_tool'
        return request
      })(),
    },
    {
      name: 'adapter_tool_count_mismatch',
      expectedStopReason: 'adapter_tool_descriptor_count_mismatch',
      request: (() => {
        const request = clone(base)
        request.agentRequestId = 'bounded-agent-surface-proof-tool-count'
        request.adapterRequest.toolDescriptors = request.adapterRequest.toolDescriptors.slice(0, -1)
        return request
      })(),
    },
    {
      name: 'adapter_unknown_worker',
      expectedStopReason: 'adapter_worker_not_allowlisted',
      request: (() => {
        const request = clone(base)
        request.agentRequestId = 'bounded-agent-surface-proof-unknown-worker'
        request.adapterRequest.workerName = 'unknown-worker'
        return request
      })(),
    },
    {
      name: 'adapter_unknown_image',
      expectedStopReason: 'adapter_image_not_allowlisted',
      request: (() => {
        const request = clone(base)
        request.agentRequestId = 'bounded-agent-surface-proof-unknown-image'
        request.adapterRequest.imageName = 'unknown/image'
        return request
      })(),
    },
    {
      name: 'adapter_unknown_job_type',
      expectedStopReason: 'adapter_job_type_not_allowlisted',
      request: (() => {
        const request = clone(base)
        request.agentRequestId = 'bounded-agent-surface-proof-unknown-job-type'
        request.adapterRequest.jobType = 'sound.unknown_job'
        return request
      })(),
    },
    {
      name: 'adapter_raw_prompt',
      expectedStopReason: 'adapter_rawPrompt_not_allowed',
      request: (() => {
        const request = clone(base)
        request.agentRequestId = 'bounded-agent-surface-proof-raw-prompt'
        request.adapterRequest.rawPrompt = 'blocked raw prompt'
        return request
      })(),
    },
  ]
}

export function runBoundedExternalAgentNoMediaSurfaceProof() {
  const adapterRequests = createSelfTestRequests()
  const acceptedInvocations = adapterRequests.map((adapterRequest, index) => {
    const harness = invokeHarnessViaStdout(createHarnessEnvelope(adapterRequest, index))
    const result = harness.result
    return {
      jobType: adapterRequest.jobType,
      workerName: adapterRequest.workerName,
      imageName: adapterRequest.imageName,
      exitStatus: harness.exitStatus,
      status: result?.status ?? 'missing',
      decision: result?.decision ?? null,
      adapterStatus: result?.adapterResult?.status ?? null,
      acceptedToolCount: result?.acceptedToolCount ?? 0,
      runtimeFlagsAllFalse: result?.adapterResult?.runtimeFlagsAllFalse === true,
      sideEffectsAllFalse: allFalse(result?.sideEffects) && allFalse(result?.adapterResult?.sideEffects),
      stdoutJsonOnly: harness.stderrPresent === false,
    }
  })

  const blockedInvocations = createBlockedRequests(createHarnessEnvelope(adapterRequests[0], 0, 'blocked-base')).map(
    ({ name, expectedStopReason, request }) => {
      const harness = invokeHarnessViaStdout(request)
      const result = harness.result
      return {
        name,
        expectedStopReason,
        exitStatus: harness.exitStatus,
        status: result?.status ?? 'missing',
        stopReasons: result?.stopReasons ?? [],
        expectedStopReasonPresent: result?.stopReasons?.includes(expectedStopReason) === true,
        sideEffectsAllFalse: allFalse(result?.sideEffects) && allFalse(result?.adapterResult?.sideEffects),
      }
    },
  )

  const acceptedPass =
    acceptedInvocations.length === jobTypes.length &&
    acceptedInvocations.every(
      (row) =>
        row.exitStatus === 0 &&
        row.status === 'accepted' &&
        row.adapterStatus === 'accepted' &&
        row.acceptedToolCount === tools.length &&
        row.runtimeFlagsAllFalse === true &&
        row.sideEffectsAllFalse === true &&
        row.stdoutJsonOnly === true,
    )
  const blockedPass =
    blockedInvocations.length === 11 &&
    blockedInvocations.every(
      (row) =>
        row.exitStatus !== 0 &&
        row.status === 'blocked' &&
        row.expectedStopReasonPresent === true &&
        row.sideEffectsAllFalse === true,
    )
  const passed = acceptedPass && blockedPass

  return {
    status: passed ? 'passed' : 'failed',
    decision: passed ? decision : blockedDecision,
    sourceDecision:
      'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_completed_with_warnings_ready_for_surface_proof',
    proofSurface: 'sound_cpu_bounded_external_agent_no_media_execution_surface',
    proofMode: 'local_credentialless_stdout_json_only',
    acceptedInvocationCount: acceptedInvocations.filter((row) => row.status === 'accepted').length,
    expectedAcceptedInvocationCount: jobTypes.length,
    acceptedToolCountPerInvocation: tools.length,
    acceptedToolCountTotal: acceptedInvocations.reduce((sum, row) => sum + row.acceptedToolCount, 0),
    acceptedTools: tools,
    acceptedWorkers: workers,
    acceptedImages: images,
    acceptedJobTypes: jobTypes,
    blockedCaseCount: blockedInvocations.filter((row) => row.status === 'blocked').length,
    expectedBlockedCaseCount: blockedInvocations.length,
    acceptedInvocations,
    blockedInvocations,
    sideEffects: sideEffects(),
    filesWritten: false,
    mediaRead: false,
    mediaProcessed: false,
    workerDispatched: false,
    routeExecuted: false,
    supabaseTouched: false,
    sqlExecuted: false,
    artifactsCreated: false,
    dockerOrGcpAction: false,
    generatedLocalFixturePassedClaimed: false,
    dryRunPassedClaimed: false,
    runtimeReadinessClaimed: false,
  }
}

const proof = runBoundedExternalAgentNoMediaSurfaceProof()
console.log(JSON.stringify(proof, null, 2))
if (proof.status !== 'passed') process.exitCode = 1
