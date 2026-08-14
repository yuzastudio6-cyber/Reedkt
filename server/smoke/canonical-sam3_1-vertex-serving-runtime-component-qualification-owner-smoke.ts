import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexServingRuntimeComponentEvidence,
  canonicalSam31VertexServingRuntimeComponentRef,
  createCanonicalSam31VertexServingRuntimeComponentOwner,
  createCanonicalSam31VertexServingRuntimeComponentRepository,
} from '../services/canonical-sam3_1-vertex-serving-runtime-component-qualification-owner'
import {
  assertCanonicalSam31VertexServingThirtyRunQualification,
} from '../services/canonical-sam3_1-vertex-serving-thirty-run-qualification-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import { qualifiedSupplyChain } from
  './canonical-sam3_1-cloud-image-supply-chain-build-smoke'
import { preparation, task } from
  './canonical-sam3_1-vertex-serving-qualification-preparation-smoke'
import { response } from
  './canonical-sam3_1-vertex-serving-qualification-output-smoke'

const SOURCE_SET_ID = 'sam31-vertex-serving-component-source-smoke'
const TARGET_QUALIFICATION_ID =
  'sam31-canonical-a100-endpoint-runtime-qualification'
const COMPILED_AT = '2026-08-12T15:00:00.000Z'
const RECORDED_AT = '2026-08-13T15:00:00.000Z'
const sourceReceipt = buildSourceReceipt()
const sourceRef = ref(sourceReceipt.qualificationSetId,
  sourceReceipt.receiptHash)
const records = new Map<string, Buffer>()
const repository =
  createCanonicalSam31VertexServingRuntimeComponentRepository({
    objectPort: memoryObjectPort(records),
    prefix: 'private/smoke/sam31-vertex-serving-runtime-components',
  })
const owner = createCanonicalSam31VertexServingRuntimeComponentOwner({
  readPort: {
    async rereadThirtyRunQualification({ qualificationSetId }) {
      return qualificationSetId === SOURCE_SET_ID
        ? structuredClone(sourceReceipt) : null
    },
    async rereadFirstRunTask({ invocationId }) {
      return invocationId === task.invocationId
        ? structuredClone(task) : null
    },
    async rereadFirstRunResponse({ invocationId }) {
      return invocationId === task.invocationId
        ? structuredClone(response) : null
    },
  },
  repository,
  now: () => RECORDED_AT,
})

const request = {
  targetQualificationId: TARGET_QUALIFICATION_ID,
  sourceThirtyRunQualificationRef: sourceRef,
  driverComponentId: 'sam31-current-a100-serving-driver-smoke',
  deterministicComponentId:
    'sam31-current-a100-serving-deterministic-smoke',
}
const compiled = await owner.compileAndPersist(request)
export const vertexServingDriverComponent = compiled.driverAndCuda
export const vertexServingDeterministicComponent = compiled.deterministicRunSet

assert.equal(vertexServingDriverComponent.componentKind, 'driver_and_cuda')
assert.equal(vertexServingDriverComponent.immutableImageDigest,
  qualifiedSupplyChain.immutableImageDigest)
assert.equal(vertexServingDriverComponent.route.executionTarget,
  'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra')
assert.equal(vertexServingDriverComponent.payload
  .exactFirstRunTaskAndRuntimeResponseReread, true)
assert.equal(vertexServingDeterministicComponent.componentKind,
  'deterministic_run_set')
assert.equal(vertexServingDeterministicComponent.payload
  .perRunScaleToZeroClaimed, false)
assert.equal(vertexServingDeterministicComponent.payload
  .separateFreshScaleFromZeroReadinessRequiredBeforeDispatch, true)
assert.equal(vertexServingDeterministicComponent.payload
  .deterministicRuns.length, 30)
assert.equal(records.size, 2)
assert.deepEqual(await owner.compileAndPersist(request), compiled)
assert.equal(records.size, 2)
assert.deepEqual(
  assertCanonicalSam31VertexServingRuntimeComponentEvidence(
    vertexServingDriverComponent,
  ),
  vertexServingDriverComponent,
)
assert.deepEqual(await repository.reread({
  componentRef: canonicalSam31VertexServingRuntimeComponentRef(
    vertexServingDeterministicComponent,
  ),
}), vertexServingDeterministicComponent)

