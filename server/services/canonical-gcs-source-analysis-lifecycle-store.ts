import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'

import { ApiError } from '../errors/api-error'

export const CANONICAL_GCS_CREATE_ONLY_JSON_OBJECT_PORT_VERSION =
  'canonical-gcs-create-only-json-object-port-v1' as const

const MAXIMUM_RECORD_BYTES = 32 * 1024 * 1024
const SAFE_OBJECT_PATH = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,1023}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u

/**
 * Small, provider-neutral persistence primitive shared by Visual Intelligence,
 * SAM 3.1, transcript, and GPU lifecycle owners. It intentionally contains no
 * retired Qwen work-request or lifecycle schema.
 */
export interface CanonicalCreateOnlyJsonObjectPort {
  createOnly(input: {
    readonly objectPath: string
    readonly body: Buffer
    readonly contentSha256: string
  }): Promise<'created' | 'already_exists'>
  readExact(objectPath: string): Promise<Buffer | null>
}

export function createCanonicalGcsSourceAnalysisJsonObjectPort(input: {
  readonly storage: Storage
  readonly bucketName: string
  readonly acceptedReadContentTypes?: readonly (
    'application/json' | 'application/octet-stream'
  )[]
}): CanonicalCreateOnlyJsonObjectPort {
  if (!input.storage || !validBucketName(input.bucketName)) {
    throw notReady('canonical_gcs_json_object_port_configuration_invalid')
  }
  const acceptedReadContentTypes = new Set(
    input.acceptedReadContentTypes ?? ['application/json'],
  )
  if (
    acceptedReadContentTypes.size < 1
    || acceptedReadContentTypes.size > 2
    || !acceptedReadContentTypes.has('application/json')
  ) throw notReady('canonical_gcs_json_read_content_types_invalid')
  const bucket = input.storage.bucket(input.bucketName)
  return Object.freeze({
    async createOnly(value: {
      readonly objectPath: string
      readonly body: Buffer
      readonly contentSha256: string
    }) {
      assertCreateInput(value)
      const file = bucket.file(value.objectPath, {
        preconditionOpts: { ifGenerationMatch: 0 },
      })
      try {
        await file.save(value.body, {
          contentType: 'application/json',
          resumable: false,
          preconditionOpts: { ifGenerationMatch: 0 },
        })
        const reread = await readExactGcsObject({
          storage: input.storage,
          bucketName: input.bucketName,
          objectPath: value.objectPath,
          acceptedReadContentTypes,
        })
        if (!reread || sha256(reread) !== value.contentSha256) {
          throw conflict('canonical_gcs_create_only_reread_mismatch')
        }
        return 'created' as const
      } catch (error) {
        if (cloudErrorCode(error) !== 412) throw error
        const existing = await readExactGcsObject({
          storage: input.storage,
          bucketName: input.bucketName,
          objectPath: value.objectPath,
          acceptedReadContentTypes,
        })
        if (!existing || sha256(existing) !== value.contentSha256) {
          throw conflict('canonical_gcs_create_only_collision')
        }
        return 'already_exists' as const
      }
    },
    readExact(objectPath: string) {
      assertObjectPath(objectPath)
      return readExactGcsObject({
        storage: input.storage,
        bucketName: input.bucketName,
        objectPath,
        acceptedReadContentTypes,
      })
    },
  })
}

async function readExactGcsObject(input: {
  readonly storage: Storage
  readonly bucketName: string
  readonly objectPath: string
  readonly acceptedReadContentTypes: ReadonlySet<string>
}): Promise<Buffer | null> {
  assertObjectPath(input.objectPath)
  const liveFile = input.storage.bucket(input.bucketName).file(input.objectPath)
  let metadata: Record<string, unknown>
  try {
    const result = await liveFile.getMetadata()
    metadata = result[0] as unknown as Record<string, unknown>
  } catch (error) {
    if (cloudErrorCode(error) === 404) return null
    throw error
  }
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const size = Number(metadata.size ?? -1)
  if (
    !/^[1-9][0-9]{0,30}$/u.test(generation)
    || !etag
    || !Number.isSafeInteger(size)
    || size < 2
    || size > MAXIMUM_RECORD_BYTES
    || !input.acceptedReadContentTypes.has(String(metadata.contentType ?? ''))
  ) throw conflict('canonical_gcs_json_object_metadata_invalid')
  const exactFile = input.storage.bucket(input.bucketName).file(
    input.objectPath,
    { generation },
  )
  const [body] = await exactFile.download({ validation: 'crc32c' })
  const [stable] = await exactFile.getMetadata()
  if (
    body.byteLength !== size
    || String(stable.generation ?? '') !== generation
    || String(stable.etag ?? '') !== etag
  ) throw conflict('canonical_gcs_json_object_identity_changed')
  return body
}

function assertCreateInput(value: {
  readonly objectPath: string
  readonly body: Buffer
  readonly contentSha256: string
}): void {
  assertObjectPath(value.objectPath)
  if (
    !Buffer.isBuffer(value.body)
    || value.body.byteLength < 2
    || value.body.byteLength > MAXIMUM_RECORD_BYTES
    || !RAW_SHA256.test(value.contentSha256)
    || sha256(value.body) !== value.contentSha256
  ) throw conflict('canonical_gcs_json_object_create_input_invalid')
}

function assertObjectPath(value: string): void {
  if (
    !SAFE_OBJECT_PATH.test(value)
    || value.includes('..')
    || value.startsWith('/')
    || value.endsWith('/')
    || value.includes('//')
  ) throw conflict('canonical_gcs_json_object_path_invalid')
}

function validBucketName(value: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u.test(value)
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'number' ? code : Number(code)
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical create-only JSON persistence did not match its immutable authority.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical create-only JSON persistence is not configured.',
    503,
    { requiredGate },
  )
}
