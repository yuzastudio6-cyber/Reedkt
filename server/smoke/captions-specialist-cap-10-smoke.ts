import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  adaptLegacyCaptionStyle,
  createCaptionSemanticStyleBundle,
  parseCaptionLegacyStyleAdapter,
  parseCaptionSemanticStylePlan,
  parseCaptionStyleCalibrationPreview,
} from '../captions-specialist/caption-semantic-style'
import {
  createCaptionApprovedFontRegistry,
  createCaptionFontAssetRecord,
  createCaptionFontRuntimeQualification,
  resolveCaptionFontPlan,
} from '../captions-specialist/caption-font-runtime'
import { createCaptionDomainContract } from '../captions-specialist/caption-domain-contracts'
import { parseCaptionPhraseLineageProjection } from '../captions-specialist/caption-transcript-lineage'
import { parseCaptionVisualOccupancyManifest } from '../captions-specialist/caption-visual-intelligence-support'
import { CAPTION_DESIGN_COMPOSITE } from '../captions-specialist/caption-design-composite'
import {
  CAPTION_FONT_ASSET_RECORD_VERSION,
  CAPTION_FONT_RUNTIME_QUALIFICATION_VERSION,
  type CaptionFontAssetRecord,
  type CaptionFontRuntimeQualification,
  type CaptionUnicodeScript,
} from '../../src/types/caption-font-runtime'
import {
  CAPTION_PHRASE_LINEAGE_PROJECTION_VERSION,
  type CaptionPhraseLineageProjection,
} from '../../src/types/caption-transcript-lineage'
import {
  CAPTION_VISUAL_OCCUPANCY_MANIFEST_VERSION,
  type CaptionVisualOccupancyManifest,
} from '../../src/types/caption-visual-intelligence-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionLegacyStyleId,
  CaptionSemanticStylePhraseProposal,
} from '../../src/types/caption-semantic-style'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string): CaptionDomainRef {
  return { id, version: `${id}.v1`, contentHash: hash(id) }
}
function digestRecord<T extends Record<string, unknown>>(value: T, field: keyof T): string {
  return calculateSkillContractDigest(value, field as string)
}
function graphemes(value: string, locale: string): number {
  return Array.from(new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(value)).length
}

const scope: CaptionDomainCanonicalScope = {
  ownerUserId: 'owner.cap10',
  workspaceId: 'workspace.cap10',
  projectId: 'project.cap10',
  editSessionId: 'edit.cap10',
  planVersionId: 'plan.cap10.v1',
  approvedSnapshotRef: ref('snapshot.cap10'),
  outputId: 'output.cap10.widescreen',
  sceneId: 'scene.cap10',
  authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 300 }],
}
const confirmedFrameRef = ref('confirmed.frame.cap10')
const transcriptRef = ref('transcript.cap10')
const masterTimingRef = ref('mastertiming.cap10')
const compositeRef: CaptionDomainRef = {
  id: CAPTION_DESIGN_COMPOSITE.compositeId,
  version: CAPTION_DESIGN_COMPOSITE.compositeVersion,
  contentHash: CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
}

const qualifiedUses: Record<
  CaptionFontRuntimeQualification['routes'][number]['routeId'],
  CaptionFontRuntimeQualification['routes'][number]['qualifiedUses']
