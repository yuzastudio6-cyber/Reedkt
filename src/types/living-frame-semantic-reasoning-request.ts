import type {
  LivingFrameActivationDecision,
  LivingFrameActivationRole,
  LivingFrameAlphaSourceExpectation,
  LivingFrameAttentionEventType,
  LivingFrameAttentionMethod,
  LivingFrameAttentionTarget,
  LivingFrameCapabilityKey,
  LivingFrameComponentRole,
  LivingFrameDepthBand,
  LivingFrameDuckingExpectation,
  LivingFrameFactualScaleGuard,
  LivingFrameFocalRole,
  LivingFrameImportance,
  LivingFrameIntensity,
  LivingFrameMiniSkillKey,
  LivingFrameMode,
  LivingFrameNarrativePurposeCode,
  LivingFrameNarrationProtection,
  LivingFrameProvenanceExpectation,
  LivingFrameQaCode,
  LivingFrameReasonCode,
  LivingFrameSemanticCueCode,
  LivingFrameSemanticScaleMeaning,
  LivingFrameSemanticScaleMode,
  LivingFrameSoundPriority,
  LivingFrameSoundPurpose,
  LivingFrameSourceTruthMode,
  LivingFrameTimingPhase,
  LivingFrameTransparencyExpectation,
  LivingFrameVisualVerb,
  LivingFrameFallbackStep,
} from './living-frame'
import type {
  LivingFramePreapprovalWorkflowContext,
} from './living-frame-preapproval-input-authority'

export const LIVING_FRAME_SEMANTIC_REASONING_REQUEST_VERSION =
  'living-frame-semantic-reasoning-request-v2' as const
export const LIVING_FRAME_SEMANTIC_REASONING_REQUEST_SOURCE =
  'living_frame_semantic_reasoning_request_controlled_source_contract' as const
export const LIVING_FRAME_SEMANTIC_REASONING_REQUEST_STATUS =
  'controlled_payload_candidate' as const
export const LIVING_FRAME_SEMANTIC_REASONING_REQUEST_EVIDENCE_CLASS =
  'controlled_non_promotable_semantic_request' as const
export const LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_SCHEMA_VERSION =
  'living-frame-semantic-scene-proposal-schema-v1' as const
export const LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_RESULT_VERSION =
  'living-frame-semantic-scene-proposal-result-v1' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_SEMANTIC_REQUEST_INTENT_SIGNALS = [
  'explicit_living_frame_request',
  'explanatory_visualization_requested',
  'selective_still_animation_requested',
  'visuals_around_speaker_requested',
  'preserve_speaker_presence',
  'deterministic_first_requested',
] as const
export type LivingFrameSemanticRequestIntentSignal =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_INTENT_SIGNALS>

export const LIVING_FRAME_SEMANTIC_REQUEST_RESTRAINT_SIGNALS = [
  'no_animation_requested',
  'no_extra_visuals_requested',
  'minimal_visuals_requested',
  'talking_head_only_requested',
  'emotional_face_priority',
  'source_truth_requires_restraint',
] as const
export type LivingFrameSemanticRequestRestraintSignal =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_RESTRAINT_SIGNALS>

export const LIVING_FRAME_SEMANTIC_REQUEST_CONSTRAINT_KINDS = [
  'narrative_priority',
  'source_truth',
  'visual_restraint',
  'speaker_protection',
  'caption_protection',
  'gesture_protection',
  'factual_accuracy',
  'alpha_integrity',
  'continuity',
  'semantic_scale_truth',
  'narration_protection',
  'generation_restraint',
] as const
export type LivingFrameSemanticRequestConstraintKind =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_CONSTRAINT_KINDS>

export const LIVING_FRAME_SEMANTIC_REQUEST_CONSTRAINT_PRIORITIES = [
  'primary',
  'required',
  'supporting',
  'restraint',
] as const
export type LivingFrameSemanticRequestConstraintPriority =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_CONSTRAINT_PRIORITIES>

export const LIVING_FRAME_SEMANTIC_REQUEST_VISUAL_CATEGORIES = [
  'scene',
  'object',
  'person',
  'action',
  'camera_motion',
  'visible_text',
  'layout',
  'continuity',
  'broll_opportunity',
  'visual_risk',
  'color_or_lighting',
] as const
export type LivingFrameSemanticRequestVisualCategory =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_VISUAL_CATEGORIES>

