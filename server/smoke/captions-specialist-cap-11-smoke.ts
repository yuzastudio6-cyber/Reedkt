import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import {
  createCaptionBrollOwnerReadBinding,
  createCaptionMultiTrackSceneGraph,
  parseCaptionBrollOwnerReadBinding,
  parseCaptionMultiTrackSceneGraph,
} from '../captions-specialist/caption-multi-track-scene-graph'
import { createCaptionDomainContract } from '../captions-specialist/caption-domain-contracts'
import { parseCaptionSemanticStylePlan } from '../captions-specialist/caption-semantic-style'
import { parseCaptionPhraseLineageProjection } from '../captions-specialist/caption-transcript-lineage'
import {
  createCaptionFinalVisualHierarchy,
  parseCaptionVisualOccupancyManifest,
} from '../captions-specialist/caption-visual-intelligence-support'
import { CAPTION_DESIGN_COMPOSITE } from '../captions-specialist/caption-design-composite'
import {
  CAPTION_PHRASE_LINEAGE_PROJECTION_VERSION,
  type CaptionPhraseLineage,
  type CaptionPhraseLineageProjection,
} from '../../src/types/caption-transcript-lineage'
import {
  CAPTION_SEMANTIC_STYLE_PLAN_VERSION,
  type CaptionResolvedSemanticStylePhrase,
  type CaptionSemanticRole,
  type CaptionSemanticStylePlan,
} from '../../src/types/caption-semantic-style'
import {
  CAPTION_VISUAL_OCCUPANCY_MANIFEST_VERSION,
  type CaptionVisualOccupancyManifest,
} from '../../src/types/caption-visual-intelligence-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionSceneGraphProposal,
  CaptionSceneMode,
} from '../../src/types/caption-multi-track-scene-graph'
import { CAPTION_DOMAIN_CONTRACT_VERSIONS } from '../../src/types/caption-domain-contracts'
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
function recordDigest<T extends Record<string, unknown>>(value: T, field: keyof T): string {
  return calculateSkillContractDigest(value, field as string)
}
function graphemes(value: string): number {
  return Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)).length
}

const scope: CaptionDomainCanonicalScope = {
  ownerUserId: 'owner.cap11',
  workspaceId: 'workspace.cap11',
  projectId: 'project.cap11',
  editSessionId: 'edit.cap11',
  planVersionId: 'plan.cap11.v1',
  approvedSnapshotRef: ref('snapshot.cap11'),
  outputId: 'output.cap11.widescreen',
  sceneId: 'scene.cap11',
  authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 360 }],
}
const confirmedFrameRef = ref('confirmed.frame.cap11')
const transcriptRef = ref('transcript.cap11')
const masterTimingRef = ref('mastertiming.cap11')
const pictureLockRef = ref('picturelock.cap11')
const finishReadinessRef = ref('finish.cap11')
const compositeRef: CaptionDomainRef = {
  id: CAPTION_DESIGN_COMPOSITE.compositeId,
  version: CAPTION_DESIGN_COMPOSITE.compositeVersion,
  contentHash: CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
}

const phraseSpecs: Array<{
  id: string
  text: string
  words: string[]
  semanticRole: CaptionSemanticRole
  typographyRoleId: 'primary_speech' | 'hero_display'
  colorRoleId: 'base_speech' | 'emphasis' | 'hero_phrase'
  scale: number
}> = [{
  id: 'phrase.cap11.statement',
  text: 'Ideas move through the frame',
  words: ['word.1', 'word.2', 'word.3', 'word.4', 'word.5'],
  semanticRole: 'primary_statement',
  typographyRoleId: 'primary_speech',
  colorRoleId: 'emphasis',
  scale: 10_000,
}, {
  id: 'phrase.cap11.hero.behind',
  text: 'MOVE',
  words: ['word.6'],
  semanticRole: 'hero_concept',
  typographyRoleId: 'hero_display',
  colorRoleId: 'hero_phrase',
  scale: 14_000,
}, {
  id: 'phrase.cap11.list',
  text: 'Keep the main idea visible',
  words: ['word.7', 'word.8', 'word.9', 'word.10', 'word.11'],
  semanticRole: 'supporting_detail',
  typographyRoleId: 'primary_speech',
  colorRoleId: 'base_speech',
  scale: 9_000,
}, {
  id: 'phrase.cap11.environment',
  text: 'Belongs in the scene',
  words: ['word.12', 'word.13', 'word.14', 'word.15'],
  semanticRole: 'supporting_detail',
  typographyRoleId: 'primary_speech',
  colorRoleId: 'base_speech',
  scale: 9_000,
}, {
  id: 'phrase.cap11.anchor',
  text: 'Anchored to proof',
  words: ['word.16', 'word.17', 'word.18'],
  semanticRole: 'technical_term',
  typographyRoleId: 'primary_speech',
  colorRoleId: 'emphasis',
  scale: 10_000,
}, {
  id: 'phrase.cap11.hero.full',
  text: 'THE FRAME MOVES',
  words: ['word.19', 'word.20', 'word.21'],
  semanticRole: 'hero_concept',
  typographyRoleId: 'hero_display',
  colorRoleId: 'hero_phrase',
  scale: 14_000,
}]

