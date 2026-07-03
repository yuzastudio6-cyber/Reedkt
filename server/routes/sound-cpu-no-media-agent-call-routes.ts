export const SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH =
  '/api/internal/workers/sound-cpu/no-media-agent-call' as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_SOURCE_FILE =
  'server/routes/sound-cpu-no-media-agent-call-routes.ts' as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_source_created_with_warnings_ready_for_source_owner_review' as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED = false as const
export const SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP = false as const
export const SOUND_CPU_NO_MEDIA_AGENT_CALL_DISABLED_REASON =
  'bounded_external_agent_no_media_route_not_enabled' as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_DISABLED_ENV_DEFAULTS = {
  REEDITPRO_SOUND_CPU_BOUNDED_NO_MEDIA_PRODUCT_ROUTE_ENABLED: '0',
  REEDITPRO_SOUND_CPU_RUNTIME_ENABLED: '0',
  REEDITPRO_WORKER_EXECUTION_ENABLED: '0',
  REEDITPRO_WORKER_DISPATCH_ENABLED: '0',
  REEDITPRO_ROUTE_EXECUTION_ENABLED: '0',
  REEDITPRO_MEDIA_PROCESSING_ENABLED: '0',
  REEDITPRO_SUPABASE_MUTATION_ENABLED: '0',
  REEDITPRO_ARTIFACT_WRITE_ENABLED: '0',
  REEDITPRO_PROVIDER_MODEL_CALL_ENABLED: '0',
  REEDITPRO_DOCKER_CLOUD_RUN_EXECUTION_ENABLED: '0',
} as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_TOOLS = [
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
] as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_WORKERS = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_IMAGES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
] as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS = {
  routeExecutionEnabled: false,
  workerDispatchExecutionEnabled: false,
  workerExecutionEnabled: false,
  mediaProcessingEnabled: false,
  supabaseMutationEnabled: false,
  sqlExecutionEnabled: false,
  storageObjectCreationEnabled: false,
  signedUrlCreationEnabled: false,
  publicArtifactCreationEnabled: false,
  providerModelCallEnabled: false,
  dockerCloudRunExecutionEnabled: false,
} as const

export const SOUND_CPU_NO_MEDIA_AGENT_CALL_FORBIDDEN_ENVELOPE_FIELDS = [
  'rawPrompt',
  'prompt',
  'agentSecret',
  'secret',
  'credential',
  'mediaFilePath',
  'mediaPath',
  'sourceMediaUrl',
  'signedUrl',
  'publicArtifactUrl',
  'serviceRolePayload',
  'providerOutputBlob',
  'modelWeightPath',
  'modelWeightLocation',
  'artifactWriteTarget',
  'supabaseWriteIntent',
  'sqlStatement',
  'gcpResourceTarget',
  'dockerRunRequest',
  'workerDispatchRequest',
  'routeExecutionRequest',
] as const

export type SoundCpuNoMediaAgentCallToolId =
  (typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_TOOLS)[number]
export type SoundCpuNoMediaAgentCallWorkerName =
  (typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_WORKERS)[number]
export type SoundCpuNoMediaAgentCallImageName =
  (typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_IMAGES)[number]
export type SoundCpuNoMediaAgentCallJobType =
  (typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_JOB_TYPES)[number]
export type SoundCpuNoMediaAgentCallStaticOnlyRuntimeFlags =
  typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS

export type SoundCpuNoMediaAgentCallAttemptMetadata = Readonly<{
  attemptNumber: number
  maxAttempts: number
  requestedAtIso: string
  agentRequestId?: string
}>

export type SoundCpuNoMediaAgentCallEnvelope = Readonly<{
  approvedPlanSnapshotId: string
  workspaceId: string
  projectId: string
  jobId: string
  idempotencyKey: string
  workerName: SoundCpuNoMediaAgentCallWorkerName
  imageName: SoundCpuNoMediaAgentCallImageName
  jobType: SoundCpuNoMediaAgentCallJobType
  toolId: SoundCpuNoMediaAgentCallToolId
  attemptMetadata: SoundCpuNoMediaAgentCallAttemptMetadata
  staticOnlyRuntimeFlags: SoundCpuNoMediaAgentCallStaticOnlyRuntimeFlags
}>

export type SoundCpuNoMediaAgentCallValidationResult =
  | Readonly<{
      ok: true
      envelope: SoundCpuNoMediaAgentCallEnvelope
    }>
  | Readonly<{
      ok: false
      reason:
        | 'payload_not_record'
        | 'unsafe_envelope_field_present'
        | 'missing_required_field'
        | 'invalid_required_field'
        | 'invalid_worker_name'
        | 'invalid_image_name'
        | 'invalid_job_type'
        | 'invalid_tool_id'
        | 'runtime_flag_not_disabled'
        | 'forbidden_readiness_claim'
      field?: string
    }>