export const LIVING_FRAME_SEMANTIC_REQUEST_SPEAKER_STATES = [
  'present',
  'not_present',
  'unknown',
] as const
export type LivingFrameSemanticRequestSpeakerState =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_SPEAKER_STATES>

export const LIVING_FRAME_SEMANTIC_REQUEST_SAFE_SPACE_STATES = [
  'candidate_safe_space_observed',
  'no_safe_space_observed',
  'future_canonical_revalidation_required',
] as const
export type LivingFrameSemanticRequestSafeSpaceState =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_SAFE_SPACE_STATES>

export const LIVING_FRAME_SEMANTIC_REQUEST_SOURCE_MODES = [
  'uploaded_media',
  'idea_first_no_uploaded_media',
] as const
export type LivingFrameSemanticRequestSourceMode =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_SOURCE_MODES>

export const LIVING_FRAME_SEMANTIC_REQUEST_SPEECH_STATES = [
  'generic_source_speech_evidence_required',
  'not_applicable_no_source_speech',
] as const
export type LivingFrameSemanticRequestSpeechState =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_SPEECH_STATES>

export const LIVING_FRAME_SEMANTIC_REQUEST_BLOCKING_REASON_CODES = [
  'generic_source_speech_evidence_required',
  'shared_route_data_assurance_required',
] as const
export type LivingFrameSemanticRequestBlockingReasonCode =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_BLOCKING_REASON_CODES>

export const LIVING_FRAME_SEMANTIC_REQUEST_EVIDENCE_KINDS = [
  'source_visual_observation',
  'canonical_idea_first_context',
] as const
export type LivingFrameSemanticRequestEvidenceKind =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_EVIDENCE_KINDS>

export const LIVING_FRAME_SEMANTIC_REQUEST_DECISION_KINDS = [
  'semantic_candidate',
  'rejected_candidate',
  'deliberate_non_use',
  'blocked',
] as const
export type LivingFrameSemanticRequestDecisionKind =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_DECISION_KINDS>

export const LIVING_FRAME_SEMANTIC_REQUEST_VALIDATION_ISSUE_CODES = [
  'non_json_input',
  'forbidden_key',
  'unsafe_text',
  'schema_rejected',
  'digest_mismatch',
  'semantic_payload_digest_mismatch',
  'output_schema_digest_mismatch',
  'authority_digest_not_separated',
  'duplicate_id',
  'duplicate_order',
  'dangling_reference',
  'semantic_order_invalid',
  'source_mode_invalid',
  'speech_evidence_required',
  'route_data_assurance_required',
  'provider_envelope_must_be_unbound',
  'restraint_precedence_invalid',
  'authority_boundary_invalid',
  'crypto_unavailable',
  'digest_calculation_failed',
] as const
export type LivingFrameSemanticRequestValidationIssueCode =
  ValueOf<typeof LIVING_FRAME_SEMANTIC_REQUEST_VALIDATION_ISSUE_CODES>

