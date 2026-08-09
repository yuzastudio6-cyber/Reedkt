import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CaptionRemotionLayer } from
  '../../src/types/caption-remotion-scene-group'
import type {
  CaptionRealSourceOutputFormat,
  CaptionRemotionRealSourceMultiOutputReviewSpec,
} from '../../src/types/caption-remotion-real-source-multi-output-review'
import {
  buildCaptionRemotionRealSourceMultiOutputReviewRequest,
  createCaptionRemotionRealSourceMultiOutputReviewSpec,
  parseCaptionRemotionRealSourceMultiOutputReviewSpec,
} from '../captions-specialist/caption-remotion-real-source-multi-output-review'
import {
  isCaptionRealSourceMultiOutputSceneGroupPayload,
  validateOfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

const ORIGINAL_SOURCE_SHA256 =
  'a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0'
const DURATION_FRAMES = 127
const INSPECTION_FRAMES = [
  0, 5, 8, 12, 21, 37, 38, 45, 80, 118, 122, 126,
]

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
function ref(
  id: string,
  version: string,
  contentHash = digest(`${id}:${version}`),
): CaptionDomainRef {
  return { id, version, contentHash }
}

function motion(variant: 'stable' | 'hero'):
CaptionRemotionLayer['motion'] {
  return variant === 'stable'
    ? {
        primitive: 'fade',
        easing: 'ease_out',
        travelBasisPoints: { x: 0, y: 0 },
        startScaleBasisPoints: 10_000,
        endScaleBasisPoints: 10_000,
        startOpacityBasisPoints: 0,
        endOpacityBasisPoints: 10_000,
        overshootBasisPoints: 0,
        staggerFrames: 0,
      }
    : {
        primitive: 'scale',
        easing: 'ease_out',
        travelBasisPoints: { x: -120, y: 0 },
        startScaleBasisPoints: 9_300,
        endScaleBasisPoints: 10_000,
        startOpacityBasisPoints: 0,
        endOpacityBasisPoints: 10_000,
        overshootBasisPoints: 0,
        staggerFrames: 0,
      }
}

function stableLayer(input: {
  cue: 1 | 2
  startFrame: number
  endFrameExclusive: number
  stableStart: number
  stableEnd: number
  text: string
  wordIds: string[]
  fontSize: number
}): CaptionRemotionLayer {
  return {
    layerId: `caption.real-source.multi-output.cue-${input.cue}.stable`,
    nodeId: `caption.real-source.multi-output.node.cue-${input.cue}.stable`,
    trackId: 'caption.real-source.multi-output.track.accessible',
    phraseId: `caption.real-source.multi-output.phrase.cue-${input.cue}`,
    trackRole: 'verbatim_speech',
    presentationKind: 'stable_accessible_caption',
    text: input.text,
    exactSourceWordIds: input.wordIds,
    frameRange: {
      startFrame: input.startFrame,
      endFrameExclusive: input.endFrameExclusive,
    },
    stableReadRange: {
      startFrame: input.stableStart,
      endFrameExclusive: input.stableEnd,
    },
    depthPlane: 'safe_accessible',
    zIndex: 1_000,
    layoutBasisPoints: { x: 500, y: 4_900, width: 4_150, height: 2_700 },
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1',
      fontWeight: 700,
      fontSizeBasisPointsOfFrameHeight: input.fontSize,
      lineHeightMilli: 1_180,
      textColor: '#F8FAFC',
      accentColor: '#6EE7F9',
      plateStyle: 'soft_dark',
      textAlign: 'left',
    },
    motion: motion('stable'),
    reducedMotion: {
      primitive: 'fade',
      frameRange: {
        startFrame: input.startFrame,
        endFrameExclusive: input.endFrameExclusive,
      },
    },
    accessibilityCounterpartNodeId: null,
    maskSequenceRef: null,
    objectAnchorRef: null,
    trackManifestRef: null,
    dependencyDisposition: 'not_applicable',
  }
}

