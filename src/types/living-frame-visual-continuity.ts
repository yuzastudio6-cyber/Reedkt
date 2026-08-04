import type {
  LivingFrameMode,
  LivingFrameSourceTruthMode,
} from './living-frame'
import type {
  LivingFramePreapprovalWorkflowContext,
} from './living-frame-preapproval-input-authority'

export const LIVING_FRAME_VISUAL_CONTINUITY_PACK_VERSION =
  'living-frame-visual-continuity-pack-v1' as const
export const LIVING_FRAME_VISUAL_CONTINUITY_PACK_SOURCE =
  'living_frame_visual_continuity_contract_controlled_planning_only' as const
export const LIVING_FRAME_VISUAL_CONTINUITY_PACK_STATUS =
  'controlled_planning_candidate' as const
export const LIVING_FRAME_VISUAL_CONTINUITY_EVIDENCE_CLASS =
  'controlled_non_promotable_visual_continuity_pack' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_VISUAL_CONTINUITY_EXPECTATION_KINDS = [
  'character_consistency_plan_expectation',
  'documentary_fact_safety_plan_expectation',
  'motion_storytelling_style_expectation',
] as const
export type LivingFrameVisualContinuityExpectationKind =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_EXPECTATION_KINDS>

export const LIVING_FRAME_VISUAL_CONTINUITY_EXPECTATION_EVIDENCE_CLASSES = [
  'controlled_unverified_expectation',
  'future_canonical_revalidation_required',
] as const
export type LivingFrameVisualContinuityExpectationEvidenceClass =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_EXPECTATION_EVIDENCE_CLASSES>

export const LIVING_FRAME_VISUAL_CONTINUITY_ASSET_TREATMENTS = [
  'photographic',
  'archival',
  'editorial_cutout',
  'vector',
  'paper_collage',
  'technical',
  'cinematic_realistic',
  'cinematic_anime',
  'sumi_e_ink',
  'graphic_novel',
] as const
export type LivingFrameVisualContinuityAssetTreatment =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_ASSET_TREATMENTS>

export const LIVING_FRAME_VISUAL_CONTINUITY_LINE_LANGUAGES = [
  'none',
  'fine_ink',
  'bold_silhouette',
  'mixed_weight_ink',
  'clean_vector',
  'technical_line',
] as const
export type LivingFrameVisualContinuityLineLanguage =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_LINE_LANGUAGES>

export const LIVING_FRAME_VISUAL_CONTINUITY_PALETTE_MODES = [
  'monochrome',
  'limited_muted',
  'limited_accent',
  'naturalistic',
  'technical_high_contrast',
  'controlled_custom',
] as const
export type LivingFrameVisualContinuityPaletteMode =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_PALETTE_MODES>

export const LIVING_FRAME_VISUAL_CONTINUITY_COLOR_ROLES = [
  'background',
  'surface',
  'primary_subject',
  'secondary_subject',
  'accent',
  'warning',
  'ink',
  'highlight',
] as const
export type LivingFrameVisualContinuityColorRole =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_COLOR_ROLES>

export const LIVING_FRAME_VISUAL_CONTINUITY_LIGHTING_DIRECTIONS = [
  'camera_left',
  'camera_right',
  'overhead',
  'backlit',
  'front_neutral',
  'source_matched',
] as const
export type LivingFrameVisualContinuityLightingDirection =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_LIGHTING_DIRECTIONS>

export const LIVING_FRAME_VISUAL_CONTINUITY_LIGHTING_CHARACTERS = [
  'soft_natural',
  'hard_side',
  'archival_flat',
  'graphic',
  'technical_neutral',
  'source_matched',
] as const
export type LivingFrameVisualContinuityLightingCharacter =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_LIGHTING_CHARACTERS>

export const LIVING_FRAME_VISUAL_CONTINUITY_EDGE_TREATMENTS = [
  'clean',
  'soft',
  'inked',
  'torn_paper',
  'source_matched',
] as const
export type LivingFrameVisualContinuityEdgeTreatment =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_EDGE_TREATMENTS>

export const LIVING_FRAME_VISUAL_CONTINUITY_TEXTURE_TREATMENTS = [
  'clean_digital',
  'film_grain',
  'paper',
  'ink_bleed',
  'archival_dust',
  'source_matched',
] as const
export type LivingFrameVisualContinuityTextureTreatment =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_TEXTURE_TREATMENTS>

