import { assertBrollPlanningContext } from '../b-roll-context-loader'
import type { BrollPlanningContext, BrollSkillAssignment } from '../b-roll-contracts'

export interface ContextReaderResult {
  context: BrollPlanningContext
  wholeVideoContextReadOnly: true
  writeAuthorityExpanded: false
}

export function runContextReader(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
}): ContextReaderResult {
  return {
    context: assertBrollPlanningContext(input),
    wholeVideoContextReadOnly: true,
    writeAuthorityExpanded: false,
  }
}