export type SoundCpuNoMediaAgentCallDisabledResult = Readonly<{
  ok: false
  status: 'blocked'
  routePath: typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH
  sourceFile: typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_SOURCE_FILE
  sourceDecision: typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_SOURCE_DECISION
  reason: typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_DISABLED_REASON
  validation: SoundCpuNoMediaAgentCallValidationResult
  acceptedForExecution: false
  routeRegisteredInApp: false
  routeExecutionEnabled: false
  ownerGateRequired: 'WORKER_RUNTIME_JOBS'
  acceptedToolCount: 15
  acceptedWorkerCount: 2
  acceptedImageCount: 2
  acceptedJobTypeCount: 4
  staticOnlyRuntimeFlags: typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS
  sideEffects: {
    routeExecuted: false
    workerDispatched: false
    workerExecuted: false
    mediaOpened: false
    mediaProcessed: false
    providerCalled: false
    modelCalled: false
    supabaseTouched: false
    sqlExecuted: false
    storageObjectCreated: false
    signedUrlCreated: false
    publicArtifactCreated: false
    artifactWritten: false
    dockerOrCloudRunExecuted: false
    betaUnlocked: false
    productionUnlocked: false
  }
}>

export type SoundCpuNoMediaAgentCallRouteRequestLike = Readonly<{
  body?: unknown
}>

export type SoundCpuNoMediaAgentCallRouteResponseLike = {
  status: (statusCode: number) => {
    json: (payload: unknown) => unknown
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === undefined || value === null || value === false) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return value !== 0
}

function isSoundCpuNoMediaAgentCallWorkerName(
  value: unknown,
): value is SoundCpuNoMediaAgentCallWorkerName {
  return (
    typeof value === 'string' &&
    SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_WORKERS.includes(value as SoundCpuNoMediaAgentCallWorkerName)
  )
}

function isSoundCpuNoMediaAgentCallImageName(value: unknown): value is SoundCpuNoMediaAgentCallImageName {
  return (
    typeof value === 'string' &&
    SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_IMAGES.includes(value as SoundCpuNoMediaAgentCallImageName)
  )
}

function isSoundCpuNoMediaAgentCallJobType(value: unknown): value is SoundCpuNoMediaAgentCallJobType {
  return (
    typeof value === 'string' &&
    SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_JOB_TYPES.includes(value as SoundCpuNoMediaAgentCallJobType)
  )
}

function isSoundCpuNoMediaAgentCallToolId(value: unknown): value is SoundCpuNoMediaAgentCallToolId {
  return (
    typeof value === 'string' &&
    SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_TOOLS.includes(value as SoundCpuNoMediaAgentCallToolId)
  )
}

function findUnsafeEnvelopeField(value: unknown, path: string[] = []): string | undefined {
  if (!isRecord(value) && !Array.isArray(value)) return undefined

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key]
    if (
      SOUND_CPU_NO_MEDIA_AGENT_CALL_FORBIDDEN_ENVELOPE_FIELDS.includes(
        key as (typeof SOUND_CPU_NO_MEDIA_AGENT_CALL_FORBIDDEN_ENVELOPE_FIELDS)[number],
      ) &&
      hasMeaningfulValue(child)
    ) {
      return nextPath.join('.')
    }

    const nested = findUnsafeEnvelopeField(child, nextPath)
    if (nested) return nested
  }

  return undefined
}

function validateAttemptMetadata(value: unknown): SoundCpuNoMediaAgentCallAttemptMetadata | undefined {
  if (!isRecord(value)) return undefined

  const { attemptNumber, maxAttempts, requestedAtIso, agentRequestId } = value
  if (typeof attemptNumber !== 'number' || !Number.isInteger(attemptNumber) || attemptNumber < 1) {
    return undefined
  }
  if (typeof maxAttempts !== 'number' || !Number.isInteger(maxAttempts) || maxAttempts < attemptNumber) {
    return undefined
  }
  if (!isNonEmptyString(requestedAtIso)) return undefined
  if (agentRequestId !== undefined && !isNonEmptyString(agentRequestId)) return undefined

  return {
    attemptNumber,
    maxAttempts,
    requestedAtIso,
    ...(agentRequestId === undefined ? {} : { agentRequestId }),
  }
}

function hasDisabledRuntimeFlags(value: unknown): value is SoundCpuNoMediaAgentCallStaticOnlyRuntimeFlags {
  if (!isRecord(value)) return false

  return Object.entries(SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS).every(
    ([key, expected]) => value[key] === expected,
  )
}

function hasForbiddenReadinessClaim(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined

  const claims = value.claims
  if (!isRecord(claims)) return undefined

  for (const key of [
    'generated_local_fixture_passed',
    'dry_run_passed',
    'runtimeReadiness',
    'workerReadiness',
    'mediaReadiness',
    'externalBetaReady',
    'productionReady',
  ]) {
    if (claims[key] === true) return `claims.${key}`
  }

  return undefined
}

