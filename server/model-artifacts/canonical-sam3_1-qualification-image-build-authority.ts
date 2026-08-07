import { z } from 'zod'

import {
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from './canonical-sam3_1-private-artifact-ingest'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  assertCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from './canonical-sam3_1-source-runtime-candidate'
import {
  verifyCanonicalSam31PrivateBuildCapsuleBytes,
  type CanonicalSam31CapsuleArchiveEntry,
  type CanonicalSam31PrivateBuildCapsuleReadPort,
} from './canonical-sam3_1-cloud-image-build-authority'
import { assertPlainSerializedData } from '../services/canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_CAPSULE_MANIFEST_VERSION =
  'canonical-sam3_1-qualification-image-capsule-manifest-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_AUTHORITY_VERSION =
  'canonical-sam3_1-qualification-image-build-authority-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const BUILD_INPUT_BUCKET =
  'reeditpro-production-reeditpro-image-build-inputs' as const
const BUILD_INPUT_PREFIX =
  'private/image-build-inputs/sam3_1/qualification/' as const
const IMAGE_REPOSITORY =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const
const IMAGE_NAME = 'reeditpro-sam31-qualification' as const
const DOCKERFILE_PATH =
  'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate' as const
const PRIVATE_INPUT_DIRECTORY = 'sam31_private_build_input' as const
const SOURCE_SHA256 =
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a' as const
const PATCHED_SOURCE_SHA256 =
  'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb' as const
const PATCH_SHA256 =
  'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca' as const
const CUDA_FORWARD_COMPAT_SHA256 =
  'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893' as const
const CUDA_NPP_SHA256 =
  '54febea3b7a793e65318647c0548c0fea2416ef0a7dc70c672c6877f3bcba992' as const
const FFMPEG_SHA256 =
  '5c868087e6a0d4243b97776c16f3bfe1511cc53f15c26c822b393a3289608121' as const
const PKGCONF_SHA256 =
  '67dd778366d1a094f26a9bf5ad0cce1b2e25588420c49a4c9fea6452a6eef829' as const
const NV_CODEC_HEADERS_SHA256 =
  'dbeaec433d93b850714760282f1d0992b1254fc3b5a6cb7d76fc1340a1e47563' as const
const EINOPS_WHEEL_SHA256 =
  '54058201ac7087911181bfec4af6091bb59380360f069276601256a76af08193' as const
const EINOPS_INGEST_RECEIPT_SHA256 =
  'd882124bbea8f586e16df53c7062ffce3d9e1499c350ae1ccec0b25fab870608' as const
const PYCOCOTOOLS_WHEEL_SHA256 =
  'a82d1c9ed83f75da0b3f244f2a3cf559351a283307bd9b79a4ee2b93ab3231dd' as const
const PYCOCOTOOLS_INGEST_RECEIPT_SHA256 =
  'a47f679998c2a8d93d1f8e579a94a00bf4c9ca6ac9f7f40a9486a645177fdea3' as const
const SECURITY_REMEDIATION_DOCKERFILE_SHA256 =
  '5aa4c8914c1a9989a5764e7d5cf133ba4c32db0f1646d97b92701e974a009178' as const
const SECURITY_REMEDIATION_SOURCE_PROVENANCE_LOCK_SHA256 =
  'c7b8b39acbb685bddc04ff4f30832a7ffd568a6b5954f973ca61d5e223ffbd3d' as const
const SECURITY_REMEDIATION_DEPENDENCY_LOCK_SHA256 =
  '4f2dfbf929c5d6451fd5b21ed0dfb3ae54c7ed004b531ee97b4bc4dce9294843' as const
const SECURITY_REMEDIATION_DEPENDENCY_CLOSURE_RECEIPT_SHA256 =
  '333dad942d2dc750a9f3908e9db90aacd5b3de63240604ca7a5bdface4bbd2b2' as const
const SECURITY_REMEDIATION_WHEEL_MANIFEST_SHA256 =
  '415d1576d7c9b171566e30168a82d7e5149155eef29e8c01a586f9275e8fcc03' as const
const OPENSSL_SECURITY_DEB_SHA256 =
  '321b30ad5a1c3783cb3d73ae439f824f6d3874d76a93a62f4a984959b490aa7b' as const
const LIBSSL3_SECURITY_DEB_SHA256 =
  '6a963adb1106fca567d24d4a1e5da0bad25de79ac2564cd1ba846e677e1c951b' as const
const LIBSSL_DEV_SECURITY_DEB_SHA256 =
  '9a5cf7bc8e876ef4498ddf0180b6fafe0e52c2a8da2f06f8bc78c2a6fc92ec58' as const
const SECURITY_UPDATE_RECEIPT_SHA256 =
  'b3ff4e1e67b428818399c3261eb95a7c0e034d073b2f70fa65f8f1ab46f25a19' as const
const URLLIB3_2_7_WHEEL_SHA256 =
  '9fb4c81ebbb1ce9531cce37674bbc6f1360472bc18ca9a553ede278ef7276897' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const gitSha = z.string().regex(/^[a-f0-9]{40}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const coordinateSchema = z.object({
  projectId: z.literal(PROJECT_ID),
  bucketName: z.literal(BUILD_INPUT_BUCKET),
  objectName: z.string().min(1).max(1_024)
    .refine((value) => value.startsWith(BUILD_INPUT_PREFIX))
    .refine((value) => value.endsWith('.tar.gz'))
    .refine((value) => !value.includes('..') && !value.includes('\\')),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().trim().min(1).max(512),
  byteLength: positiveInteger.max(8 * 1024 * 1024 * 1024),
  sha256,
}).strict()
const archiveEntrySchema = z.object({
  path: z.string().min(1).max(255)
    .refine((value) => !value.startsWith('/') && !value.includes('\\'))
    .refine((value) => value.split('/').every((part) =>
      part.length > 0 && part !== '.' && part !== '..')),
  byteLength: positiveInteger,
  sha256,
}).strict()

const manifestWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_CAPSULE_MANIFEST_VERSION,
  ),
  source: z.literal('canonical_sam3_1_private_image_build_capsule_owner'),
  buildPurpose: z.literal('source_checkpoint_qualification'),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum(['contract_only', 'private_capsule_verified']),
  manifestId: safeId,
  manifestVersion: z.literal(1),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  candidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: sha256,
  }).strict(),
  ingestReceiptRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  repositorySource: z.object({
    commitSha: gitSha,
    treeSha: gitSha,
    sourceBundleRef: evidenceRefSchema,
    sourcePublished: z.boolean(),
    sourceClean: z.boolean(),
    dockerfilePath: z.literal(DOCKERFILE_PATH),
    dockerfileSha256: sha256,
    runnerSha256: sha256,
    entrypointSha256: sha256,
    sourceProvenanceLockSha256: sha256,
    gpuDecodePatchSha256: z.literal(PATCH_SHA256),
  }).strict(),
  privateInput: z.object({
    directoryName: z.literal(PRIVATE_INPUT_DIRECTORY),
    deterministicSourceArchiveSha256: z.literal(SOURCE_SHA256),
    deterministicPatchedSourceArchiveSha256:
      z.literal(PATCHED_SOURCE_SHA256),
    patchApplicationReceiptSha256: sha256,
    dependencyLockSha256: sha256,
    dependencyClosureReceiptSha256: sha256,
    dependencyWheelManifestSha256: sha256,
    dependencyWheelCount: positiveInteger.max(256),
    cudaForwardCompatPackageSha256:
      z.literal(CUDA_FORWARD_COMPAT_SHA256),
    cudaForwardCompatIngestReceiptSha256: sha256,
    sourceCheckpointQualificationReceiptIncluded: z.literal(false),
    checkpointBytesIncluded: z.literal(false),
  }).strict(),
  capsule: z.object({
    coordinate: coordinateSchema,
    format: z.literal('tar_gzip'),
    contentType: z.literal('application/gzip'),
    storageContentType: z.literal('application/x-tar'),
    capsuleArtifactRef: evidenceRefSchema,
    archiveEntries: z.array(archiveEntrySchema).min(14).max(512),
    archiveEntrySetSha256: sha256,
    archiveEntriesReread: z.literal(true),
    exactByteLengthAndSha256Reread: z.literal(true),
    generationAndEtagStableBeforeAndAfterRead: z.literal(true),
    prohibitedEntryScanPassed: z.literal(true),
    absoluteParentTraversalSymlinkDeviceAndSocketEntriesAbsent:
      z.literal(true),
  }).strict(),
  securityBoundary: z.object({
    qualificationImageOnly: z.literal(true),
    checkpointBytesIncluded: z.literal(false),
    qualificationReceiptIncluded: z.literal(false),
    repositoryOrProviderTokenIncluded: z.literal(false),
    privateStorageCoordinateEmbeddedInImage: z.literal(false),
    callerCommandDockerfileImageTagOrBuildArgsAccepted: z.literal(false),
    networkDependencyInstallRequired: z.literal(false),
    buildSecretsRequired: z.literal(false),
    capsuleCreateOnlyAndPrivate: z.literal(true),
    reproducibilityRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
  }).strict(),
  preparedAt: timestamp,
}).strict().superRefine((manifest, context) => {
  try {
    const canonical = manifest.evidenceClass === 'canonical_private_reread'
    assertQualificationCapsuleEntries(manifest, canonical)
    if (
      manifest.capsule.capsuleArtifactRef.contentHash !==
        `sha256:${manifest.capsule.coordinate.sha256}`
      || (canonical
        ? manifest.status !== 'private_capsule_verified'
          || !manifest.repositorySource.sourcePublished
          || !manifest.repositorySource.sourceClean
        : manifest.status !== 'contract_only')
    ) throw new Error('qualification image capsule lineage changed')
  } catch {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 qualification image capsule is not admissible.',
    })
  }
})