export const LIVING_FRAME_VISUAL_CONTINUITY_DETAIL_DENSITIES = [
  'sparse',
  'balanced',
  'rich',
] as const
export type LivingFrameVisualContinuityDetailDensity =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_DETAIL_DENSITIES>

export const LIVING_FRAME_VISUAL_CONTINUITY_STYLE_AVOIDANCE_CODES = [
  'generic_glossy_anime',
  'chibi_proportions',
  'unapproved_photoreal_likeness',
  'illegible_micro_detail',
  'baked_text',
  'opaque_rectangle',
  'publisher_imitation',
  'named_artist_imitation',
] as const
export type LivingFrameVisualContinuityStyleAvoidanceCode =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_STYLE_AVOIDANCE_CODES>

export const LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_KINDS = [
  'canonical_illustrative_interpretation',
  'fictional_character',
  'symbolic_figure',
  'real_person_neutral_reference_only',
  'source_speaker_no_likeness_generation',
] as const
export type LivingFrameVisualContinuityIdentityKind =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_KINDS>

export const LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_IMPORTANCE = [
  'primary',
  'secondary',
  'mention_only',
  'symbolic',
] as const
export type LivingFrameVisualContinuityIdentityImportance =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_IMPORTANCE>

export const LIVING_FRAME_VISUAL_CONTINUITY_REFERENCE_VIEW_KINDS = [
  'front',
  'profile',
  'three_quarter',
  'rear',
  'neutral_pose',
  'action_pose',
  'expression_range',
] as const
export type LivingFrameVisualContinuityReferenceViewKind =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_REFERENCE_VIEW_KINDS>

export const LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_SAFETY_STATES = [
  'canonical_interpretation_only',
  'fictional_or_symbolic',
  'neutral_reference_only',
  'blocked_pending_consent_and_identity_review',
  'source_speaker_no_generation',
] as const
export type LivingFrameVisualContinuityIdentitySafetyState =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_SAFETY_STATES>

export const LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_RULE_CODES = [
  'preserve_face_structure',
  'preserve_hair_and_hairline',
  'preserve_body_proportions',
  'preserve_outfit_layers',
  'preserve_accessories',
  'preserve_handedness',
  'preserve_weapon_or_prop_design',
  'preserve_silhouette',
  'do_not_claim_verified_likeness',
  'do_not_imply_unsupported_action',
] as const
export type LivingFrameVisualContinuityIdentityRuleCode =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_RULE_CODES>

export const LIVING_FRAME_VISUAL_CONTINUITY_OBJECT_KINDS = [
  'weapon',
  'vehicle',
  'mechanical_object',
  'document',
  'map_symbol',
  'prop',
] as const
export type LivingFrameVisualContinuityObjectKind =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_OBJECT_KINDS>

export const LIVING_FRAME_VISUAL_CONTINUITY_OBJECT_TRUTH_MODES = [
  'illustrative_design',
  'source_bound_design',
  'exact_physical_reference_required',
  'exact_geography_symbol_required',
] as const
export type LivingFrameVisualContinuityObjectTruthMode =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_OBJECT_TRUTH_MODES>

export const LIVING_FRAME_VISUAL_CONTINUITY_SEPARABILITY_CODES = [
  'complete_silhouette_required',
  'mechanical_parts_separable',
  'foreground_background_separable',
  'hidden_area_reconstruction_expected',
  'no_baked_motion_blur',
  'no_baked_text',
] as const
export type LivingFrameVisualContinuitySeparabilityCode =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_SEPARABILITY_CODES>

export const LIVING_FRAME_VISUAL_CONTINUITY_ENVIRONMENT_TRUTH_MODES = [
  'illustrative_environment',
  'source_bound_location',
  'exact_geography_required',
  'fictional_environment',
] as const
export type LivingFrameVisualContinuityEnvironmentTruthMode =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_ENVIRONMENT_TRUTH_MODES>

export const LIVING_FRAME_VISUAL_CONTINUITY_DEPTH_STYLES = [
  'flat',
  'shallow_2_5d',
  'deep_multiplane',
  'dimensional',
] as const
export type LivingFrameVisualContinuityDepthStyle =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_DEPTH_STYLES>

