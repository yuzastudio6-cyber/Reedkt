import { z } from 'zod'

import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31GpuRuntimeReleaseReadinessObservation,
} from './canonical-sam3_1-gpu-runtime-release-readiness-observer'
import {
  assertCanonicalSam31PrivateQualificationCapacityObservation,
} from './canonical-sam3_1-private-qualification-capacity-owner'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRIVATE_INTERNAL_RELEASE_READINESS_VERSION =
  'canonical-sam3_1-private-internal-release-readiness-v1' as const
export const CANONICAL_SAM3_1_PRIVATE_INTERNAL_RELEASE_READINESS_OWNER_VERSION =
  'canonical-sam3_1-private-internal-release-readiness-owner-v1' as const

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const requestSchema = z.object({
  readinessId: safeId,
  capacityObservation: z.unknown(),
  a100RouteReadinessObservation: z.unknown(),
  l4RouteReadinessObservation: z.unknown(),
  observedAt: timestamp,
}).strict()

const readinessWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_INTERNAL_RELEASE_READINESS_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_INTERNAL_RELEASE_READINESS_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_internal_release_readiness_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_capacity_and_exact_component_readiness_reread',
  ),
  status: z.enum([
    'ready_for_private_internal_runtime_release_publication',
    'blocked_private_internal_evidence_incomplete',
  ]),
  readinessId: safeId,
  privateQualificationCapacityObservationRef: refSchema,
  a100RouteQualificationObservationRef: refSchema,
  l4RouteQualificationObservationRef: refSchema,
  privateSequentialCapacityReady: z.boolean(),
  privateA100GrantedCapacity: z.number().int().nonnegative().max(64),
  privateL4GrantedCapacity: z.number().int().nonnegative().max(64),
  maximumSimultaneousPrivateA100Attempts: z.literal(1),
  maximumSimultaneousPrivateL4Attempts: z.literal(1),
  qualificationAttemptsMustRunSequentially: z.literal(true),
  a100FourComponentEvidenceReady: z.boolean(),
  l4FourComponentEvidenceReady: z.boolean(),
  exactEightMinutePerformanceEvidenceRequiredForEachRoute: z.literal(true),
  independentTemporalQualityEvidenceRequiredForEachRoute: z.literal(true),
  automaticQualityReductionAllowed: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  a100HeavyPrimary: z.literal(true),
  l4SeparatelyQualifiedQualityPreservingFallbackOnly: z.literal(true),
  minimumIdleGpuInstances: z.literal(0),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  privateInternalReleasePublicationMayProceed: z.boolean(),
  productionConcurrencyCapacityReady: z.boolean(),
  publicConcurrencyA100Target: z.literal(16),
  publicConcurrencyL4Target: z.literal(16),
  productionConcurrencyIsSeparateFutureReleaseGate: z.literal(true),
  publicConcurrencyShortfallBlocksPrivateInternalQualification:
    z.literal(false),
  privateCapacityDoesNotGrantCustomerOrPublicDispatch: z.literal(true),
  blockers: z.array(safeId).max(64),
  callerCapacityComponentOrReleaseClaimsAccepted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerDispatchAuthorized: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const ready = value.privateSequentialCapacityReady
    && value.a100FourComponentEvidenceReady
    && value.l4FourComponentEvidenceReady
    && value.blockers.length === 0
  if (value.privateInternalReleasePublicationMayProceed !== ready
    || (value.status ===
      'ready_for_private_internal_runtime_release_publication') !== ready) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 private-internal readiness disposition changed.',
    })
  }
})

export const canonicalSam31PrivateInternalReleaseReadinessSchema =
  readinessWithoutHashSchema.extend({ readinessHash: sha256 }).strict()
export type CanonicalSam31PrivateInternalReleaseReadiness = z.infer<
  typeof canonicalSam31PrivateInternalReleaseReadinessSchema
>

