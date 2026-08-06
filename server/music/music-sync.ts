import {
  framesToSamples,
  samplesToFrames,
  type TimelineRate,
} from '../edit-skills/core/timeline-rate'
import { hashMusicValue, type CanonicalMusicCueIntent, type MusicCandidateAnalysis, type MusicFrameRange } from './music-contracts'

export type MusicSyncIntent =
  | 'beat_aligned' | 'phrase_aligned' | 'dialogue_aligned' | 'emotion_aligned'
  | 'transition_aligned' | 'intentionally_off_beat' | 'free_time' | 'ambient'

export interface MusicBeatAndPhraseMap {
  mapId: string
  candidateArtifactId: string
  candidateHash: string
  timelineHash: string
  timelineRate: TimelineRate
  measuredTempoBpm: number | null
  beatFrames: number[]
  downbeatFrames: number[]
  phraseBoundaryFrames: number[]
  sectionBoundaryFrames: number[]
  sourceSampleRate: number
  evidenceLevel: 'measured_limited'
  mapHash: string
}

export interface MusicEditorialPlan {
  planId: string
  cueId: string
  syncIntent: MusicSyncIntent
  sourceArtifactId: string
  sourceStartSample: number
  sourceEndSampleExclusive: number
  targetRange: MusicFrameRange
  enterAtPhraseBoundary: boolean
  skipIntro: boolean
  loop: boolean
  repeatMotif: boolean
  preserveOriginalEnding: boolean
  timeStretchRatio: number
  timeStretchAcceptable: boolean
  requiresDifferentCue: boolean
  sourceSectionDecision: 'full_track_start' | 'skip_intro_phrase' | 'preserve_outro_ending' | 'best_available_section'
  endingPolicy: 'preserve_original' | 'editorial_fade' | 'loop_crossfade' | 'reject_candidate'
  loopPolicy: 'not_required' | 'measured_loop_allowed' | 'loop_rejected'
  rejectionReasons: string[]
  silenceRanges: MusicFrameRange[]
  technicalOperations: string[]
  planHash: string
}

export interface MusicPlacementManifest {
  placementId: string
  cueId: string
  sourceArtifactId: string
  sourceArtifactHash: string
  sourceStartSample: number
  sourceEndSampleExclusive: number
  targetStartFrame: number
  targetEndFrameExclusive: number
  timelineHash: string
  timelineRate: TimelineRate
  syncAnchorFrames: number[]
  anchorResiduals: Array<{ targetFrame: number; sourceBoundaryFrame: number | null; residualFrames: number }>
  residualAlignmentFrames: number
  syncConfidence: number
  needsReviewFindings: string[]
  noVisualTimingMutation: true
  placementHash: string
}

export interface MusicAnchorAlignmentDecision {
  decisionId: string
  cueId: string
  sourceArtifactId: string
  sourceArtifactHash: string
  syncIntent: MusicSyncIntent
  targetAnchorFrames: number[]
  sourceBoundaryFrames: number[]
  sourceSectionBoundaryFrames: number[]
  allowedTargetEntryWindow: { minimumFrame: number; maximumFrame: number }
  evaluatedAlignments: Array<{
    sourceStartFrame: number
    targetStartFrame: number
    sourceEndFrameExclusive: number
    targetEndFrameExclusive: number
    maximumResidualFrames: number
    meanResidualFrames: number
    sectionBoundaryEntry: boolean
    rejectedReasons: string[]
  }>
  selectedSourceStartSample: number
  selectedSourceEndSampleExclusive: number
  selectedTargetStartFrame: number
  selectedTargetEndFrameExclusive: number
  residualAlignmentFrames: number
  sourceSectionDecision: MusicEditorialPlan['sourceSectionDecision']
  entryDecision: 'locked_exact_entry' | 'authorized_handle_shift' | 'intentional_no_snap'
  selectionReason: string
  confidence: number
  reviewRequiredFindings: string[]
  decisionHash: string
}

function hashRecord<T extends Record<string, unknown>>(value: T, key: keyof T): T {
  return { ...value, [key]: hashMusicValue({ ...value, [key]: '' }) }
}