> = {
  fonttools: ['font_metadata', 'font_subsetting'],
  opentype_sanitizer: ['malformed_font_rejection'],
  icu_grapheme_bidi: ['grapheme_segmentation', 'bidi_resolution'],
  harfbuzz_fribidi: ['glyph_shaping', 'bidi_resolution'],
  libass_multilingual: ['glyph_shaping', 'final_rendering'],
  remotion_canvas_text: ['glyph_shaping', 'preview_rendering'],
}
const fontQualification = createCaptionFontRuntimeQualification({
  schemaVersion: CAPTION_FONT_RUNTIME_QUALIFICATION_VERSION,
  qualificationId: 'caption.font.qualification.cap10.fixture',
  observedAt: '2026-08-04T00:00:00.000Z',
  routes: Object.entries(qualifiedUses).map(([routeId, uses]) => ({
    routeId: routeId as CaptionFontRuntimeQualification['routes'][number]['routeId'],
    status: 'qualified_private_internal' as const,
    version: `${routeId}.fixture.v1`,
    sourceDigestSha256: hash(`${routeId}.source`),
    licenseId: 'fixture-contract-only',
    qualifiedUses: uses,
    evidenceRefs: [ref(`${routeId}.evidence`)],
    blockerCodes: [],
    noNetworkRuntime: true as const,
    privateInputOutputOnly: true as const,
  })),
  previewFinalParityQualified: true,
  runtimeFontDownloadAllowed: false,
  browserFontIntakeAllowed: false,
  wholeRuntimeQualified: false,
  productionQualificationClaimed: false,
})

function fixtureFont(
  id: string,
  scripts: CaptionUnicodeScript[],
  languageTags: string[],
): CaptionFontAssetRecord {
  const bytesHash = hash(`${id}.bytes`)
  return createCaptionFontAssetRecord({
    schemaVersion: CAPTION_FONT_ASSET_RECORD_VERSION,
    fontAssetId: id,
    immutableBinaryRef: {
      id: `${id}.binary`, version: 'caption-private-font-binary-v1',
      contentHash: bytesHash,
    },
    fontBytesSha256: bytesHash,
    byteLength: 4_096,
    format: 'ttf',
    faceIndex: 0,
    names: {
      family: `Fixture ${id}`, subfamily: 'Regular',
      postscriptName: `Fixture-${id}`, version: 'fixture-1',
    },
    license: {
      spdxId: 'OFL-1.1', sourceRef: ref(`${id}.license.source`),
      reviewRef: ref(`${id}.license.review`), commercialUseApproved: true,
      embeddingApproved: true, redistributionApproved: true,
    },
    intake: {
      fontToolsStatus: 'blocked', openTypeSanitizerStatus: 'blocked',
      malformedFontRejected: false, subsetRoundTripPassed: false,
      evidenceRefs: [],
    },
    coverage: {
      scripts, languageTags, glyphCoverageDigestSha256: hash(`${id}.coverage`),
      missingGlyphPolicy: 'fallback_then_block',
    },
    rendererEvidence: {
      remotionPrivatePassed: false, libassPrivatePassed: false,
      previewFinalMetricParityPassed: false, parityEvidenceRef: null,
    },
    admissionStatus: 'fixture_contract_only',
    privateArtifact: true,
    browserShareable: false,
    runtimeDownloadAllowed: false,
    productionApproved: false,
  })
}

const commonFont = fixtureFont('font.cap10.common', ['common'], ['en', 'ar'])
const latinFont = fixtureFont('font.cap10.latin', ['latn'], ['en'])
const arabicFont = fixtureFont('font.cap10.arabic', ['arab'], ['ar'])
const fontRegistry = createCaptionApprovedFontRegistry({
  registryId: 'caption.font.registry.cap10.fixture',
  registryMode: 'contract_fixture',
  qualification: fontQualification,
  fontAssets: [commonFont, latinFont, arabicFont],
  fallbackChains: [{
    chainId: 'chain.cap10.common', languagePrefixes: ['en', 'ar'],
    scripts: ['common'], orderedFontAssetIds: [commonFont.fontAssetId],
    colorEmojiAllowed: false,
  }, {
    chainId: 'chain.cap10.latin', languagePrefixes: ['en'],
    scripts: ['latn'], orderedFontAssetIds: [latinFont.fontAssetId],
    colorEmojiAllowed: false,
  }, {
    chainId: 'chain.cap10.arabic', languagePrefixes: ['ar'],
    scripts: ['arab'], orderedFontAssetIds: [arabicFont.fontAssetId],
    colorEmojiAllowed: false,
  }],
})
const fontRegistryRef = {
  id: fontRegistry.registryId,
  version: fontRegistry.schemaVersion,
  contentHash: fontRegistry.registryDigestSha256,
}

