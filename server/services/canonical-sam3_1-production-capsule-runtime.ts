import { Storage, type File, type FileMetadata } from '@google-cloud/storage'
import { z } from 'zod'

import type {
  CanonicalSam31PrivateBuildCapsuleReadPort,
  CanonicalSam31PrivateCapsuleCoordinate,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'

export const CANONICAL_SAM3_1_GCS_PRODUCTION_CAPSULE_READ_PORT_VERSION =
  'canonical-sam3_1-gcs-production-capsule-read-port-v1' as const

const PROJECT_ID = 'reeditpro' as const
const BUCKET =
  'reeditpro-production-reeditpro-image-build-inputs' as const
const PREFIX =
  'private/image-build-inputs/sam3_1/production/reproducibility/' as const
const MAXIMUM_CAPSULE_BYTES = 8 * 1024 * 1024 * 1024
const CAPSULE_READ_TIMEOUT_MILLISECONDS = 30 * 60 * 1_000
const coordinateSchema = z.object({
  projectId: z.literal(PROJECT_ID),
  bucketName: z.literal(BUCKET),
  objectName: z.string().min(1).max(1_024)
    .refine((value) => value.startsWith(PREFIX))
    .refine((value) => value.endsWith('.tar.gz'))
    .refine((value) =>
      !value.includes('..')
      && !value.includes('\\')
      && !value.includes('//')),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().trim().min(1).max(512),
  byteLength: z.number().int().positive().max(MAXIMUM_CAPSULE_BYTES).safe(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict()

/** Exact-generation streaming reread; never downloads to the developer host. */
export function createCanonicalSam31GcsProductionCapsuleReadPort(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31PrivateBuildCapsuleReadPort & {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GCS_PRODUCTION_CAPSULE_READ_PORT_VERSION
} {
  const storage = input.storage ?? new Storage({
    projectId: PROJECT_ID,
    timeout: CAPSULE_READ_TIMEOUT_MILLISECONDS,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_GCS_PRODUCTION_CAPSULE_READ_PORT_VERSION,
    async readExact(untrusted: CanonicalSam31PrivateCapsuleCoordinate) {
      const coordinate = coordinateSchema.parse(untrusted)
      const generation = Number(coordinate.generation)
      if (!Number.isSafeInteger(generation) || generation <= 0) {
        throw new Error('SAM 3.1 production capsule generation is unsafe.')
      }
      const file = storage.bucket(coordinate.bucketName).file(
        coordinate.objectName,
        { generation },
      )
      let before: FileMetadata
      try {
        ;[before] = await file.getMetadata()
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      assertExactMetadata(before, coordinate)
      return Object.freeze({
        generationBeforeRead: coordinate.generation,
        etagBeforeRead: coordinate.etag,
        contentType: 'application/gzip',
        body: exactBody({
          file,
          coordinate,
          stream: file.createReadStream({
            decompress: false,
            validation: 'crc32c',
          }),
        }),
        generationAfterRead: coordinate.generation,
        etagAfterRead: coordinate.etag,
      })
    },
  })
}

async function* exactBody(input: {
  readonly file: File
  readonly coordinate: z.infer<typeof coordinateSchema>
  readonly stream: AsyncIterable<Uint8Array>
}): AsyncIterable<Uint8Array> {
  let observedBytes = 0
  for await (const chunk of input.stream) {
    if (!(chunk instanceof Uint8Array) || chunk.byteLength === 0) {
      throw new Error('SAM 3.1 production capsule stream is invalid.')
    }
    observedBytes += chunk.byteLength
    if (
      !Number.isSafeInteger(observedBytes)
      || observedBytes > input.coordinate.byteLength
      || observedBytes > MAXIMUM_CAPSULE_BYTES
    ) throw new Error('SAM 3.1 production capsule exceeded its bound.')
    yield chunk
  }
  if (observedBytes !== input.coordinate.byteLength) {
    throw new Error('SAM 3.1 production capsule ended at the wrong length.')
  }
  const [after] = await input.file.getMetadata()
  assertExactMetadata(after, input.coordinate)
}

function assertExactMetadata(
  metadata: FileMetadata,
  coordinate: z.infer<typeof coordinateSchema>,
): void {
  if (
    String(metadata.generation ?? '') !== coordinate.generation
    || String(metadata.etag ?? '') !== coordinate.etag
    || Number(metadata.size ?? -1) !== coordinate.byteLength
    || String(metadata.contentType ?? '') !== 'application/gzip'
  ) throw new Error('SAM 3.1 production capsule metadata changed.')
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = Reflect.get(error, 'code')
  if (typeof value === 'number') return value
  return typeof value === 'string' && /^[0-9]{3}$/u.test(value)
    ? Number(value)
    : undefined
}
