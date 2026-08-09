import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import { isFrameRangeContained } from '../core/skill-range-authority'
import type { BrollPlanningContext, BrollSkillAssignment } from './b-roll-contracts'
import {
  brollAssignmentCoreSchema,
  brollPlanningContextCoreSchema,
  brollPlanningContextSchema,
  brollSkillAssignmentSchema,
} from './b-roll-schemas'

export function createBrollAssignment(
  input: Omit<BrollSkillAssignment, 'assignmentHash'>,
): BrollSkillAssignment {
  const core = brollAssignmentCoreSchema.parse(input)
  if (!isFrameRangeContained(core.writeRangeAuthority.authorizedRange, core.masterTimingRange)) {
    throw new Error('B-roll assignment range falls outside master timing.')
  }
  return brollSkillAssignmentSchema.parse({ ...core, assignmentHash: hashSkillValue(core) })
}

export function assertBrollAssignment(input: {
  assignment: BrollSkillAssignment
  manifest: SkillCapabilityManifest
}): BrollSkillAssignment {
  const parsed = brollSkillAssignmentSchema.parse(input.assignment)
  const { assignmentHash, ...core } = parsed
  if (hashSkillValue(core) !== assignmentHash) throw new Error('B-roll assignment hash is stale or forged.')
  if (
    parsed.manifestRef.skillKey !== input.manifest.skillKey ||
    parsed.manifestRef.skillVersion !== input.manifest.skillVersion ||
    parsed.manifestRef.contractVersion !== input.manifest.contractVersion ||
    parsed.manifestRef.manifestHash !== input.manifest.manifestHash
  ) throw new Error('B-roll assignment substituted the capability manifest.')
  if (!isFrameRangeContained(parsed.writeRangeAuthority.authorizedRange, parsed.masterTimingRange)) {
    throw new Error('B-roll assignment range falls outside master timing.')
  }
  for (const ref of parsed.readContextAuthority.contextArtifactRefs) {
    if (
      ref.ownerUserId !== parsed.ownerUserId || ref.workspaceId !== parsed.workspaceId ||
      ref.projectId !== parsed.projectId
    ) throw new Error('B-roll assignment contains a cross-project context artifact.')
  }
  return parsed
}

export function createBrollPlanningContext(
  input: Omit<BrollPlanningContext, 'contextHash'>,
): BrollPlanningContext {
  const core = brollPlanningContextCoreSchema.parse(input)
  return brollPlanningContextSchema.parse({ ...core, contextHash: hashSkillValue(core) })
}

export function assertBrollPlanningContext(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
}): BrollPlanningContext {
  const parsed = brollPlanningContextSchema.parse(input.context)
  const { contextHash, ...core } = parsed
  if (hashSkillValue(core) !== contextHash) throw new Error('B-roll context hash is stale or forged.')
  if (
    parsed.ownerUserId !== input.assignment.ownerUserId ||
    parsed.workspaceId !== input.assignment.workspaceId ||
    parsed.projectId !== input.assignment.projectId ||
    parsed.assignmentId !== input.assignment.assignmentId
  ) throw new Error('B-roll context belongs to a different assignment or tenant.')
  for (const candidate of parsed.sourceCandidates) {
    if (
      candidate.artifactRef.ownerUserId !== parsed.ownerUserId ||
      candidate.artifactRef.workspaceId !== parsed.workspaceId ||
      candidate.artifactRef.projectId !== parsed.projectId
    ) throw new Error('B-roll source candidate contains a cross-workspace artifact.')
  }
  if (parsed.trackGraphRef && (
    parsed.trackGraphRef.artifactType !== 'track_graph_v1' ||
    parsed.trackGraphRef.ownerUserId !== parsed.ownerUserId ||
    parsed.trackGraphRef.workspaceId !== parsed.workspaceId ||
    parsed.trackGraphRef.projectId !== parsed.projectId
  )) throw new Error('B-roll tracking dependency is not an exact model-neutral tenant artifact.')
  return parsed
}