export const LIVING_FRAME_VISUAL_CONTINUITY_COMPOSITION_STRATEGIES = [
  'negative_space_stage',
  'speaker_spatial_stage',
  'full_scene',
  'editorial_evidence_stage',
  'exact_diagram_stage',
  'hybrid_expand_and_return',
] as const
export type LivingFrameVisualContinuityCompositionStrategy =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_COMPOSITION_STRATEGIES>

export const LIVING_FRAME_VISUAL_CONTINUITY_REGION_EXPECTATIONS = [
  'downstream_safe_region_revalidation_required',
  'not_applicable',
] as const
export type LivingFrameVisualContinuityRegionExpectation =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_REGION_EXPECTATIONS>

export const LIVING_FRAME_VISUAL_CONTINUITY_SCALE_TRUTH_GUARDS = [
  'literal_relationship_preserved',
  'data_proportion_preserved',
  'perspective_only',
  'symbolic_treatment_disclosed',
] as const
export type LivingFrameVisualContinuityScaleTruthGuard =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_SCALE_TRUTH_GUARDS>

export const LIVING_FRAME_VISUAL_CONTINUITY_MOTION_CHARACTERS = [
  'restrained',
  'fluid',
  'mechanical',
  'heavy',
  'elegant',
  'urgent',
] as const
export type LivingFrameVisualContinuityMotionCharacter =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_MOTION_CHARACTERS>

export const LIVING_FRAME_VISUAL_CONTINUITY_MOTION_DENSITIES = [
  'sparse',
  'balanced',
  'rich',
] as const
export type LivingFrameVisualContinuityMotionDensity =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_MOTION_DENSITIES>

export const LIVING_FRAME_VISUAL_CONTINUITY_CAMERA_CHARACTERS = [
  'locked',
  'slow_dolly',
  'restrained_documentary',
  'object_follow',
  'controlled_orbit',
  'source_matched',
] as const
export type LivingFrameVisualContinuityCameraCharacter =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_CAMERA_CHARACTERS>

export const LIVING_FRAME_VISUAL_CONTINUITY_STILLNESS_POLICIES = [
  'stillness_is_primary_contrast',
  'hold_before_primary_motion',
  'ambient_motion_only_until_semantic_trigger',
  'no_motion_without_semantic_reason',
] as const
export type LivingFrameVisualContinuityStillnessPolicy =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_STILLNESS_POLICIES>

export const LIVING_FRAME_VISUAL_CONTINUITY_SOUND_PALETTES = [
  'minimal',
  'organic',
  'mechanical',
  'atmospheric',
  'documentary_restrained',
] as const
export type LivingFrameVisualContinuitySoundPalette =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_SOUND_PALETTES>

export const LIVING_FRAME_VISUAL_CONTINUITY_SOUND_DENSITIES = [
  'sparse',
  'balanced',
] as const
export type LivingFrameVisualContinuitySoundDensity =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_SOUND_DENSITIES>

export const LIVING_FRAME_VISUAL_CONTINUITY_ALPHA_MASTER_MODES = [
  'opaque_plate',
  'straight_alpha_expected_after_qa',
  'procedural_alpha_expected_after_qa',
] as const
export type LivingFrameVisualContinuityAlphaMasterMode =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_ALPHA_MASTER_MODES>

export const LIVING_FRAME_VISUAL_CONTINUITY_ALPHA_TEST_BACKGROUNDS = [
  'white',
  'black',
  'neutral_gray',
  'saturated_color',
  'destination_composite',
] as const
export type LivingFrameVisualContinuityAlphaTestBackground =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_ALPHA_TEST_BACKGROUNDS>

export const LIVING_FRAME_VISUAL_CONTINUITY_LEDGER_STATES = [
  'accepted_for_continuity_planning_only',
  'rejected_from_continuity_planning',
  'future_asset_evidence_required',
] as const
export type LivingFrameVisualContinuityLedgerState =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_LEDGER_STATES>

