import type {
  MotionStudioAudioReviewRole,
  MotionStudioAudioReviewRoleSummaryDto,
  MotionStudioAudioReviewSummaryDto,
} from '../../types/motion-studio/audio-review'

export interface MotionStudioAudioReviewPresentation {
  status: string
  title: string
  body: string
  tone: 'neutral' | 'attention' | 'success'
  action: 'return_to_chat' | 'refresh'
}

export function createMotionStudioAudioReviewPresentation(
  review: MotionStudioAudioReviewSummaryDto,
): MotionStudioAudioReviewPresentation {
  if (review.state === 'ready_for_review') return {
    status: 'Ready for review',
    title: 'Review the completed Storytelling mix',
    body: 'Listen to the exact private mix, then continue in Chat to approve it or request a change.',
    tone: 'neutral',
    action: 'return_to_chat',
  }
  if (review.state === 'changes_requested') return {
    status: 'Changes requested',
    title: 'This audio version needs a revision',
    body: 'The review is preserved. Continue in Chat to revise the affected audio decision without changing approved history.',
    tone: 'attention',
    action: 'return_to_chat',
  }
  if (review.state === 'rejected') return {
    status: 'Not approved',
    title: 'This audio version will not move forward',
    body: 'The rejected version remains private and traceable. Continue in Chat to choose a different direction.',
    tone: 'attention',
    action: 'return_to_chat',
  }
  if (review.state === 'approved_locked') return {
    status: 'Approved and locked',
    title: 'Audio review is complete',
    body: 'This exact private mix is eligible for the later Fine Cut handoff. It has not been added to a timeline, rendered, exported, or published.',
    tone: 'success',
    action: 'refresh',
  }
  return {
    status: 'Needs an update',
    title: staleReviewTitle(review.recoveryAction),
    body: staleReviewBody(review.recoveryAction),
    tone: 'attention',
    action: 'return_to_chat',
  }
}

export function motionStudioAudioRoleLabel(role: MotionStudioAudioReviewRole): string {
  if (role === 'music') return 'Music'
  if (role === 'foley') return 'Foley'
  if (role === 'ambience') return 'Ambience'
  return 'Sound effects'
}

export function motionStudioAudioRoleDecisionLabel(
  summary: MotionStudioAudioReviewRoleSummaryDto,
): string {
  if (summary.decision === 'included') {
    return summary.selectedItemCount === 1 ? '1 selection' : `${summary.selectedItemCount} selections`
  }
  if (summary.decision === 'not_needed') return 'Not needed'
  return 'Not included'
}

function staleReviewTitle(
  recoveryAction: MotionStudioAudioReviewSummaryDto['recoveryAction'],
): string {
  if (recoveryAction === 'replanning_required') return 'The story plan changed after this mix'
  if (recoveryAction === 'reselection_required') return 'An audio selection changed after this mix'
  if (recoveryAction === 'remix_required') return 'The selected audio needs a new mix'
  return 'This mix needs another review'
}

function staleReviewBody(
  recoveryAction: MotionStudioAudioReviewSummaryDto['recoveryAction'],
): string {
  if (recoveryAction === 'replanning_required') {
    return 'Return to Chat to update the plan. The previous review stays locked and cannot be silently reused.'
  }
  if (recoveryAction === 'reselection_required') {
    return 'Return to Chat to confirm the affected narration or sound choice before preparing another mix.'
  }
  if (recoveryAction === 'remix_required') {
    return 'The selected inputs remain traceable, but this output is no longer current. Continue in Chat to prepare a new version.'
  }
  return 'The private mix is preserved, but it cannot move forward until the updated version is reviewed.'
}
