export const SOUND_CPU_WORKER_NAMES = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const SOUND_CPU_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export type SoundCpuWorkerName = (typeof SOUND_CPU_WORKER_NAMES)[number]
export type SoundCpuJobType = (typeof SOUND_CPU_JOB_TYPES)[number]

export type SoundCpuAttemptMetadata = Readonly<{
  attemptNumber: number
  maxAttempts: number
  requestedAtIso: string
}>

export type SoundCpuRuntimeDisabledFlags = Readonly<{
  REEDITPRO_SOUND_CPU_RUNTIME_ENABLED: '0'
  REEDITPRO_WORKER_EXECUTION_ENABLED: '0'
  REEDITPRO_MEDIA_PROCESSING_ENABLED: '0'
  REEDITPRO_SUPABASE_MUTATION_ENABLED: '0'
  REEDITPRO_ARTIFACT_WRITE_ENABLED: '0'
}>

export type SoundCpuJobContractInput = Readonly<{
  approvedPlanSnapshotId: string
  workspaceId: string
  projectId: string
  jobId: string
  idempotencyKey: string
  workerName: SoundCpuWorkerName
  jobType: SoundCpuJobType
  attemptMetadata: SoundCpuAttemptMetadata
  runtimeDisabledFlags: SoundCpuRuntimeDisabledFlags
}>

export type SoundCpuBlockedStatus = 'blocked_by_owner_gate'

export type SoundCpuJobContractResult = Readonly<{
  blockedStatus: SoundCpuBlockedStatus
  blockedReason: string
  ownerGateRequired: 'WORKER_RUNTIME_JOBS'
  auditEventShape: 'sound_cpu_runtime_source_created_execution_blocked'
  noArtifactCreated: true
}>

export const SOUND_CPU_REJECTED_CONTRACT_INPUTS = [
  'raw_prompt',
  'secret_value',
  'service_role_payload',
  'signed_url_as_source_of_truth',
  'provider_output_blob',
  'model_weight_location',
  'public_artifact_target',
] as const

export function isSoundCpuWorkerName(value: string): value is SoundCpuWorkerName {
  return SOUND_CPU_WORKER_NAMES.includes(value as SoundCpuWorkerName)
}

export function isSoundCpuJobType(value: string): value is SoundCpuJobType {
  return SOUND_CPU_JOB_TYPES.includes(value as SoundCpuJobType)
}

export function createSoundCpuBlockedContractResult(reason: string): SoundCpuJobContractResult {
  return {
    blockedStatus: 'blocked_by_owner_gate',
    blockedReason: reason,
    ownerGateRequired: 'WORKER_RUNTIME_JOBS',
    auditEventShape: 'sound_cpu_runtime_source_created_execution_blocked',
    noArtifactCreated: true,
  }
}
