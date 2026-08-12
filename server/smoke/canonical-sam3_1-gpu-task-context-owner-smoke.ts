import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuRuntimeLaunchTarget,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31GpuRuntimeReleaseRegistryRecord,
  type CanonicalSam31GpuRuntimeReleaseRegistryRecord,
} from '../services/canonical-sam3_1-gpu-runtime-release-registry'
import {
  assertCanonicalSam31GpuApprovedTaskMaterial,
  buildCanonicalSam31GpuApprovedTaskMaterial,
  createCanonicalSam31GpuApprovedTaskMaterialPreparationOwner,
  createCanonicalSam31GpuTaskContextOwner,
  createCanonicalSam31GpuTaskContextRepository,
} from '../services/canonical-sam3_1-gpu-task-context-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  assertCanonicalProfessionalGoogleCloudGpuRateAuthority,
  type CanonicalProfessionalGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-professional-google-cloud-gpu-rate-authority'
import {
  createCanonicalTrackAllSam31OrchestraBinding,
} from '../workers/masks/canonical-track-all-sam3_1-orchestra-binding'
import {
  assertCanonicalSam31GpuApprovedTaskMaterialPreparationReceipt,
  assertCanonicalSam31GpuTaskContext,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  a100 as baseTaskFixture,
} from './canonical-sam3_1-gpu-task-owner-smoke'
import {
  released,
} from
  './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'
import {
  a100 as sourceA100Rate,
  l4Fallback as sourceL4FallbackRate,
} from './canonical-professional-tool-gpu-cost-authority-smoke'

const observedAt = '2026-08-04T18:29:55.000Z'
const publishedAt = '2026-08-04T18:30:15.000Z'
const ownerReadAt = '2026-08-04T18:30:20.000Z'
const primaryRate = shiftRate(sourceA100Rate, observedAt)
const fallbackRate = shiftRate(sourceL4FallbackRate, observedAt)
const primaryRateRef = rateRef(primaryRate)
const fallbackRateRef = rateRef(fallbackRate)
const runtimeReleaseRef = {
  id: released.runtimeRelease.releaseId,
  version: released.runtimeRelease.releaseVersion,
  contentHash: `sha256:${released.runtimeRelease.releaseHash}` as const,
}
const admission = reissueAdmission({
  runtimeReleaseRef,
  currentRateAuthorityRef: primaryRateRef,
})
const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget({
  ...baseTaskFixture.target,
  releaseRef: runtimeReleaseRef,
  releaseEvidenceClass: 'canonical_private_reread' as const,
  privateInternalQualified: true as const,
  runtimeRegion: released.runtimeRelease.runtimeRegion,
  executionTarget: released.runtimeRelease.executionTarget,
  machineType: released.runtimeRelease.machineType,
  accelerator: released.runtimeRelease.accelerator,
  immutableImageRef: released.runtimeRelease.immutableImageRef,
  immutableImageDigest: released.runtimeRelease.immutableImageDigest,
  serviceIdentityRef: released.runtimeRelease.serviceIdentityRef,
  privateNetworkAndArtifactTransportRef:
    released.runtimeRelease.privateNetworkAndArtifactTransportRef,
})
const trackAllOrchestraBinding =
  createCanonicalTrackAllSam31OrchestraBinding({
    bindingId: 'canonical-task-context-owner-track-all-binding',
    call: baseTaskFixture.orchestraCall,
    admission,
  })
