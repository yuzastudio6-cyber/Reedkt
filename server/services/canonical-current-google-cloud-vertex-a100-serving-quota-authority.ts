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

export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_QUOTA_AUTHORITY_VERSION =
  'canonical-current-google-cloud-vertex-a100-serving-quota-authority-v1' as const
export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_QUOTA_REPOSITORY_VERSION =
  'canonical-current-google-cloud-vertex-a100-serving-quota-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const PROJECT_NUMBER = '390722338345' as const
const REGION = 'us-central1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/vertex-a100-serving-quota-authorities'
const SERVICE = 'aiplatform.googleapis.com' as const
const METRIC =
  'aiplatform.googleapis.com/custom_model_serving_nvidia_a100_80gb_gpus' as const
const DISPLAY_NAME = 'Custom model serving Nvidia A100 80GB GPUs' as const
const LIMIT_UNIT = '1/{project}/{region}' as const
const QUOTA_URL =
  `https://serviceusage.googleapis.com/v1beta1/projects/${PROJECT_NUMBER}`
  + `/services/${SERVICE}/consumerQuotaMetrics/`
  + 'aiplatform.googleapis.com%2Fcustom_model_serving_nvidia_a100_80gb_gpus'
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const MAXIMUM_RESPONSE_BYTES = 2 * 1024 * 1024

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_QUOTA_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_owned_current_google_cloud_vertex_a100_serving_quota_reread',
  ),
  quotaAuthorityId: safeId,
  quotaAuthorityVersion: z.number().int().positive().safe(),
  projectId: z.literal(PROJECT_ID),
  projectNumber: z.literal(PROJECT_NUMBER),
  service: z.literal(SERVICE),
  metric: z.literal(METRIC),
  displayName: z.literal(DISPLAY_NAME),
  region: z.literal(REGION),
  limitUnit: z.literal(LIMIT_UNIT),
  effectiveLimit: z.literal(1),
  requiredMaximumReplicaCount: z.literal(1),
  producerOverrideValue: z.literal(1),
  consumerOverrideValue: z.literal(-1),
  quotaSnapshotRef: refSchema,
  observedAt: timestamp,
  expiresAt: timestamp,
  maximumAuthorityAgeSeconds: z.literal(3_600),
  exactCloudQuotaMetricAndRegionalBucketReread: z.literal(true),
  servingCapacityGranted: z.literal(true),
  callerQuotaMetricRegionOrLimitAccepted: z.literal(false),
  endpointOrGpuJobStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    Date.parse(value.expiresAt) - Date.parse(value.observedAt) !== 3_600_000
    || value.effectiveLimit < value.requiredMaximumReplicaCount
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 serving quota authority time or capacity changed.',
  })
})

export const canonicalCurrentGoogleCloudVertexA100ServingQuotaAuthoritySchema =
  authorityWithoutHashSchema.extend({ authorityHash: rawSha256 }).strict()
export type CanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority = z.infer<
  typeof canonicalCurrentGoogleCloudVertexA100ServingQuotaAuthoritySchema
>

type AuthRequest = {
  request(input: {
    readonly url: string
    readonly method: 'GET'
    readonly params: Readonly<Record<string, string>>
    readonly timeout: number
    readonly retry: false
    readonly maxRedirects: 0
    readonly responseType: 'json'
    readonly maxContentLength: number
  }): Promise<{ readonly data: unknown }>
}