export const LIVING_FRAME_VISUAL_CONTINUITY_LEDGER_REASON_CODES = [
  'identity_matches_controlled_canon_expectation',
  'style_matches_controlled_bible_expectation',
  'object_design_matches_controlled_expectation',
  'environment_matches_controlled_expectation',
  'animation_separability_expected',
  'identity_drift_detected',
  'style_drift_detected',
  'object_drift_detected',
  'unsafe_real_person_treatment',
  'fact_or_geography_uncertain',
  'alpha_claim_unverified',
  'component_separability_failed',
] as const
export type LivingFrameVisualContinuityLedgerReasonCode =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_LEDGER_REASON_CODES>

export const LIVING_FRAME_VISUAL_CONTINUITY_DEPENDENCY_KINDS = [
  'governed_by',
  'references',
] as const
export type LivingFrameVisualContinuityDependencyKind =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_DEPENDENCY_KINDS>

export const LIVING_FRAME_VISUAL_CONTINUITY_VALIDATION_ISSUE_CODES = [
  'non_json_input',
  'forbidden_key',
  'unsafe_text',
  'schema_rejected',
  'digest_mismatch',
  'crypto_unavailable',
  'duplicate_id',
  'duplicate_order',
  'dangling_reference',
  'cyclic_dependency',
  'semantic_order_invalid',
  'lineage_invalid',
  'stale_lineage',
  'workflow_context_invalid',
  'identity_safety_invalid',
  'fact_safety_invalid',
  'geography_or_data_truth_invalid',
  'alpha_policy_invalid',
  'ledger_promotion_invalid',
  'non_use_pack_invalid',
  'authority_boundary_invalid',
  'digest_calculation_failed',
] as const
export type LivingFrameVisualContinuityValidationIssueCode =
  ValueOf<typeof LIVING_FRAME_VISUAL_CONTINUITY_VALIDATION_ISSUE_CODES>

export interface LivingFrameVisualContinuityAuthorityBoundary {
  readonly controlledPlanningOnly: true
  readonly liveEvidenceAuthority: false
  readonly selectedSceneAuthority: false
  readonly exactTimingAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
}

export interface LivingFrameVisualContinuityExpectationRef {
  readonly expectationId: string
  readonly expectationKind: LivingFrameVisualContinuityExpectationKind
  readonly version: number
  readonly expectedDigestSha256: string
  readonly evidenceClass: LivingFrameVisualContinuityExpectationEvidenceClass
  readonly liveAuthorityVerified: false
  readonly currentAuthorityVerified: false
  readonly approvalVerified: false
}

export interface LivingFrameVisualContinuityCanonicalBindings {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly handoffId: string
  readonly deferredLivingFrameComponentDigestSha256: string
  readonly planningEvidenceBindingDigestSha256: string
  readonly preapprovalReasoningResultBindingDigestSha256: string
  readonly compiledIntentDigestSha256: string
  readonly sourceSequenceDigestSha256: string
  readonly outputFrameDigestSha256: string
  readonly lineageRevision: number
}

export interface LivingFrameVisualContinuityColor {
  readonly colorId: string
  readonly order: number
  readonly role: LivingFrameVisualContinuityColorRole
  readonly hex: string
}

export interface LivingFrameVisualContinuityStyleBible {
  readonly styleBibleId: string
  readonly version: number
  readonly summary: string
  readonly assetTreatment: LivingFrameVisualContinuityAssetTreatment
  readonly lineLanguage: LivingFrameVisualContinuityLineLanguage
  readonly paletteMode: LivingFrameVisualContinuityPaletteMode
  readonly palette: readonly LivingFrameVisualContinuityColor[]
  readonly lightingDirection: LivingFrameVisualContinuityLightingDirection
  readonly lightingCharacter: LivingFrameVisualContinuityLightingCharacter
  readonly edgeTreatment: LivingFrameVisualContinuityEdgeTreatment
  readonly textureTreatment: LivingFrameVisualContinuityTextureTreatment
  readonly detailDensity: LivingFrameVisualContinuityDetailDensity
  readonly avoidanceCodes:
    readonly LivingFrameVisualContinuityStyleAvoidanceCode[]
  readonly referenceExpectationIds: readonly string[]
}

export interface LivingFrameVisualContinuityReferenceView {
  readonly referenceViewId: string
  readonly order: number
  readonly kind: LivingFrameVisualContinuityReferenceViewKind
  readonly expectedReferenceDigestSha256: string
  readonly evidenceClass: 'controlled_unverified_reference_expectation'
  readonly qaApprovedAsset: false
}

