import type { PlatformAspectRatio } from './workflow-common'
import type { CanonicalPostrenderVisualQaEvidenceRef } from
  './canonical-postrender-visual-qa-lifecycle'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION =
  'canonical-caption-postrender-visual-qa-evidence-v1' as const

export type CanonicalCaptionPostrenderVisualQaDecision =
  | 'passed'
  | 'repair_required'
  | 'needs_human_review'
  | 'blocked_evidence_reconciliation'

/**
 * Canonical, provider-neutral interpretation of one completed post-render
 * visual-inspection attempt. The provider lifecycle proves execution; this
 * record owns the normalized QA decision consumed by Caption and private
 * review. It grants neither final QA approval nor repair authority.
 */
export interface CanonicalCaptionPostrenderVisualQaEvidence {
  schemaVersion:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION
  evidenceId: string
  evidenceDigestSha256: string
  ownerUserId: string
  scope: {
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
  }
  output: {
    outputId: string
    aspectRatio: PlatformAspectRatio
    width: number
    height: number
    fps: number
    confirmedOutputFrameRef: CanonicalPostrenderVisualQaEvidenceRef
    confirmedByUser: true
    confirmationRecordId: string
  }
  workRequestRef: CanonicalPostrenderVisualQaEvidenceRef
  lifecycleResultRef: CanonicalPostrenderVisualQaEvidenceRef
  normalizedDecisionRef: CanonicalPostrenderVisualQaEvidenceRef
  providerExecutionReceiptRef: CanonicalPostrenderVisualQaEvidenceRef
  persistedEvidenceArtifactRef: CanonicalPostrenderVisualQaEvidenceRef
  independentArtifactQaRef: CanonicalPostrenderVisualQaEvidenceRef
  assetManifestReconciliationRef: CanonicalPostrenderVisualQaEvidenceRef
  decision: CanonicalCaptionPostrenderVisualQaDecision
  userFacingSummary: string
  deterministicQaPassed: true
  exactApprovedRenderBound: true
  actualModelInferenceVerified: true
  deterministicAndModelEvidenceAgree: boolean
  canonicalEvidenceReconciled: boolean
  modelInspectionCoverage: {
    scope:
      | 'complete_segment_coverage'
      | 'bounded_representative_segment_coverage'
    sampledSegmentCount: number
    unsampledSegmentCount: number
    modelInspectedOnlyPlannedSamples: true
    unsampledSegmentsNeverImpliedInspected: true
  }
  smallestScopeRepairRequired: boolean
  privateHumanReviewRequired: boolean
  actualCompleteTimeVisualReviewPassed: boolean
  rawModelTextIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  browserLocalStateUsed: false
  operationDispatchAuthority: false
  providerRuntimeAuthority: false
  qaApprovalAuthority: false
  repairExecutionAuthority: false
  assetMutationAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}
