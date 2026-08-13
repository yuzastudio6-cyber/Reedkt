import assert from 'node:assert/strict'

import {
  assertCanonicalSam31VertexServingCostSettlementReadiness,
  canonicalSam31VertexServingCostSettlementReadinessRef,
  createCanonicalSam31CurrentA100CustomerDispatchReadinessOwner,
  sealCanonicalSam31VertexServingCostSettlementReadiness,
} from '../services/canonical-sam3_1-current-a100-customer-dispatch-readiness-owner'
import type {
  CanonicalSam31CurrentA100CustomerDispatchReadinessRepository,
} from '../services/canonical-sam3_1-current-a100-customer-dispatch-readiness-repository'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const observedAt = '2026-08-13T14:00:00.000Z'
const expiresAt = '2026-08-13T14:15:00.000Z'
const capacityRef = ref('sam31-current-capacity', 'capacity')
const rateRef = ref('sam31-current-rate', 'rate')
const scaleZeroWindowRef = ref('sam31-scale-zero-window', 'window')
const costReadiness =
  sealCanonicalSam31VertexServingCostSettlementReadiness({
    schemaVersion:
      'canonical-sam3_1-vertex-serving-cost-settlement-readiness-v1',
    source:
      'canonical_server_sam31_vertex_serving_cost_settlement_readiness_owner',
    evidenceClass: 'canonical_private_exact_reread',
    status: 'ready_for_private_customer_cost_settlement',
    costSettlementReadinessId: 'sam31-cost-settlement-readiness-smoke',
    costSettlementReadinessVersion: 1,
    routeId: 'a100_80gb_heavy_primary',
    endpointResourceName:
      'projects/reeditpro/locations/us-central1/endpoints/'
      + 'weeditpro-sam31-a100-scale-zero-v1',
    deployedModelId: '3101000004',
    modelVersionId: '2',
    endpointCapacityObservationRef: capacityRef,
    rateAuthorityRef: rateRef,
    scaleZeroQualificationWindowRef: scaleZeroWindowRef,
    maximumReplicaCount: 16,
    maximumConcurrentInvocations: 16,
    minimumReplicaCount: 0,
    multiReplicaWindowUsageVersion:
      'canonical-sam3_1-vertex-serving-window-usage-v3',
    multiReplicaWindowCostReceiptVersion:
      'canonical-sam3_1-vertex-serving-window-cost-receipt-v3',
    reconciledWindowUsageVersion:
      'canonical-sam3_1-vertex-serving-reconciled-window-usage-v1',
    reconciledWindowCostReceiptVersion:
      'canonical-sam3_1-vertex-serving-reconciled-window-cost-receipt-v1',
    attemptCreditSettlementVersion:
      'canonical-sam3_1-vertex-serving-attempt-credit-settlement-v2',
    exactBillingAccountEffectiveRateAndCapacityReread: true,
    exactMonitoringAllocationWindowReread: true,
    scaleFromZeroAndReturnToZeroObserved: true,
    detailedBillingExportRequiredForFinalInfrastructureCost: true,
    monitoringGaugeAcceptedAsFinalInvoiceCost: false,
    configuredMaximumReplicasChargedAsAllocatedReplicas: false,
    failedOrCanceledAttemptCostChargedToCustomer: false,
    unapprovedOverageAbsorbedByWeEditPro: true,
    sharedPlanReservationSettledIdempotently: true,
    callerPriceUsageOutcomeOrSettlementClaimAccepted: false,
    gpuInferenceStarted: false,
    customerCreditsMutated: false,
    publicBillingAuthorityGranted: false,
    productionAuthorityGranted: false,
    observedAt,
    expiresAt,
  })

assert.deepEqual(
  assertCanonicalSam31VertexServingCostSettlementReadiness(
    costReadiness,
    observedAt,
  ),
  costReadiness,
)
assert.deepEqual(
  canonicalSam31VertexServingCostSettlementReadinessRef(costReadiness),
  {
    id: costReadiness.costSettlementReadinessId,
    version: 1,
    contentHash: `sha256:${costReadiness.readinessHash}`,
  },
)
assert.throws(() =>
  assertCanonicalSam31VertexServingCostSettlementReadiness(
    costReadiness,
    expiresAt,
  ),
)
assert.throws(() =>
  assertCanonicalSam31VertexServingCostSettlementReadiness({
    ...costReadiness,
    maximumReplicaCount: 1,
  }),
)
assert.throws(() =>
  assertCanonicalSam31VertexServingCostSettlementReadiness({
    ...costReadiness,
    scaleFromZeroAndReturnToZeroObserved: false,
  }),
)
assert.throws(() =>
  sealCanonicalSam31VertexServingCostSettlementReadiness({
    ...without(costReadiness, 'readinessHash'),
    configuredMaximumReplicasChargedAsAllocatedReplicas: true,
  }),
)

