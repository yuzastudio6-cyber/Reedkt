import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_COMPOSITION_PROFILE,
  CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_REVIEW_SPEC_VERSION,
  type CaptionRemotionBrollOwnerApprovedRunReviewSpec,
} from '../../src/types/caption-remotion-broll-owner-approved-run-review'
import type {
  BrollCaptionCanonicalScope,
  BrollCaptionOwnerReadResult,
} from '../../src/types/caption-broll-owner-read-adapter'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  isCaptionBrollOwnerApprovedRunSceneGroupPayload,
  OFFLINE_REMOTION_RENDER_OPERATION,
  OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
  validateOfflineRemotionRenderRequest,
  type OfflineRemotionCaptionBrollOwnerApprovedRunSceneGroupPayload,
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
const approvedRunLineageSchema = z.object({
  approvedSnapshotRef: refSchema,
  executionPackageRef: refSchema,
  captionPlanningProjectionRef: refSchema,
  captionPlanningBindingRef: refSchema,
  captionRenderedMediaWorkBindingRef: refSchema,
  exactImmutableApprovedRunRereadVerified: z.literal(true),
  creativeReviewSupplementsCanonicalFinalCanvas: z.literal(true),
  creativeReviewReplacesCanonicalFinalCanvas: z.literal(false),
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
    .max(32 * 1024 * 1024),
  selectedNormalizedArtifactFrameCount: z.number().int().min(24).max(900),
  selectedNormalizedArtifactFps: z.literal(30),
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
  reviewPolicy: z.literal(
    'canonical_approved_run_phrase_lineage_review_v1'),
  canonicalTranscriptRef: refSchema,
  canonicalTranscriptEvidenceRef: refSchema,
  timingProvenance: z.enum(['asr_native', 'manually_corrected']),
  phraseLevelOnly: z.literal(true),
  wordLockedMotionUsed: z.literal(false),
  exactSourceWordLineageBound: z.literal(true),
  canonicalTranscriptQualificationClaimed: z.literal(false),
}).strict()
const confirmedOutputFrameSchema = z.object({
  frameRef: refSchema,
  outputId: safeKey,
  width: z.literal(3_840),
  height: z.literal(2_160),
  aspectRatioNumerator: z.literal(16),
  aspectRatioDenominator: z.literal(9),
  fpsNumerator: z.literal(30),
  fpsDenominator: z.literal(1),
}).strict()
const privateReviewFrameSchema = z.object({
  width: z.literal(640),
  height: z.literal(360),
  scaleNumerator: z.literal(1),
  scaleDenominator: z.literal(6),
  exactAspectRatioPreserved: z.literal(true),
  finalCustomerCanvasClaimed: z.literal(false),
}).strict()
const reviewSpecSchema = z.object({
  schemaVersion: z.literal(
    CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_REVIEW_SPEC_VERSION),
  reviewSpecId: safeKey,
  reviewSpecDigestSha256: sha256,
  canonicalScope: scopeSchema,
  approvedRunLineage: approvedRunLineageSchema,
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
    CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_COMPOSITION_PROFILE),
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
  completeTimeInspectionRequired: z.literal(true),
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

type CreateInput = Pick<
  CaptionRemotionBrollOwnerApprovedRunReviewSpec,
  | 'reviewSpecId'
  | 'canonicalScope'
  | 'approvedRunLineage'
  | 'sceneGroupRef'
  | 'motionLockRef'
  | 'storyTimingResolutionRef'
  | 'sourceEvidence'
  | 'wordingEvidence'
  | 'confirmedOutputFrame'
  | 'reducedMotion'
  | 'inspectionFrameNumbers'
  | 'layers'
> & { ownerResult: BrollCaptionOwnerReadResult }

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
  spec: CaptionRemotionBrollOwnerApprovedRunReviewSpec,
): BrollCaptionCanonicalScope {
  const range = spec.canonicalScope.authorizedFrameRanges[0]!
  if (spec.canonicalScope.approvedSnapshotRef === null
    || spec.canonicalScope.sceneId === null) {
    throw new Error('Caption approved-run B-roll review requires scene scope.')
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
      fps: 30,
    },
    masterTimingRef: structuredClone(spec.masterTimingRef),
    masterTimingHash: spec.masterTimingHash,
  }
}

function assertCreateScope(
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
    || !refMatches(scope.approvedSnapshotRef,
      input.approvedRunLineage.approvedSnapshotRef)
    || scope.outputId !== ownerScope.outputId
    || scope.sceneId !== ownerScope.sceneId
    || range.startFrame !== ownerScope.authorizedFrameRange.startFrameInclusive
    || range.endFrameExclusive
      !== ownerScope.authorizedFrameRange.endFrameExclusive
    || ownerScope.authorizedFrameRange.fps !== 30
    || !refMatches(input.confirmedOutputFrame.frameRef,
      ownerScope.outputFrameRef)
    || input.confirmedOutputFrame.outputId !== ownerScope.outputId
    || input.approvedRunLineage.captionRenderedMediaWorkBindingRef.version
      !== 'canonical-caption-rendered-media-work-binding-v1'
    || ![
      'canonical-caption-specialist-planning-projection-v1',
      'canonical-caption-specialist-planning-projection-v2',
      'canonical-caption-specialist-planning-projection-v3',
    ].includes(input.approvedRunLineage.captionPlanningProjectionRef.version)
    || ![
      'canonical-caption-specialist-planning-binding-v1',
      'canonical-caption-specialist-planning-binding-v2',
      'canonical-caption-specialist-planning-binding-v3',
    ].includes(input.approvedRunLineage.captionPlanningBindingRef.version)) {
    throw new Error(
      'Caption approved-run B-roll review crossed immutable run authority.',
    )
  }
}

