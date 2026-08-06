import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation'
import {
  buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
  canonicalTrackAllSam31L4TaskQaPrivateQualificationRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-private-qualification'
import {
  assertCanonicalTrackAllSam31L4TaskQaImageQualificationOwnerReceipt,
  qualifyCanonicalTrackAllSam31L4TaskQaImage,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-qualification-owner'
import {
  canonicalTrackAllSam31L4TaskQaImageQualificationRef,
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import {
  canonicalImageSecurityReviewRef,
  createCanonicalSam31ImageSecurityReview,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  receipt as basePrivateQualification,
} from './canonical-track-all-sam3_1-l4-task-qa-private-qualification-smoke'

const now = '2026-08-06T10:00:00.000Z'
const imageDigest =
  'sha256:5ccb7b8be3fae729a07cb38663265fe78419f1e273310f57bed092b09b36dd71' as const
const imageUri =
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa@${imageDigest}` as const
const authority = buildAuthority()
const authorityRef = ref(
  authority.authorityId,
  `sha256:${authority.authorityHash}`,
)
const terminal = buildTerminal(authorityRef)
const terminalRef =
  canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(terminal)
const vulnerabilityScanRef = ref('track-all-l4-vulnerability-scan')
const securityReview = createCanonicalSam31ImageSecurityReview({
  reviewId: 'track-all-l4-image-security-review',
  immutableImageDigest: imageDigest,
  vulnerabilityScanRef,
  scanCompletedAt: '2026-08-05T13:26:00.000Z',
  occurrenceSnapshotUpdatedAt: '2026-08-05T13:27:00.000Z',
  severityCounts: {
    criticalCount: 0,
    highCount: 0,
    mediumCount: 134,
    lowCount: 21,
    unknownSeverityCount: 0,
  },
  reviewerAuthorityRef: ref('track-all-l4-security-reviewer-authority'),
  reviewedAt: '2026-08-05T13:30:00.000Z',
})
const securityReviewRef = canonicalImageSecurityReviewRef(securityReview)
const { receiptHash: _discardedPrivateHash, ...privatePayload } =
  structuredClone(basePrivateQualification)
const privateQualification =
  buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt({
    ...privatePayload,
    supplyChainEvidence: {
      ...privatePayload.supplyChainEvidence,
      imageBuildAuthorityRef: authorityRef,
      imageBuildTerminalRef: terminalRef,
      vulnerabilityScanRef,
      securityReviewRef,
    },
  })
void _discardedPrivateHash
const privateQualificationRef =
  canonicalTrackAllSam31L4TaskQaPrivateQualificationRef(privateQualification)
const rateAuthority = await buildRateAuthority()
const rateAuthorityRef = ref(
  rateAuthority.rateAuthorityId,
  `sha256:${rateAuthority.rateAuthorityHash}`,
  rateAuthority.rateAuthorityVersion,
)
const evidenceRefs = {
  imageBuildAuthorityRef: authorityRef,
  imageBuildTerminalRef: terminalRef,
  securityReviewRef,
  privateQualificationRef,
  accountEffectiveL4RateAuthorityRef: rateAuthorityRef,
}

const objects = new Map<string, Buffer>()
const repository =
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/track-all/l4-task-qa/image-qualification',
  })
const events: string[] = []
const readPort = {
  async rereadBuildAuthority() {
    events.push('build_authority')
    return structuredClone(authority)
  },
  async rereadBuildTerminal() {
    events.push('build_terminal')
    return structuredClone(terminal)
  },
  async rereadSecurityReview() {
    events.push('security_review')
    return structuredClone(securityReview)
  },
  async rereadPrivateQualification() {
    events.push('private_qualification')
    return structuredClone(privateQualification)
  },
  async rereadApprovedCurrentRate(input: {
    routeId: string
    at: string
    rateAuthorityRef: unknown
  }) {
    events.push('current_rate')
    assert.equal(input.routeId, 'l4_standard_primary')
    assert.equal(input.at, now)
    assert.deepEqual(input.rateAuthorityRef, rateAuthorityRef)
    return structuredClone(rateAuthority)
  },
}

const ownerInput = {
  evidenceRefs,
  evidenceReadPort: readPort,
  evidenceRepository: repository,
  now: () => now,
}
const first = await qualifyCanonicalTrackAllSam31L4TaskQaImage(ownerInput)
assert.deepEqual(
  assertCanonicalTrackAllSam31L4TaskQaImageQualificationOwnerReceipt(first),
  first,
)
assert.equal(first.disposition, 'created')
assert.deepEqual(events, [
  'build_authority',
  'build_terminal',
  'security_review',
  'private_qualification',
  'current_rate',
])
assert.equal(first.accountEffectiveRateUsedForCompatibilityOnly, true)
assert.equal(
  first.actualAttemptCostStillRequiresTerminalUsageAndBillingReread,
  true,
)
assert.equal(first.gpuJobStarted, false)
assert.equal(first.runtimeReleaseGranted, false)
assert.equal(first.customerCreditsMutated, false)
assert.equal(first.productionAuthorityGranted, false)

const stored = await repository.rereadImageQualification({
  imageQualificationRef: first.imageQualificationRef,
})
assert.ok(stored)
assert.deepEqual(
  canonicalTrackAllSam31L4TaskQaImageQualificationRef(stored),
  first.imageQualificationRef,
)
assert.deepEqual(stored.runtimeCandidateRef, authorityRef)
assert.deepEqual(
  stored.l4DriverCudaKorniaAndOpenCvQualificationRef,
  privateQualificationRef,
)
assert.deepEqual(
  stored.completeFrameAndSubjectQualityQualificationRef,
  privateQualificationRef,
)
assert.deepEqual(
  stored.scaleFromZeroAndTerminalStopQualificationRef,
  privateQualificationRef,
)
assert.deepEqual(
  stored.accountEffectiveL4RateCompatibilityRef,
  rateAuthorityRef,
)
assert.equal(stored.immutableImageDigest, imageDigest)
assert.equal(stored.immutableImageUri, imageUri)
assert.equal(stored.observedTorchVersion, '2.10.0+cu128')
assert.equal(stored.observedCudaRuntimeVersion, '12.8')
assert.equal(stored.observedKorniaVersion, '0.8.3')
assert.equal(stored.criticalVulnerabilityCount, 0)
assert.equal(stored.highVulnerabilityCount, 0)
assert.equal(stored.unknownSeverityVulnerabilityCount, 0)

events.length = 0
const replay = await qualifyCanonicalTrackAllSam31L4TaskQaImage(ownerInput)
assert.equal(replay.disposition, 'identical_replay')
assert.deepEqual(replay.imageQualificationRef, first.imageQualificationRef)
assert.equal(objects.size, 1)

await assert.rejects(
  qualifyCanonicalTrackAllSam31L4TaskQaImage({
    ...ownerInput,
    evidenceReadPort: {
      ...readPort,
      async rereadApprovedCurrentRate() { return null },
    },
  }),
  /current rate missing/u,
)
await assert.rejects(
  qualifyCanonicalTrackAllSam31L4TaskQaImage({
    ...ownerInput,
    evidenceReadPort: {
      ...readPort,
      async rereadBuildTerminal() {
        return { ...structuredClone(terminal), customerCreditsMutated: true }
      },
    },
  }),
)
await assert.rejects(
  qualifyCanonicalTrackAllSam31L4TaskQaImage({
    ...ownerInput,
    evidenceReadPort: {
      ...readPort,
      async rereadSecurityReview() {
        return createCanonicalSam31ImageSecurityReview({
          reviewId: 'crossed-security-review',
          immutableImageDigest: imageDigest,
          vulnerabilityScanRef,
          scanCompletedAt: '2026-08-05T13:26:00.000Z',
          occurrenceSnapshotUpdatedAt: '2026-08-05T13:27:00.000Z',
          severityCounts: {
            criticalCount: 0,
            highCount: 0,
            mediumCount: 134,
            lowCount: 21,
            unknownSeverityCount: 0,
          },
          reviewerAuthorityRef: ref('crossed-reviewer'),
          reviewedAt: '2026-08-05T13:30:00.000Z',
        })
      },
    },
  }),
  /lineage changed/u,
)
await assert.rejects(
  qualifyCanonicalTrackAllSam31L4TaskQaImage({
    ...ownerInput,
    now: () => '2026-08-08T10:00:00.000Z',
  }),
)
assert.equal(objects.size, 1)

const serviceSource = readFileSync(
  'server/services/canonical-track-all-sam3_1-l4-task-qa-image-qualification-owner.ts',
  'utf8',
)
for (const forbidden of [
  /child_process/u,
  /execFile/u,
  /spawn\(/u,
  /gcloud/u,
  /serviceFee/u,
  /wallet/u,
] as const) assert.doesNotMatch(serviceSource, forbidden)
const operatorSource = readFileSync(
  'server/cli/qualify-track-all-sam3_1-l4-task-qa-image.ts',
  'utf8',
)
assert.match(operatorSource,
  /qualifyCanonicalTrackAllSam31L4TaskQaImage/u)
assert.match(operatorSource,
  /createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository/u)
assert.match(operatorSource,
  /createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository/u)
assert.match(operatorSource,
  /WEEDITPRO_CONFIRM_TRACK_ALL_L4_IMAGE_QUALIFICATION/u)
assert.match(operatorSource,
  /input\.vulnerabilityScanRef\.contentHash\.slice\(7\)/u)
assert.doesNotMatch(operatorSource,
  /publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease/u)
assert.doesNotMatch(operatorSource,
  /persistRuntimeConfigurationCreateOnly/u)

console.log(JSON.stringify({
  smoke:
    'canonical-track-all-sam3_1-l4-task-qa-image-qualification-owner',
  checks: 52,
  buildSupplySecurityAndLiveL4EvidenceExactReread: true,
  currentAccountEffectiveL4RateRequired: true,
  currentRateCompatibilityIsNotTerminalCostOrCustomerPricing: true,
  createOnlyQualificationAndExactReread: true,
  exactIdentifierOnlyCloudOperatorMounted: true,
  missingStaleCrossedOrAuthorityPromotedEvidenceRejected: true,
  gpuJobStarted: false,
  runtimeReleaseGranted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function buildAuthority() {
  const sourceSha = hashText('image-qualification-source')
  const payload = {
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority-v3' as const,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_authority_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    status: 'authorized_for_private_cloud_build' as const,
    authorityId: 'track-all-l4-image-qualification-build-authority',
    authorityVersion: 1 as const,
    operationId: 'tool.kornia.refine_mask.v1' as const,
    capsuleRef: ref('track-all-l4-image-qualification-capsule'),
    buildSourceCoordinate: {
      projectId: 'reeditpro' as const,
      bucketName:
        'reeditpro-production-reeditpro-image-build-inputs' as const,
      objectName:
        `private/image-build-inputs/track-all-l4-task-qa/${sourceSha}.tar.gz`,
      generation: '1786010000000000',
      etag: 'image-qualification-source-etag',
      byteLength: 199_218_494,
      sha256: sourceSha,
    },
    sourceCommitSha: '62607cd4ef81427720690a877517343c0337222d',
    sourceTreeSha: 'ddf062fda73bb2e536e077d4ef005b4894eb0d96',
    imageDestination: {
      repository:
        'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const,
      imageName: 'reeditpro-track-all-l4-task-qa' as const,
      tag: `track-all-l4-qa-${sourceSha.slice(0, 16)}`,
      taggedUri:
        `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa:track-all-l4-qa-${sourceSha.slice(0, 16)}`,
      callerSelectedTagAllowed: false as const,
      tagMayAuthorizeRuntime: false as const,
      terminalImmutableDigestRequired: true as const,
    },
    buildClosure: {
      dockerfilePath:
        'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate' as const,
      dockerfileSha256: hashText('dockerfile'),
      runnerSha256: hashText('runner'),
      entrypointSha256: hashText('entrypoint'),
      verifierSha256: hashText('verifier'),
      sourceProvenanceLockSha256: hashText('source-provenance'),
      privateCapsuleManifestSha256: hashText('private-capsule-manifest'),
      requirementsLockSha256: hashText('requirements-lock'),
      opencvCudaReceiptSha256: hashText('opencv-cuda-receipt'),
      opencvBuildInformationSha256: hashText('opencv-build-information'),
      opencvLicenseSha256: hashText('opencv-license'),
      opencvContribLicenseSha256: hashText('opencv-contrib-license'),
      cudaForwardCompatReceiptSha256: hashText('cuda-forward-compat'),
      cudaNppRuntimeReceiptSha256: hashText('cuda-npp-runtime'),
      cudaNppLicenseSha256: hashText('cuda-npp-license'),
      ubuntuRuntimeSecurityReceiptSha256: hashText('ubuntu-security'),
    },
    cloudBuildPolicy: {
      projectId: 'reeditpro' as const,
      location: 'us-central1' as const,
      regionalCreateEndpoint:
        'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const,
      builderImage:
        'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147' as const,
      serviceAccount:
        'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com' as const,
      machineType: 'E2_HIGHCPU_8' as const,
      diskSizeGb: '200' as const,
      timeout: '3600s' as const,
      queueTtl: '600s' as const,
      sourceFetcher: 'GCS_FETCHER' as const,
      sourceProvenanceHashes: ['SHA256'] as ['SHA256'],
      requestedVerifyOption: 'VERIFIED' as const,
      logging: 'CLOUD_LOGGING_ONLY' as const,
      noSecretsOrSubstitutions: true as const,
      singleFixedOfflineBuildStep: true as const,
    },
    authority: {
      exactPrivateBuildSourceReread: true as const,
      generationAndEtagStableBeforeAndAfterRead: true as const,
      cloudImageBuildAuthorized: true as const,
      durableSingleUseConsumptionRequiredBeforeCloudCall: true as const,
      browserOrCallerMaySubmitBuild: false as const,
      checkpointOrModelWeightsIncluded: false as const,
      imageBuildStarted: false as const,
      imagePushed: false as const,
      runtimeReleaseGranted: false as const,
      gpuJobDispatched: false as const,
      customerCreditMutationAllowed: false as const,
      qaApproved: false as const,
      productionReady: false as const,
    },
    preparedAt: '2026-08-05T13:20:00.000Z',
  }
  return assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

function buildTerminal(authorityRefValue: ReturnType<typeof ref>) {
  const payload = {
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-terminal-v1' as const,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_terminal_owner' as const,
    disposition: 'image_built_pending_supply_chain_release' as const,
    terminalId: 'track-all-l4-image-qualification-build-terminal',
    terminalVersion: 1 as const,
    operationId: 'tool.kornia.refine_mask.v1' as const,
    authorityRef: authorityRefValue,
    submissionRef: ref('track-all-l4-image-build-submission'),
    reconciliationRef: ref('track-all-l4-image-build-reconciliation'),
    cloudBuildId: '13b490aa-4893-4b97-9c84-40bcb039d52c',
    cloudBuildResource:
      'projects/reeditpro/locations/us-central1/builds/13b490aa-4893-4b97-9c84-40bcb039d52c',
    cloudBuildStatus: 'SUCCESS' as const,
    cloudBuildCreateTime: '2026-08-05T13:21:00.000Z',
    cloudBuildStartTime: '2026-08-05T13:21:10.000Z',
    cloudBuildFinishTime: '2026-08-05T13:22:00.000Z',
    exactFixedRequestEchoVerified: true as const,
    exactStorageGenerationProvenanceVerified: true as const,
    verifiedBuildRequested: true as const,
    warningsAbsent: true,
    taggedImageUri:
      authority.imageDestination.taggedUri,
    immutableImageDigest: imageDigest,
    immutableImageUri: imageUri,
    imageBuiltAndPushed: true,
    cloudBuildFailureType: null,
    cloudBuildFailureReason: null,
    buildStepExecutionKnownStarted: true,
    billableGpuExecutionKnownStarted: false as const,
    spdxSbomReread: false as const,
    artifactAnalysisScanPassed: false as const,
    kmsSignatureVerified: false as const,
    slsaProvenanceVerified: false as const,
    runtimeReleaseGranted: false as const,
    gpuJobDispatched: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    productionReady: false as const,
    observedAt: '2026-08-05T13:23:00.000Z',
  }
  return assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

async function buildRateAuthority() {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: 'track-all-l4-current-account-effective-rate',
    rateAuthorityVersion: 1,
    routeId: 'l4_standard_primary',
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() { return rawRateObservation() },
    },
  })
}

function rawRateObservation(): CanonicalGoogleCloudGpuRateRawObservation {
  const observedAt = '2026-08-06T09:59:00.000Z'
  const components = [
    component('cloud_run_l4_gpu_second', 'gpu_second', 186_700, '1', observedAt),
    component('cloud_run_vcpu_second', 'vcpu_second', 18_000, '2', observedAt),
    component('cloud_run_memory_gib_second', 'gib_second', 2_000, '3', observedAt),
    component('private_object_storage_gib_month', 'gib_month', 20_000_000, '4', observedAt),
    component('network_egress_gib', 'gib', 120_000_000, '5', observedAt),
    component('object_class_a_per_1000', 'per_1000_operations', 5_000_000, '6', observedAt),
    component('object_class_b_per_1000', 'per_1000_operations', 400_000, '7', observedAt),
  ]
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-account-pricing-scope'),
    pricingReaderConfigurationRef: ref('gpu-pricing-reader-configuration'),
    routeId: 'l4_standard_primary' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('track-all-l4-price-record-set'),
    pricingReadStartedAt: '2026-08-06T09:58:55.000Z',
    pricingReadFinishedAt: observedAt,
  }
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
    | 'gpu_second' | 'vcpu_second' | 'gib_second' | 'gib_month' | 'gib'
    | 'per_1000_operations',
  usdNanos: number,
  character: string,
  observedAt: string,
) {
  const cloudRun = componentClass.startsWith('cloud_run')
  return {
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
        contractPriceUsdNanos: usdNanos,
      }],
      maximumContractPriceUsdNanos: usdNanos,
      skuMetadataRef: repeatedRef(`sku-metadata-${componentClass}`, character),
      billingAccountPriceRef:
        repeatedRef(`account-price-${componentClass}`, character),
    }],
    skuDescriptionDigestSha256: character.repeat(64),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: usdNanos,
    currentPriceObservedAt: observedAt,
    skuRecordRef: repeatedRef(`sku-record-${componentClass}`, character),
  }
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(hashBytes(input.body), input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const body = values.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  }
}

function ref(id: string, contentHash?: string, version = 1) {
  return {
    id,
    version,
    contentHash: (contentHash ?? `sha256:${sha256AuthorityValue({ id })}`) as
      `sha256:${string}`,
  }
}

function repeatedRef(id: string, character: string) {
  return { id, version: 1, contentHash: `sha256:${character.repeat(64)}` }
}

function hashText(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function hashBytes(value: Buffer) {
  return createHash('sha256').update(value).digest('hex')
}
