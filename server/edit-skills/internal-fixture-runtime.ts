import {
  BROLL_PROVIDER_OPERATIONS,
  BROLL_TOOL_OPERATIONS,
} from './b-roll/b-roll-capability-manifest'
import { InMemoryCreateOnlyEditSkillArtifactStore } from './core/edit-skill-artifact-store'
import type { EditSkillRuntime } from './core/edit-skill-runtime'
import {
  createEditSkillRuntime,
  createEditSkillRuntimeRegistries,
} from './registry'

export function createInternalFixtureEditSkillRuntime(): EditSkillRuntime {
  const registries = createEditSkillRuntimeRegistries()
  return createEditSkillRuntime({
    environmentClass: 'internal_fixture',
    artifactStore: new InMemoryCreateOnlyEditSkillArtifactStore(
      registries.artifactSchemaRegistry,
    ),
    providerAuthority: {
      operations: new Map(BROLL_PROVIDER_OPERATIONS.map((operationId) => [
        operationId,
        'internal_execution_qualified' as const,
      ])),
    },
    toolRegistry: { operationIds: new Set(BROLL_TOOL_OPERATIONS) },
    ...registries,
  })
}

export const internalFixtureEditSkillRuntime =
  createInternalFixtureEditSkillRuntime()

export const editSkillArtifactStore = internalFixtureEditSkillRuntime.artifactStore
export const editSkillCapabilityRegistry = internalFixtureEditSkillRuntime.capabilityRegistry
export const editSkillPluginRegistry = internalFixtureEditSkillRuntime.pluginRegistry
export const editSkillRuntimeBindingRegistry = internalFixtureEditSkillRuntime.runtimeBindingRegistry
export const editSkillRuntimeDispatcher = internalFixtureEditSkillRuntime.runtimeDispatcher
export const editSkillWorkGraphJobDefinitions = internalFixtureEditSkillRuntime.workGraphJobDefinitions
export const editSkillEstimatorRegistry = internalFixtureEditSkillRuntime.estimatorRegistry
export const editSkillQaRegistry = internalFixtureEditSkillRuntime.qaRegistry
export const editSkillArtifactSchemaRegistry = internalFixtureEditSkillRuntime.artifactSchemaRegistry
export const editSkillQualificationRegistry = internalFixtureEditSkillRuntime.qualificationRegistry
export const editSkillReferenceCatalog = internalFixtureEditSkillRuntime.referenceCatalog
