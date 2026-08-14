import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  buildCanonicalSam31EightMinuteQualificationSourcePlan,
  buildCanonicalSam31EightMinuteQualificationSourcePreparation,
  createCanonicalSam31EightMinuteQualificationSourceRepository,
} from '../services/canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  createCanonicalSam31EightMinuteSourcePreparationAdmissionOwner,
  createCanonicalSam31EightMinuteSourcePreparationAuthorityRepository,
  createCanonicalSam31EightMinuteSourcePreparationConsumption,
  createCanonicalSam31EightMinuteSourcePreparationQualification,
  createCanonicalSam31EightMinuteSourcePreparationRelease,
  createCanonicalSam31EightMinuteSourcePreparationTrigger,
  getCanonicalSam31EightMinuteSourcePreparationReleaseRef,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-admission-owner'
import {
  assertCanonicalSam31EightMinuteSourcePreparationLaunch,
  createCanonicalSam31EightMinuteSourcePreparationLaunchRepository,
  getCanonicalSam31EightMinuteSourcePreparationCloudRunJobDefinitionRef,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-launch-owner'
import {
  assertCanonicalSam31EightMinuteSourcePreparationTerminal,
  createCanonicalSam31EightMinuteSourcePreparationTerminalOwner,
  createCanonicalSam31EightMinuteSourcePreparationTerminalRepository,
  createGoogleCloudRunSam31EightMinuteSourcePreparationTerminalPort,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-terminal-owner'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const observedAt = '2026-08-13T16:00:00.000Z'
const admittedAt = '2026-08-13T16:05:00.000Z'
const terminalAt = '2026-08-13T16:10:00.000Z'
const invocationId = 'sam31-source-prep-terminal-smoke-1'
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
    prefix: 'private/smoke/sam31-source-terminal-source',
  })
const plan = buildCanonicalSam31EightMinuteQualificationSourcePlan({
  qualificationSourceId: 'sam31-eight-minute-performance-source-v1',
  exactSourceObjectRef: ref(
    'sam31-private-real-source-object-generation-1779933335766660',
    'c13eda5816aba31ed60f5dce838d178ed8307f825972eec7aacf9fb29d8c47cb',
  ),
  exactSourceReadAuthorityRef: ref('source-reread', hash('source-reread')),
  plannedAt: '2026-08-13T15:00:00.000Z',
})
assert.equal(await sourceRepository.persistPlanCreateOnly({ plan }), 'created')

const qualification = createQualification()
const release = createCanonicalSam31EightMinuteSourcePreparationRelease({
  releaseId: 'sam31-eight-minute-source-prep-release-v1',
  qualification,
  releasedAt: '2026-08-13T15:45:00.000Z',
  expiresAt: '2026-08-14T15:45:00.000Z',
})
const authorityRepository =
  createCanonicalSam31EightMinuteSourcePreparationAuthorityRepository({
    objectPort,
    prefix: 'private/smoke/sam31-source-terminal-authority',
  })
assert.equal(await authorityRepository.persistQualificationCreateOnly({
  qualification,
}), 'created')
assert.equal(await authorityRepository.persistReleaseCreateOnly({ release }),
  'created')

const rate = await observeCanonicalCurrentGoogleCloudGpuRateAuthority({
  rateAuthorityId: 'current-rate-l4-standard-primary-v1',
  rateAuthorityVersion: 1,
  routeId: 'l4_standard_primary',
  region: 'us-central1',
  readPort: { async readCurrentRouteRate() { return rawRate() } },
})
const rateRef = ref(rate.rateAuthorityId, rate.rateAuthorityHash,
  rate.rateAuthorityVersion)
const rateRepository = {
  async rereadApprovedCurrentRate(input: {
    rateAuthorityRef: ReturnType<typeof ref>
    routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback'
      | 'l4_standard_primary'
    at: string
  }) {
    assert.deepEqual(input.rateAuthorityRef, rateRef)
    assert.equal(input.routeId, 'l4_standard_primary')
    return structuredClone(rate)
  },
}
const admissionOwner =
  createCanonicalSam31EightMinuteSourcePreparationAdmissionOwner({
    sourceRepository,
    authorityRepository,
    rateRepository,
    releaseRef: getCanonicalSam31EightMinuteSourcePreparationReleaseRef(
      release,
    ),
    currentRateAuthorityRef: rateRef,
    now: () => admittedAt,
  })
