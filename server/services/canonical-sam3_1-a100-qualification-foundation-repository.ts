import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31A100QualificationFoundationObservation,
  canonicalSam31A100QualificationFoundationObservationRef,
  canonicalSam31A100QualificationFoundationObservationSchema,
  createCanonicalSam31A100QualificationFoundationOwner,
  type CanonicalSam31A100QualificationLiveAuditReadPort,
  type CanonicalSam31A100QualificationFoundationObservation,
  type CanonicalSam31A100QualificationFoundationReadPort,
} from './canonical-sam3_1-a100-qualification-foundation-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_A100_QUALIFICATION_FOUNDATION_REPOSITORY_VERSION =
  'canonical-sam3_1-a100-qualification-foundation-repository-v1' as const
export const CANONICAL_SAM3_1_A100_QUALIFICATION_FOUNDATION_RECORD_VERSION =
  'canonical-sam3_1-a100-qualification-foundation-record-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/sam3_1/a100-qualification-foundation/v1/observations'
const MAXIMUM_RECORD_BYTES = 512 * 1024
const FIVE_MINUTES = 5 * 60 * 1_000
const timestamp = z.string().datetime({ offset: true })
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const timeBucket = z.string().regex(/^[0-9]{8}T[0-9]{4}Z$/u)
const observationRefSchema = z.object({
  id: z.literal(
    'weeditpro-sam31-a100-qualification-foundation-observation',
  ),
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_A100_QUALIFICATION_FOUNDATION_RECORD_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_a100_foundation_observation_repository',
  ),
  evidenceClass: z.literal('gcs_create_only_exact_reread'),
  observationTimeBucket: timeBucket,
  observationRef: observationRefSchema,
  observation:
    canonicalSam31A100QualificationFoundationObservationSchema,
  publishedAt: timestamp,
  exactFiveMinuteCreateOnlySlot: z.literal(true),
  exactObservationHashAndSlotReread: z.literal(true),
  callerFoundationReferenceOrCloudResourceAccepted: z.literal(false),
  gpuJobStarted: z.literal(false),
  modelOrCheckpointDownloaded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((record, context) => {
  if (
    record.observationTimeBucket !== bucketFor(record.observation.observedAt)
    || stableAuthorityStringify(record.observationRef) !==
      stableAuthorityStringify(
        canonicalSam31A100QualificationFoundationObservationRef(
          record.observation,
        ),
      )
    || Date.parse(record.publishedAt) <
      Date.parse(record.observation.observedAt)
    || Date.parse(record.publishedAt) -
      Date.parse(record.observation.observedAt) > FIVE_MINUTES
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 A100 foundation record lost its exact slot lineage.',
  })
})
const recordSchema = recordWithoutHashSchema.extend({
  recordHash: rawSha256,
}).strict()
type FoundationRecord = z.infer<typeof recordSchema>

export interface CanonicalSam31A100QualificationFoundationRepository
  extends CanonicalSam31A100QualificationFoundationReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_A100_QUALIFICATION_FOUNDATION_REPOSITORY_VERSION
  readonly evidenceClass: 'private_create_only_exact_reread'
  persistCurrentFoundationCreateOnly(input: {
    readonly observation:
      CanonicalSam31A100QualificationFoundationObservation
    readonly publishedAt: string
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly observationRef: z.infer<typeof observationRefSchema>
    readonly gpuJobStarted: false
    readonly modelOrCheckpointDownloaded: false
    readonly customerCreditsMutated: false
    readonly productionAuthorityGranted: false
  }>
}

