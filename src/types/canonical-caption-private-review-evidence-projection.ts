import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CanonicalPostrenderVisualQaEvidenceRef } from
  './canonical-postrender-visual-qa-lifecycle'
import type { CanonicalCaptionPostrenderVisualQaDecision } from
  './canonical-caption-postrender-visual-qa-evidence'

export const CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION =
  'canonical-caption-private-review-evidence-projection-v1' as const

export type CanonicalCaptionPrivateReviewEvidenceDisposition =
  | 'blocked_visual_evidence_reconciliation'
  | 'repair_required_before_private_review'
  | 'waiting_for_private_review_assembly'
  | 'waiting_for_private_review_decision'
  | 'canonical_revision_requested'
  | 'private_review_accepted_visual_pass'
  | 'private_review_accepted_visual_uncertainty_unresolved'

/**
 * Authenticated, recomputable projection joining the Caption visual-review
 * evidence to the existing canonical private-review owner. It is not a review
 * decision, does not mutate the approved snapshot, and grants no execution or
 * repair authority.
 */
export interface CanonicalCaptionPrivateReviewEvidenceProjection {
  schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION
  projectionId: string
  projectionDigestSha256: string
  canonicalScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
    approvedSnapshotHash: string
    planId: string
    planVersion: number
    packageRecordId: string
    packageHash: string
  }
  output: {
    outputId: string
    confirmedOutputFrameRef: CaptionDomainRef
    width: number
    height: number
    fpsNumerator: number
    fpsDenominator: number
    renderedArtifactRef: CanonicalPostrenderVisualQaEvidenceRef
    deterministicQaRef: CanonicalPostrenderVisualQaEvidenceRef
  }
  sourceRefs: {
    privateReviewDependencyBindingRef: CaptionDomainRef
    postrenderVisualQaEvidenceRef: CanonicalPostrenderVisualQaEvidenceRef
    workRequestRef: CanonicalPostrenderVisualQaEvidenceRef
    normalizedResultRef: CanonicalPostrenderVisualQaEvidenceRef
  }
  visualReview: {
    decision: CanonicalCaptionPostrenderVisualQaDecision
    actualModelInferenceVerified: true
    exactApprovedRenderBound: true
    canonicalEvidenceReconciled: boolean
    actualCompleteTimeVisualReviewPassed: boolean
    smallestScopeRepairRequired: boolean
    privateHumanReviewRequired: boolean
  }
  canonicalPrivateReview: {
    assemblyRef: CaptionDomainRef | null
    decisionRef: CaptionDomainRef | null
    decision:
      | 'accept_private_internal_review'
      | 'request_revision'
      | null
    finalArtifactSha256: string | null
    finalQaArtifactSha256: string | null
    exactAssemblyReread: boolean
    exactDecisionReread: boolean
    immutableApprovedSnapshotPreserved: boolean
    immutableReviewManifestPreserved: boolean
  }
  disposition: CanonicalCaptionPrivateReviewEvidenceDisposition
  privateReviewAssemblyAllowed: boolean
  privateReviewDecisionRecorded: boolean
  privateReviewAccepted: boolean
  terminalPrivateInternalQualificationEligible: boolean
  requiresNewApprovedSnapshot: boolean
  browserLocalCompletionAccepted: false
  captionCreatedPrivateReviewDecision: false
  captionExecutedRepair: false
  approvedSnapshotMutationGranted: false
  operationDispatchAuthority: false
  providerOrModelRuntimeAuthority: false
  assetMutationAuthority: false
  finalQaApprovalAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}
