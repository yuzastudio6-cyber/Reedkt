import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalCurrentGoogleCloudVertexA100ServingQuotaAuthoritySchema,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-quota-authority'
import {
  canonicalSam31VertexServingQualificationCandidateSchema,
} from '../services/canonical-sam3_1-vertex-serving-qualification-candidate'
import {
  assertCanonicalSam31VertexServingQualificationAdmission,
  assertCanonicalSam31VertexServingQualificationPreparation,
  createCanonicalSam31VertexServingQualificationPreparationRepository,
  createCanonicalSam31VertexServingQualificationPreparationService,
} from '../services/canonical-sam3_1-vertex-serving-qualification-preparation-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
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
import { release as sourceCheckpointRelease } from
  './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner-smoke'
import { authority as a100Rate } from
  './canonical-current-google-cloud-vertex-a100-serving-rate-authority-smoke'

const NOW = '2026-08-11T12:01:00.000Z'
const records = new Map<string, Buffer>()
const objectPort = memoryObjectPort(records)
export const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort,
  prefix: 'private/smoke/sam31-serving-tasks',
})
export const preparationRepository =
  createCanonicalSam31VertexServingQualificationPreparationRepository({
    objectPort,
    prefix: 'private/smoke/sam31-serving-preparations',
  })
const candidate = buildCandidate()
const l4Rate = await buildL4Rate()
const quota = buildQuota()
const sourceRef = sourceCheckpointRelease.sourceCheckpointQualificationRef
const imageRef = {
  id: qualifiedSupplyChain.releaseId,
  version: 1 as const,
  contentHash: `sha256:${qualifiedSupplyChain.releaseHash}` as const,
}
const candidateRef = {
  id: candidate.candidateId,
  version: 1 as const,
  contentHash: `sha256:${candidate.candidateHash}` as const,
}
const a100RateRef = rateRef(a100Rate)
const l4RateRef = rateRef(l4Rate)
const quotaRef = {
  id: quota.quotaAuthorityId,
  version: quota.quotaAuthorityVersion,
  contentHash: `sha256:${quota.authorityHash}` as const,
}

