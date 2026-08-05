import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { createGunzip } from 'node:zlib'

import { z } from 'zod'

import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  TRACK_ALL_L4_TASK_QA_MAXIMUM_BUILD_SOURCE_BYTES,
  TRACK_ALL_L4_TASK_QA_MAXIMUM_BUILD_SOURCE_ENTRIES,
  TRACK_ALL_L4_TASK_QA_MAXIMUM_UNCOMPRESSED_BUILD_SOURCE_BYTES,
  TRACK_ALL_L4_TASK_QA_PROJECT_ID,
  canonicalTrackAllSam31L4TaskQaBuildSourceEntrySchema,
  canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema,
  type CanonicalTrackAllSam31L4TaskQaBuildSourceEntry,
  type CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinate,
} from './canonical-track-all-sam3_1-l4-task-qa-private-capsule-source-contract'
import {
  assertCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews,
  type CanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewReadPort,
} from './canonical-track-all-sam3_1-l4-task-qa-private-capsule-review'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_BUILD_CAPSULE_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-private-build-capsule-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_BUILD_REQUEST_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-build-request-v1' as const

const PROJECT_ID = TRACK_ALL_L4_TASK_QA_PROJECT_ID
const REGION = 'us-central1' as const
const IMAGE_REPOSITORY =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const
const IMAGE_NAME = 'reeditpro-track-all-l4-task-qa' as const
const DOCKERFILE_PATH =
  'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate' as const
const PRIVATE_INPUT_DIRECTORY =
  'track_all_task_qa_private_build_input' as const
const CLOUD_BUILD_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const
const CLOUD_BUILD_SERVICE_ACCOUNT =
  'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com' as const
const BUILDER_IMAGE =
  'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147' as const
const MAXIMUM_BUILD_SOURCE_BYTES =
  TRACK_ALL_L4_TASK_QA_MAXIMUM_BUILD_SOURCE_BYTES
const MAXIMUM_UNCOMPRESSED_BUILD_SOURCE_BYTES =
  TRACK_ALL_L4_TASK_QA_MAXIMUM_UNCOMPRESSED_BUILD_SOURCE_BYTES
const MAXIMUM_BUILD_SOURCE_ENTRIES =
  TRACK_ALL_L4_TASK_QA_MAXIMUM_BUILD_SOURCE_ENTRIES

const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const gitSha = z.string().regex(/^[a-f0-9]{40}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const privateBuildSourceCoordinateSchema =
  canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema
const buildSourceEntrySchema =
  canonicalTrackAllSam31L4TaskQaBuildSourceEntrySchema

const capsuleWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_BUILD_CAPSULE_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_private_build_capsule_owner',
  ),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum(['contract_only', 'private_capsule_verified']),
  capsuleId: safeId,
  capsuleVersion: z.literal(1),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  accelerator: z.literal('nvidia_l4'),
  routeId: z.literal('l4_standard_primary'),
  sourceCommitSha: gitSha,
  sourceTreeSha: gitSha,
  sourceWorktreeClean: z.literal(true),
  buildSourceCoordinate: privateBuildSourceCoordinateSchema,
  buildSourceArtifactRef: evidenceRefSchema,
  buildSourceArchiveEntries: z.array(buildSourceEntrySchema)
    .min(10).max(MAXIMUM_BUILD_SOURCE_ENTRIES),
  buildSourceArchiveEntrySetSha256: rawSha256,
  dockerfilePath: z.literal(DOCKERFILE_PATH),
  dockerfileSha256: rawSha256,
  runnerSha256: rawSha256,
  entrypointSha256: rawSha256,
  verifierSha256: rawSha256,
  sourceProvenanceLockSha256: rawSha256,
  privateInput: z.object({
    directoryName: z.literal(PRIVATE_INPUT_DIRECTORY),
    capsuleManifestRef: evidenceRefSchema,
    capsuleManifestSha256: rawSha256,
    requirementsLockSha256: rawSha256,
    opencvCudaReceiptSha256: rawSha256,
    opencvBuildInformationSha256: rawSha256,
    opencvLicenseSha256: rawSha256,
    opencvContribLicenseSha256: rawSha256,
    cudaForwardCompatReceiptSha256: rawSha256,
    cudaForwardCompatPackageSha256: rawSha256,
    artifactCount: z.number().int().min(5).max(10_000),
    exactArtifactSetReread: z.literal(true),
    hashLockedWheelhouse: z.literal(true),
    reviewedOpenCvCudaBuild: z.literal(true),
    containsCredentials: z.literal(false),
    containsCustomerMedia: z.literal(false),
    containsSamCheckpoint: z.literal(false),
    containsModelWeights: z.literal(false),
    runtimeDownloadsAllowed: z.literal(false),
  }).strict(),
  securityBoundary: z.object({
    archiveEntrySafetyScanPassed: z.literal(true),
    symlinkDeviceSocketAndTraversalEntriesAbsent: z.literal(true),
    archiveSafetyReviewRef: evidenceRefSchema,
    dependencyReviewRef: evidenceRefSchema,
    licenseReviewRef: evidenceRefSchema,
    callerPathUrlCommandImageTagOrBuildArgsAccepted: z.literal(false),
    developerMachineModelInstallAllowed: z.literal(false),
  }).strict(),
  preparedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.buildSourceArtifactRef.contentHash !==
      `sha256:${value.buildSourceCoordinate.sha256}`
    || value.privateInput.capsuleManifestRef.contentHash !==
      `sha256:${value.privateInput.capsuleManifestSha256}`
  ) context.addIssue({
    code: 'custom',
    message: 'Track All L4 build capsule lost exact artifact lineage.',
  })
  try {
    assertBuildSourceEntries(value)
    const canonical = value.evidenceClass === 'canonical_private_reread'
    if (canonical
      ? value.status !== 'private_capsule_verified'
        || value.privateInput.cudaForwardCompatPackageSha256 !==
          'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893'
      : value.status !== 'contract_only') {
      throw new Error('Track All L4 capsule disposition is invalid.')
    }
  } catch {
    context.addIssue({
      code: 'custom',
      message: 'Track All L4 build source entry closure is invalid.',
    })
  }
})