const phraseProjectionWithoutDigest: Omit<
  CaptionPhraseLineageProjection,
  'projectionDigestSha256'
> = {
  schemaVersion: CAPTION_PHRASE_LINEAGE_PROJECTION_VERSION,
  projectionId: 'caption.phrases.cap10.fixture',
  canonicalTranscriptRef: transcriptRef,
  alignmentQualificationRef: ref('alignment.cap10'),
  phrases: [{
    phraseId: 'phrase.cap10.ideas',
    displayedText: 'Ideas move through the frame',
    transformation: 'exact',
    transformationApprovalRef: null,
    sourceSegmentIds: ['segment.cap10.one'],
    exactSourceWordIds: ['word.1', 'word.2', 'word.3', 'word.4', 'word.5'],
    startMilliseconds: 0,
    endMillisecondsExclusive: 2_000,
    timestampProvenance: 'asr_native',
    confidenceBasisPoints: 9_500,
    reviewReasons: [],
    reviewEvidenceRefs: [],
    phraseCaptionEligible: true,
    activeWordMotionEligible: true,
    karaokeMotionEligible: false,
    syntheticTimingPreviewOnly: false,
  }, {
    phraseId: 'phrase.cap10.arabic',
    displayedText: 'الأفكار تتحرك',
    transformation: 'translated',
    transformationApprovalRef: ref('translation.approval.cap10'),
    sourceSegmentIds: ['segment.cap10.two'],
    exactSourceWordIds: ['word.6', 'word.7'],
    startMilliseconds: 2_000,
    endMillisecondsExclusive: 3_300,
    timestampProvenance: 'asr_native',
    confidenceBasisPoints: 9_200,
    reviewReasons: [],
    reviewEvidenceRefs: [],
    phraseCaptionEligible: true,
    activeWordMotionEligible: false,
    karaokeMotionEligible: false,
    syntheticTimingPreviewOnly: false,
  }],
  everyPhraseHasExactSourceLineage: true,
  finalWordMotionUsesSyntheticTiming: false,
  finalKaraokeUsesUnforcedTiming: false,
  privateArtifact: true,
  executionAuthorityClaimed: false,
}
const phraseProjection = parseCaptionPhraseLineageProjection({
  ...phraseProjectionWithoutDigest,
  projectionDigestSha256: digestRecord(
    { ...phraseProjectionWithoutDigest, projectionDigestSha256: '' },
    'projectionDigestSha256',
  ),
})

const latinResolution = resolveCaptionFontPlan({
  request: {
    resolutionId: 'font.resolve.cap10.ideas', registryRef: fontRegistryRef,
    languageTag: 'en', text: 'Ideas move through the frame', desiredWeight: 700,
    desiredStyle: 'normal', requiredRenderers: ['remotion', 'libass'],
    allowColorEmoji: false,
  },
  registry: fontRegistry,
  qualification: fontQualification,
})
const arabicResolution = resolveCaptionFontPlan({
  request: {
    resolutionId: 'font.resolve.cap10.arabic', registryRef: fontRegistryRef,
    languageTag: 'ar', text: 'الأفكار تتحرك', desiredWeight: 700,
    desiredStyle: 'normal', requiredRenderers: ['remotion', 'libass'],
    allowColorEmoji: false,
  },
  registry: fontRegistry,
  qualification: fontQualification,
})

