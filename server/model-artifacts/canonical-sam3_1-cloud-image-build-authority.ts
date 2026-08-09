import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { createGunzip } from 'node:zlib'

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
  CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
  assertCanonicalSam31SourceCheckpointQualification,
  canonicalSam31SourceCheckpointQualificationRef,
  type CanonicalSam31SourceCheckpointQualification,
} from './canonical-sam3_1-source-checkpoint-qualification'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_IMAGE_BUILD_ARTIFACT_BINDING_VERSION =
  'canonical-sam3_1-image-build-artifact-binding-v2' as const
export const CANONICAL_SAM3_1_PRIVATE_IMAGE_BUILD_CAPSULE_MANIFEST_VERSION =
  'canonical-sam3_1-private-image-build-capsule-manifest-v2' as const
export const CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION =
  'canonical-sam3_1-cloud-image-build-authority-v2' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const BUILD_INPUT_BUCKET =
  'reeditpro-production-reeditpro-image-build-inputs' as const
const BUILD_INPUT_PREFIX =
  'private/image-build-inputs/sam3_1/' as const
const IMAGE_REPOSITORY =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const
const IMAGE_NAME = 'reeditpro-sam31-gpu' as const
const DOCKERFILE_PATH =
  'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate' as const
const PRIVATE_INPUT_DIRECTORY = 'sam31_private_build_input' as const
const MAX_CAPSULE_COMPRESSED_BYTES = 8 * 1024 * 1024 * 1024
const MAX_CAPSULE_UNCOMPRESSED_BYTES = 16 * 1024 * 1024 * 1024
const MAX_CAPSULE_ENTRIES = 512
const PKGCONF_SHA256 =
  '67dd778366d1a094f26a9bf5ad0cce1b2e25588420c49a4c9fea6452a6eef829' as const
const CUDA_NPP_SHA256 =
  '54febea3b7a793e65318647c0548c0fea2416ef0a7dc70c672c6877f3bcba992' as const
const IMPORTLIB_RESOURCES_PATCH_SHA256 =
  '6ce1e6954069aff28498284f4cd140cd9530a3f236d04bc507c799fe8ea3521f' as const
const OPENSSL_LIBSSL_DEV_SHA256 =
  '9a5cf7bc8e876ef4498ddf0180b6fafe0e52c2a8da2f06f8bc78c2a6fc92ec58' as const
const OPENSSL_LIBSSL3_SHA256 =
  '6a963adb1106fca567d24d4a1e5da0bad25de79ac2564cd1ba846e677e1c951b' as const
const OPENSSL_BINARY_SHA256 =
  '321b30ad5a1c3783cb3d73ae439f824f6d3874d76a93a62f4a984959b490aa7b' as const
const OS_SECURITY_UPDATES_RECEIPT_SHA256 =
  'b3ff4e1e67b428818399c3261eb95a7c0e034d073b2f70fa65f8f1ab46f25a19' as const

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
const privateObjectCoordinateSchema = z.object({
  projectId: z.literal(PROJECT_ID),
  bucketName: z.literal(BUILD_INPUT_BUCKET),
  objectName: z.string().min(1).max(1_024)
    .refine((value) => value.startsWith(BUILD_INPUT_PREFIX))
    .refine((value) => value.endsWith('.tar.gz'))
    .refine((value) => !value.includes('..') && !value.includes('\\')),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().trim().min(1).max(512),
  byteLength: positiveInteger,
  sha256,
}).strict()
const capsuleArchiveEntrySchema = z.object({
  path: z.string().min(1).max(255)
    .refine(isSafeCapsulePath),
  byteLength: positiveInteger,
  sha256,
}).strict()
export type CanonicalSam31PrivateCapsuleCoordinate = z.infer<
  typeof privateObjectCoordinateSchema
>
export type CanonicalSam31CapsuleArchiveEntry = z.infer<
  typeof capsuleArchiveEntrySchema
>

const artifactBindingWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_IMAGE_BUILD_ARTIFACT_BINDING_VERSION,
  ),
  source: z.literal('canonical_sam3_1_image_build_artifact_owner'),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum(['contract_only', 'private_artifacts_admitted']),
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
  sourceCheckpointQualificationRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  termsAcceptanceRef: evidenceRefSchema,
  sourceArchive: z.object({
    repository: z.literal('https://github.com/facebookresearch/sam3.git'),
    revision: z.literal('96914d2425f90a64f45ca977c2b5165418099543'),
    artifactRef: evidenceRefSchema,
    byteLength: positiveInteger,
    sha256,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
  }).strict(),
  checkpoint: z.object({
    repository: z.literal('facebook/sam3.1'),
    revision: z.literal('daa63191845a41281374e725f4c9e51c7a824460'),
    fileName: z.literal('sam3.1_multiplex.pt'),
    artifactRef: evidenceRefSchema,
    manifestRef: evidenceRefSchema,
    byteLength: positiveInteger,
    sha256,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
    checkpointBytesIncludedInImageBuildCapsule: z.literal(false),
    checkpointRereadOnlyAtQualifiedRuntime: z.literal(true),
  }).strict(),
  privacyBoundary: z.object({
    sourceOrCheckpointStorageCoordinateIncluded: z.literal(false),
    bucketObjectGenerationEtagIncluded: z.literal(false),
    checkpointBytesIncluded: z.literal(false),
    providerOrRepositoryTokenIncluded: z.literal(false),
    browserOrCallerDataIncluded: z.literal(false),
    opaqueEvidenceRefsOnly: z.literal(true),
  }).strict(),
  authority: z.object({
    sanitizedBuildBindingOnly: z.literal(true),
    privateArtifactIngestReread: z.boolean(),
    sourceCheckpointQualificationReread: z.boolean(),
    imageBuildAuthorized: z.literal(false),
    imageBuildStarted: z.literal(false),
    runtimeAuthorized: z.literal(false),
    checkpointRedistributionAuthorized: z.literal(false),
    qaApproved: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  const canonical = value.evidenceClass === 'canonical_private_reread'
  if (
    canonical
      ? value.status !== 'private_artifacts_admitted'
        || !value.authority.privateArtifactIngestReread
        || !value.authority.sourceCheckpointQualificationReread
        || value.sourceArchive.byteLength !== 73_605_120
        || value.sourceArchive.sha256 !==
          '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
        || value.checkpoint.byteLength < 3_000_000_000
        || value.checkpoint.byteLength > 5_000_000_000
      : value.status !== 'contract_only'
        || value.authority.privateArtifactIngestReread
        || value.authority.sourceCheckpointQualificationReread
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 build binding lost canonical artifact admission.',
  })
})

