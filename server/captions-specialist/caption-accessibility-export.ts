import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CAPTION_ACCESSIBILITY_EXPORT_PLAN_VERSION,
  CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION,
  CAPTION_CANVAS_AWARE_ASS_PROFILE_VERSION,
  CAPTION_EXPORT_PACKAGING_HANDOFF_VERSION,
  type CaptionAccessibilityCue,
  type CaptionAccessibilityExportPlan,
  type CaptionAccessibleArtifactSet,
  type CaptionAccessibleFormat,
  type CaptionBuiltAccessibleFile,
  type CaptionExportPackagingHandoff,
  type CaptionOutputRecompositionProfile,
} from '../../src/types/caption-accessibility-export'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type { CaptionTextDirection } from '../../src/types/caption-font-runtime'
import type { CaptionRemotionSceneGroup } from '../../src/types/caption-remotion-scene-group'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import { parseCaptionRemotionSceneGroup } from './caption-remotion-scene-group'
import {
  OFFLINE_LIBASS_CAPTION_OPERATION,
  OFFLINE_LIBASS_CAPTION_PROTOCOL,
  validateOfflineLibassCaptionRequest,
  type OfflineLibassCaptionRequest,
} from '../tool-execution/libass-caption-execution/offline-libass-caption-protocol'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const languageTag = z.string().min(2).max(48)
  .regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u)
