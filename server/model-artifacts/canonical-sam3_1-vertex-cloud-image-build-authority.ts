import { z } from 'zod'

import {
  assertCanonicalSam31PrivateImageBuildCapsuleManifest,
  canonicalSam31CloudImageBuildAuthorityBaseSchema,
  verifyCanonicalSam31PrivateBuildCapsuleBytes,
  type CanonicalSam31PrivateBuildCapsuleReadPort,
  type CanonicalSam31PrivateImageBuildCapsuleManifest,
} from './canonical-sam3_1-cloud-image-build-authority'
import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from './canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from './canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalSam31VertexImageBuildBinding,
  type CanonicalSam31VertexImageBuildBinding,
} from './canonical-sam3_1-vertex-production-build-binding'
import {
  CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  assertCanonicalSam31VertexCompatibilityQualification,
  type CanonicalSam31VertexCompatibilityQualification,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import { assertPlainSerializedData } from
  '../services/canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION =
  'canonical-sam3_1-cloud-image-build-authority-v3' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const qualificationRefSchema = z.object({
  id: safeId,
  version: z.literal(2),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  ),
  contentHash: prefixedSha256,
}).strict()

const withoutHashSchema = canonicalSam31CloudImageBuildAuthorityBaseSchema.omit({
  schemaVersion: true,
  source: true,
  sourceCheckpointQualificationRef: true,
  artifactBindingRef: true,
}).extend({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_vertex_cloud_image_build_authority_owner',
  ),
  sourceCheckpointQualificationRef: qualificationRefSchema,
  artifactBindingRef: z.object({
    id: safeId,
    version: z.literal(1),
    contentHash: prefixedSha256,
  }).strict(),
  vertexQualificationEvidenceBound: z.literal(true),
  historicalBatchQualificationCastOrRelabelUsed: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    value.status !== 'authorized_for_private_cloud_build'
    || value.evidenceClass !== 'canonical_private_reread'
    || value.buildClosure.artifactBuildBindingRecordHash !==
      value.artifactBindingRef.contentHash.slice(7)
    || value.buildClosure.sourceCheckpointQualificationRecordHash !==
      value.sourceCheckpointQualificationRef.contentHash.slice(7)
    || !value.authority.privateArtifactBindingReread
    || !value.authority.privateCapsuleReread
    || !value.authority.sourceCheckpointQualificationReread
    || !value.authority.cloudImageBuildAuthorized
    || value.authority.imageBuildStarted
    || value.authority.imagePushed
    || value.authority.runtimeReleaseGranted
    || value.authority.gpuJobDispatched
    || value.authority.customerCreditMutationAllowed
    || value.authority.qaApproved
    || value.authority.productionReady
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex SAM 3.1 image build authority lost closed lineage.',
  })
})

export const canonicalSam31VertexCloudImageBuildAuthoritySchema =
  withoutHashSchema.extend({ authorityHash: sha256 }).strict()
export type CanonicalSam31VertexCloudImageBuildAuthority = z.infer<
  typeof canonicalSam31VertexCloudImageBuildAuthoritySchema
>

interface CanonicalSam31VertexCloudImageBuildAuthorityInput {
  readonly authorityId: string
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  readonly sourceCheckpointQualification:
    CanonicalSam31VertexCompatibilityQualification
  readonly artifactBinding: CanonicalSam31VertexImageBuildBinding
  readonly capsuleManifest: CanonicalSam31PrivateImageBuildCapsuleManifest
  readonly privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
  readonly preparedAt: string
}

