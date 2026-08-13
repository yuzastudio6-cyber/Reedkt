import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31A100ServingCompleteSourceCapacityObservation,
  assertCanonicalSam31L4CompleteSourceCapacityObservation,
  type CanonicalSam31A100ServingCompleteSourceCapacityReadPort,
  type CanonicalSam31L4CompleteSourceCapacityReadPort,
} from './canonical-sam3_1-complete-source-capacity-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRIVATE_QUALIFICATION_CAPACITY_VERSION =
  'canonical-sam3_1-private-sequential-qualification-capacity-observation-v1' as const
export const CANONICAL_SAM3_1_PRIVATE_QUALIFICATION_CAPACITY_OWNER_VERSION =
  'canonical-sam3_1-private-sequential-qualification-capacity-owner-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const DEFAULT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v1/private-capacity'
const EXACT_SOURCE_FRAME_COUNT = 11_520 as const
const EXACT_CHUNK_COUNT = 49 as const
const EXACT_CROSS_CHUNK_BOUNDARY_COUNT = 48 as const
const REQUIRED_PRIVATE_A100_CAPACITY = 1 as const
const REQUIRED_PRIVATE_L4_CAPACITY = 1 as const
const REQUIRED_PRODUCTION_A100_CAPACITY = 16 as const
const REQUIRED_PRODUCTION_L4_CAPACITY = 16 as const
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
const quotaCapacity = z.number().int().min(0).max(64)

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_QUALIFICATION_CAPACITY_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_sequential_qualification_capacity_owner',
  ),
  evidenceClass: z.literal('canonical_private_quota_reread'),
  status: z.enum([
    'private_sequential_capacity_ready',
    'private_sequential_capacity_unavailable',
  ]),
  productionCapacityStatus: z.enum([
    'production_concurrency_capacity_ready',
    'production_concurrency_capacity_pending',
  ]),
  observationId: safeId,
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  purpose: z.literal('private_sequential_eight_minute_qualification'),
  sourceDurationMilliseconds: z.literal(480_000),
  sourceFrameCount: z.literal(EXACT_SOURCE_FRAME_COUNT),
  fpsNumerator: z.literal(24),
  fpsDenominator: z.literal(1),
  chunkFrameCount: z.literal(240),
  chunkOverlapFrameCount: z.literal(1),
  chunkStrideFrameCount: z.literal(239),
  exactChunkCount: z.literal(EXACT_CHUNK_COUNT),
  exactCrossChunkBoundaryCount: z.literal(EXACT_CROSS_CHUNK_BOUNDARY_COUNT),
  targetWallTimeMilliseconds: z.literal(480_000),
  a100QuotaObservationHash: sha256,
  l4QuotaObservationHash: sha256,
  a100PreferredValue: quotaCapacity,
  a100GrantedValue: quotaCapacity,
  a100Reconciling: z.boolean(),
  l4PreferredValue: quotaCapacity,
  l4GrantedValue: quotaCapacity,
  l4Reconciling: z.boolean(),
  minimumRequiredPrivateA10080GbCapacity: z.literal(
    REQUIRED_PRIVATE_A100_CAPACITY,
  ),
  minimumRequiredPrivateL4Capacity: z.literal(REQUIRED_PRIVATE_L4_CAPACITY),
  maximumSimultaneousPrivateA100Attempts: z.literal(1),
  maximumSimultaneousPrivateL4Attempts: z.literal(1),
  qualificationAttemptsMustRunSequentially: z.literal(true),
  privateQualificationMayUseCurrentlyGrantedCapacityWhilePreferenceReconciles:
    z.literal(true),
  quotaPreferenceReconciliationAcceptedAsGrantedCapacityLoss:
    z.literal(false),
  privateSequentialCapacityReady: z.boolean(),
  minimumRequiredProductionA10080GbCapacity: z.literal(
    REQUIRED_PRODUCTION_A100_CAPACITY,
  ),
  minimumRequiredProductionL4Capacity: z.literal(
    REQUIRED_PRODUCTION_L4_CAPACITY,
  ),
  productionConcurrencyCapacityReady: z.boolean(),
  privateCapacityDoesNotGrantProductionConcurrency: z.literal(true),
  a100HeavyPrimary: z.literal(true),
  l4SeparatelyQualifiedFallbackOnly: z.literal(true),
  minimumIdleGpuInstances: z.literal(0),
  userTriggeredScaleFromZero: z.literal(true),
  automaticQualityReductionAllowed: z.literal(false),
  exactEightMinutePerformanceAndTemporalQualityEvidenceStillRequired:
    z.literal(true),
  currentEndpointAndL4RuntimeReleaseEvidenceStillRequired: z.literal(true),
  callerCapacityOrQuotaClaimsAccepted: z.literal(false),
  qualificationExecutionAuthorized: z.literal(false),
  gpuJobStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  const privateReady = value.a100GrantedValue >=
      value.minimumRequiredPrivateA10080GbCapacity
    && value.l4GrantedValue >= value.minimumRequiredPrivateL4Capacity
  const productionReady = value.a100PreferredValue >=
      value.minimumRequiredProductionA10080GbCapacity
    && value.a100GrantedValue >=
      value.minimumRequiredProductionA10080GbCapacity
    && !value.a100Reconciling
    && value.l4PreferredValue >= value.minimumRequiredProductionL4Capacity
    && value.l4GrantedValue >= value.minimumRequiredProductionL4Capacity
    && !value.l4Reconciling
  const life = Date.parse(value.expiresAt) - Date.parse(value.observedAt)
  if (privateReady !== value.privateSequentialCapacityReady
    || privateReady !== (value.status === 'private_sequential_capacity_ready')
    || productionReady !== value.productionConcurrencyCapacityReady
    || productionReady !== (value.productionCapacityStatus ===
      'production_concurrency_capacity_ready')
    || life <= 0 || life > 15 * 60_000) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 private qualification capacity disposition changed.',
  })
})

