import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CAPTION_REMOTION_BROLL_OWNER_COMPOSITION_PROFILE,
  CAPTION_REMOTION_BROLL_OWNER_REVIEW_SPEC_VERSION,
  type CaptionRemotionBrollOwnerReviewSpec,
} from '../../src/types/caption-remotion-broll-owner-review'
import type {
  BrollCaptionCanonicalScope,
  BrollCaptionOwnerReadResult,
} from '../../src/types/caption-broll-owner-read-adapter'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  isCaptionBrollOwnerRealSourceSceneGroupPayload,
  OFFLINE_REMOTION_RENDER_OPERATION,
  OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
  validateOfflineRemotionRenderRequest,
  type OfflineRemotionCaptionBrollOwnerRealSourceSceneGroupPayload,
  type OfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import { parseBrollCaptionOwnerReadResult } from
  './caption-broll-owner-read-adapter'
import { parseCaptionRemotionLayers } from './caption-remotion-scene-group'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) =>
  range.endFrameExclusive > range.startFrame)
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).length(1),
}).strict()
const ownerLineageSchema = z.object({
  ownerRequestRef: refSchema,
  ownerResultRef: refSchema,
  brollResultReceiptRef: refSchema,
  selectedMediaManifestRef: refSchema,
  layoutOccupancyRef: refSchema,
  cropTimingRef: refSchema,
  visibleTextEvidenceRef: refSchema,
  authenticatedOwnerEvidenceRef: refSchema,
  ownerCanonicalScopeDigestSha256: sha256,
  exactOwnerResultRereadVerified: z.literal(true),
  sourceSelectionPerformedByCaption: z.literal(false),
  cropOrTimingPerformedByCaption: z.literal(false),
}).strict()
const sourceEvidenceSchema = z.object({
  selectedNormalizedArtifactRef: refSchema,
  selectedNormalizedArtifactMimeType: z.literal('video/x-nut'),
  selectedNormalizedArtifactByteLength: z.number().int().min(1_024)
    .max(16 * 1024 * 1024),
  selectedNormalizedArtifactFrameCount: z.number().int().min(24).max(900),
  selectedNormalizedArtifactFps: z.literal(24),
  remotionProxyRef: refSchema,
  remotionProxyMimeType: z.literal('video/x-matroska'),
  remotionProxyByteLength: z.number().int().min(1_024)
    .max(16 * 1024 * 1024),
  remotionProxySha256: sha256,
  remotionProxyProfileId: z.literal(
    'approved_b_roll_remotion_preview_proxy_matroska_v1'),
  remotionProxyDerivedFromSelectedArtifact: z.literal(true),
  selectedSourceAudioRemovedByOwner: z.literal(true),
  sourceMediaPolicy: z.literal(
    'approved_b_roll_qa_normalized_preview_proxy_v1'),
}).strict()
const wordingEvidenceSchema = z.object({
  reviewRef: refSchema,
  reviewDigestSha256: sha256,
  reviewPolicy: z.literal('fixture_specific_human_review_phrase_level_only_v1'),
  timingProvenance: z.literal('synthetic_estimate'),
  phraseLevelOnly: z.literal(true),
  wordLockedMotionUsed: z.literal(false),
  canonicalTranscriptQualificationClaimed: z.literal(false),
}).strict()
const confirmedOutputFrameSchema = z.object({
  frameRef: refSchema,
  outputId: safeKey,
  width: z.literal(1_920),
  height: z.literal(1_080),
  aspectRatioNumerator: z.literal(16),
  aspectRatioDenominator: z.literal(9),
  fpsNumerator: z.literal(24),
  fpsDenominator: z.literal(1),
}).strict()
const privateReviewFrameSchema = z.object({
  width: z.literal(640),
  height: z.literal(360),
  scaleNumerator: z.literal(1),
  scaleDenominator: z.literal(3),
  exactAspectRatioPreserved: z.literal(true),
  finalCustomerCanvasClaimed: z.literal(false),
}).strict()

