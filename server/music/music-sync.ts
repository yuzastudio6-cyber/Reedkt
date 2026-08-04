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
  residualAlignmentFrames: number
  syncConfidence: number
  needsReviewFindings: string[]
  noVisualTimingMutation: true
  placementHash: string
}

function hashRecord<T extends Record<string, unknown>>(value: T, key: keyof T): T {
  return { ...value, [key]: hashMusicValue({ ...value, [key]: '' }) }
}

function nearestFrame(target: number, candidates: readonly number[]): number | undefined {
  return [...candidates].sort((left, right) => Math.abs(left - target) - Math.abs(right - target) || left - right)[0]
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
}): { beatMap: MusicBeatAndPhraseMap; editorial: MusicEditorialPlan; placement: MusicPlacementManifest } {
  const beatMap = buildMusicBeatAndPhraseMap(input)
  const intent = input.intent ?? (input.cue.protectedSpeechRanges.length > 0
    ? 'dialogue_aligned' : input.cue.cueRole === 'silence' ? 'free_time' : 'phrase_aligned')
  const targetDurationFrames = input.cue.exactRange.endFrameExclusive - input.cue.exactRange.startFrame
  const sourceStartFrame = intent === 'phrase_aligned'
    ? nearestFrame(0, beatMap.phraseBoundaryFrames) ?? 0 : 0
  const sourceStartSample = framesToSamples({
    frames: sourceStartFrame, rate: input.timelineRate,
    sampleRate: input.analysis.sampleRate, rounding: 'nearest_half_up',
  })
  const durationSamples = framesToSamples({
    frames: targetDurationFrames, rate: input.timelineRate,
    sampleRate: input.analysis.sampleRate, rounding: 'nearest_half_up',
  })
  const availableSamples = Math.floor(input.analysis.durationSeconds * input.analysis.sampleRate)
  const sourceEndSampleExclusive = Math.min(availableSamples, sourceStartSample + durationSamples)
  const availableFrames = samplesToFrames({
    samples: Math.max(0, sourceEndSampleExclusive - sourceStartSample), rate: input.timelineRate,
    sampleRate: input.analysis.sampleRate, rounding: 'nearest_half_up',
  })
  const timeStretchRatio = targetDurationFrames / Math.max(1, availableFrames)
  const loop = availableFrames < targetDurationFrames && input.analysis.loopQuality.score >= 0.5
  const requiresDifferentCue = availableFrames < targetDurationFrames && !loop && (timeStretchRatio < 0.8 || timeStretchRatio > 1.25)
  const editorialBase = {
    planId: `music.editorial.${input.cue.cueId}.${input.analysis.candidateArtifact.artifactId}`,
    cueId: input.cue.cueId,
    syncIntent: intent,
    sourceArtifactId: input.analysis.candidateArtifact.artifactId,
    sourceStartSample,
    sourceEndSampleExclusive,
    targetRange: input.cue.exactRange,
    enterAtPhraseBoundary: intent === 'phrase_aligned',
    skipIntro: sourceStartFrame > 0,
    loop,
    repeatMotif: input.cue.motifRole === 'return' || input.cue.motifRole === 'develop',
    preserveOriginalEnding: input.cue.cueRole === 'outro' && input.analysis.endingQuality.score >= 0.5,
    timeStretchRatio: Number(timeStretchRatio.toFixed(8)),
    timeStretchAcceptable: timeStretchRatio >= 0.8 && timeStretchRatio <= 1.25,
    requiresDifferentCue,
    silenceRanges: input.cue.intentionalNoMusicRanges,
    technicalOperations: [
      'trim', ...(loop ? ['loop'] : []),
      ...(Math.abs(timeStretchRatio - 1) > 0.005 && timeStretchRatio >= 0.8 && timeStretchRatio <= 1.25 ? ['time_stretch'] : []),
      'fade', 'gain', 'dialogue_ducking', 'stem_rendering', 'technical_qa',
    ],
    planHash: '',
  }
  const editorial = hashRecord(editorialBase, 'planHash')
  const anchorCandidates = intent === 'beat_aligned' ? beatMap.beatFrames
    : intent === 'phrase_aligned' || intent === 'transition_aligned' ? beatMap.phraseBoundaryFrames : []
  const desiredAnchor = input.cue.syncAnchorFrames[0] ?? input.cue.exactRange.startFrame
  const relativeDesired = Math.max(0, desiredAnchor - input.cue.exactRange.startFrame)
  const nearest = nearestFrame(relativeDesired, anchorCandidates)
  const residual = nearest === undefined || intent === 'intentionally_off_beat' || intent === 'free_time' || intent === 'ambient'
    ? 0 : nearest - relativeDesired
  const placementBase = {
    placementId: `music.placement.${input.cue.cueId}.${input.analysis.candidateArtifact.artifactId}`,
    cueId: input.cue.cueId,
    sourceArtifactId: input.analysis.candidateArtifact.artifactId,
    sourceArtifactHash: input.analysis.candidateArtifact.checksumSha256,
    sourceStartSample,
    sourceEndSampleExclusive,
    targetStartFrame: input.cue.exactRange.startFrame,
    targetEndFrameExclusive: input.cue.exactRange.endFrameExclusive,
    timelineHash: input.timelineHash,
    timelineRate: input.timelineRate,
    syncAnchorFrames: input.cue.syncAnchorFrames,
    residualAlignmentFrames: residual,
    syncConfidence: requiresDifferentCue ? 0.2 : nearest === undefined && ['beat_aligned', 'phrase_aligned', 'transition_aligned'].includes(intent) ? 0.45 : 0.9,
    needsReviewFindings: [
      ...(requiresDifferentCue ? ['candidate_duration_cannot_be_fitted_safely'] : []),
      ...(beatMap.measuredTempoBpm === null && ['beat_aligned', 'phrase_aligned', 'transition_aligned'].includes(intent) ? ['tempo_evidence_missing'] : []),
    ],
    noVisualTimingMutation: true as const,
    placementHash: '',
  }
  const placement = hashRecord(placementBase, 'placementHash')
  return { beatMap, editorial, placement }
}
