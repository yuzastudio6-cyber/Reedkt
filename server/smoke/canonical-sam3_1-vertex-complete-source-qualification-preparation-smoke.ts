import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSam31VertexServingQualificationCandidateSchema,
} from '../services/canonical-sam3_1-vertex-serving-qualification-candidate'
import {
  assertCanonicalSam31VertexCompleteSourceChunkQualificationAdmission,
  assertCanonicalSam31VertexCompleteSourceQualificationPreparation,
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRef,
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRepository,
  createCanonicalSam31VertexCompleteSourceQualificationPreparationService,
} from '../services/canonical-sam3_1-vertex-complete-source-qualification-preparation-service'
import {
  createCanonicalSam31EightMinuteQualificationSourceRepository,
} from '../services/canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalSam31GpuPrivateInputStagingEvidence,
  type CanonicalSam31GpuPrivateInputStagingPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import { qualifiedSupplyChain } from
  './canonical-sam3_1-cloud-image-supply-chain-build-smoke'
import {
  admission as parentAdmission,
  rateAuthority as a100Rate,
} from
  './canonical-sam3_1-private-complete-source-qualification-admission-owner-smoke'
import {
  plan,
  preparation as sourcePreparation,
} from './canonical-sam3_1-eight-minute-source-preparation-terminal-owner-smoke'
import { release as sourceCheckpointRelease } from
  './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner-smoke'
import { l4Rate as sourceL4Rate } from
  './canonical-sam3_1-vertex-serving-qualification-preparation-smoke'

const NOW = '2026-08-13T16:12:00.000Z'
const objects = new Map<string, Buffer>()
const objectPort = memoryObjectPort(objects)
const sourceRepository =
  createCanonicalSam31EightMinuteQualificationSourceRepository({
    objectPort,
    prefix: 'private/smoke/sam31-complete-source-source',
  })
await sourceRepository.persistPlanCreateOnly({ plan })
await sourceRepository.persistPreparationCreateOnly({
  preparation: sourcePreparation,
})
export const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort,
  prefix: 'private/smoke/sam31-complete-source-tasks',
})
export const preparationRepository =
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRepository({
    objectPort,
    prefix: 'private/smoke/sam31-complete-source-preparations',
  })
const candidate = buildCandidate()
const l4Rate = currentL4Rate()
const sourceRef = sourceCheckpointRelease.sourceCheckpointQualificationRef
const candidateRef = ref(candidate.candidateId, candidate.candidateHash)
const a100RateRef = ref(a100Rate.rateAuthorityId,
  a100Rate.rateAuthorityHash, a100Rate.rateAuthorityVersion)
const l4RateRef = ref(l4Rate.rateAuthorityId,
  l4Rate.rateAuthorityHash, l4Rate.rateAuthorityVersion)
const parentRef = ref(parentAdmission.admissionId,
  parentAdmission.admissionHash)

const service =
  createCanonicalSam31VertexCompleteSourceQualificationPreparationService({
    parentAdmissionRepository: {
      async reread({ admissionRef }) {
        return sameRef(admissionRef, parentRef)
          ? structuredClone(parentAdmission) : null
      },
    },
    sourceRepository,
    candidateRepository: {
      async persistCreateOnly() { return 'created' },
      async reread({ candidateId }) {
        return candidateId === candidate.candidateId
          ? structuredClone(candidate) : null
      },
    },
    sourceCheckpointReadPort: {
      async rereadQualificationRelease({
        sourceCheckpointQualificationRef,
      }) {
        return sameRef(sourceCheckpointQualificationRef, sourceRef)
          ? structuredClone(sourceCheckpointRelease) : null
      },
    },
    imageSupplyChainReadPort: {
      async rereadQualifiedRelease({ releaseRef }) {
        return sameRef(releaseRef, parentAdmission.imageSupplyChainReleaseRef)
          ? structuredClone(qualifiedSupplyChain) : null
      },
    },
    a100ServingRateRepository: {
      async reread({ rateAuthorityRef }) {
        return sameRef(rateAuthorityRef, a100RateRef)
          ? structuredClone(a100Rate) : null
      },
    },
    l4RateRepository: {
      async rereadApprovedCurrentRate({ rateAuthorityRef }) {
        return sameRef(rateAuthorityRef, l4RateRef)
          ? structuredClone(l4Rate) : null
      },
    },
    repository: preparationRepository,
    privateInputStagingPortFactory: ({ chunk }) =>
      fakeStagingPort(chunk.chunkOrdinal),
    taskStore,
    now: () => NOW,
  })

