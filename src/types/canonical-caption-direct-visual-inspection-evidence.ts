import type { CaptionDomainRef } from './caption-domain-contracts'

export const CANONICAL_CAPTION_DIRECT_VISUAL_INSPECTION_EVIDENCE_VERSION =
  'canonical-caption-direct-visual-inspection-evidence-v1' as const
export const CANONICAL_CAPTION_DIRECT_VISUAL_INSPECTION_REPOSITORY_VERSION =
  'canonical-caption-direct-visual-inspection-repository-v1' as const

/**
 * Caption-owned professional-appearance evidence for one exact approved
 * rendered output. This is intentionally separate from deterministic QA,
 * shared postrender model review, and independent final QA.
 */
export interface CanonicalCaptionDirectVisualInspectionEvidence {
  schemaVersion:
    typeof CANONICAL_CAPTION_DIRECT_VISUAL_INSPECTION_EVIDENCE_VERSION
  evidenceId: string
  evidenceDigestSha256: string
  observedAt: string
  canonicalScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    planVersionId: string
    approvedSnapshotRef: CaptionDomainRef
    executionPackageRef: CaptionDomainRef
    outputId: string
  }
  confirmedOutputFrameRef: CaptionDomainRef
  renderedArtifactRef: CaptionDomainRef
  deterministicQaRef: CaptionDomainRef
  sourceMediaAuthorityRef: CaptionDomainRef
  sourceMediaBindingRefs: CaptionDomainRef[]
  inspectionArtifactSetRef: CaptionDomainRef
  coverage: {
    renderedFrameCount: number
    representedFrameCount: number
    contactSheetCount: number
    originalResolutionSpotCheckCount: number
    everyRenderedFrameRepresentedExactlyOnce: true
    contactSheetCoverageComplete: true
    originalResolutionTransitionAndTailChecksComplete: true
    completeMotionPlaybackClaimed: false
  }
  findings: {
    faceObstructionObserved: false
    gestureObstructionObserved: false
    captionClippingObserved: false
    phraseOverflowObserved: false
    inaccessibleReadingStateObserved: false
    importantSourceTextCollisionObserved: false
    unstablePlacementObserved: false
    unusableCueTransitionObserved: false
    tailTruncationObserved: false
    unprofessionalVisualTreatmentObserved: false
  }
  inspectionMethod:
    'every_rendered_frame_contact_sheets_plus_original_resolution_checks_v1'
  inspectorClass: 'codex_agent_direct_visual_inspection'
  disposition: 'passed_caption_owned_professional_appearance'
  realUploadedSourcePixelsInspected: true
  syntheticEngineeringFixtureUsed: false
  acceptedForCaptionOwnedProfessionalAppearance: true
  exactApprovedRenderAndSourceAuthorityBound: true
  deterministicTechnicalQaReplaced: false
  sharedPostrenderModelReviewClaimed: false
  independentFinalQaClaimed: false
  browserLocalCompletionClaimed: false
  mediaBytesSerialized: false
  localPathsOrUrlsSerialized: false
  rawChatOrCredentialsSerialized: false
  providerCallMadeByCaption: false
  operationDispatchAuthorityGranted: false
  repairExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionDirectVisualInspectionRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_DIRECT_VISUAL_INSPECTION_REPOSITORY_VERSION
  persistEvidenceCreateOnly(input: {
    readonly evidence: CanonicalCaptionDirectVisualInspectionEvidence
  }): Promise<'created' | 'identical_replay'>
  rereadEvidence(input: {
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly approvedSnapshotRef: CaptionDomainRef
    readonly outputId: string
    readonly renderedArtifactRef: CaptionDomainRef
  }): Promise<CanonicalCaptionDirectVisualInspectionEvidence | null>
}
