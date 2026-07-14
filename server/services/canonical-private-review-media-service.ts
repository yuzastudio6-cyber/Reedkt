import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateReviewMediaQuerySchema,
  type CanonicalPrivateReviewMediaQuery,
} from '../validation/canonical-private-review-browser-schemas'
import { createCanonicalPrivateFinalArtifactDownloadService } from './canonical-private-final-artifact-download-service'
import { createCanonicalPrivateReviewAssemblyService } from './canonical-private-review-assembly-service'

export function createCanonicalPrivateReviewMediaService(context: ServiceContext) {
  return {
    async read(input: CanonicalPrivateReviewMediaQuery & { reviewAssemblyId: string }) {
      assertPrivateReviewMediaRuntime(context)
      const { reviewAssemblyId, ...query } = input
      const parsed = canonicalPrivateReviewMediaQuerySchema.safeParse(query)
      if (!parsed.success || !safeIdentity(reviewAssemblyId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical private-review media identity is invalid.',
          400,
          parsed.success
            ? { reviewAssemblyId: ['Invalid private-review assembly identity.'] }
            : parsed.error.flatten(),
        )
      }

      const assembly = await createCanonicalPrivateReviewAssemblyService(context).getCompleted({
        workspaceId: parsed.data.workspaceId,
        packageRecordId: parsed.data.packageRecordId,
      })
      if (
        assembly.identity.reviewAssemblyId !== reviewAssemblyId ||
        assembly.identity.workspaceId !== parsed.data.workspaceId ||
        assembly.identity.projectId !== parsed.data.expectedProjectId ||
        assembly.identity.editSessionId !== parsed.data.expectedEditSessionId ||
        assembly.identity.packageRecordId !== parsed.data.packageRecordId ||
        assembly.manifest.manifestSha256 !== parsed.data.expectedManifestSha256 ||
        assembly.finalArtifact.sha256 !== parsed.data.expectedFinalArtifactSha256 ||
        assembly.finalArtifact.privateDownloadAvailable !== true ||
        assembly.readiness.privateReviewReady !== true
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Private-review media expectation does not match the completed canonical assembly.',
          409,
          { requiredGate: 'exact_completed_private_review_assembly' },
        )
      }

      const file = await createCanonicalPrivateFinalArtifactDownloadService(context).read({
        workspaceId: parsed.data.workspaceId,
        projectId: parsed.data.expectedProjectId,
        editSessionId: parsed.data.expectedEditSessionId,
        snapshotId: assembly.identity.approvedPlanSnapshotId,
        jobId: assembly.finalArtifact.jobId,
        expectedAssetId: assembly.finalArtifact.expectedAssetId,
        artifactId: assembly.finalArtifact.artifactId,
        purpose: 'download_canonical_private_final_artifact',
      })
      if (
        file.sha256 !== parsed.data.expectedFinalArtifactSha256 ||
        file.byteSize !== assembly.finalArtifact.byteLength ||
        file.mimeType !== 'video/mp4' ||
        file.privateInternalOnly !== true ||
        file.publicUrlCreated !== false ||
        file.signedUrlCreated !== false
      ) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Private-review media verification did not preserve the exact assembly artifact.',
          409,
          { requiredGate: 'canonical_private_review_media_verification' },
        )
      }

      return {
        schemaVersion: 'canonical-private-review-media-v1' as const,
        source: 'canonical_private_review_media_service' as const,
        identity: {
          workspaceId: parsed.data.workspaceId,
          projectId: parsed.data.expectedProjectId,
          editSessionId: parsed.data.expectedEditSessionId,
          packageRecordId: parsed.data.packageRecordId,
          reviewAssemblyId,
        },
        reviewManifestSha256: assembly.manifest.manifestSha256,
        finalArtifactSha256: file.sha256,
        mimeType: file.mimeType,
        fileName: `reeditpro-private-review-${reviewAssemblyId}.mp4`,
        byteSize: file.byteSize,
        bytes: file.bytes,
        privateInternalOnly: true as const,
        publicUrlCreated: false as const,
        signedUrlCreated: false as const,
        billingMutationPerformed: false as const,
        settlementPerformed: false as const,
        testOnly: true as const,
      }
    },
  }
}

function assertPrivateReviewMediaRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical private-review media is private-internal testing only.',
      503,
    )
  }
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}
