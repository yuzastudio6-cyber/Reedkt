import assert from 'node:assert/strict'

import {
  createCanonicalSam31PrivateInternalReleaseReadinessOwner,
  assertCanonicalSam31PrivateInternalReleaseReadiness,
} from '../services/canonical-sam3_1-private-internal-release-readiness-owner'
import {
  createCanonicalSam31PrivateQualificationCapacityOwner,
  createCanonicalSam31PrivateQualificationCapacityRepository,
} from '../services/canonical-sam3_1-private-qualification-capacity-owner'
import {
  sealCanonicalSam31A100ServingCompleteSourceCapacityObservation,
  sealCanonicalSam31L4CompleteSourceCapacityObservation,
} from '../services/canonical-sam3_1-complete-source-capacity-owner'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'

const at = '2026-08-14T18:00:00.000Z'
const expiresAt = '2026-08-14T18:15:00.000Z'
const ref = (id: string) => ({
  id,
  version: 1 as const,
  contentHash: `sha256:${id.padEnd(64, 'a').slice(0, 64)}`,
})
const readyObservation = (
  routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback',
) => ({
  schemaVersion:
    'canonical-sam3_1-gpu-runtime-release-readiness-observation-v2' as const,
  source:
    'canonical_server_sam3_1_gpu_runtime_release_readiness_observer' as const,
  evidenceClass: 'canonical_component_index_exact_read' as const,
  disposition: 'ready_for_release_publication_request' as const,
  routeId,
  qualificationId: `sam31-${routeId}-private-internal`,
  immutableImageDigest: `sha256:${'b'.repeat(64)}`,
  validatedComponentRecordCount: 4,
  componentStatuses: [
    'driver_and_cuda',
    'deterministic_run_set',
    'eight_minute_performance',
    'independent_temporal_quality',
  ].map((componentKind, index) => ({
    componentKind,
    status: 'ready' as const,
    componentRef: ref(`${index + 1}`),
    expectedComponentRef: ref(`${index + 1}`),
    matchingCandidateCount: 1,
  })),
  blockers: [],
  exactCanonicalComponentBodiesAndObjectPathsValidated: true as const,
  everyExpectedComponentRefProvided: true,
  exactExpectedComponentRefsAppliedBeforeReadiness: true,
  callerQualificationOrReadinessClaimsAccepted: false as const,
  releasePublisherMayBeInvoked: true,
  gpuJobDispatched: false as const,
  customerCreditsMutated: false as const,
  qaApprovalGranted: false as const,
  runtimeReleaseGranted: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
})

const capacity = await privateCapacity({ a100: 1, l4: 3 })
const ready = createCanonicalSam31PrivateInternalReleaseReadinessOwner()
  .observe({
    readinessId: 'sam31-private-internal-ready-1a100-3l4',
    capacityObservation: capacity,
    a100RouteReadinessObservation:
      readyObservation('a100_80gb_heavy_primary'),
    l4RouteReadinessObservation: readyObservation('l4_heavy_fallback'),
    observedAt: at,
  })

assert.equal(ready.status,
  'ready_for_private_internal_runtime_release_publication')
assert.equal(ready.privateInternalReleasePublicationMayProceed, true)
assert.equal(ready.privateA100GrantedCapacity, 1)
assert.equal(ready.privateL4GrantedCapacity, 3)
assert.equal(ready.productionConcurrencyCapacityReady, false)
assert.equal(ready.publicConcurrencyShortfallBlocksPrivateInternalQualification,
  false)
assert.equal(ready.exactEightMinutePerformanceEvidenceRequiredForEachRoute,
  true)
assert.equal(ready.independentTemporalQualityEvidenceRequiredForEachRoute,
  true)
assert.equal(ready.cpuOnlySubstantiveExecutionAllowed, false)
assert.equal(ready.customerDispatchAuthorized, false)
assert.deepEqual(ready.blockers, [])
assert.deepEqual(assertCanonicalSam31PrivateInternalReleaseReadiness(ready),
  ready)

const missingQuality = structuredClone(
  readyObservation('l4_heavy_fallback'),
)
missingQuality.componentStatuses[3] = {
  ...missingQuality.componentStatuses[3],
  status: 'missing',
  componentRef: null,
  matchingCandidateCount: 0,
}
missingQuality.blockers = ['missing_independent_temporal_quality']
missingQuality.disposition = 'blocked_missing_or_ambiguous_components'
missingQuality.releasePublisherMayBeInvoked = false
const blockedQuality = createCanonicalSam31PrivateInternalReleaseReadinessOwner()
  .observe({
    readinessId: 'sam31-private-internal-missing-l4-quality',
    capacityObservation: capacity,
    a100RouteReadinessObservation:
      readyObservation('a100_80gb_heavy_primary'),
    l4RouteReadinessObservation: missingQuality,
    observedAt: at,
  })
