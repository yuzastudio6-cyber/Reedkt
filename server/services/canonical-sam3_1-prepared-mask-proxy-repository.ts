import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import type {
  CanonicalSam31GpuPreparedMaskProxyReadPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'

export const CANONICAL_SAM3_1_PREPARED_MASK_PROXY_REPOSITORY_VERSION =
  'canonical-sam3_1-prepared-mask-proxy-repository-v1' as const
export const CANONICAL_SAM3_1_PREPARED_MASK_PROXY_RECORD_VERSION =
  'canonical-sam3_1-prepared-mask-proxy-record-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX = 'private/track-all/sam3_1/prepared-mask-proxies/v1'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const MAXIMUM_PROXY_BYTES = 2 * 1024 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const bucketName = z.string().trim().min(3).max(222).regex(
  /^[a-z0-9][a-z0-9._-]+[a-z0-9]$/u,
)
const objectName = z.string().trim().min(9).max(1024)
  .regex(/^private\/[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const generation = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  approvedSnapshotRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
}).strict()
const coordinateSchema = z.object({
  bucketName,
  objectName,
  generation,
  etagSha256: sha256,
}).strict()
const mediaSchema = z.object({
  contentType: z.literal('video/mp4'),
  byteLength: positiveInteger.max(MAXIMUM_PROXY_BYTES),
  sha256,
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  decodedFrameCount: positiveInteger.max(240_000),
  selectedStartFrameInclusive: nonnegativeInteger,
  selectedEndFrameInclusive: nonnegativeInteger,
}).strict().superRefine((media, context) => {
  if (media.selectedStartFrameInclusive !== 0
    || media.selectedEndFrameInclusive !== media.decodedFrameCount - 1) {
    context.addIssue({
      code: 'custom',
      message: 'Prepared mask proxy does not cover its complete decoded range.',
    })
  }
})
const refsSchema = z.object({
  sourceBindingRef: evidenceRefSchema,
  finalizedSourceArtifactRef: evidenceRefSchema,
  gpuPreparedMaskProxyArtifactRef: evidenceRefSchema,
  exactSourceReadEvidenceRef: evidenceRefSchema,
  sourceFrameRangeMappingRef: evidenceRefSchema,
  proxyPixelGeometryQaRef: evidenceRefSchema,
  preparationRuntimeReleaseRef: evidenceRefSchema,
  preparationUsageCostReceiptRef: evidenceRefSchema,
}).strict()
const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PREPARED_MASK_PROXY_RECORD_VERSION,
  ),
  source: z.literal('canonical_track_all_l4_mask_proxy_preparation_owner'),
  evidenceClass: z.literal('gcs_exact_generation_private_reread'),
  proxyPublicationId: safeId,
  scope: scopeSchema,
  refs: refsSchema,
  media: mediaSchema,
  privateCoordinate: coordinateSchema,
  preparationRouteId: z.literal('l4_standard_primary'),
  preparationAccelerator: z.literal('nvidia_l4'),
  userTriggeredScaleFromZero: z.literal(true),
  scaleBackToZeroAfterPreparationVerified: z.literal(true),
  hardwareDecodeAndEncodeVerified: z.literal(true),
  cpuOnlySubstantiveMediaProcessingUsed: z.literal(false),
  exactSourceFrameMappingAndPixelGeometryQaVerified: z.literal(true),
  exactGenerationBytesHashedBeforePublication: z.literal(true),
  callerPathUrlBucketObjectGenerationOrBytesAccepted: z.literal(false),
  signedUrlOrPublicObjectUsed: z.literal(false),
  sourceOrProxyMutationAllowed: z.literal(false),
  samInferenceExecuted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const recordSchema = recordWithoutHashSchema.extend({
  recordHash: sha256,
}).strict()
type PreparedProxyRecord = z.infer<typeof recordSchema>
type PreparedProxyReadInput = Parameters<
  CanonicalSam31GpuPreparedMaskProxyReadPort[
    'rereadExactApprovedMaskProxy'
  ]
>[0]

export interface CanonicalSam31ImmutablePrivateProxyObjectReadPort {
  rereadExactPrivateProxy(input: {
    readonly coordinate: z.infer<typeof coordinateSchema>
    readonly expectedByteLength: number
    readonly expectedSha256: string
  }): Promise<{
    readonly contentType: 'video/mp4'
    readonly byteLength: number
    readonly sha256Metadata: string
    readonly generation: string
    readonly etagSha256: string
    openStream(): Promise<Readable>
  }>
}

