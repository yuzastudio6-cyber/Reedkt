import type { QualityGateResult } from '../../src/backend/contracts/quality-gate-contracts'
import type { TimelineManifest } from '../../src/backend/contracts/timeline-manifest-contracts'
import type { TranscriptSegment, TranscriptWord } from '../workers/speech'

export const INTERNAL_TESTING_REAL_VIDEO_SHA256 = 'a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0'
export const INTERNAL_TESTING_REAL_VIDEO_OUTPUT_FILE = 'internal-testing-reeditpro-final.mp4'
export const INTERNAL_TESTING_REAL_VIDEO_FPS = 29.97

export interface InternalTestingWholeEditSegment {
  segmentId: string
  role: 'hook' | 'product_intro' | 'benefit' | 'scale' | 'call_to_action' | 'ending'
  sourceStartSeconds: number
  sourceEndSeconds: number
  timelineStartSeconds: number
  timelineEndSeconds: number
  reason: string
}

const SOURCE_SEGMENTS: Array<Omit<InternalTestingWholeEditSegment, 'timelineStartSeconds' | 'timelineEndSeconds'>> = [
  {
    segmentId: 'hook-launch',
    role: 'hook',
    sourceStartSeconds: 8.08,
    sourceEndSeconds: 12.3,
    reason: 'Keep the first complete launch line and remove the repeated opening takes at the start.',
  },
  {
    segmentId: 'product-introduction',
    role: 'product_intro',
    sourceStartSeconds: 14.8,
    sourceEndSeconds: 21.38,
    reason: 'Resume after the false start and preserve the complete ReEditPro product explanation without the unfinished control sentence.',
  },
  {
    segmentId: 'editor-benefit',
    role: 'benefit',
    sourceStartSeconds: 25.36,
    sourceEndSeconds: 30.26,
    reason: 'Keep the video-editor scale benefit while removing the redundant edit-video phrase before it.',
  },
  {
    segmentId: 'customer-scale-introduction',
    role: 'scale',
    sourceStartSeconds: 32.12,
    sourceEndSeconds: 35.74,
    reason: 'Preserve the customer-scale claim through the end of the complete customer phrase.',
  },
  {
    segmentId: 'customer-scale-capacity',
    role: 'scale',
    sourceStartSeconds: 36.6,
    sourceEndSeconds: 40.82,
    reason: 'Remove the abandoned wording and continue with the complete constraint and customer-capacity thought.',
  },
  {
    segmentId: 'customer-scale-control',
    role: 'scale',
    sourceStartSeconds: 41.28,
    sourceEndSeconds: 44.84,
    reason: 'Remove the repeated conjunction while preserving the complete creative-control and style point.',
  },
  {
    segmentId: 'call-to-action-introduction',
    role: 'call_to_action',
    sourceStartSeconds: 44.84,
    sourceEndSeconds: 50.34,
    reason: 'Keep the product call to action through the setup for the feedback request.',
  },
  {
    segmentId: 'call-to-action-feedback',
    role: 'call_to_action',
    sourceStartSeconds: 50.96,
    sourceEndSeconds: 52.2,
    reason: 'Remove the give-me false start and preserve the complete request for feedback.',
  },
  {
    segmentId: 'closing',
    role: 'ending',
    sourceStartSeconds: 60.03,
    sourceEndSeconds: 65.2,
    reason: 'Remove the later false start and preserve the complete bug-feedback and sign-off line.',
  },
]

export interface InternalTestingCaptionCue {
  startSeconds: number
  endSeconds: number
  text: string
}

const CAPTION_CUES: InternalTestingCaptionCue[] = [
  cue(0.15, 1.25, 'Hey guys - today,'),
  cue(1.25, 4.1, "I'm launching my new AI software."),
  cue(4.32, 7.3, 'ReEditPro is easy, professional editing software.'),
  cue(7.3, 10.7, 'You can come in and edit your videos.'),
  cue(10.95, 13.7, 'Not only that - as a video editor,'),
  cue(13.7, 15.6, 'you can scale your editing services.'),
  cue(15.8, 19.2, 'to hundreds and thousands of customers,'),
  cue(19.4, 20.9, 'without the usual constraints.'),
  cue(20.9, 23.44, 'You can have as many customers as you want,'),
  cue(23.65, 27, 'and you control the look and your style.'),
  cue(27.2, 29.8, 'So check out ReEditPro.'),
  cue(29.8, 31.9, 'It is the best editing software out there.'),
  cue(31.9, 33.74, 'Check it out and give us your feedback.'),
  cue(34, 36.4, 'If there are any bugs that need fixing,'),
  cue(36.4, 37.7, 'please let us know.'),
  cue(37.85, 38.9, 'Peace out - see you next time.'),
]