function nearestFrame(target: number, candidates: readonly number[]): number | undefined {
  return [...candidates].sort((left, right) => Math.abs(left - target) - Math.abs(right - target) || left - right)[0]
}

function sourceStartForCue(input: {
  cue: CanonicalMusicCueIntent
  beatMap: MusicBeatAndPhraseMap
  availableFrames: number
  targetDurationFrames: number
}): { sourceStartFrame: number; decision: MusicEditorialPlan['sourceSectionDecision'] } {
  const maximumStart = Math.max(0, input.availableFrames - input.targetDurationFrames)
  const structural = [...new Set([...input.beatMap.sectionBoundaryFrames, ...input.beatMap.phraseBoundaryFrames])]
    .filter((frame) => frame >= 0 && frame <= maximumStart).sort((left, right) => left - right)
  if (input.cue.cueRole === 'outro' && maximumStart > 0) {
    return {
      sourceStartFrame: nearestFrame(maximumStart, structural.filter((frame) => frame <= maximumStart)) ?? maximumStart,
      decision: 'preserve_outro_ending',
    }
  }
  const nonZero = structural.filter((frame) => frame > 0)
  if (nonZero.length > 0 && input.availableFrames >= input.targetDurationFrames + nonZero[0]!) {
    const preferred = input.cue.cueRole === 'montage' || input.cue.cueRole === 'chapter'
      ? nonZero[Math.min(1, nonZero.length - 1)]! : nonZero[0]!
    return { sourceStartFrame: preferred, decision: 'skip_intro_phrase' }
  }
  if (structural.length > 0) return { sourceStartFrame: structural[0]!, decision: 'best_available_section' }
  return { sourceStartFrame: 0, decision: 'full_track_start' }
}

function alignmentBoundaries(intent: MusicSyncIntent, map: MusicBeatAndPhraseMap): number[] {
  if (intent === 'beat_aligned') return [...new Set([...map.downbeatFrames, ...map.beatFrames])].sort((a, b) => a - b)
  if (intent === 'phrase_aligned' || intent === 'transition_aligned' || intent === 'emotion_aligned') {
    return [...new Set([...map.sectionBoundaryFrames, ...map.phraseBoundaryFrames])].sort((a, b) => a - b)
  }
  return []
}

