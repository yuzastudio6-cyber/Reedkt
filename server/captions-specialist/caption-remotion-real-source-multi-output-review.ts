import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_COMPOSITION_PROFILE,
  CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_REVIEW_SPEC_VERSION,
  type CaptionRealSourceOutputFormat,
  type CaptionRemotionRealSourceMultiOutputReviewSpec,
} from '../../src/types/caption-remotion-real-source-multi-output-review'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  isCaptionRealSourceMultiOutputSceneGroupPayload,
  OFFLINE_REMOTION_RENDER_OPERATION,
  OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
  validateOfflineRemotionRenderRequest,
  type OfflineRemotionCaptionRealSourceMultiOutputSceneGroupPayload,
  type OfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
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
  authorizedFrameRanges: z.array(frameRangeSchema).min(1).max(512),
}).strict()
const sourceEvidenceSchema = z.object({
  originalSourceRef: refSchema,
  originalSourceSha256: sha256,
  originalSourceStartMilliseconds: z.number().int().nonnegative()
    .max(3_600_000),
  originalSourceEndMilliseconds: z.number().int().positive()
    .max(3_600_000),
  privateReviewProxyRef: refSchema,
  privateReviewProxyMimeType: z.literal('video/mp4'),
  privateReviewProxyByteLength: z.number().int().min(1_024)
    .max(16 * 1024 * 1024),
  privateReviewProxySha256: sha256,
  sourceMediaPolicy: z.literal('approved_caption_private_review_proxy_v1'),
  sourceAudioPreserved: z.literal(true),
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
const confirmedOutputFrameSchema = z.union([
  z.object({
    frameRef: refSchema,
    outputId: safeKey,
    width: z.literal(1_920),
    height: z.literal(1_080),
    aspectRatioNumerator: z.literal(16),
    aspectRatioDenominator: z.literal(9),
    fpsNumerator: z.literal(30),
    fpsDenominator: z.literal(1),
  }).strict(),
  z.object({
    frameRef: refSchema,
    outputId: safeKey,
    width: z.literal(1_440),
    height: z.literal(1_440),
    aspectRatioNumerator: z.literal(1),
    aspectRatioDenominator: z.literal(1),
    fpsNumerator: z.literal(30),
    fpsDenominator: z.literal(1),
  }).strict(),
])
const privateReviewFrameSchema = z.union([
  z.object({
    width: z.literal(640),
    height: z.literal(360),
    scaleNumerator: z.literal(1),
    scaleDenominator: z.literal(3),
    exactAspectRatioPreserved: z.literal(true),
    finalCustomerCanvasClaimed: z.literal(false),
  }).strict(),
  z.object({
    width: z.literal(480),
    height: z.literal(480),
    scaleNumerator: z.literal(1),
    scaleDenominator: z.literal(3),
    exactAspectRatioPreserved: z.literal(true),
    finalCustomerCanvasClaimed: z.literal(false),
  }).strict(),
])

const reviewSpecSchema = z.object({
  schemaVersion: z.literal(
    CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_REVIEW_SPEC_VERSION),
  reviewSpecId: safeKey,
  reviewSpecDigestSha256: sha256,
  outputFormat: z.enum(['widescreen_16_9', 'square_1_1']),
  canonicalScope: scopeSchema,
  sceneGroupRef: refSchema,
  motionLockRef: refSchema,
  storyTimingResolutionRef: refSchema,
  sourceEvidence: sourceEvidenceSchema,
  wordingEvidence: wordingEvidenceSchema,
  confirmedOutputFrame: confirmedOutputFrameSchema,
  privateReviewFrame: privateReviewFrameSchema,
  compositionProfileId: z.literal(
    CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_COMPOSITION_PROFILE),
  canonicalOperationId: z.literal(
    'tool.remotion.render_approved_composition.v1'),
  durationFrames: z.number().int().min(24).max(900),
  reducedMotion: z.boolean(),
  inspectionFrameNumbers: z.array(z.number().int().nonnegative()).min(4)
    .max(16),
  layers: z.array(z.unknown()).min(2).max(128),
  sourcePresentation: z.literal('editorial_split_right_v1'),
  safePlacementPolicy: z.literal(
    'speaker_face_and_gesture_avoidance_editorial_sidecar_v1'),
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

type CreateInput = Pick<CaptionRemotionRealSourceMultiOutputReviewSpec,
  | 'reviewSpecId'
  | 'outputFormat'
  | 'canonicalScope'
  | 'sceneGroupRef'
  | 'motionLockRef'
  | 'storyTimingResolutionRef'
  | 'sourceEvidence'
  | 'wordingEvidence'
  | 'confirmedOutputFrame'
  | 'durationFrames'
  | 'reducedMotion'
  | 'inspectionFrameNumbers'
  | 'layers'
>

function expectedPrivateReviewFrame(
  outputFormat: CaptionRealSourceOutputFormat,
): CaptionRemotionRealSourceMultiOutputReviewSpec['privateReviewFrame'] {
  return outputFormat === 'widescreen_16_9'
    ? {
        width: 640,
        height: 360,
        scaleNumerator: 1,
        scaleDenominator: 3,
        exactAspectRatioPreserved: true,
        finalCustomerCanvasClaimed: false,
      }
    : {
        width: 480,
        height: 480,
        scaleNumerator: 1,
        scaleDenominator: 3,
        exactAspectRatioPreserved: true,
        finalCustomerCanvasClaimed: false,
      }
}

export function createCaptionRemotionRealSourceMultiOutputReviewSpec(
  input: CreateInput,
): CaptionRemotionRealSourceMultiOutputReviewSpec {
  assertClosedContractTree(input,
    'Caption real-source multi-output review-spec input')
  const base: Omit<CaptionRemotionRealSourceMultiOutputReviewSpec,
    'reviewSpecDigestSha256'> = {
    schemaVersion:
      CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_REVIEW_SPEC_VERSION,
    reviewSpecId: input.reviewSpecId,
    outputFormat: input.outputFormat,
    canonicalScope: structuredClone(input.canonicalScope),
    sceneGroupRef: structuredClone(input.sceneGroupRef),
    motionLockRef: structuredClone(input.motionLockRef),
    storyTimingResolutionRef: structuredClone(input.storyTimingResolutionRef),
    sourceEvidence: structuredClone(input.sourceEvidence),
    wordingEvidence: structuredClone(input.wordingEvidence),
    confirmedOutputFrame: structuredClone(input.confirmedOutputFrame),
    privateReviewFrame: expectedPrivateReviewFrame(input.outputFormat),
    compositionProfileId:
      CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_COMPOSITION_PROFILE,
    canonicalOperationId: 'tool.remotion.render_approved_composition.v1',
    durationFrames: input.durationFrames,
    reducedMotion: input.reducedMotion,
    inspectionFrameNumbers: structuredClone(input.inspectionFrameNumbers),
    layers: structuredClone(input.layers),
    sourcePresentation: 'editorial_split_right_v1',
    safePlacementPolicy:
      'speaker_face_and_gesture_avoidance_editorial_sidecar_v1',
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
  return parseCaptionRemotionRealSourceMultiOutputReviewSpec({
    ...base,
    reviewSpecDigestSha256: calculateSkillContractDigest(
      { ...base, reviewSpecDigestSha256: '' },
      'reviewSpecDigestSha256'),
  })
}

export function parseCaptionRemotionRealSourceMultiOutputReviewSpec(
  value: unknown,
): CaptionRemotionRealSourceMultiOutputReviewSpec {
  assertClosedContractTree(value,
    'Caption real-source multi-output review spec')
  const raw = reviewSpecSchema.parse(value)
  const layers = parseCaptionRemotionLayers(raw.layers)
  const spec = { ...raw, layers } as
    CaptionRemotionRealSourceMultiOutputReviewSpec
  if (spec.reviewSpecDigestSha256 !== calculateSkillContractDigest(
    spec as unknown as Record<string, unknown>,
    'reviewSpecDigestSha256')) {
    throw new Error('Caption real-source multi-output review digest is stale.')
  }
  const durationMilliseconds = Math.round(spec.durationFrames / 30 * 1_000)
  const sourceDurationMilliseconds =
    spec.sourceEvidence.originalSourceEndMilliseconds
    - spec.sourceEvidence.originalSourceStartMilliseconds
  const expectedFrame = expectedPrivateReviewFrame(spec.outputFormat)
  const wide = spec.outputFormat === 'widescreen_16_9'
  const frameMatches = wide
    ? spec.confirmedOutputFrame.width === 1_920
      && spec.confirmedOutputFrame.height === 1_080
      && spec.confirmedOutputFrame.aspectRatioNumerator === 16
      && spec.confirmedOutputFrame.aspectRatioDenominator === 9
    : spec.confirmedOutputFrame.width === 1_440
      && spec.confirmedOutputFrame.height === 1_440
      && spec.confirmedOutputFrame.aspectRatioNumerator === 1
      && spec.confirmedOutputFrame.aspectRatioDenominator === 1
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
    spec.canonicalScope.sceneId === null
    || spec.canonicalScope.outputId !== spec.confirmedOutputFrame.outputId
    || spec.sourceEvidence.originalSourceRef.contentHash
      !== spec.sourceEvidence.originalSourceSha256
    || spec.sourceEvidence.privateReviewProxyRef.contentHash
      !== spec.sourceEvidence.privateReviewProxySha256
    || spec.wordingEvidence.reviewRef.contentHash
      !== spec.wordingEvidence.reviewDigestSha256
    || !frameMatches
    || JSON.stringify(spec.privateReviewFrame) !== JSON.stringify(expectedFrame)
    || Math.abs(sourceDurationMilliseconds - durationMilliseconds) > 34
    || !spec.canonicalScope.authorizedFrameRanges.some((range) =>
      range.startFrame === 0
      && range.endFrameExclusive === spec.durationFrames)
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
      || layer.layoutBasisPoints.x < 500
      || layer.layoutBasisPoints.x + layer.layoutBasisPoints.width > 4_900
      || layer.layoutBasisPoints.y < 1_200
      || layer.layoutBasisPoints.y + layer.layoutBasisPoints.height > 8_800
      || layer.maskSequenceRef !== null
      || layer.objectAnchorRef !== null
      || layer.trackManifestRef !== null
      || layer.dependencyDisposition !== 'not_applicable'
      || (layer.presentationKind === 'stable_accessible_caption'
        && layer.zIndex !== 1_000)
      || (layer.presentationKind !== 'stable_accessible_caption'
        && (!layer.accessibilityCounterpartNodeId
          || accessibleByNode.get(layer.accessibilityCounterpartNodeId)
            ?.phraseId !== layer.phraseId)))
  ) {
    throw new Error(
      'Caption real-source multi-output review spec is inconsistent.')
  }
  return spec
}

export function buildCaptionRemotionRealSourceMultiOutputReviewRequest(input: {
  spec: CaptionRemotionRealSourceMultiOutputReviewSpec
  sourceProxyBytes: Buffer
}): OfflineRemotionRenderRequest & {
  payload: OfflineRemotionCaptionRealSourceMultiOutputSceneGroupPayload
} {
  const spec = parseCaptionRemotionRealSourceMultiOutputReviewSpec(input.spec)
  if (!Buffer.isBuffer(input.sourceProxyBytes)
    || input.sourceProxyBytes.byteLength
      !== spec.sourceEvidence.privateReviewProxyByteLength
    || createHash('sha256').update(input.sourceProxyBytes).digest('hex')
      !== spec.sourceEvidence.privateReviewProxySha256) {
    throw new Error(
      'Caption real-source multi-output proxy bytes do not match the spec.')
  }
  const request = validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      compositionProfileId:
        CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_COMPOSITION_PROFILE,
      width: spec.privateReviewFrame.width,
      height: spec.privateReviewFrame.height,
      fps: 30,
      durationFrames: spec.durationFrames,
      sceneGroupId: spec.sceneGroupRef.id,
      sceneGroupDigestSha256: spec.sceneGroupRef.contentHash,
      motionLockDigestSha256: spec.motionLockRef.contentHash,
      storyTimingResolutionDigestSha256:
        spec.storyTimingResolutionRef.contentHash,
      confirmedOutputWidth: spec.confirmedOutputFrame.width,
      confirmedOutputHeight: spec.confirmedOutputFrame.height,
      confirmedAspectRatioNumerator:
        spec.confirmedOutputFrame.aspectRatioNumerator,
      confirmedAspectRatioDenominator:
        spec.confirmedOutputFrame.aspectRatioDenominator,
      privateReviewScaleNumerator: 1,
      privateReviewScaleDenominator: 3,
      outputFormat: spec.outputFormat,
      reducedMotion: spec.reducedMotion,
      subjectMaskFixturePolicy: 'none',
      backgroundStyle: 'real_source_editorial_split_v1',
      sourcePresentation: 'editorial_split_right_v1',
      safePlacementPolicy: spec.safePlacementPolicy,
      sourceMediaPolicy: spec.sourceEvidence.sourceMediaPolicy,
      sourceMimeType: 'video/mp4',
      sourceByteLength: input.sourceProxyBytes.byteLength,
      sourceSha256: spec.sourceEvidence.privateReviewProxySha256,
      sourceBytesBase64: input.sourceProxyBytes.toString('base64'),
      sourceStartFrame: 0,
      sourceEndFrameExclusive: spec.durationFrames,
      sourceFit: 'contain',
      audioPolicy: 'preserve_source',
      originalSourceSha256: spec.sourceEvidence.originalSourceSha256,
      originalSourceStartMilliseconds:
        spec.sourceEvidence.originalSourceStartMilliseconds,
      originalSourceEndMilliseconds:
        spec.sourceEvidence.originalSourceEndMilliseconds,
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
  if (!isCaptionRealSourceMultiOutputSceneGroupPayload(request.payload)) {
    throw new Error(
      'Caption real-source multi-output request lost its profile.')
  }
  return request as OfflineRemotionRenderRequest & {
    payload: OfflineRemotionCaptionRealSourceMultiOutputSceneGroupPayload
  }
}
