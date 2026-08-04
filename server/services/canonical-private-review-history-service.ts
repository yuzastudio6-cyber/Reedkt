import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateReviewHistoryDownloadQuerySchema,
  canonicalPrivateReviewHistoryMetadataSchema,
  type CanonicalPrivateReviewHistoryDownloadQuery,
} from '../validation/canonical-private-review-history-schemas'
import { createCanonicalPrivateReviewAssemblyService } from './canonical-private-review-assembly-service'
import { createCanonicalPrivateReviewDecisionService } from './canonical-private-review-decision-service'
import { verifyCanonicalPrivateFinalCompositionArtifact } from './canonical-private-final-artifact-verifier'
import { readPrivateArtifactQaAggregate } from './private-artifact-qa-authority-store'
import { readPrivateEditAuthorityAggregate, sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createCanonicalPrivateReviewHistoryService(context: ServiceContext) {
  return {
    async read(input: CanonicalPrivateReviewHistoryDownloadQuery & { reviewAssemblyId: string }) {
      assertPrivateHistoryRuntime(context)
      const { reviewAssemblyId, ...query } = input
      const parsed = canonicalPrivateReviewHistoryDownloadQuerySchema.safeParse(query)
      if (!parsed.success || !safeIdentity(reviewAssemblyId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical private-review history identity is invalid.',
          400,
          parsed.success ? { reviewAssemblyId: ['Invalid review assembly identity.'] } : parsed.error.flatten(),
        )
      }
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, parsed.data.workspaceId, 'read')
      if (actorUserId !== access.userId) {
        throw new ApiError('AUTH_REQUIRED', 'Private-review history is outside this workspace.', 403)
      }

      const assembly = await createCanonicalPrivateReviewAssemblyService(context).getCompleted({
        workspaceId: access.workspaceId,
        packageRecordId: parsed.data.packageRecordId,
      })
      const decision = await createCanonicalPrivateReviewDecisionService(context).getCompleted({
        workspaceId: access.workspaceId,
        reviewAssemblyId,
      })
      if (
        assembly.identity.reviewAssemblyId !== reviewAssemblyId ||
        assembly.identity.packageRecordId !== parsed.data.packageRecordId ||
        decision.identity.reviewAssemblyId !== reviewAssemblyId ||
        decision.identity.packageRecordId !== parsed.data.packageRecordId ||
        decision.identity.approvedPlanSnapshotId !== assembly.identity.approvedPlanSnapshotId ||
        decision.authority.reviewManifestSha256 !== assembly.manifest.manifestSha256 ||
        decision.authority.finalArtifactSha256 !== assembly.finalArtifact.sha256 ||
        decision.manifest.manifestSha256 !== parsed.data.expectedDecisionManifestSha256 ||
        assembly.finalArtifact.sha256 !== parsed.data.expectedFinalArtifactSha256
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Private-review history expectation does not match immutable assembly/decision authority.',
          409,
        )
      }

      const editAuthority = await readPrivateEditAuthorityAggregate({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
      })
      const snapshot = editAuthority?.snapshots.find((candidate) =>
        candidate.snapshotId === assembly.identity.approvedPlanSnapshotId)
      const plan = snapshot && editAuthority?.plans.find((candidate) => candidate.id === snapshot.planId)
      const reservation = snapshot && editAuthority?.reservations.find((candidate) =>
        candidate.id === snapshot.reservationId)
      if (
        !snapshot || !plan || !reservation ||
        snapshot.projectId !== assembly.identity.projectId ||
        snapshot.editSessionId !== assembly.identity.editSessionId ||
        snapshot.planId !== decision.authority.approvedPlanId ||
        snapshot.planVersion !== decision.authority.approvedPlanVersion ||
        snapshot.snapshotHash !== decision.authority.approvedSnapshotHash ||
        !['approved', 'superseded'].includes(plan.status) ||
        !['reserved', 'partially_spent', 'released'].includes(reservation.status)
      ) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Private-review history plan lineage is invalid.', 409)
      }
      const reviewState = plan.status === 'superseded' ? 'superseded' as const : 'current' as const
      if (
        (reviewState === 'superseded' && reservation.status !== 'released') ||
        (reviewState === 'current' && !['reserved', 'partially_spent'].includes(reservation.status))
      ) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Private-review history status/reservation lineage is invalid.', 409)
      }

      const artifactAggregate = await readPrivateArtifactQaAggregate({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
      })
      const artifactCandidates = artifactAggregate?.artifacts.filter((artifact) =>
        artifact.artifactId === assembly.finalArtifact.artifactId &&
        artifact.identity.snapshotId === snapshot.snapshotId &&
        artifact.identity.jobId === assembly.finalArtifact.jobId &&
        artifact.identity.expectedAssetId === assembly.finalArtifact.expectedAssetId &&
        artifact.content.contentType === 'video/mp4' &&
        artifact.content.sha256 === assembly.finalArtifact.sha256)
      if (!artifactCandidates || artifactCandidates.length !== 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private-review history final artifact is missing or ambiguous.', 409)
      }
      const artifact = artifactCandidates[0]!
      const qaCandidates = artifactAggregate!.qaEvaluations.filter((qa) =>
        qa.artifactId === artifact.artifactId && qa.outcome === 'passed')
      if (qaCandidates.length !== 1) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private-review history final QA is missing or ambiguous.', 409)
      }
      const qa = qaCandidates[0]!
      const gateIds = new Set(qa.gateResults.map((gate) => gate.gateId))
      const reconciliationCandidates = artifactAggregate!.reconciliations.filter((reconciliation) =>
        reconciliation.artifactId === artifact.artifactId &&
        reconciliation.qaEvaluationId === qa.qaEvaluationId &&
        reconciliation.decision === 'test_merged_not_live_authorized')
      if (
        reconciliationCandidates.length !== 1 ||
        !gateIds.has('asset_received_gate') || !gateIds.has('asset_quality_gate') ||
        !gateIds.has('render_preflight_gate') || !gateIds.has('final_qa_gate') ||
        reconciliationCandidates[0]!.privateTestDependencySatisfied !== true ||
        reconciliationCandidates[0]!.liveRuntimeDependencySatisfied !== false ||
        reconciliationCandidates[0]!.finalRenderAuthorized !== false
      ) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private-review history final QA/reconciliation is invalid.', 409)
      }
      const reconciliation = reconciliationCandidates[0]!
      const verified = await verifyCanonicalPrivateFinalCompositionArtifact({
        localStorageRoot: context.env.localStorageRoot,
        artifact,
      })
      const fileName = `reeditpro-private-review-v${snapshot.planVersion}-${artifact.artifactId}.mp4`
      const metadata = canonicalPrivateReviewHistoryMetadataSchema.parse({
        schemaVersion: 'canonical-private-review-history-download-v1',
        source: 'canonical_private_review_history_service',
        identity: {
          workspaceId: access.workspaceId,
          projectId: snapshot.projectId,
          editSessionId: snapshot.editSessionId,
          packageRecordId: parsed.data.packageRecordId,
          approvedPlanSnapshotId: snapshot.snapshotId,
          approvedPlanId: snapshot.planId,
          approvedPlanVersion: snapshot.planVersion,
          reviewAssemblyId,
          reviewDecisionId: decision.identity.reviewDecisionId,
          artifactId: artifact.artifactId,
          expectedAssetId: artifact.identity.expectedAssetId,
        },
        reviewState,
        decision: decision.decision,
        planStatus: plan.status,
        reservationStatus: reservation.status,
        mimeType: 'video/mp4',
        fileName,
        byteSize: verified.byteLength,
        sha256: verified.sha256,
        assemblyManifestSha256: assembly.manifest.manifestSha256,
        decisionManifestSha256: decision.manifest.manifestSha256,
        qaEvaluationId: qa.qaEvaluationId,
        reconciliationId: reconciliation.reconciliationId,
        historyEvidenceHash: sha256AuthorityValue({
          reviewAssemblyId,
          reviewDecisionId: decision.identity.reviewDecisionId,
          snapshotHash: snapshot.snapshotHash,
          planStatus: plan.status,
          reservationStatus: reservation.status,
          artifactId: artifact.artifactId,
          artifactSha256: verified.sha256,
          qaEvaluationId: qa.qaEvaluationId,
          reconciliationId: reconciliation.reconciliationId,
        }),
        archivedExecutionAuthorityRestored: false,
        publicUrlCreated: false,
        signedUrlCreated: false,
        customerCreditMutationPerformed: false,
        billingMutationPerformed: false,
        settlementPerformed: false,
        testOnly: true,
      })
      return { ...metadata, openStream: verified.openStream }
    },
  }
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function assertPrivateHistoryRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) throw new ApiError('TOOL_NOT_READY', 'Canonical private-review history is private-internal testing only.', 503)
}
