import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  canonicalSam31PrivateArtifactIngestReceiptSchema,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  canonicalSam31SourceCheckpointQualificationWorkerRequestSchema,
  type CanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE,
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA,
} from '../model-artifacts/canonical-sam3_1-official-probe-fixture'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import type {
  CanonicalSam31QualificationWorkerRequestReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import {
  assertCanonicalSam31QualificationStagingSourceSetForWorker,
  canonicalSam31QualificationStagingSourceSetSchema,
  createCanonicalSam31QualificationStagingSourceSet,
  type CanonicalSam31QualificationStagingSourceCoordinate,
  type CanonicalSam31QualificationStagingSourceReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-staging-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_REPOSITORY_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-package-repository-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_RECORD_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-package-record-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_PROBE_FIXTURE_GCS_PORT_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-probe-fixture-gcs-port-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_PROBE_FIXTURE_AUTHORITY_PORT_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-probe-fixture-authority-port-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const QUALIFICATION_FIXTURE_BUCKET =
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.bucketName
const QUALIFICATION_FIXTURE_PREFIX = 'private/fixtures/sam31/' as const
const QUALIFICATION_FIXTURE_OBJECT =
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.objectName
const QUALIFICATION_KMS_KEY =
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.kmsKeyName
const QUALIFICATION_PROBE_WIDTH =
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.width
const QUALIFICATION_PROBE_HEIGHT =
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.height
const QUALIFICATION_PROBE_FRAME_COUNT =
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.qualificationFrameCount
const QUALIFICATION_PROBE_METADATA =
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA
const DEFAULT_PREFIX =
  'private/sam3_1/source-checkpoint-qualification/v1/packages'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const packageWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_RECORD_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_qualification_package_repository',
  ),
  evidenceClass: z.literal('gcs_create_only_exact_reread'),
  workerRequestRef: evidenceRefSchema,
  ingestReceiptRef: evidenceRefSchema,
  workerRequest:
    canonicalSam31SourceCheckpointQualificationWorkerRequestSchema,
  ingestReceipt: canonicalSam31PrivateArtifactIngestReceiptSchema,
  stagingSourceSet: canonicalSam31QualificationStagingSourceSetSchema,
  preparedAt: timestamp,
  exactWorkerRequestIngestCheckpointAndFixtureLineageReread: z.literal(true),
  checkpointAndFixtureCoordinatesServerOwned: z.literal(true),
  callerBucketObjectPathUrlBytesOrCredentialsAccepted: z.literal(false),
  modelOrGpuRuntimeStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const packageRecordSchema = packageWithoutHashSchema.extend({
  packageHash: rawSha256,
}).strict()

export type CanonicalSam31QualificationPackageRecord = z.infer<
  typeof packageRecordSchema
>

export interface CanonicalSam31QualificationProbeFixtureReadPort {
  readonly schemaVersion: string
  rereadExactProbeFixture(input: {
    readonly workerRequest:
      CanonicalSam31SourceCheckpointQualificationWorkerRequest
  }): Promise<unknown | null>
}

export interface CanonicalSam31QualificationProbeFixtureAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_QUALIFICATION_PROBE_FIXTURE_AUTHORITY_PORT_VERSION
  rereadCurrentProbeFixtureAuthority(): Promise<{
    readonly artifactRef: z.infer<typeof evidenceRefSchema>
    readonly byteLength: number
    readonly sha256: string
    readonly width: typeof QUALIFICATION_PROBE_WIDTH
    readonly height: typeof QUALIFICATION_PROBE_HEIGHT
    readonly frameCount: typeof QUALIFICATION_PROBE_FRAME_COUNT
    readonly exactGenerationEtagLengthSha256ContentTypeKmsAndMetadataReread: true
    readonly customerMediaUsed: false
  } | null>
}