export function createCaptionRemotionBrollOwnerApprovedRunReviewSpec(
  input: CreateInput,
): CaptionRemotionBrollOwnerApprovedRunReviewSpec {
  assertClosedContractTree(input,
    'Caption approved-run B-roll review-spec input')
  const ownerResult = parseBrollCaptionOwnerReadResult(input.ownerResult)
  assertCreateScope(input, ownerResult)
  const startFrame = ownerResult.canonicalScope.authorizedFrameRange
    .startFrameInclusive
  const endFrame = ownerResult.canonicalScope.authorizedFrameRange
    .endFrameExclusive
  const base: Omit<CaptionRemotionBrollOwnerApprovedRunReviewSpec,
    'reviewSpecDigestSha256'> = {
    schemaVersion:
      CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_REVIEW_SPEC_VERSION,
    reviewSpecId: input.reviewSpecId,
    canonicalScope: structuredClone(input.canonicalScope),
    approvedRunLineage: structuredClone(input.approvedRunLineage),
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
      layoutOccupancyRef: structuredClone(ownerResult.layoutOccupancyRef),
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
      scaleDenominator: 6,
      exactAspectRatioPreserved: true,
      finalCustomerCanvasClaimed: false,
    },
    compositionProfileId:
      CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_COMPOSITION_PROFILE,
    canonicalOperationId: 'tool.remotion.render_approved_composition.v1',
    masterTimelineStartFrame: startFrame,
    masterTimelineEndFrameExclusive: endFrame,
    durationFrames: endFrame - startFrame,
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
    completeTimeInspectionRequired: true,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    realSourcePixelsRequiredForProfessionalAppearance: true,
    privateReviewOnly: true,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionRemotionBrollOwnerApprovedRunReviewSpec({
    ...base,
    reviewSpecDigestSha256: calculateSkillContractDigest(
      { ...base, reviewSpecDigestSha256: '' },
      'reviewSpecDigestSha256'),
  })
}

export function parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(
  value: unknown,
): CaptionRemotionBrollOwnerApprovedRunReviewSpec {
  assertClosedContractTree(value, 'Caption approved-run B-roll review spec')
  const raw = reviewSpecSchema.parse(value)
  const layers = parseCaptionRemotionLayers(raw.layers)
  const spec = {
    ...raw,
    layers,
  } as CaptionRemotionBrollOwnerApprovedRunReviewSpec
  if (spec.reviewSpecDigestSha256 !== calculateSkillContractDigest(
    spec as unknown as Record<string, unknown>,
    'reviewSpecDigestSha256')) {
    throw new Error('Caption approved-run B-roll review digest is stale.')
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
    || spec.canonicalScope.approvedSnapshotRef === null
    || !refMatches(spec.canonicalScope.approvedSnapshotRef,
      spec.approvedRunLineage.approvedSnapshotRef)
    || spec.canonicalScope.outputId !== spec.confirmedOutputFrame.outputId
    || !refMatches(spec.confirmedOutputFrame.frameRef,
      ownerScope.outputFrameRef)
    || spec.brollOwnerLineage.ownerRequestRef.version
      !== 'b_roll_caption_owner_read_request_v1'
    || spec.brollOwnerLineage.ownerResultRef.version
      !== 'b_roll_caption_owner_read_result_v1'
    || spec.brollOwnerLineage.brollResultReceiptRef.version
      !== 'b_roll_result_receipt_v1'
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
    || layers.some((layer) => {
      const counterpart = layer.accessibilityCounterpartNodeId === null
        ? null
        : accessibleByNode.get(layer.accessibilityCounterpartNodeId)
      return layer.frameRange.endFrameExclusive > spec.durationFrames
        || layer.layoutBasisPoints.y < 5_400
        || layer.layoutBasisPoints.y + layer.layoutBasisPoints.height > 9_300
        || layer.maskSequenceRef !== null
        || layer.objectAnchorRef !== null
        || layer.trackManifestRef !== null
        || layer.dependencyDisposition !== 'not_applicable'
        || (layer.presentationKind === 'stable_accessible_caption'
          && layer.zIndex !== 1_000)
        || (layer.presentationKind === 'hero_typography'
          && (!counterpart
            || counterpart.phraseId !== layer.phraseId
            || JSON.stringify(counterpart.exactSourceWordIds)
              !== JSON.stringify(layer.exactSourceWordIds)))
    })
  ) {
    throw new Error('Caption approved-run B-roll review spec is inconsistent.')
  }
  return spec
}

