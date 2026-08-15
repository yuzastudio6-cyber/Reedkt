import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
  canonicalCurrentGoogleCloudVertexA100ServingRateAuthoritySchema,
  canonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2Schema,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
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

export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_REPOSITORY_VERSION =
  'canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository-v1' as const
const RECORD_VERSION =
  'canonical-current-google-cloud-vertex-a100-serving-rate-authority-record-v1' as const
const RECORD_V2_VERSION =
  'canonical-current-google-cloud-vertex-a100-serving-rate-authority-record-v2' as const
const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/vertex-a100-serving-account-effective-rates'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//')
    && !value.endsWith('/'))
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type ServingRateAuthority =
  | CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
  | CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority
const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(RECORD_VERSION),
  source: z.literal(
    'canonical_server_vertex_a100_serving_account_effective_rate_repository',
  ),
  evidenceClass: z.literal('gcs_create_only_exact_reread'),
  authority: canonicalCurrentGoogleCloudVertexA100ServingRateAuthoritySchema,
  predictionUsageAndManagementSkuSetsPreserved: z.literal(true),
  trainingCustomJobOrComputeSkuAccepted: z.literal(false),
  callerRatePriceDurationOrServiceFeeAccepted: z.literal(false),
  endpointOrGpuJobStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const recordV2WithoutHashSchema = recordWithoutHashSchema.extend({
  schemaVersion: z.literal(RECORD_V2_VERSION),
  authority: canonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2Schema,
}).strict()
const recordSchema = recordWithoutHashSchema.extend({ recordHash: sha256 })
  .strict()
const recordV2Schema = recordV2WithoutHashSchema.extend({ recordHash: sha256 })
  .strict()
const anyRecordSchema = z.union([recordV2Schema, recordSchema])
type RecordValue = z.infer<typeof anyRecordSchema>

export interface CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository {
  persistCreateOnly(input: {
    readonly authority: ServingRateAuthority
    readonly publishedAt: string
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly rateAuthorityRef: z.infer<typeof refSchema>
  }>
  reread(input: {
    readonly rateAuthorityRef: z.infer<typeof refSchema>
    readonly at: string
  }): Promise<ServingRateAuthority | null>
}

export function createCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    async persistCreateOnly(untrusted: {
      readonly authority:
        CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority
      readonly publishedAt: string
    }) {
      assertPlainSerializedData(untrusted, 'vertex_a100_serving_rate_publish')
      const request = z.object({
        authority: z.unknown(),
        publishedAt: timestamp,
      }).strict().parse(untrusted)
      const authority = assertServingRateAuthority(
        request.authority,
        request.publishedAt,
      )
      const v2 = authority.schemaVersion ===
        'canonical-current-google-cloud-vertex-a100-serving-rate-authority-v2'
      const payload = (v2
        ? recordV2WithoutHashSchema
        : recordWithoutHashSchema).parse({
        schemaVersion: v2 ? RECORD_V2_VERSION : RECORD_VERSION,
        source:
          'canonical_server_vertex_a100_serving_account_effective_rate_repository',
        evidenceClass: 'gcs_create_only_exact_reread',
        authority,
        predictionUsageAndManagementSkuSetsPreserved: true,
        trainingCustomJobOrComputeSkuAccepted: false,
        callerRatePriceDurationOrServiceFeeAccepted: false,
        endpointOrGpuJobStarted: false,
        walletOrCreditMutationAuthorityGranted: false,
        publicDeliveryAuthorityGranted: false,
        productionAuthorityGranted: false,
        publishedAt: request.publishedAt,
      })
      const record = (v2 ? recordV2Schema : recordSchema).parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const reference = authorityRef(authority)
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new Error('Vertex A100 serving rate record is too large.')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, reference),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readRecord(input.objectPort, prefix, reference)
      if (!reread || reread.recordHash !== record.recordHash) {
        throw new Error('Vertex A100 serving rate create-only reread failed.')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        rateAuthorityRef: reference,
      })
    },
    async reread(untrusted: {
      readonly rateAuthorityRef: z.infer<typeof refSchema>
      readonly at: string
    }) {
      assertPlainSerializedData(untrusted, 'vertex_a100_serving_rate_reread')
      const request = z.object({
        rateAuthorityRef: refSchema,
        at: timestamp,
      }).strict().parse(untrusted)
      const record = await readRecord(input.objectPort, prefix,
        request.rateAuthorityRef)
      if (!record) return null
      const authority = assertServingRateAuthority(
        record.authority,
        request.at,
      )
      if (stableAuthorityStringify(authorityRef(authority)) !==
        stableAuthorityStringify(request.rateAuthorityRef)) {
        throw new Error('Vertex A100 serving rate reference changed.')
      }
      return structuredClone(authority)
    },
  })
}

export function createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('Vertex A100 serving rate repository project changed.')
  }
  return createCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId }),
      bucketName: input.bucketName ?? CONTROL_PLANE_STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

function authorityRef(
  authority: ServingRateAuthority,
) {
  return refSchema.parse({
    id: authority.rateAuthorityId,
    version: authority.rateAuthorityVersion,
    contentHash: `sha256:${authority.rateAuthorityHash}`,
  })
}

function assertServingRateAuthority(
  value: unknown,
  at: string,
): ServingRateAuthority {
  if (value && typeof value === 'object'
    && Reflect.get(value, 'schemaVersion') ===
      'canonical-current-google-cloud-vertex-a100-serving-rate-authority-v2') {
    return assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
      value,
      at,
    )
  }
  return assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
    value,
    at,
  )
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  reference: z.infer<typeof refSchema>,
): Promise<RecordValue | null> {
  const bytes = await port.readExact(recordPath(prefix, reference))
  if (!bytes) return null
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
    || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Vertex A100 serving rate record bytes are invalid.')
  }
  const raw = bytes.toString('utf8')
  let decoded: unknown
  try {
    decoded = JSON.parse(raw)
  } catch {
    throw new Error('Vertex A100 serving rate record JSON is invalid.')
  }
  assertPlainSerializedData(decoded, 'vertex_a100_serving_rate_record')
  const record = anyRecordSchema.parse(decoded)
  const { recordHash, ...payload } = record
  if (recordHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(record) !== raw
    || stableAuthorityStringify(authorityRef(record.authority)) !==
      stableAuthorityStringify(reference)) {
    throw new Error('Vertex A100 serving rate exact reread failed.')
  }
  return record
}

function recordPath(prefix: string, reference: z.infer<typeof refSchema>) {
  const digest = createHash('sha256')
    .update(stableAuthorityStringify(reference), 'utf8').digest('hex')
  return `${prefix}/${digest}.json`
}
