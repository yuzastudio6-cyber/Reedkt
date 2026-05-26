import type { SegmentRemoveDecision, SegmentCandidate, MeaningPreservationFinding, PacingProfile } from './smart-cut-worker-types'

export function evaluateMeaningPreservation(input: {
  candidates: SegmentCandidate[]
  proposedRemovals: SegmentRemoveDecision[]
  pacingProfile: PacingProfile
}): MeaningPreservationFinding[] {
  const findings: MeaningPreservationFinding[] = []

  for (const removal of input.proposedRemovals) {
    const candidate = input.candidates.find((item) => item.candidateId === removal.candidateId)
    const text = candidate?.text?.toLowerCase() ?? ''

    if (removal.startSeconds < 6 || /\b(because|therefore|important|key|proof|claim|context|so)\b/.test(text)) {
      findings.push({
        findingId: `meaning-${removal.decisionId}`,
        severity: 'warning',
        range: { startSeconds: removal.startSeconds, endSeconds: removal.endSeconds },
        code: 'possible_context_loss',
        message: 'Removal may affect hook/setup/proof/context and needs review before real cutting.',
      })
    }

    if (removal.risks.includes('emotional_pause') && input.pacingProfile.emotionalPausePolicy === 'protect') {
      findings.push({
        findingId: `emotion-${removal.decisionId}`,
        severity: 'warning',
        range: { startSeconds: removal.startSeconds, endSeconds: removal.endSeconds },
        code: 'emotional_pause_protected',
        message: 'Possible emotional/natural pause should be preserved unless approved intent asks for aggressive cleanup.',
      })
    }
  }

  if (input.proposedRemovals.length === input.candidates.length && input.candidates.length > 0) {
    findings.push({
      findingId: 'meaning-all-segments-risk',
      severity: 'blocking',
      range: {
        startSeconds: input.candidates[0]?.startSeconds ?? 0,
        endSeconds: input.candidates.at(-1)?.endSeconds ?? 0,
      },
      code: 'all_content_removed',
      message: 'Smart cut plan must not remove all content.',
    })
  }

  return findings
}