function heroLayer(input: {
  cue: 1 | 2
  startFrame: number
  endFrameExclusive: number
  stableStart: number
  stableEnd: number
  text: string
  wordIds: string[]
  counterpartNodeId: string
  fontSize: number
}): CaptionRemotionLayer {
  return {
    layerId: `caption.real-source.multi-output.cue-${input.cue}.hero`,
    nodeId: `caption.real-source.multi-output.node.cue-${input.cue}.hero`,
    trackId: 'caption.real-source.multi-output.track.semantic',
    phraseId: `caption.real-source.multi-output.phrase.cue-${input.cue}`,
    trackRole: 'hero_typography',
    presentationKind: 'hero_typography',
    text: input.text,
    exactSourceWordIds: input.wordIds,
    frameRange: {
      startFrame: input.startFrame,
      endFrameExclusive: input.endFrameExclusive,
    },
    stableReadRange: {
      startFrame: input.stableStart,
      endFrameExclusive: input.stableEnd,
    },
    depthPlane: 'foreground_hero',
    zIndex: 850,
    layoutBasisPoints: { x: 500, y: 2_350, width: 4_100, height: 1_350 },
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1',
      fontWeight: 800,
      fontSizeBasisPointsOfFrameHeight: input.fontSize,
      lineHeightMilli: 960,
      textColor: '#DFF7FF',
      accentColor: '#6EE7F9',
      plateStyle: 'none',
      textAlign: 'left',
    },
    motion: motion('hero'),
    reducedMotion: {
      primitive: 'fade',
      frameRange: {
        startFrame: input.startFrame,
        endFrameExclusive: input.endFrameExclusive,
      },
    },
    accessibilityCounterpartNodeId: input.counterpartNodeId,
    maskSequenceRef: null,
    objectAnchorRef: null,
    trackManifestRef: null,
    dependencyDisposition: 'not_applicable',
  }
}

function layers(outputFormat: CaptionRealSourceOutputFormat):
CaptionRemotionLayer[] {
  const cue1Words = [
    'curated-caption-1.word-1', 'curated-caption-1.word-2',
    'curated-caption-1.word-3', 'curated-caption-1.word-4',
  ]
  const cue2Words = [
    'curated-caption-2.word-1', 'curated-caption-2.word-2',
    'curated-caption-2.word-3', 'curated-caption-2.word-4',
    'curated-caption-2.word-5', 'curated-caption-2.word-6',
  ]
  const square = outputFormat === 'square_1_1'
  const cue1Stable = stableLayer({
    cue: 1,
    startFrame: 5,
    endFrameExclusive: 38,
    stableStart: 10,
    stableEnd: 34,
    text: 'Hey guys — today.',
    wordIds: cue1Words,
    fontSize: square ? 430 : 520,
  })
  const cue2Stable = stableLayer({
    cue: 2,
    startFrame: 38,
    endFrameExclusive: 123,
    stableStart: 44,
    stableEnd: 118,
    text: "I'm launching my new AI software.",
    wordIds: cue2Words,
    fontSize: square ? 400 : 470,
  })
  return [
    heroLayer({
      cue: 1,
      startFrame: 5,
      endFrameExclusive: 38,
      stableStart: 10,
      stableEnd: 34,
      text: 'TODAY',
      wordIds: ['curated-caption-1.word-4'],
      counterpartNodeId: cue1Stable.nodeId,
      fontSize: square ? 900 : 1_020,
    }),
    cue1Stable,
    heroLayer({
      cue: 2,
      startFrame: 38,
      endFrameExclusive: 123,
      stableStart: 44,
      stableEnd: 118,
      text: 'AI',
      wordIds: ['curated-caption-2.word-5'],
      counterpartNodeId: cue2Stable.nodeId,
      fontSize: square ? 980 : 1_100,
    }),
    cue2Stable,
  ]
}