const lineagePhrases: CaptionPhraseLineage[] = phraseSpecs.map((phrase, index) => ({
  phraseId: phrase.id,
  displayedText: phrase.text,
  transformation: 'exact',
  transformationApprovalRef: null,
  sourceSegmentIds: [`segment.${index + 1}`],
  exactSourceWordIds: phrase.words,
  startMilliseconds: index * 1_000,
  endMillisecondsExclusive: index * 1_000 + 900,
  timestampProvenance: 'asr_native',
  confidenceBasisPoints: 9_500,
  reviewReasons: [],
  reviewEvidenceRefs: [],
  phraseCaptionEligible: true,
  activeWordMotionEligible: index === 0,
  karaokeMotionEligible: false,
  syntheticTimingPreviewOnly: false,
}))
const phraseProjectionWithoutDigest: Omit<
  CaptionPhraseLineageProjection,
  'projectionDigestSha256'
> = {
  schemaVersion: CAPTION_PHRASE_LINEAGE_PROJECTION_VERSION,
  projectionId: 'caption.phrases.cap11.fixture',
  canonicalTranscriptRef: transcriptRef,
  alignmentQualificationRef: ref('alignment.cap11'),
  phrases: lineagePhrases,
  everyPhraseHasExactSourceLineage: true,
  finalWordMotionUsesSyntheticTiming: false,
  finalKaraokeUsesUnforcedTiming: false,
  privateArtifact: true,
  executionAuthorityClaimed: false,
}
const phraseProjection = parseCaptionPhraseLineageProjection({
  ...phraseProjectionWithoutDigest,
  projectionDigestSha256: recordDigest(
    { ...phraseProjectionWithoutDigest, projectionDigestSha256: '' },
    'projectionDigestSha256',
  ),
})

