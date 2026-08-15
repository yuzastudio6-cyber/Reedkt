import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalA100VertexCustomJobDurableStore,
} from '../services/canonical-a100-vertex-custom-job-durable-store'
import {
  createCanonicalA100VertexCustomJobLaunchPort,
} from '../services/canonical-a100-vertex-custom-job-launch-port'
import {
  type CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from '../services/canonical-professional-gpu-durable-lifecycle-store'
import {
  createCanonicalSam31A100RuntimeQualificationAdmissionRepository,
  createCanonicalSam31A100RuntimeQualificationLaunchService,
} from '../services/canonical-sam3_1-a100-runtime-qualification-launch-service'
import {
  assertCanonicalSam31VertexQualificationQuotaObservation,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
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
import { authority as vertexA100Rate } from
  './canonical-current-google-cloud-vertex-a100-rate-authority-smoke'
import { release as sourceCheckpointRelease } from
  './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'

const NOW = '2026-08-06T16:10:00.000Z'
const records = new Map<string, Buffer>()
const objectPort = memoryObjectPort(records)
const lifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
  objectPort,
})
const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort,
})
const rawVertexStore = createCanonicalA100VertexCustomJobDurableStore({
  objectPort,
})
const l4Rate = await buildL4FallbackRate()
const quota = buildQuota()
let providerCalls = 0
let observedProviderBody: Record<string, unknown> | null = null

const service = createCanonicalSam31A100RuntimeQualificationLaunchService({
  sourceCheckpointReadPort: {
    async rereadQualificationRelease({ sourceCheckpointQualificationRef }) {
      return sameRef(sourceCheckpointQualificationRef,
        sourceCheckpointRelease.sourceCheckpointQualificationRef)
        ? structuredClone(sourceCheckpointRelease)
        : null
    },
  },
  imageSupplyChainReadPort: {
    async rereadQualifiedRelease({ releaseRef }) {
      return releaseRef.id === qualifiedSupplyChain.releaseId
        && releaseRef.contentHash ===
          `sha256:${qualifiedSupplyChain.releaseHash}`
        ? structuredClone(qualifiedSupplyChain)
        : null
    },
  },
  vertexRateReadPort: {
    async reread({ rateAuthorityRef }) {
      return rateAuthorityRef.id === vertexA100Rate!.rateAuthorityId
        && rateAuthorityRef.contentHash ===
          `sha256:${vertexA100Rate!.rateAuthorityHash}`
        ? structuredClone(vertexA100Rate)
        : null
    },
  },
  gpuRateReadPort: {
    async rereadApprovedCurrentRate({ rateAuthorityRef }) {
      return rateAuthorityRef.id === l4Rate.rateAuthorityId
        && rateAuthorityRef.contentHash === `sha256:${l4Rate.rateAuthorityHash}`
        ? structuredClone(l4Rate)
        : null
    },
  },
  quotaReadPort: {
    async rereadCurrent() {
      return structuredClone(quota)
    },
  },
  admissionRepository:
    createCanonicalSam31A100RuntimeQualificationAdmissionRepository({
      objectPort,
    }),
  lifecycleStore,
  privateInputStagingPort: fakeStagingPort(),
  taskStore,
  vertexLaunchPort: createCanonicalA100VertexCustomJobLaunchPort({
    launchContextRepository: rawVertexStore,
    consumptionPort: rawVertexStore,
    executionRepository: rawVertexStore,
    auth: {
      async request(request) {
        providerCalls += 1
        observedProviderBody = structuredClone(
          request.data as Record<string, unknown>,
        )
        const body = request.data as { displayName: string }
        return { data: {
          name:
            'projects/390722338345/locations/us-central1/customJobs/31001',
          displayName: body.displayName,
          state: 'JOB_STATE_PENDING',
        } } as never
      },
    },
    now: () => NOW,
  }),
  now: () => NOW,
})

