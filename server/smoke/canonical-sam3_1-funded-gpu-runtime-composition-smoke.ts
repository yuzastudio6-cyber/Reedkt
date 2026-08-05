import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuRuntimeLaunchTarget,
  startCanonicalProfessionalGpuJob,
  type CanonicalProfessionalGpuExecutionEnvelope,
  type CanonicalProfessionalGpuJobLifecycleStore,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  canonicalSam31FundedGpuLaunchPort,
  createCanonicalSam31FundedGpuRuntimeComposition,
} from '../services/canonical-sam3_1-funded-gpu-runtime-composition'
import {
  createCanonicalSam31GpuTaskContextRepository,
} from '../services/canonical-sam3_1-gpu-task-context-owner'
import {
  assertCanonicalSam31GpuRuntimeReleaseRegistryRecord,
} from '../services/canonical-sam3_1-gpu-runtime-release-registry'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  canonicalCurrentGoogleCloudGpuRateAuthoritySchema,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  createCanonicalSam31GpuPrivateInputStagingPort,
  type CanonicalSam31GpuPrivateBinaryObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  canonicalSam31GpuSourceMediaSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  canonicalSam31GpuFixedTaskContractRef,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  createCanonicalTrackAllSam31OrchestraBinding,
} from '../workers/masks/canonical-track-all-sam3_1-orchestra-binding'
import {
  a100 as base,
} from './canonical-sam3_1-gpu-task-owner-smoke'
import {
  released,
} from
  './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'
import {
  a100 as basePrimaryRate,
  l4Fallback as baseFallbackRate,
} from './canonical-professional-tool-gpu-cost-authority-smoke'

const admittedAt = '2026-08-04T18:30:00.000Z'
const startedAt = '2026-08-04T18:30:10.000Z'
const preparationTimes = [
  '2026-08-04T18:30:15.000Z',
  '2026-08-04T18:30:20.000Z',
  '2026-08-04T18:30:25.000Z',
]
const primaryRate = shiftRate(basePrimaryRate, '2026-08-04T18:29:55.000Z')
const fallbackRate = shiftRate(baseFallbackRate, '2026-08-04T18:29:55.000Z')
const primaryRateRef = rateRef(primaryRate)
const fallbackRateRef = rateRef(fallbackRate)
const baseSourceMedia = canonicalSam31GpuSourceMediaSchema.parse(
  base.context.sourceMedia,
)
const runtimeReleaseRef = ref(
  released.runtimeRelease.releaseId,
  released.runtimeRelease.releaseHash,
  released.runtimeRelease.releaseVersion,
)
const admission = reissueAdmission({
  runtimeReleaseRef,
  currentRateAuthorityRef: primaryRateRef,
})
const target = createCanonicalProfessionalGpuRuntimeLaunchTarget({
  runtimeRelease: released.runtimeRelease,
  fixedServerTaskContractRef: canonicalSam31GpuFixedTaskContractRef(),
  at: startedAt,
})
const binding = createCanonicalTrackAllSam31OrchestraBinding({
  bindingId: 'funded-composition-track-all-binding',
  call: base.orchestraCall,
  admission,
})

const jsonObjects = new Map<string, Buffer>()
const jsonObjectPort = memoryJsonObjectPort(jsonObjects)
const taskContextRepository = createCanonicalSam31GpuTaskContextRepository({
  objectPort: jsonObjectPort,
  prefix: 'private/smoke/sam3_1/funded-composition/context/v1',
})
const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort: jsonObjectPort,
  prefix: 'private/smoke/sam3_1/funded-composition/tasks/v1',
})

const maskProxyBytes = Buffer.alloc(4_096, 0x31)
const maskProxySha256 = createHash('sha256').update(maskProxyBytes)
  .digest('hex')
