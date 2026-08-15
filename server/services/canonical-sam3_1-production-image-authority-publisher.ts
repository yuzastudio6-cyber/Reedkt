import { z } from 'zod'
import { Storage } from '@google-cloud/storage'

import {
  createCanonicalSam31VertexImageBuildBinding,
} from '../model-artifacts/canonical-sam3_1-vertex-production-build-binding'
import {
  assertCanonicalSam31PrivateImageBuildCapsuleManifest,
  type CanonicalSam31PrivateBuildCapsuleReadPort,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import {
  prepareCanonicalSam31VertexCloudImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-vertex-cloud-image-build-authority'
import { createCanonicalSam31SourceRuntimeCandidate } from
  '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import { assertCanonicalSam31PrivateArtifactIngestReceipt } from
  '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  assertCanonicalSam31VertexQualificationRelease,
  createCanonicalSam31VertexQualificationReleaseObjectReadPort,
  type CanonicalSam31VertexQualificationReleaseObjectReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import {
  canonicalSam31CloudImageBuildAuthorityRef,
  canonicalSam31PrivateImageBuildCapsuleManifestRef,
  createCanonicalSam31CloudImageBuildRepository,
  type CanonicalSam31CloudImageBuildRepository,
} from './canonical-sam3_1-cloud-image-build-runtime'
import { createCanonicalSam31GcpPrivateArtifactIngestRepository } from
  './canonical-sam3_1-private-artifact-ingest-repository'
import { createCanonicalSam31GcsProductionCapsuleReadPort } from
  './canonical-sam3_1-production-capsule-runtime'
import {
  createCanonicalSam31VertexImageBuildBindingReadPort,
  type CanonicalSam31VertexImageBuildBindingReadPort,
} from './canonical-sam3_1-production-capsule-publisher'
import { createCanonicalGcsSourceAnalysisJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_PRODUCTION_IMAGE_AUTHORITY_PUBLISHER_VERSION =
  'canonical-sam3_1-production-image-authority-publisher-v2' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const referenceSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const qualificationReferenceSchema = referenceSchema.extend({
  version: z.literal(2),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  ),
}).strict()
const requestSchema = z.object({
  sourceCheckpointQualificationRef: qualificationReferenceSchema,
  capsuleManifestRef: referenceSchema,
}).strict()

type RefLike = {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const

export interface CanonicalSam31ProductionImageAuthorityIngestReadPort {
  rereadPrivateArtifactIngest(input: {
    readonly ingestReceiptRef: {
      readonly id: string
      readonly version: 1
      readonly schemaVersion:
        'canonical-sam3_1-private-artifact-ingest-receipt-v3'
      readonly contentHash: string
    }
  }): Promise<unknown | null>
}

/**
 * Publishes only the immutable authority needed by the separate scale-zero
 * Cloud Build operator. The request contains refs, never a path, tag, build
 * command, model/checkpoint byte coordinate, retry toggle, or runtime flag.
 */
export function createCanonicalSam31ProductionImageAuthorityPublisher(input: {
  readonly qualificationReleaseReadPort:
    CanonicalSam31VertexQualificationReleaseObjectReadPort
  readonly ingestReadPort:
    CanonicalSam31ProductionImageAuthorityIngestReadPort
  readonly artifactBindingReadPort:
    CanonicalSam31VertexImageBuildBindingReadPort
  readonly repository: CanonicalSam31CloudImageBuildRepository
  readonly privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
  readonly prepareAuthority?:
    typeof prepareCanonicalSam31VertexCloudImageBuildAuthority
  readonly now?: () => string
}) {
  assertDependencies(input)
  const prepareAuthority = input.prepareAuthority
    ?? prepareCanonicalSam31VertexCloudImageBuildAuthority
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRODUCTION_IMAGE_AUTHORITY_PUBLISHER_VERSION,
    async publish(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_production_authority_request')
      const request = requestSchema.parse(untrusted)
      const [releaseRaw, capsuleRaw] = await Promise.all([
        input.qualificationReleaseReadPort.rereadQualificationRelease({
          sourceCheckpointQualificationRef:
            request.sourceCheckpointQualificationRef,
        }),
        input.repository.rereadCapsuleManifest({
          manifestRef: request.capsuleManifestRef,
        }),
      ])
      if (!releaseRaw || !capsuleRaw) {
        throw new Error('SAM 3.1 production image authority evidence is absent.')
      }
      const release = assertCanonicalSam31VertexQualificationRelease(
        releaseRaw,
      )
      const capsule = assertCanonicalSam31PrivateImageBuildCapsuleManifest(
        capsuleRaw,
      )
      assertExactQualificationRef(
        release.sourceCheckpointQualificationRef,
        request.sourceCheckpointQualificationRef,
      )
      assertSameRef(
        canonicalSam31PrivateImageBuildCapsuleManifestRef(capsule),
        request.capsuleManifestRef,
        'SAM 3.1 production capsule reference changed.',
      )
      const ingestRaw = await input.ingestReadPort
        .rereadPrivateArtifactIngest({
          ingestReceiptRef:
            release.qualification.workerRequest.ingestReceiptRef,
        })
      if (!ingestRaw) {
        throw new Error('SAM 3.1 production image ingest evidence is absent.')
      }
      const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
        ingestRaw,
      )
      const candidate = createCanonicalSam31SourceRuntimeCandidate()
      if (ingest.ingestReceiptHash !==
        release.qualification.ingestReceipt.ingestReceiptHash) {
        throw new Error('SAM 3.1 production image ingest crossed release.')
      }
      const expectedBinding = createCanonicalSam31VertexImageBuildBinding({
        release,
      })
      const expectedBindingRef = referenceSchema.parse({
        id:
          `sam31-vertex-build-binding-${expectedBinding.bindingHash.slice(0, 24)}`,
        version: 1,
        contentHash: `sha256:${expectedBinding.bindingHash}`,
      })
      const binding = await input.artifactBindingReadPort
        .rereadArtifactBinding({ bindingRef: expectedBindingRef })
      if (!binding || binding.bindingHash !== expectedBinding.bindingHash) {
        throw new Error('SAM 3.1 Vertex artifact binding reread changed.')
      }
      assertSameRef(
        expectedBindingRef,
        capsule.artifactBindingRef,
        'SAM 3.1 production capsule crossed its artifact binding.',
      )
      if (
        release.status !== 'qualified_for_private_image_build'
        || !release.sourceCheckpointQualificationGranted
        || !release.privateImageBuildReviewEligible
        || release.imageBuildStarted
        || release.runtimeReleaseGranted
        || release.customerCreditsMutated
        || release.productionReady
        || capsule.evidenceClass !== 'canonical_private_reread'
        || capsule.status !== 'private_capsule_verified'
        || !capsule.repositorySource.sourcePublished
        || !capsule.repositorySource.sourceClean
      ) throw new Error('SAM 3.1 production qualification is not admissible.')

      const manifestRef = await input.repository
        .persistCapsuleManifestCreateOnly({ manifest: capsule })
      const manifestReread = await input.repository.rereadCapsuleManifest({
        manifestRef,
      })
      if (!manifestReread
        || manifestReread.manifestHash !== capsule.manifestHash) {
        throw new Error('SAM 3.1 capsule manifest exact reread changed.')
      }
      // The authority is a deterministic projection of the immutable capsule.
      // Reusing the capsule's canonical preparation time keeps an exact replay
      // byte-identical instead of minting a second authority solely because the
      // publisher was invoked again at a later wall-clock time.
      const preparedAt = z.string().datetime({ offset: true }).parse(
        manifestReread.preparedAt,
      )
      const authority = await prepareAuthority({
        authorityId: `sam31-cloud-image-build-${capsule.manifestHash.slice(0, 24)}`,
        candidate,
        ingestReceipt: ingest,
        sourceCheckpointQualification: release.qualification,
        artifactBinding: binding,
        capsuleManifest: manifestReread,
        privateCapsuleReadPort: input.privateCapsuleReadPort,
        preparedAt,
      })
      const authorityRef = await input.repository
        .persistBuildAuthorityCreateOnly({ authority })
      const authorityReread = await input.repository.rereadBuildAuthority({
        authorityRef,
      })
      if (!authorityReread
        || authorityReread.authorityHash !== authority.authorityHash) {
        throw new Error('SAM 3.1 image authority exact reread changed.')
      }
      assertSameRef(
        canonicalSam31CloudImageBuildAuthorityRef(authorityReread),
        authorityRef,
        'SAM 3.1 image authority reference changed.',
      )
      return Object.freeze({
        schemaVersion:
          CANONICAL_SAM3_1_PRODUCTION_IMAGE_AUTHORITY_PUBLISHER_VERSION,
        disposition: 'authorized_for_private_cloud_build' as const,
        sourceCheckpointQualificationRef:
          structuredClone(request.sourceCheckpointQualificationRef),
        artifactBindingRef: structuredClone(expectedBindingRef),
        capsuleManifestRef: structuredClone(manifestRef),
        authorityRef: structuredClone(authorityRef),
        imageDestination: structuredClone(authorityReread.imageDestination),
        exactQualifiedReleaseIngestBindingCapsuleAndAuthorityReread:
          true as const,
        imageBuildStarted: false as const,
        imagePushed: false as const,
        runtimeReleaseGranted: false as const,
        gpuJobDispatched: false as const,
        customerCreditsMutated: false as const,
        qaApproved: false as const,
        productionReady: false as const,
      })
    },
  })
}

