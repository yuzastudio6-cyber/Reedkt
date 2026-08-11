import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  CAPTION_LEGACY_STYLE_ADAPTER_VERSION,
  CAPTION_SEMANTIC_STYLE_PLAN_VERSION,
  CAPTION_STYLE_CALIBRATION_PREVIEW_VERSION,
  type CaptionLegacyStyleAdapter,
  type CaptionLegacyStyleId,
  type CaptionLegibilityTreatment,
  type CaptionOpticalSizing,
  type CaptionPlatformProfileId,
  type CaptionResolvedSemanticStylePhrase,
  type CaptionSemanticLineCandidate,
  type CaptionSemanticStyleBundle,
  type CaptionSemanticStylePhraseProposal,
  type CaptionSemanticStylePlan,
  type CaptionStyleCalibrationPreview,
  type CaptionViewingTarget,
} from '../../src/types/caption-semantic-style'
import type {
  AnyCaptionDomainContract,
  CaptionDomainCanonicalScope,
  CaptionDomainContract,
  CaptionDomainRef,
  CaptionStyleProfilePayload,
} from '../../src/types/caption-domain-contracts'
import type { CaptionFontResolution } from '../../src/types/caption-font-runtime'
import type { CaptionPhraseLineageProjection } from '../../src/types/caption-transcript-lineage'
import type { CaptionVisualOccupancyManifest } from '../../src/types/caption-visual-intelligence-support'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import { parseCaptionDomainContract } from './caption-domain-contracts'
import { parseCaptionFontResolution } from './caption-font-runtime'
import { parseCaptionPhraseLineageProjection } from './caption-transcript-lineage'
import { parseCaptionVisualOccupancyManifest } from './caption-visual-intelligence-support'

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint < 32 || codePoint === 127
  })
}

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeText = z.string().min(1).max(4_000)
  .refine((value) => !containsControlCharacter(value))
  .refine((value) => !/[\u202a-\u202e\u2066-\u2069]/u.test(value))
const languageTag = z.string().min(2).max(64)
  .regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).min(1).max(512),
}).strict()

const semanticRoleSchema = z.enum([
  'primary_statement', 'supporting_detail', 'contrast', 'question', 'quotation',
  'speaker_identity', 'warning_or_conflict', 'positive_result', 'hero_concept',
  'historical_context', 'technical_term',
])
const clauseRoleSchema = z.enum([
  'independent', 'opening', 'continuation', 'contrast_turn', 'closing',
])
const platformProfileSchema = z.enum([
  'phone_portrait', 'phone_square', 'desktop_widescreen', 'television_widescreen',
])
const viewingTargetSchema = z.enum(['phone', 'desktop', 'television'])
const treatmentSchema = z.enum(['none', 'shadow', 'stroke', 'backplate', 'local_scrim'])
const nonColorEmphasisSchema = z.enum([
  'weight_change', 'scale_change', 'underline_marker', 'shape_marker', 'motion_reveal',
])
const protectionReasonSchema = z.enum([
  'proper_name', 'organization', 'number_unit_currency', 'date', 'negation',
  'acronym', 'quotation', 'grapheme_or_emoji_sequence', 'claim_sensitive',
])

const protectedGroupSchema = z.object({
  groupId: safeKey,
  protectionReason: protectionReasonSchema,
  exactSourceWordIds: z.array(safeKey).min(1).max(256),
}).strict()
const lineSchema = z.object({
  lineId: safeKey,
  displayedText: safeText,
  exactSourceWordIds: z.array(safeKey).min(1).max(256),
  shapedAdvanceMilliEm: z.number().int().positive().max(1_000_000),
  graphemeCount: z.number().int().positive().max(4_000),
}).strict()
const lineCandidateSchema = z.object({
  candidateId: safeKey,
  lines: z.array(lineSchema).min(1).max(4),
  measurementMode: z.enum(['contract_fixture', 'qualified_private_runtime']),
  measurementEvidenceRef: refSchema,
}).strict()
const legibilityCandidateSchema = z.object({
  treatment: treatmentSchema,
  measuredContrastRatioMilli: z.number().int().min(0).max(30_000),
  evidenceRef: refSchema,
}).strict()
const phraseProposalSchema: z.ZodType<CaptionSemanticStylePhraseProposal> = z.object({
  phraseId: safeKey,
  languageTag,
  semanticRole: semanticRoleSchema,
  clauseRole: clauseRoleSchema,
  typographyRoleId: safeKey,
  colorRoleId: safeKey,
  fontResolutionId: safeKey,
  emphasisSourceWordIds: z.array(safeKey).max(64),
  nonColorEmphasis: nonColorEmphasisSchema.nullable(),
  protectedTokenGroups: z.array(protectedGroupSchema).max(64),
  lineCandidates: z.array(lineCandidateSchema).min(1).max(64),
  legibilityCandidates: z.array(legibilityCandidateSchema).min(1).max(5),
  requestedSemanticScaleBasisPoints: z.number().int().min(7_500).max(18_000),
}).strict()

const confirmedFrameSchema = z.object({
  frameRef: refSchema,
  outputId: safeKey,
  width: z.number().int().min(16).max(16_384),
  height: z.number().int().min(16).max(16_384),
  aspectRatioNumerator: z.number().int().positive().max(16_384),
  aspectRatioDenominator: z.number().int().positive().max(16_384),
  fpsNumerator: z.number().int().positive().max(240_000),
  fpsDenominator: z.number().int().positive().max(10_000),
}).strict().superRefine((frame, context) => {
  if (frame.width * frame.aspectRatioDenominator
    !== frame.height * frame.aspectRatioNumerator) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Confirmed Caption style frame ratio is not exact.',
    })
  }
})