const service =
  createCanonicalSam31VertexServingQualificationPreparationService({
    candidateRepository: {
      async persistCreateOnly() { return 'created' },
      async reread({ candidateId }) {
        return candidateId === candidate.candidateId
          ? structuredClone(candidate) : null
      },
    },
    sourceCheckpointReadPort: {
      async rereadQualificationRelease({ sourceCheckpointQualificationRef }) {
        return sameRef(sourceCheckpointQualificationRef, sourceRef)
          ? structuredClone(sourceCheckpointRelease) : null
      },
    },
    imageSupplyChainReadPort: {
      async rereadQualifiedRelease({ releaseRef }) {
        return sameRef(releaseRef, imageRef)
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
    servingQuotaRepository: {
      async reread({ quotaAuthorityRef }) {
        return sameRef(quotaAuthorityRef, quotaRef)
          ? structuredClone(quota) : null
      },
    },
    repository: preparationRepository,
    privateInputStagingPort: fakeStagingPort(),
    taskStore,
    now: () => NOW,
  })

const request = {
  qualificationId: 'sam31-vertex-serving-thirty-run-qualification-v1',
  runOrdinal: 1,
  qualificationCandidateRef: candidateRef,
  sourceCheckpointQualificationRef: sourceRef,
  imageSupplyChainReleaseRef: imageRef,
  currentA100ServingRateAuthorityRef: a100RateRef,
  currentL4FallbackRateAuthorityRef: l4RateRef,
  currentA100ServingQuotaAuthorityRef: quotaRef,
}
export const preparation = await service.prepareOne(request)
assert.deepEqual(
  assertCanonicalSam31VertexServingQualificationPreparation(preparation, NOW),
  preparation,
)
assert.equal(preparation.readyForOnePrivateServingQualificationInvocation, true)
assert.equal(preparation.customerInvocationAuthorized, false)
assert.equal(preparation.customerCreditsMutated, false)
assert.equal(preparation.runtimeReleaseGranted, false)
assert.equal(preparation.productionAuthorityGranted, false)
const invocationId = preparation.invocationId
export const task = assertCanonicalSam31GpuTaskRecord(
  await taskStore.rereadTask(invocationId),
)
assert.equal(task.runtimeRequest.dispatch.routeRole,
  'a100_80gb_heavy_primary')
assert.equal(task.runtimeRequest.dispatch.accelerator, 'nvidia_a100_80gb')
assert.equal(task.runtimeRequest.dispatch.scaleFromZeroRequired, true)
assert.equal(task.runtimeRequest.dispatch.cpuOnlyInferenceAllowed, false)
assert.equal(task.runtimeRequest.sourceMedia.decodedFrameCount, 200)
assert.equal(task.runtimeRequest.settings.videoDecodeBackend,
  'torchcodec_0_10_cuda_nvdec')
assert.equal(task.runtimeRequest.settings.gpuAcceleratedDecode, true)
assert.equal(task.runtimeRequest.settings.sourceResolutionPreserved, true)
assert.equal(task.runtimeRequest.settings.quantizationAllowed, false)
assert.equal(task.runtimeReleaseRef.contentHash, candidateRef.contentHash)

const storedRecord = [...records.entries()].find(([path]) =>
  path.endsWith('/record.json'))?.[1]
assert.ok(storedRecord)
const decodedRecord = JSON.parse(storedRecord.toString('utf8')) as {
  admission: unknown
}
const admission = assertCanonicalSam31VertexServingQualificationAdmission(
  decodedRecord.admission,
)
assert.equal(admission.executionTarget,
  'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra')
assert.equal(admission.maximumExecutionSeconds, 600)
assert.equal(admission.maximumReservedCustomerToolCostCredits, 0)
assert.equal(admission.accountEffectiveA100ServingAndL4RatesBoundBeforeDispatch,
  true)
assert.equal(admission.privatePreReleaseQualificationOnly, true)

await assert.rejects(service.prepareOne(request), /task is not create-only/u)
await assert.rejects(service.prepareOne({
  ...request,
  runOrdinal: 2,
  qualificationCandidateRef: {
    ...candidateRef,
    contentHash: `sha256:${'f'.repeat(64)}`,
  },
}), /lineage changed/u)
assert.throws(() => assertCanonicalSam31VertexServingQualificationPreparation({
  ...preparation,
  customerInvocationAuthorized: true,
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-qualification-preparation',
  status: 'passed',
  checks: 34,
  exactCandidateDeploymentAndReadinessReread: true,
  exactSourceCheckpointImageQuotaAndRatesReread: true,
  officialTwoHundredFrameProbeStaged: true,
  a100GpuDecodeAndInferenceRequired: true,
  customerInvocationAuthorized: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function buildCandidate() {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-serving-qualification-candidate-v1' as const,
    source:
      'canonical_server_vertex_serving_pre_release_qualification_owner' as const,
    candidateId: 'sam31-a100-serving-candidate-smoke',
    deploymentProfileRef: ref('deployment-profile'),
    modelDeployRequestRef: ref('model-deploy-request'),
    modelDeployObservationRef: ref('model-deploy-observation'),
    endpointDeploymentRef: ref('endpoint-deployment'),
    exactDeploymentObservationRef: ref('exact-deployment'),
    readinessProbeRef: ref('readiness-probe'),
    imageSupplyChainReleaseRef: {
      id: qualifiedSupplyChain.releaseId,
      version: 1,
      contentHash: `sha256:${qualifiedSupplyChain.releaseHash}`,
    },
    immutableImageDigest: qualifiedSupplyChain.immutableImageDigest,
    endpointResourceName:
      'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const,
    deployedModelId: '3101000001' as const,
    routeId: 'a100_80gb_heavy_primary' as const,
    executionTarget:
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra' as const,
    machineType: 'a2-ultragpu-1g' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    minimumReplicaCount: 0 as const,
    maximumReplicaCount: 1 as const,
    exactDeploymentAndDedicatedRouteReread: true as const,
    exactModelDeployRequestAndCompletedObservationReread: true as const,
    exactNonCustomerReadinessProbeReread: true as const,
    readyForPrivateQualificationInvocation: true as const,
    readyForCustomerInvocation: false as const,
    runtimeReleaseGranted: false as const,
    customerInvocationStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: '2026-08-11T12:00:00.000Z',
    expiresAt: '2026-08-11T12:10:00.000Z',
  }
  return canonicalSam31VertexServingQualificationCandidateSchema.parse({
    ...payload,
    candidateHash: sha256AuthorityValue(payload),
  })
}

function buildQuota() {
  const payload = {
    schemaVersion:
      'canonical-current-google-cloud-vertex-a100-serving-quota-authority-v1' as const,
    source:
      'server_owned_current_google_cloud_vertex_a100_serving_quota_reread' as const,
    quotaAuthorityId: 'vertex-a100-serving-quota-smoke',
    quotaAuthorityVersion: 1,
    projectId: 'reeditpro' as const,
    projectNumber: '390722338345' as const,
    service: 'aiplatform.googleapis.com' as const,
    metric:
      'aiplatform.googleapis.com/custom_model_serving_nvidia_a100_80gb_gpus' as const,
    displayName: 'Custom model serving Nvidia A100 80GB GPUs' as const,
    region: 'us-central1' as const,
    limitUnit: '1/{project}/{region}' as const,
    effectiveLimit: 1 as const,
    requiredMaximumReplicaCount: 1 as const,
    producerOverrideValue: 1 as const,
    consumerOverrideValue: -1 as const,
    quotaSnapshotRef: ref('quota-snapshot'),
    observedAt: '2026-08-11T12:00:00.000Z',
    expiresAt: '2026-08-11T13:00:00.000Z',
    maximumAuthorityAgeSeconds: 3_600 as const,
    exactCloudQuotaMetricAndRegionalBucketReread: true as const,
    servingCapacityGranted: true as const,
    callerQuotaMetricRegionOrLimitAccepted: false as const,
    endpointOrGpuJobStarted: false as const,
    walletOrCreditMutationAuthorityGranted: false as const,
    publicDeliveryAuthorityGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return canonicalCurrentGoogleCloudVertexA100ServingQuotaAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

async function buildL4Rate() {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: 'current-rate-l4-heavy-fallback-serving-smoke',
    rateAuthorityVersion: 1,
    routeId: 'l4_heavy_fallback',
    region: 'us-central1',
    readPort: { async readCurrentRouteRate() { return rawL4Observation() } },
  })
}

function rawL4Observation(): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    component('cloud_run_l4_gpu_second', 'gpu_second', 186_700, '1'),
    component('cloud_run_vcpu_second', 'vcpu_second', 18_000, '2'),
    component('cloud_run_memory_gib_second', 'gib_second', 2_000, '3'),
    component('private_object_storage_gib_month', 'gib_month', 20_000_000, '4'),
    component('network_egress_gib', 'gib', 120_000_000, '5'),
    component('object_class_a_per_1000', 'per_1000_operations', 5_000_000, '6'),
    component('object_class_b_per_1000', 'per_1000_operations', 400_000, '7'),
  ] satisfies CanonicalGoogleCloudGpuRateRawObservation['components']
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('l4-billing-scope'),
    pricingReaderConfigurationRef: ref('l4-reader'),
    routeId: 'l4_heavy_fallback' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('l4-price-set'),
    pricingReadStartedAt: '2026-08-11T12:00:00.000Z',
    pricingReadFinishedAt: '2026-08-11T12:00:01.000Z',
  }
  return { ...payload, pricingReadDigestSha256: sha256AuthorityValue(payload) }
}

function component(
  componentClass: CanonicalGoogleCloudGpuRateRawObservation[
    'components'
  ][number]['componentClass'],
  billingUnit: CanonicalGoogleCloudGpuRateRawObservation[
    'components'
  ][number]['billingUnit'],
  price: number,
  suffix: string,
): CanonicalGoogleCloudGpuRateRawObservation['components'][number] {
  const cloudRun = componentClass.startsWith('cloud_run')
  return {
    componentClass,
    cloudServiceName: cloudRun ? 'cloud-run' : 'cloud-storage',
    skuRateBindingId: `binding-${suffix}`,
    skuPriceTerms: [{
      cloudServiceId: cloudRun ? 'cloud-run-service' : 'storage-service',
      skuId: `sku-${suffix}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{ startAmount: '0',
        contractPriceUsdNanos: price }],
      maximumContractPriceUsdNanos: price,
      skuMetadataRef: ref(`sku-metadata-${suffix}`),
      billingAccountPriceRef: ref(`billing-price-${suffix}`),
    }],
    skuDescriptionDigestSha256: sha256AuthorityValue(`sku-${suffix}`),
    skuRegion: 'us-central1',
    billingUnit,
    maximumUsdNanosPerBillingUnit: price,
    currentPriceObservedAt: '2026-08-11T12:00:01.000Z',
    skuRecordRef: ref(`sku-record-${suffix}`),
  }
}

function fakeStagingPort(): CanonicalSam31GpuPrivateInputStagingPort {
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

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      const prior = values.get(input.objectPath)
      if (prior) return 'already_exists'
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function ref(id: string) {
  return { id, version: 1 as const,
    contentHash: `sha256:${sha256AuthorityValue(id)}` as const }
}

function rateRef(rate: { rateAuthorityId: string; rateAuthorityVersion: number;
  rateAuthorityHash: string }) {
  return { id: rate.rateAuthorityId, version: rate.rateAuthorityVersion,
    contentHash: `sha256:${rate.rateAuthorityHash}` as const }
}

function sameRef(left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string }) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