export const canonicalSam31QualificationImageCapsuleManifestSchema =
  manifestWithoutHashSchema.extend({ manifestHash: sha256 }).strict()
export type CanonicalSam31QualificationImageCapsuleManifest = z.infer<
  typeof canonicalSam31QualificationImageCapsuleManifestSchema
>

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_AUTHORITY_VERSION,
  ),
  source: z.literal('canonical_sam3_1_cloud_image_build_authority_owner'),
  buildPurpose: z.literal('source_checkpoint_qualification'),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum(['contract_only', 'authorized_for_private_cloud_build']),
  authorityId: safeId,
  authorityVersion: z.literal(1),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  candidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: sha256,
  }).strict(),
  ingestReceiptRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  capsuleManifestRef: evidenceRefSchema,
  capsuleCoordinate: coordinateSchema,
  imageDestination: z.object({
    repository: z.literal(IMAGE_REPOSITORY),
    imageName: z.literal(IMAGE_NAME),
    tag: z.string().regex(/^sam31-qual-96914d2-[a-f0-9]{16}$/u),
    taggedUri: z.string().regex(
      /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-qualification:sam31-qual-96914d2-[a-f0-9]{16}$/u,
    ),
    callerSelectedTagAllowed: z.literal(false),
    tagMayAuthorizeQualificationOrRuntime: z.literal(false),
    terminalImmutableDigestRequired: z.literal(true),
  }).strict(),
  buildClosure: z.object({
    dockerfilePath: z.literal(DOCKERFILE_PATH),
    dockerfileSha256: sha256,
    runnerSha256: sha256,
    entrypointSha256: sha256,
    sourceProvenanceLockSha256: sha256,
    dependencyLockSha256: sha256,
    dependencyClosureReceiptSha256: sha256,
    dependencyWheelManifestSha256: sha256,
    patchApplicationReceiptSha256: sha256,
    cudaForwardCompatIngestReceiptSha256: sha256,
  }).strict(),
  cloudBuildPolicy: z.object({
    projectId: z.literal(PROJECT_ID),
    location: z.literal(REGION),
    regionalCreateEndpoint: z.literal(
      'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds',
    ),
    builderImage: z.literal(
      'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
    ),
    serviceAccount: z.literal(
      'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
    ),
    machineType: z.enum(['E2_HIGHCPU_32', 'E2_STANDARD_2']),
    diskSizeGb: z.literal('200'),
    timeout: z.literal('3600s'),
    queueTtl: z.literal('600s'),
    sourceFetcher: z.literal('GCS_FETCHER'),
    sourceProvenanceHashes: z.tuple([z.literal('SHA256')]),
    requestedVerifyOption: z.literal('VERIFIED'),
    logging: z.literal('CLOUD_LOGGING_ONLY'),
    noSecretsOrSubstitutions: z.literal(true),
    noTriggerOrMutableRepositorySource: z.literal(true),
    singleFixedBuildStep: z.literal(true),
  }).strict(),
  authority: z.object({
    canonicalPrivateIngestReread: z.boolean(),
    privateCapsuleReread: z.boolean(),
    qualificationImageBuildAuthorized: z.boolean(),
    sourceCheckpointQualificationRequiredBeforeBuild: z.literal(false),
    durableSingleUseConsumptionRequiredBeforeCloudCall: z.literal(true),
    browserOrCallerMaySubmitBuild: z.literal(false),
    checkpointIncludedInImage: z.literal(false),
    qualificationReceiptIncludedInImage: z.literal(false),
    imageBuildStarted: z.literal(false),
    imagePushed: z.literal(false),
    sourceCheckpointQualificationGranted: z.literal(false),
    runtimeReleaseGranted: z.literal(false),
    gpuJobDispatched: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    qaApproved: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  preparedAt: timestamp,
}).strict().superRefine((authority, context) => {
  const expectedTag =
    `sam31-qual-96914d2-${authority.capsuleCoordinate.sha256.slice(0, 16)}`
  const canonical = authority.evidenceClass === 'canonical_private_reread'
  if (
    authority.imageDestination.tag !== expectedTag
    || authority.imageDestination.taggedUri !==
      `${IMAGE_REPOSITORY}/${IMAGE_NAME}:${expectedTag}`
    || (canonical
      ? authority.status !== 'authorized_for_private_cloud_build'
        || !authority.authority.canonicalPrivateIngestReread
        || !authority.authority.privateCapsuleReread
        || !authority.authority.qualificationImageBuildAuthorized
      : authority.status !== 'contract_only'
        || authority.authority.qualificationImageBuildAuthorized)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification image authority lost exact lineage.',
  })
})

