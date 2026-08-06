import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_AUTHORIZED_TERMS_ACCEPTANCE_VERSION,
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
  assertCanonicalSam31AuthorizedTermsAcceptance,
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31AuthorizedTermsAcceptance,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION,
  assertCanonicalSam31PrivateArtifactReviewBundle,
  canonicalSam31PrivateArtifactReviewBundleRef,
  type CanonicalSam31PrivateArtifactReviewBundle,
} from '../model-artifacts/canonical-sam3_1-private-artifact-review'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_REPOSITORY_VERSION =
  'canonical-sam3_1-private-artifact-ingest-repository-v1' as const
export const CANONICAL_SAM3_1_AUTHENTICATED_TERMS_READ_PORT_VERSION =
  'canonical-sam3_1-authenticated-terms-read-port-v1' as const
export const CANONICAL_SAM3_1_AUTHENTICATED_ARTIFACT_REVIEW_READ_PORT_VERSION =
  'canonical-sam3_1-authenticated-artifact-review-read-port-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const TERMS_PREFIX = 'private/sam3_1/terms-acceptance/v1' as const
const REVIEW_PREFIX = 'private/sam3_1/artifact-review/v1' as const
const INGEST_PREFIX = 'private/sam3_1/private-artifact-ingest/v3' as const
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const termsRefSchema = evidenceRefSchema.extend({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_AUTHORIZED_TERMS_ACCEPTANCE_VERSION,
  ).optional(),
}).strict()
const reviewRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION,
  ),
}).strict()
const ingestRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
  ),
}).strict()

export interface CanonicalSam31AuthenticatedTermsReadPort {
  readonly schemaVersion: string
  rereadAuthenticatedTermsAcceptance(input: {
    readonly termsAcceptanceRef: z.infer<typeof termsRefSchema>
  }): Promise<CanonicalSam31AuthorizedTermsAcceptance | null>
}

export interface CanonicalSam31AuthenticatedArtifactReviewReadPort {
  readonly schemaVersion: string
  rereadAuthenticatedArtifactReview(input: {
    readonly reviewBundleRef: z.infer<typeof reviewRefSchema>
  }): Promise<CanonicalSam31PrivateArtifactReviewBundle | null>
}

export interface CanonicalSam31PrivateArtifactIngestRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_REPOSITORY_VERSION
  readonly evidenceClass: 'private_create_only_exact_reread'
  persistPrivateArtifactIngestCreateOnly(input: {
    readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly ingestReceiptRef: z.infer<typeof ingestRefSchema>
  }>
  rereadPrivateArtifactIngest(input: {
    readonly ingestReceiptRef: z.infer<typeof ingestRefSchema>
  }): Promise<CanonicalSam31PrivateArtifactIngestReceipt | null>
}

export function createCanonicalSam31PrivateArtifactIngestRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
}): CanonicalSam31PrivateArtifactIngestRepository {
  if (
    !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
  ) throw new Error('SAM 3.1 private ingest object port is invalid.')
  const repository: CanonicalSam31PrivateArtifactIngestRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_REPOSITORY_VERSION,
    evidenceClass: 'private_create_only_exact_reread',
    async persistPrivateArtifactIngestCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_private_ingest_persist')
      const receipt = assertCanonicalSam31PrivateArtifactIngestReceipt(
        z.object({
          ingestReceipt: z.unknown(),
        }).strict().parse(untrusted).ingestReceipt,
      )
      const ref = ingestRef(receipt)
      const body = serialize(receipt)
      const disposition = await input.objectPort.createOnly({
        objectPath: ingestPath(ref),
        body,
        contentSha256: digest(body),
      })
      const reread = await readIngest(input.objectPort, ingestPath(ref))
      if (
        !reread
        || stableAuthorityStringify(reread) !==
          stableAuthorityStringify(receipt)
      ) throw new Error('SAM 3.1 private ingest create-only reread changed.')
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        ingestReceiptRef: ref,
      })
    },
    async rereadPrivateArtifactIngest(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_private_ingest_reread')
      const { ingestReceiptRef } = z.object({
        ingestReceiptRef: ingestRefSchema,
      }).strict().parse(untrusted)
      const receipt = await readIngest(
        input.objectPort,
        ingestPath(ingestReceiptRef),
      )
      if (!receipt) return null
      if (!sameRef(ingestRef(receipt), ingestReceiptRef)) {
        throw new Error('SAM 3.1 private ingest reference changed.')
      }
      return structuredClone(receipt)
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31GcpPrivateArtifactIngestRepository(input: {
  readonly storage?: Storage
} = {}): CanonicalSam31PrivateArtifactIngestRepository {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  return createCanonicalSam31PrivateArtifactIngestRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: CONTROL_PLANE_BUCKET,
    }),
  })
}