export interface CanonicalSam31PreparedMaskProxyRepository
  extends CanonicalSam31GpuPreparedMaskProxyReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_PREPARED_MASK_PROXY_REPOSITORY_VERSION
  readonly evidenceClass:
    'l4_prepared_gcs_exact_generation_private_reread'
  persistPreparedMaskProxyCreateOnly(input: {
    readonly proxyPublicationId: string
    readonly scope: z.input<typeof scopeSchema>
    readonly refs: z.input<typeof refsSchema>
    readonly media: z.input<typeof mediaSchema>
    readonly privateCoordinate: z.input<typeof coordinateSchema>
    readonly publishedAt: string
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly proxyPublicationRef: z.infer<typeof evidenceRefSchema>
    readonly exactGenerationBytesHashedBeforePublication: true
    readonly samInferenceExecuted: false
    readonly customerCreditsMutated: false
  }>
}

type PersistInput = Parameters<
  CanonicalSam31PreparedMaskProxyRepository[
    'persistPreparedMaskProxyCreateOnly'
  ]
>[0]

/**
 * Private authority bridge from the normal L4 media-preparation lane to the
 * heavy SAM 3.1 lane. The record keeps object coordinates server-private and
 * exposes only an exact-generation stream after snapshot/work/lease/attempt,
 * artifact, frame-map, and geometry-QA lineage all match.
 */