export function createCanonicalSam31GcpProductionImageAuthorityPublisher(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
) {
  const storage = input.storage ?? new Storage({
    projectId: 'reeditpro',
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_BUCKET,
  })
  return createCanonicalSam31ProductionImageAuthorityPublisher({
    qualificationReleaseReadPort:
      createCanonicalSam31VertexQualificationReleaseObjectReadPort({
        objectPort,
      }),
    ingestReadPort:
      createCanonicalSam31GcpPrivateArtifactIngestRepository({ storage }),
    artifactBindingReadPort:
      createCanonicalSam31VertexImageBuildBindingReadPort({ objectPort }),
    repository: createCanonicalSam31CloudImageBuildRepository({
      objectPort,
      prefix: 'private/sam3_1/cloud-image-build/v2',
    }),
    privateCapsuleReadPort:
      createCanonicalSam31GcsProductionCapsuleReadPort({ storage }),
    now: input.now,
  })
}

function assertDependencies(input: {
  qualificationReleaseReadPort:
    CanonicalSam31VertexQualificationReleaseObjectReadPort
  ingestReadPort: CanonicalSam31ProductionImageAuthorityIngestReadPort
  artifactBindingReadPort: CanonicalSam31VertexImageBuildBindingReadPort
  repository: CanonicalSam31CloudImageBuildRepository
  privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
  prepareAuthority?: typeof prepareCanonicalSam31VertexCloudImageBuildAuthority
}): void {
  if (
    typeof input.qualificationReleaseReadPort?.rereadQualificationRelease
      !== 'function'
    || typeof input.ingestReadPort?.rereadPrivateArtifactIngest !== 'function'
    || typeof input.artifactBindingReadPort?.rereadArtifactBinding !==
      'function'
    || typeof input.repository?.persistCapsuleManifestCreateOnly !== 'function'
    || typeof input.repository?.rereadCapsuleManifest !== 'function'
    || typeof input.repository?.persistBuildAuthorityCreateOnly !== 'function'
    || typeof input.repository?.rereadBuildAuthority !== 'function'
    || typeof input.privateCapsuleReadPort?.readExact !== 'function'
    || (input.prepareAuthority !== undefined
      && typeof input.prepareAuthority !== 'function')
  ) throw new Error('SAM 3.1 production authority publisher is not configured.')
}

function assertExactQualificationRef(
  left: {
    readonly id: string
    readonly version: number
    readonly schemaVersion: string
    readonly contentHash: string
  },
  right: {
    readonly id: string
    readonly version: number
    readonly schemaVersion: string
    readonly contentHash: string
  },
): void {
  if (
    left.id !== right.id
    || left.version !== right.version
    || left.schemaVersion !== right.schemaVersion
    || left.contentHash !== right.contentHash
  ) throw new Error('SAM 3.1 qualification reference changed.')
}

function assertSameRef(
  left: RefLike,
  right: RefLike,
  message: string,
): void {
  if (
    left.id !== right.id
    || left.version !== right.version
    || left.contentHash !== right.contentHash
  ) throw new Error(message)
}