export interface CanonicalSam31QualificationPackageRepository
  extends CanonicalSam31QualificationWorkerRequestReadPort,
  CanonicalSam31QualificationStagingSourceReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_REPOSITORY_VERSION
  readonly evidenceClass: 'private_create_only_exact_reread'
  persistQualificationPackageCreateOnly(input: {
    readonly workerRequest:
      CanonicalSam31SourceCheckpointQualificationWorkerRequest
    readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
    readonly preparedAt: string
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly workerRequestRef: z.infer<typeof evidenceRefSchema>
    readonly packageRef: z.infer<typeof evidenceRefSchema>
    readonly modelOrGpuRuntimeStarted: false
    readonly customerCreditsMutated: false
    readonly productionAuthorityGranted: false
  }>
  rereadExactIngestReceipt(input: {
    readonly ingestReceiptRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalSam31PrivateArtifactIngestReceipt | null>
}

/**
 * Durable one-writer bridge between the reviewed model-artifact pipeline and
 * the A100 qualification phase. It stores metadata only: no checkpoint,
 * fixture, URL, credential, or developer-machine model bytes are accepted.
 */
export function createCanonicalSam31QualificationPackageRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly probeFixtureReadPort:
    CanonicalSam31QualificationProbeFixtureReadPort
  readonly prefix?: string
}): CanonicalSam31QualificationPackageRepository {
  assertObjectPort(input.objectPort)
  assertProbeFixtureReadPort(input.probeFixtureReadPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31QualificationPackageRepository = {
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_REPOSITORY_VERSION,
    evidenceClass: 'private_create_only_exact_reread',

    async persistQualificationPackageCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_qualification_package')
      const workerRequest =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
          untrusted.workerRequest,
        )
      const ingestReceipt = assertCanonicalSam31PrivateArtifactIngestReceipt(
        untrusted.ingestReceipt,
      )
      const preparedAt = timestamp.parse(untrusted.preparedAt)
      assertWorkerAndIngest({ workerRequest, ingestReceipt })
      const ingestReceiptRef = ingestRef(ingestReceipt)
      const probeFixtureSource = assertProbeFixtureSource(
        await input.probeFixtureReadPort.rereadExactProbeFixture({
          workerRequest,
        }),
        workerRequest,
      )
      const stagingSourceSet =
        createCanonicalSam31QualificationStagingSourceSet({
          workerRequest,
          checkpoint: {
            bucketName: ingestReceipt.checkpoint.coordinate.bucketName,
            objectName: ingestReceipt.checkpoint.coordinate.objectName,
            generation: ingestReceipt.checkpoint.coordinate.generation,
            etag: ingestReceipt.checkpoint.coordinate.etag,
            byteLength: ingestReceipt.checkpoint.coordinate.byteLength,
            sha256: ingestReceipt.checkpoint.coordinate.sha256,
            contentType: 'application/octet-stream',
            artifactRef: ingestReceipt.checkpoint.artifactRef,
            canonicalSourceAuthorityRef: ingestReceiptRef,
            exactGenerationEtagLengthSha256AndContentTypeReread: true,
            publicOrSignedUrlUsed: false,
          },
          probeFixture: probeFixtureSource,
          observedAt: preparedAt,
        })
      const workerRequestRef = requestRef(workerRequest)
      const payload = packageWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_RECORD_VERSION,
        source: 'canonical_server_sam3_1_qualification_package_repository',
        evidenceClass: 'gcs_create_only_exact_reread',
        workerRequestRef,
        ingestReceiptRef,
        workerRequest,
        ingestReceipt,
        stagingSourceSet,
        preparedAt,
        exactWorkerRequestIngestCheckpointAndFixtureLineageReread: true,
        checkpointAndFixtureCoordinatesServerOwned: true,
        callerBucketObjectPathUrlBytesOrCredentialsAccepted: false,
        modelOrGpuRuntimeStarted: false,
        customerCreditsMutated: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
      const record = packageRecordSchema.parse({
        ...payload,
        packageHash: sha256AuthorityValue(payload),
      })
      assertRecord(record)
      const body = serialize(record)
      const ingestBody = serialize(ingestReceipt)
      await input.objectPort.createOnly({
        objectPath: ingestRecordPath(prefix, ingestReceipt.ingestReceiptHash),
        body: ingestBody,
        contentSha256: digest(ingestBody),
      })
      const ingestReread = await readIngestReceipt({
        port: input.objectPort,
        path: ingestRecordPath(prefix, ingestReceipt.ingestReceiptHash),
      })
      if (!ingestReread || stableAuthorityStringify(ingestReread) !==
        stableAuthorityStringify(ingestReceipt)) {
        throw new Error('SAM 3.1 qualification ingest reread changed.')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, workerRequest.requestHash),
        body,
        contentSha256: digest(body),
      })
      const reread = await readRecord({
        port: input.objectPort,
        path: recordPath(prefix, workerRequest.requestHash),
      })
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(record)) {
        throw new Error('SAM 3.1 qualification package reread changed.')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        workerRequestRef,
        packageRef: {
          id: `${workerRequest.qualificationId}-package`,
          version: 1,
          contentHash: `sha256:${record.packageHash}` as const,
        },
        modelOrGpuRuntimeStarted: false as const,
        customerCreditsMutated: false as const,
        productionAuthorityGranted: false as const,
      })
    },

    async rereadExactWorkerRequest({ workerRequestRef }) {
      const expectedRef = evidenceRefSchema.parse(workerRequestRef)
      const record = await readRecordByRef({
        port: input.objectPort,
        prefix,
        workerRequestRef: expectedRef,
      })
      if (!record) return null
      return structuredClone(record.workerRequest)
    },

    async rereadExactSources({ workerRequest }) {
      const expectedRequest =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
          workerRequest,
        )
      const record = await readRecordByRef({
        port: input.objectPort,
        prefix,
        workerRequestRef: requestRef(expectedRequest),
      })
      if (!record) return null
      if (stableAuthorityStringify(record.workerRequest) !==
        stableAuthorityStringify(expectedRequest)) {
        throw new Error('SAM 3.1 qualification package crossed request.')
      }
      return structuredClone(record.stagingSourceSet)
    },

    async rereadExactIngestReceipt(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_qualification_ingest_read')
      const { ingestReceiptRef } = z.object({
        ingestReceiptRef: evidenceRefSchema,
      }).strict().parse(untrusted)
      const receipt = await readIngestReceipt({
        port: input.objectPort,
        path: ingestRecordPath(
          prefix,
          ingestReceiptRef.contentHash.slice('sha256:'.length),
        ),
      })
      if (!receipt) return null
      if (!sameRef(ingestRef(receipt), ingestReceiptRef)) {
        throw new Error('SAM 3.1 qualification ingest reference changed.')
      }
      return structuredClone(receipt)
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31GcpQualificationPackageRepository(
  input?: {
    readonly storage?: Storage
    readonly bucketName?: typeof CONTROL_PLANE_BUCKET
    readonly prefix?: string
  },
): CanonicalSam31QualificationPackageRepository {
  const storage = input?.storage ?? new Storage({ projectId: PROJECT_ID })
  return createCanonicalSam31QualificationPackageRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: input?.bucketName ?? CONTROL_PLANE_BUCKET,
    }),
    probeFixtureReadPort:
      createCanonicalSam31GcsQualificationProbeFixtureReadPort({ storage }),
    prefix: input?.prefix,
  })
}

