import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository,
} from '../services/canonical-professional-google-cloud-gpu-runtime-configuration-repository'
import {
  assertCanonicalTrackAllSam31L4TaskQaRuntimeReleaseReceipt,
  createCanonicalTrackAllSam31L4TaskQaDeploymentObservation,
  createCanonicalTrackAllSam31L4TaskQaImageQualification,
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
  publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  maskQaPrivateTransport,
  maskQaRelease,
} from './canonical-professional-google-cloud-gpu-job-launch-port-smoke'

const objects = new Map<string, Buffer>()
const objectPort = memoryObjectPort(objects)
const evidenceRepository =
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository({
    objectPort,
    prefix: 'private/smoke/track-all/l4-task-qa/release-evidence',
  })
const runtimeConfigurationRepository =
  createCanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository({
    objectPort,
    prefix: 'private/smoke/track-all/l4-task-qa/runtime-configurations',
    expectedPrivateObjectBucketName:
      'reeditpro-production-reeditpro-masks',
  })
const productionMaskQaImageDigest =
  `sha256:${sha256AuthorityValue({
    image: 'weeditpro-track-all-l4-task-qa-immutable-production',
  })}` as const
const productionMaskQaImageRef = {
  id: 'weeditpro-track-all-l4-task-qa-immutable-image',
  version: 1,
  contentHash: productionMaskQaImageDigest,
}
const productionMaskQaReleasePayload = {
  ...maskQaRelease,
  serviceAccountEmail:
    'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa@${productionMaskQaImageDigest}`,
  immutableImageRef: productionMaskQaImageRef,
  immutableImageDigest: productionMaskQaImageDigest,
}
Reflect.deleteProperty(productionMaskQaReleasePayload, 'configurationHash')
const productionMaskQaRelease = {
  ...productionMaskQaReleasePayload,
  configurationHash: sha256AuthorityValue(productionMaskQaReleasePayload),
}