export interface LivingFrameVisualContinuityCharacterSheet {
  readonly characterSheetId: string
  readonly version: number
  readonly displayLabel: string
  readonly identityKind: LivingFrameVisualContinuityIdentityKind
  readonly importance: LivingFrameVisualContinuityIdentityImportance
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly canonicalAppearanceSummary: string
  readonly outfitSummary: string
  readonly silhouetteSummary: string
  readonly expressionRangeSummary: string
  readonly identitySafetyState: LivingFrameVisualContinuityIdentitySafetyState
  readonly identityRuleCodes:
    readonly LivingFrameVisualContinuityIdentityRuleCode[]
  readonly referenceViews: readonly LivingFrameVisualContinuityReferenceView[]
  readonly styleBibleId: string
  readonly expectationRefIds: readonly string[]
  readonly verifiedLikenessClaimed: false
  readonly historicalEvidenceClaimed: false
}

export interface LivingFrameVisualContinuityObjectSheet {
  readonly objectSheetId: string
  readonly version: number
  readonly displayLabel: string
  readonly objectKind: LivingFrameVisualContinuityObjectKind
  readonly truthMode: LivingFrameVisualContinuityObjectTruthMode
  readonly canonicalDesignSummary: string
  readonly materialAndColorSummary: string
  readonly separabilityCodes:
    readonly LivingFrameVisualContinuitySeparabilityCode[]
  readonly styleBibleId: string
  readonly expectationRefIds: readonly string[]
  readonly exactGeometryVerified: false
}

export interface LivingFrameVisualContinuityEnvironmentSheet {
  readonly environmentSheetId: string
  readonly version: number
  readonly displayLabel: string
  readonly truthMode: LivingFrameVisualContinuityEnvironmentTruthMode
  readonly canonicalEnvironmentSummary: string
  readonly atmosphereSummary: string
  readonly depthStyle: LivingFrameVisualContinuityDepthStyle
  readonly styleBibleId: string
  readonly expectationRefIds: readonly string[]
  readonly exactGeographyVerified: false
}

export interface LivingFrameVisualContinuitySceneDesignSheet {
  readonly sceneDesignSheetId: string
  readonly order: number
  readonly semanticCandidateDecisionId: string
  readonly mode: LivingFrameMode
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly summary: string
  readonly styleBibleId: string
  readonly characterSheetIds: readonly string[]
  readonly objectSheetIds: readonly string[]
  readonly environmentSheetIds: readonly string[]
  readonly compositionStrategy:
    LivingFrameVisualContinuityCompositionStrategy
  readonly depthStyle: LivingFrameVisualContinuityDepthStyle
  readonly captionRegionExpectation:
    LivingFrameVisualContinuityRegionExpectation
  readonly faceRegionExpectation:
    LivingFrameVisualContinuityRegionExpectation
  readonly gestureRegionExpectation:
    LivingFrameVisualContinuityRegionExpectation
  readonly scaleTruthGuard:
    LivingFrameVisualContinuityScaleTruthGuard
  readonly exactFramesProvided: false
  readonly componentSceneGraphProvided: false
  readonly selectedSceneAuthority: false
}

export interface LivingFrameVisualContinuityMotionLanguageSheet {
  readonly motionLanguageSheetId: string
  readonly version: number
  readonly summary: string
  readonly motionCharacter: LivingFrameVisualContinuityMotionCharacter
  readonly motionDensity: LivingFrameVisualContinuityMotionDensity
  readonly cameraCharacter: LivingFrameVisualContinuityCameraCharacter
  readonly stillnessPolicies:
    readonly LivingFrameVisualContinuityStillnessPolicy[]
  readonly maximumSimultaneousPrimaryMotions: 1
  readonly semanticTimingOnly: true
  readonly exactFramesProvided: false
}

export interface LivingFrameVisualContinuitySoundLanguageSheet {
  readonly soundLanguageSheetId: string
  readonly version: number
  readonly summary: string
  readonly palette: LivingFrameVisualContinuitySoundPalette
  readonly density: LivingFrameVisualContinuitySoundDensity
  readonly narrationProtection: 'strict'
  readonly automaticWhooshPerElement: false
  readonly exactCuePlacementProvided: false
  readonly exactMixProvided: false
}