export function validateSoundCpuNoMediaAgentCallEnvelope(
  value: unknown,
): SoundCpuNoMediaAgentCallValidationResult {
  if (!isRecord(value)) return { ok: false, reason: 'payload_not_record' }

  const unsafeField = findUnsafeEnvelopeField(value)
  if (unsafeField) return { ok: false, reason: 'unsafe_envelope_field_present', field: unsafeField }

  const forbiddenClaim = hasForbiddenReadinessClaim(value)
  if (forbiddenClaim) return { ok: false, reason: 'forbidden_readiness_claim', field: forbiddenClaim }

  const approvedPlanSnapshotId = value.approvedPlanSnapshotId
  const workspaceId = value.workspaceId
  const projectId = value.projectId
  const jobId = value.jobId
  const idempotencyKey = value.idempotencyKey

  if (!isNonEmptyString(approvedPlanSnapshotId)) {
    return { ok: false, reason: 'missing_required_field', field: 'approvedPlanSnapshotId' }
  }
  if (!isNonEmptyString(workspaceId)) {
    return { ok: false, reason: 'missing_required_field', field: 'workspaceId' }
  }
  if (!isNonEmptyString(projectId)) {
    return { ok: false, reason: 'missing_required_field', field: 'projectId' }
  }
  if (!isNonEmptyString(jobId)) {
    return { ok: false, reason: 'missing_required_field', field: 'jobId' }
  }
  if (!isNonEmptyString(idempotencyKey)) {
    return { ok: false, reason: 'missing_required_field', field: 'idempotencyKey' }
  }

  if (!isSoundCpuNoMediaAgentCallWorkerName(value.workerName)) {
    return { ok: false, reason: 'invalid_worker_name', field: 'workerName' }
  }
  if (!isSoundCpuNoMediaAgentCallImageName(value.imageName)) {
    return { ok: false, reason: 'invalid_image_name', field: 'imageName' }
  }
  if (!isSoundCpuNoMediaAgentCallJobType(value.jobType)) {
    return { ok: false, reason: 'invalid_job_type', field: 'jobType' }
  }
  if (!isSoundCpuNoMediaAgentCallToolId(value.toolId)) {
    return { ok: false, reason: 'invalid_tool_id', field: 'toolId' }
  }

  const attemptMetadata = validateAttemptMetadata(value.attemptMetadata)
  if (!attemptMetadata) return { ok: false, reason: 'invalid_required_field', field: 'attemptMetadata' }

  if (!hasDisabledRuntimeFlags(value.staticOnlyRuntimeFlags)) {
    return { ok: false, reason: 'runtime_flag_not_disabled', field: 'staticOnlyRuntimeFlags' }
  }

  return {
    ok: true,
    envelope: {
      approvedPlanSnapshotId,
      workspaceId,
      projectId,
      jobId,
      idempotencyKey,
      workerName: value.workerName,
      imageName: value.imageName,
      jobType: value.jobType,
      toolId: value.toolId,
      attemptMetadata,
      staticOnlyRuntimeFlags: SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS,
    },
  }
}

export function createSoundCpuNoMediaAgentCallDisabledResult(
  value: unknown,
): SoundCpuNoMediaAgentCallDisabledResult {
  return {
    ok: false,
    status: 'blocked',
    routePath: SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH,
    sourceFile: SOUND_CPU_NO_MEDIA_AGENT_CALL_SOURCE_FILE,
    sourceDecision: SOUND_CPU_NO_MEDIA_AGENT_CALL_SOURCE_DECISION,
    reason: SOUND_CPU_NO_MEDIA_AGENT_CALL_DISABLED_REASON,
    validation: validateSoundCpuNoMediaAgentCallEnvelope(value),
    acceptedForExecution: false,
    routeRegisteredInApp: SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP,
    routeExecutionEnabled: SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED,
    ownerGateRequired: 'WORKER_RUNTIME_JOBS',
    acceptedToolCount: 15,
    acceptedWorkerCount: 2,
    acceptedImageCount: 2,
    acceptedJobTypeCount: 4,
    staticOnlyRuntimeFlags: SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS,
    sideEffects: {
      routeExecuted: false,
      workerDispatched: false,
      workerExecuted: false,
      mediaOpened: false,
      mediaProcessed: false,
      providerCalled: false,
      modelCalled: false,
      supabaseTouched: false,
      sqlExecuted: false,
      storageObjectCreated: false,
      signedUrlCreated: false,
      publicArtifactCreated: false,
      artifactWritten: false,
      dockerOrCloudRunExecuted: false,
      betaUnlocked: false,
      productionUnlocked: false,
    },
  }
}

export function soundCpuNoMediaAgentCallDisabledRouteHandler(
  request: SoundCpuNoMediaAgentCallRouteRequestLike,
  response: SoundCpuNoMediaAgentCallRouteResponseLike,
): void {
  response.status(409).json({
    ok: false,
    error: {
      code: 'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_NOT_ENABLED',
      message:
        'SOUND CPU no-media agent-call route source exists but remains unregistered and disabled pending owner gates.',
      reason: SOUND_CPU_NO_MEDIA_AGENT_CALL_DISABLED_REASON,
    },
    data: {
      soundCpuNoMediaAgentCall: createSoundCpuNoMediaAgentCallDisabledResult(request.body),
    },
    warnings: [
      'route_source_created_but_not_registered',
      'route_execution_not_enabled',
      'worker_dispatch_execution_not_enabled',
      'tool_execution_not_enabled',
      'media_processing_not_enabled',
      'supabase_mutation_not_enabled',
      'artifact_creation_not_enabled',
    ],
  })
}