const image = createCanonicalTrackAllSam31L4TaskQaImageQualification({
  schemaVersion:
    'canonical-track-all-sam3_1-l4-task-qa-image-qualification-v1',
  source:
    'canonical_server_track_all_sam3_1_l4_task_qa_image_qualification_owner',
  evidenceClass: 'canonical_private_reread',
  qualificationId: 'track-all-l4-task-qa-image-qualification-1',
  qualificationVersion: 1,
  operationId: 'tool.kornia.refine_mask.v1',
  routeId: 'l4_standard_primary',
  runtimeCandidateRef: ref('track-all-l4-task-qa-runtime-candidate'),
  sourceRevision: sha1('track-all-l4-task-qa-source-revision'),
  sourceTreeHash: sha1('track-all-l4-task-qa-source-tree'),
  sourceWorktreeClean: true,
  immutableImageRef: productionMaskQaRelease.immutableImageRef,
  immutableImageUri: productionMaskQaRelease.immutableImageUri,
  immutableImageDigest: productionMaskQaRelease.immutableImageDigest,
  baseImageRef: ref('track-all-l4-task-qa-base-image'),
  privateBuildCapsuleManifestRef: ref('track-all-l4-build-capsule'),
  requirementsLockRef: ref('track-all-l4-requirements-lock'),
  opencvCudaBuildReceiptRef: ref('track-all-l4-opencv-cuda-build'),
  cudaForwardCompatibilityReceiptRef:
    ref('track-all-l4-cuda-forward-compatibility'),
  sbomRef: ref('track-all-l4-sbom'),
  vulnerabilityScanRef: ref('track-all-l4-vulnerability-scan'),
  signatureVerificationRef: ref('track-all-l4-signature-verification'),
  slsaProvenanceRef: ref('track-all-l4-slsa-provenance'),
  l4DriverCudaKorniaAndOpenCvQualificationRef:
    ref('track-all-l4-driver-cuda-kornia-opencv-qualification'),
  completeFrameAndSubjectQualityQualificationRef:
    ref('track-all-l4-complete-frame-subject-quality-qualification'),
  scaleFromZeroAndTerminalStopQualificationRef:
    ref('track-all-l4-scale-zero-terminal-stop-qualification'),
  accountEffectiveL4RateCompatibilityRef:
    ref('track-all-l4-account-effective-rate-compatibility'),
  observedTorchVersion: '2.10.0+cu128',
  observedCudaRuntimeVersion: '12.8',
  observedKorniaVersion: '0.8.3',
  observedOpenCvCudaBuild: true,
  criticalVulnerabilityCount: 0,
  highVulnerabilityCount: 0,
  unknownSeverityVulnerabilityCount: 0,
  exactImmutableImageSbomScanSignatureAndProvenanceReread: true,
  exactL4CudaRuntimeAndCompleteQualityEvidenceReread: true,
  runtimeDownloadAllowed: false,
  samCheckpointOrModelWeightsIncluded: false,
  cpuOnlySubstantiveMaskQaAllowed: false,
  gpuJobStartedByQualificationOwner: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  qualifiedAt: '2026-08-05T12:00:00.000Z',
  expiresAt: '2026-09-05T12:00:00.000Z',
})
const imageQualificationRef = {
  id: image.qualificationId,
  version: image.qualificationVersion,
  contentHash: `sha256:${image.qualificationHash}` as const,
}
const privateObjectTransport = productionMaskQaTransport()
const observation = createCanonicalTrackAllSam31L4TaskQaDeploymentObservation({
  schemaVersion:
    'canonical-track-all-sam3_1-l4-task-qa-deployment-observation-v2',
  source:
    'canonical_server_track_all_sam3_1_l4_task_qa_deployment_observer',
  evidenceClass: 'canonical_private_google_cloud_api_reread',
  observationId: 'track-all-l4-task-qa-deployment-observation-1',
  observationVersion: 1,
  imageQualificationRef,
  release: productionMaskQaRelease,
  privateObjectTransport,
  serviceIdentityObservationRef:
    ref('track-all-l4-service-identity-observation'),
  immutableImageMetadataObservationRef:
    ref('track-all-l4-immutable-image-observation'),
  cloudRunJobObservationRef: ref('track-all-l4-cloud-run-job-observation'),
  cloudRunExecutionSetObservationRef:
    ref('track-all-l4-cloud-run-execution-set-observation'),
  privateNetworkObservationRef:
    ref('track-all-l4-private-network-observation'),
  privateSubnetObservationRef:
    ref('track-all-l4-private-subnet-observation'),
  privateRouteSetObservationRef:
    ref('track-all-l4-private-route-set-observation'),
  privateRouterSetObservationRef:
    ref('track-all-l4-private-router-set-observation'),
  privateBucketMetadataObservationRef:
    ref('track-all-l4-private-bucket-observation'),
  privateBucketIamPolicyObservationRef:
    ref('track-all-l4-private-bucket-iam-observation'),
  cloudRunJobIamPolicyObservationRef:
    ref('track-all-l4-cloud-run-job-iam-observation'),
  observedAt: '2026-08-05T12:05:00.000Z',
  exactProjectRegionImageServiceTaskJobGpuAndScaleZeroReread: true,
  exactSeparateSamReadAndL4TaskQaWriteRootReread: true,
  exactPrivateNetworkSubnetNoNatAndZeroActiveExecutionReread: true,
  exactPrivateBucketEncryptionUniformAccessPublicPreventionAndIamReread: true,
  callerImageCommandBucketPathObjectNameOrCloudResourceAccepted: false,
  gpuJobStarted: false,
  providerOrModelExecuted: false,
  customerCreditsMutated: false,
  publicDeliveryOrProductionAuthorityGranted: false,
})

assert.equal(await evidenceRepository.persistImageQualificationCreateOnly({
  qualification: image,
}), 'created')
assert.equal(await evidenceRepository.persistDeploymentObservationCreateOnly({
  observation,
}), 'created')
assert.equal(await evidenceRepository.persistImageQualificationCreateOnly({
  qualification: image,
}), 'identical_replay')
assert.equal(await evidenceRepository.persistDeploymentObservationCreateOnly({
  observation,
}), 'identical_replay')

const publisherInput = {
  imageQualificationRef,
  runtimeReleaseRef: productionMaskQaRelease.releaseRef,
  evidenceRepository,
  runtimeConfigurationRepository,
  now: () => '2026-08-05T12:10:00.000Z',
}
const receipt = await publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease(
  publisherInput,
)
assert.deepEqual(
  assertCanonicalTrackAllSam31L4TaskQaRuntimeReleaseReceipt(receipt),
  receipt,
)
assert.equal(receipt.disposition, 'created')
assert.deepEqual(receipt.runtimeReleaseRef, productionMaskQaRelease.releaseRef)
assert.deepEqual(receipt.privateObjectTransportRef,
  privateObjectTransport.transportRef)
assert.equal(receipt.gpuJobStarted, false)
assert.equal(receipt.providerOrModelExecuted, false)
assert.equal(receipt.billingWalletOrCreditAuthorityGranted, false)
assert.equal(receipt.publicDeliveryOrProductionAuthorityGranted, false)
assert.equal((await publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease(
  publisherInput,
)).disposition, 'identical_replay')

