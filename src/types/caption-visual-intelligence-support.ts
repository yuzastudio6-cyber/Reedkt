import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type {
  SkillContractRef,
  SkillSupportRequest,
} from './orchestra-skill-contracts'
import type {
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceOperation,
  VisualIntelligenceProfile,
} from './visual-intelligence'

export const CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION =
  'caption-visual-intelligence-support-payload-v1' as const
export const CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_PACKET_VERSION =
  'caption-visual-intelligence-evidence-packet-v1' as const
export const CAPTION_VISUAL_OCCUPANCY_MANIFEST_VERSION =
  'caption-visual-occupancy-manifest-v1' as const
export const CAPTION_FINAL_VISUAL_HIERARCHY_VERSION =
  'caption-final-visual-hierarchy-v1' as const

export type CaptionVisualSupportPurpose =
  | 'final_frame_occupancy'
  | 'rendered_caption_inspection'

export type CaptionVisualObservationRole =
  | 'safe_candidate'
  | 'face'
  | 'eyes'
  | 'mouth'
  | 'hair'
  | 'hand'
  | 'gesture'
  | 'speaker'
  | 'product'
  | 'important_object'
  | 'screen_text'
  | 'map_label'
  | 'chart_label'
  | 'browser_highlight'
  | 'lower_third'
  | 'fact_safety_note'
  | 'cta'
  | 'broll_panel'
  | 'living_frame'
  | 'platform_ui'
  | 'crop_risk'

export interface CaptionBasisPointRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CaptionVisualIntelligenceSupportPayload {
  schemaVersion: typeof CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION
  payloadId: string
  payloadDigestSha256: string
  purpose: CaptionVisualSupportPurpose
  canonicalScope: CaptionDomainCanonicalScope
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
  confirmedOutputFrame: {
    outputId: string
    width: number
    height: number
    aspectRatioNumerator: number
    aspectRatioDenominator: number
    fpsNumerator: number
    fpsDenominator: number
    confirmedOutputFrameDigestSha256: string
  }
  sourcePrivateArtifactRef: CaptionDomainRef
  canonicalLayoutOccupancyRef: CaptionDomainRef
  requestedSceneId: string
  requestedRange: CaptionDomainFrameRange
  requiredObservationRoles: CaptionVisualObservationRole[]
  expectedOutcomeRefs: CaptionDomainRef[]
  expectedVisualIntelligenceOperation: VisualIntelligenceOperation
  expectedVisualIntelligenceProfile: VisualIntelligenceProfile
  coveragePolicy: {
    completeRequestedRangeRequired: true
    everyTimelineFrameInspectionClaimRequired: false
    completeTimePixelInspectionClaimRequired: false
    targetedFollowupRangesAllowed: true
  }
  renderedInspectionPolicy: {
    actualRenderedPixelsRequired: boolean
    directRasterInspectionStillRequired: true
    deterministicQaStillRequired: true
    independentFinalQaStillRequired: true
  }
  byteFreeRequest: true
  rawChatIncluded: false
  mediaBytesIncluded: false
  mediaLocatorIncluded: false
  providerPromptIncluded: false
  providerCredentialIncluded: false
  providerOrModelSelectedByCaption: false
  directPeerDispatchRequested: false
  visualIntelligenceRemainsEvidenceOwner: true
}

export interface CaptionVisualEvidenceObservation {
  observationId: string
  sceneId: string
  frameRange: CaptionDomainFrameRange
  role: CaptionVisualObservationRole
  regionBasisPoints: CaptionBasisPointRect
  confidenceBasisPoints: number
  temporalStabilityBasisPoints: number
  measuredContrastRatioMilli: number | null
  clutterBasisPoints: number
  cropResilienceBasisPoints: number
  compositionBalanceBasisPoints: number
  findingIds: string[]
  evidenceRefs: VisualIntelligenceEvidenceRef[]
  uncertaintyCode: string | null
}

