import { z } from 'zod'
import { idSchema } from './common-schemas'

export const SOUND_CPU_WORKER_ROUTE_WORKER_NAMES = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const SOUND_CPU_WORKER_ROUTE_IMAGES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
] as const

export const SOUND_CPU_WORKER_ROUTE_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export const soundCpuWorkerRouteDisabledFlagsSchema = z.object({
  routeExecutionEnabled: z.literal(false),
  workerDispatchExecutionEnabled: z.literal(false),
  mediaProcessingEnabled: z.literal(false),
  supabaseMutationEnabled: z.literal(false),
  sqlExecutionEnabled: z.literal(false),
  storageObjectCreationEnabled: z.literal(false),
  signedUrlCreationEnabled: z.literal(false),
  publicArtifactCreationEnabled: z.literal(false),
  providerModelCallEnabled: z.literal(false),
  dockerCloudRunExecutionEnabled: z.literal(false),
}).strict()

export const soundCpuWorkerRouteAttemptMetadataSchema = z.object({
  attemptNumber: z.number().int().min(1).optional(),
  maxAttempts: z.number().int().min(1).optional(),
  requestedAtIso: z.string().min(1).optional(),
}).strict().optional()

export const createSoundCpuWorkerJobRouteSchema = z.object({
  approvedPlanSnapshotId: idSchema,
  workspaceId: idSchema,
  projectId: idSchema,
  jobId: idSchema,
  idempotencyKey: z.string().min(1),
  workerName: z.enum(SOUND_CPU_WORKER_ROUTE_WORKER_NAMES),
  imageName: z.enum(SOUND_CPU_WORKER_ROUTE_IMAGES),
  jobType: z.enum(SOUND_CPU_WORKER_ROUTE_JOB_TYPES),
  privateMediaManifestId: idSchema,
  attemptMetadata: soundCpuWorkerRouteAttemptMetadataSchema,
  staticOnlyRuntimeFlags: soundCpuWorkerRouteDisabledFlagsSchema,
}).strict()

export const getSoundCpuWorkerJobStatusRouteSchema = z.object({
  jobId: idSchema,
}).strict()

export type SoundCpuWorkerRouteDisabledFlags = z.infer<typeof soundCpuWorkerRouteDisabledFlagsSchema>
export type CreateSoundCpuWorkerJobRouteInput = z.infer<typeof createSoundCpuWorkerJobRouteSchema>
export type GetSoundCpuWorkerJobStatusRouteInput = z.infer<typeof getSoundCpuWorkerJobStatusRouteSchema>

export const SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS: SoundCpuWorkerRouteDisabledFlags = {
  routeExecutionEnabled: false,
  workerDispatchExecutionEnabled: false,
  mediaProcessingEnabled: false,
  supabaseMutationEnabled: false,
  sqlExecutionEnabled: false,
  storageObjectCreationEnabled: false,
  signedUrlCreationEnabled: false,
  publicArtifactCreationEnabled: false,
  providerModelCallEnabled: false,
  dockerCloudRunExecutionEnabled: false,
}