export async function prepareCanonicalSam31VertexCloudImageBuildAuthority(
  input: CanonicalSam31VertexCloudImageBuildAuthorityInput,
): Promise<CanonicalSam31VertexCloudImageBuildAuthority> {
  const { serializedInput, privateCapsuleReadPort } =
    splitCanonicalSam31VertexCloudImageBuildAuthorityInput(input)
  assertPlainSerializedData(
    serializedInput,
    'sam31_vertex_image_build_authority_input',
  )
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(
    serializedInput.candidate,
  )
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    serializedInput.ingestReceipt,
  )
  const qualification = assertCanonicalSam31VertexCompatibilityQualification(
    serializedInput.sourceCheckpointQualification,
  )
  const binding = assertCanonicalSam31VertexImageBuildBinding(
    serializedInput.artifactBinding,
  )
  const capsule = assertCanonicalSam31PrivateImageBuildCapsuleManifest(
    serializedInput.capsuleManifest,
  )
  assertExactInputs({ candidate, ingest, qualification, binding, capsule })
  const inspection = await verifyCanonicalSam31PrivateBuildCapsuleBytes(
    capsule.capsule.coordinate,
    privateCapsuleReadPort,
  )
  if (
    inspection.archiveEntrySetSha256 !==
      capsule.capsule.archiveEntrySetSha256
    || sha256AuthorityValue(inspection.archiveEntries) !==
      sha256AuthorityValue(capsule.capsule.archiveEntries)
  ) throw new Error('Vertex SAM 3.1 production capsule reread changed.')

  const tag = `sam31-96914d2-${capsule.capsule.coordinate.sha256.slice(0, 16)}`
  const payload = withoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
    source: 'canonical_sam3_1_vertex_cloud_image_build_authority_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'authorized_for_private_cloud_build',
    authorityId: serializedInput.authorityId,
    authorityVersion: 1,
    operationId: candidate.operationId,
    candidateRef: ingest.candidateRef,
    ingestReceiptRef: binding.ingestReceiptRef,
    sourceCheckpointQualificationRef:
      binding.sourceCheckpointQualificationRef,
    artifactBindingRef: {
      id: `sam31-vertex-build-binding-${binding.bindingHash.slice(0, 24)}`,
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
      repository:
        'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers',
      imageName: 'reeditpro-sam31-gpu',
      tag,
      taggedUri:
        `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/`
        + `reeditpro-sam31-gpu:${tag}`,
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
      projectId: 'reeditpro',
      location: 'us-central1',
      regionalCreateEndpoint:
        'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds',
      builderImage:
        'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
      builderImageObservedAt: '2026-08-03T12:51:34Z',
      serviceAccount:
        'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
      // This is image assembly, not model inference. Keep the build inside
      // the observed ten-CPU public-pool quota; A100/L4 runtime policy is
      // independently bound and unchanged.
      machineType: 'E2_HIGHCPU_8',
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
      privateArtifactBindingReread: true,
      privateCapsuleReread: true,
      sourceCheckpointQualificationReread: true,
      cloudImageBuildAuthorized: true,
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
    vertexQualificationEvidenceBound: true,
    historicalBatchQualificationCastOrRelabelUsed: false,
    preparedAt: serializedInput.preparedAt,
  })
  return canonicalSam31VertexCloudImageBuildAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

