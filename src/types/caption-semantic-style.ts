import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
  CaptionStrategyPlanPayload,
} from './caption-domain-contracts'
import type { CaptionFontResolution } from './caption-font-runtime'

export const CAPTION_SEMANTIC_STYLE_PLAN_VERSION =
  'caption-semantic-style-plan-v1' as const
export const CAPTION_STYLE_CALIBRATION_PREVIEW_VERSION =
  'caption-style-calibration-preview-v1' as const
export const CAPTION_LEGACY_STYLE_ADAPTER_VERSION =
  'caption-legacy-style-adapter-v1' as const

export type CaptionSemanticRole =
  | 'primary_statement'
  | 'supporting_detail'
  | 'contrast'
  | 'question'
  | 'quotation'
  | 'speaker_identity'
  | 'warning_or_conflict'
  | 'positive_result'
  | 'hero_concept'
  | 'historical_context'
  | 'technical_term'

export type CaptionClauseRole =
  | 'independent'
  | 'opening'
  | 'continuation'
  | 'contrast_turn'
  | 'closing'

export type CaptionPlatformProfileId =
  | 'phone_portrait'
  | 'phone_square'
  | 'desktop_widescreen'
  | 'television_widescreen'

export type CaptionViewingTarget = 'phone' | 'desktop' | 'television'

export type CaptionLegibilityTreatment =
  | 'none'
  | 'shadow'
  | 'stroke'
  | 'backplate'
  | 'local_scrim'

export type CaptionNonColorEmphasis =
  | 'weight_change'
  | 'scale_change'
  | 'underline_marker'
  | 'shape_marker'
  | 'motion_reveal'

export interface CaptionConfirmedStyleFrame {
  frameRef: CaptionDomainRef
  outputId: string
  width: number
  height: number
  aspectRatioNumerator: number
  aspectRatioDenominator: number
  fpsNumerator: number
  fpsDenominator: number
}

export interface CaptionProtectedTokenGroup {
  groupId: string
  protectionReason:
    | 'proper_name'
    | 'organization'
    | 'number_unit_currency'
    | 'date'
    | 'negation'
    | 'acronym'
    | 'quotation'
    | 'grapheme_or_emoji_sequence'
    | 'claim_sensitive'
  exactSourceWordIds: string[]
}

export interface CaptionSemanticLineCandidate {
  candidateId: string
  lines: Array<{
    lineId: string
    displayedText: string
    exactSourceWordIds: string[]
    shapedAdvanceMilliEm: number
    graphemeCount: number
  }>
  measurementMode: 'contract_fixture' | 'qualified_private_runtime'
  measurementEvidenceRef: CaptionDomainRef
}

export interface CaptionLegibilityCandidate {
  treatment: CaptionLegibilityTreatment
  measuredContrastRatioMilli: number
  evidenceRef: CaptionDomainRef
}

export interface CaptionSemanticStylePhraseProposal {
  phraseId: string
  languageTag: string
  semanticRole: CaptionSemanticRole
  clauseRole: CaptionClauseRole
  typographyRoleId: string
  colorRoleId: string
  fontResolutionId: string
  emphasisSourceWordIds: string[]
  nonColorEmphasis: CaptionNonColorEmphasis | null
  protectedTokenGroups: CaptionProtectedTokenGroup[]
  lineCandidates: CaptionSemanticLineCandidate[]
  legibilityCandidates: CaptionLegibilityCandidate[]
  requestedSemanticScaleBasisPoints: number
}

export interface CaptionResolvedLineLayout {
  selectedCandidateId: string
  lines: CaptionSemanticLineCandidate['lines']
  rejectedCandidateIds: string[]
  measurementMode: CaptionSemanticLineCandidate['measurementMode']
  measurementEvidenceRef: CaptionDomainRef
  maximumLineAdvanceMilliEm: number
  availableLineAdvanceMilliEm: number
  widthUtilizationBasisPoints: number
  languageAwareRulesApplied: true
  protectedGroupsPreserved: true
  sourceWordOrderPreserved: true
  displayedTextPreserved: true
  orphanLineAvoided: true
}

export interface CaptionOpticalSizing {
  platformProfileId: CaptionPlatformProfileId
  baseFontSizePixels: number
  resolvedFontSizePixels: number
  minimumFontSizePixels: number
  maximumFontSizePixels: number
  lineHeightMilli: number
  safeWidthBasisPoints: number
  maximumLines: number
  semanticScaleBasisPoints: number
  sizeDerivedFromRoleAndOutputProfile: true
  characterCountDrivenSizeOscillationAllowed: false
}