export const canonicalSam31PrivateQualificationCapacityObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31PrivateQualificationCapacityObservation = z.infer<
  typeof canonicalSam31PrivateQualificationCapacityObservationSchema
>

export interface CanonicalSam31PrivateQualificationCapacityRepository {
  persistCreateOnly(input: {
    readonly observation: CanonicalSam31PrivateQualificationCapacityObservation
  }): Promise<'created' | 'already_exists'>
  reread(input: {
    readonly observationId: string
  }): Promise<CanonicalSam31PrivateQualificationCapacityObservation | null>
}

export function assertCanonicalSam31PrivateQualificationCapacityObservation(
  value: unknown,
  at?: string,
): CanonicalSam31PrivateQualificationCapacityObservation {
  assertPlainSerializedData(value, 'sam31_private_qualification_capacity')
  const parsed = canonicalSam31PrivateQualificationCapacityObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  const atTime = at === undefined ? null : Date.parse(at)
  if (observationHash !== sha256AuthorityValue(payload)
    || (atTime !== null && (atTime < Date.parse(parsed.observedAt)
      || atTime >= Date.parse(parsed.expiresAt)))) {
    throw new TypeError('SAM 3.1 private qualification capacity is invalid.')
  }
  return Object.freeze(structuredClone(parsed))
}