const styleProfile = createCaptionDomainContract({
  contractId: 'caption.style.cap10.fixture',
  contractKind: 'style_profile',
  canonicalScope: scope,
  sourceBindings: {
    captionCompositeRef: compositeRef,
    confirmedOutputFrameRef: confirmedFrameRef,
    canonicalTranscriptRef: transcriptRef,
    masterTimingRef,
    storyTimingRef: null,
    captionApprovalEnvelopeRef: null,
  },
  stalenessTuple: [
    compositeRef, confirmedFrameRef, transcriptRef, masterTimingRef,
    ref('style.font.cap10'), ref('style.color.cap10'),
  ],
  payload: {
    projectMode: 'dynamic_short_form',
    typographyRoles: [{
      roleId: 'primary_speech', purposeCode: 'readable_semantic_speech',
      allowedSceneIds: ['scene.cap10'], maximumFrequency: 30,
      fontAssetRef: ref('style.font.cap10'), weightCodes: ['bold'],
      colorRoleIds: ['base_speech', 'emphasis'], motionPresetIds: ['caption.fade'],
      supportedScriptCodes: ['latn', 'arab'], fallbackRoleId: null,
    }],
    colorRoles: [{
      colorRoleId: 'base_speech', semanticPurposeCode: 'primary_readability',
      colorTokenRef: ref('style.color.cap10'), nonColorCounterpartRequired: true,
    }, {
      colorRoleId: 'emphasis', semanticPurposeCode: 'semantic_emphasis',
      colorTokenRef: ref('style.emphasis.cap10'), nonColorCounterpartRequired: true,
    }],
    legibility: {
      minimumContrastRatioMilli: 4_500, strokeAllowed: true,
      shadowAllowed: true, backplateAllowed: true, localScrimAllowed: true,
      backgroundBlurAllowed: false,
    },
    motionLanguage: {
      allowedPrimitiveIds: ['caption.fade'], repetitionLimit: 4,
      reducedMotionReplacementIds: ['caption.cut'], modelAuthoredCodeAllowed: false,
    },
    placementLanguage: {
      preferredZoneIds: ['region.cap10.safe'], fallbackZoneIds: ['region.cap10.fallback'],
      protectedRoleCodes: ['face', 'product'], allowedDepthPlanes: ['foreground_hero'],
    },
  },
  privateArtifact: true,
  byteFree: true,
  authorityBoundary: {
    canonicalApprovalGranted: false,
    snapshotMutationGranted: false,
    timelineMutationGranted: false,
    workCreationGranted: false,
    providerDispatchGranted: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    costAuthorityGranted: false,
    billingAuthorityGranted: false,
    finalQaApprovalGranted: false,
    finalCanvasAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  },
})

const occupancyWithoutDigest: Omit<
  CaptionVisualOccupancyManifest,
  'manifestDigestSha256'
