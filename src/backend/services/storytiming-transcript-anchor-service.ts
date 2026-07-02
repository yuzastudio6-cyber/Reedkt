import type { PacingAnalysisRecord } from '../../types/edit-quality'
import type { EditPlanSegmentRecord } from '../../types/planning'
import type {
  MasterTimingMapRecord,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TranscriptAnchorGranularity,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { createPausePreservationAnchors } from './storytiming-pause-preservation-service'

const splitSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

const splitPhrase = (sentence: string): string[] => {
  const commaParts = sentence.split(/,\s+/).map((part) => part.trim()).filter(Boolean)
  if (commaParts.length > 1) {
    return commaParts
  }

  const words = sentence.split(/\s+/).filter(Boolean)
  if (words.length <= 7) {
    return [sentence]
  }

  const midpoint = Math.ceil(words.length / 2)
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')]
}

const emphasisCandidates = (text: string): string[] =>
  text
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length >= 7)
    .slice(0, 3)

const createTranscriptAnchor = (input: {
  masterTimingMap: MasterTimingMapRecord
  segment?: StoryTimingSegmentRecord
  sourceRecordId?: string
  granularity: TranscriptAnchorGranularity
  label: string
  text?: string
  startSeconds: number
  endSeconds?: number
  locked?: boolean
}): TimingAnchorRecord => ({
  id: createMockId('transcript-anchor'),
  masterTimingMapId: input.masterTimingMap.id,
  projectId: input.masterTimingMap.projectId,
  editPlanId: input.masterTimingMap.editPlanId,
  segmentId: input.segment?.id,
  sourceSystem: 'edit_plan',
  sourceRecordId: input.sourceRecordId,
  sourceRef: {
    sourceSystem: 'edit_plan',
    sourceRecordId: input.sourceRecordId,
    sourceTableName: 'edit_plan_segments',
    label: input.label,
  },
  anchorType: input.granularity,
  anchorLabel: input.label,
  anchorText: input.text,
  timeSeconds: input.startSeconds,
  endTimeSeconds: input.endSeconds,
  frameNumber: Math.round(input.startSeconds * input.masterTimingMap.frameRate),
  importance: input.granularity === 'word' ? 'medium' : 'high',
  primaryAuthority: input.granularity === 'pause' || input.granularity === 'breath' ? 'emotional_timing' : 'speech_meaning',
  syncMode: input.granularity === 'word' ? 'word_locked' : input.granularity === 'phrase' ? 'phrase_locked' : 'speech_locked',
  locked: input.locked ?? false,
  notes: ['Mock inferred transcript timing anchor; no real word alignment has run.'],
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: {
    mockInferred: true,
    granularity: input.granularity,
  },
})

export function inferTranscriptAnchorsFromSegmentText(
  masterTimingMap: MasterTimingMapRecord,
  segment: StoryTimingSegmentRecord,
  editPlanSegment: EditPlanSegmentRecord,
): TimingAnchorRecord[] {
  const text = editPlanSegment.transcriptText?.trim()
  if (!text) {
    return []
  }

  const duration = segment.outputTimeRange.endSeconds - segment.outputTimeRange.startSeconds
  const sentences = splitSentences(text)
  const sentenceDuration = duration / Math.max(1, sentences.length)
  const sentenceAnchors = sentences.map((sentence, index) => {
    const start = segment.outputTimeRange.startSeconds + sentenceDuration * index
    return createTranscriptAnchor({
      masterTimingMap,
      segment,
      sourceRecordId: editPlanSegment.id,
      granularity: 'sentence',
      label: `Sentence ${index + 1}`,
      text: sentence,
      startSeconds: start,
      endSeconds: Math.min(segment.outputTimeRange.endSeconds, start + sentenceDuration),
    })
  })

  const phraseAnchors = sentences.flatMap((sentence, sentenceIndex) => {
    const phrases = splitPhrase(sentence)
    const sentenceStart = segment.outputTimeRange.startSeconds + sentenceDuration * sentenceIndex
    const phraseDuration = sentenceDuration / Math.max(1, phrases.length)

    return phrases.map((phrase, phraseIndex) =>
      createTranscriptAnchor({
        masterTimingMap,
        segment,
        sourceRecordId: editPlanSegment.id,
        granularity: 'phrase',
        label: `Phrase ${sentenceIndex + 1}.${phraseIndex + 1}`,
        text: phrase,
        startSeconds: sentenceStart + phraseDuration * phraseIndex,
        endSeconds: Math.min(segment.outputTimeRange.endSeconds, sentenceStart + phraseDuration * (phraseIndex + 1)),
      }),
    )
  })

  const wordAnchors = emphasisCandidates(text).map((word, index) => {
    const start = segment.outputTimeRange.startSeconds + Math.min(duration - 0.1, duration * ((index + 1) / 4))
    return createTranscriptAnchor({
      masterTimingMap,
      segment,
      sourceRecordId: editPlanSegment.id,
      granularity: 'word',
      label: `Emphasis word: ${word}`,
      text: word,
      startSeconds: start,
      endSeconds: Math.min(segment.outputTimeRange.endSeconds, start + 0.35),
    })
  })

  return [...sentenceAnchors, ...phraseAnchors, ...wordAnchors]
}

