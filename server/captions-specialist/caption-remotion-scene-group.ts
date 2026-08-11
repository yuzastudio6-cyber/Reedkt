import { z } from 'zod'

import {
  CAPTION_REMOTION_COMPOSITION_PROFILE,
  CAPTION_REMOTION_PINNED_RUNTIME_VERSION,
  CAPTION_REMOTION_RENDER_SPEC_VERSION,
  CAPTION_REMOTION_SCENE_GROUP_VERSION,
  type CaptionRemotionLayer,
  type CaptionRemotionPresentationKind,
  type CaptionRemotionRenderSpec,
  type CaptionRemotionSceneGroup,
} from '../../src/types/caption-remotion-scene-group'
import type { CaptionSemanticStylePlan } from '../../src/types/caption-semantic-style'
import type { CaptionMultiTrackSceneGraph } from '../../src/types/caption-multi-track-scene-graph'
import type {
  CaptionMotionLock,
  CaptionMotionPlan,
  CaptionStoryTimingResolutionBinding,
} from '../../src/types/caption-storytiming-motion'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeText = z.string().min(1).max(320)
  .refine((value) => Array.from(value).every((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint >= 32 && codePoint !== 127
  }))
  .refine((value) => !/(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|\$\(|`|&&|\|\||#!)/iu.test(value))
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
const depthPlaneSchema = z.enum([
  'far_background', 'environmental_background', 'behind_subject',
  'speaker_adjacent', 'object_attached', 'in_front_of_subject',
  'foreground_hero', 'full_screen', 'safe_accessible',
])
const trackRoleSchema = z.enum([
  'verbatim_speech', 'semantic_phrase', 'active_word', 'hero_typography',
  'persistent_topic_list', 'quote', 'speaker_attribution', 'caption_to_visual',
  'accessible_sidecar', 'localized_accessible',
])
const presentationSchema = z.enum([
  'stable_accessible_caption', 'semantic_phrase_card', 'hero_typography',
  'persistent_topic_list', 'environmental_label', 'object_anchor_label',
  'caption_to_visual_bridge',
])
const primitiveSchema = z.enum([
  'reveal', 'fade', 'scale', 'slide', 'wipe', 'tracked_move',
  'depth_transition', 'emphasis_pulse', 'brush_reveal', 'list_append',
  'hero_expansion', 'handoff_morph', 'stable_hold', 'cut',
])
const easingSchema = z.enum([
  'linear', 'ease_in', 'ease_out', 'ease_in_out', 'spring_restrained',
])
const layoutSchema = z.object({
  x: z.number().int().min(0).max(10_000),
  y: z.number().int().min(0).max(10_000),
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
}).strict().refine((value) => value.x + value.width <= 10_000
  && value.y + value.height <= 10_000)
const layerSchema: z.ZodType<CaptionRemotionLayer> = z.object({
  layerId: safeKey,
  nodeId: safeKey,
  trackId: safeKey,
  phraseId: safeKey,
  trackRole: trackRoleSchema,
  presentationKind: presentationSchema,
  text: safeText,
  exactSourceWordIds: z.array(safeKey).min(1).max(256),
  frameRange: frameRangeSchema,
  stableReadRange: frameRangeSchema,
  depthPlane: depthPlaneSchema,
  zIndex: z.number().int().min(0).max(2_000),
  layoutBasisPoints: layoutSchema,
  typography: z.object({
    fontFamilyToken: z.literal('approved_caption_sans_fixture_v1'),
    fontWeight: z.union([z.literal(600), z.literal(700), z.literal(800)]),
    fontSizeBasisPointsOfFrameHeight: z.number().int().min(400).max(2_000),
    lineHeightMilli: z.number().int().min(900).max(1_600),
    textColor: z.enum(['#F8FAFC', '#DFF7FF', '#09111F']),
    accentColor: z.enum(['#6EE7F9', '#A78BFA', '#FBBF24']),
    plateStyle: z.enum(['none', 'soft_dark', 'soft_light', 'outline_dark']),
    textAlign: z.enum(['left', 'center']),
  }).strict(),
  motion: z.object({
    primitive: primitiveSchema,
    easing: easingSchema,
    travelBasisPoints: z.object({
      x: z.number().int().min(-2_000).max(2_000),
      y: z.number().int().min(-2_000).max(2_000),
    }).strict(),
    startScaleBasisPoints: z.number().int().min(5_000).max(15_000),
    endScaleBasisPoints: z.number().int().min(5_000).max(15_000),
    startOpacityBasisPoints: z.number().int().min(0).max(10_000),
    endOpacityBasisPoints: z.number().int().min(0).max(10_000),
    overshootBasisPoints: z.number().int().min(0).max(2_000),
    staggerFrames: z.number().int().min(0).max(120),
  }).strict(),
  reducedMotion: z.object({
    primitive: z.enum(['fade', 'stable_hold', 'cut']),
    frameRange: frameRangeSchema,
  }).strict(),
  accessibilityCounterpartNodeId: safeKey.nullable(),
  maskSequenceRef: refSchema.nullable(),
  objectAnchorRef: refSchema.nullable(),
  trackManifestRef: refSchema.nullable(),
  dependencyDisposition: z.enum([
    'not_applicable', 'admitted_exact_private_evidence', 'declared_safe_fallback',
  ]),
}).strict()

export function parseCaptionRemotionLayers(value: unknown): CaptionRemotionLayer[] {
  assertClosedContractTree(value, 'Caption Remotion layer list')
  return z.array(layerSchema).min(2).max(128).parse(value)
}

const sceneGroupSchema: z.ZodType<CaptionRemotionSceneGroup> = z.object({
  schemaVersion: z.literal(CAPTION_REMOTION_SCENE_GROUP_VERSION),
  sceneGroupId: safeKey,
  sceneGroupDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sceneGraphRef: refSchema,
  semanticStylePlanRef: refSchema,
  motionPlanRef: refSchema,
  motionLockRef: refSchema,
  storyTimingResolutionRef: refSchema,
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
  totalDurationFrames: z.number().int().positive().max(36_000),
  layers: z.array(layerSchema).min(2).max(128),
  maximumConcurrentLayerCount: z.number().int().min(2).max(4),
  layerStackOrder: z.tuple([
    z.literal('source_media'), z.literal('far_background'),
    z.literal('environmental_background'), z.literal('behind_subject'),
    z.literal('living_frame'), z.literal('subject_mask_plane'),
    z.literal('speaker_adjacent'), z.literal('object_attached'),
    z.literal('in_front_of_subject'), z.literal('foreground_hero'),
    z.literal('stable_accessible_caption'), z.literal('transitions'),
  ]),
  subjectMaskFixturePolicy: z.enum([
    'none', 'deterministic_private_fixture_only_not_track_all_evidence',
  ]),
  fallbackProfileId: z.literal('approved_timed_full_frame_rgba_track'),
  accessibleCompleteWordingRetained: z.literal(true),
  exactStoryTimingFramesConsumed: z.literal(true),
  captionProducedParallelClock: z.literal(false),
  captionAboveLivingFrameByDefault: z.literal(true),
  accessibleCaptionAboveAllVisuals: z.literal(true),
  trackAllEvidenceClaimed: z.literal(false),
  brollSelectionClaimed: z.literal(false),
  arbitraryCssIncluded: z.literal(false),
  modelAuthoredCodeIncluded: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const renderSpecSchema: z.ZodType<CaptionRemotionRenderSpec> = z.object({
  schemaVersion: z.literal(CAPTION_REMOTION_RENDER_SPEC_VERSION),
  renderSpecId: safeKey,
  renderSpecDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sceneGroupRef: refSchema,
  compositionProfileId: z.literal(CAPTION_REMOTION_COMPOSITION_PROFILE),
  canonicalOperationId: z.literal('tool.remotion.render_approved_composition.v1'),
  pinnedRuntimeVersion: z.literal(CAPTION_REMOTION_PINNED_RUNTIME_VERSION),
  confirmedOutputFrameRef: refSchema,
  confirmedOutputWidth: z.number().int().positive().max(8_192),
  confirmedOutputHeight: z.number().int().positive().max(8_192),
  reviewFrame: z.object({
    width: z.literal(640), height: z.literal(360),
    scaleNumerator: z.literal(1), scaleDenominator: z.literal(3),
    exactAspectRatioPreserved: z.literal(true),
    privateReviewProxyOnly: z.literal(true),
    finalCustomerCanvasClaimed: z.literal(false),
  }).strict(),
  fps: z.literal(30),
  durationFrames: z.number().int().positive().max(36_000),
  reducedMotion: z.boolean(),
  rendererPayload: z.object({
    compositionProfileId: z.literal(CAPTION_REMOTION_COMPOSITION_PROFILE),
    width: z.literal(640), height: z.literal(360), fps: z.literal(30),
    durationFrames: z.number().int().positive().max(36_000),
    sceneGroupId: safeKey,
    sceneGroupDigestSha256: sha256,
    motionLockDigestSha256: sha256,
    storyTimingResolutionDigestSha256: sha256,
    confirmedOutputWidth: z.number().int().positive().max(8_192),
    confirmedOutputHeight: z.number().int().positive().max(8_192),
    confirmedAspectRatioNumerator: z.number().int().positive().max(100),
    confirmedAspectRatioDenominator: z.number().int().positive().max(100),
    privateReviewScaleNumerator: z.literal(1),
    privateReviewScaleDenominator: z.literal(3),
    reducedMotion: z.boolean(),
    subjectMaskFixturePolicy: z.enum([
      'none', 'deterministic_private_fixture_only_not_track_all_evidence',
    ]),
    backgroundStyle: z.literal('editorial_night_sky_v1'),
    layers: z.array(layerSchema).min(2).max(128),
  }).strict(),
  goldenFrameNumbers: z.array(z.number().int().nonnegative()).min(3).max(16),
  legacyFallbackProfileId: z.literal('approved_timed_full_frame_rgba_track'),
  exactApprovedSnapshotRereadRequiredBeforeExecution: z.literal(true),
  exactMotionLockRereadRequiredBeforeExecution: z.literal(true),
  exactStoryTimingRereadRequiredBeforeExecution: z.literal(true),
  pinnedChromiumRequired: z.literal(true),
  directRasterInspectionRequired: z.literal(true),
  technicalQaRequired: z.literal(true),
  privateReviewOnly: z.literal(true),
  finalCustomerCanvasClaimed: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

function ref(id: string, version: string, contentHash: string): CaptionDomainRef {
  return { id, version, contentHash }
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameScope(left: CaptionMultiTrackSceneGraph['canonicalScope'], right: CaptionMultiTrackSceneGraph['canonicalScope']): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function verifyDigest(value: Record<string, unknown>, field: string, label: string): void {
  if (value[field] !== calculateSkillContractDigest(value, field)) {
    throw new Error(`${label} digest is stale.`)
  }
}

function presentationKind(trackRole: CaptionRemotionLayer['trackRole'], compositionRole: string): CaptionRemotionPresentationKind {
  if (trackRole === 'accessible_sidecar' || trackRole === 'localized_accessible'
    || trackRole === 'verbatim_speech') return 'stable_accessible_caption'
  if (trackRole === 'hero_typography') return 'hero_typography'
  if (trackRole === 'persistent_topic_list') return 'persistent_topic_list'
  if (trackRole === 'caption_to_visual') return 'caption_to_visual_bridge'
  if (compositionRole === 'environmental_surface') return 'environmental_label'
  if (compositionRole === 'object_anchor') return 'object_anchor_label'
  return 'semantic_phrase_card'
}

function layoutFor(kind: CaptionRemotionPresentationKind): CaptionRemotionLayer['layoutBasisPoints'] {
  if (kind === 'stable_accessible_caption') return { x: 1_000, y: 7_450, width: 8_000, height: 1_700 }
  if (kind === 'hero_typography') return { x: 850, y: 1_550, width: 7_100, height: 3_800 }
  if (kind === 'persistent_topic_list') return { x: 6_000, y: 1_500, width: 3_200, height: 4_400 }
  if (kind === 'object_anchor_label') return { x: 5_400, y: 3_300, width: 3_800, height: 2_200 }
  if (kind === 'environmental_label') return { x: 650, y: 1_250, width: 4_400, height: 2_100 }
  if (kind === 'caption_to_visual_bridge') return { x: 1_100, y: 2_400, width: 7_800, height: 3_200 }
  return { x: 700, y: 1_450, width: 4_800, height: 2_400 }
}

function typographyFor(kind: CaptionRemotionPresentationKind): CaptionRemotionLayer['typography'] {
  if (kind === 'stable_accessible_caption') return {
    fontFamilyToken: 'approved_caption_sans_fixture_v1', fontWeight: 700,
    fontSizeBasisPointsOfFrameHeight: 720, lineHeightMilli: 1_220,
    textColor: '#F8FAFC', accentColor: '#6EE7F9', plateStyle: 'soft_dark',
    textAlign: 'center',
  }
  if (kind === 'hero_typography') return {
    fontFamilyToken: 'approved_caption_sans_fixture_v1', fontWeight: 800,
    fontSizeBasisPointsOfFrameHeight: 1_420, lineHeightMilli: 980,
    textColor: '#DFF7FF', accentColor: '#A78BFA', plateStyle: 'none',
    textAlign: 'left',
  }
  if (kind === 'persistent_topic_list') return {
    fontFamilyToken: 'approved_caption_sans_fixture_v1', fontWeight: 700,
    fontSizeBasisPointsOfFrameHeight: 620, lineHeightMilli: 1_280,
    textColor: '#09111F', accentColor: '#FBBF24', plateStyle: 'soft_light',
    textAlign: 'left',
  }
  return {
    fontFamilyToken: 'approved_caption_sans_fixture_v1', fontWeight: 700,
    fontSizeBasisPointsOfFrameHeight: 900, lineHeightMilli: 1_080,
    textColor: '#F8FAFC', accentColor: '#6EE7F9', plateStyle: 'outline_dark',
    textAlign: 'left',
  }
}

function zIndexFor(kind: CaptionRemotionPresentationKind, depthPlane: CaptionRemotionLayer['depthPlane']): number {
  if (kind === 'stable_accessible_caption') return 1_000
  if (kind === 'hero_typography') return depthPlane === 'behind_subject' ? 300 : 850
  return {
    far_background: 100, environmental_background: 200, behind_subject: 300,
    speaker_adjacent: 500, object_attached: 600, in_front_of_subject: 700,
    foreground_hero: 850, full_screen: 900, safe_accessible: 950,
  }[depthPlane]
}

function concurrency(layers: CaptionRemotionLayer[]): number {
  const events = layers.flatMap((layer) => [
    { frame: layer.frameRange.startFrame, delta: 1 },
    { frame: layer.frameRange.endFrameExclusive, delta: -1 },
  ]).sort((a, b) => a.frame - b.frame || a.delta - b.delta)
  let active = 0
  let maximum = 0
  for (const event of events) {
    active += event.delta
    maximum = Math.max(maximum, active)
  }
  return maximum
}

function compareLayers(left: CaptionRemotionLayer, right: CaptionRemotionLayer): number {
  return left.frameRange.startFrame - right.frameRange.startFrame
    || left.zIndex - right.zIndex || left.layerId.localeCompare(right.layerId)
}

function expectedGoldenFrames(
  layers: CaptionRemotionLayer[],
  totalDurationFrames: number,
): number[] {
  const phraseRanges = Array.from(new Map(layers.map((layer) => [
    `${layer.frameRange.startFrame}:${layer.frameRange.endFrameExclusive}`,
    layer.frameRange,
  ])).values()).sort((left, right) => left.startFrame - right.startFrame)
  return Array.from(new Set([
    0,
    ...phraseRanges.map((range) => Math.floor(
      (range.startFrame + range.endFrameExclusive - 1) / 2,
    )),
    totalDurationFrames - 1,
  ])).sort((left, right) => left - right)
}

function accessibilityCounterpartsAreValid(layers: CaptionRemotionLayer[]): boolean {
  const byNodeId = new Map(layers.map((layer) => [layer.nodeId, layer]))
  return layers.every((layer) => {
    if (layer.presentationKind === 'stable_accessible_caption') {
      return layer.accessibilityCounterpartNodeId === null && layer.zIndex === 1_000
    }
    if (!layer.accessibilityCounterpartNodeId) return false
    const counterpart = byNodeId.get(layer.accessibilityCounterpartNodeId)
    return counterpart?.presentationKind === 'stable_accessible_caption'
      && counterpart.phraseId === layer.phraseId
      && counterpart.frameRange.startFrame === layer.frameRange.startFrame
      && counterpart.frameRange.endFrameExclusive === layer.frameRange.endFrameExclusive
      && counterpart.exactSourceWordIds.join('|') === layer.exactSourceWordIds.join('|')
  })
}

export function createCaptionRemotionSceneGroup(input: {
  sceneGroupId: string
  sceneGraph: CaptionMultiTrackSceneGraph
  semanticStylePlan: CaptionSemanticStylePlan
  motionPlan: CaptionMotionPlan
  motionLock: CaptionMotionLock
  storyTimingResolution: CaptionStoryTimingResolutionBinding
}): CaptionRemotionSceneGroup {
  assertClosedContractTree(input, 'Caption Remotion scene-group input')
  const { sceneGraph, semanticStylePlan, motionPlan, motionLock, storyTimingResolution } = input
  verifyDigest(sceneGraph as unknown as Record<string, unknown>, 'graphDigestSha256', 'Caption scene graph')
  verifyDigest(semanticStylePlan as unknown as Record<string, unknown>, 'planDigestSha256', 'Caption semantic style plan')
  verifyDigest(motionPlan as unknown as Record<string, unknown>, 'planDigestSha256', 'Caption motion plan')
  verifyDigest(motionLock as unknown as Record<string, unknown>, 'lockDigestSha256', 'Caption motion lock')
  verifyDigest(storyTimingResolution as unknown as Record<string, unknown>, 'resolutionDigestSha256', 'Caption StoryTiming resolution')
  if (!sameScope(sceneGraph.canonicalScope, semanticStylePlan.canonicalScope)
    || !sameScope(sceneGraph.canonicalScope, motionPlan.canonicalScope)
    || !sameScope(sceneGraph.canonicalScope, motionLock.canonicalScope)
    || !sameScope(sceneGraph.canonicalScope, storyTimingResolution.canonicalScope)
    || !sameRef(sceneGraph.semanticStylePlanRef, ref(
      semanticStylePlan.planId, semanticStylePlan.schemaVersion,
      semanticStylePlan.planDigestSha256,
    ))
    || !sameRef(motionPlan.sceneGraphRef, ref(
      sceneGraph.graphId, sceneGraph.schemaVersion, sceneGraph.graphDigestSha256,
    ))
    || !sameRef(motionLock.motionPlanRef, ref(
      motionPlan.planId, motionPlan.schemaVersion, motionPlan.planDigestSha256,
    ))
    || !sameRef(motionLock.storyTimingResolutionRef, ref(
      storyTimingResolution.resolutionId, storyTimingResolution.schemaVersion,
      storyTimingResolution.resolutionDigestSha256,
    ))
    || !sameRef(sceneGraph.confirmedOutputFrameRef,
      semanticStylePlan.confirmedOutputFrame.frameRef)
    || !sameRef(sceneGraph.confirmedOutputFrameRef,
      storyTimingResolution.confirmedOutputFrameRef)) {
    throw new Error('Caption Remotion scene group has stale scope, frame, or planning lineage.')
  }
  if (semanticStylePlan.confirmedOutputFrame.width !== 1_920
    || semanticStylePlan.confirmedOutputFrame.height !== 1_080
    || semanticStylePlan.confirmedOutputFrame.aspectRatioNumerator !== 16
    || semanticStylePlan.confirmedOutputFrame.aspectRatioDenominator !== 9
    || storyTimingResolution.fpsNumerator !== 30
    || storyTimingResolution.fpsDenominator !== 1) {
    throw new Error('CAP-14 private fixture requires the exact confirmed 1920x1080@30 frame.')
  }
  const trackById = new Map(sceneGraph.tracks.map((track) => [track.trackId, track]))
  const phraseById = new Map(semanticStylePlan.phrases.map((phrase) => [phrase.phraseId, phrase]))
  const resolutionByNodeId = new Map(storyTimingResolution.nodeResolutions.map((item) => [item.nodeId, item]))
  const primitiveByNodeId = new Map(motionPlan.primitives.map((item) => [item.nodeId, item]))
  const layers = sceneGraph.nodes.map((node): CaptionRemotionLayer => {
    const track = trackById.get(node.trackId)
    const phrase = phraseById.get(node.phraseId)
    const resolution = resolutionByNodeId.get(node.nodeId)
    const primitive = primitiveByNodeId.get(node.nodeId)
    if (!track || !phrase || !resolution || !primitive
      || phrase.exactSourceWordIds.join('|') !== node.exactSourceWordIds.join('|')
      || resolution.trackId !== node.trackId || resolution.phraseId !== node.phraseId
      || primitive.frameRange.startFrame !== resolution.cueRange.startFrame
      || primitive.frameRange.endFrameExclusive !== resolution.cueRange.endFrameExclusive) {
      throw new Error(`Caption Remotion layer ${node.nodeId} has stale source or timing lineage.`)
    }
    const kind = presentationKind(track.role, node.compositionRole)
    const depthPlane = node.resolvedDepthPlane === 'subject_plane'
      ? 'safe_accessible' : node.resolvedDepthPlane
    const dependencyDisposition = node.depthDisposition === 'admitted'
      && (node.maskSequenceRef || node.objectAnchorRef || node.trackManifestRef)
      ? 'admitted_exact_private_evidence' as const
      : node.depthDisposition === 'admitted'
        ? 'not_applicable' as const : 'declared_safe_fallback' as const
    return {
      layerId: `caption.remotion.layer.${node.nodeId}`,
      nodeId: node.nodeId,
      trackId: node.trackId,
      phraseId: node.phraseId,
      trackRole: track.role,
      presentationKind: kind,
      text: phrase.displayedText,
      exactSourceWordIds: structuredClone(node.exactSourceWordIds),
      frameRange: structuredClone(resolution.cueRange),
      stableReadRange: structuredClone(resolution.stableReadRange),
      depthPlane,
      zIndex: zIndexFor(kind, depthPlane),
      layoutBasisPoints: layoutFor(kind),
      typography: typographyFor(kind),
      motion: {
        primitive: primitive.primitive,
        easing: primitive.easing,
        travelBasisPoints: structuredClone(primitive.travelBasisPoints),
        startScaleBasisPoints: primitive.startScaleBasisPoints,
        endScaleBasisPoints: primitive.endScaleBasisPoints,
        startOpacityBasisPoints: primitive.startOpacityBasisPoints,
        endOpacityBasisPoints: primitive.endOpacityBasisPoints,
        overshootBasisPoints: primitive.overshootBasisPoints,
        staggerFrames: primitive.staggerFrames,
      },
      reducedMotion: {
        primitive: primitive.reducedMotionReplacement.primitive,
        frameRange: structuredClone(primitive.reducedMotionReplacement.frameRange),
      },
      accessibilityCounterpartNodeId: node.accessibilityCounterpartNodeId,
      maskSequenceRef: structuredClone(node.maskSequenceRef),
      objectAnchorRef: structuredClone(node.objectAnchorRef),
      trackManifestRef: structuredClone(node.trackManifestRef),
      dependencyDisposition,
    }
  }).sort((left, right) => left.frameRange.startFrame - right.frameRange.startFrame
    || left.zIndex - right.zIndex || left.layerId.localeCompare(right.layerId))
  const totalDurationFrames = Math.max(...layers.map((layer) => layer.frameRange.endFrameExclusive))
  const maximumConcurrentLayerCount = concurrency(layers)
  if (maximumConcurrentLayerCount < 2 || maximumConcurrentLayerCount > 4
    || !layers.some((layer) => layer.presentationKind === 'stable_accessible_caption')
    || !layers.some((layer) => layer.presentationKind !== 'stable_accessible_caption')) {
    throw new Error('Caption Remotion scene group does not preserve bounded multi-track presentation.')
  }
  const base: Omit<CaptionRemotionSceneGroup, 'sceneGroupDigestSha256'> = {
    schemaVersion: CAPTION_REMOTION_SCENE_GROUP_VERSION,
    sceneGroupId: safeKey.parse(input.sceneGroupId),
    canonicalScope: structuredClone(sceneGraph.canonicalScope),
    sceneGraphRef: ref(sceneGraph.graphId, sceneGraph.schemaVersion, sceneGraph.graphDigestSha256),
    semanticStylePlanRef: ref(
      semanticStylePlan.planId, semanticStylePlan.schemaVersion,
      semanticStylePlan.planDigestSha256,
    ),
    motionPlanRef: ref(motionPlan.planId, motionPlan.schemaVersion, motionPlan.planDigestSha256),
    motionLockRef: ref(motionLock.lockId, motionLock.schemaVersion, motionLock.lockDigestSha256),
    storyTimingResolutionRef: ref(
      storyTimingResolution.resolutionId, storyTimingResolution.schemaVersion,
      storyTimingResolution.resolutionDigestSha256,
    ),
    confirmedOutputFrame: structuredClone(semanticStylePlan.confirmedOutputFrame),
    totalDurationFrames,
    layers,
    maximumConcurrentLayerCount,
    layerStackOrder: [
      'source_media', 'far_background', 'environmental_background',
      'behind_subject', 'living_frame', 'subject_mask_plane',
      'speaker_adjacent', 'object_attached', 'in_front_of_subject',
      'foreground_hero', 'stable_accessible_caption', 'transitions',
    ],
    subjectMaskFixturePolicy:
      'deterministic_private_fixture_only_not_track_all_evidence',
    fallbackProfileId: 'approved_timed_full_frame_rgba_track',
    accessibleCompleteWordingRetained: true,
    exactStoryTimingFramesConsumed: true,
    captionProducedParallelClock: false,
    captionAboveLivingFrameByDefault: true,
    accessibleCaptionAboveAllVisuals: true,
    trackAllEvidenceClaimed: false,
    brollSelectionClaimed: false,
    arbitraryCssIncluded: false,
    modelAuthoredCodeIncluded: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionRemotionSceneGroup({
    ...base,
    sceneGroupDigestSha256: calculateSkillContractDigest(
      { ...base, sceneGroupDigestSha256: '' }, 'sceneGroupDigestSha256'),
  })
}

export function parseCaptionRemotionSceneGroup(value: unknown): CaptionRemotionSceneGroup {
  assertClosedContractTree(value, 'Caption Remotion scene group')
  const group = sceneGroupSchema.parse(value)
  verifyDigest(group as unknown as Record<string, unknown>,
    'sceneGroupDigestSha256', 'Caption Remotion scene group')
  const measuredConcurrency = concurrency(group.layers)
  if (new Set(group.layers.map((layer) => layer.layerId)).size !== group.layers.length
    || new Set(group.layers.map((layer) => layer.nodeId)).size !== group.layers.length
    || group.layers.some((layer) =>
      new Set(layer.exactSourceWordIds).size !== layer.exactSourceWordIds.length)
    || group.layers.some((layer, index) => index > 0
      && compareLayers(group.layers[index - 1]!, layer) >= 0)
    || measuredConcurrency < 2 || measuredConcurrency > 4
    || group.maximumConcurrentLayerCount !== measuredConcurrency
    || !accessibilityCounterpartsAreValid(group.layers)
    || group.confirmedOutputFrame.width * group.confirmedOutputFrame.aspectRatioDenominator
      !== group.confirmedOutputFrame.height * group.confirmedOutputFrame.aspectRatioNumerator
    || group.layers.some((layer) => layer.frameRange.endFrameExclusive > group.totalDurationFrames
      || layer.stableReadRange.startFrame < layer.frameRange.startFrame
      || layer.stableReadRange.endFrameExclusive > layer.frameRange.endFrameExclusive
      || layer.reducedMotion.frameRange.startFrame !== layer.frameRange.startFrame
      || layer.reducedMotion.frameRange.endFrameExclusive !== layer.frameRange.endFrameExclusive
      || (layer.dependencyDisposition === 'admitted_exact_private_evidence'
        && !(layer.maskSequenceRef || layer.objectAnchorRef || layer.trackManifestRef)))) {
    throw new Error('Caption Remotion scene group is structurally inconsistent.')
  }
  return group
}

export function createCaptionRemotionRenderSpec(input: {
  renderSpecId: string
  sceneGroup: CaptionRemotionSceneGroup
  motionLock: CaptionMotionLock
  storyTimingResolution: CaptionStoryTimingResolutionBinding
  reducedMotion: boolean
}): CaptionRemotionRenderSpec {
  assertClosedContractTree(input, 'Caption Remotion render-spec input')
  const group = parseCaptionRemotionSceneGroup(input.sceneGroup)
  if (!sameRef(group.motionLockRef, ref(
    input.motionLock.lockId, input.motionLock.schemaVersion,
    input.motionLock.lockDigestSha256,
  )) || !sameRef(group.storyTimingResolutionRef, ref(
    input.storyTimingResolution.resolutionId,
    input.storyTimingResolution.schemaVersion,
    input.storyTimingResolution.resolutionDigestSha256,
  ))) throw new Error('Caption Remotion render spec has stale motion-lock or StoryTiming lineage.')
  const goldenFrameNumbers = expectedGoldenFrames(
    group.layers, group.totalDurationFrames,
  )
  const base: Omit<CaptionRemotionRenderSpec, 'renderSpecDigestSha256'> = {
    schemaVersion: CAPTION_REMOTION_RENDER_SPEC_VERSION,
    renderSpecId: safeKey.parse(input.renderSpecId),
    canonicalScope: structuredClone(group.canonicalScope),
    sceneGroupRef: ref(
      group.sceneGroupId, group.schemaVersion, group.sceneGroupDigestSha256,
    ),
    compositionProfileId: CAPTION_REMOTION_COMPOSITION_PROFILE,
    canonicalOperationId: 'tool.remotion.render_approved_composition.v1',
    pinnedRuntimeVersion: CAPTION_REMOTION_PINNED_RUNTIME_VERSION,
    confirmedOutputFrameRef: structuredClone(group.confirmedOutputFrame.frameRef),
    confirmedOutputWidth: group.confirmedOutputFrame.width,
    confirmedOutputHeight: group.confirmedOutputFrame.height,
    reviewFrame: {
      width: 640, height: 360, scaleNumerator: 1, scaleDenominator: 3,
      exactAspectRatioPreserved: true, privateReviewProxyOnly: true,
      finalCustomerCanvasClaimed: false,
    },
    fps: 30,
    durationFrames: group.totalDurationFrames,
    reducedMotion: input.reducedMotion,
    rendererPayload: {
      compositionProfileId: CAPTION_REMOTION_COMPOSITION_PROFILE,
      width: 640, height: 360, fps: 30,
      durationFrames: group.totalDurationFrames,
      sceneGroupId: group.sceneGroupId,
      sceneGroupDigestSha256: group.sceneGroupDigestSha256,
      motionLockDigestSha256: input.motionLock.lockDigestSha256,
      storyTimingResolutionDigestSha256:
        input.storyTimingResolution.resolutionDigestSha256,
      confirmedOutputWidth: group.confirmedOutputFrame.width,
      confirmedOutputHeight: group.confirmedOutputFrame.height,
      confirmedAspectRatioNumerator: group.confirmedOutputFrame.aspectRatioNumerator,
      confirmedAspectRatioDenominator: group.confirmedOutputFrame.aspectRatioDenominator,
      privateReviewScaleNumerator: 1,
      privateReviewScaleDenominator: 3,
      reducedMotion: input.reducedMotion,
      subjectMaskFixturePolicy: group.subjectMaskFixturePolicy,
      backgroundStyle: 'editorial_night_sky_v1',
      layers: structuredClone(group.layers),
    },
    goldenFrameNumbers,
    legacyFallbackProfileId: 'approved_timed_full_frame_rgba_track',
    exactApprovedSnapshotRereadRequiredBeforeExecution: true,
    exactMotionLockRereadRequiredBeforeExecution: true,
    exactStoryTimingRereadRequiredBeforeExecution: true,
    pinnedChromiumRequired: true,
    directRasterInspectionRequired: true,
    technicalQaRequired: true,
    privateReviewOnly: true,
    finalCustomerCanvasClaimed: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionRemotionRenderSpec({
    ...base,
    renderSpecDigestSha256: calculateSkillContractDigest(
      { ...base, renderSpecDigestSha256: '' }, 'renderSpecDigestSha256'),
  }, group)
}

export function parseCaptionRemotionRenderSpec(
  value: unknown,
  sceneGroupValue: unknown,
): CaptionRemotionRenderSpec {
  assertClosedContractTree(value, 'Caption Remotion render spec')
  const spec = renderSpecSchema.parse(value)
  const group = parseCaptionRemotionSceneGroup(sceneGroupValue)
  verifyDigest(spec as unknown as Record<string, unknown>,
    'renderSpecDigestSha256', 'Caption Remotion render spec')
  const expectedFrames = expectedGoldenFrames(group.layers, group.totalDurationFrames)
  if (!sameScope(spec.canonicalScope, group.canonicalScope)
    || !sameRef(spec.sceneGroupRef, ref(
      group.sceneGroupId, group.schemaVersion, group.sceneGroupDigestSha256,
    ))
    || !sameRef(spec.confirmedOutputFrameRef, group.confirmedOutputFrame.frameRef)
    || spec.confirmedOutputWidth !== group.confirmedOutputFrame.width
    || spec.confirmedOutputHeight !== group.confirmedOutputFrame.height
    || spec.reviewFrame.width * spec.reviewFrame.scaleDenominator
      !== spec.confirmedOutputWidth * spec.reviewFrame.scaleNumerator
    || spec.reviewFrame.height * spec.reviewFrame.scaleDenominator
      !== spec.confirmedOutputHeight * spec.reviewFrame.scaleNumerator
    || spec.fps * group.confirmedOutputFrame.fpsDenominator
      !== group.confirmedOutputFrame.fpsNumerator
    || spec.durationFrames !== group.totalDurationFrames
    || spec.rendererPayload.durationFrames !== spec.durationFrames
    || spec.rendererPayload.sceneGroupId !== group.sceneGroupId
    || spec.rendererPayload.sceneGroupDigestSha256 !== group.sceneGroupDigestSha256
    || spec.rendererPayload.motionLockDigestSha256 !== group.motionLockRef.contentHash
    || spec.rendererPayload.storyTimingResolutionDigestSha256
      !== group.storyTimingResolutionRef.contentHash
    || spec.rendererPayload.confirmedOutputWidth !== group.confirmedOutputFrame.width
    || spec.rendererPayload.confirmedOutputHeight !== group.confirmedOutputFrame.height
    || spec.rendererPayload.confirmedAspectRatioNumerator
      !== group.confirmedOutputFrame.aspectRatioNumerator
    || spec.rendererPayload.confirmedAspectRatioDenominator
      !== group.confirmedOutputFrame.aspectRatioDenominator
    || spec.rendererPayload.reducedMotion !== spec.reducedMotion
    || JSON.stringify(spec.rendererPayload.layers) !== JSON.stringify(group.layers)
    || spec.goldenFrameNumbers.join('|') !== expectedFrames.join('|')) {
    throw new Error('Caption Remotion render spec is stale or inconsistent.')
  }
  return spec
}
