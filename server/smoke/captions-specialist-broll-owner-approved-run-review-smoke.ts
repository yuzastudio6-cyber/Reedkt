import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { BrollCaptionOwnerReadResult } from
  '../../src/types/caption-broll-owner-read-adapter'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CaptionRemotionLayer } from
  '../../src/types/caption-remotion-scene-group'
import type { CaptionRemotionBrollOwnerApprovedRunReviewSpec } from
  '../../src/types/caption-remotion-broll-owner-approved-run-review'
import {
  CAPTION_REMOTION_BROLL_OWNER_COMPOSITION_PROFILE,
  CAPTION_REMOTION_BROLL_OWNER_REVIEW_SPEC_VERSION,
} from '../../src/types/caption-remotion-broll-owner-review'
import {
  assertCaptionRemotionBrollOwnerApprovedRunReviewSpec,
  buildCaptionRemotionBrollOwnerApprovedRunReviewRequest,
  createCaptionRemotionBrollOwnerApprovedRunReviewSpec,
  parseCaptionRemotionBrollOwnerApprovedRunReviewSpec,
} from '../captions-specialist/caption-remotion-broll-owner-approved-run-review'
import {
  createCaptionBrollOwnerReadRequest,
  parseBrollCaptionOwnerReadResult,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import { BROLL_CAPTION_OWNER_MANIFEST_REF } from
  '../edit-skills/b-roll/b-roll-caption-public-contract'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  isCaptionBrollOwnerApprovedRunSceneGroupPayload,
  validateOfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'

const DURATION_FRAMES = 120
const MASTER_START_FRAME = 300
const MASTER_END_FRAME_EXCLUSIVE = MASTER_START_FRAME + DURATION_FRAMES
const INSPECTION_FRAMES = [0, 22, 44, 82, 119]
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

function ref(id: string, version: string, contentHash = digest(
  `${id}:${version}`,
)): CaptionDomainRef {
  return { id, version, contentHash }
}

function motion(variant: 'stable' | 'hero'):
CaptionRemotionLayer['motion'] {
  return {
    primitive: variant === 'stable' ? 'fade' : 'scale',
    easing: 'ease_out',
    travelBasisPoints: { x: variant === 'stable' ? 0 : -110, y: 0 },
    startScaleBasisPoints: variant === 'stable' ? 10_000 : 9_350,
    endScaleBasisPoints: 10_000,
    startOpacityBasisPoints: 0,
    endOpacityBasisPoints: 10_000,
    overshootBasisPoints: 0,
    staggerFrames: 0,
  }
}

function layer(input: {
  cue: 1 | 2
  kind: 'stable' | 'hero'
  range: [number, number]
  stableRange: [number, number]
  text: string
  wordIds: string[]
  counterpartId?: string
}): CaptionRemotionLayer {
  const stable = input.kind === 'stable'
  return {
    layerId: `caption.approved-run.cue-${input.cue}.${input.kind}`,
    nodeId: `caption.approved-run.node.cue-${input.cue}.${input.kind}`,
    trackId: stable
      ? 'caption.approved-run.track.accessible'
      : 'caption.approved-run.track.hero',
    phraseId: `caption.approved-run.phrase.cue-${input.cue}`,
    trackRole: stable ? 'verbatim_speech' : 'hero_typography',
    presentationKind: stable
      ? 'stable_accessible_caption'
      : 'hero_typography',
    text: input.text,
    exactSourceWordIds: input.wordIds,
    frameRange: {
      startFrame: input.range[0],
      endFrameExclusive: input.range[1],
    },
    stableReadRange: {
      startFrame: input.stableRange[0],
      endFrameExclusive: input.stableRange[1],
    },
    depthPlane: stable ? 'safe_accessible' : 'foreground_hero',
    zIndex: stable ? 1_000 : 850,
    layoutBasisPoints: stable
      ? { x: 600, y: 7_100, width: 8_800, height: 1_800 }
      : { x: 700, y: 5_650, width: 2_600, height: 1_050 },
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1',
      fontWeight: stable ? 700 : 800,
      fontSizeBasisPointsOfFrameHeight: stable ? 560 : 900,
      lineHeightMilli: stable ? 1_160 : 960,
      textColor: stable ? '#F8FAFC' : '#DFF7FF',
      accentColor: '#6EE7F9',
      plateStyle: stable ? 'soft_dark' : 'none',
      textAlign: stable ? 'center' : 'left',
    },
    motion: motion(input.kind),
    reducedMotion: {
      primitive: 'fade',
      frameRange: {
        startFrame: input.range[0],
        endFrameExclusive: input.range[1],
      },
    },
    accessibilityCounterpartNodeId: input.counterpartId ?? null,
    maskSequenceRef: null,
    objectAnchorRef: null,
    trackManifestRef: null,
    dependencyDisposition: 'not_applicable',
  }
}

