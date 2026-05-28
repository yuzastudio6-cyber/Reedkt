import { runSmartCutTimelineExecutionPipeline } from '../../workers/smart-cut-timeline'
import type { SmartCutPlan, SegmentCandidate, SegmentKeepDecision, SegmentRemoveDecision } from '../../workers/smart-cut'
import type { RealVideoSmartCutBuildResult, RealVideoSmartCutNormalizedInput } from './real-video-smart-cut-types'

export async function buildRealVideoSmartCutTimeline(
  input: RealVideoSmartCutNormalizedInput,
): Promise<RealVideoSmartCutBuildResult> {
  const smartCutPlan = buildConservativePhase29SmartCutPlan(input)
  const executionResult = await runSmartCutTimelineExecutionPipeline({
    mode: 'dry_run',
    workspaceId: 'activation-phase29',
    projectId: 'reeditpro',
    mediaAssetId: 'phase28-20260528T01552-source-video',
    editPlanId: 'activation-phase29-smart-cut-caption',
    approvedSnapshotId: 'activation-phase29-controlled-real-video',
    toolExecutionPlanId: 'activation-phase29-smart-cut-caption',
    idempotencyKey: 'activation-phase29-phase28-20260528T01552',
    sourceVideoArtifactId: 'phase28-source-video',
    sourceStorageObjectPath: input.sourceGcsUri,
    captionArtifactIds: input.captionArtifactIds,
    transcriptArtifactIds: input.transcriptArtifactIds,
    wordTimestamps: input.wordTimestamps,
    mediaDurationSeconds: input.sourceDurationSeconds,
    fps: 30,
    canvas: { width: input.width ?? 3840, height: input.height ?? 2160 },
    allowFinalExport: false,
    enableProxyPreview: false,
    smartCutPlan,
  })

  if (!executionResult.executionPlan || !executionResult.timelineManifest || !executionResult.otioManifest || !executionResult.hyperframeBridge || !executionResult.remotionManifest) {
    throw new Error(`Phase 29 smart-cut timeline build failed: ${executionResult.skippedReasons.join('; ')}`)
  }

  return {
    smartCutPlan,
    executionResult,
    executionPlan: executionResult.executionPlan,
    timelineManifest: executionResult.timelineManifest,
    otioManifest: executionResult.otioManifest,
    hyperframeBridge: executionResult.hyperframeBridge,
    remotionManifest: executionResult.remotionManifest,
    qaResults: executionResult.qaResults,
  }
}

export function buildConservativePhase29SmartCutPlan(input: RealVideoSmartCutNormalizedInput): SmartCutPlan {
  const removeSegments = buildSafeDeadSpaceRemovals(input)
  const keepSegments = buildKeepSegments(input, removeSegments)
  const protectedSegments = input.transcriptSegments.map((segment, index): SegmentKeepDecision => ({
    decisionId: `protect-transcript-${index + 1}`,
    candidateId: `transcript-${segment.segmentId}`,
    startSeconds: segment.startSeconds,
    endSeconds: segment.endSeconds,
    score: 0.96,
    confidence: segment.confidence ?? 0.82,
    reason: 'Phase 29 protects transcript ranges to avoid meaning loss in the first controlled smart-cut test.',
    protected: true,
  }))
  const targetDurationSeconds = round(input.sourceDurationSeconds - removeSegments.reduce((sum, segment) => sum + (segment.endSeconds - segment.startSeconds), 0))

  return {
    id: 'smart-cut-plan-phase29-phase28-20260528T01552',
    workspaceId: 'activation-phase29',
    projectId: 'reeditpro',
    mediaAssetId: 'phase28-20260528T01552-source-video',
    sourceDurationSeconds: input.sourceDurationSeconds,
    targetDurationSeconds,
    intent: ['talking_head_clean_cut', 'remove_dead_space', 'preserve_story'],
    aggressiveness: 'gentle',
    pacingProfile: {
      profileId: 'natural_clean',
      maxSilenceSeconds: 1.8,
      minSegmentDurationSeconds: 1.2,
      targetCutsPerMinuteMin: 2,
      targetCutsPerMinuteMax: 6,
      emotionalPausePolicy: 'protect',
      notes: [
        'Phase 29 uses conservative real-video smart-cut thresholds.',
        'No removal is forced when word-gap evidence is insufficient.',
      ],
    },
    segmentCandidates: buildSegmentCandidates(input),
    segmentScores: [],
    keepSegments,
    removeSegments,
    cutBoundaries: removeSegments.flatMap((segment) => [
      {
        boundaryId: `boundary-${segment.decisionId}-start`,
        sourceTimeSeconds: segment.startSeconds,
        adjustedTimeSeconds: segment.startSeconds,
        paddingBeforeSeconds: 0.18,
        paddingAfterSeconds: 0.18,
        risks: ['none' as const],
        safe: true,
        reason: 'Cut boundary lands in a protected word gap with conservative padding.',
      },
      {
        boundaryId: `boundary-${segment.decisionId}-end`,
        sourceTimeSeconds: segment.endSeconds,
        adjustedTimeSeconds: segment.endSeconds,
        paddingBeforeSeconds: 0.18,
        paddingAfterSeconds: 0.18,
        risks: ['none' as const],
        safe: true,
        reason: 'Cut boundary lands in a protected word gap with conservative padding.',
      },
    ]),
    protectedSegments,
    rejectedCandidates: buildRejectedDeadSpaceCandidates(input, removeSegments),
    meaningFindings: [],
    warnings: removeSegments.length === 0
      ? ['No safe dead-space cuts were justified by Phase 28 word-gap evidence; timeline preserves the full source.']
      : ['Phase 29 removal candidates are limited to conservative word-gap dead space.'],
    confidence: removeSegments.length === 0 ? 0.82 : 0.78,
    qaChecks: ['cut_smoothness', 'transcript_alignment', 'render_timeline_integrity'],
    requiredQualityGates: ['cut_smoothness', 'transcript_alignment', 'render_timeline_integrity'],
  }
}

