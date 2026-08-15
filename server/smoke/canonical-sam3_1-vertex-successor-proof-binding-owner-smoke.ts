import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  canonicalSam31PrivateCompleteSourceQualificationAdmissionRef,
} from '../services/canonical-sam3_1-private-complete-source-qualification-admission-owner'
import {
  assertCanonicalSam31VertexCompleteSourceQualificationResult,
} from '../services/canonical-sam3_1-vertex-complete-source-qualification-invocation-service'
import {
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRef,
} from '../services/canonical-sam3_1-vertex-complete-source-qualification-preparation-service'
import {
  buildCanonicalSam31VertexServingRuntimeComponentEvidence,
  canonicalSam31VertexServingRuntimeComponentRef,
} from '../services/canonical-sam3_1-vertex-serving-runtime-component-qualification-owner'
import {
  assertCanonicalSam31VertexSuccessorProofBinding,
  createCanonicalSam31VertexSuccessorProofBindingOwner,
  createCanonicalSam31VertexSuccessorProofBindingRepository,
} from '../services/canonical-sam3_1-vertex-successor-proof-binding-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { admission as sourceParent } from
  './canonical-sam3_1-private-complete-source-qualification-admission-owner-smoke'
import { preparation as sourcePreparation } from
  './canonical-sam3_1-vertex-complete-source-qualification-preparation-smoke'

const RECORDED_AT = '2026-08-15T18:00:00.000Z'
const PREDECESSOR_IMAGE =
  'sha256:953a883366f51350933bf4b7911b34e652e4edc30e4e81fdf57e661c675c055f'
const sourceThirtyRunRef = ref(
  'sam31-a100-v6-thirty-qualified-20260815-v1',
  'c3a0351d3542be81f0dd6e4ac821b82db2196485d64c8253b482632fc01d0552',
)
const qualificationId = sourcePreparation.qualificationId
const continuityBase = {
  schemaVersion:
    'canonical-sam3_1-vertex-serving-runtime-component-continuity-evidence-v1' as const,
  ownerVersion:
    'canonical-sam3_1-vertex-serving-runtime-component-continuity-owner-v1' as const,
  source:
    'canonical_server_sam3_1_vertex_serving_runtime_component_continuity_owner' as const,
  evidenceClass:
    'predecessor_thirty_run_exact_reread_plus_qualified_successor_supply_chain_pending_one_complete_source_proof' as const,
  status:
    'successor_component_continuity_ready_for_one_private_proof' as const,
  componentVersion: 2 as const,
  qualificationId,
  sourceThirtyRunQualificationRef: sourceThirtyRunRef,
  route: {
    routeId: 'a100_80gb_heavy_primary' as const,
    gpuProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1' as const,
    runtimeRegion: 'us-central1' as const,
    executionTarget:
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra' as const,
    machineType: 'a2-ultragpu-1g' as const,
    accelerator: 'nvidia_a100_80gb' as const,
  },
  immutableImageDigest: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
  predecessorImmutableImageDigest: PREDECESSOR_IMAGE,
  successorImageSupplyChainReleaseRef: ref('successor-image-release'),
  successorDeploymentProfileRef: ref('successor-deployment-profile'),
  successorModelVersionRolloutRef: ref('successor-model-rollout'),
  sourceAndDependencyClosureRef: ref('successor-source-closure'),
  predecessorThirtyRunEvidenceExactReread: true as const,
  successorSourceAndDependencyClosureExactReread: true as const,
  successorThirtyRunPerformanceClaimed: false as const,
  oneSuccessorCompleteSourceProofRequired: true as const,
  automaticRetryOrFallbackAllowed: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  recordedAt: '2026-08-15T17:00:00.000Z',
}
const driver = buildCanonicalSam31VertexServingRuntimeComponentEvidence({
  ...continuityBase,
  componentId: `${qualificationId}:vertex-serving-driver-and-cuda`,
  componentKind: 'driver_and_cuda',
  payload: {
    predecessorComponentRef: ref('predecessor-driver'),
    predecessorDriverAndCudaEvidenceRetained: true,
    successorDriverAndCudaEvidencePendingOneProof: true,
  },
})
const deterministic =
  buildCanonicalSam31VertexServingRuntimeComponentEvidence({
    ...continuityBase,
    componentId: `${qualificationId}:vertex-serving-deterministic-run-set`,
    componentKind: 'deterministic_run_set',
    payload: {
      predecessorComponentRef: ref('predecessor-deterministic'),
      predecessorDeterministicOutputRunCount: 30,
      predecessorMeasuredPerformanceRunCount: 30,
      predecessorSemanticMaskSetDigestSha256: '4'.repeat(64),
      successorDeterministicAndPerformanceEvidencePendingOneProof: true,
    },
  })