export function createCanonicalSam31PrivateInternalReleaseReadinessOwner() {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_INTERNAL_RELEASE_READINESS_OWNER_VERSION,
    publicConcurrencyIsSeparateFutureReleaseGate: true as const,
    observe(untrusted: unknown): CanonicalSam31PrivateInternalReleaseReadiness {
      assertPlainSerializedData(untrusted, 'sam31_private_internal_readiness')
      const request = requestSchema.parse(untrusted)
      const capacity =
        assertCanonicalSam31PrivateQualificationCapacityObservation(
          request.capacityObservation,
          request.observedAt,
        )
      const a100 =
        assertCanonicalSam31GpuRuntimeReleaseReadinessObservation(
          request.a100RouteReadinessObservation,
        )
      const l4 =
        assertCanonicalSam31GpuRuntimeReleaseReadinessObservation(
          request.l4RouteReadinessObservation,
        )
      if (a100.routeId !== 'a100_80gb_heavy_primary'
        || l4.routeId !== 'l4_heavy_fallback') {
        throw new TypeError('SAM 3.1 private route readiness was swapped.')
      }
      const a100Ready = a100.releasePublisherMayBeInvoked
      const l4Ready = l4.releasePublisherMayBeInvoked
      const blockers = [
        ...(capacity.privateSequentialCapacityReady
          ? [] : ['private_sequential_gpu_capacity_unavailable']),
        ...a100.blockers.map((code) => `a100_${code}`),
        ...l4.blockers.map((code) => `l4_${code}`),
      ]
      const ready = capacity.privateSequentialCapacityReady
        && a100Ready && l4Ready && blockers.length === 0
      const payload = readinessWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_PRIVATE_INTERNAL_RELEASE_READINESS_VERSION,
        ownerVersion:
          CANONICAL_SAM3_1_PRIVATE_INTERNAL_RELEASE_READINESS_OWNER_VERSION,
        source:
          'canonical_server_sam3_1_private_internal_release_readiness_owner',
        evidenceClass:
          'canonical_private_capacity_and_exact_component_readiness_reread',
        status: ready
          ? 'ready_for_private_internal_runtime_release_publication'
          : 'blocked_private_internal_evidence_incomplete',
        readinessId: request.readinessId,
        privateQualificationCapacityObservationRef: ref(
          capacity.observationId,
          capacity.observationHash,
        ),
        a100RouteQualificationObservationRef: observationRef(a100),
        l4RouteQualificationObservationRef: observationRef(l4),
        privateSequentialCapacityReady:
          capacity.privateSequentialCapacityReady,
        privateA100GrantedCapacity: capacity.a100GrantedValue,
        privateL4GrantedCapacity: capacity.l4GrantedValue,
        maximumSimultaneousPrivateA100Attempts: 1,
        maximumSimultaneousPrivateL4Attempts: 1,
        qualificationAttemptsMustRunSequentially: true,
        a100FourComponentEvidenceReady: a100Ready,
        l4FourComponentEvidenceReady: l4Ready,
        exactEightMinutePerformanceEvidenceRequiredForEachRoute: true,
        independentTemporalQualityEvidenceRequiredForEachRoute: true,
        automaticQualityReductionAllowed: false,
        cpuOnlySubstantiveExecutionAllowed: false,
        a100HeavyPrimary: true,
        l4SeparatelyQualifiedQualityPreservingFallbackOnly: true,
        minimumIdleGpuInstances: 0,
        userTriggeredScaleFromZeroRequired: true,
        privateInternalReleasePublicationMayProceed: ready,
        productionConcurrencyCapacityReady:
          capacity.productionConcurrencyCapacityReady,
        publicConcurrencyA100Target: 16,
        publicConcurrencyL4Target: 16,
        productionConcurrencyIsSeparateFutureReleaseGate: true,
        publicConcurrencyShortfallBlocksPrivateInternalQualification: false,
        privateCapacityDoesNotGrantCustomerOrPublicDispatch: true,
        blockers,
        callerCapacityComponentOrReleaseClaimsAccepted: false,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        customerDispatchAuthorized: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt: request.observedAt,
      })
      return assertCanonicalSam31PrivateInternalReleaseReadiness({
        ...payload,
        readinessHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function assertCanonicalSam31PrivateInternalReleaseReadiness(
  value: unknown,
): CanonicalSam31PrivateInternalReleaseReadiness {
  assertPlainSerializedData(value, 'sam31_private_internal_readiness_result')
  const parsed = canonicalSam31PrivateInternalReleaseReadinessSchema
    .parse(value)
  const { readinessHash, ...payload } = parsed
  if (readinessHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 private-internal readiness digest changed.')
  }
  return Object.freeze(structuredClone(parsed))
}

function observationRef(value: ReturnType<
  typeof assertCanonicalSam31GpuRuntimeReleaseReadinessObservation
>) {
  return ref(
    `${value.qualificationId}:${value.routeId}:component-readiness`,
    sha256AuthorityValue(value),
  )
}

function ref(id: string, hash: string) {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}