export interface CaptionResolvedSemanticStylePhrase {
  phraseId: string
  displayedText: string
  exactSourceWordIds: string[]
  semanticRole: CaptionSemanticRole
  clauseRole: CaptionClauseRole
  languageTag: string
  typographyRoleId: string
  colorRoleId: string
  emphasisSourceWordIds: string[]
  nonColorEmphasis: CaptionNonColorEmphasis | null
  protectedTokenGroups: CaptionProtectedTokenGroup[]
  fontResolutionRef: CaptionDomainRef
  fontResolutionDisposition: CaptionFontResolution['disposition']
  lineLayout: CaptionResolvedLineLayout
  opticalSizing: CaptionOpticalSizing
  selectedLegibilityTreatment: CaptionLegibilityTreatment | null
  selectedContrastRatioMilli: number | null
  legibilityEvidenceRef: CaptionDomainRef | null
  accessibleCompleteWordingRetained: true
  semanticMeaningPreserved: true
  colorIsSoleMeaningCarrier: false
  executionReady: boolean
  blockerCodes: string[]
}

export interface CaptionSemanticStylePlan {
  schemaVersion: typeof CAPTION_SEMANTIC_STYLE_PLAN_VERSION
  planId: string
  planDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  phraseLineageProjectionRef: CaptionDomainRef
  styleProfileRef: CaptionDomainRef
  fontRegistryRef: CaptionDomainRef
  occupancyManifestRef: CaptionDomainRef
  confirmedOutputFrame: CaptionConfirmedStyleFrame
  viewingTarget: CaptionViewingTarget
  platformProfileId: CaptionPlatformProfileId
  selectedRegionId: string
  selectedRegionFrameRange: CaptionDomainFrameRange
  phrases: CaptionResolvedSemanticStylePhrase[]
  fallbackLadder: [
    'measured_semantic_phrase',
    'simpler_semantic_line_layout',
    'stable_verbatim_phrase',
    'deterministic_legacy_segmentation',
    'accessible_sidecar_only',
  ]
  qualificationState:
    | 'ready_private_internal'
    | 'contract_validated_runtime_gated'
    | 'blocked_no_valid_line_layout'
    | 'blocked_no_legible_treatment'
    | 'blocked_font_resolution'
  blockerCodes: string[]
  everyPhraseHasExactSourceLineage: true
  everyLineHasMeasuredGeometry: true
  languageAwareLineBreakingApplied: true
  approvedTypographyRolesOnly: true
  approvedColorRolesOnly: true
  adaptiveLegibilityApplied: true
  accessibleProjectionRequired: true
  rawChatIncluded: false
  mediaBytesIncluded: false
  arbitraryCssIncluded: false
  arbitraryAssTagsIncluded: false
  modelAuthoredCodeIncluded: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  finalCanvasAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionStyleCalibrationScenario {
  scenarioId: string
  scenarioKind:
    | 'light_simple_background'
    | 'dark_simple_background'
    | 'busy_background'
    | 'protected_region_pressure'
    | 'multilingual_fallback'
    | 'reduced_motion_counterpart'
  phraseId: string
  platformProfileId: CaptionPlatformProfileId
  typographyRoleId: string
  colorRoleId: string
  fontResolutionRef: CaptionDomainRef
  selectedLegibilityTreatment: CaptionLegibilityTreatment
  expectedRegionId: string
  expectedChecks: string[]
}

export interface CaptionStyleCalibrationPreview {
  schemaVersion: typeof CAPTION_STYLE_CALIBRATION_PREVIEW_VERSION
  previewId: string
  previewDigestSha256: string
  semanticStylePlanRef: CaptionDomainRef
  scenarios: CaptionStyleCalibrationScenario[]
  previewState: 'planned_contract_only' | 'ready_for_private_render'
  renderedMediaRef: null
  actualRenderedPixelsInspected: false
  directRasterInspectionRequiredAfterRender: true
  deterministicQaRequiredAfterRender: true
  independentFinalQaStillRequired: true
  browserLocalCompletionAllowed: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export type CaptionLegacyStyleId =
  | 'clean_subtitle'
  | 'small_premium_subtitle'
  | 'bold_social_captions'
  | 'keyword_emphasis_captions'
  | 'karaoke_word_by_word'
  | 'sentence_block_captions'
  | 'documentary_lower_third'
  | 'education_label_captions'
  | 'minimal_accessibility_captions'
  | 'caption_icon_callout'
  | 'custom'

export interface CaptionLegacyStyleAdapter {
  schemaVersion: typeof CAPTION_LEGACY_STYLE_ADAPTER_VERSION
  adapterId: string
  adapterDigestSha256: string
  legacyStyleId: CaptionLegacyStyleId
  mappedProjectMode: CaptionStrategyPlanPayload['projectMode'] | null
  mappedTypographyRoleId: string | null
  mappedColorRoleId: string | null
  mappedTreatmentCode: string | null
  customStyleApprovalRef: CaptionDomainRef | null
  disposition: 'adapted' | 'blocked_custom_style_requires_approval'
  deprecatedPresetRemainsReadable: true
  mutablePresetAuthorityGranted: false
  executionAuthorityGranted: false
  productionAuthorityGranted: false
}

export interface CaptionSemanticStyleBundle {
  plan: CaptionSemanticStylePlan
  calibrationPreview: CaptionStyleCalibrationPreview
  legacyStyleAdapter: CaptionLegacyStyleAdapter | null
}