const stagedObjects = new Map<string, Buffer>()
const privateInputStagingPort = createCanonicalSam31GpuPrivateInputStagingPort({
  sourceReadPort: {
    async rereadExactApprovedMaskProxy(input) {
      assert.equal(input.expectedByteLength, maskProxyBytes.byteLength)
      assert.equal(input.expectedSha256, maskProxySha256)
      return {
        contentType: 'video/mp4' as const,
        byteLength: maskProxyBytes.byteLength,
        sha256: maskProxySha256,
        width: baseSourceMedia.width,
        height: baseSourceMedia.height,
        decodedFrameCount: baseSourceMedia.decodedFrameCount,
        selectedStartFrameInclusive:
          baseSourceMedia.selectedStartFrameInclusive,
        selectedEndFrameInclusive:
          baseSourceMedia.selectedEndFrameInclusive,
        sourceBindingRef: input.sourceBindingRef,
        finalizedSourceArtifactRef: input.finalizedSourceArtifactRef,
        gpuPreparedMaskProxyArtifactRef:
          input.gpuPreparedMaskProxyArtifactRef,
        exactSourceReadEvidenceRef: input.exactSourceReadEvidenceRef,
        sourceFrameRangeMappingRef: input.sourceFrameRangeMappingRef,
        proxyPixelGeometryQaRef: input.proxyPixelGeometryQaRef,
        exactApprovedSnapshotWorkLeaseAndSourceReread: true as const,
        sourcePathUrlBucketObjectGenerationOrBytesExposed: false as const,
        async openStream() {
          return Readable.from([Buffer.from(maskProxyBytes)])
        },
      }
    },
  },
  binaryObjectPort: memoryBinaryObjectPort(stagedObjects),
})

let approvedSourceReads = 0
let rawCloudLaunchCalls = 0
const releasePair = registryRecord()
const composition = createCanonicalSam31FundedGpuRuntimeComposition({
  taskContextRepository,
  approvedTaskMaterialSourceReadPort: {
    async rereadApprovedTaskMaterialSource(input) {
      approvedSourceReads += 1
      assert.equal(input.admission.admissionId, admission.admissionId)
      return {
        trackAllOrchestraBinding: binding,
        editPlanVersionId: base.context.editPlanVersionId,
        editPlanVersionRef: base.context.editPlanVersionRef,
        outputId: base.context.outputId,
        confirmedOutputFrameRef: base.context.confirmedOutputFrameRef,
        sceneId: base.context.sceneId,
        sourceBindingRef: base.context.sourceBindingRef,
        sourceMedia: base.context.sourceMedia,
        approvedPrompt: base.context.approvedPrompt,
        primaryRateAuthorityRef: primaryRateRef,
        fallbackRateAuthorityRef: fallbackRateRef,
        privateTaskInputTransportRef:
          base.context.privateTaskInputTransportRef,
        privateTaskOutputTransportRef:
          base.context.privateTaskOutputTransportRef,
      }
    },
  },
  releasePairReadPort: {
    async rereadReleasePair(input) {
      assert.deepEqual(input.runtimeReleaseRef, runtimeReleaseRef)
      return structuredClone(releasePair)
    },
  },
  rateAuthorityReadPort: {
    async rereadApprovedCurrentRate(input) {
      return structuredClone(input.routeId === 'a100_80gb_heavy_primary'
        ? primaryRate
        : fallbackRate)
    },
  },
  privateInputStagingPort,
  taskStore,
  rawCloudLaunchPort: {
    async startOneShotJob(input) {
      rawCloudLaunchCalls += 1
      const task = assertCanonicalSam31GpuTaskRecord(
        await taskStore.rereadTask(input.executionEnvelopeRef.id),
      )
      assert.equal(task.executionEnvelopeRef.id,
        input.executionEnvelopeRef.id)
      return {
        disposition: 'accepted',
        cloudJobExecutionRef: ref('funded-composition-cloud-execution'),
        cloudJobCreateRequestRef:
          ref('funded-composition-cloud-create-request'),
        providerRequestIdDigestSha256:
          sha256AuthorityValue('funded-composition-provider-request'),
        observedAt: '2026-08-04T18:30:26.000Z',
        providerInferenceOrSubstantiveWorkKnownExecuted:
          'not_executed',
      }
    },
  },
  now: () => {
    const next = preparationTimes.shift()
    if (!next) throw new Error('Unexpected extra preparation clock read.')
    return next
  },
})

