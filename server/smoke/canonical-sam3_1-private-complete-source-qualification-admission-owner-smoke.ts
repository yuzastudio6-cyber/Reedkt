import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31PrivateCompleteSourceQualificationAdmission,
  canonicalSam31PrivateCompleteSourceQualificationAdmissionRef,
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionOwner,
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository,
} from '../services/canonical-sam3_1-private-complete-source-qualification-admission-owner'
import {
  assertCanonicalSam31PrivateQualificationCapacityObservation,
} from '../services/canonical-sam3_1-private-qualification-capacity-owner'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  capacityAwareAuthority as sourceRateAuthority,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-smoke'
import {
  exact as sourcePreparationTerminal,
  plan,
  preparation,
} from './canonical-sam3_1-eight-minute-source-preparation-terminal-owner-smoke'
import {
  endpointCanonicalDriver as driverComponent,
  endpointCanonicalDeterministic as deterministicComponent,
  endpointCanonicalPerformance as performanceComponent,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'
import {
  qualifiedSupplyChain,
} from './canonical-sam3_1-cloud-image-supply-chain-build-smoke'
import {
  current as sourceCapacity,
} from './canonical-sam3_1-private-qualification-capacity-owner-smoke'
import {
  buildCanonicalSam31VertexServingRuntimeComponentEvidence,
} from '../services/canonical-sam3_1-vertex-serving-runtime-component-qualification-owner'

const admittedAt = '2026-08-13T16:11:00.000Z'
const expiresAt = '2026-08-13T16:20:00.000Z'
if (!sourcePreparationTerminal) {
  throw new Error('Source preparation terminal fixture is absent.')
}

const capacity = currentCapacity()
export const rateAuthority = currentRateAuthority()
const owner =
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionOwner()
const [vertexServingDriverComponent, vertexServingDeterministicComponent] =
  vertexServingComponents()
const request = {
  admissionId: 'sam31-private-complete-source-a100-run-1-admission',
  qualificationId: driverComponent.qualificationId,
  runOrdinal: 1,
  routeId: 'a100_80gb_heavy_primary' as const,
  qualificationSourcePlan: plan,
  sourcePreparation: preparation,
  sourcePreparationTerminal,
  privateQualificationCapacity: capacity,
  driverAndCudaComponent: driverComponent,
  deterministicRunSetComponent: deterministicComponent,
  imageSupplyChainRelease: qualifiedSupplyChain,
  accountEffectiveRateAuthority: rateAuthority,
  admittedAt,
  expiresAt,
}

export const admission = owner.admit(request)
assert.equal(admission.status,
  'ready_for_private_qualification_execution_only')
assert.equal(admission.qualificationExecutionAuthorized, true)
assert.equal(
  admission.finalRuntimeReleaseRequiredBeforeQualificationExecution,
  false,
)
assert.equal(admission.finalRuntimeReleaseMayConsumeThisAdmission, false)
assert.equal(admission.completeSourcePerformanceEvidencePending, true)
assert.equal(admission.independentTemporalQualityEvidencePending, true)
assert.equal(admission.runtimeReleaseGranted, false)
assert.equal(admission.trackAllAdmissionGranted, false)
assert.equal(admission.minimumIdleGpuInstances, 0)
assert.equal(admission.substantiveCpuExecutionAllowed, false)
assert.equal(admission.sourceResolutionReductionAllowed, false)
assert.equal(admission.automaticRetryOrFallbackAllowed, false)
assert.equal(admission.maximumCustomerToolCostCredits, 0)
assert.equal(admission.customerCreditsMutated, false)
assert.equal(admission.customerOrPublicDispatchAuthorized, false)
assert.equal(admission.productionAuthorityGranted, false)

const exactVertexServingAdmission = owner.admit({
  ...request,
  admissionId: 'sam31-private-complete-source-a100-run-1-serving-admission',
  driverAndCudaComponent: vertexServingDriverComponent,
  deterministicRunSetComponent: vertexServingDeterministicComponent,
})
assert.equal(exactVertexServingAdmission.routeId,
  'a100_80gb_heavy_primary')
assert.deepEqual(exactVertexServingAdmission.driverAndCudaComponentRef,
  canonicalVertexComponentRef(vertexServingDriverComponent))
assert.deepEqual(
  exactVertexServingAdmission.deterministicRunSetComponentRef,
  canonicalVertexComponentRef(vertexServingDeterministicComponent),
)

const objects = new Map<string, Buffer>()
const repository =
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/sam31-complete-source-qualification-admissions',
  })
