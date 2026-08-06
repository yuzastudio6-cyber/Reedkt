import type { SkillCapabilityManifest } from '../../core/skill-capability-manifest-types'
import { assertBrollAssignment } from '../b-roll-context-loader'
import type { BrollSkillAssignment } from '../b-roll-contracts'

export interface AssignmentGuardResult {
  assignment: BrollSkillAssignment
  outsideAuthorizedRangeModified: false
}

export function runAssignmentGuard(input: {
  assignment: BrollSkillAssignment
  manifest: SkillCapabilityManifest
}): AssignmentGuardResult {
  return {
    assignment: assertBrollAssignment(input),
    outsideAuthorizedRangeModified: false,
  }
}
