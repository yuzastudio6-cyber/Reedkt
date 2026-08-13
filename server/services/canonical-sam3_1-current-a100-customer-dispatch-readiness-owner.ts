import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_COST_RECEIPT_VERSION,
  CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_USAGE_VERSION,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-multi-replica-window-cost-authority'
import {
  CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_COST_RECEIPT_VERSION,
  CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_USAGE_VERSION,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-reconciled-window-cost'
import {
  type CanonicalSam31CurrentA100CustomerDispatchReadiness,
  sealCanonicalSam31CurrentA100CustomerDispatchReadiness,
} from './canonical-sam3_1-current-a100-customer-dispatch-readiness'
import type {
  CanonicalSam31CurrentA100CustomerDispatchReadinessRepository,
} from './canonical-sam3_1-current-a100-customer-dispatch-readiness-repository'
import {
  assertCanonicalSam31A100ServingCompleteSourceCapacityObservation,
} from './canonical-sam3_1-complete-source-capacity-owner'
import {
  assertCanonicalSam31GpuPerformanceP95Evidence,
  canonicalSam31GpuPerformanceP95EvidenceRef,
} from './canonical-sam3_1-gpu-performance-p95-qualification-owner'
import {
  assertCanonicalSam31TemporalQualityQualificationSet,
  canonicalSam31TemporalQualityQualificationSetRef,
} from './canonical-sam3_1-gpu-temporal-quality-qualification-owner'
import {
  assertCanonicalSam31VertexDedicatedPredictionRoute,
  canonicalSam31VertexDedicatedPredictionRouteRef,
} from './canonical-sam3_1-vertex-dedicated-prediction-route'
import {
  assertCanonicalSam31VertexServingCapacityObservation,
} from './canonical-sam3_1-vertex-serving-capacity-mutation'
import {
  CANONICAL_SAM3_1_VERTEX_SERVING_ATTEMPT_CREDIT_SETTLEMENT_VERSION,
} from './canonical-sam3_1-vertex-serving-attempt-credit-settlement-service'
import {
  assertCanonicalSam31VertexServingThirtyRunQualification,
} from './canonical-sam3_1-vertex-serving-thirty-run-qualification-service'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_OWNER_VERSION =
  'canonical-sam3_1-current-a100-customer-dispatch-readiness-owner-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_COST_SETTLEMENT_READINESS_VERSION =
  'canonical-sam3_1-vertex-serving-cost-settlement-readiness-v1' as const

const MAXIMUM_REPLICA_COUNT = 16 as const
const MAXIMUM_READINESS_AGE_MILLISECONDS = 15 * 60_000
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const runtimeReleaseProjectionSchema = z.object({
  runtimeReleaseRef: refSchema,
  toolId: z.literal('sam3_1'),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  routeId: z.literal('a100_80gb_heavy_primary'),
  immutableImageDigest: prefixedSha256,
  qualificationRunCount: z.number().int().min(30).safe(),
  privateInternalQualified: z.literal(true),
  exactRuntimeReleaseRegistryReread: z.literal(true),
  qualifiedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.qualifiedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 runtime-release projection is expired.',
    })
  }
})

const costReadinessWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_COST_SETTLEMENT_READINESS_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam31_vertex_serving_cost_settlement_readiness_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_reread'),
  status: z.literal('ready_for_private_customer_cost_settlement'),
  costSettlementReadinessId: safeId,
  costSettlementReadinessVersion: z.literal(1),
  routeId: z.literal('a100_80gb_heavy_primary'),
  endpointResourceName: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  ),
  deployedModelId: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  ),
  modelVersionId: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  ),
  endpointCapacityObservationRef: refSchema,
  rateAuthorityRef: refSchema,
  scaleZeroQualificationWindowRef: refSchema,
  maximumReplicaCount: z.literal(MAXIMUM_REPLICA_COUNT),
  maximumConcurrentInvocations: z.literal(MAXIMUM_REPLICA_COUNT),
  minimumReplicaCount: z.literal(0),
  multiReplicaWindowUsageVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_USAGE_VERSION,
  ),
  multiReplicaWindowCostReceiptVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_COST_RECEIPT_VERSION,
  ),
  reconciledWindowUsageVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_USAGE_VERSION,
  ),
  reconciledWindowCostReceiptVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_COST_RECEIPT_VERSION,
  ),
  attemptCreditSettlementVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_ATTEMPT_CREDIT_SETTLEMENT_VERSION,
  ),
  exactBillingAccountEffectiveRateAndCapacityReread: z.literal(true),
  exactMonitoringAllocationWindowReread: z.literal(true),
  scaleFromZeroAndReturnToZeroObserved: z.literal(true),
  detailedBillingExportRequiredForFinalInfrastructureCost: z.literal(true),
  monitoringGaugeAcceptedAsFinalInvoiceCost: z.literal(false),
  configuredMaximumReplicasChargedAsAllocatedReplicas: z.literal(false),
  failedOrCanceledAttemptCostChargedToCustomer: z.literal(false),
  unapprovedOverageAbsorbedByWeEditPro: z.literal(true),
  sharedPlanReservationSettledIdempotently: z.literal(true),
  callerPriceUsageOutcomeOrSettlementClaimAccepted: z.literal(false),
  gpuInferenceStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicBillingAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  const lifetime = Date.parse(value.expiresAt) - Date.parse(value.observedAt)
  if (lifetime <= 0 || lifetime > MAXIMUM_READINESS_AGE_MILLISECONDS) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 cost-settlement readiness is stale.',
    })
  }
})