const reviewSpecSchema = z.object({
  schemaVersion: z.literal(
    CAPTION_REMOTION_BROLL_OWNER_REVIEW_SPEC_VERSION),
  reviewSpecId: safeKey,
  reviewSpecDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sceneGroupRef: refSchema,
  motionLockRef: refSchema,
  storyTimingResolutionRef: refSchema,
  masterTimingRef: refSchema,
  masterTimingHash: sha256,
  brollOwnerLineage: ownerLineageSchema,
  sourceEvidence: sourceEvidenceSchema,
  wordingEvidence: wordingEvidenceSchema,
  confirmedOutputFrame: confirmedOutputFrameSchema,
  privateReviewFrame: privateReviewFrameSchema,
  compositionProfileId: z.literal(
    CAPTION_REMOTION_BROLL_OWNER_COMPOSITION_PROFILE),
  canonicalOperationId: z.literal(
    'tool.remotion.render_approved_composition.v1'),
  masterTimelineStartFrame: z.number().int().nonnegative(),
  masterTimelineEndFrameExclusive: z.number().int().positive(),
  durationFrames: z.number().int().min(24).max(900),
  reducedMotion: z.boolean(),
  inspectionFrameNumbers: z.array(z.number().int().nonnegative()).min(4)
    .max(16),
  layers: z.array(z.unknown()).length(4),
  sourcePresentation: z.literal('full_frame_cutaway_v1'),
  safePlacementPolicy: z.literal(
    'broll_center_safe_caption_lower_band_v1'),
  sourceBehindAllCaptionLayers: z.literal(true),
  stableAccessibleCaptionAboveVisualLayers: z.literal(true),
  subjectMaskFixturePolicy: z.literal('none'),
  trackAllEvidenceClaimed: z.literal(false),
  directRasterInspectionRequired: z.literal(true),
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance:
    z.literal(false),
  realSourcePixelsRequiredForProfessionalAppearance: z.literal(true),
  privateReviewOnly: z.literal(true),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

type CreateInput = Pick<CaptionRemotionBrollOwnerReviewSpec,
  | 'reviewSpecId'
  | 'canonicalScope'
  | 'sceneGroupRef'
  | 'motionLockRef'
  | 'storyTimingResolutionRef'
  | 'sourceEvidence'
  | 'wordingEvidence'
  | 'confirmedOutputFrame'
  | 'reducedMotion'
  | 'inspectionFrameNumbers'
  | 'layers'
> & {
  ownerResult: BrollCaptionOwnerReadResult
}

function refMatches(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function ownerScopeDigest(scope: BrollCaptionCanonicalScope): string {
  return calculateSkillContractDigest(
    { canonicalScope: scope, digest: '' }, 'digest')
}

function ownerScopeFromSpec(
  spec: CaptionRemotionBrollOwnerReviewSpec,
): BrollCaptionCanonicalScope {
  const range = spec.canonicalScope.authorizedFrameRanges[0]!
  if (spec.canonicalScope.approvedSnapshotRef === null
    || spec.canonicalScope.sceneId === null) {
    throw new Error('Caption B-roll review requires approved scene scope.')
  }
  return {
    ownerUserId: spec.canonicalScope.ownerUserId,
    workspaceId: spec.canonicalScope.workspaceId,
    projectId: spec.canonicalScope.projectId,
    editSessionId: spec.canonicalScope.editSessionId,
    planVersionId: spec.canonicalScope.planVersionId,
    approvedSnapshotRef: structuredClone(
      spec.canonicalScope.approvedSnapshotRef),
    outputId: spec.canonicalScope.outputId,
    outputFrameRef: structuredClone(spec.confirmedOutputFrame.frameRef),
    sceneId: spec.canonicalScope.sceneId,
    authorizedFrameRange: {
      startFrameInclusive: range.startFrame,
      endFrameExclusive: range.endFrameExclusive,
      fps: 24,
    },
    masterTimingRef: structuredClone(spec.masterTimingRef),
    masterTimingHash: spec.masterTimingHash,
  }
}

function assertOwnerScopeMatchesInput(
  input: CreateInput,
  ownerResult: BrollCaptionOwnerReadResult,
): void {
  const scope = input.canonicalScope
  const ownerScope = ownerResult.canonicalScope
  const range = scope.authorizedFrameRanges[0]
  if (scope.approvedSnapshotRef === null || scope.sceneId === null || !range
    || scope.ownerUserId !== ownerScope.ownerUserId
    || scope.workspaceId !== ownerScope.workspaceId
    || scope.projectId !== ownerScope.projectId
    || scope.editSessionId !== ownerScope.editSessionId
    || scope.planVersionId !== ownerScope.planVersionId
    || !refMatches(scope.approvedSnapshotRef,
      ownerScope.approvedSnapshotRef)
    || scope.outputId !== ownerScope.outputId
    || scope.sceneId !== ownerScope.sceneId
    || range.startFrame !== ownerScope.authorizedFrameRange.startFrameInclusive
    || range.endFrameExclusive
      !== ownerScope.authorizedFrameRange.endFrameExclusive
    || ownerScope.authorizedFrameRange.fps !== 24
    || !refMatches(input.confirmedOutputFrame.frameRef,
      ownerScope.outputFrameRef)
    || input.confirmedOutputFrame.outputId !== ownerScope.outputId) {
    throw new Error(
      'Caption B-roll review diverges from the exact owner-result scope.',
    )
  }
}

export function createCaptionRemotionBrollOwnerReviewSpec(
  input: CreateInput,
): CaptionRemotionBrollOwnerReviewSpec {
  assertClosedContractTree(input,
    'Caption B-roll-owner review-spec input')
  const ownerResult = parseBrollCaptionOwnerReadResult(input.ownerResult)
  assertOwnerScopeMatchesInput(input, ownerResult)
  const masterTimelineStartFrame =
    ownerResult.canonicalScope.authorizedFrameRange.startFrameInclusive
  const masterTimelineEndFrameExclusive =
    ownerResult.canonicalScope.authorizedFrameRange.endFrameExclusive
  const durationFrames = masterTimelineEndFrameExclusive
    - masterTimelineStartFrame
  const base: Omit<CaptionRemotionBrollOwnerReviewSpec,
    'reviewSpecDigestSha256'> = {
    schemaVersion: CAPTION_REMOTION_BROLL_OWNER_REVIEW_SPEC_VERSION,
    reviewSpecId: input.reviewSpecId,
    canonicalScope: structuredClone(input.canonicalScope),
    sceneGroupRef: structuredClone(input.sceneGroupRef),
    motionLockRef: structuredClone(input.motionLockRef),
    storyTimingResolutionRef: structuredClone(input.storyTimingResolutionRef),
    masterTimingRef: structuredClone(ownerResult.canonicalScope.masterTimingRef),
    masterTimingHash: ownerResult.canonicalScope.masterTimingHash,
    brollOwnerLineage: {
      ownerRequestRef: structuredClone(ownerResult.ownerRequestRef),
      ownerResultRef: {
        id: ownerResult.resultId,
        version: ownerResult.schemaVersion,
        contentHash: ownerResult.resultDigestSha256,
      },
      brollResultReceiptRef:
        structuredClone(ownerResult.brollResultReceiptRef),
      selectedMediaManifestRef:
        structuredClone(ownerResult.selectedMediaManifestRef),
      layoutOccupancyRef:
        structuredClone(ownerResult.layoutOccupancyRef),
      cropTimingRef: structuredClone(ownerResult.cropTimingRef),
      visibleTextEvidenceRef:
        structuredClone(ownerResult.visibleTextEvidenceRef),
      authenticatedOwnerEvidenceRef:
        structuredClone(ownerResult.authenticatedOwnerEvidenceRef),
      ownerCanonicalScopeDigestSha256:
        ownerScopeDigest(ownerResult.canonicalScope),
      exactOwnerResultRereadVerified: true,
      sourceSelectionPerformedByCaption: false,
      cropOrTimingPerformedByCaption: false,
    },
    sourceEvidence: structuredClone(input.sourceEvidence),
    wordingEvidence: structuredClone(input.wordingEvidence),
    confirmedOutputFrame: structuredClone(input.confirmedOutputFrame),
    privateReviewFrame: {
      width: 640,
      height: 360,
      scaleNumerator: 1,
      scaleDenominator: 3,
      exactAspectRatioPreserved: true,
      finalCustomerCanvasClaimed: false,
    },
    compositionProfileId:
      CAPTION_REMOTION_BROLL_OWNER_COMPOSITION_PROFILE,
    canonicalOperationId: 'tool.remotion.render_approved_composition.v1',
    masterTimelineStartFrame,
    masterTimelineEndFrameExclusive,
    durationFrames,
    reducedMotion: input.reducedMotion,
    inspectionFrameNumbers: structuredClone(input.inspectionFrameNumbers),
    layers: structuredClone(input.layers),
    sourcePresentation: 'full_frame_cutaway_v1',
    safePlacementPolicy: 'broll_center_safe_caption_lower_band_v1',
    sourceBehindAllCaptionLayers: true,
    stableAccessibleCaptionAboveVisualLayers: true,
    subjectMaskFixturePolicy: 'none',
    trackAllEvidenceClaimed: false,
    directRasterInspectionRequired: true,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    realSourcePixelsRequiredForProfessionalAppearance: true,
    privateReviewOnly: true,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionRemotionBrollOwnerReviewSpec({
    ...base,
    reviewSpecDigestSha256: calculateSkillContractDigest(
      { ...base, reviewSpecDigestSha256: '' },
      'reviewSpecDigestSha256'),
  })
}

export function parseCaptionRemotionBrollOwnerReviewSpec(
  value: unknown,
): CaptionRemotionBrollOwnerReviewSpec {
  assertClosedContractTree(value, 'Caption B-roll-owner review spec')
  const raw = reviewSpecSchema.parse(value)
  const layers = parseCaptionRemotionLayers(raw.layers)
  const spec = { ...raw, layers } as CaptionRemotionBrollOwnerReviewSpec
  if (spec.reviewSpecDigestSha256 !== calculateSkillContractDigest(
    spec as unknown as Record<string, unknown>,
    'reviewSpecDigestSha256')) {
    throw new Error('Caption B-roll-owner review digest is stale.')
  }
  const ownerScope = ownerScopeFromSpec(spec)
  const requiredFrames = new Set([
    0,
    ...layers.map((layer) => Math.floor(
      (layer.frameRange.startFrame + layer.frameRange.endFrameExclusive - 1)
      / 2,
    )),
    spec.durationFrames - 1,
  ])
  const accessibleByNode = new Map(layers
    .filter((layer) =>
      layer.presentationKind === 'stable_accessible_caption')
    .map((layer) => [layer.nodeId, layer]))
  if (
    spec.masterTimingRef.contentHash !== spec.masterTimingHash
    || ownerScopeDigest(ownerScope)
      !== spec.brollOwnerLineage.ownerCanonicalScopeDigestSha256
    || spec.canonicalScope.outputId !== spec.confirmedOutputFrame.outputId
    || !refMatches(spec.confirmedOutputFrame.frameRef,
      ownerScope.outputFrameRef)
    || spec.brollOwnerLineage.ownerRequestRef.version
      !== 'b_roll_caption_owner_read_request_v1'
    || spec.brollOwnerLineage.ownerResultRef.version
      !== 'b_roll_caption_owner_read_result_v1'
    || spec.brollOwnerLineage.brollResultReceiptRef.version
      !== 'b_roll_result_receipt_v1'
    || spec.brollOwnerLineage.selectedMediaManifestRef.version
      !== 'b_roll_candidate_media_manifest_v1'
    || spec.brollOwnerLineage.layoutOccupancyRef.version
      !== 'b_roll_remotion_layer_manifest_v1'
    || spec.brollOwnerLineage.cropTimingRef.version
      !== 'b_roll_caption_crop_timing_projection_v1'
    || spec.brollOwnerLineage.visibleTextEvidenceRef.version
      !== 'b_roll_caption_visible_text_evidence_v1'
    || spec.brollOwnerLineage.authenticatedOwnerEvidenceRef.version
      !== 'b_roll_authenticated_owner_read_evidence_v1'
    || spec.sourceEvidence.selectedNormalizedArtifactRef.version
      !== 'b_roll_selected_normalized_media_v1'
    || spec.sourceEvidence.remotionProxyRef.version
      !== 'b_roll_remotion_preview_proxy_matroska_v1'
    || spec.sourceEvidence.remotionProxyRef.contentHash
      !== spec.sourceEvidence.remotionProxySha256
    || spec.wordingEvidence.reviewRef.contentHash
      !== spec.wordingEvidence.reviewDigestSha256
    || spec.masterTimelineEndFrameExclusive
      - spec.masterTimelineStartFrame !== spec.durationFrames
    || spec.sourceEvidence.selectedNormalizedArtifactFrameCount
      !== spec.durationFrames
    || new Set(spec.inspectionFrameNumbers).size
      !== spec.inspectionFrameNumbers.length
    || spec.inspectionFrameNumbers.some((frame, index) =>
      frame >= spec.durationFrames
      || (index > 0 && frame <= spec.inspectionFrameNumbers[index - 1]!))
    || [...requiredFrames].some((frame) =>
      !spec.inspectionFrameNumbers.includes(frame))
    || layers.filter((layer) =>
      layer.presentationKind === 'stable_accessible_caption').length !== 2
    || layers.filter((layer) =>
      layer.presentationKind === 'hero_typography').length !== 2
    || layers.some((layer) =>
      layer.frameRange.endFrameExclusive > spec.durationFrames
      || layer.layoutBasisPoints.y < 5_400
      || layer.layoutBasisPoints.y + layer.layoutBasisPoints.height > 9_300
      || layer.maskSequenceRef !== null
      || layer.objectAnchorRef !== null
      || layer.trackManifestRef !== null
      || layer.dependencyDisposition !== 'not_applicable'
      || (layer.presentationKind === 'stable_accessible_caption'
        && layer.zIndex !== 1_000)
      || (layer.presentationKind === 'hero_typography'
        && (!layer.accessibilityCounterpartNodeId
          || accessibleByNode.get(layer.accessibilityCounterpartNodeId)
            ?.phraseId !== layer.phraseId)))
  ) {
    throw new Error('Caption B-roll-owner review spec is inconsistent.')
  }
  return spec
}

export function assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult(input: {
  spec: unknown
  ownerResult: unknown
}): CaptionRemotionBrollOwnerReviewSpec {
  const spec = parseCaptionRemotionBrollOwnerReviewSpec(input.spec)
  const ownerResult = parseBrollCaptionOwnerReadResult(input.ownerResult)
  const ownerScope = ownerScopeFromSpec(spec)
  const ownerLineage = spec.brollOwnerLineage
  if (
    ownerScopeDigest(ownerScope) !== ownerScopeDigest(ownerResult.canonicalScope)
    || ownerLineage.ownerRequestRef.id !== ownerResult.ownerRequestRef.id
    || !refMatches(ownerLineage.ownerRequestRef,
      ownerResult.ownerRequestRef)
    || ownerLineage.ownerResultRef.id !== ownerResult.resultId
    || ownerLineage.ownerResultRef.version !== ownerResult.schemaVersion
    || ownerLineage.ownerResultRef.contentHash
      !== ownerResult.resultDigestSha256
    || !refMatches(ownerLineage.brollResultReceiptRef,
      ownerResult.brollResultReceiptRef)
    || !refMatches(ownerLineage.selectedMediaManifestRef,
      ownerResult.selectedMediaManifestRef)
    || !refMatches(ownerLineage.layoutOccupancyRef,
      ownerResult.layoutOccupancyRef)
    || !refMatches(ownerLineage.cropTimingRef,
      ownerResult.cropTimingRef)
    || !refMatches(ownerLineage.visibleTextEvidenceRef,
      ownerResult.visibleTextEvidenceRef)
    || !refMatches(ownerLineage.authenticatedOwnerEvidenceRef,
      ownerResult.authenticatedOwnerEvidenceRef)
    || !refMatches(spec.masterTimingRef,
      ownerResult.canonicalScope.masterTimingRef)
    || spec.masterTimingHash !== ownerResult.canonicalScope.masterTimingHash
    || !refMatches(spec.confirmedOutputFrame.frameRef,
      ownerResult.canonicalScope.outputFrameRef)
  ) {
    throw new Error(
      'Caption B-roll-owner review does not bind the exact reread owner result.',
    )
  }
  return spec
}

export function buildCaptionRemotionBrollOwnerReviewRequest(input: {
  spec: CaptionRemotionBrollOwnerReviewSpec
  ownerResult: BrollCaptionOwnerReadResult
  remotionProxyBytes: Buffer
}): OfflineRemotionRenderRequest & {
  payload: OfflineRemotionCaptionBrollOwnerRealSourceSceneGroupPayload
} {
  const spec = assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult({
    spec: input.spec,
    ownerResult: input.ownerResult,
  })
  if (!Buffer.isBuffer(input.remotionProxyBytes)
    || input.remotionProxyBytes.byteLength
      !== spec.sourceEvidence.remotionProxyByteLength
    || createHash('sha256').update(input.remotionProxyBytes).digest('hex')
      !== spec.sourceEvidence.remotionProxySha256
    || input.remotionProxyBytes[0] !== 0x1a
    || input.remotionProxyBytes[1] !== 0x45
    || input.remotionProxyBytes[2] !== 0xdf
    || input.remotionProxyBytes[3] !== 0xa3) {
    throw new Error(
      'Caption B-roll-owner proxy bytes do not match the spec.',
    )
  }
  const owner = spec.brollOwnerLineage
  const source = spec.sourceEvidence
  const request = validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      compositionProfileId:
        CAPTION_REMOTION_BROLL_OWNER_COMPOSITION_PROFILE,
      width: 640,
      height: 360,
      fps: 24,
      durationFrames: spec.durationFrames,
      sceneGroupId: spec.sceneGroupRef.id,
      sceneGroupDigestSha256: spec.sceneGroupRef.contentHash,
      motionLockDigestSha256: spec.motionLockRef.contentHash,
      storyTimingResolutionDigestSha256:
        spec.storyTimingResolutionRef.contentHash,
      masterTimingDigestSha256: spec.masterTimingHash,
      confirmedOutputWidth: 1_920,
      confirmedOutputHeight: 1_080,
      confirmedAspectRatioNumerator: 16,
      confirmedAspectRatioDenominator: 9,
      privateReviewScaleNumerator: 1,
      privateReviewScaleDenominator: 3,
      reducedMotion: spec.reducedMotion,
      subjectMaskFixturePolicy: 'none',
      backgroundStyle: 'broll_owner_real_source_full_frame_v1',
      sourcePresentation: 'full_frame_cutaway_v1',
      safePlacementPolicy: spec.safePlacementPolicy,
      sourceMediaPolicy: source.sourceMediaPolicy,
      sourceMimeType: 'video/x-matroska',
      sourceByteLength: input.remotionProxyBytes.byteLength,
      sourceSha256: source.remotionProxySha256,
      sourceBytesBase64: input.remotionProxyBytes.toString('base64'),
      sourceStartFrame: 0,
      sourceEndFrameExclusive: spec.durationFrames,
      sourceFit: 'contain',
      audioPolicy: 'source_audio_absent_owner_normalized',
      masterTimelineStartFrame: spec.masterTimelineStartFrame,
      masterTimelineEndFrameExclusive:
        spec.masterTimelineEndFrameExclusive,
      ownerRequestDigestSha256: owner.ownerRequestRef.contentHash,
      ownerResultDigestSha256: owner.ownerResultRef.contentHash,
      brollResultReceiptDigestSha256:
        owner.brollResultReceiptRef.contentHash,
      selectedMediaManifestDigestSha256:
        owner.selectedMediaManifestRef.contentHash,
      layoutOccupancyDigestSha256: owner.layoutOccupancyRef.contentHash,
      cropTimingDigestSha256: owner.cropTimingRef.contentHash,
      visibleTextEvidenceDigestSha256:
        owner.visibleTextEvidenceRef.contentHash,
      authenticatedOwnerEvidenceDigestSha256:
        owner.authenticatedOwnerEvidenceRef.contentHash,
      ownerCanonicalScopeDigestSha256:
        owner.ownerCanonicalScopeDigestSha256,
      selectedNormalizedSourceSha256:
        source.selectedNormalizedArtifactRef.contentHash,
      selectedNormalizedSourceByteLength:
        source.selectedNormalizedArtifactByteLength,
      selectedNormalizedSourceFrameCount:
        source.selectedNormalizedArtifactFrameCount,
      selectedNormalizedSourceFps: 24,
      remotionProxyProfileId: source.remotionProxyProfileId,
      remotionProxyDerivedFromSelectedArtifact: true,
      exactOwnerResultRereadVerified: true,
      sourceSelectionPerformedByCaption: false,
      cropOrTimingPerformedByCaption: false,
      captionWordingReviewDigestSha256:
        spec.wordingEvidence.reviewDigestSha256,
      captionWordingReviewPolicy: spec.wordingEvidence.reviewPolicy,
      wordLockedMotionUsed: false,
      canonicalTranscriptQualificationClaimed: false,
      syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
      realSourcePixelsRequiredForProfessionalAppearance: true,
      inspectionFrameNumbers: spec.inspectionFrameNumbers,
      layers: spec.layers,
    },
  })
  if (!isCaptionBrollOwnerRealSourceSceneGroupPayload(request.payload)) {
    throw new Error(
      'Caption B-roll-owner request lost its closed V4 profile.',
    )
  }
  return request as OfflineRemotionRenderRequest & {
    payload: OfflineRemotionCaptionBrollOwnerRealSourceSceneGroupPayload
  }
}
