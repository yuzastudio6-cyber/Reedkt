import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_VERSION =
  'canonical-sam3_1-current-a100-customer-dispatch-readiness-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof evidenceRefSchema>

const readinessWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CURRENT_A100_CUSTOMER_DISPATCH_READINESS_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam31_current_a100_customer_dispatch_readiness_owner',
  ),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum([
    'contract_only_blocked',
    'ready_for_private_customer_dispatch',
  ]),
  readinessId: safeId,
  routeId: z.literal('a100_80gb_heavy_primary'),
  toolId: z.literal('sam3_1'),
  operationId: z.literal('tool.sam3_1.track_and_segment_video.v1'),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  ),
  endpointResourceName: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  ),
  deployedModelId: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  ),
  modelVersionId: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  ),
  immutableImageDigest: prefixedSha256,
  runtimeReleaseRef: evidenceRefSchema,
  rateAuthorityRef: evidenceRefSchema,
  endpointRouteRef: evidenceRefSchema,
  endpointCapacityObservationRef: evidenceRefSchema,
  a100ServingQuotaObservationRef: evidenceRefSchema,
  thirtyRunQualificationRef: evidenceRefSchema,
  completeSourceP95QualificationRef: evidenceRefSchema,
  independentMaskQualityQualificationRef: evidenceRefSchema,
  multiReplicaCostAuthorityRef: evidenceRefSchema,
  maximumReplicaCount: z.literal(16),
  maximumConcurrentInvocations: z.literal(16),
  minimumReplicaCount: z.literal(0),
  thirtyRunQualificationCount: z.literal(30),
  completeEightMinuteSourceRunCount: z.number().int().min(5).max(30),
  exactCurrentEndpointModelVersionTrafficAndCapacityReread: z.boolean(),
  exactRuntimeReleaseRateQuotaAndQualificationReread: z.boolean(),
  completeSourceP95AtOrBelowEightMinutes: z.boolean(),
  independentMaskQualityAccepted: z.boolean(),
  scaleFromZeroAndReturnToZeroVerified: z.boolean(),
  accountEffectiveMultiReplicaCostSettlementReady: z.boolean(),
  privateCustomerDispatchAllowed: z.boolean(),
  publicProductionDispatchAllowed: z.literal(false),
  callerOrPlanSelfAttestedReadinessAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((readiness, context) => {
  const canonical = readiness.evidenceClass === 'canonical_private_reread'
  const ready = readiness.status === 'ready_for_private_customer_dispatch'
  const allEvidence =
    readiness.exactCurrentEndpointModelVersionTrafficAndCapacityReread
    && readiness.exactRuntimeReleaseRateQuotaAndQualificationReread
    && readiness.completeSourceP95AtOrBelowEightMinutes
    && readiness.independentMaskQualityAccepted
    && readiness.scaleFromZeroAndReturnToZeroVerified
    && readiness.accountEffectiveMultiReplicaCostSettlementReady
    && readiness.privateCustomerDispatchAllowed
  const life = Date.parse(readiness.expiresAt)
    - Date.parse(readiness.observedAt)
  if (canonical !== ready || ready !== allEvidence
    || life <= 0 || life > 15 * 60_000) context.addIssue({
    code: 'custom',
    message: 'Current A100 customer-dispatch readiness is inconsistent.',
  })
})

export const canonicalSam31CurrentA100CustomerDispatchReadinessSchema =
  readinessWithoutHashSchema.extend({ readinessHash: sha256 }).strict()
export type CanonicalSam31CurrentA100CustomerDispatchReadiness = z.infer<
  typeof canonicalSam31CurrentA100CustomerDispatchReadinessSchema
>

export interface CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort {
  rereadCurrent(input: {
    readonly toolId: 'sam3_1'
    readonly operationId: 'tool.sam3_1.track_and_segment_video.v1'
    readonly runtimeReleaseRef: EvidenceRef
    readonly rateAuthorityRef: EvidenceRef
    readonly at: string
  }): Promise<unknown | null>
}

export function sealCanonicalSam31CurrentA100CustomerDispatchReadiness(
  value: unknown,
): CanonicalSam31CurrentA100CustomerDispatchReadiness {
  assertPlainSerializedData(value, 'sam31_a100_customer_dispatch_build')
  const payload = readinessWithoutHashSchema.parse(value)
  return assertCanonicalSam31CurrentA100CustomerDispatchReadiness({
    ...payload,
    readinessHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31CurrentA100CustomerDispatchReadiness(
  value: unknown,
  at?: string,
): CanonicalSam31CurrentA100CustomerDispatchReadiness {
  assertPlainSerializedData(value, 'sam31_a100_customer_dispatch_readiness')
  const parsed = canonicalSam31CurrentA100CustomerDispatchReadinessSchema
    .parse(value)
  const { readinessHash, ...payload } = parsed
  if (readinessHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)))) throw new Error(
    'Current A100 customer-dispatch readiness is invalid or stale.',
  )
  return parsed
}

export function assertCanonicalSam31CurrentA100CustomerDispatchAllowed(input: {
  readonly readiness: unknown
  readonly runtimeReleaseRef: EvidenceRef
  readonly rateAuthorityRef: EvidenceRef
  readonly immutableImageDigest: string
  readonly at: string
}): CanonicalSam31CurrentA100CustomerDispatchReadiness {
  const readiness =
    assertCanonicalSam31CurrentA100CustomerDispatchReadiness(
      input.readiness,
      input.at,
    )
  if (readiness.evidenceClass !== 'canonical_private_reread'
    || readiness.status !== 'ready_for_private_customer_dispatch'
    || !readiness.privateCustomerDispatchAllowed
    || !sameRef(readiness.runtimeReleaseRef, input.runtimeReleaseRef)
    || !sameRef(readiness.rateAuthorityRef, input.rateAuthorityRef)
    || readiness.immutableImageDigest !== input.immutableImageDigest) {
    throw new Error('Current A100 customer dispatch is not qualified.')
  }
  return readiness
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}