assert.equal(await repository.persistCreateOnly({ admission }), 'created')
assert.equal(await repository.persistCreateOnly({ admission }),
  'identical_replay')
assert.deepEqual(await repository.reread({
  admissionRef:
    canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(admission),
  at: '2026-08-13T16:12:00.000Z',
}), admission)

assert.throws(() => owner.admit({
  ...request,
  deterministicRunSetComponent: performanceComponent,
}), /deterministic_run_set_component_missing/u)
assert.throws(() => owner.admit({
  ...request,
  routeId: 'l4_heavy_fallback',
}), /route_component_or_rate_changed/u)
assert.throws(() => owner.admit({
  ...request,
  expiresAt: '2026-08-13T16:25:31.000Z',
}), /capacity_expires_before_admission/u)
assert.throws(() => owner.admit({
  ...request,
  qualificationId: 'crossed-qualification',
}), /qualification_component_lineage_changed/u)
const changedImage = structuredClone(qualifiedSupplyChain)
changedImage.immutableImageDigest = `sha256:${'0'.repeat(64)}`
assert.throws(() => owner.admit({
  ...request,
  imageSupplyChainRelease: changedImage,
}))
assert.throws(() => assertCanonicalSam31PrivateCompleteSourceQualificationAdmission({
  ...admission,
  admissionHash: '0'.repeat(64),
}), /qualification-only admission changed/u)
assert.throws(() => assertCanonicalSam31PrivateCompleteSourceQualificationAdmission(
  admission,
  expiresAt,
), /qualification-only admission is stale/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-complete-source-qualification-admission-owner',
  checks: 35,
  routeId: admission.routeId,
  exactChunkCount: admission.exactChunkCount,
  qualificationExecutionAuthorized: admission.qualificationExecutionAuthorized,
  finalRuntimeReleaseRequiredBeforeQualificationExecution:
    admission.finalRuntimeReleaseRequiredBeforeQualificationExecution,
  runtimeReleaseGranted: admission.runtimeReleaseGranted,
  trackAllAdmissionGranted: admission.trackAllAdmissionGranted,
  customerCreditsMutated: admission.customerCreditsMutated,
  productionAuthorityGranted: admission.productionAuthorityGranted,
}))

function currentCapacity() {
  const payload: Partial<typeof sourceCapacity> =
    structuredClone(sourceCapacity)
  delete payload.observationHash
  return assertCanonicalSam31PrivateQualificationCapacityObservation({
    ...payload,
    observationId: 'sam31-private-capacity-current-for-a100-run-1',
    observedAt: '2026-08-13T16:10:30.000Z',
    expiresAt: '2026-08-13T16:25:30.000Z',
    observationHash: sha256AuthorityValue({
      ...payload,
      observationId: 'sam31-private-capacity-current-for-a100-run-1',
      observedAt: '2026-08-13T16:10:30.000Z',
      expiresAt: '2026-08-13T16:25:30.000Z',
    }),
  }, admittedAt)
}

function canonicalVertexComponentRef(value: {
  componentId: string
  componentHash: string
}) {
  return {
    id: value.componentId,
    version: 1,
    contentHash: `sha256:${value.componentHash}`,
  }
}