export function createCanonicalSam31GcsQualificationProbeFixtureReadPort(
  input?: { readonly storage?: Storage },
): CanonicalSam31QualificationProbeFixtureReadPort {
  const storage = input?.storage ?? new Storage({ projectId: PROJECT_ID })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_PROBE_FIXTURE_GCS_PORT_VERSION,
    async rereadExactProbeFixture({ workerRequest: value }: {
      readonly workerRequest:
        CanonicalSam31SourceCheckpointQualificationWorkerRequest
    }) {
      const workerRequest =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(value)
      const live = storage.bucket(QUALIFICATION_FIXTURE_BUCKET)
        .file(QUALIFICATION_FIXTURE_OBJECT)
      let before: Record<string, unknown>
      try {
        const metadataResult = await live.getMetadata()
        before = metadataResult[0] as unknown as Record<string, unknown>
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
        || byteLength !== workerRequest.deterministicProbeFixture.byteLength
        || String(before.contentType ?? '') !== 'video/mp4'
        || String(before.kmsKeyName ?? '') !== QUALIFICATION_KMS_KEY
      ) throw new Error('SAM 3.1 qualification probe metadata changed.')
      const exact = storage.bucket(QUALIFICATION_FIXTURE_BUCKET).file(
        QUALIFICATION_FIXTURE_OBJECT,
        { generation },
      )
      const [body] = await exact.download({ validation: 'crc32c' })
      const [after] = await exact.getMetadata()
      if (
        body.byteLength !== byteLength
        || digest(body) !== workerRequest.deterministicProbeFixture.sha256
        || String(after.generation ?? '') !== generation
        || String(after.etag ?? '') !== etag
        || Number(after.size ?? -1) !== byteLength
        || String(after.contentType ?? '') !== 'video/mp4'
        || String(after.kmsKeyName ?? '') !== QUALIFICATION_KMS_KEY
      ) throw new Error('SAM 3.1 qualification probe bytes changed.')
      return Object.freeze({
        bucketName: QUALIFICATION_FIXTURE_BUCKET,
        objectName: QUALIFICATION_FIXTURE_OBJECT,
        generation,
        etag,
        byteLength,
        sha256: workerRequest.deterministicProbeFixture.sha256,
        contentType: 'video/mp4' as const,
        artifactRef: workerRequest.deterministicProbeFixture.artifactRef,
        canonicalSourceAuthorityRef:
          workerRequest.deterministicProbeFixture.artifactRef,
        exactGenerationEtagLengthSha256AndContentTypeReread: true as const,
        publicOrSignedUrlUsed: false as const,
      })
    },
  })
}

