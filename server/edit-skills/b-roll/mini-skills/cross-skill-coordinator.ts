import type { BrollCoordinationPlan, BrollPlanningContext, BrollSkillAssignment } from '../b-roll-contracts'

export function coordinateBrollSkills(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  audioReviewNeeded: boolean
}): BrollCoordinationPlan {
  return {
    visualOwnership: input.assignment.requestedVisualOwnership,
    captionHandoffRequired: input.context.captionReservedZoneCount > 0,
    soundHandoffRequired: input.audioReviewNeeded,
    colorHandoffRequired: true,
    transitionHandoffRequired: true,
    renderHandoffRequired: true,
    trackingDependency: input.context.trackingRequired
      ? input.context.trackGraphRef ? 'satisfied' : 'needs_other_skill'
      : 'not_required',
    ...(input.context.trackGraphRef ? { trackGraphRef: input.context.trackGraphRef } : {}),
    finalOwners: ['captions', 'sound', 'color', 'transition', 'track_all', 'render'],
  }
}
