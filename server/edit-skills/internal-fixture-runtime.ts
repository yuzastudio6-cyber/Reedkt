import {
  BROLL_PROVIDER_OPERATIONS,
  BROLL_TOOL_OPERATIONS,
} from './b-roll/b-roll-capability-manifest'
import { InMemoryCreateOnlyEditSkillArtifactStore } from './core/edit-skill-artifact-store'
import type { EditSkillRuntime } from './core/edit-skill-runtime'
import { StandaloneCanonicalSoundSkillService } from './sound'
import { registerSoundSkill } from './sound/sound-shared-kernel-registration'
import {
  createEditSkillRuntime,
  createEditSkillRuntimeRegistries,
} from './registry'

export function createInternalFixtureEditSkillRuntime(): EditSkillRuntime {
  const registries = createEditSkillRuntimeRegistries()
  const runtime = createEditSkillRuntime({
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
  registerSoundSkill({
    capabilities: runtime.capabilityRegistry,
    estimators: runtime.estimatorRegistry,
    qa: runtime.qaRegistry,
    artifacts: runtime.artifactSchemaRegistry,
    artifactStore: runtime.artifactStore,
    qualifications: runtime.qualificationRegistry,
    catalog: runtime.referenceCatalog,
    service: standaloneSoundSkillService,
  })
  return runtime
}

export const standaloneSoundSkillService = new StandaloneCanonicalSoundSkillService({
  artifacts: {
    async resolve() {
      throw new Error('Sound media execution requires the private server artifact resolver; shared planning does not expose paths.')
    },
    async privateOutputRoot() {
      throw new Error('Sound media execution requires the private server artifact resolver; shared planning does not expose paths.')
    },
  },
})

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