export function assertCaptionRemotionBrollOwnerApprovedRunReviewSpec(
  input: { spec: unknown; ownerResult: unknown },
): CaptionRemotionBrollOwnerApprovedRunReviewSpec {
  const spec = parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(input.spec)
  const ownerResult = parseBrollCaptionOwnerReadResult(input.ownerResult)
  const ownerLineage = spec.brollOwnerLineage
  if (
    ownerScopeDigest(ownerScopeFromSpec(spec))
      !== ownerScopeDigest(ownerResult.canonicalScope)
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
      'Caption approved-run B-roll review lost exact owner-result lineage.',
    )
  }
  return spec
}

export function buildCaptionRemotionBrollOwnerApprovedRunReviewRequest(
  input: {
    spec: CaptionRemotionBrollOwnerApprovedRunReviewSpec
    ownerResult: BrollCaptionOwnerReadResult
    remotionProxyBytes: Buffer
  },
): OfflineRemotionRenderRequest & {
  payload: OfflineRemotionCaptionBrollOwnerApprovedRunSceneGroupPayload
} {
  const spec = assertCaptionRemotionBrollOwnerApprovedRunReviewSpec(input)
  if (!Buffer.isBuffer(input.remotionProxyBytes)
    || input.remotionProxyBytes.byteLength
      !== spec.sourceEvidence.remotionProxyByteLength
    || createHash('sha256').update(input.remotionProxyBytes).digest('hex')
      !== spec.sourceEvidence.remotionProxySha256
    || input.remotionProxyBytes.subarray(0, 4).toString('hex')
      !== '1a45dfa3') {
    throw new Error(
      'Caption approved-run B-roll proxy bytes do not match the spec.',
    )
  }
  const owner = spec.brollOwnerLineage
  const source = spec.sourceEvidence
  const run = spec.approvedRunLineage
  const wording = spec.wordingEvidence
  const request = validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      compositionProfileId:
        CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_COMPOSITION_PROFILE,
      width: 640,
      height: 360,
      fps: 30,
      durationFrames: spec.durationFrames,
      sceneGroupId: spec.sceneGroupRef.id,
      sceneGroupDigestSha256: spec.sceneGroupRef.contentHash,
      motionLockDigestSha256: spec.motionLockRef.contentHash,
      storyTimingResolutionDigestSha256:
        spec.storyTimingResolutionRef.contentHash,
      masterTimingDigestSha256: spec.masterTimingHash,
      confirmedOutputWidth: 3_840,
      confirmedOutputHeight: 2_160,
      confirmedAspectRatioNumerator: 16,
      confirmedAspectRatioDenominator: 9,
      privateReviewScaleNumerator: 1,
      privateReviewScaleDenominator: 6,
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
      approvedSnapshotDigestSha256: run.approvedSnapshotRef.contentHash,
      executionPackageDigestSha256: run.executionPackageRef.contentHash,
      captionPlanningProjectionDigestSha256:
        run.captionPlanningProjectionRef.contentHash,
      captionPlanningBindingDigestSha256:
        run.captionPlanningBindingRef.contentHash,
      captionRenderedMediaWorkBindingDigestSha256:
        run.captionRenderedMediaWorkBindingRef.contentHash,
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
      selectedNormalizedSourceFps: 30,
      remotionProxyProfileId: source.remotionProxyProfileId,
      remotionProxyDerivedFromSelectedArtifact: true,
      exactOwnerResultRereadVerified: true,
      exactImmutableApprovedRunRereadVerified: true,
      creativeReviewSupplementsCanonicalFinalCanvas: true,
      creativeReviewReplacesCanonicalFinalCanvas: false,
      sourceSelectionPerformedByCaption: false,
      cropOrTimingPerformedByCaption: false,
      captionWordingReviewDigestSha256:
        wording.reviewDigestSha256,
      captionWordingReviewPolicy: wording.reviewPolicy,
      canonicalTranscriptDigestSha256:
        wording.canonicalTranscriptRef.contentHash,
      canonicalTranscriptEvidenceDigestSha256:
        wording.canonicalTranscriptEvidenceRef.contentHash,
      exactSourceWordLineageBound: true,
      wordLockedMotionUsed: false,
      canonicalTranscriptQualificationClaimed: false,
      syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
      realSourcePixelsRequiredForProfessionalAppearance: true,
      completeTimeInspectionRequired: true,
      inspectionFrameNumbers: spec.inspectionFrameNumbers,
      layers: spec.layers,
    },
  })
  if (!isCaptionBrollOwnerApprovedRunSceneGroupPayload(request.payload)) {
    throw new Error(
      'Caption approved-run B-roll request lost its V5 profile.',
    )
  }
  return request as OfflineRemotionRenderRequest & {
    payload: OfflineRemotionCaptionBrollOwnerApprovedRunSceneGroupPayload
  }
}