export function createCanonicalSam31PreparedMaskProxyRepository(input: {
  readonly recordObjectPort: CanonicalCreateOnlyJsonObjectPort
  readonly proxyObjectReadPort:
    CanonicalSam31ImmutablePrivateProxyObjectReadPort
  readonly allowedPrivateProxyBucketNames: readonly string[]
  readonly prefix?: string
}): CanonicalSam31PreparedMaskProxyRepository {
  assertDependencies(input)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const allowedPrivateProxyBucketNames = new Set(
    z.array(bucketName).min(1).max(8).parse(
      input.allowedPrivateProxyBucketNames,
    ),
  )
  if (allowedPrivateProxyBucketNames.size !==
    input.allowedPrivateProxyBucketNames.length) {
    throw new Error('SAM 3.1 prepared proxy bucket allowlist is duplicated.')
  }
  const readRecord = async (
    lookup: ProxyLookup,
  ): Promise<PreparedProxyRecord | null> => {
    const bytes = await input.recordObjectPort.readExact(
      recordPath(prefix, lookup),
    )
    if (!bytes) return null
    if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
      || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
      throw conflict('prepared_proxy_record_bytes_invalid')
    }
    let decoded: unknown
    try {
      decoded = JSON.parse(bytes.toString('utf8'))
    } catch {
      throw conflict('prepared_proxy_record_json_invalid')
    }
    const record = assertRecord(decoded)
    assertAllowedPrivateBucket(
      allowedPrivateProxyBucketNames,
      record.privateCoordinate.bucketName,
    )
    if (stableAuthorityStringify(record) !== bytes.toString('utf8')
      || stableAuthorityStringify(lookupFromRecord(record)) !==
        stableAuthorityStringify(lookup)) {
      throw conflict('prepared_proxy_record_exact_reread_invalid')
    }
    return record
  }
  const rereadObject = async (record: PreparedProxyRecord) => {
    const observed = await input.proxyObjectReadPort.rereadExactPrivateProxy({
      coordinate: record.privateCoordinate,
      expectedByteLength: record.media.byteLength,
      expectedSha256: record.media.sha256,
    })
    if (observed.contentType !== 'video/mp4'
      || observed.byteLength !== record.media.byteLength
      || observed.sha256Metadata !== record.media.sha256
      || observed.generation !== record.privateCoordinate.generation
      || observed.etagSha256 !== record.privateCoordinate.etagSha256) {
      throw conflict('prepared_proxy_exact_object_metadata_mismatch')
    }
    return observed
  }
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_PREPARED_MASK_PROXY_REPOSITORY_VERSION,
    evidenceClass:
      'l4_prepared_gcs_exact_generation_private_reread' as const,
    async persistPreparedMaskProxyCreateOnly(untrusted: PersistInput) {
      assertPlainSerializedData(untrusted, 'sam31_prepared_proxy_publication')
      const request = z.object({
        proxyPublicationId: safeId,
        scope: scopeSchema,
        refs: refsSchema,
        media: mediaSchema,
        privateCoordinate: coordinateSchema,
        publishedAt: timestamp,
      }).strict().parse(untrusted)
      assertAllowedPrivateBucket(
        allowedPrivateProxyBucketNames,
        request.privateCoordinate.bucketName,
      )
      assertDistinctRefs(request.refs)
      const observed = await input.proxyObjectReadPort
        .rereadExactPrivateProxy({
          coordinate: request.privateCoordinate,
          expectedByteLength: request.media.byteLength,
          expectedSha256: request.media.sha256,
        })
      assertObservedMetadata(request, observed)
      const streamHash = await hashStream(
        await observed.openStream(),
        request.media.byteLength,
      )
      if (streamHash.byteLength !== request.media.byteLength
        || streamHash.sha256 !== request.media.sha256) {
        throw conflict('prepared_proxy_publication_bytes_mismatch')
      }
      const payload = recordWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_PREPARED_MASK_PROXY_RECORD_VERSION,
        source: 'canonical_track_all_l4_mask_proxy_preparation_owner',
        evidenceClass: 'gcs_exact_generation_private_reread',
        proxyPublicationId: request.proxyPublicationId,
        scope: request.scope,
        refs: request.refs,
        media: request.media,
        privateCoordinate: request.privateCoordinate,
        preparationRouteId: 'l4_standard_primary',
        preparationAccelerator: 'nvidia_l4',
        userTriggeredScaleFromZero: true,
        scaleBackToZeroAfterPreparationVerified: true,
        hardwareDecodeAndEncodeVerified: true,
        cpuOnlySubstantiveMediaProcessingUsed: false,
        exactSourceFrameMappingAndPixelGeometryQaVerified: true,
        exactGenerationBytesHashedBeforePublication: true,
        callerPathUrlBucketObjectGenerationOrBytesAccepted: false,
        signedUrlOrPublicObjectUsed: false,
        sourceOrProxyMutationAllowed: false,
        samInferenceExecuted: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        publishedAt: request.publishedAt,
      })
      const record = recordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const body = serialize(record)
      const disposition = await input.recordObjectPort.createOnly({
        objectPath: recordPath(prefix, lookupFromRecord(record)),
        body,
        contentSha256: hashBytes(body),
      })
      const reread = await readRecord(lookupFromRecord(record))
      if (!reread || reread.recordHash !== record.recordHash) {
        throw conflict('prepared_proxy_create_only_reread_mismatch')
      }
      await rereadObject(reread)
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        proxyPublicationRef: evidenceRefSchema.parse({
          id: record.proxyPublicationId,
          version: 1,
          contentHash: `sha256:${record.recordHash}`,
        }),
        exactGenerationBytesHashedBeforePublication: true as const,
        samInferenceExecuted: false as const,
        customerCreditsMutated: false as const,
      })
    },
    async rereadExactApprovedMaskProxy(untrusted: PreparedProxyReadInput) {
      assertPlainSerializedData(untrusted, 'sam31_prepared_proxy_read')
      const request = preparedProxyReadSchema.parse(untrusted)
      const record = await readRecord(lookupFromRead(request))
      if (!record) throw notReady('prepared_proxy_not_published')
      if (request.expectedByteLength !== record.media.byteLength
        || request.expectedSha256 !== record.media.sha256) {
        throw conflict('prepared_proxy_expected_bytes_mismatch')
      }
      await rereadObject(record)
      return Object.freeze({
        contentType: 'video/mp4' as const,
        byteLength: record.media.byteLength,
        sha256: record.media.sha256,
        width: record.media.width,
        height: record.media.height,
        decodedFrameCount: record.media.decodedFrameCount,
        selectedStartFrameInclusive:
          record.media.selectedStartFrameInclusive,
        selectedEndFrameInclusive: record.media.selectedEndFrameInclusive,
        sourceBindingRef: structuredClone(record.refs.sourceBindingRef),
        finalizedSourceArtifactRef:
          structuredClone(record.refs.finalizedSourceArtifactRef),
        gpuPreparedMaskProxyArtifactRef:
          structuredClone(record.refs.gpuPreparedMaskProxyArtifactRef),
        exactSourceReadEvidenceRef:
          structuredClone(record.refs.exactSourceReadEvidenceRef),
        sourceFrameRangeMappingRef:
          structuredClone(record.refs.sourceFrameRangeMappingRef),
        proxyPixelGeometryQaRef:
          structuredClone(record.refs.proxyPixelGeometryQaRef),
        exactApprovedSnapshotWorkLeaseAndSourceReread: true as const,
        sourcePathUrlBucketObjectGenerationOrBytesExposed: false as const,
        async openStream() {
          const fresh = await rereadObject(record)
          return fresh.openStream()
        },
      })
    },
  })
}

