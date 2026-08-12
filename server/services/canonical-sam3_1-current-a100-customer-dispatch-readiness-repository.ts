import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31CurrentA100CustomerDispatchReadiness,
  type CanonicalSam31CurrentA100CustomerDispatchReadiness,
  type CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort,
} from './canonical-sam3_1-current-a100-customer-dispatch-readiness'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_REPOSITORY_VERSION =
  'canonical-sam3_1-current-a100-customer-dispatch-readiness-repository-v1' as const
export const CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_POINTER_VERSION =
  'canonical-sam3_1-current-a100-customer-dispatch-readiness-pointer-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/current-a100-customer-dispatch-readiness/v1'
const MAXIMUM_RECORD_BYTES = 512 * 1024
const MAXIMUM_POINTER_REPLACEMENT_ATTEMPTS = 4
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const safeBucket = z.string().trim().min(3).max(222)
  .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const pointerWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_POINTER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam31_current_a100_customer_dispatch_readiness_repository',
  ),
  toolId: z.literal('sam3_1'),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  runtimeReleaseRef: refSchema,
  rateAuthorityRef: refSchema,
  readinessRef: refSchema,
  readinessObservedAt: timestamp,
  readinessExpiresAt: timestamp,
  publishedAt: timestamp,
}).strict().superRefine((pointer, context) => {
  if (Date.parse(pointer.readinessExpiresAt)
      <= Date.parse(pointer.readinessObservedAt)
    || Date.parse(pointer.publishedAt)
      < Date.parse(pointer.readinessObservedAt)
    || Date.parse(pointer.publishedAt)
      >= Date.parse(pointer.readinessExpiresAt)) {
    context.addIssue({
      code: 'custom',
      message: 'A100 readiness pointer timing is inconsistent.',
    })
  }
})
const pointerSchema = pointerWithoutHashSchema.extend({
  pointerHash: rawSha256,
}).strict()
type ReadinessPointer = z.infer<typeof pointerSchema>

/**
 * Mutable only for the non-authoritative lookup pointer. The readiness record
 * itself always remains create-only and content addressed. Compare-and-swap
 * prevents two backend replicas from silently replacing each other's pointer.
 */
export interface CanonicalAtomicCurrentJsonPointerPort {
  compareAndSwap(input: {
    readonly objectPath: string
    readonly expectedContentSha256: string | null
    readonly body: Buffer
    readonly contentSha256: string
  }): Promise<'replaced' | 'raced'>
  readExact(objectPath: string): Promise<Buffer | null>
}

export interface CanonicalSam31CurrentA100CustomerDispatchReadinessRepository
  extends CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_REPOSITORY_VERSION
  readonly evidenceClass:
    'private_create_only_evidence_atomic_current_pointer_exact_reread'
  persistCurrentCreateOnly(input: {
    readonly readiness: unknown
  }): Promise<EvidenceRef>
  rereadExact(input: {
    readonly readinessRef: EvidenceRef
    readonly at: string
  }): Promise<CanonicalSam31CurrentA100CustomerDispatchReadiness | null>
}

