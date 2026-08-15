import assert from 'node:assert/strict'

import {
  createCanonicalSam31GpuRuntimeReleaseReadinessObserver,
} from '../services/canonical-sam3_1-gpu-runtime-release-readiness-observer'
import {
  buildCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationComponentRef,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  canonicalSam31GpuRuntimeQualificationComponentEvidenceObjectPath,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import { stableAuthorityStringify } from '../services/private-edit-authority-store'
import {
  canonicalDeterministic,
  canonicalDriver,
  canonicalPerformance,
  canonicalQuality,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'

const components = [
  canonicalDriver,
  canonicalDeterministic,
  canonicalPerformance,
  canonicalQuality,
] as const
const records = components.map((component) => Object.freeze({
  objectPath:
    canonicalSam31GpuRuntimeQualificationComponentEvidenceObjectPath({
      componentEvidence: component,
    }),
  body: Buffer.from(stableAuthorityStringify(component), 'utf8'),
}))
const request = {
  routeId: canonicalDriver.route.routeId,
  qualificationId: canonicalDriver.qualificationId,
  immutableImageDigest: canonicalDriver.immutableImageDigest,
  componentEvidenceRefs: {
    driverAndCudaRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(canonicalDriver),
    deterministicRunSetRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(
        canonicalDeterministic,
      ),
    eightMinutePerformanceRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(canonicalPerformance),
    independentTemporalQualityRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(canonicalQuality),
  },
}

const ready = await observer(records).observe(request)
assert.equal(ready.disposition, 'ready_for_release_publication_request')
assert.equal(ready.releasePublisherMayBeInvoked, true)
assert.equal(ready.validatedComponentRecordCount, 4)
assert.deepEqual(ready.blockers, [])
assert.deepEqual(ready.componentStatuses.map((status) => status.status), [
  'ready', 'ready', 'ready', 'ready',
])
assert.equal(ready.gpuJobDispatched, false)
assert.equal(ready.customerCreditsMutated, false)
assert.equal(ready.runtimeReleaseGranted, false)
assert.equal(ready.productionAuthorityGranted, false)
assert.equal(ready.exactExpectedComponentRefsAppliedBeforeReadiness, true)

const historicalDeterministicDraft =
  buildCanonicalSam31GpuRuntimeQualificationComponentEvidence({
    ...withoutHash(canonicalDeterministic),
    componentId: 'historical-nondeterministic-draft',
  })
const historicalRecord = Object.freeze({
  objectPath:
    canonicalSam31GpuRuntimeQualificationComponentEvidenceObjectPath({
      componentEvidence: historicalDeterministicDraft,
    }),
  body: Buffer.from(
    stableAuthorityStringify(historicalDeterministicDraft),
    'utf8',
  ),
})
const readyWithHistoricalDraft = await observer([
  ...records,
  historicalRecord,
]).observe(request)
assert.equal(readyWithHistoricalDraft.releasePublisherMayBeInvoked, true)
assert.deepEqual(readyWithHistoricalDraft.blockers, [])

const unselected = await observer(records).observe({
  ...request,
  componentEvidenceRefs: {
    ...request.componentEvidenceRefs,
    deterministicRunSetRef: null,
  },
})
assert.equal(unselected.releasePublisherMayBeInvoked, false)
assert.deepEqual(unselected.blockers, [
  'missing_expected_ref_deterministic_run_set',
])

const missing = await observer(records.slice(0, 1)).observe(request)
assert.equal(missing.disposition,
  'blocked_missing_or_ambiguous_components')
assert.equal(missing.releasePublisherMayBeInvoked, false)
assert.deepEqual(missing.blockers, [
  'missing_deterministic_run_set',
  'missing_eight_minute_performance',
  'missing_independent_temporal_quality',
])

const ambiguous = await observer([
  ...records,
  records[1],
]).observe(request)
assert.equal(ambiguous.releasePublisherMayBeInvoked, false)
assert.deepEqual(ambiguous.blockers, ['ambiguous_deterministic_run_set'])

const crossedRoute = await observer(records).observe({
  ...request,
  routeId: 'l4_heavy_fallback',
})
assert.equal(crossedRoute.releasePublisherMayBeInvoked, false)
assert.equal(crossedRoute.blockers.length, 4)

await assert.rejects(
  observer([{ ...records[0], objectPath: `${records[0].objectPath}.moved` }])
    .observe(request),
  /body_or_object_path_noncanonical/u,
)
await assert.rejects(
  observer([{ ...records[0], body: Buffer.from(
    JSON.stringify(canonicalDriver, null, 2),
  ) }]).observe(request),
  /body_or_object_path_noncanonical/u,
)
await assert.rejects(
  observer([{ ...records[0], body: Buffer.from('{bad-json', 'utf8') }])
    .observe(request),
  /component_record_json_invalid/u,
)
await assert.rejects(
  observer(Array.from({ length: 257 }, () => records[0])).observe(request),
  /component_index_bound_exceeded/u,
)
await assert.rejects(
  observer(records).observe({ ...request, callerReady: true }),
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-release-readiness-observer',
  checks: 33,
  exactCanonicalComponentKinds: components.length,
  ambiguousCandidateRejected: true,
  unrelatedHistoricalDraftIgnoredAfterExactRefSelection: true,
  unselectedComponentRefCannotAuthorizePublication: true,
  staleOrCrossRouteCandidateRejected: true,
  callerReadinessAccepted: false,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function observer(recordsToReturn: readonly typeof records[number][]) {
  return createCanonicalSam31GpuRuntimeReleaseReadinessObserver({
    componentIndexReadPort: {
      async listComponentRecords() {
        return recordsToReturn
      },
    },
  })
}

function withoutHash<T extends { readonly componentHash: string }>(
  component: T,
): Omit<T, 'componentHash'> {
  const clone = { ...component }
  delete (clone as { componentHash?: string }).componentHash
  return clone
}
