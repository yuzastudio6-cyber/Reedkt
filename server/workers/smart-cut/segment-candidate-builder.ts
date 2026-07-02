import type { ProductionTimeRange } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  SegmentCandidate,
  SmartCutFoundationInput,
} from './smart-cut-worker-types'

export function buildSegmentCandidates(input: SmartCutFoundationInput): SegmentCandidate[] {
  const transcriptCandidates = buildTranscriptCandidates(input)
  const silenceCandidates = (input.silenceSegments ?? input.mediaAnalysisReport?.audioAnalysis.silenceSegments ?? [])
    .map((range, index) => buildCandidate({
      candidateId: `silence-${index + 1}`,
      candidateType: 'silence',
      source: 'silence',
      range,
      text: 'Silent/dead-space region',
      reason: 'Silence signal from media analysis can inform dead-space cleanup.',
      hasSilence: true,
    }))
  const sceneCandidates = (input.sceneBoundaries ?? input.mediaAnalysisReport?.sceneAnalysis.boundaries ?? [])
    .map((range, index) => buildCandidate({
      candidateId: `scene-${index + 1}`,
      candidateType: 'scene',
      source: 'scene',
      range,
      text: range.reason,
      reason: 'Scene boundary signal can inform visual cut safety.',
      hasSceneBoundary: true,
    }))
  const captionCandidates = (input.captionSegments ?? [])
    .map((caption, index) => buildCandidate({
      candidateId: `caption-${caption.captionId || index + 1}`,
      candidateType: 'caption',
      source: 'caption',
      range: caption,
      text: caption.text,
      captionIds: [caption.captionId],
      wordCount: caption.words.length,
      reason: 'Caption timing can help align edit decisions to readable speech chunks.',
      hasCaption: true,
      hasWordTimestamps: caption.words.length > 0,
    }))
  const semanticCandidates = buildSemanticMergeCandidates(transcriptCandidates)
  const all = [
    ...transcriptCandidates,
    ...silenceCandidates,
    ...sceneCandidates,
    ...captionCandidates,
    ...semanticCandidates,
  ].sort((a, b) => a.startSeconds - b.startSeconds || a.endSeconds - b.endSeconds)

  if (all.length > 0) return dedupeCandidates(all)

  const duration = input.mediaDurationSeconds ?? input.mediaAnalysisReport?.metadata.durationSeconds ?? 0
  return [buildCandidate({
    candidateId: 'fallback-full-duration',
    candidateType: 'fallback',
    source: 'fallback',
    range: { startSeconds: 0, endSeconds: Math.max(duration, 1) },
    text: 'No transcript evidence available.',
    reason: 'Fallback candidate preserves the complete media duration until analysis evidence exists.',
  })]
}

function buildTranscriptCandidates(input: SmartCutFoundationInput): SegmentCandidate[] {
  return (input.transcriptSegments ?? []).map((segment) => {
    const fillerLabels = (input.fillerSegments ?? input.mediaAnalysisReport?.speechAnalysis.fillerSegments ?? [])
      .filter((filler) => rangesOverlap(segment, filler))
      .map((filler) => filler.label)
    const repeatedIds = (input.repeatedTakeCandidates ?? input.mediaAnalysisReport?.speechAnalysis.repeatedTakeCandidates ?? [])
      .filter((candidate) => candidate.ranges.some((range) => rangesOverlap(segment, range)))
      .map((candidate) => candidate.candidateId)
    const captionIds = (input.captionSegments ?? [])
      .filter((caption) => rangesOverlap(segment, caption))
      .map((caption) => caption.captionId)

    return buildCandidate({
      candidateId: `transcript-${segment.segmentId}`,
      candidateType: 'transcript',
      source: 'transcript',
      range: segment,
      text: segment.text,
      transcriptSegmentIds: [segment.segmentId],
      captionIds,
      wordCount: segment.words.length,
      fillerLabels,
      repeatedTakeCandidateIds: repeatedIds,
      reason: 'Transcript segment provides speech and timing evidence for edit decisions.',
      hasTranscript: true,
      hasWordTimestamps: segment.words.length > 0,
      hasCaption: captionIds.length > 0,
    })
  })
}

function buildSemanticMergeCandidates(candidates: SegmentCandidate[]): SegmentCandidate[] {
  const merged: SegmentCandidate[] = []
  for (let index = 0; index < candidates.length - 1; index += 2) {
    const current = candidates[index]
    const next = candidates[index + 1]
    if (!current || !next) continue
    if (next.endSeconds - current.startSeconds > 8) continue
    merged.push({
      ...current,
      candidateId: `semantic-${current.candidateId}-${next.candidateId}`,
      candidateType: 'semantic_merge',
      endSeconds: next.endSeconds,
      text: [current.text, next.text].filter(Boolean).join(' '),
      transcriptSegmentIds: [...current.transcriptSegmentIds, ...next.transcriptSegmentIds],
      captionIds: [...current.captionIds, ...next.captionIds],
      wordCount: current.wordCount + next.wordCount,
      evidence: {
        ...current.evidence,
        fillerLabels: [...current.evidence.fillerLabels, ...next.evidence.fillerLabels],
        repeatedTakeCandidateIds: [
          ...current.evidence.repeatedTakeCandidateIds,
          ...next.evidence.repeatedTakeCandidateIds,
        ],
      },
      protected: current.protected || next.protected,
      reason: 'Merged semantic segment preserves local context across adjacent transcript chunks.',
    })
  }
  return merged
}

function buildCandidate(input: {
  candidateId: string
  candidateType: SegmentCandidate['candidateType']
  source: SegmentCandidate['source']
  range: ProductionTimeRange
  text?: string
  transcriptSegmentIds?: string[]
  captionIds?: string[]
  wordCount?: number
  fillerLabels?: string[]
  repeatedTakeCandidateIds?: string[]
  reason: string
  hasTranscript?: boolean
  hasWordTimestamps?: boolean
  hasSilence?: boolean
  hasSceneBoundary?: boolean
  hasCaption?: boolean
}): SegmentCandidate {
  return {
    candidateId: input.candidateId,
    candidateType: input.candidateType,
    source: input.source,
    startSeconds: round(input.range.startSeconds),
    endSeconds: round(input.range.endSeconds),
    text: input.text,
    transcriptSegmentIds: input.transcriptSegmentIds ?? [],
    captionIds: input.captionIds ?? [],
    wordCount: input.wordCount ?? countWords(input.text),
    evidence: {
      hasTranscript: input.hasTranscript ?? false,
      hasWordTimestamps: input.hasWordTimestamps ?? false,
      hasSilence: input.hasSilence ?? false,
      hasSceneBoundary: input.hasSceneBoundary ?? false,
      hasCaption: input.hasCaption ?? false,
      fillerLabels: input.fillerLabels ?? [],
      repeatedTakeCandidateIds: input.repeatedTakeCandidateIds ?? [],
    },
    risks: ['none'],
    protected: false,
    reason: input.reason,
  }
}

function dedupeCandidates(candidates: SegmentCandidate[]): SegmentCandidate[] {
  const seen = new Set<string>()
  return candidates.filter((candidate) => {
    const key = `${candidate.candidateType}:${candidate.startSeconds.toFixed(2)}:${candidate.endSeconds.toFixed(2)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function rangesOverlap(a: ProductionTimeRange, b: ProductionTimeRange): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds
}

function countWords(text?: string): number {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