const styleProfile = createCaptionDomainContract({
  contractId: 'caption.style.cap11.fixture',
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
  stalenessTuple: [compositeRef, confirmedFrameRef, transcriptRef, masterTimingRef],
  payload: {
    projectMode: 'dynamic_short_form',
    typographyRoles: [{
      roleId: 'primary_speech', purposeCode: 'readable_speech',
      allowedSceneIds: ['scene.cap11'], maximumFrequency: 60,
      fontAssetRef: ref('font.cap11.primary'), weightCodes: ['bold'],
      colorRoleIds: ['base_speech', 'emphasis'], motionPresetIds: ['caption.fade'],
      supportedScriptCodes: ['latn'], fallbackRoleId: null,
    }, {
      roleId: 'hero_display', purposeCode: 'earned_hero_moment',
      allowedSceneIds: ['scene.cap11'], maximumFrequency: 2,
      fontAssetRef: ref('font.cap11.hero'), weightCodes: ['black'],
      colorRoleIds: ['hero_phrase'], motionPresetIds: ['caption.hero'],
      supportedScriptCodes: ['latn'], fallbackRoleId: 'primary_speech',
    }],
    colorRoles: [{
      colorRoleId: 'base_speech', semanticPurposeCode: 'readability',
      colorTokenRef: ref('color.cap11.base'), nonColorCounterpartRequired: true,
    }, {
      colorRoleId: 'emphasis', semanticPurposeCode: 'emphasis',
      colorTokenRef: ref('color.cap11.emphasis'), nonColorCounterpartRequired: true,
    }, {
      colorRoleId: 'hero_phrase', semanticPurposeCode: 'hero',
      colorTokenRef: ref('color.cap11.hero'), nonColorCounterpartRequired: true,
    }],
    legibility: {
      minimumContrastRatioMilli: 4_500, strokeAllowed: true, shadowAllowed: true,
      backplateAllowed: true, localScrimAllowed: true, backgroundBlurAllowed: false,
    },
    motionLanguage: {
      allowedPrimitiveIds: ['caption.fade', 'caption.hero'], repetitionLimit: 4,
      reducedMotionReplacementIds: ['caption.cut'], modelAuthoredCodeAllowed: false,
    },
    placementLanguage: {
      preferredZoneIds: ['region.cap11.safe'], fallbackZoneIds: ['region.cap11.safe'],
      protectedRoleCodes: ['speaker', 'product'],
      allowedDepthPlanes: ['behind_subject', 'object_attached', 'in_front_of_subject', 'full_screen'],
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
const approvalEnvelope = createCaptionDomainContract({
  contractId: 'caption.approval.cap11.fixture',
  contractKind: 'approval_envelope',
  canonicalScope: scope,
  sourceBindings: {
    captionCompositeRef: compositeRef,
    confirmedOutputFrameRef: confirmedFrameRef,
    canonicalTranscriptRef: transcriptRef,
    masterTimingRef,
    storyTimingRef: null,
    captionApprovalEnvelopeRef: null,
  },
  stalenessTuple: [compositeRef, confirmedFrameRef, transcriptRef, masterTimingRef],
  payload: {
    allowedProjectModes: ['dynamic_short_form'],
    allowedTypographyRoles: ['primary_speech', 'hero_display'],
    maximumMotionLevel: 'expressive',
    maximumHeroMoments: 2,
    subjectOverlapAllowed: true,
    objectAnchoringAllowed: true,
    captionToVisualAllowed: true,
    captionSoundAllowed: true,
    allowedTextTransformations: ['exact'],
    languages: ['en'],
    accessibleOutputKinds: ['srt', 'webvtt', 'stable_burn_in'],
    maximumCaptionCredits: 400,
    approvedFallbackIds: ['safe_top_plane', 'speaker_adjacent', 'caption_only'],
    canonicalApprovalStillRequired: true,
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

const occupancyWithoutDigest: Omit<CaptionVisualOccupancyManifest, 'manifestDigestSha256'> = {
  schemaVersion: CAPTION_VISUAL_OCCUPANCY_MANIFEST_VERSION,
  manifestId: 'caption.occupancy.cap11.fixture',
  canonicalScope: scope,
  pictureLockRef,
  finishReadinessRef,
  canonicalLayoutOccupancyRef: ref('layout.cap11'),
  supportRequestRef: ref('support.cap11'),
  visualEvidencePacketRef: ref('visual.packet.cap11'),
  visualIntelligenceReportRef: {
    id: 'visual.report.cap11', version: 1,
    contentHash: `sha256:${hash('visual.report.cap11')}`,
  },
  requestedSceneId: 'scene.cap11',
  requestedRange: { startFrame: 0, endFrameExclusive: 360 },
  regions: [{
    regionId: 'region.cap11.speaker', sceneId: 'scene.cap11',
    frameRange: { startFrame: 0, endFrameExclusive: 360 },
    role: 'speaker',
    regionBasisPoints: { x: 3_800, y: 1_000, width: 2_400, height: 5_000 },
    confidenceBasisPoints: 9_000,
    temporalStabilityBasisPoints: 9_000,
    measuredContrastRatioMilli: null,
    clutterBasisPoints: 2_000,
    cropResilienceBasisPoints: 8_000,
    compositionBalanceBasisPoints: 8_000,
    uncertaintyCode: null,
    protected: true,
    overlapsProtectedRegionIds: [],
    candidateScoreBasisPoints: null,
    selectableForStableCaption: false,
    sourceObservationId: 'region.cap11.speaker',
    evidenceRefs: [{
      id: 'visual.speaker.cap11', version: 1,
      contentHash: `sha256:${hash('visual.speaker.cap11')}`,
    }],
  }, {
    regionId: 'region.cap11.safe', sceneId: 'scene.cap11',
    frameRange: { startFrame: 0, endFrameExclusive: 360 },
    role: 'safe_candidate',
    regionBasisPoints: { x: 1_000, y: 7_000, width: 8_000, height: 1_500 },
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
    sourceObservationId: 'region.cap11.safe',
    evidenceRefs: [{
      id: 'visual.safe.cap11', version: 1,
      contentHash: `sha256:${hash('visual.safe.cap11')}`,
    }],
  }, {
    regionId: 'region.cap11.safe.upper', sceneId: 'scene.cap11',
    frameRange: { startFrame: 0, endFrameExclusive: 360 },
    role: 'safe_candidate',
    regionBasisPoints: { x: 500, y: 1_500, width: 2_500, height: 1_800 },
    confidenceBasisPoints: 8_500,
    temporalStabilityBasisPoints: 8_500,
    measuredContrastRatioMilli: 5_000,
    clutterBasisPoints: 1_500,
    cropResilienceBasisPoints: 8_500,
    compositionBalanceBasisPoints: 8_500,
    uncertaintyCode: null,
    protected: false,
    overlapsProtectedRegionIds: [],
    candidateScoreBasisPoints: 8_500,
    selectableForStableCaption: true,
    sourceObservationId: 'region.cap11.safe.upper',
    evidenceRefs: [{
      id: 'visual.safe.upper.cap11', version: 1,
      contentHash: `sha256:${hash('visual.safe.upper.cap11')}`,
    }],
  }],
  protectedRegionIds: ['region.cap11.speaker'],
  safeCandidateRegionIds: ['region.cap11.safe', 'region.cap11.safe.upper'],
  provisionalSelectedCandidateRegionId: 'region.cap11.safe',
  provisionalFallbackCandidateRegionIds: ['region.cap11.safe.upper'],
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
  manifestDigestSha256: recordDigest(
    { ...occupancyWithoutDigest, manifestDigestSha256: '' },
    'manifestDigestSha256',
  ),
})
const hierarchy = createCaptionFinalVisualHierarchy({
  hierarchyId: 'caption.hierarchy.cap11.fixture',
  occupancyManifest: occupancy,
})
const occupancyRef: CaptionDomainRef = {
  id: occupancy.manifestId,
  version: occupancy.schemaVersion,
  contentHash: occupancy.manifestDigestSha256,
}

function stylePhrase(
  phrase: typeof phraseSpecs[number],
): CaptionResolvedSemanticStylePhrase {
  const hero = phrase.semanticRole === 'hero_concept'
  const resolvedSize = hero ? 76 : phrase.scale === 9_000 ? 49 : 54
  const availableAdvance = Math.floor(1_920 * 7_800 / 10_000 / resolvedSize * 1_000)
  const measuredAdvance = hero ? 8_000 : 7_000
  const blockers = [
    'font_resolved_contract_fixture',
    'qualified_shaped_measurement_evidence_required',
    'qualified_visual_occupancy_evidence_required',
  ]
  return {
    phraseId: phrase.id,
    displayedText: phrase.text,
    exactSourceWordIds: phrase.words,
    semanticRole: phrase.semanticRole,
    clauseRole: 'independent',
    languageTag: 'en',
    typographyRoleId: phrase.typographyRoleId,
    colorRoleId: phrase.colorRoleId,
    emphasisSourceWordIds: [],
    nonColorEmphasis: null,
    protectedTokenGroups: [],
    fontResolutionRef: ref(`font.resolution.${phrase.id}`),
    fontResolutionDisposition: 'resolved_contract_fixture',
    lineLayout: {
      selectedCandidateId: `line.${phrase.id}`,
      lines: [{
        lineId: `line.${phrase.id}.one`,
        displayedText: phrase.text,
        exactSourceWordIds: phrase.words,
        shapedAdvanceMilliEm: measuredAdvance,
        graphemeCount: graphemes(phrase.text),
      }],
      rejectedCandidateIds: [],
      measurementMode: 'contract_fixture',
      measurementEvidenceRef: ref(`metrics.${phrase.id}`),
      maximumLineAdvanceMilliEm: measuredAdvance,
      availableLineAdvanceMilliEm: availableAdvance,
      widthUtilizationBasisPoints: Math.round(measuredAdvance * 10_000 / availableAdvance),
      languageAwareRulesApplied: true,
      protectedGroupsPreserved: true,
      sourceWordOrderPreserved: true,
      displayedTextPreserved: true,
      orphanLineAvoided: true,
    },
    opticalSizing: {
      platformProfileId: 'desktop_widescreen',
      baseFontSizePixels: 54,
      resolvedFontSizePixels: resolvedSize,
      minimumFontSizePixels: 35,
      maximumFontSizePixels: 97,
      lineHeightMilli: 1_180,
      safeWidthBasisPoints: 7_800,
      maximumLines: 2,
      semanticScaleBasisPoints: phrase.scale,
      sizeDerivedFromRoleAndOutputProfile: true,
      characterCountDrivenSizeOscillationAllowed: false,
    },
    selectedLegibilityTreatment: 'none',
    selectedContrastRatioMilli: 5_000,
    legibilityEvidenceRef: occupancyRef,
    accessibleCompleteWordingRetained: true,
    semanticMeaningPreserved: true,
    colorIsSoleMeaningCarrier: false,
    executionReady: false,
    blockerCodes: blockers,
  }
}

const stylePlanWithoutDigest: Omit<CaptionSemanticStylePlan, 'planDigestSha256'> = {
  schemaVersion: CAPTION_SEMANTIC_STYLE_PLAN_VERSION,
  planId: 'caption.semantic.style.cap11.fixture',
  canonicalScope: scope,
  phraseLineageProjectionRef: {
    id: phraseProjection.projectionId,
    version: phraseProjection.schemaVersion,
    contentHash: phraseProjection.projectionDigestSha256,
  },
  styleProfileRef: {
    id: styleProfile.contractId,
    version: styleProfile.contractVersion,
    contentHash: styleProfile.contractDigestSha256,
  },
  fontRegistryRef: ref('font.registry.cap11'),
  occupancyManifestRef: occupancyRef,
  confirmedOutputFrame: {
    frameRef: confirmedFrameRef,
    outputId: 'output.cap11.widescreen',
    width: 1_920,
    height: 1_080,
    aspectRatioNumerator: 16,
    aspectRatioDenominator: 9,
    fpsNumerator: 30,
    fpsDenominator: 1,
  },
  viewingTarget: 'desktop',
  platformProfileId: 'desktop_widescreen',
  selectedRegionId: 'region.cap11.safe',
  selectedRegionFrameRange: { startFrame: 0, endFrameExclusive: 360 },
  phrases: phraseSpecs.map(stylePhrase),
  fallbackLadder: [
    'measured_semantic_phrase', 'simpler_semantic_line_layout',
    'stable_verbatim_phrase', 'deterministic_legacy_segmentation',
    'accessible_sidecar_only',
  ],
  qualificationState: 'contract_validated_runtime_gated',
  blockerCodes: [
    'font_resolved_contract_fixture',
    'qualified_shaped_measurement_evidence_required',
    'qualified_visual_occupancy_evidence_required',
  ],
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
const stylePlan = parseCaptionSemanticStylePlan({
  ...stylePlanWithoutDigest,
  planDigestSha256: recordDigest(
    { ...stylePlanWithoutDigest, planDigestSha256: '' },
    'planDigestSha256',
  ),
})

const brollBinding = createCaptionBrollOwnerReadBinding({
  bindingId: 'caption.broll.cap11.fixture',
  canonicalScope: scope,
  requestedSceneId: 'scene.cap11',
  planningConstraintRef: ref('broll.constraints.cap11'),
  ownerRequestRef: ref('broll.owner.request.cap11'),
  ownerResultRef: null,
  selectedMediaManifestRef: null,
  layoutOccupancyRef: null,
  cropTimingRef: null,
  visibleTextEvidenceRef: null,
  bindingState: 'planning_constraints_only',
  evidenceMode: 'contract_fixture',
  exactOwnerResultRereadVerified: false,
  exactScopeFrameAndTimingVerified: false,
  mediaBytesIncluded: false,
  mediaLocatorIncluded: false,
  sourceSelectionPerformedByCaption: false,
  cropOrTimingPerformedByCaption: false,
  runtimeOrDispatchAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})

const accessibleTrackId = 'track.cap11.accessible'
const semanticTrackId = 'track.cap11.semantic'
const heroTrackId = 'track.cap11.hero'
const listTrackId = 'track.cap11.list'
const accessibleNodeId = (phraseId: string) => `node.accessible.${phraseId}`
const creativeNodeId = (phraseId: string) => `node.creative.${phraseId}`
const timingRef = (phraseId: string) => ref(`storytiming.requirement.${phraseId}`)

const proposal: CaptionSceneGraphProposal = {
  tracks: [{
    trackId: accessibleTrackId,
    role: 'accessible_sidecar',
    priority: 'mandatory_accessibility',
    rendererPreference: 'libass',
    phraseIds: phraseSpecs.map((phrase) => phrase.id),
    persistence: 'scene_bound',
    conflictPolicy: 'accessible_wins',
    reducedMotionCounterpartRequired: true,
    deliberateRestraintReasonCode: null,
  }, {
    trackId: semanticTrackId,
    role: 'semantic_phrase',
    priority: 'primary',
    rendererPreference: 'remotion',
    phraseIds: [
      'phrase.cap11.statement', 'phrase.cap11.environment', 'phrase.cap11.anchor',
    ],
    persistence: 'phrase_bound',
    conflictPolicy: 'coexist_only_in_separate_regions',
    reducedMotionCounterpartRequired: true,
    deliberateRestraintReasonCode: null,
  }, {
    trackId: heroTrackId,
    role: 'hero_typography',
    priority: 'accent',
    rendererPreference: 'remotion',
    phraseIds: ['phrase.cap11.hero.behind', 'phrase.cap11.hero.full'],
    persistence: 'phrase_bound',
    conflictPolicy: 'higher_semantic_priority_wins',
    reducedMotionCounterpartRequired: true,
    deliberateRestraintReasonCode: 'hero_moments_are_rare',
  }, {
    trackId: listTrackId,
    role: 'persistent_topic_list',
    priority: 'supporting',
    rendererPreference: 'remotion',
    phraseIds: ['phrase.cap11.list'],
    persistence: 'accumulates_until_clear',
    conflictPolicy: 'coexist_only_in_separate_regions',
    reducedMotionCounterpartRequired: true,
    deliberateRestraintReasonCode: 'one_persistent_list_only',
  }],
  nodes: [
    ...phraseSpecs.map((phrase) => ({
      nodeId: accessibleNodeId(phrase.id),
      trackId: accessibleTrackId,
      phraseId: phrase.id,
      timingRequirementRef: timingRef(phrase.id),
      compositionRole: 'caption_only' as const,
      requestedRegionId: 'region.cap11.safe',
      requestedDepthPlane: 'safe_accessible' as const,
      trackAllAdmissionId: null,
      accessibilityCounterpartNodeId: null,
      maximumHiddenAreaBasisPoints: 0,
      maximumHiddenDurationFrames: 0,
      soundEligibility: 'forbidden' as const,
      qaRequirementCodes: ['complete_wording', 'stable_readability', 'top_plane'],
      fallbackCode: 'stable_accessible_sidecar',
    })),
    {
      nodeId: creativeNodeId('phrase.cap11.statement'),
      trackId: semanticTrackId,
      phraseId: 'phrase.cap11.statement',
      timingRequirementRef: timingRef('phrase.cap11.statement'),
      compositionRole: 'caption_only',
      requestedRegionId: 'region.cap11.safe.upper',
      requestedDepthPlane: 'in_front_of_subject',
      trackAllAdmissionId: null,
      accessibilityCounterpartNodeId: accessibleNodeId('phrase.cap11.statement'),
      maximumHiddenAreaBasisPoints: 0,
      maximumHiddenDurationFrames: 0,
      soundEligibility: 'forbidden',
      qaRequirementCodes: ['semantic_readability', 'region_clearance'],
      fallbackCode: 'safe_top_plane',
    }, {
      nodeId: creativeNodeId('phrase.cap11.hero.behind'),
      trackId: heroTrackId,
      phraseId: 'phrase.cap11.hero.behind',
      timingRequirementRef: timingRef('phrase.cap11.hero.behind'),
      compositionRole: 'subject_occlusion',
      requestedRegionId: 'region.cap11.speaker',
      requestedDepthPlane: 'behind_subject',
      trackAllAdmissionId: null,
      accessibilityCounterpartNodeId: accessibleNodeId('phrase.cap11.hero.behind'),
      maximumHiddenAreaBasisPoints: 2_000,
      maximumHiddenDurationFrames: 8,
      soundEligibility: 'optional',
      qaRequirementCodes: ['subject_preservation', 'mask_edges', 'complete_wording'],
      fallbackCode: 'safe_top_plane',
    }, {
      nodeId: creativeNodeId('phrase.cap11.list'),
      trackId: listTrackId,
      phraseId: 'phrase.cap11.list',
      timingRequirementRef: timingRef('phrase.cap11.list'),
      compositionRole: 'broll_shared_frame',
      requestedRegionId: 'region.cap11.speaker',
      requestedDepthPlane: 'speaker_adjacent',
      trackAllAdmissionId: null,
      accessibilityCounterpartNodeId: accessibleNodeId('phrase.cap11.list'),
      maximumHiddenAreaBasisPoints: 0,
      maximumHiddenDurationFrames: 0,
      soundEligibility: 'forbidden',
      qaRequirementCodes: ['broll_text_clearance', 'persistent_read_time'],
      fallbackCode: 'caption_only',
    }, {
      nodeId: creativeNodeId('phrase.cap11.environment'),
      trackId: semanticTrackId,
      phraseId: 'phrase.cap11.environment',
      timingRequirementRef: timingRef('phrase.cap11.environment'),
      compositionRole: 'environmental_surface',
      requestedRegionId: 'region.cap11.speaker',
      requestedDepthPlane: 'environmental_background',
      trackAllAdmissionId: null,
      accessibilityCounterpartNodeId: accessibleNodeId('phrase.cap11.environment'),
      maximumHiddenAreaBasisPoints: 1_000,
      maximumHiddenDurationFrames: 6,
      soundEligibility: 'forbidden',
      qaRequirementCodes: ['surface_anchor', 'perspective_stability'],
      fallbackCode: 'speaker_adjacent',
    }, {
      nodeId: creativeNodeId('phrase.cap11.anchor'),
      trackId: semanticTrackId,
      phraseId: 'phrase.cap11.anchor',
      timingRequirementRef: timingRef('phrase.cap11.anchor'),
      compositionRole: 'object_anchor',
      requestedRegionId: 'region.cap11.speaker',
      requestedDepthPlane: 'object_attached',
      trackAllAdmissionId: null,
      accessibilityCounterpartNodeId: accessibleNodeId('phrase.cap11.anchor'),
      maximumHiddenAreaBasisPoints: 1_000,
      maximumHiddenDurationFrames: 6,
      soundEligibility: 'forbidden',
      qaRequirementCodes: ['anchor_stability', 'object_visibility'],
      fallbackCode: 'speaker_adjacent',
    }, {
      nodeId: creativeNodeId('phrase.cap11.hero.full'),
      trackId: heroTrackId,
      phraseId: 'phrase.cap11.hero.full',
      timingRequirementRef: timingRef('phrase.cap11.hero.full'),
      compositionRole: 'full_screen_hero',
      requestedRegionId: 'caption.region.full_canvas',
      requestedDepthPlane: 'full_screen',
      trackAllAdmissionId: null,
      accessibilityCounterpartNodeId: accessibleNodeId('phrase.cap11.hero.full'),
      maximumHiddenAreaBasisPoints: 0,
      maximumHiddenDurationFrames: 0,
      soundEligibility: 'optional',
      qaRequirementCodes: ['full_canvas_readability', 'hero_restraint'],
      fallbackCode: 'safe_top_plane',
    },
  ],
  persistentLists: [{
    listId: 'list.cap11.topic',
    trackId: listTrackId,
    titlePhraseId: null,
    entries: [{
      entryId: 'list.cap11.entry.1',
      phraseId: 'phrase.cap11.list',
      accumulationOrder: 1,
      retainAfterReveal: true,
      accessibleCounterpartNodeId: accessibleNodeId('phrase.cap11.list'),
    }],
    clearCondition: 'scene_end',
    maximumVisibleEntries: 4,
    priorEntriesRemainStable: true,
    oneAtATimeSubtitleBehavior: false,
  }],
  edges: [
    ...phraseSpecs.map((phrase) => ({
      edgeId: `edge.accessible.${phrase.id}`,
      fromNodeId: creativeNodeId(phrase.id),
      toNodeId: accessibleNodeId(phrase.id),
      edgeKind: 'accessibility_counterpart' as const,
    })),
    ...phraseSpecs.slice(0, -1).map((phrase, index) => ({
      edgeId: `edge.sequence.${index + 1}`,
      fromNodeId: creativeNodeId(phrase.id),
      toNodeId: creativeNodeId(phraseSpecs[index + 1].id),
      edgeKind: 'sequence' as const,
    })),
  ],
  modePhases: ([
    ['phase.cap11.clean', 'clean_verbatim', [accessibleTrackId, semanticTrackId],
      'phrase.cap11.statement'],
    ['phase.cap11.hero.behind', 'hero_typography', [accessibleTrackId, heroTrackId],
      'phrase.cap11.hero.behind'],
    ['phase.cap11.list', 'persistent_list', [accessibleTrackId, listTrackId],
      'phrase.cap11.list'],
    ['phase.cap11.environment', 'spatial_sentence', [accessibleTrackId, semanticTrackId],
      'phrase.cap11.environment'],
    ['phase.cap11.anchor', 'spatial_sentence', [accessibleTrackId, semanticTrackId],
      'phrase.cap11.anchor'],
    ['phase.cap11.hero.full', 'hero_typography', [accessibleTrackId, heroTrackId],
      'phrase.cap11.hero.full'],
  ] as Array<[string, CaptionSceneMode, string[], string]>).map(([
    phaseId, mode, activeTrackIds, phraseId,
  ]) => ({
    phaseId,
    mode,
    activeTrackIds,
    activeNodeIds: [creativeNodeId(phraseId), accessibleNodeId(phraseId)],
    storyTimingRequirementRef: ref(`storytiming.mode.${phaseId}`),
    switchReasonCode: `semantic_beat_${mode}`,
    transitionOwnerRequestRef: null,
    executableFramesResolved: false,
    randomPhraseLevelSwitchingAllowed: false,
  })),
}

function build(overrides: Partial<Parameters<typeof createCaptionMultiTrackSceneGraph>[0]> = {}) {
  return createCaptionMultiTrackSceneGraph({
    graphId: 'caption.scene.graph.cap11.fixture',
    semanticStylePlan: stylePlan,
    phraseLineageProjection: phraseProjection,
    styleProfileContract: styleProfile,
    approvalEnvelopeContract: approvalEnvelope,
    occupancyManifest: occupancy,
    visualHierarchy: hierarchy,
    pictureLockRef,
    finishReadinessRef,
    brollOwnerBinding: brollBinding,
    trackAllAdmissionBundles: [],
    proposal,
    ...overrides,
  })
}

export const CAP_11_SCENE_GRAPH_FIXTURE = build()
export const CAP_11_SEMANTIC_STYLE_PLAN_FIXTURE = stylePlan
export const CAP_11_MASTER_TIMING_REF = masterTimingRef
export const CAP_11_CONFIRMED_FRAME_REF = confirmedFrameRef
export const CAP_11_STYLE_PROFILE_REF: CaptionDomainRef = {
  id: styleProfile.contractId,
  version: styleProfile.contractVersion,
  contentHash: styleProfile.contractDigestSha256,
}
export const CAP_11_TRANSCRIPT_REF = transcriptRef
export const CAP_11_APPROVAL_ENVELOPE_REF: CaptionDomainRef = {
  id: approvalEnvelope.contractId,
  version: approvalEnvelope.contractVersion,
  contentHash: approvalEnvelope.contractDigestSha256,
}
const graph = CAP_11_SCENE_GRAPH_FIXTURE
function runCap11Smoke(): void {
check(graph.tracks.length === 4 && graph.nodes.length === 12,
  'CAP-11 must preserve four purposeful tracks and their accessible counterparts.')
check(graph.accessibleTrackCount === 1 && graph.selectedCreativeTrackCount === 3,
  'The graph must count accessible and creative tracks separately.')
check(graph.selectedHeroMomentCount === 2 && graph.maximumHeroMomentCount === 2,
  'Hero moments must be counted against the exact approval-envelope limit.')
check(graph.structuralDisposition === 'ready_with_declared_fallbacks',
  'Contract-only evidence must produce an honest fallback-ready graph.')
check(graph.nodes.find((node) => node.phraseId === 'phrase.cap11.statement'
  && node.trackId === semanticTrackId)?.depthDisposition === 'admitted',
  'Safe in-front semantic Caption placement should remain admitted.')
check(graph.nodes.find((node) => node.phraseId === 'phrase.cap11.hero.behind'
  && node.trackId === heroTrackId)?.depthDisposition === 'fallback_safe_top_plane',
  'Behind-subject type must fall back without Track All admission.')
check(graph.nodes.filter((node) => ['phrase.cap11.environment', 'phrase.cap11.anchor']
  .includes(node.phraseId) && node.trackId === semanticTrackId)
  .every((node) => node.depthDisposition === 'fallback_speaker_adjacent'),
  'Environmental/object anchors must fall back without anchor evidence.')
check(graph.nodes.find((node) => node.phraseId === 'phrase.cap11.list'
  && node.trackId === listTrackId)?.depthDisposition === 'fallback_caption_only',
  'B-roll co-composition must fall back until the owner read is authenticated.')
check(graph.nodes.find((node) => node.phraseId === 'phrase.cap11.hero.full'
  && node.trackId === heroTrackId)?.resolvedDepthPlane === 'full_screen',
  'Approved full-screen hero typography must remain structurally representable.')
check(graph.persistentLists[0].entries[0].retainAfterReveal
  && graph.persistentLists[0].priorEntriesRemainStable
  && !graph.persistentLists[0].oneAtATimeSubtitleBehavior,
  'Persistent lists must accumulate rather than behave like ordinary subtitles.')
check(new Set(graph.modePhases.map((phase) => phase.mode)).size === 4
  && graph.modePhases.every((phase) => !phase.randomPhraseLevelSwitchingAllowed),
  'Scene mode switching must be semantic and deterministic.')
check(graph.modePhases.find((phase) => phase.mode === 'hero_typography')
  ?.activeTrackIds.includes(accessibleTrackId),
  'Hero typography must coexist with the accessible track.')
check(graph.nodes.filter((node) => node.trackId !== accessibleTrackId)
  .every((node) => node.accessibilityCounterpartNodeId !== null),
  'Every creative node must retain an accessible complete-wording counterpart.')
check(graph.nodes.every((node) => !node.storyTimingFramesResolved && !node.renderExecutionReady),
  'CAP-11 must not invent final frames or render readiness before StoryTiming.')
check(graph.blockerCodes.includes('storytiming_resolution_required')
  && graph.blockerCodes.includes('authenticated_broll_owner_read_required')
  && graph.blockerCodes.includes('track_all_anchor_evidence_required'),
  'External timing, B-roll, and Track All gates must remain explicit.')
check(graph.captionAboveLivingFrameByDefault && graph.accessibleCaptionAboveAllVisuals,
  'Caption-above-Living-Frame and accessible-top ordering must be preserved.')
check(graph.brollOwnerRetained && graph.trackAllOwnerRetained
  && graph.storyTimingSoleFrameAuthority && graph.remotionRemainsFinalCanvas,
  'CAP-11 must preserve every canonical external owner.')
check(!graph.runtimeExecutionGranted && !graph.assetCreationGranted
  && !graph.finalQaApprovalGranted && !graph.publicDeliveryGranted
  && !graph.productionAuthorityGranted,
  'CAP-11 must not promote runtime, asset, QA, delivery, or production authority.')
check(parseCaptionMultiTrackSceneGraph(graph).graphDigestSha256 === graph.graphDigestSha256,
  'The scene graph must survive strict digest reread.')
check(parseCaptionBrollOwnerReadBinding(brollBinding).bindingState
  === 'planning_constraints_only',
  'The B-roll adapter must preserve planning-versus-ready semantics.')
check(CAPTION_DOMAIN_CONTRACT_VERSIONS.scene_graph === 'caption-scene-graph-v1',
  'The old scene-graph contract must remain backward-readable and unmutated.')

expectThrow(() => createCaptionBrollOwnerReadBinding({
  ...brollBinding,
  bindingId: 'caption.broll.cap11.overclaim',
  bindingState: 'authenticated_owner_ready',
  evidenceMode: 'contract_fixture',
  exactOwnerResultRereadVerified: true,
  exactScopeFrameAndTimingVerified: true,
}))
expectThrow(() => build({
  proposal: {
    ...proposal,
    nodes: proposal.nodes.map((node, index) => index === 0
      ? { ...node, requestedDepthPlane: 'subject_plane' as const } : node),
  },
}))
expectThrow(() => build({
  proposal: {
    ...proposal,
    nodes: proposal.nodes.map((node) =>
      node.nodeId === creativeNodeId('phrase.cap11.statement')
        ? { ...node, requestedRegionId: 'region.unknown' } : node),
  },
}))
expectThrow(() => build({
  proposal: {
    ...proposal,
    nodes: proposal.nodes.filter((node) =>
      node.nodeId !== accessibleNodeId('phrase.cap11.anchor')),
    tracks: proposal.tracks.map((track) => track.trackId === accessibleTrackId
      ? { ...track, phraseIds: track.phraseIds.filter((id) => id !== 'phrase.cap11.anchor') }
      : track),
    edges: proposal.edges.filter((edge) =>
      edge.toNodeId !== accessibleNodeId('phrase.cap11.anchor')),
  },
}))
expectThrow(() => build({
  proposal: {
    ...proposal,
    edges: [...proposal.edges, {
      edgeId: 'edge.cap11.cycle',
      fromNodeId: creativeNodeId('phrase.cap11.hero.full'),
      toNodeId: creativeNodeId('phrase.cap11.statement'),
      edgeKind: 'sequence',
    }],
  },
}))
expectThrow(() => build({
  proposal: {
    ...proposal,
    persistentLists: [{
      ...proposal.persistentLists[0],
      entries: [{ ...proposal.persistentLists[0].entries[0], accumulationOrder: 2 }],
    }],
  },
}))
expectThrow(() => build({
  proposal: {
    ...proposal,
    nodes: proposal.nodes.map((node, index) => index === 1
      ? { ...node, nodeId: proposal.nodes[0].nodeId } : node),
  },
}))
expectThrow(() => build({
  proposal: {
    ...proposal,
    modePhases: proposal.modePhases.map((phase, index) => index === 0
      ? { ...phase, activeTrackIds: [...phase.activeTrackIds, 'track.unknown'] }
      : phase),
  },
}))
expectThrow(() => build({
  proposal: {
    ...proposal,
    nodes: proposal.nodes.map((node) =>
      node.nodeId === creativeNodeId('phrase.cap11.statement')
        ? { ...node, requestedRegionId: 'region.cap11.safe' } : node),
  },
}))
const oneHeroApproval = createCaptionDomainContract({
  ...approvalEnvelope,
  contractId: 'caption.approval.cap11.one-hero',
  payload: { ...approvalEnvelope.payload, maximumHeroMoments: 1 },
})
expectThrow(() => build({ approvalEnvelopeContract: oneHeroApproval }))
const authorityTamper = structuredClone(graph)
authorityTamper.runtimeExecutionGranted = true as false
authorityTamper.graphDigestSha256 = recordDigest(
  { ...authorityTamper, graphDigestSha256: '' },
  'graphDigestSha256',
)
expectThrow(() => parseCaptionMultiTrackSceneGraph(authorityTamper))

console.log(JSON.stringify({
  status: 'passed_with_declared_track_all_broll_visual_and_storytiming_gates',
  milestone: 'CAP-11',
  assertions,
  trackCount: graph.tracks.length,
  nodeCount: graph.nodes.length,
  accessibleTrackCount: graph.accessibleTrackCount,
  creativeTrackCount: graph.selectedCreativeTrackCount,
  modeCount: graph.modePhases.length,
  persistentListCount: graph.persistentLists.length,
  fallbackCodes: graph.fallbackCodesApplied,
  actualTrackAllEvidenceConsumed: false,
  authenticatedBrollOwnerReadConsumed: false,
  storyTimingFramesResolved: false,
  remotionRenderExecuted: false,
  productionAuthorityPromoted: false,
}, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCap11Smoke()
}
