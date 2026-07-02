export const SOUND_CPU_DISPATCH_CONTRACT_VERSION = 'phase148-fail-closed-v1' as const

export const SOUND_CPU_DISPATCH_ALLOWED_WORKERS = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const SOUND_CPU_DISPATCH_ALLOWED_IMAGES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
] as const

export const SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export const SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS = {
  REEDITPRO_SOUND_CPU_RUNTIME_ENABLED: '0',
  REEDITPRO_WORKER_EXECUTION_ENABLED: '0',
  REEDITPRO_MEDIA_PROCESSING_ENABLED: '0',
  REEDITPRO_SUPABASE_MUTATION_ENABLED: '0',
  REEDITPRO_ARTIFACT_WRITE_ENABLED: '0',
} as const

export type SoundCpuDispatchWorkerName = (typeof SOUND_CPU_DISPATCH_ALLOWED_WORKERS)[number]
export type SoundCpuDispatchImageName = (typeof SOUND_CPU_DISPATCH_ALLOWED_IMAGES)[number]
export type SoundCpuDispatchJobType = (typeof SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES)[number]
export type SoundCpuDispatchRuntimeFlags = typeof SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS

export type SoundCpuDispatchAttemptMetadata = Readonly<{
  attemptNumber: number
  maxAttempts: number
  requestedAtIso: string
}>

export type SoundCpuDispatchContractPayload = Readonly<{
  approvedPlanSnapshotId: string
  workspaceId: string
  projectId: string
  jobId: string
  idempotencyKey: string
  workerName: SoundCpuDispatchWorkerName
  imageName: SoundCpuDispatchImageName
  jobType: SoundCpuDispatchJobType
  attemptMetadata: SoundCpuDispatchAttemptMetadata
  privateManifestRef?: string
  runtimeFlags: SoundCpuDispatchRuntimeFlags
}>

export type SoundCpuDispatchValidationResult =
  | Readonly<{
      ok: true
      payload: SoundCpuDispatchContractPayload
    }>
  | Readonly<{
      ok: false
      reason:
        | 'payload_not_record'
        | 'missing_required_field'
        | 'invalid_required_field'
        | 'invalid_worker_name'
        | 'invalid_image_name'
        | 'invalid_job_type'
        | 'runtime_flag_not_disabled'
      field?: string
    }>

export type SoundCpuDisabledDispatchEnvelope = Readonly<{
  acceptedForDispatch: false
  contractVersion: typeof SOUND_CPU_DISPATCH_CONTRACT_VERSION
  workerName: SoundCpuDispatchWorkerName
  imageName: SoundCpuDispatchImageName
  jobType: SoundCpuDispatchJobType
  jobId: string
  idempotencyKey: string
  blockedReason: 'worker_dispatch_execution_not_enabled'
  ownerGateRequired: 'WORKER_RUNTIME_JOBS'
  noWorkerExecution: true
  noRouteExecution: true
  noSupabaseMutation: true
  noSqlExecution: true
  noMediaProcessing: true
  noArtifactCreated: true
}>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isSoundCpuDispatchWorkerName(value: unknown): value is SoundCpuDispatchWorkerName {
  return (
    typeof value === 'string' &&
    SOUND_CPU_DISPATCH_ALLOWED_WORKERS.includes(value as SoundCpuDispatchWorkerName)
  )
}

function isSoundCpuDispatchImageName(value: unknown): value is SoundCpuDispatchImageName {
  return (
    typeof value === 'string' &&
    SOUND_CPU_DISPATCH_ALLOWED_IMAGES.includes(value as SoundCpuDispatchImageName)
  )
}

function isSoundCpuDispatchJobType(value: unknown): value is SoundCpuDispatchJobType {
  return (
    typeof value === 'string' &&
    SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES.includes(value as SoundCpuDispatchJobType)
  )
}

function hasDisabledRuntimeFlags(value: unknown): value is SoundCpuDispatchRuntimeFlags {
  if (!isRecord(value)) return false

  return Object.entries(SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS).every(
    ([key, expected]) => value[key] === expected,
  )
}

function validateAttemptMetadata(value: unknown): SoundCpuDispatchAttemptMetadata | undefined {
  if (!isRecord(value)) return undefined

  const { attemptNumber, maxAttempts, requestedAtIso } = value
  if (typeof attemptNumber !== 'number' || !Number.isInteger(attemptNumber) || attemptNumber < 1) {
    return undefined
  }
  if (typeof maxAttempts !== 'number' || !Number.isInteger(maxAttempts) || maxAttempts < attemptNumber) {
    return undefined
  }
  if (!isNonEmptyString(requestedAtIso)) return undefined

  return { attemptNumber, maxAttempts, requestedAtIso }
}

export function validateSoundCpuDispatchContractPayload(
  value: unknown,
): SoundCpuDispatchValidationResult {
  if (!isRecord(value)) return { ok: false, reason: 'payload_not_record' }

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
  if (!isNonEmptyString(jobId)) return { ok: false, reason: 'missing_required_field', field: 'jobId' }
  if (!isNonEmptyString(idempotencyKey)) {
    return { ok: false, reason: 'missing_required_field', field: 'idempotencyKey' }
  }

  if (!isSoundCpuDispatchWorkerName(value.workerName)) {
    return { ok: false, reason: 'invalid_worker_name', field: 'workerName' }
  }

  if (!isSoundCpuDispatchImageName(value.imageName)) {
    return { ok: false, reason: 'invalid_image_name', field: 'imageName' }
  }

  if (!isSoundCpuDispatchJobType(value.jobType)) {
    return { ok: false, reason: 'invalid_job_type', field: 'jobType' }
  }

  const attemptMetadata = validateAttemptMetadata(value.attemptMetadata)
  if (!attemptMetadata) return { ok: false, reason: 'invalid_required_field', field: 'attemptMetadata' }

  if (!hasDisabledRuntimeFlags(value.runtimeFlags)) {
    return { ok: false, reason: 'runtime_flag_not_disabled', field: 'runtimeFlags' }
  }

  if (value.privateManifestRef !== undefined && !isNonEmptyString(value.privateManifestRef)) {
    return { ok: false, reason: 'invalid_required_field', field: 'privateManifestRef' }
  }

  return {
    ok: true,
    payload: {
      approvedPlanSnapshotId,
      workspaceId,
      projectId,
      jobId,
      idempotencyKey,
      workerName: value.workerName,
      imageName: value.imageName,
      jobType: value.jobType,
      attemptMetadata,
      privateManifestRef: value.privateManifestRef,
      runtimeFlags: SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
    },
  }
}

export function buildDisabledSoundCpuDispatchEnvelope(
  payload: SoundCpuDispatchContractPayload,
): SoundCpuDisabledDispatchEnvelope {
  return {
    acceptedForDispatch: false,
    contractVersion: SOUND_CPU_DISPATCH_CONTRACT_VERSION,
    workerName: payload.workerName,
    imageName: payload.imageName,
    jobType: payload.jobType,
    jobId: payload.jobId,
    idempotencyKey: payload.idempotencyKey,
    blockedReason: 'worker_dispatch_execution_not_enabled',
    ownerGateRequired: 'WORKER_RUNTIME_JOBS',
    noWorkerExecution: true,
    noRouteExecution: true,
    noSupabaseMutation: true,
    noSqlExecution: true,
    noMediaProcessing: true,
    noArtifactCreated: true,
  }
}