export interface LivingFrameSemanticRequestAuthorityBoundary {
  readonly controlledSourceContractOnly: true
  readonly liveEvidenceAuthority: false
  readonly sourceSpeechEvidenceAuthority: false
  readonly routeDataAssuranceAuthority: false
  readonly providerEnvelopeAuthority: false
  readonly reasoningRunAuthority: false
  readonly reasoningResultAuthority: false
  readonly providerTransportAuthority: false
  readonly providerCallAuthority: false
  readonly providerCredentialAuthority: false
  readonly providerAttemptReceiptAuthority: false
  readonly providerAttemptCostAuthority: false
  readonly selectedSceneAuthority: false
  readonly componentPlanAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly creditReservationAuthority: false
  readonly walletAuthority: false
  readonly serviceFeeAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly toolRouteAuthority: false
  readonly mediaGenerationAuthority: false
  readonly renderAuthority: false
  readonly exportAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFrameSemanticRequestCanonicalBindings {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly handoffId: string
  readonly preapprovalInputAuthorityDigestSha256: string
  readonly visualEvidenceBindingDigestSha256: string
}

export interface LivingFrameSemanticRequestSourceVisualEvidenceReference {
  readonly evidenceRefId: string
  readonly kind: 'source_visual_observation'
  readonly sourceSequenceItemId: string
  readonly observationId: string
  readonly category: LivingFrameSemanticRequestVisualCategory
  readonly derivedObservationSummary: string
  readonly confidenceBasisPoints: number
}

export interface LivingFrameSemanticRequestIdeaFirstEvidenceReference {
  readonly evidenceRefId: string
  readonly kind: 'canonical_idea_first_context'
  readonly ideaFirstAuthorityDigestSha256: string
  readonly derivedContextSummary: string
}

export type LivingFrameSemanticRequestEvidenceReference =
  | LivingFrameSemanticRequestSourceVisualEvidenceReference
  | LivingFrameSemanticRequestIdeaFirstEvidenceReference

export interface LivingFrameSemanticRequestSpeechExpectation {
  readonly sourceContainsSpeech: boolean
  readonly state: LivingFrameSemanticRequestSpeechState
  readonly genericSourceSpeechEvidenceDigestSha256: null
  readonly futureSharedAuthorityRequired: boolean
}

export interface LivingFrameSemanticRequestEvidenceProjection {
  readonly sourceMode: LivingFrameSemanticRequestSourceMode
  readonly visualEvidenceBindingDigestSha256: string
  readonly evidenceReferences:
    readonly LivingFrameSemanticRequestEvidenceReference[]
  readonly speechExpectation: LivingFrameSemanticRequestSpeechExpectation
}

export interface LivingFrameSemanticRequestSegmentContext {
  readonly segmentContextId: string
  readonly order: number
  readonly sourceSegmentRefId: string | null
  readonly sourceSequenceItemId: string | null
  readonly derivedVisualContextSummary: string
  readonly speakerState: LivingFrameSemanticRequestSpeakerState
  readonly safeSpaceState: LivingFrameSemanticRequestSafeSpaceState
  readonly evidenceRefIds: readonly string[]
  readonly candidateModeHints: readonly LivingFrameMode[]
}

export interface LivingFrameSemanticRequestConstraint {
  readonly constraintId: string
  readonly order: number
  readonly kind: LivingFrameSemanticRequestConstraintKind
  readonly priority: LivingFrameSemanticRequestConstraintPriority
  readonly derivedSummary: string
  readonly evidenceRefIds: readonly string[]
}

export interface LivingFrameSemanticRequestPayload {
  readonly purpose: 'propose_living_frame_semantic_scene_candidates'
  readonly intentSignals:
    readonly LivingFrameSemanticRequestIntentSignal[]
  readonly restraintSignals:
    readonly LivingFrameSemanticRequestRestraintSignal[]
  readonly allowedModes: readonly LivingFrameMode[]
  readonly evidence: LivingFrameSemanticRequestEvidenceProjection
  readonly segmentContexts:
    readonly LivingFrameSemanticRequestSegmentContext[]
  readonly semanticConstraints:
    readonly LivingFrameSemanticRequestConstraint[]
  readonly requestedDecisionKinds:
    readonly LivingFrameSemanticRequestDecisionKind[]
}

export interface LivingFrameSemanticRequestRouteAssuranceExpectation {
  readonly routeContract:
    'reeditpro-reasoning-model-route-v2-kimi-terra-deepseek'
  readonly orderedRouteIds: readonly [
    'kimi_k3_primary',
    'gpt_5_6_terra_fallback',
    'deepseek_v4_pro_fallback',
  ]
  readonly state: 'shared_route_data_assurance_required'
  readonly sharedRouteDataAssuranceDigestSha256: null
  readonly providerEnvelopeState: 'unbound'
  readonly providerEnvelopeDigestSha256: null
  readonly providerTransportAuthorized: false
  readonly providerCallMade: false
  readonly oldKimiToGptFallbackAllowed: false
  readonly qwen25VlReasoningRouteAllowed: false
  readonly mediaProviderOperationAllowed: false
}

export interface LivingFrameSemanticRequestOutputContract {
  readonly schemaVersion:
    typeof LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_SCHEMA_VERSION
  readonly outputJsonSchemaDigestSha256: string
  readonly strictJsonObjectRequired: true
  readonly unknownKeysRejected: true
  readonly hiddenReasoningOutputAllowed: false
  readonly rawEvidenceOutputAllowed: false
  readonly exactFrameOutputAllowed: false
  readonly exactSoundCueOutputAllowed: false
  readonly providerOrToolSelectionOutputAllowed: false
  readonly selectedSceneOutputAuthority: false
}

export interface LivingFrameSemanticReasoningRequestDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SEMANTIC_REASONING_REQUEST_VERSION
  readonly contractSource:
    typeof LIVING_FRAME_SEMANTIC_REASONING_REQUEST_SOURCE
  readonly status:
    typeof LIVING_FRAME_SEMANTIC_REASONING_REQUEST_STATUS
  readonly evidenceClass:
    typeof LIVING_FRAME_SEMANTIC_REASONING_REQUEST_EVIDENCE_CLASS
  readonly promotionAllowed: false
  readonly workflowContext: LivingFramePreapprovalWorkflowContext
  readonly canonicalBindings: LivingFrameSemanticRequestCanonicalBindings
  readonly semanticPayload: LivingFrameSemanticRequestPayload
  readonly blockingReasonCodes:
    readonly LivingFrameSemanticRequestBlockingReasonCode[]
  readonly routeAssurance:
    LivingFrameSemanticRequestRouteAssuranceExpectation
  readonly outputContract: Omit<
    LivingFrameSemanticRequestOutputContract,
    'outputJsonSchemaDigestSha256'
  >
  readonly authorityBoundary: LivingFrameSemanticRequestAuthorityBoundary
}

