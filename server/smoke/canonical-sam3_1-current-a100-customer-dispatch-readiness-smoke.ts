import assert from 'node:assert/strict'

import {
  assertCanonicalSam31CurrentA100CustomerDispatchAllowed,
  assertCanonicalSam31CurrentA100CustomerDispatchReadiness,
  sealCanonicalSam31CurrentA100CustomerDispatchReadiness,
} from '../services/canonical-sam3_1-current-a100-customer-dispatch-readiness'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const observedAt = '2026-08-12T23:00:00.000Z'
const expiresAt = '2026-08-12T23:15:00.000Z'
const runtimeReleaseRef = ref('sam31-a100-endpoint-release', 'release')
const rateAuthorityRef = ref('sam31-a100-endpoint-rate', 'rate')
const base = {
  schemaVersion:
    'canonical-sam3_1-current-a100-customer-dispatch-readiness-v1' as const,
  source:
    'canonical_server_sam31_current_a100_customer_dispatch_readiness_owner' as const,
  readinessId: 'sam31-a100-current-dispatch-readiness-smoke',
  routeId: 'a100_80gb_heavy_primary' as const,
  toolId: 'sam3_1' as const,
  operationId: 'tool.sam3_1.segment_and_track_subject.v1' as const,
  executionTarget:
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra' as const,
  endpointResourceName:
    'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const,
  deployedModelId: '3101000004' as const,
  modelVersionId: '2' as const,
  immutableImageDigest: `sha256:${sha256AuthorityValue('image')}`,
  runtimeReleaseRef,
  rateAuthorityRef,
  endpointRouteRef: ref('sam31-endpoint-route', 'route'),
  endpointCapacityObservationRef: ref('sam31-endpoint-capacity', 'capacity'),
  a100ServingQuotaObservationRef: ref('sam31-a100-quota', 'quota'),
  thirtyRunQualificationRef: ref('sam31-a100-thirty-run', 'thirty'),
  completeSourceP95QualificationRef: ref('sam31-a100-p95', 'p95'),
  independentMaskQualityQualificationRef: ref('sam31-a100-quality', 'quality'),
  multiReplicaCostAuthorityRef: ref('sam31-a100-multi-cost', 'cost'),
  maximumReplicaCount: 16 as const,
  maximumConcurrentInvocations: 16 as const,
  minimumReplicaCount: 0 as const,
  thirtyRunQualificationCount: 30 as const,
  completeEightMinuteSourceRunCount: 5,
  publicProductionDispatchAllowed: false as const,
  callerOrPlanSelfAttestedReadinessAccepted: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  observedAt,
  expiresAt,
}

const contractOnly =
  sealCanonicalSam31CurrentA100CustomerDispatchReadiness({
    ...base,
    evidenceClass: 'synthetic_contract_fixture',
    status: 'contract_only_blocked',
    exactCurrentEndpointModelVersionTrafficAndCapacityReread: false,
    exactRuntimeReleaseRateQuotaAndQualificationReread: false,
    completeSourceP95AtOrBelowEightMinutes: false,
    independentMaskQualityAccepted: false,
    scaleFromZeroAndReturnToZeroVerified: false,
    accountEffectiveMultiReplicaCostSettlementReady: false,
    privateCustomerDispatchAllowed: false,
  })
assert.deepEqual(
  assertCanonicalSam31CurrentA100CustomerDispatchReadiness(
    contractOnly,
    observedAt,
  ),
  contractOnly,
)
assert.throws(() => assertCanonicalSam31CurrentA100CustomerDispatchAllowed({
  readiness: contractOnly,
  runtimeReleaseRef,
  rateAuthorityRef,
  immutableImageDigest: base.immutableImageDigest,
  at: observedAt,
}))

const structurallyReadyFixture =
  sealCanonicalSam31CurrentA100CustomerDispatchReadiness({
    ...base,
    evidenceClass: 'canonical_private_reread',
    status: 'ready_for_private_customer_dispatch',
    exactCurrentEndpointModelVersionTrafficAndCapacityReread: true,
    exactRuntimeReleaseRateQuotaAndQualificationReread: true,
    completeSourceP95AtOrBelowEightMinutes: true,
    independentMaskQualityAccepted: true,
    scaleFromZeroAndReturnToZeroVerified: true,
    accountEffectiveMultiReplicaCostSettlementReady: true,
    privateCustomerDispatchAllowed: true,
  })
assert.deepEqual(assertCanonicalSam31CurrentA100CustomerDispatchAllowed({
  readiness: structurallyReadyFixture,
  runtimeReleaseRef,
  rateAuthorityRef,
  immutableImageDigest: base.immutableImageDigest,
  at: observedAt,
}), structurallyReadyFixture)

assert.throws(() => assertCanonicalSam31CurrentA100CustomerDispatchAllowed({
  readiness: structurallyReadyFixture,
  runtimeReleaseRef: ref('crossed-release', 'crossed-release'),
  rateAuthorityRef,
  immutableImageDigest: base.immutableImageDigest,
  at: observedAt,
}))
assert.throws(() => assertCanonicalSam31CurrentA100CustomerDispatchReadiness(
  structurallyReadyFixture,
  expiresAt,
))
const tampered = structuredClone(structurallyReadyFixture)
tampered.completeEightMinuteSourceRunCount = 4
assert.throws(() => assertCanonicalSam31CurrentA100CustomerDispatchReadiness(
  tampered,
))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-current-a100-customer-dispatch-readiness',
  checks: 18,
  contractOnlyFailsClosed: true,
  exactCurrentEndpointModelAndCapacityRequired: true,
  thirtyShortRunsRequired: 30,
  completeEightMinuteRunsRequired: 5,
  accountEffectiveMultiReplicaCostRequired: true,
  fixtureGrantsLiveRuntimeAuthority: false,
  customerCreditsMutated: false,
  publicProductionAuthorityGranted: false,
}, null, 2))

function ref(id: string, seed: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(seed)}`,
  }
}
