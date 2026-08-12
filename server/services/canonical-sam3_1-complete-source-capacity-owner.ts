import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  type CanonicalSam31VertexQualificationQuotaReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import {
  assertCanonicalSam31VertexQualificationQuotaObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_L4_COMPLETE_SOURCE_CAPACITY_VERSION =
  'canonical-sam3_1-l4-complete-source-capacity-observation-v1' as const
export const CANONICAL_SAM3_1_COMPLETE_SOURCE_CAPACITY_VERSION =
  'canonical-sam3_1-complete-source-capacity-observation-v1' as const
export const CANONICAL_SAM3_1_COMPLETE_SOURCE_CAPACITY_OWNER_VERSION =
  'canonical-sam3_1-complete-source-capacity-owner-v1' as const

const PROJECT_ID = 'reeditpro' as const
const PROJECT_NUMBER = '390722338345' as const
const REGION = 'us-central1' as const
const CLOUD_QUOTAS_ORIGIN = 'https://cloudquotas.googleapis.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const L4_QUOTA_PREFERENCE_ID =
  'weeditpro-l4-scale-zero-quality-capacity-us-central1-v1' as const
const L4_QUOTA_ID =
  'NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion' as const
const L4_QUOTA_PREFERENCE_NAME =
  `projects/${PROJECT_ID}/locations/global/quotaPreferences/`
  + L4_QUOTA_PREFERENCE_ID
const L4_QUOTA_INFO_NAME =
  `projects/${PROJECT_NUMBER}/locations/global/services/`
  + `run.googleapis.com/quotaInfos/${L4_QUOTA_ID}`
const DEFAULT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v1/complete-source-capacity'
const REQUIRED_CONCURRENT_A100_80GB_WORKERS = 16 as const
const REQUIRED_CONCURRENT_L4_FALLBACK_WORKERS = 16 as const
const EXACT_CHUNK_COUNT = 48 as const
const EXACT_SOURCE_FRAME_COUNT = 11_520 as const
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const quotaCapacity = z.number().int().min(1).max(64)
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

const l4WithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_L4_COMPLETE_SOURCE_CAPACITY_VERSION,
  ),
  source: z.literal('canonical_server_cloud_run_l4_quota_observation_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  quotaPreferenceId: z.literal(L4_QUOTA_PREFERENCE_ID),
  quotaId: z.literal(L4_QUOTA_ID),
  preferredValue: quotaCapacity,
  grantedValue: quotaCapacity,
  reconciling: z.boolean(),
  exactCloudQuotaPreferenceAndQuotaInfoReread: z.literal(true),
  noZonalRedundancyFallbackCapacityExplicitlyAccepted: z.literal(true),
  gpuJobStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  const life = Date.parse(value.expiresAt) - Date.parse(value.observedAt)
  if (life <= 0 || life > 15 * 60_000) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 L4 capacity observation is stale.',
  })
})
export const canonicalSam31L4CompleteSourceCapacityObservationSchema =
  l4WithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31L4CompleteSourceCapacityObservation = z.infer<
  typeof canonicalSam31L4CompleteSourceCapacityObservationSchema
>

const capacityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_COMPLETE_SOURCE_CAPACITY_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_complete_source_capacity_owner',
  ),
  evidenceClass: z.literal('canonical_private_quota_reread'),
  status: z.enum([
    'ready_for_eight_minute_complete_source_execution',
    'pending_quota_reconciliation',
  ]),
  observationId: safeId,
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  sourceDurationMilliseconds: z.literal(480_000),
  sourceFrameCount: z.literal(EXACT_SOURCE_FRAME_COUNT),
  fpsNumerator: z.literal(24),
  fpsDenominator: z.literal(1),
  chunkFrameCount: z.literal(240),
  exactChunkCount: z.literal(EXACT_CHUNK_COUNT),
  targetWallTimeMilliseconds: z.literal(480_000),
  a100QuotaObservationHash: sha256,
  l4QuotaObservationHash: sha256,
  a100PreferredValue: quotaCapacity,
  a100GrantedValue: quotaCapacity,
  a100Reconciling: z.boolean(),
  l4PreferredValue: quotaCapacity,
  l4GrantedValue: quotaCapacity,
  l4Reconciling: z.boolean(),
  minimumRequiredConcurrentA10080GbWorkers: z.literal(
    REQUIRED_CONCURRENT_A100_80GB_WORKERS,
  ),
  minimumRequiredConcurrentL4FallbackWorkers: z.literal(
    REQUIRED_CONCURRENT_L4_FALLBACK_WORKERS,
  ),
  a100HeavyPrimary: z.literal(true),
  l4SeparatelyQualifiedFallbackOnly: z.literal(true),
  minimumIdleGpuInstances: z.literal(0),
  userTriggeredScaleFromZero: z.literal(true),
  automaticQualityReductionAllowed: z.literal(false),
  completeSourceExecutionCapacityReady: z.boolean(),
  callerCapacityOrQuotaClaimsAccepted: z.literal(false),
  gpuJobStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const ready = value.a100PreferredValue >=
      value.minimumRequiredConcurrentA10080GbWorkers
    && value.a100GrantedValue >=
      value.minimumRequiredConcurrentA10080GbWorkers
    && !value.a100Reconciling
    && value.l4PreferredValue >=
      value.minimumRequiredConcurrentL4FallbackWorkers
    && value.l4GrantedValue >=
      value.minimumRequiredConcurrentL4FallbackWorkers
    && !value.l4Reconciling
  const statusReady = value.status ===
    'ready_for_eight_minute_complete_source_execution'
  if (ready !== value.completeSourceExecutionCapacityReady
    || ready !== statusReady) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 complete-source capacity disposition is inconsistent.',
  })
})
export const canonicalSam31CompleteSourceCapacityObservationSchema =
  capacityWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31CompleteSourceCapacityObservation = z.infer<
  typeof canonicalSam31CompleteSourceCapacityObservationSchema
>

export interface CanonicalSam31L4CompleteSourceCapacityReadPort {
  rereadCurrent(): Promise<CanonicalSam31L4CompleteSourceCapacityObservation>
}

export interface CanonicalSam31CompleteSourceCapacityRepository {
  persistCreateOnly(input: {
    readonly observation: CanonicalSam31CompleteSourceCapacityObservation
  }): Promise<'created' | 'already_exists'>
  reread(input: {
    readonly observationId: string
  }): Promise<CanonicalSam31CompleteSourceCapacityObservation | null>
}