export const canonicalSam31ImageBuildArtifactBindingSchema =
  artifactBindingWithoutHashSchema.extend({ bindingHash: sha256 }).strict()
export type CanonicalSam31ImageBuildArtifactBinding = z.infer<
  typeof canonicalSam31ImageBuildArtifactBindingSchema
>

const capsuleManifestWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_IMAGE_BUILD_CAPSULE_MANIFEST_VERSION,
  ),
  source: z.literal('canonical_sam3_1_private_image_build_capsule_owner'),
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
  artifactBindingRef: evidenceRefSchema,
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
    gpuDecodePatchSha256: z.literal(
      'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
    ),
    multiplexSessionGpuForwardingPatchSha256: z.literal(
      'fb5c047013629d27d7b8f2aecbf8343a402d2e36de3e24dc1be4347f83d9c86b',
    ).optional(),
    forwardPropagationFrameCountPatchSha256: z.literal(
      '2540f5ba2a4d3f8931554e254d2f1c2c79abd28461f902477b7d64a04784f6de',
    ).optional(),
  }).strict(),
  privateInput: z.object({
    directoryName: z.literal(PRIVATE_INPUT_DIRECTORY),
    deterministicSourceArchiveSha256: z.literal(
      '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
    ),
    deterministicPatchedSourceArchiveSha256: z.literal(
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    ),
    patchApplicationReceiptSha256: sha256,
    dependencyLockSha256: sha256,
    dependencyClosureReceiptSha256: sha256,
    dependencyWheelManifestSha256: sha256,
    dependencyWheelCount: positiveInteger,
    cudaForwardCompatPackageSha256: z.literal(
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    ),
    cudaForwardCompatIngestReceiptSha256: sha256,
    multiplexSessionGpuForwardingPatchSha256: z.literal(
      'fb5c047013629d27d7b8f2aecbf8343a402d2e36de3e24dc1be4347f83d9c86b',
    ).optional(),
    artifactBuildBindingRecordHash: sha256,
    artifactBuildBindingFileSha256: sha256,
    sourceCheckpointQualificationRecordHash: sha256,
    sourceCheckpointCompatibilityReceiptSha256: sha256,
  }).strict(),
  capsule: z.object({
    coordinate: privateObjectCoordinateSchema,
    format: z.literal('tar_gzip'),
    contentType: z.literal('application/gzip'),
    capsuleArtifactRef: evidenceRefSchema,
    archiveEntries: z.array(capsuleArchiveEntrySchema)
      .min(16)
      .max(MAX_CAPSULE_ENTRIES),
    archiveEntrySetSha256: sha256,
    archiveEntriesReread: z.literal(true),
    exactByteLengthAndSha256Reread: z.literal(true),
    generationAndEtagStableBeforeAndAfterRead: z.literal(true),
    prohibitedEntryScanPassed: z.literal(true),
    absoluteParentTraversalSymlinkDeviceAndSocketEntriesAbsent:
      z.literal(true),
  }).strict(),
  securityBoundary: z.object({
    checkpointBytesIncluded: z.literal(false),
    repositoryOrProviderTokenIncluded: z.literal(false),
    privateStorageCoordinateEmbeddedInImageInputReceipts: z.literal(false),
    callerCommandDockerfileImageTagOrBuildArgsAccepted: z.literal(false),
    networkDependencyInstallRequired: z.literal(false),
    buildSecretsRequired: z.literal(false),
    capsuleCreateOnlyAndPrivate: z.literal(true),
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
  }).strict(),
  preparedAt: timestamp,
}).strict().superRefine((value, context) => {
  const canonical = value.evidenceClass === 'canonical_private_reread'
  try {
    assertCapsuleManifestEntries(value, canonical)
    if (
      value.privateInput.artifactBuildBindingRecordHash !==
        value.artifactBindingRef.contentHash.slice('sha256:'.length)
      || value.capsule.coordinate.sha256 !==
        value.capsule.capsuleArtifactRef.contentHash.slice('sha256:'.length)
      || (canonical
        ? value.status !== 'private_capsule_verified'
          || !value.repositorySource.sourcePublished
          || !value.repositorySource.sourceClean
        : value.status !== 'contract_only')
    ) throw new Error('capsule lineage mismatch')
  } catch {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 build capsule lost exact source or artifact lineage.',
    })
  }
})

export const canonicalSam31PrivateImageBuildCapsuleManifestSchema =
  capsuleManifestWithoutHashSchema.extend({ manifestHash: sha256 }).strict()
export type CanonicalSam31PrivateImageBuildCapsuleManifest = z.infer<
  typeof canonicalSam31PrivateImageBuildCapsuleManifestSchema
>