const safeText = z.string().min(1).max(500)
  .refine((value) => Array.from(value).every((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint >= 32 && codePoint !== 127
  }))
  .refine((value) => !/(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|\$\(|`|&&|\|\||#!)/iu.test(value))
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const rangeSchema = z.object({
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
  authorizedFrameRanges: z.array(rangeSchema).min(1).max(512),
}).strict()
const directionSchema = z.enum(['ltr', 'rtl', 'mixed'])

const cueSchema: z.ZodType<CaptionAccessibilityCue> = z.object({
  cueId: safeKey,
  sourceNodeId: safeKey.nullable(),
  sourceEventRef: refSchema.nullable(),
  phraseId: safeKey.nullable(),
  exactSourceWordIds: z.array(safeKey).max(256),
  frameRange: rangeSchema,
  stableReadRange: rangeSchema,
  cueKind: z.enum(['speech', 'meaningful_sound']),
  languageTag,
  direction: directionSchema,
  speakerLabel: safeText.max(80).nullable(),
  completeText: safeText,
  lines: z.array(safeText).min(1).max(2),
  graphemeCount: z.number().int().positive().max(500),
  translationRef: refSchema.nullable(),
  translationState: z.enum([
    'source_language', 'approved_private_fixture', 'pending_review',
  ]),
  fontResolutionRef: refSchema,
  targetLanguageRecompositionApplied: z.literal(true),
  sourceLanguageGeometryReused: z.literal(false),
}).strict()

const planSchema: z.ZodType<CaptionAccessibilityExportPlan> = z.object({
  schemaVersion: z.literal(CAPTION_ACCESSIBILITY_EXPORT_PLAN_VERSION),
  planId: safeKey,
  planDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sourceSceneGroupRef: refSchema,
  sourceSceneGroupFrameRef: refSchema,
  transcriptRef: refSchema,
  masterTimingRef: refSchema,
  storyTimingResolutionRef: refSchema,
  approvedSnapshotRef: refSchema.nullable(),
  confirmedOutputFrame: z.object({
    frameRef: refSchema,
    outputId: safeKey,
    width: z.number().int().positive().max(8_192),
    height: z.number().int().positive().max(8_192),
    aspectRatioNumerator: z.number().int().positive().max(100),
    aspectRatioDenominator: z.number().int().positive().max(100),
    fpsNumerator: z.number().int().positive().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
  }).strict(),
  privateReviewFrame: z.object({
    width: z.number().int().positive().max(3_840),
    height: z.number().int().positive().max(3_840),
    scaleNumerator: z.literal(1),
    scaleDenominator: z.literal(3),
    exactAspectRatioPreserved: z.literal(true),
    finalCustomerCanvasClaimed: z.literal(false),
  }).strict(),
  sourceLanguageTag: languageTag,
  outputLanguageTag: languageTag,
  outputDirection: directionSchema,
  recompositionProfileId: z.enum([
    'widescreen_balanced_v1', 'vertical_compact_v1',
  ]),
  layoutPolicy: z.object({
    maxGraphemesPerLine: z.number().int().min(8).max(80),
    maxLines: z.literal(2),
    horizontalSafeMarginBasisPoints: z.number().int().min(400).max(2_000),
    verticalSafeMarginBasisPoints: z.number().int().min(400).max(2_000),
    fontSizeBasisPointsOfFrameHeight: z.number().int().min(400).max(1_200),
    lineHeightMilli: z.number().int().min(1_000).max(1_600),
  }).strict(),
  cues: z.array(cueSchema).min(1).max(512),
  fontQualificationRef: refSchema,
  fontResolutionRef: refSchema,
  fontAdmission: z.enum([
    'blocked_canonical_registry', 'contract_fixture_only',
    'qualified_private_internal',
  ]),
  sidecarDisposition: z.literal('private_contract_ready'),
  assDisposition: z.enum([
    'private_ascii_fixture_only',
    'blocked_missing_qualified_font_or_shaping',
    'qualified_private_internal',
  ]),
  requiredFormats: z.tuple([
    z.literal('srt'), z.literal('webvtt'), z.literal('ass'),
  ]),
  canvasAwareAssProfileVersion: z.literal(CAPTION_CANVAS_AWARE_ASS_PROFILE_VERSION),
  libassOperationId: z.literal('tool.libass.render_approved_caption_track.v1'),
  ffmpegOperationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
  stableCompleteWordingRetained: z.literal(true),
  meaningfulSoundDescriptionsSupported: z.literal(true),
  speakerLabelsEvidenceBound: z.literal(true),
  outputSpecificRecompositionApplied: z.literal(true),
  englishLineGeometryReusedForLocalizedOutput: z.literal(false),
  reducedMotionChangesStableWording: z.literal(false),
  legacyFixedCanvasAssBuilderPreserved: z.literal(true),
  exactApprovedSnapshotRereadRequiredBeforeExecution: z.literal(true),
  exactStoryTimingRereadRequiredBeforeExecution: z.literal(true),
  exactFontAssetRereadRequiredBeforeExecution: z.literal(true),
  captionOwnsLibassRuntime: z.literal(false),
  captionOwnsFfmpegPackaging: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const artifactDescriptorSchema = z.object({
  artifactId: safeKey,
  format: z.enum(['srt', 'webvtt', 'ass']),
  languageTag,
  contentType: z.enum(['application/x-subrip', 'text/vtt', 'text/x-ssa']),
  encoding: z.literal('utf-8'),
  contentSha256: sha256,
  byteLength: z.number().int().positive().max(16 * 1024 * 1024),
  cueCount: z.number().int().positive().max(512),
  canvasRef: refSchema.nullable(),
  disposition: z.enum([
    'private_contract_ready', 'private_ascii_fixture_only',
    'blocked_missing_qualified_font_or_shaping', 'qualified_private_internal',
  ]),
  privateArtifact: z.literal(true),
  textEmbeddedInPublicReceipt: z.literal(false),
  localPathIncluded: z.literal(false),
  signedUrlIncluded: z.literal(false),
  persisted: z.literal(false),
  qaApproved: z.literal(false),
}).strict()

const handoffSchema: z.ZodType<CaptionExportPackagingHandoff> = z.object({
  schemaVersion: z.literal(CAPTION_EXPORT_PACKAGING_HANDOFF_VERSION),
  handoffId: safeKey,
  handoffDigestSha256: sha256,
  canonicalScope: scopeSchema,
  accessibilityPlanRef: refSchema,
  artifactSetLocator: z.object({
    id: safeKey,
    version: z.literal(CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION),
  }).strict(),
  approvedSnapshotRef: refSchema.nullable(),
  confirmedOutputFrameRef: refSchema,
  masterTimingRef: refSchema,
  storyTimingResolutionRef: refSchema,
  libassOperationId: z.literal('tool.libass.render_approved_caption_track.v1'),
  ffmpegOperationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
  requestedPackaging: z.enum([
    'private_sidecars_only', 'private_ass_fallback_overlay_and_sidecars',
  ]),
  finalRenderInputRequired: z.literal(true),
  exactArtifactRereadRequired: z.literal(true),
  streamLanguageMetadataRequired: z.literal(true),
  frameRateAndAudioSyncPreservationRequired: z.literal(true),
  technicalProbeRequired: z.literal(true),
  providerCallRequired: z.literal(false),
  operationRegistered: z.literal(false),
  dispatchGranted: z.literal(false),
  runtimeAuthority: z.literal(false),
  assetCreated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryCreated: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const artifactSetSchema: z.ZodType<CaptionAccessibleArtifactSet> = z.object({
  schemaVersion: z.literal(CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION),
  artifactSetId: safeKey,
  artifactSetDigestSha256: sha256,
  canonicalScope: scopeSchema,
  accessibilityPlanRef: refSchema,
  artifacts: z.array(artifactDescriptorSchema).length(3),
  packagingHandoff: handoffSchema,
  everyCueDerivedFromCanonicalLineage: z.literal(true),
  everyRequiredSidecarPresent: z.literal(true),
  assBlockedWhenFontOrShapingUnqualified: z.literal(true),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  credentialsIncluded: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export interface CaptionLocalizedPhraseInput {
  phraseId: string
  text: string
  speakerLabel: string | null
  translationRef: CaptionDomainRef | null
  translationState:
    | 'source_language'
    | 'approved_private_fixture'
    | 'pending_review'
}

export interface CaptionMeaningfulSoundInput {
  cueId: string
  sourceEventRef: CaptionDomainRef
  frameRange: CaptionDomainFrameRange
  description: string
  translationRef: CaptionDomainRef | null
  translationState:
    | 'source_language'
    | 'approved_private_fixture'
    | 'pending_review'
}

export interface CaptionAccessibilityExportBundle {
  plan: CaptionAccessibilityExportPlan
  artifactSet: CaptionAccessibleArtifactSet
  files: CaptionBuiltAccessibleFile[]
}

export function createCaptionAccessibilityExportBundle(input: {
  planId: string
  artifactSetId: string
  handoffId: string
  sourceSceneGroup: CaptionRemotionSceneGroup
  outputScope: CaptionDomainCanonicalScope
  confirmedOutputFrame: CaptionAccessibilityExportPlan['confirmedOutputFrame']
  transcriptRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  sourceLanguageTag: string
  outputLanguageTag: string
  outputDirection: CaptionTextDirection
  localizedPhrases: CaptionLocalizedPhraseInput[]
  meaningfulSounds: CaptionMeaningfulSoundInput[]
  fontQualificationRef: CaptionDomainRef
  fontResolutionRef: CaptionDomainRef
  fontAdmission: CaptionAccessibilityExportPlan['fontAdmission']
}): CaptionAccessibilityExportBundle {
  assertClosedContractTree(input, 'Caption accessibility export input')
  const sourceGroup = parseCaptionRemotionSceneGroup(input.sourceSceneGroup)
  const scope = scopeSchema.parse(input.outputScope)
  const frame = input.confirmedOutputFrame
  if (!samePlanningScope(scope, sourceGroup.canonicalScope)
    || frame.outputId !== scope.outputId
    || !sameRef(scope.approvedSnapshotRef, sourceGroup.canonicalScope.approvedSnapshotRef)
    || frame.width * frame.aspectRatioDenominator
      !== frame.height * frame.aspectRatioNumerator
    || frame.fpsNumerator !== 30 || frame.fpsDenominator !== 1
    || frame.width % 3 !== 0 || frame.height % 3 !== 0
    || !['1920x1080', '1080x1920'].includes(`${frame.width}x${frame.height}`)) {
    throw new Error('Caption accessibility output scope or confirmed frame is invalid.')
  }
  languageTag.parse(input.sourceLanguageTag)
  languageTag.parse(input.outputLanguageTag)
  directionSchema.parse(input.outputDirection)
  const profile = frame.width > frame.height
    ? 'widescreen_balanced_v1' as const : 'vertical_compact_v1' as const
  const layoutPolicy = profile === 'widescreen_balanced_v1'
    ? {
        maxGraphemesPerLine: 36, maxLines: 2 as const,
        horizontalSafeMarginBasisPoints: 700,
        verticalSafeMarginBasisPoints: 750,
        fontSizeBasisPointsOfFrameHeight: 720,
        lineHeightMilli: 1_220,
      }
    : {
        maxGraphemesPerLine: 18, maxLines: 2 as const,
        horizontalSafeMarginBasisPoints: 900,
        verticalSafeMarginBasisPoints: 800,
        fontSizeBasisPointsOfFrameHeight: 720,
        lineHeightMilli: 1_240,
      }
  const localizedByPhrase = new Map(input.localizedPhrases.map((item) => [item.phraseId, item]))
  if (localizedByPhrase.size !== input.localizedPhrases.length) {
    throw new Error('Caption localized phrase inputs contain duplicate phrase IDs.')
  }
  const accessibleLayers = sourceGroup.layers.filter((layer) =>
    layer.presentationKind === 'stable_accessible_caption')
  const cues: CaptionAccessibilityCue[] = accessibleLayers.map((layer) => {
    const localized = localizedByPhrase.get(layer.phraseId)
    if (!localized) throw new Error(`Caption localized phrase ${layer.phraseId} is missing.`)
    const translationRequired = input.outputLanguageTag !== input.sourceLanguageTag
    if ((translationRequired && (!localized.translationRef
      || localized.translationState !== 'approved_private_fixture'))
      || (!translationRequired && (localized.translationRef
        || localized.translationState !== 'source_language'))) {
      throw new Error(`Caption localized phrase ${layer.phraseId} lacks approved translation lineage.`)
    }
    const text = safeText.parse(localized.text)
    const lines = recomposeText(text, input.outputLanguageTag, layoutPolicy.maxGraphemesPerLine)
    return {
      cueId: `caption.accessible.cue.${profile}.${safeKey.parse(layer.nodeId)}`,
      sourceNodeId: layer.nodeId,
      sourceEventRef: null,
      phraseId: layer.phraseId,
      exactSourceWordIds: structuredClone(layer.exactSourceWordIds),
      frameRange: structuredClone(layer.frameRange),
      stableReadRange: structuredClone(layer.stableReadRange),
      cueKind: 'speech',
      languageTag: input.outputLanguageTag,
      direction: input.outputDirection,
      speakerLabel: localized.speakerLabel === null
        ? null : safeText.max(80).parse(localized.speakerLabel),
      completeText: text,
      lines,
      graphemeCount: graphemes(text, input.outputLanguageTag),
      translationRef: structuredClone(localized.translationRef),
      translationState: localized.translationState,
      fontResolutionRef: structuredClone(input.fontResolutionRef),
      targetLanguageRecompositionApplied: true,
      sourceLanguageGeometryReused: false,
    }
  })
  for (const sound of input.meaningfulSounds) {
    const translationRequired = input.outputLanguageTag !== input.sourceLanguageTag
    if ((translationRequired && (!sound.translationRef
      || sound.translationState !== 'approved_private_fixture'))
      || (!translationRequired && (sound.translationRef
        || sound.translationState !== 'source_language'))) {
      throw new Error(`Caption sound description ${sound.cueId} lacks translation lineage.`)
    }
    const description = safeText.parse(sound.description)
    cues.push({
      cueId: safeKey.parse(sound.cueId),
      sourceNodeId: null,
      sourceEventRef: structuredClone(sound.sourceEventRef),
      phraseId: null,
      exactSourceWordIds: [],
      frameRange: structuredClone(sound.frameRange),
      stableReadRange: structuredClone(sound.frameRange),
      cueKind: 'meaningful_sound',
      languageTag: input.outputLanguageTag,
      direction: input.outputDirection,
      speakerLabel: null,
      completeText: description,
      lines: recomposeText(
        description, input.outputLanguageTag, layoutPolicy.maxGraphemesPerLine),
      graphemeCount: graphemes(description, input.outputLanguageTag),
      translationRef: structuredClone(sound.translationRef),
      translationState: sound.translationState,
      fontResolutionRef: structuredClone(input.fontResolutionRef),
      targetLanguageRecompositionApplied: true,
      sourceLanguageGeometryReused: false,
    })
  }
  cues.sort((left, right) => left.frameRange.startFrame - right.frameRange.startFrame
    || left.cueId.localeCompare(right.cueId))
  const asciiOnly = cues.every((cue) => /^[\x20-\x7e]+$/u.test(
    `${cue.speakerLabel ?? ''}${cue.completeText}`))
  const assDisposition = input.fontAdmission === 'qualified_private_internal'
    ? 'qualified_private_internal' as const
    : input.fontAdmission === 'contract_fixture_only' && asciiOnly
      ? 'private_ascii_fixture_only' as const
      : 'blocked_missing_qualified_font_or_shaping' as const
  const planBase: Omit<CaptionAccessibilityExportPlan, 'planDigestSha256'> = {
    schemaVersion: CAPTION_ACCESSIBILITY_EXPORT_PLAN_VERSION,
    planId: safeKey.parse(input.planId),
    canonicalScope: structuredClone(scope),
    sourceSceneGroupRef: ref(
      sourceGroup.sceneGroupId, sourceGroup.schemaVersion,
      sourceGroup.sceneGroupDigestSha256,
    ),
    sourceSceneGroupFrameRef: structuredClone(sourceGroup.confirmedOutputFrame.frameRef),
    transcriptRef: refSchema.parse(input.transcriptRef),
    masterTimingRef: refSchema.parse(input.masterTimingRef),
    storyTimingResolutionRef: structuredClone(sourceGroup.storyTimingResolutionRef),
    approvedSnapshotRef: structuredClone(scope.approvedSnapshotRef),
    confirmedOutputFrame: structuredClone(frame),
    privateReviewFrame: {
      width: frame.width / 3,
      height: frame.height / 3,
      scaleNumerator: 1,
      scaleDenominator: 3,
      exactAspectRatioPreserved: true,
      finalCustomerCanvasClaimed: false,
    },
    sourceLanguageTag: input.sourceLanguageTag,
    outputLanguageTag: input.outputLanguageTag,
    outputDirection: input.outputDirection,
    recompositionProfileId: profile,
    layoutPolicy,
    cues,
    fontQualificationRef: refSchema.parse(input.fontQualificationRef),
    fontResolutionRef: refSchema.parse(input.fontResolutionRef),
    fontAdmission: input.fontAdmission,
    sidecarDisposition: 'private_contract_ready',
    assDisposition,
    requiredFormats: ['srt', 'webvtt', 'ass'],
    canvasAwareAssProfileVersion: CAPTION_CANVAS_AWARE_ASS_PROFILE_VERSION,
    libassOperationId: 'tool.libass.render_approved_caption_track.v1',
    ffmpegOperationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    stableCompleteWordingRetained: true,
    meaningfulSoundDescriptionsSupported: true,
    speakerLabelsEvidenceBound: true,
    outputSpecificRecompositionApplied: true,
    englishLineGeometryReusedForLocalizedOutput: false,
    reducedMotionChangesStableWording: false,
    legacyFixedCanvasAssBuilderPreserved: true,
    exactApprovedSnapshotRereadRequiredBeforeExecution: true,
    exactStoryTimingRereadRequiredBeforeExecution: true,
    exactFontAssetRereadRequiredBeforeExecution: true,
    captionOwnsLibassRuntime: false,
    captionOwnsFfmpegPackaging: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const plan = parseCaptionAccessibilityExportPlan({
    ...planBase,
    planDigestSha256: calculateSkillContractDigest(
      { ...planBase, planDigestSha256: '' }, 'planDigestSha256'),
  }, sourceGroup)
  const files = buildCaptionAccessibleFiles(plan)
  const planRef = ref(plan.planId, plan.schemaVersion, plan.planDigestSha256)
  const artifactSetId = safeKey.parse(input.artifactSetId)
  const handoffBase: Omit<CaptionExportPackagingHandoff, 'handoffDigestSha256'> = {
    schemaVersion: CAPTION_EXPORT_PACKAGING_HANDOFF_VERSION,
    handoffId: safeKey.parse(input.handoffId),
    canonicalScope: structuredClone(scope),
    accessibilityPlanRef: planRef,
    artifactSetLocator: {
      id: artifactSetId,
      version: CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION,
    },
    approvedSnapshotRef: structuredClone(scope.approvedSnapshotRef),
    confirmedOutputFrameRef: structuredClone(frame.frameRef),
    masterTimingRef: structuredClone(input.masterTimingRef),
    storyTimingResolutionRef: structuredClone(sourceGroup.storyTimingResolutionRef),
    libassOperationId: 'tool.libass.render_approved_caption_track.v1',
    ffmpegOperationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    requestedPackaging: assDisposition === 'blocked_missing_qualified_font_or_shaping'
      ? 'private_sidecars_only' : 'private_ass_fallback_overlay_and_sidecars',
    finalRenderInputRequired: true,
    exactArtifactRereadRequired: true,
    streamLanguageMetadataRequired: true,
    frameRateAndAudioSyncPreservationRequired: true,
    technicalProbeRequired: true,
    providerCallRequired: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeAuthority: false,
    assetCreated: false,
    qaApprovalGranted: false,
    publicDeliveryCreated: false,
    productionReady: false,
  }
  const handoff = withHandoffDigest(handoffBase)
  const artifactSetBase = artifactSetBaseFor(
    artifactSetId, scope, plan, files, handoff,
  )
  const artifactSet = parseCaptionAccessibleArtifactSet(
    withArtifactSetDigest(artifactSetBase), plan, files,
  )
  return { plan, artifactSet, files }
}

export function parseCaptionAccessibilityExportPlan(
  value: unknown,
  sourceSceneGroupValue: unknown,
): CaptionAccessibilityExportPlan {
  assertClosedContractTree(value, 'Caption accessibility export plan')
  const plan = planSchema.parse(value)
  const sourceGroup = parseCaptionRemotionSceneGroup(sourceSceneGroupValue)
  verifyDigest(plan as unknown as Record<string, unknown>,
    'planDigestSha256', 'Caption accessibility export plan')
  const measuredDirection = plan.cues.some((cue) => cue.direction === 'rtl')
    ? plan.cues.some((cue) => cue.direction === 'ltr') ? 'mixed' : 'rtl'
    : plan.cues.some((cue) => cue.direction === 'mixed') ? 'mixed' : 'ltr'
  const expectedProfile: CaptionOutputRecompositionProfile =
    plan.confirmedOutputFrame.width > plan.confirmedOutputFrame.height
      ? 'widescreen_balanced_v1' : 'vertical_compact_v1'
  const accessibleSourceLayers = sourceGroup.layers.filter((layer) =>
    layer.presentationKind === 'stable_accessible_caption')
  const accessibleSourceByNodeId = new Map(
    accessibleSourceLayers.map((layer) => [layer.nodeId, layer]),
  )
  const cueIds = new Set<string>()
  const coveredSourceNodeIds = new Set<string>()
  if (!samePlanningScope(plan.canonicalScope, sourceGroup.canonicalScope)
    || !sameRef(plan.canonicalScope.approvedSnapshotRef,
      sourceGroup.canonicalScope.approvedSnapshotRef)
    || !sameRef(plan.approvedSnapshotRef, plan.canonicalScope.approvedSnapshotRef)
    || !sameRef(plan.sourceSceneGroupRef, ref(
      sourceGroup.sceneGroupId, sourceGroup.schemaVersion,
      sourceGroup.sceneGroupDigestSha256,
    ))
    || !sameRef(plan.sourceSceneGroupFrameRef,
      sourceGroup.confirmedOutputFrame.frameRef)
    || !sameRef(plan.storyTimingResolutionRef, sourceGroup.storyTimingResolutionRef)
    || plan.confirmedOutputFrame.outputId !== plan.canonicalScope.outputId
    || !['1920x1080', '1080x1920'].includes(
      `${plan.confirmedOutputFrame.width}x${plan.confirmedOutputFrame.height}`)
    || plan.confirmedOutputFrame.fpsNumerator !== 30
    || plan.confirmedOutputFrame.fpsDenominator !== 1
    || plan.confirmedOutputFrame.width * plan.confirmedOutputFrame.aspectRatioDenominator
      !== plan.confirmedOutputFrame.height * plan.confirmedOutputFrame.aspectRatioNumerator
    || plan.privateReviewFrame.width * 3 !== plan.confirmedOutputFrame.width
    || plan.privateReviewFrame.height * 3 !== plan.confirmedOutputFrame.height
    || plan.recompositionProfileId !== expectedProfile
    || measuredDirection !== plan.outputDirection
    || plan.cues.some((cue, index) => {
      const previous = plan.cues[index - 1]
      const sourceLanguage = plan.outputLanguageTag === plan.sourceLanguageTag
      const sourceLayer = cue.sourceNodeId === null
        ? undefined : accessibleSourceByNodeId.get(cue.sourceNodeId)
      const authorized = plan.canonicalScope.authorizedFrameRanges.some((range) =>
        cue.frameRange.startFrame >= range.startFrame
        && cue.frameRange.endFrameExclusive <= range.endFrameExclusive)
      const lineText = cue.lines.join(' ').replace(/\s+/gu, '')
      const completeText = cue.completeText.replace(/\s+/gu, '')
      const speechShape = cue.cueKind === 'speech'
        ? cue.sourceNodeId !== null && cue.sourceEventRef === null
          && cue.phraseId !== null && cue.exactSourceWordIds.length > 0
        : cue.sourceNodeId === null && cue.sourceEventRef !== null
          && cue.phraseId === null && cue.exactSourceWordIds.length === 0
      const translationShape = sourceLanguage
        ? cue.translationRef === null && cue.translationState === 'source_language'
        : cue.translationRef !== null
          && cue.translationState === 'approved_private_fixture'
      const expectedLines = recomposeText(
        cue.completeText, cue.languageTag, plan.layoutPolicy.maxGraphemesPerLine,
      )
      const sourceLineage = cue.cueKind === 'speech' && sourceLayer
        ? cue.phraseId === sourceLayer.phraseId
          && cue.exactSourceWordIds.join('|') === sourceLayer.exactSourceWordIds.join('|')
          && cue.frameRange.startFrame === sourceLayer.frameRange.startFrame
          && cue.frameRange.endFrameExclusive === sourceLayer.frameRange.endFrameExclusive
          && cue.stableReadRange.startFrame === sourceLayer.stableReadRange.startFrame
          && cue.stableReadRange.endFrameExclusive === sourceLayer.stableReadRange.endFrameExclusive
          && (!sourceLanguage || cue.completeText === sourceLayer.text)
        : cue.cueKind === 'meaningful_sound'
      const invalid = cueIds.has(cue.cueId) || !authorized || !speechShape
        || !translationShape || !sourceLineage || lineText !== completeText
        || cue.languageTag !== plan.outputLanguageTag
        || cue.direction !== plan.outputDirection
        || !sameRef(cue.fontResolutionRef, plan.fontResolutionRef)
        || JSON.stringify(cue.lines) !== JSON.stringify(expectedLines)
        || cue.graphemeCount !== graphemes(cue.completeText, cue.languageTag)
        || cue.stableReadRange.startFrame < cue.frameRange.startFrame
        || cue.stableReadRange.endFrameExclusive > cue.frameRange.endFrameExclusive
        || new Set(cue.exactSourceWordIds).size !== cue.exactSourceWordIds.length
        || (previous !== undefined
          && (cue.frameRange.startFrame < previous.frameRange.startFrame
            || (cue.frameRange.startFrame === previous.frameRange.startFrame
              && cue.cueId.localeCompare(previous.cueId) <= 0)))
      cueIds.add(cue.cueId)
      if (sourceLayer) coveredSourceNodeIds.add(sourceLayer.nodeId)
      return invalid
    })
    || coveredSourceNodeIds.size !== accessibleSourceLayers.length
    || (plan.fontAdmission === 'qualified_private_internal'
      ? plan.assDisposition !== 'qualified_private_internal'
      : plan.fontAdmission === 'contract_fixture_only'
        && plan.cues.every((cue) => /^[\x20-\x7e]+$/u.test(
          `${cue.speakerLabel ?? ''}${cue.completeText}`))
        ? plan.assDisposition !== 'private_ascii_fixture_only'
        : plan.assDisposition !== 'blocked_missing_qualified_font_or_shaping')) {
    throw new Error('Caption accessibility export plan is stale or inconsistent.')
  }
  return plan
}

export function buildCaptionAccessibleFiles(
  planValue: CaptionAccessibilityExportPlan,
): CaptionBuiltAccessibleFile[] {
  const plan = planSchema.parse(planValue)
  verifyDigest(plan as unknown as Record<string, unknown>,
    'planDigestSha256', 'Caption accessibility export plan')
  const files = [
    ['srt', buildSrt(plan)] as const,
    ['webvtt', buildWebVtt(plan)] as const,
    ['ass', buildCanvasAwareAss(plan)] as const,
  ]
  return files.map(([format, text]) => ({
    format,
    text,
    contentSha256: createHash('sha256').update(text, 'utf8').digest('hex'),
    byteLength: Buffer.byteLength(text, 'utf8'),
  }))
}

export function parseCaptionAccessibleArtifactSet(
  value: unknown,
  planValue: unknown,
  files: CaptionBuiltAccessibleFile[],
): CaptionAccessibleArtifactSet {
  assertClosedContractTree(value, 'Caption accessible artifact set')
  const set = artifactSetSchema.parse(value)
  const plan = planSchema.parse(planValue)
  verifyDigest(plan as unknown as Record<string, unknown>,
    'planDigestSha256', 'Caption accessibility export plan')
  verifyDigest(set as unknown as Record<string, unknown>,
    'artifactSetDigestSha256', 'Caption accessible artifact set')
  verifyDigest(set.packagingHandoff as unknown as Record<string, unknown>,
    'handoffDigestSha256', 'Caption export packaging handoff')
  const fileByFormat = new Map(files.map((file) => [file.format, file]))
  const formats = set.artifacts.map((artifact) => artifact.format)
  if (!sameScope(set.canonicalScope, plan.canonicalScope)
    || !sameScope(set.packagingHandoff.canonicalScope, plan.canonicalScope)
    || !sameRef(set.accessibilityPlanRef,
      ref(plan.planId, plan.schemaVersion, plan.planDigestSha256))
    || !sameRef(set.packagingHandoff.accessibilityPlanRef, set.accessibilityPlanRef)
    || !sameRef(set.packagingHandoff.approvedSnapshotRef, plan.approvedSnapshotRef)
    || set.packagingHandoff.artifactSetLocator.id !== set.artifactSetId
    || set.packagingHandoff.artifactSetLocator.version !== set.schemaVersion
    || !sameRef(set.packagingHandoff.confirmedOutputFrameRef,
      plan.confirmedOutputFrame.frameRef)
    || !sameRef(set.packagingHandoff.masterTimingRef, plan.masterTimingRef)
    || !sameRef(set.packagingHandoff.storyTimingResolutionRef,
      plan.storyTimingResolutionRef)
    || set.packagingHandoff.requestedPackaging !== (
      plan.assDisposition === 'blocked_missing_qualified_font_or_shaping'
        ? 'private_sidecars_only'
        : 'private_ass_fallback_overlay_and_sidecars')
    || formats.join('|') !== 'srt|webvtt|ass'
    || set.artifacts.some((artifact) => {
      const file = fileByFormat.get(artifact.format)
      const expectedContentType = contentType(artifact.format)
      const expectedDisposition = artifact.format === 'ass'
        ? plan.assDisposition : 'private_contract_ready'
      return !file || artifact.languageTag !== plan.outputLanguageTag
        || artifact.contentType !== expectedContentType
        || artifact.contentSha256 !== file.contentSha256
        || artifact.byteLength !== file.byteLength
        || artifact.cueCount !== plan.cues.length
        || artifact.disposition !== expectedDisposition
        || (artifact.format === 'ass'
          ? !sameRef(artifact.canvasRef, plan.confirmedOutputFrame.frameRef)
          : artifact.canvasRef !== null)
    })) {
    throw new Error('Caption accessible artifact set is stale or inconsistent.')
  }
  return set
}

export function formatCaptionFrameTime(
  frame: number,
  fpsNumerator: number,
  fpsDenominator: number,
  format: 'srt' | 'webvtt',
): string {
  if (!Number.isSafeInteger(frame) || frame < 0
    || !Number.isSafeInteger(fpsNumerator) || fpsNumerator < 1
    || !Number.isSafeInteger(fpsDenominator) || fpsDenominator < 1) {
    throw new Error('Caption frame time input is invalid.')
  }
  const totalMilliseconds = Math.round(
    frame * 1_000 * fpsDenominator / fpsNumerator,
  )
  const hours = Math.floor(totalMilliseconds / 3_600_000)
  const minutes = Math.floor(totalMilliseconds % 3_600_000 / 60_000)
  const seconds = Math.floor(totalMilliseconds % 60_000 / 1_000)
  const milliseconds = totalMilliseconds % 1_000
  const separator = format === 'srt' ? ',' : '.'
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}`
    + `${separator}${pad(milliseconds, 3)}`
}

export function createCaptionLibassPrivateFixtureRequest(
  planValue: CaptionAccessibilityExportPlan,
  cueId?: string,
): OfflineLibassCaptionRequest {
  const plan = planSchema.parse(planValue)
  verifyDigest(plan as unknown as Record<string, unknown>,
    'planDigestSha256', 'Caption accessibility export plan')
  const cue = cueId
    ? plan.cues.find((candidate) => candidate.cueId === cueId)
    : plan.cues.find((candidate) => candidate.cueKind === 'speech')
  if (!cue || plan.assDisposition !== 'private_ascii_fixture_only'
    || plan.fontAdmission !== 'contract_fixture_only'
    || plan.outputDirection !== 'ltr'
    || !/^[\x20-\x7e]+$/u.test(cue.completeText)
    || !['640x360', '360x640'].includes(
      `${plan.privateReviewFrame.width}x${plan.privateReviewFrame.height}`)) {
    throw new Error('Caption private libass fixture request is not admitted.')
  }
  const fontSize = Math.max(18, Math.round(
    plan.privateReviewFrame.height
      * plan.layoutPolicy.fontSizeBasisPointsOfFrameHeight / 10_000,
  ))
  const horizontalMargin = Math.round(
    plan.privateReviewFrame.width
      * plan.layoutPolicy.horizontalSafeMarginBasisPoints / 10_000,
  )
  const conservativeAdvance = Math.ceil(
    graphemes(cue.completeText, cue.languageTag) * fontSize * 620 / 1_000,
  )
  if (conservativeAdvance > plan.privateReviewFrame.width - 2 * horizontalMargin) {
    throw new Error('Caption private libass fixture would exceed its one-line safe width.')
  }
  const timestampMs = Math.min(1_999, Math.round(
    cue.stableReadRange.startFrame * 1_000
      * plan.confirmedOutputFrame.fpsDenominator
      / plan.confirmedOutputFrame.fpsNumerator,
  ))
  return validateOfflineLibassCaptionRequest({
    schemaVersion: OFFLINE_LIBASS_CAPTION_PROTOCOL,
    toolId: 'libass',
    operationId: OFFLINE_LIBASS_CAPTION_OPERATION,
    payload: {
      captionProfileId: 'approved_ass_track_render_v1',
      fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
      collisionPolicy: 'fail_on_reserved_zone_collision',
      preserveSpeechTiming: true,
      width: plan.privateReviewFrame.width,
      height: plan.privateReviewFrame.height,
      timestampMs,
      fontSize,
      marginV: Math.max(20, Math.round(
        plan.privateReviewFrame.height
          * plan.layoutPolicy.verticalSafeMarginBasisPoints / 10_000,
      )),
      alignment: 2,
      caption: cue.completeText,
    },
  })
}

function buildSrt(plan: CaptionAccessibilityExportPlan): string {
  return `${plan.cues.map((cue, index) => [
    String(index + 1),
    `${formatCaptionFrameTime(cue.frameRange.startFrame,
      plan.confirmedOutputFrame.fpsNumerator,
      plan.confirmedOutputFrame.fpsDenominator, 'srt')} --> `
      + formatCaptionFrameTime(cue.frameRange.endFrameExclusive,
        plan.confirmedOutputFrame.fpsNumerator,
        plan.confirmedOutputFrame.fpsDenominator, 'srt'),
    sidecarLines(cue, 'srt').join('\n'),
  ].join('\n')).join('\n\n')}\n`
}

function buildWebVtt(plan: CaptionAccessibilityExportPlan): string {
  const cues = plan.cues.map((cue) => {
    const lines = sidecarLines(cue, 'webvtt')
    return [
      cue.cueId,
      `${formatCaptionFrameTime(cue.frameRange.startFrame,
        plan.confirmedOutputFrame.fpsNumerator,
        plan.confirmedOutputFrame.fpsDenominator, 'webvtt')} --> `
        + formatCaptionFrameTime(cue.frameRange.endFrameExclusive,
          plan.confirmedOutputFrame.fpsNumerator,
          plan.confirmedOutputFrame.fpsDenominator, 'webvtt'),
      cue.speakerLabel && cue.cueKind === 'speech'
        ? `<v ${escapeVtt(cue.speakerLabel)}>${lines.map(escapeVtt).join('\n')}`
        : lines.map(escapeVtt).join('\n'),
    ].join('\n')
  }).join('\n\n')
  return `WEBVTT\n\nLanguage: ${plan.outputLanguageTag}\n\n${cues}\n`
}

function buildCanvasAwareAss(plan: CaptionAccessibilityExportPlan): string {
  const frame = plan.confirmedOutputFrame
  const layout = plan.layoutPolicy
  const fontSize = Math.round(
    frame.height * layout.fontSizeBasisPointsOfFrameHeight / 10_000,
  )
  const marginL = Math.round(
    frame.width * layout.horizontalSafeMarginBasisPoints / 10_000,
  )
  const marginV = Math.round(
    frame.height * layout.verticalSafeMarginBasisPoints / 10_000,
  )
  const events = plan.cues.map((cue) => {
    const text = sidecarLines(cue, 'ass').map(sanitizeAssText).join('\\N')
    return `Dialogue: 0,${formatAssFrameTime(cue.frameRange.startFrame, frame)},`
      + `${formatAssFrameTime(cue.frameRange.endFrameExclusive, frame)},`
      + `Default,,0,0,0,,${text}`
  }).join('\n')
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: ${frame.width}\n`
    + `PlayResY: ${frame.height}\nWrapStyle: 2\nScaledBorderAndShadow: yes\n`
    + `YCbCr Matrix: TV.709\n\n[V4+ Styles]\n`
    + `Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n`
    + `Style: Default,DejaVu Sans,${fontSize},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,2,${marginL},${marginL},${marginV},1\n\n`
    + `[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n${events}\n`
}

function artifactSetBaseFor(
  artifactSetId: string,
  scope: CaptionDomainCanonicalScope,
  plan: CaptionAccessibilityExportPlan,
  files: CaptionBuiltAccessibleFile[],
  packagingHandoff: CaptionExportPackagingHandoff,
): Omit<CaptionAccessibleArtifactSet, 'artifactSetDigestSha256'> {
  return {
    schemaVersion: CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION,
    artifactSetId,
    canonicalScope: structuredClone(scope),
    accessibilityPlanRef: ref(plan.planId, plan.schemaVersion, plan.planDigestSha256),
    artifacts: files.map((file) => ({
      artifactId: `caption.accessible.${plan.confirmedOutputFrame.outputId}.${plan.outputLanguageTag}.${file.format}`,
      format: file.format,
      languageTag: plan.outputLanguageTag,
      contentType: contentType(file.format),
      encoding: 'utf-8',
      contentSha256: file.contentSha256,
      byteLength: file.byteLength,
      cueCount: plan.cues.length,
      canvasRef: file.format === 'ass'
        ? structuredClone(plan.confirmedOutputFrame.frameRef) : null,
      disposition: file.format === 'ass'
        ? plan.assDisposition : 'private_contract_ready',
      privateArtifact: true,
      textEmbeddedInPublicReceipt: false,
      localPathIncluded: false,
      signedUrlIncluded: false,
      persisted: false,
      qaApproved: false,
    })),
    packagingHandoff,
    everyCueDerivedFromCanonicalLineage: true,
    everyRequiredSidecarPresent: true,
    assBlockedWhenFontOrShapingUnqualified: true,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    credentialsIncluded: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
}

function withHandoffDigest(
  value: Omit<CaptionExportPackagingHandoff, 'handoffDigestSha256'>,
): CaptionExportPackagingHandoff {
  return handoffSchema.parse({
    ...value,
    handoffDigestSha256: calculateSkillContractDigest(
      { ...value, handoffDigestSha256: '' }, 'handoffDigestSha256'),
  })
}

function withArtifactSetDigest(
  value: Omit<CaptionAccessibleArtifactSet, 'artifactSetDigestSha256'>,
): CaptionAccessibleArtifactSet {
  return artifactSetSchema.parse({
    ...value,
    artifactSetDigestSha256: calculateSkillContractDigest(
      { ...value, artifactSetDigestSha256: '' }, 'artifactSetDigestSha256'),
  })
}

function recomposeText(text: string, locale: string, maximum: number): string[] {
  const segments = /\s/u.test(text)
    ? text.split(/\s+/u).filter(Boolean)
    : Array.from(new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(text),
      (segment) => segment.segment)
  const lines: string[] = []
  let current = ''
  const joiner = /\s/u.test(text) ? ' ' : ''
  for (const segment of segments) {
    const candidate = current ? `${current}${joiner}${segment}` : segment
    if (graphemes(candidate, locale) <= maximum) current = candidate
    else {
      if (current) lines.push(current)
      current = segment
    }
  }
  if (current) lines.push(current)
  if (lines.length < 1 || lines.length > 2
    || lines.some((line) => graphemes(line, locale) > maximum)) {
    throw new Error('Caption target-language text cannot fit the approved two-line layout.')
  }
  return lines
}

function sidecarLines(
  cue: CaptionAccessibilityCue,
  format: CaptionAccessibleFormat,
): string[] {
  const lines = [...cue.lines]
  if (cue.cueKind === 'meaningful_sound') {
    lines[0] = `[${lines[0]}]`
  } else if (cue.speakerLabel && format !== 'webvtt') {
    lines[0] = `[${cue.speakerLabel}] ${lines[0]}`
  }
  return lines
}

function formatAssFrameTime(
  frame: number,
  output: CaptionAccessibilityExportPlan['confirmedOutputFrame'],
): string {
  const centiseconds = Math.round(
    frame * 100 * output.fpsDenominator / output.fpsNumerator,
  )
  const hours = Math.floor(centiseconds / 360_000)
  const minutes = Math.floor(centiseconds % 360_000 / 6_000)
  const seconds = Math.floor(centiseconds % 6_000 / 100)
  return `${hours}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(centiseconds % 100, 2)}`
}

function sanitizeAssText(value: string): string {
  if (/[{}\\]/u.test(value) || /[\r\n]/u.test(value)) {
    throw new Error('Caption ASS text contains an unsafe override or line break.')
  }
  return value
}

function escapeVtt(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function contentType(format: CaptionAccessibleFormat) {
  return format === 'srt' ? 'application/x-subrip' as const
    : format === 'webvtt' ? 'text/vtt' as const : 'text/x-ssa' as const
}

function graphemes(value: string, locale: string): number {
  return Array.from(new Intl.Segmenter(locale, {
    granularity: 'grapheme',
  }).segment(value)).length
}

function verifyDigest(value: Record<string, unknown>, field: string, label: string): void {
  if (value[field] !== calculateSkillContractDigest(value, field)) {
    throw new Error(`${label} digest is stale.`)
  }
}

function samePlanningScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.planVersionId === right.planVersionId
    && left.sceneId === right.sceneId
    && JSON.stringify(left.authorizedFrameRanges)
      === JSON.stringify(right.authorizedFrameRanges)
}

function sameScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function sameRef(
  left: CaptionDomainRef | null,
  right: CaptionDomainRef | null,
): boolean {
  return left === null || right === null
    ? left === right
    : left.id === right.id && left.version === right.version
      && left.contentHash === right.contentHash
}

function ref(id: string, version: string, contentHash: string): CaptionDomainRef {
  return { id, version, contentHash }
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0')
}
