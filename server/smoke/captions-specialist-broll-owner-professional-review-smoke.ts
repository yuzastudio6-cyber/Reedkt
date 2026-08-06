import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import type {
  BrollCaptionOwnerReadResult,
} from '../../src/types/caption-broll-owner-read-adapter'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CaptionRemotionLayer } from
  '../../src/types/caption-remotion-scene-group'
import type { CaptionRemotionBrollOwnerReviewSpec } from
  '../../src/types/caption-remotion-broll-owner-review'
import {
  assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult,
  buildCaptionRemotionBrollOwnerReviewRequest,
  createCaptionRemotionBrollOwnerReviewSpec,
  parseCaptionRemotionBrollOwnerReviewSpec,
} from '../captions-specialist/caption-remotion-broll-owner-review'
import {
  createCaptionBrollOwnerReadRequest,
  parseBrollCaptionOwnerReadResult,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import {
  isCaptionBrollOwnerRealSourceSceneGroupPayload,
  validateOfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

const DURATION_FRAMES = 72
const MASTER_START_FRAME = 120
const MASTER_END_FRAME_EXCLUSIVE = MASTER_START_FRAME + DURATION_FRAMES
const INSPECTION_FRAMES = [0, 5, 11, 23, 30, 47, 71]

let assertions = 0

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}

function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}

function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function ref(
  id: string,
  version: string,
  contentHash = digest(`${id}:${version}`),
): CaptionDomainRef {
  return { id, version, contentHash }
}