export const canonicalTrackAllSam31L4TaskQaPrivateBuildCapsuleSchema =
  capsuleWithoutHashSchema.extend({ capsuleHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaPrivateBuildCapsuleSchema
>

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_authority_owner',
  ),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum(['contract_only', 'authorized_for_private_cloud_build']),
  authorityId: safeId,
  authorityVersion: z.literal(1),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  capsuleRef: evidenceRefSchema,
  buildSourceCoordinate: privateBuildSourceCoordinateSchema,
  sourceCommitSha: gitSha,
  sourceTreeSha: gitSha,
  imageDestination: z.object({
    repository: z.literal(IMAGE_REPOSITORY),
    imageName: z.literal(IMAGE_NAME),
    tag: z.string().regex(/^track-all-l4-qa-[a-f0-9]{16}$/u),
    taggedUri: z.string().regex(
      /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-track-all-l4-task-qa:track-all-l4-qa-[a-f0-9]{16}$/u,
    ),
    callerSelectedTagAllowed: z.literal(false),
    tagMayAuthorizeRuntime: z.literal(false),
    terminalImmutableDigestRequired: z.literal(true),
  }).strict(),
  buildClosure: z.object({
    dockerfilePath: z.literal(DOCKERFILE_PATH),
    dockerfileSha256: rawSha256,
    runnerSha256: rawSha256,
    entrypointSha256: rawSha256,
    verifierSha256: rawSha256,
    sourceProvenanceLockSha256: rawSha256,
    privateCapsuleManifestSha256: rawSha256,
    requirementsLockSha256: rawSha256,
    opencvCudaReceiptSha256: rawSha256,
    opencvBuildInformationSha256: rawSha256,
    opencvLicenseSha256: rawSha256,
    opencvContribLicenseSha256: rawSha256,
    cudaForwardCompatReceiptSha256: rawSha256,
  }).strict(),
  cloudBuildPolicy: z.object({
    projectId: z.literal(PROJECT_ID),
    location: z.literal(REGION),
    regionalCreateEndpoint: z.literal(CLOUD_BUILD_ENDPOINT),
    builderImage: z.literal(BUILDER_IMAGE),
    serviceAccount: z.literal(CLOUD_BUILD_SERVICE_ACCOUNT),
    machineType: z.literal('E2_HIGHCPU_8'),
    diskSizeGb: z.literal('200'),
    timeout: z.literal('3600s'),
    queueTtl: z.literal('600s'),
    sourceFetcher: z.literal('GCS_FETCHER'),
    sourceProvenanceHashes: z.tuple([z.literal('SHA256')]),
    requestedVerifyOption: z.literal('VERIFIED'),
    logging: z.literal('CLOUD_LOGGING_ONLY'),
    noSecretsOrSubstitutions: z.literal(true),
    singleFixedOfflineBuildStep: z.literal(true),
  }).strict(),
  authority: z.object({
    exactPrivateBuildSourceReread: z.literal(true),
    generationAndEtagStableBeforeAndAfterRead: z.literal(true),
    cloudImageBuildAuthorized: z.boolean(),
    durableSingleUseConsumptionRequiredBeforeCloudCall: z.literal(true),
    browserOrCallerMaySubmitBuild: z.literal(false),
    checkpointOrModelWeightsIncluded: z.literal(false),
    imageBuildStarted: z.literal(false),
    imagePushed: z.literal(false),
    runtimeReleaseGranted: z.literal(false),
    gpuJobDispatched: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    qaApproved: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  preparedAt: timestamp,
}).strict().superRefine((value, context) => {
  const expectedTag =
    `track-all-l4-qa-${value.buildSourceCoordinate.sha256.slice(0, 16)}`
  if (
    value.imageDestination.tag !== expectedTag
    || value.imageDestination.taggedUri !==
      `${IMAGE_REPOSITORY}/${IMAGE_NAME}:${expectedTag}`
    || (value.evidenceClass === 'canonical_private_reread'
      ? value.status !== 'authorized_for_private_cloud_build'
        || !value.authority.cloudImageBuildAuthorized
      : value.status !== 'contract_only'
        || value.authority.cloudImageBuildAuthorized)
  ) context.addIssue({
    code: 'custom',
    message: 'Track All L4 build authority lost fixed image identity.',
  })
})

export const canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthoritySchema =
  authorityWithoutHashSchema.extend({ authorityHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthoritySchema
>

const buildRequestWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_BUILD_REQUEST_VERSION,
  ),
  authorityRef: evidenceRefSchema,
  method: z.literal('POST'),
  endpoint: z.literal(CLOUD_BUILD_ENDPOINT),
  body: z.record(z.string(), z.unknown()),
  cloudCallAuthorized: z.boolean(),
  automaticRetryAllowed: z.literal(false),
  callerCommandImagePathEnvironmentOrBuildArgsAccepted: z.literal(false),
  developerMachineModelInstallAllowed: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionReady: z.literal(false),
}).strict()
export const canonicalTrackAllSam31L4TaskQaCloudBuildRequestSchema =
  buildRequestWithoutHashSchema.extend({ requestHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaCloudBuildRequest = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaCloudBuildRequestSchema
>

export interface CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceReadPort {
  readExact(coordinate: z.infer<typeof privateBuildSourceCoordinateSchema>):
    Promise<{
      readonly generationBeforeRead: string
      readonly etagBeforeRead: string
      readonly body: Buffer | Uint8Array | AsyncIterable<Uint8Array>
      readonly generationAfterRead: string
      readonly etagAfterRead: string
    } | null>
}

export function createCanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule(
  input: Omit<z.input<typeof capsuleWithoutHashSchema>, 'schemaVersion' | 'source'>,
): CanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule {
  assertClosedPlainData(input, 'track_all_l4_private_build_capsule')
  const payload = capsuleWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_BUILD_CAPSULE_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_private_build_capsule_owner',
    ...input,
  })
  return canonicalTrackAllSam31L4TaskQaPrivateBuildCapsuleSchema.parse({
    ...payload,
    capsuleHash: sha256AuthorityValue(payload),
  })
}