function outputFrame(outputFormat: CaptionRealSourceOutputFormat) {
  return outputFormat === 'widescreen_16_9'
    ? {
        frameRef: ref(
          'caption.real-source.output-frame.widescreen-1920x1080',
          'confirmed-output-frame-v1'),
        outputId: 'caption-private-internal-output-widescreen',
        width: 1_920 as const,
        height: 1_080 as const,
        aspectRatioNumerator: 16 as const,
        aspectRatioDenominator: 9 as const,
        fpsNumerator: 30 as const,
        fpsDenominator: 1 as const,
      }
    : {
        frameRef: ref(
          'caption.real-source.output-frame.square-1440x1440',
          'confirmed-output-frame-v1'),
        outputId: 'caption-private-internal-output-square',
        width: 1_440 as const,
        height: 1_440 as const,
        aspectRatioNumerator: 1 as const,
        aspectRatioDenominator: 1 as const,
        fpsNumerator: 30 as const,
        fpsDenominator: 1 as const,
      }
}

export function buildCap18RealSourceMultiOutputFixture(
  sourceProxyBytes: Buffer,
) {
  const sourceProxySha256 = createHash('sha256')
    .update(sourceProxyBytes).digest('hex')
  const wordingReviewDigest = digest(JSON.stringify({
    reviewPolicy: 'fixture_specific_human_review_phrase_level_only_v1',
    originalSourceSha256: ORIGINAL_SOURCE_SHA256,
    originalSourceRangeMilliseconds: [8_080, 12_300],
    cues: [
      { range: [5, 38], text: 'Hey guys — today.' },
      { range: [38, 123], text: "I'm launching my new AI software." },
    ],
    timingProvenance: 'synthetic_estimate',
    wordLockedMotionUsed: false,
  }))
  const build = (outputFormat: CaptionRealSourceOutputFormat) => {
    const formatLabel = outputFormat === 'widescreen_16_9'
      ? 'widescreen' : 'square'
    const confirmedOutputFrame = outputFrame(outputFormat)
    const common = {
      outputFormat,
      canonicalScope: {
        ownerUserId: 'caption-private-internal-owner',
        workspaceId: 'caption-private-internal-workspace',
        projectId: 'caption-private-internal-project',
        editSessionId: 'caption-private-internal-edit-session',
        planVersionId: 'caption-private-internal-plan-v1',
        approvedSnapshotRef: ref(
          'caption-private-internal-approved-snapshot',
          'approved-edit-plan-snapshot-v1'),
        outputId: confirmedOutputFrame.outputId,
        sceneId: `caption-private-internal-scene-launch-${formatLabel}`,
        authorizedFrameRanges: [
          { startFrame: 0, endFrameExclusive: DURATION_FRAMES },
        ],
      },
      sceneGroupRef: ref(
        `caption.real-source.scene-group.internal-testing.launch-${formatLabel}`,
        'caption-remotion-real-source-multi-output-scene-group-v1'),
      motionLockRef: ref(
        `caption.real-source.motion-lock.internal-testing.launch-${formatLabel}`,
        'caption-motion-lock-v1'),
      storyTimingResolutionRef: ref(
        `caption.real-source.story-timing.internal-testing.launch-${formatLabel}`,
        'caption-storytiming-resolution-v1'),
      sourceEvidence: {
        originalSourceRef: ref(
          'caption.real-source.original.internal-testing-video',
          'private-source-media-v1', ORIGINAL_SOURCE_SHA256),
        originalSourceSha256: ORIGINAL_SOURCE_SHA256,
        originalSourceStartMilliseconds: 8_080,
        originalSourceEndMilliseconds: 12_300,
        privateReviewProxyRef: ref(
          'caption.real-source.proxy.internal-testing-launch',
          'caption-private-review-proxy-v1', sourceProxySha256),
        privateReviewProxyMimeType: 'video/mp4' as const,
        privateReviewProxyByteLength: sourceProxyBytes.byteLength,
        privateReviewProxySha256: sourceProxySha256,
        sourceMediaPolicy:
          'approved_caption_private_review_proxy_v1' as const,
        sourceAudioPreserved: true as const,
      },
      wordingEvidence: {
        reviewRef: ref(
          'caption.real-source.wording-review.internal-testing-launch',
          'caption-fixture-wording-review-v1', wordingReviewDigest),
        reviewDigestSha256: wordingReviewDigest,
        reviewPolicy:
          'fixture_specific_human_review_phrase_level_only_v1' as const,
        timingProvenance: 'synthetic_estimate' as const,
        phraseLevelOnly: true as const,
        wordLockedMotionUsed: false as const,
        canonicalTranscriptQualificationClaimed: false as const,
      },
      confirmedOutputFrame,
      durationFrames: DURATION_FRAMES,
      inspectionFrameNumbers: INSPECTION_FRAMES,
      layers: layers(outputFormat),
    }
    const fullSpec = createCaptionRemotionRealSourceMultiOutputReviewSpec({
      ...common,
      reviewSpecId:
        `caption.real-source.review.internal-testing.launch-${formatLabel}-v1`,
      reducedMotion: false,
    })
    const reducedSpec =
      createCaptionRemotionRealSourceMultiOutputReviewSpec({
        ...common,
        reviewSpecId:
          `caption.real-source.review.internal-testing.launch-${formatLabel}-reduced-v1`,
        reducedMotion: true,
      })
    return {
      fullSpec,
      reducedSpec,
      fullRequest:
        buildCaptionRemotionRealSourceMultiOutputReviewRequest({
          spec: fullSpec,
          sourceProxyBytes,
        }),
      reducedRequest:
        buildCaptionRemotionRealSourceMultiOutputReviewRequest({
          spec: reducedSpec,
          sourceProxyBytes,
        }),
    }
  }
  return {
    widescreen: build('widescreen_16_9'),
    square: build('square_1_1'),
  }
}

