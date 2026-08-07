import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type {
  SkillClosedAuthorityBoundary,
  SkillContractRef,
  SkillSupportTarget,
} from './orchestra-skill-contracts'

export const CAPTION_CROSS_SYSTEM_OUTBOUND_PAYLOAD_VERSION =
  'caption-cross-system-outbound-payload-v2' as const
export const CAPTION_CROSS_SYSTEM_HANDOFF_VERSION_V2 =
  'caption-cross-system-handoff-v2' as const
export const CAPTION_INCOMING_TYPOGRAPHY_REQUEST_VERSION =
  'caption-incoming-typography-request-v1' as const
export const CAPTION_CROSS_SYSTEM_COORDINATION_PLAN_VERSION =
  'caption-cross-system-coordination-plan-v1' as const

export type CaptionCrossSystemReceiverV2 =
  | 'living_frame'
  | 'transitions'
  | 'graphic'
  | 'map'
  | 'chart'
  | 'diagram'
  | 'broll_owner'
  | 'stroke_motion'

export type CaptionCrossSystemReceiverSkillIdV2 =
  | 'motion.living_frame_storytelling'
  | 'motion.transition_language'
  | 'graphics.visual_explain_layer'
  | 'graphics.map_route_visual'
  | 'graphics.chart_or_data_visual'
  | 'dataviz.diagram_layout'
  | 'b_roll'
  | 'motion.stroke_motion_storytelling'

export type CaptionCrossSystemHandoffKindV2 =
  | 'caption_to_living_frame'
  | 'caption_to_transition'
  | 'caption_to_graphic'
  | 'caption_to_map'
  | 'caption_to_chart'
  | 'caption_to_diagram'
  | 'caption_to_broll_constraints'
  | 'caption_to_motion_support'

export interface CaptionCrossSystemOutboundPayloadV2 {
  schemaVersion: typeof CAPTION_CROSS_SYSTEM_OUTBOUND_PAYLOAD_VERSION
  payloadId: string
  payloadDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  originCaptionCallRef: SkillContractRef
  receiver: CaptionCrossSystemReceiverV2
  receiverSkillId: CaptionCrossSystemReceiverSkillIdV2
  handoffKind: CaptionCrossSystemHandoffKindV2
  sourceCaptionPlanRef: CaptionDomainRef
  sourceCaptionSceneGraphRef: CaptionDomainRef
  sourceCaptionMotionPlanRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  sourceNodeId: string
  sourcePhraseId: string
  exactSourceWordIds: string[]
  authorizedRange: CaptionDomainFrameRange
  handoffFrameRequirement: {
    handoffEventRef: CaptionDomainRef
    holdEventRef: CaptionDomainRef
    restoreEventRef: CaptionDomainRef
    framesResolvedByStoryTiming: true
    captionManufacturedReceiverFrames: false
  }
  semantic: {
    conceptId: string
    purposeCode: string
    visualVerbCode: string
    sourceTruthPolicy:
      | 'canonical_transcript_lineage'
      | 'documentary_fact_safe'
      | 'exact_data_source_required'
      | 'exact_geography_source_required'
      | 'exact_selected_media_required'
  }
  requestedReceivingCapability: {
    capabilityCode: string
    expectedArtifactTypes: string[]
    receiverOwnsExecution: true
  }
  expectedVisualResultCode: string
  informationOwnership: {
    ownerBeforeHandoff: 'captions'
    transferRequested: boolean
    ownerAfterAcceptedHandoff:
      | 'captions'
      | CaptionCrossSystemReceiverSkillIdV2
    captionRetainsCompleteAccessibleProjection: true
    duplicateInformationAfterAcceptedTransferAllowed: false
    captionRegainsInformationOwnershipOnFailure: true
  }
  soundIntent: {
    policy: 'sound_forbidden' | 'sound_optional' | 'sound_required'
    captionSoundRequestRef: CaptionDomainRef | null
    soundOwnerRemainsExternal: true
  }
  accessibility: {
    counterpartNodeIds: string[]
    completeWordingPreserved: true
    remainsAvailableDuringHandoff: true
    reducedMotionMeaningPreserved: true
  }
  fallback: {
    ladderCodes: string[]
    selectedDefaultCode: string
    restoreCreativeCaption: boolean
    preserveAccessibleCaption: true
  }
  requiredEvidence: {
    artifactTypes: string[]
    qaCodes: string[]
    exactReceiverResultMustBeInjected: true
  }
  returnToHq: {
    hqMediated: true
    dispositionBeforeReceiverResult: 'needs_followup'
    receiverResultMustBeInjected: true
    directPeerDispatchAllowed: false
    scopeExpansionAllowed: false
  }
  sharedTargetAdmission: {
    state: 'admitted_generic_v1' | 'pending_future_orchestra_target'
    targetSkillKey: SkillSupportTarget | null
  }
  privateArtifactPolicy: {
    tenantScoped: true
    byteFreeCoordinationOnly: true
    rawChatIncluded: false
    mediaBytesIncluded: false
    urlsOrPathsIncluded: false
    credentialsIncluded: false
    executablePromptOrCodeIncluded: false
  }
  authorityBoundary: SkillClosedAuthorityBoundary
}