export function createCanonicalSam31PrivateQualificationCapacityRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31PrivateQualificationCapacityRepository {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (observationId: string) => {
    const id = safeId.parse(observationId)
    const body = await input.objectPort.readExact(`${prefix}/${id}.json`)
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new TypeError('SAM 3.1 private capacity bytes are invalid.')
    }
    let value: unknown
    try {
      value = JSON.parse(body.toString('utf8')) as unknown
    } catch {
      throw new TypeError('SAM 3.1 private capacity JSON is invalid.')
    }
    const observation =
      assertCanonicalSam31PrivateQualificationCapacityObservation(value)
    if (observation.observationId !== id
      || stableAuthorityStringify(observation) !== body.toString('utf8')) {
      throw new TypeError('SAM 3.1 private capacity exact reread changed.')
    }
    return observation
  }
  return Object.freeze({
    async persistCreateOnly({ observation: value }) {
      const observation =
        assertCanonicalSam31PrivateQualificationCapacityObservation(value)
      const body = Buffer.from(stableAuthorityStringify(observation), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${observation.observationId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const accepted = await reread(observation.observationId)
      if (!accepted
        || accepted.observationHash !== observation.observationHash) {
        throw new TypeError('SAM 3.1 private capacity persistence changed.')
      }
      return disposition
    },
    reread({ observationId }) {
      return reread(observationId)
    },
  })
}

export function createCanonicalSam31PrivateQualificationCapacityOwner(input: {
  readonly a100QuotaReadPort:
    CanonicalSam31A100ServingCompleteSourceCapacityReadPort
  readonly l4QuotaReadPort: CanonicalSam31L4CompleteSourceCapacityReadPort
  readonly repository: CanonicalSam31PrivateQualificationCapacityRepository
  readonly now?: () => string
}) {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_QUALIFICATION_CAPACITY_OWNER_VERSION,
    privateCapacityDoesNotGrantProductionConcurrency: true as const,
    qualificationExecutionAuthorized: false as const,
    async observeAndPersist(untrusted: unknown) {
      assertPlainSerializedData(untrusted,
        'sam31_private_qualification_capacity_request')
      const request = z.object({ observationId: safeId }).strict()
        .parse(untrusted)
      const [rawA100, rawL4] = await Promise.all([
        input.a100QuotaReadPort.rereadCurrent(),
        input.l4QuotaReadPort.rereadCurrent(),
      ])
      const observedAt = timestamp.parse(now())
      const a100 =
        assertCanonicalSam31A100ServingCompleteSourceCapacityObservation(
          rawA100,
          observedAt,
        )
      const l4 = assertCanonicalSam31L4CompleteSourceCapacityObservation(
        rawL4,
        observedAt,
      )
      const privateReady = a100.grantedValue >= REQUIRED_PRIVATE_A100_CAPACITY
        && l4.grantedValue >= REQUIRED_PRIVATE_L4_CAPACITY
      const productionReady = a100.preferredValue >=
          REQUIRED_PRODUCTION_A100_CAPACITY
        && a100.grantedValue >= REQUIRED_PRODUCTION_A100_CAPACITY
        && !a100.reconciling
        && l4.preferredValue >= REQUIRED_PRODUCTION_L4_CAPACITY
        && l4.grantedValue >= REQUIRED_PRODUCTION_L4_CAPACITY
        && !l4.reconciling
      const expiresAt = new Date(Math.min(
        Date.parse(a100.expiresAt),
        Date.parse(l4.expiresAt),
      )).toISOString()
      const payload = observationWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_PRIVATE_QUALIFICATION_CAPACITY_VERSION,
        source:
          'canonical_server_sam3_1_private_sequential_qualification_capacity_owner',
        evidenceClass: 'canonical_private_quota_reread',
        status: privateReady
          ? 'private_sequential_capacity_ready'
          : 'private_sequential_capacity_unavailable',
        productionCapacityStatus: productionReady
          ? 'production_concurrency_capacity_ready'
          : 'production_concurrency_capacity_pending',
        observationId: request.observationId,
        projectId: PROJECT_ID,
        region: REGION,
        purpose: 'private_sequential_eight_minute_qualification',
        sourceDurationMilliseconds: 480_000,
        sourceFrameCount: EXACT_SOURCE_FRAME_COUNT,
        fpsNumerator: 24,
        fpsDenominator: 1,
        chunkFrameCount: 240,
        chunkOverlapFrameCount: 1,
        chunkStrideFrameCount: 239,
        exactChunkCount: EXACT_CHUNK_COUNT,
        exactCrossChunkBoundaryCount: EXACT_CROSS_CHUNK_BOUNDARY_COUNT,
        targetWallTimeMilliseconds: 480_000,
        a100QuotaObservationHash: a100.observationHash,
        l4QuotaObservationHash: l4.observationHash,
        a100PreferredValue: a100.preferredValue,
        a100GrantedValue: a100.grantedValue,
        a100Reconciling: a100.reconciling,
        l4PreferredValue: l4.preferredValue,
        l4GrantedValue: l4.grantedValue,
        l4Reconciling: l4.reconciling,
        minimumRequiredPrivateA10080GbCapacity:
          REQUIRED_PRIVATE_A100_CAPACITY,
        minimumRequiredPrivateL4Capacity: REQUIRED_PRIVATE_L4_CAPACITY,
        maximumSimultaneousPrivateA100Attempts: 1,
        maximumSimultaneousPrivateL4Attempts: 1,
        qualificationAttemptsMustRunSequentially: true,
        privateQualificationMayUseCurrentlyGrantedCapacityWhilePreferenceReconciles:
          true,
        quotaPreferenceReconciliationAcceptedAsGrantedCapacityLoss: false,
        privateSequentialCapacityReady: privateReady,
        minimumRequiredProductionA10080GbCapacity:
          REQUIRED_PRODUCTION_A100_CAPACITY,
        minimumRequiredProductionL4Capacity: REQUIRED_PRODUCTION_L4_CAPACITY,
        productionConcurrencyCapacityReady: productionReady,
        privateCapacityDoesNotGrantProductionConcurrency: true,
        a100HeavyPrimary: true,
        l4SeparatelyQualifiedFallbackOnly: true,
        minimumIdleGpuInstances: 0,
        userTriggeredScaleFromZero: true,
        automaticQualityReductionAllowed: false,
        exactEightMinutePerformanceAndTemporalQualityEvidenceStillRequired:
          true,
        currentEndpointAndL4RuntimeReleaseEvidenceStillRequired: true,
        callerCapacityOrQuotaClaimsAccepted: false,
        qualificationExecutionAuthorized: false,
        gpuJobStarted: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt,
        expiresAt,
      })
      const observation =
        assertCanonicalSam31PrivateQualificationCapacityObservation({
          ...payload,
          observationHash: sha256AuthorityValue(payload),
        })
      await input.repository.persistCreateOnly({ observation })
      return observation
    },
  })
}