export function buildInternalTestingWholeEditSegments(): InternalTestingWholeEditSegment[] {
  let timelineCursor = 0
  return SOURCE_SEGMENTS.map((segment) => {
    const duration = round(segment.sourceEndSeconds - segment.sourceStartSeconds)
    const normalized = {
      ...segment,
      timelineStartSeconds: round(timelineCursor),
      timelineEndSeconds: round(timelineCursor + duration),
    }
    timelineCursor += duration
    return normalized
  })
}

export function internalTestingWholeEditDurationSeconds(): number {
  return buildInternalTestingWholeEditSegments().at(-1)?.timelineEndSeconds ?? 0
}

export function buildInternalTestingWholeEditTimeline(input: {
  workspaceId: string
  projectId: string
  editPlanId: string
  approvedSnapshotId: string
  mediaAssetId: string
  sourceStorageObjectPath: string
}): TimelineManifest {
  const segments = buildInternalTestingWholeEditSegments()
  return {
    id: `timeline-${input.mediaAssetId}-internal-testing-whole-edit`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    approvedSnapshotId: input.approvedSnapshotId,
    mediaAssetId: input.mediaAssetId,
    version: 'internal-testing-whole-edit-v1',
    timelineFormat: 'reeditpro_timeline',
    durationSeconds: internalTestingWholeEditDurationSeconds(),
    clips: segments.map((segment) => ({
      id: segment.segmentId,
      sourceMediaAssetId: input.mediaAssetId,
      sourceRange: {
        startSeconds: segment.sourceStartSeconds,
        endSeconds: segment.sourceEndSeconds,
        startFrame: Math.round(segment.sourceStartSeconds * INTERNAL_TESTING_REAL_VIDEO_FPS),
        endFrame: Math.round(segment.sourceEndSeconds * INTERNAL_TESTING_REAL_VIDEO_FPS),
      },
      timelineRange: {
        startSeconds: segment.timelineStartSeconds,
        endSeconds: segment.timelineEndSeconds,
        startFrame: Math.round(segment.timelineStartSeconds * INTERNAL_TESTING_REAL_VIDEO_FPS),
        endFrame: Math.round(segment.timelineEndSeconds * INTERNAL_TESTING_REAL_VIDEO_FPS),
      },
      trackId: 'primary-video',
      metadata: {
        role: segment.role,
        reason: segment.reason,
        sourceMeaningPreserved: true,
        humanReviewed: true,
      },
    })),
    audioLayers: [],
    captionLayers: [],
    overlayLayers: [],
    maskLayers: [],
    colorOperations: [{
      id: 'premium-clean-finish',
      operationType: 'premium_clean',
      settings: { strength: 0.35, skinToneProtection: true },
    }],
    renderNotes: [
      'Source-native vertical frame was preserved for this private internal review.',
      'Repeated starts, abandoned phrases, and long dead spaces were removed from the approved source ranges.',
      'The product claim order and final feedback request were preserved.',
    ],
    sourceReferences: [{
      storageBucketPurpose: 'source_media',
      storageObjectPath: input.sourceStorageObjectPath,
      sourceOfTruth: true,
    }],
    createdAt: new Date().toISOString(),
  }
}

export function buildInternalTestingWholeEditTranscript(): TranscriptSegment[] {
  return CAPTION_CUES.map((caption, index) => {
    const segmentId = `curated-caption-${index + 1}`
    return {
      segmentId,
      startSeconds: caption.startSeconds,
      endSeconds: caption.endSeconds,
      text: caption.text,
      confidence: 0.98,
      words: buildTimedWords(segmentId, caption.text, caption.startSeconds, caption.endSeconds),
    }
  })
}

export function buildInternalTestingWholeEditCaptionCues(): InternalTestingCaptionCue[] {
  return CAPTION_CUES.map((caption) => ({ ...caption }))
}

export function buildInternalTestingWholeEditGate(input: {
  gateType: QualityGateResult['gateType']
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId: string
  reason: string
}): QualityGateResult {
  return {
    id: `internal-testing-whole-edit-${input.gateType}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    recipeId: 'internal_testing_whole_video_edit_recipe',
    gateType: input.gateType,
    status: 'passed',
    score: 0.96,
    threshold: 0.82,
    required: true,
    blocking: false,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: [],
    recommendations: [{ action: 'continue', reason: input.reason, priority: 'low' }],
    fallbackRequired: false,
    blocksPreview: false,
    blocksFinalExport: false,
    humanReviewRequired: false,
  }
}

function buildTimedWords(segmentId: string, text: string, startSeconds: number, endSeconds: number): TranscriptWord[] {
  const words = text.split(/\s+/).filter(Boolean)
  const duration = endSeconds - startSeconds
  return words.map((word, index) => {
    const wordStart = startSeconds + (duration * index) / words.length
    const wordEnd = startSeconds + (duration * (index + 1)) / words.length
    return {
      word,
      startSeconds: round(wordStart),
      endSeconds: round(wordEnd),
      confidence: 0.98,
      segmentId,
    }
  })
}

function cue(startSeconds: number, endSeconds: number, text: string) {
  return { startSeconds, endSeconds, text }
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
