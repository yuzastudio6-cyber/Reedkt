export const SOUND_CPU_SYNTHETIC_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export type SoundCpuSyntheticJobType = (typeof SOUND_CPU_SYNTHETIC_JOB_TYPES)[number]

export const SOUND_CPU_SYNTHETIC_WORKERS = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export type SoundCpuSyntheticWorker = (typeof SOUND_CPU_SYNTHETIC_WORKERS)[number]

export const SOUND_CPU_SYNTHETIC_IMAGES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
] as const

export type SoundCpuSyntheticImage = (typeof SOUND_CPU_SYNTHETIC_IMAGES)[number]

export const SOUND_CPU_SYNTHETIC_REJECTED_PAYLOAD_FIELDS = [
  'rawPrompt',
  'uploadedMediaUri',
  'signedUrl',
  'publicArtifactUrl',
  'mediaFilePath',
  'providerOutputBlob',
  'secretValue',
  'serviceRolePayload',
  'modelWeightPath',
  'artifactWriteTarget',
  'supabaseMutation',
  'sqlText',
  'dockerCommand',
  'gcpCommand',
] as const

export type SoundCpuSyntheticRejectedPayloadField = (typeof SOUND_CPU_SYNTHETIC_REJECTED_PAYLOAD_FIELDS)[number]

export const SOUND_CPU_SYNTHETIC_STATIC_RUNTIME_FLAGS = {
  mediaFileOpenEnabled: false,
  mediaProcessingEnabled: false,
  audioreadAudioOpenEnabled: false,
  pydubFileImportExportEnabled: false,
  ffmpegEnabled: false,
  ffprobeEnabled: false,
  dockerRunEnabled: false,
  dockerPushEnabled: false,
  gcpEnabled: false,
  supabaseEnabled: false,
  sqlEnabled: false,
  artifactWriteEnabled: false,
  toolExecutionEnabled: false,
  workerExecutionEnabled: false,
  routeExecutionEnabled: false,
} as const

export type SoundCpuSyntheticStaticRuntimeFlag = keyof typeof SOUND_CPU_SYNTHETIC_STATIC_RUNTIME_FLAGS

export type SoundCpuSyntheticStaticRuntimeFlags = Record<SoundCpuSyntheticStaticRuntimeFlag, false>

export interface SoundCpuSyntheticAttemptMetadata {
  attempt: number
  source: string
  ownerReviewDecision?: string
}

export interface SoundCpuSyntheticRoutePayload {
  approvedPlanSnapshotId: string
  workspaceId: string
  projectId: string
  jobId: string
  idempotencyKey: string
  workerName: SoundCpuSyntheticWorker
  imageName: SoundCpuSyntheticImage
  jobType: SoundCpuSyntheticJobType
  attemptMetadata: SoundCpuSyntheticAttemptMetadata
  syntheticFixtureDescriptor: string
  staticOnlyRuntimeFlags: SoundCpuSyntheticStaticRuntimeFlags
}

export interface SoundCpuSyntheticRouteContract {
  jobType: SoundCpuSyntheticJobType
  workerName: SoundCpuSyntheticWorker
  imageName: SoundCpuSyntheticImage
  syntheticFixtureDescriptor: string
  decisionMode: string
}

export interface SoundCpuSyntheticRouteDecision {
  accepted: true
  jobType: SoundCpuSyntheticJobType
  workerName: SoundCpuSyntheticWorker
  imageName: SoundCpuSyntheticImage
  syntheticFixtureDescriptor: string
  decisionMode: string
}

export type SoundCpuSyntheticRouteRejectionReason =
  | 'payload_not_record'
  | 'rejected_payload_field'
  | 'missing_required_field'
  | 'invalid_required_field'
  | 'invalid_runtime_flags'
  | 'unsafe_runtime_flag'
  | 'unknown_job_type'
  | 'worker_mismatch'
  | 'image_mismatch'
  | 'fixture_mismatch'

export interface SoundCpuSyntheticRouteRejection {
  accepted: false
  reason: SoundCpuSyntheticRouteRejectionReason
  field?: string
  expected?: string
  received?: string
}

export type SoundCpuSyntheticRouteResult = SoundCpuSyntheticRouteDecision | SoundCpuSyntheticRouteRejection
