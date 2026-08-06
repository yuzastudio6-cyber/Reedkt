import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  OrchestraEvidenceRef,
} from '../../src/types/orchestra-skill-capability'
import {
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  createCanonicalSkillQualificationRegistry,
} from '../orchestra/canonical-skill-qualification-registry'
import {
  orchestraDigest,
  orchestraEvidenceRef,
} from '../orchestra/orchestra-skill-capability-contract'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31GpuRuntimeReleaseRegistryRecord,
  canonicalSam31GpuRuntimeReleaseRef,
  type CanonicalSam31GpuRuntimeReleaseRegistryRecord,
} from '../services/canonical-sam3_1-gpu-runtime-release-registry'
import {
  createCanonicalTrackAllSam31ArtifactRepositoryRelease,
  createCanonicalTrackAllSam31ArtifactRepositoryReleaseRepository,
  canonicalTrackAllSam31ArtifactRepositoryReleaseRef,
} from '../services/canonical-track-all-sam3_1-artifact-repository-release'
import {
  createCanonicalTrackAllSam31L4TaskQaDeploymentObservation,
  createCanonicalTrackAllSam31L4TaskQaImageQualification,
  canonicalTrackAllSam31L4TaskQaImageQualificationRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalSam31GpuRuntimeReleaseObservation,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-release'
import {
  createTrackAllSam31OrchestraQualificationSnapshot,
  TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS,
} from '../workers/masks/track-all-sam3_1-orchestra-capability-manifest'
import {
  assertTrackAllSam31OrchestraQualificationPublicationReceipt,
  parsePublishedTrackAllSam31Qualification,
  publishTrackAllSam31OrchestraQualification,
} from '../workers/masks/track-all-sam3_1-orchestra-qualification-publisher'
import { record as a100Record } from
  './canonical-sam3_1-gpu-runtime-release-registry-smoke'
import {
  image as baseL4TaskQaImage,
  observation as baseL4TaskQaObservation,
} from
  './canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher-smoke'

let checks = 0
function check(condition: unknown, message?: string): void {
  assert.ok(condition, message)
  checks += 1
}

const observedAt = '2026-08-05T12:15:00.000Z'
const l4RuntimeRecord = createL4RuntimeRecord(a100Record)
const a100RuntimeReleaseRef = canonicalSam31GpuRuntimeReleaseRef(
  a100Record.runtimeRelease,
)
const l4FallbackRuntimeReleaseRef = canonicalSam31GpuRuntimeReleaseRef(
  l4RuntimeRecord.runtimeRelease,
)

const a100Rate = await createRate('a100_80gb_heavy_primary')
const l4FallbackRate = await createRate('l4_heavy_fallback')
const l4TaskQaRate = await createRate('l4_standard_primary')
const a100RateAuthorityRef = rateRef(a100Rate)
const l4FallbackRateAuthorityRef = rateRef(l4FallbackRate)
const l4TaskQaRateAuthorityRef = rateRef(l4TaskQaRate)

const l4TaskQaImagePayload = structuredClone(baseL4TaskQaImage)
Reflect.deleteProperty(l4TaskQaImagePayload, 'qualificationHash')
const l4TaskQaImage = createCanonicalTrackAllSam31L4TaskQaImageQualification({
  ...l4TaskQaImagePayload,
  accountEffectiveL4RateCompatibilityRef: l4TaskQaRateAuthorityRef,
})
const l4TaskQaImageQualificationRef =
  canonicalTrackAllSam31L4TaskQaImageQualificationRef(l4TaskQaImage)
const l4TaskQaObservationPayload = structuredClone(baseL4TaskQaObservation)
Reflect.deleteProperty(l4TaskQaObservationPayload, 'observationHash')
const l4TaskQaObservation =
  createCanonicalTrackAllSam31L4TaskQaDeploymentObservation({
    ...l4TaskQaObservationPayload,
    imageQualificationRef: l4TaskQaImageQualificationRef,
  })
const l4TaskQaRuntimeReleaseRef = l4TaskQaObservation.release.releaseRef

const repositoryObjectPort = memoryObjectPort()
const artifactRepository =
  createCanonicalTrackAllSam31ArtifactRepositoryReleaseRepository({
    objectPort: repositoryObjectPort,
    prefix: 'private/smoke/track-all/sam3_1/repository-release',
  })
const artifactRepositoryRelease =
  createCanonicalTrackAllSam31ArtifactRepositoryRelease({
    schemaVersion:
      'canonical-track-all-sam3_1-artifact-repository-release-v1',
    source:
      'canonical_server_track_all_sam3_1_artifact_repository_release_owner',
    evidenceClass: 'canonical_private_create_only_exact_reread',
    status: 'private_internal_qualified',
    releaseId: 'track-all-sam3_1-artifact-repositories-release-1',
    releaseVersion: 1,
    componentRepositoryVersions: {
      taskContextRepository:
        'canonical-sam3_1-gpu-task-context-repository-v1',
      taskStore: 'canonical-sam3_1-gpu-task-store-v1',
      runtimeResultStore:
        'canonical-sam3_1-gpu-runtime-result-store-v1',
      taskQaRepository:
        'canonical-track-all-sam3_1-task-qa-repository-v1',
      captionSceneEvidenceRepository:
        'canonical-track-all-sam3_1-caption-scene-evidence-repository-v1',
      captionTrackAllEvidenceRepository:
        'canonical-caption-track-all-evidence-repository-v2',
    },
    componentQualificationRefs: {
      taskContextRepository: ref('task-context-repository-qualification'),
      taskStore: ref('task-store-qualification'),
      runtimeResultStore: ref('runtime-result-store-qualification'),
      taskQaRepository: ref('task-qa-repository-qualification'),
      captionSceneEvidenceRepository:
        ref('caption-scene-evidence-repository-qualification'),
      captionTrackAllEvidenceRepository:
        ref('caption-track-all-evidence-repository-qualification'),
    },
    controlPlaneStateStorageRef: ref('control-plane-storage-qualification'),
    privateMaskArtifactStorageRef:
      ref('private-mask-artifact-storage-qualification'),
    exactCreateOnlyConflictAndIdenticalReplayObserved: true,
    exactReadAfterWriteAndDetachedRereadObserved: true,
    exactWorkspaceSnapshotSceneOutputAndAttemptIsolationObserved: true,
    exactArtifactHashFrameRangeResultAndQaLineageRereadObserved: true,
    browserOrCallerStorageLocationAccepted: false,
    callerRepositoryVersionOrQualificationAccepted: false,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt: '2026-08-05T12:00:00.000Z',
    expiresAt: '2026-09-05T12:00:00.000Z',
  })
const artifactRepositoryReleaseRef =
  canonicalTrackAllSam31ArtifactRepositoryReleaseRef(
    artifactRepositoryRelease,
  )
check(await artifactRepository.persistCreateOnly({
  release: artifactRepositoryRelease,
}) === 'created')
check(await artifactRepository.persistCreateOnly({
  release: structuredClone(artifactRepositoryRelease),
}) === 'identical_replay')
check((await artifactRepository.readExact({
  releaseRef: artifactRepositoryReleaseRef,
}))?.releaseHash === artifactRepositoryRelease.releaseHash)

const registryObjectPort = memoryObjectPort()
const qualificationRegistry = createCanonicalSkillQualificationRegistry({
  objectPort: registryObjectPort,
  prefix: 'private/smoke/orchestra/track-all-qualification',
})
const runtimeRecords = new Map<string, CanonicalSam31GpuRuntimeReleaseRegistryRecord>([
  [refKey(a100RuntimeReleaseRef), a100Record],
  [refKey(l4FallbackRuntimeReleaseRef), l4RuntimeRecord],
])
const rateAuthorities = new Map<string, CanonicalCurrentGoogleCloudGpuRateAuthority>([
  [refKey(a100RateAuthorityRef), a100Rate],
  [refKey(l4FallbackRateAuthorityRef), l4FallbackRate],
  [refKey(l4TaskQaRateAuthorityRef), l4TaskQaRate],
])
const dependencies = {
  runtimeReleaseRegistry: {
    schemaVersion: 'canonical-sam3_1-gpu-runtime-release-registry-v1' as const,
    evidenceClass: 'private_gcs_create_only_exact_reread' as const,
    async rereadReleasePair(input: { runtimeReleaseRef: OrchestraEvidenceRef }) {
      return structuredClone(runtimeRecords.get(refKey(input.runtimeReleaseRef)))
        ?? null
    },
  },
  l4TaskQaReleaseRepository: {
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-runtime-release-evidence-repository-v1' as const,
    async rereadImageQualification(input: {
      imageQualificationRef: OrchestraEvidenceRef
    }) {
      return sameRef(input.imageQualificationRef,
        l4TaskQaImageQualificationRef)
        ? structuredClone(l4TaskQaImage) : null
    },
    async rereadDeploymentObservation(input: {
      runtimeReleaseRef: OrchestraEvidenceRef
    }) {
      return sameRef(input.runtimeReleaseRef, l4TaskQaRuntimeReleaseRef)
        ? structuredClone(l4TaskQaObservation) : null
    },
  },
  rateAuthorityRepository: {
    schemaVersion:
      'canonical-current-google-cloud-gpu-rate-authority-repository-v1' as const,
    evidenceClass:
      'gcs_create_only_exact_reread_account_effective_gpu_rates' as const,
    async rereadApprovedCurrentRate(input: {
      rateAuthorityRef: OrchestraEvidenceRef
      routeId:
        | 'a100_80gb_heavy_primary'
        | 'l4_heavy_fallback'
        | 'l4_standard_primary'
      at: string
    }) {
      const value = rateAuthorities.get(refKey(input.rateAuthorityRef))
      return value?.routeId === input.routeId ? structuredClone(value) : null
    },
  },
  artifactRepositoryReleaseReadPort: artifactRepository,
  qualificationRegistry,
}
const publicationInput = {
  a100RuntimeReleaseRef,
  l4FallbackRuntimeReleaseRef,
  a100RateAuthorityRef,
  l4FallbackRateAuthorityRef,
  l4TaskQaImageQualificationRef,
  l4TaskQaRuntimeReleaseRef,
  artifactRepositoryReleaseRef,
  observedAt,
}

const receipt = await publishTrackAllSam31OrchestraQualification(
  publicationInput,
  dependencies,
)
check(receipt.disposition === 'created')
check(receipt.exactA100AndIndependentL4Sam31ReleaseReread)
check(receipt.exactL4TaskQaImageDeploymentAndScaleZeroReread)
check(receipt.exactBillingAccountEffectiveA100AndL4RateReread)
check(receipt.exactTrackAllResultAndArtifactRepositoryReleaseReread)
check(receipt.exactCanonicalManifestQualificationCreateOnlyReread)
check(receipt.callerCanSelfQualify === false)
check(receipt.gpuJobStarted === false)
check(receipt.providerOrModelExecuted === false)
check(receipt.customerCreditsMutated === false)
check(receipt.qaApprovalGranted === false)
check(receipt.publicDeliveryAuthorized === false)
check(receipt.productionAuthorityGranted === false)
check(stableAuthorityStringify(
  assertTrackAllSam31OrchestraQualificationPublicationReceipt(receipt),
) === stableAuthorityStringify(receipt))

const exact = await qualificationRegistry.readExact({
  manifestRef: receipt.manifestRef,
  qualificationSnapshotRef: receipt.qualificationSnapshotRef,
})
check(exact !== null)
if (!exact) throw new Error('Expected published Track All qualification.')
const published = parsePublishedTrackAllSam31Qualification(exact)
check(published.manifest.qualificationStatus.overall === 'qualified')
check(published.qualificationSnapshot.overall === 'qualified')
check(published.qualificationSnapshot.jobQualifications[0]?.status
  === 'qualified')
check(stableAuthorityStringify(
  published.qualificationSnapshot.jobQualifications[0]?.qualifiedRouteIds,
) === stableAuthorityStringify(Object.values(
  TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS,
).sort(compareUtf16)))
check(published.qualificationSnapshot.jobQualifications[0]
  ?.qualificationEvidenceRefs.length === 8)
check(createTrackAllSam31OrchestraQualificationSnapshot().overall === 'blocked')

const replay = await publishTrackAllSam31OrchestraQualification(
  structuredClone(publicationInput),
  dependencies,
)
check(replay.disposition === 'identical_replay')
check(sameRef(replay.registryRecordRef, receipt.registryRecordRef))

await assert.rejects(publishTrackAllSam31OrchestraQualification({
  ...publicationInput,
  a100RuntimeReleaseRef: ref('missing-a100-runtime-release'),
}, dependencies))
checks += 1
await assert.rejects(publishTrackAllSam31OrchestraQualification({
  ...publicationInput,
  l4FallbackRuntimeReleaseRef: a100RuntimeReleaseRef,
}, dependencies))
checks += 1
await assert.rejects(publishTrackAllSam31OrchestraQualification({
  ...publicationInput,
  l4TaskQaImageQualificationRef: ref('missing-l4-task-qa-image'),
}, dependencies))
checks += 1
await assert.rejects(publishTrackAllSam31OrchestraQualification({
  ...publicationInput,
  a100RateAuthorityRef: l4FallbackRateAuthorityRef,
}, dependencies))
checks += 1
await assert.rejects(publishTrackAllSam31OrchestraQualification({
  ...publicationInput,
  artifactRepositoryReleaseRef: ref('missing-repository-release'),
}, dependencies))
checks += 1
await assert.rejects(publishTrackAllSam31OrchestraQualification({
  ...publicationInput,
  observedAt: '2026-10-05T12:15:00.000Z',
}, dependencies))
checks += 1
await assert.rejects(publishTrackAllSam31OrchestraQualification({
  ...publicationInput,
  callerQualified: true,
}, dependencies))
checks += 1

const crossedArtifact = structuredClone(artifactRepositoryRelease)
crossedArtifact.componentRepositoryVersions.taskStore =
  'canonical-sam3_1-gpu-task-store-v1'
crossedArtifact.expiresAt = '2026-08-05T12:01:00.000Z'
assert.throws(() =>
  createCanonicalTrackAllSam31ArtifactRepositoryRelease(crossedArtifact))
checks += 1
const tamperedReceipt = structuredClone(receipt)
Reflect.set(tamperedReceipt, 'productionAuthorityGranted', true)
assert.throws(() =>
  assertTrackAllSam31OrchestraQualificationPublicationReceipt(
    tamperedReceipt,
  ))
checks += 1

const cliSource = readFileSync(new URL(
  '../cli/publish-track-all-sam3_1-orchestra-qualification.ts',
  import.meta.url,
), 'utf8')
const packageJson = JSON.parse(readFileSync(
  new URL('../../package.json', import.meta.url),
  'utf8',
)) as { scripts?: Record<string, string> }
check(cliSource.includes('createCanonicalSam31GcpGpuRuntimeReleaseRegistry'))
check(cliSource.includes(
  'createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository',
))
check(cliSource.includes(
  'createCanonicalGcsTrackAllSam31ArtifactRepositoryReleaseRepository',
))
check(cliSource.includes('createCanonicalSkillQualificationRegistry'))
check(cliSource.includes(
  'WEEDITPRO_TRACK_ALL_ARTIFACT_REPOSITORY_RELEASE_REF',
))
check(!/callerQualified|callerCanSelfQualify\s*:\s*true/u.test(cliSource))
check(packageJson.scripts?.[
  'publish:track-all-sam3_1-orchestra-qualification'
] === 'tsx server/cli/publish-track-all-sam3_1-orchestra-qualification.ts')

console.log(JSON.stringify({
  smoke: 'track-all-sam3_1-orchestra-qualification-publisher',
  checks,
  exactA100AndIndependentL4Sam31ReleaseReread: true,
  exactL4TaskQaImageDeploymentScaleZeroAndRateReread: true,
  exactBillingAccountEffectiveA100L4AndTaskQaRateReread: true,
  exactTrackAllResultAndArtifactRepositoryReleaseReread: true,
  canonicalQualificationCreateOnlyAndExactReread: true,
  callerSelfQualificationRejected: true,
  missingCrossedAndStaleEvidenceRejected: true,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function createL4RuntimeRecord(
  source: CanonicalSam31GpuRuntimeReleaseRegistryRecord,
): CanonicalSam31GpuRuntimeReleaseRegistryRecord {
  const sourceSpecialized = structuredClone(source.specializedRelease)
  Reflect.deleteProperty(sourceSpecialized, 'releaseObservationHash')
  const specializedBase = sourceSpecialized
  const specializedPayload = {
    ...specializedBase,
    releaseId: 'sam31-compiled-l4-runtime-release',
    route: {
      ...specializedBase.route,
      routeId: 'l4_heavy_fallback' as const,
      gpuProfileId: CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1],
      executionTarget: 'google_cloud_run_l4_job' as const,
      machineType: 'cloud_run_nvidia_l4' as const,
      accelerator: 'nvidia_l4' as const,
      allocatedVcpuCount: 8 as const,
      allocatedMemoryGiB: 32 as const,
      allocatedLocalScratchGiB: 0 as const,
    },
  }
  const specialized = assertCanonicalSam31GpuRuntimeReleaseObservation({
    ...specializedPayload,
    releaseObservationHash: sha256AuthorityValue(specializedPayload),
  })

  const sourceRuntime = structuredClone(source.runtimeRelease)
  Reflect.deleteProperty(sourceRuntime, 'releaseHash')
  const runtimeBase = sourceRuntime
  const runtimePayload = {
    ...runtimeBase,
    releaseId: 'sam31-compiled-l4-runtime-release',
    routeId: 'l4_heavy_fallback' as const,
    executionTarget: 'google_cloud_run_l4_job' as const,
    machineType: 'cloud_run_nvidia_l4' as const,
    accelerator: 'nvidia_l4' as const,
    allocatedVcpuCount: 8 as const,
    allocatedMemoryGiB: 32 as const,
    allocatedLocalScratchGiB: 0 as const,
  }
  const runtimeRelease = canonicalProfessionalToolGpuRuntimeReleaseSchema.parse({
    ...runtimePayload,
    releaseHash: sha256AuthorityValue(runtimePayload),
  })
  const recordPayload = {
    ...source,
    specializedRelease: specialized,
    runtimeRelease,
  }
  Reflect.deleteProperty(recordPayload, 'recordHash')
  return assertCanonicalSam31GpuRuntimeReleaseRegistryRecord({
    ...recordPayload,
    recordHash: sha256AuthorityValue(recordPayload),
  })
}

async function createRate(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
): Promise<CanonicalCurrentGoogleCloudGpuRateAuthority> {
  const raw = rawRate(routeId)
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: routeId === 'a100_80gb_heavy_primary'
      ? 'track-all-current-a100-rate'
      : routeId === 'l4_heavy_fallback'
        ? 'track-all-current-l4-fallback-rate'
        : 'track-all-current-l4-task-qa-rate',
    rateAuthorityVersion: 1,
    routeId,
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() {
        return raw
      },
    },
  })
}

