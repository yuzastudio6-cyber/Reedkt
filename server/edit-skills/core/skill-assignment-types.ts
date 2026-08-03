import type { EditSkillArtifactReference } from './edit-skill-artifact-store'
import type { EditSkillKey } from './edit-skill-ids'
import type { SkillManifestReference } from './skill-capability-manifest-types'

export interface SkillFrameRange {
  startFrameInclusive: number
  endFrameExclusive: number
  fps: number
}

export interface SkillAssignment {
  schemaVersion: 'edit-skill-assignment-v1'
  assignmentId: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planningRequestId: string
  manifestRef: SkillManifestReference
  authorizedRange: SkillFrameRange
  reason: string
  intendedViewerBenefit: string
  editorialContext: string
  visualOwnership: 'primary' | 'support' | 'coordination_only'
  contextArtifactRefs: readonly EditSkillArtifactReference[]
  dependencyArtifactRefs: readonly EditSkillArtifactReference[]
  requestedBySkill: EditSkillKey | 'orchestra'
  assignmentHash: string
}

