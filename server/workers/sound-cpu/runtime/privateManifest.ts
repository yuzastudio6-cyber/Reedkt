export const SOUND_CPU_PRIVATE_MANIFEST_WORKER_NAMES = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const SOUND_CPU_PRIVATE_MANIFEST_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export type SoundCpuPrivateManifestWorkerName = (typeof SOUND_CPU_PRIVATE_MANIFEST_WORKER_NAMES)[number]
export type SoundCpuPrivateManifestJobType = (typeof SOUND_CPU_PRIVATE_MANIFEST_JOB_TYPES)[number]

export type SoundCpuPrivateManifestRuntimeDefaults = Readonly<{
  soundCpuRuntimeEnabled: false
  workerExecutionEnabled: false
  mediaProcessingEnabled: false
  artifactWriteEnabled: false
  storageTransferEnabled: false
  signedUrlCreationEnabled: false
  publicArtifactCreationEnabled: false
  databaseMutationEnabled: false
  sqlExecutionEnabled: false
  providerCallEnabled: false
  modelCallEnabled: false
}>

export const SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS = {
  soundCpuRuntimeEnabled: false,
  workerExecutionEnabled: false,
  mediaProcessingEnabled: false,
  artifactWriteEnabled: false,
  storageTransferEnabled: false,
  signedUrlCreationEnabled: false,
  publicArtifactCreationEnabled: false,
  databaseMutationEnabled: false,
  sqlExecutionEnabled: false,
  providerCallEnabled: false,
  modelCallEnabled: false,
} as const satisfies SoundCpuPrivateManifestRuntimeDefaults

export type SoundCpuPrivateMediaManifest = Readonly<{
  schemaVersion: 'sound-cpu-private-media-manifest-v1'
  approvedPlanSnapshotId: string
  workspaceId: string
  projectId: string
  jobId: string
  idempotencyKey: string
  workerName: SoundCpuPrivateManifestWorkerName
  jobType: SoundCpuPrivateManifestJobType
  privateMediaAssetIds: readonly string[]
  plannedPrivateArtifactIds: readonly string[]
  runtimeDefaults: SoundCpuPrivateManifestRuntimeDefaults
}>

export type SoundCpuPrivateMediaManifestInput = Readonly<{
  approvedPlanSnapshotId?: string
  workspaceId?: string
  projectId?: string
  jobId?: string
  idempotencyKey?: string
  workerName?: string
  jobType?: string
  privateMediaAssetIds?: readonly string[]
  plannedPrivateArtifactIds?: readonly string[]
  runtimeDefaults?: Partial<Record<keyof SoundCpuPrivateManifestRuntimeDefaults, boolean>>
}>

export type SoundCpuPrivateMediaManifestValidationIssue = Readonly<{
  code:
    | 'missing_required_field'
    | 'invalid_worker_name'
    | 'invalid_job_type'
    | 'invalid_private_media_asset_id'
    | 'invalid_planned_private_artifact_id'
    | 'runtime_flag_must_remain_false'
  field: string
  message: string
}>

export type SoundCpuPrivateMediaManifestValidationResult = Readonly<{
  ok: boolean
  issues: readonly SoundCpuPrivateMediaManifestValidationIssue[]
  runtimeDefaults: SoundCpuPrivateManifestRuntimeDefaults
  acceptedForManifestInstanceCreationToday: false
  acceptedForMediaProcessingToday: false
  acceptedForArtifactCreationToday: false
  acceptedForWorkerDispatchToday: false
}>

export function validateSoundCpuPrivateMediaManifest(
  input: SoundCpuPrivateMediaManifestInput,
): SoundCpuPrivateMediaManifestValidationResult {
  const issues: SoundCpuPrivateMediaManifestValidationIssue[] = []

  for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey'] as const) {
    if (!isNonEmptyString(input[field])) {
      issues.push({
        code: 'missing_required_field',
        field,
        message: `${field} is required for a private SOUND CPU manifest contract.`,
      })
    }
  }

  if (!isSoundCpuPrivateManifestWorkerName(input.workerName)) {
    issues.push({
      code: 'invalid_worker_name',
      field: 'workerName',
      message: 'workerName must be one of the accepted SOUND CPU worker names.',
    })
  }

  if (!isSoundCpuPrivateManifestJobType(input.jobType)) {
    issues.push({
      code: 'invalid_job_type',
      field: 'jobType',
      message: 'jobType must be one of the accepted SOUND CPU planning job types.',
    })
  }

  for (const [index, assetId] of (input.privateMediaAssetIds ?? []).entries()) {
    if (!isNonEmptyString(assetId)) {
      issues.push({
        code: 'invalid_private_media_asset_id',
        field: `privateMediaAssetIds.${index}`,
        message: 'private media asset ids must be non-empty strings.',
      })
    }
  }

  for (const [index, artifactId] of (input.plannedPrivateArtifactIds ?? []).entries()) {
    if (!isNonEmptyString(artifactId)) {
      issues.push({
        code: 'invalid_planned_private_artifact_id',
        field: `plannedPrivateArtifactIds.${index}`,
        message: 'planned private artifact ids must be non-empty strings.',
      })
    }
  }

  for (const [flag, value] of Object.entries(input.runtimeDefaults ?? {})) {
    if (value !== false) {
      issues.push({
        code: 'runtime_flag_must_remain_false',
        field: `runtimeDefaults.${flag}`,
        message: 'SOUND CPU private manifest runtime flags must remain false in Phase 69.',
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    runtimeDefaults: SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS,
    acceptedForManifestInstanceCreationToday: false,
    acceptedForMediaProcessingToday: false,
    acceptedForArtifactCreationToday: false,
    acceptedForWorkerDispatchToday: false,
  }
}

function isSoundCpuPrivateManifestWorkerName(value: string | undefined): value is SoundCpuPrivateManifestWorkerName {
  return SOUND_CPU_PRIVATE_MANIFEST_WORKER_NAMES.includes(value as SoundCpuPrivateManifestWorkerName)
}

function isSoundCpuPrivateManifestJobType(value: string | undefined): value is SoundCpuPrivateManifestJobType {
  return SOUND_CPU_PRIVATE_MANIFEST_JOB_TYPES.includes(value as SoundCpuPrivateManifestJobType)
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