export interface LivingFrameVisualContinuityAlphaEdgeRules {
  readonly alphaEdgeRulesId: string
  readonly version: number
  readonly masterMode: LivingFrameVisualContinuityAlphaMasterMode
  readonly nativeAlphaCapabilityCheckRequired: true
  readonly nativeAlphaClaimIsQaApproval: false
  readonly checkerboardIsTransparency: false
  readonly rectangularBackgroundRejected: true
  readonly testBackgrounds:
    readonly LivingFrameVisualContinuityAlphaTestBackground[]
  readonly destinationCompositeQaRequired: true
  readonly temporalMaskBenchmarkRequired: boolean
  readonly qaApprovedAsset: false
}

export interface LivingFrameVisualContinuityLedgerEntry {
  readonly ledgerEntryId: string
  readonly order: number
  readonly assetExpectationId: string
  readonly expectedAssetDigestSha256: string
  readonly state: LivingFrameVisualContinuityLedgerState
  readonly reasonCode: LivingFrameVisualContinuityLedgerReasonCode
  readonly derivedSummary: string
  readonly linkedCharacterSheetIds: readonly string[]
  readonly linkedObjectSheetIds: readonly string[]
  readonly linkedEnvironmentSheetIds: readonly string[]
  readonly acceptedForPlanningOnly: boolean
  readonly qaApprovedExecutableAsset: false
  readonly assetManifestAuthority: false
}

export interface LivingFrameVisualContinuitySheetDependency {
  readonly fromSheetId: string
  readonly toSheetId: string
  readonly kind: LivingFrameVisualContinuityDependencyKind
}

export interface LivingFrameVisualContinuityPackDraft {
  readonly contractVersion: typeof LIVING_FRAME_VISUAL_CONTINUITY_PACK_VERSION
  readonly contractSource: typeof LIVING_FRAME_VISUAL_CONTINUITY_PACK_SOURCE
  readonly status: typeof LIVING_FRAME_VISUAL_CONTINUITY_PACK_STATUS
  readonly evidenceClass:
    typeof LIVING_FRAME_VISUAL_CONTINUITY_EVIDENCE_CLASS
  readonly promotionAllowed: false
  readonly semanticDecisionState: 'candidates_proposed'
  readonly workflowContext: LivingFramePreapprovalWorkflowContext
  readonly canonicalBindings: LivingFrameVisualContinuityCanonicalBindings
  readonly expectationRefs:
    readonly LivingFrameVisualContinuityExpectationRef[]
  readonly styleBible: LivingFrameVisualContinuityStyleBible
  readonly characterSheets:
    readonly LivingFrameVisualContinuityCharacterSheet[]
  readonly objectSheets: readonly LivingFrameVisualContinuityObjectSheet[]
  readonly environmentSheets:
    readonly LivingFrameVisualContinuityEnvironmentSheet[]
  readonly sceneDesignSheets:
    readonly LivingFrameVisualContinuitySceneDesignSheet[]
  readonly motionLanguageSheet:
    LivingFrameVisualContinuityMotionLanguageSheet
  readonly soundLanguageSheet:
    LivingFrameVisualContinuitySoundLanguageSheet
  readonly alphaEdgeRules: LivingFrameVisualContinuityAlphaEdgeRules
  readonly continuityLedger:
    readonly LivingFrameVisualContinuityLedgerEntry[]
  readonly sheetDependencies:
    readonly LivingFrameVisualContinuitySheetDependency[]
  readonly authorityBoundary:
    LivingFrameVisualContinuityAuthorityBoundary
}

export interface LivingFrameVisualContinuityPack
  extends LivingFrameVisualContinuityPackDraft {
  readonly contractDigestSha256: string
}

export interface LivingFrameVisualContinuityValidationIssue {
  readonly code: LivingFrameVisualContinuityValidationIssueCode
  readonly path: string
}

export type LivingFrameVisualContinuityValidationResult =
  | {
      readonly ok: true
      readonly pack: LivingFrameVisualContinuityPack
    }
  | {
      readonly ok: false
      readonly issues:
        readonly LivingFrameVisualContinuityValidationIssue[]
    }