const admissionConsumptionRef = ref('canonical-admission-consumption')
const executionEnvelopeRef = ref('canonical-sam31-execution-envelope')
const material = buildCanonicalSam31GpuApprovedTaskMaterial({
  admission,
  target,
  admissionConsumptionRef,
  executionEnvelopeRef,
  trackAllOrchestraBinding,
  editPlanVersionId: baseTaskFixture.context.editPlanVersionId,
  editPlanVersionRef: baseTaskFixture.context.editPlanVersionRef,
  outputId: baseTaskFixture.context.outputId,
  confirmedOutputFrameRef:
    baseTaskFixture.context.confirmedOutputFrameRef,
  sceneId: baseTaskFixture.context.sceneId,
  sourceBindingRef: baseTaskFixture.context.sourceBindingRef,
  sourceMedia: baseTaskFixture.context.sourceMedia,
  approvedPrompt: baseTaskFixture.context.approvedPrompt,
  primaryRateAuthorityRef: primaryRateRef,
  fallbackRateAuthorityRef: fallbackRateRef,
  privateTaskInputTransportRef:
    baseTaskFixture.context.privateTaskInputTransportRef,
  privateTaskOutputTransportRef:
    baseTaskFixture.context.privateTaskOutputTransportRef,
  publishedAt,
})
assertCanonicalSam31GpuApprovedTaskMaterial(material)

const objects = new Map<string, Buffer>()
const repository = createCanonicalSam31GpuTaskContextRepository({
  objectPort: memoryObjectPort(objects),
  prefix: 'private/smoke/sam3_1/gpu-task-context/v1',
})
let approvedSourceReads = 0
const materialPreparationOwner =
  createCanonicalSam31GpuApprovedTaskMaterialPreparationOwner({
    repository,
    sourceReadPort: {
      async rereadApprovedTaskMaterialSource(input) {
        approvedSourceReads += 1
        assert.deepEqual(input.admissionConsumptionRef,
          admissionConsumptionRef)
        assert.deepEqual(input.executionEnvelopeRef, executionEnvelopeRef)
        return {
          trackAllOrchestraBinding,
          editPlanVersionId: baseTaskFixture.context.editPlanVersionId,
          editPlanVersionRef: baseTaskFixture.context.editPlanVersionRef,
          outputId: baseTaskFixture.context.outputId,
          confirmedOutputFrameRef:
            baseTaskFixture.context.confirmedOutputFrameRef,
          sceneId: baseTaskFixture.context.sceneId,
          sourceBindingRef: baseTaskFixture.context.sourceBindingRef,
          sourceMedia: baseTaskFixture.context.sourceMedia,
          approvedPrompt: baseTaskFixture.context.approvedPrompt,
          primaryRateAuthorityRef: primaryRateRef,
          fallbackRateAuthorityRef: fallbackRateRef,
          privateTaskInputTransportRef:
            baseTaskFixture.context.privateTaskInputTransportRef,
          privateTaskOutputTransportRef:
            baseTaskFixture.context.privateTaskOutputTransportRef,
        }
      },
    },
    now: () => publishedAt,
  })
const preparationReceipt =
  assertCanonicalSam31GpuApprovedTaskMaterialPreparationReceipt(
    await materialPreparationOwner.preparePersistAndRereadApprovedTaskMaterial({
      admission,
      target,
      admissionConsumptionRef,
      executionEnvelopeRef,
    }),
  )
assert.deepEqual(preparationReceipt.approvedTaskMaterialRef,
  material.materialRef)
assert.equal(approvedSourceReads, 1)

let approvedSourceGetterInvoked = false
const accessorBackedSource = {}
Object.defineProperty(accessorBackedSource, 'trackAllOrchestraBinding', {
  enumerable: true,
  get() {
    approvedSourceGetterInvoked = true
    return trackAllOrchestraBinding
  },
})
await assert.rejects(
  createCanonicalSam31GpuApprovedTaskMaterialPreparationOwner({
    repository,
    sourceReadPort: {
      async rereadApprovedTaskMaterialSource() {
        return accessorBackedSource
      },
    },
    now: () => publishedAt,
  }).preparePersistAndRereadApprovedTaskMaterial({
    admission,
    target,
    admissionConsumptionRef,
    executionEnvelopeRef: ref('accessor-material-envelope'),
  }),
)
assert.equal(approvedSourceGetterInvoked, false)
const releasePair = registryRecord()
const owner = createCanonicalSam31GpuTaskContextOwner({
  repository,
  releasePairReadPort: {
    async rereadReleasePair(input) {
      assert.deepEqual(input.runtimeReleaseRef, runtimeReleaseRef)
      return structuredClone(releasePair)
    },
  },
  rateAuthorityReadPort: {
    async rereadApprovedCurrentRate(input) {
      if (input.routeId === 'a100_80gb_heavy_primary') {
        assert.deepEqual(input.rateAuthorityRef, primaryRateRef)
        return structuredClone(primaryRate)
      }
      assert.deepEqual(input.rateAuthorityRef, fallbackRateRef)
      return structuredClone(fallbackRate)
    },
  },
  now: () => ownerReadAt,
})
const context = assertCanonicalSam31GpuTaskContext(
  await owner.rereadCanonicalTaskContext({
    admission,
    target,
    admissionConsumptionRef,
    executionEnvelopeRef,
  }),
)
assert.deepEqual(context.specializedRuntimeRelease,
  releasePair.specializedRelease)