export const canonicalSam31VertexServingCostSettlementReadinessSchema =
  costReadinessWithoutHashSchema.extend({ readinessHash: sha256 }).strict()
export type CanonicalSam31VertexServingCostSettlementReadiness = z.infer<
  typeof canonicalSam31VertexServingCostSettlementReadinessSchema
>

const ownerRequestSchema = z.object({
  readinessId: safeId,
  runtimeReleaseRef: refSchema,
  rateAuthorityRef: refSchema,
  thirtyRunQualificationRef: refSchema,
  completeSourceP95QualificationRef: refSchema,
  independentMaskQualityQualificationRef: refSchema,
  multiReplicaCostAuthorityRef: refSchema,
}).strict()

export interface CanonicalSam31CurrentA100CustomerDispatchReadinessDependencyPorts {
  rereadRuntimeRelease(input: {
    readonly runtimeReleaseRef: EvidenceRef
    readonly at: string
  }): Promise<unknown | null>
  rereadRateAuthority(input: {
    readonly rateAuthorityRef: EvidenceRef
    readonly at: string
  }): Promise<unknown | null>
  rereadCurrentEndpointRoute(input: {
    readonly at: string
  }): Promise<unknown | null>
  rereadCurrentEndpointCapacity(input: {
    readonly at: string
  }): Promise<unknown | null>
  rereadCurrentA100ServingQuota(input: {
    readonly at: string
  }): Promise<unknown | null>
  rereadThirtyRunQualification(input: {
    readonly qualificationSetId: string
  }): Promise<unknown | null>
  rereadCompleteSourceP95Qualification(input: {
    readonly evidenceRef: EvidenceRef
  }): Promise<unknown | null>
  rereadIndependentMaskQualityQualification(input: {
    readonly qualitySetRef: EvidenceRef
  }): Promise<unknown | null>
  rereadMultiReplicaCostSettlementReadiness(input: {
    readonly readinessRef: EvidenceRef
    readonly at: string
  }): Promise<unknown | null>
}

export interface CanonicalSam31CurrentA100CustomerDispatchReadinessOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_OWNER_VERSION
  readonly evidenceClass:
    'canonical_server_dependency_exact_reread_and_create_only_publication'
  observePersistAndReread(input: unknown): Promise<
    CanonicalSam31CurrentA100CustomerDispatchReadiness
  >
}

