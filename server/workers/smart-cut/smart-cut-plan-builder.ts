import { evaluateMeaningPreservation } from './meaning-preservation-policy'
import { resolvePacingProfile } from './pacing-policy'
import { planFillerCuts } from './filler-cut-planner'
import { planRepeatedTakeSelection } from './repeated-take-selection-planner'
import { planSilenceDeadspace } from './silence-deadspace-planner'
import { buildSegmentCandidates } from './segment-candidate-builder'
import { scoreSegmentCandidates } from './segment-score-engine'
import { evaluateSceneCutSafety } from './scene-cut-safety-policy'
import { evaluateSpeechCutBoundary } from './speech-cut-boundary-policy'
import type {
  CutBoundary,
  SegmentKeepDecision,
  SegmentRemoveDecision,
  SmartCutFoundationInput,
  SmartCutPlan,
} from './smart-cut-worker-types'

export function buildSmartCutPlan(input: SmartCutFoundationInput): SmartCutPlan {
  const sourceDurationSeconds = input.mediaDurationSeconds ??
    input.mediaAnalysisReport?.metadata.durationSeconds ??
    durationFromTranscript(input)
  const aggressiveness = input.aggressiveness ?? 'balanced'
  const pacingProfile = resolvePacingProfile({
    profileId: input.pacingProfileId,
    aggressiveness,
    custom: input.customPacingProfile,
  })
  const candidates = buildSegmentCandidates({
    ...input,
    mediaDurationSeconds: sourceDurationSeconds,
  })
  const scores = scoreSegmentCandidates(candidates, pacingProfile)
  const silencePlanner = planSilenceDeadspace({
    silenceSegments: input.silenceSegments ?? input.mediaAnalysisReport?.audioAnalysis.silenceSegments ?? [],
    pacingProfile,
  })
  const fillerPlanner = planFillerCuts({
    fillerSegments: input.fillerSegments ?? input.mediaAnalysisReport?.speechAnalysis.fillerSegments ?? [],
    wordTimestamps: input.wordTimestamps ?? input.transcriptSegments?.flatMap((segment) => segment.words) ?? [],
  })
  const repeatedPlanner = planRepeatedTakeSelection({
    repeatedTakeCandidates: input.repeatedTakeCandidates ?? input.mediaAnalysisReport?.speechAnalysis.repeatedTakeCandidates ?? [],
    transcriptSegments: input.transcriptSegments ?? [],
    fillerSegments: input.fillerSegments ?? input.mediaAnalysisReport?.speechAnalysis.fillerSegments ?? [],
  })

  const proposedRemove = dedupeRemoveDecisions([
    ...silencePlanner.removeSegments,
    ...fillerPlanner.removeSegments,
    ...repeatedPlanner.removeSegments,
  ])
  const candidateKeep = candidates
    .filter((candidate) => !proposedRemove.some((remove) => rangesOverlap(remove, candidate)))
    .filter((candidate) => candidate.candidateType !== 'silence')
    .map((candidate): SegmentKeepDecision => {
      const score = scores.find((item) => item.candidateId === candidate.candidateId)
      return {
        decisionId: `keep-${candidate.candidateId}`,
        candidateId: candidate.candidateId,
        startSeconds: candidate.startSeconds,
        endSeconds: candidate.endSeconds,
        score: score?.keepScore ?? 0.6,
        confidence: score?.confidence ?? 0.6,
        reason: candidate.reason,
        protected: candidate.startSeconds < 6 || candidate.protected,
      }
    })
  const protectedSegments = dedupeKeepDecisions([
    ...candidateKeep.filter((keep) => keep.protected),
    ...silencePlanner.protectedSegments,
    ...repeatedPlanner.keepSegments,
  ])
  const meaningFindings = evaluateMeaningPreservation({
    candidates,
    proposedRemovals: proposedRemove,
    pacingProfile,
  })
  const blockedRanges = meaningFindings
    .filter((finding) => finding.severity === 'blocking')
    .map((finding) => finding.range)
  const removeSegments = proposedRemove.filter((remove) => !blockedRanges.some((range) => rangesOverlap(remove, range)))
  const cutBoundaries = buildCutBoundaries(removeSegments, input)
  const targetDurationSeconds = Math.max(0, sourceDurationSeconds - removeSegments.reduce((sum, remove) => sum + (remove.endSeconds - remove.startSeconds), 0))

  return {
    id: `smart-cut-plan-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    sourceDurationSeconds,
    targetDurationSeconds: round(targetDurationSeconds),
    intent: input.intent ?? ['remove_dead_space', 'remove_fillers', 'remove_repeated_takes', 'preserve_story'],
    aggressiveness,
    pacingProfile,
    segmentCandidates: candidates,
    segmentScores: scores,
    keepSegments: dedupeKeepDecisions(candidateKeep),
    removeSegments,
    cutBoundaries,
    protectedSegments,
    rejectedCandidates: [
      ...silencePlanner.rejectedCandidates,
      ...fillerPlanner.rejectedCandidates,
    ],
    meaningFindings,
    warnings: [
      ...scores.flatMap((score) => score.warnings),
      ...silencePlanner.warnings,
      ...repeatedPlanner.warnings,
      ...meaningFindings.map((finding) => finding.message),
      ...cutBoundaries.flatMap((boundary) => boundary.risks.filter((risk) => risk !== 'none').map((risk) => `${boundary.boundaryId}: ${risk}`)),
    ],
    confidence: average(scores.map((score) => score.confidence)),
    qaChecks: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
    requiredQualityGates: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
  }
}

function buildCutBoundaries(removeSegments: SegmentRemoveDecision[], input: SmartCutFoundationInput): CutBoundary[] {
  const words = input.wordTimestamps ?? input.transcriptSegments?.flatMap((segment) => segment.words) ?? []
  const sceneBoundaries = input.sceneBoundaries ?? input.mediaAnalysisReport?.sceneAnalysis.boundaries ?? []
  const aggressiveIntent = input.aggressiveness === 'aggressive' || input.intent?.includes('social_fast_cut') === true
  return removeSegments.flatMap((remove) => [remove.startSeconds, remove.endSeconds].map((timeSeconds, index) => {
    const speech = evaluateSpeechCutBoundary({
      boundaryId: `boundary-${remove.decisionId}-${index + 1}`,
      timeSeconds,
      words,
      aggressiveIntent,
    })
    const scene = evaluateSceneCutSafety({
      cutTimeSeconds: speech.adjustedTimeSeconds,
      sceneBoundaries,
      allowJumpCut: aggressiveIntent,
    })
    return {
      ...speech,
      risks: uniqueRisks([...speech.risks, ...scene.risks]),
      safe: speech.safe && scene.safe,
      reason: [speech.reason, ...scene.warnings].filter(Boolean).join(' '),
    }
  }))
}

function durationFromTranscript(input: SmartCutFoundationInput): number {
  const transcriptEnd = input.transcriptSegments?.at(-1)?.endSeconds
  const wordEnd = input.wordTimestamps?.at(-1)?.endSeconds
  return Math.max(transcriptEnd ?? 0, wordEnd ?? 0, 1)
}

function dedupeRemoveDecisions(decisions: SegmentRemoveDecision[]): SegmentRemoveDecision[] {
  const seen = new Set<string>()
  return decisions.filter((decision) => {
    const key = `${decision.startSeconds.toFixed(2)}:${decision.endSeconds.toFixed(2)}:${decision.reason}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function dedupeKeepDecisions(decisions: SegmentKeepDecision[]): SegmentKeepDecision[] {
  const seen = new Set<string>()
  return decisions.filter((decision) => {
    const key = `${decision.startSeconds.toFixed(2)}:${decision.endSeconds.toFixed(2)}:${decision.candidateId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function rangesOverlap(a: { startSeconds: number; endSeconds: number }, b: { startSeconds: number; endSeconds: number }): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds
}

function uniqueRisks<T extends string>(risks: T[]): T[] {
  const filtered = risks.filter((risk) => risk !== 'none')
  return filtered.length > 0 ? [...new Set(filtered)] : ['none' as T]
}

function average(values: number[]): number {
  if (values.length === 0) return 0.5
  return round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