/**
 * Server-owned bootstrap read for the fixed non-customer probe. The worker
 * request is compiled from this exact reread and the package repository reads
 * the bytes again after compilation, so callers never supply fixture hashes,
 * dimensions, coordinates, URLs, or media bytes.
 */
export function createCanonicalSam31GcsQualificationProbeFixtureAuthorityReadPort(
  input?: { readonly storage?: Storage },
): CanonicalSam31QualificationProbeFixtureAuthorityReadPort {
  const storage = input?.storage ?? new Storage({ projectId: PROJECT_ID })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_PROBE_FIXTURE_AUTHORITY_PORT_VERSION,
    async rereadCurrentProbeFixtureAuthority() {
      const live = storage.bucket(QUALIFICATION_FIXTURE_BUCKET)
        .file(QUALIFICATION_FIXTURE_OBJECT)
      let before: Record<string, unknown>
      try {
        const metadataResult = await live.getMetadata()
        before = metadataResult[0] as unknown as Record<string, unknown>
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      const generation = String(before.generation ?? '')
      const etag = String(before.etag ?? '')
      const byteLength = Number(before.size ?? -1)
      const customMetadata = z.record(z.string(), z.string()).parse(
        before.metadata ?? {},
      )
      if (
        !/^[1-9][0-9]{0,30}$/u.test(generation)
        || !etag
        || !Number.isSafeInteger(byteLength)
        || byteLength <= 0
        || byteLength > 64 * 1024 * 1024
        || String(before.contentType ?? '') !== 'video/mp4'
        || String(before.kmsKeyName ?? '') !== QUALIFICATION_KMS_KEY
        || stableAuthorityStringify(customMetadata) !==
          stableAuthorityStringify(QUALIFICATION_PROBE_METADATA)
      ) throw new Error('SAM 3.1 qualification probe authority changed.')
      const exact = storage.bucket(QUALIFICATION_FIXTURE_BUCKET).file(
        QUALIFICATION_FIXTURE_OBJECT,
        { generation },
      )
      const [body] = await exact.download({ validation: 'crc32c' })
      const [after] = await exact.getMetadata()
      if (
        body.byteLength !== byteLength
        || String(after.generation ?? '') !== generation
        || String(after.etag ?? '') !== etag
        || Number(after.size ?? -1) !== byteLength
        || String(after.contentType ?? '') !== 'video/mp4'
        || String(after.kmsKeyName ?? '') !== QUALIFICATION_KMS_KEY
        || stableAuthorityStringify(after.metadata ?? {}) !==
          stableAuthorityStringify(QUALIFICATION_PROBE_METADATA)
      ) throw new Error('SAM 3.1 qualification probe authority reread changed.')
      const sha256 = digest(body)
      return Object.freeze({
        artifactRef: evidenceRefSchema.parse({
          id: `sam31-qualification-probe-${sha256.slice(0, 24)}`,
          version: 1,
          contentHash: `sha256:${sha256}`,
        }),
        byteLength,
        sha256,
        width: QUALIFICATION_PROBE_WIDTH,
        height: QUALIFICATION_PROBE_HEIGHT,
        frameCount: QUALIFICATION_PROBE_FRAME_COUNT,
        exactGenerationEtagLengthSha256ContentTypeKmsAndMetadataReread:
          true as const,
        customerMediaUsed: false as const,
      })
    },
  })
}