export async function prepareCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(
  input: {
    readonly authorityId: string
    readonly capsule: CanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule
    readonly privateBuildSourceReadPort:
      CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceReadPort
    readonly privateCapsuleReviewReadPort?:
      CanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewReadPort
    readonly preparedAt: string
  },
): Promise<CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority> {
  const capsule = assertCanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule(
    input.capsule,
  )
  const canonical = capsule.evidenceClass === 'canonical_private_reread'
  const observed = await verifyPrivateBuildSource(
    capsule.buildSourceCoordinate,
    input.privateBuildSourceReadPort,
  )
  if (stableAuthorityStringify(observed.regularFileEntries)
    !== stableAuthorityStringify(capsule.buildSourceArchiveEntries)
    || sha256AuthorityValue(observed.regularFileEntries)
      !== capsule.buildSourceArchiveEntrySetSha256) {
    throw new Error('Track All L4 private build source entries changed.')
  }
  if (canonical) {
    const reviewReadPort = input.privateCapsuleReviewReadPort
    if (!reviewReadPort) {
      throw new Error('Track All L4 private capsule reviews missing.')
    }
    const [archiveSafetyReview, dependencyReview, licenseReview] =
      await Promise.all([
      reviewReadPort.rereadArchiveSafetyReview({
        reviewRef: capsule.securityBoundary.archiveSafetyReviewRef,
      }),
      reviewReadPort.rereadDependencyReview({
        reviewRef: capsule.securityBoundary.dependencyReviewRef,
      }),
      reviewReadPort.rereadLicenseReview({
        reviewRef: capsule.securityBoundary.licenseReviewRef,
      }),
      ])
    const reviews =
      assertCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews({
        archiveSafetyReview,
        dependencyReview,
        licenseReview,
        buildSourceCoordinate: capsule.buildSourceCoordinate,
        buildSourceArtifactRef: capsule.buildSourceArtifactRef,
        buildSourceArchiveEntries: capsule.buildSourceArchiveEntries,
        buildSourceArchiveEntrySetSha256:
          capsule.buildSourceArchiveEntrySetSha256,
        buildSourceArchiveDirectoryEntries: observed.directoryEntries,
        requirementsLockSha256: capsule.privateInput.requirementsLockSha256,
        opencvBuildInformationSha256:
          capsule.privateInput.opencvBuildInformationSha256,
        opencvLicenseSha256: capsule.privateInput.opencvLicenseSha256,
        opencvContribLicenseSha256:
          capsule.privateInput.opencvContribLicenseSha256,
      })
    if (
      stableAuthorityStringify(reviews.archiveSafetyReviewRef) !==
        stableAuthorityStringify(
          capsule.securityBoundary.archiveSafetyReviewRef,
        )
      || stableAuthorityStringify(reviews.dependencyReviewRef) !==
        stableAuthorityStringify(capsule.securityBoundary.dependencyReviewRef)
      || stableAuthorityStringify(reviews.licenseReviewRef) !==
        stableAuthorityStringify(capsule.securityBoundary.licenseReviewRef)
    ) throw new Error('Track All L4 private capsule review refs changed.')
  }
  const tag =
    `track-all-l4-qa-${capsule.buildSourceCoordinate.sha256.slice(0, 16)}`
  const payload = authorityWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_authority_owner',
    evidenceClass: capsule.evidenceClass,
    status: canonical
      ? 'authorized_for_private_cloud_build'
      : 'contract_only',
    authorityId: input.authorityId,
    authorityVersion: 1,
    operationId: capsule.operationId,
    capsuleRef: {
      id: capsule.capsuleId,
      version: capsule.capsuleVersion,
      contentHash: `sha256:${capsule.capsuleHash}`,
    },
    buildSourceCoordinate: capsule.buildSourceCoordinate,
    sourceCommitSha: capsule.sourceCommitSha,
    sourceTreeSha: capsule.sourceTreeSha,
    imageDestination: {
      repository: IMAGE_REPOSITORY,
      imageName: IMAGE_NAME,
      tag,
      taggedUri: `${IMAGE_REPOSITORY}/${IMAGE_NAME}:${tag}`,
      callerSelectedTagAllowed: false,
      tagMayAuthorizeRuntime: false,
      terminalImmutableDigestRequired: true,
    },
    buildClosure: {
      dockerfilePath: capsule.dockerfilePath,
      dockerfileSha256: capsule.dockerfileSha256,
      runnerSha256: capsule.runnerSha256,
      entrypointSha256: capsule.entrypointSha256,
      verifierSha256: capsule.verifierSha256,
      sourceProvenanceLockSha256: capsule.sourceProvenanceLockSha256,
      privateCapsuleManifestSha256:
        capsule.privateInput.capsuleManifestSha256,
      requirementsLockSha256: capsule.privateInput.requirementsLockSha256,
      opencvCudaReceiptSha256:
        capsule.privateInput.opencvCudaReceiptSha256,
      opencvBuildInformationSha256:
        capsule.privateInput.opencvBuildInformationSha256,
      opencvLicenseSha256: capsule.privateInput.opencvLicenseSha256,
      opencvContribLicenseSha256:
        capsule.privateInput.opencvContribLicenseSha256,
      cudaForwardCompatReceiptSha256:
        capsule.privateInput.cudaForwardCompatReceiptSha256,
    },
    cloudBuildPolicy: {
      projectId: PROJECT_ID,
      location: REGION,
      regionalCreateEndpoint: CLOUD_BUILD_ENDPOINT,
      builderImage: BUILDER_IMAGE,
      serviceAccount: CLOUD_BUILD_SERVICE_ACCOUNT,
      machineType: 'E2_HIGHCPU_8',
      diskSizeGb: '200',
      timeout: '3600s',
      queueTtl: '600s',
      sourceFetcher: 'GCS_FETCHER',
      sourceProvenanceHashes: ['SHA256'],
      requestedVerifyOption: 'VERIFIED',
      logging: 'CLOUD_LOGGING_ONLY',
      noSecretsOrSubstitutions: true,
      singleFixedOfflineBuildStep: true,
    },
    authority: {
      exactPrivateBuildSourceReread: true,
      generationAndEtagStableBeforeAndAfterRead: true,
      cloudImageBuildAuthorized: canonical,
      durableSingleUseConsumptionRequiredBeforeCloudCall: true,
      browserOrCallerMaySubmitBuild: false,
      checkpointOrModelWeightsIncluded: false,
      imageBuildStarted: false,
      imagePushed: false,
      runtimeReleaseGranted: false,
      gpuJobDispatched: false,
      customerCreditMutationAllowed: false,
      qaApproved: false,
      productionReady: false,
    },
    preparedAt: input.preparedAt,
  })
  return canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaCloudBuildRequest {
  const authority =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(value)
  const body = {
    source: {
      storageSource: {
        bucket: authority.buildSourceCoordinate.bucketName,
        object: authority.buildSourceCoordinate.objectName,
        generation: authority.buildSourceCoordinate.generation,
        sourceFetcher: authority.cloudBuildPolicy.sourceFetcher,
      },
    },
    steps: [{
      name: authority.cloudBuildPolicy.builderImage,
      entrypoint: 'docker',
      args: [
        'build',
        '--pull=false',
        '--no-cache',
        '--network=none',
        '--platform=linux/amd64',
        '--file',
        authority.buildClosure.dockerfilePath,
        '--tag',
        authority.imageDestination.taggedUri,
        '--build-arg',
        `WEEDITPRO_SOURCE_COMMIT_SHA=${authority.sourceCommitSha}`,
        '--build-arg',
        `WEEDITPRO_SOURCE_TREE_HASH=${authority.sourceTreeSha}`,
        '--build-arg',
        'WEEDITPRO_SOURCE_CLEAN=true',
        '--build-arg',
        `WEEDITPRO_TRACK_ALL_TASK_QA_REQUIREMENTS_SHA256=${authority.buildClosure.requirementsLockSha256}`,
        '--build-arg',
        `WEEDITPRO_TRACK_ALL_TASK_QA_OPENCV_CUDA_RECEIPT_SHA256=${authority.buildClosure.opencvCudaReceiptSha256}`,
        '--build-arg',
        `WEEDITPRO_TRACK_ALL_TASK_QA_CUDA_FORWARD_COMPAT_RECEIPT_SHA256=${authority.buildClosure.cudaForwardCompatReceiptSha256}`,
        '--build-arg',
        `WEEDITPRO_TRACK_ALL_TASK_QA_PRIVATE_CAPSULE_MANIFEST_SHA256=${authority.buildClosure.privateCapsuleManifestSha256}`,
        '.',
      ],
    }],
    images: [authority.imageDestination.taggedUri],
    timeout: authority.cloudBuildPolicy.timeout,
    queueTtl: authority.cloudBuildPolicy.queueTtl,
    serviceAccount: authority.cloudBuildPolicy.serviceAccount,
    options: {
      machineType: authority.cloudBuildPolicy.machineType,
      diskSizeGb: authority.cloudBuildPolicy.diskSizeGb,
      logging: authority.cloudBuildPolicy.logging,
      requestedVerifyOption: authority.cloudBuildPolicy.requestedVerifyOption,
      sourceProvenanceHash: authority.cloudBuildPolicy.sourceProvenanceHashes,
    },
    tags: ['weeditpro', 'track-all-l4-task-qa', 'private-image-build'],
  }
  const payload = buildRequestWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_BUILD_REQUEST_VERSION,
    authorityRef: {
      id: authority.authorityId,
      version: authority.authorityVersion,
      contentHash: `sha256:${authority.authorityHash}`,
    },
    method: 'POST',
    endpoint: authority.cloudBuildPolicy.regionalCreateEndpoint,
    body,
    cloudCallAuthorized: authority.authority.cloudImageBuildAuthorized,
    automaticRetryAllowed: false,
    callerCommandImagePathEnvironmentOrBuildArgsAccepted: false,
    developerMachineModelInstallAllowed: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionReady: false,
  })
  return canonicalTrackAllSam31L4TaskQaCloudBuildRequestSchema.parse({
    ...payload,
    requestHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule {
  assertClosedPlainData(value, 'track_all_l4_private_build_capsule')
  const parsed =
    canonicalTrackAllSam31L4TaskQaPrivateBuildCapsuleSchema.parse(value)
  const { capsuleHash, ...payload } = parsed
  if (capsuleHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 private build capsule hash is invalid.')
  }
  return parsed
}

export function assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority {
  assertClosedPlainData(value, 'track_all_l4_cloud_image_build_authority')
  const parsed =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthoritySchema.parse(value)
  const { authorityHash, ...payload } = parsed
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 cloud image build authority hash is invalid.')
  }
  return parsed
}

async function verifyPrivateBuildSource(
  coordinate: z.infer<typeof privateBuildSourceCoordinateSchema>,
  port: CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceReadPort,
): Promise<{
  readonly regularFileEntries:
    readonly z.infer<typeof buildSourceEntrySchema>[]
  readonly directoryEntries: readonly string[]
}> {
  const observed = await port.readExact(coordinate)
  if (!observed) throw new Error('Track All L4 private build source missing.')
  if (
    observed.generationBeforeRead !== coordinate.generation
    || observed.generationAfterRead !== coordinate.generation
    || observed.etagBeforeRead !== coordinate.etag
    || observed.etagAfterRead !== coordinate.etag
  ) throw new Error('Track All L4 private build source metadata changed.')
  const digest = createHash('sha256')
  let byteLength = 0
  const body = Buffer.isBuffer(observed.body)
    || observed.body instanceof Uint8Array
    ? (async function* () { yield observed.body as Uint8Array })()
    : observed.body
  const measuredBody = (async function* () {
    for await (const chunk of body) {
      if (!(chunk instanceof Uint8Array) || chunk.byteLength === 0) {
        throw new Error('Track All L4 private build source stream is invalid.')
      }
      byteLength += chunk.byteLength
      if (!Number.isSafeInteger(byteLength)
        || byteLength > MAXIMUM_BUILD_SOURCE_BYTES) {
        throw new Error('Track All L4 private build source exceeded bound.')
      }
      digest.update(chunk)
      yield chunk
    }
  })()
  const gunzip = createGunzip()
  Readable.from(measuredBody).pipe(gunzip)
  const entries = await inspectCanonicalTarStream(gunzip)
  if (byteLength !== coordinate.byteLength
    || digest.digest('hex') !== coordinate.sha256) {
    throw new Error('Track All L4 private build source identity mismatch.')
  }
  return entries
}

export async function inspectCanonicalTrackAllSam31L4TaskQaPrivateBuildSource(
  coordinate: CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinate,
  port: CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceReadPort,
): Promise<readonly CanonicalTrackAllSam31L4TaskQaBuildSourceEntry[]> {
  return (await verifyPrivateBuildSource(
    privateBuildSourceCoordinateSchema.parse(coordinate),
    port,
  )).regularFileEntries
}

export async function inspectCanonicalTrackAllSam31L4TaskQaPrivateBuildSourceEnvelope(
  coordinate: CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinate,
  port: CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceReadPort,
): Promise<{
  readonly regularFileEntries:
    readonly CanonicalTrackAllSam31L4TaskQaBuildSourceEntry[]
  readonly directoryEntries: readonly string[]
}> {
  return verifyPrivateBuildSource(
    privateBuildSourceCoordinateSchema.parse(coordinate),
    port,
  )
}

function assertBuildSourceEntries(
  value: z.input<typeof capsuleWithoutHashSchema>,
): void {
  const entries = value.buildSourceArchiveEntries
  for (let index = 1; index < entries.length; index += 1) {
    if (!(entries[index - 1].path < entries[index].path)) {
      throw new Error('Track All L4 build entries are not uniquely ordered.')
    }
  }
  if (value.buildSourceArchiveEntrySetSha256
    !== sha256AuthorityValue(entries)) {
    throw new Error('Track All L4 build entry-set digest is invalid.')
  }
  const byPath = new Map(entries.map((entry) => [entry.path, entry]))
  const required = (path: string, expectedSha256: string): void => {
    if (byPath.get(path)?.sha256 !== expectedSha256) {
      throw new Error(`Track All L4 build entry ${path} changed.`)
    }
  }
  required(DOCKERFILE_PATH, value.dockerfileSha256)
  required(
    'docker/prod/gpu-worker/track-all-task-qa/runner.py',
    value.runnerSha256,
  )
  required(
    'docker/prod/gpu-worker/track-all-task-qa/entrypoint.sh',
    value.entrypointSha256,
  )
  required(
    'docker/prod/gpu-worker/track-all-task-qa/verify-private-build-input.py',
    value.verifierSha256,
  )
  required(
    'docker/prod/gpu-worker/track-all-task-qa/source-provenance.lock',
    value.sourceProvenanceLockSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/capsule-manifest.json`,
    value.privateInput.capsuleManifestSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/python/requirements.lock.txt`,
    value.privateInput.requirementsLockSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/opencv/opencv-cuda-receipt.json`,
    value.privateInput.opencvCudaReceiptSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/opencv/opencv-build-information.txt`,
    value.privateInput.opencvBuildInformationSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/opencv/LICENSE`,
    value.privateInput.opencvLicenseSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/opencv/CONTRIB_LICENSE`,
    value.privateInput.opencvContribLicenseSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`,
    value.privateInput.cudaForwardCompatPackageSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json`,
    value.privateInput.cudaForwardCompatReceiptSha256,
  )
  const privateEntries = entries.filter((entry) =>
    entry.path.startsWith(`${PRIVATE_INPUT_DIRECTORY}/`))
  const wheels = entries.filter((entry) =>
    entry.path.startsWith(`${PRIVATE_INPUT_DIRECTORY}/python/wheelhouse/`))
  if (
    privateEntries.length !== value.privateInput.artifactCount
    || wheels.length < 1
    || entries.some((entry) => !isAllowedBuildSourcePath(entry.path))
  ) throw new Error('Track All L4 build entry allowlist is invalid.')
}

function isAllowedBuildSourcePath(path: string): boolean {
  if ([
    DOCKERFILE_PATH,
    'docker/prod/gpu-worker/track-all-task-qa/runner.py',
    'docker/prod/gpu-worker/track-all-task-qa/entrypoint.sh',
    'docker/prod/gpu-worker/track-all-task-qa/verify-private-build-input.py',
    'docker/prod/gpu-worker/track-all-task-qa/source-provenance.lock',
    `${PRIVATE_INPUT_DIRECTORY}/capsule-manifest.json`,
    `${PRIVATE_INPUT_DIRECTORY}/python/requirements.lock.txt`,
    `${PRIVATE_INPUT_DIRECTORY}/opencv/opencv-cuda-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/opencv/opencv-build-information.txt`,
    `${PRIVATE_INPUT_DIRECTORY}/opencv/LICENSE`,
    `${PRIVATE_INPUT_DIRECTORY}/opencv/CONTRIB_LICENSE`,
    `${PRIVATE_INPUT_DIRECTORY}/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json`,
  ].includes(path)) return true
  const wheelPrefix = `${PRIVATE_INPUT_DIRECTORY}/python/wheelhouse/`
  if (path.startsWith(wheelPrefix)) return (
    /^[A-Za-z0-9][A-Za-z0-9._+-]{0,199}\.whl$/u.test(
      path.slice(wheelPrefix.length),
    )
  )
  const opencvRuntimePrefix =
    `${PRIVATE_INPUT_DIRECTORY}/opencv/install/`
  return path.startsWith(opencvRuntimePrefix)
    && /^[A-Za-z0-9][A-Za-z0-9._+/-]{0,399}$/u.test(
      path.slice(opencvRuntimePrefix.length),
    )
}

function isSafeArchivePath(path: string): boolean {
  return !path.startsWith('/')
    && !path.includes('\\')
    && path.split('/').every((part) =>
      part.length > 0 && part !== '.' && part !== '..')
}

async function inspectCanonicalTarStream(
  stream: AsyncIterable<Uint8Array>,
): Promise<{
  readonly regularFileEntries:
    readonly z.infer<typeof buildSourceEntrySchema>[]
  readonly directoryEntries: readonly string[]
}> {
  let pending = Buffer.alloc(0)
  let totalUncompressed = 0
  let zeroBlocks = 0
  let current: {
    path: string
    byteLength: number
    remaining: number
    padding: number
    digest: ReturnType<typeof createHash>
  } | null = null
  const entries: z.infer<typeof buildSourceEntrySchema>[] = []
  const directories: string[] = []
  let lastEntryPath: string | null = null
  const completeCurrent = (): void => {
    if (!current || current.remaining !== 0 || current.padding !== 0) return
    entries.push(buildSourceEntrySchema.parse({
      path: current.path,
      byteLength: current.byteLength,
      sha256: current.digest.digest('hex'),
    }))
    current = null
  }
  for await (const rawChunk of stream) {
    const chunk = Buffer.from(rawChunk)
    totalUncompressed += chunk.byteLength
    if (totalUncompressed > MAXIMUM_UNCOMPRESSED_BUILD_SOURCE_BYTES) {
      throw new Error('Track All L4 build source expands beyond bound.')
    }
    pending = Buffer.concat([pending, chunk])
    while (pending.length > 0) {
      if (current) {
        if (current.remaining > 0) {
          const consumed = Math.min(current.remaining, pending.length)
          current.digest.update(pending.subarray(0, consumed))
          current.remaining -= consumed
          pending = pending.subarray(consumed)
          if (current.remaining > 0) break
        }
        if (current.padding > 0) {
          const consumed = Math.min(current.padding, pending.length)
          if (!pending.subarray(0, consumed).every((item) => item === 0)) {
            throw new Error('Track All L4 tar padding is not canonical.')
          }
          current.padding -= consumed
          pending = pending.subarray(consumed)
          if (current.padding > 0) break
        }
        completeCurrent()
        continue
      }
      if (pending.length < 512) break
      const header = pending.subarray(0, 512)
      pending = pending.subarray(512)
      if (header.every((item) => item === 0)) {
        zeroBlocks += 1
        continue
      }
      if (zeroBlocks > 0) {
        throw new Error('Track All L4 tar has data after terminator.')
      }
      if (entries.length + directories.length >= MAXIMUM_BUILD_SOURCE_ENTRIES) {
        throw new Error('Track All L4 tar has too many entries.')
      }
      verifyTarHeaderChecksum(header)
      const type = header[156]
      if (type !== 0 && type !== 48 && type !== 53) {
        throw new Error('Track All L4 tar contains non-regular entry.')
      }
      const name = readTarString(header.subarray(0, 100))
      const prefix = readTarString(header.subarray(345, 500))
      const rawPath = prefix ? `${prefix}/${name}` : name
      const directory = type === 53
      const path = directory && rawPath.endsWith('/')
        ? rawPath.slice(0, -1) : rawPath
      if (!isSafeArchivePath(path)) {
        throw new Error('Track All L4 tar entry path is unsafe.')
      }
      if (lastEntryPath !== null && !(lastEntryPath < path)) {
        throw new Error('Track All L4 tar entries are not canonical.')
      }
      lastEntryPath = path
      const byteLength = readTarOctal(header.subarray(124, 136))
      if (directory) {
        if (byteLength !== 0) {
          throw new Error('Track All L4 tar directory is not empty.')
        }
        directories.push(path)
        continue
      }
      if (byteLength <= 0
        || byteLength > MAXIMUM_UNCOMPRESSED_BUILD_SOURCE_BYTES) {
        throw new Error('Track All L4 tar entry length is invalid.')
      }
      current = {
        path,
        byteLength,
        remaining: byteLength,
        padding: (512 - (byteLength % 512)) % 512,
        digest: createHash('sha256'),
      }
    }
  }
  if (current || pending.length !== 0 || zeroBlocks < 2) {
    throw new Error('Track All L4 tar is truncated.')
  }
  const directorySet = new Set(directories)
  for (const entry of entries) {
    const parts = entry.path.split('/')
    for (let index = 1; index < parts.length; index += 1) {
      if (!directorySet.has(parts.slice(0, index).join('/'))) {
        throw new Error('Track All L4 tar parent directory is missing.')
      }
    }
  }
  return Object.freeze({
    regularFileEntries: Object.freeze(entries),
    directoryEntries: Object.freeze(directories),
  })
}

function readTarString(value: Uint8Array): string {
  const end = value.indexOf(0)
  return Buffer.from(end < 0 ? value : value.subarray(0, end))
    .toString('utf8')
}

function readTarOctal(value: Uint8Array): number {
  const text = readTarString(value).trim()
  if (!/^[0-7]+$/u.test(text)) throw new Error('Tar octal field invalid.')
  const result = Number.parseInt(text, 8)
  if (!Number.isSafeInteger(result)) throw new Error('Tar size overflowed.')
  return result
}

function verifyTarHeaderChecksum(header: Uint8Array): void {
  const expected = readTarOctal(header.subarray(148, 156))
  let actual = 0
  for (let index = 0; index < header.length; index += 1) {
    actual += index >= 148 && index < 156 ? 32 : header[index]
  }
  if (actual !== expected) throw new Error('Tar header checksum invalid.')
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (current: unknown): void => {
    if (current === null || ['string', 'number', 'boolean'].includes(
      typeof current,
    )) return
    if (typeof current !== 'object') throw new Error(`${label}_not_json`)
    if (seen.has(current)) throw new Error(`${label}_cyclic`)
    seen.add(current)
    if (Array.isArray(current)) {
      if (Object.keys(current).length !== current.length) {
        throw new Error(`${label}_sparse_array`)
      }
      for (let index = 0; index < current.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(
          current,
          String(index),
        )
        if (!descriptor || descriptor.get || descriptor.set
          || !descriptor.enumerable) {
          throw new Error(`${label}_unsafe_array_property`)
        }
        visit(descriptor.value)
      }
      seen.delete(current)
      return
    }
    const prototype = Object.getPrototypeOf(current)
    if (prototype !== Object.prototype) {
      throw new Error(`${label}_not_plain`)
    }
    for (const key of Reflect.ownKeys(current)) {
      if (typeof key !== 'string') throw new Error(`${label}_symbol_key`)
      const descriptor = Object.getOwnPropertyDescriptor(current, key)
      if (!descriptor || descriptor.get || descriptor.set
        || !descriptor.enumerable) throw new Error(`${label}_unsafe_property`)
      visit(descriptor.value)
    }
    seen.delete(current)
  }
  try {
    visit(value)
  } catch (error) {
    throw error instanceof Error ? error : new Error(`${label}_invalid`)
  }
}

export function canonicalTrackAllSam31L4TaskQaCloudBuildBodyDigest(
  request: CanonicalTrackAllSam31L4TaskQaCloudBuildRequest,
): string {
  return createHash('sha256')
    .update(stableAuthorityStringify(request.body), 'utf8')
    .digest('hex')
}
