import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import type { CaptionRemotionLayer } from '../../src/types/caption-remotion-scene-group'
import {
  buildCaptionRemotionRealSourceReviewRequest,
  createCaptionRemotionRealSourceReviewSpec,
  parseCaptionRemotionRealSourceReviewSpec,
} from '../captions-specialist/caption-remotion-real-source-review'
import {
  isCaptionRealSourceSceneGroupPayload,
  validateOfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

const ORIGINAL_SOURCE_SHA256 =
  'a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0'
const DURATION_FRAMES = 127
const INSPECTION_FRAMES = [0, 5, 8, 12, 21, 37, 38, 45, 80, 118, 122, 126]

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

function ref(id: string, version: string, contentHash = digest(`${id}:${version}`)):
CaptionDomainRef {
  return { id, version, contentHash }
}

function motion(variant: 'stable' | 'hero'): CaptionRemotionLayer['motion'] {
  return variant === 'stable'
    ? {
        primitive: 'fade', easing: 'ease_out',
        travelBasisPoints: { x: 0, y: 0 },
        startScaleBasisPoints: 10_000, endScaleBasisPoints: 10_000,
        startOpacityBasisPoints: 0, endOpacityBasisPoints: 10_000,
        overshootBasisPoints: 0, staggerFrames: 0,
      }
    : {
        primitive: 'scale', easing: 'ease_out',
        travelBasisPoints: { x: 0, y: 120 },
        startScaleBasisPoints: 9_400, endScaleBasisPoints: 10_000,
        startOpacityBasisPoints: 0, endOpacityBasisPoints: 10_000,
        overshootBasisPoints: 0, staggerFrames: 0,
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
    layerId: `caption.real-source.cue-${input.cue}.stable`,
    nodeId: `caption.real-source.node.cue-${input.cue}.stable`,
    trackId: 'caption.real-source.track.accessible',
    phraseId: `caption.real-source.phrase.cue-${input.cue}`,
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
    layoutBasisPoints: { x: 600, y: 7_600, width: 8_800, height: 1_800 },
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1',
      fontWeight: 700,
      fontSizeBasisPointsOfFrameHeight: input.fontSize,
      lineHeightMilli: 1_160,
      textColor: '#F8FAFC',
      accentColor: '#6EE7F9',
      plateStyle: 'soft_dark',
      textAlign: 'center',
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
    layerId: `caption.real-source.cue-${input.cue}.hero`,
    nodeId: `caption.real-source.node.cue-${input.cue}.hero`,
    trackId: 'caption.real-source.track.semantic',
    phraseId: `caption.real-source.phrase.cue-${input.cue}`,
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
    layoutBasisPoints: { x: 800, y: 6_650, width: 8_400, height: 850 },
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1',
      fontWeight: 800,
      fontSizeBasisPointsOfFrameHeight: input.fontSize,
      lineHeightMilli: 1_000,
      textColor: '#DFF7FF',
      accentColor: '#6EE7F9',
      plateStyle: 'none',
      textAlign: 'center',
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

function layers(): CaptionRemotionLayer[] {
  const cue1Words = [
    'curated-caption-1.word-1', 'curated-caption-1.word-2',
    'curated-caption-1.word-3', 'curated-caption-1.word-4',
  ]
  const cue2Words = [
    'curated-caption-2.word-1', 'curated-caption-2.word-2',
    'curated-caption-2.word-3', 'curated-caption-2.word-4',
    'curated-caption-2.word-5', 'curated-caption-2.word-6',
  ]
  const cue1Stable = stableLayer({
    cue: 1, startFrame: 5, endFrameExclusive: 38,
    stableStart: 10, stableEnd: 34,
    text: 'Hey guys — today.', wordIds: cue1Words, fontSize: 560,
  })
  const cue2Stable = stableLayer({
    cue: 2, startFrame: 38, endFrameExclusive: 123,
    stableStart: 44, stableEnd: 118,
    text: "I'm launching my new AI software.", wordIds: cue2Words,
    fontSize: 470,
  })
  return [
    heroLayer({
      cue: 1, startFrame: 5, endFrameExclusive: 38,
      stableStart: 10, stableEnd: 34, text: 'TODAY',
      wordIds: ['curated-caption-1.word-4'],
      counterpartNodeId: cue1Stable.nodeId, fontSize: 820,
    }),
    cue1Stable,
    heroLayer({
      cue: 2, startFrame: 38, endFrameExclusive: 123,
      stableStart: 44, stableEnd: 118, text: 'AI',
      wordIds: ['curated-caption-2.word-5'],
      counterpartNodeId: cue2Stable.nodeId, fontSize: 900,
    }),
    cue2Stable,
  ]
}

export function buildCap14RealSourceFixture(sourceProxyBytes: Buffer) {
  const sourceProxySha256 = createHash('sha256').update(sourceProxyBytes).digest('hex')
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
  const common = {
    reviewSpecId: 'caption.real-source.review.internal-testing.launch-v1',
    canonicalScope: {
      ownerUserId: 'caption-private-internal-owner',
      workspaceId: 'caption-private-internal-workspace',
      projectId: 'caption-private-internal-project',
      editSessionId: 'caption-private-internal-edit-session',
      planVersionId: 'caption-private-internal-plan-v1',
      approvedSnapshotRef: ref(
        'caption-private-internal-approved-snapshot',
        'approved-edit-plan-snapshot-v1',
      ),
      outputId: 'caption-private-internal-output-vertical',
      sceneId: 'caption-private-internal-scene-launch',
      authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: DURATION_FRAMES }],
    },
    sceneGroupRef: ref(
      'caption.real-source.scene-group.internal-testing.launch',
      'caption-remotion-real-source-scene-group-v1',
    ),
    motionLockRef: ref(
      'caption.real-source.motion-lock.internal-testing.launch',
      'caption-motion-lock-v1',
    ),
    storyTimingResolutionRef: ref(
      'caption.real-source.story-timing.internal-testing.launch',
      'caption-storytiming-resolution-v1',
    ),
    sourceEvidence: {
      originalSourceRef: ref(
        'caption.real-source.original.internal-testing-video',
        'private-source-media-v1',
        ORIGINAL_SOURCE_SHA256,
      ),
      originalSourceSha256: ORIGINAL_SOURCE_SHA256,
      originalSourceStartMilliseconds: 8_080,
      originalSourceEndMilliseconds: 12_300,
      privateReviewProxyRef: ref(
        'caption.real-source.proxy.internal-testing-launch',
        'caption-private-review-proxy-v1',
        sourceProxySha256,
      ),
      privateReviewProxyMimeType: 'video/mp4' as const,
      privateReviewProxyByteLength: sourceProxyBytes.byteLength,
      privateReviewProxySha256: sourceProxySha256,
      sourceMediaPolicy: 'approved_caption_private_review_proxy_v1' as const,
      sourceAudioPreserved: true as const,
    },
    wordingEvidence: {
      reviewRef: ref(
        'caption.real-source.wording-review.internal-testing-launch',
        'caption-fixture-wording-review-v1',
        wordingReviewDigest,
      ),
      reviewDigestSha256: wordingReviewDigest,
      reviewPolicy: 'fixture_specific_human_review_phrase_level_only_v1' as const,
      timingProvenance: 'synthetic_estimate' as const,
      phraseLevelOnly: true as const,
      wordLockedMotionUsed: false as const,
      canonicalTranscriptQualificationClaimed: false as const,
    },
    confirmedOutputFrame: {
      frameRef: ref(
        'caption.real-source.output-frame.vertical-1080x1920',
        'confirmed-output-frame-v1',
      ),
      outputId: 'caption-private-internal-output-vertical',
      width: 1_080 as const,
      height: 1_920 as const,
      aspectRatioNumerator: 9 as const,
      aspectRatioDenominator: 16 as const,
      fpsNumerator: 30 as const,
      fpsDenominator: 1 as const,
    },
    durationFrames: DURATION_FRAMES,
    inspectionFrameNumbers: INSPECTION_FRAMES,
    layers: layers(),
  }
  const fullSpec = createCaptionRemotionRealSourceReviewSpec({
    ...common,
    reducedMotion: false,
  })
  const reducedSpec = createCaptionRemotionRealSourceReviewSpec({
    ...common,
    reviewSpecId: 'caption.real-source.review.internal-testing.launch-reduced-v1',
    reducedMotion: true,
  })
  return {
    fullSpec,
    reducedSpec,
    fullRequest: buildCaptionRemotionRealSourceReviewRequest({
      spec: fullSpec,
      sourceProxyBytes,
    }),
    reducedRequest: buildCaptionRemotionRealSourceReviewRequest({
      spec: reducedSpec,
      sourceProxyBytes,
    }),
  }
}

export function runCap14RealSourceSmoke(): void {
  const sourceProxyBytes = Buffer.alloc(1_024)
  sourceProxyBytes.write('ftyp', 4, 'ascii')
  const fixture = buildCap14RealSourceFixture(sourceProxyBytes)
  const { fullSpec, fullRequest, reducedRequest } = fixture

  check(fullSpec.compositionProfileId === 'caption_direction_real_source_scene_group_v2',
    'Real-footage evidence must use a distinct additive composition profile.')
  check(fullSpec.privateReviewFrame.width === 360
    && fullSpec.privateReviewFrame.height === 640,
  'The private review frame must preserve the exact 9:16 ratio at one-third scale.')
  check(fullSpec.sourceEvidence.originalSourceSha256 === ORIGINAL_SOURCE_SHA256,
    'The fixture must bind the exact original uploaded source digest.')
  check(fullSpec.wordingEvidence.timingProvenance === 'synthetic_estimate'
    && fullSpec.wordingEvidence.wordLockedMotionUsed === false,
  'Synthetic word timing must remain limited to phrase-level presentation.')
  check(fullSpec.wordingEvidence.canonicalTranscriptQualificationClaimed === false,
    'The human-reviewed fixture wording must not replace canonical transcript qualification.')
  check(fullSpec.layers.length === 4
    && fullSpec.layers.filter((layer) =>
      layer.presentationKind === 'stable_accessible_caption').length === 2
    && fullSpec.layers.filter((layer) =>
      layer.presentationKind === 'hero_typography').length === 2,
  'The real-footage fixture must pair every hero phrase with complete stable wording.')
  check(fullSpec.layers.every((layer) =>
    layer.layoutBasisPoints.y >= 5_800
      && layer.layoutBasisPoints.y + layer.layoutBasisPoints.height <= 9_500),
  'Every layer must remain in the reviewed lower composition away from face and gesture zones.')
  check(fullSpec.layers.every((layer) => layer.maskSequenceRef === null
    && layer.objectAnchorRef === null && layer.trackManifestRef === null),
  'The top-plane real-source proof must not fabricate mask, anchor, or tracking evidence.')
  check(fullSpec.inspectionFrameNumbers.join('|') === INSPECTION_FRAMES.join('|'),
    'The inspection set must cover blank, entry, stable, boundary, exit, and tail frames.')
  check(!Object.hasOwn(fullRequest.payload, 'sourceAudioPreserved'),
    'The wire contract must express source-audio preservation through its fixed audio policy only.')
  check(fullRequest.payload.audioPolicy === 'preserve_source'
    && fullRequest.payload.sourceMediaPolicy ===
      'approved_caption_private_review_proxy_v1',
  'The real-source wire must preserve audio and disclose proxy-only source evidence.')
  check(fullRequest.payload.reducedMotion === false
    && reducedRequest.payload.reducedMotion === true,
  'Full and reduced-motion real-source variants must be distinct.')
  check(JSON.stringify(fullRequest.payload.layers)
    === JSON.stringify(reducedRequest.payload.layers),
  'Reduced motion must preserve wording, layout, depth, and phrase timing.')
  check(isCaptionRealSourceSceneGroupPayload(fullRequest.payload)
    && isCaptionRealSourceSceneGroupPayload(reducedRequest.payload),
  'Both real-source variants must pass the shared Remotion boundary.')
  check(parseCaptionRemotionRealSourceReviewSpec(fullSpec).reviewSpecDigestSha256
    === fullSpec.reviewSpecDigestSha256,
  'The real-source spec must round-trip through its closed parser.')

  const staleSpec = structuredClone(fullSpec)
  staleSpec.layers[0]!.text = 'Substituted text'
  expectThrow(() => parseCaptionRemotionRealSourceReviewSpec(staleSpec))

  const faceCollision = structuredClone(fullSpec)
  faceCollision.layers[0]!.layoutBasisPoints.y = 2_000
  faceCollision.reviewSpecDigestSha256 = calculateSkillContractDigest(
    faceCollision as unknown as Record<string, unknown>, 'reviewSpecDigestSha256')
  expectThrow(() => parseCaptionRemotionRealSourceReviewSpec(faceCollision))

  const fakeMask = structuredClone(fullSpec)
  fakeMask.layers[0]!.maskSequenceRef = ref('fake-mask', 'track-all-mask-v1')
  fakeMask.reviewSpecDigestSha256 = calculateSkillContractDigest(
    fakeMask as unknown as Record<string, unknown>, 'reviewSpecDigestSha256')
  expectThrow(() => parseCaptionRemotionRealSourceReviewSpec(fakeMask))

  const wordLockedOverclaim = structuredClone(fullRequest)
  wordLockedOverclaim.payload.wordLockedMotionUsed = true as false
  expectThrow(() => validateOfflineRemotionRenderRequest(wordLockedOverclaim))

  const missingInspection = structuredClone(fullRequest)
  missingInspection.payload.inspectionFrameNumbers = [0, 21, 80, 125]
  expectThrow(() => validateOfflineRemotionRenderRequest(missingInspection))

  const staleSource = structuredClone(fullRequest)
  staleSource.payload.sourceBytesBase64 = Buffer.alloc(1_024).toString('base64')
  expectThrow(() => validateOfflineRemotionRenderRequest(staleSource))

  const unsafeField = structuredClone(fullRequest) as unknown as {
    payload: Record<string, unknown>
  }
  unsafeField.payload.sourcePath = '/private/source.mp4'
  expectThrow(() => validateOfflineRemotionRenderRequest(unsafeField))

  console.log(JSON.stringify({
    status: 'passed_real_source_contract_runtime_and_direct_inspection_pending',
    milestone: 'CAP-14 real-source correction',
    assertions,
    compositionProfileId: fullSpec.compositionProfileId,
    originalSourceSha256: ORIGINAL_SOURCE_SHA256,
    outputFrame: '1080x1920@30',
    privateReviewFrame: '360x640@30',
    durationFrames: DURATION_FRAMES,
    inspectionFrameNumbers: INSPECTION_FRAMES,
    phraseLevelHumanReviewedWording: true,
    wordLockedMotionClaimed: false,
    canonicalTranscriptQualificationClaimed: false,
    trackAllEvidenceClaimed: false,
    runtimeExecuted: false,
    directRasterInspectionCompleted: false,
    productionAuthorityPromoted: false,
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCap14RealSourceSmoke()
}