> = {
  schemaVersion: CAPTION_VISUAL_OCCUPANCY_MANIFEST_VERSION,
  manifestId: 'caption.occupancy.cap10.fixture',
  canonicalScope: scope,
  pictureLockRef: ref('picturelock.cap10'),
  finishReadinessRef: ref('finish.cap10'),
  canonicalLayoutOccupancyRef: ref('layout.cap10'),
  supportRequestRef: ref('support.cap10'),
  visualEvidencePacketRef: ref('packet.cap10'),
  visualIntelligenceReportRef: {
    id: 'visual.report.cap10', version: 1,
    contentHash: `sha256:${hash('visual.report.cap10')}`,
  },
  requestedSceneId: 'scene.cap10',
  requestedRange: { startFrame: 0, endFrameExclusive: 300 },
  regions: [{
    regionId: 'region.cap10.safe', sceneId: 'scene.cap10',
    frameRange: { startFrame: 0, endFrameExclusive: 300 },
    role: 'safe_candidate',
    regionBasisPoints: { x: 1_000, y: 6_000, width: 8_000, height: 2_000 },
    confidenceBasisPoints: 9_000,
    temporalStabilityBasisPoints: 9_000,
    measuredContrastRatioMilli: 5_000,
    clutterBasisPoints: 1_000,
    cropResilienceBasisPoints: 9_000,
    compositionBalanceBasisPoints: 9_000,
    uncertaintyCode: null,
    protected: false,
    overlapsProtectedRegionIds: [],
    candidateScoreBasisPoints: 9_000,
    selectableForStableCaption: true,
    sourceObservationId: 'region.cap10.safe',
    evidenceRefs: [{
      id: 'visual.region.cap10', version: 1,
      contentHash: `sha256:${hash('visual.region.cap10')}`,
    }],
  }],
  protectedRegionIds: [],
  safeCandidateRegionIds: ['region.cap10.safe'],
  provisionalSelectedCandidateRegionId: 'region.cap10.safe',
  provisionalFallbackCandidateRegionIds: [],
  sourceEvidenceMode: 'contract_fixture',
  sourceReportDisposition: 'pass',
  sourceCanonicalReportRereadVerified: false,
  sourceExactCanonicalScopeVerified: false,
  sourceImmutableReportReread: false,
  sourceCompleteRequestedRangeCoverage: true,
  evidenceQualifiedForPrivateRuntime: false,
  lateFinalVisualHierarchyAllowed: false,
  blockerCodes: ['caption_visual.runtime_evidence_unqualified'],
  captionProjectionOnly: true,
  visualIntelligenceRemainsEvidenceOwner: true,
  canonicalLayoutOwnerRetained: true,
  captionLayoutAuthorityClaimed: false,
  maskOrTrackingAuthorityClaimed: false,
  finalQaApprovalClaimed: false,
  finalRenderAuthorityClaimed: false,
  productionAuthorityClaimed: false,
}
const occupancy = parseCaptionVisualOccupancyManifest({
  ...occupancyWithoutDigest,
  manifestDigestSha256: digestRecord(
    { ...occupancyWithoutDigest, manifestDigestSha256: '' },
    'manifestDigestSha256',
  ),
})
const occupancyRef = {
  id: occupancy.manifestId,
  version: occupancy.schemaVersion,
  contentHash: occupancy.manifestDigestSha256,
}

const phraseProposals: CaptionSemanticStylePhraseProposal[] = [{
  phraseId: 'phrase.cap10.ideas',
  languageTag: 'en',
  semanticRole: 'primary_statement',
  clauseRole: 'independent',
  typographyRoleId: 'primary_speech',
  colorRoleId: 'emphasis',
  fontResolutionId: latinResolution.resolutionId,
  emphasisSourceWordIds: ['word.2'],
  nonColorEmphasis: 'weight_change',
  protectedTokenGroups: [{
    groupId: 'protected.cap10.frame', protectionReason: 'claim_sensitive',
    exactSourceWordIds: ['word.4', 'word.5'],
  }],
  lineCandidates: [{
    candidateId: 'line.cap10.orphan',
    lines: [{
      lineId: 'line.cap10.orphan.a', displayedText: 'Ideas move through the',
      exactSourceWordIds: ['word.1', 'word.2', 'word.3', 'word.4'],
      shapedAdvanceMilliEm: 10_000,
      graphemeCount: graphemes('Ideas move through the', 'en'),
    }, {
      lineId: 'line.cap10.orphan.b', displayedText: 'frame',
      exactSourceWordIds: ['word.5'], shapedAdvanceMilliEm: 3_000,
      graphemeCount: graphemes('frame', 'en'),
    }],
    measurementMode: 'contract_fixture',
    measurementEvidenceRef: ref('metrics.cap10.orphan'),
  }, {
    candidateId: 'line.cap10.balanced',
    lines: [{
      lineId: 'line.cap10.balanced.a', displayedText: 'Ideas move through',
      exactSourceWordIds: ['word.1', 'word.2', 'word.3'],
      shapedAdvanceMilliEm: 8_500,
      graphemeCount: graphemes('Ideas move through', 'en'),
    }, {
      lineId: 'line.cap10.balanced.b', displayedText: 'the frame',
      exactSourceWordIds: ['word.4', 'word.5'], shapedAdvanceMilliEm: 5_200,
      graphemeCount: graphemes('the frame', 'en'),
    }],
    measurementMode: 'contract_fixture',
    measurementEvidenceRef: ref('metrics.cap10.balanced'),
  }],
  legibilityCandidates: [{
    treatment: 'none', measuredContrastRatioMilli: 5_000,
    evidenceRef: occupancyRef,
  }, {
    treatment: 'shadow', measuredContrastRatioMilli: 6_000,
    evidenceRef: occupancyRef,
  }],
  requestedSemanticScaleBasisPoints: 10_000,
}, {
  phraseId: 'phrase.cap10.arabic',
  languageTag: 'ar',
  semanticRole: 'quotation',
  clauseRole: 'closing',
  typographyRoleId: 'primary_speech',
  colorRoleId: 'base_speech',
  fontResolutionId: arabicResolution.resolutionId,
  emphasisSourceWordIds: [],
  nonColorEmphasis: null,
  protectedTokenGroups: [{
    groupId: 'protected.cap10.arabic', protectionReason: 'quotation',
    exactSourceWordIds: ['word.6', 'word.7'],
  }],
  lineCandidates: [{
    candidateId: 'line.cap10.arabic',
    lines: [{
      lineId: 'line.cap10.arabic.a', displayedText: 'الأفكار تتحرك',
      exactSourceWordIds: ['word.6', 'word.7'], shapedAdvanceMilliEm: 7_200,
      graphemeCount: graphemes('الأفكار تتحرك', 'ar'),
    }],
    measurementMode: 'contract_fixture',
    measurementEvidenceRef: ref('metrics.cap10.arabic'),
  }],
  legibilityCandidates: [{
    treatment: 'none', measuredContrastRatioMilli: 3_000,
    evidenceRef: occupancyRef,
  }, {
    treatment: 'stroke', measuredContrastRatioMilli: 5_200,
    evidenceRef: occupancyRef,
  }],
  requestedSemanticScaleBasisPoints: 10_000,
}]