const request = {
  parentQualificationAdmissionRef: parentRef,
  qualificationCandidateRef: candidateRef,
  sourceCheckpointQualificationRef: sourceRef,
  currentA100ServingRateAuthorityRef: a100RateRef,
  currentL4FallbackRateAuthorityRef: l4RateRef,
  chunkOrdinal: 1,
}
export const preparation = await service.prepareOne(request)
assert.deepEqual(
  assertCanonicalSam31VertexCompleteSourceQualificationPreparation(
    preparation,
    NOW,
  ),
  preparation,
)
assert.equal(preparation.chunkOrdinal, 1)
assert.equal(preparation.canonicalStartFrameInclusive, 0)
assert.equal(preparation.canonicalEndFrameInclusive, 239)
assert.equal(preparation.decodedFrameCount, 240)
assert.equal(preparation.exactPreparedChunkStagedAndTaskReread, true)
assert.equal(preparation.customerInvocationAuthorized, false)
assert.equal(preparation.runtimeReleaseGranted, false)
assert.equal(preparation.productionAuthorityGranted, false)
assert.match(
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRef(
    preparation,
  ).contentHash,
  /^sha256:[a-f0-9]{64}$/u,
)
export const task = assertCanonicalSam31GpuTaskRecord(
  await taskStore.rereadTask(preparation.invocationId),
)
assert.equal(task.runtimeRequest.sourceMedia.decodedFrameCount, 240)
assert.equal(task.runtimeRequest.sourceMedia.width, 3_840)
assert.equal(task.runtimeRequest.sourceMedia.height, 2_160)
assert.equal(task.runtimeRequest.sourceMedia.selectedStartFrameInclusive, 0)
assert.equal(task.runtimeRequest.sourceMedia.selectedEndFrameInclusive, 239)
assert.equal(
  task.runtimeRequest.sourceMedia.canonicalSourceStartFrameInclusive,
  0,
)
assert.equal(
  task.runtimeRequest.sourceMedia.canonicalSourceEndFrameInclusive,
  239,
)
assert.equal(task.runtimeRequest.dispatch.accelerator, 'nvidia_a100_80gb')
assert.equal(task.runtimeRequest.dispatch.cpuOnlyInferenceAllowed, false)
assert.equal(task.runtimeRequest.settings.gpuAcceleratedDecode, true)
assert.equal(task.runtimeRequest.settings.sourceResolutionPreserved, true)
assert.equal(task.runtimeRequest.settings.quantizationAllowed, false)
assert.equal(task.customerCreditsMutated, false)
assert.equal(task.productionAuthorityGranted, false)

const persisted = [...objects.entries()].find(([path]) =>
  path.endsWith('/record.json'))?.[1]
assert.ok(persisted)
const record = JSON.parse(persisted.toString('utf8')) as {
  admission: unknown
}
const childAdmission =
  assertCanonicalSam31VertexCompleteSourceChunkQualificationAdmission(
    record.admission,
  )
assert.equal(childAdmission.chunkOrdinal, 1)
assert.equal(childAdmission.privateCompleteSourceQualificationOnly, true)
assert.equal(
  childAdmission.finalRuntimeReleaseRequiredBeforeThisQualificationChunk,
  false,
)
assert.equal(childAdmission.maximumCustomerToolCostCredits, 0)
assert.equal(childAdmission.automaticRetryOrFallbackAllowed, false)
assert.equal(childAdmission.substantiveCpuExecutionAllowed, false)