const trigger = createCanonicalSam31EightMinuteSourcePreparationTrigger({
  invocationId,
  qualificationSourceId: plan.qualificationSourceId,
  userTriggerRecordRef: ref('terminal-smoke-trigger', hash('trigger')),
  idempotencyKey: 'sam31-source-prep-terminal-smoke-idempotency-1',
  triggeredAt: '2026-08-13T16:04:00.000Z',
})
const admitted = await admissionOwner.admitOneShot(trigger)
const consumption = createCanonicalSam31EightMinuteSourcePreparationConsumption({
  admission: admitted.admission,
  idempotencyKey: trigger.idempotencyKey,
  consumedAt: '2026-08-13T16:05:01.000Z',
})
assert.equal(await authorityRepository.consumeAdmissionCreateOnly({
  consumption,
}), 'created')

const jobDefinition = createJobDefinition()
const jobDefinitionRef =
  getCanonicalSam31EightMinuteSourcePreparationCloudRunJobDefinitionRef({
    untrusted: jobDefinition,
    release,
  })
const launchPayload = {
  schemaVersion:
    'canonical-sam3_1-eight-minute-source-preparation-launch-v1' as const,
  source:
    'canonical_server_sam3_1_eight_minute_source_preparation_launch_owner' as const,
  evidenceClass: 'canonical_private_cloud_run_launch_observation' as const,
  invocationId,
  admissionRef: ref(admitted.admission.admissionId,
    admitted.admission.admissionHash),
  consumptionRef: ref(`${invocationId}:consumption`,
    consumption.consumptionHash),
  releaseRef: admitted.admission.releaseRef,
  immutableImageRef: admitted.admission.immutableImageRef,
  cloudRunJobDefinitionRef: jobDefinitionRef,
  cloudJobCreateRequestRef: ref(`${invocationId}:cloud-job-create`,
    hash('cloud-job-create')),
  cloudRunOperationResource:
    'projects/reeditpro/locations/us-central1/operations/terminal-smoke-op-1',
  cloudRunOperationRef: ref(`${invocationId}:cloud-run-operation`,
    hash('cloud-run-operation')),
  disposition: 'accepted' as const,
  substantiveWorkOutcomeAtAcceptance: 'unknown' as const,
  costOutcomeAtAcceptance: 'unknown' as const,
  projectId: 'reeditpro' as const,
  region: 'us-central1' as const,
  cloudRunJobResource:
    'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4' as const,
  routeId: 'l4_standard_primary' as const,
  accelerator: 'nvidia_l4' as const,
  maximumAttempts: 1 as const,
  createOnlyAdmissionConsumedBeforeCloudRunCall: true as const,
  automaticRetryAllowed: false as const,
  callerCloudResourceImageCommandArgsOrEnvironmentAccepted: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  observedAt: '2026-08-13T16:05:02.000Z',
}
const launch = assertCanonicalSam31EightMinuteSourcePreparationLaunch({
  ...launchPayload,
  launchHash: sha256AuthorityValue(launchPayload),
})
const launchRepository =
  createCanonicalSam31EightMinuteSourcePreparationLaunchRepository({
    objectPort,
    prefix: 'private/smoke/sam31-source-terminal-launch',
  })
assert.equal(await launchRepository.persistCreateOnly({ launch }), 'created')

const preparation =
  buildCanonicalSam31EightMinuteQualificationSourcePreparation({
    preparationId: `${plan.qualificationSourceId}:preparation:${invocationId}`,
    plan,
    disposition: 'ready',
    preparedChunks: createPreparedChunks(),
    preparedAt: '2026-08-13T16:08:25.000Z',
  })
assert.equal(await sourceRepository.persistPreparationCreateOnly({
  preparation,
}), 'created')

let cloudReads = 0
const terminalPort =
  createGoogleCloudRunSam31EightMinuteSourcePreparationTerminalPort({
    now: () => terminalAt,
    auth: { async request(request) {
      cloudReads += 1
      const url = String((request as { url?: string }).url ?? '')
      if (url.endsWith('/operations/terminal-smoke-op-1')) return {
        data: {
          name: launch.cloudRunOperationResource,
          done: true,
          response: { name: executionResource() },
        },
      } as never
      if (url.endsWith(`/v2/${executionResource()}`)) return {
        data: successfulExecution(),
      } as never
      if (url.endsWith('/jobs/weeditpro-sam31-source-prep-l4')) return {
        data: jobDefinition,
      } as never
      if (url.endsWith(
        '/jobs/weeditpro-sam31-source-prep-l4/executions?pageSize=100',
      )) return { data: { executions: [{
        name: executionResource(), reconciling: false, runningCount: 0,
      }] } } as never
      throw new Error(`unexpected terminal URL ${url}`)
    } },
  })
const terminalRepository =
  createCanonicalSam31EightMinuteSourcePreparationTerminalRepository({
    objectPort,
    prefix: 'private/smoke/sam31-source-terminal-record',
  })
