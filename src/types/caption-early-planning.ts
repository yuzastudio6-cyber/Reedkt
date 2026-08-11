import type {
  CaptionDomainCanonicalScope,
  CaptionDomainClosedAuthorityBoundary,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CAPTION_EARLY_PLANNING_BUNDLE_VERSION =
  'caption-early-planning-bundle-v1' as const
export const CAPTION_STRATEGY_PLAN_VERSION = 'caption-strategy-plan-v2' as const
export const CAPTION_OPPORTUNITY_MAP_VERSION = 'caption-opportunity-map-v2' as const
export const CAPTION_INTEGRATION_CLASSIFICATION_VERSION =
  'caption-integration-classification-v2' as const
export const CAPTION_RESERVATION_PLAN_VERSION = 'caption-reservation-plan-v2' as const
export const CAPTION_BLOCKING_METADATA_VERSION = 'caption-blocking-metadata-v1' as const
export const CAPTION_APPROVAL_ENVELOPE_VERSION = 'caption-approval-envelope-v2' as const
export const CAPTION_ESTIMATE_INPUT_VERSION = 'caption-estimate-input-v1' as const
export const CAPTION_RESTRAINT_VERSION = 'caption-restraint-v1' as const

export type CaptionPlanningIntegrationClass =
  | 'late_overlay'
  | 'reserved_composition'
  | 'structural_typography'
  | 'cross_system_transform'

export type CaptionEarlyProjectMode =
  | 'accessibility_first'
  | 'clean_long_form'
  | 'dynamic_short_form'
  | 'cinematic_editorial'
  | 'educational_explainer'
  | 'multi_speaker_dialogue'
  | 'brand_directed'
  | 'minimal_support'

export interface CaptionConfirmedOutputFrameBinding {
  outputId: string
  width: number
  height: number
  aspectRatioNumerator: number
  aspectRatioDenominator: number
  confirmedOutputFrameDigestSha256: string
}

export interface CaptionEarlySafeRegionCandidate {
  regionId: string
  regionBasisPoints: { x: number; y: number; width: number; height: number }
  confidenceBasisPoints: number
  protectedRegionIds: string[]
  evidenceRef: CaptionDomainRef
}

export interface CaptionEarlySceneInput {
  sceneId: string
  planningFrameRange: CaptionDomainFrameRange
  sourcePhraseIds: string[]
  speechRole: 'none' | 'supporting' | 'primary'
  semanticImportanceBasisPoints: number
  visualDensity: 'low' | 'moderate' | 'high'
  multiTrackLikely: boolean
  depthMaskOrTrackingLikely: boolean
  requestedTreatment:
    | 'auto'
    | CaptionPlanningIntegrationClass
  crossSystemTarget:
    | 'broll'
    | 'living_frame'
    | 'map'
    | 'chart'
    | 'diagram'
    | 'transition'
    | null
  candidateSafeRegions: CaptionEarlySafeRegionCandidate[]
  reasonCodes: string[]
}

export interface CaptionEarlyPlanningInput {
  bundleId: string
  canonicalScope: CaptionDomainCanonicalScope
  captionCompositeRef: CaptionDomainRef
  compiledIntentRef: CaptionDomainRef
  professionalSkillTraceRef: CaptionDomainRef
  confirmedOutputFrame: CaptionConfirmedOutputFrameBinding
  canonicalTranscriptRef: CaptionDomainRef
  sourceSpeechEvidenceRef: CaptionDomainRef
  sourceVisualUnderstandingRef: CaptionDomainRef
  editPreferencesRef: CaptionDomainRef
  referenceDnaRef: CaptionDomainRef | null
  planningTimingBasisRef: CaptionDomainRef
  directive: {
    disposition: 'caption_design_selected' | 'no_captions'
    reasonCodes: string[]
    ownerApprovedRestraintRef: CaptionDomainRef | null
  }
  projectMode: CaptionEarlyProjectMode
  primaryLanguage: string
  requestedLanguages: string[]
  accessibleOutputKinds: Array<'srt' | 'webvtt' | 'stable_burn_in'>
  constraints: {
    allowedTypographyRoles: string[]
    maximumMotionLevel: 'none' | 'restrained' | 'moderate' | 'expressive'
    maximumHeroMoments: number
    subjectOverlapAllowed: boolean
    objectAnchoringAllowed: boolean
    captionToVisualAllowed: boolean
    captionSoundAllowed: boolean
    allowedTextTransformations: Array<
      | 'exact'
      | 'punctuation_cleanup'
      | 'filler_omission'
      | 'condensed_without_meaning_change'
      | 'translated'
      | 'paraphrase_requires_approval'
    >
    requestedMaximumCaptionCredits: number
    fallbackIds: string[]
  }
  scenes: CaptionEarlySceneInput[]
}

export interface CaptionEarlyComponentIdentity<V extends string> {
  componentId: string
  componentVersion: V
  componentDigestSha256: string
}

export interface CaptionStrategyPlanV2
  extends CaptionEarlyComponentIdentity<typeof CAPTION_STRATEGY_PLAN_VERSION> {
  projectMode: CaptionEarlyProjectMode
  approximateDensity: 'none' | 'sparse' | 'balanced' | 'dense'
  primaryLanguage: string
  requestedLanguages: string[]
  accessibleProjectionRequired: boolean
  selectedIntegrationClasses: CaptionPlanningIntegrationClass[]
  allowedTypographyRoles: string[]
  likelyHeroMomentCount: number
  likelyMaskOrTrackingNeeded: boolean
  likelyCaptionToVisualHandoffNeeded: boolean
  reasonCodes: string[]
}

export interface CaptionOpportunityMapV2
  extends CaptionEarlyComponentIdentity<typeof CAPTION_OPPORTUNITY_MAP_VERSION> {
  opportunities: Array<{
    opportunityId: string
    sceneId: string
    planningFrameRange: CaptionDomainFrameRange
    sourcePhraseIds: string[]
    semanticPurposeCode: string
    integrationClass: CaptionPlanningIntegrationClass
    confidenceBasisPoints: number
    likelyNeedsVisualEvidence: boolean
    likelyNeedsTracking: boolean
    heroCandidate: boolean
    handoffTarget: CaptionEarlySceneInput['crossSystemTarget']
  }>
}

export interface CaptionIntegrationClassificationV2
  extends CaptionEarlyComponentIdentity<
    typeof CAPTION_INTEGRATION_CLASSIFICATION_VERSION
  > {
  sceneClassifications: Array<{
    sceneId: string
    integrationClass: CaptionPlanningIntegrationClass | null
    reasonCodes: string[]
    deliberateNonUse: boolean
  }>
}

export interface CaptionReservationPlanV2
  extends CaptionEarlyComponentIdentity<typeof CAPTION_RESERVATION_PLAN_VERSION> {
  reservations: Array<{
    reservationId: string
    sceneId: string
    planningFrameRange: CaptionDomainFrameRange
    selectedRegionId: string | null
    regionBasisPoints: CaptionEarlySafeRegionCandidate['regionBasisPoints'] | null
    protectedRegionIds: string[]
    sourceVisualEvidenceRef: CaptionDomainRef | null
    priority: 'caption_primary' | 'caption_support'
    disposition: 'reserved_intent' | 'blocked_missing_safe_region'
    fallbackRegionIds: string[]
  }>
  intentOnly: true
  createsLayoutAuthority: false
  finalPlacementResolved: false
}

export interface CaptionBlockingMetadata
  extends CaptionEarlyComponentIdentity<typeof CAPTION_BLOCKING_METADATA_VERSION> {
  scenes: Array<{
    sceneId: string
    approximateTrackCount: number
    approximateDensity: 'sparse' | 'balanced' | 'dense'
    reservedRegionId: string | null
    integrationClass: CaptionPlanningIntegrationClass | null
    nonFinalLabelRequired: true
  }>
  approximateOnly: true
  renderable: false
  finalCaptionTextIncluded: false
  executableFramesIncluded: false
}

export interface CaptionApprovalEnvelopeV2
  extends CaptionEarlyComponentIdentity<typeof CAPTION_APPROVAL_ENVELOPE_VERSION> {
  selectionDisposition: 'caption_design_selected' | 'no_captions'
  allowedIntegrationClasses: CaptionPlanningIntegrationClass[]
  allowedTypographyRoles: string[]
  maximumMotionLevel: CaptionEarlyPlanningInput['constraints']['maximumMotionLevel']
  maximumHeroMoments: number
  subjectOverlapAllowed: boolean
  objectAnchoringAllowed: boolean
  captionToVisualAllowed: boolean
  captionSoundAllowed: boolean
  allowedTextTransformations: CaptionEarlyPlanningInput['constraints']['allowedTextTransformations']
  languages: string[]
  accessibleOutputKinds: CaptionEarlyPlanningInput['accessibleOutputKinds']
  requestedMaximumCaptionCredits: number
  approvedFallbackIds: string[]
  canonicalEstimateApprovalStillRequired: true
  canonicalPlanApprovalStillRequired: true
  creditReservationCreated: false
}

export type CaptionEstimateFactorCode =
  | 'transcription'
  | 'alignment'
  | 'diarization'
  | 'visual_evidence'
  | 'mask_tracking'
  | 'custom_fonts'
  | 'output_count'
  | 'languages'
  | 'spatial_scenes'
  | 'hero_typography'
  | 'cross_system_handoffs'
  | 'sound'
  | 'render_complexity'
  | 'visual_qa'
  | 'revisions'

export interface CaptionEstimateInput
  extends CaptionEarlyComponentIdentity<typeof CAPTION_ESTIMATE_INPUT_VERSION> {
  factors: Array<{
    factorCode: CaptionEstimateFactorCode
    quantity: number
    complexity: 'low' | 'moderate' | 'high'
    reasonCodes: string[]
  }>
  lowerCostFallbackIds: string[]
  priceCalculated: false
  creditsReserved: false
  billingAuthorityClaimed: false
}

export interface CaptionRestraint
  extends CaptionEarlyComponentIdentity<typeof CAPTION_RESTRAINT_VERSION> {
  restraint: 'no_captions' | 'none'
  reasonCodes: string[]
  ownerApprovedRestraintRef: CaptionDomainRef | null
  captionWorkAllowed: boolean
}

export interface CaptionEarlyPlanningBundle {
  schemaVersion: typeof CAPTION_EARLY_PLANNING_BUNDLE_VERSION
  bundleId: string
  bundleDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  confirmedOutputFrame: CaptionConfirmedOutputFrameBinding
  inputRefs: CaptionDomainRef[]
  strategyPlan: CaptionStrategyPlanV2
  opportunityMap: CaptionOpportunityMapV2
  integrationClassification: CaptionIntegrationClassificationV2
  reservationPlan: CaptionReservationPlanV2
  blockingMetadata: CaptionBlockingMetadata
  approvalEnvelope: CaptionApprovalEnvelopeV2
  estimateInput: CaptionEstimateInput
  restraint: CaptionRestraint
  lifecycleState:
    | 'early_planned'
    | 'reserved'
    | 'blocked_needs_visual_support'
    | 'restrained_no_captions'
  supportRequirementCodes: string[]
  rawChatIncluded: false
  mediaBytesIncluded: false
  privateArtifact: true
  byteFree: true
  authorityBoundary: CaptionDomainClosedAuthorityBoundary
}
