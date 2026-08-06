import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { Storage } from '@google-cloud/storage'

import {
  canonicalSam31PrivateArtifactObjectCoordinateSchema,
  type CanonicalSam31PrivateArtifactPublicationPort,
} from './canonical-sam3_1-official-artifact-publication'
import type {
  CanonicalSam31PrivateObjectReadPort,
} from './canonical-sam3_1-private-artifact-ingest'

export const CANONICAL_SAM3_1_GCS_OFFICIAL_ARTIFACT_PUBLICATION_PORT_VERSION =
  'canonical-sam3_1-gcs-official-artifact-publication-port-v1' as const
export const CANONICAL_SAM3_1_GCS_PRIVATE_ARTIFACT_READ_PORT_VERSION =
  'canonical-sam3_1-gcs-private-artifact-read-port-v1' as const

const PROJECT_ID = 'reeditpro' as const
const MODEL_ARTIFACT_BUCKET =
  'reeditpro-production-reeditpro-model-artifacts' as const

type CanonicalSam31PrivateArtifactPublicationFailureCode =
  | 'artifact_identity_or_bounds_failed'
  | 'artifact_stream_invalid'
  | 'source_acquisition_failed'
  | 'source_archive_command_failed'
  | 'source_archive_stream_invalid'
  | 'source_identity_changed'
  | 'storage_authorization_failed'
  | 'storage_conflict'
  | 'storage_target_not_found'
  | 'storage_throttled'
  | 'storage_transport_unavailable'
  | 'unclassified_failure'

/**
 * Cloud-only streaming object publisher for the one-time SAM 3.1 source and
 * checkpoint ingest. A pre-existing object is never accepted implicitly:
 * uncertain outcomes require a separate exact reconciliation before a new
 * attempt ID may be used.
 */
export function createCanonicalSam31GcsOfficialArtifactPublicationPort(input: {
  readonly projectId: typeof PROJECT_ID
  readonly bucketName: typeof MODEL_ARTIFACT_BUCKET
  readonly storage?: Storage
}): CanonicalSam31PrivateArtifactPublicationPort & {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GCS_OFFICIAL_ARTIFACT_PUBLICATION_PORT_VERSION
} {
  if (
    input.projectId !== PROJECT_ID
    || input.bucketName !== MODEL_ARTIFACT_BUCKET
  ) throw new Error('SAM 3.1 GCS publication coordinate is not canonical.')
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_GCS_OFFICIAL_ARTIFACT_PUBLICATION_PORT_VERSION,
    async publishCreateOnlyAndReread(
      value: Parameters<
        CanonicalSam31PrivateArtifactPublicationPort[
          'publishCreateOnlyAndReread'
        ]
      >[0],
    ) {
      assertPublicationInput(value)
      const bucket = storage.bucket(value.bucketName)
      const liveFile = bucket.file(value.objectName)
      const measurement = {
        byteLength: 0,
        digest: createHash('sha256'),
      }
      try {
        await pipeline(
          Readable.from(measureAndBound(value.body, value, measurement)),
          liveFile.createWriteStream({
            resumable: true,
            validation: 'crc32c',
            preconditionOpts: { ifGenerationMatch: 0 },
            metadata: {
              contentType: value.contentType,
              cacheControl: 'private, no-store',
              metadata: {
                'weeditpro-artifact-kind': value.contentType
                  === 'application/x-tar'
                  ? 'sam31-official-source-archive'
                  : 'sam31-official-gated-checkpoint',
                'weeditpro-create-only': 'true',
              },
            },
          }),
        )
      } catch (error) {
        if (cloudErrorCode(error) === 412) throw new Error(
          'SAM 3.1 artifact object already exists; exact reconciliation is required.',
          { cause: error },
        )
        const failureCode = classifyPublicationFailure(error)
        throw new Error(
          `SAM 3.1 private artifact streaming publication failed [${
            failureCode
          }].`,
          { cause: error },
        )
      }
      const publishedSha256 = measurement.digest.digest('hex')
      assertExpectedMeasurement(value, measurement.byteLength, publishedSha256)
      const [metadata] = await liveFile.getMetadata()
      const generation = String(metadata.generation ?? '')
      const etag = String(metadata.etag ?? '')
      const contentType = String(metadata.contentType ?? '')
      const metadataByteLength = Number(metadata.size ?? -1)
      if (
        !/^[1-9][0-9]{0,30}$/u.test(generation)
        || !etag
        || contentType !== value.contentType
        || metadataByteLength !== measurement.byteLength
      ) throw new Error('SAM 3.1 published artifact metadata is invalid.')
      const exactFile = bucket.file(value.objectName, { generation })
      const reread = await hashBoundedStream(
        exactFile.createReadStream({
          decompress: false,
          validation: 'crc32c',
        }),
        value.maximumByteLength,
      )
      const [stableMetadata] = await exactFile.getMetadata()
      if (
        reread.byteLength !== measurement.byteLength
        || reread.sha256 !== publishedSha256
        || String(stableMetadata.generation ?? '') !== generation
        || String(stableMetadata.etag ?? '') !== etag
        || String(stableMetadata.contentType ?? '') !== value.contentType
        || Number(stableMetadata.size ?? -1) !== measurement.byteLength
      ) throw new Error(
        'SAM 3.1 private artifact exact-generation reread failed.',
      )
      return canonicalSam31PrivateArtifactObjectCoordinateSchema.parse({
        projectId: value.projectId,
        bucketName: value.bucketName,
        objectName: value.objectName,
        generation,
        etag,
        byteLength: reread.byteLength,
        sha256: reread.sha256,
      })
    },
  })
}