export interface CaptionVisualIntelligenceEvidencePacket {
  schemaVersion: typeof CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_PACKET_VERSION
  packetId: string
  packetDigestSha256: string
  supportRequestRef: SkillContractRef
  supportPayloadRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  purpose: CaptionVisualSupportPurpose
  sourcePrivateArtifactRef: CaptionDomainRef
  canonicalLayoutOccupancyRef: CaptionDomainRef
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
  confirmedOutputFrameDigestSha256: string
  requestedSceneId: string
  requestedRange: CaptionDomainFrameRange
  visualIntelligenceContractVersion: 'visual-intelligence-contract-v1'
  visualIntelligenceReportRef: VisualIntelligenceEvidenceRef
  authenticatedReadResultRef: CaptionDomainRef | null
  reportOperation: VisualIntelligenceOperation
  reportProfile: VisualIntelligenceProfile
  reportDisposition: 'pass' | 'pass_with_warnings' | 'needs_revision' | 'blocked'
  coverage: {
    requestedRange: CaptionDomainFrameRange
    analyzedRanges: CaptionDomainFrameRange[]
    incompleteRanges: CaptionDomainFrameRange[]
    targetedFollowupRanges: CaptionDomainFrameRange[]
    completeRequestedRangeCoverage: boolean
    everyTimelineFrameInspected: false
    completeTimePixelInspectionClaimAllowed: false
  }
  observations: CaptionVisualEvidenceObservation[]
  findingIds: string[]
  evidenceMode: 'contract_fixture' | 'authenticated_private_runtime'
  canonicalReportRereadVerified: boolean
  exactCanonicalScopeVerified: boolean
  actualVisualInferenceObserved: boolean
  actualRenderedPixelsInspected: boolean
  immutableReportReread: boolean
  browserLocalStateUsed: false
  rawProviderPayloadIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  providerCallMadeByCaption: false
  visualIntelligenceMutatedEdit: false
  visualIntelligenceGrantedFinalQa: false
  runtimeAuthorityGrantedToCaption: false
  assetAuthorityGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionVisualOccupancyRegion {
  regionId: string
  sceneId: string
  frameRange: CaptionDomainFrameRange
  role: CaptionVisualObservationRole
  regionBasisPoints: CaptionBasisPointRect
  confidenceBasisPoints: number
  temporalStabilityBasisPoints: number
  measuredContrastRatioMilli: number | null
  clutterBasisPoints: number
  cropResilienceBasisPoints: number
  compositionBalanceBasisPoints: number
  uncertaintyCode: string | null
  protected: boolean
  overlapsProtectedRegionIds: string[]
  candidateScoreBasisPoints: number | null
  selectableForStableCaption: boolean
  sourceObservationId: string
  evidenceRefs: VisualIntelligenceEvidenceRef[]
}

export interface CaptionVisualOccupancyManifest {
  schemaVersion: typeof CAPTION_VISUAL_OCCUPANCY_MANIFEST_VERSION
  manifestId: string
  manifestDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
  canonicalLayoutOccupancyRef: CaptionDomainRef
  supportRequestRef: SkillContractRef
  visualEvidencePacketRef: CaptionDomainRef
  visualIntelligenceReportRef: VisualIntelligenceEvidenceRef
  requestedSceneId: string
  requestedRange: CaptionDomainFrameRange
  regions: CaptionVisualOccupancyRegion[]
  protectedRegionIds: string[]
  safeCandidateRegionIds: string[]
  provisionalSelectedCandidateRegionId: string | null
  provisionalFallbackCandidateRegionIds: string[]
  sourceEvidenceMode: CaptionVisualIntelligenceEvidencePacket['evidenceMode']
  sourceReportDisposition: CaptionVisualIntelligenceEvidencePacket['reportDisposition']
  sourceCanonicalReportRereadVerified: boolean
  sourceExactCanonicalScopeVerified: boolean
  sourceImmutableReportReread: boolean
  sourceCompleteRequestedRangeCoverage: boolean
  evidenceQualifiedForPrivateRuntime: boolean
  lateFinalVisualHierarchyAllowed: boolean
  blockerCodes: string[]
  captionProjectionOnly: true
  visualIntelligenceRemainsEvidenceOwner: true
  canonicalLayoutOwnerRetained: true
  captionLayoutAuthorityClaimed: false
  maskOrTrackingAuthorityClaimed: false
  finalQaApprovalClaimed: false
  finalRenderAuthorityClaimed: false
  productionAuthorityClaimed: false
}

export interface CaptionFinalVisualHierarchy {
  schemaVersion: typeof CAPTION_FINAL_VISUAL_HIERARCHY_VERSION
  hierarchyId: string
  hierarchyDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  occupancyManifestRef: CaptionDomainRef
  requestedSceneId: string
  qualificationState: 'ready' | 'blocked_visual_runtime_evidence' | 'blocked_no_safe_region'
  accessibleCaptionRegionId: string | null
  creativeCaptionRegionId: string | null
  fallbackRegionIds: string[]
  layerOrderBottomToTop: Array<
    | 'base_video'
    | 'living_frame'
    | 'broll_or_graphics'
    | 'foreground_subject_mask'
    | 'creative_caption'
    | 'accessible_caption'
  >
  captionAboveLivingFrameByDefault: true
  accessibleCaptionAboveAllVisuals: true
  nonTopPlaneCreativeCaptionAdmitted: false
  trackAllEvidenceRequiredForNonTopPlane: true
  storyTimingStillRequiredForExecutablePlacement: true
  finalPlacementClaimed: false
  finalQaApprovalClaimed: false
  finalCanvasAuthorityClaimed: false
  productionAuthorityClaimed: false
}

export interface CaptionVisualSupportBundle {
  payload: CaptionVisualIntelligenceSupportPayload
  supportRequest: SkillSupportRequest
}
