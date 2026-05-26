import type { PacingProfile, SegmentCandidate, SegmentScore } from './smart-cut-worker-types'

export function scoreSegmentCandidates(candidates: SegmentCandidate[], profile: PacingProfile): SegmentScore[] {
  return candidates.map((candidate) => scoreSegmentCandidate(candidate, profile))
}

export function scoreSegmentCandidate(candidate: SegmentCandidate, profile: PacingProfile): SegmentScore {
  const duration = Math.max(0.001, candidate.endSeconds - candidate.startSeconds)
  const speechDensityScore = clamp(candidate.wordCount / Math.max(duration * 2.5, 1))
  const silencePenalty = candidate.evidence.hasSilence ? clamp(duration / Math.max(profile.maxSilenceSeconds, 0.1)) : 0
  const fillerPenalty = clamp(candidate.evidence.fillerLabels.length * 0.18)
  const repeatedTakePenalty = clamp(candidate.evidence.repeatedTakeCandidateIds.length * 0.28)
  const hookScore = candidate.startSeconds < 8 ? 0.25 : 0
  const pacingScore = duration < profile.minSegmentDurationSeconds ? 0.4 : 0.82
  const visualRiskScore = candidate.evidence.hasSceneBoundary ? 0.12 : 0.25
  const meaningRiskScore = candidate.protected || candidate.candidateType === 'semantic_merge' ? 0.1 : candidate.wordCount >= 8 ? 0.18 : 0.28
  const removeScore = clamp(
    silencePenalty * 0.48 +
    fillerPenalty +
    repeatedTakePenalty +
    (candidate.candidateType === 'fallback' ? -0.35 : 0) -
    hookScore -
    meaningRiskScore * 0.35,
  )
  const keepScore = clamp(
    speechDensityScore * 0.46 +
    hookScore +
    pacingScore * 0.24 +
    (candidate.evidence.hasTranscript ? 0.12 : 0) -
    removeScore * 0.28,
  )
  const confidence = clamp(
    0.45 +
    (candidate.evidence.hasTranscript ? 0.18 : 0) +
    (candidate.evidence.hasWordTimestamps ? 0.14 : 0) +
    (candidate.evidence.hasSilence ? 0.08 : 0) +
    (candidate.evidence.hasSceneBoundary ? 0.06 : 0) -
    (candidate.candidateType === 'fallback' ? 0.2 : 0),
  )

  return {
    candidateId: candidate.candidateId,
    speechDensityScore: round(speechDensityScore),
    silencePenalty: round(silencePenalty),
    fillerPenalty: round(fillerPenalty),
    repeatedTakePenalty: round(repeatedTakePenalty),
    hookScore: round(hookScore),
    pacingScore: round(pacingScore),
    visualRiskScore: round(visualRiskScore),
    meaningRiskScore: round(meaningRiskScore),
    keepScore: round(keepScore),
    removeScore: round(removeScore),
    confidence: round(confidence),
    warnings: buildWarnings(candidate),
  }
}

function buildWarnings(candidate: SegmentCandidate): string[] {
  const warnings: string[] = []
  if (!candidate.evidence.hasTranscript) warnings.push(`${candidate.candidateId} has no transcript evidence.`)
  if (!candidate.evidence.hasWordTimestamps && candidate.candidateType !== 'silence') warnings.push(`${candidate.candidateId} has no word timestamp evidence.`)
  if (candidate.candidateType === 'fallback') warnings.push('Fallback full-duration candidate prevents accidental cuts without evidence.')
  return warnings
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
