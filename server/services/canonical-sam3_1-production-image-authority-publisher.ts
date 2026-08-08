import { z } from 'zod'
import { Storage } from '@google-cloud/storage'

import {
  CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  assertCanonicalSam31PrivateImageBuildCapsuleManifest,
  createCanonicalSam31ImageBuildArtifactBinding,
  prepareCanonicalSam31CloudImageBuildAuthority,
  type CanonicalSam31PrivateBuildCapsuleReadPort,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import { createCanonicalSam31SourceRuntimeCandidate } from
  '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import { assertCanonicalSam31PrivateArtifactIngestReceipt } from
  '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  createCanonicalSam31QualificationReleaseObjectReadPort,
  assertCanonicalSam31QualificationRelease,
  type CanonicalSam31QualificationReleaseObjectReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-release-owner'
import {
  canonicalSam31CloudImageBuildAuthorityRef,
  canonicalSam31ImageBuildArtifactBindingRef,
  canonicalSam31PrivateImageBuildCapsuleManifestRef,
  createCanonicalSam31CloudImageBuildRepository,
  type CanonicalSam31CloudImageBuildRepository,
} from './canonical-sam3_1-cloud-image-build-runtime'
import { createCanonicalSam31GcpPrivateArtifactIngestRepository } from
  './canonical-sam3_1-private-artifact-ingest-repository'
import { createCanonicalSam31GcsProductionCapsuleReadPort } from
  './canonical-sam3_1-production-capsule-runtime'
import { createCanonicalGcsSourceAnalysisJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_PRODUCTION_IMAGE_AUTHORITY_PUBLISHER_VERSION =
  'canonical-sam3_1-production-image-authority-publisher-v1' as const

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
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
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
    CanonicalSam31QualificationReleaseObjectReadPort
  readonly ingestReadPort:
    CanonicalSam31ProductionImageAuthorityIngestReadPort
  readonly repository: CanonicalSam31CloudImageBuildRepository
  readonly privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
  readonly prepareAuthority?: typeof prepareCanonicalSam31CloudImageBuildAuthority
  readonly now?: () => string
}) {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  const prepareAuthority = input.prepareAuthority
    ?? prepareCanonicalSam31CloudImageBuildAuthority
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
      const release = assertCanonicalSam31QualificationRelease(releaseRaw)
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
          ingestReceiptRef: release.qualification.ingestReceiptRef,
        })
      if (!ingestRaw) {
        throw new Error('SAM 3.1 production image ingest evidence is absent.')
      }
      const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
        ingestRaw,
      )
      const candidate = createCanonicalSam31SourceRuntimeCandidate()
      const binding = createCanonicalSam31ImageBuildArtifactBinding({
        candidate,
        ingestReceipt: ingest,
        sourceCheckpointQualification: release.qualification,
      })
      assertSameRef(
        canonicalSam31ImageBuildArtifactBindingRef(binding),
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

      const bindingRef = await input.repository
        .persistArtifactBindingCreateOnly({ binding })
      const bindingReread = await input.repository.rereadArtifactBinding({
        bindingRef,
      })
      if (!bindingReread || bindingReread.bindingHash !== binding.bindingHash) {
        throw new Error('SAM 3.1 artifact binding exact reread changed.')
      }
      const manifestRef = await input.repository
        .persistCapsuleManifestCreateOnly({ manifest: capsule })
      const manifestReread = await input.repository.rereadCapsuleManifest({
        manifestRef,
      })
      if (!manifestReread
        || manifestReread.manifestHash !== capsule.manifestHash) {
        throw new Error('SAM 3.1 capsule manifest exact reread changed.')
      }
      const preparedAt = z.string().datetime({ offset: true }).parse(now())
      const authority = await prepareAuthority({
        authorityId: `sam31-cloud-image-build-${capsule.manifestHash.slice(0, 24)}`,
        candidate,
        ingestReceipt: ingest,
        sourceCheckpointQualification: release.qualification,
        artifactBinding: bindingReread,
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
        artifactBindingRef: structuredClone(bindingRef),
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
      createCanonicalSam31QualificationReleaseObjectReadPort({ objectPort }),
    ingestReadPort:
      createCanonicalSam31GcpPrivateArtifactIngestRepository({ storage }),
    repository: createCanonicalSam31CloudImageBuildRepository({ objectPort }),
    privateCapsuleReadPort:
      createCanonicalSam31GcsProductionCapsuleReadPort({ storage }),
    now: input.now,
  })
}

function assertDependencies(input: {
  qualificationReleaseReadPort: CanonicalSam31QualificationReleaseObjectReadPort
  ingestReadPort: CanonicalSam31ProductionImageAuthorityIngestReadPort
  repository: CanonicalSam31CloudImageBuildRepository
  privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
  prepareAuthority?: typeof prepareCanonicalSam31CloudImageBuildAuthority
}): void {
  if (
    typeof input.qualificationReleaseReadPort?.rereadQualificationRelease
      !== 'function'
    || typeof input.ingestReadPort?.rereadPrivateArtifactIngest !== 'function'
    || typeof input.repository?.persistArtifactBindingCreateOnly !== 'function'
    || typeof input.repository?.rereadArtifactBinding !== 'function'
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