const resolvedLineLayoutSchema = z.object({
  selectedCandidateId: safeKey,
  lines: z.array(lineSchema).min(1).max(4),
  rejectedCandidateIds: z.array(safeKey).max(63),
  measurementMode: z.enum(['contract_fixture', 'qualified_private_runtime']),
  measurementEvidenceRef: refSchema,
  maximumLineAdvanceMilliEm: z.number().int().positive().max(1_000_000),
  availableLineAdvanceMilliEm: z.number().int().positive().max(1_000_000),
  widthUtilizationBasisPoints: z.number().int().min(0).max(10_000),
  languageAwareRulesApplied: z.literal(true),
  protectedGroupsPreserved: z.literal(true),
  sourceWordOrderPreserved: z.literal(true),
  displayedTextPreserved: z.literal(true),
  orphanLineAvoided: z.literal(true),
}).strict()
const opticalSizingSchema: z.ZodType<CaptionOpticalSizing> = z.object({
  platformProfileId: platformProfileSchema,
  baseFontSizePixels: z.number().int().positive().max(2_048),
  resolvedFontSizePixels: z.number().int().positive().max(2_048),
  minimumFontSizePixels: z.number().int().positive().max(2_048),
  maximumFontSizePixels: z.number().int().positive().max(2_048),
  lineHeightMilli: z.number().int().min(1_000).max(2_000),
  safeWidthBasisPoints: z.number().int().min(1_000).max(10_000),
  maximumLines: z.number().int().min(1).max(4),
  semanticScaleBasisPoints: z.number().int().min(7_500).max(18_000),
  sizeDerivedFromRoleAndOutputProfile: z.literal(true),
  characterCountDrivenSizeOscillationAllowed: z.literal(false),
}).strict()
const resolvedPhraseSchema: z.ZodType<CaptionResolvedSemanticStylePhrase> = z.object({
  phraseId: safeKey,
  displayedText: safeText,
  exactSourceWordIds: z.array(safeKey).min(1).max(256),
  semanticRole: semanticRoleSchema,
  clauseRole: clauseRoleSchema,
  languageTag,
  typographyRoleId: safeKey,
  colorRoleId: safeKey,
  emphasisSourceWordIds: z.array(safeKey).max(64),
  nonColorEmphasis: nonColorEmphasisSchema.nullable(),
  protectedTokenGroups: z.array(protectedGroupSchema).max(64),
  fontResolutionRef: refSchema,
  fontResolutionDisposition: z.enum([
    'resolved_private_internal', 'resolved_contract_fixture',
    'blocked_missing_qualified_font', 'blocked_unqualified_runtime',
  ]),
  lineLayout: resolvedLineLayoutSchema,
  opticalSizing: opticalSizingSchema,
  selectedLegibilityTreatment: treatmentSchema.nullable(),
  selectedContrastRatioMilli: z.number().int().min(0).max(30_000).nullable(),
  legibilityEvidenceRef: refSchema.nullable(),
  accessibleCompleteWordingRetained: z.literal(true),
  semanticMeaningPreserved: z.literal(true),
  colorIsSoleMeaningCarrier: z.literal(false),
  executionReady: z.boolean(),
  blockerCodes: z.array(safeKey).max(64),
}).strict()