export async function observeCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority(
  input: {
    readonly quotaAuthorityId: string
    readonly quotaAuthorityVersion: number
    readonly auth: AuthRequest
    readonly now?: () => Date
  },
): Promise<CanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority> {
  const now = input.now ?? (() => new Date())
  const observedAt = now().toISOString()
  let response: unknown
  try {
    const result = await input.auth.request({
      url: QUOTA_URL,
      method: 'GET',
      params: { view: 'FULL' },
      timeout: 20_000,
      retry: false,
      maxRedirects: 0,
      responseType: 'json',
      maxContentLength: MAXIMUM_RESPONSE_BYTES,
    })
    response = result.data
  } catch {
    throw new Error('Vertex A100 serving quota reread failed.')
  }
  if (Buffer.byteLength(stableAuthorityStringify(response), 'utf8') >
    MAXIMUM_RESPONSE_BYTES) {
    throw new Error('Vertex A100 serving quota response exceeded its bound.')
  }
  const parsed = z.object({
    metric: z.literal(METRIC),
    displayName: z.literal(DISPLAY_NAME),
    consumerQuotaLimits: z.array(z.object({
      unit: z.string(),
      isPrecise: z.boolean(),
      quotaBuckets: z.array(z.object({
        effectiveLimit: z.string().optional(),
        dimensions: z.record(z.string(), z.string()).optional(),
        producerOverride: z.object({
          overrideValue: z.string(),
          dimensions: z.record(z.string(), z.string()),
        }).passthrough().optional(),
        consumerOverride: z.object({
          overrideValue: z.string(),
          dimensions: z.record(z.string(), z.string()),
        }).passthrough().optional(),
      }).passthrough()),
    }).passthrough()).min(1),
  }).passthrough().parse(response)
  const limits = parsed.consumerQuotaLimits.filter((limit) =>
    limit.unit === LIMIT_UNIT && limit.isPrecise)
  const buckets = limits.flatMap((limit) => limit.quotaBuckets)
    .filter((bucket) => bucket.dimensions?.region === REGION)
  if (limits.length !== 1 || buckets.length !== 1) {
    throw new Error('Vertex A100 serving regional quota bucket is ambiguous.')
  }
  const bucket = buckets[0]
  if (
    bucket.effectiveLimit !== '1'
    || bucket.producerOverride?.overrideValue !== '1'
    || bucket.producerOverride.dimensions.region !== REGION
    || bucket.consumerOverride?.overrideValue !== '-1'
    || bucket.consumerOverride.dimensions.region !== REGION
  ) throw new Error('Vertex A100 serving capacity is not exactly one.')
  const quotaSnapshotRef = refSchema.parse({
    id: 'weeditpro-vertex-a100-serving-us-central1-quota-snapshot',
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue({
      metric: parsed.metric,
      displayName: parsed.displayName,
      unit: limits[0].unit,
      isPrecise: limits[0].isPrecise,
      bucket,
    })}`,
  })
  const payload = authorityWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_QUOTA_AUTHORITY_VERSION,
    source:
      'server_owned_current_google_cloud_vertex_a100_serving_quota_reread',
    quotaAuthorityId: safeId.parse(input.quotaAuthorityId),
    quotaAuthorityVersion: z.number().int().positive().safe()
      .parse(input.quotaAuthorityVersion),
    projectId: PROJECT_ID,
    projectNumber: PROJECT_NUMBER,
    service: SERVICE,
    metric: METRIC,
    displayName: DISPLAY_NAME,
    region: REGION,
    limitUnit: LIMIT_UNIT,
    effectiveLimit: 1,
    requiredMaximumReplicaCount: 1,
    producerOverrideValue: 1,
    consumerOverrideValue: -1,
    quotaSnapshotRef,
    observedAt,
    expiresAt: new Date(Date.parse(observedAt) + 3_600_000).toISOString(),
    maximumAuthorityAgeSeconds: 3_600,
    exactCloudQuotaMetricAndRegionalBucketReread: true,
    servingCapacityGranted: true,
    callerQuotaMetricRegionOrLimitAccepted: false,
    endpointOrGpuJobStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
  return canonicalCurrentGoogleCloudVertexA100ServingQuotaAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority(
  value: unknown,
  at = new Date().toISOString(),
): CanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority {
  assertPlainSerializedData(value, 'vertex_a100_serving_quota_authority')
  const parsed =
    canonicalCurrentGoogleCloudVertexA100ServingQuotaAuthoritySchema.parse(value)
  const { authorityHash, ...payload } = parsed
  if (
    authorityHash !== sha256AuthorityValue(payload)
    || Date.parse(timestamp.parse(at)) >= Date.parse(parsed.expiresAt)
  ) throw new Error('Vertex A100 serving quota authority is invalid or stale.')
  return parsed
}

export interface CanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository {
  readonly schemaVersion:
    typeof CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_QUOTA_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly authority: CanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority
  }): Promise<{ readonly quotaAuthorityRef: z.infer<typeof refSchema> }>
  reread(input: {
    readonly quotaAuthorityRef: z.infer<typeof refSchema>
    readonly at: string
  }): Promise<CanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority | null>
}

export function createCanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository {
  const prefix = z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
    .refine((value) => !value.includes('..') && !value.includes('//'))
    .parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_QUOTA_REPOSITORY_VERSION,
    async persistCreateOnly({ authority: untrusted }) {
      const authority =
        assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority(
          untrusted,
          untrusted.observedAt,
        )
      const reference = quotaRef(authority)
      const body = Buffer.from(stableAuthorityStringify(authority), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new Error('Vertex A100 serving quota record is too large.')
      }
      await input.objectPort.createOnly({
        objectPath: recordPath(prefix, reference),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await read(input.objectPort, prefix, reference,
        authority.observedAt)
      if (!reread || reread.authorityHash !== authority.authorityHash) {
        throw new Error('Vertex A100 serving quota create-only reread failed.')
      }
      return Object.freeze({ quotaAuthorityRef: reference })
    },
    reread({ quotaAuthorityRef, at }) {
      return read(input.objectPort, prefix, refSchema.parse(quotaAuthorityRef),
        timestamp.parse(at))
    },
  })
}

export function createCanonicalGcsCurrentGoogleCloudVertexA100ServingQuotaRepository(
  input: { readonly storage?: Storage } = {},
) {
  return createCanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: PROJECT_ID }),
      bucketName: CONTROL_PLANE_BUCKET,
    }),
  })
}

function quotaRef(
  authority: CanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority,
) {
  return refSchema.parse({
    id: authority.quotaAuthorityId,
    version: authority.quotaAuthorityVersion,
    contentHash: `sha256:${authority.authorityHash}`,
  })
}

async function read(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  reference: z.infer<typeof refSchema>,
  at: string,
) {
  const bytes = await port.readExact(recordPath(prefix, reference))
  if (!bytes) return null
  const raw = bytes.toString('utf8')
  let decoded: unknown
  try { decoded = JSON.parse(raw) } catch {
    throw new Error('Vertex A100 serving quota JSON is invalid.')
  }
  const authority =
    assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority(decoded, at)
  if (
    stableAuthorityStringify(authority) !== raw
    || stableAuthorityStringify(quotaRef(authority)) !==
      stableAuthorityStringify(reference)
  ) throw new Error('Vertex A100 serving quota exact reread failed.')
  return authority
}

function recordPath(prefix: string, reference: z.infer<typeof refSchema>) {
  const digest = createHash('sha256')
    .update(stableAuthorityStringify(reference), 'utf8').digest('hex')
  return `${prefix}/${digest}.json`
}