function optimizeAnchorAlignment(input: {
  cue: CanonicalMusicCueIntent
  analysis: MusicCandidateAnalysis
  beatMap: MusicBeatAndPhraseMap
  intent: MusicSyncIntent
  availableFrames: number
}): Omit<MusicAnchorAlignmentDecision, 'decisionId' | 'sourceArtifactId' | 'sourceArtifactHash' |
  'selectedSourceStartSample' | 'selectedSourceEndSampleExclusive' | 'decisionHash'> & { selectedSourceStartFrame: number } {
  const cueStart = input.cue.exactRange.startFrame
  const cueEnd = input.cue.exactRange.endFrameExclusive
  const targetWindow = {
    minimumFrame: cueStart,
    maximumFrame: Math.min(cueEnd - 1, cueStart + input.cue.entryHandleFrames),
  }
  const boundaries = alignmentBoundaries(input.intent, input.beatMap)
  const targetAnchors = [...new Set(input.cue.syncAnchorFrames.filter((frame) => frame >= cueStart && frame < cueEnd))]
    .sort((a, b) => a - b)
  const defaultSection = sourceStartForCue({ cue: input.cue, beatMap: input.beatMap,
    availableFrames: input.availableFrames, targetDurationFrames: cueEnd - cueStart })
  if (['intentionally_off_beat', 'free_time', 'ambient', 'dialogue_aligned'].includes(input.intent) ||
    boundaries.length === 0 || targetAnchors.length === 0) {
    const targetStartFrame = cueStart
    const duration = cueEnd - targetStartFrame
    return {
      cueId: input.cue.cueId, syncIntent: input.intent, targetAnchorFrames: targetAnchors,
      sourceBoundaryFrames: boundaries, sourceSectionBoundaryFrames: input.beatMap.sectionBoundaryFrames,
      allowedTargetEntryWindow: targetWindow,
      evaluatedAlignments: [{ sourceStartFrame: defaultSection.sourceStartFrame, targetStartFrame,
        sourceEndFrameExclusive: Math.min(input.availableFrames, defaultSection.sourceStartFrame + duration),
        targetEndFrameExclusive: cueEnd, maximumResidualFrames: 0, meanResidualFrames: 0,
        sectionBoundaryEntry: input.beatMap.sectionBoundaryFrames.includes(defaultSection.sourceStartFrame), rejectedReasons: [] }],
      selectedSourceStartFrame: defaultSection.sourceStartFrame, selectedTargetStartFrame: targetStartFrame,
      selectedTargetEndFrameExclusive: cueEnd, residualAlignmentFrames: 0,
      sourceSectionDecision: defaultSection.decision,
      entryDecision: input.intent === 'intentionally_off_beat' ? 'intentional_no_snap' : 'locked_exact_entry',
      selectionReason: input.intent === 'intentionally_off_beat'
        ? 'Explicit off-beat intent preserves the approved picture timing and does not snap to Music boundaries.'
        : 'No qualified anchor optimization was required; the bounded editorial section policy was used.',
      confidence: boundaries.length === 0 && !['free_time', 'ambient', 'dialogue_aligned', 'intentionally_off_beat'].includes(input.intent)
        ? 0.4 : 0.8,
      reviewRequiredFindings: boundaries.length === 0 && !['free_time', 'ambient', 'dialogue_aligned', 'intentionally_off_beat'].includes(input.intent)
        ? ['qualified_source_boundaries_missing'] : [],
    }
  }
  const sourceStarts = [...new Set([0, defaultSection.sourceStartFrame, ...boundaries,
    ...input.beatMap.sectionBoundaryFrames])].filter((frame) => frame >= 0 && frame < input.availableFrames)
  const targetStarts = new Set<number>([targetWindow.minimumFrame, targetWindow.maximumFrame])
  for (const sourceBoundary of boundaries) {
    for (const targetAnchor of targetAnchors) {
      const proposed = targetAnchor - sourceBoundary
      if (proposed >= targetWindow.minimumFrame && proposed <= targetWindow.maximumFrame) targetStarts.add(proposed)
    }
  }
  const evaluatedAlignments = [...sourceStarts].flatMap((sourceStartFrame) => [...targetStarts].map((targetStartFrame) => {
    const duration = cueEnd - targetStartFrame
    const sourceEndFrameExclusive = Math.min(input.availableFrames, sourceStartFrame + duration)
    const residuals = targetAnchors.map((targetAnchor) => {
      const expectedSourceFrame = sourceStartFrame + (targetAnchor - targetStartFrame)
      const nearest = nearestFrame(expectedSourceFrame, boundaries)
      return nearest === undefined ? Number.MAX_SAFE_INTEGER : Math.abs(nearest - expectedSourceFrame)
    })
    const rejectedReasons = [
      ...(sourceEndFrameExclusive - sourceStartFrame < duration && input.analysis.loopQuality.score < 0.65
        ? ['source_section_too_short'] : []),
      ...(targetStartFrame < targetWindow.minimumFrame || targetStartFrame > targetWindow.maximumFrame
        ? ['target_entry_outside_authorized_handle'] : []),
    ]
    return {
      sourceStartFrame, targetStartFrame, sourceEndFrameExclusive, targetEndFrameExclusive: cueEnd,
      maximumResidualFrames: Math.max(...residuals),
      meanResidualFrames: Number((residuals.reduce((sum, value) => sum + value, 0) / Math.max(1, residuals.length)).toFixed(6)),
      sectionBoundaryEntry: input.beatMap.sectionBoundaryFrames.includes(sourceStartFrame), rejectedReasons,
    }
  })).sort((left, right) => left.maximumResidualFrames - right.maximumResidualFrames ||
    left.meanResidualFrames - right.meanResidualFrames ||
    Number(right.sectionBoundaryEntry) - Number(left.sectionBoundaryEntry) ||
    Math.abs(left.targetStartFrame - cueStart) - Math.abs(right.targetStartFrame - cueStart) ||
    left.sourceStartFrame - right.sourceStartFrame)
  const selected = evaluatedAlignments.find((alignment) => alignment.rejectedReasons.length === 0) ?? evaluatedAlignments[0]!
  return {
    cueId: input.cue.cueId, syncIntent: input.intent, targetAnchorFrames: targetAnchors,
    sourceBoundaryFrames: boundaries, sourceSectionBoundaryFrames: input.beatMap.sectionBoundaryFrames,
    allowedTargetEntryWindow: targetWindow, evaluatedAlignments,
    selectedSourceStartFrame: selected.sourceStartFrame, selectedTargetStartFrame: selected.targetStartFrame,
    selectedTargetEndFrameExclusive: selected.targetEndFrameExclusive,
    residualAlignmentFrames: selected.maximumResidualFrames,
    sourceSectionDecision: selected.sourceStartFrame === 0 ? 'full_track_start'
      : selected.sectionBoundaryEntry ? 'best_available_section' : defaultSection.decision,
    entryDecision: selected.targetStartFrame === cueStart ? 'locked_exact_entry' : 'authorized_handle_shift',
    selectionReason: 'The minimum-residual qualified source section and bounded target entry were selected across every supplied anchor.',
    confidence: selected.maximumResidualFrames <= 2 ? 0.94 : selected.maximumResidualFrames <= 5 ? 0.78 : 0.55,
    reviewRequiredFindings: [
      ...(selected.rejectedReasons.length > 0 ? selected.rejectedReasons : []),
      ...(selected.maximumResidualFrames > 5 ? ['anchor_residual_exceeds_preferred_tolerance'] : []),
    ],
  }
}