function redigestSpec(spec: CaptionRemotionBrollOwnerReviewSpec): void {
  spec.reviewSpecDigestSha256 = calculateSkillContractDigest(
    spec as unknown as Record<string, unknown>,
    'reviewSpecDigestSha256',
  )
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
        travelBasisPoints: { x: -110, y: 0 },
        startScaleBasisPoints: 9_350,
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
}): CaptionRemotionLayer {
  return {
    layerId: `caption.broll-owner.cue-${input.cue}.stable`,
    nodeId: `caption.broll-owner.node.cue-${input.cue}.stable`,
    trackId: 'caption.broll-owner.track.accessible',
    phraseId: `caption.broll-owner.phrase.cue-${input.cue}`,
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
    layoutBasisPoints: { x: 600, y: 7_100, width: 8_800, height: 1_800 },
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1',
      fontWeight: 700,
      fontSizeBasisPointsOfFrameHeight: 560,
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
}): CaptionRemotionLayer {
  return {
    layerId: `caption.broll-owner.cue-${input.cue}.hero`,
    nodeId: `caption.broll-owner.node.cue-${input.cue}.hero`,
    trackId: 'caption.broll-owner.track.semantic',
    phraseId: `caption.broll-owner.phrase.cue-${input.cue}`,
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
    layoutBasisPoints: { x: 700, y: 5_650, width: 2_600, height: 1_050 },
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1',
      fontWeight: 800,
      fontSizeBasisPointsOfFrameHeight: 900,
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

function layers(): CaptionRemotionLayer[] {
  const cueOneWords = [
    'broll-caption.word.hey',
    'broll-caption.word.guys',
    'broll-caption.word.today',
  ]
  const cueTwoWords = [
    'broll-caption.word.im',
    'broll-caption.word.launching',
    'broll-caption.word.my',
    'broll-caption.word.new',
    'broll-caption.word.ai',
    'broll-caption.word.software',
  ]
  const cueOneStable = stableLayer({
    cue: 1,
    startFrame: 0,
    endFrameExclusive: 24,
    stableStart: 4,
    stableEnd: 22,
    text: 'Hey guys — today.',
    wordIds: cueOneWords,
  })
  const cueTwoStable = stableLayer({
    cue: 2,
    startFrame: 24,
    endFrameExclusive: 72,
    stableStart: 29,
    stableEnd: 68,
    text: "I'm launching my new AI software.",
    wordIds: cueTwoWords,
  })
  return [
    heroLayer({
      cue: 1,
      startFrame: 0,
      endFrameExclusive: 24,
      stableStart: 4,
      stableEnd: 22,
      text: 'TODAY',
      wordIds: cueOneWords,
      counterpartNodeId: cueOneStable.nodeId,
    }),
    cueOneStable,
    heroLayer({
      cue: 2,
      startFrame: 24,
      endFrameExclusive: 72,
      stableStart: 29,
      stableEnd: 68,
      text: 'AI',
      wordIds: cueTwoWords,
      counterpartNodeId: cueTwoStable.nodeId,
    }),
    cueTwoStable,
  ]
}

export interface CaptionBrollOwnerProfessionalReviewFixtureInput {
  ownerResult: BrollCaptionOwnerReadResult
  selectedNormalizedArtifactRef: CaptionDomainRef
  selectedNormalizedArtifactByteLength: number
  selectedNormalizedArtifactFrameCount: number
  selectedNormalizedArtifactFps: 24
  remotionProxyRef: CaptionDomainRef
  remotionProxyBytes: Buffer
}

export function buildCaptionBrollOwnerProfessionalReviewFixture(
  input: CaptionBrollOwnerProfessionalReviewFixtureInput,
) {
  const ownerResult = parseBrollCaptionOwnerReadResult(input.ownerResult)
  const proxySha256 = digest(input.remotionProxyBytes)
  const wordingReviewDigest = digest(JSON.stringify({
    reviewPolicy: 'fixture_specific_human_review_phrase_level_only_v1',
    ownerResultDigestSha256: ownerResult.resultDigestSha256,
    selectedNormalizedArtifactSha256:
      input.selectedNormalizedArtifactRef.contentHash,
    cues: [
      { masterRange: [120, 144], localRange: [0, 24], text: 'Hey guys — today.' },
      {
        masterRange: [144, 192],
        localRange: [24, 72],
        text: "I'm launching my new AI software.",
      },
    ],
    timingProvenance: 'synthetic_estimate',
    wordLockedMotionUsed: false,
  }))
  const canonicalScope = {
    ownerUserId: ownerResult.canonicalScope.ownerUserId,
    workspaceId: ownerResult.canonicalScope.workspaceId,
    projectId: ownerResult.canonicalScope.projectId,
    editSessionId: ownerResult.canonicalScope.editSessionId,
    planVersionId: ownerResult.canonicalScope.planVersionId,
    approvedSnapshotRef:
      structuredClone(ownerResult.canonicalScope.approvedSnapshotRef),
    outputId: ownerResult.canonicalScope.outputId,
    sceneId: ownerResult.canonicalScope.sceneId,
    authorizedFrameRanges: [{
      startFrame:
        ownerResult.canonicalScope.authorizedFrameRange.startFrameInclusive,
      endFrameExclusive:
        ownerResult.canonicalScope.authorizedFrameRange.endFrameExclusive,
    }],
  }
  const captionLayers = layers()
  const sceneGroupDigestSha256 = digest(JSON.stringify({
    schemaVersion: 'caption-remotion-broll-owner-scene-group-v1',
    ownerResultDigestSha256: ownerResult.resultDigestSha256,
    outputFrameRef: ownerResult.canonicalScope.outputFrameRef,
    masterTimingHash: ownerResult.canonicalScope.masterTimingHash,
    layers: captionLayers,
    safePlacementPolicy: 'broll_center_safe_caption_lower_band_v1',
  }))
  const motionLockDigestSha256 = digest(JSON.stringify({
    schemaVersion: 'caption-motion-lock-v1',
    sceneGroupDigestSha256,
    admittedMotionVariants: ['full_motion', 'reduced_motion'],
  }))
  const storyTimingResolutionDigestSha256 = digest(JSON.stringify({
    schemaVersion: 'caption-storytiming-resolution-v1',
    masterTimingHash: ownerResult.canonicalScope.masterTimingHash,
    masterTimelineRange: [
      ownerResult.canonicalScope.authorizedFrameRange.startFrameInclusive,
      ownerResult.canonicalScope.authorizedFrameRange.endFrameExclusive,
    ],
    cueRanges: [[0, 24], [24, 72]],
  }))
  const common = {
    canonicalScope,
    sceneGroupRef: ref(
      'caption.broll-owner.professional.scene-group.repair-v2',
      'caption-remotion-broll-owner-scene-group-v1',
      sceneGroupDigestSha256),
    motionLockRef: ref(
      'caption.broll-owner.professional.motion-lock.repair-v2',
      'caption-motion-lock-v1',
      motionLockDigestSha256),
    storyTimingResolutionRef: ref(
      'caption.broll-owner.professional.story-timing.v1',
      'caption-storytiming-resolution-v1',
      storyTimingResolutionDigestSha256),
    sourceEvidence: {
      selectedNormalizedArtifactRef:
        structuredClone(input.selectedNormalizedArtifactRef),
      selectedNormalizedArtifactMimeType: 'video/x-nut' as const,
      selectedNormalizedArtifactByteLength:
        input.selectedNormalizedArtifactByteLength,
      selectedNormalizedArtifactFrameCount:
        input.selectedNormalizedArtifactFrameCount,
      selectedNormalizedArtifactFps: input.selectedNormalizedArtifactFps,
      remotionProxyRef: structuredClone(input.remotionProxyRef),
      remotionProxyMimeType: 'video/x-matroska' as const,
      remotionProxyByteLength: input.remotionProxyBytes.byteLength,
      remotionProxySha256: proxySha256,
      remotionProxyProfileId:
        'approved_b_roll_remotion_preview_proxy_matroska_v1' as const,
      remotionProxyDerivedFromSelectedArtifact: true as const,
      selectedSourceAudioRemovedByOwner: true as const,
      sourceMediaPolicy:
        'approved_b_roll_qa_normalized_preview_proxy_v1' as const,
    },
    wordingEvidence: {
      reviewRef: ref(
        'caption.broll-owner.professional.wording-review.v1',
        'caption-fixture-wording-review-v1',
        wordingReviewDigest),
      reviewDigestSha256: wordingReviewDigest,
      reviewPolicy:
        'fixture_specific_human_review_phrase_level_only_v1' as const,
      timingProvenance: 'synthetic_estimate' as const,
      phraseLevelOnly: true as const,
      wordLockedMotionUsed: false as const,
      canonicalTranscriptQualificationClaimed: false as const,
    },
    confirmedOutputFrame: {
      frameRef: structuredClone(ownerResult.canonicalScope.outputFrameRef),
      outputId: ownerResult.canonicalScope.outputId,
      width: 1_920 as const,
      height: 1_080 as const,
      aspectRatioNumerator: 16 as const,
      aspectRatioDenominator: 9 as const,
      fpsNumerator: 24 as const,
      fpsDenominator: 1 as const,
    },
    inspectionFrameNumbers: INSPECTION_FRAMES,
    layers: captionLayers,
    ownerResult,
  }
  const fullSpec = createCaptionRemotionBrollOwnerReviewSpec({
    ...common,
    reviewSpecId: 'caption.broll-owner.professional.full.repair-v2',
    reducedMotion: false,
  })
  const reducedSpec = createCaptionRemotionBrollOwnerReviewSpec({
    ...common,
    reviewSpecId: 'caption.broll-owner.professional.reduced.repair-v2',
    reducedMotion: true,
  })
  return {
    fullSpec,
    reducedSpec,
    fullRequest: buildCaptionRemotionBrollOwnerReviewRequest({
      spec: fullSpec,
      ownerResult,
      remotionProxyBytes: input.remotionProxyBytes,
    }),
    reducedRequest: buildCaptionRemotionBrollOwnerReviewRequest({
      spec: reducedSpec,
      ownerResult,
      remotionProxyBytes: input.remotionProxyBytes,
    }),
  }
}

function ownerResultFixture(): BrollCaptionOwnerReadResult {
  const approvedSnapshotRef = ref(
    'snapshot.caption-broll.professional.v1',
    'approved-plan-snapshot-v1')
  const outputFrameRef = ref(
    'output-frame.caption-broll.professional.16x9',
    'confirmed-output-frame-v1')
  const masterTimingRef = ref(
    'master-timing.caption-broll.professional.v1',
    'master_timing_plan_v1')
  const request = createCaptionBrollOwnerReadRequest({
    requestId: 'request.caption-broll.professional.v1',
    canonicalScope: {
      ownerUserId: 'caption-broll-professional-owner',
      workspaceId: 'caption-broll-professional-workspace',
      projectId: 'caption-broll-professional-project',
      editSessionId: 'caption-broll-professional-edit-session',
      planVersionId: 'caption-broll-professional-plan-v1',
      approvedSnapshotRef,
      outputId: 'caption-broll-professional-output',
      outputFrameRef,
      sceneId: 'caption-broll-professional-scene',
      authorizedFrameRange: {
        startFrameInclusive: MASTER_START_FRAME,
        endFrameExclusive: MASTER_END_FRAME_EXCLUSIVE,
        fps: 24,
      },
      masterTimingRef,
      masterTimingHash: masterTimingRef.contentHash,
    },
    planningConstraintRef: ref(
      'caption-broll-professional-constraint.v1',
      'caption-broll-planning-constraint-v1'),
  })
  const withoutDigest: Omit<BrollCaptionOwnerReadResult,
    'resultDigestSha256'> = {
    schemaVersion: 'b_roll_caption_owner_read_result_v1',
    resultId: 'result.caption-broll.professional.v1',
    ownerSkillKey: 'b_roll',
    requestingSkillKey: 'captions',
    requestedJobType: 'provide_caption_broll_composition_constraints',
    mediationMode: 'hq_mediated_owner_read',
    brollManifestRef: structuredClone(request.brollManifestRef),
    canonicalScope: structuredClone(request.canonicalScope),
    ownerRequestRef: {
      id: request.requestId,
      version: request.schemaVersion,
      contentHash: request.requestDigestSha256,
    },
    brollResultReceiptRef: ref(
      'receipt.caption-broll.professional.v1',
      'b_roll_result_receipt_v1'),
    selectedMediaManifestRef: ref(
      'manifest.caption-broll.professional.v1',
      'b_roll_candidate_media_manifest_v1'),
    layoutOccupancyRef: ref(
      'layout.caption-broll.professional.v1',
      'b_roll_remotion_layer_manifest_v1'),
    cropTimingRef: ref(
      'crop.caption-broll.professional.v1',
      'b_roll_caption_crop_timing_projection_v1'),
    visibleTextEvidenceRef: ref(
      'visible-text.caption-broll.professional.v1',
      'b_roll_caption_visible_text_evidence_v1'),
    sourceContractVersions: {
      selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1',
      layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1',
      cropTimingRef: 'b_roll_caption_crop_timing_projection_v1',
      visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1',
    },
    authenticatedOwnerEvidenceRef: ref(
      'evidence.caption-broll.professional.v1',
      'b_roll_authenticated_owner_read_evidence_v1'),
    exactPrivateOwnerRereadVerified: true,
    exactCanonicalScopeVerified: true,
    exactApprovedSnapshotVerified: true,
    exactOutputFrameAndMasterTimingVerified: true,
    sourceSelectionPerformedByCaption: false,
    cropOrTimingPerformedByCaption: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    rawChatIncluded: false,
    credentialsIncluded: false,
    sourceSelectionAuthorityGranted: false,
    cropOrTimingMutationAuthorityGranted: false,
    runtimeOrDispatchAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseBrollCaptionOwnerReadResult({
    ...withoutDigest,
    resultDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, resultDigestSha256: '' },
      'resultDigestSha256'),
  })
}

export function runCaptionBrollOwnerProfessionalReviewSmoke(): void {
  const ownerResult = ownerResultFixture()
  const proxyBytes = Buffer.alloc(2_048)
  proxyBytes.set([0x1a, 0x45, 0xdf, 0xa3])
  const selectedBytes = Buffer.alloc(4_096, 0x4e)
  const selectedSha256 = digest(selectedBytes)
  const proxySha256 = digest(proxyBytes)
  const fixture = buildCaptionBrollOwnerProfessionalReviewFixture({
    ownerResult,
    selectedNormalizedArtifactRef: ref(
      'caption-broll.professional.selected-normalized.v1',
      'b_roll_selected_normalized_media_v1',
      selectedSha256),
    selectedNormalizedArtifactByteLength: selectedBytes.byteLength,
    selectedNormalizedArtifactFrameCount: DURATION_FRAMES,
    selectedNormalizedArtifactFps: 24,
    remotionProxyRef: ref(
      'caption-broll.professional.remotion-proxy.v1',
      'b_roll_remotion_preview_proxy_matroska_v1',
      proxySha256),
    remotionProxyBytes: proxyBytes,
  })
  check(fixture.fullSpec.compositionProfileId ===
    'caption_direction_broll_owner_real_source_scene_group_v4',
  'The owner-bound professional review must use the additive V4 profile.')
  check(fixture.fullSpec.masterTimelineStartFrame === MASTER_START_FRAME
    && fixture.fullSpec.masterTimelineEndFrameExclusive
      === MASTER_END_FRAME_EXCLUSIVE
    && fixture.fullSpec.durationFrames === DURATION_FRAMES,
  'The private proxy must preserve the exact owner-authorized MasterTiming range.')
  check(fixture.fullSpec.brollOwnerLineage.ownerResultRef.contentHash
    === ownerResult.resultDigestSha256
    && fixture.fullSpec.brollOwnerLineage.ownerRequestRef.contentHash
      === ownerResult.ownerRequestRef.contentHash,
  'The Caption composition must bind the exact owner request and result.')
  check(fixture.fullSpec.sourceEvidence.remotionProxySha256 === proxySha256
    && fixture.fullSpec.sourceEvidence.selectedNormalizedArtifactRef.contentHash
      === selectedSha256,
  'The render request must bind both the owner-selected artifact and proxy bytes.')
  check(fixture.fullSpec.layers.every((layer) =>
    layer.layoutBasisPoints.y >= 5_400
    && layer.layoutBasisPoints.y + layer.layoutBasisPoints.height <= 9_300),
  'All Caption layers must remain in the owner-compatible lower safe band.')
  check(fixture.fullSpec.layers.every((layer) =>
    layer.maskSequenceRef === null
    && layer.objectAnchorRef === null
    && layer.trackManifestRef === null
    && layer.dependencyDisposition === 'not_applicable'),
  'The proof must not fabricate Track All, mask, or object-anchor evidence.')
  check(fixture.fullSpec.sourceEvidence.selectedSourceAudioRemovedByOwner
    && fixture.fullRequest.payload.audioPolicy
      === 'source_audio_absent_owner_normalized',
  'Caption must preserve the B-roll owner\'s audio-absent normalized proxy policy.')
  check(JSON.stringify(fixture.fullRequest.payload.layers)
    === JSON.stringify(fixture.reducedRequest.payload.layers),
  'Reduced motion must preserve wording, geometry, and layer order.')
  check(isCaptionBrollOwnerRealSourceSceneGroupPayload(
    fixture.fullRequest.payload)
    && isCaptionBrollOwnerRealSourceSceneGroupPayload(
      fixture.reducedRequest.payload),
  'Both variants must pass the closed shared Remotion boundary.')
  check(parseCaptionRemotionBrollOwnerReviewSpec(fixture.fullSpec)
    .reviewSpecDigestSha256 === fixture.fullSpec.reviewSpecDigestSha256,
  'The professional review spec must round-trip through its closed parser.')
  check(!fixture.fullSpec.syntheticEngineeringFixtureAcceptedAsProfessionalAppearance
    && fixture.fullSpec.realSourcePixelsRequiredForProfessionalAppearance
    && !fixture.fullSpec.finalQaApprovalGranted
    && !fixture.fullSpec.publicDeliveryGranted
    && !fixture.fullSpec.productionAuthorityGranted,
  'Real pixels are required without promoting final QA or delivery authority.')

  const crossedOwner = structuredClone(fixture.fullSpec)
  crossedOwner.brollOwnerLineage.ownerResultRef.contentHash = digest('crossed')
  redigestSpec(crossedOwner)
  expectThrow(() => assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult({
    spec: crossedOwner,
    ownerResult,
  }))

  const unsafeLayer = structuredClone(fixture.fullSpec)
  unsafeLayer.layers[0]!.layoutBasisPoints.y = 5_000
  redigestSpec(unsafeLayer)
  expectThrow(() => parseCaptionRemotionBrollOwnerReviewSpec(unsafeLayer))

  const forgedMask = structuredClone(fixture.fullSpec)
  forgedMask.layers[0]!.maskSequenceRef = ref(
    'forged.mask', 'track-all-mask-sequence-v1')
  redigestSpec(forgedMask)
  expectThrow(() => parseCaptionRemotionBrollOwnerReviewSpec(forgedMask))

  const duplicateFrame = structuredClone(fixture.fullSpec)
  duplicateFrame.inspectionFrameNumbers = [0, 11, 11, 47, 71]
  redigestSpec(duplicateFrame)
  expectThrow(() => parseCaptionRemotionBrollOwnerReviewSpec(duplicateFrame))

  const selectionOverclaim = structuredClone(fixture.fullRequest) as unknown as {
    payload: Record<string, unknown>
  }
  selectionOverclaim.payload.sourceSelectionPerformedByCaption = true
  expectThrow(() => validateOfflineRemotionRenderRequest(selectionOverclaim))

  const staleProxy = structuredClone(fixture.fullRequest)
  staleProxy.payload.sourceBytesBase64 = Buffer.alloc(2_048, 0x7f)
    .toString('base64')
  expectThrow(() => validateOfflineRemotionRenderRequest(staleProxy))

  const unsafeField = structuredClone(fixture.fullRequest) as unknown as {
    payload: Record<string, unknown>
  }
  unsafeField.payload.sourcePath = '/private/owner-proxy.mkv'
  expectThrow(() => validateOfflineRemotionRenderRequest(unsafeField))

  console.log(JSON.stringify({
    status: 'passed_broll_owner_professional_review_contract_source_only',
    compositionProfileId: fixture.fullSpec.compositionProfileId,
    assertions,
    exactOwnerResultBound: true,
    realSourcePixelsRequiredForProfessionalAppearance: true,
    variants: ['full_motion', 'reduced_motion'],
    runtimeExecuted: false,
    directRasterInspectionCompleted: false,
    canonicalTranscriptQualificationClaimed: false,
    trackAllEvidenceClaimed: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }, null, 2))
}

if (process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCaptionBrollOwnerProfessionalReviewSmoke()
}
