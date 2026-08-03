import {
  EditSkillArtifactSchemaRegistry,
  InMemoryCreateOnlyEditSkillArtifactStore,
} from './core/edit-skill-artifact-store'
import { SkillCapabilityRegistry } from './core/skill-capability-registry'
import { EditSkillPluginRegistry } from './core/edit-skill-plugin-registry'
import type { SkillReferenceCatalog } from './core/skill-capability-validator'
import { SkillEstimatorRegistry } from './core/skill-estimator-registry'
import { SkillQaRegistry } from './core/skill-qa-registry'
import { SkillQualificationRegistry } from './core/skill-qualification-registry'
import { registerBrollSkill } from './b-roll'

export const editSkillCapabilityRegistry = new SkillCapabilityRegistry()
export const editSkillPluginRegistry = new EditSkillPluginRegistry()
export const editSkillEstimatorRegistry = new SkillEstimatorRegistry()
export const editSkillQaRegistry = new SkillQaRegistry()
export const editSkillArtifactSchemaRegistry = new EditSkillArtifactSchemaRegistry()
export const editSkillQualificationRegistry = new SkillQualificationRegistry()
export const editSkillArtifactStore = new InMemoryCreateOnlyEditSkillArtifactStore(
  editSkillArtifactSchemaRegistry,
)

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
  artifactStore: editSkillArtifactStore,
  plugins: editSkillPluginRegistry,
  qualifications: editSkillQualificationRegistry,
  catalog: editSkillReferenceCatalog,
})

editSkillPluginRegistry.assertManifestBindings(editSkillCapabilityRegistry.listManifests())
