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
  requirePresent(sourceArchivePath)
  requirePresent(patchedSourceArchivePath)
  requirePresent(cudaPackagePath)
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
  ].includes(path) || isWheelPath(path)
}
