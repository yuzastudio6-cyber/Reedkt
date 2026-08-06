import { createHash } from 'node:crypto'

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
import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
  canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema,
  type CanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'

export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_REPOSITORY_VERSION =
  'canonical-current-google-cloud-vertex-a100-rate-authority-repository-v1' as const
export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_RECORD_VERSION =
  'canonical-current-google-cloud-vertex-a100-rate-authority-record-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/vertex-a100-account-effective-rates'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_RECORD_VERSION,
  ),
  source: z.literal(
    'canonical_server_vertex_a100_account_effective_rate_repository',
  ),
  evidenceClass: z.literal('gcs_create_only_exact_reread'),
  authority: canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema,
  vertexUsageSkuSetPreservedWithoutManagementFeeDoubleCount: z.literal(true),
  exactBillingAccountSkuRegionCurrencyTierAndPricePreserved: z.literal(true),
  immutableAuthorityReferenceOnly: z.literal(true),
  callerRatePriceRouteDurationOrServiceFeeAccepted: z.literal(false),
  providerOrGpuJobStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const recordSchema = recordWithoutHashSchema.extend({ recordHash: sha256 })
  .strict()
type RecordValue = z.infer<typeof recordSchema>

export interface CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository {
  readonly schemaVersion:
    typeof CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly authority: CanonicalCurrentGoogleCloudVertexA100RateAuthority
    readonly publishedAt: string
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly rateAuthorityRef: z.infer<typeof refSchema>
  }>
  reread(input: {
    readonly rateAuthorityRef: z.infer<typeof refSchema>
    readonly at: string
  }): Promise<CanonicalCurrentGoogleCloudVertexA100RateAuthority | null>
}

export function createCanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository {
  if (!input.objectPort || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new Error('Vertex A100 rate repository object port is absent.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_REPOSITORY_VERSION,
    async persistCreateOnly(untrusted: {
      readonly authority: CanonicalCurrentGoogleCloudVertexA100RateAuthority
      readonly publishedAt: string
    }) {
      assertPlainSerializedData(untrusted, 'vertex_a100_rate_publication')
      const request = z.object({
        authority: z.unknown(),
        publishedAt: timestamp,
      }).strict().parse(untrusted)
      const authority =
        assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
          request.authority,
          request.publishedAt,
        )
      const payload = recordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_RECORD_VERSION,
        source:
          'canonical_server_vertex_a100_account_effective_rate_repository',
        evidenceClass: 'gcs_create_only_exact_reread',
        authority,
        vertexUsageSkuSetPreservedWithoutManagementFeeDoubleCount: true,
        exactBillingAccountSkuRegionCurrencyTierAndPricePreserved: true,
        immutableAuthorityReferenceOnly: true,
        callerRatePriceRouteDurationOrServiceFeeAccepted: false,
        providerOrGpuJobStarted: false,
        walletOrCreditMutationAuthorityGranted: false,
        publicDeliveryAuthorityGranted: false,
        productionAuthorityGranted: false,
        publishedAt: request.publishedAt,
      })
      const record = recordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const reference = authorityRef(authority)
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw conflict('record_size_invalid')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, reference),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readRecord(input.objectPort, prefix, reference)
      if (!reread || reread.recordHash !== record.recordHash) {
        throw conflict('create_only_reread_mismatch')
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
      assertPlainSerializedData(untrusted, 'vertex_a100_rate_reread')
      const request = z.object({
        rateAuthorityRef: refSchema,
        at: timestamp,
      }).strict().parse(untrusted)
      const record = await readRecord(
        input.objectPort,
        prefix,
        request.rateAuthorityRef,
      )
      if (!record) return null
      const authority =
        assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
          record.authority,
          request.at,
        )
      if (stableAuthorityStringify(authorityRef(authority)) !==
        stableAuthorityStringify(request.rateAuthorityRef)) {
        throw conflict('exact_reference_mismatch')
      }
      return structuredClone(authority)
    },
  })
}

export function createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('Vertex A100 rate repository requires project reeditpro.')
  }
  const storage = input.storage ?? new Storage({ projectId })
  return createCanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: input.bucketName ?? CONTROL_PLANE_STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

function authorityRef(
  authority: CanonicalCurrentGoogleCloudVertexA100RateAuthority,
): z.infer<typeof refSchema> {
  return refSchema.parse({
    id: authority.rateAuthorityId,
    version: authority.rateAuthorityVersion,
    contentHash: `sha256:${authority.rateAuthorityHash}`,
  })
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
    throw conflict('record_bytes_invalid')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw conflict('record_json_invalid')
  }
  assertPlainSerializedData(decoded, 'vertex_a100_rate_record')
  const record = recordSchema.parse(decoded)
  const { recordHash, ...payload } = record
  if (
    recordHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(record) !== bytes.toString('utf8')
    || stableAuthorityStringify(authorityRef(record.authority)) !==
      stableAuthorityStringify(reference)
  ) throw conflict('record_exact_reread_invalid')
  return record
}

function recordPath(
  prefix: string,
  reference: z.infer<typeof refSchema>,
): string {
  const digest = createHash('sha256')
    .update(stableAuthorityStringify(reference), 'utf8').digest('hex')
  return `${prefix}/${digest}.json`
}

function conflict(reason: string): Error {
  return new Error(`Vertex A100 rate repository: ${reason}.`)
}
