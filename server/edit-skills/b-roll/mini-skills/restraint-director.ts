import type { BrollPlanningContext, BrollSkillAssignment } from '../b-roll-contracts'

export interface RestraintDecision {
  useNoBroll: boolean
  reason: string
}

export function directBrollRestraint(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
}): RestraintDecision {
  if (input.context.userVisualPreference === 'no_extra_visuals') {
    return { useNoBroll: true, reason: 'The user explicitly requested no extra visuals.' }
  }
  if (input.context.speakerEmotionImportance >= 0.8 && input.context.baseFootageStrength >= 0.6) {
    return { useNoBroll: true, reason: 'The speaker expression is more important than a cutaway.' }
  }
  if (input.context.meaningfulVisualNeed < 0.35 && input.context.baseFootageStrength >= 0.65) {
    return { useNoBroll: true, reason: 'The base footage already communicates the point professionally.' }
  }
  return {
    useNoBroll: false,
    reason: `B-roll can ${input.assignment.pointToProveClarifyCoverOrSupport} with a meaningful visual.`,
  }
}