function build(overrides: Partial<Parameters<typeof createCaptionSemanticStyleBundle>[0]> = {}) {
  return createCaptionSemanticStyleBundle({
    planId: 'caption.semantic-style.cap10.fixture',
    canonicalScope: scope,
    phraseLineageProjection: phraseProjection,
    styleProfileContract: styleProfile,
    fontRegistryRef,
    fontResolutions: [latinResolution, arabicResolution],
    occupancyManifest: occupancy,
    confirmedOutputFrame: {
      frameRef: confirmedFrameRef,
      outputId: 'output.cap10.widescreen',
      width: 1_920,
      height: 1_080,
      aspectRatioNumerator: 16,
      aspectRatioDenominator: 9,
      fpsNumerator: 30,
      fpsDenominator: 1,
    },
    viewingTarget: 'desktop',
    phraseProposals,
    legacyStyleId: 'keyword_emphasis_captions',
    ...overrides,
  })
}

const bundle = build()
check(
  bundle.plan.qualificationState === 'contract_validated_runtime_gated',
  'CAP-10 contract fixtures must remain runtime-gated.',
)
check(
  bundle.plan.platformProfileId === 'desktop_widescreen',
  'The exact 16:9 desktop frame must select the desktop profile.',
)
check(
  bundle.plan.phrases[0].lineLayout.selectedCandidateId === 'line.cap10.balanced'
    && bundle.plan.phrases[0].lineLayout.rejectedCandidateIds.includes('line.cap10.orphan'),
  'Language-aware selection must reject the orphan final word.',
)
check(
  bundle.plan.phrases[0].lineLayout.lines[1].exactSourceWordIds.join('|')
    === 'word.4|word.5',
  'Protected source-token groups must remain on one line.',
)
check(
  bundle.plan.phrases[1].selectedLegibilityTreatment === 'stroke'
    && bundle.plan.phrases[0].selectedLegibilityTreatment === 'none',
  'Adaptive legibility must choose the first allowed treatment that passes contrast.',
)
check(
  arabicResolution.direction === 'rtl'
    && arabicResolution.runs.some((run) => run.script === 'arab')
    && arabicResolution.runs.some((run) => run.script === 'common'),
  'The Arabic phrase must preserve RTL multi-font run resolution.',
)
check(
  bundle.plan.phrases.every((phrase) =>
    phrase.opticalSizing.sizeDerivedFromRoleAndOutputProfile
      && !phrase.opticalSizing.characterCountDrivenSizeOscillationAllowed),
  'Optical size must derive from role/output rather than character-count oscillation.',
)
check(
  bundle.plan.phrases[0].emphasisSourceWordIds[0] === 'word.2'
    && bundle.plan.phrases[0].nonColorEmphasis === 'weight_change'
    && !bundle.plan.phrases[0].colorIsSoleMeaningCarrier,
  'Semantic color emphasis must retain a non-color counterpart.',
)
check(
  bundle.calibrationPreview.scenarios.length === 6
    && new Set(bundle.calibrationPreview.scenarios.map((item) => item.scenarioKind)).size === 6,
  'Calibration planning must cover all six required visual scenarios.',
)
check(
  bundle.calibrationPreview.previewState === 'planned_contract_only'
    && bundle.calibrationPreview.renderedMediaRef === null
    && !bundle.calibrationPreview.actualRenderedPixelsInspected
    && bundle.calibrationPreview.directRasterInspectionRequiredAfterRender,
  'CAP-10 must not convert a planning calibration into a visual-render claim.',
)
check(
  bundle.legacyStyleAdapter?.legacyStyleId === 'keyword_emphasis_captions'
    && bundle.legacyStyleAdapter.mappedTreatmentCode === 'selective_keyword_emphasis',
  'Legacy style IDs must adapt into the semantic style system.',
)

