import {
  privateReviewMatchesCurrentSourceSet,
  type LocalInternalProjectHandoff,
} from '../local-project-handoff'

export interface StorytellingReviewContext {
  stage: LocalInternalProjectHandoff['stage']
  approvedPlanAttached: boolean
  review: {
    exists: boolean
    sourceMatchesCurrentEdit: boolean
    manifestVerified: boolean
    playable: boolean
    decision?: 'accepted_for_internal_testing' | 'changes_requested'
    note?: string
  }
}

/**
 * Browser-safe projection of the exact named-edit review authority.
 * IDs, paths, hashes, provider details, costs, and mutation handlers stay in Chat.
 */
export function createStorytellingReviewContext(
  handoff: LocalInternalProjectHandoff | undefined,
): StorytellingReviewContext {
  const review = handoff?.privateReview
  return {
    stage: handoff?.stage ?? 'created',
    approvedPlanAttached: Boolean(handoff?.approvedSnapshotId),
    review: {
      exists: Boolean(review),
      sourceMatchesCurrentEdit: Boolean(review && privateReviewMatchesCurrentSourceSet(handoff)),
      manifestVerified: review?.manifestVerified === true,
      playable: review?.reviewVideoMetadata?.playable === true,
      ...(review?.reviewDecision ? { decision: review.reviewDecision } : {}),
      ...(review?.reviewNote ? { note: review.reviewNote } : {}),
    },
  }
}