assert.deepEqual(context.primaryRateAuthorityRef, primaryRateRef)
assert.deepEqual(context.fallbackRateAuthorityRef, fallbackRateRef)
assert.equal(context.preparedAt, publishedAt)
assert.equal(objects.size, 2)

assert.deepEqual(
  await owner.rereadCanonicalTaskContext({
    admission,
    target,
    admissionConsumptionRef,
    executionEnvelopeRef,
  }),
  context,
)
assert.equal(objects.size, 2)

await assert.rejects(createCanonicalSam31GpuTaskContextOwner({
  repository,
  releasePairReadPort: {
    async rereadReleasePair() {
      const crossed = structuredClone(releasePair)
      crossed.specializedRelease.route.routeId = 'l4_heavy_fallback'
      return crossed
    },
  },
  rateAuthorityReadPort: {
    async rereadApprovedCurrentRate(input) {
      return input.routeId === 'a100_80gb_heavy_primary'
        ? primaryRate
        : fallbackRate
    },
  },
  now: () => ownerReadAt,
}).rereadCanonicalTaskContext({
  admission,
  target,
  admissionConsumptionRef,
  executionEnvelopeRef,
}))

await assert.rejects(createCanonicalSam31GpuTaskContextOwner({
  repository,
  releasePairReadPort: {
    async rereadReleasePair() { return releasePair },
  },
  rateAuthorityReadPort: {
    async rereadApprovedCurrentRate(input) {
      return input.routeId === 'a100_80gb_heavy_primary'
        ? sourceA100Rate
        : sourceL4FallbackRate
    },
  },
  now: () => ownerReadAt,
}).rereadCanonicalTaskContext({
  admission,
  target,
  admissionConsumptionRef,
  executionEnvelopeRef,
}))

await assert.rejects(owner.rereadCanonicalTaskContext({
  admission,
  target,
  admissionConsumptionRef,
  executionEnvelopeRef: ref('missing-task-material-envelope'),
}))

assert.throws(() => buildCanonicalSam31GpuApprovedTaskMaterial({
  admission,
  target,
  admissionConsumptionRef,
  executionEnvelopeRef: ref('pre-admission-material-envelope'),
  trackAllOrchestraBinding,
  editPlanVersionId: baseTaskFixture.context.editPlanVersionId,
  editPlanVersionRef: baseTaskFixture.context.editPlanVersionRef,
  outputId: baseTaskFixture.context.outputId,
  confirmedOutputFrameRef:
    baseTaskFixture.context.confirmedOutputFrameRef,
  sceneId: baseTaskFixture.context.sceneId,
  sourceBindingRef: baseTaskFixture.context.sourceBindingRef,
  sourceMedia: baseTaskFixture.context.sourceMedia,
  approvedPrompt: baseTaskFixture.context.approvedPrompt,
  primaryRateAuthorityRef: primaryRateRef,
  fallbackRateAuthorityRef: fallbackRateRef,
  privateTaskInputTransportRef:
    baseTaskFixture.context.privateTaskInputTransportRef,
  privateTaskOutputTransportRef:
    baseTaskFixture.context.privateTaskOutputTransportRef,
  publishedAt: '2026-08-04T18:29:59.999Z',
}))

const tamperedMaterial = structuredClone(material)
tamperedMaterial.outputId = 'crossed-output'
await assert.rejects(repository.persistApprovedMaterialCreateOnly({
  material: tamperedMaterial,
}))