export const canonicalSam31QualificationImageBuildAuthoritySchema =
  authorityWithoutHashSchema.extend({ authorityHash: sha256 }).strict()
export type CanonicalSam31QualificationImageBuildAuthority = z.infer<
  typeof canonicalSam31QualificationImageBuildAuthoritySchema
>

export function createCanonicalSam31QualificationImageCapsuleManifest(
  input: Omit<
    z.input<typeof manifestWithoutHashSchema>,
    'schemaVersion' | 'source' | 'buildPurpose'
  >,
): CanonicalSam31QualificationImageCapsuleManifest {
  assertPlainSerializedData(input, 'sam3_1_qualification_image_capsule')
  const payload = manifestWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_CAPSULE_MANIFEST_VERSION,
    source: 'canonical_sam3_1_private_image_build_capsule_owner',
    buildPurpose: 'source_checkpoint_qualification',
    ...input,
  })
  return canonicalSam31QualificationImageCapsuleManifestSchema.parse({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

export async function prepareCanonicalSam31QualificationImageBuildAuthority(
  input: {
    readonly authorityId: string
    readonly candidate: CanonicalSam31SourceRuntimeCandidate
    readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
    readonly capsuleManifest: CanonicalSam31QualificationImageCapsuleManifest
    readonly privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
    readonly cloudBuildMachineType?: 'E2_HIGHCPU_32' | 'E2_STANDARD_2'
    readonly preparedAt: string
  },
): Promise<CanonicalSam31QualificationImageBuildAuthority> {
  assertPlainSerializedData(
    {
      authorityId: input.authorityId,
      candidate: input.candidate,
      ingestReceipt: input.ingestReceipt,
      capsuleManifest: input.capsuleManifest,
      preparedAt: input.preparedAt,
    },
    'sam3_1_qualification_image_authority_input',
  )
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    input.ingestReceipt,
  )
  const manifest = assertCanonicalSam31QualificationImageCapsuleManifest(
    input.capsuleManifest,
  )
  const canonical = ingest.evidenceClass === 'canonical_private_reread'
  if (
    ingest.candidateRef.candidateHash !== candidate.candidateHash
    || ingest.candidateRef.schemaVersion !== candidate.schemaVersion
    || manifest.candidateRef.candidateHash !== candidate.candidateHash
    || manifest.ingestReceiptRef.contentHash !==
      `sha256:${ingest.ingestReceiptHash}`
    || manifest.evidenceClass !== ingest.evidenceClass
    || (canonical && (
      ingest.status !== 'ready_for_immutable_image_build_review'
      || !ingest.authority.canonicalTermsAcceptanceObserved
      || !ingest.authority.imageBuildReviewEligible
    ))
  ) throw new Error('SAM 3.1 qualification image inputs crossed authority.')
  const inspection = await verifyCanonicalSam31PrivateBuildCapsuleBytes(
    manifest.capsule.coordinate,
    input.privateCapsuleReadPort,
    manifest.capsule.storageContentType,
  )
  if (
    inspection.archiveEntrySetSha256 !==
      manifest.capsule.archiveEntrySetSha256
    || sha256AuthorityValue(inspection.archiveEntries) !==
      sha256AuthorityValue(manifest.capsule.archiveEntries)
  ) throw new Error('SAM 3.1 qualification image capsule reread failed.')
  const tag =
    `sam31-qual-96914d2-${manifest.capsule.coordinate.sha256.slice(0, 16)}`
  const payload = authorityWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_AUTHORITY_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_authority_owner',
    buildPurpose: 'source_checkpoint_qualification',
    evidenceClass: ingest.evidenceClass,
    status: canonical
      ? 'authorized_for_private_cloud_build'
      : 'contract_only',
    authorityId: input.authorityId,
    authorityVersion: 1,
    operationId: candidate.operationId,
    candidateRef: ingest.candidateRef,
    ingestReceiptRef: manifest.ingestReceiptRef,
    capsuleManifestRef: {
      id: manifest.manifestId,
      version: manifest.manifestVersion,
      contentHash: `sha256:${manifest.manifestHash}`,
    },
    capsuleCoordinate: manifest.capsule.coordinate,
    imageDestination: {
      repository: IMAGE_REPOSITORY,
      imageName: IMAGE_NAME,
      tag,
      taggedUri: `${IMAGE_REPOSITORY}/${IMAGE_NAME}:${tag}`,
      callerSelectedTagAllowed: false,
      tagMayAuthorizeQualificationOrRuntime: false,
      terminalImmutableDigestRequired: true,
    },
    buildClosure: {
      dockerfilePath: manifest.repositorySource.dockerfilePath,
      dockerfileSha256: manifest.repositorySource.dockerfileSha256,
      runnerSha256: manifest.repositorySource.runnerSha256,
      entrypointSha256: manifest.repositorySource.entrypointSha256,
      sourceProvenanceLockSha256:
        manifest.repositorySource.sourceProvenanceLockSha256,
      dependencyLockSha256: manifest.privateInput.dependencyLockSha256,
      dependencyClosureReceiptSha256:
        manifest.privateInput.dependencyClosureReceiptSha256,
      dependencyWheelManifestSha256:
        manifest.privateInput.dependencyWheelManifestSha256,
      patchApplicationReceiptSha256:
        manifest.privateInput.patchApplicationReceiptSha256,
      cudaForwardCompatIngestReceiptSha256:
        manifest.privateInput.cudaForwardCompatIngestReceiptSha256,
    },
    cloudBuildPolicy: {
      projectId: PROJECT_ID,
      location: REGION,
      regionalCreateEndpoint:
        'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds',
      builderImage:
        'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
      serviceAccount:
        'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
      machineType: input.cloudBuildMachineType ?? 'E2_HIGHCPU_32',
      diskSizeGb: '200',
      timeout: '3600s',
      queueTtl: '600s',
      sourceFetcher: 'GCS_FETCHER',
      sourceProvenanceHashes: ['SHA256'],
      requestedVerifyOption: 'VERIFIED',
      logging: 'CLOUD_LOGGING_ONLY',
      noSecretsOrSubstitutions: true,
      noTriggerOrMutableRepositorySource: true,
      singleFixedBuildStep: true,
    },
    authority: {
      canonicalPrivateIngestReread: canonical,
      privateCapsuleReread: canonical,
      qualificationImageBuildAuthorized: canonical,
      sourceCheckpointQualificationRequiredBeforeBuild: false,
      durableSingleUseConsumptionRequiredBeforeCloudCall: true,
      browserOrCallerMaySubmitBuild: false,
      checkpointIncludedInImage: false,
      qualificationReceiptIncludedInImage: false,
      imageBuildStarted: false,
      imagePushed: false,
      sourceCheckpointQualificationGranted: false,
      runtimeReleaseGranted: false,
      gpuJobDispatched: false,
      customerCreditMutationAllowed: false,
      qaApproved: false,
      productionReady: false,
    },
    preparedAt: input.preparedAt,
  })
  return canonicalSam31QualificationImageBuildAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31QualificationImageCapsuleManifest(
  value: unknown,
): CanonicalSam31QualificationImageCapsuleManifest {
  assertPlainSerializedData(value, 'sam3_1_qualification_image_capsule')
  const parsed = canonicalSam31QualificationImageCapsuleManifestSchema
    .parse(value)
  const { manifestHash, ...payload } = parsed
  if (manifestHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification image capsule hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationImageBuildAuthority(
  value: unknown,
): CanonicalSam31QualificationImageBuildAuthority {
  assertPlainSerializedData(value, 'sam3_1_qualification_image_authority')
  const parsed = canonicalSam31QualificationImageBuildAuthoritySchema
    .parse(value)
  const { authorityHash, ...payload } = parsed
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification image authority hash is invalid.')
  }
  return parsed
}

function assertQualificationCapsuleEntries(
  manifest: z.input<typeof manifestWithoutHashSchema>,
  canonical: boolean,
): void {
  const entries = manifest.capsule.archiveEntries
  for (let index = 1; index < entries.length; index += 1) {
    if (!(entries[index - 1].path < entries[index].path)) {
      throw new Error('Qualification capsule entries are not ordered.')
    }
  }
  if (
    manifest.capsule.archiveEntrySetSha256 !== sha256AuthorityValue(entries)
  ) throw new Error('Qualification capsule entry digest is invalid.')
  const byPath = new Map(entries.map((entry) => [entry.path, entry]))
  const required = (path: string, expectedHash: string): void => {
    if (byPath.get(path)?.sha256 !== expectedHash) {
      throw new Error(`Qualification capsule entry ${path} changed.`)
    }
  }
  required(DOCKERFILE_PATH, manifest.repositorySource.dockerfileSha256)
  required(
    'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
    manifest.repositorySource.runnerSha256,
  )
  required(
    'docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh',
    manifest.repositorySource.entrypointSha256,
  )
  required(
    'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
    manifest.repositorySource.sourceProvenanceLockSha256,
  )
  required(
    'docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch',
    manifest.repositorySource.gpuDecodePatchSha256,
  )
  const requirePresent = (path: string): void => {
    if (!byPath.has(path)) {
      throw new Error(`Qualification capsule entry ${path} is absent.`)
    }
  }
  const sourceArchivePath =
    `${PRIVATE_INPUT_DIRECTORY}/source/sam3-96914d2425f90a64f45ca977c2b5165418099543.tar`
  const patchedSourceArchivePath =
    `${PRIVATE_INPUT_DIRECTORY}/source/sam3-96914d2425f90a64f45ca977c2b5165418099543-reeditpro-gpu-decode.tar`
  const cudaPackagePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`
  const cudaNppPackagePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-npp/libnpp-12-8_12.3.3.100-1_amd64.deb`
  const cudaNppReceiptPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-npp/cuda-npp-runtime-receipt.json`
  const ffmpegSourcePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/ffmpeg-8.0.3.tar.gz`
  const pkgconfSourcePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/pkgconf-3.0.4.tar.gz`
  const nvCodecHeadersSourcePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/nv-codec-headers-n12.2.72.0.tar.gz`
  const ffmpegReceiptPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json`
  const einopsWheelPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/wheelhouse/einops-0.8.2-py3-none-any.whl`
  const einopsIngestReceiptPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/python-ingest/einops/einops-ingest-receipt.json`
  const pycocotoolsWheelPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/wheelhouse/pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl`
  const pycocotoolsIngestReceiptPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/python-ingest/pycocotools/pycocotools-ingest-receipt.json`
  const osSecurityPrefix =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/`
  const opensslSecurityDebPath =
    `${osSecurityPrefix}openssl_3.0.13-0ubuntu3.12_amd64.deb`
  const libssl3SecurityDebPath =
    `${osSecurityPrefix}libssl3t64_3.0.13-0ubuntu3.12_amd64.deb`
  const libsslDevSecurityDebPath =
    `${osSecurityPrefix}libssl-dev_3.0.13-0ubuntu3.12_amd64.deb`
  const securityUpdateReceiptPath =
    `${osSecurityPrefix}security-update-receipt.json`
  const urllib3SecurityWheelPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/wheelhouse/urllib3-2.7.0-py3-none-any.whl`
  const legacyUrllib3WheelPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/wheelhouse/urllib3-2.6.3-py3-none-any.whl`
  const dockerfileIsSecurityRemediated =
    manifest.repositorySource.dockerfileSha256 ===
      SECURITY_REMEDIATION_DOCKERFILE_SHA256
  const provenanceLockIsSecurityRemediated =
    manifest.repositorySource.sourceProvenanceLockSha256 ===
      SECURITY_REMEDIATION_SOURCE_PROVENANCE_LOCK_SHA256
  const securityRemediated = canonical && dockerfileIsSecurityRemediated
    && provenanceLockIsSecurityRemediated
  if (
    canonical && (
      dockerfileIsSecurityRemediated !== provenanceLockIsSecurityRemediated
      || (!securityRemediated && entries.some((entry) =>
        entry.path.startsWith(osSecurityPrefix)))
    )
  ) throw new Error('Qualification capsule security lineage crossed.')
  requirePresent(sourceArchivePath)
  requirePresent(patchedSourceArchivePath)
  requirePresent(cudaPackagePath)
  requirePresent(cudaNppPackagePath)
  requirePresent(cudaNppReceiptPath)
  requirePresent(ffmpegSourcePath)
  requirePresent(pkgconfSourcePath)
  requirePresent(nvCodecHeadersSourcePath)
  requirePresent(ffmpegReceiptPath)
  requirePresent(einopsWheelPath)
  requirePresent(einopsIngestReceiptPath)
  requirePresent(pycocotoolsWheelPath)
  requirePresent(pycocotoolsIngestReceiptPath)
  if (securityRemediated) {
    requirePresent(opensslSecurityDebPath)
    requirePresent(libssl3SecurityDebPath)
    requirePresent(libsslDevSecurityDebPath)
    requirePresent(securityUpdateReceiptPath)
    requirePresent(urllib3SecurityWheelPath)
    if (
      byPath.has(legacyUrllib3WheelPath)
      || manifest.privateInput.dependencyWheelCount !== 25
      || manifest.privateInput.dependencyLockSha256 !==
        SECURITY_REMEDIATION_DEPENDENCY_LOCK_SHA256
      || manifest.privateInput.dependencyClosureReceiptSha256 !==
        SECURITY_REMEDIATION_DEPENDENCY_CLOSURE_RECEIPT_SHA256
      || manifest.privateInput.dependencyWheelManifestSha256 !==
        SECURITY_REMEDIATION_WHEEL_MANIFEST_SHA256
    ) throw new Error('Qualification capsule security closure changed.')
  }
  if (canonical) {
    required(
      sourceArchivePath,
      manifest.privateInput.deterministicSourceArchiveSha256,
    )
    required(
      patchedSourceArchivePath,
      manifest.privateInput.deterministicPatchedSourceArchiveSha256,
    )
    required(
      cudaPackagePath,
      manifest.privateInput.cudaForwardCompatPackageSha256,
    )
    required(cudaNppPackagePath, CUDA_NPP_SHA256)
    required(ffmpegSourcePath, FFMPEG_SHA256)
    required(pkgconfSourcePath, PKGCONF_SHA256)
    required(nvCodecHeadersSourcePath, NV_CODEC_HEADERS_SHA256)
    required(einopsWheelPath, EINOPS_WHEEL_SHA256)
    required(einopsIngestReceiptPath, EINOPS_INGEST_RECEIPT_SHA256)
    required(pycocotoolsWheelPath, PYCOCOTOOLS_WHEEL_SHA256)
    required(
      pycocotoolsIngestReceiptPath,
      PYCOCOTOOLS_INGEST_RECEIPT_SHA256,
    )
    if (securityRemediated) {
      required(opensslSecurityDebPath, OPENSSL_SECURITY_DEB_SHA256)
      required(libssl3SecurityDebPath, LIBSSL3_SECURITY_DEB_SHA256)
      required(libsslDevSecurityDebPath, LIBSSL_DEV_SECURITY_DEB_SHA256)
      required(securityUpdateReceiptPath, SECURITY_UPDATE_RECEIPT_SHA256)
      required(urllib3SecurityWheelPath, URLLIB3_2_7_WHEEL_SHA256)
    }
  }
  required(
    `${PRIVATE_INPUT_DIRECTORY}/source/source-patch-application-receipt.json`,
    manifest.privateInput.patchApplicationReceiptSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/requirements.lock.txt`,
    manifest.privateInput.dependencyLockSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/dependency-closure-receipt.json`,
    manifest.privateInput.dependencyClosureReceiptSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json`,
    manifest.privateInput.cudaForwardCompatIngestReceiptSha256,
  )
  const wheelPrefix =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/wheelhouse/`
  const wheels = entries.filter((entry) => entry.path.startsWith(wheelPrefix))
  if (
    wheels.length !== manifest.privateInput.dependencyWheelCount
    || wheels.some((entry) => !isWheelEntry(entry))
    || manifest.privateInput.dependencyWheelManifestSha256 !==
      sha256AuthorityValue(wheels)
    || entries.some((entry) => !isAllowedEntry(entry.path))
    || entries.some((entry) => /checkpoint|sam3\.1_multiplex\.pt/iu.test(
      entry.path,
    ))
  ) throw new Error('Qualification capsule contains inadmissible entries.')
}

function isWheelEntry(entry: CanonicalSam31CapsuleArchiveEntry): boolean {
  return isWheelPath(entry.path)
}

function isWheelPath(path: string): boolean {
  const prefix = `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/wheelhouse/`
  const fileName = path.slice(prefix.length)
  return path.startsWith(prefix)
    && /^[A-Za-z0-9][A-Za-z0-9._+-]{0,199}\.whl$/u.test(fileName)
}

function isAllowedEntry(path: string): boolean {
  return [
    DOCKERFILE_PATH,
    'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
    'docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh',
    'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
    'docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch',
    `${PRIVATE_INPUT_DIRECTORY}/source/sam3-96914d2425f90a64f45ca977c2b5165418099543.tar`,
    `${PRIVATE_INPUT_DIRECTORY}/source/sam3-96914d2425f90a64f45ca977c2b5165418099543-reeditpro-gpu-decode.tar`,
    `${PRIVATE_INPUT_DIRECTORY}/source/source-patch-application-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/requirements.lock.txt`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/dependency-closure-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-npp/libnpp-12-8_12.3.3.100-1_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-npp/cuda-npp-runtime-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/ffmpeg-8.0.3.tar.gz`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/pkgconf-3.0.4.tar.gz`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/nv-codec-headers-n12.2.72.0.tar.gz`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/python-ingest/einops/einops-ingest-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/python-ingest/pycocotools/pycocotools-ingest-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/openssl_3.0.13-0ubuntu3.12_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/libssl3t64_3.0.13-0ubuntu3.12_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/libssl-dev_3.0.13-0ubuntu3.12_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/security-update-receipt.json`,
  ].includes(path) || isWheelPath(path)
}