export function createSentenceTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  editPlanSegments: EditPlanSegmentRecord[],
): TimingAnchorRecord[] {
  return segments.flatMap((segment) => {
    const editPlanSegment = editPlanSegments.find((candidate) => candidate.id === segment.editPlanSegmentId)
    return editPlanSegment
      ? inferTranscriptAnchorsFromSegmentText(masterTimingMap, segment, editPlanSegment).filter((anchor) => anchor.anchorType === 'sentence')
      : []
  })
}

export function createPhraseTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  editPlanSegments: EditPlanSegmentRecord[],
): TimingAnchorRecord[] {
  return segments.flatMap((segment) => {
    const editPlanSegment = editPlanSegments.find((candidate) => candidate.id === segment.editPlanSegmentId)
    return editPlanSegment
      ? inferTranscriptAnchorsFromSegmentText(masterTimingMap, segment, editPlanSegment).filter((anchor) => anchor.anchorType === 'phrase')
      : []
  })
}

export function createWordTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  editPlanSegments: EditPlanSegmentRecord[],
): TimingAnchorRecord[] {
  return segments.flatMap((segment) => {
    const editPlanSegment = editPlanSegments.find((candidate) => candidate.id === segment.editPlanSegmentId)
    return editPlanSegment
      ? inferTranscriptAnchorsFromSegmentText(masterTimingMap, segment, editPlanSegment).filter((anchor) => anchor.anchorType === 'word')
      : []
  })
}

export function createPauseTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  pacingAnalysis: PacingAnalysisRecord[] = [],
): TimingAnchorRecord[] {
  return createPausePreservationAnchors(masterTimingMap, pacingAnalysis).filter((anchor) => anchor.anchorType === 'pause')
}

export function createBreathTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  pacingAnalysis: PacingAnalysisRecord[] = [],
): TimingAnchorRecord[] {
  return createPausePreservationAnchors(masterTimingMap, pacingAnalysis).filter((anchor) => anchor.anchorType === 'breath')
}

export function createTranscriptTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  editPlanSegments: EditPlanSegmentRecord[],
  pacingAnalysis: PacingAnalysisRecord[] = [],
): ServiceResult<{ transcriptAnchors: TimingAnchorRecord[]; warnings: string[] }> {
  const anchors = [
    ...segments.flatMap((segment) => {
      const editPlanSegment = editPlanSegments.find((candidate) => candidate.id === segment.editPlanSegmentId)
      return editPlanSegment ? inferTranscriptAnchorsFromSegmentText(masterTimingMap, segment, editPlanSegment) : []
    }),
    ...createPausePreservationAnchors(masterTimingMap, pacingAnalysis),
  ]
  const warnings = anchors.length === 0
    ? ['No transcript text or pause analysis was available for mock transcript anchors.']
    : ['Transcript anchors are mock inferred; no real transcription alignment has run.']

  return ok({ transcriptAnchors: anchors, warnings }, warnings)
}

export function createTranscriptAnchorSummary(transcriptAnchors: TimingAnchorRecord[]): string {
  const phrases = transcriptAnchors.filter((anchor) => anchor.anchorType === 'phrase').length
  const words = transcriptAnchors.filter((anchor) => anchor.anchorType === 'word').length
  const pauses = transcriptAnchors.filter((anchor) => anchor.anchorType === 'pause' || anchor.anchorType === 'breath').length

  return `${transcriptAnchors.length} mock transcript anchor(s): ${phrases} phrase, ${words} emphasis word, ${pauses} pause/breath.`
}