const oldStyles: Exclude<CaptionLegacyStyleId, 'custom'>[] = [
  'clean_subtitle', 'small_premium_subtitle', 'bold_social_captions',
  'keyword_emphasis_captions', 'karaoke_word_by_word', 'sentence_block_captions',
  'documentary_lower_third', 'education_label_captions',
  'minimal_accessibility_captions', 'caption_icon_callout',
]
check(
  oldStyles.every((legacyStyleId) => adaptLegacyCaptionStyle({
    adapterId: `legacy.${legacyStyleId}`,
    legacyStyleId,
  }).disposition === 'adapted'),
  'Every historical Caption preset must remain readable through a versioned adapter.',
)
check(
  adaptLegacyCaptionStyle({ adapterId: 'legacy.custom.blocked', legacyStyleId: 'custom' })
    .disposition === 'blocked_custom_style_requires_approval',
  'Unapproved custom legacy styles must fail closed.',
)
check(
  adaptLegacyCaptionStyle({
    adapterId: 'legacy.custom.approved', legacyStyleId: 'custom',
    customStyleApprovalRef: ref('custom.style.approval.cap10'),
  }).disposition === 'adapted',
  'An exact approval reference may preserve a custom legacy style.',
)
check(
  bundle.plan.fallbackLadder.join('|') === [
    'measured_semantic_phrase', 'simpler_semantic_line_layout',
    'stable_verbatim_phrase', 'deterministic_legacy_segmentation',
    'accessible_sidecar_only',
  ].join('|'),
  'The semantic fallback ladder must be fixed and visible.',
)
check(
  bundle.plan.rawChatIncluded === false
    && bundle.plan.mediaBytesIncluded === false
    && bundle.plan.arbitraryCssIncluded === false
    && bundle.plan.modelAuthoredCodeIncluded === false,
  'The style plan must remain private-data-safe and code-free.',
)
check(
  bundle.plan.runtimeExecutionGranted === false
    && bundle.plan.assetCreationGranted === false
    && bundle.plan.finalQaApprovalGranted === false
    && bundle.plan.finalCanvasAuthorityGranted === false
    && bundle.plan.publicDeliveryGranted === false
    && bundle.plan.productionAuthorityGranted === false,
  'CAP-10 must not promote runtime, asset, QA, canvas, delivery, or production authority.',
)
check(
  parseCaptionSemanticStylePlan(bundle.plan).planDigestSha256
    === bundle.plan.planDigestSha256
    && parseCaptionStyleCalibrationPreview(bundle.calibrationPreview).previewDigestSha256
      === bundle.calibrationPreview.previewDigestSha256
    && parseCaptionLegacyStyleAdapter(bundle.legacyStyleAdapter!).adapterDigestSha256
      === bundle.legacyStyleAdapter!.adapterDigestSha256,
  'Every CAP-10 artifact must survive strict digest reread.',
)