/**
 * Exact-generation streaming rereader used by the private ingest owner. It
 * never materializes a multi-gigabyte checkpoint on the application host.
 */
export function createCanonicalSam31GcsPrivateArtifactReadPort(input: {
  readonly projectId: typeof PROJECT_ID
  readonly bucketName: typeof MODEL_ARTIFACT_BUCKET
  readonly storage?: Storage
}): CanonicalSam31PrivateObjectReadPort & {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GCS_PRIVATE_ARTIFACT_READ_PORT_VERSION
} {
  if (
    input.projectId !== PROJECT_ID
    || input.bucketName !== MODEL_ARTIFACT_BUCKET
  ) throw new Error('SAM 3.1 GCS private read scope is not canonical.')
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const port: CanonicalSam31PrivateObjectReadPort & {
    readonly schemaVersion:
      typeof CANONICAL_SAM3_1_GCS_PRIVATE_ARTIFACT_READ_PORT_VERSION
  } = {
    schemaVersion: CANONICAL_SAM3_1_GCS_PRIVATE_ARTIFACT_READ_PORT_VERSION,
    async readExact(untrusted) {
      const coordinate = canonicalSam31PrivateArtifactObjectCoordinateSchema
        .parse(untrusted)
      if (
        coordinate.projectId !== input.projectId
        || coordinate.bucketName !== input.bucketName
        || !coordinate.objectName.startsWith(
          'private/model-artifacts/sam3_1/',
        )
        || coordinate.objectName.includes('..')
        || coordinate.objectName.includes('\\')
        || coordinate.objectName.includes('//')
      ) throw new Error('SAM 3.1 private artifact read path is invalid.')
      const exact = storage.bucket(coordinate.bucketName).file(
        coordinate.objectName,
        { generation: coordinate.generation },
      )
      let before: Record<string, unknown>
      try {
        const response = await exact.getMetadata()
        before = response[0] as unknown as Record<string, unknown>
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      assertExactReadMetadata(before, coordinate)
      let bodyConsumed = false
      return Object.freeze({
        generationBeforeRead: coordinate.generation,
        etagBeforeRead: coordinate.etag,
        contentType: String(before.contentType ?? ''),
        body: markBodyConsumed(exact.createReadStream({
          decompress: false,
          validation: 'crc32c',
        }), () => { bodyConsumed = true }),
        generationAfterRead: coordinate.generation,
        etagAfterRead: coordinate.etag,
        async rereadMetadataAfterBodyConsumed() {
          if (!bodyConsumed) {
            throw new Error('SAM 3.1 artifact body was not fully consumed.')
          }
          const afterResponse = await exact.getMetadata()
          const after = afterResponse[0] as unknown as Record<string, unknown>
          assertExactReadMetadata(after, coordinate)
          return Object.freeze({
            generationAfterRead: coordinate.generation,
            etagAfterRead: coordinate.etag,
          })
        },
      })
    },
  }
  return Object.freeze(port)
}

async function* markBodyConsumed(
  body: AsyncIterable<Uint8Array>,
  markConsumed: () => void,
): AsyncIterable<Uint8Array> {
  for await (const chunk of body) yield chunk
  markConsumed()
}

function assertPublicationInput(input: {
  readonly projectId: string
  readonly bucketName: string
  readonly objectName: string
  readonly contentType: string
  readonly body: AsyncIterable<Uint8Array>
  readonly minimumByteLength: number
  readonly maximumByteLength: number
  readonly expectedByteLength?: number
  readonly expectedSha256?: string
}): void {
  if (
    input.projectId !== PROJECT_ID
    || input.bucketName !== MODEL_ARTIFACT_BUCKET
    || !input.objectName.startsWith('private/model-artifacts/sam3_1/')
    || input.objectName.includes('..')
    || input.objectName.includes('\\')
    || input.objectName.includes('//')
    || (input.contentType !== 'application/x-tar'
      && input.contentType !== 'application/octet-stream')
    || !input.body
    || typeof input.body[Symbol.asyncIterator] !== 'function'
    || !Number.isSafeInteger(input.minimumByteLength)
    || !Number.isSafeInteger(input.maximumByteLength)
    || input.minimumByteLength < 1
    || input.maximumByteLength < input.minimumByteLength
    || (input.expectedByteLength !== undefined
      && (!Number.isSafeInteger(input.expectedByteLength)
        || input.expectedByteLength < input.minimumByteLength
        || input.expectedByteLength > input.maximumByteLength))
    || (input.expectedSha256 !== undefined
      && !/^[a-f0-9]{64}$/u.test(input.expectedSha256))
  ) throw new Error('SAM 3.1 private artifact publication input is invalid.')
}

function assertExactReadMetadata(
  metadata: Record<string, unknown>,
  coordinate: {
    readonly generation: string
    readonly etag: string
    readonly byteLength: number
    readonly objectName: string
  },
): void {
  const contentType = String(metadata.contentType ?? '')
  const expectedContentType = coordinate.objectName.endsWith('.tar')
    ? 'application/x-tar'
    : 'application/octet-stream'
  if (
    String(metadata.generation ?? '') !== coordinate.generation
    || String(metadata.etag ?? '') !== coordinate.etag
    || Number(metadata.size ?? -1) !== coordinate.byteLength
    || contentType !== expectedContentType
  ) throw new Error('SAM 3.1 private artifact metadata changed.')
}

async function* measureAndBound(
  body: AsyncIterable<Uint8Array>,
  bounds: {
    readonly minimumByteLength: number
    readonly maximumByteLength: number
    readonly expectedByteLength?: number
    readonly expectedSha256?: string
  },
  measurement: {
    byteLength: number
    readonly digest: ReturnType<typeof createHash>
  },
): AsyncIterable<Uint8Array> {
  for await (const chunk of body) {
    if (!(chunk instanceof Uint8Array) || chunk.byteLength === 0) {
      throw new Error('SAM 3.1 official artifact stream is invalid.')
    }
    measurement.byteLength += chunk.byteLength
    if (
      !Number.isSafeInteger(measurement.byteLength)
      || measurement.byteLength > bounds.maximumByteLength
    ) throw new Error('SAM 3.1 official artifact exceeds its byte bound.')
    measurement.digest.update(chunk)
    yield chunk
  }
  if (measurement.byteLength < bounds.minimumByteLength) {
    throw new Error('SAM 3.1 official artifact is below its byte bound.')
  }
  assertExpectedMeasurement(
    bounds,
    measurement.byteLength,
    measurement.digest.copy().digest('hex'),
  )
}

function assertExpectedMeasurement(
  input: { readonly expectedByteLength?: number; readonly expectedSha256?: string },
  byteLength: number,
  sha256: string,
): void {
  if (
    (input.expectedByteLength !== undefined
      && input.expectedByteLength !== byteLength)
    || (input.expectedSha256 !== undefined
      && input.expectedSha256 !== sha256)
  ) throw new Error('SAM 3.1 official artifact identity is not approved.')
}

async function hashBoundedStream(
  stream: AsyncIterable<Uint8Array>,
  maximumByteLength: number,
): Promise<{ readonly byteLength: number; readonly sha256: string }> {
  const digest = createHash('sha256')
  let byteLength = 0
  for await (const chunk of stream) {
    if (!(chunk instanceof Uint8Array) || chunk.byteLength === 0) {
      throw new Error('SAM 3.1 artifact reread stream is invalid.')
    }
    byteLength += chunk.byteLength
    if (!Number.isSafeInteger(byteLength) || byteLength > maximumByteLength) {
      throw new Error('SAM 3.1 artifact reread exceeds its byte bound.')
    }
    digest.update(chunk)
  }
  return { byteLength, sha256: digest.digest('hex') }
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return
  let code: unknown
  try {
    code = Reflect.get(error, 'code')
  } catch {
    return
  }
  if (typeof code === 'number') return code
  if (typeof code === 'string' && /^[0-9]{3}$/u.test(code)) {
    return Number.parseInt(code, 10)
  }
}

/**
 * Returns only a bounded, enumerated stage code. Raw cloud, Git, URL, path,
 * credential, and provider diagnostics remain in the private error cause and
 * can never be copied into the operator-facing structured log.
 */
function classifyPublicationFailure(
  error: unknown,
): CanonicalSam31PrivateArtifactPublicationFailureCode {
  let cursor: unknown = error
  for (let depth = 0; depth < 8 && cursor; depth += 1) {
    const cloudCode = cloudErrorCode(cursor)
    if (cloudCode === 401 || cloudCode === 403) {
      return 'storage_authorization_failed'
    }
    if (cloudCode === 404) return 'storage_target_not_found'
    if (cloudCode === 409) return 'storage_conflict'
    if (cloudCode === 429) return 'storage_throttled'
    if (
      cloudCode === 408
      || cloudCode === 500
      || cloudCode === 502
      || cloudCode === 503
      || cloudCode === 504
    ) return 'storage_transport_unavailable'

    const message = safeStaticErrorMessage(cursor)
    if (message === 'SAM 3.1 official source acquisition failed.') {
      return 'source_acquisition_failed'
    }
    if (message === 'SAM 3.1 official Git source identity changed.') {
      return 'source_identity_changed'
    }
    if (
      message === 'SAM 3.1 official source archive command failed.'
      || message
        === 'SAM 3.1 official source archive command did not complete.'
    ) return 'source_archive_command_failed'
    if (message === 'SAM 3.1 Git archive stream is invalid.') {
      return 'source_archive_stream_invalid'
    }
    if (message === 'SAM 3.1 official artifact stream is invalid.') {
      return 'artifact_stream_invalid'
    }
    if (
      message === 'SAM 3.1 official artifact exceeds its byte bound.'
      || message === 'SAM 3.1 official artifact is below its byte bound.'
      || message === 'SAM 3.1 official artifact identity is not approved.'
    ) return 'artifact_identity_or_bounds_failed'

    cursor = safeErrorCause(cursor)
  }
  return 'unclassified_failure'
}

function safeStaticErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error)) return
  try {
    return error.message
  } catch {
    return
  }
}

function safeErrorCause(error: unknown): unknown {
  if (!error || typeof error !== 'object') return
  try {
    return Reflect.get(error, 'cause')
  } catch {
    return
  }
}