const owner = createCanonicalSam31EightMinuteSourcePreparationTerminalOwner({
  authorityRepository,
  launchRepository,
  sourceRepository,
  rateRepository,
  terminalPort,
  terminalRepository,
})
assert.equal(owner.automaticRetryAllowed, false)
assert.equal(owner.customerCreditMutationAllowed, false)
const ready = await owner.reconcile({ invocationId })
assert.equal(ready.status, 'ready')
assert.equal(cloudReads, 4)
if (ready.status !== 'ready') throw new Error('terminal result missing')
assert.equal(ready.disposition, 'created')
assert.equal(ready.sourcePreparationReadyForA100QualificationInput, true)
assert.equal(ready.billingExportInvoiceReconciliationRequired, true)
assert.equal(ready.actualInvoiceCostClaimed, false)
assert.equal(ready.customerCreditsMutated, false)
assert.equal(ready.productionAuthorityGranted, false)
assert.ok(
  ready.provisionalAccountEffectiveInfrastructureCostCeilingUsdNanos > 0,
)
assert.ok(
  ready.provisionalAccountEffectiveInfrastructureCostCeilingUsdNanos <=
    admitted.admission.maximumApprovedInternalBudgetUsdNanos,
)
const exact = await terminalRepository.reread({ invocationId })
assert.ok(exact)
assert.equal(exact?.exactPreparedChunkCount, 49)
assert.equal(exact?.usage.coldStartMilliseconds, 30_000)
assert.equal(exact?.usage.activeGpuMilliseconds, 180_000)
assert.equal(exact?.usage.totalBillableMilliseconds, 210_000)
assert.equal(exact?.usage.allocatedGpuCount, 1)
assert.equal(exact?.usage.allocatedVcpuCount, 8)
assert.equal(exact?.usage.allocatedMemoryGiB, 32)
assert.equal(exact?.usage.classAOperationCount, 2_000)
assert.equal(exact?.usage.classBOperationCount, 2_000)
assert.equal(exact?.activeGpuExecutionsAfterObservation, 0)
assert.equal(exact?.scaleBackToZeroVerified, true)
assert.equal(exact?.actualInvoiceCostClaimed, false)
assert.equal(exact?.customerEligibleToolCostCredits, 0)
assert.deepEqual(assertCanonicalSam31EightMinuteSourcePreparationTerminal(
  exact,
), exact)
const replay = await owner.reconcile({ invocationId })
assert.equal(replay.status, 'ready')
assert.equal(cloudReads, 4)
if (replay.status !== 'ready') throw new Error('terminal replay missing')
assert.equal(replay.disposition, 'identical_replay')

const missing = await owner.reconcile({
  invocationId: 'sam31-source-prep-terminal-missing-launch',
})
assert.equal(missing.status, 'pending')
await assert.rejects(() => owner.reconcile({ invocationId, extra: true }))

let pendingReads = 0
const pendingPort =
  createGoogleCloudRunSam31EightMinuteSourcePreparationTerminalPort({
    now: () => terminalAt,
    auth: { async request() {
      pendingReads += 1
      return { data: {
        name: launch.cloudRunOperationResource,
        done: false,
      } } as never
    } },
  })
assert.equal((await pendingPort.reread({ launch, release })).disposition,
  'pending')
assert.equal(pendingReads, 1)