await assert.rejects(service.prepareOne(request), /task is not create-only/u)
await assert.rejects(service.prepareOne({
  ...request,
  chunkOrdinal: 2,
  parentQualificationAdmissionRef: {
    ...parentRef,
    contentHash: `sha256:${'0'.repeat(64)}`,
  },
}), /parent admission is absent/u)
await assert.rejects(service.prepareOne({
  ...request,
  chunkOrdinal: 2,
  qualificationCandidateRef: {
    ...candidateRef,
    contentHash: `sha256:${'1'.repeat(64)}`,
  },
}), /serving_candidate_changed/u)
await assert.rejects(service.prepareOne({
  ...request,
  chunkOrdinal: 50,
}))
assert.throws(() =>
  assertCanonicalSam31VertexCompleteSourceQualificationPreparation({
    ...preparation,
    customerInvocationAuthorized: true,
  }))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-complete-source-qualification-preparation',
  checks: 35,
  chunkOrdinal: preparation.chunkOrdinal,
  exactPreparedChunkStagedAndTaskReread:
    preparation.exactPreparedChunkStagedAndTaskReread,
  a100GpuInferenceAndNvdecRequired: true,
  finalRuntimeReleaseRequiredBeforeThisQualificationChunk: false,
  automaticRetryOrFallbackAllowed: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function buildCandidate() {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-serving-qualification-candidate-v2' as const,
    source:
      'canonical_server_vertex_serving_pre_release_qualification_owner' as const,
    candidateId: 'sam31-a100-complete-source-candidate-smoke',
    deploymentProfileRef: ref('deployment-profile'),
    modelVersionRolloutRef: ref('model-version-rollout'),
    endpointDeploymentRef: ref('endpoint-deployment'),
    exactDeploymentObservationRef: ref('exact-deployment'),
    readinessProbeRef: ref('readiness-probe'),
    imageSupplyChainReleaseRef: parentAdmission.imageSupplyChainReleaseRef,
    immutableImageDigest: qualifiedSupplyChain.immutableImageDigest,
    endpointResourceName:
      'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const,
    deployedModelId: '3101000004' as const,
    modelVersionId: '2' as const,
    routeId: 'a100_80gb_heavy_primary' as const,
    executionTarget:
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra' as const,
    machineType: 'a2-ultragpu-1g' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    minimumReplicaCount: 0 as const,
    maximumReplicaCount: 1 as const,
    exactDeploymentAndDedicatedRouteReread: true as const,
    exactModelVersionRolloutReread: true as const,
    exactNonCustomerReadinessProbeReread: true as const,
    readyForPrivateQualificationInvocation: true as const,
    readyForCustomerInvocation: false as const,
    runtimeReleaseGranted: false as const,
    customerInvocationStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: '2026-08-13T16:11:30.000Z',
    expiresAt: '2026-08-13T16:20:00.000Z',
  }
  return canonicalSam31VertexServingQualificationCandidateSchema.parse({
    ...payload,
    candidateHash: sha256AuthorityValue(payload),
  })
}

function currentL4Rate() {
  const payload: Partial<typeof sourceL4Rate> = structuredClone(sourceL4Rate)
  delete payload.rateAuthorityHash
  const current = {
    ...payload,
    rateAuthorityId: 'l4-rate-current-for-complete-source-smoke',
    components: sourceL4Rate.components.map((component) => ({
      ...component,
      currentPriceObservedAt: '2026-08-13T16:10:59.000Z',
    })),
    pricingReadStartedAt: '2026-08-13T16:10:58.000Z',
    pricingReadFinishedAt: '2026-08-13T16:10:59.000Z',
    observedAt: '2026-08-13T16:10:59.000Z',
    expiresAt: '2026-08-14T16:10:59.000Z',
  }
  return assertCanonicalCurrentGoogleCloudGpuRateAuthority({
    ...current,
    rateAuthorityHash: sha256AuthorityValue(current),
  }, NOW)
}

