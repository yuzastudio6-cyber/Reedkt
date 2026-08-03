import type { BrollSourceCandidate } from '../b-roll-contracts'

export interface RankedBrollSourceCandidate {
  candidate: BrollSourceCandidate
  score: number
  eligible: boolean
  rejectionReasons: readonly string[]
}

function clamp(value: number): number { return Math.max(0, Math.min(100, value)) }

export function scoreBrollSourceCandidate(candidate: BrollSourceCandidate): RankedBrollSourceCandidate {
  const rejectionReasons: string[] = []
  if (!candidate.provenanceVerified) rejectionReasons.push('provenance_unverified')
  if (!candidate.rightsApproved) rejectionReasons.push('rights_not_approved')
  if (!candidate.privacyApproved) rejectionReasons.push('privacy_not_approved')
  if (!candidate.proofSafe) rejectionReasons.push('proof_unsafe')
  if (candidate.sourceType === 'approved_user_asset' && !candidate.approvedByUser) {
    rejectionReasons.push('user_asset_not_approved')
  }
  const score = clamp(
    candidate.semanticRelevance * 22 + candidate.visualQuality * 12 +
    candidate.temporalFit * 10 + candidate.storyContinuity * 10 +
    Number(candidate.provenanceVerified) * 8 + Number(candidate.rightsApproved) * 8 +
    Number(candidate.privacyApproved) * 6 + Number(candidate.proofSafe) * 8 +
    candidate.cropFeasibility * 6 + candidate.speakerActionProtection * 5 +
    candidate.audioUsefulness * 2 - candidate.repetitionRisk * 10 -
    Math.min(candidate.costCredits, 20) * 0.5,
  )
  return { candidate, score, eligible: rejectionReasons.length === 0, rejectionReasons }
}

export function rankBrollSourceCandidates(
  candidates: readonly BrollSourceCandidate[],
): readonly RankedBrollSourceCandidate[] {
  return candidates.map(scoreBrollSourceCandidate).sort((left, right) =>
    right.score - left.score || left.candidate.sourceId.localeCompare(right.candidate.sourceId),
  )
}
