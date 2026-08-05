import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  type CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceReadPort,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  archiveReviewRef,
  assertArchiveReview,
  assertDependencyReview,
  assertLicenseReview,
  dependencyReviewReference,
  licenseReviewReference,
  type CanonicalTrackAllSam31L4TaskQaArchiveSafetyReview,
  type CanonicalTrackAllSam31L4TaskQaDependencyReview,
  type CanonicalTrackAllSam31L4TaskQaLicenseReview,
  type CanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewReadPort,
} from './canonical-track-all-sam3_1-l4-task-qa-private-capsule-review'
import {
  TRACK_ALL_L4_TASK_QA_MAXIMUM_BUILD_SOURCE_BYTES,
  TRACK_ALL_L4_TASK_QA_PROJECT_ID,
  canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema,
} from './canonical-track-all-sam3_1-l4-task-qa-private-capsule-source-contract'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_CAPSULE_REVIEW_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-private-capsule-review-repository-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_GCS_PRIVATE_BUILD_SOURCE_READ_PORT_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-gcs-private-build-source-read-port-v1' as const

const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/private-capsule-reviews'
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..') && !value.endsWith('/'))
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type EvidenceRef = z.infer<typeof evidenceRefSchema>

export interface CanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewRepository
  extends CanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewReadPort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_CAPSULE_REVIEW_REPOSITORY_VERSION
  persistReviewsCreateOnly(input: {
    readonly archiveSafetyReview:
      CanonicalTrackAllSam31L4TaskQaArchiveSafetyReview
    readonly dependencyReview:
      CanonicalTrackAllSam31L4TaskQaDependencyReview
    readonly licenseReview: CanonicalTrackAllSam31L4TaskQaLicenseReview
  }): Promise<{
    readonly archiveSafetyReviewRef: EvidenceRef
    readonly dependencyReviewRef: EvidenceRef
    readonly licenseReviewRef: EvidenceRef
  }>
}