/**
 * Immutable coordination receipt for an outbound payload. The payload is the
 * typed future-Orchestra artifact; the optional support-request reference is
 * present only where the current neutral target registry can name the owner.
 */
export interface CaptionCrossSystemHandoffV2 {
  schemaVersion: typeof CAPTION_CROSS_SYSTEM_HANDOFF_VERSION_V2
  handoffId: string
  handoffDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  receiver: CaptionCrossSystemReceiverV2
  receiverSkillId: CaptionCrossSystemReceiverSkillIdV2
  handoffKind: CaptionCrossSystemHandoffKindV2
  outboundPayloadRef: CaptionDomainRef
  supportRequestRef: SkillContractRef | null
  frozenCompatibilityHandoffRef: CaptionDomainRef | null
  coordinationState:
    | 'support_request_ready'
    | 'awaiting_shared_target_registry'
  receiverExecutionClaimed: false
  captionExecutedReceiverWork: false
  directPeerDispatchGranted: false
  timelineMutationGranted: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export type CaptionIncomingTypographyRequester =
  | 'living_frame'
  | 'transitions'

export interface CaptionIncomingTypographyRequest {
  schemaVersion: typeof CAPTION_INCOMING_TYPOGRAPHY_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  requester: CaptionIncomingTypographyRequester
  requesterSkillId:
    | 'motion.living_frame_storytelling'
    | 'motion.transition_language'
  requesterOriginCallRef: SkillContractRef
  requestedCaptionJobType:
    | 'provide_speech_derived_typography_spec'
    | 'provide_typographic_transition_component'
  expectedCaptionArtifactType:
    | 'caption_speech_derived_typography_spec'
    | 'caption_typographic_transition_component'
  sourceCaptionPlanRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  sourceNodeId: string
  sourcePhraseId: string
  exactSourceWordIds: string[]
  authorizedRange: CaptionDomainFrameRange
  requestedTypographyRoleCode: string
  semanticPurposeCode: string
  continuityToken: string
  requestedEventRefs: CaptionDomainRef[]
  informationOwnership: {
    captionsOwnsTypographySpecification: true
    requesterOwnsExternalDomainExecution: true
    requesterMayNotMutateCaptionPlan: true
    noInformationOwnershipTransferInferred: true
  }
  accessibility: {
    completeWordingRequired: true
    accessibleCounterpartRequired: true
    reducedMotionCounterpartRequired: true
  }
  requiredEvidenceTypes: string[]
  returnToHq: {
    hqMediated: true
    captionResultMustReturnToRequesterThroughHq: true
    directPeerResponseAllowed: false
  }
  privateArtifactPolicy: {
    tenantScoped: true
    byteFreeCoordinationOnly: true
    rawChatIncluded: false
    mediaBytesIncluded: false
    urlsOrPathsIncluded: false
    credentialsIncluded: false
    executablePromptOrCodeIncluded: false
  }
  authorityBoundary: SkillClosedAuthorityBoundary
}

export interface CaptionCrossSystemCoordinationPlan {
  schemaVersion: typeof CAPTION_CROSS_SYSTEM_COORDINATION_PLAN_VERSION
  planId: string
  planDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sourceCaptionPlanRef: CaptionDomainRef
  sourceMotionPlanRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  outboundHandoffRefs: CaptionDomainRef[]
  outboundPayloadRefs: CaptionDomainRef[]
  outboundSupportRequestRefs: SkillContractRef[]
  incomingTypographyRequestRefs: CaptionDomainRef[]
  incomingSupportRequestRefs: SkillContractRef[]
  receiverCoverage: CaptionCrossSystemReceiverV2[]
  pendingSharedTargetReceivers: CaptionCrossSystemReceiverV2[]
  counts: {
    outboundHandoffs: number
    admittedOutboundSupportRequests: number
    pendingSharedTargetRegistrations: number
    incomingTypographyRequests: number
  }
  exactOneToOneArtifactLineageVerified: true
  captionOwnedHandoffSurfaceComplete: true
  futureOrchestraTargetRegistryComplete: boolean
  centralOrchestraImplemented: false
  directPeerDispatchAdded: false
  receiverExecutionClaimed: false
  timelineMutationGranted: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