export function sealCanonicalSam31L4CompleteSourceCapacityObservation(
  value: unknown,
): CanonicalSam31L4CompleteSourceCapacityObservation {
  assertPlainSerializedData(value, 'sam31_l4_capacity_observation_build')
  const payload = l4WithoutHashSchema.parse(value)
  return assertCanonicalSam31L4CompleteSourceCapacityObservation({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31L4CompleteSourceCapacityObservation(
  value: unknown,
  at?: string,
): CanonicalSam31L4CompleteSourceCapacityObservation {
  assertPlainSerializedData(value, 'sam31_l4_capacity_observation')
  const parsed = canonicalSam31L4CompleteSourceCapacityObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)
    || (at && (Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)))) {
    throw new Error('SAM 3.1 L4 capacity observation is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31CompleteSourceCapacityObservation(
  value: unknown,
): CanonicalSam31CompleteSourceCapacityObservation {
  assertPlainSerializedData(value, 'sam31_complete_source_capacity')
  const parsed = canonicalSam31CompleteSourceCapacityObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 complete-source capacity hash changed.')
  }
  return parsed
}

export function createCanonicalSam31CompleteSourceCapacityRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31CompleteSourceCapacityRepository {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (observationId: string) => {
    const id = safeId.parse(observationId)
    const bytes = await input.objectPort.readExact(`${prefix}/${id}.json`)
    if (!bytes) return null
    if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
      || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new Error('SAM 3.1 capacity record bytes are invalid.')
    }
    const value = assertCanonicalSam31CompleteSourceCapacityObservation(
      JSON.parse(bytes.toString('utf8')) as unknown,
    )
    if (value.observationId !== id
      || stableAuthorityStringify(value) !== bytes.toString('utf8')) {
      throw new Error('SAM 3.1 capacity exact reread changed.')
    }
    return structuredClone(value)
  }
  return Object.freeze({
    async persistCreateOnly({ observation: untrusted }) {
      const observation =
        assertCanonicalSam31CompleteSourceCapacityObservation(untrusted)
      const body = Buffer.from(stableAuthorityStringify(observation), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${observation.observationId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const accepted = await reread(observation.observationId)
      if (!accepted || accepted.observationHash !== observation.observationHash) {
        throw new Error('SAM 3.1 capacity persistence reread changed.')
      }
      return disposition
    },
    reread({ observationId }) {
      return reread(observationId)
    },
  })
}

export function createCanonicalSam31CompleteSourceCapacityOwner(input: {
  readonly a100QuotaReadPort: CanonicalSam31VertexQualificationQuotaReadPort
  readonly l4QuotaReadPort: CanonicalSam31L4CompleteSourceCapacityReadPort
  readonly repository: CanonicalSam31CompleteSourceCapacityRepository
  readonly now?: () => string
}) {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_COMPLETE_SOURCE_CAPACITY_OWNER_VERSION,
    async observeAndPersist(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_complete_source_capacity_run')
      const request = z.object({ observationId: safeId }).strict()
        .parse(untrusted)
      const observedAt = timestamp.parse(now())
      const [a100Value, l4Value] = await Promise.all([
        input.a100QuotaReadPort.rereadCurrent(),
        input.l4QuotaReadPort.rereadCurrent(),
      ])
      const a100 = assertCanonicalSam31VertexQualificationQuotaObservation(
        a100Value,
        observedAt,
      )
      const l4 = assertCanonicalSam31L4CompleteSourceCapacityObservation(
        l4Value,
        observedAt,
      )
      const ready = a100.preferredValue >=
          REQUIRED_CONCURRENT_A100_80GB_WORKERS
        && a100.grantedValue >= REQUIRED_CONCURRENT_A100_80GB_WORKERS
        && !a100.reconciling
        && l4.preferredValue >= REQUIRED_CONCURRENT_L4_FALLBACK_WORKERS
        && l4.grantedValue >= REQUIRED_CONCURRENT_L4_FALLBACK_WORKERS
        && !l4.reconciling
      const payload = capacityWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_COMPLETE_SOURCE_CAPACITY_VERSION,
        source: 'canonical_server_sam3_1_complete_source_capacity_owner',
        evidenceClass: 'canonical_private_quota_reread',
        status: ready
          ? 'ready_for_eight_minute_complete_source_execution'
          : 'pending_quota_reconciliation',
        observationId: request.observationId,
        projectId: PROJECT_ID,
        region: REGION,
        sourceDurationMilliseconds: 480_000,
        sourceFrameCount: EXACT_SOURCE_FRAME_COUNT,
        fpsNumerator: 24,
        fpsDenominator: 1,
        chunkFrameCount: 240,
        exactChunkCount: EXACT_CHUNK_COUNT,
        targetWallTimeMilliseconds: 480_000,
        a100QuotaObservationHash: a100.observationHash,
        l4QuotaObservationHash: l4.observationHash,
        a100PreferredValue: a100.preferredValue,
        a100GrantedValue: a100.grantedValue,
        a100Reconciling: a100.reconciling,
        l4PreferredValue: l4.preferredValue,
        l4GrantedValue: l4.grantedValue,
        l4Reconciling: l4.reconciling,
        minimumRequiredConcurrentA10080GbWorkers:
          REQUIRED_CONCURRENT_A100_80GB_WORKERS,
        minimumRequiredConcurrentL4FallbackWorkers:
          REQUIRED_CONCURRENT_L4_FALLBACK_WORKERS,
        a100HeavyPrimary: true,
        l4SeparatelyQualifiedFallbackOnly: true,
        minimumIdleGpuInstances: 0,
        userTriggeredScaleFromZero: true,
        automaticQualityReductionAllowed: false,
        completeSourceExecutionCapacityReady: ready,
        callerCapacityOrQuotaClaimsAccepted: false,
        gpuJobStarted: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt,
      })
      const observation =
        assertCanonicalSam31CompleteSourceCapacityObservation({
          ...payload,
          observationHash: sha256AuthorityValue(payload),
        })
      await input.repository.persistCreateOnly({ observation })
      return observation
    },
  })
}