export function createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewRepository {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  assertObjectPort(input.objectPort)
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_CAPSULE_REVIEW_REPOSITORY_VERSION,

    async persistReviewsCreateOnly(value) {
      const archiveSafetyReview = assertArchiveReview(
        value.archiveSafetyReview,
      )
      const dependencyReview = assertDependencyReview(value.dependencyReview)
      const licenseReview = assertLicenseReview(value.licenseReview)
      const archiveSafetyReviewRef = archiveReviewRef(archiveSafetyReview)
      const dependencyReviewRef = dependencyReviewReference(dependencyReview)
      const licenseReviewRef = licenseReviewReference(licenseReview)
      await persistExact(
        input.objectPort,
        reviewPath(prefix, 'archive-safety', archiveSafetyReviewRef),
        archiveSafetyReview,
      )
      await persistExact(
        input.objectPort,
        reviewPath(prefix, 'dependency', dependencyReviewRef),
        dependencyReview,
      )
      await persistExact(
        input.objectPort,
        reviewPath(prefix, 'license', licenseReviewRef),
        licenseReview,
      )
      return Object.freeze({
        archiveSafetyReviewRef,
        dependencyReviewRef,
        licenseReviewRef,
      })
    },

    async rereadArchiveSafetyReview({ reviewRef }) {
      const ref = evidenceRefSchema.parse(reviewRef)
      const record = await readRecord(
        input.objectPort,
        reviewPath(prefix, 'archive-safety', ref),
        assertArchiveReview,
      )
      if (record && !sameRef(ref, archiveReviewRef(record))) {
        throw new Error('track_all_l4_archive_review_ref_mismatch')
      }
      return record
    },

    async rereadDependencyReview({ reviewRef }) {
      const ref = evidenceRefSchema.parse(reviewRef)
      const record = await readRecord(
        input.objectPort,
        reviewPath(prefix, 'dependency', ref),
        assertDependencyReview,
      )
      if (record && !sameRef(ref, dependencyReviewReference(record))) {
        throw new Error('track_all_l4_dependency_review_ref_mismatch')
      }
      return record
    },

    async rereadLicenseReview({ reviewRef }) {
      const ref = evidenceRefSchema.parse(reviewRef)
      const record = await readRecord(
        input.objectPort,
        reviewPath(prefix, 'license', ref),
        assertLicenseReview,
      )
      if (record && !sameRef(ref, licenseReviewReference(record))) {
        throw new Error('track_all_l4_license_review_ref_mismatch')
      }
      return record
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaGcsPrivateBuildSourceReadPort(
  input: { readonly storage?: Storage } = {},
): CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceReadPort & {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_GCS_PRIVATE_BUILD_SOURCE_READ_PORT_VERSION
} {
  const storage = input.storage ?? new Storage({
    projectId: TRACK_ALL_L4_TASK_QA_PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_GCS_PRIVATE_BUILD_SOURCE_READ_PORT_VERSION,
    async readExact(value) {
      const coordinate =
        canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema.parse(
          value,
        )
      const file = storage.bucket(coordinate.bucketName).file(
        coordinate.objectName,
        { generation: Number(coordinate.generation) },
      )
      let metadataBefore: Awaited<ReturnType<typeof file.getMetadata>>[0]
      try {
        ;[metadataBefore] = await file.getMetadata({ autoRetry: false })
      } catch (error) {
        if (isNotFound(error)) return null
        throw error
      }
      assertExactMetadata(metadataBefore, coordinate)
      const [body] = await file.download({
        validation: 'crc32c',
        autoRetry: false,
      })
      if (body.byteLength > TRACK_ALL_L4_TASK_QA_MAXIMUM_BUILD_SOURCE_BYTES) {
        throw new Error('track_all_l4_build_source_download_exceeded_bound')
      }
      const [metadataAfter] = await file.getMetadata({ autoRetry: false })
      assertExactMetadata(metadataAfter, coordinate)
      return {
        generationBeforeRead: String(metadataBefore.generation),
        etagBeforeRead: String(metadataBefore.etag),
        body,
        generationAfterRead: String(metadataAfter.generation),
        etagAfterRead: String(metadataAfter.etag),
      }
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaGcpPrivateCapsuleReviewRuntime(
  input: { readonly storage?: Storage } = {},
) {
  const storage = input.storage ?? new Storage({
    projectId: TRACK_ALL_L4_TASK_QA_PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  return Object.freeze({
    repository:
      createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewRepository({
        objectPort,
      }),
    privateBuildSourceReadPort:
      createCanonicalTrackAllSam31L4TaskQaGcsPrivateBuildSourceReadPort({
        storage,
      }),
    projectId: TRACK_ALL_L4_TASK_QA_PROJECT_ID,
    controlPlaneStateBucketName: CONTROL_PLANE_BUCKET,
    cloudOnlyControlPlaneInspection: true as const,
    developerMachinePackageModelCudaOrGpuInstallAllowed: false as const,
  })
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  const result = await port.createOnly({
    objectPath,
    body,
    contentSha256: sha256(body),
  })
  if (result !== 'created' && result !== 'already_exists') {
    throw new Error('track_all_l4_capsule_review_persistence_failed')
  }
  const reread = await port.readExact(objectPath)
  if (!reread || !reread.equals(body)) {
    throw new Error('track_all_l4_capsule_review_reread_failed')
  }
}

async function readRecord<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength > 16 * 1024 * 1024) {
    throw new Error('track_all_l4_capsule_review_record_too_large')
  }
  return parse(JSON.parse(body.toString('utf8')))
}

function reviewPath(
  prefix: string,
  kind: 'archive-safety' | 'dependency' | 'license',
  ref: EvidenceRef,
): string {
  return `${prefix}/${kind}/${ref.contentHash.slice(7)}.json`
}

function assertExactMetadata(
  metadata: { generation?: string | number | null, etag?: string | null,
    size?: string | number | null },
  coordinate: z.infer<
    typeof canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema
  >,
): void {
  if (String(metadata.generation) !== coordinate.generation
    || String(metadata.etag) !== coordinate.etag
    || Number(metadata.size) !== coordinate.byteLength) {
    throw new Error('track_all_l4_build_source_metadata_mismatch')
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null
    && 'code' in error && Number((error as { code: unknown }).code) === 404
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('track_all_l4_capsule_review_object_port_invalid')
  }
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