const driverRef = canonicalSam31VertexServingRuntimeComponentRef(driver)
const deterministicRef =
  canonicalSam31VertexServingRuntimeComponentRef(deterministic)

const sourceParentPayload = structuredClone(sourceParent)
Reflect.deleteProperty(sourceParentPayload, 'admissionHash')
const parentPayload = {
  ...structuredClone(sourceParentPayload),
  driverAndCudaComponentRef: driverRef,
  deterministicRunSetComponentRef: deterministicRef,
  immutableImageRef: {
    ...structuredClone(sourceParent.immutableImageRef),
    contentHash: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
  },
  immutableImageDigest: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
}
const parent = {
  ...parentPayload,
  admissionHash: sha256AuthorityValue(parentPayload),
}
const parentRef =
  canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(parent)

const sourcePreparationPayload = structuredClone(sourcePreparation)
Reflect.deleteProperty(sourcePreparationPayload, 'preparationHash')
const preparationPayload = {
  ...structuredClone(sourcePreparationPayload),
  parentQualificationAdmissionRef: parentRef,
}
const preparation = {
  ...preparationPayload,
  preparationHash: sha256AuthorityValue(preparationPayload),
}
const preparationRef =
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRef(
    preparation,
  )
const result = buildResult('completed')

const objects = new Map<string, Buffer>()
const repository = createCanonicalSam31VertexSuccessorProofBindingRepository({
  objectPort: memoryObjectPort(objects),
  prefix: 'private/smoke/sam31-successor-proof-bindings',
})
const currentResult = { value: result as unknown }
const owner = createCanonicalSam31VertexSuccessorProofBindingOwner({
  readPort: {
    async rereadContinuityComponent({ componentRef }) {
      if (sameRef(componentRef, driverRef)) return structuredClone(driver)
      if (sameRef(componentRef, deterministicRef)) {
        return structuredClone(deterministic)
      }
      return null
    },
    async rereadParentAdmission({ admissionRef }) {
      return sameRef(admissionRef, parentRef)
        ? structuredClone(parent) : null
    },
    async rereadPreparation({ invocationId }) {
      return invocationId === preparation.invocationId
        ? structuredClone(preparation) : null
    },
    async rereadTerminalResult({ invocationId }) {
      return invocationId === preparation.invocationId
        ? structuredClone(currentResult.value) : null
    },
  },
  repository,
})
const request = {
  proofBindingId: 'sam31-a100-v8-successor-proof-binding-smoke',
  continuityDriverComponentRef: driverRef,
  continuityDeterministicComponentRef: deterministicRef,
  parentQualificationAdmissionRef: parentRef,
  qualificationPreparationRef: preparationRef,
  invocationId: preparation.invocationId,
  recordedAt: RECORDED_AT,
}

const binding = await owner.bindAndPersist(request)
assert.equal(binding.status,
  'successor_private_4k_proof_accepted_not_full_runtime_release')
