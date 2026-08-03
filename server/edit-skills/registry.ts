import { EditSkillArtifactSchemaRegistry } from './core/edit-skill-artifact-store'
import { SkillCapabilityRegistry } from './core/skill-capability-registry'
import type { SkillReferenceCatalog } from './core/skill-capability-validator'
import { SkillEstimatorRegistry } from './core/skill-estimator-registry'
import { SkillQaRegistry } from './core/skill-qa-registry'
import { SkillQualificationRegistry } from './core/skill-qualification-registry'
import { registerBrollSkill } from './b-roll'

export const editSkillCapabilityRegistry = new SkillCapabilityRegistry()
export const editSkillEstimatorRegistry = new SkillEstimatorRegistry()
export const editSkillQaRegistry = new SkillQaRegistry()
export const editSkillArtifactSchemaRegistry = new EditSkillArtifactSchemaRegistry()
export const editSkillQualificationRegistry = new SkillQualificationRegistry()

export const editSkillReferenceCatalog: SkillReferenceCatalog = {
  jobTypes: new Set(),
  toolOperations: new Set(),
  providerOperations: new Set(),
  sourceOperations: new Set(),
  noActionOperations: new Set(),
  phases: new Set(),
}

registerBrollSkill({
  capabilities: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  qualifications: editSkillQualificationRegistry,
  catalog: editSkillReferenceCatalog,
})
