import type {
  MotionStudioDeliveryHandoffV1,
  MotionStudioFineCutManifestV1,
  MotionStudioFineCutReviewDecisionV1,
  MotionStudioPrivateReviewBindingV1,
  MotionStudioQualityControlReportV1,
  MotionStudioReviewCommentEventV1,
  MotionStudioReviewCommentV1,
  MotionStudioRevisionImpactV1,
} from '../../../src/types/motion-studio'
import type {
  CanonicalMotionStudioFineCutAuthorizationV1,
  CanonicalMotionStudioFineCutCommitReceiptV1,
  CanonicalMotionStudioFineCutCompanionCommitReceiptV1,
  CreateCanonicalMotionStudioFineCutRequestV1,
} from '../../validation/motion-studio-fine-cut-transition-schemas'
import type { MotionStudioFineCutCompilerInputV1 } from './compiler'

export interface CanonicalMotionStudioFineCutScope {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
}

export interface CanonicalMotionStudioFineCutPreparedSourceV1 {
  schemaVersion: 'canonical-motion-studio-fine-cut-prepared-source-v1'
  authorizationDigest: string
  sourceAuthorityDigest: string
  evidenceClass: 'canonical_backend_verified_runtime'
  releaseClass: 'private_fine_cut_release'
  exactCurrentAuthorityReverified: true
  approvedSnapshotReverified: true
  timelineRenderAndAudioReverified: true
  requiredAssetsQaRightsAndCostReverified: true
  compilerInput: MotionStudioFineCutCompilerInputV1
}

export interface CanonicalMotionStudioFineCutRecordCommitInput<TRecord> {
  authorization: CanonicalMotionStudioFineCutAuthorizationV1
  authorizationDigest: string
  actorUserId: string
  requestHash: string
  idempotencyKey: string
  record: TRecord
  recordDigest: string
}

/**
 * The single server-only adoption seam for MS-013B.
 *
 * Implementations must transact through the existing canonical review,
 * revision, QA, export, snapshot, package, asset and cost authorities. This is
 * not permission to create a Motion-specific database, review system, export
 * queue, renderer, billing system or browser-authored terminal state.
 */
export interface CanonicalMotionStudioFineCutTransitionPort {
  authorizeScope(input: {
    scope: CanonicalMotionStudioFineCutScope
    actorUserId: string
    access: 'read' | 'write'
  }): Promise<CanonicalMotionStudioFineCutAuthorizationV1>

  findFineCutReplay(input: {
    authorization: CanonicalMotionStudioFineCutAuthorizationV1
    authorizationDigest: string
    actorUserId: string
    request: CreateCanonicalMotionStudioFineCutRequestV1
    requestHash: string
    idempotencyKey: string
  }): Promise<CanonicalMotionStudioFineCutCommitReceiptV1 | undefined>

  prepareCurrentFineCutSource(input: {
    authorization: CanonicalMotionStudioFineCutAuthorizationV1
    authorizationDigest: string
    actorUserId: string
    request: CreateCanonicalMotionStudioFineCutRequestV1
    compiledAt: string
  }): Promise<CanonicalMotionStudioFineCutPreparedSourceV1 | undefined>

  commitFineCut(input: {
    authorization: CanonicalMotionStudioFineCutAuthorizationV1
    authorizationDigest: string
    actorUserId: string
    request: CreateCanonicalMotionStudioFineCutRequestV1
    requestHash: string
    idempotencyKey: string
    sourceAuthorityDigest: string
    manifest: MotionStudioFineCutManifestV1
    manifestDigest: string
  }): Promise<CanonicalMotionStudioFineCutCommitReceiptV1>

  commitPrivateReviewBinding(
    input: CanonicalMotionStudioFineCutRecordCommitInput<MotionStudioPrivateReviewBindingV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1>

  appendReviewComment(
    input: CanonicalMotionStudioFineCutRecordCommitInput<MotionStudioReviewCommentV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1>

  appendReviewCommentEvent(
    input: CanonicalMotionStudioFineCutRecordCommitInput<MotionStudioReviewCommentEventV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1>

  commitReviewDecision(
    input: CanonicalMotionStudioFineCutRecordCommitInput<MotionStudioFineCutReviewDecisionV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1>

  commitRevisionImpact(
    input: CanonicalMotionStudioFineCutRecordCommitInput<MotionStudioRevisionImpactV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1>

  commitQualityControlReport(
    input: CanonicalMotionStudioFineCutRecordCommitInput<MotionStudioQualityControlReportV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1>

  commitDeliveryHandoff(
    input: CanonicalMotionStudioFineCutRecordCommitInput<MotionStudioDeliveryHandoffV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1>
}