export interface LivingFrameSemanticReasoningRequest
  extends Omit<LivingFrameSemanticReasoningRequestDraft, 'outputContract'> {
  readonly outputContract: LivingFrameSemanticRequestOutputContract
  readonly semanticPayloadDigestSha256: string
  readonly contractDigestSha256: string
}

export interface LivingFrameSemanticRequestProposalEvidenceCitation {
  readonly evidenceRefId: string
}

export interface LivingFrameSemanticRequestComponentProposal {
  readonly componentKey: string
  readonly order: number
  readonly role: LivingFrameComponentRole
  readonly focalRole: LivingFrameFocalRole
  readonly derivedSummary: string
  readonly parentComponentKey: string | null
  readonly anchorComponentKey: string | null
  readonly depthBand: LivingFrameDepthBand
  readonly transparencyExpectation: LivingFrameTransparencyExpectation
  readonly alphaSourceExpectation: LivingFrameAlphaSourceExpectation
  readonly provenanceExpectation: LivingFrameProvenanceExpectation
  readonly capabilityKeys: readonly LivingFrameCapabilityKey[]
  readonly evidenceCitations:
    readonly LivingFrameSemanticRequestProposalEvidenceCitation[]
}

export interface LivingFrameSemanticRequestComponentDependencyProposal {
  readonly componentKey: string
  readonly dependsOnComponentKey: string
  readonly kind: 'depends_on' | 'anchored_to' | 'occluded_by'
}

export interface LivingFrameSemanticRequestMiniSkillProposal {
  readonly activationKey: string
  readonly order: number
  readonly miniSkillKey: LivingFrameMiniSkillKey
  readonly role: LivingFrameActivationRole
  readonly decision: LivingFrameActivationDecision
  readonly intensity: LivingFrameIntensity
  readonly reasonCode: LivingFrameReasonCode
  readonly derivedSummary: string
  readonly linkedComponentKeys: readonly string[]
  readonly linkedTimingConstraintKeys: readonly string[]
  readonly dependsOnActivationKeys: readonly string[]
  readonly conflictsWithActivationKeys: readonly string[]
}

export interface LivingFrameSemanticRequestTimingConstraintProposal {
  readonly timingConstraintKey: string
  readonly order: number
  readonly phase: LivingFrameTimingPhase
  readonly cueCode: LivingFrameSemanticCueCode
  readonly derivedSummary: string
  readonly exactFramesProvided: false
}

export interface LivingFrameSemanticRequestAttentionConstraintProposal {
  readonly attentionConstraintKey: string
  readonly order: number
  readonly eventType: LivingFrameAttentionEventType
  readonly target: LivingFrameAttentionTarget
  readonly methods: readonly LivingFrameAttentionMethod[]
  readonly derivedSummary: string
  readonly exactFramesProvided: false
}

export interface LivingFrameSemanticRequestScaleConstraintProposal {
  readonly scaleConstraintKey: string
  readonly componentKey: string
  readonly mode: LivingFrameSemanticScaleMode
  readonly meaning: LivingFrameSemanticScaleMeaning
  readonly factualGuard: LivingFrameFactualScaleGuard
  readonly derivedSummary: string
}

