import {
  EditSkillArtifactSchemaRegistry,
  InMemoryCreateOnlyEditSkillArtifactStore,
} from './core/edit-skill-artifact-store'
import { SkillCapabilityRegistry } from './core/skill-capability-registry'
import { EditSkillPluginRegistry } from './core/edit-skill-plugin-registry'
import {
  SkillJobRuntimeBindingRegistry,
  type SkillWorkGraphJobDefinition,
} from './core/edit-skill-runtime-binding'
import type { SkillReferenceCatalog } from './core/skill-capability-validator'
import { SkillEstimatorRegistry } from './core/skill-estimator-registry'
import { SkillQaRegistry } from './core/skill-qa-registry'
import { SkillQualificationRegistry } from './core/skill-qualification-registry'
import { registerBrollSkill } from './b-roll'

export const editSkillCapabilityRegistry = new SkillCapabilityRegistry()
export const editSkillPluginRegistry = new EditSkillPluginRegistry()
export const editSkillRuntimeBindingRegistry = new SkillJobRuntimeBindingRegistry()
export const editSkillWorkGraphJobDefinitions: SkillWorkGraphJobDefinition[] = []
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
  providerOperationQualifications: new Map(),
  phases: new Set(),
}

registerBrollSkill({
  capabilities: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  artifactStore: editSkillArtifactStore,
  plugins: editSkillPluginRegistry,
  runtimeBindings: editSkillRuntimeBindingRegistry,
  workGraphJobs: editSkillWorkGraphJobDefinitions,
  qualifications: editSkillQualificationRegistry,
  catalog: editSkillReferenceCatalog,
})

editSkillPluginRegistry.assertManifestBindings(editSkillCapabilityRegistry.listManifests())
