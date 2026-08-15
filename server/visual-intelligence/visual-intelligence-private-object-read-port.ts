import { Storage } from '@google-cloud/storage'

import { ApiError } from '../errors/api-error'

export const VISUAL_INTELLIGENCE_GCS_PRIVATE_OBJECT_READ_PORT_VERSION =
  'visual-intelligence-gcs-private-object-read-port-v1' as const

const DEFAULT_MAXIMUM_OBJECT_BYTES = 32 * 1024 * 1024
const MAXIMUM_OBJECT_BYTES = 64 * 1024 * 1024
const GCS_BUCKET = /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u
const GENERATION = /^[1-9][0-9]{0,30}$/u
const OBJECT_NAME = /^[A-Za-z0-9][A-Za-z0-9._:/@+=,-]{0,2047}$/u

/**
 * Server-only immutable object reread boundary used by Visual Intelligence
 * release and account-effective pricing authorities. Keeping this contract in
 * the capability prevents Visual Intelligence from depending on a transcript
 * worker's implementation-specific storage port.
 */
export interface VisualIntelligencePrivateObjectReadPort {
  readExact(input: {
    readonly bucketName: string
    readonly objectName: string
    readonly generation?: string
    readonly etag?: string
  }): Promise<{
    readonly body: Buffer
    readonly generation: string
    readonly etag: string
    readonly contentType: string
  } | null>
}

/**
 * Reads only a generation-stable private GCS object. It never signs a URL,
 * accepts a public locator, or returns an unpinned live generation after the
 * metadata read. Callers independently validate content type, digest, schema,
 * and authority-specific bounds.
 */
export function createVisualIntelligenceGcsPrivateObjectReadPort(input: {
  readonly projectId: string
  readonly storage?: Storage
  readonly maximumObjectBytes?: number
}): VisualIntelligencePrivateObjectReadPort {
  const maximumObjectBytes = input.maximumObjectBytes
    ?? DEFAULT_MAXIMUM_OBJECT_BYTES
  if (
    !safeId(input.projectId)
    || !Number.isSafeInteger(maximumObjectBytes)
    || maximumObjectBytes < 2
    || maximumObjectBytes > MAXIMUM_OBJECT_BYTES
  ) throw notReady('visual_intelligence_private_read_configuration_invalid')
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  return Object.freeze({
    async readExact(value: {
      readonly bucketName: string
      readonly objectName: string
      readonly generation?: string
      readonly etag?: string
    }) {
      validateCoordinate(value)
      const bucket = storage.bucket(value.bucketName)
      const liveOrExact = bucket.file(value.objectName, value.generation
        ? { generation: value.generation }
        : undefined)
      let metadata: Record<string, unknown>
      try {
        const [raw] = await liveOrExact.getMetadata()
        metadata = raw as unknown as Record<string, unknown>
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      const generation = String(metadata.generation ?? '')
      const etag = String(metadata.etag ?? '')
      const contentType = String(metadata.contentType ?? '')
      const size = Number(metadata.size ?? -1)
      if (
        !GENERATION.test(generation)
        || (value.generation && generation !== value.generation)
        || !etag
        || (value.etag && etag !== value.etag)
        || !Number.isSafeInteger(size)
        || size < 2
        || size > maximumObjectBytes
        || !contentType
        || contentType.length > 255
      ) throw conflict('visual_intelligence_private_object_metadata_invalid')
      const exact = bucket.file(value.objectName, { generation })
      const [body] = await exact.download({ validation: 'crc32c' })
      const [stableRaw] = await exact.getMetadata()
      const stable = stableRaw as unknown as Record<string, unknown>
      if (
        body.byteLength !== size
        || String(stable.generation ?? '') !== generation
        || String(stable.etag ?? '') !== etag
        || String(stable.contentType ?? '') !== contentType
      ) throw conflict('visual_intelligence_private_object_reread_changed')
      return Object.freeze({
        body: Buffer.from(body),
        generation,
        etag,
        contentType,
      })
    },
  })
}

function validateCoordinate(value: {
  bucketName: string
  objectName: string
  generation?: string
  etag?: string
}): void {
  if (
    !GCS_BUCKET.test(value.bucketName)
    || !OBJECT_NAME.test(value.objectName)
    || value.objectName.startsWith('/')
    || value.objectName.endsWith('/')
    || value.objectName.includes('//')
    || value.objectName.includes('..')
    || value.objectName.includes('\\')
    || (value.generation !== undefined
      && !GENERATION.test(value.generation))
    || (value.etag !== undefined
      && (value.etag.length < 1 || value.etag.length > 512))
  ) throw notReady('visual_intelligence_private_read_coordinate_invalid')
}

function safeId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)
    && !value.includes('..')
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const code = Reflect.get(error, 'code')
  return typeof code === 'number' ? code : undefined
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The private Visual Intelligence object reader is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The private Visual Intelligence object changed during exact reread.',
    409,
    { requiredGate },
  )
}