function assertRecord(value: unknown): CanonicalSam31QualificationPackageRecord {
  assertPlainSerializedData(value, 'sam31_qualification_package_record')
  const record = packageRecordSchema.parse(value)
  const { packageHash, ...payload } = record
  if (packageHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification package hash changed.')
  }
  const workerRequest =
    assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
      record.workerRequest,
    )
  const ingestReceipt = assertCanonicalSam31PrivateArtifactIngestReceipt(
    record.ingestReceipt,
  )
  const sources = assertCanonicalSam31QualificationStagingSourceSetForWorker(
    record.stagingSourceSet,
    workerRequest,
  )
  assertWorkerAndIngest({ workerRequest, ingestReceipt })
  const expectedRequestRef = requestRef(workerRequest)
  const expectedIngestRef = ingestRef(ingestReceipt)
  if (
    !sameRef(record.workerRequestRef, expectedRequestRef)
    || !sameRef(record.ingestReceiptRef, expectedIngestRef)
    || !sameRef(sources.workerRequestRef, expectedRequestRef)
    || !sameRef(sources.checkpoint.canonicalSourceAuthorityRef,
      expectedIngestRef)
    || sources.checkpoint.bucketName !==
      ingestReceipt.checkpoint.coordinate.bucketName
    || sources.checkpoint.objectName !==
      ingestReceipt.checkpoint.coordinate.objectName
    || sources.checkpoint.generation !==
      ingestReceipt.checkpoint.coordinate.generation
    || sources.checkpoint.etag !== ingestReceipt.checkpoint.coordinate.etag
    || sources.checkpoint.byteLength !==
      ingestReceipt.checkpoint.coordinate.byteLength
    || sources.checkpoint.sha256 !==
      ingestReceipt.checkpoint.coordinate.sha256
    || sources.probeFixture.bucketName !== QUALIFICATION_FIXTURE_BUCKET
    || !sources.probeFixture.objectName.startsWith(
      QUALIFICATION_FIXTURE_PREFIX,
    )
    || !sameRef(sources.probeFixture.canonicalSourceAuthorityRef,
      workerRequest.deterministicProbeFixture.artifactRef)
    || sources.observedAt !== record.preparedAt
  ) throw new Error('SAM 3.1 qualification package lineage changed.')
  return record
}

function assertWorkerAndIngest(input: {
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest
  ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
}): void {
  const expectedIngestRef = ingestRef(input.ingestReceipt)
  if (
    input.ingestReceipt.evidenceClass !== 'canonical_private_reread'
    || input.ingestReceipt.status !== 'ready_for_immutable_image_build_review'
    || !input.ingestReceipt.authority.canonicalTermsAcceptanceObserved
    || !input.ingestReceipt.authority.exactSourceAndCheckpointReread
    || !input.ingestReceipt.authority.imageBuildReviewEligible
    || input.workerRequest.ingestReceiptRef.schemaVersion !==
      input.ingestReceipt.schemaVersion
    || !sameRef(input.workerRequest.ingestReceiptRef, expectedIngestRef)
    || input.workerRequest.checkpoint.byteLength !==
      input.ingestReceipt.checkpoint.coordinate.byteLength
    || input.workerRequest.checkpoint.sha256 !==
      input.ingestReceipt.checkpoint.coordinate.sha256
    || !sameRef(input.workerRequest.checkpoint.artifactRef,
      input.ingestReceipt.checkpoint.artifactRef)
  ) throw new Error('SAM 3.1 qualification package ingest is not admitted.')
}