function staleDigest(
  spec: CaptionRemotionRealSourceMultiOutputReviewSpec,
): void {
  spec.reviewSpecDigestSha256 = calculateSkillContractDigest(
    spec as unknown as Record<string, unknown>,
    'reviewSpecDigestSha256')
}

export function runCap18RealSourceMultiOutputSmoke(): void {
  const sourceProxyBytes = Buffer.alloc(1_024)
  sourceProxyBytes.write('ftyp', 4, 'ascii')
  const fixture = buildCap18RealSourceMultiOutputFixture(sourceProxyBytes)
  const { widescreen, square } = fixture
  check(widescreen.fullSpec.compositionProfileId ===
    'caption_direction_real_source_multi_output_scene_group_v3',
  'Real-footage multi-output evidence must use the additive V3 profile.')
  check(widescreen.fullSpec.privateReviewFrame.width === 640
    && widescreen.fullSpec.privateReviewFrame.height === 360
    && square.fullSpec.privateReviewFrame.width === 480
    && square.fullSpec.privateReviewFrame.height === 480,
  'Each review proxy must preserve its exact confirmed output ratio.')
  check(widescreen.fullSpec.confirmedOutputFrame.outputId !==
    square.fullSpec.confirmedOutputFrame.outputId,
  'Widescreen and square evidence must remain output-namespaced.')
  check(widescreen.fullSpec.sourceEvidence.originalSourceSha256 ===
    ORIGINAL_SOURCE_SHA256
    && square.fullSpec.sourceEvidence.originalSourceSha256 ===
      ORIGINAL_SOURCE_SHA256,
  'Both outputs must bind the exact same reviewed uploaded source.')
  check([widescreen, square].every((format) =>
    format.fullSpec.syntheticEngineeringFixtureAcceptedAsProfessionalAppearance
      === false
    && format.fullSpec.realSourcePixelsRequiredForProfessionalAppearance
      === true),
  'Synthetic engineering fixtures must be structurally ineligible for appearance QA.')
  check([widescreen, square].every((format) =>
    format.fullSpec.layers.every((layer) =>
      layer.layoutBasisPoints.x + layer.layoutBasisPoints.width <= 4_900)),
  'Caption layers must remain inside the editorial sidecar, clear of the speaker panel.')
  check([widescreen, square].every((format) =>
    format.fullSpec.layers.every((layer) =>
      layer.maskSequenceRef === null
      && layer.objectAnchorRef === null
      && layer.trackManifestRef === null)),
  'The multi-output proof must not fabricate Track All evidence.')
  check(JSON.stringify(widescreen.fullRequest.payload.layers) ===
    JSON.stringify(widescreen.reducedRequest.payload.layers)
    && JSON.stringify(square.fullRequest.payload.layers) ===
      JSON.stringify(square.reducedRequest.payload.layers),
  'Reduced motion must preserve each output-specific composition.')
  check([widescreen, square].every((format) =>
    isCaptionRealSourceMultiOutputSceneGroupPayload(format.fullRequest.payload)
    && isCaptionRealSourceMultiOutputSceneGroupPayload(
      format.reducedRequest.payload)),
  'All four requests must pass the closed shared Remotion boundary.')
  check([widescreen, square].every((format) =>
    parseCaptionRemotionRealSourceMultiOutputReviewSpec(format.fullSpec)
      .reviewSpecDigestSha256 === format.fullSpec.reviewSpecDigestSha256),
  'Both output specs must round-trip through the closed parser.')

  const crossedFrame = structuredClone(widescreen.fullSpec)
  crossedFrame.confirmedOutputFrame = structuredClone(
    square.fullSpec.confirmedOutputFrame)
  staleDigest(crossedFrame)
  expectThrow(() =>
    parseCaptionRemotionRealSourceMultiOutputReviewSpec(crossedFrame))

  const speakerCollision = structuredClone(square.fullSpec)
  speakerCollision.layers[0]!.layoutBasisPoints.width = 5_200
  staleDigest(speakerCollision)
  expectThrow(() =>
    parseCaptionRemotionRealSourceMultiOutputReviewSpec(speakerCollision))

  const syntheticOverclaim = structuredClone(widescreen.fullRequest) as
    unknown as { payload: Record<string, unknown> }
  syntheticOverclaim.payload
    .syntheticEngineeringFixtureAcceptedAsProfessionalAppearance = true
  expectThrow(() => validateOfflineRemotionRenderRequest(syntheticOverclaim))

  const unsafeField = structuredClone(square.fullRequest) as unknown as {
    payload: Record<string, unknown>
  }
  unsafeField.payload.sourcePath = '/private/source.mp4'
  expectThrow(() => validateOfflineRemotionRenderRequest(unsafeField))

  const staleSource = structuredClone(widescreen.fullRequest)
  staleSource.payload.sourceBytesBase64 = Buffer.alloc(1_024)
    .toString('base64')
  expectThrow(() => validateOfflineRemotionRenderRequest(staleSource))

  console.log(JSON.stringify({
    status: 'passed_real_source_multi_output_contract_source_only',
    milestone: 'CAP-18 real-source multi-output',
    assertions,
    compositionProfileId:
      widescreen.fullSpec.compositionProfileId,
    originalSourceSha256: ORIGINAL_SOURCE_SHA256,
    outputs: [
      { format: 'widescreen_16_9', confirmed: '1920x1080@30', review: '640x360@30' },
      { format: 'square_1_1', confirmed: '1440x1440@30', review: '480x480@30' },
    ],
    variantsPerOutput: 2,
    realSourcePixelsRequiredForProfessionalAppearance: true,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    runtimeExecuted: false,
    directRasterInspectionCompleted: false,
    canonicalTranscriptQualificationClaimed: false,
    trackAllEvidenceClaimed: false,
    finalCustomerCanvasClaimed: false,
    productionAuthorityPromoted: false,
  }, null, 2))
}

if (process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCap18RealSourceMultiOutputSmoke()
}
