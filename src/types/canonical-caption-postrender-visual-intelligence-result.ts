import type {
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceFinding,
  VisualIntelligenceFrameRange,
} from './visual-intelligence'
import type { CaptionDomainRef } from './caption-domain-contracts'
import type { PlatformAspectRatio } from './workflow-common'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_RESULT_VERSION =
  'canonical-caption-postrender-visual-intelligence-result-v1' as const

export type CanonicalCaptionPostrenderVisualIntelligenceDecision =
  | 'passed'
  | 'repair_required'
  | 'needs_human_review'
  | 'blocked_evidence_reconciliation'

/**
 * Provider-neutral, server-owned bridge from an admitted Visual Intelligence
 * inspection to Caption's post-render QA lane. The model evaluates the whole
 * requested timeline semantically, while deterministic QA remains the only
 * every-frame technical authority. This record never claims provider-internal
 * exact-frame or exact-pixel behavior.
 */
export interface CanonicalCaptionPostrenderVisualIntelligenceResult {
  schemaVersion:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_RESULT_VERSION
  resultId: string
  resultDigestSha256: string
  scope: {
    ownerUserId: string
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
    fpsNumerator: number
    fpsDenominator: number
    frameCount: number
    confirmedOutputFrameRef: VisualIntelligenceEvidenceRef
    captionConfirmedOutputFrameRef: CaptionDomainRef
    confirmedOutputFrameBindingDigestSha256: string
    confirmedByUser: true
    confirmationRecordId: string
  }
  approvedSnapshotRef: VisualIntelligenceEvidenceRef
  executionPackageRef: VisualIntelligenceEvidenceRef
  approvedWorkItemRef: VisualIntelligenceEvidenceRef
  privateRenderArtifactRef: VisualIntelligenceEvidenceRef
  deterministicCompleteTimeQaRef: VisualIntelligenceEvidenceRef
  independentArtifactQaRef: VisualIntelligenceEvidenceRef
  assetManifestReconciliationRef: VisualIntelligenceEvidenceRef
  visualInspectionRequirementRef: VisualIntelligenceEvidenceRef
  visualIntelligenceRequestRef: VisualIntelligenceEvidenceRef
  visualIntelligenceReportRef: VisualIntelligenceEvidenceRef
  visualIntelligenceSpatialEvidenceRef: VisualIntelligenceEvidenceRef
  visualInspectionResultRef: VisualIntelligenceEvidenceRef
  expectedOutcomeRefs: VisualIntelligenceEvidenceRef[]
  requestedRanges: VisualIntelligenceFrameRange[]
  analyzedRanges: VisualIntelligenceFrameRange[]
  decision: CanonicalCaptionPostrenderVisualIntelligenceDecision
  userFacingSummary: string
  findingIds: string[]
  captionFindingIds: string[]
  blockingOrRevisionFindingIds: string[]
  deterministicCompleteTimeQaPassed: true
  exactApprovedPrivateRenderRereadVerified: true
  exactConfirmedOutputFrameRereadVerified: true
  exactExpectedOutcomeLineageVerified: true
  completeRequestedRangeSemanticCoverageVerified: true
  incompleteRangeCount: 0
  actualVisualIntelligenceInferenceVerified: true
  semanticModelEveryTimelineFrameInspectedClaimed: false
  semanticModelExactPixelInspectionClaimed: false
  deterministicEveryFrameTechnicalQaRemainsSeparate: true
  completeTimelineCompositeReviewPassed: boolean
  deterministicAndSemanticEvidenceAgree: boolean
  canonicalEvidenceReconciled: boolean
  smallestScopeRepairRequired: boolean
  privateHumanReviewRequired: boolean
  providerCapabilityId: 'visual_intelligence'
  providerOperationId: 'visual_intelligence.inspect_edit'
  providerProfile: 'final_render_visual_qa'
  providerAdapterId: 'vertex_gemini_pro'
  providerModelId: 'gemini-3.1-pro-preview'
  thinkingLevel: 'high'
  mediaResolution: 'high'
  qwenVisualFallbackUsed: false
  reportDisposition:
    | 'pass'
    | 'pass_with_warnings'
    | 'needs_revision'
    | 'blocked'
  reportImmutable: true
  providerCallObserved: true
  accountEffectiveCostEvidenceBound: true
  rawProviderPayloadIncluded: false
  rawModelTextIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  browserLocalStateUsed: false
  directPeerDispatchAuthority: false
  providerRuntimeAuthority: false
  timelineMutationAuthority: false
  qaApprovalAuthority: false
  repairExecutionAuthority: false
  assetMutationAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export type CanonicalCaptionPostrenderVisualIntelligenceFinding = Pick<
  VisualIntelligenceFinding,
  'findingId' | 'severity' | 'recommendedOwner'
>
