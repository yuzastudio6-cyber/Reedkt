import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  buildCanonicalSam31EightMinuteQualificationSourcePlan,
  createCanonicalSam31EightMinuteQualificationSourceRepository,
} from '../services/canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  assertCanonicalSam31EightMinuteSourcePreparationAdmission,
  assertCanonicalSam31EightMinuteSourcePreparationQualification,
  assertCanonicalSam31EightMinuteSourcePreparationRelease,
  assertCanonicalSam31EightMinuteSourcePreparationTrigger,
  createCanonicalSam31EightMinuteSourcePreparationAdmissionOwner,
  createCanonicalSam31EightMinuteSourcePreparationAuthorityRepository,
  createCanonicalSam31EightMinuteSourcePreparationConsumption,
  createCanonicalSam31EightMinuteSourcePreparationQualification,
  createCanonicalSam31EightMinuteSourcePreparationRelease,
  createCanonicalSam31EightMinuteSourcePreparationTrigger,
  getCanonicalSam31EightMinuteSourcePreparationQualificationRef,
  getCanonicalSam31EightMinuteSourcePreparationReleaseRef,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-admission-owner'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const observedAt = '2026-08-13T16:00:00.000Z'
const now = '2026-08-13T16:05:00.000Z'
const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    assert.equal(hashBuffer(input.body), input.contentSha256)
    const existing = objects.get(input.objectPath)
    if (existing) {
      assert.deepEqual(existing, input.body)
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

const sourceRepository =
  createCanonicalSam31EightMinuteQualificationSourceRepository({
    objectPort,
    prefix: 'private/smoke/sam31-source-plan',
  })
const plan = buildCanonicalSam31EightMinuteQualificationSourcePlan({
  qualificationSourceId: 'sam31-eight-minute-performance-source-v1',
  exactSourceObjectRef: ref(
    'sam31-private-real-source-object-generation-1779933335766660',
    'c13eda5816aba31ed60f5dce838d178ed8307f825972eec7aacf9fb29d8c47cb',
  ),
  exactSourceReadAuthorityRef: ref(
    'sam31-private-real-source-exact-reread-authority',
    hash('source-read'),
  ),
  plannedAt: '2026-08-13T15:00:00.000Z',
})
assert.equal(await sourceRepository.persistPlanCreateOnly({ plan }), 'created')

const qualification =
  createCanonicalSam31EightMinuteSourcePreparationQualification({
    qualificationId: 'sam31-eight-minute-source-prep-image-qualification-v1',
    projectId: 'reeditpro',
    region: 'us-central1',
    routeId: 'l4_standard_primary',
    routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
    operationId: 'tool.ffmpeg.prepare_sam3_1_qualification_source_chunks.v1',
    cloudRunJobName: 'weeditpro-sam31-source-prep-l4',
    cloudRunJobResource:
      'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4',
    immutableImageRef: ref('sam31-source-prep-image', hash('image')),
    immutableImageDigest: `sha256:${hash('image')}`,
    sourceCommitSha: 'a'.repeat(40),
    sourceTreeSha: 'b'.repeat(40),
    dockerfileSha256: hash('dockerfile'),
    sourceProvenanceLockSha256: hash('source-provenance-lock'),
    fixedProcessPortSha256: hash('port'),
    fixedWorkerEntrypointSha256: hash('entrypoint'),
    imageBuildRef: ref('image-build', hash('image-build')),
    spdx23SbomRef: ref('sbom', hash('sbom')),
    vulnerabilityScanRef: ref('vulnerability-scan', hash('vulnerability')),
    signatureVerificationRef: ref('signature', hash('signature')),
    slsaProvenanceRef: ref('slsa-provenance', hash('slsa')),
    fourKPreparationQualificationRunRef:
      ref('4k-qualification-run', hash('4k-run')),
    actualNvidiaL4Observed: true,
    exactlyOneL4Allocated: true,
    ffmpegCudaNvdecDecodeVerified: true,
    ffmpegNvencH264EncodeVerified: true,
    ffprobeMetadataOnlyVerified: true,
    exact3840x2160At24FpsPreserved: true,
    exact49ChunkFrameAccountingVerified: true,
    exactOneFrameOverlapVerified: true,
    sourceAudioRemovalVerified: true,
    immutableImageDigestRereadVerified: true,
    spdx23SbomRereadVerified: true,
    criticalHighOrUnknownVulnerabilitiesAbsent: true,
    kmsSignatureVerified: true,
    slsaProvenanceVerified: true,
    substantiveCpuMediaProcessingUsed: false,
    runtimeModelOrToolDownloadPerformed: false,
    callerPathUrlBytesCommandModelOrEnvironmentAccepted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt: '2026-08-13T15:30:00.000Z',
  })
assert.deepEqual(
  assertCanonicalSam31EightMinuteSourcePreparationQualification(qualification),
  qualification,
)

const release = createCanonicalSam31EightMinuteSourcePreparationRelease({
  releaseId: 'sam31-eight-minute-source-prep-release-v1',
  qualification,
  releasedAt: '2026-08-13T15:45:00.000Z',
  expiresAt: '2026-08-14T15:45:00.000Z',
})
assert.equal(release.minimumIdleInstances, 0)
assert.equal(release.maximumAttempts, 1)
assert.equal(release.substantiveCpuMediaProcessingAllowed, false)
assert.equal(release.runtimeDownloadAllowed, false)
assert.deepEqual(
  assertCanonicalSam31EightMinuteSourcePreparationRelease(release, now),
  release,
)

const authorityRepository =
  createCanonicalSam31EightMinuteSourcePreparationAuthorityRepository({
    objectPort,
    prefix: 'private/smoke/sam31-source-prep-authority',
  })
assert.equal(await authorityRepository.persistQualificationCreateOnly({
  qualification,
}), 'created')
assert.equal(await authorityRepository.persistQualificationCreateOnly({
  qualification,
}), 'identical_replay')
assert.deepEqual(await authorityRepository.rereadQualification({
  qualificationRef:
    getCanonicalSam31EightMinuteSourcePreparationQualificationRef(
      qualification,
    ),
}), qualification)
assert.equal(await authorityRepository.persistReleaseCreateOnly({ release }),
  'created')
assert.deepEqual(await authorityRepository.rereadRelease({
  releaseRef: getCanonicalSam31EightMinuteSourcePreparationReleaseRef(release),
}), release)

const rate = await observeCanonicalCurrentGoogleCloudGpuRateAuthority({
  rateAuthorityId: 'current-rate-l4-standard-primary-v1',
  rateAuthorityVersion: 1,
  routeId: 'l4_standard_primary',
  region: 'us-central1',
  readPort: { async readCurrentRouteRate() { return rawRate() } },
})
const currentRateAuthorityRef = ref(
  rate.rateAuthorityId,
  rate.rateAuthorityHash,
  rate.rateAuthorityVersion,
)
const rateRepository = {
  async rereadApprovedCurrentRate(input: {
    rateAuthorityRef: ReturnType<typeof ref>
    routeId: 'l4_standard_primary'
    at: string
  }) {
    assert.deepEqual(input.rateAuthorityRef, currentRateAuthorityRef)
    assert.equal(input.routeId, 'l4_standard_primary')
    assert.equal(input.at, now)
    return structuredClone(rate)
  },
}
const owner = createCanonicalSam31EightMinuteSourcePreparationAdmissionOwner({
  sourceRepository,
  authorityRepository,
  rateRepository,
  releaseRef: getCanonicalSam31EightMinuteSourcePreparationReleaseRef(release),
  currentRateAuthorityRef,
  now: () => now,
})
assert.equal(owner.minimumIdleInstances, 0)
assert.equal(owner.customerCreditMutationAllowed, false)
assert.equal(owner.callerReleaseRateBudgetOrSourceCoordinatesAccepted, false)

const trigger = createCanonicalSam31EightMinuteSourcePreparationTrigger({
  invocationId: 'sam31-eight-minute-source-prep-attempt-1',
  qualificationSourceId: plan.qualificationSourceId,
  userTriggerRecordRef: ref('private-qualification-trigger', hash('trigger')),
  idempotencyKey: 'sam31-eight-minute-source-prep-idempotency-1',
  triggeredAt: '2026-08-13T16:04:00.000Z',
})
assert.deepEqual(
  assertCanonicalSam31EightMinuteSourcePreparationTrigger(trigger),
  trigger,
)
const admitted = await owner.admitOneShot(trigger)
assert.equal(admitted.status, 'ready')
assert.equal(admitted.disposition, 'created')
assert.equal(admitted.admission.maximumAttempts, 1)
assert.equal(admitted.admission.uncertainOutcomeRetryAllowed, false)
assert.equal(admitted.admission.userTriggeredScaleFromZero, true)
assert.equal(admitted.admission.minimumIdleInstances, 0)
assert.equal(admitted.admission.customerCreditReservationRequired, false)
assert.equal(admitted.admission.customerCreditsMutated, false)
assert.equal(admitted.admission.productionAuthorityGranted, false)
assert.ok(admitted.admission.maximumPlatformInternalCostUsdNanos > 0)
assert.ok(admitted.admission.maximumPlatformInternalCostUsdNanos <=
  admitted.admission.maximumApprovedInternalBudgetUsdNanos)
assert.deepEqual(
  assertCanonicalSam31EightMinuteSourcePreparationAdmission(
    admitted.admission,
    now,
  ),
  admitted.admission,
)
assert.equal((await owner.admitOneShot(trigger)).disposition,
  'identical_replay')

const consumption = createCanonicalSam31EightMinuteSourcePreparationConsumption({
  admission: admitted.admission,
  idempotencyKey: trigger.idempotencyKey,
  consumedAt: '2026-08-13T16:06:00.000Z',
})
assert.equal(await authorityRepository.consumeAdmissionCreateOnly({
  consumption,
}), 'created')
const consumed = await authorityRepository.rereadConsumedAdmission({
  invocationId: trigger.invocationId,
})
assert.ok(consumed)
assert.equal(consumed?.exactCreateOnlyRecordsReread, true)
assert.equal(consumed?.admission.admissionHash,
  admitted.admission.admissionHash)
assert.equal(consumed?.release.releaseHash, release.releaseHash)
assert.equal(consumed?.qualification.qualificationHash,
  qualification.qualificationHash)
await assert.rejects(() => authorityRepository.consumeAdmissionCreateOnly({
  consumption,
}))

assert.throws(() => assertCanonicalSam31EightMinuteSourcePreparationTrigger({
  ...trigger,
  triggerHash: hash('tampered-trigger'),
}))
assert.throws(() => assertCanonicalSam31EightMinuteSourcePreparationAdmission({
  ...admitted.admission,
  maximumAttempts: 2,
}))
assert.throws(() => createCanonicalSam31EightMinuteSourcePreparationConsumption({
  admission: admitted.admission,
  idempotencyKey: 'wrong-idempotency',
  consumedAt: '2026-08-13T16:06:00.000Z',
}))
assert.throws(() => createCanonicalSam31EightMinuteSourcePreparationTrigger({
  invocationId: 'sam31-eight-minute-source-prep-attempt-2',
  qualificationSourceId: plan.qualificationSourceId,
  userTriggerRecordRef: ref('trigger-2', hash('trigger-2')),
  idempotencyKey: 'sam31-eight-minute-source-prep-idempotency-2',
  triggeredAt: '2026-08-13T16:04:00.000Z',
  sourceUrl: 'https://caller.invalid/source.mp4',
} as never))

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-eight-minute-source-preparation-admission-owner',
  checks: 48,
  routeId: admitted.admission.routeId,
  maximumAttempts: admitted.admission.maximumAttempts,
  minimumIdleInstances: admitted.admission.minimumIdleInstances,
  accountEffectiveRateBound: true,
  maximumPlatformInternalCostUsdNanos:
    admitted.admission.maximumPlatformInternalCostUsdNanos,
  createOnlyConsumptionVerified: true,
  unknownOutcomeRetryAllowed: false,
  substantiveCpuMediaProcessingAllowed: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function rawRate(): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    component('cloud_run_l4_gpu_second', 'gpu_second', 186_700, '1'),
    component('cloud_run_vcpu_second', 'vcpu_second', 18_000, '2'),
    component('cloud_run_memory_gib_second', 'gib_second', 2_000, '3'),
    component('private_object_storage_gib_month', 'gib_month', 20_000_000, '4'),
    component('network_egress_gib', 'gib', 120_000_000, '5'),
    component('object_class_a_per_1000', 'per_1000_operations', 5_000_000, '6'),
    component('object_class_b_per_1000', 'per_1000_operations', 400_000, '7'),
  ]
  const base = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-scope', hash('billing-scope')),
    pricingReaderConfigurationRef:
      ref('pricing-reader', hash('pricing-reader')),
    routeId: 'l4_standard_primary' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('price-record-set', hash('price-record-set')),
    pricingReadStartedAt: '2026-08-13T15:59:55.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return { ...base, pricingReadDigestSha256: sha256AuthorityValue(base) }
}

function component(
  componentClass:
    | 'cloud_run_l4_gpu_second' | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second' | 'private_object_storage_gib_month'
    | 'network_egress_gib' | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'gpu_second' | 'vcpu_second' | 'gib_second' | 'gib_month'
    | 'gib' | 'per_1000_operations',
  price: number,
  suffix: string,
) {
  const cloudServiceId = componentClass.startsWith('cloud_run')
    ? 'service-cloud-run' : 'service-cloud-storage'
  const skuId = `sku-${componentClass}`
  return {
    componentClass,
    cloudServiceName: cloudServiceId,
    skuRateBindingId: `binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
      skuId,
      quantityPerBillingUnit: 1,
      consumptionModel: 'default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: price,
      }],
      maximumContractPriceUsdNanos: price,
      skuMetadataRef: ref(`sku-metadata-${suffix}`, hash(`sku-${suffix}`)),
      billingAccountPriceRef:
        ref(`billing-price-${suffix}`, hash(`price-${suffix}`)),
    }],
    skuDescriptionDigestSha256: hash(`description-${suffix}`),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: price,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${suffix}`, hash(`record-${suffix}`)),
  }
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function hashBuffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function ref(id: string, value: string, version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${value}` as const,
  }
}