function assertProbeFixtureSource(
  value: unknown,
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest,
): CanonicalSam31QualificationStagingSourceCoordinate {
  assertPlainSerializedData(value, 'sam31_qualification_probe_fixture_source')
  const parsed = z.object({
    bucketName: z.literal(QUALIFICATION_FIXTURE_BUCKET),
    objectName: z.string().min(1).max(2_048)
      .refine((item) => item.startsWith(QUALIFICATION_FIXTURE_PREFIX)
        && item.endsWith('.mp4') && !item.includes('..')
        && !item.includes('//') && !item.includes('\\')),
    generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
    etag: z.string().trim().min(1).max(512),
    byteLength: z.number().int().positive().safe().max(64 * 1024 * 1024),
    sha256: rawSha256,
    contentType: z.literal('video/mp4'),
    artifactRef: evidenceRefSchema,
    canonicalSourceAuthorityRef: evidenceRefSchema,
    exactGenerationEtagLengthSha256AndContentTypeReread: z.literal(true),
    publicOrSignedUrlUsed: z.literal(false),
  }).strict().parse(value)
  if (
    parsed.byteLength !== workerRequest.deterministicProbeFixture.byteLength
    || parsed.sha256 !== workerRequest.deterministicProbeFixture.sha256
    || !sameRef(parsed.artifactRef,
      workerRequest.deterministicProbeFixture.artifactRef)
    || !sameRef(parsed.canonicalSourceAuthorityRef,
      workerRequest.deterministicProbeFixture.artifactRef)
  ) throw new Error('SAM 3.1 qualification probe fixture crossed request.')
  return parsed
}

async function readRecordByRef(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  prefix: string
  workerRequestRef: z.infer<typeof evidenceRefSchema>
}): Promise<CanonicalSam31QualificationPackageRecord | null> {
  const requestHash = input.workerRequestRef.contentHash.slice('sha256:'.length)
  const record = await readRecord({
    port: input.port,
    path: recordPath(input.prefix, requestHash),
  })
  if (!record) return null
  if (!sameRef(record.workerRequestRef, input.workerRequestRef)) {
    throw new Error('SAM 3.1 qualification package reference changed.')
  }
  return record
}

async function readRecord(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
}): Promise<CanonicalSam31QualificationPackageRecord | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 qualification package bytes are invalid.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 qualification package JSON is invalid.')
  }
  const record = assertRecord(decoded)
  if (stableAuthorityStringify(record) !== body.toString('utf8')) {
    throw new Error('SAM 3.1 qualification package bytes are not canonical.')
  }
  return record
}

async function readIngestReceipt(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
}): Promise<CanonicalSam31PrivateArtifactIngestReceipt | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 qualification ingest bytes are invalid.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 qualification ingest JSON is invalid.')
  }
  const receipt = assertCanonicalSam31PrivateArtifactIngestReceipt(decoded)
  if (stableAuthorityStringify(receipt) !== body.toString('utf8')) {
    throw new Error('SAM 3.1 qualification ingest bytes are not canonical.')
  }
  return receipt
}

function requestRef(
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest,
): z.infer<typeof evidenceRefSchema> {
  return evidenceRefSchema.parse({
    id: workerRequest.qualificationId,
    version: workerRequest.qualificationVersion,
    contentHash: `sha256:${workerRequest.requestHash}`,
  })
}

function ingestRef(
  ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt,
): z.infer<typeof evidenceRefSchema> {
  return evidenceRefSchema.parse({
    id: ingestReceipt.ingestReceiptId,
    version: ingestReceipt.ingestReceiptVersion,
    contentHash: `sha256:${ingestReceipt.ingestReceiptHash}`,
  })
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function recordPath(prefix: string, requestHash: string): string {
  return `${safePrefix.parse(prefix)}/${rawSha256.parse(requestHash)}.json`
}

function ingestRecordPath(prefix: string, ingestHash: string): string {
  return `${safePrefix.parse(prefix)}/ingests/${
    rawSha256.parse(ingestHash)
  }.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 qualification package record is oversized.')
  }
  return body
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new Error('SAM 3.1 qualification package object port is invalid.')
  }
}

function assertProbeFixtureReadPort(
  port: CanonicalSam31QualificationProbeFixtureReadPort,
): void {
  if (typeof port?.schemaVersion !== 'string'
    || typeof port?.rereadExactProbeFixture !== 'function') {
    throw new Error('SAM 3.1 qualification probe read port is invalid.')
  }
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return
  const code = (error as { code?: unknown }).code
  return typeof code === 'number' ? code : Number(code)
}