export function createCanonicalSam31GcsAuthenticatedTermsReadPort(input: {
  readonly storage?: Storage
} = {}): CanonicalSam31AuthenticatedTermsReadPort {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_AUTHENTICATED_TERMS_READ_PORT_VERSION,
    async rereadAuthenticatedTermsAcceptance(untrusted: {
      readonly termsAcceptanceRef: z.infer<typeof termsRefSchema>
    }) {
      assertPlainSerializedData(untrusted, 'sam31_authenticated_terms_read')
      const { termsAcceptanceRef } = z.object({
        termsAcceptanceRef: termsRefSchema,
      }).strict().parse(untrusted)
      const body = await readExactGcsJson({
        storage,
        objectName: refPath(TERMS_PREFIX, termsAcceptanceRef),
      })
      if (!body) return null
      const terms = assertCanonicalSam31AuthorizedTermsAcceptance(
        parseJson(body, 'terms acceptance'),
      )
      const expectedRef = {
        id: terms.acceptanceRecordId,
        version: terms.acceptanceRecordVersion,
        contentHash: `sha256:${terms.acceptanceRecordHash}`,
      }
      if (
        terms.evidenceClass !== 'canonical_private_reread'
        || !sameRef(expectedRef, termsAcceptanceRef)
        || stableAuthorityStringify(terms) !== body.toString('utf8')
      ) throw new Error('SAM 3.1 authenticated terms reread changed.')
      return structuredClone(terms)
    },
  })
}

export function createCanonicalSam31GcsAuthenticatedArtifactReviewReadPort(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31AuthenticatedArtifactReviewReadPort {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_AUTHENTICATED_ARTIFACT_REVIEW_READ_PORT_VERSION,
    async rereadAuthenticatedArtifactReview(untrusted: {
      readonly reviewBundleRef: z.infer<typeof reviewRefSchema>
    }) {
      assertPlainSerializedData(untrusted, 'sam31_authenticated_review_read')
      const { reviewBundleRef } = z.object({
        reviewBundleRef: reviewRefSchema,
      }).strict().parse(untrusted)
      const body = await readExactGcsJson({
        storage,
        objectName: refPath(REVIEW_PREFIX, reviewBundleRef),
      })
      if (!body) return null
      const review = assertCanonicalSam31PrivateArtifactReviewBundle(
        parseJson(body, 'private artifact review'),
      )
      if (
        !sameRef(
          canonicalSam31PrivateArtifactReviewBundleRef(review),
          reviewBundleRef,
        )
        || stableAuthorityStringify(review) !== body.toString('utf8')
      ) throw new Error('SAM 3.1 authenticated artifact review changed.')
      return structuredClone(review)
    },
  })
}

function ingestRef(
  receipt: CanonicalSam31PrivateArtifactIngestReceipt,
): z.infer<typeof ingestRefSchema> {
  return ingestRefSchema.parse({
    id: receipt.ingestReceiptId,
    version: receipt.ingestReceiptVersion,
    schemaVersion: receipt.schemaVersion,
    contentHash: `sha256:${receipt.ingestReceiptHash}`,
  })
}

function ingestPath(ref: z.infer<typeof ingestRefSchema>): string {
  return refPath(INGEST_PREFIX, ref)
}

function refPath(
  prefix: string,
  ref: { readonly id: string; readonly contentHash: string },
): string {
  const hash = prefixedSha256.parse(ref.contentHash).slice('sha256:'.length)
  return `${prefix}/${safeId.parse(ref.id)}-${hash.slice(0, 24)}.json`
}

async function readIngest(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
): Promise<CanonicalSam31PrivateArtifactIngestReceipt | null> {
  const body = await port.readExact(path)
  if (!body) return null
  const receipt = assertCanonicalSam31PrivateArtifactIngestReceipt(
    parseJson(body, 'private ingest'),
  )
  if (stableAuthorityStringify(receipt) !== body.toString('utf8')) {
    throw new Error('SAM 3.1 private ingest bytes are not canonical.')
  }
  return receipt
}

async function readExactGcsJson(input: {
  readonly storage: Storage
  readonly objectName: string
}): Promise<Buffer | null> {
  const live = input.storage.bucket(CONTROL_PLANE_BUCKET).file(input.objectName)
  let before: Record<string, unknown>
  try {
    const response = await live.getMetadata()
    before = response[0] as unknown as Record<string, unknown>
  } catch (error) {
    if (cloudErrorCode(error) === 404) return null
    throw error
  }
  const generation = String(before.generation ?? '')
  const etag = String(before.etag ?? '')
  const byteLength = Number(before.size ?? -1)
  if (
    !/^[1-9][0-9]{0,30}$/u.test(generation)
    || !etag
    || byteLength < 2
    || byteLength > MAXIMUM_RECORD_BYTES
    || String(before.contentType ?? '') !== 'application/json'
  ) throw new Error('SAM 3.1 authenticated record metadata is invalid.')
  const exact = input.storage.bucket(CONTROL_PLANE_BUCKET).file(
    input.objectName,
    { generation },
  )
  const [body] = await exact.download({ validation: 'crc32c' })
  const [after] = await exact.getMetadata()
  if (
    !Buffer.isBuffer(body)
    || body.byteLength !== byteLength
    || String(after.generation ?? '') !== generation
    || String(after.etag ?? '') !== etag
    || Number(after.size ?? -1) !== byteLength
    || String(after.contentType ?? '') !== 'application/json'
  ) throw new Error('SAM 3.1 authenticated record changed during reread.')
  return body
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 private ingest record is oversized.')
  }
  return body
}

function parseJson(body: Buffer, label: string): unknown {
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error(`SAM 3.1 ${label} bytes are invalid.`)
  }
  try {
    return JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error(`SAM 3.1 ${label} JSON is invalid.`)
  }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return
  const code = Reflect.get(error, 'code')
  if (typeof code === 'number') return code
  if (typeof code === 'string' && /^[0-9]{3}$/u.test(code)) {
    return Number.parseInt(code, 10)
  }
}