const lifecycleStore = memoryLifecycleStore()
const launch = await startCanonicalProfessionalGpuJob({
  launchRecordId: 'funded-composition-launch',
  admission,
  releaseReadPort: {
    async rereadPrivateLaunchTarget() { return structuredClone(target) },
  },
  launchPort: composition.launchPort,
  store: lifecycleStore,
  startedAt,
})
assert.equal(launch.launchDisposition, 'job_created')
assert.equal(approvedSourceReads, 1)
assert.equal(rawCloudLaunchCalls, 1)
assert.equal(stagedObjects.size, 1)
assert.equal(composition.rawCloudLaunchPortExposed, false)
assert.equal(composition.approvedTaskMaterialOwnerIsCanonicalServer, true)
assert.equal(composition.taskContextOwnerIsCanonicalServer, true)
assert.equal(composition.fixedTaskPersistenceRequiredBeforeCloudJobCreation,
  true)
assert.equal(canonicalSam31FundedGpuLaunchPort(composition),
  composition.launchPort)
assert.throws(() => canonicalSam31FundedGpuLaunchPort({
  ...composition,
} as typeof composition))
assert.equal(preparationTimes.length, 0)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-funded-gpu-runtime-composition',
  checks: 32,
  fundedAdmissionConsumedBeforePreparation: true,
  approvedMaterialSourceReread: true,
  approvedMaterialPersistedAndReread: true,
  specializedAndGenericReleasePairReread: true,
  a100AndL4AccountEffectiveRatesReread: true,
  taskContextPersistedAndReread: true,
  privateInputStagedAndReread: true,
  fixedTaskPersistedAndRereadBeforeRawCloudPort: true,
  rawCloudLaunchPortExposed: false,
  unbrandedCompositionAccepted: false,
  cloudLaunchCalls: rawCloudLaunchCalls,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function memoryLifecycleStore(): CanonicalProfessionalGpuJobLifecycleStore {
  const consumed = new Set<string>()
  const envelopes = new Map<string, CanonicalProfessionalGpuExecutionEnvelope>()
  const launches = new Set<string>()
  return {
    async consumeAdmissionCreateOnly({ record }) {
      if (consumed.has(record.admissionRef.id)) return 'already_exists'
      consumed.add(record.admissionRef.id)
      return 'created'
    },
    async createExecutionEnvelopeOnly({ record }) {
      if (envelopes.has(record.envelopeId)) return 'already_exists'
      envelopes.set(record.envelopeId, structuredClone(record))
      return 'created'
    },
    async rereadExecutionEnvelope({ envelopeId }) {
      return structuredClone(envelopes.get(envelopeId) ?? null)
    },
    async createLaunchRecordOnly({ record }) {
      if (launches.has(record.launchRecordId)) return 'already_exists'
      launches.add(record.launchRecordId)
      return 'created'
    },
    async createTerminalRecordOnly() { return 'created' },
  }
}