export function createCanonicalSam31CurrentA100CustomerDispatchReadinessRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly currentPointerPort: CanonicalAtomicCurrentJsonPointerPort
    readonly prefix?: string
  },
): CanonicalSam31CurrentA100CustomerDispatchReadinessRepository {
  assertObjectPort(input.objectPort)
  assertCurrentPointerPort(input.currentPointerPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31CurrentA100CustomerDispatchReadinessRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_REPOSITORY_VERSION,
    evidenceClass:
      'private_create_only_evidence_atomic_current_pointer_exact_reread',

    async persistCurrentCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted,
        'sam31_current_a100_readiness_persist')
      const request = z.object({ readiness: z.unknown() }).strict()
        .parse(untrusted)
      const readiness =
        assertCanonicalSam31CurrentA100CustomerDispatchReadiness(
          request.readiness,
        )
      if (readiness.evidenceClass !== 'canonical_private_reread'
        || readiness.status !== 'ready_for_private_customer_dispatch'
        || !readiness.privateCustomerDispatchAllowed) {
        throw new Error('Only current qualified A100 readiness is publishable.')
      }
      const readinessRef = ref(
        readiness.readinessId,
        readiness.readinessHash,
      )
      await persistExact(
        input.objectPort,
        recordPath(prefix, readinessRef),
        encode(readiness),
      )
      const pointer = sealPointer({
        schemaVersion:
          CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_POINTER_VERSION,
        source:
          'canonical_server_sam31_current_a100_customer_dispatch_readiness_repository',
        toolId: readiness.toolId,
        operationId: readiness.operationId,
        runtimeReleaseRef: readiness.runtimeReleaseRef,
        rateAuthorityRef: readiness.rateAuthorityRef,
        readinessRef,
        readinessObservedAt: readiness.observedAt,
        readinessExpiresAt: readiness.expiresAt,
        publishedAt: readiness.observedAt,
      })
      await publishCurrentPointer({
        pointerPort: input.currentPointerPort,
        objectPath: currentPointerPath(prefix, pointer),
        pointer,
      })
      const reread = await repository.rereadExact({
        readinessRef,
        at: readiness.observedAt,
      })
      if (!reread || reread.readinessHash !== readiness.readinessHash) {
        throw conflict('readiness_exact_reread_failed')
      }
      return readinessRef
    },

    async rereadExact(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_current_a100_readiness_read')
      const request = z.object({
        readinessRef: refSchema,
        at: timestamp,
      }).strict().parse(untrusted)
      const readiness = await readRecord(
        input.objectPort,
        recordPath(prefix, request.readinessRef),
        request.at,
      )
      if (!readiness) return null
      if (!sameRef(ref(readiness.readinessId, readiness.readinessHash),
        request.readinessRef)) {
        throw conflict('readiness_ref_mismatch')
      }
      return readiness
    },

    async rereadCurrent(untrusted) {
      assertPlainSerializedData(untrusted,
        'sam31_current_a100_readiness_lookup')
      const request = z.object({
        toolId: z.literal('sam3_1'),
        operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
        runtimeReleaseRef: refSchema,
        rateAuthorityRef: refSchema,
        at: timestamp,
      }).strict().parse(untrusted)
      const pointer = await readPointer(
        input.currentPointerPort,
        currentPointerPath(prefix, request),
      )
      if (!pointer) return null
      if (pointer.toolId !== request.toolId
        || pointer.operationId !== request.operationId
        || !sameRef(pointer.runtimeReleaseRef, request.runtimeReleaseRef)
        || !sameRef(pointer.rateAuthorityRef, request.rateAuthorityRef)) {
        throw conflict('readiness_pointer_lineage_mismatch')
      }
      if (Date.parse(request.at) < Date.parse(pointer.readinessObservedAt)
        || Date.parse(request.at) >= Date.parse(pointer.readinessExpiresAt)) {
        return null
      }
      const readiness = await repository.rereadExact({
        readinessRef: pointer.readinessRef,
        at: request.at,
      })
      if (!readiness
        || readiness.observedAt !== pointer.readinessObservedAt
        || readiness.expiresAt !== pointer.readinessExpiresAt
        || !sameRef(readiness.runtimeReleaseRef, pointer.runtimeReleaseRef)
        || !sameRef(readiness.rateAuthorityRef, pointer.rateAuthorityRef)) {
        throw conflict('readiness_pointer_record_mismatch')
      }
      return readiness
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalGcsAtomicCurrentJsonPointerPort(input: {
  readonly storage: Storage
  readonly bucketName: string
}): CanonicalAtomicCurrentJsonPointerPort {
  const bucketName = safeBucket.parse(input.bucketName)
  const readPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage: input.storage,
    bucketName,
  })
  const bucket = input.storage.bucket(bucketName)
  return Object.freeze({
    async compareAndSwap(request: {
      readonly objectPath: string
      readonly expectedContentSha256: string | null
      readonly body: Buffer
      readonly contentSha256: string
    }) {
      assertPointerWrite(request)
      const file = bucket.file(request.objectPath)
      let generation = 0
      let existing: Buffer | null = null
      try {
        const [metadata] = await file.getMetadata()
        generation = z.coerce.number().int().nonnegative().safe()
          .parse(metadata.generation)
        existing = await readPort.readExact(request.objectPath)
      } catch (error) {
        if (cloudErrorCode(error) !== 404) throw error
      }
      const existingHash = existing ? hash(existing) : null
      if (existingHash !== request.expectedContentSha256) return 'raced'
      try {
        await file.save(request.body, {
          contentType: 'application/json',
          resumable: false,
          preconditionOpts: { ifGenerationMatch: generation },
        })
      } catch (error) {
        if (cloudErrorCode(error) === 412) return 'raced'
        throw error
      }
      const reread = await readPort.readExact(request.objectPath)
      if (!reread || hash(reread) !== request.contentSha256
        || !reread.equals(request.body)) {
        throw conflict('readiness_pointer_atomic_reread_changed')
      }
      return 'replaced'
    },
    readExact: readPort.readExact.bind(readPort),
  })
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new Error('A100 customer-dispatch readiness object port is invalid.')
  }
}