const request = {
  qualificationId: 'sam31-a100-runtime-qualification-smoke',
  runOrdinal: 1,
  sourceCheckpointQualificationRef:
    sourceCheckpointRelease.sourceCheckpointQualificationRef,
  imageSupplyChainReleaseRef: {
    id: qualifiedSupplyChain.releaseId,
    version: 1 as const,
    contentHash: `sha256:${qualifiedSupplyChain.releaseHash}` as const,
  },
  currentA100RateAuthorityRef: rateRef(vertexA100Rate!),
  currentL4FallbackRateAuthorityRef: rateRef(l4Rate),
}

const launched = await service.start(request)
assert.equal(launched.status, 'job_created')
assert.equal(launched.providerCallStarted, true)
assert.equal(launched.customerCreditsMutated, false)
assert.equal(launched.runtimeReleaseGranted, false)
assert.equal(launched.productionAuthorityGranted, false)
assert.equal(providerCalls, 1)

const invocationId =
  'sam31-a100-qualification:sam31-a100-runtime-qualification-smoke.run-01.execution'
const task = assertCanonicalSam31GpuTaskRecord(
  await taskStore.rereadTask(invocationId),
)
assert.equal(task.runtimeRequest.dispatch.accelerator, 'nvidia_a100_80gb')
assert.equal(task.runtimeRequest.dispatch.cpuOnlyInferenceAllowed, false)
assert.equal(task.runtimeRequest.dispatch.scaleFromZeroRequired, true)
assert.equal(task.runtimeRequest.dispatch
  .scaleBackToZeroAfterTerminalAttemptRequired, true)
assert.equal(task.runtimeRequest.sourceMedia.decodedFrameCount, 200)
assert.equal(task.runtimeRequest.sourceMedia.selectedStartFrameInclusive, 0)
assert.equal(task.runtimeRequest.sourceMedia.selectedEndFrameInclusive, 199)
assert.equal(task.runtimeRequest.settings.videoDecodeBackend,
  'torchcodec_0_10_cuda_nvdec')
assert.equal(task.runtimeRequest.settings.gpuAcceleratedDecode, true)
assert.equal(task.runtimeRequest.settings.cpuOpenCvOrPillowDecodeAllowed, false)
assert.equal(task.cloudJobCreated, false)
assert.equal(task.customerCreditsMutated, false)