export function createCanonicalSam31GcpL4CompleteSourceCapacityReadPort(input: {
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
  readonly requestTimeoutMilliseconds?: number
} = {}): CanonicalSam31L4CompleteSourceCapacityReadPort {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new Error('SAM 3.1 L4 capacity request timeout is invalid.')
  }
  return Object.freeze({
    async rereadCurrent() {
      const [preferenceResponse, infoResponse] = await Promise.all([
        auth.request({
          url: `${CLOUD_QUOTAS_ORIGIN}/v1/${L4_QUOTA_PREFERENCE_NAME}`,
          method: 'GET', timeout, retry: false, maxRedirects: 0,
          responseType: 'json', maxContentLength: 2 * 1024 * 1024,
        }),
        auth.request({
          url: `${CLOUD_QUOTAS_ORIGIN}/v1/${L4_QUOTA_INFO_NAME}`,
          method: 'GET', timeout, retry: false, maxRedirects: 0,
          responseType: 'json', maxContentLength: 2 * 1024 * 1024,
        }),
      ])
      const preference = parseL4Preference(preferenceResponse.data)
      const grantedValue = parseL4QuotaInfo(infoResponse.data)
      if (grantedValue !== preference.grantedValue) {
        throw new Error('Cloud Run L4 granted quota differs from quota info.')
      }
      const observedAt = timestamp.parse(now())
      return sealCanonicalSam31L4CompleteSourceCapacityObservation({
        schemaVersion: CANONICAL_SAM3_1_L4_COMPLETE_SOURCE_CAPACITY_VERSION,
        source: 'canonical_server_cloud_run_l4_quota_observation_owner',
        evidenceClass: 'canonical_private_reread',
        projectId: PROJECT_ID,
        region: REGION,
        quotaPreferenceId: L4_QUOTA_PREFERENCE_ID,
        quotaId: L4_QUOTA_ID,
        preferredValue: preference.preferredValue,
        grantedValue,
        reconciling: preference.reconciling,
        exactCloudQuotaPreferenceAndQuotaInfoReread: true,
        noZonalRedundancyFallbackCapacityExplicitlyAccepted: true,
        gpuJobStarted: false,
        customerCreditsMutated: false,
        observedAt,
        expiresAt: new Date(Date.parse(observedAt) + 15 * 60_000)
          .toISOString(),
      })
    },
  })
}

function parseL4Preference(value: unknown) {
  assertPlainSerializedData(value, 'sam31_l4_quota_preference')
  const parsed = z.object({
    name: z.literal(L4_QUOTA_PREFERENCE_NAME),
    service: z.literal('run.googleapis.com'),
    quotaId: z.literal(L4_QUOTA_ID),
    dimensions: z.object({ region: z.literal(REGION) }).strict(),
    quotaConfig: z.object({
      preferredValue: z.union([z.string(), z.number()]),
      grantedValue: z.union([z.string(), z.number()]),
    }).passthrough(),
    reconciling: z.boolean().optional(),
  }).passthrough().parse(value)
  return {
    preferredValue: quotaCapacity.parse(
      Number(parsed.quotaConfig.preferredValue),
    ),
    grantedValue: quotaCapacity.parse(
      Number(parsed.quotaConfig.grantedValue),
    ),
    reconciling: parsed.reconciling === true,
  }
}

function parseL4QuotaInfo(value: unknown): number {
  assertPlainSerializedData(value, 'sam31_l4_quota_info')
  const parsed = z.object({
    name: z.literal(L4_QUOTA_INFO_NAME),
    service: z.literal('run.googleapis.com'),
    quotaId: z.literal(L4_QUOTA_ID),
    dimensionsInfos: z.array(z.object({
      dimensions: z.record(z.string(), z.string()).optional(),
      details: z.object({
        value: z.union([z.string(), z.number()]).optional(),
      }).passthrough(),
      applicableLocations: z.array(z.string()).min(1),
    }).passthrough()).min(1),
  }).passthrough().parse(value)
  const regional = parsed.dimensionsInfos.filter((item) =>
    item.dimensions?.region === REGION)
  if (regional.length !== 1
    || stableAuthorityStringify(regional[0].applicableLocations) !==
      stableAuthorityStringify([REGION])) {
    throw new Error('Cloud Run L4 quota region is invalid.')
  }
  return quotaCapacity.parse(Number(regional[0].details.value))
}