export const canonicalSam31CloudImageBuildAuthorityBaseSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
  ),
  source: z.literal('canonical_sam3_1_cloud_image_build_authority_owner'),
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
  sourceCheckpointQualificationRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  artifactBindingRef: evidenceRefSchema,
  capsuleManifestRef: evidenceRefSchema,
  capsuleCoordinate: privateObjectCoordinateSchema,
  imageDestination: z.object({
    repository: z.literal(IMAGE_REPOSITORY),
    imageName: z.literal(IMAGE_NAME),
    tag: z.string().regex(/^sam31-96914d2-[a-f0-9]{16}$/u),
    taggedUri: z.string().regex(
      /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu:sam31-96914d2-[a-f0-9]{16}$/u,
    ),
    callerSelectedTagAllowed: z.literal(false),
    tagMayAuthorizeRuntime: z.literal(false),
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
    patchApplicationReceiptSha256: sha256,
    artifactBuildBindingRecordHash: sha256,
    artifactBuildBindingFileSha256: sha256,
    sourceCheckpointQualificationRecordHash: sha256,
    sourceCheckpointCompatibilityReceiptSha256: sha256,
    cudaForwardCompatIngestReceiptSha256: sha256,
    multiplexSessionGpuForwardingPatchSha256: z.literal(
      'fb5c047013629d27d7b8f2aecbf8343a402d2e36de3e24dc1be4347f83d9c86b',
    ).optional(),
    forwardPropagationFrameCountPatchSha256: z.literal(
      '2540f5ba2a4d3f8931554e254d2f1c2c79abd28461f902477b7d64a04784f6de',
    ).optional(),
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
    builderImageObservedAt: z.literal('2026-08-03T12:51:34Z'),
    serviceAccount: z.literal(
      'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
    ),
    // E2_HIGHCPU_32 remains readable for immutable historical authorities.
    // Fresh Vertex production authorities use E2_HIGHCPU_8 because the
    // project's account-effective public-pool ceiling is ten build CPUs.
    machineType: z.enum(['E2_HIGHCPU_32', 'E2_HIGHCPU_8']),
    diskSizeGb: z.literal('200'),
    timeout: z.literal('3600s'),
    queueTtl: z.literal('600s'),
    sourceFetcher: z.literal('GCS_FETCHER'),
    sourceProvenanceHashes: z.tuple([
      z.literal('SHA256'),
    ]),
    requestedVerifyOption: z.literal('VERIFIED'),
    logging: z.literal('CLOUD_LOGGING_ONLY'),
    noSecretsOrSubstitutions: z.literal(true),
    noTriggerOrMutableRepositorySource: z.literal(true),
    singleFixedBuildStep: z.literal(true),
  }).strict(),
  authority: z.object({
    privateArtifactBindingReread: z.boolean(),
    privateCapsuleReread: z.boolean(),
    sourceCheckpointQualificationReread: z.boolean(),
    cloudImageBuildAuthorized: z.boolean(),
    durableSingleUseConsumptionRequiredBeforeCloudCall: z.literal(true),
    browserOrCallerMaySubmitBuild: z.literal(false),
    checkpointIncludedInImage: z.literal(false),
    imageBuildStarted: z.literal(false),
    imagePushed: z.literal(false),
    runtimeReleaseGranted: z.literal(false),
    gpuJobDispatched: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    qaApproved: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  preparedAt: timestamp,
}).strict()

const buildAuthorityWithoutHashSchema =
  canonicalSam31CloudImageBuildAuthorityBaseSchema.superRefine(
    (value, context) => {
      const canonical = value.evidenceClass === 'canonical_private_reread'
      const expectedTag =
        `sam31-96914d2-${value.capsuleCoordinate.sha256.slice(0, 16)}`
      if (
        value.imageDestination.tag !== expectedTag
        || value.imageDestination.taggedUri !==
          `${IMAGE_REPOSITORY}/${IMAGE_NAME}:${expectedTag}`
        || value.buildClosure.artifactBuildBindingRecordHash !==
          value.artifactBindingRef.contentHash.slice('sha256:'.length)
        || value.buildClosure.sourceCheckpointQualificationRecordHash !==
          value.sourceCheckpointQualificationRef.contentHash.slice(
            'sha256:'.length,
          )
        || (canonical
          ? value.status !== 'authorized_for_private_cloud_build'
            || !value.authority.privateArtifactBindingReread
            || !value.authority.privateCapsuleReread
            || !value.authority.sourceCheckpointQualificationReread
            || !value.authority.cloudImageBuildAuthorized
          : value.status !== 'contract_only'
            || value.authority.cloudImageBuildAuthorized)
      ) context.addIssue({
        code: 'custom',
        message: 'SAM 3.1 cloud image build authority lost exact build lineage.',
      })
    },
  )

export const canonicalSam31CloudImageBuildAuthoritySchema =
  buildAuthorityWithoutHashSchema.extend({ authorityHash: sha256 }).strict()
export type CanonicalSam31CloudImageBuildAuthority = z.infer<
  typeof canonicalSam31CloudImageBuildAuthoritySchema
>

export interface CanonicalSam31PrivateBuildCapsuleReadPort {
  readExact(
    coordinate: z.infer<typeof privateObjectCoordinateSchema>,
  ): Promise<{
    readonly generationBeforeRead: string
    readonly etagBeforeRead: string
    readonly contentType: string
    readonly body: Buffer | Uint8Array | AsyncIterable<Uint8Array>
    readonly generationAfterRead: string
    readonly etagAfterRead: string
  } | null>
}