assert.equal(blockedQuality.privateInternalReleasePublicationMayProceed, false)
assert.deepEqual(blockedQuality.blockers,
  ['l4_missing_independent_temporal_quality'])

const noA100 = await privateCapacity({ a100: 0, l4: 3 })
const blockedCapacity =
  createCanonicalSam31PrivateInternalReleaseReadinessOwner().observe({
    readinessId: 'sam31-private-internal-no-a100',
    capacityObservation: noA100,
    a100RouteReadinessObservation:
      readyObservation('a100_80gb_heavy_primary'),
    l4RouteReadinessObservation: readyObservation('l4_heavy_fallback'),
    observedAt: at,
  })
assert.deepEqual(blockedCapacity.blockers,
  ['private_sequential_gpu_capacity_unavailable'])
assert.equal(blockedCapacity.productionConcurrencyCapacityReady, false)

assert.throws(() =>
  createCanonicalSam31PrivateInternalReleaseReadinessOwner().observe({
    readinessId: 'sam31-private-internal-swapped-routes',
    capacityObservation: capacity,
    a100RouteReadinessObservation: readyObservation('l4_heavy_fallback'),
    l4RouteReadinessObservation:
      readyObservation('a100_80gb_heavy_primary'),
    observedAt: at,
  }))
assert.throws(() => assertCanonicalSam31PrivateInternalReleaseReadiness({
  ...ready,
  publicConcurrencyShortfallBlocksPrivateInternalQualification: true,
}))
assert.throws(() => assertCanonicalSam31PrivateInternalReleaseReadiness({
  ...ready,
  readinessHash: '0'.repeat(64),
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-internal-release-readiness-owner',
  checks: 28,
  privateInternalReadyWithOneA100AndThreeL4: true,
  publicSixteenBySixteenCapacityRequiredForPrivateInternal: false,
  eightMinutePerformanceStillRequired: true,
  independentTemporalQualityStillRequired: true,
  customerOrPublicDispatchGranted: false,
}))

async function privateCapacity(input: { a100: number; l4: number }) {
  return createCanonicalSam31PrivateQualificationCapacityOwner({
    a100QuotaReadPort: {
      async rereadCurrent() {
        return sealCanonicalSam31A100ServingCompleteSourceCapacityObservation({
          schemaVersion:
            'canonical-sam3_1-a100-serving-complete-source-capacity-observation-v1',
          source:
            'canonical_server_vertex_a100_serving_quota_observation_owner',
          evidenceClass: 'canonical_private_reread',
          projectId: 'reeditpro',
          region: 'us-central1',
          quotaPreferenceId:
            'weeditpro-vertex-serving-a100-80gb-us-central1-1',
          quotaId: 'CustomModelServingA10080GBGPUsPerProjectPerRegion',
          preferredValue: 16,
          grantedValue: input.a100,
          reconciling: input.a100 < 16,
          exactCloudQuotaPreferenceAndQuotaInfoReread: true,
          vertexCustomJobTrainingQuotaAcceptedAsServingCapacity: false,
          minimumReplicaCount: 0,
          maximumRequestConcurrencyPerReplica: 1,
          endpointOrGpuJobStarted: false,
          customerCreditsMutated: false,
          observedAt: at,
          expiresAt,
        })
      },
    },
    l4QuotaReadPort: {
      async rereadCurrent() {
        return sealCanonicalSam31L4CompleteSourceCapacityObservation({
          schemaVersion:
            'canonical-sam3_1-l4-complete-source-capacity-observation-v1',
          source: 'canonical_server_cloud_run_l4_quota_observation_owner',
          evidenceClass: 'canonical_private_reread',
          projectId: 'reeditpro',
          region: 'us-central1',
          quotaPreferenceId:
            'weeditpro-l4-scale-zero-quality-capacity-us-central1-v1',
          quotaId: 'NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion',
          preferredValue: 16,
          grantedValue: input.l4,
          reconciling: false,
          exactCloudQuotaPreferenceAndQuotaInfoReread: true,
          noZonalRedundancyFallbackCapacityExplicitlyAccepted: true,
          gpuJobStarted: false,
          customerCreditsMutated: false,
          observedAt: at,
          expiresAt,
        })
      },
    },
    repository: createCanonicalSam31PrivateQualificationCapacityRepository({
      objectPort: memoryObjectPort(new Map()),
    }),
    now: () => at,
  }).observeAndPersist({
    observationId: `sam31-private-capacity-${input.a100}-${input.l4}`,
  })
}

function memoryObjectPort(storage: Map<string, Buffer>):
CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      if (storage.has(input.objectPath)) return 'already_exists'
      storage.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = storage.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}
