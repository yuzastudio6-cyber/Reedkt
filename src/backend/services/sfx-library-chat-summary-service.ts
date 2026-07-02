import type {
  SFXLibraryCandidateRecord,
  SFXLibraryDecision,
  SFXProvenanceReviewRecord,
  SFXUsageLearningRecord,
  SFXUsageRecord,
} from '../../types'

export function createSFXProjectOnlyChatSummary(): string {
  return 'This SFX passed project checks and stays project-only for now. ReeditPro will not reuse it across users without separate provenance and privacy review.'
}

export function createSFXLibraryCandidateChatSummary(candidate?: SFXLibraryCandidateRecord): string {
  if (!candidate) return 'This SFX is not ready to become a library candidate.'

  return `This SFX looks reusable for future edits, so I marked it as a mock library candidate with score ${candidate.qualityScore}. It still needs final provenance review before real library reuse.`
}

export function createSFXReuseBlockedChatSummary(): string {
  return 'This generated SFX will not be reused because QA, privacy, client-specific context, or license risk blocks library promotion.'
}

export function createSFXTermsReviewChatSummary(review?: SFXProvenanceReviewRecord): string {
  if (review?.termsReviewRequired) {
    return 'This SFX may be reusable, but provider/license terms need review before it can enter a shared internal library.'
  }

  return 'Terms review is not blocking this mock scenario.'
}

export function createSFXWorkspaceOnlyChatSummary(): string {
  return 'This sound stays workspace-only because it is tied to client, brand, or team-specific context.'
}

export function createSFXLibraryChatSummary(input: {
  libraryDecision: SFXLibraryDecision
  provenanceReview?: SFXProvenanceReviewRecord
  usageRecord?: SFXUsageRecord
  libraryCandidate?: SFXLibraryCandidateRecord
  usageLearning?: SFXUsageLearningRecord
}): string[] {
  const summary: string[] = []

  if (input.libraryDecision === 'project_only') summary.push(createSFXProjectOnlyChatSummary())
  if (input.libraryDecision === 'workspace_only') summary.push(createSFXWorkspaceOnlyChatSummary())
  if (input.libraryDecision === 'candidate_for_library') summary.push(createSFXLibraryCandidateChatSummary(input.libraryCandidate))
  if (input.libraryDecision === 'approved_internal_library') summary.push('This mock scenario approves the SFX as an internal library asset after QA and provenance review.')
  if (input.libraryDecision === 'blocked_from_reuse') summary.push(createSFXReuseBlockedChatSummary())
  if (input.libraryDecision === 'requires_terms_review') summary.push(createSFXTermsReviewChatSummary(input.provenanceReview))

  if (input.usageRecord) {
    summary.push(`Usage was recorded as ${input.usageRecord.usageType}.`)
  }
  if (input.usageLearning) {
    summary.push(input.usageLearning.learningSummary)
  }

  return summary
}