export function createCanonicalSam31ImageBuildArtifactBinding(input: {
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  readonly sourceCheckpointQualification:
    CanonicalSam31SourceCheckpointQualification
}): CanonicalSam31ImageBuildArtifactBinding {
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    input.ingestReceipt,
  )
  const qualification = assertCanonicalSam31SourceCheckpointQualification(
    input.sourceCheckpointQualification,
  )
  if (
    ingest.candidateRef.schemaVersion !== candidate.schemaVersion
    || ingest.candidateRef.candidateHash !== candidate.candidateHash
    || ingest.operationId !== candidate.operationId
    || qualification.candidateRef.candidateHash !== candidate.candidateHash
    || qualification.ingestReceiptRef.contentHash !==
      `sha256:${ingest.ingestReceiptHash}`
    || qualification.evidenceClass !== ingest.evidenceClass
    || (ingest.evidenceClass === 'canonical_private_reread'
      && (qualification.status !== 'qualified_for_private_image_build'
        || !qualification.authority
          .securityLicenseAndCompatibilityQualified
        || !qualification.authority.privateImageBuildReviewEligible))
  ) throw new Error('SAM 3.1 build binding crossed candidate or ingest.')
  const canonical = ingest.evidenceClass === 'canonical_private_reread'
  const payload = artifactBindingWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_IMAGE_BUILD_ARTIFACT_BINDING_VERSION,
    source: 'canonical_sam3_1_image_build_artifact_owner',
    evidenceClass: ingest.evidenceClass,
    status: canonical ? 'private_artifacts_admitted' : 'contract_only',
    operationId: candidate.operationId,
    candidateRef: ingest.candidateRef,
    ingestReceiptRef: {
      id: ingest.ingestReceiptId,
      version: ingest.ingestReceiptVersion,
      schemaVersion: ingest.schemaVersion,
      contentHash: `sha256:${ingest.ingestReceiptHash}`,
    },
    sourceCheckpointQualificationRef:
      canonicalSam31SourceCheckpointQualificationRef(qualification),
    termsAcceptanceRef: ingest.termsAcceptanceRef,
    sourceArchive: {
      repository: ingest.sourceArchive.repository,
      revision: ingest.sourceArchive.revision,
      artifactRef: ingest.sourceArchive.artifactRef,
      byteLength: ingest.sourceArchive.coordinate.byteLength,
      sha256: ingest.sourceArchive.coordinate.sha256,
      licenseRef: ingest.sourceArchive.licenseRef,
      securityReviewRef: ingest.sourceArchive.securityReviewRef,
      malwareScanRef: ingest.sourceArchive.malwareScanRef,
    },
    checkpoint: {
      repository: ingest.checkpoint.repository,
      revision: ingest.checkpoint.revision,
      fileName: ingest.checkpoint.fileName,
      artifactRef: ingest.checkpoint.artifactRef,
      manifestRef: ingest.checkpoint.manifestRef,
      byteLength: ingest.checkpoint.coordinate.byteLength,
      sha256: ingest.checkpoint.coordinate.sha256,
      licenseRef: ingest.checkpoint.licenseRef,
      securityReviewRef: ingest.checkpoint.securityReviewRef,
      malwareScanRef: ingest.checkpoint.malwareScanRef,
      checkpointBytesIncludedInImageBuildCapsule: false,
      checkpointRereadOnlyAtQualifiedRuntime: true,
    },
    privacyBoundary: {
      sourceOrCheckpointStorageCoordinateIncluded: false,
      bucketObjectGenerationEtagIncluded: false,
      checkpointBytesIncluded: false,
      providerOrRepositoryTokenIncluded: false,
      browserOrCallerDataIncluded: false,
      opaqueEvidenceRefsOnly: true,
    },
    authority: {
      sanitizedBuildBindingOnly: true,
      privateArtifactIngestReread: canonical,
      sourceCheckpointQualificationReread: canonical,
      imageBuildAuthorized: false,
      imageBuildStarted: false,
      runtimeAuthorized: false,
      checkpointRedistributionAuthorized: false,
      qaApproved: false,
      productionReady: false,
    },
  })
  return canonicalSam31ImageBuildArtifactBindingSchema.parse({
    ...payload,
    bindingHash: sha256CanonicalJson(payload),
  })
}