export interface LivingFrameSemanticRequestSoundConstraintProposal {
  readonly soundConstraintKey: string
  readonly order: number
  readonly linkedComponentKey: string | null
  readonly purpose: LivingFrameSoundPurpose
  readonly priority: LivingFrameSoundPriority
  readonly narrationProtection: LivingFrameNarrationProtection
  readonly duckingExpectation: LivingFrameDuckingExpectation
  readonly derivedSummary: string
  readonly exactCuePlacementProvided: false
  readonly exactMixProvided: false
}

export interface LivingFrameSemanticRequestRegionSafetyProposal {
  readonly captions: 'requires_downstream_verification' | 'blocked_collision'
  readonly face: 'requires_downstream_verification' | 'blocked_collision'
  readonly gestures: 'requires_downstream_verification' | 'blocked_collision'
}

export interface LivingFrameSemanticSceneProposal {
  readonly sceneProposalKey: string
  readonly order: number
  readonly semanticDecisionKey: string
  readonly segmentContextIds: readonly string[]
  readonly mode: LivingFrameMode
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly narrativePurposeCode: LivingFrameNarrativePurposeCode
  readonly visualVerb: LivingFrameVisualVerb
  readonly importance: LivingFrameImportance
  readonly derivedSummary: string
  readonly focalPrimaryComponentKey: string
  readonly components:
    readonly LivingFrameSemanticRequestComponentProposal[]
  readonly componentDependencies:
    readonly LivingFrameSemanticRequestComponentDependencyProposal[]
  readonly miniSkillProposals:
    readonly LivingFrameSemanticRequestMiniSkillProposal[]
  readonly semanticTimingConstraints:
    readonly LivingFrameSemanticRequestTimingConstraintProposal[]
  readonly attentionConstraints:
    readonly LivingFrameSemanticRequestAttentionConstraintProposal[]
  readonly semanticScaleConstraints:
    readonly LivingFrameSemanticRequestScaleConstraintProposal[]
  readonly soundConstraints:
    readonly LivingFrameSemanticRequestSoundConstraintProposal[]
  readonly regionSafety: LivingFrameSemanticRequestRegionSafetyProposal
  readonly fallbackLadder: readonly LivingFrameFallbackStep[]
  readonly continuityExpectationKinds: readonly [
    'style_bible',
    ...(
      | 'character_identity_sheet'
      | 'object_identity_sheet'
      | 'environment_identity_sheet'
      | 'scene_design_sheet'
      | 'motion_language_sheet'
      | 'sound_language_sheet'
      | 'alpha_edge_rules'
      | 'continuity_ledger'
    )[],
  ]
  readonly qaExpectationCodes: readonly LivingFrameQaCode[]
}

export interface LivingFrameSemanticDecisionProposal {
  readonly semanticDecisionKey: string
  readonly order: number
  readonly decisionKind: LivingFrameSemanticRequestDecisionKind
  readonly reasonCode: LivingFrameReasonCode
  readonly derivedSummary: string
  readonly evidenceCitations:
    readonly LivingFrameSemanticRequestProposalEvidenceCitation[]
  readonly sceneProposalKeys: readonly string[]
}

export interface LivingFrameSemanticSceneProposalResult {
  readonly schemaVersion:
    typeof LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_RESULT_VERSION
  readonly resultClass: 'living_frame_semantic_scene_proposal_content_only'
  readonly overallDecision:
    | 'candidates_proposed'
    | 'deliberate_non_use'
    | 'blocked'
  readonly decisions: readonly LivingFrameSemanticDecisionProposal[]
  readonly sceneProposals: readonly LivingFrameSemanticSceneProposal[]
  readonly selectedSceneAuthority: false
  readonly exactFrameAuthority: false
  readonly exactSoundCueAuthority: false
  readonly estimateAuthority: false
  readonly approvalAuthority: false
  readonly providerOrToolSelectionAuthority: false
  readonly workOrRuntimeAuthority: false
}

export interface LivingFrameSemanticRequestValidationIssue {
  readonly code: LivingFrameSemanticRequestValidationIssueCode
  readonly path: string
}

export type LivingFrameSemanticRequestValidationResult =
  | {
      readonly ok: true
      readonly request: LivingFrameSemanticReasoningRequest
    }
  | {
      readonly ok: false
      readonly issues: readonly LivingFrameSemanticRequestValidationIssue[]
    }
