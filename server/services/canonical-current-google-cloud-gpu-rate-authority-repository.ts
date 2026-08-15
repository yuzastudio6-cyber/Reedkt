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
import type {
  CanonicalSam31GpuTaskRateAuthorityReadPort,
} from './canonical-sam3_1-gpu-task-context-owner'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  canonicalCurrentGoogleCloudGpuRateAuthoritySchema,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'

export const CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_REPOSITORY_VERSION =
  'canonical-current-google-cloud-gpu-rate-authority-repository-v1' as const
export const CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_RECORD_VERSION =
  'canonical-current-google-cloud-gpu-rate-authority-record-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/account-effective-rates'
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
const routeId = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])
const rateRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_RECORD_VERSION,
  ),
  source: z.literal(
    'canonical_server_account_effective_gpu_rate_authority_repository',
  ),
  evidenceClass: z.literal('gcs_create_only_exact_reread'),
  authority: canonicalCurrentGoogleCloudGpuRateAuthoritySchema,
  exactBillingAccountSkuRegionCurrencyTierAndPricePreserved: z.literal(true),
  immutableAuthorityReferenceOnly: z.literal(true),
  callerRatePriceRouteDurationOrServiceFeeAccepted: z.literal(false),
  providerOrGpuJobStarted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const recordSchema = recordWithoutHashSchema.extend({
  recordHash: sha256,
}).strict()
type RateRecord = z.infer<typeof recordSchema>
type RateReadInput = Parameters<
  CanonicalSam31GpuTaskRateAuthorityReadPort[
    'rereadApprovedCurrentRate'
  ]
>[0]

export interface CanonicalCurrentGoogleCloudGpuRateAuthorityRepository
  extends CanonicalSam31GpuTaskRateAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_REPOSITORY_VERSION
  readonly evidenceClass:
    'gcs_create_only_exact_reread_account_effective_gpu_rates'
  persistCurrentRateAuthorityCreateOnly(input: {
    readonly authority: CanonicalCurrentGoogleCloudGpuRateAuthority
    readonly publishedAt: string
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly rateAuthorityRef: z.infer<typeof rateRefSchema>
    readonly providerOrGpuJobStarted: false
    readonly walletOrCreditMutationAuthorityGranted: false
  }>
}

type PersistInput = Parameters<
  CanonicalCurrentGoogleCloudGpuRateAuthorityRepository[
    'persistCurrentRateAuthorityCreateOnly'
  ]
>[0]

/**
 * Immutable publication/read boundary for the exact billing-account-effective
 * A100/L4 price authorities used during estimate approval and funded launch.
 * It never reads a caller price and never converts internal cost into customer
 * pricing, a service fee, a wallet mutation, or runtime authority.
 */
export function createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCurrentGoogleCloudGpuRateAuthorityRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_REPOSITORY_VERSION,
    evidenceClass:
      'gcs_create_only_exact_reread_account_effective_gpu_rates' as const,
    async persistCurrentRateAuthorityCreateOnly(untrusted: PersistInput) {
      assertPlainSerializedData(untrusted, 'gpu_rate_authority_publication')
      const request = z.object({
        authority: z.unknown(),
        publishedAt: timestamp,
      }).strict().parse(untrusted)
      const authority = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        request.authority,
        request.publishedAt,
      )
      const payload = recordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_RECORD_VERSION,
        source:
          'canonical_server_account_effective_gpu_rate_authority_repository',
        evidenceClass: 'gcs_create_only_exact_reread',
        authority,
        exactBillingAccountSkuRegionCurrencyTierAndPricePreserved: true,
        immutableAuthorityReferenceOnly: true,
        callerRatePriceRouteDurationOrServiceFeeAccepted: false,
        providerOrGpuJobStarted: false,
        customerPricingOrServiceFeeAuthorityGranted: false,
        walletOrCreditMutationAuthorityGranted: false,
        productionAuthorityGranted: false,
        publishedAt: request.publishedAt,
      })
      const record = recordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const ref = rateAuthorityRef(authority)
      const body = serialize(record)
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, ref),
        body,
        contentSha256: hashBytes(body),
      })
      const reread = await readRecord(input.objectPort, prefix, ref)
      if (!reread || reread.recordHash !== record.recordHash) {
        throw conflict('rate_authority_create_only_reread_mismatch')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        rateAuthorityRef: ref,
        providerOrGpuJobStarted: false as const,
        walletOrCreditMutationAuthorityGranted: false as const,
      })
    },
    async rereadApprovedCurrentRate(untrusted: RateReadInput) {
      assertPlainSerializedData(untrusted, 'gpu_rate_authority_read')
      const request = z.object({
        rateAuthorityRef: rateRefSchema,
        routeId,
        at: timestamp,
      }).strict().parse(untrusted)
      const record = await readRecord(
        input.objectPort,
        prefix,
        request.rateAuthorityRef,
      )
      if (!record) return null
      const authority = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        record.authority,
        request.at,
      )
      if (authority.routeId !== request.routeId
        || stableAuthorityStringify(rateAuthorityRef(authority)) !==
          stableAuthorityStringify(request.rateAuthorityRef)) {
        throw conflict('rate_authority_exact_scope_mismatch')
      }
      return structuredClone(authority)
    },
  })
}

export function createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalCurrentGoogleCloudGpuRateAuthorityRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('GPU rate repository requires project reeditpro.')
  }
  const storage = input.storage ?? new Storage({ projectId })
  return createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: input.bucketName ?? CONTROL_PLANE_STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

function rateAuthorityRef(
  authority: CanonicalCurrentGoogleCloudGpuRateAuthority,
): z.infer<typeof rateRefSchema> {
  return rateRefSchema.parse({
    id: authority.rateAuthorityId,
    version: authority.rateAuthorityVersion,
    contentHash: `sha256:${authority.rateAuthorityHash}`,
  })
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  ref: z.infer<typeof rateRefSchema>,
): Promise<RateRecord | null> {
  const bytes = await port.readExact(recordPath(prefix, ref))
  if (!bytes) return null
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
    || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('rate_authority_record_bytes_invalid')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw conflict('rate_authority_record_json_invalid')
  }
  assertPlainSerializedData(decoded, 'gpu_rate_authority_record')
  const record = recordSchema.parse(decoded)
  const { recordHash, ...payload } = record
  if (recordHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(record) !== bytes.toString('utf8')
    || stableAuthorityStringify(rateAuthorityRef(record.authority)) !==
      stableAuthorityStringify(ref)) {
    throw conflict('rate_authority_record_exact_reread_invalid')
  }
  return record
}

function recordPath(
  prefix: string,
  ref: z.infer<typeof rateRefSchema>,
): string {
  return `${prefix}/${hashText(stableAuthorityStringify(ref))}.json`
}

function serialize(value: unknown): Buffer {
  const bytes = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (bytes.byteLength < 2 || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('rate_authority_record_size_invalid')
  }
  return bytes
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('GPU rate authority repository object port is absent.')
  }
}

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(reason: string): Error {
  return new Error(`GPU rate authority repository: ${reason}.`)
}