const preparedProxyReadSchema = z.object({
  scope: scopeSchema,
  sourceBindingRef: evidenceRefSchema,
  finalizedSourceArtifactRef: evidenceRefSchema,
  gpuPreparedMaskProxyArtifactRef: evidenceRefSchema,
  exactSourceReadEvidenceRef: evidenceRefSchema,
  sourceFrameRangeMappingRef: evidenceRefSchema,
  proxyPixelGeometryQaRef: evidenceRefSchema,
  expectedByteLength: positiveInteger.max(MAXIMUM_PROXY_BYTES),
  expectedSha256: sha256,
}).strict()

export function createCanonicalGcsSam31PreparedMaskProxyRepository(input: {
  readonly storage?: Storage
  readonly projectId?: string
  readonly controlPlaneBucketName?: string
  readonly privateProxyBucketName: string
  readonly prefix?: string
}): CanonicalSam31PreparedMaskProxyRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('SAM 3.1 prepared proxy requires project reeditpro.')
  }
  const storage = input.storage ?? new Storage({ projectId })
  return createCanonicalSam31PreparedMaskProxyRepository({
    recordObjectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName:
        input.controlPlaneBucketName ?? CONTROL_PLANE_STATE_BUCKET,
    }),
    proxyObjectReadPort: createCanonicalGcsSam31ImmutableProxyObjectReadPort({
      storage,
    }),
    allowedPrivateProxyBucketNames: [input.privateProxyBucketName],
    prefix: input.prefix,
  })
}

export function createCanonicalGcsSam31ImmutableProxyObjectReadPort(input: {
  readonly storage?: Storage
  readonly projectId?: string
} = {}): CanonicalSam31ImmutablePrivateProxyObjectReadPort {
  const projectId = input.projectId ?? PROJECT_ID
  const storage = input.storage ?? new Storage({ projectId })
  return Object.freeze({
    async rereadExactPrivateProxy(
      untrusted: Parameters<
        CanonicalSam31ImmutablePrivateProxyObjectReadPort[
          'rereadExactPrivateProxy'
        ]
      >[0],
    ) {
      assertPlainSerializedData(untrusted, 'sam31_exact_proxy_object_read')
      const request = z.object({
        coordinate: coordinateSchema,
        expectedByteLength: positiveInteger.max(MAXIMUM_PROXY_BYTES),
        expectedSha256: sha256,
      }).strict().parse(untrusted)
      const exactFile = storage.bucket(request.coordinate.bucketName).file(
        request.coordinate.objectName,
        { generation: request.coordinate.generation },
      )
      const [metadata] = await exactFile.getMetadata()
      const observedLength = Number(metadata.size ?? -1)
      const observedGeneration = String(metadata.generation ?? '')
      const observedEtagSha256 = hashText(String(metadata.etag ?? ''))
      const custom = metadata.metadata as Record<string, unknown> | undefined
      const metadataSha256 = String(
        custom?.['weeditpro-content-sha256']
        ?? custom?.['reeditpro-content-sha256']
        ?? '',
      )
      if (!Number.isSafeInteger(observedLength)
        || observedLength !== request.expectedByteLength
        || observedGeneration !== request.coordinate.generation
        || observedEtagSha256 !== request.coordinate.etagSha256
        || String(metadata.contentType ?? '') !== 'video/mp4'
        || metadataSha256 !== request.expectedSha256) {
        throw conflict('prepared_proxy_gcs_metadata_mismatch')
      }
      return Object.freeze({
        contentType: 'video/mp4' as const,
        byteLength: observedLength,
        sha256Metadata: metadataSha256,
        generation: observedGeneration,
        etagSha256: observedEtagSha256,
        async openStream() {
          return exactFile.createReadStream({
            decompress: false,
            validation: 'crc32c',
          })
        },
      })
    },
  })
}

type ProxyLookup = {
  readonly scope: z.infer<typeof scopeSchema>
  readonly refs: Pick<z.infer<typeof refsSchema>,
    'sourceBindingRef' | 'finalizedSourceArtifactRef'
    | 'gpuPreparedMaskProxyArtifactRef' | 'exactSourceReadEvidenceRef'
    | 'sourceFrameRangeMappingRef' | 'proxyPixelGeometryQaRef'>
}