function fakeStagingPort(
  expectedChunkOrdinal: number,
): CanonicalSam31GpuPrivateInputStagingPort {
  return {
    async stageAndRereadExactMaskProxy(input) {
      const source = input.sourceMedia as {
        finalizedSourceArtifactRef: ReturnType<typeof ref>
        gpuPreparedMaskProxyArtifactRef: ReturnType<typeof ref>
        exactSourceReadEvidenceRef: ReturnType<typeof ref>
        sourceFrameRangeMappingRef: ReturnType<typeof ref>
        proxyPixelGeometryQaRef: ReturnType<typeof ref>
        byteLength: number; sha256: string; width: number; height: number
        decodedFrameCount: number; selectedStartFrameInclusive: number
        selectedEndFrameInclusive: number
      }
      assert.equal(expectedChunkOrdinal, 1)
      const payload = {
        schemaVersion:
          'canonical-sam3_1-gpu-private-input-staging-evidence-v1' as const,
        source: 'canonical_server_sam3_1_private_input_staging_owner' as const,
        evidenceClass: 'canonical_private_reread' as const,
        stagingId: `sam31-input-staging:${input.invocationId}`,
        invocationId: input.invocationId,
        scope: input.scope,
        dispatchAdmissionRef: input.dispatchAdmissionRef,
        executionEnvelopeRef: input.executionEnvelopeRef,
        sourceBindingRef: input.sourceBindingRef,
        finalizedSourceArtifactRef: source.finalizedSourceArtifactRef,
        gpuPreparedMaskProxyArtifactRef:
          source.gpuPreparedMaskProxyArtifactRef,
        exactSourceReadEvidenceRef: source.exactSourceReadEvidenceRef,
        sourceFrameRangeMappingRef: source.sourceFrameRangeMappingRef,
        proxyPixelGeometryQaRef: source.proxyPixelGeometryQaRef,
        privateTaskInputTransportRef: input.privateTaskInputTransportRef,
        privateInvocationObjectRef: {
          id: `staged-source:${input.invocationId}`,
          version: 1,
          contentHash: `sha256:${source.sha256}`,
        },
        contentType: 'video/mp4' as const,
        byteLength: source.byteLength,
        sha256: source.sha256,
        width: source.width,
        height: source.height,
        decodedFrameCount: source.decodedFrameCount,
        selectedStartFrameInclusive: source.selectedStartFrameInclusive,
        selectedEndFrameInclusive: source.selectedEndFrameInclusive,
        storageGeneration: '1',
        storageEtagSha256: sha256AuthorityValue('etag'),
        sourceArtifactOpenedThroughCanonicalReadPort: true as const,
        exactSourceStreamByteLengthAndSha256Verified: true as const,
        targetCreatedWithIfGenerationMatchZero: true as const,
        exactCreatedGenerationMetadataReread: true as const,
        exactCreatedGenerationBytesRereadAndHashed: true as const,
        sourceAndTargetBytesIdentical: true as const,
        taskAndSourceShareExactInvocationPrefix: true as const,
        callerPathUrlBucketObjectGenerationOrBytesAccepted: false as const,
        signedUrlOrPublicObjectUsed: false as const,
        sourceOrTargetMutationAllowed: false as const,
        runtimeDownloadAllowed: false as const,
        customerCreditsMutated: false as const,
        qaApproved: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
        stagedAt: input.stagedAt,
      }
      return assertCanonicalSam31GpuPrivateInputStagingEvidence({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
    },
  }
}

function ref(id: string, hash = sha256AuthorityValue(id), version = 1) {
  return {
    id,
    version,
    contentHash: (hash.startsWith('sha256:')
      ? hash : `sha256:${hash}`) as `sha256:${string}`,
  }
}

function sameRef(
  left: { readonly id: string; readonly version: number;
    readonly contentHash: string },
  right: { readonly id: string; readonly version: number;
    readonly contentHash: string },
) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
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
      const value = storage.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}
