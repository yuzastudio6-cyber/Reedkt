import { hashSkillValue } from './skill-capability-manifest-hash'
import { skillAssignmentCoreSchema, skillAssignmentSchema, type SkillAssignmentInput } from './skill-assignment-schema'
import type { SkillAssignment, SkillFrameRange } from './skill-assignment-types'

export function createSkillAssignment(input: SkillAssignmentInput): SkillAssignment {
  const core = skillAssignmentCoreSchema.parse(input)
  return skillAssignmentSchema.parse({ ...core, assignmentHash: hashSkillValue(core) })
}

export function assertSkillAssignment(assignment: SkillAssignment): SkillAssignment {
  const parsed = skillAssignmentSchema.parse(assignment)
  const { assignmentHash, ...core } = parsed
  if (hashSkillValue(core) !== assignmentHash) throw new Error('Skill assignment hash is stale or forged.')
  return parsed
}

export function isFrameRangeContained(
  candidate: SkillFrameRange,
  authority: SkillFrameRange,
): boolean {
  return candidate.fps === authority.fps &&
    candidate.startFrameInclusive >= authority.startFrameInclusive &&
    candidate.endFrameExclusive <= authority.endFrameExclusive
}

export function assertSkillRangeMutation(input: {
  assignment: SkillAssignment
  mutationRange: SkillFrameRange
}): void {
  const assignment = assertSkillAssignment(input.assignment)
  if (!isFrameRangeContained(input.mutationRange, assignment.authorizedRange)) {
    throw new Error('Skill mutation falls outside the orchestra-authorized range.')
  }
}

export function assertSkillAssignmentFresh(input: {
  assignment: SkillAssignment
  expectedRange: SkillFrameRange
}): void {
  const assignment = assertSkillAssignment(input.assignment)
  if (hashSkillValue(assignment.authorizedRange) !== hashSkillValue(input.expectedRange)) {
    throw new Error('Skill assignment range is stale.')
  }
}