function layers(): CaptionRemotionLayer[] {
  const oneWords = ['transcript.word.001', 'transcript.word.002']
  const twoWords = [
    'transcript.word.003', 'transcript.word.004', 'transcript.word.005',
  ]
  const oneStable = layer({
    cue: 1,
    kind: 'stable',
    range: [0, 45],
    stableRange: [5, 41],
    text: 'Ideas move through the frame.',
    wordIds: oneWords,
  })
  const twoStable = layer({
    cue: 2,
    kind: 'stable',
    range: [45, 120],
    stableRange: [51, 114],
    text: 'Captions stay readable.',
    wordIds: twoWords,
  })
  return [
    layer({
      cue: 1,
      kind: 'hero',
      range: [0, 45],
      stableRange: [5, 41],
      text: 'IDEAS',
      wordIds: oneWords,
      counterpartId: oneStable.nodeId,
    }),
    oneStable,
    layer({
      cue: 2,
      kind: 'hero',
      range: [45, 120],
      stableRange: [51, 114],
      text: 'READABLE',
      wordIds: twoWords,
      counterpartId: twoStable.nodeId,
    }),
    twoStable,
  ]
}

function ownerResultFixture(): BrollCaptionOwnerReadResult {
  const approvedSnapshotRef = ref(
    'snapshot.caption-approved-run.v3',
    'private-edit-authority-approved-snapshot-v3')
  const outputFrameRef = ref(
    'output-frame.caption-approved-run.4k',
    'canonical-confirmed-output-frame-authority-v1')
  const masterTimingRef = ref(
    'master-timing.caption-approved-run.v1',
    'master_timing_plan_v1')
  const request = createCaptionBrollOwnerReadRequest({
    requestId: 'request.caption-approved-run.broll.v1',
    brollManifestRef: structuredClone(
      BROLL_CAPTION_OWNER_MANIFEST_REF),
    canonicalScope: {
      ownerUserId: 'owner.caption-approved-run',
      workspaceId: 'workspace.caption-approved-run',
      projectId: 'project.caption-approved-run',
      editSessionId: 'edit.caption-approved-run',
      planVersionId: 'plan.caption-approved-run.v1',
      approvedSnapshotRef,
      outputId: 'output.caption-approved-run',
      outputFrameRef,
      sceneId: 'scene.caption-approved-run.001',
      authorizedFrameRange: {
        startFrameInclusive: MASTER_START_FRAME,
        endFrameExclusive: MASTER_END_FRAME_EXCLUSIVE,
        fps: 30,
      },
      masterTimingRef,
      masterTimingHash: masterTimingRef.contentHash,
    },
    planningConstraintRef: ref(
      'constraint.caption-approved-run.broll.v1',
      'caption-broll-planning-constraint-v1'),
  })
  const withoutDigest: Omit<BrollCaptionOwnerReadResult,
    'resultDigestSha256'> = {
    schemaVersion: 'b_roll_caption_owner_read_result_v1',
    resultId: 'result.caption-approved-run.broll.v1',
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
      'receipt.caption-approved-run.broll.v1', 'b_roll_result_receipt_v1'),
    selectedMediaManifestRef: ref(
      'manifest.caption-approved-run.broll.v1',
      'b_roll_candidate_media_manifest_v1'),
    layoutOccupancyRef: ref(
      'layout.caption-approved-run.broll.v1',
      'b_roll_remotion_layer_manifest_v1'),
    cropTimingRef: ref(
      'crop.caption-approved-run.broll.v1',
      'b_roll_caption_crop_timing_projection_v1'),
    visibleTextEvidenceRef: ref(
      'visible.caption-approved-run.broll.v1',
      'b_roll_caption_visible_text_evidence_v1'),
    sourceContractVersions: {
      selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1',
      layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1',
      cropTimingRef: 'b_roll_caption_crop_timing_projection_v1',
      visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1',
    },
    authenticatedOwnerEvidenceRef: ref(
      'evidence.caption-approved-run.broll.v1',
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

function redigest(
  spec: CaptionRemotionBrollOwnerApprovedRunReviewSpec,
): void {
  spec.reviewSpecDigestSha256 = calculateSkillContractDigest(
    spec as unknown as Record<string, unknown>,
    'reviewSpecDigestSha256')
}

function run(): void {
  const ownerResult = ownerResultFixture()
  const proxyBytes = Buffer.alloc(4_096)
  proxyBytes.set([0x1a, 0x45, 0xdf, 0xa3])
  const proxySha256 = digest(proxyBytes)
  const selectedSha256 = digest('approved-run-selected-normalized')
  const captionLayers = layers()
  const wordingDigest = digest(JSON.stringify({
    canonicalTranscript: 'transcript.caption-approved-run.v1',
    sourceWordIds: captionLayers.flatMap((item) => item.exactSourceWordIds),
  }))
  const approvedSnapshotRef = structuredClone(
    ownerResult.canonicalScope.approvedSnapshotRef)
  const spec = createCaptionRemotionBrollOwnerApprovedRunReviewSpec({
    reviewSpecId: 'caption.approved-run.broll-review.full.v2',
    canonicalScope: {
      ownerUserId: ownerResult.canonicalScope.ownerUserId,
      workspaceId: ownerResult.canonicalScope.workspaceId,
      projectId: ownerResult.canonicalScope.projectId,
      editSessionId: ownerResult.canonicalScope.editSessionId,
      planVersionId: ownerResult.canonicalScope.planVersionId,
      approvedSnapshotRef,
      outputId: ownerResult.canonicalScope.outputId,
      sceneId: ownerResult.canonicalScope.sceneId,
      authorizedFrameRanges: [{
        startFrame: MASTER_START_FRAME,
        endFrameExclusive: MASTER_END_FRAME_EXCLUSIVE,
      }],
    },
    approvedRunLineage: {
      approvedSnapshotRef,
      executionPackageRef: ref(
        'package.caption-approved-run.v5',
        'canonical-approved-edit-execution-package-v5'),
      captionPlanningProjectionRef: ref(
        'caption.projection.approved-run.v3',
        'canonical-caption-specialist-planning-projection-v3'),
      captionPlanningBindingRef: ref(
        'caption.binding.approved-run.v3',
        'canonical-caption-specialist-planning-binding-v3'),
      captionRenderedMediaWorkBindingRef: ref(
        'caption.rendered-media.approved-run.v1',
        'canonical-caption-rendered-media-work-binding-v1'),
      exactImmutableApprovedRunRereadVerified: true,
      creativeReviewSupplementsCanonicalFinalCanvas: true,
      creativeReviewReplacesCanonicalFinalCanvas: false,
    },
    sceneGroupRef: ref(
      'caption.scene-group.approved-run.v2',
      'caption-remotion-scene-group-v2'),
    motionLockRef: ref(
      'caption.motion-lock.approved-run.v1', 'caption-motion-lock-v1'),
    storyTimingResolutionRef: ref(
      'caption.storytiming.approved-run.v1',
      'caption-storytiming-resolution-v1'),
    sourceEvidence: {
      selectedNormalizedArtifactRef: ref(
        'broll.selected-normalized.approved-run.v1',
        'b_roll_selected_normalized_media_v1', selectedSha256),
      selectedNormalizedArtifactMimeType: 'video/x-nut',
      selectedNormalizedArtifactByteLength: 8_192,
      selectedNormalizedArtifactFrameCount: DURATION_FRAMES,
      selectedNormalizedArtifactFps: 30,
      remotionProxyRef: ref(
        'broll.proxy.approved-run.v1',
        'b_roll_remotion_preview_proxy_matroska_v1', proxySha256),
      remotionProxyMimeType: 'video/x-matroska',
      remotionProxyByteLength: proxyBytes.byteLength,
      remotionProxySha256: proxySha256,
      remotionProxyProfileId:
        'approved_b_roll_remotion_preview_proxy_matroska_v1',
      remotionProxyDerivedFromSelectedArtifact: true,
      selectedSourceAudioRemovedByOwner: true,
      sourceMediaPolicy:
        'approved_b_roll_qa_normalized_preview_proxy_v1',
    },
    wordingEvidence: {
      reviewRef: ref(
        'caption.wording.approved-run.v1',
        'caption-approved-run-wording-review-v1', wordingDigest),
      reviewDigestSha256: wordingDigest,
      reviewPolicy: 'canonical_approved_run_phrase_lineage_review_v1',
      canonicalTranscriptRef: ref(
        'transcript.caption-approved-run.v1',
        'canonical-caption-transcript-v1'),
      canonicalTranscriptEvidenceRef: ref(
        'transcript-evidence.caption-approved-run.v1',
        'canonical-caption-transcript-evidence-v1'),
      timingProvenance: 'asr_native',
      phraseLevelOnly: true,
      wordLockedMotionUsed: false,
      exactSourceWordLineageBound: true,
      canonicalTranscriptQualificationClaimed: false,
    },
    confirmedOutputFrame: {
      frameRef: structuredClone(ownerResult.canonicalScope.outputFrameRef),
      outputId: ownerResult.canonicalScope.outputId,
      width: 3_840,
      height: 2_160,
      aspectRatioNumerator: 16,
      aspectRatioDenominator: 9,
      fpsNumerator: 30,
      fpsDenominator: 1,
    },
    reducedMotion: false,
    inspectionFrameNumbers: INSPECTION_FRAMES,
    layers: captionLayers,
    ownerResult,
  })
  const parsed = parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(spec)
  check(parsed.schemaVersion ===
    'caption-remotion-broll-owner-approved-run-review-spec-v2',
  'V2 approved-run review must have a distinct wire identity.')
  check(parsed.compositionProfileId ===
    'caption_direction_broll_owner_approved_run_scene_group_v5',
  'Approved-run creative rendering must use the additive V5 profile.')
  check(parsed.confirmedOutputFrame.width === 3_840
    && parsed.confirmedOutputFrame.height === 2_160
    && parsed.confirmedOutputFrame.fpsNumerator === 30,
  'The spec must bind the exact 4K@30 confirmed output frame.')
  check(parsed.privateReviewFrame.width === 640
    && parsed.privateReviewFrame.scaleDenominator === 6
    && !parsed.privateReviewFrame.finalCustomerCanvasClaimed,
  'The renderer must use an aspect-correct bounded private proxy only.')
  check(parsed.approvedRunLineage.approvedSnapshotRef.contentHash
    === ownerResult.canonicalScope.approvedSnapshotRef.contentHash
    && parsed.approvedRunLineage.creativeReviewReplacesCanonicalFinalCanvas
      === false,
  'Creative review must supplement, never replace, the canonical final canvas.')
  check(parsed.layers.every((item) => item.exactSourceWordIds.length > 0),
  'Every rendered layer must retain exact source-word lineage.')
  check(assertCaptionRemotionBrollOwnerApprovedRunReviewSpec({
    spec: parsed,
    ownerResult,
  }).reviewSpecDigestSha256 === parsed.reviewSpecDigestSha256,
  'The exact owner result must reread against the V2 spec.')

  const request = buildCaptionRemotionBrollOwnerApprovedRunReviewRequest({
    spec: parsed,
    ownerResult,
    remotionProxyBytes: proxyBytes,
  })
  check(isCaptionBrollOwnerApprovedRunSceneGroupPayload(request.payload),
  'The closed Remotion request must retain the V5 profile.')
  check(request.payload.confirmedOutputWidth === 3_840
    && request.payload.privateReviewScaleDenominator === 6
    && request.payload.approvedSnapshotDigestSha256
      === approvedSnapshotRef.contentHash,
  'The runtime request must bind exact frame and snapshot lineage.')
  check(request.payload.captionPlanningProjectionDigestSha256
    === parsed.approvedRunLineage.captionPlanningProjectionRef.contentHash
    && request.payload.captionRenderedMediaWorkBindingDigestSha256
      === parsed.approvedRunLineage.captionRenderedMediaWorkBindingRef
        .contentHash,
  'The runtime request must bind Caption planning and final-media work lineage.')
  check(request.payload.exactSourceWordLineageBound
    && request.payload.completeTimeInspectionRequired
    && !request.payload.canonicalTranscriptQualificationClaimed,
  'The request must preserve exact wording lineage without overstating transcript qualification.')
  check(!request.payload.creativeReviewReplacesCanonicalFinalCanvas,
  'The private creative review must not claim final-canvas ownership.')
  check(CAPTION_REMOTION_BROLL_OWNER_REVIEW_SPEC_VERSION ===
    'caption-remotion-broll-owner-review-spec-v1'
    && CAPTION_REMOTION_BROLL_OWNER_COMPOSITION_PROFILE ===
      'caption_direction_broll_owner_real_source_scene_group_v4',
  'The frozen V1 review identities must remain unchanged.')

  const staleSnapshot = structuredClone(parsed)
  staleSnapshot.approvedRunLineage.approvedSnapshotRef = ref(
    'snapshot.caption-approved-run.stale',
    'private-edit-authority-approved-snapshot-v3')
  redigest(staleSnapshot)
  expectThrow(() =>
    parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(staleSnapshot))

  const crossedWords = structuredClone(parsed)
  crossedWords.layers[0]!.exactSourceWordIds = ['transcript.word.crossed']
  redigest(crossedWords)
  expectThrow(() =>
    parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(crossedWords))

  const missingTail = structuredClone(parsed)
  missingTail.inspectionFrameNumbers = [0, 22, 44, 82]
  redigest(missingTail)
  expectThrow(() =>
    parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(missingTail))

  const crossedRequest = structuredClone(request)
  crossedRequest.payload.captionPlanningBindingDigestSha256 = 'crossed'
  expectThrow(() => validateOfflineRemotionRenderRequest(crossedRequest))

  const replacementClaim = structuredClone(request) as unknown as {
    payload: Record<string, unknown>
  }
  replacementClaim.payload.creativeReviewReplacesCanonicalFinalCanvas = true
  expectThrow(() => validateOfflineRemotionRenderRequest(replacementClaim))

  const qualificationOverclaim = structuredClone(request) as unknown as {
    payload: Record<string, unknown>
  }
  qualificationOverclaim.payload.canonicalTranscriptQualificationClaimed = true
  expectThrow(() => validateOfflineRemotionRenderRequest(qualificationOverclaim))

  const hiddenField = structuredClone(request) as unknown as Record<string,
    unknown>
  ;(hiddenField.payload as Record<string, unknown>).providerToken = 'forbidden'
  expectThrow(() => validateOfflineRemotionRenderRequest(hiddenField))

  console.log(JSON.stringify({
    smoke: 'captions_specialist_broll_owner_approved_run_review',
    status: 'passed',
    assertions,
    frozenV1Preserved: true,
    approvedRunV2Added: true,
    exact4k30ConfirmedFrameBound: true,
    boundedPrivateProxyOnly: true,
    canonicalFinalCanvasOwnerRemainsRemotion: true,
    transcriptQualificationClaimed: false,
    runtimeExecuted: false,
    providerCalled: false,
    publicDeliveryCreated: false,
    productionAuthorityGranted: false,
  }, null, 2))
}

run()
