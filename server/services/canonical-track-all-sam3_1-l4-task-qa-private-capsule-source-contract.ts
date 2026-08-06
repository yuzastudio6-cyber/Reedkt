import { z } from 'zod'

export const TRACK_ALL_L4_TASK_QA_PROJECT_ID = 'reeditpro' as const
export const TRACK_ALL_L4_TASK_QA_BUILD_INPUT_BUCKET =
  'reeditpro-production-reeditpro-image-build-inputs' as const
export const TRACK_ALL_L4_TASK_QA_BUILD_INPUT_PREFIX =
  'private/image-build-inputs/track-all-l4-task-qa/' as const
export const TRACK_ALL_L4_TASK_QA_MAXIMUM_BUILD_SOURCE_BYTES =
  16 * 1024 * 1024 * 1024
export const TRACK_ALL_L4_TASK_QA_MAXIMUM_UNCOMPRESSED_BUILD_SOURCE_BYTES =
  24 * 1024 * 1024 * 1024
export const TRACK_ALL_L4_TASK_QA_MAXIMUM_BUILD_SOURCE_ENTRIES = 10_000

export const canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema =
  z.object({
    projectId: z.literal(TRACK_ALL_L4_TASK_QA_PROJECT_ID),
    bucketName: z.literal(TRACK_ALL_L4_TASK_QA_BUILD_INPUT_BUCKET),
    objectName: z.string().min(1).max(1_024)
      .refine((value) => value.startsWith(
        TRACK_ALL_L4_TASK_QA_BUILD_INPUT_PREFIX,
      ))
      .refine((value) => value.endsWith('.tar.gz'))
      .refine((value) => !value.includes('..') && !value.includes('\\')),
    generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
    etag: z.string().trim().min(1).max(512),
    byteLength: z.number().int().positive()
      .max(TRACK_ALL_L4_TASK_QA_MAXIMUM_BUILD_SOURCE_BYTES),
    sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  }).strict()

export const canonicalTrackAllSam31L4TaskQaBuildSourceEntrySchema = z.object({
  path: z.string().min(1).max(512).refine(isSafeArchivePath),
  byteLength: z.number().int().positive()
    .max(TRACK_ALL_L4_TASK_QA_MAXIMUM_UNCOMPRESSED_BUILD_SOURCE_BYTES),
  sha256: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict()

export type CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinate = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema
>
export type CanonicalTrackAllSam31L4TaskQaBuildSourceEntry = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaBuildSourceEntrySchema
>

function isSafeArchivePath(path: string): boolean {
  return !path.startsWith('/')
    && !path.includes('\\')
    && path.split('/').every((part) =>
      part.length > 0 && part !== '.' && part !== '..')
}