function splitCanonicalSam31VertexCloudImageBuildAuthorityInput(
  input: CanonicalSam31VertexCloudImageBuildAuthorityInput,
): {
  readonly serializedInput: Omit<
    CanonicalSam31VertexCloudImageBuildAuthorityInput,
    'privateCapsuleReadPort'
  >
  readonly privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
} {
  const expectedKeys = [
    'authorityId',
    'candidate',
    'ingestReceipt',
    'sourceCheckpointQualification',
    'artifactBinding',
    'capsuleManifest',
    'privateCapsuleReadPort',
    'preparedAt',
  ] as const
  let descriptors: PropertyDescriptorMap
  try {
    if (
      input === null
      || typeof input !== 'object'
      || Object.getPrototypeOf(input) !== Object.prototype
    ) throw new Error('input is not a plain object')
    const keys = Reflect.ownKeys(input)
    if (
      keys.length !== expectedKeys.length
      || keys.some((key) =>
        typeof key !== 'string'
        || !expectedKeys.includes(key as typeof expectedKeys[number]))
    ) throw new Error('input fields are not exact')
    descriptors = Object.getOwnPropertyDescriptors(input)
  } catch {
    throw new Error(
      'Vertex SAM 3.1 image build authority input is not a closed plain object.',
    )
  }
  const ownValue = <Key extends typeof expectedKeys[number]>(key: Key) => {
    const descriptor = descriptors[key]
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(
        'Vertex SAM 3.1 image build authority input contains an accessor.',
      )
    }
    return descriptor.value as CanonicalSam31VertexCloudImageBuildAuthorityInput[Key]
  }
  const privateCapsuleReadPort = ownValue('privateCapsuleReadPort')
  let readDescriptor: PropertyDescriptor | undefined
  try {
    if (
      privateCapsuleReadPort === null
      || typeof privateCapsuleReadPort !== 'object'
    ) throw new Error('read port is not an object')
    readDescriptor = Object.getOwnPropertyDescriptor(
      privateCapsuleReadPort,
      'readExact',
    )
  } catch {
    throw new Error(
      'Vertex SAM 3.1 private capsule read port is not trusted.',
    )
  }
  if (
    !readDescriptor
    || !('value' in readDescriptor)
    || typeof readDescriptor.value !== 'function'
  ) throw new Error('Vertex SAM 3.1 private capsule read port is not trusted.')
  return {
    serializedInput: {
      authorityId: ownValue('authorityId'),
      candidate: ownValue('candidate'),
      ingestReceipt: ownValue('ingestReceipt'),
      sourceCheckpointQualification: ownValue(
        'sourceCheckpointQualification',
      ),
      artifactBinding: ownValue('artifactBinding'),
      capsuleManifest: ownValue('capsuleManifest'),
      preparedAt: ownValue('preparedAt'),
    },
    privateCapsuleReadPort,
  }
}

export function assertCanonicalSam31VertexCloudImageBuildAuthority(
  value: unknown,
): CanonicalSam31VertexCloudImageBuildAuthority {
  assertPlainSerializedData(value, 'sam31_vertex_cloud_image_build_authority')
  const parsed = canonicalSam31VertexCloudImageBuildAuthoritySchema.parse(
    value,
  )
  const { authorityHash, ...payload } = parsed
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex SAM 3.1 image build authority hash is invalid.')
  }
  return parsed
}

function assertExactInputs(input: {
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingest: CanonicalSam31PrivateArtifactIngestReceipt
  readonly qualification: CanonicalSam31VertexCompatibilityQualification
  readonly binding: CanonicalSam31VertexImageBuildBinding
  readonly capsule: CanonicalSam31PrivateImageBuildCapsuleManifest
}): void {
  const { candidate, ingest, qualification, binding, capsule } = input
  if (
    ingest.candidateRef.candidateHash !== candidate.candidateHash
    || binding.candidateRef.candidateHash !== candidate.candidateHash
    || capsule.candidateRef.candidateHash !== candidate.candidateHash
    || binding.ingestReceiptRef.contentHash !==
      `sha256:${ingest.ingestReceiptHash}`
    || binding.sourceCheckpointQualificationRef.id !==
      qualification.qualificationId
    || binding.sourceCheckpointQualificationRef.contentHash !==
      `sha256:${qualification.qualificationHash}`
    || capsule.privateInput.sourceCheckpointQualificationRecordHash !==
      qualification.qualificationHash
    || capsule.privateInput.sourceCheckpointCompatibilityReceiptSha256 !==
      sha256AuthorityValue(qualification)
    || capsule.artifactBindingRef.contentHash !==
      `sha256:${binding.bindingHash}`
    || ingest.evidenceClass !== 'canonical_private_reread'
    || qualification.evidenceClass !== 'canonical_private_reread'
    || binding.evidenceClass !== 'canonical_private_reread'
    || capsule.evidenceClass !== 'canonical_private_reread'
    || binding.qualificationTruth.legacyBatchCastOrRelabelUsed
  ) throw new Error('Vertex SAM 3.1 cloud build inputs crossed authority.')
}