function buildSafeDeadSpaceRemovals(input: RealVideoSmartCutNormalizedInput): SegmentRemoveDecision[] {
  const words = [...input.wordTimestamps].sort((a, b) => a.startSeconds - b.startSeconds)
  const protectedRanges = [...input.transcriptSegments, ...input.captionSegments]
  const removals: SegmentRemoveDecision[] = []

  for (let index = 1; index < words.length; index += 1) {
    const previous = words[index - 1]
    const next = words[index]
    const rawGapStart = previous.endSeconds
    const rawGapEnd = next.startSeconds
    const rawGapDuration = rawGapEnd - rawGapStart
    if (rawGapDuration < 0.9) continue
    const startSeconds = round(rawGapStart + 0.18)
    const endSeconds = round(rawGapEnd - 0.18)
    if (endSeconds - startSeconds < 0.45) continue
    if (protectedRanges.some((range) => overlaps({ startSeconds, endSeconds }, range))) continue
    if (words.some((word) => startSeconds > word.startSeconds && startSeconds < word.endSeconds)) continue
    if (words.some((word) => endSeconds > word.startSeconds && endSeconds < word.endSeconds)) continue
    removals.push({
      decisionId: `remove-word-gap-${removals.length + 1}`,
      candidateId: `word-gap-${index}`,
      startSeconds,
      endSeconds,
      score: 0.62,
      confidence: 0.72,
      reason: 'Conservative dead-space removal from a word gap with boundary padding.',
      risks: ['audio_pop_risk'],
    })
  }

  return removals
}

function buildKeepSegments(input: RealVideoSmartCutNormalizedInput, removals: SegmentRemoveDecision[]): SegmentKeepDecision[] {
  if (removals.length === 0) {
    return [{
      decisionId: 'keep-full-source-phase29',
      candidateId: 'full-source-phase29',
      startSeconds: 0,
      endSeconds: input.sourceDurationSeconds,
      score: 0.96,
      confidence: 0.86,
      reason: 'No safe cuts were justified; preserve the complete controlled Phase 28 source.',
      protected: true,
    }]
  }

  const keepSegments: SegmentKeepDecision[] = []
  let cursor = 0
  for (const [index, removal] of removals.entries()) {
    if (removal.startSeconds - cursor > 0.05) {
      keepSegments.push(keepSegment(index + 1, cursor, removal.startSeconds, input))
    }
    cursor = removal.endSeconds
  }
  if (input.sourceDurationSeconds - cursor > 0.05) {
    keepSegments.push(keepSegment(keepSegments.length + 1, cursor, input.sourceDurationSeconds, input))
  }
  return keepSegments
}

function keepSegment(index: number, startSeconds: number, endSeconds: number, input: RealVideoSmartCutNormalizedInput): SegmentKeepDecision {
  return {
    decisionId: `keep-phase29-${index}`,
    candidateId: `keep-range-${index}`,
    startSeconds: round(startSeconds),
    endSeconds: round(endSeconds),
    score: 0.9,
    confidence: 0.8,
    reason: 'Kept range preserves story and caption timing around conservative dead-space removals.',
    protected: input.transcriptSegments.some((segment) => overlaps(segment, { startSeconds, endSeconds })),
  }
}

function buildSegmentCandidates(input: RealVideoSmartCutNormalizedInput): SegmentCandidate[] {
  return input.transcriptSegments.map((segment) => ({
    candidateId: `transcript-${segment.segmentId}`,
    candidateType: 'transcript',
    source: 'transcript',
    startSeconds: segment.startSeconds,
    endSeconds: segment.endSeconds,
    text: segment.text,
    transcriptSegmentIds: [segment.segmentId],
    captionIds: input.captionSegments.filter((caption) => overlaps(caption, segment)).map((caption) => caption.captionId),
    wordCount: segment.words.length,
    evidence: {
      hasTranscript: true,
      hasWordTimestamps: segment.words.length > 0,
      hasSilence: false,
      hasSceneBoundary: false,
      hasCaption: true,
      fillerLabels: [],
      repeatedTakeCandidateIds: [],
    },
    risks: ['none'],
    protected: true,
    reason: 'Phase 28 transcript segment is protected as source evidence for Phase 29.',
  }))
}

function buildRejectedDeadSpaceCandidates(input: RealVideoSmartCutNormalizedInput, removals: SegmentRemoveDecision[]): SegmentRemoveDecision[] {
  if (removals.length > 0) return []
  return [{
    decisionId: 'reject-phase29-no-safe-dead-space',
    candidateId: 'phase29-word-gap-review',
    startSeconds: 0,
    endSeconds: input.sourceDurationSeconds,
    score: 0.12,
    confidence: 0.82,
    reason: 'Word-gap evidence did not justify a safe first smart-cut removal; preserve source.',
    risks: ['emotional_pause'],
    futureOnly: true,
  }]
}

function overlaps(a: { startSeconds: number; endSeconds: number }, b: { startSeconds: number; endSeconds: number }): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
