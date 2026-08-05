import { hashSkillValue } from '../../core/skill-capability-manifest-hash'
import type { BrollEditorialRole, BrollPlanningContext, BrollSkillAssignment } from '../b-roll-contracts'
import type { BrollSourceStrategy } from './source-strategy-resolver'

export interface BrollConceptDecision {
  conceptKey?: string
  purpose: string
  rejectedAsRepeated: boolean
}

export function directBrollConcept(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  role: BrollEditorialRole
  sourceStrategy: BrollSourceStrategy
}): BrollConceptDecision {
  if (['use_no_broll', 'blocked', 'needs_other_skill', 'needs_user_confirmation'].includes(input.sourceStrategy.decision)) {
    return { purpose: input.sourceStrategy.reason, rejectedAsRepeated: false }
  }
  const conceptKey = `${input.role}:${hashSkillValue({
    point: input.assignment.pointToProveClarifyCoverOrSupport.toLowerCase(),
    role: input.role,
    sourceType: input.sourceStrategy.selected?.candidate.sourceType ?? 'generated',
  }).slice(0, 16)}`
  if (input.context.priorConceptKeys.includes(conceptKey)) {
    return { conceptKey, purpose: 'The concept repeats an earlier B-roll treatment.', rejectedAsRepeated: true }
  }
  return {
    conceptKey,
    purpose: `Use ${input.role.replaceAll('_', ' ')} to ${input.assignment.pointToProveClarifyCoverOrSupport}.`,
    rejectedAsRepeated: false,
  }
}