export function createCanonicalSam31CurrentA100CustomerDispatchReadinessOwner(
  input: {
    readonly dependencies:
      CanonicalSam31CurrentA100CustomerDispatchReadinessDependencyPorts
    readonly repository:
      CanonicalSam31CurrentA100CustomerDispatchReadinessRepository
    readonly now?: () => string
  },
): CanonicalSam31CurrentA100CustomerDispatchReadinessOwner {
  assertDependencies(input.dependencies)
  assertRepository(input.repository)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_OWNER_VERSION,
    evidenceClass:
      'canonical_server_dependency_exact_reread_and_create_only_publication' as const,

    async observePersistAndReread(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_a100_readiness_owner_request')
      const request = ownerRequestSchema.parse(untrusted)
      const observedAt = timestamp.parse(now())
      const values = await Promise.all([
        input.dependencies.rereadRuntimeRelease({
          runtimeReleaseRef: request.runtimeReleaseRef,
          at: observedAt,
        }),
        input.dependencies.rereadRateAuthority({
          rateAuthorityRef: request.rateAuthorityRef,
          at: observedAt,
        }),
        input.dependencies.rereadCurrentEndpointRoute({ at: observedAt }),
        input.dependencies.rereadCurrentEndpointCapacity({ at: observedAt }),
        input.dependencies.rereadCurrentA100ServingQuota({ at: observedAt }),
        input.dependencies.rereadThirtyRunQualification({
          qualificationSetId: request.thirtyRunQualificationRef.id,
        }),
        input.dependencies.rereadCompleteSourceP95Qualification({
          evidenceRef: request.completeSourceP95QualificationRef,
        }),
        input.dependencies.rereadIndependentMaskQualityQualification({
          qualitySetRef: request.independentMaskQualityQualificationRef,
        }),
        input.dependencies.rereadMultiReplicaCostSettlementReadiness({
          readinessRef: request.multiReplicaCostAuthorityRef,
          at: observedAt,
        }),
      ])
      if (values.some((value) => value === null)) throw conflict(
        'dependency_reread_missing',
      )
      const runtimeRelease = runtimeReleaseProjectionSchema.parse(values[0])
      const rate =
        assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
          values[1],
          observedAt,
        )
      const route = assertCanonicalSam31VertexDedicatedPredictionRoute(
        values[2],
      )
      const capacity = assertCanonicalSam31VertexServingCapacityObservation(
        values[3],
        observedAt,
      )
      const quota =
        assertCanonicalSam31A100ServingCompleteSourceCapacityObservation(
          values[4],
          observedAt,
        )
      const thirty =
        assertCanonicalSam31VertexServingThirtyRunQualification(values[5])
      const performance = assertCanonicalSam31GpuPerformanceP95Evidence(
        values[6],
      )
      const quality = assertCanonicalSam31TemporalQualityQualificationSet(
        values[7],
      )
      const cost = assertCanonicalSam31VertexServingCostSettlementReadiness(
        values[8],
        observedAt,
      )
      const routeRef = canonicalSam31VertexDedicatedPredictionRouteRef(route)
      const capacityRef = endpointCapacityRef(capacity)
      const quotaRef = a100ServingQuotaRef(quota)
      assertExactRef(runtimeRelease.runtimeReleaseRef,
        request.runtimeReleaseRef, 'runtime_release')
      assertExactRef(rateRef(rate), request.rateAuthorityRef, 'rate_authority')
      assertExactRef(thirtyRunRef(thirty), request.thirtyRunQualificationRef,
        'thirty_run')
      assertExactRef(canonicalSam31GpuPerformanceP95EvidenceRef(performance),
        request.completeSourceP95QualificationRef, 'complete_source_p95')
      assertExactRef(canonicalSam31TemporalQualityQualificationSetRef(quality),
        request.independentMaskQualityQualificationRef, 'temporal_quality')
      assertExactRef(costReadinessRef(cost),
        request.multiReplicaCostAuthorityRef, 'cost_settlement')
      assertExactA100Lineage({
        observedAt,
        runtimeRelease,
        rate,
        route,
        capacity,
        capacityRef,
        quota,
        thirty,
        performance,
        quality,
        cost,
      })
      const expiresAt = new Date(
        Date.parse(observedAt) + MAXIMUM_READINESS_AGE_MILLISECONDS,
      ).toISOString()
      const readiness = sealCanonicalSam31CurrentA100CustomerDispatchReadiness({
        schemaVersion:
          'canonical-sam3_1-current-a100-customer-dispatch-readiness-v1',
        source:
          'canonical_server_sam31_current_a100_customer_dispatch_readiness_owner',
        evidenceClass: 'canonical_private_reread',
        status: 'ready_for_private_customer_dispatch',
        readinessId: request.readinessId,
        routeId: 'a100_80gb_heavy_primary',
        toolId: 'sam3_1',
        operationId: CANONICAL_SAM3_1_OPERATION_ID,
        executionTarget:
          'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
        endpointResourceName:
          CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
        deployedModelId: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
        modelVersionId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
        immutableImageDigest: runtimeRelease.immutableImageDigest,
        runtimeReleaseRef: request.runtimeReleaseRef,
        rateAuthorityRef: request.rateAuthorityRef,
        endpointRouteRef: routeRef,
        endpointCapacityObservationRef: capacityRef,
        a100ServingQuotaObservationRef: quotaRef,
        thirtyRunQualificationRef: request.thirtyRunQualificationRef,
        completeSourceP95QualificationRef:
          request.completeSourceP95QualificationRef,
        independentMaskQualityQualificationRef:
          request.independentMaskQualityQualificationRef,
        multiReplicaCostAuthorityRef: request.multiReplicaCostAuthorityRef,
        maximumReplicaCount: MAXIMUM_REPLICA_COUNT,
        maximumConcurrentInvocations: MAXIMUM_REPLICA_COUNT,
        minimumReplicaCount: 0,
        thirtyRunQualificationCount: 30,
        completeEightMinuteSourceRunCount:
          performance.exactCompleteSourceEvidenceRecordCount,
        exactCurrentEndpointModelVersionTrafficAndCapacityReread: true,
        exactRuntimeReleaseRateQuotaAndQualificationReread: true,
        completeSourceP95AtOrBelowEightMinutes: true,
        independentMaskQualityAccepted: true,
        scaleFromZeroAndReturnToZeroVerified: true,
        accountEffectiveMultiReplicaCostSettlementReady: true,
        privateCustomerDispatchAllowed: true,
        publicProductionDispatchAllowed: false,
        callerOrPlanSelfAttestedReadinessAccepted: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt,
        expiresAt,
      })
      const readinessRef = await input.repository.persistCurrentCreateOnly({
        readiness,
      })
      const reread = await input.repository.rereadExact({
        readinessRef,
        at: observedAt,
      })
      if (!reread || reread.readinessHash !== readiness.readinessHash) {
        throw conflict('readiness_create_only_exact_reread_failed')
      }
      return reread
    },
  })
}