export function createCanonicalSam31PrivateImageBuildCapsuleManifest(
  input: Omit<
    z.input<typeof capsuleManifestWithoutHashSchema>,
    'schemaVersion' | 'source'
  >,
): CanonicalSam31PrivateImageBuildCapsuleManifest {
  assertClosedPlainData(input, 'sam3_1_private_build_capsule_manifest')
  const payload = capsuleManifestWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_IMAGE_BUILD_CAPSULE_MANIFEST_VERSION,
    source: 'canonical_sam3_1_private_image_build_capsule_owner',
    ...input,
  })
  return canonicalSam31PrivateImageBuildCapsuleManifestSchema.parse({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

export async function prepareCanonicalSam31CloudImageBuildAuthority(input: {
  readonly authorityId: string
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  readonly sourceCheckpointQualification:
    CanonicalSam31SourceCheckpointQualification
  readonly artifactBinding: CanonicalSam31ImageBuildArtifactBinding
  readonly capsuleManifest: CanonicalSam31PrivateImageBuildCapsuleManifest
  readonly privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
  readonly preparedAt: string
}): Promise<CanonicalSam31CloudImageBuildAuthority> {
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    input.ingestReceipt,
  )
  const qualification = assertCanonicalSam31SourceCheckpointQualification(
    input.sourceCheckpointQualification,
  )
  const binding = assertCanonicalSam31ImageBuildArtifactBinding(
    input.artifactBinding,
  )
  const capsule = assertCanonicalSam31PrivateImageBuildCapsuleManifest(
    input.capsuleManifest,
  )
  assertMatchingBuildInputs({
    candidate,
    ingest,
    qualification,
    binding,
    capsule,
  })
  const canonical = ingest.evidenceClass === 'canonical_private_reread'
  const capsuleInspection = await verifyCanonicalSam31PrivateBuildCapsuleBytes(
    capsule.capsule.coordinate,
    input.privateCapsuleReadPort,
  )
  if (
    capsuleInspection.archiveEntrySetSha256 !==
      capsule.capsule.archiveEntrySetSha256
    || sha256AuthorityValue(capsuleInspection.archiveEntries) !==
      sha256AuthorityValue(capsule.capsule.archiveEntries)
  ) {
    throw new Error('SAM 3.1 private build capsule reread failed.')
  }
  const tag = `sam31-96914d2-${capsule.capsule.coordinate.sha256.slice(0, 16)}`
  const payload = buildAuthorityWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_authority_owner',
    evidenceClass: ingest.evidenceClass,
    status: canonical
      ? 'authorized_for_private_cloud_build'
      : 'contract_only',
    authorityId: input.authorityId,
    authorityVersion: 1,
    operationId: candidate.operationId,
    candidateRef: ingest.candidateRef,
    ingestReceiptRef: binding.ingestReceiptRef,
    sourceCheckpointQualificationRef:
      binding.sourceCheckpointQualificationRef,
    artifactBindingRef: {
      id: `sam31-build-binding-${binding.bindingHash.slice(0, 24)}`,
      version: 1,
      contentHash: `sha256:${binding.bindingHash}`,
    },
    capsuleManifestRef: {
      id: capsule.manifestId,
      version: capsule.manifestVersion,
      contentHash: `sha256:${capsule.manifestHash}`,
    },
    capsuleCoordinate: capsule.capsule.coordinate,
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
      dockerfilePath: capsule.repositorySource.dockerfilePath,
      dockerfileSha256: capsule.repositorySource.dockerfileSha256,
      runnerSha256: capsule.repositorySource.runnerSha256,
      entrypointSha256: capsule.repositorySource.entrypointSha256,
      sourceProvenanceLockSha256:
        capsule.repositorySource.sourceProvenanceLockSha256,
      dependencyLockSha256: capsule.privateInput.dependencyLockSha256,
      dependencyClosureReceiptSha256:
        capsule.privateInput.dependencyClosureReceiptSha256,
      patchApplicationReceiptSha256:
        capsule.privateInput.patchApplicationReceiptSha256,
      artifactBuildBindingRecordHash:
        capsule.privateInput.artifactBuildBindingRecordHash,
      artifactBuildBindingFileSha256:
        capsule.privateInput.artifactBuildBindingFileSha256,
      sourceCheckpointQualificationRecordHash:
        capsule.privateInput.sourceCheckpointQualificationRecordHash,
      sourceCheckpointCompatibilityReceiptSha256:
        capsule.privateInput.sourceCheckpointCompatibilityReceiptSha256,
      cudaForwardCompatIngestReceiptSha256:
        capsule.privateInput.cudaForwardCompatIngestReceiptSha256,
      ...(capsule.repositorySource.multiplexSessionGpuForwardingPatchSha256
        ? {
            multiplexSessionGpuForwardingPatchSha256:
              capsule.repositorySource
                .multiplexSessionGpuForwardingPatchSha256,
          }
        : {}),
      ...(capsule.repositorySource.forwardPropagationFrameCountPatchSha256
        ? {
            forwardPropagationFrameCountPatchSha256:
              capsule.repositorySource
                .forwardPropagationFrameCountPatchSha256,
          }
        : {}),
    },
    cloudBuildPolicy: {
      projectId: PROJECT_ID,
      location: REGION,
      regionalCreateEndpoint:
        'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds',
      builderImage:
        'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
      builderImageObservedAt: '2026-08-03T12:51:34Z',
      serviceAccount:
        'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
      machineType: 'E2_HIGHCPU_32',
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
      privateArtifactBindingReread: canonical,
      privateCapsuleReread: canonical,
      sourceCheckpointQualificationReread: canonical,
      cloudImageBuildAuthorized: canonical,
      durableSingleUseConsumptionRequiredBeforeCloudCall: true,
      browserOrCallerMaySubmitBuild: false,
      checkpointIncludedInImage: false,
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
  return canonicalSam31CloudImageBuildAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31ImageBuildArtifactBinding(
  value: unknown,
): CanonicalSam31ImageBuildArtifactBinding {
  assertClosedPlainData(value, 'sam3_1_image_build_artifact_binding')
  const parsed = canonicalSam31ImageBuildArtifactBindingSchema.parse(value)
  const { bindingHash, ...payload } = parsed
  if (bindingHash !== sha256CanonicalJson(payload)) {
    throw new Error('SAM 3.1 image build artifact binding hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31PrivateImageBuildCapsuleManifest(
  value: unknown,
): CanonicalSam31PrivateImageBuildCapsuleManifest {
  assertClosedPlainData(value, 'sam3_1_private_build_capsule_manifest')
  const parsed = canonicalSam31PrivateImageBuildCapsuleManifestSchema.parse(
    value,
  )
  const { manifestHash, ...payload } = parsed
  if (manifestHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 image build capsule manifest hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31CloudImageBuildAuthority(
  value: unknown,
): CanonicalSam31CloudImageBuildAuthority {
  assertClosedPlainData(value, 'sam3_1_cloud_image_build_authority')
  const parsed = canonicalSam31CloudImageBuildAuthoritySchema.parse(value)
  const { authorityHash, ...payload } = parsed
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 cloud image build authority hash is invalid.')
  }
  return parsed
}

function assertMatchingBuildInputs(input: {
  candidate: CanonicalSam31SourceRuntimeCandidate
  ingest: CanonicalSam31PrivateArtifactIngestReceipt
  qualification: CanonicalSam31SourceCheckpointQualification
  binding: CanonicalSam31ImageBuildArtifactBinding
  capsule: CanonicalSam31PrivateImageBuildCapsuleManifest
}): void {
  const { candidate, ingest, qualification, binding, capsule } = input
  const qualificationRef = canonicalSam31SourceCheckpointQualificationRef(
    qualification,
  )
  if (
    ingest.candidateRef.candidateHash !== candidate.candidateHash
    || binding.candidateRef.candidateHash !== candidate.candidateHash
    || capsule.candidateRef.candidateHash !== candidate.candidateHash
    || binding.ingestReceiptRef.contentHash !==
      `sha256:${ingest.ingestReceiptHash}`
    || binding.sourceCheckpointQualificationRef.contentHash !==
      qualificationRef.contentHash
    || capsule.privateInput.sourceCheckpointQualificationRecordHash !==
      qualification.qualificationHash
    || capsule.privateInput.sourceCheckpointCompatibilityReceiptSha256 !==
      sha256AuthorityValue(qualification)
    || capsule.artifactBindingRef.contentHash !==
      `sha256:${binding.bindingHash}`
    || capsule.evidenceClass !== ingest.evidenceClass
    || binding.evidenceClass !== ingest.evidenceClass
    || qualification.evidenceClass !== ingest.evidenceClass
  ) throw new Error('SAM 3.1 cloud build inputs crossed authority.')
}

export async function verifyCanonicalSam31PrivateBuildCapsuleBytes(
  coordinate: CanonicalSam31PrivateCapsuleCoordinate,
  port: CanonicalSam31PrivateBuildCapsuleReadPort,
  expectedStorageContentType:
    'application/gzip' | 'application/x-tar' = 'application/gzip',
): Promise<{
  readonly archiveEntries: readonly CanonicalSam31CapsuleArchiveEntry[]
  readonly archiveEntrySetSha256: string
}> {
  const object = await port.readExact(coordinate)
  if (!object) throw new Error('SAM 3.1 private build capsule is missing.')
  if (
    object.generationBeforeRead !== coordinate.generation
    || object.etagBeforeRead !== coordinate.etag
    || object.generationAfterRead !== coordinate.generation
    || object.etagAfterRead !== coordinate.etag
    || object.contentType !== expectedStorageContentType
  ) throw new Error('SAM 3.1 private build capsule metadata changed.')
  const digest = createHash('sha256')
  let byteLength = 0
  const body = Buffer.isBuffer(object.body) || object.body instanceof Uint8Array
    ? (async function* () { yield object.body as Uint8Array })()
    : object.body
  const measuredBody = (async function* () {
    for await (const chunk of body) {
      if (!(chunk instanceof Uint8Array) || chunk.byteLength === 0) {
        throw new Error('SAM 3.1 private build capsule stream is invalid.')
      }
      byteLength += chunk.byteLength
      if (
        !Number.isSafeInteger(byteLength)
        || byteLength > MAX_CAPSULE_COMPRESSED_BYTES
      ) throw new Error('SAM 3.1 private build capsule length overflowed.')
      digest.update(chunk)
      yield chunk
    }
  })()
  const gunzip = createGunzip()
  Readable.from(measuredBody).pipe(gunzip)
  const archiveEntries = await inspectCanonicalTarStream(gunzip)
  if (
    byteLength !== coordinate.byteLength
    || digest.digest('hex') !== coordinate.sha256
  ) throw new Error('SAM 3.1 private build capsule bytes changed.')
  return {
    archiveEntries,
    archiveEntrySetSha256: sha256AuthorityValue(archiveEntries),
  }
}

function assertCapsuleManifestEntries(
  value: z.input<typeof capsuleManifestWithoutHashSchema>,
  canonical: boolean,
): void {
  const entries = value.capsule.archiveEntries
  for (let index = 1; index < entries.length; index += 1) {
    if (!(entries[index - 1].path < entries[index].path)) {
      throw new Error('Capsule entries are not uniquely ordered.')
    }
  }
  if (
    value.capsule.archiveEntrySetSha256 !== sha256AuthorityValue(entries)
  ) throw new Error('Capsule entry-set digest is invalid.')
  const byPath = new Map(entries.map((entry) => [entry.path, entry]))
  const required = (path: string, expectedSha256: string): void => {
    const entry = byPath.get(path)
    if (!entry || entry.sha256 !== expectedSha256) {
      throw new Error(`Capsule entry ${path} is missing or changed.`)
    }
  }
  required(
    'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
    value.repositorySource.dockerfileSha256,
  )
  required(
    'docker/prod/gpu-worker/sam3_1/runner.py',
    value.repositorySource.runnerSha256,
  )
  required(
    'docker/prod/gpu-worker/sam3_1/entrypoint.sh',
    value.repositorySource.entrypointSha256,
  )
  required(
    'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
    value.repositorySource.sourceProvenanceLockSha256,
  )
  const patchPath =
    'docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch'
  if (!byPath.has(patchPath)) throw new Error('Capsule GPU patch is missing.')
  if (canonical) required(
    patchPath,
    value.repositorySource.gpuDecodePatchSha256,
  )
  const importlibResourcesPatchPath =
    'docker/prod/gpu-worker/sam3_1/patches/0002-weeditpro-importlib-resources.patch'
  if (canonical) required(
    importlibResourcesPatchPath,
    IMPORTLIB_RESOURCES_PATCH_SHA256,
  )
  const multiplexSessionGpuForwardingPatchPath =
    'docker/prod/gpu-worker/sam3_1/patches/0003-weeditpro-multiplex-session-gpu-forwarding.patch'
  if (value.repositorySource.multiplexSessionGpuForwardingPatchSha256) {
    required(
      multiplexSessionGpuForwardingPatchPath,
      value.repositorySource.multiplexSessionGpuForwardingPatchSha256,
    )
  } else if (byPath.has(multiplexSessionGpuForwardingPatchPath)) {
    throw new Error('Capsule GPU-forwarding patch is unbound.')
  }
  const forwardPropagationFrameCountPatchPath =
    'docker/prod/gpu-worker/sam3_1/patches/0004-weeditpro-forward-propagation-frame-count.patch'
  if (value.repositorySource.forwardPropagationFrameCountPatchSha256) {
    required(
      forwardPropagationFrameCountPatchPath,
      value.repositorySource.forwardPropagationFrameCountPatchSha256,
    )
  } else if (byPath.has(forwardPropagationFrameCountPatchPath)) {
    throw new Error('Capsule frame-count patch is unbound.')
  }
  required(
    `${PRIVATE_INPUT_DIRECTORY}/source/source-patch-application-receipt.json`,
    value.privateInput.patchApplicationReceiptSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/requirements.lock.txt`,
    value.privateInput.dependencyLockSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/dependency-closure-receipt.json`,
    value.privateInput.dependencyClosureReceiptSha256,
  )
  const ffmpegSourcePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/ffmpeg-8.0.3.tar.gz`
  const pkgconfSourcePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/pkgconf-3.0.4.tar.gz`
  const nvCodecHeadersSourcePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/nv-codec-headers-n12.2.72.0.tar.gz`
  const ffmpegReceiptPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json`
  if (
    !byPath.has(ffmpegSourcePath)
    || !byPath.has(pkgconfSourcePath)
    || !byPath.has(nvCodecHeadersSourcePath)
    || !byPath.has(ffmpegReceiptPath)
  ) {
    throw new Error('Capsule FFmpeg source closure is missing.')
  }
  if (canonical) {
    required(
      ffmpegSourcePath,
      '5c868087e6a0d4243b97776c16f3bfe1511cc53f15c26c822b393a3289608121',
    )
    required(pkgconfSourcePath, PKGCONF_SHA256)
    required(
      nvCodecHeadersSourcePath,
      'dbeaec433d93b850714760282f1d0992b1254fc3b5a6cb7d76fc1340a1e47563',
    )
  }
  const cudaPackagePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`
  const cudaNppPackagePath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-npp/libnpp-12-8_12.3.3.100-1_amd64.deb`
  const cudaNppReceiptPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-npp/cuda-npp-runtime-receipt.json`
  if (!byPath.has(cudaPackagePath)) {
    throw new Error('Capsule CUDA forward-compat package is missing.')
  }
  if (!byPath.has(cudaNppPackagePath) || !byPath.has(cudaNppReceiptPath)) {
    throw new Error('Capsule CUDA NPP runtime closure is missing.')
  }
  if (canonical) required(
    cudaPackagePath,
    value.privateInput.cudaForwardCompatPackageSha256,
  )
  if (canonical) required(cudaNppPackagePath, CUDA_NPP_SHA256)
  const osSecurityUpdatesPrefix =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/`
  const libsslDevPackagePath =
    `${osSecurityUpdatesPrefix}libssl-dev_3.0.13-0ubuntu3.12_amd64.deb`
  const libssl3PackagePath =
    `${osSecurityUpdatesPrefix}libssl3t64_3.0.13-0ubuntu3.12_amd64.deb`
  const opensslPackagePath =
    `${osSecurityUpdatesPrefix}openssl_3.0.13-0ubuntu3.12_amd64.deb`
  const osSecurityUpdatesReceiptPath =
    `${osSecurityUpdatesPrefix}os-security-updates-receipt.json`
  if (canonical) {
    required(libsslDevPackagePath, OPENSSL_LIBSSL_DEV_SHA256)
    required(libssl3PackagePath, OPENSSL_LIBSSL3_SHA256)
    required(opensslPackagePath, OPENSSL_BINARY_SHA256)
    required(
      osSecurityUpdatesReceiptPath,
      OS_SECURITY_UPDATES_RECEIPT_SHA256,
    )
  }
  required(
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json`,
    value.privateInput.cudaForwardCompatIngestReceiptSha256,
  )
  const einopsIngestReceiptPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/python-ingest/einops/einops-ingest-receipt.json`
  const pycocotoolsIngestReceiptPath =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/python-ingest/pycocotools/pycocotools-ingest-receipt.json`
  if (
    !byPath.has(einopsIngestReceiptPath)
    || !byPath.has(pycocotoolsIngestReceiptPath)
  ) throw new Error('Capsule reviewed Python ingest receipts are missing.')
  if (canonical) {
    required(
      einopsIngestReceiptPath,
      'd882124bbea8f586e16df53c7062ffce3d9e1499c350ae1ccec0b25fab870608',
    )
    required(
      pycocotoolsIngestReceiptPath,
      'a47f679998c2a8d93d1f8e579a94a00bf4c9ca6ac9f7f40a9486a645177fdea3',
    )
  }
  required(
    `${PRIVATE_INPUT_DIRECTORY}/release-receipts/private-artifact-build-binding.json`,
    value.privateInput.artifactBuildBindingFileSha256,
  )
  required(
    `${PRIVATE_INPUT_DIRECTORY}/release-receipts/source-checkpoint-compatibility-receipt.json`,
    value.privateInput.sourceCheckpointCompatibilityReceiptSha256,
  )
  const sourceArchive = byPath.get(
    `${PRIVATE_INPUT_DIRECTORY}/source/sam3-96914d2425f90a64f45ca977c2b5165418099543.tar`,
  )
  const patchedArchive = byPath.get(
    `${PRIVATE_INPUT_DIRECTORY}/source/sam3-96914d2425f90a64f45ca977c2b5165418099543-reeditpro-gpu-decode.tar`,
  )
  if (!sourceArchive || !patchedArchive) {
    throw new Error('Capsule source archives are missing.')
  }
  const wheelPrefix =
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/wheelhouse/`
  const wheels = entries.filter((entry) => entry.path.startsWith(wheelPrefix))
  if (
    wheels.length !== value.privateInput.dependencyWheelCount
    || wheels.some((entry) => !isAllowedWheelPath(entry.path))
    || value.privateInput.dependencyWheelManifestSha256 !==
      sha256AuthorityValue(wheels)
    || entries.some((entry) => !isAllowedCapsuleEntryPath(entry.path))
  ) throw new Error('Capsule dependency wheel closure is invalid.')
  if (canonical && (
    sourceArchive.byteLength !== 73_605_120
    || sourceArchive.sha256 !==
      value.privateInput.deterministicSourceArchiveSha256
    || patchedArchive.byteLength !== 73_605_120
    || patchedArchive.sha256 !==
      value.privateInput.deterministicPatchedSourceArchiveSha256
    || byPath.get(
      `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/ffmpeg-8.0.3.tar.gz`,
    )?.byteLength !== 17_211_188
    || byPath.get(pkgconfSourcePath)?.byteLength !== 611_767
    || byPath.get(
      `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/nv-codec-headers-n12.2.72.0.tar.gz`,
    )?.byteLength !== 80_935
    || byPath.get(cudaPackagePath)?.byteLength !== 37_945_232
    || byPath.get(cudaNppPackagePath)?.byteLength !== 131_485_608
    || byPath.get(importlibResourcesPatchPath)?.byteLength !== 1_056
    || byPath.get(libsslDevPackagePath)?.byteLength !== 2_407_824
    || byPath.get(libssl3PackagePath)?.byteLength !== 1_942_240
    || byPath.get(opensslPackagePath)?.byteLength !== 1_002_894
    || byPath.get(osSecurityUpdatesReceiptPath)?.byteLength !== 862
  )) throw new Error('Canonical capsule bytes do not match frozen artifacts.')
}

function isAllowedCapsuleEntryPath(path: string): boolean {
  return [
    'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
    'docker/prod/gpu-worker/sam3_1/runner.py',
    'docker/prod/gpu-worker/sam3_1/entrypoint.sh',
    'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
    'docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch',
    'docker/prod/gpu-worker/sam3_1/patches/0002-weeditpro-importlib-resources.patch',
    'docker/prod/gpu-worker/sam3_1/patches/0003-weeditpro-multiplex-session-gpu-forwarding.patch',
    'docker/prod/gpu-worker/sam3_1/patches/0004-weeditpro-forward-propagation-frame-count.patch',
    `${PRIVATE_INPUT_DIRECTORY}/source/sam3-96914d2425f90a64f45ca977c2b5165418099543.tar`,
    `${PRIVATE_INPUT_DIRECTORY}/source/sam3-96914d2425f90a64f45ca977c2b5165418099543-reeditpro-gpu-decode.tar`,
    `${PRIVATE_INPUT_DIRECTORY}/source/source-patch-application-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/requirements.lock.txt`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/dependency-closure-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/ffmpeg-8.0.3.tar.gz`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/pkgconf-3.0.4.tar.gz`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/nv-codec-headers-n12.2.72.0.tar.gz`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-npp/libnpp-12-8_12.3.3.100-1_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/cuda-npp/cuda-npp-runtime-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/libssl-dev_3.0.13-0ubuntu3.12_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/libssl3t64_3.0.13-0ubuntu3.12_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/openssl_3.0.13-0ubuntu3.12_amd64.deb`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/os-security-updates/os-security-updates-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/python-ingest/einops/einops-ingest-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/python-ingest/pycocotools/pycocotools-ingest-receipt.json`,
    `${PRIVATE_INPUT_DIRECTORY}/release-receipts/private-artifact-build-binding.json`,
    `${PRIVATE_INPUT_DIRECTORY}/release-receipts/source-checkpoint-compatibility-receipt.json`,
  ].includes(path) || isAllowedWheelPath(path)
}

function isAllowedWheelPath(path: string): boolean {
  const prefix = `${PRIVATE_INPUT_DIRECTORY}/dependency-closure/wheelhouse/`
  if (!path.startsWith(prefix)) return false
  const fileName = path.slice(prefix.length)
  return /^[A-Za-z0-9][A-Za-z0-9._+-]{0,199}\.whl$/u.test(fileName)
}

function isSafeCapsulePath(path: string): boolean {
  return !path.startsWith('/')
    && !path.includes('\\')
    && path.split('/').every((part) =>
      part.length > 0 && part !== '.' && part !== '..')
}

async function inspectCanonicalTarStream(
  stream: AsyncIterable<Uint8Array>,
): Promise<readonly z.infer<typeof capsuleArchiveEntrySchema>[]> {
  let pending = Buffer.alloc(0)
  let totalUncompressed = 0
  let zeroBlocks = 0
  let headerCount = 0
  let previousHeaderPath: string | null = null
  const directoryPaths = new Set<string>()
  let current: {
    path: string
    byteLength: number
    remaining: number
    padding: number
    digest: ReturnType<typeof createHash>
  } | null = null
  const entries: z.infer<typeof capsuleArchiveEntrySchema>[] = []
  const completeCurrent = (): void => {
    if (!current || current.remaining !== 0 || current.padding !== 0) return
    entries.push(capsuleArchiveEntrySchema.parse({
      path: current.path,
      byteLength: current.byteLength,
      sha256: current.digest.digest('hex'),
    }))
    current = null
  }
  for await (const rawChunk of stream) {
    const chunk = Buffer.from(rawChunk)
    totalUncompressed += chunk.byteLength
    if (totalUncompressed > MAX_CAPSULE_UNCOMPRESSED_BYTES) {
      throw new Error('SAM 3.1 capsule expands beyond its bound.')
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
          if (!pending.subarray(0, consumed).every((value) => value === 0)) {
            throw new Error('SAM 3.1 capsule padding is not canonical.')
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
      if (header.every((value) => value === 0)) {
        zeroBlocks += 1
        continue
      }
      if (zeroBlocks > 0) {
        throw new Error('SAM 3.1 capsule contains data after tar terminator.')
      }
      headerCount += 1
      if (headerCount > MAX_CAPSULE_ENTRIES) {
        throw new Error('SAM 3.1 capsule has too many entries.')
      }
      verifyTarHeaderChecksum(header)
      const type = header[156]
      if (type !== 0 && type !== 48 && type !== 53) {
        throw new Error('SAM 3.1 capsule contains a non-regular entry.')
      }
      const name = readTarString(header.subarray(0, 100))
      const prefix = readTarString(header.subarray(345, 500))
      const rawPath = prefix ? `${prefix}/${name}` : name
      const path = type === 53 && rawPath.endsWith('/')
        ? rawPath.slice(0, -1)
        : rawPath
      if (!isSafeCapsulePath(path)) {
        throw new Error('SAM 3.1 capsule entry path is unsafe.')
      }
      if (previousHeaderPath !== null && !(previousHeaderPath < path)) {
        throw new Error('SAM 3.1 capsule headers are not canonical.')
      }
      previousHeaderPath = path
      const byteLength = readTarOctal(header.subarray(124, 136))
      if (type === 53) {
        if (byteLength !== 0 || directoryPaths.has(path)) {
          throw new Error('SAM 3.1 capsule directory is not canonical.')
        }
        directoryPaths.add(path)
        continue
      }
      if (byteLength <= 0 || byteLength > MAX_CAPSULE_UNCOMPRESSED_BYTES) {
        throw new Error('SAM 3.1 capsule entry length is invalid.')
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
    throw new Error('SAM 3.1 capsule tar stream is truncated.')
  }
  for (let index = 1; index < entries.length; index += 1) {
    if (!(entries[index - 1].path < entries[index].path)) {
      throw new Error('SAM 3.1 capsule tar entries are not canonical.')
    }
  }
  if ([...directoryPaths].some((directory) =>
    !entries.some((entry) => entry.path.startsWith(`${directory}/`)))) {
    throw new Error('SAM 3.1 capsule contains an empty directory.')
  }
  return entries
}

function readTarString(value: Uint8Array): string {
  const end = value.indexOf(0)
  return Buffer.from(end < 0 ? value : value.subarray(0, end))
    .toString('utf8')
}

function readTarOctal(value: Uint8Array): number {
  const text = readTarString(value).trim()
  if (!/^[0-7]+$/u.test(text)) throw new Error('Tar octal field is invalid.')
  const parsed = Number.parseInt(text, 8)
  if (!Number.isSafeInteger(parsed)) throw new Error('Tar size overflowed.')
  return parsed
}

function verifyTarHeaderChecksum(header: Uint8Array): void {
  const expected = readTarOctal(header.subarray(148, 156))
  let actual = 0
  for (let index = 0; index < header.length; index += 1) {
    actual += index >= 148 && index < 156 ? 32 : header[index]
  }
  if (actual !== expected) throw new Error('Tar header checksum is invalid.')
}

function sha256CanonicalJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .filter(([, nested]) => nested !== undefined)
          .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
          .map(([key, nested]) => [key, normalize(nested)]),
      )
    }
    return item
  }
  return createHash('sha256')
    .update(JSON.stringify(normalize(value)))
    .digest('hex')
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (item: unknown): void => {
    if (!item || typeof item !== 'object') return
    if (seen.has(item)) throw new Error(`${label} contains a cycle.`)
    const prototype = Object.getPrototypeOf(item)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw new Error(`${label} must contain plain data only.`)
    }
    seen.add(item)
    for (const key of Reflect.ownKeys(item)) {
      if (typeof key !== 'string') {
        throw new Error(`${label} contains a symbol key.`)
      }
      const descriptor = Object.getOwnPropertyDescriptor(item, key)
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`${label} contains an accessor.`)
      }
      visit(descriptor.value)
    }
    seen.delete(item)
  }
  visit(value)
}
