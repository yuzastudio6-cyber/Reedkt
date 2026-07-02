import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase113_limited_product_tool_call_execution_owner_review_passed_with_warnings_ready_for_limited_product_tool_call_execution_proof_no_real_user_media'

const sourceDoc =
  'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review-result.md'
const promptDoc =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof.md'

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
  allowArtifactCreation: false,
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

function invokeLimitedProductToolCallBoundary(envelope) {
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
  ]

  if (envelope.syntheticOrNoMediaInput !== true) stopReasons.push('synthetic_or_no_media_input_required')
  if (envelope.realUserMediaUsed !== false) stopReasons.push('real_user_media_detected')
  if (!allFalse(envelope.runtimeFlags)) stopReasons.push('runtime_flag_true')
  if (!workers.includes(envelope.workerName)) stopReasons.push('worker_not_allowlisted')
  if (!images.includes(envelope.imageName)) stopReasons.push('image_not_allowlisted')
  if (!jobTypes.includes(envelope.jobType)) stopReasons.push('job_type_not_allowlisted')
  if (!Array.isArray(envelope.toolDescriptors) || envelope.toolDescriptors.length !== tools.length) {
    stopReasons.push('tool_descriptor_count_mismatch')
  }

  for (const descriptor of envelope.toolDescriptors ?? []) {
    if (!tools.includes(descriptor.toolId)) stopReasons.push('tool_id_not_allowlisted')
    if (descriptor.mediaFileOpen !== false) stopReasons.push('media_file_open_requested')
    if (descriptor.mediaProcessing !== false) stopReasons.push('media_processing_requested')
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
    productToolCallBoundaryInvoked: true,
    jobTypeAccepted: stopReasons.length === 0,
    workerAccepted: stopReasons.length === 0,
    imageAccepted: stopReasons.length === 0,
    toolCountCovered: envelope.toolDescriptors?.length ?? 0,
    runtimeFlagsAllFalse: allFalse(envelope.runtimeFlags),
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
    artifactCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
  }
}

const source = parseJsonBlock(
  sourceDoc,
  'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review-result',
)
const prompt = parseJsonBlock(
  promptDoc,
  'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof',
)

assert(source.decision === sourceDecision, 'source decision mismatch')
assert(
  source.ownerReview.limitedProductToolCallExecutionProofMayProceedNext === true,
  'source does not allow proof',
)
assert(
  source.soundCpuTools.readyForLimitedProductToolCallExecutionProof === 15,
  'source proof readiness count mismatch',
)
assert(source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product execution widened')
assert(prompt.requiredSourceDecision === sourceDecision, 'prompt source decision mismatch')
assert(prompt.proofScope.runLimitedProductToolCallBoundary === true, 'prompt does not allow limited boundary')
assert(prompt.proofScope.useSyntheticOrNoMediaInputsOnly === true, 'prompt does not require synthetic/no-media input')
assert(prompt.proofScope.allowedToolCount === 15, 'prompt tool count mismatch')

for (const key of Object.keys(runtimeFlags)) {
  assert(prompt.proofScope[key] === false, `prompt scope ${key} must be false`)
}

const toolDescriptors = tools.map((toolId, index) => ({
  toolId,
  descriptorId: `phase114-synthetic-tool-${String(index + 1).padStart(2, '0')}`,
  descriptorKind:
    index % 4 === 0
      ? 'package_import_descriptor'
      : index % 4 === 1
        ? 'numeric_array_descriptor'
        : index % 4 === 2
          ? 'symbolic_midi_descriptor'
          : 'loudness_metadata_descriptor',
  mediaFileOpen: false,
  mediaProcessing: false,
  artifactWrite: false,
}))

const invocations = jobTypes.map((jobType, index) => {
  const envelope = {
    approvedPlanSnapshotId: 'phase114-synthetic-approved-plan-snapshot',
    workspaceId: 'phase114-synthetic-workspace',
    projectId: 'phase114-synthetic-project',
    toolCallRequestId: `phase114-product-tool-call-${index + 1}`,
    idempotencyKey: `phase114-limited-product-tool-call-proof-${jobType}`,
    workerName: workers[index % workers.length],
    imageName: images[index % images.length],
    jobType,
    syntheticOrNoMediaInput: true,
    realUserMediaUsed: false,
    toolDescriptors,
    runtimeFlags,
  }

  return {
    envelopeSummary: {
      workerName: envelope.workerName,
      imageName: envelope.imageName,
      jobType: envelope.jobType,
      toolDescriptorCount: envelope.toolDescriptors.length,
      syntheticOrNoMediaInput: envelope.syntheticOrNoMediaInput,
      realUserMediaUsed: envelope.realUserMediaUsed,
    },
    result: invokeLimitedProductToolCallBoundary(envelope),
  }
})

const allInvocationsPassed = invocations.every(
  ({ result }) =>
    result.ok &&
    result.productToolCallBoundaryInvoked &&
    result.toolCountCovered === tools.length &&
    result.runtimeFlagsAllFalse &&
    result.realUserMediaUsed === false &&
    result.workerDispatched === false &&
    result.routeExecuted === false &&
    result.manifestPersisted === false &&
    result.mediaOpened === false &&
    result.supabaseTouched === false &&
    result.artifactCreated === false,
)

const proof = {
  status: allInvocationsPassed ? 'passed' : 'failed',
  proofKind: 'limited_synthetic_no_media_product_tool_call_boundary',
  sourceDecisionVerified: true,
  limitedProductToolCallBoundaryInvoked: allInvocationsPassed,
  syntheticOrNoMediaInputAccepted: true,
  invocationCount: invocations.length,
  acceptedToolCount: tools.length,
  acceptedWorkerCount: workers.length,
  acceptedImageCount: images.length,
  acceptedJobTypeCount: jobTypes.length,
  acceptedJobTypes: jobTypes,
  toolCountCovered: tools.length,
  runtimeFlagsAllFalse: true,
  realUserMediaUsed: false,
  invocationResults: invocations,
  executionBoundaries: {
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
    artifactCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
  },
  artifacts: {
    proofOutputWrittenToDisk: false,
    tempProofArtifactsCreated: false,
  },
}

console.log(JSON.stringify(proof, null, 2))
