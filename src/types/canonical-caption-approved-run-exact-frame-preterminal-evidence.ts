import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CANONICAL_CAPTION_APPROVED_RUN_EXACT_FRAME_PRETERMINAL_EVIDENCE_VERSION =
  'canonical-caption-approved-run-exact-frame-preterminal-evidence-v1' as const
export const CANONICAL_CAPTION_APPROVED_RUN_EXACT_FRAME_PRETERMINAL_REPOSITORY_VERSION =
  'canonical-caption-approved-run-exact-frame-preterminal-repository-v1' as const

export type CanonicalCaptionApprovedRunExactFrameVariant =
  | 'full_motion'
  | 'reduced_motion'

export interface CanonicalCaptionApprovedRunExactFramePreterminalOutput {
  variant: CanonicalCaptionApprovedRunExactFrameVariant
  exactFrameReviewRef: CaptionDomainRef
  renderedArtifactRef: CaptionDomainRef
  everyFrameContactSheetRef: CaptionDomainRef
  exactResolutionRasterRefs: [
    CaptionDomainRef,
    CaptionDomainRef,
    CaptionDomainRef,
    CaptionDomainRef,
    CaptionDomainRef,
  ]
  transitionRasterRefs: [
    CaptionDomainRef,
    CaptionDomainRef,
    CaptionDomainRef,
    CaptionDomainRef,
  ]
  width: 3840
  height: 2160
  fps: 30
  frameCount: 127
  everyRenderedFrameRepresentedExactlyOnce: true
  originalResolutionEntranceHoldTransitionAndTailChecksComplete: true
}

/**
 * Immutable evidence for the exact V14 approved Caption + B-roll run.
 *
 * This record deliberately stops before terminal qualification. It proves the
 * accepted Caption typography/layout inspection on the confirmed 4K frame,
 * while preserving the disclosed 640x360 source-proxy and missing shared
 * postrender/final-QA gates as explicit false claims.
 */
export interface CanonicalCaptionApprovedRunExactFramePreterminalEvidence {
  schemaVersion:
    typeof CANONICAL_CAPTION_APPROVED_RUN_EXACT_FRAME_PRETERMINAL_EVIDENCE_VERSION
  evidenceId: string
  evidenceDigestSha256: string
  observedAt: string
  canonicalScope: CaptionDomainCanonicalScope & {
    approvedSnapshotRef: CaptionDomainRef
    sceneId: string
  }
  approvedRunInspectionPackageRef: CaptionDomainRef
  exactFrameInspectionReceiptRef: CaptionDomainRef
  exactFrameInspectionPackageRef: CaptionDomainRef
  sourceProxyReviewPackageRef: CaptionDomainRef
  approvedSnapshotRef: CaptionDomainRef
  executionPackageRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  sourceMediaRef: CaptionDomainRef
  baselinePreviewRef: CaptionDomainRef
  outputs: [
    CanonicalCaptionApprovedRunExactFramePreterminalOutput & {
      variant: 'full_motion'
    },
    CanonicalCaptionApprovedRunExactFramePreterminalOutput & {
      variant: 'reduced_motion'
    },
  ]
  approvedRunCoverage: {
    approvedCaptionJobCount: 17
    captionSupportResumeCount: 1
    approvedBrollWorkItemCount: 13
    canonicalCaptionReplayVerified: true
    canonicalBrollRestartReplayVerified: true
    exactFrameVariantCount: 2
    exactFrameRenderedFrameCount: 254
    exactFrameEveryFrameInspectionComplete: true
    exactFrameOriginalResolutionSpotChecksComplete: true
    fullReducedMotionSemanticParityInspected: true
  }
  evidenceClass:
    'approved_run_exact_frame_typography_layout_preterminal'
  disposition: 'accepted_preterminal_evidence'
  firstRemainingGateCode:
    'postrender_visual_intelligence_evidence_missing'
  acceptedForCaptionOwnedExactFrameTypographyAndLayout: true
  sameApprovedSnapshotExecutionPackageOutputAndSourceBound: true
  sourceProxyUpscaleDisclosed: true
  sourcePictureQualityQualified: false
  completeMotionPlaybackInspectionPerformed: false
  finalCustomerCanvasClaimed: false
  terminalRunEvidenceEligible: false
  wholeSkillPrivateInternalQualificationClaimed: false
  qualifiedSharedPostrenderAiReviewClaimed: false
  independentFinalQaClaimed: false
  terminalEvidenceAssemblySatisfied: false
  callerSuppliedCompletionAccepted: false
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

export interface CanonicalCaptionApprovedRunExactFramePreterminalRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_APPROVED_RUN_EXACT_FRAME_PRETERMINAL_REPOSITORY_VERSION
  persistEvidenceCreateOnly(input: {
    readonly evidence:
      CanonicalCaptionApprovedRunExactFramePreterminalEvidence
  }): Promise<'created' | 'identical_replay'>
  rereadEvidence(input: {
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly approvedSnapshotRef: CaptionDomainRef
    readonly outputId: string
    readonly exactFrameInspectionReceiptRef: CaptionDomainRef
  }): Promise<CanonicalCaptionApprovedRunExactFramePreterminalEvidence | null>
}