function rawRate(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
): CanonicalGoogleCloudGpuRateRawObservation {
  const compute = routeId === 'a100_80gb_heavy_primary'
    ? [rateComponent('a2_ultragpu_1g_machine_bundle', 'machine_hour', 5_000)]
    : [
        rateComponent('cloud_run_l4_gpu_second', 'gpu_second', 700),
        rateComponent('cloud_run_vcpu_second', 'vcpu_second', 200),
        rateComponent('cloud_run_memory_gib_second', 'gib_second', 100),
      ]
  const components = [
    ...compute,
    rateComponent('private_object_storage_gib_month', 'gib_month', 20),
    rateComponent('network_egress_gib', 'gib', 120),
    rateComponent('object_class_a_per_1000', 'per_1000_operations', 5),
    rateComponent('object_class_b_per_1000', 'per_1000_operations', 1),
  ]
  const base = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-account-pricing-scope'),
    pricingReaderConfigurationRef: ref('gpu-rate-reader-configuration'),
    routeId,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref(`price-record-set-${routeId}`),
    pricingReadStartedAt: '2026-08-05T12:14:50.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return {
    ...base,
    pricingReadDigestSha256: sha256AuthorityValue(base),
  }
}

function rateComponent(
  componentClass:
    | 'a2_ultragpu_1g_machine_bundle'
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'machine_hour'
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  price: number,
) {
  const cloudServiceId = componentClass.startsWith('cloud_run')
    ? 'service-cloud-run'
    : componentClass.startsWith('a2_')
      ? 'service-compute-engine'
      : 'service-cloud-storage'
  return {
    componentClass,
    cloudServiceName: cloudServiceId.replace('service-', ''),
    skuRateBindingId: `rate-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
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
      skuMetadataRef: ref(`sku-metadata-${componentClass}`),
      billingAccountPriceRef: ref(`account-price-${componentClass}`),
    }],
    skuDescriptionDigestSha256: createHash('sha256')
      .update(componentClass).digest('hex'),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: price,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${componentClass}`),
  }
}

function rateRef(authority: CanonicalCurrentGoogleCloudGpuRateAuthority) {
  return {
    id: authority.rateAuthorityId,
    version: authority.rateAuthorityVersion,
    contentHash: `sha256:${authority.rateAuthorityHash}` as const,
  }
}

function ref(id: string): OrchestraEvidenceRef {
  return orchestraEvidenceRef(id, orchestraDigest({ id }))
}

function refKey(value: OrchestraEvidenceRef): string {
  return stableAuthorityStringify(value)
}

function sameRef(left: OrchestraEvidenceRef, right: OrchestraEvidenceRef) {
  return refKey(left) === refKey(right)
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const records = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const prior = records.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      records.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const body = records.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  }
}
