import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

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

const workers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const images = ['reeditpro/sound-cpu-analysis-worker', 'reeditpro/sound-audio-metadata-worker']
const jobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

const runtimeFlagNames = [
  'allowRealExternalAgentExecution',
  'allowRealUserMedia',
  'allowWorkerDispatch',
  'allowRouteExecution',
  'allowManifestPersistence',
  'allowMediaOpen',
  'allowProviderCall',
  'allowModelCall',
  'allowSupabaseMutation',
  'allowSqlExecution',
  'allowStorageObjectCreation',
  'allowSignedUrlCreation',
  'allowPublicArtifactCreation',
  'allowBetaUnlock',
  'allowProductionUnlock',
]

const forbiddenPayloadFields = [
  'rawPrompt',
  'mediaFilePath',
  'sourceMediaUrl',
  'signedUrl',
  'publicArtifactUrl',
  'artifactWriteTarget',
  'providerOutputBlob',
  'serviceRolePayload',
  'supabaseWriteIntent',
  'sqlStatement',
  'modelWeightLocation',
  'gcpResourceTarget',
  'dockerRunRequest',
  'betaUserExecutionRequest',
  'realExternalAgentRequest',
  'realUserMediaManifest',
  'manifestPersistenceRequest',
  'workerDispatchRequest',
  'routeExecutionRequest',
]

function hasValue(value) {
  if (value === undefined || value === null || value === false) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return value !== 0
}

function allRuntimeFlagsFalse(flags) {
  if (!flags || typeof flags !== 'object') return false
  return runtimeFlagNames.every((name) => flags[name] === false)
}

function validateToolDescriptor(descriptor, index) {
  const reasons = []
  if (!descriptor || typeof descriptor !== 'object') reasons.push(`tool_descriptor_${index}_missing`)
  if (!tools.includes(descriptor?.toolId)) reasons.push(`tool_descriptor_${index}_tool_id_not_allowlisted`)
  if (descriptor?.agentCallableBoundaryInvoked !== true) reasons.push(`tool_descriptor_${index}_boundary_not_invoked`)
  if (descriptor?.realExternalAgentExecution !== false) reasons.push(`tool_descriptor_${index}_real_external_agent_requested`)
  if (descriptor?.realUserMediaInput !== false) reasons.push(`tool_descriptor_${index}_real_user_media_requested`)
  if (descriptor?.mediaFileOpen !== false) reasons.push(`tool_descriptor_${index}_media_file_open_requested`)
  if (descriptor?.mediaProcessing !== false) reasons.push(`tool_descriptor_${index}_media_processing_requested`)
  if (descriptor?.workerDispatch !== false) reasons.push(`tool_descriptor_${index}_worker_dispatch_requested`)
  if (descriptor?.routeExecution !== false) reasons.push(`tool_descriptor_${index}_route_execution_requested`)
  if (descriptor?.manifestPersistence !== false) reasons.push(`tool_descriptor_${index}_manifest_persistence_requested`)
  if (descriptor?.artifactWrite !== false) reasons.push(`tool_descriptor_${index}_artifact_write_requested`)
  return reasons
}

export function invokeSoundCpuAgentCallableNoMediaToolCall(request) {
  const stopReasons = []

  if (!request || typeof request !== 'object') stopReasons.push('request_object_required')
  if (request?.requestKind !== 'sound_cpu_agent_callable_no_media_tool_call') stopReasons.push('request_kind_invalid')
  if (request?.adapterMode !== 'bounded_no_real_media_external_agent_local') stopReasons.push('adapter_mode_invalid')
  if (request?.syntheticOrNoMediaInput !== true) stopReasons.push('synthetic_or_no_media_input_required')
  if (request?.realExternalAgentUsed !== false) stopReasons.push('real_external_agent_detected')
  if (request?.realUserMediaUsed !== false) stopReasons.push('real_user_media_detected')
  if (!allRuntimeFlagsFalse(request?.runtimeFlags)) stopReasons.push('runtime_flags_must_all_be_false')
  if (!workers.includes(request?.workerName)) stopReasons.push('worker_not_allowlisted')
  if (!images.includes(request?.imageName)) stopReasons.push('image_not_allowlisted')
  if (!jobTypes.includes(request?.jobType)) stopReasons.push('job_type_not_allowlisted')
  if (!request?.approvedPlanSnapshotId) stopReasons.push('approved_plan_snapshot_id_required')
  if (!request?.workspaceId) stopReasons.push('workspace_id_required')
  if (!request?.projectId) stopReasons.push('project_id_required')
  if (!request?.jobId) stopReasons.push('job_id_required')
  if (!request?.idempotencyKey) stopReasons.push('idempotency_key_required')
  if (!Array.isArray(request?.toolDescriptors)) stopReasons.push('tool_descriptors_required')
  if (Array.isArray(request?.toolDescriptors) && request.toolDescriptors.length !== tools.length) {
    stopReasons.push('tool_descriptor_count_mismatch')
  }

  for (const [index, descriptor] of (request?.toolDescriptors ?? []).entries()) {
    stopReasons.push(...validateToolDescriptor(descriptor, index))
  }

  const seenToolIds = new Set((request?.toolDescriptors ?? []).map((descriptor) => descriptor?.toolId))
  for (const tool of tools) {
    if (!seenToolIds.has(tool)) stopReasons.push(`tool_missing_${tool}`)
  }

  for (const field of forbiddenPayloadFields) {
    if (hasValue(request?.[field])) stopReasons.push(`${field}_not_allowed`)
  }

  for (const claim of [
    'generated_local_fixture_passed',
    'dry_run_passed',
    'runtimeReadiness',
    'workerReadiness',
    'mediaReadiness',
    'externalBetaReady',
    'realUserMediaBetaReady',
    'productionReady',
  ]) {
    if (request?.claims?.[claim] === true) stopReasons.push(`${claim}_claim_not_allowed`)
  }

  const accepted = stopReasons.length === 0

  return {
    status: accepted ? 'accepted' : 'blocked',
    adapter: 'worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter',
    decision: accepted
      ? 'worker_runtime_jobs_sound_cpu_agent_callable_no_media_tool_call_adapter_accepted'
      : 'worker_runtime_jobs_sound_cpu_agent_callable_no_media_tool_call_adapter_blocked',
    stopReasons: [...new Set(stopReasons)],
    requestSummary: {
      workerName: request?.workerName ?? null,
      imageName: request?.imageName ?? null,
      jobType: request?.jobType ?? null,
      toolDescriptorCount: request?.toolDescriptors?.length ?? 0,
      syntheticOrNoMediaInput: request?.syntheticOrNoMediaInput === true,
    },
    acceptedToolCount: accepted ? tools.length : 0,
    acceptedWorkerCount: workers.length,
    acceptedImageCount: images.length,
    acceptedJobTypeCount: jobTypes.length,
    runtimeFlagsAllFalse: allRuntimeFlagsFalse(request?.runtimeFlags),
    sideEffects: {
      realExternalAgentUsed: false,
      realUserMediaUsed: false,
      workerDispatched: false,
      routeExecuted: false,
      manifestPersisted: false,
      mediaOpened: false,
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
    },
  }
}