function memoryJsonObjectPort(
  objects: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      const digest = createHash('sha256').update(input.body).digest('hex')
      assert.equal(digest, input.contentSha256)
      const prior = objects.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('JSON object collision.')
        return 'already_exists'
      }
      objects.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = objects.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function memoryBinaryObjectPort(
  objects: Map<string, Buffer>,
): CanonicalSam31GpuPrivateBinaryObjectPort {
  return {
    schemaVersion: 'canonical-sam3_1-gpu-private-binary-object-port-v1',
    async stageCreateOnlyAndReread(input) {
      const chunks: Buffer[] = []
      for await (const chunk of await input.openSourceStream()) {
        chunks.push(Buffer.from(chunk))
      }
      const body = Buffer.concat(chunks)
      assert.equal(body.byteLength, input.expectedByteLength)
      assert.equal(createHash('sha256').update(body).digest('hex'),
        input.expectedSha256)
      const key = `private/${input.invocationId}/mask-proxy.mp4`
      const prior = objects.get(key)
      if (prior && !prior.equals(body)) throw new Error('Binary collision.')
      objects.set(key, body)
      return {
        disposition: prior ? 'identical_replay' : 'created',
        contentType: 'video/mp4',
        byteLength: body.byteLength,
        sha256: input.expectedSha256,
        storageGeneration: '1',
        storageEtagSha256: sha256AuthorityValue(body),
        createdWithIfGenerationMatchZero: true,
        exactGenerationMetadataReread: true,
        exactGenerationBytesRereadAndHashed: true,
      }
    },
  }
}

function reissueAdmission(input: {
  runtimeReleaseRef: ReturnType<typeof ref>
  currentRateAuthorityRef: ReturnType<typeof ref>
}) {
  const { admissionHash: _oldHash, ...prior } = structuredClone(base.admission)
  assert.ok(_oldHash)
  const payload = {
    ...prior,
    runtimeReleaseRef: input.runtimeReleaseRef,
    currentRateAuthorityRef: input.currentRateAuthorityRef,
    admittedAt,
    expiresAt: '2026-08-04T19:00:00.000Z',
  }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function registryRecord() {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-gpu-runtime-release-registry-record-v1' as const,
    source: 'canonical_server_sam3_1_gpu_runtime_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    status: 'private_internal_qualified' as const,
    specializedRelease: released.observation,
    runtimeRelease: released.runtimeRelease,
    publishedAt: '2026-08-04T18:23:00.000Z',
    exactSpecializedAndGenericReleasePairPersisted: true as const,
    exactQualifiedArtifactRouteAndExpiryBound: true as const,
    runtimeDispatched: false as const,
    customerCreditsMutated: false as const,
    qaApprovalGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return assertCanonicalSam31GpuRuntimeReleaseRegistryRecord({
    ...payload,
    recordHash: sha256AuthorityValue(payload),
  })
}

function shiftRate(
  source: CanonicalCurrentGoogleCloudGpuRateAuthority,
  observedAt: string,
) {
  const { rateAuthorityHash: _oldHash, ...prior } = structuredClone(source)
  assert.ok(_oldHash)
  const pricingReadStartedAt = new Date(Date.parse(observedAt) - 5_000)
    .toISOString()
  const components = prior.components.map((component) => ({
    ...component,
    currentPriceObservedAt: observedAt,
  }))
  const pricingReadDigestSha256 = sha256AuthorityValue({
    sourceClass: prior.sourceClass,
    billingAccountPricingScopeRef: prior.billingAccountPricingScopeRef,
    pricingReaderConfigurationRef: prior.pricingReaderConfigurationRef,
    routeId: prior.routeId,
    region: prior.region,
    currency: prior.currency,
    components,
    priceRecordSetRef: prior.priceRecordSetRef,
    pricingReadStartedAt,
    pricingReadFinishedAt: observedAt,
  })
  const payload = {
    ...prior,
    components,
    pricingReadStartedAt,
    pricingReadFinishedAt: observedAt,
    pricingReadDigestSha256,
    observedAt,
    expiresAt: new Date(Date.parse(observedAt) + 86_400_000).toISOString(),
  }
  return canonicalCurrentGoogleCloudGpuRateAuthoritySchema.parse({
    ...payload,
    rateAuthorityHash: sha256AuthorityValue(payload),
  })
}

function rateRef(rate: CanonicalCurrentGoogleCloudGpuRateAuthority) {
  return ref(rate.rateAuthorityId, rate.rateAuthorityHash,
    rate.rateAuthorityVersion)
}

function ref(id: string, hash = sha256AuthorityValue(id), version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${hash}` as const,
  }
}