const body = requireRecord(observedProviderBody)
const jobSpec = requireRecord(body.jobSpec)
const workerPools = jobSpec.workerPoolSpecs as Array<Record<string, unknown>>
assert.equal(workerPools.length, 1)
const worker = workerPools[0]
const machine = requireRecord(worker.machineSpec)
assert.equal(machine.machineType, 'a2-ultragpu-1g')
assert.equal(machine.acceleratorType, 'NVIDIA_A100_80GB')
assert.equal(machine.acceleratorCount, 1)
assert.equal(jobSpec.serviceAccount,
  'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(jobSpec.enableWebAccess, undefined)
assert.equal(JSON.stringify(body).includes('sam2'), false)
assert.equal(JSON.stringify(body).includes('qwen'), false)

await assert.rejects(service.start(request),
  /qualification_admission_already_exists/u)
assert.equal(providerCalls, 1)
await assert.rejects(service.start({
  ...request,
  runOrdinal: 2,
  sourceCheckpointQualificationRef: {
    ...request.sourceCheckpointQualificationRef,
    contentHash: `sha256:${'f'.repeat(64)}`,
  },
}), /current_prerequisite_missing/u)
assert.equal(providerCalls, 1)
await assert.rejects(service.start({
  ...request,
  runOrdinal: 2,
  imageSupplyChainReleaseRef: {
    ...request.imageSupplyChainReleaseRef,
    version: 2,
  },
}))
assert.equal(providerCalls, 1)

assert.equal([...records.keys()].some((path) =>
  path.includes('/launch-admissions/')), true)
assert.equal([...records.keys()].some((path) =>
  path.endsWith('/task.json')), true)
assert.equal([...records.keys()].some((path) =>
  path.includes('/launches/')), true)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-a100-runtime-qualification-launch',
  checks: 42,
  exactQualifiedSourceCheckpointReread: true,
  exactImmutableImageSupplyChainReread: true,
  billingAccountEffectiveA100AndL4RatesBound: true,
  liveVertexA100QuotaBound: true,
  officialTwoHundredFrameProbeBound: true,
  createOnlyAdmissionConsumedBeforeProvider: true,
  duplicateDispatchRejectedBeforeProvider: true,
  a100OneShotScaleFromAndBackToZero: true,
  gpuDecodeAndGpuInferenceRequired: true,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function fakeStagingPort(): CanonicalSam31GpuPrivateInputStagingPort {
  return {
    async stageAndRereadExactMaskProxy(input) {
      const sourceMedia = input.sourceMedia as {
        finalizedSourceArtifactRef: ReturnType<typeof ref>
        gpuPreparedMaskProxyArtifactRef: ReturnType<typeof ref>
        exactSourceReadEvidenceRef: ReturnType<typeof ref>
        sourceFrameRangeMappingRef: ReturnType<typeof ref>
        proxyPixelGeometryQaRef: ReturnType<typeof ref>
        byteLength: number
        sha256: string
        width: number
        height: number
        decodedFrameCount: number
        selectedStartFrameInclusive: number
        selectedEndFrameInclusive: number
      }
      const payload = {
        schemaVersion:
          'canonical-sam3_1-gpu-private-input-staging-evidence-v1',
        source: 'canonical_server_sam3_1_private_input_staging_owner',
        evidenceClass: 'canonical_private_reread',
        stagingId: `${input.invocationId}.private-source-staging`,
        invocationId: input.invocationId,
        scope: input.scope,
        dispatchAdmissionRef: input.dispatchAdmissionRef,
        executionEnvelopeRef: input.executionEnvelopeRef,
        sourceBindingRef: input.sourceBindingRef,
        finalizedSourceArtifactRef: sourceMedia.finalizedSourceArtifactRef,
        gpuPreparedMaskProxyArtifactRef:
          sourceMedia.gpuPreparedMaskProxyArtifactRef,
        exactSourceReadEvidenceRef: sourceMedia.exactSourceReadEvidenceRef,
        sourceFrameRangeMappingRef: sourceMedia.sourceFrameRangeMappingRef,
        proxyPixelGeometryQaRef: sourceMedia.proxyPixelGeometryQaRef,
        privateTaskInputTransportRef: input.privateTaskInputTransportRef,
        privateInvocationObjectRef: ref(
          `${input.invocationId}.private-source-mp4`,
          sourceMedia.sha256,
        ),
        contentType: 'video/mp4',
        byteLength: sourceMedia.byteLength,
        sha256: sourceMedia.sha256,
        width: sourceMedia.width,
        height: sourceMedia.height,
        decodedFrameCount: sourceMedia.decodedFrameCount,
        selectedStartFrameInclusive: sourceMedia.selectedStartFrameInclusive,
        selectedEndFrameInclusive: sourceMedia.selectedEndFrameInclusive,
        storageGeneration: '31001',
        storageEtagSha256: sha('private-staging-etag'),
        sourceArtifactOpenedThroughCanonicalReadPort: true,
        exactSourceStreamByteLengthAndSha256Verified: true,
        targetCreatedWithIfGenerationMatchZero: true,
        exactCreatedGenerationMetadataReread: true,
        exactCreatedGenerationBytesRereadAndHashed: true,
        sourceAndTargetBytesIdentical: true,
        taskAndSourceShareExactInvocationPrefix: true,
        callerPathUrlBucketObjectGenerationOrBytesAccepted: false,
        signedUrlOrPublicObjectUsed: false,
        sourceOrTargetMutationAllowed: false,
        runtimeDownloadAllowed: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        stagedAt: input.stagedAt,
      } as const
      return assertCanonicalSam31GpuPrivateInputStagingEvidence({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
    },
  }
}

function buildQuota() {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-a100-qualification-quota-observation-v1',
    source: 'canonical_server_vertex_quota_observation_owner',
    evidenceClass: 'canonical_private_reread',
    projectId: 'reeditpro',
    region: 'us-central1',
    quotaPreferenceId: 'weeditpro-vertex-a100-80gb-us-central1-1',
    quotaId: 'CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
    preferredValue: 1,
    grantedValue: 1,
    reconciling: false,
    exactCloudQuotaPreferenceAndQuotaInfoReread: true,
    batchOrComputeA100QuotaUsedAsVertexAuthority: false,
    gpuJobStarted: false,
    customerCreditsMutated: false,
    observedAt: NOW,
    expiresAt: '2026-08-06T16:30:00.000Z',
  } as const
  return assertCanonicalSam31VertexQualificationQuotaObservation({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  }, NOW)
}

async function buildL4FallbackRate() {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: 'current-rate-l4-heavy-fallback-launch-smoke-v1',
    rateAuthorityVersion: 1,
    routeId: 'l4_heavy_fallback',
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() {
        return rawL4Observation()
      },
    },
  })
}