export function createCanonicalSam31A100QualificationFoundationRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31A100QualificationFoundationRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31A100QualificationFoundationRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_A100_QUALIFICATION_FOUNDATION_REPOSITORY_VERSION,
    evidenceClass: 'private_create_only_exact_reread' as const,

    async persistCurrentFoundationCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_a100_foundation_publication')
      const request = z.object({
        observation: z.unknown(),
        publishedAt: timestamp,
      }).strict().parse(untrusted)
      const observation =
        assertCanonicalSam31A100QualificationFoundationObservation(
          request.observation,
          { purpose: 'private_artifact_staging', at: request.publishedAt },
        )
      const observationRef =
        observationRefSchema.parse(
          canonicalSam31A100QualificationFoundationObservationRef(
            observation,
          ),
        )
      const payload = recordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_A100_QUALIFICATION_FOUNDATION_RECORD_VERSION,
        source:
          'canonical_server_sam3_1_a100_foundation_observation_repository',
        evidenceClass: 'gcs_create_only_exact_reread',
        observationTimeBucket: bucketFor(observation.observedAt),
        observationRef,
        observation,
        publishedAt: request.publishedAt,
        exactFiveMinuteCreateOnlySlot: true,
        exactObservationHashAndSlotReread: true,
        callerFoundationReferenceOrCloudResourceAccepted: false,
        gpuJobStarted: false,
        modelOrCheckpointDownloaded: false,
        customerCreditsMutated: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
      const record = recordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const body = serialize(record)
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, record.observationTimeBucket),
        body,
        contentSha256: digest(body),
      })
      const reread = await readRecord(
        input.objectPort,
        recordPath(prefix, record.observationTimeBucket),
      )
      if (!reread || reread.recordHash !== record.recordHash) {
        throw conflict('foundation_record_create_only_reread_mismatch')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        observationRef,
        gpuJobStarted: false as const,
        modelOrCheckpointDownloaded: false as const,
        customerCreditsMutated: false as const,
        productionAuthorityGranted: false as const,
      })
    },

    async rereadCurrentFoundation(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_a100_foundation_read')
      const request = z.object({
        purpose: z.enum([
          'private_artifact_staging', 'a100_qualification_dispatch',
        ]),
        at: timestamp,
      }).strict().parse(untrusted)
      const currentBucketMs = floorBucket(Date.parse(request.at))
      for (let index = 0; index <= 3; index += 1) {
        const bucket = formatBucket(currentBucketMs - index * FIVE_MINUTES)
        const record = await readRecord(
          input.objectPort,
          recordPath(prefix, bucket),
        )
        if (!record) continue
        if (record.observationTimeBucket !== bucket) {
          throw conflict('foundation_record_time_bucket_mismatch')
        }
        return structuredClone(
          assertCanonicalSam31A100QualificationFoundationObservation(
            record.observation,
            { purpose: request.purpose, at: request.at },
          ),
        )
      }
      return null
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalGcsSam31A100QualificationFoundationRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalSam31A100QualificationFoundationRepository {
  const projectId = input.projectId ?? PROJECT_ID
  const bucketName = input.bucketName ?? CONTROL_PLANE_BUCKET
  if (projectId !== PROJECT_ID || bucketName !== CONTROL_PLANE_BUCKET) {
    throw new Error('SAM 3.1 A100 foundation GCS scope is not canonical.')
  }
  const storage = input.storage ?? new Storage({ projectId })
  return createCanonicalSam31A100QualificationFoundationRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName,
    }),
    prefix: input.prefix,
  })
}

export async function publishCanonicalSam31A100QualificationFoundation(
  input: {
    readonly liveAuditReadPort:
      CanonicalSam31A100QualificationLiveAuditReadPort
    readonly repository:
      CanonicalSam31A100QualificationFoundationRepository
    readonly publishedAt: string
  },
) {
  const publishedAt = timestamp.parse(input.publishedAt)
  if (typeof input.repository?.persistCurrentFoundationCreateOnly !==
    'function') {
    throw new Error('SAM 3.1 A100 foundation repository is unavailable.')
  }
  const owner = createCanonicalSam31A100QualificationFoundationOwner({
    liveAuditReadPort: input.liveAuditReadPort,
  })
  const observation =
    assertCanonicalSam31A100QualificationFoundationObservation(
      await owner.rereadCurrentFoundation({
        purpose: 'private_artifact_staging',
        at: publishedAt,
      }),
      { purpose: 'private_artifact_staging', at: publishedAt },
    )
  const receipt = await input.repository.persistCurrentFoundationCreateOnly({
    observation,
    publishedAt,
  })
  const reread = await input.repository.rereadCurrentFoundation({
    purpose: 'private_artifact_staging',
    at: publishedAt,
  })
  const accepted =
    assertCanonicalSam31A100QualificationFoundationObservation(
      reread,
      { purpose: 'private_artifact_staging', at: publishedAt },
    )
  if (accepted.observationHash !== observation.observationHash) {
    throw conflict('foundation_publication_exact_reread_mismatch')
  }
  return Object.freeze({
    ...receipt,
    observation: structuredClone(accepted),
    exactPublicationReread: true as const,
  })
}

function assertRecord(value: unknown): FoundationRecord {
  assertPlainSerializedData(value, 'sam31_a100_foundation_record')
  const record = recordSchema.parse(value)
  const { recordHash, ...payload } = record
  if (recordHash !== sha256AuthorityValue(payload)) {
    throw conflict('foundation_record_hash_invalid')
  }
  assertCanonicalSam31A100QualificationFoundationObservation(
    record.observation,
  )
  return record
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
): Promise<FoundationRecord | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('foundation_record_bytes_invalid')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('foundation_record_json_invalid')
  }
  const record = assertRecord(decoded)
  if (stableAuthorityStringify(record) !== body.toString('utf8')) {
    throw conflict('foundation_record_canonical_bytes_invalid')
  }
  return record
}

function recordPath(prefix: string, bucket: string): string {
  return `${safePrefix.parse(prefix)}/${timeBucket.parse(bucket)}.json`
}

function bucketFor(value: string): string {
  return formatBucket(floorBucket(Date.parse(timestamp.parse(value))))
}

function floorBucket(value: number): number {
  if (!Number.isFinite(value)) throw conflict('foundation_time_invalid')
  return Math.floor(value / FIVE_MINUTES) * FIVE_MINUTES
}

function formatBucket(value: number): string {
  const iso = new Date(value).toISOString()
  return timeBucket.parse(
    iso.slice(0, 4) + iso.slice(5, 7) + iso.slice(8, 10)
    + 'T' + iso.slice(11, 13) + iso.slice(14, 16) + 'Z',
  )
}

function serialize(value: unknown): Buffer {
  return Buffer.from(stableAuthorityStringify(value), 'utf8')
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new Error('SAM 3.1 A100 foundation object port is invalid.')
  }
}

function conflict(code: string): Error {
  return new Error(`SAM 3.1 A100 foundation repository conflict: ${code}`)
}