export function assertCanonicalSam31VertexServingCostSettlementReadiness(
  value: unknown,
  at?: string,
): CanonicalSam31VertexServingCostSettlementReadiness {
  assertPlainSerializedData(value, 'sam31_serving_cost_readiness')
  const parsed = canonicalSam31VertexServingCostSettlementReadinessSchema
    .parse(value)
  const { readinessHash, ...payload } = parsed
  if (readinessHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)))) {
    throw conflict('cost_settlement_readiness_invalid_or_stale')
  }
  return parsed
}

export function sealCanonicalSam31VertexServingCostSettlementReadiness(
  value: unknown,
): CanonicalSam31VertexServingCostSettlementReadiness {
  assertPlainSerializedData(value, 'sam31_serving_cost_readiness_build')
  const payload = costReadinessWithoutHashSchema.parse(value)
  return assertCanonicalSam31VertexServingCostSettlementReadiness({
    ...payload,
    readinessHash: sha256AuthorityValue(payload),
  })
}

export function canonicalSam31VertexServingCostSettlementReadinessRef(
  value: unknown,
): EvidenceRef {
  return costReadinessRef(
    assertCanonicalSam31VertexServingCostSettlementReadiness(value),
  )
}

function assertExactA100Lineage(input: {
  observedAt: string
  runtimeRelease: z.infer<typeof runtimeReleaseProjectionSchema>
  rate: ReturnType<
    typeof assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
  >
  route: ReturnType<typeof assertCanonicalSam31VertexDedicatedPredictionRoute>
  capacity: ReturnType<
    typeof assertCanonicalSam31VertexServingCapacityObservation
  >
  capacityRef: EvidenceRef
  quota: ReturnType<
    typeof assertCanonicalSam31A100ServingCompleteSourceCapacityObservation
  >
  thirty: ReturnType<
    typeof assertCanonicalSam31VertexServingThirtyRunQualification
  >
  performance: ReturnType<
    typeof assertCanonicalSam31GpuPerformanceP95Evidence
  >
  quality: ReturnType<
    typeof assertCanonicalSam31TemporalQualityQualificationSet
  >
  cost: CanonicalSam31VertexServingCostSettlementReadiness
}): void {
  const image = input.runtimeRelease.immutableImageDigest
  const exact =
    Date.parse(input.observedAt) >= Date.parse(input.runtimeRelease.qualifiedAt)
    && Date.parse(input.observedAt) < Date.parse(input.runtimeRelease.expiresAt)
    && input.route.endpointResourceName ===
      CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE
    && input.route.deployedModelId ===
      CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID
    && input.capacity.currentEndpointMeetsCompleteSourceCapacity
    && input.capacity.maximumReplicaCount === MAXIMUM_REPLICA_COUNT
    && input.capacity.minimumReplicaCount === 0
    && input.quota.preferredValue >= MAXIMUM_REPLICA_COUNT
    && input.quota.grantedValue >= MAXIMUM_REPLICA_COUNT
    && !input.quota.reconciling
    && input.rate.maximumReplicaCount === MAXIMUM_REPLICA_COUNT
    && input.rate.maximumConcurrentInvocations === MAXIMUM_REPLICA_COUNT
    && input.rate.minimumReplicaCount === 0
    && sameRef(input.rate.endpointCapacityObservationRef, input.capacityRef)
    && input.thirty.routeId === 'a100_80gb_heavy_primary'
    && input.thirty.accelerator === 'nvidia_a100_80gb'
    && input.thirty.immutableImageDigest === image
    && input.thirty.deterministicOutputRunCount === 30
    && input.thirty.measuredPerformanceRunCount === 30
    && input.performance.route.routeId === 'a100_80gb_heavy_primary'
    && input.performance.immutableImageDigest === image
    && input.performance.p95AtOrBelowEightMinutes
    && input.performance.exactCompleteSourceEvidenceRecordCount >= 5
    && input.quality.route.routeId === 'a100_80gb_heavy_primary'
    && input.quality.qualityRole === 'approved_a100_baseline'
    && input.quality.immutableImageDigest === image
    && input.quality.thresholdsPassed
    && input.quality.qualityEqualToOrBetterThanApprovedA100Baseline
    && sameRef(input.cost.endpointCapacityObservationRef, input.capacityRef)
    && sameRef(input.cost.rateAuthorityRef, rateRef(input.rate))
    && input.cost.scaleFromZeroAndReturnToZeroObserved
    && input.cost.maximumReplicaCount === MAXIMUM_REPLICA_COUNT
  if (!exact) throw conflict('dependency_lineage_or_gate_mismatch')
}