const fallbackLadderSchema = z.tuple([
  z.literal('measured_semantic_phrase'),
  z.literal('simpler_semantic_line_layout'),
  z.literal('stable_verbatim_phrase'),
  z.literal('deterministic_legacy_segmentation'),
  z.literal('accessible_sidecar_only'),
])
const planSchema: z.ZodType<CaptionSemanticStylePlan> = z.object({
  schemaVersion: z.literal(CAPTION_SEMANTIC_STYLE_PLAN_VERSION),
  planId: safeKey,
  planDigestSha256: sha256,
  canonicalScope: scopeSchema,
  phraseLineageProjectionRef: refSchema,
  styleProfileRef: refSchema,
  fontRegistryRef: refSchema,
  occupancyManifestRef: refSchema,
  confirmedOutputFrame: confirmedFrameSchema,
  viewingTarget: viewingTargetSchema,
  platformProfileId: platformProfileSchema,
  selectedRegionId: safeKey,
  selectedRegionFrameRange: frameRangeSchema,
  phrases: z.array(resolvedPhraseSchema).min(1).max(4_096),
  fallbackLadder: fallbackLadderSchema,
  qualificationState: z.enum([
    'ready_private_internal', 'contract_validated_runtime_gated',
    'blocked_no_valid_line_layout', 'blocked_no_legible_treatment',
    'blocked_font_resolution',
  ]),
  blockerCodes: z.array(safeKey).max(128),
  everyPhraseHasExactSourceLineage: z.literal(true),
  everyLineHasMeasuredGeometry: z.literal(true),
  languageAwareLineBreakingApplied: z.literal(true),
  approvedTypographyRolesOnly: z.literal(true),
  approvedColorRolesOnly: z.literal(true),
  adaptiveLegibilityApplied: z.literal(true),
  accessibleProjectionRequired: z.literal(true),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  arbitraryCssIncluded: z.literal(false),
  arbitraryAssTagsIncluded: z.literal(false),
  modelAuthoredCodeIncluded: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  finalCanvasAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((plan, context) => {
  if (new Set(plan.phrases.map((phrase) => phrase.phraseId)).size !== plan.phrases.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Resolved phrase IDs must be unique.' })
  }
  const allReady = plan.phrases.every((phrase) => phrase.executionReady)
  if ((plan.qualificationState === 'ready_private_internal') !== allReady) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Style qualification state overclaims readiness.' })
  }
  if ((plan.qualificationState === 'ready_private_internal')
    !== (plan.blockerCodes.length === 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Style plan blockers are inconsistent.' })
  }
})

const scenarioSchema = z.object({
  scenarioId: safeKey,
  scenarioKind: z.enum([
    'light_simple_background', 'dark_simple_background', 'busy_background',
    'protected_region_pressure', 'multilingual_fallback',
    'reduced_motion_counterpart',
  ]),
  phraseId: safeKey,
  platformProfileId: platformProfileSchema,
  typographyRoleId: safeKey,
  colorRoleId: safeKey,
  fontResolutionRef: refSchema,
  selectedLegibilityTreatment: treatmentSchema,
  expectedRegionId: safeKey,
  expectedChecks: z.array(safeKey).min(1).max(32),
}).strict()
const calibrationSchema: z.ZodType<CaptionStyleCalibrationPreview> = z.object({
  schemaVersion: z.literal(CAPTION_STYLE_CALIBRATION_PREVIEW_VERSION),
  previewId: safeKey,
  previewDigestSha256: sha256,
  semanticStylePlanRef: refSchema,
  scenarios: z.array(scenarioSchema).length(6),
  previewState: z.enum(['planned_contract_only', 'ready_for_private_render']),
  renderedMediaRef: z.null(),
  actualRenderedPixelsInspected: z.literal(false),
  directRasterInspectionRequiredAfterRender: z.literal(true),
  deterministicQaRequiredAfterRender: z.literal(true),
  independentFinalQaStillRequired: z.literal(true),
  browserLocalCompletionAllowed: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((preview, context) => {
  const kinds = new Set(preview.scenarios.map((scenario) => scenario.scenarioKind))
  if (kinds.size !== 6) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Calibration scenarios must cover every required kind.' })
  }
})

const legacyStyleSchema = z.enum([
  'clean_subtitle', 'small_premium_subtitle', 'bold_social_captions',
  'keyword_emphasis_captions', 'karaoke_word_by_word',
  'sentence_block_captions', 'documentary_lower_third',
  'education_label_captions', 'minimal_accessibility_captions',
  'caption_icon_callout', 'custom',
])
const legacyAdapterSchema: z.ZodType<CaptionLegacyStyleAdapter> = z.object({
  schemaVersion: z.literal(CAPTION_LEGACY_STYLE_ADAPTER_VERSION),
  adapterId: safeKey,
  adapterDigestSha256: sha256,
  legacyStyleId: legacyStyleSchema,
  mappedProjectMode: z.enum([
    'accessibility_first', 'clean_long_form', 'dynamic_short_form',
    'cinematic_editorial', 'educational_explainer', 'multi_speaker_dialogue',
    'brand_directed', 'minimal_support',
  ]).nullable(),
  mappedTypographyRoleId: safeKey.nullable(),
  mappedColorRoleId: safeKey.nullable(),
  mappedTreatmentCode: safeKey.nullable(),
  customStyleApprovalRef: refSchema.nullable(),
  disposition: z.enum(['adapted', 'blocked_custom_style_requires_approval']),
  deprecatedPresetRemainsReadable: z.literal(true),
  mutablePresetAuthorityGranted: z.literal(false),
  executionAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const PLATFORM_PROFILES: Record<CaptionPlatformProfileId, {
  safeWidthBasisPoints: number
  baseHeightBasisPoints: number
  minimumHeightBasisPoints: number
  maximumHeightBasisPoints: number
  maximumLines: number
  lineHeightMilli: number
}> = {
  phone_portrait: {
    safeWidthBasisPoints: 8_400,
    baseHeightBasisPoints: 520,
    minimumHeightBasisPoints: 380,
    maximumHeightBasisPoints: 1_100,
    maximumLines: 2,
    lineHeightMilli: 1_150,
  },
  phone_square: {
    safeWidthBasisPoints: 8_200,
    baseHeightBasisPoints: 500,
    minimumHeightBasisPoints: 360,
    maximumHeightBasisPoints: 1_000,
    maximumLines: 2,
    lineHeightMilli: 1_160,
  },
  desktop_widescreen: {
    safeWidthBasisPoints: 7_800,
    baseHeightBasisPoints: 500,
    minimumHeightBasisPoints: 320,
    maximumHeightBasisPoints: 900,
    maximumLines: 2,
    lineHeightMilli: 1_180,
  },
  television_widescreen: {
    safeWidthBasisPoints: 7_600,
    baseHeightBasisPoints: 540,
    minimumHeightBasisPoints: 360,
    maximumHeightBasisPoints: 920,
    maximumLines: 2,
    lineHeightMilli: 1_200,
  },
}

const LEGIBILITY_LADDER: CaptionLegibilityTreatment[] = [
  'none', 'shadow', 'stroke', 'backplate', 'local_scrim',
]

const LEGACY_STYLE_MAP: Record<Exclude<CaptionLegacyStyleId, 'custom'>, {
  projectMode: NonNullable<CaptionLegacyStyleAdapter['mappedProjectMode']>
  typographyRoleId: string
  colorRoleId: string
  treatmentCode: string
}> = {
  clean_subtitle: {
    projectMode: 'clean_long_form', typographyRoleId: 'primary_speech',
    colorRoleId: 'base_speech', treatmentCode: 'clean_phrase',
  },
  small_premium_subtitle: {
    projectMode: 'cinematic_editorial', typographyRoleId: 'primary_speech',
    colorRoleId: 'base_speech', treatmentCode: 'premium_minimal',
  },
  bold_social_captions: {
    projectMode: 'dynamic_short_form', typographyRoleId: 'hero_display',
    colorRoleId: 'hero_phrase', treatmentCode: 'controlled_creator_phrase',
  },
  keyword_emphasis_captions: {
    projectMode: 'dynamic_short_form', typographyRoleId: 'primary_speech',
    colorRoleId: 'emphasis', treatmentCode: 'selective_keyword_emphasis',
  },
  karaoke_word_by_word: {
    projectMode: 'dynamic_short_form', typographyRoleId: 'primary_speech',
    colorRoleId: 'active_speech', treatmentCode: 'qualified_word_timing_only',
  },
  sentence_block_captions: {
    projectMode: 'clean_long_form', typographyRoleId: 'primary_speech',
    colorRoleId: 'base_speech', treatmentCode: 'sentence_block',
  },
  documentary_lower_third: {
    projectMode: 'clean_long_form', typographyRoleId: 'quotation',
    colorRoleId: 'historical_context', treatmentCode: 'documentary_lower_third',
  },
  education_label_captions: {
    projectMode: 'educational_explainer', typographyRoleId: 'technical',
    colorRoleId: 'emphasis', treatmentCode: 'educational_label',
  },
  minimal_accessibility_captions: {
    projectMode: 'accessibility_first', typographyRoleId: 'primary_speech',
    colorRoleId: 'base_speech', treatmentCode: 'stable_accessibility',
  },
  caption_icon_callout: {
    projectMode: 'educational_explainer', typographyRoleId: 'technical',
    colorRoleId: 'emphasis', treatmentCode: 'caption_to_visual_candidate',
  },
}

function digestField<T extends Record<string, unknown>>(value: T, field: keyof T): string {
  return calculateSkillContractDigest(value, field as string)
}

function exactRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function makeRef(id: string, version: string, contentHash: string): CaptionDomainRef {
  return { id, version, contentHash }
}

function scopeKey(scope: CaptionDomainCanonicalScope): string {
  return calculateSkillContractDigest(
    { scope, scopeDigestSha256: '' },
    'scopeDigestSha256',
  )
}

function normalizeDisplayedText(value: string): string {
  return value.normalize('NFKC').replace(/\s/gu, '')
}

function textGraphemeCount(value: string, locale: string): number {
  return Array.from(new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(value)).length
}

function derivePlatformProfile(
  frame: z.infer<typeof confirmedFrameSchema>,
  viewingTarget: CaptionViewingTarget,
): CaptionPlatformProfileId {
  const squareish = Math.abs(frame.width - frame.height) * 10 <= frame.height * 2
  if (viewingTarget === 'phone') {
    if (frame.width > frame.height && !squareish) {
      throw new Error('Phone Caption profile requires a portrait or square output frame.')
    }
    return squareish ? 'phone_square' : 'phone_portrait'
  }
  if (frame.width <= frame.height) {
    throw new Error('Desktop and television Caption profiles require widescreen output.')
  }
  return viewingTarget === 'television' ? 'television_widescreen' : 'desktop_widescreen'
}

function semanticScaleRange(role: CaptionSemanticStylePhraseProposal['semanticRole']): [number, number] {
  if (role === 'hero_concept') return [13_000, 18_000]
  if (['warning_or_conflict', 'positive_result', 'contrast'].includes(role)) return [9_500, 13_000]
  if (role === 'supporting_detail' || role === 'speaker_identity') return [7_500, 10_500]
  return [8_500, 12_000]
}

function opticalSizing(
  frame: z.infer<typeof confirmedFrameSchema>,
  platformProfileId: CaptionPlatformProfileId,
  semanticRole: CaptionSemanticStylePhraseProposal['semanticRole'],
  requestedScale: number,
): CaptionOpticalSizing {
  const [minimumScale, maximumScale] = semanticScaleRange(semanticRole)
  if (requestedScale < minimumScale || requestedScale > maximumScale) {
    throw new Error(`Semantic scale ${requestedScale} is invalid for ${semanticRole}.`)
  }
  const profile = PLATFORM_PROFILES[platformProfileId]
  const minimum = Math.max(18, Math.round(
    frame.height * profile.minimumHeightBasisPoints / 10_000,
  ))
  const maximum = Math.max(minimum, Math.round(
    frame.height * profile.maximumHeightBasisPoints / 10_000,
  ))
  const base = Math.max(minimum, Math.min(maximum, Math.round(
    frame.height * profile.baseHeightBasisPoints / 10_000,
  )))
  const resolved = Math.max(minimum, Math.min(maximum, Math.round(
    base * requestedScale / 10_000,
  )))
  return {
    platformProfileId,
    baseFontSizePixels: base,
    resolvedFontSizePixels: resolved,
    minimumFontSizePixels: minimum,
    maximumFontSizePixels: maximum,
    lineHeightMilli: profile.lineHeightMilli,
    safeWidthBasisPoints: profile.safeWidthBasisPoints,
    maximumLines: profile.maximumLines,
    semanticScaleBasisPoints: requestedScale,
    sizeDerivedFromRoleAndOutputProfile: true,
    characterCountDrivenSizeOscillationAllowed: false,
  }
}

function lineRulesPass(
  candidate: CaptionSemanticLineCandidate,
  language: string,
  phraseText: string,
  sourceWordIds: string[],
  protectedGroups: CaptionSemanticStylePhraseProposal['protectedTokenGroups'],
  sizing: CaptionOpticalSizing,
  availableAdvance: number,
): boolean {
  if (candidate.lines.length > sizing.maximumLines
    || candidate.lines.some((line) => line.shapedAdvanceMilliEm > availableAdvance)) return false
  if (candidate.lines.some((line) =>
    line.graphemeCount !== textGraphemeCount(line.displayedText, language))) return false
  const candidateWordIds = candidate.lines.flatMap((line) => line.exactSourceWordIds)
  if (candidateWordIds.length !== sourceWordIds.length
    || candidateWordIds.some((wordId, index) => wordId !== sourceWordIds[index])) return false
  if (normalizeDisplayedText(candidate.lines.map((line) => line.displayedText).join(''))
    !== normalizeDisplayedText(phraseText)) return false
  const startsWithClosing = /^[,.;:!?%)\]}、。！？：；）》」』】]/u
  const endsWithOpening = /[([{（《「『【]$/u
  if (candidate.lines.some((line) =>
    startsWithClosing.test(line.displayedText.trim())
      || endsWithOpening.test(line.displayedText.trim()))) return false
  if (sourceWordIds.length > 3
    && candidate.lines.length > 1
    && candidate.lines.at(-1)!.exactSourceWordIds.length === 1) return false
  for (const group of protectedGroups) {
    const containingLines = candidate.lines.filter((line) =>
      group.exactSourceWordIds.some((wordId) => line.exactSourceWordIds.includes(wordId)))
    if (containingLines.length !== 1
      || group.exactSourceWordIds.some((wordId) =>
        !containingLines[0].exactSourceWordIds.includes(wordId))) return false
  }
  return true
}

function chooseLineCandidate(
  candidates: CaptionSemanticLineCandidate[],
  language: string,
  phraseText: string,
  sourceWordIds: string[],
  protectedGroups: CaptionSemanticStylePhraseProposal['protectedTokenGroups'],
  sizing: CaptionOpticalSizing,
  frameWidth: number,
): { candidate: CaptionSemanticLineCandidate; availableAdvance: number } | null {
  const availablePixels = frameWidth * sizing.safeWidthBasisPoints / 10_000
  const availableAdvance = Math.floor(
    availablePixels / sizing.resolvedFontSizePixels * 1_000,
  )
  const valid = candidates.filter((candidate) => lineRulesPass(
    candidate, language, phraseText, sourceWordIds, protectedGroups, sizing, availableAdvance,
  ))
  valid.sort((left, right) => {
    const leftWidths = left.lines.map((line) => line.shapedAdvanceMilliEm)
    const rightWidths = right.lines.map((line) => line.shapedAdvanceMilliEm)
    const leftImbalance = Math.max(...leftWidths) - Math.min(...leftWidths)
    const rightImbalance = Math.max(...rightWidths) - Math.min(...rightWidths)
    return leftImbalance - rightImbalance
      || left.lines.length - right.lines.length
      || left.candidateId.localeCompare(right.candidateId)
  })
  return valid[0] ? { candidate: valid[0], availableAdvance } : null
}

function treatmentAllowed(
  treatment: CaptionLegibilityTreatment,
  legibility: CaptionStyleProfilePayload['legibility'],
): boolean {
  if (treatment === 'none') return true
  if (treatment === 'shadow') return legibility.shadowAllowed
  if (treatment === 'stroke') return legibility.strokeAllowed
  if (treatment === 'backplate') return legibility.backplateAllowed
  return legibility.localScrimAllowed
}

function chooseLegibilityCandidate(
  candidates: CaptionSemanticStylePhraseProposal['legibilityCandidates'],
  legibility: CaptionStyleProfilePayload['legibility'],
): CaptionSemanticStylePhraseProposal['legibilityCandidates'][number] | null {
  const uniqueTreatments = new Set(candidates.map((candidate) => candidate.treatment))
  if (uniqueTreatments.size !== candidates.length) {
    throw new Error('Caption legibility candidates must have unique treatments.')
  }
  return LEGIBILITY_LADDER.map((treatment) =>
    candidates.find((candidate) => candidate.treatment === treatment))
    .find((candidate) => candidate !== undefined
      && treatmentAllowed(candidate.treatment, legibility)
      && candidate.measuredContrastRatioMilli >= legibility.minimumContrastRatioMilli) ?? null
}

function resolutionRef(resolution: CaptionFontResolution): CaptionDomainRef {
  return makeRef(
    resolution.resolutionId,
    resolution.schemaVersion,
    resolution.resolutionDigestSha256,
  )
}

function phraseProjectionRef(projection: CaptionPhraseLineageProjection): CaptionDomainRef {
  return makeRef(
    projection.projectionId,
    projection.schemaVersion,
    projection.projectionDigestSha256,
  )
}

function styleProfileRef(contract: CaptionDomainContract<'style_profile'>): CaptionDomainRef {
  return makeRef(contract.contractId, contract.contractVersion, contract.contractDigestSha256)
}

function occupancyRef(manifest: CaptionVisualOccupancyManifest): CaptionDomainRef {
  return makeRef(manifest.manifestId, manifest.schemaVersion, manifest.manifestDigestSha256)
}

function requireStyleProfile(value: unknown): CaptionDomainContract<'style_profile'> {
  const parsed: AnyCaptionDomainContract = parseCaptionDomainContract(value)
  if (parsed.contractKind !== 'style_profile') {
    throw new Error('CAP-10 requires an exact Caption style profile contract.')
  }
  return parsed
}

function exactScope(left: CaptionDomainCanonicalScope, right: CaptionDomainCanonicalScope): boolean {
  return scopeKey(left) === scopeKey(right)
}

export function parseCaptionSemanticStylePlan(value: unknown): CaptionSemanticStylePlan {
  assertClosedContractTree(value, 'Caption semantic style plan')
  const parsed = planSchema.parse(value)
  if (parsed.canonicalScope.sceneId === null
    || parsed.confirmedOutputFrame.outputId !== parsed.canonicalScope.outputId
    || derivePlatformProfile(parsed.confirmedOutputFrame, parsed.viewingTarget)
      !== parsed.platformProfileId
    || !parsed.canonicalScope.authorizedFrameRanges.some((range) =>
      parsed.selectedRegionFrameRange.startFrame >= range.startFrame
        && parsed.selectedRegionFrameRange.endFrameExclusive <= range.endFrameExclusive)) {
    throw new Error('Caption semantic style plan has stale scope, frame, or platform lineage.')
  }
  for (const phrase of parsed.phrases) {
    const lineIds = phrase.lineLayout.lines.map((line) => line.lineId)
    const wordIds = phrase.lineLayout.lines.flatMap((line) => line.exactSourceWordIds)
    const expectedSizing = opticalSizing(
      parsed.confirmedOutputFrame,
      parsed.platformProfileId,
      phrase.semanticRole,
      phrase.opticalSizing.semanticScaleBasisPoints,
    )
    const selectedAndRejected = [
      phrase.lineLayout.selectedCandidateId,
      ...phrase.lineLayout.rejectedCandidateIds,
    ]
    if (new Set(phrase.exactSourceWordIds).size !== phrase.exactSourceWordIds.length
      || new Set(phrase.emphasisSourceWordIds).size !== phrase.emphasisSourceWordIds.length
      || phrase.emphasisSourceWordIds.some((wordId) =>
        !phrase.exactSourceWordIds.includes(wordId))
      || new Set(lineIds).size !== lineIds.length
      || new Set(selectedAndRejected).size !== selectedAndRejected.length
      || wordIds.some((wordId, index) => wordId !== phrase.exactSourceWordIds[index])
      || normalizeDisplayedText(phrase.lineLayout.lines
        .map((line) => line.displayedText).join(''))
        !== normalizeDisplayedText(phrase.displayedText)
      || phrase.lineLayout.lines.length > phrase.opticalSizing.maximumLines
      || phrase.lineLayout.lines.some((line) =>
        line.shapedAdvanceMilliEm > phrase.lineLayout.availableLineAdvanceMilliEm
          || line.graphemeCount !== textGraphemeCount(line.displayedText, phrase.languageTag))
      || phrase.protectedTokenGroups.some((group) => {
        const containingLines = phrase.lineLayout.lines.filter((line) =>
          group.exactSourceWordIds.some((wordId) =>
            line.exactSourceWordIds.includes(wordId)))
        return containingLines.length !== 1
          || group.exactSourceWordIds.some((wordId) =>
            !containingLines[0].exactSourceWordIds.includes(wordId))
      })
      || phrase.lineLayout.maximumLineAdvanceMilliEm
        !== Math.max(...phrase.lineLayout.lines.map((line) => line.shapedAdvanceMilliEm))
      || phrase.lineLayout.widthUtilizationBasisPoints !== Math.round(
        phrase.lineLayout.maximumLineAdvanceMilliEm * 10_000
          / phrase.lineLayout.availableLineAdvanceMilliEm,
      )
      || phrase.opticalSizing.resolvedFontSizePixels
        < phrase.opticalSizing.minimumFontSizePixels
      || phrase.opticalSizing.resolvedFontSizePixels
        > phrase.opticalSizing.maximumFontSizePixels
      || JSON.stringify(phrase.opticalSizing) !== JSON.stringify(expectedSizing)
      || (phrase.emphasisSourceWordIds.length > 0) !== (phrase.nonColorEmphasis !== null)
      || (phrase.selectedLegibilityTreatment === null)
        !== (phrase.selectedContrastRatioMilli === null
          || phrase.legibilityEvidenceRef === null)
      || (phrase.fontResolutionDisposition !== 'resolved_private_internal'
        && !phrase.blockerCodes.includes(`font_${phrase.fontResolutionDisposition}`))
      || (phrase.lineLayout.measurementMode !== 'qualified_private_runtime'
        && !phrase.blockerCodes.includes('qualified_shaped_measurement_evidence_required'))
      || (phrase.executionReady
        && (phrase.fontResolutionDisposition !== 'resolved_private_internal'
          || phrase.lineLayout.measurementMode !== 'qualified_private_runtime'
          || phrase.selectedLegibilityTreatment === null))
      || phrase.executionReady !== (phrase.blockerCodes.length === 0)) {
      throw new Error(`Caption semantic style phrase ${phrase.phraseId} is inconsistent.`)
    }
  }
  const expected = digestField(
    parsed as unknown as Record<string, unknown>,
    'planDigestSha256',
  )
  if (expected !== parsed.planDigestSha256) {
    throw new Error('Caption semantic style plan digest verification failed.')
  }
  return parsed
}

export function parseCaptionStyleCalibrationPreview(
  value: unknown,
): CaptionStyleCalibrationPreview {
  assertClosedContractTree(value, 'Caption style calibration preview')
  const parsed = calibrationSchema.parse(value)
  const expected = digestField(
    parsed as unknown as Record<string, unknown>,
    'previewDigestSha256',
  )
  if (expected !== parsed.previewDigestSha256) {
    throw new Error('Caption style calibration preview digest verification failed.')
  }
  return parsed
}

export function parseCaptionLegacyStyleAdapter(value: unknown): CaptionLegacyStyleAdapter {
  assertClosedContractTree(value, 'Caption legacy style adapter')
  const parsed = legacyAdapterSchema.parse(value)
  const isCustom = parsed.legacyStyleId === 'custom'
  if (isCustom
    ? ((parsed.customStyleApprovalRef === null)
      !== (parsed.disposition === 'blocked_custom_style_requires_approval'))
    : (parsed.customStyleApprovalRef !== null
      || parsed.disposition !== 'adapted'
      || parsed.mappedProjectMode === null
      || parsed.mappedTypographyRoleId === null
      || parsed.mappedColorRoleId === null
      || parsed.mappedTreatmentCode === null)) {
    throw new Error('Caption legacy style adapter semantics are invalid.')
  }
  const expected = digestField(
    parsed as unknown as Record<string, unknown>,
    'adapterDigestSha256',
  )
  if (expected !== parsed.adapterDigestSha256) {
    throw new Error('Caption legacy style adapter digest verification failed.')
  }
  return parsed
}

export function adaptLegacyCaptionStyle(input: {
  adapterId: string
  legacyStyleId: CaptionLegacyStyleId
  customStyleApprovalRef?: CaptionDomainRef
}): CaptionLegacyStyleAdapter {
  const adapterId = safeKey.parse(input.adapterId)
  const legacyStyleId = legacyStyleSchema.parse(input.legacyStyleId)
  const customStyleApprovalRef = input.customStyleApprovalRef === undefined
    ? null : refSchema.parse(input.customStyleApprovalRef)
  const mapping = legacyStyleId === 'custom' ? null : LEGACY_STYLE_MAP[legacyStyleId]
  const withoutDigest: Omit<CaptionLegacyStyleAdapter, 'adapterDigestSha256'> = {
    schemaVersion: CAPTION_LEGACY_STYLE_ADAPTER_VERSION,
    adapterId,
    legacyStyleId,
    mappedProjectMode: mapping?.projectMode ?? null,
    mappedTypographyRoleId: mapping?.typographyRoleId ?? null,
    mappedColorRoleId: mapping?.colorRoleId ?? null,
    mappedTreatmentCode: mapping?.treatmentCode ?? null,
    customStyleApprovalRef,
    disposition: legacyStyleId === 'custom' && customStyleApprovalRef === null
      ? 'blocked_custom_style_requires_approval' : 'adapted',
    deprecatedPresetRemainsReadable: true,
    mutablePresetAuthorityGranted: false,
    executionAuthorityGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionLegacyStyleAdapter({
    ...withoutDigest,
    adapterDigestSha256: digestField(
      { ...withoutDigest, adapterDigestSha256: '' },
      'adapterDigestSha256',
    ),
  })
}

export function createCaptionSemanticStyleBundle(input: {
  planId: string
  canonicalScope: unknown
  phraseLineageProjection: unknown
  styleProfileContract: unknown
  fontRegistryRef: unknown
  fontResolutions: unknown[]
  occupancyManifest: unknown
  confirmedOutputFrame: unknown
  viewingTarget: CaptionViewingTarget
  phraseProposals: unknown[]
  legacyStyleId?: CaptionLegacyStyleId
  customStyleApprovalRef?: CaptionDomainRef
}): CaptionSemanticStyleBundle {
  assertClosedContractTree(input, 'Caption semantic style bundle input')
  const planId = safeKey.parse(input.planId)
  const canonicalScope = scopeSchema.parse(input.canonicalScope)
  const phraseProjection = parseCaptionPhraseLineageProjection(
    input.phraseLineageProjection,
  )
  const styleProfile = requireStyleProfile(input.styleProfileContract)
  const fontRegistryRef = refSchema.parse(input.fontRegistryRef)
  const fontResolutions = input.fontResolutions.map(parseCaptionFontResolution)
  const occupancy = parseCaptionVisualOccupancyManifest(input.occupancyManifest)
  const frame = confirmedFrameSchema.parse(input.confirmedOutputFrame)
  const viewingTarget = viewingTargetSchema.parse(input.viewingTarget)
  const proposals = input.phraseProposals.map((proposal) =>
    phraseProposalSchema.parse(proposal))
  if (!exactScope(canonicalScope, styleProfile.canonicalScope)
    || !exactScope(canonicalScope, occupancy.canonicalScope)) {
    throw new Error('CAP-10 inputs do not share the exact canonical scope.')
  }
  if (canonicalScope.sceneId === null || occupancy.requestedSceneId !== canonicalScope.sceneId) {
    throw new Error('CAP-10 requires one exact scene scope.')
  }
  if (frame.outputId !== canonicalScope.outputId
    || !exactRef(frame.frameRef, styleProfile.sourceBindings.confirmedOutputFrameRef)) {
    throw new Error('CAP-10 confirmed frame lineage is stale.')
  }
  if (new Set(fontResolutions.map((resolution) => resolution.resolutionId)).size
      !== fontResolutions.length
    || fontResolutions.some((resolution) =>
      !exactRef(resolution.registryRef, fontRegistryRef))) {
    throw new Error('CAP-10 font resolutions have stale or duplicate registry lineage.')
  }
  if (new Set(proposals.map((proposal) => proposal.phraseId)).size !== proposals.length
    || proposals.length !== phraseProjection.phrases.length) {
    throw new Error('CAP-10 phrase proposals must cover every phrase exactly once.')
  }
  const selectedRegionId = occupancy.provisionalSelectedCandidateRegionId
  const selectedRegion = occupancy.regions.find((region) =>
    region.regionId === selectedRegionId)
  if (!selectedRegionId || !selectedRegion || !selectedRegion.selectableForStableCaption) {
    throw new Error('CAP-10 has no selectable Caption occupancy region.')
  }
  const platformProfileId = derivePlatformProfile(frame, viewingTarget)
  const profile = styleProfile.payload
  const phraseById = new Map(phraseProjection.phrases.map((phrase) => [phrase.phraseId, phrase]))
  const resolutionById = new Map(fontResolutions.map((resolution) => [
    resolution.resolutionId, resolution,
  ]))
  let invalidLegibility = false
  let invalidFont = false
  const phrases: CaptionResolvedSemanticStylePhrase[] = proposals.map((proposal) => {
    const phrase = phraseById.get(proposal.phraseId)
    if (!phrase) throw new Error(`CAP-10 proposal ${proposal.phraseId} has no phrase lineage.`)
    const role = profile.typographyRoles.find((item) =>
      item.roleId === proposal.typographyRoleId)
    if (!role || !role.allowedSceneIds.includes(canonicalScope.sceneId!)) {
      throw new Error(`CAP-10 phrase ${proposal.phraseId} uses an unapproved typography role.`)
    }
    const color = profile.colorRoles.find((item) =>
      item.colorRoleId === proposal.colorRoleId)
    if (!color || !role.colorRoleIds.includes(color.colorRoleId)
      || color.nonColorCounterpartRequired !== true) {
      throw new Error(`CAP-10 phrase ${proposal.phraseId} uses an unapproved color role.`)
    }
    if (new Set(proposal.emphasisSourceWordIds).size !== proposal.emphasisSourceWordIds.length
      || proposal.emphasisSourceWordIds.some((wordId) =>
        !phrase.exactSourceWordIds.includes(wordId))
      || (proposal.emphasisSourceWordIds.length > 0)
        !== (proposal.nonColorEmphasis !== null)) {
      throw new Error(`CAP-10 phrase ${proposal.phraseId} has invalid emphasis semantics.`)
    }
    for (const group of proposal.protectedTokenGroups) {
      if (new Set(group.exactSourceWordIds).size !== group.exactSourceWordIds.length
        || group.exactSourceWordIds.some((wordId) =>
          !phrase.exactSourceWordIds.includes(wordId))) {
        throw new Error(`CAP-10 phrase ${proposal.phraseId} has invalid protected tokens.`)
      }
    }
    if (new Set(proposal.protectedTokenGroups.map((group) => group.groupId)).size
      !== proposal.protectedTokenGroups.length
      || new Set(proposal.lineCandidates.map((candidate) => candidate.candidateId)).size
        !== proposal.lineCandidates.length
      || proposal.lineCandidates.some((candidate) =>
        new Set(candidate.lines.map((line) => line.lineId)).size !== candidate.lines.length)) {
      throw new Error(`CAP-10 phrase ${proposal.phraseId} has duplicate candidate lineage.`)
    }
    const resolution = resolutionById.get(proposal.fontResolutionId)
    if (!resolution
      || resolution.languageTag.toLowerCase() !== proposal.languageTag.toLowerCase()
      || resolution.textDigestSha256 !== createHash('sha256')
        .update(phrase.displayedText, 'utf8').digest('hex')) {
      throw new Error(`CAP-10 phrase ${proposal.phraseId} has stale font resolution.`)
    }
    if (resolution.runs.some((run) => run.script !== 'common'
      && !role.supportedScriptCodes.includes(run.script))) {
      throw new Error(`CAP-10 phrase ${proposal.phraseId} uses an unsupported script role.`)
    }
    const sizing = opticalSizing(
      frame, platformProfileId, proposal.semanticRole,
      proposal.requestedSemanticScaleBasisPoints,
    )
    const selectedLine = chooseLineCandidate(
      proposal.lineCandidates, proposal.languageTag, phrase.displayedText, phrase.exactSourceWordIds,
      proposal.protectedTokenGroups, sizing, frame.width,
    )
    const legibility = chooseLegibilityCandidate(
      proposal.legibilityCandidates, profile.legibility,
    )
    const blockers: string[] = []
    if (selectedLine === null) {
      throw new Error(`CAP-10 phrase ${proposal.phraseId} has no valid language-aware line layout.`)
    }
    if (legibility === null) {
      blockers.push('no_approved_legibility_treatment_passed')
      invalidLegibility = true
    }
    if (!resolution.executionReady) {
      blockers.push(`font_${resolution.disposition}`)
      if (resolution.disposition !== 'resolved_contract_fixture') invalidFont = true
    }
    if (selectedLine.candidate.measurementMode !== 'qualified_private_runtime') {
      blockers.push('qualified_shaped_measurement_evidence_required')
    }
    if (!occupancy.evidenceQualifiedForPrivateRuntime) {
      blockers.push('qualified_visual_occupancy_evidence_required')
    }
    const fallbackLine = selectedLine
    const maximumAdvance = Math.max(
      ...fallbackLine.candidate.lines.map((line) => line.shapedAdvanceMilliEm),
    )
    return {
      phraseId: phrase.phraseId,
      displayedText: phrase.displayedText,
      exactSourceWordIds: phrase.exactSourceWordIds,
      semanticRole: proposal.semanticRole,
      clauseRole: proposal.clauseRole,
      languageTag: proposal.languageTag,
      typographyRoleId: proposal.typographyRoleId,
      colorRoleId: proposal.colorRoleId,
      emphasisSourceWordIds: proposal.emphasisSourceWordIds,
      nonColorEmphasis: proposal.nonColorEmphasis,
      protectedTokenGroups: proposal.protectedTokenGroups,
      fontResolutionRef: resolutionRef(resolution),
      fontResolutionDisposition: resolution.disposition,
      lineLayout: {
        selectedCandidateId: fallbackLine.candidate.candidateId,
        lines: fallbackLine.candidate.lines,
        rejectedCandidateIds: proposal.lineCandidates
          .filter((candidate) => candidate.candidateId !== fallbackLine.candidate.candidateId)
          .map((candidate) => candidate.candidateId),
        measurementMode: fallbackLine.candidate.measurementMode,
        measurementEvidenceRef: fallbackLine.candidate.measurementEvidenceRef,
        maximumLineAdvanceMilliEm: maximumAdvance,
        availableLineAdvanceMilliEm: fallbackLine.availableAdvance,
        widthUtilizationBasisPoints: Math.round(
          maximumAdvance * 10_000 / fallbackLine.availableAdvance,
        ),
        languageAwareRulesApplied: true,
        protectedGroupsPreserved: true,
        sourceWordOrderPreserved: true,
        displayedTextPreserved: true,
        orphanLineAvoided: true,
      },
      opticalSizing: sizing,
      selectedLegibilityTreatment: legibility?.treatment ?? null,
      selectedContrastRatioMilli: legibility?.measuredContrastRatioMilli ?? null,
      legibilityEvidenceRef: legibility?.evidenceRef ?? null,
      accessibleCompleteWordingRetained: true,
      semanticMeaningPreserved: true,
      colorIsSoleMeaningCarrier: false,
      executionReady: blockers.length === 0,
      blockerCodes: blockers,
    }
  })
  const blockerCodes = Array.from(new Set(phrases.flatMap((phrase) => phrase.blockerCodes)))
  const qualificationState: CaptionSemanticStylePlan['qualificationState'] =
    invalidLegibility ? 'blocked_no_legible_treatment'
        : invalidFont ? 'blocked_font_resolution'
          : blockerCodes.length > 0 ? 'contract_validated_runtime_gated'
            : 'ready_private_internal'
  const withoutDigest: Omit<CaptionSemanticStylePlan, 'planDigestSha256'> = {
    schemaVersion: CAPTION_SEMANTIC_STYLE_PLAN_VERSION,
    planId,
    canonicalScope,
    phraseLineageProjectionRef: phraseProjectionRef(phraseProjection),
    styleProfileRef: styleProfileRef(styleProfile),
    fontRegistryRef,
    occupancyManifestRef: occupancyRef(occupancy),
    confirmedOutputFrame: frame,
    viewingTarget,
    platformProfileId,
    selectedRegionId,
    selectedRegionFrameRange: selectedRegion.frameRange,
    phrases,
    fallbackLadder: [
      'measured_semantic_phrase', 'simpler_semantic_line_layout',
      'stable_verbatim_phrase', 'deterministic_legacy_segmentation',
      'accessible_sidecar_only',
    ],
    qualificationState,
    blockerCodes,
    everyPhraseHasExactSourceLineage: true,
    everyLineHasMeasuredGeometry: true,
    languageAwareLineBreakingApplied: true,
    approvedTypographyRolesOnly: true,
    approvedColorRolesOnly: true,
    adaptiveLegibilityApplied: true,
    accessibleProjectionRequired: true,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    arbitraryCssIncluded: false,
    arbitraryAssTagsIncluded: false,
    modelAuthoredCodeIncluded: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    finalCanvasAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const plan = parseCaptionSemanticStylePlan({
    ...withoutDigest,
    planDigestSha256: digestField(
      { ...withoutDigest, planDigestSha256: '' },
      'planDigestSha256',
    ),
  })
  const planRef = makeRef(plan.planId, plan.schemaVersion, plan.planDigestSha256)
  const scenarioKinds: CaptionStyleCalibrationPreview['scenarios'][number]['scenarioKind'][] = [
    'light_simple_background', 'dark_simple_background', 'busy_background',
    'protected_region_pressure', 'multilingual_fallback',
    'reduced_motion_counterpart',
  ]
  const scenarios = scenarioKinds.map((scenarioKind, index) => {
    const phrase = phrases[index % phrases.length]
    return {
      scenarioId: `${planId}.calibration.${scenarioKind}`,
      scenarioKind,
      phraseId: phrase.phraseId,
      platformProfileId,
      typographyRoleId: phrase.typographyRoleId,
      colorRoleId: phrase.colorRoleId,
      fontResolutionRef: phrase.fontResolutionRef,
      selectedLegibilityTreatment: phrase.selectedLegibilityTreatment
        ?? LEGIBILITY_LADDER.find((treatment) =>
          treatmentAllowed(treatment, profile.legibility))!,
      expectedRegionId: selectedRegionId,
      expectedChecks: [
        'exact_font_metrics', 'line_break_stability', 'contrast', 'protected_region_clearance',
        'preview_final_parity', 'direct_raster_inspection',
      ],
    }
  })
  const previewWithoutDigest: Omit<CaptionStyleCalibrationPreview, 'previewDigestSha256'> = {
    schemaVersion: CAPTION_STYLE_CALIBRATION_PREVIEW_VERSION,
    previewId: `${planId}.calibration`,
    semanticStylePlanRef: planRef,
    scenarios,
    previewState: plan.qualificationState === 'ready_private_internal'
      ? 'ready_for_private_render' : 'planned_contract_only',
    renderedMediaRef: null,
    actualRenderedPixelsInspected: false,
    directRasterInspectionRequiredAfterRender: true,
    deterministicQaRequiredAfterRender: true,
    independentFinalQaStillRequired: true,
    browserLocalCompletionAllowed: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const calibrationPreview = parseCaptionStyleCalibrationPreview({
    ...previewWithoutDigest,
    previewDigestSha256: digestField(
      { ...previewWithoutDigest, previewDigestSha256: '' },
      'previewDigestSha256',
    ),
  })
  const legacyStyleAdapter = input.legacyStyleId === undefined ? null
    : adaptLegacyCaptionStyle({
      adapterId: `${planId}.legacy-style`,
      legacyStyleId: input.legacyStyleId,
      customStyleApprovalRef: input.customStyleApprovalRef,
    })
  return { plan, calibrationPreview, legacyStyleAdapter }
}
