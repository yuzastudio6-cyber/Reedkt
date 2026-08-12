import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  sealCanonicalSam31CurrentA100CustomerDispatchReadiness,
} from '../services/canonical-sam3_1-current-a100-customer-dispatch-readiness'
import {
  type CanonicalAtomicCurrentJsonPointerPort,
  createCanonicalSam31CurrentA100CustomerDispatchReadinessRepository,
} from '../services/canonical-sam3_1-current-a100-customer-dispatch-readiness-repository'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const observedAt = '2026-08-12T23:50:00.000Z'
const expiresAt = '2026-08-13T00:05:00.000Z'
const runtimeReleaseRef = ref('sam31-a100-endpoint-release', 'release')
const rateAuthorityRef = ref('sam31-a100-endpoint-rate', 'rate')
const readiness = sealCanonicalSam31CurrentA100CustomerDispatchReadiness({
  schemaVersion:
    'canonical-sam3_1-current-a100-customer-dispatch-readiness-v1',
  source:
    'canonical_server_sam31_current_a100_customer_dispatch_readiness_owner',
  evidenceClass: 'canonical_private_reread',
  status: 'ready_for_private_customer_dispatch',
  readinessId: 'sam31-a100-current-readiness-repository-smoke',
  routeId: 'a100_80gb_heavy_primary',
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.track_and_segment_video.v1',
  executionTarget:
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  endpointResourceName:
    'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
  deployedModelId: '3101000004',
  modelVersionId: '2',
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
  maximumReplicaCount: 16,
  maximumConcurrentInvocations: 16,
  minimumReplicaCount: 0,
  thirtyRunQualificationCount: 30,
  completeEightMinuteSourceRunCount: 5,
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

const objectPort = memoryObjectPort()
const currentPointerPort = memoryAtomicPointerPort()
const repository =
  createCanonicalSam31CurrentA100CustomerDispatchReadinessRepository({
    objectPort,
    currentPointerPort,
  })
const readinessRef = await repository.persistCurrentCreateOnly({ readiness })
assert.equal(readinessRef.id, readiness.readinessId)
assert.equal(readinessRef.contentHash, `sha256:${readiness.readinessHash}`)
assert.deepEqual(await repository.rereadExact({
  readinessRef,
  at: observedAt,
}), readiness)
assert.deepEqual(await repository.rereadCurrent({
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.track_and_segment_video.v1',
  runtimeReleaseRef,
  rateAuthorityRef,
  at: '2026-08-13T00:00:00.000Z',
}), readiness)
assert.equal(await repository.rereadCurrent({
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.track_and_segment_video.v1',
  runtimeReleaseRef: ref('crossed-release', 'crossed-release'),
  rateAuthorityRef,
  at: '2026-08-13T00:00:00.000Z',
}), null)
assert.equal(await repository.rereadExact({
  readinessRef: ref('missing-readiness', 'missing-readiness'),
  at: observedAt,
}), null)
await repository.persistCurrentCreateOnly({ readiness })

const { readinessHash: _readinessHash, ...readinessPayload } = readiness
void _readinessHash
const refreshedReadiness = sealCanonicalSam31CurrentA100CustomerDispatchReadiness({
  ...readinessPayload,
  readinessId: 'sam31-a100-current-readiness-repository-smoke-refresh',
  observedAt: '2026-08-12T23:55:00.000Z',
  expiresAt: '2026-08-13T00:10:00.000Z',
})
await repository.persistCurrentCreateOnly({ readiness: refreshedReadiness })
assert.deepEqual(await repository.rereadCurrent({
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.track_and_segment_video.v1',
  runtimeReleaseRef,
  rateAuthorityRef,
  at: '2026-08-13T00:00:00.000Z',
}), refreshedReadiness)
await assert.rejects(() => repository.persistCurrentCreateOnly({ readiness }),
  /older_readiness_cannot_replace_current/u)

const contractOnly = sealCanonicalSam31CurrentA100CustomerDispatchReadiness({
  ...readinessPayload,
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
await assert.rejects(() => repository.persistCurrentCreateOnly({
  readiness: contractOnly,
}), /Only current qualified A100 readiness/u)

await assert.rejects(() => repository.rereadExact({
  readinessRef,
  at: expiresAt,
}), /invalid or stale/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-current-a100-customer-dispatch-readiness-repository',
  checks: 24,
  createOnlyPersistenceAndExactReread: true,
  atomicCurrentPointerRefreshWithinSameDay: true,
  olderConcurrentPublisherRejected: true,
  runtimeAndRateScopedLookup: true,
  crossMidnightValidityLookup: true,
  contractOnlyReadinessPublishable: false,
  staleReadinessAccepted: false,
  callerSelfAttestedReadinessAccepted: false,
  cloudGpuDispatchStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const records = new Map<string, Buffer>()
  return Object.freeze({
    async createOnly(input: {
      readonly objectPath: string
      readonly body: Buffer
      readonly contentSha256: string
    }) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const existing = records.get(input.objectPath)
      if (existing) return 'already_exists' as const
      records.set(input.objectPath, Buffer.from(input.body))
      return 'created' as const
    },
    async readExact(objectPath: string) {
      const value = records.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  })
}

function memoryAtomicPointerPort(): CanonicalAtomicCurrentJsonPointerPort {
  const records = new Map<string, Buffer>()
  return Object.freeze({
    async compareAndSwap(input: {
      readonly objectPath: string
      readonly expectedContentSha256: string | null
      readonly body: Buffer
      readonly contentSha256: string
    }) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const existing = records.get(input.objectPath)
      const existingHash = existing
        ? createHash('sha256').update(existing).digest('hex')
        : null
      if (existingHash !== input.expectedContentSha256) {
        return 'raced' as const
      }
      records.set(input.objectPath, Buffer.from(input.body))
      return 'replaced' as const
    },
    async readExact(objectPath: string) {
      const value = records.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  })
}

function ref(id: string, seed: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(seed)}`,
  }
}
