import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  CANONICAL_SAM3_1_PRODUCTION_CAPSULE_PUBLISHER_VERSION,
} from './canonical-sam3_1-production-capsule-publisher'
import {
  CANONICAL_SAM3_1_PRODUCTION_IMAGE_AUTHORITY_PUBLISHER_VERSION,
} from './canonical-sam3_1-production-image-authority-publisher'

export const CANONICAL_SAM3_1_PRODUCTION_IMAGE_PUBLICATION_COORDINATOR_VERSION =
  'canonical-sam3_1-production-image-publication-coordinator-v2' as const

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const buildId = z.string().uuid()
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const qualificationRefSchema = refSchema.extend({
  version: z.literal(2),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  ),
}).strict()
const requestSchema = z.object({
  sourceCheckpointQualificationRef: qualificationRefSchema,
  primaryBuildId: buildId,
  confirmationBuildId: buildId,
}).strict().superRefine((value, context) => {
  if (value.primaryBuildId === value.confirmationBuildId) context.addIssue({
    code: 'custom',
    message: 'Two independent production capsule builds are required.',
  })
})
const capsulePublicationSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRODUCTION_CAPSULE_PUBLISHER_VERSION,
  ),
  disposition: z.literal(
    'capsule_ready_for_image_authority_publication',
  ),
  sourceCheckpointQualificationRef: qualificationRefSchema,
  artifactBindingRef: refSchema,
  reproducibilityRef: refSchema,
  capsuleManifestRef: refSchema,
  independentBuildCount: z.literal(2),
  exactCapsuleBodyAndEntrySetReread: z.literal(true),
  checkpointIncluded: z.literal(false),
  developerMachineModelInstallPerformed: z.literal(false),
  imageBuildStarted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  productionReady: z.literal(false),
}).strict()
const imageDestinationSchema = z.object({
  repository: z.string().trim().min(1).max(512),
  imageName: z.string().trim().min(1).max(240),
  tag: z.string().trim().min(1).max(240),
  taggedUri: z.string().trim().min(1).max(1_024),
  callerSelectedTagAllowed: z.literal(false),
  tagMayAuthorizeRuntime: z.literal(false),
  terminalImmutableDigestRequired: z.literal(true),
}).strict()
const authorityPublicationSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRODUCTION_IMAGE_AUTHORITY_PUBLISHER_VERSION,
  ),
  disposition: z.literal('authorized_for_private_cloud_build'),
  sourceCheckpointQualificationRef: qualificationRefSchema,
  artifactBindingRef: refSchema,
  capsuleManifestRef: refSchema,
  authorityRef: refSchema,
  imageDestination: imageDestinationSchema,
  exactQualifiedReleaseIngestBindingCapsuleAndAuthorityReread:
    z.literal(true),
  imageBuildStarted: z.literal(false),
  imagePushed: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export interface CanonicalSam31ProductionCapsulePublisherPort {
  publish(input: unknown): Promise<unknown>
}

export interface CanonicalSam31ProductionImageAuthorityPublisherPort {
  publish(input: unknown): Promise<unknown>
}

/**
 * Sequences the two existing one-writer publishers. It cannot accept capsule
 * bytes, storage coordinates, image tags, Dockerfiles, commands, retry policy,
 * GPU selection, runtime release, or credit authority from its caller.
 */
export function createCanonicalSam31ProductionImagePublicationCoordinator(
  input: {
    readonly capsulePublisher: CanonicalSam31ProductionCapsulePublisherPort
    readonly authorityPublisher:
      CanonicalSam31ProductionImageAuthorityPublisherPort
  },
) {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRODUCTION_IMAGE_PUBLICATION_COORDINATOR_VERSION,
    async publish(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_production_publication')
      const request = requestSchema.parse(untrusted)
      const capsuleRaw = await input.capsulePublisher.publish(request)
      assertPlainSerializedData(capsuleRaw, 'sam31_capsule_publication')
      const capsule = capsulePublicationSchema.parse(capsuleRaw)
      assertSameQualification(
        capsule.sourceCheckpointQualificationRef,
        request.sourceCheckpointQualificationRef,
      )
      const authorityRaw = await input.authorityPublisher.publish({
        sourceCheckpointQualificationRef:
          request.sourceCheckpointQualificationRef,
        capsuleManifestRef: capsule.capsuleManifestRef,
      })
      assertPlainSerializedData(authorityRaw, 'sam31_authority_publication')
      const authority = authorityPublicationSchema.parse(authorityRaw)
      assertSameQualification(
        authority.sourceCheckpointQualificationRef,
        request.sourceCheckpointQualificationRef,
      )
      assertSameRef(
        authority.capsuleManifestRef,
        capsule.capsuleManifestRef,
        'Production image authority crossed its capsule manifest.',
      )
      assertSameRef(
        authority.artifactBindingRef,
        capsule.artifactBindingRef,
        'Production image authority crossed its artifact binding.',
      )
      return Object.freeze({
        schemaVersion:
          CANONICAL_SAM3_1_PRODUCTION_IMAGE_PUBLICATION_COORDINATOR_VERSION,
        disposition: 'ready_for_scale_zero_image_operator_start' as const,
        sourceCheckpointQualificationRef:
          structuredClone(request.sourceCheckpointQualificationRef),
        primaryBuildId: request.primaryBuildId,
        confirmationBuildId: request.confirmationBuildId,
        reproducibilityRef: structuredClone(capsule.reproducibilityRef),
        artifactBindingRef: structuredClone(authority.artifactBindingRef),
        capsuleManifestRef: structuredClone(authority.capsuleManifestRef),
        authorityRef: structuredClone(authority.authorityRef),
        imageDestination: structuredClone(authority.imageDestination),
        exactTwoBuildCapsuleAndImageAuthorityReread: true as const,
        imageBuildStarted: false as const,
        imagePushed: false as const,
        gpuJobDispatched: false as const,
        modelOrCheckpointExecuted: false as const,
        customerCreditsMutated: false as const,
        runtimeReleaseGranted: false as const,
        qaApproved: false as const,
        productionReady: false as const,
      })
    },
  })
}

function assertDependencies(input: {
  capsulePublisher: CanonicalSam31ProductionCapsulePublisherPort
  authorityPublisher: CanonicalSam31ProductionImageAuthorityPublisherPort
}): void {
  if (
    typeof input.capsulePublisher?.publish !== 'function'
    || typeof input.authorityPublisher?.publish !== 'function'
  ) throw new Error(
    'SAM 3.1 production image publication coordinator is not configured.',
  )
}

function assertSameQualification(
  left: z.infer<typeof qualificationRefSchema>,
  right: z.infer<typeof qualificationRefSchema>,
): void {
  assertSameRef(left, right, 'Production qualification reference changed.')
  if (left.schemaVersion !== right.schemaVersion) {
    throw new Error('Production qualification schema version changed.')
  }
}

function assertSameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
  message: string,
): void {
  if (
    left.id !== right.id
    || left.version !== right.version
    || left.contentHash !== right.contentHash
  ) throw new Error(message)
}
