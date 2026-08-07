import { createHash } from 'node:crypto'

import type {
  BrollCaptionOwnerReadResult,
} from '../../src/types/caption-broll-owner-read-adapter'
import type {
  CanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
  CanonicalCaptionTranscriptPlanningExpectationBinding,
} from '../../src/types/canonical-caption-transcript-support'
import type {
  CaptionCanonicalTranscriptWord,
} from '../../src/types/caption-transcript-lineage'
import type {
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionRemotionLayer,
} from '../../src/types/caption-remotion-scene-group'
import type {
  CanonicalBrollCaptionInspectionSourceAuthority,
} from '../../src/types/canonical-broll-caption-inspection-source-authority'
import type {
  BrollRemotionLayerManifest,
  BrollRemotionPreviewProxyManifest,
} from '../edit-skills/b-roll'
import {
  brollRemotionPreviewProxyManifestSchema,
} from '../edit-skills/b-roll/b-roll-active-artifact-contracts'
import {
  brollRemotionLayerManifestSchema,
} from '../edit-skills/b-roll/b-roll-remotion-integration'
import {
  buildCaptionRemotionBrollOwnerApprovedRunReviewRequest,
  createCaptionRemotionBrollOwnerApprovedRunReviewSpec,
} from '../captions-specialist/caption-remotion-broll-owner-approved-run-review'
import {
  parseBrollCaptionOwnerReadResult,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import {
  parseCanonicalBrollCaptionInspectionSourceAuthority,
} from '../services/canonical-broll-caption-owner-service'
import {
  parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
  parseCanonicalCaptionTranscriptPlanningExpectationBinding,
} from '../services/canonical-caption-transcript-support-service'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import type {
  CanonicalCaptionBrollApprovedRunReviewAuthority,
} from './canonical-caption-broll-approved-run-harness'

export const CANONICAL_CAPTION_BROLL_APPROVED_RUN_CREATIVE_REVIEW_VERSION =
  'canonical-caption-broll-approved-run-creative-review-v1' as const

export interface CanonicalCaptionBrollApprovedRunCreativeReviewInput {
  readonly reviewIdSeed: string
  readonly approvedRunAuthority:
    CanonicalCaptionBrollApprovedRunReviewAuthority
  readonly ownerResult: BrollCaptionOwnerReadResult
  readonly inspectionSourceAuthority:
    CanonicalBrollCaptionInspectionSourceAuthority
  readonly remotionLayerManifest: BrollRemotionLayerManifest
  readonly remotionProxyManifest: BrollRemotionPreviewProxyManifest
  readonly remotionProxyBytes: Buffer
  readonly transcriptRecord:
    CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
  readonly transcriptExpectationBinding:
    CanonicalCaptionTranscriptPlanningExpectationBinding
}

/**
 * Internal qualification assembly only. It derives the review scene from the
 * exact authenticated transcript and owner artifacts of one approved run. It
 * is not a planner, dispatcher, transcript owner, B-roll owner, or final-canvas
 * owner, and it accepts no caller-authored wording, frames, layers, or media
 * identities.
 */
export function buildCanonicalCaptionBrollApprovedRunCreativeReview(
  input: CanonicalCaptionBrollApprovedRunCreativeReviewInput,
) {
  const ownerResult = parseBrollCaptionOwnerReadResult(input.ownerResult)
  const inspectionSourceAuthority =
    parseCanonicalBrollCaptionInspectionSourceAuthority(
      input.inspectionSourceAuthority,
    )
  const remotionLayerManifest = brollRemotionLayerManifestSchema.parse(
    input.remotionLayerManifest,
  )
  const remotionProxyManifest =
    brollRemotionPreviewProxyManifestSchema.parse(input.remotionProxyManifest)
  const transcriptRecord =
    parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord(
      input.transcriptRecord,
    )
  const transcriptExpectationBinding =
    parseCanonicalCaptionTranscriptPlanningExpectationBinding(
      input.transcriptExpectationBinding,
    )
  const parsedInput = {
    ...input,
    inspectionSourceAuthority,
    remotionLayerManifest,
    remotionProxyManifest,
    transcriptRecord,
    transcriptExpectationBinding,
  }
  assertExactInputLineage(parsedInput, ownerResult)
  const durationFrames = ownerResult.canonicalScope.authorizedFrameRange
    .endFrameExclusive - ownerResult.canonicalScope.authorizedFrameRange
      .startFrameInclusive
  const cueWords = splitExactTranscriptWords(
    transcriptRecord.canonicalTranscript.words,
  )
  const cueRanges = resolveCueRanges(cueWords, durationFrames)
  const layers = createLayers(cueWords, cueRanges)
  const transcriptRef = transcriptExpectationBinding
    .canonicalTranscriptRef
  const transcriptEvidenceRef: CaptionDomainRef = {
    id: transcriptRecord.recordId,
    version: transcriptRecord.schemaVersion,
    contentHash: transcriptRecord.recordDigestSha256,
  }
  const sceneGroupRef = ref(
    `${input.reviewIdSeed}.scene-group`,
    'caption-remotion-broll-owner-approved-run-scene-group-v1',
    digestValue({
      schemaVersion:
        'caption-remotion-broll-owner-approved-run-scene-group-v1',
      ownerResultRef: {
        id: ownerResult.resultId,
        version: ownerResult.schemaVersion,
        contentHash: ownerResult.resultDigestSha256,
      },
      transcriptRef,
      transcriptEvidenceRef,
      layers,
    }),
  )
  const motionLockRef = ref(
    `${input.reviewIdSeed}.motion-lock`,
    'caption-motion-lock-v1',
    digestValue({
      schemaVersion: 'caption-motion-lock-v1',
      sceneGroupRef,
      admittedVariants: ['full_motion', 'reduced_motion'],
      wordLockedMotionUsed: false,
    }),
  )
  const storyTimingResolutionRef = ref(
    `${input.reviewIdSeed}.story-timing`,
    'caption-storytiming-resolution-v1',
    digestValue({
      schemaVersion: 'caption-storytiming-resolution-v1',
      masterTimingRef: input.approvedRunAuthority.masterTimingRef,
      masterTimelineRange: [
        ownerResult.canonicalScope.authorizedFrameRange.startFrameInclusive,
        ownerResult.canonicalScope.authorizedFrameRange.endFrameExclusive,
      ],
      localCueRanges: cueRanges,
      exactSourceWordIds: cueWords.map((words) =>
        words.map((word) => word.sourceWordId)),
    }),
  )
  const wordingReviewDigestSha256 = digestValue({
    schemaVersion: 'canonical-approved-run-caption-wording-review-v1',
    transcriptRef,
    transcriptEvidenceRef,
    ownerResultDigestSha256: ownerResult.resultDigestSha256,
    cues: cueWords.map((words, index) => ({
      displayedText: phraseText(words),
      heroText: heroText(words, index),
      exactSourceWordIds: words.map((word) => word.sourceWordId),
      localFrameRange: cueRanges[index],
      transformation: 'exact',
    })),
    phraseLevelOnly: true,
    wordLockedMotionUsed: false,
  })
  const common = {
    canonicalScope: input.approvedRunAuthority.canonicalScope,
    approvedRunLineage: input.approvedRunAuthority.approvedRunLineage,
    sceneGroupRef,
    motionLockRef,
    storyTimingResolutionRef,
    sourceEvidence: {
      selectedNormalizedArtifactRef:
        inspectionSourceAuthority.selectedNormalizedArtifactRef,
      selectedNormalizedArtifactMimeType: 'video/x-nut' as const,
      selectedNormalizedArtifactByteLength:
        inspectionSourceAuthority.selectedNormalizedArtifact.byteLength,
      selectedNormalizedArtifactFrameCount:
        inspectionSourceAuthority.selectedNormalizedArtifact.frameCount,
      selectedNormalizedArtifactFps: 30 as const,
      remotionProxyRef: ref(
        `broll.remotion-proxy.${
          remotionProxyManifest.privateObjectIdentityHash.slice(0, 16)}`,
        'b_roll_remotion_preview_proxy_matroska_v1',
        remotionProxyManifest.objectSha256,
      ),
      remotionProxyMimeType: 'video/x-matroska' as const,
      remotionProxyByteLength: input.remotionProxyBytes.byteLength,
      remotionProxySha256: remotionProxyManifest.objectSha256,
      remotionProxyProfileId:
        'approved_b_roll_remotion_preview_proxy_matroska_v1' as const,
      remotionProxyDerivedFromSelectedArtifact: true as const,
      selectedSourceAudioRemovedByOwner: true as const,
      sourceMediaPolicy:
        'approved_b_roll_qa_normalized_preview_proxy_v1' as const,
    },
    wordingEvidence: {
      reviewRef: ref(
        `${input.reviewIdSeed}.wording-review`,
        'canonical-approved-run-caption-wording-review-v1',
        wordingReviewDigestSha256,
      ),
      reviewDigestSha256: wordingReviewDigestSha256,
      reviewPolicy:
        'canonical_approved_run_phrase_lineage_review_v1' as const,
      canonicalTranscriptRef: transcriptRef,
      canonicalTranscriptEvidenceRef: transcriptEvidenceRef,
      timingProvenance: exactTimingProvenance(cueWords.flat()),
      phraseLevelOnly: true as const,
      wordLockedMotionUsed: false as const,
      exactSourceWordLineageBound: true as const,
      canonicalTranscriptQualificationClaimed: false as const,
    },
    confirmedOutputFrame: input.approvedRunAuthority.confirmedOutputFrame,
    inspectionFrameNumbers: inspectionFrames(cueRanges, durationFrames),
    layers,
    ownerResult,
  }
  const fullSpec = createCaptionRemotionBrollOwnerApprovedRunReviewSpec({
    ...common,
    reviewSpecId: `${input.reviewIdSeed}.full`,
    reducedMotion: false,
  })
  const reducedSpec = createCaptionRemotionBrollOwnerApprovedRunReviewSpec({
    ...common,
    reviewSpecId: `${input.reviewIdSeed}.reduced`,
    reducedMotion: true,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_BROLL_APPROVED_RUN_CREATIVE_REVIEW_VERSION,
    cueWords: Object.freeze(cueWords.map((words) => Object.freeze(words))),
    cueRanges: Object.freeze(cueRanges.map((range) => Object.freeze(range))),
    fullSpec,
    reducedSpec,
    fullRequest: buildCaptionRemotionBrollOwnerApprovedRunReviewRequest({
      spec: fullSpec,
      ownerResult,
      remotionProxyBytes: input.remotionProxyBytes,
    }),
    reducedRequest: buildCaptionRemotionBrollOwnerApprovedRunReviewRequest({
      spec: reducedSpec,
      ownerResult,
      remotionProxyBytes: input.remotionProxyBytes,
    }),
    exactApprovedRunAuthorityConsumed: true as const,
    exactOwnerResultConsumed: true as const,
    exactCanonicalTranscriptConsumed: true as const,
    callerAuthoredWordingAccepted: false as const,
    callerAuthoredFramesAccepted: false as const,
    callerAuthoredLayersAccepted: false as const,
    directPeerDispatchPerformed: false as const,
    finalCanvasAuthorityGranted: false as const,
    finalQaApprovalGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

function assertExactInputLineage(
  input: CanonicalCaptionBrollApprovedRunCreativeReviewInput,
  ownerResult: BrollCaptionOwnerReadResult,
): void {
  const authority = input.approvedRunAuthority
  const source = input.inspectionSourceAuthority
  const layer = input.remotionLayerManifest
  const proxy = input.remotionProxyManifest
  const transcript = input.transcriptRecord
  const binding = input.transcriptExpectationBinding
  const range = authority.canonicalScope.authorizedFrameRanges[0]
  const expectedProxySha256 = createHash('sha256')
    .update(input.remotionProxyBytes).digest('hex')
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(input.reviewIdSeed)
    || authority.canonicalScope.sceneId === null
    || authority.canonicalScope.approvedSnapshotRef === null
    || !range
    || ownerResult.canonicalScope.ownerUserId
      !== authority.canonicalScope.ownerUserId
    || ownerResult.canonicalScope.workspaceId
      !== authority.canonicalScope.workspaceId
    || ownerResult.canonicalScope.projectId
      !== authority.canonicalScope.projectId
    || ownerResult.canonicalScope.editSessionId
      !== authority.canonicalScope.editSessionId
    || ownerResult.canonicalScope.planVersionId
      !== authority.canonicalScope.planVersionId
    || ownerResult.canonicalScope.outputId !== authority.canonicalScope.outputId
    || ownerResult.canonicalScope.sceneId !== authority.canonicalScope.sceneId
    || ownerResult.canonicalScope.authorizedFrameRange.startFrameInclusive
      !== range.startFrame
    || ownerResult.canonicalScope.authorizedFrameRange.endFrameExclusive
      !== range.endFrameExclusive
    || ownerResult.canonicalScope.authorizedFrameRange.fps !== 30
    || ownerResult.canonicalScope.masterTimingHash
      !== authority.masterTimingHash
    || source.ownerRequestRef.contentHash
      !== ownerResult.ownerRequestRef.contentHash
    || source.ownerResultRef.contentHash
      !== ownerResult.resultDigestSha256
    || source.canonicalScope.approvedSnapshotRef.contentHash
      !== authority.approvedRunLineage.approvedSnapshotRef.contentHash
    || source.selectedNormalizedArtifact.frameRate !== 30
    || source.selectedNormalizedArtifact.frameCount
      !== range.endFrameExclusive - range.startFrame
    || source.selectedNormalizedArtifact.mimeType !== 'video/x-nut'
    || !source.selectedNormalizedArtifact.audioRemoved
    || layer.layerManifestHash !== ownerResult.layoutOccupancyRef.contentHash
    || layer.layerManifestHash !== source.layoutOccupancyRef.contentHash
    || layer.assignmentReference.assignmentHash
      !== source.brollAssignmentRef.contentHash
    || layer.planReference.planHash !== source.brollPlanRef.contentHash
    || layer.exactTimelineRange.startFrameInclusive
      !== range.startFrame
    || layer.exactTimelineRange.endFrameExclusive
      !== range.endFrameExclusive
    || layer.exactTimelineRange.fps !== 30
    || layer.sourceTrim.startFrameInclusive !== 0
    || layer.sourceTrim.endFrameExclusive
      !== source.selectedNormalizedArtifact.frameCount
    || layer.sourceTrim.fps !== 30
    || layer.selectedArtifact.normalizedArtifact.sha256
      !== source.selectedNormalizedArtifactRef.contentHash
    || layer.displayTreatment !== 'full_frame_cutaway'
    || layer.crop.mode !== 'contain'
    || layer.position.xPercent !== 0
    || layer.position.yPercent !== 0
    || layer.position.widthPercent !== 100
    || layer.position.heightPercent !== 100
    || layer.position.opacity !== 1
    || layer.captionSafeBehavior.finalOwner !== 'captions'
    || layer.captionSafeBehavior.brollMayMutateCaptions
    || layer.rendererOwner !== 'render'
    || layer.finalCompositionOwnedByBroll
    || layer.outsideAuthorizedRangeModified
    || proxy.ownerUserId !== authority.canonicalScope.ownerUserId
    || proxy.workspaceId !== authority.canonicalScope.workspaceId
    || proxy.projectId !== authority.canonicalScope.projectId
    || proxy.editSessionId !== authority.canonicalScope.editSessionId
    || proxy.frameCount !== source.selectedNormalizedArtifact.frameCount
    || proxy.fps !== 30
    || proxy.sourceNormalizedSha256
      !== source.selectedNormalizedArtifactRef.contentHash
    || proxy.objectSha256 !== expectedProxySha256
    || proxy.byteLength !== input.remotionProxyBytes.byteLength
    || transcript.canonicalReadScope.ownerUserId
      !== authority.canonicalScope.ownerUserId
    || transcript.canonicalReadScope.workspaceId
      !== authority.canonicalScope.workspaceId
    || transcript.canonicalReadScope.projectId
      !== authority.canonicalScope.projectId
    || transcript.canonicalReadScope.editSessionId
      !== authority.canonicalScope.editSessionId
    || transcript.canonicalReadScope.planVersionId
      !== authority.canonicalScope.planVersionId
    || transcript.canonicalReadScope.approvedSnapshotRef.contentHash
      !== authority.approvedRunLineage.approvedSnapshotRef.contentHash
    || binding.bindingDigestSha256.length !== 64
    || binding.authenticatedTranscriptRecordDigestSha256
      !== transcript.recordDigestSha256
    || binding.canonicalTranscriptRef.contentHash
      !== transcript.canonicalTranscript.transcriptDigestSha256
    || transcript.canonicalTranscript.words.length < 4
    || transcript.canonicalTranscript.words.some((word) =>
      word.sourceSequenceItemId !==
        transcript.canonicalTranscript.words[0]?.sourceSequenceItemId)
  ) {
    throw new Error(
      'Canonical approved-run Caption creative review crossed owner, source, transcript, or timing authority.',
    )
  }
}

function splitExactTranscriptWords(
  words: readonly CaptionCanonicalTranscriptWord[],
): [CaptionCanonicalTranscriptWord[], CaptionCanonicalTranscriptWord[]] {
  const middle = words.length / 2
  const punctuationBreaks = words
    .map((word, index) => ({ word, index }))
    .filter(({ word, index }) =>
      index >= 1 && index <= words.length - 3
      && /[.!?]["'’)]*$/u.test(word.text))
    .sort((left, right) =>
      Math.abs(left.index + 1 - middle) - Math.abs(right.index + 1 - middle))
  const splitAt = punctuationBreaks[0]?.index === undefined
    ? Math.max(2, Math.min(words.length - 2, Math.round(middle)))
    : punctuationBreaks[0].index + 1
  const first = words.slice(0, splitAt).map((word) => structuredClone(word))
  const second = words.slice(splitAt).map((word) => structuredClone(word))
  if (first.length < 2 || second.length < 2
    || new Set(words.map((word) => word.sourceWordId)).size !== words.length) {
    throw new Error('Canonical transcript cannot form two exact review cues.')
  }
  return [first, second]
}

function resolveCueRanges(
  cues: readonly (readonly CaptionCanonicalTranscriptWord[])[],
  durationFrames: number,
): [{ startFrame: number; endFrameExclusive: number }, {
  startFrame: number; endFrameExclusive: number
}] {
  const boundary = Math.max(1, Math.min(durationFrames - 1,
    Math.floor(cues[1]![0]!.startMilliseconds * 30 / 1_000)))
  const end = Math.min(durationFrames, Math.max(boundary + 1,
    Math.ceil(cues[1]!.at(-1)!.endMillisecondsExclusive * 30 / 1_000)))
  if (end !== durationFrames) {
    throw new Error(
      'Canonical transcript timing does not cover the approved scene duration.',
    )
  }
  return [
    { startFrame: 0, endFrameExclusive: boundary },
    { startFrame: boundary, endFrameExclusive: durationFrames },
  ]
}

function createLayers(
  cues: readonly (readonly CaptionCanonicalTranscriptWord[])[],
  ranges: readonly { startFrame: number; endFrameExclusive: number }[],
): CaptionRemotionLayer[] {
  const layers: CaptionRemotionLayer[] = []
  for (const cueIndex of [0, 1] as const) {
    const cue = cueIndex + 1 as 1 | 2
    const words = cues[cueIndex]!
    const range = ranges[cueIndex]!
    const stableNodeId = `caption.approved-run.cue-${cue}.stable`
    const exactSourceWordIds = words.map((word) => word.sourceWordId)
    const stable = stableReadRange(range)
    layers.push(heroLayer({
      cue,
      range,
      stable,
      text: heroText(words, cueIndex),
      exactSourceWordIds,
      counterpartNodeId: stableNodeId,
    }))
    layers.push(stableLayer({
      cue,
      range,
      stable,
      text: phraseText(words),
      exactSourceWordIds,
      nodeId: stableNodeId,
    }))
  }
  return layers
}

function stableLayer(input: {
  cue: 1 | 2
  range: { startFrame: number; endFrameExclusive: number }
  stable: { startFrame: number; endFrameExclusive: number }
  text: string
  exactSourceWordIds: string[]
  nodeId: string
}): CaptionRemotionLayer {
  return {
    layerId: `caption.approved-run.cue-${input.cue}.stable`,
    nodeId: input.nodeId,
    trackId: 'caption.approved-run.track.accessible',
    phraseId: `caption.approved-run.phrase.cue-${input.cue}`,
    trackRole: 'verbatim_speech',
    presentationKind: 'stable_accessible_caption',
    text: input.text,
    exactSourceWordIds: input.exactSourceWordIds,
    frameRange: input.range,
    stableReadRange: input.stable,
    depthPlane: 'safe_accessible',
    zIndex: 1_000,
    layoutBasisPoints: { x: 600, y: 7_100, width: 8_800, height: 1_800 },
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1',
      fontWeight: 700,
      fontSizeBasisPointsOfFrameHeight: 520,
      lineHeightMilli: 1_150,
      textColor: '#F8FAFC',
      accentColor: '#6EE7F9',
      plateStyle: 'soft_dark',
      textAlign: 'center',
    },
    motion: {
      primitive: 'fade',
      easing: 'ease_out',
      travelBasisPoints: { x: 0, y: 0 },
      startScaleBasisPoints: 10_000,
      endScaleBasisPoints: 10_000,
      startOpacityBasisPoints: 0,
      endOpacityBasisPoints: 10_000,
      overshootBasisPoints: 0,
      staggerFrames: 0,
    },
    reducedMotion: { primitive: 'fade', frameRange: input.range },
    accessibilityCounterpartNodeId: null,
    maskSequenceRef: null,
    objectAnchorRef: null,
    trackManifestRef: null,
    dependencyDisposition: 'not_applicable',
  }
}

function heroLayer(input: {
  cue: 1 | 2
  range: { startFrame: number; endFrameExclusive: number }
  stable: { startFrame: number; endFrameExclusive: number }
  text: string
  exactSourceWordIds: string[]
  counterpartNodeId: string
}): CaptionRemotionLayer {
  return {
    layerId: `caption.approved-run.cue-${input.cue}.hero`,
    nodeId: `caption.approved-run.cue-${input.cue}.hero`,
    trackId: 'caption.approved-run.track.semantic',
    phraseId: `caption.approved-run.phrase.cue-${input.cue}`,
    trackRole: 'hero_typography',
    presentationKind: 'hero_typography',
    text: input.text,
    exactSourceWordIds: input.exactSourceWordIds,
    frameRange: input.range,
    stableReadRange: input.stable,
    depthPlane: 'foreground_hero',
    zIndex: 850,
    layoutBasisPoints: input.cue === 1
      ? { x: 700, y: 5_600, width: 2_800, height: 1_100 }
      : { x: 6_000, y: 5_600, width: 3_300, height: 1_100 },
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1',
      fontWeight: 800,
      fontSizeBasisPointsOfFrameHeight: 980,
      lineHeightMilli: 980,
      textColor: '#F8FAFC',
      accentColor: '#6EE7F9',
      plateStyle: 'none',
      textAlign: 'left',
    },
    motion: {
      primitive: 'scale',
      easing: 'ease_out',
      travelBasisPoints: { x: input.cue === 1 ? -90 : 90, y: 0 },
      startScaleBasisPoints: 9_500,
      endScaleBasisPoints: 10_000,
      startOpacityBasisPoints: 0,
      endOpacityBasisPoints: 10_000,
      overshootBasisPoints: 0,
      staggerFrames: 0,
    },
    reducedMotion: { primitive: 'fade', frameRange: input.range },
    accessibilityCounterpartNodeId: input.counterpartNodeId,
    maskSequenceRef: null,
    objectAnchorRef: null,
    trackManifestRef: null,
    dependencyDisposition: 'not_applicable',
  }
}

function stableReadRange(range: {
  startFrame: number
  endFrameExclusive: number
}) {
  const duration = range.endFrameExclusive - range.startFrame
  const startFrame = range.startFrame + Math.min(6, Math.floor(duration / 4))
  const endFrameExclusive = range.endFrameExclusive
    - Math.min(5, Math.floor(duration / 5))
  if (endFrameExclusive <= startFrame) {
    throw new Error('Canonical review cue has no stable reading interval.')
  }
  return { startFrame, endFrameExclusive }
}

function phraseText(words: readonly CaptionCanonicalTranscriptWord[]): string {
  return words.map((word) => word.text).join(' ')
    .replace(/\s+([,.;!?])/gu, '$1')
    .replace(/\s+([’'])/gu, '$1')
    .trim()
}

function heroText(
  words: readonly CaptionCanonicalTranscriptWord[],
  cueIndex: number,
): string {
  const meaningful = words.map((word) => word.text)
    .filter((text) => /[\p{L}\p{N}]/u.test(text))
    .map((text) => text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean)
  const selected = cueIndex === 0
    ? meaningful.slice(-1)
    : meaningful.slice(-2)
  if (selected.length === 0) {
    throw new Error('Canonical review cue has no semantic hero text.')
  }
  return selected.join(' ').toLocaleUpperCase('en-US')
}

function exactTimingProvenance(
  words: readonly CaptionCanonicalTranscriptWord[],
): 'asr_native' | 'manually_corrected' {
  const values = new Set(words.map((word) => word.timestampProvenance))
  if (values.size !== 1
    || (values.has('asr_native') === values.has('manually_corrected'))) {
    throw new Error(
      'Approved-run phrase review requires one exact admitted timing provenance.',
    )
  }
  return values.has('manually_corrected')
    ? 'manually_corrected' : 'asr_native'
}

function inspectionFrames(
  ranges: readonly { startFrame: number; endFrameExclusive: number }[],
  durationFrames: number,
): number[] {
  return [...new Set([
    0,
    ...ranges.flatMap((range) => [
      Math.floor((range.startFrame + range.endFrameExclusive - 1) / 2),
      range.endFrameExclusive - 1,
    ]),
    durationFrames - 1,
  ])].sort((left, right) => left - right)
}

function ref(id: string, version: string, contentHash: string): CaptionDomainRef {
  return { id, version, contentHash }
}

function digestValue(value: unknown): string {
  return calculateSkillContractDigest(
    { value, digest: '' }, 'digest')
}