let persisted = 0
let dependencyReads = 0
const repository = fakeRepository(() => { persisted += 1 })
const owner = createCanonicalSam31CurrentA100CustomerDispatchReadinessOwner({
  dependencies: {
    async rereadRuntimeRelease() {
      dependencyReads += 1
      return null
    },
    async rereadRateAuthority() {
      dependencyReads += 1
      return null
    },
    async rereadCurrentEndpointRoute() {
      dependencyReads += 1
      return null
    },
    async rereadCurrentEndpointCapacity() {
      dependencyReads += 1
      return null
    },
    async rereadCurrentA100ServingQuota() {
      dependencyReads += 1
      return null
    },
    async rereadThirtyRunQualification() {
      dependencyReads += 1
      return null
    },
    async rereadCompleteSourceP95Qualification() {
      dependencyReads += 1
      return null
    },
    async rereadIndependentMaskQualityQualification() {
      dependencyReads += 1
      return null
    },
    async rereadMultiReplicaCostSettlementReadiness() {
      dependencyReads += 1
      return null
    },
  },
  repository,
  now: () => observedAt,
})

const request = {
  readinessId: 'sam31-a100-readiness-owner-smoke',
  runtimeReleaseRef: ref('runtime-release', 'runtime'),
  rateAuthorityRef: rateRef,
  thirtyRunQualificationRef: ref('thirty-run', 'thirty'),
  completeSourceP95QualificationRef: ref('complete-source-p95', 'p95'),
  independentMaskQualityQualificationRef: ref('mask-quality', 'quality'),
  multiReplicaCostAuthorityRef:
    canonicalSam31VertexServingCostSettlementReadinessRef(costReadiness),
}
await assert.rejects(() => owner.observePersistAndReread(request),
  /dependency_reread_missing/u)
assert.equal(dependencyReads, 9)
assert.equal(persisted, 0)

await assert.rejects(() => owner.observePersistAndReread({
  ...request,
  privateCustomerDispatchAllowed: true,
}), /unrecognized|unrecognized_keys|Unrecognized/u)
assert.equal(dependencyReads, 9)
assert.equal(persisted, 0)

let getterInvoked = false
const accessor = Object.defineProperty({}, 'readinessId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return request.readinessId
  },
})
await assert.rejects(() => owner.observePersistAndReread(accessor))
assert.equal(getterInvoked, false)
assert.equal(dependencyReads, 9)
assert.equal(persisted, 0)

assert.throws(() =>
  createCanonicalSam31CurrentA100CustomerDispatchReadinessOwner({
    dependencies: {} as never,
    repository,
    now: () => observedAt,
  }),
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-current-a100-customer-dispatch-readiness-owner',
  checks: 24,
  callerBooleansAccepted: false,
  allNineDependenciesRereadBeforePublication: true,
  missingDependencyFailsClosed: true,
  invalidDependencyPersistsReadiness: false,
  maximumReplicaCount: costReadiness.maximumReplicaCount,
  minimumReplicaCount: costReadiness.minimumReplicaCount,
  actualAllocatedReplicasPricedInsteadOfConfiguredMaximum: true,
  billingExportRequiredForFinalCost: true,
  scaleFromZeroAndReturnToZeroRequired: true,
  customerCreditsMutated: false,
  publicBillingAuthorityGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function ref(id: string, seed: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(seed)}`,
  }
}

function without<T extends object, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const clone = { ...value }
  delete clone[key]
  return clone
}

function fakeRepository(
  onPersist: () => void,
): CanonicalSam31CurrentA100CustomerDispatchReadinessRepository {
  return {
    schemaVersion:
      'canonical-sam3_1-current-a100-customer-dispatch-readiness-repository-v1',
    evidenceClass:
      'private_create_only_evidence_atomic_current_pointer_exact_reread',
    async persistCurrentCreateOnly() {
      onPersist()
      return ref('unexpected-readiness', 'unexpected-readiness')
    },
    async rereadExact() { return null },
    async rereadCurrent() { return null },
  }
}