function createToolDescriptors() {
  return tools.map((toolId, index) => ({
    toolId,
    descriptorId: `agent-callable-no-media-tool-${String(index + 1).padStart(2, '0')}`,
    agentCallableBoundaryInvoked: true,
    realExternalAgentExecution: false,
    realUserMediaInput: false,
    mediaFileOpen: false,
    mediaProcessing: false,
    workerDispatch: false,
    routeExecution: false,
    manifestPersistence: false,
    artifactWrite: false,
  }))
}

function createRuntimeFlags() {
  return Object.fromEntries(runtimeFlagNames.map((name) => [name, false]))
}

export function createSelfTestRequests() {
  return jobTypes.map((jobType, index) => ({
    requestKind: 'sound_cpu_agent_callable_no_media_tool_call',
    adapterMode: 'bounded_no_real_media_external_agent_local',
    approvedPlanSnapshotId: 'agent-callable-no-media-approved-plan-snapshot',
    workspaceId: 'agent-callable-no-media-workspace',
    projectId: 'agent-callable-no-media-project',
    jobId: `agent-callable-no-media-job-${index + 1}`,
    idempotencyKey: `agent-callable-no-media-${jobType}`,
    workerName: workers[index % workers.length],
    imageName: images[index % images.length],
    jobType,
    syntheticOrNoMediaInput: true,
    realExternalAgentUsed: false,
    realUserMediaUsed: false,
    runtimeFlags: createRuntimeFlags(),
    toolDescriptors: createToolDescriptors(),
    claims: {
      generated_local_fixture_passed: false,
      dry_run_passed: false,
      runtimeReadiness: false,
      workerReadiness: false,
      mediaReadiness: false,
      externalBetaReady: false,
      realUserMediaBetaReady: false,
      productionReady: false,
    },
  }))
}

function printContract() {
  console.log(
    JSON.stringify(
      {
        requestKind: 'sound_cpu_agent_callable_no_media_tool_call',
        adapterMode: 'bounded_no_real_media_external_agent_local',
        workers,
        images,
        jobTypes,
        tools,
        runtimeFlagNames,
        forbiddenPayloadFields,
        readsMedia: false,
        dispatchesWorkers: false,
        executesRoutes: false,
        mutatesSupabase: false,
        createsArtifacts: false,
      },
      null,
      2,
    ),
  )
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      data += chunk
    })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--print-contract')) {
    printContract()
    return
  }

  if (args.includes('--self-test')) {
    const results = createSelfTestRequests().map((request) => invokeSoundCpuAgentCallableNoMediaToolCall(request))
    const allAccepted = results.every((result) => result.status === 'accepted')
    console.log(
      JSON.stringify(
        {
          status: allAccepted ? 'passed' : 'failed',
          adapter: 'worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter',
          invocationCount: results.length,
          acceptedInvocationCount: results.filter((result) => result.status === 'accepted').length,
          acceptedToolCountPerInvocation: tools.length,
          results,
        },
        null,
        2,
      ),
    )
    if (!allAccepted) process.exitCode = 1
    return
  }

  const inputIndex = args.indexOf('--input')
  let raw
  if (inputIndex >= 0) {
    const inputPath = args[inputIndex + 1]
    if (!inputPath) throw new Error('--input requires a JSON file path')
    raw = fs.readFileSync(inputPath, 'utf8')
  } else {
    raw = await readStdin()
  }

  const request = JSON.parse(raw)
  const result = invokeSoundCpuAgentCallableNoMediaToolCall(request)
  console.log(JSON.stringify(result, null, 2))
  if (result.status !== 'accepted') process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(JSON.stringify({ status: 'error', message: error.message }, null, 2))
    process.exitCode = 1
  })
}