function assertCurrentPointerPort(
  port: CanonicalAtomicCurrentJsonPointerPort,
): void {
  if (typeof port?.compareAndSwap !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new Error('A100 customer-dispatch pointer port is invalid.')
  }
}

function assertPointerWrite(value: unknown): asserts value is {
  readonly objectPath: string
  readonly expectedContentSha256: string | null
  readonly body: Buffer
  readonly contentSha256: string
} {
  assertPlainSerializedData({
    objectPath: (value as { objectPath?: unknown })?.objectPath,
    expectedContentSha256:
      (value as { expectedContentSha256?: unknown })?.expectedContentSha256,
    contentSha256: (value as { contentSha256?: unknown })?.contentSha256,
  }, 'sam31_a100_readiness_pointer_write')
  const parsed = z.object({
    objectPath: safePrefix,
    expectedContentSha256: rawSha256.nullable(),
    contentSha256: rawSha256,
  }).strict().parse({
    objectPath: (value as { objectPath?: unknown }).objectPath,
    expectedContentSha256:
      (value as { expectedContentSha256?: unknown }).expectedContentSha256,
    contentSha256: (value as { contentSha256?: unknown }).contentSha256,
  })
  const body = (value as { body?: unknown }).body
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES
    || hash(body) !== parsed.contentSha256) {
    throw conflict('readiness_pointer_write_invalid')
  }
}

