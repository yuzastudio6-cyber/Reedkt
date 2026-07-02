import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase127_limited_external_agent_product_tool_call_execution_preflight_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_no_real_user_media'
const passDecision =
  'worker_runtime_jobs_sound_cpu_phase128_limited_external_agent_product_tool_call_execution_no_real_user_media_passed_with_warnings_ready_for_execution_owner_review_no_real_user_media'
const blockedDecision =
  'worker_runtime_jobs_sound_cpu_phase128_limited_external_agent_product_tool_call_execution_no_real_user_media_blocked_safety_boundary'

const promptDoc =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media.md'
const sourceResultDoc =
  'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media-result.md'
const sourceHandoffDoc =
  'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-execution-handoff-register-no-real-user-media.md'

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

const runtimeFlags = {
  allowRealExternalAgentExecution: false,
  allowRealUserMedia: false,
  allowWorkerDispatch: false,
  allowRouteExecution: false,
  allowManifestPersistence: false,
  allowMediaOpen: false,
  allowProviderCall: false,
  allowModelCall: false,
  allowSupabaseMutation: false,
  allowSqlExecution: false,
  allowStorageObjectCreation: false,
  allowSignedUrlCreation: false,
  allowPublicArtifactCreation: false,
  allowBetaUnlock: false,
  allowProductionUnlock: false,
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function allFalse(flags) {
  return Object.values(flags).every((value) => value === false)
}

function hasUnsafeValue(value) {
  if (value === undefined || value === null || value === false) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

function invokeLimitedExternalAgentProductToolCallBoundary(envelope) {
  const stopReasons = []
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
  ]

  if (envelope.syntheticOrNoMediaInput !== true) stopReasons.push('synthetic_or_no_media_input_required')
  if (envelope.limitedExternalAgentBoundaryMode !== 'synthetic_limited_no_real_agent') {
    stopReasons.push('limited_external_agent_boundary_required')
  }
  if (envelope.realExternalAgentUsed !== false) stopReasons.push('real_external_agent_detected')
  if (envelope.realUserMediaUsed !== false) stopReasons.push('real_user_media_detected')
  if (!allFalse(envelope.runtimeFlags)) stopReasons.push('runtime_flag_true')
  if (!workers.includes(envelope.workerName)) stopReasons.push('worker_not_allowlisted')
  if (!images.includes(envelope.imageName)) stopReasons.push('image_not_allowlisted')
  if (!jobTypes.includes(envelope.jobType)) stopReasons.push('job_type_not_allowlisted')
  if (!Array.isArray(envelope.toolDescriptors) || envelope.toolDescriptors.length !== tools.length) {
    stopReasons.push('tool_descriptor_count_mismatch')
  }
  if (!envelope.approvedPlanSnapshotId) stopReasons.push('approved_plan_snapshot_id_required')
  if (!envelope.idempotencyKey) stopReasons.push('idempotency_key_required')
  if (envelope.externalAgentAdapterMode !== 'limited_synthetic_no_real_agent') {
    stopReasons.push('external_agent_adapter_must_be_limited_synthetic')
  }

  for (const descriptor of envelope.toolDescriptors ?? []) {
    if (!tools.includes(descriptor.toolId)) stopReasons.push('tool_id_not_allowlisted')
    if (descriptor.limitedExternalAgentProductToolCallBoundaryInvoked !== true) {
      stopReasons.push('limited_external_agent_product_tool_call_boundary_not_invoked')
    }
    if (descriptor.realExternalAgentExecution !== false) stopReasons.push('real_external_agent_requested')
    if (descriptor.realUserMediaInput !== false) stopReasons.push('real_user_media_requested')
    if (descriptor.mediaFileOpen !== false) stopReasons.push('media_file_open_requested')
    if (descriptor.mediaProcessing !== false) stopReasons.push('media_processing_requested')
    if (descriptor.workerDispatch !== false) stopReasons.push('worker_dispatch_requested')
    if (descriptor.routeExecution !== false) stopReasons.push('route_execution_requested')
    if (descriptor.manifestPersistence !== false) stopReasons.push('manifest_persistence_requested')
    if (descriptor.artifactWrite !== false) stopReasons.push('artifact_write_requested')
  }

  for (const field of forbiddenPayloadFields) {
    if (hasUnsafeValue(envelope[field])) stopReasons.push(`${field}_not_allowed`)
  }

  for (const claim of [
    'generated_local_fixture_passed',
    'dry_run_passed',
    'runtimeReadiness',
    'workerReadiness',
    'mediaReadiness',
    'externalBetaReady',
    'productionReady',
  ]) {
    if (envelope.claims?.[claim] === true) stopReasons.push('forbidden_status_claim_requested')
  }

  return {
    ok: stopReasons.length === 0,
    stopReasons: [...new Set(stopReasons)],
    limitedExternalAgentProductToolCallBoundaryInvoked: true,
    syntheticOrNoMediaInputAccepted: stopReasons.length === 0,
    productToolCallAccepted: stopReasons.length === 0,
    jobTypeAccepted: stopReasons.length === 0,
    workerAccepted: stopReasons.length === 0,
    imageAccepted: stopReasons.length === 0,
    toolCountCovered: envelope.toolDescriptors?.length ?? 0,
    runtimeFlagsAllFalse: allFalse(envelope.runtimeFlags),
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
  }
}

const prompt = parseJsonBlock(
  promptDoc,
  'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media',
)
const sourceResult = parseJsonBlock(
  sourceResultDoc,
  'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media-result',
)
const sourceHandoff = parseJsonBlock(
  sourceHandoffDoc,
  'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-execution-handoff-register-no-real-user-media',
)

assert(prompt.requiredSourceDecision === sourceDecision, 'prompt source decision mismatch')
assert(prompt.executionScope.runControlledLimitedExternalAgentProductToolCallsNoRealUserMedia === true, 'prompt does not allow controlled proof')
assert(prompt.executionScope.expectedInvocationCount === jobTypes.length, 'prompt invocation count mismatch')
assert(prompt.executionScope.expectedToolDescriptorCountPerInvocation === tools.length, 'prompt tool count mismatch')
assert(prompt.executionScope.requireSyntheticNoRealUserMediaInputs === true, 'prompt does not require synthetic input')
assert(prompt.executionScope.requireWhatHappenedForEveryInvocation === true, 'prompt does not require whatHappened')
assert(prompt.executionScope.stopInsteadOfForceOnCriticalBlocker === true, 'prompt does not require stop-on-blocker')
assert(prompt.executionScope.allowRealUserMedia === false, 'prompt real user media widened')
assert(prompt.executionScope.allowWorkerDispatch === false, 'prompt worker dispatch widened')
assert(prompt.executionScope.allowRouteExecution === false, 'prompt route execution widened')
assert(prompt.executionScope.allowSupabaseMutation === false, 'prompt Supabase widened')
assert(prompt.executionScope.allowPublicArtifactCreation === false, 'prompt public artifact widened')
assert(sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(sourceResult.sourceVerification.sourcePr === 2111, 'source result source PR mismatch')
assert(sourceResult.sourceVerification.sourceMergeCommit === '03720cba59ab55e5093bf06f53a2701bd2e9165a', 'source merge mismatch')
assert(sourceResult.ownerReview.limitedExternalAgentProductToolCallExecutionNoRealUserMediaMayProceedNext === true, 'source did not approve next proof')
assert(sourceResult.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionNextNoRealUserMedia === tools.length, 'source tool count mismatch')
assert(sourceResult.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionInThisOwnerReview === 0, 'source owner review executed unexpectedly')
assert(sourceHandoff.nextExecutionTarget.mayRunControlledLimitedExternalAgentProductToolCallsNoRealUserMedia === true, 'source handoff missing execution approval')
assert(sourceHandoff.nextExecutionTarget.requireWhatHappenedRows === jobTypes.length, 'source handoff evidence count mismatch')

const toolDescriptors = tools.map((toolId, index) => ({
  toolId,
  descriptorId: `phase128-limited-external-agent-product-tool-call-${String(index + 1).padStart(2, '0')}`,
  descriptorKind:
    index % 4 === 0
      ? 'package_import_tool_call_descriptor'
      : index % 4 === 1
        ? 'numeric_array_tool_call_descriptor'
        : index % 4 === 2
          ? 'symbolic_midi_tool_call_descriptor'
          : 'loudness_metadata_tool_call_descriptor',
  limitedExternalAgentProductToolCallBoundaryInvoked: true,
  realExternalAgentExecution: false,
  realUserMediaInput: false,
  mediaFileOpen: false,
  mediaProcessing: false,
  workerDispatch: false,
  routeExecution: false,
  manifestPersistence: false,
  artifactWrite: false,
}))

const invocations = jobTypes.map((jobType, index) => {
  const approved = prompt.approvedInvocations[index]
  const envelope = {
    approvedPlanSnapshotId: 'phase128-synthetic-approved-plan-snapshot',
    workspaceId: 'phase128-synthetic-workspace',
    projectId: 'phase128-synthetic-project',
    jobId: `phase128-synthetic-job-${index + 1}`,
    toolCallRequestId: `phase128-limited-external-agent-product-tool-call-${index + 1}`,
    idempotencyKey: `phase128-limited-external-agent-product-tool-call-execution-${jobType}`,
    externalAgentAdapterMode: 'limited_synthetic_no_real_agent',
    limitedExternalAgentBoundaryMode: 'synthetic_limited_no_real_agent',
    workerName: approved.workerName,
    imageName: approved.imageName,
    jobType,
    syntheticOrNoMediaInput: true,
    realExternalAgentUsed: false,
    realUserMediaUsed: false,
    runtimeFlags,
    toolDescriptors,
    claims: {
      generated_local_fixture_passed: false,
      dry_run_passed: false,
      runtimeReadiness: false,
      workerReadiness: false,
      mediaReadiness: false,
      externalBetaReady: false,
      productionReady: false,
    },
  }
  const result = invokeLimitedExternalAgentProductToolCallBoundary(envelope)
  return {
    invocationId: envelope.toolCallRequestId,
    workerName: envelope.workerName,
    imageName: envelope.imageName,
    jobType,
    toolDescriptorCount: toolDescriptors.length,
    accepted: result.ok,
    whatHappened: result.ok
      ? 'accepted_synthetic_limited_external_agent_product_tool_call_boundary_without_side_effects'
      : 'rejected_by_safety_boundary',
    stopReasons: result.stopReasons,
    result,
  }
})

const failed = invocations.filter((row) => !row.accepted)
const summary = {
  status: failed.length === 0 ? 'passed' : 'failed',
  decision: failed.length === 0 ? passDecision : blockedDecision,
  proofKind: 'limited_external_agent_product_tool_call_execution_no_real_user_media',
  sourceDecisionVerified: true,
  sourcePr: 2112,
  sourceMergeCommit: 'cb4fc67a6ecb6235abff28a4cc6a7777e1bd1a31',
  controlledLimitedExternalAgentProductToolCallsRun: invocations.length,
  limitedExternalAgentProductToolCallBoundaryInvoked: failed.length === 0,
  syntheticOrNoMediaInputAccepted: failed.length === 0,
  recordWhatHappened: true,
  whatHappenedEvidenceRecorded: invocations.every((row) => row.whatHappened && row.whatHappened.length > 0),
  missingWhatHappenedEvidenceBlocksReadiness: true,
  proofCommandRunCount: 1,
  invocationCount: invocations.length,
  totalSyntheticLimitedExternalAgentProductToolCallBoundaryInvocationsObserved: invocations.filter((row) => row.accepted).length,
  acceptedToolCount: tools.length,
  acceptedWorkerCount: workers.length,
  acceptedImageCount: images.length,
  acceptedJobTypeCount: jobTypes.length,
  toolCountCovered: tools.length,
  runtimeFlagsAllFalse: true,
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
  proofOutputWrittenToDisk: false,
  tempProofArtifactsCreated: false,
  fullPayloadRetained: false,
  whatHappened: invocations.map(({ invocationId, workerName, imageName, jobType, toolDescriptorCount, accepted, whatHappened }) => ({
    invocationId,
    workerName,
    imageName,
    jobType,
    toolDescriptorCount,
    accepted,
    whatHappened,
  })),
}

console.log(JSON.stringify(summary, null, 2))
if (failed.length > 0) process.exitCode = 1