const crossedReleasePayload = {
  ...productionMaskQaRelease,
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/gpu/crossed-mask-qa@${
      productionMaskQaRelease.immutableImageDigest
    }`,
}
Reflect.deleteProperty(crossedReleasePayload, 'configurationHash')
const crossedRelease = {
  ...crossedReleasePayload,
  configurationHash: sha256AuthorityValue(crossedReleasePayload),
}
const crossedObservationPayload = structuredClone(observation)
Reflect.deleteProperty(crossedObservationPayload, 'observationHash')
const crossedObservation =
  createCanonicalTrackAllSam31L4TaskQaDeploymentObservation({
    ...crossedObservationPayload,
    release: crossedRelease,
  })
await assert.rejects(
  publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease({
    ...publisherInput,
    evidenceRepository: {
      ...evidenceRepository,
      async rereadDeploymentObservation() {
        return crossedObservation
      },
    },
  }),
  /lineage changed/u,
)

const historicalSamTransport = structuredClone(maskQaPrivateTransport)
assert.throws(() => createCanonicalTrackAllSam31L4TaskQaDeploymentObservation({
  ...crossedObservationPayload,
  release: productionMaskQaRelease,
  privateObjectTransport: historicalSamTransport,
}))
const wrongServiceReleasePayload = {
  ...productionMaskQaRelease,
  serviceAccountEmail:
    'reeditpro-professional-gpu@reeditpro.iam.gserviceaccount.com',
}
Reflect.deleteProperty(wrongServiceReleasePayload, 'configurationHash')
assert.throws(() => createCanonicalTrackAllSam31L4TaskQaDeploymentObservation({
  ...crossedObservationPayload,
  release: {
    ...wrongServiceReleasePayload,
    configurationHash: sha256AuthorityValue(wrongServiceReleasePayload),
  },
  privateObjectTransport,
}))
const wrongImageQualification = structuredClone(image)
Reflect.deleteProperty(wrongImageQualification, 'qualificationHash')
assert.throws(() => createCanonicalTrackAllSam31L4TaskQaImageQualification({
  ...wrongImageQualification,
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/gpu/wrong-image@${
      productionMaskQaImageDigest
    }`,
}))

await assert.rejects(
  publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease({
    ...publisherInput,
    now: () => '2026-10-05T12:10:00.000Z',
  }),
  /stale/u,
)
const tamperedReceipt = structuredClone(receipt)
Reflect.set(tamperedReceipt, 'gpuJobStarted', true)
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaRuntimeReleaseReceipt(tamperedReceipt),
)

const cliSource = readFileSync(new URL(
  '../cli/publish-track-all-sam3_1-l4-task-qa-runtime-release.ts',
  import.meta.url,
), 'utf8')
const packageJson = JSON.parse(readFileSync(
  new URL('../../package.json', import.meta.url),
  'utf8',
)) as { scripts?: Record<string, string> }
assert.match(cliSource,
  /createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository/u)
assert.match(cliSource,
  /createCanonicalGcsProfessionalGoogleCloudGpuRuntimeConfigurationRepository/u)
assert.doesNotMatch(cliSource,
  /WEEDITPRO_TRACK_ALL_L4_TASK_QA_(?:IMAGE_URI|IMAGE_DIGEST|COMMAND|PATH|BUCKET)/u)
assert.equal(
  packageJson.scripts?.[
    'publish:track-all-sam3_1-l4-task-qa-runtime-release'
  ],
  'tsx server/cli/publish-track-all-sam3_1-l4-task-qa-runtime-release.ts',
)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher',
  checks: 45,
  exactImmutableImageSupplyChainAndL4QualityEvidenceRequired: true,
  exactCloudRunL4GpuScaleZeroAndIamApiRereadRequired: true,
  separateSamReadAndL4TaskQaWriteRootsRequired: true,
  samModelArtifactAndL4QaArtifactCannotBeCast: true,
  exactWorkerIdentityJobAndImageRepositoryRequired: true,
  exactCreateOnlyReplayAndRereadPassed: true,
  crossedImageStaleEvidenceAndTamperedReceiptRejected: true,
  identifierOnlyBoundedPublicationOperatorMounted: true,
  runtimeModelDownloadAllowed: false,
  cpuOnlySubstantiveMaskQaAllowed: false,
  liveGpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function productionMaskQaTransport() {
  const payload = {
    ...maskQaPrivateTransport,
    privateBucketName: 'reeditpro-production-reeditpro-masks',
    bucketSecurityPolicyRef:
      ref('production-mask-bucket-security-policy'),
    observedAt: '2026-08-05T12:05:00.000Z',
  }
  Reflect.deleteProperty(payload, 'configurationHash')
  return {
    ...payload,
    configurationHash: sha256AuthorityValue(payload),
  }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue({ id })}` as const,
  }
}

function sha1(value: string): string {
  return createHash('sha1').update(value).digest('hex')
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = values.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}