const tampered = structuredClone(exact!)
tampered.activeGpuExecutionsAfterObservation = 1 as 0
assert.throws(() =>
  assertCanonicalSam31EightMinuteSourcePreparationTerminal(tampered))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-eight-minute-source-preparation-terminal-owner',
  checks: 46,
  cloudTerminalReadCount: cloudReads,
  exactPreparedChunkCount: exact?.exactPreparedChunkCount,
  totalBillableMilliseconds: exact?.usage.totalBillableMilliseconds,
  accountEffectiveCostCeilingUsdNanos:
    ready.provisionalAccountEffectiveInfrastructureCostCeilingUsdNanos,
  scaleBackToZeroVerified: exact?.scaleBackToZeroVerified,
  actualInvoiceCostClaimed: false,
  billingExportInvoiceReconciliationRequired: true,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function createQualification() {
  return createCanonicalSam31EightMinuteSourcePreparationQualification({
    qualificationId: 'sam31-source-prep-image-qualification-v1',
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
    vulnerabilityScanRef: ref('vulnerability', hash('vulnerability')),
    signatureVerificationRef: ref('signature', hash('signature')),
    slsaProvenanceRef: ref('slsa', hash('slsa')),
    fourKPreparationQualificationRunRef: ref('4k-run', hash('4k-run')),
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
}

function createPreparedChunks() {
  return Array.from({ length: 49 }, (_, index) => {
    const ordinal = index + 1
    const start = index * 239
    const end = Math.min(11_519, start + 239)
    const chunkHash = hash(`prepared-chunk-${ordinal}`)
    return {
      chunkOrdinal: ordinal,
      canonicalStartFrameInclusive: start,
      canonicalEndFrameInclusive: end,
      overlapWithPreviousFrames: index === 0 ? 0 as const : 1 as const,
      preparedChunkArtifactRef: ref(`prepared-chunk-${ordinal}`, chunkHash),
      exactSourceRangeMappingRef:
        ref(`chunk-map-${ordinal}`, hash(`map-${ordinal}`)),
      ffprobeEvidenceRef:
        ref(`chunk-ffprobe-${ordinal}`, hash(`ffprobe-${ordinal}`)),
      gpuPreparationEvidenceRef:
        ref(`chunk-l4-${ordinal}`, hash(`l4-${ordinal}`)),
      privateCoordinate: {
        bucketName: 'reeditpro-production-reeditpro-masks' as const,
        objectName:
          `private/canonical-professional-gpu/sam3_1/v1/smoke/chunk-${String(
            ordinal,
          ).padStart(3, '0')}.mp4`,
        generation: String(ordinal),
        etagSha256: hash(`etag-${ordinal}`),
      },
      byteLength: 1_000_000 + ordinal,
      sha256: chunkHash,
      decodedFrameCount: end - start + 1,
    }
  })
}

function createJobDefinition() {
  return {
    name:
      'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4',
    uid: 'sam31-source-prep-l4-job-uid',
    generation: '1',
    updateTime: '2026-08-13T15:50:00.000Z',
    labels: {
      app: 'weeditpro', operation: 'sam31-source-preparation',
      route: 'l4-standard-primary', scale: 'zero',
    },
    template: {
      parallelism: 1,
      taskCount: 1,
      template: {
        containers: [{
          image:
            `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-source-preparation-l4@${qualification.immutableImageDigest}`,
          command: ['/nodejs/bin/node'],
          args: [
            '/app/dist-server/weeditpro-sam3_1-eight-minute-source-preparation-worker.js',
          ],
          env: [
            { name: 'REEDITPRO_ENV', value: 'production' },
            { name: 'WORKER_GROUP', value: 'l4_standard_primary' },
            { name: 'GCS_CONTROL_PLANE_STATE_BUCKET',
              value: 'reeditpro-production-reeditpro-control-plane-state' },
          ],
          resources: { limits: {
            cpu: '8', memory: '32Gi', 'nvidia.com/gpu': '1',
          } },
          volumeMounts: [{
            name: 'weeditpro-sam31-source-prep-scratch',
            mountPath: '/mnt/weeditpro-private/l4-visual-evidence',
          }],
        }],
        volumes: [{
          name: 'weeditpro-sam31-source-prep-scratch',
          emptyDir: { medium: 'MEMORY', sizeLimit: '24Gi' },
        }],
        maxRetries: 0,
        timeout: '3600s',
        serviceAccount:
          'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
        nodeSelector: { 'run.googleapis.com/accelerator': 'nvidia-l4' },
        gpuZonalRedundancyDisabled: true,
      },
    },
  }
}

function executionResource() {
  return 'projects/reeditpro/locations/us-central1/jobs/'
    + 'weeditpro-sam31-source-prep-l4/executions/terminal-smoke-execution-1'
}

function successfulExecution() {
  return {
    name: executionResource(),
    job:
      'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4',
    createTime: '2026-08-13T16:05:01.000Z',
    startTime: '2026-08-13T16:05:31.000Z',
    completionTime: '2026-08-13T16:08:31.000Z',
    taskCount: 1,
    reconciling: false,
    runningCount: 0,
    succeededCount: 1,
    failedCount: 0,
    cancelledCount: 0,
    retriedCount: 0,
    conditions: [{ type: 'Completed', state: 'CONDITION_SUCCEEDED' }],
  }
}

function rawRate(): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    component('cloud_run_l4_gpu_second', 'gpu_second', 186_700, '1'),
    component('cloud_run_vcpu_second', 'vcpu_second', 18_000, '2'),
    component('cloud_run_memory_gib_second', 'gib_second', 2_000, '3'),
    component('private_object_storage_gib_month', 'gib_month',
      20_000_000, '4'),
    component('network_egress_gib', 'gib', 120_000_000, '5'),
    component('object_class_a_per_1000', 'per_1000_operations',
      5_000_000, '6'),
    component('object_class_b_per_1000', 'per_1000_operations',
      400_000, '7'),
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
  return {
    componentClass,
    cloudServiceName: cloudServiceId,
    skuRateBindingId: `binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
      skuId: `sku-${componentClass}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0', contractPriceUsdNanos: price,
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
  return { id, version, contentHash: `sha256:${value}` as const }
}