await assert.rejects(owner.compileAndPersist({
  ...request,
  sourceThirtyRunQualificationRef: {
    ...sourceRef,
    contentHash: `sha256:${'0'.repeat(64)}`,
  },
}))
await assert.rejects(createCanonicalSam31VertexServingRuntimeComponentOwner({
  readPort: {
    async rereadThirtyRunQualification() { return sourceReceipt },
    async rereadFirstRunTask() { return task },
    async rereadFirstRunResponse() {
      const changed = structuredClone(response)
      changed.gpuEvidence!.cpuOnlyInferenceUsed = true
      return changed
    },
  },
  repository: createCanonicalSam31VertexServingRuntimeComponentRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/sam31-vertex-serving-rejected-components',
  }),
  now: () => RECORDED_AT,
}).compileAndPersist(request))
const tampered = structuredClone(vertexServingDeterministicComponent)
tampered.payload.perRunScaleToZeroClaimed = true as never
assert.throws(() =>
  assertCanonicalSam31VertexServingRuntimeComponentEvidence(tampered))

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-vertex-serving-runtime-component-qualification-owner',
  checks: 26,
  sourceThirtyRunCount: 30,
  currentImageMatched: true,
  dedicatedEndpointPerRunScaleToZeroClaimed: false,
  freshScaleFromZeroReadinessRequiredBeforeDispatch: true,
  callerDriverOrCudaClaimAccepted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function buildSourceReceipt() {
  const semanticDigest = '4'.repeat(64)
  const responseHash = createHash('sha256')
    .update(canonicalSam31GpuWireStringify(response), 'utf8')
    .digest('hex')
  const deterministicRuns = Array.from({ length: 30 }, (_, index) => {
    const runOrdinal = index + 1
    const invocationId = runOrdinal === 1
      ? task.invocationId
      : `sam31-a100-qualification:${preparation.qualificationId}`
        + `.run-${String(runOrdinal).padStart(2, '0')}.execution`
    return {
      runOrdinal,
      invocationId,
      qualificationResultRef: ref(
        `sam31-vertex-qualification-result:${invocationId}`,
        digit(index + 1),
      ),
      qualificationOutputRef: ref(
        `sam31-vertex-qualification-output:${invocationId}`,
        digit(index + 31),
      ),
      taskRef: runOrdinal === 1
        ? ref(task.taskId, task.taskRecordHash)
        : ref(`sam31-task:${invocationId}`, digit(index + 61)),
      runtimeResponseRef: runOrdinal === 1
        ? ref(`sam31-gpu-response:${invocationId}`, responseHash)
        : ref(`sam31-gpu-response:${invocationId}`, digit(index + 91)),
      manifestRef: runOrdinal === 1
        ? response.outputSummary!.manifestRef
        : ref(`manifest:${invocationId}`, digit(index + 121)),
      privateOutputRereadEvidenceRef: ref(
        `sam31-private-output-reread:response:${invocationId}`,
        digit(index + 151),
      ),
      semanticMaskSetDigestSha256: semanticDigest,
      providerRoundTripDurationMilliseconds: 90_000 + runOrdinal,
      terminalEvidenceMode:
        'provider_prediction_and_private_response' as const,
    }
  })
  const performanceRuns = deterministicRuns.map((run, index) => ({
    measurementOrdinal: index + 1,
    sourceRunOrdinal: index + 1,
    replacementForRecoveredRun: false,
    invocationId: run.invocationId,
    qualificationResultRef: run.qualificationResultRef,
    qualificationOutputRef: run.qualificationOutputRef,
    durationMilliseconds: run.providerRoundTripDurationMilliseconds,
  }))
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-serving-thirty-run-qualification-v2' as const,
    source:
      'canonical_server_sam3_1_vertex_serving_thirty_run_qualification_owner' as const,
    evidenceClass:
      'canonical_private_exact_output_and_prediction_reread' as const,
    status: 'qualified_for_l4_quality_and_performance_comparison' as const,
    qualificationSetId: SOURCE_SET_ID,
    deterministicQualificationId: preparation.qualificationId,
    latencyReplacementQualificationId: null,
    routeId: 'a100_80gb_heavy_primary' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    immutableImageDigest: qualifiedSupplyChain.immutableImageDigest,
    deterministicRuns,
    performanceRuns,
    semanticMaskSetDigestSha256: semanticDigest,
    deterministicOutputRunCount: 30 as const,
    measuredPerformanceRunCount: 30 as const,
    recoveredOutputRunCount: 0 as const,
    propagatedFrameCountPerRun: 200 as const,
    maskFileCountPerRun: 400 as const,
    exactMaskFileCountRereadAcrossDeterministicRuns: 12_000 as const,
    nearestRankP95Milliseconds: 90_029,
    minimumMeasuredMilliseconds: 90_001,
    maximumMeasuredMilliseconds: 90_030,
    maximumAllowedP95Milliseconds: 480_000 as const,
    allThirtyDeterministicOutputsSemanticallyIdentical: true as const,
    allThirtyPerformanceMeasurementsUseExactPredictionReceipts: true as const,
    everyPerformanceRunUsesItsOwnPredictionReceipt: true as const,
    recoveredRunExcludedFromLatencyAndReplacedExplicitly: false as const,
    exactTaskResponseOutputManifestAndMaskEvidenceReread: true as const,
    customerInvocationAuthorized: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    l4FallbackQualified: false as const,
    runtimeReleaseGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    compiledAt: COMPILED_AT,
  }
  return assertCanonicalSam31VertexServingThirtyRunQualification({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

function ref(id: string, hash: string) {
  return { id, version: 1 as const, contentHash: `sha256:${hash}` as const }
}

function digit(value: number): string {
  return value.toString(16).padStart(64, '0').slice(-64)
}

function memoryObjectPort(
  storage: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const current = storage.get(input.objectPath)
      if (current) {
        assert.deepEqual(current, input.body)
        return 'already_exists'
      }
      storage.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const current = storage.get(objectPath)
      return current ? Buffer.from(current) : null
    },
  }
}