function ref(id: string, hashValue: string): EvidenceRef {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hashValue}`,
  })
}

function recordPath(prefix: string, readinessRef: EvidenceRef): string {
  return `${prefix}/records/${hashKey(readinessRef)}.json`
}

function currentPointerPath(prefix: string, input: {
  readonly toolId: string
  readonly operationId: string
  readonly runtimeReleaseRef: EvidenceRef
  readonly rateAuthorityRef: EvidenceRef
}): string {
  return `${prefix}/current/${hashKey({
    toolId: safeId.parse(input.toolId),
    operationId: safeId.parse(input.operationId),
    runtimeReleaseRef: refSchema.parse(input.runtimeReleaseRef),
    rateAuthorityRef: refSchema.parse(input.rateAuthorityRef),
  })}.json`
}

function sealPointer(value: unknown): ReadinessPointer {
  assertPlainSerializedData(value, 'sam31_a100_readiness_pointer_build')
  const payload = pointerWithoutHashSchema.parse(value)
  return assertPointer({
    ...payload,
    pointerHash: sha256AuthorityValue(payload),
  })
}

function assertPointer(value: unknown): ReadinessPointer {
  assertPlainSerializedData(value, 'sam31_a100_readiness_pointer_read')
  const parsed = pointerSchema.parse(value)
  const { pointerHash, ...payload } = parsed
  if (pointerHash !== sha256AuthorityValue(payload)) {
    throw conflict('readiness_pointer_digest_changed')
  }
  return parsed
}

async function publishCurrentPointer(input: {
  readonly pointerPort: CanonicalAtomicCurrentJsonPointerPort
  readonly objectPath: string
  readonly pointer: ReadinessPointer
}): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(input.pointer), 'utf8')
  for (let attempt = 1;
    attempt <= MAXIMUM_POINTER_REPLACEMENT_ATTEMPTS;
    attempt += 1) {
    const existingBody = await input.pointerPort.readExact(input.objectPath)
    const existing = existingBody ? decodePointer(existingBody) : null
    if (existing) {
      const existingTime = Date.parse(existing.readinessObservedAt)
      const replacementTime = Date.parse(input.pointer.readinessObservedAt)
      if (existingTime > replacementTime) {
        throw conflict('older_readiness_cannot_replace_current')
      }
      if (existingTime === replacementTime) {
        if (existing.pointerHash !== input.pointer.pointerHash) {
          throw conflict('same_time_readiness_pointer_conflict')
        }
        return
      }
    }
    const result = await input.pointerPort.compareAndSwap({
      objectPath: input.objectPath,
      expectedContentSha256: existingBody ? hash(existingBody) : null,
      body,
      contentSha256: hash(body),
    })
    if (result === 'replaced') return
  }
  throw conflict('readiness_pointer_publish_raced')
}

async function readPointer(
  port: CanonicalAtomicCurrentJsonPointerPort,
  objectPath: string,
): Promise<ReadinessPointer | null> {
  const body = await port.readExact(objectPath)
  return body ? decodePointer(body) : null
}

function decodePointer(body: Buffer): ReadinessPointer {
  if (body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('readiness_pointer_too_large')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('readiness_pointer_json_invalid')
  }
  const pointer = assertPointer(decoded)
  if (!body.equals(Buffer.from(stableAuthorityStringify(pointer), 'utf8'))) {
    throw conflict('readiness_pointer_bytes_changed')
  }
  return pointer
}

function hashKey(value: unknown): string {
  return createHash('sha256')
    .update(stableAuthorityStringify(value), 'utf8').digest('hex')
}

function hash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function encode(
  readiness: CanonicalSam31CurrentA100CustomerDispatchReadiness,
): Buffer {
  const body = Buffer.from(stableAuthorityStringify(readiness), 'utf8')
  if (body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('readiness_record_too_large')
  }
  return body
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  body: Buffer,
): Promise<void> {
  const contentSha256 = hash(body)
  const status = await port.createOnly({
    objectPath: path,
    body,
    contentSha256,
  })
  if (status === 'already_exists') {
    const existing = await port.readExact(path)
    if (!existing || !existing.equals(body)) {
      throw conflict('readiness_create_only_conflict')
    }
  }
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw conflict('readiness_persistence_reread_changed')
  }
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  at: string,
): Promise<CanonicalSam31CurrentA100CustomerDispatchReadiness | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('readiness_record_too_large')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('readiness_record_json_invalid')
  }
  const readiness =
    assertCanonicalSam31CurrentA100CustomerDispatchReadiness(decoded, at)
  if (!body.equals(encode(readiness))) {
    throw conflict('readiness_record_bytes_changed')
  }
  return readiness
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function cloudErrorCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null
  const code = (error as { code?: unknown }).code
  if (typeof code === 'number') return code
  if (typeof code === 'string' && /^\d+$/u.test(code)) return Number(code)
  return null
}

function conflict(code: string): Error {
  return new Error(`A100 customer-dispatch readiness conflict: ${code}`)
}