assert.equal(binding.immutableImageDigest,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST)
assert.equal(binding.successorSingle4kChunkGpuExecutionVerified, true)
assert.equal(binding.successorDriverAndCudaProofAccepted, true)
assert.equal(binding.successorDeterministicRunSetClaimed, false)
assert.equal(binding.successorThirtyRunPerformanceClaimed, false)
assert.equal(binding.exactEightMinutePerformanceClaimed, false)
assert.equal(binding.independentTemporalQualityClaimed, false)
assert.equal(binding.l4QualityParityClaimedForSuccessorImage, false)
assert.equal(binding.customerInvocationAuthorized, false)
assert.equal(binding.productionAuthorityGranted, false)
assert.equal(objects.size, 1)
assert.deepEqual(await owner.bindAndPersist(request), binding)
assert.equal(objects.size, 1)

const tamperedBinding = structuredClone(binding)
tamperedBinding.exactEightMinutePerformanceClaimed = true as never
assert.throws(() =>
  assertCanonicalSam31VertexSuccessorProofBinding(tamperedBinding))

currentResult.value = buildResult('failed')
await assert.rejects(owner.bindAndPersist({
  ...request,
  proofBindingId: 'sam31-a100-v8-failed-proof-binding-smoke',
}), /successor_proof_lineage_changed/u)
currentResult.value = result

await assert.rejects(owner.bindAndPersist({
  ...request,
  continuityDriverComponentRef: deterministicRef,
}), /successor_proof_lineage_changed/u)

await assert.rejects(owner.bindAndPersist({
  ...request,
  parentQualificationAdmissionRef: {
    ...parentRef,
    contentHash: `sha256:${'0'.repeat(64)}`,
  },
}), /exact_proof_lineage_missing/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-successor-proof-binding-owner',
  checks: 18,
  currentA100Successor4kProofBound: true,
  predecessorThirtyRunEvidenceRetained: true,
  successorThirtyRunPerformanceClaimed: false,
  exactEightMinutePerformanceClaimed: false,
  independentTemporalQualityClaimed: false,
  automaticRetryOrFallbackStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function buildResult(status: 'completed' | 'failed') {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-complete-source-qualification-result-v1' as const,
    source:
      'canonical_server_sam3_1_vertex_serving_qualification_invocation_owner' as const,
    invocationPurpose:
      'private_complete_source_pre_release_qualification' as const,
    qualificationId,
    runOrdinal: preparation.runOrdinal,
    chunkOrdinal: 1,
    invocationId: preparation.invocationId,
    qualificationPreparationRef: preparationRef,
    parentQualificationAdmissionRef: parentRef,
    qualificationCandidateRef: preparation.qualificationCandidateRef,
    preparedChunkArtifactRef: preparation.preparedChunkArtifactRef,
    exactSourceRangeMappingRef: preparation.exactSourceRangeMappingRef,
    canonicalStartFrameInclusive: 0,
    canonicalEndFrameInclusive: 239,
    attemptRef: ref(`${preparation.invocationId}:attempt`),
    callStartRef: ref(`${preparation.invocationId}:call-start`),
    disposition: status,
    runtimeStatus: status,
    runtimeResponseRef: ref(`sam31-gpu-response:${preparation.invocationId}`),
    uploadedObjectCount: 426,
    uploadedByteLength: 6_200_454,
    terminalEvidenceMode:
      'provider_prediction_and_private_response' as const,
    providerCallStarted: true as const,
    providerOutcome: 'executed' as const,
    providerRoundTripDurationMilliseconds: 121_804,
    exactPrivateRuntimeResponseReread: true as const,
    exactVertexPredictionWrapperReread: true as const,
    automaticRetryAllowed: false as const,
    unresolvedOutcomeBlocksRetry: false as const,
    customerInvocationAuthorized: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    runtimeReleaseGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: '2026-08-15T17:30:00.000Z',
  }
  return assertCanonicalSam31VertexCompleteSourceQualificationResult({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function ref(id: string, hash = '1'.repeat(64), version = 1) {
  return {
    id,
    version: version as 1,
    contentHash: `sha256:${hash}` as const,
  }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function memoryObjectPort(
  storage: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const existing = storage.get(input.objectPath)
      if (existing) {
        assert.deepEqual(existing, input.body)
        return 'already_exists'
      }
      storage.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = storage.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}
