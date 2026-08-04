import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateAcceptedFinalArtifactDownloadQuerySchema,
  type CanonicalPrivateAcceptedFinalArtifactDownloadQuery,
} from '../validation/canonical-private-accepted-final-artifact-download-schemas'
import { createCanonicalPrivateFinalArtifactDownloadService } from './canonical-private-final-artifact-download-service'
import { createCanonicalPrivateReviewAssemblyService } from './canonical-private-review-assembly-service'
import { createCanonicalPrivateReviewDecisionService } from './canonical-private-review-decision-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createCanonicalPrivateAcceptedFinalArtifactDownloadService(
  context: ServiceContext,
) {
  return {
    async read(
      input: CanonicalPrivateAcceptedFinalArtifactDownloadQuery & {
        reviewAssemblyId: string
      },
    ) {
      assertPrivateAcceptedDownloadRuntime(context)
      const { reviewAssemblyId, ...query } = input
      const parsed =
        canonicalPrivateAcceptedFinalArtifactDownloadQuerySchema.safeParse(
          query,
        )
      if (!parsed.success || !safeIdentity(reviewAssemblyId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Accepted private final-download identity is invalid.',
          400,
          parsed.success
            ? {
                reviewAssemblyId: [
                  'Invalid private-review assembly identity.',
                ],
              }
            : parsed.error.flatten(),
        )
      }
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(
        context,
        parsed.data.workspaceId,
        'read',
      )
      if (access.userId !== actorUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Accepted private final download is outside this workspace.',
          403,
        )
      }

      const assembly =
        await createCanonicalPrivateReviewAssemblyService(
          context,
        ).getCompleted({
          workspaceId: access.workspaceId,
          packageRecordId: parsed.data.packageRecordId,
        })
      const decision = await createCanonicalPrivateReviewDecisionService(
        context,
      ).getCompleted({
        workspaceId: access.workspaceId,
        reviewAssemblyId,
      })
      if (
        assembly.identity.workspaceId !== access.workspaceId ||
        assembly.identity.packageRecordId !==
          parsed.data.packageRecordId ||
        assembly.identity.reviewAssemblyId !== reviewAssemblyId ||
        assembly.finalArtifact.sha256 !==
          parsed.data.expectedFinalArtifactSha256 ||
        assembly.readiness.privateReviewReady !== true ||
        decision.identity.workspaceId !== access.workspaceId ||
        decision.identity.projectId !== assembly.identity.projectId ||
        decision.identity.editSessionId !==
          assembly.identity.editSessionId ||
        decision.identity.packageRecordId !==
          assembly.identity.packageRecordId ||
        decision.identity.approvedPlanSnapshotId !==
          assembly.identity.approvedPlanSnapshotId ||
        decision.identity.reviewAssemblyId !== reviewAssemblyId ||
        decision.decision !== 'accept_private_internal_review' ||
        decision.status !== 'private_internal_review_accepted' ||
        decision.revisionHandoff !== null ||
        decision.manifest.manifestSha256 !==
          parsed.data.expectedDecisionManifestSha256 ||
        decision.authority.reviewManifestSha256 !==
          assembly.manifest.manifestSha256 ||
        decision.authority.finalArtifactSha256 !==
          parsed.data.expectedFinalArtifactSha256 ||
        decision.readiness.revisionRequested !== false
      ) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'The exact private review has not been accepted for final download.',
          409,
          { requiredGate: 'exact_accepted_private_review_decision' },
        )
      }

      const file =
        await createCanonicalPrivateFinalArtifactDownloadService(
          context,
        ).read({
          workspaceId: access.workspaceId,
          projectId: assembly.identity.projectId,
          editSessionId: assembly.identity.editSessionId,
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
          'Accepted private final bytes no longer match the reviewed artifact.',
          409,
          { requiredGate: 'exact_accepted_private_final_artifact' },
        )
      }

      return {
        ...file,
        fileName:
          `weeditpro-private-final-${reviewAssemblyId}.mp4`,
        reviewAssemblyId,
        decisionManifestSha256:
          decision.manifest.manifestSha256,
        exactAcceptedPrivateReviewRevalidated: true as const,
      }
    },
  }
}

function assertPrivateAcceptedDownloadRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (
      !context.env.mockOnly &&
      !context.env.allowInternalTestExecutionWithSupabase
    )
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Accepted final download is private-internal testing only.',
      503,
    )
  }
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) &&
    !value.includes('..')
}