function vertexServingComponents() {
  if (driverComponent.componentKind !== 'driver_and_cuda'
    || deterministicComponent.componentKind !== 'deterministic_run_set') {
    throw new Error('Generic endpoint component fixture changed.')
  }
  const sourceRef = {
    id: 'sam31-vertex-serving-thirty-run-parent-smoke',
    version: 1 as const,
    contentHash: `sha256:${'9'.repeat(64)}` as const,
  }
  const base = {
    schemaVersion:
      'canonical-sam3_1-vertex-serving-runtime-component-evidence-v1' as const,
    ownerVersion:
      'canonical-sam3_1-vertex-serving-runtime-component-owner-v1' as const,
    source:
      'canonical_server_sam3_1_vertex_serving_runtime_component_owner' as const,
    evidenceClass:
      'canonical_private_thirty_run_receipt_and_first_runtime_exact_reread' as const,
    status: 'component_evidence_ready' as const,
    componentVersion: 1 as const,
    qualificationId: driverComponent.qualificationId,
    sourceThirtyRunQualificationRef: sourceRef,
    route: driverComponent.route,
    immutableImageDigest: driverComponent.immutableImageDigest,
    recordedAt: driverComponent.recordedAt,
  }
  const first = deterministicComponent.payload[0]!
  return [
    buildCanonicalSam31VertexServingRuntimeComponentEvidence({
      ...base,
      componentId: 'sam31-vertex-serving-parent-driver-smoke',
      componentKind: 'driver_and_cuda',
      payload: {
        sourceRunOrdinal: 1,
        sourceTaskRef: first.runtimeRequestRef,
        sourceRuntimeResponseRef: first.runtimeResponseObjectRef,
        driverEvidence: driverComponent.payload,
        exactFirstRunTaskAndRuntimeResponseReread: true,
        callerDriverOrCudaClaimAccepted: false,
      },
    }),
    buildCanonicalSam31VertexServingRuntimeComponentEvidence({
      ...base,
      componentId: 'sam31-vertex-serving-parent-deterministic-smoke',
      componentKind: 'deterministic_run_set',
      payload: {
        deterministicRuns: deterministicComponent.payload.map((run) => ({
          runOrdinal: run.runOrdinal,
          invocationId: `sam31-parent-serving-smoke-run-${run.runOrdinal}`,
          qualificationResultRef: run.resultAdmissionRef,
          qualificationOutputRef: run.privateOutputRereadEvidenceRef,
          taskRef: run.runtimeRequestRef,
          runtimeResponseRef: run.runtimeResponseObjectRef,
          manifestRef: {
            id: `sam31-parent-serving-manifest-${run.runOrdinal}`,
            version: 1,
            contentHash: `sha256:${sha256AuthorityValue({
              kind: 'manifest', ordinal: run.runOrdinal,
            })}`,
          },
          privateOutputRereadEvidenceRef: {
            id: `sam31-parent-serving-private-output-${run.runOrdinal}`,
            version: 1,
            contentHash: `sha256:${sha256AuthorityValue({
              kind: 'private-output', ordinal: run.runOrdinal,
            })}`,
          },
          providerRoundTripDurationMilliseconds: 90_000 + run.runOrdinal,
          semanticMaskSetDigestSha256: run.outputMaskSetDigestSha256,
        })),
        deterministicOutputRunCount: 30,
        measuredPerformanceRunCount: 30,
        exactMaskFileCountRereadAcrossDeterministicRuns: 12_000,
        propagatedFrameCountPerRun: 200,
        maskFileCountPerRun: 400,
        allThirtyDeterministicOutputsSemanticallyIdentical: true,
        allThirtyPerformanceMeasurementsUseExactPredictionReceipts: true,
        everyPerformanceRunUsesItsOwnPredictionReceipt: true,
        exactTaskResponseOutputManifestAndMaskEvidenceReread: true,
        dedicatedEndpointMinimumReplicaCount: 0,
        perRunScaleToZeroClaimed: false,
        separateFreshScaleFromZeroReadinessRequiredBeforeDispatch: true,
        automaticRetryOrFallbackAllowed: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      },
    }),
  ] as const
}

function currentRateAuthority() {
  const payload: Partial<typeof sourceRateAuthority> =
    structuredClone(sourceRateAuthority)
  delete payload.rateAuthorityHash
  const currentPayload = {
    ...payload,
    rateAuthorityId: 'vertex-a100-serving-rate:smoke-20260813',
    pricingReadStartedAt: '2026-08-13T16:09:59.000Z',
    pricingReadFinishedAt: '2026-08-13T16:10:00.000Z',
    observedAt: '2026-08-13T16:10:00.000Z',
    expiresAt: '2026-08-14T16:10:00.000Z',
  }
  return assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2({
    ...currentPayload,
    rateAuthorityHash: sha256AuthorityValue(currentPayload),
  }, admittedAt)
}

function memoryObjectPort(
  storage: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
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