function lookupFromRecord(record: PreparedProxyRecord): ProxyLookup {
  return {
    scope: record.scope,
    refs: {
      sourceBindingRef: record.refs.sourceBindingRef,
      finalizedSourceArtifactRef: record.refs.finalizedSourceArtifactRef,
      gpuPreparedMaskProxyArtifactRef:
        record.refs.gpuPreparedMaskProxyArtifactRef,
      exactSourceReadEvidenceRef: record.refs.exactSourceReadEvidenceRef,
      sourceFrameRangeMappingRef: record.refs.sourceFrameRangeMappingRef,
      proxyPixelGeometryQaRef: record.refs.proxyPixelGeometryQaRef,
    },
  }
}

function lookupFromRead(
  value: z.infer<typeof preparedProxyReadSchema>,
): ProxyLookup {
  return {
    scope: value.scope,
    refs: {
      sourceBindingRef: value.sourceBindingRef,
      finalizedSourceArtifactRef: value.finalizedSourceArtifactRef,
      gpuPreparedMaskProxyArtifactRef:
        value.gpuPreparedMaskProxyArtifactRef,
      exactSourceReadEvidenceRef: value.exactSourceReadEvidenceRef,
      sourceFrameRangeMappingRef: value.sourceFrameRangeMappingRef,
      proxyPixelGeometryQaRef: value.proxyPixelGeometryQaRef,
    },
  }
}

function assertRecord(value: unknown): PreparedProxyRecord {
  assertPlainSerializedData(value, 'sam31_prepared_proxy_record')
  const record = recordSchema.parse(value)
  const { recordHash, ...payload } = record
  if (recordHash !== sha256AuthorityValue(payload)) {
    throw conflict('prepared_proxy_record_hash_invalid')
  }
  assertDistinctRefs(record.refs)
  return record
}

function assertDistinctRefs(refs: z.infer<typeof refsSchema>): void {
  const values = Object.values(refs).map((value) =>
    stableAuthorityStringify(value))
  if (new Set(values).size !== values.length) {
    throw conflict('prepared_proxy_cross_role_ref_reuse')
  }
}

function assertObservedMetadata(
  request: {
    privateCoordinate: z.infer<typeof coordinateSchema>
    media: z.infer<typeof mediaSchema>
  },
  observed: {
    contentType: 'video/mp4'
    byteLength: number
    sha256Metadata: string
    generation: string
    etagSha256: string
  },
): void {
  if (observed.contentType !== 'video/mp4'
    || observed.byteLength !== request.media.byteLength
    || observed.sha256Metadata !== request.media.sha256
    || observed.generation !== request.privateCoordinate.generation
    || observed.etagSha256 !== request.privateCoordinate.etagSha256) {
    throw conflict('prepared_proxy_publication_metadata_mismatch')
  }
}

async function hashStream(
  stream: Readable,
  expectedByteLength: number,
): Promise<{ byteLength: number; sha256: string }> {
  const hash = createHash('sha256')
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (byteLength > expectedByteLength) {
      throw conflict('prepared_proxy_stream_exceeds_expected_length')
    }
    hash.update(bytes)
  }
  return { byteLength, sha256: hash.digest('hex') }
}

function recordPath(prefix: string, lookup: ProxyLookup): string {
  return `${prefix}/${hashText(stableAuthorityStringify(lookup))}.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('prepared_proxy_record_size_invalid')
  }
  return body
}

function assertDependencies(input: {
  recordObjectPort: CanonicalCreateOnlyJsonObjectPort
  proxyObjectReadPort: CanonicalSam31ImmutablePrivateProxyObjectReadPort
  allowedPrivateProxyBucketNames: readonly string[]
}): void {
  if (!input.recordObjectPort
    || typeof input.recordObjectPort.createOnly !== 'function'
    || typeof input.recordObjectPort.readExact !== 'function'
    || !input.proxyObjectReadPort
    || typeof input.proxyObjectReadPort.rereadExactPrivateProxy !==
      'function') {
    throw new Error('SAM 3.1 prepared proxy repository dependencies are absent.')
  }
}

function assertAllowedPrivateBucket(
  allowed: ReadonlySet<string>,
  observed: string,
): void {
  if (!allowed.has(observed)) {
    throw conflict('prepared_proxy_bucket_not_server_allowlisted')
  }
}

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(reason: string): Error {
  return new Error(`SAM 3.1 prepared mask proxy: ${reason}.`)
}

function notReady(reason: string): Error {
  return new Error(`SAM 3.1 prepared mask proxy unavailable: ${reason}.`)
}