const tamperedPlan = structuredClone(bundle.plan)
tamperedPlan.phrases[0].displayedText = 'Changed words'
expectThrow(() => parseCaptionSemanticStylePlan(tamperedPlan))
expectThrow(() => build({
  confirmedOutputFrame: {
    frameRef: confirmedFrameRef, outputId: scope.outputId,
    width: 1_920, height: 1_080, aspectRatioNumerator: 9,
    aspectRatioDenominator: 16, fpsNumerator: 30, fpsDenominator: 1,
  },
}))
expectThrow(() => build({
  canonicalScope: { ...scope, outputId: 'output.cross-canvas' },
}))
expectThrow(() => build({
  phraseProposals: phraseProposals.map((proposal, index) => index === 0
    ? { ...proposal, typographyRoleId: 'unapproved_role' } : proposal),
}))
expectThrow(() => build({
  phraseProposals: phraseProposals.map((proposal, index) => index === 0
    ? { ...proposal, emphasisSourceWordIds: ['word.2'], nonColorEmphasis: null }
    : proposal),
}))
expectThrow(() => build({
  phraseProposals: phraseProposals.map((proposal, index) => index === 0
    ? {
      ...proposal,
      lineCandidates: [proposal.lineCandidates[0]],
    } : proposal),
}))
expectThrow(() => build({
  phraseProposals: phraseProposals.map((proposal, index) => index === 0
    ? {
      ...proposal,
      lineCandidates: proposal.lineCandidates.map((candidate) => ({
        ...candidate,
        lines: candidate.lines.map((line, lineIndex) => lineIndex === 0
          ? { ...line, displayedText: `Altered ${line.displayedText}` } : line),
      })),
    } : proposal),
}))
const noLegibility = build({
  phraseProposals: phraseProposals.map((proposal, index) => index === 1
    ? {
      ...proposal,
      legibilityCandidates: proposal.legibilityCandidates.map((candidate) => ({
        ...candidate, measuredContrastRatioMilli: 2_000,
      })),
    } : proposal),
})
check(
  noLegibility.plan.qualificationState === 'blocked_no_legible_treatment'
    && noLegibility.plan.phrases[1].selectedLegibilityTreatment === null,
  'A phrase with no passing approved treatment must remain explicitly blocked.',
)
expectThrow(() => build({
  fontResolutions: [
    { ...latinResolution, languageTag: 'fr' },
    arabicResolution,
  ],
}))

console.log(JSON.stringify({
  status: 'passed_with_explicit_font_visual_and_render_calibration_gates',
  milestone: 'CAP-10',
  assertions,
  semanticPhraseCount: bundle.plan.phrases.length,
  platformProfile: bundle.plan.platformProfileId,
  selectedEnglishLineLayout: bundle.plan.phrases[0].lineLayout.selectedCandidateId,
  arabicDirection: arabicResolution.direction,
  adaptiveLegibilityTreatments: bundle.plan.phrases.map((phrase) =>
    phrase.selectedLegibilityTreatment),
  calibrationScenarioCount: bundle.calibrationPreview.scenarios.length,
  legacyPresetCount: oldStyles.length,
  actualFontShapingExecuted: false,
  actualCalibrationMediaRendered: false,
  actualRenderedPixelsInspected: false,
  productionAuthorityPromoted: false,
}, null, 2))