function endpointCapacityRef(
  value: ReturnType<typeof assertCanonicalSam31VertexServingCapacityObservation>,
): EvidenceRef {
  return refSchema.parse({
    id: `sam31-vertex-serving-capacity:${value.observationHash}`,
    version: 1,
    contentHash: `sha256:${value.observationHash}`,
  })
}

function a100ServingQuotaRef(
  value: ReturnType<
    typeof assertCanonicalSam31A100ServingCompleteSourceCapacityObservation
  >,
): EvidenceRef {
  return refSchema.parse({
    id: `sam31-a100-serving-quota:${value.observationHash}`,
    version: 1,
    contentHash: `sha256:${value.observationHash}`,
  })
}

function thirtyRunRef(
  value: ReturnType<
    typeof assertCanonicalSam31VertexServingThirtyRunQualification
  >,
): EvidenceRef {
  return refSchema.parse({
    id: value.qualificationSetId,
    version: 1,
    contentHash: `sha256:${value.receiptHash}`,
  })
}

function rateRef(
  value: ReturnType<
    typeof assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
  >,
): EvidenceRef {
  return refSchema.parse({
    id: value.rateAuthorityId,
    version: value.rateAuthorityVersion,
    contentHash: `sha256:${value.rateAuthorityHash}`,
  })
}

function costReadinessRef(
  value: CanonicalSam31VertexServingCostSettlementReadiness,
): EvidenceRef {
  return refSchema.parse({
    id: value.costSettlementReadinessId,
    version: value.costSettlementReadinessVersion,
    contentHash: `sha256:${value.readinessHash}`,
  })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function assertExactRef(
  actual: EvidenceRef,
  expected: EvidenceRef,
  label: string,
): void {
  if (!sameRef(actual, expected)) throw conflict(`${label}_ref_mismatch`)
}

function assertDependencies(
  value: CanonicalSam31CurrentA100CustomerDispatchReadinessDependencyPorts,
): void {
  const functions = [
    value?.rereadRuntimeRelease,
    value?.rereadRateAuthority,
    value?.rereadCurrentEndpointRoute,
    value?.rereadCurrentEndpointCapacity,
    value?.rereadCurrentA100ServingQuota,
    value?.rereadThirtyRunQualification,
    value?.rereadCompleteSourceP95Qualification,
    value?.rereadIndependentMaskQualityQualification,
    value?.rereadMultiReplicaCostSettlementReadiness,
  ]
  if (functions.some((entry) => typeof entry !== 'function')) {
    throw conflict('dependency_port_missing')
  }
}

function assertRepository(
  value: CanonicalSam31CurrentA100CustomerDispatchReadinessRepository,
): void {
  if (typeof value?.persistCurrentCreateOnly !== 'function'
    || typeof value?.rereadExact !== 'function') {
    throw conflict('readiness_repository_missing')
  }
}

function conflict(reason: string): Error {
  return new Error(`SAM31_A100_DISPATCH_READINESS_CONFLICT:${reason}`)
}