let getterInvoked = false
const hostile = {}
Object.defineProperty(hostile, 'admission', {
  enumerable: true,
  get() {
    getterInvoked = true
    return admission
  },
})
await assert.rejects(owner.rereadCanonicalTaskContext(hostile as never))
assert.equal(getterInvoked, false)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-task-context-owner',
  checks: 24,
  approvedTaskMaterialSourceRereadByCanonicalOwner: true,
  materialPreparationReceiptValidated: true,
  hostileApprovedSourceRejectedWithoutGetterInvocation: true,
  approvedTrackAllTaskMaterialPersistedCreateOnly: true,
  materialPublishedAfterFundedAdmissionBeforeLaunch: true,
  exactSpecializedAndGenericReleasePairReread: true,
  exactPrimaryAndFallbackAccountEffectiveRatesReread: true,
  taskContextConstructedByCanonicalOwner: true,
  taskContextPersistedAndRereadExact: true,
  staleRatesRejected: true,
  crossedReleaseRejected: true,
  callerMaterialOrTaskContextAccepted: false,
  workDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function reissueAdmission(input: {
  runtimeReleaseRef: ReturnType<typeof ref>
  currentRateAuthorityRef: ReturnType<typeof ref>
}) {
  const base = structuredClone(baseTaskFixture.admission)
  const { admissionHash: _oldHash, ...prior } = base
  assert.ok(_oldHash)
  const payload = {
    ...prior,
    runtimeReleaseRef: input.runtimeReleaseRef,
    currentRateAuthorityRef: input.currentRateAuthorityRef,
    admittedAt: '2026-08-04T18:30:00.000Z',
    expiresAt: '2026-08-04T19:00:00.000Z',
  }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function shiftRate(
  source: CanonicalProfessionalGoogleCloudGpuRateAuthority,
  nextObservedAt: string,
) {
  const shifted = structuredClone(source)
  const { rateAuthorityHash: _oldHash, ...prior } = shifted
  assert.ok(_oldHash)
  const pricingReadStartedAt = new Date(
    Date.parse(nextObservedAt) - 5_000,
  ).toISOString()
  const components = prior.components.map((component) => ({
    ...component,
    currentPriceObservedAt: nextObservedAt,
  }))
  const pricingReadDigestPayload = {
    sourceClass: prior.sourceClass,
    billingAccountPricingScopeRef: prior.billingAccountPricingScopeRef,
    pricingReaderConfigurationRef: prior.pricingReaderConfigurationRef,
    routeId: prior.routeId,
    ...('pricingSetMode' in prior ? {
      executionTarget: prior.executionTarget,
      pricingSetMode: prior.pricingSetMode,
    } : {}),
    region: prior.region,
    currency: prior.currency,
    components,
    priceRecordSetRef: prior.priceRecordSetRef,
    pricingReadStartedAt,
    pricingReadFinishedAt: nextObservedAt,
  }
  const pricingReadDigestSha256 = sha256AuthorityValue(
    pricingReadDigestPayload,
  )
  const payload = {
    ...prior,
    components,
    pricingReadStartedAt,
    pricingReadFinishedAt: nextObservedAt,
    pricingReadDigestSha256,
    observedAt: nextObservedAt,
    expiresAt: new Date(Date.parse(nextObservedAt) + 86_400_000)
      .toISOString(),
  }
  return assertCanonicalProfessionalGoogleCloudGpuRateAuthority({
    ...payload,
    rateAuthorityHash: sha256AuthorityValue(payload),
  }, nextObservedAt)
}

function rateRef(rate: CanonicalProfessionalGoogleCloudGpuRateAuthority) {
  return ref(
    rate.rateAuthorityId,
    rate.rateAuthorityHash,
    rate.rateAuthorityVersion,
  )
}

function registryRecord(): CanonicalSam31GpuRuntimeReleaseRegistryRecord {
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

function ref(id: string, raw = sha256AuthorityValue(id), version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${raw}` as const,
  }
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('object collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}