export function buildMusicBeatAndPhraseMap(input: {
  analysis: MusicCandidateAnalysis
  timelineHash: string
  timelineRate: TimelineRate
}): MusicBeatAndPhraseMap {
  const base = {
    mapId: `music.beat-map.${input.analysis.candidateArtifact.artifactId}`,
    candidateArtifactId: input.analysis.candidateArtifact.artifactId,
    candidateHash: input.analysis.candidateArtifact.checksumSha256,
    timelineHash: input.timelineHash,
    timelineRate: input.timelineRate,
    measuredTempoBpm: input.analysis.measuredTempoBpm,
    beatFrames: [...input.analysis.beatFrames],
    downbeatFrames: input.analysis.beatFrames.filter((_, index) => index % 4 === 0),
    phraseBoundaryFrames: [...input.analysis.phraseBoundaryFrames],
    sectionBoundaryFrames: [...input.analysis.sectionBoundaryFrames],
    sourceSampleRate: input.analysis.sampleRate,
    evidenceLevel: 'measured_limited' as const,
    mapHash: '',
  }
  return hashRecord(base, 'mapHash')
}

export function compileMusicSync(input: {
  cue: CanonicalMusicCueIntent
  analysis: MusicCandidateAnalysis
  timelineHash: string
  timelineRate: TimelineRate
  intent?: MusicSyncIntent
}): { beatMap: MusicBeatAndPhraseMap; editorial: MusicEditorialPlan; placement: MusicPlacementManifest;
  alignmentDecision: MusicAnchorAlignmentDecision } {
  const beatMap = buildMusicBeatAndPhraseMap(input)
  const intent = input.intent ?? (input.cue.protectedSpeechRanges.length > 0
    ? 'dialogue_aligned' : input.cue.cueRole === 'silence' ? 'free_time' : 'phrase_aligned')
  const availableSamples = Math.floor(input.analysis.durationSeconds * input.analysis.sampleRate)
  const fullAvailableFrames = samplesToFrames({
    samples: availableSamples, rate: input.timelineRate,
    sampleRate: input.analysis.sampleRate, rounding: 'nearest_half_up',
  })
  const optimized = optimizeAnchorAlignment({ cue: input.cue, analysis: input.analysis, beatMap, intent,
    availableFrames: fullAvailableFrames })
  const sourceStartFrame = optimized.selectedSourceStartFrame
  const selectedTargetDurationFrames = optimized.selectedTargetEndFrameExclusive - optimized.selectedTargetStartFrame
  const sourceStartSample = framesToSamples({
    frames: sourceStartFrame, rate: input.timelineRate,
    sampleRate: input.analysis.sampleRate, rounding: 'nearest_half_up',
  })
  const durationSamples = framesToSamples({
    frames: selectedTargetDurationFrames, rate: input.timelineRate,
    sampleRate: input.analysis.sampleRate, rounding: 'nearest_half_up',
  })
  const sourceEndSampleExclusive = Math.min(availableSamples, sourceStartSample + durationSamples)
  const availableFrames = samplesToFrames({
    samples: Math.max(0, sourceEndSampleExclusive - sourceStartSample), rate: input.timelineRate,
    sampleRate: input.analysis.sampleRate, rounding: 'nearest_half_up',
  })
  const timeStretchRatio = selectedTargetDurationFrames / Math.max(1, availableFrames)
  const loop = availableFrames < selectedTargetDurationFrames && input.analysis.loopQuality.score >= 0.5
  const requiresDifferentCue = availableFrames < selectedTargetDurationFrames && !loop && (timeStretchRatio < 0.8 || timeStretchRatio > 1.25)
  const preserveOriginalEnding = input.cue.cueRole === 'outro' && input.analysis.endingQuality.score >= 0.5 &&
    sourceEndSampleExclusive >= availableSamples - Math.max(1, Math.floor(input.analysis.sampleRate * 0.05))
  const rejectionReasons = [
    ...(requiresDifferentCue ? ['candidate_duration_cannot_be_fitted_safely'] : []),
    ...(input.cue.cueRole === 'outro' && !preserveOriginalEnding && input.analysis.endingQuality.score < 0.25
      ? ['candidate_ending_not_qualified_for_outro'] : []),
  ]
  const editorialBase = {
    planId: `music.editorial.${input.cue.cueId}.${input.analysis.candidateArtifact.artifactId}`,
    cueId: input.cue.cueId,
    syncIntent: intent,
    sourceArtifactId: input.analysis.candidateArtifact.artifactId,
    sourceStartSample,
    sourceEndSampleExclusive,
    targetRange: { ...input.cue.exactRange, startFrame: optimized.selectedTargetStartFrame,
      endFrameExclusive: optimized.selectedTargetEndFrameExclusive },
    enterAtPhraseBoundary: intent === 'phrase_aligned',
    skipIntro: sourceStartFrame > 0,
    loop,
    repeatMotif: input.cue.motifRole === 'return' || input.cue.motifRole === 'develop',
    preserveOriginalEnding,
    timeStretchRatio: Number(timeStretchRatio.toFixed(8)),
    timeStretchAcceptable: timeStretchRatio >= 0.8 && timeStretchRatio <= 1.25,
    requiresDifferentCue: requiresDifferentCue || rejectionReasons.includes('candidate_ending_not_qualified_for_outro'),
    sourceSectionDecision: optimized.sourceSectionDecision,
    endingPolicy: rejectionReasons.length > 0 ? 'reject_candidate' as const
      : preserveOriginalEnding ? 'preserve_original' as const : loop ? 'loop_crossfade' as const : 'editorial_fade' as const,
    loopPolicy: loop ? 'measured_loop_allowed' as const
      : availableFrames < selectedTargetDurationFrames ? 'loop_rejected' as const : 'not_required' as const,
    rejectionReasons,
    silenceRanges: input.cue.intentionalNoMusicRanges,
    technicalOperations: [
      'trim', ...(loop ? ['loop'] : []),
      ...(Math.abs(timeStretchRatio - 1) > 0.005 && timeStretchRatio >= 0.8 && timeStretchRatio <= 1.25 ? ['time_stretch'] : []),
      'fade', 'gain', 'dialogue_ducking', 'stem_rendering', 'technical_qa',
    ],
    planHash: '',
  }
  const editorial = hashRecord(editorialBase, 'planHash')
  const anchorResiduals = input.cue.syncAnchorFrames.map((targetFrame) => {
    const relativeDesired = Math.max(0, targetFrame - optimized.selectedTargetStartFrame)
    const nearest = nearestFrame(sourceStartFrame + relativeDesired, optimized.sourceBoundaryFrames)
    const residualFrames = nearest === undefined || intent === 'intentionally_off_beat' || intent === 'free_time' || intent === 'ambient'
      ? 0 : nearest - (sourceStartFrame + relativeDesired)
    return { targetFrame, sourceBoundaryFrame: nearest ?? null, residualFrames }
  })
  const residual = anchorResiduals.length === 0 ? 0 : Math.max(...anchorResiduals.map((item) => Math.abs(item.residualFrames)))
  const placementBase = {
    placementId: `music.placement.${input.cue.cueId}.${input.analysis.candidateArtifact.artifactId}`,
    cueId: input.cue.cueId,
    sourceArtifactId: input.analysis.candidateArtifact.artifactId,
    sourceArtifactHash: input.analysis.candidateArtifact.checksumSha256,
    sourceStartSample,
    sourceEndSampleExclusive,
    targetStartFrame: optimized.selectedTargetStartFrame,
    targetEndFrameExclusive: optimized.selectedTargetEndFrameExclusive,
    timelineHash: input.timelineHash,
    timelineRate: input.timelineRate,
    syncAnchorFrames: input.cue.syncAnchorFrames,
    anchorResiduals,
    residualAlignmentFrames: residual,
    syncConfidence: requiresDifferentCue ? 0.2
      : anchorResiduals.some((item) => item.sourceBoundaryFrame === null) && ['beat_aligned', 'phrase_aligned', 'transition_aligned'].includes(intent)
        ? 0.45 : residual <= 2 ? 0.92 : residual <= 5 ? 0.75 : 0.55,
    needsReviewFindings: [
      ...(requiresDifferentCue ? ['candidate_duration_cannot_be_fitted_safely'] : []),
      ...(beatMap.measuredTempoBpm === null && ['beat_aligned', 'phrase_aligned', 'transition_aligned'].includes(intent) ? ['tempo_evidence_missing'] : []),
    ],
    noVisualTimingMutation: true as const,
    placementHash: '',
  }
  const placement = hashRecord(placementBase, 'placementHash')
  const alignmentBase = {
    decisionId: `music.anchor-alignment.${input.cue.cueId}.${input.analysis.candidateArtifact.artifactId}`,
    cueId: optimized.cueId, sourceArtifactId: input.analysis.candidateArtifact.artifactId,
    sourceArtifactHash: input.analysis.candidateArtifact.checksumSha256, syncIntent: optimized.syncIntent,
    targetAnchorFrames: optimized.targetAnchorFrames, sourceBoundaryFrames: optimized.sourceBoundaryFrames,
    sourceSectionBoundaryFrames: optimized.sourceSectionBoundaryFrames,
    allowedTargetEntryWindow: optimized.allowedTargetEntryWindow, evaluatedAlignments: optimized.evaluatedAlignments,
    selectedSourceStartSample: sourceStartSample, selectedSourceEndSampleExclusive: sourceEndSampleExclusive,
    selectedTargetStartFrame: optimized.selectedTargetStartFrame,
    selectedTargetEndFrameExclusive: optimized.selectedTargetEndFrameExclusive,
    residualAlignmentFrames: optimized.residualAlignmentFrames,
    sourceSectionDecision: optimized.sourceSectionDecision, entryDecision: optimized.entryDecision,
    selectionReason: optimized.selectionReason, confidence: optimized.confidence,
    reviewRequiredFindings: optimized.reviewRequiredFindings, decisionHash: '',
  }
  const alignmentDecision = hashRecord(alignmentBase, 'decisionHash')
  return { beatMap, editorial, placement, alignmentDecision }
}