function rawL4Observation(): CanonicalGoogleCloudGpuRateRawObservation {
  const components: CanonicalGoogleCloudGpuRateRawObservation[
    'components'
  ] = [
    component('cloud_run_l4_gpu_second', 'gpu_second', 186_700, '1'),
    component('cloud_run_vcpu_second', 'vcpu_second', 18_000, '2'),
    component('cloud_run_memory_gib_second', 'gib_second', 2_000, '3'),
    component('private_object_storage_gib_month', 'gib_month', 20_000_000, '4'),
    component('network_egress_gib', 'gib', 120_000_000, '5'),
    component('object_class_a_per_1000', 'per_1000_operations', 5_000_000, '6'),
    component('object_class_b_per_1000', 'per_1000_operations', 400_000, '7'),
  ]
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api',
    billingAccountPricingScopeRef: ref('l4-billing-account-scope', sha('a')),
    pricingReaderConfigurationRef: ref('l4-price-reader', sha('b')),
    routeId: 'l4_heavy_fallback',
    region: 'us-central1',
    currency: 'USD',
    components,
    priceRecordSetRef: ref('l4-price-record-set', sha('c')),
    pricingReadStartedAt: '2026-08-06T16:09:59.000Z',
    pricingReadFinishedAt: NOW,
  } as const
  return {
    ...payload,
    pricingReadDigestSha256: sha256AuthorityValue(payload),
  }
}

function component(
  componentClass:
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  price: number,
  character: string,
): CanonicalGoogleCloudGpuRateRawObservation['components'][number] {
  const cloudRun = componentClass.startsWith('cloud_run')
  const payload: CanonicalGoogleCloudGpuRateRawObservation[
    'components'
  ][number] = {
    componentClass,
    cloudServiceName: cloudRun ? 'cloud-run' : 'cloud-storage',
    skuRateBindingId: `rate-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId: cloudRun ? 'service-cloud-run' : 'service-cloud-storage',
      skuId: `sku-${componentClass}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: price,
      }],
      maximumContractPriceUsdNanos: price,
      skuMetadataRef: ref(`sku-metadata-${componentClass}`, sha(character)),
      billingAccountPriceRef:
        ref(`account-price-${componentClass}`, sha(character)),
    }],
    skuDescriptionDigestSha256: sha(character),
    skuRegion: 'us-central1',
    billingUnit,
    maximumUsdNanosPerBillingUnit: price,
    currentPriceObservedAt: NOW,
    skuRecordRef: ref(`sku-record-${componentClass}`, sha(character)),
  }
  return payload
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      const prior = values.get(input.objectPath)
      if (prior) {
        if (digest(prior) !== input.contentSha256) {
          throw new Error('controlled create-only collision')
        }
        return 'already_exists'
      }
      assert.equal(digest(input.body), input.contentSha256)
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = values.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function rateRef(rate: {
  rateAuthorityId: string
  rateAuthorityVersion: number
  rateAuthorityHash: string
}) {
  return {
    id: rate.rateAuthorityId,
    version: rate.rateAuthorityVersion,
    contentHash: `sha256:${rate.rateAuthorityHash}` as const,
  }
}

function ref(id: string, hash: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function requireRecord(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
